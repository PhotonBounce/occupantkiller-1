window.SunkenBase = (function() {
  'use strict';

  var baseGroup;
  var bubbleColumns = [];
  var beaconLights = [];
  var waterLevel = 50;

  function buildWalls(parent, x, y, z) {
    var wallGeo = new THREE.BoxGeometry(40, 80, 20);
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.3
    });
    var wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, y, z);
    wall.rotation.z = (Math.random() - 0.5) * 0.15;
    parent.add(wall);

    var crackMat = new THREE.MeshStandardMaterial({
      color: 0x0f0f1e,
      roughness: 0.9,
      metalness: 0.2
    });
    var crackGeo = new THREE.BoxGeometry(38, 15, 19);
    var crack = new THREE.Mesh(crackGeo, crackMat);
    crack.position.set(x - 2, y + 30, z + 1);
    parent.add(crack);
  }

  function buildWaterLevel(parent) {
    var waterGeo = new THREE.BoxGeometry(200, 0.5, 200);
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x0088cc,
      emissive: 0x0055aa,
      emissiveIntensity: 0.4,
      metalness: 0.5,
      roughness: 0.3,
      wireframe: false
    });
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, waterLevel, 0);
    parent.add(water);
  }

  function buildEquipmentBay(parent, x, y, z) {
    var engineGeo = new THREE.CylinderGeometry(8, 8, 35, 12);
    var engineMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.7,
      roughness: 0.4
    });
    var engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.set(x, y, z);
    parent.add(engine);

    var consoleGeo = new THREE.BoxGeometry(25, 20, 15);
    var consoleMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a1a,
      metalness: 0.4,
      roughness: 0.6
    });
    var console_ = new THREE.Mesh(consoleGeo, consoleMat);
    console_.position.set(x + 35, y, z);
    parent.add(console_);
  }

  function buildBioluminescence(parent, x, y, z) {
    var clusterGeo = new THREE.SphereGeometry(3, 8, 8);
    var glowMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.8,
      metalness: 0,
      roughness: 0.5
    });
    for (var i = 0; i < 5; i++) {
      var bio = new THREE.Mesh(clusterGeo, glowMat);
      bio.position.set(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 15,
        z + (Math.random() - 0.5) * 20
      );
      bio.scale.set(0.6 + Math.random() * 0.4, 0.6 + Math.random() * 0.4, 0.6 + Math.random() * 0.4);
      parent.add(bio);
    }
  }

  function buildSubmarineDock(parent, x, y, z) {
    var dockFrameGeo = new THREE.BoxGeometry(80, 40, 50);
    var dockMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a4a,
      metalness: 0.6,
      roughness: 0.5
    });
    var dockFrame = new THREE.Mesh(dockFrameGeo, dockMat);
    dockFrame.position.set(x, y, z);
    parent.add(dockFrame);

    var subHullGeo = new THREE.CylinderGeometry(12, 12, 55, 16);
    var subMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    var subHull = new THREE.Mesh(subHullGeo, subMat);
    subHull.rotation.z = Math.PI / 2;
    subHull.position.set(x, y - 5, z);
    parent.add(subHull);
  }

  function buildPressureDoors(parent, x, y, z) {
    var doorFrameGeo = new THREE.BoxGeometry(50, 60, 5);
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a3a,
      metalness: 0.7,
      roughness: 0.4
    });
    var doorFrame = new THREE.Mesh(doorFrameGeo, doorMat);
    doorFrame.position.set(x, y, z);
    parent.add(doorFrame);

    var wheelGeo = new THREE.CylinderGeometry(6, 6, 3, 12);
    var wheelMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.2
    });
    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(
        x + (i < 2 ? -15 : 15),
        y + (i % 2 === 0 ? 20 : -20),
        z + 5
      );
      parent.add(wheel);
    }
  }

  function buildEmergencyBeacons(parent, x, y, z) {
    var beaconGeo = new THREE.SphereGeometry(4, 8, 8);
    var beaconMat = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.5
    });
    var beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(x, y, z);
    parent.add(beacon);
    beaconLights.push(beacon);
  }

  function buildBubbleColumns(parent, x, y, z) {
    var bubblePoints = [];
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var radius = 3;
      bubblePoints.push(new THREE.Vector3(
        x + Math.cos(angle) * radius,
        y + i * 8,
        z + Math.sin(angle) * radius
      ));
    }
    var bubbleGeo = new THREE.BufferGeometry().setFromPoints(bubblePoints);
    var bubbleMat = new THREE.LineBasicMaterial({ color: 0x88ddff, linewidth: 2 });
    var bubbleLine = new THREE.LineSegments(bubbleGeo, bubbleMat);
    parent.add(bubbleLine);
    bubbleColumns.push(bubbleLine);

    var bubbleSphereGeo = new THREE.SphereGeometry(1.5, 6, 6);
    var bubbleMat2 = new THREE.MeshStandardMaterial({
      color: 0xaaddff,
      emissive: 0x88ccff,
      emissiveIntensity: 0.6,
      metalness: 0.2,
      roughness: 0.4,
      transparent: true,
      opacity: 0.7
    });
    for (var j = 0; j < 8; j++) {
      var bubble = new THREE.Mesh(bubbleSphereGeo, bubbleMat2);
      bubble.position.set(
        x + (Math.random() - 0.5) * 6,
        y + j * 8 + (Math.random() - 0.5) * 4,
        z + (Math.random() - 0.5) * 6
      );
      parent.add(bubble);
    }
  }

  function buildCorridors(parent) {
    for (var i = 0; i < 3; i++) {
      var corridorGeo = new THREE.BoxGeometry(120, 40, 20);
      var corridorMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a1a,
        metalness: 0.4,
        roughness: 0.7
      });
      var corridor = new THREE.Mesh(corridorGeo, corridorMat);
      corridor.position.set(i * 80 - 80, 0, 0);
      parent.add(corridor);
    }
  }

  function init(scene, camera) {
    baseGroup = new THREE.Group();
    scene.add(baseGroup);

    buildCorridors(baseGroup);
    buildWalls(baseGroup, -80, 0, 0);
    buildWalls(baseGroup, 0, 0, 0);
    buildWalls(baseGroup, 80, 0, 0);

    buildWaterLevel(baseGroup);

    buildEquipmentBay(baseGroup, -60, 30, 40);
    buildEquipmentBay(baseGroup, 60, 30, -40);

    buildSubmarineDock(baseGroup, 0, 10, -80);

    buildPressureDoors(baseGroup, -100, 0, 0);
    buildPressureDoors(baseGroup, 100, 0, 0);

    buildEmergencyBeacons(baseGroup, -50, 60, 50);
    buildEmergencyBeacons(baseGroup, 50, 60, -50);
    buildEmergencyBeacons(baseGroup, 0, 65, 0);

    buildBioluminescence(baseGroup, -60, 20, -60);
    buildBioluminescence(baseGroup, 60, 20, 60);
    buildBioluminescence(baseGroup, 0, 15, 80);

    buildBubbleColumns(baseGroup, -70, 0, 40);
    buildBubbleColumns(baseGroup, 70, 0, -40);
    buildBubbleColumns(baseGroup, 0, 5, 90);

    scene.fog = new THREE.Fog(0x001a33, 300, 600);
  }

  function update(delta) {
    for (var i = 0; i < beaconLights.length; i++) {
      var beacon = beaconLights[i];
      beacon.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
      beacon.scale.set(
        1 + Math.sin(Date.now() * 0.008 + i) * 0.1,
        1 + Math.sin(Date.now() * 0.008 + i) * 0.1,
        1 + Math.sin(Date.now() * 0.008 + i) * 0.1
      );
    }

    for (var j = 0; j < bubbleColumns.length; j++) {
      bubbleColumns[j].rotation.y += delta * 0.3;
      bubbleColumns[j].position.y += Math.sin(Date.now() * 0.003 + j) * 0.2;
    }

    baseGroup.rotation.z = Math.sin(Date.now() * 0.0002) * 0.02;
  }

  function reset() {
    if (baseGroup && baseGroup.parent) {
      baseGroup.parent.remove(baseGroup);
    }
    beaconLights = [];
    bubbleColumns = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
