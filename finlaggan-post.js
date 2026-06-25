window.FinlagganPost = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addMesh(geometry, material, position, rotation, scale) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) {
      mesh.position.set(position[0], position[1], position[2]);
    }
    if (rotation) {
      mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
    if (scale) {
      mesh.scale.set(scale[0], scale[1], scale[2]);
    }
    objects.push(mesh);
    return mesh;
  }

  function addLight(color, intensity, position) {
    var light = new THREE.DirectionalLight(color, intensity);
    if (position) {
      light.position.set(position[0], position[1], position[2]);
    }
    lights.push(light);
    return light;
  }

  function build(scene) {
    // Central island platform - large flat stone box
    var platformGeo = new THREE.BoxGeometry(20, 1, 20);
    var platformMat = new THREE.MeshLambertMaterial({
      color: 0x888877
    });
    addMesh(platformGeo, platformMat, [0, 0, 0], [0, 0, 0], [1, 1, 1]);

    // Ancient hall ruin walls - partial walls as tall boxes
    var wallGeo = new THREE.BoxGeometry(1, 5, 8);
    var wallMat = new THREE.MeshLambertMaterial({
      color: 0x667766
    });
    addMesh(wallGeo, wallMat, [-7, 2.5, -5], [0, 0, 0], [1, 1, 1]);
    addMesh(wallGeo, wallMat, [7, 2.5, -5], [0, 0, 0], [1, 1, 1]);
    addMesh(wallGeo, wallMat, [-7, 2.5, 5], [0, 0, 0], [1, 1, 1]);
    addMesh(wallGeo, wallMat, [7, 2.5, 5], [0, 0, 0], [1, 1, 1]);

    // Military command bunker dug into ruins
    var bunkerGeo = new THREE.BoxGeometry(8, 3, 6);
    var bunkerMat = new THREE.MeshLambertMaterial({
      color: 0x778877
    });
    addMesh(bunkerGeo, bunkerMat, [0, 2, 0], [0, 0, 0], [1, 1, 1]);

    // Communications antenna tower - thin cylinder
    var antennaGeo = new THREE.CylinderGeometry(0.5, 0.5, 15, 16);
    var antennaMat = new THREE.MeshLambertMaterial({
      color: 0x444444
    });
    addMesh(antennaGeo, antennaMat, [8, 7.5, 8], [0, 0, 0], [1, 1, 1]);

    // Satellite dish - flattened sphere
    var dishGeo = new THREE.SphereGeometry(1, 32, 32);
    var dishMat = new THREE.MeshLambertMaterial({
      color: 0xAAAAAA
    });
    addMesh(dishGeo, dishMat, [9, 3, 9], [0, 0, 0], [2, 1, 2]);

    // Wooden causeway to island - series of planks
    var plankGeo = new THREE.BoxGeometry(2, 0.5, 8);
    var plankMat = new THREE.MeshLambertMaterial({
      color: 0x8B5E3C
    });
    addMesh(plankGeo, plankMat, [-12, -0.25, 0], [0, 0, 0], [1, 1, 1]);
    addMesh(plankGeo, plankMat, [-18, -0.25, 0], [0, 0, 0], [1, 1, 1]);
    addMesh(plankGeo, plankMat, [-24, -0.25, 0], [0, 0, 0], [1, 1, 1]);

    // Guard posts at causeway end
    var guardGeo = new THREE.BoxGeometry(2, 3, 2);
    var guardMat = new THREE.MeshLambertMaterial({
      color: 0xC2A06E
    });
    addMesh(guardGeo, guardMat, [-26, 1.5, -3], [0, 0, 0], [1, 1, 1]);
    addMesh(guardGeo, guardMat, [-26, 1.5, 3], [0, 0, 0], [1, 1, 1]);

    // Loch marker buoys - small spheres at water level
    var buoyGeo = new THREE.SphereGeometry(0.4, 16, 16);
    var buoyMat = new THREE.MeshLambertMaterial({
      color: 0xFF6600
    });
    addMesh(buoyGeo, buoyMat, [-15, -0.5, 12], [0, 0, 0], [1, 1, 1]);
    addMesh(buoyGeo, buoyMat, [15, -0.5, 12], [0, 0, 0], [1, 1, 1]);
    addMesh(buoyGeo, buoyMat, [-15, -0.5, -12], [0, 0, 0], [1, 1, 1]);
    addMesh(buoyGeo, buoyMat, [15, -0.5, -12], [0, 0, 0], [1, 1, 1]);

    // Historical standing stones
    var stoneGeo = new THREE.BoxGeometry(1, 4, 1);
    var stoneMat = new THREE.MeshLambertMaterial({
      color: 0x999988
    });
    addMesh(stoneGeo, stoneMat, [-10, 2, -8], [0, 0, 0], [1, 1, 1]);
    addMesh(stoneGeo, stoneMat, [10, 2, -8], [0, 0, 0], [1, 1, 1]);
    addMesh(stoneGeo, stoneMat, [-10, 2, 8], [0, 0, 0], [1, 1, 1]);
    addMesh(stoneGeo, stoneMat, [10, 2, 8], [0, 0, 0], [1, 1, 1]);

    // Overhead light - cool daylight
    addLight(0xDDEEFF, 1.0, [0, 30, 0]);

    // Add all meshes and lights to scene
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.add(objects[i]);
    }
    for (i = 0; i < lights.length; i++) {
      scene.add(lights[i]);
    }
  }

  function update(delta) {
    var time = Date.now() * 0.001;
    var buoyIndices = [
      objects.length - 8,
      objects.length - 7,
      objects.length - 6,
      objects.length - 5
    ];

    var i;
    for (i = 0; i < buoyIndices.length; i++) {
      var buoyMesh = objects[buoyIndices[i]];
      if (buoyMesh) {
        buoyMesh.position.y = -0.5 + Math.sin(time + i) * 0.3;
      }
    }
  }

  function reset(scene) {
    var i;
    for (i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    for (i = lights.length - 1; i >= 0; i--) {
      scene.remove(lights[i]);
    }
    objects = [];
    lights = [];
  }

  return {
    build: build,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
