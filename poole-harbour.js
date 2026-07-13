(function (window) {
  'use strict';

  function harbour(scene, THREE) {
    var ox = 7400;
    var oz = 0;

    // 1. Poole Harbour water
    var waterGeo = new THREE.BoxGeometry(80, 0.3, 40);
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x336688 });
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(ox + 0, 0, oz + 0);
    scene.add(water);

    // 2. Brownsea Island
    var islandGeo = new THREE.BoxGeometry(30, 0.3, 20);
    var islandMat = new THREE.MeshLambertMaterial({ color: 0x4A7C40 });
    var island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(ox + 0, 0.3, oz - 5);
    scene.add(island);

    var treeMat = new THREE.MeshLambertMaterial({ color: 0x2D6A1A });
    var treePositions = [
      [-10, -7], [-6, -8], [-2, -8], [2, -8], [6, -8],
      [10, -7], [-8, -3], [0, -3], [8, -3], [-4, 2]
    ];
    for (var t = 0; t < treePositions.length; t++) {
      var treeGeo = new THREE.SphereGeometry(2, 8, 6);
      var tree = new THREE.Mesh(treeGeo, treeMat);
      tree.position.set(ox + treePositions[t][0], 2.45, oz + treePositions[t][1]);
      scene.add(tree);
    }

    var castleGeo = new THREE.BoxGeometry(15, 8, 6);
    var castleMat = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    var castle = new THREE.Mesh(castleGeo, castleMat);
    castle.position.set(ox + 4, 4.45, oz + 4);
    scene.add(castle);

    // 3. Chain Ferry
    var ferryMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
    var ferryGeo = new THREE.BoxGeometry(15, 1, 8);
    var ferry = new THREE.Mesh(ferryGeo, ferryMat);
    ferry.position.set(ox + 32, 0.65, oz + 0);
    scene.add(ferry);

    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x554422 });
    var wheel1Geo = new THREE.CylinderGeometry(1, 1, 1, 12);
    var wheel1 = new THREE.Mesh(wheel1Geo, wheelMat);
    wheel1.position.set(ox + 25, 0.85, oz + 0);
    scene.add(wheel1);

    var wheel2Geo = new THREE.CylinderGeometry(1, 1, 1, 12);
    var wheel2 = new THREE.Mesh(wheel2Geo, wheelMat);
    wheel2.position.set(ox + 39, 0.85, oz + 0);
    scene.add(wheel2);

    // 4. Poole Old Town quay — 10 historic warehouse buildings
    var brickMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
    for (var w = 0; w < 10; w++) {
      var warehouseGeo = new THREE.BoxGeometry(8, 6, 7);
      var warehouse = new THREE.Mesh(warehouseGeo, brickMat);
      warehouse.position.set(ox - 38 + w * 9, 3.15, oz + 16);
      scene.add(warehouse);
    }

    // 5. Poole Guildhall
    var guildhallGeo = new THREE.BoxGeometry(15, 12, 7);
    var guildhallMat = new THREE.MeshLambertMaterial({ color: 0xD4C9A8 });
    var guildhall = new THREE.Mesh(guildhallGeo, guildhallMat);
    guildhall.position.set(ox - 20, 6.15, oz + 22);
    scene.add(guildhall);

    // 6. Sandbanks peninsula — 6 luxury beach houses
    var houseMat = new THREE.MeshLambertMaterial({ color: 0xF8F8F8 });
    for (var h = 0; h < 6; h++) {
      var houseGeo = new THREE.BoxGeometry(12, 10, 7);
      var house = new THREE.Mesh(houseGeo, houseMat);
      house.position.set(ox + 28 + h * 14, 5.15, oz + 16);
      scene.add(house);
    }

    // 7. Pottery Pier — Poole Pottery factory
    var potteryGeo = new THREE.BoxGeometry(30, 20, 8);
    var potteryMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
    var pottery = new THREE.Mesh(potteryGeo, potteryMat);
    pottery.position.set(ox - 5, 10.15, oz + 27);
    scene.add(pottery);

    // 8. Power station — 2 cooling towers + 2 chimneys
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x888880 });
    var tower1Geo = new THREE.CylinderGeometry(8, 8, 20, 16);
    var tower1 = new THREE.Mesh(tower1Geo, towerMat);
    tower1.position.set(ox - 28, 10.15, oz + 28);
    scene.add(tower1);

    var tower2Geo = new THREE.CylinderGeometry(8, 8, 20, 16);
    var tower2 = new THREE.Mesh(tower2Geo, towerMat);
    tower2.position.set(ox - 14, 10.15, oz + 28);
    scene.add(tower2);

    var chimney1Geo = new THREE.CylinderGeometry(3, 3, 25, 10);
    var chimney1 = new THREE.Mesh(chimney1Geo, towerMat);
    chimney1.position.set(ox - 34, 12.65, oz + 34);
    scene.add(chimney1);

    var chimney2Geo = new THREE.CylinderGeometry(3, 3, 25, 10);
    var chimney2 = new THREE.Mesh(chimney2Geo, towerMat);
    chimney2.position.set(ox - 8, 12.65, oz + 34);
    scene.add(chimney2);

    // 9. Lifeboat station RNLI
    var rnliGeo = new THREE.BoxGeometry(12, 8, 5);
    var rnliMat = new THREE.MeshLambertMaterial({ color: 0x003399 });
    var rnli = new THREE.Mesh(rnliGeo, rnliMat);
    rnli.position.set(ox + 15, 4.15, oz + 20);
    scene.add(rnli);
  }

  window.PooleHarbour = { harbour: harbour };

}(window));
