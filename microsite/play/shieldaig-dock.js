var window = window || {};

window.ShieldaigDock = (function() {
  'use strict';

  var scene = null;
  var worldX = 1260;
  var worldZ = 1660;

  function build() {
    var structures = [];

    // 1. Shieldaig Island pine forest
    var island = createIsland();
    structures.push(island);

    // 2. Village pier
    var pier = createPier();
    structures.push(pier);

    // 3. Stone village houses in row
    var houses = createVillageHouses();
    structures.push(houses);

    // 4. Loch hidden submarine
    var submarine = createSubmarine();
    structures.push(submarine);

    // 5. Pine resin fuel store
    var fuelStore = createFuelStore();
    structures.push(fuelStore);

    // 6. Torridon peaks backdrop
    var peaks = createPeaks();
    structures.push(peaks);

    // 7. Underwater mine barrier
    var mines = createMineBarrier();
    structures.push(mines);

    // 8. Coast watcher hut
    var hut = createWatcherHut();
    structures.push(hut);

    return structures;
  }

  function createIsland() {
    var group = new THREE.Group();
    group.position.set(worldX - 80, -2, worldZ - 100);

    // Island platform
    var platformGeo = new THREE.BoxGeometry(60, 3, 50);
    var platformMat = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 0;
    group.add(platform);

    // Pine trees (7 trees)
    var treePositions = [
      [-20, 0, -15],
      [-10, 0, -10],
      [0, 0, -8],
      [10, 0, -12],
      [-15, 0, 5],
      [5, 0, 8],
      [15, 0, 5]
    ];

    for (var i = 0; i < treePositions.length; i++) {
      var pos = treePositions[i];
      var tree = createPineTree(pos[0], 3 + pos[1], pos[2]);
      group.add(tree);
    }

    return group;
  }

  function createPineTree(x, y, z) {
    var treeGroup = new THREE.Group();

    // Trunk
    var trunkGeo = new THREE.CylinderGeometry(0.8, 1.2, 8, 6);
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
    var trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, y + 4, z);
    treeGroup.add(trunk);

    // Crown (cone)
    var crownGeo = new THREE.ConeGeometry(4, 10, 8);
    var crownMat = new THREE.MeshLambertMaterial({ color: 0x2D5016 });
    var crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.set(x, y + 10, z);
    treeGroup.add(crown);

    return treeGroup;
  }

  function createPier() {
    var pierGroup = new THREE.Group();
    pierGroup.position.set(worldX - 120, -3, worldZ + 40);

    // Pier deck
    var deckGeo = new THREE.BoxGeometry(12, 0.8, 3);
    var deckMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 1;
    pierGroup.add(deck);

    // Support posts (4 posts)
    var postPositions = [
      [-5, 0, -1],
      [-5, 0, 1],
      [5, 0, -1],
      [5, 0, 1]
    ];

    for (var i = 0; i < postPositions.length; i++) {
      var pos = postPositions[i];
      var postGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 4);
      var postMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
      var post = new THREE.Mesh(postGeo, postMat);
      post.position.set(pos[0], pos[1] - 1, pos[2]);
      pierGroup.add(post);
    }

    return pierGroup;
  }

  function createVillageHouses() {
    var housesGroup = new THREE.Group();
    housesGroup.position.set(worldX + 30, 0, worldZ - 80);

    // 4 white cottages in a row
    var housePositions = [
      [-15, 0, 0],
      [-5, 0, 0],
      [5, 0, 0],
      [15, 0, 0]
    ];

    for (var i = 0; i < housePositions.length; i++) {
      var pos = housePositions[i];
      var house = createCottage(pos[0], pos[1], pos[2]);
      housesGroup.add(house);
    }

    return housesGroup;
  }

  function createCottage(x, y, z) {
    var cottageGroup = new THREE.Group();
    cottageGroup.position.set(x, y, z);

    // Main house body
    var bodyGeo = new THREE.BoxGeometry(4, 3.5, 4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.75;
    cottageGroup.add(body);

    // Roof (cone)
    var roofGeo = new THREE.ConeGeometry(3, 2, 4);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 4;
    cottageGroup.add(roof);

    return cottageGroup;
  }

  function createSubmarine() {
    var subGroup = new THREE.Group();
    subGroup.position.set(worldX, -4, worldZ + 100);

    // Hull (low-profile, mostly submerged)
    var hullGeo = new THREE.BoxGeometry(16, 1.5, 2);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0;
    subGroup.add(hull);

    // Conning tower
    var towerGeo = new THREE.BoxGeometry(1.2, 1.8, 1.2);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x303030 });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 1.5, 0);
    subGroup.add(tower);

    // Periscope (cylinder)
    var scopeGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 4);
    var scopeMat = new THREE.MeshLambertMaterial({ color: 0x1F1F1F });
    var scope = new THREE.Mesh(scopeGeo, scopeMat);
    scope.position.set(0, 2.5, 0);
    subGroup.add(scope);

    return subGroup;
  }

  function createFuelStore() {
    var storeGroup = new THREE.Group();
    storeGroup.position.set(worldX + 100, 0, worldZ - 30);

    // Shed
    var shedGeo = new THREE.BoxGeometry(6, 4, 4);
    var shedMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var shed = new THREE.Mesh(shedGeo, shedMat);
    shed.position.set(0, 2, 0);
    storeGroup.add(shed);

    // 3 Resin barrels
    var barrelPositions = [
      [-2, 0, -1],
      [0, 0, -1],
      [2, 0, -1]
    ];

    for (var i = 0; i < barrelPositions.length; i++) {
      var pos = barrelPositions[i];
      var barrelGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.5, 6);
      var barrelMat = new THREE.MeshLambertMaterial({ color: 0xC4A000 });
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(pos[0], 0.75 + pos[1], pos[2]);
      storeGroup.add(barrel);
    }

    return storeGroup;
  }

  function createPeaks() {
    var peaksGroup = new THREE.Group();
    peaksGroup.position.set(worldX - 200, 20, worldZ - 300);

    // 3 mountain shapes (red sandstone)
    var peakPositions = [
      [-80, 0, 0],
      [0, 0, -40],
      [80, 0, 0]
    ];

    for (var i = 0; i < peakPositions.length; i++) {
      var pos = peakPositions[i];
      var peakGeo = new THREE.BoxGeometry(60, 120, 40);
      var peakMat = new THREE.MeshLambertMaterial({ color: 0xAA4422 });
      var peak = new THREE.Mesh(peakGeo, peakMat);
      peak.position.set(pos[0], pos[1] + 60, pos[2]);
      peaksGroup.add(peak);
    }

    return peaksGroup;
  }

  function createMineBarrier() {
    var minesGroup = new THREE.Group();
    minesGroup.position.set(worldX + 150, -5, worldZ);

    // Barrier lines with mines at intersections
    var linePoints = [
      [-30, 0, -20],
      [30, 0, -20],
      [30, 0, 20],
      [-30, 0, 20],
      [-30, 0, -20]
    ];

    // Draw lines
    for (var i = 0; i < linePoints.length - 1; i++) {
      var p1 = new THREE.Vector3(linePoints[i][0], linePoints[i][1], linePoints[i][2]);
      var p2 = new THREE.Vector3(linePoints[i + 1][0], linePoints[i + 1][1], linePoints[i + 1][2]);

      var lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(
        new Float32Array([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z]), 3
      ));

      var lineMat = new THREE.LineBasicMaterial({ color: 0x808080 });
      var line = new THREE.LineSegments(lineGeo, lineMat);
      minesGroup.add(line);
    }

    // Mines at corners
    var minePositions = [
      [-30, 0, -20],
      [30, 0, -20],
      [30, 0, 20],
      [-30, 0, 20]
    ];

    for (var j = 0; j < minePositions.length; j++) {
      var minePos = minePositions[j];
      var mineGeo = new THREE.SphereGeometry(1.2, 6, 6);
      var mineMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
      var mine = new THREE.Mesh(mineGeo, mineMat);
      mine.position.set(minePos[0], minePos[1], minePos[2]);
      minesGroup.add(mine);
    }

    return minesGroup;
  }

  function createWatcherHut() {
    var hutGroup = new THREE.Group();
    hutGroup.position.set(worldX - 150, 5, worldZ + 80);

    // Rocky point base
    var rockGeo = new THREE.BoxGeometry(8, 6, 8);
    var rockMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.y = 3;
    hutGroup.add(rock);

    // Hut structure
    var hutBodyGeo = new THREE.BoxGeometry(3, 3, 3);
    var hutBodyMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var hutBody = new THREE.Mesh(hutBodyGeo, hutBodyMat);
    hutBody.position.set(0, 10, 0);
    hutGroup.add(hutBody);

    // Hut roof (cone)
    var hutRoofGeo = new THREE.ConeGeometry(2.5, 2, 4);
    var hutRoofMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var hutRoof = new THREE.Mesh(hutRoofGeo, hutRoofMat);
    hutRoof.position.y = 12.5;
    hutGroup.add(hutRoof);

    // Watch tower (cylinder)
    var towerGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 4);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(1, 13, 1);
    hutGroup.add(tower);

    return hutGroup;
  }

  function load(sceneRef) {
    scene = sceneRef;
    var structures = build();

    for (var i = 0; i < structures.length; i++) {
      scene.add(structures[i]);
    }

    return structures;
  }

  return {
    load: load,
    build: build,
    worldX: worldX,
    worldZ: worldZ
  };
}());
