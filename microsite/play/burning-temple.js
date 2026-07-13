window.BurningTemple = (function() {
  'use strict';

  var sceneRef = null;
  var cameraRef = null;
  var objects = [];
  var particles = [];
  var fireEmitters = [];
  var smokeColumns = [];
  var time = 0;

  var COLORS = {
    charred: 0x2a2a2a,
    darkGray: 0x4a4a4a,
    mediumGray: 0x6a6a6a,
    lightGray: 0x8a8a8a,
    deepOrange: 0xff6600,
    brightOrange: 0xff8800,
    brightRed: 0xff2200,
    darkRed: 0xaa0000,
    smokeGray: 0x5a5a5a,
    darkSmoke: 0x3a3a3a
  };

  function createMaterial(color, emissive) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: 0.1,
      roughness: 0.9
    });
  }

  function addToScene(object) {
    sceneRef.add(object);
    objects.push(object);
    return object;
  }

  function createTempleMainStructure() {
    var group = new THREE.Group();

    // Base platform
    var baseGeom = new THREE.BoxGeometry(70, 4, 70);
    var baseMat = createMaterial(COLORS.charred, 0x1a0000);
    var baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.y = 2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // First tier
    var tier1Geom = new THREE.BoxGeometry(60, 6, 60);
    var tier1Mat = createMaterial(COLORS.darkGray, 0x220000);
    var tier1Mesh = new THREE.Mesh(tier1Geom, tier1Mat);
    tier1Mesh.position.y = 8;
    tier1Mesh.castShadow = true;
    tier1Mesh.receiveShadow = true;
    group.add(tier1Mesh);

    // Second tier
    var tier2Geom = new THREE.BoxGeometry(45, 5, 45);
    var tier2Mat = createMaterial(COLORS.mediumGray, 0x330000);
    var tier2Mesh = new THREE.Mesh(tier2Geom, tier2Mat);
    tier2Mesh.position.y = 16;
    tier2Mesh.castShadow = true;
    tier2Mesh.receiveShadow = true;
    group.add(tier2Mesh);

    // Third tier
    var tier3Geom = new THREE.BoxGeometry(30, 5, 30);
    var tier3Mat = createMaterial(COLORS.lightGray, 0x440000);
    var tier3Mesh = new THREE.Mesh(tier3Geom, tier3Mat);
    tier3Mesh.position.y = 24;
    tier3Mesh.castShadow = true;
    tier3Mesh.receiveShadow = true;
    group.add(tier3Mesh);

    // Top ornamental box
    var topGeom = new THREE.BoxGeometry(15, 4, 15);
    var topMat = createMaterial(COLORS.darkGray, 0x550000);
    var topMesh = new THREE.Mesh(topGeom, topMat);
    topMesh.position.y = 31;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    group.add(topMesh);

    return group;
  }

  function createBurningRoof() {
    var group = new THREE.Group();

    // Roof panels at 45-degree angles
    var panelPositions = [
      { x: 12, z: 12, rot: Math.PI / 4 },
      { x: -12, z: 12, rot: -Math.PI / 4 },
      { x: -12, z: -12, rot: Math.PI / 4 },
      { x: 12, z: -12, rot: -Math.PI / 4 }
    ];

    var firePositions = [
      { x: 10, y: 3, z: 10 },
      { x: -10, y: 3, z: 10 },
      { x: -10, y: 3, z: -10 },
      { x: 10, y: 3, z: -10 }
    ];

    panelPositions.forEach(function(pos) {
      var panelGeom = new THREE.BoxGeometry(12, 1.5, 12);
      var panelMat = createMaterial(COLORS.charred, 0x440000);
      var panelMesh = new THREE.Mesh(panelGeom, panelMat);
      panelMesh.position.set(pos.x, 33, pos.z);
      panelMesh.rotation.z = pos.rot;
      panelMesh.castShadow = true;
      panelMesh.receiveShadow = true;
      group.add(panelMesh);
    });

    firePositions.forEach(function(pos) {
      var fireCluster = createFireCluster(3, 2.5);
      fireCluster.position.set(pos.x, 33 + pos.y, pos.z);
      group.add(fireCluster);
      fireEmitters.push({
        group: fireCluster,
        intensity: 1.0,
        pulse: Math.random() * Math.PI
      });
    });

    return group;
  }

  function createFireCluster(radius, height) {
    var group = new THREE.Group();

    var sphereGeom = new THREE.SphereGeometry(radius, 8, 8);
    var fireMat = createMaterial(COLORS.brightRed, COLORS.brightRed);

    for (var i = 0; i < 4; i++) {
      var sphere = new THREE.Mesh(sphereGeom, fireMat.clone());
      var angle = (i / 4) * Math.PI * 2;
      sphere.position.x = Math.cos(angle) * (radius * 0.4);
      sphere.position.y = (i / 4) * height;
      sphere.position.z = Math.sin(angle) * (radius * 0.4);
      sphere.scale.set(0.8 + Math.random() * 0.3, 0.9 + Math.random() * 0.2, 0.8 + Math.random() * 0.3);
      sphere.castShadow = true;
      group.add(sphere);
    }

    return group;
  }

  function createCrumblingColumns() {
    var group = new THREE.Group();

    var columnPositions = [
      { x: -25, z: -25, tilt: 0, intact: true },
      { x: 25, z: -25, tilt: 0.3, intact: true },
      { x: 25, z: 25, tilt: 0, intact: true },
      { x: -25, z: 25, tilt: -0.2, intact: false },
      { x: 0, z: -30, tilt: 0.5, intact: false },
      { x: 30, z: 0, tilt: 0, intact: true },
      { x: -30, z: 0, tilt: -0.4, intact: false }
    ];

    columnPositions.forEach(function(pos) {
      if (pos.intact) {
        var colGeom = new THREE.CylinderGeometry(1.2, 1.5, 20, 8);
        var colMat = createMaterial(COLORS.mediumGray, 0x220000);
        var column = new THREE.Mesh(colGeom, colMat);
        column.position.set(pos.x, 12, pos.z);
        column.rotation.z = pos.tilt;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        // Column capital
        var capGeom = new THREE.CylinderGeometry(1.8, 1.2, 1.5, 8);
        var capMat = createMaterial(COLORS.darkGray, 0x330000);
        var capital = new THREE.Mesh(capGeom, capMat);
        capital.position.set(pos.x, 21.5, pos.z);
        capital.castShadow = true;
        group.add(capital);
      } else {
        // Collapsed column - rubble
        var rubbleCount = 4;
        for (var r = 0; r < rubbleCount; r++) {
          var rubbleGeom = new THREE.BoxGeometry(1.5 + Math.random() * 1, 2 + Math.random() * 2, 1 + Math.random() * 1.5);
          var rubbleMat = createMaterial(COLORS.darkGray, 0x110000);
          var rubble = new THREE.Mesh(rubbleGeom, rubbleMat);
          rubble.position.set(
            pos.x + (Math.random() - 0.5) * 4,
            2 + r * 1.5 + Math.random(),
            pos.z + (Math.random() - 0.5) * 4
          );
          rubble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
          rubble.castShadow = true;
          rubble.receiveShadow = true;
          group.add(rubble);
        }
      }
    });

    return group;
  }

  function createFirePits() {
    var group = new THREE.Group();

    var pitPositions = [
      { x: -35, z: -35 },
      { x: 35, z: -35 },
      { x: 35, z: 35 },
      { x: -35, z: 35 }
    ];

    pitPositions.forEach(function(pos) {
      // Pit rim
      var rimGeom = new THREE.CylinderGeometry(6, 7, 2, 16);
      var rimMat = createMaterial(COLORS.charred, 0x330000);
      var rim = new THREE.Mesh(rimGeom, rimMat);
      rim.position.set(pos.x, 3, pos.z);
      rim.castShadow = true;
      rim.receiveShadow = true;
      group.add(rim);

      // Large central fire sphere
      var centralFireGeom = new THREE.SphereGeometry(4.5, 12, 12);
      var centralFireMat = createMaterial(COLORS.brightOrange, COLORS.brightRed);
      var centralFire = new THREE.Mesh(centralFireGeom, centralFireMat);
      centralFire.position.set(pos.x, 6, pos.z);
      centralFire.castShadow = true;
      group.add(centralFire);

      // Surrounding fire spheres
      for (var f = 0; f < 5; f++) {
        var angle = (f / 5) * Math.PI * 2;
        var firedGeom = new THREE.SphereGeometry(2.5, 8, 8);
        var firedMat = createMaterial(COLORS.brightRed, COLORS.brightOrange);
        var fired = new THREE.Mesh(firedGeom, firedMat);
        fired.position.set(
          pos.x + Math.cos(angle) * 5,
          5 + Math.random() * 2,
          pos.z + Math.sin(angle) * 5
        );
        fired.castShadow = true;
        group.add(fired);
      }

      fireEmitters.push({
        group: group,
        intensity: 0.8,
        pulse: Math.random() * Math.PI
      });
    });

    return group;
  }

  function createBurningGates() {
    var group = new THREE.Group();

    var gatePositions = [
      { x: -40, y: 15, z: 0, rot: 0 },
      { x: 40, y: 15, z: 0, rot: 0 },
      { x: 0, y: 15, z: -40, rot: Math.PI / 2 },
      { x: 0, y: 15, z: 40, rot: Math.PI / 2 }
    ];

    gatePositions.forEach(function(pos) {
      // Gate frame
      var topFrameGeom = new THREE.BoxGeometry(8, 1, 0.5);
      var frameMat = createMaterial(COLORS.charred, 0x440000);
      var topFrame = new THREE.Mesh(topFrameGeom, frameMat);
      topFrame.position.set(pos.x, pos.y + 6, pos.z);
      topFrame.rotation.y = pos.rot;
      topFrame.castShadow = true;
      group.add(topFrame);

      var sideFrame1Geom = new THREE.BoxGeometry(0.5, 13, 0.5);
      var sideFrame1 = new THREE.Mesh(sideFrame1Geom, frameMat.clone());
      sideFrame1.position.set(pos.x - 4, pos.y, pos.z);
      sideFrame1.rotation.y = pos.rot;
      sideFrame1.castShadow = true;
      group.add(sideFrame1);

      var sideFrame2 = new THREE.Mesh(sideFrame1Geom, frameMat.clone());
      sideFrame2.position.set(pos.x + 4, pos.y, pos.z);
      sideFrame2.rotation.y = pos.rot;
      sideFrame2.castShadow = true;
      group.add(sideFrame2);

      // Gate bars as LineSegments
      var barMaterial = new THREE.LineBasicMaterial({ color: COLORS.charred, linewidth: 2 });
      var barGeometry = new THREE.BufferGeometry();
      var barPoints = [];

      for (var b = 0; b < 8; b++) {
        var barX = -3.5 + (b / 7) * 7;
        barPoints.push(
          new THREE.Vector3(pos.x + (pos.rot === 0 ? barX : 0), pos.y + 1, pos.z + (pos.rot === 0 ? 0 : barX)),
          new THREE.Vector3(pos.x + (pos.rot === 0 ? barX : 0), pos.y + 11, pos.z + (pos.rot === 0 ? 0 : barX))
        );
      }

      barGeometry.setFromPoints(barPoints);
      var barLines = new THREE.LineSegments(barGeometry, barMaterial);
      group.add(barLines);

      // Fire engulfing gate
      for (var g = 0; g < 4; g++) {
        var gateFireGeom = new THREE.SphereGeometry(1.5, 6, 6);
        var gateFireMat = createMaterial(COLORS.brightRed, COLORS.brightOrange);
        var gateFire = new THREE.Mesh(gateFireGeom, gateFireMat);
        gateFire.position.set(
          pos.x + (Math.random() - 0.5) * 6,
          pos.y + Math.random() * 10,
          pos.z + (Math.random() - 0.5) * 1
        );
        gateFire.castShadow = true;
        group.add(gateFire);
      }
    });

    return group;
  }

  function createSmokeColumns() {
    var group = new THREE.Group();

    var smokePositions = [
      { x: -35, z: -35 },
      { x: 35, z: -35 },
      { x: 35, z: 35 },
      { x: -35, z: 35 },
      { x: 0, z: 0 },
      { x: -20, z: 0 },
      { x: 20, z: 0 },
      { x: 0, z: -20 },
      { x: 0, z: 20 }
    ];

    smokePositions.forEach(function(pos) {
      var smokeGroup = new THREE.Group();
      smokeGroup.position.set(pos.x, 8, pos.z);

      for (var s = 0; s < 6; s++) {
        var smokeGeom = new THREE.SphereGeometry(2.5 + s * 0.8, 6, 6);
        var smokeMat = createMaterial(COLORS.smokeGray, COLORS.darkSmoke);
        smokeMat.transparent = true;
        smokeMat.opacity = 0.5 - (s * 0.08);
        var smoke = new THREE.Mesh(smokeGeom, smokeMat);
        smoke.position.y = s * 4;
        smokeGroup.add(smoke);
      }

      group.add(smokeGroup);
      smokeColumns.push({
        group: smokeGroup,
        baseHeight: 0,
        expandRate: 0.5 + Math.random() * 0.5,
        riseRate: 2 + Math.random() * 1.5
      });
    });

    return group;
  }

  function createCarvedReliefs() {
    var group = new THREE.Group();

    var reliefPositions = [
      { x: -32, z: 0, rot: 0 },
      { x: 32, z: 0, rot: 0 },
      { x: 0, z: -32, rot: Math.PI / 2 },
      { x: 0, z: 32, rot: Math.PI / 2 }
    ];

    reliefPositions.forEach(function(pos) {
      var reliefGeom = new THREE.BoxGeometry(6, 10, 0.8);
      var reliefMat = createMaterial(COLORS.mediumGray, 0x220000);
      var relief = new THREE.Mesh(reliefGeom, reliefMat);
      relief.position.set(pos.x, 10, pos.z);
      relief.rotation.y = pos.rot;
      relief.castShadow = true;
      relief.receiveShadow = true;
      group.add(relief);

      // Decorative inner panel
      var innerGeom = new THREE.BoxGeometry(4, 6, 0.4);
      var innerMat = createMaterial(COLORS.lightGray, 0x330000);
      var inner = new THREE.Mesh(innerGeom, innerMat);
      inner.position.set(pos.x + (Math.cos(pos.rot) * 0.3), 10, pos.z + (Math.sin(pos.rot) * 0.3));
      inner.rotation.y = pos.rot;
      inner.castShadow = true;
      group.add(inner);
    });

    return group;
  }

  function createOfferingPots() {
    var group = new THREE.Group();

    var potPositions = [
      { x: -15, z: -15 },
      { x: 15, z: -15 },
      { x: 15, z: 15 },
      { x: -15, z: 15 },
      { x: -8, z: 0 },
      { x: 8, z: 0 },
      { x: 0, z: -8 },
      { x: 0, z: 8 }
    ];

    potPositions.forEach(function(pos) {
      // Pot body
      var potGeom = new THREE.CylinderGeometry(1.5, 2, 3.5, 8);
      var potMat = createMaterial(COLORS.darkGray, 0x220000);
      var pot = new THREE.Mesh(potGeom, potMat);
      pot.position.set(pos.x, 2, pos.z);
      pot.castShadow = true;
      pot.receiveShadow = true;
      group.add(pot);

      // Pot rim
      var rimGeom = new THREE.CylinderGeometry(1.7, 1.5, 0.5, 8);
      var rimMat = createMaterial(COLORS.mediumGray, 0x330000);
      var rim = new THREE.Mesh(rimGeom, rimMat);
      rim.position.set(pos.x, 4.2, pos.z);
      rim.castShadow = true;
      group.add(rim);

      // Fire in pot
      var potFireGeom = new THREE.SphereGeometry(1.8, 8, 8);
      var potFireMat = createMaterial(COLORS.brightRed, COLORS.brightOrange);
      var potFire = new THREE.Mesh(potFireGeom, potFireMat);
      potFire.position.set(pos.x, 3.5, pos.z);
      potFire.castShadow = true;
      group.add(potFire);

      fireEmitters.push({
        group: group,
        intensity: 0.6,
        pulse: Math.random() * Math.PI
      });
    });

    return group;
  }

  function createRubblePath() {
    var group = new THREE.Group();

    // Path from front to temple
    for (var p = 0; p < 20; p++) {
      var rubbleGeom = new THREE.BoxGeometry(3 + Math.random() * 2, 0.8 + Math.random() * 0.5, 2 + Math.random() * 1.5);
      var rubbleMat = createMaterial(COLORS.darkGray, 0x110000);
      var rubble = new THREE.Mesh(rubbleGeom, rubbleMat);
      rubble.position.set(
        (Math.random() - 0.5) * 12,
        0.5,
        -40 + p * 4 + (Math.random() - 0.5) * 3
      );
      rubble.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      group.add(rubble);
    }

    return group;
  }

  function createStatueRemnants() {
    var group = new THREE.Group();

    var statuePositions = [
      { x: -20, z: -40 },
      { x: 20, z: -40 },
      { x: 20, z: 40 },
      { x: -20, z: 40 }
    ];

    statuePositions.forEach(function(pos) {
      // Torso
      var torsoGeom = new THREE.BoxGeometry(2, 4, 1.5);
      var torsoMat = createMaterial(COLORS.mediumGray, 0x220000);
      var torso = new THREE.Mesh(torsoGeom, torsoMat);
      torso.position.set(pos.x, 4, pos.z);
      torso.rotation.z = (Math.random() - 0.5) * 0.5;
      torso.castShadow = true;
      torso.receiveShadow = true;
      group.add(torso);

      // Head (displaced)
      var headGeom = new THREE.BoxGeometry(1.2, 1.8, 1.2);
      var headMat = createMaterial(COLORS.darkGray, 0x330000);
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.set(pos.x + (Math.random() - 0.5) * 3, 6, pos.z + (Math.random() - 0.5) * 2);
      head.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      head.castShadow = true;
      group.add(head);

      // Base fragments
      for (var f = 0; f < 3; f++) {
        var fragGeom = new THREE.BoxGeometry(1.5 + Math.random(), 0.6, 1.5 + Math.random());
        var fragMat = createMaterial(COLORS.lightGray, 0x110000);
        var frag = new THREE.Mesh(fragGeom, fragMat);
        frag.position.set(
          pos.x + (Math.random() - 0.5) * 4,
          0.4,
          pos.z + (Math.random() - 0.5) * 3
        );
        frag.rotation.y = Math.random() * Math.PI;
        frag.castShadow = true;
        frag.receiveShadow = true;
        group.add(frag);
      }
    });

    return group;
  }

  function createUndergroundCrypt() {
    var group = new THREE.Group();

    // Staircase descending
    for (var s = 0; s < 10; s++) {
      var stepGeom = new THREE.BoxGeometry(5, 0.8, 1.5);
      var stepMat = createMaterial(COLORS.charred, 0x000000);
      var step = new THREE.Mesh(stepGeom, stepMat);
      step.position.set(0, 8 - s * 1, -20 + s * 2.5);
      step.castShadow = true;
      step.receiveShadow = true;
      group.add(step);
    }

    // Crypt entrance frame
    var entranceGeom = new THREE.BoxGeometry(6, 12, 0.8);
    var entranceMat = createMaterial(COLORS.darkGray, 0x000000);
    var entrance = new THREE.Mesh(entranceGeom, entranceMat);
    entrance.position.set(0, 4, -35);
    entrance.castShadow = true;
    entrance.receiveShadow = true;
    group.add(entrance);

    // Crypt opening
    var cryptGeom = new THREE.BoxGeometry(5, 10, 2);
    var cryptMat = createMaterial(COLORS.charred, 0x000000);
    var crypt = new THREE.Mesh(cryptGeom, cryptMat);
    crypt.position.set(0, 5, -35);
    crypt.castShadow = true;
    group.add(crypt);

    return group;
  }

  function createFireExits() {
    var group = new THREE.Group();

    var exitPositions = [
      { x: -38, z: -15, rot: 0 },
      { x: -38, z: 15, rot: 0 },
      { x: 38, z: -15, rot: 0 },
      { x: 38, z: 15, rot: 0 },
      { x: -15, z: -38, rot: Math.PI / 2 },
      { x: 15, z: -38, rot: Math.PI / 2 },
      { x: -15, z: 38, rot: Math.PI / 2 },
      { x: 15, z: 38, rot: Math.PI / 2 }
    ];

    exitPositions.forEach(function(pos) {
      // Archway top
      var archGeom = new THREE.BoxGeometry(4, 1.5, 0.8);
      var archMat = createMaterial(COLORS.mediumGray, 0x220000);
      var arch = new THREE.Mesh(archGeom, archMat);
      arch.position.set(pos.x, 8.5, pos.z);
      arch.rotation.y = pos.rot;
      arch.castShadow = true;
      arch.receiveShadow = true;
      group.add(arch);

      // Left pillar
      var pillarGeom = new THREE.BoxGeometry(0.8, 8, 0.8);
      var pillarMat = createMaterial(COLORS.darkGray, 0x330000);
      var leftPillar = new THREE.Mesh(pillarGeom, pillarMat);
      leftPillar.position.set(pos.x - 2, 4, pos.z);
      leftPillar.rotation.y = pos.rot;
      leftPillar.castShadow = true;
      group.add(leftPillar);

      // Right pillar
      var rightPillar = new THREE.Mesh(pillarGeom, pillarMat.clone());
      rightPillar.position.set(pos.x + 2, 4, pos.z);
      rightPillar.rotation.y = pos.rot;
      rightPillar.castShadow = true;
      group.add(rightPillar);
    });

    return group;
  }

  function createEmberParticles() {
    var particleCount = 60;

    for (var e = 0; e < particleCount; e++) {
      var emberGeom = new THREE.SphereGeometry(0.15, 4, 4);
      var emberMat = createMaterial(COLORS.brightOrange, COLORS.deepOrange);
      var ember = new THREE.Mesh(emberGeom, emberMat);
      ember.position.set(
        (Math.random() - 0.5) * 70,
        Math.random() * 30,
        (Math.random() - 0.5) * 70
      );
      ember.castShadow = true;
      particles.push({
        mesh: ember,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          3 + Math.random() * 4,
          (Math.random() - 0.5) * 2
        ),
        life: Math.random() * 3 + 1,
        maxLife: Math.random() * 3 + 1,
        resetPosition: new THREE.Vector3(
          (Math.random() - 0.5) * 70,
          0,
          (Math.random() - 0.5) * 70
        )
      });
    }

    return particles;
  }

  function init(scene, camera) {
    sceneRef = scene;
    cameraRef = camera;
    objects = [];
    particles = [];
    fireEmitters = [];
    smokeColumns = [];
    time = 0;

    // Add main temple structure
    var temple = createTempleMainStructure();
    addToScene(temple);

    // Add burning roof
    var roof = createBurningRoof();
    addToScene(roof);

    // Add crumbling columns
    var columns = createCrumblingColumns();
    addToScene(columns);

    // Add fire pits
    var pits = createFirePits();
    addToScene(pits);

    // Add burning gates
    var gates = createBurningGates();
    addToScene(gates);

    // Add smoke columns
    var smoke = createSmokeColumns();
    addToScene(smoke);

    // Add carved reliefs
    var reliefs = createCarvedReliefs();
    addToScene(reliefs);

    // Add offering pots
    var pots = createOfferingPots();
    addToScene(pots);

    // Add rubble path
    var rubble = createRubblePath();
    addToScene(rubble);

    // Add statue remnants
    var statues = createStatueRemnants();
    addToScene(statues);

    // Add underground crypt
    var crypt = createUndergroundCrypt();
    addToScene(crypt);

    // Add fire exits
    var exits = createFireExits();
    addToScene(exits);

    // Add ember particles
    createEmberParticles();
    particles.forEach(function(particle) {
      addToScene(particle.mesh);
    });

    return {
      totalObjects: objects.length + particles.length,
      fireEmitters: fireEmitters.length,
      smokeColumns: smokeColumns.length
    };
  }

  function update(delta) {
    time += delta;

    // Animate fire pulsing
    fireEmitters.forEach(function(emitter) {
      emitter.pulse += delta * 3;
      var pulseValue = Math.sin(emitter.pulse) * 0.3 + 0.7;

      var children = emitter.group.children || [];
      children.forEach(function(child) {
        if (child.isMesh && child.material.emissive) {
          child.material.emissive.multiplyScalar(pulseValue);
          child.scale.multiplyScalar(0.98 + pulseValue * 0.02);
        }
      });
    });

    // Animate smoke columns expanding and rising
    smokeColumns.forEach(function(smokeCol) {
      smokeCol.baseHeight += delta * smokeCol.riseRate;

      var children = smokeCol.group.children || [];
      children.forEach(function(child, index) {
        if (child.isMesh) {
          child.position.y += delta * smokeCol.riseRate;
          child.scale.x += delta * smokeCol.expandRate * 0.1;
          child.scale.z += delta * smokeCol.expandRate * 0.1;
          child.material.opacity = Math.max(0, child.material.opacity - delta * 0.3);
        }
      });
    });

    // Animate ember particles
    particles.forEach(function(particle) {
      particle.life -= delta;

      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(delta)
      );

      var lifeRatio = particle.life / particle.maxLife;
      particle.mesh.material.opacity = lifeRatio;
      particle.mesh.scale.set(lifeRatio, lifeRatio, lifeRatio);

      // Reset particle when life expires
      if (particle.life <= 0) {
        particle.life = particle.maxLife;
        particle.mesh.position.copy(particle.resetPosition);
        particle.velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          3 + Math.random() * 4,
          (Math.random() - 0.5) * 2
        );
      }
    });

    // Update scene lighting based on fire intensity
    if (sceneRef.children.length > 0) {
      var lightIntensity = 0.4 + Math.sin(time * 1.5) * 0.15;
      var lights = sceneRef.children.filter(function(child) {
        return child.isLight;
      });
      lights.forEach(function(light) {
        if (light.intensity !== undefined) {
          light.intensity = lightIntensity;
        }
      });
    }
  }

  function reset() {
    // Remove all objects from scene
    objects.forEach(function(obj) {
      sceneRef.remove(obj);
    });

    // Remove all particles from scene
    particles.forEach(function(particle) {
      sceneRef.remove(particle.mesh);
    });

    // Clear arrays
    objects = [];
    particles = [];
    fireEmitters = [];
    smokeColumns = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
