window.DurnessPost = (function() {
  'use strict';

  var scene = null;
  var baseX = 1040;
  var baseZ = 1330;

  function buildSmoocavecave() {
    var group = new THREE.Group();
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

    var archFrame = new THREE.BoxGeometry(16, 12, 2);
    var archMesh = new THREE.Mesh(archFrame, stoneMaterial);
    archMesh.position.set(0, 6, 0);
    group.add(archMesh);

    var platform = new THREE.BoxGeometry(14, 1, 12);
    var platformMesh = new THREE.Mesh(platform, stoneMaterial);
    platformMesh.position.set(0, 0.5, 6);
    group.add(platformMesh);

    group.position.set(baseX - 20, 0, baseZ);
    return group;
  }

  function buildTower() {
    var group = new THREE.Group();
    var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var towerGeom = new THREE.CylinderGeometry(3, 3.5, 14, 8);
    var towerMesh = new THREE.Mesh(towerGeom, concreteMaterial);
    towerMesh.position.set(0, 7, 0);
    group.add(towerMesh);

    var platformGeom = new THREE.BoxGeometry(8, 1, 8);
    var platformMesh = new THREE.Mesh(platformGeom, concreteMaterial);
    platformMesh.position.set(0, 14, 0);
    group.add(platformMesh);

    group.position.set(baseX + 30, 0, baseZ + 25);
    return group;
  }

  function buildTargets() {
    var group = new THREE.Group();
    var blackMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

    var positions = [
      [-15, 0, 8],
      [-5, 0, 12],
      [5, 0, 10],
      [15, 0, 14]
    ];

    var i = 0;
    while (i < positions.length) {
      var targetGeom = new THREE.BoxGeometry(4, 8, 3);
      var targetMesh = new THREE.Mesh(targetGeom, blackMaterial);
      targetMesh.position.set(positions[i][0], positions[i][1] + 4, positions[i][2]);
      group.add(targetMesh);
      i = i + 1;
    }

    group.position.set(baseX + 50, 0, baseZ - 40);
    return group;
  }

  function buildLimekiln() {
    var group = new THREE.Group();
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });

    var kiln = new THREE.CylinderGeometry(2.5, 3, 8, 12);
    var kilnMesh = new THREE.Mesh(kiln, stoneMaterial);
    kilnMesh.position.set(0, 4, 0);
    group.add(kilnMesh);

    var feed = new THREE.BoxGeometry(6, 2, 5);
    var feedMesh = new THREE.Mesh(feed, stoneMaterial);
    feedMesh.position.set(0, 9, 0);
    group.add(feedMesh);

    group.position.set(baseX - 60, 0, baseZ + 45);
    return group;
  }

  function buildSeacliffbattery() {
    var group = new THREE.Group();
    var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var mountMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

    var gunPositions = [
      [-10, 0, 0],
      [0, 0, 8],
      [10, 0, 0]
    ];

    var i = 0;
    while (i < gunPositions.length) {
      var gun = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
      var gunMesh = new THREE.Mesh(gun, gunMaterial);
      gunMesh.rotation.z = Math.PI / 6;
      gunMesh.position.set(gunPositions[i][0], 3, gunPositions[i][2]);
      group.add(gunMesh);

      var mount = new THREE.BoxGeometry(5, 2, 4);
      var mountMesh = new THREE.Mesh(mount, mountMaterial);
      mountMesh.position.set(gunPositions[i][0], 1, gunPositions[i][2]);
      group.add(mountMesh);

      i = i + 1;
    }

    var clifftop = new THREE.BoxGeometry(35, 3, 20);
    var clifftopMesh = new THREE.Mesh(clifftop, mountMaterial);
    clifftopMesh.position.set(0, -1.5, 4);
    group.add(clifftopMesh);

    group.position.set(baseX - 80, 0, baseZ - 80);
    return group;
  }

  function buildMemorialbench() {
    var group = new THREE.Group();
    var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });

    var seat = new THREE.BoxGeometry(8, 0.5, 2);
    var seatMesh = new THREE.Mesh(seat, woodMaterial);
    seatMesh.position.set(0, 1, 0);
    group.add(seatMesh);

    var rest = new THREE.BoxGeometry(8, 1, 0.5);
    var restMesh = new THREE.Mesh(rest, woodMaterial);
    restMesh.position.set(0, 1.5, -1);
    group.add(restMesh);

    var leg1 = new THREE.BoxGeometry(0.4, 1, 2);
    var leg1Mesh = new THREE.Mesh(leg1, woodMaterial);
    leg1Mesh.position.set(-3.5, 0.5, 0);
    group.add(leg1Mesh);

    var leg2 = new THREE.BoxGeometry(0.4, 1, 2);
    var leg2Mesh = new THREE.Mesh(leg2, woodMaterial);
    leg2Mesh.position.set(3.5, 0.5, 0);
    group.add(leg2Mesh);

    group.position.set(baseX + 70, 0, baseZ - 60);
    return group;
  }

  function buildRadiorelay() {
    var group = new THREE.Group();
    var steelMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });

    var mast = new THREE.CylinderGeometry(0.4, 0.4, 18, 8);
    var mastMesh = new THREE.Mesh(mast, steelMaterial);
    mastMesh.position.set(0, 9, 0);
    group.add(mastMesh);

    var dish1 = new THREE.SphereGeometry(2, 16, 12);
    var dish1Mesh = new THREE.Mesh(dish1, dishMaterial);
    dish1Mesh.position.set(0, 12, 0);
    group.add(dish1Mesh);

    var dish2 = new THREE.SphereGeometry(1.5, 12, 10);
    var dish2Mesh = new THREE.Mesh(dish2, dishMaterial);
    dish2Mesh.position.set(0, 16, 0);
    group.add(dish2Mesh);

    var shed = new THREE.BoxGeometry(6, 3, 5);
    var shedMesh = new THREE.Mesh(shed, steelMaterial);
    shedMesh.position.set(8, 1.5, 0);
    group.add(shedMesh);

    group.position.set(baseX - 40, 0, baseZ - 120);
    return group;
  }

  function buildBogmarkers() {
    var group = new THREE.Group();
    var markerMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

    var positions = [
      [-25, 0, 0],
      [-15, 0, 5],
      [-5, 0, -3],
      [5, 0, 8],
      [15, 0, 2],
      [25, 0, -6],
      [-20, 0, 15],
      [0, 0, 18],
      [20, 0, 12],
      [10, 0, -15]
    ];

    var i = 0;
    while (i < positions.length) {
      var stake = new THREE.ConeGeometry(0.6, 3, 6);
      var stakeMesh = new THREE.Mesh(stake, markerMaterial);
      stakeMesh.position.set(positions[i][0], positions[i][1] + 1.5, positions[i][2]);
      group.add(stakeMesh);
      i = i + 1;
    }

    group.position.set(baseX + 120, 0, baseZ + 80);
    return group;
  }

  function load(targetscene) {
    scene = targetscene;

    var smoocave = buildSmoocavecave();
    scene.add(smoocave);

    var tower = buildTower();
    scene.add(tower);

    var targets = buildTargets();
    scene.add(targets);

    var limekiln = buildLimekiln();
    scene.add(limekiln);

    var seacliff = buildSeacliffbattery();
    scene.add(seacliff);

    var bench = buildMemorialbench();
    scene.add(bench);

    var relay = buildRadiorelay();
    scene.add(relay);

    var bog = buildBogmarkers();
    scene.add(bog);
  }

  return {
    load: load
  };
}());
