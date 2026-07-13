/* ───────────────────────────────────────────────────────────────────────────
   jungle-ambush.js — Jungle Ambush FPS Module
   API: window.JungleAmbush = { init, update, reset }
   Controls:
     J + A (simultaneously, within 400ms) → activate mission
     WASD                                  → move player
     Mouse                                 → look around
     E (near trap marker)                  → plant trap (Phase 1)
     E (near fallen squadmate)             → revive squadmate
     B                                     → binoculars / convoy intel
     G                                     → smoke grenade (marks LZ)
     Mouse-click / Space                   → fire weapon
   ─────────────────────────────────────────────────────────────────────────── */
window.JungleAmbush = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _active        = false;
  var _missionDone   = false;
  var _missionFailed = false;

  /* ── Phase tracking ────────────────────────────────────────────────────── */
  var PHASE_SETUP   = 1;
  var PHASE_WAIT    = 2;
  var PHASE_ENGAGE  = 3;
  var _phase        = PHASE_SETUP;
  var _phaseTimer   = 0;   // phase 1 countdown (120s), phase 3 escape timer (240s)

  /* ── J+A simultaneous launch tracking ─────────────────────────────────── */
  var _jPressTime = 0;
  var _aPressTime = 0;
  var JA_WINDOW   = 0.4;

  /* ── Player state ──────────────────────────────────────────────────────── */
  var _player              = null;
  var _playerHP            = 100;
  var _playerPos           = null;
  var _playerYaw           = 0;
  var _playerPitch         = 0;
  var _mouseDX             = 0;
  var _mouseDY             = 0;
  var _mousePointerLocked  = false;
  var _inRiver             = false;  // slows player 50%
  var _reviving            = false;
  var _reviveTimer         = 0;
  var _reviveTarget        = null;
  var REVIVE_TIME          = 10;

  /* ── Keys ──────────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── Binoculars ────────────────────────────────────────────────────────── */
  var _binocularsActive    = false;
  var _binoFOVBackup       = 75;
  var _binoCrosshair       = null;

  /* ── Smoke / LZ ────────────────────────────────────────────────────────── */
  var _smokeMesh           = null;
  var _lzMarked            = false;
  var _lzMesh              = null;
  var _extractionTimer     = 0;
  var _extractionStarted   = false;
  var EXTRACTION_WAIT      = 30;

  /* ── Terrain / World ───────────────────────────────────────────────────── */
  var _ground              = null;
  var _road                = null;
  var _river               = null;
  var _fogBackup           = null;
  var _bgColorBackup       = null;
  var _trees               = [];
  var _ownMeshes           = [];   // all meshes we add, for cleanup

  /* ── Trap markers (Phase 1 targets) ───────────────────────────────────── */
  var TRAP_POSITIONS = [
    { x: -6,  y: 0, z: -15 },
    { x:  6,  y: 0, z: -5  },
    { x: -4,  y: 0, z:  5  },
    { x:  8,  y: 0, z:  15 },
    { x: -8,  y: 0, z:  22 }
  ];
  var _trapMarkers  = [];   // { mesh, pos, planted, type, triggerMesh }
  var _trapsSet     = 0;
  var TRAP_PLANT_RANGE = 3;

  /* ── Convoy ────────────────────────────────────────────────────────────── */
  var CONVOY_SPEED    = 5;
  var CONVOY_START_Z  = -60;
  var CONVOY_EXIT_Z   =  60;
  var _convoySpawned  = false;
  var _convoyAlerted  = false;
  var _convoyLeadZ    = CONVOY_START_Z;
  var _convoyMoving   = true;
  var _trucks         = [];   // { mesh, hp, alive, z }
  var _soldiers       = [];   // { mesh, hp, alive, pos, vel, alerted, alertTimer }
  var _commander      = null; // { mesh, hp, alive, pos, motoMesh, callTimer }
  var _commanderCalled = false;

  /* ── Helicopter reinforcement ──────────────────────────────────────────── */
  var _heliMesh       = null;
  var _heliActive     = false;
  var _heliTimer      = 0;    // counts up to 240s (phase 3 timer)
  var _heliArrived    = false;
  var _heliSweepTimer = 0;
  var _heliPos        = null;

  /* ── Squad ─────────────────────────────────────────────────────────────── */
  var _squad        = [];  // { mesh, hp, alive, fallen, pos, reviveTimer }
  var SQUAD_FOLLOW_DIST = 4;

  /* ── Radio intercept ───────────────────────────────────────────────────── */
  var _radioTimer     = 0;
  var RADIO_INTERVAL  = 45;
  var _radioMessages  = [
    'RADIO: Enemy convoy ETA 2 minutes - stay frosty',
    'RADIO: Command reports 3 trucks, 8 infantry, 1 commander',
    'RADIO: Reinforcement helo on standby - do not alert',
    'RADIO: Commander orders hold position until convoy clears',
    'RADIO: Fuel depot 2km north - extraction confirmed'
  ];
  var _radioMsgIndex  = 0;
  var _radioFlashText = '';
  var _radioFlashTimer = 0;

  /* ── Shooting ──────────────────────────────────────────────────────────── */
  var _shootCooldown  = 0;
  var SHOOT_INTERVAL  = 0.4;
  var SHOOT_RANGE     = 40;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud            = null;
  var _phaseTimer120  = 120;  // setup phase countdown
  var _escapeTimer    = 240;  // phase 3 escape countdown

  /* ── Internal helpers ──────────────────────────────────────────────────── */
  var _tmpVec = null;

  /* ═══════════════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════════════ */

  function _addMesh(mesh) {
    _scene.add(mesh);
    _ownMeshes.push(mesh);
    return mesh;
  }

  function _makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.transparent !== undefined) params.transparent = opts.transparent;
      if (opts.opacity    !== undefined) params.opacity    = opts.opacity;
      if (opts.wireframe  !== undefined) params.wireframe  = opts.wireframe;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function _dist2(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z !== undefined ? a.z : 0) - (b.z !== undefined ? b.z : 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     WORLD BUILDING
  ═══════════════════════════════════════════════════════════════════════ */

  function _buildWorld() {
    /* fog */
    _fogBackup        = _scene.fog;
    _bgColorBackup    = _scene.background ? _scene.background.getHex() : null;
    _scene.fog        = new THREE.FogExp2(0x1A3311, 0.03);
    _scene.background = new THREE.Color(0x1A3311);

    /* ambient light */
    var amb = new THREE.AmbientLight(0x445533, 0.8);
    _addMesh(amb);
    var dir = new THREE.DirectionalLight(0x88AA66, 0.6);
    dir.position.set(10, 20, 10);
    _addMesh(dir);

    /* ground */
    var gGeo  = new THREE.BoxGeometry(120, 0.2, 160);
    var gMat  = _makeMat(0x2B4A1A);
    _ground   = new THREE.Mesh(gGeo, gMat);
    _ground.position.set(0, -0.1, 0);
    _addMesh(_ground);

    /* jungle road - runs along Z axis */
    var rGeo  = new THREE.BoxGeometry(4, 0.22, 160);
    var rMat  = _makeMat(0x554433);
    _road     = new THREE.Mesh(rGeo, rMat);
    _road.position.set(0, 0, 0);
    _addMesh(_road);

    /* river crossing (slows player 50%) */
    var rivGeo = new THREE.BoxGeometry(20, 0.3, 6);
    var rivMat = _makeMat(0x224466);
    _river     = new THREE.Mesh(rivGeo, rivMat);
    _river.position.set(0, 0.05, 10);
    _addMesh(_river);

    /* LZ landing zone — north of scene */
    var lzGeo = new THREE.CylinderGeometry(5, 5, 0.3, 12);
    var lzMat = _makeMat(0x335533);
    _lzMesh   = new THREE.Mesh(lzGeo, lzMat);
    _lzMesh.position.set(0, 0.05, -55);
    _addMesh(_lzMesh);

    /* 40 trees */
    _spawnTrees();
  }

  function _spawnTrees() {
    var i, tx, tz, trunkH, trunk, canopy, canopyGeo, trunkGeo, trunkMat, canopyMat;
    for (i = 0; i < 40; i++) {
      /* avoid road corridor (|x| < 4) */
      tx = (Math.random() - 0.5) * 100;
      if (tx > -5 && tx < 5) { tx = tx > 0 ? tx + 5 : tx - 5; }
      tz = (Math.random() - 0.5) * 140;
      trunkH = 6 + Math.random() * 4;

      trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, trunkH, 6);
      trunkMat = _makeMat(0x3D2A10);
      trunk    = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(tx, trunkH / 2, tz);
      _addMesh(trunk);

      canopyGeo = new THREE.SphereGeometry(2.5 + Math.random() * 1.5, 7, 6);
      canopyMat = _makeMat(0x1A5C1A);
      canopy    = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(tx, trunkH + 1.5, tz);
      _addMesh(canopy);

      _trees.push({ trunk: trunk, canopy: canopy });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     TRAP MARKERS
  ═══════════════════════════════════════════════════════════════════════ */

  function _buildTrapMarkers() {
    var i, pos, markerGeo, markerMat, markerMesh, trapType;
    var types = ['tripwire', 'punji', 'grenade', 'tripwire', 'punji'];
    for (i = 0; i < TRAP_POSITIONS.length; i++) {
      pos      = TRAP_POSITIONS[i];
      trapType = types[i];

      /* glowing marker box */
      markerGeo  = new THREE.BoxGeometry(1, 0.1, 1);
      markerMat  = _makeMat(0xFFFF00, { transparent: true, opacity: 0.6 });
      markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.set(pos.x, 0.15, pos.z);
      _addMesh(markerMesh);

      _trapMarkers.push({
        mesh:        markerMesh,
        pos:         { x: pos.x, y: 0, z: pos.z },
        planted:     false,
        type:        trapType,
        triggerMesh: null
      });
    }
  }

  function _plantTrap(trapIdx) {
    var trap = _trapMarkers[trapIdx];
    if (trap.planted) return;

    trap.planted = true;
    trap.mesh.material.color.setHex(0x00FF44);
    trap.mesh.material.opacity = 0.8;
    _trapsSet++;

    /* build visual for each trap type */
    if (trap.type === 'tripwire') {
      _buildTripwire(trap);
    } else if (trap.type === 'punji') {
      _buildPunjiPit(trap);
    } else if (trap.type === 'grenade') {
      _buildGrenadeStrand(trap);
    }
  }

  function _buildTripwire(trap) {
    var pos = trap.pos;
    /* wire: LineSegments across road */
    var wireGeo = new THREE.BufferGeometry();
    var wireVerts = new Float32Array([
      pos.x - 2, 0.3, pos.z,
      pos.x + 2, 0.3, pos.z
    ]);
    wireGeo.setAttribute('position', new THREE.BufferAttribute(wireVerts, 3));
    var wireMat  = new THREE.LineBasicMaterial({ color: 0xCCCC00 });
    var wire     = new THREE.LineSegments(wireGeo, wireMat);
    _addMesh(wire);

    /* mine box */
    var mineGeo = new THREE.BoxGeometry(0.4, 0.2, 0.4);
    var mineMat = _makeMat(0x333300);
    var mine    = new THREE.Mesh(mineGeo, mineMat);
    mine.position.set(pos.x, 0.1, pos.z);
    _addMesh(mine);

    trap.triggerMesh = mine;
    trap.wire        = wire;
    trap.damageRadius = 3;
    trap.damage       = 120;
  }

  function _buildPunjiPit(trap) {
    var pos = trap.pos;
    /* fake floor — will be revealed on trigger */
    var pitGeo = new THREE.BoxGeometry(2, 0.05, 2);
    var pitMat = _makeMat(0x3D2B1F);
    var pitMesh = new THREE.Mesh(pitGeo, pitMat);
    pitMesh.position.set(pos.x, 0.025, pos.z);
    _addMesh(pitMesh);

    trap.triggerMesh  = pitMesh;
    trap.damage        = 200;
    trap.slowDuration  = 5;
    trap.revealed      = false;
  }

  function _buildGrenadeStrand(trap) {
    var pos = trap.pos;
    var i, grGeo, grMat, gr;
    var grenades = [];
    for (i = 0; i < 3; i++) {
      grGeo = new THREE.SphereGeometry(0.15, 6, 5);
      grMat = _makeMat(0x444400);
      gr    = new THREE.Mesh(grGeo, grMat);
      gr.position.set(pos.x + (i - 1) * 0.6, 0.3, pos.z);
      _addMesh(gr);
      grenades.push(gr);
    }

    /* wire connecting grenades */
    var strandGeo = new THREE.BufferGeometry();
    var strandV   = new Float32Array([
      pos.x - 0.6, 0.3, pos.z,
      pos.x,       0.3, pos.z,
      pos.x,       0.3, pos.z,
      pos.x + 0.6, 0.3, pos.z
    ]);
    strandGeo.setAttribute('position', new THREE.BufferAttribute(strandV, 3));
    var strandMat = new THREE.LineBasicMaterial({ color: 0xCCCC00 });
    var strand    = new THREE.LineSegments(strandGeo, strandMat);
    _addMesh(strand);

    trap.grenades     = grenades;
    trap.triggerMesh  = grenades[0];
    trap.damage       = 60;   // per grenade
    trap.damageRadius = 2.5;
    trap.chainCount   = 3;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CONVOY
  ═══════════════════════════════════════════════════════════════════════ */

  function _spawnConvoy() {
    _convoySpawned = true;
    _convoyLeadZ   = CONVOY_START_Z;

    /* 3 trucks */
    var i, tGeo, tMat, tMesh;
    var truckOffsets = [0, 10, 20];
    for (i = 0; i < 3; i++) {
      tGeo  = new THREE.BoxGeometry(2.5, 1.5, 4.5);
      tMat  = _makeMat(0x4A6632);
      tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.set(0, 0.75, CONVOY_START_Z + truckOffsets[i]);
      _addMesh(tMesh);
      _trucks.push({
        mesh:  tMesh,
        hp:    100,
        alive: true,
        z:     CONVOY_START_Z + truckOffsets[i]
      });
    }

    /* 8 infantry — 2-3 per truck flanking */
    var solOffsets = [
      { tx: 0, tz: 0  }, { tx: 0, tz: 0  },
      { tx: 0, tz: 10 }, { tx: 0, tz: 10 },
      { tx: 0, tz: 10 }, { tx: 0, tz: 20 },
      { tx: 0, tz: 20 }, { tx: 0, tz: 20 }
    ];
    var sideSign = 1;
    for (i = 0; i < 8; i++) {
      sideSign  = (i % 2 === 0) ? -2.5 : 2.5;
      var sGeo  = new THREE.BoxGeometry(0.5, 1.7, 0.5);
      var sMat  = _makeMat(0x4A6632);
      var sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(sideSign, 0.85, CONVOY_START_Z + solOffsets[i].tz);
      _addMesh(sMesh);
      _soldiers.push({
        mesh:       sMesh,
        hp:         80,
        alive:      true,
        pos:        { x: sideSign, y: 0.85, z: CONVOY_START_Z + solOffsets[i].tz },
        vel:        { x: 0, z: 0 },
        alerted:    false,
        alertTimer: 0,
        truckIdx:   Math.floor(i / 3)
      });
    }

    /* convoy commander on motorcycle */
    var motoGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.7, 8);
    var motoMat = _makeMat(0x333333);
    var motoMesh = new THREE.Mesh(motoGeo, motoMat);
    motoMesh.position.set(-1, 0.35, CONVOY_START_Z - 8);
    _addMesh(motoMesh);

    var cmdGeo  = new THREE.BoxGeometry(0.5, 1.6, 0.5);
    var cmdMat  = _makeMat(0x556644);
    var cmdMesh = new THREE.Mesh(cmdGeo, cmdMat);
    cmdMesh.position.set(-1, 1.15, CONVOY_START_Z - 8);
    _addMesh(cmdMesh);

    _commander = {
      mesh:      cmdMesh,
      motoMesh:  motoMesh,
      hp:        120,
      alive:     true,
      pos:       { x: -1, y: 0, z: CONVOY_START_Z - 8 },
      callTimer: 0
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SQUAD
  ═══════════════════════════════════════════════════════════════════════ */

  function _spawnSquad() {
    var i, sGeo, sMat, sMesh;
    var offsets = [
      { x: -2, z: -3 },
      { x:  2, z: -3 },
      { x: -2, z: -6 }
    ];
    for (i = 0; i < 3; i++) {
      sGeo  = new THREE.BoxGeometry(0.5, 1.8, 0.5);
      sMat  = _makeMat(0x447744);
      sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(offsets[i].x, 0.9, offsets[i].z);
      _addMesh(sMesh);
      _squad.push({
        mesh:        sMesh,
        hp:          100,
        alive:       true,
        fallen:      false,
        pos:         { x: offsets[i].x, y: 0.9, z: offsets[i].z },
        reviveTimer: 0,
        shootTimer:  0
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HELICOPTER
  ═══════════════════════════════════════════════════════════════════════ */

  function _spawnHeli() {
    _heliActive = true;
    var hGeo    = new THREE.BoxGeometry(3, 1, 2);
    var hMat    = _makeMat(0x334422);
    _heliMesh   = new THREE.Mesh(hGeo, hMat);
    _heliMesh.position.set(20, 20, CONVOY_START_Z);
    _addMesh(_heliMesh);
    _heliPos = { x: 20, y: 20, z: CONVOY_START_Z };

    /* rotor: BoxGeometry bar */
    var rotGeo = new THREE.BoxGeometry(4, 0.1, 0.3);
    var rotMat = _makeMat(0x222222);
    var rotor  = new THREE.Mesh(rotGeo, rotMat);
    rotor.position.set(0, 0.6, 0);
    _heliMesh.add(rotor);
    _heliMesh._rotor = rotor;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     BINOCULARS
  ═══════════════════════════════════════════════════════════════════════ */

  function _buildBinoCrosshair() {
    /* LineSegments crosshair in front of camera */
    var pts = new Float32Array([
      -0.04, 0, -1,   0.04, 0, -1,
       0, -0.04, -1,  0, 0.04, -1
    ]);
    var geo  = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    var mat  = new THREE.LineBasicMaterial({ color: 0x00FF00 });
    _binoCrosshair = new THREE.LineSegments(geo, mat);
    _binoCrosshair.visible = false;
    _camera.add(_binoCrosshair);
  }

  function _toggleBinoculars() {
    _binocularsActive = !_binocularsActive;
    if (_binocularsActive) {
      _binoFOVBackup      = _camera.fov;
      _camera.fov         = 20;
      _camera.updateProjectionMatrix();
      _binoCrosshair.visible = true;
      _radioFlashText  = 'BINOCULARS: Convoy spotted — 3 trucks, 8 infantry, 1 commander motorcycle';
      _radioFlashTimer = 4;
    } else {
      _camera.fov         = _binoFOVBackup;
      _camera.updateProjectionMatrix();
      _binoCrosshair.visible = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════ */

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'jungle-ambush-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.75)',
      'color:#00FF66',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #00AA44',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function _updateHUD() {
    if (!_hud) return;

    var squadAlive    = 0;
    var i;
    for (i = 0; i < _squad.length; i++) {
      if (_squad[i].alive && !_squad[i].fallen) squadAlive++;
    }

    var trucksAlive   = 0;
    for (i = 0; i < _trucks.length; i++) {
      if (_trucks[i].alive) trucksAlive++;
    }

    var escapeStr  = '';
    var heliStr    = '';
    if (_phase === PHASE_ENGAGE) {
      escapeStr = ' [ESCAPE: ' + Math.ceil(_escapeTimer) + 's]';
      heliStr   = ' | HELI: ' + (_heliArrived ? 'ARRIVED!' : Math.ceil(Math.max(0, 240 - _heliTimer)) + 's');
    }

    var phaseLabel = _phase === PHASE_SETUP   ? 'SETUP'  :
                     _phase === PHASE_WAIT    ? 'WAIT'   : 'ENGAGE';
    var setupStr   = _phase === PHASE_SETUP ? ' [SETUP: ' + Math.ceil(_phaseTimer120) + 's]' : '';

    var radioLine  = _radioFlashTimer > 0 ? '<br><span style="color:#FFFF00">' + _radioFlashText + '</span>' : '';

    _hud.innerHTML = 'JUNGLE AMBUSH [PHASE: ' + phaseLabel + ']' + setupStr +
      ' [TRAPS: ' + _trapsSet + '/5 SET]' +
      ' [CONVOY TRUCKS: ' + trucksAlive + ']' +
      ' [SQUAD: ' + squadAlive + '/3]' +
      escapeStr + heliStr + radioLine;
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
    }
    _hud = null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     TRAP TRIGGER
  ═══════════════════════════════════════════════════════════════════════ */

  function _checkTrapTrigger(entityPos) {
    var i, trap, dist, dmg, j;
    for (i = 0; i < _trapMarkers.length; i++) {
      trap = _trapMarkers[i];
      if (!trap.planted) continue;
      if (trap.triggered) continue;

      dist = _dist2(entityPos, trap.pos);

      if (trap.type === 'tripwire' && dist < 1.5) {
        trap.triggered = true;
        _explodeArea(trap.pos, trap.damageRadius, trap.damage);
        if (trap.mesh) { trap.mesh.visible = false; }
        if (trap.wire) { trap.wire.visible = false; }

      } else if (trap.type === 'punji' && dist < 1.5) {
        trap.triggered = true;
        if (!trap.revealed) {
          trap.revealed = true;
          trap.mesh.material.color.setHex(0x1A0A00);
        }
        _applyDamageToNearby(trap.pos, 1.8, trap.damage);

      } else if (trap.type === 'grenade' && dist < 1.5) {
        trap.triggered = true;
        /* chain: each grenade explodes */
        for (j = 0; j < trap.chainCount; j++) {
          (function(idx, t) {
            var chainPos = {
              x: t.pos.x + (idx - 1) * 0.6,
              y: 0.3,
              z: t.pos.z
            };
            _explodeArea(chainPos, t.damageRadius, t.damage);
          })(j, trap);
        }
        if (trap.mesh) { trap.mesh.visible = false; }
      }
    }
  }

  function _explodeArea(pos, radius, dmg) {
    var i, soldier, truck, dist;

    /* soldiers */
    for (i = 0; i < _soldiers.length; i++) {
      soldier = _soldiers[i];
      if (!soldier.alive) continue;
      dist = _dist2(soldier.pos, pos);
      if (dist < radius) {
        /* 50% chance per soldier for trap hit */
        if (Math.random() < 0.5) {
          soldier.hp -= dmg;
          if (soldier.hp <= 0) { _killSoldier(i); }
        }
      }
    }

    /* trucks */
    for (i = 0; i < _trucks.length; i++) {
      truck = _trucks[i];
      if (!truck.alive) continue;
      dist = _dist2({ x: 0, z: truck.z }, pos);
      if (dist < radius + 2) {
        truck.hp -= dmg;
        if (truck.hp <= 0) { _destroyTruck(i); }
      }
    }

    /* commander */
    if (_commander && _commander.alive) {
      dist = _dist2(_commander.pos, pos);
      if (dist < radius) {
        _commander.hp -= dmg;
        if (_commander.hp <= 0) { _killCommander(); }
      }
    }
  }

  function _applyDamageToNearby(pos, radius, dmg) {
    _explodeArea(pos, radius, dmg);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ENEMY KILL / DESTROY
  ═══════════════════════════════════════════════════════════════════════ */

  function _killSoldier(idx) {
    var s = _soldiers[idx];
    if (!s.alive) return;
    s.alive = false;
    s.mesh.position.y = 0.25;
    s.mesh.scale.y    = 0.3;
    s.mesh.material.color.setHex(0x221111);
  }

  function _destroyTruck(idx) {
    var t = _trucks[idx];
    if (!t.alive) return;
    t.alive = false;
    /* kill driver (visual: darken truck) */
    t.mesh.material.color.setHex(0x221100);
    t.mesh.scale.y = 0.5;
    t.mesh.position.y = 0.375;
  }

  function _killCommander() {
    if (!_commander || !_commander.alive) return;
    _commander.alive = false;
    _commander.mesh.visible     = false;
    _commander.motoMesh.visible = false;
    _radioFlashText  = 'COMMANDER ELIMINATED — reinforcements delayed!';
    _radioFlashTimer = 5;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SHOOTING
  ═══════════════════════════════════════════════════════════════════════ */

  function _fireWeapon() {
    if (_shootCooldown > 0) return;
    _shootCooldown = SHOOT_INTERVAL;

    /* raycasting from camera */
    var raycaster = new THREE.Raycaster();
    var center    = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, _camera);

    /* build target list */
    var targets = [];
    var i;
    for (i = 0; i < _soldiers.length; i++) {
      if (_soldiers[i].alive) targets.push({ obj: _soldiers[i], mesh: _soldiers[i].mesh, type: 'soldier', idx: i });
    }
    for (i = 0; i < _trucks.length; i++) {
      if (_trucks[i].alive) targets.push({ obj: _trucks[i], mesh: _trucks[i].mesh, type: 'truck', idx: i });
    }
    if (_commander && _commander.alive) {
      targets.push({ obj: _commander, mesh: _commander.mesh, type: 'commander', idx: 0 });
    }
    if (_heliArrived && _heliMesh) {
      targets.push({ obj: { hp: 200, alive: true }, mesh: _heliMesh, type: 'heli', idx: 0 });
    }

    var meshes = [];
    for (i = 0; i < targets.length; i++) { meshes.push(targets[i].mesh); }

    var hits = raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return;

    var hitMesh = hits[0].object;
    for (i = 0; i < targets.length; i++) {
      if (targets[i].mesh === hitMesh) {
        var t = targets[i];
        if (t.type === 'soldier') {
          _soldiers[t.idx].hp -= 25;
          if (_soldiers[t.idx].hp <= 0) { _killSoldier(t.idx); }
          _alertConvoy();
        } else if (t.type === 'truck') {
          _trucks[t.idx].hp -= 35;
          if (_trucks[t.idx].hp <= 0) { _destroyTruck(t.idx); }
          _alertConvoy();
        } else if (t.type === 'commander') {
          _commander.hp -= 30;
          if (_commander.hp <= 0) { _killCommander(); }
          _alertConvoy();
        } else if (t.type === 'heli') {
          /* can damage heli but it won't die easily */
        }
        break;
      }
    }
  }

  function _alertConvoy() {
    if (_convoyAlerted) return;
    _convoyAlerted = true;
    var i;
    for (i = 0; i < _soldiers.length; i++) {
      if (_soldiers[i].alive) {
        _soldiers[i].alerted = true;
      }
    }
    if (_phase === PHASE_WAIT) {
      _enterPhase(PHASE_ENGAGE);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SQUAD AI
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateSquad(dt) {
    var soloMode = _countAliveSquad() === 0;
    var i, s, dx, dz, dist, tx, tz, angle;
    for (i = 0; i < _squad.length; i++) {
      s = _squad[i];
      if (!s.alive) continue;
      if (s.fallen) continue;

      /* follow player */
      tx   = _playerPos.x + (i === 0 ? -2 : i === 1 ? 2 : 0) - 4;
      tz   = _playerPos.z - 3 - i * 1.5;
      dx   = tx - s.pos.x;
      dz   = tz - s.pos.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > SQUAD_FOLLOW_DIST) {
        var spd = 5;
        s.pos.x += (dx / dist) * spd * dt;
        s.pos.z += (dz / dist) * spd * dt;
        s.mesh.position.set(s.pos.x, 0.9, s.pos.z);
      }

      /* squad shoots at nearest enemy */
      s.shootTimer = (s.shootTimer || 0) + dt;
      if (s.shootTimer > 1.5 && _phase === PHASE_ENGAGE) {
        s.shootTimer = 0;
        _squadShoot(s, soloMode);
      }
    }
  }

  function _squadShoot(s, soloMode) {
    var i, soldier, dist, best, bestDist;
    bestDist = 99999;
    best     = null;
    for (i = 0; i < _soldiers.length; i++) {
      soldier = _soldiers[i];
      if (!soldier.alive) continue;
      dist = _dist2(s.pos, soldier.pos);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    if (best !== null && bestDist < 25) {
      var dmg = soloMode ? 10 : 20;
      _soldiers[best].hp -= dmg;
      if (_soldiers[best].hp <= 0) { _killSoldier(best); }
    }
  }

  function _countAliveSquad() {
    var c = 0, i;
    for (i = 0; i < _squad.length; i++) {
      if (_squad[i].alive && !_squad[i].fallen) c++;
    }
    return c;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ENEMY AI
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateEnemyAI(dt) {
    var i, s, dx, dz, dist, spd;
    var soloMode   = _countAliveSquad() === 0;
    var aggressMul = soloMode ? 1.5 : 1.0;

    for (i = 0; i < _soldiers.length; i++) {
      s = _soldiers[i];
      if (!s.alive) continue;

      if (s.alerted) {
        /* rush player */
        dx   = _playerPos.x - s.pos.x;
        dz   = _playerPos.z - s.pos.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 1.5) {
          spd      = 4 * aggressMul;
          s.pos.x += (dx / dist) * spd * dt;
          s.pos.z += (dz / dist) * spd * dt;
          s.mesh.position.set(s.pos.x, 0.85, s.pos.z);
        } else {
          /* melee / close fire */
          s.alertTimer += dt;
          if (s.alertTimer > 1.0) {
            s.alertTimer = 0;
            _playerHP   -= 8 * aggressMul;
            if (_playerHP <= 0) { _failMission('Player killed in action'); }
          }
        }

        /* check trap trigger */
        _checkTrapTrigger(s.pos);
      }
    }

    /* convoy commander calls reinforcements after 30s if alive in phase 3 */
    if (_commander && _commander.alive && _phase === PHASE_ENGAGE) {
      _commander.callTimer += dt;
      if (_commander.callTimer > 30 && !_commanderCalled) {
        _commanderCalled      = true;
        _radioFlashText       = 'COMMANDER: Reinforcements called — HELI EN ROUTE!';
        _radioFlashTimer      = 5;
      }

      /* move commander along road */
      _commander.pos.z    += CONVOY_SPEED * 0.8 * dt;
      _commander.mesh.position.z      = _commander.pos.z;
      _commander.motoMesh.position.z  = _commander.pos.z;
    }
  }

  function _updateConvoy(dt) {
    if (!_convoySpawned) return;
    if (!_convoyMoving) return;

    _convoyLeadZ += CONVOY_SPEED * dt;

    var i, t, s;
    for (i = 0; i < _trucks.length; i++) {
      t = _trucks[i];
      if (!t.alive) continue;
      t.z = CONVOY_START_Z + (CONVOY_START_Z - _convoyLeadZ) * -1 + i * 10;
      t.mesh.position.z = t.z;

      /* check trap trigger with truck position */
      _checkTrapTrigger({ x: 0, z: t.z });
    }

    /* soldiers follow convoy Z */
    for (i = 0; i < _soldiers.length; i++) {
      s = _soldiers[i];
      if (!s.alive || s.alerted) continue;
      s.pos.z = _convoyLeadZ + (s.truckIdx || 0) * 10 + (Math.random() - 0.5) * 0.5;
      s.mesh.position.z = s.pos.z;
    }

    /* convoy passes through — if lead truck exits, phase ends */
    if (_convoyLeadZ > CONVOY_EXIT_Z) {
      _convoyMoving = false;
      /* if trucks escaped, fail */
      var escaped = 0;
      for (i = 0; i < _trucks.length; i++) {
        if (_trucks[i].alive) escaped++;
      }
      if (escaped > 0) {
        _failMission('Convoy escaped!');
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HELICOPTER AI
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateHeli(dt) {
    if (!_heliActive || !_heliMesh) return;

    /* fly toward scene center from spawn */
    var tx = 0, tz = 0, ty = 15;
    var hx = _heliMesh.position.x;
    var hz = _heliMesh.position.z;
    var hy = _heliMesh.position.y;

    var dx = tx - hx;
    var dy = ty - hy;
    var dz = tz - hz;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > 1) {
      var speed = 12;
      _heliMesh.position.x += (dx / dist) * speed * dt;
      _heliMesh.position.y += (dy / dist) * speed * dt;
      _heliMesh.position.z += (dz / dist) * speed * dt;
    } else {
      _heliArrived = true;
    }

    /* rotor spin */
    if (_heliMesh._rotor) {
      _heliMesh._rotor.rotation.y += dt * 15;
    }

    /* machine gun sweep when arrived */
    if (_heliArrived) {
      _heliSweepTimer += dt;
      if (_heliSweepTimer > 3) {
        _heliSweepTimer = 0;
        /* damage player */
        _playerHP -= 15;
        if (_playerHP <= 0) { _failMission('Killed by helicopter'); }
        /* damage squad */
        var i;
        for (i = 0; i < _squad.length; i++) {
          if (_squad[i].alive && !_squad[i].fallen && Math.random() < 0.4) {
            _squad[i].hp -= 30;
            if (_squad[i].hp <= 0) { _knockdownSquadmate(i); }
          }
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SQUAD KNOCKDOWN / REVIVE
  ═══════════════════════════════════════════════════════════════════════ */

  function _knockdownSquadmate(idx) {
    var s = _squad[idx];
    if (!s.alive || s.fallen) return;
    s.fallen  = true;
    s.hp      = 1;
    s.mesh.position.y = 0.25;
    s.mesh.scale.set(1.5, 0.2, 1.5);
    s.mesh.material.color.setHex(0x225522);

    var aliveCount = _countAliveSquad();
    if (aliveCount === 0) {
      /* check if any are just fallen (not dead) */
      var anyFallen = false;
      var i;
      for (i = 0; i < _squad.length; i++) {
        if (_squad[i].fallen) { anyFallen = true; break; }
      }
      if (!anyFallen) {
        _failMission('All squad members down!');
      }
    }
  }

  function _tryRevive(idx) {
    var s = _squad[idx];
    if (!s.fallen) return;
    _reviving    = true;
    _reviveTarget = idx;
    _reviveTimer  = 0;
    _radioFlashText  = 'REVIVING SQUADMATE... (10s)';
    _radioFlashTimer = 10;
  }

  function _completeRevive(idx) {
    var s = _squad[idx];
    s.fallen = false;
    s.hp     = 50;
    s.mesh.position.y = 0.9;
    s.mesh.scale.set(1, 1, 1);
    s.mesh.material.color.setHex(0x447744);
    _reviving    = false;
    _reviveTarget = null;
    _radioFlashText  = 'SQUADMATE REVIVED!';
    _radioFlashTimer = 3;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PHASES
  ═══════════════════════════════════════════════════════════════════════ */

  function _enterPhase(phase) {
    _phase = phase;
    if (phase === PHASE_WAIT) {
      _radioFlashText  = 'PHASE 2: CONVOY INBOUND — HOLD POSITION!';
      _radioFlashTimer = 5;
      /* spawn convoy */
      _spawnConvoy();
    } else if (phase === PHASE_ENGAGE) {
      _radioFlashText  = 'PHASE 3: ENGAGE! ESCAPE TO LZ NORTH — 4 MINUTES!';
      _radioFlashTimer = 5;
      _escapeTimer = 240;
      _heliTimer   = 0;
    }
  }

  function _checkPhaseTransitions() {
    if (_phase === PHASE_SETUP) {
      /* auto-advance if all traps set or timer expires */
      if (_trapsSet >= 5) {
        _phaseTimer120 = 0;
        _enterPhase(PHASE_WAIT);
      }
    }

    if (_phase === PHASE_ENGAGE) {
      /* check win: all trucks destroyed + squad at LZ */
      var i, trucksAlive = 0;
      for (i = 0; i < _trucks.length; i++) {
        if (_trucks[i].alive) trucksAlive++;
      }
      if (trucksAlive === 0 && _extractionStarted) {
        _extractionTimer += 0; /* tracked in update */
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ═══════════════════════════════════════════════════════════════════════ */

  function _winMission() {
    _missionDone = true;
    _active      = false;
    _showEndMessage('MISSION COMPLETE! Convoy destroyed. Squad extracted.');
  }

  function _failMission(reason) {
    _missionFailed = true;
    _active        = false;
    _showEndMessage('MISSION FAILED: ' + reason);
  }

  function _showEndMessage(msg) {
    var div = document.createElement('div');
    div.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,10,0,0.9)',
      'color:#00FF66',
      'font-family:monospace',
      'font-size:20px',
      'padding:20px 40px',
      'border:2px solid #00AA44',
      'border-radius:6px',
      'z-index:10000',
      'text-align:center'
    ].join(';');
    div.textContent = msg;
    document.body.appendChild(div);
    _ownMeshes.push({ _endDiv: div });
    setTimeout(function () {
      if (div.parentNode) div.parentNode.removeChild(div);
    }, 5000);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     INPUT
  ═══════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.code] = true;

    var now = performance.now() / 1000;

    if (e.code === 'KeyJ') { _jPressTime = now; }
    if (e.code === 'KeyA') {
      _aPressTime = now;
      if (_jPressTime > 0 && (now - _jPressTime) < JA_WINDOW && !_active) {
        _activate();
      }
    }

    if (!_active) return;

    /* B — binoculars */
    if (e.code === 'KeyB') { _toggleBinoculars(); }

    /* G — smoke grenade */
    if (e.code === 'KeyG') { _dropSmoke(); }

    /* E — interact */
    if (e.code === 'KeyE') { _tryInteract(); }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) { _fireWeapon(); }
  }

  function _onMouseMove(e) {
    if (!_active) return;
    if (_mousePointerLocked) {
      _mouseDX += e.movementX || 0;
      _mouseDY += e.movementY || 0;
    }
  }

  function _onPointerLockChange() {
    _mousePointerLocked = (document.pointerLockElement === _canvas);
  }

  function _onSpaceDown(e) {
    if (!_active) return;
    if (e.code === 'Space') { _fireWeapon(); }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     INTERACT (E key)
  ═══════════════════════════════════════════════════════════════════════ */

  function _tryInteract() {
    if (!_playerPos) return;

    /* Phase 1: plant traps */
    if (_phase === PHASE_SETUP) {
      var i, trap, dist;
      for (i = 0; i < _trapMarkers.length; i++) {
        trap = _trapMarkers[i];
        if (trap.planted) continue;
        dist = _dist2(_playerPos, trap.pos);
        if (dist < TRAP_PLANT_RANGE) {
          _plantTrap(i);
          _radioFlashText  = 'TRAP ' + (i + 1) + ' PLANTED (' + trap.type.toUpperCase() + ')';
          _radioFlashTimer = 3;
          return;
        }
      }
    }

    /* revive fallen squadmate */
    var j, s;
    for (j = 0; j < _squad.length; j++) {
      s = _squad[j];
      if (s.fallen && _dist2(_playerPos, s.pos) < 2.5) {
        _tryRevive(j);
        return;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SMOKE GRENADE / LZ
  ═══════════════════════════════════════════════════════════════════════ */

  function _dropSmoke() {
    if (_lzMarked) return;
    _lzMarked = true;

    /* smoke cloud: group of spheres near LZ */
    var i, sGeo, sMat, sMesh;
    for (i = 0; i < 5; i++) {
      sGeo  = new THREE.SphereGeometry(1.5 + Math.random(), 6, 5);
      sMat  = _makeMat(0xCC4400, { transparent: true, opacity: 0.5 });
      sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(
        _lzMesh.position.x + (Math.random() - 0.5) * 4,
        1.5 + Math.random() * 2,
        _lzMesh.position.z + (Math.random() - 0.5) * 4
      );
      _addMesh(sMesh);
    }

    _lzMesh.material.color.setHex(0xFF4400);
    _radioFlashText  = 'LZ MARKED! Move squad to LZ — extraction in 30s';
    _radioFlashTimer = 5;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ═══════════════════════════════════════════════════════════════════════ */

  function _updatePlayer(dt) {
    if (!_playerPos || !_camera) return;

    /* mouse look */
    var sensitivity = 0.002;
    _playerYaw   -= _mouseDX * sensitivity;
    _playerPitch -= _mouseDY * sensitivity;
    _playerPitch  = _clamp(_playerPitch, -1.2, 1.2);
    _mouseDX      = 0;
    _mouseDY      = 0;

    _camera.rotation.order = 'YXZ';
    _camera.rotation.y     = _playerYaw;
    _camera.rotation.x     = _playerPitch;

    /* movement */
    var speed  = 6;
    var fwd    = _keys['KeyW'] ? 1 : 0;
    var back   = _keys['KeyS'] ? 1 : 0;
    var left   = _keys['KeyA'] ? 1 : 0;
    var right  = _keys['KeyD'] ? 1 : 0;

    if (_inRiver) speed *= 0.5;

    var dx  = (right - left)  * speed * dt;
    var dz  = (back  - fwd)   * speed * dt;
    var sin = Math.sin(_playerYaw);
    var cos = Math.cos(_playerYaw);

    _playerPos.x += dx * cos - dz * sin;
    _playerPos.z += dx * sin + dz * cos;

    /* boundary clamp */
    _playerPos.x = _clamp(_playerPos.x, -55, 55);
    _playerPos.z = _clamp(_playerPos.z, -75, 75);

    _camera.position.set(_playerPos.x, _playerPos.y + 1.7, _playerPos.z);

    /* river check */
    _inRiver = (
      _playerPos.x > -10 && _playerPos.x < 10 &&
      _playerPos.z > 7   && _playerPos.z < 13
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RADIO INTERCEPT
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateRadio(dt) {
    _radioTimer += dt;
    if (_radioTimer >= RADIO_INTERVAL) {
      _radioTimer      = 0;
      _radioFlashText  = _radioMessages[_radioMsgIndex % _radioMessages.length];
      _radioFlashTimer = 5;
      _radioMsgIndex++;
    }
    if (_radioFlashTimer > 0) {
      _radioFlashTimer -= dt;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ACTIVATE / INIT
  ═══════════════════════════════════════════════════════════════════════ */

  function _activate() {
    _active = true;
    _phase  = PHASE_SETUP;
    _phaseTimer120 = 120;

    /* pointer lock */
    if (_canvas) { _canvas.requestPointerLock(); }

    /* init player position */
    _playerPos = new THREE.Vector3(-10, 0, -30);

    /* build world */
    _buildWorld();
    _buildTrapMarkers();
    _buildBinoCrosshair();
    _spawnSquad();

    _buildHUD();

    _radioFlashText  = 'PHASE 1: PLANT 5 TRAPS (E near markers) — 120s';
    _radioFlashTimer = 6;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC: init
  ═══════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || document.querySelector('canvas');

    _tmpVec = new THREE.Vector3();

    document.addEventListener('keydown',          _onKeyDown);
    document.addEventListener('keyup',            _onKeyUp);
    document.addEventListener('mousedown',        _onMouseDown);
    document.addEventListener('mousemove',        _onMouseMove);
    document.addEventListener('pointerlockchange', _onPointerLockChange);
    document.addEventListener('keydown',          _onSpaceDown);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC: update  (called each frame with delta-time in seconds)
  ═══════════════════════════════════════════════════════════════════════ */

  function update(dt) {
    if (!_active || _missionDone || _missionFailed) return;

    /* clamp dt to avoid spiral of death */
    dt = Math.min(dt, 0.1);

    _updatePlayer(dt);
    _updateRadio(dt);
    _updateSquad(dt);

    /* Phase 1: setup countdown */
    if (_phase === PHASE_SETUP) {
      _phaseTimer120 -= dt;
      if (_phaseTimer120 <= 0) {
        _phaseTimer120 = 0;
        _enterPhase(PHASE_WAIT);
      }
    }

    /* Phase 2: convoy moves through, traps auto-trigger */
    if (_phase === PHASE_WAIT) {
      _updateConvoy(dt);

      /* auto-alert if convoy passes trap zone */
      if (_convoySpawned && _convoyLeadZ > -10 && !_convoyAlerted && _trapsSet > 0) {
        /* traps auto-trigger on convoy passing */
        _checkTrapTrigger({ x: 0, z: _convoyLeadZ });
      }

      /* after convoy enters, transition to engage */
      if (_convoySpawned && _convoyLeadZ > CONVOY_START_Z + 5 && !_convoyAlerted) {
        /* player can open fire */
      }
    }

    /* Phase 3: engage + escape */
    if (_phase === PHASE_ENGAGE) {
      _updateConvoy(dt);
      _updateEnemyAI(dt);

      _escapeTimer -= dt;
      _heliTimer   += dt;

      /* helicopter arrives at 4-min mark */
      if (_heliTimer >= 240 && !_heliActive) {
        _spawnHeli();
        _radioFlashText  = 'REINFORCEMENT HELICOPTER INBOUND!';
        _radioFlashTimer = 5;
      }
      _updateHeli(dt);

      /* escape timer expired */
      if (_escapeTimer <= 0) {
        _failMission('Escape timer expired — reinforcements surrounded position');
        return;
      }

      /* revive timer */
      if (_reviving) {
        _reviveTimer += dt;
        if (_reviveTimer >= REVIVE_TIME) {
          _completeRevive(_reviveTarget);
        }
      }

      /* extraction check: player + squad near LZ */
      if (_lzMarked) {
        var nearLZ = _dist2(_playerPos, { x: _lzMesh.position.x, z: _lzMesh.position.z }) < 6;
        if (nearLZ && !_extractionStarted) {
          _extractionStarted = true;
          _radioFlashText    = 'EXTRACTION STARTED — hold LZ for 30s!';
          _radioFlashTimer   = 5;
        }
        if (_extractionStarted) {
          _extractionTimer += dt;
          if (_extractionTimer >= EXTRACTION_WAIT) {
            /* check trucks destroyed */
            var i, alive = 0;
            for (i = 0; i < _trucks.length; i++) {
              if (_trucks[i].alive) alive++;
            }
            if (alive === 0) {
              _winMission();
            } else {
              _radioFlashText  = 'Cannot extract — trucks still active!';
              _radioFlashTimer = 4;
              _extractionStarted = false;
              _extractionTimer   = 0;
            }
          }
        }
      }

      /* shoot cooldown */
      if (_shootCooldown > 0) { _shootCooldown -= dt; }
    }

    _checkPhaseTransitions();
    _updateHUD();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC: reset
  ═══════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active        = false;
    _missionDone   = false;
    _missionFailed = false;
    _phase         = PHASE_SETUP;
    _phaseTimer120 = 120;
    _escapeTimer   = 240;
    _heliTimer     = 0;

    /* remove all own meshes */
    var i, m;
    for (i = 0; i < _ownMeshes.length; i++) {
      m = _ownMeshes[i];
      if (m._endDiv) {
        if (m._endDiv.parentNode) m._endDiv.parentNode.removeChild(m._endDiv);
      } else if (_scene && m.parent === _scene) {
        _scene.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      }
    }
    _ownMeshes = [];

    /* restore fog */
    if (_scene) {
      _scene.fog = _fogBackup;
      if (_bgColorBackup !== null) {
        _scene.background = new THREE.Color(_bgColorBackup);
      }
    }

    /* binoculars */
    if (_binocularsActive && _camera) {
      _camera.fov = _binoFOVBackup;
      _camera.updateProjectionMatrix();
    }
    if (_binoCrosshair && _camera) {
      _camera.remove(_binoCrosshair);
      _binoCrosshair = null;
    }
    _binocularsActive = false;

    _removeHUD();

    /* reset state */
    _trees         = [];
    _trapMarkers   = [];
    _trapsSet      = 0;
    _trucks        = [];
    _soldiers      = [];
    _commander     = null;
    _commanderCalled = false;
    _squad         = [];
    _heliMesh      = null;
    _heliActive    = false;
    _heliArrived   = false;
    _smokeMesh     = null;
    _lzMarked      = false;
    _lzMesh        = null;
    _ground        = null;
    _road          = null;
    _river         = null;
    _convoySpawned = false;
    _convoyAlerted = false;
    _convoyLeadZ   = CONVOY_START_Z;
    _convoyMoving  = true;
    _playerPos     = null;
    _playerHP      = 100;
    _reviving      = false;
    _reviveTarget  = null;
    _inRiver       = false;
    _radioTimer    = 0;
    _radioMsgIndex = 0;
    _radioFlashTimer = 0;
    _radioFlashText  = '';
    _extractionStarted = false;
    _extractionTimer   = 0;
    _jPressTime    = 0;
    _aPressTime    = 0;
    _fogBackup     = null;
    _bgColorBackup = null;
    _binoCrosshair = null;
    _heliSweepTimer = 0;
    _shootCooldown  = 0;
  }

  /* ── Public API ─────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
