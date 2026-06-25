window.BurningBridge = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var bridgeObjects = [];
  var fireParticles = [];
  var smokeColumns = [];
  var emberParticles = [];
  var animationState = {
    fireIntensity: 1.0,
    smokeRise: 0,
    emberDrift: 0
  };

  function init(sceneIn, cameraIn) {
    scene = sceneIn;
    camera = cameraIn;
    bridgeObjects = [];
    fireParticles = [];
    smokeColumns = [];
    emberParticles = [];
    animationState = {
      fireIntensity: 1.0,
      smokeRise: 0,
      emberDrift: 0
    };

    buildGorgeBridge();
    return true;
  }

  function buildGorgeBridge() {
    // Create gorge cliff walls
    createGorgeWalls();

    // Create river far below
    createRiver();

    // Create main stone bridge structure
    createMainBridge();

    // Create bridge support arches
    createBridgeArches();

    // Create collapsed section
    createCollapsedSection();

    // Create gatehouse towers at bridge ends
    createGatehouses();

    // Create siege engines (destroyed)
    createSiegeEngines();

    // Create burning wooden structures
    createBurningWoodStructures();

    // Create stone barriers on bridge
    createStoneBarriers();

    // Create fallen defenders (bodies)
    createFallenDefenders();

    // Create rope bridges as alternative routes
    createRopeBridges();

    // Create large fire sections along bridge
    createFireSections();

    // Create fire arrows lodged in structure
    createFireArrows();

    // Create smoke columns
    createSmokeColumns();
  }

  function createGorgeWalls() {
    // Left gorge wall
    var leftWallGeo = new THREE.BoxGeometry(15, 60, 8);
    var stoneMatBrown = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.9,
      metalness: 0.0
    });
    var leftWall = new THREE.Mesh(leftWallGeo, stoneMatBrown);
    leftWall.position.set(-45, -20, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    bridgeObjects.push(leftWall);

    // Right gorge wall
    var rightWallGeo = new THREE.BoxGeometry(15, 60, 8);
    var rightWall = new THREE.Mesh(rightWallGeo, stoneMatBrown);
    rightWall.position.set(45, -20, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    bridgeObjects.push(rightWall);

    // Back wall far end
    var backWallGeo = new THREE.BoxGeometry(100, 50, 10);
    var backWall = new THREE.Mesh(backWallGeo, stoneMatBrown);
    backWall.position.set(0, -15, -50);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);
    bridgeObjects.push(backWall);

    // Add more detailed gorge walls with layered boxes
    for (var i = 0; i < 8; i++) {
      var wallSegGeo = new THREE.BoxGeometry(12, 8, 6);
      var wallSeg = new THREE.Mesh(wallSegGeo, stoneMatBrown);
      wallSeg.position.set(-45, -35 + (i * 8), 0);
      scene.add(wallSeg);
      bridgeObjects.push(wallSeg);

      var wallSeg2Geo = new THREE.BoxGeometry(12, 8, 6);
      var wallSeg2 = new THREE.Mesh(wallSeg2Geo, stoneMatBrown);
      wallSeg2.position.set(45, -35 + (i * 8), 0);
      scene.add(wallSeg2);
      bridgeObjects.push(wallSeg2);
    }
  }

  function createRiver() {
    // River surface far below
    var riverGeo = new THREE.BoxGeometry(95, 2, 80);
    var riverMat = new THREE.MeshStandardMaterial({
      color: 0x1a4d7a,
      roughness: 0.4,
      metalness: 0.3
    });
    var river = new THREE.Mesh(riverGeo, riverMat);
    river.position.set(0, -65, 0);
    river.receiveShadow = true;
    scene.add(river);
    bridgeObjects.push(river);

    // River depth sections
    for (var i = 0; i < 5; i++) {
      var depthGeo = new THREE.BoxGeometry(95, 8, 80);
      var depthMat = new THREE.MeshStandardMaterial({
        color: 0x0d2840,
        roughness: 0.8,
        metalness: 0.1
      });
      var depthMesh = new THREE.Mesh(depthGeo, depthMat);
      depthMesh.position.set(0, -73 + (i * -8), 0);
      scene.add(depthMesh);
      bridgeObjects.push(depthMesh);
    }
  }

  function createMainBridge() {
    // Main bridge deck - long stone platform
    var deckGeo = new THREE.BoxGeometry(70, 3, 6);
    var stoneMatGray = new THREE.MeshStandardMaterial({
      color: 0x8b8b7a,
      roughness: 0.85,
      metalness: 0.0
    });
    var deck = new THREE.Mesh(deckGeo, stoneMatGray);
    deck.position.set(0, 0, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    bridgeObjects.push(deck);

    // Add stone blocks along deck
    for (var i = 0; i < 35; i++) {
      var blockGeo = new THREE.BoxGeometry(2, 3, 6);
      var block = new THREE.Mesh(blockGeo, stoneMatGray);
      block.position.set(-34 + (i * 2), 0, 0);
      block.castShadow = true;
      block.receiveShadow = true;
      scene.add(block);
      bridgeObjects.push(block);
    }

    // Side railings - left
    for (var i = 0; i < 35; i++) {
      var railGeo = new THREE.BoxGeometry(2, 2.5, 0.5);
      var rail = new THREE.Mesh(railGeo, stoneMatGray);
      rail.position.set(-34 + (i * 2), 2, -3.25);
      rail.castShadow = true;
      scene.add(rail);
      bridgeObjects.push(rail);
    }

    // Side railings - right
    for (var i = 0; i < 35; i++) {
      var railGeo2 = new THREE.BoxGeometry(2, 2.5, 0.5);
      var rail2 = new THREE.Mesh(railGeo2, stoneMatGray);
      rail2.position.set(-34 + (i * 2), 2, 3.25);
      rail2.castShadow = true;
      scene.add(rail2);
      bridgeObjects.push(rail2);
    }
  }

  function createBridgeArches() {
    // Support arches underneath bridge using cylinders
    for (var i = 0; i < 5; i++) {
      var archGeo = new THREE.CylinderGeometry(8, 8, 6, 16);
      var archMat = new THREE.MeshStandardMaterial({
        color: 0x7a7a69,
        roughness: 0.8,
        metalness: 0.0
      });
      var arch = new THREE.Mesh(archGeo, archMat);
      arch.rotation.z = Math.PI / 2;
      arch.position.set(-28 + (i * 14), -8, 0);
      arch.castShadow = true;
      arch.receiveShadow = true;
      scene.add(arch);
      bridgeObjects.push(arch);

      // Support pillars under arches
      var pillarGeo = new THREE.CylinderGeometry(3, 4, 20, 8);
      var pillar = new THREE.Mesh(pillarGeo, archMat);
      pillar.position.set(-28 + (i * 14), -20, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      bridgeObjects.push(pillar);
    }

    // Additional arch details
    for (var i = 0; i < 10; i++) {
      var detailGeo = new THREE.CylinderGeometry(2.5, 2.5, 8, 8);
      var detail = new THREE.Mesh(detailGeo, new THREE.MeshStandardMaterial({
        color: 0x696959,
        roughness: 0.85,
        metalness: 0.0
      }));
      detail.rotation.z = Math.PI / 2;
      detail.position.set(-32 + (i * 7), -10, -2);
      scene.add(detail);
      bridgeObjects.push(detail);
    }
  }

  function createCollapsedSection() {
    // Collapsed bridge pieces - angled boxes hanging down
    var collapsedGeo1 = new THREE.BoxGeometry(12, 3, 6);
    var collapsedMat = new THREE.MeshStandardMaterial({
      color: 0x8b8b7a,
      roughness: 0.85,
      metalness: 0.0
    });
    var collapsed1 = new THREE.Mesh(collapsedGeo1, collapsedMat);
    collapsed1.position.set(20, -8, 0);
    collapsed1.rotation.z = 0.5;
    collapsed1.castShadow = true;
    scene.add(collapsed1);
    bridgeObjects.push(collapsed1);

    var collapsedGeo2 = new THREE.BoxGeometry(10, 3, 6);
    var collapsed2 = new THREE.Mesh(collapsedGeo2, collapsedMat);
    collapsed2.position.set(28, -15, 1.5);
    collapsed2.rotation.z = -0.4;
    collapsed2.castShadow = true;
    scene.add(collapsed2);
    bridgeObjects.push(collapsed2);

    var collapsedGeo3 = new THREE.BoxGeometry(8, 3, 6);
    var collapsed3 = new THREE.Mesh(collapsedGeo3, collapsedMat);
    collapsed3.position.set(35, -22, -1);
    collapsed3.rotation.z = 0.6;
    collapsed3.castShadow = true;
    scene.add(collapsed3);
    bridgeObjects.push(collapsed3);

    // Hanging rubble
    for (var i = 0; i < 8; i++) {
      var rubbleGeo = new THREE.BoxGeometry(2 + Math.random() * 2, 2, 2);
      var rubble = new THREE.Mesh(rubbleGeo, collapsedMat);
      rubble.position.set(15 + (i * 3), -12 - (i * 2), Math.random() * 4 - 2);
      rubble.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
      scene.add(rubble);
      bridgeObjects.push(rubble);
    }
  }

  function createGatehouses() {
    // Left gatehouse
    var leftTowerGeo = new THREE.BoxGeometry(8, 18, 8);
    var stoneMat = new THREE.MeshStandardMaterial({
      color: 0x9a9a8a,
      roughness: 0.8,
      metalness: 0.0
    });
    var leftTower = new THREE.Mesh(leftTowerGeo, stoneMat);
    leftTower.position.set(-38, 6, 0);
    leftTower.castShadow = true;
    leftTower.receiveShadow = true;
    scene.add(leftTower);
    bridgeObjects.push(leftTower);

    // Left tower crenellations
    for (var i = 0; i < 4; i++) {
      var creGeo = new THREE.BoxGeometry(2, 2, 2);
      var cre = new THREE.Mesh(creGeo, stoneMat);
      cre.position.set(-38, 16 + (i * 2.5), 0);
      scene.add(cre);
      bridgeObjects.push(cre);
    }

    // Left tower arrow slits
    for (var i = 0; i < 6; i++) {
      var slitGeo = new THREE.BoxGeometry(0.5, 1.5, 0.5);
      var slit = new THREE.Mesh(slitGeo, new THREE.MeshStandardMaterial({ color: 0x1a1a0a }));
      slit.position.set(-38, 2 + (i * 2.5), 4);
      scene.add(slit);
      bridgeObjects.push(slit);
    }

    // Right gatehouse
    var rightTowerGeo = new THREE.BoxGeometry(8, 18, 8);
    var rightTower = new THREE.Mesh(rightTowerGeo, stoneMat);
    rightTower.position.set(38, 6, 0);
    rightTower.castShadow = true;
    rightTower.receiveShadow = true;
    scene.add(rightTower);
    bridgeObjects.push(rightTower);

    // Right tower crenellations
    for (var i = 0; i < 4; i++) {
      var creGeo2 = new THREE.BoxGeometry(2, 2, 2);
      var cre2 = new THREE.Mesh(creGeo2, stoneMat);
      cre2.position.set(38, 16 + (i * 2.5), 0);
      scene.add(cre2);
      bridgeObjects.push(cre2);
    }

    // Right tower arrow slits
    for (var i = 0; i < 6; i++) {
      var slitGeo2 = new THREE.BoxGeometry(0.5, 1.5, 0.5);
      var slit2 = new THREE.Mesh(slitGeo2, new THREE.MeshStandardMaterial({ color: 0x1a1a0a }));
      slit2.position.set(38, 2 + (i * 2.5), 4);
      scene.add(slit2);
      bridgeObjects.push(slit2);
    }

    // Tower gates
    var leftGateGeo = new THREE.BoxGeometry(6, 8, 1);
    var gateMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.9,
      metalness: 0.1
    });
    var leftGate = new THREE.Mesh(leftGateGeo, gateMat);
    leftGate.position.set(-38, 2, 4.5);
    scene.add(leftGate);
    bridgeObjects.push(leftGate);

    var rightGateGeo = new THREE.BoxGeometry(6, 8, 1);
    var rightGate = new THREE.Mesh(rightGateGeo, gateMat);
    rightGate.position.set(38, 2, 4.5);
    scene.add(rightGate);
    bridgeObjects.push(rightGate);
  }

  function createSiegeEngines() {
    // Destroyed trebuchet on left side
    var trebuchetBaseGeo = new THREE.BoxGeometry(10, 2, 8);
    var woodMat = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.8,
      metalness: 0.0
    });
    var trebuchetBase = new THREE.Mesh(trebuchetBaseGeo, woodMat);
    trebuchetBase.position.set(-25, 0, -8);
    scene.add(trebuchetBase);
    bridgeObjects.push(trebuchetBase);

    // Trebuchet frame pieces (broken)
    for (var i = 0; i < 4; i++) {
      var frameGeo = new THREE.BoxGeometry(1, 8 - (i * 1.5), 1);
      var frame = new THREE.Mesh(frameGeo, woodMat);
      frame.position.set(-22 + (i * 3), 3, -8);
      frame.rotation.z = 0.3 + (i * 0.2);
      scene.add(frame);
      bridgeObjects.push(frame);
    }

    // Catapult on right side (destroyed)
    var catBaseGeo = new THREE.BoxGeometry(8, 2, 6);
    var catBase = new THREE.Mesh(catBaseGeo, woodMat);
    catBase.position.set(25, 0, -7);
    scene.add(catBase);
    bridgeObjects.push(catBase);

    // Catapult arm (broken)
    var catArmGeo = new THREE.BoxGeometry(1, 6, 1);
    var catArm = new THREE.Mesh(catArmGeo, woodMat);
    catArm.position.set(25, 4, -7);
    catArm.rotation.z = 1.2;
    scene.add(catArm);
    bridgeObjects.push(catArm);

    // Catapult support pieces
    for (var i = 0; i < 3; i++) {
      var supportGeo = new THREE.BoxGeometry(1, 4, 1);
      var support = new THREE.Mesh(supportGeo, woodMat);
      support.position.set(20 + (i * 3), 2, -7);
      support.rotation.z = 0.4;
      scene.add(support);
      bridgeObjects.push(support);
    }
  }

  function createBurningWoodStructures() {
    // Wooden platforms with fire on bridge
    var woodMat = new THREE.MeshStandardMaterial({
      color: 0x6b4a2a,
      roughness: 0.8,
      metalness: 0.0
    });

    // Platform section 1
    for (var i = 0; i < 3; i++) {
      var platformGeo = new THREE.BoxGeometry(6, 2, 4);
      var platform = new THREE.Mesh(platformGeo, woodMat);
      platform.position.set(-15 + (i * 8), 1.5, 0);
      scene.add(platform);
      bridgeObjects.push(platform);

      // Wood beams
      var beamGeo = new THREE.BoxGeometry(6, 1, 0.5);
      var beam = new THREE.Mesh(beamGeo, woodMat);
      beam.position.set(-15 + (i * 8), 3.5, 0);
      scene.add(beam);
      bridgeObjects.push(beam);
    }

    // Platform section 2
    for (var i = 0; i < 2; i++) {
      var platformGeo2 = new THREE.BoxGeometry(5, 2, 4);
      var platform2 = new THREE.Mesh(platformGeo2, woodMat);
      platform2.position.set(5 + (i * 10), 1.5, 0);
      scene.add(platform2);
      bridgeObjects.push(platform2);
    }

    // Wooden defensive barricades
    for (var i = 0; i < 4; i++) {
      var barricadeGeo = new THREE.BoxGeometry(3, 3, 1.5);
      var barricade = new THREE.Mesh(barricadeGeo, woodMat);
      barricade.position.set(-30 + (i * 10), 2, 4);
      scene.add(barricade);
      bridgeObjects.push(barricade);
    }
  }

  function createStoneBarriers() {
    // Stone barrier blocks across bridge
    var barrierMat = new THREE.MeshStandardMaterial({
      color: 0x8a7a6a,
      roughness: 0.85,
      metalness: 0.0
    });

    // Barrier section 1 (left)
    for (var i = 0; i < 3; i++) {
      var barrierGeo = new THREE.BoxGeometry(4, 2.5, 2);
      var barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrier.position.set(-30, 1, 2.5 + (i * 1.5));
      scene.add(barrier);
      bridgeObjects.push(barrier);
    }

    // Barrier section 2 (center)
    for (var i = 0; i < 3; i++) {
      var barrierGeo2 = new THREE.BoxGeometry(4, 2.5, 2);
      var barrier2 = new THREE.Mesh(barrierGeo2, barrierMat);
      barrier2.position.set(0, 1, -2.5 - (i * 1.5));
      scene.add(barrier2);
      bridgeObjects.push(barrier2);
    }

    // Barrier section 3 (right)
    for (var i = 0; i < 2; i++) {
      var barrierGeo3 = new THREE.BoxGeometry(4, 2.5, 2);
      var barrier3 = new THREE.Mesh(barrierGeo3, barrierMat);
      barrier3.position.set(30, 1, 1 + (i * 2));
      scene.add(barrier3);
      bridgeObjects.push(barrier3);
    }
  }

  function createFallenDefenders() {
    // Fallen defenders represented as simple box shapes
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x4a3a2a,
      roughness: 0.9,
      metalness: 0.0
    });

    var bodyPositions = [
      { pos: [-20, 2, 2], rot: [0.3, 0.2, 0.1] },
      { pos: [-10, 2, -1.5], rot: [0.5, 0.1, 0.3] },
      { pos: [5, 2, 2.5], rot: [-0.2, 0.4, 0.2] },
      { pos: [15, 2, -2], rot: [0.4, 0.3, -0.1] },
      { pos: [25, 2, 1], rot: [0.3, -0.2, 0.2] },
      { pos: [-5, 2, 1], rot: [0.2, 0.5, 0.1] },
      { pos: [12, 2, 2], rot: [0.1, 0.2, 0.4] },
      { pos: [-28, 2, -1.5], rot: [0.6, 0.1, 0.2] },
      { pos: [30, 2, -1], rot: [0.3, 0.3, 0.1] },
      { pos: [-12, 2, 1.5], rot: [0.4, 0.2, 0.3] }
    ];

    for (var i = 0; i < bodyPositions.length; i++) {
      var bodyGeo = new THREE.BoxGeometry(1.5, 0.8, 2);
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(bodyPositions[i].pos[0], bodyPositions[i].pos[1], bodyPositions[i].pos[2]);
      body.rotation.set(bodyPositions[i].rot[0], bodyPositions[i].rot[1], bodyPositions[i].rot[2]);
      scene.add(body);
      bridgeObjects.push(body);

      // Head
      var headGeo = new THREE.SphereGeometry(0.4, 8, 8);
      var head = new THREE.Mesh(headGeo, bodyMat);
      head.position.set(bodyPositions[i].pos[0], bodyPositions[i].pos[1] + 0.8, bodyPositions[i].pos[2]);
      scene.add(head);
      bridgeObjects.push(head);
    }
  }

  function createRopeBridges() {
    // Rope bridges as alternative routes using LineSegments
    var ropePoints = [];

    // Rope bridge 1 (left side from -35 to -25 at higher altitude)
    ropePoints = [
      new THREE.Vector3(-35, 5, -4),
      new THREE.Vector3(-32, 4, -4),
      new THREE.Vector3(-29, 3.5, -4),
      new THREE.Vector3(-25, 5, -4)
    ];
    createRopeSegments(ropePoints);

    // Rope bridge 2 (right side from 25 to 35)
    ropePoints = [
      new THREE.Vector3(25, 5, 4),
      new THREE.Vector3(28, 4, 4),
      new THREE.Vector3(31, 3.5, 4),
      new THREE.Vector3(35, 5, 4)
    ];
    createRopeSegments(ropePoints);

    // Rope bridge 3 (center diagonal)
    ropePoints = [
      new THREE.Vector3(-30, 6, 0),
      new THREE.Vector3(-20, 5, 0),
      new THREE.Vector3(-10, 4.5, 0),
      new THREE.Vector3(0, 4, 0),
      new THREE.Vector3(10, 4.5, 0),
      new THREE.Vector3(20, 5, 0),
      new THREE.Vector3(30, 6, 0)
    ];
    createRopeSegments(ropePoints);

    // Additional rope supports
    for (var i = 0; i < 12; i++) {
      var supportPoints = [
        new THREE.Vector3(-35 + (i * 6), 5, -4),
        new THREE.Vector3(-35 + (i * 6), 1, -4)
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(supportPoints);
      var line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xb8860b }));
      scene.add(line);
      bridgeObjects.push(line);
    }
  }

  function createRopeSegments(points) {
    for (var i = 0; i < points.length - 1; i++) {
      var segmentPoints = [points[i], points[i + 1]];
      var geometry = new THREE.BufferGeometry().setFromPoints(segmentPoints);
      var line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xb8860b, linewidth: 3 }));
      scene.add(line);
      bridgeObjects.push(line);
    }
  }

  function createFireSections() {
    // Large fire clusters along bridge using SphereGeometry
    var firePositions = [
      -25, -15, -5, 5, 15, 25
    ];

    for (var i = 0; i < firePositions.length; i++) {
      createFireCluster(firePositions[i], 2.5);
    }
  }

  function createFireCluster(xPos, zOffset) {
    var fireMat = new THREE.MeshStandardMaterial({
      color: 0xff6b1a,
      emissive: 0xff4500,
      emissiveIntensity: 1.2,
      roughness: 0.5,
      metalness: 0.0
    });

    // Main fire sphere
    var fireGeo = new THREE.SphereGeometry(3, 12, 12);
    var fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.set(xPos, 4, zOffset);
    fire.castShadow = true;
    scene.add(fire);
    bridgeObjects.push(fire);
    fireParticles.push({
      mesh: fire,
      originalY: 4,
      bobAmount: 0.5,
      bobSpeed: 2 + Math.random()
    });

    // Secondary flames
    for (var i = 0; i < 3; i++) {
      var secondaryGeo = new THREE.SphereGeometry(1.5 + Math.random(), 10, 10);
      var secondary = new THREE.Mesh(secondaryGeo, new THREE.MeshStandardMaterial({
        color: 0xff8c00,
        emissive: 0xff6b1a,
        emissiveIntensity: 1.0,
        roughness: 0.6,
        metalness: 0.0
      }));
      secondary.position.set(xPos + (Math.random() - 0.5) * 4, 3 + Math.random() * 3, zOffset + (Math.random() - 0.5) * 2);
      scene.add(secondary);
      bridgeObjects.push(secondary);
      fireParticles.push({
        mesh: secondary,
        originalY: secondary.position.y,
        bobAmount: 0.3,
        bobSpeed: 3 + Math.random()
      });
    }

    // Tertiary small fire balls
    for (var i = 0; i < 4; i++) {
      var tertiaryGeo = new THREE.SphereGeometry(0.8 + Math.random() * 0.5, 8, 8);
      var tertiary = new THREE.Mesh(tertiaryGeo, new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff8c00,
        emissiveIntensity: 0.9,
        roughness: 0.7,
        metalness: 0.0
      }));
      tertiary.position.set(xPos + (Math.random() - 0.5) * 5, 2 + Math.random() * 4, zOffset + (Math.random() - 0.5) * 3);
      scene.add(tertiary);
      bridgeObjects.push(tertiary);
      fireParticles.push({
        mesh: tertiary,
        originalY: tertiary.position.y,
        bobAmount: 0.2,
        bobSpeed: 4 + Math.random()
      });
    }
  }

  function createFireArrows() {
    // Fire arrows lodged in bridge structure using SphereGeometry
    var arrowPositions = [
      { pos: [-20, 3, 2.5], rot: [0.2, 0.3, 0.1] },
      { pos: [-8, 3.5, -2], rot: [0.1, 0.5, 0.2] },
      { pos: [3, 2.8, 3], rot: [0.4, 0.2, 0.15] },
      { pos: [18, 3.2, -1.5], rot: [0.3, 0.4, 0.05] },
      { pos: [-35, 4, 0], rot: [0.2, 0.1, 0.3] },
      { pos: [32, 3, 2], rot: [0.15, 0.35, 0.2] },
      { pos: [10, 3.5, 1], rot: [0.25, 0.15, 0.25] }
    ];

    for (var i = 0; i < arrowPositions.length; i++) {
      var arrowFireGeo = new THREE.SphereGeometry(0.6, 8, 8);
      var arrowFireMat = new THREE.MeshStandardMaterial({
        color: 0xff7700,
        emissive: 0xff5500,
        emissiveIntensity: 1.1,
        roughness: 0.6,
        metalness: 0.0
      });
      var arrowFire = new THREE.Mesh(arrowFireGeo, arrowFireMat);
      arrowFire.position.set(arrowPositions[i].pos[0], arrowPositions[i].pos[1], arrowPositions[i].pos[2]);
      arrowFire.rotation.set(arrowPositions[i].rot[0], arrowPositions[i].rot[1], arrowPositions[i].rot[2]);
      scene.add(arrowFire);
      bridgeObjects.push(arrowFire);

      // Arrow shaft
      var shaftGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 6);
      var shaftMat = new THREE.MeshStandardMaterial({
        color: 0x4a3a2a,
        roughness: 0.8,
        metalness: 0.0
      });
      var shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(arrowPositions[i].pos[0], arrowPositions[i].pos[1] - 1, arrowPositions[i].pos[2]);
      shaft.rotation.set(arrowPositions[i].rot[0], arrowPositions[i].rot[1], arrowPositions[i].rot[2]);
      scene.add(shaft);
      bridgeObjects.push(shaft);
    }
  }

  function createSmokeColumns() {
    // Smoke columns rising from fire using CylinderGeometry base with SphereGeometry smoke
    var smokeBasePositions = [
      -25, -15, -5, 5, 15, 25
    ];

    for (var i = 0; i < smokeBasePositions.length; i++) {
      createSmokeColumn(smokeBasePositions[i], 2.5);
    }
  }

  function createSmokeColumn(xPos, zOffset) {
    // Smoke base cylinder
    var smokeBaseMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.6
    });

    // Base cylinder
    var baseGeo = new THREE.CylinderGeometry(2, 2, 0.5, 8);
    var base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.95,
      metalness: 0.0
    }));
    base.position.set(xPos, 5, zOffset);
    scene.add(base);
    bridgeObjects.push(base);

    // Smoke particles - spheres
    for (var i = 0; i < 8; i++) {
      var smokeGeo = new THREE.SphereGeometry(1.2 + Math.random() * 0.8, 8, 8);
      var smoke = new THREE.Mesh(smokeGeo, new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.95,
        metalness: 0.0,
        transparent: true,
        opacity: 0.5
      }));
      smoke.position.set(
        xPos + (Math.random() - 0.5) * 3,
        6 + i * 1.5,
        zOffset + (Math.random() - 0.5) * 3
      );
      scene.add(smoke);
      bridgeObjects.push(smoke);
      smokeColumns.push({
        mesh: smoke,
        baseY: 6 + i * 1.5,
        riseSpeed: 0.3 + Math.random() * 0.5,
        maxRise: 8 + Math.random() * 4,
        drift: Math.random() * 0.5 - 0.25
      });
    }
  }

  function update(delta) {
    // Update animation state
    animationState.fireIntensity = 0.8 + Math.sin(Date.now() * 0.002) * 0.2;
    animationState.smokeRise += delta * 0.3;
    animationState.emberDrift += delta * 0.5;

    // Animate fire - bobbing and flickering
    for (var i = 0; i < fireParticles.length; i++) {
      var fire = fireParticles[i];
      var bobOffset = Math.sin(Date.now() * 0.001 * fire.bobSpeed) * fire.bobAmount;
      fire.mesh.position.y = fire.originalY + bobOffset;

      // Flicker intensity
      if (fire.mesh.material && fire.mesh.material.emissiveIntensity) {
        fire.mesh.material.emissiveIntensity = 0.8 + Math.random() * 0.4;
      }
    }

    // Animate smoke columns rising
    for (var i = 0; i < smokeColumns.length; i++) {
      var smoke = smokeColumns[i];
      var riseAmount = (animationState.smokeRise * smoke.riseSpeed) % smoke.maxRise;
      smoke.mesh.position.y = smoke.baseY + riseAmount;
      smoke.mesh.position.x += smoke.drift * delta * 0.1;

      // Fade out as rises
      var fadeAlpha = 1.0 - (riseAmount / smoke.maxRise);
      if (smoke.mesh.material && smoke.mesh.material.opacity) {
        smoke.mesh.material.opacity = 0.5 * fadeAlpha;
      }
    }

    // Emit embers (small rising particles)
    if (Math.random() > 0.7) {
      var emberGeo = new THREE.SphereGeometry(0.15 + Math.random() * 0.2, 6, 6);
      var emberMat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff7700,
        emissiveIntensity: 1.0,
        roughness: 0.8,
        metalness: 0.0
      });
      var ember = new THREE.Mesh(emberGeo, emberMat);
      var spawnX = -35 + Math.random() * 70;
      var spawnZ = -5 + Math.random() * 10;
      ember.position.set(spawnX, 2, spawnZ);
      scene.add(ember);
      emberParticles.push({
        mesh: ember,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 2 + Math.random() * 2,
        vz: (Math.random() - 0.5) * 0.5,
        life: 3 + Math.random() * 2,
        elapsed: 0
      });
    }

    // Update embers
    for (var i = emberParticles.length - 1; i >= 0; i--) {
      var ember = emberParticles[i];
      ember.elapsed += delta;
      ember.mesh.position.x += ember.vx * delta;
      ember.mesh.position.y += ember.vy * delta;
      ember.mesh.position.z += ember.vz * delta;

      // Gravity
      ember.vy -= 1.5 * delta;

      // Fade out
      if (ember.mesh.material && ember.mesh.material.emissiveIntensity) {
        ember.mesh.material.emissiveIntensity = 1.0 * (1.0 - (ember.elapsed / ember.life));
      }

      if (ember.elapsed > ember.life) {
        scene.remove(ember.mesh);
        emberParticles.splice(i, 1);
      }
    }
  }

  function reset() {
    // Remove all bridge objects from scene
    for (var i = 0; i < bridgeObjects.length; i++) {
      scene.remove(bridgeObjects[i]);
    }

    // Remove remaining embers
    for (var i = 0; i < emberParticles.length; i++) {
      scene.remove(emberParticles[i].mesh);
    }

    // Clear arrays
    bridgeObjects = [];
    fireParticles = [];
    smokeColumns = [];
    emberParticles = [];
    animationState = {
      fireIntensity: 1.0,
      smokeRise: 0,
      emberDrift: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
