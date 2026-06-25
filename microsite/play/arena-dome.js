window.ArenaDome = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var laserGrid;
  var laserTime = 0;
  var spectatorGalleries = [];
  var weaponSpawns = [];
  var teleporters = [];
  var forceFields = [];
  var jumpPads = [];

  function buildArena() {
    var arenaRadius = 50;
    var arenaHeight = 60;

    buildDomeShell(arenaRadius, arenaHeight);
    buildFloor(arenaRadius);
    buildSpectatorBoxes(arenaRadius);
    buildWeaponSpawns();
    buildTeleporters();
    buildForceFields();
    buildJumpPads();
    buildScoreboardPanels();
    buildLaserGrid();
  }

  function buildDomeShell(radius, height) {
    var domeGeometry = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    var domeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x0a0a1a,
      side: THREE.BackSide
    });
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = height / 2;
    dome.castShadow = true;
    scene.add(dome);
    objects.push(dome);
  }

  function buildFloor(radius) {
    var floorGeometry = new THREE.CylinderGeometry(radius, radius, 1, 32);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f3460,
      metalness: 0.6,
      roughness: 0.4,
      emissive: 0x051c3e
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);
  }

  function buildSpectatorBoxes(radius) {
    var boxCount = 8;
    var boxHeight = 20;
    var boxDepth = 15;
    var baseDistance = radius - 5;

    for (var i = 0; i < boxCount; i++) {
      var angle = (i / boxCount) * Math.PI * 2;
      var x = Math.cos(angle) * baseDistance;
      var z = Math.sin(angle) * baseDistance;

      var boxGeometry = new THREE.BoxGeometry(8, boxHeight, boxDepth);
      var boxMaterial = new THREE.MeshStandardMaterial({
        color: 0x16213e,
        metalness: 0.5,
        roughness: 0.6,
        emissive: 0x0d1a2a
      });
      var galleryBox = new THREE.Mesh(boxGeometry, boxMaterial);
      galleryBox.position.set(x, boxHeight / 2, z);
      galleryBox.castShadow = true;
      galleryBox.receiveShadow = true;
      scene.add(galleryBox);
      spectatorGalleries.push(galleryBox);
      objects.push(galleryBox);
    }
  }

  function buildWeaponSpawns() {
    var spawnCount = 5;
    var spawnRadius = 20;

    for (var i = 0; i < spawnCount; i++) {
      var angle = (i / spawnCount) * Math.PI * 2;
      var x = Math.cos(angle) * spawnRadius;
      var z = Math.sin(angle) * spawnRadius;

      var spawnGeometry = new THREE.CylinderGeometry(3, 3, 1, 16);
      var spawnMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x00ff88
      });
      var spawn = new THREE.Mesh(spawnGeometry, spawnMaterial);
      spawn.position.set(x, 0.5, z);
      spawn.castShadow = true;
      scene.add(spawn);
      weaponSpawns.push(spawn);
      objects.push(spawn);
    }
  }

  function buildTeleporters() {
    var teleportCount = 4;
    var teleportRadius = 35;

    for (var i = 0; i < teleportCount; i++) {
      var angle = (i / teleportCount) * Math.PI * 2 + Math.PI / 4;
      var x = Math.cos(angle) * teleportRadius;
      var z = Math.sin(angle) * teleportRadius;

      var ringGroup = new THREE.Group();

      for (var j = 0; j < 8; j++) {
        var sliceGeometry = new THREE.CylinderGeometry(5, 5, 0.3, 16);
        var sliceMaterial = new THREE.MeshStandardMaterial({
          color: 0xff00ff,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0xff00ff
        });
        var slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
        slice.position.y = j * 0.5 - 1.8;
        ringGroup.add(slice);
        objects.push(slice);
      }

      ringGroup.position.set(x, 8, z);
      scene.add(ringGroup);
      teleporters.push(ringGroup);
    }
  }

  function buildForceFields() {
    var fieldCount = 3;
    var fieldPositions = [
      [15, 5, 15],
      [-20, 5, 0],
      [10, 5, -20]
    ];

    for (var i = 0; i < fieldCount; i++) {
      var fieldGeometry = new THREE.BoxGeometry(8, 12, 8);
      var fieldMaterial = new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        metalness: 0.4,
        roughness: 0.5,
        transparent: true,
        opacity: 0.3,
        emissive: 0x0055ff
      });
      var field = new THREE.Mesh(fieldGeometry, fieldMaterial);
      field.position.set(fieldPositions[i][0], fieldPositions[i][1], fieldPositions[i][2]);
      field.castShadow = true;
      scene.add(field);
      forceFields.push(field);
      objects.push(field);
    }
  }

  function buildJumpPads() {
    var padCount = 6;
    var padRadius = 28;

    for (var i = 0; i < padCount; i++) {
      var angle = (i / padCount) * Math.PI * 2;
      var x = Math.cos(angle) * padRadius;
      var z = Math.sin(angle) * padRadius;

      var padGeometry = new THREE.CylinderGeometry(4, 4, 0.8, 16);
      var padMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0xff8800
      });
      var pad = new THREE.Mesh(padGeometry, padMaterial);
      pad.position.set(x, 0.4, z);
      pad.castShadow = true;
      scene.add(pad);
      jumpPads.push(pad);
      objects.push(pad);
    }
  }

  function buildScoreboardPanels() {
    var panelCount = 3;
    var panelHeight = 15;
    var panelWidth = 30;
    var panelPositions = [
      [0, 35, -45],
      [40, 30, -20],
      [-40, 30, -20]
    ];

    for (var i = 0; i < panelCount; i++) {
      var panelGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, 1);
      var panelMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x0088ff
      });
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(panelPositions[i][0], panelPositions[i][1], panelPositions[i][2]);
      panel.castShadow = true;
      scene.add(panel);
      objects.push(panel);
    }
  }

  function buildLaserGrid() {
    var gridSize = 60;
    var gridSpacing = 5;
    var points = [];

    for (var x = -gridSize / 2; x <= gridSize / 2; x += gridSpacing) {
      points.push(new THREE.Vector3(x, 55, -gridSize / 2));
      points.push(new THREE.Vector3(x, 55, gridSize / 2));
    }

    for (var z = -gridSize / 2; z <= gridSize / 2; z += gridSpacing) {
      points.push(new THREE.Vector3(-gridSize / 2, 55, z));
      points.push(new THREE.Vector3(gridSize / 2, 55, z));
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);
    var material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 2
    });
    laserGrid = new THREE.LineSegments(geometry, material);
    scene.add(laserGrid);
    objects.push(laserGrid);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    buildArena();
    return true;
  }

  function update(delta) {
    laserTime += delta;

    if (laserGrid) {
      var oscillation = Math.sin(laserTime * 2) * 3;
      laserGrid.position.y = 55 + oscillation;
      laserGrid.material.opacity = 0.5 + Math.sin(laserTime * 3) * 0.5;
    }

    for (var i = 0; i < teleporters.length; i++) {
      teleporters[i].rotation.y += delta * 1.5;
    }

    for (var j = 0; j < weaponSpawns.length; j++) {
      weaponSpawns[j].material.emissiveIntensity = 0.5 + Math.sin(laserTime * 4 + j) * 0.5;
    }

    for (var k = 0; k < forceFields.length; k++) {
      forceFields[k].rotation.x += delta * 0.3;
      forceFields[k].rotation.z += delta * 0.5;
    }
  }

  function reset() {
    laserTime = 0;
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    spectatorGalleries = [];
    weaponSpawns = [];
    teleporters = [];
    forceFields = [];
    jumpPads = [];
    laserGrid = null;
    buildArena();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
