window.OvergrownShrine = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var shrineObjects = [];
  var vineAnimations = [];
  var fireParticles = [];
  var leafClusters = [];
  var time = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    shrineObjects = [];
    vineAnimations = [];
    fireParticles = [];
    leafClusters = [];
    time = 0;

    buildTempleBase();
    buildPillars();
    buildIdolStatue();
    buildAltar();
    buildTunnelEntrance();
    buildFallenColumns();
    buildRootSystems();
    buildMosspPatches();
    buildDefensiveSandbags();
    buildAmmoCaches();
    buildCampfire();
    buildWaterChannel();
    buildDoorways();
    buildCanopy();
    buildUndergrowth();
  }

  function buildTempleBase() {
    var geometry = new THREE.BoxGeometry(30, 1, 25);
    var material = new THREE.MeshStandardMaterial({ color: 0x6b6b47, roughness: 0.8, metalness: 0.1 });
    var base = new THREE.Mesh(geometry, material);
    base.position.y = 0;
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    shrineObjects.push(base);

    // Crumbling stone walls with gaps
    for (var i = 0; i < 8; i++) {
      var wallGeo = new THREE.BoxGeometry(12, 5, 1.5);
      var wallMat = new THREE.MeshStandardMaterial({ color: 0x555544, roughness: 0.9, metalness: 0 });
      var wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.x = (i % 2 === 0 ? 1 : -1) * 15;
      wall.position.y = 3;
      wall.position.z = (i < 4 ? 1 : -1) * 11;
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      shrineObjects.push(wall);

      // Cracks and gaps in walls
      if (Math.random() > 0.4) {
        var crackGeo = new THREE.BoxGeometry(2, 2, 2);
        var crackMat = new THREE.MeshStandardMaterial({ color: 0x3d3d2d, roughness: 0.95 });
        var crack = new THREE.Mesh(crackGeo, crackMat);
        crack.position.x = wall.position.x + (Math.random() - 0.5) * 8;
        crack.position.y = wall.position.y + (Math.random() - 0.5) * 3;
        crack.position.z = wall.position.z;
        crack.castShadow = true;
        scene.add(crack);
        shrineObjects.push(crack);
      }
    }

    // Roots pushing through foundation
    for (var j = 0; j < 12; j++) {
      var rootGeo = new THREE.BoxGeometry(0.8, 3, 0.8);
      var rootMat = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.9 });
      var root = new THREE.Mesh(rootGeo, rootMat);
      root.position.x = (Math.random() - 0.5) * 25;
      root.position.y = 1.5;
      root.position.z = (Math.random() - 0.5) * 20;
      root.rotation.z = (Math.random() - 0.5) * 0.5;
      root.castShadow = true;
      scene.add(root);
      shrineObjects.push(root);
    }
  }

  function buildPillars() {
    var positions = [
      [-10, 0, -8], [-10, 0, 8],
      [10, 0, -8], [10, 0, 8],
      [-5, 0, -10], [5, 0, -10],
      [-5, 0, 10], [5, 0, 10]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      // Main pillar
      var pillarGeo = new THREE.CylinderGeometry(1.2, 1.3, 8, 12);
      var pillarMat = new THREE.MeshStandardMaterial({ color: 0x7a7a6a, roughness: 0.85, metalness: 0.05 });
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pos[0], pos[1] + 4, pos[2]);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      shrineObjects.push(pillar);

      // Vine wrapping (LineSegments)
      var vineGeometry = new THREE.BufferGeometry();
      var vinePoints = [];
      for (var v = 0; v < 20; v++) {
        var angle = (v / 20) * Math.PI * 4;
        var vineX = pos[0] + Math.cos(angle) * 1.3;
        var vineY = pos[1] + 2 + (v / 20) * 4;
        var vineZ = pos[2] + Math.sin(angle) * 1.3;
        vinePoints.push(new THREE.Vector3(vineX, vineY, vineZ));
      }
      vineGeometry.setFromPoints(vinePoints);
      var vineMat = new THREE.LineBasicMaterial({ color: 0x3d5a2d, linewidth: 3 });
      var vine = new THREE.LineSegments(vineGeometry, vineMat);
      scene.add(vine);
      shrineObjects.push(vine);
      vineAnimations.push({
        vine: vine,
        basePoints: vinePoints.map(function(p) { return p.clone(); }),
        pillarPos: pos,
        phase: Math.random() * Math.PI * 2
      });

      // Moss coverage on pillar
      var mossGeo = new THREE.BoxGeometry(2.8, 0.3, 0.1);
      var mossMat = new THREE.MeshStandardMaterial({ color: 0x4a6b3d, roughness: 0.95, metalness: 0 });
      var moss = new THREE.Mesh(mossGeo, mossMat);
      moss.position.set(pos[0], pos[1] + 3 + Math.random() * 4, pos[2] - 1.3);
      moss.rotation.z = (Math.random() - 0.5) * 0.3;
      moss.castShadow = true;
      scene.add(moss);
      shrineObjects.push(moss);
    }
  }

  function buildIdolStatue() {
    // Stepped stone base
    for (var s = 0; s < 3; s++) {
      var stepGeo = new THREE.BoxGeometry(4 - s * 0.8, 0.5, 4 - s * 0.8);
      var stepMat = new THREE.MeshStandardMaterial({ color: 0x6a6a5a, roughness: 0.9 });
      var step = new THREE.Mesh(stepGeo, stepMat);
      step.position.y = 0.5 + s * 0.6;
      step.castShadow = true;
      step.receiveShadow = true;
      scene.add(step);
      shrineObjects.push(step);
    }

    // Cylindrical body
    var bodyGeo = new THREE.CylinderGeometry(0.8, 0.9, 3, 8);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x5a5a4a, roughness: 0.85 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 3;
    body.castShadow = true;
    scene.add(body);
    shrineObjects.push(body);

    // Spherical head
    var headGeo = new THREE.SphereGeometry(0.9, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0x6b6b5b, roughness: 0.9 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 5;
    head.castShadow = true;
    scene.add(head);
    shrineObjects.push(head);

    // Vine wrapping the idol
    var idolVineGeo = new THREE.BufferGeometry();
    var idolVinePoints = [];
    for (var iv = 0; iv < 30; iv++) {
      var angle = (iv / 30) * Math.PI * 6;
      var vx = Math.cos(angle) * 1;
      var vy = 1 + (iv / 30) * 4;
      var vz = Math.sin(angle) * 1;
      idolVinePoints.push(new THREE.Vector3(vx, vy, vz));
    }
    idolVineGeo.setFromPoints(idolVinePoints);
    var idolVineMat = new THREE.LineBasicMaterial({ color: 0x2d4a1d, linewidth: 2 });
    var idolVine = new THREE.LineSegments(idolVineGeo, idolVineMat);
    scene.add(idolVine);
    shrineObjects.push(idolVine);
    vineAnimations.push({
      vine: idolVine,
      basePoints: idolVinePoints.map(function(p) { return p.clone(); }),
      pillarPos: [0, 0, 0],
      phase: Math.random() * Math.PI * 2
    });
  }

  function buildAltar() {
    // Stone slab altar
    var altarGeo = new THREE.BoxGeometry(5, 0.8, 3);
    var altarMat = new THREE.MeshStandardMaterial({ color: 0x5a5a4a, roughness: 0.85 });
    var altar = new THREE.Mesh(altarGeo, altarMat);
    altar.position.set(-8, 1.5, 0);
    altar.castShadow = true;
    altar.receiveShadow = true;
    scene.add(altar);
    shrineObjects.push(altar);

    // Offering bowls on altar
    for (var o = 0; o < 2; o++) {
      var bowlGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.4, 8);
      var bowlMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.7, metalness: 0.3 });
      var bowl = new THREE.Mesh(bowlGeo, bowlMat);
      bowl.position.set(-8 + (o - 0.5) * 2, 2.5, 0);
      bowl.castShadow = true;
      scene.add(bowl);
      shrineObjects.push(bowl);
    }
  }

  function buildTunnelEntrance() {
    // Dark tunnel entrance (recessed)
    var tunnelGeo = new THREE.BoxGeometry(3, 2.5, 1);
    var tunnelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a0a, roughness: 0.95, metalness: 0 });
    var tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.set(12, 2, -10);
    tunnel.castShadow = true;
    scene.add(tunnel);
    shrineObjects.push(tunnel);

    // Stone frame around tunnel
    var frameGeo = new THREE.BoxGeometry(3.8, 3.2, 0.3);
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x6a6a5a });
    var frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(12, 2.1, -10.3);
    frame.castShadow = true;
    scene.add(frame);
    shrineObjects.push(frame);
  }

  function buildFallenColumns() {
    for (var f = 0; f < 3; f++) {
      var fallGeo = new THREE.CylinderGeometry(0.9, 0.9, 6, 12);
      var fallMat = new THREE.MeshStandardMaterial({ color: 0x7a7a6a, roughness: 0.9 });
      var fallen = new THREE.Mesh(fallGeo, fallMat);
      fallen.rotation.z = Math.PI / 2.2;
      fallen.position.set(-15 + f * 8, 1.5, 5 + f * 2);
      fallen.castShadow = true;
      fallen.receiveShadow = true;
      scene.add(fallen);
      shrineObjects.push(fallen);

      // Vine on fallen column
      var fallVineGeo = new THREE.BufferGeometry();
      var fallVinePoints = [];
      for (var fv = 0; fv < 15; fv++) {
        var fx = -15 + f * 8 + (fv / 15) * 4;
        var fy = 1.5 + Math.sin((fv / 15) * Math.PI * 2) * 0.5;
        var fz = 5 + f * 2 + Math.cos((fv / 15) * Math.PI * 2) * 0.7;
        fallVinePoints.push(new THREE.Vector3(fx, fy, fz));
      }
      fallVineGeo.setFromPoints(fallVinePoints);
      var fallVineMat = new THREE.LineBasicMaterial({ color: 0x3d5a2d });
      var fallVine = new THREE.LineSegments(fallVineGeo, fallVineMat);
      scene.add(fallVine);
      shrineObjects.push(fallVine);
      vineAnimations.push({
        vine: fallVine,
        basePoints: fallVinePoints.map(function(p) { return p.clone(); }),
        pillarPos: [-15 + f * 8, 1.5, 5 + f * 2],
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function buildRootSystems() {
    for (var r = 0; r < 8; r++) {
      var rootGeo = new THREE.BufferGeometry();
      var rootPoints = [];
      var startX = (Math.random() - 0.5) * 20;
      var startY = 3 + Math.random() * 3;
      var startZ = (Math.random() - 0.5) * 18;

      rootPoints.push(new THREE.Vector3(startX, startY, startZ));
      for (var rb = 0; rb < 8; rb++) {
        var branchAngle = Math.random() * Math.PI * 2;
        var branchLength = 2 + Math.random() * 2;
        var branchX = startX + Math.cos(branchAngle) * branchLength;
        var branchY = startY - branchLength * 0.3;
        var branchZ = startZ + Math.sin(branchAngle) * branchLength;
        rootPoints.push(new THREE.Vector3(branchX, branchY, branchZ));
      }
      rootGeo.setFromPoints(rootPoints);
      var rootLineMat = new THREE.LineBasicMaterial({ color: 0x4a3a28, linewidth: 2 });
      var rootLine = new THREE.LineSegments(rootGeo, rootLineMat);
      scene.add(rootLine);
      shrineObjects.push(rootLine);
    }
  }

  function buildMosspPatches() {
    for (var m = 0; m < 15; m++) {
      var mossGeo = new THREE.BoxGeometry(
        1 + Math.random() * 2,
        0.15,
        1 + Math.random() * 2
      );
      var mossMat = new THREE.MeshStandardMaterial({ color: 0x4a6b3d, roughness: 0.95 });
      var mossPatch = new THREE.Mesh(mossGeo, mossMat);
      mossPatch.position.set(
        (Math.random() - 0.5) * 28,
        3.5 + Math.random() * 2,
        (Math.random() - 0.5) * 23
      );
      mossPatch.rotation.x = (Math.random() - 0.5) * 0.3;
      mossPatch.castShadow = true;
      scene.add(mossPatch);
      shrineObjects.push(mossPatch);
    }
  }

  function buildDefensiveSandbags() {
    for (var s = 0; s < 6; s++) {
      var bagGeo = new THREE.BoxGeometry(1.5, 0.7, 0.6);
      var bagMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.8 });
      var bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(
        -12 + (s % 3) * 2,
        0.5,
        -8 + Math.floor(s / 3) * 2
      );
      bag.castShadow = true;
      bag.receiveShadow = true;
      scene.add(bag);
      shrineObjects.push(bag);
    }
  }

  function buildAmmoCaches() {
    for (var a = 0; a < 4; a++) {
      var crateGeo = new THREE.BoxGeometry(1.2, 1, 1.2);
      var crateMat = new THREE.MeshStandardMaterial({ color: 0x5a4a2a, roughness: 0.75 });
      var crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(
        10 + (a % 2) * 2.5,
        1,
        5 + Math.floor(a / 2) * 2
      );
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      shrineObjects.push(crate);
    }
  }

  function buildCampfire() {
    // Stone ring
    var ringGeo = new THREE.CylinderGeometry(2, 2, 0.3, 16);
    var ringMat = new THREE.MeshStandardMaterial({ color: 0x5a5a4a, roughness: 0.9 });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 1, 0);
    ring.castShadow = true;
    ring.receiveShadow = true;
    scene.add(ring);
    shrineObjects.push(ring);

    // Fire particles (sphere flames)
    for (var fp = 0; fp < 12; fp++) {
      var flameGeo = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 6, 6);
      var flameMat = new THREE.MeshStandardMaterial({
        color: 0xff6b2c,
        emissive: 0xff4500,
        roughness: 0.5,
        metalness: 0
      });
      var flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(
        (Math.random() - 0.5) * 1.5,
        1.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * 1.5
      );
      scene.add(flame);
      shrineObjects.push(flame);
      fireParticles.push({
        mesh: flame,
        basePos: flame.position.clone(),
        baseScale: flame.scale.clone(),
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function buildWaterChannel() {
    // Stone gutter running down
    var gutterGeo = new THREE.BoxGeometry(1.5, 0.3, 25);
    var gutterMat = new THREE.MeshStandardMaterial({ color: 0x6a6a5a, roughness: 0.85 });
    var gutter = new THREE.Mesh(gutterGeo, gutterMat);
    gutter.position.set(-12, 0.5, 0);
    gutter.castShadow = true;
    gutter.receiveShadow = true;
    scene.add(gutter);
    shrineObjects.push(gutter);

    // Water flow (thin line)
    var waterGeo = new THREE.BufferGeometry();
    var waterPoints = [];
    for (var w = 0; w < 25; w++) {
      waterPoints.push(new THREE.Vector3(-12, 1, -12.5 + w));
    }
    waterGeo.setFromPoints(waterPoints);
    var waterMat = new THREE.LineBasicMaterial({ color: 0x4a7aa0, linewidth: 2 });
    var waterFlow = new THREE.LineSegments(waterGeo, waterMat);
    scene.add(waterFlow);
    shrineObjects.push(waterFlow);
  }

  function buildDoorways() {
    for (var d = 0; d < 2; d++) {
      var side1Geo = new THREE.BoxGeometry(0.4, 2.5, 0.2);
      var sideMat = new THREE.MeshStandardMaterial({ color: 0x6a6a5a, roughness: 0.9 });

      var side1 = new THREE.Mesh(side1Geo, sideMat);
      side1.position.set(8 + d * 16, 1.5, 10);
      side1.castShadow = true;
      scene.add(side1);
      shrineObjects.push(side1);

      var side2 = new THREE.Mesh(side1Geo, sideMat);
      side2.position.set(10 + d * 16, 1.5, 10);
      side2.castShadow = true;
      scene.add(side2);
      shrineObjects.push(side2);

      // Arch top
      var archGeo = new THREE.CylinderGeometry(1, 1, 0.2, 8);
      var archMat = new THREE.MeshStandardMaterial({ color: 0x7a7a6a, roughness: 0.9 });
      var arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(9 + d * 16, 3, 10);
      arch.rotation.z = Math.PI / 2;
      arch.castShadow = true;
      scene.add(arch);
      shrineObjects.push(arch);
    }
  }

  function buildCanopy() {
    // Jungle canopy overhead (leaf clusters as spheres)
    for (var c = 0; c < 20; c++) {
      var leafClusterGeo = new THREE.SphereGeometry(2 + Math.random() * 1.5, 8, 8);
      var leafMat = new THREE.MeshStandardMaterial({
        color: 0x2d5a1d,
        roughness: 0.8,
        metalness: 0
      });
      var leafCluster = new THREE.Mesh(leafClusterGeo, leafMat);
      leafCluster.position.set(
        (Math.random() - 0.5) * 32,
        12 + Math.random() * 4,
        (Math.random() - 0.5) * 28
      );
      leafCluster.scale.set(
        0.8 + Math.random() * 0.4,
        0.6 + Math.random() * 0.3,
        0.8 + Math.random() * 0.4
      );
      leafCluster.castShadow = true;
      scene.add(leafCluster);
      shrineObjects.push(leafCluster);
      leafClusters.push({
        mesh: leafCluster,
        basePos: leafCluster.position.clone(),
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function buildUndergrowth() {
    // Jungle ferns and undergrowth (cone shaped)
    for (var u = 0; u < 25; u++) {
      var fernGeo = new THREE.ConeGeometry(0.6, 1.5, 8);
      var fernMat = new THREE.MeshStandardMaterial({
        color: 0x3d5a2d,
        roughness: 0.85
      });
      var fern = new THREE.Mesh(fernGeo, fernMat);
      fern.position.set(
        (Math.random() - 0.5) * 30,
        0.8,
        (Math.random() - 0.5) * 24
      );
      fern.rotation.x = (Math.random() - 0.5) * 0.3;
      fern.rotation.z = Math.random() * Math.PI * 2;
      fern.castShadow = true;
      scene.add(fern);
      shrineObjects.push(fern);
    }
  }

  function update(delta) {
    time += delta;

    // Animate vines sway
    for (var v = 0; v < vineAnimations.length; v++) {
      var vineAnim = vineAnimations[v];
      var positions = [];
      for (var vp = 0; vp < vineAnim.basePoints.length; vp++) {
        var basePoint = vineAnim.basePoints[vp];
        var sway = Math.sin(time * 0.5 + vineAnim.phase + vp * 0.3) * 0.3;
        var swayX = sway * Math.cos(vp * 0.5);
        var swayZ = sway * Math.sin(vp * 0.5);
        positions.push(new THREE.Vector3(
          basePoint.x + swayX,
          basePoint.y,
          basePoint.z + swayZ
        ));
      }
      vineAnim.vine.geometry.setFromPoints(positions);
    }

    // Animate fire flicker
    for (var f = 0; f < fireParticles.length; f++) {
      var fire = fireParticles[f];
      var flicker = 0.8 + Math.sin(time * 2 + fire.phase) * 0.2;
      fire.mesh.scale.copy(fire.baseScale).multiplyScalar(flicker);
      fire.mesh.position.y = fire.basePos.y + Math.sin(time * 1.5 + fire.phase) * 0.4;
      fire.mesh.material.emissive.setHex(parseInt('ff4500', 16) * (0.5 + flicker * 0.5));
    }

    // Animate leaf clusters gentle oscillation
    for (var l = 0; l < leafClusters.length; l++) {
      var leaf = leafClusters[l];
      var oscillation = Math.sin(time * 0.3 + leaf.phase) * 0.3;
      leaf.mesh.position.y = leaf.basePos.y + oscillation;
      leaf.mesh.rotation.z += 0.01;
    }
  }

  function reset() {
    for (var s = 0; s < shrineObjects.length; s++) {
      scene.remove(shrineObjects[s]);
    }
    shrineObjects = [];
    vineAnimations = [];
    fireParticles = [];
    leafClusters = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
