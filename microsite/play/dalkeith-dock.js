window.DalkeithDock = (function() { 'use strict';

  var objects = [];
  var lights = [];

  var createDalkeithPalace = function(scene) {
    var geometry = new THREE.BoxGeometry(36, 22, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0xCCBB99 });
    var palace = new THREE.Mesh(geometry, material);
    palace.position.set(0, 11, 0);
    scene.add(palace);
    objects.push(palace);

    var pilasterGeo = new THREE.BoxGeometry(1, 22, 1);
    var pilasterMat = new THREE.MeshLambertMaterial({ color: 0xBBBB99 });
    var positions = [
      [-16, 11, -4],
      [-16, 11, 4],
      [16, 11, -4],
      [16, 11, 4]
    ];
    var i;
    for (i = 0; i < positions.length; i++) {
      var pilaster = new THREE.Mesh(pilasterGeo, pilasterMat);
      pilaster.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(pilaster);
      objects.push(pilaster);
    }
  };

  var createPerimeterWalls = function(scene) {
    var wallGeo = new THREE.BoxGeometry(1, 5, 30);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0xBBBBAA });

    var wallPositions = [
      [-20, 2.5, 0],
      [20, 2.5, 0],
      [0, 2.5, -15],
      [0, 2.5, 15]
    ];
    var i;
    for (i = 0; i < wallPositions.length; i++) {
      var wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(wallPositions[i][0], wallPositions[i][1], wallPositions[i][2]);
      if (i < 2) {
        wall.rotation.y = Math.PI / 2;
      }
      scene.add(wall);
      objects.push(wall);
    }
  };

  var createRiverBridge = function(scene) {
    var geometry = new THREE.BoxGeometry(16, 1, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var bridge = new THREE.Mesh(geometry, material);
    bridge.position.set(0, 0.5, 20);
    scene.add(bridge);
    objects.push(bridge);
  };

  var createSupplyDock = function(scene) {
    var geometry = new THREE.BoxGeometry(16, 0.5, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    var dock = new THREE.Mesh(geometry, material);
    dock.position.set(0, 0.25, 28);
    scene.add(dock);
    objects.push(dock);

    var bollardGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    var bollardMat = new THREE.MeshLambertMaterial({ color: 0x664433 });
    var bollardPositions = [
      [-6, 1, 28],
      [-2, 1, 28],
      [2, 1, 28],
      [6, 1, 28]
    ];
    var i;
    for (i = 0; i < bollardPositions.length; i++) {
      var bollard = new THREE.Mesh(bollardGeo, bollardMat);
      bollard.position.set(bollardPositions[i][0], bollardPositions[i][1], bollardPositions[i][2]);
      scene.add(bollard);
      objects.push(bollard);
    }
  };

  var createVehiclePark = function(scene) {
    var parkGeo = new THREE.BoxGeometry(20, 0.3, 15);
    var parkMat = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var park = new THREE.Mesh(parkGeo, parkMat);
    park.position.set(-30, 0.15, 0);
    scene.add(park);
    objects.push(park);

    var vehiclePositions = [
      [-28, 1, -4],
      [-28, 1, 0],
      [-28, 1, 4],
      [-32, 1, -4],
      [-32, 1, 0],
      [-32, 1, 4]
    ];
    var vehicleGeo = new THREE.BoxGeometry(2, 1.5, 4);
    var vehicleMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var i;
    for (i = 0; i < vehiclePositions.length; i++) {
      var vehicle = new THREE.Mesh(vehicleGeo, vehicleMat);
      vehicle.position.set(vehiclePositions[i][0], vehiclePositions[i][1], vehiclePositions[i][2]);
      scene.add(vehicle);
      objects.push(vehicle);
    }
  };

  var createCarriageHouse = function(scene) {
    var geometry = new THREE.BoxGeometry(12, 5, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var carriage = new THREE.Mesh(geometry, material);
    carriage.position.set(-25, 2.5, -20);
    scene.add(carriage);
    objects.push(carriage);
  };

  var createEarthworkMound = function(scene) {
    var moundGeo = new THREE.BoxGeometry(25, 1.5, 20);
    var moundMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
    var mound = new THREE.Mesh(moundGeo, moundMat);
    mound.position.set(30, 0.75, -10);
    scene.add(mound);
    objects.push(mound);
  };

  var createCavalryTrack = function(scene) {
    var trackGeo = new THREE.BoxGeometry(24, 0.3, 16);
    var trackMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(25, 0.15, 15);
    scene.add(track);
    objects.push(track);

    var markerGeo = new THREE.BoxGeometry(0.5, 1, 0.5);
    var markerMat = new THREE.MeshLambertMaterial({ color: 0xFFDD99 });
    var markerPositions = [
      [12, 0.5, 7],
      [12, 0.5, 23],
      [38, 0.5, 7],
      [38, 0.5, 23]
    ];
    var i;
    for (i = 0; i < markerPositions.length; i++) {
      var marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(markerPositions[i][0], markerPositions[i][1], markerPositions[i][2]);
      scene.add(marker);
      objects.push(marker);
    }
  };

  var createWeathervane = function(scene) {
    var vaneGeo = new THREE.SphereGeometry(0.4, 8, 8);
    var vaneMat = new THREE.MeshLambertMaterial({ color: 0xFFDD99 });
    var vane = new THREE.Mesh(vaneGeo, vaneMat);
    vane.position.set(10, 28, 2);
    vane.name = 'weathervane';
    scene.add(vane);
    objects.push(vane);
  };

  var createLights = function(scene) {
    var ambientLight = new THREE.Light();
    ambientLight.name = 'ambient';
    ambientLight.color = new THREE.Color(0xFFDD99);
    ambientLight.intensity = 0.8;
    scene.add(ambientLight);
    lights.push(ambientLight);

    var dockLightPositions = [
      [-6, 3, 28],
      [0, 3, 28],
      [6, 3, 28]
    ];
    var i;
    for (i = 0; i < dockLightPositions.length; i++) {
      var pointLight = new THREE.Light();
      pointLight.name = 'dock_light_' + i;
      pointLight.color = new THREE.Color(0xFFCC66);
      pointLight.intensity = 1.0;
      pointLight.position.set(dockLightPositions[i][0], dockLightPositions[i][1], dockLightPositions[i][2]);
      scene.add(pointLight);
      lights.push(pointLight);
    }
  };

  var init = function(scene) {
    createDalkeithPalace(scene);
    createPerimeterWalls(scene);
    createRiverBridge(scene);
    createSupplyDock(scene);
    createVehiclePark(scene);
    createCarriageHouse(scene);
    createEarthworkMound(scene);
    createCavalryTrack(scene);
    createWeathervane(scene);
    createLights(scene);
  };

  var update = function(delta) {
    var i;
    for (i = 0; i < objects.length; i++) {
      if (objects[i].name === 'weathervane') {
        objects[i].rotation.y += delta * 0.3;
      }
    }
  };

  var reset = function(scene) {
    var i;
    for (i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (i = lights.length - 1; i >= 0; i--) {
      scene.remove(lights[i]);
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
