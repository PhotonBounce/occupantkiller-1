// radio-tower.js — Radio Tower Capture & Defense Module for OccupantKiller
// Activation: R+T simultaneous (400ms window)
// Features: tower structure, capture mechanic, enemy waves, fortification building,
//           tower climb, jamming, repair, enemy commander, signal beacon, HUD
// Depends on: THREE (global), window.HUD (optional), window.KillFeed (optional)
// API: RadioTower.init(scene, camera, playerRef), .update(dt), .reset()

window.RadioTower = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────
  var TOWER_X            = 0;
  var TOWER_Y            = 0;
  var TOWER_Z            = 0;
  var CAPTURE_RADIUS     = 5;
  var CAPTURE_TIME       = 10;      // seconds to fully capture
  var WAVE_INTERVAL      = 60;      // seconds between waves
  var TOTAL_WAVES        = 5;
  var ENEMY_SPEED        = 3.5;
  var ENEMY_ATTACK_RANGE = 2.5;
  var JAM_THRESHOLD      = 15;      // enemy-controlled seconds before jamming
  var SIGNAL_BEACON_TIME = 120;     // seconds of broadcast for airstrike
  var AIRSTRIKE_EXPLOSIONS = 5;
  var REINFORCE_INTERVAL = 30;      // commander reinforcement call interval
  var COMMANDER_SCALE    = 1.5;
  var WIRE_DAMAGE        = 15;
  var CLAYMORE_RADIUS    = 4;
  var CLAYMORE_DAMAGE    = 80;
  var SNIPER_FOV         = 30;
  var NORMAL_FOV         = 75;
  var LADDER_HEIGHT      = 25;
  var PLATFORM_LEVELS    = [5, 12, 18, 25];
  var CLIMB_SPEED        = 4;       // units/sec

  // Color constants
  var COL_LEGS       = 0x888888;
  var COL_MAST       = 0x666666;
  var COL_BRACE      = 0x777777;
  var COL_DISH       = 0xAAAAAA;
  var COL_CONSOLE    = 0x334433;
  var COL_CONSOLE_LIT= 0x44FF44;
  var COL_SANDBAG    = 0x8B6914;
  var COL_CLAYMORE   = 0x556655;
  var COL_ENEMY      = 0xCC2222;
  var COL_COMMANDER  = 0x224422;
  var COL_BTR        = 0x334433;
  var COL_HELI       = 0x222244;
  var COL_PLATFORM   = 0x555555;
  var COL_LADDER     = 0x888866;
  var COL_EXPLOSION  = 0xFF6600;
  var COL_SIGNAL     = 0x00FF88;
  var COL_WRENCH     = 0xAA8833;

  // ── Module state ───────────────────────────────────────────────────────
  var _scene          = null;
  var _camera         = null;
  var _player         = null;
  var _initialized    = false;
  var _active         = false;      // module activated by R+T

  // Key tracking for R+T activation
  var _rKeyTime       = 0;
  var _tKeyTime       = 0;
  var _keysDown       = {};

  // Tower structure refs
  var _towerGroup     = null;
  var _legs           = [];         // 4 CylinderGeometry leg meshes
  var _legHP          = [1, 1, 1, 1]; // 1=intact 0=destroyed
  var _mast           = null;
  var _dish           = null;
  var _dishAngle      = 0;
  var _beacon         = null;       // PointLight
  var _console        = null;       // BoxGeometry console mesh
  var _platforms      = [];         // BoxGeometry platform meshes per level
  var _ladderMesh     = null;

  // Capture state
  var _controlState   = 'NEUTRAL'; // 'OURS', 'ENEMY', 'NEUTRAL'
  var _captureProgress= 0;         // 0..1
  var _capturing      = false;
  var _enemyCapturing = false;
  var _enemyControlTime = 0;       // seconds enemy has held tower
  var _jamming        = false;
  var _signalStrength = 100;       // 0..100 %
  var _signalBroadcast= false;
  var _broadcastTimer = 0;
  var _airstrikeActive= false;
  var _airstrikeCount = 0;
  var _airstrikeTimer = 0;

  // Wave state
  var _currentWave    = 0;
  var _waveTimer      = WAVE_INTERVAL;
  var _waveActive     = false;
  var _enemies        = [];         // active enemy objects
  var _explosions     = [];         // active explosion particles

  // Fortification state
  var _fortBuilding   = false;
  var _fortType       = null;       // 'SANDBAG','WIRE','CLAYMORE'
  var _fortStructures = [];         // built fortification mesh objects
  var _fortMenu       = null;       // DOM element

  // Climb state
  var _climbing       = false;
  var _climbHeight    = 0;
  var _atTop          = false;
  var _sniperActive   = false;

  // Repair state
  var _wrenchProps    = [];
  var _repairing      = false;
  var _repairTimer    = 0;
  var _repairLegIdx   = -1;

  // Commander state
  var _commanderEnemy = null;
  var _commanderReinfTimer = 0;

  // HUD
  var _hudEl          = null;
  var _staticOverlay  = null;
  var _promptEl       = null;

  // ── Geometry helpers ───────────────────────────────────────────────────
  function _makeMesh(geo, color, transparent, opacity) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (transparent) {
      mat.transparent = true;
      mat.opacity = opacity || 0.7;
    }
    return new THREE.Mesh(geo, mat);
  }

  function _makeWireframe(geo, color) {
    var edges = new THREE.EdgesGeometry(geo);
    var mat   = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(edges, mat);
  }

  function _dist3D(ax, ay, az, bx, by, bz) {
    var dx = ax - bx, dy = ay - by, dz = az - bz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // ── Tower Structure Construction ───────────────────────────────────────
  function _buildTower() {
    _towerGroup = new THREE.Group();
    _towerGroup.position.set(TOWER_X, TOWER_Y, TOWER_Z);
    _scene.add(_towerGroup);

    // 4 legs: square formation at corners ±3
    var legPositions = [
      [-3, 0, -3],
      [ 3, 0, -3],
      [ 3, 0,  3],
      [-3, 0,  3]
    ];
    var legGeo = new THREE.CylinderGeometry(0.2, 0.3, 20, 8);
    _legs = [];
    for (var i = 0; i < 4; i++) {
      var legMesh = _makeMesh(legGeo, COL_LEGS);
      legMesh.position.set(legPositions[i][0], 10, legPositions[i][2]);
      _towerGroup.add(legMesh);
      _legs.push(legMesh);
    }

    // 3 horizontal cross-braces at y=5, y=12, y=18
    var braceHeights = [5, 12, 18];
    for (var b = 0; b < braceHeights.length; b++) {
      var bh = braceHeights[b];
      // X-axis brace
      var braceGeoX = new THREE.BoxGeometry(6.5, 0.2, 0.2);
      var bx1 = _makeMesh(braceGeoX, COL_BRACE);
      bx1.position.set(0, bh, -3);
      _towerGroup.add(bx1);
      var bx2 = _makeMesh(new THREE.BoxGeometry(6.5, 0.2, 0.2), COL_BRACE);
      bx2.position.set(0, bh, 3);
      _towerGroup.add(bx2);
      // Z-axis brace
      var braceGeoZ = new THREE.BoxGeometry(0.2, 0.2, 6.5);
      var bz1 = _makeMesh(braceGeoZ, COL_BRACE);
      bz1.position.set(-3, bh, 0);
      _towerGroup.add(bz1);
      var bz2 = _makeMesh(new THREE.BoxGeometry(0.2, 0.2, 6.5), COL_BRACE);
      bz2.position.set(3, bh, 0);
      _towerGroup.add(bz2);
      // Diagonal braces (X shape on each face)
      var diagLen = Math.sqrt(6.5 * 6.5 + 6 * 6);
      var diagGeo = new THREE.BoxGeometry(diagLen, 0.15, 0.15);
      var diag1 = _makeMesh(diagGeo, COL_BRACE);
      diag1.position.set(0, bh - 3, -3);
      diag1.rotation.z = Math.atan2(6, 6.5);
      _towerGroup.add(diag1);
    }

    // Central mast: r=0.4, h=25
    var mastGeo = new THREE.CylinderGeometry(0.4, 0.5, 25, 8);
    _mast = _makeMesh(mastGeo, COL_MAST);
    _mast.position.set(0, 12.5, 0);
    _towerGroup.add(_mast);

    // Dish: BoxGeometry 3x0.3x3 at top of mast
    var dishGeo = new THREE.BoxGeometry(3, 0.3, 3);
    _dish = _makeMesh(dishGeo, COL_DISH);
    _dish.position.set(0, 26, 0);
    _towerGroup.add(_dish);

    // Dish support arm
    var armGeo = new THREE.BoxGeometry(0.2, 2, 0.2);
    var arm = _makeMesh(armGeo, COL_MAST);
    arm.position.set(0, 25, 0);
    _towerGroup.add(arm);

    // Beacon PointLight (red) at top
    _beacon = new THREE.PointLight(0xFF0000, 1.5, 20);
    _beacon.position.set(0, 27, 0);
    _towerGroup.add(_beacon);

    // Platforms at each level
    var platHeights = PLATFORM_LEVELS;
    _platforms = [];
    for (var p = 0; p < platHeights.length; p++) {
      var platGeo = new THREE.BoxGeometry(2, 0.2, 2);
      var plat = _makeMesh(platGeo, COL_PLATFORM);
      plat.position.set(0, platHeights[p], 0);
      _towerGroup.add(plat);
      _platforms.push(plat);
    }

    // Ladder (thin cylinder alongside mast)
    var ladderGeo = new THREE.CylinderGeometry(0.05, 0.05, LADDER_HEIGHT, 4);
    _ladderMesh = _makeMesh(ladderGeo, COL_LADDER);
    _ladderMesh.position.set(0.5, LADDER_HEIGHT / 2, 0.5);
    _towerGroup.add(_ladderMesh);

    // Control console at base
    var consoleGeo = new THREE.BoxGeometry(1.5, 1, 0.6);
    _console = _makeMesh(consoleGeo, COL_CONSOLE);
    _console.position.set(2, 0.5, 0);
    _towerGroup.add(_console);

    // Wrench prop for repair (2 spawned near base)
    _buildWrenchProps();
  }

  function _buildWrenchProps() {
    _wrenchProps = [];
    var positions = [[4, 0.3, 2], [-4, 0.3, 2]];
    for (var w = 0; w < positions.length; w++) {
      var wGeo = new THREE.BoxGeometry(0.4, 0.15, 0.1);
      var wMesh = _makeMesh(wGeo, COL_WRENCH);
      wMesh.position.set(TOWER_X + positions[w][0], positions[w][1], TOWER_Z + positions[w][2]);
      wMesh.userData.isWrench = true;
      wMesh.userData.legIndex = w; // wrench w repairs leg w
      _scene.add(wMesh);
      _wrenchProps.push(wMesh);
    }
  }

  // ── HUD Setup ──────────────────────────────────────────────────────────
  function _buildHUD() {
    // Main HUD bar
    _hudEl = document.createElement('div');
    _hudEl.id = 'rt-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#DDFFDD',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #336633',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:900',
      'display:none',
      'letter-spacing:1px',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Static jamming overlay
    _staticOverlay = document.createElement('div');
    _staticOverlay.id = 'rt-static';
    _staticOverlay.style.cssText = [
      'position:fixed',
      'top:0','left:0','width:100%','height:100%',
      'pointer-events:none',
      'z-index:850',
      'display:none',
      'background:repeating-linear-gradient(0deg,rgba(0,255,0,0.03) 0px,rgba(0,255,0,0.03) 1px,transparent 1px,transparent 3px)',
      'animation:rt-static-anim 0.08s steps(4) infinite'
    ].join(';');
    document.body.appendChild(_staticOverlay);

    // Add keyframe animation via style tag
    var styleTag = document.getElementById('rt-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'rt-style';
      styleTag.textContent = [
        '@keyframes rt-static-anim{',
        '0%{opacity:0.4;background-position:0 0}',
        '25%{opacity:0.7;background-position:0 3px}',
        '50%{opacity:0.3;background-position:0 1px}',
        '75%{opacity:0.8;background-position:0 2px}',
        '100%{opacity:0.5;background-position:0 0}',
        '}'
      ].join('');
      document.head.appendChild(styleTag);
    }

    // Prompt / action prompt at bottom
    _promptEl = document.createElement('div');
    _promptEl.id = 'rt-prompt';
    _promptEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#AAFFAA',
      'font-family:monospace',
      'font-size:12px',
      'padding:4px 12px',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:900',
      'display:none'
    ].join(';');
    document.body.appendChild(_promptEl);

    // Fort build menu
    _fortMenu = document.createElement('div');
    _fortMenu.id = 'rt-fort-menu';
    _fortMenu.style.cssText = [
      'position:fixed',
      'bottom:100px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:#DDFFDD',
      'font-family:monospace',
      'font-size:12px',
      'padding:8px 16px',
      'border:1px solid #336633',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:910',
      'display:none'
    ].join(';');
    _fortMenu.innerHTML = '[1] SANDBAG  [2] WIRE  [3] CLAYMORE  [ESC] CANCEL';
    document.body.appendChild(_fortMenu);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_active) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';

    var ctrl  = _controlState;
    var capPct = Math.floor(_captureProgress * 100);
    var wave  = _currentWave + '/' + TOTAL_WAVES;
    var sig   = Math.floor(_signalStrength);
    var nextWave = Math.max(0, Math.ceil(_waveTimer));
    var mm = Math.floor(nextWave / 60);
    var ss = nextWave % 60;
    var timeStr = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;

    if (_jamming) {
      _hudEl.innerHTML = 'RADIO TOWER [JAMMED] [!!!] [WAVE: ' + wave + '] | RECAPTURE TO RESTORE';
      _staticOverlay.style.display = 'block';
    } else {
      _staticOverlay.style.display = 'none';
      var capStr = (_captureProgress > 0 && _controlState !== 'OURS')
        ? ' [CAPTURE: ' + capPct + '%]' : '';
      _hudEl.innerHTML = 'RADIO TOWER'
        + ' [CONTROL: ' + ctrl + ']'
        + capStr
        + ' [WAVE: ' + wave + ']'
        + ' [SIGNAL: ' + sig + '%]'
        + ' | NEXT WAVE: ' + timeStr;
    }

    // Color code
    if (ctrl === 'OURS') {
      _hudEl.style.borderColor = '#44FF44';
      _hudEl.style.color = '#AAFFAA';
    } else if (ctrl === 'ENEMY') {
      _hudEl.style.borderColor = '#FF4444';
      _hudEl.style.color = '#FFAAAA';
    } else {
      _hudEl.style.borderColor = '#888888';
      _hudEl.style.color = '#DDDDDD';
    }

    // Prompt
    _updatePrompt();
  }

  function _updatePrompt() {
    if (!_promptEl) return;
    var px = _player ? _player.position.x : 0;
    var py = _player ? _player.position.y : 0;
    var pz = _player ? _player.position.z : 0;
    var distToBase = _dist2D(px, pz, TOWER_X, TOWER_Z);

    var msg = '';
    if (_climbing) {
      msg = '[W] CLIMB  [S] DESCEND  [E] EXIT LADDER';
    } else if (distToBase < 1.5) {
      msg = '[E] CLIMB TOWER  [B] BUILD FORTIFICATION';
      if (_controlState !== 'OURS' && !_capturing) msg += '  [E] START CAPTURE';
    } else if (distToBase < CAPTURE_RADIUS) {
      if (_controlState !== 'OURS' && !_capturing) {
        msg = '[E] START CAPTURE';
      }
      if (_capturing) {
        var pct = Math.floor(_captureProgress * 100);
        msg = 'CAPTURING... ' + pct + '%  [HOLD POSITION]';
      }
      msg += '  [B] BUILD';
    } else if (_repairing) {
      msg = 'REPAIRING LEG... ' + Math.floor((8 - _repairTimer)) + 's';
    }

    // Check wrench nearby
    if (!_repairing && _legHP.indexOf(0) !== -1) {
      for (var w = 0; w < _wrenchProps.length; w++) {
        var wp = _wrenchProps[w];
        if (!wp) continue;
        var wd = _dist3D(px, py, pz, wp.position.x, wp.position.y, wp.position.z);
        if (wd < 2) {
          msg = '[E] PICK UP WRENCH TO REPAIR LEG ' + (wp.userData.legIndex + 1);
          break;
        }
      }
    }

    if (msg) {
      _promptEl.style.display = 'block';
      _promptEl.textContent = msg;
    } else {
      _promptEl.style.display = 'none';
    }
  }

  // ── Wave / Enemy System ────────────────────────────────────────────────
  function _getWaveConfig(waveNum) {
    // Returns array of enemy descriptor objects
    var configs = {
      1: [
        { type: 'infantry', count: 4 }
      ],
      2: [
        { type: 'infantry', count: 4 },
        { type: 'jeep',     count: 1 }
      ],
      3: [
        { type: 'infantry', count: 6 },
        { type: 'rpg',      count: 1 },
        { type: 'commander',count: 1 }
      ],
      4: [
        { type: 'infantry', count: 6 },
        { type: 'btr',      count: 1 },
        { type: 'commander',count: 1 }
      ],
      5: [
        { type: 'infantry', count: 8 },
        { type: 'rpg',      count: 2 },
        { type: 'helicopter', count: 1 },
        { type: 'commander',count: 1 }
      ]
    };
    return configs[waveNum] || [];
  }

  function _spawnWave(waveNum) {
    _waveActive = true;
    _showWaveAnnouncement(waveNum);
    var cfgList = _getWaveConfig(waveNum);

    for (var c = 0; c < cfgList.length; c++) {
      var cfg = cfgList[c];
      for (var n = 0; n < cfg.count; n++) {
        _spawnEnemy(cfg.type, n);
      }
    }
  }

  function _randomSpawnPos() {
    // Spawn in ring around tower, 25-40 units away
    var angle = Math.random() * Math.PI * 2;
    var r     = 25 + Math.random() * 15;
    return {
      x: TOWER_X + Math.cos(angle) * r,
      y: 0,
      z: TOWER_Z + Math.sin(angle) * r
    };
  }

  function _spawnEnemy(type, idx) {
    var pos  = _randomSpawnPos();
    var size, color, hp, speed, isCommander, isVehicle, isHeli;

    size        = { w: 0.6, h: 1.8, d: 0.4 };
    color       = COL_ENEMY;
    hp          = 30;
    speed       = ENEMY_SPEED;
    isCommander = false;
    isVehicle   = false;
    isHeli      = false;

    if (type === 'rpg') {
      color = 0xFF4400;
      hp    = 40;
      size  = { w: 0.7, h: 1.8, d: 0.5 };
    } else if (type === 'commander') {
      color       = COL_COMMANDER;
      hp          = 80;
      size        = { w: 0.9, h: 2.7, d: 0.6 };
      isCommander = true;
    } else if (type === 'jeep') {
      color     = 0x335522;
      hp        = 50;
      size      = { w: 2, h: 1.2, d: 3.5 };
      isVehicle = true;
      speed     = ENEMY_SPEED * 1.8;
    } else if (type === 'btr') {
      color     = COL_BTR;
      hp        = 120;
      size      = { w: 3, h: 1.5, d: 5 };
      isVehicle = true;
      speed     = ENEMY_SPEED * 1.2;
    } else if (type === 'helicopter') {
      color   = COL_HELI;
      hp      = 100;
      size    = { w: 4, h: 1.5, d: 5 };
      isHeli  = true;
      speed   = ENEMY_SPEED * 2;
      pos.y   = 15;
    }

    var geo  = new THREE.BoxGeometry(size.w, size.h, size.d);
    var mesh = _makeMesh(geo, color);
    mesh.position.set(pos.x, pos.y + size.h / 2, pos.z);
    if (isCommander) mesh.scale.set(COMMANDER_SCALE, COMMANDER_SCALE, COMMANDER_SCALE);
    _scene.add(mesh);

    var enemy = {
      mesh:        mesh,
      type:        type,
      hp:          hp,
      maxHp:       hp,
      speed:       speed,
      isCommander: isCommander,
      isVehicle:   isVehicle,
      isHeli:      isHeli,
      attacking:   false,
      dead:        false,
      reinforceTimer: REINFORCE_INTERVAL
    };

    if (isCommander) _commanderEnemy = enemy;
    _enemies.push(enemy);
  }

  function _updateEnemies(dt) {
    var px = _player ? _player.position.x : 0;
    var py = _player ? _player.position.y : 0;
    var pz = _player ? _player.position.z : 0;

    for (var i = _enemies.length - 1; i >= 0; i--) {
      var e = _enemies[i];
      if (!e || e.dead) {
        if (e && e.mesh) _scene.remove(e.mesh);
        _enemies.splice(i, 1);
        continue;
      }

      var ex = e.mesh.position.x;
      var ey = e.mesh.position.y;
      var ez = e.mesh.position.z;

      // Move toward tower base (or player if close)
      var targetX = TOWER_X;
      var targetZ = TOWER_Z;
      var distPlayer = _dist2D(ex, ez, px, pz);
      if (distPlayer < 12) {
        targetX = px;
        targetZ = pz;
      }

      var dx    = targetX - ex;
      var dz    = targetZ - ez;
      var dist  = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.5) {
        var nx = dx / dist;
        var nz = dz / dist;
        e.mesh.position.x += nx * e.speed * dt;
        e.mesh.position.z += nz * e.speed * dt;
        // Face direction of movement
        e.mesh.rotation.y = Math.atan2(nx, nz);
      }

      // Helicopter bobs up and down
      if (e.isHeli) {
        e.mesh.position.y = 15 + Math.sin(Date.now() * 0.001 + i) * 1.5;
      }

      // Check claymore triggers
      _checkClaymoreTrigger(e);

      // Check fortification wire slow
      _checkWireObstacle(e, dt);

      // Enemy capture interference
      var distToTower = _dist2D(ex, ez, TOWER_X, TOWER_Z);
      if (distToTower < CAPTURE_RADIUS) {
        _enemyCapturing = true;
        if (_capturing) {
          // Enemy steals capture progress
          _captureProgress = Math.max(0, _captureProgress - dt * 0.05);
        }
        if (_controlState === 'OURS') {
          _captureProgress = Math.max(0, _captureProgress + dt * 0.04);
        }
      }

      // Commander reinforcement call
      if (e.isCommander && !e.dead) {
        e.reinforceTimer -= dt;
        if (e.reinforceTimer <= 0) {
          e.reinforceTimer = REINFORCE_INTERVAL;
          _spawnCommanderReinforcements();
        }
      }

      // Check if enemy is attacking player
      if (distPlayer < ENEMY_ATTACK_RANGE) {
        e.attacking = true;
        // Deal damage to player (signal via global if available)
        if (window.Player && window.Player.takeDamage) {
          window.Player.takeDamage(5 * dt);
        }
      } else {
        e.attacking = false;
      }

      // RPG fires at tower legs
      if (e.type === 'rpg' && distToTower < 20 && Math.random() < 0.002) {
        _rpgHitTower();
      }
    }

    // Determine enemy capture control
    _enemyCapturing = _enemies.some(function(e2) {
      if (!e2 || e2.dead) return false;
      return _dist2D(e2.mesh.position.x, e2.mesh.position.z, TOWER_X, TOWER_Z) < CAPTURE_RADIUS;
    });
  }

  function _spawnCommanderReinforcements() {
    // Spawn 2 infantry as reinforcements
    _spawnEnemy('infantry', 0);
    _spawnEnemy('infantry', 1);
    _showMessage('ENEMY COMMANDER CALLED REINFORCEMENTS!', 0xFF4400);
  }

  function _rpgHitTower() {
    // Damage a random intact leg
    var intact = [];
    for (var i = 0; i < 4; i++) {
      if (_legHP[i] > 0) intact.push(i);
    }
    if (intact.length === 0) return;
    var target = intact[Math.floor(Math.random() * intact.length)];
    // Only 2 legs can be destroyed
    var destroyed = 0;
    for (var j = 0; j < 4; j++) { if (_legHP[j] === 0) destroyed++; }
    if (destroyed >= 2) return;

    _legHP[target] = 0;
    if (_legs[target]) {
      _legs[target].material.color.setHex(0x333333);
      _legs[target].material.opacity = 0.4;
      _legs[target].material.transparent = true;
    }
    _updateSignalStrength();
    _spawnExplosion(
      TOWER_X + (target < 2 ? -3 : 3),
      5,
      TOWER_Z + (target % 2 === 0 ? -3 : 3)
    );
    _showMessage('TOWER LEG DAMAGED! SIGNAL REDUCED!', 0xFF8800);
  }

  function _updateSignalStrength() {
    var intact = 0;
    for (var i = 0; i < 4; i++) { if (_legHP[i] > 0) intact++; }
    // Full signal at 4 legs; each destroyed leg costs 25%
    var legFactor = intact / 4;
    var baseSig   = _controlState === 'OURS' ? 100 : 0;
    _signalStrength = Math.floor(baseSig * legFactor);
  }

  // ── Fortification System ───────────────────────────────────────────────
  function _openFortMenu() {
    _fortBuilding = true;
    if (_fortMenu) _fortMenu.style.display = 'block';
  }

  function _closeFortMenu() {
    _fortBuilding = false;
    _fortType     = null;
    if (_fortMenu) _fortMenu.style.display = 'none';
  }

  function _buildFortification(type) {
    _fortType = type;
    _closeFortMenu();

    var px = _player ? _player.position.x : TOWER_X + 5;
    var pz = _player ? _player.position.z : TOWER_Z + 5;

    var mesh, struct;

    if (type === 'SANDBAG') {
      var geo = new THREE.BoxGeometry(2, 1, 0.5);
      mesh = _makeMesh(geo, COL_SANDBAG);
      mesh.position.set(px, 0.5, pz);
      _scene.add(mesh);
      struct = { mesh: mesh, type: 'SANDBAG' };

    } else if (type === 'WIRE') {
      // LineSegments tangle: 5x0.5 bounding area
      var pts = [];
      for (var w = 0; w < 12; w++) {
        var wx = px + (Math.random() - 0.5) * 5;
        var wz = pz + (Math.random() - 0.5) * 5;
        var wx2 = px + (Math.random() - 0.5) * 5;
        var wz2 = pz + (Math.random() - 0.5) * 5;
        pts.push(wx,  0.3 + Math.random() * 0.2, wz);
        pts.push(wx2, 0.3 + Math.random() * 0.2, wz2);
      }
      var wireGeo = new THREE.BufferGeometry();
      wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      var wireMat = new THREE.LineBasicMaterial({ color: 0x888855 });
      var wireLines = new THREE.LineSegments(wireGeo, wireMat);
      _scene.add(wireLines);
      struct = {
        mesh:    wireLines,
        type:    'WIRE',
        cx:      px,
        cz:      pz,
        radius:  3
      };

    } else if (type === 'CLAYMORE') {
      var clGeo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
      mesh = _makeMesh(clGeo, COL_CLAYMORE);
      mesh.position.set(px, 0.1, pz);
      _scene.add(mesh);
      struct = {
        mesh:      mesh,
        type:      'CLAYMORE',
        armed:     true,
        triggered: false
      };
    }

    if (struct) _fortStructures.push(struct);
  }

  function _checkClaymoreTrigger(enemy) {
    for (var i = 0; i < _fortStructures.length; i++) {
      var s = _fortStructures[i];
      if (!s || s.type !== 'CLAYMORE' || !s.armed || s.triggered) continue;
      var dx = s.mesh.position.x - enemy.mesh.position.x;
      var dz = s.mesh.position.z - enemy.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.5) {
        s.triggered = true;
        s.armed     = false;
        _detonateClaymore(s);
      }
    }
  }

  function _detonateClaymore(struct) {
    var cx = struct.mesh.position.x;
    var cz = struct.mesh.position.z;
    _spawnExplosion(cx, 0.5, cz);
    // Damage all enemies in radius
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e || e.dead) continue;
      var dx = e.mesh.position.x - cx;
      var dz = e.mesh.position.z - cz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < CLAYMORE_RADIUS) {
        e.hp -= CLAYMORE_DAMAGE * (1 - dist / CLAYMORE_RADIUS);
        if (e.hp <= 0) _killEnemy(e);
      }
    }
    _scene.remove(struct.mesh);
    struct.mesh = null;
  }

  function _checkWireObstacle(enemy, dt) {
    for (var i = 0; i < _fortStructures.length; i++) {
      var s = _fortStructures[i];
      if (!s || s.type !== 'WIRE') continue;
      var dx = enemy.mesh.position.x - s.cx;
      var dz = enemy.mesh.position.z - s.cz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < s.radius) {
        // Slow enemy and apply wire damage
        enemy.mesh.position.x -= (enemy.mesh.position.x - TOWER_X) * 0.003;
        enemy.mesh.position.z -= (enemy.mesh.position.z - TOWER_Z) * 0.003;
        enemy.hp -= WIRE_DAMAGE * dt;
        if (enemy.hp <= 0) _killEnemy(enemy);
      }
    }
  }

  function _killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    _spawnExplosion(
      enemy.mesh.position.x,
      enemy.mesh.position.y,
      enemy.mesh.position.z
    );
    if (enemy === _commanderEnemy) {
      _commanderEnemy = null;
      _showMessage('ENEMY COMMANDER ELIMINATED!', 0x44FF44);
    }
    // Check wave clear
    _checkWaveClear();
  }

  function _checkWaveClear() {
    var alive = _enemies.filter(function(e) { return e && !e.dead; });
    if (alive.length === 0 && _waveActive) {
      _waveActive = false;
      if (_currentWave >= TOTAL_WAVES) {
        _showMessage('ALL WAVES REPELLED! TOWER SECURED!', 0x44FF44);
      } else {
        _showMessage('WAVE ' + _currentWave + ' REPELLED!', 0x44FF44);
      }
    }
  }

  // ── Explosion Effects ──────────────────────────────────────────────────
  function _spawnExplosion(x, y, z) {
    var expGeo  = new THREE.SphereGeometry(1.5, 6, 6);
    var expMesh = _makeMesh(expGeo, COL_EXPLOSION, true, 0.9);
    expMesh.position.set(x, y, z);
    _scene.add(expMesh);
    _explosions.push({
      mesh:  expMesh,
      life:  0.6,
      timer: 0
    });
  }

  function _updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var exp = _explosions[i];
      exp.timer += dt;
      var t = exp.timer / exp.life;
      if (t >= 1) {
        _scene.remove(exp.mesh);
        _explosions.splice(i, 1);
        continue;
      }
      var s = 1 + t * 2.5;
      exp.mesh.scale.set(s, s, s);
      exp.mesh.material.opacity = 0.9 * (1 - t);
    }
  }

  // ── Airstrike Sequence ─────────────────────────────────────────────────
  function _triggerAirstrike() {
    _airstrikeActive = true;
    _airstrikeCount  = 0;
    _airstrikeTimer  = 0;
    _showMessage('AIRSTRIKE INCOMING! TAKE COVER!', 0x00FF88);
  }

  function _updateAirstrike(dt) {
    if (!_airstrikeActive) return;
    _airstrikeTimer -= dt;
    if (_airstrikeTimer <= 0) {
      if (_airstrikeCount >= AIRSTRIKE_EXPLOSIONS) {
        _airstrikeActive = false;
        // Kill remaining enemies
        for (var i = 0; i < _enemies.length; i++) {
          if (_enemies[i] && !_enemies[i].dead) _killEnemy(_enemies[i]);
        }
        _showMessage('AIRSTRIKE COMPLETE! AREA CLEAR!', 0x44FF44);
        return;
      }
      // Spawn explosion at random enemy or random point near tower
      var ex, ez;
      var alive = _enemies.filter(function(e) { return e && !e.dead; });
      if (alive.length > 0) {
        var target = alive[Math.floor(Math.random() * alive.length)];
        ex = target.mesh.position.x;
        ez = target.mesh.position.z;
        _killEnemy(target);
      } else {
        var angle = Math.random() * Math.PI * 2;
        ex = TOWER_X + Math.cos(angle) * (10 + Math.random() * 20);
        ez = TOWER_Z + Math.sin(angle) * (10 + Math.random() * 20);
      }
      _spawnExplosion(ex, 1, ez);
      _airstrikeCount++;
      _airstrikeTimer = 0.8 + Math.random() * 0.4;
    }
  }

  // ── Capture Logic ──────────────────────────────────────────────────────
  function _updateCapture(dt) {
    var px = _player ? _player.position.x : 999;
    var pz = _player ? _player.position.z : 999;
    var distToTower = _dist2D(px, pz, TOWER_X, TOWER_Z);
    var playerNear  = distToTower < CAPTURE_RADIUS;

    if (_capturing && playerNear && !_enemyCapturing) {
      _captureProgress += dt / CAPTURE_TIME;
      if (_captureProgress >= 1) {
        _captureProgress = 1;
        _capturing       = false;
        _controlState    = 'OURS';
        _onTowerCaptured();
      }
    } else if (_capturing && _enemyCapturing) {
      // Enemy contests — pause capture
    } else if (!playerNear && _capturing) {
      // Player left the zone — pause capture
    }

    // Enemy recapture
    if (_enemyCapturing && _controlState === 'OURS') {
      _captureProgress = Math.max(0, _captureProgress - dt * 0.06);
      if (_captureProgress <= 0) {
        _controlState = 'ENEMY';
        _onTowerLost();
      }
    }

    // Jamming timer
    if (_controlState === 'ENEMY') {
      _enemyControlTime += dt;
      if (_enemyControlTime >= JAM_THRESHOLD) {
        _jamming = true;
      }
    } else {
      _enemyControlTime = 0;
      _jamming          = false;
    }

    // Broadcast / airstrike
    if (_controlState === 'OURS' && _signalStrength >= 80) {
      if (!_signalBroadcast) {
        _signalBroadcast = true;
        _broadcastTimer  = SIGNAL_BEACON_TIME;
        _showMessage('SIGNAL BROADCAST INITIATED! AIRSTRIKE IN ' + SIGNAL_BEACON_TIME + 's', 0x00FF88);
      }
    }

    if (_signalBroadcast && _controlState === 'OURS') {
      _broadcastTimer -= dt;
      if (_broadcastTimer <= 0 && !_airstrikeActive) {
        _signalBroadcast = false;
        _triggerAirstrike();
      }
    } else if (_controlState !== 'OURS') {
      _signalBroadcast = false;
    }
  }

  function _onTowerCaptured() {
    _showMessage('RADIO TOWER CAPTURED!', 0x44FF44);
    if (_console) _console.material.color.setHex(COL_CONSOLE_LIT);
    _updateSignalStrength();
  }

  function _onTowerLost() {
    _showMessage('TOWER LOST! ENEMY IN CONTROL!', 0xFF4444);
    if (_console) _console.material.color.setHex(COL_CONSOLE);
    _signalStrength = 0;
  }

  // ── Repair System ──────────────────────────────────────────────────────
  function _startRepair(legIdx) {
    if (_repairing) return;
    _repairing    = true;
    _repairTimer  = 0;
    _repairLegIdx = legIdx;
    _showMessage('REPAIRING LEG ' + (legIdx + 1) + '...', 0xAAAA44);
  }

  function _updateRepair(dt) {
    if (!_repairing) return;
    _repairTimer += dt;
    if (_repairTimer >= 8) {
      // Repair complete
      _legHP[_repairLegIdx] = 1;
      if (_legs[_repairLegIdx]) {
        _legs[_repairLegIdx].material.color.setHex(COL_LEGS);
        _legs[_repairLegIdx].material.transparent = false;
        _legs[_repairLegIdx].material.opacity = 1;
      }
      _repairing    = false;
      _repairLegIdx = -1;
      _updateSignalStrength();
      _showMessage('LEG REPAIRED! SIGNAL RESTORED!', 0x44FF44);
    }
  }

  // ── Tower Climb System ─────────────────────────────────────────────────
  function _startClimb() {
    _climbing    = true;
    _climbHeight = 0;
    _atTop       = false;
    if (_camera) _camera.fov = NORMAL_FOV;
  }

  function _updateClimb(dt) {
    if (!_climbing) return;
    // Climbing handled via key input in update loop
    // Just ensure player position is synced
    if (_player) {
      _player.position.x = TOWER_X + 0.5;
      _player.position.z = TOWER_Z + 0.5;
      _player.position.y = _climbHeight;
    }

    if (_climbHeight >= LADDER_HEIGHT) {
      _climbHeight = LADDER_HEIGHT;
      if (!_atTop) {
        _atTop = true;
        _activateSniperMode();
      }
    } else {
      _atTop        = false;
      _sniperActive = false;
      if (_camera) _camera.fov = NORMAL_FOV;
      if (_camera) _camera.updateProjectionMatrix();
    }
  }

  function _activateSniperMode() {
    _sniperActive = true;
    if (_camera) {
      _camera.fov = SNIPER_FOV;
      _camera.updateProjectionMatrix();
    }
    _showMessage('SNIPER POSITION! FOV NARROWED.', 0x44DDFF);
  }

  function _exitClimb() {
    _climbing     = false;
    _atTop        = false;
    _sniperActive = false;
    _climbHeight  = 0;
    if (_camera) {
      _camera.fov = NORMAL_FOV;
      _camera.updateProjectionMatrix();
    }
    if (_player) {
      _player.position.y = 0;
    }
  }

  // ── Message / KillFeed ─────────────────────────────────────────────────
  function _showMessage(msg, color) {
    if (window.KillFeed && window.KillFeed.push) {
      window.KillFeed.push(msg);
      return;
    }
    // Fallback: inline message
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:50px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:#' + (color || 0xFFFFFF).toString(16).padStart(6, '0'),
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 16px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:999'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

  function _showWaveAnnouncement(waveNum) {
    _showMessage('=== WAVE ' + waveNum + ' OF ' + TOTAL_WAVES + ' INCOMING! ===', 0xFF4400);
  }

  // ── Key Input ──────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    _keysDown[key] = true;

    // Track R and T for activation
    if (key === 'R') _rKeyTime = Date.now();
    if (key === 'T') _tKeyTime = Date.now();

    // Activation: R+T within 400ms
    if (!_active && key === 'T' && _rKeyTime && (Date.now() - _rKeyTime) < 400) {
      _activate();
      return;
    }
    if (!_active && key === 'R' && _tKeyTime && (Date.now() - _tKeyTime) < 400) {
      _activate();
      return;
    }

    if (!_active) return;

    // E key actions
    if (key === 'E') {
      _handleEKey();
    }

    // B key — build fortification
    if (key === 'B' && !_fortBuilding && !_climbing) {
      _openFortMenu();
    }

    // Fort menu selections
    if (_fortBuilding) {
      if (key === '1') _buildFortification('SANDBAG');
      if (key === '2') _buildFortification('WIRE');
      if (key === '3') _buildFortification('CLAYMORE');
      if (key === 'ESCAPE') _closeFortMenu();
    }

    // Climb keys
    if (_climbing) {
      if (key === 'W' || key === 'ARROWUP') {
        _climbHeight = Math.min(LADDER_HEIGHT, _climbHeight + CLIMB_SPEED * 0.05);
      }
      if (key === 'S' || key === 'ARROWDOWN') {
        _climbHeight = Math.max(0, _climbHeight - CLIMB_SPEED * 0.05);
        if (_climbHeight === 0) _exitClimb();
      }
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    _keysDown[key] = false;
  }

  function _handleEKey() {
    var px = _player ? _player.position.x : 0;
    var py = _player ? _player.position.y : 0;
    var pz = _player ? _player.position.z : 0;
    var distToBase = _dist2D(px, pz, TOWER_X, TOWER_Z);

    // Exit climb
    if (_climbing) {
      _exitClimb();
      return;
    }

    // Start climb if at base
    if (distToBase < 2) {
      _startClimb();
      return;
    }

    // Start capture if within radius
    if (distToBase < CAPTURE_RADIUS && _controlState !== 'OURS' && !_capturing) {
      _capturing = true;
      _showMessage('CAPTURING TOWER...', 0x44FFAA);
      return;
    }

    // Stop capture if already capturing (toggle)
    if (_capturing) {
      _capturing = false;
      return;
    }

    // Wrench interaction
    for (var w = 0; w < _wrenchProps.length; w++) {
      var wp = _wrenchProps[w];
      if (!wp) continue;
      var wd = _dist3D(px, py, pz, wp.position.x, wp.position.y, wp.position.z);
      if (wd < 2) {
        var legIdx = wp.userData.legIndex;
        if (_legHP[legIdx] === 0) {
          // Remove wrench and start repair
          _scene.remove(wp);
          _wrenchProps[w] = null;
          _startRepair(legIdx);
          return;
        }
      }
    }
  }

  // ── Activation ─────────────────────────────────────────────────────────
  function _activate() {
    if (_active) return;
    _active = true;
    _showMessage('RADIO TOWER SYSTEM ACTIVATED [R+T]', 0x44FFAA);
    if (_hudEl) _hudEl.style.display = 'block';
    // Start first wave timer
    _waveTimer = WAVE_INTERVAL;
  }

  // ── Dish Rotation & Beacon ─────────────────────────────────────────────
  function _updateDish(dt) {
    if (!_dish) return;
    _dishAngle += dt * 0.8;
    _dish.rotation.y = _dishAngle;
    // Beacon pulse
    if (_beacon) {
      var pulse = 0.8 + 0.7 * Math.sin(_dishAngle * 3);
      _beacon.intensity = pulse;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────
  function init(scene, camera, playerRef) {
    if (_initialized) return;
    _initialized = true;
    _scene  = scene;
    _camera = camera;
    _player = playerRef || null;

    _buildTower();
    _buildHUD();

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);

    // Try to get player from global if not passed
    if (!_player && window.Player) _player = window.Player;
  }

  function update(dt) {
    if (!_initialized || !_scene) return;

    // Clamp dt to avoid big jumps
    if (dt > 0.1) dt = 0.1;

    // Try late-bind player
    if (!_player && window.Player) _player = window.Player;

    // Dish rotation always active
    _updateDish(dt);

    if (!_active) return;

    // Wave timer
    if (_currentWave < TOTAL_WAVES && !_waveActive) {
      _waveTimer -= dt;
      if (_waveTimer <= 0) {
        _currentWave++;
        _waveTimer = WAVE_INTERVAL;
        _spawnWave(_currentWave);
      }
    }

    _updateEnemies(dt);
    _updateCapture(dt);
    _updateExplosions(dt);
    _updateRepair(dt);
    _updateClimb(dt);
    _updateAirstrike(dt);
    _updateSignalStrength();
    _updateHUD();

    // Continuous climb via held keys
    if (_climbing) {
      if (_keysDown['W'] || _keysDown['ARROWUP']) {
        _climbHeight = Math.min(LADDER_HEIGHT, _climbHeight + CLIMB_SPEED * dt);
      }
      if (_keysDown['S'] || _keysDown['ARROWDOWN']) {
        _climbHeight = Math.max(0, _climbHeight - CLIMB_SPEED * dt);
        if (_climbHeight === 0) _exitClimb();
      }
    }
  }

  function reset() {
    // Remove tower group
    if (_towerGroup) {
      _scene.remove(_towerGroup);
      _towerGroup = null;
    }

    // Remove enemies
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i] && _enemies[i].mesh) _scene.remove(_enemies[i].mesh);
    }
    _enemies = [];

    // Remove explosions
    for (var j = 0; j < _explosions.length; j++) {
      if (_explosions[j] && _explosions[j].mesh) _scene.remove(_explosions[j].mesh);
    }
    _explosions = [];

    // Remove fortifications
    for (var k = 0; k < _fortStructures.length; k++) {
      if (_fortStructures[k] && _fortStructures[k].mesh) _scene.remove(_fortStructures[k].mesh);
    }
    _fortStructures = [];

    // Remove wrench props
    for (var w = 0; w < _wrenchProps.length; w++) {
      if (_wrenchProps[w]) _scene.remove(_wrenchProps[w]);
    }
    _wrenchProps = [];

    // Remove HUD elements
    if (_hudEl && _hudEl.parentNode) _hudEl.parentNode.removeChild(_hudEl);
    if (_staticOverlay && _staticOverlay.parentNode) _staticOverlay.parentNode.removeChild(_staticOverlay);
    if (_promptEl && _promptEl.parentNode) _promptEl.parentNode.removeChild(_promptEl);
    if (_fortMenu && _fortMenu.parentNode) _fortMenu.parentNode.removeChild(_fortMenu);
    _hudEl = null; _staticOverlay = null; _promptEl = null; _fortMenu = null;

    // Restore camera FOV
    if (_camera && _sniperActive) {
      _camera.fov = NORMAL_FOV;
      _camera.updateProjectionMatrix();
    }

    // Remove event listeners
    document.removeEventListener('keydown', _onKeyDown, false);
    document.removeEventListener('keyup',   _onKeyUp,   false);

    // Reset all state
    _active           = false;
    _initialized      = false;
    _capturing        = false;
    _enemyCapturing   = false;
    _controlState     = 'NEUTRAL';
    _captureProgress  = 0;
    _currentWave      = 0;
    _waveTimer        = WAVE_INTERVAL;
    _waveActive       = false;
    _jamming          = false;
    _enemyControlTime = 0;
    _signalStrength   = 100;
    _signalBroadcast  = false;
    _broadcastTimer   = 0;
    _airstrikeActive  = false;
    _airstrikeCount   = 0;
    _airstrikeTimer   = 0;
    _climbing         = false;
    _climbHeight      = 0;
    _atTop            = false;
    _sniperActive     = false;
    _repairing        = false;
    _repairTimer      = 0;
    _repairLegIdx     = -1;
    _commanderEnemy   = null;
    _commanderReinfTimer = 0;
    _fortBuilding     = false;
    _fortType         = null;
    _legs             = [];
    _legHP            = [1, 1, 1, 1];
    _platforms        = [];
    _keysDown         = {};
    _rKeyTime         = 0;
    _tKeyTime         = 0;
    _dish             = null;
    _dishAngle        = 0;
    _beacon           = null;
    _console          = null;
    _mast             = null;
    _ladderMesh       = null;
    _scene            = null;
    _camera           = null;
    _player           = null;
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
