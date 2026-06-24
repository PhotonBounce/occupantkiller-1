var window = window || {};

window.WarFactory = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var lights = [];
  var particleSystems = [];
  var roboticArms = [];
  var stampingPresses = [];
  var conveyorBelts = [];
  var tanks = [];
  var sparkParticles = [];
  var elapsedTime = 0;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    sceneObjects = [];
    lights = [];
    particleSystems = [];
    roboticArms = [];
    stampingPresses = [];
    conveyorBelts = [];
    tanks = [];
    sparkParticles = [];
    elapsedTime = 0;

    // Main factory floor - gray-green concrete
    var floorGeometry = new THREE.BoxGeometry(60, 0.5, 50);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x555544,
      roughness: 0.9,
      metalness: 0.1
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.receiveShadow = true;
    floor.castShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);

    // Assembly line guide rails - steel rails
    createAssemblyLineRails();

    // Yellow caution floor markings - stripes along assembly line
    createCautionMarkings();

    // Conveyor belt surface with texture scrolling
    createConveyorBelt();

    // Overhead crane rail system
    createOverheadCraneRail();

    // Robotic welding arms - 3 stations
    createRoboticWeldingArms();

    // Stamping press machine
    createStampingPress();

    // Parts storage shelving racks
    createPartsStorage();

    // Tanks in various stages of completion
    createTankAssembly();

    // Supervisor office on raised platform
    createSupervisorOffice();

    // Shipping dock ramp
    createShippingDock();

    // Fire extinguisher stations
    createFireExtinguishers();

    // Tool pegboards on walls
    createToolPegboards();

    // Waste metal bins
    createWasteMetalBins();

    // Sparks particle system for welding
    createSparksParticleSystem();

    // Lighting
    createLights();

    return {
      sceneObjects: sceneObjects,
      tanks: tanks
    };
  }

  function createAssemblyLineRails() {
    // Two parallel guide rails running down the assembly line
    var railGeometry = new THREE.BoxGeometry(0.3, 0.3, 40);
    var railMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });

    var rail1 = new THREE.Mesh(railGeometry, railMaterial);
    rail1.position.set(-8, 0.5, 0);
    rail1.castShadow = true;
    rail1.receiveShadow = true;
    scene.add(rail1);
    sceneObjects.push(rail1);

    var rail2 = new THREE.Mesh(railGeometry, railMaterial);
    rail2.position.set(8, 0.5, 0);
    rail2.castShadow = true;
    rail2.receiveShadow = true;
    scene.add(rail2);
    sceneObjects.push(rail2);

    // Cross braces between rails
    for (var i = 0; i < 6; i++) {
      var braceGeometry = new THREE.BoxGeometry(16, 0.2, 0.3);
      var braceMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.7,
        roughness: 0.3
      });
      var brace = new THREE.Mesh(braceGeometry, braceMaterial);
      brace.position.set(0, 0.5, -16 + (i * 7));
      brace.castShadow = true;
      brace.receiveShadow = true;
      scene.add(brace);
      sceneObjects.push(brace);
    }
  }

  function createCautionMarkings() {
    // Yellow and black caution stripes
    var stripeWidth = 2;
    var stripeLength = 40;
    var stripeGeometry = new THREE.BoxGeometry(stripeWidth, 0.02, stripeLength);
    var stripeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFCC00,
      emissive: 0x880000,
      metalness: 0.5
    });

    // Left side stripes
    for (var i = 0; i < 4; i++) {
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(-15 + (i * 4), 0.3, 0);
      stripe.receiveShadow = true;
      scene.add(stripe);
      sceneObjects.push(stripe);
    }

    // Right side stripes
    for (var i = 0; i < 4; i++) {
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(11 + (i * 4), 0.3, 0);
      stripe.receiveShadow = true;
      scene.add(stripe);
      sceneObjects.push(stripe);
    }
  }

  function createConveyorBelt() {
    var beltGeometry = new THREE.BoxGeometry(3, 0.2, 40);
    var beltMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.4
    });

    var belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.position.set(0, 0.2, 0);
    belt.receiveShadow = true;
    belt.castShadow = true;
    scene.add(belt);
    sceneObjects.push(belt);

    conveyorBelts.push({
      mesh: belt,
      scrollOffset: 0,
      speed: 0.5
    });
  }

  function createOverheadCraneRail() {
    // Overhead rail structure
    var railGeometry = new THREE.BoxGeometry(50, 0.3, 0.5);
    var railMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.9,
      roughness: 0.1
    });

    var rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.set(0, 14, 0);
    rail.castShadow = true;
    rail.receiveShadow = true;
    scene.add(rail);
    sceneObjects.push(rail);

    // Overhead crane carriage - moves back and forth
    var carriageGeometry = new THREE.BoxGeometry(1, 0.8, 1);
    var carriageMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.8,
      roughness: 0.2
    });

    var carriage = new THREE.Mesh(carriageGeometry, carriageMaterial);
    carriage.position.set(-15, 13, 0);
    carriage.castShadow = true;
    carriage.receiveShadow = true;
    scene.add(carriage);
    sceneObjects.push(carriage);

    // Crane hook
    var hookGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    var hookMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.1
    });

    var hook = new THREE.Mesh(hookGeometry, hookMaterial);
    hook.position.set(-15, 10, 0);
    hook.castShadow = true;
    hook.receiveShadow = true;
    scene.add(hook);
    sceneObjects.push(hook);

    roboticArms.push({
      carriage: carriage,
      hook: hook,
      position: -15,
      direction: 1,
      speed: 8
    });
  }

  function createRoboticWeldingArms() {
    // Three welding arm stations
    var positions = [-12, 0, 12];

    for (var s = 0; s < 3; s++) {
      var x = positions[s];

      // Arm base - pedestal
      var baseGeometry = new THREE.CylinderGeometry(1, 1.5, 1, 8);
      var baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x334433,
        metalness: 0.7,
        roughness: 0.3
      });

      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(x, 0.5, 0);
      base.castShadow = true;
      base.receiveShadow = true;
      scene.add(base);
      sceneObjects.push(base);

      // Main arm segment 1 - vertical
      var arm1Geometry = new THREE.BoxGeometry(0.4, 3, 0.4);
      var arm1Material = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.8,
        roughness: 0.2
      });

      var arm1 = new THREE.Mesh(arm1Geometry, arm1Material);
      arm1.position.set(x, 2, 0);
      arm1.castShadow = true;
      arm1.receiveShadow = true;
      scene.add(arm1);
      sceneObjects.push(arm1);

      // Main arm segment 2 - angled
      var arm2Geometry = new THREE.BoxGeometry(0.3, 2.5, 0.3);
      var arm2Material = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.8,
        roughness: 0.2
      });

      var arm2 = new THREE.Mesh(arm2Geometry, arm2Material);
      arm2.position.set(x, 4.5, 1.5);
      arm2.castShadow = true;
      arm2.receiveShadow = true;
      scene.add(arm2);
      sceneObjects.push(arm2);

      // Welding torch head
      var torchGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
      var torchMaterial = new THREE.MeshStandardMaterial({
        color: 0xAA5500,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x660000,
        emissiveIntensity: 0.2
      });

      var torch = new THREE.Mesh(torchGeometry, torchMaterial);
      torch.position.set(x, 5, 2);
      torch.rotation.z = Math.PI / 2;
      torch.castShadow = true;
      torch.receiveShadow = true;
      scene.add(torch);
      sceneObjects.push(torch);

      roboticArms.push({
        base: base,
        arm1: arm1,
        arm2: arm2,
        torch: torch,
        index: s,
        rotation: 0,
        rotationSpeed: 1.5 + (s * 0.3)
      });
    }
  }

  function createStampingPress() {
    var x = -20;
    var y = 0;
    var z = -15;

    // Main press body - large frame
    var bodyGeometry = new THREE.BoxGeometry(4, 6, 3);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x334433,
      metalness: 0.6,
      roughness: 0.4
    });

    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y + 3, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    sceneObjects.push(body);

    // Press upper arm - moving piston
    var armGeometry = new THREE.BoxGeometry(3, 2, 2.5);
    var armMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.2
    });

    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(x, y + 6, z);
    arm.castShadow = true;
    arm.receiveShadow = true;
    scene.add(arm);
    sceneObjects.push(arm);

    // Die face - rectangular plate
    var dieGeometry = new THREE.BoxGeometry(2.5, 0.5, 2);
    var dieMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.05
    });

    var die = new THREE.Mesh(dieGeometry, dieMaterial);
    die.position.set(x, y + 5, z);
    die.castShadow = true;
    die.receiveShadow = true;
    scene.add(die);
    sceneObjects.push(die);

    stampingPresses.push({
      body: body,
      arm: arm,
      die: die,
      position: y + 6,
      minY: y + 4,
      maxY: y + 8,
      phase: 0,
      speed: 2
    });
  }

  function createPartsStorage() {
    var x = 25;
    var z = -18;

    // Create 3 shelving units
    for (var u = 0; u < 3; u++) {
      var unitZ = z + (u * 6);

      // Vertical support columns
      for (var c = 0; c < 2; c++) {
        var colX = x + (c * 3);
        var colGeometry = new THREE.BoxGeometry(0.4, 8, 0.4);
        var colMaterial = new THREE.MeshStandardMaterial({
          color: 0x666644,
          metalness: 0.5,
          roughness: 0.5
        });

        var column = new THREE.Mesh(colGeometry, colMaterial);
        column.position.set(colX, 4, unitZ);
        column.castShadow = true;
        column.receiveShadow = true;
        scene.add(column);
        sceneObjects.push(column);
      }

      // Horizontal shelves - 4 shelves per unit
      for (var sh = 0; sh < 4; sh++) {
        var shelfGeometry = new THREE.BoxGeometry(3.4, 0.3, 4);
        var shelfMaterial = new THREE.MeshStandardMaterial({
          color: 0x555544,
          metalness: 0.6,
          roughness: 0.4
        });

        var shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.set(x + 1.5, 1.5 + (sh * 2), unitZ);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        scene.add(shelf);
        sceneObjects.push(shelf);

        // Storage boxes on shelves
        for (var b = 0; b < 3; b++) {
          var boxGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
          var boxMaterial = new THREE.MeshStandardMaterial({
            color: 0x776655,
            metalness: 0.3,
            roughness: 0.6
          });

          var box = new THREE.Mesh(boxGeometry, boxMaterial);
          box.position.set(x + 0.5 + (b * 1.2), 2 + (sh * 2), unitZ - 1.5);
          box.castShadow = true;
          box.receiveShadow = true;
          scene.add(box);
          sceneObjects.push(box);
        }
      }
    }
  }

  function createTankAssembly() {
    // Tank 1: Hull only (no turret) - early stage
    var tank1Z = 15;
    var tank1 = createTankHull(0, tank1Z);
    scene.add(tank1);
    sceneObjects.push(tank1);
    tanks.push({
      group: tank1,
      stage: 1,
      position: tank1Z,
      speed: 0.2
    });

    // Tank 2: Hull with turret ring (mid-stage)
    var tank2Z = 0;
    var tank2 = createTankHull(0, tank2Z);
    var turretRing = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 8);
    var turretRingMat = new THREE.MeshStandardMaterial({
      color: 0x888866,
      metalness: 0.6,
      roughness: 0.3
    });
    var turretRingMesh = new THREE.Mesh(turretRing, turretRingMat);
    turretRingMesh.position.y = 1.5;
    turretRingMesh.castShadow = true;
    turretRingMesh.receiveShadow = true;
    tank2.add(turretRingMesh);
    scene.add(tank2);
    sceneObjects.push(tank2);
    tanks.push({
      group: tank2,
      stage: 2,
      position: tank2Z,
      speed: 0.15
    });

    // Tank 3: Complete tank (turret + gun)
    var tank3Z = -15;
    var tank3 = createTankHull(0, tank3Z);

    // Turret
    var turretGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 8);
    var turretMat = new THREE.MeshStandardMaterial({
      color: 0x777755,
      metalness: 0.7,
      roughness: 0.2
    });
    var turret = new THREE.Mesh(turretGeometry, turretMat);
    turret.position.y = 1.5;
    turret.castShadow = true;
    turret.receiveShadow = true;
    tank3.add(turret);

    // Gun barrel
    var gunGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 6);
    var gunMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.05
    });
    var gun = new THREE.Mesh(gunGeometry, gunMat);
    gun.position.set(0, 1.5, -1.5);
    gun.rotation.z = -Math.PI / 6;
    gun.castShadow = true;
    gun.receiveShadow = true;
    tank3.add(gun);

    scene.add(tank3);
    sceneObjects.push(tank3);
    tanks.push({
      group: tank3,
      stage: 3,
      position: tank3Z,
      speed: 0.1
    });
  }

  function createTankHull(x, z) {
    var group = new THREE.Group();
    group.position.set(x, 0, z);

    // Main hull body
    var hullGeometry = new THREE.BoxGeometry(2.5, 1.2, 4);
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x888866,
      metalness: 0.6,
      roughness: 0.3
    });

    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 0.8;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Track wheels - front
    var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
    var wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.5,
      roughness: 0.5
    });

    var wheelFrontL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFrontL.position.set(-1.2, 0.4, -1.5);
    wheelFrontL.rotation.z = Math.PI / 2;
    wheelFrontL.castShadow = true;
    wheelFrontL.receiveShadow = true;
    group.add(wheelFrontL);

    var wheelFrontR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFrontR.position.set(1.2, 0.4, -1.5);
    wheelFrontR.rotation.z = Math.PI / 2;
    wheelFrontR.castShadow = true;
    wheelFrontR.receiveShadow = true;
    group.add(wheelFrontR);

    // Track wheels - rear
    var wheelRearL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRearL.position.set(-1.2, 0.4, 1.5);
    wheelRearL.rotation.z = Math.PI / 2;
    wheelRearL.castShadow = true;
    wheelRearL.receiveShadow = true;
    group.add(wheelRearL);

    var wheelRearR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRearR.position.set(1.2, 0.4, 1.5);
    wheelRearR.rotation.z = Math.PI / 2;
    wheelRearR.castShadow = true;
    wheelRearR.receiveShadow = true;
    group.add(wheelRearR);

    // Track treads - left side
    var treadLGeometry = new THREE.BoxGeometry(0.2, 0.3, 4);
    var treadMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.3,
      roughness: 0.7
    });

    var treadL = new THREE.Mesh(treadLGeometry, treadMaterial);
    treadL.position.set(-1.3, 0.35, 0);
    treadL.castShadow = true;
    treadL.receiveShadow = true;
    group.add(treadL);

    // Track treads - right side
    var treadR = new THREE.Mesh(treadLGeometry, treadMaterial);
    treadR.position.set(1.3, 0.35, 0);
    treadR.castShadow = true;
    treadR.receiveShadow = true;
    group.add(treadR);

    return group;
  }

  function createSupervisorOffice() {
    var x = 20;
    var z = 15;

    // Raised platform
    var platformGeometry = new THREE.BoxGeometry(6, 0.5, 6);
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x555544,
      roughness: 0.8
    });

    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(x, 2.5, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    sceneObjects.push(platform);

    // Office building
    var buildingGeometry = new THREE.BoxGeometry(5, 3, 5);
    var buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x666655,
      metalness: 0.3,
      roughness: 0.5
    });

    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(x, 5, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    sceneObjects.push(building);

    // Windows
    var windowGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.2);
    var windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x4488FF,
      emissive: 0x2255FF,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.1
    });

    for (var i = 0; i < 6; i++) {
      var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
      window1.position.set(x - 2 + (i * 0.9), 5, z + 2.6);
      window1.castShadow = true;
      window1.receiveShadow = true;
      scene.add(window1);
      sceneObjects.push(window1);
    }

    // Roof
    var roofGeometry = new THREE.BoxGeometry(5.5, 0.3, 5.5);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7
    });

    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, 6.7, z);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
    sceneObjects.push(roof);

    // Stairs
    for (var s = 0; s < 3; s++) {
      var stepGeometry = new THREE.BoxGeometry(3, 0.3, 0.8);
      var stepMaterial = new THREE.MeshStandardMaterial({
        color: 0x555544,
        roughness: 0.8
      });

      var step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(x, 1.5 + (s * 0.8), z - 4 + (s * 0.8));
      step.castShadow = true;
      step.receiveShadow = true;
      scene.add(step);
      sceneObjects.push(step);
    }
  }

  function createShippingDock() {
    var x = -28;
    var z = 0;

    // Loading ramp
    var rampGeometry = new THREE.BoxGeometry(6, 0.3, 8);
    var rampMaterial = new THREE.MeshStandardMaterial({
      color: 0x555544,
      roughness: 0.9
    });

    var ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(x, 0.5, z);
    ramp.rotation.x = -0.2;
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    scene.add(ramp);
    sceneObjects.push(ramp);

    // Dock platform
    var platformGeometry = new THREE.BoxGeometry(8, 0.5, 10);
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x444433,
      roughness: 0.8
    });

    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(x, 2, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    sceneObjects.push(platform);

    // Overhead loading crane beam
    var craneBeamGeometry = new THREE.BoxGeometry(10, 0.4, 0.5);
    var craneBeamMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.8,
      roughness: 0.2
    });

    var craneBeam = new THREE.Mesh(craneBeamGeometry, craneBeamMaterial);
    craneBeam.position.set(x, 8, z);
    craneBeam.castShadow = true;
    craneBeam.receiveShadow = true;
    scene.add(craneBeam);
    sceneObjects.push(craneBeam);

    // Dock gates
    var gateGeometry = new THREE.BoxGeometry(7, 3, 0.3);
    var gateMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.6,
      roughness: 0.3
    });

    for (var g = 0; g < 2; g++) {
      var gate = new THREE.Mesh(gateGeometry, gateMaterial);
      gate.position.set(x - 4 + (g * 8), 2, z + 5);
      gate.castShadow = true;
      gate.receiveShadow = true;
      scene.add(gate);
      sceneObjects.push(gate);
    }
  }

  function createFireExtinguishers() {
    var positions = [
      { x: -25, z: -20 },
      { x: -10, z: -22 },
      { x: 10, z: -22 },
      { x: 25, z: -20 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      // Cabinet
      var cabinetGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.5);
      var cabinetMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        metalness: 0.4,
        roughness: 0.4
      });

      var cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
      cabinet.position.set(pos.x, 0.8, pos.z);
      cabinet.castShadow = true;
      cabinet.receiveShadow = true;
      scene.add(cabinet);
      sceneObjects.push(cabinet);

      // Extinguisher bottle inside
      var bottleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 6);
      var bottleMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFF00,
        metalness: 0.7,
        roughness: 0.2
      });

      var bottle = new THREE.Mesh(bottleGeometry, bottleMaterial);
      bottle.position.set(pos.x, 0.8, pos.z);
      bottle.castShadow = true;
      bottle.receiveShadow = true;
      scene.add(bottle);
      sceneObjects.push(bottle);
    }
  }

  function createToolPegboards() {
    var positions = [
      { x: -30, z: -18 },
      { x: 30, z: 18 }
    ];

    for (var p = 0; p < positions.length; p++) {
      var pos = positions[p];

      // Pegboard background
      var boardGeometry = new THREE.BoxGeometry(4, 5, 0.2);
      var boardMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.8
      });

      var board = new THREE.Mesh(boardGeometry, boardMaterial);
      board.position.set(pos.x, 2.5, pos.z);
      board.castShadow = true;
      board.receiveShadow = true;
      scene.add(board);
      sceneObjects.push(board);

      // Pegs with hanging tools - simplified as small cylinders
      for (var t = 0; t < 20; t++) {
        var pegGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 6);
        var pegMaterial = new THREE.MeshStandardMaterial({
          color: 0xFF6600,
          metalness: 0.7,
          roughness: 0.3
        });

        var peg = new THREE.Mesh(pegGeometry, pegMaterial);
        var row = Math.floor(t / 5);
        var col = t % 5;
        peg.position.set(
          pos.x - 1.5 + (col * 0.9),
          4.5 - (row * 1.2),
          pos.z + 0.2
        );
        peg.rotation.z = Math.PI / 2;
        peg.castShadow = true;
        peg.receiveShadow = true;
        scene.add(peg);
        sceneObjects.push(peg);
      }
    }
  }

  function createWasteMetalBins() {
    var positions = [
      { x: -30, z: 10 },
      { x: 30, z: -10 }
    ];

    for (var b = 0; b < positions.length; b++) {
      var pos = positions[b];

      // Bin container
      var binGeometry = new THREE.BoxGeometry(3, 2, 2);
      var binMaterial = new THREE.MeshStandardMaterial({
        color: 0x666655,
        metalness: 0.5,
        roughness: 0.5
      });

      var bin = new THREE.Mesh(binGeometry, binMaterial);
      bin.position.set(pos.x, 1, pos.z);
      bin.castShadow = true;
      bin.receiveShadow = true;
      scene.add(bin);
      sceneObjects.push(bin);

      // Metal scraps inside - random boxes
      for (var s = 0; s < 4; s++) {
        var scrapGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        var scrapMaterial = new THREE.MeshStandardMaterial({
          color: 0x444433,
          metalness: 0.8,
          roughness: 0.3
        });

        var scrap = new THREE.Mesh(scrapGeometry, scrapMaterial);
        scrap.position.set(
          pos.x - 1 + (Math.random() * 2),
          1.2 + (Math.random() * 1),
          pos.z - 0.5 + (Math.random() * 1)
        );
        scrap.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        scrap.castShadow = true;
        scrap.receiveShadow = true;
        scene.add(scrap);
        sceneObjects.push(scrap);
      }
    }
  }

  function createSparksParticleSystem() {
    // Pre-create spark particles for welding effect
    var sparkGeometry = new THREE.BufferGeometry();
    var sparkPositions = [];

    for (var i = 0; i < 200; i++) {
      sparkPositions.push(
        Math.random() * 40 - 20,
        Math.random() * 20,
        Math.random() * 40 - 20
      );
    }

    sparkGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sparkPositions), 3));

    var sparkMaterial = new THREE.PointsMaterial({
      color: 0xFF4400,
      size: 0.2,
      emissive: 0xFF4400
    });

    var sparkPoints = new THREE.Points(sparkGeometry, sparkMaterial);
    scene.add(sparkPoints);
    sceneObjects.push(sparkPoints);

    sparkParticles.push({
      points: sparkPoints,
      positions: sparkPositions,
      velocities: [],
      alive: false
    });

    // Initialize velocities
    var sp = sparkParticles[0];
    for (var v = 0; v < 200; v++) {
      sp.velocities.push(
        (Math.random() - 0.5) * 4,
        Math.random() * 2,
        (Math.random() - 0.5) * 4
      );
    }
  }

  function createLights() {
    // Ambient light
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Directional light - simulating skylights
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    scene.add(directionalLight);
    lights.push(directionalLight);

    // Welding torch lights - orange glow
    var torchLights = [
      { x: -12, z: 0 },
      { x: 0, z: 0 },
      { x: 12, z: 0 }
    ];

    for (var i = 0; i < torchLights.length; i++) {
      var light = new THREE.PointLight(0xFF6600, 1.5, 15);
      light.position.set(torchLights[i].x, 5, torchLights[i].z + 2);
      light.castShadow = true;
      scene.add(light);
      lights.push(light);
    }

    // Office window lights
    var officeLight = new THREE.PointLight(0x4488FF, 1, 20);
    officeLight.position.set(20, 5, 15);
    officeLight.castShadow = true;
    scene.add(officeLight);
    lights.push(officeLight);
  }

  function update(delta) {
    elapsedTime += delta;

    // Update robotic welding arms - rotation + sparks burst
    for (var a = 0; a < roboticArms.length; a++) {
      var arm = roboticArms[a];

      if (arm.torch) {
        // Rotating welding arms
        arm.rotation += delta * arm.rotationSpeed;
        arm.arm2.rotation.z = Math.sin(arm.rotation) * 0.4;
        arm.torch.rotation.z = Math.PI / 2 + (Math.cos(arm.rotation) * 0.3);

        // Sparks emission from torch
        if (Math.sin(arm.rotation) > 0.7) {
          burstSparks(arm.torch.position.x, arm.torch.position.y, arm.torch.position.z);
        }
      }

      // Overhead crane traversal
      if (arm.carriage) {
        arm.position += delta * arm.speed * arm.direction;
        if (arm.position > 20) arm.direction = -1;
        if (arm.position < -20) arm.direction = 1;

        arm.carriage.position.x = arm.position;
        arm.hook.position.x = arm.position;
      }
    }

    // Update stamping presses - up/down motion
    for (var p = 0; p < stampingPresses.length; p++) {
      var press = stampingPresses[p];
      press.phase += delta * press.speed;

      var offset = Math.sin(press.phase) * 2;
      press.arm.position.y = press.maxY + offset;
      press.die.position.y = press.position + offset;
    }

    // Update conveyor belts - texture scrolling
    for (var c = 0; c < conveyorBelts.length; c++) {
      var belt = conveyorBelts[c];
      belt.scrollOffset += delta * belt.speed;
      belt.scrollOffset = belt.scrollOffset % 40;
    }

    // Update tanks - moving forward slowly
    for (var t = 0; t < tanks.length; t++) {
      var tank = tanks[t];
      tank.position -= delta * tank.speed;
      if (tank.position < -20) {
        tank.position = 20;
      }
      tank.group.position.z = tank.position;
    }

    // Update spark particles
    for (var sp = 0; sp < sparkParticles.length; sp++) {
      var sparks = sparkParticles[sp];
      if (sparks.alive) {
        var posArray = sparks.positions;
        var velArray = sparks.velocities;

        for (var i = 0; i < posArray.length; i += 3) {
          posArray[i] += velArray[i] * delta;
          posArray[i + 1] += velArray[i + 1] * delta - (9.8 * delta * 0.5);
          posArray[i + 2] += velArray[i + 2] * delta;

          velArray[i] *= 0.98;
          velArray[i + 1] *= 0.98;
          velArray[i + 2] *= 0.98;
        }

        sparks.points.geometry.attributes.position.needsUpdate = true;
        sparks.aliveTime -= delta;
        if (sparks.aliveTime <= 0) {
          sparks.alive = false;
        }
      }
    }
  }

  function burstSparks(x, y, z) {
    if (sparkParticles.length === 0) return;

    var sparks = sparkParticles[0];
    if (sparks.alive) return;

    sparks.alive = true;
    sparks.aliveTime = 0.5;

    var posArray = sparks.positions;
    for (var i = 0; i < posArray.length; i += 3) {
      posArray[i] = x + (Math.random() - 0.5) * 0.5;
      posArray[i + 1] = y + (Math.random() - 0.5) * 0.5;
      posArray[i + 2] = z + (Math.random() - 0.5) * 0.5;
    }

    sparks.points.geometry.attributes.position.needsUpdate = true;
  }

  function reset() {
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }

    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }

    sceneObjects = [];
    lights = [];
    roboticArms = [];
    stampingPresses = [];
    conveyorBelts = [];
    tanks = [];
    sparkParticles = [];
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
