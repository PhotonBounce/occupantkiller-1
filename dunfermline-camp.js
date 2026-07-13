window.DunfermlineCamp = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addCube(scene, width, height, depth, color, x, y, z) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addCylinder(scene, radiusTop, radiusBottom, height, segments, color, x, y, z) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addSphere(scene, radius, widthSegments, heightSegments, color, x, y, z) {
    var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addCone(scene, radius, height, segments, color, x, y, z) {
    var geometry = new THREE.ConeGeometry(radius, height, segments);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addArcWindowBox(scene, x, y, z) {
    var frameBox = addCube(scene, 0.5, 4, 0.5, 0x776655, x, y, z);
    var arch = addCone(scene, 2.2, 1, 16, 0x998877, x, y + 2.5, z);
    return frameBox;
  }

  function addTent(scene, x, y, z) {
    var base = addCube(scene, 4, 0.2, 2.5, 0x5a6040, x, y, z);
    var pole1 = addCylinder(scene, 0.15, 0.15, 2, 8, 0x444444, x - 1.5, y + 1, z);
    var pole2 = addCylinder(scene, 0.15, 0.15, 2, 8, 0x444444, x + 1.5, y + 1, z);
    var canopy = addCone(scene, 2.2, 1.8, 16, 0x5a6040, x, y + 1.2, z);
    return base;
  }

  function addBattlement(scene, x, y, z) {
    var battlement = addCube(scene, 1.5, 0.8, 1.5, 0x776655, x, y, z);
    return battlement;
  }

  function addArcWindow(scene, x, y, z) {
    var frame = addCube(scene, 0.4, 3.5, 0.4, 0x776655, x, y, z);
    var arch = addSphere(scene, 2, 16, 16, 0x998877, x, y + 2.2, z);
    return frame;
  }

  function init(scene) {
    objects = [];
    lights = [];

    var ambientLight = new THREE.AmbientLight(0xFFCC88, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var floodLight1 = new THREE.PointLight(0xFFEE88, 1.2, 50);
    floodLight1.position.set(15, 20, 15);
    scene.add(floodLight1);
    lights.push(floodLight1);

    var floodLight2 = new THREE.PointLight(0xFFEE88, 1.2, 50);
    floodLight2.position.set(-15, 20, 15);
    scene.add(floodLight2);
    lights.push(floodLight2);

    var floodLight3 = new THREE.PointLight(0xFFEE88, 1.2, 50);
    floodLight3.position.set(15, 20, -15);
    scene.add(floodLight3);
    lights.push(floodLight3);

    var floodLight4 = new THREE.PointLight(0xFFEE88, 1.2, 50);
    floodLight4.position.set(-15, 20, -15);
    scene.add(floodLight4);
    lights.push(floodLight4);

    addCube(scene, 26, 12, 16, 0x998877, 0, 6, 0);

    addArcWindowBox(scene, -13.5, 8, 0);
    addArcWindowBox(scene, 13.5, 8, 0);
    addArcWindowBox(scene, -13.5, 8, 8);
    addArcWindowBox(scene, 13.5, 8, 8);

    var towerBase = addCube(scene, 8, 22, 8, 0x776655, -12, 11, -10);
    addBattlement(scene, -16, 22.5, -10);
    addBattlement(scene, -8, 22.5, -10);
    addBattlement(scene, -12, 22.5, -6);
    addBattlement(scene, -12, 22.5, -14);

    var palaceBase = addCube(scene, 16, 6, 12, 0x998877, 18, 3, 0);
    var collapsedSection = addCube(scene, 5, 4, 4, 0x776655, 20, 2.5, 3);

    var plinth = addCube(scene, 2, 1, 2, 0x998877, 0, 0.5, 15);
    var tombMarker = addCube(scene, 4, 3, 4, 0xCCBBAA, 0, 2.5, 15);

    var cottage = addCube(scene, 8, 5, 6, 0x998877, -25, 2.5, 8);

    var helipad = addCube(scene, 12, 0.3, 12, 0x444444, 8, 0.2, -25);
    var hLetter1 = addCube(scene, 0.3, 2, 0.3, 0xFFFFFF, 6, 1.5, -25);
    var hLetter2 = addCube(scene, 0.3, 2, 0.3, 0xFFFFFF, 10, 1.5, -25);
    var hCross = addCube(scene, 2, 0.3, 0.3, 0xFFFFFF, 8, 2.2, -25);

    var tentPositions = [
      [ -20, 0, -15 ],
      [ -15, 0, -15 ],
      [ -25, 0, -10 ],
      [ -15, 0, -5 ],
      [ -22, 0, 0 ],
      [ -18, 0, 5 ]
    ];

    var i = 0;
    for (i = 0; i < tentPositions.length; i++) {
      var pos = tentPositions[i];
      addTent(scene, pos[0], pos[1], pos[2]);
    }

    var aaBase = addCube(scene, 5, 1, 5, 0x444444, 25, 0.5, 8);
    var barrel1 = addCylinder(scene, 0.4, 0.4, 3, 16, 0x444444, 22, 2, 6);
    var barrel2 = addCylinder(scene, 0.4, 0.4, 3, 16, 0x444444, 28, 2, 6);
    var barrel3 = addCylinder(scene, 0.4, 0.4, 3, 16, 0x444444, 22, 2, 10);
    var barrel4 = addCylinder(scene, 0.4, 0.4, 3, 16, 0x444444, 28, 2, 10);

    barrel1.name = 'aa_barrel_1';
    barrel2.name = 'aa_barrel_2';
    barrel3.name = 'aa_barrel_3';
    barrel4.name = 'aa_barrel_4';
  }

  function update(delta) {
    var j = 0;
    for (j = 0; j < objects.length; j++) {
      var obj = objects[j];
      if (obj.name === 'aa_barrel_1' || obj.name === 'aa_barrel_2' || obj.name === 'aa_barrel_3' || obj.name === 'aa_barrel_4') {
        obj.rotation.z += delta * 0.3;
      }
    }
  }

  function reset(scene) {
    var k = 0;
    for (k = 0; k < objects.length; k++) {
      scene.remove(objects[k]);
    }
    for (k = 0; k < lights.length; k++) {
      scene.remove(lights[k]);
    }
    objects = [];
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
