window.ArenaCombat = (function() {
  'use strict';

  var meshes = [];
  var spotlights = [];
  var weaponPlatform = null;
  var electricFence = null;
  var cameraCrane = null;
  var banners = [];
  var centerPlatform = null;
  var gateDoors = [];
  var spawnPoints = [];

  var platformState = {
    weaponDropY: 15,
    targetY: 8,
    isDescending: true,
    craneAngle: 0,
    bannerWave: 0,
    gateOpen: false,
    centerPlatformHeight: 0,
    fenceEmissive: 0
  };

  function init(scene, camera) {
    // Clear previous meshes
    meshes = [];
    spotlights = [];
    banners = [];
    gateDoors = [];
    spawnPoints = [];

    var arenaRadius = 50;
    var arenaHeight = 0.5;

    // Main arena floor - octagonal pattern using box sections
    var octagonSegments = 8;
    for (var i = 0; i < octagonSegments; i++) {
      var angle = (i / octagonSegments) * Math.PI * 2;
      var nextAngle = ((i + 1) / octagonSegments) * Math.PI * 2;

      var x1 = Math.cos(angle) * arenaRadius;
      var z1 = Math.sin(angle) * arenaRadius;
      var x2 = Math.cos(nextAngle) * arenaRadius;
      var z2 = Math.sin(nextAngle) * arenaRadius;

      var centerX = (x1 + x2) / 2;
      var centerZ = (z1 + z2) / 2;

      var floorGeom = new THREE.BoxGeometry(8, arenaHeight, 8);
      var floorMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
      var floorMesh = new THREE.Mesh(floorGeom, floorMat);
      floorMesh.position.set(centerX, arenaHeight / 2, centerZ);
      floorMesh.rotation.z = angle + Math.PI / 2;
      scene.add(floorMesh);
      meshes.push(floorMesh);
    }

    // Sand patches on arena floor
    for (var s = 0; s < 5; s++) {
      var sandGeom = new THREE.BoxGeometry(12, 0.3, 12);
      var sandMat = new THREE.MeshStandardMaterial({ color: 0xc9a961, roughness: 0.9 });
      var sandMesh = new THREE.Mesh(sandGeom, sandMat);
      var sandAngle = (Math.random() * Math.PI * 2);
      var sandDist = 25 + Math.random() * 15;
      sandMesh.position.set(
        Math.cos(sandAngle) * sandDist,
        0.2,
        Math.sin(sandAngle) * sandDist
      );
      scene.add(sandMesh);
      meshes.push(sandMesh);
    }

    // Arena wall barrier - circular wall segments
    var wallHeight = 4;
    var wallRadius = arenaRadius + 8;
    var wallSegments = 16;
    for (var w = 0; w < wallSegments; w++) {
      var wAngle = (w / wallSegments) * Math.PI * 2;
      var wallGeom = new THREE.BoxGeometry(6, wallHeight, 0.8);
      var wallMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7 });
      var wallMesh = new THREE.Mesh(wallGeom, wallMat);
      wallMesh.position.set(
        Math.cos(wAngle) * wallRadius,
        wallHeight / 2,
        Math.sin(wAngle) * wallRadius
      );
      wallMesh.rotation.y = wAngle;
      scene.add(wallMesh);
      meshes.push(wallMesh);
    }

    // Spectator stands - tiered seating rows
    var standLevels = 5;
    var seatsPerLevel = 12;
    for (var level = 0; level < standLevels; level++) {
      var standRadius = arenaRadius + 12 + (level * 6);
      for (var seat = 0; seat < seatsPerLevel; seat++) {
        var seatAngle = (seat / seatsPerLevel) * Math.PI * 2;
        var seatGeom = new THREE.BoxGeometry(5, 2, 3);
        var seatColor = level % 2 === 0 ? 0x3a3a3a : 0x2a2a2a;
        var seatMat = new THREE.MeshStandardMaterial({ color: seatColor, roughness: 0.8 });
        var seatMesh = new THREE.Mesh(seatGeom, seatMat);
        seatMesh.position.set(
          Math.cos(seatAngle) * standRadius,
          3 + (level * 1.5),
          Math.sin(seatAngle) * standRadius
        );
        scene.add(seatMesh);
        meshes.push(seatMesh);
      }
    }

    // Spotlight towers at corners
    var cornerAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    for (var c = 0; c < cornerAngles.length; c++) {
      var towerAngle = cornerAngles[c];
      var towerX = Math.cos(towerAngle) * (arenaRadius + 25);
      var towerZ = Math.sin(towerAngle) * (arenaRadius + 25);

      // Tower frame
      var frameGeom = new THREE.BoxGeometry(3, 12, 3);
      var frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
      var frameMesh = new THREE.Mesh(frameGeom, frameMat);
      frameMesh.position.set(towerX, 6, towerZ);
      scene.add(frameMesh);
      meshes.push(frameMesh);

      // Spotlight head (cylinder)
      var spotGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
      var spotMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffaa,
        emissiveIntensity: 0.5
      });
      var spotMesh = new THREE.Mesh(spotGeom, spotMat);
      spotMesh.position.set(towerX, 11.5, towerZ);
      scene.add(spotMesh);
      spotlights.push({ mesh: spotMesh, baseAngle: towerAngle });
      meshes.push(spotMesh);
    }

    // Center stage raising platform
    var centerGeom = new THREE.BoxGeometry(20, 2, 20);
    var centerMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 });
    centerPlatform = new THREE.Mesh(centerGeom, centerMat);
    centerPlatform.position.set(0, 0.2, 0);
    scene.add(centerPlatform);
    meshes.push(centerPlatform);

    // Weapon drop platform with winch
    // Platform
    var dropGeom = new THREE.BoxGeometry(8, 1, 8);
    var dropMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.6 });
    weaponPlatform = new THREE.Mesh(dropGeom, dropMat);
    weaponPlatform.position.set(0, platformState.weaponDropY, 0);
    scene.add(weaponPlatform);
    meshes.push(weaponPlatform);

    // Winch cylinder above platform
    var winchGeom = new THREE.CylinderGeometry(1, 1, 4, 16);
    var winchMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });
    var winchMesh = new THREE.Mesh(winchGeom, winchMat);
    winchMesh.position.set(0, platformState.weaponDropY + 4, 0);
    scene.add(winchMesh);
    meshes.push(winchMesh);

    // Scattered weapons on arena floor
    var weaponCount = 8;
    for (var weap = 0; weap < weaponCount; weap++) {
      var weaponGeom = new THREE.BoxGeometry(0.8, 0.2, 3);
      var weaponMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
      var weaponMesh = new THREE.Mesh(weaponGeom, weaponMat);
      var wAngle = Math.random() * Math.PI * 2;
      var wDist = 15 + Math.random() * 20;
      weaponMesh.position.set(
        Math.cos(wAngle) * wDist,
        0.3,
        Math.sin(wAngle) * wDist
      );
      weaponMesh.rotation.y = Math.random() * Math.PI;
      scene.add(weaponMesh);
      meshes.push(weaponMesh);
    }

    // Medical stretcher station
    var stretcherGeom = new THREE.BoxGeometry(2, 1, 4);
    var stretcherMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.7 });
    var stretcherMesh = new THREE.Mesh(stretcherGeom, stretcherMat);
    stretcherMesh.position.set(-35, 0.5, 0);
    scene.add(stretcherMesh);
    meshes.push(stretcherMesh);

    // Announcer booth - elevated with glass front
    var boothBaseGeom = new THREE.BoxGeometry(8, 5, 4);
    var boothMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
    var boothMesh = new THREE.Mesh(boothBaseGeom, boothMat);
    boothMesh.position.set(35, 2.5, 0);
    scene.add(boothMesh);
    meshes.push(boothMesh);

    // Booth glass front
    var glassGeom = new THREE.BoxGeometry(8, 3, 0.2);
    var glassMat = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      metalness: 0.3,
      roughness: 0.1
    });
    var glassMesh = new THREE.Mesh(glassGeom, glassMat);
    glassMesh.position.set(35, 3.5, 2.1);
    scene.add(glassMesh);
    meshes.push(glassMesh);

    // Arena gate doors - heavy entrance barriers
    var gateWidth = 6;
    var gateHeight = 8;
    var gatePositions = [
      { x: 0, z: -arenaRadius - 12 },
      { x: 0, z: arenaRadius + 12 }
    ];

    for (var g = 0; g < gatePositions.length; g++) {
      var gateGeom = new THREE.BoxGeometry(gateWidth, gateHeight, 0.5);
      var gateMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
      var gateMesh = new THREE.Mesh(gateGeom, gateMat);
      gateMesh.position.set(gatePositions[g].x, gateHeight / 2, gatePositions[g].z);
      scene.add(gateMesh);
      gateDoors.push({ mesh: gateMesh, baseZ: gatePositions[g].z });
      meshes.push(gateMesh);
    }

    // Sponsor banner displays - hanging panels
    var bannerCount = 6;
    for (var b = 0; b < bannerCount; b++) {
      var bannerAngle = (b / bannerCount) * Math.PI * 2;
      var bannerX = Math.cos(bannerAngle) * (arenaRadius + 20);
      var bannerZ = Math.sin(bannerAngle) * (arenaRadius + 20);

      var bannerGeom = new THREE.BoxGeometry(6, 4, 0.3);
      var bannerMat = new THREE.MeshStandardMaterial({
        color: [0xff0000, 0x0000ff, 0xffff00][b % 3],
        roughness: 0.5
      });
      var bannerMesh = new THREE.Mesh(bannerGeom, bannerMat);
      bannerMesh.position.set(bannerX, 8, bannerZ);
      bannerMesh.rotation.y = bannerAngle + Math.PI / 2;
      scene.add(bannerMesh);
      banners.push({ mesh: bannerMesh, baseY: 8, angle: bannerAngle });
      meshes.push(bannerMesh);
    }

    // Camera crane - articulated arm with cylinder
    var craneBaseGeom = new THREE.BoxGeometry(2, 0.5, 2);
    var craneMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
    var craneBaseMesh = new THREE.Mesh(craneBaseGeom, craneMat);
    craneBaseMesh.position.set(-30, 0.5, -30);
    scene.add(craneBaseMesh);
    meshes.push(craneBaseMesh);

    // Crane arm
    var armGeom = new THREE.BoxGeometry(1, 0.5, 15);
    var armMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });
    var armMesh = new THREE.Mesh(armGeom, armMat);
    armMesh.position.set(-30, 2.5, -15);
    scene.add(armMesh);
    cameraCrane = { base: craneBaseMesh, arm: armMesh };
    meshes.push(armMesh);

    // Crane head
    var headGeom = new THREE.CylinderGeometry(0.4, 0.4, 1, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x444444 });
    var headMesh = new THREE.Mesh(headGeom, headMat);
    headMesh.position.set(-30, 2.5, 0);
    scene.add(headMesh);
    meshes.push(headMesh);

    // Electric fence barrier - LineSegments with glow
    var fenceGeom = new THREE.BufferGeometry();
    var fencePoints = [];
    var fenceSegments = 32;
    var fenceRadius = arenaRadius + 5;
    for (var f = 0; f <= fenceSegments; f++) {
      var fAngle = (f / fenceSegments) * Math.PI * 2;
      var fX = Math.cos(fAngle) * fenceRadius;
      var fZ = Math.sin(fAngle) * fenceRadius;
      fencePoints.push(new THREE.Vector3(fX, 1, fZ));
      fencePoints.push(new THREE.Vector3(fX, 4, fZ));
    }
    fenceGeom.setFromPoints(fencePoints);
    var fenceMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 3 });
    electricFence = new THREE.LineSegments(fenceGeom, fenceMat);
    scene.add(electricFence);
    meshes.push(electricFence);

    // Define spawn points
    spawnPoints = [
      { x: 0, z: -arenaRadius + 5, y: 0.5 },
      { x: 0, z: arenaRadius - 5, y: 0.5 },
      { x: arenaRadius - 5, z: 0, y: 0.5 },
      { x: -arenaRadius + 5, z: 0, y: 0.5 },
      { x: 0, z: 0, y: 2 }
    ];
  }

  function update(delta) {
    // Spotlight sweeping in pattern
    for (var i = 0; i < spotlights.length; i++) {
      var spotlight = spotlights[i];
      var sweepAngle = spotlight.baseAngle + Math.sin(Date.now() * 0.001 + i) * 0.5;
      spotlight.mesh.rotation.z = Math.sin(Date.now() * 0.002) * 0.3;
    }

    // Weapon drop platform descending and ascending
    if (platformState.isDescending) {
      platformState.weaponDropY -= delta * 2;
      if (platformState.weaponDropY <= platformState.targetY) {
        platformState.weaponDropY = platformState.targetY;
        platformState.isDescending = false;
      }
    } else {
      platformState.weaponDropY += delta * 1;
      if (platformState.weaponDropY >= 15) {
        platformState.weaponDropY = 15;
        platformState.isDescending = true;
      }
    }

    if (weaponPlatform) {
      weaponPlatform.position.y = platformState.weaponDropY;
    }

    // Electric fence emissive pulse
    platformState.fenceEmissive = (Math.sin(Date.now() * 0.01) + 1) * 0.5;
    if (electricFence && electricFence.material) {
      electricFence.material.emissive.setHex(0x00ffff);
      electricFence.material.emissiveIntensity = platformState.fenceEmissive * 0.6;
    }

    // Camera crane panning
    if (cameraCrane) {
      platformState.craneAngle += delta * 0.3;
      cameraCrane.arm.rotation.y = Math.sin(platformState.craneAngle) * 0.4;
    }

    // Banner flapping animation
    for (var b = 0; b < banners.length; b++) {
      var banner = banners[b];
      var flap = Math.sin(Date.now() * 0.005 + b) * 0.15;
      banner.mesh.rotation.x = flap;
      banner.mesh.position.y = banner.baseY + Math.sin(Date.now() * 0.003 + b * 0.5) * 0.5;
    }

    // Gate opening for fighter entrance
    if (gateDoors.length > 0) {
      var gateOpenProgress = (Math.sin(Date.now() * 0.0008) + 1) * 0.5;
      for (var g = 0; g < gateDoors.length; g++) {
        var gate = gateDoors[g];
        var openOffset = gateOpenProgress > 0.3 ? (gateOpenProgress - 0.3) * 5 : 0;
        if (gate.baseZ < 0) {
          gate.mesh.position.z = gate.baseZ - openOffset * 3;
        } else {
          gate.mesh.position.z = gate.baseZ + openOffset * 3;
        }
      }
    }

    // Center platform rising with pulsing effect
    if (centerPlatform) {
      platformState.centerPlatformHeight = Math.sin(Date.now() * 0.003) * 0.8 + 0.2;
      centerPlatform.position.y = platformState.centerPlatformHeight;
      centerPlatform.scale.y = 1 + Math.sin(Date.now() * 0.004) * 0.2;
    }

    // Crowd shadow movement in spectator stands (subtle position shifts)
    for (var m = 0; m < meshes.length; m++) {
      var mesh = meshes[m];
      if (mesh.position.length > 50) {
        var dist = Math.sqrt(mesh.position.x * mesh.position.x + mesh.position.z * mesh.position.z);
        if (dist > 65) {
          mesh.material.emissive.setHex(
            Math.sin(Date.now() * 0.002 + m * 0.1) > 0 ? 0x333333 : 0x222222
          );
        }
      }
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      var mesh = meshes[i];
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          for (var m = 0; m < mesh.material.length; m++) {
            mesh.material[m].dispose();
          }
        } else {
          mesh.material.dispose();
        }
      }
    }
    meshes = [];
    spotlights = [];
    weaponPlatform = null;
    electricFence = null;
    cameraCrane = null;
    banners = [];
    centerPlatform = null;
    gateDoors = [];
    spawnPoints = [];

    platformState = {
      weaponDropY: 15,
      targetY: 8,
      isDescending: true,
      craneAngle: 0,
      bannerWave: 0,
      gateOpen: false,
      centerPlatformHeight: 0,
      fenceEmissive: 0
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
