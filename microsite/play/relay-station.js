window.RelayStation = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var antennas = [];
  var dishes = [];
  var towers = [];
  var buildings = [];
  var guards = [];
  var spawnPoints = [];
  var rotationStates = {};
  var blinkStates = {};
  var radarSweeps = [];

  function createBox(width, height, depth, color, x, y, z) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createCylinder(radiusTop, radiusBottom, height, color, x, y, z, segments) {
    segments = segments || 32;
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createSphere(radius, color, x, y, z) {
    var geometry = new THREE.SphereGeometry(radius, 32, 32);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createCone(radius, height, color, x, y, z) {
    var geometry = new THREE.ConeGeometry(radius, height, 32);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createLineSegments(points, color) {
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(points.length * 3);
    for (var i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x;
      positions[i * 3 + 1] = points[i].y;
      positions[i * 3 + 2] = points[i].z;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var line = new THREE.LineSegments(geometry, material);
    scene.add(line);
    objects.push(line);
    return line;
  }

  function createMainRelayBuilding() {
    var building = createBox(20, 8, 15, 0x778899, 0, 4, 0);
    building.name = 'mainRelay';
    buildings.push(building);

    // Roof with slight pitch
    var roof = createBox(21, 1, 16, 0x556677, 0, 8.5, 0);
    roof.name = 'roof';
    buildings.push(roof);

    // Door
    createBox(2, 3, 0.5, 0x333333, -8, 1.5, 7.5);

    // Windows
    for (var w = -6; w <= 6; w += 4) {
      createBox(1.5, 1.5, 0.3, 0x4488CC, w, 5, 7.6);
    }

    return building;
  }

  function createAntennaArray(x, z, id) {
    // Base platform
    var base = createBox(6, 0.5, 6, 0x666666, x, 0.25, z);
    base.name = 'antBase' + id;

    // Vertical support mast
    var mast = createCylinder(0.3, 0.3, 12, 0x555555, x, 6, z, 16);
    mast.name = 'antMast' + id;

    // Multiple antenna elements
    for (var i = 0; i < 3; i++) {
      var heightOffset = 3 + i * 2.5;
      var antenna = createCylinder(0.15, 0.15, 3, 0xEEEEEE, x, heightOffset, z, 12);
      antenna.rotation.z = Math.PI / 2 + (i * Math.PI / 4);
      antenna.name = 'antenna' + id + '_' + i;
      antennas.push(antenna);
      rotationStates['antenna' + id + '_' + i] = { speed: 0.3 + i * 0.1, axis: 'y' };
    }

    // Wire elements for cable connections
    var wirePoints = [
      { x: x - 2, y: 8, z: z },
      { x: x + 2, y: 8, z: z },
      { x: x, y: 10, z: z - 1 },
      { x: x, y: 10, z: z + 1 }
    ];
    createLineSegments(wirePoints, 0xCCCCCC);

    spawnPoints.push({ x: x, y: 2, z: z - 4 });
  }

  function createSatelliteDish(x, z, id) {
    // Dish mount structure
    var mount = createBox(3, 6, 0.5, 0x666666, x, 3, z);
    mount.name = 'dishMount' + id;

    // Parabolic reflector (sphere section)
    var dish = createSphere(4, 0xAAAAAA, x, 6, z);
    dish.scale.z = 0.3;
    dish.name = 'dish' + id;
    dishes.push(dish);
    rotationStates['dish' + id] = { speed: 0.1, axis: 'y' };

    // Central feed horn (cone)
    var feedHorn = createCone(1.2, 2, 0x888888, x, 5, z);
    feedHorn.name = 'feedHorn' + id;

    // Support struts
    createCylinder(0.2, 0.2, 4, 0x555555, x - 1.5, 4, z - 1.5, 12);
    createCylinder(0.2, 0.2, 4, 0x555555, x + 1.5, 4, z - 1.5, 12);
    createCylinder(0.2, 0.2, 4, 0x555555, x - 1.5, 4, z + 1.5, 12);
    createCylinder(0.2, 0.2, 4, 0x555555, x + 1.5, 4, z + 1.5, 12);

    spawnPoints.push({ x: x - 4, y: 2, z: z });
  }

  function createCommunicationsTower() {
    // Base foundation
    createBox(4, 0.5, 4, 0x666666, 18, 0.25, -15);

    // Main mast - tall cylindrical tower
    var mast = createCylinder(0.5, 0.5, 35, 0x777777, 18, 17.5, -15, 20);
    mast.name = 'towerMast';
    towers.push(mast);

    // Platform rings at intervals
    for (var p = 0; p < 5; p++) {
      var platformHeight = 5 + p * 6;
      var platform = createBox(4, 0.3, 4, 0x888888, 18, platformHeight, -15);
      platform.name = 'towerPlatform' + p;

      // Safety railings
      createCylinder(0.1, 0.1, 4.5, 0xCCCCCC, 18 - 2.5, platformHeight + 0.3, -15, 12);
      createCylinder(0.1, 0.1, 4.5, 0xCCCCCC, 18 + 2.5, platformHeight + 0.3, -15, 12);

      // Blinking warning lights
      var light = createSphere(0.5, 0xFF7700, 18, platformHeight + 1.2, -15);
      light.name = 'towerLight' + p;
      blinkStates['towerLight' + p] = { blink: true, state: true, speed: 1.5 };
    }

    // Top antenna mount
    createCone(1.5, 3, 0xEEEEEE, 18, 36, -15);

    spawnPoints.push({ x: 18, y: 2, z: -15 });
  }

  function createServerRoom() {
    // Main building
    var building = createBox(12, 6, 8, 0x666666, -18, 3, 8);
    building.name = 'serverRoom';
    buildings.push(building);

    // Roof
    createBox(13, 0.8, 9, 0x555555, -18, 6.4, 8);

    // Cooling units on side
    for (var c = 0; c < 3; c++) {
      var cooler = createBox(2, 2, 2, 0x222222, -25, 1 + c * 2.5, 8);
      cooler.name = 'cooler' + c;
      var fan = createCylinder(1.5, 1.5, 0.3, 0x333333, -25, 1.5 + c * 2.5, 8.5, 8);
      fan.name = 'coolerFan' + c;
      rotationStates['coolerFan' + c] = { speed: 2.0, axis: 'z' };
    }

    // Equipment racks
    createBox(2, 5, 1.5, 0x333333, -20, 2.5, 6);
    createBox(2, 5, 1.5, 0x333333, -20, 2.5, 8);
    createBox(2, 5, 1.5, 0x333333, -20, 2.5, 10);

    // Power distribution box
    createBox(3, 3, 1, 0x444444, -22, 1.5, 11);

    spawnPoints.push({ x: -18, y: 2, z: 8 });
  }

  function createBackupGenerator() {
    // Generator body
    var generator = createBox(4, 3, 3, 0x222222, -8, 1.5, -20);
    generator.name = 'generator';

    // Engine block detail
    createBox(1.5, 2, 2, 0x333333, -8, 2, -18.5);

    // Exhaust stack
    var exhaust = createCylinder(0.4, 0.4, 4, 0x444444, -8, 4, -20.5, 12);
    exhaust.name = 'exhaust';

    // Fuel tank
    var fuelTank = createCylinder(1, 1, 2, 0xFF9900, -6, 1, -20, 16);
    fuelTank.rotation.z = Math.PI / 2;
    fuelTank.name = 'fuelTank';

    // Status indicator light
    var statusLight = createSphere(0.4, 0x00CC44, -8, 3.5, -18);
    statusLight.name = 'genStatusLight';
    blinkStates['genStatusLight'] = { blink: true, state: true, speed: 0.8 };

    spawnPoints.push({ x: -8, y: 2, z: -20 });
  }

  function createPerimeterFence() {
    // Fence posts and rails forming enclosure
    var fenceCorners = [
      { x: -30, z: -25 },
      { x: 30, z: -25 },
      { x: 30, z: 25 },
      { x: -30, z: 25 }
    ];

    for (var f = 0; f < 4; f++) {
      var start = fenceCorners[f];
      var end = fenceCorners[(f + 1) % 4];

      // Posts at corners
      createCylinder(0.3, 0.3, 3, 0x888888, start.x, 1.5, start.z, 12);

      // Rails between posts
      var midX = (start.x + end.x) / 2;
      var midZ = (start.z + end.z) / 2;
      var dist = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
      );
      var angle = Math.atan2(end.z - start.z, end.x - start.x);

      var rail = createCylinder(0.15, 0.15, dist, 0x777777, midX, 1.5, midZ, 12);
      rail.rotation.z = -angle;

      // Wire mesh (represented by line segments)
      if (f % 2 === 0) {
        var meshPoints = [
          { x: start.x, y: 0.5, z: start.z },
          { x: end.x, y: 0.5, z: end.z },
          { x: end.x, y: 2.5, z: end.z },
          { x: start.x, y: 2.5, z: start.z }
        ];
        createLineSegments(meshPoints, 0x666666);
      }
    }
  }

  function createGuardPost() {
    // Guard shack
    var shack = createBox(3, 2.5, 3, 0x8B6914, 25, 1.25, -8);
    shack.name = 'guardShack';
    buildings.push(shack);

    // Roof
    createBox(3.2, 0.3, 3.2, 0x6B5414, 25, 3, -8);

    // Window
    createBox(1, 0.8, 0.2, 0x4488CC, 26, 1.8, -7);

    // Door
    createBox(1, 2, 0.2, 0x333333, 24, 1.25, -7);

    // Flag pole
    var flagPole = createCylinder(0.15, 0.15, 4, 0x555555, 26.5, 2.5, -7, 12);
    flagPole.name = 'flagPole';

    // Flag (thin box)
    var flag = createBox(1, 0.5, 0.1, 0xDD0000, 27.2, 3.2, -7);
    flag.name = 'flag';
    rotationStates['flag'] = { speed: 0.5, axis: 'y' };

    // Guard patrol path spawn
    spawnPoints.push({ x: 25, y: 1, z: -8 });
  }

  function createEquipmentShelter() {
    // Open-sided structure
    var roof = createBox(10, 0.5, 8, 0x888888, -10, 4, 15);
    roof.name = 'shelterRoof';

    // Posts
    createCylinder(0.4, 0.4, 4, 0x777777, -14, 2, 12, 12);
    createCylinder(0.4, 0.4, 4, 0x777777, -14, 2, 18, 12);
    createCylinder(0.4, 0.4, 4, 0x777777, -6, 2, 12, 12);
    createCylinder(0.4, 0.4, 4, 0x777777, -6, 2, 18, 12);

    // Equipment inside
    createBox(3, 2, 2, 0x333333, -10, 1, 14);
    createBox(3, 2, 2, 0x333333, -10, 1, 16);

    // Status indicators
    for (var e = 0; e < 4; e++) {
      var light = createSphere(0.3, 0x00CC44, -8 - e * 1.5, 3.5, 15);
      light.name = 'equipmentLight' + e;
      blinkStates['equipmentLight' + e] = { blink: true, state: true, speed: 1.2 };
    }

    spawnPoints.push({ x: -10, y: 1, z: 15 });
  }

  function createFiberConduits() {
    // Underground fiber runs (surface representation)
    // Between server room and relay building
    var conduit1 = createCylinder(0.5, 0.5, 20, 0x444444, -8, 0.2, 4, 12);
    conduit1.rotation.z = Math.PI / 2;
    conduit1.name = 'conduit1';

    // Between relay building and tower
    var conduit2 = createCylinder(0.5, 0.5, 18, 0x444444, 8, 0.2, -7.5, 12);
    conduit2.rotation.z = Math.PI / 2;
    conduit2.name = 'conduit2';

    // Between satellite dishes and relay
    var conduit3 = createCylinder(0.5, 0.5, 15, 0x444444, 5, 0.2, 5, 12);
    conduit3.rotation.z = Math.PI / 2;
    conduit3.name = 'conduit3';
  }

  function createRadarScreen() {
    // Radar display box
    var radarBox = createBox(2, 2, 0.5, 0x222222, -20, 4, 5);
    radarBox.name = 'radarBox';

    // Screen surface
    var radarScreen = createBox(1.8, 1.8, 0.1, 0x001100, -20, 4, 5.3);
    radarScreen.name = 'radarScreen';

    // Radar sweep line representation
    var radarPoints = [
      { x: -20, y: 4, z: 5.3 },
      { x: -19, y: 4.8, z: 5.3 }
    ];
    var radarSweep = createLineSegments(radarPoints, 0x00FF00);
    radarSweep.name = 'radarSweep';
    radarSweeps.push(radarSweep);
    rotationStates['radarSweep'] = { speed: 1.0, axis: 'z' };
  }

  function createTerrain() {
    // Ground plane
    var ground = createBox(100, 0.5, 100, 0x8B6914, 0, -0.25, 0);
    ground.name = 'terrain';
    ground.receiveShadow = true;

    // Hilltop elevation
    var hill = createBox(80, 1, 80, 0x9B7924, 0, -0.75, 0);
    hill.name = 'hilltop';
  }

  var init = function(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    antennas = [];
    dishes = [];
    towers = [];
    buildings = [];
    guards = [];
    spawnPoints = [];
    rotationStates = {};
    blinkStates = {};
    radarSweeps = [];

    createTerrain();
    createMainRelayBuilding();
    createAntennaArray(-12, -8, 1);
    createAntennaArray(12, -8, 2);
    createAntennaArray(-12, 10, 3);
    createAntennaArray(12, 10, 4);
    createSatelliteDish(-20, 12, 1);
    createSatelliteDish(20, 12, 2);
    createCommunicationsTower();
    createServerRoom();
    createBackupGenerator();
    createPerimeterFence();
    createGuardPost();
    createEquipmentShelter();
    createFiberConduits();
    createRadarScreen();

    return {
      spawnPoints: spawnPoints,
      objects: objects
    };
  };

  var update = function(delta) {
    var time = Date.now() * 0.001;

    // Rotating antennas
    for (var i = 0; i < antennas.length; i++) {
      var antenna = antennas[i];
      var state = rotationStates[antenna.name];
      if (state) {
        if (state.axis === 'y') {
          antenna.rotation.y += state.speed * delta;
        } else if (state.axis === 'z') {
          antenna.rotation.z += state.speed * delta;
        }
      }
    }

    // Tracking satellite dishes
    for (var d = 0; d < dishes.length; d++) {
      var dish = dishes[d];
      var dishState = rotationStates[dish.name];
      if (dishState) {
        dish.rotation.y += dishState.speed * delta * 0.5;
        dish.rotation.x = Math.sin(time * 0.3) * 0.3;
      }
    }

    // Blinking equipment lights
    for (var key in blinkStates) {
      if (blinkStates.hasOwnProperty(key)) {
        var blink = blinkStates[key];
        blink.timer = (blink.timer || 0) + delta;
        if (blink.timer > 1.0 / blink.speed) {
          blink.timer = 0;
          blink.state = !blink.state;

          // Find object and update visibility
          for (var obj = 0; obj < objects.length; obj++) {
            if (objects[obj].name === key) {
              objects[obj].visible = blink.state;
              break;
            }
          }
        }
      }
    }

    // Rotating cooling fans
    for (var cf = 0; cf < 3; cf++) {
      var coolerName = 'coolerFan' + cf;
      for (var o = 0; o < objects.length; o++) {
        if (objects[o].name === coolerName) {
          objects[o].rotation.z += 3.0 * delta;
          break;
        }
      }
    }

    // Radar sweep animation
    for (var r = 0; r < radarSweeps.length; r++) {
      var sweep = radarSweeps[r];
      sweep.rotation.z = time * 2.0;
    }

    // Generator exhaust flicker
    for (var ex = 0; ex < objects.length; ex++) {
      if (objects[ex].name === 'exhaust') {
        objects[ex].position.y = 4.0 + Math.sin(time * 3.0) * 0.05;
        break;
      }
    }

    // Flag flapping
    for (var fl = 0; fl < objects.length; fl++) {
      if (objects[fl].name === 'flag') {
        objects[fl].rotation.z = Math.sin(time * 1.5) * 0.3;
        break;
      }
    }

    // Pulsing antenna elements
    for (var ant = 0; ant < antennas.length; ant++) {
      var antObj = antennas[ant];
      var pulse = 0.15 + Math.sin(time * 2.0) * 0.05;
      antObj.scale.y = pulse / 0.15;
    }
  };

  var reset = function() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var d = 0; d < radarSweeps.length; d++) {
      scene.remove(radarSweeps[d]);
    }
    objects = [];
    antennas = [];
    dishes = [];
    towers = [];
    buildings = [];
    guards = [];
    spawnPoints = [];
    rotationStates = {};
    blinkStates = {};
    radarSweeps = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
