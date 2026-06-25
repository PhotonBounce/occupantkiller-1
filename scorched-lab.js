window.ScorchedLab = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var allObjects = [];
  var animatingObjects = [];
  var activeFires = [];
  var smokeParticles = [];
  var drippingWater = [];

  function createMaterial(color, emissive, roughness) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: 0.4,
      roughness: roughness || 0.8
    });
  }

  function addToScene(mesh) {
    scene.add(mesh);
    allObjects.push(mesh);
    return mesh;
  }

  function createMainLabBuilding() {
    var buildingGroup = new THREE.Group();

    // Main lab walls - Box geometry
    var wallMat = createMaterial(0x1a1a1a, 0x000000, 0.9);

    // Front wall (partially collapsed)
    var frontWall = new THREE.Mesh(new THREE.BoxGeometry(50, 35, 2), wallMat);
    frontWall.position.set(0, 17, 25);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    buildingGroup.add(frontWall);

    // Back wall
    var backWall = new THREE.Mesh(new THREE.BoxGeometry(50, 35, 2), wallMat);
    backWall.position.set(0, 17, -25);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    buildingGroup.add(backWall);

    // Left wall (blown out section)
    var leftWall = new THREE.Mesh(new THREE.BoxGeometry(2, 35, 50), wallMat);
    leftWall.position.set(-25, 17, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    buildingGroup.add(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(new THREE.BoxGeometry(2, 35, 50), wallMat);
    rightWall.position.set(25, 17, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    buildingGroup.add(rightWall);

    // Collapsed roof sections
    var roofMat = createMaterial(0x2d2d2d, 0x0d0d0d, 0.95);
    var roofSection1 = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 25), roofMat);
    roofSection1.position.set(-15, 35, 0);
    roofSection1.rotation.z = 0.3;
    roofSection1.castShadow = true;
    roofSection1.receiveShadow = true;
    buildingGroup.add(roofSection1);

    var roofSection2 = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 25), roofMat);
    roofSection2.position.set(15, 33, 5);
    roofSection2.rotation.z = -0.4;
    roofSection2.castShadow = true;
    roofSection2.receiveShadow = true;
    buildingGroup.add(roofSection2);

    var roofSection3 = new THREE.Mesh(new THREE.BoxGeometry(15, 2, 20), roofMat);
    roofSection3.position.set(0, 34, -15);
    roofSection3.rotation.x = 0.2;
    roofSection3.castShadow = true;
    roofSection3.receiveShadow = true;
    buildingGroup.add(roofSection3);

    // Exposed structural beams
    var beamMat = createMaterial(0x5a5a5a, 0x1a1a1a, 0.7);
    var beam1 = new THREE.Mesh(new THREE.BoxGeometry(3, 40, 2), beamMat);
    beam1.position.set(-18, 18, 0);
    beam1.castShadow = true;
    buildingGroup.add(beam1);

    var beam2 = new THREE.Mesh(new THREE.BoxGeometry(3, 40, 2), beamMat);
    beam2.position.set(18, 18, 0);
    beam2.castShadow = true;
    buildingGroup.add(beam2);

    var beam3 = new THREE.Mesh(new THREE.BoxGeometry(50, 2, 3), beamMat);
    beam3.position.set(0, 20, 15);
    beam3.castShadow = true;
    buildingGroup.add(beam3);

    // Blown out window frame (hole in wall)
    var windowHole = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 2.5), wallMat);
    windowHole.position.set(0, 25, 25.5);
    buildingGroup.add(windowHole);

    scene.add(buildingGroup);
    for (var i = 0; i < buildingGroup.children.length; i++) {
      allObjects.push(buildingGroup.children[i]);
    }
  }

  function createLabFloor() {
    var floorMat = createMaterial(0x0d0d0d, 0x000000, 0.95);
    var floor = new THREE.Mesh(new THREE.BoxGeometry(60, 1, 60), floorMat);
    floor.position.y = 0;
    floor.castShadow = true;
    floor.receiveShadow = true;
    addToScene(floor);

    // Burn marks and scorch patterns (dark patches)
    var scorchMat = createMaterial(0x050505, 0x000000, 1.0);
    var scorch1 = new THREE.Mesh(new THREE.BoxGeometry(15, 0.5, 15), scorchMat);
    scorch1.position.set(10, 0.5, 10);
    addToScene(scorch1);

    var scorch2 = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 12), scorchMat);
    scorch2.position.set(-15, 0.5, -12);
    addToScene(scorch2);
  }

  function createBurnedResearchStations() {
    var stationMat = createMaterial(0x1a1a1a, 0x000000, 0.9);
    var positions = [
      { x: -18, z: -10 },
      { x: -18, z: 5 },
      { x: 0, z: -15 },
      { x: 18, z: -8 },
      { x: 18, z: 12 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      // Workbench frame
      var bench = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 4), stationMat);
      bench.position.set(pos.x, 2, pos.z);
      bench.castShadow = true;
      bench.receiveShadow = true;
      addToScene(bench);

      // Side support legs
      var leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 0.5), stationMat);
      leg1.position.set(pos.x - 3.5, 1.5, pos.z - 1.5);
      addToScene(leg1);

      var leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 0.5), stationMat);
      leg2.position.set(pos.x + 3.5, 1.5, pos.z + 1.5);
      addToScene(leg2);

      // Char marks on top
      var charMat = createMaterial(0x1a0a0a, 0x000000, 1.0);
      var charMark = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 3.5), charMat);
      charMark.position.set(pos.x, 4.2, pos.z);
      addToScene(charMark);
    }
  }

  function createShatteredEquipment() {
    var equipMat = createMaterial(0x2a2a2a, 0x000000, 0.8);
    var scrapMat = createMaterial(0x3a3a3a, 0x0a0a0a, 0.7);

    // Shattered microscope remnants
    var micro1 = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2), equipMat);
    micro1.position.set(-20, 1.5, 20);
    micro1.rotation.z = 0.5;
    addToScene(micro1);

    var micro2 = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), scrapMat);
    micro2.position.set(-19, 1, 21);
    micro2.rotation.x = 0.7;
    addToScene(micro2);

    // Broken centrifuge
    var centri = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), equipMat);
    centri.position.set(15, 2, 20);
    centri.rotation.y = 0.3;
    addToScene(centri);

    var centriScrap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), scrapMat);
    centriScrap.position.set(16, 1, 19);
    centriScrap.rotation.z = 0.4;
    addToScene(centriScrap);

    // Shattered pipette racks
    var pipeRack = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 2), equipMat);
    pipeRack.position.set(-12, 1.5, -20);
    pipeRack.rotation.z = 0.6;
    addToScene(pipeRack);

    var pipeScrap1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.3), scrapMat);
    pipeScrap1.position.set(-11, 2, -19);
    pipeScrap1.rotation.z = 0.8;
    addToScene(pipeScrap1);

    var pipeScrap2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.3), scrapMat);
    pipeScrap2.position.set(-13, 1.5, -21);
    pipeScrap2.rotation.x = 0.5;
    addToScene(pipeScrap2);

    // Broken spectrometer
    var spectro = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 3), equipMat);
    spectro.position.set(8, 1.5, -18);
    spectro.rotation.y = 0.4;
    addToScene(spectro);

    // Scattered instrument debris
    for (var i = 0; i < 8; i++) {
      var debris = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), scrapMat);
      debris.position.set(-15 + Math.random() * 8, 0.8 + Math.random() * 1, -15 + Math.random() * 10);
      debris.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      addToScene(debris);
    }
  }

  function createExplosionCrater() {
    var craterMat = createMaterial(0x0a0a0a, 0x000000, 1.0);

    // Crater depression
    var crater = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 20), craterMat);
    crater.position.set(0, -1.5, 0);
    crater.castShadow = true;
    crater.receiveShadow = true;
    addToScene(crater);

    // Crater rim (elevated)
    var rimMat = createMaterial(0x1a1a1a, 0x000000, 0.9);
    var rimOuter = new THREE.Mesh(new THREE.BoxGeometry(25, 1, 25), rimMat);
    rimOuter.position.set(0, 1, 0);
    addToScene(rimOuter);

    // Blast pattern scorches
    var blastMat = createMaterial(0x050505, 0x000000, 1.0);
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var dist = 12;
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;

      var blastMark = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 3), blastMat);
      blastMark.position.set(x, 0.5, z);
      addToScene(blastMark);
    }

    // Crater debris
    var debrisMat = createMaterial(0x2a2a2a, 0x0a0a0a, 0.8);
    for (var j = 0; j < 15; j++) {
      var debris = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), debrisMat);
      debris.position.set(-10 + Math.random() * 20, -0.5 + Math.random() * 2, -10 + Math.random() * 20);
      debris.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      addToScene(debris);
    }
  }

  function createSuppressionSystem() {
    var sprinklerMat = createMaterial(0x4a4a4a, 0x0a0a0a, 0.6);
    var pipeMat = createMaterial(0x3a3a3a, 0x000000, 0.7);

    // Ceiling pipe network
    var mainPipe = new THREE.Mesh(new THREE.BoxGeometry(50, 0.8, 0.8), pipeMat);
    mainPipe.position.set(0, 38, 0);
    addToScene(mainPipe);

    var sidePipe1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 50), pipeMat);
    sidePipe1.position.set(0, 38, 0);
    addToScene(sidePipe1);

    // Sprinkler heads at various positions
    var sprinklerPositions = [
      { x: -20, z: -15 },
      { x: -20, z: 0 },
      { x: -20, z: 15 },
      { x: 0, z: -20 },
      { x: 0, z: 20 },
      { x: 20, z: -15 },
      { x: 20, z: 0 },
      { x: 20, z: 15 }
    ];

    for (var i = 0; i < sprinklerPositions.length; i++) {
      var pos = sprinklerPositions[i];

      var sprinkler = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 8), sprinklerMat);
      sprinkler.position.set(pos.x, 36, pos.z);
      sprinkler.castShadow = true;
      addToScene(sprinkler);

      // Connection pipe from ceiling
      var connector = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 6), pipeMat);
      connector.position.set(pos.x, 37, pos.z);
      addToScene(connector);

      // Water drip point
      if (Math.random() > 0.4) {
        drippingWater.push({
          position: { x: pos.x, z: pos.z },
          particles: []
        });
      }
    }
  }

  function createMeltedServerRacks() {
    var serverMat = createMaterial(0x1a1a1a, 0x0a0a0a, 0.85);
    var meltMat = createMaterial(0x3a2020, 0x1a0a0a, 0.9);

    // Deformed server towers
    var serverPositions = [
      { x: -22, z: 8, angle: 0.4 },
      { x: -22, z: 14, angle: 0.3 },
      { x: 22, z: 8, angle: -0.4 },
      { x: 22, z: 14, angle: -0.3 }
    ];

    for (var i = 0; i < serverPositions.length; i++) {
      var pos = serverPositions[i];

      var server = new THREE.Mesh(new THREE.BoxGeometry(3, 15, 2), serverMat);
      server.position.set(pos.x, 7.5, pos.z);
      server.rotation.z = pos.angle;
      server.castShadow = true;
      addToScene(server);

      // Melted pooled material at base
      var melt = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 3), meltMat);
      melt.position.set(pos.x, 0.5, pos.z);
      addToScene(melt);

      // Server slots
      for (var j = 0; j < 5; j++) {
        var slot = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 1), meltMat);
        slot.position.set(pos.x, 3 + j * 3, pos.z + 1);
        addToScene(slot);
      }
    }
  }

  function createSpecimenJars() {
    var jarMat = createMaterial(0x1a1a1a, 0x000000, 0.6);
    var contentMat = createMaterial(0xff6b35, 0x5a2a0a, 0.5);

    var jarPositions = [
      { x: -15, z: 15 },
      { x: -8, z: 18 },
      { x: 5, z: 16 },
      { x: 12, z: 14 },
      { x: -10, z: 25 },
      { x: 8, z: 24 }
    ];

    for (var i = 0; i < jarPositions.length; i++) {
      var pos = jarPositions[i];

      // Fallen jar cylinder
      var jar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2, 12), jarMat);
      jar.position.set(pos.x, 1, pos.z);
      jar.rotation.z = 1.5 + Math.random() * 0.5;
      jar.castShadow = true;
      addToScene(jar);

      // Scattered contents (spheres)
      for (var j = 0; j < 3; j++) {
        var content = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), contentMat);
        content.position.set(pos.x - 1 + Math.random() * 2, 0.8 + Math.random() * 1, pos.z - 1 + Math.random() * 2);
        addToScene(content);
      }
    }
  }

  function createScorchedDocumentation() {
    var paperMat = createMaterial(0x0a0a0a, 0x000000, 1.0);
    var stackMat = createMaterial(0x1a1a1a, 0x050505, 0.95);

    // Paper stacks/piles
    var docPositions = [
      { x: -25, z: 5 },
      { x: -25, z: 15 },
      { x: 25, z: -5 },
      { x: 25, z: 10 },
      { x: 0, z: 28 }
    ];

    for (var i = 0; i < docPositions.length; i++) {
      var pos = docPositions[i];

      // Main stack
      var stack = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), stackMat);
      stack.position.set(pos.x, 1.5, pos.z);
      stack.rotation.y = Math.random() * 0.3;
      addToScene(stack);

      // Scattered sheets
      for (var j = 0; j < 5; j++) {
        var sheet = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 3), paperMat);
        sheet.position.set(pos.x - 2 + Math.random() * 4, 1 + j * 0.3, pos.z - 2 + Math.random() * 4);
        sheet.rotation.z = Math.random() * 0.5;
        addToScene(sheet);
      }
    }
  }

  function createActiveFires() {
    var fireMat = createMaterial(0xff6b35, 0xff4500, 0.3);
    var fireMat2 = createMaterial(0xff8c00, 0xff6b35, 0.4);

    var firePositions = [
      { x: -10, z: -5, size: 1.5 },
      { x: 12, z: -12, size: 1.2 },
      { x: -18, z: 18, size: 1.3 },
      { x: 15, z: 8, size: 1.4 }
    ];

    for (var i = 0; i < firePositions.length; i++) {
      var pos = firePositions[i];

      var fire = new THREE.Mesh(new THREE.SphereGeometry(pos.size, 8, 8), fireMat);
      fire.position.set(pos.x, 1.5, pos.z);
      fire.castShadow = true;
      addToScene(fire);

      var fire2 = new THREE.Mesh(new THREE.SphereGeometry(pos.size * 0.7, 8, 8), fireMat2);
      fire2.position.set(pos.x + 0.5, 2, pos.z + 0.5);
      addToScene(fire2);

      activeFires.push({
        meshes: [fire, fire2],
        baseY: 1.5,
        baseScale: pos.size,
        intensity: Math.random() * 0.5 + 0.5
      });
    }

    // Flame spikes
    var flamePositions = [
      { x: -10, z: -5 },
      { x: 12, z: -12 },
      { x: -18, z: 18 },
      { x: 15, z: 8 }
    ];

    for (var j = 0; j < flamePositions.length; j++) {
      var fpos = flamePositions[j];
      var flame = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3, 8), fireMat);
      flame.position.set(fpos.x, 2.5, fpos.z);
      addToScene(flame);
    }
  }

  function createFoamSuppressant() {
    var foamMat = createMaterial(0xf0f0f0, 0xd0d0d0, 0.7);

    // Foam patches on floor
    var foamPositions = [
      { x: -8, z: -8, size: 5 },
      { x: 10, z: 10, size: 4 },
      { x: -15, z: 12, size: 6 },
      { x: 18, z: -10, size: 4 },
      { x: 0, z: -25, size: 5 }
    ];

    for (var i = 0; i < foamPositions.length; i++) {
      var pos = foamPositions[i];

      var foam = new THREE.Mesh(new THREE.BoxGeometry(pos.size, 0.8, pos.size), foamMat);
      foam.position.set(pos.x, 0.4, pos.z);
      foam.castShadow = true;
      foam.receiveShadow = true;
      addToScene(foam);

      // Foam chunks
      for (var j = 0; j < 3; j++) {
        var chunk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), foamMat);
        chunk.position.set(pos.x - pos.size / 2 + Math.random() * pos.size, 1.2 + j * 0.4, pos.z - pos.size / 2 + Math.random() * pos.size);
        addToScene(chunk);
      }
    }
  }

  function createEmergencyExit() {
    var stairMat = createMaterial(0x2a2a2a, 0x000000, 0.8);
    var railMat = createMaterial(0x4a4a4a, 0x1a1a1a, 0.7);

    // Stairwell structure
    for (var i = 0; i < 8; i++) {
      var step = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 3), stairMat);
      step.position.set(28, 2 + i * 1.2, -22 + i * 0.8);
      step.castShadow = true;
      addToScene(step);
    }

    // Safety rails
    var rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), railMat);
    rail1.position.set(26.5, 6, -20);
    addToScene(rail1);

    var rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), railMat);
    rail2.position.set(29.5, 6, -20);
    addToScene(rail2);

    // Emergency lighting spheres (red)
    var lightMat = createMaterial(0xff0000, 0x880000, 0.4);
    for (var j = 0; j < 4; j++) {
      var light = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), lightMat);
      light.position.set(28, 10 + j * 2, -20);
      addToScene(light);
    }

    // Exit sign frame
    var signFrame = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.3), stairMat);
    signFrame.position.set(28, 13, -20);
    addToScene(signFrame);
  }

  function createExposedStructure() {
    var frameMat = createMaterial(0x5a5a5a, 0x1a1a1a, 0.7);

    // Skeletal frame cross-braces
    var positions = [
      { start: { x: -20, y: 10, z: -20 }, end: { x: 20, y: 30, z: 20 } },
      { start: { x: 20, y: 10, z: -20 }, end: { x: -20, y: 30, z: 20 } },
      { start: { x: -20, y: 15, z: 20 }, end: { x: 20, y: 15, z: -20 } },
      { start: { x: 0, y: 5, z: -30 }, end: { x: 0, y: 35, z: -30 } },
      { start: { x: 0, y: 5, z: 30 }, end: { x: 0, y: 35, z: 30 } }
    ];

    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var dx = p.end.x - p.start.x;
      var dy = p.end.y - p.start.y;
      var dz = p.end.z - p.start.z;
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz);

      var brace = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, len, 8), frameMat);
      var midX = (p.start.x + p.end.x) / 2;
      var midY = (p.start.y + p.end.y) / 2;
      var midZ = (p.start.z + p.end.z) / 2;
      brace.position.set(midX, midY, midZ);

      var quat = new THREE.Quaternion();
      var direction = new THREE.Vector3(dx, dy, dz).normalize();
      var up = new THREE.Vector3(0, 1, 0);
      if (Math.abs(direction.y) < 0.99) {
        var axis = new THREE.Vector3().crossVectors(up, direction).normalize();
        var angle = Math.acos(direction.dot(up));
        quat.setFromAxisAngle(axis, angle);
      }
      brace.quaternion.copy(quat);

      addToScene(brace);
    }

    // Vertical support columns
    for (var j = 0; j < 6; j++) {
      var col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 40, 10), frameMat);
      col.position.set(-25 + j * 10, 20, -25);
      col.castShadow = true;
      addToScene(col);
    }
  }

  function createHazmatRack() {
    var rackMat = createMaterial(0x1a1a1a, 0x000000, 0.8);
    var suitMat = createMaterial(0xffff00, 0x999900, 0.5);

    // Rack structure
    var rack = new THREE.Mesh(new THREE.BoxGeometry(6, 10, 2), rackMat);
    rack.position.set(-28, 5, -25);
    rack.castShadow = true;
    addToScene(rack);

    // Support legs
    var leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), rackMat);
    leg1.position.set(-26, 0.5, -25);
    addToScene(leg1);

    var leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), rackMat);
    leg2.position.set(-30, 0.5, -25);
    addToScene(leg2);

    // Hazmat suits hanging (cylinder shapes)
    var suitPositions = [
      { x: -28, y: 9, angle: 0 },
      { x: -26, y: 8, angle: 0.2 },
      { x: -30, y: 8, angle: -0.2 },
      { x: -28, y: 6, angle: 0.1 }
    ];

    for (var i = 0; i < suitPositions.length; i++) {
      var spos = suitPositions[i];
      var suit = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2.5, 8), suitMat);
      suit.position.set(spos.x, spos.y, -25);
      suit.rotation.z = spos.angle;
      addToScene(suit);
    }

    // Suit helmet spheres
    var helmetMat = createMaterial(0xcccc00, 0x888800, 0.4);
    for (var j = 0; j < 3; j++) {
      var helmet = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), helmetMat);
      helmet.position.set(-28 + (Math.random() - 0.5) * 4, 11 + j * 0.3, -25);
      addToScene(helmet);
    }
  }

  function createSmokePuffs() {
    var smokeMat = createMaterial(0x333333, 0x111111, 0.9);
    smokeMat.transparent = true;
    smokeMat.opacity = 0.4;

    // Initial smoke particles around fire areas
    for (var i = 0; i < 12; i++) {
      var smoke = new THREE.Mesh(new THREE.SphereGeometry(1 + Math.random() * 1.5, 6, 6), smokeMat);
      var angle = (i / 12) * Math.PI * 2;
      var dist = 8 + Math.random() * 10;
      smoke.position.set(Math.cos(angle) * dist, 4 + Math.random() * 8, Math.sin(angle) * dist);
      addToScene(smoke);

      smokeParticles.push({
        mesh: smoke,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.1 + Math.random() * 0.2,
        vz: (Math.random() - 0.5) * 0.3,
        life: 1.0,
        maxLife: 1.0
      });
    }
  }

  function updateFires(delta) {
    for (var i = 0; i < activeFires.length; i++) {
      var fire = activeFires[i];
      var flicker = Math.sin(Date.now() * 0.005 + i) * 0.3 + 0.7;
      var wobble = Math.sin(Date.now() * 0.003) * 0.2;

      fire.meshes[0].scale.y = 1 + flicker * fire.intensity;
      fire.meshes[0].scale.x = 0.8 + wobble;
      fire.meshes[0].scale.z = 0.8 + wobble;

      fire.meshes[1].position.y = fire.baseY + 1 + flicker * 0.8;
      fire.meshes[1].rotation.y += delta * 0.5;
    }
  }

  function updateSmoke(delta) {
    for (var i = smokeParticles.length - 1; i >= 0; i--) {
      var particle = smokeParticles[i];

      particle.mesh.position.x += particle.vx;
      particle.mesh.position.y += particle.vy;
      particle.mesh.position.z += particle.vz;

      particle.life -= delta * 0.3;
      particle.mesh.material.opacity = particle.life / particle.maxLife * 0.4;

      if (particle.life <= 0) {
        scene.remove(particle.mesh);
        smokeParticles.splice(i, 1);
      }
    }

    // Spawn new smoke
    if (Math.random() > 0.7) {
      var smokeMat = createMaterial(0x333333, 0x111111, 0.9);
      smokeMat.transparent = true;
      smokeMat.opacity = 0.4;

      var smoke = new THREE.Mesh(new THREE.SphereGeometry(0.8 + Math.random() * 1, 6, 6), smokeMat);
      var fireIdx = Math.floor(Math.random() * activeFires.length);
      var firePos = activeFires[fireIdx].meshes[0].position;

      smoke.position.set(firePos.x + (Math.random() - 0.5) * 2, firePos.y + 2, firePos.z + (Math.random() - 0.5) * 2);
      addToScene(smoke);

      smokeParticles.push({
        mesh: smoke,
        vx: (Math.random() - 0.5) * 0.2,
        vy: 0.15 + Math.random() * 0.1,
        vz: (Math.random() - 0.5) * 0.2,
        life: 1.0,
        maxLife: 1.0
      });
    }
  }

  function updateDrippingWater(delta) {
    for (var i = 0; i < drippingWater.length; i++) {
      var drip = drippingWater[i];

      if (drip.particles.length < 5 && Math.random() > 0.85) {
        var waterMat = createMaterial(0x4488ff, 0x2266aa, 0.5);
        var drop = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), waterMat);
        drop.position.set(drip.position.x, 35, drip.position.z);
        addToScene(drop);

        drip.particles.push({
          mesh: drop,
          y: 35,
          vy: 0
        });
      }

      for (var j = drip.particles.length - 1; j >= 0; j--) {
        var particle = drip.particles[j];
        particle.vy -= 0.3;
        particle.y += particle.vy;
        particle.mesh.position.y = particle.y;

        if (particle.y <= 0) {
          scene.remove(particle.mesh);
          drip.particles.splice(j, 1);
        }
      }
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    createLabFloor();
    createMainLabBuilding();
    createBurnedResearchStations();
    createShatteredEquipment();
    createExplosionCrater();
    createSuppressionSystem();
    createMeltedServerRacks();
    createSpecimenJars();
    createScorchedDocumentation();
    createActiveFires();
    createFoamSuppressant();
    createEmergencyExit();
    createExposedStructure();
    createHazmatRack();
    createSmokePuffs();

    return allObjects.length;
  }

  function update(delta) {
    updateFires(delta);
    updateSmoke(delta);
    updateDrippingWater(delta);
  }

  function reset() {
    for (var i = allObjects.length - 1; i >= 0; i--) {
      scene.remove(allObjects[i]);
    }

    for (var j = 0; j < smokeParticles.length; j++) {
      scene.remove(smokeParticles[j].mesh);
    }

    allObjects = [];
    animatingObjects = [];
    activeFires = [];
    smokeParticles = [];
    drippingWater = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
