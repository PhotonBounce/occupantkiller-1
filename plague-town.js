window.PlagueTown = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var fogSpheres = [];
  var crowPerches = [];
  var bonefireObjs = [];
  var animationOffsets = [];

  // Color palette for plague-ravaged town
  var colors = {
    darkWood: 0x3d2817,
    lightWood: 0x5d4229,
    stone: 0x808080,
    darkStone: 0x404040,
    mold: 0x2d5016,
    moldGreen: 0x4a7c2f,
    plagueYellow: 0xb8a800,
    plagueGreen: 0x9fb842,
    ash: 0x6b6b6b,
    darkAsh: 0x2a2a2a,
    blood: 0x8b0000,
    bone: 0xf0f0e0,
    wood: 0x6b4423
  };

  // Helper function to create a mesh and add to scene
  function addMesh(geometry, material, x, y, z, scaleX, scaleY, scaleZ) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (scaleX !== undefined) {
      mesh.scale.set(scaleX || 1, scaleY || 1, scaleZ || 1);
    }
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  // Initialize the plague town
  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    fogSpheres = [];
    crowPerches = [];
    bonefireObjs = [];
    animationOffsets = [];

    // Set fog atmosphere
    scene.fog = new THREE.Fog(0x1a1a1a, 150, 300);
    scene.background = new THREE.Color(0x0d0d0d);

    // Build town structures
    buildCobblestoneStreets();
    buildCrookedHouses();
    buildChurchWithBellTower();
    buildPlagueBonfirePiles();
    buildMassGravePits();
    buildQuarantineBarricades();
    buildAbandonedMarketStalls();
    buildWaterWell();
    buildInnTavern();
    buildMilitaryCheckpoint();
    buildPlagueDoctor();
    buildFogEffect();
    buildCrowPerches();
  }

  // Cobblestone streets in winding pattern
  function buildCobblestoneStreets() {
    var stoneMat = new THREE.MeshStandardMaterial({ color: colors.stone });
    var darkStoneMat = new THREE.MeshStandardMaterial({ color: colors.darkStone });

    // Main street grid
    var streetPattern = [
      { x: 0, z: 0, w: 80, h: 12 },
      { x: 0, z: -25, w: 80, h: 12 },
      { x: 0, z: 25, w: 80, h: 12 },
      { x: -25, z: 0, w: 12, h: 80 },
      { x: 25, z: 0, w: 12, h: 80 }
    ];

    for (var i = 0; i < streetPattern.length; i++) {
      var pattern = streetPattern[i];
      var mats = [stoneMat, darkStoneMat];
      var tiles = pattern.w > pattern.h ? Math.ceil(pattern.w / 4) : Math.ceil(pattern.h / 4);
      var step = pattern.w > pattern.h ? pattern.w / tiles : pattern.h / tiles;

      for (var j = 0; j < tiles; j++) {
        var offsetX = pattern.w > pattern.h ? pattern.x - pattern.w / 2 + j * step : pattern.x;
        var offsetZ = pattern.w > pattern.h ? pattern.z : pattern.z - pattern.h / 2 + j * step;
        var mat = mats[j % 2];
        var geom = new THREE.BoxGeometry(4, 0.3, 4);
        addMesh(geom, mat, offsetX, 0.15, offsetZ);
      }
    }

    // Scattered cobblestones for scattered areas
    for (var x = -38; x < 38; x += 8) {
      for (var z = -38; z < 38; z += 8) {
        if (Math.abs(x) < 15 || Math.abs(z) < 15) continue; // Skip main streets
        var mat = Math.random() > 0.5 ? stoneMat : darkStoneMat;
        var geom = new THREE.BoxGeometry(3, 0.2, 3);
        addMesh(geom, mat, x + Math.random() * 3, 0.1, z + Math.random() * 3);
      }
    }
  }

  // Crooked timber-framed houses
  function buildCrookedHouses() {
    var positions = [
      { x: -35, z: -35 },
      { x: 35, z: -35 },
      { x: -35, z: 35 },
      { x: 35, z: 35 },
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: -20, z: 20 },
      { x: 20, z: 20 },
      { x: 0, z: -40 },
      { x: 0, z: 40 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var lean = (Math.random() - 0.5) * 0.15;
      buildHouse(pos.x, pos.z, lean);
    }
  }

  function buildHouse(baseX, baseZ, lean) {
    var darkMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var lightMat = new THREE.MeshStandardMaterial({ color: colors.lightWood });
    var moldMat = new THREE.MeshStandardMaterial({ color: colors.moldGreen });

    // Main walls
    var walls = new THREE.BoxGeometry(14, 12, 12);
    var mainWall = addMesh(walls, darkMat, baseX, 6, baseZ);
    mainWall.rotation.z = lean;

    // Timber frame details
    var beams = [
      { x: -6, y: 6, z: 0, sx: 1, sy: 12, sz: 12 },
      { x: 0, y: 6, z: 0, sx: 1, sy: 12, sz: 12 },
      { x: 6, y: 6, z: 0, sx: 1, sy: 12, sz: 12 },
      { x: 0, y: 1, z: 0, sx: 14, sy: 1, sz: 12 },
      { x: 0, y: 11, z: 0, sx: 14, sy: 1, sz: 12 }
    ];

    for (var i = 0; i < beams.length; i++) {
      var beam = beams[i];
      var geom = new THREE.BoxGeometry(beam.sx, beam.sy, beam.sz);
      var mesh = addMesh(geom, lightMat, baseX + beam.x, beam.y, baseZ + beam.z);
      mesh.rotation.z = lean;
    }

    // Roof peak
    var roofPeaks = [
      { x: -7, z: -6 },
      { x: 7, z: -6 },
      { x: -7, z: 6 },
      { x: 7, z: 6 }
    ];

    for (var j = 0; j < roofPeaks.length; j++) {
      var peak = roofPeaks[j];
      var roof = new THREE.ConeGeometry(2, 5, 4);
      var roofMesh = addMesh(roof, moldMat, baseX + peak.x, 14, baseZ + peak.z);
      roofMesh.rotation.z = lean;
    }

    // Window frames (3 per side)
    var windows = [
      { x: -5, y: 8, z: -6.5 },
      { x: 0, y: 8, z: -6.5 },
      { x: 5, y: 8, z: -6.5 },
      { x: -5, y: 4, z: -6.5 },
      { x: 0, y: 4, z: -6.5 },
      { x: 5, y: 4, z: -6.5 }
    ];

    for (var k = 0; k < windows.length; k++) {
      var win = windows[k];
      var frame = new THREE.BoxGeometry(1.5, 1.5, 0.2);
      var frameMesh = addMesh(frame, darkStoneMat, baseX + win.x, win.y, baseZ + win.z);
      frameMesh.rotation.z = lean;
    }

    // Door
    var door = new THREE.BoxGeometry(3, 5, 0.2);
    var doorMesh = addMesh(door, colors.blood, baseX, 2.5, baseZ - 6.5);
    doorMesh.rotation.z = lean;

    // Mold patches on walls
    for (var m = 0; m < 4; m++) {
      var moldSpot = new THREE.SphereGeometry(1.5, 4, 4);
      var moldMesh = addMesh(moldSpot, moldMat, baseX + (Math.random() - 0.5) * 10, 5 + Math.random() * 8, baseZ + (Math.random() - 0.5) * 10);
      moldMesh.rotation.z = lean;
    }
  }

  var darkStoneMat = new THREE.MeshStandardMaterial({ color: colors.darkStone });

  // Church with bell tower
  function buildChurchWithBellTower() {
    var lightMat = new THREE.MeshStandardMaterial({ color: colors.lightWood });
    var darkMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var stoneMat = new THREE.MeshStandardMaterial({ color: colors.stone });

    // Nave (main body)
    var nave = new THREE.BoxGeometry(20, 18, 30);
    addMesh(nave, stoneMat, -40, 9, 0);

    // Transepts
    var transept1 = new THREE.BoxGeometry(30, 16, 12);
    addMesh(transept1, stoneMat, -40, 8, -15);

    var transept2 = new THREE.BoxGeometry(30, 16, 12);
    addMesh(transept2, stoneMat, -40, 8, 15);

    // Bell tower (cylinder)
    var tower = new THREE.CylinderGeometry(6, 6.5, 20, 8);
    addMesh(tower, stoneMat, -40, 14, 0);

    // Tower bell chamber
    var bellChamber = new THREE.BoxGeometry(10, 6, 10);
    addMesh(bellChamber, lightMat, -40, 18, 0);

    // Spire (cone on tower)
    var spire = new THREE.ConeGeometry(5, 12, 8);
    addMesh(spire, darkMat, -40, 28, 0);

    // Cross on spire top
    var crossBar1 = new THREE.BoxGeometry(3, 1, 0.3);
    addMesh(crossBar1, lightMat, -40, 35, 0);

    var crossBar2 = new THREE.BoxGeometry(0.3, 4, 0.3);
    addMesh(crossBar2, lightMat, -40, 33, 0);

    // Gothic arch windows on nave
    for (var i = 0; i < 4; i++) {
      var archWindow = new THREE.SphereGeometry(2, 6, 6);
      addMesh(archWindow, darkStoneMat, -52, 10 + i * 4, 0);
    }

    // Buttresses
    var buttresses = [
      { x: -52, z: -15 },
      { x: -52, z: 15 },
      { x: -28, z: -15 },
      { x: -28, z: 15 }
    ];

    for (var j = 0; j < buttresses.length; j++) {
      var butt = buttresses[j];
      var buttress = new THREE.BoxGeometry(2, 18, 4);
      addMesh(buttress, stoneMat, butt.x, 9, butt.z);
    }

    // Graveyard markers (crosses)
    for (var k = 0; k < 8; k++) {
      var angle = (k / 8) * Math.PI * 2;
      var dist = 25;
      var cx = -40 + Math.cos(angle) * dist;
      var cz = Math.sin(angle) * dist;

      var vBar = new THREE.BoxGeometry(1, 4, 0.2);
      addMesh(vBar, lightMat, cx, 2, cz);

      var hBar = new THREE.BoxGeometry(2, 0.2, 1);
      addMesh(hBar, lightMat, cx, 3, cz);
    }
  }

  // Plague bonfire piles
  function buildPlagueBonfirePiles() {
    var pilePositions = [
      { x: -15, z: -15 },
      { x: 15, z: -15 },
      { x: -15, z: 15 },
      { x: 15, z: 15 },
      { x: 0, z: 0 }
    ];

    for (var i = 0; i < pilePositions.length; i++) {
      var pos = pilePositions[i];
      buildBonfire(pos.x, pos.z);
    }
  }

  function buildBonfire(x, z) {
    var fireMat = new THREE.MeshStandardMaterial({ color: colors.plagueYellow, emissive: colors.plagueYellow, emissiveIntensity: 0.4 });
    var logMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });

    // Log base (cross pattern)
    var log1 = new THREE.BoxGeometry(1, 0.5, 8);
    var logMesh1 = addMesh(log1, logMat, x, 0.5, z);
    bonefireObjs.push(logMesh1);
    animationOffsets.push(Math.random() * Math.PI * 2);

    var log2 = new THREE.BoxGeometry(8, 0.5, 1);
    var logMesh2 = addMesh(log2, logMat, x, 0.5, z);
    bonefireObjs.push(logMesh2);
    animationOffsets.push(Math.random() * Math.PI * 2);

    // Fire spheres
    for (var i = 0; i < 4; i++) {
      var fire = new THREE.SphereGeometry(3 + i * 0.5, 6, 6);
      var fireMesh = addMesh(fire, fireMat, x, 3 + i * 1.5, z);
      bonefireObjs.push(fireMesh);
      animationOffsets.push(Math.random() * Math.PI * 2);
    }

    // Ash cloud (translucent spheres)
    var ashMat = new THREE.MeshStandardMaterial({ color: colors.ash, transparent: true, opacity: 0.3 });
    for (var j = 0; j < 3; j++) {
      var ash = new THREE.SphereGeometry(5 + j * 1, 4, 4);
      var ashMesh = addMesh(ash, ashMat, x, 8 + j * 2, z);
      bonefireObjs.push(ashMesh);
      animationOffsets.push(Math.random() * Math.PI * 2);
    }
  }

  // Mass grave pits
  function buildMassGravePits() {
    var pitPositions = [
      { x: -30, z: -30 },
      { x: 30, z: -30 },
      { x: -30, z: 30 }
    ];

    for (var i = 0; i < pitPositions.length; i++) {
      var pos = pitPositions[i];
      buildGravePit(pos.x, pos.z);
    }
  }

  function buildGravePit(x, z) {
    var earthMat = new THREE.MeshStandardMaterial({ color: colors.darkAsh });
    var boneMat = new THREE.MeshStandardMaterial({ color: colors.bone });

    // Outer pit walls
    var pitWall = new THREE.BoxGeometry(12, 8, 12);
    addMesh(pitWall, earthMat, x, -4, z);

    // Dark pit floor
    var pitFloor = new THREE.BoxGeometry(12, 0.5, 12);
    addMesh(pitFloor, new THREE.MeshStandardMaterial({ color: 0x0a0a0a }), x, -8.5, z);

    // Bones scattered in pit
    for (var i = 0; i < 6; i++) {
      var boneX = x + (Math.random() - 0.5) * 8;
      var boneZ = z + (Math.random() - 0.5) * 8;

      var bone1 = new THREE.BoxGeometry(0.3, 2, 0.3);
      addMesh(bone1, boneMat, boneX, -5, boneZ);

      var bone2 = new THREE.BoxGeometry(0.3, 1.5, 0.3);
      addMesh(bone2, boneMat, boneX + 0.5, -5.5, boneZ);
    }

    // Skull stacks
    var skull = new THREE.SphereGeometry(0.8, 6, 6);
    addMesh(skull, boneMat, x + 2, -6, z + 2);
    addMesh(skull, boneMat, x + 2, -5.2, z + 2);
    addMesh(skull, boneMat, x - 2, -6, z - 2);
  }

  // Quarantine barricades
  function buildQuarantineBarricades() {
    var barricadeMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var warnMat = new THREE.MeshStandardMaterial({ color: colors.plagueYellow });

    // Multiple barricade lines
    var barricadeLines = [
      { x: -10, z: 30, len: 20, vert: false },
      { x: 10, z: 30, len: 20, vert: false },
      { x: -30, z: 10, len: 20, vert: true },
      { x: 30, z: -10, len: 20, vert: true }
    ];

    for (var i = 0; i < barricadeLines.length; i++) {
      var line = barricadeLines[i];
      var segments = Math.floor(line.len / 4);

      for (var j = 0; j < segments; j++) {
        var offsetX = line.vert ? line.x : line.x + (j - segments / 2) * 4;
        var offsetZ = line.vert ? line.z + (j - segments / 2) * 4 : line.z;

        // Barricade boards
        var board = new THREE.BoxGeometry(4, 4, 0.5);
        addMesh(board, barricadeMat, offsetX, 2, offsetZ);

        // Warning stripe
        var stripe = new THREE.BoxGeometry(4, 0.4, 0.6);
        addMesh(stripe, warnMat, offsetX, 3.5, offsetZ);
      }
    }
  }

  // Abandoned market stalls
  function buildAbandonedMarketStalls() {
    var stallPositions = [
      { x: -20, z: 5 },
      { x: -10, z: 5 },
      { x: 0, z: 5 },
      { x: 10, z: 5 },
      { x: 20, z: 5 }
    ];

    for (var i = 0; i < stallPositions.length; i++) {
      var pos = stallPositions[i];
      buildMarketStall(pos.x, pos.z);
    }
  }

  function buildMarketStall(x, z) {
    var woodMat = new THREE.MeshStandardMaterial({ color: colors.lightWood });
    var canopyMat = new THREE.MeshStandardMaterial({ color: colors.plagueYellow, transparent: true, opacity: 0.6 });

    // Frame
    var frameGeom = new THREE.BoxGeometry(6, 1, 0.5);
    addMesh(frameGeom, woodMat, x, 1, z - 2);

    var postGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
    addMesh(postGeom, woodMat, x - 2.5, 1.5, z - 2);
    addMesh(postGeom, woodMat, x + 2.5, 1.5, z - 2);

    // Torn canopy
    var canopy1 = new THREE.BoxGeometry(6, 0.1, 4);
    addMesh(canopy1, canopyMat, x, 3, z - 1);

    var canopy2 = new THREE.BoxGeometry(6, 0.1, 2);
    addMesh(canopy2, canopyMat, x, 2.8, z + 1);

    // Display table
    var table = new THREE.BoxGeometry(6, 0.5, 3);
    addMesh(table, woodMat, x, 0.25, z);

    // Scattered goods (spheres)
    for (var i = 0; i < 3; i++) {
      var goodsColor = [colors.plagueGreen, colors.plagueYellow, colors.blood];
      var goods = new THREE.SphereGeometry(0.4, 4, 4);
      var goodsMat = new THREE.MeshStandardMaterial({ color: goodsColor[i] });
      addMesh(goods, goodsMat, x + (Math.random() - 0.5) * 4, 1, z + (Math.random() - 0.5) * 3);
    }
  }

  // Water well
  function buildWaterWell() {
    var stoneMat = new THREE.MeshStandardMaterial({ color: colors.stone });
    var woodMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var waterMat = new THREE.MeshStandardMaterial({ color: 0x1a1a3a, metalness: 0.8 });

    // Well cylinder
    var wellGeom = new THREE.CylinderGeometry(3, 3.2, 8, 8);
    addMesh(wellGeom, stoneMat, 0, -4, -35);

    // Well rim
    var rim1 = new THREE.CylinderGeometry(3.5, 3.2, 0.5, 8);
    addMesh(rim1, stoneMat, 0, 0, -35);

    var rim2 = new THREE.BoxGeometry(8, 1, 1);
    addMesh(rim2, woodMat, 0, 0.5, -35);

    // Crank
    var crankGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 6);
    addMesh(crankGeom, woodMat, 0, 1, -32);

    var handle = new THREE.BoxGeometry(0.3, 0.3, 2);
    addMesh(handle, woodMat, 0, 2, -30);

    // Rope (line segments)
    var ropeGeom = new THREE.BufferGeometry();
    var ropePositions = new Float32Array([
      0, 0, -35,
      0, -8, -35
    ]);
    ropeGeom.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
    var ropeMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a, linewidth: 2 });
    var rope = new THREE.LineSegments(ropeGeom, ropeMat);
    scene.add(rope);
    objects.push(rope);

    // Contaminated water inside well
    var waterGeom = new THREE.SphereGeometry(2.8, 8, 8);
    addMesh(waterGeom, waterMat, 0, -6, -35);
  }

  // Inn/Tavern building
  function buildInnTavern() {
    var darkMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var lightMat = new THREE.MeshStandardMaterial({ color: colors.lightWood });
    var stoneMat = new THREE.MeshStandardMaterial({ color: colors.stone });

    // Main building (multi-story)
    var mainGeom = new THREE.BoxGeometry(16, 14, 14);
    var mainMesh = addMesh(mainGeom, darkMat, 40, 7, 0);

    // Second story extension
    var secondGeom = new THREE.BoxGeometry(14, 10, 12);
    var secondMesh = addMesh(secondGeom, lightMat, 40, 14, 0);

    // Roof peaks
    var roof1 = new THREE.ConeGeometry(3, 6, 4);
    addMesh(roof1, stoneMat, 40 - 5, 18, -6);

    var roof2 = new THREE.ConeGeometry(3, 6, 4);
    addMesh(roof2, stoneMat, 40 + 5, 18, -6);

    // Tavern sign hanging board
    var signGeom = new THREE.BoxGeometry(6, 3, 0.3);
    addMesh(signGeom, darkMat, 48, 14, 0);

    var signPost = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
    addMesh(signPost, lightMat, 50, 12, 0);

    // Windows (lots of them for a multi-story building)
    var winMat = new THREE.MeshStandardMaterial({ color: colors.darkAsh });
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var winGeom = new THREE.BoxGeometry(2, 2, 0.2);
        addMesh(winGeom, winMat, 40 - 6 + i * 6, 6 + j * 7, -7);
        addMesh(winGeom, winMat, 40 - 6 + i * 6, 6 + j * 7, 7);
      }
    }

    // Door
    var doorGeom = new THREE.BoxGeometry(3, 5, 0.2);
    addMesh(doorGeom, colors.blood, 40, 2.5, -7);

    // Shutters (closed)
    var shutter = new THREE.BoxGeometry(1, 2, 0.1);
    addMesh(shutter, darkMat, 40 - 2, 7, -7.2);
    addMesh(shutter, darkMat, 40 + 2, 7, -7.2);
  }

  // Military checkpoint
  function buildMilitaryCheckpoint() {
    var woodMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var sandMat = new THREE.MeshStandardMaterial({ color: colors.ash });

    // Guard post structure
    var postGeom = new THREE.BoxGeometry(12, 6, 8);
    addMesh(postGeom, woodMat, -50, 3, 30);

    // Guard tower
    var towerGeom = new THREE.CylinderGeometry(3, 3.5, 8, 8);
    addMesh(towerGeom, sandMat, -50, 7, 30);

    // Gun ports (box shaped openings)
    var portGeom = new THREE.BoxGeometry(2, 2, 0.3);
    addMesh(portGeom, colors.darkStone, -50, 7, 33);
    addMesh(portGeom, colors.darkStone, -47, 7, 30);
    addMesh(portGeom, colors.darkStone, -53, 7, 30);

    // Sandbag fortifications
    var sandPositions = [
      { x: -45, z: 30 },
      { x: -55, z: 30 },
      { x: -50, z: 25 },
      { x: -50, z: 35 },
      { x: -48, z: 32 },
      { x: -52, z: 32 }
    ];

    for (var i = 0; i < sandPositions.length; i++) {
      var pos = sandPositions[i];
      var sandgeom = new THREE.BoxGeometry(2, 1.5, 2);
      addMesh(sandgeom, sandMat, pos.x, 1, pos.z);
    }

    // Barbed wire (line segments)
    var wirePositions = [
      -45, 6, 30, -55, 6, 30,
      -45, 6, 35, -55, 6, 35
    ];
    var wireGeom = new THREE.BufferGeometry();
    wireGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePositions), 3));
    var wireMat = new THREE.LineBasicMaterial({ color: 0x333333 });
    var wire = new THREE.LineSegments(wireGeom, wireMat);
    scene.add(wire);
    objects.push(wire);
  }

  // Plague doctor's house
  function buildPlagueDoctor() {
    var darkMat = new THREE.MeshStandardMaterial({ color: colors.darkWood });
    var lightMat = new THREE.MeshStandardMaterial({ color: colors.lightWood });

    // Main building
    var buildingGeom = new THREE.BoxGeometry(12, 11, 10);
    addMesh(buildingGeom, darkMat, 20, 5.5, -35);

    // Roof
    var roofGeom = new THREE.ConeGeometry(3.5, 5, 4);
    addMesh(roofGeom, lightMat, 20, 13, -35);

    // Large red X marking plague house
    var xMat = new THREE.MeshStandardMaterial({ color: colors.blood });

    var xBar1 = new THREE.BoxGeometry(0.5, 8, 0.2);
    var x1mesh = addMesh(xBar1, xMat, 20 - 2, 7, -35);
    x1mesh.rotation.z = 0.4;

    var xBar2 = new THREE.BoxGeometry(0.5, 8, 0.2);
    var x2mesh = addMesh(xBar2, xMat, 20 + 2, 7, -35);
    x2mesh.rotation.z = -0.4;

    // Warning symbol
    var symbolGeom = new THREE.SphereGeometry(1, 6, 6);
    addMesh(symbolGeom, xMat, 20, 10, -35);

    // Door (sealed)
    var doorGeom = new THREE.BoxGeometry(3, 4, 0.2);
    addMesh(doorGeom, colors.darkAsh, 20, 2, -40);

    // Sealed mark (X on door)
    var sealBar1 = new THREE.BoxGeometry(0.3, 3.5, 0.1);
    addMesh(sealBar1, xMat, 20 - 1, 2, -40.2);

    var sealBar2 = new THREE.BoxGeometry(0.3, 3.5, 0.1);
    addMesh(sealBar2, xMat, 20 + 1, 2, -40.2);
  }

  // Fog effect with drifting spheres
  function buildFogEffect() {
    var fogMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.15,
      emissive: 0x444444,
      emissiveIntensity: 0.2
    });

    // Distribute fog spheres across the ground level
    for (var x = -40; x < 40; x += 10) {
      for (var z = -40; z < 40; z += 10) {
        for (var i = 0; i < 2; i++) {
          var fogGeom = new THREE.SphereGeometry(5 + Math.random() * 3, 4, 4);
          var offsetX = x + (Math.random() - 0.5) * 8;
          var offsetZ = z + (Math.random() - 0.5) * 8;
          var offsetY = 1 + Math.random() * 2;

          var fogMesh = addMesh(fogGeom, fogMat, offsetX, offsetY, offsetZ);
          fogSpheres.push({
            mesh: fogMesh,
            baseX: offsetX,
            baseZ: offsetZ,
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.3
          });
        }
      }
    }
  }

  // Crow perches on roofs and signs
  function buildCrowPerches() {
    var crowMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    var perchPositions = [
      { x: -35, z: -35, h: 14 },
      { x: 35, z: -35, h: 14 },
      { x: -35, z: 35, h: 14 },
      { x: 35, z: 35, h: 14 },
      { x: -40, z: 0, h: 30 },
      { x: 40, z: 15, h: 15 },
      { x: 48, z: 0, h: 14 },
      { x: 20, z: -35, h: 10 },
      { x: -50, z: 30, h: 9 }
    ];

    for (var i = 0; i < perchPositions.length; i++) {
      var perch = perchPositions[i];
      for (var j = 0; j < 2; j++) {
        var crowGeom = new THREE.SphereGeometry(0.4, 4, 4);
        var crowMesh = addMesh(crowGeom, crowMat, perch.x + (j - 0.5) * 2, perch.h + 1, perch.z);
        crowPerches.push({
          mesh: crowMesh,
          baseY: perch.h + 1,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  // Update function for animations
  function update(delta) {
    var time = (typeof performance !== 'undefined') ? performance.now() * 0.001 : 0;

    // Animate bonfire flicker and sway
    for (var i = 0; i < bonefireObjs.length; i++) {
      var obj = bonefireObjs[i];
      var offset = animationOffsets[i];

      // Flicker intensity
      var flicker = 0.95 + Math.sin(time * 8 + offset) * 0.1;
      obj.scale.y = flicker;

      // Slight sway
      var sway = Math.sin(time * 2 + offset) * 0.3;
      obj.position.x += sway * delta;
    }

    // Animate fog spheres drifting
    for (var j = 0; j < fogSpheres.length; j++) {
      var fog = fogSpheres[j];
      var driftX = Math.sin(time * fog.speed + fog.phase) * 8;
      var driftZ = Math.cos(time * fog.speed + fog.phase) * 8;
      fog.mesh.position.x = fog.baseX + driftX;
      fog.mesh.position.z = fog.baseZ + driftZ;
    }

    // Animate crows bobbing on perches
    for (var k = 0; k < crowPerches.length; k++) {
      var crow = crowPerches[k];
      var bob = Math.sin(time * 3 + crow.phase) * 0.3;
      crow.mesh.position.y = crow.baseY + bob;
      crow.mesh.rotation.z = Math.sin(time * 2 + crow.phase) * 0.1;
    }
  }

  // Reset function
  function reset() {
    // Remove all objects from scene
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        if (Array.isArray(objects[i].material)) {
          for (var j = 0; j < objects[i].material.length; j++) {
            objects[i].material[j].dispose();
          }
        } else {
          objects[i].material.dispose();
        }
      }
    }

    objects = [];
    fogSpheres = [];
    crowPerches = [];
    bonefireObjs = [];
    animationOffsets = [];

    scene = null;
    camera = null;
  }

  // Public API
  return {
    init: init,
    update: update,
    reset: reset
  };
}());
