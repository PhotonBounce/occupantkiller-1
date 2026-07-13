var HelmsFort = (function() {
  'use strict';

  var exports = {};

  function createCastleRuins(scene) {
    var stoneColor = 0x555555;
    var material = new THREE.MeshLambertMaterial({ color: stoneColor });

    var towerGeometry = new THREE.CylinderGeometry(12, 12, 20, 16);
    var tower = new THREE.Mesh(towerGeometry, material);
    tower.position.set(0, 10, 0);
    scene.add(tower);

    var wallGeometry = new THREE.BoxGeometry(25, 8, 3);
    var wall = new THREE.Mesh(wallGeometry, material);
    wall.position.set(10, 4, 15);
    scene.add(wall);

    var wall2Geometry = new THREE.BoxGeometry(3, 8, 20);
    var wall2 = new THREE.Mesh(wall2Geometry, material);
    wall2.position.set(-12, 4, 5);
    scene.add(wall2);
  }

  function createClearanceVillage(scene) {
    var stoneColor = 0x666666;
    var material = new THREE.MeshLambertMaterial({ color: stoneColor });

    var cottagePositions = [
      [-15, 0, -20],
      [-5, 0, -20],
      [5, 0, -20],
      [15, 0, -20]
    ];

    var i;
    for (i = 0; i < cottagePositions.length; i++) {
      var pos = cottagePositions[i];
      var cottageGeometry = new THREE.BoxGeometry(6, 5, 8);
      var cottage = new THREE.Mesh(cottageGeometry, material);
      cottage.position.set(pos[0], pos[1] + 2.5, pos[2]);
      scene.add(cottage);

      var roofGeometry = new THREE.ConeGeometry(4, 3, 4);
      var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      var roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(pos[0], pos[1] + 6, pos[2]);
      scene.add(roof);
    }
  }

  function createGoldRushStation(scene) {
    var materialBrown = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var materialMetal = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });

    var creekGeometry = new THREE.BoxGeometry(30, 2, 10);
    var creek = new THREE.Mesh(creekGeometry, materialBrown);
    creek.position.set(0, 0.2, 35);
    scene.add(creek);

    var sluiceGeometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
    var sluice = new THREE.Mesh(sluiceGeometry, materialMetal);
    sluice.rotation.z = Math.PI / 4;
    sluice.position.set(8, 3, 35);
    scene.add(sluice);

    var shackGeometry = new THREE.BoxGeometry(8, 6, 6);
    var shack = new THREE.Mesh(shackGeometry, materialBrown);
    shack.position.set(-12, 3, 38);
    scene.add(shack);
  }

  function createEstuaryWall(scene) {
    var wallColor = 0x444444;
    var material = new THREE.MeshLambertMaterial({ color: wallColor });

    var seaWallGeometry = new THREE.BoxGeometry(50, 6, 2);
    var seaWall = new THREE.Mesh(seaWallGeometry, material);
    seaWall.position.set(0, 3, 50);
    scene.add(seaWall);

    var gunPost1Geometry = new THREE.CylinderGeometry(2, 2, 8, 12);
    var gunPost1 = new THREE.Mesh(gunPost1Geometry, material);
    gunPost1.position.set(-20, 4, 50);
    scene.add(gunPost1);

    var gunPost2Geometry = new THREE.CylinderGeometry(2, 2, 8, 12);
    var gunPost2 = new THREE.Mesh(gunPost2Geometry, material);
    gunPost2.position.set(20, 4, 50);
    scene.add(gunPost2);
  }

  function createFishingHarbour(scene) {
    var woodColor = 0x8B6914;
    var woodMaterial = new THREE.MeshLambertMaterial({ color: woodColor });
    var hullColor = 0x2F4F4F;
    var hullMaterial = new THREE.MeshLambertMaterial({ color: hullColor });

    var pierGeometry = new THREE.BoxGeometry(25, 2, 8);
    var pier = new THREE.Mesh(pierGeometry, woodMaterial);
    pier.position.set(0, 0.5, -30);
    scene.add(pier);

    var boat1Geometry = new THREE.BoxGeometry(8, 3, 4);
    var boat1 = new THREE.Mesh(boat1Geometry, hullMaterial);
    boat1.position.set(-8, 2.5, -28);
    scene.add(boat1);

    var boat2Geometry = new THREE.BoxGeometry(8, 3, 4);
    var boat2 = new THREE.Mesh(boat2Geometry, hullMaterial);
    boat2.position.set(8, 2.5, -28);
    scene.add(boat2);
  }

  function createViaduct(scene) {
    var archColor = 0x666666;
    var deckColor = 0x555555;
    var archMaterial = new THREE.MeshLambertMaterial({ color: archColor });
    var deckMaterial = new THREE.MeshLambertMaterial({ color: deckColor });

    var archPositions = [
      -20,
      -10,
      0,
      10,
      20
    ];

    var i;
    for (i = 0; i < archPositions.length; i++) {
      var xPos = archPositions[i];
      var archGeometry = new THREE.CylinderGeometry(4, 4, 2, 12);
      var arch = new THREE.Mesh(archGeometry, archMaterial);
      arch.position.set(xPos, 8, -45);
      scene.add(arch);
    }

    var deckGeometry = new THREE.BoxGeometry(45, 2, 6);
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(0, 12, -45);
    scene.add(deck);
  }

  function createCheckpoint(scene) {
    var barrierColor = 0x333333;
    var barrierMaterial = new THREE.MeshLambertMaterial({ color: barrierColor });

    var barrierGeometry = new THREE.BoxGeometry(30, 4, 2);
    var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.set(0, 2, -60);
    scene.add(barrier);

    var post1Geometry = new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
    var post1 = new THREE.Mesh(post1Geometry, barrierMaterial);
    post1.position.set(-18, 2, -60);
    scene.add(post1);

    var post2Geometry = new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
    var post2 = new THREE.Mesh(post2Geometry, barrierMaterial);
    post2.position.set(18, 2, -60);
    scene.add(post2);
  }

  function createBeaconTower(scene) {
    var mastColor = 0x444444;
    var lampColor = 0xFFFF00;
    var mastMaterial = new THREE.MeshLambertMaterial({ color: mastColor });
    var lampMaterial = new THREE.MeshLambertMaterial({ color: lampColor });

    var mastGeometry = new THREE.CylinderGeometry(1, 1, 30, 12);
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(-30, 15, 0);
    scene.add(mast);

    var lampGeometry = new THREE.SphereGeometry(2, 16, 16);
    var lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.set(-30, 32, 0);
    scene.add(lamp);
  }

  function build(scene) {
    var baseX = 920;
    var baseZ = 1150;

    var group = new THREE.Group();
    group.position.set(baseX, 0, baseZ);

    var tempScene = new THREE.Scene();

    createCastleRuins(tempScene);
    createClearanceVillage(tempScene);
    createGoldRushStation(tempScene);
    createEstuaryWall(tempScene);
    createFishingHarbour(tempScene);
    createViaduct(tempScene);
    createCheckpoint(tempScene);
    createBeaconTower(tempScene);

    var i;
    var children = tempScene.children.slice();
    for (i = 0; i < children.length; i++) {
      group.add(children[i]);
    }

    scene.add(group);

    return group;
  }

  exports.build = build;

  return exports;
}());
