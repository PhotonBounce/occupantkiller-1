window.MissileBattery = (function() {
  'use strict';

  var battery = {
    launchers: [],
    radarDish: null,
    commandBunker: null,
    ammoDeps: [],
    generators: [],
    fenceSegments: [],
    guardPosts: [],
    logisticsTrucks: [],
    sensorMasts: [],
    camoNetting: [],
    radarRotation: 0,
    launcherRotations: [],
    generatorFlicker: 0,
    sensorBlink: 0,
    spawnPoints: []
  };

  function init(scene, camera) {
    battery.launchers = [];
    battery.radarDish = null;
    battery.commandBunker = null;
    battery.ammoDeps = [];
    battery.generators = [];
    battery.fenceSegments = [];
    battery.guardPosts = [];
    battery.logisticsTrucks = [];
    battery.sensorMasts = [];
    battery.camoNetting = [];
    battery.launcherRotations = [];
    battery.spawnPoints = [];

    var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B8B6F });

    buildLauncherSites(scene);
    buildRadarStation(scene);
    buildCommandBunker(scene);
    buildAmmoDeps(scene);
    buildPerimeterFence(scene);
    buildGenerators(scene);
    buildSensorMasts(scene);
    buildLogisticsTrucks(scene);
    buildCamoNetting(scene);
    buildGuardPosts(scene);

    function buildLauncherSites(scene) {
      var launcherPositions = [
        { x: -30, z: -40 },
        { x: 30, z: -40 },
        { x: -30, z: 40 },
        { x: 30, z: 40 }
      ];

      launcherPositions.forEach(function(pos, idx) {
        var truckGroup = createLauncherTruck(pos.x, pos.z);
        scene.add(truckGroup);
        battery.launchers.push(truckGroup);
        battery.launcherRotations.push(0);
        battery.spawnPoints.push({ x: pos.x, y: 0, z: pos.z, type: 'launcher' });
      });
    }

    function createLauncherTruck(x, z) {
      var group = new THREE.Group();
      group.position.set(x, 0, z);

      var truckBodyGeom = new THREE.BoxGeometry(8, 3, 4);
      var truckMaterial = new THREE.MeshLambertMaterial({ color: 0x667788 });
      var truckBody = new THREE.Mesh(truckBodyGeom, truckMaterial);
      truckBody.position.y = 1.5;
      truckBody.castShadow = true;
      truckBody.receiveShadow = true;
      group.add(truckBody);

      var cabGeom = new THREE.BoxGeometry(3, 2.5, 3);
      var cabMaterial = new THREE.MeshLambertMaterial({ color: 0x4A5C3A });
      var cab = new THREE.Mesh(cabGeom, cabMaterial);
      cab.position.set(3, 2.5, 0);
      cab.castShadow = true;
      cab.receiveShadow = true;
      group.add(cab);

      for (var i = 0; i < 4; i++) {
        var wheelGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var wheel = new THREE.Mesh(wheelGeom, wheelMaterial);
        var wheelX = (i < 2) ? -2 : 2;
        var wheelZ = (i % 2 === 0) ? -1.5 : 1.5;
        wheel.position.set(wheelX, 0.8, wheelZ);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        group.add(wheel);
      }

      var launcherMount = new THREE.Group();
      launcherMount.position.set(0, 4, 0);
      group.add(launcherMount);

      for (var j = 0; j < 4; j++) {
        var tubeGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 12);
        var tubeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var tube = new THREE.Mesh(tubeGeom, tubeMaterial);
        var tubeX = (j < 2) ? -1.5 : 1.5;
        var tubeZ = (j % 2 === 0) ? -1 : 1;
        tube.position.set(tubeX, 0, tubeZ);
        tube.rotation.x = -0.4;
        tube.castShadow = true;
        launcherMount.add(tube);
      }

      group.userData.launcherMount = launcherMount;
      return group;
    }

    function buildRadarStation(scene) {
      var radarGroup = new THREE.Group();
      radarGroup.position.set(0, 0, -50);
      scene.add(radarGroup);

      var baseGeom = new THREE.CylinderGeometry(3, 4, 2, 16);
      var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x4A5C3A });
      var base = new THREE.Mesh(baseGeom, baseMaterial);
      base.position.y = 1;
      base.castShadow = true;
      base.receiveShadow = true;
      radarGroup.add(base);

      var mastGeom = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
      var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var mast = new THREE.Mesh(mastGeom, mastMaterial);
      mast.position.y = 5;
      mast.castShadow = true;
      radarGroup.add(mast);

      var mountGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 12);
      var mountMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var mount = new THREE.Mesh(mountGeom, mountMaterial);
      mount.position.y = 9;
      mount.castShadow = true;
      radarGroup.add(mount);

      var dishGroup = new THREE.Group();
      dishGroup.position.set(0, 9.5, 0);
      radarGroup.add(dishGroup);

      var dishGeom = new THREE.CylinderGeometry(3, 3, 0.3, 20);
      var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
      var dish = new THREE.Mesh(dishGeom, dishMaterial);
      dish.castShadow = true;
      dish.receiveShadow = true;
      dishGroup.add(dish);

      battery.radarDish = dishGroup;
    }

    function buildCommandBunker(scene) {
      var bunkerGroup = new THREE.Group();
      bunkerGroup.position.set(0, 0, 0);
      scene.add(bunkerGroup);

      var mainWallGeom = new THREE.BoxGeometry(12, 4, 10);
      var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4A5C3A });
      var mainWall = new THREE.Mesh(mainWallGeom, wallMaterial);
      mainWall.position.y = 2;
      mainWall.castShadow = true;
      mainWall.receiveShadow = true;
      bunkerGroup.add(mainWall);

      var roofGeom = new THREE.BoxGeometry(12, 0.8, 10);
      var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x336644 });
      var roof = new THREE.Mesh(roofGeom, roofMaterial);
      roof.position.y = 4.5;
      roof.castShadow = true;
      roof.receiveShadow = true;
      bunkerGroup.add(roof);

      var doorGeom = new THREE.BoxGeometry(2, 2.5, 0.5);
      var doorMaterial = new THREE.MeshLambertMaterial({ color: 0xFF2200 });
      var door = new THREE.Mesh(doorGeom, doorMaterial);
      door.position.set(0, 1.5, 5.25);
      door.castShadow = true;
      bunkerGroup.add(door);

      var ventGeom = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
      var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var vent = new THREE.Mesh(ventGeom, ventMaterial);
      vent.position.set(4, 4.5, 3);
      vent.castShadow = true;
      bunkerGroup.add(vent);

      var vent2 = new THREE.Mesh(ventGeom, ventMaterial);
      vent2.position.set(-4, 4.5, -3);
      vent2.castShadow = true;
      bunkerGroup.add(vent2);

      battery.commandBunker = bunkerGroup;
      battery.spawnPoints.push({ x: 0, y: 0, z: 0, type: 'bunker' });
    }

    function buildAmmoDeps(scene) {
      var depPositions = [
        { x: -20, z: 25 },
        { x: 20, z: 25 },
        { x: -15, z: -25 },
        { x: 15, z: -25 }
      ];

      depPositions.forEach(function(pos) {
        var depGroup = new THREE.Group();
        depGroup.position.set(pos.x, 0, pos.z);
        scene.add(depGroup);

        var buildingGeom = new THREE.BoxGeometry(6, 3.5, 8);
        var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x336644 });
        var building = new THREE.Mesh(buildingGeom, buildingMaterial);
        building.position.y = 1.75;
        building.castShadow = true;
        building.receiveShadow = true;
        depGroup.add(building);

        var markerGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        var markerMaterial = new THREE.MeshLambertMaterial({ color: 0xFF2200 });
        var marker = new THREE.Mesh(markerGeom, markerMaterial);
        marker.position.set(0, 4, 0);
        depGroup.add(marker);

        battery.ammoDeps.push(depGroup);
        battery.spawnPoints.push({ x: pos.x, y: 0, z: pos.z, type: 'ammo' });
      });
    }

    function buildPerimeterFence(scene) {
      var fenceCorners = [
        { x: -60, z: -60 },
        { x: 60, z: -60 },
        { x: 60, z: 60 },
        { x: -60, z: 60 }
      ];

      for (var i = 0; i < fenceCorners.length; i++) {
        var current = fenceCorners[i];
        var next = fenceCorners[(i + 1) % fenceCorners.length];

        var segCount = 8;
        for (var s = 0; s < segCount; s++) {
          var t = s / segCount;
          var nextT = (s + 1) / segCount;

          var x1 = current.x + (next.x - current.x) * t;
          var z1 = current.z + (next.z - current.z) * t;
          var x2 = current.x + (next.x - current.x) * nextT;
          var z2 = current.z + (next.z - current.z) * nextT;

          var fenceGroup = new THREE.Group();
          fenceGroup.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
          scene.add(fenceGroup);

          var postGeom = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
          var postMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
          var post = new THREE.Mesh(postGeom, postMaterial);
          post.position.y = 1;
          post.castShadow = true;
          fenceGroup.add(post);

          var wireGeom = new THREE.BoxGeometry(0.05, 1.5, Math.sqrt((x2-x1)*(x2-x1) + (z2-z1)*(z2-z1)));
          var wireMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
          var wire = new THREE.Mesh(wireGeom, wireMaterial);
          wire.position.y = 1.25;
          wire.rotation.y = Math.atan2(z2 - z1, x2 - x1);
          fenceGroup.add(wire);

          battery.fenceSegments.push(fenceGroup);
        }
      }
    }

    function buildGenerators(scene) {
      var genPositions = [
        { x: -45, z: 0 },
        { x: 45, z: 0 }
      ];

      genPositions.forEach(function(pos) {
        var genGroup = new THREE.Group();
        genGroup.position.set(pos.x, 0, pos.z);
        scene.add(genGroup);

        var bodyGeom = new THREE.BoxGeometry(3, 2, 3);
        var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4A5C3A });
        var body = new THREE.Mesh(bodyGeom, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        body.receiveShadow = true;
        genGroup.add(body);

        var exhaustGeom = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
        var exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var exhaust = new THREE.Mesh(exhaustGeom, exhaustMaterial);
        exhaust.position.set(1, 3.5, 0);
        exhaust.castShadow = true;
        genGroup.add(exhaust);

        battery.generators.push(genGroup);
      });
    }

    function buildSensorMasts(scene) {
      var mastPositions = [
        { x: -50, z: 40 },
        { x: 50, z: -40 }
      ];

      mastPositions.forEach(function(pos) {
        var mastGroup = new THREE.Group();
        mastGroup.position.set(pos.x, 0, pos.z);
        scene.add(mastGroup);

        var baseGeom = new THREE.BoxGeometry(1.5, 0.5, 1.5);
        var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var base = new THREE.Mesh(baseGeom, baseMaterial);
        base.position.y = 0.25;
        base.castShadow = true;
        base.receiveShadow = true;
        mastGroup.add(base);

        var mastGeom = new THREE.CylinderGeometry(0.15, 0.15, 8, 8);
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var mast = new THREE.Mesh(mastGeom, mastMaterial);
        mast.position.y = 4.5;
        mast.castShadow = true;
        mastGroup.add(mast);

        var antennaGeom = new THREE.BoxGeometry(3, 0.2, 0.2);
        var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var antenna = new THREE.Mesh(antennaGeom, antennaMaterial);
        antenna.position.set(0, 8.5, 0);
        antenna.castShadow = true;
        mastGroup.add(antenna);

        battery.sensorMasts.push(mastGroup);
        battery.spawnPoints.push({ x: pos.x, y: 0, z: pos.z, type: 'sensor' });
      });
    }

    function buildLogisticsTrucks(scene) {
      var truckPositions = [
        { x: 0, z: -35 },
        { x: 0, z: 35 }
      ];

      truckPositions.forEach(function(pos) {
        var truckGroup = new THREE.Group();
        truckGroup.position.set(pos.x, 0, pos.z);
        scene.add(truckGroup);

        var containerGeom = new THREE.BoxGeometry(5, 2.5, 3);
        var containerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
        var container = new THREE.Mesh(containerGeom, containerMaterial);
        container.position.y = 1.5;
        container.castShadow = true;
        container.receiveShadow = true;
        truckGroup.add(container);

        var cabGeom = new THREE.BoxGeometry(2, 2, 2);
        var cabMaterial = new THREE.MeshLambertMaterial({ color: 0x4A5C3A });
        var cab = new THREE.Mesh(cabGeom, cabMaterial);
        cab.position.set(3, 1.5, 0);
        cab.castShadow = true;
        truckGroup.add(cab);

        battery.logisticsTrucks.push(truckGroup);
      });
    }

    function buildGuardPosts(scene) {
      var postPositions = [
        { x: -60, z: 0 },
        { x: 60, z: 0 },
        { x: 0, z: -60 },
        { x: 0, z: 60 }
      ];

      postPositions.forEach(function(pos) {
        var postGroup = new THREE.Group();
        postGroup.position.set(pos.x, 0, pos.z);
        scene.add(postGroup);

        var platformGeom = new THREE.CylinderGeometry(2, 2, 0.3, 8);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var platform = new THREE.Mesh(platformGeom, platformMaterial);
        platform.position.y = 0.15;
        platform.castShadow = true;
        platform.receiveShadow = true;
        postGroup.add(platform);

        var railGeom = new THREE.CylinderGeometry(0.1, 0.1, 2, 6);
        var railMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        for (var i = 0; i < 4; i++) {
          var rail = new THREE.Mesh(railGeom, railMaterial);
          rail.position.set(
            1.4 * Math.cos(i * Math.PI / 2),
            1,
            1.4 * Math.sin(i * Math.PI / 2)
          );
          rail.castShadow = true;
          postGroup.add(rail);
        }

        battery.guardPosts.push(postGroup);
        battery.spawnPoints.push({ x: pos.x, y: 0, z: pos.z, type: 'guard' });
      });
    }

    function buildCamoNetting(scene) {
      for (var i = 0; i < battery.launchers.length; i++) {
        var launcher = battery.launchers[i];
        var netGroup = new THREE.Group();
        netGroup.position.copy(launcher.position);
        scene.add(netGroup);

        for (var j = 0; j < 3; j++) {
          var netGeom = new THREE.BoxGeometry(10, 0.01, 8);
          var netMaterial = new THREE.MeshLambertMaterial({ color: 0x556633 });
          var net = new THREE.Mesh(netGeom, netMaterial);
          net.position.y = 3 + j * 1.5;
          net.castShadow = true;
          net.receiveShadow = true;
          netGroup.add(net);
        }

        battery.camoNetting.push(netGroup);
      }
    }

    function buildGuardPosts(scene) {
      var postPositions = [
        { x: -60, z: 0 },
        { x: 60, z: 0 },
        { x: 0, z: -60 },
        { x: 0, z: 60 }
      ];

      postPositions.forEach(function(pos) {
        var postGroup = new THREE.Group();
        postGroup.position.set(pos.x, 0, pos.z);
        scene.add(postGroup);

        var platformGeom = new THREE.CylinderGeometry(2, 2, 0.3, 8);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var platform = new THREE.Mesh(platformGeom, platformMaterial);
        platform.position.y = 0.15;
        platform.castShadow = true;
        platform.receiveShadow = true;
        postGroup.add(platform);

        var railGeom = new THREE.CylinderGeometry(0.1, 0.1, 2, 6);
        var railMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        for (var r = 0; r < 4; r++) {
          var rail = new THREE.Mesh(railGeom, railMaterial);
          rail.position.set(
            1.4 * Math.cos(r * Math.PI / 2),
            1,
            1.4 * Math.sin(r * Math.PI / 2)
          );
          rail.castShadow = true;
          postGroup.add(rail);
        }

        battery.guardPosts.push(postGroup);
        battery.spawnPoints.push({ x: pos.x, y: 0, z: pos.z, type: 'guard' });
      });
    }
  }

  function update(delta) {
    battery.radarRotation += delta * 0.5;
    if (battery.radarDish) {
      battery.radarDish.rotation.y = battery.radarRotation;
    }

    for (var i = 0; i < battery.launchers.length; i++) {
      var launcher = battery.launchers[i];
      if (launcher.userData.launcherMount) {
        battery.launcherRotations[i] += delta * 0.3;
        launcher.userData.launcherMount.rotation.y = Math.sin(battery.launcherRotations[i]) * 0.8;
        launcher.userData.launcherMount.rotation.x = Math.cos(battery.launcherRotations[i]) * 0.4;
      }
    }

    battery.generatorFlicker += delta * 2;
    for (var g = 0; g < battery.generators.length; g++) {
      var gen = battery.generators[g];
      var children = gen.children;
      for (var c = 0; c < children.length; c++) {
        if (children[c].material && children[c].material.emissive) {
          var flicker = Math.sin(battery.generatorFlicker) * 0.1;
          children[c].material.emissive.setHex(0x330000);
          children[c].material.emissiveIntensity = Math.max(0, 0.2 + flicker);
        }
      }
    }

    battery.sensorBlink += delta * 3;
    for (var s = 0; s < battery.sensorMasts.length; s++) {
      var mast = battery.sensorMasts[s];
      var mastChildren = mast.children;
      for (var m = 0; m < mastChildren.length; m++) {
        if (mastChildren[m].material && mastChildren[m].geometry.parameters && mastChildren[m].geometry.parameters.width) {
          var blink = (Math.sin(battery.sensorBlink) + 1) / 2;
          mastChildren[m].material.color.setHex(0xFF0000);
          mastChildren[m].material.emissiveIntensity = blink * 0.6;
        }
      }
    }

    for (var f = 0; f < battery.fenceSegments.length; f++) {
      battery.fenceSegments[f].rotation.y += delta * 0.05;
    }

    for (var l = 0; l < battery.logisticsTrucks.length; l++) {
      battery.logisticsTrucks[l].rotation.y += delta * 0.1;
    }
  }

  function reset() {
    battery.launchers = [];
    battery.radarDish = null;
    battery.commandBunker = null;
    battery.ammoDeps = [];
    battery.generators = [];
    battery.fenceSegments = [];
    battery.guardPosts = [];
    battery.logisticsTrucks = [];
    battery.sensorMasts = [];
    battery.camoNetting = [];
    battery.radarRotation = 0;
    battery.launcherRotations = [];
    battery.generatorFlicker = 0;
    battery.sensorBlink = 0;
    battery.spawnPoints = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
