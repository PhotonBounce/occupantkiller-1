window.AcidPlant = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var plantObjects = [];
  var animatingBubbles = [];
  var ventParticles = [];

  var colors = {
    acidGreen: 0x7FFF00,
    neonGreen: 0x00FF00,
    sicklyGreen: 0x66CC00,
    toxicYellow: 0xFFFF00,
    hazardYellow: 0xFFCC00,
    corrodeGray: 0x444444,
    darkGray: 0x333333,
    brightGreen: 0x00FF80,
    glowGreen: 0x77FF77
  };

  function createGlowMaterial(color, intensity) {
    var material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: intensity || 0.5,
      metalness: 0.7,
      roughness: 0.3
    });
    return material;
  }

  function createMetalMaterial(color) {
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.8,
      roughness: 0.2
    });
    return material;
  }

  function addObjectToScene(object) {
    scene.add(object);
    plantObjects.push(object);
    return object;
  }

  function createAcidStorageTanks() {
    var positions = [
      { x: -30, y: 10, z: -30 },
      { x: 30, y: 10, z: -30 },
      { x: -30, y: 10, z: 30 },
      { x: 30, y: 10, z: 30 }
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(8, 8, 20, 16);
      var material = createGlowMaterial(colors.sicklyGreen, 0.6);
      var tank = new THREE.Mesh(geometry, material);
      tank.position.set(pos.x, pos.y, pos.z);
      tank.castShadow = true;
      tank.receiveShadow = true;
      addObjectToScene(tank);

      // Tank cap
      var capGeometry = new THREE.CylinderGeometry(8.2, 8, 1, 16);
      var capMaterial = createMetalMaterial(colors.corrodeGray);
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.set(pos.x, pos.y + 10.5, pos.z);
      cap.castShadow = true;
      addObjectToScene(cap);

      // Valve on tank
      var valveGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
      var valveMaterial = createMetalMaterial(colors.darkGray);
      var valve = new THREE.Mesh(valveGeometry, valveMaterial);
      valve.position.set(pos.x + 7, pos.y + 2, pos.z);
      valve.rotation.z = Math.PI / 2;
      valve.castShadow = true;
      addObjectToScene(valve);
    });
  }

  function createAcidMoats() {
    var moatPositions = [
      { x: 0, z: -40 },
      { x: 0, z: 40 },
      { x: -40, z: 0 },
      { x: 40, z: 0 }
    ];

    moatPositions.forEach(function(pos) {
      // Moat channel
      var geometry = new THREE.BoxGeometry(60, 2, 8);
      var material = createGlowMaterial(colors.acidGreen, 0.7);
      var moat = new THREE.Mesh(geometry, material);
      moat.position.set(pos.x, 0.5, pos.z);
      moat.castShadow = true;
      moat.receiveShadow = true;
      addObjectToScene(moat);

      // Acid splash effect - multiple small pools along moat
      for (var i = 0; i < 8; i++) {
        var offsetX = (i - 3.5) * 8;
        var splashGeometry = new THREE.BoxGeometry(6, 0.3, 4);
        var splashMaterial = createGlowMaterial(colors.neonGreen, 0.8);
        var splash = new THREE.Mesh(splashGeometry, splashMaterial);
        if (pos.x === 0) {
          splash.position.set(pos.x + offsetX, 1.2, pos.z);
        } else {
          splash.position.set(pos.x, 1.2, pos.z + offsetX);
        }
        splash.castShadow = true;
        addObjectToScene(splash);
      }
    });
  }

  function createCatwalks() {
    var walkwayPositions = [
      { x: -15, z: -15, length: 30 },
      { x: 15, z: -15, length: 30 },
      { x: -15, z: 15, length: 30 },
      { x: 15, z: 15, length: 30 },
      { x: 0, z: 0, length: 35, angle: Math.PI / 4 }
    ];

    walkwayPositions.forEach(function(pos) {
      // Main walkway platform
      var geometry = new THREE.BoxGeometry(3, 0.5, pos.length);
      var material = createMetalMaterial(colors.corrodeGray);
      var walkway = new THREE.Mesh(geometry, material);
      walkway.position.set(pos.x, 5, pos.z);
      if (pos.angle) {
        walkway.rotation.y = pos.angle;
      }
      walkway.castShadow = true;
      walkway.receiveShadow = true;
      addObjectToScene(walkway);

      // Railings with LineSegments
      var raiilGeometry = new THREE.BoxGeometry(0.2, 1.2, pos.length);
      var raiilMaterial = createMetalMaterial(colors.darkGray);
      var raiilLeft = new THREE.Mesh(raiilGeometry, raiilMaterial);
      raiilLeft.position.set(pos.x - 1.5, 5.6, pos.z);
      if (pos.angle) {
        raiilLeft.rotation.y = pos.angle;
      }
      raiilLeft.castShadow = true;
      addObjectToScene(raiilLeft);

      var raiilRight = new THREE.Mesh(raiilGeometry, raiilMaterial);
      raiilRight.position.set(pos.x + 1.5, 5.6, pos.z);
      if (pos.angle) {
        raiilRight.rotation.y = pos.angle;
      }
      raiilRight.castShadow = true;
      addObjectToScene(raiilRight);

      // Support beams
      var beamGeometry = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
      var beamMaterial = createMetalMaterial(colors.corrodeGray);
      var beamCount = Math.floor(pos.length / 6);
      for (var i = 0; i < beamCount; i++) {
        var beamOffset = (i - beamCount / 2) * 6;
        var beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(pos.x, 2.5, pos.z + (pos.angle ? 0 : beamOffset));
        beam.castShadow = true;
        addObjectToScene(beam);
      }
    });
  }

  function createProcessingTowers() {
    var towers = [
      { x: -20, z: 0 },
      { x: 20, z: 0 },
      { x: 0, z: -20 },
      { x: 0, z: 20 }
    ];

    towers.forEach(function(pos) {
      // Tower sections - stacked cylinders
      var sectionHeights = [6, 7, 6, 5];
      var startY = 0;

      sectionHeights.forEach(function(height, index) {
        var radius = 4 - (index * 0.5);
        var geometry = new THREE.CylinderGeometry(radius, radius, height, 12);
        var colors_idx = index % 2;
        var material = createGlowMaterial(
          colors_idx === 0 ? colors.sicklyGreen : colors.acidGreen,
          0.5
        );
        var section = new THREE.Mesh(geometry, material);
        section.position.set(pos.x, startY + height / 2, pos.z);
        section.castShadow = true;
        section.receiveShadow = true;
        addObjectToScene(section);

        startY += height;
      });

      // Pipe running down tower
      var pipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 25, 8);
      var pipeMaterial = createMetalMaterial(colors.hazardYellow);
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.position.set(pos.x + 3, 12, pos.z);
      pipe.castShadow = true;
      addObjectToScene(pipe);

      // Pipe joints
      for (var i = 0; i < 4; i++) {
        var jointGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.8, 12);
        var jointMaterial = createMetalMaterial(colors.darkGray);
        var joint = new THREE.Mesh(jointGeometry, jointMaterial);
        joint.position.set(pos.x + 3, 5 + i * 5, pos.z);
        joint.castShadow = true;
        addObjectToScene(joint);
      }
    });
  }

  function createValveStations() {
    var stations = [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 },
      { x: 0, z: 0 }
    ];

    stations.forEach(function(pos) {
      // Main manifold block
      var manifoldGeometry = new THREE.BoxGeometry(6, 4, 3);
      var manifoldMaterial = createMetalMaterial(colors.corrodeGray);
      var manifold = new THREE.Mesh(manifoldGeometry, manifoldMaterial);
      manifold.position.set(pos.x, 3, pos.z);
      manifold.castShadow = true;
      manifold.receiveShadow = true;
      addObjectToScene(manifold);

      // Valves
      for (var i = 0; i < 4; i++) {
        var valveGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 12);
        var valveMaterial = createMetalMaterial(colors.hazardYellow);
        var valve = new THREE.Mesh(valveGeometry, valveMaterial);
        valve.position.set(pos.x - 1.5 + i * 1.2, 4.5, pos.z);
        valve.castShadow = true;
        addObjectToScene(valve);

        // Valve handle
        var handleGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        var handleMaterial = createMetalMaterial(colors.darkGray);
        var handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(pos.x - 1.5 + i * 1.2, 5.8, pos.z);
        handle.castShadow = true;
        addObjectToScene(handle);
      }

      // Connector pipes
      for (var j = 0; j < 3; j++) {
        var connectorGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
        var connectorMaterial = createMetalMaterial(colors.hazardYellow);
        var connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
        connector.position.set(pos.x - 2 + j * 2, 1.5, pos.z);
        connector.rotation.z = Math.PI / 2;
        connector.castShadow = true;
        addObjectToScene(connector);
      }
    });
  }

  function createAcidSpillPools() {
    var poolPositions = [
      { x: -35, z: -35, scale: 1.5 },
      { x: 35, z: -35, scale: 1.2 },
      { x: -35, z: 35, scale: 1.4 },
      { x: 35, z: 35, scale: 1.3 },
      { x: 0, z: -30, scale: 1.1 },
      { x: 0, z: 30, scale: 1.0 },
      { x: -25, z: 0, scale: 0.9 },
      { x: 25, z: 0, scale: 1.1 }
    ];

    poolPositions.forEach(function(pos) {
      var size = 6 * pos.scale;
      var geometry = new THREE.BoxGeometry(size, 0.4, size);
      var material = createGlowMaterial(colors.neonGreen, 0.9);
      var pool = new THREE.Mesh(geometry, material);
      pool.position.set(pos.x, 0.2, pos.z);
      pool.castShadow = true;
      pool.receiveShadow = true;
      addObjectToScene(pool);

      // Hazard stripes on edges
      var edgeGeometry = new THREE.BoxGeometry(size + 1, 0.1, 0.5);
      var edgeMaterial = createMetalMaterial(colors.hazardYellow);
      var edgeFront = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edgeFront.position.set(pos.x, 0.6, pos.z - size / 2);
      addObjectToScene(edgeFront);

      var edgeBack = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edgeBack.position.set(pos.x, 0.6, pos.z + size / 2);
      addObjectToScene(edgeBack);
    });
  }

  function createSafetyShowers() {
    var showerPositions = [
      { x: -25, z: -25 },
      { x: 25, z: -25 },
      { x: -25, z: 25 },
      { x: 25, z: 25 }
    ];

    showerPositions.forEach(function(pos) {
      // Post
      var postGeometry = new THREE.BoxGeometry(0.8, 4, 0.8);
      var postMaterial = createMetalMaterial(colors.corrodeGray);
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(pos.x, 2, pos.z);
      post.castShadow = true;
      post.receiveShadow = true;
      addObjectToScene(post);

      // Shower head
      var headGeometry = new THREE.CylinderGeometry(1.5, 1.2, 0.5, 16);
      var headMaterial = createMetalMaterial(colors.hazardYellow);
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(pos.x, 4.2, pos.z);
      head.castShadow = true;
      addObjectToScene(head);

      // Shower arm
      var armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
      var armMaterial = createMetalMaterial(colors.corrodeGray);
      var arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(pos.x + 1.5, 4, pos.z);
      arm.rotation.z = Math.PI / 3;
      arm.castShadow = true;
      addObjectToScene(arm);
    });
  }

  function createControlRoom() {
    // Main bunker structure
    var bunkerGeometry = new THREE.BoxGeometry(12, 6, 10);
    var bunkerMaterial = createMetalMaterial(colors.darkGray);
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.set(0, 3, -20);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    addObjectToScene(bunker);

    // Control panels
    for (var i = 0; i < 3; i++) {
      var panelGeometry = new THREE.BoxGeometry(3, 3, 0.3);
      var panelMaterial = createGlowMaterial(colors.sicklyGreen, 0.4);
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(-3 + i * 3, 4, -24);
      panel.castShadow = true;
      addObjectToScene(panel);

      // Panel indicators (small boxes)
      for (var j = 0; j < 6; j++) {
        var indicatorGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
        var indicatorColor = j % 2 === 0 ? colors.neonGreen : colors.hazardYellow;
        var indicatorMaterial = createGlowMaterial(indicatorColor, 0.6);
        var indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(
          -3 + i * 3 - 1 + (j % 3) * 0.6,
          3.5 + Math.floor(j / 3) * 0.6,
          -23.8
        );
        addObjectToScene(indicator);
      }
    }

    // Equipment storage
    for (var k = 0; k < 4; k++) {
      var equipGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var equipMaterial = createMetalMaterial(colors.hazardYellow);
      var equipment = new THREE.Mesh(equipGeometry, equipMaterial);
      equipment.position.set(-4 + k * 3, 0.8, -18);
      equipment.castShadow = true;
      addObjectToScene(equipment);
    }
  }

  function createCorrodedWalls() {
    var wallPositions = [
      { x: -40, z: 0, width: 80, depth: 2 },
      { x: 40, z: 0, width: 80, depth: 2 },
      { x: 0, z: -40, width: 2, depth: 80 },
      { x: 0, z: 40, width: 2, depth: 80 }
    ];

    wallPositions.forEach(function(pos) {
      // Main wall
      var wallGeometry = new THREE.BoxGeometry(pos.width, 12, pos.depth);
      var wallMaterial = createMetalMaterial(colors.corrodeGray);
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos.x, 6, pos.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      addObjectToScene(wall);

      // Corrosion patches
      var patchCount = Math.floor(pos.width / 6);
      for (var i = 0; i < patchCount; i++) {
        var patchGeometry = new THREE.BoxGeometry(4, 3, 0.3);
        var patchMaterial = createGlowMaterial(colors.sicklyGreen, 0.3);
        var patch = new THREE.Mesh(patchGeometry, patchMaterial);
        var offsetX = pos.x === 0 ? 0 : (i - patchCount / 2) * 6;
        var offsetZ = pos.z === 0 ? (i - patchCount / 2) * 6 : 0;
        patch.position.set(
          pos.x + offsetX,
          4 + i % 3 * 2,
          pos.z + offsetZ
        );
        patch.castShadow = true;
        addObjectToScene(patch);
      }
    });
  }

  function createExhaustVents() {
    var ventPositions = [
      { x: -30, z: 30 },
      { x: 30, z: 30 },
      { x: -30, z: -30 },
      { x: 30, z: -30 },
      { x: 0, z: 0 }
    ];

    ventPositions.forEach(function(pos) {
      // Main chimney
      var chimneyGeometry = new THREE.CylinderGeometry(2, 2.5, 15, 12);
      var chimneyMaterial = createMetalMaterial(colors.corrodeGray);
      var chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
      chimney.position.set(pos.x, 10, pos.z);
      chimney.castShadow = true;
      chimney.receiveShadow = true;
      addObjectToScene(chimney);

      // Vent grate
      var grateGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 12);
      var grateMaterial = createMetalMaterial(colors.darkGray);
      var grate = new THREE.Mesh(grateGeometry, grateMaterial);
      grate.position.set(pos.x, 17.5, pos.z);
      grate.castShadow = true;
      addObjectToScene(grate);

      // Vent particle emitter marker (invisible)
      ventParticles.push({
        x: pos.x,
        y: 18,
        z: pos.z,
        age: 0
      });
    });
  }

  function createPressureGauges() {
    var gaugePositions = [
      { x: -15, z: -20 },
      { x: 15, z: -20 },
      { x: -15, z: 20 },
      { x: 15, z: 20 },
      { x: -20, z: 0 },
      { x: 20, z: 0 }
    ];

    gaugePositions.forEach(function(pos) {
      // Gauge body
      var bodyGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16);
      var bodyMaterial = createMetalMaterial(colors.hazardYellow);
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, 5, pos.z);
      body.rotation.x = Math.PI / 2;
      body.castShadow = true;
      addObjectToScene(body);

      // Gauge dial
      var dialGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 16);
      var dialMaterial = createGlowMaterial(colors.neonGreen, 0.5);
      var dial = new THREE.Mesh(dialGeometry, dialMaterial);
      dial.position.set(pos.x, 5, pos.z + 0.5);
      dial.rotation.x = Math.PI / 2;
      dial.castShadow = true;
      addObjectToScene(dial);

      // Gauge pipe mount
      var mountGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
      var mountMaterial = createMetalMaterial(colors.corrodeGray);
      var mount = new THREE.Mesh(mountGeometry, mountMaterial);
      mount.position.set(pos.x, 4, pos.z);
      mount.rotation.z = Math.PI / 3;
      mount.castShadow = true;
      addObjectToScene(mount);
    });
  }

  function createToxicWasteDrums() {
    var drumPositions = [
      { x: -35, z: 0 },
      { x: 35, z: 0 },
      { x: 0, z: -35 },
      { x: 0, z: 35 },
      { x: -25, z: -25 },
      { x: 25, z: -25 },
      { x: -25, z: 25 },
      { x: 25, z: 25 }
    ];

    drumPositions.forEach(function(pos) {
      // Barrel
      var barrelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 12);
      var barrelMaterial = createGlowMaterial(colors.hazardYellow, 0.3);
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(pos.x, 1.8, pos.z);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      addObjectToScene(barrel);

      // Barrel bands
      for (var i = 0; i < 3; i++) {
        var bandGeometry = new THREE.CylinderGeometry(1.6, 1.6, 0.3, 12);
        var bandMaterial = createMetalMaterial(colors.darkGray);
        var band = new THREE.Mesh(bandGeometry, bandMaterial);
        band.position.set(pos.x, 0.5 + i * 1.2, pos.z);
        band.castShadow = true;
        addObjectToScene(band);
      }

      // Skull hazard mark - 4 skull patches
      for (var j = 0; j < 4; j++) {
        var skullGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.2);
        var skullMaterial = createGlowMaterial(colors.neonGreen, 0.4);
        var skull = new THREE.Mesh(skullGeometry, skullMaterial);
        var angle = (j / 4) * Math.PI * 2;
        skull.position.set(
          pos.x + Math.cos(angle) * 1.4,
          1.5 + (j % 2 - 0.5) * 0.6,
          pos.z + Math.sin(angle) * 1.4
        );
        skull.castShadow = true;
        addObjectToScene(skull);
      }

      // Barrel cap
      var capGeometry = new THREE.CylinderGeometry(1.6, 1.5, 0.5, 12);
      var capMaterial = createMetalMaterial(colors.corrodeGray);
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.set(pos.x, 3.5, pos.z);
      cap.castShadow = true;
      addObjectToScene(cap);
    });
  }

  function createFloorAndBoundary() {
    // Ground floor
    var floorGeometry = new THREE.BoxGeometry(85, 0.5, 85);
    var floorMaterial = createMetalMaterial(colors.darkGray);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, -0.25, 0);
    floor.receiveShadow = true;
    addObjectToScene(floor);

    // Containment wall (low perimeter)
    var perimeterGeometry = new THREE.BoxGeometry(85, 2, 2);
    var perimeterMaterial = createMetalMaterial(colors.corrodeGray);

    var perimeterFront = new THREE.Mesh(perimeterGeometry, perimeterMaterial);
    perimeterFront.position.set(0, 1, -41.5);
    perimeterFront.castShadow = true;
    addObjectToScene(perimeterFront);

    var perimeterBack = new THREE.Mesh(perimeterGeometry, perimeterMaterial);
    perimeterBack.position.set(0, 1, 41.5);
    perimeterBack.castShadow = true;
    addObjectToScene(perimeterBack);

    var perimeterSideGeometry = new THREE.BoxGeometry(2, 2, 85);
    var perimeterLeft = new THREE.Mesh(perimeterSideGeometry, perimeterMaterial);
    perimeterLeft.position.set(-41.5, 1, 0);
    perimeterLeft.castShadow = true;
    addObjectToScene(perimeterLeft);

    var perimeterRight = new THREE.Mesh(perimeterSideGeometry, perimeterMaterial);
    perimeterRight.position.set(41.5, 1, 0);
    perimeterRight.castShadow = true;
    addObjectToScene(perimeterRight);
  }

  function createAdditionalStructures() {
    // Industrial grating platforms
    for (var i = 0; i < 6; i++) {
      var platformGeometry = new THREE.BoxGeometry(8, 0.3, 8);
      var platformMaterial = createMetalMaterial(colors.corrodeGray);
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      var angle = (i / 6) * Math.PI * 2;
      var radius = 20;
      platform.position.set(
        Math.cos(angle) * radius,
        2.5,
        Math.sin(angle) * radius
      );
      platform.castShadow = true;
      platform.receiveShadow = true;
      addObjectToScene(platform);
    }

    // Support columns
    for (var j = 0; j < 8; j++) {
      var columnGeometry = new THREE.CylinderGeometry(0.6, 0.8, 6, 8);
      var columnMaterial = createMetalMaterial(colors.darkGray);
      var column = new THREE.Mesh(columnGeometry, columnMaterial);
      var columnAngle = (j / 8) * Math.PI * 2;
      column.position.set(
        Math.cos(columnAngle) * 28,
        3,
        Math.sin(columnAngle) * 28
      );
      column.castShadow = true;
      column.receiveShadow = true;
      addObjectToScene(column);
    }

    // Pipe network
    for (var k = 0; k < 12; k++) {
      var pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 25, 8);
      var pipeMaterial = createMetalMaterial(colors.hazardYellow);
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      var pipeAngle = (k / 12) * Math.PI * 2;
      pipe.position.set(
        Math.cos(pipeAngle) * 25,
        8,
        Math.sin(pipeAngle) * 25
      );
      pipe.rotation.z = pipeAngle;
      pipe.castShadow = true;
      addObjectToScene(pipe);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    plantObjects = [];
    animatingBubbles = [];
    ventParticles = [];

    createFloorAndBoundary();
    createAcidStorageTanks();
    createAcidMoats();
    createCatwalks();
    createProcessingTowers();
    createValveStations();
    createAcidSpillPools();
    createSafetyShowers();
    createControlRoom();
    createCorrodedWalls();
    createExhaustVents();
    createPressureGauges();
    createToxicWasteDrums();
    createAdditionalStructures();

    console.log('Acid Plant initialized with ' + plantObjects.length + ' objects');
  }

  function updateBubbles(delta) {
    var bubblesAlive = [];

    for (var i = 0; i < animatingBubbles.length; i++) {
      var bubble = animatingBubbles[i];
      bubble.age += delta;

      if (bubble.age < 2) {
        bubble.mesh.position.y += delta * 1.5;
        var fadeOut = Math.max(0, 1 - bubble.age / 2);
        bubble.mesh.material.opacity = fadeOut;
        bubblesAlive.push(bubble);
      } else {
        scene.remove(bubble.mesh);
      }
    }

    animatingBubbles = bubblesAlive;

    // Create new bubbles periodically
    if (Math.random() < 0.4) {
      var poolIndices = [0, 1, 2, 3, 4, 5, 6, 7];
      var randomPool = Math.floor(Math.random() * poolIndices.length);
      var poolPositions = [
        { x: -35, z: -35, scale: 1.5 },
        { x: 35, z: -35, scale: 1.2 },
        { x: -35, z: 35, scale: 1.4 },
        { x: 35, z: 35, scale: 1.3 },
        { x: 0, z: -30, scale: 1.1 },
        { x: 0, z: 30, scale: 1.0 },
        { x: -25, z: 0, scale: 0.9 },
        { x: 25, z: 0, scale: 1.1 }
      ];

      var pos = poolPositions[randomPool];
      var bubbleGeometry = new THREE.SphereGeometry(
        0.3 + Math.random() * 0.2,
        8,
        8
      );
      var bubbleMaterial = new THREE.MeshPhongMaterial({
        color: colors.neonGreen,
        emissive: colors.neonGreen,
        emissiveIntensity: 0.6,
        wireframe: true,
        transparent: true,
        opacity: 0.6
      });
      var bubbleMesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      bubbleMesh.position.set(
        pos.x + (Math.random() - 0.5) * 4,
        0.5,
        pos.z + (Math.random() - 0.5) * 4
      );
      bubbleMesh.castShadow = true;

      scene.add(bubbleMesh);
      animatingBubbles.push({
        mesh: bubbleMesh,
        age: 0
      });
    }
  }

  function updateVents(delta) {
    ventParticles.forEach(function(vent) {
      vent.age += delta;
      if (vent.age > 0.5) {
        vent.age = 0;

        // Create particle
        var particleGeometry = new THREE.SphereGeometry(0.15, 6, 6);
        var particleMaterial = new THREE.MeshPhongMaterial({
          color: colors.glowGreen,
          emissive: colors.glowGreen,
          emissiveIntensity: 0.7,
          wireframe: false,
          transparent: true,
          opacity: 0.4
        });
        var particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(
          vent.x + (Math.random() - 0.5) * 2,
          vent.y,
          vent.z + (Math.random() - 0.5) * 2
        );
        particle.userData = {
          age: 0,
          lifetime: 1.5 + Math.random()
        };

        scene.add(particle);
      }
    });

    // Update existing particles
    var children = scene.children.slice();
    children.forEach(function(obj) {
      if (obj.userData && obj.userData.lifetime) {
        obj.userData.age += delta;
        obj.position.y += delta * 2;
        var progress = obj.userData.age / obj.userData.lifetime;
        obj.material.opacity = Math.max(0, 0.4 * (1 - progress));

        if (obj.userData.age > obj.userData.lifetime) {
          scene.remove(obj);
        }
      }
    });
  }

  function update(delta) {
    updateBubbles(delta);
    updateVents(delta);
  }

  function reset() {
    plantObjects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });

    animatingBubbles.forEach(function(bubble) {
      if (bubble.mesh.geometry) {
        bubble.mesh.geometry.dispose();
      }
      if (bubble.mesh.material) {
        bubble.mesh.material.dispose();
      }
      scene.remove(bubble.mesh);
    });

    var children = scene.children.slice();
    children.forEach(function(obj) {
      if (obj.userData && obj.userData.lifetime) {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          obj.material.dispose();
        }
        scene.remove(obj);
      }
    });

    plantObjects = [];
    animatingBubbles = [];
    ventParticles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
