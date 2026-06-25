var StagingArea = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var radarRotation = 0;
  var antennaStrobePhase = 0;
  var airDefenseAzimuth = 0;
  var fuelTankShimmer = 0;
  var rotatingStagingLights = [];
  var commandAntennas = [];
  var radarDish = null;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    // Ground staging area - massive flat tarmac
    var groundGeo = new THREE.BoxGeometry(1000, 0.5, 800);
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.3,
      roughness: 0.7
    });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);

    // Concrete grid overlay
    var gridMat = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1 });
    for (var gx = -500; gx <= 500; gx += 100) {
      var gridGeo = new THREE.BufferGeometry();
      var gridVerts = new Float32Array([gx, 0, -400, gx, 0, 400]);
      gridGeo.setAttribute('position', new THREE.BufferAttribute(gridVerts, 3));
      var gridLine = new THREE.LineSegments(gridGeo, gridMat);
      scene.add(gridLine);
    }
    for (var gz = -400; gz <= 400; gz += 100) {
      var gridGeo2 = new THREE.BufferGeometry();
      var gridVerts2 = new Float32Array([-500, 0, gz, 500, 0, gz]);
      gridGeo2.setAttribute('position', new THREE.BufferAttribute(gridVerts2, 3));
      var gridLine2 = new THREE.LineSegments(gridGeo2, gridMat);
      scene.add(gridLine2);
    }

    // Tank formations - 3x4 grid
    for (var tx = 0; tx < 3; tx++) {
      for (var tz = 0; tz < 4; tz++) {
        var tankX = -300 + tx * 150;
        var tankZ = -150 + tz * 100;
        createTankFormation(tankX, tankZ);
      }
    }

    // Infantry assembly area - tent city cluster
    for (var ix = 0; ix < 8; ix++) {
      for (var iy = 0; iy < 6; iy++) {
        var tentX = 50 + ix * 35;
        var tentZ = -320 + iy * 40;
        createTent(tentX, tentZ);
      }
    }

    // Logistics hub
    createLogisticsHub(300, -200);

    // Ammo dump with earth berm
    createAmmoDump(450, 100);

    // Field hospital tent
    createFieldHospital(500, -350);

    // Fuel farm - rows of bladder tanks
    createFuelFarm(-350, 250);

    // Command vehicle with antenna array
    createCommandVehicle(50, 300);

    // Air defense battery
    createAirDefenseBattery(-150, 350);

    // Artillery battery
    createArtilleryBattery(-300, 350);

    // Engineer vehicles
    createEngineerVehicles(150, 200);

    // Signal corps vehicles
    createSignalCorpsVehicles(250, 250);

    // Vehicle maintenance bay
    createMaintenanceBay(350, 150);

    // Perimeter guard posts
    createGuardPosts();

    // Airspace warning radar
    createRadarStation(450, -400);

    // Supply convoy parking
    createConvoyParking(-200, -350);

    // Ambient staging lights
    createStagingLights();
  }

  function createTankFormation(baseX, baseZ) {
    var hullGeo = new THREE.BoxGeometry(15, 6, 28);
    var hullMat = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      metalness: 0.4,
      roughness: 0.6
    });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.set(baseX, 3, baseZ);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);

    var turretGeo = new THREE.CylinderGeometry(7, 8, 5, 32);
    var turretMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a0d,
      metalness: 0.5,
      roughness: 0.5
    });
    var turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.set(baseX, 8.5, baseZ);
    turret.castShadow = true;
    turret.receiveShadow = true;
    scene.add(turret);

    var barrelGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 16);
    var barrelMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.3
    });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(baseX + 12, 9, baseZ);
    barrel.castShadow = true;
    scene.add(barrel);

    // Track wheels
    for (var w = 0; w < 3; w++) {
      var wheelGeo = new THREE.CylinderGeometry(3, 3, 2, 16);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(baseX + w * 8 - 8, 3, baseZ - 10);
      wheel.castShadow = true;
      scene.add(wheel);
    }
  }

  function createTent(x, z) {
    var tentGeo = new THREE.BoxGeometry(12, 8, 16);
    var tentMat = new THREE.MeshStandardMaterial({
      color: 0x556b2f,
      metalness: 0.1,
      roughness: 0.9
    });
    var tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.set(x, 4, z);
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);
  }

  function createLogisticsHub(baseX, baseZ) {
    // Main depot building
    var depotGeo = new THREE.BoxGeometry(80, 20, 60);
    var depotMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      metalness: 0.2,
      roughness: 0.8
    });
    var depot = new THREE.Mesh(depotGeo, depotMat);
    depot.position.set(baseX, 10, baseZ);
    depot.castShadow = true;
    depot.receiveShadow = true;
    scene.add(depot);

    // Forklift 1
    createForklift(baseX - 50, baseZ + 30);

    // Forklift 2
    createForklift(baseX + 50, baseZ - 30);

    // Supply stacks
    for (var sx = 0; sx < 3; sx++) {
      var stackGeo = new THREE.BoxGeometry(25, 15, 20);
      var stackMat = new THREE.MeshStandardMaterial({ color: 0xa0a0a0 });
      var stack = new THREE.Mesh(stackGeo, stackMat);
      stack.position.set(baseX - 40 + sx * 30, 7.5, baseZ - 50);
      stack.castShadow = true;
      scene.add(stack);
    }
  }

  function createForklift(x, z) {
    var bodyGeo = new THREE.BoxGeometry(8, 10, 12);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(x, 5, z);
    body.castShadow = true;
    scene.add(body);

    // Wheels
    for (var w = 0; w < 2; w++) {
      var wheelGeo = new THREE.CylinderGeometry(2, 2, 1.5, 16);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x + w * 6 - 3, 2, z);
      scene.add(wheel);
    }

    // Fork prongs
    for (var p = 0; p < 2; p++) {
      var prong = new THREE.BoxGeometry(1, 18, 6);
      var prongMat = new THREE.MeshStandardMaterial({ color: 0x404040 });
      var prongMesh = new THREE.Mesh(prong, prongMat);
      prongMesh.position.set(x - 3 + p * 6, 9, z + 8);
      scene.add(prongMesh);
    }
  }

  function createAmmoDump(baseX, baseZ) {
    // Earth berm
    var bermGeo = new THREE.BoxGeometry(120, 8, 100);
    var bermMat = new THREE.MeshStandardMaterial({
      color: 0x6b5d4f,
      metalness: 0.1,
      roughness: 0.95
    });
    var berm = new THREE.Mesh(bermGeo, bermMat);
    berm.position.set(baseX, 4, baseZ);
    berm.receiveShadow = true;
    scene.add(berm);

    // Ammo crates in grid
    for (var cx = 0; cx < 4; cx++) {
      for (var cz = 0; cz < 5; cz++) {
        var crateGeo = new THREE.BoxGeometry(12, 8, 10);
        var crateMat = new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          metalness: 0.15,
          roughness: 0.85
        });
        var crate = new THREE.Mesh(crateGeo, crateMat);
        crate.position.set(baseX - 40 + cx * 25, 4, baseZ - 30 + cz * 20);
        crate.castShadow = true;
        scene.add(crate);
      }
    }
  }

  function createFieldHospital(baseX, baseZ) {
    var tentGeo = new THREE.BoxGeometry(100, 18, 70);
    var tentMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5dc,
      metalness: 0.1,
      roughness: 0.9
    });
    var tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.set(baseX, 9, baseZ);
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);

    // Red cross on roof
    var crossH = new THREE.BoxGeometry(30, 1, 6);
    var crossMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    var crossHMesh = new THREE.Mesh(crossH, crossMat);
    crossHMesh.position.set(baseX, 19, baseZ);
    scene.add(crossHMesh);

    var crossV = new THREE.BoxGeometry(6, 1, 30);
    var crossVMesh = new THREE.Mesh(crossV, crossMat);
    crossVMesh.position.set(baseX, 19, baseZ);
    scene.add(crossVMesh);
  }

  function createFuelFarm(baseX, baseZ) {
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var tankGeo = new THREE.CylinderGeometry(8, 8, 25, 32);
        var tankMat = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.6,
          roughness: 0.4
        });
        var tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(baseX + col * 30, 12.5, baseZ + row * 40);
        tank.castShadow = true;
        tank.receiveShadow = true;
        rotatingStagingLights.push({
          object: tank,
          type: 'fuel'
        });
        scene.add(tank);

        // Tank cap
        var capGeo = new THREE.CylinderGeometry(5, 8, 2, 32);
        var capMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        var cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(baseX + col * 30, 26, baseZ + row * 40);
        scene.add(cap);
      }
    }
  }

  function createCommandVehicle(baseX, baseZ) {
    var bodyGeo = new THREE.BoxGeometry(35, 15, 50);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a472a,
      metalness: 0.3,
      roughness: 0.7
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(baseX, 7.5, baseZ);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);

    // Antenna array
    for (var ant = 0; ant < 6; ant++) {
      var antennaGeo = new THREE.CylinderGeometry(0.8, 0.8, 35, 16);
      var antennaMat = new THREE.MeshStandardMaterial({
        color: 0xddaa00,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x220000
      });
      var antenna = new THREE.Mesh(antennaGeo, antennaMat);
      var angleOffset = (ant / 6) * Math.PI * 2;
      antenna.position.set(
        baseX + Math.cos(angleOffset) * 12,
        25,
        baseZ + Math.sin(angleOffset) * 12
      );
      antenna.castShadow = true;
      commandAntennas.push(antenna);
      scene.add(antenna);
    }

    // Wire connections
    for (var w = 0; w < 5; w++) {
      var wireGeo = new THREE.BufferGeometry();
      var angle1 = (w / 5) * Math.PI * 2;
      var angle2 = ((w + 1) / 5) * Math.PI * 2;
      var wireVerts = new Float32Array([
        baseX + Math.cos(angle1) * 12, 25, baseZ + Math.sin(angle1) * 12,
        baseX + Math.cos(angle2) * 12, 25, baseZ + Math.sin(angle2) * 12
      ]);
      wireGeo.setAttribute('position', new THREE.BufferAttribute(wireVerts, 3));
      var wireMat = new THREE.LineBasicMaterial({ color: 0x444444 });
      var wire = new THREE.LineSegments(wireGeo, wireMat);
      scene.add(wire);
    }
  }

  function createAirDefenseBattery(baseX, baseZ) {
    // Launcher platform
    var platformGeo = new THREE.BoxGeometry(45, 3, 45);
    var platformMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(baseX, 1.5, baseZ);
    platform.receiveShadow = true;
    scene.add(platform);

    // Control station
    var controlGeo = new THREE.BoxGeometry(25, 12, 25);
    var controlMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var control = new THREE.Mesh(controlGeo, controlMat);
    control.position.set(baseX, 6, baseZ);
    control.castShadow = true;
    scene.add(control);

    // Missile tubes (4 corner positions)
    var tubePositions = [
      [-15, -15], [15, -15], [-15, 15], [15, 15]
    ];
    for (var t = 0; t < tubePositions.length; t++) {
      var tubeGeo = new THREE.CylinderGeometry(3, 3, 28, 16);
      var tubeMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.7,
        roughness: 0.3
      });
      var tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.rotation.z = Math.PI / 6;
      tube.position.set(baseX + tubePositions[t][0], 18, baseZ + tubePositions[t][1]);
      tube.castShadow = true;
      scene.add(tube);
    }
  }

  function createArtilleryBattery(baseX, baseZ) {
    for (var art = 0; art < 3; art++) {
      var gunGeo = new THREE.BoxGeometry(18, 8, 35);
      var gunMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        metalness: 0.5,
        roughness: 0.5
      });
      var gun = new THREE.Mesh(gunGeo, gunMat);
      gun.position.set(baseX + art * 50, 4, baseZ);
      gun.castShadow = true;
      gun.receiveShadow = true;
      scene.add(gun);

      // Breech and recuperator
      var breechGeo = new THREE.CylinderGeometry(4, 4, 12, 16);
      var breechMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
      var breech = new THREE.Mesh(breechGeo, breechMat);
      breech.position.set(baseX + art * 50, 8, baseZ - 15);
      breech.castShadow = true;
      scene.add(breech);

      // Wheels
      for (var aw = 0; aw < 2; aw++) {
        var wheelGeo = new THREE.CylinderGeometry(4, 4, 2, 16);
        var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        var wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(baseX + art * 50, 2, baseZ + aw * 16 - 8);
        scene.add(wheel);
      }
    }
  }

  function createEngineerVehicles(baseX, baseZ) {
    // Dozer
    var dozerGeo = new THREE.BoxGeometry(28, 12, 40);
    var dozerMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 0.4,
      roughness: 0.6
    });
    var dozer = new THREE.Mesh(dozerGeo, dozerMat);
    dozer.position.set(baseX, 6, baseZ);
    dozer.castShadow = true;
    scene.add(dozer);

    // Dozer blade
    var bladeGeo = new THREE.BoxGeometry(32, 6, 3);
    var bladeMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    var blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(baseX, 6, baseZ + 22);
    scene.add(blade);

    // Drum compactor
    var drumGeo = new THREE.CylinderGeometry(10, 10, 25, 32);
    var drumMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 0.35,
      roughness: 0.65
    });
    var drum = new THREE.Mesh(drumGeo, drumMat);
    drum.rotation.z = Math.PI / 2;
    drum.position.set(baseX + 60, 6, baseZ);
    drum.castShadow = true;
    scene.add(drum);

    // Roller wheels
    for (var rw = 0; rw < 2; rw++) {
      var wheelGeo = new THREE.CylinderGeometry(3, 3, 2, 16);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(baseX + 60, 3, baseZ + rw * 15 - 7.5);
      scene.add(wheel);
    }
  }

  function createSignalCorpsVehicles(baseX, baseZ) {
    var bodyGeo = new THREE.BoxGeometry(22, 14, 38);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x556b2f,
      metalness: 0.3,
      roughness: 0.7
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(baseX, 7, baseZ);
    body.castShadow = true;
    scene.add(body);

    // Comm tower mast
    var mastGeo = new THREE.CylinderGeometry(2, 2, 45, 16);
    var mastMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.7,
      roughness: 0.3
    });
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(baseX, 30, baseZ);
    mast.castShadow = true;
    scene.add(mast);

    // Cross arm
    var armGeo = new THREE.BoxGeometry(20, 1, 20);
    var armMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(baseX, 40, baseZ);
    scene.add(arm);

    // Dish antenna
    var dishGeo = new THREE.CylinderGeometry(6, 6, 1, 32);
    var dishMat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 0.8,
      roughness: 0.2
    });
    var dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(baseX, 38, baseZ);
    scene.add(dish);
  }

  function createMaintenanceBay(baseX, baseZ) {
    // Open-sided shelter
    var roofGeo = new THREE.BoxGeometry(70, 2, 50);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      metalness: 0.2,
      roughness: 0.8
    });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(baseX, 15, baseZ);
    roof.receiveShadow = true;
    scene.add(roof);

    // Support posts
    for (var px = 0; px < 3; px++) {
      for (var pz = 0; pz < 2; pz++) {
        var postGeo = new THREE.BoxGeometry(4, 14, 4);
        var postMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
        var post = new THREE.Mesh(postGeo, postMat);
        post.position.set(baseX - 25 + px * 25, 7, baseZ - 20 + pz * 40);
        post.castShadow = true;
        scene.add(post);
      }
    }

    // Service vehicles under shelter
    var vehicleGeo = new THREE.BoxGeometry(20, 8, 35);
    var vehicleMat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a });
    var vehicle = new THREE.Mesh(vehicleGeo, vehicleMat);
    vehicle.position.set(baseX, 4, baseZ);
    vehicle.castShadow = true;
    scene.add(vehicle);
  }

  function createGuardPosts() {
    var postPositions = [
      [-480, -350], [480, -350], [-480, 350], [480, 350],
      [-400, -380], [400, -380], [-400, 380], [400, 380]
    ];

    for (var gp = 0; gp < postPositions.length; gp++) {
      var guardTowerGeo = new THREE.BoxGeometry(15, 20, 15);
      var guardMat = new THREE.MeshStandardMaterial({
        color: 0x3a4a3a,
        metalness: 0.2,
        roughness: 0.8
      });
      var tower = new THREE.Mesh(guardTowerGeo, guardMat);
      tower.position.set(postPositions[gp][0], 10, postPositions[gp][1]);
      tower.castShadow = true;
      tower.receiveShadow = true;
      scene.add(tower);

      // Guard post searchlight spotlight
      var spotGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
      var spotMat = new THREE.MeshStandardMaterial({
        color: 0xffff99,
        emissive: 0x444400,
        metalness: 0.7
      });
      var spot = new THREE.Mesh(spotGeo, spotMat);
      spot.position.set(postPositions[gp][0], 22, postPositions[gp][1]);
      scene.add(spot);
    }
  }

  function createRadarStation(baseX, baseZ) {
    // Control station
    var stationGeo = new THREE.BoxGeometry(35, 12, 35);
    var stationMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a4a,
      metalness: 0.3,
      roughness: 0.7
    });
    var station = new THREE.Mesh(stationGeo, stationMat);
    station.position.set(baseX, 6, baseZ);
    station.castShadow = true;
    station.receiveShadow = true;
    scene.add(station);

    // Radar mast
    var mastGeo = new THREE.CylinderGeometry(3, 3, 50, 16);
    var mastMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    });
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(baseX, 28, baseZ);
    mast.castShadow = true;
    scene.add(mast);

    // Rotating dish
    var dishGeo = new THREE.CylinderGeometry(12, 12, 2, 32);
    var dishMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.1
    });
    radarDish = new THREE.Mesh(dishGeo, dishMat);
    radarDish.position.set(baseX, 52, baseZ);
    radarDish.castShadow = true;
    scene.add(radarDish);

    // Radome support
    var supportGeo = new THREE.BoxGeometry(20, 4, 20);
    var supportMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var support = new THREE.Mesh(supportGeo, supportMat);
    support.position.set(baseX, 48, baseZ);
    scene.add(support);
  }

  function createConvoyParking(baseX, baseZ) {
    for (var cv = 0; cv < 6; cv++) {
      var truckGeo = new THREE.BoxGeometry(28, 14, 70);
      var truckMat = new THREE.MeshStandardMaterial({
        color: 0x556b2f,
        metalness: 0.25,
        roughness: 0.75
      });
      var truck = new THREE.Mesh(truckGeo, truckMat);
      truck.position.set(baseX + cv * 60, 7, baseZ);
      truck.castShadow = true;
      truck.receiveShadow = true;
      scene.add(truck);

      // Cab
      var cabGeo = new THREE.BoxGeometry(22, 12, 25);
      var cabMat = new THREE.MeshStandardMaterial({ color: 0x3a5a1a });
      var cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(baseX + cv * 60, 10, baseZ - 30);
      cab.castShadow = true;
      scene.add(cab);
    }
  }

  function createStagingLights() {
    var lightPositions = [
      [-250, 0, -200], [250, 0, -200],
      [-250, 0, 200], [250, 0, 200],
      [0, 0, -300], [0, 0, 300]
    ];

    for (var l = 0; l < lightPositions.length; l++) {
      var light = new THREE.PointLight(0xffffcc, 0.8, 400);
      light.position.set(lightPositions[l][0], 60, lightPositions[l][1]);
      light.castShadow = true;
      scene.add(light);
    }

    // Overhead floodlights
    var floodLight = new THREE.DirectionalLight(0xffffdd, 0.4);
    floodLight.position.set(100, 200, 100);
    floodLight.castShadow = true;
    floodLight.shadow.mapSize.width = 4096;
    floodLight.shadow.mapSize.height = 4096;
    scene.add(floodLight);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);
  }

  function update(delta) {
    // Radar rotation
    radarRotation += delta * 0.5;
    if (radarDish) {
      radarDish.rotation.y = radarRotation;
    }

    // Antenna strobe/blink
    antennaStrobePhase += delta * 3;
    for (var a = 0; a < commandAntennas.length; a++) {
      var strobeIntensity = 0.3 + 0.4 * Math.sin(antennaStrobePhase + a);
      commandAntennas[a].material.emissive.setScalar(strobeIntensity * 0.15);
    }

    // Air defense tracking azimuth
    airDefenseAzimuth += delta * 0.3;

    // Fuel tank shimmer effect
    fuelTankShimmer += delta * 1.5;
    for (var f = 0; f < rotatingStagingLights.length; f++) {
      var fuelObj = rotatingStagingLights[f];
      if (fuelObj.type === 'fuel') {
        var shimmerValue = 0.4 + 0.2 * Math.sin(fuelTankShimmer + f * 0.5);
        fuelObj.object.material.emissive.setScalar(shimmerValue * 0.08);
      }
    }
  }

  function reset() {
    radarRotation = 0;
    antennaStrobePhase = 0;
    airDefenseAzimuth = 0;
    fuelTankShimmer = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
