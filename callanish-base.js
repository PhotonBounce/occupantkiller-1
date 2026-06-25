var CallanishBase = (function() {
  'use strict';

  var worldX = 1480;
  var worldZ = 1990;

  function createCentralMonolith(scene) {
    var geometry = new THREE.CylinderGeometry(0.6, 0.6, 5, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(worldX, 2.5, worldZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function createStoneCircleAvenue(scene) {
    var stones = [];
    var radius = 12;
    var positions = [
      [0, 0],
      [-8, -8],
      [0, -12],
      [8, -8],
      [12, 0],
      [8, 8],
      [0, 12],
      [-8, 8],
      [-10, -2],
      [-2, -10],
      [10, -2],
      [2, 10]
    ];

    for (var i = 0; i < positions.length; i = i + 1) {
      var geometry = new THREE.BoxGeometry(0.8, 4, 0.8);
      var material = new THREE.MeshLambertMaterial({ color: 0x777777 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(worldX + positions[i][0], 2, worldZ + positions[i][1]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      stones.push(mesh);
    }

    return stones;
  }

  function createBurialCairn(scene) {
    var geometry = new THREE.BoxGeometry(3, 1, 3);
    var material = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(worldX, 0.5, worldZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function createMilitaryRangingBoard(scene) {
    var postGeometry = new THREE.BoxGeometry(0.4, 3, 0.4);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(worldX + 18, 1.5, worldZ - 15);
    post.castShadow = true;
    post.receiveShadow = true;
    scene.add(post);

    var gridPoints = [];
    var gridSize = 4;
    var gridSpacing = 1;
    for (var i = 0; i < gridSize; i = i + 1) {
      for (var j = 0; j < gridSize; j = j + 1) {
        var x = worldX + 18 - (gridSize * gridSpacing * 0.5) + (i * gridSpacing);
        var y = 3.2 + (j * 0.5);
        var z = worldZ - 15;
        gridPoints.push(new THREE.Vector3(x, y, z));
      }
    }

    var gridGeometry = new THREE.BufferGeometry().setFromPoints(gridPoints);
    var gridMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    var gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
    scene.add(gridLines);

    return { post: post, grid: gridLines };
  }

  function createLochRoagGunPlatform(scene) {
    var platformGeometry = new THREE.BoxGeometry(6, 0.5, 6);
    var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(worldX - 25, 0.25, worldZ + 20);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);

    var guns = [];
    var gunPositions = [
      [-1.5, 1, 0],
      [1.5, 1, 0]
    ];

    for (var i = 0; i < gunPositions.length; i = i + 1) {
      var gunGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 12);
      var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var gun = new THREE.Mesh(gunGeometry, gunMaterial);
      gun.position.set(
        worldX - 25 + gunPositions[i][0],
        0.25 + gunPositions[i][1],
        worldZ + 20 + gunPositions[i][2]
      );
      gun.rotation.z = Math.PI * 0.25;
      gun.castShadow = true;
      gun.receiveShadow = true;
      scene.add(gun);
      guns.push(gun);
    }

    return { platform: platform, guns: guns };
  }

  function createExcavationTrench(scene) {
    var trenchGeometry = new THREE.BoxGeometry(2, 2.5, 12);
    var trenchMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a2e });
    var trench = new THREE.Mesh(trenchGeometry, trenchMaterial);
    trench.position.set(worldX - 15, -1.25, worldZ);
    trench.castShadow = true;
    trench.receiveShadow = true;
    scene.add(trench);
    return trench;
  }

  function createHebrideanBlackhouse(scene) {
    var houseGeometry = new THREE.BoxGeometry(8, 3, 3);
    var houseMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a1f });
    var house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(worldX + 30, 1.5, worldZ - 25);
    house.castShadow = true;
    house.receiveShadow = true;
    scene.add(house);

    var roofGeometry = new THREE.ConeGeometry(5, 2, 8);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a0f });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(worldX + 30, 4.5, worldZ - 25);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);

    return { house: house, roof: roof };
  }

  function createDefenceWireRing(scene) {
    var ringPoints = [];
    var ringRadius = 14;
    var segments = 24;

    for (var i = 0; i < segments; i = i + 1) {
      var angle = (i / segments) * Math.PI * 2;
      var x = worldX + (Math.cos(angle) * ringRadius);
      var z = worldZ + (Math.sin(angle) * ringRadius);
      ringPoints.push(new THREE.Vector3(x, 4.5, z));
    }
    ringPoints.push(ringPoints[0]);

    var ringGeometry = new THREE.BufferGeometry().setFromPoints(ringPoints);
    var ringMaterial = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 2 });
    var ring = new THREE.LineSegments(ringGeometry, ringMaterial);
    scene.add(ring);

    return ring;
  }

  function build(scene) {
    var structures = {};
    structures.monolith = createCentralMonolith(scene);
    structures.stoneCircle = createStoneCircleAvenue(scene);
    structures.cairn = createBurialCairn(scene);
    structures.rangingBoard = createMilitaryRangingBoard(scene);
    structures.gunPlatform = createLochRoagGunPlatform(scene);
    structures.trench = createExcavationTrench(scene);
    structures.blackhouse = createHebrideanBlackhouse(scene);
    structures.defenceRing = createDefenceWireRing(scene);
    return structures;
  }

  function getWorldPosition() {
    return { x: worldX, z: worldZ };
  }

  var pub = {};
  pub.build = build;
  pub.getWorldPosition = getWorldPosition;

  return pub;
}());
