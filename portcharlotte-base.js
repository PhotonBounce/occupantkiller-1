window.PortCharlotteBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addbox(scene, x, y, z, w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addcylinder(scene, x, y, z, radius, height, color) {
    var geo = new THREE.CylinderGeometry(radius, radius, height, 16);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addsphere(scene, x, y, z, radius, color) {
    var geo = new THREE.SphereGeometry(radius, 16, 16);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addcone(scene, x, y, z, radius, height, color) {
    var geo = new THREE.ConeGeometry(radius, height, 16);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addline(scene, x1, y1, z1, x2, y2, z2, color) {
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array([
      x1, y1, z1,
      x2, y2, z2
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    var line = new THREE.LineSegments(geo, mat);
    scene.add(line);
    objects.push(line);
    return line;
  }

  function build(scene) {
    var barracksX = 0;
    var barracksY = 5;
    var barracksZ = 0;
    addbox(scene, barracksX, barracksY, barracksZ, 20, 10, 5, 0x4a5240);

    var officersX = -25;
    var officersY = 4;
    var officersZ = -15;
    addbox(scene, officersX, officersY, officersZ, 12, 8, 6, 0x556655);

    var supplyX = 30;
    var supplyY = 2;
    var supplyZ = 10;
    addbox(scene, supplyX, supplyY, supplyZ, 16, 4, 12, 0x555555);

    var poolX = -35;
    var poolY = 1;
    var poolZ = 25;
    addbox(scene, poolX, poolY, poolZ, 3, 2, 3, 0x666666);
    addbox(scene, poolX + 6, poolY, poolZ, 3, 2, 3, 0x666666);
    addbox(scene, poolX + 12, poolY, poolZ, 3, 2, 3, 0x666666);

    var fuelX = 40;
    var fuelY = 2;
    var fuelZ = -30;
    addcylinder(scene, fuelX, fuelY, fuelZ, 2, 4, 0x6B7355);
    addcylinder(scene, fuelX + 6, fuelY, fuelZ, 2, 4, 0x6B7355);
    addcylinder(scene, fuelX + 12, fuelY, fuelZ, 2, 4, 0x6B7355);
    addcylinder(scene, fuelX + 18, fuelY, fuelZ, 2, 4, 0x6B7355);

    var perimeterCorners = [
      [-60, -60],
      [-60, 60],
      [60, 60],
      [60, -60]
    ];

    var postCount = 0;
    var i;
    for (i = 0; i < perimeterCorners.length; i++) {
      var x0 = perimeterCorners[i][0];
      var z0 = perimeterCorners[i][0];
      var x1 = perimeterCorners[(i + 1) % perimeterCorners.length][0];
      var z1 = perimeterCorners[(i + 1) % perimeterCorners.length][1];

      var dx = x1 - x0;
      var dz = z1 - z0;
      var dist = Math.sqrt(dx * dx + dz * dz);
      var stepSize = 8;
      var steps = Math.floor(dist / stepSize);

      var j;
      for (j = 0; j <= steps; j++) {
        var px = x0 + (dx / dist) * j * stepSize;
        var pz = z0 + (dz / dist) * j * stepSize;
        addbox(scene, px, 1.5, pz, 0.2, 3, 0.2, 0x888888);
        if (j < steps) {
          addbox(scene, px + (dx / dist) * 4, 2.5, pz + (dz / dist) * 4, 0.2, 0.5, 8, 0x888888);
        }
      }
    }

    var gateX = -60;
    var gateY = 2.5;
    var gateZ = 0;
    addbox(scene, gateX, gateY, gateZ, 1, 5, 1, 0x444444);
    addbox(scene, gateX + 4, gateY, gateZ, 1, 5, 1, 0x444444);
    addbox(scene, gateX + 2, gateY + 2.5, gateZ, 5, 0.5, 1, 0x444444);

    var paradesX = -15;
    var paradesZ = -40;
    var markerSpacing = 4;
    var k;
    for (k = 0; k < 5; k++) {
      var m;
      for (m = 0; m < 5; m++) {
        addbox(scene, paradesX + k * markerSpacing, 0.25, paradesZ + m * markerSpacing, 0.5, 0.5, 0.5, 0xFFFFFF);
      }
    }

    var mastX = 50;
    var mastY = 10;
    var mastZ = 40;
    addcylinder(scene, mastX, mastY, mastZ, 0.2, 20, 0x333333);
    addsphere(scene, mastX, mastY + 10, mastZ, 0.8, 0xFF0000);

    var cornerpositions = [
      [-60, -60],
      [-60, 60],
      [60, 60],
      [60, -60]
    ];

    var c;
    for (c = 0; c < cornerpositions.length; c++) {
      var cx = cornerpositions[c][0];
      var cz = cornerpositions[c][1];
      var light = new THREE.PointLight(0xFFFFFF, 0.7, 100);
      light.position.set(cx, 8, cz);
      scene.add(light);
      lights.push(light);
    }
  }

  function update(delta) {
    var d;
    for (d = 0; d < objects.length; d++) {
      if (objects[d].geometry.type === 'SphereGeometry') {
        objects[d].rotation.y += 0.01 * delta;
      }
    }
  }

  function reset(scene) {
    var o;
    for (o = 0; o < objects.length; o++) {
      scene.remove(objects[o]);
    }
    objects = [];

    var l;
    for (l = 0; l < lights.length; l++) {
      scene.remove(lights[l]);
    }
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
