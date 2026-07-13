window.CursedVillage = (function() {
  'use strict';

  var objects = [];
  var animationData = {};

  var init = function(scene, camera) {
    objects = [];
    animationData = {};

    // Crumbling church with inverted cross
    var churchWalls = new THREE.Mesh(
      new THREE.BoxGeometry(15, 20, 10),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 })
    );
    churchWalls.position.set(-30, 10, -50);
    churchWalls.castShadow = true;
    scene.add(churchWalls);
    objects.push(churchWalls);

    var steeple = new THREE.Mesh(
      new THREE.ConeGeometry(4, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 })
    );
    steeple.position.set(-30, 25, -50);
    steeple.castShadow = true;
    scene.add(steeple);
    objects.push(steeple);

    var invertedCross = new THREE.LineSegments(
      createInvertedCrossGeometry(4),
      new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 })
    );
    invertedCross.position.set(-30, 18, -45);
    scene.add(invertedCross);
    objects.push(invertedCross);

    // Ritual bonfire circle
    var bonfireBase = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 0.5, 32),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 })
    );
    bonfireBase.position.set(20, 0.25, -30);
    bonfireBase.castShadow = true;
    scene.add(bonfireBase);
    objects.push(bonfireBase);

    var bonfireLogs = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 2, 16),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 })
    );
    bonfireLogs.position.set(20, 1.5, -30);
    bonfireLogs.castShadow = true;
    scene.add(bonfireLogs);
    objects.push(bonfireLogs);
    animationData.bonfireFlame = {
      intensity: 1,
      flickerSpeed: 0.15
    };

    // Ritual circle stones
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var x = 20 + Math.cos(angle) * 12;
      var z = -30 + Math.sin(angle) * 12;
      var stone = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 })
      );
      stone.position.set(x, 0.6, z);
      stone.castShadow = true;
      scene.add(stone);
      objects.push(stone);
    }

    // Plague doctor scarecrows
    for (var s = 0; s < 3; s++) {
      var scarecrowX = -10 + s * 25;
      var scarecrowZ = -20 + s * 15;

      var scarecrowBody = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.7 })
      );
      scarecrowBody.position.set(scarecrowX, 2, scarecrowZ);
      scarecrowBody.castShadow = true;
      scene.add(scarecrowBody);
      objects.push(scarecrowBody);

      var scarecrowHead = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.9 })
      );
      scarecrowHead.position.set(scarecrowX, 5.5, scarecrowZ);
      scarecrowHead.castShadow = true;
      scene.add(scarecrowHead);
      objects.push(scarecrowHead);

      var beakMask = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 2, 6),
        new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 })
      );
      beakMask.position.set(scarecrowX + 1, 5.5, scarecrowZ);
      beakMask.rotation.z = Math.PI / 2;
      beakMask.castShadow = true;
      scene.add(beakMask);
      objects.push(beakMask);

      // Scarecrow arms
      var armLeft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 4, 6),
        new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.7 })
      );
      armLeft.position.set(scarecrowX - 2.5, 3.5, scarecrowZ);
      armLeft.rotation.z = Math.PI / 6;
      armLeft.castShadow = true;
      scene.add(armLeft);
      objects.push(armLeft);

      var armRight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 4, 6),
        new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.7 })
      );
      armRight.position.set(scarecrowX + 2.5, 3.5, scarecrowZ);
      armRight.rotation.z = -Math.PI / 6;
      armRight.castShadow = true;
      scene.add(armRight);
      objects.push(armRight);

      animationData['scarecrow' + s] = {
        swayAmount: 0,
        swaySpeed: 0.05 + s * 0.01,
        originalZ: scarecrowZ
      };
    }

    // Coffin wagon
    var wagonBody = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 4),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 })
    );
    wagonBody.position.set(40, 1.5, -40);
    wagonBody.castShadow = true;
    scene.add(wagonBody);
    objects.push(wagonBody);

    var wagonWheel1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 })
    );
    wagonWheel1.position.set(36, 1.2, -37);
    wagonWheel1.rotation.z = Math.PI / 2;
    wagonWheel1.castShadow = true;
    scene.add(wagonWheel1);
    objects.push(wagonWheel1);

    var wagonWheel2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 })
    );
    wagonWheel2.position.set(44, 1.2, -37);
    wagonWheel2.rotation.z = Math.PI / 2;
    wagonWheel2.castShadow = true;
    scene.add(wagonWheel2);
    objects.push(wagonWheel2);

    var coffin = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.5, 5),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.95 })
    );
    coffin.position.set(40, 3, -40);
    coffin.castShadow = true;
    scene.add(coffin);
    objects.push(coffin);

    // Moon-silhouetted dead trees
    for (var t = 0; t < 5; t++) {
      var treeX = -50 + t * 30;
      var treeZ = 20;

      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2, 15, 8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
      );
      trunk.position.set(treeX, 7.5, treeZ);
      trunk.castShadow = true;
      scene.add(trunk);
      objects.push(trunk);

      // Gnarled branches
      var branch1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.3, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
      );
      branch1.position.set(treeX + 3, 12, treeZ);
      branch1.rotation.z = Math.PI / 3;
      branch1.castShadow = true;
      scene.add(branch1);
      objects.push(branch1);

      var branch2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.3, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
      );
      branch2.position.set(treeX - 3, 12, treeZ);
      branch2.rotation.z = -Math.PI / 3;
      branch2.castShadow = true;
      scene.add(branch2);
      objects.push(branch2);

      animationData['tree' + t] = {
        swayAngle: 0,
        swaySpeed: 0.03 + t * 0.005
      };
    }

    // Blood-stained well
    var wellBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.5, 1, 16),
      new THREE.MeshStandardMaterial({ color: 0x5a2a2a, roughness: 0.8 })
    );
    wellBase.position.set(-5, 0.5, 5);
    wellBase.castShadow = true;
    scene.add(wellBase);
    objects.push(wellBase);

    var wellRing = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 2.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x6a3a3a, roughness: 0.7 })
    );
    wellRing.position.set(-5, 1.75, 5);
    wellRing.castShadow = true;
    scene.add(wellRing);
    objects.push(wellRing);

    var wellRope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 })
    );
    wellRope.position.set(-5, 3.5, 5);
    wellRope.castShadow = true;
    scene.add(wellRope);
    objects.push(wellRope);

    // Crows on fences
    for (var c = 0; c < 4; c++) {
      var fenceX = 0 + c * 20;
      var fenceZ = -10;

      var fencePole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 5, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 })
      );
      fencePole.position.set(fenceX, 2.5, fenceZ);
      fencePole.castShadow = true;
      scene.add(fencePole);
      objects.push(fencePole);

      var crowBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 })
      );
      crowBody.position.set(fenceX, 5.2, fenceZ);
      crowBody.castShadow = true;
      scene.add(crowBody);
      objects.push(crowBody);

      var crowHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1 })
      );
      crowHead.position.set(fenceX + 0.5, 5.7, fenceZ);
      crowHead.castShadow = true;
      scene.add(crowHead);
      objects.push(crowHead);

      animationData['crow' + c] = {
        wingFlap: 0,
        flapSpeed: 0.08 + c * 0.02,
        fenceX: fenceX,
        fenceZ: fenceZ
      };
    }

    // Cellar trapdoor
    var trapdoor = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 4),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.9 })
    );
    trapdoor.position.set(15, 0.15, 15);
    trapdoor.castShadow = true;
    scene.add(trapdoor);
    objects.push(trapdoor);

    var trapdoorRing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 })
    );
    trapdoorRing.position.set(15, 0.25, 15);
    trapdoorRing.castShadow = true;
    scene.add(trapdoorRing);
    objects.push(trapdoorRing);

    animationData.trapdoor = {
      rotationY: 0,
      targetRotation: 0,
      isOpen: false
    };

    // Hex symbol carved in road
    var hexSymbol = new THREE.LineSegments(
      createHexSymbolGeometry(3),
      new THREE.LineBasicMaterial({ color: 0x8a0000, linewidth: 3 })
    );
    hexSymbol.position.set(-15, 0.3, -60);
    scene.add(hexSymbol);
    objects.push(hexSymbol);

    // Fog machine pipes
    for (var p = 0; p < 2; p++) {
      var pipeX = -35 + p * 40;

      var pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7 })
      );
      pipe.position.set(pipeX, 3, -20);
      pipe.castShadow = true;
      scene.add(pipe);
      objects.push(pipe);

      var nozzle = new THREE.Mesh(
        new THREE.ConeGeometry(0.4, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.6 })
      );
      nozzle.position.set(pipeX, 6.5, -20);
      nozzle.castShadow = true;
      scene.add(nozzle);
      objects.push(nozzle);

      animationData['fog' + p] = {
        density: 0.3,
        driftAmount: 0,
        driftSpeed: 0.02 + p * 0.01
      };
    }

    // Warding charm bundles hanging from eaves
    for (var b = 0; b < 6; b++) {
      var charmX = -25 + b * 10;
      var charmZ = -55;

      var charmBundle = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.8 })
      );
      charmBundle.position.set(charmX, 15, charmZ);
      charmBundle.castShadow = true;
      scene.add(charmBundle);
      objects.push(charmBundle);

      var charmString = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2, 4),
        new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.8 })
      );
      charmString.position.set(charmX, 16.5, charmZ);
      charmString.castShadow = true;
      scene.add(charmString);
      objects.push(charmString);

      animationData['charm' + b] = {
        swayZ: 0,
        swayAmount: 0.5,
        swaySpeed: 0.04 + b * 0.01
      };
    }

    // Moon in the sky
    var moon = new THREE.Mesh(
      new THREE.SphereGeometry(15, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0, emissive: 0x666666, roughness: 0.6 })
    );
    moon.position.set(-80, 60, -100);
    scene.add(moon);
    objects.push(moon);

    animationData.moon = {
      glowIntensity: 0.5,
      glowSpeed: 0.03
    };
  };

  var update = function(delta) {
    // Bonfire flicker
    if (animationData.bonfireFlame) {
      animationData.bonfireFlame.intensity += (Math.random() - 0.5) * 0.2;
      animationData.bonfireFlame.intensity = Math.max(0.5, Math.min(2, animationData.bonfireFlame.intensity));
    }

    // Scarecrow sway
    for (var s = 0; s < 3; s++) {
      var key = 'scarecrow' + s;
      if (animationData[key]) {
        animationData[key].swayAmount += animationData[key].swaySpeed;
        var scarecrowObj = objects[8 + s * 5];
        if (scarecrowObj) {
          scarecrowObj.position.z = animationData[key].originalZ + Math.sin(animationData[key].swayAmount) * 0.3;
        }
      }
    }

    // Tree sway
    for (var t = 0; t < 5; t++) {
      var treeKey = 'tree' + t;
      if (animationData[treeKey]) {
        animationData[treeKey].swayAngle += animationData[treeKey].swaySpeed;
        var treeObj = objects[21 + t * 3];
        if (treeObj) {
          treeObj.rotation.z = Math.sin(animationData[treeKey].swayAngle) * 0.1;
        }
      }
    }

    // Crow wing flap
    for (var c = 0; c < 4; c++) {
      var crowKey = 'crow' + c;
      if (animationData[crowKey]) {
        animationData[crowKey].wingFlap += animationData[crowKey].flapSpeed;
      }
    }

    // Fog drift
    for (var f = 0; f < 2; f++) {
      var fogKey = 'fog' + f;
      if (animationData[fogKey]) {
        animationData[fogKey].driftAmount += animationData[fogKey].driftSpeed;
      }
    }

    // Charm bundles sway
    for (var b = 0; b < 6; b++) {
      var charmKey = 'charm' + b;
      if (animationData[charmKey]) {
        animationData[charmKey].swayZ += animationData[charmKey].swaySpeed;
        var charmObj = objects[46 + b * 2];
        if (charmObj) {
          charmObj.position.z = -55 + Math.sin(animationData[charmKey].swayZ) * animationData[charmKey].swayAmount;
        }
      }
    }

    // Moon glow
    if (animationData.moon) {
      animationData.moon.glowIntensity += animationData.moon.glowSpeed;
      if (animationData.moon.glowIntensity > 1 || animationData.moon.glowIntensity < 0.5) {
        animationData.moon.glowSpeed *= -1;
      }
    }
  };

  var reset = function() {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
    }
    objects = [];
    animationData = {};
  };

  var createInvertedCrossGeometry = function(size) {
    var geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([
      0, size, 0,
      0, -size, 0,
      -size, 0, 0,
      size, 0, 0,
      0, -size, 0,
      0, -size * 2, 0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  };

  var createHexSymbolGeometry = function(size) {
    var geometry = new THREE.BufferGeometry();
    var vertices = [];
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      vertices.push(Math.cos(angle) * size, Math.sin(angle) * size, 0);
    }
    vertices.push(Math.cos(0) * size, Math.sin(0) * size, 0);
    for (var j = 0; j < 6; j++) {
      var angle2 = (j / 6) * Math.PI * 2 + Math.PI / 6;
      vertices.push(Math.cos(angle2) * (size * 0.6), Math.sin(angle2) * (size * 0.6), 0);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    return geometry;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
