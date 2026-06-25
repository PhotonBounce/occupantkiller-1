window.RescueMission = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var helicopterRotor = null;
  var fastRopes = [];
  var hostageBeacons = [];
  var gateLights = [];
  var militiaPatrols = [];
  var radioAntennas = [];
  var spawnPoints = [];
  var gameState = {
    helicopterY: 50,
    helicopterRotation: 0,
    helicopterApproach: 0,
    gateLightAngle: 0,
    elapsedTime: 0
  };

  var mudBrickColor = 0xC2A05A;
  var militiaGreen = 0x2d5016;
  var rooftopGray = 0x666666;
  var beaconGreen = 0x00ff00;
  var nightShadow = 0x1a1a1a;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    helicopterRotor = null;
    fastRopes = [];
    hostageBeacons = [];
    gateLights = [];
    militiaPatrols = [];
    radioAntennas = [];
    spawnPoints = [];
    gameState.elapsedTime = 0;

    // Outer mud-brick compound wall sections
    var wallMaterial = new THREE.MeshStandardMaterial({ color: mudBrickColor, roughness: 0.8 });

    // North wall
    var northWall = new THREE.Mesh(
      new THREE.BoxGeometry(120, 12, 2),
      wallMaterial
    );
    northWall.position.set(0, 6, -60);
    scene.add(northWall);
    meshes.push(northWall);

    // South wall
    var southWall = new THREE.Mesh(
      new THREE.BoxGeometry(120, 12, 2),
      wallMaterial
    );
    southWall.position.set(0, 6, 60);
    scene.add(southWall);
    meshes.push(southWall);

    // East wall
    var eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(2, 12, 120),
      wallMaterial
    );
    eastWall.position.set(60, 6, 0);
    scene.add(eastWall);
    meshes.push(eastWall);

    // West wall
    var westWall = new THREE.Mesh(
      new THREE.BoxGeometry(2, 12, 120),
      wallMaterial
    );
    westWall.position.set(-60, 6, 0);
    scene.add(westWall);
    meshes.push(westWall);

    // Guard towers at corners
    var towerMaterial = new THREE.MeshStandardMaterial({ color: militiaGreen, roughness: 0.7 });
    var towers = [
      { x: -50, z: -50 },
      { x: 50, z: -50 },
      { x: -50, z: 50 },
      { x: 50, z: 50 }
    ];

    towers.forEach(function(pos) {
      // Tower base
      var tower = new THREE.Mesh(
        new THREE.BoxGeometry(8, 20, 8),
        towerMaterial
      );
      tower.position.set(pos.x, 10, pos.z);
      scene.add(tower);
      meshes.push(tower);

      // Spotlight on tower
      var spotlight = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 2, 8),
        new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.3 })
      );
      spotlight.position.set(pos.x, 18, pos.z);
      scene.add(spotlight);
      meshes.push(spotlight);
      gateLights.push({ mesh: spotlight, baseX: pos.x, baseZ: pos.z });
    });

    // Main compound gate with heavy doors
    var gateMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });

    // Left gate door
    var leftGate = new THREE.Mesh(
      new THREE.BoxGeometry(8, 14, 1),
      gateMaterial
    );
    leftGate.position.set(-5, 7, -60);
    scene.add(leftGate);
    meshes.push(leftGate);

    // Right gate door
    var rightGate = new THREE.Mesh(
      new THREE.BoxGeometry(8, 14, 1),
      gateMaterial
    );
    rightGate.position.set(5, 7, -60);
    scene.add(rightGate);
    meshes.push(rightGate);

    // Gate frame
    var gateFrame = new THREE.Mesh(
      new THREE.BoxGeometry(20, 16, 2),
      new THREE.MeshStandardMaterial({ color: 0x2d2416, roughness: 0.95 })
    );
    gateFrame.position.set(0, 8, -60);
    scene.add(gateFrame);
    meshes.push(gateFrame);

    // Courtyard ground (BoxGeometry flat surface)
    var courtyard = new THREE.Mesh(
      new THREE.BoxGeometry(110, 0.5, 110),
      new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.95 })
    );
    courtyard.position.set(0, 0.25, 0);
    scene.add(courtyard);
    meshes.push(courtyard);

    // Cell block building
    var cellBlockMaterial = new THREE.MeshStandardMaterial({ color: mudBrickColor, roughness: 0.8 });
    var cellBlock = new THREE.Mesh(
      new THREE.BoxGeometry(30, 16, 12),
      cellBlockMaterial
    );
    cellBlock.position.set(-20, 8, 15);
    scene.add(cellBlock);
    meshes.push(cellBlock);

    // Barred windows on cell block (LineSegments)
    var barGeometry = new THREE.BufferGeometry();
    var barPositions = [];
    for (var i = 0; i < 6; i++) {
      var xPos = -30 + (i * 10);
      // Vertical bars
      barPositions.push(xPos, 4, 21, xPos, 14, 21);
    }
    barGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(barPositions), 3));
    var barLines = new THREE.LineSegments(
      barGeometry,
      new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 })
    );
    scene.add(barLines);
    meshes.push(barLines);

    // Command building with radio antenna
    var commandBldg = new THREE.Mesh(
      new THREE.BoxGeometry(20, 14, 18),
      cellBlockMaterial
    );
    commandBldg.position.set(25, 7, 0);
    scene.add(commandBldg);
    meshes.push(commandBldg);

    // Radio antenna
    var antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 12, 6),
      new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 })
    );
    antenna.position.set(25, 20, 0);
    scene.add(antenna);
    meshes.push(antenna);
    radioAntennas.push({ mesh: antenna, baseY: 20 });

    // Militia barracks
    var barracksMaterial = new THREE.MeshStandardMaterial({ color: militiaGreen, roughness: 0.75 });
    var barracks = new THREE.Mesh(
      new THREE.BoxGeometry(40, 10, 15),
      barracksMaterial
    );
    barracks.position.set(-30, 5, -25);
    scene.add(barracks);
    meshes.push(barracks);

    // Ammunition cache (BoxGeometry crates)
    var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.85 });
    for (var c = 0; c < 4; c++) {
      var crate = new THREE.Mesh(
        new THREE.BoxGeometry(6, 6, 6),
        crateMaterial
      );
      crate.position.set(15 + (c * 8), 3, -35);
      scene.add(crate);
      meshes.push(crate);
    }

    // Vehicle compound (Land Rover hulks)
    var vehicleMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    var vehicle1 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 5, 12),
      vehicleMaterial
    );
    vehicle1.position.set(40, 2.5, 30);
    scene.add(vehicle1);
    meshes.push(vehicle1);

    var vehicle2 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 5, 12),
      vehicleMaterial
    );
    vehicle2.position.set(50, 2.5, 30);
    scene.add(vehicle2);
    meshes.push(vehicle2);

    // Well structure
    var wellBase = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 5, 2, 16),
      new THREE.MeshStandardMaterial({ color: mudBrickColor, roughness: 0.9 })
    );
    wellBase.position.set(-10, 1, -40);
    scene.add(wellBase);
    meshes.push(wellBase);

    var wellRoof = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1, 12),
      new THREE.MeshStandardMaterial({ color: rooftopGray, roughness: 0.7 })
    );
    wellRoof.position.set(-10, 4, -40);
    scene.add(wellRoof);
    meshes.push(wellRoof);

    // Market stall remains
    var stallMaterial = new THREE.MeshStandardMaterial({ color: 0xA0826D, roughness: 0.8 });
    for (var s = 0; s < 3; s++) {
      var stall = new THREE.Mesh(
        new THREE.BoxGeometry(8, 5, 8),
        stallMaterial
      );
      stall.position.set(-35 + (s * 12), 2.5, 30);
      scene.add(stall);
      meshes.push(stall);
    }

    // Extraction zone outside wall (flat BoxGeometry area)
    var extractionZone = new THREE.Mesh(
      new THREE.BoxGeometry(80, 0.3, 40),
      new THREE.MeshStandardMaterial({ color: 0x556B2F, roughness: 0.85 })
    );
    extractionZone.position.set(0, 0.15, -100);
    scene.add(extractionZone);
    meshes.push(extractionZone);

    // Rescue helicopter
    var heloFuselage = new THREE.Mesh(
      new THREE.BoxGeometry(8, 5, 18),
      new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.6 })
    );
    heloFuselage.position.set(0, 45, -100);
    scene.add(heloFuselage);
    meshes.push(heloFuselage);

    // Helicopter rotor
    helicopterRotor = new THREE.Mesh(
      new THREE.CylinderGeometry(12, 12, 0.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })
    );
    helicopterRotor.position.set(0, 50, -100);
    scene.add(helicopterRotor);
    meshes.push(helicopterRotor);

    // Fast-rope lines (LineSegments)
    var ropeGeometry = new THREE.BufferGeometry();
    var ropePositions = [];
    for (var r = 0; r < 4; r++) {
      var ropeX = -4 + (r * 3);
      ropePositions.push(ropeX, 50, -100, ropeX, 10, -100);
    }
    ropeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePositions), 3));
    var ropeLines = new THREE.LineSegments(
      ropeGeometry,
      new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 })
    );
    scene.add(ropeLines);
    meshes.push(ropeLines);
    for (var rr = 0; rr < 4; rr++) {
      fastRopes.push({ x: -4 + (rr * 3), sway: 0 });
    }

    // Hostage beacon markers (SphereGeometry glowing)
    var beaconPositions = [
      { x: -20, y: 3, z: 15 },   // Cell block
      { x: 25, y: 3, z: 0 },     // Command building
      { x: -30, y: 3, z: -25 },  // Barracks
      { x: 15, y: 3, z: -10 }    // Courtyard
    ];

    beaconPositions.forEach(function(pos) {
      var beacon = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshStandardMaterial({
          color: beaconGreen,
          emissive: beaconGreen,
          emissiveIntensity: 0.5
        })
      );
      beacon.position.set(pos.x, pos.y, pos.z);
      scene.add(beacon);
      meshes.push(beacon);
      hostageBeacons.push({
        mesh: beacon,
        baseIntensity: 0.5,
        pulse: 0
      });
    });

    // Define spawn points
    spawnPoints = [
      { x: 0, y: 1, z: -55, name: 'gate' },
      { x: 0, y: 1, z: 0, name: 'courtyard' },
      { x: -20, y: 1, z: 15, name: 'cellblock' },
      { x: 25, y: 1, z: 0, name: 'command' },
      { x: 0, y: 1, z: -95, name: 'extraction' }
    ];

    // Setup militia patrol points
    militiaPatrols = [
      { x: -40, z: 0, direction: 1, speed: 15 },
      { x: 35, z: -30, direction: -1, speed: 20 },
      { x: 0, z: 30, direction: 1, speed: 18 }
    ];
  }

  function update(delta) {
    gameState.elapsedTime += delta;

    // Helicopter rotor spinning
    if (helicopterRotor) {
      gameState.helicopterRotation += delta * 15;
      helicopterRotor.rotation.y = gameState.helicopterRotation;
    }

    // Helicopter approach movement
    gameState.helicopterApproach = Math.sin(gameState.elapsedTime * 0.3) * 0.5;

    // Fast-rope swaying
    fastRopes.forEach(function(rope, index) {
      rope.sway = Math.sin(gameState.elapsedTime * 2 + index) * 0.8;
    });

    // Hostage beacons pulsing
    hostageBeacons.forEach(function(beacon) {
      beacon.pulse = Math.sin(gameState.elapsedTime * 3) * 0.4 + 0.6;
      beacon.mesh.material.emissiveIntensity = beacon.pulse;
      beacon.mesh.scale.set(
        1 + Math.sin(gameState.elapsedTime * 2.5) * 0.1,
        1 + Math.sin(gameState.elapsedTime * 2.5) * 0.1,
        1 + Math.sin(gameState.elapsedTime * 2.5) * 0.1
      );
    });

    // Gate spotlight sweeping
    gameState.gateLightAngle += delta * 1.5;
    gateLights.forEach(function(light) {
      var sweep = Math.sin(gameState.gateLightAngle) * 2;
      light.mesh.position.x = light.baseX + sweep;
    });

    // Radio antenna blinking
    radioAntennas.forEach(function(antenna) {
      var blink = Math.sin(gameState.elapsedTime * 5) > 0 ? 1 : 0.2;
      antenna.mesh.material.emissiveIntensity = blink * 0.4;
    });

    // Militia patrol movement
    militiaPatrols.forEach(function(patrol) {
      patrol.x += patrol.direction * patrol.speed * delta;
      if (patrol.x > 45) patrol.direction = -1;
      if (patrol.x < -45) patrol.direction = 1;
    });

    // Beacon intensity increases when close
    hostageBeacons.forEach(function(beacon) {
      if (camera) {
        var distance = Math.sqrt(
          Math.pow(beacon.mesh.position.x - camera.position.x, 2) +
          Math.pow(beacon.mesh.position.z - camera.position.z, 2)
        );
        if (distance < 20) {
          beacon.mesh.material.emissiveIntensity = Math.min(beacon.pulse + 0.5, 1);
        }
      }
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
      if (mesh && mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh && mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(function(mat) { mat.dispose(); });
        } else {
          mesh.material.dispose();
        }
      }
      if (scene && mesh.parent === scene) {
        scene.remove(mesh);
      }
    });

    meshes = [];
    helicopterRotor = null;
    fastRopes = [];
    hostageBeacons = [];
    gateLights = [];
    militiaPatrols = [];
    radioAntennas = [];
    spawnPoints = [];
    gameState = {
      helicopterY: 50,
      helicopterRotation: 0,
      helicopterApproach: 0,
      gateLightAngle: 0,
      elapsedTime: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; },
    getMeshes: function() { return meshes; }
  };
}());
