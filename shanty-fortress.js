window.ShantyFortress = (function() {
  'use strict';

  var scene;
  var camera;
  var buildings = [];
  var walkways = [];
  var lights = [];
  var lightBulbs = [];
  var fireBarrel;
  var waterTower;
  var drugLab;
  var generator;
  var lightBulbsData = [];
  var fireBarrelMaterial;
  var chemicalBubbles = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    buildings = [];
    walkways = [];
    lights = [];
    lightBulbs = [];
    lightBulbsData = [];
    chemicalBubbles = [];

    buildMainShantytownCluster();
    buildWaterTower();
    buildGeneratorCluster();
    buildDrugLab();
    buildDefensiveWires();
    buildRooftopSniperHides();
    buildRainWaterBarrels();
    buildVehicleCarcasses();
    buildGangTerritoryMarkers();
    buildFireBarrel();
    buildStringLights();
    buildConcealedWeaponCache();
    buildMarketStallFronts();
    buildLookoutPlatform();
    buildMakeshiftWalkways();
  }

  function buildMainShantytownCluster() {
    var clusterX = 0;
    var clusterZ = 0;
    var buildingSpacing = 8;
    var rowCount = 5;
    var colCount = 5;

    for (var row = 0; row < rowCount; row++) {
      for (var col = 0; col < colCount; col++) {
        var x = clusterX + col * buildingSpacing - (buildingSpacing * colCount / 2);
        var z = clusterZ + row * buildingSpacing - (buildingSpacing * rowCount / 2);

        var buildingWidth = 3 + Math.random() * 3;
        var buildingDepth = 3 + Math.random() * 3;
        var buildingHeight = 4 + Math.random() * 4;

        var geometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
        var material = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var building = new THREE.Mesh(geometry, material);
        building.position.set(x, buildingHeight / 2, z);
        scene.add(building);
        buildings.push(building);

        var roofGeometry = new THREE.BoxGeometry(buildingWidth + 0.3, 0.3, buildingDepth + 0.3);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, buildingHeight + 0.15, z);
        roof.rotation.z = (Math.random() - 0.5) * 0.15;
        scene.add(roof);
        buildings.push(roof);

        if (Math.random() > 0.5 && row < rowCount - 1) {
          var secondFloorHeight = buildingHeight + 2 + Math.random() * 2;
          var secondFloorWidth = buildingWidth * 0.8;
          var secondFloorDepth = buildingDepth * 0.8;

          var pillarGeometry = new THREE.BoxGeometry(0.4, buildingHeight * 0.4, 0.4);
          var pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

          for (var p = 0; p < 4; p++) {
            var pillarX = x + (p % 2) * (secondFloorWidth - 0.4) - secondFloorWidth / 2 + 0.2;
            var pillarZ = z + Math.floor(p / 2) * (secondFloorDepth - 0.4) - secondFloorDepth / 2 + 0.2;
            var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(pillarX, buildingHeight + (buildingHeight * 0.2), pillarZ);
            scene.add(pillar);
            buildings.push(pillar);
          }

          var secondFloorGeometry = new THREE.BoxGeometry(secondFloorWidth, 0.3, secondFloorDepth);
          var secondFloorMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
          var secondFloor = new THREE.Mesh(secondFloorGeometry, secondFloorMaterial);
          secondFloor.position.set(x, buildingHeight + buildingHeight * 0.4, z);
          scene.add(secondFloor);
          buildings.push(secondFloor);

          var upperHovelGeometry = new THREE.BoxGeometry(secondFloorWidth * 0.9, secondFloorHeight - buildingHeight, secondFloorDepth * 0.9);
          var upperHovel = new THREE.Mesh(upperHovelGeometry, material);
          upperHovel.position.set(x, buildingHeight + buildingHeight * 0.4 + (secondFloorHeight - buildingHeight) / 2, z);
          scene.add(upperHovel);
          buildings.push(upperHovel);
        }
      }
    }
  }

  function buildMakeshiftWalkways() {
    var walkwayWidth = 0.8;
    var walkwayThickness = 0.2;
    var connections = [
      { x1: -15, z1: -15, x2: -8, z2: -8, height: 8 },
      { x1: -8, z1: -8, x2: 0, z2: 0, height: 10 },
      { x1: 0, z1: 0, x2: 8, z2: 8, height: 12 },
      { x1: -10, z1: 0, x2: 10, z2: 0, height: 9 },
      { x1: 0, z1: -10, x2: 0, z2: 10, height: 11 }
    ];

    for (var i = 0; i < connections.length; i++) {
      var conn = connections[i];
      var dx = conn.x2 - conn.x1;
      var dz = conn.z2 - conn.z1;
      var length = Math.sqrt(dx * dx + dz * dz);
      var angle = Math.atan2(dz, dx);

      var plankGeometry = new THREE.BoxGeometry(length, walkwayThickness, walkwayWidth);
      var plankMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
      var plank = new THREE.Mesh(plankGeometry, plankMaterial);
      plank.position.set((conn.x1 + conn.x2) / 2, conn.height, (conn.z1 + conn.z2) / 2);
      plank.rotation.y = angle;
      scene.add(plank);
      walkways.push(plank);
    }
  }

  function buildWaterTower() {
    var tankRadius = 2.5;
    var tankHeight = 3;
    var tankGeometry = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 16);
    var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(25, 10, 25);
    scene.add(tank);

    var legGeometry = new THREE.BoxGeometry(0.4, 8, 0.4);
    var legMaterial = new THREE.MeshLambertMaterial({ color: 0x8b8b8b });

    for (var l = 0; l < 4; l++) {
      var legX = 25 + (l % 2) * 2 - 1;
      var legZ = 25 + Math.floor(l / 2) * 2 - 1;
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(legX, 4, legZ);
      scene.add(leg);
    }

    waterTower = { tank: tank, position: tank.position };
  }

  function buildGeneratorCluster() {
    var genX = -25;
    var genZ = -25;

    var genGeometry = new THREE.BoxGeometry(3, 2.5, 2);
    var genMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    var gen = new THREE.Mesh(genGeometry, genMaterial);
    gen.position.set(genX, 1.25, genZ);
    scene.add(gen);

    var exhaustGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
    var exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.set(genX, 3.5, genZ - 0.8);
    scene.add(exhaust);

    var fuel1Geometry = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 8);
    var fuelMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2511 });
    var fuel1 = new THREE.Mesh(fuel1Geometry, fuelMaterial);
    fuel1.position.set(genX - 3, 0.6, genZ);
    scene.add(fuel1);

    var fuel2 = new THREE.Mesh(fuel1Geometry, fuelMaterial);
    fuel2.position.set(genX - 3, 0.6, genZ + 2);
    scene.add(fuel2);

    generator = { gen: gen, exhaust: exhaust };
  }

  function buildDrugLab() {
    var labX = -20;
    var labZ = 20;

    var labGeometry = new THREE.BoxGeometry(6, 4, 5);
    var labMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var labBuilding = new THREE.Mesh(labGeometry, labMaterial);
    labBuilding.position.set(labX, 2, labZ);
    scene.add(labBuilding);

    var equipGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 8);
    var equipMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });

    for (var e = 0; e < 3; e++) {
      var equip = new THREE.Mesh(equipGeometry, equipMaterial);
      equip.position.set(labX - 2 + e * 2, 1.25, labZ);
      scene.add(equip);
    }

    var heaterGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var heaterMaterial = new THREE.MeshLambertMaterial({ color: 0xff4500 });
    var heater = new THREE.Mesh(heaterGeometry, heaterMaterial);
    heater.position.set(labX, 1.5, labZ - 1.5);
    scene.add(heater);

    drugLab = {
      building: labBuilding,
      heater: heater,
      bubblePoint: new THREE.Vector3(labX, 2.5, labZ)
    };
  }

  function buildDefensiveWires() {
    var wirePoints = [
      [new THREE.Vector3(-22, 6, -20), new THREE.Vector3(22, 6, -20)],
      [new THREE.Vector3(22, 6, -20), new THREE.Vector3(22, 6, 20)],
      [new THREE.Vector3(22, 6, 20), new THREE.Vector3(-22, 6, 20)],
      [new THREE.Vector3(-22, 6, 20), new THREE.Vector3(-22, 6, -20)]
    ];

    var wireMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });

    for (var w = 0; w < wirePoints.length; w++) {
      var geometry = new THREE.BufferGeometry().setFromPoints(wirePoints[w]);
      var wire = new THREE.LineSegments(geometry, wireMaterial);
      scene.add(wire);
    }
  }

  function buildRooftopSniperHides() {
    var snipeLocations = [
      { x: -18, z: -15, height: 12 },
      { x: 18, z: 15, height: 13 },
      { x: 0, z: 20, height: 11 }
    ];

    for (var s = 0; s < snipeLocations.length; s++) {
      var loc = snipeLocations[s];

      var sandbagGeometry = new THREE.BoxGeometry(2, 0.8, 3);
      var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
      var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbag.position.set(loc.x, loc.height, loc.z);
      scene.add(sandbag);
    }
  }

  function buildRainWaterBarrels() {
    var barrelLocations = [
      { x: -12, z: -12 },
      { x: 12, z: -12 },
      { x: -12, z: 12 },
      { x: 12, z: 12 },
      { x: 0, z: 0 }
    ];

    for (var b = 0; b < barrelLocations.length; b++) {
      var loc = barrelLocations[b];
      var barrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 8);
      var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(loc.x, 0.9, loc.z);
      scene.add(barrel);
    }
  }

  function buildVehicleCarcasses() {
    var carcassLocations = [
      { x: -20, z: 0, scale: 1.2 },
      { x: 20, z: -10, scale: 1.0 }
    ];

    for (var v = 0; v < carcassLocations.length; v++) {
      var loc = carcassLocations[v];

      var bodyGeometry = new THREE.BoxGeometry(3.5 * loc.scale, 1.5 * loc.scale, 7 * loc.scale);
      var rustMaterial = new THREE.MeshLambertMaterial({ color: 0xa0522d });
      var body = new THREE.Mesh(bodyGeometry, rustMaterial);
      body.position.set(loc.x, 0.75 * loc.scale, loc.z);
      scene.add(body);

      var wheelGeometry = new THREE.CylinderGeometry(0.7 * loc.scale, 0.7 * loc.scale, 0.3 * loc.scale, 8);
      var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

      var wheelPositions = [
        { x: loc.x - 1.2 * loc.scale, z: loc.z - 2 * loc.scale },
        { x: loc.x + 1.2 * loc.scale, z: loc.z - 2 * loc.scale },
        { x: loc.x - 1.2 * loc.scale, z: loc.z + 2 * loc.scale },
        { x: loc.x + 1.2 * loc.scale, z: loc.z + 2 * loc.scale }
      ];

      for (var wh = 0; wh < wheelPositions.length; wh++) {
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(wheelPositions[wh].x, 0.7 * loc.scale, wheelPositions[wh].z);
        wheel.rotation.z = Math.PI / 2;
        scene.add(wheel);
      }
    }
  }

  function buildGangTerritoryMarkers() {
    var markerLocations = [
      { x: -25, z: -25, color: 0xff1493 },
      { x: 25, z: -25, color: 0xff1493 },
      { x: -25, z: 25, color: 0xff1493 },
      { x: 25, z: 25, color: 0xff1493 }
    ];

    for (var m = 0; m < markerLocations.length; m++) {
      var loc = markerLocations[m];
      var markerGeometry = new THREE.BoxGeometry(1.5, 3, 0.2);
      var markerMaterial = new THREE.MeshLambertMaterial({ color: loc.color });
      var marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(loc.x, 1.5, loc.z);
      scene.add(marker);
    }
  }

  function buildFireBarrel() {
    var barrelX = -15;
    var barrelZ = -5;

    var cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8);
    fireBarrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    fireBarrel = new THREE.Mesh(cylinderGeometry, fireBarrelMaterial);
    fireBarrel.position.set(barrelX, 0.6, barrelZ);
    scene.add(fireBarrel);

    var fireGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    var fireMaterial = new THREE.MeshLambertMaterial({ color: 0xff6500, emissive: 0xff4500 });
    var fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(barrelX, 1.5, barrelZ);
    fire.userData = { isFireCore: true };
    scene.add(fire);

    fireBarrel.userData = { fireCore: fire, baseColor: 0x2a2a2a };
  }

  function buildStringLights() {
    var stringConfigs = [
      { x1: -20, z1: -20, x2: -5, z2: -20, height: 7, bulbs: 8 },
      { x1: -20, z1: -20, x2: -20, z2: 5, height: 6.5, bulbs: 7 },
      { x1: 5, z1: -20, x2: 20, z2: -20, height: 7.5, bulbs: 9 },
      { x1: 5, z1: 20, x2: 20, z2: 20, height: 6.8, bulbs: 8 }
    ];

    for (var sc = 0; sc < stringConfigs.length; sc++) {
      var config = stringConfigs[sc];
      var linePoints = [
        new THREE.Vector3(config.x1, config.height, config.z1),
        new THREE.Vector3(config.x2, config.height, config.z2)
      ];

      var lineMaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 });
      var lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      var line = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(line);
      lights.push(line);

      var dx = config.x2 - config.x1;
      var dz = config.z2 - config.z1;
      var length = Math.sqrt(dx * dx + dz * dz);

      for (var b = 0; b < config.bulbs; b++) {
        var t = b / (config.bulbs - 1);
        var bulbX = config.x1 + dx * t;
        var bulbZ = config.z1 + dz * t;

        var bulbGeometry = new THREE.SphereGeometry(0.2, 6, 6);
        var bulbMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0xffaa00 });
        var bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.position.set(bulbX, config.height, bulbZ);
        bulb.userData = {
          isBulb: true,
          originalEmissive: 0xffaa00,
          flickerPhase: Math.random() * Math.PI * 2
        };
        scene.add(bulb);
        lightBulbs.push(bulb);
        lightBulbsData.push({
          bulb: bulb,
          baseIntensity: 1.0,
          flickerPhase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  function buildConcealedWeaponCache() {
    var cacheX = 15;
    var cacheZ = -20;

    var wallGeometry = new THREE.BoxGeometry(0.3, 2, 1.5);
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(cacheX, 1, cacheZ);
    scene.add(wall);

    var doorGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.2);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(cacheX - 0.2, 1.2, cacheZ);
    door.userData = { isWeaponCacheDoor: true };
    scene.add(door);
  }

  function buildMarketStallFronts() {
    var stallLocations = [
      { x: -28, z: -28, color: 0xdc143c },
      { x: -28, z: 28, color: 0x32cd32 },
      { x: 28, z: -28, color: 0xff8c00 },
      { x: 28, z: 28, color: 0x4169e1 }
    ];

    for (var st = 0; st < stallLocations.length; st++) {
      var loc = stallLocations[st];

      var stallGeometry = new THREE.BoxGeometry(3, 2.5, 2);
      var stallMaterial = new THREE.MeshLambertMaterial({ color: loc.color });
      var stall = new THREE.Mesh(stallGeometry, stallMaterial);
      stall.position.set(loc.x, 1.25, loc.z);
      scene.add(stall);

      var awningGeometry = new THREE.BoxGeometry(3.2, 0.3, 2.3);
      var awningMaterial = new THREE.MeshLambertMaterial({ color: loc.color });
      var awning = new THREE.Mesh(awningGeometry, awningMaterial);
      awning.position.set(loc.x, 2.8, loc.z);
      scene.add(awning);
    }
  }

  function buildLookoutPlatform() {
    var platformX = 0;
    var platformZ = -28;

    var platformGeometry = new THREE.BoxGeometry(4, 0.3, 4);
    var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(platformX, 8, platformZ);
    scene.add(platform);

    var supportGeometry = new THREE.BoxGeometry(0.5, 8, 0.5);
    var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });

    for (var su = 0; su < 4; su++) {
      var supportX = platformX + (su % 2) * 1.5 - 0.75;
      var supportZ = platformZ + Math.floor(su / 2) * 1.5 - 0.75;
      var support = new THREE.Mesh(supportGeometry, supportMaterial);
      support.position.set(supportX, 4, supportZ);
      scene.add(support);
    }

    var ladderPoints1 = [
      new THREE.Vector3(platformX - 1.8, 8, platformZ - 1.8),
      new THREE.Vector3(platformX - 1.8, 0.2, platformZ - 1.8)
    ];
    var ladderMaterial = new THREE.LineBasicMaterial({ color: 0x8b8b8b, linewidth: 2 });
    var ladderGeometry1 = new THREE.BufferGeometry().setFromPoints(ladderPoints1);
    var ladder1 = new THREE.LineSegments(ladderGeometry1, ladderMaterial);
    scene.add(ladder1);

    for (var rung = 0; rung < 8; rung++) {
      var rungHeight = 1 + rung;
      var rungPoints = [
        new THREE.Vector3(platformX - 1.5, rungHeight, platformZ - 1.8),
        new THREE.Vector3(platformX - 2.1, rungHeight, platformZ - 1.8)
      ];
      var rungGeometry = new THREE.BufferGeometry().setFromPoints(rungPoints);
      var rung3D = new THREE.LineSegments(rungGeometry, ladderMaterial);
      scene.add(rung3D);
    }
  }

  function update(delta) {
    var time = performance.now() * 0.001;

    for (var lb = 0; lb < lightBulbsData.length; lb++) {
      var bulbData = lightBulbsData[lb];
      var flicker = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * 8 + bulbData.flickerPhase));
      bulbData.bulb.material.emissive.setHex(bulbData.bulb.userData.originalEmissive);
      bulbData.bulb.material.emissive.multiplyScalar(flicker);
    }

    if (fireBarrel) {
      var fireFlicker = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * 12));
      fireBarrel.material.color.setHex(fireBarrel.userData.baseColor);

      if (fireBarrel.userData.fireCore) {
        fireBarrel.userData.fireCore.material.emissive.setHex(0xff4500);
        fireBarrel.userData.fireCore.material.emissive.multiplyScalar(fireFlicker);
      }
    }

    if (waterTower && waterTower.tank) {
      waterTower.tank.material.emissive.setHex(0x444444);
      waterTower.tank.material.emissive.multiplyScalar(0.1 + 0.1 * Math.sin(time * 2));
    }

    if (drugLab && drugLab.heater) {
      if (Math.random() > 0.97) {
        var bubbleGeometry = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 6, 6);
        var bubbleMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x00aa00 });
        var bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble.position.copy(drugLab.bubblePoint);
        bubble.userData = {
          isBubble: true,
          velocity: new THREE.Vector3((Math.random() - 0.5) * 2, 4 + Math.random() * 2, (Math.random() - 0.5) * 2),
          life: 2.0
        };
        scene.add(bubble);
        chemicalBubbles.push(bubble);
      }
    }

    for (var cb = chemicalBubbles.length - 1; cb >= 0; cb--) {
      var chem = chemicalBubbles[cb];
      chem.userData.life -= delta;
      chem.position.add(chem.userData.velocity.clone().multiplyScalar(delta));
      chem.material.opacity = chem.userData.life / 2.0;

      if (chem.userData.life <= 0) {
        scene.remove(chem);
        chemicalBubbles.splice(cb, 1);
      }
    }
  }

  function reset() {
    for (var i = buildings.length - 1; i >= 0; i--) {
      scene.remove(buildings[i]);
    }
    buildings = [];

    for (var w = walkways.length - 1; w >= 0; w--) {
      scene.remove(walkways[w]);
    }
    walkways = [];

    for (var l = lights.length - 1; l >= 0; l--) {
      scene.remove(lights[l]);
    }
    lights = [];

    for (var lb2 = lightBulbs.length - 1; lb2 >= 0; lb2--) {
      scene.remove(lightBulbs[lb2]);
    }
    lightBulbs = [];
    lightBulbsData = [];

    for (var cb2 = chemicalBubbles.length - 1; cb2 >= 0; cb2--) {
      scene.remove(chemicalBubbles[cb2]);
    }
    chemicalBubbles = [];

    fireBarrel = null;
    waterTower = null;
    drugLab = null;
    generator = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
