// ============================================================
//  orbital-defense.js — Orbital Defense FPS Game Module
//  Activation: O+D simultaneous keypress within 400ms
//  Defend space station from missile attack & boarding cosmonauts
//  API: window.OrbitalDefense = { init, update, reset }
// ============================================================
window.OrbitalDefense = (function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW    = 400;    // ms
  var TURRET_COUNT         = 4;
  var TURRET_HP_MAX        = 200;
  var COSMONAUT_HP         = 90;
  var COMMANDER_HP         = 200;
  var COSMONAUT_TOTAL      = 20;
  var BOARDER_SQUAD_SIZE   = 4;
  var MISSILE_SPEED        = 8;
  var BULLET_SPEED         = 40;
  var PLAYER_SPEED         = 6;
  var PLAYER_HP_MAX        = 100;
  var GRAVITY_NORMAL       = -9.8;
  var GRAVITY_LOW          = -3.0;   // zero-G vented module
  var SUIT_DAMAGE_RATE     = 2;      // HP/s in vacuum when suit damaged
  var PATCH_KIT_COUNT      = 3;
  var FIRE_COOLDOWN        = 0.25;   // seconds between shots
  var TURRET_FIRE_CD       = 0.4;
  var ENEMY_FIRE_CD        = 2.5;
  var COMMANDER_BOMB_TIME  = 10;     // seconds to place explosive
  var REACTOR_HP_MAX       = 100;
  var MODULE_HP_MAX        = 100;
  var MISSILE_DAMAGE       = 30;     // % of module HP
  var INTERACT_RANGE       = 4;
  var PLAYER_HEIGHT        = 1.8;
  var JUMP_NORMAL          = 5.5;
  var JUMP_LOW_G           = 10.0;   // higher jump in low gravity

  // Wave definitions: [missileCount, hasDecoys]
  var WAVE_DEF = [
    { count: 2, decoys: 0 },
    { count: 3, decoys: 0 },
    { count: 4, decoys: 2 }
  ];

  // Module approach directions for missiles (unit vectors)
  var MISSILE_APPROACH_DIRS = [
    { x: 1,  y: 0.2,  z: 0 },
    { x: -1, y: 0.1,  z: 0.3 },
    { x: 0,  y: 0.3,  z: 1 }
  ];

  // ── State ────────────────────────────────────────────────────────────────────
  var _active      = false;
  var _scene       = null;
  var _camera      = null;
  var _renderer    = null;
  var _clock       = null;
  var _gameOver    = false;
  var _gameWon     = false;
  var _keys        = {};
  var _mouseX      = 0;
  var _mouseY      = 0;
  var _yaw         = 0;
  var _pitch       = 0;

  // Activation key tracking
  var _oTime = 0;
  var _dTime = 0;
  var _oDown = false;
  var _dDown = false;

  // Player state
  var _playerPos      = null;   // THREE.Vector3
  var _playerVel      = null;   // THREE.Vector3
  var _playerHP       = PLAYER_HP_MAX;
  var _playerGrounded = false;
  var _suitDamaged    = false;
  var _patchKits      = PATCH_KIT_COUNT;
  var _fireCooldown   = 0;
  var _playerMesh     = null;
  var _playerGroup    = null;

  // Station geometry bounds (for gravity zone detection)
  // Each: { cx, cy, cz, hx, hy, hz, vented, sealed, hp, name }
  var _moduleData   = [];
  var _hub          = null;
  var _moduleA      = null;
  var _moduleB      = null;
  var _moduleC      = null;
  var _reactorMesh  = null;
  var _reactorHP    = REACTOR_HP_MAX;

  // Airlocks
  var _airlocks     = [];   // { mesh, docked }

  // Turrets
  var _turrets      = [];   // { mesh, base, hp, online, manned, fireTimer }

  // Missiles
  var _missiles     = [];   // { mesh, vel, isDecoy, alive }
  var _currentWave  = 0;
  var _waveActive   = false;
  var _waveTimer    = 0;
  var _waveLaunchTimer = 0;
  var _missilesPending = [];

  // Cosmonauts
  var _cosmonauts   = [];   // { mesh, helmet, hp, alive, state, target, fireTimer, bombTimer, isCommander, light }
  var _cosmonautsAlive = 0;
  var _boardingTimer   = 0;
  var _nextSquadTime   = 0;
  var _squadsDeployed  = 0;
  var _maxSquads       = Math.ceil(COSMONAUT_TOTAL / BOARDER_SQUAD_SIZE);

  // Bulkhead doors (sealed modules)
  var _bulkheads    = [];   // { mesh, panel, moduleIdx, sealed }

  // Patch kit lockers
  var _patchLockers = [];   // { mesh, used }

  // Solar panels (LineSegments)
  var _solarPanels  = [];

  // Projectiles (player shots)
  var _bullets      = [];   // { mesh, vel, life }

  // Explosion VFX
  var _explosions   = [];   // { mesh, life }

  // Plasma flashes (enemy shots)
  var _plasmaFlash  = [];   // { light, life }

  // HUD
  var _hudEl        = null;
  var _overlayEl    = null;

  // ── THREE ref ────────────────────────────────────────────────────────────────
  var _T = null;

  function _getThree() {
    if (_T) return _T;
    if (window.THREE) { _T = window.THREE; return _T; }
    return null;
  }

  // ── Math Utilities ───────────────────────────────────────────────────────────
  function _clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _normalize3(v) {
    var T = _getThree();
    if (!T) return;
    var len = v.length();
    if (len < 0.0001) return;
    v.divideScalar(len);
  }

  function _inBox(pos, cx, cy, cz, hx, hy, hz) {
    return (Math.abs(pos.x - cx) < hx &&
            Math.abs(pos.y - cy) < hy &&
            Math.abs(pos.z - cz) < hz);
  }

  // ── Mesh Factory ─────────────────────────────────────────────────────────────
  function _makeMesh(geo, color, emissive, opacity) {
    var T = _getThree();
    if (!T) return null;
    var opts = { color: color };
    if (emissive !== undefined) {
      opts.emissive = emissive;
      opts.emissiveIntensity = 0.5;
    }
    if (opacity !== undefined) {
      opts.transparent = true;
      opts.opacity = opacity;
    }
    var mat = new T.MeshStandardMaterial(opts);
    return new T.Mesh(geo, mat);
  }

  // ── Build Station ─────────────────────────────────────────────────────────────
  function _buildStation() {
    var T = _getThree();
    if (!T || !_scene) return;

    // Earth backdrop (large sphere behind station)
    var earthGeo = new T.SphereGeometry(200, 16, 16);
    var earthMesh = _makeMesh(earthGeo, 0x1144AA, 0x112233);
    earthMesh.position.set(0, -220, 0);
    _scene.add(earthMesh);

    // Central hub: BoxGeometry 20×10×20
    var hubGeo = new T.BoxGeometry(20, 10, 20);
    _hub = _makeMesh(hubGeo, 0x334455);
    _hub.position.set(0, 0, 0);
    _scene.add(_hub);
    _moduleData.push({ cx: 0, cy: 0, cz: 0, hx: 10, hy: 5, hz: 10, vented: false, sealed: false, hp: MODULE_HP_MAX, name: 'hub', mesh: _hub });

    // Module A (Science): BoxGeometry 8×4×20 at +X side
    var modAGeo = new T.BoxGeometry(8, 4, 20);
    _moduleA = _makeMesh(modAGeo, 0x334466);
    _moduleA.position.set(18, 0, 0);
    _scene.add(_moduleA);
    _moduleData.push({ cx: 18, cy: 0, cz: 0, hx: 4, hy: 2, hz: 10, vented: false, sealed: false, hp: MODULE_HP_MAX, name: 'science', mesh: _moduleA });

    // Module B (Habitation): BoxGeometry 8×4×20 at -X side
    var modBGeo = new T.BoxGeometry(8, 4, 20);
    _moduleB = _makeMesh(modBGeo, 0x443344);
    _moduleB.position.set(-18, 0, 0);
    _scene.add(_moduleB);
    _moduleData.push({ cx: -18, cy: 0, cz: 0, hx: 4, hy: 2, hz: 10, vented: false, sealed: false, hp: MODULE_HP_MAX, name: 'habitation', mesh: _moduleB });

    // Module C (Power): BoxGeometry 8×4×15 at +Z side
    var modCGeo = new T.BoxGeometry(8, 4, 15);
    _moduleC = _makeMesh(modCGeo, 0x334433);
    _moduleC.position.set(0, 0, 20);
    _scene.add(_moduleC);
    _moduleData.push({ cx: 0, cy: 0, cz: 20, hx: 4, hy: 2, hz: 7.5, vented: false, sealed: false, hp: MODULE_HP_MAX, name: 'power', mesh: _moduleC });

    // Reactor: CylinderGeometry r=3 h=8 inside Module C
    var reactorGeo = new T.CylinderGeometry(3, 3, 8, 16);
    _reactorMesh = _makeMesh(reactorGeo, 0x44FF88, 0x00FF44);
    _reactorMesh.position.set(0, 0, 20);
    _scene.add(_reactorMesh);

    // Airlock corridors connecting modules to hub: CylinderGeometry r=2 h=8
    var corridorDefs = [
      { x: 10,  y: 0, z: 0,  rx: 0,             rz: Math.PI / 2 }, // hub → moduleA
      { x: -10, y: 0, z: 0,  rx: 0,             rz: Math.PI / 2 }, // hub → moduleB
      { x: 0,   y: 0, z: 10, rx: Math.PI / 2,   rz: 0           }  // hub → moduleC
    ];
    var i;
    for (i = 0; i < corridorDefs.length; i++) {
      var cd = corridorDefs[i];
      var corrGeo = new T.CylinderGeometry(2, 2, 8, 12);
      var corr = _makeMesh(corrGeo, 0x334455);
      corr.position.set(cd.x, cd.y, cd.z);
      corr.rotation.x = cd.rx;
      corr.rotation.z = cd.rz;
      _scene.add(corr);
    }

    // EVA airlocks / docking ports: BoxGeometry
    var dockPositions = [
      { x: 22, y: 0, z: 0,  label: 'dockA' },
      { x: -22, y: 0, z: 0, label: 'dockB' }
    ];
    for (i = 0; i < dockPositions.length; i++) {
      var dp = dockPositions[i];
      var dockGeo = new T.BoxGeometry(4, 3, 4);
      var dockMesh = _makeMesh(dockGeo, 0x223344);
      dockMesh.position.set(dp.x, dp.y, dp.z);
      _scene.add(dockMesh);
      _airlocks.push({ mesh: dockMesh, docked: false, x: dp.x, y: dp.y, z: dp.z });
    }

    // Solar panels: LineSegments arrays extending from hub
    _buildSolarPanels();

    // Defense turrets (4 total): Module A gets 2, hub gets 2
    var turretPositions = [
      { x: 18, y: 3,  z: -6  },   // Module A turret 1
      { x: 18, y: 3,  z: 6   },   // Module A turret 2
      { x: -5, y: 6,  z: -5  },   // Hub turret 1
      { x: 5,  y: 6,  z: 5   }    // Hub turret 2
    ];
    for (i = 0; i < TURRET_COUNT; i++) {
      var tp = turretPositions[i];
      var baseGeo = new T.CylinderGeometry(0.5, 0.7, 3, 12);
      var baseMesh = _makeMesh(baseGeo, 0x556677);
      baseMesh.position.set(tp.x, tp.y, tp.z);
      _scene.add(baseMesh);

      var domGeo = new T.SphereGeometry(0.8, 8, 8);
      var domMesh = _makeMesh(domGeo, 0x4488AA, 0x224466);
      domMesh.position.set(tp.x, tp.y + 2, tp.z);
      _scene.add(domMesh);

      _turrets.push({
        mesh: domMesh,
        base: baseMesh,
        hp: TURRET_HP_MAX,
        online: true,
        manned: false,
        fireTimer: 0,
        x: tp.x, y: tp.y + 2, z: tp.z
      });
    }

    // Bulkhead panels (one per module corridor)
    var bulkPos = [
      { x: 10,  y: 0, z: 0,  mx: 1, moduleIdx: 1 },
      { x: -10, y: 0, z: 0,  mx: 1, moduleIdx: 2 },
      { x: 0,   y: 0, z: 10, mx: 0, moduleIdx: 3 }
    ];
    for (i = 0; i < bulkPos.length; i++) {
      var bp = bulkPos[i];
      var panelGeo = new T.BoxGeometry(0.3, 3, 3);
      var panelMesh = _makeMesh(panelGeo, 0x667788);
      panelMesh.position.set(bp.x, bp.y + 1.5, bp.z);
      _scene.add(panelMesh);
      _bulkheads.push({ mesh: panelMesh, sealed: false, moduleIdx: bp.moduleIdx, x: bp.x, y: bp.y + 1.5, z: bp.z });
    }

    // Patch kit lockers (3 lockers in various modules)
    var lockerPos = [
      { x: 18, y: 0, z: -2  },   // Module A
      { x: -18, y: 0, z: 2  },   // Module B
      { x: 3,  y: 0, z: 0   }    // Hub
    ];
    for (i = 0; i < lockerPos.length; i++) {
      var lp = lockerPos[i];
      var lockerGeo = new T.BoxGeometry(1, 2, 0.8);
      var lockerMesh = _makeMesh(lockerGeo, 0x558866);
      lockerMesh.position.set(lp.x, lp.y + 1, lp.z);
      _scene.add(lockerMesh);
      _patchLockers.push({ mesh: lockerMesh, used: false, x: lp.x, y: lp.y + 1, z: lp.z });
    }

    // Ambient lights
    var ambLight = new T.AmbientLight(0x223344, 0.6);
    _scene.add(ambLight);
    var dirLight = new T.DirectionalLight(0xFFEECC, 1.2);
    dirLight.position.set(50, 80, 30);
    _scene.add(dirLight);

    // Point light on reactor (glowing effect)
    var reactorLight = new T.PointLight(0x00FF44, 2, 20);
    reactorLight.position.set(0, 2, 20);
    _scene.add(reactorLight);
  }

  function _buildSolarPanels() {
    var T = _getThree();
    if (!T) return;

    // 4 solar arrays, two on each side of hub in X direction
    var panelDefs = [
      { ox: 0,  oy: 5,  oz: 0,  dir: 1  },  // top +X
      { ox: 0,  oy: 5,  oz: 0,  dir: -1 },  // top -X
      { ox: 0,  oy: -5, oz: 0,  dir: 1  },  // bottom +X
      { ox: 0,  oy: -5, oz: 0,  dir: -1 }   // bottom -X
    ];
    var i, j;
    for (i = 0; i < panelDefs.length; i++) {
      var pd = panelDefs[i];
      var positions = [];
      var segments = 6;
      var length = 15;
      for (j = 0; j <= segments; j++) {
        var t = j / segments;
        positions.push(pd.ox + pd.dir * t * length, pd.oy, pd.oz);
        positions.push(pd.ox + pd.dir * t * length, pd.oy + 2, pd.oz);
      }
      // Cross struts
      for (j = 0; j <= segments; j++) {
        var t2 = j / segments;
        positions.push(pd.ox + pd.dir * t2 * length, pd.oy, pd.oz - 3);
        positions.push(pd.ox + pd.dir * t2 * length, pd.oy, pd.oz + 3);
      }
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(new Float32Array(positions), 3));
      var mat = new T.LineBasicMaterial({ color: 0x88BBDD });
      var lines = new T.LineSegments(geo, mat);
      _scene.add(lines);
      _solarPanels.push(lines);
    }
  }

  // ── Player Setup ──────────────────────────────────────────────────────────────
  function _buildPlayer() {
    var T = _getThree();
    if (!T) return;

    _playerPos = new T.Vector3(0, 2, -5);
    _playerVel = new T.Vector3(0, 0, 0);

    _playerGroup = new T.Group();
    _scene.add(_playerGroup);

    // Small player body indicator (not visible from FPS camera but useful for shadow)
    var bodyGeo = new T.BoxGeometry(0.6, 1.6, 0.4);
    _playerMesh = _makeMesh(bodyGeo, 0x4466AA);
    _playerMesh.position.set(0, 0, 0);
    _playerGroup.add(_playerMesh);

    _camera.position.copy(_playerPos);
    _camera.position.y += PLAYER_HEIGHT * 0.4;
  }

  // ── Missile Spawning ──────────────────────────────────────────────────────────
  function _launchWave(waveIdx) {
    var T = _getThree();
    if (!T) return;

    var def = WAVE_DEF[waveIdx];
    var i, dir, startPos;

    // Real missiles
    for (i = 0; i < def.count; i++) {
      dir = MISSILE_APPROACH_DIRS[i % 3];
      startPos = new T.Vector3(
        -dir.x * 80 + (Math.random() - 0.5) * 10,
        -dir.y * 80 + (Math.random() - 0.5) * 10,
        -dir.z * 80 + (Math.random() - 0.5) * 10
      );
      _spawnMissile(startPos, dir, false);
    }

    // Decoys (wave 3)
    for (i = 0; i < def.decoys; i++) {
      dir = MISSILE_APPROACH_DIRS[i % 3];
      startPos = new T.Vector3(
        -dir.x * 80 + (Math.random() - 0.5) * 20,
        -dir.y * 80 + (Math.random() - 0.5) * 10,
        -dir.z * 80 + (Math.random() - 0.5) * 10
      );
      _spawnMissile(startPos, dir, true);
    }
  }

  function _spawnMissile(startPos, dir, isDecoy) {
    var T = _getThree();
    if (!T) return;

    var mGeo = new T.CylinderGeometry(0.3, 0.3, 4, 8);
    var mColor = isDecoy ? 0xFFAA00 : 0xFF2200;
    var mMesh = _makeMesh(mGeo, mColor, isDecoy ? 0x884400 : 0xAA1100);
    mMesh.position.copy(startPos);

    // Orient missile toward station
    var toward = new T.Vector3(dir.x, dir.y, dir.z).normalize();
    mMesh.lookAt(mMesh.position.clone().add(toward));
    mMesh.rotateX(Math.PI / 2);

    _scene.add(mMesh);

    var vel = new T.Vector3(dir.x, dir.y, dir.z).normalize().multiplyScalar(MISSILE_SPEED);

    // Add rocket exhaust glow
    var exhaust = new T.PointLight(isDecoy ? 0xFFAA00 : 0xFF4400, 1.5, 8);
    mMesh.add(exhaust);
    exhaust.position.set(0, -2, 0);

    _missiles.push({
      mesh: mMesh,
      vel: vel,
      isDecoy: isDecoy,
      alive: true
    });
  }

  // ── Cosmonaut Spawning ────────────────────────────────────────────────────────
  function _spawnBoardingSquad(isCommander) {
    var T = _getThree();
    if (!T) return;

    var count = isCommander ? 1 : BOARDER_SQUAD_SIZE;
    var dockIdx = _squadsDeployed % _airlocks.length;
    var dock = _airlocks[dockIdx];
    var i;

    for (i = 0; i < count; i++) {
      var spreadX = (Math.random() - 0.5) * 3;
      var spreadZ = (Math.random() - 0.5) * 3;

      // Body
      var bodyGeo = new T.BoxGeometry(0.8, 1.6, 0.5);
      var bodyMesh = _makeMesh(bodyGeo, 0x334455);
      bodyMesh.position.set(dock.x + spreadX, dock.y + 1, dock.z + spreadZ);
      _scene.add(bodyMesh);

      // Helmet (SphereGeometry)
      var helmGeo = new T.SphereGeometry(0.45, 8, 8);
      var helmMesh = _makeMesh(helmGeo, 0x778899, 0x224466);
      helmMesh.position.set(dock.x + spreadX, dock.y + 2.2, dock.z + spreadZ);
      _scene.add(helmMesh);

      // Plasma pistol light
      var pLight = new T.PointLight(0x4466FF, 0, 4);
      pLight.position.copy(bodyMesh.position);
      pLight.position.y += 0.5;
      _scene.add(pLight);

      var hp = isCommander ? COMMANDER_HP : COSMONAUT_HP;
      _cosmonauts.push({
        mesh: bodyMesh,
        helmet: helmMesh,
        light: pLight,
        hp: hp,
        alive: true,
        state: 'advance',   // advance | sabotage | plant_bomb
        fireTimer: 1 + Math.random() * 2,
        bombTimer: 0,
        isCommander: isCommander,
        vel: new T.Vector3(0, 0, 0)
      });
      _cosmonautsAlive++;
    }
    dock.docked = true;
  }

  // ── HUD ───────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'od-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00FFAA',
      'font:bold 13px/1.4 monospace',
      'background:rgba(0,10,20,0.72)',
      'padding:8px 18px',
      'border:1px solid #00FFAA55',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9000',
      'text-align:center',
      'text-shadow:0 0 6px #00FFAA'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Crosshair
    var ch = document.createElement('div');
    ch.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:20px',
      'height:20px',
      'pointer-events:none',
      'z-index:9001'
    ].join(';');
    ch.innerHTML = '<svg width="20" height="20"><line x1="10" y1="0" x2="10" y2="20" stroke="#00FFAA" stroke-width="1.5"/><line x1="0" y1="10" x2="20" y2="10" stroke="#00FFAA" stroke-width="1.5"/></svg>';
    document.body.appendChild(ch);

    // Overlay for win/lose
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'od-overlay';
    _overlayEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'flex-direction:column',
      'background:rgba(0,0,0,0.8)',
      'color:#00FFAA',
      'font:bold 32px monospace',
      'z-index:9100',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_overlayEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var turretsOnline = 0;
    var i;
    for (i = 0; i < _turrets.length; i++) {
      if (_turrets[i].online) turretsOnline++;
    }
    var missilesIncoming = 0;
    for (i = 0; i < _missiles.length; i++) {
      if (_missiles[i].alive && !_missiles[i].isDecoy) missilesIncoming++;
    }
    var suitStatus = _suitDamaged ? '<span style="color:#FF4444">DAMAGED</span>' : '<span style="color:#00FF88">OK</span>';
    var gravStatus = _inLowGravity() ? ' [ZERO-G]' : '';
    _hudEl.innerHTML =
      'ORBITAL DEFENSE' + gravStatus + ' &nbsp;|&nbsp; ' +
      'TURRETS: ' + turretsOnline + '/' + TURRET_COUNT + ' ONLINE &nbsp;|&nbsp; ' +
      'MISSILES: ' + missilesIncoming + ' INCOMING &nbsp;|&nbsp; ' +
      'BOARDERS: ' + _cosmonautsAlive + ' &nbsp;|&nbsp; ' +
      'REACTOR: ' + Math.round(_reactorHP) + '% &nbsp;|&nbsp; ' +
      'SUIT: ' + suitStatus + ' &nbsp;|&nbsp; ' +
      'PATCHES: ' + _patchKits + ' &nbsp;|&nbsp; ' +
      'HP: ' + Math.round(_playerHP);

    if (_waveActive) {
      _hudEl.innerHTML += ' &nbsp;|&nbsp; <span style="color:#FF4444">WAVE ' + _currentWave + ' ACTIVE</span>';
    } else if (_currentWave < 3) {
      _hudEl.innerHTML += ' &nbsp;|&nbsp; <span style="color:#FFAA00">WAVE ' + (_currentWave + 1) + ' INCOMING</span>';
    }
  }

  function _showOverlay(msg, subMsg, color) {
    if (!_overlayEl) return;
    _overlayEl.style.display = 'flex';
    _overlayEl.style.color = color || '#00FFAA';
    _overlayEl.innerHTML = '<div>' + msg + '</div><div style="font-size:18px;margin-top:16px;color:#AACCEE">' + (subMsg || '') + '</div><div style="font-size:14px;margin-top:24px;color:#778899">Press R to restart</div>';
  }

  // ── Gravity Detection ─────────────────────────────────────────────────────────
  function _inLowGravity() {
    if (!_playerPos) return false;
    var i;
    for (i = 0; i < _moduleData.length; i++) {
      var m = _moduleData[i];
      if (m.vented && !m.sealed) {
        if (_inBox(_playerPos, m.cx, m.cy, m.cz, m.hx + 1, m.hy + 1, m.hz + 1)) {
          return true;
        }
      }
    }
    return false;
  }

  function _currentGravity() {
    return _inLowGravity() ? GRAVITY_LOW : GRAVITY_NORMAL;
  }

  // ── Interaction ───────────────────────────────────────────────────────────────
  function _tryInteract() {
    if (!_playerPos) return;
    var i, dist;

    // Man/leave turret
    var mannedTurretIdx = -1;
    for (i = 0; i < _turrets.length; i++) {
      if (_turrets[i].manned) { mannedTurretIdx = i; break; }
    }
    if (mannedTurretIdx >= 0) {
      _turrets[mannedTurretIdx].manned = false;
      return;
    }
    for (i = 0; i < _turrets.length; i++) {
      var t = _turrets[i];
      if (!t.online) continue;
      dist = _dist3(_playerPos, { x: t.x, y: t.y, z: t.z });
      if (dist < INTERACT_RANGE) {
        t.manned = true;
        return;
      }
    }

    // Seal bulkhead
    for (i = 0; i < _bulkheads.length; i++) {
      var bh = _bulkheads[i];
      dist = _dist3(_playerPos, { x: bh.x, y: bh.y, z: bh.z });
      if (dist < INTERACT_RANGE) {
        bh.sealed = !bh.sealed;
        var modIdx = bh.moduleIdx;
        if (modIdx < _moduleData.length) {
          _moduleData[modIdx].sealed = bh.sealed;
        }
        bh.mesh.material.color.setHex(bh.sealed ? 0xFF4444 : 0x667788);
        return;
      }
    }

    // Pick up patch kit
    for (i = 0; i < _patchLockers.length; i++) {
      var locker = _patchLockers[i];
      if (locker.used) continue;
      dist = _dist3(_playerPos, { x: locker.x, y: locker.y, z: locker.z });
      if (dist < INTERACT_RANGE) {
        if (_suitDamaged) {
          _suitDamaged = false;
          _patchKits--;
          locker.used = true;
          locker.mesh.material.color.setHex(0x333333);
        } else if (_patchKits < PATCH_KIT_COUNT) {
          _patchKits = Math.min(_patchKits + 1, PATCH_KIT_COUNT);
          locker.used = true;
          locker.mesh.material.color.setHex(0x333333);
        }
        return;
      }
    }
  }

  // ── Player Shoot ──────────────────────────────────────────────────────────────
  function _playerShoot() {
    var T = _getThree();
    if (!T || !_camera) return;
    if (_fireCooldown > 0) return;

    _fireCooldown = FIRE_COOLDOWN;

    // Direction from camera
    var dir = new T.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    dir.normalize();

    var bulletGeo = new T.SphereGeometry(0.12, 4, 4);
    var bulletMesh = _makeMesh(bulletGeo, 0xFFEE44, 0xFFCC00);
    bulletMesh.position.copy(_camera.position);
    bulletMesh.position.addScaledVector(dir, 1.5);
    _scene.add(bulletMesh);

    var vel = dir.clone().multiplyScalar(BULLET_SPEED);
    _bullets.push({ mesh: bulletMesh, vel: vel, life: 3 });
  }

  // ── Spawn Explosion VFX ───────────────────────────────────────────────────────
  function _spawnExplosion(x, y, z, scale) {
    var T = _getThree();
    if (!T) return;
    scale = scale || 1;

    var geo = new T.SphereGeometry(0.8 * scale, 6, 6);
    var mesh = _makeMesh(geo, 0xFF6600, 0xFF3300, 0.85);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    _explosions.push({ mesh: mesh, life: 0.6, scale: scale });

    // Flash light
    var expLight = new T.PointLight(0xFF4400, 3 * scale, 12 * scale);
    expLight.position.set(x, y, z);
    _scene.add(expLight);
    _explosions.push({ mesh: expLight, life: 0.3, isLight: true });
  }

  // ── Check Win/Lose ────────────────────────────────────────────────────────────
  function _checkWinLose() {
    // Lose: reactor destroyed
    if (_reactorHP <= 0) {
      _gameOver = true;
      _showOverlay('MISSION FAILED', 'Reactor destroyed — Station lost!', '#FF4444');
      return;
    }

    // Lose: player dead
    if (_playerHP <= 0) {
      _gameOver = true;
      _showOverlay('MISSION FAILED', 'You have been eliminated!', '#FF4444');
      return;
    }

    // Lose: suit damaged in vacuum with no patches
    if (_suitDamaged && _patchKits <= 0) {
      var inVacuum = _inVacuumZone();
      if (inVacuum && _playerHP <= 0) {
        _gameOver = true;
        _showOverlay('MISSION FAILED', 'Suit integrity lost — decompression!', '#FF4444');
        return;
      }
    }

    // Win: all 3 waves repelled + all boarders eliminated + reactor intact
    if (_currentWave >= 3 && !_waveActive &&
        _missiles.filter(function (m) { return m.alive; }).length === 0 &&
        _cosmonautsAlive <= 0 &&
        _reactorHP > 0) {
      _gameWon = true;
      _showOverlay('MISSION ACCOMPLISHED', 'Station defended! All threats eliminated.', '#00FFAA');
    }
  }

  function _inVacuumZone() {
    if (!_playerPos) return false;
    var i, m;
    for (i = 0; i < _moduleData.length; i++) {
      m = _moduleData[i];
      if (m.vented && !m.sealed) {
        if (_inBox(_playerPos, m.cx, m.cy, m.cz, m.hx + 1, m.hy + 1, m.hz + 1)) {
          return true;
        }
      }
    }
    return false;
  }

  // ── Turret Auto-Fire ──────────────────────────────────────────────────────────
  function _updateTurrets(dt) {
    var T = _getThree();
    if (!T) return;
    var i, j, t, m, dist, best, bestDist;

    for (i = 0; i < _turrets.length; i++) {
      t = _turrets[i];
      if (!t.online || !t.manned) continue;

      t.fireTimer -= dt;
      if (t.fireTimer > 0) continue;

      // Find nearest non-decoy missile
      best = null;
      bestDist = 999;
      for (j = 0; j < _missiles.length; j++) {
        m = _missiles[j];
        if (!m.alive || m.isDecoy) continue;
        dist = _dist3({ x: t.x, y: t.y, z: t.z }, {
          x: m.mesh.position.x, y: m.mesh.position.y, z: m.mesh.position.z
        });
        if (dist < bestDist) {
          bestDist = dist;
          best = m;
        }
      }

      if (best && bestDist < 120) {
        // Spawn turret bullet toward missile
        var dir = new T.Vector3(
          best.mesh.position.x - t.x,
          best.mesh.position.y - t.y,
          best.mesh.position.z - t.z
        ).normalize();
        var bGeo = new T.SphereGeometry(0.1, 4, 4);
        var bMesh = _makeMesh(bGeo, 0x00FFFF, 0x00AAFF);
        bMesh.position.set(t.x, t.y, t.z);
        _scene.add(bMesh);
        _bullets.push({ mesh: bMesh, vel: dir.multiplyScalar(BULLET_SPEED * 1.2), life: 5, isTurret: true, targetMissile: best });
        t.fireTimer = TURRET_FIRE_CD;
      }
    }
  }

  // ── Update Missiles ───────────────────────────────────────────────────────────
  function _updateMissiles(dt) {
    var T = _getThree();
    if (!T) return;
    var i, m, pos;

    for (i = _missiles.length - 1; i >= 0; i--) {
      m = _missiles[i];
      if (!m.alive) continue;

      m.mesh.position.addScaledVector(m.vel, dt);
      pos = m.mesh.position;

      // Check if it hit the station (rough proximity to center)
      var distToStation = pos.length();
      if (distToStation < 15) {
        // Determine which module was hit
        _missilehitStation(m, pos);
        m.alive = false;
        _spawnExplosion(pos.x, pos.y, pos.z, 2);
        _scene.remove(m.mesh);
        continue;
      }

      // Passed through / too far
      if (distToStation > 200) {
        m.alive = false;
        _scene.remove(m.mesh);
      }
    }
  }

  function _missilehitStation(missile, pos) {
    if (missile.isDecoy) return;

    // Find closest module
    var i, m, best = null, bestDist = 999, dist;
    for (i = 0; i < _moduleData.length; i++) {
      m = _moduleData[i];
      dist = Math.sqrt(
        (pos.x - m.cx) * (pos.x - m.cx) +
        (pos.y - m.cy) * (pos.y - m.cy) +
        (pos.z - m.cz) * (pos.z - m.cz)
      );
      if (dist < bestDist) {
        bestDist = dist;
        best = m;
      }
    }
    if (!best) return;

    if (best.name === 'power') {
      // Missile hits reactor module
      _reactorHP -= 50;
      best.hp -= MISSILE_DAMAGE;
      best.vented = true;
    } else {
      best.hp -= MISSILE_DAMAGE;
      if (best.hp < 50) {
        best.vented = true;   // module starts venting
      }
    }
    best.mesh.material.color.setHex(0x553333);
  }

  // ── Update Bullets ────────────────────────────────────────────────────────────
  function _updateBullets(dt) {
    var T = _getThree();
    if (!T) return;
    var i, j, b, pos, hit;

    for (i = _bullets.length - 1; i >= 0; i--) {
      b = _bullets[i];
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
        continue;
      }

      b.mesh.position.addScaledVector(b.vel, dt);
      pos = b.mesh.position;
      hit = false;

      // Turret bullets: check missiles
      if (b.isTurret && b.targetMissile && b.targetMissile.alive) {
        var dist = _dist3(
          { x: pos.x, y: pos.y, z: pos.z },
          { x: b.targetMissile.mesh.position.x, y: b.targetMissile.mesh.position.y, z: b.targetMissile.mesh.position.z }
        );
        if (dist < 3) {
          b.targetMissile.alive = false;
          _spawnExplosion(b.targetMissile.mesh.position.x, b.targetMissile.mesh.position.y, b.targetMissile.mesh.position.z, 1.5);
          _scene.remove(b.targetMissile.mesh);
          hit = true;
        }
      }

      if (!hit) {
        // Player bullets: check cosmonauts and missiles
        for (j = _cosmonauts.length - 1; j >= 0; j--) {
          var c = _cosmonauts[j];
          if (!c.alive) continue;
          var cdist = _dist3({ x: pos.x, y: pos.y, z: pos.z }, {
            x: c.mesh.position.x, y: c.mesh.position.y + 0.8, z: c.mesh.position.z
          });
          if (cdist < 1.2) {
            c.hp -= 34;
            if (c.hp <= 0) {
              c.alive = false;
              _cosmonautsAlive = Math.max(0, _cosmonautsAlive - 1);
              _scene.remove(c.mesh);
              _scene.remove(c.helmet);
              _scene.remove(c.light);
              _spawnExplosion(c.mesh.position.x, c.mesh.position.y, c.mesh.position.z, 0.5);
            }
            hit = true;
            break;
          }
        }
      }

      if (!hit) {
        // Player bullets: check missiles directly
        for (j = _missiles.length - 1; j >= 0; j--) {
          var ms = _missiles[j];
          if (!ms.alive) continue;
          var mdist = _dist3({ x: pos.x, y: pos.y, z: pos.z }, {
            x: ms.mesh.position.x, y: ms.mesh.position.y, z: ms.mesh.position.z
          });
          if (mdist < 2.5) {
            ms.alive = false;
            _spawnExplosion(ms.mesh.position.x, ms.mesh.position.y, ms.mesh.position.z, 1.5);
            _scene.remove(ms.mesh);
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
      }
    }
  }

  // ── Update Cosmonauts ─────────────────────────────────────────────────────────
  function _updateCosmonauts(dt) {
    var T = _getThree();
    if (!T || !_playerPos) return;
    var i, c, toPlayer, dist;

    for (i = 0; i < _cosmonauts.length; i++) {
      c = _cosmonauts[i];
      if (!c.alive) continue;

      // Move toward reactor (power module) or player
      var targetPos;
      if (c.isCommander) {
        // Commander goes for reactor
        targetPos = { x: 0, y: 0, z: 20 };
        c.state = 'plant_bomb';
      } else {
        // Regular cosmonauts alternate between attacking player and sabotaging turrets
        dist = _dist3(_playerPos, { x: c.mesh.position.x, y: c.mesh.position.y, z: c.mesh.position.z });
        if (dist < 8) {
          targetPos = { x: _playerPos.x, y: _playerPos.y, z: _playerPos.z };
          c.state = 'advance';
        } else {
          // Find nearest online turret
          var nearTurret = null, nearDist = 999;
          for (var k = 0; k < _turrets.length; k++) {
            if (!_turrets[k].online) continue;
            var td = _dist3({ x: c.mesh.position.x, y: c.mesh.position.y, z: c.mesh.position.z },
              { x: _turrets[k].x, y: _turrets[k].y, z: _turrets[k].z });
            if (td < nearDist) { nearDist = td; nearTurret = _turrets[k]; }
          }
          if (nearTurret && nearDist < 20) {
            targetPos = { x: nearTurret.x, y: nearTurret.y, z: nearTurret.z };
            c.state = 'sabotage';
          } else {
            targetPos = { x: _playerPos.x, y: _playerPos.y, z: _playerPos.z };
            c.state = 'advance';
          }
        }
      }

      // Move toward target
      var dx = targetPos.x - c.mesh.position.x;
      var dz = targetPos.z - c.mesh.position.z;
      var len2 = Math.sqrt(dx * dx + dz * dz);
      if (len2 > 0.5) {
        var speed = c.isCommander ? 2.5 : 1.8;
        c.mesh.position.x += (dx / len2) * speed * dt;
        c.mesh.position.z += (dz / len2) * speed * dt;
        c.helmet.position.x = c.mesh.position.x;
        c.helmet.position.z = c.mesh.position.z;
      }
      c.light.position.copy(c.mesh.position);

      // Commander bomb timer
      if (c.isCommander && c.state === 'plant_bomb') {
        dist = _dist3(
          { x: c.mesh.position.x, y: c.mesh.position.y, z: c.mesh.position.z },
          { x: 0, y: 0, z: 20 }
        );
        if (dist < 5) {
          c.bombTimer += dt;
          if (c.bombTimer >= COMMANDER_BOMB_TIME) {
            _reactorHP -= 100;   // Bomb detonates
            c.alive = false;
            _cosmonautsAlive = Math.max(0, _cosmonautsAlive - 1);
            _scene.remove(c.mesh);
            _scene.remove(c.helmet);
            _scene.remove(c.light);
            _spawnExplosion(0, 0, 20, 3);
          }
        }
      }

      // Sabotage nearest turret
      if (c.state === 'sabotage') {
        for (var k2 = 0; k2 < _turrets.length; k2++) {
          var tt = _turrets[k2];
          if (!tt.online) continue;
          var sdist = _dist3(
            { x: c.mesh.position.x, y: c.mesh.position.y, z: c.mesh.position.z },
            { x: tt.x, y: tt.y, z: tt.z }
          );
          if (sdist < 2) {
            tt.hp -= 20 * dt;
            if (tt.hp <= 0) {
              tt.online = false;
              tt.manned = false;
              tt.mesh.material.color.setHex(0x332222);
              tt.base.material.color.setHex(0x331111);
            }
          }
        }
      }

      // Enemy fire at player
      c.fireTimer -= dt;
      if (c.fireTimer <= 0) {
        dist = _dist3(_playerPos, { x: c.mesh.position.x, y: c.mesh.position.y, z: c.mesh.position.z });
        if (dist < 15) {
          // Flash plasma light
          c.light.intensity = 3;
          _playerHP -= 8 + Math.random() * 5;
          if (dist < 5) {
            _suitDamaged = true;  // Close hit can damage suit
          }
          var plasma = { light: c.light, life: 0.15 };
          _plasmaFlash.push(plasma);
        }
        c.fireTimer = ENEMY_FIRE_CD + Math.random();
      }
    }
  }

  // ── Update Plasma Flashes ─────────────────────────────────────────────────────
  function _updatePlasmaFlash(dt) {
    var i, p;
    for (i = _plasmaFlash.length - 1; i >= 0; i--) {
      p = _plasmaFlash[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.light.intensity = 0;
        _plasmaFlash.splice(i, 1);
      }
    }
  }

  // ── Update Explosions ─────────────────────────────────────────────────────────
  function _updateExplosions(dt) {
    var i, e;
    for (i = _explosions.length - 1; i >= 0; i--) {
      e = _explosions[i];
      e.life -= dt;
      if (e.life <= 0) {
        _scene.remove(e.mesh);
        _explosions.splice(i, 1);
        continue;
      }
      if (!e.isLight) {
        var s = e.life * 2;
        e.mesh.scale.setScalar(s * (e.scale || 1));
        if (e.mesh.material) {
          e.mesh.material.opacity = Math.max(0, e.life * 2);
        }
      } else {
        e.mesh.intensity = e.life * 4;
      }
    }
  }

  // ── Update Wave Logic ─────────────────────────────────────────────────────────
  function _updateWaves(dt) {
    if (_currentWave >= 3) {
      _waveActive = false;
      return;
    }

    _waveTimer += dt;

    if (!_waveActive) {
      // Start next wave after delay
      var delay = _currentWave === 0 ? 8 : 20;
      if (_waveTimer >= delay) {
        _waveActive = true;
        _waveTimer = 0;
        _launchWave(_currentWave);
        _currentWave++;
      }
    } else {
      // Wave ends when all its missiles are gone
      var anyAlive = false;
      var i;
      for (i = 0; i < _missiles.length; i++) {
        if (_missiles[i].alive) { anyAlive = true; break; }
      }
      if (!anyAlive) {
        _waveActive = false;
        _waveTimer = 0;
        if (_currentWave < 3) {
          // Trigger next boarding squad on wave end
          _spawnBoardingSquad(false);
          _squadsDeployed++;
        }
      }
    }
  }

  // ── Update Boarding Squads ────────────────────────────────────────────────────
  function _updateBoarding(dt) {
    _boardingTimer += dt;

    // Deploy commander on wave 2 completion
    if (_currentWave === 3 && !_commanderSpawned) {
      _commanderSpawned = true;
      _spawnBoardingSquad(true);
    }

    // Stagger squads periodically
    if (_squadsDeployed < _maxSquads && _boardingTimer >= _nextSquadTime && _currentWave > 0) {
      _spawnBoardingSquad(false);
      _squadsDeployed++;
      _nextSquadTime = _boardingTimer + 25;
    }
  }

  // Commander spawned flag
  var _commanderSpawned = false;

  // ── Update Player Movement ────────────────────────────────────────────────────
  function _updatePlayer(dt) {
    var T = _getThree();
    if (!T || !_playerPos || !_playerVel || !_camera) return;

    var gravity = _currentGravity();
    var speed = PLAYER_SPEED;
    var jumpV = _inLowGravity() ? JUMP_LOW_G : JUMP_NORMAL;

    // Floaty movement in low gravity
    var damping = _inLowGravity() ? 0.92 : 1.0;

    // Get camera forward/right (ignoring Y)
    var fwd = new T.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    fwd.y = 0;
    if (fwd.length() > 0.001) fwd.normalize();

    var right = new T.Vector3(1, 0, 0).applyQuaternion(_camera.quaternion);
    right.y = 0;
    if (right.length() > 0.001) right.normalize();

    var moveX = 0, moveZ = 0;
    if (_keys['KeyW'] || _keys['ArrowUp'])    { moveX += fwd.x;  moveZ += fwd.z;  }
    if (_keys['KeyS'] || _keys['ArrowDown'])  { moveX -= fwd.x;  moveZ -= fwd.z;  }
    if (_keys['KeyA'] || _keys['ArrowLeft'])  { moveX -= right.x; moveZ -= right.z; }
    if (_keys['KeyD'] || _keys['ArrowRight']) { moveX += right.x; moveZ += right.z; }

    var moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (moveLen > 0.001) {
      moveX = (moveX / moveLen) * speed;
      moveZ = (moveZ / moveLen) * speed;
    }

    _playerVel.x = _playerVel.x * damping + moveX * (1 - damping + 0.1) * (1 - damping + 0.9);
    _playerVel.z = _playerVel.z * damping + moveZ * (1 - damping + 0.1) * (1 - damping + 0.9);

    // Simpler: direct velocity assignment with damping in low-g
    if (_inLowGravity()) {
      _playerVel.x = _playerVel.x * 0.94 + moveX * 0.06;
      _playerVel.z = _playerVel.z * 0.94 + moveZ * 0.06;
    } else {
      _playerVel.x = moveX;
      _playerVel.z = moveZ;
    }

    // Jump
    if ((_keys['Space']) && _playerGrounded) {
      _playerVel.y = jumpV;
      _playerGrounded = false;
    }

    // Gravity
    _playerVel.y += gravity * dt;

    // Move
    _playerPos.x += _playerVel.x * dt;
    _playerPos.y += _playerVel.y * dt;
    _playerPos.z += _playerVel.z * dt;

    // Floor collision (simple — stay above y=-2 for any module)
    var floorY = _getFloorY(_playerPos);
    if (_playerPos.y < floorY) {
      _playerPos.y = floorY;
      _playerVel.y = 0;
      _playerGrounded = true;
    } else {
      _playerGrounded = false;
    }

    // Camera follows player
    _camera.position.set(
      _playerPos.x,
      _playerPos.y + PLAYER_HEIGHT * 0.4,
      _playerPos.z
    );

    // Suit damage in vacuum
    if (_suitDamaged && _inVacuumZone()) {
      _playerHP -= SUIT_DAMAGE_RATE * dt;
    }
  }

  function _getFloorY(pos) {
    // Return the floor Y for the current position
    var i, m, floor = -100;
    for (i = 0; i < _moduleData.length; i++) {
      m = _moduleData[i];
      if (Math.abs(pos.x - m.cx) < m.hx + 0.5 && Math.abs(pos.z - m.cz) < m.hz + 0.5) {
        var moduleFloor = m.cy - m.hy;
        if (moduleFloor > floor) floor = moduleFloor;
      }
    }
    if (floor === -100) floor = -50; // In space — fall indefinitely (clamped)
    return floor;
  }

  // ── Mouse Look ────────────────────────────────────────────────────────────────
  function _onMouseMove(e) {
    if (!_active || _gameOver || _gameWon) return;
    var T = _getThree();
    if (!T || !_camera) return;

    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    _yaw   -= dx * 0.002;
    _pitch -= dy * 0.002;
    _pitch = _clamp(_pitch, -Math.PI / 2.2, Math.PI / 2.2);

    _camera.rotation.set(0, 0, 0);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  // ── Input Handlers ────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var now = Date.now();
    _keys[e.code] = true;

    if (e.code === 'KeyO') {
      _oDown = true; _oTime = now;
    }
    if (e.code === 'KeyD') {
      _dDown = true; _dTime = now;
    }

    // Check O+D activation
    if (!_active) {
      if (_oDown && _dDown && Math.abs(_oTime - _dTime) <= ACTIVATION_WINDOW) {
        _activate();
      }
      return;
    }

    if (_gameOver || _gameWon) {
      if (e.code === 'KeyR') { reset(); _activate(); }
      return;
    }

    if (e.code === 'KeyE') { _tryInteract(); }
    if (e.code === 'KeyF') { _playerShoot(); }   // F to fire (also click)
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyO') { _oDown = false; }
    if (e.code === 'KeyD') { _dDown = false; }
  }

  function _onClick() {
    if (!_active || _gameOver || _gameWon) return;
    // Request pointer lock
    if (document.pointerLockElement !== document.body) {
      document.body.requestPointerLock();
    }
    _playerShoot();
  }

  // ── Activate ──────────────────────────────────────────────────────────────────
  function _activate() {
    var T = _getThree();
    if (!T) { console.warn('[OrbitalDefense] THREE not found.'); return; }
    if (_active) return;
    _active = true;

    _scene    = window._scene    || (window.gameScene    || null);
    _camera   = window._camera   || (window.gameCamera   || null);
    _renderer = window._renderer || (window.gameRenderer || null);

    // Fallback: create own scene/camera/renderer
    if (!_scene) {
      _scene = new T.Scene();
      _scene.background = new T.Color(0x000008);
      _scene.fog = new T.Fog(0x000008, 100, 500);
    }
    if (!_camera) {
      _camera = new T.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    }
    if (!_renderer) {
      _renderer = new T.WebGLRenderer({ antialias: true });
      _renderer.setSize(window.innerWidth, window.innerHeight);
      _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      document.body.appendChild(_renderer.domElement);
    }

    _clock = new T.Clock();

    _buildStation();
    _buildPlayer();
    _buildHUD();

    // Kick off first boarding squad
    _boardingTimer = 0;
    _nextSquadTime = 12;

    // Start render loop
    _renderLoop();
  }

  // ── Render Loop ───────────────────────────────────────────────────────────────
  function _renderLoop() {
    if (!_active) return;
    requestAnimationFrame(_renderLoop);
    var dt = Math.min(_clock.getDelta(), 0.05);
    update(dt);
    _renderer.render(_scene, _camera);
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  function init(scene, camera, renderer) {
    _scene    = scene    || _scene;
    _camera   = camera   || _camera;
    _renderer = renderer || _renderer;

    window.addEventListener('keydown',   _onKeyDown, false);
    window.addEventListener('keyup',     _onKeyUp,   false);
    window.addEventListener('mousemove', _onMouseMove, false);
    window.addEventListener('click',     _onClick,   false);
  }

  function update(dt) {
    if (!_active || _gameOver || _gameWon) return;
    if (!dt) {
      if (_clock) dt = _clock.getDelta();
      else dt = 0.016;
    }
    dt = Math.min(dt, 0.05);

    _fireCooldown = Math.max(0, _fireCooldown - dt);

    _updatePlayer(dt);
    _updateWaves(dt);
    _updateBoarding(dt);
    _updateMissiles(dt);
    _updateBullets(dt);
    _updateCosmonauts(dt);
    _updateTurrets(dt);
    _updatePlasmaFlash(dt);
    _updateExplosions(dt);

    _updateHUD();
    _checkWinLose();
  }

  function reset() {
    var T = _getThree();
    // Remove all dynamic objects from scene
    var i;
    for (i = 0; i < _missiles.length; i++) {
      if (_missiles[i].mesh && _scene) _scene.remove(_missiles[i].mesh);
    }
    for (i = 0; i < _cosmonauts.length; i++) {
      if (_scene) {
        _scene.remove(_cosmonauts[i].mesh);
        _scene.remove(_cosmonauts[i].helmet);
        _scene.remove(_cosmonauts[i].light);
      }
    }
    for (i = 0; i < _bullets.length; i++) {
      if (_scene) _scene.remove(_bullets[i].mesh);
    }
    for (i = 0; i < _explosions.length; i++) {
      if (_scene) _scene.remove(_explosions[i].mesh);
    }
    if (_hudEl && _hudEl.parentNode) _hudEl.parentNode.removeChild(_hudEl);
    if (_overlayEl && _overlayEl.parentNode) _overlayEl.parentNode.removeChild(_overlayEl);

    // Reset state
    _missiles         = [];
    _cosmonauts       = [];
    _bullets          = [];
    _explosions       = [];
    _plasmaFlash      = [];
    _turrets          = [];
    _bulkheads        = [];
    _patchLockers     = [];
    _airlocks         = [];
    _moduleData       = [];
    _solarPanels      = [];

    _active           = false;
    _gameOver         = false;
    _gameWon          = false;
    _playerHP         = PLAYER_HP_MAX;
    _suitDamaged      = false;
    _patchKits        = PATCH_KIT_COUNT;
    _reactorHP        = REACTOR_HP_MAX;
    _cosmonautsAlive  = 0;
    _currentWave      = 0;
    _waveActive       = false;
    _waveTimer        = 0;
    _boardingTimer    = 0;
    _squadsDeployed   = 0;
    _commanderSpawned = false;
    _nextSquadTime    = 12;
    _fireCooldown     = 0;
    _yaw              = 0;
    _pitch            = 0;
    _keys             = {};
    _hudEl            = null;
    _overlayEl        = null;
    _hub              = null;
    _moduleA          = null;
    _moduleB          = null;
    _moduleC          = null;
    _reactorMesh      = null;
    _playerPos        = null;
    _playerVel        = null;
    _playerMesh       = null;
    _playerGroup      = null;

    if (_scene) {
      // Clear static station meshes
      while (_scene.children.length > 0) {
        _scene.remove(_scene.children[0]);
      }
    }
  }

  // Register event listeners once on load
  window.addEventListener('keydown',   _onKeyDown,   false);
  window.addEventListener('keyup',     _onKeyUp,     false);
  window.addEventListener('mousemove', _onMouseMove, false);
  window.addEventListener('click',     _onClick,     false);

  return { init: init, update: update, reset: reset };

}());
