window.BurntislandFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var pierLightTime = 0;
  var pierLight = null;

  function addBox(scene, x, y, z, width, height, depth, color) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addCylinder(scene, x, y, z, radiusTop, radiusBottom, height, color) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addCone(scene, x, y, z, radius, height, color) {
    var geometry = new THREE.ConeGeometry(radius, height, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addSphere(scene, x, y, z, radius, color) {
    var geometry = new THREE.SphereGeometry(radius, 32, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addLight(scene, type, color, intensity, x, y, z) {
    var light;
    if (type === 'ambient') {
      light = new THREE.AmbientLight(color, intensity);
      scene.add(light);
    } else if (type === 'point') {
      light = new THREE.PointLight(color, intensity, 100);
      light.position.set(x, y, z);
      scene.add(light);
    }
    lights.push(light);
    return light;
  }

  function init(scene) {
    objects = [];
    lights = [];

    addLight(scene, 'ambient', 0x9999AA, 0.6);

    addBox(scene, 0, 5, -30, 10, 10, 8, 0x998877);
    addBox(scene, 2, 12, -30, 4, 12, 4, 0x998877);

    addBox(scene, -40, 6, 0, 12, 12, 12, 0x776655);

    addBox(scene, 20, 2.5, 20, 2, 5, 24, 0x888888);
    addBox(scene, 20, 2.5, -20, 2, 5, 24, 0x888888);

    addBox(scene, -60, 5, 0, 28, 10, 18, 0x667788);

    addCylinder(scene, -65, 8, -10, 1, 1, 16, 0x556677);
    addCylinder(scene, -65, 8, 10, 1, 1, 16, 0x556677);
    addCylinder(scene, -55, 8, -10, 1, 1, 16, 0x556677);
    addCylinder(scene, -55, 8, 10, 1, 1, 16, 0x556677);

    addBox(scene, 50, 2, 30, 6, 4, 6, 0xCC4422);
    addBox(scene, 60, 2, 30, 6, 4, 6, 0xCC4422);
    addBox(scene, 70, 2, 30, 6, 4, 6, 0xCC4422);
    addBox(scene, 50, 2, 50, 6, 4, 6, 0x22AACC);
    addBox(scene, 60, 2, 50, 6, 4, 6, 0x22AACC);
    addBox(scene, 70, 2, 50, 6, 4, 6, 0x22AACC);

    addBox(scene, 0, 1.5, -60, 1, 3, 20, 0x5C4030);
    addBox(scene, 20, 1.5, -60, 1, 3, 20, 0x5C4030);
    addBox(scene, 20, 1.5, -40, 1, 3, 20, 0x5C4030);
    addBox(scene, 0, 1.5, -40, 1, 3, 20, 0x5C4030);

    pierLight = addCylinder(scene, 80, 5, 60, 1, 1, 10, 0xFFFFFF);
    addCone(scene, 80, 10.5, 60, 1.2, 1, 0xFF2200);

    var dockLight1 = addLight(scene, 'point', 0xFFDD00, 1.1, 25, 6, 25);
    var dockLight2 = addLight(scene, 'point', 0xFFDD00, 1.1, 25, 6, -25);
    var dockLight3 = addLight(scene, 'point', 0xFFDD00, 1.1, -20, 6, 0);
  }

  function update(delta) {
    pierLightTime += delta;
    if (pierLight) {
      var flashVal = Math.sin(pierLightTime * 2) * 0.5 + 0.5;
      pierLight.material.emissive.setHex(Math.floor(0xFFFFFF * flashVal));
    }
  }

  function reset(scene) {
    var i;
    for (i = 0; i < objects.length; i += 1) {
      scene.remove(objects[i]);
    }
    for (i = 0; i < lights.length; i += 1) {
      scene.remove(lights[i]);
    }
    objects = [];
    lights = [];
    pierLight = null;
    pierLightTime = 0;
  }

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
