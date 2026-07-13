/* ───────────────────────────────────────────────────────────────────────────
   island-fortress.js — Amphibious assault on a fortified island
   Activation: press I then F within 400 ms
   E (hold 5s on silo terminal) → destroy launch controls
   Crouch behind beach hedgehogs for 50% damage reduction
   Public API  : window.IslandFortress = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.IslandFortress = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var ACTIVATION_WINDOW      = 400;    // ms between I and F key presses
  var BEACH_WIDTH            = 90;
  var BEACH_DEPTH            = 35;
  var BEACH_PHASE_DURATION   = 30;     // seconds of beach crossing danger
  var MISSILE_LAUNCH_TIME    = 90;     // T=90s missiles launch if not stopped
  var MG_FIRE_INTERVAL       = 5;      // seconds between machine gun salvos
  var MG_DAMAGE              = 30;     // damage if player caught in open
  var HEDGEHOG_DAMAGE_REDUCE = 0.5;    // 50% damage reduction behind cover
  var PATROL_BOAT_HP         = 150;
  var PATROL_BOAT_FIRE_RATE  = 10;     // seconds between boat gun shots
  var PATROL_BOAT_DAMAGE     = 20;
  var PATROL_BOAT_SPEED      = 4;      // units per second
  var PATROL_BOAT_RADIUS     = 60;     // orbit radius around island
  var SILO_INTERACT_TIME     = 5;      // seconds to hold E on terminal
  var SILO_INTERACT_DIST     = 5;
  var FORTRESS_WALL_H        = 12;
  var FORTRESS_WALL_T        = 3;
  var COURTYARD_SIZE         = 40;
  var FOUNTAIN_RADIUS        = 2.5;
  var FOUNTAIN_HEIGHT        = 1;
  var BUNKER_DEPTH           = 3;
  var ROCKET_SPEED           = 8;
  var ROCKET_DAMAGE          = 50;
  var ROCKET_FIRE_INTERVAL   = 12;     // seconds between Dax rockets
  var ENEMY_SOLDIER_HP       = 80;
  var ENEMY_ELITE_HP         = 105;
  var ENEMY_SOLDIER_COUNT    = 14;
  var ENEMY_ELITE_COUNT      = 6;
  var DAX_HP_MAX             = 530;
  var DAX_DETECT_RANGE       = 28;
  var SOLDIER_DETECT_RANGE   = 22;
  var ELITE_DETECT_RANGE     = 25;
  var SOLDIER_FIRE_RANGE     = 20;
  var ENEMY_FIRE_DAMAGE      = 12;
  var ENEMY_FIRE_INTERVAL    = 2.5;
  var HEDGEHOG_COUNT         = 8;
  var PATROL_BOX_COUNT       = 6;      // beach patrol soldiers
  var DOCK_POS_X             = 70;
  var DOCK_POS_Z             = -20;
  var EXTRACT_DIST           = 8;

  /* ── colors ─────────────────────────────────────────────────────────────── */
  var COL_SAND         = 0xD2B48C;
  var COL_SAND_DARK    = 0xC2A070;
  var COL_STONE        = 0x888888;
  var COL_STONE_DARK   = 0x666666;
  var COL_GRASS        = 0x3A6B35;
  var COL_BARRACKS     = 0x7A7A5A;
  var COL_SILO         = 0x556677;
  var COL_MISSILE_BODY = 0xCCCCCC;
  var COL_MISSILE_CONE = 0xCC3333;
  var COL_BUNKER_WALL  = 0x445544;
  var COL_PIER_WOOD    = 0x8B6914;
  var COL_BOAT_HULL    = 0x334455;
  var COL_BOAT_CABIN   = 0x446688;
  var COL_WATER        = 0x1A4A7A;
  var COL_SOLDIER      = 0x334433;
  var COL_ELITE        = 0x223322;
  var COL_DAX          = 0x112211;
  var COL_ROCKET       = 0xFF6600;
  var COL_ROCKET_TIP   = 0xFFCC00;
  var COL_TRAIL        = 0xFF8800;
  var COL_FOUNTAIN     = 0x3388AA;
  var COL_RADAR        = 0x338833;
  var COL_HEDGEHOG     = 0x888899;
  var COL_WIRE         = 0x888866;
  var COL_TERMINAL     = 0x226622;
  var COL_HUD_BG       = 0x000000;

  /* ── module state ───────────────────────────────────────────────────────── */
  var _active    = false;
  var _scene     = null;
  var _camera    = null;
  var _audioCtx  = null;

  /* activation key tracking */
  var _iPressed  = false;
  var _fPressed  = false;
  var _iTime     = 0;
  var _fTime     = 0;

  /* timers */
  var _elapsed        = 0;
  var _beachPhase     = true;
  var _mgTimer        = 0;
  var _missileTimer   = 0;
  var _missileLaunched = false;
  var _gameOver       = false;
  var _gameWon        = false;

  /* player state */
  var _playerHP         = 100;
  var _playerCrouching  = false;
  var _nearHedgehog     = false;
  var _nearSiloTerminal = false;
  var _siloInteractProgress = 0;
  var _eHeld            = false;
  var _launchDestroyed  = false;
  var _daxDefeated      = false;
  var _reachedDock      = false;

  /* geometry pools */
  var _objects          = [];    // all spawned meshes for cleanup
  var _enemies          = [];    // { mesh, hp, maxHp, type, pos, fireTimer, dead, label }
  var _hedgehogs        = [];    // { mesh, pos }
  var _rockets          = [];    // { mesh, trail[], vel, pos, age }
  var _mgBullets        = [];    // { mesh, vel, pos, age }
  var _patrolBoat       = null;  // { group, hp, angle, fireTimer, destroyed }
  var _siloTerminal     = null;  // mesh
  var _siloTerminalPos  = null;  // THREE.Vector3
  var _daxEnemy         = null;  // enemy object ref
  var _fountainParts    = [];    // animated fountain spheres
  var _radarParts       = [];    // radar arm meshes
  var _radarAngle       = 0;
  var _boatAngle        = 0;
  var _mgNests          = [];    // { mesh, pos, angle, fireTimer }
  var _extractionDock   = null;  // mesh
  var _hudEl            = null;

  /* key state */
  var _keys = {};

  /* ── utility ────────────────────────────────────────────────────────────── */
  function _makeBox(w, h, d, color, x, y, z) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeCyl(rt, rb, h, segs, color, x, y, z) {
    var geo  = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeSphere(r, segs, color, x, y, z) {
    var geo  = new THREE.SphereGeometry(r, segs || 8, segs || 8);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeCone(r, h, segs, color, x, y, z) {
    var geo  = new THREE.ConeGeometry(r, h, segs || 8);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeLines(points, color) {
    var positions = [];
    for (var i = 0; i < points.length; i++) {
      positions.push(points[i].x, points[i].y, points[i].z);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var mat  = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function _add(mesh) {
    _scene.add(mesh);
    _objects.push(mesh);
    return mesh;
  }

  function _addGroup(group) {
    _scene.add(group);
    _objects.push(group);
    return group;
  }

  function _dist2d(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _playerPos() {
    return _camera.position;
  }

  function _tone(freq, dur, vol) {
    if (!_audioCtx) return;
    try {
      var osc  = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.15, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + dur);
      osc.start();
      osc.stop(_audioCtx.currentTime + dur);
    } catch (e) {}
  }

  function _playExplosion() {
    _tone(80,  0.4, 0.3);
    _tone(120, 0.3, 0.2);
  }

  function _playGunshot() {
    _tone(400, 0.08, 0.2);
    _tone(200, 0.12, 0.15);
  }

  function _playAlert() {
    _tone(880, 0.1, 0.2);
    _tone(660, 0.1, 0.2);
  }

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'if-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 16px',
      'border:1px solid #00FF88',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'min-width:340px',
      'text-align:center',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var beachStr = '';
    var missileStr = '';
    var boatStr = '';
    var daxStr = '';
    var objectiveStr = '';

    /* beach phase countdown */
    if (_beachPhase) {
      var beachLeft = Math.max(0, BEACH_PHASE_DURATION - _elapsed);
      beachStr = '<span style="color:#FF8844">BEACH ASSAULT: ' + Math.ceil(beachLeft) + 's — TAKE COVER!</span>';
    } else {
      beachStr = '<span style="color:#44FF88">BEACH CLEARED</span>';
    }

    /* missile countdown */
    if (!_launchDestroyed && !_missileLaunched) {
      var missileLeft = Math.max(0, MISSILE_LAUNCH_TIME - _elapsed);
      var col = missileLeft < 20 ? '#FF2222' : (missileLeft < 45 ? '#FFAA22' : '#FFFF44');
      missileStr = '<span style="color:' + col + '">MISSILE LAUNCH: T-' + Math.ceil(missileLeft) + 's</span>';
    } else if (_launchDestroyed) {
      missileStr = '<span style="color:#44FF88">LAUNCH CONTROLS: DESTROYED</span>';
    } else {
      missileStr = '<span style="color:#FF2222">MISSILES LAUNCHED!</span>';
    }

    /* patrol boat */
    if (_patrolBoat && !_patrolBoat.destroyed) {
      var boatCol = _patrolBoat.hp < 75 ? '#FF6644' : '#FFCC44';
      boatStr = '<span style="color:' + boatCol + '">PATROL BOAT HP: ' + _patrolBoat.hp + '</span>';
    } else if (_patrolBoat && _patrolBoat.destroyed) {
      boatStr = '<span style="color:#44FF88">PATROL BOAT: DESTROYED</span>';
    }

    /* Dax HP */
    if (_daxEnemy && !_daxEnemy.dead) {
      var daxPct = Math.round((_daxEnemy.hp / DAX_HP_MAX) * 100);
      var daxCol = daxPct < 25 ? '#FF2222' : (daxPct < 60 ? '#FF8800' : '#FF4444');
      daxStr = '<span style="color:' + daxCol + '">COMMANDER DAX: ' + _daxEnemy.hp + '/' + DAX_HP_MAX + ' HP</span>';
    } else if (_daxDefeated) {
      daxStr = '<span style="color:#44FF88">COMMANDER DAX: ELIMINATED</span>';
    }

    /* objectives */
    var objs = [];
    if (!_launchDestroyed) objs.push('[ ] Destroy Launch Controls (hold E at silo terminal)');
    else objs.push('[X] Launch Controls Destroyed');
    if (!_daxDefeated) objs.push('[ ] Eliminate Commander Dax');
    else objs.push('[X] Commander Dax Eliminated');
    if (!_reachedDock) objs.push('[ ] Reach Extraction Dock');
    else objs.push('[X] Extraction Complete');
    objectiveStr = '<div style="color:#AAAAAA;font-size:11px;margin-top:4px">' + objs.join(' | ') + '</div>';

    /* silo interact progress */
    var siloStr = '';
    if (_nearSiloTerminal && !_launchDestroyed) {
      var pct = Math.round((_siloInteractProgress / SILO_INTERACT_TIME) * 100);
      siloStr = '<div style="color:#00FFFF">HACKING TERMINAL: ' + pct + '% [hold E]</div>';
    }

    /* player HP */
    var hpCol = _playerHP < 30 ? '#FF2222' : (_playerHP < 60 ? '#FFAA22' : '#44FF88');
    var hpStr = '<span style="color:' + hpCol + '">HP: ' + Math.max(0, _playerHP) + '</span>';

    /* cover status */
    var coverStr = (_playerCrouching && _nearHedgehog)
      ? '<span style="color:#44FFFF"> [COVER -50% DMG]</span>' : '';

    _hudEl.innerHTML = [
      '<b style="color:#FFD700">ISLAND FORTRESS</b>',
      hpStr + coverStr,
      beachStr,
      missileStr,
      boatStr,
      daxStr,
      siloStr,
      objectiveStr
    ].filter(Boolean).join('<br>');

    if (_gameWon) {
      _hudEl.innerHTML = '<span style="color:#FFD700;font-size:18px">MISSION COMPLETE — ISLAND FORTRESS TAKEN!</span>';
    } else if (_gameOver) {
      _hudEl.innerHTML = '<span style="color:#FF2222;font-size:18px">MISSION FAILED</span>';
    }
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
  }

  /* ── environment builders ───────────────────────────────────────────────── */
  function _buildOcean() {
    var ocean = _makeBox(250, 0.5, 250, COL_WATER, 0, -1, 0);
    _add(ocean);
  }

  function _buildBeach() {
    /* main beach strip */
    var beach = _makeBox(BEACH_WIDTH, 0.5, BEACH_DEPTH, COL_SAND, 0, 0, 30);
    _add(beach);

    /* sand dunes */
    for (var i = 0; i < 5; i++) {
      var dune = _makeBox(12 + Math.random() * 8, 1.5, 6, COL_SAND_DARK,
        -30 + i * 14, 0.8, 22 + Math.random() * 8);
      _add(dune);
    }

    /* island grass interior */
    var grass = _makeBox(120, 0.5, 100, COL_GRASS, 0, 0, -20);
    _add(grass);
  }

  function _buildHedgehogs() {
    /* Czech hedgehog tank traps — BoxGeometry beams + LineSegments */
    for (var i = 0; i < HEDGEHOG_COUNT; i++) {
      var group = new THREE.Group();
      var hx = -30 + i * 8 + (Math.random() - 0.5) * 3;
      var hz = 18 + (Math.random() - 0.5) * 6;

      /* three intersecting steel beams */
      var beam1 = _makeBox(0.3, 0.3, 3.0, COL_HEDGEHOG, 0, 0, 0);
      var beam2 = _makeBox(3.0, 0.3, 0.3, COL_HEDGEHOG, 0, 0, 0);
      var beam3 = _makeBox(0.3, 3.0, 0.3, COL_HEDGEHOG, 0, 0, 0);
      var beam4 = _makeBox(2.2, 0.3, 0.3, COL_HEDGEHOG, 0, 0, 0);
      beam4.rotation.y = Math.PI / 4;
      var beam5 = _makeBox(0.3, 0.3, 2.2, COL_HEDGEHOG, 0, 0, 0);
      beam5.rotation.z = Math.PI / 4;

      group.add(beam1);
      group.add(beam2);
      group.add(beam3);
      group.add(beam4);
      group.add(beam5);

      /* barbed wire line segments around hedgehog */
      var wirePoints = [];
      for (var w = 0; w < 8; w++) {
        var ang = (w / 8) * Math.PI * 2;
        var nang = ((w + 1) / 8) * Math.PI * 2;
        wirePoints.push(new THREE.Vector3(Math.cos(ang) * 2.2, 0.8, Math.sin(ang) * 2.2));
        wirePoints.push(new THREE.Vector3(Math.cos(nang) * 2.2, 0.8, Math.sin(nang) * 2.2));
      }
      var wireLines = _makeLines(wirePoints, COL_WIRE);
      group.add(wireLines);

      group.position.set(hx, 1.0, hz);
      _addGroup(group);
      _hedgehogs.push({ group: group, pos: new THREE.Vector3(hx, 1.0, hz) });
    }
  }

  function _buildFortressWalls() {
    /* outer wall segments — north, east, west sides */
    var wallDefs = [
      /* north wall */
      { w: 70, h: FORTRESS_WALL_H, d: FORTRESS_WALL_T, x: 0,   y: FORTRESS_WALL_H / 2, z: -30 },
      /* east wall */
      { w: FORTRESS_WALL_T, h: FORTRESS_WALL_H, d: 60, x: 35,  y: FORTRESS_WALL_H / 2, z: -5  },
      /* west wall */
      { w: FORTRESS_WALL_T, h: FORTRESS_WALL_H, d: 60, x: -35, y: FORTRESS_WALL_H / 2, z: -5  },
      /* south gate left */
      { w: 28, h: FORTRESS_WALL_H, d: FORTRESS_WALL_T, x: -21, y: FORTRESS_WALL_H / 2, z: 20  },
      /* south gate right */
      { w: 28, h: FORTRESS_WALL_H, d: FORTRESS_WALL_T, x: 21,  y: FORTRESS_WALL_H / 2, z: 20  },
      /* gate arch top */
      { w: 14, h: 3, d: FORTRESS_WALL_T, x: 0, y: FORTRESS_WALL_H - 1.5, z: 20 }
    ];

    for (var i = 0; i < wallDefs.length; i++) {
      var wd = wallDefs[i];
      var wall = _makeBox(wd.w, wd.h, wd.d, COL_STONE, wd.x, wd.y, wd.z);
      _add(wall);
    }

    /* battlements on north wall */
    for (var b = 0; b < 10; b++) {
      var bx = -32 + b * 7;
      var battlement = _makeBox(3, 2, FORTRESS_WALL_T + 0.5, COL_STONE_DARK,
        bx, FORTRESS_WALL_H + 1, -30);
      _add(battlement);
    }

    /* battlements on east wall */
    for (var be = 0; be < 8; be++) {
      var bz = -30 + be * 7;
      var batE = _makeBox(FORTRESS_WALL_T + 0.5, 2, 3, COL_STONE_DARK,
        35, FORTRESS_WALL_H + 1, bz);
      _add(batE);
    }

    /* battlements on west wall */
    for (var bw = 0; bw < 8; bw++) {
      var bwz = -30 + bw * 7;
      var batW = _makeBox(FORTRESS_WALL_T + 0.5, 2, 3, COL_STONE_DARK,
        -35, FORTRESS_WALL_H + 1, bwz);
      _add(batW);
    }

    /* corner towers */
    var corners = [
      { x: 35,  z: -30 }, { x: -35, z: -30 },
      { x: 35,  z: 20  }, { x: -35, z: 20  }
    ];
    for (var c = 0; c < corners.length; c++) {
      var tower = _makeCyl(4, 4, FORTRESS_WALL_H + 4, 8, COL_STONE,
        corners[c].x, (FORTRESS_WALL_H + 4) / 2, corners[c].z);
      _add(tower);
      /* tower cap */
      var cap = _makeCone(4.5, 4, 8, COL_STONE_DARK,
        corners[c].x, FORTRESS_WALL_H + 4 + 2, corners[c].z);
      _add(cap);
    }
  }

  function _buildCourtyard() {
    /* paved courtyard floor */
    var court = _makeBox(COURTYARD_SIZE, 0.3, COURTYARD_SIZE, 0x8A8A8A, 0, 0.15, -8);
    _add(court);

    /* fountain base */
    var fBase = _makeCyl(FOUNTAIN_RADIUS + 1.5, FOUNTAIN_RADIUS + 1.5, FOUNTAIN_HEIGHT, 12,
      COL_STONE, 0, FOUNTAIN_HEIGHT / 2, -8);
    _add(fBase);

    /* fountain basin */
    var fBasin = _makeCyl(FOUNTAIN_RADIUS, FOUNTAIN_RADIUS, 0.5, 12,
      COL_STONE_DARK, 0, FOUNTAIN_HEIGHT + 0.25, -8);
    _add(fBasin);

    /* fountain center column */
    var fCol = _makeCyl(0.5, 0.5, 3, 8, COL_STONE_DARK, 0, FOUNTAIN_HEIGHT + 1.5, -8);
    _add(fCol);

    /* fountain water spheres (animated) */
    for (var fw = 0; fw < 6; fw++) {
      var ang = (fw / 6) * Math.PI * 2;
      var fs = _makeSphere(0.25, 6, COL_FOUNTAIN,
        Math.cos(ang) * 1.0, FOUNTAIN_HEIGHT + 3.5, -8 + Math.sin(ang) * 1.0);
      _add(fs);
      _fountainParts.push({ mesh: fs, angle: ang, baseY: FOUNTAIN_HEIGHT + 3.5 });
    }
  }

  function _buildBarracks() {
    /* long barracks building east side */
    var barrMain = _makeBox(24, 5, 10, COL_BARRACKS, 22, 2.5, -10);
    _add(barrMain);
    /* roof */
    var barrRoof = _makeCone(9, 3, 4, 0x667766, 22, 6.5, -10);
    _add(barrRoof);
    /* windows */
    for (var bw2 = 0; bw2 < 4; bw2++) {
      var win = _makeBox(1.2, 1.5, 0.2, 0x445566, 12 + bw2 * 5, 3, -4.9);
      _add(win);
    }
    /* bunk interiors visible through door */
    var bunk1 = _makeBox(4, 1, 1.5, COL_PIER_WOOD, 15, 1.0, -10);
    _add(bunk1);
    var bunk2 = _makeBox(4, 1, 1.5, COL_PIER_WOOD, 15, 2.5, -10);
    _add(bunk2);
    var bunk3 = _makeBox(4, 1, 1.5, COL_PIER_WOOD, 21, 1.0, -10);
    _add(bunk3);
    var bunk4 = _makeBox(4, 1, 1.5, COL_PIER_WOOD, 21, 2.5, -10);
    _add(bunk4);
    /* barracks west side */
    var barrW = _makeBox(20, 4, 8, COL_BARRACKS, -22, 2.0, -10);
    _add(barrW);
    var barrWRoof = _makeCone(7, 2.5, 4, 0x667766, -22, 5.25, -10);
    _add(barrWRoof);
  }

  function _buildMissileSilo() {
    /* silo cylinder */
    var silo = _makeCyl(7, 7, 18, 16, COL_SILO, -8, 9, -38);
    _add(silo);

    /* silo rim */
    var siloRim = _makeCyl(7.5, 7.5, 1, 16, COL_STONE_DARK, -8, 18.5, -38);
    _add(siloRim);

    /* missile inside silo — body */
    var missileBody = _makeCyl(1.8, 1.8, 14, 12, COL_MISSILE_BODY, -8, 10, -38);
    _add(missileBody);

    /* missile nose cone */
    var missileCone = _makeCone(1.8, 5, 12, COL_MISSILE_CONE, -8, 19.5, -38);
    _add(missileCone);

    /* second missile */
    var missileBody2 = _makeCyl(1.8, 1.8, 14, 12, COL_MISSILE_BODY, 2, 10, -38);
    _add(missileBody2);
    var missileCone2 = _makeCone(1.8, 5, 12, COL_MISSILE_CONE, 2, 19.5, -38);
    _add(missileCone2);
    var silo2 = _makeCyl(7, 7, 18, 16, COL_SILO, 2, 9, -38);
    _add(silo2);
    var silo2Rim = _makeCyl(7.5, 7.5, 1, 16, COL_STONE_DARK, 2, 18.5, -38);
    _add(silo2Rim);

    /* launch control terminal */
    var terminal = _makeBox(1.5, 2.5, 0.8, COL_TERMINAL, -3, 1.25, -32);
    _add(terminal);
    _siloTerminal = terminal;
    _siloTerminalPos = new THREE.Vector3(-3, 1.25, -32);

    /* terminal screen */
    var screen = _makeBox(1.2, 1.8, 0.1, 0x00AA44, -3, 1.5, -31.65);
    _add(screen);

    /* support structures */
    for (var sp = 0; sp < 4; sp++) {
      var sAng = (sp / 4) * Math.PI * 2;
      var sSupport = _makeBox(1.2, 18, 1.2, COL_STONE_DARK,
        -8 + Math.cos(sAng) * 8.5, 9, -38 + Math.sin(sAng) * 8.5);
      _add(sSupport);
    }
  }

  function _buildCommandBunker() {
    /* underground bunker entrance ramp */
    var ramp = _makeBox(8, 0.5, 12, COL_STONE_DARK, 20, -0.5, -40);
    ramp.rotation.x = -0.2;
    _add(ramp);

    /* bunker roof (partially buried) */
    var bunkerTop = _makeBox(22, 1.5, 18, COL_BUNKER_WALL, 20, 0.5, -48);
    _add(bunkerTop);

    /* bunker walls */
    var bWall1 = _makeBox(22, 6, 1.5, COL_BUNKER_WALL, 20, -2.5, -39);
    _add(bWall1);
    var bWall2 = _makeBox(22, 6, 1.5, COL_BUNKER_WALL, 20, -2.5, -57);
    _add(bWall2);
    var bWall3 = _makeBox(1.5, 6, 18, COL_BUNKER_WALL, 9,  -2.5, -48);
    _add(bWall3);
    var bWall4 = _makeBox(1.5, 6, 18, COL_BUNKER_WALL, 31, -2.5, -48);
    _add(bWall4);
    /* bunker floor */
    var bFloor = _makeBox(22, 0.5, 18, 0x555555, 20, -5.75, -48);
    _add(bFloor);

    /* radar equipment */
    var radarBase = _makeCyl(1.5, 1.5, 1, 8, COL_STONE_DARK, 20, -5.5, -48);
    _add(radarBase);
    var radarPole = _makeCyl(0.2, 0.2, 3, 6, COL_RADAR, 20, -4, -48);
    _add(radarPole);
    /* radar arm — rotates in update */
    var radarArm = _makeBox(3, 0.2, 0.4, COL_RADAR, 20, -2.5, -48);
    _add(radarArm);
    _radarParts.push(radarArm);

    /* radar dish */
    var dish = _makeCyl(1.8, 0.3, 0.4, 8, 0x55AA55, 21.5, -2.5, -48);
    dish.rotation.z = Math.PI / 2;
    _add(dish);
    _radarParts.push(dish);

    /* command consoles */
    var console1 = _makeBox(5, 2, 1, 0x334433, 14, -4.5, -50);
    _add(console1);
    var console2 = _makeBox(5, 2, 1, 0x334433, 26, -4.5, -50);
    _add(console2);
    var screen1 = _makeBox(4, 1.5, 0.1, 0x00AA44, 14, -4.25, -49.55);
    _add(screen1);
    var screen2 = _makeBox(4, 1.5, 0.1, 0x00AA44, 26, -4.25, -49.55);
    _add(screen2);
  }

  function _buildDock() {
    /* wooden pier */
    var pier = _makeBox(20, 0.5, 5, COL_PIER_WOOD, DOCK_POS_X, 0.25, DOCK_POS_Z);
    _add(pier);
    _extractionDock = pier;

    /* pier planks detail */
    for (var pl = 0; pl < 8; pl++) {
      var plank = _makeBox(20, 0.15, 0.3, 0x7A5A10, DOCK_POS_X, 0.55, DOCK_POS_Z - 2 + pl * 0.6);
      _add(plank);
    }

    /* pier posts */
    for (var pp = 0; pp < 5; pp++) {
      var post = _makeCyl(0.25, 0.25, 4, 6, 0x8B5E0A,
        DOCK_POS_X - 8 + pp * 4, -1.5, DOCK_POS_Z);
      _add(post);
    }

    /* extraction sign */
    var sign = _makeBox(3, 1.5, 0.2, 0x225522, DOCK_POS_X, 3, DOCK_POS_Z - 2);
    _add(sign);
  }

  function _buildPatrolBoat() {
    var group = new THREE.Group();

    /* hull */
    var hull = _makeBox(12, 2, 4, COL_BOAT_HULL, 0, 0, 0);
    group.add(hull);

    /* cabin */
    var cabin = _makeCyl(1.8, 1.8, 3, 8, COL_BOAT_CABIN, 0, 2.5, 0);
    group.add(cabin);

    /* cabin roof */
    var cabRoof = _makeCyl(2, 2, 0.3, 8, COL_STONE_DARK, 0, 4.2, 0);
    group.add(cabRoof);

    /* mounted gun barrel */
    var gunBase = _makeBox(0.8, 0.8, 0.8, 0x666666, 4, 4, 0);
    group.add(gunBase);
    var gunBarrel = _makeBox(0.3, 0.3, 3, 0x555555, 4, 4, -2);
    group.add(gunBarrel);

    /* bow */
    var bow = _makeCone(2, 3, 4, COL_BOAT_HULL, 7, 0, 0);
    bow.rotation.z = -Math.PI / 2;
    group.add(bow);

    group.position.set(PATROL_BOAT_RADIUS, 0.5, 0);
    _scene.add(group);
    _objects.push(group);

    _patrolBoat = {
      group: group,
      hp: PATROL_BOAT_HP,
      angle: 0,
      fireTimer: PATROL_BOAT_FIRE_RATE * 0.5,
      destroyed: false
    };
  }

  function _buildMGNests() {
    /* machine gun nests on beach walls and gate area */
    var nestDefs = [
      { x: -28, z: 18 }, { x: 0, z: 18 }, { x: 28, z: 18 }
    ];
    for (var n = 0; n < nestDefs.length; n++) {
      var nd = nestDefs[n];
      /* sandbag ring */
      var ring = _makeCyl(2.5, 2.5, 1.0, 8, 0x887766, nd.x, 0.5, nd.z);
      _add(ring);
      /* MG tripod */
      var mgBody = _makeBox(0.5, 0.8, 1.2, 0x444444, nd.x, 1.4, nd.z);
      _add(mgBody);
      var mgBarrel = _makeBox(0.2, 0.2, 2.0, 0x333333, nd.x, 1.6, nd.z - 1.5);
      _add(mgBarrel);
      _mgNests.push({
        pos: new THREE.Vector3(nd.x, 1.0, nd.z),
        fireTimer: MG_FIRE_INTERVAL * (0.3 + n * 0.3)
      });
    }
  }

  /* ── enemy spawning ─────────────────────────────────────────────────────── */
  function _spawnEnemy(type, x, y, z) {
    var color, hp, label, detectRange;
    if (type === 'soldier') {
      color = COL_SOLDIER;
      hp = ENEMY_SOLDIER_HP;
      label = 'Soldier';
      detectRange = SOLDIER_DETECT_RANGE;
    } else if (type === 'elite') {
      color = COL_ELITE;
      hp = ENEMY_ELITE_HP;
      label = 'Elite Garrison';
      detectRange = ELITE_DETECT_RANGE;
    } else if (type === 'dax') {
      color = COL_DAX;
      hp = DAX_HP_MAX;
      label = 'Commander Dax';
      detectRange = DAX_DETECT_RANGE;
    }

    var group = new THREE.Group();

    /* body */
    var body = _makeBox(1, 1.6, 0.8, color, 0, 0.8, 0);
    group.add(body);

    /* head */
    var head = _makeSphere(0.4, 6, color, 0, 1.9, 0);
    group.add(head);

    /* legs */
    var legL = _makeBox(0.35, 1, 0.35, color, -0.25, -0.1, 0);
    var legR = _makeBox(0.35, 1, 0.35, color, 0.25, -0.1, 0);
    group.add(legL);
    group.add(legR);

    /* arms */
    var armL = _makeBox(0.3, 1, 0.3, color, -0.7, 0.7, 0);
    var armR = _makeBox(0.3, 1, 0.3, color, 0.7, 0.7, 0);
    group.add(armL);
    group.add(armR);

    /* helmet for elite and dax */
    if (type === 'elite' || type === 'dax') {
      var helmet = _makeCyl(0.42, 0.42, 0.25, 8, 0x111111, 0, 2.25, 0);
      group.add(helmet);
    }

    /* Dax rocket launcher */
    if (type === 'dax') {
      var launcher = _makeCyl(0.3, 0.3, 2.5, 6, 0x444444, 1.2, 1.0, 0);
      launcher.rotation.z = Math.PI / 2;
      group.add(launcher);
    }

    group.position.set(x, y || 0, z);
    _scene.add(group);
    _objects.push(group);

    var enemy = {
      group: group,
      hp: hp,
      maxHp: hp,
      type: type,
      pos: new THREE.Vector3(x, y || 0, z),
      fireTimer: ENEMY_FIRE_INTERVAL * (0.5 + Math.random()),
      rocketTimer: type === 'dax' ? ROCKET_FIRE_INTERVAL : 0,
      dead: false,
      label: label,
      detectRange: detectRange,
      alerted: false,
      patrolOffset: Math.random() * Math.PI * 2,
      patrolRadius: 3 + Math.random() * 4
    };

    _enemies.push(enemy);
    return enemy;
  }

  function _spawnAllEnemies() {
    /* beach defense soldiers */
    for (var b = 0; b < 5; b++) {
      _spawnEnemy('soldier', -25 + b * 12, 0, 15 + Math.random() * 8);
    }

    /* gate / south wall soldiers */
    _spawnEnemy('soldier', -15, 0, 22);
    _spawnEnemy('soldier', 15, 0, 22);
    _spawnEnemy('soldier', 0, FORTRESS_WALL_H, 20);

    /* courtyard soldiers */
    _spawnEnemy('soldier', -10, 0, -5);
    _spawnEnemy('soldier', 10, 0, -5);
    _spawnEnemy('soldier', -5, 0, -15);
    _spawnEnemy('soldier', 5, 0, -15);

    /* barracks soldiers */
    _spawnEnemy('soldier', 20, 0, -8);
    _spawnEnemy('soldier', 25, 0, -14);

    /* elite silo guards */
    _spawnEnemy('elite', -12, 0, -34);
    _spawnEnemy('elite', -4, 0, -34);
    _spawnEnemy('elite', 3, 0, -34);

    /* elite interior guards */
    _spawnEnemy('elite', 0, 0, -20);
    _spawnEnemy('elite', -18, 0, -25);
    _spawnEnemy('elite', 20, -5.5, -48);

    /* Commander Dax in bunker */
    _daxEnemy = _spawnEnemy('dax', 20, -5.5, -52);
  }

  /* ── projectile spawning ────────────────────────────────────────────────── */
  function _spawnRocket(fromPos) {
    var pPos = _playerPos();
    var dx = pPos.x - fromPos.x;
    var dy = pPos.y - fromPos.y;
    var dz = pPos.z - fromPos.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    var rGroup = new THREE.Group();

    /* rocket body */
    var rBody = _makeCyl(0.25, 0.25, 1.2, 6, COL_ROCKET, 0, 0, 0);
    rGroup.add(rBody);

    /* rocket cone tip */
    var rTip = _makeCone(0.25, 0.5, 6, COL_ROCKET_TIP, 0, 0.85, 0);
    rGroup.add(rTip);

    rGroup.position.copy(fromPos);
    rGroup.position.y += 1;
    _scene.add(rGroup);

    /* initial trail spheres */
    var trail = [];
    for (var t = 0; t < 6; t++) {
      var ts = _makeSphere(0.15, 4, COL_TRAIL, fromPos.x, fromPos.y + 1, fromPos.z);
      _scene.add(ts);
      trail.push({ mesh: ts, age: 0 });
    }

    _rockets.push({
      group: rGroup,
      trail: trail,
      vel: new THREE.Vector3(dx / len * ROCKET_SPEED, dy / len * ROCKET_SPEED, dz / len * ROCKET_SPEED),
      pos: rGroup.position.clone(),
      age: 0
    });

    _tone(300, 0.3, 0.2);
    _tone(150, 0.5, 0.2);
  }

  /* ── player interaction ─────────────────────────────────────────────────── */
  function _checkHedgehogCover() {
    var pPos = _playerPos();
    _nearHedgehog = false;
    for (var i = 0; i < _hedgehogs.length; i++) {
      var hh = _hedgehogs[i];
      if (_dist3(pPos, hh.pos) < 3.5) {
        _nearHedgehog = true;
        break;
      }
    }
  }

  function _checkSiloTerminal() {
    var pPos = _playerPos();
    _nearSiloTerminal = false;
    if (_siloTerminalPos && !_launchDestroyed) {
      if (_dist3(pPos, _siloTerminalPos) < SILO_INTERACT_DIST) {
        _nearSiloTerminal = true;
      }
    }
  }

  function _checkExtraction() {
    if (!_launchDestroyed || !_daxDefeated) return;
    var pPos = _playerPos();
    var dockPos = new THREE.Vector3(DOCK_POS_X, 0, DOCK_POS_Z);
    if (_dist3(pPos, dockPos) < EXTRACT_DIST) {
      _reachedDock = true;
      _gameWon = true;
      _tone(880, 0.15, 0.25);
      _tone(1100, 0.2, 0.25);
      _tone(1320, 0.3, 0.25);
    }
  }

  function _damagePlayer(dmg) {
    var actualDmg = dmg;
    if (_playerCrouching && _nearHedgehog) {
      actualDmg = dmg * HEDGEHOG_DAMAGE_REDUCE;
    }
    _playerHP -= actualDmg;
    _tone(220, 0.1, 0.3);
    if (_playerHP <= 0) {
      _playerHP = 0;
      _gameOver = true;
    }
  }

  function _damageEnemy(enemy, dmg) {
    if (enemy.dead) return;
    enemy.hp -= dmg;
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.dead = true;
      enemy.group.visible = false;
      if (enemy === _daxEnemy) {
        _daxDefeated = true;
        _playExplosion();
        _playAlert();
      } else {
        _playGunshot();
      }
    }
  }

  function _shootAtPlayer(enemy, dt) {
    var pPos = _playerPos();
    var d = _dist3(pPos, enemy.pos);
    if (d > SOLDIER_FIRE_RANGE) return;
    enemy.fireTimer -= dt;
    if (enemy.fireTimer <= 0) {
      enemy.fireTimer = ENEMY_FIRE_INTERVAL + Math.random() * 1.5;
      _damagePlayer(ENEMY_FIRE_DAMAGE);
      _playGunshot();
    }
  }

  /* ── update subsystems ──────────────────────────────────────────────────── */
  function _updateBeachPhase(dt) {
    if (!_beachPhase) return;
    if (_elapsed >= BEACH_PHASE_DURATION) {
      _beachPhase = false;
      return;
    }

    /* machine gun nests fire at player on beach */
    for (var n = 0; n < _mgNests.length; n++) {
      var nest = _mgNests[n];
      nest.fireTimer -= dt;
      if (nest.fireTimer <= 0) {
        nest.fireTimer = MG_FIRE_INTERVAL;
        var pPos = _playerPos();
        var d = _dist3(pPos, nest.pos);
        if (d < 40) {
          _damagePlayer(MG_DAMAGE);
          _playGunshot();
          _tone(600, 0.05, 0.15);
        }
      }
    }
  }

  function _updateMissileCountdown(dt) {
    if (_launchDestroyed || _missileLaunched || _gameOver) return;
    if (_elapsed >= MISSILE_LAUNCH_TIME) {
      _missileLaunched = true;
      _damagePlayer(80);
      _playExplosion();
      _playAlert();
      /* game over if both conditions not met */
      if (!_daxDefeated) {
        _gameOver = true;
      }
    }
  }

  function _updateSiloInteract(dt) {
    if (!_nearSiloTerminal || _launchDestroyed) {
      if (!_eHeld) _siloInteractProgress = 0;
      return;
    }
    if (_eHeld) {
      _siloInteractProgress += dt;
      if (_siloInteractProgress >= SILO_INTERACT_TIME) {
        _launchDestroyed = true;
        _siloInteractProgress = SILO_INTERACT_TIME;
        _tone(1000, 0.3, 0.25);
        _tone(800, 0.2, 0.2);
        /* darken terminal to indicate destroyed */
        if (_siloTerminal) {
          _siloTerminal.material.color.setHex(0x002200);
        }
      }
    } else {
      _siloInteractProgress = Math.max(0, _siloInteractProgress - dt * 0.5);
    }
  }

  function _updatePatrolBoat(dt) {
    if (!_patrolBoat || _patrolBoat.destroyed) return;

    _boatAngle += (PATROL_BOAT_SPEED / PATROL_BOAT_RADIUS) * dt;
    var bx = Math.cos(_boatAngle) * PATROL_BOAT_RADIUS;
    var bz = Math.sin(_boatAngle) * PATROL_BOAT_RADIUS;
    _patrolBoat.group.position.set(bx, 0.5, bz);
    _patrolBoat.group.rotation.y = -_boatAngle + Math.PI / 2;

    /* fire at player */
    _patrolBoat.fireTimer -= dt;
    if (_patrolBoat.fireTimer <= 0) {
      _patrolBoat.fireTimer = PATROL_BOAT_FIRE_RATE;
      var pPos = _playerPos();
      var boatPos = _patrolBoat.group.position;
      var d = _dist3(pPos, boatPos);
      if (d < 50) {
        _damagePlayer(PATROL_BOAT_DAMAGE);
        _playGunshot();
      }
    }
  }

  function _updateEnemies(dt) {
    for (var i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (enemy.dead) continue;

      var pPos = _playerPos();
      var d = _dist3(pPos, enemy.pos);

      /* check if alerted */
      if (d < enemy.detectRange) {
        enemy.alerted = true;
      }

      if (!enemy.alerted) {
        /* patrol */
        enemy.patrolOffset += dt * 0.5;
        enemy.group.position.x = enemy.pos.x + Math.cos(enemy.patrolOffset) * enemy.patrolRadius * 0.3;
        enemy.group.position.z = enemy.pos.z + Math.sin(enemy.patrolOffset) * enemy.patrolRadius * 0.3;
        continue;
      }

      /* face player */
      var angleToPlayer = Math.atan2(pPos.x - enemy.pos.x, pPos.z - enemy.pos.z);
      enemy.group.rotation.y = angleToPlayer;

      /* Dax fires rockets */
      if (enemy.type === 'dax') {
        enemy.rocketTimer -= dt;
        if (enemy.rocketTimer <= 0 && d < 40) {
          enemy.rocketTimer = ROCKET_FIRE_INTERVAL;
          _spawnRocket(enemy.pos);
        }
        /* Dax also shoots normal */
        _shootAtPlayer(enemy, dt);
      } else {
        _shootAtPlayer(enemy, dt);
      }
    }
  }

  function _updateRockets(dt) {
    for (var r = _rockets.length - 1; r >= 0; r--) {
      var rocket = _rockets[r];
      rocket.age += dt;

      /* update position */
      rocket.group.position.x += rocket.vel.x * dt;
      rocket.group.position.y += rocket.vel.y * dt;
      rocket.group.position.z += rocket.vel.z * dt;
      rocket.pos.copy(rocket.group.position);

      /* orient rocket */
      rocket.group.rotation.x = Math.atan2(rocket.vel.y, Math.sqrt(rocket.vel.x * rocket.vel.x + rocket.vel.z * rocket.vel.z));
      rocket.group.rotation.y = Math.atan2(rocket.vel.x, rocket.vel.z);

      /* update trail */
      for (var t = 0; t < rocket.trail.length; t++) {
        var tr = rocket.trail[t];
        tr.age += dt;
        var trailLag = t * 0.08;
        tr.mesh.position.x = rocket.pos.x - rocket.vel.x * (trailLag + tr.age * 0.1);
        tr.mesh.position.y = rocket.pos.y - rocket.vel.y * (trailLag + tr.age * 0.1);
        tr.mesh.position.z = rocket.pos.z - rocket.vel.z * (trailLag + tr.age * 0.1);
        var alpha = Math.max(0, 1 - tr.age * 3);
        tr.mesh.material.opacity = alpha;
        tr.mesh.material.transparent = true;
        tr.mesh.scale.setScalar(1 - tr.age * 0.5);
      }

      /* check hit on player */
      var pPos = _playerPos();
      var hitDist = _dist3(rocket.pos, pPos);
      var expired = rocket.age > 8;

      if (hitDist < 2.5 || expired) {
        if (hitDist < 2.5) {
          _damagePlayer(ROCKET_DAMAGE);
          _playExplosion();
        }
        /* cleanup */
        _scene.remove(rocket.group);
        for (var tc = 0; tc < rocket.trail.length; tc++) {
          _scene.remove(rocket.trail[tc].mesh);
        }
        _rockets.splice(r, 1);
      }
    }
  }

  function _updatePatrolBoatShots(dt) {
    /* patrol boat shots handled in _updatePatrolBoat */
  }

  function _updatePatrolBoatDamage() {
    /* check if player shot patrol boat — done via _handleShoot */
  }

  function _updateFountain(elapsed) {
    for (var f = 0; f < _fountainParts.length; f++) {
      var fp = _fountainParts[f];
      var t = elapsed * 2 + fp.angle;
      fp.mesh.position.y = fp.baseY + Math.abs(Math.sin(t)) * 0.8;
      fp.mesh.position.x = Math.cos(fp.angle + elapsed * 0.5) * 0.8;
      fp.mesh.position.z = -8 + Math.sin(fp.angle + elapsed * 0.5) * 0.8;
    }
  }

  function _updateRadar(dt) {
    _radarAngle += dt * 1.2;
    for (var r = 0; r < _radarParts.length; r++) {
      _radarParts[r].position.x = 20 + Math.cos(_radarAngle) * 1.5;
      _radarParts[r].position.z = -48 + Math.sin(_radarAngle) * 1.5;
      _radarParts[r].rotation.y = _radarAngle;
    }
  }

  /* ── player shooting (called from keydown) ──────────────────────────────── */
  function _handleShoot() {
    if (!_active || _gameOver || _gameWon) return;
    var pPos = _playerPos();
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);

    /* raycasting approximation: check each enemy and patrol boat */
    var bestDist = 999;
    var bestEnemy = null;

    for (var i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (enemy.dead) continue;
      var toEnemy = new THREE.Vector3(
        enemy.pos.x - pPos.x,
        enemy.pos.y - pPos.y,
        enemy.pos.z - pPos.z
      );
      var dist = toEnemy.length();
      if (dist > 40) continue;
      toEnemy.normalize();
      var dot = dir.dot(toEnemy);
      if (dot > 0.92 && dist < bestDist) {
        bestDist = dist;
        bestEnemy = enemy;
      }
    }

    if (bestEnemy) {
      var dmg = 18 + Math.floor(Math.random() * 10);
      _damageEnemy(bestEnemy, dmg);
      _playGunshot();
      return;
    }

    /* check patrol boat */
    if (_patrolBoat && !_patrolBoat.destroyed) {
      var boatPos = _patrolBoat.group.position;
      var toBoat = new THREE.Vector3(
        boatPos.x - pPos.x,
        boatPos.y - pPos.y,
        boatPos.z - pPos.z
      );
      var bDist = toBoat.length();
      if (bDist < 60) {
        toBoat.normalize();
        var bDot = dir.dot(toBoat);
        if (bDot > 0.95) {
          _patrolBoat.hp -= 25 + Math.floor(Math.random() * 15);
          _playGunshot();
          if (_patrolBoat.hp <= 0) {
            _patrolBoat.hp = 0;
            _patrolBoat.destroyed = true;
            _patrolBoat.group.visible = false;
            _playExplosion();
          }
        }
      }
    }
  }

  /* ── key event handlers ─────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    var key = e.key.toLowerCase();
    _keys[key] = true;

    /* activation sequence: I then F within 400ms */
    if (key === 'i') {
      _iPressed = true;
      _iTime = performance.now();
    }
    if (key === 'f' && !_active) {
      _fPressed = true;
      _fTime = performance.now();
      if (_iPressed && (_fTime - _iTime) < ACTIVATION_WINDOW) {
        _activate();
      }
    }
    if (key === 'f' && _iPressed && _active) {
      /* ignore F in-game for other purposes */
    }

    if (!_active) return;

    /* E for silo terminal */
    if (key === 'e') {
      _eHeld = true;
    }

    /* crouch */
    if (key === 'c' || key === 'control') {
      _playerCrouching = true;
    }

    /* shoot on click handled separately; mouse button via document */
  }

  function _onKeyUp(e) {
    var key = e.key.toLowerCase();
    _keys[key] = false;
    if (key === 'i') _iPressed = false;
    if (key === 'f') _fPressed = false;
    if (key === 'e') {
      _eHeld = false;
    }
    if (key === 'c' || key === 'control') {
      _playerCrouching = false;
    }
  }

  function _onMouseDown(e) {
    if (!_active || _gameOver || _gameWon) return;
    if (e.button === 0) {
      _handleShoot();
    }
  }

  /* ── activation / deactivation ──────────────────────────────────────────── */
  function _activate() {
    if (_active) return;
    _active = true;
    _elapsed = 0;
    _beachPhase = true;
    _mgTimer = 0;
    _missileTimer = 0;
    _missileLaunched = false;
    _gameOver = false;
    _gameWon = false;
    _playerHP = 100;
    _playerCrouching = false;
    _nearHedgehog = false;
    _nearSiloTerminal = false;
    _siloInteractProgress = 0;
    _eHeld = false;
    _launchDestroyed = false;
    _daxDefeated = false;
    _reachedDock = false;
    _boatAngle = 0;
    _radarAngle = 0;

    /* setup lighting */
    var sun = new THREE.DirectionalLight(0xFFEECC, 1.2);
    sun.position.set(50, 80, 30);
    _scene.add(sun);
    _objects.push(sun);

    var ambient = new THREE.AmbientLight(0x334455, 0.7);
    _scene.add(ambient);
    _objects.push(ambient);

    /* build the world */
    _buildOcean();
    _buildBeach();
    _buildHedgehogs();
    _buildFortressWalls();
    _buildCourtyard();
    _buildBarracks();
    _buildMissileSilo();
    _buildCommandBunker();
    _buildDock();
    _buildPatrolBoat();
    _buildMGNests();

    /* spawn enemies */
    _spawnAllEnemies();

    /* position player at beach landing */
    _camera.position.set(0, 1.8, 45);

    /* create HUD */
    _createHUD();

    _tone(440, 0.2, 0.2);
    _tone(550, 0.2, 0.2);
    _tone(660, 0.3, 0.25);
  }

  /* ── main update ────────────────────────────────────────────────────────── */
  function update(dt, scene, camera, audioCtx) {
    _scene    = scene;
    _camera   = camera;
    _audioCtx = audioCtx;

    if (!_active || _gameOver || _gameWon) {
      _updateHUD();
      return;
    }

    _elapsed += dt;

    /* subsystem updates */
    _updateBeachPhase(dt);
    _updateMissileCountdown(dt);
    _checkHedgehogCover();
    _checkSiloTerminal();
    _updateSiloInteract(dt);
    _updatePatrolBoat(dt);
    _updateEnemies(dt);
    _updateRockets(dt);
    _updateFountain(_elapsed);
    _updateRadar(dt);
    _checkExtraction();
    _updateHUD();
  }

  /* ── public init ────────────────────────────────────────────────────────── */
  function init(scene, camera, audioCtx) {
    _scene    = scene;
    _camera   = camera;
    _audioCtx = audioCtx;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousedown', _onMouseDown);
  }

  /* ── public reset ───────────────────────────────────────────────────────── */
  function reset() {
    /* remove all scene objects */
    for (var i = 0; i < _objects.length; i++) {
      if (_objects[i] && _objects[i].parent) {
        _objects[i].parent.remove(_objects[i]);
      }
      /* dispose geometries/materials */
      if (_objects[i] && _objects[i].geometry) {
        _objects[i].geometry.dispose();
      }
      if (_objects[i] && _objects[i].material) {
        if (Array.isArray(_objects[i].material)) {
          for (var m = 0; m < _objects[i].material.length; m++) {
            _objects[i].material[m].dispose();
          }
        } else {
          _objects[i].material.dispose();
        }
      }
    }

    /* remove rocket trail meshes (tracked separately) */
    for (var r = 0; r < _rockets.length; r++) {
      var rkt = _rockets[r];
      if (rkt.group && rkt.group.parent) rkt.group.parent.remove(rkt.group);
      for (var t = 0; t < rkt.trail.length; t++) {
        if (rkt.trail[t].mesh && rkt.trail[t].mesh.parent) {
          rkt.trail[t].mesh.parent.remove(rkt.trail[t].mesh);
        }
      }
    }

    /* remove patrol boat group */
    if (_patrolBoat && _patrolBoat.group && _patrolBoat.group.parent) {
      _patrolBoat.group.parent.remove(_patrolBoat.group);
    }

    /* remove event listeners */
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
    document.removeEventListener('mousedown', _onMouseDown);

    /* clear HUD */
    _removeHUD();

    /* reset all state */
    _active           = false;
    _objects          = [];
    _enemies          = [];
    _hedgehogs        = [];
    _rockets          = [];
    _mgBullets        = [];
    _patrolBoat       = null;
    _siloTerminal     = null;
    _siloTerminalPos  = null;
    _daxEnemy         = null;
    _fountainParts    = [];
    _radarParts       = [];
    _mgNests          = [];
    _extractionDock   = null;
    _iPressed         = false;
    _fPressed         = false;
    _iTime            = 0;
    _fTime            = 0;
    _elapsed          = 0;
    _beachPhase       = true;
    _mgTimer          = 0;
    _missileTimer     = 0;
    _missileLaunched  = false;
    _gameOver         = false;
    _gameWon          = false;
    _playerHP         = 100;
    _playerCrouching  = false;
    _nearHedgehog     = false;
    _nearSiloTerminal = false;
    _siloInteractProgress = 0;
    _eHeld            = false;
    _launchDestroyed  = false;
    _daxDefeated      = false;
    _reachedDock      = false;
    _keys             = {};
  }

  /* ── public API ─────────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
