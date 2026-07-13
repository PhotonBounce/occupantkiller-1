window.DarkWoods = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lights = [];
  var animatedObjects = [];
  var time = 0;

  function buildTrees() {
    var treeData = [
      { x: -40, z: -50, height: 35, radius: 2.5 },
      { x: 45, z: -45, height: 40, radius: 2.8 },
      { x: -30, z: 20, height: 32, radius: 2.2 },
      { x: 55, z: 30, height: 38, radius: 2.6 },
      { x: -55, z: 55, height: 36, radius: 2.4 },
      { x: 20, z: 60, height: 34, radius: 2.5 },
      { x: -10, z: -70, height: 39, radius: 2.7 },
      { x: 65, z: -20, height: 33, radius: 2.3 },
      { x: -70, z: 10, height: 37, radius: 2.5 },
      { x: 30, z: -80, height: 35, radius: 2.4 }
    ];

    treeData.forEach(function(data) {
      var trunkGeom = new THREE.CylinderGeometry(data.radius, data.radius * 1.3, data.height, 8);
      var trunkMat = new THREE.MeshLambertMaterial({ color: 0x1a0f0a });
      var trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.set(data.x, data.height / 2, data.z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);
      objects.push(trunk);

      var foliageGeom = new THREE.ConeGeometry(data.radius * 4, data.height * 0.6, 12);
      var foliageMat = new THREE.MeshLambertMaterial({ color: 0x0d0805 });
      var foliage = new THREE.Mesh(foliageGeom, foliageMat);
      foliage.position.set(data.x, data.height * 0.7, data.z);
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      scene.add(foliage);
      objects.push(foliage);

      var foliage2 = new THREE.Mesh(foliageGeom, foliageMat);
      foliage2.scale.set(0.7, 0.8, 0.7);
      foliage2.position.set(data.x, data.height * 0.8, data.z);
      foliage2.castShadow = true;
      foliage2.receiveShadow = true;
      scene.add(foliage2);
      objects.push(foliage2);

      animatedObjects.push({
        mesh: foliage,
        type: 'sway',
        speed: 0.8 + Math.random() * 0.4,
        amplitude: 0.15,
        origX: data.x,
        origZ: data.z
      });
    });
  }

  function buildCampfires() {
    var campfireLocations = [
      { x: 25, z: 35 },
      { x: -45, z: 40 },
      { x: -15, z: -55 }
    ];

    campfireLocations.forEach(function(loc) {
      var firelogGeom = new THREE.CylinderGeometry(0.3, 0.35, 2, 6);
      var firelogMat = new THREE.MeshLambertMaterial({ color: 0x3d2514 });

      for (var i = 0; i < 4; i++) {
        var log = new THREE.Mesh(firelogGeom, firelogMat);
        var angle = (i / 4) * Math.PI * 2;
        log.position.set(
          loc.x + Math.cos(angle) * 0.8,
          1.2,
          loc.z + Math.sin(angle) * 0.8
        );
        log.rotation.z = angle + Math.PI / 4;
        scene.add(log);
        objects.push(log);
      }

      var fireLight = new THREE.PointLight(0xff6600, 1.2, 30);
      fireLight.position.set(loc.x, 2.5, loc.z);
      fireLight.castShadow = true;
      scene.add(fireLight);
      lights.push(fireLight);

      animatedObjects.push({
        light: fireLight,
        type: 'flicker',
        speed: 3 + Math.random() * 2,
        baseIntensity: 1.2,
        variance: 0.4
      });
    });
  }

  function buildIEDMarkers() {
    var iedLocations = [
      { x: -25, z: 15 },
      { x: 35, z: -40 },
      { x: -60, z: 65 },
      { x: 50, z: 50 }
    ];

    iedLocations.forEach(function(loc) {
      var stakeGeom = new THREE.CylinderGeometry(0.15, 0.18, 1.5, 6);
      var stakeMat = new THREE.MeshLambertMaterial({ color: 0xaa0000 });
      var stake = new THREE.Mesh(stakeGeom, stakeMat);
      stake.position.set(loc.x, 0.75, loc.z);
      scene.add(stake);
      objects.push(stake);

      var sphereGeom = new THREE.SphereGeometry(0.4, 8, 8);
      var sphereMat = new THREE.MeshLambertMaterial({ color: 0xff2222 });
      var sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(loc.x, 2.2, loc.z);
      scene.add(sphere);
      objects.push(sphere);

      animatedObjects.push({
        mesh: sphere,
        type: 'blink',
        speed: 1.5 + Math.random() * 0.5,
        baseColor: 0xff2222,
        dimColor: 0x660000
      });
    });
  }

  function buildTrenches() {
    var trenchPaths = [
      [
        { x: -30, z: -20 },
        { x: -20, z: -10 },
        { x: -5, z: 0 },
        { x: 10, z: 5 }
      ],
      [
        { x: 40, z: 20 },
        { x: 50, z: 35 },
        { x: 55, z: 50 }
      ]
    ];

    trenchPaths.forEach(function(path) {
      for (var i = 0; i < path.length - 1; i++) {
        var p1 = path[i];
        var p2 = path[i + 1];
        var dx = p2.x - p1.x;
        var dz = p2.z - p1.z;
        var dist = Math.sqrt(dx * dx + dz * dz);

        var trenchWallGeom = new THREE.BoxGeometry(dist, 2, 0.8);
        var trenchMat = new THREE.MeshLambertMaterial({ color: 0x2a2620 });
        var wall = new THREE.Mesh(trenchWallGeom, trenchMat);
        wall.position.set((p1.x + p2.x) / 2, 1, (p1.z + p2.z) / 2);
        wall.rotation.y = Math.atan2(dz, dx);
        scene.add(wall);
        objects.push(wall);

        var wall2 = new THREE.Mesh(trenchWallGeom, trenchMat);
        wall2.position.set((p1.x + p2.x) / 2, 1, (p1.z + p2.z) / 2 + 1.5);
        wall2.rotation.y = Math.atan2(dz, dx);
        scene.add(wall2);
        objects.push(wall2);
      }
    });
  }

  function buildEquipment() {
    var equipmentData = [
      { x: 15, z: 25, type: 'crate' },
      { x: -50, z: -30, type: 'crate' },
      { x: 60, z: 10, type: 'tank' },
      { x: -35, z: 70, type: 'barrel' },
      { x: 25, z: -65, type: 'crate' },
      { x: -70, z: -40, type: 'barrel' }
    ];

    equipmentData.forEach(function(data) {
      if (data.type === 'crate') {
        var crateGeom = new THREE.BoxGeometry(2, 2, 2);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var crate = new THREE.Mesh(crateGeom, crateMat);
        crate.position.set(data.x, 1, data.z);
        crate.castShadow = true;
        crate.receiveShadow = true;
        scene.add(crate);
        objects.push(crate);
      } else if (data.type === 'tank') {
        var tankBodyGeom = new THREE.BoxGeometry(3, 1.5, 4);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var tankBody = new THREE.Mesh(tankBodyGeom, tankMat);
        tankBody.position.set(data.x, 0.75, data.z);
        scene.add(tankBody);
        objects.push(tankBody);

        var turretGeom = new THREE.CylinderGeometry(0.8, 1, 0.6, 8);
        var turret = new THREE.Mesh(turretGeom, tankMat);
        turret.position.set(data.x, 1.8, data.z);
        scene.add(turret);
        objects.push(turret);
      } else if (data.type === 'barrel') {
        var barrelGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.set(data.x, 0.9, data.z);
        scene.add(barrel);
        objects.push(barrel);
      }
    });
  }

  function buildOwlRobots() {
    var robotLocations = [
      { x: -45, z: 10 },
      { x: 40, z: -50 },
      { x: 10, z: 65 }
    ];

    robotLocations.forEach(function(loc) {
      var bodyGeom = new THREE.SphereGeometry(0.6, 8, 8);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(loc.x, 2, loc.z);
      scene.add(body);
      objects.push(body);

      var eyeGeom = new THREE.SphereGeometry(0.25, 6, 6);
      var eyeMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });

      var eye1 = new THREE.Mesh(eyeGeom, eyeMat);
      eye1.position.set(loc.x - 0.3, 2.3, loc.z + 0.55);
      scene.add(eye1);
      objects.push(eye1);

      var eye2 = new THREE.Mesh(eyeGeom, eyeMat);
      eye2.position.set(loc.x + 0.3, 2.3, loc.z + 0.55);
      scene.add(eye2);
      objects.push(eye2);

      var neckGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 6);
      var neckMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
      var neck = new THREE.Mesh(neckGeom, neckMat);
      neck.position.set(loc.x, 1.2, loc.z);
      scene.add(neck);
      objects.push(neck);
    });
  }

  function buildRuin() {
    var wall1Geom = new THREE.BoxGeometry(15, 8, 1);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
    var wall1 = new THREE.Mesh(wall1Geom, wallMat);
    wall1.position.set(-35, 4, 50);
    scene.add(wall1);
    objects.push(wall1);

    var wall2Geom = new THREE.BoxGeometry(1, 8, 12);
    var wall2 = new THREE.Mesh(wall2Geom, wallMat);
    wall2.position.set(-42, 4, 56);
    scene.add(wall2);
    objects.push(wall2);

    var rubbleGeom = new THREE.BoxGeometry(2, 1, 2);
    var rubbleMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });

    for (var i = 0; i < 8; i++) {
      var rubble = new THREE.Mesh(rubbleGeom, rubbleMat);
      rubble.position.set(-30 + i * 1.5, 0.5 + Math.random() * 1, 52 + Math.random() * 3);
      scene.add(rubble);
      objects.push(rubble);
    }
  }

  function buildAmbience() {
    var logGeom = new THREE.CylinderGeometry(0.4, 0.45, 4, 6);
    var logMat = new THREE.MeshLambertMaterial({ color: 0x2a1f14 });

    var logPositions = [
      { x: 0, z: 30 },
      { x: -20, z: 50 },
      { x: 40, z: -30 },
      { x: -60, z: -20 }
    ];

    logPositions.forEach(function(pos) {
      var log = new THREE.Mesh(logGeom, logMat);
      log.position.set(pos.x, 0.5, pos.z);
      log.rotation.z = Math.random() * Math.PI;
      scene.add(log);
      objects.push(log);
    });

    var smallRockGeom = new THREE.SphereGeometry(0.5, 6, 6);
    var rockMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

    for (var i = 0; i < 15; i++) {
      var rock = new THREE.Mesh(smallRockGeom, rockMat);
      rock.position.set(
        -80 + Math.random() * 160,
        0.3,
        -80 + Math.random() * 160
      );
      scene.add(rock);
      objects.push(rock);
    }

    var rootGeom = new THREE.CylinderGeometry(0.2, 0.25, 3, 5);
    var rootMat = new THREE.MeshLambertMaterial({ color: 0x1a1510 });

    for (var j = 0; j < 10; j++) {
      var root = new THREE.Mesh(rootGeom, rootMat);
      root.position.set(
        -80 + Math.random() * 160,
        0.1,
        -80 + Math.random() * 160
      );
      root.rotation.z = Math.random() * Math.PI;
      scene.add(root);
      objects.push(root);
    }
  }

  function buildLighting() {
    var ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var moonLight = new THREE.DirectionalLight(0x99aabb, 0.5);
    moonLight.position.set(60, 80, 40);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    scene.add(moonLight);
    lights.push(moonLight);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    lights = [];
    animatedObjects = [];
    time = 0;

    buildTrees();
    buildCampfires();
    buildIEDMarkers();
    buildTrenches();
    buildEquipment();
    buildOwlRobots();
    buildRuin();
    buildAmbience();
    buildLighting();
  }

  function update(delta) {
    time += delta;

    animatedObjects.forEach(function(obj) {
      if (obj.type === 'sway') {
        if (obj.mesh) {
          var swayX = Math.sin(time * obj.speed) * obj.amplitude;
          obj.mesh.position.x = obj.origX + swayX;
        }
      } else if (obj.type === 'flicker') {
        if (obj.light) {
          var flicker = Math.sin(time * obj.speed) * obj.variance;
          obj.light.intensity = obj.baseIntensity + flicker;
        }
      } else if (obj.type === 'blink') {
        if (obj.mesh) {
          var blinkCycle = (time * obj.speed) % 1;
          if (blinkCycle < 0.7) {
            obj.mesh.material.color.setHex(obj.baseColor);
          } else {
            obj.mesh.material.color.setHex(obj.dimColor);
          }
        }
      }
    });
  }

  function reset() {
    objects.forEach(function(obj) {
      scene.remove(obj);
    });
    lights.forEach(function(light) {
      scene.remove(light);
    });

    objects = [];
    lights = [];
    animatedObjects = [];
    scene = null;
    camera = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
