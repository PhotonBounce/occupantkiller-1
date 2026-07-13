window.HarborFort = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var fortGroup = new THREE.Group();
  var drawbridgeGroup = new THREE.Group();
  var drawbridgeAngle = 0;
  var radarGroup = new THREE.Group();

  var materials = {
    stone: new THREE.MeshStandardMaterial({ color: 0x8B8680, roughness: 0.8, metalness: 0.1 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x2C2C2C, roughness: 0.4, metalness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9, metalness: 0 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0xB87333, roughness: 0.5, metalness: 0.8 })
  };

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    scene.add(fortGroup);

    buildPerimeterWalls();
    buildCannonEmplacements();
    buildCentralCourtyard();
    buildTowerWithRadar();
    buildBarracks();
    buildDrawbridgeGate();
    buildAmmunitionVault();
    buildPortcullisGates();
    buildDockWall();
    buildWaterfront();

    fortGroup.position.y = 0;
  };

  var buildPerimeterWalls = function() {
    var wallGeom = new THREE.BoxGeometry(40, 12, 2);
    var northWall = new THREE.Mesh(wallGeom, materials.stone);
    northWall.position.set(0, 6, -20);
    fortGroup.add(northWall);

    var southWall = new THREE.Mesh(wallGeom, materials.stone);
    southWall.position.set(0, 6, 20);
    fortGroup.add(southWall);

    var eastWallGeom = new THREE.BoxGeometry(2, 12, 38);
    var eastWall = new THREE.Mesh(eastWallGeom, materials.stone);
    eastWall.position.set(20, 6, 0);
    fortGroup.add(eastWall);

    var westWall = new THREE.Mesh(eastWallGeom, materials.stone);
    westWall.position.set(-20, 6, 0);
    fortGroup.add(westWall);

    addCrenellations(-20, 12);
    addCrenellations(20, 12);
  };

  var addCrenellations = function(xPos, yBase) {
    for (var i = 0; i < 8; i++) {
      var crenGeom = new THREE.BoxGeometry(1.5, 2, 1.5);
      var cren = new THREE.Mesh(crenGeom, materials.stone);
      cren.position.set(xPos - 10 + i * 2.8, yBase + 1, -18 + Math.random() * 2);
      fortGroup.add(cren);
    }
  };

  var buildCannonEmplacements = function() {
    var positions = [[-12, 0, -15], [0, 0, -15], [12, 0, -15], [-12, 0, 15], [12, 0, 15]];
    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      buildCannon(pos[0], pos[1], pos[2]);
    }
  };

  var buildCannon = function(x, z) {
    var carriageGeom = new THREE.BoxGeometry(3, 2, 2);
    var carriage = new THREE.Mesh(carriageGeom, materials.wood);
    carriage.position.set(x, 7, z);
    fortGroup.add(carriage);

    var barrelGeom = new THREE.CylinderGeometry(0.6, 0.7, 5, 16);
    var barrel = new THREE.Mesh(barrelGeom, materials.bronze);
    barrel.rotation.z = 0.3;
    barrel.position.set(x, 9, z);
    fortGroup.add(barrel);

    var wheelGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 12);
    for (var w = 0; w < 2; w++) {
      var wheel = new THREE.Mesh(wheelGeom, materials.iron);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x - 1.2 + w * 2.4, 6, z - 1.2);
      fortGroup.add(wheel);
    }
  };

  var buildCentralCourtyard = function() {
    var groundGeom = new THREE.BoxGeometry(30, 0.5, 30);
    var ground = new THREE.Mesh(groundGeom, new THREE.MeshStandardMaterial({ color: 0x5C4033 }));
    ground.position.set(0, 0.25, 0);
    fortGroup.add(ground);
  };

  var buildTowerWithRadar = function() {
    var towerGeom = new THREE.CylinderGeometry(3, 4, 16, 12);
    var tower = new THREE.Mesh(towerGeom, materials.stone);
    tower.position.set(-14, 8, 12);
    fortGroup.add(tower);

    var radarGeom = new THREE.SphereGeometry(2.5, 16, 16);
    var radar = new THREE.Mesh(radarGeom, new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0x444400 }));
    radar.position.set(-14, 24, 12);
    radarGroup.add(radar);
    radarGroup.position.copy(radar.position);
    fortGroup.add(radarGroup);

    var scanGeom = new THREE.CylinderGeometry(2.2, 2.2, 0.3, 8);
    var scan = new THREE.Mesh(scanGeom, new THREE.MeshStandardMaterial({ color: 0x00FF00, emissive: 0x00FF00 }));
    scan.position.set(0, -2.3, 0);
    radarGroup.add(scan);
  };

  var buildBarracks = function() {
    var barracksGeom = new THREE.BoxGeometry(12, 6, 10);
    var barracks = new THREE.Mesh(barracksGeom, materials.stone);
    barracks.position.set(8, 3, -2);
    fortGroup.add(barracks);

    var roofGeom = new THREE.ConeGeometry(7, 4, 4);
    var roof = new THREE.Mesh(roofGeom, new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
    roof.position.set(8, 10, -2);
    fortGroup.add(roof);
  };

  var buildDrawbridgeGate = function() {
    var hingeGeom = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
    var hingeLeft = new THREE.Mesh(hingeGeom, materials.iron);
    hingeLeft.rotation.z = Math.PI / 2;
    hingeLeft.position.set(-8.5, 4, 18.5);
    fortGroup.add(hingeLeft);

    var hingeRight = new THREE.Mesh(hingeGeom, materials.iron);
    hingeRight.rotation.z = Math.PI / 2;
    hingeRight.position.set(8.5, 4, 18.5);
    fortGroup.add(hingeRight);

    var bridgeGeom = new THREE.BoxGeometry(14, 2, 6);
    var bridge = new THREE.Mesh(bridgeGeom, materials.wood);
    drawbridgeGroup.add(bridge);
    drawbridgeGroup.position.set(0, 5, 18.5);
    fortGroup.add(drawbridgeGroup);

    addChains(-7, 5, 18.5);
    addChains(7, 5, 18.5);
  };

  var addChains = function(x, y, z) {
    var points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -2.5, 0.5)];
    var chainGeom = new THREE.BufferGeometry().setFromPoints(points);
    var chainMat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 3 });
    var chain = new THREE.LineSegments(chainGeom, chainMat);
    chain.position.set(x, y, z);
    fortGroup.add(chain);
  };

  var buildAmmunitionVault = function() {
    var vaultGeom = new THREE.BoxGeometry(8, 3, 6);
    var vault = new THREE.Mesh(vaultGeom, new THREE.MeshStandardMaterial({ color: 0x1C1C1C, metalness: 0.95 }));
    vault.position.set(-10, -1.5, 5);
    fortGroup.add(vault);

    var doorGeom = new THREE.BoxGeometry(4, 3, 0.4);
    var door = new THREE.Mesh(doorGeom, new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 1.0 }));
    door.position.set(-10, -1.5, 3.2);
    fortGroup.add(door);
  };

  var buildPortcullisGates = function() {
    var barPositions = [[-14, 3, -18], [-10, 3, -18], [-6, 3, -18], [-2, 3, -18], [2, 3, -18], [6, 3, -18], [10, 3, -18], [14, 3, -18]];
    for (var i = 0; i < barPositions.length; i++) {
      var pos = barPositions[i];
      var barGeom = new THREE.BoxGeometry(0.4, 4, 0.3);
      var bar = new THREE.Mesh(barGeom, materials.iron);
      bar.position.set(pos[0], pos[1], pos[2]);
      fortGroup.add(bar);
    }
  };

  var buildDockWall = function() {
    var dockGeom = new THREE.BoxGeometry(28, 3, 4);
    var dock = new THREE.Mesh(dockGeom, new THREE.MeshStandardMaterial({ color: 0x654321 }));
    dock.position.set(0, 1.5, 25);
    fortGroup.add(dock);

    var pilingGeom = new THREE.CylinderGeometry(0.5, 0.6, 5, 8);
    for (var p = 0; p < 5; p++) {
      var piling = new THREE.Mesh(pilingGeom, new THREE.MeshStandardMaterial({ color: 0x3D3D3D }));
      piling.position.set(-12 + p * 6, 0, 28);
      fortGroup.add(piling);
    }
  };

  var buildWaterfront = function() {
    var vesselGeom = new THREE.BoxGeometry(6, 4, 10);
    var vessel1 = new THREE.Mesh(vesselGeom, new THREE.MeshStandardMaterial({ color: 0x2C3E50 }));
    vessel1.position.set(-8, 2, 32);
    fortGroup.add(vessel1);

    var vessel2 = new THREE.Mesh(vesselGeom, new THREE.MeshStandardMaterial({ color: 0x34495E }));
    vessel2.position.set(6, 2, 32);
    fortGroup.add(vessel2);

    var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 12, 6);
    var mast = new THREE.Mesh(mastGeom, materials.wood);
    mast.position.set(-8, 8, 32);
    fortGroup.add(mast);
  };

  var update = function(delta) {
    radarGroup.rotation.y += delta * 1.5;
    drawbridgeAngle = (drawbridgeAngle + delta * 0.4) % (Math.PI * 2);
    drawbridgeGroup.rotation.x = Math.sin(drawbridgeAngle * 0.5) * 0.6;
  };

  var reset = function() {
    drawbridgeAngle = 0;
    drawbridgeGroup.rotation.x = 0;
    radarGroup.rotation.y = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
