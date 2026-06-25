window.ArdBegKeep = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var brazierLights = [];
  var scene = null;

  function addMesh(geometry, material, x, y, z) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addLight(light, x, y, z) {
    if (x !== undefined) {
      light.position.set(x, y, z);
    }
    scene.add(light);
    lights.push(light);
    return light;
  }

  function init(sceneRef) {
    scene = sceneRef;
    objects = [];
    lights = [];
    brazierLights = [];

    // Main keep tower (8x16x8 box, rough stone 0x777766)
    var keepGeo = new THREE.BoxGeometry(8, 16, 8);
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
    addMesh(keepGeo, stoneMat, 0, 8, 0);

    // Battlements on top (8 alternating crenellations: 2x2x2 boxes)
    var battlementGeo = new THREE.BoxGeometry(2, 2, 2);
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var radius = 5;
      var bx = Math.cos(angle) * radius;
      var bz = Math.sin(angle) * radius;
      addMesh(battlementGeo, stoneMat, bx, 17, bz);
    }

    // Distillery annex (10x6x14 box, white 0xEEEEDD)
    var annexGeo = new THREE.BoxGeometry(10, 6, 14);
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
    addMesh(annexGeo, whiteMat, 12, 3, 0);

    // Warehouse row (3 buildings: 8x5x6 each, dark grey 0x556655)
    var warehouseGeo = new THREE.BoxGeometry(8, 5, 6);
    var greyMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    addMesh(warehouseGeo, greyMat, -15, 2.5, -10);
    addMesh(warehouseGeo, greyMat, -15, 2.5, 0);
    addMesh(warehouseGeo, greyMat, -15, 2.5, 10);

    // Stone sea wall (30x3x2 box, grey 0x888888)
    var wallGeo = new THREE.BoxGeometry(30, 3, 2);
    var seaWallMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    addMesh(wallGeo, seaWallMat, 0, 1.5, -20);

    // Watchtower at corner (4x18x4, darker stone 0x665544)
    var towerGeo = new THREE.BoxGeometry(4, 18, 4);
    var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
    addMesh(towerGeo, darkStoneMat, 12, 9, -12);

    // Rusted iron gate (2x4x0.5 box, rust orange 0x8B4513)
    var gateGeo = new THREE.BoxGeometry(2, 4, 0.5);
    var rustMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    addMesh(gateGeo, rustMat, 0, 2, 10);

    // Wooden barrels stacked outside (cylinders: radius 0.6, height 1, brown 0x8B4513)
    var barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 1, 8);
    for (var j = 0; j < 5; j++) {
      addMesh(barrelGeo, rustMat, -10 + j * 2, 0.5, 8);
    }

    // Fire braziers at gate (small sphere orange 0xFF6600 elevated on cylinder stands)
    var brazierSphereGeo = new THREE.SphereGeometry(0.5, 8, 8);
    var brazierMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    var standGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6);
    var standMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    addMesh(standGeo, standMat, -1.5, 0.75, 10);
    addMesh(brazierSphereGeo, brazierMat, -1.5, 2.5, 10);

    addMesh(standGeo, standMat, 1.5, 0.75, 10);
    addMesh(brazierSphereGeo, brazierMat, 1.5, 2.5, 10);

    brazierLights.push(addLight(new THREE.PointLight(0xFF6600, 1, 15), -1.5, 2.5, 10));
    brazierLights.push(addLight(new THREE.PointLight(0xFF6600, 1, 15), 1.5, 2.5, 10));

    // Directional warm light (sunset orange 0xFF8844, positioned above scene)
    var sunLight = new THREE.DirectionalLight(0xFF8844, 1);
    addLight(sunLight, 10, 20, 10);

    // Ambient light for general illumination
    var ambientLight = new THREE.AmbientLight(0xCCCCCC, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  function update(delta) {
    var time = Date.now() * 0.001;
    for (var i = 0; i < brazierLights.length; i++) {
      var baseIntensity = 1;
      var flicker = 0.3 * Math.sin(time * 3 + i) + 0.2 * Math.sin(time * 7 + i * 2);
      brazierLights[i].intensity = baseIntensity + flicker;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    lights = [];
    brazierLights = [];
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getObjects: function() { return objects; },
    getLights: function() { return lights; }
  };
}());
