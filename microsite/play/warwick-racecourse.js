window.WarwickRacecourse = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var rootGroup = null;
  var OFFSET_X = 15880;
  var OFFSET_Z = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
  }

  function buildGrandstand() {
    var group = new THREE.Group();

    var mainMat = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
    var mainGeo = new THREE.BoxGeometry(60, 20, 12);
    var mainMesh = new THREE.Mesh(mainGeo, mainMat);
    mainMesh.position.set(0, 10, 0);
    group.add(mainMesh);

    var seatMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    var stepOffsets = [0, 4, 8, 12];
    for (var i = 0; i < 4; i++) {
      var seatGeo = new THREE.BoxGeometry(15, 2, 4);
      var seatMesh = new THREE.Mesh(seatGeo, seatMat);
      seatMesh.position.set(-22.5 + i * 15, 2 + i * 2, -6);
      group.add(seatMesh);
    }

    group.position.set(0, 0, -20);
    return group;
  }

  function buildTrackRail() {
    var group = new THREE.Group();
    var railMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

    for (var i = 0; i < 3; i++) {
      var railGeo = new THREE.BoxGeometry(60, 1, 1);
      var railMesh = new THREE.Mesh(railGeo, railMat);
      railMesh.position.set(0, 0.5, i * 2);
      group.add(railMesh);
    }

    for (var j = 0; j < 10; j++) {
      var postGeo = new THREE.BoxGeometry(0.5, 4, 0.5);
      var postMesh = new THREE.Mesh(postGeo, railMat);
      postMesh.position.set(-27 + j * 6, 2, 2);
      group.add(postMesh);
    }

    group.position.set(0, 0, 10);
    return group;
  }

  function buildWinningPost() {
    var group = new THREE.Group();
    var postMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var bannerMat = new THREE.MeshLambertMaterial({ color: 0xCC0000 });

    var leftGeo = new THREE.BoxGeometry(1, 16, 1);
    var leftMesh = new THREE.Mesh(leftGeo, postMat);
    leftMesh.position.set(-15, 8, 0);
    group.add(leftMesh);

    var rightGeo = new THREE.BoxGeometry(1, 16, 1);
    var rightMesh = new THREE.Mesh(rightGeo, postMat);
    rightMesh.position.set(15, 8, 0);
    group.add(rightMesh);

    var spanGeo = new THREE.BoxGeometry(30, 1, 1);
    var spanMesh = new THREE.Mesh(spanGeo, postMat);
    spanMesh.position.set(0, 16, 0);
    group.add(spanMesh);

    var bannerGeo = new THREE.BoxGeometry(30, 4, 0.3);
    var bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(0, 13.5, 0);
    group.add(bannerMesh);

    group.position.set(0, 0, 15);
    return group;
  }

  function buildParadeRing() {
    var group = new THREE.Group();
    var turfMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var fenceMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

    var ringGeo = new THREE.CylinderGeometry(18, 18, 1, 16);
    var ringMesh = new THREE.Mesh(ringGeo, turfMat);
    ringMesh.position.set(0, 0.5, 0);
    group.add(ringMesh);

    var numPosts = 12;
    for (var i = 0; i < numPosts; i++) {
      var angle = (i / numPosts) * Math.PI * 2;
      var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
      var postMesh = new THREE.Mesh(postGeo, fenceMat);
      postMesh.position.set(Math.cos(angle) * 18, 3, Math.sin(angle) * 18);
      group.add(postMesh);
    }

    group.position.set(-40, 0, 30);
    return group;
  }

  function buildCastleBackdrop() {
    var group = new THREE.Group();
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x808080 });

    var tower1Geo = new THREE.BoxGeometry(6, 20, 6);
    var tower1Mesh = new THREE.Mesh(tower1Geo, stoneMat);
    tower1Mesh.position.set(-18, 10, 0);
    group.add(tower1Mesh);

    var tower2Geo = new THREE.BoxGeometry(4, 24, 4);
    var tower2Mesh = new THREE.Mesh(tower2Geo, stoneMat);
    tower2Mesh.position.set(0, 12, 0);
    group.add(tower2Mesh);

    var tower3Geo = new THREE.BoxGeometry(8, 18, 8);
    var tower3Mesh = new THREE.Mesh(tower3Geo, stoneMat);
    tower3Mesh.position.set(18, 9, 0);
    group.add(tower3Mesh);

    var wall1Geo = new THREE.BoxGeometry(12, 20, 2);
    var wall1Mesh = new THREE.Mesh(wall1Geo, wallMat);
    wall1Mesh.position.set(-9, 10, 0);
    group.add(wall1Mesh);

    var wall2Geo = new THREE.BoxGeometry(12, 20, 2);
    var wall2Mesh = new THREE.Mesh(wall2Geo, wallMat);
    wall2Mesh.position.set(9, 10, 0);
    group.add(wall2Mesh);

    group.position.set(0, 0, -60);
    return group;
  }

  function buildMarketTown() {
    var group = new THREE.Group();
    var cobbleMat = new THREE.MeshLambertMaterial({ color: 0xD4C5A9 });
    var timberMat = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
    var stripMat = new THREE.MeshLambertMaterial({ color: 0x3B2507 });

    var squareGeo = new THREE.BoxGeometry(12, 0.5, 12);
    var squareMesh = new THREE.Mesh(squareGeo, cobbleMat);
    squareMesh.position.set(0, 0.25, 0);
    group.add(squareMesh);

    var buildingPositions = [
      [10, 5, 0],
      [-10, 5, 0],
      [0, 5, 10],
      [0, 5, -10]
    ];

    for (var i = 0; i < 4; i++) {
      var bldGeo = new THREE.BoxGeometry(8, 10, 6);
      var bldMesh = new THREE.Mesh(bldGeo, timberMat);
      bldMesh.position.set(buildingPositions[i][0], buildingPositions[i][1], buildingPositions[i][2]);
      group.add(bldMesh);

      var stripGeo = new THREE.BoxGeometry(1, 10, 0.5);
      var stripMesh = new THREE.Mesh(stripGeo, stripMat);
      stripMesh.position.set(buildingPositions[i][0] - 2, buildingPositions[i][1], buildingPositions[i][2] + 3.1);
      group.add(stripMesh);

      var stripGeo2 = new THREE.BoxGeometry(1, 10, 0.5);
      var stripMesh2 = new THREE.Mesh(stripGeo2, stripMat);
      stripMesh2.position.set(buildingPositions[i][0] + 2, buildingPositions[i][1], buildingPositions[i][2] + 3.1);
      group.add(stripMesh2);
    }

    group.position.set(50, 0, -30);
    return group;
  }

  function buildChurchTower() {
    var group = new THREE.Group();
    var limestoneMat = new THREE.MeshLambertMaterial({ color: 0xC4B59A });
    var clockMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

    var towerGeo = new THREE.BoxGeometry(6, 30, 6);
    var towerMesh = new THREE.Mesh(towerGeo, limestoneMat);
    towerMesh.position.set(0, 15, 0);
    group.add(towerMesh);

    var pinnacleOffsets = [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2]
    ];

    for (var i = 0; i < 4; i++) {
      var pinGeo = new THREE.BoxGeometry(2, 6, 2);
      var pinMesh = new THREE.Mesh(pinGeo, limestoneMat);
      pinMesh.position.set(pinnacleOffsets[i][0] * 1.5, 33, pinnacleOffsets[i][1] * 1.5);
      group.add(pinMesh);
    }

    var clockGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 16);
    var clockMesh = new THREE.Mesh(clockGeo, clockMat);
    clockMesh.rotation.x = Math.PI / 2;
    clockMesh.position.set(0, 22, 3.1);
    group.add(clockMesh);

    group.position.set(70, 0, -10);
    return group;
  }

  function buildCanalTowpath() {
    var group = new THREE.Group();
    var dirtMat = new THREE.MeshLambertMaterial({ color: 0xA0785A });
    var boatMat = new THREE.MeshLambertMaterial({ color: 0x1C5C9E });

    for (var i = 0; i < 8; i++) {
      var pathGeo = new THREE.BoxGeometry(4, 0.5, 12);
      var pathMesh = new THREE.Mesh(pathGeo, dirtMat);
      pathMesh.position.set(0, 0.25, i * 12 - 42);
      group.add(pathMesh);
    }

    var boatGeo = new THREE.BoxGeometry(3, 3, 14);
    var boatMesh = new THREE.Mesh(boatGeo, boatMat);
    boatMesh.position.set(4, 1.5, 0);
    group.add(boatMesh);

    group.position.set(-70, 0, 0);
    return group;
  }

  function build() {
    rootGroup = new THREE.Group();
    rootGroup.position.set(OFFSET_X, 0, OFFSET_Z);

    rootGroup.add(buildGrandstand());
    rootGroup.add(buildTrackRail());
    rootGroup.add(buildWinningPost());
    rootGroup.add(buildParadeRing());
    rootGroup.add(buildCastleBackdrop());
    rootGroup.add(buildMarketTown());
    rootGroup.add(buildChurchTower());
    rootGroup.add(buildCanalTowpath());

    scene.add(rootGroup);
  }

  function update(delta) {
  }

  function reset() {
    if (rootGroup) {
      scene.remove(rootGroup);
      rootGroup = null;
    }
  }

  return {
    init: init,
    build: build,
    update: update,
    reset: reset
  };

}());
