window.EvacuationZone = (function() {
  'use strict';

  var scene, camera;
  var heliRotor = null;
  var fireParticles = [];
  var smokeParticles = [];
  var floodlights = [];
  var animationState = {
    rotor: 0,
    fireFlicker: 0,
    smokeRise: 0,
    floodlightSweep: 0
  };

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    // Ground plane - evacuation zone landing zone
    var groundGeometry = new THREE.BoxGeometry(300, 0.5, 300);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // H helipad marker
    createHelipadMarker();

    // Medical triage tents
    createMedicalTents();

    // Refugee shelters
    createRefugeeShelters();

    // Abandoned luggage piles
    createLuggagePiles();

    // Aid worker vehicles
    createAidVehicles();

    // Burning car barricade
    createBurningCarBarricade();

    // Downed helicopter
    createDownedHelicopter();

    // Sandbag defensive ring
    createSandbagRing();

    // Water distribution point
    createWaterDistribution();

    // Stretchers scattered
    createStretchers();

    // Medical supply crates
    createMedicalCrates();

    // Communication antenna
    createCommunicationAntenna();

    // Smoke marker grenades
    createSmokeMarkers();

    // Armed escort positions
    createEscortPositions();

    // Checkpoint barrier boom gate
    createCheckpointBarrier();

    // Floodlight towers
    createFloodlightTowers();

    // Initialize particle systems
    initializeParticles();

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 60, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
  }

  function createHelipadMarker() {
    // Large H marking on ground
    var hGeometry = new THREE.BoxGeometry(15, 0.1, 8);
    var hMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0x444444 });
    var hShape = new THREE.Mesh(hGeometry, hMaterial);
    hShape.position.set(0, 0.3, 0);
    scene.add(hShape);

    var h2Geometry = new THREE.BoxGeometry(8, 0.1, 15);
    var h2Shape = new THREE.Mesh(h2Geometry, hMaterial);
    h2Shape.position.set(0, 0.3, 0);
    scene.add(h2Shape);

    // Circle around H
    var circleGeometry = new THREE.BoxGeometry(40, 0.1, 1);
    var circleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0x666600 });
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var circleSegment = new THREE.Mesh(circleGeometry, circleMaterial);
      circleSegment.position.set(
        Math.cos(angle) * 20,
        0.3,
        Math.sin(angle) * 20
      );
      circleSegment.rotation.z = angle;
      scene.add(circleSegment);
    }
  }

  function createMedicalTents() {
    // Three medical tents
    for (var i = 0; i < 3; i++) {
      var tentX = -60 + i * 40;
      var tentZ = 40;

      // Tent frame base
      var frameGeometry = new THREE.BoxGeometry(20, 0.3, 20);
      var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(tentX, 0.15, tentZ);
      scene.add(frame);

      // Tent roof (sloped as box)
      var roofGeometry = new THREE.BoxGeometry(22, 12, 22);
      var roofMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6B6B });
      var roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(tentX, 6, tentZ);
      scene.add(roof);

      // Red cross symbols on tent
      var crossGeometry = new THREE.BoxGeometry(3, 0.2, 0.8);
      var crossMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFF0000 });
      var crossH = new THREE.Mesh(crossGeometry, crossMaterial);
      crossH.position.set(tentX, 10, tentZ);
      scene.add(crossH);

      var crossV = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 3), crossMaterial);
      crossV.position.set(tentX, 10, tentZ);
      scene.add(crossV);

      // Tent poles
      for (var j = 0; j < 4; j++) {
        var poleX = tentX + (j % 2 === 0 ? -8 : 8);
        var poleZ = tentZ + (j < 2 ? -8 : 8);
        var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
        var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        var pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(poleX, 4, poleZ);
        scene.add(pole);
      }
    }
  }

  function createRefugeeShelters() {
    // Abstract refugee shelter clusters as boxes
    var shelterPositions = [
      { x: 80, z: -80 },
      { x: -80, z: -60 },
      { x: 60, z: 20 }
    ];

    shelterPositions.forEach(function(pos) {
      for (var i = 0; i < 5; i++) {
        var shapeGeometry = new THREE.BoxGeometry(8 + Math.random() * 4, 6, 8 + Math.random() * 4);
        var shapeMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(0.1, 0.3, 0.4 + Math.random() * 0.2),
          roughness: 0.9
        });
        var shape = new THREE.Mesh(shapeGeometry, shapeMaterial);
        shape.position.set(
          pos.x + Math.random() * 30 - 15,
          3,
          pos.z + Math.random() * 30 - 15
        );
        shape.castShadow = true;
        shape.receiveShadow = true;
        scene.add(shape);
      }
    });
  }

  function createLuggagePiles() {
    // Scattered abandoned luggage
    for (var i = 0; i < 15; i++) {
      var luggageGeometry = new THREE.BoxGeometry(
        1 + Math.random() * 2,
        0.8 + Math.random() * 1.5,
        1 + Math.random() * 2
      );
      var luggageMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.2, 0.7, 0.4),
        roughness: 0.8
      });
      var luggage = new THREE.Mesh(luggageGeometry, luggageMaterial);
      luggage.position.set(
        Math.random() * 150 - 75,
        0.5,
        Math.random() * 150 - 75
      );
      luggage.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      luggage.castShadow = true;
      luggage.receiveShadow = true;
      scene.add(luggage);
    }
  }

  function createAidVehicles() {
    // Three aid worker vehicles marked with UN/cross
    var vehiclePositions = [
      { x: -120, z: 60 },
      { x: 100, z: 80 },
      { x: 30, z: -100 }
    ];

    vehiclePositions.forEach(function(pos) {
      // Vehicle body
      var vehicleGeometry = new THREE.BoxGeometry(8, 5, 16);
      var vehicleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
      var vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
      vehicle.position.set(pos.x, 2.5, pos.z);
      vehicle.castShadow = true;
      vehicle.receiveShadow = true;
      scene.add(vehicle);

      // Cabin
      var cabinGeometry = new THREE.BoxGeometry(6, 4, 6);
      var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC });
      var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
      cabin.position.set(pos.x, 4, pos.z - 4);
      cabin.castShadow = true;
      scene.add(cabin);

      // Red cross symbol
      var crossGeometry = new THREE.BoxGeometry(2, 0.2, 0.6);
      var crossMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFF0000 });
      var crossH = new THREE.Mesh(crossGeometry, crossMaterial);
      crossH.position.set(pos.x, 7, pos.z);
      scene.add(crossH);

      var crossV = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 2), crossMaterial);
      crossV.position.set(pos.x, 7, pos.z);
      scene.add(crossV);

      // Wheels
      for (var w = 0; w < 4; w++) {
        var wheelX = pos.x + (w < 2 ? -3 : 3);
        var wheelZ = pos.z + (w % 2 === 0 ? -5 : 5);
        var wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 16);
        var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheelX, 1.2, wheelZ);
        scene.add(wheel);
      }
    });
  }

  function createBurningCarBarricade() {
    // Burning car at barricade
    var carX = 0;
    var carZ = -80;

    // Car body
    var carGeometry = new THREE.BoxGeometry(4, 3, 8);
    var carMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x660000 });
    var carBody = new THREE.Mesh(carGeometry, carMaterial);
    carBody.position.set(carX, 1.5, carZ);
    carBody.castShadow = true;
    scene.add(carBody);

    // Windows
    var windowGeometry = new THREE.BoxGeometry(3, 1.5, 0.2);
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
    var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(carX - 1, 3, carZ - 2);
    scene.add(window1);

    var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(carX - 1, 3, carZ + 2);
    scene.add(window2);

    // Wheels
    for (var w = 0; w < 4; w++) {
      var wheelX = carX + (w < 2 ? -1.5 : 1.5);
      var wheelZ = carZ + (w % 2 === 0 ? -2.5 : 2.5);
      var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 12);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, 0.8, wheelZ);
      scene.add(wheel);
    }

    // Fire spheres above car
    for (var f = 0; f < 4; f++) {
      var fireGeometry = new THREE.SphereGeometry(1.5 + Math.random() * 1, 8, 8);
      var fireMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF4500,
        emissive: 0xFF6600,
        emissiveIntensity: 0.8
      });
      var fire = new THREE.Mesh(fireGeometry, fireMaterial);
      fire.position.set(
        carX + Math.random() * 2 - 1,
        4 + f * 1.5,
        carZ + Math.random() * 1 - 0.5
      );
      fireParticles.push({
        mesh: fire,
        velocity: new THREE.Vector3(Math.random() * 0.01 - 0.005, Math.random() * 0.02 + 0.01, 0),
        life: 0,
        maxLife: 100 + Math.random() * 50
      });
      scene.add(fire);
    }
  }

  function createDownedHelicopter() {
    var heliX = 120;
    var heliZ = 0;

    // Fuselage
    var fuselageGeometry = new THREE.BoxGeometry(5, 4, 18);
    var fuselageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    var fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.position.set(heliX, 2, heliZ);
    fuselage.castShadow = true;
    scene.add(fuselage);

    // Cockpit
    var cockpitGeometry = new THREE.BoxGeometry(4, 3, 6);
    var cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x1a6b1a });
    var cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(heliX, 4, heliZ + 6);
    cockpit.castShadow = true;
    scene.add(cockpit);

    // Rotor hub
    var hubGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8);
    var hubMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    heliRotor = new THREE.Mesh(hubGeometry, hubMaterial);
    heliRotor.position.set(heliX, 7, heliZ);
    scene.add(heliRotor);

    // Rotor blades
    for (var b = 0; b < 4; b++) {
      var bladeGeometry = new THREE.BoxGeometry(15, 0.3, 2);
      var bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
      var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.set(heliX, 7, heliZ);
      blade.rotation.z = (b * Math.PI / 2);
      heliRotor.add(blade);
    }

    // Landing skids
    for (var s = 0; s < 2; s++) {
      var skidX = heliX + (s === 0 ? -3 : 3);
      var skidGeometry = new THREE.BoxGeometry(1, 0.5, 10);
      var skidMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var skid = new THREE.Mesh(skidGeometry, skidMaterial);
      skid.position.set(skidX, 0.25, heliZ);
      scene.add(skid);
    }
  }

  function createSandbagRing() {
    // Circular defensive perimeter
    var ringRadius = 100;
    var segments = 24;

    for (var i = 0; i < segments; i++) {
      var angle = (i / segments) * Math.PI * 2;
      var x = Math.cos(angle) * ringRadius;
      var z = Math.sin(angle) * ringRadius;

      var bagGeometry = new THREE.BoxGeometry(4, 1.5, 2);
      var bagMaterial = new THREE.MeshStandardMaterial({ color: 0xCD853F });
      var bag = new THREE.Mesh(bagGeometry, bagMaterial);
      bag.position.set(x, 0.75, z);
      bag.rotation.y = angle;
      bag.castShadow = true;
      scene.add(bag);
    }
  }

  function createWaterDistribution() {
    var waterX = -120;
    var waterZ = -40;

    // Water tanker
    var tankGeometry = new THREE.CylinderGeometry(3, 3, 6, 16);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x4169E1 });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(waterX, 3, waterZ);
    tank.castShadow = true;
    scene.add(tank);

    // Tank stand
    var standGeometry = new THREE.BoxGeometry(8, 0.5, 2);
    var standMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var stand = new THREE.Mesh(standGeometry, standMaterial);
    stand.position.set(waterX, 6.5, waterZ);
    scene.add(stand);

    // Distribution table
    var tableTopGeometry = new THREE.BoxGeometry(8, 0.4, 4);
    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    var tableTop = new THREE.Mesh(tableTopGeometry, tableMaterial);
    tableTop.position.set(waterX + 10, 1, waterZ);
    scene.add(tableTop);

    // Table legs
    for (var l = 0; l < 4; l++) {
      var legX = waterX + 10 + (l < 2 ? -3 : 3);
      var legZ = waterZ + (l % 2 === 0 ? -1.5 : 1.5);
      var legGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      var legMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(legX, 0.5, legZ);
      scene.add(leg);
    }
  }

  function createStretchers() {
    // Medical stretchers scattered
    for (var i = 0; i < 6; i++) {
      var stretcherX = Math.random() * 80 - 40;
      var stretcherZ = Math.random() * 80 - 40;

      // Stretcher frame
      var frameGeometry = new THREE.BoxGeometry(2, 0.3, 8);
      var frameMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA });
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(stretcherX, 0.5, stretcherZ);
      scene.add(frame);

      // Fabric/canvas
      var fabricGeometry = new THREE.BoxGeometry(2.2, 0.1, 7.8);
      var fabricMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
      var fabric = new THREE.Mesh(fabricGeometry, fabricMaterial);
      fabric.position.set(stretcherX, 0.7, stretcherZ);
      scene.add(fabric);

      // Legs
      for (var l = 0; l < 4; l++) {
        var legX = stretcherX + (l < 2 ? -0.8 : 0.8);
        var legZ = stretcherZ + (l % 2 === 0 ? -3.5 : 3.5);
        var legGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.3);
        var legMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        var leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(legX, 0.25, legZ);
        scene.add(leg);
      }
    }
  }

  function createMedicalCrates() {
    // Red medical supply crates with cross markings
    for (var i = 0; i < 8; i++) {
      var crateX = Math.random() * 100 - 50;
      var crateZ = Math.random() * 100 - 50;

      var crateGeometry = new THREE.BoxGeometry(3, 3, 3);
      var crateMaterial = new THREE.MeshStandardMaterial({ color: 0xCC0000 });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(crateX, 1.5, crateZ);
      crate.castShadow = true;
      scene.add(crate);

      // White cross on crate
      var crossGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.4);
      var crossMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF });
      var crossH = new THREE.Mesh(crossGeometry, crossMaterial);
      crossH.position.set(crateX, 3.1, crateZ);
      scene.add(crossH);

      var crossV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 1.2), crossMaterial);
      crossV.position.set(crateX, 3.1, crateZ);
      scene.add(crossV);
    }
  }

  function createCommunicationAntenna() {
    var antennaX = 130;
    var antennaZ = 50;

    // Main mast
    var mastGeometry = new THREE.CylinderGeometry(0.4, 0.4, 25, 8);
    var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(antennaX, 12.5, antennaZ);
    mast.castShadow = true;
    scene.add(mast);

    // Antenna dish
    var dishGeometry = new THREE.SphereGeometry(1.5, 12, 12);
    var dishMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.scale.set(1, 0.5, 1);
    dish.position.set(antennaX, 24, antennaZ);
    scene.add(dish);

    // Guy wires (LineSegments)
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = [];

    // Add anchor points
    for (var w = 0; w < 3; w++) {
      var wireAngle = (w / 3) * Math.PI * 2;
      var wireX = antennaX + Math.cos(wireAngle) * 15;
      var wireZ = antennaZ + Math.sin(wireAngle) * 15;

      wirePositions.push(antennaX, 20, antennaZ);
      wirePositions.push(wireX, 1, wireZ);
    }

    wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePositions), 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var wires = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wires);
  }

  function createSmokeMarkers() {
    // Colored smoke grenades
    var smokePositions = [
      { x: 50, z: 50, color: 0xFF0000 },
      { x: -50, z: -50, color: 0x00FF00 },
      { x: 50, z: -50, color: 0x0000FF }
    ];

    smokePositions.forEach(function(pos) {
      // Grenade body
      var grenadeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
      var grenadeMaterial = new THREE.MeshStandardMaterial({ color: pos.color });
      var grenade = new THREE.Mesh(grenadeGeometry, grenadeMaterial);
      grenade.position.set(pos.x, 0.6, pos.z);
      scene.add(grenade);

      // Smoke particles rising
      for (var s = 0; s < 5; s++) {
        var smokeGeometry = new THREE.SphereGeometry(0.8 + Math.random() * 0.5, 6, 6);
        var smokeMaterial = new THREE.MeshStandardMaterial({
          color: pos.color,
          transparent: true,
          opacity: 0.6,
          roughness: 1
        });
        var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.set(
          pos.x + Math.random() * 2 - 1,
          2 + s * 0.5,
          pos.z + Math.random() * 2 - 1
        );
        smokeParticles.push({
          mesh: smoke,
          velocity: new THREE.Vector3(Math.random() * 0.02 - 0.01, 0.015 + Math.random() * 0.005, Math.random() * 0.02 - 0.01),
          life: 0,
          maxLife: 150 + Math.random() * 50,
          originalColor: pos.color
        });
        scene.add(smoke);
      }
    });
  }

  function createEscortPositions() {
    // Armed escort firing positions (sandbag fortifications)
    var positions = [
      { x: -100, z: 50 },
      { x: 100, z: 50 },
      { x: 0, z: -100 }
    ];

    positions.forEach(function(pos) {
      // Sandbag wall
      for (var i = 0; i < 3; i++) {
        var bagGeometry = new THREE.BoxGeometry(3, 1, 2);
        var bagMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
        var bag = new THREE.Mesh(bagGeometry, bagMaterial);
        bag.position.set(pos.x + i * 3.5, 0.5, pos.z);
        scene.add(bag);
      }

      // Elevated firing platform
      var platformGeometry = new THREE.BoxGeometry(6, 0.4, 6);
      var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(pos.x, 1.2, pos.z - 5);
      scene.add(platform);

      // Guard post marker
      var markerGeometry = new THREE.ConeGeometry(1, 3, 8);
      var markerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFF8800 });
      var marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(pos.x, 2, pos.z - 5);
      scene.add(marker);
    });
  }

  function createCheckpointBarrier() {
    var barrierX = 0;
    var barrierZ = 80;

    // Barrier boom (gate arm)
    var boomGeometry = new THREE.BoxGeometry(20, 0.6, 0.6);
    var boomMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDD00 });
    var boom = new THREE.Mesh(boomGeometry, boomMaterial);
    boom.position.set(barrierX, 2, barrierZ);
    boom.castShadow = true;
    scene.add(boom);

    // Boom support post
    var postGeometry = new THREE.CylinderGeometry(0.6, 0.8, 4, 8);
    var postMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(barrierX - 8, 2, barrierZ);
    post.castShadow = true;
    scene.add(post);

    // Guard booth
    var boothGeometry = new THREE.BoxGeometry(3, 2.5, 3);
    var boothMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA });
    var booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.set(barrierX + 8, 1.25, barrierZ + 3);
    booth.castShadow = true;
    scene.add(booth);

    // Barrier wall sections
    for (var i = 0; i < 3; i++) {
      var wallGeometry = new THREE.BoxGeometry(1.5, 2, 4);
      var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(barrierX + i * 4 - 4, 1, barrierZ - 6);
      scene.add(wall);
    }
  }

  function createFloodlightTowers() {
    // Tall floodlight towers
    var towerPositions = [
      { x: -150, z: -150 },
      { x: 150, z: -150 },
      { x: -150, z: 150 },
      { x: 150, z: 150 }
    ];

    towerPositions.forEach(function(pos) {
      // Tower base/mast
      var mastGeometry = new THREE.CylinderGeometry(1, 1.2, 30, 8);
      var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
      var mast = new THREE.Mesh(mastGeometry, mastMaterial);
      mast.position.set(pos.x, 15, pos.z);
      mast.castShadow = true;
      scene.add(mast);

      // Floodlight head
      var lightHeadGeometry = new THREE.SphereGeometry(1.5, 12, 12);
      var lightHeadMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0xFFFFCC,
        emissiveIntensity: 0.5
      });
      var lightHead = new THREE.Mesh(lightHeadGeometry, lightHeadMaterial);
      lightHead.position.set(pos.x, 29, pos.z);
      floodlights.push({
        mesh: lightHead,
        baseX: pos.x,
        baseZ: pos.z
      });
      scene.add(lightHead);

      // Point light for illumination
      var pointLight = new THREE.PointLight(0xFFFFFF, 1.5, 300);
      pointLight.position.set(pos.x, 28, pos.z);
      pointLight.castShadow = true;
      scene.add(pointLight);
    });
  }

  function initializeParticles() {
    // Smoke and fire particles initialized in creation functions
  }

  function update(delta) {
    if (!scene) return;

    animationState.rotor += delta * 3;
    animationState.fireFlicker += delta * 8;
    animationState.smokeRise += delta;
    animationState.floodlightSweep += delta * 0.5;

    // Rotate helicopter rotor
    if (heliRotor) {
      heliRotor.rotation.z = animationState.rotor;
    }

    // Update fire particles
    for (var f = 0; f < fireParticles.length; f++) {
      var particle = fireParticles[f];
      particle.life += delta;

      if (particle.life >= particle.maxLife) {
        particle.life = 0;
        particle.mesh.position.y -= 5;
      }

      particle.mesh.position.add(particle.velocity);

      var flicker = Math.sin(animationState.fireFlicker + f) * 0.3 + 0.7;
      particle.mesh.material.emissiveIntensity = flicker;
      particle.mesh.scale.set(flicker, flicker, flicker);
    }

    // Update smoke particles
    for (var s = 0; s < smokeParticles.length; s++) {
      var smoke = smokeParticles[s];
      smoke.life += delta;

      if (smoke.life >= smoke.maxLife) {
        smoke.life = 0;
        smoke.mesh.position.y -= 10;
      }

      smoke.mesh.position.add(smoke.velocity);
      smoke.mesh.material.opacity = 0.6 * (1 - smoke.life / smoke.maxLife);
    }

    // Sweep floodlights
    for (var l = 0; l < floodlights.length; l++) {
      var light = floodlights[l];
      var sweep = Math.sin(animationState.floodlightSweep + l) * 20;
      light.mesh.position.x = light.baseX + sweep;
    }
  }

  function reset() {
    animationState.rotor = 0;
    animationState.fireFlicker = 0;
    animationState.smokeRise = 0;
    animationState.floodlightSweep = 0;

    for (var f = 0; f < fireParticles.length; f++) {
      fireParticles[f].life = 0;
    }

    for (var s = 0; s < smokeParticles.length; s++) {
      smokeParticles[s].life = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
