window.BunkerNetwork = (function() {
  'use strict';

  var scene, camera;
  var mainHub, bunkerA, bunkerB, bunkerC, bunkerD;
  var tunnels, junctions, blastDoors;
  var electricCart, cartDirection;
  var indicatorLights, ventFans;
  var breakdownParticles, breakdownParticleVelocities;
  var tunnelSupportRibs, supplyCache;
  var waterSeepageMaterial, cartStartPos;
  var allObjects = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    tunnels = [];
    junctions = [];
    blastDoors = [];
    indicatorLights = [];
    ventFans = [];
    breakdownParticles = [];
    breakdownParticleVelocities = [];
    tunnelSupportRibs = [];
    cartDirection = 1;
    allObjects = [];

    // Central hub junction - main room
    var hubGeometry = new THREE.BoxGeometry(30, 12, 30);
    var hubMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    mainHub = new THREE.Mesh(hubGeometry, hubMaterial);
    mainHub.position.set(0, 6, 0);
    scene.add(mainHub);
    allObjects.push(mainHub);

    // Floor and ceiling texturing
    var floorGeometry = new THREE.BoxGeometry(30, 0.5, 30);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, 0.25, 0);
    scene.add(floor);
    allObjects.push(floor);

    var ceilingGeometry = new THREE.BoxGeometry(30, 0.5, 30);
    var ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, 11.75, 0);
    scene.add(ceiling);
    allObjects.push(ceiling);

    // Tunnel corridors radiating from hub
    createTunnelCorridor(0, 0, 25, 0, 0, 1, 50);
    createTunnelCorridor(0, 0, -25, 0, 0, -1, 50);
    createTunnelCorridor(25, 0, 0, 1, 0, 0, 50);
    createTunnelCorridor(-25, 0, 0, -1, 0, 0, 50);

    // Bunker A - Command Center
    bunkerA = createBunker(
      new THREE.Vector3(40, 6, 0),
      0x4a4a6a,
      'Command Center'
    );
    createBriefingTable(new THREE.Vector3(40, 3, 0));
    createIndicatorLights(new THREE.Vector3(40, 10, -8), 5);

    // Bunker B - Medical
    bunkerB = createBunker(
      new THREE.Vector3(0, 6, 40),
      0x6a4a4a,
      'Medical Bay'
    );
    createStretchers(new THREE.Vector3(0, 3, 40));
    createSupplyCabinets(new THREE.Vector3(0, 5, 50));

    // Bunker C - Armory
    bunkerC = createBunker(
      new THREE.Vector3(-40, 6, 0),
      0x5a5a3a,
      'Armory'
    );
    createWeaponRacks(new THREE.Vector3(-40, 4, 0));
    createAmmoStacks(new THREE.Vector3(-40, 3, -10));

    // Bunker D - Communications
    bunkerD = createBunker(
      new THREE.Vector3(0, 6, -40),
      0x3a5a5a,
      'Comms Center'
    );
    createRadioRacks(new THREE.Vector3(0, 4, -40));
    createAntennnaShaft(new THREE.Vector3(0, 8, -50));

    // T-junction tunnels
    createTJunction(new THREE.Vector3(15, 6, 15));
    createTJunction(new THREE.Vector3(-15, 6, 15));
    createTJunction(new THREE.Vector3(15, 6, -15));
    createTJunction(new THREE.Vector3(-15, 6, -15));

    // Reinforced blast doors
    createBlastDoor(new THREE.Vector3(30, 6, 0));
    createBlastDoor(new THREE.Vector3(-30, 6, 0));
    createBlastDoor(new THREE.Vector3(0, 6, 30));
    createBlastDoor(new THREE.Vector3(0, 6, -30));

    // Tunnel support ribs - arched ceiling supports
    createSupportRibs(new THREE.Vector3(0, 10, 10), 8);
    createSupportRibs(new THREE.Vector3(10, 10, 0), 8);
    createSupportRibs(new THREE.Vector3(-10, 10, 0), 8);
    createSupportRibs(new THREE.Vector3(0, 10, -10), 8);

    // Electric patrol cart
    electricCart = createElectricCart(new THREE.Vector3(0, 1.5, 0));
    cartStartPos = new THREE.Vector3(0, 1.5, 0);

    // Power room
    createPowerRoom(new THREE.Vector3(20, 6, -25));

    // Emergency stairways
    createEmergencyStairway(new THREE.Vector3(-25, 6, 25));

    // Ventilation shafts
    createVentilationShaft(new THREE.Vector3(25, 8, 25), true);
    createVentilationShaft(new THREE.Vector3(-25, 8, -25), true);
    createVentilationShaft(new THREE.Vector3(35, 6, 10), false);

    // Buried supply cache
    supplyCache = createSupplyCache(new THREE.Vector3(-35, 3, -35));

    // Enemy tunnel breakthrough point - crumbled wall
    createBreakthroughPoint(new THREE.Vector3(-45, 5, 0));

    // Water seepage patch
    createWaterSeepage(new THREE.Vector3(25, 1, -30));

    // Emergency lighting strips
    createEmergencyLighting();
  }

  function createTunnelCorridor(startX, startY, startZ, dirX, dirZ, dirLength, length) {
    var segmentLength = 5;
    var segmentCount = Math.floor(length / segmentLength);

    for (var i = 0; i < segmentCount; i++) {
      var x = startX + dirX * i * segmentLength;
      var z = startZ + dirZ * i * segmentLength;

      var tunnelGeometry = new THREE.BoxGeometry(6, 8, segmentLength);
      var tunnelMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        roughness: 0.7
      });
      var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
      tunnel.position.set(x, 4, z);
      scene.add(tunnel);
      tunnels.push(tunnel);
      allObjects.push(tunnel);

      // Wall reinforcement lines
      if (i % 2 === 0) {
        var wallReinforcement = new THREE.BoxGeometry(0.3, 8, segmentLength);
        var wallMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        var wall = new THREE.Mesh(wallReinforcement, wallMat);
        wall.position.set(x + 3, 4, z);
        scene.add(wall);
        allObjects.push(wall);
      }
    }
  }

  function createBunker(position, color, purpose) {
    var bunkerGeometry = new THREE.BoxGeometry(20, 10, 20);
    var bunkerMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.6
    });
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.copy(position);
    scene.add(bunker);
    allObjects.push(bunker);

    // Bunker label
    var doorGeometry = new THREE.BoxGeometry(2, 3, 0.5);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8a4a4a });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(position.x + 10.5, position.y - 2, position.z - 10.5);
    scene.add(door);
    allObjects.push(door);

    return bunker;
  }

  function createBriefingTable(position) {
    var tableTopGeometry = new THREE.BoxGeometry(10, 0.5, 6);
    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0x5a3a1a });
    var tableTop = new THREE.Mesh(tableTopGeometry, tableMaterial);
    tableTop.position.set(position.x, position.y + 2, position.z);
    scene.add(tableTop);
    allObjects.push(tableTop);

    // Table legs
    for (var i = 0; i < 4; i++) {
      var legGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
      var legMaterial = new THREE.MeshStandardMaterial({ color: 0x3a1a0a });
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      var offsetX = i < 2 ? -4 : 4;
      var offsetZ = i % 2 === 0 ? -2.5 : 2.5;
      leg.position.set(position.x + offsetX, position.y + 1, position.z + offsetZ);
      scene.add(leg);
      allObjects.push(leg);
    }

    // Tactical displays on wall
    var displayGeometry = new THREE.BoxGeometry(4, 3, 0.3);
    var displayMaterial = new THREE.MeshStandardMaterial({ color: 0x0a3a5a, emissive: 0x00ff00 });
    for (var j = 0; j < 3; j++) {
      var display = new THREE.Mesh(displayGeometry, displayMaterial);
      display.position.set(position.x - 8 + j * 4, position.y + 3, position.z - 10);
      scene.add(display);
      allObjects.push(display);
    }
  }

  function createIndicatorLights(position, count) {
    for (var i = 0; i < count; i++) {
      var lightGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4444,
        emissive: 0xff0000,
        metalness: 0.8
      });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(
        position.x + (i % 3) * 2 - 2,
        position.y + Math.floor(i / 3) * 2,
        position.z
      );
      scene.add(light);
      indicatorLights.push({
        mesh: light,
        baseColor: 0xff4444,
        activeColor: 0x00ff00,
        phase: Math.random() * Math.PI * 2
      });
      allObjects.push(light);
    }
  }

  function createStretchers(position) {
    for (var i = 0; i < 4; i++) {
      var stretcerGeometry = new THREE.BoxGeometry(2, 1, 6);
      var stretcherMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8a5a });
      var stretcher = new THREE.Mesh(stretcerGeometry, stretcherMaterial);
      stretcher.position.set(position.x + (i - 1.5) * 3, position.y, position.z + 3);
      scene.add(stretcher);
      allObjects.push(stretcher);
    }
  }

  function createSupplyCabinets(position) {
    for (var i = 0; i < 3; i++) {
      var cabinetGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
      var cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a4a });
      var cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
      cabinet.position.set(position.x + (i - 1) * 4, position.y + 2, position.z);
      scene.add(cabinet);
      allObjects.push(cabinet);
    }
  }

  function createWeaponRacks(position) {
    for (var i = 0; i < 6; i++) {
      var rackGeometry = new THREE.BoxGeometry(1, 5, 0.5);
      var rackMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a3a });
      var rack = new THREE.Mesh(rackGeometry, rackMaterial);
      rack.position.set(position.x + (i - 2.5) * 2.5, position.y + 2.5, position.z);
      scene.add(rack);
      allObjects.push(rack);
    }
  }

  function createAmmoStacks(position) {
    for (var i = 0; i < 4; i++) {
      var ammoGeometry = new THREE.BoxGeometry(2, 3, 2);
      var ammoMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a4a });
      var ammoStack = new THREE.Mesh(ammoGeometry, ammoMaterial);
      ammoStack.position.set(position.x + (i - 1.5) * 3, position.y + 1.5, position.z);
      scene.add(ammoStack);
      allObjects.push(ammoStack);
    }
  }

  function createRadioRacks(position) {
    for (var i = 0; i < 3; i++) {
      var radioRackGeometry = new THREE.BoxGeometry(3, 6, 2);
      var radioMaterial = new THREE.MeshStandardMaterial({ color: 0x2a3a4a });
      var radioRack = new THREE.Mesh(radioRackGeometry, radioMaterial);
      radioRack.position.set(position.x + (i - 1) * 4, position.y + 3, position.z);
      scene.add(radioRack);
      allObjects.push(radioRack);

      // Dials and displays
      for (var j = 0; j < 4; j++) {
        var dialGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        var dialMaterial = new THREE.MeshStandardMaterial({
          color: 0x00aa00,
          emissive: 0x00ff00
        });
        var dial = new THREE.Mesh(dialGeometry, dialMaterial);
        dial.position.set(
          position.x + (i - 1) * 4 - 1 + j * 0.7,
          position.y + 4,
          position.z + 1
        );
        scene.add(dial);
        allObjects.push(dial);
      }
    }
  }

  function createAntennnaShaft(position) {
    var shaftGeometry = new THREE.CylinderGeometry(0.8, 0.8, 30, 8);
    var shaftMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a6a });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.copy(position);
    scene.add(shaft);
    ventFans.push({
      mesh: shaft,
      rotation: 0,
      speed: 0.05
    });
    allObjects.push(shaft);

    // Antenna array at top
    for (var i = 0; i < 4; i++) {
      var antennaGeometry = new THREE.BoxGeometry(0.3, 8, 0.3);
      var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8aaa });
      var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
      antenna.position.set(
        position.x + Math.cos(i * Math.PI / 2) * 2,
        position.y + 18,
        position.z + Math.sin(i * Math.PI / 2) * 2
      );
      scene.add(antenna);
      allObjects.push(antenna);
    }
  }

  function createTJunction(position) {
    var junctionGeometry = new THREE.BoxGeometry(8, 8, 8);
    var junctionMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a4a });
    var junction = new THREE.Mesh(junctionGeometry, junctionMaterial);
    junction.position.copy(position);
    scene.add(junction);
    junctions.push(junction);
    allObjects.push(junction);
  }

  function createBlastDoor(position) {
    var doorGeometry = new THREE.BoxGeometry(6, 8, 1);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a6a6a,
      metalness: 0.9
    });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.copy(position);
    scene.add(door);
    blastDoors.push({
      mesh: door,
      open: false
    });
    allObjects.push(door);

    // Door frame
    var frameGeometry = new THREE.BoxGeometry(7, 9, 0.5);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(position.x, position.y, position.z - 0.75);
    scene.add(frame);
    allObjects.push(frame);
  }

  function createSupportRibs(position, count) {
    for (var i = 0; i < count; i++) {
      var ribGeometry = new THREE.BoxGeometry(0.4, 3, 0.4);
      var ribMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a7a });
      var rib = new THREE.Mesh(ribGeometry, ribMaterial);
      var angle = (i / count) * Math.PI;
      rib.position.set(
        position.x + Math.cos(angle) * 3,
        position.y + Math.sin(angle) * 2,
        position.z
      );
      scene.add(rib);
      tunnelSupportRibs.push(rib);
      allObjects.push(rib);
    }
  }

  function createElectricCart(position) {
    var bodyGeometry = new THREE.BoxGeometry(2, 1.5, 4);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3a5a3a });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.copy(position);

    var cartGroup = new THREE.Group();
    cartGroup.add(body);

    // Wheels
    for (var i = 0; i < 4; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      var offsetX = i < 2 ? -1 : 1;
      var offsetZ = i % 2 === 0 ? -1.2 : 1.2;
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(offsetX, 0.3, offsetZ);
      cartGroup.add(wheel);
    }

    scene.add(cartGroup);
    allObjects.push(cartGroup);

    return {
      group: cartGroup,
      position: position.clone(),
      wheels: cartGroup.children.slice(1)
    };
  }

  function createPowerRoom(position) {
    var roomGeometry = new THREE.BoxGeometry(16, 10, 12);
    var roomMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });
    var room = new THREE.Mesh(roomGeometry, roomMaterial);
    room.position.copy(position);
    scene.add(room);
    allObjects.push(room);

    // Generator cylinder
    var generatorGeometry = new THREE.CylinderGeometry(2, 2, 5, 16);
    var generatorMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a2a });
    var generator = new THREE.Mesh(generatorGeometry, generatorMaterial);
    generator.position.set(position.x, position.y, position.z);
    scene.add(generator);
    ventFans.push({
      mesh: generator,
      rotation: 0,
      speed: 0.08
    });
    allObjects.push(generator);

    // Power cables
    var cableGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
    var cableMaterial = new THREE.MeshStandardMaterial({ color: 0x8a2a2a });
    for (var i = 0; i < 4; i++) {
      var cable = new THREE.Mesh(cableGeometry, cableMaterial);
      cable.position.set(position.x + (i - 1.5) * 3, position.y + 4, position.z);
      scene.add(cable);
      allObjects.push(cable);
    }
  }

  function createEmergencyStairway(position) {
    var stepCount = 8;
    for (var i = 0; i < stepCount; i++) {
      var stepGeometry = new THREE.BoxGeometry(3, 0.5, 1.5);
      var stepMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a5a });
      var step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(position.x, position.y + i * 0.5, position.z + i * 1);
      scene.add(step);
      allObjects.push(step);
    }
  }

  function createVentilationShaft(position, isVertical) {
    if (isVertical) {
      var vertShaftGeometry = new THREE.CylinderGeometry(1.2, 1.2, 25, 8);
      var shaftMaterial = new THREE.MeshStandardMaterial({ color: 0x3a4a5a });
      var vertShaft = new THREE.Mesh(vertShaftGeometry, shaftMaterial);
      vertShaft.position.copy(position);
      scene.add(vertShaft);
      ventFans.push({
        mesh: vertShaft,
        rotation: 0,
        speed: 0.12,
        isVent: true
      });
      allObjects.push(vertShaft);

      // Vertical grates
      for (var i = 0; i < 5; i++) {
        var grateGeometry = new THREE.BoxGeometry(2.4, 0.3, 2.4);
        var grateMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a6a });
        var grate = new THREE.Mesh(grateGeometry, grateMaterial);
        grate.position.set(position.x, position.y - 10 + i * 5, position.z);
        scene.add(grate);
        allObjects.push(grate);
      }
    } else {
      var horizShaftGeometry = new THREE.CylinderGeometry(1, 1, 8, 8);
      horizShaftGeometry.rotateZ(Math.PI / 2);
      var horizShaft = new THREE.Mesh(horizShaftGeometry, shaftMaterial);
      horizShaft.position.copy(position);
      scene.add(horizShaft);
      ventFans.push({
        mesh: horizShaft,
        rotation: 0,
        speed: 0.1,
        isVent: true
      });
      allObjects.push(horizShaft);
    }
  }

  function createSupplyCache(position) {
    var chestGeometry = new THREE.BoxGeometry(3, 2, 2);
    var chestMaterial = new THREE.MeshStandardMaterial({ color: 0x5a3a1a });
    var chest = new THREE.Mesh(chestGeometry, chestMaterial);
    chest.position.copy(position);
    scene.add(chest);
    allObjects.push(chest);

    // Wall niche recess
    var nicheGeometry = new THREE.BoxGeometry(4, 3, 1);
    var nicheMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3a });
    var niche = new THREE.Mesh(nicheGeometry, nicheMaterial);
    niche.position.set(position.x, position.y, position.z - 0.6);
    scene.add(niche);
    allObjects.push(niche);

    return chest;
  }

  function createBreakthroughPoint(position) {
    // Crumbled wall section
    var debrisCount = 15;
    for (var i = 0; i < debrisCount; i++) {
      var debrisGeometry = new THREE.BoxGeometry(
        0.8 + Math.random() * 1.2,
        0.6 + Math.random() * 0.8,
        0.8 + Math.random() * 1.2
      );
      var debrisMaterial = new THREE.MeshStandardMaterial({
        color: 0x6a5a4a,
        roughness: 0.9
      });
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(
        position.x + Math.random() * 6 - 3,
        position.y + Math.random() * 4 - 2,
        position.z + Math.random() * 3 - 1.5
      );
      debris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(debris);
      allObjects.push(debris);
    }

    // Fresh soil color patch
    var soilGeometry = new THREE.BoxGeometry(8, 0.2, 4);
    var soilMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3a2a,
      roughness: 0.95
    });
    var soilPatch = new THREE.Mesh(soilGeometry, soilMaterial);
    soilPatch.position.copy(position);
    scene.add(soilPatch);
    allObjects.push(soilPatch);

    // Create breakdown particles for animation
    for (var j = 0; j < 12; j++) {
      var particleGeometry = new THREE.SphereGeometry(0.15, 4, 4);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: 0x7a6a5a,
        roughness: 0.8
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        position.x + Math.random() * 4 - 2,
        position.y + 3 + Math.random() * 2,
        position.z + Math.random() * 2 - 1
      );
      particle.visible = false;
      scene.add(particle);
      breakdownParticles.push(particle);
      breakdownParticleVelocities.push({
        vx: (Math.random() - 0.5) * 2,
        vy: -0.5 - Math.random() * 1,
        vz: (Math.random() - 0.5) * 1
      });
      allObjects.push(particle);
    }
  }

  function createWaterSeepage(position) {
    var seepageGeometry = new THREE.BoxGeometry(4, 0.1, 3);
    var seepageMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a6a8a,
      roughness: 0.4,
      metalness: 0.1
    });
    var seepage = new THREE.Mesh(seepageGeometry, seepageMaterial);
    seepage.position.copy(position);
    scene.add(seepage);
    waterSeepageMaterial = seepageMaterial;
    allObjects.push(seepage);

    // Water stain above
    var stainGeometry = new THREE.BoxGeometry(5, 3, 0.3);
    var stainMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a7a9a,
      roughness: 0.7
    });
    var stain = new THREE.Mesh(stainGeometry, stainMaterial);
    stain.position.set(position.x, position.y + 2, position.z - 1.5);
    scene.add(stain);
    allObjects.push(stain);
  }

  function createEmergencyLighting() {
    for (var i = 0; i < 12; i++) {
      var lightGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.3);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff3300
      });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(
        Math.cos(i * Math.PI / 6) * 20,
        10.5,
        Math.sin(i * Math.PI / 6) * 20
      );
      scene.add(light);
      allObjects.push(light);
    }
  }

  function update(delta) {
    // Electric cart patrol
    if (electricCart) {
      electricCart.group.position.x += cartDirection * delta * 8;
      if (electricCart.group.position.x > 35 || electricCart.group.position.x < -35) {
        cartDirection *= -1;
      }

      // Rotate wheels
      for (var i = 0; i < electricCart.wheels.length; i++) {
        electricCart.wheels[i].rotation.x += delta * 8;
      }
    }

    // Indicator lights cycle
    for (var j = 0; j < indicatorLights.length; j++) {
      var light = indicatorLights[j];
      light.phase += delta * 3;
      var intensity = 0.3 + Math.sin(light.phase) * 0.7;
      light.mesh.material.emissive.setHex(light.baseColor);
      light.mesh.material.emissiveIntensity = intensity;
    }

    // Ventilation fan spin
    for (var k = 0; k < ventFans.length; k++) {
      var fan = ventFans[k];
      fan.rotation += fan.speed;
      if (fan.isVent) {
        fan.mesh.rotation.y += fan.speed * delta * 10;
      } else {
        fan.mesh.rotation.x += fan.speed * delta * 10;
      }
    }

    // Breakdown rubble settle
    var breakdownChance = Math.random();
    if (breakdownChance < 0.3 && breakdownParticles.length > 0) {
      var particleIdx = Math.floor(Math.random() * breakdownParticles.length);
      var particle = breakdownParticles[particleIdx];
      if (!particle.visible) {
        particle.visible = true;
        particle.position.y = -10;
      }
    }

    for (var m = 0; m < breakdownParticles.length; m++) {
      if (breakdownParticles[m].visible) {
        var vel = breakdownParticleVelocities[m];
        breakdownParticles[m].position.x += vel.vx * delta;
        breakdownParticles[m].position.y += vel.vy * delta;
        breakdownParticles[m].position.z += vel.vz * delta;

        if (breakdownParticles[m].position.y < 0) {
          breakdownParticles[m].visible = false;
        }
      }
    }
  }

  function reset() {
    // Reset cart position
    if (electricCart) {
      electricCart.group.position.copy(electricCart.position);
      cartDirection = 1;
    }

    // Reset indicator lights
    for (var i = 0; i < indicatorLights.length; i++) {
      indicatorLights[i].phase = Math.random() * Math.PI * 2;
      indicatorLights[i].mesh.material.emissiveIntensity = 0.5;
    }

    // Reset ventilation fans
    for (var j = 0; j < ventFans.length; j++) {
      ventFans[j].rotation = 0;
    }

    // Hide breakdown particles
    for (var k = 0; k < breakdownParticles.length; k++) {
      breakdownParticles[k].visible = false;
    }

    // Reset blast doors
    for (var m = 0; m < blastDoors.length; m++) {
      blastDoors[m].open = false;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
