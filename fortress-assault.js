/* ───────────────────────────────────────────────────────────────────────────
   fortress-assault.js — Fortress Assault FPS Mini-Game
   API: window.FortressAssault = { init, update, reset }
   Controls:
     F + A (simultaneous, within 400ms) → activate module
     1 / 2 / 3  → choose route (front gate / west wall / east sewer)
     WASD        → move player
     Mouse       → aim / look
     Left-click  → shoot
     E           → interact (free hostage, climb rope, open sewer grate, plant C4)
     F           → action (C4 arm when holding charge)
     C           → crouch / crawl in sewer
     R           → reload
   ─────────────────────────────────────────────────────────────────────────── */
window.FortressAssault = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _canvas   = null;
  var _renderer = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active            = false;
  var _fPressed          = false;
  var _aPressed          = false;
  var _fTime             = 0;
  var _aTime             = 0;
  var ACTIVATION_WINDOW  = 400;

  /* ── Phase / route ─────────────────────────────────────────────────────── */
  var _phase         = 'route_select'; // route_select | approach | combat | win | dead
  var _chosenRoute   = 0;              // 0=none, 1=front, 2=west, 3=east
  var _routeNames    = ['', 'FRONT GATE', 'WEST WALL', 'EAST SEWER'];

  /* ── Player state ──────────────────────────────────────────────────────── */
  var _playerPos     = null;
  var _playerVel     = null;
  var _playerYaw     = 0;
  var _playerPitch   = 0;
  var _playerHP      = 100;
  var _playerAmmo    = 30;
  var _playerAmmoRes = 120;
  var _playerSpeed   = 8;
  var _crouching     = false;
  var _onLadder      = false;
  var _ladderTarget  = null;
  var _climbProgress = 0;
  var _climbTotal    = 4;    // 4 E-presses to reach top on west wall
  var _sewerEntered  = false;

  /* ── C4 state ──────────────────────────────────────────────────────────── */
  var _c4Placed      = false;
  var _c4Mesh        = null;
  var _c4Timer       = 0;
  var _c4Arming      = false;
  var _c4ArmTimer    = 0;
  var C4_ARM_TIME    = 2.0;

  /* ── Gate / portcullis ─────────────────────────────────────────────────── */
  var _mainGateMesh      = null;
  var _mainGateDestroyed = false;
  var _portcullisLines   = null;
  var _portcullisChain   = null;
  var _portcullisOpen    = false;
  var _portcullisLock    = null;
  var _portcullisLockHP  = 20;

  /* ── Score / stealth ───────────────────────────────────────────────────── */
  var _score           = 0;
  var _stealthOk       = true;    // true until a barracks guard alerted
  var _barracksAlerted = false;
  var _wave2Skipped    = false;

  /* ── Militia enemies ───────────────────────────────────────────────────── */
  var _militia     = [];   // 20 BoxGeometry (0x664422) 80HP
  var _snipers     = [];   // 4 CylinderGeometry 100HP
  var _warlord     = null; // BoxGeometry (0x441111) 400HP
  var _bodyguards  = [];   // 2 bodyguards
  var _rats        = [];   // 2 non-hostile (sewer)
  var _machineGunNests = [];
  var _barracksGuards  = []; // 8 sleeping guards
  var _courtyardGuardsArr = [];

  /* ── Hostages ──────────────────────────────────────────────────────────── */
  var _hostages        = [];   // 4 in dungeon
  var _hostageFree     = 0;
  var _hostageDistract = [];   // freed hostages acting as distractions

  /* ── Explosive barrels ─────────────────────────────────────────────────── */
  var _barrels   = [];

  /* ── Bullets / projectiles ─────────────────────────────────────────────── */
  var _bullets   = [];
  var _enemyBullets = [];

  /* ── Geometry groups ───────────────────────────────────────────────────── */
  var _fortressGroup  = null;
  var _outerWalls     = [];
  var _towers         = [];
  var _gateGroup      = null;
  var _keep           = null;
  var _barracks       = null;
  var _dungeonGroup   = null;
  var _ladderMeshes   = [];
  var _sewerTunnel    = null;

  /* ── Lights ────────────────────────────────────────────────────────────── */
  var _ambientLight   = null;
  var _sunLight       = null;
  var _sewerLight     = null;  // kept off in sewer (dark)
  var _explosionLight = null;

  /* ── Clock / timing ─────────────────────────────────────────────────────── */
  var _clock      = null;
  var _totalTime  = 0;
  var _warlordDead = false;

  /* ── Input state ────────────────────────────────────────────────────────── */
  var _keys   = { w: false, a: false, s: false, d: false, e: false, f: false, c: false, r: false };
  var _mouse  = { dx: 0, dy: 0, fire: false };
  var _fireThisFrame = false;
  var _eThisFrame    = false;
  var _rThisFrame    = false;
  var _prevE         = false;
  var _prevR         = false;
  var _prevFire      = false;

  /* ── HUD element ────────────────────────────────────────────────────────── */
  var _hudEl    = null;
  var _overlayEl = null;

  /* ── Patrol timers ──────────────────────────────────────────────────────── */
  var _patrolTimers = [];

  /* ── Courtyard guards (separate from militia array for clarity) ─────────── */
  var _courtyardGuards = [];

  /* ═══════════════════════════════════════════════════════════════════════════
     MATH / GEOMETRY HELPERS
  ═══════════════════════════════════════════════════════════════════════════ */

  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _dist2(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _norm3(v) {
    var l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    v.x /= l; v.y /= l; v.z /= l;
    return v;
  }

  function _randBetween(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function _randInt(lo, hi) {
    return Math.floor(lo + Math.random() * (hi - lo + 1));
  }

  function _removeMesh(mesh) {
    if (!mesh) { return; }
    if (mesh.parent) { mesh.parent.remove(mesh); }
    if (mesh.geometry) { mesh.geometry.dispose(); }
    if (mesh.material) { mesh.material.dispose(); }
  }

  function _mat(hex) {
    return new THREE.MeshLambertMaterial({ color: hex });
  }

  function _matEmit(hex, emHex, intensity) {
    var m = new THREE.MeshLambertMaterial({ color: hex });
    m.emissive = new THREE.Color(emHex);
    m.emissiveIntensity = intensity || 0.4;
    return m;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════════ */

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'fa-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#e8d88a',
      'font:bold 12px/1.4 monospace',
      'padding:6px 14px',
      'border:1px solid #886644',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'letter-spacing:0.05em'
    ].join(';');
    document.body.appendChild(_hudEl);

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'fa-overlay';
    _overlayEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,0.82)',
      'color:#e8d88a',
      'font:bold 16px/1.7 monospace',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'z-index:10000',
      'pointer-events:none',
      'text-align:center',
      'padding:40px'
    ].join(';');
    document.body.appendChild(_overlayEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    var militia_count = 0;
    var i;
    for (i = 0; i < _militia.length; i++) {
      if (_militia[i] && _militia[i].hp > 0) { militia_count++; }
    }
    for (i = 0; i < _snipers.length; i++) {
      if (_snipers[i] && _snipers[i].hp > 0) { militia_count++; }
    }
    for (i = 0; i < _bodyguards.length; i++) {
      if (_bodyguards[i] && _bodyguards[i].hp > 0) { militia_count++; }
    }
    var warlordStatus = _warlordDead ? 'DEAD' : 'ALIVE';
    var stealthStatus = _stealthOk ? 'YES' : 'COMPROMISED';
    var routeLabel = _chosenRoute > 0 ? _routeNames[_chosenRoute] : 'NONE';
    _hudEl.textContent = [
      'FORTRESS ASSAULT',
      '[ROUTE: ' + routeLabel + ']',
      '[MILITIA: ' + militia_count + ']',
      '[HOSTAGES: ' + _hostageFree + '/4]',
      '[WARLORD: ' + warlordStatus + ']',
      '| STEALTH: ' + stealthStatus,
      '| HP: ' + _playerHP,
      '| AMMO: ' + _playerAmmo + '/' + _playerAmmoRes,
      '| SCORE: ' + _score
    ].join('  ');
  }

  function _showOverlay(html) {
    if (!_overlayEl) { return; }
    _overlayEl.innerHTML = html;
    _overlayEl.style.display = 'flex';
  }

  function _hideOverlay() {
    if (!_overlayEl) { return; }
    _overlayEl.style.display = 'none';
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FORTRESS CONSTRUCTION
  ═══════════════════════════════════════════════════════════════════════════ */

  function _buildFortress() {
    _fortressGroup = new THREE.Group();
    _scene.add(_fortressGroup);

    /* ── Ground courtyard PlaneGeometry (0x554433) ── */
    var groundGeo = new THREE.PlaneGeometry(80, 80);
    var groundMesh = new THREE.Mesh(groundGeo, _mat(0x554433));
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0, 0);
    _fortressGroup.add(groundMesh);

    /* ── Outer terrain / approach ground ── */
    var outerGeo = new THREE.PlaneGeometry(200, 200);
    var outerMesh = new THREE.Mesh(outerGeo, _mat(0x3a3020));
    outerMesh.rotation.x = -Math.PI / 2;
    outerMesh.position.set(0, -0.05, 0);
    _fortressGroup.add(outerMesh);

    _buildWallsAndTowers();
    _buildGatehouse();
    _buildKeep();
    _buildBarracks();
    _buildDungeon();
    _buildLadders();
    _buildSewerTunnel();
    _buildBarrels();
    _buildMachineGunNests();
  }

  function _buildWallsAndTowers() {
    var wallMat = _mat(0x886644);

    /* Outer wall perimeter — 4 sides BoxGeometry 60x8x2 */
    var wallDefs = [
      { x: 0,    y: 4, z: -31, ry: 0 },
      { x: 0,    y: 4, z:  31, ry: 0 },
      { x: -31,  y: 4, z:   0, ry: Math.PI / 2 },
      { x:  31,  y: 4, z:   0, ry: Math.PI / 2 }
    ];
    var i;
    for (i = 0; i < wallDefs.length; i++) {
      var wd = wallDefs[i];
      var wg = new THREE.BoxGeometry(60, 8, 2);
      var wm = new THREE.Mesh(wg, wallMat);
      wm.position.set(wd.x, wd.y, wd.z);
      wm.rotation.y = wd.ry;
      _fortressGroup.add(wm);
      _outerWalls.push(wm);
    }

    /* 4 CylinderGeometry towers at corners (0x886644) */
    var towerCorners = [
      { x: -31, z: -31 },
      { x:  31, z: -31 },
      { x: -31, z:  31 },
      { x:  31, z:  31 }
    ];
    for (i = 0; i < towerCorners.length; i++) {
      var tc = towerCorners[i];
      var tg = new THREE.CylinderGeometry(3.5, 3.5, 12, 8);
      var tm = new THREE.Mesh(tg, wallMat);
      tm.position.set(tc.x, 6, tc.z);
      _fortressGroup.add(tm);
      _towers.push(tm);
    }
  }

  function _buildGatehouse() {
    _gateGroup = new THREE.Group();
    _fortressGroup.add(_gateGroup);

    /* Gatehouse BoxGeometry 8x10x6 (0x775533) */
    var ghMat = _mat(0x775533);
    var ghGeo = new THREE.BoxGeometry(8, 10, 6);
    var ghMesh = new THREE.Mesh(ghGeo, ghMat);
    ghMesh.position.set(0, 5, 31);
    _gateGroup.add(ghMesh);

    /* Steel door BoxGeometry (0x444444) */
    var doorGeo = new THREE.BoxGeometry(4, 7, 0.4);
    _mainGateMesh = new THREE.Mesh(doorGeo, _mat(0x444444));
    _mainGateMesh.position.set(0, 3.5, 31.2);
    _gateGroup.add(_mainGateMesh);

    /* Portcullis LineSegments */
    var portPts = [];
    var bi;
    for (bi = 0; bi < 5; bi++) {
      var px = -1.8 + bi * 0.9;
      portPts.push(px, 0.2, 31.15, px, 7, 31.15);
    }
    for (bi = 0; bi < 4; bi++) {
      var py = 1.5 + bi * 1.5;
      portPts.push(-1.8, py, 31.15, 1.8, py, 31.15);
    }
    var portBuf = new THREE.BufferGeometry();
    portBuf.setAttribute('position', new THREE.Float32BufferAttribute(portPts, 3));
    var portLineMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    _portcullisLines = new THREE.LineSegments(portBuf, portLineMat);
    _gateGroup.add(_portcullisLines);

    /* Portcullis chain LineSegments above gate */
    var chainPts = [0, 7.5, 31.15, 0, 10, 31.15];
    var chainBuf = new THREE.BufferGeometry();
    chainBuf.setAttribute('position', new THREE.Float32BufferAttribute(chainPts, 3));
    var chainMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
    _portcullisChain = new THREE.LineSegments(chainBuf, chainMat);
    _gateGroup.add(_portcullisChain);

    /* Portcullis lock BoxGeometry (0x888888) — shoot to open */
    var lockGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    _portcullisLock = new THREE.Mesh(lockGeo, _mat(0x888888));
    _portcullisLock.position.set(1.9, 4, 31.15);
    _portcullisLock.userData = { type: 'portcullis_lock', hp: 20 };
    _gateGroup.add(_portcullisLock);
  }

  function _buildKeep() {
    /* Keep tower BoxGeometry 12x20x12 (0x664422) */
    var keepMat = _mat(0x664422);
    var keepGeo = new THREE.BoxGeometry(12, 20, 12);
    _keep = new THREE.Mesh(keepGeo, keepMat);
    _keep.position.set(0, 10, -10);
    _fortressGroup.add(_keep);

    /* Keep top floor platform */
    var topGeo = new THREE.BoxGeometry(12, 0.5, 12);
    var topMesh = new THREE.Mesh(topGeo, _mat(0x553311));
    topMesh.position.set(0, 20.25, -10);
    _fortressGroup.add(topMesh);

    /* Keep interior stairs (BoxGeometry ledges) */
    var stairMat = _mat(0x553322);
    var si;
    for (si = 0; si < 5; si++) {
      var stairGeo = new THREE.BoxGeometry(3, 0.5, 1.2);
      var stairMesh = new THREE.Mesh(stairGeo, stairMat);
      stairMesh.position.set(-2, 2 + si * 3.5, -10 + 4 - si * 1.0);
      _fortressGroup.add(stairMesh);
    }
  }

  function _buildBarracks() {
    /* Barracks BoxGeometry 20x5x10 (0x665533) */
    var barMat = _mat(0x665533);
    var barGeo = new THREE.BoxGeometry(20, 5, 10);
    _barracks = new THREE.Mesh(barGeo, barMat);
    _barracks.position.set(15, 2.5, 5);
    _fortressGroup.add(_barracks);
  }

  function _buildDungeon() {
    _dungeonGroup = new THREE.Group();
    _fortressGroup.add(_dungeonGroup);

    /* Dungeon BoxGeometry 15x4x10 underground */
    var dungGeo = new THREE.BoxGeometry(15, 4, 10);
    var dungMesh = new THREE.Mesh(dungGeo, _mat(0x332211));
    dungMesh.position.set(-15, -2, -5);
    _dungeonGroup.add(dungMesh);

    /* Dungeon entrance ramp */
    var rampGeo = new THREE.BoxGeometry(3, 0.3, 8);
    var rampMesh = new THREE.Mesh(rampGeo, _mat(0x443322));
    rampMesh.position.set(-8.5, -0.5, -5);
    rampMesh.rotation.z = -0.18;
    _dungeonGroup.add(rampMesh);
  }

  function _buildLadders() {
    /* West wall rope-climb ledges — BoxGeometry ledge rungs */
    var ladderMat = _mat(0x886633);
    var li;
    for (li = 0; li < 4; li++) {
      var ledgeGeo = new THREE.BoxGeometry(1.5, 0.25, 0.25);
      var ledgeMesh = new THREE.Mesh(ledgeGeo, ladderMat);
      ledgeMesh.position.set(-31.5, 1.5 + li * 1.8, 0);
      _fortressGroup.add(ledgeMesh);
      _ladderMeshes.push(ledgeMesh);
    }

    /* Rope LineSegments on west wall */
    var ropePts = [-31.5, 0.5, 0, -31.5, 8.2, 0];
    var ropeBuf = new THREE.BufferGeometry();
    ropeBuf.setAttribute('position', new THREE.Float32BufferAttribute(ropePts, 3));
    var ropeMat = new THREE.LineBasicMaterial({ color: 0xaa8833 });
    var ropeLine = new THREE.LineSegments(ropeBuf, ropeMat);
    _fortressGroup.add(ropeLine);
    _ladderMeshes.push(ropeLine);
  }

  function _buildSewerTunnel() {
    /* East sewer CylinderGeometry tunnel 1.5 wide */
    var sewGeo = new THREE.CylinderGeometry(1.5, 1.5, 40, 8);
    _sewerTunnel = new THREE.Mesh(sewGeo, _mat(0x222215));
    _sewerTunnel.rotation.z = Math.PI / 2;
    _sewerTunnel.position.set(15, -1.5, 0);
    _fortressGroup.add(_sewerTunnel);

    /* Sewer grate at east entry */
    var grateGeo = new THREE.BoxGeometry(3, 3, 0.3);
    var grate = new THREE.Mesh(grateGeo, _mat(0x555555));
    grate.position.set(35, -1.5, 0);
    grate.rotation.y = Math.PI / 2;
    _fortressGroup.add(grate);

    /* Sewer point light — OFF (dark zone) */
    _sewerLight = new THREE.PointLight(0x334422, 0, 10);
    _sewerLight.position.set(15, 0, 0);
    _scene.add(_sewerLight);
  }

  function _buildBarrels() {
    /* Explosive barrels CylinderGeometry (0xFF4400) */
    var barrelDefs = [
      { x:  8,  z: 28 },
      { x: 12,  z: 28 },
      { x: 10,  z: 25 },
      { x: -8,  z: 20 },
      { x: -5,  z: 16 }
    ];
    var bi;
    for (bi = 0; bi < barrelDefs.length; bi++) {
      var bd = barrelDefs[bi];
      var bGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8);
      var bMesh = new THREE.Mesh(bGeo, _matEmit(0xFF4400, 0xFF2200, 0.3));
      bMesh.position.set(bd.x, 0.6, bd.z);
      _fortressGroup.add(bMesh);
      _barrels.push({ mesh: bMesh, hp: 1, exploded: false, x: bd.x, z: bd.z });
    }
  }

  function _buildMachineGunNests() {
    /* 2 machine gun nests at front gate flanks */
    var nestDefs = [{ x: -12, z: 26 }, { x: 12, z: 26 }];
    var ni;
    for (ni = 0; ni < nestDefs.length; ni++) {
      var nd = nestDefs[ni];
      var sandbagGeo = new THREE.BoxGeometry(3, 1, 1.5);
      var sandbag = new THREE.Mesh(sandbagGeo, _mat(0x887755));
      sandbag.position.set(nd.x, 0.5, nd.z);
      _fortressGroup.add(sandbag);
      var gunGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 6);
      var gun = new THREE.Mesh(gunGeo, _mat(0x333333));
      gun.rotation.x = Math.PI / 2;
      gun.position.set(nd.x, 1.2, nd.z - 0.8);
      _fortressGroup.add(gun);
      _machineGunNests.push({ x: nd.x, z: nd.z, gun: gun, hp: 50, fireTimer: 0 });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ENEMY SPAWNING
  ═══════════════════════════════════════════════════════════════════════════ */

  function _spawnMilitia(x, y, z, patrol, sleeping) {
    var geo = new THREE.BoxGeometry(0.7, 1.8, 0.7);
    var mesh = new THREE.Mesh(geo, _mat(0x664422));
    mesh.position.set(x, y + 0.9, z);
    _scene.add(mesh);
    var enemy = {
      mesh: mesh,
      hp: 80,
      maxHp: 80,
      x: x, y: y, z: z,
      patrol: patrol || [],
      patrolIdx: 0,
      patrolTimer: 0,
      alerted: false,
      sleeping: sleeping || false,
      fireTimer: _randBetween(1, 3),
      dead: false,
      type: 'militia'
    };
    return enemy;
  }

  function _spawnSniper(x, z, towerIdx) {
    var geo = new THREE.CylinderGeometry(0.3, 0.35, 1.7, 6);
    var mesh = new THREE.Mesh(geo, _mat(0x4a3322));
    mesh.position.set(x, 12.8, z);
    _scene.add(mesh);
    return {
      mesh: mesh,
      hp: 100,
      maxHp: 100,
      x: x, y: 12, z: z,
      fireTimer: _randBetween(3, 6),
      alerted: true,
      dead: false,
      type: 'sniper',
      towerIdx: towerIdx
    };
  }

  function _spawnWarlord() {
    var geo = new THREE.BoxGeometry(1.1, 2.2, 1.1);
    var mesh = new THREE.Mesh(geo, _matEmit(0x441111, 0x220000, 0.5));
    mesh.position.set(0, 21, -10);
    _scene.add(mesh);
    _warlord = {
      mesh: mesh,
      hp: 400,
      maxHp: 400,
      x: 0, y: 20, z: -10,
      fireTimer: 1.5,
      alerted: true,
      dead: false,
      type: 'warlord'
    };

    /* 2 bodyguards flanking warlord */
    var bgDefs = [{ x: -2, z: -10 }, { x: 2, z: -10 }];
    var bi;
    for (bi = 0; bi < bgDefs.length; bi++) {
      var bgGeo = new THREE.BoxGeometry(0.8, 1.9, 0.8);
      var bgMesh = new THREE.Mesh(bgGeo, _mat(0x553322));
      bgMesh.position.set(bgDefs[bi].x, 21, bgDefs[bi].z);
      _scene.add(bgMesh);
      _bodyguards.push({
        mesh: bgMesh,
        hp: 100,
        maxHp: 100,
        x: bgDefs[bi].x, y: 20, z: bgDefs[bi].z,
        fireTimer: _randBetween(1, 2),
        alerted: true,
        dead: false,
        type: 'bodyguard'
      });
    }
  }

  function _spawnHostages() {
    var hDefs = [
      { x: -18, z: -6 },
      { x: -16, z: -4 },
      { x: -14, z: -6 },
      { x: -12, z: -4 }
    ];
    var hi;
    for (hi = 0; hi < hDefs.length; hi++) {
      var hd = hDefs[hi];
      var hGeo = new THREE.BoxGeometry(0.6, 1.5, 0.6);
      var hMesh = new THREE.Mesh(hGeo, _mat(0xddbb88));
      hMesh.position.set(hd.x, -1.25, hd.z);
      _scene.add(hMesh);
      _hostages.push({ mesh: hMesh, x: hd.x, z: hd.z, freed: false });
    }
  }

  function _spawnRats() {
    var rDefs = [{ x: 20, z: 2 }, { x: 25, z: -2 }];
    var ri;
    for (ri = 0; ri < rDefs.length; ri++) {
      var rd = rDefs[ri];
      var rGeo = new THREE.BoxGeometry(0.3, 0.2, 0.5);
      var rMesh = new THREE.Mesh(rGeo, _mat(0x553322));
      rMesh.position.set(rd.x, -1.3, rd.z);
      _scene.add(rMesh);
      _rats.push({ mesh: rMesh, x: rd.x, z: rd.z, timer: 0, dir: _randBetween(0, Math.PI * 2) });
    }
  }

  function _spawnAllEnemies() {
    var i;

    /* Front gate guards — 12 militia */
    var frontPatrolPts = [
      [{ x: -10, z: 35 }, { x: 10, z: 35 }],
      [{ x: -5,  z: 32 }, { x:  5, z: 32 }],
      [{ x: 0,   z: 38 }, { x: 8,  z: 38 }],
      [{ x: -8,  z: 38 }, { x: 0,  z: 38 }]
    ];
    for (i = 0; i < 12; i++) {
      var patrol = frontPatrolPts[i % frontPatrolPts.length];
      var fx = _randBetween(-14, 14);
      var fz = _randBetween(32, 40);
      var m = _spawnMilitia(fx, 0, fz, patrol, false);
      _militia.push(m);
    }

    /* West wall guards — 3 */
    for (i = 0; i < 3; i++) {
      var wx = -31 + _randBetween(-1, 1);
      var wz = _randBetween(-10, 10);
      var wm = _spawnMilitia(wx, 8, wz, [{ x: wx, z: -10 }, { x: wx, z: 10 }], false);
      _militia.push(wm);
    }

    /* East sewer — 1 guard at exit */
    var sm = _spawnMilitia(-4, 0, 0, [{ x: -4, z: 2 }, { x: -4, z: -2 }], false);
    _militia.push(sm);

    /* Courtyard — 3 guards */
    for (i = 0; i < 3; i++) {
      var cy = _spawnMilitia(_randBetween(-10, 10), 0, _randBetween(-15, 0), [], false);
      _militia.push(cy);
      _courtyardGuards.push(cy);
    }

    /* Barracks — 8 sleeping guards */
    for (i = 0; i < 8; i++) {
      var bx = 8 + _randBetween(0, 10);
      var bz = _randBetween(-3, 3);
      var bg = _spawnMilitia(bx, 0, bz, [], true);
      _militia.push(bg);
      _barracksGuards.push(bg);
    }

    /* 4 snipers in towers */
    var sniperPos = [
      { x: -31, z: -31 },
      { x:  31, z: -31 },
      { x: -31, z:  31 },
      { x:  31, z:  31 }
    ];
    for (i = 0; i < 4; i++) {
      var sp = sniperPos[i];
      _snipers.push(_spawnSniper(sp.x, sp.z, i));
    }

    /* Warlord + bodyguards */
    _spawnWarlord();

    /* Hostages */
    _spawnHostages();

    /* Rats in sewer */
    _spawnRats();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PLAYER SETUP
  ═══════════════════════════════════════════════════════════════════════════ */

  function _setupPlayer() {
    _playerPos = new THREE.Vector3(0, 1.7, 55);
    _playerVel = new THREE.Vector3(0, 0, 0);
    _playerHP  = 100;
    _playerAmmo = 30;
    _playerAmmoRes = 120;
    _playerYaw   = Math.PI; // facing into fortress
    _playerPitch = 0;

    if (_camera) {
      _camera.position.copy(_playerPos);
      _camera.rotation.order = 'YXZ';
      _camera.rotation.y = _playerYaw;
      _camera.rotation.x = _playerPitch;
    }
  }

  function _teleportToRoute(route) {
    _chosenRoute = route;
    if (route === 1) {
      /* Front gate */
      _playerPos.set(0, 1.7, 50);
      _playerYaw = Math.PI;
    } else if (route === 2) {
      /* West wall — start at grapple point */
      _playerPos.set(-38, 1.7, 0);
      _playerYaw = Math.PI / 2;
    } else if (route === 3) {
      /* East sewer — outside east wall */
      _playerPos.set(42, -1.3, 0);
      _playerYaw = -Math.PI / 2;
      _sewerEntered = true;
    }
    _hideOverlay();
    _phase = 'combat';
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SHOOTING
  ═══════════════════════════════════════════════════════════════════════════ */

  function _fireBullet() {
    if (_playerAmmo <= 0) { return; }
    _playerAmmo--;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_playerPitch, _playerYaw, 0, 'YXZ'));

    var bGeo = new THREE.SphereGeometry(0.05, 4, 4);
    var bMesh = new THREE.Mesh(bGeo, _matEmit(0xffee44, 0xffaa00, 1));
    bMesh.position.copy(_playerPos);
    bMesh.position.y -= 0.1;
    _scene.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      vel: new THREE.Vector3(dir.x * 60, dir.y * 60, dir.z * 60),
      life: 2.0
    });
  }

  function _fireEnemyBullet(ex, ey, ez) {
    var dir = new THREE.Vector3(
      _playerPos.x - ex,
      _playerPos.y - ey,
      _playerPos.z - ez
    );
    _norm3(dir);

    var bGeo = new THREE.SphereGeometry(0.06, 4, 4);
    var bMesh = new THREE.Mesh(bGeo, _matEmit(0xff3300, 0xff1100, 1));
    bMesh.position.set(ex, ey, ez);
    _scene.add(bMesh);

    _enemyBullets.push({
      mesh: bMesh,
      vel: new THREE.Vector3(dir.x * 30, dir.y * 30, dir.z * 30),
      life: 3.0
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     EXPLOSION
  ═══════════════════════════════════════════════════════════════════════════ */

  function _explodeAt(x, y, z, radius, dmg) {
    /* Flash light */
    if (_explosionLight) {
      _explosionLight.position.set(x, y, z);
      _explosionLight.intensity = 8;
    }

    /* Spawn debris SphereGeometry particles */
    var pi;
    for (pi = 0; pi < 10; pi++) {
      var dGeo = new THREE.SphereGeometry(0.15, 4, 4);
      var dMesh = new THREE.Mesh(dGeo, _matEmit(0xff6600, 0xff2200, 1));
      dMesh.position.set(
        x + _randBetween(-1.5, 1.5),
        y + _randBetween(0, 2),
        z + _randBetween(-1.5, 1.5)
      );
      _scene.add(dMesh);
      _bullets.push({
        mesh: dMesh,
        vel: new THREE.Vector3(_randBetween(-5, 5), _randBetween(3, 8), _randBetween(-5, 5)),
        life: 0.8,
        debris: true
      });
    }

    /* Damage player */
    var pd = _dist2(x, z, _playerPos.x, _playerPos.z);
    if (pd < radius) {
      var pDmg = Math.floor(dmg * (1 - pd / radius));
      _playerHP -= pDmg;
      if (_playerHP < 0) { _playerHP = 0; }
    }

    /* Damage militia */
    var ei;
    for (ei = 0; ei < _militia.length; ei++) {
      var em = _militia[ei];
      if (em.dead) { continue; }
      var ed = _dist2(x, z, em.x, em.z);
      if (ed < radius) {
        em.hp -= Math.floor(dmg * (1 - ed / radius));
        em.alerted = true;
        if (em.hp <= 0) { _killEnemy(em); }
      }
    }

    /* Chain barrel explosions within 4u */
    var bi;
    for (bi = 0; bi < _barrels.length; bi++) {
      var barrel = _barrels[bi];
      if (barrel.exploded) { continue; }
      var bd2 = _dist2(x, z, barrel.x, barrel.z);
      if (bd2 < 4) {
        barrel.exploded = true;
        _removeMesh(barrel.mesh);
        _score += 50;
        /* Defer chain explosion slightly to feel like chain */
        (function (bx, bz) {
          _barrelChainPending.push({ x: bx, z: bz, timer: 0.15 });
        }(barrel.x, barrel.z));
      }
    }

    _stealthOk = false;
  }

  var _barrelChainPending = [];

  function _killEnemy(enemy) {
    if (enemy.dead) { return; }
    enemy.dead = true;
    enemy.hp = 0;
    _removeMesh(enemy.mesh);
    _score += (enemy.type === 'warlord') ? 1000 : (enemy.type === 'sniper' ? 200 : 100);
    if (enemy.type === 'warlord') {
      _warlordDead = true;
      _triggerWin();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     WIN / DEATH
  ═══════════════════════════════════════════════════════════════════════════ */

  function _triggerWin() {
    _phase = 'win';
    var finalScore = _score;
    if (_stealthOk) { finalScore *= 2; }
    if (_hostageFree >= 4) { finalScore += 2000; }
    _showOverlay(
      '<div style="font-size:22px;color:#ffee44;margin-bottom:16px">FORTRESS SECURED</div>' +
      '<div>WARLORD ELIMINATED</div>' +
      '<div>HOSTAGES FREED: ' + _hostageFree + '/4</div>' +
      '<div>STEALTH: ' + (_stealthOk ? 'MAINTAINED (×2 SCORE)' : 'COMPROMISED') + '</div>' +
      '<div style="margin-top:12px;font-size:18px;color:#ffcc44">FINAL SCORE: ' + finalScore + '</div>' +
      '<div style="margin-top:20px;font-size:11px;color:#aaa">Press F+A to play again</div>'
    );
  }

  function _triggerDeath() {
    _phase = 'dead';
    _showOverlay(
      '<div style="font-size:22px;color:#ff4422;margin-bottom:16px">OPERATOR DOWN</div>' +
      '<div>Mission failed. The fortress holds.</div>' +
      '<div style="margin-top:12px">Score: ' + _score + '</div>' +
      '<div style="margin-top:20px;font-size:11px;color:#aaa">Press F+A to retry</div>'
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PORTCULLIS / GATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _openPortcullis() {
    if (_portcullisOpen) { return; }
    _portcullisOpen = true;
    if (_portcullisLines) {
      _portcullisLines.position.y = 8;
    }
    if (_portcullisChain) {
      _removeMesh(_portcullisChain);
      _portcullisChain = null;
    }
    _score += 150;
  }

  function _blowMainGate() {
    if (_mainGateDestroyed) { return; }
    _mainGateDestroyed = true;
    _removeMesh(_mainGateMesh);
    _mainGateMesh = null;
    _explodeAt(0, 3.5, 31.2, 6, 60);
    _score += 200;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HOSTAGES
  ═══════════════════════════════════════════════════════════════════════════ */

  function _tryFreeHostage() {
    var hi;
    for (hi = 0; hi < _hostages.length; hi++) {
      var h = _hostages[hi];
      if (h.freed) { continue; }
      var hd = _dist3(_playerPos, new THREE.Vector3(h.x, -1.25, h.z));
      if (hd < 3.5) {
        h.freed = true;
        _hostageFree++;
        _score += 300;
        /* Freed hostage acts as distraction */
        h.mesh.material = _mat(0xffcc88);
        _hostageDistract.push({ mesh: h.mesh, x: h.x, z: h.z, timer: 0 });

        /* 2 closest alerted guards chase this hostage */
        var chaseCount = 0;
        var gi;
        for (gi = 0; gi < _militia.length && chaseCount < 2; gi++) {
          var gm = _militia[gi];
          if (!gm.dead && gm.alerted) {
            gm.patrol = [{ x: h.x + _randBetween(-3, 3), z: h.z + _randBetween(-3, 3) }];
            gm.patrolIdx = 0;
            chaseCount++;
          }
        }
        return;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     INTERACT (E KEY)
  ═══════════════════════════════════════════════════════════════════════════ */

  function _onInteract() {
    /* Free hostage if near dungeon */
    _tryFreeHostage();

    /* West wall rope climb */
    if (_chosenRoute === 2 && !_onLadder) {
      var wpd = _dist2(_playerPos.x, _playerPos.z, -31.5, 0);
      if (wpd < 4 && _playerPos.y < 9) {
        _onLadder = true;
        _climbProgress++;
        if (_climbProgress >= _climbTotal) {
          _onLadder = false;
          _playerPos.set(-28, 9.5, 0);
          _score += 100;
        } else {
          _playerPos.y = 1.7 + _climbProgress * 1.8;
        }
      }
    }

    /* C4 plant near main gate */
    if (!_c4Placed && _dist2(_playerPos.x, _playerPos.z, 0, 31.2) < 3.5 && !_mainGateDestroyed) {
      _c4Placed = true;
      var c4Geo = new THREE.BoxGeometry(0.4, 0.25, 0.15);
      _c4Mesh = new THREE.Mesh(c4Geo, _matEmit(0x22aa22, 0x00ff00, 0.8));
      _c4Mesh.position.set(0, 1.2, 31.0);
      _scene.add(_c4Mesh);
    }

    /* East sewer — crawl through */
    if (_chosenRoute === 3 && _sewerEntered) {
      if (_playerPos.x > 0) {
        _playerPos.x -= 5;
      }
    }
  }

  function _onArmC4() {
    if (_c4Placed && !_c4Arming && !_mainGateDestroyed) {
      _c4Arming = true;
      _c4ArmTimer = 0;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ENEMY AI UPDATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateEnemy(enemy, dt) {
    if (enemy.dead) { return; }

    var distToPlayer = _dist3(
      new THREE.Vector3(enemy.x, enemy.y, enemy.z),
      _playerPos
    );

    /* Alert radius */
    if (!enemy.sleeping && distToPlayer < 20 && !enemy.alerted) {
      enemy.alerted = true;
      if (enemy.type === 'militia' && _barracksGuards.indexOf(enemy) >= 0) {
        _barracksAlerted = true;
        _stealthOk = false;
      }
    }

    /* Wake sleeping guards if loud event occurred */
    if (enemy.sleeping && !_stealthOk) {
      enemy.sleeping = false;
      enemy.alerted = true;
    }

    if (enemy.alerted && !enemy.sleeping) {
      /* Move toward player if out of effective range */
      if (distToPlayer > 15) {
        var dx = _playerPos.x - enemy.x;
        var dz = _playerPos.z - enemy.z;
        var dl = Math.sqrt(dx * dx + dz * dz) || 1;
        enemy.x += (dx / dl) * 3.5 * dt;
        enemy.z += (dz / dl) * 3.5 * dt;
        if (enemy.mesh) {
          enemy.mesh.position.set(enemy.x, enemy.y + 0.9, enemy.z);
        }
      }

      /* Fire at player */
      if (distToPlayer < 35) {
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0) {
          enemy.fireTimer = (enemy.type === 'sniper') ? _randBetween(4, 8) : _randBetween(1.5, 3);
          _fireEnemyBullet(enemy.x, enemy.y + 1.2, enemy.z);
        }
      }
    } else if (!enemy.sleeping && enemy.patrol && enemy.patrol.length > 0) {
      /* Patrol */
      var pt = enemy.patrol[enemy.patrolIdx % enemy.patrol.length];
      var pDx = pt.x - enemy.x;
      var pDz = pt.z - enemy.z;
      var pDl = Math.sqrt(pDx * pDx + pDz * pDz) || 1;
      if (pDl > 0.5) {
        enemy.x += (pDx / pDl) * 2.5 * dt;
        enemy.z += (pDz / pDl) * 2.5 * dt;
        if (enemy.mesh) {
          enemy.mesh.position.set(enemy.x, enemy.y + 0.9, enemy.z);
          enemy.mesh.rotation.y = Math.atan2(pDx, pDz);
        }
      } else {
        enemy.patrolIdx = (enemy.patrolIdx + 1) % enemy.patrol.length;
      }
    }
  }

  function _updateMachineGuns(dt) {
    var mi;
    for (mi = 0; mi < _machineGunNests.length; mi++) {
      var nest = _machineGunNests[mi];
      if (nest.hp <= 0) { continue; }
      var distP = _dist2(_playerPos.x, _playerPos.z, nest.x, nest.z);
      if (distP < 50) {
        nest.fireTimer -= dt;
        if (nest.fireTimer <= 0) {
          nest.fireTimer = 0.25;
          _fireEnemyBullet(nest.x, 1.2, nest.z);
          _stealthOk = false;
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     BULLET UPDATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateBullets(dt) {
    var bi;
    for (bi = _bullets.length - 1; bi >= 0; bi--) {
      var b = _bullets[bi];
      b.life -= dt;
      if (b.life <= 0) {
        _removeMesh(b.mesh);
        _bullets.splice(bi, 1);
        continue;
      }
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;
      if (b.debris) {
        b.vel.y -= 9.8 * dt;
        continue;
      }

      var bx = b.mesh.position.x;
      var by = b.mesh.position.y;
      var bz = b.mesh.position.z;

      /* Check hit on militia */
      var ei;
      for (ei = 0; ei < _militia.length; ei++) {
        var em = _militia[ei];
        if (em.dead) { continue; }
        var eDist = _dist2(bx, bz, em.x, em.z);
        if (eDist < 0.9 && Math.abs(by - em.y - 1) < 1.5) {
          em.hp -= 35;
          em.alerted = true;
          _stealthOk = false;
          if (_barracksGuards.indexOf(em) >= 0) { _barracksAlerted = true; }
          if (em.hp <= 0) { _killEnemy(em); }
          _score += 10;
          _removeMesh(b.mesh);
          _bullets.splice(bi, 1);
          break;
        }
      }
      if (bi >= _bullets.length) { continue; }

      /* Snipers */
      for (ei = 0; ei < _snipers.length; ei++) {
        var sn = _snipers[ei];
        if (sn.dead) { continue; }
        var sDist = _dist2(bx, bz, sn.x, sn.z);
        if (sDist < 1.2 && Math.abs(by - 13) < 1.5) {
          sn.hp -= 35;
          if (sn.hp <= 0) { _killEnemy(sn); }
          _score += 20;
          _removeMesh(b.mesh);
          _bullets.splice(bi, 1);
          break;
        }
      }
      if (bi >= _bullets.length) { continue; }

      /* Bodyguards */
      for (ei = 0; ei < _bodyguards.length; ei++) {
        var bg = _bodyguards[ei];
        if (bg.dead) { continue; }
        var bgDist = _dist2(bx, bz, bg.x, bg.z);
        if (bgDist < 1.0 && Math.abs(by - bg.y - 1) < 1.5) {
          bg.hp -= 35;
          if (bg.hp <= 0) { _killEnemy(bg); }
          _score += 15;
          _removeMesh(b.mesh);
          _bullets.splice(bi, 1);
          break;
        }
      }
      if (bi >= _bullets.length) { continue; }

      /* Warlord */
      if (_warlord && !_warlord.dead) {
        var wDist = _dist2(bx, bz, _warlord.x, _warlord.z);
        if (wDist < 1.2 && Math.abs(by - 21) < 2) {
          _warlord.hp -= 35;
          if (_warlord.hp <= 0) { _killEnemy(_warlord); }
          _removeMesh(b.mesh);
          _bullets.splice(bi, 1);
          continue;
        }
      }

      /* Machine gun nests */
      var mi2;
      for (mi2 = 0; mi2 < _machineGunNests.length; mi2++) {
        var nest = _machineGunNests[mi2];
        if (nest.hp <= 0) { continue; }
        var nDist = _dist2(bx, bz, nest.x, nest.z);
        if (nDist < 2 && by < 2.5) {
          nest.hp -= 35;
          _score += 50;
          _removeMesh(b.mesh);
          _bullets.splice(bi, 1);
          break;
        }
      }
      if (bi >= _bullets.length) { continue; }

      /* Portcullis lock */
      if (_portcullisLock && !_portcullisOpen) {
        var lDist = _dist3(b.mesh.position, _portcullisLock.position);
        if (lDist < 0.5) {
          _portcullisLockHP -= 35;
          if (_portcullisLockHP <= 0) {
            _removeMesh(_portcullisLock);
            _portcullisLock = null;
            _openPortcullis();
          }
          _removeMesh(b.mesh);
          _bullets.splice(bi, 1);
          continue;
        }
      }

      /* Barrels */
      var bbi;
      for (bbi = 0; bbi < _barrels.length; bbi++) {
        var bar = _barrels[bbi];
        if (bar.exploded) { continue; }
        var barDist = _dist2(bx, bz, bar.x, bar.z);
        if (barDist < 0.8 && by < 1.5) {
          bar.exploded = true;
          _removeMesh(bar.mesh);
          _explodeAt(bar.x, 0.6, bar.z, 6, 80);
          _removeMesh(b.mesh);
          _bullets.splice(bi, 1);
          break;
        }
      }
    }
  }

  function _updateEnemyBullets(dt) {
    var bi;
    for (bi = _enemyBullets.length - 1; bi >= 0; bi--) {
      var b = _enemyBullets[bi];
      b.life -= dt;
      if (b.life <= 0) {
        _removeMesh(b.mesh);
        _enemyBullets.splice(bi, 1);
        continue;
      }
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;

      var bx = b.mesh.position.x;
      var by = b.mesh.position.y;
      var bz = b.mesh.position.z;
      var pd = _dist3(b.mesh.position, _playerPos);
      if (pd < 0.7) {
        _playerHP -= 12;
        if (_playerHP <= 0) {
          _playerHP = 0;
          _triggerDeath();
        }
        _removeMesh(b.mesh);
        _enemyBullets.splice(bi, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updatePlayerMovement(dt) {
    var speed = _playerSpeed;
    if (_crouching) { speed *= 0.45; }

    var forward = new THREE.Vector3(
      -Math.sin(_playerYaw),
      0,
      -Math.cos(_playerYaw)
    );
    var right = new THREE.Vector3(
      Math.cos(_playerYaw),
      0,
      -Math.sin(_playerYaw)
    );

    var moved = false;
    if (_keys.w) {
      _playerPos.x += forward.x * speed * dt;
      _playerPos.z += forward.z * speed * dt;
      moved = true;
    }
    if (_keys.s) {
      _playerPos.x -= forward.x * speed * dt;
      _playerPos.z -= forward.z * speed * dt;
      moved = true;
    }
    if (_keys.a) {
      _playerPos.x -= right.x * speed * dt;
      _playerPos.z -= right.z * speed * dt;
      moved = true;
    }
    if (_keys.d) {
      _playerPos.x += right.x * speed * dt;
      _playerPos.z += right.z * speed * dt;
      moved = true;
    }

    /* Sewer crawl — auto-height adjust */
    if (_sewerEntered && _playerPos.x > 0 && _playerPos.x < 35) {
      _playerPos.y = -0.1;
      _crouching = true;
    } else if (!_keys.c) {
      _crouching = false;
      if (_playerPos.y < 1.7 && !_sewerEntered) {
        _playerPos.y = 1.7;
      }
    }

    /* Floor clamp */
    if (_playerPos.y < -1.7 && !_sewerEntered) {
      _playerPos.y = 1.7;
    }
    if (_playerPos.y < -1.7 && _sewerEntered && _playerPos.x < 0) {
      _playerPos.y = 1.7;
      _sewerEntered = false;
    }

    /* Update camera */
    if (_camera) {
      _camera.position.copy(_playerPos);
      _camera.rotation.y = _playerYaw;
      _camera.rotation.x = _playerPitch;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     CLIMBING (WEST WALL)
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateClimb(dt) {
    /* Auto-ascend when adjacent to wall and pressing W */
    if (_chosenRoute === 2 && !_onLadder) {
      var wdist = _dist2(_playerPos.x, _playerPos.z, -31.5, 0);
      if (wdist < 4 && _keys.w && _playerPos.y < 9) {
        _playerPos.y += 4 * dt;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     C4 TIMER
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateC4(dt) {
    if (!_c4Arming) { return; }
    _c4ArmTimer += dt;
    if (_c4ArmTimer >= C4_ARM_TIME) {
      _c4Arming = false;
      _c4Placed = false;
      _blowMainGate();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     BARREL CHAIN DEFERRED
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateBarrelChains(dt) {
    var ci;
    for (ci = _barrelChainPending.length - 1; ci >= 0; ci--) {
      var bc = _barrelChainPending[ci];
      bc.timer -= dt;
      if (bc.timer <= 0) {
        _explodeAt(bc.x, 0.6, bc.z, 6, 80);
        _barrelChainPending.splice(ci, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RAT UPDATE (non-hostile wander)
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateRats(dt) {
    var ri;
    for (ri = 0; ri < _rats.length; ri++) {
      var rat = _rats[ri];
      rat.timer -= dt;
      if (rat.timer <= 0) {
        rat.timer = _randBetween(1.5, 4);
        rat.dir = _randBetween(0, Math.PI * 2);
      }
      rat.x += Math.sin(rat.dir) * 1.5 * dt;
      rat.z += Math.cos(rat.dir) * 1.5 * dt;
      rat.x = Math.max(-29, Math.min(35, rat.x));
      rat.z = Math.max(-5, Math.min(5, rat.z));
      if (rat.mesh) {
        rat.mesh.position.set(rat.x, -1.3, rat.z);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     EXPLOSION LIGHT FADE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateExplosionLight(dt) {
    if (_explosionLight && _explosionLight.intensity > 0) {
      _explosionLight.intensity -= 18 * dt;
      if (_explosionLight.intensity < 0) { _explosionLight.intensity = 0; }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     WAVE 2 CHECK
  ═══════════════════════════════════════════════════════════════════════════ */

  function _checkWave2Skip() {
    if (_wave2Skipped) { return; }
    if (!_barracksAlerted && _phase === 'combat') {
      /* Stealth bonus — barracks guards never alerted */
      _wave2Skipped = true;
      _stealthOk = true;
      _score += 500;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RELOAD
  ═══════════════════════════════════════════════════════════════════════════ */

  function _reload() {
    var need = 30 - _playerAmmo;
    var take = Math.min(need, _playerAmmoRes);
    _playerAmmo += take;
    _playerAmmoRes -= take;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ═══════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    var k = e.key.toLowerCase();

    /* Activation: F + A */
    if (k === 'f') {
      _fPressed = true;
      _fTime = performance.now();
      if (_aPressed && (_fTime - _aTime) < ACTIVATION_WINDOW) {
        _onActivate();
      }
    }
    if (k === 'a' && !_active) {
      _aPressed = true;
      _aTime = performance.now();
      if (_fPressed && (_aTime - _fTime) < ACTIVATION_WINDOW) {
        _onActivate();
      }
    }

    if (!_active) { return; }

    /* Route selection */
    if (_phase === 'route_select') {
      if (k === '1') { _teleportToRoute(1); return; }
      if (k === '2') { _teleportToRoute(2); return; }
      if (k === '3') { _teleportToRoute(3); return; }
    }

    if (_phase !== 'combat') {
      /* Allow re-activation from win/dead */
      return;
    }

    if (k === 'w') { _keys.w = true; }
    if (k === 's') { _keys.s = true; }
    if (k === 'd') { _keys.d = true; }
    if (k === 'c') { _keys.c = true; _crouching = true; }
    if (k === 'r') { _rThisFrame = true; }
    if (k === 'e') { _eThisFrame = true; }
    if (k === 'f') { _keys.f = true; _onArmC4(); }

    /* 'a' in-game movement after activation */
    if (k === 'a') { _keys.a = true; }
  }

  function _onKeyUp(e) {
    var k = e.key.toLowerCase();
    if (k === 'f') { _fPressed = false; _keys.f = false; }
    if (k === 'a') { _aPressed = false; _keys.a = false; }
    if (!_active) { return; }
    if (k === 'w') { _keys.w = false; }
    if (k === 's') { _keys.s = false; }
    if (k === 'd') { _keys.d = false; }
    if (k === 'c') { _keys.c = false; _crouching = false; }
  }

  function _onMouseMove(e) {
    if (!_active || _phase !== 'combat') { return; }
    var sens = 0.002;
    _playerYaw   -= e.movementX * sens;
    _playerPitch -= e.movementY * sens;
    _playerPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _playerPitch));
  }

  function _onMouseDown(e) {
    if (!_active || _phase !== 'combat') { return; }
    if (e.button === 0) { _fireThisFrame = true; }
  }

  function _onActivate() {
    if (_active) {
      /* Re-activate from win/dead = reset */
      if (_phase === 'win' || _phase === 'dead') {
        _doReset();
        return;
      }
      return;
    }
    _active = true;
    _fPressed = false;
    _aPressed = false;
    _phase = 'route_select';
    _showOverlay(
      '<div style="font-size:20px;color:#ffee44;margin-bottom:20px">FORTRESS ASSAULT</div>' +
      '<div style="margin-bottom:16px">SPEC-OPS TEAM READY — CHOOSE APPROACH ROUTE:</div>' +
      '<div style="margin-bottom:8px">' +
      '<span style="color:#ff9944">[1]</span> FRONT GATE — 12 guards, 2 MG nests, C4/portcullis breachable (HARD)</div>' +
      '<div style="margin-bottom:8px">' +
      '<span style="color:#44cc44">[2]</span> WEST WALL — Rope climb (press E×4), 3 wall guards (MEDIUM)</div>' +
      '<div style="margin-bottom:8px">' +
      '<span style="color:#44aaff">[3]</span> EAST SEWER — Crawl through, dark, 2 rats, 1 guard at exit (STEALTH)</div>'
    );
    _buildScene();
    _requestPointerLock();
  }

  function _requestPointerLock() {
    if (_canvas) {
      _canvas.requestPointerLock =
        _canvas.requestPointerLock ||
        _canvas.mozRequestPointerLock ||
        _canvas.webkitRequestPointerLock;
      if (_canvas.requestPointerLock) {
        _canvas.requestPointerLock();
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SCENE SETUP
  ═══════════════════════════════════════════════════════════════════════════ */

  function _buildScene() {
    if (!_scene) { return; }

    /* Lights */
    _ambientLight = new THREE.AmbientLight(0x443322, 0.6);
    _scene.add(_ambientLight);

    _sunLight = new THREE.DirectionalLight(0xffeedd, 0.9);
    _sunLight.position.set(30, 60, 20);
    _scene.add(_sunLight);

    _explosionLight = new THREE.PointLight(0xff6600, 0, 20);
    _scene.add(_explosionLight);

    /* Fog for atmosphere */
    _scene.fog = new THREE.Fog(0x1a1008, 40, 120);

    /* Build fortress */
    _buildFortress();

    /* Spawn all enemies */
    _spawnAllEnemies();

    /* Setup player */
    _setupPlayer();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     MAIN UPDATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _doUpdate(dt) {
    _totalTime += dt;

    if (_phase !== 'combat') {
      _updateHUD();
      return;
    }

    /* One-shot frame inputs */
    if (_fireThisFrame) {
      _fireBullet();
      _fireThisFrame = false;
    }
    if (_eThisFrame) {
      _onInteract();
      _eThisFrame = false;
    }
    if (_rThisFrame) {
      _reload();
      _rThisFrame = false;
    }

    /* C4 */
    _updateC4(dt);

    /* Player movement */
    _updatePlayerMovement(dt);
    _updateClimb(dt);

    /* Enemy updates */
    var ei;
    for (ei = 0; ei < _militia.length; ei++) {
      _updateEnemy(_militia[ei], dt);
    }
    for (ei = 0; ei < _snipers.length; ei++) {
      _updateEnemy(_snipers[ei], dt);
    }
    for (ei = 0; ei < _bodyguards.length; ei++) {
      _updateEnemy(_bodyguards[ei], dt);
    }
    if (_warlord && !_warlord.dead) {
      _updateEnemy(_warlord, dt);
    }

    _updateMachineGuns(dt);

    /* Bullets */
    _updateBullets(dt);
    _updateEnemyBullets(dt);

    /* Barrel chains */
    _updateBarrelChains(dt);

    /* Rats */
    _updateRats(dt);

    /* Explosion light fade */
    _updateExplosionLight(dt);

    /* Wave 2 stealth skip check */
    _checkWave2Skip();

    /* Death check */
    if (_playerHP <= 0 && _phase === 'combat') {
      _triggerDeath();
    }

    /* HUD */
    _updateHUD();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     CLEANUP
  ═══════════════════════════════════════════════════════════════════════════ */

  function _clearScene() {
    var i;

    for (i = 0; i < _militia.length; i++) {
      _removeMesh(_militia[i].mesh);
    }
    _militia = [];

    for (i = 0; i < _snipers.length; i++) {
      _removeMesh(_snipers[i].mesh);
    }
    _snipers = [];

    for (i = 0; i < _bodyguards.length; i++) {
      _removeMesh(_bodyguards[i].mesh);
    }
    _bodyguards = [];

    if (_warlord) { _removeMesh(_warlord.mesh); _warlord = null; }

    for (i = 0; i < _hostages.length; i++) {
      _removeMesh(_hostages[i].mesh);
    }
    _hostages = [];

    for (i = 0; i < _rats.length; i++) {
      _removeMesh(_rats[i].mesh);
    }
    _rats = [];

    for (i = 0; i < _bullets.length; i++) {
      _removeMesh(_bullets[i].mesh);
    }
    _bullets = [];

    for (i = 0; i < _enemyBullets.length; i++) {
      _removeMesh(_enemyBullets[i].mesh);
    }
    _enemyBullets = [];

    if (_c4Mesh) { _removeMesh(_c4Mesh); _c4Mesh = null; }

    if (_fortressGroup) {
      _scene.remove(_fortressGroup);
      _fortressGroup = null;
    }

    if (_ambientLight) { _scene.remove(_ambientLight); _ambientLight = null; }
    if (_sunLight) { _scene.remove(_sunLight); _sunLight = null; }
    if (_sewerLight) { _scene.remove(_sewerLight); _sewerLight = null; }
    if (_explosionLight) { _scene.remove(_explosionLight); _explosionLight = null; }

    _scene.fog = null;

    _outerWalls       = [];
    _towers           = [];
    _barrels          = [];
    _machineGunNests  = [];
    _ladderMeshes     = [];
    _barracksGuards   = [];
    _courtyardGuards  = [];
    _hostageDistract  = [];
    _barrelChainPending = [];
    _mainGateMesh     = null;
    _mainGateDestroyed = false;
    _portcullisLines  = null;
    _portcullisChain  = null;
    _portcullisLock   = null;
    _portcullisOpen   = false;
    _portcullisLockHP = 20;
    _keep             = null;
    _barracks         = null;
    _gateGroup        = null;
    _dungeonGroup     = null;
    _sewerTunnel      = null;
  }

  function _doReset() {
    _clearScene();

    _active           = false;
    _fPressed         = false;
    _aPressed         = false;
    _phase            = 'route_select';
    _chosenRoute      = 0;
    _score            = 0;
    _stealthOk        = true;
    _barracksAlerted  = false;
    _wave2Skipped     = false;
    _warlordDead      = false;
    _hostageFree      = 0;
    _climbProgress    = 0;
    _sewerEntered     = false;
    _crouching        = false;
    _onLadder         = false;
    _c4Placed         = false;
    _c4Arming         = false;
    _c4ArmTimer       = 0;
    _totalTime        = 0;
    _keys             = { w: false, a: false, s: false, d: false, e: false, f: false, c: false, r: false };
    _fireThisFrame    = false;
    _eThisFrame       = false;
    _rThisFrame       = false;

    _hideOverlay();
    if (_hudEl) { _hudEl.textContent = ''; }

    document.exitPointerLock =
      document.exitPointerLock ||
      document.mozExitPointerLock ||
      document.webkitExitPointerLock;
    if (document.exitPointerLock) { document.exitPointerLock(); }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas, renderer) {
    _scene    = scene;
    _camera   = camera;
    _canvas   = canvas || (renderer && renderer.domElement);
    _renderer = renderer || null;

    if (_camera) {
      _camera.rotation.order = 'YXZ';
    }

    _buildHUD();

    document.addEventListener('keydown',   _onKeyDown,   false);
    document.addEventListener('keyup',     _onKeyUp,     false);
    document.addEventListener('mousemove', _onMouseMove, false);
    document.addEventListener('mousedown', _onMouseDown, false);

    _clock = { then: performance.now() };
  }

  function update(dt) {
    if (!_active) { return; }
    _doUpdate(dt);
  }

  function reset() {
    _doReset();
  }

  return { init: init, update: update, reset: reset };

}());
