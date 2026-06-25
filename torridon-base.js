window.TorridonBase = (function() {
  'use strict';

  var baseX = 1160;
  var baseZ = 1510;
  var structures = [];

  function Liathach() {
    var group = new THREE.Group();
    var colors = [0xAA4422, 0x994411, 0x883300, 0x774400, 0x663333];
    var heights = [8, 10, 12, 10, 8];
    var offsets = [-8, -4, 0, 4, 8];

    for (var i = 0; i < 5; i++) {
      var geo = new THREE.BoxGeometry(3, heights[i], 3);
      var mat = new THREE.MeshLambertMaterial({ color: colors[i] });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(offsets[i], heights[i] / 2, 0);
      group.add(mesh);
    }

    group.position.set(baseX - 20, 0, baseZ);
    return group;
  }

  function BeinnEighe() {
    var group = new THREE.Group();

    var baseGeo = new THREE.BoxGeometry(12, 8, 12);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0xAA4422 });
    var baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 4;
    group.add(baseMesh);

    var capGeo = new THREE.BoxGeometry(10, 4, 10);
    var capMat = new THREE.MeshLambertMaterial({ color: 0xDDDDCC });
    var capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = 12;
    group.add(capMesh);

    group.position.set(baseX + 30, 0, baseZ - 25);
    return group;
  }

  function GlenTorridonBlock() {
    var group = new THREE.Group();

    var barrierGeo = new THREE.BoxGeometry(16, 3, 2);
    var barrierMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
    var barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.position.set(0, 1.5, 0);
    group.add(barrier);

    var postGeo = new THREE.BoxGeometry(3, 6, 3);
    var postMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var post = new THREE.Mesh(postGeo, postMat);
    post.position.set(10, 3, 0);
    group.add(post);

    group.position.set(baseX - 50, 0, baseZ + 40);
    return group;
  }

  function RescueHut() {
    var group = new THREE.Group();

    var hutGeo = new THREE.BoxGeometry(5, 3, 3);
    var hutMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    var hut = new THREE.Mesh(hutGeo, hutMat);
    hut.position.set(0, 1.5, 0);
    group.add(hut);

    var roofGeo = new THREE.BoxGeometry(5.5, 1.5, 3.5);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0xCC3300 });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 3.75, 0);
    group.add(roof);

    group.position.set(baseX + 60, 0, baseZ + 20);
    return group;
  }

  function DeerstalkerLodge() {
    var group = new THREE.Group();

    var mainGeo = new THREE.BoxGeometry(6, 3, 4);
    var mainMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var main = new THREE.Mesh(mainGeo, mainMat);
    main.position.set(0, 1.5, 0);
    group.add(main);

    var wingGeo = new THREE.BoxGeometry(3, 3, 4);
    var wingMat = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(5, 1.5, 0);
    group.add(wing);

    var towerGeo = new THREE.BoxGeometry(2, 5, 2);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x664433 });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(6, 2.5, -1);
    group.add(tower);

    group.position.set(baseX - 40, 0, baseZ - 50);
    return group;
  }

  function CorriePost() {
    var group = new THREE.Group();

    var platformGeo = new THREE.BoxGeometry(8, 1, 8);
    var platformMat = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, 0.5, 0);
    group.add(platform);

    var postGeo = new THREE.CylinderGeometry(0.6, 0.8, 4, 8);
    var postMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    var post = new THREE.Mesh(postGeo, postMat);
    post.position.set(0, 2.5, 0);
    group.add(post);

    var scopeGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
    var scopeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var scope = new THREE.Mesh(scopeGeo, scopeMat);
    scope.position.set(0, 4.5, 0);
    group.add(scope);

    group.position.set(baseX + 50, 8, baseZ - 60);
    return group;
  }

  function NavalBattery() {
    var group = new THREE.Group();

    var emplacementGeo = new THREE.BoxGeometry(12, 2, 8);
    var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var emplacement = new THREE.Mesh(emplacementGeo, emplacementMat);
    emplacement.position.set(0, 1, 0);
    group.add(emplacement);

    var gun1Geo = new THREE.CylinderGeometry(0.5, 0.6, 6, 12);
    var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var gun1 = new THREE.Mesh(gun1Geo, gunMat);
    gun1.position.set(-3, 2.5, 0);
    gun1.rotation.z = 0.3;
    group.add(gun1);

    var gun2Geo = new THREE.CylinderGeometry(0.5, 0.6, 6, 12);
    var gun2 = new THREE.Mesh(gun2Geo, gunMat);
    gun2.position.set(3, 2.5, 0);
    gun2.rotation.z = -0.3;
    group.add(gun2);

    group.position.set(baseX - 80, 0, baseZ + 70);
    return group;
  }

  function AncientDun() {
    var group = new THREE.Group();

    var wallGeo = new THREE.BoxGeometry(14, 2, 14);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x993333 });
    var wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 1, 0);
    group.add(wall);

    var innerWallGeo = new THREE.BoxGeometry(10, 1.5, 10);
    var innerWallMat = new THREE.MeshLambertMaterial({ color: 0xAA4444 });
    var innerWall = new THREE.Mesh(innerWallGeo, innerWallMat);
    innerWall.position.set(0, 0.75, 0);
    group.add(innerWall);

    var cornerGeo = new THREE.BoxGeometry(1.5, 2.5, 1.5);
    var cornerMat = new THREE.MeshLambertMaterial({ color: 0x772222 });
    var corners = [
      { x: 6.5, z: 6.5 },
      { x: -6.5, z: 6.5 },
      { x: 6.5, z: -6.5 },
      { x: -6.5, z: -6.5 }
    ];

    for (var i = 0; i < 4; i++) {
      var corner = new THREE.Mesh(cornerGeo, cornerMat);
      corner.position.set(corners[i].x, 1.25, corners[i].z);
      group.add(corner);
    }

    group.position.set(baseX + 20, 0, baseZ - 80);
    return group;
  }

  function build() {
    structures.push(Liathach());
    structures.push(BeinnEighe());
    structures.push(GlenTorridonBlock());
    structures.push(RescueHut());
    structures.push(DeerstalkerLodge());
    structures.push(CorriePost());
    structures.push(NavalBattery());
    structures.push(AncientDun());

    return structures;
  }

  function create() {
    return build();
  }

  function get() {
    return structures;
  }

  return {
    create: create,
    get: get
  };
}());
