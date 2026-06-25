window.NavalYard = (function() {
  'use strict';

  var objects = [];
  var enemies = [];
  var animations = [];
  var scene = null;
  var camera = null;

  var NAVAL_GRAY = 0x5A6B7A;
  var CONCRETE = 0x888888;
  var RUST = 0x8B4513;
  var TORPEDO_GREEN = 0x336633;
  var WATER_BLUE = 0x1A4A7A;
  var WARNING_YELLOW = 0xFFCC00;

  function createDryDock() {
    var dockGroup = new THREE.Group();

    // Main dry dock pit - massive sunken rectangular cavity
    var pitDepth = 80;
    var pitWidth = 120;
    var pitLength = 200;

    // Pit floor
    var floorGeo = new THREE.BoxGeometry(pitWidth, 2, pitLength);
    var floorMat = new THREE.MeshStandardMaterial({ color: CONCRETE, roughness: 0.8 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -pitDepth / 2;
    dockGroup.add(floor);
    objects.push(floor);

    // Pit walls (4 walls)
    var wallThickness = 5;
    var wallHeight = pitDepth;

    // Front wall
    var frontWallGeo = new THREE.BoxGeometry(pitWidth + 2 * wallThickness, wallHeight, wallThickness);
    var wallMat = new THREE.MeshStandardMaterial({ color: CONCRETE, roughness: 0.7 });
    var frontWall = new THREE.Mesh(frontWallGeo, wallMat);
    frontWall.position.z = pitLength / 2;
    frontWall.position.y = -pitDepth / 2;
    dockGroup.add(frontWall);
    objects.push(frontWall);

    // Back wall
    var backWall = new THREE.Mesh(frontWallGeo, wallMat);
    backWall.position.z = -pitLength / 2;
    backWall.position.y = -pitDepth / 2;
    dockGroup.add(backWall);
    objects.push(backWall);

    // Left wall
    var sideWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, pitLength);
    var leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.x = -pitWidth / 2;
    leftWall.position.y = -pitDepth / 2;
    dockGroup.add(leftWall);
    objects.push(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.x = pitWidth / 2;
    rightWall.position.y = -pitDepth / 2;
    dockGroup.add(rightWall);
    objects.push(rightWall);

    return dockGroup;
  }

  function createWarshipHull() {
    var hullGroup = new THREE.Group();
    hullGroup.position.set(0, -25, 0);

    // Main hull - large curved section approximated with BoxGeometry
    var hullGeo = new THREE.BoxGeometry(60, 40, 150);
    var hullMat = new THREE.MeshStandardMaterial({ color: NAVAL_GRAY, roughness: 0.6, metalness: 0.4 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.castShadow = true;
    hullGroup.add(hull);
    objects.push(hull);

    // Superstructure tower
    var towerGeo = new THREE.BoxGeometry(25, 45, 20);
    var towerMat = new THREE.MeshStandardMaterial({ color: NAVAL_GRAY, roughness: 0.5, metalness: 0.5 });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-15, 25, -50);
    tower.castShadow = true;
    hullGroup.add(tower);
    objects.push(tower);

    // Gun turret base
    var turretBaseGeo = new THREE.CylinderGeometry(12, 15, 8, 16);
    var turretMat = new THREE.MeshStandardMaterial({ color: RUST, roughness: 0.7 });
    var turretBase = new THREE.Mesh(turretBaseGeo, turretMat);
    turretBase.position.set(20, 22, 60);
    turretBase.castShadow = true;
    hullGroup.add(turretBase);
    objects.push(turretBase);

    // Gun barrel
    var barrelGeo = new THREE.CylinderGeometry(3, 3, 40, 8);
    var barrelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9 });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.z = Math.PI / 6;
    barrel.position.set(25, 28, 70);
    hullGroup.add(barrel);
    objects.push(barrel);

    // Torpedo tubes (3 visible)
    for (var i = 0; i < 3; i++) {
      var torpedoTubeGeo = new THREE.CylinderGeometry(4, 4, 15, 8);
      var tubeMat = new THREE.MeshStandardMaterial({ color: RUST, roughness: 0.6 });
      var tube = new THREE.Mesh(torpedoTubeGeo, tubeMat);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(-25, 5 + i * 8, 0);
      hullGroup.add(tube);
      objects.push(tube);
    }

    return hullGroup;
  }

  function createOverheadCrane() {
    var craneGroup = new THREE.Group();
    craneGroup.position.set(30, 20, -80);

    // Main rail beam (horizontal)
    var railGeo = new THREE.BoxGeometry(150, 4, 8);
    var railMat = new THREE.MeshStandardMaterial({ color: NAVAL_GRAY, roughness: 0.6, metalness: 0.5 });
    var rail = new THREE.Mesh(railGeo, railMat);
    rail.position.y = 35;
    craneGroup.add(rail);
    objects.push(rail);

    // Support columns (4)
    var columnGeo = new THREE.BoxGeometry(8, 50, 8);
    var columnMat = new THREE.MeshStandardMaterial({ color: NAVAL_GRAY, metalness: 0.6 });
    var positions = [[-60, 17], [60, 17], [-60, -17], [60, -17]];
    for (var i = 0; i < 4; i++) {
      var col = new THREE.Mesh(columnGeo, columnMat);
      col.position.set(positions[i][0], 17, positions[i][1]);
      craneGroup.add(col);
      objects.push(col);
    }

    // Crane arm (rotates)
    var armGeo = new THREE.BoxGeometry(12, 4, 80);
    var armMat = new THREE.MeshStandardMaterial({ color: WARNING_YELLOW, roughness: 0.5 });
    var arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0, 37, 0);
    craneGroup.add(arm);
    objects.push(arm);
    arm.animId = 'crane_arm';

    // Crane hook
    var hookGeo = new THREE.BoxGeometry(6, 15, 6);
    var hookMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    var hook = new THREE.Mesh(hookGeo, hookMat);
    hook.position.set(0, 25, 30);
    craneGroup.add(hook);
    objects.push(hook);

    // Cable (vertical line segments)
    var cableGeo = new THREE.BufferGeometry();
    cableGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      0, 37, 30, 0, 25, 30
    ]), 3));
    var cableMat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    var cable = new THREE.LineSegments(cableGeo, cableMat);
    craneGroup.add(cable);

    return craneGroup;
  }

  function createTorpedoRacks() {
    var rackGroup = new THREE.Group();
    rackGroup.position.set(-50, -10, 40);

    // 4 racks with 5 torpedoes each
    for (var r = 0; r < 4; r++) {
      for (var t = 0; t < 5; t++) {
        var torpGeo = new THREE.CylinderGeometry(3, 2.5, 30, 8);
        var torpMat = new THREE.MeshStandardMaterial({ color: TORPEDO_GREEN, roughness: 0.4, metalness: 0.3 });
        var torp = new THREE.Mesh(torpGeo, torpMat);
        torp.rotation.z = Math.PI / 2;
        torp.position.set(r * 20, t * 10, 0);
        rackGroup.add(torp);
        objects.push(torp);
      }
    }

    // Rack frame
    for (var i = 0; i < 6; i++) {
      var frameGeo = new THREE.BoxGeometry(90, 2, 2);
      var frameMat = new THREE.MeshStandardMaterial({ color: RUST });
      var frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.y = i * 10 - 25;
      rackGroup.add(frame);
      objects.push(frame);
    }

    return rackGroup;
  }

  function createFuelDepot() {
    var depotGroup = new THREE.Group();
    depotGroup.position.set(60, -15, -60);

    // 3 large cylindrical fuel tanks
    for (var i = 0; i < 3; i++) {
      var tankGeo = new THREE.CylinderGeometry(15, 15, 35, 16);
      var tankMat = new THREE.MeshStandardMaterial({ color: RUST, roughness: 0.7 });
      var tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.x = i * 35 - 35;
      tank.castShadow = true;
      depotGroup.add(tank);
      objects.push(tank);

      // Tank top cap
      var capGeo = new THREE.CylinderGeometry(15, 15, 3, 16);
      var capMat = new THREE.MeshStandardMaterial({ color: WARNING_YELLOW });
      var cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(i * 35 - 35, 19, 0);
      depotGroup.add(cap);
      objects.push(cap);

      // Vent pipe with animation
      var ventGeo = new THREE.CylinderGeometry(2, 2, 15, 8);
      var ventMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var vent = new THREE.Mesh(ventGeo, ventMat);
      vent.position.set(i * 35 - 35, 27, 0);
      depotGroup.add(vent);
      objects.push(vent);
      vent.animId = 'vent_' + i;
    }

    // Pump station
    var pumpGeo = new THREE.BoxGeometry(20, 8, 10);
    var pumpMat = new THREE.MeshStandardMaterial({ color: NAVAL_GRAY });
    var pump = new THREE.Mesh(pumpGeo, pumpMat);
    pump.position.set(0, -12, 20);
    depotGroup.add(pump);
    objects.push(pump);

    return depotGroup;
  }

  function createSubmarinePen() {
    var penGroup = new THREE.Group();
    penGroup.position.set(-60, -20, 80);

    // Arched tunnel walls (approximated with tall BoxGeometry)
    var leftWallGeo = new THREE.BoxGeometry(8, 50, 120);
    var wallMat = new THREE.MeshStandardMaterial({ color: CONCRETE, roughness: 0.8 });
    var leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.x = -35;
    penGroup.add(leftWall);
    objects.push(leftWall);

    var rightWall = new THREE.Mesh(leftWallGeo, wallMat);
    rightWall.position.x = 35;
    penGroup.add(rightWall);
    objects.push(rightWall);

    // Tunnel roof
    var roofGeo = new THREE.BoxGeometry(78, 8, 120);
    var roofMat = new THREE.MeshStandardMaterial({ color: CONCRETE, roughness: 0.7 });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 25;
    penGroup.add(roof);
    objects.push(roof);

    // Submarine hull (docked)
    var subHullGeo = new THREE.BoxGeometry(30, 20, 100);
    var subMat = new THREE.MeshStandardMaterial({ color: NAVAL_GRAY, metalness: 0.7 });
    var subHull = new THREE.Mesh(subHullGeo, subMat);
    subHull.position.set(0, -5, 0);
    subHull.castShadow = true;
    penGroup.add(subHull);
    objects.push(subHull);

    // Submarine conning tower (command center)
    var towerGeo = new THREE.BoxGeometry(12, 20, 15);
    var towerMat = new THREE.MeshStandardMaterial({ color: NAVAL_GRAY, roughness: 0.6 });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 8, -20);
    penGroup.add(tower);
    objects.push(tower);

    // Periscope (rising/falling animation)
    var periGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
    var periMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
    var periscope = new THREE.Mesh(periGeo, periMat);
    periscope.position.set(0, 16, -20);
    penGroup.add(periscope);
    objects.push(periscope);
    periscope.animId = 'periscope';

    return penGroup;
  }

  function createCommandPier() {
    var pierGroup = new THREE.Group();
    pierGroup.position.set(0, 5, -100);

    // Pier deck
    var deckGeo = new THREE.BoxGeometry(80, 3, 60);
    var deckMat = new THREE.MeshStandardMaterial({ color: CONCRETE, roughness: 0.8 });
    var deck = new THREE.Mesh(deckGeo, deckMat);
    pierGroup.add(deck);
    objects.push(deck);

    // Support pilings (6)
    var pilingGeo = new THREE.CylinderGeometry(4, 4, 30, 8);
    var pilingMat = new THREE.MeshStandardMaterial({ color: RUST, roughness: 0.8 });
    var pilingPositions = [[-25, -25], [-25, 25], [0, -25], [0, 25], [25, -25], [25, 25]];
    for (var i = 0; i < 6; i++) {
      var piling = new THREE.Mesh(pilingGeo, pilingMat);
      piling.position.set(pilingPositions[i][0], -15, pilingPositions[i][1]);
      pierGroup.add(piling);
      objects.push(piling);
    }

    // Command building
    var bldgGeo = new THREE.BoxGeometry(30, 20, 25);
    var bldgMat = new THREE.MeshStandardMaterial({ color: NAVAL_GRAY });
    var building = new THREE.Mesh(bldgGeo, bldgMat);
    building.position.set(-30, 12, 20);
    building.castShadow = true;
    pierGroup.add(building);
    objects.push(building);

    // Radar dome
    var radarGeo = new THREE.SphereGeometry(8, 16, 16);
    var radarMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3 });
    var radar = new THREE.Mesh(radarGeo, radarMat);
    radar.position.set(-30, 30, 20);
    radar.castShadow = true;
    pierGroup.add(radar);
    objects.push(radar);
    radar.animId = 'radar';

    return pierGroup;
  }

  function createGangplanks() {
    var plankGroup = new THREE.Group();

    // 2 metal gangplanks connecting to dry dock
    for (var i = 0; i < 2; i++) {
      var plankGeo = new THREE.BoxGeometry(8, 2, 50);
      var plankMat = new THREE.MeshStandardMaterial({ color: NAVAL_GRAY, roughness: 0.5 });
      var plank = new THREE.Mesh(plankGeo, plankMat);
      plank.rotation.z = Math.PI / 8;
      plank.position.set((i - 0.5) * 40, 5, -30);
      plank.castShadow = true;
      plankGroup.add(plank);
      objects.push(plank);
    }

    return plankGroup;
  }

  function createSearchlights() {
    var lightGroup = new THREE.Group();

    // 2 searchlights (rotating beams)
    for (var i = 0; i < 2; i++) {
      var baseGeo = new THREE.CylinderGeometry(5, 6, 4, 16);
      var baseMat = new THREE.MeshStandardMaterial({ color: NAVAL_GRAY });
      var base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set((i - 0.5) * 60, 30, -80);
      lightGroup.add(base);
      objects.push(base);

      // Light fixture
      var fixtureGeo = new THREE.CylinderGeometry(4, 4, 3, 16);
      var fixtureMat = new THREE.MeshStandardMaterial({ color: RUST });
      var fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set((i - 0.5) * 60, 33, -80);
      lightGroup.add(fixture);
      objects.push(fixture);
      fixture.animId = 'searchlight_' + i;
    }

    return lightGroup;
  }

  function createEnemies() {
    enemies = [];

    // Engineer at torpedo racks
    enemies.push({
      position: [-50, 0, 40],
      type: 'engineer',
      health: 30,
      speed: 2.5,
      pathIndex: 0
    });

    // Guard on command pier
    enemies.push({
      position: [0, 10, -100],
      type: 'guard',
      health: 40,
      speed: 2,
      pathIndex: 0
    });

    // Technician in dry dock
    enemies.push({
      position: [30, -20, 0],
      type: 'technician',
      health: 25,
      speed: 2,
      pathIndex: 0
    });

    // Engineer at fuel depot
    enemies.push({
      position: [60, 0, -60],
      type: 'engineer',
      health: 30,
      speed: 2.5,
      pathIndex: 0
    });

    // Guard in submarine pen
    enemies.push({
      position: [-60, -5, 80],
      type: 'guard',
      health: 40,
      speed: 2,
      pathIndex: 0
    });

    // Patrol guard (roaming)
    enemies.push({
      position: [0, -15, 0],
      type: 'patrol',
      health: 35,
      speed: 3,
      pathIndex: 0
    });
  }

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    objects = [];
    enemies = [];
    animations = [];

    // Create all structures
    var dryDock = createDryDock();
    scene.add(dryDock);

    var warship = createWarshipHull();
    scene.add(warship);

    var crane = createOverheadCrane();
    scene.add(crane);

    var torpedos = createTorpedoRacks();
    scene.add(torpedos);

    var fuel = createFuelDepot();
    scene.add(fuel);

    var sub = createSubmarinePen();
    scene.add(sub);

    var pier = createCommandPier();
    scene.add(pier);

    var planks = createGangplanks();
    scene.add(planks);

    var lights = createSearchlights();
    scene.add(lights);

    // Create enemies
    createEnemies();

    // Water/ground plane
    var waterGeo = new THREE.BoxGeometry(300, 1, 300);
    var waterMat = new THREE.MeshStandardMaterial({ color: WATER_BLUE, roughness: 0.5 });
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = -50;
    scene.add(water);
    objects.push(water);

    // Ambient light
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light for shadows
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
  }

  function update(delta) {
    var time = performance.now() * 0.001;

    // Animate crane arm (rotation around Y axis)
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].animId === 'crane_arm') {
        objects[i].rotation.y += delta * 0.5;
      }
      // Animate vent pipes (bobbing)
      if (objects[i].animId && objects[i].animId.indexOf('vent_') === 0) {
        objects[i].position.y += Math.sin(time * 2) * delta * 0.5;
      }
      // Animate submarine periscope (rising/falling)
      if (objects[i].animId === 'periscope') {
        objects[i].position.y = 16 + Math.sin(time * 0.8) * 3;
      }
      // Animate radar rotation
      if (objects[i].animId === 'radar') {
        objects[i].rotation.y += delta * 1.2;
      }
      // Animate searchlights
      if (objects[i].animId && objects[i].animId.indexOf('searchlight_') === 0) {
        objects[i].rotation.z += delta * 0.8;
      }
    }

    // Update enemy positions (simple patrol)
    for (var e = 0; e < enemies.length; e++) {
      var enemy = enemies[e];
      var patrolDist = 30;

      // Simple back-and-forth patrol
      enemy.position[0] += Math.cos(time * enemy.speed * 0.3) * delta * enemy.speed;
      enemy.position[2] += Math.sin(time * enemy.speed * 0.2) * delta * enemy.speed;
    }
  }

  function reset() {
    // Clear all objects and enemies
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
    }
    objects = [];
    enemies = [];
    animations = [];
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getEnemies: function() { return enemies; },
    getObjects: function() { return objects; }
  };
}());
