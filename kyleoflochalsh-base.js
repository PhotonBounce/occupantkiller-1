window.KyleOfLochalshBase = (function() {
  'use strict';

  var worldOriginX = 1220;
  var worldOriginZ = 1600;
  var structures = [];

  function skybridgeSpan() {
    var group = new THREE.Group();

    var bridgeGeometry = new THREE.BoxGeometry(40, 2, 3);
    var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var bridgeMesh = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridgeMesh.position.y = 8;
    group.add(bridgeMesh);

    var towerGeometry = new THREE.CylinderGeometry(1.5, 1.5, 14, 16);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    var towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
    towerMesh.position.set(0, 7, 0);
    group.add(towerMesh);

    group.position.set(worldOriginX, 0, worldOriginZ);
    structures.push(group);
    return group;
  }

  function fortification() {
    var group = new THREE.Group();

    var checkpointGeometry = new THREE.BoxGeometry(8, 4, 6);
    var checkpointMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var checkpointMesh = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
    checkpointMesh.position.set(0, 2, 0);
    group.add(checkpointMesh);

    var towerGeometry = new THREE.CylinderGeometry(1, 1, 6, 12);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var leftTower = new THREE.Mesh(towerGeometry, towerMaterial);
    leftTower.position.set(-5, 3, 0);
    group.add(leftTower);

    var rightTower = new THREE.Mesh(towerGeometry, towerMaterial);
    rightTower.position.set(5, 3, 0);
    group.add(rightTower);

    group.position.set(worldOriginX - 25, 0, worldOriginZ + 15);
    structures.push(group);
    return group;
  }

  function eileandonancastle() {
    var group = new THREE.Group();

    var plinthGeometry = new THREE.CylinderGeometry(6, 7, 3, 24);
    var plinthMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var plinthMesh = new THREE.Mesh(plinthGeometry, plinthMaterial);
    plinthMesh.position.y = 1.5;
    group.add(plinthMesh);

    var keepGeometry = new THREE.BoxGeometry(8, 6, 6);
    var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x666600 });
    var keepMesh = new THREE.Mesh(keepGeometry, keepMaterial);
    keepMesh.position.y = 6;
    group.add(keepMesh);

    group.position.set(worldOriginX - 50, 0, worldOriginZ - 60);
    structures.push(group);
    return group;
  }

  function castlecauseway() {
    var group = new THREE.Group();

    var causeGeometry = new THREE.BoxGeometry(12, 1.5, 2.5);
    var causeMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var causeMesh = new THREE.Mesh(causeGeometry, causeMaterial);
    causeMesh.position.y = 0.75;
    group.add(causeMesh);

    group.position.set(worldOriginX - 35, 0, worldOriginZ - 55);
    structures.push(group);
    return group;
  }

  function kyleferryterminal() {
    var group = new THREE.Group();

    var buildingGeometry = new THREE.BoxGeometry(12, 5, 10);
    var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x993333 });
    var buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    buildingMesh.position.set(0, 2.5, 0);
    group.add(buildingMesh);

    var rampGeometry = new THREE.BoxGeometry(8, 1, 6);
    var rampMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var rampMesh = new THREE.Mesh(rampGeometry, rampMaterial);
    rampMesh.position.set(0, 0.5, 8);
    group.add(rampMesh);

    group.position.set(worldOriginX + 35, 0, worldOriginZ + 40);
    structures.push(group);
    return group;
  }

  function railwayterminus() {
    var group = new THREE.Group();

    var stationGeometry = new THREE.BoxGeometry(15, 4, 8);
    var stationMaterial = new THREE.MeshLambertMaterial({ color: 0xcc9900 });
    var stationMesh = new THREE.Mesh(stationGeometry, stationMaterial);
    stationMesh.position.set(0, 2, 0);
    group.add(stationMesh);

    var signalGeometry = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
    var signalMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var signalMesh = new THREE.Mesh(signalGeometry, signalMaterial);
    signalMesh.position.set(10, 5, 0);
    group.add(signalMesh);

    group.position.set(worldOriginX + 50, 0, worldOriginZ - 35);
    structures.push(group);
    return group;
  }

  function sealochnets() {
    var group = new THREE.Group();

    var lineCount = 6;
    var netMaterial = new THREE.LineBasicMaterial({ color: 0x003366 });

    var i = 0;
    while (i < lineCount) {
      var points = [
        new THREE.Vector3(i * 3 - 9, 0, 0),
        new THREE.Vector3(i * 3 - 9 + 15, -8, 20)
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var line = new THREE.LineSegments(geometry, netMaterial);
      group.add(line);
      i = i + 1;
    }

    group.position.set(worldOriginX - 20, 0, worldOriginZ - 40);
    structures.push(group);
    return group;
  }

  function gunbattery() {
    var group = new THREE.Group();

    var platformGeometry = new THREE.BoxGeometry(16, 1, 8);
    var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
    platformMesh.position.y = 0.5;
    group.add(platformMesh);

    var gunGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
    var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

    var gunPositions = [
      [-6, 1.5, -2],
      [-2, 1.5, -2],
      [2, 1.5, -2],
      [6, 1.5, -2]
    ];

    var j = 0;
    while (j < gunPositions.length) {
      var gunMesh = new THREE.Mesh(gunGeometry, gunMaterial);
      gunMesh.position.set(gunPositions[j][0], gunPositions[j][1], gunPositions[j][2]);
      group.add(gunMesh);
      j = j + 1;
    }

    group.position.set(worldOriginX - 60, 0, worldOriginZ + 50);
    structures.push(group);
    return group;
  }

  function buildall() {
    skybridgeSpan();
    fortification();
    eileandonancastle();
    castlecauseway();
    kyleferryterminal();
    railwayterminus();
    sealochnets();
    gunbattery();
  }

  function getstructures() {
    return structures;
  }

  function getscene() {
    var scene = new THREE.Scene();
    var i = 0;
    while (i < structures.length) {
      scene.add(structures[i]);
      i = i + 1;
    }
    return scene;
  }

  var publicAPI = {
    build: buildall,
    structures: getstructures,
    scene: getscene
  };

  return publicAPI;
}());
