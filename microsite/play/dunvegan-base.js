window.DunveganBase = (function() {
  'use strict';

  var BASE_X = 1320;
  var BASE_Z = 1750;

  function createMainTower() {
    var geometry = new THREE.CylinderGeometry(4, 4, 16, 32);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(BASE_X, 8, BASE_Z);
    tower.castShadow = true;
    tower.receiveShadow = true;

    var keepGeometry = new THREE.BoxGeometry(6, 14, 5);
    var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var keep = new THREE.Mesh(keepGeometry, keepMaterial);
    keep.position.set(BASE_X + 7, 7, BASE_Z);
    keep.castShadow = true;
    keep.receiveShadow = true;

    var group = new THREE.Group();
    group.add(tower);
    group.add(keep);
    return group;
  }

  function createSeaGate() {
    var baseGeometry = new THREE.BoxGeometry(12, 8, 3);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(BASE_X - 20, 4, BASE_Z + 15);
    base.castShadow = true;
    base.receiveShadow = true;

    var leftWallGeometry = new THREE.BoxGeometry(2, 12, 3);
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
    var leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(BASE_X - 27, 6, BASE_Z + 15);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;

    var rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    rightWall.position.set(BASE_X - 13, 6, BASE_Z + 15);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;

    var archGeometry = new THREE.BoxGeometry(8, 6, 1);
    var archMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.position.set(BASE_X - 20, 10, BASE_Z + 16);
    arch.castShadow = true;
    arch.receiveShadow = true;

    var group = new THREE.Group();
    group.add(base);
    group.add(leftWall);
    group.add(rightWall);
    group.add(arch);
    return group;
  }

  function createCurtainWalls() {
    var walls = [];

    var wall1Geometry = new THREE.BoxGeometry(30, 6, 1);
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });

    var wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall1.position.set(BASE_X - 5, 3, BASE_Z - 20);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    walls.push(wall1);

    var wall2 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall2.position.set(BASE_X - 5, 3, BASE_Z + 20);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    walls.push(wall2);

    var wall3Geometry = new THREE.BoxGeometry(1, 6, 40);
    var wall3 = new THREE.Mesh(wall3Geometry, wallMaterial);
    wall3.position.set(BASE_X - 20, 3, BASE_Z);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    walls.push(wall3);

    var wall4 = new THREE.Mesh(wall3Geometry, wallMaterial);
    wall4.position.set(BASE_X + 10, 3, BASE_Z);
    wall4.castShadow = true;
    wall4.receiveShadow = true;
    walls.push(wall4);

    var group = new THREE.Group();
    var i = 0;
    while (i < walls.length) {
      group.add(walls[i]);
      i = i + 1;
    }
    return group;
  }

  function createFairyFlagTower() {
    var geometry = new THREE.BoxGeometry(4, 10, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(BASE_X + 12, 5, BASE_Z - 12);
    tower.castShadow = true;
    tower.receiveShadow = true;

    var flagPoleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var flagPole = new THREE.Mesh(flagPoleGeometry, poleMaterial);
    flagPole.position.set(BASE_X + 12, 13, BASE_Z - 12);
    flagPole.castShadow = true;
    flagPole.receiveShadow = true;

    var group = new THREE.Group();
    group.add(tower);
    group.add(flagPole);
    return group;
  }

  function createNavalDefence() {
    var mounts = [];

    var mount1Geometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 16);
    var mountMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var mount1 = new THREE.Mesh(mount1Geometry, mountMaterial);
    mount1.position.set(BASE_X - 15, 4, BASE_Z + 25);
    mount1.castShadow = true;
    mount1.receiveShadow = true;
    mounts.push(mount1);

    var mount2 = new THREE.Mesh(mount1Geometry, mountMaterial);
    mount2.position.set(BASE_X + 5, 4, BASE_Z + 25);
    mount2.castShadow = true;
    mount2.receiveShadow = true;
    mounts.push(mount2);

    var seawallGeometry = new THREE.BoxGeometry(25, 3, 2);
    var seawallMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var seawall = new THREE.Mesh(seawallGeometry, seawallMaterial);
    seawall.position.set(BASE_X - 5, 1.5, BASE_Z + 25);
    seawall.castShadow = true;
    seawall.receiveShadow = true;
    mounts.push(seawall);

    var group = new THREE.Group();
    var j = 0;
    while (j < mounts.length) {
      group.add(mounts[j]);
      j = j + 1;
    }
    return group;
  }

  function createLonghouse() {
    var geometry = new THREE.BoxGeometry(14, 4, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var longhouse = new THREE.Mesh(geometry, material);
    longhouse.position.set(BASE_X - 25, 2, BASE_Z - 15);
    longhouse.castShadow = true;
    longhouse.receiveShadow = true;

    var roofGeometry = new THREE.ConeGeometry(7.5, 3, 4);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(BASE_X - 25, 5.5, BASE_Z - 15);
    roof.castShadow = true;
    roof.receiveShadow = true;

    var group = new THREE.Group();
    group.add(longhouse);
    group.add(roof);
    return group;
  }

  function createGardenWalls() {
    var walls = [];

    var wall1Geometry = new THREE.BoxGeometry(12, 2, 1);
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });

    var wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall1.position.set(BASE_X + 20, 1, BASE_Z - 10);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    walls.push(wall1);

    var wall2 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall2.position.set(BASE_X + 20, 1, BASE_Z + 10);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    walls.push(wall2);

    var wall3Geometry = new THREE.BoxGeometry(1, 2, 12);
    var wall3 = new THREE.Mesh(wall3Geometry, wallMaterial);
    wall3.position.set(BASE_X + 14, 1, BASE_Z);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    walls.push(wall3);

    var wall4 = new THREE.Mesh(wall3Geometry, wallMaterial);
    wall4.position.set(BASE_X + 26, 1, BASE_Z);
    wall4.castShadow = true;
    wall4.receiveShadow = true;
    walls.push(wall4);

    var group = new THREE.Group();
    var k = 0;
    while (k < walls.length) {
      group.add(walls[k]);
      k = k + 1;
    }
    return group;
  }

  function createPipersTower() {
    var geometry = new THREE.CylinderGeometry(2, 2, 12, 16);
    var material = new THREE.MeshLambertMaterial({ color: 0x999999 });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(BASE_X - 30, 6, BASE_Z + 8);
    tower.castShadow = true;
    tower.receiveShadow = true;

    var platformGeometry = new THREE.CylinderGeometry(3, 3, 1, 16);
    var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(BASE_X - 30, 13, BASE_Z + 8);
    platform.castShadow = true;
    platform.receiveShadow = true;

    var group = new THREE.Group();
    group.add(tower);
    group.add(platform);
    return group;
  }

  function build() {
    var structures = [];

    structures.push(createMainTower());
    structures.push(createSeaGate());
    structures.push(createCurtainWalls());
    structures.push(createFairyFlagTower());
    structures.push(createNavalDefence());
    structures.push(createLonghouse());
    structures.push(createGardenWalls());
    structures.push(createPipersTower());

    var dunveganBase = new THREE.Group();
    var m = 0;
    while (m < structures.length) {
      dunveganBase.add(structures[m]);
      m = m + 1;
    }

    return dunveganBase;
  }

  return {
    build: build
  };
}());
