window.LochTayBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var interiorLight = null;

  var createMesh = function(geometry, color, x, y, z) {
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    objects.push(mesh);
    return mesh;
  };

  var addLight = function(type, color, intensity, x, y, z, distance) {
    var light;
    if (type === 'point') {
      light = new THREE.PointLight(color, intensity, distance || 100);
    } else if (type === 'ambient') {
      light = new THREE.AmbientLight(color, intensity);
    }
    light.position.set(x, y, z);
    lights.push(light);
    return light;
  };

  var buildCrannog = function(scene) {
    var crannog = createMesh(
      new THREE.BoxGeometry(16, 1, 16),
      0x5C3A1E,
      0, 0, 0
    );
    scene.add(crannog);
  };

  var buildRoundhouse = function(scene) {
    var cylinder = createMesh(
      new THREE.CylinderGeometry(5, 5, 4, 32),
      0x8B6914,
      0, 1, 0
    );
    scene.add(cylinder);

    var cone = createMesh(
      new THREE.ConeGeometry(6, 4, 32),
      0x8B6914,
      0, 5, 0
    );
    scene.add(cone);
  };

  var buildCommsTower = function(scene) {
    var tower = createMesh(
      new THREE.BoxGeometry(6, 12, 6),
      0x778877,
      8, 6, 8
    );
    scene.add(tower);
  };

  var buildPylons = function(scene) {
    var positions = [
      [-5, -3, -5],
      [5, -3, -5],
      [-5, -3, 5],
      [5, -3, 5],
      [-3, -3, 0],
      [3, -3, 0]
    ];

    var i;
    for (i = 0; i < positions.length; i = i + 1) {
      var pylon = createMesh(
        new THREE.CylinderGeometry(0.6, 0.6, 6, 16),
        0x4a3A2a,
        positions[i][0], positions[i][1], positions[i][2]
      );
      scene.add(pylon);
    }
  };

  var buildCauseway = function(scene) {
    var causeway = createMesh(
      new THREE.BoxGeometry(20, 0.5, 3),
      0x6B4C2A,
      -10, 0.2, 0
    );
    scene.add(causeway);
  };

  var buildMortarPosition = function(scene) {
    var angle;
    var i;
    for (i = 0; i < 8; i = i + 1) {
      angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * 7;
      var z = Math.sin(angle) * 7;
      var bag = createMesh(
        new THREE.BoxGeometry(1, 1, 1),
        0xC2A06E,
        x, 0.5, z
      );
      scene.add(bag);
    }
  };

  var buildSupplyHuts = function(scene) {
    var positions = [
      [-8, 1, -6],
      [-8, 1, 0],
      [-8, 1, 6]
    ];

    var i;
    for (i = 0; i < positions.length; i = i + 1) {
      var hut = createMesh(
        new THREE.BoxGeometry(5, 3, 4),
        0x4a5240,
        positions[i][0], positions[i][1], positions[i][2]
      );
      scene.add(hut);
    }
  };

  var buildMist = function(scene) {
    var i;
    for (i = 0; i < 5; i = i + 1) {
      var mist = createMesh(
        new THREE.BoxGeometry(30, 0.3, 30),
        0x8899AA,
        0, -0.5 + (i * 0.3), 0
      );
      mist.material.transparent = true;
      mist.material.opacity = 0.3;
      scene.add(mist);
    }
  };

  var buildFloats = function(scene) {
    var positions = [
      [-12, 0.5, -12],
      [12, 0.5, -12],
      [-12, 0.5, 12],
      [12, 0.5, 12],
      [0, 0.5, -14],
      [0, 0.5, 14]
    ];

    var i;
    for (i = 0; i < positions.length; i = i + 1) {
      var float = createMesh(
        new THREE.SphereGeometry(1, 16, 16),
        0xFF6600,
        positions[i][0], positions[i][1], positions[i][2]
      );
      scene.add(float);
    }
  };

  var setupLighting = function(scene) {
    var ambientLight = addLight(
      'ambient',
      0xFFCCBB,
      0.5,
      0, 0, 0
    );
    scene.add(ambientLight);

    interiorLight = addLight(
      'point',
      0xFF5500,
      0.9,
      0, 2, 0,
      20
    );
    scene.add(interiorLight);
  };

  var init = function(scene) {
    buildCrannog(scene);
    buildRoundhouse(scene);
    buildCommsTower(scene);
    buildPylons(scene);
    buildCauseway(scene);
    buildMortarPosition(scene);
    buildSupplyHuts(scene);
    buildMist(scene);
    buildFloats(scene);
    setupLighting(scene);
  };

  var update = function(delta) {
    if (interiorLight) {
      interiorLight.intensity = 0.7 + Math.sin(Date.now() * 0.003) * 0.2;
    }
  };

  var reset = function(scene) {
    var i;
    for (i = objects.length - 1; i >= 0; i = i - 1) {
      scene.remove(objects[i]);
    }
    for (i = lights.length - 1; i >= 0; i = i - 1) {
      scene.remove(lights[i]);
    }
    objects = [];
    lights = [];
    interiorLight = null;
  };

  return {
    init: init,
    update: update,
    reset: reset,
    getObjects: function() {
      return objects;
    },
    getLights: function() {
      return lights;
    }
  };
}());
