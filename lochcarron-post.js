window.LochcarronPost = (function() {
  'use strict';

  var baseX = 1200;
  var baseZ = 1570;
  var structures = [];

  function createMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function stromeferry() {
    var group = new THREE.Group();

    var rampGeo = new THREE.BoxGeometry(30, 2, 50);
    var rampMat = createMaterial(0x8B8680);
    var ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(baseX - 40, 1, baseZ + 30);
    group.add(ramp);

    for (var i = 0; i < 4; i++) {
      var postGeo = new THREE.CylinderGeometry(1.5, 1.5, 6, 16);
      var postMat = createMaterial(0x654321);
      var post = new THREE.Mesh(postGeo, postMat);
      post.position.set(baseX - 50 + i * 20, 3, baseZ + 50);
      group.add(post);
    }

    return group;
  }

  function battery() {
    var group = new THREE.Group();

    var baseGeo = new THREE.BoxGeometry(35, 3, 25);
    var baseMat = createMaterial(0x808080);
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(baseX + 80, 1.5, baseZ - 50);
    group.add(base);

    for (var i = 0; i < 3; i++) {
      var gunGeo = new THREE.CylinderGeometry(0.8, 1.2, 18, 12);
      var gunMat = createMaterial(0x2F4F4F);
      var gun = new THREE.Mesh(gunGeo, gunMat);
      gun.rotation.z = 0.3;
      gun.position.set(baseX + 60 + i * 15, 12, baseZ - 50);
      group.add(gun);
    }

    return group;
  }

  function gatehouse() {
    var group = new THREE.Group();

    var mainGeo = new THREE.BoxGeometry(16, 16, 16);
    var mainMat = createMaterial(0xD4A574);
    var main = new THREE.Mesh(mainGeo, mainMat);
    main.position.set(baseX - 120, 8, baseZ + 100);
    group.add(main);

    for (var i = 0; i < 2; i++) {
      var towerGeo = new THREE.CylinderGeometry(3, 3, 20, 16);
      var towerMat = createMaterial(0xA0826D);
      var tower = new THREE.Mesh(towerGeo, towerMat);
      var offset = i === 0 ? -12 : 12;
      tower.position.set(baseX - 120 + offset, 10, baseZ + 100);
      group.add(tower);
    }

    return group;
  }

  function checkpoint() {
    var group = new THREE.Group();

    var gateGeo = new THREE.BoxGeometry(40, 8, 2);
    var gateMat = createMaterial(0xFF6347);
    var gate = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(baseX + 150, 4, baseZ);
    group.add(gate);

    var pillLeftGeo = new THREE.BoxGeometry(3, 10, 3);
    var pillMat = createMaterial(0x696969);
    var pillLeft = new THREE.Mesh(pillLeftGeo, pillMat);
    pillLeft.position.set(baseX + 120, 5, baseZ);
    group.add(pillLeft);

    var pillRight = new THREE.Mesh(pillLeftGeo, pillMat);
    pillRight.position.set(baseX + 180, 5, baseZ);
    group.add(pillRight);

    return group;
  }

  function cottages() {
    var group = new THREE.Group();

    var colors = [0xF5F5F5, 0xFAFAFA, 0xF0F0F0, 0xFFFFFF];

    for (var i = 0; i < 4; i++) {
      var houseGeo = new THREE.BoxGeometry(12, 10, 12);
      var houseMat = createMaterial(colors[i]);
      var house = new THREE.Mesh(houseGeo, houseMat);
      house.position.set(baseX - 200 + i * 20, 5, baseZ - 100);
      group.add(house);

      var roofGeo = new THREE.ConeGeometry(8, 6, 4);
      var roofMat = createMaterial(0x8B4513);
      var roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(baseX - 200 + i * 20, 13, baseZ - 100);
      group.add(roof);
    }

    return group;
  }

  function viaduct() {
    var group = new THREE.Group();

    var stoneMat = createMaterial(0x808080);

    for (var i = 0; i < 5; i++) {
      var pillarGeo = new THREE.CylinderGeometry(2.5, 2.5, 25, 16);
      var pillar = new THREE.Mesh(pillarGeo, stoneMat);
      pillar.position.set(baseX - 100 + i * 30, 12.5, baseZ - 150);
      group.add(pillar);
    }

    var deckGeo = new THREE.BoxGeometry(140, 3, 15);
    var deckMat = createMaterial(0x696969);
    var deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(baseX, 25, baseZ - 150);
    group.add(deck);

    return group;
  }

  function kayakfortification() {
    var group = new THREE.Group();

    var rampGeo = new THREE.BoxGeometry(20, 1.5, 35);
    var rampMat = createMaterial(0xA0826D);
    var ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(baseX + 60, 0.75, baseZ + 80);
    group.add(ramp);

    var points = [
      new THREE.Vector3(baseX + 50, 2, baseZ + 95),
      new THREE.Vector3(baseX + 70, 2, baseZ + 95)
    ];
    var boomGeo = new THREE.BufferGeometry().setFromPoints(points);
    var boomMat = createMaterial(0x654321);
    var boom = new THREE.LineSegments(boomGeo, boomMat);
    group.add(boom);

    return group;
  }

  function refuge() {
    var group = new THREE.Group();

    var bothyGeo = new THREE.BoxGeometry(10, 8, 10);
    var bothyMat = createMaterial(0x696969);
    var bothy = new THREE.Mesh(bothyGeo, bothyMat);
    bothy.position.set(baseX - 150, 4, baseZ - 200);
    group.add(bothy);

    var roofGeo = new THREE.ConeGeometry(6.5, 5, 4);
    var roofMat = createMaterial(0x2F4F4F);
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(baseX - 150, 9.5, baseZ - 200);
    group.add(roof);

    var wallPositions = [
      [baseX - 165, baseZ - 195],
      [baseX - 165, baseZ - 205],
      [baseX - 135, baseZ - 200]
    ];

    for (var i = 0; i < 3; i++) {
      var wallGeo = new THREE.BoxGeometry(8, 2, 2);
      var wallMat = createMaterial(0x8B8B8B);
      var wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(wallPositions[i][0], 1, wallPositions[i][1]);
      group.add(wall);
    }

    return group;
  }

  function build() {
    structures.push(stromeferry());
    structures.push(battery());
    structures.push(gatehouse());
    structures.push(checkpoint());
    structures.push(cottages());
    structures.push(viaduct());
    structures.push(kayakfortification());
    structures.push(refuge());

    var container = new THREE.Group();
    for (var i = 0; i < structures.length; i++) {
      container.add(structures[i]);
    }
    return container;
  }

  return {
    build: build,
    baseX: baseX,
    baseZ: baseZ
  };
}());
