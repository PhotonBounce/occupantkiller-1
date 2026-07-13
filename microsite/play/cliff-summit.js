window.CliffSummit = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var windParticles = [];
  var cloudDrifters = [];
  var fogParticles = [];
  var antenna = null;
  var patrolWaypoints = [];

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    windParticles = [];
    cloudDrifters = [];
    fogParticles = [];
    patrolWaypoints = [];

    createRockyTerrain();
    createCommunicationsTower();
    createMountainPaths();
    createSniperNests();
    createWindParticles();
    createCloudCover();
    createCableCarStation();
    createFogParticles();
    createPatrolWaypoints();
    createSupplyCrates();
  }

  function createRockyTerrain() {
    var colors = [0x5a4a3a, 0x6b5a4a, 0x7a6a5a, 0x4a3a2a, 0x8a7a6a];
    var colorIndex = 0;

    var basePositions = [
      { x: -30, z: 0, h: 8 },
      { x: -20, z: -15, h: 6 },
      { x: -10, z: -20, h: 7 },
      { x: 0, z: -25, h: 5 },
      { x: 10, z: -20, h: 9 },
      { x: 20, z: -10, h: 6 },
      { x: 30, z: 0, h: 8 },
      { x: -25, z: 15, h: 7 },
      { x: 0, z: 20, h: 6 },
      { x: 25, z: 15, h: 8 }
    ];

    for (var i = 0; i < basePositions.length; i++) {
      var pos = basePositions[i];
      var geometry = new THREE.BoxGeometry(12, pos.h, 12);
      var material = new THREE.MeshStandardMaterial({ color: colors[colorIndex % colors.length] });
      var rock = new THREE.Mesh(geometry, material);
      rock.position.set(pos.x, pos.h / 2, pos.z);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      colorIndex++;

      if (Math.random() > 0.4) {
        var smallGeom = new THREE.BoxGeometry(6, pos.h * 0.5, 6);
        var smallMat = new THREE.MeshStandardMaterial({ color: colors[(colorIndex + 1) % colors.length] });
        var smallRock = new THREE.Mesh(smallGeom, smallMat);
        smallRock.position.set(pos.x + 8, pos.h * 0.5, pos.z + 8);
        smallRock.castShadow = true;
        smallRock.receiveShadow = true;
        scene.add(smallRock);
        colorIndex++;
      }
    }
  }

  function createCommunicationsTower() {
    var towerGeometry = new THREE.CylinderGeometry(2, 2.5, 35, 16);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(0, 25, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    var platformGeometry = new THREE.CylinderGeometry(4, 4, 1, 32);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 18, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);

    var antennaGeometry = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
    var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.9 });
    antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(0, 40, 0);
    antenna.castShadow = true;
    scene.add(antenna);

    var dish1Geometry = new THREE.ConeGeometry(3, 1.5, 16);
    var dishMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7 });
    var dish1 = new THREE.Mesh(dish1Geometry, dishMaterial);
    dish1.position.set(2, 35, 0);
    dish1.rotation.z = Math.PI / 6;
    dish1.castShadow = true;
    scene.add(dish1);

    var dish2Geometry = new THREE.ConeGeometry(2.5, 1.2, 16);
    var dish2 = new THREE.Mesh(dish2Geometry, dishMaterial);
    dish2.position.set(-2, 32, 0);
    dish2.rotation.z = -Math.PI / 6;
    dish2.castShadow = true;
    scene.add(dish2);

    var cageGeometry = new THREE.BoxGeometry(3, 4, 3);
    var cageMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.6 });
    var cage = new THREE.Mesh(cageGeometry, cageMaterial);
    cage.position.set(0, 22, 0);
    cage.castShadow = true;
    scene.add(cage);
  }

  function createMountainPaths() {
    var paths = [
      { startX: -25, startZ: -25, endX: 25, endZ: -25 },
      { startX: -25, startZ: 0, endX: 25, endZ: 0 },
      { startX: -25, startZ: 25, endX: 25, endZ: 25 }
    ];

    for (var p = 0; p < paths.length; p++) {
      var path = paths[p];
      var segments = 20;
      var positions = [];

      for (var s = 0; s <= segments; s++) {
        var t = s / segments;
        var x = path.startX + (path.endX - path.startX) * t;
        var z = path.startZ + (path.endZ - path.startZ) * t;
        positions.push(new THREE.Vector3(x, 0.5, z));
      }

      for (var i = 0; i < positions.length - 1; i++) {
        var pathGeometry = new THREE.BoxGeometry(2, 0.5, 3);
        var pathMaterial = new THREE.MeshStandardMaterial({ color: 0x665544 });
        var pathTile = new THREE.Mesh(pathGeometry, pathMaterial);
        pathTile.position.copy(positions[i]);
        pathTile.receiveShadow = true;
        scene.add(pathTile);

        if (i % 2 === 0) {
          var railGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
          var railMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
          var leftRail = new THREE.Mesh(railGeometry, railMaterial);
          leftRail.position.set(positions[i].x - 1.5, 1.2, positions[i].z);
          leftRail.castShadow = true;
          scene.add(leftRail);

          var rightRail = new THREE.Mesh(railGeometry, railMaterial);
          rightRail.position.set(positions[i].x + 1.5, 1.2, positions[i].z);
          rightRail.castShadow = true;
          scene.add(rightRail);

          if (i > 0) {
            var railConnector = new THREE.LineSegments(
              new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(positions[i].x - 1.5, 1.2, positions[i].z),
                new THREE.Vector3(positions[i].x + 1.5, 1.2, positions[i].z)
              ]),
              new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 })
            );
            scene.add(railConnector);
          }
        }
      }
    }
  }

  function createSniperNests() {
    var nestPositions = [
      { x: -35, z: -20 },
      { x: 35, z: -20 },
      { x: -35, z: 20 },
      { x: 35, z: 20 }
    ];

    for (var n = 0; n < nestPositions.length; n++) {
      var nest = nestPositions[n];

      var sandbagGeometry = new THREE.BoxGeometry(8, 1.5, 2);
      var sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
      var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbag.position.set(nest.x, 1, nest.z);
      sandbag.castShadow = true;
      scene.add(sandbag);

      var wall2Geometry = new THREE.BoxGeometry(8, 1, 1);
      var wall2 = new THREE.Mesh(wall2Geometry, sandbagMaterial);
      wall2.position.set(nest.x, 2.5, nest.z);
      wall2.castShadow = true;
      scene.add(wall2);

      var platformGeometry = new THREE.BoxGeometry(6, 0.5, 6);
      var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x6b5844 });
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(nest.x, 2, nest.z);
      platform.receiveShadow = true;
      scene.add(platform);

      var scopeMountGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
      var scopeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var scopeMount = new THREE.Mesh(scopeMountGeometry, scopeMaterial);
      scopeMount.position.set(nest.x - 1, 2.5, nest.z);
      scopeMount.castShadow = true;
      scene.add(scopeMount);
    }
  }

  function createWindParticles() {
    var particleCount = 80;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particleCount * 3);

    for (var i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = Math.random() * 60 + 5;
      positions[i + 2] = (Math.random() - 0.5) * 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.3 });
    var particles = new THREE.Points(geometry, material);
    scene.add(particles);

    for (var p = 0; p < particleCount; p++) {
      windParticles.push({
        index: p,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 5,
        mesh: particles
      });
    }
  }

  function createCloudCover() {
    var cloudCount = 5;
    for (var c = 0; c < cloudCount; c++) {
      var cloudGeometry = new THREE.BoxGeometry(40, 8, 30);
      var cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        transparent: true,
        opacity: 0.3,
        emissive: 0x999999
      });
      var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 80,
        30 + Math.random() * 10,
        (Math.random() - 0.5) * 80
      );
      scene.add(cloud);

      cloudDrifters.push({
        mesh: cloud,
        vx: (Math.random() - 0.5) * 8,
        vz: (Math.random() - 0.5) * 4,
        startX: cloud.position.x,
        startZ: cloud.position.z
      });
    }
  }

  function createCableCarStation() {
    var stationGeometry = new THREE.BoxGeometry(8, 6, 5);
    var stationMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var station = new THREE.Mesh(stationGeometry, stationMaterial);
    station.position.set(-45, 10, 0);
    station.castShadow = true;
    scene.add(station);

    var roofGeometry = new THREE.ConeGeometry(5, 3, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-45, 10, 0);
    roof.castShadow = true;
    scene.add(roof);

    var poleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 15, 12);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(-45, 12, 0);
    pole.castShadow = true;
    scene.add(pole);

    var cablePoints = [
      new THREE.Vector3(-45, 22, 0),
      new THREE.Vector3(5, 25, 0)
    ];
    var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 3 });
    var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
    scene.add(cable);

    var carGeometry = new THREE.BoxGeometry(2, 2, 2);
    var carMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    var cablecar = new THREE.Mesh(carGeometry, carMaterial);
    cablecar.position.set(-30, 24, 0);
    cablecar.castShadow = true;
    scene.add(cablecar);
  }

  function createFogParticles() {
    var fogCount = 60;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(fogCount * 3);

    for (var i = 0; i < fogCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60;
      positions[i + 1] = Math.random() * 20 + 2;
      positions[i + 2] = (Math.random() - 0.5) * 60;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var material = new THREE.PointsMaterial({ color: 0xcccccc, size: 0.5, transparent: true, opacity: 0.25 });
    var fogMesh = new THREE.Points(geometry, material);
    scene.add(fogMesh);

    for (var f = 0; f < fogCount; f++) {
      fogParticles.push({
        index: f,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 0.5,
        mesh: fogMesh,
        drift: Math.random() * Math.PI * 2
      });
    }
  }

  function createPatrolWaypoints() {
    var waypoints = [
      new THREE.Vector3(-25, 1, -25),
      new THREE.Vector3(0, 1, -25),
      new THREE.Vector3(25, 1, -25),
      new THREE.Vector3(25, 1, 0),
      new THREE.Vector3(25, 1, 25),
      new THREE.Vector3(0, 1, 25),
      new THREE.Vector3(-25, 1, 25),
      new THREE.Vector3(-25, 1, 0),
      new THREE.Vector3(-35, 5, -20),
      new THREE.Vector3(35, 5, -20),
      new THREE.Vector3(-35, 5, 20),
      new THREE.Vector3(35, 5, 20)
    ];

    for (var w = 0; w < waypoints.length; w++) {
      patrolWaypoints.push(waypoints[w]);
      var markerGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      var markerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x880000 });
      var marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(waypoints[w]);
      marker.visible = false;
      scene.add(marker);
    }
  }

  function createSupplyCrates() {
    var cratePositions = [
      { x: -20, z: -15 },
      { x: 20, z: -15 },
      { x: -20, z: 15 },
      { x: 20, z: 15 },
      { x: 0, z: 0 }
    ];

    for (var cr = 0; cr < cratePositions.length; cr++) {
      var pos = cratePositions[cr];

      var crateGeometry = new THREE.BoxGeometry(3, 3, 3);
      var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6914 });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(pos.x, 2, pos.z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);

      var ammoBoxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var ammoMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var ammoBox = new THREE.Mesh(ammoBoxGeometry, ammoMaterial);
      ammoBox.position.set(pos.x + 2, 2, pos.z);
      ammoBox.castShadow = true;
      scene.add(ammoBox);

      var ammoBox2 = new THREE.Mesh(ammoBoxGeometry, ammoMaterial);
      ammoBox2.position.set(pos.x - 2, 2, pos.z);
      ammoBox2.castShadow = true;
      scene.add(ammoBox2);
    }
  }

  function update(delta) {
    if (antenna) {
      antenna.rotation.y += delta * 0.5;
    }

    for (var w = 0; w < windParticles.length; w++) {
      var particle = windParticles[w];
      var positions = particle.mesh.geometry.attributes.position.array;
      var idx = particle.index * 3;

      positions[idx] += particle.vx * delta;
      positions[idx + 1] += particle.vy * delta;
      positions[idx + 2] += particle.vz * delta;

      if (positions[idx] > 50) positions[idx] = -50;
      if (positions[idx] < -50) positions[idx] = 50;
      if (positions[idx + 1] > 70) positions[idx + 1] = 5;
      if (positions[idx + 1] < 5) positions[idx + 1] = 70;
      if (positions[idx + 2] > 50) positions[idx + 2] = -50;
      if (positions[idx + 2] < -50) positions[idx + 2] = 50;
    }
    if (windParticles.length > 0) {
      windParticles[0].mesh.geometry.attributes.position.needsUpdate = true;
    }

    for (var c = 0; c < cloudDrifters.length; c++) {
      var cloud = cloudDrifters[c];
      cloud.mesh.position.x += cloud.vx * delta;
      cloud.mesh.position.z += cloud.vz * delta;

      if (Math.abs(cloud.mesh.position.x - cloud.startX) > 40) {
        cloud.vx *= -1;
      }
      if (Math.abs(cloud.mesh.position.z - cloud.startZ) > 40) {
        cloud.vz *= -1;
      }
    }

    for (var f = 0; f < fogParticles.length; f++) {
      var fog = fogParticles[f];
      var fogPositions = fog.mesh.geometry.attributes.position.array;
      var fIdx = fog.index * 3;

      fogPositions[fIdx] += Math.cos(fog.drift + Date.now() * 0.001) * fog.vx * delta;
      fogPositions[fIdx + 1] += fog.vy * delta;
      fogPositions[fIdx + 2] += Math.sin(fog.drift + Date.now() * 0.001) * fog.vx * delta;

      if (fogPositions[fIdx] > 30) fogPositions[fIdx] = -30;
      if (fogPositions[fIdx] < -30) fogPositions[fIdx] = 30;
      if (fogPositions[fIdx + 2] > 30) fogPositions[fIdx + 2] = -30;
      if (fogPositions[fIdx + 2] < -30) fogPositions[fIdx + 2] = 30;
    }
    if (fogParticles.length > 0) {
      fogParticles[0].mesh.geometry.attributes.position.needsUpdate = true;
    }
  }

  function reset() {
    windParticles = [];
    cloudDrifters = [];
    fogParticles = [];
    patrolWaypoints = [];
    antenna = null;

    if (scene) {
      var toRemove = [];
      scene.traverse(function(child) {
        if (child !== scene && child !== camera) {
          toRemove.push(child);
        }
      });
      for (var i = 0; i < toRemove.length; i++) {
        scene.remove(toRemove[i]);
      }
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
