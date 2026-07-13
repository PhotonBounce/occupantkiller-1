/* ───────────────────────────────────────────────────────────────────────────
   ancient-temple.js — Ancient Temple Module
   API: window.AncientTemple = { init, update, reset }
   Controls:
     A + T  (both within 400ms) → activate / deactivate module
     WASD                       → move player
     Space                      → jump (avoid traps)
     E (within range)           → interact (pick up relic, place relic, interact)
     Mouse                      → aim / look
     Click                      → shoot
   ─────────────────────────────────────────────────────────────────────────── */
window.AncientTemple = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── Activation ────────────────────────────────────────────────────────── */
  var _active      = false;
  var _aPressTime  = 0;
  var _tPressTime  = 0;
  var _keys        = {};
  var _prevEKey    = false;
  var _mouseX      = 0;
  var _mouseY      = 0;
  var _yaw         = 0;
  var _pitch       = 0;

  /* ── All scene objects (for cleanup) ───────────────────────────────────── */
  var _meshes = [];
  var _lights = [];

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player     = null;
  var _playerHP   = 100;
  var _velY       = 0;
  var _onGround   = true;
  var _speed      = 8;
  var _carrySpeed = 6.4;  /* 20% slower when holding relic */

  /* ── Mercenaries ───────────────────────────────────────────────────────── */
  var _mercenaries = [];
  /* { mesh, headMesh, hp, maxHp, dead, x, y, z, moveDir, fireTimer, type,
       alertTimer, patrolAngle, patrolRadius, patrolCx, patrolCz } */
  var _MERC_HP        = 80;
  var _DEMO_HP        = 200;
  var _BOSS_HP        = 450;
  var _demoExpert     = null;   /* reference into _mercenaries */
  var _bossHarker     = null;   /* reference into _mercenaries */
  var _demoTimer      = 7 * 60; /* 7 minutes */
  var _demoTimerActive = false;
  var _bossAlive      = true;
  var _mercsAlive     = 22;

  /* ── Relics ────────────────────────────────────────────────────────────── */
  var _relics = [];
  /* { mesh, light, x, y, z, carried, placed } */
  var _relicsRecovered = 0;
  var _relicsPlaced    = 0;
  var _carriedRelic    = null;  /* reference to relic obj currently carried */

  /* ── Altar slots ───────────────────────────────────────────────────────── */
  var _altarSlots = [];
  /* { mesh, x, y, z, filled } */

  /* ── Traps ─────────────────────────────────────────────────────────────── */
  var _traps = [];
  /* pressure plate: { type:'plate', mesh, triggerMesh, x, z, triggered, spikeGroup, spikes, spikeUp, spikeTimer }
     boulder: { type:'boulder', mesh, rolling, speed, dir, x, y, z, startX, startZ }
     dart:    { type:'dart', mesh, disabled, fireTimer, darts:[], x, z, dir }
     collapse:{ type:'collapse', mesh, x, z, weight, broken } */
  var _trapsDisarmed = 0;
  var _trapsTotal    = 0;
  var _boulderActive = false;
  var _boulderTimer  = 5;

  /* ── Bullets (player shots) ────────────────────────────────────────────── */
  var _bullets = [];
  /* { mesh, vx, vy, vz, life } */

  /* ── Room zones ────────────────────────────────────────────────────────── */
  /* zones used for player-position checks: jungle, entrance, hallOfTrials,
     treasureRoom, riverRoom, sanctum */
  var _zones = {};

  /* ── Win/Lose state ────────────────────────────────────────────────────── */
  var _gameOver       = false;
  var _gameWon        = false;
  var _escapeWindow   = false;
  var _escapeTimer    = 30;
  var _sanctumOpen    = true;
  var _sanctumSealed  = false;
  var _escapePassage  = null;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud    = null;
  var _msgEl  = null;
  var _msgTimer = 0;

  /* ── Game time ─────────────────────────────────────────────────────────── */
  var _gameTime = 0;

  /* ── fog / bg backup ───────────────────────────────────────────────────── */
  var _bgBackup  = null;
  var _fogBackup = null;

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  HELPERS                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _box(w, h, d, color, emissive) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var opts = { color: color };
    if (emissive !== undefined) {
      opts.emissive = new THREE.Color(emissive);
      opts.emissiveIntensity = 0.5;
    }
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial(opts));
  }

  function _cyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
  }

  function _sphere(r, segs, color) {
    var geo = new THREE.SphereGeometry(r, segs || 8, segs || 8);
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
  }

  function _cone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs || 8);
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
  }

  function _add(mesh) {
    _scene.add(mesh);
    _meshes.push(mesh);
    return mesh;
  }

  function _addLight(light) {
    _scene.add(light);
    _lights.push(light);
    return light;
  }

  function _dist2d(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3d(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene || null;
  }

  function _getCamera() {
    return _camera ||
      (window.GameManager && window.GameManager.camera) ||
      window.camera || null;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  MESSAGES & HUD                                                         */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _showMsg(text) {
    if (!_msgEl) {
      _msgEl = document.createElement('div');
      _msgEl.style.cssText = [
        'position:fixed',
        'bottom:90px',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#FFEE44',
        'font-family:monospace',
        'font-size:15px',
        'font-weight:bold',
        'background:rgba(0,0,0,0.80)',
        'padding:8px 22px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:10000',
        'white-space:nowrap'
      ].join(';');
      document.body.appendChild(_msgEl);
    }
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    _msgTimer = 4.0;
  }

  function _updateMsgTimer(dt) {
    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0 && _msgEl) { _msgEl.style.display = 'none'; }
    }
  }

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'at-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.80)',
      'color:#FFCC44',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border:1px solid #776633',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);
    _updateHUD();
  }

  function _removeHUD() {
    if (_hud   && _hud.parentNode)   { _hud.parentNode.removeChild(_hud);     _hud   = null; }
    if (_msgEl && _msgEl.parentNode) { _msgEl.parentNode.removeChild(_msgEl); _msgEl = null; }
  }

  function _updateHUD() {
    if (!_hud) { return; }
    if (!_active) { _hud.style.display = 'none'; return; }
    _hud.style.display = 'block';

    var bossStr    = _bossAlive ? 'ACTIVE' : 'ELIMINATED';
    var mercsStr   = '' + _mercsAlive;
    var relicStr   = '' + _relicsRecovered + '/3 RECOVERED';
    var trapStr    = 'ACTIVE / DISARMED: ' + _trapsDisarmed;
    var sanctumStr = _sanctumSealed ? 'SEALED' : 'OPEN';

    var extra = '';
    if (_escapeWindow) {
      extra = ' | ESCAPE: ' + Math.max(0, Math.ceil(_escapeTimer)) + 's';
    }
    if (_demoTimerActive && !_gameOver) {
      extra += ' | DEMO EXPERT: ' + Math.max(0, Math.ceil(_demoTimer)) + 's';
    }

    _hud.textContent =
      'ANCIENT TEMPLE' +
      ' [RELICS: ' + relicStr + ']' +
      ' [BOSS: ' + bossStr + ']' +
      ' [TRAPS: ' + trapStr + ']' +
      ' [MERCENARIES: ' + mercsStr + ']' +
      ' [SANCTUM: ' + sanctumStr + ']' +
      extra;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  WORLD BUILD                                                            */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _buildWorld() {
    /* Ground plane */
    var ground = _box(200, 0.5, 200, 0x334422);
    ground.position.set(0, -0.25, 0);
    _add(ground);

    /* Ambient jungle light */
    var amb = new THREE.AmbientLight(0x334433, 0.7);
    _addLight(amb);

    var sun = new THREE.DirectionalLight(0x886644, 0.9);
    sun.position.set(30, 60, 20);
    _addLight(sun);

    _buildJungleApproach();
    _buildTempleExterior();
    _buildHallOfTrials();
    _buildTreasureRoom();
    _buildUndergroundRiver();
    _buildSanctum();
    _buildRelics();
    _buildAltarSlots();
    _buildMercenaries();
    _buildTraps();
    _buildEscapePassage();
  }

  /* ── Jungle approach (z 60..120) ───────────────────────────────────────── */
  function _buildJungleApproach() {
    var i, tree, trunk, canopy, bush;

    /* Path floor */
    var path = _box(6, 0.3, 80, 0x554433);
    path.position.set(0, 0.15, 80);
    _add(path);

    /* 30 trees */
    for (i = 0; i < 30; i++) {
      var side   = (i % 2 === 0) ? 1 : -1;
      var spread = 4 + Math.random() * 14;
      var zpos   = 50 + Math.random() * 80;
      var height = 6 + Math.random() * 8;

      trunk = _cyl(0.4, 0.6, height, 7, 0x443322);
      trunk.position.set(side * spread, height / 2, zpos);
      _add(trunk);

      canopy = _cyl(0, 3 + Math.random() * 2, 4, 7, 0x226622);
      canopy.position.set(side * spread, height + 1.5, zpos);
      _add(canopy);
    }

    /* Undergrowth bushes */
    for (i = 0; i < 40; i++) {
      bush = _box(1 + Math.random(), 0.6 + Math.random() * 0.6, 1 + Math.random(), 0x224422);
      bush.position.set(
        (Math.random() - 0.5) * 40,
        0.4,
        50 + Math.random() * 80
      );
      _add(bush);
    }

    /* 6 mercenary scouts — placed in jungle */
    _spawnMercGroup(6, 0, 0, 85, 'scout', 8);

    _zones.jungle = { xMin: -25, xMax: 25, zMin: 50, zMax: 140 };
  }

  /* ── Temple exterior / pyramid base (z 0..50) ──────────────────────────── */
  function _buildTempleExterior() {
    /* Pyramid base 40×20×40 */
    var base = _box(40, 4, 40, 0x887755);
    base.position.set(0, 2, 20);
    _add(base);

    /* Stepped tiers */
    var tier1 = _box(34, 4, 34, 0x887755);
    tier1.position.set(0, 6, 20);
    _add(tier1);

    var tier2 = _box(26, 4, 26, 0x887755);
    tier2.position.set(0, 10, 20);
    _add(tier2);

    var tier3 = _box(18, 4, 18, 0x887755);
    tier3.position.set(0, 14, 20);
    _add(tier3);

    var apex = _box(8, 4, 8, 0x998866);
    apex.position.set(0, 18, 20);
    _add(apex);

    /* Stone door frame — LineSegments */
    var doorPts = [];
    /* frame corners: 4m wide, 5m tall, z=0.2 front face of temple */
    var dz = 0.2;
    var dxH = 2.0, dyH = 5.0, dyB = 0;
    doorPts.push(-dxH, dyB, dz,  dxH, dyB, dz);   /* bottom */
    doorPts.push( dxH, dyB, dz,  dxH, dyH, dz);   /* right side */
    doorPts.push( dxH, dyH, dz, -dxH, dyH, dz);   /* top */
    doorPts.push(-dxH, dyH, dz, -dxH, dyB, dz);   /* left side */
    /* inner frame */
    doorPts.push(-dxH + 0.3, dyB + 0.3, dz,  dxH - 0.3, dyB + 0.3, dz);
    doorPts.push( dxH - 0.3, dyB + 0.3, dz,  dxH - 0.3, dyH - 0.3, dz);
    doorPts.push( dxH - 0.3, dyH - 0.3, dz, -dxH + 0.3, dyH - 0.3, dz);
    doorPts.push(-dxH + 0.3, dyH - 0.3, dz, -dxH + 0.3, dyB + 0.3, dz);

    var doorGeo = new THREE.BufferGeometry();
    doorGeo.setAttribute('position', new THREE.Float32BufferAttribute(doorPts, 3));
    var doorFrame = new THREE.LineSegments(doorGeo,
      new THREE.LineBasicMaterial({ color: 0x665544 }));
    doorFrame.position.set(0, 0, 0);
    _add(doorFrame);

    /* Entrance steps */
    for (var s = 0; s < 4; s++) {
      var step = _box(8, 0.5, 1.5, 0x887755);
      step.position.set(0, s * 0.5, 1.5 + s * 1.5);
      _add(step);
    }

    _zones.entrance = { xMin: -20, xMax: 20, zMin: 0, zMax: 50 };
  }

  /* ── Hall of Trials (z -40..0) ─────────────────────────────────────────── */
  function _buildHallOfTrials() {
    /* Main hall box */
    var hall = _box(10, 8, 40, 0x776644);
    hall.position.set(0, 4, -20);
    _add(hall);

    /* Torch lights */
    var tl1 = new THREE.PointLight(0xFF8833, 1.2, 18);
    tl1.position.set(-4, 6, -10);
    _addLight(tl1);

    var tl2 = new THREE.PointLight(0xFF8833, 1.2, 18);
    tl2.position.set(4, 6, -30);
    _addLight(tl2);

    /* Pressure plates — BoxGeometry flush (0x887744) */
    var platePositions = [
      { x: -2, z: -8  },
      { x:  2, z: -14 },
      { x: -1, z: -20 },
      { x:  1, z: -26 }
    ];
    for (var pi = 0; pi < platePositions.length; pi++) {
      _buildPressurePlate(platePositions[pi].x, platePositions[pi].z);
    }

    /* Spike pit trap at z=-33 */
    _buildSpikePit(0, -33);

    /* Dart wall trap */
    _buildDartWall(-4.5, -18, 'east');
    _buildDartWall( 4.5, -24, 'west');

    /* Collapsing floor section */
    _buildCollapseFloor(0, -28);

    _zones.hallOfTrials = { xMin: -5, xMax: 5, zMin: -40, zMax: 0 };
  }

  /* ── Treasure Room (z -60..-40) ────────────────────────────────────────── */
  function _buildTreasureRoom() {
    var room = _box(20, 8, 20, 0x776633);
    room.position.set(0, 4, -50);
    _add(room);

    /* Treasure room torch */
    var tl = new THREE.PointLight(0xFF9944, 1.5, 20);
    tl.position.set(0, 6, -50);
    _addLight(tl);

    /* Columns */
    var col;
    col = _cyl(0.4, 0.5, 7, 8, 0x887755);
    col.position.set(-7, 3.5, -43); _add(col);
    col = _cyl(0.4, 0.5, 7, 8, 0x887755);
    col.position.set( 7, 3.5, -43); _add(col);
    col = _cyl(0.4, 0.5, 7, 8, 0x887755);
    col.position.set(-7, 3.5, -57); _add(col);
    col = _cyl(0.4, 0.5, 7, 8, 0x887755);
    col.position.set( 7, 3.5, -57); _add(col);

    /* 8 mercenaries guarding treasure */
    _spawnMercGroup(8, 0, 0, -50, 'guard', 7);

    /* Pedestal for relics 1 and 2 */
    var ped1 = _box(1, 1, 1, 0x998866);
    ped1.position.set(-5, 0.5, -48);
    _add(ped1);

    var ped2 = _box(1, 1, 1, 0x998866);
    ped2.position.set( 5, 0.5, -48);
    _add(ped2);

    /* Relic 1 pos near pedestal 1 */
    _relics[0].x = -5; _relics[0].y = 1.5; _relics[0].z = -48;
    _relics[0].mesh.position.set(-5, 1.5, -48);

    /* Relic 2 near pedestal 2 */
    _relics[1].x = 5; _relics[1].y = 1.5; _relics[1].z = -48;
    _relics[1].mesh.position.set(5, 1.5, -48);

    _zones.treasureRoom = { xMin: -10, xMax: 10, zMin: -60, zMax: -40 };
  }

  /* ── Underground River (z -80..-60) ────────────────────────────────────── */
  function _buildUndergroundRiver() {
    var room = _box(25, 8, 20, 0x665533);
    room.position.set(0, 4, -70);
    _add(room);

    /* Water */
    var water = _box(25, 0.5, 18, 0x224466, 0x112244);
    water.position.set(0, 0.25, -70);
    _add(water);

    /* River light — blue tinge */
    var rl = new THREE.PointLight(0x4488BB, 1.0, 22);
    rl.position.set(0, 5, -70);
    _addLight(rl);

    /* Boat — CylinderGeometry (flattened) */
    var boat = _cyl(3.5, 3.5, 0.6, 12, 0x554422);
    boat.position.set(-4, 1.0, -70);
    _add(boat);

    /* Boat interior */
    var boatInt = _box(6, 0.4, 5, 0x443311);
    boatInt.position.set(-4, 1.1, -70);
    _add(boatInt);

    /* Boulder trap — rolls down into the river room */
    _buildBoulder(0, 2, -61);

    /* 4 mercenaries in river area */
    _spawnMercGroup(4, 0, 0, -70, 'guard', 6);

    _zones.riverRoom = { xMin: -12, xMax: 12, zMin: -80, zMax: -60 };
  }

  /* ── Sanctum (z -100..-80) ──────────────────────────────────────────────── */
  function _buildSanctum() {
    /* Main sanctum box */
    var sanc = _box(20, 10, 20, 0x887744);
    sanc.position.set(0, 5, -90);
    _add(sanc);

    /* Sanctum gold light */
    var gl = new THREE.PointLight(0xFFDD88, 2.0, 25);
    gl.position.set(0, 8, -90);
    _addLight(gl);

    /* Central altar */
    var altar = _box(8, 1, 3, 0x998855);
    altar.position.set(0, 0.5, -93);
    _add(altar);

    /* Decorative walls with LineSegments carvings */
    _buildSanctumCarvings();

    /* Boss Colonel Harker spawn position */
    _spawnBoss(3, 0, -92);

    /* Relic 3 — boss is carrying it, appears on boss death */
    _relics[2].x = 3; _relics[2].y = -100; _relics[2].z = -92; /* hidden until boss dies */
    _relics[2].mesh.position.set(3, -100, -92); /* below floor, out of sight */
    _relics[2].hidden = true;

    _zones.sanctum = { xMin: -10, xMax: 10, zMin: -100, zMax: -80 };
  }

  function _buildSanctumCarvings() {
    /* north wall carvings */
    var pts = [];
    var i;
    for (i = 0; i < 5; i++) {
      var cx = -8 + i * 4;
      pts.push(cx, 2, -99.8,  cx, 8, -99.8);
      pts.push(cx - 1, 5, -99.8, cx + 1, 5, -99.8);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var carvings = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xFFCC44 }));
    _add(carvings);
  }

  /* ── Relics (created early, positioned later) ───────────────────────────── */
  function _buildRelics() {
    var i;
    var colors  = [0x997722, 0x997722, 0x997722];
    var lcolors = [0xFFAA00, 0xFFAA00, 0xFFAA00];

    for (i = 0; i < 3; i++) {
      var relicMesh = _sphere(0.35, 10, colors[i]);
      relicMesh.position.set(0, -100, 0); /* placeholder, positioned by room builders */
      _add(relicMesh);

      var relicLight = new THREE.PointLight(lcolors[i], 1.8, 5);
      relicLight.position.set(0, -100, 0);
      _addLight(relicLight);

      _relics.push({
        mesh:     relicMesh,
        light:    relicLight,
        x: 0, y: -100, z: 0,
        carried:  false,
        placed:   false,
        hidden:   false
      });
    }
  }

  /* ── Altar slots ────────────────────────────────────────────────────────── */
  function _buildAltarSlots() {
    var offsets = [-2.5, 0, 2.5];
    for (var i = 0; i < 3; i++) {
      var slot = _box(1.2, 0.3, 1.2, 0x665533);
      slot.position.set(offsets[i], 0.65, -93);
      _add(slot);

      _altarSlots.push({
        mesh:   slot,
        x:      offsets[i],
        y:      1.0,
        z:      -93,
        filled: false
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  TRAP BUILDERS                                                         */
  /* ══════════════════════════════════════════════════════════════════════ */

  function _buildPressurePlate(px, pz) {
    /* Plate is flush with floor (very thin) */
    var plate = _box(2.5, 0.15, 2.5, 0x887744);
    plate.position.set(px, 0.07, pz);
    _add(plate);

    /* Spike pit underneath — hidden unless triggered */
    var pitBase = _box(3, 0.5, 3, 0x443322);
    pitBase.position.set(px, -0.5, pz);
    _add(pitBase);

    var spikeGroup = _buildSpikeSet(px, pz);

    _traps.push({
      type:       'plate',
      mesh:       plate,
      pitBase:    pitBase,
      x: px, z:  pz,
      triggered:  false,
      disarmed:   false,
      spikeGroup: spikeGroup,
      spikeUp:    false,
      spikeTimer: 0
    });
    _trapsTotal++;
  }

  function _buildSpikeSet(px, pz) {
    /* LineSegments spikes: 2×1×5 area with vertical spike lines */
    var pts = [];
    var i;
    for (i = 0; i < 6; i++) {
      var sx = px - 1.0 + i * 0.4;
      pts.push(sx, -0.5, pz,  sx, 0.8, pz);            /* vertical spike */
      pts.push(sx - 0.1, 0.6, pz,  sx, 0.8, pz);       /* left barb */
      pts.push(sx + 0.1, 0.6, pz,  sx, 0.8, pz);       /* right barb */
    }
    /* Hidden BoxGeometry spike base */
    var base = _box(2, 1, 5, 0x443322);
    base.position.set(px, -1.5, pz);
    _add(base);

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var spikes = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x888888 }));
    spikes.position.y = -1.5; /* below floor by default */
    _add(spikes);

    return spikes;
  }

  function _buildSpikePit(px, pz) {
    /* Visible pit in floor */
    var pitFloor = _box(4, 0.3, 6, 0x332211);
    pitFloor.position.set(px, -0.4, pz);
    _add(pitFloor);

    /* LineSegments spikes: multiple vertical lines */
    var pts = [];
    var i, j;
    for (i = 0; i < 4; i++) {
      for (j = 0; j < 5; j++) {
        var sx = px - 1.5 + i * 1.0;
        var sz = pz - 2.5 + j * 1.25;
        pts.push(sx, -0.3, sz,  sx, 0.7, sz);
        pts.push(sx - 0.12, 0.5, sz,  sx, 0.7, sz);
        pts.push(sx + 0.12, 0.5, sz,  sx, 0.7, sz);
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var spikeMesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x999999 }));
    _add(spikeMesh);

    _traps.push({
      type:      'pit',
      mesh:      pitFloor,
      spikeMesh: spikeMesh,
      x: px, z:  pz,
      triggered: false,
      disarmed:  false
    });
    _trapsTotal++;
  }

  function _buildDartWall(px, pz, dir) {
    /* Wall with dart pipes — LineSegments */
    var wallBox = _box(0.4, 3, 1.5, 0x776644);
    wallBox.position.set(px, 1.5, pz);
    _add(wallBox);

    /* Pipe rows — LineSegments */
    var pts = [];
    var i;
    for (i = 0; i < 3; i++) {
      var py = 0.7 + i * 0.8;
      if (dir === 'east') {
        pts.push(px, py, pz - 0.5,  px + 0.6, py, pz - 0.5);
        pts.push(px, py, pz + 0.5,  px + 0.6, py, pz + 0.5);
        pts.push(px, py - 0.1, pz,  px + 0.6, py - 0.1, pz);
      } else {
        pts.push(px, py, pz - 0.5,  px - 0.6, py, pz - 0.5);
        pts.push(px, py, pz + 0.5,  px - 0.6, py, pz + 0.5);
        pts.push(px, py - 0.1, pz,  px - 0.6, py - 0.1, pz);
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var pipeMesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x555555 }));
    _add(pipeMesh);

    var dirVec = (dir === 'east') ? 1 : -1;

    _traps.push({
      type:      'dart',
      mesh:      wallBox,
      pipeMesh:  pipeMesh,
      x: px, z:  pz,
      dir:       dirVec,
      disabled:  false,
      disarmed:  false,
      fireTimer: 3.0 + Math.random() * 2.0,
      darts:     []
    });
    _trapsTotal++;
  }

  function _buildCollapseFloor(px, pz) {
    var floorMesh = _box(4, 0.3, 6, 0x887744, 0x443300);
    floorMesh.position.set(px, 0.1, pz);
    _add(floorMesh);

    /* Crack pattern — LineSegments */
    var pts = [
      px - 1.5, 0.26, pz,  px + 1.5, 0.26, pz,
      px, 0.26, pz - 2.5,  px, 0.26, pz + 2.5,
      px - 1, 0.26, pz - 1, px + 0.5, 0.26, pz + 1.5
    ];
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var cracks = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x221100 }));
    _add(cracks);

    _traps.push({
      type:      'collapse',
      mesh:      floorMesh,
      crackMesh: cracks,
      x: px, z:  pz,
      weight:    0,
      broken:    false,
      triggered: false,
      disarmed:  false
    });
    _trapsTotal++;
  }

  function _buildBoulder(px, py, pz) {
    var boulderMesh = _sphere(2, 10, 0x777766);
    boulderMesh.position.set(px, py, pz);
    _add(boulderMesh);

    _traps.push({
      type:      'boulder',
      mesh:      boulderMesh,
      x: px, y:  py, z: pz,
      rolling:   false,
      speed:     0,
      triggered: false,
      disarmed:  false,
      resetX:    px,
      resetY:    py,
      resetZ:    pz
    });
    /* boulder is not counted in disarmable traps total */
  }

  function _buildEscapePassage() {
    /* Hidden passage in sanctum — revealed after all relics placed */
    var passage = _box(3, 4, 2, 0x665533);
    passage.position.set(0, 2, -100.5);
    passage.visible = false;
    _add(passage);
    _escapePassage = passage;
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  MERCENARY BUILDERS                                                    */
  /* ══════════════════════════════════════════════════════════════════════ */

  function _makeMercMesh(color) {
    /* Body */
    var group = new THREE.Group();
    _scene.add(group);
    _meshes.push(group);

    var body = _box(0.8, 1.2, 0.5, color || 0x443322);
    body.position.y = 0.6;
    group.add(body);

    /* Head */
    var head = _box(0.5, 0.5, 0.5, 0x886655);
    head.position.y = 1.55;
    group.add(head);

    /* Arms */
    var armL = _box(0.2, 0.8, 0.2, color || 0x443322);
    armL.position.set(-0.55, 0.6, 0);
    group.add(armL);

    var armR = _box(0.2, 0.8, 0.2, color || 0x443322);
    armR.position.set(0.55, 0.6, 0);
    group.add(armR);

    /* Legs */
    var legL = _box(0.25, 0.7, 0.25, color || 0x443322);
    legL.position.set(-0.25, -0.35, 0);
    group.add(legL);

    var legR = _box(0.25, 0.7, 0.25, color || 0x443322);
    legR.position.set(0.25, -0.35, 0);
    group.add(legR);

    return group;
  }

  function _spawnMercGroup(count, cx, cy, cz, type, radius) {
    var i;
    for (i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2;
      var r     = radius * (0.4 + Math.random() * 0.6);
      var mx    = cx + Math.cos(angle) * r;
      var mz    = cz + Math.sin(angle) * r;

      var hp = (type === 'demo') ? _DEMO_HP : _MERC_HP;
      var mesh = _makeMercMesh(0x443322);
      mesh.position.set(mx, 1.0, mz);

      var mObj = {
        mesh:          mesh,
        hp:            hp,
        maxHp:         hp,
        dead:          false,
        x:             mx,
        y:             1.0,
        z:             mz,
        type:          type,
        fireTimer:     2 + Math.random() * 3,
        alertTimer:    0,
        alerted:       false,
        patrolAngle:   angle,
        patrolRadius:  r,
        patrolCx:      cx,
        patrolCz:      cz
      };

      _mercenaries.push(mObj);

      if (type === 'demo') { _demoExpert = mObj; }
    }
  }

  function _spawnBoss(bx, by, bz) {
    /* Boss Colonel Harker — darker uniform, bigger */
    var group = new THREE.Group();
    _scene.add(group);
    _meshes.push(group);

    /* Body */
    var body = _box(1.0, 1.4, 0.6, 0x332211);
    body.position.y = 0.7;
    group.add(body);

    /* Head */
    var head = _box(0.6, 0.6, 0.6, 0x886655);
    head.position.y = 1.8;
    group.add(head);

    /* Beret */
    var beret = _cyl(0.35, 0.35, 0.2, 8, 0x221100);
    beret.position.y = 2.15;
    group.add(beret);

    /* Arms */
    var armL = _box(0.25, 0.9, 0.25, 0x332211);
    armL.position.set(-0.65, 0.7, 0);
    group.add(armL);

    var armR = _box(0.25, 0.9, 0.25, 0x332211);
    armR.position.set(0.65, 0.7, 0);
    group.add(armR);

    /* Legs */
    var legL = _box(0.3, 0.8, 0.3, 0x332211);
    legL.position.set(-0.3, -0.4, 0);
    group.add(legL);

    var legR = _box(0.3, 0.8, 0.3, 0x332211);
    legR.position.set(0.3, -0.4, 0);
    group.add(legR);

    group.position.set(bx, by + 1.0, bz);

    var bObj = {
      mesh:        group,
      hp:          _BOSS_HP,
      maxHp:       _BOSS_HP,
      dead:        false,
      x:           bx,
      y:           by + 1.0,
      z:           bz,
      type:        'boss',
      fireTimer:   1.5,
      alertTimer:  0,
      alerted:     true,
      shotgunTimer: 0,
      patrolAngle:  0,
      patrolRadius: 3,
      patrolCx:     bx,
      patrolCz:     bz
    };

    _mercenaries.push(bObj);
    _bossHarker = bObj;
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  PLAYER SPAWN                                                          */
  /* ══════════════════════════════════════════════════════════════════════ */

  function _spawnPlayer() {
    var cam = _getCamera();
    if (!cam) { return; }

    /* Place player at jungle entrance */
    cam.position.set(0, 2, 110);
    cam.rotation.set(0, Math.PI, 0);
    _player = cam;
    _playerHP = 100;
    _yaw   = Math.PI;
    _pitch = 0;
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  ACTIVATION / DEACTIVATION                                            */
  /* ══════════════════════════════════════════════════════════════════════ */

  function _activate() {
    var sc = _getScene();
    if (!sc) { return; }
    _scene  = sc;
    _camera = _getCamera();
    _active = true;

    /* Backup and set environment */
    _bgBackup  = sc.background;
    _fogBackup = sc.fog;
    sc.background = new THREE.Color(0x1A2E1A);
    sc.fog        = new THREE.FogExp2(0x1A2E1A, 0.018);

    /* Build world */
    _buildWorld();
    _spawnPlayer();
    _buildHUD();

    /* Spawn demolitions expert after 60s */
    _demoTimerActive = false;
    _demoTimer       = 7 * 60;

    /* After 10s, spawn demo expert deep in the temple */
    _spawnMercGroup(1, 0, 0, -75, 'demo', 2);
    _demoTimerActive = true;

    _mercsAlive = _mercenaries.length;

    _showMsg('ANCIENT TEMPLE — Stop the mercenaries! Recover 3 relics and reach the sanctum. [A+T to exit]');
    _updateHUD();
  }

  function _deactivate() {
    var sc = _scene;
    if (!sc) { return; }
    _active = false;

    /* Restore environment */
    if (_bgBackup !== undefined)  { sc.background = _bgBackup; }
    sc.fog = _fogBackup;

    /* Remove all meshes */
    var i;
    for (i = 0; i < _meshes.length; i++) {
      sc.remove(_meshes[i]);
    }
    _meshes = [];

    for (i = 0; i < _lights.length; i++) {
      sc.remove(_lights[i]);
    }
    _lights = [];

    /* Clear bullets */
    for (i = 0; i < _bullets.length; i++) {
      sc.remove(_bullets[i].mesh);
    }
    _bullets = [];

    /* Clear dart projectiles */
    for (i = 0; i < _traps.length; i++) {
      if (_traps[i].darts) {
        for (var j = 0; j < _traps[i].darts.length; j++) {
          sc.remove(_traps[i].darts[j].mesh);
        }
      }
    }

    /* Reset state */
    _mercenaries    = [];
    _relics         = [];
    _altarSlots     = [];
    _traps          = [];
    _bullets        = [];
    _zones          = {};
    _demoExpert     = null;
    _bossHarker     = null;
    _bossAlive      = true;
    _mercsAlive     = 22;
    _relicsRecovered = 0;
    _relicsPlaced   = 0;
    _carriedRelic   = null;
    _trapsDisarmed  = 0;
    _trapsTotal     = 0;
    _gameOver       = false;
    _gameWon        = false;
    _escapeWindow   = false;
    _escapeTimer    = 30;
    _sanctumSealed  = false;
    _escapePassage  = null;
    _demoTimerActive = false;
    _gameTime       = 0;
    _boulderActive  = false;

    _removeHUD();
    _scene  = null;
    _camera = null;
    _player = null;
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  INPUT HANDLERS                                                        */
  /* ══════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    _keys[key] = true;

    if (key === 'a') { _aPressTime = _gameTime; }
    if (key === 't') { _tPressTime = _gameTime; }

    /* A+T toggle */
    if (_keys['a'] && _keys['t']) {
      var diff = Math.abs(_aPressTime - _tPressTime);
      if (diff <= 0.4) {
        if (_active) { _deactivate(); } else { _activate(); }
        return;
      }
    }

    if (!_active) { return; }

    /* Jump */
    if ((key === ' ' || key === 'arrowup') && _onGround) {
      _velY     = 6;
      _onGround = false;
    }

    /* Interact */
    if (key === 'e' && !_prevEKey) {
      _tryInteract();
    }
    _prevEKey = (key === 'e');
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    _keys[key] = false;
    if (key === 'e') { _prevEKey = false; }
  }

  function _onMouseMove(e) {
    if (!_active) { return; }
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    _yaw   -= dx * 0.002;
    _pitch -= dy * 0.002;
    _pitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _pitch));

    if (_camera) {
      _camera.rotation.order = 'YXZ';
      _camera.rotation.y     = _yaw;
      _camera.rotation.x     = _pitch;
    }
  }

  function _onClick(e) {
    if (!_active || _gameOver) { return; }
    _firePlayerBullet();
  }

  function _firePlayerBullet() {
    if (!_camera) { return; }

    /* Direction from camera */
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);

    var bMesh = _sphere(0.08, 4, 0xFFFF44);
    bMesh.position.copy(_camera.position);
    bMesh.position.addScaledVector(dir, 1.0);
    _scene.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      vx:   dir.x * 50,
      vy:   dir.y * 50,
      vz:   dir.z * 50,
      life: 2.0
    });
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  INTERACTION                                                           */
  /* ══════════════════════════════════════════════════════════════════════ */

  function _tryInteract() {
    if (!_player || _gameOver) { return; }
    var px = _player.position.x;
    var py = _player.position.y;
    var pz = _player.position.z;

    /* Try pick up / place relic */
    if (_carriedRelic) {
      /* Try place in altar slot */
      var i;
      for (i = 0; i < _altarSlots.length; i++) {
        var slot = _altarSlots[i];
        if (slot.filled) { continue; }
        var d = _dist2d(px, pz, slot.x, slot.z);
        if (d < 3.0) {
          _placeRelic(slot);
          return;
        }
      }
      _showMsg('No altar slot nearby — carry relic to the sanctum altar.');
      return;
    }

    /* Try pick up loose relic */
    var ri;
    for (ri = 0; ri < _relics.length; ri++) {
      var relic = _relics[ri];
      if (relic.carried || relic.placed || relic.hidden) { continue; }
      var rd = _dist2d(px, pz, relic.x, relic.z);
      if (rd < 2.5) {
        _pickUpRelic(relic);
        return;
      }
    }

    /* Try disarm dart trap */
    var ti;
    for (ti = 0; ti < _traps.length; ti++) {
      var trap = _traps[ti];
      if (trap.type !== 'dart' || trap.disabled || trap.disarmed) { continue; }
      var td = _dist2d(px, pz, trap.x, trap.z);
      if (td < 2.5) {
        _disarmDartTrap(trap);
        return;
      }
    }

    _showMsg('Nothing to interact with here.');
  }

  function _pickUpRelic(relic) {
    relic.carried = true;
    _carriedRelic = relic;
    relic.mesh.visible  = false;
    relic.light.intensity = 0;
    _relicsRecovered++;
    _showMsg('Relic recovered! (' + _relicsRecovered + '/3) — Carry it to the sanctum altar. [E near slot]');
    _updateHUD();

    /* Check if boss drops relic 3 */
    if (_relicsRecovered === 1 && _relics[2].hidden && _bossHarker && _bossHarker.dead) {
      _dropRelic3();
    }
  }

  function _placeRelic(slot) {
    /* Find unfilled slot */
    slot.filled = true;
    _carriedRelic.placed = true;
    _carriedRelic.carried = false;

    /* Place relic visually in slot */
    _carriedRelic.mesh.visible = true;
    _carriedRelic.mesh.position.set(slot.x, slot.y, slot.z);
    _carriedRelic.light.position.set(slot.x, slot.y + 0.5, slot.z);
    _carriedRelic.light.intensity = 2.0;

    _carriedRelic = null;
    _relicsPlaced++;
    _showMsg('Relic placed! (' + _relicsPlaced + '/3 slots filled)');
    _updateHUD();

    _checkWinCondition();
  }

  function _disarmDartTrap(trap) {
    trap.disabled = true;
    trap.disarmed = true;
    _trapsDisarmed++;
    _showMsg('Dart trap disabled!');
    _updateHUD();
  }

  function _dropRelic3() {
    var r = _relics[2];
    r.hidden = false;
    r.x = _bossHarker.x;
    r.y = 0.5;
    r.z = _bossHarker.z;
    r.mesh.position.set(r.x, r.y, r.z);
    r.light.position.set(r.x, r.y + 0.5, r.z);
    r.light.intensity = 1.8;
    _showMsg('Colonel Harker dropped the 3rd relic! Pick it up. [E]');
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  WIN / LOSE                                                            */
  /* ══════════════════════════════════════════════════════════════════════ */

  function _checkWinCondition() {
    if (_relicsPlaced === 3 && !_bossAlive && !_escapeWindow) {
      /* Seal the temple — start escape window */
      _sanctumSealed  = true;
      _escapeWindow   = true;
      _escapeTimer    = 30;

      /* Reveal escape passage */
      if (_escapePassage) { _escapePassage.visible = true; }

      _showMsg('Temple sealed! Escape through the passage in 30 seconds!');
      _updateHUD();
    } else if (_relicsPlaced === 3 && _bossAlive) {
      _showMsg('All relics placed — defeat Colonel Harker to seal the temple!');
    } else if (!_bossAlive && _relicsPlaced < 3) {
      _showMsg('Boss eliminated! Place all 3 relics in the altar to seal the temple.');
    }
  }

  function _triggerWin() {
    _gameOver = true;
    _gameWon  = true;
    _showMsg('VICTORY! Temple sealed — the relics are safe. Mercenaries repelled!');
    _updateHUD();
  }

  function _triggerLose(reason) {
    _gameOver = true;
    _gameWon  = false;
    _showMsg('MISSION FAILED — ' + reason);
    _updateHUD();
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  UPDATE LOOPS                                                          */
  /* ══════════════════════════════════════════════════════════════════════ */

  function _updatePlayer(dt) {
    if (!_player || _gameOver) { return; }

    var cam   = _camera;
    var spd   = _carriedRelic ? _carrySpeed : _speed;
    var moveX = 0, moveZ = 0;

    /* WASD movement relative to yaw */
    var cos = Math.cos(_yaw);
    var sin = Math.sin(_yaw);

    if (_keys['w'] || _keys['arrowup'])    { moveX -= sin; moveZ -= cos; }
    if (_keys['s'] || _keys['arrowdown'])  { moveX += sin; moveZ += cos; }
    if (_keys['a'] && !_keys['t'])         { moveX -= cos; moveZ += sin; }
    if (_keys['d'])                        { moveX += cos; moveZ -= sin; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) { moveX /= len; moveZ /= len; }

    cam.position.x += moveX * spd * dt;
    cam.position.z += moveZ * spd * dt;

    /* Gravity & jump */
    _velY -= 18 * dt;
    cam.position.y += _velY * dt;

    /* Ground check */
    var groundY = _getGroundY(cam.position.x, cam.position.z);
    if (cam.position.y <= groundY + 1.7) {
      cam.position.y = groundY + 1.7;
      _velY    = 0;
      _onGround = true;
    } else {
      _onGround = false;
    }

    /* Sync relic position above camera */
    if (_carriedRelic) {
      var ahead = new THREE.Vector3(0, -0.3, -0.5);
      ahead.applyQuaternion(cam.quaternion);
      _carriedRelic.mesh.position.copy(cam.position).add(ahead);
    }
  }

  function _getGroundY(px, pz) {
    /* Basic flat ground; boat is elevated */
    if (px > -7 && px < -1 && pz > -73 && pz < -67) { return 0.9; } /* on boat */
    return 0;
  }

  function _updateMercenaries(dt) {
    var i, m, dx, dz, dist, px, pz;
    if (!_player) { return; }

    px = _player.position.x;
    pz = _player.position.z;

    for (i = 0; i < _mercenaries.length; i++) {
      m = _mercenaries[i];
      if (m.dead) { continue; }

      dx   = px - m.x;
      dz   = pz - m.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      /* Alert if player is close */
      if (dist < 20 && !m.alerted) {
        m.alerted    = true;
        m.alertTimer = 0.5;
      }

      /* Patrol when not alerted */
      if (!m.alerted) {
        m.patrolAngle += dt * 0.5;
        var px2 = m.patrolCx + Math.cos(m.patrolAngle) * m.patrolRadius;
        var pz2 = m.patrolCz + Math.sin(m.patrolAngle) * m.patrolRadius;
        m.x += (px2 - m.x) * dt * 1.5;
        m.z += (pz2 - m.z) * dt * 1.5;
      } else {
        /* Move toward player */
        if (dist > 4) {
          var moveSpd = (m.type === 'boss') ? 4.5 : 3.0;
          m.x += (dx / dist) * moveSpd * dt;
          m.z += (dz / dist) * moveSpd * dt;
        }

        /* Fire at player */
        m.fireTimer -= dt;
        if (m.fireTimer <= 0 && dist < 25) {
          _mercFire(m, px, pz);
          m.fireTimer = (m.type === 'boss') ? 1.0 : 2.0 + Math.random() * 1.5;
        }
      }

      m.mesh.position.set(m.x, m.y, m.z);
      /* Face player when alerted */
      if (m.alerted && dist > 0.1) {
        m.mesh.rotation.y = Math.atan2(dx, dz);
      }

      /* Mercs can trigger pressure plates too */
      _checkMercTriggerTraps(m);
    }
  }

  function _mercFire(m, px, pz) {
    /* Bullet from merc toward player */
    var dx = px - m.x;
    var dy = (_player ? _player.position.y : 2) - m.y;
    var dz = pz - m.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.01) { return; }

    var bMesh = _sphere(0.07, 4, 0xFF4400);
    bMesh.position.set(m.x, m.y + 1.0, m.z);
    _scene.add(bMesh);

    /* Add to bullets array as enemy bullet (negative damage to player) */
    _bullets.push({
      mesh:   bMesh,
      vx:     (dx / len) * 35,
      vy:     (dy / len) * 35,
      vz:     (dz / len) * 35,
      life:   1.5,
      enemy:  true
    });
  }

  function _checkMercTriggerTraps(m) {
    var ti, trap;
    for (ti = 0; ti < _traps.length; ti++) {
      trap = _traps[ti];
      if (trap.triggered || trap.disarmed || trap.type !== 'plate') { continue; }
      var d = _dist2d(m.x, m.z, trap.x, trap.z);
      if (d < 1.5) {
        _triggerPressurePlate(trap);
      }
    }
  }

  function _updateBullets(dt) {
    var i, b, px, py, pz, dx, dy, dz, dist;
    px = _player ? _player.position.x : 0;
    py = _player ? _player.position.y : 2;
    pz = _player ? _player.position.z : 0;

    for (i = _bullets.length - 1; i >= 0; i--) {
      b = _bullets[i];
      b.life -= dt;

      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z += b.vz * dt;

      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
        continue;
      }

      if (b.enemy) {
        /* Check hit on player */
        dx = b.mesh.position.x - px;
        dy = b.mesh.position.y - py;
        dz = b.mesh.position.z - pz;
        dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.0) {
          _playerTakeDamage(15, 'bullet');
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
        }
      } else {
        /* Check hit on mercenaries */
        var hit = false;
        var mi;
        for (mi = 0; mi < _mercenaries.length; mi++) {
          var m = _mercenaries[mi];
          if (m.dead) { continue; }
          dx = b.mesh.position.x - m.x;
          dy = b.mesh.position.y - (m.y + 1.0);
          dz = b.mesh.position.z - m.z;
          dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 1.2) {
            _damageMerc(m, 20);
            hit = true;
            break;
          }
        }
        if (hit) {
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
        }
      }
    }
  }

  function _damageMerc(m, dmg) {
    if (m.dead) { return; }
    m.hp -= dmg;
    if (m.hp <= 0) {
      m.hp   = 0;
      m.dead = true;
      m.mesh.visible = false;
      _mercsAlive = Math.max(0, _mercsAlive - 1);

      if (m === _bossHarker) {
        _bossAlive = false;
        _dropRelic3();
        _showMsg('Colonel Harker eliminated! Recover the final relic and seal the temple.');
      }
      if (m === _demoExpert) {
        _demoTimerActive = false;
        _showMsg('Demolitions expert neutralized — temple is safe!');
      }
      _updateHUD();
      _checkWinCondition();
    }
  }

  function _playerTakeDamage(dmg, source) {
    if (_gameOver) { return; }
    _playerHP -= dmg;
    if (_playerHP <= 0) {
      _playerHP = 0;
      _triggerLose('You were killed in action.');
    }
  }

  function _updateTraps(dt) {
    var i, trap, px, pz, dist;
    px = _player ? _player.position.x : 0;
    pz = _player ? _player.position.z : 0;
    var py = _player ? _player.position.y : 0;

    for (i = 0; i < _traps.length; i++) {
      trap = _traps[i];

      if (trap.type === 'plate') {
        _updatePressurePlate(trap, dt, px, pz);
      } else if (trap.type === 'dart') {
        _updateDartTrap(trap, dt, px, pz);
      } else if (trap.type === 'collapse') {
        _updateCollapseTrap(trap, dt, px, py, pz);
      } else if (trap.type === 'boulder') {
        _updateBoulder(trap, dt, px, pz);
      }
    }
  }

  function _updatePressurePlate(trap, dt, px, pz) {
    if (trap.disarmed) { return; }

    dist = _dist2d(px, pz, trap.x, trap.z);
    if (dist < 1.5 && !trap.triggered) {
      _triggerPressurePlate(trap);
    }

    /* Animate spikes */
    if (trap.triggered && !trap.disarmed) {
      trap.spikeTimer += dt;
      if (trap.spikeTimer < 0.5) {
        /* Spikes rise */
        var progress = trap.spikeTimer / 0.5;
        trap.spikeGroup.position.y = -1.5 + progress * 1.5;
        if (!trap.spikeUp && trap.spikeTimer > 0.4) {
          trap.spikeUp = true;
          /* Check player on plate */
          if (dist < 1.5) {
            _playerTakeDamage(40, 'spikes');
            _showMsg('SPIKE TRAP! You were hit by spikes!');
          }
        }
      } else if (trap.spikeTimer < 2.5) {
        /* Hold */
        trap.spikeGroup.position.y = 0;
      } else if (trap.spikeTimer < 3.0) {
        /* Retract */
        var retract = 1 - (trap.spikeTimer - 2.5) / 0.5;
        trap.spikeGroup.position.y = -1.5 + retract * 1.5;
      } else {
        /* Reset */
        trap.triggered  = false;
        trap.spikeUp    = false;
        trap.spikeTimer = 0;
        trap.spikeGroup.position.y = -1.5;
      }
    }
  }

  function _triggerPressurePlate(trap) {
    if (trap.triggered || trap.disarmed) { return; }
    trap.triggered  = true;
    trap.spikeTimer = 0;
    _showMsg('PRESSURE PLATE triggered! Spikes!');
  }

  function _updateDartTrap(trap, dt, px, pz) {
    if (trap.disabled || trap.disarmed) {
      /* Remove existing darts */
      return;
    }

    /* Check if player is in line of sight range */
    var inRange = (Math.abs(pz - trap.z) < 8 && Math.abs(px - trap.x) < 5);

    trap.fireTimer -= dt;
    if (trap.fireTimer <= 0 && inRange) {
      _fireDart(trap);
      trap.fireTimer = 3.5 + Math.random() * 1.5;
    }

    /* Update existing darts */
    var j;
    for (j = trap.darts.length - 1; j >= 0; j--) {
      var dart = trap.darts[j];
      dart.life -= dt;
      dart.mesh.position.x += dart.vx * dt;
      dart.mesh.position.z += dart.vz * dt;

      /* Check hit player */
      var ddx = dart.mesh.position.x - px;
      var ddz = dart.mesh.position.z - pz;
      var ddist = Math.sqrt(ddx * ddx + ddz * ddz);
      if (ddist < 0.8) {
        _playerTakeDamage(25, 'dart');
        _showMsg('Hit by a dart!');
        _scene.remove(dart.mesh);
        trap.darts.splice(j, 1);
        continue;
      }

      if (dart.life <= 0) {
        _scene.remove(dart.mesh);
        trap.darts.splice(j, 1);
      }
    }
  }

  function _fireDart(trap) {
    var dartMesh = _box(0.05, 0.05, 0.3, 0x888844);
    dartMesh.position.set(trap.x, 1.2, trap.z);
    _scene.add(dartMesh);

    trap.darts.push({
      mesh: dartMesh,
      vx:   trap.dir * 18,
      vz:   0,
      life: 1.5
    });
  }

  function _updateCollapseTrap(trap, dt, px, py, pz) {
    if (trap.broken || trap.disarmed) { return; }

    var dist2 = _dist2d(px, pz, trap.x, trap.z);
    if (dist2 < 2.5) {
      trap.weight += dt;
      if (trap.weight > 1.5 && !trap.broken) {
        trap.broken    = true;
        trap.triggered = true;
        trap.disarmed  = true; /* counts as resolved */
        _trapsDisarmed++;
        trap.mesh.position.y = -2; /* floor drops */
        _playerTakeDamage(20, 'collapse');
        _showMsg('Floor collapsed! Move quickly!');
        _updateHUD();
      }
    } else {
      /* Recover weight slowly */
      trap.weight = Math.max(0, trap.weight - dt * 0.5);
    }
  }

  function _updateBoulder(trap, dt, px, pz) {
    /* Trigger boulder when player enters hall and passes z=-15 */
    if (!trap.triggered && pz < -15 && pz > -40 && Math.abs(px) < 5) {
      trap.triggered = true;
      trap.rolling   = true;
      trap.speed     = 0;
      _showMsg('BOULDER! Run or dodge into an alcove!');
    }

    if (!trap.rolling) { return; }

    trap.speed = Math.min(trap.speed + 6 * dt, 12);
    trap.z    += trap.speed * dt;    /* boulder rolls toward player (increasing z) */

    trap.mesh.position.set(trap.x, trap.y, trap.z);
    trap.mesh.rotation.x += trap.speed * dt * 0.5; /* spin */

    /* Hit player */
    var dx = trap.x - px;
    var dz = trap.z - pz;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2.5) {
      _playerTakeDamage(60, 'boulder');
      _showMsg('Crushed by the boulder!');
      trap.rolling   = false;
    }

    /* Boulder reaches end of corridor */
    if (trap.z > 5) {
      trap.rolling   = false;
      trap.triggered = false;
      trap.z         = trap.resetZ;
      trap.speed     = 0;
      trap.mesh.position.set(trap.resetX, trap.resetY, trap.resetZ);
    }
  }

  function _updateDemoTimer(dt) {
    if (!_demoTimerActive || _gameOver) { return; }
    if (_demoExpert && _demoExpert.dead) {
      _demoTimerActive = false;
      return;
    }
    _demoTimer -= dt;
    if (_demoTimer <= 0) {
      _triggerLose('The demolitions expert collapsed the temple!');
    }
  }

  function _updateEscapeTimer(dt) {
    if (!_escapeWindow || _gameOver) { return; }
    _escapeTimer -= dt;
    if (_escapeTimer <= 0) {
      _triggerLose('You ran out of time to escape!');
    }

    /* Check if player reached escape passage */
    if (_player) {
      var px = _player.position.x;
      var pz = _player.position.z;
      if (pz < -99 && Math.abs(px) < 3) {
        _triggerWin();
      }
    }
  }

  function _updateRelicGlow(dt) {
    /* Gentle pulsing glow */
    var i, relic;
    var t = _gameTime;
    for (i = 0; i < _relics.length; i++) {
      relic = _relics[i];
      if (relic.carried || relic.placed || relic.hidden) { continue; }
      var pulse = 1.5 + 0.5 * Math.sin(t * 2.5 + i * 1.2);
      relic.light.intensity = pulse;
      relic.mesh.position.y = relic.y + 0.2 * Math.sin(t * 1.8 + i);
      relic.light.position.set(relic.x, relic.mesh.position.y + 0.5, relic.z);
    }
  }

  function _updateBoulderTrigger(dt) {
    /* Boulder reset timer */
    if (!_boulderActive) {
      _boulderTimer -= dt;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  PUBLIC API                                                            */
  /* ══════════════════════════════════════════════════════════════════════ */

  function init(scene, camera) {
    _scene  = scene  || _getScene();
    _camera = camera || _getCamera();

    document.addEventListener('keydown',   _onKeyDown);
    document.addEventListener('keyup',     _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('click',     _onClick);
  }

  function update(dt) {
    _gameTime += dt;
    _updateMsgTimer(dt);

    if (!_active || _gameOver) { return; }

    _updatePlayer(dt);
    _updateMercenaries(dt);
    _updateBullets(dt);
    _updateTraps(dt);
    _updateRelicGlow(dt);
    _updateDemoTimer(dt);
    _updateEscapeTimer(dt);
    _updateHUD();
  }

  function reset() {
    if (_active) { _deactivate(); }
    _gameTime = 0;
  }

  /* Expose public API */
  return { init: init, update: update, reset: reset };

}());
