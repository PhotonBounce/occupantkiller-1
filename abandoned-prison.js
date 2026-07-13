window.AbandonedPrison = (function() {
  'use strict';

  var prisons = [];
  var fireFlickers = [];
  var weedSwayers = [];
  var soundPulses = [];
  var fluorFlickers = [];

  var init = function(scene, camera) {
    // Clear previous state
    prisons = [];
    fireFlickers = [];
    weedSwayers = [];
    soundPulses = [];
    fluorFlickers = [];

    // Perimeter Wall - Crumbling sections with gaps
    var wallSegments = [
      { x: 0, z: -50, w: 40, h: 15, d: 2, crumbled: false },
      { x: -30, z: -35, w: 3, h: 15, d: 2, crumbled: true },
      { x: -20, z: -50, w: 8, h: 12, d: 2, crumbled: true },
      { x: 30, z: -50, w: 20, h: 8, d: 2, crumbled: true },
      { x: -50, z: 0, w: 2, h: 15, d: 40, crumbled: false },
      { x: -45, z: 15, w: 2, h: 10, d: 8, crumbled: true },
      { x: 50, z: 0, w: 2, h: 15, d: 40, crumbled: false },
      { x: 45, z: -20, w: 2, h: 12, d: 10, crumbled: true },
      { x: 0, z: 50, w: 35, h: 15, d: 2, crumbled: false },
      { x: 25, z: 45, w: 15, h: 8, d: 2, crumbled: true }
    ];

    wallSegments.forEach(function(seg) {
      var wallMat = new THREE.MeshStandardMaterial({
        color: seg.crumbled ? 0x4a4a4a : 0x333333,
        roughness: 0.9,
        metalness: 0.1
      });
      var wallGeo = new THREE.BoxGeometry(seg.w, seg.h, seg.d);
      var wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(seg.x, seg.h / 2, seg.z);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      scene.add(wallMesh);
      prisons.push(wallMesh);

      // Spray paint graffiti on walls
      if (Math.random() > 0.5) {
        var graffitiW = seg.w > 5 ? seg.w - 1 : 2;
        var graffitiD = 0.1;
        var graffitiColors = [0xff0000, 0x00ff00, 0xffff00, 0xff00ff];
        var graffitiMat = new THREE.MeshStandardMaterial({
          color: graffitiColors[Math.floor(Math.random() * graffitiColors.length)],
          emissive: 0x000000,
          roughness: 0.5
        });
        var graffitiGeo = new THREE.BoxGeometry(graffitiW, seg.h - 2, graffitiD);
        var graffitiMesh = new THREE.Mesh(graffitiGeo, graffitiMat);
        graffitiMesh.position.set(seg.x, seg.h / 2, seg.z + seg.d / 2 + 0.1);
        graffitiMesh.castShadow = true;
        scene.add(graffitiMesh);
        prisons.push(graffitiMesh);
      }
    });

    // Guard Tower Ruins - Partial structure elevated
    var towerBaseMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.8,
      metalness: 0.2
    });
    var towerBase = new THREE.BoxGeometry(8, 20, 8);
    var towerMesh = new THREE.Mesh(towerBase, towerBaseMat);
    towerMesh.position.set(-35, 10, -40);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    scene.add(towerMesh);
    prisons.push(towerMesh);

    // Collapsed tower top section
    var collapsedMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.95,
      metalness: 0.05
    });
    var collapsed = new THREE.BoxGeometry(7, 2, 10);
    var collapsedMesh = new THREE.Mesh(collapsed, collapsedMat);
    collapsedMesh.position.set(-35, 25, -35);
    collapsedMesh.rotation.z = 0.3;
    collapsedMesh.castShadow = true;
    scene.add(collapsedMesh);
    prisons.push(collapsedMesh);

    // Cell Block - Long building with open cell doors
    var cellBlockMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.85,
      metalness: 0.15
    });
    var cellBlockGeo = new THREE.BoxGeometry(60, 12, 8);
    var cellBlockMesh = new THREE.Mesh(cellBlockGeo, cellBlockMat);
    cellBlockMesh.position.set(0, 6, 0);
    cellBlockMesh.castShadow = true;
    cellBlockMesh.receiveShadow = true;
    scene.add(cellBlockMesh);
    prisons.push(cellBlockMesh);

    // Cell doors - barred frames
    for (var i = 0; i < 12; i++) {
      var doorX = -28 + i * 5;
      var doorMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.7,
        metalness: 0.4
      });
      var doorGeo = new THREE.BoxGeometry(0.2, 7, 4);
      var doorMesh = new THREE.Mesh(doorGeo, doorMat);
      doorMesh.position.set(doorX, 7, 3.5);
      doorMesh.castShadow = true;
      scene.add(doorMesh);
      prisons.push(doorMesh);

      // Horizontal bars
      var barGeo = new THREE.BoxGeometry(3.5, 0.15, 0.15);
      for (var j = 0; j < 5; j++) {
        var barMat = new THREE.MeshStandardMaterial({
          color: 0x1a1a1a,
          roughness: 0.6,
          metalness: 0.6
        });
        var barMesh = new THREE.Mesh(barGeo, barMat);
        barMesh.position.set(doorX, 3 + j * 1.2, 3.5);
        barMesh.castShadow = true;
        scene.add(barMesh);
        prisons.push(barMesh);
      }
    }

    // Crumbled section revealing interior
    var rubbleMat = new THREE.MeshStandardMaterial({
      color: 0x6a6a6a,
      roughness: 0.99,
      metalness: 0
    });
    var rubblePositions = [
      { x: 20, y: 8, z: 0 },
      { x: 22, y: 6, z: -1 },
      { x: 18, y: 7, z: 1 },
      { x: 24, y: 5, z: 2 },
      { x: 19, y: 9, z: -2 }
    ];

    rubblePositions.forEach(function(pos) {
      var rubbleGeo = new THREE.BoxGeometry(3 + Math.random() * 2, 2 + Math.random() * 2, 2 + Math.random() * 2);
      var rubbleMesh = new THREE.Mesh(rubbleGeo, rubbleMat);
      rubbleMesh.position.set(pos.x, pos.y, pos.z);
      rubbleMesh.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      rubbleMesh.castShadow = true;
      scene.add(rubbleMesh);
      prisons.push(rubbleMesh);
    });

    // Overgrown Exercise Yard - with vegetation patches
    var yardMat = new THREE.MeshStandardMaterial({
      color: 0x8a8a7a,
      roughness: 0.9,
      metalness: 0
    });
    var yardGeo = new THREE.BoxGeometry(80, 0.5, 60);
    var yardMesh = new THREE.Mesh(yardGeo, yardMat);
    yardMesh.position.set(0, -0.25, 0);
    yardMesh.receiveShadow = true;
    scene.add(yardMesh);
    prisons.push(yardMesh);

    // Weed clusters
    for (var w = 0; w < 20; w++) {
      var weedX = -30 + Math.random() * 60;
      var weedZ = -25 + Math.random() * 50;
      var weedMat = new THREE.MeshStandardMaterial({
        color: 0x4a7a3a,
        roughness: 0.7,
        metalness: 0
      });
      var weedGeo = new THREE.ConeGeometry(1.5, 4, 6);
      var weedMesh = new THREE.Mesh(weedGeo, weedMat);
      weedMesh.position.set(weedX, 2, weedZ);
      weedMesh.castShadow = true;
      scene.add(weedMesh);
      prisons.push(weedMesh);
      weedSwayers.push({ mesh: weedMesh, baseY: 2, speed: 0.5 + Math.random() * 0.5 });
    }

    // Rusted Fence - posts and corroded wire
    for (var p = 0; p < 15; p++) {
      var postZ = -40 + p * 6;
      var postMat = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.95,
        metalness: 0.3
      });
      var postGeo = new THREE.BoxGeometry(0.3, 8, 0.3);
      var postMesh = new THREE.Mesh(postGeo, postMat);
      postMesh.position.set(40, 4, postZ);
      postMesh.castShadow = true;
      scene.add(postMesh);
      prisons.push(postMesh);
    }

    // Wire between posts
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = [];
    for (var w = 0; w < 15; w++) {
      var wireZ = -40 + w * 6;
      wirePositions.push(40.15, 3, wireZ);
      wirePositions.push(40.15, 6, wireZ);
      if (w < 14) {
        var nextZ = -40 + (w + 1) * 6;
        wirePositions.push(40.15, 6, wireZ);
        wirePositions.push(40.15, 6, nextZ);
      }
    }
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePositions), 3));
    var wireMat = new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 2 });
    var wireMesh = new THREE.LineSegments(wireGeometry, wireMat);
    scene.add(wireMesh);
    prisons.push(wireMesh);

    // Gang Hideout Setup - bedrolls, table, graffiti wall
    var bedrollMat = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.8,
      metalness: 0
    });
    var bedrollGeo = new THREE.BoxGeometry(3, 0.8, 2);
    var bedroll1 = new THREE.Mesh(bedrollGeo, bedrollMat);
    bedroll1.position.set(-15, 0.4, 15);
    bedroll1.castShadow = true;
    scene.add(bedroll1);
    prisons.push(bedroll1);

    var bedroll2 = new THREE.Mesh(bedrollGeo, bedrollMat);
    bedroll2.position.set(-10, 0.4, 17);
    bedroll2.castShadow = true;
    scene.add(bedroll2);
    prisons.push(bedroll2);

    // Makeshift table
    var tableMat = new THREE.MeshStandardMaterial({
      color: 0x4a3a2a,
      roughness: 0.85,
      metalness: 0.1
    });
    var tableTopGeo = new THREE.BoxGeometry(6, 0.5, 4);
    var tableTop = new THREE.Mesh(tableTopGeo, tableMat);
    tableTop.position.set(-12, 1, 12);
    tableTop.castShadow = true;
    scene.add(tableTop);
    prisons.push(tableTop);

    for (var tl = 0; tl < 4; tl++) {
      var legX = -15 + (tl % 2) * 6;
      var legZ = 10 + Math.floor(tl / 2) * 4;
      var legGeo = new THREE.BoxGeometry(0.4, 1, 0.4);
      var legMesh = new THREE.Mesh(legGeo, tableMat);
      legMesh.position.set(legX, 0.5, legZ);
      legMesh.castShadow = true;
      scene.add(legMesh);
      prisons.push(legMesh);
    }

    // Graffiti wall panels in hideout
    var graffitiWallMat1 = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.6,
      metalness: 0
    });
    var graffitiWallGeo = new THREE.BoxGeometry(8, 6, 0.2);
    var graffitiWall1 = new THREE.Mesh(graffitiWallGeo, graffitiWallMat1);
    graffitiWall1.position.set(-20, 3, 25);
    graffitiWall1.castShadow = true;
    scene.add(graffitiWall1);
    prisons.push(graffitiWall1);

    var graffitiWallMat2 = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      roughness: 0.6,
      metalness: 0
    });
    var graffitiWall2 = new THREE.Mesh(graffitiWallGeo, graffitiWallMat2);
    graffitiWall2.position.set(-5, 3, 25);
    graffitiWall2.castShadow = true;
    scene.add(graffitiWall2);
    prisons.push(graffitiWall2);

    // Weapon Stash Crates - hidden in cell
    var crateMat = new THREE.MeshStandardMaterial({
      color: 0x6a5a4a,
      roughness: 0.8,
      metalness: 0.2
    });
    var crateGeo = new THREE.BoxGeometry(2, 2.5, 1.5);
    var crate1 = new THREE.Mesh(crateGeo, crateMat);
    crate1.position.set(-25, 1.25, 8);
    crate1.castShadow = true;
    scene.add(crate1);
    prisons.push(crate1);

    var crate2 = new THREE.Mesh(crateGeo, crateMat);
    crate2.position.set(-20, 1.25, 8);
    crate2.castShadow = true;
    scene.add(crate2);
    prisons.push(crate2);

    // Cooking Area - barrel and fire
    var barrelMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a1a,
      roughness: 0.9,
      metalness: 0.3
    });
    var barrelGeo = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(30, 1, 15);
    barrel.castShadow = true;
    scene.add(barrel);
    prisons.push(barrel);

    // Fire sphere inside barrel
    var fireMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 0.8,
      roughness: 0.4,
      metalness: 0
    });
    var fireGeo = new THREE.SphereGeometry(0.8, 8, 8);
    var fireSphere = new THREE.Mesh(fireGeo, fireMat);
    fireSphere.position.set(30, 2.5, 15);
    fireSphere.castShadow = false;
    scene.add(fireSphere);
    prisons.push(fireSphere);
    fireFlickers.push({ mesh: fireSphere, baseIntensity: 0.8, speed: 3 });

    // Collapsed Roof Sections - fallen slabs
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.9,
      metalness: 0.1
    });
    var roofGeo = new THREE.BoxGeometry(15, 1, 8);
    var roof1 = new THREE.Mesh(roofGeo, roofMat);
    roof1.position.set(-40, 10, 20);
    roof1.rotation.z = -0.4;
    roof1.castShadow = true;
    scene.add(roof1);
    prisons.push(roof1);

    var roof2 = new THREE.Mesh(roofGeo, roofMat);
    roof2.position.set(35, 8, -15);
    roof2.rotation.z = 0.3;
    roof2.castShadow = true;
    scene.add(roof2);
    prisons.push(roof2);

    // Watchtower still standing - elevated
    var towerStandMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.85,
      metalness: 0.15
    });
    var towerStandGeo = new THREE.BoxGeometry(6, 25, 6);
    var towerStand = new THREE.Mesh(towerStandGeo, towerStandMat);
    towerStand.position.set(45, 12.5, 35);
    towerStand.castShadow = true;
    scene.add(towerStand);
    prisons.push(towerStand);

    // Solitary Confinement Corridor - very narrow passage
    var solitaryMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95,
      metalness: 0.05
    });
    var solitaryGeo = new THREE.BoxGeometry(2, 10, 20);
    var solitary = new THREE.Mesh(solitaryGeo, solitaryMat);
    solitary.position.set(-50, 5, 15);
    solitary.castShadow = true;
    scene.add(solitary);
    prisons.push(solitary);

    // Contraband Tunnel Mouth
    var tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a2a,
      roughness: 0.92,
      metalness: 0.08
    });
    var tunnelGeo = new THREE.BoxGeometry(4, 3, 1.5);
    var tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.set(0, 2, -55);
    tunnel.castShadow = true;
    scene.add(tunnel);
    prisons.push(tunnel);

    // Makeshift Barricade - debris and wire
    var barricadeMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a3a,
      roughness: 0.9,
      metalness: 0.2
    });
    var barricadeGeo = new THREE.BoxGeometry(12, 3, 0.5);
    var barricade = new THREE.Mesh(barricadeGeo, barricadeMat);
    barricade.position.set(-35, 1.5, -52);
    barricade.castShadow = true;
    scene.add(barricade);
    prisons.push(barricade);

    // Broken Glass - shard pile
    var glassMat = new THREE.MeshStandardMaterial({
      color: 0x66ccff,
      roughness: 0.1,
      metalness: 0,
      transparent: true,
      opacity: 0.6
    });
    var glassPositions = [
      { x: 10, z: -30 },
      { x: 15, z: -28 },
      { x: 12, z: -32 },
      { x: 18, z: -29 }
    ];

    glassPositions.forEach(function(pos) {
      var glassGeo = new THREE.BoxGeometry(0.8, 0.2, 0.8);
      var glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.set(pos.x, 0.1, pos.z);
      glassMesh.castShadow = true;
      scene.add(glassMesh);
      prisons.push(glassMesh);
    });

    // Water Damage Staining - dark patches
    var stainMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95,
      metalness: 0,
      transparent: true,
      opacity: 0.7
    });
    var stainGeo = new THREE.BoxGeometry(5, 3, 0.15);
    var stain1 = new THREE.Mesh(stainGeo, stainMat);
    stain1.position.set(-20, 8, 8.1);
    scene.add(stain1);
    prisons.push(stain1);

    var stain2 = new THREE.Mesh(stainGeo, stainMat);
    stain2.position.set(15, 6, -8.1);
    scene.add(stain2);
    prisons.push(stain2);

    // Light Shafts through holes - emissive beams
    var lightMat = new THREE.MeshStandardMaterial({
      color: 0xffff99,
      emissive: 0xffff66,
      emissiveIntensity: 0.5,
      roughness: 0.5,
      metalness: 0,
      transparent: true,
      opacity: 0.3
    });
    var lightGeo = new THREE.SphereGeometry(2, 8, 8);
    var lightShaft1 = new THREE.Mesh(lightGeo, lightMat);
    lightShaft1.position.set(-15, 8, 0);
    scene.add(lightShaft1);
    prisons.push(lightShaft1);

    var lightShaft2 = new THREE.Mesh(lightGeo, lightMat);
    lightShaft2.position.set(25, 10, 20);
    scene.add(lightShaft2);
    prisons.push(lightShaft2);

    // Distant Sound Visual Indicator - pulsing sphere
    var soundMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 0.4,
      roughness: 0.6,
      metalness: 0.2
    });
    var soundGeo = new THREE.SphereGeometry(1, 6, 6);
    var soundPulse = new THREE.Mesh(soundGeo, soundMat);
    soundPulse.position.set(40, 3, -30);
    scene.add(soundPulse);
    prisons.push(soundPulse);
    soundPulses.push({ mesh: soundPulse, baseScale: 1, speed: 2 });

    // Broken Fluorescent Flicker - emissive blink
    var fluorMat = new THREE.MeshStandardMaterial({
      color: 0x6699ff,
      emissive: 0x3366ff,
      emissiveIntensity: 0.6,
      roughness: 0.4,
      metalness: 0.3
    });
    var fluorGeo = new THREE.SphereGeometry(0.6, 6, 6);
    var fluor1 = new THREE.Mesh(fluorGeo, fluorMat);
    fluor1.position.set(-30, 9, 0);
    scene.add(fluor1);
    prisons.push(fluor1);
    fluorFlickers.push({ mesh: fluor1, baseIntensity: 0.6, speed: 4 });

    var fluor2 = new THREE.Mesh(fluorGeo, fluorMat);
    fluor2.position.set(20, 8, 15);
    scene.add(fluor2);
    prisons.push(fluor2);
    fluorFlickers.push({ mesh: fluor2, baseIntensity: 0.6, speed: 5 });
  };

  var update = function(delta) {
    var elapsed = (performance.now() || Date.now()) * 0.001;

    // Fire flicker
    fireFlickers.forEach(function(fire) {
      var flicker = Math.sin(elapsed * fire.speed) * 0.3 + 0.7;
      fire.mesh.material.emissiveIntensity = fire.baseIntensity * flicker;
    });

    // Weed sway
    weedSwayers.forEach(function(weed) {
      var sway = Math.sin(elapsed * weed.speed) * 0.4;
      weed.mesh.position.y = weed.baseY + sway;
      weed.mesh.rotation.z = sway * 0.2;
    });

    // Sound pulse animation
    soundPulses.forEach(function(pulse) {
      var pulseFactor = Math.sin(elapsed * pulse.speed) * 0.4 + 0.6;
      pulse.mesh.scale.set(pulseFactor, pulseFactor, pulseFactor);
    });

    // Fluorescent flicker
    fluorFlickers.forEach(function(fluor) {
      var randomFlicker = Math.random() > 0.95 ? 0.1 : fluor.baseIntensity;
      fluor.mesh.material.emissiveIntensity = randomFlicker;
    });
  };

  var reset = function() {
    prisons.forEach(function(mesh) {
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(function(mat) { mat.dispose(); });
        } else {
          mesh.material.dispose();
        }
      }
    });
    prisons = [];
    fireFlickers = [];
    weedSwayers = [];
    soundPulses = [];
    fluorFlickers = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
