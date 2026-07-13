/* ───────────────────────────────────────────────────────────────────────────
   warlord-hunt.js — Warlord Hunt Mission
   API: window.WarlordHunt = { init, update, reset }
   Controls:
     W + L (together, within 400ms)  → activate module
     WASD / Mouse                    → move / look
     Left-Click                      → fire weapon
     E (hold 2s near elder)          → interrogate village elder
     E (near downed radio op)        → interrogate radio operator
     E (near documents)              → collect intel documents
     E (near downed teammate, 3s)    → revive teammate
     Q                               → teammates hold position
     R                               → teammates suppress target
     Left-Click on radio operator    → non-lethal shot (pistol)
   ─────────────────────────────────────────────────────────────────────────── */
window.WarlordHunt = (function () {
  'use strict';

  /* ── Scene refs ─────────────────────────────────────────────────────────── */
  var _scene   = null;
  var _camera  = null;
  var _canvas  = null;
  var _active  = false;

  /* ── Activation keys ────────────────────────────────────────────────────── */
  var _wPressTime = 0;
  var _lPressTime = 0;
  var _keys       = {};

  /* ── Player ─────────────────────────────────────────────────────────────── */
  var _player      = null;
  var _playerHP    = 100;
  var _yaw         = 0;
  var _pitch       = 0;
  var _speed       = 8;
  var _inRiver     = false;
  var _fireTimer   = 0;
  var _pistolMode  = false;  // for non-lethal shot on radio operator

  /* ── Teammates ──────────────────────────────────────────────────────────── */
  var _teammates    = [];   // { mesh, hp, alive, downed, reviveTimer, pos, holdPos, suppressTarget, fireTimer }
  var _teammateCmd  = 'follow'; // 'follow' | 'hold' | 'suppress'

  /* ── Enemies ────────────────────────────────────────────────────────────── */
  var _enemies          = [];  // { mesh, hp, alive, alert, pos, patrolAngle, group, fireTimer }
  var _alertLevel       = 0;   // 0=stealth 1=searching 2=combat
  var _alertTimer       = 0;
  var _compoundBreached = false;

  /* ── General Kanu ───────────────────────────────────────────────────────── */
  var _kanu            = null;
  var _kanuMesh        = null;
  var _kanuHP          = 600;
  var _kanuAlive       = true;
  var _kanuState       = 'bunker'; // 'bunker' | 'escaping' | 'escaped' | 'dead'
  var _kanuEscapeTimer = 0;
  var _radioDestroyed  = false;
  var _radioMesh       = null;
  var _helicopterTimer = 0;   // counts down to helicopter arrival when kanu escapes

  /* ── Intelligence ───────────────────────────────────────────────────────── */
  var _intelCount          = 0;   // 0-3
  var _kanuStatus          = 'UNKNOWN'; // 'UNKNOWN' | 'LOCATED' | 'ELIMINATED'
  var _elderIntelDone      = false;
  var _radioOpIntelDone    = false;
  var _docsIntelDone       = false;
  var _elderInteractTimer  = 0;
  var _radioOpInteractTimer = 0;
  var _docsInteractTimer   = 0;

  /* ── NPCs ────────────────────────────────────────────────────────────────── */
  var _elderMesh       = null;
  var _radioOpMesh     = null;
  var _radioOpDowned   = false;
  var _radioOpAlive    = true;
  var _govBuildingPos  = null;
  var _docsMesh        = null;

  /* ── Reinforcement waves ────────────────────────────────────────────────── */
  var _missionTime     = 0;
  var _wave1Spawned    = false;
  var _wave2Spawned    = false;
  var _wave3Spawned    = false;
  var _nextReinfTimer  = 300; // 5 minutes in seconds
  var _reinforceWave   = 0;

  /* ── Revive ──────────────────────────────────────────────────────────────── */
  var _reviveTimer     = 0;
  var _reviveTarget    = null;

  /* ── Scene objects ───────────────────────────────────────────────────────── */
  var _sceneMeshes     = [];
  var _groundMesh      = null;
  var _riverMesh       = null;
  var _walls           = [];
  var _bunkerMesh      = null;
  var _trapdoorMesh    = null;

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  var _hudEl           = null;

  /* ── Fog / bg backup ────────────────────────────────────────────────────── */
  var _fogBackup  = null;
  var _bgBackup   = null;

  /* ── Constants ───────────────────────────────────────────────────────────── */
  var ACTIVATION_WINDOW   = 400;
  var JUNGLE_SIZE         = 200;
  var TREE_COUNT          = 60;
  var UNDERGROWTH_COUNT   = 80;
  var ENEMY_COUNT_TOTAL   = 40;
  var CHECKPOINT_GROUPS   = 4;
  var COMPOUND_GUARDS     = 15;
  var ENEMY_HP            = 70;
  var TEAMMATE_HP         = 120;
  var PLAYER_FIRE_RATE    = 0.2;
  var ENEMY_FIRE_RATE     = 1.2;
  var ENEMY_AGGRO_RANGE   = 25;
  var ALERT_RESPONSE_TIME = 30;
  var RIVER_SLOW_FACTOR   = 0.4;
  var INTERACT_RANGE      = 3.5;
  var ELDER_INTERACT_TIME = 2;
  var REVIVE_TIME         = 3;
  var BUNKER_POS          = { x: 80, y: -2, z: 80 };
  var COMPOUND_CENTER     = { x: 80, y: 0, z: 80 };
  var COMPOUND_ESCAPE_POS = { x: 110, y: 0, z: 80 };

  /* ═══════════════════════════════════════════════════════════════════════════
     SCENE BUILDING
  ═══════════════════════════════════════════════════════════════════════════ */

  function buildScene() {
    /* ground */
    var gGeo  = new THREE.BoxGeometry(JUNGLE_SIZE * 2, 0.5, JUNGLE_SIZE * 2);
    var gMat  = new THREE.MeshLambertMaterial({ color: 0x3a5a1a });
    _groundMesh = new THREE.Mesh(gGeo, gMat);
    _groundMesh.position.y = -0.25;
    _scene.add(_groundMesh);
    _sceneMeshes.push(_groundMesh);

    /* jungle trees — CylinderGeometry trunks + canopy */
    var i;
    for (i = 0; i < TREE_COUNT; i++) {
      var tx = (Math.random() - 0.5) * JUNGLE_SIZE * 1.8;
      var tz = (Math.random() - 0.5) * JUNGLE_SIZE * 1.8;
      // avoid compound area
      if (Math.abs(tx - 80) < 25 && Math.abs(tz - 80) < 25) { continue; }
      var trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 5, 6);
      var trunkMat = new THREE.MeshLambertMaterial({ color: 0x3b2810 });
      var trunk    = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(tx, 2.5, tz);
      _scene.add(trunk);
      _sceneMeshes.push(trunk);

      var canopyGeo = new THREE.CylinderGeometry(0.1, 3.5, 6, 7);
      var canopyMat = new THREE.MeshLambertMaterial({ color: 0x224422 });
      var canopy    = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(tx, 7.5, tz);
      _scene.add(canopy);
      _sceneMeshes.push(canopy);
    }

    /* undergrowth */
    for (i = 0; i < UNDERGROWTH_COUNT; i++) {
      var ux = (Math.random() - 0.5) * JUNGLE_SIZE * 1.9;
      var uz = (Math.random() - 0.5) * JUNGLE_SIZE * 1.9;
      var uGeo = new THREE.BoxGeometry(1.5 + Math.random(), 0.8, 1.5 + Math.random());
      var uMat = new THREE.MeshLambertMaterial({ color: 0x336633 });
      var uMesh = new THREE.Mesh(uGeo, uMat);
      uMesh.position.set(ux, 0.4, uz);
      _scene.add(uMesh);
      _sceneMeshes.push(uMesh);
    }

    /* river crossing */
    var riverGeo = new THREE.BoxGeometry(80, 0.3, 12);
    var riverMat = new THREE.MeshLambertMaterial({ color: 0x226699, transparent: true, opacity: 0.7 });
    _riverMesh   = new THREE.Mesh(riverGeo, riverMat);
    _riverMesh.position.set(20, 0.15, 50);
    _scene.add(_riverMesh);
    _sceneMeshes.push(_riverMesh);

    /* village 1 — south-west */
    buildVillage(-40, -40, 1);

    /* village 2 — mid approach */
    buildVillage(10, 20, 2);

    /* compound */
    buildCompound();

    /* lighting */
    var ambient = new THREE.AmbientLight(0x334422, 0.6);
    _scene.add(ambient);
    _sceneMeshes.push(ambient);

    var sun = new THREE.DirectionalLight(0xffee88, 0.9);
    sun.position.set(50, 80, 30);
    _scene.add(sun);
    _sceneMeshes.push(sun);

    /* fog */
    _fogBackup = _scene.fog;
    _bgBackup  = _scene.background ? _scene.background.clone() : null;
    _scene.fog = new THREE.Fog(0x334422, 20, 120);
    if (_scene.background) { _scene.background.set(0x334422); }
  }

  function buildVillage(cx, cz, idx) {
    var hutMat  = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var pathMat = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
    var j;

    /* packed dirt path */
    var pathGeo  = new THREE.BoxGeometry(20, 0.1, 4);
    var pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.position.set(cx, 0.05, cz);
    _scene.add(pathMesh);
    _sceneMeshes.push(pathMesh);

    /* 4 huts per village */
    var hutPositions = [
      [cx - 7, cz - 6], [cx + 7, cz - 6],
      [cx - 7, cz + 6], [cx + 7, cz + 6]
    ];
    for (j = 0; j < hutPositions.length; j++) {
      var hx = hutPositions[j][0];
      var hz = hutPositions[j][1];
      var hutGeo  = new THREE.BoxGeometry(8, 3, 8);
      var hutMesh = new THREE.Mesh(hutGeo, hutMat);
      hutMesh.position.set(hx, 1.5, hz);
      _scene.add(hutMesh);
      _sceneMeshes.push(hutMesh);

      /* cone roof */
      var roofGeo  = new THREE.ConeGeometry(5.5, 2.5, 5);
      var roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.set(hx, 4.25, hz);
      _scene.add(roofMesh);
      _sceneMeshes.push(roofMesh);
    }

    /* government building in village 2 */
    if (idx === 2) {
      var govMat  = new THREE.MeshLambertMaterial({ color: 0x998877 });
      var govGeo  = new THREE.BoxGeometry(12, 5, 15);
      var govMesh = new THREE.Mesh(govGeo, govMat);
      govMesh.position.set(cx + 20, 2.5, cz);
      _scene.add(govMesh);
      _sceneMeshes.push(govMesh);
      _govBuildingPos = { x: cx + 20, y: 0, z: cz };

      /* documents inside (marker on ground in front) */
      var docGeo  = new THREE.BoxGeometry(0.6, 0.05, 0.8);
      var docMat  = new THREE.MeshLambertMaterial({ color: 0xeeeecc });
      _docsMesh   = new THREE.Mesh(docGeo, docMat);
      _docsMesh.position.set(cx + 20, 0.05, cz + 4);
      _scene.add(_docsMesh);
      _sceneMeshes.push(_docsMesh);
    }
  }

  function buildCompound() {
    var wallMat   = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var towerMat  = new THREE.MeshLambertMaterial({ color: 0x887744 });
    var barrMat   = new THREE.MeshLambertMaterial({ color: 0x665544 });
    var tentMat   = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var trapdMat  = new THREE.MeshLambertMaterial({ color: 0x332211 });

    var cx = COMPOUND_CENTER.x;
    var cz = COMPOUND_CENTER.z;

    /* four walls: north, south, east, west */
    /* north */
    var wn = new THREE.Mesh(new THREE.BoxGeometry(40, 6, 2), wallMat);
    wn.position.set(cx, 3, cz - 20);
    _scene.add(wn); _walls.push(wn); _sceneMeshes.push(wn);

    /* south */
    var ws = new THREE.Mesh(new THREE.BoxGeometry(40, 6, 2), wallMat);
    ws.position.set(cx, 3, cz + 20);
    _scene.add(ws); _walls.push(ws); _sceneMeshes.push(ws);

    /* east */
    var we = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 40), wallMat);
    we.position.set(cx + 20, 3, cz);
    _scene.add(we); _walls.push(we); _sceneMeshes.push(we);

    /* west (with gate gap) */
    var ww1 = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 16), wallMat);
    ww1.position.set(cx - 20, 3, cz - 12);
    _scene.add(ww1); _walls.push(ww1); _sceneMeshes.push(ww1);
    var ww2 = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 16), wallMat);
    ww2.position.set(cx - 20, 3, cz + 12);
    _scene.add(ww2); _walls.push(ww2); _sceneMeshes.push(ww2);

    /* watchtowers at corners */
    var corners = [
      [cx - 20, cz - 20], [cx + 20, cz - 20],
      [cx - 20, cz + 20], [cx + 20, cz + 20]
    ];
    var k;
    for (k = 0; k < corners.length; k++) {
      var tMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 4), towerMat);
      tMesh.position.set(corners[k][0], 4, corners[k][1]);
      _scene.add(tMesh); _sceneMeshes.push(tMesh);
    }

    /* barracks */
    var barr = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 16), barrMat);
    barr.position.set(cx + 10, 1.5, cz - 8);
    _scene.add(barr); _sceneMeshes.push(barr);

    /* armory */
    var armo = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 8), barrMat);
    armo.position.set(cx + 10, 1.5, cz + 8);
    _scene.add(armo); _sceneMeshes.push(armo);

    /* command tent */
    var tent = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 10), tentMat);
    tent.position.set(cx - 6, 1.5, cz);
    _scene.add(tent); _sceneMeshes.push(tent);

    /* radio on desk */
    var radioGeo = new THREE.BoxGeometry(0.5, 0.4, 0.3);
    var radioMat = new THREE.MeshLambertMaterial({ color: 0x223333 });
    _radioMesh   = new THREE.Mesh(radioGeo, radioMat);
    _radioMesh.position.set(cx - 6, 3.2, cz);
    _scene.add(_radioMesh); _sceneMeshes.push(_radioMesh);

    /* Kanu's underground bunker */
    _bunkerMesh = new THREE.Mesh(new THREE.BoxGeometry(15, 4, 12), bunkerMat);
    _bunkerMesh.position.set(BUNKER_POS.x, BUNKER_POS.y, BUNKER_POS.z);
    _scene.add(_bunkerMesh); _sceneMeshes.push(_bunkerMesh);

    /* trapdoor */
    _trapdoorMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 2), trapdMat);
    _trapdoorMesh.position.set(cx - 6, 0.075, cz + 4);
    _scene.add(_trapdoorMesh); _sceneMeshes.push(_trapdoorMesh);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PLAYER / CAMERA
  ═══════════════════════════════════════════════════════════════════════════ */

  function buildPlayer() {
    var bodyGeo = new THREE.BoxGeometry(0.7, 1.8, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x334422 });
    _player     = new THREE.Mesh(bodyGeo, bodyMat);
    _player.position.set(-60, 0.9, -60);
    _scene.add(_player);
    _sceneMeshes.push(_player);

    _camera.position.set(-60, 2.5, -60);
    _camera.rotation.set(0, 0, 0);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     TEAMMATES
  ═══════════════════════════════════════════════════════════════════════════ */

  function buildTeammates() {
    var colors  = [0x445533, 0x335544];
    var offsets = [{ x: 1.5, z: 0 }, { x: -1.5, z: 0 }];
    var i;
    for (i = 0; i < 2; i++) {
      var geo  = new THREE.BoxGeometry(0.7, 1.8, 0.5);
      var mat  = new THREE.MeshLambertMaterial({ color: colors[i] });
      var mesh = new THREE.Mesh(geo, mat);
      var startX = -60 + offsets[i].x;
      var startZ = -60 + offsets[i].z;
      mesh.position.set(startX, 0.9, startZ);
      _scene.add(mesh);
      _sceneMeshes.push(mesh);
      _teammates.push({
        mesh: mesh,
        hp: TEAMMATE_HP,
        alive: true,
        downed: false,
        reviveTimer: 0,
        pos: { x: startX, y: 0.9, z: startZ },
        holdPos: { x: startX, y: 0.9, z: startZ },
        suppressTarget: null,
        fireTimer: 0,
        offset: offsets[i]
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ENEMIES
  ═══════════════════════════════════════════════════════════════════════════ */

  function buildEnemies() {
    var i;

    /* checkpoint patrols — 4 groups of 3 along approach path */
    var checkpointPositions = [
      { x: -45, z: -20 }, { x: -20, z: 10 },
      { x: 20,  z: 40  }, { x: 55,  z: 65  }
    ];
    for (i = 0; i < CHECKPOINT_GROUPS; i++) {
      spawnEnemyGroup(checkpointPositions[i].x, checkpointPositions[i].z, 3, 'checkpoint');
    }

    /* scattered jungle fighters — 28 total (40 - 12 checkpoint) */
    for (i = 0; i < 28; i++) {
      var ex = (Math.random() - 0.5) * 140 - 10;
      var ez = (Math.random() - 0.5) * 140 - 10;
      if (Math.abs(ex - 80) < 22 && Math.abs(ez - 80) < 22) {
        ex -= 40; ez -= 40;
      }
      spawnEnemy(ex, ez, 'jungle');
    }

    /* 15 compound guards — spawned inside compound */
    for (i = 0; i < COMPOUND_GUARDS; i++) {
      var cgx = COMPOUND_CENTER.x + (Math.random() - 0.5) * 36;
      var cgz = COMPOUND_CENTER.z + (Math.random() - 0.5) * 36;
      spawnEnemy(cgx, cgz, 'compound');
    }
  }

  function spawnEnemyGroup(cx, cz, count, group) {
    var j;
    for (j = 0; j < count; j++) {
      spawnEnemy(cx + (j - 1) * 3, cz, group);
    }
  }

  function spawnEnemy(ex, ez, group) {
    var geo  = new THREE.BoxGeometry(0.7, 1.8, 0.5);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x665533 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ex, 0.9, ez);
    _scene.add(mesh);
    _sceneMeshes.push(mesh);
    _enemies.push({
      mesh: mesh,
      hp: ENEMY_HP,
      alive: true,
      alert: false,
      pos: { x: ex, y: 0.9, z: ez },
      patrolAngle: Math.random() * Math.PI * 2,
      group: group,
      fireTimer: Math.random() * ENEMY_FIRE_RATE,
      radioOp: false
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     GENERAL KANU
  ═══════════════════════════════════════════════════════════════════════════ */

  function buildKanu() {
    /* body */
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.9, 0.6);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    _kanuMesh   = new THREE.Mesh(bodyGeo, bodyMat);
    _kanuMesh.position.set(BUNKER_POS.x, BUNKER_POS.y + 0.95, BUNKER_POS.z);
    _scene.add(_kanuMesh);
    _sceneMeshes.push(_kanuMesh);

    /* military cap */
    var capGeo  = new THREE.CylinderGeometry(0.42, 0.42, 0.22, 8);
    var capMat  = new THREE.MeshLambertMaterial({ color: 0x334422 });
    var cap     = new THREE.Mesh(capGeo, capMat);
    cap.position.set(BUNKER_POS.x, BUNKER_POS.y + 1.95 + 0.11, BUNKER_POS.z);
    _scene.add(cap);
    _sceneMeshes.push(cap);

    /* HMG barrel — LineSegments */
    var barrelPoints = [];
    barrelPoints.push(new THREE.Vector3(0, 0, 0));
    barrelPoints.push(new THREE.Vector3(0, 0, -1.4));
    var barrelGeo = new THREE.BufferGeometry().setFromPoints(barrelPoints);
    var barrelMat = new THREE.LineBasicMaterial({ color: 0x111111 });
    var barrel    = new THREE.LineSegments(barrelGeo, barrelMat);
    barrel.position.set(BUNKER_POS.x + 0.4, BUNKER_POS.y + 1.2, BUNKER_POS.z);
    _scene.add(barrel);
    _sceneMeshes.push(barrel);

    _kanu = {
      mesh: _kanuMesh,
      cap:  cap,
      barrel: barrel,
      hp: _kanuHP,
      alive: true,
      fireTimer: 0
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     INTELLIGENCE NPCs
  ═══════════════════════════════════════════════════════════════════════════ */

  function buildIntelNPCs() {
    /* village elder in village 1 */
    var elderGeo = new THREE.BoxGeometry(0.6, 1.6, 0.5);
    var elderMat = new THREE.MeshLambertMaterial({ color: 0xbbaa88 });
    _elderMesh   = new THREE.Mesh(elderGeo, elderMat);
    _elderMesh.position.set(-40, 0.8, -40);
    _scene.add(_elderMesh);
    _sceneMeshes.push(_elderMesh);

    /* radio operator — enemy that can be downed non-lethally */
    var roGeo   = new THREE.BoxGeometry(0.7, 1.8, 0.5);
    var roMat   = new THREE.MeshLambertMaterial({ color: 0x886655 });
    _radioOpMesh = new THREE.Mesh(roGeo, roMat);
    _radioOpMesh.position.set(-5, 0.9, 30);
    _scene.add(_radioOpMesh);
    _sceneMeshes.push(_radioOpMesh);

    /* add radio operator as a special enemy */
    _enemies.push({
      mesh: _radioOpMesh,
      hp: ENEMY_HP,
      alive: true,
      alert: false,
      pos: { x: -5, y: 0.9, z: 30 },
      patrolAngle: 0,
      group: 'radioOp',
      fireTimer: 1.0,
      radioOp: true
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     REINFORCEMENT VEHICLES
  ═══════════════════════════════════════════════════════════════════════════ */

  function spawnReinforcement(waveNum) {
    var spawnX = -90;
    var spawnZ = -70 + waveNum * 10;
    var troopCount = 4 + waveNum * 2;
    var i;

    /* technical truck */
    var truckGeo = new THREE.BoxGeometry(3, 1.8, 6);
    var truckMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    var truck    = new THREE.Mesh(truckGeo, truckMat);
    truck.position.set(spawnX, 0.9, spawnZ);
    _scene.add(truck);
    _sceneMeshes.push(truck);

    /* gun mount on truck */
    var mountGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 6);
    var mountMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var mount    = new THREE.Mesh(mountGeo, mountMat);
    mount.position.set(spawnX, 2.1, spawnZ);
    _scene.add(mount);
    _sceneMeshes.push(mount);

    /* spawn troops from technical */
    for (i = 0; i < troopCount; i++) {
      spawnEnemy(spawnX + (Math.random() - 0.5) * 8, spawnZ + (Math.random() - 0.5) * 8, 'reinforcement');
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'warlord-hunt-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#eecc88',
      'font-family:monospace',
      'font-size:13px',
      'padding:7px 16px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'letter-spacing:0.04em',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
    updateHUD();
  }

  function updateHUD() {
    if (!_hudEl) { return; }
    var alive = countAliveEnemies();
    var tmAlive = countAliveTeammates();
    var nextReinforce = Math.max(0, Math.ceil(_nextReinfTimer - (_missionTime % 300)));
    _hudEl.textContent = [
      'WARLORD HUNT',
      '[INTEL: ' + _intelCount + '/3]',
      '[MILITIA: ' + alive + ']',
      '[KANU: ' + _kanuStatus + ']',
      '[TEAMMATES: ' + tmAlive + '/2]',
      '[REINFORCEMENTS: ' + nextReinforce + 's]'
    ].join('  ');
  }

  function showMessage(msg, duration) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#ffee88',
      'font-family:monospace',
      'font-size:15px',
      'padding:8px 20px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:10000'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, (duration || 2500));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════════════════ */

  function dist3(a, b) {
    var dx = a.x - b.x;
    var dy = (a.y || 0) - (b.y || 0);
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function countAliveEnemies() {
    var c = 0;
    var i;
    for (i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) { c++; }
    }
    return c;
  }

  function countAliveTeammates() {
    var c = 0;
    var i;
    for (i = 0; i < _teammates.length; i++) {
      if (_teammates[i].alive && !_teammates[i].downed) { c++; }
    }
    return c;
  }

  function playerPos() {
    return _player ? { x: _player.position.x, y: _player.position.y, z: _player.position.z } : { x: 0, y: 0, z: 0 };
  }

  function killEnemy(enemy) {
    if (!enemy.alive) { return; }
    enemy.alive = false;
    enemy.mesh.visible = false;
    /* alert nearby enemies */
    triggerAlert(enemy.pos, 20);
  }

  function damageEnemy(enemy, dmg) {
    if (!enemy.alive) { return; }
    enemy.hp -= dmg;
    enemy.alert = true;
    if (enemy.hp <= 0) {
      if (enemy.radioOp && _pistolMode && !_radioOpDowned) {
        /* non-lethal takedown of radio operator */
        _radioOpDowned = true;
        enemy.alive = true;
        enemy.hp    = 1;
        enemy.mesh.position.y = 0.25;
        enemy.pos.y = 0.25;
        showMessage('[!] Radio operator downed. Approach + E to interrogate.', 3000);
      } else {
        killEnemy(enemy);
      }
    }
  }

  function triggerAlert(pos, radius) {
    var i;
    for (i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive && dist2(_enemies[i].pos, pos) < radius) {
        _enemies[i].alert = true;
      }
    }
    if (_alertLevel < 1) {
      _alertLevel = 1;
      _alertTimer = ALERT_RESPONSE_TIME;
    }
    if (_compoundBreached && _alertLevel < 2) {
      _alertLevel = 2;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     MOUSE LOOK
  ═══════════════════════════════════════════════════════════════════════════ */

  function onMouseMove(e) {
    if (!_active) { return; }
    var sens = 0.002;
    _yaw   -= e.movementX * sens;
    _pitch -= e.movementY * sens;
    _pitch  = Math.max(-1.1, Math.min(1.1, _pitch));
    if (_camera) {
      _camera.rotation.order = 'YXZ';
      _camera.rotation.y = _yaw;
      _camera.rotation.x = _pitch;
    }
  }

  function onMouseDown(e) {
    if (!_active) { return; }
    if (e.button === 0) { shoot(); }
    if (e.button === 2) { _pistolMode = true; }
  }

  function onMouseUp(e) {
    if (e.button === 2) { _pistolMode = false; }
  }

  function shoot() {
    if (_fireTimer > 0) { return; }
    _fireTimer = PLAYER_FIRE_RATE;

    /* raycasting — find nearest enemy in camera forward direction */
    var dir  = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    var ray  = new THREE.Raycaster(_camera.position.clone(), dir, 0, 80);

    /* check enemies */
    var meshes = [];
    var idx;
    for (idx = 0; idx < _enemies.length; idx++) {
      if (_enemies[idx].alive) { meshes.push(_enemies[idx].mesh); }
    }
    /* check radio */
    if (_radioMesh && !_radioDestroyed) { meshes.push(_radioMesh); }
    /* check kanu */
    if (_kanu && _kanu.alive) { meshes.push(_kanu.mesh); }

    var hits = ray.intersectObjects(meshes, false);
    if (hits.length === 0) { return; }

    var hitObj = hits[0].object;

    /* radio? */
    if (!_radioDestroyed && hitObj === _radioMesh) {
      _radioDestroyed = true;
      _radioMesh.material.color.setHex(0x332200);
      showMessage('[!] Radio destroyed — evacuation helicopter blocked!', 3000);
      return;
    }

    /* kanu? */
    if (_kanu && _kanu.alive && hitObj === _kanu.mesh) {
      _kanu.hp -= 40;
      if (_kanu.hp <= 0) {
        killKanu();
      } else if (_kanu.hp < 300 && _kanuState === 'bunker' && !_radioDestroyed) {
        startKanuEscape();
      }
      return;
    }

    /* enemy */
    for (idx = 0; idx < _enemies.length; idx++) {
      if (_enemies[idx].alive && _enemies[idx].mesh === hitObj) {
        var dmg = _pistolMode ? 20 : 35;
        damageEnemy(_enemies[idx], dmg);
        break;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ═══════════════════════════════════════════════════════════════════════════ */

  function movePlayer(dt) {
    var speed = _speed * dt;
    var inRiver = false;

    /* check river slowdown */
    if (_riverMesh) {
      var rp = _riverMesh.position;
      var rx = rp.x; var rz = rp.z;
      var pp = playerPos();
      if (Math.abs(pp.x - rx) < 40 && Math.abs(pp.z - rz) < 6) {
        inRiver = true;
      }
    }
    _inRiver = inRiver;
    if (inRiver) { speed *= RIVER_SLOW_FACTOR; }

    var forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(new THREE.Euler(0, _yaw, 0));
    var right = new THREE.Vector3(1, 0, 0);
    right.applyEuler(new THREE.Euler(0, _yaw, 0));

    var moved = false;
    if (_keys['w']) { _player.position.addScaledVector(forward, speed); moved = true; }
    if (_keys['s']) { _player.position.addScaledVector(forward, -speed); moved = true; }
    if (_keys['a']) { _player.position.addScaledVector(right, -speed); moved = true; }
    if (_keys['d']) { _player.position.addScaledVector(right, speed); moved = true; }

    /* keep player on ground */
    _player.position.y = 0.9;

    /* camera follows player */
    _camera.position.set(
      _player.position.x,
      _player.position.y + 0.8,
      _player.position.z
    );

    /* check if player entered compound zone */
    var pdx = Math.abs(_player.position.x - COMPOUND_CENTER.x);
    var pdz = Math.abs(_player.position.z - COMPOUND_CENTER.z);
    if (!_compoundBreached && pdx < 25 && pdz < 25) {
      _compoundBreached = true;
      _alertLevel = 2;
      showMessage('[!] Compound breached — all guards responding!', 3000);
      if (_kanuState === 'bunker' && !_radioDestroyed) {
        startKanuEscape();
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     E KEY INTERACTIONS
  ═══════════════════════════════════════════════════════════════════════════ */

  function handleInteractions(dt) {
    var pp = playerPos();

    /* elder */
    if (!_elderIntelDone && _elderMesh) {
      if (dist2(pp, _elderMesh.position) < INTERACT_RANGE) {
        if (_keys['e']) {
          _elderInteractTimer += dt;
          if (_elderInteractTimer >= ELDER_INTERACT_TIME) {
            _elderIntelDone = true;
            _elderInteractTimer = 0;
            grantIntel('elder');
          }
        } else {
          _elderInteractTimer = 0;
        }
      }
    }

    /* radio operator — downed */
    if (!_radioOpIntelDone && _radioOpDowned && _radioOpMesh) {
      if (dist2(pp, _radioOpMesh.position) < INTERACT_RANGE) {
        if (_keys['e']) {
          _radioOpInteractTimer += dt;
          if (_radioOpInteractTimer >= 1.5) {
            _radioOpIntelDone = true;
            _radioOpInteractTimer = 0;
            grantIntel('radioOp');
          }
        } else {
          _radioOpInteractTimer = 0;
        }
      }
    }

    /* documents */
    if (!_docsIntelDone && _docsMesh) {
      if (dist2(pp, _docsMesh.position) < INTERACT_RANGE) {
        if (_keys['e']) {
          _docsInteractTimer += dt;
          if (_docsInteractTimer >= 0.8) {
            _docsIntelDone = true;
            _docsInteractTimer = 0;
            _docsMesh.visible = false;
            grantIntel('docs');
          }
        } else {
          _docsInteractTimer = 0;
        }
      }
    }

    /* teammate revive */
    if (_keys['e']) {
      var i;
      for (i = 0; i < _teammates.length; i++) {
        var tm = _teammates[i];
        if (tm.downed && !tm.alive === false) {
          if (dist2(pp, tm.pos) < INTERACT_RANGE) {
            tm.reviveTimer += dt;
            if (tm.reviveTimer >= REVIVE_TIME) {
              tm.downed = false;
              tm.hp = Math.floor(TEAMMATE_HP * 0.5);
              tm.reviveTimer = 0;
              tm.mesh.position.y = 0.9;
              tm.pos.y = 0.9;
              showMessage('[+] Teammate revived!', 2000);
            }
            break;
          }
        }
      }
    }
  }

  function grantIntel(source) {
    _intelCount++;
    if (source === 'elder') {
      showMessage('[INTEL 1/3] Village elder: "The compound — concrete walls, four towers."', 4000);
    } else if (source === 'radioOp') {
      showMessage('[INTEL 2/3] Radio operator reveals guard rotation schedule.', 4000);
    } else if (source === 'docs') {
      showMessage('[INTEL 3/3] Documents: Kanu is in the bunker — tunnel exits north-east.', 4000);
      _kanuStatus = 'LOCATED';
    }
    updateHUD();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     TEAMMATE AI
  ═══════════════════════════════════════════════════════════════════════════ */

  function updateTeammates(dt) {
    var i;
    var pp = playerPos();

    for (i = 0; i < _teammates.length; i++) {
      var tm = _teammates[i];
      if (!tm.alive) { continue; }

      if (tm.downed) {
        tm.mesh.position.y = 0.25;
        continue;
      }

      /* movement */
      if (_teammateCmd === 'follow') {
        var targetX = pp.x + tm.offset.x * 2;
        var targetZ = pp.z + tm.offset.z * 2;
        var dx = targetX - tm.pos.x;
        var dz = targetZ - tm.pos.z;
        var d  = Math.sqrt(dx * dx + dz * dz);
        if (d > 2.5) {
          var spd = 6 * dt;
          tm.pos.x += (dx / d) * spd;
          tm.pos.z += (dz / d) * spd;
          tm.mesh.position.set(tm.pos.x, 0.9, tm.pos.z);
        }
      }

      /* fire at nearest alert enemy */
      tm.fireTimer -= dt;
      if (tm.fireTimer <= 0) {
        var nearest = findNearestAlertEnemy(tm.pos, 30);
        if (nearest) {
          tm.fireTimer = 0.8 + Math.random() * 0.6;
          nearest.hp -= 25;
          if (nearest.hp <= 0) { killEnemy(nearest); }
        }
      }
    }
  }

  function findNearestAlertEnemy(pos, maxDist) {
    var best = null;
    var bestDist = maxDist;
    var i;
    for (i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) { continue; }
      var d = dist2(pos, e.pos);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ENEMY AI
  ═══════════════════════════════════════════════════════════════════════════ */

  function updateEnemies(dt) {
    var i;
    var pp = playerPos();

    for (i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) { continue; }

      /* patrol if not alert */
      if (!e.alert) {
        e.patrolAngle += 0.3 * dt;
        var pr = 5;
        /* compound guards patrol in smaller radius */
        if (e.group === 'compound') { pr = 8; }
        var baseX = e.pos.x;
        var baseZ = e.pos.z;
        var nx = baseX + Math.cos(e.patrolAngle) * 0.5 * dt;
        var nz = baseZ + Math.sin(e.patrolAngle) * 0.5 * dt;
        e.mesh.position.x = nx;
        e.mesh.position.z = nz;

        /* detect player */
        var dpx = dist2(pp, e.pos);
        if (dpx < ENEMY_AGGRO_RANGE) {
          e.alert = true;
          triggerAlert(e.pos, 15);
        }
      } else {
        /* chase and shoot */
        var edx = pp.x - e.pos.x;
        var edz = pp.z - e.pos.z;
        var ed  = Math.sqrt(edx * edx + edz * edz);
        if (ed > 5) {
          var espd = 3.5 * dt;
          e.pos.x += (edx / ed) * espd;
          e.pos.z += (edz / ed) * espd;
          e.mesh.position.set(e.pos.x, 0.9, e.pos.z);
        }

        /* shoot at player */
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && ed < 30) {
          e.fireTimer = ENEMY_FIRE_RATE + Math.random() * 0.5;
          _playerHP -= 8 + Math.floor(Math.random() * 7);
          if (_playerHP < 0) { _playerHP = 0; }
          updateHUD();
        }
        /* also shoot teammates */
        var j;
        for (j = 0; j < _teammates.length; j++) {
          var tm = _teammates[j];
          if (tm.alive && !tm.downed) {
            var td = dist2(e.pos, tm.pos);
            if (td < 25 && e.fireTimer <= 0) {
              tm.hp -= 5;
              if (tm.hp <= 0) {
                tm.downed = true;
                tm.mesh.position.y = 0.25;
                showMessage('[!] Teammate down! Revive with E.', 3000);
              }
            }
          }
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     KANU AI
  ═══════════════════════════════════════════════════════════════════════════ */

  function startKanuEscape() {
    if (_kanuState !== 'bunker') { return; }
    _kanuState = 'escaping';
    showMessage('[!!] General Kanu is attempting to escape via tunnel!', 4000);
  }

  function updateKanu(dt) {
    if (!_kanu || !_kanu.alive) { return; }

    if (_kanuState === 'escaping') {
      /* move kanu toward escape point */
      var ep = COMPOUND_ESCAPE_POS;
      var kp = _kanu.mesh.position;
      var dx = ep.x - kp.x;
      var dz = ep.z - kp.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d > 1) {
        var spd = 4 * dt;
        kp.x += (dx / d) * spd;
        kp.z += (dz / d) * spd;
        /* move cap too */
        _kanu.cap.position.x = kp.x;
        _kanu.cap.position.z = kp.z;
        _kanu.barrel.position.x = kp.x + 0.4;
        _kanu.barrel.position.z = kp.z;
      } else {
        /* reached escape exit */
        _kanuState = 'escaped';
        if (!_radioDestroyed) {
          _helicopterTimer = 60; /* 60 seconds until heli arrives */
          showMessage('[!!] Kanu reached escape tunnel exit! Helicopter in 60s!', 5000);
        } else {
          showMessage('[!] Kanu escaped tunnel but radio is destroyed — no helicopter!', 4000);
          /* kanu wanders — give player chance to chase */
        }
      }
    }

    if (_kanuState === 'escaped' && !_radioDestroyed) {
      _helicopterTimer -= dt;
      if (_helicopterTimer <= 0) {
        /* Kanu escapes by helicopter */
        triggerLoss('helicopter');
      }
    }

    /* kanu fires at player when compound breached */
    if (_compoundBreached && _kanuState === 'bunker') {
      var pp = playerPos();
      var kpos = _kanu.mesh.position;
      var dist = dist2(pp, { x: kpos.x, z: kpos.z });
      _kanu.fireTimer -= dt;
      if (_kanu.fireTimer <= 0 && dist < 35) {
        _kanu.fireTimer = 0.6;
        _playerHP -= 20;
        if (_playerHP < 0) { _playerHP = 0; }
      }
    }
  }

  function killKanu() {
    if (!_kanu || !_kanu.alive) { return; }
    _kanu.alive = false;
    _kanuAlive  = false;
    _kanuState  = 'dead';
    _kanuStatus = 'ELIMINATED';
    _kanu.mesh.material.color.setHex(0x222222);
    _kanu.mesh.position.y = 0.25;
    updateHUD();
    showMessage('[MISSION SUCCESS] General Kanu eliminated.', 6000);
    setTimeout(function () { triggerWin(); }, 4000);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     REINFORCEMENTS
  ═══════════════════════════════════════════════════════════════════════════ */

  function updateReinforcements(dt) {
    _missionTime += dt;
    _nextReinfTimer -= dt;

    if (_nextReinfTimer <= 0) {
      _reinforceWave++;
      spawnReinforcement(_reinforceWave);
      _nextReinfTimer = 300; /* reset to 5 minutes */
      showMessage('[!] Reinforcement wave ' + _reinforceWave + ' incoming!', 3500);
    }

    updateHUD();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ═══════════════════════════════════════════════════════════════════════════ */

  function triggerWin() {
    showMessage('MISSION COMPLETE — General Kanu is down. Extract now.', 6000);
  }

  function triggerLoss(reason) {
    if (reason === 'helicopter') {
      showMessage('MISSION FAILED — Kanu evacuated by helicopter.', 6000);
    } else if (reason === 'team_wipe') {
      showMessage('MISSION FAILED — All operatives eliminated.', 6000);
    }
    _active = false;
  }

  function checkLoseConditions() {
    /* both teammates dead + player killed */
    var tmAlive = countAliveTeammates();
    if (tmAlive === 0 && _playerHP <= 0) {
      triggerLoss('team_wipe');
      return;
    }
    if (_playerHP <= 0) {
      /* player only — if both teammates dead too */
      if (countAliveTeammates() === 0) {
        triggerLoss('team_wipe');
      } else {
        /* player downed — mission continues as teammates fight */
        _playerHP = 0;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     KEY HANDLERS
  ═══════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var k = e.key ? e.key.toLowerCase() : '';
    _keys[k] = true;

    /* activation: W + L within 400ms */
    if (k === 'w') { _wPressTime = Date.now(); }
    if (k === 'l') { _lPressTime = Date.now(); }
    if (k === 'w' && _lPressTime && (Date.now() - _lPressTime) < ACTIVATION_WINDOW) {
      toggleModule();
    }
    if (k === 'l' && _wPressTime && (Date.now() - _wPressTime) < ACTIVATION_WINDOW) {
      toggleModule();
    }

    if (!_active) { return; }

    /* teammate commands */
    if (k === 'q') {
      _teammateCmd = 'hold';
      showMessage('[SQUAD] Hold position.', 1500);
    }
    if (k === 'r') {
      _teammateCmd = 'suppress';
      showMessage('[SQUAD] Suppress target.', 1500);
    }
    /* e for follow re-issue */
    if (k === 'e' && _teammateCmd === 'hold') {
      _teammateCmd = 'follow';
      showMessage('[SQUAD] Follow me.', 1500);
    }
  }

  function onKeyUp(e) {
    var k = e.key ? e.key.toLowerCase() : '';
    _keys[k] = false;
    if (k === 'w') { _wPressTime = 0; }
    if (k === 'l') { _lPressTime = 0; }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ACTIVATE / DEACTIVATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function toggleModule() {
    if (_active) {
      deactivate();
    } else {
      activate();
    }
  }

  function activate() {
    if (_active) { return; }

    /* find scene & camera from global game state */
    if (window.GameState) {
      _scene  = window.GameState.scene  || _scene;
      _camera = window.GameState.camera || _camera;
      _canvas = window.GameState.canvas || _canvas;
    }
    if (!_scene && window.scene)  { _scene  = window.scene; }
    if (!_camera && window.camera) { _camera = window.camera; }

    if (!_scene || !_camera) {
      console.warn('WarlordHunt: No scene/camera found. Cannot activate.');
      return;
    }

    _active = true;
    _playerHP = 100;
    _intelCount = 0;
    _kanuStatus = 'UNKNOWN';
    _missionTime = 0;
    _nextReinfTimer = 300;
    _reinforceWave = 0;
    _compoundBreached = false;
    _radioDestroyed = false;
    _alertLevel = 0;
    _teammates = [];
    _enemies   = [];
    _wave1Spawned = false;
    _wave2Spawned = false;
    _wave3Spawned = false;
    _kanuHP = 600;
    _kanuAlive = true;
    _kanuState = 'bunker';
    _elderIntelDone = false;
    _radioOpIntelDone = false;
    _docsIntelDone = false;
    _radioOpDowned = false;
    _radioOpAlive = true;
    _teammateCmd = 'follow';

    buildScene();
    buildPlayer();
    buildTeammates();
    buildEnemies();
    buildIntelNPCs();
    buildKanu();
    buildHUD();

    /* pointer lock */
    if (_canvas) {
      _canvas.requestPointerLock = _canvas.requestPointerLock ||
        _canvas.mozRequestPointerLock ||
        _canvas.webkitRequestPointerLock;
      if (_canvas.requestPointerLock) { _canvas.requestPointerLock(); }
    }

    showMessage('[WARLORD HUNT] Activated — Find General Kanu. Gather 3 intel sources first.', 5000);
  }

  function deactivate() {
    _active = false;

    /* remove scene objects */
    var i;
    for (i = 0; i < _sceneMeshes.length; i++) {
      if (_scene && _sceneMeshes[i]) {
        _scene.remove(_sceneMeshes[i]);
        if (_sceneMeshes[i].geometry) { _sceneMeshes[i].geometry.dispose(); }
        if (_sceneMeshes[i].material) { _sceneMeshes[i].material.dispose(); }
      }
    }
    _sceneMeshes = [];
    _walls = [];
    _enemies = [];
    _teammates = [];

    /* restore fog */
    if (_scene) {
      _scene.fog = _fogBackup;
      if (_bgBackup && _scene.background) { _scene.background.copy(_bgBackup); }
    }

    /* remove HUD */
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
      _hudEl = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene  || _scene;
    _camera = camera || _camera;
    _canvas = canvas || _canvas;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup',   onMouseUp);
  }

  function update(dt) {
    if (!_active) { return; }

    /* clamp dt */
    if (dt > 0.1) { dt = 0.1; }

    /* fire timer */
    if (_fireTimer > 0) { _fireTimer -= dt; }

    movePlayer(dt);
    handleInteractions(dt);
    updateTeammates(dt);
    updateEnemies(dt);
    updateKanu(dt);
    updateReinforcements(dt);
    checkLoseConditions();
    updateHUD();
  }

  function reset() {
    if (_active) { deactivate(); }
    _wPressTime = 0;
    _lPressTime = 0;
    _keys       = {};
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
