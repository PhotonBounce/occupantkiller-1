window.MusselburghFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var navLightToggle = false;
  var patrolCraftBobOffset = 0;
  var patrolCrafts = [];

  var createGolfCourse = function(scene) {
    var sandColor = 0xCCBB88;
    var sandTrapPositions = [
      { x: -40, z: 20 },
      { x: -20, z: 30 },
      { x: 0, z: 25 },
      { x: 20, z: 35 },
      { x: -30, z: -10 },
      { x: 10, z: -15 }
    ];

    sandTrapPositions.forEach(function(pos) {
      var sphereGeo = new THREE.SphereGeometry(3, 8, 8);
      var mat = new THREE.MeshLambertMaterial({ color: sandColor });
      var sphere = new THREE.Mesh(sphereGeo, mat);
      sphere.position.set(pos.x, 0.5, pos.z);
      scene.add(sphere);
      objects.push(sphere);

      var ringGeo = new THREE.CylinderGeometry(4, 4, 0.5, 16);
      var ringMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pos.x, 0.1, pos.z);
      scene.add(ring);
      objects.push(ring);
    });
  };

  var createFisherrowHarbour = function(scene) {
    var stoneColor = 0x888877;
    var wallGeo = new THREE.BoxGeometry(30, 4, 3);
    var wallMat = new THREE.MeshLambertMaterial({ color: stoneColor });
    var wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(50, 2, 0);
    scene.add(wall);
    objects.push(wall);

    for (var i = 0; i < 5; i++) {
      var cannonGeo = new THREE.CylinderGeometry(0.4, 0.5, 2, 8);
      var cannonMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var cannon = new THREE.Mesh(cannonGeo, cannonMat);
      cannon.position.set(40 + i * 5, 4, 1);
      cannon.rotation.z = Math.PI / 6;
      scene.add(cannon);
      objects.push(cannon);
    }
  };

  var createLorettoSchool = function(scene) {
    var stoneColor = 0x998877;
    var buildingGeo = new THREE.BoxGeometry(20, 8, 14);
    var buildingMat = new THREE.MeshLambertMaterial({ color: stoneColor });
    var building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(-30, 4, 40);
    scene.add(building);
    objects.push(building);

    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 3; j++) {
        var colGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
        var colMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
        var col = new THREE.Mesh(colGeo, colMat);
        col.position.set(-22 + i * 5, 4, 33 + j * 5);
        scene.add(col);
        objects.push(col);
      }
    }
  };

  var createRomanFort = function(scene) {
    var earthColor = 0x665544;
    var moundGeo = new THREE.BoxGeometry(1, 4, 20);
    var moundMat = new THREE.MeshLambertMaterial({ color: earthColor });
    var mound = new THREE.Mesh(moundGeo, moundMat);
    mound.position.set(-80, 2, 0);
    scene.add(mound);
    objects.push(mound);

    var mound2 = new THREE.Mesh(moundGeo, moundMat);
    mound2.position.set(-80, 2, 20);
    scene.add(mound2);
    objects.push(mound2);

    var mound3 = new THREE.Mesh(moundGeo, moundMat);
    mound3.position.set(-80, 2, -20);
    scene.add(mound3);
    objects.push(mound3);
  };

  var createRacecourse = function(scene) {
    var standGeo = new THREE.BoxGeometry(20, 8, 6);
    var standMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(0, 4, -50);
    scene.add(stand);
    objects.push(stand);

    for (var i = 0; i < 8; i++) {
      var colGeo = new THREE.CylinderGeometry(0.6, 0.6, 8, 8);
      var colMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var col = new THREE.Mesh(colGeo, colMat);
      col.position.set(-8 + i * 2.5, 4, -50);
      scene.add(col);
      objects.push(col);
    }
  };

  var createEskBarrier = function(scene) {
    var points = [
      new THREE.Vector3(-100, 0.5, -30),
      new THREE.Vector3(100, 0.5, -30),
      new THREE.Vector3(-100, 0.5, 30),
      new THREE.Vector3(100, 0.5, 30)
    ];

    var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var line1 = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(line1);
    objects.push(line1);

    var points2 = [
      new THREE.Vector3(-100, 1, -30),
      new THREE.Vector3(100, 1, -30),
      new THREE.Vector3(-100, 1, 30),
      new THREE.Vector3(100, 1, 30)
    ];
    var lineGeo2 = new THREE.BufferGeometry().setFromPoints(points2);
    var line2 = new THREE.LineSegments(lineGeo2, lineMat);
    scene.add(line2);
    objects.push(line2);
  };

  var createArtilleryBattery = function(scene) {
    var positions = [
      { x: -60, z: 60 },
      { x: -60, z: 80 },
      { x: -60, z: 100 }
    ];

    positions.forEach(function(pos) {
      var ringGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.8, 12);
      var ringMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pos.x, 0.4, pos.z);
      scene.add(ring);
      objects.push(ring);

      var barrelGeo = new THREE.CylinderGeometry(0.3, 0.35, 3, 8);
      var barrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(pos.x, 1.5, pos.z);
      barrel.rotation.z = Math.PI / 5;
      scene.add(barrel);
      objects.push(barrel);
    });
  };

  var createPatrolCraft = function(scene) {
    for (var i = 0; i < 2; i++) {
      var craftGeo = new THREE.BoxGeometry(10, 2, 3);
      var craftMat = new THREE.MeshLambertMaterial({ color: 0x778877 });
      var craft = new THREE.Mesh(craftGeo, craftMat);
      craft.position.set(30 - i * 40, 1, 15);
      craft.userData.baseY = 1;
      scene.add(craft);
      objects.push(craft);
      patrolCrafts.push(craft);
    }
  };

  var createNavLights = function(scene) {
    var greenGeo = new THREE.SphereGeometry(0.5, 6, 6);
    var greenMat = new THREE.MeshLambertMaterial({ color: 0x00CC44 });
    var greenLight = new THREE.PointLight(0x00CC44, 1.0, 30);
    greenLight.position.set(65, 5, -2);
    scene.add(greenLight);
    lights.push(greenLight);

    var greenMesh = new THREE.Mesh(greenGeo, greenMat);
    greenMesh.position.copy(greenLight.position);
    scene.add(greenMesh);
    objects.push(greenMesh);

    var redGeo = new THREE.SphereGeometry(0.5, 6, 6);
    var redMat = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
    var redLight = new THREE.PointLight(0xCC2222, 1.0, 30);
    redLight.position.set(35, 5, 2);
    scene.add(redLight);
    lights.push(redLight);

    var redMesh = new THREE.Mesh(redGeo, redMat);
    redMesh.position.copy(redLight.position);
    scene.add(redMesh);
    objects.push(redMesh);
  };

  var createAmbientLight = function(scene) {
    var ambientLight = new THREE.AmbientLight(0x8899BB, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);
  };

  var build = function(scene) {
    createAmbientLight(scene);
    createGolfCourse(scene);
    createFisherrowHarbour(scene);
    createLorettoSchool(scene);
    createRomanFort(scene);
    createRacecourse(scene);
    createEskBarrier(scene);
    createArtilleryBattery(scene);
    createPatrolCraft(scene);
    createNavLights(scene);
  };

  var update = function(delta) {
    patrolCraftBobOffset += delta * 2;

    patrolCrafts.forEach(function(craft) {
      craft.position.y = craft.userData.baseY + Math.sin(patrolCraftBobOffset) * 0.3;
    });

    navLightToggle = !navLightToggle;

    if (lights.length >= 2) {
      lights[lights.length - 2].intensity = navLightToggle ? 1.0 : 0.1;
      lights[lights.length - 1].intensity = navLightToggle ? 0.1 : 1.0;
    }
  };

  var reset = function(scene) {
    objects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        obj.material.dispose();
      }
    });
    objects = [];

    lights.forEach(function(light) {
      scene.remove(light);
    });
    lights = [];

    patrolCrafts = [];
    patrolCraftBobOffset = 0;
    navLightToggle = false;
  };

  return {
    build: build,
    update: update,
    reset: reset,
    getObjects: function() { return objects; },
    getLights: function() { return lights; }
  };
}());
