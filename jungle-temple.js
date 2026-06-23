window.JungleTemple = (function() {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    player: null,

    // Key tracking for J+T simultaneous activation (within 400ms)
    jKeyDown: false,
    tKeyDown: false,
    eKeyDown: false,
    jKeyTime: 0,
    tKeyTime: 0,

    // Temple meshes
    pyramidTiers: [],
    entranceArch: null,
    corridor: null,
    wallMeshes: [],
    floorMesh: null,
    apexPedestal: null,

    // Jungle environment
    treeMeshes: [],
    vineMeshes: [],
    fogBackup: null,
    bgBackup: null,

    // Traps
    traps: [],          // { type, mesh, mechanism, triggered, disarmed, disarmProgress, disarmAnimTimer, x, y, z, projectiles, nextFireTime }
    activeTraps: 0,

    // Guardians
    guardians: [],      // { mesh, mask, spear, hp, active, alcoveMesh, x, y, z, lastThrowTime, rocks }

    // Golden idol
    idolMesh: null,
    idolTaken: false,
    idolPedestalMesh: null,

    // Treasure room
    chestMesh: null,
    jewels: [],         // { mesh, color, name, taken }
    treasuresTaken: 0,
    treasuresTotal: 3,

    // Puzzle
    pressurePlates: [], // { mesh, glyphMesh, index, activated, activatedOrder }
    correctSequence: [0, 2, 1],
    currentSequence: [],
    sealedDoor: null,
    doorOpen: false,

    // Escape
    escapeTimer: 0,
    escaping: false,
    escapeClosed: false,
    closingWalls: [],

    // Player state
    playerHP: 100,
    score: 0,

    // HUD
    hudElement: null,

    // Messages
    elapsedTime: 0
  };

  // ─── Constants ────────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW   = 0.4;   // seconds
  var DISARM_RANGE        = 1.0;   // units
  var DISARM_TIME         = 5.0;   // seconds
  var SPIKE_DAMAGE        = 50;
  var BOULDER_SPEED       = 8;     // units/s
  var DART_SPEED          = 15;    // units/s
  var DART_DAMAGE         = 30;
  var DART_INTERVAL       = 4.0;   // seconds
  var GUARDIAN_HP         = 100;
  var GUARDIAN_RANGE      = 15;
  var GUARDIAN_THROW_CD   = 3.0;   // seconds
  var ESCAPE_TIME         = 60;    // seconds
  var TREE_COUNT          = 30;
  var SCORE_DISARM        = 100;
  var SCORE_JEWEL         = 200;

  // ─── Keyboard Handlers ───────────────────────────────────────────────────
  function onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    var now = state.elapsedTime;

    if (key === 'j') {
      state.jKeyDown = true;
      state.jKeyTime = now;
    }
    if (key === 't') {
      state.tKeyDown = true;
      state.tKeyTime = now;
    }
    if (key === 'e') {
      state.eKeyDown = true;
      tryInteract();
    }

    // J+T simultaneous within ACTIVATION_WINDOW
    if (state.jKeyDown && state.tKeyDown) {
      var diff = Math.abs(state.jKeyTime - state.tKeyTime);
      if (diff <= ACTIVATION_WINDOW) {
        if (state.active) {
          deactivateTemple();
        } else {
          activateTemple();
        }
      }
    }
  }

  function onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 'j') { state.jKeyDown = false; }
    if (key === 't') { state.tKeyDown = false; }
    if (key === 'e') { state.eKeyDown = false; }
  }

  // ─── Activation ──────────────────────────────────────────────────────────
  function activateTemple() {
    if (!state.scene) { return; }
    state.active = true;

    // Background and fog
    state.bgBackup = state.scene.background;
    state.fogBackup = state.scene.fog;
    state.scene.background = new THREE.Color(0x1A3A1A);
    state.scene.fog = new THREE.FogExp2(0x2A4A2A, 0.03);

    // Ambient light
    var ambLight = new THREE.AmbientLight(0x334433, 0.8);
    state.scene.add(ambLight);
    state._ambientLight = ambLight;

    // Build everything
    buildPyramid();
    buildEntrance();
    buildCorridor();
    buildJungle();
    buildTraps();
    buildGuardians();
    buildIdol();
    buildTreasureRoom();
    buildPuzzle();
    buildEscapeWalls();

    state.activeTraps = state.traps.length;

    showMessage('JUNGLE TEMPLE ACTIVATED — Find the Golden Idol! [J+T to exit]');
    updateHUD();
  }

  function deactivateTemple() {
    if (!state.scene) { return; }
    state.active = false;

    // Restore environment
    if (state.bgBackup !== undefined) { state.scene.background = state.bgBackup; }
    state.scene.fog = state.fogBackup;

    if (state._ambientLight) { state.scene.remove(state._ambientLight); state._ambientLight = null; }

    // Remove all temple meshes
    var i, j;
    for (i = 0; i < state.pyramidTiers.length; i++) { state.scene.remove(state.pyramidTiers[i]); }
    state.pyramidTiers = [];
    if (state.entranceArch) { state.scene.remove(state.entranceArch); state.entranceArch = null; }
    if (state.corridor) { state.scene.remove(state.corridor); state.corridor = null; }
    for (i = 0; i < state.wallMeshes.length; i++) { state.scene.remove(state.wallMeshes[i]); }
    state.wallMeshes = [];
    for (i = 0; i < state.treeMeshes.length; i++) { state.scene.remove(state.treeMeshes[i]); }
    state.treeMeshes = [];
    for (i = 0; i < state.vineMeshes.length; i++) { state.scene.remove(state.vineMeshes[i]); }
    state.vineMeshes = [];

    // Traps
    for (i = 0; i < state.traps.length; i++) {
      var trap = state.traps[i];
      if (trap.mesh) { state.scene.remove(trap.mesh); }
      if (trap.mechanism) { state.scene.remove(trap.mechanism); }
      if (trap.projectiles) {
        for (j = 0; j < trap.projectiles.length; j++) { state.scene.remove(trap.projectiles[j].mesh); }
      }
      if (trap.spikeGroup) { state.scene.remove(trap.spikeGroup); }
    }
    state.traps = [];

    // Guardians
    for (i = 0; i < state.guardians.length; i++) {
      var g = state.guardians[i];
      if (g.group) { state.scene.remove(g.group); }
      if (g.rocks) {
        for (j = 0; j < g.rocks.length; j++) { state.scene.remove(g.rocks[j].mesh); }
      }
    }
    state.guardians = [];

    // Idol
    if (state.idolMesh) { state.scene.remove(state.idolMesh); state.idolMesh = null; }
    if (state.idolPedestalMesh) { state.scene.remove(state.idolPedestalMesh); state.idolPedestalMesh = null; }

    // Treasure
    if (state.chestMesh) { state.scene.remove(state.chestMesh); state.chestMesh = null; }
    for (i = 0; i < state.jewels.length; i++) { state.scene.remove(state.jewels[i].mesh); }
    state.jewels = [];

    // Puzzle
    for (i = 0; i < state.pressurePlates.length; i++) {
      if (state.pressurePlates[i].mesh) { state.scene.remove(state.pressurePlates[i].mesh); }
      if (state.pressurePlates[i].glyphMesh) { state.scene.remove(state.pressurePlates[i].glyphMesh); }
    }
    state.pressurePlates = [];
    if (state.sealedDoor) { state.scene.remove(state.sealedDoor); state.sealedDoor = null; }

    // Escape walls
    for (i = 0; i < state.closingWalls.length; i++) { state.scene.remove(state.closingWalls[i].mesh); }
    state.closingWalls = [];

    updateHUD();
  }

  // ─── Pyramid (5-tier stepped) ─────────────────────────────────────────────
  // Tiers from bottom: 40x2x40, 32x2x32, 24x2x24, 16x2x16, 8x2x8
  function buildPyramid() {
    var tierSizes = [40, 32, 24, 16, 8];
    var mat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var i;
    for (i = 0; i < tierSizes.length; i++) {
      var s = tierSizes[i];
      var geo = new THREE.BoxGeometry(s, 2, s);
      var mesh = new THREE.Mesh(geo, mat);
      // Each tier sits on the one below; bottom tier at y=1 (center), next at y=3, etc.
      mesh.position.set(0, 1 + i * 2, 0);
      state.scene.add(mesh);
      state.pyramidTiers.push(mesh);
    }
  }

  // ─── Entrance Archway ────────────────────────────────────────────────────
  // 4x6x3 at base south side (z = +20 = south face of bottom tier)
  function buildEntrance() {
    var geo = new THREE.BoxGeometry(4, 6, 3);
    var mat = new THREE.MeshLambertMaterial({ color: 0x666655 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 3, 20);
    state.scene.add(mesh);
    state.entranceArch = mesh;
  }

  // ─── Interior Corridor ───────────────────────────────────────────────────
  // 3x4x30 running north into pyramid from entrance
  function buildCorridor() {
    var geo = new THREE.BoxGeometry(3, 4, 30);
    var mat = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var mesh = new THREE.Mesh(geo, mat);
    // Centered at z=5 (from z=20 entrance inward 30 units, center at z=20-15=5)
    mesh.position.set(0, 2, 5);
    state.scene.add(mesh);
    state.corridor = mesh;
    state.wallMeshes.push(mesh);
  }

  // ─── Jungle Environment ──────────────────────────────────────────────────
  function buildJungle() {
    var i;
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
    var canopyMat = new THREE.MeshLambertMaterial({ color: 0x2A6A2A });

    for (i = 0; i < TREE_COUNT; i++) {
      var group = new THREE.Group();
      var angle = (i / TREE_COUNT) * Math.PI * 2;
      var radius = 30 + Math.random() * 40;
      var tx = Math.cos(angle) * radius + (Math.random() - 0.5) * 20;
      var tz = Math.sin(angle) * radius + (Math.random() - 0.5) * 20;

      // Trunk (CylinderGeometry)
      var trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 6, 6);
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(0, 3, 0);
      group.add(trunk);

      // Canopy (SphereGeometry)
      var canopyGeo = new THREE.SphereGeometry(3 + Math.random() * 1.5, 7, 7);
      var canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(0, 7 + Math.random() * 2, 0);
      group.add(canopy);

      group.position.set(tx, 0, tz);
      state.scene.add(group);
      state.treeMeshes.push(group);
    }

    // Vines (LineSegments hanging)
    buildVines();
  }

  function buildVines() {
    var vineMat = new THREE.LineBasicMaterial({ color: 0x2A5A1A });
    var i, j;
    for (i = 0; i < 15; i++) {
      var vx = (Math.random() - 0.5) * 80;
      var vz = (Math.random() - 0.5) * 80;
      var points = [];
      var segCount = 5 + Math.floor(Math.random() * 4);
      for (j = 0; j < segCount; j++) {
        points.push(new THREE.Vector3(
          vx + (Math.random() - 0.5) * 0.5,
          12 - j * 1.5,
          vz + (Math.random() - 0.5) * 0.5
        ));
      }
      var geo = new THREE.BufferGeometry().setFromPoints(points);
      var vine = new THREE.LineSegments(geo, vineMat);
      state.scene.add(vine);
      state.vineMeshes.push(vine);
    }
  }

  // ─── Ancient Traps ───────────────────────────────────────────────────────
  function buildTraps() {
    // SPIKE TRAP — floor plate in corridor
    buildSpikeTrap(0, 0, 10);

    // ROLLING BOULDER — triggered by wall pressure plate in corridor
    buildBoulderTrap(-6, 2, 0);

    // DART TRAP — wall in corridor
    buildDartTrap(1.5, 2, 5);

    // PITFALL — thin floor in corridor
    buildPitfall(0, 0, -5);
  }

  function buildSpikeTrap(x, y, z) {
    // Floor plate (BoxGeometry)
    var plateGeo = new THREE.BoxGeometry(2, 0.1, 2);
    var plateMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(x, y + 0.05, z);
    state.scene.add(plate);

    // Mechanism marker (BoxGeometry 0xAA8844)
    var mechGeo = new THREE.BoxGeometry(0.4, 0.2, 0.4);
    var mechMat = new THREE.MeshLambertMaterial({ color: 0xAA8844 });
    var mech = new THREE.Mesh(mechGeo, mechMat);
    mech.position.set(x + 0.8, y + 0.1, z + 0.8);
    state.scene.add(mech);

    // Spike group (hidden initially)
    var spikeGroup = new THREE.Group();
    spikeGroup.position.set(x, y, z);
    spikeGroup.visible = false;
    var si;
    for (si = 0; si < 4; si++) {
      var sGeo = new THREE.CylinderGeometry(0.05, 0.1, 2, 5);
      var sMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
      var spike = new THREE.Mesh(sGeo, sMat);
      spike.position.set(
        (si % 2 === 0 ? -0.4 : 0.4),
        1,
        (si < 2 ? -0.4 : 0.4)
      );
      spikeGroup.add(spike);
    }
    state.scene.add(spikeGroup);

    state.traps.push({
      type: 'SPIKE',
      mesh: plate,
      mechanism: mech,
      spikeGroup: spikeGroup,
      triggered: false,
      disarmed: false,
      disarmProgress: 0,
      disarmAnimTimer: 0,
      x: x,
      y: y,
      z: z,
      spikeRisen: false,
      projectiles: []
    });
  }

  function buildBoulderTrap(x, y, z) {
    // Wall pressure plate
    var plateGeo = new THREE.BoxGeometry(0.2, 1, 0.5);
    var plateMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(x, y, z);
    state.scene.add(plate);

    // Mechanism marker
    var mechGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var mechMat = new THREE.MeshLambertMaterial({ color: 0xAA8844 });
    var mech = new THREE.Mesh(mechGeo, mechMat);
    mech.position.set(x, y + 0.6, z);
    state.scene.add(mech);

    // Boulder (SphereGeometry r=2)
    var boulderGeo = new THREE.SphereGeometry(2, 8, 8);
    var boulderMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var boulder = new THREE.Mesh(boulderGeo, boulderMat);
    boulder.position.set(0, 2, -15); // north end of corridor, rolls south
    boulder.visible = false;
    state.scene.add(boulder);

    state.traps.push({
      type: 'BOULDER',
      mesh: plate,
      mechanism: mech,
      boulder: boulder,
      triggered: false,
      disarmed: false,
      disarmProgress: 0,
      disarmAnimTimer: 0,
      x: x,
      y: y,
      z: z,
      rolling: false,
      projectiles: []
    });
  }

  function buildDartTrap(x, y, z) {
    // Wall hole marker
    var holeGeo = new THREE.BoxGeometry(0.2, 0.3, 0.3);
    var holeMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
    var hole = new THREE.Mesh(holeGeo, holeMat);
    hole.position.set(x, y, z);
    state.scene.add(hole);

    // Mechanism
    var mechGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var mechMat = new THREE.MeshLambertMaterial({ color: 0xAA8844 });
    var mech = new THREE.Mesh(mechGeo, mechMat);
    mech.position.set(x, y + 0.4, z);
    state.scene.add(mech);

    state.traps.push({
      type: 'DART',
      mesh: hole,
      mechanism: mech,
      triggered: false,
      disarmed: false,
      disarmProgress: 0,
      disarmAnimTimer: 0,
      x: x,
      y: y,
      z: z,
      nextFireTime: 0,
      projectiles: []
    });
  }

  function buildPitfall(x, y, z) {
    // Thin floor (BoxGeometry 0x444433)
    var pitGeo = new THREE.BoxGeometry(2.5, 0.05, 2.5);
    var pitMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
    var pit = new THREE.Mesh(pitGeo, pitMat);
    pit.position.set(x, y + 0.025, z);
    state.scene.add(pit);

    // Mechanism
    var mechGeo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
    var mechMat = new THREE.MeshLambertMaterial({ color: 0xAA8844 });
    var mech = new THREE.Mesh(mechGeo, mechMat);
    mech.position.set(x + 1.0, y + 0.1, z + 1.0);
    state.scene.add(mech);

    state.traps.push({
      type: 'PITFALL',
      mesh: pit,
      mechanism: mech,
      triggered: false,
      disarmed: false,
      disarmProgress: 0,
      disarmAnimTimer: 0,
      x: x,
      y: y,
      z: z,
      collapsed: false,
      projectiles: []
    });
  }

  // ─── Temple Guardians ─────────────────────────────────────────────────────
  function buildGuardians() {
    var i;
    var alcovePositions = [
      { x: -8,  y: 2, z: 8,   facing: 1  },
      { x:  8,  y: 2, z: 8,   facing: -1 },
      { x: -8,  y: 2, z: -8,  facing: 1  },
      { x:  8,  y: 2, z: -8,  facing: -1 },
      { x: -8,  y: 4, z: 4,   facing: 1  },
      { x:  8,  y: 4, z: 4,   facing: -1 },
      { x: -8,  y: 4, z: -4,  facing: 1  },
      { x:  8,  y: 4, z: -4,  facing: -1 }
    ];

    for (i = 0; i < 8; i++) {
      var pos = alcovePositions[i];
      var group = new THREE.Group();
      group.position.set(pos.x, pos.y, pos.z);

      // Body (BoxGeometry 0x4A3A2A)
      var bodyGeo = new THREE.BoxGeometry(1, 2, 0.5);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, 1, 0);
      group.add(body);

      // Mask overlay (BoxGeometry 0x8B0000)
      var maskGeo = new THREE.BoxGeometry(0.8, 0.7, 0.3);
      var maskMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
      var mask = new THREE.Mesh(maskGeo, maskMat);
      mask.position.set(0, 1.65, 0.25);
      group.add(mask);

      // Spear (LineSegments)
      var spearPts = [
        new THREE.Vector3(0.6, 0.5, 0),
        new THREE.Vector3(0.6, 2.5, 0)
      ];
      var spearGeo = new THREE.BufferGeometry().setFromPoints(spearPts);
      var spearMat = new THREE.LineBasicMaterial({ color: 0x8B6914 });
      var spear = new THREE.LineSegments(spearGeo, spearMat);
      group.add(spear);

      state.scene.add(group);

      state.guardians.push({
        group: group,
        body: body,
        mask: mask,
        hp: GUARDIAN_HP,
        active: false,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        lastThrowTime: 0,
        rocks: [],
        dead: false
      });
    }
  }

  // ─── Golden Idol ──────────────────────────────────────────────────────────
  // At pyramid apex (top tier center: y = 5*2 = 10, idol at y=11.5)
  function buildIdol() {
    // Pedestal
    var pedGeo = new THREE.BoxGeometry(1.5, 1, 1.5);
    var pedMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.set(0, 10.5, 0);
    state.scene.add(ped);
    state.idolPedestalMesh = ped;

    // Idol (BoxGeometry 1x1.5x0.6, 0xFFD700)
    var idolGeo = new THREE.BoxGeometry(1, 1.5, 0.6);
    var idolMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    var idol = new THREE.Mesh(idolGeo, idolMat);
    idol.position.set(0, 11.75, 0);
    state.scene.add(idol);
    state.idolMesh = idol;
    state.idolTaken = false;
  }

  // ─── Treasure Room ────────────────────────────────────────────────────────
  // At pyramid base level
  function buildTreasureRoom() {
    // Chest (BoxGeometry 0x8B6914)
    var chestGeo = new THREE.BoxGeometry(2, 1.2, 1.2);
    var chestMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(0, 0.6, -18);
    state.scene.add(chest);
    state.chestMesh = chest;

    // 3 jewels inside/around chest
    var jewelDefs = [
      { color: 0xAA0088, name: 'RUBY',     ox: -0.7 },
      { color: 0x0044FF, name: 'SAPPHIRE', ox: 0    },
      { color: 0x00AA44, name: 'EMERALD',  ox: 0.7  }
    ];
    var i;
    for (i = 0; i < 3; i++) {
      var jGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var jMat = new THREE.MeshLambertMaterial({ color: jewelDefs[i].color });
      var jMesh = new THREE.Mesh(jGeo, jMat);
      jMesh.position.set(jewelDefs[i].ox, 1.3, -18);
      state.scene.add(jMesh);
      state.jewels.push({
        mesh: jMesh,
        color: jewelDefs[i].color,
        name: jewelDefs[i].name,
        taken: false
      });
    }
  }

  // ─── Ancient Puzzle ───────────────────────────────────────────────────────
  // 3 pressure plates + wall glyphs; correct order [0,2,1]
  function buildPuzzle() {
    var platePositions = [
      { x: -3, y: 0, z: 12 },
      { x:  0, y: 0, z: 12 },
      { x:  3, y: 0, z: 12 }
    ];
    var i;
    for (i = 0; i < 3; i++) {
      var pos = platePositions[i];
      // Pressure plate (BoxGeometry 0x888866)
      var pGeo = new THREE.BoxGeometry(1.5, 0.1, 1.5);
      var pMat = new THREE.MeshLambertMaterial({ color: 0x888866 });
      var pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(pos.x, pos.y + 0.05, pos.z);
      state.scene.add(pMesh);

      // Wall glyph (LineSegments) above plate
      var glyphPts = buildGlyphPoints(i, pos.x, 2.5, pos.z);
      var glyphGeo = new THREE.BufferGeometry().setFromPoints(glyphPts);
      var glyphMat = new THREE.LineBasicMaterial({ color: 0xCCAA44 });
      var glyphMesh = new THREE.LineSegments(glyphGeo, glyphMat);
      state.scene.add(glyphMesh);

      state.pressurePlates.push({
        mesh: pMesh,
        glyphMesh: glyphMesh,
        index: i,
        activated: false
      });
    }

    // Sealed door (BoxGeometry)
    var doorGeo = new THREE.BoxGeometry(3, 4, 0.3);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
    state.sealedDoor = new THREE.Mesh(doorGeo, doorMat);
    state.sealedDoor.position.set(0, 2, -18.5);
    state.scene.add(state.sealedDoor);
    state.wallMeshes.push(state.sealedDoor);

    state.doorOpen = false;
    state.currentSequence = [];
  }

  function buildGlyphPoints(index, cx, cy, cz) {
    // Simple unique glyph per index using line segments
    var pts = [];
    if (index === 0) {
      // Roman-I style
      pts.push(new THREE.Vector3(cx, cy, cz));
      pts.push(new THREE.Vector3(cx, cy + 0.8, cz));
    } else if (index === 1) {
      // Cross style
      pts.push(new THREE.Vector3(cx - 0.3, cy + 0.4, cz));
      pts.push(new THREE.Vector3(cx + 0.3, cy + 0.4, cz));
      pts.push(new THREE.Vector3(cx, cy, cz));
      pts.push(new THREE.Vector3(cx, cy + 0.8, cz));
    } else {
      // Triangle style
      pts.push(new THREE.Vector3(cx - 0.3, cy, cz));
      pts.push(new THREE.Vector3(cx, cy + 0.8, cz));
      pts.push(new THREE.Vector3(cx, cy + 0.8, cz));
      pts.push(new THREE.Vector3(cx + 0.3, cy, cz));
    }
    return pts;
  }

  // ─── Escape Walls ─────────────────────────────────────────────────────────
  // BoxGeometry walls that slide together after idol taken
  function buildEscapeWalls() {
    var wallDefs = [
      { x: -22, y: 5, z: 0, w: 0.5, h: 10, d: 44 },  // west wall
      { x:  22, y: 5, z: 0, w: 0.5, h: 10, d: 44 },  // east wall
      { x: 0, y: 5, z: -22, w: 44, h: 10, d: 0.5 },  // north wall
      { x: 0, y: 5, z:  22, w: 44, h: 10, d: 0.5 }   // south wall
    ];
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var i;
    for (i = 0; i < wallDefs.length; i++) {
      var wd = wallDefs[i];
      var geo = new THREE.BoxGeometry(wd.w, wd.h, wd.d);
      var mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(wd.x, wd.y, wd.z);
      mesh.visible = false;
      state.scene.add(mesh);
      state.closingWalls.push({
        mesh: mesh,
        startX: wd.x,
        startZ: wd.z,
        targetX: 0,
        targetZ: 0
      });
    }
  }

  // ─── Interaction ──────────────────────────────────────────────────────────
  function tryInteract() {
    if (!state.active || !state.player) { return; }
    var px = state.player.position.x;
    var py = state.player.position.y;
    var pz = state.player.position.z;

    // Check idol pickup
    tryPickupIdol(px, py, pz);

    // Check jewel pickups
    tryPickupJewels(px, py, pz);

    // Check trap disarm
    tryDisarmTrap(px, py, pz);

    // Check puzzle pressure plates
    tryPressurePlate(px, py, pz);
  }

  function tryPickupIdol(px, py, pz) {
    if (state.idolTaken || !state.idolMesh) { return; }
    var ix = state.idolMesh.position.x;
    var iy = state.idolMesh.position.y;
    var iz = state.idolMesh.position.z;
    var dx = px - ix;
    var dy = py - iy;
    var dz = pz - iz;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 3) {
      pickupIdol();
    }
  }

  function pickupIdol() {
    state.idolTaken = true;
    state.scene.remove(state.idolMesh);
    state.idolMesh = null;

    showMessage('GOLDEN IDOL TAKEN! ESCAPE IN 60 SECONDS! ALL TRAPS ACTIVATED!');

    // Activate all remaining traps simultaneously
    var i;
    for (i = 0; i < state.traps.length; i++) {
      if (!state.traps[i].disarmed && !state.traps[i].triggered) {
        state.traps[i].triggered = true;
        triggerTrap(state.traps[i]);
      }
    }

    // 5 guardians rush from walls
    var rushCount = 0;
    for (i = 0; i < state.guardians.length && rushCount < 5; i++) {
      if (!state.guardians[i].dead) {
        state.guardians[i].active = true;
        rushCount++;
      }
    }

    // Start escape timer
    state.escaping = true;
    state.escapeTimer = ESCAPE_TIME;

    // Show closing walls
    for (i = 0; i < state.closingWalls.length; i++) {
      state.closingWalls[i].mesh.visible = true;
    }

    updateHUD();
  }

  function tryPickupJewels(px, py, pz) {
    var i;
    for (i = 0; i < state.jewels.length; i++) {
      var j = state.jewels[i];
      if (j.taken) { continue; }
      var dx = px - j.mesh.position.x;
      var dy = py - j.mesh.position.y;
      var dz = pz - j.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 2) {
        j.taken = true;
        state.scene.remove(j.mesh);
        state.treasuresTaken++;
        state.score += SCORE_JEWEL;
        showMessage('TREASURE FOUND: ' + j.name + ' +' + SCORE_JEWEL + ' SCORE!');
        updateHUD();
      }
    }
  }

  function tryDisarmTrap(px, py, pz) {
    var i;
    for (i = 0; i < state.traps.length; i++) {
      var trap = state.traps[i];
      if (trap.disarmed || !trap.mechanism) { continue; }
      var mx = trap.mechanism.position.x;
      var my = trap.mechanism.position.y;
      var mz = trap.mechanism.position.z;
      var dx = px - mx;
      var dy = py - my;
      var dz = pz - mz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= DISARM_RANGE) {
        if (trap.disarmProgress <= 0) {
          trap.disarmProgress = 0.001; // begin disarm
          trap.disarmAnimTimer = DISARM_TIME;
          showMessage('DISARMING... hold E for 5 seconds');
        }
      }
    }
  }

  function tryPressurePlate(px, py, pz) {
    var i;
    for (i = 0; i < state.pressurePlates.length; i++) {
      var plate = state.pressurePlates[i];
      if (plate.activated) { continue; }
      var ppx = plate.mesh.position.x;
      var ppz = plate.mesh.position.z;
      var dx = px - ppx;
      var dz = pz - ppz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.2) {
        activatePressurePlate(i);
      }
    }
  }

  function activatePressurePlate(plateIdx) {
    var plate = state.pressurePlates[plateIdx];
    if (plate.activated) { return; }
    plate.activated = true;

    // Visual feedback: darken plate
    if (plate.mesh.material) {
      plate.mesh.material.color.setHex(0x555544);
    }

    state.currentSequence.push(plateIdx);

    // Check correct sequence
    var correct = true;
    var i;
    for (i = 0; i < state.currentSequence.length; i++) {
      if (state.currentSequence[i] !== state.correctSequence[i]) {
        correct = false;
        break;
      }
    }

    if (!correct) {
      // Wrong order: fire boulder trap
      showMessage('WRONG SEQUENCE! BOULDER TRAP ACTIVATED!');
      var bi;
      for (bi = 0; bi < state.traps.length; bi++) {
        if (state.traps[bi].type === 'BOULDER' && !state.traps[bi].triggered && !state.traps[bi].disarmed) {
          state.traps[bi].triggered = true;
          triggerTrap(state.traps[bi]);
          break;
        }
      }
      // Reset sequence
      var ri;
      for (ri = 0; ri < state.pressurePlates.length; ri++) {
        state.pressurePlates[ri].activated = false;
        if (state.pressurePlates[ri].mesh.material) {
          state.pressurePlates[ri].mesh.material.color.setHex(0x888866);
        }
      }
      state.currentSequence = [];
      return;
    }

    if (state.currentSequence.length === state.correctSequence.length) {
      // Correct! Open sealed door
      openSealedDoor();
    } else {
      showMessage('Plate ' + (plateIdx + 1) + ' activated — ' + state.currentSequence.length + '/3');
    }
  }

  function openSealedDoor() {
    state.doorOpen = true;
    if (state.sealedDoor) {
      state.sealedDoor.visible = false;
    }
    showMessage('ANCIENT DOOR OPENS — treasure room accessible!');
    updateHUD();
  }

  // ─── Trap Triggering ─────────────────────────────────────────────────────
  function triggerTrap(trap) {
    if (trap.type === 'SPIKE') {
      triggerSpikeTrap(trap);
    } else if (trap.type === 'BOULDER') {
      triggerBoulderTrap(trap);
    } else if (trap.type === 'DART') {
      // Dart fires on interval, mark as active
      trap.nextFireTime = state.elapsedTime + 0.1;
    } else if (trap.type === 'PITFALL') {
      triggerPitfall(trap);
    }
    updateActiveTraps();
  }

  function triggerSpikeTrap(trap) {
    if (trap.spikeGroup) {
      trap.spikeGroup.visible = true;
      trap.spikeRisen = true;
    }
    damagePlayer(SPIKE_DAMAGE, 'SPIKE TRAP! -' + SPIKE_DAMAGE + ' HP!');
  }

  function triggerBoulderTrap(trap) {
    if (trap.boulder) {
      trap.boulder.visible = true;
      trap.rolling = true;
    }
    showMessage('BOULDER ROLLING DOWN CORRIDOR!');
  }

  function triggerPitfall(trap) {
    if (trap.mesh) {
      trap.mesh.visible = false;
    }
    trap.collapsed = true;
    damagePlayer(20, 'PITFALL! Falling to lower level! -20 HP');
    // Move player down
    if (state.player) {
      state.player.position.y -= 4;
    }
  }

  function updateActiveTraps() {
    var count = 0;
    var i;
    for (i = 0; i < state.traps.length; i++) {
      if (!state.traps[i].disarmed && !state.traps[i].triggered) {
        count++;
      }
    }
    // Dart traps count as active even when triggered (continuous)
    for (i = 0; i < state.traps.length; i++) {
      if (state.traps[i].type === 'DART' && state.traps[i].triggered && !state.traps[i].disarmed) {
        count++;
      }
    }
    state.activeTraps = count;
  }

  // ─── Update Traps ─────────────────────────────────────────────────────────
  function updateTraps(delta) {
    var i, j;
    for (i = 0; i < state.traps.length; i++) {
      var trap = state.traps[i];

      // Disarm animation
      if (trap.disarmProgress > 0 && trap.disarmProgress < 1 && !trap.disarmed) {
        if (state.eKeyDown) {
          trap.disarmAnimTimer -= delta;
          trap.disarmProgress = 1 - (trap.disarmAnimTimer / DISARM_TIME);
          if (trap.mechanism) {
            trap.mechanism.rotation.y += delta * 2;
          }
          if (trap.disarmAnimTimer <= 0) {
            completeDismarm(trap);
          }
        } else {
          // E released, reset progress
          trap.disarmProgress = 0;
          trap.disarmAnimTimer = 0;
          if (trap.mechanism) { trap.mechanism.rotation.y = 0; }
        }
        continue;
      }

      if (trap.disarmed || (!trap.triggered && trap.type !== 'DART')) { continue; }

      // Check proximity triggers for untriggered non-dart traps
      if (!trap.triggered && trap.type !== 'DART') {
        checkTrapProximity(trap);
      }

      // Boulder rolling
      if (trap.type === 'BOULDER' && trap.rolling && trap.boulder) {
        trap.boulder.position.z += BOULDER_SPEED * delta;
        // Check player collision
        if (state.player) {
          var bx = trap.boulder.position.x - state.player.position.x;
          var bz = trap.boulder.position.z - state.player.position.z;
          var bdist = Math.sqrt(bx * bx + bz * bz);
          if (bdist < 2.5) {
            damagePlayer(state.playerHP, 'CRUSHED BY BOULDER! INSTANT KILL!');
          }
        }
        // Remove if past corridor end
        if (trap.boulder.position.z > 25) {
          trap.boulder.visible = false;
          trap.rolling = false;
        }
      }

      // Dart firing
      if (trap.type === 'DART' && trap.triggered && !trap.disarmed) {
        if (state.elapsedTime >= trap.nextFireTime) {
          fireDart(trap);
          trap.nextFireTime = state.elapsedTime + DART_INTERVAL;
        }
      }

      // Update dart projectiles
      if (trap.projectiles) {
        var toRemove = [];
        for (j = 0; j < trap.projectiles.length; j++) {
          var proj = trap.projectiles[j];
          proj.mesh.position.x += proj.vx * delta;
          proj.mesh.position.z += proj.vz * delta;
          proj.life -= delta;

          // Hit player check
          if (state.player) {
            var pdx = proj.mesh.position.x - state.player.position.x;
            var pdz = proj.mesh.position.z - state.player.position.z;
            var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
            if (pdist < 1) {
              damagePlayer(DART_DAMAGE, 'DART HIT! -' + DART_DAMAGE + ' HP!');
              state.scene.remove(proj.mesh);
              toRemove.push(j);
              continue;
            }
          }

          if (proj.life <= 0) {
            state.scene.remove(proj.mesh);
            toRemove.push(j);
          }
        }
        for (j = toRemove.length - 1; j >= 0; j--) {
          trap.projectiles.splice(toRemove[j], 1);
        }
      }
    }
  }

  function checkTrapProximity(trap) {
    if (!state.player) { return; }
    var px = state.player.position.x;
    var pz = state.player.position.z;
    var dx = px - trap.x;
    var dz = pz - trap.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 1.5) {
      trap.triggered = true;
      triggerTrap(trap);
    }
  }

  function fireDart(trap) {
    // CylinderGeometry dart (0x886644)
    var dartGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 5);
    var dartMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var dart = new THREE.Mesh(dartGeo, dartMat);
    dart.rotation.x = Math.PI / 2;
    dart.position.set(trap.x, trap.y, trap.z);
    state.scene.add(dart);

    // Fire toward player (or straight if no player)
    var vx = 0;
    var vz = -DART_SPEED; // default: fire north
    if (state.player) {
      var dx = state.player.position.x - trap.x;
      var dz = state.player.position.z - trap.z;
      var len = Math.sqrt(dx * dx + dz * dz);
      if (len > 0) {
        vx = (dx / len) * DART_SPEED;
        vz = (dz / len) * DART_SPEED;
      }
    }

    trap.projectiles.push({ mesh: dart, vx: vx, vz: vz, life: 3.0 });
  }

  function completeDismarm(trap) {
    trap.disarmed = true;
    trap.disarmProgress = 1;
    if (trap.mechanism) {
      trap.mechanism.material.color.setHex(0x44AA44);
    }
    // Disable trap
    if (trap.type === 'SPIKE' && trap.spikeGroup) {
      trap.spikeGroup.visible = false;
    }
    if (trap.type === 'BOULDER' && trap.boulder) {
      trap.boulder.visible = false;
      trap.rolling = false;
    }
    if (trap.type === 'DART') {
      // Clear projectiles
      var i;
      if (trap.projectiles) {
        for (i = 0; i < trap.projectiles.length; i++) {
          state.scene.remove(trap.projectiles[i].mesh);
        }
        trap.projectiles = [];
      }
    }
    state.score += SCORE_DISARM;
    showMessage('TRAP DISARMED! +' + SCORE_DISARM + ' SCORE');
    updateActiveTraps();
    updateHUD();
  }

  // ─── Guardian Update ──────────────────────────────────────────────────────
  function updateGuardians(delta) {
    if (!state.player) { return; }
    var px = state.player.position.x;
    var py = state.player.position.y;
    var pz = state.player.position.z;
    var i, j;

    for (i = 0; i < state.guardians.length; i++) {
      var g = state.guardians[i];
      if (g.dead) { continue; }

      // Activate on proximity
      if (!g.active) {
        var adx = px - g.x;
        var adz = pz - g.z;
        var adist = Math.sqrt(adx * adx + adz * adz);
        if (adist < GUARDIAN_RANGE) {
          g.active = true;
        }
        continue;
      }

      // Move toward player
      var gdx = px - g.group.position.x;
      var gdz = pz - g.group.position.z;
      var gdist = Math.sqrt(gdx * gdx + gdz * gdz);
      if (gdist > 2) {
        var speed = 2.0;
        g.group.position.x += (gdx / gdist) * speed * delta;
        g.group.position.z += (gdz / gdist) * speed * delta;
        g.group.position.y += 0; // keep at y
      }

      // Face player
      if (gdist > 0.1) {
        g.group.rotation.y = Math.atan2(gdx, gdz);
      }

      // Throw rock
      var now = state.elapsedTime;
      if (now - g.lastThrowTime >= GUARDIAN_THROW_CD && gdist < GUARDIAN_RANGE) {
        g.lastThrowTime = now;
        throwRock(g, px, py, pz);
      }

      // Update flying rocks
      if (g.rocks) {
        var toRemove = [];
        for (j = 0; j < g.rocks.length; j++) {
          var rock = g.rocks[j];
          rock.mesh.position.x += rock.vx * delta;
          rock.mesh.position.y += rock.vy * delta;
          rock.mesh.position.z += rock.vz * delta;
          rock.vy -= 9.8 * delta; // gravity
          rock.life -= delta;

          // Hit player
          var rdx = rock.mesh.position.x - px;
          var rdy = rock.mesh.position.y - py;
          var rdz = rock.mesh.position.z - pz;
          var rdist = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);
          if (rdist < 1.2) {
            damagePlayer(15, 'GUARDIAN ROCK! -15 HP!');
            state.scene.remove(rock.mesh);
            toRemove.push(j);
            continue;
          }

          if (rock.life <= 0) {
            state.scene.remove(rock.mesh);
            toRemove.push(j);
          }
        }
        for (j = toRemove.length - 1; j >= 0; j--) {
          g.rocks.splice(toRemove[j], 1);
        }
      }
    }
  }

  function throwRock(guardian, tx, ty, tz) {
    // SphereGeometry rock (0x8B6914)
    var rGeo = new THREE.SphereGeometry(0.2, 5, 5);
    var rMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.position.set(
      guardian.group.position.x,
      guardian.group.position.y + 2,
      guardian.group.position.z
    );
    state.scene.add(rMesh);

    var dx = tx - guardian.group.position.x;
    var dy = ty - guardian.group.position.y;
    var dz = tz - guardian.group.position.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var speed = 8;
    if (dist < 0.01) { dist = 0.01; }

    guardian.rocks.push({
      mesh: rMesh,
      vx: (dx / dist) * speed,
      vy: 3,
      vz: (dz / dist) * speed,
      life: 4.0
    });
  }

  // ─── Escape Update ────────────────────────────────────────────────────────
  function updateEscape(delta) {
    if (!state.escaping) { return; }

    state.escapeTimer -= delta;

    if (state.escapeTimer <= 0 && !state.escapeClosed) {
      state.escapeClosed = true;
      showMessage('TIME\'S UP! THE TEMPLE HAS SEALED! GAME OVER!');
      // Collapse walls to center
      var i;
      for (i = 0; i < state.closingWalls.length; i++) {
        state.closingWalls[i].mesh.position.x = 0;
        state.closingWalls[i].mesh.position.z = 0;
      }
      damagePlayer(state.playerHP, 'CRUSHED BY TEMPLE WALLS!');
    }

    // Animate walls sliding inward
    if (!state.escapeClosed) {
      var progress = 1 - Math.max(0, state.escapeTimer / ESCAPE_TIME);
      var i;
      for (i = 0; i < state.closingWalls.length; i++) {
        var cw = state.closingWalls[i];
        cw.mesh.position.x = cw.startX * (1 - progress);
        cw.mesh.position.z = cw.startZ * (1 - progress);
      }
    }
  }

  // ─── Player Damage ────────────────────────────────────────────────────────
  function damagePlayer(amount, message) {
    state.playerHP = Math.max(0, state.playerHP - amount);
    if (state.player) {
      if (state.player.hp !== undefined) { state.player.hp = state.playerHP; }
      if (state.player.takeDamage) { state.player.takeDamage(amount); }
    }
    showMessage(message);
    updateHUD();
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────
  function createHUD() {
    if (state.hudElement) { return; }
    var el = document.createElement('div');
    el.id = 'jungle-temple-hud';
    el.style.position = 'fixed';
    el.style.top = '16px';
    el.style.right = '16px';
    el.style.color = '#DDBB44';
    el.style.fontFamily = 'monospace';
    el.style.fontSize = '13px';
    el.style.background = 'rgba(0,0,0,0.65)';
    el.style.padding = '6px 14px';
    el.style.borderRadius = '4px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.whiteSpace = 'nowrap';
    el.style.display = 'none';
    document.body.appendChild(el);
    state.hudElement = el;
  }

  function updateHUD() {
    if (!state.hudElement) { return; }
    if (!state.active) {
      state.hudElement.style.display = 'none';
      return;
    }
    state.hudElement.style.display = 'block';

    // Count active guardians
    var activeGuardians = 0;
    var i;
    for (i = 0; i < state.guardians.length; i++) {
      if (!state.guardians[i].dead) { activeGuardians++; }
    }

    var idolStr = state.idolTaken ? 'TAKEN' : 'NOT TAKEN';
    var escapeStr = '';
    if (state.escaping) {
      var secs = Math.max(0, Math.ceil(state.escapeTimer));
      var mm = Math.floor(secs / 60);
      var ss = secs % 60;
      escapeStr = ' | ESCAPE: ' + (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
    }

    state.hudElement.textContent =
      'TEMPLE [TRAPS: ' + state.activeTraps + ' ACTIVE] ' +
      '[GUARDIANS: ' + activeGuardians + '] ' +
      '[TREASURES: ' + state.treasuresTaken + '/' + state.treasuresTotal + '] ' +
      '[IDOL: ' + idolStr + ']' +
      escapeStr;
  }

  // ─── Messages ─────────────────────────────────────────────────────────────
  var _msgEl = null;
  var _msgTimer = 0;

  function showMessage(text) {
    if (!_msgEl) {
      _msgEl = document.createElement('div');
      _msgEl.style.position = 'fixed';
      _msgEl.style.bottom = '80px';
      _msgEl.style.left = '50%';
      _msgEl.style.transform = 'translateX(-50%)';
      _msgEl.style.color = '#FFEE44';
      _msgEl.style.fontFamily = 'monospace';
      _msgEl.style.fontSize = '15px';
      _msgEl.style.fontWeight = 'bold';
      _msgEl.style.background = 'rgba(0,0,0,0.75)';
      _msgEl.style.padding = '8px 20px';
      _msgEl.style.borderRadius = '4px';
      _msgEl.style.pointerEvents = 'none';
      _msgEl.style.zIndex = '10000';
      document.body.appendChild(_msgEl);
    }
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    _msgTimer = 3.0;
  }

  function updateMessages(delta) {
    if (_msgEl && _msgTimer > 0) {
      _msgTimer -= delta;
      if (_msgTimer <= 0) {
        _msgEl.style.display = 'none';
      }
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  function init(scene, camera, player) {
    state.scene  = scene;
    state.camera = camera;
    state.player = player;

    if (player && player.hp !== undefined) {
      state.playerHP = player.hp;
    }

    createHUD();

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup',   onKeyUp,   false);

    updateHUD();
  }

  function update(delta) {
    if (!delta || delta <= 0) { delta = 0.016; }
    state.elapsedTime += delta;

    updateMessages(delta);

    if (!state.active) { return; }

    // Sync player HP
    if (state.player && state.player.hp !== undefined) {
      state.playerHP = state.player.hp;
    }

    updateTraps(delta);
    updateGuardians(delta);
    updateEscape(delta);
    updateHUD();
  }

  function reset() {
    if (state.active) { deactivateTemple(); }

    document.removeEventListener('keydown', onKeyDown, false);
    document.removeEventListener('keyup',   onKeyUp,   false);

    if (state.hudElement && state.hudElement.parentNode) {
      state.hudElement.parentNode.removeChild(state.hudElement);
      state.hudElement = null;
    }
    if (_msgEl && _msgEl.parentNode) {
      _msgEl.parentNode.removeChild(_msgEl);
      _msgEl = null;
    }

    state.active           = false;
    state.jKeyDown         = false;
    state.tKeyDown         = false;
    state.eKeyDown         = false;
    state.jKeyTime         = 0;
    state.tKeyTime         = 0;
    state.pyramidTiers     = [];
    state.treeMeshes       = [];
    state.vineMeshes       = [];
    state.traps            = [];
    state.guardians        = [];
    state.idolMesh         = null;
    state.idolTaken        = false;
    state.chestMesh        = null;
    state.jewels           = [];
    state.treasuresTaken   = 0;
    state.pressurePlates   = [];
    state.currentSequence  = [];
    state.doorOpen         = false;
    state.escapeTimer      = 0;
    state.escaping         = false;
    state.escapeClosed     = false;
    state.closingWalls     = [];
    state.playerHP         = 100;
    state.score            = 0;
    state.activeTraps      = 0;
    state.elapsedTime      = 0;
    _msgTimer              = 0;
  }

  return {
    init:     init,
    update:   update,
    reset:    reset,
    getState: function() { return state; }
  };

})();
