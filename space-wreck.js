window.SpaceWreck = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var debrisObjects = [];
  var engineGlows = [];
  var energyCore = null;
  var containmentSegments = [];
  var time = 0;

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    objects = [];
    debrisObjects = [];
    engineGlows = [];
    containmentSegments = [];
    time = 0;

    // Set scene background to space
    scene.background = new THREE.Color(0x0a0a15);
    scene.fog = new THREE.Fog(0x0a0a15, 150, 300);

    createImpactCrater();
    createMainFuselage();
    createEngineNacelles();
    createDebrisField();
    createCrewCompartment();
    createNavigationConsole();
    createCargoBay();
    createWingSection();
    createLandingStrut();
    createEnergyCore();
    createAlienTechnology();
    createMilitaryRecoveryCamp();
    createContainmentField();

    // Add ambient and point lights
    var ambientLight = new THREE.AmbientLight(0x4a4a6a, 0.4);
    scene.add(ambientLight);
    objects.push(ambientLight);

    var pointLight1 = new THREE.PointLight(0x00ff88, 2, 100);
    pointLight1.position.set(0, 20, -10);
    scene.add(pointLight1);
    objects.push(pointLight1);

    var pointLight2 = new THREE.PointLight(0xff6600, 1.5, 80);
    pointLight2.position.set(-30, 15, 20);
    scene.add(pointLight2);
    objects.push(pointLight2);
  }

  function createImpactCrater() {
    var craterMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      emissive: 0x0d0d0d,
      shininess: 5,
      flatShading: true
    });

    // Main crater depression - large box at ground level
    var craterGeometry = new THREE.BoxGeometry(85, 8, 85);
    var crater = new THREE.Mesh(craterGeometry, craterMaterial);
    crater.position.set(0, -4, 0);
    crater.castShadow = true;
    crater.receiveShadow = true;
    scene.add(crater);
    objects.push(crater);

    // Crater rim - raised scorched edges
    var rimMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a1a0a,
      emissive: 0x1a0a00,
      shininess: 3
    });

    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var rimGeometry = new THREE.BoxGeometry(15, 3, 4);
      var rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.position.set(
        Math.cos(angle) * 43,
        -2,
        Math.sin(angle) * 43
      );
      rim.rotation.y = angle;
      scene.add(rim);
      objects.push(rim);
    }

    // Scorched ground rings
    var scorchMaterial = new THREE.MeshPhongMaterial({
      color: 0x0d0d0d,
      emissive: 0x1a0a00,
      transparent: true,
      opacity: 0.6
    });

    for (var j = 0; j < 4; j++) {
      var scorchRadius = 50 + (j * 8);
      var scorchSegments = 24 + (j * 4);
      for (var k = 0; k < scorchSegments; k++) {
        var sAngle = (k / scorchSegments) * Math.PI * 2;
        var sGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.5);
        var scorch = new THREE.Mesh(sGeometry, scorchMaterial);
        scorch.position.set(
          Math.cos(sAngle) * scorchRadius,
          -3.9,
          Math.sin(sAngle) * scorchRadius
        );
        scene.add(scorch);
        objects.push(scorch);
      }
    }
  }

  function createMainFuselage() {
    var metallicMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a5568,
      emissive: 0x1a1a2e,
      shininess: 80,
      flatShading: false
    });

    var damagedMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a3a48,
      emissive: 0x0a0a1a,
      shininess: 20,
      flatShading: true
    });

    // Main fuselage body - elongated
    var fuselageGeometry = new THREE.BoxGeometry(12, 15, 65);
    var fuselage = new THREE.Mesh(fuselageGeometry, metallicMaterial);
    fuselage.position.set(0, 8, 0);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    scene.add(fuselage);
    objects.push(fuselage);

    // Fuselage split damage
    var splitGeometry = new THREE.BoxGeometry(13, 8, 20);
    var split = new THREE.Mesh(splitGeometry, damagedMaterial);
    split.position.set(8, 10, -15);
    split.rotation.z = 0.3;
    scene.add(split);
    objects.push(split);

    // Gouge damage section
    var gougeGeometry = new THREE.BoxGeometry(10, 6, 18);
    var gouge = new THREE.Mesh(gougeGeometry, damagedMaterial);
    gouge.position.set(-7, 12, 20);
    gouge.rotation.z = -0.2;
    scene.add(gouge);
    objects.push(gouge);

    // Hull plating sections
    for (var i = 0; i < 12; i++) {
      var hullGeometry = new THREE.BoxGeometry(11, 2, 5);
      var hull = new THREE.Mesh(hullGeometry, metallicMaterial);
      hull.position.set(
        (i % 2) * 8 - 4,
        5 + (i % 3) * 3,
        (i * 5.5) - 33
      );
      scene.add(hull);
      objects.push(hull);
    }
  }

  function createEngineNacelles() {
    var engineMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      emissive: 0x2a4a7e,
      shininess: 60
    });

    var glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0.8
    });

    // Engine pod 1 - left
    var engine1Geometry = new THREE.CylinderGeometry(3.5, 3.5, 18, 16);
    var engine1 = new THREE.Mesh(engine1Geometry, engineMaterial);
    engine1.position.set(-18, 10, -20);
    engine1.rotation.z = 0.3;
    engine1.castShadow = true;
    scene.add(engine1);
    objects.push(engine1);

    var glow1Geometry = new THREE.CylinderGeometry(3.3, 3.3, 0.5, 16);
    var glow1 = new THREE.Mesh(glow1Geometry, glowMaterial);
    glow1.position.set(-18, 18.5, -20);
    scene.add(glow1);
    objects.push(glow1);
    engineGlows.push({ mesh: glow1, intensity: Math.random() * 0.5 + 0.3 });

    // Engine pod 2 - right
    var engine2Geometry = new THREE.CylinderGeometry(3.5, 3.5, 18, 16);
    var engine2 = new THREE.Mesh(engine2Geometry, engineMaterial);
    engine2.position.set(18, 10, -20);
    engine2.rotation.z = -0.3;
    engine2.castShadow = true;
    scene.add(engine2);
    objects.push(engine2);

    var glow2Geometry = new THREE.CylinderGeometry(3.3, 3.3, 0.5, 16);
    var glow2 = new THREE.Mesh(glow2Geometry, glowMaterial);
    glow2.position.set(18, 18.5, -20);
    scene.add(glow2);
    objects.push(glow2);
    engineGlows.push({ mesh: glow2, intensity: Math.random() * 0.5 + 0.3 });

    // Engine pod 3 - detached, fallen
    var engine3Geometry = new THREE.CylinderGeometry(3.5, 3.5, 18, 16);
    var engine3 = new THREE.Mesh(engine3Geometry, engineMaterial);
    engine3.position.set(35, 3, -35);
    engine3.rotation.set(1.2, 0.4, 0.6);
    scene.add(engine3);
    objects.push(engine3);

    var glow3Geometry = new THREE.CylinderGeometry(3.3, 3.3, 0.5, 16);
    var glow3 = new THREE.Mesh(glow3Geometry, glowMaterial);
    glow3.position.set(35, 12, -35);
    scene.add(glow3);
    objects.push(glow3);
    engineGlows.push({ mesh: glow3, intensity: Math.random() * 0.3 + 0.1 });

    // Engine intake rings
    for (var i = 0; i < 3; i++) {
      var intakeGeometry = new THREE.CylinderGeometry(4.2, 4.2, 0.8, 16);
      var intake = new THREE.Mesh(intakeGeometry, engineMaterial);
      intake.position.set(-18, 8 - i * 4, -20);
      scene.add(intake);
      objects.push(intake);
    }

    for (var j = 0; j < 3; j++) {
      var intakeGeometry2 = new THREE.CylinderGeometry(4.2, 4.2, 0.8, 16);
      var intake2 = new THREE.Mesh(intakeGeometry2, engineMaterial);
      intake2.position.set(18, 8 - j * 4, -20);
      scene.add(intake2);
      objects.push(intake2);
    }
  }

  function createDebrisField() {
    var debrisMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x6a7a8a, shininess: 40 }),
      new THREE.MeshPhongMaterial({ color: 0x3a4a5a, shininess: 30 }),
      new THREE.MeshPhongMaterial({ color: 0x4a5a6a, shininess: 50 }),
      new THREE.MeshPhongMaterial({ color: 0x2a3a4a, shininess: 20 })
    ];

    var sphereMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x5a6a7a, shininess: 60 }),
      new THREE.MeshPhongMaterial({ color: 0x4a5a6a, shininess: 40 }),
      new THREE.MeshPhongMaterial({ color: 0x1a2a3a, shininess: 25 })
    ];

    // Box debris scattered around
    for (var i = 0; i < 120; i++) {
      var bGeometry = new THREE.BoxGeometry(
        Math.random() * 4 + 0.5,
        Math.random() * 3 + 0.5,
        Math.random() * 4 + 0.5
      );
      var bMaterial = debrisMaterials[Math.floor(Math.random() * debrisMaterials.length)];
      var debris = new THREE.Mesh(bGeometry, bMaterial);

      var distance = Math.random() * 50 + 15;
      var angle = Math.random() * Math.PI * 2;
      var height = Math.random() * 20 - 2;

      debris.position.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );

      debris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      debris.castShadow = true;
      debris.receiveShadow = true;
      scene.add(debris);
      objects.push(debris);
      debrisObjects.push({
        mesh: debris,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        )
      });
    }

    // Sphere debris
    for (var j = 0; j < 75; j++) {
      var sGeometry = new THREE.SphereGeometry(Math.random() * 1.5 + 0.3, 8, 8);
      var sMaterial = sphereMaterials[Math.floor(Math.random() * sphereMaterials.length)];
      var sphereDebris = new THREE.Mesh(sGeometry, sMaterial);

      var sDistance = Math.random() * 50 + 15;
      var sAngle = Math.random() * Math.PI * 2;
      var sHeight = Math.random() * 25 - 5;

      sphereDebris.position.set(
        Math.cos(sAngle) * sDistance,
        sHeight,
        Math.sin(sAngle) * sDistance
      );

      sphereDebris.castShadow = true;
      sphereDebris.receiveShadow = true;
      scene.add(sphereDebris);
      objects.push(sphereDebris);
      debrisObjects.push({
        mesh: sphereDebris,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        )
      });
    }
  }

  function createCrewCompartment() {
    var compartmentMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a4a5a,
      emissive: 0x0a1a2a,
      shininess: 40
    });

    var interiorMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a3a4a,
      emissive: 0x1a1a2a,
      shininess: 30
    });

    // Crew compartment exterior shell
    var compartmentGeometry = new THREE.BoxGeometry(10, 12, 15);
    var compartment = new THREE.Mesh(compartmentGeometry, compartmentMaterial);
    compartment.position.set(-15, 5, 15);
    compartment.castShadow = true;
    scene.add(compartment);
    objects.push(compartment);

    // Interior walls
    for (var i = 0; i < 3; i++) {
      var wallGeometry = new THREE.BoxGeometry(9, 11, 0.8);
      var wall = new THREE.Mesh(wallGeometry, interiorMaterial);
      wall.position.set(-15, 5, 10 + i * 2);
      scene.add(wall);
      objects.push(wall);
    }

    // Crew seating areas
    var seatMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a2a3a,
      shininess: 20
    });

    for (var j = 0; j < 4; j++) {
      var seatGeometry = new THREE.BoxGeometry(2.5, 2, 2.5);
      var seat = new THREE.Mesh(seatGeometry, seatMaterial);
      seat.position.set(-16 + (j % 2) * 4, 1, 12 + Math.floor(j / 2) * 3);
      scene.add(seat);
      objects.push(seat);
    }

    // Equipment racks
    for (var k = 0; k < 3; k++) {
      var rackGeometry = new THREE.BoxGeometry(1.5, 6, 3);
      var rack = new THREE.Mesh(rackGeometry, interiorMaterial);
      rack.position.set(-10 + k * 5, 5, 22);
      scene.add(rack);
      objects.push(rack);
    }
  }

  function createNavigationConsole() {
    var consoleMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      emissive: 0x0a0a1a,
      shininess: 60
    });

    var displayMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aa44,
      emissive: 0x00ff66
    });

    // Console control panel - main
    var panelGeometry = new THREE.BoxGeometry(8, 6, 2);
    var panel = new THREE.Mesh(panelGeometry, consoleMaterial);
    panel.position.set(0, 8, 28);
    scene.add(panel);
    objects.push(panel);

    // Glowing display spheres on console
    for (var i = 0; i < 6; i++) {
      var displayGeometry = new THREE.SphereGeometry(0.6, 12, 12);
      var display = new THREE.Mesh(displayGeometry, displayMaterial);
      display.position.set(-2.5 + i * 1, 9.5, 28.2);
      scene.add(display);
      objects.push(display);
    }

    // Control buttons - small spheres
    for (var j = 0; j < 12; j++) {
      var buttonGeometry = new THREE.SphereGeometry(0.25, 8, 8);
      var buttonMaterial = new THREE.MeshPhongMaterial({
        color: 0xff6600,
        emissive: 0xffaa33,
        shininess: 40
      });
      var button = new THREE.Mesh(buttonGeometry, buttonMaterial);
      button.position.set(
        -3 + (j % 4) * 2,
        5 + Math.floor(j / 4) * 1.5,
        28.2
      );
      scene.add(button);
      objects.push(button);
    }

    // Console pedestal
    var pedestalGeometry = new THREE.CylinderGeometry(1.5, 2, 8, 12);
    var pedestal = new THREE.Mesh(pedestalGeometry, consoleMaterial);
    pedestal.position.set(0, 0, 28);
    scene.add(pedestal);
    objects.push(pedestal);
  }

  function createCargoBay() {
    var bayMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a5a6a,
      emissive: 0x1a1a2a,
      shininess: 35
    });

    var containerMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aa88,
      emissive: 0x0a5a4a,
      shininess: 50
    });

    // Cargo bay open section
    var bayGeometry = new THREE.BoxGeometry(16, 14, 20);
    var bay = new THREE.Mesh(bayGeometry, bayMaterial);
    bay.position.set(20, 6, 0);
    scene.add(bay);
    objects.push(bay);

    // Alien containers - cylindrical
    for (var i = 0; i < 9; i++) {
      var containerGeometry = new THREE.CylinderGeometry(2.2, 2.2, 5, 14);
      var container = new THREE.Mesh(containerGeometry, containerMaterial);
      container.position.set(
        15 + (i % 3) * 4,
        2 + Math.floor(i / 3) * 5,
        -5 + (i % 3) * 3
      );
      scene.add(container);
      objects.push(container);
    }

    // Container lids
    for (var j = 0; j < 9; j++) {
      var lidGeometry = new THREE.CylinderGeometry(2.3, 2.3, 0.4, 14);
      var lid = new THREE.Mesh(lidGeometry, containerMaterial);
      lid.position.set(
        15 + (j % 3) * 4,
        6.5 + Math.floor(j / 3) * 5,
        -5 + (j % 3) * 3
      );
      scene.add(lid);
      objects.push(lid);
    }

    // Cargo straps and restraints
    var strapGeometry = new THREE.BoxGeometry(15, 0.3, 0.5);
    for (var k = 0; k < 4; k++) {
      var strap = new THREE.Mesh(strapGeometry, bayMaterial);
      strap.position.set(20, 1 + k * 3, 0);
      scene.add(strap);
      objects.push(strap);
    }
  }

  function createWingSection() {
    var wingMaterial = new THREE.MeshPhongMaterial({
      color: 0x5a6a7a,
      emissive: 0x1a1a2a,
      shininess: 45,
      flatShading: false
    });

    // Wing panel - large flat section
    var wingGeometry = new THREE.BoxGeometry(30, 2, 12);
    var wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.set(-35, 8, 10);
    wing.rotation.z = 0.4;
    wing.rotation.x = 0.15;
    wing.castShadow = true;
    wing.receiveShadow = true;
    scene.add(wing);
    objects.push(wing);

    // Wing support struts
    for (var i = 0; i < 4; i++) {
      var strutGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8, 10);
      var strut = new THREE.Mesh(strutGeometry, wingMaterial);
      strut.position.set(-30 + i * 8, 4, 10);
      strut.rotation.z = 0.3;
      scene.add(strut);
      objects.push(strut);
    }

    // Wing damage - torn section
    var tearGeometry = new THREE.BoxGeometry(8, 1.5, 5);
    var tear = new THREE.Mesh(tearGeometry, wingMaterial);
    tear.position.set(-45, 9, 8);
    tear.rotation.z = 0.5;
    scene.add(tear);
    objects.push(tear);

    // Wing control surfaces
    for (var j = 0; j < 3; j++) {
      var controlGeometry = new THREE.BoxGeometry(3, 0.8, 2);
      var control = new THREE.Mesh(controlGeometry, wingMaterial);
      control.position.set(-25 + j * 12, 9.5, 11);
      control.rotation.z = Math.random() * 0.4 - 0.2;
      scene.add(control);
      objects.push(control);
    }
  }

  function createLandingStrut() {
    var strutMaterial = new THREE.MeshPhongMaterial({
      color: 0x6a7a8a,
      emissive: 0x1a2a3a,
      shininess: 60
    });

    // Main strut cylinder - massive
    var strutGeometry = new THREE.CylinderGeometry(2.2, 2.5, 35, 16);
    var strut = new THREE.Mesh(strutGeometry, strutMaterial);
    strut.position.set(-40, -10, -30);
    strut.rotation.z = 0.5;
    strut.castShadow = true;
    strut.receiveShadow = true;
    scene.add(strut);
    objects.push(strut);

    // Strut foot pad
    var footGeometry = new THREE.BoxGeometry(6, 1.2, 8);
    var foot = new THREE.Mesh(footGeometry, strutMaterial);
    foot.position.set(-45, -27, -35);
    foot.castShadow = true;
    foot.receiveShadow = true;
    scene.add(foot);
    objects.push(foot);

    // Strut internal segments
    for (var i = 0; i < 6; i++) {
      var segmentGeometry = new THREE.CylinderGeometry(2.0, 2.0, 5, 12);
      var segment = new THREE.Mesh(segmentGeometry, strutMaterial);
      segment.position.set(-40, -8 - i * 5, -30);
      segment.rotation.z = 0.5;
      scene.add(segment);
      objects.push(segment);
    }

    // Damping pistons
    for (var j = 0; j < 3; j++) {
      var pistonGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 10);
      var piston = new THREE.Mesh(pistonGeometry, strutMaterial);
      piston.position.set(-38 + j * 3, -5, -28);
      piston.rotation.x = 0.4;
      scene.add(piston);
      objects.push(piston);
    }
  }

  function createEnergyCore() {
    var coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      emissive: 0x00ccff,
      transparent: true,
      opacity: 0.9
    });

    var coreGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      transparent: true,
      opacity: 0.6
    });

    // Main energy core sphere
    var coreGeometry = new THREE.SphereGeometry(5, 32, 32);
    energyCore = new THREE.Mesh(coreGeometry, coreMaterial);
    energyCore.position.set(5, 15, 0);
    scene.add(energyCore);
    objects.push(energyCore);

    // Core glow layer
    var glowGeometry = new THREE.SphereGeometry(5.3, 32, 32);
    var glow = new THREE.Mesh(glowGeometry, coreGlowMaterial);
    glow.position.set(5, 15, 0);
    scene.add(glow);
    objects.push(glow);

    // Energy discharge lines emanating from core
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var lineGeometry = new THREE.BoxGeometry(0.3, 0.3, 12);
      var lineMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff
      });
      var line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(
        5 + Math.cos(angle) * 8,
        15,
        Math.sin(angle) * 8
      );
      line.rotation.z = angle + Math.PI / 2;
      scene.add(line);
      objects.push(line);
    }

    // Containment breach crater around core
    for (var j = 0; j < 4; j++) {
      var breachGeometry = new THREE.BoxGeometry(4, 3, 4);
      var breachMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a2e,
        emissive: 0x0a3a5a
      });
      var breach = new THREE.Mesh(breachGeometry, breachMaterial);
      breach.position.set(
        5 + Math.cos(j * Math.PI / 2) * 6,
        14,
        Math.sin(j * Math.PI / 2) * 6
      );
      scene.add(breach);
      objects.push(breach);
    }
  }

  function createAlienTechnology() {
    var alienMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aa77,
      emissive: 0x0a6a55,
      shininess: 70
    });

    // Alien device cylinders scattered around
    for (var i = 0; i < 12; i++) {
      var deviceGeometry = new THREE.CylinderGeometry(
        Math.random() * 1.5 + 0.8,
        Math.random() * 1.5 + 0.8,
        Math.random() * 5 + 4,
        14
      );
      var device = new THREE.Mesh(deviceGeometry, alienMaterial);

      var dDistance = Math.random() * 40 + 10;
      var dAngle = Math.random() * Math.PI * 2;
      var dHeight = Math.random() * 15 - 2;

      device.position.set(
        Math.cos(dAngle) * dDistance,
        dHeight,
        Math.sin(dAngle) * dDistance
      );

      device.rotation.x = Math.random() * 0.6;
      device.rotation.y = Math.random() * Math.PI;
      device.rotation.z = Math.random() * 0.4;

      scene.add(device);
      objects.push(device);
    }

    // Alien control nodes - spheres
    for (var j = 0; j < 8; j++) {
      var nodeGeometry = new THREE.SphereGeometry(1.2, 12, 12);
      var nodeMaterial = new THREE.MeshPhongMaterial({
        color: 0x00dd99,
        emissive: 0x0a7a66,
        shininess: 80
      });
      var node = new THREE.Mesh(nodeGeometry, nodeMaterial);

      var nDistance = Math.random() * 35 + 12;
      var nAngle = Math.random() * Math.PI * 2;
      var nHeight = Math.random() * 20 - 1;

      node.position.set(
        Math.cos(nAngle) * nDistance,
        nHeight,
        Math.sin(nAngle) * nDistance
      );

      scene.add(node);
      objects.push(node);
    }
  }

  function createMilitaryRecoveryCamp() {
    var tentMaterial = new THREE.MeshPhongMaterial({
      color: 0x5a4a3a,
      emissive: 0x1a0a0a,
      shininess: 20
    });

    var equipmentMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a4a5a,
      emissive: 0x0a0a1a,
      shininess: 30
    });

    // Research tents around perimeter
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var radius = 50;

      // Tent frame
      var tentGeometry = new THREE.ConeGeometry(4, 5, 8);
      var tent = new THREE.Mesh(tentGeometry, tentMaterial);
      tent.position.set(
        Math.cos(angle) * radius,
        2.5,
        Math.sin(angle) * radius
      );
      scene.add(tent);
      objects.push(tent);

      // Tent base
      var baseGeometry = new THREE.BoxGeometry(8, 0.5, 8);
      var base = new THREE.Mesh(baseGeometry, tentMaterial);
      base.position.set(
        Math.cos(angle) * radius,
        0.25,
        Math.sin(angle) * radius
      );
      scene.add(base);
      objects.push(base);

      // Equipment inside tent area
      var equipGeometry = new THREE.BoxGeometry(3, 2, 2);
      var equip = new THREE.Mesh(equipGeometry, equipmentMaterial);
      equip.position.set(
        Math.cos(angle) * radius + Math.cos(angle + Math.PI / 4),
        1,
        Math.sin(angle) * radius + Math.sin(angle + Math.PI / 4)
      );
      scene.add(equip);
      objects.push(equip);
    }

    // Command center box
    var commandGeometry = new THREE.BoxGeometry(12, 4, 8);
    var command = new THREE.Mesh(commandGeometry, equipmentMaterial);
    command.position.set(-48, 2, -48);
    scene.add(command);
    objects.push(command);

    // Supply containers
    for (var j = 0; j < 5; j++) {
      var containerGeometry = new THREE.BoxGeometry(3, 2.5, 2.5);
      var container = new THREE.Mesh(containerGeometry, equipmentMaterial);
      container.position.set(-50 + j * 4, 1.25, -52);
      scene.add(container);
      objects.push(container);
    }
  }

  function createContainmentField() {
    var lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0088ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.6
    });

    // Create grid lines for containment field
    var gridSize = 40;
    var gridDivisions = 10;
    var cellSize = gridSize / gridDivisions;

    // Horizontal lines
    for (var x = -gridSize / 2; x <= gridSize / 2; x += cellSize) {
      var points = [
        new THREE.Vector3(x, 0, -gridSize / 2),
        new THREE.Vector3(x, 0, gridSize / 2)
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var line = new THREE.LineSegments(geometry, lineMaterial);
      scene.add(line);
      objects.push(line);
      containmentSegments.push(line);
    }

    // Vertical lines
    for (var z = -gridSize / 2; z <= gridSize / 2; z += cellSize) {
      var points2 = [
        new THREE.Vector3(-gridSize / 2, 0, z),
        new THREE.Vector3(gridSize / 2, 0, z)
      ];
      var geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
      var line2 = new THREE.LineSegments(geometry2, lineMaterial);
      scene.add(line2);
      objects.push(line2);
      containmentSegments.push(line2);
    }

    // Vertical edge lines
    var verticalMaterial = new THREE.LineBasicMaterial({
      color: 0x0066ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.4
    });

    for (var xi = -gridSize / 2; xi <= gridSize / 2; xi += cellSize) {
      var points3 = [
        new THREE.Vector3(xi, 0, -gridSize / 2),
        new THREE.Vector3(xi, 12, -gridSize / 2)
      ];
      var geometry3 = new THREE.BufferGeometry().setFromPoints(points3);
      var line3 = new THREE.LineSegments(geometry3, verticalMaterial);
      scene.add(line3);
      objects.push(line3);
      containmentSegments.push(line3);
    }

    for (var zi = -gridSize / 2; zi <= gridSize / 2; zi += cellSize) {
      var points4 = [
        new THREE.Vector3(-gridSize / 2, 0, zi),
        new THREE.Vector3(-gridSize / 2, 12, zi)
      ];
      var geometry4 = new THREE.BufferGeometry().setFromPoints(points4);
      var line4 = new THREE.LineSegments(geometry4, verticalMaterial);
      scene.add(line4);
      objects.push(line4);
      containmentSegments.push(line4);
    }

    for (var zi2 = -gridSize / 2; zi2 <= gridSize / 2; zi2 += cellSize) {
      var points5 = [
        new THREE.Vector3(gridSize / 2, 0, zi2),
        new THREE.Vector3(gridSize / 2, 12, zi2)
      ];
      var geometry5 = new THREE.BufferGeometry().setFromPoints(points5);
      var line5 = new THREE.LineSegments(geometry5, verticalMaterial);
      scene.add(line5);
      objects.push(line5);
      containmentSegments.push(line5);
    }
  }

  function update(delta) {
    time += delta;

    // Animate energy core pulsing
    if (energyCore) {
      var pulseScale = 1 + Math.sin(time * 3) * 0.15;
      energyCore.scale.set(pulseScale, pulseScale, pulseScale);
    }

    // Animate engine glow flickering
    for (var i = 0; i < engineGlows.length; i++) {
      var glow = engineGlows[i];
      var flicker = Math.sin(time * 5 + i) * 0.3 + glow.intensity;
      glow.mesh.material.opacity = Math.max(0.1, Math.min(1, flicker));
    }

    // Animate debris field rotation
    for (var j = 0; j < debrisObjects.length; j++) {
      var debrisObj = debrisObjects[j];
      debrisObj.mesh.rotation.x += debrisObj.rotationSpeed.x * delta;
      debrisObj.mesh.rotation.y += debrisObj.rotationSpeed.y * delta;
      debrisObj.mesh.rotation.z += debrisObj.rotationSpeed.z * delta;
    }

    // Animate containment field shimmer
    for (var k = 0; k < containmentSegments.length; k++) {
      var shimmer = Math.sin(time * 2 + k * 0.1) * 0.3 + 0.4;
      containmentSegments[k].material.opacity = shimmer;
    }
  }

  function reset() {
    // Remove all objects from scene
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);

      // Dispose of geometries and materials
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        if (Array.isArray(objects[i].material)) {
          for (var j = 0; j < objects[i].material.length; j++) {
            objects[i].material[j].dispose();
          }
        } else {
          objects[i].material.dispose();
        }
      }
    }

    objects = [];
    debrisObjects = [];
    engineGlows = [];
    containmentSegments = [];
    energyCore = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
