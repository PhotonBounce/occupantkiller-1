window.BridgeOfOrchyBase = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var lights = [];
  var radarRotation = 0;
  var helipodFlash = 0;

  function createMaterial(color, emissive) {
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive || 0x000000
    });
    return mat;
  }

  function addMesh(geometry, material, x, y, z) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addLight(type, color, intensity, x, y, z) {
    var light = null;
    if (type === 'ambient') {
      light = new THREE.AmbientLight(color, intensity);
    } else if (type === 'point') {
      light = new THREE.PointLight(color, intensity);
      light.position.set(x, y, z);
    }
    scene.add(light);
    lights.push(light);
    return light;
  }

  function buildHotel() {
    var hotelGeo = new THREE.BoxGeometry(18, 12, 8);
    var hotelMat = createMaterial(0xEEEEDD);
    var hotel = addMesh(hotelGeo, hotelMat, 0, 6, 0);
    return hotel;
  }

  function buildBridge() {
    var bridgeSegments = 8;
    var startX = -15;
    var endX = 15;
    var step = (endX - startX) / bridgeSegments;
    var archHeight = 5;

    for (var i = 0; i < bridgeSegments; i++) {
      var x = startX + (i * step) + (step / 2);
      var progress = i / bridgeSegments;
      var archCurve = Math.sin(progress * Math.PI) * archHeight;
      var segGeo = new THREE.BoxGeometry(step - 0.2, 0.5, 4);
      var segMat = createMaterial(0x888877);
      addMesh(segGeo, segMat, x, 0.25 + archCurve, -8);
    }

    var supportLeft = new THREE.BoxGeometry(1, 3, 4);
    var supportMat = createMaterial(0x888877);
    addMesh(supportLeft, supportMat, startX - 1, 1.5, -8);

    var supportRight = new THREE.BoxGeometry(1, 3, 4);
    addMesh(supportRight, supportMat, endX + 1, 1.5, -8);
  }

  function buildWaymarkers() {
    var positions = [
      [-12, 0, 12],
      [-6, 0, 15],
      [0, 0, 18],
      [6, 0, 15],
      [12, 0, 12],
      [15, 0, 6]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var postGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
      var postMat = createMaterial(0xFFFFFF);
      var post = addMesh(postGeo, postMat, pos[0], pos[1] + 1, pos[2]);

      var signGeo = new THREE.BoxGeometry(0.8, 0.6, 0.1);
      var signMat = createMaterial(0xFF3333);
      addMesh(signGeo, signMat, pos[0], pos[1] + 2.2, pos[2]);
    }
  }

  function buildHelipad() {
    var padGeo = new THREE.BoxGeometry(14, 0.3, 14);
    var padMat = createMaterial(0x444444);
    var pad = addMesh(padGeo, padMat, 8, 0.15, -20);

    var hMarker1Geo = new THREE.BoxGeometry(2, 0.1, 0.5);
    var hMat = createMaterial(0xFFFFFF);
    addMesh(hMarker1Geo, hMat, 8, 0.2, -17);

    var hMarker2Geo = new THREE.BoxGeometry(0.5, 0.1, 2);
    addMesh(hMarker2Geo, hMat, 8, 0.2, -23);
  }

  function buildFuelBowser() {
    var tankGeo = new THREE.CylinderGeometry(2, 2, 3, 12);
    var tankMat = createMaterial(0x556633);
    var tank = addMesh(tankGeo, tankMat, 12, 1.5, 10);

    var wheelGeo = new THREE.BoxGeometry(0.4, 0.8, 0.4);
    var wheelMat = createMaterial(0x222222);
    addMesh(wheelGeo, wheelMat, 11, 0.4, 9.5);
    addMesh(wheelGeo, wheelMat, 13, 0.4, 9.5);
    addMesh(wheelGeo, wheelMat, 11, 0.4, 10.5);
    addMesh(wheelGeo, wheelMat, 13, 0.4, 10.5);
  }

  function buildSupplyStore() {
    var storeGeo = new THREE.BoxGeometry(8, 6, 4);
    var storeMat = createMaterial(0xFF6600);
    addMesh(storeGeo, storeMat, -12, 3, 10);
  }

  function buildMast() {
    var mastGeo = new THREE.CylinderGeometry(0.4, 0.4, 22, 8);
    var mastMat = createMaterial(0x333333);
    var mast = addMesh(mastGeo, mastMat, -20, 11, -15);
  }

  function buildSandbags() {
    var positions = [
      [-3, 0, -3],
      [3, 0, -3],
      [-5, 0, 0],
      [5, 0, 0],
      [-3, 0, 3],
      [3, 0, 3],
      [-6, 0, -1],
      [6, 0, -1],
      [-4, 0, -5],
      [4, 0, -5],
      [-4, 0, 5],
      [4, 0, 5]
    ];

    var bagGeo = new THREE.BoxGeometry(1, 2, 1);
    var bagMat = createMaterial(0xC2A06E);

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      addMesh(bagGeo, bagMat, pos[0], pos[1] + 1, pos[2]);
    }
  }

  function buildSheepPens() {
    var penWallGeo = new THREE.BoxGeometry(6, 1.2, 0.3);
    var penMat = createMaterial(0x888877);

    var penPositions = [
      [15, 0.6, 2],
      [15, 0.6, -2],
      [18, 0.6, 0],
      [12, 0.6, 0]
    ];

    for (var i = 0; i < penPositions.length; i++) {
      var pos = penPositions[i];
      if (i < 2) {
        var wallGeo = new THREE.BoxGeometry(6, 1.2, 0.3);
        addMesh(wallGeo, penMat, pos[0], pos[1], pos[2]);
      } else {
        var wallGeo2 = new THREE.BoxGeometry(0.3, 1.2, 6);
        addMesh(wallGeo2, penMat, pos[0], pos[1], pos[2]);
      }
    }
  }

  function buildScene(sceneRef) {
    scene = sceneRef;
    objects = [];
    lights = [];

    addLight('ambient', 0xCCDDEE, 0.6, 0, 0, 0);

    addLight('point', 0xFFEE88, 0.8, 5, 8, 2);

    buildHotel();
    buildBridge();
    buildWaymarkers();
    buildHelipad();
    buildFuelBowser();
    buildSupplyStore();
    buildMast();
    buildSandbags();
    buildSheepPens();
  }

  function update(delta) {
    radarRotation += delta * 0.5;

    if (objects.length > 0) {
      var lastMesh = objects[objects.length - 1];
      if (lastMesh && lastMesh.rotation) {
        lastMesh.rotation.y = radarRotation;
      }
    }

    helipodFlash += delta;
    if (helipodFlash > 1.0) {
      helipodFlash = 0;
    }

    if (lights.length > 1) {
      var helipodLight = lights[1];
      if (helipodLight && helipodLight.intensity !== undefined) {
        var flashIntensity = Math.sin(helipodFlash * Math.PI * 2) * 0.4 + 0.4;
        helipodLight.intensity = flashIntensity;
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    lights = [];
  }

  return {
    buildScene: buildScene,
    update: update,
    reset: reset,
    getObjects: function() { return objects; },
    getLights: function() { return lights; }
  };
}());
