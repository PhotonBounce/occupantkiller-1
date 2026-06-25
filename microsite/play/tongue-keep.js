window.TongueKeep = (function() {
  'use strict';

  var baseX = 1020;
  var baseZ = 1300;

  function createCastleVarrichTower(scene) {
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var moundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    var moundGeometry = new THREE.BoxGeometry(12, 3, 12);
    var mound = new THREE.Mesh(moundGeometry, moundMaterial);
    mound.position.set(baseX, 0, baseZ);
    scene.add(mound);

    var towerGeometry = new THREE.CylinderGeometry(4, 4, 14, 32);
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(baseX, 8.5, baseZ);
    tower.castShadow = true;
    scene.add(tower);
  }

  function createKyleOfTongueCauseway(scene) {
    var roadMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

    var roadSegmentCount = 6;
    var segmentLength = 8;

    for (var i = 0; i < roadSegmentCount; i++) {
      var roadGeometry = new THREE.BoxGeometry(segmentLength, 1, 3);
      var road = new THREE.Mesh(roadGeometry, roadMaterial);
      road.position.set(baseX - 40 + i * segmentLength, 2, baseZ + 25);
      scene.add(road);

      var pillarGeometry = new THREE.CylinderGeometry(0.8, 1.2, 4, 16);
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(baseX - 40 + i * segmentLength, 0, baseZ + 25);
      scene.add(pillar);
    }
  }

  function createVillageChurchFortification(scene) {
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });

    var naveGeometry = new THREE.BoxGeometry(6, 8, 12);
    var nave = new THREE.Mesh(naveGeometry, stoneMaterial);
    nave.position.set(baseX - 50, 4, baseZ - 30);
    scene.add(nave);

    var towerGeometry = new THREE.CylinderGeometry(2.5, 2.5, 10, 24);
    var tower = new THREE.Mesh(towerGeometry, stoneMaterial);
    tower.position.set(baseX - 50, 5, baseZ - 22);
    scene.add(tower);
  }

  function createNorseMeadHall(scene) {
    var timberMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6914 });

    var hallGeometry = new THREE.BoxGeometry(14, 4, 4);
    var hall = new THREE.Mesh(hallGeometry, timberMaterial);
    hall.position.set(baseX + 35, 2, baseZ - 25);
    hall.castShadow = true;
    scene.add(hall);

    var roofGeometry = new THREE.ConeGeometry(8, 3, 32);
    var roof = new THREE.Mesh(roofGeometry, timberMaterial);
    roof.position.set(baseX + 35, 5.5, baseZ - 25);
    scene.add(roof);
  }

  function createSeaLochFishingStation(scene) {
    var dockMaterial = new THREE.MeshLambertMaterial({ color: 0x996633 });
    var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    var dockGeometry = new THREE.BoxGeometry(10, 1, 6);
    var dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.set(baseX - 25, 1, baseZ + 40);
    scene.add(dock);

    var boat1Geometry = new THREE.BoxGeometry(4, 2, 1.5);
    var boat1 = new THREE.Mesh(boat1Geometry, hullMaterial);
    boat1.position.set(baseX - 30, 2.5, baseZ + 38);
    scene.add(boat1);

    var boat2Geometry = new THREE.BoxGeometry(4, 2, 1.5);
    var boat2 = new THREE.Mesh(boat2Geometry, hullMaterial);
    boat2.position.set(baseX - 20, 2.5, baseZ + 42);
    scene.add(boat2);
  }

  function createMountainLookout(scene) {
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var ridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });

    var ridgeGeometry = new THREE.BoxGeometry(20, 2, 8);
    var ridge = new THREE.Mesh(ridgeGeometry, ridgeMaterial);
    ridge.position.set(baseX + 60, 3, baseZ - 50);
    scene.add(ridge);

    var watchtowerGeometry = new THREE.CylinderGeometry(1.5, 1.8, 8, 20);
    var watchtower = new THREE.Mesh(watchtowerGeometry, stoneMaterial);
    watchtower.position.set(baseX + 60, 7, baseZ - 50);
    watchtower.castShadow = true;
    scene.add(watchtower);
  }

  function createDefensiveEarthMound(scene) {
    var earthMaterial = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var moundGeometry = new THREE.BoxGeometry(16, 4, 16);
    var mound = new THREE.Mesh(moundGeometry, earthMaterial);
    mound.position.set(baseX - 70, 2, baseZ + 20);
    scene.add(mound);

    var wallHeight = 2.5;
    var wallThickness = 0.8;

    var wall1Geometry = new THREE.BoxGeometry(16, wallHeight, wallThickness);
    var wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall1.position.set(baseX - 70, 6, baseZ + 25);
    scene.add(wall1);

    var wall2Geometry = new THREE.BoxGeometry(wallThickness, wallHeight, 14);
    var wall2 = new THREE.Mesh(wall2Geometry, wallMaterial);
    wall2.position.set(baseX - 78, 6, baseZ + 20);
    scene.add(wall2);

    var wall3Geometry = new THREE.BoxGeometry(wallThickness, wallHeight, 14);
    var wall3 = new THREE.Mesh(wall3Geometry, wallMaterial);
    wall3.position.set(baseX - 62, 6, baseZ + 20);
    scene.add(wall3);
  }

  function createSupplyKayakRack(scene) {
    var frameMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

    var rackCount = 5;

    for (var i = 0; i < rackCount; i++) {
      var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 12);
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(baseX + 30 + i * 2.5, 1.5, baseZ - 60);
      scene.add(post);

      var frameGeometry = new THREE.BoxGeometry(0.2, 1.5, 1.2);
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(baseX + 30 + i * 2.5, 3, baseZ - 60);
      scene.add(frame);
    }
  }

  function init(scene) {
    createCastleVarrichTower(scene);
    createKyleOfTongueCauseway(scene);
    createVillageChurchFortification(scene);
    createNorseMeadHall(scene);
    createSeaLochFishingStation(scene);
    createMountainLookout(scene);
    createDefensiveEarthMound(scene);
    createSupplyKayakRack(scene);
  }

  return {
    init: init
  };
}());
