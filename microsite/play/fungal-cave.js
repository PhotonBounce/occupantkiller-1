window.FungalCave = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var lights = [];
  var particles = [];
  var glowObjects = [];
  var myceliumNetworks = [];
  var updateTime = 0;

  var init = function(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    objects = [];
    lights = [];
    particles = [];
    glowObjects = [];
    myceliumNetworks = [];
    updateTime = 0;

    scene.background = new THREE.Color(0x0a0a15);
    scene.fog = new THREE.Fog(0x0a0a15, 100, 200);

    createCaveFloor();
    createMushroomColumns();
    createFungalWalls();
    createMyceliumNetwork();
    createRopeDescentPoints();
    createEquipmentCache();
    createCaveCrystals();
    createRiverPassage();
    createMilitaryOutpost();
    createSporeEmitters();
    createLighting();
  };

  var createCaveFloor = function() {
    var floorGeo = new THREE.BoxGeometry(80, 1, 80);
    var floorMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      roughness: 0.8,
      metalness: 0.1
    });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);
  };

  var createMushroomColumns = function() {
    var positions = [
      { x: -30, z: -20 },
      { x: 0, z: -30 },
      { x: 30, z: -20 },
      { x: -25, z: 25 },
      { x: 20, z: 30 },
      { x: 10, z: -10 }
    ];

    positions.forEach(function(pos) {
      createMushroomPair(pos.x, pos.z);
    });
  };

  var createMushroomPair = function(x, z) {
    var stalkGeo = new THREE.CylinderGeometry(1.2, 1.5, 25, 8);
    var stalkMat = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.7,
      metalness: 0.0
    });
    var stalk = new THREE.Mesh(stalkGeo, stalkMat);
    stalk.position.set(x, 12, z);
    stalk.castShadow = true;
    stalk.receiveShadow = true;
    scene.add(stalk);
    objects.push(stalk);

    var capGeo = new THREE.ConeGeometry(3.5, 6, 16);
    var capMat = new THREE.MeshStandardMaterial({
      color: 0x9d4edd,
      emissive: 0x5a0b7d,
      emissiveIntensity: 0.3,
      roughness: 0.6,
      metalness: 0.2
    });
    var cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(x, 28, z);
    cap.castShadow = true;
    cap.receiveShadow = true;
    scene.add(cap);
    objects.push(cap);
    glowObjects.push({
      mesh: cap,
      baseIntensity: 0.3,
      pulseSpeed: 0.8
    });
  };

  var createFungalWalls = function() {
    var wallPositions = [
      { x: -40, z: 0, rotZ: 0 },
      { x: 40, z: 0, rotZ: 0 },
      { x: 0, z: -40, rotZ: Math.PI / 2 },
      { x: 0, z: 40, rotZ: Math.PI / 2 }
    ];

    wallPositions.forEach(function(pos) {
      var clusterCount = 8;
      for (var i = 0; i < clusterCount; i++) {
        var offsetY = (i - clusterCount / 2) * 8;
        var offsetXZ = Math.random() * 2 - 1;

        var glyphGeo = new THREE.SphereGeometry(0.8, 6, 6);
        var glyphMat = new THREE.MeshStandardMaterial({
          color: 0x7d3c98,
          emissive: 0xc77dff,
          emissiveIntensity: 0.4,
          roughness: 0.5
        });
        var glyph = new THREE.Mesh(glyphGeo, glyphMat);

        if (Math.abs(pos.x) > Math.abs(pos.z)) {
          glyph.position.set(pos.x, 15 + offsetY, pos.z + offsetXZ);
        } else {
          glyph.position.set(pos.x + offsetXZ, 15 + offsetY, pos.z);
        }

        glyph.castShadow = true;
        glyph.receiveShadow = true;
        scene.add(glyph);
        objects.push(glyph);
        glowObjects.push({
          mesh: glyph,
          baseIntensity: 0.4,
          pulseSpeed: 1.2
        });
      }
    });
  };

  var createMyceliumNetwork = function() {
    var networkPaths = [
      {
        start: [-30, 5, -20],
        end: [30, 5, 20],
        branches: 3
      },
      {
        start: [-20, 5, 30],
        end: [20, 5, -30],
        branches: 3
      },
      {
        start: [0, 5, -35],
        end: [0, 5, 35],
        branches: 2
      }
    ];

    networkPaths.forEach(function(path) {
      createMyceliumPath(path.start, path.end, path.branches);
    });
  };

  var createMyceliumPath = function(start, end, branchCount) {
    var points = [];
    points.push(new THREE.Vector3(start[0], start[1], start[2]));

    for (var i = 1; i < branchCount; i++) {
      var t = i / branchCount;
      var x = start[0] + (end[0] - start[0]) * t;
      var y = start[1] + Math.sin(t * Math.PI) * 2;
      var z = start[2] + (end[2] - start[2]) * t;
      points.push(new THREE.Vector3(x, y, z));
    }

    points.push(new THREE.Vector3(end[0], end[1], end[2]));

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({
      color: 0x00ff99,
      linewidth: 3,
      emissive: 0x00ff99
    });
    var line = new THREE.LineSegments(geometry, material);
    scene.add(line);
    myceliumNetworks.push({
      mesh: line,
      glowIntensity: 0.5
    });
  };

  var createRopeDescentPoints = function() {
    var ropeSites = [
      { x: -25, z: -25 },
      { x: 25, z: 25 },
      { x: -15, z: 15 }
    ];

    ropeSites.forEach(function(site) {
      var anchorGeo = new THREE.SphereGeometry(0.5, 4, 4);
      var anchorMat = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.6
      });
      var anchor = new THREE.Mesh(anchorGeo, anchorMat);
      anchor.position.set(site.x, 40, site.z);
      anchor.castShadow = true;
      scene.add(anchor);
      objects.push(anchor);

      var ropePoints = [];
      ropePoints.push(new THREE.Vector3(site.x, 40, site.z));
      ropePoints.push(new THREE.Vector3(site.x + 0.3, 0, site.z));
      var ropeGeo = new THREE.BufferGeometry().setFromPoints(ropePoints);
      var ropeMat = new THREE.LineBasicMaterial({ color: 0xcccccc });
      var rope = new THREE.LineSegments(ropeGeo, ropeMat);
      scene.add(rope);
      objects.push(rope);
    });
  };

  var createEquipmentCache = function() {
    var cacheX = 35;
    var cacheZ = -35;

    var crateGeo = new THREE.BoxGeometry(3, 2, 3);
    var crateMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.8
    });

    for (var i = 0; i < 4; i++) {
      var crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(cacheX + i * 4, 1, cacheZ);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      objects.push(crate);
    }

    var containerGeo = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
    var containerMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.7,
      metalness: 0.3
    });
    var container = new THREE.Mesh(containerGeo, containerMat);
    container.position.set(cacheX + 10, 1.5, cacheZ);
    container.castShadow = true;
    container.receiveShadow = true;
    scene.add(container);
    objects.push(container);
  };

  var createCaveCrystals = function() {
    var crystalSites = [
      { x: -35, z: 35, count: 5 },
      { x: 35, z: -35, count: 4 },
      { x: -10, z: -35, count: 3 },
      { x: 30, z: 15, count: 3 }
    ];

    crystalSites.forEach(function(site) {
      for (var i = 0; i < site.count; i++) {
        var offsetX = (Math.random() - 0.5) * 8;
        var offsetZ = (Math.random() - 0.5) * 8;
        var height = Math.random() * 8 + 4;
        var radius = Math.random() * 0.8 + 0.5;

        var crystalGeo = new THREE.ConeGeometry(radius, height, 6);
        var crystalMat = new THREE.MeshStandardMaterial({
          color: 0x663399,
          emissive: 0x9966ff,
          emissiveIntensity: 0.2,
          roughness: 0.3,
          metalness: 0.1
        });
        var crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set(site.x + offsetX, height / 2, site.z + offsetZ);
        crystal.rotation.x = Math.random() * 0.3;
        crystal.rotation.z = Math.random() * 0.3;
        crystal.castShadow = true;
        crystal.receiveShadow = true;
        scene.add(crystal);
        objects.push(crystal);
        glowObjects.push({
          mesh: crystal,
          baseIntensity: 0.2,
          pulseSpeed: 0.5
        });
      }
    });
  };

  var createRiverPassage = function() {
    var riverX = -35;
    var riverLength = 50;
    var riverSegments = 10;

    for (var i = 0; i < riverSegments; i++) {
      var z = -25 + (i / riverSegments) * riverLength;
      var width = 4 + Math.sin(i * 0.5) * 1;

      var riverBedGeo = new THREE.BoxGeometry(width, 0.5, 5);
      var riverMat = new THREE.MeshStandardMaterial({
        color: 0x1a4d6d,
        roughness: 0.4,
        metalness: 0.3
      });
      var riverBed = new THREE.Mesh(riverBedGeo, riverMat);
      riverBed.position.set(riverX, -0.3, z);
      riverBed.receiveShadow = true;
      scene.add(riverBed);
      objects.push(riverBed);
    }
  };

  var createMilitaryOutpost = function() {
    var outpostX = 20;
    var outpostZ = -20;

    var tentGeo = new THREE.ConeGeometry(2, 3, 8);
    var tentMat = new THREE.MeshStandardMaterial({
      color: 0x556b2f,
      roughness: 0.6
    });
    var tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.set(outpostX, 1.5, outpostZ);
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);
    objects.push(tent);

    var storageGeo = new THREE.BoxGeometry(2, 2.5, 2);
    var storageMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.7,
      metalness: 0.2
    });
    var storage = new THREE.Mesh(storageGeo, storageMat);
    storage.position.set(outpostX + 5, 1.25, outpostZ);
    storage.castShadow = true;
    storage.receiveShadow = true;
    scene.add(storage);
    objects.push(storage);

    var beaconGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6);
    var beaconMat = new THREE.MeshStandardMaterial({
      color: 0xff6b35,
      emissive: 0xff6b35,
      emissiveIntensity: 0.4,
      roughness: 0.5
    });
    var beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(outpostX + 5, 3, outpostZ);
    beacon.castShadow = true;
    scene.add(beacon);
    objects.push(beacon);
    glowObjects.push({
      mesh: beacon,
      baseIntensity: 0.4,
      pulseSpeed: 2.0
    });
  };

  var createSporeEmitters = function() {
    var emitterPositions = [
      { x: -25, y: 20, z: 25 },
      { x: 15, y: 25, z: -15 },
      { x: 0, y: 22, z: 0 },
      { x: 30, y: 20, z: 20 }
    ];

    emitterPositions.forEach(function(pos) {
      var emitterGeo = new THREE.SphereGeometry(0.4, 4, 4);
      var emitterMat = new THREE.MeshStandardMaterial({
        color: 0xc77dff,
        emissive: 0xc77dff,
        emissiveIntensity: 0.6
      });
      var emitter = new THREE.Mesh(emitterGeo, emitterMat);
      emitter.position.set(pos.x, pos.y, pos.z);
      scene.add(emitter);
      glowObjects.push({
        mesh: emitter,
        baseIntensity: 0.6,
        pulseSpeed: 1.5
      });
      particles.push({
        emitterPos: [pos.x, pos.y, pos.z],
        spores: []
      });
    });
  };

  var createLighting = function() {
    var ambientLight = new THREE.AmbientLight(0x4a4a6a, 0.4);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x6b5b95, 0.6);
    directionalLight.position.set(40, 50, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 150;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    scene.add(directionalLight);
    lights.push(directionalLight);

    var purpleLight = new THREE.PointLight(0x9d4edd, 1.5, 60);
    purpleLight.position.set(-30, 20, 20);
    scene.add(purpleLight);
    lights.push(purpleLight);

    var cyanLight = new THREE.PointLight(0x00ff99, 1.2, 50);
    cyanLight.position.set(25, 15, -25);
    scene.add(cyanLight);
    lights.push(cyanLight);

    var warmLight = new THREE.PointLight(0xff6b35, 0.8, 40);
    warmLight.position.set(0, 25, 0);
    scene.add(warmLight);
    lights.push(warmLight);
  };

  var update = function(delta) {
    updateTime += delta;

    glowObjects.forEach(function(glowObj) {
      var pulse = Math.sin(updateTime * glowObj.pulseSpeed) * 0.5 + 0.5;
      var intensity = glowObj.baseIntensity * (0.6 + pulse * 0.4);
      glowObj.mesh.material.emissiveIntensity = intensity;
    });

    myceliumNetworks.forEach(function(network) {
      var wave = Math.sin(updateTime * 0.8) * 0.5 + 0.5;
      var intensity = 0.3 + wave * 0.4;
      network.mesh.material.opacity = 0.4 + intensity * 0.3;
    });

    if (updateTime % 2 < delta) {
      releaseSpores();
    }
  };

  var releaseSpores = function() {
    particles.forEach(function(particle) {
      for (var i = 0; i < 3; i++) {
        particle.spores.push({
          x: particle.emitterPos[0] + (Math.random() - 0.5) * 2,
          y: particle.emitterPos[1],
          z: particle.emitterPos[2] + (Math.random() - 0.5) * 2,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * 5,
          vz: (Math.random() - 0.5) * 3,
          age: 0,
          lifetime: 5
        });
      }
    });
  };

  var reset = function() {
    updateTime = 0;

    glowObjects.forEach(function(glowObj) {
      glowObj.mesh.material.emissiveIntensity = glowObj.baseIntensity;
    });

    particles.forEach(function(particle) {
      particle.spores = [];
    });
  };

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
