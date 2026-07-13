var BroadfordPost = (function() {
  'use strict';

  var structures = [];

  function createA87Checkpoint(scene, baseX, baseZ) {
    var checkpointGroup = new THREE.Group();

    var barrierGeometry = new THREE.BoxGeometry(20, 2, 1);
    var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
    var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.set(baseX, 1, baseZ);
    checkpointGroup.add(barrier);

    var guardPost1Geometry = new THREE.BoxGeometry(3, 4, 3);
    var guardPost1Material = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var guardPost1 = new THREE.Mesh(guardPost1Geometry, guardPost1Material);
    guardPost1.position.set(baseX - 12, 2, baseZ - 8);
    checkpointGroup.add(guardPost1);

    var guardPost2Geometry = new THREE.BoxGeometry(3, 4, 3);
    var guardPost2Material = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var guardPost2 = new THREE.Mesh(guardPost2Geometry, guardPost2Material);
    guardPost2.position.set(baseX + 12, 2, baseZ - 8);
    checkpointGroup.add(guardPost2);

    checkpointGroup.position.set(baseX, 0, baseZ);
    scene.add(checkpointGroup);
    structures.push(checkpointGroup);
  }

  function createBroadfordBayGunBattery(scene, baseX, baseZ) {
    var batteryGroup = new THREE.Group();

    var seaWallGeometry = new THREE.BoxGeometry(25, 3, 8);
    var seaWallMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var seaWall = new THREE.Mesh(seaWallGeometry, seaWallMaterial);
    seaWall.position.set(baseX, 1.5, baseZ);
    batteryGroup.add(seaWall);

    var gun1Geometry = new THREE.CylinderGeometry(0.5, 0.6, 6, 16);
    var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var gun1 = new THREE.Mesh(gun1Geometry, gunMaterial);
    gun1.position.set(baseX - 8, 5, baseZ + 2);
    gun1.rotation.z = 0.3;
    batteryGroup.add(gun1);

    var gun2Geometry = new THREE.CylinderGeometry(0.5, 0.6, 6, 16);
    var gun2 = new THREE.Mesh(gun2Geometry, gunMaterial);
    gun2.position.set(baseX, 5, baseZ + 2);
    gun2.rotation.z = 0.3;
    batteryGroup.add(gun2);

    var gun3Geometry = new THREE.CylinderGeometry(0.5, 0.6, 6, 16);
    var gun3 = new THREE.Mesh(gun3Geometry, gunMaterial);
    gun3.position.set(baseX + 8, 5, baseZ + 2);
    gun3.rotation.z = 0.3;
    batteryGroup.add(gun3);

    batteryGroup.position.set(baseX, 0, baseZ);
    scene.add(batteryGroup);
    structures.push(batteryGroup);
  }

  function createHotelBarracks(scene, baseX, baseZ) {
    var barracksGroup = new THREE.Group();

    var buildingGeometry = new THREE.BoxGeometry(10, 4, 5);
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var building = new THREE.Mesh(buildingGeometry, stoneMaterial);
    building.position.set(baseX, 2, baseZ);
    barracksGroup.add(building);

    var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var windowPositions = [
      [baseX - 3, 3, baseZ + 2.6],
      [baseX, 3, baseZ + 2.6],
      [baseX + 3, 3, baseZ + 2.6],
      [baseX - 3, 1, baseZ + 2.6],
      [baseX, 1, baseZ + 2.6],
      [baseX + 3, 1, baseZ + 2.6]
    ];

    var i;
    for (i = 0; i < windowPositions.length; i = i + 1) {
      var windowGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.2);
      var windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
      windowMesh.position.set(windowPositions[i][0], windowPositions[i][1], windowPositions[i][2]);
      barracksGroup.add(windowMesh);
    }

    barracksGroup.position.set(baseX, 0, baseZ);
    scene.add(barracksGroup);
    structures.push(barracksGroup);
  }

  function createBeinnnaCallachOP(scene, baseX, baseZ) {
    var opGroup = new THREE.Group();

    var hillGeometry = new THREE.BoxGeometry(15, 3, 15);
    var hillMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
    var hill = new THREE.Mesh(hillGeometry, hillMaterial);
    hill.position.set(baseX, 1.5, baseZ);
    opGroup.add(hill);

    var towerGeometry = new THREE.CylinderGeometry(1.5, 1.8, 18, 16);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(baseX, 10, baseZ);
    opGroup.add(tower);

    var dish1Geometry = new THREE.SphereGeometry(1.2, 12, 8);
    var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var dish1 = new THREE.Mesh(dish1Geometry, dishMaterial);
    dish1.position.set(baseX - 2, 19, baseZ);
    opGroup.add(dish1);

    var dish2Geometry = new THREE.SphereGeometry(1.2, 12, 8);
    var dish2 = new THREE.Mesh(dish2Geometry, dishMaterial);
    dish2.position.set(baseX + 2, 19, baseZ + 1);
    opGroup.add(dish2);

    var dish3Geometry = new THREE.SphereGeometry(1.2, 12, 8);
    var dish3 = new THREE.Mesh(dish3Geometry, dishMaterial);
    dish3.position.set(baseX, 19, baseZ - 1);
    opGroup.add(dish3);

    opGroup.position.set(baseX, 0, baseZ);
    scene.add(opGroup);
    structures.push(opGroup);
  }

  function createFuelStation(scene, baseX, baseZ) {
    var stationGroup = new THREE.Group();

    var islandGeometry = new THREE.BoxGeometry(12, 0.5, 8);
    var islandMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.position.set(baseX, 0.25, baseZ);
    stationGroup.add(island);

    var canopyGeometry = new THREE.BoxGeometry(12, 0.3, 8);
    var canopyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(baseX, 4.5, baseZ);
    stationGroup.add(canopy);

    var pumpMaterial = new THREE.MeshLambertMaterial({ color: 0x0000FF });

    var pump1Geometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
    var pump1 = new THREE.Mesh(pump1Geometry, pumpMaterial);
    pump1.position.set(baseX - 6, 1.5, baseZ - 3);
    stationGroup.add(pump1);

    var pump2Geometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
    var pump2 = new THREE.Mesh(pump2Geometry, pumpMaterial);
    pump2.position.set(baseX, 1.5, baseZ - 3);
    stationGroup.add(pump2);

    var pump3Geometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
    var pump3 = new THREE.Mesh(pump3Geometry, pumpMaterial);
    pump3.position.set(baseX + 6, 1.5, baseZ - 3);
    stationGroup.add(pump3);

    stationGroup.position.set(baseX, 0, baseZ);
    scene.add(stationGroup);
    structures.push(stationGroup);
  }

  function createRepairWorkshop(scene, baseX, baseZ) {
    var workshopGroup = new THREE.Group();

    var garageGeometry = new THREE.BoxGeometry(10, 5, 4);
    var garageMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var garage = new THREE.Mesh(garageGeometry, garageMaterial);
    garage.position.set(baseX, 2.5, baseZ);
    workshopGroup.add(garage);

    var vehicle1Geometry = new THREE.BoxGeometry(4, 2, 2);
    var vehicleMaterial = new THREE.MeshLambertMaterial({ color: 0x006400 });
    var vehicle1 = new THREE.Mesh(vehicle1Geometry, vehicleMaterial);
    vehicle1.position.set(baseX - 3, 1, baseZ - 1);
    workshopGroup.add(vehicle1);

    var vehicle2Geometry = new THREE.BoxGeometry(4, 2, 2);
    var vehicle2 = new THREE.Mesh(vehicle2Geometry, vehicleMaterial);
    vehicle2.position.set(baseX + 3, 1, baseZ + 1);
    workshopGroup.add(vehicle2);

    workshopGroup.position.set(baseX, 0, baseZ);
    scene.add(workshopGroup);
    structures.push(workshopGroup);
  }

  function createCommunicationMast(scene, baseX, baseZ) {
    var mastGroup = new THREE.Group();

    var mastGeometry = new THREE.CylinderGeometry(0.4, 0.5, 18, 16);
    var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(baseX, 9, baseZ);
    mastGroup.add(mast);

    var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });

    var dish1Geometry = new THREE.SphereGeometry(1.5, 12, 8);
    var dish1 = new THREE.Mesh(dish1Geometry, dishMaterial);
    dish1.position.set(baseX - 2.5, 15, baseZ);
    mastGroup.add(dish1);

    var dish2Geometry = new THREE.SphereGeometry(1.5, 12, 8);
    var dish2 = new THREE.Mesh(dish2Geometry, dishMaterial);
    dish2.position.set(baseX + 2.5, 15, baseZ);
    mastGroup.add(dish2);

    var dish3Geometry = new THREE.SphereGeometry(1.5, 12, 8);
    var dish3 = new THREE.Mesh(dish3Geometry, dishMaterial);
    dish3.position.set(baseX, 15, baseZ + 2.5);
    mastGroup.add(dish3);

    mastGroup.position.set(baseX, 0, baseZ);
    scene.add(mastGroup);
    structures.push(mastGroup);
  }

  function createCasualtyCollectionPoint(scene, baseX, baseZ) {
    var ccpGroup = new THREE.Group();

    var tentGeometry = new THREE.BoxGeometry(8, 3, 6);
    var tentMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFCC });
    var tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.position.set(baseX, 1.5, baseZ);
    ccpGroup.add(tent);

    var markerGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 16);
    var markerMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(baseX, 0.25, baseZ + 6);
    ccpGroup.add(marker);

    ccpGroup.position.set(baseX, 0, baseZ);
    scene.add(ccpGroup);
    structures.push(ccpGroup);
  }

  function initialize(scene) {
    var baseX = 1360;
    var baseZ = 1810;

    createA87Checkpoint(scene, baseX - 50, baseZ - 50);
    createBroadfordBayGunBattery(scene, baseX + 30, baseZ + 60);
    createHotelBarracks(scene, baseX - 40, baseZ + 30);
    createBeinnnaCallachOP(scene, baseX + 60, baseZ - 40);
    createFuelStation(scene, baseX, baseZ);
    createRepairWorkshop(scene, baseX - 60, baseZ - 60);
    createCommunicationMast(scene, baseX + 50, baseZ + 40);
    createCasualtyCollectionPoint(scene, baseX + 20, baseZ - 80);
  }

  function getStructures() {
    return structures;
  }

  return {
    initialize: initialize,
    getStructures: getStructures
  };
}());
