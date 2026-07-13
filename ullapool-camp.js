window.UllapoolCamp = (function() {
  'use strict';

  var structures = [];
  var worldX = 1120;
  var worldZ = 1450;

  function ferry() {
    var group = new THREE.Group();
    group.position.set(worldX - 100, 0, worldZ);

    var hullGeom = new THREE.BoxGeometry(20, 4, 5);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.y = 2;
    group.add(hull);

    var superGeom = new THREE.BoxGeometry(12, 6, 4);
    var superMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var superstructure = new THREE.Mesh(superGeom, superMat);
    superstructure.position.set(0, 7, -0.5);
    group.add(superstructure);

    var funnelGeom = new THREE.CylinderGeometry(1.5, 1.8, 8, 16);
    var funnelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var funnel = new THREE.Mesh(funnelGeom, funnelMat);
    funnel.position.set(2, 13, -1);
    group.add(funnel);

    return group;
  }

  function pier() {
    var group = new THREE.Group();
    group.position.set(worldX + 50, 0, worldZ + 80);

    var pierGeom = new THREE.BoxGeometry(30, 2, 6);
    var pierMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var pierDeck = new THREE.Mesh(pierGeom, pierMat);
    pierDeck.position.y = 1;
    group.add(pierDeck);

    var lampGeom = new THREE.CylinderGeometry(0.4, 0.4, 12, 8);
    var lampMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var lamp1 = new THREE.Mesh(lampGeom, lampMat);
    lamp1.position.set(-10, 7, 0);
    group.add(lamp1);

    var lamp2 = new THREE.Mesh(lampGeom, lampMat);
    lamp2.position.set(0, 7, 0);
    group.add(lamp2);

    var lamp3 = new THREE.Mesh(lampGeom, lampMat);
    lamp3.position.set(10, 7, 0);
    group.add(lamp3);

    return group;
  }

  function barrage() {
    var group = new THREE.Group();
    group.position.set(worldX, 0, worldZ + 200);

    var chainPoints = [
      new THREE.Vector3(-50, 8, 0),
      new THREE.Vector3(-30, 6, 0),
      new THREE.Vector3(-10, 5, 0),
      new THREE.Vector3(10, 5, 0),
      new THREE.Vector3(30, 6, 0),
      new THREE.Vector3(50, 8, 0)
    ];
    var chainGeom = new THREE.BufferGeometry().setFromPoints(chainPoints);
    var chainMat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    var chain = new THREE.LineSegments(chainGeom, chainMat);
    group.add(chain);

    var boomGeom = new THREE.BoxGeometry(100, 2, 1);
    var boomMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var boom = new THREE.Mesh(boomGeom, boomMat);
    boom.position.y = 5;
    group.add(boom);

    return group;
  }

  function village() {
    var group = new THREE.Group();
    group.position.set(worldX - 200, 0, worldZ - 150);

    var houseGeom = new THREE.BoxGeometry(8, 6, 6);
    var houseMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F5 });

    var positions = [
      [-20, 0, -20],
      [20, 0, -20],
      [-20, 0, 20],
      [20, 0, 20]
    ];

    var i = 0;
    while (i < positions.length) {
      var house = new THREE.Mesh(houseGeom, houseMat);
      house.position.set(positions[i][0], 3, positions[i][2]);
      group.add(house);
      i = i + 1;
    }

    return group;
  }

  function checkpoint() {
    var group = new THREE.Group();
    group.position.set(worldX + 150, 0, worldZ - 100);

    var barrierGeom = new THREE.BoxGeometry(15, 2, 0.5);
    var barrierMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var barrier = new THREE.Mesh(barrierGeom, barrierMat);
    barrier.position.set(0, 1, 0);
    group.add(barrier);

    var officeGeom = new THREE.BoxGeometry(8, 4, 5);
    var officeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var office = new THREE.Mesh(officeGeom, officeMat);
    office.position.set(0, 2, -8);
    group.add(office);

    var boothGeom = new THREE.BoxGeometry(4, 5, 3);
    var boothMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    var booth = new THREE.Mesh(boothGeom, boothMat);
    booth.position.set(10, 2.5, -8);
    group.add(booth);

    return group;
  }

  function platform() {
    var group = new THREE.Group();
    group.position.set(worldX - 400, 50, worldZ + 100);

    var platformGeom = new THREE.BoxGeometry(25, 2, 20);
    var platformMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var platformMesh = new THREE.Mesh(platformGeom, platformMat);
    platformMesh.position.y = 1;
    group.add(platformMesh);

    var howitzerGeom = new THREE.CylinderGeometry(1, 1.2, 10, 8);
    var howitzerMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var howitzer = new THREE.Mesh(howitzerGeom, howitzerMat);
    howitzer.position.set(0, 6, 0);
    howitzer.rotation.z = 0.3;
    group.add(howitzer);

    return group;
  }

  function radar() {
    var group = new THREE.Group();
    group.position.set(worldX + 300, 0, worldZ - 200);

    var mastGeom = new THREE.CylinderGeometry(1, 1, 35, 8);
    var mastMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.y = 17.5;
    group.add(mast);

    var dishGeom = new THREE.SphereGeometry(3, 8, 6);
    var dishMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var dish = new THREE.Mesh(dishGeom, dishMat);
    dish.position.set(-3, 32, 0);
    group.add(dish);

    return group;
  }

  function shed() {
    var group = new THREE.Group();
    group.position.set(worldX - 250, 0, worldZ + 150);

    var shedGeom = new THREE.BoxGeometry(8, 3, 4);
    var shedMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var shedMesh = new THREE.Mesh(shedGeom, shedMat);
    shedMesh.position.y = 1.5;
    group.add(shedMesh);

    var chimneyGeom = new THREE.CylinderGeometry(1.2, 1.4, 8, 12);
    var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
    chimney.position.set(2, 6, 0);
    group.add(chimney);

    return group;
  }

  function build() {
    structures.push(ferry());
    structures.push(pier());
    structures.push(barrage());
    structures.push(village());
    structures.push(checkpoint());
    structures.push(platform());
    structures.push(radar());
    structures.push(shed());
  }

  function scene() {
    var group = new THREE.Group();
    var i = 0;
    while (i < structures.length) {
      group.add(structures[i]);
      i = i + 1;
    }
    return group;
  }

  function init() {
    build();
  }

  return {
    init: init,
    scene: scene
  };

}());
