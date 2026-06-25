window.SpeanBridgeCamp = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addBox(x, y, z, w, h, d, color, scene) {
    var geometry = new THREE.BoxGeometry(w, h, d);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addCylinder(x, y, z, radiusTop, radiusBottom, height, color, scene) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addSphere(x, y, z, radius, color, scene) {
    var geometry = new THREE.SphereGeometry(radius, 32, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addCone(x, y, z, radius, height, color, scene) {
    var geometry = new THREE.ConeGeometry(radius, height, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addLight(x, y, z, color, intensity, scene) {
    var light = new THREE.PointLight(color, intensity, 200);
    light.position.set(x, y, z);
    scene.add(light);
    lights.push(light);
    return light;
  }

  function buildCommandoMemorial(scene) {
    var plintheight = 2;
    var plinthbase = addBox(0, plintheight / 2, 0, 6, plintheight, 4, 0x888877, scene);

    var figurewidth = 1;
    var figureheight = 3;
    var figuredepth = 1;
    var darkbronze = 0x8B6914;

    var spacing = 1.5;
    var fig1x = -spacing;
    var fig2x = 0;
    var fig3x = spacing;
    var figury = plintheight + figureheight / 2;

    addBox(fig1x, figury, 0, figurewidth, figureheight, figuredepth, darkbronze, scene);
    addBox(fig2x, figury, 0, figurewidth, figureheight, figuredepth, darkbronze, scene);
    addBox(fig3x, figury, 0, figurewidth, figureheight, figuredepth, darkbronze, scene);
  }

  function buildAssaultCourse(scene) {
    var wallheight = 0.5;
    var wallwidth = 1.5;
    var walllength = 6;

    addBox(-15, wallheight / 2, -5, walllength, wallheight, wallwidth, 0x888877, scene);
    addBox(-15, wallheight / 2, 5, walllength, wallheight, wallwidth, 0x888877, scene);

    var ropeheight = 8;
    var roperad = 0.5;
    addCylinder(-5, ropeheight / 2, -10, roperad, roperad, ropeheight, 0x8B4513, scene);
    addCylinder(5, ropeheight / 2, -10, roperad, roperad, ropeheight, 0x8B4513, scene);

    addBox(-20, 1, -15, 3, 2, 2, 0x555555, scene);
    addBox(20, 1, -15, 3, 2, 2, 0x555555, scene);
  }

  function buildBarracks(scene) {
    var hutlength = 8;
    var hutwidth = 3;
    var hutheight = 4;
    var hutcolor = 0x4a5240;

    var spacing = 12;
    var startx = -18;
    var startz = 10;

    for (var i = 0; i < 4; i = i + 1) {
      var hutx = startx + (i * spacing);
      addBox(hutx, hutheight / 2, startz, hutlength, hutheight, hutwidth, hutcolor, scene);
    }
  }

  function buildWeaponsStorage(scene) {
    var bunkerwidth = 10;
    var bunkerheight = 3;
    var bunkerdepth = 8;
    var concretecolor = 0x555555;
    var sandbagcolor = 0xC2A06E;

    addBox(0, bunkerheight / 2, -25, bunkerwidth, bunkerheight, bunkerdepth, concretecolor, scene);

    var sandbagthick = 0.5;
    addBox(-bunkerwidth / 2, bunkerheight / 2, -25, sandbagthick, bunkerheight, bunkerdepth, sandbagcolor, scene);
    addBox(bunkerwidth / 2, bunkerheight / 2, -25, sandbagthick, bunkerheight, bunkerdepth, sandbagcolor, scene);
    addBox(0, bunkerheight / 2, -25 - bunkerdepth / 2, bunkerwidth, bunkerheight, sandbagthick, sandbagcolor, scene);
    addBox(0, bunkerheight / 2, -25 + bunkerdepth / 2, bunkerwidth, bunkerheight, sandbagthick, sandbagcolor, scene);
  }

  function buildRiverGorge(scene) {
    var cliffheight = 15;
    var clifflength = 30;
    var cliffwidth = 2;
    var rockcolor = 0x445544;

    addBox(-20, cliffheight / 2, 0, cliffwidth, cliffheight, clifflength, rockcolor, scene);
    addBox(20, cliffheight / 2, 0, cliffwidth, cliffheight, clifflength, rockcolor, scene);
  }

  function buildBridge(scene) {
    var archwidth = 2;
    var archheight = 4;
    var archdepth = 1;
    var stonecolor = 0x888877;

    var archpositions = [
      { x: -8, y: 2 },
      { x: -4, y: 3 },
      { x: 0, y: 4 },
      { x: 4, y: 3 },
      { x: 8, y: 2 }
    ];

    for (var i = 0; i < archpositions.length; i = i + 1) {
      var pos = archpositions[i];
      addBox(pos.x, pos.y, -30, archwidth, archheight, archdepth, stonecolor, scene);
    }
  }

  function buildHelipad(scene) {
    var helipadwidth = 12;
    var helipadheight = 0.3;
    var helipadlength = 12;
    var helidarkcolor = 0x444444;

    addBox(0, helipadheight / 2, 30, helipadwidth, helipadheight, helipadlength, helidarkcolor, scene);

    var hlettersize = 1.5;
    var hletterthick = 0.05;
    addBox(-3, helipadheight + 0.1, 30, hlettersize, hlettersize, hletterthick, 0xFFFFFF, scene);
    addBox(3, helipadheight + 0.1, 30, hlettersize, hlettersize, hletterthick, 0xFFFFFF, scene);
  }

  function buildLights(scene) {
    var floodlightcolor = 0xDDEEFF;
    var floodlightintensity = 1.0;

    addLight(-10, 12, -10, floodlightcolor, floodlightintensity, scene);
    addLight(10, 12, -10, floodlightcolor, floodlightintensity, scene);
    addLight(-10, 12, 10, floodlightcolor, floodlightintensity, scene);
    addLight(10, 12, 10, floodlightcolor, floodlightintensity, scene);

    var amblightcolor = 0xFFCC88;
    var amblightintensity = 0.5;
    var amblight = new THREE.AmbientLight(amblightcolor, amblightintensity);
    scene.add(amblight);
    lights.push(amblight);
  }

  function initialize(scene) {
    buildCommandoMemorial(scene);
    buildAssaultCourse(scene);
    buildBarracks(scene);
    buildWeaponsStorage(scene);
    buildRiverGorge(scene);
    buildBridge(scene);
    buildHelipad(scene);
    buildLights(scene);
  }

  var flagangle = 0;

  function update(delta) {
    if (objects.length > 0) {
      flagangle = flagangle + (delta * 0.5);
      var obstacleindex = Math.floor(flagangle / 2) % objects.length;
      var obstacle = objects[obstacleindex];
      if (obstacle) {
        obstacle.rotation.y = obstacle.rotation.y + (delta * 0.3);
      }
    }
  }

  function reset(scene) {
    for (var i = objects.length - 1; i >= 0; i = i - 1) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = lights.length - 1; j >= 0; j = j - 1) {
      scene.remove(lights[j]);
    }
    lights = [];
  }

  return {
    initialize: initialize,
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
