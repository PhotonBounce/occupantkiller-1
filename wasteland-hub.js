window.WastelandHub = (function() {
  'use strict';

  var scene;
  var objects = [];
  var lanternGroup;
  var marketCanopy;

  function init(sceneRef, camera) {
    scene = sceneRef;
    objects = [];

    buildGround();
    buildCentralTower();
    buildShantyStalls();
    buildFuelStorageTanks();
    buildWreckedVehicles();
    buildWaterCistern();
    buildHangingLanterns();
    buildGuardTowers();
    buildMarketCanopy();
  }

  function buildGround() {
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 });
    var groundGeo = new THREE.BoxGeometry(300, 1, 300);
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1;
    scene.add(ground);
    objects.push(ground);
  }

  function buildCentralTower() {
    var scrapMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.4 });
    var towerGroup = new THREE.Group();

    var sizes = [
      { w: 8, h: 12, d: 8, y: 6 },
      { w: 6, h: 10, d: 6, y: 16 },
      { w: 4, h: 8, d: 4, y: 24 }
    ];

    for (var i = 0; i < sizes.length; i++) {
      var s = sizes[i];
      var geo = new THREE.BoxGeometry(s.w, s.h, s.d);
      var mesh = new THREE.Mesh(geo, scrapMat);
      mesh.position.y = s.y;
      mesh.rotation.z = Math.random() * 0.1 - 0.05;
      towerGroup.add(mesh);
      objects.push(mesh);
    }

    towerGroup.position.set(0, 0, 0);
    scene.add(towerGroup);
  }

  function buildShantyStalls() {
    var woodMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9 });
    var baseRadius = 30;
    var stallCount = 6;

    for (var i = 0; i < stallCount; i++) {
      var angle = (i / stallCount) * Math.PI * 2;
      var x = Math.cos(angle) * baseRadius;
      var z = Math.sin(angle) * baseRadius;

      var geo = new THREE.BoxGeometry(5, 4, 5);
      var stall = new THREE.Mesh(geo, woodMat);
      stall.position.set(x, 2, z);
      stall.rotation.z = 0.3 - Math.random() * 0.15;
      scene.add(stall);
      objects.push(stall);
    }
  }

  function buildFuelStorageTanks() {
    var metalMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.8, roughness: 0.5 });
    var platformMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });

    var tankPositions = [
      { x: -50, z: -40 },
      { x: 50, z: -40 }
    ];

    for (var i = 0; i < tankPositions.length; i++) {
      var pos = tankPositions[i];
      var tankGeo = new THREE.CylinderGeometry(6, 6, 12, 8);
      var tank = new THREE.Mesh(tankGeo, metalMat);
      tank.position.set(pos.x, 6, pos.z);
      scene.add(tank);
      objects.push(tank);

      var platformGeo = new THREE.BoxGeometry(10, 1, 10);
      var platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.set(pos.x, 13, pos.z);
      scene.add(platform);
      objects.push(platform);
    }
  }

  function buildWreckedVehicles() {
    var wreckedMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.8 });
    var wrecks = [
      { x: -60, z: 30, rot: 0.4 },
      { x: 60, z: 30, rot: -0.3 },
      { x: -70, z: -50, rot: 0.5 },
      { x: 70, z: -50, rot: -0.4 }
    ];

    for (var i = 0; i < wrecks.length; i++) {
      var w = wrecks[i];
      var geo = new THREE.BoxGeometry(8, 5, 12);
      var wreck = new THREE.Mesh(geo, wreckedMat);
      wreck.position.set(w.x, 2.5, w.z);
      wreck.rotation.z = w.rot;
      scene.add(wreck);
      objects.push(wreck);
    }
  }

  function buildWaterCistern() {
    var cisternMat = new THREE.MeshStandardMaterial({ color: 0x2f4f4f, metalness: 0.7, roughness: 0.6 });
    var cisternGeo = new THREE.CylinderGeometry(10, 10, 20, 12);
    var cistern = new THREE.Mesh(cisternGeo, cisternMat);
    cistern.position.set(0, 10, 60);
    scene.add(cistern);
    objects.push(cistern);
  }

  function buildHangingLanterns() {
    var lanternMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.5 });
    var wireMat = new THREE.LineBasicMaterial({ color: 0x888888 });

    lanternGroup = new THREE.Group();
    var positions = [
      { x: -15, y: 15, z: -15 },
      { x: 15, y: 15, z: -15 },
      { x: -15, y: 15, z: 15 },
      { x: 15, y: 15, z: 15 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var sphereGeo = new THREE.SphereGeometry(1, 8, 8);
      var lantern = new THREE.Mesh(sphereGeo, lanternMat);
      lantern.position.set(p.x, p.y, p.z);

      var wireGeo = new THREE.BufferGeometry();
      var wireVerts = new Float32Array([
        p.x, p.y, p.z,
        p.x, 0, p.z
      ]);
      wireGeo.setAttribute('position', new THREE.BufferAttribute(wireVerts, 3));
      var wireLines = new THREE.LineSegments(wireGeo, wireMat);
      lanternGroup.add(wireLines);

      lanternGroup.add(lantern);
    }

    scene.add(lanternGroup);
  }

  function buildGuardTowers() {
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.5 });
    var platformMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });

    var corners = [
      { x: -80, z: -80 },
      { x: 80, z: -80 },
      { x: -80, z: 80 },
      { x: 80, z: 80 }
    ];

    for (var i = 0; i < corners.length; i++) {
      var c = corners[i];

      var baseGeo = new THREE.CylinderGeometry(3, 3, 8, 8);
      var base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(c.x, 4, c.z);
      scene.add(base);
      objects.push(base);

      var platformGeo = new THREE.BoxGeometry(6, 1, 6);
      var platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.set(c.x, 8.5, c.z);
      scene.add(platform);
      objects.push(platform);

      var roofGeo = new THREE.ConeGeometry(4, 3, 8);
      var roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(c.x, 10.5, c.z);
      scene.add(roof);
      objects.push(roof);
    }
  }

  function buildMarketCanopy() {
    var beamMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 });
    var wireMat = new THREE.LineBasicMaterial({ color: 0xcccccc });

    marketCanopy = new THREE.Group();

    var beamPositions = [
      { x: -20, y: 10, z: -35 },
      { x: 20, y: 10, z: -35 },
      { x: -20, y: 10, z: -45 },
      { x: 20, y: 10, z: -45 }
    ];

    for (var i = 0; i < beamPositions.length; i++) {
      var p = beamPositions[i];
      var beamGeo = new THREE.BoxGeometry(2, 8, 2);
      var beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.copy(p);
      marketCanopy.add(beam);
      objects.push(beam);
    }

    var canopyTopGeo = new THREE.BoxGeometry(45, 1, 15);
    var canopyTop = new THREE.Mesh(canopyTopGeo, beamMat);
    canopyTop.position.set(0, 14, -40);
    marketCanopy.add(canopyTop);
    objects.push(canopyTop);

    var tarpLine1 = new THREE.BufferGeometry();
    var verts1 = new Float32Array([
      -20, 14, -35, 20, 14, -35,
      -20, 14, -45, 20, 14, -45,
      -20, 14, -40, 20, 14, -40
    ]);
    tarpLine1.setAttribute('position', new THREE.BufferAttribute(verts1, 3));
    var tarp1 = new THREE.LineSegments(tarpLine1, wireMat);
    marketCanopy.add(tarp1);

    scene.add(marketCanopy);
  }

  function update(delta) {
    if (lanternGroup) {
      lanternGroup.rotation.y += delta * 0.1;
    }

    for (var i = 0; i < objects.length; i++) {
      if (objects[i].material && objects[i].material.emissive) {
        objects[i].material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    if (lanternGroup && scene) {
      scene.remove(lanternGroup);
    }
    if (marketCanopy && scene) {
      scene.remove(marketCanopy);
    }
    objects = [];
    lanternGroup = null;
    marketCanopy = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
