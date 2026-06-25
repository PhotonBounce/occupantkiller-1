window.BanchoryFort = (function() {
  'use strict';

  var baseX = 500;
  var baseZ = 520;

  function createBridge() {
    var bridgeGroup = new THREE.Group();

    // Main bridge span
    var bridgeGeom = new THREE.BoxGeometry(40, 2, 8);
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var bridgeMesh = new THREE.Mesh(bridgeGeom, bridgeMat);
    bridgeMesh.position.set(baseX, 2, baseZ);
    bridgeGroup.add(bridgeMesh);

    // Left tower
    var towerLeftGeom = new THREE.BoxGeometry(6, 12, 6);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var towerLeftMesh = new THREE.Mesh(towerLeftGeom, towerMat);
    towerLeftMesh.position.set(baseX - 22, 6, baseZ);
    bridgeGroup.add(towerLeftMesh);

    // Right tower
    var towerRightMesh = new THREE.Mesh(towerLeftGeom, towerMat);
    towerRightMesh.position.set(baseX + 22, 6, baseZ);
    bridgeGroup.add(towerRightMesh);

    return bridgeGroup;
  }

  function createLodge() {
    var lodgeGroup = new THREE.Group();

    // Main lodge building
    var lodgeGeom = new THREE.BoxGeometry(6, 4, 4);
    var brownMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var lodgeMesh = new THREE.Mesh(lodgeGeom, brownMat);
    lodgeMesh.position.set(baseX - 15, 2, baseZ - 18);
    lodgeGroup.add(lodgeMesh);

    // Roof
    var roofGeom = new THREE.BoxGeometry(7, 1, 5);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var roofMesh = new THREE.Mesh(roofGeom, roofMat);
    roofMesh.position.set(baseX - 15, 4.5, baseZ - 18);
    lodgeGroup.add(roofMesh);

    return lodgeGroup;
  }

  function createForest() {
    var forestGroup = new THREE.Group();

    var treePositions = [
      [baseX - 25, baseZ + 12],
      [baseX - 20, baseZ + 15],
      [baseX - 15, baseZ + 10],
      [baseX - 10, baseZ + 14],
      [baseX - 5, baseZ + 11],
      [baseX, baseZ + 13]
    ];

    for (var i = 0; i < treePositions.length; i++) {
      var pos = treePositions[i];

      // Trunk
      var trunkGeom = new THREE.CylinderGeometry(1, 1.2, 16, 8);
      var trunkMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
      var trunkMesh = new THREE.Mesh(trunkGeom, trunkMat);
      trunkMesh.position.set(pos[0], 8, pos[1]);
      forestGroup.add(trunkMesh);

      // Crown
      var crownGeom = new THREE.ConeGeometry(6, 12, 8);
      var crownMat = new THREE.MeshLambertMaterial({ color: 0x2D5016 });
      var crownMesh = new THREE.Mesh(crownGeom, crownMat);
      crownMesh.position.set(pos[0], 14, pos[1]);
      forestGroup.add(crownMesh);
    }

    return forestGroup;
  }

  function createObstacles() {
    var obsGroup = new THREE.Group();

    var obstaclePositions = [
      [baseX - 12, baseZ - 8],
      [baseX - 4, baseZ - 8],
      [baseX + 4, baseZ - 8],
      [baseX + 12, baseZ - 8]
    ];

    var concreteColor = 0xA9A9A9;

    for (var i = 0; i < obstaclePositions.length; i++) {
      var pos = obstaclePositions[i];

      // Dragon's teeth - angled boxes
      var teethGeom = new THREE.BoxGeometry(2, 3, 2);
      var teethMat = new THREE.MeshLambertMaterial({ color: concreteColor });
      var teethMesh = new THREE.Mesh(teethGeom, teethMat);
      teethMesh.rotation.z = 0.785;
      teethMesh.position.set(pos[0], 1.5, pos[1]);
      obsGroup.add(teethMesh);
    }

    return obsGroup;
  }

  function createBattery() {
    var batteryGroup = new THREE.Group();

    var gunPositions = [
      [baseX + 18, baseZ - 12],
      [baseX + 20, baseZ - 10],
      [baseX + 22, baseZ - 12]
    ];

    var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    for (var i = 0; i < gunPositions.length; i++) {
      var pos = gunPositions[i];

      // Gun mount cylinder
      var mountGeom = new THREE.CylinderGeometry(2, 2.5, 2, 12);
      var mountMesh = new THREE.Mesh(mountGeom, gunMat);
      mountMesh.position.set(pos[0], 1, pos[1]);
      batteryGroup.add(mountMesh);

      // Gun barrel
      var barrelGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
      var barrelMesh = new THREE.Mesh(barrelGeom, gunMat);
      barrelMesh.rotation.z = 0.3;
      barrelMesh.position.set(pos[0] + 2, 2.5, pos[1] + 2);
      batteryGroup.add(barrelMesh);
    }

    return batteryGroup;
  }

  function createMedicalPost() {
    var medicalGroup = new THREE.Group();

    // Tent main body
    var tentGeom = new THREE.BoxGeometry(4, 3, 4);
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var tentMesh = new THREE.Mesh(tentGeom, whiteMat);
    tentMesh.position.set(baseX + 12, 1.5, baseZ - 12);
    medicalGroup.add(tentMesh);

    // Red cross on tent
    var crossHorizGeom = new THREE.BoxGeometry(2, 0.1, 0.6);
    var redMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var crossHoriz = new THREE.Mesh(crossHorizGeom, redMat);
    crossHoriz.position.set(baseX + 12, 2.5, baseZ - 12);
    medicalGroup.add(crossHoriz);

    var crossVertGeom = new THREE.BoxGeometry(0.6, 0.1, 2);
    var crossVert = new THREE.Mesh(crossVertGeom, redMat);
    crossVert.position.set(baseX + 12, 2.5, baseZ - 12);
    medicalGroup.add(crossVert);

    return medicalGroup;
  }

  function createComTower() {
    var towerGroup = new THREE.Group();

    // Mast
    var mastGeom = new THREE.CylinderGeometry(0.3, 0.3, 20, 8);
    var metalMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var mastMesh = new THREE.Mesh(mastGeom, metalMat);
    mastMesh.position.set(baseX - 28, 10, baseZ + 8);
    towerGroup.add(mastMesh);

    // Upper dish
    var dishGeom = new THREE.SphereGeometry(1.5, 16, 12);
    var dishMesh = new THREE.Mesh(dishGeom, metalMat);
    dishMesh.position.set(baseX - 28, 18, baseZ + 8);
    towerGroup.add(dishMesh);

    // Lower dish
    var dishMesh2 = new THREE.Mesh(dishGeom, metalMat);
    dishMesh2.position.set(baseX - 28, 14, baseZ + 8);
    towerGroup.add(dishMesh2);

    return towerGroup;
  }

  function createEarthwork() {
    var earthGroup = new THREE.Group();

    // Defensive berm
    var bermGeom = new THREE.BoxGeometry(50, 2, 4);
    var earthMat = new THREE.MeshLambertMaterial({ color: 0x6B4226 });
    var bermMesh = new THREE.Mesh(bermGeom, earthMat);
    bermMesh.position.set(baseX, 1, baseZ - 20);
    earthGroup.add(bermMesh);

    return earthGroup;
  }

  function buildEnvironment() {
    var environment = new THREE.Group();

    environment.add(createBridge());
    environment.add(createLodge());
    environment.add(createForest());
    environment.add(createObstacles());
    environment.add(createBattery());
    environment.add(createMedicalPost());
    environment.add(createComTower());
    environment.add(createEarthwork());

    return environment;
  }

  return {
    create: buildEnvironment
  };
}());
