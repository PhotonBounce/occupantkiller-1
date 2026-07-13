window.ColonsayFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var antennaGroup = null;

  function createMonasteryWalls(scene) {
    // L-shaped arrangement of monastery walls
    // Vertical section: 1x6x12
    var wallVertMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var wallVertGeo = new THREE.BoxGeometry(1, 6, 12);
    var wallVert = new THREE.Mesh(wallVertGeo, wallVertMat);
    wallVert.position.set(-6, 3, 0);
    scene.add(wallVert);
    objects.push(wallVert);

    // Horizontal section: 12x6x1
    var wallHorizGeo = new THREE.BoxGeometry(12, 6, 1);
    var wallHoriz = new THREE.Mesh(wallHorizGeo, wallVertMat);
    wallHoriz.position.set(0, 3, 6);
    scene.add(wallHoriz);
    objects.push(wallHoriz);
  }

  function createPrioryTower(scene) {
    // Main tower: 6x14x6
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var towerGeo = new THREE.BoxGeometry(6, 14, 6);
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 7, 0);
    scene.add(tower);
    objects.push(tower);

    // Crenellations on top (four 2x2x2 boxes)
    var crennelMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var crennelGeo = new THREE.BoxGeometry(2, 2, 2);

    var crennel1 = new THREE.Mesh(crennelGeo, crennelMat);
    crennel1.position.set(-2.5, 15, -2.5);
    scene.add(crennel1);
    objects.push(crennel1);

    var crennel2 = new THREE.Mesh(crennelGeo, crennelMat);
    crennel2.position.set(2.5, 15, -2.5);
    scene.add(crennel2);
    objects.push(crennel2);

    var crennel3 = new THREE.Mesh(crennelGeo, crennelMat);
    crennel3.position.set(-2.5, 15, 2.5);
    scene.add(crennel3);
    objects.push(crennel3);

    var crennel4 = new THREE.Mesh(crennelGeo, crennelMat);
    crennel4.position.set(2.5, 15, 2.5);
    scene.add(crennel4);
    objects.push(crennel4);
  }

  function createChapel(scene) {
    // Converted chapel command center: 10x5x8
    var chapelMat = new THREE.MeshLambertMaterial({ color: 0xBBAA99 });
    var chapelGeo = new THREE.BoxGeometry(10, 5, 8);
    var chapel = new THREE.Mesh(chapelGeo, chapelMat);
    chapel.position.set(8, 2.5, -10);
    scene.add(chapel);
    objects.push(chapel);
  }

  function createStoneCross(scene) {
    var crossMat = new THREE.MeshLambertMaterial({ color: 0x999988 });

    // Vertical: 1x6x1
    var vertGeo = new THREE.BoxGeometry(1, 6, 1);
    var vert = new THREE.Mesh(vertGeo, crossMat);
    vert.position.set(-8, 3, -8);
    scene.add(vert);
    objects.push(vert);

    // Horizontal: 4x1x1
    var horizGeo = new THREE.BoxGeometry(4, 1, 1);
    var horiz = new THREE.Mesh(horizGeo, crossMat);
    horiz.position.set(-8, 4, -8);
    scene.add(horiz);
    objects.push(horiz);
  }

  function createVikinBurial(scene) {
    // Low hemisphere: sphere scaled to y 0.3
    var burialMat = new THREE.MeshLambertMaterial({ color: 0x4a3520 });
    var burialGeo = new THREE.SphereGeometry(4, 16, 16);
    var burial = new THREE.Mesh(burialGeo, burialMat);
    burial.scale.y = 0.3;
    burial.position.set(-10, 0.5, 8);
    scene.add(burial);
    objects.push(burial);
  }

  function createAntennaArray(scene) {
    antennaGroup = new THREE.Group();
    var antennaMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    // 3 thin cylinders: radius 0.3, height 6
    var antennaGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);

    var antenna1 = new THREE.Mesh(antennaGeo, antennaMat);
    antenna1.position.set(-2, 0, 0);
    antennaGroup.add(antenna1);
    objects.push(antenna1);

    var antenna2 = new THREE.Mesh(antennaGeo, antennaMat);
    antenna2.position.set(0, 0, 0);
    antennaGroup.add(antenna2);
    objects.push(antenna2);

    var antenna3 = new THREE.Mesh(antennaGeo, antennaMat);
    antenna3.position.set(2, 0, 0);
    antennaGroup.add(antenna3);
    objects.push(antenna3);

    antennaGroup.position.set(0, 18, 0);
    scene.add(antennaGroup);
  }

  function createDock(scene) {
    // Dock platform: 14x1x3
    var dockMat = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    var dockGeo = new THREE.BoxGeometry(14, 1, 3);
    var dock = new THREE.Mesh(dockGeo, dockMat);
    dock.position.set(10, 0.5, 12);
    scene.add(dock);
    objects.push(dock);

    // Cylinder posts: radius 0.4, height 1
    var postMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 1, 8);

    var post1 = new THREE.Mesh(postGeo, postMat);
    post1.position.set(3, 0.5, 12);
    scene.add(post1);
    objects.push(post1);

    var post2 = new THREE.Mesh(postGeo, postMat);
    post2.position.set(17, 0.5, 12);
    scene.add(post2);
    objects.push(post2);

    var post3 = new THREE.Mesh(postGeo, postMat);
    post3.position.set(10, 0.5, 10);
    scene.add(post3);
    objects.push(post3);

    var post4 = new THREE.Mesh(postGeo, postMat);
    post4.position.set(10, 0.5, 14);
    scene.add(post4);
    objects.push(post4);
  }

  function createHedgehog(scene, x, z) {
    // Crossed box pairs for hedgehog obstacle
    var hedgeMat = new THREE.MeshLambertMaterial({ color: 0x555555 });

    // First pair (X-aligned)
    var hedgeGeo1 = new THREE.BoxGeometry(2, 1.5, 0.4);
    var hedge1a = new THREE.Mesh(hedgeGeo1, hedgeMat);
    hedge1a.position.set(x - 1, 0.75, z);
    hedge1a.rotation.z = Math.PI / 4;
    scene.add(hedge1a);
    objects.push(hedge1a);

    var hedge1b = new THREE.Mesh(hedgeGeo1, hedgeMat);
    hedge1b.position.set(x + 1, 0.75, z);
    hedge1b.rotation.z = Math.PI / 4;
    scene.add(hedge1b);
    objects.push(hedge1b);

    // Second pair (Z-aligned)
    var hedgeGeo2 = new THREE.BoxGeometry(0.4, 1.5, 2);
    var hedge2a = new THREE.Mesh(hedgeGeo2, hedgeMat);
    hedge2a.position.set(x, 0.75, z - 1);
    hedge2a.rotation.x = Math.PI / 4;
    scene.add(hedge2a);
    objects.push(hedge2a);

    var hedge2b = new THREE.Mesh(hedgeGeo2, hedgeMat);
    hedge2b.position.set(x, 0.75, z + 1);
    hedge2b.rotation.x = Math.PI / 4;
    scene.add(hedge2b);
    objects.push(hedge2b);
  }

  function createSeagullPerches(scene) {
    // Small white spheres on thin posts
    var perchMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var perchGeo = new THREE.SphereGeometry(0.3, 8, 8);

    var postMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var postGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 4);

    // Perch positions
    var positions = [
      [-4, 9],
      [4, 9],
      [-4, -9],
      [4, -9],
      [12, 10],
      [12, -12]
    ];

    var i;
    for (i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var post = new THREE.Mesh(postGeo, postMat);
      post.position.set(pos[0], 1, pos[1]);
      scene.add(post);
      objects.push(post);

      var perch = new THREE.Mesh(perchGeo, perchMat);
      perch.position.set(pos[0], 3, pos[1]);
      scene.add(perch);
      objects.push(perch);
    }
  }

  function createLights(scene) {
    // Ambient light: soft overcast 0xCCBBAA, intensity 0.8
    var ambientLight = new THREE.AmbientLight(0xCCBBAA, 0.8);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Dock light: point light 0xFFEE88
    var dockLight = new THREE.PointLight(0xFFEE88, 1.5, 40);
    dockLight.position.set(10, 3, 12);
    scene.add(dockLight);
    lights.push(dockLight);
  }

  function build(scene) {
    createMonasteryWalls(scene);
    createPrioryTower(scene);
    createChapel(scene);
    createStoneCross(scene);
    createVikinBurial(scene);
    createAntennaArray(scene);
    createDock(scene);
    createHedgehog(scene, -12, -4);
    createHedgehog(scene, 6, -14);
    createHedgehog(scene, 14, 6);
    createSeagullPerches(scene);
    createLights(scene);
  }

  function update(delta) {
    if (antennaGroup) {
      antennaGroup.rotation.y += delta * 0.5;
    }
  }

  function reset(scene) {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    lights = [];

    antennaGroup = null;
  }

  return {
    build: build,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
