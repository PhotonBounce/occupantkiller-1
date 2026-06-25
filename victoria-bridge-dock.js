window.VictoriaBridgeDock = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  var createBridge = function(scene) {
    var bridgeGeom = new THREE.BoxGeometry(24, 1.5, 8);
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var bridgeSpan = new THREE.Mesh(bridgeGeom, bridgeMat);
    bridgeSpan.position.set(0, 6, 0);
    scene.add(bridgeSpan);
    objects.push(bridgeSpan);

    var parapetLeftGeom = new THREE.BoxGeometry(24, 1, 1);
    var parapetMat = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var parapetLeft = new THREE.Mesh(parapetLeftGeom, parapetMat);
    parapetLeft.position.set(0, 7.25, 3.5);
    scene.add(parapetLeft);
    objects.push(parapetLeft);

    var parapetRight = new THREE.Mesh(parapetLeftGeom, parapetMat);
    parapetRight.position.set(0, 7.25, -3.5);
    scene.add(parapetRight);
    objects.push(parapetRight);
  };

  var createArches = function(scene) {
    for (var i = 0; i < 4; i++) {
      var archGeom = new THREE.CylinderGeometry(1, 1, 6, 16);
      var archMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
      var arch = new THREE.Mesh(archGeom, archMat);
      var xPos = -8 + i * 6;
      arch.position.set(xPos, 3, 0);
      scene.add(arch);
      objects.push(arch);
    }
  };

  var createDock = function(scene) {
    var dockGeom = new THREE.BoxGeometry(18, 1, 5);
    var dockMat = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    var dock = new THREE.Mesh(dockGeom, dockMat);
    dock.position.set(-12, 0.5, 0);
    scene.add(dock);
    objects.push(dock);

    var bollardGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
    var bollardMat = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    for (var i = 0; i < 4; i++) {
      var bollard = new THREE.Mesh(bollardGeom, bollardMat);
      var xPos = -20 + i * 6;
      bollard.position.set(xPos, 1.2, 2);
      scene.add(bollard);
      objects.push(bollard);
    }
  };

  var createBoathouse = function(scene) {
    var boathouseGeom = new THREE.BoxGeometry(10, 5, 8);
    var boathouseMat = new THREE.MeshLambertMaterial({ color: 0x6B4C2A });
    var boathouse = new THREE.Mesh(boathouseGeom, boathouseMat);
    boathouse.position.set(-18, 2.5, -10);
    scene.add(boathouse);
    objects.push(boathouse);

    var roofGeom = new THREE.BoxGeometry(10.5, 0.8, 8.2);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(-18, 5.4, -10);
    scene.add(roof);
    objects.push(roof);
  };

  var createBarge = function(scene) {
    var bargeGeom = new THREE.BoxGeometry(12, 1.5, 5);
    var bargeMat = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var barge = new THREE.Mesh(bargeGeom, bargeMat);
    barge.position.set(-8, 0.75, 8);
    barge.userData.initialPosition = { x: -8, y: 0.75, z: 8 };
    scene.add(barge);
    objects.push(barge);
  };

  var createMilitaryHut = function(scene) {
    var hutGeom = new THREE.BoxGeometry(8, 4, 6);
    var hutMat = new THREE.MeshLambertMaterial({ color: 0x4a5240 });
    var hut = new THREE.Mesh(hutGeom, hutMat);
    hut.position.set(12, 2, -8);
    scene.add(hut);
    objects.push(hut);
  };

  var createDepthPoles = function(scene) {
    for (var i = 0; i < 5; i++) {
      var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
      var poleMat = new THREE.MeshLambertMaterial({ color: 0xFF9900 });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      var xPos = -15 + i * 5;
      pole.position.set(xPos, 1.5, 15);
      scene.add(pole);
      objects.push(pole);
    }
  };

  var createFordStones = function(scene) {
    var positions = [
      { x: -12, z: 12 },
      { x: -6, z: 13 },
      { x: 0, z: 14 },
      { x: 6, z: 13 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var stoneGeom = new THREE.SphereGeometry(0.8, 8, 8);
      var stoneMat = new THREE.MeshLambertMaterial({ color: 0x888866 });
      var stone = new THREE.Mesh(stoneGeom, stoneMat);
      stone.position.set(positions[i].x, 0.4, positions[i].z);
      scene.add(stone);
      objects.push(stone);
    }
  };

  var createOspreyNest = function(scene) {
    var poleGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 12);
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x8B8B7A });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(18, 4, 10);
    scene.add(pole);
    objects.push(pole);

    var platformGeom = new THREE.BoxGeometry(2, 0.3, 2);
    var platformMat = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(18, 8.15, 10);
    scene.add(platform);
    objects.push(platform);
  };

  var createLights = function(scene) {
    var ambientGeom = new THREE.SphereGeometry(0.1, 4, 4);
    var ambientMat = new THREE.MeshLambertMaterial({ color: 0xAABBBB });
    var ambientMesh = new THREE.Mesh(ambientGeom, ambientMat);
    ambientMesh.position.set(0, 20, 0);
    var ambientLight = new THREE.AmbientLight(0xAABBBB, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var lanternLight = new THREE.PointLight(0xFFCC44, 1.0);
    lanternLight.position.set(-12, 4, 0);
    scene.add(lanternLight);
    lights.push(lanternLight);
  };

  var update = function(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData.initialPosition) {
        var barge = objects[i];
        var swayAmount = Math.sin(Date.now() * 0.0005) * 0.3;
        barge.position.x = barge.userData.initialPosition.x + swayAmount;
        barge.position.z = barge.userData.initialPosition.z + Math.cos(Date.now() * 0.0003) * 0.2;
      }
    }
  };

  var reset = function(scene) {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    lights = [];
  };

  var build = function(scene) {
    reset(scene);
    createBridge(scene);
    createArches(scene);
    createDock(scene);
    createBoathouse(scene);
    createBarge(scene);
    createMilitaryHut(scene);
    createDepthPoles(scene);
    createFordStones(scene);
    createOspreyNest(scene);
    createLights(scene);
  };

  return {
    build: build,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
