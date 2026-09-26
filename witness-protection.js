/* ───────────────────────────────────────────────────────────────────────────
   witness-protection.js — Witness Protection Mission
   API: window.WitnessProtection = { init, update, reset }
   Controls:
     W + P (within 400ms)  → activate module
     WASD                  → move player
     Mouse Click           → shoot
     G                     → throw grenade
   Objective:
     Extract the witness through a hostile urban environment.
     Reach one of 5 extraction points before the 15-minute timer expires.
     Keep the witness alive. Don't die yourself.
   ─────────────────────────────────────────────────────────────────────────── */

window.WitnessProtection = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  /* ── Scene / renderer references ──────────────────────────────────────── */
  var scene       = null;
  var camera      = null;
  var renderer    = null;
  var clock       = null;
  var container   = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var active       = false;
  var wPressTime   = 0;
  var pPressTime   = 0;
  var keys         = {};

  /* ── Game state ────────────────────────────────────────────────────────── */
  var gameOver          = false;
  var gameWon           = false;
  var gameOverMessage   = '';
  var timerSeconds      = 900; // 15 minutes
  var gameStarted       = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var playerMesh    = null;
  var playerHP      = 100;
  var playerSpeed   = 8;
  var playerBullets = [];
  var grenades      = [];
  var shootCooldown = 0;
  var grenadeCooldown = 0;

  /* ── Witness ───────────────────────────────────────────────────────────── */
  var witnessMesh   = null;
  var witnessHP     = 50;
  var witnessInjured = false;
  var witnessFollowDist = 3;

  /* ── Kill teams / assassins ────────────────────────────────────────────── */
  var assassins     = [];   // array of objects { mesh, hp, team, isSniper, sniperTimer, speed, state, patrolTarget }
  var killTeams     = [ { active: true }, { active: true }, { active: true } ];

  /* ── Armored SUV ───────────────────────────────────────────────────────── */
  var suvMesh       = null;
  var suvHP         = 4; // grenade hits
  var suvSpeed      = 6;
  var suvActive     = true;
  var suvRamCooldown = 0;

  /* ── World objects ─────────────────────────────────────────────────────── */
  var buildings     = [];
  var coverObjects  = [];
  var parkMesh      = null;
  var safehouseMesh = null;

  /* ── Extraction routes ─────────────────────────────────────────────────── */
  var extractionPoints  = [];
  var chosenRoute       = 'N/A';
  var ROUTE_NAMES = ['PORT', 'AIRFIELD', 'EMBASSY', 'SUBWAY', 'SAFEHOUSE2'];
  var ROUTE_DIRS  = ['SOUTH', 'NORTH', 'EAST', 'CENTER', 'WEST'];

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var hudDiv = null;

  /* ── Mouse ─────────────────────────────────────────────────────────────── */
  var mouseX = 0;
  var mouseY = 0;
  var mouseDown = false;

  /* ── Camera follow ─────────────────────────────────────────────────────── */
  var camHeight   = 18;
  var camDistance = 20;

  /* ── Materials cache ───────────────────────────────────────────────────── */
  var matBuilding1    = null;
  var matBuilding2    = null;
  var matPark         = null;
  var matSafehouse    = null;
  var matPlayer       = null;
  var matWitness      = null;
  var matAssassin     = null;
  var matSniperScope  = null;
  var matSUV          = null;
  var matShell        = null;
  var matGrenade      = null;
  var matGround       = null;
  var matCover        = null;
  var matExplosion    = null;

  /* ── Explosion VFX pool ────────────────────────────────────────────────── */
  var explosions = [];

  /* ── Building layout data ──────────────────────────────────────────────── */
  var buildingData = [
    // block row 0
    { x: -40, z: -40, w: 14, h: 12, d: 14 },
    { x: -20, z: -40, w: 10, h: 18, d: 14 },
    { x:   0, z: -40, w: 14, h: 10, d: 14 },
    { x:  20, z: -40, w: 10, h: 16, d: 14 },
    { x:  40, z: -40, w: 14, h: 14, d: 14 },
    // block row 1
    { x: -40, z: -20, w: 10, h: 20, d: 10 },
    { x:  40, z: -20, w: 10, h: 15, d: 10 },
    // block row 2 (middle — open for park)
    { x: -40, z:   0, w: 10, h:  8, d: 10 },
    { x:  40, z:   0, w: 10, h: 22, d: 10 },
    // block row 3
    { x: -40, z:  20, w: 12, h: 16, d: 10 },
    { x:  20, z:  20, w: 10, h: 12, d: 10 },
    { x:  40, z:  20, w: 12, h: 18, d: 10 },
    // block row 4 (south)
    { x: -40, z:  40, w: 14, h: 12, d: 14 },
    { x: -20, z:  40, w: 10, h: 20, d: 14 },
    { x:   0, z:  40, w: 14, h:  9, d: 14 },
    { x:  20, z:  40, w: 10, h: 15, d: 14 },
    { x:  40, z:  40, w: 14, h: 11, d: 14 },
    // extra interior blocks (alleyway separators)
    { x: -10, z: -20, w:  8, h: 10, d:  8 },
    { x:  10, z: -20, w:  8, h: 14, d:  8 },
    { x: -10, z:  20, w:  8, h: 16, d:  8 },
    { x:  10, z:  20, w:  8, h: 12, d:  8 },
  ];

  /* ── Cover object positions ────────────────────────────────────────────── */
  var coverData = [
    { x:  -5, z:  -5 }, { x:   5, z:  -5 },
    { x: -15, z:   5 }, { x:  15, z:   5 },
    { x:  -5, z:  10 }, { x:   5, z:  10 },
    { x: -25, z: -10 }, { x:  25, z: -10 },
    { x:  -5, z:  30 }, { x:   5, z:  30 },
    { x: -30, z:  30 }, { x:  30, z: -30 },
  ];

  /* ── Extraction point configs ──────────────────────────────────────────── */
  var extractionConfigs = [
    { name: 'PORT',       dir: 'SOUTH',  x:  0,  z:  65, color: 0x00aaff },
    { name: 'AIRFIELD',   dir: 'NORTH',  x:  0,  z: -65, color: 0x00ff88 },
    { name: 'EMBASSY',    dir: 'EAST',   x:  65, z:   0, color: 0xffaa00 },
    { name: 'SUBWAY',     dir: 'CENTER', x:  0,  z:   0, color: 0xff00ff },
    { name: 'SAFEHOUSE2', dir: 'WEST',   x: -65, z:   0, color: 0xffff00 },
  ];

  /* ── Kill team spawn positions ─────────────────────────────────────────── */
  var teamSpawns = [
    // team 0 — east
    [
      { x:  60, z: -20 }, { x:  60, z:   0 }, { x:  60, z:  20 },
      { x:  55, z: -30 }, { x:  55, z:  10 }, { x:  65, z:   5 }
    ],
    // team 1 — west
    [
      { x: -60, z: -20 }, { x: -60, z:   0 }, { x: -60, z:  20 },
      { x: -55, z: -30 }, { x: -55, z:  10 }, { x: -65, z:   5 }
    ],
    // team 2 — north
    [
      { x: -20, z: -65 }, { x:   0, z: -65 }, { x:  20, z: -65 },
      { x: -10, z: -60 }, { x:  10, z: -60 }, { x:   0, z: -70 }
    ],
  ];

  /* ─────────────────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────────────────── */
  function init(cont) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    container = cont;
    _createMaterials();
    _createScene();
    _createHUD();
    _bindInputs();
  }

  /* ── Create shared materials ───────────────────────────────────────────── */
  function _createMaterials() {
    matBuilding1   = new THREE.MeshLambertMaterial({ color: 0x555544 });
    matBuilding2   = new THREE.MeshLambertMaterial({ color: 0x665555 });
    matPark        = new THREE.MeshLambertMaterial({ color: 0x446644 });
    matSafehouse   = new THREE.MeshLambertMaterial({ color: 0x776644 });
    matPlayer      = new THREE.MeshLambertMaterial({ color: 0x2255aa });
    matWitness     = new THREE.MeshLambertMaterial({ color: 0x887766 });
    matAssassin    = new THREE.MeshLambertMaterial({ color: 0x332211 });
    matSniperScope = new THREE.MeshLambertMaterial({ color: 0x111111 });
    matSUV         = new THREE.MeshLambertMaterial({ color: 0x334433 });
    matShell      = new THREE.MeshLambertMaterial({ color: 0xffee00 });
    matGrenade     = new THREE.MeshLambertMaterial({ color: 0x44aa44 });
    matGround      = new THREE.MeshLambertMaterial({ color: 0x333322 });
    matCover       = new THREE.MeshLambertMaterial({ color: 0x888877 });
    matExplosion   = new THREE.MeshLambertMaterial({ color: 0xff6600 });
  }

  /* ── Create scene ──────────────────────────────────────────────────────── */
  function _createScene() {
    scene    = new THREE.Scene();
    scene.background = new THREE.Color(0x334455);
    scene.fog = new THREE.Fog(0x334455, 60, 120);

    clock = new THREE.Clock();

    /* camera */
    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, camHeight, camDistance);
    camera.lookAt(0, 0, 0);

    /* renderer */
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    /* lighting */
    var ambient = new THREE.AmbientLight(0x446688, 0.6);
    scene.add(ambient);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    /* ground */
    var groundGeo  = new THREE.BoxGeometry(160, 0.5, 160);
    var groundMesh = new THREE.Mesh(groundGeo, matGround);
    groundMesh.position.y = -0.25;
    scene.add(groundMesh);

    /* city blocks */
    _buildCity();

    /* park */
    _buildPark();

    /* safehouse */
    _buildSafehouse();

    /* cover objects (barricades, dumpsters) */
    _buildCover();

    /* extraction points */
    _buildExtractionPoints();

    /* player */
    _buildPlayer();

    /* witness */
    _buildWitness();

    /* kill teams */
    _buildKillTeams();

    /* armored SUV */
    _buildSUV();
  }

  /* ── Build city ────────────────────────────────────────────────────────── */
  function _buildCity() {
    buildings = [];
    for (var i = 0; i < buildingData.length; i++) {
      var bd   = buildingData[i];
      var mat  = (i % 2 === 0) ? matBuilding1 : matBuilding2;
      var geo  = new THREE.BoxGeometry(bd.w, bd.h, bd.d);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(bd.x, bd.h / 2, bd.z);
      mesh.castShadow    = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      buildings.push({ mesh: mesh, x: bd.x, z: bd.z, w: bd.w, d: bd.d, h: bd.h });
    }
  }

  /* ── Build park ────────────────────────────────────────────────────────── */
  function _buildPark() {
    var geo  = new THREE.BoxGeometry(18, 0.3, 18);
    parkMesh = new THREE.Mesh(geo, matPark);
    parkMesh.position.set(0, 0.15, 0);
    scene.add(parkMesh);

    /* park benches as small boxes */
    var benchMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var benchPos = [ {x: -5, z: -5}, {x: 5, z: -5}, {x: -5, z: 5}, {x: 5, z: 5} ];
    for (var b = 0; b < benchPos.length; b++) {
      var bg = new THREE.BoxGeometry(2, 0.5, 0.6);
      var bm = new THREE.Mesh(bg, benchMat);
      bm.position.set(benchPos[b].x, 0.25, benchPos[b].z);
      scene.add(bm);
    }
  }

  /* ── Build safehouse ───────────────────────────────────────────────────── */
  function _buildSafehouse() {
    var geo      = new THREE.BoxGeometry(8, 4, 8);
    safehouseMesh = new THREE.Mesh(geo, matSafehouse);
    safehouseMesh.position.set(-30, 2, 0);
    safehouseMesh.castShadow = true;
    scene.add(safehouseMesh);
  }

  /* ── Build cover objects ───────────────────────────────────────────────── */
  function _buildCover() {
    coverObjects = [];
    for (var i = 0; i < coverData.length; i++) {
      var cd  = coverData[i];
      var geo = new THREE.BoxGeometry(2.5, 1.5, 2.5);
      var mesh = new THREE.Mesh(geo, matCover);
      mesh.position.set(cd.x, 0.75, cd.z);
      mesh.castShadow = true;
      scene.add(mesh);
      coverObjects.push({ mesh: mesh, x: cd.x, z: cd.z });
    }
  }

  /* ── Build extraction points (LineSegments markers) ─────────────────────── */
  function _buildExtractionPoints() {
    extractionPoints = [];
    for (var i = 0; i < extractionConfigs.length; i++) {
      var cfg = extractionConfigs[i];
      var lineMat = new THREE.LineBasicMaterial({ color: cfg.color, linewidth: 2 });
      var pts = [
        new THREE.Vector3(-3, 0,  3),
        new THREE.Vector3( 3, 0,  3),
        new THREE.Vector3( 3, 0, -3),
        new THREE.Vector3(-3, 0, -3),
        new THREE.Vector3(-3, 0,  3),
        new THREE.Vector3(-3, 4,  3),
        new THREE.Vector3( 3, 4,  3),
        new THREE.Vector3( 3, 4, -3),
        new THREE.Vector3(-3, 4, -3),
        new THREE.Vector3(-3, 4,  3),
        new THREE.Vector3(-3, 0,  3),
        new THREE.Vector3( 3, 4,  3),
        new THREE.Vector3( 3, 0,  3),
        new THREE.Vector3(-3, 4, -3),
        new THREE.Vector3(-3, 0, -3),
        new THREE.Vector3( 3, 4, -3),
        new THREE.Vector3( 3, 0, -3),
      ];
      var lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      var lineSegs = new THREE.Line(lineGeo, lineMat);
      lineSegs.position.set(cfg.x, 0, cfg.z);
      scene.add(lineSegs);

      /* floor marker */
      var floorGeo  = new THREE.BoxGeometry(6, 0.1, 6);
      var floorMat  = new THREE.MeshLambertMaterial({ color: cfg.color });
      var floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(cfg.x, 0.05, cfg.z);
      scene.add(floorMesh);

      extractionPoints.push({
        name:  cfg.name,
        dir:   cfg.dir,
        x:     cfg.x,
        z:     cfg.z,
        mesh:  lineSegs,
        floor: floorMesh,
        reached: false
      });
    }
  }

  /* ── Build player ──────────────────────────────────────────────────────── */
  function _buildPlayer() {
    var geo  = new THREE.BoxGeometry(1, 2, 1);
    playerMesh = new THREE.Mesh(geo, matPlayer);
    playerMesh.position.set(-30, 1, 0); // starts at safehouse
    playerMesh.castShadow = true;
    scene.add(playerMesh);
  }

  /* ── Build witness ─────────────────────────────────────────────────────── */
  function _buildWitness() {
    var geo  = new THREE.BoxGeometry(0.9, 1.8, 0.9);
    witnessMesh = new THREE.Mesh(geo, matWitness);
    witnessMesh.position.set(-28, 0.9, 0);
    witnessMesh.castShadow = true;
    scene.add(witnessMesh);
  }

  /* ── Build kill teams ──────────────────────────────────────────────────── */
  function _buildKillTeams() {
    assassins = [];
    for (var team = 0; team < 3; team++) {
      for (var slot = 0; slot < 6; slot++) {
        var spawn    = teamSpawns[team][slot];
        var isSniper = (slot === 5); // last slot per team is sniper
        _spawnAssassin(spawn.x, spawn.z, team, isSniper);
      }
    }
  }

  function _spawnAssassin(spawnX, spawnZ, team, isSniper) {
    var bodyGeo  = new THREE.BoxGeometry(0.9, 1.8, 0.9);
    var bodyMesh = new THREE.Mesh(bodyGeo, matAssassin);
    bodyMesh.position.set(spawnX, 0.9, spawnZ);
    bodyMesh.castShadow = true;
    scene.add(bodyMesh);

    var scopeMesh = null;
    if (isSniper) {
      /* sniper scope visual (CylinderGeometry) */
      var scopeGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6);
      scopeMesh = new THREE.Mesh(scopeGeo, matSniperScope);
      scopeMesh.rotation.z = Math.PI / 2;
      scopeMesh.position.set(0.6, 0.5, 0);
      bodyMesh.add(scopeMesh);
    }

    var patrolAngle  = Math.random() * Math.PI * 2;
    var patrolRadius = 8 + Math.random() * 6;

    assassins.push({
      mesh:         bodyMesh,
      scopeMesh:    scopeMesh,
      hp:           80,
      maxHp:        80,
      team:         team,
      isSniper:     isSniper,
      sniperTimer:  4 + Math.random() * 4, // stagger initial shot
      speed:        isSniper ? 3 : (3.5 + Math.random() * 1.5),
      state:        'patrol',  // patrol / chase / intercept
      patrolAngle:  patrolAngle,
      patrolRadius: patrolRadius,
      patrolOrigin: { x: spawnX, z: spawnZ },
      active:       true,
      fireTimer:    0.4 + Math.random() * 0.6,
    });
  }

  /* ── Build armored SUV ─────────────────────────────────────────────────── */
  function _buildSUV() {
    var bodyGeo = new THREE.BoxGeometry(3, 2, 5);
    suvMesh = new THREE.Mesh(bodyGeo, matSUV);
    suvMesh.position.set(0, 1, 60);
    suvMesh.castShadow = true;
    scene.add(suvMesh);

    /* add wheel-like cylinders */
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var wheelPositions = [
      { x:  1.6, z:  1.8 }, { x: -1.6, z:  1.8 },
      { x:  1.6, z: -1.8 }, { x: -1.6, z: -1.8 },
    ];
    for (var w = 0; w < wheelPositions.length; w++) {
      var wg = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 8);
      var wm = new THREE.Mesh(wg, wheelMat);
      wm.rotation.z = Math.PI / 2;
      wm.position.set(wheelPositions[w].x, -0.6, wheelPositions[w].z);
      suvMesh.add(wm);
    }

    suvHP     = 4;
    suvActive = true;
  }

  /* ── Create HUD overlay ────────────────────────────────────────────────── */
  function _createHUD() {
    /* remove old if any */
    var old = document.getElementById('wp-hud');
    if (old) old.parentNode.removeChild(old);

    hudDiv = document.createElement('div');
    hudDiv.id = 'wp-hud';
    hudDiv.style.cssText = [
      'position:absolute',
      'top:10px',
      'left:10px',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:13px',
      'background:rgba(0,0,0,0.55)',
      'padding:8px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'line-height:1.6',
      'z-index:9999',
      'max-width:500px',
    ].join(';');
    container.style.position = 'relative';
    container.appendChild(hudDiv);
  }

  function _updateHUD() {
    if (!hudDiv) return;

    var mins    = Math.floor(timerSeconds / 60);
    var secs    = Math.floor(timerSeconds % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

    var witnessStatus = witnessHP <= 0 ? 'DEAD' : (witnessInjured ? 'INJURED ' + witnessHP + ' HP' : 'SAFE');
    var teamCount = 0;
    for (var t = 0; t < killTeams.length; t++) {
      if (killTeams[t].active) teamCount++;
    }
    var enemyCount = 0;
    for (var a = 0; a < assassins.length; a++) {
      if (assassins[a].active) enemyCount++;
    }

    var lines = [
      'WITNESS PROTECTION',
      'WITNESS: ' + witnessStatus,
      'KILL TEAMS: ' + teamCount + ' ACTIVE',
      'ROUTE: ' + chosenRoute,
      'TIMER: ' + timeStr,
      'ENEMIES: ' + enemyCount,
      'HP: ' + playerHP,
      'SUV: ' + (suvActive ? suvHP + ' hits to destroy' : 'DESTROYED'),
    ];

    if (gameOver) {
      lines.push('');
      lines.push(gameWon ? '*** EXTRACTION SUCCESSFUL ***' : '*** MISSION FAILED ***');
      if (gameOverMessage) lines.push(gameOverMessage);
    } else if (!active) {
      lines = ['Press W then P (within 400ms) to start WITNESS PROTECTION'];
    }

    hudDiv.innerHTML = lines.join('<br>');
  }

  /* ── Bind inputs ───────────────────────────────────────────────────────── */
  function _bindInputs() {
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mousedown', _onMouseDown);
    window.addEventListener('mouseup',   _onMouseUp);
    window.addEventListener('resize',    _onResize);
    window.addEventListener('click',     _onClickShoot);
  }

  function _onKeyDown(e) {
    keys[e.code] = true;

    /* W+P activation */
    if (e.code === 'KeyW') { wPressTime = Date.now(); }
    if (e.code === 'KeyP') {
      pPressTime = Date.now();
      if (Math.abs(pPressTime - wPressTime) <= 400) {
        active = true;
        gameStarted = true;
        clock.start();
      }
    }

    /* grenade */
    if (e.code === 'KeyG' && active && !gameOver) {
      _throwGrenade();
    }
  }

  function _onKeyUp(e) {
    keys[e.code] = false;
  }

  function _onMouseMove(e) {
    var rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouseY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
  }

  function _onMouseDown(e) { mouseDown = true; }
  function _onMouseUp(e)   { mouseDown = false; }

  function _onClickShoot(e) {
    if (!active || gameOver) return;
    _playerShoot();
  }

  function _onResize() {
    if (!renderer || !camera) return;
    var w = container.clientWidth;
    var h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ─────────────────────────────────────────────────────────────────────────
     UPDATE (called every frame by host game loop)
  ───────────────────────────────────────────────────────────────────────── */
  function update(delta) {
    if (!scene || !renderer || !camera) return;

    _updateHUD();

    if (!active || gameOver) {
      if (renderer) renderer.render(scene, camera);
      return;
    }

    /* Clamp delta to avoid spiral of death */
    if (delta > 0.1) delta = 0.1;

    /* countdown timer */
    timerSeconds -= delta;
    if (timerSeconds <= 0) {
      timerSeconds = 0;
      _triggerLose('TIMER EXPIRED — WITNESS LEFT BEHIND');
      if (renderer) renderer.render(scene, camera);
      return;
    }

    /* cooldowns */
    if (shootCooldown  > 0) shootCooldown  -= delta;
    if (grenadeCooldown > 0) grenadeCooldown -= delta;
    if (suvRamCooldown > 0) suvRamCooldown -= delta;

    /* continuous shoot on hold */
    if (mouseDown && shootCooldown <= 0) {
      _playerShoot();
    }

    /* player movement */
    _updatePlayer(delta);

    /* witness follow */
    _updateWitness(delta);

    /* assassin AI */
    _updateAssassins(delta);

    /* SUV */
    _updateSUV(delta);

    /* bullets */
    _updateBullets(delta);

    /* grenades */
    _updateGrenades(delta);

    /* explosions */
    _updateExplosions(delta);

    /* extraction check */
    _checkExtraction();

    /* determine chosen route (nearest extraction the player is heading to) */
    _updateChosenRoute();

    /* camera follow */
    _updateCamera();

    if (renderer) renderer.render(scene, camera);
  }

  /* ── Player movement ───────────────────────────────────────────────────── */
  function _updatePlayer(delta) {
    if (!playerMesh) return;

    /* compute movement direction from WASD relative to camera facing */
    var forward  = new THREE.Vector3();
    var right    = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    var moveX = 0, moveZ = 0;
    if (keys['KeyW'] || keys['ArrowUp'])    { moveX += forward.x; moveZ += forward.z; }
    if (keys['KeyS'] || keys['ArrowDown'])  { moveX -= forward.x; moveZ -= forward.z; }
    if (keys['KeyA'] || keys['ArrowLeft'])  { moveX -= right.x;   moveZ -= right.z;   }
    if (keys['KeyD'] || keys['ArrowRight']) { moveX += right.x;   moveZ += right.z;   }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX = (moveX / len) * playerSpeed * delta;
      moveZ = (moveZ / len) * playerSpeed * delta;
    }

    var newX = playerMesh.position.x + moveX;
    var newZ = playerMesh.position.z + moveZ;

    /* simple building collision */
    if (!_collidesBuilding(newX, playerMesh.position.z, 0.6)) {
      playerMesh.position.x = newX;
    }
    if (!_collidesBuilding(playerMesh.position.x, newZ, 0.6)) {
      playerMesh.position.z = newZ;
    }

    /* world boundary */
    playerMesh.position.x = Math.max(-78, Math.min(78, playerMesh.position.x));
    playerMesh.position.z = Math.max(-78, Math.min(78, playerMesh.position.z));

    /* face movement direction */
    if (len > 0) {
      playerMesh.rotation.y = Math.atan2(moveX, moveZ);
    }
  }

  /* ── Witness follow ────────────────────────────────────────────────────── */
  function _updateWitness(delta) {
    if (!witnessMesh || witnessHP <= 0) return;

    var px = playerMesh.position.x;
    var pz = playerMesh.position.z;
    var wx = witnessMesh.position.x;
    var wz = witnessMesh.position.z;

    var dx = px - wx;
    var dz = pz - wz;
    var dist = Math.sqrt(dx * dx + dz * dz);

    /* follow at 3+ units behind player */
    if (dist > witnessFollowDist + 0.5) {
      var spd = (dist > witnessFollowDist * 2) ? 5 : 3;
      var nx  = wx + (dx / dist) * spd * delta;
      var nz  = wz + (dz / dist) * spd * delta;

      if (!_collidesBuilding(nx, witnessMesh.position.z, 0.5)) {
        witnessMesh.position.x = nx;
      }
      if (!_collidesBuilding(witnessMesh.position.x, nz, 0.5)) {
        witnessMesh.position.z = nz;
      }

      witnessMesh.rotation.y = Math.atan2(dx, dz);
    }
  }

  /* ── Assassin AI ───────────────────────────────────────────────────────── */
  function _updateAssassins(delta) {
    var px = playerMesh.position.x;
    var pz = playerMesh.position.z;
    var wx = witnessMesh.position.x;
    var wz = witnessMesh.position.z;

    for (var i = 0; i < assassins.length; i++) {
      var a = assassins[i];
      if (!a.active) continue;

      var ax = a.mesh.position.x;
      var az = a.mesh.position.z;

      /* distance to player */
      var dpx = px - ax, dpz = pz - az;
      var distPlayer = Math.sqrt(dpx * dpx + dpz * dpz);

      /* distance to witness */
      var dwx = wx - ax, dwz = wz - az;
      var distWitness = Math.sqrt(dwx * dwx + dwz * dwz);

      /* choose target (witness priority if close) */
      var targetX, targetZ, distTarget;
      if (distWitness < distPlayer) {
        targetX = wx; targetZ = wz; distTarget = distWitness;
      } else {
        targetX = px; targetZ = pz; distTarget = distPlayer;
      }

      var dtx = targetX - ax, dtz = targetZ - az;

      /* state machine */
      if (distTarget < 40) {
        a.state = 'chase';
      } else if (a.state === 'chase' && distTarget > 55) {
        a.state = 'patrol';
      }

      /* intercept logic: if chosen route is near a team, that team intercepts */
      if (chosenRoute !== 'N/A') {
        var routeDir = chosenRoute;
        if ((a.team === 0 && routeDir === 'EAST') ||
            (a.team === 1 && routeDir === 'WEST') ||
            (a.team === 2 && routeDir === 'NORTH')) {
          /* rush toward the extraction corridor */
          var interceptX = px + (targetX - px) * 0.5;
          var interceptZ = pz + (targetZ - pz) * 0.5;
          dtx = interceptX - ax;
          dtz = interceptZ - az;
          var id = Math.sqrt(dtx * dtx + dtz * dtz);
          if (id > 1) {
            dtx /= id; dtz /= id;
          }
          a.state = 'intercept';
        }
      }

      if (a.state === 'patrol') {
        /* circle patrol */
        a.patrolAngle += delta * 0.5;
        var ptx = a.patrolOrigin.x + Math.cos(a.patrolAngle) * a.patrolRadius;
        var ptz = a.patrolOrigin.z + Math.sin(a.patrolAngle) * a.patrolRadius;
        dtx = ptx - ax;
        dtz = ptz - az;
        distTarget = Math.sqrt(dtx * dtx + dtz * dtz);
        if (distTarget > 0.5) {
          dtx /= distTarget; dtz /= distTarget;
          var nx = ax + dtx * a.speed * 0.5 * delta;
          var nz = az + dtz * a.speed * 0.5 * delta;
          if (!_collidesBuilding(nx, az, 0.45)) a.mesh.position.x = nx;
          if (!_collidesBuilding(ax, nz, 0.45)) a.mesh.position.z = nz;
        }
      } else {
        /* chase / intercept — move toward target */
        if (distTarget > 1.5) {
          var nd = Math.sqrt(dtx * dtx + dtz * dtz);
          if (nd > 0) { dtx /= nd; dtz /= nd; }
          var spd2 = a.speed;
          if (a.isSniper) spd2 = 2; // snipers move slower
          var nx2 = ax + dtx * spd2 * delta;
          var nz2 = az + dtz * spd2 * delta;
          if (!_collidesBuilding(nx2, az, 0.45)) a.mesh.position.x = nx2;
          if (!_collidesBuilding(ax, nz2, 0.45)) a.mesh.position.z = nz2;
          a.mesh.rotation.y = Math.atan2(dtx, dtz);
        }

        /* regular assassin shooting */
        if (!a.isSniper && distTarget < 20) {
          a.fireTimer -= delta;
          if (a.fireTimer <= 0) {
            a.fireTimer = 0.8 + Math.random() * 0.8;
            /* shoot at player */
            _enemyShoot(a, targetX, targetZ);
          }
        }
      }

      /* sniper logic */
      if (a.isSniper) {
        a.sniperTimer -= delta;
        if (a.sniperTimer <= 0) {
          a.sniperTimer = 8;
          /* fire at player from distance */
          _sniperFire(a);
        }
      }
    }

    /* update kill team active status */
    for (var t = 0; t < 3; t++) {
      var anyAlive = false;
      for (var j = 0; j < assassins.length; j++) {
        if (assassins[j].team === t && assassins[j].active) {
          anyAlive = true;
          break;
        }
      }
      killTeams[t].active = anyAlive;
    }
  }

  function _enemyShoot(assassin, targetX, targetZ) {
    var ax = assassin.mesh.position.x;
    var az = assassin.mesh.position.z;
    var dx = targetX - ax;
    var dz = targetZ - az;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.1) return;
    dx /= dist; dz /= dist;

    /* add inaccuracy */
    dx += (Math.random() - 0.5) * 0.3;
    dz += (Math.random() - 0.5) * 0.3;

    var geo  = new THREE.SphereGeometry(0.12, 4, 4);
    var mesh = new THREE.Mesh(geo, matShell);
    mesh.position.set(ax, 1.2, az);
    scene.add(mesh);

    playerBullets.push({
      mesh:    mesh,
      vx:      dx * 18,
      vz:      dz * 18,
      life:    2.5,
      isEnemy: true,
      damage:  10,
    });
  }

  function _sniperFire(sniper) {
    var ax = sniper.mesh.position.x;
    var az = sniper.mesh.position.z;
    var px = playerMesh.position.x;
    var pz = playerMesh.position.z;

    /* sniper fires with near-perfect accuracy */
    var dx = px - ax, dz = pz - az;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.1) return;

    /* slightly lead the target */
    dx = (px - ax + (Math.random() - 0.5) * 1.5) / dist;
    dz = (pz - az + (Math.random() - 0.5) * 1.5) / dist;

    var geo  = new THREE.SphereGeometry(0.1, 4, 4);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xff3300 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ax, 3, az); // fires from elevated spot
    scene.add(mesh);

    playerBullets.push({
      mesh:    mesh,
      vx:      dx * 28,
      vz:      dz * 28,
      life:    3.5,
      isEnemy: true,
      damage:  40, // sniper damage
      isSniper: true,
    });
  }

  /* ── SUV AI ────────────────────────────────────────────────────────────── */
  function _updateSUV(delta) {
    if (!suvActive || !suvMesh || suvHP <= 0) return;

    var sx = suvMesh.position.x;
    var sz = suvMesh.position.z;
    var px = playerMesh.position.x;
    var pz = playerMesh.position.z;

    var dx = px - sx, dz = pz - sz;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.1) {
      dx /= dist; dz /= dist;
      var spd = suvSpeed;
      /* accelerate when far */
      if (dist > 30) spd = suvSpeed * 1.5;

      suvMesh.position.x += dx * spd * delta;
      suvMesh.position.z += dz * spd * delta;
      suvMesh.rotation.y = Math.atan2(dx, dz);
    }

    /* ram player */
    if (dist < 3 && suvRamCooldown <= 0) {
      playerHP -= 20;
      suvRamCooldown = 3;
      if (playerHP <= 0) {
        _triggerLose('PLAYER KILLED BY ARMORED SUV');
      }
    }

    /* ram witness */
    var wx = witnessMesh.position.x, wz = witnessMesh.position.z;
    var dxw = wx - sx, dzw = wz - sz;
    var dstW = Math.sqrt(dxw * dxw + dzw * dzw);
    if (dstW < 3 && suvRamCooldown <= 0) {
      witnessHP -= 15;
      _checkWitnessInjured();
      suvRamCooldown = 3;
    }
  }

  /* ── Player shoot ──────────────────────────────────────────────────────── */
  function _playerShoot() {
    if (shootCooldown > 0) return;
    shootCooldown = 0.18;

    /* cast ray from player toward mouse world position */
    var px = playerMesh.position.x;
    var pz = playerMesh.position.z;

    /* use raycasting via mouse position to get world target */
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    /* find intersection with y=0 plane */
    var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    var target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    var dx = target.x - px, dz = target.z - pz;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.1) return;
    dx /= dist; dz /= dist;

    var geo  = new THREE.SphereGeometry(0.14, 4, 4);
    var mesh = new THREE.Mesh(geo, matShell);
    mesh.position.set(px, 1.2, pz);
    scene.add(mesh);

    playerBullets.push({
      mesh:    mesh,
      vx:      dx * 30,
      vz:      dz * 30,
      life:    2.0,
      isEnemy: false,
      damage:  25,
    });
  }

  /* ── Grenade throw ─────────────────────────────────────────────────────── */
  function _throwGrenade() {
    if (grenadeCooldown > 0) return;
    grenadeCooldown = 1.5;

    var px = playerMesh.position.x;
    var pz = playerMesh.position.z;

    /* throw toward mouse */
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
    var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    var target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    var dx = target.x - px, dz = target.z - pz;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.1) { dx = 0; dz = -1; } else { dx /= dist; dz /= dist; }

    var geo  = new THREE.SphereGeometry(0.2, 6, 6);
    var mesh = new THREE.Mesh(geo, matGrenade);
    mesh.position.set(px, 0.5, pz);
    scene.add(mesh);

    grenades.push({
      mesh:    mesh,
      vx:      dx * 14,
      vy:      5,
      vz:      dz * 14,
      life:    2.5,
      fused:   true,
    });
  }

  /* ── Update bullets ────────────────────────────────────────────────────── */
  function _updateBullets(delta) {
    var px = playerMesh.position.x, py = 1, pz = playerMesh.position.z;
    var wx = witnessMesh.position.x, wz = witnessMesh.position.z;

    for (var i = playerBullets.length - 1; i >= 0; i--) {
      var b = playerBullets[i];
      b.life -= delta;
      b.mesh.position.x += b.vx * delta;
      b.mesh.position.z += b.vz * delta;

      var remove = false;

      if (b.life <= 0) {
        remove = true;
      } else if (b.isEnemy) {
        /* check hit player */
        var dpx = b.mesh.position.x - px;
        var dpz = b.mesh.position.z - pz;
        if (Math.sqrt(dpx * dpx + dpz * dpz) < 1.0) {
          playerHP -= b.damage;
          remove = true;
          if (playerHP <= 0) {
            _triggerLose('PLAYER KILLED IN ACTION');
          }
        }
        /* check hit witness */
        var dwx2 = b.mesh.position.x - wx;
        var dwz2 = b.mesh.position.z - wz;
        if (Math.sqrt(dwx2 * dwx2 + dwz2 * dwz2) < 0.9) {
          witnessHP -= b.damage;
          _checkWitnessInjured();
          remove = true;
        }
      } else {
        /* player shot — check hit assassins */
        for (var j = 0; j < assassins.length; j++) {
          var a2 = assassins[j];
          if (!a2.active) continue;
          var dax = b.mesh.position.x - a2.mesh.position.x;
          var daz = b.mesh.position.z - a2.mesh.position.z;
          if (Math.sqrt(dax * dax + daz * daz) < 0.9) {
            a2.hp -= b.damage;
            if (a2.hp <= 0) _killAssassin(a2);
            remove = true;
            break;
          }
        }
        /* check hit SUV */
        if (!remove && suvActive) {
          var dsx = b.mesh.position.x - suvMesh.position.x;
          var dsz = b.mesh.position.z - suvMesh.position.z;
          if (Math.sqrt(dsx * dsx + dsz * dsz) < 2.5) {
            /* bullets don't destroy SUV, just bounce off */
            remove = true;
          }
        }
        /* check building collision */
        if (!remove && _collidesBuilding(b.mesh.position.x, b.mesh.position.z, 0.2)) {
          remove = true;
        }
      }

      if (remove) {
        scene.remove(b.mesh);
        playerBullets.splice(i, 1);
      }
    }
  }

  /* ── Update grenades ───────────────────────────────────────────────────── */
  function _updateGrenades(delta) {
    for (var i = grenades.length - 1; i >= 0; i--) {
      var g = grenades[i];
      g.life -= delta;
      g.mesh.position.x += g.vx * delta;
      g.mesh.position.y += g.vy * delta;
      g.mesh.position.z += g.vz * delta;
      g.vy -= 15 * delta; // gravity

      if (g.mesh.position.y < 0.2) {
        g.mesh.position.y = 0.2;
        g.vy = Math.abs(g.vy) * 0.3;
        g.vx *= 0.7; g.vz *= 0.7;
      }

      if (g.life <= 0) {
        /* EXPLODE */
        _explodeGrenade(g);
        scene.remove(g.mesh);
        grenades.splice(i, 1);
      }
    }
  }

  function _explodeGrenade(g) {
    var gx = g.mesh.position.x, gz = g.mesh.position.z;
    var blastRadius = 6;

    /* spawn explosion VFX */
    var expGeo  = new THREE.SphereGeometry(blastRadius * 0.5, 8, 8);
    var expMesh = new THREE.Mesh(expGeo, matExplosion.clone());
    expMesh.position.set(gx, 1, gz);
    scene.add(expMesh);
    explosions.push({ mesh: expMesh, life: 0.5, maxLife: 0.5 });

    /* damage assassins in radius */
    for (var j = 0; j < assassins.length; j++) {
      var a = assassins[j];
      if (!a.active) continue;
      var dx = a.mesh.position.x - gx, dz = a.mesh.position.z - gz;
      if (Math.sqrt(dx * dx + dz * dz) < blastRadius) {
        a.hp -= 60;
        if (a.hp <= 0) _killAssassin(a);
      }
    }

    /* damage SUV */
    if (suvActive && suvMesh) {
      var sdx = suvMesh.position.x - gx, sdz = suvMesh.position.z - gz;
      if (Math.sqrt(sdx * sdx + sdz * sdz) < blastRadius) {
        suvHP--;
        if (suvHP <= 0) {
          _destroySUV();
        }
      }
    }

    /* damage player if too close */
    var pdx = playerMesh.position.x - gx, pdz = playerMesh.position.z - gz;
    if (Math.sqrt(pdx * pdx + pdz * pdz) < blastRadius * 0.5) {
      playerHP -= 15;
      if (playerHP <= 0) _triggerLose('PLAYER KILLED BY OWN GRENADE');
    }

    /* damage witness if too close */
    var wdx = witnessMesh.position.x - gx, wdz = witnessMesh.position.z - gz;
    if (Math.sqrt(wdx * wdx + wdz * wdz) < blastRadius * 0.5) {
      witnessHP -= 20;
      _checkWitnessInjured();
    }
  }

  /* ── Explosion VFX update ──────────────────────────────────────────────── */
  function _updateExplosions(delta) {
    for (var i = explosions.length - 1; i >= 0; i--) {
      var e = explosions[i];
      e.life -= delta;
      var t  = e.life / e.maxLife;
      e.mesh.scale.setScalar(1 + (1 - t) * 1.5);
      e.mesh.material.opacity = t;
      e.mesh.material.transparent = true;
      if (e.life <= 0) {
        scene.remove(e.mesh);
        explosions.splice(i, 1);
      }
    }
  }

  /* ── Kill assassin ─────────────────────────────────────────────────────── */
  function _killAssassin(a) {
    a.active = false;
    scene.remove(a.mesh);
  }

  /* ── Destroy SUV ───────────────────────────────────────────────────────── */
  function _destroySUV() {
    suvActive = false;
    if (suvMesh) {
      /* turn it dark */
      suvMesh.material = new THREE.MeshLambertMaterial({ color: 0x111111 });
    }
    /* spawn explosion */
    var expGeo  = new THREE.SphereGeometry(5, 8, 8);
    var expMesh = new THREE.Mesh(expGeo, matExplosion.clone());
    expMesh.position.copy(suvMesh.position);
    expMesh.position.y = 2;
    scene.add(expMesh);
    explosions.push({ mesh: expMesh, life: 1.0, maxLife: 1.0 });
  }

  /* ── Check witness injured / dead ──────────────────────────────────────── */
  function _checkWitnessInjured() {
    if (witnessHP <= 0) {
      witnessHP = 0;
      _triggerLose('WITNESS KILLED — MISSION FAILED');
    } else if (witnessHP < 50) {
      witnessInjured = true;
      /* tint witness mesh */
      witnessMesh.material = new THREE.MeshLambertMaterial({ color: 0xaa4422 });
    }
  }

  /* ── Extraction check ──────────────────────────────────────────────────── */
  function _checkExtraction() {
    var px = playerMesh.position.x, pz = playerMesh.position.z;
    var wx = witnessMesh.position.x, wz = witnessMesh.position.z;

    for (var i = 0; i < extractionPoints.length; i++) {
      var ep = extractionPoints[i];
      var dwx = wx - ep.x, dwz = wz - ep.z;
      var dpx = px - ep.x, dpz = pz - ep.z;

      if (Math.sqrt(dwx * dwx + dwz * dwz) < 2 &&
          Math.sqrt(dpx * dpx + dpz * dpz) < 4) {
        /* witness is at extraction with player nearby */
        _triggerWin(ep.name);
        return;
      }
    }
  }

  /* ── Update chosen route label ─────────────────────────────────────────── */
  function _updateChosenRoute() {
    var px = playerMesh.position.x, pz = playerMesh.position.z;
    var best = 'N/A';
    var bestDist = 999;

    for (var i = 0; i < extractionPoints.length; i++) {
      var ep = extractionPoints[i];
      var dx = px - ep.x, dz = pz - ep.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < bestDist) {
        bestDist = d;
        best = ep.name;
      }
    }

    /* only update once player is moving toward an extraction */
    if (bestDist < 35) {
      chosenRoute = best;
    } else if (chosenRoute === 'N/A' && playerMesh.position.z > 10) {
      chosenRoute = 'PORT';
    } else if (chosenRoute === 'N/A' && playerMesh.position.z < -10) {
      chosenRoute = 'AIRFIELD';
    } else if (chosenRoute === 'N/A' && playerMesh.position.x > 10) {
      chosenRoute = 'EMBASSY';
    } else if (chosenRoute === 'N/A' && playerMesh.position.x < -20) {
      chosenRoute = 'SAFEHOUSE2';
    }
  }

  /* ── Camera follow ─────────────────────────────────────────────────────── */
  function _updateCamera() {
    if (!playerMesh || !camera) return;
    var px = playerMesh.position.x, pz = playerMesh.position.z;

    /* smooth follow */
    var targetCamX = px;
    var targetCamY = camHeight;
    var targetCamZ = pz + camDistance;

    camera.position.x += (targetCamX - camera.position.x) * 0.1;
    camera.position.y += (targetCamY - camera.position.y) * 0.1;
    camera.position.z += (targetCamZ - camera.position.z) * 0.1;

    camera.lookAt(px, 0, pz);
  }

  /* ── Building collision helper ─────────────────────────────────────────── */
  function _collidesBuilding(x, z, radius) {
    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      var hw = b.w / 2 + radius;
      var hd = b.d / 2 + radius;
      if (Math.abs(x - b.x) < hw && Math.abs(z - b.z) < hd) {
        return true;
      }
    }
    return false;
  }

  /* ── Win / Lose ────────────────────────────────────────────────────────── */
  function _triggerWin(routeName) {
    if (gameOver) return;
    gameOver  = true;
    gameWon   = true;
    gameOverMessage = 'WITNESS EXTRACTED VIA ' + routeName + '!';
    chosenRoute = routeName;
  }

  function _triggerLose(reason) {
    if (gameOver) return;
    gameOver  = true;
    gameWon   = false;
    gameOverMessage = reason;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     RESET
  ───────────────────────────────────────────────────────────────────────── */
  function reset() {
    /* tear down old scene */
    if (renderer && container) {
      container.removeChild(renderer.domElement);
      renderer.dispose();
    }

    /* remove HUD */
    if (hudDiv && hudDiv.parentNode) {
      hudDiv.parentNode.removeChild(hudDiv);
      hudDiv = null;
    }

    /* reset state */
    active        = false;
    gameOver      = false;
    gameWon       = false;
    gameOverMessage = '';
    timerSeconds  = 900;
    gameStarted   = false;
    playerHP      = 100;
    witnessHP     = 50;
    witnessInjured = false;
    chosenRoute   = 'N/A';
    playerBullets = [];
    grenades      = [];
    assassins     = [];
    buildings     = [];
    coverObjects  = [];
    extractionPoints = [];
    explosions    = [];
    keys          = {};
    wPressTime    = 0;
    pPressTime    = 0;
    mouseDown     = false;
    shootCooldown = 0;
    grenadeCooldown = 0;
    suvHP         = 4;
    suvActive     = true;
    suvRamCooldown = 0;

    scene    = null;
    camera   = null;
    renderer = null;
    clock    = null;
    playerMesh  = null;
    witnessMesh = null;
    suvMesh     = null;
    parkMesh    = null;
    safehouseMesh = null;

    /* remove event listeners */
    window.removeEventListener('keydown',   _onKeyDown);
    window.removeEventListener('keyup',     _onKeyUp);
    window.removeEventListener('mousemove', _onMouseMove);
    window.removeEventListener('mousedown', _onMouseDown);
    window.removeEventListener('mouseup',   _onMouseUp);
    window.removeEventListener('resize',    _onResize);
    window.removeEventListener('click',     _onClickShoot);
  }

  /* ── Public API ────────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

})();
