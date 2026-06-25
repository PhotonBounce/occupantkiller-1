window.AboyneBase = (function() {
  'use strict';

  var baseX = 520;
  var baseZ = 550;
  var baseGroup = new THREE.Group();

  function createCastle() {
    var castleGroup = new THREE.Group();
    var grayMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });

    var mainWall = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 6),
      grayMaterial
    );
    mainWall.position.set(0, 3, 0);
    castleGroup.add(mainWall);

    var turretGeometry = new THREE.CylinderGeometry(1, 1, 7, 32);
    var turret1 = new THREE.Mesh(turretGeometry, grayMaterial);
    turret1.position.set(4, 3.5, 3);
    castleGroup.add(turret1);

    var turret2 = new THREE.Mesh(turretGeometry, grayMaterial);
    turret2.position.set(4, 3.5, -3);
    castleGroup.add(turret2);

    var turret3 = new THREE.Mesh(turretGeometry, grayMaterial);
    turret3.position.set(-4, 3.5, 3);
    castleGroup.add(turret3);

    var turret4 = new THREE.Mesh(turretGeometry, grayMaterial);
    turret4.position.set(-4, 3.5, -3);
    castleGroup.add(turret4);

    castleGroup.position.set(baseX, 0, baseZ);
    return castleGroup;
  }

  function createArenaRing() {
    var arenaGroup = new THREE.Group();
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

    var wallNorth = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1, 0.5),
      wallMaterial
    );
    wallNorth.position.set(0, 0.5, 8);
    arenaGroup.add(wallNorth);

    var wallSouth = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1, 0.5),
      wallMaterial
    );
    wallSouth.position.set(0, 0.5, -8);
    arenaGroup.add(wallSouth);

    var wallEast = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1, 16),
      wallMaterial
    );
    wallEast.position.set(8, 0.5, 0);
    arenaGroup.add(wallEast);

    var wallWest = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1, 16),
      wallMaterial
    );
    wallWest.position.set(-8, 0.5, 0);
    arenaGroup.add(wallWest);

    arenaGroup.position.set(baseX, 0, baseZ - 20);
    return arenaGroup;
  }

  function createMortarRange() {
    var mortarGroup = new THREE.Group();
    var blackMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    var mortar1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 3, 16),
      blackMaterial
    );
    mortar1.position.set(-3, 1.5, 0);
    mortar1.rotation.z = 0.3;
    mortarGroup.add(mortar1);

    var mortar2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 3, 16),
      blackMaterial
    );
    mortar2.position.set(0, 1.5, 0);
    mortar2.rotation.z = 0.3;
    mortarGroup.add(mortar2);

    var mortar3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 3, 16),
      blackMaterial
    );
    mortar3.position.set(3, 1.5, 0);
    mortar3.rotation.z = 0.3;
    mortarGroup.add(mortar3);

    mortarGroup.position.set(baseX - 15, 0, baseZ);
    return mortarGroup;
  }

  function createPineForest() {
    var forestGroup = new THREE.Group();
    var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    var needlesMaterial = new THREE.MeshLambertMaterial({ color: 0x1a4d1a });

    var treePositions = [
      [-10, -10],
      [-5, -12],
      [0, -14],
      [5, -12],
      [10, -10],
      [-8, -5],
      [8, -5]
    ];

    for (var i = 0; i < treePositions.length; i++) {
      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 4, 8),
        trunkMaterial
      );
      trunk.position.set(treePositions[i][0], 2, treePositions[i][1]);
      forestGroup.add(trunk);

      var canopy = new THREE.Mesh(
        new THREE.ConeGeometry(2, 5, 16),
        needlesMaterial
      );
      canopy.position.set(treePositions[i][0], 5, treePositions[i][1]);
      forestGroup.add(canopy);
    }

    forestGroup.position.set(baseX, 0, baseZ + 30);
    return forestGroup;
  }

  function createFieldHospital() {
    var hospitalGroup = new THREE.Group();
    var whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });

    var tent1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 3),
      whiteMaterial
    );
    tent1.position.set(-5, 1.5, 0);
    hospitalGroup.add(tent1);

    var tent2 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 3),
      whiteMaterial
    );
    tent2.position.set(0, 1.5, 0);
    hospitalGroup.add(tent2);

    var tent3 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 3),
      whiteMaterial
    );
    tent3.position.set(5, 1.5, 0);
    hospitalGroup.add(tent3);

    hospitalGroup.position.set(baseX + 20, 0, baseZ);
    return hospitalGroup;
  }

  function createSupplyDropZone() {
    var supplyGroup = new THREE.Group();
    var padMaterial = new THREE.MeshLambertMaterial({ color: 0x4d4d4d });
    var markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });

    var dropPad = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.2, 6),
      padMaterial
    );
    dropPad.position.set(0, 0.1, 0);
    supplyGroup.add(dropPad);

    var marker1 = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 2, 8),
      markerMaterial
    );
    marker1.position.set(3, 1, 3);
    supplyGroup.add(marker1);

    var marker2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 2, 8),
      markerMaterial
    );
    marker2.position.set(3, 1, -3);
    supplyGroup.add(marker2);

    var marker3 = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 2, 8),
      markerMaterial
    );
    marker3.position.set(-3, 1, 3);
    supplyGroup.add(marker3);

    var marker4 = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 2, 8),
      markerMaterial
    );
    marker4.position.set(-3, 1, -3);
    supplyGroup.add(marker4);

    supplyGroup.position.set(baseX - 25, 0, baseZ + 15);
    return supplyGroup;
  }

  function createMotorPool() {
    var poolGroup = new THREE.Group();
    var vehicleMaterial = new THREE.MeshLambertMaterial({ color: 0x556633 });

    var positions = [
      [-5, 0],
      [-1.5, 0],
      [1.5, 0],
      [5, 0]
    ];

    for (var i = 0; i < positions.length; i++) {
      var vehicle = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 1.5, 4),
        vehicleMaterial
      );
      vehicle.position.set(positions[i][0], 0.75, positions[i][1]);
      poolGroup.add(vehicle);
    }

    poolGroup.position.set(baseX + 25, 0, baseZ - 15);
    return poolGroup;
  }

  function createPerimeterFence() {
    var fenceGroup = new THREE.Group();
    var wireColor = 0x333333;
    var material = new THREE.LineBasicMaterial({ color: wireColor });

    var gridSize = 20;
    var gridSpacing = 2;
    var points = [];

    for (var x = -gridSize; x <= gridSize; x += gridSpacing) {
      points.push(new THREE.Vector3(x, 0, -gridSize));
      points.push(new THREE.Vector3(x, 0, gridSize));
      points.push(new THREE.Vector3(-gridSize, 0, x));
      points.push(new THREE.Vector3(gridSize, 0, x));
    }

    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(points.length * 3);

    for (var i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x;
      positions[i * 3 + 1] = points[i].y;
      positions[i * 3 + 2] = points[i].z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var lines = new THREE.LineSegments(geometry, material);
    fenceGroup.add(lines);

    fenceGroup.position.set(baseX, 0, baseZ);
    return fenceGroup;
  }

  function initializeBase() {
    baseGroup.add(createCastle());
    baseGroup.add(createArenaRing());
    baseGroup.add(createMortarRange());
    baseGroup.add(createPineForest());
    baseGroup.add(createFieldHospital());
    baseGroup.add(createSupplyDropZone());
    baseGroup.add(createMotorPool());
    baseGroup.add(createPerimeterFence());
  }

  initializeBase();

  return {
    group: baseGroup,
    getGroup: function() {
      return baseGroup;
    },
    getPosition: function() {
      return {
        x: baseX,
        z: baseZ
      };
    }
  };
}());
