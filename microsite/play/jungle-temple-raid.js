window.JungleTempleRaid = (function() {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,

    // Key tracking for J+T simultaneous activation (within 400ms)
    jKeyDown: false,
    tKeyDown: false,
    jKeyTime: 0,
    tKeyTime: 0,
    keysDown: {},

    // Environment meshes
    treeMeshes: [],
    vineMeshes: [],
    ruinMeshes: [],
    pathMeshes: [],
    bgBackup: null,
    fogBackup: null,

    // Temple entrance
    stoneDoor: null,
    doorOpen: false,
    pillars: [],
    hieroglyphMeshes: [],

    // Temple levels
    currentLevel: 0, // 0=exterior, 1=entry hall, 2=puzzle chamber, 3=inner sanctum
    levelMeshes: [],

    // Traps
    traps: [],
    trapsDisabled: false,

    // Pressure plates (5 plates, correct sequence)
    pressurePlates: [],
    correctSequence: [2, 0, 4, 1, 3],
    activatedSequence: [],
    platesActivated: 0,
    innerDoor: null,
    innerDoorOpen: false,

    // Mercenaries
    mercenaries: [],
    mercsAlive: 0,

    // Temple Guardian boss
    guardian: null,
    guardianHP: 500,
    guardianAlive: false,
    guardianShards: [],

    // Golden idol
    idolMesh: null,
    idolLight: null,
    idolPedestal: null,
    idolPickedUp: false,

    // Collapse countdown
    collapseActive: false,
    collapseTimer: 60,
    collapseDebris: [],

    // Player state
    playerHP: 100,
    playerPos: { x: 0, y: 1.7, z: 35 },
    playerVel: { x: 0, y: 0, z: 0 },
    onGround: true,
    isJumping: false,
    dodgeDir: 0,
    dodgeCooldown: 0,

    // HUD
    hudElement: null,
    messageElement: null,
    messageTimer: 0,

    // Game state
    gameOver: false,
    gameWon: false,
    elapsedTime: 0,

    // Lights
    ambientLight: null,
    pointLights: [],

    // Listeners
    _onKeyDown: null,
    _onKeyUp: null
  };

  // ─── Constants ────────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW   = 0.4;
  var PLAYER_SPEED        = 8;
  var JUMP_VEL            = 10;
  var GRAVITY             = -25;
  var DART_SPEED          = 18;
  var DART_DAMAGE         = 20;
  var DART_INTERVAL       = 3.0;
  var BOULDER_SPEED       = 12;
  var SPIKE_DAMAGE        = 40;
  var MERC_HP             = 80;
  var MERC_DAMAGE         = 15;
  var MERC_RANGE          = 30;
  var MERC_FIRE_CD        = 2.0;
  var MERC_MOVE_SPEED     = 3;
  var BOSS_HP             = 500;
  var BOSS_DAMAGE         = 60;
  var BOSS_RANGE          = 5;
  var BOSS_SPEED          = 1.5;
  var BOSS_ATTACK_CD      = 2.5;
  var SHARD_SPEED         = 8;
  var SHARD_DAMAGE        = 25;
  var TREE_COUNT          = 30;
  var MERC_COUNT          = 20;
  var INTERACT_RANGE      = 3.5;
  var COLLAPSE_TIME       = 60;
  var FLOOR_Y             = 0;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    state.scene.add(mesh);
    return mesh;
  }

  function makeCyl(rTop, rBot, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    state.scene.add(mesh);
    return mesh;
  }

  function makeSphere(r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    state.scene.add(mesh);
    return mesh;
  }

  function makeCone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    state.scene.add(mesh);
    return mesh;
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function removeMesh(mesh) {
    if (mesh && state.scene) { state.scene.remove(mesh); }
  }

  function showMessage(text, duration) {
    if (!state.messageElement) { return; }
    state.messageElement.textContent = text;
    state.messageElement.style.display = 'block';
    state.messageTimer = duration || 3.0;
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'jtr-hud';
    hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'letter-spacing:1px',
      'border:1px solid #887744'
    ].join(';');
    document.body.appendChild(hud);
    state.hudElement = hud;

    var msg = document.createElement('div');
    msg.id = 'jtr-msg';
    msg.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:#FFEE88',
      'font-family:monospace',
      'font-size:15px',
      'padding:8px 16px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'display:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(msg);
    state.messageElement = msg;
  }

  function removeHUD() {
    if (state.hudElement) { state.hudElement.parentNode && state.hudElement.parentNode.removeChild(state.hudElement); state.hudElement = null; }
    if (state.messageElement) { state.messageElement.parentNode && state.messageElement.parentNode.removeChild(state.messageElement); state.messageElement = null; }
  }

  function updateHUD() {
    if (!state.hudElement) { return; }
    var platesStr = state.platesActivated + '/5';
    var idolStr = state.idolPickedUp ? 'SECURED' : 'NOT FOUND';
    var mercsStr = '' + state.mercsAlive;
    var trapsStr = state.trapsDisabled ? 'DISABLED' : 'ACTIVE';
    var hpStr = '' + state.playerHP;
    var timerStr = '-- : --';
    if (state.collapseActive) {
      var mins = Math.floor(state.collapseTimer / 60);
      var secs = Math.floor(state.collapseTimer % 60);
      timerStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    }
    state.hudElement.textContent = 'JUNGLE TEMPLE RAID' +
      '  [PLATES: ' + platesStr + ']' +
      '  [IDOL: ' + idolStr + ']' +
      '  [MERCS: ' + mercsStr + ']' +
      '  [TIMER: ' + timerStr + ']' +
      '  [TRAPS: ' + trapsStr + ']' +
      '  [HP: ' + hpStr + ']';
  }

  // ─── Keyboard ─────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    state.keysDown[key] = true;

    if (key === 'j') {
      state.jKeyDown = true;
      state.jKeyTime = state.elapsedTime;
    }
    if (key === 't') {
      state.tKeyDown = true;
      state.tKeyTime = state.elapsedTime;
    }

    // J+T activation toggle
    if (state.jKeyDown && state.tKeyDown) {
      var diff = Math.abs(state.jKeyTime - state.tKeyTime);
      if (diff <= ACTIVATION_WINDOW) {
        if (state.active) {
          deactivate();
        } else {
          activate();
        }
        return;
      }
    }

    if (!state.active || state.gameOver) { return; }

    // E = interact / jump over spikes
    if (key === 'e') {
      tryInteract();
    }

    // Space = jump
    if (key === ' ' && state.onGround) {
      state.playerVel.y = JUMP_VEL;
      state.onGround = false;
      state.isJumping = true;
    }

    // Q = dodge left, R = dodge right (simple sidestep)
    if (key === 'q' && state.dodgeCooldown <= 0) {
      state.dodgeDir = -1;
      state.dodgeCooldown = 0.5;
    }
    if (key === 'r' && state.dodgeCooldown <= 0) {
      state.dodgeDir = 1;
      state.dodgeCooldown = 0.5;
    }
  }

  function onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    state.keysDown[key] = false;
    if (key === 'j') { state.jKeyDown = false; }
    if (key === 't') { state.tKeyDown = false; }
  }

  // ─── Activation / Deactivation ────────────────────────────────────────────
  function activate() {
    if (!window.THREE) { return; }
    // Find scene and camera from the main game
    if (window.game && window.game.scene) {
      state.scene = window.game.scene;
      state.camera = window.game.camera;
    } else {
      // Try common globals
      var candidates = ['scene', 'gScene', 'mainScene'];
      var i;
      for (i = 0; i < candidates.length; i++) {
        if (window[candidates[i]] && window[candidates[i]].isScene) {
          state.scene = window[candidates[i]];
          break;
        }
      }
      if (window.camera) { state.camera = window.camera; }
      if (!state.scene) {
        // Create a minimal scene for standalone testing
        state.scene = new THREE.Scene();
        state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        state.camera.position.set(0, 1.7, 35);
        state._standaloneScene = true;
      }
    }

    state.active = true;
    state.gameOver = false;
    state.gameWon = false;
    state.playerHP = 100;
    state.playerPos = { x: 0, y: 1.7, z: 35 };
    state.playerVel = { x: 0, y: 0, z: 0 };
    state.onGround = true;
    state.isJumping = false;
    state.dodgeDir = 0;
    state.dodgeCooldown = 0;
    state.platesActivated = 0;
    state.activatedSequence = [];
    state.idolPickedUp = false;
    state.collapseActive = false;
    state.collapseTimer = COLLAPSE_TIME;
    state.trapsDisabled = false;
    state.doorOpen = false;
    state.innerDoorOpen = false;
    state.currentLevel = 0;
    state.guardianHP = BOSS_HP;
    state.guardianAlive = false;

    // Save and set scene environment
    state.bgBackup = state.scene.background;
    state.fogBackup = state.scene.fog;
    state.scene.background = new THREE.Color(0x1A2E10);
    state.scene.fog = new THREE.FogExp2(0x1A3A10, 0.025);

    // Lighting
    state.ambientLight = new THREE.AmbientLight(0x2A4422, 1.0);
    state.scene.add(state.ambientLight);

    // Build everything
    buildJungleExterior();
    buildStonePathway();
    buildTempleEntrance();
    buildEntryHall();
    buildPuzzleChamber();
    buildInnerSanctum();
    buildMercenaries();
    buildHUD();

    state.mercsAlive = state.mercenaries.length;
    updateHUD();
    showMessage('JUNGLE TEMPLE RAID — Raid the temple. Retrieve the Golden Idol! [J+T to exit]', 5.0);
  }

  function deactivate() {
    state.active = false;
    var i, j;

    // Restore environment
    if (state.scene) {
      if (state.bgBackup !== undefined) { state.scene.background = state.bgBackup; }
      if (state.fogBackup !== undefined) { state.scene.fog = state.fogBackup; }
    }

    if (state.ambientLight) { removeMesh(state.ambientLight); state.ambientLight = null; }

    for (i = 0; i < state.pointLights.length; i++) { removeMesh(state.pointLights[i]); }
    state.pointLights = [];

    for (i = 0; i < state.treeMeshes.length; i++) { removeMesh(state.treeMeshes[i]); }
    state.treeMeshes = [];
    for (i = 0; i < state.vineMeshes.length; i++) { removeMesh(state.vineMeshes[i]); }
    state.vineMeshes = [];
    for (i = 0; i < state.ruinMeshes.length; i++) { removeMesh(state.ruinMeshes[i]); }
    state.ruinMeshes = [];
    for (i = 0; i < state.pathMeshes.length; i++) { removeMesh(state.pathMeshes[i]); }
    state.pathMeshes = [];

    removeMesh(state.stoneDoor); state.stoneDoor = null;
    for (i = 0; i < state.pillars.length; i++) { removeMesh(state.pillars[i]); }
    state.pillars = [];
    for (i = 0; i < state.hieroglyphMeshes.length; i++) { removeMesh(state.hieroglyphMeshes[i]); }
    state.hieroglyphMeshes = [];

    for (i = 0; i < state.levelMeshes.length; i++) { removeMesh(state.levelMeshes[i]); }
    state.levelMeshes = [];

    // Traps cleanup
    for (i = 0; i < state.traps.length; i++) {
      var trap = state.traps[i];
      if (trap.mesh) { removeMesh(trap.mesh); }
      if (trap.mechMesh) { removeMesh(trap.mechMesh); }
      if (trap.spikeMeshes) { for (j = 0; j < trap.spikeMeshes.length; j++) { removeMesh(trap.spikeMeshes[j]); } }
      if (trap.projectiles) { for (j = 0; j < trap.projectiles.length; j++) { removeMesh(trap.projectiles[j].mesh); } }
    }
    state.traps = [];

    // Pressure plates
    for (i = 0; i < state.pressurePlates.length; i++) {
      removeMesh(state.pressurePlates[i].mesh);
      removeMesh(state.pressurePlates[i].labelMesh);
    }
    state.pressurePlates = [];
    removeMesh(state.innerDoor); state.innerDoor = null;

    // Mercenaries
    for (i = 0; i < state.mercenaries.length; i++) {
      var m = state.mercenaries[i];
      if (m.bodyMesh) { removeMesh(m.bodyMesh); }
      if (m.headMesh) { removeMesh(m.headMesh); }
      if (m.rifleMesh) { removeMesh(m.rifleMesh); }
      if (m.shots) { for (j = 0; j < m.shots.length; j++) { removeMesh(m.shots[j].mesh); } }
    }
    state.mercenaries = [];

    // Boss
    if (state.guardian) {
      var g = state.guardian;
      removeMesh(g.bodyMesh);
      removeMesh(g.headMesh);
      removeMesh(g.armLMesh);
      removeMesh(g.armRMesh);
      for (i = 0; i < state.guardianShards.length; i++) { removeMesh(state.guardianShards[i].mesh); }
      state.guardianShards = [];
      state.guardian = null;
    }

    // Idol
    removeMesh(state.idolMesh); state.idolMesh = null;
    removeMesh(state.idolLight); state.idolLight = null;
    removeMesh(state.idolPedestal); state.idolPedestal = null;

    // Collapse debris
    for (i = 0; i < state.collapseDebris.length; i++) { removeMesh(state.collapseDebris[i].mesh); }
    state.collapseDebris = [];

    removeHUD();
  }

  // ─── Jungle Exterior ──────────────────────────────────────────────────────
  function buildJungleExterior() {
    var i;
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x3A2A18 });
    var canopyMat = new THREE.MeshLambertMaterial({ color: 0x1E5C1E });
    var canopyMat2 = new THREE.MeshLambertMaterial({ color: 0x267A26 });

    // Dense canopy trees (ConeGeometry canopies)
    for (i = 0; i < TREE_COUNT; i++) {
      var angle = (i / TREE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
      var radius = 28 + Math.random() * 45;
      var tx = Math.cos(angle) * radius + (Math.random() - 0.5) * 15;
      var tz = Math.sin(angle) * radius + (Math.random() - 0.5) * 15;

      // Trunk
      var trunkGeo = new THREE.CylinderGeometry(0.25 + Math.random() * 0.2, 0.4 + Math.random() * 0.2, 7 + Math.random() * 4, 6);
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(tx, 3.5 + Math.random() * 2, tz);
      state.scene.add(trunk);
      state.treeMeshes.push(trunk);

      // Primary cone canopy
      var coneH = 5 + Math.random() * 4;
      var coneGeo = new THREE.ConeGeometry(2.5 + Math.random() * 1.5, coneH, 7);
      var mat = (Math.random() > 0.5) ? canopyMat : canopyMat2;
      var cone = new THREE.Mesh(coneGeo, mat);
      cone.position.set(tx, 8 + Math.random() * 4, tz);
      state.scene.add(cone);
      state.treeMeshes.push(cone);

      // Second smaller cone layered above
      if (Math.random() > 0.5) {
        var cone2Geo = new THREE.ConeGeometry(1.8 + Math.random(), coneH * 0.7, 6);
        var cone2 = new THREE.Mesh(cone2Geo, mat);
        cone2.position.set(tx + (Math.random() - 0.5), cone.position.y + coneH * 0.5, tz + (Math.random() - 0.5));
        state.scene.add(cone2);
        state.treeMeshes.push(cone2);
      }
    }

    // Vine-covered ruins (BoxGeometry) scattered around
    var ruinPositions = [
      [-18, 0, 10], [20, 0, 5], [-25, 0, -8], [22, 0, -15],
      [-15, 0, -20], [18, 0, 20], [-22, 0, 18], [10, 0, -22]
    ];
    var ruinMat = new THREE.MeshLambertMaterial({ color: 0x5A5040 });
    var vineMat2 = new THREE.MeshLambertMaterial({ color: 0x2A6020 });
    for (i = 0; i < ruinPositions.length; i++) {
      var rp = ruinPositions[i];
      var rw = 2 + Math.random() * 3;
      var rh = 1.5 + Math.random() * 3;
      var rd = 2 + Math.random() * 3;
      var ruinGeo = new THREE.BoxGeometry(rw, rh, rd);
      var ruin = new THREE.Mesh(ruinGeo, ruinMat);
      ruin.position.set(rp[0], rh / 2, rp[2]);
      state.scene.add(ruin);
      state.ruinMeshes.push(ruin);

      // Vine patch on top of ruin (thin box)
      var vineGeo = new THREE.BoxGeometry(rw * 0.9, 0.2, rd * 0.9);
      var vinePatch = new THREE.Mesh(vineGeo, vineMat2);
      vinePatch.position.set(rp[0], rh + 0.1, rp[2]);
      state.scene.add(vinePatch);
      state.ruinMeshes.push(vinePatch);
    }

    // Hanging vines (LineSegments)
    buildHangingVines();

    // Ground plane
    var groundGeo = new THREE.BoxGeometry(200, 0.2, 200);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x2A3A18 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.1, 0);
    state.scene.add(ground);
    state.pathMeshes.push(ground);
  }

  function buildHangingVines() {
    var vineMat = new THREE.LineBasicMaterial({ color: 0x2A5A18 });
    var i, j;
    for (i = 0; i < 20; i++) {
      var vx = (Math.random() - 0.5) * 70;
      var vz = (Math.random() - 0.5) * 70;
      var segCount = 5 + Math.floor(Math.random() * 5);
      var points = [];
      for (j = 0; j < segCount; j++) {
        points.push(new THREE.Vector3(
          vx + (Math.random() - 0.5) * 0.8,
          14 - j * 1.8,
          vz + (Math.random() - 0.5) * 0.8
        ));
      }
      var geo = new THREE.BufferGeometry().setFromPoints(points);
      var vine = new THREE.LineSegments(geo, vineMat);
      state.scene.add(vine);
      state.vineMeshes.push(vine);
    }
  }

  function buildStonePathway() {
    var pathMat = new THREE.MeshLambertMaterial({ color: 0x6A6050 });
    var edgeMat = new THREE.MeshLambertMaterial({ color: 0x4A4030 });
    var i;

    // Central stone path from exterior to temple entrance (z=35 down to z=20)
    for (i = 0; i < 6; i++) {
      var slab = makeBox(4, 0.15, 2.5, 0x6A6050, 0, 0.075, 34 - i * 2.6);
      state.pathMeshes.push(slab);
    }

    // Edge stones along path
    for (i = 0; i < 6; i++) {
      var es1 = makeBox(0.6, 0.4, 0.6, 0x4A4030, -2.5, 0.2, 34 - i * 2.6);
      var es2 = makeBox(0.6, 0.4, 0.6, 0x4A4030, 2.5, 0.2, 34 - i * 2.6);
      state.pathMeshes.push(es1);
      state.pathMeshes.push(es2);
    }
  }

  // ─── Temple Entrance ──────────────────────────────────────────────────────
  function buildTempleEntrance() {
    var i;

    // Massive stone door (BoxGeometry)
    state.stoneDoor = makeBox(6, 9, 1.2, 0x5A5040, 0, 4.5, 20);
    state.levelMeshes.push(state.stoneDoor);

    // Door frame
    var frameL = makeBox(1.2, 10, 1.4, 0x4A4030, -3.6, 5, 20);
    var frameR = makeBox(1.2, 10, 1.4, 0x4A4030, 3.6, 5, 20);
    var frameTop = makeBox(8.5, 1.5, 1.4, 0x4A4030, 0, 9.75, 20);
    state.levelMeshes.push(frameL); state.levelMeshes.push(frameR); state.levelMeshes.push(frameTop);

    // Crumbling pillars (CylinderGeometry) flanking the entrance
    var pillarPositions = [[-7, 19], [7, 19], [-10, 17], [10, 17]];
    for (i = 0; i < pillarPositions.length; i++) {
      var pp = pillarPositions[i];
      var pillar = makeCyl(0.55, 0.7, 8, 8, 0x666655, pp[0], 4, pp[1]);
      state.pillars.push(pillar);
      state.levelMeshes.push(pillar);

      // Crumbled chunk on top
      var chunk = makeBox(1.2, 1, 1.2, 0x555544, pp[0] + (Math.random() - 0.5) * 0.5, 8.5 + Math.random() * 0.5, pp[1] + (Math.random() - 0.5) * 0.5);
      state.levelMeshes.push(chunk);
    }

    // Hieroglyphic walls (LineSegments) on flanking walls
    buildHieroglyphWall(-12, 0, 18, true);
    buildHieroglyphWall(12, 0, 18, false);

    // Temple facade walls
    var wallL = makeBox(5, 10, 2, 0x5A5040, -8, 5, 20);
    var wallR = makeBox(5, 10, 2, 0x5A5040, 8, 5, 20);
    state.levelMeshes.push(wallL); state.levelMeshes.push(wallR);
  }

  function buildHieroglyphWall(x, y, z, flipX) {
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x4A4030 });
    var wallGeo = new THREE.BoxGeometry(4, 8, 0.3);
    var wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, y + 4, z);
    state.scene.add(wall);
    state.hieroglyphMeshes.push(wall);
    state.levelMeshes.push(wall);

    // Hieroglyphic lines (LineSegments)
    var lineMat = new THREE.LineBasicMaterial({ color: 0xBBAA88 });
    var i, j;
    var rows = 5;
    var cols = 4;
    for (i = 0; i < rows; i++) {
      for (j = 0; j < cols; j++) {
        var cx = x + (flipX ? -1 : 1) * (j * 0.8 - 1.2);
        var cy = y + 1.5 + i * 1.2;
        var cz = z + 0.2;
        // Simple cross glyph
        var pts = [
          new THREE.Vector3(cx - 0.2, cy, cz),
          new THREE.Vector3(cx + 0.2, cy, cz),
          new THREE.Vector3(cx, cy - 0.25, cz),
          new THREE.Vector3(cx, cy + 0.25, cz)
        ];
        var geo = new THREE.BufferGeometry().setFromPoints(pts);
        var ls = new THREE.LineSegments(geo, lineMat);
        state.scene.add(ls);
        state.hieroglyphMeshes.push(ls);
      }
    }
  }

  // ─── Level 1: Entry Hall (traps) ──────────────────────────────────────────
  function buildEntryHall() {
    // Hall structure: corridor from z=19 to z=0
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x6A6050 });
    var wallMat  = new THREE.MeshLambertMaterial({ color: 0x5A5040 });
    var ceilMat  = new THREE.MeshLambertMaterial({ color: 0x4A4030 });

    // Floor
    var floor = makeBox(8, 0.3, 20, 0x6A6050, 0, 0.15, 9);
    state.levelMeshes.push(floor);

    // Walls
    var wL = makeBox(0.4, 6, 20, 0x5A5040, -4.2, 3, 9);
    var wR = makeBox(0.4, 6, 20, 0x5A5040, 4.2, 3, 9);
    state.levelMeshes.push(wL); state.levelMeshes.push(wR);

    // Ceiling
    var ceil = makeBox(8, 0.4, 20, 0x4A4030, 0, 6.2, 9);
    state.levelMeshes.push(ceil);

    // Ceiling torches (CylinderGeometry)
    buildTorch(-3, 5.5, 5);
    buildTorch(3, 5.5, 5);
    buildTorch(-3, 5.5, 13);
    buildTorch(3, 5.5, 13);

    // Traps
    buildSpikePit(0, 0, 14);
    buildDartShooter(-3.8, 2.5, 8, true);
    buildDartShooter(3.8, 2.5, 4, false);
    buildRollingBoulder(0, 1, 2);

    // Dart shooter cylinder props visible on walls
    buildWallDartTube(-3.9, 2.5, 8);
    buildWallDartTube(3.9, 2.5, 4);
  }

  function buildTorch(x, y, z) {
    var holder = makeCyl(0.08, 0.1, 0.6, 5, 0x5A4A30, x, y, z);
    state.levelMeshes.push(holder);
    // Flame (small cone)
    var flame = makeCone(0.15, 0.4, 5, 0xFF6600, x, y + 0.5, z);
    state.levelMeshes.push(flame);
    // Point light for atmosphere
    var light = new THREE.PointLight(0xFF8844, 1.2, 10);
    light.position.set(x, y + 0.5, z);
    state.scene.add(light);
    state.pointLights.push(light);
  }

  function buildWallDartTube(x, y, z) {
    var tube = makeCyl(0.1, 0.1, 0.8, 6, 0x887766, x, y, z);
    tube.rotation.z = Math.PI / 2;
    state.levelMeshes.push(tube);
  }

  // ─── Trap: Spike Pit ──────────────────────────────────────────────────────
  function buildSpikePit(x, y, z) {
    var i;
    // Pit floor (dark box)
    var pitGeo = new THREE.BoxGeometry(4, 0.2, 4);
    var pitMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var pit = new THREE.Mesh(pitGeo, pitMat);
    pit.position.set(x, y - 0.1, z);
    state.scene.add(pit);

    // Spikes (ConeGeometry)
    var spikeMeshes = [];
    var spikeRows = 3;
    var spikeCols = 3;
    var spikeMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    for (i = 0; i < spikeRows * spikeCols; i++) {
      var si = Math.floor(i / spikeCols);
      var sj = i % spikeCols;
      var sx = x - 1.2 + sj * 1.2;
      var sz = z - 1.2 + si * 1.2;
      var spikeGeo = new THREE.ConeGeometry(0.12, 1.2, 5);
      var spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(sx, y + 0.6, sz);
      state.scene.add(spike);
      spikeMeshes.push(spike);
    }

    state.traps.push({
      type: 'spike',
      mesh: pit,
      spikeMeshes: spikeMeshes,
      mechMesh: null,
      projectiles: [],
      x: x, y: y, z: z,
      triggered: false,
      disabled: false,
      width: 4,
      depth: 4
    });
  }

  // ─── Trap: Dart Shooter ───────────────────────────────────────────────────
  function buildDartShooter(x, y, z, fromLeft) {
    // Trigger plate on floor
    var plateGeo = new THREE.BoxGeometry(3, 0.1, 1);
    var plateMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, y - 1.1, z);
    state.scene.add(plate);

    state.traps.push({
      type: 'dart',
      mesh: plate,
      mechMesh: null,
      spikeMeshes: [],
      projectiles: [],
      x: x, y: y, z: z,
      fromLeft: fromLeft,
      triggered: false,
      disabled: false,
      nextFireTime: 0,
      fireInterval: DART_INTERVAL + Math.random() * 1.5
    });
  }

  // ─── Trap: Rolling Boulder ────────────────────────────────────────────────
  function buildRollingBoulder(x, y, z) {
    var boulderGeo = new THREE.SphereGeometry(1.0, 7, 6);
    var boulderMat = new THREE.MeshLambertMaterial({ color: 0x7A7060 });
    var boulder = new THREE.Mesh(boulderGeo, boulderMat);
    boulder.position.set(x, y + 1.0, z);
    state.scene.add(boulder);

    state.traps.push({
      type: 'boulder',
      mesh: boulder,
      mechMesh: null,
      spikeMeshes: [],
      projectiles: [],
      x: x, y: y + 1.0, z: z,
      startZ: z,
      triggered: false,
      disabled: false,
      rolling: false,
      resetTimer: 0,
      vel: 0,
      dir: 1  // direction along Z
    });
  }

  // ─── Level 2: Puzzle Chamber ──────────────────────────────────────────────
  function buildPuzzleChamber() {
    // Chamber: z=-1 to z=-18
    var floor = makeBox(10, 0.3, 18, 0x6A6050, 0, 0.15, -9);
    var wL    = makeBox(0.4, 6, 18, 0x5A5040, -5.2, 3, -9);
    var wR    = makeBox(0.4, 6, 18, 0x5A5040, 5.2, 3, -9);
    var ceil  = makeBox(10, 0.4, 18, 0x4A4030, 0, 6.2, -9);
    var back  = makeBox(10, 6.5, 0.4, 0x4A4030, 0, 3, -18.2);
    state.levelMeshes.push(floor); state.levelMeshes.push(wL); state.levelMeshes.push(wR);
    state.levelMeshes.push(ceil); state.levelMeshes.push(back);

    // Hieroglyphs on back wall
    buildHieroglyphWall(0, 0, -18, false);

    // Torches
    buildTorch(-4, 5.5, -6);
    buildTorch(4, 5.5, -6);
    buildTorch(-4, 5.5, -14);
    buildTorch(4, 5.5, -14);

    // 5 pressure plates
    buildPressurePlates();

    // Inner sanctum door (closed until plates solved)
    state.innerDoor = makeBox(6, 6, 0.8, 0x4A3A28, 0, 3, -18);
    state.levelMeshes.push(state.innerDoor);

    // Altar / pedestal hints
    var altarMat = new THREE.MeshLambertMaterial({ color: 0x3A3A28 });
    var i;
    for (i = 0; i < 2; i++) {
      var altar = makeBox(1.5, 1, 1.5, 0x3A3A28, (i === 0 ? -3 : 3), 0.5, -13);
      state.levelMeshes.push(altar);
    }
  }

  function buildPressurePlates() {
    var platePositions = [
      [-3.5, 0, -4],
      [3.5,  0, -4],
      [0,    0, -8],
      [-3.5, 0, -12],
      [3.5,  0, -12]
    ];
    var plateMats = [
      new THREE.MeshLambertMaterial({ color: 0x887755 }),
      new THREE.MeshLambertMaterial({ color: 0x775588 }),
      new THREE.MeshLambertMaterial({ color: 0x558877 }),
      new THREE.MeshLambertMaterial({ color: 0x886655 }),
      new THREE.MeshLambertMaterial({ color: 0x556688 })
    ];
    var activatedMat = new THREE.MeshLambertMaterial({ color: 0xFFCC44 });
    var i;
    for (i = 0; i < 5; i++) {
      var pp = platePositions[i];
      var plateGeo = new THREE.BoxGeometry(1.4, 0.15, 1.4);
      var plate = new THREE.Mesh(plateGeo, plateMats[i]);
      plate.position.set(pp[0], pp[1] + 0.075, pp[2]);
      state.scene.add(plate);

      // Number glyph above (LineSegments)
      var glyphPts = makeNumberGlyph(i + 1, pp[0], pp[1] + 1.2, pp[2]);
      var glyphGeo = new THREE.BufferGeometry().setFromPoints(glyphPts);
      var glyph = new THREE.LineSegments(glyphGeo, new THREE.LineBasicMaterial({ color: 0xFFCC44 }));
      state.scene.add(glyph);

      state.pressurePlates.push({
        index: i,
        mesh: plate,
        labelMesh: glyph,
        baseMat: plateMats[i],
        activatedMat: activatedMat,
        activated: false,
        x: pp[0], y: pp[1], z: pp[2]
      });
    }
  }

  function makeNumberGlyph(n, x, y, z) {
    // Simple line-based number representation
    var pts = [];
    var scale = 0.25;
    // Horizontal bar top
    pts.push(new THREE.Vector3(x - scale, y + scale, z), new THREE.Vector3(x + scale, y + scale, z));
    if (n !== 1) {
      // Left vertical top
      pts.push(new THREE.Vector3(x - scale, y, z), new THREE.Vector3(x - scale, y + scale, z));
    }
    // Right vertical top
    pts.push(new THREE.Vector3(x + scale, y, z), new THREE.Vector3(x + scale, y + scale, z));
    if (n >= 2) {
      // Middle bar
      pts.push(new THREE.Vector3(x - scale, y, z), new THREE.Vector3(x + scale, y, z));
    }
    return pts;
  }

  // ─── Level 3: Inner Sanctum ───────────────────────────────────────────────
  function buildInnerSanctum() {
    // Sanctum: z=-18.5 to z=-36
    var floor = makeBox(12, 0.3, 18, 0x7A6A55, 0, 0.15, -27);
    var wL    = makeBox(0.4, 8, 18, 0x5A5040, -6.2, 4, -27);
    var wR    = makeBox(0.4, 8, 18, 0x5A5040, 6.2, 4, -27);
    var ceil  = makeBox(12, 0.4, 18, 0x3A3A28, 0, 8.2, -27);
    var back  = makeBox(12, 8.5, 0.4, 0x4A4030, 0, 4, -36.2);
    state.levelMeshes.push(floor); state.levelMeshes.push(wL); state.levelMeshes.push(wR);
    state.levelMeshes.push(ceil); state.levelMeshes.push(back);

    // Torches
    buildTorch(-5, 7, -22);
    buildTorch(5, 7, -22);
    buildTorch(-5, 7, -32);
    buildTorch(5, 7, -32);

    // Decorative columns
    var i;
    var colPositions = [[-4.5, -22], [4.5, -22], [-4.5, -32], [4.5, -32]];
    for (i = 0; i < colPositions.length; i++) {
      var col = makeCyl(0.45, 0.55, 7.5, 8, 0x6A6050, colPositions[i][0], 3.75, colPositions[i][1]);
      state.levelMeshes.push(col);
    }

    // Idol pedestal (CylinderGeometry base + BoxGeometry top)
    state.idolPedestal = makeCyl(0.8, 1.0, 2, 8, 0x887755, 0, 1, -33);
    state.levelMeshes.push(state.idolPedestal);
    var pedestalTop = makeBox(1.4, 0.25, 1.4, 0x998866, 0, 2.125, -33);
    state.levelMeshes.push(pedestalTop);

    // Golden Idol (SphereGeometry 0xFFD700)
    var idolGeo = new THREE.SphereGeometry(0.45, 12, 10);
    var idolMat = new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0x886600 });
    state.idolMesh = new THREE.Mesh(idolGeo, idolMat);
    state.idolMesh.position.set(0, 2.7, -33);
    state.scene.add(state.idolMesh);

    // Idol glow (PointLight)
    state.idolLight = new THREE.PointLight(0xFFD700, 2.0, 12);
    state.idolLight.position.set(0, 2.7, -33);
    state.scene.add(state.idolLight);
    state.pointLights.push(state.idolLight);

    // Build boss guardian
    buildGuardianBoss(-6, 0, -27);

    // Wall decorations
    buildHieroglyphWall(-6, 0, -27, true);
    buildHieroglyphWall(6, 0, -27, false);
  }

  // ─── Temple Guardian Boss ─────────────────────────────────────────────────
  function buildGuardianBoss(x, y, z) {
    // Stone golem from BoxGeometry, color 0x887766
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var darkMat  = new THREE.MeshLambertMaterial({ color: 0x665544 });
    var eyeMat   = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: 0xFF2200 });

    // Body
    var bodyGeo = new THREE.BoxGeometry(2.2, 2.8, 1.4);
    var body = new THREE.Mesh(bodyGeo, stoneMat);
    body.position.set(x, y + 2.4, z);
    state.scene.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var head = new THREE.Mesh(headGeo, stoneMat);
    head.position.set(x, y + 4.55, z);
    state.scene.add(head);

    // Eyes
    var eyeGeo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
    var eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(x - 0.35, y + 4.7, z - 0.7);
    state.scene.add(eyeL);
    var eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(x + 0.35, y + 4.7, z - 0.7);
    state.scene.add(eyeR);

    // Arms
    var armGeo = new THREE.BoxGeometry(0.7, 2.5, 0.7);
    var armL = new THREE.Mesh(armGeo, stoneMat);
    armL.position.set(x - 1.6, y + 2.2, z);
    state.scene.add(armL);
    var armR = new THREE.Mesh(armGeo, stoneMat);
    armR.position.set(x + 1.6, y + 2.2, z);
    state.scene.add(armR);

    // Legs
    var legGeo = new THREE.BoxGeometry(0.8, 2.0, 0.8);
    var legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(x - 0.6, y + 1.0, z);
    state.scene.add(legL);
    var legR = new THREE.Mesh(legGeo, darkMat);
    legR.position.set(x + 0.6, y + 1.0, z);
    state.scene.add(legR);

    state.guardian = {
      bodyMesh: body,
      headMesh: head,
      eyeL: eyeL,
      eyeR: eyeR,
      armLMesh: armL,
      armRMesh: armR,
      legLMesh: legL,
      legRMesh: legR,
      hp: BOSS_HP,
      x: x, y: y, z: z,
      vel: { x: 0, z: 0 },
      attackTimer: 0,
      shardTimer: 0,
      active: false,  // activates when player enters sanctum
      angered: false,
      swayAngle: 0
    };
    state.guardianAlive = true;
  }

  // ─── Mercenaries ──────────────────────────────────────────────────────────
  function buildMercenaries() {
    var mercPositions = [
      // Jungle exterior
      [-15, 0, 28], [18, 0, 22], [-20, 0, 15], [22, 0, 8],
      [-10, 0, 32], [14, 0, 32], [-18, 0, 5],  [20, 0, -5],
      // Entry hall
      [2, 1.7, 6], [-2, 1.7, 10], [2, 1.7, 16], [-2, 1.7, 2],
      // Puzzle chamber
      [3, 1.7, -5], [-3, 1.7, -10], [3, 1.7, -15], [0, 1.7, -7],
      // Inner sanctum
      [-3, 1.7, -22], [3, 1.7, -22], [-4, 1.7, -30], [4, 1.7, -30]
    ];

    var mercMat  = new THREE.MeshLambertMaterial({ color: 0x4A6030 });    // camo green
    var headMat  = new THREE.MeshLambertMaterial({ color: 0xC8A878 });    // skin
    var rifleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var i;

    for (i = 0; i < MERC_COUNT; i++) {
      var mp = mercPositions[i % mercPositions.length];
      var jitterX = (Math.random() - 0.5) * 3;
      var jitterZ = (Math.random() - 0.5) * 3;
      var mx = mp[0] + jitterX;
      var my = mp[1];
      var mz = mp[2] + jitterZ;

      // Body
      var bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
      var body = new THREE.Mesh(bodyGeo, mercMat);
      body.position.set(mx, my + 1.0, mz);
      state.scene.add(body);

      // Head
      var headGeo = new THREE.SphereGeometry(0.25, 7, 6);
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.set(mx, my + 1.75, mz);
      state.scene.add(head);

      // Rifle
      var rifleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.8);
      var rifle = new THREE.Mesh(rifleGeo, rifleMat);
      rifle.position.set(mx + 0.35, my + 1.1, mz - 0.5);
      state.scene.add(rifle);

      state.mercenaries.push({
        bodyMesh: body,
        headMesh: head,
        rifleMesh: rifle,
        hp: MERC_HP,
        x: mx, y: my, z: mz,
        alive: true,
        alertRange: 18,
        alerted: false,
        fireTimer: Math.random() * MERC_FIRE_CD,
        shots: [],
        patrolAngle: Math.random() * Math.PI * 2,
        patrolRadius: 3 + Math.random() * 4,
        patrolCenter: { x: mx, z: mz },
        vel: { x: 0, z: 0 }
      });
    }
    state.mercsAlive = MERC_COUNT;
  }

  // ─── Interact ─────────────────────────────────────────────────────────────
  function tryInteract() {
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var i;

    // Check idol pickup
    if (!state.idolPickedUp && state.idolMesh) {
      var id = dist2D(px, pz, state.idolMesh.position.x, state.idolMesh.position.z);
      if (id < INTERACT_RANGE) {
        pickUpIdol();
        return;
      }
    }

    // Check stone door (entrance)
    if (!state.doorOpen && state.stoneDoor) {
      var dd = dist2D(px, pz, state.stoneDoor.position.x, state.stoneDoor.position.z);
      if (dd < INTERACT_RANGE + 2) {
        openStoneDoor();
        return;
      }
    }

    // Check pressure plates
    for (i = 0; i < state.pressurePlates.length; i++) {
      var pp = state.pressurePlates[i];
      if (pp.activated) { continue; }
      var pd = dist2D(px, pz, pp.x, pp.z);
      if (pd < INTERACT_RANGE * 0.8) {
        activatePressurePlate(i);
        return;
      }
    }
  }

  function openStoneDoor() {
    if (state.stoneDoor && !state.doorOpen) {
      state.doorOpen = true;
      // Slide door upward (visual)
      state.stoneDoor.position.y = 13;
      showMessage('Stone door rumbles open! Enter the temple!', 3.0);
    }
  }

  function pickUpIdol() {
    if (state.idolPickedUp) { return; }
    state.idolPickedUp = true;
    removeMesh(state.idolMesh); state.idolMesh = null;
    // Start collapse countdown
    state.collapseActive = true;
    state.collapseTimer = COLLAPSE_TIME;
    showMessage('YOU GRABBED THE IDOL! TEMPLE IS COLLAPSING — ESCAPE NOW!', 6.0);
    // Spawn collapse debris
    spawnCollapseDebris();
    updateHUD();
  }

  function activatePressurePlate(idx) {
    var plate = state.pressurePlates[idx];
    if (plate.activated) { return; }

    plate.activated = true;
    plate.mesh.material = new THREE.MeshLambertMaterial({ color: 0xFFCC44 });

    state.activatedSequence.push(idx);
    state.platesActivated++;

    // Check if sequence is correct so far
    var correctSoFar = true;
    var i;
    for (i = 0; i < state.activatedSequence.length; i++) {
      if (state.activatedSequence[i] !== state.correctSequence[i]) {
        correctSoFar = false;
        break;
      }
    }

    if (!correctSoFar) {
      // Wrong sequence — reset
      showMessage('WRONG SEQUENCE! Plates reset — try again.', 3.0);
      for (i = 0; i < state.pressurePlates.length; i++) {
        state.pressurePlates[i].activated = false;
        state.pressurePlates[i].mesh.material = state.pressurePlates[i].baseMat;
      }
      state.activatedSequence = [];
      state.platesActivated = 0;
    } else if (state.platesActivated === 5) {
      // All 5 correct
      openInnerDoor();
    } else {
      showMessage('Plate ' + state.platesActivated + '/5 activated!', 1.5);
    }
    updateHUD();
  }

  function openInnerDoor() {
    if (state.innerDoor && !state.innerDoorOpen) {
      state.innerDoorOpen = true;
      state.innerDoor.position.y = 10;
      showMessage('INNER SANCTUM UNLOCKED — The Golden Idol awaits!', 4.0);
      // Activate boss
      if (state.guardian) {
        state.guardian.active = true;
        state.guardianAlive = true;
      }
    }
  }

  // ─── Collapse Debris ───────────────────────────────────────────────────────
  function spawnCollapseDebris() {
    var i;
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x7A7060 });
    for (i = 0; i < 20; i++) {
      var dw = 0.4 + Math.random() * 1.0;
      var geo = new THREE.BoxGeometry(dw, dw * 0.6, dw * 0.8);
      var mesh = new THREE.Mesh(geo, debrisMat);
      var dx = (Math.random() - 0.5) * 8;
      var dz = (Math.random() - 0.5) * 60;
      mesh.position.set(dx, 8 + Math.random() * 4, dz);
      state.scene.add(mesh);
      state.collapseDebris.push({
        mesh: mesh,
        vel: { x: (Math.random() - 0.5) * 2, y: -3 - Math.random() * 4, z: (Math.random() - 0.5) * 2 },
        active: true,
        delay: Math.random() * 5
      });
    }
  }

  // ─── Damage ────────────────────────────────────────────────────────────────
  function damagePlayer(amount) {
    if (state.gameOver) { return; }
    state.playerHP -= amount;
    if (state.playerHP <= 0) {
      state.playerHP = 0;
      triggerGameOver(false, 'You have been killed!');
    }
    updateHUD();
  }

  function damageGuardian(amount) {
    if (!state.guardian || !state.guardianAlive) { return; }
    state.guardian.hp -= amount;
    if (state.guardian.hp <= 0) {
      state.guardian.hp = 0;
      state.guardianAlive = false;
      removeMesh(state.guardian.bodyMesh);
      removeMesh(state.guardian.headMesh);
      removeMesh(state.guardian.armLMesh);
      removeMesh(state.guardian.armRMesh);
      removeMesh(state.guardian.legLMesh);
      removeMesh(state.guardian.legRMesh);
      removeMesh(state.guardian.eyeL);
      removeMesh(state.guardian.eyeR);
      showMessage('GUARDIAN DESTROYED! Grab the idol!', 4.0);
    }
  }

  function damageMerc(idx, amount) {
    var m = state.mercenaries[idx];
    if (!m || !m.alive) { return; }
    m.hp -= amount;
    if (m.hp <= 0) {
      m.alive = false;
      removeMesh(m.bodyMesh);
      removeMesh(m.headMesh);
      removeMesh(m.rifleMesh);
      state.mercsAlive = Math.max(0, state.mercsAlive - 1);
      updateHUD();
    }
  }

  // ─── Win / Lose ────────────────────────────────────────────────────────────
  function triggerGameOver(won, msg) {
    state.gameOver = true;
    state.gameWon = won;
    var text = won
      ? 'MISSION COMPLETE! You escaped with the Golden Idol!'
      : 'MISSION FAILED — ' + msg;
    showMessage(text, 10.0);
    updateHUD();
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  function update(dt, gameState) {
    if (!state.active) { return; }

    // Accept scene/camera from host
    if (gameState) {
      if (gameState.scene && !state.scene) { state.scene = gameState.scene; }
      if (gameState.camera) { state.camera = gameState.camera; }
    }

    state.elapsedTime += dt;
    state.messageTimer -= dt;
    if (state.messageTimer <= 0 && state.messageElement) {
      state.messageElement.style.display = 'none';
    }

    if (state.gameOver) { return; }

    // Update player movement
    updatePlayerMovement(dt);

    // Update traps
    updateTraps(dt);

    // Update mercenaries
    updateMercenaries(dt);

    // Update guardian boss
    updateGuardian(dt);

    // Update guardian shards
    updateShards(dt);

    // Collapse countdown
    if (state.collapseActive) {
      state.collapseTimer -= dt;
      updateCollapseDebris(dt);

      if (state.collapseTimer <= 0) {
        // Check if player is outside (z > 20)
        if (state.playerPos.z > 20) {
          triggerGameOver(true, '');
        } else {
          triggerGameOver(false, 'Temple collapsed with you inside!');
        }
      }

      // Win check: player escaped with idol
      if (state.idolPickedUp && state.playerPos.z > 22) {
        triggerGameOver(true, '');
      }
    }

    // Update idol spin
    if (state.idolMesh) {
      state.idolMesh.rotation.y += dt * 1.5;
    }

    // Update HUD
    updateHUD();
  }

  // ─── Player Movement ──────────────────────────────────────────────────────
  function updatePlayerMovement(dt) {
    var speed = PLAYER_SPEED;
    var cam = state.camera;
    var keys = state.keysDown;
    var moveX = 0, moveZ = 0;

    if (keys['w'] || keys['arrowup'])    { moveZ -= 1; }
    if (keys['s'] || keys['arrowdown'])  { moveZ += 1; }
    if (keys['a'] || keys['arrowleft'])  { moveX -= 1; }
    if (keys['d'] || keys['arrowright']) { moveX += 1; }

    // Normalize
    var movLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (movLen > 0) { moveX /= movLen; moveZ /= movLen; }

    // Apply camera direction if available
    if (cam) {
      var fwdX = 0, fwdZ = -1;
      // Use camera's forward on XZ plane
      var dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      fwdX = dir.x; fwdZ = dir.z;
      var fwdLen = Math.sqrt(fwdX * fwdX + fwdZ * fwdZ);
      if (fwdLen > 0.001) { fwdX /= fwdLen; fwdZ /= fwdLen; }
      var rightX = fwdZ;  // rotate 90
      var rightZ = -fwdX;

      var worldX = fwdX * (-moveZ) + rightX * moveX;
      var worldZ = fwdZ * (-moveZ) + rightZ * moveX;
      state.playerPos.x += worldX * speed * dt;
      state.playerPos.z += worldZ * speed * dt;
    } else {
      state.playerPos.x += moveX * speed * dt;
      state.playerPos.z += moveZ * speed * dt;
    }

    // Dodge
    if (state.dodgeDir !== 0) {
      state.playerPos.x += state.dodgeDir * 4 * dt;
    }
    state.dodgeCooldown -= dt;
    if (state.dodgeCooldown <= 0) { state.dodgeDir = 0; state.dodgeCooldown = 0; }

    // Gravity + jump
    if (!state.onGround) {
      state.playerVel.y += GRAVITY * dt;
    }
    state.playerPos.y += state.playerVel.y * dt;

    if (state.playerPos.y <= 1.7) {
      state.playerPos.y = 1.7;
      state.playerVel.y = 0;
      state.onGround = true;
      state.isJumping = false;
    }

    // Sync camera position
    if (cam) {
      cam.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    }
  }

  // ─── Trap Updates ─────────────────────────────────────────────────────────
  function updateTraps(dt) {
    if (state.trapsDisabled) { return; }
    var i, j;
    var px = state.playerPos.x;
    var py = state.playerPos.y;
    var pz = state.playerPos.z;

    for (i = 0; i < state.traps.length; i++) {
      var trap = state.traps[i];

      if (trap.type === 'spike') {
        // Spike pit: damage if player walks into it (not jumping)
        var inX = Math.abs(px - trap.x) < trap.width / 2;
        var inZ = Math.abs(pz - trap.z) < trap.depth / 2;
        if (inX && inZ && state.onGround) {
          damagePlayer(SPIKE_DAMAGE * dt * 2);
          showMessage('SPIKE TRAP! Press SPACE to jump over!', 2.0);
        }
      }

      if (trap.type === 'dart') {
        // Fire dart on timer
        trap.nextFireTime -= dt;
        if (trap.nextFireTime <= 0) {
          trap.nextFireTime = trap.fireInterval;
          fireDart(trap);
        }
        // Move active darts
        for (j = trap.projectiles.length - 1; j >= 0; j--) {
          var dart = trap.projectiles[j];
          dart.mesh.position.x += dart.vel.x * dt;
          dart.mesh.position.z += dart.vel.z * dt;
          dart.life -= dt;
          if (dart.life <= 0) {
            removeMesh(dart.mesh);
            trap.projectiles.splice(j, 1);
            continue;
          }
          // Hit player
          var dartDist = dist2D(dart.mesh.position.x, dart.mesh.position.z, px, pz);
          if (dartDist < 0.5) {
            damagePlayer(DART_DAMAGE);
            showMessage('HIT BY DART! -' + DART_DAMAGE + ' HP', 1.5);
            removeMesh(dart.mesh);
            trap.projectiles.splice(j, 1);
          }
        }
      }

      if (trap.type === 'boulder') {
        // Boulder: trigger when player is in corridor and nearby
        var bx = trap.mesh.position.x;
        var bz = trap.mesh.position.z;
        if (!trap.rolling) {
          var boulderDist = dist2D(px, pz, bx, bz);
          if (boulderDist < 15 && pz < 19 && pz > -1) {
            trap.rolling = true;
            trap.vel = BOULDER_SPEED;
          }
        } else {
          // Roll along Z
          trap.mesh.position.z += trap.vel * dt * trap.dir;
          trap.mesh.rotation.x += trap.vel * dt;
          // Check if hit player
          var bPlayerDist = dist2D(trap.mesh.position.x, trap.mesh.position.z, px, pz);
          if (bPlayerDist < 1.3) {
            damagePlayer(35);
            showMessage('BOULDER! Dodge left (Q) or right (R)!', 2.0);
          }
          // Reset when off screen
          if (trap.mesh.position.z > 22 || trap.mesh.position.z < -3) {
            trap.rolling = false;
            trap.dir *= -1;
            trap.mesh.position.set(trap.x, trap.y, trap.startZ);
            trap.resetTimer = 5;
          }
          if (trap.resetTimer > 0) {
            trap.resetTimer -= dt;
          }
        }
      }
    }
  }

  function fireDart(trap) {
    var dartGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5);
    var dartMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var dartMesh = new THREE.Mesh(dartGeo, dartMat);

    var dir = trap.fromLeft ? 1 : -1;
    dartMesh.rotation.z = Math.PI / 2;
    dartMesh.position.set(trap.x, trap.y, trap.z);
    state.scene.add(dartMesh);

    trap.projectiles.push({
      mesh: dartMesh,
      vel: { x: dir * DART_SPEED, z: 0 },
      life: 3.0
    });
  }

  // ─── Mercenary Updates ────────────────────────────────────────────────────
  function updateMercenaries(dt) {
    var i, j;
    var px = state.playerPos.x;
    var pz = state.playerPos.z;

    for (i = 0; i < state.mercenaries.length; i++) {
      var m = state.mercenaries[i];
      if (!m.alive) { continue; }

      var md = dist2D(px, pz, m.x, m.z);

      // Alert check
      if (md < m.alertRange) {
        m.alerted = true;
      }

      if (m.alerted) {
        // Move toward player
        var mvx = px - m.x;
        var mvz = pz - m.z;
        var mvLen = Math.sqrt(mvx * mvx + mvz * mvz);
        if (mvLen > 0.1) { mvx /= mvLen; mvz /= mvLen; }

        if (md > 6) {
          m.x += mvx * MERC_MOVE_SPEED * dt;
          m.z += mvz * MERC_MOVE_SPEED * dt;
          m.bodyMesh.position.set(m.x, m.y + 1.0, m.z);
          m.headMesh.position.set(m.x, m.y + 1.75, m.z);
          m.rifleMesh.position.set(m.x + 0.35, m.y + 1.1, m.z - 0.5);
        }

        // Rotate to face player
        var angle = Math.atan2(mvx, mvz);
        m.bodyMesh.rotation.y = angle;
        m.headMesh.rotation.y = angle;

        // Fire at player
        m.fireTimer -= dt;
        if (m.fireTimer <= 0 && md < MERC_RANGE) {
          m.fireTimer = MERC_FIRE_CD + Math.random();
          fireMercShot(m, i);
        }
      } else {
        // Patrol
        m.patrolAngle += dt * 0.4;
        var newX = m.patrolCenter.x + Math.cos(m.patrolAngle) * m.patrolRadius;
        var newZ = m.patrolCenter.z + Math.sin(m.patrolAngle) * m.patrolRadius;
        var pdx = newX - m.x;
        var pdz = newZ - m.z;
        m.x = newX; m.z = newZ;
        m.bodyMesh.position.set(m.x, m.y + 1.0, m.z);
        m.headMesh.position.set(m.x, m.y + 1.75, m.z);
        m.rifleMesh.position.set(m.x + 0.35, m.y + 1.1, m.z - 0.5);
      }

      // Update shots
      for (j = m.shots.length - 1; j >= 0; j--) {
        var proj = m.shots[j];
        proj.mesh.position.x += proj.vel.x * dt;
        proj.mesh.position.z += proj.vel.z * dt;
        proj.life -= dt;
        if (proj.life <= 0) {
          removeMesh(proj.mesh);
          m.shots.splice(j, 1);
          continue;
        }
        var bmd = dist2D(proj.mesh.position.x, proj.mesh.position.z, px, pz);
        if (bmd < 0.45) {
          damagePlayer(MERC_DAMAGE);
          showMessage('Enemy fire! -' + MERC_DAMAGE + ' HP', 1.0);
          removeMesh(proj.mesh);
          m.shots.splice(j, 1);
        }
      }
    }
  }

  function fireMercShot(merc, idx) {
    var geo = new THREE.SphereGeometry(0.08, 4, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
    var shotMesh = new THREE.Mesh(geo, mat);
    shotMesh.position.set(merc.x, merc.y + 1.2, merc.z);
    state.scene.add(shotMesh);

    var dx = state.playerPos.x - merc.x;
    var dz = state.playerPos.z - merc.z;
    var dl = Math.sqrt(dx * dx + dz * dz);
    if (dl < 0.01) { dl = 1; }
    // Add inaccuracy
    dx = (dx / dl + (Math.random() - 0.5) * 0.3);
    dz = (dz / dl + (Math.random() - 0.5) * 0.3);

    merc.shots.push({
      mesh: shotMesh,
      vel: { x: dx * 25, z: dz * 25 },
      life: 2.0
    });
  }

  // ─── Guardian Update ──────────────────────────────────────────────────────
  function updateGuardian(dt) {
    if (!state.guardian || !state.guardian.active || !state.guardianAlive) { return; }
    var g = state.guardian;
    var px = state.playerPos.x;
    var pz = state.playerPos.z;

    // Sway animation
    g.swayAngle += dt * 1.2;
    if (g.bodyMesh) { g.bodyMesh.rotation.z = Math.sin(g.swayAngle) * 0.08; }

    var gd = dist2D(px, pz, g.x, g.z);

    // Move toward player (slow but inevitable)
    if (gd > BOSS_RANGE * 0.8) {
      var gdx = px - g.x;
      var gdz = pz - g.z;
      var gdl = Math.sqrt(gdx * gdx + gdz * gdz);
      if (gdl > 0.01) { gdx /= gdl; gdz /= gdl; }
      g.x += gdx * BOSS_SPEED * dt;
      g.z += gdz * BOSS_SPEED * dt;

      if (g.bodyMesh) { g.bodyMesh.position.set(g.x, g.y + 2.4, g.z); }
      if (g.headMesh) { g.headMesh.position.set(g.x, g.y + 4.55, g.z); }
      if (g.armLMesh) { g.armLMesh.position.set(g.x - 1.6, g.y + 2.2, g.z); }
      if (g.armRMesh) { g.armRMesh.position.set(g.x + 1.6, g.y + 2.2, g.z); }
      if (g.legLMesh) { g.legLMesh.position.set(g.x - 0.6, g.y + 1.0, g.z); }
      if (g.legRMesh) { g.legRMesh.position.set(g.x + 0.6, g.y + 1.0, g.z); }
      if (g.eyeL) { g.eyeL.position.set(g.x - 0.35, g.y + 4.7, g.z - 0.7); }
      if (g.eyeR) { g.eyeR.position.set(g.x + 0.35, g.y + 4.7, g.z - 0.7); }
    }

    // Melee attack
    g.attackTimer -= dt;
    if (gd < BOSS_RANGE && g.attackTimer <= 0) {
      g.attackTimer = BOSS_ATTACK_CD;
      damagePlayer(BOSS_DAMAGE);
      showMessage('GUARDIAN SMASH! -' + BOSS_DAMAGE + ' HP', 2.0);
    }

    // Shard throw (periodically)
    g.shardTimer -= dt;
    if (g.shardTimer <= 0 && gd < 20) {
      g.shardTimer = 4.0 + Math.random() * 2;
      throwStoneShard(g.x, g.y + 3, g.z);
    }

    // Damage guardian if player fires (simplified: auto-damage when very close and guardian alive)
    // The host game handles actual shooting; we react via exported damageGuardian
  }

  function throwStoneShard(sx, sy, sz) {
    var geo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
    var mat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var shard = new THREE.Mesh(geo, mat);
    shard.position.set(sx, sy, sz);
    state.scene.add(shard);

    var tx = state.playerPos.x;
    var tz = state.playerPos.z;
    var dx = tx - sx;
    var dz = tz - sz;
    var dl = Math.sqrt(dx * dx + dz * dz);
    if (dl < 0.01) { dl = 1; }

    state.guardianShards.push({
      mesh: shard,
      vel: {
        x: (dx / dl) * SHARD_SPEED + (Math.random() - 0.5) * 3,
        y: 3 + Math.random() * 2,
        z: (dz / dl) * SHARD_SPEED + (Math.random() - 0.5) * 3
      },
      life: 3.0
    });
  }

  function updateShards(dt) {
    var i;
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    for (i = state.guardianShards.length - 1; i >= 0; i--) {
      var sh = state.guardianShards[i];
      sh.mesh.position.x += sh.vel.x * dt;
      sh.mesh.position.y += sh.vel.y * dt;
      sh.mesh.position.z += sh.vel.z * dt;
      sh.vel.y += GRAVITY * dt;
      sh.life -= dt;

      if (sh.life <= 0 || sh.mesh.position.y < 0) {
        removeMesh(sh.mesh);
        state.guardianShards.splice(i, 1);
        continue;
      }

      var shd = dist2D(sh.mesh.position.x, sh.mesh.position.z, px, pz);
      if (shd < 0.6) {
        damagePlayer(SHARD_DAMAGE);
        showMessage('Stone shard hit! -' + SHARD_DAMAGE + ' HP', 1.5);
        removeMesh(sh.mesh);
        state.guardianShards.splice(i, 1);
      }
    }
  }

  // ─── Collapse Debris Update ───────────────────────────────────────────────
  function updateCollapseDebris(dt) {
    var i;
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    for (i = 0; i < state.collapseDebris.length; i++) {
      var d = state.collapseDebris[i];
      if (!d.active) { continue; }
      if (d.delay > 0) { d.delay -= dt; continue; }
      d.mesh.position.x += d.vel.x * dt;
      d.mesh.position.y += d.vel.y * dt;
      d.mesh.position.z += d.vel.z * dt;
      d.vel.y += GRAVITY * 0.5 * dt;

      if (d.mesh.position.y < 0) {
        d.mesh.position.y = 0;
        d.active = false;
        // Damage if near player
        var dd = dist2D(d.mesh.position.x, d.mesh.position.z, px, pz);
        if (dd < 1.5) {
          damagePlayer(20);
          showMessage('Falling debris! -20 HP', 1.5);
        }
      }
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init(scene, camera, renderer) {
    state.scene = scene || null;
    state.camera = camera || null;
    state.renderer = renderer || null;
    state.elapsedTime = 0;

    state._onKeyDown = onKeyDown;
    state._onKeyUp = onKeyUp;
    document.addEventListener('keydown', state._onKeyDown);
    document.addEventListener('keyup', state._onKeyUp);
  }

  // ─── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    if (state.active) { deactivate(); }
    state.elapsedTime = 0;
    state.gameOver = false;
    state.gameWon = false;
    state.playerHP = 100;
    state.platesActivated = 0;
    state.activatedSequence = [];
    state.idolPickedUp = false;
    state.collapseActive = false;
    state.collapseTimer = COLLAPSE_TIME;
    state.trapsDisabled = false;
  }

  // Register listeners immediately
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    reset: reset,
    damageGuardian: damageGuardian,
    damageMerc: damageMerc,
    damagePlayer: damagePlayer,
    getState: function() { return state; }
  };

})();
