window.CityRooftop = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var rooftopGroup = null;
  var helicopterLights = [];
  var hvacFans = [];
  var antennas = [];
  var billboards = [];
  var ziplineCable = null;
  var animationTime = 0;

  var init = function(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    rooftopGroup = new THREE.Group();
    scene.add(rooftopGroup);

    helicopterLights = [];
    hvacFans = [];
    antennas = [];
    billboards = [];
    animationTime = 0;

    // Main rooftop floor surface (large flat box)
    var floorGeometry = new THREE.BoxGeometry(200, 2, 150);
    var floorMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.castShadow = true;
    floor.receiveShadow = true;
    rooftopGroup.add(floor);

    // Parapet walls around roof edge
    var parapetMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var parapetHeight = 1.5;
    var parapetThickness = 0.3;

    // Front wall
    var frontWallGeo = new THREE.BoxGeometry(200, parapetHeight, parapetThickness);
    var frontWall = new THREE.Mesh(frontWallGeo, parapetMaterial);
    frontWall.position.y = 1;
    frontWall.position.z = 75;
    frontWall.castShadow = true;
    rooftopGroup.add(frontWall);

    // Back wall
    var backWall = new THREE.Mesh(frontWallGeo, parapetMaterial);
    backWall.position.y = 1;
    backWall.position.z = -75;
    backWall.castShadow = true;
    rooftopGroup.add(backWall);

    // Left wall
    var sideWallGeo = new THREE.BoxGeometry(parapetThickness, parapetHeight, 150);
    var leftWall = new THREE.Mesh(sideWallGeo, parapetMaterial);
    leftWall.position.y = 1;
    leftWall.position.x = -100;
    leftWall.castShadow = true;
    rooftopGroup.add(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(sideWallGeo, parapetMaterial);
    rightWall.position.y = 1;
    rightWall.position.x = 100;
    rightWall.castShadow = true;
    rooftopGroup.add(rightWall);

    // HVAC units (box clusters)
    var hvacGroup1 = createHVACUnit(30, 2, 20);
    hvacGroup1.position.set(-50, 1, -40);
    rooftopGroup.add(hvacGroup1);

    var hvacGroup2 = createHVACUnit(25, 2, 25);
    hvacGroup2.position.set(60, 1, 35);
    rooftopGroup.add(hvacGroup2);

    var hvacGroup3 = createHVACUnit(20, 2, 18);
    hvacGroup3.position.set(-60, 1, 50);
    rooftopGroup.add(hvacGroup3);

    // Water tower (cylinder on stilts)
    var towerGroup = createWaterTower(-70, 15);
    rooftopGroup.add(towerGroup);

    // Helicopter pad with H marking
    var heloPadGroup = createHelicopterPad(70, 0, -50);
    rooftopGroup.add(heloPadGroup);

    // Billboard panels (tall flat boxes with colored faces)
    var billboard1 = createBillboard(50, 20, 0);
    rooftopGroup.add(billboard1);

    var billboard2 = createBillboard(-40, 20, -60);
    rooftopGroup.add(billboard2);

    // Penthouse skylight (glass pyramid)
    var skylightGeo = new THREE.ConeGeometry(8, 6, 4);
    var skylightMaterial = new THREE.MeshPhongMaterial({
      color: 0x88AAFF,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    var skylight = new THREE.Mesh(skylightGeo, skylightMaterial);
    skylight.position.set(0, 3, 20);
    skylight.castShadow = true;
    rooftopGroup.add(skylight);

    // Antenna cluster (thin cylinders)
    var antennaGroup = createAntennaCluster(-45, 25, 45);
    rooftopGroup.add(antennaGroup);

    // Elevator shaft access hatch (small box with circular ring)
    var hatchGeo = new THREE.BoxGeometry(4, 0.5, 4);
    var hatchMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var hatch = new THREE.Mesh(hatchGeo, hatchMaterial);
    hatch.position.set(40, 1.25, 10);
    hatch.castShadow = true;
    rooftopGroup.add(hatch);

    // Ventilation fans (rotating cylinders)
    var fan1 = createVentilationFan(-20, 3, 30);
    rooftopGroup.add(fan1);

    var fan2 = createVentilationFan(75, 3, -30);
    rooftopGroup.add(fan2);

    // Fire escape ladder
    var ladderGroup = createFireEscapeLadder(95, 5, 60);
    rooftopGroup.add(ladderGroup);

    // Satellite dish
    var satelliteGroup = createSatelliteDish(80, 15, 50);
    rooftopGroup.add(satelliteGroup);

    // Sniper nest sandbag wall
    var sandbagWallGroup = createSandbagWall(-80, 2, 0);
    rooftopGroup.add(sandbagWallGroup);

    // Zipline cable (LineSegments between buildings)
    ziplineCable = createZiplineCable(70, 12, -40, -70, 12, 40);
    rooftopGroup.add(ziplineCable);

    // Neighboring building silhouettes
    var neighborBuilding1 = createNeighboringBuilding(140, 18, 30);
    rooftopGroup.add(neighborBuilding1);

    var neighborBuilding2 = createNeighboringBuilding(-140, 22, -25);
    rooftopGroup.add(neighborBuilding2);

    return rooftopGroup.children.length;
  };

  var createHVACUnit = function(width, height, depth) {
    var group = new THREE.Group();
    var material = new THREE.MeshPhongMaterial({ color: 0x333333 });

    // Main body
    var bodyGeo = new THREE.BoxGeometry(width, height, depth);
    var body = new THREE.Mesh(bodyGeo, material);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Orange vent opening
    var ventGeo = new THREE.BoxGeometry(width * 0.6, height * 0.4, 0.5);
    var ventMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6600 });
    var vent = new THREE.Mesh(ventGeo, ventMaterial);
    vent.position.z = depth / 2;
    vent.castShadow = true;
    group.add(vent);

    // Spinning fan inside
    var fanGeo = new THREE.CylinderGeometry(width * 0.25, width * 0.25, 0.3, 8);
    var fanMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var fan = new THREE.Mesh(fanGeo, fanMaterial);
    fan.position.set(0, 0, depth / 2 + 0.5);
    fan.castShadow = true;
    group.add(fan);
    hvacFans.push(fan);

    return group;
  };

  var createWaterTower = function(x, height) {
    var group = new THREE.Group();

    // Four stilts
    var stiltMaterial = new THREE.MeshPhongMaterial({ color: 0x777777 });
    var stiltGeo = new THREE.CylinderGeometry(0.5, 0.5, height, 8);

    var stilt1 = new THREE.Mesh(stiltGeo, stiltMaterial);
    stilt1.position.set(x - 6, height / 2, -6);
    stilt1.castShadow = true;
    group.add(stilt1);

    var stilt2 = new THREE.Mesh(stiltGeo, stiltMaterial);
    stilt2.position.set(x + 6, height / 2, -6);
    stilt2.castShadow = true;
    group.add(stilt2);

    var stilt3 = new THREE.Mesh(stiltGeo, stiltMaterial);
    stilt3.position.set(x - 6, height / 2, 6);
    stilt3.castShadow = true;
    group.add(stilt3);

    var stilt4 = new THREE.Mesh(stiltGeo, stiltMaterial);
    stilt4.position.set(x + 6, height / 2, 6);
    stilt4.castShadow = true;
    group.add(stilt4);

    // Water tank cylinder
    var tankGeo = new THREE.CylinderGeometry(8, 8, 10, 16);
    var tankMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var tank = new THREE.Mesh(tankGeo, tankMaterial);
    tank.position.set(x, height + 5, 0);
    tank.castShadow = true;
    tank.receiveShadow = true;
    group.add(tank);

    return group;
  };

  var createHelicopterPad = function(x, y, z) {
    var group = new THREE.Group();

    // Pad surface
    var padGeo = new THREE.CylinderGeometry(15, 15, 0.5, 32);
    var padMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var pad = new THREE.Mesh(padGeo, padMaterial);
    pad.position.set(x, y + 1, z);
    pad.castShadow = true;
    pad.receiveShadow = true;
    group.add(pad);

    // Blinking lights around perimeter
    var lightCount = 8;
    for (var i = 0; i < lightCount; i++) {
      var angle = (i / lightCount) * Math.PI * 2;
      var lightX = x + Math.cos(angle) * 12;
      var lightZ = z + Math.sin(angle) * 12;

      var lightGeo = new THREE.SphereGeometry(0.4, 8, 8);
      var lightMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
      var light = new THREE.Mesh(lightGeo, lightMaterial);
      light.position.set(lightX, y + 1.2, lightZ);
      light.castShadow = true;
      group.add(light);
      helicopterLights.push({
        mesh: light,
        intensity: 1,
        phase: i * Math.PI / 4
      });
    }

    // H marking on surface
    var hGeo = new THREE.BoxGeometry(2, 0.2, 2);
    var hMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    var h1 = new THREE.Mesh(hGeo, hMaterial);
    h1.position.set(x - 2, y + 1.1, z);
    group.add(h1);

    var h2 = new THREE.Mesh(hGeo, hMaterial);
    h2.position.set(x + 2, y + 1.1, z);
    group.add(h2);

    var hBarGeo = new THREE.BoxGeometry(4, 0.2, 2);
    var hBar = new THREE.Mesh(hBarGeo, hMaterial);
    hBar.position.set(x, y + 1.1, z);
    group.add(hBar);

    return group;
  };

  var createBillboard = function(x, height, z) {
    var group = new THREE.Group();

    // Support poles
    var poleGeo = new THREE.CylinderGeometry(1, 1, height, 8);
    var poleMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });

    var pole1 = new THREE.Mesh(poleGeo, poleMaterial);
    pole1.position.set(x - 6, height / 2, z);
    pole1.castShadow = true;
    group.add(pole1);

    var pole2 = new THREE.Mesh(poleGeo, poleMaterial);
    pole2.position.set(x + 6, height / 2, z);
    pole2.castShadow = true;
    group.add(pole2);

    // Billboard panel
    var panelGeo = new THREE.BoxGeometry(16, height - 2, 1);
    var panelMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    var panel = new THREE.Mesh(panelGeo, panelMaterial);
    panel.position.set(x, height / 2, z + 1);
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);
    billboards.push(panel);

    // Colored accent stripes
    var stripe1Geo = new THREE.BoxGeometry(16, 2, 0.5);
    var stripe1Material = new THREE.MeshPhongMaterial({ color: 0xFF6600 });
    var stripe1 = new THREE.Mesh(stripe1Geo, stripe1Material);
    stripe1.position.set(x, height * 0.25, z + 1.5);
    group.add(stripe1);

    var stripe2Material = new THREE.MeshPhongMaterial({ color: 0x00CCFF });
    var stripe2 = new THREE.Mesh(stripe1Geo, stripe2Material);
    stripe2.position.set(x, height * 0.75, z + 1.5);
    group.add(stripe2);

    return group;
  };

  var createAntennaCluster = function(x, height, z) {
    var group = new THREE.Group();

    // Multiple thin antenna cylinders
    var antennaCount = 6;
    for (var i = 0; i < antennaCount; i++) {
      var offsetX = (i % 3) * 4 - 4;
      var offsetZ = Math.floor(i / 3) * 4 - 2;

      var antennaGeo = new THREE.CylinderGeometry(0.2, 0.2, height, 6);
      var antennaMaterial = new THREE.MeshPhongMaterial({ color: 0xAAAAAA });
      var antenna = new THREE.Mesh(antennaGeo, antennaMaterial);
      antenna.position.set(x + offsetX, height / 2, z + offsetZ);
      antenna.castShadow = true;
      group.add(antenna);
      antennas.push({
        mesh: antenna,
        baseHeight: height / 2,
        phase: i * Math.PI / 3
      });

      // Signal indicator light on top
      var lightGeo = new THREE.SphereGeometry(0.3, 8, 8);
      var lightMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
      var light = new THREE.Mesh(lightGeo, lightMaterial);
      light.position.set(x + offsetX, height + 0.5, z + offsetZ);
      group.add(light);
    }

    return group;
  };

  var createVentilationFan = function(x, y, z) {
    var group = new THREE.Group();

    // Fan housing
    var housingGeo = new THREE.CylinderGeometry(2, 2, 1, 8);
    var housingMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var housing = new THREE.Mesh(housingGeo, housingMaterial);
    housing.position.set(x, y, z);
    housing.castShadow = true;
    group.add(housing);

    // Rotating fan blades
    var bladeGeo = new THREE.BoxGeometry(3, 0.3, 0.5);
    var bladeMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    for (var i = 0; i < 4; i++) {
      var blade = new THREE.Mesh(bladeGeo, bladeMaterial);
      blade.position.set(x, y + 0.5, z);
      blade.rotation.z = (i / 4) * Math.PI * 2;
      blade.castShadow = true;
      group.add(blade);
      hvacFans.push(blade);
    }

    return group;
  };

  var createFireEscapeLadder = function(x, width, z) {
    var group = new THREE.Group();

    // Two vertical rails
    var railGeo = new THREE.CylinderGeometry(0.2, 0.2, 25, 6);
    var railMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });

    var rail1 = new THREE.Mesh(railGeo, railMaterial);
    rail1.position.set(x - 1, 12.5, z);
    rail1.castShadow = true;
    group.add(rail1);

    var rail2 = new THREE.Mesh(railGeo, railMaterial);
    rail2.position.set(x + 1, 12.5, z);
    rail2.castShadow = true;
    group.add(rail2);

    // Rungs
    var rungGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6);
    var rungMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    for (var i = 0; i < 8; i++) {
      var rung = new THREE.Mesh(rungGeo, rungMaterial);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(x, 3 + i * 3, z);
      rung.castShadow = true;
      group.add(rung);
    }

    return group;
  };

  var createSatelliteDish = function(x, height, z) {
    var group = new THREE.Group();

    // Support pole
    var poleGeo = new THREE.CylinderGeometry(0.5, 0.5, height - 2, 8);
    var poleMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var pole = new THREE.Mesh(poleGeo, poleMaterial);
    pole.position.set(x, (height - 2) / 2, z);
    pole.castShadow = true;
    group.add(pole);

    // Dish (hemisphere)
    var dishGeo = new THREE.SphereGeometry(4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    var dishMaterial = new THREE.MeshPhongMaterial({
      color: 0xCCCCCC,
      metalness: 0.8,
      roughness: 0.2
    });
    var dish = new THREE.Mesh(dishGeo, dishMaterial);
    dish.position.set(x, height - 2, z);
    dish.rotation.x = Math.PI / 4;
    dish.castShadow = true;
    group.add(dish);

    return group;
  };

  var createSandbagWall = function(x, y, z) {
    var group = new THREE.Group();

    var bagMaterial = new THREE.MeshPhongMaterial({ color: 0x8B6F47 });
    var bagGeo = new THREE.BoxGeometry(1.5, 0.8, 1);

    // Create wall pattern
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 3; j++) {
        var bag = new THREE.Mesh(bagGeo, bagMaterial);
        bag.position.set(x + i * 1.5 - 3.75, y + j * 0.8, z);
        bag.castShadow = true;
        bag.receiveShadow = true;
        group.add(bag);
      }
    }

    return group;
  };

  var createZiplineCable = function(x1, y1, z1, x2, y2, z2) {
    var material = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 3 });
    var geometry = new THREE.BufferGeometry();

    // Create cable with slight curve
    var points = [];
    for (var i = 0; i <= 20; i++) {
      var t = i / 20;
      var x = x1 + (x2 - x1) * t;
      var y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 2;
      var z = z1 + (z2 - z1) * t;
      points.push(new THREE.Vector3(x, y, z));
    }

    geometry.setFromPoints(points);
    return new THREE.LineSegments(geometry, material);
  };

  var createNeighboringBuilding = function(x, height, z) {
    var group = new THREE.Group();

    var buildingGeo = new THREE.BoxGeometry(30, height, 25);
    var buildingMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var building = new THREE.Mesh(buildingGeo, buildingMaterial);
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // Window pattern
    var windowGeo = new THREE.BoxGeometry(2, 2, 0.5);
    var windowMaterial = new THREE.MeshPhongMaterial({ color: 0x112244 });
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 4; j++) {
        var window_obj = new THREE.Mesh(windowGeo, windowMaterial);
        window_obj.position.set(
          x - 10 + i * 10,
          3 + j * height / 3.5,
          z + 12.5
        );
        group.add(window_obj);
      }
    }

    return group;
  };

  var update = function(delta) {
    animationTime += delta;

    // Helicopter pad lights blinking
    for (var i = 0; i < helicopterLights.length; i++) {
      var light = helicopterLights[i];
      var blinkValue = Math.sin(animationTime * 3 + light.phase) * 0.5 + 0.5;
      light.mesh.material.emissive.setHex(0xFF0000);
      light.mesh.material.emissiveIntensity = blinkValue;
    }

    // HVAC fans spinning
    for (var j = 0; j < hvacFans.length; j++) {
      hvacFans[j].rotation.z += delta * 5;
    }

    // Zipline swaying
    if (ziplineCable) {
      ziplineCable.rotation.z = Math.sin(animationTime * 0.5) * 0.05;
    }

    // Billboard light flickering
    for (var k = 0; k < billboards.length; k++) {
      var flickerValue = Math.random() * 0.3 + 0.7;
      billboards[k].material.emissive.setHex(0xFFFFFF);
      billboards[k].material.emissiveIntensity = flickerValue * 0.1;
    }

    // Antenna signal blink and sway
    for (var m = 0; m < antennas.length; m++) {
      var antenna = antennas[m];
      var swayAmount = Math.sin(animationTime * 0.8 + antenna.phase) * 0.02;
      antenna.mesh.position.x += swayAmount;

      // Signal blink
      var children = antenna.mesh.parent.children;
      var lightIndex = antenna.mesh.parent.children.indexOf(antenna.mesh) + 1;
      if (lightIndex < children.length) {
        var signalLight = children[lightIndex];
        if (signalLight && signalLight.material) {
          var blinkInt = Math.sin(animationTime * 2 + antenna.phase) * 0.5 + 0.5;
          signalLight.material.emissiveIntensity = blinkInt;
        }
      }
    }
  };

  var reset = function() {
    if (rooftopGroup && scene) {
      scene.remove(rooftopGroup);
    }
    rooftopGroup = null;
    helicopterLights = [];
    hvacFans = [];
    antennas = [];
    billboards = [];
    ziplineCable = null;
    animationTime = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
