window.KilliecrankieFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createGoalCliffs(scene) {
    var cliffMaterial = new THREE.MeshLambertMaterial({ color: 0x554433 });

    var leftCliffGeom = new THREE.BoxGeometry(3, 30, 20);
    var leftCliff = new THREE.Mesh(leftCliffGeom, cliffMaterial);
    leftCliff.position.set(-12, 0, 0);
    scene.add(leftCliff);
    objects.push(leftCliff);

    var rightCliffGeom = new THREE.BoxGeometry(3, 30, 20);
    var rightCliff = new THREE.Mesh(rightCliffGeom, cliffMaterial);
    rightCliff.position.set(12, 0, 0);
    scene.add(rightCliff);
    objects.push(rightCliff);
  }

  function createMilitaryBridge(scene) {
    var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });

    var span1Geom = new THREE.BoxGeometry(3, 1, 14);
    var span1 = new THREE.Mesh(span1Geom, bridgeMaterial);
    span1.position.set(-4, -5, 0);
    scene.add(span1);
    objects.push(span1);

    var span2Geom = new THREE.BoxGeometry(3, 1, 14);
    var span2 = new THREE.Mesh(span2Geom, bridgeMaterial);
    span2.position.set(0, -5, 0);
    scene.add(span2);
    objects.push(span2);

    var span3Geom = new THREE.BoxGeometry(3, 1, 14);
    var span3 = new THREE.Mesh(span3Geom, bridgeMaterial);
    span3.position.set(4, -5, 0);
    scene.add(span3);
    objects.push(span3);
  }

  function createCairn(scene) {
    var cairnMaterial = new THREE.MeshLambertMaterial({ color: 0x888866 });

    var baseRadius = 1.5;
    var baseHeight = 0.8;
    var sphereCount = 4;

    for (var row = 0; row < sphereCount; row++) {
      var rowRadius = baseRadius - (row * 0.3);
      var rowHeight = baseHeight + (row * 1.2);
      var sphereCount2 = Math.max(1, sphereCount - row);

      for (var i = 0; i < sphereCount2; i++) {
        var angle = (i / sphereCount2) * Math.PI * 2;
        var xPos = Math.cos(angle) * rowRadius;
        var zPos = Math.sin(angle) * rowRadius;

        var sphereGeom = new THREE.SphereGeometry(0.4, 8, 8);
        var sphere = new THREE.Mesh(sphereGeom, cairnMaterial);
        sphere.position.set(xPos - 15, rowHeight, zPos + 10);
        scene.add(sphere);
        objects.push(sphere);
      }
    }
  }

  function createVisitorsCentre(scene) {
    var centreMaterial = new THREE.MeshLambertMaterial({ color: 0x778877 });

    var centreGeom = new THREE.BoxGeometry(10, 5, 8);
    var centre = new THREE.Mesh(centreGeom, centreMaterial);
    centre.position.set(-18, 0, -12);
    scene.add(centre);
    objects.push(centre);
  }

  function createSoldierLeap(scene) {
    var leapMaterial = new THREE.MeshLambertMaterial({ color: 0x555544 });

    var leftPlatformGeom = new THREE.BoxGeometry(4, 1, 8);
    var leftPlatform = new THREE.Mesh(leftPlatformGeom, leapMaterial);
    leftPlatform.position.set(-8, -6, 15);
    scene.add(leftPlatform);
    objects.push(leftPlatform);

    var rightPlatformGeom = new THREE.BoxGeometry(4, 1, 8);
    var rightPlatform = new THREE.Mesh(rightPlatformGeom, leapMaterial);
    rightPlatform.position.set(8, -6, 15);
    scene.add(rightPlatform);
    objects.push(rightPlatform);
  }

  function createHowitzer(scene) {
    var howMaterial = new THREE.MeshLambertMaterial({ color: 0x556633 });

    var bodyGeom = new THREE.BoxGeometry(4, 2, 6);
    var body = new THREE.Mesh(bodyGeom, howMaterial);
    body.position.set(0, -4, -18);
    scene.add(body);
    objects.push(body);

    var barrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 6, 12);
    var barrel = new THREE.Mesh(barrelGeom, howMaterial);
    barrel.position.set(0, -3, -15);
    barrel.rotation.z = Math.PI / 2;
    scene.add(barrel);
    objects.push(barrel);
  }

  function createTrenches(scene) {
    var trenchMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3520 });

    for (var i = 0; i < 3; i++) {
      var trenchGeom = new THREE.BoxGeometry(20, 2, 2);
      var trench = new THREE.Mesh(trenchGeom, trenchMaterial);
      trench.position.set(0, -8, 5 + (i * 4));
      scene.add(trench);
      objects.push(trench);
    }
  }

  function createScotsPines(scene) {
    var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
    var topMaterial = new THREE.MeshLambertMaterial({ color: 0x3d5c1e });

    var treePositions = [
      [-20, 5, 5],
      [-15, 5, 0],
      [-10, 5, 8],
      [15, 5, 3],
      [18, 5, -2],
      [10, 5, -5]
    ];

    for (var i = 0; i < treePositions.length; i++) {
      var pos = treePositions[i];

      var trunkGeom = new THREE.CylinderGeometry(0.8, 0.8, 10, 12);
      var trunk = new THREE.Mesh(trunkGeom, trunkMaterial);
      trunk.position.set(pos[0], pos[1], pos[2]);
      trunk.name = 'tree_trunk_' + i;
      scene.add(trunk);
      objects.push(trunk);

      var topGeom = new THREE.ConeGeometry(2.5, 6, 12);
      var top = new THREE.Mesh(topGeom, topMaterial);
      top.position.set(pos[0], pos[1] + 8, pos[2]);
      top.name = 'tree_top_' + i;
      scene.add(top);
      objects.push(top);
    }
  }

  function createBagpipePlaque(scene) {
    var plaqueMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var letterMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var plaqueGeom = new THREE.BoxGeometry(2, 3, 0.3);
    var plaque = new THREE.Mesh(plaqueGeom, plaqueMaterial);
    plaque.position.set(-25, 2, 0);
    scene.add(plaque);
    objects.push(plaque);

    var letterPositions = [
      [-0.5, 0.5, 0],
      [0, 0.5, 0],
      [0.5, 0.5, 0],
      [-0.5, -0.5, 0],
      [0, -0.5, 0]
    ];

    for (var i = 0; i < letterPositions.length; i++) {
      var letterGeom = new THREE.BoxGeometry(0.3, 0.4, 0.2);
      var letter = new THREE.Mesh(letterGeom, letterMaterial);
      letter.position.set(-25 + letterPositions[i][0], 2 + letterPositions[i][1], 0.2);
      scene.add(letter);
      objects.push(letter);
    }
  }

  function createLights(scene) {
    var ambientLight = new THREE.AmbientLight(0x778866, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var pathLight1 = new THREE.PointLight(0xFFCC44, 0.8, 30);
    pathLight1.position.set(-10, 2, 0);
    scene.add(pathLight1);
    lights.push(pathLight1);

    var pathLight2 = new THREE.PointLight(0xFFCC44, 0.8, 30);
    pathLight2.position.set(10, 2, 0);
    scene.add(pathLight2);
    lights.push(pathLight2);

    var pathLight3 = new THREE.PointLight(0xFFCC44, 0.8, 30);
    pathLight3.position.set(0, 2, 10);
    scene.add(pathLight3);
    lights.push(pathLight3);
  }

  function initialize(scene) {
    createGoalCliffs(scene);
    createMilitaryBridge(scene);
    createCairn(scene);
    createVisitorsCentre(scene);
    createSoldierLeap(scene);
    createHowitzer(scene);
    createTrenches(scene);
    createScotsPines(scene);
    createBagpipePlaque(scene);
    createLights(scene);
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.name && obj.name.indexOf('tree_top_') === 0) {
        var swayAmount = Math.sin(time * 0.5 + i) * 0.02;
        obj.rotation.z = swayAmount;
        obj.rotation.x = swayAmount * 0.5;
      }
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    lights = [];
  }

  return {
    initialize: initialize,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
