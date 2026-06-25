window.RadioStation = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lights = [];
  var antennas = [];
  var dishes = [];
  var generators = [];
  var signalLight = null;
  var antennaTime = 0;

  var colorJungleGreen = 0x2a5a3a;
  var colorColdGray = 0x505050;
  var colorRustBrown = 0x8b4513;
  var colorWhite = 0xffffff;
  var colorRed = 0xff3333;
  var colorDarkGreen = 0x1a3a1a;
  var colorOrange = 0xff8c00;

  function createMaterial(color) {
    var material = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 30
    });
    return material;
  }

  function createGroundPlane() {
    var geometry = new THREE.BoxGeometry(80, 0.5, 80);
    var material = createMaterial(colorDarkGreen);
    var ground = new THREE.Mesh(geometry, material);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);
    meshes.push(ground);
  }

  function createMainAntennaTower() {
    var baseHeight = 1;
    var towerHeight = 45;
    var segmentCount = 8;
    var segmentHeight = towerHeight / segmentCount;

    for (var i = 0; i < segmentCount; i++) {
      var yPos = baseHeight + (i * segmentHeight) + (segmentHeight / 2);
      var radius = 1.2 - (i * 0.1);
      var geometry = new THREE.CylinderGeometry(radius, radius, segmentHeight, 8);
      var material = createMaterial(colorColdGray);
      var segment = new THREE.Mesh(geometry, material);
      segment.position.set(-25, yPos, 0);
      segment.castShadow = true;
      segment.receiveShadow = true;
      scene.add(segment);
      meshes.push(segment);
      antennas.push(segment);
    }

    var topRadius = 0.3;
    var topGeometry = new THREE.ConeGeometry(topRadius, 3, 8);
    var topMaterial = createMaterial(colorRed);
    var topCone = new THREE.Mesh(topGeometry, topMaterial);
    topCone.position.set(-25, baseHeight + towerHeight + 1.5, 0);
    topCone.castShadow = true;
    scene.add(topCone);
    meshes.push(topCone);
    antennas.push(topCone);
  }

  function createTowerGuyWires() {
    var baseX = -25;
    var baseY = 20;
    var baseZ = 0;
    var anchorDistance = 30;

    var anchors = [
      [baseX - anchorDistance, 0.5, baseZ - anchorDistance],
      [baseX + anchorDistance, 0.5, baseZ - anchorDistance],
      [baseX - anchorDistance, 0.5, baseZ + anchorDistance],
      [baseX + anchorDistance, 0.5, baseZ + anchorDistance]
    ];

    for (var i = 0; i < anchors.length; i++) {
      var points = [
        new THREE.Vector3(baseX, baseY, baseZ),
        new THREE.Vector3(anchors[i][0], anchors[i][1], anchors[i][2])
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: colorColdGray, linewidth: 2 });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      meshes.push(line);
    }
  }

  function createBroadcastBuilding() {
    var width = 12;
    var depth = 15;
    var height = 8;

    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = createMaterial(colorColdGray);
    var building = new THREE.Mesh(geometry, material);
    building.position.set(15, height / 2, 10);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    meshes.push(building);

    var roofGeometry = new THREE.BoxGeometry(width + 1, 0.5, depth + 1);
    var roofMaterial = createMaterial(colorRustBrown);
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(15, height + 0.25, 10);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
    meshes.push(roof);
  }

  function createSatelliteDishes() {
    var dishPositions = [
      [15, 9, 5],
      [20, 9, 15],
      [10, 9, 15]
    ];

    for (var i = 0; i < dishPositions.length; i++) {
      var pos = dishPositions[i];

      var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
      var poleMaterial = createMaterial(colorColdGray);
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pos[0], pos[1] + 2, pos[2]);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);
      meshes.push(pole);

      var dishGeometry = new THREE.SphereGeometry(2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.2);
      var dishMaterial = createMaterial(colorColdGray);
      var dish = new THREE.Mesh(dishGeometry, dishMaterial);
      dish.rotation.x = -0.3;
      dish.position.set(pos[0], pos[1] + 4.5, pos[2]);
      dish.castShadow = true;
      dish.receiveShadow = true;
      scene.add(dish);
      meshes.push(dish);
      dishes.push(dish);
    }
  }

  function createGeneratorShed() {
    var width = 10;
    var depth = 8;
    var height = 6;

    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = createMaterial(colorRustBrown);
    var shed = new THREE.Mesh(geometry, material);
    shed.position.set(-15, height / 2, 20);
    shed.castShadow = true;
    shed.receiveShadow = true;
    scene.add(shed);
    meshes.push(shed);
    generators.push(shed);

    var roofGeometry = new THREE.BoxGeometry(width + 0.5, 0.4, depth + 0.5);
    var roofMaterial = createMaterial(0x664400);
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-15, height + 0.2, 20);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
    meshes.push(roof);

    var engineGeometry = new THREE.CylinderGeometry(0.6, 0.8, 2, 6);
    var engineMaterial = createMaterial(colorRustBrown);
    var engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.set(-15, height + 1.5, 20);
    engine.castShadow = true;
    scene.add(engine);
    meshes.push(engine);
    generators.push(engine);
  }

  function createUndergroundBunker() {
    var width = 20;
    var depth = 15;
    var height = 4;

    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = createMaterial(colorColdGray);
    var bunker = new THREE.Mesh(geometry, material);
    bunker.position.set(0, -2, -20);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    scene.add(bunker);
    meshes.push(bunker);

    var entranceWidth = 3;
    var entranceHeight = 3;
    var entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, 1);
    var entranceMaterial = createMaterial(0x333333);
    var entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(-5, -0.5, -17.5);
    entrance.castShadow = true;
    scene.add(entrance);
    meshes.push(entrance);
  }

  function createGuardPosts() {
    var postPositions = [
      [-30, 0, -30],
      [30, 0, -30],
      [-30, 0, 30],
      [30, 0, 30]
    ];

    for (var i = 0; i < postPositions.length; i++) {
      var pos = postPositions[i];

      var baseGeometry = new THREE.CylinderGeometry(3, 3.5, 0.5, 8);
      var baseMaterial = createMaterial(colorColdGray);
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(pos[0], 0.25, pos[2]);
      base.castShadow = true;
      base.receiveShadow = true;
      scene.add(base);
      meshes.push(base);

      var wallGeometry = new THREE.BoxGeometry(5, 3, 5);
      var wallMaterial = createMaterial(colorColdGray);
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos[0], 1.5, pos[2]);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      meshes.push(wall);

      var roofGeometry = new THREE.ConeGeometry(3.5, 2, 8);
      var roofMaterial = createMaterial(colorRustBrown);
      var roofCone = new THREE.Mesh(roofGeometry, roofMaterial);
      roofCone.position.set(pos[0], 4, pos[2]);
      roofCone.castShadow = true;
      scene.add(roofCone);
      meshes.push(roofCone);
    }
  }

  function createConcertinaWire() {
    var wireColor = colorColdGray;
    var perimeter = 75;
    var zigzagHeight = 2;
    var pointCount = 20;

    for (var loop = 0; loop < 3; loop++) {
      var points = [];
      var baseDistance = 35 + (loop * 2);

      for (var i = 0; i <= pointCount; i++) {
        var t = i / pointCount;
        var angle = t * Math.PI * 2;
        var x = Math.cos(angle) * baseDistance;
        var z = Math.sin(angle) * baseDistance;
        var y = Math.sin(angle * 4) * zigzagHeight * 0.5;
        points.push(new THREE.Vector3(x, y, z));
      }

      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: wireColor, linewidth: 1 });
      var wireLoop = new THREE.LineSegments(geometry, material);
      scene.add(wireLoop);
      meshes.push(wireLoop);
    }
  }

  function createJungleCoverStumps() {
    var stumpPositions = [
      [-10, 0, -35],
      [0, 0, -38],
      [10, 0, -35],
      [20, 0, -30],
      [-25, 0, -25],
      [25, 0, -20],
      [-20, 0, 15],
      [15, 0, 25],
      [-15, 0, 35],
      [5, 0, 38]
    ];

    for (var i = 0; i < stumpPositions.length; i++) {
      var pos = stumpPositions[i];

      var stumpGeometry = new THREE.CylinderGeometry(1.5, 2, 0.8, 8);
      var stumpMaterial = createMaterial(colorRustBrown);
      var stump = new THREE.Mesh(stumpGeometry, stumpMaterial);
      stump.position.set(pos[0], 0.4, pos[2]);
      stump.castShadow = true;
      stump.receiveShadow = true;
      scene.add(stump);
      meshes.push(stump);
    }
  }

  function createBackupAntennaMast() {
    var mastHeight = 20;
    var segmentCount = 5;
    var segmentHeight = mastHeight / segmentCount;

    for (var i = 0; i < segmentCount; i++) {
      var yPos = (i * segmentHeight) + (segmentHeight / 2);
      var radius = 0.8 - (i * 0.05);
      var geometry = new THREE.CylinderGeometry(radius, radius, segmentHeight, 6);
      var material = createMaterial(colorColdGray);
      var segment = new THREE.Mesh(geometry, material);
      segment.position.set(30, yPos, -20);
      segment.castShadow = true;
      segment.receiveShadow = true;
      scene.add(segment);
      meshes.push(segment);
      antennas.push(segment);
    }

    var topGeometry = new THREE.ConeGeometry(0.25, 2, 6);
    var topMaterial = createMaterial(colorOrange);
    var top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(30, mastHeight + 1, -20);
    top.castShadow = true;
    scene.add(top);
    meshes.push(top);
    antennas.push(top);
  }

  function createJammingEquipmentArrays() {
    var arrayPositions = [
      [15, 9, 0],
      [15, 9, -5]
    ];

    for (var i = 0; i < arrayPositions.length; i++) {
      var pos = arrayPositions[i];

      for (var j = 0; j < 3; j++) {
        var boxGeometry = new THREE.BoxGeometry(1.2, 2.5, 1);
        var boxMaterial = createMaterial(colorColdGray);
        var box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(pos[0] + (j - 1) * 2, pos[1] + 1.25, pos[2]);
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);
        meshes.push(box);

        var antennaGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 4);
        var antennaMaterial = createMaterial(colorRed);
        var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(pos[0] + (j - 1) * 2, pos[1] + 2.5, pos[2]);
        antenna.castShadow = true;
        scene.add(antenna);
        meshes.push(antenna);
      }
    }
  }

  function createLights() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(40, 50, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    directionalLight.shadow.camera.far = 200;
    scene.add(directionalLight);
    lights.push(directionalLight);

    signalLight = new THREE.PointLight(colorRed, 0.5, 30);
    signalLight.position.set(-25, 47, 0);
    signalLight.castShadow = true;
    scene.add(signalLight);
    lights.push(signalLight);
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    createGroundPlane();
    createMainAntennaTower();
    createTowerGuyWires();
    createBroadcastBuilding();
    createSatelliteDishes();
    createGeneratorShed();
    createUndergroundBunker();
    createGuardPosts();
    createConcertinaWire();
    createJungleCoverStumps();
    createBackupAntennaMast();
    createJammingEquipmentArrays();
    createLights();
  }

  function updateSignalLight(delta) {
    antennaTime += delta;
    var pulseIntensity = 0.5 + Math.sin(antennaTime * 3) * 0.4;
    signalLight.intensity = pulseIntensity;
  }

  function updateDishRotation(delta) {
    for (var i = 0; i < dishes.length; i++) {
      dishes[i].rotation.z += delta * 0.3;
    }
  }

  function updateGeneratorVibration(delta) {
    var vibrationAmount = Math.sin(antennaTime * 8) * 0.05;
    for (var i = 0; i < generators.length; i++) {
      generators[i].position.y += vibrationAmount * 0.01;
    }
  }

  function update(delta) {
    if (!scene || !camera) {
      return;
    }

    updateSignalLight(delta);
    updateDishRotation(delta);
    updateGeneratorVibration(delta);
  }

  function reset() {
    antennaTime = 0;

    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];

    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    lights = [];

    antennas = [];
    dishes = [];
    generators = [];
    signalLight = null;

    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
