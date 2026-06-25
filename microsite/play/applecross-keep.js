var ApplecrossKeep = (function() {
  'use strict';

  var exports = {};

  function buildPass() {
    var group = new THREE.Group();
    var material = new THREE.MeshLambertMaterial({ color: 0x555555 });

    var heights = [0, 40, 80, 120, 160, 200, 240, 280];
    var xOffsets = [0, 15, 30, 15, 0, -15, -30, -15];

    for (var i = 0; i < heights.length; i++) {
      var geometry = new THREE.BoxGeometry(20, 8, 15);
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(xOffsets[i], heights[i], i * 25);
      mesh.rotation.z = Math.atan2(heights[i] - (heights[i - 1] || 0), 25) * 0.3;
      group.add(mesh);
    }

    return group;
  }

  function buildEnclosure() {
    var group = new THREE.Group();
    var material = new THREE.MeshLambertMaterial({ color: 0x667755 });

    var wallHeight = 2;
    var wallThickness = 0.8;
    var sideLength = 14;

    var northGeometry = new THREE.BoxGeometry(sideLength, wallHeight, wallThickness);
    var northMesh = new THREE.Mesh(northGeometry, material);
    northMesh.position.set(0, wallHeight / 2, sideLength / 2);
    group.add(northMesh);

    var southGeometry = new THREE.BoxGeometry(sideLength, wallHeight, wallThickness);
    var southMesh = new THREE.Mesh(southGeometry, material);
    southMesh.position.set(0, wallHeight / 2, -sideLength / 2);
    group.add(southMesh);

    var eastGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, sideLength);
    var eastMesh = new THREE.Mesh(eastGeometry, material);
    eastMesh.position.set(sideLength / 2, wallHeight / 2, 0);
    group.add(eastMesh);

    var westGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, sideLength);
    var westMesh = new THREE.Mesh(westGeometry, material);
    westMesh.position.set(-sideLength / 2, wallHeight / 2, 0);
    group.add(westMesh);

    return group;
  }

  function buildChapel() {
    var group = new THREE.Group();
    var stoneColor = new THREE.MeshLambertMaterial({ color: 0x888877 });

    var wallGeometry = new THREE.BoxGeometry(6, 4, 3);
    var wallMesh = new THREE.Mesh(wallGeometry, stoneColor);
    wallMesh.position.y = 2;
    group.add(wallMesh);

    var towerGeometry = new THREE.CylinderGeometry(1.2, 1.5, 5, 16);
    var towerMesh = new THREE.Mesh(towerGeometry, stoneColor);
    towerMesh.position.set(2.5, 2.5, 1);
    group.add(towerMesh);

    return group;
  }

  function buildCheckpoint() {
    var group = new THREE.Group();
    var metalColor = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var redColor = new THREE.MeshLambertMaterial({ color: 0xCC0000 });

    var barrierGeometry = new THREE.BoxGeometry(12, 1.5, 0.5);
    var barrierMesh = new THREE.Mesh(barrierGeometry, redColor);
    barrierMesh.position.set(0, 1, 0);
    group.add(barrierMesh);

    var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    var post1 = new THREE.Mesh(postGeometry, metalColor);
    post1.position.set(-6, 1.5, 0);
    group.add(post1);

    var post2 = new THREE.Mesh(postGeometry, metalColor);
    post2.position.set(6, 1.5, 0);
    group.add(post2);

    var guardGeometry = new THREE.BoxGeometry(4, 3, 3);
    var guardMesh = new THREE.Mesh(guardGeometry, metalColor);
    guardMesh.position.set(8, 1.5, 0);
    group.add(guardMesh);

    return group;
  }

  function buildGun() {
    var group = new THREE.Group();
    var metalColor = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var brickColor = new THREE.MeshLambertMaterial({ color: 0x996633 });

    var emplacementGeometry = new THREE.BoxGeometry(6, 2, 6);
    var emplacementMesh = new THREE.Mesh(emplacementGeometry, brickColor);
    emplacementMesh.position.y = 1;
    group.add(emplacementMesh);

    var cannonGeometry = new THREE.CylinderGeometry(0.4, 0.5, 8, 12);
    var cannonMesh = new THREE.Mesh(cannonGeometry, metalColor);
    cannonMesh.rotation.z = 0.4;
    cannonMesh.position.set(0, 3, 0);
    group.add(cannonMesh);

    return group;
  }

  function buildLongship() {
    var group = new THREE.Group();
    var woodColor = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var ropeColor = new THREE.MeshLambertMaterial({ color: 0x555555 });

    var hullGeometry = new THREE.BoxGeometry(12, 2, 2);
    var hullMesh = new THREE.Mesh(hullGeometry, woodColor);
    hullMesh.position.y = 1;
    hullMesh.rotation.z = 0.1;
    group.add(hullMesh);

    var mastGeometry = new THREE.CylinderGeometry(0.25, 0.3, 7, 8);
    var mastMesh = new THREE.Mesh(mastGeometry, ropeColor);
    mastMesh.position.set(0, 5.5, 0);
    group.add(mastMesh);

    return group;
  }

  function buildCleits() {
    var group = new THREE.Group();
    var stoneColor = new THREE.MeshLambertMaterial({ color: 0x777755 });

    var positions = [
      [-4, 0, 0],
      [0, 0, 0],
      [4, 0, 0]
    ];

    for (var i = 0; i < positions.length; i++) {
      var hutGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      var hutMesh = new THREE.Mesh(hutGeometry, stoneColor);
      hutMesh.position.set(positions[i][0], positions[i][1] + 1.25, positions[i][2]);
      group.add(hutMesh);
    }

    return group;
  }

  function buildRadar() {
    var group = new THREE.Group();
    var metalColor = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var dishColor = new THREE.MeshLambertMaterial({ color: 0x999999 });

    var mastGeometry = new THREE.CylinderGeometry(0.4, 0.5, 10, 12);
    var mastMesh = new THREE.Mesh(mastGeometry, metalColor);
    mastMesh.position.y = 5;
    group.add(mastMesh);

    var dishGeometry = new THREE.SphereGeometry(2, 16, 12);
    var dishMesh = new THREE.Mesh(dishGeometry, dishColor);
    dishMesh.position.set(0, 10.5, 0);
    dishMesh.scale.set(1, 0.6, 1);
    group.add(dishMesh);

    return group;
  }

  function build() {
    var scene = new THREE.Group();

    var pass = buildPass();
    pass.position.set(1180, 0, 1540);
    scene.add(pass);

    var enclosure = buildEnclosure();
    enclosure.position.set(1180, 0, 1540 + 200);
    scene.add(enclosure);

    var chapel = buildChapel();
    chapel.position.set(1180 + 5, 0, 1540 + 210);
    scene.add(chapel);

    var checkpoint = buildCheckpoint();
    checkpoint.position.set(1180 - 20, 250, 1540 + 100);
    scene.add(checkpoint);

    var gun = buildGun();
    gun.position.set(1180 + 30, 50, 1540 + 180);
    scene.add(gun);

    var longship = buildLongship();
    longship.position.set(1180 - 50, 0, 1540 - 100);
    scene.add(longship);

    var cleits = buildCleits();
    cleits.position.set(1180 - 80, 0, 1540 + 150);
    scene.add(cleits);

    var radar = buildRadar();
    radar.position.set(1180 + 60, 50, 1540 + 200);
    scene.add(radar);

    return scene;
  }

  exports.build = build;

  return exports;
}());
