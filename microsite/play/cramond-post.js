window.CramondPost = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addbox(x, y, z, w, h, d, color, scene) {
    var geom = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addcylinder(x, y, z, r, h, color, scene) {
    var geom = new THREE.CylinderGeometry(r, r, h, 16);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addsphere(x, y, z, r, color, scene) {
    var geom = new THREE.SphereGeometry(r, 16, 16);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addcone(x, y, z, r, h, color, scene) {
    var geom = new THREE.ConeGeometry(r, h, 16);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addlines(points, color, scene) {
    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    var mesh = new THREE.LineSegments(geom, mat);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function init(scene) {
    var stone = 0x998866;
    var cream = 0xCCBBAA;
    var tidal = 0x888877;
    var concrete = 0x778877;
    var white = 0xFFFFFF;
    var light_grey = 0xCCCCDD;
    var heron_white = 0xCCCCCC;
    var chain_dark = 0x444433;
    var torch_orange = 0xFF6600;

    addbox(-12, 0.5, 0, 1, 5, 24, stone, scene);
    addbox(12, 0.5, 0, 1, 5, 24, stone, scene);
    addbox(0, 0.5, -12, 24, 5, 1, stone, scene);
    addbox(0, 0.5, 12, 24, 5, 1, stone, scene);

    addcylinder(-12, 4, -12, 2, 8, stone, scene);
    addcylinder(-12, 4, 12, 2, 8, stone, scene);
    addcylinder(12, 4, -12, 2, 8, stone, scene);
    addcylinder(12, 4, 12, 2, 8, stone, scene);

    addbox(-6, 0.5, -4, 10, 3, 6, cream, scene);
    addbox(-6, 0.5, 4, 10, 3, 6, cream, scene);
    addbox(0, 0.5, -8, 10, 3, 6, cream, scene);

    addbox(30, 0.5, 15, 50, 0.5, 4, tidal, scene);

    addbox(32, 2, 17, 4, 2, 4, concrete, scene);
    addbox(32, 3, 17, 1, 0.5, 2, 0x000000, scene);

    var boom_pts = [
      -25, 3, 20,
      25, 3, 20,
      25, 3.5, 20,
      -25, 3.5, 20
    ];
    addlines(boom_pts, chain_dark, scene);

    addbox(0, 2.5, -20, 10, 5, 8, white, scene);

    addbox(-8, 0.25, 6, 12, 1, 8, stone, scene);
    addbox(-8, 0.25, 12, 12, 1, 8, stone, scene);

    addcylinder(-10, 2, 18, 0.4, 4, heron_white, scene);
    addbox(-9.5, 3.5, 18, 0.6, 1.2, 1.8, heron_white, scene);

    var ambientLight = new THREE.AmbientLight(light_grey, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var torch1 = new THREE.PointLight(torch_orange, 0.8, 20);
    torch1.position.set(-10, 6, -8);
    scene.add(torch1);
    lights.push(torch1);

    var torch2 = new THREE.PointLight(torch_orange, 0.8, 20);
    torch2.position.set(10, 6, 8);
    scene.add(torch2);
    lights.push(torch2);

    var torch3 = new THREE.PointLight(torch_orange, 0.8, 20);
    torch3.position.set(0, 7, -15);
    scene.add(torch3);
    lights.push(torch3);
  }

  function update(delta) {
    var torchFlicker = 0.9 + Math.sin(Date.now() * 0.005) * 0.1;
    for (var i = 1; i < lights.length; i++) {
      lights[i].intensity = 0.8 * torchFlicker;
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = 0; j < lights.length; j++) {
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
