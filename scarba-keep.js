window.ScarbaKeep = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createKeep() {
    var geometry = new THREE.BoxGeometry(8, 18, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var keep = new THREE.Mesh(geometry, material);
    keep.position.y = 9;
    return keep;
  }

  function createBattlements() {
    var battlements = [];
    var positions = [
      { x: -5, z: -5 },
      { x: 5, z: -5 },
      { x: -5, z: 5 },
      { x: 5, z: 5 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.BoxGeometry(1.5, 2, 1.5);
      var material = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var battlement = new THREE.Mesh(geometry, material);
      battlement.position.x = positions[i].x;
      battlement.position.y = 19;
      battlement.position.z = positions[i].z;
      battlements.push(battlement);
    }
    return battlements;
  }

  function createObservationPlatform() {
    var geometry = new THREE.BoxGeometry(20, 1, 20);
    var material = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var platform = new THREE.Mesh(geometry, material);
    platform.position.y = 10;
    return platform;
  }

  function createMonitoringStation() {
    var stationGroup = [];

    var bodyGeometry = new THREE.BoxGeometry(6, 4, 6);
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    body.position.x = 15;
    stationGroup.push(body);

    var windowGeometry = new THREE.BoxGeometry(2, 1.5, 0.3);
    var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x88AACC });
    var positions = [
      { x: 15, y: 3, z: 3 },
      { x: 15, y: 3, z: -3 },
      { x: 18, y: 3, z: 0 },
      { x: 12, y: 3, z: 0 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.x = positions[i].x;
      window.position.y = positions[i].y;
      window.position.z = positions[i].z;
      stationGroup.push(window);
    }

    return stationGroup;
  }

  function createSignalTower() {
    var towerGroup = [];

    var bodyGeometry = new THREE.BoxGeometry(3, 20, 3);
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 10;
    body.position.x = -15;
    towerGroup.push(body);

    return towerGroup;
  }

  function createCliffFaceWall() {
    var geometry = new THREE.BoxGeometry(30, 15, 2);
    var material = new THREE.MeshLambertMaterial({ color: 0x444433 });
    var wall = new THREE.Mesh(geometry, material);
    wall.position.y = 7.5;
    wall.position.z = -12;
    return wall;
  }

  function createCableWinch() {
    var winchGroup = [];

    var baseGeometry = new THREE.CylinderGeometry(2, 2, 2, 16);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1;
    base.position.x = -20;
    winchGroup.push(base);

    var armGeometry = new THREE.BoxGeometry(8, 1, 1);
    var armMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.y = 2;
    arm.position.x = -20;
    winchGroup.push(arm);

    return winchGroup;
  }

  function createSupplyCrates() {
    var cratesGroup = [];
    var positions = [
      { x: 8, y: 0.5, z: -14 },
      { x: 12, y: 1.2, z: -15 },
      { x: 5, y: 0.3, z: -13 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      var crate = new THREE.Mesh(geometry, material);
      crate.position.x = positions[i].x;
      crate.position.y = positions[i].y;
      crate.position.z = positions[i].z;
      cratesGroup.push(crate);
    }

    return cratesGroup;
  }

  function createEmergencyShelter() {
    var geometry = new THREE.SphereGeometry(5, 16, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0x556B2F });
    var shelter = new THREE.Mesh(geometry, material);
    shelter.scale.y = 0.4;
    shelter.position.y = 2;
    shelter.position.x = 10;
    shelter.position.z = 10;
    return shelter;
  }

  function createNavigationLight() {
    var light = new THREE.PointLight(0xFF2200, 2.0, 50);
    light.position.set(-15, 20.5, 0);
    return light;
  }

  function createAmbientLight() {
    var light = new THREE.AmbientLight(0x445566, 0.5);
    return light;
  }

  function init(scene) {
    var keep = createKeep();
    objects.push(keep);
    scene.add(keep);

    var battlements = createBattlements();
    for (var i = 0; i < battlements.length; i++) {
      objects.push(battlements[i]);
      scene.add(battlements[i]);
    }

    var platform = createObservationPlatform();
    objects.push(platform);
    scene.add(platform);

    var station = createMonitoringStation();
    for (var i = 0; i < station.length; i++) {
      objects.push(station[i]);
      scene.add(station[i]);
    }

    var tower = createSignalTower();
    for (var i = 0; i < tower.length; i++) {
      objects.push(tower[i]);
      scene.add(tower[i]);
    }

    var wall = createCliffFaceWall();
    objects.push(wall);
    scene.add(wall);

    var winch = createCableWinch();
    for (var i = 0; i < winch.length; i++) {
      objects.push(winch[i]);
      scene.add(winch[i]);
    }

    var crates = createSupplyCrates();
    for (var i = 0; i < crates.length; i++) {
      objects.push(crates[i]);
      scene.add(crates[i]);
    }

    var shelter = createEmergencyShelter();
    objects.push(shelter);
    scene.add(shelter);

    var navLight = createNavigationLight();
    lights.push(navLight);
    scene.add(navLight);

    var ambientLight = createAmbientLight();
    lights.push(ambientLight);
    scene.add(ambientLight);
  }

  function update(delta) {
    if (lights.length > 0) {
      var navLight = lights[0];
      navLight.intensity = 2.0 + Math.sin(Date.now() * 0.003) * 0.8;
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
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
