window.PortobelloBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addBox(x, y, z, w, h, d, color) {
    var geometry = new THREE.BoxGeometry(w, h, d);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    objects.push(mesh);
    return mesh;
  }

  function addCylinder(x, y, z, radiusTop, radiusBottom, height, color) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    objects.push(mesh);
    return mesh;
  }

  function addSphere(x, y, z, radius, color) {
    var geometry = new THREE.SphereGeometry(radius, 32, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    objects.push(mesh);
    return mesh;
  }

  function addCone(x, y, z, radius, height, color) {
    var geometry = new THREE.ConeGeometry(radius, height, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    objects.push(mesh);
    return mesh;
  }

  function addPointLight(x, y, z, color, intensity) {
    var light = new THREE.PointLight(color, intensity);
    light.position.set(x, y, z);
    lights.push(light);
    return light;
  }

  function buildPromenade(scene) {
    var wall = addBox(0, 1, 0, 50, 3, 2, 0x888877);
    scene.add(wall);

    var cannonCount = 5;
    for (var i = 0; i < cannonCount; i++) {
      var xPos = -20 + (i * 10);
      var cannonBase = addCylinder(xPos, 1.5, -1.5, 1.5, 1.5, 1.2, 0x555555);
      scene.add(cannonBase);
    }
  }

  function buildSwimCentre(scene) {
    var building = addBox(-15, 8, 20, 24, 16, 8, 0x8B3A3A);
    scene.add(building);

    var doorLeft = addBox(-20, 6, 24, 2, 4, 0.5, 0x1E3A8A);
    scene.add(doorLeft);

    var doorRight = addBox(-10, 6, 24, 2, 4, 0.5, 0x1E3A8A);
    scene.add(doorRight);
  }

  function buildPierRuins(scene) {
    var deck = addBox(25, 0.25, 35, 15, 0.5, 8, 0x8B5E3C);
    scene.add(deck);

    var frameCount = 8;
    for (var i = 0; i < frameCount; i++) {
      var xPos = 17.5 + (i * 2);
      var support = addCylinder(xPos, -2, 35, 0.6, 0.6, 4, 0xAA6655);
      scene.add(support);
    }
  }

  function buildLandingCraft(scene) {
    var craft = addBox(5, 1, -25, 12, 2, 4, 0x778877);
    craft.userData.isLandingCraft = true;
    craft.userData.baseY = 1;
    craft.userData.swayAmount = 0;
    scene.add(craft);
  }

  function buildAntiTankObstacles(scene) {
    var positions = [
      { x: -10, z: -15 },
      { x: 0, z: -12 },
      { x: 10, z: -14 },
      { x: -5, z: -8 },
      { x: 5, z: -10 },
      { x: 15, z: -13 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var tooth = addCone(positions[i].x, 1, positions[i].z, 0.8, 2, 0x888888);
      scene.add(tooth);
    }
  }

  function buildTerraces(scene) {
    var startX = -30;
    var spacing = 10;

    for (var i = 0; i < 5; i++) {
      var xPos = startX + (i * spacing);
      var house = addBox(xPos, 5, 25, 8, 10, 6, 0x999988);
      scene.add(house);

      var door = addBox(xPos, 3, 28, 1.5, 3, 0.3, 0x1E3A8A);
      scene.add(door);
    }
  }

  function buildSandDunes(scene) {
    var dunePositions = [
      { x: 35, y: 1.5, z: -20 },
      { x: 40, y: 2, z: -15 },
      { x: 45, y: 1.8, z: -10 },
      { x: 38, y: 1.5, z: -5 }
    ];

    for (var i = 0; i < dunePositions.length; i++) {
      var dune = addSphere(dunePositions[i].x, dunePositions[i].y, dunePositions[i].z, 3, 0xCCBB88);
      scene.add(dune);

      var bunker = addBox(dunePositions[i].x, 1.5, dunePositions[i].z, 6, 2, 4, 0x666666);
      bunker.userData.isBunker = true;
      scene.add(bunker);
    }
  }

  function buildChimney(scene) {
    var chimney = addCylinder(50, 15, 15, 4, 4, 30, 0x8B3A3A);
    scene.add(chimney);
  }

  function buildLampPosts(scene) {
    var startX = -40;
    var spacing = 10;
    var lampCount = 10;

    for (var i = 0; i < lampCount; i++) {
      var xPos = startX + (i * spacing);
      var post = addCylinder(xPos, 4, 0, 0.4, 0.4, 8, 0x333333);
      scene.add(post);

      var light = addPointLight(xPos, 8, 0, 0xFFEE88, 0.8);
      scene.add(light);
    }
  }

  function init(scene) {
    buildPromenade(scene);
    buildSwimCentre(scene);
    buildPierRuins(scene);
    buildLandingCraft(scene);
    buildAntiTankObstacles(scene);
    buildTerraces(scene);
    buildSandDunes(scene);
    buildChimney(scene);
    buildLampPosts(scene);

    var ambientColor = 0x99AABB;
    var ambientLight = new THREE.AmbientLight(ambientColor, 0.6);
    lights.push(ambientLight);
    scene.add(ambientLight);

    for (var i = 0; i < objects.length; i++) {
      scene.add(objects[i]);
    }

    for (var j = 0; j < lights.length; j++) {
      if (lights[j] !== ambientLight) {
        scene.add(lights[j]);
      }
    }
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.userData && obj.userData.isLandingCraft) {
        obj.userData.swayAmount = Math.sin(Date.now() * 0.001) * 0.3;
        obj.position.y = obj.userData.baseY + obj.userData.swayAmount;
      }
    }
  }

  function reset(scene) {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    lights = [];
  }

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
