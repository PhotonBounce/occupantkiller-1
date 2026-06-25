window.VoidStation = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var debris = [];
  var bulkheads = [];
  var scene = null;

  var init = function(inScene, camera) {
    scene = inScene;
    objects = [];
    lights = [];
    debris = [];
    bulkheads = [];

    buildHalls();
    buildObservationDeck();
    buildDebris();
    buildBulkheads();
    buildLighting();
  };

  var buildHalls = function() {
    var hallMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, emissive: 0x111111 });
    var i, j, hall, wall;

    for (i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var x = Math.cos(angle) * 15;
      var z = Math.sin(angle) * 15;

      hall = new THREE.Mesh(
        new THREE.BoxGeometry(8, 6, 20),
        hallMaterial
      );
      hall.position.set(x, 0, z);
      hall.rotation.y = angle;
      scene.add(hall);
      objects.push(hall);

      for (j = 0; j < 3; j++) {
        wall = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 4, 5),
          new THREE.MeshPhongMaterial({ color: 0x444444 })
        );
        wall.position.set(x + 4, 1.5, z + (j - 1) * 8);
        wall.rotation.y = angle;
        scene.add(wall);
        objects.push(wall);
      }
    }
  };

  var buildObservationDeck = function() {
    var hull = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 18, 3, 32),
      new THREE.MeshPhongMaterial({ color: 0x1a1a2e, emissive: 0x0a0a0f })
    );
    hull.position.set(0, 0, 0);
    scene.add(hull);
    objects.push(hull);

    var window1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, 0.2, 16),
      new THREE.MeshPhongMaterial({ color: 0x0a0a1a, emissive: 0x001a3a })
    );
    window1.position.set(18, 2, 0);
    scene.add(window1);
    objects.push(window1);

    var window2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, 0.2, 16),
      new THREE.MeshPhongMaterial({ color: 0x0a0a1a, emissive: 0x001a3a })
    );
    window2.position.set(-18, 2, 0);
    scene.add(window2);
    objects.push(window2);
  };

  var buildDebris = function() {
    var debrisMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x333333 }),
      new THREE.MeshPhongMaterial({ color: 0xaaaaaa, emissive: 0x444444 }),
      new THREE.MeshPhongMaterial({ color: 0x666666, emissive: 0x222222 })
    ];

    var i, mesh, x, y, z, type, material, scale;

    for (i = 0; i < 12; i++) {
      x = (Math.random() - 0.5) * 40;
      y = (Math.random() - 0.5) * 30;
      z = (Math.random() - 0.5) * 40;

      type = Math.floor(Math.random() * 3);
      material = debrisMaterials[type];
      scale = 0.3 + Math.random() * 0.7;

      if (type === 0) {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 2),
          material
        );
      } else if (type === 1) {
        mesh = new THREE.Mesh(
          new THREE.ConeGeometry(0.8, 2, 8),
          material
        );
      } else {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(1, 8, 8),
          material
        );
      }

      mesh.scale.set(scale, scale, scale);
      mesh.position.set(x, y, z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.userData.vx = (Math.random() - 0.5) * 0.3;
      mesh.userData.vy = (Math.random() - 0.5) * 0.3;
      mesh.userData.vz = (Math.random() - 0.5) * 0.3;
      mesh.userData.wx = (Math.random() - 0.5) * 2;
      mesh.userData.wy = (Math.random() - 0.5) * 2;
      mesh.userData.wz = (Math.random() - 0.5) * 2;

      scene.add(mesh);
      debris.push(mesh);
    }
  };

  var buildBulkheads = function() {
    var bulkheadMaterial = new THREE.MeshPhongMaterial({ color: 0xff4400, emissive: 0x884400 });
    var i, bulkhead;

    for (i = 0; i < 6; i++) {
      bulkhead = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 8, 1.5, 16),
        bulkheadMaterial
      );
      bulkhead.position.set(0, (i - 2.5) * 8, 25);
      bulkhead.rotation.z = Math.PI * 0.3 * (i % 2);
      scene.add(bulkhead);
      bulkheads.push(bulkhead);
      objects.push(bulkhead);
    }
  };

  var buildLighting = function() {
    var ambientLight = new THREE.AmbientLight(0x003366, 0.3);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var i, light, x, y, z;
    for (i = 0; i < 8; i++) {
      x = (Math.random() - 0.5) * 30;
      y = (Math.random() - 0.5) * 20;
      z = (Math.random() - 0.5) * 30;

      light = new THREE.PointLight(0x00ff88, 0.8, 20);
      light.position.set(x, y, z);
      light.userData.baseIntensity = 0.8;
      light.userData.flicker = Math.random() * 0.3;
      scene.add(light);
      lights.push(light);
    }

    var voidLight = new THREE.DirectionalLight(0x0033aa, 0.2);
    voidLight.position.set(-30, 10, -30);
    scene.add(voidLight);
    lights.push(voidLight);
  };

  var update = function(delta) {
    var i, debris_item, boundary;

    for (i = 0; i < debris.length; i++) {
      debris_item = debris[i];

      debris_item.position.x += debris_item.userData.vx * delta;
      debris_item.position.y += debris_item.userData.vy * delta;
      debris_item.position.z += debris_item.userData.vz * delta;

      debris_item.rotation.x += debris_item.userData.wx * delta;
      debris_item.rotation.y += debris_item.userData.wy * delta;
      debris_item.rotation.z += debris_item.userData.wz * delta;

      boundary = 25;
      if (debris_item.position.x > boundary) debris_item.position.x = -boundary;
      if (debris_item.position.x < -boundary) debris_item.position.x = boundary;
      if (debris_item.position.y > boundary) debris_item.position.y = -boundary;
      if (debris_item.position.y < -boundary) debris_item.position.y = boundary;
      if (debris_item.position.z > boundary) debris_item.position.z = -boundary;
      if (debris_item.position.z < -boundary) debris_item.position.z = boundary;
    }

    for (i = 0; i < bulkheads.length; i++) {
      bulkheads[i].rotation.z += 0.1 * delta;
    }

    var time = Date.now() * 0.001;
    for (i = 0; i < lights.length; i++) {
      if (lights[i].isPointLight) {
        var flick = lights[i].userData.flicker;
        var phase = time * 2 + i * 0.5;
        var flicker = 0.7 + 0.3 * Math.sin(phase * 3) * Math.sin(phase * 7);
        lights[i].intensity = lights[i].userData.baseIntensity * flicker * (0.9 + flick * Math.sin(phase));
      }
    }
  };

  var reset = function() {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (i = 0; i < debris.length; i++) {
      scene.remove(debris[i]);
    }
    for (i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    for (i = 0; i < bulkheads.length; i++) {
      scene.remove(bulkheads[i]);
    }
    objects = [];
    debris = [];
    lights = [];
    bulkheads = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
