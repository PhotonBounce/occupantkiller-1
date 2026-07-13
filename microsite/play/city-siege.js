window.CitySiege = (function() {
  'use strict';

  var sceneRef = null;
  var cameraRef = null;
  var allObjects = [];
  var tracerSegments = [];
  var fireObjects = [];
  var tankTurrets = [];
  var fireFlickerStates = [];

  var colors = {
    concrete: 0x888888,
    darkConcrete: 0x666666,
    lightConcrete: 0xaaaaaa,
    militaryGreen: 0x3d6b3d,
    darkGreen: 0x2d5b2d,
    fireOrange: 0xff6b1a,
    fireRed: 0xff3300,
    smokeBlack: 0x1a1a1a,
    darkSmoke: 0x333333,
    steelGray: 0x555555,
    rubble: 0x774433
  };

  function addToScene(object) {
    sceneRef.add(object);
    allObjects.push(object);
    return object;
  }

  function createCityBlocks() {
    var blockSpacing = 20;
    var blockWidth = 15;
    var blockDepth = 15;

    for (var x = -40; x <= 40; x += blockSpacing) {
      for (var z = -40; z <= 40; z += blockSpacing) {
        if ((Math.abs(x) < blockSpacing / 2 && Math.abs(z) < blockSpacing / 2) ||
            (Math.abs(x) < blockSpacing / 2 && Math.abs(z) > 20) ||
            (Math.abs(z) < blockSpacing / 2 && Math.abs(x) > 20)) {
          continue;
        }

        var height = 8 + Math.random() * 12;
        var geometry = new THREE.BoxGeometry(blockWidth, height, blockDepth);
        var color = Math.random() > 0.5 ? colors.concrete : colors.darkConcrete;
        var material = new THREE.MeshLambertMaterial({ color: color });
        var building = new THREE.Mesh(geometry, material);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;

        addToScene(building);

        // Add window details with small cubes
        for (var wx = 0; wx < 3; wx++) {
          for (var wy = 0; wy < Math.floor(height / 3); wy++) {
            if (Math.random() > 0.3) {
              var windowGeo = new THREE.BoxGeometry(1.5, 1.5, 0.5);
              var windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
              var window = new THREE.Mesh(windowGeo, windowMat);
              window.position.set(x - blockWidth / 2 + 2 + wx * 4, 2 + wy * 3 + height / 4, z - blockDepth / 2 + 0.5);
              window.castShadow = true;
              addToScene(window);
            }
          }
        }
      }
    }
  }

  function createSiegeArtillery() {
    var platforms = [
      { x: -50, z: -50 },
      { x: 50, z: -50 },
      { x: -50, z: 50 }
    ];

    platforms.forEach(function(pos) {
      // Platform
      var platformGeo = new THREE.BoxGeometry(12, 1.5, 12);
      var platformMat = new THREE.MeshLambertMaterial({ color: colors.militaryGreen });
      var platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.set(pos.x, 0.75, pos.z);
      platform.castShadow = true;
      addToScene(platform);

      // Gun barrel
      var barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 16);
      var barrelMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(pos.x, 3, pos.z);
      barrel.rotation.z = -Math.PI / 6;
      barrel.castShadow = true;
      addToScene(barrel);

      // Gun carriage base
      var carriageGeo = new THREE.BoxGeometry(3, 2, 3);
      var carriageMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
      var carriage = new THREE.Mesh(carriageGeo, carriageMat);
      carriage.position.set(pos.x, 2, pos.z);
      carriage.castShadow = true;
      addToScene(carriage);
    });
  }

  function createTankColumn() {
    var tankPositions = [
      { x: -6, z: 0 },
      { x: 0, z: 0 },
      { x: 6, z: 0 }
    ];

    tankPositions.forEach(function(pos, idx) {
      // Tank hull
      var hullGeo = new THREE.BoxGeometry(4, 2.5, 8);
      var hullMat = new THREE.MeshLambertMaterial({ color: colors.darkGreen });
      var hull = new THREE.Mesh(hullGeo, hullMat);
      hull.position.set(pos.x, 1.25, pos.z);
      hull.castShadow = true;
      addToScene(hull);

      // Tank turret
      var turretGeo = new THREE.CylinderGeometry(1.8, 1.8, 1.2, 16);
      var turretMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
      var turret = new THREE.Mesh(turretGeo, turretMat);
      turret.position.set(pos.x, 3, pos.z);
      turret.castShadow = true;
      addToScene(turret);
      tankTurrets.push({ turret: turret, baseX: pos.x, baseZ: pos.z });

      // Gun barrel
      var gunGeo = new THREE.CylinderGeometry(0.4, 0.4, 3.5, 12);
      var gunMat = new THREE.MeshLambertMaterial({ color: colors.smokeBlack });
      var gun = new THREE.Mesh(gunGeo, gunMat);
      gun.position.set(pos.x + 1.5, 3.2, pos.z);
      gun.rotation.z = Math.PI / 2;
      gun.castShadow = true;
      addToScene(gun);

      // Tank tracks (represented by boxes)
      for (var i = 0; i < 2; i++) {
        var trackGeo = new THREE.BoxGeometry(4.5, 0.4, 7.8);
        var trackMat = new THREE.MeshLambertMaterial({ color: colors.smokeBlack });
        var track = new THREE.Mesh(trackGeo, trackMat);
        track.position.set(pos.x, 0.2 + i * 0.3, pos.z);
        track.castShadow = true;
        addToScene(track);
      }
    });
  }

  function createBarricades() {
    // Sandbag walls
    var barricadePositions = [
      { x: -15, z: 10, width: 12, height: 1.5 },
      { x: 15, z: 10, width: 12, height: 1.5 },
      { x: 0, z: 25, width: 20, height: 1.5 },
      { x: -30, z: 0, width: 8, height: 1.2 },
      { x: 30, z: 0, width: 8, height: 1.2 }
    ];

    barricadePositions.forEach(function(pos) {
      var barGeo = new THREE.BoxGeometry(pos.width, pos.height, 1.5);
      var barMat = new THREE.MeshLambertMaterial({ color: 0xccaa88 });
      var bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(pos.x, pos.height / 2, pos.z);
      bar.castShadow = true;
      addToScene(bar);
    });

    // Debris walls (rubble)
    var debrisWalls = [
      { x: -20, z: -15, width: 10, height: 2 },
      { x: 20, z: -15, width: 10, height: 2 },
      { x: 0, z: -30, width: 15, height: 2.5 }
    ];

    debrisWalls.forEach(function(pos) {
      var debrisGeo = new THREE.BoxGeometry(pos.width, pos.height, 1.8);
      var debrisMat = new THREE.MeshLambertMaterial({ color: colors.rubble });
      var debris = new THREE.Mesh(debrisGeo, debrisMat);
      debris.position.set(pos.x, pos.height / 2, pos.z);
      debris.castShadow = true;
      addToScene(debris);

      // Add scattered rubble pieces
      for (var i = 0; i < 5; i++) {
        var rubbleGeo = new THREE.BoxGeometry(0.5 + Math.random() * 1, 0.5 + Math.random() * 0.8, 0.5 + Math.random() * 1);
        var rubbleMat = new THREE.MeshLambertMaterial({ color: colors.darkConcrete });
        var rubblePiece = new THREE.Mesh(rubbleGeo, rubbleMat);
        rubblePiece.position.set(pos.x + (Math.random() - 0.5) * pos.width, pos.height + 0.5 + Math.random() * 0.5, pos.z + (Math.random() - 0.5) * 3);
        rubblePiece.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rubblePiece.castShadow = true;
        addToScene(rubblePiece);
      }
    });
  }

  function createBuildingBreaches() {
    var breachPositions = [
      { x: -35, z: -35, holeWidth: 6, holeHeight: 8, buildingHeight: 14 },
      { x: 35, z: -35, holeWidth: 5, holeHeight: 7, buildingHeight: 12 },
      { x: -35, z: 35, holeWidth: 7, holeHeight: 9, buildingHeight: 16 }
    ];

    breachPositions.forEach(function(pos) {
      // Main building shell
      var buildingGeo = new THREE.BoxGeometry(12, pos.buildingHeight, 12);
      var buildingMat = new THREE.MeshLambertMaterial({ color: colors.darkConcrete });
      var building = new THREE.Mesh(buildingGeo, buildingMat);
      building.position.set(pos.x, pos.buildingHeight / 2, pos.z);
      building.castShadow = true;
      addToScene(building);

      // Breach hole - represented by empty space, filled with rubble
      for (var i = 0; i < 6; i++) {
        var rubbleGeo = new THREE.BoxGeometry(1 + Math.random(), 1 + Math.random(), 1 + Math.random());
        var rubbleMat = new THREE.MeshLambertMaterial({ color: colors.rubble });
        var rubble = new THREE.Mesh(rubbleGeo, rubbleMat);
        rubble.position.set(pos.x + (Math.random() - 0.5) * pos.holeWidth, pos.holeHeight / 2 + Math.random() * 2, pos.z - 6);
        rubble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rubble.castShadow = true;
        addToScene(rubble);
      }

      // Cracked walls around breach
      var crackGeo = new THREE.BoxGeometry(pos.holeWidth + 2, pos.holeHeight, 0.5);
      var crackMat = new THREE.MeshLambertMaterial({ color: colors.smokeBlack });
      var crack = new THREE.Mesh(crackGeo, crackMat);
      crack.position.set(pos.x, pos.holeHeight / 2 + 2, pos.z - 6);
      crack.castShadow = true;
      addToScene(crack);
    });
  }

  function createStreetFightingPositions() {
    // Cover positions
    var coverPositions = [
      { x: -12, z: 15 },
      { x: 12, z: 15 },
      { x: -12, z: -15 },
      { x: 12, z: -15 },
      { x: 20, z: 5 },
      { x: -20, z: -5 }
    ];

    coverPositions.forEach(function(pos) {
      // Small barrier
      var barrierGeo = new THREE.BoxGeometry(3, 1.5, 3);
      var barrierMat = new THREE.MeshLambertMaterial({ color: colors.lightConcrete });
      var barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrier.position.set(pos.x, 0.75, pos.z);
      barrier.castShadow = true;
      addToScene(barrier);
    });

    // Overturned vehicles (represented as boxes)
    var vehiclePositions = [
      { x: -25, z: 20 },
      { x: 25, z: -20 },
      { x: 0, z: 30 }
    ];

    vehiclePositions.forEach(function(pos) {
      var vehicleGeo = new THREE.BoxGeometry(3.5, 1.5, 2.5);
      var vehicleMat = new THREE.MeshLambertMaterial({ color: colors.militaryGreen });
      var vehicle = new THREE.Mesh(vehicleGeo, vehicleMat);
      vehicle.position.set(pos.x, 0.75, pos.z);
      vehicle.rotation.z = Math.PI / 4;
      vehicle.castShadow = true;
      addToScene(vehicle);

      // Wheels
      for (var i = 0; i < 2; i++) {
        var wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
        var wheelMat = new THREE.MeshLambertMaterial({ color: colors.smokeBlack });
        var wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(pos.x + (i - 0.5) * 2.5, 0.6, pos.z);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        addToScene(wheel);
      }
    });
  }

  function createSnipersNest() {
    var x = 45, z = 40;

    // Building base (partially destroyed)
    var buildingGeo = new THREE.BoxGeometry(10, 15, 10);
    var buildingMat = new THREE.MeshLambertMaterial({ color: colors.darkConcrete });
    var building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(x, 7.5, z);
    building.castShadow = true;
    addToScene(building);

    // Elevated platform
    var platformGeo = new THREE.BoxGeometry(6, 1, 6);
    var platformMat = new THREE.MeshLambertMaterial({ color: colors.concrete });
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(x, 12, z);
    platform.castShadow = true;
    addToScene(platform);

    // Sandbag protection
    for (var i = 0; i < 3; i++) {
      var bagGeo = new THREE.BoxGeometry(1.5, 1, 0.8);
      var bagMat = new THREE.MeshLambertMaterial({ color: 0xccaa88 });
      var bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(x - 2 + i * 2, 12.7, z - 3);
      bag.castShadow = true;
      addToScene(bag);
    }

    // Scope (small cylinder)
    var scopeGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12);
    var scopeMat = new THREE.MeshLambertMaterial({ color: colors.smokeBlack });
    var scope = new THREE.Mesh(scopeGeo, scopeMat);
    scope.position.set(x, 13, z);
    scope.rotation.z = Math.PI / 2;
    scope.castShadow = true;
    addToScene(scope);
  }

  function createCivilianShelter() {
    var x = -45, z = -40;

    // Main building
    var buildingGeo = new THREE.BoxGeometry(12, 14, 12);
    var buildingMat = new THREE.MeshLambertMaterial({ color: colors.concrete });
    var building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(x, 7, z);
    building.castShadow = true;
    addToScene(building);

    // Basement entrance
    var entranceGeo = new THREE.BoxGeometry(3, 2.5, 1);
    var entranceMat = new THREE.MeshLambertMaterial({ color: colors.darkConcrete });
    var entrance = new THREE.Mesh(entranceGeo, entranceMat);
    entrance.position.set(x, 1.25, z - 6.5);
    entrance.castShadow = true;
    addToScene(entrance);

    // Sandbag walls around entrance
    for (var i = 0; i < 2; i++) {
      var bagWallGeo = new THREE.BoxGeometry(4, 1.2, 1.5);
      var bagWallMat = new THREE.MeshLambertMaterial({ color: 0xccaa88 });
      var bagWall = new THREE.Mesh(bagWallGeo, bagWallMat);
      bagWall.position.set(x + (i - 0.5) * 4, 0.6, z - 8);
      bagWall.castShadow = true;
      addToScene(bagWall);
    }

    // Interior representation (stacked boxes)
    for (var j = 0; j < 3; j++) {
      var boxGeo = new THREE.BoxGeometry(2, 1.5, 2);
      var boxMat = new THREE.MeshLambertMaterial({ color: colors.lightConcrete });
      var box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(x - 4 + j * 4, 1.5, z - 1);
      box.castShadow = true;
      addToScene(box);
    }
  }

  function createSupplyConvoyWreck() {
    var positions = [
      { x: 30, z: 20 },
      { x: 36, z: 18 },
      { x: 42, z: 16 }
    ];

    positions.forEach(function(pos, idx) {
      // Truck hull
      var truckGeo = new THREE.BoxGeometry(3, 2.5, 7);
      var truckMat = new THREE.MeshLambertMaterial({ color: colors.militaryGreen });
      var truck = new THREE.Mesh(truckGeo, truckMat);
      truck.position.set(pos.x, 1.25, pos.z);
      truck.rotation.y = Math.PI / 6;
      truck.castShadow = true;
      addToScene(truck);

      // Cargo area
      var cargoGeo = new THREE.BoxGeometry(3.5, 2.5, 5);
      var cargoMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
      var cargo = new THREE.Mesh(cargoGeo, cargoMat);
      cargo.position.set(pos.x + 3, 1.75, pos.z + 1);
      cargo.rotation.y = Math.PI / 6;
      cargo.castShadow = true;
      addToScene(cargo);

      // Wheels
      for (var i = 0; i < 2; i++) {
        var wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16);
        var wheelMat = new THREE.MeshLambertMaterial({ color: colors.smokeBlack });
        var wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(pos.x + (i - 0.5) * 1.5, 0.6, pos.z);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        addToScene(wheel);
      }

      // Spilled supplies
      for (var j = 0; j < 4; j++) {
        var supplyGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        var supplyMat = new THREE.MeshLambertMaterial({ color: colors.militaryGreen });
        var supply = new THREE.Mesh(supplyGeo, supplyMat);
        supply.position.set(pos.x + (Math.random() - 0.5) * 5, 1.5, pos.z + (Math.random() - 0.5) * 3);
        supply.castShadow = true;
        addToScene(supply);
      }
    });
  }

  function createCommandVehicle() {
    var x = -35, z = 0;

    // APC hull
    var hullGeo = new THREE.BoxGeometry(4, 3, 6);
    var hullMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.set(x, 1.5, z);
    hull.castShadow = true;
    addToScene(hull);

    // Command turret
    var turretGeo = new THREE.CylinderGeometry(1.5, 1.5, 1.5, 16);
    var turretMat = new THREE.MeshLambertMaterial({ color: colors.darkGreen });
    var turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.set(x, 3.5, z);
    turret.castShadow = true;
    addToScene(turret);

    // Radio mast
    var mastGeo = new THREE.CylinderGeometry(0.2, 0.2, 5, 12);
    var mastMat = new THREE.MeshLambertMaterial({ color: colors.smokeBlack });
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(x - 1.5, 5, z);
    mast.castShadow = true;
    addToScene(mast);

    // Antenna dish
    var dishGeo = new THREE.ConeGeometry(0.8, 0.5, 12);
    var dishMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
    var dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(x - 1.5, 5.8, z);
    dish.castShadow = true;
    addToScene(dish);

    // Wheels
    for (var i = 0; i < 2; i++) {
      var wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16);
      var wheelMat = new THREE.MeshLambertMaterial({ color: colors.smokeBlack });
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x + (i - 0.5) * 2, 0.7, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      addToScene(wheel);
    }
  }

  function createTracerFire() {
    // Multiple tracer fire lines across streets
    var tracerPaths = [
      { start: { x: -30, y: 8, z: 15 }, end: { x: -5, y: 5, z: 20 } },
      { start: { x: 30, y: 7, z: -15 }, end: { x: 10, y: 4, z: -5 } },
      { start: { x: 40, y: 12, z: 30 }, end: { x: 20, y: 8, z: 15 } },
      { start: { x: -40, y: 10, z: -30 }, end: { x: -15, y: 6, z: -20 } },
      { start: { x: 0, y: 6, z: 35 }, end: { x: 5, y: 3, z: 25 } }
    ];

    tracerPaths.forEach(function(path) {
      var points = [
        new THREE.Vector3(path.start.x, path.start.y, path.start.z),
        new THREE.Vector3(path.end.x, path.end.y, path.end.z)
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: colors.fireOrange, linewidth: 3 });
      var line = new THREE.LineSegments(geometry, material);
      addToScene(line);
      tracerSegments.push({
        line: line,
        startX: path.start.x, startY: path.start.y, startZ: path.start.z,
        endX: path.end.x, endY: path.end.y, endZ: path.end.z,
        opacity: 1.0,
        duration: 2.0,
        elapsed: Math.random() * 2.0
      });
    });
  }

  function createFires() {
    // Fire clusters in damaged building lower floors
    var firePositions = [
      { x: -35, y: 2.5, z: -35, intensity: 0.9 },
      { x: 35, y: 2, z: -35, intensity: 0.8 },
      { x: -35, y: 3, z: 35, intensity: 0.85 },
      { x: 20, y: 2.5, z: 10, intensity: 0.7 },
      { x: -20, y: 2, z: -10, intensity: 0.75 }
    ];

    firePositions.forEach(function(pos) {
      // Fire cluster
      for (var i = 0; i < 3; i++) {
        var fireGeo = new THREE.SphereGeometry(0.8 + Math.random() * 0.6, 8, 6);
        var fireMat = new THREE.MeshBasicMaterial({ color: colors.fireOrange });
        var fire = new THREE.Mesh(fireGeo, fireMat);
        fire.position.set(pos.x + (Math.random() - 0.5) * 2, pos.y + Math.random() * 1.5, pos.z + (Math.random() - 0.5) * 2);
        addToScene(fire);
        fireObjects.push({
          fire: fire,
          baseIntensity: pos.intensity,
          flicker: Math.random() * Math.PI * 2
        });
        fireFlickerStates.push({ elapsed: Math.random() * Math.PI * 2 });
      }

      // Smoke plume representation
      for (var j = 0; j < 2; j++) {
        var smokeGeo = new THREE.SphereGeometry(2 + Math.random(), 8, 6);
        var smokeMat = new THREE.MeshBasicMaterial({ color: colors.darkSmoke, transparent: true, opacity: 0.3 });
        var smoke = new THREE.Mesh(smokeGeo, smokeMat);
        smoke.position.set(pos.x, pos.y + 3 + j * 2, pos.z);
        addToScene(smoke);
      }
    });
  }

  function createRubbleBarricades() {
    var barricadePositions = [
      { x: -25, z: -25 },
      { x: 25, z: 25 },
      { x: -25, z: 25 },
      { x: 25, z: -25 }
    ];

    barricadePositions.forEach(function(pos) {
      // Build rubble pile with stacked boxes
      for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 3; j++) {
          var rubbleGeo = new THREE.BoxGeometry(1.5 + Math.random() * 0.8, 0.8 + Math.random() * 0.6, 1.5 + Math.random() * 0.8);
          var rubbleMat = new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? colors.rubble : colors.darkConcrete });
          var rubble = new THREE.Mesh(rubbleGeo, rubbleMat);
          rubble.position.set(pos.x + j * 2 - 2, i * 0.9 + 0.5, pos.z + (Math.random() - 0.5) * 2);
          rubble.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
          rubble.castShadow = true;
          addToScene(rubble);
        }
      }
    });
  }

  function init(scene, camera) {
    sceneRef = scene;
    cameraRef = camera;
    allObjects = [];
    tracerSegments = [];
    fireObjects = [];
    tankTurrets = [];
    fireFlickerStates = [];

    // Ground plane
    var groundGeo = new THREE.BoxGeometry(90, 0.5, 90);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    addToScene(ground);

    // Create all siege elements
    createCityBlocks();
    createSiegeArtillery();
    createTankColumn();
    createBarricades();
    createBuildingBreaches();
    createStreetFightingPositions();
    createSnipersNest();
    createCivilianShelter();
    createSupplyConvoyWreck();
    createCommandVehicle();
    createTracerFire();
    createFires();
    createRubbleBarricades();

    return {
      objectCount: allObjects.length,
      tracerCount: tracerSegments.length,
      fireCount: fireObjects.length
    };
  }

  function update(delta) {
    // Update tracer fire streaking
    for (var i = 0; i < tracerSegments.length; i++) {
      var tracer = tracerSegments[i];
      tracer.elapsed += delta;

      if (tracer.elapsed < tracer.duration) {
        var progress = tracer.elapsed / tracer.duration;
        tracer.line.material.opacity = 1.0 - progress * 0.7;

        // Animate along path
        var x = tracer.startX + (tracer.endX - tracer.startX) * progress;
        var y = tracer.startY + (tracer.endY - tracer.startY) * progress;
        var z = tracer.startZ + (tracer.endZ - tracer.startZ) * progress;

        var posAttr = tracer.line.geometry.getAttribute('position');
        if (posAttr) {
          posAttr.array[3] = x;
          posAttr.array[4] = y;
          posAttr.array[5] = z;
          posAttr.needsUpdate = true;
        }
      } else {
        tracer.elapsed = -Math.random() * 2.0;
      }
    }

    // Update fire flickering
    for (var j = 0; j < fireObjects.length; j++) {
      var fireObj = fireObjects[j];
      var state = fireFlickerStates[j];

      state.elapsed += delta * 3;
      var flicker = 0.6 + Math.sin(state.elapsed) * 0.4;
      fireObj.fire.material.opacity = fireObj.baseIntensity * flicker;

      // Slight vertical bobbing
      fireObj.fire.position.y += Math.sin(state.elapsed * 2) * 0.01;
    }

    // Tank turret slow traverse
    for (var k = 0; k < tankTurrets.length; k++) {
      var turretObj = tankTurrets[k];
      turretObj.turret.rotation.y += delta * 0.3;
    }
  }

  function reset() {
    for (var i = allObjects.length - 1; i >= 0; i--) {
      sceneRef.remove(allObjects[i]);
    }
    allObjects = [];
    tracerSegments = [];
    fireObjects = [];
    tankTurrets = [];
    fireFlickerStates = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
