window.ToxicFacility = (function() {
  'use strict';

  var FACILITY_SCALE = 80;
  var TOXIC_GREEN = 0x1a8800;
  var TOXIC_YELLOW = 0xccff00;
  var HAZMAT_ORANGE = 0xff6600;
  var INDUSTRIAL_GRAY = 0x444444;
  var DARK_CONTAMINATED = 0x1a1a0f;
  var LIGHT_GRAY = 0x999999;

  var scene = null;
  var camera = null;
  var allObjects = [];
  var animatedObjects = [];
  var bubbles = [];
  var emissionParticles = [];
  var pulsePipes = [];

  // Utility: Create and track object
  function createAndTrack(geometry, material, position, scale, rotation) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.set(position.x, position.y, position.z);
    if (scale) {
      if (typeof scale === 'number') {
        mesh.scale.set(scale, scale, scale);
      } else {
        mesh.scale.set(scale.x, scale.y, scale.z);
      }
    }
    if (rotation) {
      if (rotation.x !== undefined) mesh.rotation.x = rotation.x;
      if (rotation.y !== undefined) mesh.rotation.y = rotation.y;
      if (rotation.z !== undefined) mesh.rotation.z = rotation.z;
    }
    scene.add(mesh);
    allObjects.push(mesh);
    return mesh;
  }

  // Utility: Create LineSegments for fencing
  function createFence(startPos, endPos, height, color) {
    var points = [
      new THREE.Vector3(startPos.x, startPos.y, startPos.z),
      new THREE.Vector3(endPos.x, endPos.y, endPos.z),
      new THREE.Vector3(startPos.x, startPos.y + height, startPos.z),
      new THREE.Vector3(endPos.x, endPos.y + height, endPos.z)
    ];
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var fence = new THREE.LineSegments(geometry, material);
    scene.add(fence);
    allObjects.push(fence);
    return fence;
  }

  // Main initialization
  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    allObjects = [];
    animatedObjects = [];
    bubbles = [];
    emissionParticles = [];
    pulsePipes = [];

    // Ground plane (subtle, using BoxGeometry)
    var groundGeom = new THREE.BoxGeometry(FACILITY_SCALE * 1.5, 0.5, FACILITY_SCALE * 1.5);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2a1a });
    createAndTrack(groundGeom, groundMat, { x: 0, y: -0.25, z: 0 });

    // Production building (main facility structure)
    var buildingWidth = 20;
    var buildingDepth = 25;
    var buildingHeight = 15;
    var buildingMat = new THREE.MeshStandardMaterial({
      color: INDUSTRIAL_GRAY,
      metalness: 0.6,
      roughness: 0.4
    });

    // Main production wing 1
    var wing1Geom = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    createAndTrack(wing1Geom, buildingMat, { x: -15, y: buildingHeight / 2, z: 0 });

    // Main production wing 2
    var wing2Geom = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    createAndTrack(wing2Geom, buildingMat, { x: 15, y: buildingHeight / 2, z: 0 });

    // Central connector wing
    var connectorGeom = new THREE.BoxGeometry(15, buildingHeight * 0.8, buildingDepth * 0.6);
    createAndTrack(connectorGeom, buildingMat, { x: 0, y: buildingHeight * 0.4, z: 0 });

    // Upper observation tower on wing 1
    var towerGeom = new THREE.BoxGeometry(4, 8, 4);
    createAndTrack(towerGeom, buildingMat, { x: -15, y: buildingHeight + 4, z: 10 });

    // Upper observation tower on wing 2
    createAndTrack(towerGeom, buildingMat, { x: 15, y: buildingHeight + 4, z: 10 });

    // Reaction vats section (CylinderGeometry)
    var vatRadius = 1.5;
    var vatHeight = 4;
    var vatMat = new THREE.MeshStandardMaterial({
      color: DARK_CONTAMINATED,
      metalness: 0.8,
      roughness: 0.2
    });

    var vatRows = 4;
    var vatsPerRow = 6;
    var vatSpacingX = 3.5;
    var vatSpacingZ = 4;
    var vatAreaX = -25;
    var vatAreaZ = -15;

    for (var i = 0; i < vatRows; i++) {
      for (var j = 0; j < vatsPerRow; j++) {
        var vatX = vatAreaX + (i * vatSpacingX);
        var vatZ = vatAreaZ + (j * vatSpacingZ);
        var vatGeom = new THREE.CylinderGeometry(vatRadius, vatRadius, vatHeight, 16);
        var vat = createAndTrack(vatGeom, vatMat, { x: vatX, y: vatHeight / 2, z: vatZ });

        // Create glowing interior
        var innerGeom = new THREE.CylinderGeometry(vatRadius * 0.9, vatRadius * 0.9, vatHeight * 0.8, 16);
        var innerMat = new THREE.MeshStandardMaterial({
          color: TOXIC_GREEN,
          emissive: TOXIC_GREEN,
          emissiveIntensity: 0.6,
          metalness: 0.3,
          roughness: 0.6
        });
        createAndTrack(innerGeom, innerMat, { x: vatX, y: vatHeight / 2 + 0.2, z: vatZ });

        // Top dome
        var domeGeom = new THREE.SphereGeometry(vatRadius, 8, 8);
        var domeMat = new THREE.MeshStandardMaterial({ color: INDUSTRIAL_GRAY });
        createAndTrack(domeGeom, domeMat, { x: vatX, y: vatHeight + vatRadius * 0.5, z: vatZ }, 1);

        // Bubble animation setup
        animatedObjects.push({
          type: 'vat',
          mesh: vat,
          x: vatX,
          z: vatZ,
          time: Math.random() * Math.PI * 2
        });
      }
    }

    // Filling station (conveyor system)
    var fillingX = 0;
    var fillingZ = -30;
    var conveyorLen = 12;
    var conveyorHeight = 0.8;
    var conveyorMat = new THREE.MeshStandardMaterial({
      color: LIGHT_GRAY,
      metalness: 0.9,
      roughness: 0.1
    });

    // Conveyor belt structure
    var conveyorGeom = new THREE.BoxGeometry(conveyorLen, conveyorHeight, 2);
    createAndTrack(conveyorGeom, conveyorMat, { x: fillingX, y: 1.5, z: fillingZ });

    // Support posts for conveyor
    var postGeom = new THREE.BoxGeometry(0.6, 2, 0.6);
    createAndTrack(postGeom, buildingMat, { x: fillingX - 5, y: 0.5, z: fillingZ - 1.5 });
    createAndTrack(postGeom, buildingMat, { x: fillingX + 5, y: 0.5, z: fillingZ - 1.5 });

    // Shell casings on conveyor (CylinderGeometry)
    var shellMat = new THREE.MeshStandardMaterial({
      color: HAZMAT_ORANGE,
      metalness: 0.95,
      roughness: 0.05
    });

    for (var k = 0; k < 8; k++) {
      var shellGeom = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8);
      var shellX = fillingX - 4 + (k * 1.5);
      createAndTrack(shellGeom, shellMat, { x: shellX, y: 2.2, z: fillingZ });
    }

    // Filling nozzles
    var nozzleGeom = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 6);
    var nozzleMat = new THREE.MeshStandardMaterial({ color: INDUSTRIAL_GRAY });
    for (var n = 0; n < 4; n++) {
      var nozzleX = fillingX - 3 + (n * 2);
      createAndTrack(nozzleGeom, nozzleMat, { x: nozzleX, y: 3.5, z: fillingZ });
    }

    // Chemical pipeline network (CylinderGeometry pipes)
    var pipeMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    var pipeRadius = 0.4;

    // Pipeline from wing 1 to vats
    var pipe1 = createAndTrack(
      new THREE.CylinderGeometry(pipeRadius, pipeRadius, 12, 8),
      pipeMat,
      { x: -20, y: 5, z: -5 },
      1,
      { z: Math.PI / 2 }
    );
    pulsePipes.push({ pipe: pipe1, basePos: { x: -20, y: 5, z: -5 }, axis: 'z', time: 0 });

    // Pipeline from wing 2 to vats
    var pipe2 = createAndTrack(
      new THREE.CylinderGeometry(pipeRadius, pipeRadius, 12, 8),
      pipeMat,
      { x: 20, y: 5, z: -5 },
      1,
      { z: Math.PI / 2 }
    );
    pulsePipes.push({ pipe: pipe2, basePos: { x: 20, y: 5, z: -5 }, axis: 'z', time: 0 });

    // Pipeline to filling station
    var pipe3 = createAndTrack(
      new THREE.CylinderGeometry(pipeRadius, pipeRadius, 20, 8),
      pipeMat,
      { x: 0, y: 4, z: -12 },
      1,
      { x: Math.PI / 2 }
    );
    pulsePipes.push({ pipe: pipe3, basePos: { x: 0, y: 4, z: -12 }, axis: 'x', time: 1 });

    // Storage bunkers (BoxGeometry, earthen-covered)
    var bunkerMat = new THREE.MeshStandardMaterial({
      color: 0x5a4a2a,
      metalness: 0.4,
      roughness: 0.8
    });

    var bunkerWidth = 8;
    var bunkerLength = 12;
    var bunkerHeight = 3;

    // Bunker row 1
    for (var b = 0; b < 3; b++) {
      var bunkerX = -30 + (b * 12);
      var bunkerGeom = new THREE.BoxGeometry(bunkerWidth, bunkerHeight, bunkerLength);
      createAndTrack(bunkerGeom, bunkerMat, { x: bunkerX, y: bunkerHeight / 2, z: 20 });

      // Bunker roof (half-barrel approximation with BoxGeometry)
      var roofGeom = new THREE.BoxGeometry(bunkerWidth, 2, bunkerLength);
      var roofMat = new THREE.MeshStandardMaterial({
        color: 0x4a3a1a,
        metalness: 0.3,
        roughness: 0.9
      });
      createAndTrack(roofGeom, roofMat, { x: bunkerX, y: bunkerHeight + 1, z: 20 });

      // Ventilation shafts
      var shaftGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6);
      createAndTrack(shaftGeom, pipeMat, { x: bunkerX - 2, y: bunkerHeight + 2.5, z: 20 });
      createAndTrack(shaftGeom, pipeMat, { x: bunkerX + 2, y: bunkerHeight + 2.5, z: 20 });
    }

    // Loading dock for chemical warheads
    var dockX = 25;
    var dockZ = 15;

    // Dock platform
    var dockGeom = new THREE.BoxGeometry(10, 1, 8);
    var dockMat = new THREE.MeshStandardMaterial({
      color: LIGHT_GRAY,
      metalness: 0.7,
      roughness: 0.3
    });
    createAndTrack(dockGeom, dockMat, { x: dockX, y: 0.5, z: dockZ });

    // Dock support posts
    var postGeom2 = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    createAndTrack(postGeom2, buildingMat, { x: dockX - 4, y: 0.6, z: dockZ - 3 });
    createAndTrack(postGeom2, buildingMat, { x: dockX + 4, y: 0.6, z: dockZ - 3 });

    // Warhead shapes (CylinderGeometry with cone top)
    var warheadMat = new THREE.MeshStandardMaterial({
      color: HAZMAT_ORANGE,
      metalness: 0.95,
      roughness: 0.05,
      emissive: 0xff3300,
      emissiveIntensity: 0.2
    });

    for (var w = 0; w < 6; w++) {
      var warheadX = dockX - 3 + (w * 1.2);

      // Warhead body
      var bodyGeom = new THREE.CylinderGeometry(0.35, 0.4, 1.8, 8);
      createAndTrack(bodyGeom, warheadMat, { x: warheadX, y: 1.5, z: dockZ });

      // Warhead nose cone
      var coneGeom = new THREE.ConeGeometry(0.35, 0.8, 8);
      createAndTrack(coneGeom, warheadMat, { x: warheadX, y: 2.6, z: dockZ });
    }

    // Loading crane (CylinderGeometry arm with BoxGeometry support)
    var craneBaseGeom = new THREE.BoxGeometry(1, 3, 1);
    createAndTrack(craneBaseGeom, buildingMat, { x: dockX + 4, y: 1.5, z: dockZ + 4 });

    var armGeom = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
    createAndTrack(armGeom, pipeMat, { x: dockX + 4, y: 4, z: dockZ - 2 }, 1, { x: Math.PI / 2 });

    // Waste processing pool (BoxGeometry containment)
    var poolX = 30;
    var poolZ = -25;
    var poolWidth = 10;
    var poolLength = 12;
    var poolDepth = 2;

    var poolMat = new THREE.MeshStandardMaterial({
      color: TOXIC_GREEN,
      emissive: TOXIC_GREEN,
      emissiveIntensity: 0.4,
      metalness: 0.4,
      roughness: 0.6
    });
    var poolGeom = new THREE.BoxGeometry(poolWidth, poolDepth, poolLength);
    createAndTrack(poolGeom, poolMat, { x: poolX, y: poolDepth / 2, z: poolZ });

    // Pool containment walls
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x6a5a3a,
      metalness: 0.5,
      roughness: 0.7
    });
    var wallGeom = new THREE.BoxGeometry(poolWidth + 0.5, 1.5, 0.3);
    createAndTrack(wallGeom, wallMat, { x: poolX, y: 2.5, z: poolZ - poolLength / 2 });
    createAndTrack(wallGeom, wallMat, { x: poolX, y: 2.5, z: poolZ + poolLength / 2 });

    var wallGeom2 = new THREE.BoxGeometry(0.3, 1.5, poolLength);
    createAndTrack(wallGeom2, wallMat, { x: poolX - poolWidth / 2, y: 2.5, z: poolZ });
    createAndTrack(wallGeom2, wallMat, { x: poolX + poolWidth / 2, y: 2.5, z: poolZ });

    // Decontamination airlock (double-chamber BoxGeometry)
    var airlockX = -30;
    var airlockZ = 0;
    var chamberMat = new THREE.MeshStandardMaterial({
      color: LIGHT_GRAY,
      metalness: 0.6,
      roughness: 0.4
    });

    // Outer chamber
    var outerChamberGeom = new THREE.BoxGeometry(4, 4, 3);
    createAndTrack(outerChamberGeom, chamberMat, { x: airlockX - 3, y: 2, z: airlockZ });

    // Inner chamber
    var innerChamberGeom = new THREE.BoxGeometry(4, 4, 3);
    createAndTrack(innerChamberGeom, chamberMat, { x: airlockX + 3, y: 2, z: airlockZ });

    // Connecting passage
    var passageGeom = new THREE.BoxGeometry(2, 3.5, 2.5);
    createAndTrack(passageGeom, chamberMat, { x: airlockX, y: 2, z: airlockZ });

    // Airlock doors (CylinderGeometry as door frames)
    var doorGeom = new THREE.CylinderGeometry(0.1, 0.1, 3.5, 8);
    createAndTrack(doorGeom, pipeMat, { x: airlockX - 5, y: 2, z: airlockZ });
    createAndTrack(doorGeom, pipeMat, { x: airlockX + 5, y: 2, z: airlockZ });

    // Emergency chemical showers (CylinderGeometry shower heads)
    var showerMat = new THREE.MeshStandardMaterial({
      color: LIGHT_GRAY,
      metalness: 0.9,
      roughness: 0.1
    });

    var showerLocations = [
      { x: -20, y: 3.5, z: 5 },
      { x: -20, y: 3.5, z: -5 },
      { x: 20, y: 3.5, z: 5 },
      { x: 20, y: 3.5, z: -5 }
    ];

    for (var s = 0; s < showerLocations.length; s++) {
      var loc = showerLocations[s];
      // Shower arm
      var armGeom2 = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6);
      createAndTrack(armGeom2, showerMat, { x: loc.x, y: loc.y, z: loc.z });

      // Shower head
      var headGeom = new THREE.SphereGeometry(0.5, 8, 8);
      createAndTrack(headGeom, showerMat, { x: loc.x + 0.7, y: loc.y - 0.5, z: loc.z });

      // Spray nozzles
      var nozzleGeom2 = new THREE.ConeGeometry(0.08, 0.3, 4);
      for (var ns = 0; ns < 6; ns++) {
        var angle = (ns / 6) * Math.PI * 2;
        var nx = (loc.x + 0.7) + Math.cos(angle) * 0.3;
        var nz = (loc.z) + Math.sin(angle) * 0.3;
        createAndTrack(nozzleGeom2, showerMat, { x: nx, y: loc.y - 1, z: nz });
      }
    }

    // Perimeter security fences (LineSegments double-fence)
    var fenceHeight = 3;
    var fenceColor = 0x666666;
    var perimeter = FACILITY_SCALE / 2 - 2;

    // Outer fence
    createFence({ x: -perimeter, y: 0, z: -perimeter }, { x: perimeter, y: 0, z: -perimeter }, fenceHeight, fenceColor);
    createFence({ x: perimeter, y: 0, z: -perimeter }, { x: perimeter, y: 0, z: perimeter }, fenceHeight, fenceColor);
    createFence({ x: perimeter, y: 0, z: perimeter }, { x: -perimeter, y: 0, z: perimeter }, fenceHeight, fenceColor);
    createFence({ x: -perimeter, y: 0, z: perimeter }, { x: -perimeter, y: 0, z: -perimeter }, fenceHeight, fenceColor);

    // Inner fence (offset)
    var innerPerimeter = perimeter - 3;
    createFence({ x: -innerPerimeter, y: 0, z: -innerPerimeter }, { x: innerPerimeter, y: 0, z: -innerPerimeter }, fenceHeight, 0x888888);
    createFence({ x: innerPerimeter, y: 0, z: -innerPerimeter }, { x: innerPerimeter, y: 0, z: innerPerimeter }, fenceHeight, 0x888888);
    createFence({ x: innerPerimeter, y: 0, z: innerPerimeter }, { x: -innerPerimeter, y: 0, z: innerPerimeter }, fenceHeight, 0x888888);
    createFence({ x: -innerPerimeter, y: 0, z: innerPerimeter }, { x: -innerPerimeter, y: 0, z: -innerPerimeter }, fenceHeight, 0x888888);

    // Guard posts (BoxGeometry at corners)
    var guardMat = new THREE.MeshStandardMaterial({
      color: DARK_CONTAMINATED,
      metalness: 0.7,
      roughness: 0.3
    });

    var guardLocations = [
      { x: -perimeter, z: -perimeter },
      { x: perimeter, z: -perimeter },
      { x: perimeter, z: perimeter },
      { x: -perimeter, z: perimeter }
    ];

    for (var g = 0; g < guardLocations.length; g++) {
      var guardLoc = guardLocations[g];
      var guardGeom = new THREE.BoxGeometry(2, 4, 2);
      createAndTrack(guardGeom, guardMat, { x: guardLoc.x, y: 2, z: guardLoc.z });

      // Guard post searchlight
      var searchGeom = new THREE.ConeGeometry(0.3, 0.5, 8);
      createAndTrack(searchGeom, pipeMat, { x: guardLoc.x, y: 4.5, z: guardLoc.z });
    }

    // Laboratory building (BoxGeometry research wing)
    var labX = 0;
    var labZ = 30;

    var labMat = new THREE.MeshStandardMaterial({
      color: LIGHT_GRAY,
      metalness: 0.5,
      roughness: 0.5
    });

    // Main lab structure
    var labGeom = new THREE.BoxGeometry(12, 6, 10);
    createAndTrack(labGeom, labMat, { x: labX, y: 3, z: labZ });

    // Lab wings
    var wingGeom = new THREE.BoxGeometry(5, 5, 4);
    createAndTrack(wingGeom, labMat, { x: labX - 8, y: 2.5, z: labZ });
    createAndTrack(wingGeom, labMat, { x: labX + 8, y: 2.5, z: labZ });

    // Lab equipment (BoxGeometry and CylinderGeometry)
    var equipmentMat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 0.8,
      roughness: 0.2
    });

    for (var eq = 0; eq < 8; eq++) {
      var eqX = labX - 5 + (eq * 1.6);
      var eqGeom = new THREE.BoxGeometry(1, 2, 0.8);
      createAndTrack(eqGeom, equipmentMat, { x: eqX, y: 1, z: labZ });

      // Equipment tanks
      var tankGeom = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 6);
      createAndTrack(tankGeom, equipmentMat, { x: eqX, y: 2.5, z: labZ });
    }

    // Lab ventilation ducts (CylinderGeometry)
    var ductGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
    createAndTrack(ductGeom, pipeMat, { x: labX - 5, y: 6.5, z: labZ }, 1, { z: Math.PI / 2 });
    createAndTrack(ductGeom, pipeMat, { x: labX + 5, y: 6.5, z: labZ }, 1, { z: Math.PI / 2 });

    // Chimney stacks (CylinderGeometry tall stacks)
    var chimneyMat = new THREE.MeshStandardMaterial({
      color: DARK_CONTAMINATED,
      metalness: 0.6,
      roughness: 0.4
    });

    var chimneyLocations = [
      { x: -20, z: 5 },
      { x: 20, z: 5 },
      { x: -25, z: -15 },
      { x: 25, z: -15 }
    ];

    for (var ch = 0; ch < chimneyLocations.length; ch++) {
      var chimLoc = chimneyLocations[ch];
      var stackGeom = new THREE.CylinderGeometry(0.8, 1, 12, 8);
      var stack = createAndTrack(stackGeom, chimneyMat, { x: chimLoc.x, y: 8, z: chimLoc.z });

      animatedObjects.push({
        type: 'chimney',
        x: chimLoc.x,
        z: chimLoc.z,
        time: Math.random() * Math.PI * 2
      });

      // Stack rim
      var rimGeom = new THREE.CylinderGeometry(0.85, 0.85, 0.2, 8);
      createAndTrack(rimGeom, chimneyMat, { x: chimLoc.x, y: 14.2, z: chimLoc.z });
    }

    // Warning zone (contaminated area with marker poles)
    var warningX = -35;
    var warningZ = -35;
    var warningSize = 8;

    // Ground contamination marker
    var warningGeom = new THREE.BoxGeometry(warningSize, 0.1, warningSize);
    var warningMat = new THREE.MeshStandardMaterial({
      color: TOXIC_YELLOW,
      emissive: TOXIC_YELLOW,
      emissiveIntensity: 0.3
    });
    createAndTrack(warningGeom, warningMat, { x: warningX, y: 0.05, z: warningZ });

    // Warning poles (CylinderGeometry)
    var poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    var poleMat = new THREE.MeshStandardMaterial({
      color: HAZMAT_ORANGE,
      emissive: HAZMAT_ORANGE,
      emissiveIntensity: 0.4
    });

    for (var p = 0; p < 8; p++) {
      var angle = (p / 8) * Math.PI * 2;
      var px = warningX + Math.cos(angle) * (warningSize / 2 + 1);
      var pz = warningZ + Math.sin(angle) * (warningSize / 2 + 1);
      createAndTrack(poleGeom, poleMat, { x: px, y: 1, z: pz });
    }

    // Additional pipe network sections
    var pipe4 = createAndTrack(
      new THREE.CylinderGeometry(pipeRadius, pipeRadius, 15, 8),
      pipeMat,
      { x: -15, y: 6, z: 15 },
      1,
      { z: Math.PI / 2 }
    );
    pulsePipes.push({ pipe: pipe4, basePos: { x: -15, y: 6, z: 15 }, axis: 'z', time: 2 });

    var pipe5 = createAndTrack(
      new THREE.CylinderGeometry(pipeRadius, pipeRadius, 10, 8),
      pipeMat,
      { x: 25, y: 5, z: 0 },
      1,
      { x: Math.PI / 2 }
    );
    pulsePipes.push({ pipe: pipe5, basePos: { x: 25, y: 5, z: 0 }, axis: 'x', time: 0.5 });

    // Additional storage tanks scattered
    for (var t = 0; t < 5; t++) {
      var tankX = -35 + (t * 8);
      var tankGeom2 = new THREE.CylinderGeometry(1.2, 1.2, 3, 8);
      var tankMat = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        metalness: 0.8,
        roughness: 0.2
      });
      var tank = createAndTrack(tankGeom2, tankMat, { x: tankX, y: 1.5, z: 25 });

      // Tank valve
      var valveGeom = new THREE.SphereGeometry(0.3, 6, 6);
      var valveMat = new THREE.MeshStandardMaterial({
        color: HAZMAT_ORANGE,
        metalness: 0.9
      });
      createAndTrack(valveGeom, valveMat, { x: tankX, y: 3.3, z: 25 });
    }

    // Emergency exhaust vents
    for (var v = 0; v < 6; v++) {
      var ventX = -30 + (v * 12);
      var ventGeom = new THREE.ConeGeometry(0.5, 1.2, 6);
      var ventMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
      createAndTrack(ventGeom, ventMat, { x: ventX, y: 7, z: 12 });
    }

    // Utility platform walkways (BoxGeometry)
    var walkwayMat = new THREE.MeshStandardMaterial({
      color: LIGHT_GRAY,
      metalness: 0.7,
      roughness: 0.3
    });

    for (var wk = 0; wk < 4; wk++) {
      var wkX = -20 + (wk * 15);
      var wkGeom = new THREE.BoxGeometry(8, 0.5, 3);
      createAndTrack(wkGeom, walkwayMat, { x: wkX, y: 8, z: -10 });

      // Walkway railings
      var railGeom = new THREE.BoxGeometry(8, 0.3, 0.3);
      createAndTrack(railGeom, pipeMat, { x: wkX, y: 8.5, z: -10 - 1.5 });
      createAndTrack(railGeom, pipeMat, { x: wkX, y: 8.5, z: -10 + 1.5 });
    }

    console.log('ToxicFacility initialized with ' + allObjects.length + ' geometry objects');
  }

  // Update animation loop
  function update(delta) {
    var time = Date.now() * 0.001;

    // Animate vat bubbles
    for (var i = animatedObjects.length - 1; i >= 0; i--) {
      var obj = animatedObjects[i];

      if (obj.type === 'vat') {
        // Create and animate bubbles
        if (Math.random() < 0.3) {
          var bubbleGeom = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 4, 4);
          var bubbleMat = new THREE.MeshStandardMaterial({
            color: TOXIC_GREEN,
            emissive: TOXIC_GREEN,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7
          });
          var bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
          bubble.position.set(obj.x, 1 + Math.random() * 1, obj.z);
          scene.add(bubble);

          bubbles.push({
            mesh: bubble,
            age: 0,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 1 + Math.random() * 0.5,
            vz: (Math.random() - 0.5) * 0.5
          });
        }
      }

      if (obj.type === 'chimney') {
        // Emit toxic particles
        if (Math.random() < 0.4) {
          var particleGeom = new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 4, 4);
          var particleMat = new THREE.MeshStandardMaterial({
            color: TOXIC_YELLOW,
            emissive: TOXIC_YELLOW,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.6
          });
          var particle = new THREE.Mesh(particleGeom, particleMat);
          particle.position.set(obj.x, 14 + Math.random() * 1, obj.z);
          scene.add(particle);

          emissionParticles.push({
            mesh: particle,
            age: 0,
            vx: (Math.random() - 0.5) * 0.3,
            vy: 0.8 + Math.random() * 0.4,
            vz: (Math.random() - 0.5) * 0.3
          });
        }
      }
    }

    // Update bubble positions and lifetime
    for (var b = bubbles.length - 1; b >= 0; b--) {
      var bubble = bubbles[b];
      bubble.mesh.position.x += bubble.vx * delta;
      bubble.mesh.position.y += bubble.vy * delta;
      bubble.mesh.position.z += bubble.vz * delta;
      bubble.age += delta;

      // Apply decay
      bubble.mesh.material.opacity = Math.max(0, 0.7 - bubble.age * 0.5);

      if (bubble.age > 2) {
        scene.remove(bubble.mesh);
        bubbles.splice(b, 1);
      }
    }

    // Update emission particles
    for (var e = emissionParticles.length - 1; e >= 0; e--) {
      var particle = emissionParticles[e];
      particle.mesh.position.x += particle.vx * delta;
      particle.mesh.position.y += particle.vy * delta;
      particle.mesh.position.z += particle.vz * delta;
      particle.age += delta;

      // Fade out
      particle.mesh.material.opacity = Math.max(0, 0.6 - particle.age * 0.3);

      if (particle.age > 3) {
        scene.remove(particle.mesh);
        emissionParticles.splice(e, 1);
      }
    }

    // Animate pipe pressure pulses
    for (var pp = 0; pp < pulsePipes.length; pp++) {
      var pulseData = pulsePipes[pp];
      pulseData.time += delta;

      var pulse = Math.sin(pulseData.time * 2) * 0.05;
      if (pulseData.axis === 'x') {
        pulseData.pipe.scale.x = 1 + pulse;
      } else if (pulseData.axis === 'z') {
        pulseData.pipe.scale.z = 1 + pulse;
      }
    }
  }

  // Reset function to clean up
  function reset() {
    // Remove all tracked objects from scene
    for (var i = allObjects.length - 1; i >= 0; i--) {
      scene.remove(allObjects[i]);
    }

    // Remove all bubbles
    for (var b = bubbles.length - 1; b >= 0; b--) {
      scene.remove(bubbles[b].mesh);
    }

    // Remove all emission particles
    for (var e = emissionParticles.length - 1; e >= 0; e--) {
      scene.remove(emissionParticles[e].mesh);
    }

    // Clear arrays
    allObjects = [];
    animatedObjects = [];
    bubbles = [];
    emissionParticles = [];
    pulsePipes = [];
  }

  // Public API
  return {
    init: init,
    update: update,
    reset: reset
  };
}());
