window.LochmaddyFort = (function() {
  'use strict';

  var baseX = 1560;
  var baseZ = 2110;
  var structures = [];

  function createIslandScatter() {
    var islandGroup = new THREE.Group();
    var islandPositions = [
      [baseX - 50, -15, baseZ - 80],
      [baseX - 20, -12, baseZ - 100],
      [baseX + 40, -14, baseZ - 60],
      [baseX + 80, -16, baseZ - 40],
      [baseX + 120, -13, baseZ - 90],
      [baseX - 100, -14, baseZ - 20],
      [baseX + 60, -15, baseZ + 30],
      [baseX - 70, -13, baseZ + 50]
    ];

    var islandMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

    for (var i = 0; i < islandPositions.length; i++) {
      var sizes = [15 + Math.random() * 20, 5 + Math.random() * 8, 12 + Math.random() * 18];
      var geometry = new THREE.BoxGeometry(sizes[0], sizes[1], sizes[2]);
      var island = new THREE.Mesh(geometry, islandMaterial);
      island.position.set(islandPositions[i][0], islandPositions[i][1], islandPositions[i][2]);
      island.castShadow = true;
      island.receiveShadow = true;
      islandGroup.add(island);
    }

    return islandGroup;
  }

  function createFerryTerminal() {
    var terminalGroup = new THREE.Group();
    var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

    var buildingGeometry = new THREE.BoxGeometry(8, 4, 4);
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(baseX + 100, 2, baseZ + 80);
    building.castShadow = true;
    building.receiveShadow = true;
    terminalGroup.add(building);

    var rampGeometry = new THREE.BoxGeometry(10, 1, 6);
    var ramp = new THREE.Mesh(rampGeometry, buildingMaterial);
    ramp.position.set(baseX + 110, 0, baseZ + 95);
    ramp.rotation.z = 0.2;
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    terminalGroup.add(ramp);

    terminalGroup.position.set(baseX, 0, baseZ);
    return terminalGroup;
  }

  function createCourthouse() {
    var courthouseGroup = new THREE.Group();
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0xA9927D });

    var buildingGeometry = new THREE.BoxGeometry(6, 5, 4);
    var building = new THREE.Mesh(buildingGeometry, stoneMaterial);
    building.position.set(baseX - 80, 2.5, baseZ + 60);
    building.castShadow = true;
    building.receiveShadow = true;
    courthouseGroup.add(building);

    var roofGeometry = new THREE.ConeGeometry(4.5, 2, 4);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x662211 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(baseX - 80, 6.5, baseZ + 60);
    roof.castShadow = true;
    roof.receiveShadow = true;
    courthouseGroup.add(roof);

    courthouseGroup.position.set(baseX, 0, baseZ);
    return courthouseGroup;
  }

  function createMachairDefence() {
    var defenceGroup = new THREE.Group();
    var turfMaterial = new THREE.MeshLambertMaterial({ color: 0x9AAA77 });

    var bermGeometry = new THREE.BoxGeometry(120, 2, 8);
    var berm = new THREE.Mesh(bermGeometry, turfMaterial);
    berm.position.set(baseX + 60, 1, baseZ - 120);
    berm.castShadow = true;
    berm.receiveShadow = true;
    defenceGroup.add(berm);

    var berlins = [
      [baseX - 30, baseZ - 140],
      [baseX + 40, baseZ - 150],
      [baseX + 110, baseZ - 135]
    ];

    for (var i = 0; i < berlins.length; i++) {
      var berlinGeometry = new THREE.BoxGeometry(6, 1.5, 6);
      var berlin = new THREE.Mesh(berlinGeometry, turfMaterial);
      berlin.position.set(berlins[i][0], 0.75, berlins[i][1]);
      berlin.castShadow = true;
      berlin.receiveShadow = true;
      defenceGroup.add(berlin);
    }

    defenceGroup.position.set(baseX, 0, baseZ);
    return defenceGroup;
  }

  function createObservationTower() {
    var towerGroup = new THREE.Group();

    var cylinderGeometry = new THREE.CylinderGeometry(3, 3.5, 12, 16);
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x778899 });
    var cylinder = new THREE.Mesh(cylinderGeometry, stoneMaterial);
    cylinder.position.set(baseX - 120, 6, baseZ - 80);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    towerGroup.add(cylinder);

    var platformGeometry = new THREE.BoxGeometry(8, 2, 8);
    var platform = new THREE.Mesh(platformGeometry, stoneMaterial);
    platform.position.set(baseX - 120, 13, baseZ - 80);
    platform.castShadow = true;
    platform.receiveShadow = true;
    towerGroup.add(platform);

    var wallGeometry = new THREE.BoxGeometry(7.5, 2, 0.4);
    var wall = new THREE.Mesh(wallGeometry, stoneMaterial);
    wall.position.set(baseX - 120, 14.5, baseZ - 76);
    wall.castShadow = true;
    wall.receiveShadow = true;
    towerGroup.add(wall);

    towerGroup.position.set(baseX, 0, baseZ);
    return towerGroup;
  }

  function createPatrolBoat() {
    var boatGroup = new THREE.Group();

    var hullGeometry = new THREE.BoxGeometry(10, 2, 3);
    var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C3C });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(baseX + 180, 1, baseZ + 120);
    hull.castShadow = true;
    hull.receiveShadow = true;
    boatGroup.add(hull);

    var cabinGeometry = new THREE.BoxGeometry(3, 2, 2.5);
    var cabin = new THREE.Mesh(cabinGeometry, hullMaterial);
    cabin.position.set(baseX + 173, 2.5, baseZ + 120);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    boatGroup.add(cabin);

    var gunMountGeometry = new THREE.CylinderGeometry(0.8, 1, 1.5, 8);
    var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    var gunMount = new THREE.Mesh(gunMountGeometry, metalMaterial);
    gunMount.position.set(baseX + 183, 3, baseZ + 120);
    gunMount.castShadow = true;
    gunMount.receiveShadow = true;
    boatGroup.add(gunMount);

    boatGroup.position.set(baseX, 0, baseZ);
    return boatGroup;
  }

  function createCauseway() {
    var causewayGroup = new THREE.Group();
    var concreteColor = 0x696969;
    var concreteMaterial = new THREE.MeshLambertMaterial({ color: concreteColor });

    var roadSegments = [
      [[baseX - 40, baseZ - 50], [baseX + 20, baseZ - 70]],
      [[baseX + 20, baseZ - 70], [baseX + 80, baseZ - 40]],
      [[baseX + 80, baseZ - 40], [baseX + 120, baseZ + 10]]
    ];

    for (var i = 0; i < roadSegments.length; i++) {
      var startPos = roadSegments[i][0];
      var endPos = roadSegments[i][1];

      var roadGeometry = new THREE.BoxGeometry(6, 0.8, 4);
      var road = new THREE.Mesh(roadGeometry, concreteMaterial);
      road.position.set((startPos[0] + endPos[0]) / 2, 0.4, (startPos[1] + endPos[1]) / 2);
      road.castShadow = true;
      road.receiveShadow = true;
      causewayGroup.add(road);

      var supportGeometry = new THREE.CylinderGeometry(0.6, 0.8, 8, 8);
      var support1 = new THREE.Mesh(supportGeometry, concreteMaterial);
      support1.position.set(startPos[0], -4, startPos[1]);
      support1.castShadow = true;
      support1.receiveShadow = true;
      causewayGroup.add(support1);

      var support2 = new THREE.Mesh(supportGeometry, concreteMaterial);
      support2.position.set(endPos[0], -4, endPos[1]);
      support2.castShadow = true;
      support2.receiveShadow = true;
      causewayGroup.add(support2);
    }

    causewayGroup.position.set(baseX, 0, baseZ);
    return causewayGroup;
  }

  function createStormBunker() {
    var bunkerGroup = new THREE.Group();
    var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });

    var mainGeometry = new THREE.BoxGeometry(12, 6, 14);
    var main = new THREE.Mesh(mainGeometry, concreteMaterial);
    main.position.set(baseX - 180, 3, baseZ - 150);
    main.castShadow = true;
    main.receiveShadow = true;
    bunkerGroup.add(main);

    var embankmentGeometry = new THREE.BoxGeometry(16, 4, 18);
    var embankment = new THREE.Mesh(embankmentGeometry, concreteMaterial);
    embankment.position.set(baseX - 180, 1, baseZ - 150);
    embankment.castShadow = true;
    embankment.receiveShadow = true;
    bunkerGroup.add(embankment);

    var gunportGeometry = new THREE.BoxGeometry(2, 1.5, 0.8);
    var gunport1 = new THREE.Mesh(gunportGeometry, concreteMaterial);
    gunport1.position.set(baseX - 174, 4, baseZ - 157);
    gunport1.castShadow = true;
    gunport1.receiveShadow = true;
    bunkerGroup.add(gunport1);

    var gunport2 = new THREE.Mesh(gunportGeometry, concreteMaterial);
    gunport2.position.set(baseX - 174, 4, baseZ - 143);
    gunport2.castShadow = true;
    gunport2.receiveShadow = true;
    bunkerGroup.add(gunport2);

    bunkerGroup.position.set(baseX, 0, baseZ);
    return bunkerGroup;
  }

  function build() {
    var islandScatter = createIslandScatter();
    var ferryTerminal = createFerryTerminal();
    var courthouse = createCourthouse();
    var machairDefence = createMachairDefence();
    var observationTower = createObservationTower();
    var patrolBoat = createPatrolBoat();
    var causeway = createCauseway();
    var stormBunker = createStormBunker();

    structures = [
      islandScatter,
      ferryTerminal,
      courthouse,
      machairDefence,
      observationTower,
      patrolBoat,
      causeway,
      stormBunker
    ];

    return structures;
  }

  function getStructures() {
    return structures;
  }

  function getBasePosition() {
    return {
      x: baseX,
      z: baseZ
    };
  }

  return {
    build: build,
    getStructures: getStructures,
    getBasePosition: getBasePosition
  };
}());
