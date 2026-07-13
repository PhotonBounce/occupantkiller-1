window.FloodCity = (function() {
  'use strict';

  var scene, waterLevel, buildings, boats, signs, helicopter, bridges;
  var rotorRotation = 0;
  var boatBobbing = 0;

  function init(sceneRef, camera) {
    scene = sceneRef;
    waterLevel = 8;
    buildings = [];
    boats = [];
    signs = [];
    helicopter = null;
    bridges = [];

    createWater();
    createBuildings();
    createWalkways();
    createBoats();
    createSigns();
    createHelicopter();
    createBillboards();
    createInflatableBoats();
  }

  function createWater() {
    var waterGeo = new THREE.BoxGeometry(300, 1, 300);
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x1e7a7f,
      emissive: 0x2a9fa0,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.1
    });
    var waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = waterLevel - 5;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
  }

  function createBuildings() {
    var positions = [
      [-60, 0, -60], [60, 0, -60], [-60, 0, 60], [60, 0, 60],
      [-30, 0, 0], [30, 0, 0], [0, 0, -40], [0, 0, 40]
    ];

    positions.forEach(function(pos) {
      var width = 20 + Math.random() * 10;
      var depth = 20 + Math.random() * 10;
      var totalHeight = 30 + Math.random() * 20;
      var submergedHeight = 10;

      var buildingGeo = new THREE.BoxGeometry(width, totalHeight, depth);
      var buildingMat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.7
      });
      var building = new THREE.Mesh(buildingGeo, buildingMat);
      building.position.set(pos[0], totalHeight / 2, pos[2]);
      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);

      var submergedGeo = new THREE.BoxGeometry(width, submergedHeight, depth);
      var submergedMat = new THREE.MeshStandardMaterial({
        color: 0x1a5a5f,
        emissive: 0x2a8a8f,
        emissiveIntensity: 0.3
      });
      var submerged = new THREE.Mesh(submergedGeo, submergedMat);
      submerged.position.set(pos[0], submergedHeight / 2, pos[2]);
      scene.add(submerged);

      buildings.push(building);
    });
  }

  function createWalkways() {
    var connections = [
      [[-60, 25, -60], [60, 25, -60]],
      [[-60, 25, 60], [60, 25, 60]],
      [[-60, 25, -60], [-60, 25, 60]],
      [[60, 25, -60], [60, 25, 60]]
    ];

    connections.forEach(function(conn) {
      var start = conn[0];
      var end = conn[1];
      var dx = end[0] - start[0];
      var dz = end[2] - start[2];
      var length = Math.sqrt(dx * dx + dz * dz);

      var bridgeGeo = new THREE.BoxGeometry(4, 2, length);
      var bridgeMat = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.8
      });
      var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.set((start[0] + end[0]) / 2, 25, (start[2] + end[2]) / 2);
      bridge.rotation.z = Math.atan2(dz, dx);
      bridge.castShadow = true;
      bridge.receiveShadow = true;
      scene.add(bridge);

      var railGeo = new THREE.CylinderGeometry(0.15, 0.15, length, 6);
      var railMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
      var railings = new THREE.LineSegments(railGeo, railMat);
      railings.position.copy(bridge.position);
      railings.position.y = 27;
      railings.rotation.z = bridge.rotation.z;
      scene.add(railings);

      bridges.push(bridge);
    });
  }

  function createBoats() {
    var boatPositions = [[-40, waterLevel, 20], [20, waterLevel, -30], [-20, waterLevel, -50]];

    boatPositions.forEach(function(pos) {
      var hullGeo = new THREE.BoxGeometry(8, 3, 16);
      var hullMat = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.6
      });
      var hull = new THREE.Mesh(hullGeo, hullMat);
      hull.position.set(pos[0], pos[1], pos[2]);
      hull.castShadow = true;
      hull.receiveShadow = true;
      scene.add(hull);

      var engineGeo = new THREE.CylinderGeometry(0.8, 1.2, 2, 8);
      var engineMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var engine = new THREE.Mesh(engineGeo, engineMat);
      engine.position.set(pos[0], pos[1] + 2, pos[2] - 6);
      engine.castShadow = true;
      scene.add(engine);

      boats.push({ hull: hull, engine: engine, baseY: pos[1] });
    });
  }

  function createSigns() {
    var signPositions = [[-50, waterLevel + 6, 0], [50, waterLevel + 6, -30], [0, waterLevel + 5, 50]];

    signPositions.forEach(function(pos) {
      var poleGeo = new THREE.CylinderGeometry(0.4, 0.4, 14, 8);
      var poleMat = new THREE.MeshStandardMaterial({
        color: 0xaa0000,
        roughness: 0.5
      });
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(pos[0], pos[1] + 4, pos[2]);
      pole.castShadow = true;
      scene.add(pole);

      var signGeo = new THREE.BoxGeometry(6, 4, 0.3);
      var signMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
      var sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(pos[0], pos[1] + 8, pos[2]);
      sign.castShadow = true;
      scene.add(sign);

      signs.push(pole);
    });
  }

  function createHelicopter() {
    var fuselageGeo = new THREE.BoxGeometry(3, 2, 10);
    var fuselageMat = new THREE.MeshStandardMaterial({
      color: 0x228b22,
      roughness: 0.4
    });
    var fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    fuselage.position.set(-80, 50, -80);
    fuselage.castShadow = true;
    scene.add(fuselage);

    var rotorGeo = new THREE.CylinderGeometry(8, 8, 0.2, 4);
    var rotorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.set(-80, 53, -80);
    rotor.castShadow = true;
    scene.add(rotor);

    helicopter = { fuselage: fuselage, rotor: rotor, baseX: -80, baseZ: -80 };
  }

  function createBillboards() {
    var billboardPositions = [[70, 20, -70], [80, 22, 80], [-80, 18, 80]];

    billboardPositions.forEach(function(pos) {
      var frameGeo = new THREE.BoxGeometry(0.5, 0.5, 30);
      var frameMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
      var frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(pos[0], pos[1], pos[2]);
      frame.castShadow = true;
      scene.add(frame);

      var boardGeo = new THREE.BoxGeometry(20, 12, 0.2);
      var boardMat = new THREE.MeshStandardMaterial({ color: 0xcc6600 });
      var board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(pos[0], pos[1] + 8, pos[2]);
      board.castShadow = true;
      scene.add(board);
    });
  }

  function createInflatableBoats() {
    var inflatePositions = [[30, waterLevel + 0.5, 10], [-50, waterLevel + 0.5, 40], [0, waterLevel + 0.5, -60]];

    inflatePositions.forEach(function(pos) {
      var hullGeo = new THREE.BoxGeometry(6, 1.5, 12);
      var hullMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.3
      });
      var inflatable = new THREE.Mesh(hullGeo, hullMat);
      inflatable.position.set(pos[0], pos[1], pos[2]);
      inflatable.castShadow = true;
      scene.add(inflatable);

      var buoyantGeo = new THREE.CylinderGeometry(1.2, 1.2, 6, 6);
      var buoyantMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
      var buoyant = new THREE.Mesh(buoyantGeo, buoyantMat);
      buoyant.position.set(pos[0] + 2.5, pos[1] + 1.2, pos[2]);
      scene.add(buoyant);
    });
  }

  function update(delta) {
    boatBobbing += delta;
    rotorRotation += delta * 15;

    boats.forEach(function(boat) {
      boat.hull.position.y = boat.baseY + Math.sin(boatBobbing * 2) * 0.5;
      boat.engine.position.y = boat.baseY + 2 + Math.sin(boatBobbing * 2) * 0.5;
    });

    if (helicopter) {
      helicopter.rotor.rotation.z = rotorRotation;
      helicopter.fuselage.position.y = 50 + Math.sin(boatBobbing * 0.8) * 2;
      helicopter.rotor.position.y = 53 + Math.sin(boatBobbing * 0.8) * 2;
    }
  }

  function reset() {
    boatBobbing = 0;
    rotorRotation = 0;
    boats.forEach(function(boat) {
      boat.hull.position.y = boat.baseY;
      boat.engine.position.y = boat.baseY + 2;
    });
    if (helicopter) {
      helicopter.fuselage.position.y = 50;
      helicopter.rotor.position.y = 53;
      helicopter.rotor.rotation.z = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
