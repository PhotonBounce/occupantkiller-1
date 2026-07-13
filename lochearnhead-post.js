window.LochEarnheadPost = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createWatersportsCentre(scene) {
    var mainBuildingGeom = new THREE.BoxGeometry(20, 6, 14);
    var mainBuildingMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var mainBuilding = new THREE.Mesh(mainBuildingGeom, mainBuildingMat);
    mainBuilding.position.set(0, 3, 0);
    scene.add(mainBuilding);
    objects.push(mainBuilding);

    var trimGeom = new THREE.BoxGeometry(20.5, 0.8, 14.5);
    var trimMat = new THREE.MeshLambertMaterial({ color: 0x0044AA });
    var trimTop = new THREE.Mesh(trimGeom, trimMat);
    trimTop.position.set(0, 6.4, 0);
    scene.add(trimTop);
    objects.push(trimTop);

    var trimBottom = new THREE.Mesh(trimGeom, trimMat);
    trimBottom.position.set(0, -0.4, 0);
    scene.add(trimBottom);
    objects.push(trimBottom);
  }

  function createSlipway(scene) {
    var slipwayGeom = new THREE.BoxGeometry(20, 0.5, 8);
    var slipwayMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var slipway = new THREE.Mesh(slipwayGeom, slipwayMat);
    slipway.position.set(0, 0.25, 12);
    slipway.rotation.z = 0.15;
    scene.add(slipway);
    objects.push(slipway);
  }

  function createJetSkiStore(scene) {
    var storeGeom = new THREE.BoxGeometry(12, 4, 8);
    var storeMat = new THREE.MeshLambertMaterial({ color: 0x0044AA });
    var store = new THREE.Mesh(storeGeom, storeMat);
    store.position.set(15, 2, -5);
    scene.add(store);
    objects.push(store);

    var kayakGeom = new THREE.CylinderGeometry(0.4, 0.4, 5, 8);
    var kayakMat = new THREE.MeshLambertMaterial({ color: 0xAA4400 });

    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 3; j++) {
        var kayak = new THREE.Mesh(kayakGeom, kayakMat);
        kayak.position.set(12 + i * 1.2, 1 + j * 1.5, -5);
        kayak.rotation.z = Math.PI / 2.5;
        scene.add(kayak);
        objects.push(kayak);
      }
    }
  }

  function createRIBBoats(scene) {
    var ribGeom = new THREE.BoxGeometry(6, 1, 2.5);
    var ribMat = new THREE.MeshLambertMaterial({ color: 0x778877 });

    for (var i = 0; i < 3; i++) {
      var rib = new THREE.Mesh(ribGeom, ribMat);
      rib.position.set(-12 + i * 7, 0.5, 8);
      scene.add(rib);
      objects.push(rib);
    }
  }

  function createDockCrane(scene) {
    var craneBaseGeom = new THREE.CylinderGeometry(0.8, 0.8, 10, 16);
    var craneMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var craneBase = new THREE.Mesh(craneBaseGeom, craneMat);
    craneBase.position.set(-18, 5, 15);
    scene.add(craneBase);
    objects.push(craneBase);

    var craneArmGeom = new THREE.BoxGeometry(12, 1, 1);
    var craneArm = new THREE.Mesh(craneArmGeom, craneMat);
    craneArm.position.set(-18, 10.5, 15);
    craneArm.rotation.y = 0;
    craneArm.name = 'craneArm';
    scene.add(craneArm);
    objects.push(craneArm);
  }

  function createCheckpoint(scene) {
    var barrierGeom = new THREE.BoxGeometry(4, 1.5, 0.8);
    var barrierMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

    for (var i = 0; i < 5; i++) {
      var barrier = new THREE.Mesh(barrierGeom, barrierMat);
      barrier.position.set(-8 + i * 2, 0.75, -15);
      scene.add(barrier);
      objects.push(barrier);
    }

    var armGeom = new THREE.BoxGeometry(5, 0.5, 0.3);
    var arm = new THREE.Mesh(armGeom, barrierMat);
    arm.position.set(0, 1.5, -15);
    arm.rotation.z = 0.3;
    scene.add(arm);
    objects.push(arm);
  }

  function createMountainRoad(scene) {
    var road1Geom = new THREE.BoxGeometry(8, 0.3, 30);
    var roadMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var road1 = new THREE.Mesh(road1Geom, roadMat);
    road1.position.set(-4, 0.15, -20);
    scene.add(road1);
    objects.push(road1);

    var road2Geom = new THREE.BoxGeometry(8, 0.3, 30);
    var road2 = new THREE.Mesh(road2Geom, roadMat);
    road2.position.set(4, 0.15, -20);
    scene.add(road2);
    objects.push(road2);
  }

  function createAmmoBarge(scene) {
    var bargeGeom = new THREE.BoxGeometry(10, 1.5, 4);
    var bargeMat = new THREE.MeshLambertMaterial({ color: 0x4a5240 });
    var barge = new THREE.Mesh(bargeGeom, bargeMat);
    barge.position.set(5, 0.75, 20);
    scene.add(barge);
    objects.push(barge);
  }

  function createBuoys(scene) {
    var buoyGeom = new THREE.SphereGeometry(0.5, 16, 16);
    var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFFDD00 });

    var buoyPositions = [
      [-8, 1, 18],
      [-4, 1, 22],
      [6, 1, 18],
      [10, 1, 24]
    ];

    for (var i = 0; i < buoyPositions.length; i++) {
      var buoy = new THREE.Mesh(buoyGeom, buoyMat);
      buoy.position.set(buoyPositions[i][0], buoyPositions[i][1], buoyPositions[i][2]);
      scene.add(buoy);
      objects.push(buoy);
    }
  }

  function createLights(scene) {
    var ambientLight = new THREE.AmbientLight(0x8899CC, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var dockLight = new THREE.PointLight(0xFFFFFF, 1.0, 50);
    dockLight.position.set(-18, 12, 15);
    scene.add(dockLight);
    lights.push(dockLight);
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].name === 'craneArm') {
        objects[i].rotation.y += delta * 0.3;
      }
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

  function initialize(scene) {
    createWatersportsCentre(scene);
    createSlipway(scene);
    createJetSkiStore(scene);
    createRIBBoats(scene);
    createDockCrane(scene);
    createCheckpoint(scene);
    createMountainRoad(scene);
    createAmmoBarge(scene);
    createBuoys(scene);
    createLights(scene);
  }

  return {
    initialize: initialize,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };

}());
