window.FalkirkFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  var FalkirkFort = {};

  FalkirkFort.init = function(scene) {
    var wheelGroup = createWheel();
    scene.add(wheelGroup);

    var gondolas = createGondolas();
    for (var i = 0; i < gondolas.length; i++) {
      scene.add(gondolas[i]);
      objects.push(gondolas[i]);
    }

    var wall = createAntonineWall();
    scene.add(wall);
    objects.push(wall);

    var fort = createRomanFort();
    scene.add(fort);
    objects.push(fort);

    var checkpoint = createCheckpoint();
    scene.add(checkpoint);
    objects.push(checkpoint);

    var tunnel = createTunnel();
    scene.add(tunnel);
    objects.push(tunnel);

    var platform = createHelicopterPlatform();
    scene.add(platform);
    objects.push(platform);

    var barge = createSupplyBarge();
    scene.add(barge);
    objects.push(barge);

    var ambientLight = new THREE.AmbientLight(0x8899AA, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var workLightLeft = new THREE.PointLight(0xCCDDFF, 1.0, 100);
    workLightLeft.position.set(-10, 8, 0);
    scene.add(workLightLeft);
    lights.push(workLightLeft);

    var workLightRight = new THREE.PointLight(0xCCDDFF, 1.0, 100);
    workLightRight.position.set(10, 8, 0);
    scene.add(workLightRight);
    lights.push(workLightRight);

    FalkirkFort.wheelGroup = wheelGroup;
    objects.push(wheelGroup);
  };

  function createWheel() {
    var wheelGroup = new THREE.Group();

    var centralCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 8, 32),
      new THREE.MeshLambertMaterial({ color: 0x334455 })
    );
    centralCylinder.position.y = 0;
    wheelGroup.add(centralCylinder);

    var armLeft = new THREE.Mesh(
      new THREE.BoxGeometry(20, 3, 4),
      new THREE.MeshLambertMaterial({ color: 0x334455 })
    );
    armLeft.position.set(-10, 0, 0);
    armLeft.rotation.z = Math.PI / 4;
    wheelGroup.add(armLeft);

    var armRight = new THREE.Mesh(
      new THREE.BoxGeometry(20, 3, 4),
      new THREE.MeshLambertMaterial({ color: 0x334455 })
    );
    armRight.position.set(10, 0, 0);
    armRight.rotation.z = -Math.PI / 4;
    wheelGroup.add(armRight);

    wheelGroup.position.y = 4;
    wheelGroup.userData.isWheel = true;

    return wheelGroup;
  }

  function createGondolas() {
    var gondolas = [];

    var gondolaPositions = [
      [-14, 12, 0],
      [14, 12, 0],
      [-14, -4, 0],
      [14, -4, 0]
    ];

    for (var i = 0; i < gondolaPositions.length; i++) {
      var gondola = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3, 4),
        new THREE.MeshLambertMaterial({ color: 0xCCCCCC })
      );
      gondola.position.set(gondolaPositions[i][0], gondolaPositions[i][1], gondolaPositions[i][2]);
      gondolas.push(gondola);
    }

    return gondolas;
  }

  function createAntonineWall() {
    var wallGroup = new THREE.Group();

    var wallBody = new THREE.Mesh(
      new THREE.BoxGeometry(30, 6, 2),
      new THREE.MeshLambertMaterial({ color: 0x887766 })
    );
    wallBody.position.set(0, 3, -25);
    wallGroup.add(wallBody);

    for (var i = 0; i < 8; i++) {
      var post = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 6, 0.5),
        new THREE.MeshLambertMaterial({ color: 0x887766 })
      );
      post.position.set(-14 + i * 4, 3, -25);
      wallGroup.add(post);
    }

    return wallGroup;
  }

  function createRomanFort() {
    var fortGroup = new THREE.Group();

    var fortWall = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 12),
      new THREE.MeshLambertMaterial({ color: 0x998877 })
    );
    fortWall.position.set(0, 4, -15);
    fortGroup.add(fortWall);

    var ditch1 = new THREE.Mesh(
      new THREE.BoxGeometry(14, 2, 1),
      new THREE.MeshLambertMaterial({ color: 0x665544 })
    );
    ditch1.position.set(0, 0.5, -21.5);
    fortGroup.add(ditch1);

    var ditch2 = new THREE.Mesh(
      new THREE.BoxGeometry(14, 2, 1),
      new THREE.MeshLambertMaterial({ color: 0x665544 })
    );
    ditch2.position.set(0, 0.5, -8.5);
    fortGroup.add(ditch2);

    return fortGroup;
  }

  function createCheckpoint() {
    var checkpointGroup = new THREE.Group();

    var blocker1 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    blocker1.position.set(-6, 0.75, 20);
    checkpointGroup.add(blocker1);

    var blocker2 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    blocker2.position.set(6, 0.75, 20);
    checkpointGroup.add(blocker2);

    var armBar = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.3, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    armBar.position.set(0, 2, 20);
    checkpointGroup.add(armBar);

    return checkpointGroup;
  }

  function createTunnel() {
    var tunnel = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 3, 32),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    tunnel.position.set(0, 2, 8);
    tunnel.rotation.z = Math.PI / 2;

    return tunnel;
  }

  function createHelicopterPlatform() {
    var platform = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.3, 8),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    platform.position.set(0, 12.5, 0);

    return platform;
  }

  function createSupplyBarge() {
    var barge = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1.5, 4),
      new THREE.MeshLambertMaterial({ color: 0x336633 })
    );
    barge.position.set(0, 0.75, 0);

    return barge;
  }

  FalkirkFort.update = function(delta) {
    if (FalkirkFort.wheelGroup) {
      FalkirkFort.wheelGroup.rotation.z += 0.1 * delta;
    }
  };

  FalkirkFort.reset = function(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
  };

  FalkirkFort.getObjects = function() {
    return objects;
  };

  FalkirkFort.getLights = function() {
    return lights;
  };

  return FalkirkFort;
}());
