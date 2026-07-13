window.TrotternishFort = (function() {
  'use strict';

  var buildOldManOfStorr = function(scene) {
    var geometry = new THREE.CylinderGeometry(2, 2, 25, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(1400, 12.5, 1870);
    cylinder.rotation.z = 0.15;
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    scene.add(cylinder);
  };

  var buildStorrrockamphitheatre = function(scene) {
    var angles = [0, 60, 120, 180, 240, 300];
    var i;
    for (i = 0; i < angles.length; i++) {
      var angle = angles[i] * Math.PI / 180;
      var x = 1400 + Math.cos(angle) * 30;
      var z = 1870 + Math.sin(angle) * 30;
      var height = 8 + Math.random() * 6;
      var geometry = new THREE.BoxGeometry(3, height, 3);
      var material = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var box = new THREE.Mesh(geometry, material);
      box.position.set(x, height / 2, z);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
    }
  };

  var buildQuiraingutablerock = function(scene) {
    var geometry = new THREE.BoxGeometry(16, 3, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var box = new THREE.Mesh(geometry, material);
    box.position.set(1420, 20, 1900);
    box.castShadow = true;
    box.receiveShadow = true;
    scene.add(box);
  };

  var buildQuiraingneedle = function(scene) {
    var geometry = new THREE.CylinderGeometry(1, 1, 20, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(1380, 10, 1920);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    scene.add(cylinder);
  };

  var buildDuntulmcastle = function(scene) {
    var wallGeometry = new THREE.BoxGeometry(12, 8, 1.5);
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(1440, 4, 1850);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);

    var wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.position.set(1460, 4, 1860);
    wall2.rotation.y = Math.PI / 2;
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    scene.add(wall2);

    var towerGeometry = new THREE.CylinderGeometry(2.5, 2.5, 12, 16);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x383838 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(1450, 6, 1850);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
  };

  var buildFloramacdonaldmemorial = function(scene) {
    var plinthGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 16);
    var plinthMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
    plinth.position.set(1360, 1, 1840);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    scene.add(plinth);

    var figureGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    var figureMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var figure = new THREE.Mesh(figureGeometry, figureMaterial);
    figure.position.set(1360, 3.5, 1840);
    figure.castShadow = true;
    figure.receiveShadow = true;
    scene.add(figure);
  };

  var buildTrotternishridgegunline = function(scene) {
    var positions = [
      [1350, 1880],
      [1375, 1885],
      [1400, 1890],
      [1425, 1885],
      [1450, 1880]
    ];
    var i;
    for (i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var gunGeometry = new THREE.BoxGeometry(4, 2, 3);
      var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      var gun = new THREE.Mesh(gunGeometry, gunMaterial);
      gun.position.set(pos[0], 1, pos[1]);
      gun.castShadow = true;
      gun.receiveShadow = true;
      scene.add(gun);
    }
  };

  var buildUigferrybay = function(scene) {
    var dockGeometry = new THREE.BoxGeometry(20, 1, 8);
    var dockMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.set(1500, 0, 1920);
    dock.castShadow = true;
    dock.receiveShadow = true;
    scene.add(dock);

    var barrierGeometry = new THREE.BoxGeometry(20, 2, 0.5);
    var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0xaa2222 });
    var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.set(1500, 1, 1930);
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    scene.add(barrier);
  };

  var initialize = function(scene) {
    buildOldManOfStorr(scene);
    buildStorrrockamphitheatre(scene);
    buildQuiraingutablerock(scene);
    buildQuiraingneedle(scene);
    buildDuntulmcastle(scene);
    buildFloramacdonaldmemorial(scene);
    buildTrotternishridgegunline(scene);
    buildUigferrybay(scene);
  };

  return {
    initialize: initialize
  };
}());
