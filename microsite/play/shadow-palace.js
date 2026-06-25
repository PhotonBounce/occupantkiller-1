window.ShadowPalace = (function() {
  'use strict';

  var objects = [];
  var animatedMaterials = [];
  var animationData = [];

  function createMaterial(color, opacity, emissive, roughness, metalness) {
    var material = new THREE.MeshPhongMaterial({
      color: color,
      opacity: opacity || 1.0,
      transparent: opacity !== undefined && opacity < 1.0,
      emissive: emissive || 0x000000,
      roughness: roughness || 0.7,
      metalness: metalness || 0.3
    });
    return material;
  }

  function addToScene(scene, mesh) {
    scene.add(mesh);
    objects.push(mesh);
  }

  function createPalaceFacade(scene) {
    var mainWing = new THREE.Mesh(
      new THREE.BoxGeometry(40, 35, 25),
      createMaterial(0x1a1a2e, 1.0, 0x0a0a0f)
    );
    mainWing.position.set(0, 17, 0);
    addToScene(scene, mainWing);

    var leftWing = new THREE.Mesh(
      new THREE.BoxGeometry(18, 28, 20),
      createMaterial(0x0f0f1e, 1.0, 0x050508)
    );
    leftWing.position.set(-25, 14, -5);
    addToScene(scene, leftWing);

    var rightWing = new THREE.Mesh(
      new THREE.BoxGeometry(18, 28, 20),
      createMaterial(0x0f0f1e, 1.0, 0x050508)
    );
    rightWing.position.set(25, 14, -5);
    addToScene(scene, rightWing);

    // Palace windows - dark recesses
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 3; j++) {
        var window = new THREE.Mesh(
          new THREE.BoxGeometry(3, 4, 1),
          createMaterial(0x000000, 1.0, 0x1a0000)
        );
        window.position.set(-15 + i * 10, 25 - j * 8, 12.5);
        addToScene(scene, window);
      }
    }

    // Main palace front accent panels
    for (var p = 0; p < 3; p++) {
      var panel = new THREE.Mesh(
        new THREE.BoxGeometry(8, 30, 0.5),
        createMaterial(0x2a2a3e, 1.0, 0x0a0a14)
      );
      panel.position.set(-12 + p * 12, 17, 12.6);
      addToScene(scene, panel);
    }
  }

  function createGothicTowers(scene) {
    var towerPositions = [
      { x: -40, z: -35 },
      { x: 40, z: -35 },
      { x: -40, z: 35 },
      { x: 40, z: 35 }
    ];

    towerPositions.forEach(function(pos) {
      // Tower base cylinder
      var towerBase = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 7, 40, 8),
        createMaterial(0x1a1a2e, 1.0, 0x0a0a0f)
      );
      towerBase.position.set(pos.x, 20, pos.z);
      addToScene(scene, towerBase);

      // Jagged cone top
      var towerTop = new THREE.Mesh(
        new THREE.ConeGeometry(7, 15, 8),
        createMaterial(0x0a0a14, 1.0, 0x1a0000)
      );
      towerTop.position.set(pos.x, 47.5, pos.z);
      towerTop.scale.y = 1.3;
      addToScene(scene, towerTop);

      // Tower accent rings
      for (var r = 0; r < 4; r++) {
        var ring = new THREE.Mesh(
          new THREE.CylinderGeometry(6.5, 6.5, 1, 8),
          createMaterial(0x2a2a3e, 1.0, 0x0a0a14)
        );
        ring.position.set(pos.x, 10 + r * 10, pos.z);
        addToScene(scene, ring);
      }
    });
  }

  function createOrnateGate(scene) {
    // Main gate frame
    var gateFrame = new THREE.Mesh(
      new THREE.BoxGeometry(20, 30, 2),
      createMaterial(0x1a1a2e, 1.0, 0x0a0a0f)
    );
    gateFrame.position.set(0, 15, 38);
    addToScene(scene, gateFrame);

    // Gate posts
    var leftPost = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 32, 8),
      createMaterial(0x0a0a14, 1.0, 0x1a0000)
    );
    leftPost.position.set(-11, 16, 38);
    addToScene(scene, leftPost);

    var rightPost = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 32, 8),
      createMaterial(0x0a0a14, 1.0, 0x1a0000)
    );
    rightPost.position.set(11, 16, 38);
    addToScene(scene, rightPost);

    // Iron bars - LineSegments pattern
    for (var b = 0; b < 10; b++) {
      var barGeom = new THREE.BufferGeometry();
      var barPos = new Float32Array([
        -8 + b * 2, 0, 38,
        -8 + b * 2, 30, 38
      ]);
      barGeom.setAttribute('position', new THREE.BufferAttribute(barPos, 3));
      var barLine = new THREE.LineSegments(barGeom, new THREE.LineBasicMaterial({ color: 0x4a4a5e, linewidth: 3 }));
      addToScene(scene, barLine);
    }

    // Horizontal bars
    for (var hb = 0; hb < 6; hb++) {
      var hbarGeom = new THREE.BufferGeometry();
      var hbarPos = new Float32Array([
        -8, 5 + hb * 5, 38,
        8, 5 + hb * 5, 38
      ]);
      hbarGeom.setAttribute('position', new THREE.BufferAttribute(hbarPos, 3));
      var hbarLine = new THREE.LineSegments(hbarGeom, new THREE.LineBasicMaterial({ color: 0x4a4a5e, linewidth: 3 }));
      addToScene(scene, hbarLine);
    }

    // Gate decorative spikes on top
    for (var s = 0; s < 12; s++) {
      var spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 4, 4),
        createMaterial(0x2a2a3e, 1.0, 0x1a0000)
      );
      spike.position.set(-9 + s * 1.8, 31, 38);
      addToScene(scene, spike);
    }
  }

  function createCourtyard(scene) {
    // Main courtyard floor
    var courtyard = new THREE.Mesh(
      new THREE.BoxGeometry(70, 0.5, 70),
      createMaterial(0x0a0a14, 1.0, 0x000000)
    );
    courtyard.position.set(0, 0, 0);
    addToScene(scene, courtyard);

    // Dark stone tiles - visual detail with boxes
    for (var tx = -30; tx < 30; tx += 10) {
      for (var tz = -30; tz < 30; tz += 10) {
        var tile = new THREE.Mesh(
          new THREE.BoxGeometry(9, 0.3, 9),
          createMaterial(0x1a1a2e, 1.0, 0x050508)
        );
        tile.position.set(tx, 0.2, tz);
        addToScene(scene, tile);
      }
    }

    // Courtyard boundary walls
    var boundaryWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(80, 8, 2),
      createMaterial(0x0f0f1e, 1.0, 0x050508)
    );
    boundaryWall1.position.set(0, 4, -40);
    addToScene(scene, boundaryWall1);

    var boundaryWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(80, 8, 2),
      createMaterial(0x0f0f1e, 1.0, 0x050508)
    );
    boundaryWall2.position.set(0, 4, 40);
    addToScene(scene, boundaryWall2);

    var boundaryWall3 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 8, 80),
      createMaterial(0x0f0f1e, 1.0, 0x050508)
    );
    boundaryWall3.position.set(-40, 4, 0);
    addToScene(scene, boundaryWall3);

    var boundaryWall4 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 8, 80),
      createMaterial(0x0f0f1e, 1.0, 0x050508)
    );
    boundaryWall4.position.set(40, 4, 0);
    addToScene(scene, boundaryWall4);
  }

  function createObsidianFountains(scene) {
    var fountainPositions = [
      { x: -20, z: -15 },
      { x: 20, z: -15 },
      { x: 0, z: 15 }
    ];

    fountainPositions.forEach(function(pos) {
      // Basin
      var basin = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 6, 2, 16),
        createMaterial(0x0a0a0a, 1.0, 0x1a0a1a)
      );
      basin.position.set(pos.x, 1, pos.z);
      addToScene(scene, basin);

      // Center spout
      var spout = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1.5, 8, 12),
        createMaterial(0x0f0f1e, 1.0, 0x0a0a0f)
      );
      spout.position.set(pos.x, 5, pos.z);
      addToScene(scene, spout);

      // Water surface - animated
      var water = new THREE.Mesh(
        new THREE.CylinderGeometry(4.8, 4.8, 0.3, 16),
        createMaterial(0x0a0a14, 0.6, 0x1a0a2a)
      );
      water.position.set(pos.x, 2, pos.z);
      addToScene(scene, water);

      animatedMaterials.push({
        material: water.material,
        type: 'opacity',
        baseValue: 0.6,
        range: 0.2,
        speed: 1.5
      });

      animationData.push({
        object: water,
        type: 'fountainBob',
        baseY: 2,
        amplitude: 0.5,
        speed: 2.0
      });
    });
  }

  function createShadowSoldiers(scene) {
    var soldierPositions = [
      { x: -30, z: -25 },
      { x: 30, z: -25 },
      { x: -35, z: 0 },
      { x: 35, z: 0 },
      { x: -25, z: 30 },
      { x: 25, z: 30 }
    ];

    soldierPositions.forEach(function(pos) {
      // Body
      var body = new THREE.Mesh(
        new THREE.BoxGeometry(2, 6, 1.5),
        createMaterial(0x000000, 1.0, 0x0a0a0a)
      );
      body.position.set(pos.x, 3, pos.z);
      addToScene(scene, body);

      // Head
      var head = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        createMaterial(0x0a0a14, 1.0, 0x1a0a1a)
      );
      head.position.set(pos.x, 6.5, pos.z);
      addToScene(scene, head);

      // Arm left
      var armL = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 4, 0.6),
        createMaterial(0x0a0a0a, 1.0, 0x0a0a0a)
      );
      armL.position.set(pos.x - 1.5, 3.5, pos.z);
      addToScene(scene, armL);

      // Arm right
      var armR = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 4, 0.6),
        createMaterial(0x0a0a0a, 1.0, 0x0a0a0a)
      );
      armR.position.set(pos.x + 1.5, 3.5, pos.z);
      addToScene(scene, armR);

      // Leg left
      var legL = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 3, 0.6),
        createMaterial(0x000000, 1.0, 0x0a0a0a)
      );
      legL.position.set(pos.x - 0.7, 0.5, pos.z);
      addToScene(scene, legL);

      // Leg right
      var legR = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 3, 0.6),
        createMaterial(0x000000, 1.0, 0x0a0a0a)
      );
      legR.position.set(pos.x + 0.7, 0.5, pos.z);
      addToScene(scene, legR);
    });
  }

  function createSkullDecorations(scene) {
    var wallSpikes = [
      { x: -20, y: 20, z: -39 },
      { x: 0, y: 20, z: -39 },
      { x: 20, y: 20, z: -39 },
      { x: -20, y: 20, z: 39 },
      { x: 0, y: 20, z: 39 },
      { x: 20, y: 20, z: 39 },
      { x: -39, y: 20, z: -20 },
      { x: -39, y: 20, z: 0 },
      { x: -39, y: 20, z: 20 },
      { x: 39, y: 20, z: -20 },
      { x: 39, y: 20, z: 0 },
      { x: 39, y: 20, z: 20 }
    ];

    wallSpikes.forEach(function(pos) {
      // Spike
      var spike = new THREE.Mesh(
        new THREE.BoxGeometry(1, 4, 1),
        createMaterial(0x2a2a3e, 1.0, 0x1a0000)
      );
      spike.position.set(pos.x, pos.y, pos.z);
      addToScene(scene, spike);

      // Skull
      var skull = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8),
        createMaterial(0x1a1a1a, 1.0, 0x2a0a0a)
      );
      skull.position.set(pos.x, pos.y + 3.5, pos.z);
      addToScene(scene, skull);

      // Skull jaw recess
      var jawRecess = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.5, 0.8),
        createMaterial(0x0a0a0a, 1.0, 0x1a0a0a)
      );
      jawRecess.position.set(pos.x, pos.y + 2.8, pos.z);
      addToScene(scene, jawRecess);

      // Eye sockets
      var eyeL = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 6, 6),
        createMaterial(0x000000, 1.0, 0x1a0a1a)
      );
      eyeL.position.set(pos.x - 0.35, pos.y + 3.8, pos.z + 0.8);
      addToScene(scene, eyeL);

      var eyeR = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 6, 6),
        createMaterial(0x000000, 1.0, 0x1a0a1a)
      );
      eyeR.position.set(pos.x + 0.35, pos.y + 3.8, pos.z + 0.8);
      addToScene(scene, eyeR);
    });
  }

  function createBlackCrystalChandeliers(scene) {
    var chandelierPositions = [
      { x: -15, y: 25, z: 0 },
      { x: 15, y: 25, z: 0 },
      { x: 0, y: 25, z: -15 },
      { x: 0, y: 25, z: 15 }
    ];

    chandelierPositions.forEach(function(pos) {
      // Main fixture cylinder
      var fixture = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 1.5, 8),
        createMaterial(0x1a1a1a, 1.0, 0x0a0a0a)
      );
      fixture.position.set(pos.x, pos.y, pos.z);
      addToScene(scene, fixture);

      // Hanging chain links - LineSegments
      var chainGeom = new THREE.BufferGeometry();
      var chainPos = new Float32Array([
        pos.x, pos.y, pos.z,
        pos.x, pos.y - 8, pos.z
      ]);
      chainGeom.setAttribute('position', new THREE.BufferAttribute(chainPos, 3));
      var chainLine = new THREE.LineSegments(chainGeom, new THREE.LineBasicMaterial({ color: 0x0a0a0a, linewidth: 2 }));
      addToScene(scene, chainLine);

      // Crystal drops
      for (var cd = 0; cd < 12; cd++) {
        var angle = (cd / 12) * Math.PI * 2;
        var dropX = pos.x + Math.cos(angle) * 2.5;
        var dropZ = pos.z + Math.sin(angle) * 2.5;

        var drop = new THREE.Mesh(
          new THREE.SphereGeometry(0.4, 6, 6),
          createMaterial(0x0a0a14, 1.0, 0x1a0a2a)
        );
        drop.position.set(dropX, pos.y - 3 - cd * 0.3, dropZ);
        addToScene(scene, drop);

        animatedMaterials.push({
          material: drop.material,
          type: 'emissiveIntensity',
          baseValue: 0.2,
          range: 0.3,
          speed: 2.0,
          offset: cd * 0.1
        });
      }
    });
  }

  function createGrandStaircase(scene) {
    var stepCount = 12;
    var stepWidth = 16;

    for (var st = 0; st < stepCount; st++) {
      var step = new THREE.Mesh(
        new THREE.BoxGeometry(stepWidth, 1.2, 2.5),
        createMaterial(0x0f0f1e, 1.0, 0x0a0a0f)
      );
      step.position.set(0, st * 1.5, 30 - st * 2.5);
      addToScene(scene, step);

      // Step edge highlight
      var edgeGeom = new THREE.BufferGeometry();
      var edgePos = new Float32Array([
        -stepWidth / 2, st * 1.5 + 0.6, 30 - st * 2.5,
        stepWidth / 2, st * 1.5 + 0.6, 30 - st * 2.5
      ]);
      edgeGeom.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
      var edgeLine = new THREE.LineSegments(edgeGeom, new THREE.LineBasicMaterial({ color: 0x2a2a3e, linewidth: 2 }));
      addToScene(scene, edgeLine);
    }

    // Staircase railings
    for (var sr = 0; sr < stepCount; sr++) {
      var railL = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 2.5, 2.5),
        createMaterial(0x1a1a2e, 1.0, 0x0a0a0f)
      );
      railL.position.set(-stepWidth / 2 - 0.5, sr * 1.5 + 1.8, 30 - sr * 2.5);
      addToScene(scene, railL);

      var railR = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 2.5, 2.5),
        createMaterial(0x1a1a2e, 1.0, 0x0a0a0f)
      );
      railR.position.set(stepWidth / 2 + 0.5, sr * 1.5 + 1.8, 30 - sr * 2.5);
      addToScene(scene, railR);
    }
  }

  function createGargoyles(scene) {
    var gargoyleCorners = [
      { x: -35, z: -35 },
      { x: 35, z: -35 },
      { x: -35, z: 35 },
      { x: 35, z: 35 }
    ];

    gargoyleCorners.forEach(function(pos) {
      // Main body
      var gBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 4, 2),
        createMaterial(0x0a0a0a, 1.0, 0x0a0a0a)
      );
      gBody.position.set(pos.x, 30, pos.z);
      addToScene(scene, gBody);

      // Left wing
      var wingL = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 4, 6),
        createMaterial(0x000000, 1.0, 0x1a0a0a)
      );
      wingL.position.set(pos.x - 2, 31, pos.z);
      wingL.rotation.z = 0.8;
      addToScene(scene, wingL);

      // Right wing
      var wingR = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 4, 6),
        createMaterial(0x000000, 1.0, 0x1a0a0a)
      );
      wingR.position.set(pos.x + 2, 31, pos.z);
      wingR.rotation.z = -0.8;
      addToScene(scene, wingR);

      // Head
      var gHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 8, 8),
        createMaterial(0x1a1a1a, 1.0, 0x0a0a0f)
      );
      gHead.position.set(pos.x, 33, pos.z);
      addToScene(scene, gHead);

      // Horns
      var hornL = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 1.5, 4),
        createMaterial(0x0a0a14, 1.0, 0x1a0000)
      );
      hornL.position.set(pos.x - 0.5, 34, pos.z);
      addToScene(scene, hornL);

      var hornR = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 1.5, 4),
        createMaterial(0x0a0a14, 1.0, 0x1a0000)
      );
      hornR.position.set(pos.x + 0.5, 34, pos.z);
      addToScene(scene, hornR);
    });
  }

  function createDungeonEntrance(scene) {
    // Trap door
    var trapdoor = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.3, 6),
      createMaterial(0x0a0a0a, 1.0, 0x1a0a0a)
    );
    trapdoor.position.set(-15, 0.2, -20);
    addToScene(scene, trapdoor);

    // Entrance frame
    var frameL = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 6),
      createMaterial(0x1a1a2e, 1.0, 0x0a0a0f)
    );
    frameL.position.set(-15 - 3.25, 2, -20);
    addToScene(scene, frameL);

    var frameR = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 6),
      createMaterial(0x1a1a2e, 1.0, 0x0a0a0f)
    );
    frameR.position.set(-15 + 3.25, 2, -20);
    addToScene(scene, frameR);

    // Chains holding door
    for (var ch = 0; ch < 4; ch++) {
      var chainGeom = new THREE.BufferGeometry();
      var startX = -15 - 2 + ch * 1.5;
      var chainPos = new Float32Array([
        startX, 0.5, -20,
        startX, 3, -20
      ]);
      chainGeom.setAttribute('position', new THREE.BufferAttribute(chainPos, 3));
      var chainLine = new THREE.LineSegments(chainGeom, new THREE.LineBasicMaterial({ color: 0x2a2a3e, linewidth: 2 }));
      addToScene(scene, chainLine);
    }

    // Dark pit interior
    var pit = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 10, 12),
      createMaterial(0x000000, 1.0, 0x0a0a0a)
    );
    pit.position.set(-15, -5, -20);
    addToScene(scene, pit);
  }

  function createDarkGarden(scene) {
    var treePositions = [
      { x: -28, z: 25 },
      { x: -18, z: 28 },
      { x: -8, z: 26 },
      { x: 8, z: 28 },
      { x: 18, z: 25 },
      { x: 28, z: 27 }
    ];

    treePositions.forEach(function(pos) {
      // Dead tree trunk
      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.2, 12, 8),
        createMaterial(0x1a1a1a, 1.0, 0x0a0a0a)
      );
      trunk.position.set(pos.x, 6, pos.z);
      addToScene(scene, trunk);

      // Bare branch 1
      var branch1 = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 5, 6),
        createMaterial(0x0a0a0a, 1.0, 0x0a0a0a)
      );
      branch1.position.set(pos.x - 2, 10, pos.z);
      branch1.rotation.z = 0.5;
      addToScene(scene, branch1);

      // Bare branch 2
      var branch2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 5, 6),
        createMaterial(0x0a0a0a, 1.0, 0x0a0a0a)
      );
      branch2.position.set(pos.x + 2, 10, pos.z);
      branch2.rotation.z = -0.5;
      addToScene(scene, branch2);

      // Bare branch 3
      var branch3 = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 4.5, 6),
        createMaterial(0x0a0a0a, 1.0, 0x0a0a0a)
      );
      branch3.position.set(pos.x, 11.5, pos.z + 1.5);
      branch3.rotation.x = 0.4;
      addToScene(scene, branch3);

      // Bare branch 4
      var branch4 = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 4.5, 6),
        createMaterial(0x0a0a0a, 1.0, 0x0a0a0a)
      );
      branch4.position.set(pos.x, 11.5, pos.z - 1.5);
      branch4.rotation.x = -0.4;
      addToScene(scene, branch4);
    });
  }

  function createMoatOfShadow(scene) {
    // Moat pool surrounding palace
    var moat = new THREE.Mesh(
      new THREE.BoxGeometry(120, 2, 120),
      createMaterial(0x0a0a1a, 0.7, 0x1a0a3a)
    );
    moat.position.set(0, -1, 0);
    addToScene(scene, moat);

    animatedMaterials.push({
      material: moat.material,
      type: 'opacity',
      baseValue: 0.7,
      range: 0.15,
      speed: 0.8
    });

    // Moat boundary walls - inner
    var moatWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(120, 3, 2),
      createMaterial(0x0f0f1e, 1.0, 0x050508)
    );
    moatWall1.position.set(0, 1, -60);
    addToScene(scene, moatWall1);

    var moatWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(120, 3, 2),
      createMaterial(0x0f0f1e, 1.0, 0x050508)
    );
    moatWall2.position.set(0, 1, 60);
    addToScene(scene, moatWall2);

    var moatWall3 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3, 120),
      createMaterial(0x0f0f1e, 1.0, 0x050508)
    );
    moatWall3.position.set(-60, 1, 0);
    addToScene(scene, moatWall3);

    var moatWall4 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3, 120),
      createMaterial(0x0f0f1e, 1.0, 0x050508)
    );
    moatWall4.position.set(60, 1, 0);
    addToScene(scene, moatWall4);

    // Outer boundary walls for visual depth
    var outerWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(130, 4, 2),
      createMaterial(0x0a0a0a, 1.0, 0x000000)
    );
    outerWall1.position.set(0, 2, -65);
    addToScene(scene, outerWall1);

    var outerWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(130, 4, 2),
      createMaterial(0x0a0a0a, 1.0, 0x000000)
    );
    outerWall2.position.set(0, 2, 65);
    addToScene(scene, outerWall2);

    var outerWall3 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 130),
      createMaterial(0x0a0a0a, 1.0, 0x000000)
    );
    outerWall3.position.set(-65, 2, 0);
    addToScene(scene, outerWall3);

    var outerWall4 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 130),
      createMaterial(0x0a0a0a, 1.0, 0x000000)
    );
    outerWall4.position.set(65, 2, 0);
    addToScene(scene, outerWall4);
  }

  function addAdditionalArchitecture(scene) {
    // Supporting pillars
    for (var pi = 0; pi < 8; pi++) {
      var angle = (pi / 8) * Math.PI * 2;
      var pX = Math.cos(angle) * 22;
      var pZ = Math.sin(angle) * 22;

      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2, 35, 8),
        createMaterial(0x1a1a2e, 1.0, 0x0a0a0f)
      );
      pillar.position.set(pX, 17.5, pZ);
      addToScene(scene, pillar);
    }

    // Decorative arches
    for (var ar = 0; ar < 6; ar++) {
      var archX = -25 + ar * 10;
      var arch = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 0.5, 12),
        createMaterial(0x2a2a3e, 1.0, 0x0a0a14)
      );
      arch.rotation.z = Math.PI / 2;
      arch.position.set(archX, 22, -15);
      addToScene(scene, arch);
    }

    // Wall crevices and recesses
    for (var cr = 0; cr < 12; cr++) {
      var crevice = new THREE.Mesh(
        new THREE.BoxGeometry(2, 6, 0.8),
        createMaterial(0x000000, 1.0, 0x0a0a0a)
      );
      crevice.position.set(-20 + cr * 3.3, 15, -12.5);
      addToScene(scene, crevice);
    }

    // Shadow beams - LineSegments
    for (var sb = 0; sb < 16; sb++) {
      var beamAngle = (sb / 16) * Math.PI * 2;
      var beamLen = 35;

      var beamGeom = new THREE.BufferGeometry();
      var beamPos = new Float32Array([
        0, 25, 0,
        Math.cos(beamAngle) * beamLen, 25, Math.sin(beamAngle) * beamLen
      ]);
      beamGeom.setAttribute('position', new THREE.BufferAttribute(beamPos, 3));
      var beamLine = new THREE.LineSegments(beamGeom, new THREE.LineBasicMaterial({ color: 0x1a1a2e, linewidth: 1 }));
      addToScene(scene, beamLine);
    }
  }

  function init(scene, camera) {
    createPalaceFacade(scene);
    createGothicTowers(scene);
    createOrnateGate(scene);
    createCourtyard(scene);
    createObsidianFountains(scene);
    createShadowSoldiers(scene);
    createSkullDecorations(scene);
    createBlackCrystalChandeliers(scene);
    createGrandStaircase(scene);
    createGargoyles(scene);
    createDungeonEntrance(scene);
    createDarkGarden(scene);
    createMoatOfShadow(scene);
    addAdditionalArchitecture(scene);

    // Add ambient lighting for dark atmosphere
    var ambientLight = new THREE.AmbientLight(0x1a1a3a, 0.4);
    scene.add(ambientLight);

    // Add point lights for atmosphere
    var redLight = new THREE.PointLight(0x4a0a0a, 0.6, 80);
    redLight.position.set(-30, 20, -30);
    scene.add(redLight);

    var purpleLight = new THREE.PointLight(0x2a0a4a, 0.5, 70);
    purpleLight.position.set(30, 25, 20);
    scene.add(purpleLight);

    console.log('Shadow Palace initialized with', objects.length, 'geometry objects');
  }

  function update(delta) {
    // Animate shadow shimmer on walls
    animatedMaterials.forEach(function(anim) {
      if (anim.type === 'opacity') {
        var time = Date.now() * 0.001;
        var offset = anim.offset || 0;
        anim.material.opacity = anim.baseValue + Math.sin(time * anim.speed + offset) * anim.range;
      } else if (anim.type === 'emissiveIntensity') {
        var time = Date.now() * 0.001;
        var offset = anim.offset || 0;
        var intensity = Math.max(0, anim.baseValue + Math.sin(time * anim.speed + offset) * anim.range);
        anim.material.emissiveIntensity = intensity;
      }
    });

    // Animate fountain water and crystal drops
    animationData.forEach(function(anim) {
      if (anim.type === 'fountainBob') {
        var time = Date.now() * 0.001;
        anim.object.position.y = anim.baseY + Math.sin(time * anim.speed) * anim.amplitude;
      }
    });
  }

  function reset() {
    // Remove all objects from scene
    objects.forEach(function(obj) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
    });

    objects = [];
    animatedMaterials = [];
    animationData = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
