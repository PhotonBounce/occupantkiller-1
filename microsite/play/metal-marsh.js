window.MetalMarsh = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var bubbles = [];
  var fogOrbs = [];
  var driplets = [];

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    bubbles = [];
    fogOrbs = [];
    driplets = [];

    createWaterPatches();
    createRustedMetal();
    createPipelineNetwork();
    createToxicBubbles();
    createDeadTrees();
    createMilitaryWalkway();
    createBarbedWireBarriers();
    createSunkenVehicles();
    createCraneStructure();
    createChemicalDrums();
    createFloatingPlatforms();
    createFogOrbs();
    createUtilityPoles();
  };

  var createWaterPatches = function() {
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a4a3a,
      metalness: 0.3,
      roughness: 0.8
    });

    for (var i = 0; i < 35; i++) {
      var x = (Math.random() - 0.5) * 80;
      var z = (Math.random() - 0.5) * 80;
      var w = 4 + Math.random() * 6;
      var d = 4 + Math.random() * 6;

      var waterPatch = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.3, d),
        waterMaterial
      );
      waterPatch.position.set(x, 0.1, z);
      waterPatch.castShadow = true;
      waterPatch.receiveShadow = true;
      scene.add(waterPatch);
      objects.push(waterPatch);
    }
  };

  var createRustedMetal = function() {
    var rustMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.7,
      roughness: 0.4
    });

    for (var i = 0; i < 25; i++) {
      var x = (Math.random() - 0.5) * 80;
      var z = (Math.random() - 0.5) * 80;
      var w = 1 + Math.random() * 3;
      var h = 0.5 + Math.random() * 2;
      var d = 1 + Math.random() * 3;

      var metalScrap = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        rustMaterial
      );
      metalScrap.position.set(x, h * 0.5 + 0.2, z);
      metalScrap.rotation.x = (Math.random() - 0.5) * 0.5;
      metalScrap.rotation.z = (Math.random() - 0.5) * 0.5;
      metalScrap.castShadow = true;
      metalScrap.receiveShadow = true;
      scene.add(metalScrap);
      objects.push(metalScrap);
    }
  };

  var createPipelineNetwork = function() {
    var pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0x663333,
      metalness: 0.8,
      roughness: 0.3
    });

    for (var i = 0; i < 15; i++) {
      var x = (Math.random() - 0.5) * 80;
      var z = (Math.random() - 0.5) * 80;
      var length = 8 + Math.random() * 12;
      var angle = Math.random() * Math.PI * 2;

      var pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, length, 12),
        pipeMaterial
      );
      pipe.position.set(x, 2 + Math.random() * 3, z);
      pipe.rotation.z = angle;
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      scene.add(pipe);
      objects.push(pipe);

      if (Math.random() > 0.6) {
        for (var j = 0; j < 8; j++) {
          var driplet = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 6, 6),
            new THREE.MeshStandardMaterial({
              color: 0x99ff00,
              emissive: 0x33aa00,
              metalness: 0.2,
              roughness: 0.5
            })
          );
          driplets.push({
            mesh: driplet,
            pipeX: x,
            pipeZ: z,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -2 - Math.random() * 1,
            vz: (Math.random() - 0.5) * 0.5,
            life: 0
          });
          scene.add(driplet);
          objects.push(driplet);
        }
      }
    }
  };

  var createToxicBubbles = function() {
    for (var i = 0; i < 40; i++) {
      var x = (Math.random() - 0.5) * 80;
      var z = (Math.random() - 0.5) * 80;
      var radius = 0.2 + Math.random() * 0.5;

      var bubble = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0x99ff33,
          emissive: 0x66cc00,
          metalness: 0.3,
          roughness: 0.6,
          transparent: true,
          opacity: 0.7
        })
      );
      bubble.position.set(x, 0.5 + Math.random() * 2, z);
      bubble.castShadow = true;
      scene.add(bubble);

      bubbles.push({
        mesh: bubble,
        startX: x,
        startZ: z,
        velocity: 0.5 + Math.random() * 1.5,
        wobbleAmount: Math.random() * 0.3,
        wobbleSpeed: 2 + Math.random() * 2,
        time: Math.random() * Math.PI * 2
      });
      objects.push(bubble);
    }
  };

  var createDeadTrees = function() {
    var trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.2,
      roughness: 0.9
    });

    for (var i = 0; i < 12; i++) {
      var x = (Math.random() - 0.5) * 80;
      var z = (Math.random() - 0.5) * 80;
      var height = 6 + Math.random() * 8;

      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, height, 8),
        trunkMaterial
      );
      trunk.position.set(x, height * 0.5, z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);
      objects.push(trunk);

      for (var j = 0; j < 5; j++) {
        var branchX = x + (Math.random() - 0.5) * 2;
        var branchZ = z + (Math.random() - 0.5) * 2;
        var branchHeight = 2 + Math.random() * (height - 2);

        var branch = new THREE.Mesh(
          new THREE.ConeGeometry(0.3, 1.5, 6),
          trunkMaterial
        );
        branch.position.set(branchX, branchHeight, branchZ);
        branch.rotation.x = (Math.random() - 0.5) * 0.8;
        branch.castShadow = true;
        scene.add(branch);
        objects.push(branch);
      }
    }
  };

  var createMilitaryWalkway = function() {
    var plankMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a2a,
      metalness: 0.4,
      roughness: 0.7
    });

    var pathLength = 60;
    var numPlanks = 20;

    for (var i = 0; i < numPlanks; i++) {
      var progression = i / (numPlanks - 1);
      var x = (progression - 0.5) * pathLength;
      var z = -20 + Math.random() * 4;
      var angle = 0.3 * Math.sin(progression * Math.PI * 2);

      var plank = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.8, 1.5),
        plankMaterial
      );
      plank.position.set(x, 1.2, z);
      plank.rotation.y = angle;
      plank.castShadow = true;
      plank.receiveShadow = true;
      scene.add(plank);
      objects.push(plank);
    }
  };

  var createBarbedWireBarriers = function() {
    var postMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.9,
      roughness: 0.2
    });

    var positions = [
      [-35, 5],
      [-35, -35],
      [0, -35],
      [35, -35],
      [35, 5],
      [30, 35],
      [-30, 35]
    ];

    for (var i = 0; i < positions.length; i++) {
      var x = positions[i][0];
      var z = positions[i][1];

      for (var j = 0; j < 3; j++) {
        var post = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 4 + j * 0.5, 0.3),
          postMaterial
        );
        var postHeight = 4 + j * 0.5;
        post.position.set(x, postHeight * 0.5, z);
        post.castShadow = true;
        post.receiveShadow = true;
        scene.add(post);
        objects.push(post);

        if (j < 2) {
          var wirePoints = [
            new THREE.Vector3(x - 3, postHeight * (0.3 + j * 0.3), z),
            new THREE.Vector3(x + 3, postHeight * (0.3 + j * 0.3), z)
          ];
          var wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
          var wireEd = new THREE.LineSegments(
            wireGeom,
            new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 })
          );
          scene.add(wireEd);
          objects.push(wireEd);
        }
      }
    }
  };

  var createSunkenVehicles = function() {
    var vehicleMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3a2a,
      metalness: 0.6,
      roughness: 0.5
    });

    for (var i = 0; i < 3; i++) {
      var x = -30 + i * 30;
      var z = 10 + i * 10;

      var body = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 2),
        vehicleMaterial
      );
      body.position.set(x, 0.8, z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      objects.push(body);

      var cab = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 1.5),
        vehicleMaterial
      );
      cab.position.set(x + 1.5, 1.5, z);
      cab.castShadow = true;
      cab.receiveShadow = true;
      scene.add(cab);
      objects.push(cab);

      for (var w = 0; w < 4; w++) {
        var wheelX = x + (w < 2 ? -1.5 : 1.5);
        var wheelZ = z + (w % 2 === 0 ? -1 : 1);
        var wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12),
          new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        wheel.position.set(wheelX, 0.6, wheelZ);
        wheel.rotation.z = Math.PI * 0.5;
        wheel.castShadow = true;
        scene.add(wheel);
        objects.push(wheel);
      }
    }
  };

  var createCraneStructure = function() {
    var steelMaterial = new THREE.MeshStandardMaterial({
      color: 0x666655,
      metalness: 0.85,
      roughness: 0.3
    });

    var baseX = 25;
    var baseZ = 25;

    var towerHeight = 15;
    var tower = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, towerHeight, 1.5),
      steelMaterial
    );
    tower.position.set(baseX, towerHeight * 0.5, baseZ);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    objects.push(tower);

    var arm = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.8, 0.8),
      steelMaterial
    );
    arm.position.set(baseX + 6, towerHeight - 1, baseZ);
    arm.castShadow = true;
    arm.receiveShadow = true;
    scene.add(arm);
    objects.push(arm);

    var hook = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      steelMaterial
    );
    hook.position.set(baseX + 11, towerHeight - 3, baseZ);
    hook.castShadow = true;
    scene.add(hook);
    objects.push(hook);

    for (var i = 0; i < 4; i++) {
      var bracketX = baseX + (i % 2 === 0 ? -0.8 : 0.8);
      var bracketZ = baseZ + (i < 2 ? -0.8 : 0.8);
      var bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 5, 0.3),
        steelMaterial
      );
      bracket.position.set(bracketX, 2.5, bracketZ);
      bracket.castShadow = true;
      scene.add(bracket);
      objects.push(bracket);
    }
  };

  var createChemicalDrums = function() {
    var drumMaterial = new THREE.MeshStandardMaterial({
      color: 0xccaa33,
      metalness: 0.6,
      roughness: 0.4
    });

    var centerX = -25;
    var centerZ = -25;

    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var radius = 3 + Math.random() * 2;
      var x = centerX + Math.cos(angle) * radius;
      var z = centerZ + Math.sin(angle) * radius;
      var height = 1.5 + Math.random() * 0.5;

      var drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, height, 12),
        drumMaterial
      );
      drum.position.set(x, height * 0.5, z);
      drum.castShadow = true;
      drum.receiveShadow = true;
      scene.add(drum);
      objects.push(drum);

      if (Math.random() > 0.5) {
        for (var j = 0; j < 3; j++) {
          var leak = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 6, 6),
            new THREE.MeshStandardMaterial({
              color: 0xff9900,
              emissive: 0xcc6600,
              metalness: 0.3,
              roughness: 0.6
            })
          );
          driplets.push({
            mesh: leak,
            pipeX: x,
            pipeZ: z,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -1.5 - Math.random() * 0.8,
            vz: (Math.random() - 0.5) * 0.3,
            life: 0
          });
          scene.add(leak);
          objects.push(leak);
        }
      }
    }
  };

  var createFloatingPlatforms = function() {
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a4a,
      metalness: 0.5,
      roughness: 0.6
    });

    var platformPositions = [
      [-15, -10],
      [-5, 0],
      [5, -5],
      [15, 5],
      [10, -15],
      [-10, 15]
    ];

    for (var i = 0; i < platformPositions.length; i++) {
      var x = platformPositions[i][0];
      var z = platformPositions[i][1];

      var platform = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.4, 3),
        platformMaterial
      );
      platform.position.set(x, 0.5, z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);
      objects.push(platform);

      for (var p = 0; p < 4; p++) {
        var pillarX = x + (p % 2 === 0 ? -1.2 : 1.2);
        var pillarZ = z + (p < 2 ? -1.2 : 1.2);
        var pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8),
          platformMaterial
        );
        pillar.position.set(pillarX, 0.4, pillarZ);
        pillar.castShadow = true;
        scene.add(pillar);
        objects.push(pillar);
      }
    }
  };

  var createFogOrbs = function() {
    for (var i = 0; i < 25; i++) {
      var x = (Math.random() - 0.5) * 80;
      var y = 2 + Math.random() * 8;
      var z = (Math.random() - 0.5) * 80;
      var radius = 1.5 + Math.random() * 2;

      var fogOrb = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0x66cc66,
          emissive: 0x339933,
          metalness: 0.1,
          roughness: 0.9,
          transparent: true,
          opacity: 0.3
        })
      );
      fogOrb.position.set(x, y, z);
      scene.add(fogOrb);

      fogOrbs.push({
        mesh: fogOrb,
        startX: x,
        startY: y,
        startZ: z,
        driftX: (Math.random() - 0.5) * 0.3,
        driftY: (Math.random() - 0.5) * 0.2,
        driftZ: (Math.random() - 0.5) * 0.3,
        time: Math.random() * Math.PI * 2
      });
      objects.push(fogOrb);
    }
  };

  var createUtilityPoles = function() {
    var poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x555544,
      metalness: 0.4,
      roughness: 0.6
    });

    var polePositions = [
      [-30, -30],
      [0, -30],
      [30, -30],
      [-30, 0],
      [30, 0],
      [-30, 30],
      [0, 30],
      [30, 30]
    ];

    for (var i = 0; i < polePositions.length; i++) {
      var x = polePositions[i][0];
      var z = polePositions[i][1];
      var poleHeight = 8 + Math.random() * 2;

      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.4, poleHeight, 8),
        poleMaterial
      );
      pole.position.set(x, poleHeight * 0.5, z);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);
      objects.push(pole);

      if (i < polePositions.length - 1) {
        var nextX = polePositions[i + 1][0];
        var nextZ = polePositions[i + 1][1];
        var sag = 0.8 + Math.random() * 0.5;

        var wirePoints = [
          new THREE.Vector3(x, poleHeight - 0.5, z),
          new THREE.Vector3(
            (x + nextX) * 0.5,
            poleHeight - sag,
            (z + nextZ) * 0.5
          ),
          new THREE.Vector3(nextX, poleHeight - 0.5, nextZ)
        ];
        var wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireEd = new THREE.LineSegments(
          wireGeom,
          new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 })
        );
        scene.add(wireEd);
        objects.push(wireEd);
      }
    }
  };

  var update = function(delta) {
    var i = 0;

    for (i = 0; i < bubbles.length; i++) {
      var bubble = bubbles[i];
      bubble.time += delta * bubble.wobbleSpeed;

      var wobble = Math.sin(bubble.time) * bubble.wobbleAmount;
      bubble.mesh.position.x = bubble.startX + wobble;
      bubble.mesh.position.y += delta * bubble.velocity;
      bubble.mesh.position.z = bubble.startZ + Math.cos(bubble.time * 0.5) * bubble.wobbleAmount;

      if (bubble.mesh.position.y > 15) {
        bubble.mesh.position.y = 0.5 + Math.random() * 2;
      }

      bubble.mesh.scale.x -= delta * 0.1;
      bubble.mesh.scale.y -= delta * 0.1;
      bubble.mesh.scale.z -= delta * 0.1;

      if (bubble.mesh.scale.x <= 0.3) {
        bubble.mesh.scale.set(1, 1, 1);
      }
    }

    for (i = 0; i < fogOrbs.length; i++) {
      var fogOrb = fogOrbs[i];
      fogOrb.time += delta * 0.5;

      fogOrb.mesh.position.x =
        fogOrb.startX + Math.sin(fogOrb.time) * fogOrb.driftX * 5;
      fogOrb.mesh.position.y =
        fogOrb.startY + Math.cos(fogOrb.time * 0.7) * fogOrb.driftY * 5;
      fogOrb.mesh.position.z =
        fogOrb.startZ + Math.sin(fogOrb.time * 0.5) * fogOrb.driftZ * 5;

      fogOrb.mesh.rotation.x += delta * 0.2;
      fogOrb.mesh.rotation.y += delta * 0.15;
    }

    for (i = 0; i < driplets.length; i++) {
      var driplet = driplets[i];
      driplet.life += delta;

      driplet.mesh.position.x += driplet.vx * delta;
      driplet.mesh.position.y += driplet.vy * delta;
      driplet.mesh.position.z += driplet.vz * delta;

      if (driplet.mesh.position.y < 0.1) {
        driplet.mesh.position.set(driplet.pipeX, 2, driplet.pipeZ);
        driplet.life = 0;
      }

      driplet.mesh.rotation.x += delta * 2;
      driplet.mesh.rotation.y += delta * 1.5;
    }
  };

  var reset = function() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    bubbles = [];
    fogOrbs = [];
    driplets = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
