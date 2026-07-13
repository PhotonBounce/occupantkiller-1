window.BlackOps = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lights = [];
  var time = 0;

  var createMaterial = function(color, emissive) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: 0.6,
      roughness: 0.4
    });
  };

  var addToScene = function(mesh) {
    meshes.push(mesh);
    scene.add(mesh);
  };

  var buildCorridor = function() {
    var walls = new THREE.Group();

    var northWall = new THREE.Mesh(
      new THREE.BoxGeometry(40, 3, 0.5),
      createMaterial(0x1a0000, 0x330000)
    );
    northWall.position.z = -20;
    northWall.position.y = 1.5;
    walls.add(northWall);

    var southWall = new THREE.Mesh(
      new THREE.BoxGeometry(40, 3, 0.5),
      createMaterial(0x1a0000, 0x330000)
    );
    southWall.position.z = 20;
    southWall.position.y = 1.5;
    walls.add(southWall);

    var eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 3, 40),
      createMaterial(0x1a0000, 0x330000)
    );
    eastWall.position.x = 20;
    eastWall.position.y = 1.5;
    walls.add(eastWall);

    var westWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 3, 40),
      createMaterial(0x1a0000, 0x330000)
    );
    westWall.position.x = -20;
    westWall.position.y = 1.5;
    walls.add(westWall);

    addToScene(walls);
  };

  var buildServerBank = function() {
    var rack = new THREE.Group();

    for (var i = 0; i < 4; i++) {
      var box = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.8, 2),
        createMaterial(0x0a0a0a, 0x1a1a2e)
      );
      box.position.y = 0.4 + (i * 1.2);
      box.position.x = 8;
      rack.add(box);
    }

    addToScene(rack);
  };

  var buildInterrogationRoom = function() {
    var room = new THREE.Group();

    var box = new THREE.Mesh(
      new THREE.BoxGeometry(8, 2.5, 6),
      createMaterial(0x0f0f0f, 0x1a0000)
    );
    box.position.set(-15, 1.25, 0);
    room.add(box);

    var light = new THREE.PointLight(0xff3333, 1.2, 15);
    light.position.set(-15, 2.2, 0);
    lights.push(light);
    room.add(light);

    addToScene(room);
  };

  var buildVaultDoor = function() {
    var door = new THREE.Group();

    var frame = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 3, 32),
      createMaterial(0x2a2a2a, 0x1a1a1a)
    );
    frame.position.set(0, 1.5, -18);
    door.add(frame);

    var handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      createMaterial(0x444444, 0x0a0a0a)
    );
    handle.position.set(0.8, 1.5, -16.2);
    door.add(handle);

    addToScene(door);
  };

  var buildConfinementCell = function() {
    var cell = new THREE.Group();

    var walls = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2.5, 4),
      createMaterial(0x0a0a0a, 0x0f0f0f)
    );
    walls.position.set(-10, 1.25, 10);
    cell.add(walls);

    var door = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.2, 0.3),
      createMaterial(0x1a1a1a, 0x0a0a0a)
    );
    door.position.set(-9.2, 1.3, 12.2);
    cell.add(door);

    addToScene(cell);
  };

  var buildSurveillanceArray = function() {
    var array = new THREE.Group();

    for (var i = 0; i < 3; i++) {
      var base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16),
        createMaterial(0x0a0a0a, 0x0a0a0a)
      );
      base.position.set(-10 + (i * 5), 2.8, -15);
      array.add(base);

      var lens = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 0.6, 16),
        createMaterial(0x1a3a2e, 0x003333)
      );
      lens.position.set(-10 + (i * 5), 3.5, -15);
      lens.rotation.x = -Math.PI * 0.2;
      array.add(lens);
    }

    addToScene(array);
  };

  var buildHelicopterPad = function() {
    var pad = new THREE.Group();

    var base = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 0.3, 32),
      createMaterial(0x1a1a1a, 0x0a0a0a)
    );
    base.position.y = 4;
    pad.add(base);

    var circle = new THREE.Mesh(
      new THREE.CylinderGeometry(6.5, 6.5, 0.05, 32),
      createMaterial(0x222222, 0x0a0a0a)
    );
    circle.position.y = 4.2;
    pad.add(circle);

    addToScene(pad);
  };

  var buildFloor = function() {
    var floorSize = 50;
    var height = 0.1;

    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(floorSize, height, floorSize),
      createMaterial(0x0f0f0f, 0x0a0a0a)
    );
    floor.position.y = -height / 2;
    floor.receiveShadow = true;

    addToScene(floor);
  };

  var setupLighting = function() {
    var ambient = new THREE.AmbientLight(0x330000, 0.3);
    scene.add(ambient);

    var mainLight = new THREE.DirectionalLight(0xff0000, 0.5);
    mainLight.position.set(10, 10, 10);
    mainLight.castShadow = true;
    scene.add(mainLight);

    var redGlow = new THREE.PointLight(0xff0000, 0.8, 50);
    redGlow.position.set(0, 2, 0);
    lights.push(redGlow);
    scene.add(redGlow);
  };

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    lights = [];
    time = 0;

    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 80, 120);

    buildFloor();
    setupLighting();
    buildCorridor();
    buildServerBank();
    buildInterrogationRoom();
    buildVaultDoor();
    buildConfinementCell();
    buildSurveillanceArray();
    buildHelicopterPad();
  };

  var update = function(delta) {
    time += delta;

    for (var i = 0; i < lights.length; i++) {
      var light = lights[i];
      var pulseAmount = Math.sin(time * 2) * 0.3;
      light.intensity = Math.max(0.3, 0.8 + pulseAmount);
    }

    for (var j = 0; j < meshes.length; j++) {
      if (meshes[j].children) {
        for (var k = 0; k < meshes[j].children.length; k++) {
          var child = meshes[j].children[k];
          if (child.geometry && child.geometry.type === 'SphereGeometry') {
            child.rotation.y += 0.02;
          }
        }
      }
    }
  };

  var reset = function() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    meshes = [];
    lights = [];
    time = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
