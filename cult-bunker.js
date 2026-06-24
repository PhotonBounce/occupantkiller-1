/* ───────────────────────────────────────────────────────────────────────────
   cult-bunker.js — Doomsday Cult Bunker Standoff Module
   API: window.CultBunker = { init, update, reset }
   Controls:
     C + B (both within 400ms) → activate module
     WASD                      → move player
     Mouse                     → aim / look
     Left Click                → shoot (lethal)
     Right Click               → tazer (non-lethal, stuns 8s)
     E (hold 3s on Prophet)    → arrest / cuff
     E (near hostage)          → escort to entry tunnel
     E (near terminal)         → interact (disarm self-destruct)
     F                         → flashbang (3 charges, 8u cone, stuns 5s)
     N                         → toggle night vision
   ─────────────────────────────────────────────────────────────────────────── */
window.CultBunker = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _canvas   = null;
  var _renderer = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active      = false;
  var _bPressTime  = 0;
  var _cPressTime  = 0;
  var _keys        = {};
  var _mouse       = { x: 0, y: 0, leftDown: false, rightDown: false };
  var _prevEKey    = false;
  var _eHoldStart  = 0;
  var _yaw         = 0;
  var _pitch       = 0;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _missionEnd       = false;
  var _missionSuccess   = false;
  var _gameTime         = 0;
  var _countdownSecs    = 300;   /* 5 minutes before self-destruct */
  var _selfDestructArmed = true;
  var _selfDestructDisarmed = false;
  var _disarmCode       = '47291'; /* code on documents */
  var _terminalInput    = '';
  var _atTerminal       = false;
  var _codeFound        = false;
  var _extraTime        = 0;     /* bonus seconds after disarm */

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player = null;
  var _playerHP    = 100;
  var _playerPos   = { x: 0, y: 1.7, z: -55 }; /* starts in entry tunnel */
  var _flashbangs  = 3;
  var _nightVision = false;
  var _nvLight     = null;
  var _ambientLight = null;

  /* ── Shoot cooldown ────────────────────────────────────────────────────── */
  var _shootCooldown  = 0;
  var _tazerCooldown  = 0;
  var _fbCooldown     = 0;
  var _prevFKey       = false;
  var _prevNKey       = false;
  var _prevRClick     = false;

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  var _cultists    = [];   /* 15 regular + 3 elite guards + 1 prophet */
  var _cultistKIA  = 0;
  var _prophetAlive   = true;
  var _prophetArrested = false;
  var _prophetMesh = null;
  var _prophetHP   = 300;
  var _prophetSpeech = false;
  var _speechTimer   = 0;
  var _zealotTimer   = 180; /* 3 minutes then zealots spawn */
  var _zealotsActive = false;

  /* ── Hostages ──────────────────────────────────────────────────────────── */
  var _hostages        = [];
  var _hostagesRescued = 0;
  var _escortingHostage = null;
  var _entryTunnelPos  = { x: 0, z: -55 }; /* rescue zone */

  /* ── Documents / code pickup ───────────────────────────────────────────── */
  var _documents = [];

  /* ── Bookshelf / escape tunnel ─────────────────────────────────────────── */
  var _bookshelfMesh = null;

  /* ── Padlock (armory) ──────────────────────────────────────────────────── */
  var _padlock     = null;
  var _padlockHP   = 2;
  var _armoryOpen  = false;

  /* ── HUD element ───────────────────────────────────────────────────────── */
  var _hud = null;

  /* ── All scene objects owned by this module ────────────────────────────── */
  var _objects = [];

  /* ── Particle/VFX pools ─────────────────────────────────────────────────── */
  var _particles = [];

  /* ── Raycaster ──────────────────────────────────────────────────────────── */
  var _raycaster = null;

  /* =========================================================================
     HELPERS
     ========================================================================= */

  function _makeMat(color, opacity) {
    var opts = { color: color };
    if (opacity !== undefined && opacity < 1) {
      opts.transparent = true;
      opts.opacity = opacity;
    }
    return new THREE.MeshLambertMaterial(opts);
  }

  function _box(w, h, d, color, x, y, z, opacity) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = _makeMat(color, opacity);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    _objects.push(mesh);
    return mesh;
  }

  function _cyl(rt, rb, h, segs, color, x, y, z) {
    var geo  = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat  = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    _objects.push(mesh);
    return mesh;
  }

  function _sphere(r, color, x, y, z) {
    var geo  = new THREE.SphereGeometry(r, 8, 6);
    var mat  = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    _objects.push(mesh);
    return mesh;
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3D(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _fmtTime(secs) {
    var s = Math.max(0, Math.floor(secs));
    var m = Math.floor(s / 60);
    var ss = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
  }

  function _spawnParticle(x, y, z, color) {
    var geo  = new THREE.SphereGeometry(0.08, 4, 4);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    var vx = (Math.random() - 0.5) * 3;
    var vy = Math.random() * 3 + 1;
    var vz = (Math.random() - 0.5) * 3;
    _particles.push({ mesh: mesh, vx: vx, vy: vy, vz: vz, life: 0.8 });
  }

  /* =========================================================================
     BUILD BUNKER GEOMETRY
     ========================================================================= */

  function _buildBunker() {

    /* ── Ambient / dim lighting (bunker mood) ─────────────────────── */
    _ambientLight = new THREE.AmbientLight(0x222222, 1.0);
    _scene.add(_ambientLight);
    _objects.push(_ambientLight);

    var dimLight1 = new THREE.PointLight(0x886644, 0.8, 25);
    dimLight1.position.set(0, 3, 0);
    _scene.add(dimLight1);
    _objects.push(dimLight1);

    var dimLight2 = new THREE.PointLight(0x664422, 0.6, 30);
    dimLight2.position.set(15, 3, 10);
    _scene.add(dimLight2);
    _objects.push(dimLight2);

    var dimLight3 = new THREE.PointLight(0x442222, 0.5, 20);
    dimLight3.position.set(-5, 3, 25);
    _scene.add(dimLight3);
    _objects.push(dimLight3);

    /* Night-vision boost light (starts invisible) */
    _nvLight = new THREE.PointLight(0x00ff44, 0, 80);
    _nvLight.position.set(0, 5, 0);
    _scene.add(_nvLight);
    _objects.push(_nvLight);

    /* ── Entry Tunnel 3×3×20 ──────────────────────────────────────── */
    /* floor */
    _box(3, 0.2, 20, 0x555555, 0, -0.1, -45);
    /* ceiling */
    _box(3, 0.2, 20, 0x444444, 0, 3.1, -45);
    /* left wall */
    _box(0.2, 3, 20, 0x555555, -1.6, 1.5, -45);
    /* right wall */
    _box(0.2, 3, 20, 0x555555, 1.6, 1.5, -45);

    /* ── Main Hall 30×4×15 ────────────────────────────────────────── */
    /* floor */
    _box(30, 0.2, 15, 0x666666, 0, -0.1, -28);
    /* ceiling */
    _box(30, 0.2, 15, 0x555555, 0, 4.1, -28);
    /* north wall */
    _box(30, 4, 0.2, 0x666666, 0, 2, -35.6);
    /* south wall (opening to tunnel) */
    _box(13, 4, 0.2, 0x666666, -8.5, 2, -20.4);
    _box(13, 4, 0.2, 0x666666, 8.5, 2, -20.4);
    /* east wall */
    _box(0.2, 4, 15, 0x666666, 15.1, 2, -28);
    /* west wall */
    _box(0.2, 4, 15, 0x666666, -15.1, 2, -28);

    /* Bunk beds (10 bunks) */
    var i;
    for (i = 0; i < 5; i++) {
      var bx = -12 + i * 4;
      /* lower bunk */
      _box(1.8, 0.15, 4, 0x553311, bx, 0.5, -32);
      /* upper bunk */
      _box(1.8, 0.15, 4, 0x553311, bx, 1.8, -32);
      /* posts */
      _box(0.12, 2.0, 0.12, 0x442200, bx - 0.8, 1.0, -33.9);
      _box(0.12, 2.0, 0.12, 0x442200, bx + 0.8, 1.0, -33.9);
      _box(0.12, 2.0, 0.12, 0x442200, bx - 0.8, 1.0, -30.1);
      _box(0.12, 2.0, 0.12, 0x442200, bx + 0.8, 1.0, -30.1);
    }
    /* 5 more bunks on south side */
    for (i = 0; i < 5; i++) {
      var bx2 = -12 + i * 4;
      _box(1.8, 0.15, 4, 0x553311, bx2, 0.5, -24);
      _box(1.8, 0.15, 4, 0x553311, bx2, 1.8, -24);
      _box(0.12, 2.0, 0.12, 0x442200, bx2 - 0.8, 1.0, -25.9);
      _box(0.12, 2.0, 0.12, 0x442200, bx2 + 0.8, 1.0, -25.9);
      _box(0.12, 2.0, 0.12, 0x442200, bx2 - 0.8, 1.0, -22.1);
      _box(0.12, 2.0, 0.12, 0x442200, bx2 + 0.8, 1.0, -22.1);
    }

    /* ── Kitchen 15×4×10 ──────────────────────────────────────────── */
    /* floor */
    _box(15, 0.2, 10, 0x557755, 20, -0.1, -28);
    /* ceiling */
    _box(15, 0.2, 10, 0x446644, 20, 4.1, -28);
    /* north wall */
    _box(15, 4, 0.2, 0x557755, 20, 2, -33.1);
    /* south wall */
    _box(15, 4, 0.2, 0x557755, 20, 2, -22.9);
    /* east wall */
    _box(0.2, 4, 10, 0x557755, 27.6, 2, -28);
    /* (west wall is shared with main hall opening) */

    /* Weapons cache crates */
    _box(1.2, 0.8, 0.8, 0x556633, 24, 0.4, -32);
    _box(1.2, 0.8, 0.8, 0x556633, 25.5, 0.4, -32);
    _box(1.2, 0.8, 0.8, 0x556633, 24.7, 1.2, -32);
    _box(1.0, 0.6, 0.9, 0x445522, 24, 0.3, -30);
    _box(1.0, 0.6, 0.9, 0x445522, 25.5, 0.3, -30);

    /* Documents pickup */
    var doc1 = _box(0.4, 0.05, 0.3, 0xEEEECC, 18, 0.5, -27);
    doc1.userData.isDocument = true;
    _documents.push(doc1);

    var doc2 = _box(0.4, 0.05, 0.3, 0xEEEECC, 22, 0.5, -25);
    doc2.userData.isDocument = true;
    _documents.push(doc2);

    /* Kitchen counter */
    _box(8, 0.8, 1.5, 0x667766, 20, 0.4, -33);

    /* ── Armory 8×4×8 ─────────────────────────────────────────────── */
    /* floor */
    _box(8, 0.2, 8, 0x444444, -20, -0.1, -30);
    /* ceiling */
    _box(8, 0.2, 8, 0x333333, -20, 4.1, -30);
    /* north wall */
    _box(8, 4, 0.2, 0x444444, -20, 2, -34.1);
    /* south wall with door gap */
    _box(3, 4, 0.2, 0x444444, -22.5, 2, -25.9);
    _box(3, 4, 0.2, 0x444444, -17.5, 2, -25.9);
    /* east wall */
    _box(0.2, 4, 8, 0x444444, -16.1, 2, -30);
    /* west wall */
    _box(0.2, 4, 8, 0x444444, -24.1, 2, -30);

    /* Padlock on armory door */
    _padlock = _box(0.4, 0.5, 0.2, 0xCCBB44, -20, 1.2, -25.9);
    _padlock.userData.isPadlock = true;

    /* Weapon racks inside armory */
    _box(6, 0.1, 0.5, 0x333333, -20, 2.2, -33.5);
    _box(6, 0.1, 0.5, 0x333333, -20, 1.5, -33.5);

    /* ── Chapel 20×6×12 ───────────────────────────────────────────── */
    /* floor */
    _box(20, 0.2, 12, 0x664444, 0, -0.1, 5);
    /* ceiling */
    _box(20, 0.2, 12, 0x553333, 0, 6.1, 5);
    /* north wall */
    _box(20, 6, 0.2, 0x664444, 0, 3, -1.1);
    /* south wall */
    _box(20, 6, 0.2, 0x664444, 0, 3, 11.1);
    /* east wall */
    _box(0.2, 6, 12, 0x664444, 10.1, 3, 5);
    /* west wall */
    _box(0.2, 6, 12, 0x664444, -10.1, 3, 5);

    /* Cross (LineSegments) */
    var crossVerts = new Float32Array([
      0, 3.5, -0.8,   0, 7.0, -0.8,  /* vertical */
      -1.2, 5.5, -0.8,  1.2, 5.5, -0.8  /* horizontal */
    ]);
    var crossGeo = new THREE.BufferGeometry();
    crossGeo.setAttribute('position', new THREE.BufferAttribute(crossVerts, 3));
    crossGeo.setIndex([0, 1, 2, 3]);
    var crossMat = new THREE.LineSegments(crossGeo, new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 3 }));
    _scene.add(crossMat);
    _objects.push(crossMat);

    /* Pews (chapel seating) */
    for (i = 0; i < 4; i++) {
      _box(6, 0.4, 0.6, 0x5a2a2a, -3, 0.2, 1 + i * 2);
      _box(6, 0.4, 0.6, 0x5a2a2a, 3, 0.2, 1 + i * 2);
    }

    /* Prophet's throne */
    _box(1.5, 0.5, 1.5, 0x8B4513, 0, 0.25, -0.5);  /* seat */
    _box(1.5, 1.2, 0.2, 0x8B4513, 0, 1.1, -1.2);   /* back */
    _box(0.2, 1.2, 1.5, 0x8B4513, -0.65, 1.1, -0.5); /* left arm */
    _box(0.2, 1.2, 1.5, 0x8B4513, 0.65, 1.1, -0.5);  /* right arm */

    /* Prophet */
    _prophetMesh = _box(1, 2.5, 0.5, 0x552222, 0, 1.25, -0.5);
    _prophetMesh.userData.isEnemy   = true;
    _prophetMesh.userData.isProphet = true;
    _prophetMesh.userData.hp        = _prophetHP;
    _prophetMesh.userData.maxHp     = _prophetHP;
    _prophetMesh.userData.stunTimer = 0;
    _prophetMesh.userData.arrested  = false;
    _prophetMesh.userData.alive     = true;
    _cultists.push(_prophetMesh);

    /* ── Control Room 10×4×8 ──────────────────────────────────────── */
    /* floor */
    _box(10, 0.2, 8, 0x334455, 0, -0.1, 18);
    /* ceiling */
    _box(10, 0.2, 8, 0x223344, 0, 4.1, 18);
    /* north wall */
    _box(10, 4, 0.2, 0x334455, 0, 2, 14.1);
    /* south wall with door */
    _box(3.5, 4, 0.2, 0x334455, -3.25, 2, 22.1);
    _box(3.5, 4, 0.2, 0x334455, 3.25, 2, 22.1);
    /* east wall */
    _box(0.2, 4, 8, 0x334455, 5.1, 2, 18);
    /* west wall */
    _box(0.2, 4, 8, 0x334455, -5.1, 2, 18);

    /* Countdown terminal (glass screen) */
    var terminalBase = _box(1.2, 1.5, 0.6, 0x223344, 0, 0.75, 14.5);
    terminalBase.userData.isTerminal = true;
    /* Glass screen face */
    var screenGeo = new THREE.BoxGeometry(1.0, 0.8, 0.05);
    var screenMat = new THREE.MeshLambertMaterial({ color: 0x00FFCC, transparent: true, opacity: 0.6 });
    var screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 2.0, 14.6);
    _scene.add(screen);
    _objects.push(screen);
    screen.userData.isTerminal = true;

    /* ── Escape Tunnel 2×2×30 (hidden behind bookshelf) ──────────── */
    /* Bookshelf blocking it */
    _bookshelfMesh = _box(2.2, 2.2, 0.4, 0x6B4513, -10.1, 1.1, 18);
    _bookshelfMesh.userData.isBookshelf = true;
    /* shelf details */
    _box(2.2, 0.08, 0.4, 0x8B5A2B, -10.1, 0.5, 18);
    _box(2.2, 0.08, 0.4, 0x8B5A2B, -10.1, 1.1, 18);
    _box(2.2, 0.08, 0.4, 0x8B5A2B, -10.1, 1.7, 18);

    /* Tunnel itself (behind bookshelf) */
    _box(2, 0.2, 30, 0x333333, -13, -0.1, 18);  /* floor */
    _box(2, 0.2, 30, 0x222222, -13, 2.1, 18);    /* ceiling */
    _box(0.2, 2, 30, 0x333333, -14.1, 1.0, 18);  /* left */
    _box(0.2, 2, 30, 0x333333, -11.9, 1.0, 18);  /* right */

    /* ── Corridor connecting main rooms ──────────────────────────── */
    /* Main hall → Chapel corridor */
    _box(4, 4, 0.2, 0x555555, 0, 2, -20.4);    /* south wall junction */
    _box(4, 0.2, 15, 0x555555, 0, -0.1, -13);  /* floor */
    _box(4, 0.2, 15, 0x444444, 0, 4.1, -13);   /* ceiling */
    _box(0.2, 4, 15, 0x555555, 2.1, 2, -13);   /* right wall */
    _box(0.2, 4, 15, 0x555555, -2.1, 2, -13);  /* left wall */

    /* Chapel → Control Room corridor */
    _box(4, 4, 0.2, 0x555555, 0, 2, 11.1);    /* was south chapel wall */
    _box(4, 0.2, 6, 0x444444, 0, -0.1, 14);   /* floor */
    _box(4, 0.2, 6, 0x333344, 0, 4.1, 14);    /* ceiling */
    _box(0.2, 4, 6, 0x444444, 2.1, 2, 14);    /* right wall */
    _box(0.2, 4, 6, 0x444444, -2.1, 2, 14);   /* left wall */

    /* Kitchen → Main Hall doorway */
    /* (already handled by east wall gap in main hall) */

    /* ── Entry zone marker ────────────────────────────────────────── */
    var entryMarker = _box(2.8, 0.05, 2.8, 0x00AA44, 0, 0.01, -53);
    entryMarker.userData.isEntryZone = true;

  }

  /* =========================================================================
     SPAWN ENEMIES
     ========================================================================= */

  function _spawnEnemies() {
    var i, m, c;

    /* ── 15 regular cultists (0x3D2020) ──────────────────────────── */
    var cultistPositions = [
      /* Main hall */
      { x: -8, z: -28 }, { x: -4, z: -25 }, { x: 0, z: -30 }, { x: 4, z: -27 },
      { x: 8, z: -32 }, { x: -10, z: -33 },
      /* Kitchen */
      { x: 18, z: -27 }, { x: 22, z: -30 }, { x: 25, z: -25 },
      /* Chapel */
      { x: -6, z: 4 }, { x: 6, z: 3 }, { x: -4, z: 8 }, { x: 4, z: 9 },
      /* Corridors */
      { x: 0, z: -15 }, { x: 0, z: 12 }
    ];

    for (i = 0; i < cultistPositions.length; i++) {
      var cp = cultistPositions[i];
      m = _box(0.8, 1.8, 0.5, 0x3D2020, cp.x, 0.9, cp.z);
      m.userData.isEnemy    = true;
      m.userData.isCultist  = true;
      m.userData.hp         = 60;
      m.userData.maxHp      = 60;
      m.userData.stunTimer  = 0;
      m.userData.alive      = true;
      m.userData.surrendered = false;
      m.userData.isZealot   = false;
      m.userData.patrolDir  = (Math.random() > 0.5) ? 1 : -1;
      m.userData.patrolT    = Math.random() * Math.PI * 2;
      m.userData.aggroRange = 12;
      m.userData.attackTimer = 0;
      /* Eyes */
      _sphere(0.12, 0xFFFFFF, cp.x - 0.15, 1.65, cp.z - 0.26).userData.parentEnemy = m;
      _sphere(0.12, 0xFFFFFF, cp.x + 0.15, 1.65, cp.z - 0.26).userData.parentEnemy = m;
      _sphere(0.07, 0x880000, cp.x - 0.15, 1.65, cp.z - 0.28).userData.parentEnemy = m;
      _sphere(0.07, 0x880000, cp.x + 0.15, 1.65, cp.z - 0.28).userData.parentEnemy = m;
      _cultists.push(m);
    }

    /* ── 3 elite guards (0x220000) ────────────────────────────────── */
    var elitePositions = [
      { x: -2, z: -0.5 },  /* guard Prophet */
      { x: 2, z: -0.5 },
      { x: 0, z: 1.5 }
    ];

    for (i = 0; i < elitePositions.length; i++) {
      var ep = elitePositions[i];
      m = _box(0.9, 2.0, 0.55, 0x220000, ep.x, 1.0, ep.z);
      m.userData.isEnemy     = true;
      m.userData.isCultist   = true;
      m.userData.isElite     = true;
      m.userData.hp          = 150;
      m.userData.maxHp       = 150;
      m.userData.stunTimer   = 0;
      m.userData.alive       = true;
      m.userData.surrendered = false;
      m.userData.isZealot    = false;
      m.userData.aggroRange  = 15;
      m.userData.attackTimer = 0;
      m.userData.patrolT     = Math.random() * Math.PI * 2;
      /* Shoulder armor */
      _box(1.1, 0.3, 0.6, 0x440000, ep.x, 2.2, ep.z);
      _cultists.push(m);
    }
  }

  /* =========================================================================
     SPAWN HOSTAGES
     ========================================================================= */

  function _spawnHostages() {
    var hostagePositions = [
      /* Main hall */
      { x: -6, z: -29 }, { x: 6, z: -26 }, { x: -11, z: -24 },
      /* Kitchen */
      { x: 17, z: -26 }, { x: 24, z: -24 },
      /* Armory */
      { x: -21, z: -29 }, { x: -19, z: -31 },
      /* Chapel */
      { x: -7, z: 6 }, { x: 7, z: 5 }, { x: -3, z: 9 },
      /* Control room */
      { x: -3, z: 18 }, { x: 3, z: 19 }
    ];

    var i;
    for (i = 0; i < hostagePositions.length; i++) {
      var hp = hostagePositions[i];
      var m = _box(0.7, 1.7, 0.45, 0xFFDDCC, hp.x, 0.85, hp.z);
      m.userData.isHostage  = true;
      m.userData.rescued    = false;
      m.userData.escorted   = false;
      /* Hair */
      _box(0.7, 0.35, 0.46, 0x553311, hp.x, 1.8, hp.z);
      _hostages.push(m);
    }
  }

  /* =========================================================================
     HUD
     ========================================================================= */

  function _createHUD() {
    _hud = document.createElement('div');
    _hud.id = 'cult-bunker-hud';
    _hud.style.cssText = [
      'position:fixed',
      'bottom:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 16px',
      'border:1px solid #00FF88',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'text-align:center',
      'line-height:1.7',
      'max-width:95vw'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function _updateHUD() {
    if (!_hud) return;
    var hostStr     = _hostagesRescued + '/12';
    var kiaStr      = _cultistKIA + '/5 MAX';
    var kiaColor    = _cultistKIA >= 4 ? '#FF4444' : '#00FF88';
    var prophetStr  = _prophetArrested ? '<span style="color:#44FF44">ARRESTED</span>' :
                      (_prophetAlive   ? '<span style="color:#FF4444">ACTIVE</span>'   :
                                          '<span style="color:#FF0000">KIA</span>');
    var cdStr       = _fmtTime(_countdownSecs);
    var cdColor     = _countdownSecs < 60 ? '#FF2200' : (_countdownSecs < 120 ? '#FFAA00' : '#00FF88');
    var sdStr       = _selfDestructDisarmed
      ? '<span style="color:#44FF44">DISARMED</span>'
      : '<span style="color:#FF4444">ARMED</span>';
    var nvStr       = _nightVision ? ' | <span style="color:#00FF44">NV ON</span>' : '';
    var fbStr       = ' | FB:' + _flashbangs;
    var codeStr     = _codeFound ? ' | CODE: ' + _disarmCode : ' | CODE: ???';
    var termStr     = _atTerminal ? ' | <span style="color:#FFFF00">[TERMINAL] TYPE CODE + ENTER</span>' : '';
    var escStr      = _escortingHostage ? ' | <span style="color:#AAFFAA">ESCORTING</span>' : '';

    _hud.innerHTML = [
      'CULT BUNKER',
      ' | HOSTAGES: ' + hostStr,
      ' | <span style="color:' + kiaColor + '">CULTISTS KIA: ' + kiaStr + '</span>',
      ' | PROPHET: ' + prophetStr,
      ' | <span style="color:' + cdColor + '">COUNTDOWN: ' + cdStr + '</span>',
      ' | SELF-DESTRUCT: ' + sdStr,
      nvStr, fbStr, codeStr, escStr, termStr
    ].join('');

    if (_prophetSpeech) {
      _hud.innerHTML += '<br><span style="color:#FF8800">!! PROPHET BROADCASTING: "THE END IS NIGH — PREPARE FOR ASCENSION" !!</span>';
    }
    if (_zealotsActive) {
      _hud.innerHTML += '<br><span style="color:#FF4444">!! ZEALOTS ACTIVATED — CULTISTS BERSERK !!</span>';
    }
    if (_missionEnd) {
      if (_missionSuccess) {
        _hud.innerHTML = '<span style="color:#00FF88;font-size:20px">MISSION COMPLETE — PROPHET ARRESTED — ' + _hostagesRescued + ' HOSTAGES RESCUED</span>';
      } else {
        _hud.innerHTML = '<span style="color:#FF2200;font-size:20px">MISSION FAILED — ' + (_countdownSecs <= 0 ? 'SELF-DESTRUCT DETONATED' : _cultistKIA > 5 ? 'TOO MANY CASUALTIES' : 'OPERATOR KIA') + '</span>';
      }
    }
  }

  /* =========================================================================
     INPUT HANDLERS
     ========================================================================= */

  function _onKeyDown(e) {
    _keys[e.code] = true;
    if (!_active) {
      if (e.code === 'KeyC') _cPressTime = performance.now();
      if (e.code === 'KeyB') _bPressTime = performance.now();
      if (_cPressTime > 0 && _bPressTime > 0) {
        var gap = Math.abs(_cPressTime - _bPressTime);
        if (gap < 400) { _activateModule(); }
      }
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    if (!e.code.match(/^Key[CB]$/)) return;
    if (e.code === 'KeyC') _cPressTime = 0;
    if (e.code === 'KeyB') _bPressTime = 0;
  }

  function _onMouseMove(e) {
    if (!_active || _missionEnd) return;
    _yaw   -= e.movementX * 0.002;
    _pitch -= e.movementY * 0.002;
    _pitch  = Math.max(-1.2, Math.min(1.2, _pitch));
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  function _onMouseDown(e) {
    if (!_active || _missionEnd) return;
    if (e.button === 0) _mouse.leftDown  = true;
    if (e.button === 2) _mouse.rightDown = true;
    e.preventDefault();
  }

  function _onMouseUp(e) {
    if (e.button === 0) _mouse.leftDown  = false;
    if (e.button === 2) _mouse.rightDown = false;
  }

  function _onContextMenu(e) { e.preventDefault(); }

  function _onPointerLockChange() {
    /* nothing extra needed */
  }

  /* =========================================================================
     ACTIVATION
     ========================================================================= */

  function _activateModule() {
    if (_active) return;
    _active = true;

    _scene  = window._scene  || (window.gameState && window.gameState.scene)  || null;
    _camera = window._camera || (window.gameState && window.gameState.camera) || null;
    _canvas = window._canvas || (window.gameState && window.gameState.canvas) || document.querySelector('canvas');

    if (!_scene || !_camera) { _active = false; return; }

    _raycaster = new THREE.Raycaster();

    _reset();
    _buildBunker();
    _spawnEnemies();
    _spawnHostages();
    _createHUD();

    /* Position camera at entry tunnel */
    _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = 0;
    _camera.rotation.x = 0;

    /* Pointer lock */
    if (_canvas) _canvas.requestPointerLock();

    document.addEventListener('pointerlockchange', _onPointerLockChange);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('mouseup',   _onMouseUp);
    document.addEventListener('contextmenu', _onContextMenu);
  }

  /* =========================================================================
     RESET (internal)
     ========================================================================= */

  function _reset() {
    /* Remove old objects */
    var i;
    for (i = 0; i < _objects.length; i++) {
      if (_objects[i].parent) _objects[i].parent.remove(_objects[i]);
    }
    _objects   = [];
    _cultists  = [];
    _hostages  = [];
    _documents = [];
    _particles = [];

    _playerHP            = 100;
    _playerPos           = { x: 0, y: 1.7, z: -55 };
    _flashbangs          = 3;
    _nightVision         = false;
    _hostagesRescued     = 0;
    _escortingHostage    = null;
    _cultistKIA          = 0;
    _prophetAlive        = true;
    _prophetArrested     = false;
    _prophetMesh         = null;
    _prophetHP           = 300;
    _prophetSpeech       = false;
    _speechTimer         = 0;
    _zealotTimer         = 180;
    _zealotsActive       = false;
    _countdownSecs       = 300;
    _selfDestructArmed   = true;
    _selfDestructDisarmed = false;
    _terminalInput       = '';
    _atTerminal          = false;
    _codeFound           = false;
    _extraTime           = 0;
    _missionEnd          = false;
    _missionSuccess      = false;
    _gameTime            = 0;
    _shootCooldown       = 0;
    _tazerCooldown       = 0;
    _fbCooldown          = 0;
    _armoryOpen          = false;
    _padlockHP           = 2;
    _padlock             = null;
    _bookshelfMesh       = null;
    _nvLight             = null;
    _ambientLight        = null;
    _yaw                 = 0;
    _pitch               = 0;
  }

  /* =========================================================================
     SHOOTING / TAZER / FLASHBANG
     ========================================================================= */

  function _castShot(lethal) {
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(_camera.rotation);
    _raycaster.set(_camera.position, dir);

    var meshes = [];
    var i;
    for (i = 0; i < _cultists.length; i++) {
      if (_cultists[i].userData.alive) meshes.push(_cultists[i]);
    }
    /* Also check padlock */
    if (_padlock && !_armoryOpen) meshes.push(_padlock);

    var hits = _raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return;

    var hit  = hits[0];
    var obj  = hit.object;
    var pt   = hit.point;

    /* Padlock hit */
    if (obj.userData.isPadlock && lethal) {
      _padlockHP--;
      _spawnParticle(pt.x, pt.y, pt.z, 0xFFAA00);
      if (_padlockHP <= 0) {
        _armoryOpen = true;
        if (obj.parent) obj.parent.remove(obj);
      }
      return;
    }

    if (!obj.userData.isEnemy) return;
    if (!obj.userData.alive) return;
    if (obj.userData.arrested) return;

    var baseDmg = lethal ? 30 : 0;

    if (!lethal) {
      /* Tazer */
      if (!obj.userData.stunTimer || obj.userData.stunTimer <= 0) {
        obj.userData.stunTimer = 8.0;
        obj.userData.surrendered = true;
        obj.material.color.setHex(0x8888FF);
        _spawnParticle(pt.x, pt.y, pt.z, 0x4444FF);
        _spawnParticle(pt.x, pt.y + 0.3, pt.z, 0x8888FF);
      }
      return;
    }

    /* Lethal shot */
    var dmg = baseDmg;
    if (obj.userData.isElite) dmg = Math.floor(dmg * 0.7); /* 30% armor reduction */

    obj.userData.hp -= dmg;
    _spawnParticle(pt.x, pt.y, pt.z, 0xFF2200);
    _spawnParticle(pt.x, pt.y + 0.2, pt.z, 0xFF6600);

    if (obj.userData.hp <= 0) {
      obj.userData.alive = false;
      obj.material.color.setHex(0x110000);
      obj.position.y -= 0.7; /* fall */
      if (!obj.userData.isProphet) {
        _cultistKIA++;
      } else {
        _prophetAlive = false;
        /* Killing prophet is bad but allowed if desperate */
        _cultistKIA += 2; /* counts double */
      }
    }
  }

  function _throwFlashbang() {
    if (_flashbangs <= 0) return;
    if (_fbCooldown > 0) return;
    _flashbangs--;
    _fbCooldown = 1.5;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(_camera.rotation);

    var px = _camera.position.x + dir.x * 4;
    var py = _camera.position.y;
    var pz = _camera.position.z + dir.z * 4;

    _spawnParticle(px, py, pz, 0xFFFFFF);
    _spawnParticle(px, py + 0.3, pz, 0xFFFFAA);
    _spawnParticle(px - 0.2, py, pz - 0.2, 0xFFFFFF);
    _spawnParticle(px + 0.2, py, pz + 0.2, 0xFFFFFF);

    /* Stun enemies in 8u cone */
    var i, c, dx, dz, dist;
    for (i = 0; i < _cultists.length; i++) {
      c = _cultists[i];
      if (!c.userData.alive || c.userData.stunTimer > 0) continue;
      dx   = c.position.x - px;
      dz   = c.position.z - pz;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 8) {
        /* Check cone angle */
        var angle = Math.atan2(dz, dx) - Math.atan2(dir.z, dir.x);
        /* Normalize */
        while (angle > Math.PI)  angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        if (Math.abs(angle) < Math.PI * 0.55) { /* ~99 degree cone */
          c.userData.stunTimer = 5.0;
          c.material.color.setHex(c.userData.isElite ? 0x330000 : 0x554444);
        }
      }
    }
  }

  /* =========================================================================
     ENEMY AI
     ========================================================================= */

  function _updateEnemies(dt) {
    var i, c, dx, dz, dist;
    var px = _camera.position.x;
    var pz = _camera.position.z;

    for (i = 0; i < _cultists.length; i++) {
      c = _cultists[i];
      if (!c.userData.alive) continue;
      if (c.userData.arrested) continue;
      if (c.userData.surrendered && !c.userData.isZealot) continue;

      /* Tick stun */
      if (c.userData.stunTimer > 0) {
        c.userData.stunTimer -= dt;
        if (c.userData.stunTimer <= 0) {
          c.userData.stunTimer = 0;
          if (!c.userData.surrendered) {
            c.material.color.setHex(c.userData.isProphet ? 0x552222 : (c.userData.isElite ? 0x220000 : (c.userData.isZealot ? 0x880000 : 0x3D2020)));
          }
        }
        continue;
      }

      if (c.userData.isProphet) {
        /* Prophet stands, speaks */
        _speechTimer -= dt;
        if (_speechTimer <= 0) {
          _prophetSpeech = !_prophetSpeech;
          _speechTimer = _prophetSpeech ? 6 : 10;
        }
        continue;
      }

      dx   = px - c.position.x;
      dz   = pz - c.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < c.userData.aggroRange) {
        /* Move toward player */
        var speed = c.userData.isZealot ? 3.5 : (c.userData.isElite ? 2.8 : 2.0);
        var moveX = (dx / dist) * speed * dt;
        var moveZ = (dz / dist) * speed * dt;
        c.position.x += moveX;
        c.position.z += moveZ;

        /* Attack cooldown */
        c.userData.attackTimer -= dt;
        if (c.userData.attackTimer <= 0) {
          var atkRange = c.userData.isZealot ? 2.0 : (c.userData.isElite ? 14 : 12);
          if (dist < atkRange) {
            /* Damage player */
            var dmg = c.userData.isZealot ? 18 : (c.userData.isElite ? 14 : 8);
            _playerHP -= dmg;
            c.userData.attackTimer = c.userData.isElite ? 1.2 : 1.8;
            if (_playerHP <= 0) {
              _playerHP = 0;
              _missionEnd = true;
              _missionSuccess = false;
            }
          }
        }
      } else {
        /* Patrol */
        c.userData.patrolT += dt * 0.5;
        c.position.x += Math.sin(c.userData.patrolT) * 0.015;
        c.position.z += Math.cos(c.userData.patrolT * 0.7) * 0.01;
      }

      /* Face player */
      c.rotation.y = Math.atan2(dx, dz);
    }
  }

  /* =========================================================================
     ZEALOT TRIGGER
     ========================================================================= */

  function _checkZealots(dt) {
    if (_zealotsActive) return;
    if (!_prophetAlive || _prophetArrested) return;
    _zealotTimer -= dt;
    if (_zealotTimer <= 0) {
      _zealotsActive = true;
      /* Turn first 3 living cultists into zealots */
      var count = 0, i, c;
      for (i = 0; i < _cultists.length && count < 3; i++) {
        c = _cultists[i];
        if (c.userData.alive && !c.userData.isProphet && !c.userData.isElite && !c.userData.surrendered) {
          c.userData.isZealot = true;
          c.userData.hp      += 50;
          c.userData.maxHp   += 50;
          c.userData.stunTimer = 0; /* immune to stun */
          c.material.color.setHex(0x880000);
          count++;
        }
      }
    }
  }

  /* =========================================================================
     HOSTAGE ESCORT
     ========================================================================= */

  function _checkHostages(dt) {
    var i, h, dx, dz, dist;
    var px = _camera.position.x;
    var py = _camera.position.y;
    var pz = _camera.position.z;

    for (i = 0; i < _hostages.length; i++) {
      h = _hostages[i];
      if (h.userData.rescued) continue;

      dx   = px - h.position.x;
      dz   = pz - h.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      /* Auto-follow if escorted */
      if (h.userData.escorted) {
        var speed = 2.5;
        if (dist > 1.2) {
          h.position.x += (dx / dist) * speed * dt;
          h.position.z += (dz / dist) * speed * dt;
        }
        /* Check if reached entry zone */
        var exDist = _dist2D(h.position.x, h.position.z, _entryTunnelPos.x, _entryTunnelPos.z);
        if (exDist < 3) {
          h.userData.rescued  = true;
          h.userData.escorted = false;
          if (_escortingHostage === h) _escortingHostage = null;
          if (h.parent) h.parent.remove(h);
          _hostagesRescued++;
        }
      }
    }
  }

  /* =========================================================================
     INTERACT (E key)
     ========================================================================= */

  function _handleInteract(dt) {
    var eDown    = !!_keys['KeyE'];
    var ePressed = eDown && !_prevEKey;
    _prevEKey    = eDown;

    var px = _camera.position.x;
    var py = _camera.position.y;
    var pz = _camera.position.z;

    /* Prophet arrest (hold E for 3s when stunned + near) */
    if (_prophetMesh && _prophetMesh.userData.alive && !_prophetMesh.userData.arrested) {
      var propDist = _dist2D(px, pz, _prophetMesh.position.x, _prophetMesh.position.z);
      if (propDist < 2.5 && _prophetMesh.userData.stunTimer > 0) {
        if (eDown) {
          if (_eHoldStart === 0) _eHoldStart = performance.now();
          var held = (performance.now() - _eHoldStart) / 1000;
          if (held >= 3.0) {
            _prophetMesh.userData.arrested  = true;
            _prophetMesh.userData.alive     = true; /* alive but cuffed */
            _prophetArrested = true;
            _prophetMesh.material.color.setHex(0x00AA44);
            _eHoldStart = 0;
          }
        } else {
          _eHoldStart = 0;
        }
        return;
      }
    }

    if (!ePressed) {
      if (!eDown) _eHoldStart = 0;
      /* Terminal typing (handled by keydown events) */
      return;
    }

    /* Hostage pickup */
    var i, h, dist;
    if (!_escortingHostage) {
      for (i = 0; i < _hostages.length; i++) {
        h = _hostages[i];
        if (h.userData.rescued || h.userData.escorted) continue;
        dist = _dist2D(px, pz, h.position.x, h.position.z);
        if (dist < 2.0) {
          h.userData.escorted = true;
          _escortingHostage   = h;
          break;
        }
      }
    } else {
      /* Drop / release hostage */
      /* (kept following automatically, so E just releases) */
      _escortingHostage.userData.escorted = false;
      _escortingHostage = null;
      return;
    }

    /* Terminal interact */
    var termDist = _dist2D(px, pz, 0, 14.5);
    if (termDist < 3.0) {
      _atTerminal = !_atTerminal;
    }

    /* Document pickup */
    for (i = 0; i < _documents.length; i++) {
      var doc = _documents[i];
      if (doc.userData.pickedUp) continue;
      var ddist = _dist2D(px, pz, doc.position.x, doc.position.z);
      if (ddist < 2.0) {
        doc.userData.pickedUp = true;
        if (doc.parent) doc.parent.remove(doc);
        _codeFound = true;
      }
    }
  }

  /* =========================================================================
     TERMINAL KEYPAD
     ========================================================================= */

  function _onTerminalKey(e) {
    if (!_active || !_atTerminal || _selfDestructDisarmed) return;
    if (e.code === 'Escape') { _atTerminal = false; return; }
    if (e.code === 'Enter') {
      if (_terminalInput === _disarmCode) {
        _selfDestructDisarmed = true;
        _selfDestructArmed    = false;
        _countdownSecs       += 120; /* 2 extra minutes */
        _extraTime            = 120;
        _atTerminal           = false;
        _terminalInput        = '';
      } else {
        _terminalInput = ''; /* wrong code */
      }
      return;
    }
    if (e.code === 'Backspace') {
      _terminalInput = _terminalInput.slice(0, -1);
      return;
    }
    if (_terminalInput.length < 5 && e.key >= '0' && e.key <= '9') {
      _terminalInput += e.key;
    }
  }

  /* =========================================================================
     PLAYER MOVEMENT
     ========================================================================= */

  function _movePlayer(dt) {
    var speed = 5.0;
    var dir   = new THREE.Vector3();

    if (_keys['KeyW']) dir.z -= 1;
    if (_keys['KeyS']) dir.z += 1;
    if (_keys['KeyA']) dir.x -= 1;
    if (_keys['KeyD']) dir.x += 1;

    if (dir.length() > 0) {
      dir.normalize();
      dir.applyEuler(new THREE.Euler(0, _yaw, 0, 'YXZ'));
      _camera.position.x += dir.x * speed * dt;
      _camera.position.z += dir.z * speed * dt;
      _camera.position.y  = 1.7; /* lock height */
    }
    _playerPos.x = _camera.position.x;
    _playerPos.y = _camera.position.y;
    _playerPos.z = _camera.position.z;
  }

  /* =========================================================================
     PARTICLES
     ========================================================================= */

  function _updateParticles(dt) {
    var i, p;
    for (i = _particles.length - 1; i >= 0; i--) {
      p = _particles[i];
      p.life -= dt;
      p.vy   -= 8 * dt; /* gravity */
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      if (p.life <= 0) {
        if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
        _particles.splice(i, 1);
      }
    }
  }

  /* =========================================================================
     WIN / LOSE CHECK
     ========================================================================= */

  function _checkEndConditions() {
    if (_missionEnd) return;

    /* Lose: self-destruct */
    if (!_selfDestructDisarmed && _countdownSecs <= 0) {
      _missionEnd     = true;
      _missionSuccess = false;
      return;
    }

    /* Lose: too many cultist deaths */
    if (_cultistKIA > 5) {
      _missionEnd     = true;
      _missionSuccess = false;
      return;
    }

    /* Win: prophet arrested + 8+ hostages rescued */
    if (_prophetArrested && _hostagesRescued >= 8) {
      _missionEnd     = true;
      _missionSuccess = true;
    }
  }

  /* =========================================================================
     PUBLIC: update (called every frame)
     ========================================================================= */

  function update(dt) {
    if (!_active || _missionEnd) return;

    /* Countdown */
    if (!_selfDestructDisarmed || _countdownSecs > 0) {
      _countdownSecs -= dt;
    }

    _gameTime += dt;

    /* Player movement */
    _movePlayer(dt);

    /* Shooting */
    _shootCooldown -= dt;
    _tazerCooldown -= dt;
    _fbCooldown    -= dt;

    if (_mouse.leftDown && _shootCooldown <= 0) {
      _castShot(true);
      _shootCooldown = 0.15;
    }

    var rDown = _mouse.rightDown;
    if (rDown && !_prevRClick && _tazerCooldown <= 0) {
      _castShot(false);
      _tazerCooldown = 1.0;
    }
    _prevRClick = rDown;

    /* Flashbang */
    var fDown = !!_keys['KeyF'];
    if (fDown && !_prevFKey) _throwFlashbang();
    _prevFKey = fDown;

    /* Night vision */
    var nDown = !!_keys['KeyN'];
    if (nDown && !_prevNKey) {
      _nightVision = !_nightVision;
      if (_nvLight) _nvLight.intensity = _nightVision ? 2.5 : 0;
      if (_ambientLight) _ambientLight.intensity = _nightVision ? 2.0 : 1.0;
    }
    _prevNKey = nDown;

    /* Interact */
    _handleInteract(dt);

    /* Enemies */
    _updateEnemies(dt);
    _checkZealots(dt);
    _checkHostages(dt);
    _updateParticles(dt);
    _checkEndConditions();
    _updateHUD();
  }

  /* =========================================================================
     PUBLIC: init
     ========================================================================= */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('keydown', _onTerminalKey);
  }

  /* =========================================================================
     PUBLIC: reset
     ========================================================================= */

  function reset() {
    _reset();
    _active = false;
    if (_hud && _hud.parentNode) { _hud.parentNode.removeChild(_hud); _hud = null; }
    document.removeEventListener('mousemove',        _onMouseMove);
    document.removeEventListener('mousedown',        _onMouseDown);
    document.removeEventListener('mouseup',          _onMouseUp);
    document.removeEventListener('contextmenu',      _onContextMenu);
    document.removeEventListener('pointerlockchange', _onPointerLockChange);
    if (document.exitPointerLock) document.exitPointerLock();
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
