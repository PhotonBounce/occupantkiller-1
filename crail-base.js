window.CrailBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  var createGeometry = {
    box: function(w, h, d) {
      return new THREE.BoxGeometry(w, h, d);
    },
    cylinder: function(r, h, segs) {
      return new THREE.CylinderGeometry(r, r, h, segs || 8);
    },
    sphere: function(r, segs) {
      return new THREE.SphereGeometry(r, segs || 8, segs || 8);
    },
    cone: function(r, h, segs) {
      return new THREE.ConeGeometry(r, h, segs || 8);
    },
    line: function(points) {
      return new THREE.BufferGeometry().setFromPoints(points);
    }
  };

  var createMaterial = function(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  };

  var createMesh = function(geometry, color, x, y, z) {
    var material = createMaterial(color);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
  };

  var addObject = function(mesh, scene) {
    objects.push(mesh);
    scene.add(mesh);
  };

  var addLight = function(light, scene) {
    lights.push(light);
    scene.add(light);
  };

  var buildHarbourWalls = function(scene) {
    var grey = 0x888877;

    var wall1 = createMesh(createGeometry.box(1, 4, 20), grey, -5, 2, 0);
    addObject(wall1, scene);

    var wall2 = createMesh(createGeometry.box(1, 4, 14), grey, 5, 2, 5);
    addObject(wall2, scene);
  };

  var buildCottages = function(scene) {
    var white = 0xFFFFFF;
    var positions = [
      [-12, 4, -15],
      [-8, 4, -15],
      [-4, 4, -15],
      [0, 4, -15],
      [4, 4, -15]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var mainBox = createMesh(createGeometry.box(6, 8, 5), white, pos[0], pos[1], pos[2]);
      addObject(mainBox, scene);

      var gable1 = createMesh(createGeometry.box(6, 1, 5), white, pos[0], pos[1] + 4, pos[2]);
      addObject(gable1, scene);

      var gable2 = createMesh(createGeometry.box(6, 0.8, 5), white, pos[0], pos[1] + 4.8, pos[2]);
      addObject(gable2, scene);

      var gable3 = createMesh(createGeometry.box(6, 0.6, 5), white, pos[0], pos[1] + 5.4, pos[2]);
      addObject(gable3, scene);
    }
  };

  var buildTolboothTower = function(scene) {
    var brownStone = 0x887766;

    var mainTower = createMesh(createGeometry.box(4, 12, 4), brownStone, 15, 6, -10);
    addObject(mainTower, scene);

    var step1 = createMesh(createGeometry.box(4, 1.2, 4), brownStone, 15, 13, -10);
    addObject(step1, scene);

    var step2 = createMesh(createGeometry.box(3.8, 1, 3.8), brownStone, 15, 14.2, -10);
    addObject(step2, scene);

    var step3 = createMesh(createGeometry.box(3.6, 0.8, 3.6), brownStone, 15, 15, -10);
    addObject(step3, scene);

    var clockFace = createMesh(createGeometry.box(2.5, 2.5, 0.3), 0xFFEEDD, 15, 11, -6);
    addObject(clockFace, scene);
  };

  var buildCreels = function(scene) {
    var wickerBrown = 0x8B6914;
    var creelSize = 0.8;

    for (var x = -2; x <= 2; x += creelSize) {
      for (var z = -2; z <= 2; z += creelSize) {
        for (var y = 0; y < 2; y++) {
          var creel = createMesh(
            createGeometry.box(creelSize, creelSize, creelSize),
            wickerBrown,
            20 + x,
            1 + (y * creelSize),
            8 + z
          );
          addObject(creel, scene);
        }
      }
    }
  };

  var buildLobsterBoat = function(scene) {
    var boatBlue = 0x2244AA;

    var hull = createMesh(createGeometry.box(8, 1.5, 3), boatBlue, 0, 0.75, 12);
    hull.userData.isBoat = true;
    addObject(hull, scene);

    var cabin = createMesh(createGeometry.box(3, 2, 2), boatBlue, -1, 2.5, 12);
    addObject(cabin, scene);

    var winch = createMesh(createGeometry.cylinder(0.4, 1.2, 6), 0x333333, 3, 1.5, 12);
    addObject(winch, scene);
  };

  var buildCoastwatcher = function(scene) {
    var sandbag = 0xC2A06E;

    var post = createMesh(createGeometry.box(2, 3, 2), sandbag, -10, 3, 20);
    addObject(post, scene);

    var binoculars = createMesh(createGeometry.box(0.6, 0.3, 0.6), 0x222222, -10, 4, 20.5);
    addObject(binoculars, scene);
  };

  var buildCastleRuins = function(scene) {
    var stoneOld = 0x665544;

    var wall1 = createMesh(createGeometry.box(6, 8, 1), stoneOld, -20, 4, -20);
    addObject(wall1, scene);

    var wall2 = createMesh(createGeometry.box(1, 6, 6), stoneOld, -23, 3, -17);
    addObject(wall2, scene);

    var wall3 = createMesh(createGeometry.box(4, 5, 1), stoneOld, -18, 2.5, -14);
    addObject(wall3, scene);
  };

  var buildSmokeHouse = function(scene) {
    var darkWood = 0x5C3A1E;

    var mainBox = createMesh(createGeometry.box(8, 5, 6), darkWood, 25, 2.5, -5);
    mainBox.userData.isSmokeHouse = true;
    addObject(mainBox, scene);

    for (var i = 0; i < 4; i++) {
      var chimney = createMesh(
        createGeometry.cylinder(0.3, 4, 6),
        0x333333,
        22 + (i * 2),
        4,
        -5
      );
      chimney.userData.chimneyIndex = i;
      addObject(chimney, scene);
    }
  };

  var buildLights = function(scene) {
    var ambientLight = new THREE.AmbientLight(0xFFCC66, 0.7);
    addLight(ambientLight, scene);

    var greenNavLight = new THREE.PointLight(0x00BB44, 0.9, 30);
    greenNavLight.position.set(-5, 5, 20);
    addLight(greenNavLight, scene);

    var redNavLight = new THREE.PointLight(0xBB2200, 0.9, 30);
    redNavLight.position.set(5, 5, 20);
    addLight(redNavLight, scene);
  };

  var update = function(delta) {
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];

      if (obj.userData.isBoat) {
        obj.position.y = 0.75 + Math.sin(Date.now() * 0.001) * 0.3;
      }

      if (obj.userData.chimneyIndex !== undefined) {
        var flicker = Math.random() * 0.1;
        obj.scale.y = 1 + flicker;
      }
    }
  };

  var reset = function(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    lights = [];
  };

  var initialize = function(scene) {
    buildHarbourWalls(scene);
    buildCottages(scene);
    buildTolboothTower(scene);
    buildCreels(scene);
    buildLobsterBoat(scene);
    buildCoastwatcher(scene);
    buildCastleRuins(scene);
    buildSmokeHouse(scene);
    buildLights(scene);
  };

  return {
    initialize: initialize,
    update: update,
    reset: reset,
    getObjects: function() { return objects; },
    getLights: function() { return lights; }
  };
}());
