window.LookoutTower = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var gameObjects = [];
  var towers = [];
  var trees = [];
  var wildfire = null;
  var rangerStation = null;
  var rangerTruck = null;
  var sniper = null;
  var radiationMast = null;
  var propaneTank = null;
  var helicopter = null;
  var fireHelicopter = null;
  var fireBreakRoad = null;
  var timeElapsed = 0;
  var wildfireAdvance = 0;
  var sniperRotation = 0;
  var propaneTankExploded = false;

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    gameObjects = [];
    towers = [];
    trees = [];
    timeElapsed = 0;
    wildfireAdvance = 0;
    propaneTankExploded = false;

    // Ground
    var groundGeometry = new THREE.BoxGeometry(800, 0.5, 800);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3A5D3A, roughness: 0.8 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -1;
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);
    gameObjects.push(ground);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Three fire lookout towers
    createTower(-200, 0, -300, 0);
    createTower(200, 0, -200, Math.PI * 0.3);
    createTower(0, 0, 300, Math.PI * 0.6);

    // Forest coverage with many trees
    for (var i = 0; i < 80; i++) {
      var tx = (Math.random() - 0.5) * 700;
      var tz = (Math.random() - 0.5) * 700;

      // Avoid tower positions
      var distToTower1 = Math.sqrt((tx + 200) * (tx + 200) + (tz + 300) * (tz + 300));
      var distToTower2 = Math.sqrt((tx - 200) * (tx - 200) + (tz + 200) * (tz + 200));
      var distToTower3 = Math.sqrt(tx * tx + (tz - 300) * (tz - 300));

      if (distToTower1 > 120 && distToTower2 > 120 && distToTower3 > 120) {
        createTree(tx, 0, tz);
      }
    }

    // Ranger station building
    createRangerStation(300, 0, -400);

    // Access road with ranger truck
    createAccessRoad();
    createRangerTruck();

    // Fire break road
    createFireBreakRoad();

    // Radio communication mast
    createRadiationMast(-100, 0, 250);

    // Propane tank at station
    createPropaneTank(350, 0, -350);

    // Helicopter landing zone
    createHelicopterLZ(400, 0, 100);

    // Approaching wildfire wall
    createWildfire();

    // Fire helicopter
    createFireHelicopter();
  }

  function createTower(x, y, z, rotOffset) {
    // Steel legs (4 cylinders)
    var legRadius = 12;
    var legHeight = 180;
    var legSpacing = 40;

    var legMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });

    var legPositions = [
      [-legSpacing, 0, -legSpacing],
      [legSpacing, 0, -legSpacing],
      [legSpacing, 0, legSpacing],
      [-legSpacing, 0, legSpacing]
    ];

    var legs = [];
    for (var i = 0; i < 4; i++) {
      var legGeometry = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16);
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.x = x + legPositions[i][0];
      leg.position.y = y + legHeight / 2;
      leg.position.z = z + legPositions[i][2];
      leg.castShadow = true;
      leg.receiveShadow = true;
      scene.add(leg);
      gameObjects.push(leg);
      legs.push(leg);
    }

    // Ladder rungs
    var rungMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
    for (var r = 0; r < 12; r++) {
      var rungY = 20 + (r * 13);
      var rung = new THREE.BufferGeometry();
      var rungVertices = new Float32Array([
        x - legSpacing, y + rungY, z - legSpacing,
        x + legSpacing, y + rungY, z - legSpacing,
        x + legSpacing, y + rungY, z + legSpacing,
        x - legSpacing, y + rungY, z + legSpacing
      ]);
      rung.setAttribute('position', new THREE.BufferAttribute(rungVertices, 3));
      var rungLine = new THREE.LineSegments(rung, rungMaterial);
      scene.add(rungLine);
      gameObjects.push(rungLine);
    }

    // Cabin on top
    var cabinGeometry = new THREE.BoxGeometry(80, 60, 80);
    var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.7 });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.x = x;
    cabin.position.y = y + legHeight + 30;
    cabin.position.z = z;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    scene.add(cabin);
    gameObjects.push(cabin);

    // Observation deck railing
    var railingGeometry = new THREE.BoxGeometry(85, 1, 85);
    var railingMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
    var railing = new THREE.Mesh(railingGeometry, railingMaterial);
    railing.position.x = x;
    railing.position.y = y + legHeight + 62;
    railing.position.z = z;
    railing.castShadow = true;
    railing.receiveShadow = true;
    scene.add(railing);
    gameObjects.push(railing);

    var towerObj = {
      position: [x, y, z],
      cabin: cabin,
      legs: legs,
      rotation: rotOffset
    };
    towers.push(towerObj);
  }

  function createTree(x, y, z) {
    // Trunk
    var trunkGeometry = new THREE.CylinderGeometry(8, 12, 50, 12);
    var trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.8 });
    var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + 25, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    gameObjects.push(trunk);

    // Pine top (cone)
    var coneGeometry = new THREE.ConeGeometry(35, 80, 16);
    var coneMaterial = new THREE.MeshStandardMaterial({ color: 0x1A4A1A, roughness: 0.8 });
    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(x, y + 80, z);
    cone.castShadow = true;
    cone.receiveShadow = true;
    scene.add(cone);
    gameObjects.push(cone);

    trees.push({ trunk: trunk, cone: cone, position: [x, y, z] });
  }

  function createRangerStation(x, y, z) {
    // Main building
    var buildingGeometry = new THREE.BoxGeometry(100, 50, 80);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xC8A874, roughness: 0.7 });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(x, y + 25, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    gameObjects.push(building);

    // Roof
    var roofGeometry = new THREE.ConeGeometry(65, 30, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, y + 65, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
    gameObjects.push(roof);

    rangerStation = { building: building, roof: roof, position: [x, y, z] };
  }

  function createAccessRoad() {
    // Road from ranger station to center
    var roadGeometry = new THREE.BoxGeometry(40, 0.3, 500);
    var roadMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9 });
    var road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.set(300, 0.1, 100);
    road.receiveShadow = true;
    scene.add(road);
    gameObjects.push(road);
  }

  function createRangerTruck() {
    // Truck body
    var bodyGeometry = new THREE.BoxGeometry(20, 15, 45);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.6 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(300, 8, -200);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    gameObjects.push(body);

    // Cab
    var cabGeometry = new THREE.BoxGeometry(18, 12, 20);
    var cabMaterial = new THREE.MeshStandardMaterial({ color: 0xDD5500, roughness: 0.5 });
    var cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(300, 15, -165);
    cab.castShadow = true;
    cab.receiveShadow = true;
    scene.add(cab);
    gameObjects.push(cab);

    // Wheels
    for (var w = 0; w < 4; w++) {
      var wheelGeometry = new THREE.CylinderGeometry(6, 6, 3, 16);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      var wheelX = w % 2 === 0 ? 310 : 290;
      var wheelZ = w < 2 ? -220 : -120;
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, 6, wheelZ);
      wheel.castShadow = true;
      scene.add(wheel);
      gameObjects.push(wheel);
    }

    rangerTruck = { body: body, position: [300, 0, -200] };
  }

  function createFireBreakRoad() {
    // Cleared strip
    var breakGeometry = new THREE.BoxGeometry(150, 0.2, 600);
    var breakMaterial = new THREE.MeshStandardMaterial({ color: 0xA0A0A0, roughness: 0.9 });
    var breakRoad = new THREE.Mesh(breakGeometry, breakMaterial);
    breakRoad.position.set(-300, 0.05, 0);
    breakRoad.receiveShadow = true;
    scene.add(breakRoad);
    gameObjects.push(breakRoad);

    fireBreakRoad = breakRoad;
  }

  function createRadiationMast(x, y, z) {
    // Mast
    var mastGeometry = new THREE.CylinderGeometry(3, 3, 150, 12);
    var mastMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.7 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(x, y + 75, z);
    mast.castShadow = true;
    scene.add(mast);
    gameObjects.push(mast);

    // Antenna dish
    var dishGeometry = new THREE.SphereGeometry(8, 8, 8);
    var dishMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, metalness: 0.9 });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.scale.set(1, 0.3, 1);
    dish.position.set(x, y + 155, z);
    dish.castShadow = true;
    scene.add(dish);
    gameObjects.push(dish);

    radiationMast = { mast: mast, dish: dish, position: [x, y, z] };
  }

  function createPropaneTank(x, y, z) {
    // Tank
    var tankGeometry = new THREE.CylinderGeometry(12, 12, 50, 16);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(x, y + 25, z);
    tank.rotation.z = Math.PI / 2.5;
    tank.castShadow = true;
    tank.receiveShadow = true;
    scene.add(tank);
    gameObjects.push(tank);

    // Valve
    var valveGeometry = new THREE.SphereGeometry(5, 8, 8);
    var valveMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.3 });
    var valve = new THREE.Mesh(valveGeometry, valveMaterial);
    valve.position.set(x + 25, y + 50, z);
    valve.castShadow = true;
    scene.add(valve);
    gameObjects.push(valve);

    propaneTank = { tank: tank, valve: valve, position: [x, y, z] };
  }

  function createHelicopterLZ(x, y, z) {
    // Landing zone marker (H shape)
    var hGeometry = new THREE.BoxGeometry(60, 0.2, 60);
    var hMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00, roughness: 0.4 });
    var helipad = new THREE.Mesh(hGeometry, hMaterial);
    helipad.position.set(x, y + 0.1, z);
    helipad.receiveShadow = true;
    scene.add(helipad);
    gameObjects.push(helipad);

    helicopter = { position: [x, 100, z], heading: 0 };
  }

  function createWildfire() {
    // Wildfire front wall advancing from south
    var fireGeometry = new THREE.BoxGeometry(800, 200, 50);
    var fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF5500,
      emissive: 0xFF5500,
      emissiveIntensity: 0.6,
      roughness: 0.8
    });
    var fireFront = new THREE.Mesh(fireGeometry, fireMaterial);
    fireFront.position.set(0, 100, -400);
    scene.add(fireFront);
    gameObjects.push(fireFront);

    wildfire = { mesh: fireFront, position: [0, 100, -400] };
  }

  function createFireHelicopter() {
    // Body
    var bodyGeometry = new THREE.BoxGeometry(30, 15, 60);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.5 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(400, 150, 300);
    scene.add(body);
    gameObjects.push(body);

    // Rotor (spinning)
    var rotorGeometry = new THREE.BoxGeometry(80, 1, 8);
    var rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6 });
    var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor.position.set(400, 165, 300);
    scene.add(rotor);
    gameObjects.push(rotor);

    // Water tank
    var tankGeometry = new THREE.CylinderGeometry(15, 15, 20, 16);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x4488FF, roughness: 0.4 });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(400, 125, 300);
    scene.add(tank);
    gameObjects.push(tank);

    fireHelicopter = { body: body, rotor: rotor, tank: tank, position: [400, 150, 300] };
  }

  function update(delta) {
    timeElapsed += delta;
    wildfireAdvance += delta * 15;
    sniperRotation += delta * 0.5;

    // Advance wildfire front
    if (wildfire && wildfire.mesh) {
      wildfire.mesh.position.z += delta * 15;
    }

    // Sniper in tower cabin rotating to track
    if (towers.length > 0 && towers[0].cabin) {
      towers[0].cabin.rotation.y = sniperRotation * 0.3;
    }

    // Tree tops swaying in hot wind
    for (var i = 0; i < trees.length; i++) {
      if (trees[i].cone) {
        trees[i].cone.rotation.x = Math.sin(timeElapsed * 1.5 + i) * 0.05;
        trees[i].cone.rotation.z = Math.cos(timeElapsed * 1.2 + i) * 0.08;
      }
    }

    // Ranger truck driving escape route
    if (rangerTruck) {
      rangerTruck.body.position.x += delta * 20;
      rangerTruck.body.position.z += delta * 10;
    }

    // Tower observation deck spinning (360° scan)
    for (var t = 0; t < towers.length; t++) {
      if (towers[t].cabin) {
        towers[t].cabin.rotation.y += delta * 0.3;
      }
    }

    // Fire helicopter water drop
    if (fireHelicopter && fireHelicopter.rotor) {
      fireHelicopter.rotor.rotation.z += delta * 20;
      fireHelicopter.body.position.x += Math.sin(timeElapsed * 0.3) * delta * 25;
      fireHelicopter.body.position.z += Math.cos(timeElapsed * 0.4) * delta * 20;
    }

    // Propane tank explosion when fire reaches it
    if (!propaneTankExploded && wildfire && propaneTank) {
      var distToTank = Math.sqrt(
        Math.pow(wildfire.mesh.position.z - propaneTank.position[2], 2)
      );
      if (distToTank < 100) {
        propaneTankExploded = true;
        if (propaneTank.tank) {
          propaneTank.tank.scale.set(
            propaneTank.tank.scale.x * 0.1,
            propaneTank.tank.scale.y * 0.1,
            propaneTank.tank.scale.z * 0.1
          );
        }
        if (propaneTank.valve) {
          propaneTank.valve.material.color.setHex(0xFF0000);
          propaneTank.valve.material.emissive.setHex(0xFF5500);
          propaneTank.valve.material.emissiveIntensity = 1.0;
        }
      }
    }

    // Smoke rising from fires
    if (wildfire && wildfire.mesh) {
      wildfire.mesh.material.emissiveIntensity = 0.4 + Math.sin(timeElapsed * 2) * 0.3;
    }

    // Radiation mast pulsing
    if (radiationMast && radiationMast.dish) {
      radiationMast.dish.rotation.z += delta * 0.8;
    }
  }

  function reset() {
    for (var i = 0; i < gameObjects.length; i++) {
      scene.remove(gameObjects[i]);
    }
    gameObjects = [];
    towers = [];
    trees = [];
    wildfire = null;
    rangerStation = null;
    rangerTruck = null;
    sniper = null;
    radiationMast = null;
    propaneTank = null;
    helicopter = null;
    fireHelicopter = null;
    fireBreakRoad = null;
    timeElapsed = 0;
    wildfireAdvance = 0;
    propaneTankExploded = false;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
