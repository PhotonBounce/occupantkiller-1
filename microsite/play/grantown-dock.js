window.GrantownDock = (function() {
  'use strict';

  var createGeorgianSquare = function(scene, baseX, baseZ) {
    var squareGeo = new THREE.BoxGeometry(40, 0.5, 40);
    var squareMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var squareMesh = new THREE.Mesh(squareGeo, squareMat);
    squareMesh.position.set(baseX, 0.25, baseZ);
    scene.add(squareMesh);

    var buildingMat = new THREE.MeshLambertMaterial({ color: 0xC8A97E });
    var buildingGeo = new THREE.BoxGeometry(40, 8, 6);
    var northBuilding = new THREE.Mesh(buildingGeo, buildingMat);
    northBuilding.position.set(baseX, 4, baseZ - 18);
    scene.add(northBuilding);

    var southBuilding = new THREE.Mesh(buildingGeo, buildingMat);
    southBuilding.position.set(baseX, 4, baseZ + 18);
    scene.add(southBuilding);

    var eastBuildingGeo = new THREE.BoxGeometry(6, 8, 40);
    var eastBuilding = new THREE.Mesh(eastBuildingGeo, buildingMat);
    eastBuilding.position.set(baseX + 18, 4, baseZ);
    scene.add(eastBuilding);
  };

  var createBridge = function(scene, baseX, baseZ) {
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    var bridgeGeo = new THREE.BoxGeometry(8, 2, 50);
    var bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridgeMesh.position.set(baseX, 3, baseZ);
    scene.add(bridgeMesh);

    var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var towerGeo = new THREE.CylinderGeometry(3, 3, 12, 16);
    var northTower = new THREE.Mesh(towerGeo, towerMat);
    northTower.position.set(baseX - 4, 6, baseZ - 28);
    scene.add(northTower);

    var southTower = new THREE.Mesh(towerGeo, towerMat);
    southTower.position.set(baseX + 4, 6, baseZ + 28);
    scene.add(southTower);
  };

  var createSupplyDepot = function(scene, baseX, baseZ) {
    var depotGeo = new THREE.BoxGeometry(30, 10, 20);
    var depotMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var depotMesh = new THREE.Mesh(depotGeo, depotMat);
    depotMesh.position.set(baseX - 35, 5, baseZ - 40);
    scene.add(depotMesh);
  };

  var createDock = function(scene, baseX, baseZ) {
    var dockWallGeo = new THREE.BoxGeometry(35, 3, 2);
    var dockMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
    var dockWall = new THREE.Mesh(dockWallGeo, dockMat);
    dockWall.position.set(baseX + 30, 1.5, baseZ + 50);
    scene.add(dockWall);

    var boatGeo = new THREE.BoxGeometry(12, 2, 8);
    var boatMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var boat = new THREE.Mesh(boatGeo, boatMat);
    boat.position.set(baseX + 30, 3.5, baseZ + 55);
    scene.add(boat);
  };

  var createArtilleryPark = function(scene, baseX, baseZ) {
    var carriageMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });

    var positions = [
      [baseX - 25, baseZ + 30],
      [baseX - 15, baseZ + 35],
      [baseX - 5, baseZ + 30]
    ];

    var i;
    for (i = 0; i < positions.length; i++) {
      var carriageGeo = new THREE.BoxGeometry(3, 1.5, 4);
      var carriage = new THREE.Mesh(carriageGeo, carriageMat);
      carriage.position.set(positions[i][0], 0.75, positions[i][1]);
      scene.add(carriage);

      var barrelGeo = new THREE.CylinderGeometry(0.4, 0.5, 6, 12);
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.rotation.z = Math.PI / 6;
      barrel.position.set(positions[i][0], 2, positions[i][1]);
      scene.add(barrel);
    }
  };

  var createTownHall = function(scene, baseX, baseZ) {
    var hallGeo = new THREE.BoxGeometry(6, 5, 5);
    var hallMat = new THREE.MeshLambertMaterial({ color: 0xC8A97E });
    var hallMesh = new THREE.Mesh(hallGeo, hallMat);
    hallMesh.position.set(baseX - 50, 2.5, baseZ - 30);
    scene.add(hallMesh);
  };

  var createSignalStation = function(scene, baseX, baseZ) {
    var towerGeo = new THREE.CylinderGeometry(2, 2, 15, 16);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(baseX + 50, 7.5, baseZ - 50);
    scene.add(tower);

    var semaphoreMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    var arm1Geo = new THREE.BoxGeometry(0.2, 0.2, 5);
    var arm1 = new THREE.Mesh(arm1Geo, semaphoreMat);
    arm1.position.set(baseX + 50, 14, baseZ - 50);
    arm1.rotation.z = Math.PI / 4;
    scene.add(arm1);

    var arm2 = new THREE.Mesh(arm1Geo, semaphoreMat);
    arm2.position.set(baseX + 50, 14, baseZ - 50);
    arm2.rotation.z = -Math.PI / 4;
    scene.add(arm2);
  };

  var createAntiTankDitch = function(scene, baseX, baseZ) {
    var ditchGeo = new THREE.BoxGeometry(50, 4, 3);
    var ditchMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var ditch = new THREE.Mesh(ditchGeo, ditchMat);
    ditch.position.set(baseX, -2, baseZ + 70);
    scene.add(ditch);

    var wallNorthGeo = new THREE.BoxGeometry(50, 2, 1);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
    var wallNorth = new THREE.Mesh(wallNorthGeo, wallMat);
    wallNorth.position.set(baseX, 0, baseZ + 72);
    scene.add(wallNorth);

    var wallSouth = new THREE.Mesh(wallNorthGeo, wallMat);
    wallSouth.position.set(baseX, 0, baseZ + 68);
    scene.add(wallSouth);
  };

  var initialize = function(scene) {
    var baseX = 620;
    var baseZ = 700;

    createGeorgianSquare(scene, baseX, baseZ);
    createBridge(scene, baseX, baseZ);
    createSupplyDepot(scene, baseX, baseZ);
    createDock(scene, baseX, baseZ);
    createArtilleryPark(scene, baseX, baseZ);
    createTownHall(scene, baseX, baseZ);
    createSignalStation(scene, baseX, baseZ);
    createAntiTankDitch(scene, baseX, baseZ);
  };

  return {
    init: initialize
  };
}());
