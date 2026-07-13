window.MoltenKeep = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var moltenObjects = [];
  var animationState = {
    time: 0,
    moltenColorCycle: 0,
    ventFire: [],
    chainSway: {}
  };

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    moltenObjects = [];
    animationState.time = 0;
    animationState.moltenColorCycle = 0;
    animationState.ventFire = [];
    animationState.chainSway = {};

    buildMoltenKeep();
    return true;
  }

  function buildMoltenKeep() {
    // World center at origin
    var worldCenter = { x: 0, y: -15, z: 0 };
    var keepBaseY = -10;

    // ===== MOLTEN METAL SEA =====
    var moltenSeaGeom = new THREE.BoxGeometry(85, 8, 85);
    var moltenMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4500,
      emissive: 0xFF2200,
      metalness: 0.8,
      roughness: 0.2,
      emissiveIntensity: 0.6
    });
    var moltenSea = new THREE.Mesh(moltenSeaGeom, moltenMaterial);
    moltenSea.position.set(worldCenter.x, keepBaseY - 5, worldCenter.z);
    scene.add(moltenSea);
    moltenObjects.push(moltenSea);
    moltenSea.userData.isMolten = true;
    moltenSea.userData.baseMaterial = moltenMaterial;

    // ===== HARDENED CRUST SECTIONS =====
    var crustMaterial = new THREE.MeshStandardMaterial({
      color: 0x2A2A2A,
      metalness: 0.4,
      roughness: 0.7,
      emissive: 0x1a1a1a
    });

    // Crust patch 1 - northeast
    var crust1Geom = new THREE.BoxGeometry(18, 1.5, 18);
    var crust1 = new THREE.Mesh(crust1Geom, crustMaterial);
    crust1.position.set(25, keepBaseY - 3.5, 25);
    scene.add(crust1);
    moltenObjects.push(crust1);

    // Crust patch 2 - northwest
    var crust2Geom = new THREE.BoxGeometry(16, 1.2, 20);
    var crust2 = new THREE.Mesh(crust2Geom, crustMaterial);
    crust2.position.set(-28, keepBaseY - 3.2, 22);
    scene.add(crust2);
    moltenObjects.push(crust2);

    // Crust patch 3 - southeast
    var crust3Geom = new THREE.BoxGeometry(20, 1.4, 16);
    var crust3 = new THREE.Mesh(crust3Geom, crustMaterial);
    crust3.position.set(26, keepBaseY - 3.4, -24);
    scene.add(crust3);
    moltenObjects.push(crust3);

    // Crust patch 4 - southwest
    var crust4Geom = new THREE.BoxGeometry(15, 1.3, 18);
    var crust4 = new THREE.Mesh(crust4Geom, crustMaterial);
    crust4.position.set(-24, keepBaseY - 3.3, -26);
    scene.add(crust4);
    moltenObjects.push(crust4);

    // ===== CASTLE KEEP - MAIN TOWER =====
    var keepMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.1,
      roughness: 0.9,
      emissive: 0x0a0a0a
    });

    var keepGeom = new THREE.BoxGeometry(22, 48, 22);
    var keep = new THREE.Mesh(keepGeom, keepMaterial);
    keep.position.set(worldCenter.x, 4, worldCenter.z);
    scene.add(keep);
    moltenObjects.push(keep);

    // Keep melted lower section - darker, more submerged appearance
    var keepMeltedGeom = new THREE.BoxGeometry(24, 8, 24);
    var meltedMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f0f0f,
      metalness: 0.2,
      roughness: 0.8,
      emissive: 0x330000
    });
    var keepMelted = new THREE.Mesh(keepMeltedGeom, meltedMaterial);
    keepMelted.position.set(worldCenter.x, keepBaseY + 2, worldCenter.z);
    scene.add(keepMelted);
    moltenObjects.push(keepMelted);

    // ===== OUTER WALLS =====
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.1,
      roughness: 0.85
    });

    // North wall
    var wallNGeom = new THREE.BoxGeometry(30, 20, 4);
    var wallN = new THREE.Mesh(wallNGeom, wallMaterial);
    wallN.position.set(0, 5, -37);
    scene.add(wallN);
    moltenObjects.push(wallN);

    // South wall
    var wallSGeom = new THREE.BoxGeometry(30, 20, 4);
    var wallS = new THREE.Mesh(wallSGeom, wallMaterial);
    wallS.position.set(0, 5, 37);
    scene.add(wallS);
    moltenObjects.push(wallS);

    // East wall
    var wallEGeom = new THREE.BoxGeometry(4, 20, 30);
    var wallE = new THREE.Mesh(wallEGeom, wallMaterial);
    wallE.position.set(37, 5, 0);
    scene.add(wallE);
    moltenObjects.push(wallE);

    // West wall
    var wallWGeom = new THREE.BoxGeometry(4, 20, 30);
    var wallW = new THREE.Mesh(wallWGeom, wallMaterial);
    wallW.position.set(-37, 5, 0);
    scene.add(wallW);
    moltenObjects.push(wallW);

    // ===== KEEP INTERIOR ENTRANCE - HIGH ARCHWAY =====
    var archGeom = new THREE.BoxGeometry(10, 10, 1.5);
    var archMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.15,
      roughness: 0.85
    });
    var arch = new THREE.Mesh(archGeom, archMaterial);
    arch.position.set(0, 18, -11);
    scene.add(arch);
    moltenObjects.push(arch);

    // Arch frame - left
    var archLeftGeom = new THREE.BoxGeometry(0.8, 12, 1.2);
    var archLeft = new THREE.Mesh(archLeftGeom, archMaterial);
    archLeft.position.set(-5.5, 18, -11);
    scene.add(archLeft);
    moltenObjects.push(archLeft);

    // Arch frame - right
    var archRightGeom = new THREE.BoxGeometry(0.8, 12, 1.2);
    var archRight = new THREE.Mesh(archRightGeom, archMaterial);
    archRight.position.set(5.5, 18, -11);
    scene.add(archRight);
    moltenObjects.push(archRight);

    // ===== SUSPENDED BRIDGE TO ENTRANCE =====
    var bridgeGeom = new THREE.BoxGeometry(9, 1, 12);
    var bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.3,
      roughness: 0.7
    });
    var suspendedBridge = new THREE.Mesh(bridgeGeom, bridgeMaterial);
    suspendedBridge.position.set(0, 16, -18);
    scene.add(suspendedBridge);
    moltenObjects.push(suspendedBridge);

    // Bridge support beam - left
    var supportLeftGeom = new THREE.BoxGeometry(0.5, 8, 0.5);
    var supportLeft = new THREE.Mesh(supportLeftGeom, archMaterial);
    supportLeft.position.set(-4, 12, -18);
    scene.add(supportLeft);
    moltenObjects.push(supportLeft);

    // Bridge support beam - right
    var supportRightGeom = new THREE.BoxGeometry(0.5, 8, 0.5);
    var supportRight = new THREE.Mesh(supportRightGeom, archMaterial);
    supportRight.position.set(4, 12, -18);
    scene.add(supportRight);
    moltenObjects.push(supportRight);

    // ===== DRAWBRIDGE RUINS - FALLEN INTO MOLTEN POOL =====
    var bridgeRuin1Geom = new THREE.BoxGeometry(12, 1.5, 5);
    var bridgeRuin1 = new THREE.Mesh(bridgeRuin1Geom, bridgeMaterial);
    bridgeRuin1.rotation.z = 0.4;
    bridgeRuin1.position.set(-15, keepBaseY + 0.5, 12);
    scene.add(bridgeRuin1);
    moltenObjects.push(bridgeRuin1);

    var bridgeRuin2Geom = new THREE.BoxGeometry(10, 1.2, 4);
    var bridgeRuin2 = new THREE.Mesh(bridgeRuin2Geom, bridgeMaterial);
    bridgeRuin2.rotation.z = -0.5;
    bridgeRuin2.position.set(18, keepBaseY + 1, -8);
    scene.add(bridgeRuin2);
    moltenObjects.push(bridgeRuin2);

    // ===== FLOATING DEBRIS - STONE CHUNKS =====
    var debrisMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.05,
      roughness: 0.9
    });

    var debrisPositions = [
      { x: 12, y: keepBaseY + 0.8, z: 15 },
      { x: -10, y: keepBaseY + 0.6, z: -18 },
      { x: 20, y: keepBaseY + 0.7, z: 8 },
      { x: -22, y: keepBaseY + 0.9, z: 12 },
      { x: 8, y: keepBaseY + 0.5, z: -22 },
      { x: -18, y: keepBaseY + 0.7, z: -15 },
      { x: 25, y: keepBaseY + 1.0, z: -8 },
      { x: -12, y: keepBaseY + 0.6, z: 20 }
    ];

    debrisPositions.forEach(function(pos) {
      var debrisGeom = new THREE.BoxGeometry(
        3 + Math.random() * 2,
        2 + Math.random() * 1.5,
        3 + Math.random() * 2
      );
      var debris = new THREE.Mesh(debrisGeom, debrisMaterial);
      debris.position.set(pos.x, pos.y, pos.z);
      debris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(debris);
      moltenObjects.push(debris);
    });

    // ===== TURRET REMNANTS - CYLINDER STUBS =====
    var turretMaterial = keepMaterial;

    var turretPositions = [
      { x: 20, z: 20 },
      { x: -20, z: 20 },
      { x: 20, z: -20 },
      { x: -20, z: -20 }
    ];

    turretPositions.forEach(function(pos) {
      var turretGeom = new THREE.CylinderGeometry(3.5, 4, 18, 12);
      var turret = new THREE.Mesh(turretGeom, turretMaterial);
      turret.position.set(pos.x, 6, pos.z);
      scene.add(turret);
      moltenObjects.push(turret);

      // Melted turret top - partially submerged
      var turretMeltGeom = new THREE.CylinderGeometry(4, 4.5, 4, 12);
      var turretMelt = new THREE.Mesh(turretMeltGeom, meltedMaterial);
      turretMelt.position.set(pos.x, keepBaseY + 2, pos.z);
      scene.add(turretMelt);
      moltenObjects.push(turretMelt);
    });

    // ===== IRON BUTTRESSES - SUPPORT BEAMS =====
    var buttressMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x222222
    });

    var buttressPositions = [
      { x: 0, z: -11, rx: 0, rz: 0 },
      { x: 11, z: 0, rx: 0, rz: Math.PI / 2 },
      { x: -11, z: 0, rx: 0, rz: Math.PI / 2 },
      { x: 0, z: 11, rx: 0, rz: 0 }
    ];

    buttressPositions.forEach(function(pos) {
      var buttressGeom = new THREE.BoxGeometry(2, 20, 1.5);
      var buttress = new THREE.Mesh(buttressGeom, buttressMaterial);
      buttress.position.set(pos.x, 8, pos.z);
      buttress.rotation.set(pos.rx, pos.rz, 0);
      scene.add(buttress);
      moltenObjects.push(buttress);
    });

    // ===== LAVA FLOW CHANNELS =====
    var channelMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      emissive: 0xFF3300,
      metalness: 0.6,
      roughness: 0.4,
      emissiveIntensity: 0.5
    });

    var flowPositions = [
      { x: 30, z: 0 },
      { x: -30, z: 0 },
      { x: 0, z: 30 },
      { x: 0, z: -30 }
    ];

    flowPositions.forEach(function(pos) {
      var flowGeom = new THREE.BoxGeometry(2, 0.5, 20);
      var flow = new THREE.Mesh(flowGeom, channelMaterial);
      flow.position.set(pos.x, keepBaseY - 4, pos.z);
      scene.add(flow);
      moltenObjects.push(flow);
    });

    // ===== MAGMA VENTS WITH FIRE =====
    var ventPositions = [
      { x: 15, y: keepBaseY + 3, z: 0 },
      { x: -15, y: keepBaseY + 3, z: 0 },
      { x: 0, y: keepBaseY + 3, z: 15 },
      { x: 0, y: keepBaseY + 3, z: -15 }
    ];

    var ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.7
    });

    ventPositions.forEach(function(pos, idx) {
      // Vent cylinder
      var ventGeom = new THREE.CylinderGeometry(2.5, 3, 3, 8);
      var vent = new THREE.Mesh(ventGeom, ventMaterial);
      vent.position.set(pos.x, pos.y, pos.z);
      scene.add(vent);
      moltenObjects.push(vent);

      // Fire spheres in vent
      var fireCount = 3;
      animationState.ventFire[idx] = [];
      for (var i = 0; i < fireCount; i++) {
        var fireGeom = new THREE.SphereGeometry(1.2 + i * 0.3, 8, 8);
        var fireMaterial = new THREE.MeshStandardMaterial({
          color: 0xFF4500,
          emissive: 0xFF2200,
          metalness: 0.2,
          roughness: 0.6,
          emissiveIntensity: 0.8
        });
        var fire = new THREE.Mesh(fireGeom, fireMaterial);
        fire.position.set(pos.x, pos.y + 2 + i * 0.5, pos.z);
        scene.add(fire);
        moltenObjects.push(fire);
        animationState.ventFire[idx].push({
          mesh: fire,
          baseMaterial: fireMaterial,
          baseIntensity: 0.8,
          phase: i * Math.PI / 3
        });
      }
    });

    // ===== COOLED LAVA ROCKS - CONE AND BOX FORMATIONS =====
    var rockMaterial = crustMaterial;

    var rockFormations = [
      { x: 32, z: 32, type: 'cone' },
      { x: -32, z: 32, type: 'cone' },
      { x: 32, z: -32, type: 'cone' },
      { x: -32, z: -32, type: 'cone' },
      { x: 35, z: 0, type: 'box' },
      { x: -35, z: 0, type: 'box' },
      { x: 0, z: 35, type: 'box' },
      { x: 0, z: -35, type: 'box' }
    ];

    rockFormations.forEach(function(form) {
      if (form.type === 'cone') {
        var coneGeom = new THREE.ConeGeometry(5, 8, 8);
        var cone = new THREE.Mesh(coneGeom, rockMaterial);
        cone.position.set(form.x, keepBaseY + 1, form.z);
        scene.add(cone);
        moltenObjects.push(cone);
      } else {
        var boxGeom = new THREE.BoxGeometry(4, 2, 6);
        var box = new THREE.Mesh(boxGeom, rockMaterial);
        box.position.set(form.x, keepBaseY + 0.5, form.z);
        box.rotation.y = Math.random() * Math.PI;
        scene.add(box);
        moltenObjects.push(box);
      }
    });

    // ===== ACCESS CHAINS - LINESEGMENTS NETWORK =====
    var chainMaterial = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 });

    var chainStartPoints = [
      { x: -12, y: 14, z: -25, name: 'north' },
      { x: 12, y: 14, z: -25, name: 'north2' },
      { x: -20, y: 14, z: 8, name: 'west' },
      { x: 20, y: 14, z: 8, name: 'east' }
    ];

    chainStartPoints.forEach(function(start, idx) {
      var geometry = new THREE.BufferGeometry();
      var points = [];

      // Create chain points from start to center bridge
      var segments = 8;
      for (var i = 0; i <= segments; i++) {
        var t = i / segments;
        var px = start.x + (0 - start.x) * t;
        var py = start.y - (i / segments) * 3;
        var pz = start.z + (-18 - start.z) * t;
        points.push(new THREE.Vector3(px, py, pz));
      }

      geometry.setFromPoints(points);
      var chain = new THREE.LineSegments(geometry, chainMaterial);
      scene.add(chain);
      moltenObjects.push(chain);

      animationState.chainSway[idx] = {
        mesh: chain,
        basePoints: points.map(function(p) { return p.clone(); }),
        amplitude: 0.5 + Math.random() * 0.3,
        frequency: 0.8 + Math.random() * 0.4
      };
    });

    // Additional chains connecting crust islands
    var crustChains = [
      { p1: [25, keepBaseY - 3.5, 25], p2: [0, keepBaseY - 5, 0] },
      { p1: [-28, keepBaseY - 3.2, 22], p2: [0, keepBaseY - 5, 0] },
      { p1: [26, keepBaseY - 3.4, -24], p2: [0, keepBaseY - 5, 0] }
    ];

    crustChains.forEach(function(chainDef, idx) {
      var geometry = new THREE.BufferGeometry();
      var points = [];

      var segments = 6;
      for (var i = 0; i <= segments; i++) {
        var t = i / segments;
        var px = chainDef.p1[0] + (chainDef.p2[0] - chainDef.p1[0]) * t;
        var py = chainDef.p1[1] + (chainDef.p2[1] - chainDef.p1[1]) * t - (t * (1 - t)) * 2;
        var pz = chainDef.p1[2] + (chainDef.p2[2] - chainDef.p1[2]) * t;
        points.push(new THREE.Vector3(px, py, pz));
      }

      geometry.setFromPoints(points);
      var chain = new THREE.LineSegments(geometry, chainMaterial);
      scene.add(chain);
      moltenObjects.push(chain);

      animationState.chainSway[4 + idx] = {
        mesh: chain,
        basePoints: points.map(function(p) { return p.clone(); }),
        amplitude: 0.3 + Math.random() * 0.2,
        frequency: 0.6 + Math.random() * 0.3
      };
    });

    // ===== ADDITIONAL INTERIOR DETAILS =====
    // Keep internal wall details
    var detailMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.05,
      roughness: 0.95
    });

    // Stone blocks on keep walls
    var blockPositions = [
      { x: -11, y: 15, z: -11 },
      { x: 11, y: 15, z: -11 },
      { x: -11, y: 10, z: -11 },
      { x: 11, y: 10, z: -11 },
      { x: -11, y: 25, z: -11 },
      { x: 11, y: 25, z: -11 }
    ];

    blockPositions.forEach(function(pos) {
      var blockGeom = new THREE.BoxGeometry(1.5, 1.5, 0.8);
      var block = new THREE.Mesh(blockGeom, detailMaterial);
      block.position.set(pos.x, pos.y, pos.z);
      scene.add(block);
      moltenObjects.push(block);
    });

    // Reinforcing girders on walls
    var girderMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.4,
      roughness: 0.5
    });

    var girderPositions = [
      { x: 0, y: 8, z: -11, sx: 8, sy: 0.5, sz: 0.5 },
      { x: 0, y: 16, z: -11, sx: 8, sy: 0.5, sz: 0.5 },
      { x: 0, y: 24, z: -11, sx: 8, sy: 0.5, sz: 0.5 },
      { x: -11, y: 8, z: 0, sx: 0.5, sy: 0.5, sz: 8 },
      { x: 11, y: 8, z: 0, sx: 0.5, sy: 0.5, sz: 8 }
    ];

    girderPositions.forEach(function(pos) {
      var girderGeom = new THREE.BoxGeometry(pos.sx, pos.sy, pos.sz);
      var girder = new THREE.Mesh(girderGeom, girderMaterial);
      girder.position.set(pos.x, pos.y, pos.z);
      scene.add(girder);
      moltenObjects.push(girder);
    });

    // More floating debris for total count
    for (var i = 0; i < 25; i++) {
      var extraDebrisGeom = new THREE.BoxGeometry(
        1 + Math.random() * 1.5,
        0.8 + Math.random() * 1,
        1 + Math.random() * 1.5
      );
      var extraDebris = new THREE.Mesh(extraDebrisGeom, debrisMaterial);
      extraDebris.position.set(
        (Math.random() - 0.5) * 70,
        keepBaseY + 0.3 + Math.random() * 1.2,
        (Math.random() - 0.5) * 70
      );
      extraDebris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(extraDebris);
      moltenObjects.push(extraDebris);
    }

    // Additional cooled rock formations
    for (var i = 0; i < 15; i++) {
      var randomRock = new THREE.Mesh(
        new THREE.BoxGeometry(2 + Math.random(), 1 + Math.random() * 0.5, 2 + Math.random()),
        rockMaterial
      );
      randomRock.position.set(
        (Math.random() - 0.5) * 60,
        keepBaseY + Math.random() * 0.8,
        (Math.random() - 0.5) * 60
      );
      randomRock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(randomRock);
      moltenObjects.push(randomRock);
    }

    // Additional turret cones
    for (var i = 0; i < 8; i++) {
      var extraTurretGeom = new THREE.CylinderGeometry(2, 2.5, 12, 8);
      var extraTurret = new THREE.Mesh(extraTurretGeom, turretMaterial);
      extraTurret.position.set(
        (Math.random() - 0.5) * 50,
        8,
        (Math.random() - 0.5) * 50
      );
      scene.add(extraTurret);
      moltenObjects.push(extraTurret);
    }
  }

  function update(delta) {
    animationState.time += delta;

    // Animate molten surface color cycling
    var moltenCycleSpeed = 2;
    var colorCycle = Math.sin(animationState.time * moltenCycleSpeed) * 0.5 + 0.5;

    moltenObjects.forEach(function(obj) {
      if (obj.userData.isMolten && obj.material) {
        var baseColor = new THREE.Color(0xFF4500);
        var brightColor = new THREE.Color(0xFF6600);
        baseColor.lerp(brightColor, colorCycle);

        obj.material.color.copy(baseColor);
        obj.material.emissive.copy(baseColor);
        obj.material.emissiveIntensity = 0.4 + colorCycle * 0.4;
      }
    });

    // Animate vent fire pulsing
    animationState.ventFire.forEach(function(ventArray) {
      ventArray.forEach(function(fire) {
        var pulse = Math.sin(animationState.time * 3 + fire.phase) * 0.5 + 0.5;
        fire.mesh.scale.set(
          1 + pulse * 0.3,
          1 + pulse * 0.3,
          1 + pulse * 0.3
        );
        if (fire.baseMaterial) {
          fire.baseMaterial.emissiveIntensity = fire.baseIntensity * (0.6 + pulse * 0.4);
        }
      });
    });

    // Animate chain swaying
    Object.keys(animationState.chainSway).forEach(function(key) {
      var chain = animationState.chainSway[key];
      var sway = Math.sin(animationState.time * chain.frequency) * chain.amplitude;
      var swayPerpendicular = Math.cos(animationState.time * chain.frequency * 0.7) * chain.amplitude * 0.5;

      var newPoints = chain.basePoints.map(function(basePoint, idx) {
        var newPoint = basePoint.clone();
        if (idx > 0 && idx < chain.basePoints.length - 1) {
          newPoint.x += sway;
          newPoint.z += swayPerpendicular;
        }
        return newPoint;
      });

      chain.mesh.geometry.setFromPoints(newPoints);
      chain.mesh.geometry.attributes.position.needsUpdate = true;
    });
  }

  function reset() {
    moltenObjects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    moltenObjects = [];
    animationState.time = 0;
    animationState.moltenColorCycle = 0;
    animationState.ventFire = [];
    animationState.chainSway = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
