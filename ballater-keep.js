window.BallaterKeep = (function() {
  'use strict';

  var exports = {};
  var scene = null;
  var baseX = 540;
  var baseZ = 580;

  function initialize(sceneRef) {
    scene = sceneRef;
    buildVictorianStation();
    buildWarrantShops();
    buildGuardHouse();
    buildBarriers();
    buildProtectionVehicles();
    buildRelayMast();
    buildRubblePile();
    buildWatchtower();
  }

  function buildVictorianStation() {
    var geometry = new THREE.BoxGeometry(10, 5, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x8B2500 });
    var station = new THREE.Mesh(geometry, material);
    station.position.set(baseX, 2.5, baseZ);
    station.castShadow = true;
    station.receiveShadow = true;
    scene.add(station);
  }

  function buildWarrantShops() {
    var shopWidth = 3;
    var shopHeight = 5;
    var shopDepth = 4;
    var shopY = 2.5;
    var shopMaterial = new THREE.MeshLambertMaterial({ color: 0xA0A0A0 });

    var startX = baseX - 9;
    var shopZ = baseZ - 8;

    for (var i = 0; i < 4; i++) {
      var geometry = new THREE.BoxGeometry(shopWidth, shopHeight, shopDepth);
      var shop = new THREE.Mesh(geometry, shopMaterial);
      shop.position.set(startX + (i * 4), shopY, shopZ);
      shop.castShadow = true;
      shop.receiveShadow = true;
      scene.add(shop);
    }
  }

  function buildGuardHouse() {
    var mainGeometry = new THREE.BoxGeometry(4, 4, 4);
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var guardHouse = new THREE.Mesh(mainGeometry, stoneMaterial);
    guardHouse.position.set(baseX - 15, 2, baseZ + 10);
    guardHouse.castShadow = true;
    guardHouse.receiveShadow = true;
    scene.add(guardHouse);

    var postRadius = 0.3;
    var postHeight = 5;
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });

    var corners = [
      [-2, -2],
      [2, -2],
      [-2, 2],
      [2, 2]
    ];

    for (var i = 0; i < corners.length; i++) {
      var postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8);
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(baseX - 15 + corners[i][0], postHeight / 2, baseZ + 10 + corners[i][1]);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
    }
  }

  function buildBarriers() {
    var barrierWidth = 1.5;
    var barrierHeight = 1;
    var barrierDepth = 0.8;
    var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var barrierZ = baseZ + 15;
    var startX = baseX - 8;

    for (var i = 0; i < 5; i++) {
      var geometry = new THREE.BoxGeometry(barrierWidth, barrierHeight, barrierDepth);
      var barrier = new THREE.Mesh(geometry, concreteMaterial);
      barrier.position.set(startX + (i * 2.5), 0.5, barrierZ);
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      scene.add(barrier);
    }
  }

  function buildProtectionVehicles() {
    var vehicleLength = 5;
    var vehicleHeight = 2;
    var vehicleWidth = 2.5;
    var blackMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });

    var vehicles = [
      {x: baseX - 20, z: baseZ - 5},
      {x: baseX + 20, z: baseZ + 5}
    ];

    for (var i = 0; i < vehicles.length; i++) {
      var geometry = new THREE.BoxGeometry(vehicleLength, vehicleHeight, vehicleWidth);
      var vehicle = new THREE.Mesh(geometry, blackMaterial);
      vehicle.position.set(vehicles[i].x, vehicleHeight / 2, vehicles[i].z);
      vehicle.castShadow = true;
      vehicle.receiveShadow = true;
      scene.add(vehicle);
    }
  }

  function buildRelayMast() {
    var mastRadius = 0.2;
    var mastHeight = 18;
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 });

    var mastGeometry = new THREE.CylinderGeometry(mastRadius, mastRadius, mastHeight, 12);
    var mast = new THREE.Mesh(mastGeometry, stoneMaterial);
    mast.position.set(baseX + 15, mastHeight / 2, baseZ - 12);
    mast.castShadow = true;
    mast.receiveShadow = true;
    scene.add(mast);

    var dishRadius = 0.8;
    var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });

    var dishHeights = [15, 16.5, 18];

    for (var i = 0; i < dishHeights.length; i++) {
      var dishGeometry = new THREE.SphereGeometry(dishRadius, 16, 16);
      var dish = new THREE.Mesh(dishGeometry, dishMaterial);
      dish.position.set(baseX + 15, dishHeights[i], baseZ - 12);
      dish.castShadow = true;
      dish.receiveShadow = true;
      scene.add(dish);
    }
  }

  function buildRubblePile() {
    var rubbleMaterial1 = new THREE.MeshLambertMaterial({ color: 0x909090 });
    var rubbleMaterial2 = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

    var rubblePositions = [
      {x: baseX - 25, z: baseZ + 20, mat: rubbleMaterial1},
      {x: baseX - 22, z: baseZ + 22, mat: rubbleMaterial2},
      {x: baseX - 23, z: baseZ + 18, mat: rubbleMaterial1},
      {x: baseX - 20, z: baseZ + 21, mat: rubbleMaterial2},
      {x: baseX - 21, z: baseZ + 19, mat: rubbleMaterial1}
    ];

    for (var i = 0; i < rubblePositions.length; i++) {
      var width = 1.5 + (Math.random() * 1);
      var height = 1 + (Math.random() * 1.5);
      var depth = 1.5 + (Math.random() * 1);
      var geometry = new THREE.BoxGeometry(width, height, depth);
      var rubble = new THREE.Mesh(geometry, rubblePositions[i].mat);
      rubble.position.set(rubblePositions[i].x, height / 2, rubblePositions[i].z);
      rubble.rotation.x = (Math.random() * 0.3);
      rubble.rotation.z = (Math.random() * 0.3);
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      scene.add(rubble);
    }
  }

  function buildWatchtower() {
    var towerRadius = 2;
    var towerHeight = 12;
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });

    var towerGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
    var tower = new THREE.Mesh(towerGeometry, stoneMaterial);
    tower.position.set(baseX - 35, towerHeight / 2, baseZ + 25);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    var roofGeometry = new THREE.ConeGeometry(towerRadius + 0.3, 2, 16);
    var roof = new THREE.Mesh(roofGeometry, stoneMaterial);
    roof.position.set(baseX - 35, towerHeight + 1, baseZ + 25);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
  }

  exports.initialize = initialize;

  return exports;
}());
