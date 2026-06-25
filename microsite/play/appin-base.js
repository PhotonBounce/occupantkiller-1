window.AppinBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var signalLamp = null;
  var signalFlashTime = 0;
  var signalFlashInterval = 1.5;

  function addMesh(geometry, material, x, y, z, scene) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addLight(light, scene) {
    scene.add(light);
    lights.push(light);
    return light;
  }

  function buildEnvironment(scene) {
    // Castle Stalker main tower - 8x22x8 box, grey stone
    var castleGeometry = new THREE.BoxGeometry(8, 22, 8);
    var castleMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });
    addMesh(castleGeometry, castleMaterial, 0, 11, 0, scene);

    // Island rock base - irregular box clusters
    var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x666655 });
    addMesh(new THREE.BoxGeometry(12, 3, 10), rockMaterial, -2, -1.5, 2, scene);
    addMesh(new THREE.BoxGeometry(10, 2.5, 12), rockMaterial, 3, -1.25, -3, scene);
    addMesh(new THREE.BoxGeometry(8, 2, 8), rockMaterial, -4, -1, -4, scene);

    // Wooden gangway bridge - series of planks
    var plankMaterial = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    var plankGeometry = new THREE.BoxGeometry(1, 0.5, 8);
    for (var i = 0; i < 6; i++) {
      addMesh(plankGeometry, plankMaterial, -10 + (i * 1.2), 2, 0, scene);
    }

    // Machine gun nest sandbag ring on castle roof
    var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xC2A06E });
    var sandbagGeometry = new THREE.BoxGeometry(1, 1, 1.5);
    var ringRadius = 3;
    for (var j = 0; j < 8; j++) {
      var angle = (j / 8) * Math.PI * 2;
      var sx = Math.cos(angle) * ringRadius;
      var sz = Math.sin(angle) * ringRadius;
      addMesh(sandbagGeometry, sandbagMaterial, sx, 22, sz, scene);
    }

    // Signal lamp on top
    var lampGeometry = new THREE.BoxGeometry(1, 1, 1);
    var lampMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    signalLamp = addMesh(lampGeometry, lampMaterial, 0, 24, 0, scene);

    // Signal lamp point light
    var pointLight = new THREE.PointLight(0xFFFFFF, 1.5, 40);
    pointLight.position.set(0, 24, 0);
    addLight(pointLight, scene);

    // Shore supply base - 12x4x8 box
    var supplyGeometry = new THREE.BoxGeometry(12, 4, 8);
    var supplyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5240 });
    addMesh(supplyGeometry, supplyMaterial, -25, 2, 0, scene);

    // Ammunition depot - 8x4x6 box
    var ammoGeometry = new THREE.BoxGeometry(8, 4, 6);
    var ammoMaterial = new THREE.MeshLambertMaterial({ color: 0x334433 });
    addMesh(ammoGeometry, ammoMaterial, -35, 2, 5, scene);

    // Loch patrol boat - 10x2x3 box
    var boatGeometry = new THREE.BoxGeometry(10, 2, 3);
    var boatMaterial = new THREE.MeshLambertMaterial({ color: 0x667788 });
    addMesh(boatGeometry, boatMaterial, 15, 1, -10, scene);

    // Perimeter pontoon markers - 4 small spheres
    var pontoonGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    var pontoonMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    addMesh(pontoonGeometry, pontoonMaterial, 20, 0.8, 15, scene);
    addMesh(pontoonGeometry, pontoonMaterial, -20, 0.8, 15, scene);
    addMesh(pontoonGeometry, pontoonMaterial, 25, 0.8, -20, scene);
    addMesh(pontoonGeometry, pontoonMaterial, -25, 0.8, -20, scene);

    // Ambient loch-light
    var ambientLight = new THREE.AmbientLight(0xCCDDEE, 0.7);
    addLight(ambientLight, scene);
  }

  function update(delta) {
    signalFlashTime += delta;
    if (signalFlashTime > signalFlashInterval) {
      signalFlashTime = 0;
    }
    var flashIntensity = signalFlashTime / signalFlashInterval;
    if (flashIntensity > 0.5) {
      flashIntensity = 1 - flashIntensity;
    }
    flashIntensity = flashIntensity * 2;
    if (signalLamp) {
      signalLamp.material.color.setHex(0xFFFFFF);
      signalLamp.material.emissive.setScalar(flashIntensity);
    }
    if (lights.length > 1) {
      lights[lights.length - 1].intensity = 1.5 + (flashIntensity * 0.5);
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
    signalLamp = null;
  }

  return {
    buildEnvironment: buildEnvironment,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
