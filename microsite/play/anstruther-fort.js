window.AnstrutherFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  var addMesh = function(mesh) {
    objects.push(mesh);
    return mesh;
  };

  var addLight = function(light) {
    lights.push(light);
    return light;
  };

  var createMuseumComplex = function(scene) {
    var geometry = new THREE.BoxGeometry(20, 6, 16);
    var material = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    var museum = new THREE.Mesh(geometry, material);
    museum.position.set(0, 3, 0);
    scene.add(museum);
    addMesh(museum);
  };

  var createBreakwater = function(scene) {
    var geometry = new THREE.BoxGeometry(35, 3, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var breakwater = new THREE.Mesh(geometry, material);
    breakwater.position.set(25, 1.5, -18);
    scene.add(breakwater);
    addMesh(breakwater);
  };

  var createCourtyard = function(scene) {
    var geometry = new THREE.BoxGeometry(14, 0.3, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var courtyard = new THREE.Mesh(geometry, material);
    courtyard.position.set(-8, 0.15, 5);
    scene.add(courtyard);
    addMesh(courtyard);

    var boatGeo = new THREE.BoxGeometry(10, 2, 3);
    var boatMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var historicBoat = new THREE.Mesh(boatGeo, boatMat);
    historicBoat.position.set(-8, 1.3, 5);
    scene.add(historicBoat);
    addMesh(historicBoat);
  };

  var createSteamDrifter = function(scene) {
    var hullGeo = new THREE.BoxGeometry(12, 3, 4);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.set(12, 1.5, -8);
    scene.add(hull);
    addMesh(hull);

    var funnelGeo = new THREE.CylinderGeometry(1.2, 1.2, 5, 12);
    var funnelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var funnel = new THREE.Mesh(funnelGeo, funnelMat);
    funnel.position.set(12, 4.5, -8);
    scene.add(funnel);
    addMesh(funnel);
  };

  var createBillowBoat = function(scene) {
    var geometry = new THREE.BoxGeometry(6, 1.5, 2.5);
    var material = new THREE.MeshLambertMaterial({ color: 0xCC4422 });
    var boat = new THREE.Mesh(geometry, material);
    boat.position.set(-15, 0.75, -12);
    scene.add(boat);
    addMesh(boat);
  };

  var createLighthouse = function(scene) {
    var geometry = new THREE.CylinderGeometry(1.5, 1.5, 16, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var lighthouse = new THREE.Mesh(geometry, material);
    lighthouse.position.set(30, 8, -20);
    lighthouse.name = 'lighthouse';
    scene.add(lighthouse);
    addMesh(lighthouse);
  };

  var createGunBattery = function(scene) {
    var createEmplacement = function(x, z) {
      var ringGeo = new THREE.CylinderGeometry(3, 3, 0.5, 24);
      var ringMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, 0.25, z);
      scene.add(ring);
      addMesh(ring);

      var barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 12);
      var barrelMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(x, 3.5, z);
      barrel.rotation.z = 0.3;
      scene.add(barrel);
      addMesh(barrel);
    };

    createEmplacement(-20, 10);
    createEmplacement(-10, 12);
  };

  var createMerchantHouses = function(scene) {
    var positionX = [-25, -18, -11, -4, 3, 10];
    var idx = 0;

    while (idx < positionX.length) {
      var x = positionX[idx];
      var geometry = new THREE.BoxGeometry(6, 8, 5);
      var material = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
      var house = new THREE.Mesh(geometry, material);
      house.position.set(x, 4, -25);
      scene.add(house);
      addMesh(house);
      idx = idx + 1;
    }
  };

  var createHarbourMasterTower = function(scene) {
    var geometry = new THREE.BoxGeometry(4, 10, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(15, 5, 8);
    scene.add(tower);
    addMesh(tower);
  };

  var createAmbientLight = function(scene) {
    var light = new THREE.AmbientLight(0xFFBB88, 0.7);
    scene.add(light);
    addLight(light);
  };

  var createHarbourLights = function(scene) {
    var light1 = new THREE.PointLight(0xFFCC66, 0.9, 50);
    light1.position.set(20, 6, -15);
    scene.add(light1);
    addLight(light1);

    var light2 = new THREE.PointLight(0xFFCC66, 0.9, 50);
    light2.position.set(-15, 6, -20);
    scene.add(light2);
    addLight(light2);

    var light3 = new THREE.PointLight(0xFFCC66, 0.9, 50);
    light3.position.set(10, 8, 10);
    scene.add(light3);
    addLight(light3);
  };

  var init = function(scene) {
    createMuseumComplex(scene);
    createBreakwater(scene);
    createCourtyard(scene);
    createSteamDrifter(scene);
    createBillowBoat(scene);
    createLighthouse(scene);
    createGunBattery(scene);
    createMerchantHouses(scene);
    createHarbourMasterTower(scene);
    createAmbientLight(scene);
    createHarbourLights(scene);
  };

  var update = function(delta) {
    var i = 0;
    while (i < objects.length) {
      var obj = objects[i];
      if (obj.name === 'lighthouse') {
        obj.rotation.y = obj.rotation.y + (delta * 0.2);
      }
      i = i + 1;
    }

    var j = 0;
    while (j < lights.length) {
      var light = lights[j];
      if (light instanceof THREE.PointLight) {
        light.intensity = 0.85 + Math.sin(Date.now() * 0.003) * 0.15;
      }
      j = j + 1;
    }
  };

  var reset = function(scene) {
    var k = 0;
    while (k < objects.length) {
      scene.remove(objects[k]);
      k = k + 1;
    }
    objects = [];

    var m = 0;
    while (m < lights.length) {
      scene.remove(lights[m]);
      m = m + 1;
    }
    lights = [];
  };

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
