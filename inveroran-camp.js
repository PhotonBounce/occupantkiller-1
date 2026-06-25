window.InveroranCamp = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addBox(scene, x, y, z, sx, sy, sz, color) {
    var geometry = new THREE.BoxGeometry(sx, sy, sz);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addCylinder(scene, x, y, z, radiusTop, radiusBottom, height, color) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 8);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addSphere(scene, x, y, z, radius, color) {
    var geometry = new THREE.SphereGeometry(radius, 8, 8);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addPointLight(scene, x, y, z, color, intensity) {
    var light = new THREE.PointLight(color, intensity);
    light.position.set(x, y, z);
    scene.add(light);
    lights.push(light);
    return light;
  }

  function addWireFence(scene, startX, startZ, length, height, color) {
    var material = new THREE.LineBasicMaterial({ color: color });
    var points = [];
    var spacing = 2;

    for (var i = 0; i <= length; i += spacing) {
      points.push(new THREE.Vector3(startX + i, 0, startZ));
      points.push(new THREE.Vector3(startX + i, height, startZ));
    }

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);
    objects.push(lines);

    for (var j = 0; j <= length; j += spacing) {
      addCylinder(scene, startX + j, height / 2, startZ, 0.3, 0.3, height, 0x444444);
    }
  }

  function build(scene) {
    objects = [];
    lights = [];

    addBox(scene, 0, 5, 0, 16, 10, 6, 0xDDDDCC);

    addBox(scene, -10, 0.5, -15, 20, 1, 20, 0x888877);
    addBox(scene, -20, 1, -25, 1.5, 2, 1.5, 0x888877);
    addBox(scene, -20, 1, -5, 1.5, 2, 1.5, 0x888877);
    addBox(scene, 0, 1, -25, 1.5, 2, 1.5, 0x888877);
    addBox(scene, 0, 1, -5, 1.5, 2, 1.5, 0x888877);

    addBox(scene, -35, 0.25, 20, 30, 0.5, 8, 0x887766);

    addBox(scene, 15, 3, 10, 8, 6, 5, 0x665544);

    addBox(scene, -25, 1.5, 5, 4, 2.5, 4, 0x5a6040);
    addBox(scene, -15, 1.5, 5, 4, 2.5, 4, 0x5a6040);
    addBox(scene, -5, 1.5, 5, 4, 2.5, 4, 0x5a6040);
    addBox(scene, 5, 1.5, 5, 4, 2.5, 4, 0x5a6040);
    addBox(scene, 15, 1.5, 5, 4, 2.5, 4, 0x5a6040);
    addBox(scene, 25, 1.5, 5, 4, 2.5, 4, 0x5a6040);

    addBox(scene, -20, 2, -5, 12, 4, 8, 0xFFFFFF);
    addCylinder(scene, -14, 5, -5, 0.8, 0.8, 4, 0x555555);

    addBox(scene, 20, 1, 15, 2, 1, 2, 0x556600);
    addBox(scene, 20, 2.5, 15, 2, 1, 2, 0x556600);
    addBox(scene, 22, 1, 15, 2, 1, 2, 0x556600);
    addBox(scene, 22, 2.5, 15, 2, 1, 2, 0x556600);

    addWireFence(scene, -35, 15, 50, 2, 0x333333);

    var ambientLight = new THREE.AmbientLight(0x9AAABB, 0.5);
    scene.add(ambientLight);

    addPointLight(scene, -10, 4, 0, 0xFFCC66, 0.8);
    addPointLight(scene, 10, 4, 10, 0xFFCC66, 0.8);
    addPointLight(scene, 0, 4, -20, 0xFFCC66, 0.8);
  }

  function update(delta) {
    var flickerSpeed = 3;
    for (var i = 0; i < lights.length; i++) {
      var light = lights[i];
      var flicker = 0.8 + Math.sin(Date.now() * 0.005 * (i + 1)) * 0.2;
      light.intensity = flicker;
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
  }

  return {
    build: build,
    update: update,
    reset: reset,
    getObjects: function() { return objects; },
    getLights: function() { return lights; }
  };
}());
