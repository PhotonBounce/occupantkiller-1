/* ───────────────────────────────────────────────────────────────────────────
   prison-riot.js — Prison Riot: Correctional Officer restores order during a
   violent gang riot; arrest inmates, protect hostages, secure contraband.
   API: window.PrisonRiot = { init, update, reset }
   Activation: P + R simultaneous keypress (both within 400ms)
   Controls:
     P + R      → activate Prison Riot module
     B          → baton strike (stun 3s, radius 2)
     T          → fire taser dart (SphereGeometry, stun 5s, 4 darts max)
     P          → pepper spray (cone 4 units, -50% movement 8s)
     [SHIELD]   → riot shield auto-equipped (BoxGeometry left hand, blocks melee)
     E (hold)   → arrest stunned inmate (3s to cuff)
     R          → radio for backup (4 guards arrive in 30s)
   ─────────────────────────────────────────────────────────────────────────── */
window.PrisonRiot = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;
  var _player = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active        = false;
  var _lastPTime     = -9999;
  var _lastRTime     = -9999;
  var ACTIVATION_WINDOW = 0.4;  // 400ms simultaneous window

  /* ── Prison structures ─────────────────────────────────────────────────── */
  var _prisonGroup     = null;
  var _cellBlock       = null;
  var _cellDoors       = [];
  var _guardTower      = null;
  var _wardenOffice    = null;
  var _cafeteria       = null;
  var _safeRoom        = null;
  var _kitchenPos      = null;

  /* ── Inmates ───────────────────────────────────────────────────────────── */
  var _gangA = [];  // red inmates 0xAA2222, 20 total
  var _gangB = [];  // blue inmates 0x2222AA, 20 total
  var GANG_SIZE = 20;

  /* ── Ringleader ────────────────────────────────────────────────────────── */
  var _ringleader     = null;
  var _ringleaderDead = false;

  /* ── Hostages ──────────────────────────────────────────────────────────── */
  var _hostages    = [];  // 3 civilian workers
  var HOSTAGE_COUNT = 3;

  /* ── Contraband ────────────────────────────────────────────────────────── */
  var _contraband      = [];  // 6 items
  var CONTRABAND_COUNT = 6;

  /* ── Riot control tools ────────────────────────────────────────────────── */
  var _taserDarts      = 4;
  var _taserDartMeshes = [];  // flying darts
  var _shield          = null;
  var _pepperZones     = [];  // active pepper spray zones { mesh, timer, pos }
  var _batonCooldown   = 0;
  var BATON_COOLDOWN   = 0.8;
  var BATON_RADIUS     = 2;
  var BATON_STUN       = 3;
  var TASER_STUN       = 5;
  var PEPPER_DUR       = 8;
  var PEPPER_RANGE     = 4;

  /* ── Arrest mechanic ───────────────────────────────────────────────────── */
  var _eKeyHeld      = false;
  var _arrestTimer   = 0;
  var ARREST_TIME    = 3;
  var _arrestTarget  = null;
  var _cuffedMeshes  = [];  // BoxGeometry 0x666644 for sitting cuffed inmates

  /* ── Score / objectives ────────────────────────────────────────────────── */
  var _score         = 0;
  var _arrested      = 0;
  var ARREST_GOAL    = 15;
  var _gangFights    = 0;
  var _hostagesSafe  = false;
  var _riotLevel     = 'HIGH';

  /* ── Backup / reinforcements ───────────────────────────────────────────── */
  var _backupCalled    = false;
  var _backupTimer     = 0;
  var BACKUP_DELAY     = 30;
  var _backupGuards    = [];
  var _radioCooldown   = 0;
  var RADIO_COOLDOWN   = 120;

  /* ── Escalation ────────────────────────────────────────────────────────── */
  var _escalationTimer = 0;
  var ESCALATION_INTERVAL = 120;  // 2 minutes
  var _escalationCount    = 0;

  /* ── Fire system ───────────────────────────────────────────────────────── */
  var _fireZones       = [];   // { mesh, spread, timer }
  var _fireActive      = false;
  var _extinguishers   = [];   // BoxGeometry found in corridor
  var _playerHasExtinguisher = false;
  var _fireSpreadTimer = 0;
  var FIRE_SPREAD_INTERVAL = 15;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hudEl = null;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keysDown = {};

  /* ── Game over ─────────────────────────────────────────────────────────── */
  var _riotOver = false;
  var _riotWon  = false;

  /* ═══════════════════════════════════════════════════════════════════════
     Utility helpers
     ═══════════════════════════════════════════════════════════════════════ */
  function _dist2D (a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _randRange (lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function _makeMat (color, opts) {
    var cfg = { color: color };
    if (opts) {
      if (opts.transparent) { cfg.transparent = true; cfg.opacity = opts.opacity !== undefined ? opts.opacity : 0.7; }
    }
    return new THREE.MeshLambertMaterial(cfg);
  }

  /* ── Toast notification ─────────────────────────────────────────────────── */
  function _toast (msg, color) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:18%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:' + (color || '#ffdd44'),
      'font-family:"Courier New",monospace',
      'font-size:17px',
      'font-weight:bold',
      'padding:7px 18px',
      'border:2px solid ' + (color || '#ffdd44'),
      'border-radius:4px',
      'pointer-events:none',
      'z-index:10001',
      'letter-spacing:1px'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HUD
     ═══════════════════════════════════════════════════════════════════════ */
  function _ensureHUD () {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'prison-riot-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.70)',
      'color:#ff9900',
      'font-family:"Courier New",monospace',
      'font-size:13px',
      'font-weight:bold',
      'padding:6px 14px',
      'border:1px solid #884400',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'letter-spacing:1px',
      'z-index:9999'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD () {
    if (!_hudEl) return;
    if (!_active) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';

    var hostageStr = _hostagesSafe ? 'SAFE' : (_hostages.length + ' AT RISK');
    var backupStr  = '---';
    if (_backupCalled && _backupTimer > 0) {
      var secs = Math.ceil(_backupTimer);
      var mm = Math.floor(secs / 60);
      var ss = secs % 60;
      backupStr = (mm < 10 ? '0' + mm : '' + mm) + ':' + (ss < 10 ? '0' + ss : '' + ss);
    } else if (_backupGuards.length > 0) {
      backupStr = 'ON SITE';
    }

    var dartsStr  = 'DARTS:' + _taserDarts;
    var radioStr  = _radioCooldown > 0 ? 'CD:' + Math.ceil(_radioCooldown) + 's' : 'READY';

    _hudEl.innerHTML =
      'RIOT' +
      '  [ARRESTED: ' + _arrested + '/' + ARREST_GOAL + ']' +
      '  [HOSTAGES: ' + hostageStr + ']' +
      '  [BACKUP: ' + backupStr + ']' +
      '  [GANG FIGHTS: ' + _gangFights + ']' +
      ' | RIOT LEVEL: ' + _riotLevel +
      ' | ' + dartsStr +
      ' | RADIO: ' + radioStr;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Prison layout builders
     ═══════════════════════════════════════════════════════════════════════ */
  function _buildPrisonLayout () {
    _prisonGroup = new THREE.Group();

    /* Cell block — 40×8×20, dark teal-green */
    var cbGeo = new THREE.BoxGeometry(40, 8, 20);
    var cbMat = _makeMat(0x557755);
    _cellBlock = new THREE.Mesh(cbGeo, cbMat);
    _cellBlock.position.set(0, 4, 0);
    _prisonGroup.add(_cellBlock);

    /* 16 cell doors — 1×3×0.2, dark grey-blue, along corridor (X axis) */
    _cellDoors = [];
    for (var d = 0; d < 16; d++) {
      var doorGeo = new THREE.BoxGeometry(1, 3, 0.2);
      var doorMat = _makeMat(0x333344);
      var door    = new THREE.Mesh(doorGeo, doorMat);
      /* 8 on each side of corridor; offset from -18 to +18 in X */
      var xPos  = -17.5 + d * 2.5;
      var zSide = (d < 8) ? -8 : 8;
      door.position.set(xPos, 1.5, zSide);
      _prisonGroup.add(door);
      _cellDoors.push(door);
    }

    /* Guard tower — CylinderGeometry r=2 h=15, dark green */
    var towerGeo = new THREE.CylinderGeometry(2, 2, 15, 12);
    var towerMat = _makeMat(0x556655);
    _guardTower  = new THREE.Mesh(towerGeo, towerMat);
    _guardTower.position.set(25, 7.5, 25);
    _prisonGroup.add(_guardTower);

    /* Warden's office — 8×4×8 */
    var woGeo = new THREE.BoxGeometry(8, 4, 8);
    var woMat = _makeMat(0x445544);
    _wardenOffice = new THREE.Mesh(woGeo, woMat);
    _wardenOffice.position.set(28, 2, -10);
    _prisonGroup.add(_wardenOffice);

    /* Cafeteria — 15×4×12 */
    var cafGeo = new THREE.BoxGeometry(15, 4, 12);
    var cafMat = _makeMat(0x446655);
    _cafeteria  = new THREE.Mesh(cafGeo, cafMat);
    _cafeteria.position.set(-20, 2, 20);
    _prisonGroup.add(_cafeteria);

    /* Safe room (small, near warden's office) */
    var srGeo  = new THREE.BoxGeometry(5, 3, 5);
    var srMat  = _makeMat(0x335533);
    _safeRoom  = new THREE.Mesh(srGeo, srMat);
    _safeRoom.position.set(20, 1.5, -20);
    _prisonGroup.add(_safeRoom);

    /* Kitchen position (inside cafeteria, slightly offset) */
    _kitchenPos = new THREE.Vector3(-20, 0, 20);

    /* Bed platforms inside cells (BoxGeometry) */
    for (var b = 0; b < 16; b++) {
      var bedGeo = new THREE.BoxGeometry(1.8, 0.3, 0.9);
      var bedMat = _makeMat(0x554433);
      var bed    = new THREE.Mesh(bedGeo, bedMat);
      var bxPos  = -17.5 + b * 2.5;
      var bzSide = (b < 8) ? -8.5 : 8.5;
      bed.position.set(bxPos, 0.65, bzSide);
      _prisonGroup.add(bed);
    }

    /* Floor */
    var floorGeo = new THREE.BoxGeometry(80, 0.2, 70);
    var floorMat = _makeMat(0x445544);
    var floor    = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.1, 0);
    _prisonGroup.add(floor);

    _scene.add(_prisonGroup);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Spawn inmates
     ═══════════════════════════════════════════════════════════════════════ */
  function _spawnInmate (color, index, total, gang) {
    var geo  = new THREE.CylinderGeometry(0.35, 0.35, 1.75, 8);
    var mat  = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);

    /* distribute across cell block area */
    var side  = (gang === 'A') ? -1 : 1;
    var xPos  = _randRange(-18, 18);
    var zPos  = side * _randRange(2, 9);
    mesh.position.set(xPos, 0.875, zPos);
    _scene.add(mesh);

    return {
      mesh:     mesh,
      gang:     gang,
      color:    color,
      hp:       100,
      stunTimer:0,
      pepTimer: 0,
      speed:    _randRange(1.5, 3.0),
      state:    'roam',    // roam | fight | stunned | cuffed | fled | dead
      target:   null,
      fightTimer: 0,
      vx: 0,
      vz: 0
    };
  }

  function _spawnAllInmates () {
    _gangA = [];
    _gangB = [];
    for (var i = 0; i < GANG_SIZE; i++) {
      _gangA.push(_spawnInmate(0xAA2222, i, GANG_SIZE, 'A'));
    }
    for (var j = 0; j < GANG_SIZE; j++) {
      _gangB.push(_spawnInmate(0x2222AA, j, GANG_SIZE, 'B'));
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Spawn ringleader
     ═══════════════════════════════════════════════════════════════════════ */
  function _spawnRingleader () {
    /* CylinderGeometry scale 1.3x, dark red */
    var geo  = new THREE.CylinderGeometry(0.35 * 1.3, 0.35 * 1.3, 1.75 * 1.3, 8);
    var mat  = _makeMat(0x880000);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(5, 0.875 * 1.3, 5);
    _scene.add(mesh);
    _ringleader = {
      mesh:      mesh,
      hp:        300,
      stunTimer: 0,
      pepTimer:  0,
      speed:     2.5,
      state:     'roam',
      secured:   false
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Spawn hostages
     ═══════════════════════════════════════════════════════════════════════ */
  function _spawnHostages () {
    _hostages = [];
    var positions = [
      { x: -20, z: 19 },
      { x: -22, z: 20 },
      { x: -18, z: 21 }
    ];
    for (var i = 0; i < HOSTAGE_COUNT; i++) {
      var geo  = new THREE.BoxGeometry(0.7, 1.75, 0.5);
      var mat  = _makeMat(0xDDAA88);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(positions[i].x, 0.875, positions[i].z);
      _scene.add(mesh);
      _hostages.push({
        mesh:    mesh,
        safe:    false,
        escorted:false,
        state:   'trapped'
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Spawn contraband
     ═══════════════════════════════════════════════════════════════════════ */
  function _spawnContraband () {
    _contraband = [];
    /* 4 visible, 2 hidden under beds */
    var spots = [
      { x:  -15, z: -8.5, hidden: true  },
      { x:   -5, z:  8.5, hidden: true  },
      { x:    8, z: -7,   hidden: false },
      { x:   -3, z:  6,   hidden: false },
      { x:   14, z:  8,   hidden: false },
      { x:  -12, z: -6,   hidden: false }
    ];
    for (var i = 0; i < CONTRABAND_COUNT; i++) {
      var geo  = new THREE.BoxGeometry(0.4, 0.3, 0.4);
      var mat  = _makeMat(0xAA5500);
      var mesh = new THREE.Mesh(geo, mat);
      var yPos = spots[i].hidden ? 0.55 : 0.15;
      mesh.position.set(spots[i].x, yPos, spots[i].z);
      _scene.add(mesh);
      _contraband.push({
        mesh:    mesh,
        hidden:  spots[i].hidden,
        collected: false
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Spawn extinguishers
     ═══════════════════════════════════════════════════════════════════════ */
  function _spawnExtinguishers () {
    _extinguishers = [];
    var spots = [
      { x: 10, z: 0 },
      { x: -10, z: 0 }
    ];
    for (var i = 0; i < spots.length; i++) {
      var geo  = new THREE.BoxGeometry(0.4, 0.9, 0.4);
      var mat  = _makeMat(0xCC3300);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(spots[i].x, 0.45, spots[i].z);
      _scene.add(mesh);
      _extinguishers.push({ mesh: mesh, taken: false });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Riot shield (BoxGeometry, left hand)
     ═══════════════════════════════════════════════════════════════════════ */
  function _spawnShield () {
    var geo = new THREE.BoxGeometry(0.1, 1.4, 0.8);
    var mat = _makeMat(0x334455);
    _shield = new THREE.Mesh(geo, mat);
    /* positioned relative to player, left side */
    _shield.position.set(-1, 1, 0);
    if (_player && _player.mesh) {
      _player.mesh.add(_shield);
    } else {
      _scene.add(_shield);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Get all inmates (including ringleader) as flat list
     ═══════════════════════════════════════════════════════════════════════ */
  function _allInmates () {
    var list = _gangA.concat(_gangB);
    if (_ringleader && !_ringleader.secured) list.push(_ringleader);
    return list;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Stun an inmate
     ═══════════════════════════════════════════════════════════════════════ */
  function _stunInmate (inmate, duration) {
    if (!inmate || inmate.state === 'cuffed' || inmate.state === 'dead') return;
    inmate.state     = 'stunned';
    inmate.stunTimer = duration;
    /* Visually tilt them */
    if (inmate.mesh) inmate.mesh.rotation.z = Math.PI / 2;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Baton strike
     ═══════════════════════════════════════════════════════════════════════ */
  function _batonStrike () {
    if (_batonCooldown > 0) return;
    if (!_player) return;
    _batonCooldown = BATON_COOLDOWN;
    _toast('BATON!', '#ffcc00');

    var pPos   = _player.position || (_player.mesh && _player.mesh.position);
    if (!pPos) return;
    var inmates = _allInmates();
    for (var i = 0; i < inmates.length; i++) {
      var inm = inmates[i];
      if (!inm.mesh || inm.state === 'cuffed' || inm.state === 'dead') continue;
      if (_dist2D(pPos, inm.mesh.position) <= BATON_RADIUS) {
        _stunInmate(inm, BATON_STUN);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Taser fire
     ═══════════════════════════════════════════════════════════════════════ */
  function _taserFire () {
    if (_taserDarts <= 0) { _toast('NO DARTS', '#ff4444'); return; }
    if (!_player) return;
    _taserDarts--;

    var pPos = _player.position || (_player.mesh && _player.mesh.position);
    if (!pPos) return;

    /* Find nearest non-stunned inmate */
    var inmates  = _allInmates();
    var nearest  = null;
    var nearDist = Infinity;
    for (var i = 0; i < inmates.length; i++) {
      var inm = inmates[i];
      if (!inm.mesh || inm.state === 'cuffed' || inm.state === 'dead' || inm.state === 'stunned') continue;
      var d = _dist2D(pPos, inm.mesh.position);
      if (d < nearDist) { nearDist = d; nearest = inm; }
    }

    /* Spawn dart */
    var dGeo = new THREE.SphereGeometry(0.12, 5, 5);
    var dMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
    var dart = new THREE.Mesh(dGeo, dMat);
    dart.position.copy(pPos);
    dart.position.y = 1;
    _scene.add(dart);

    _taserDartMeshes.push({
      mesh:    dart,
      target:  nearest,
      speed:   20,
      life:    0,
      maxLife: 1.5,
      hit:     false
    });

    _toast('TASER! (' + _taserDarts + ' LEFT)', '#ffff44');
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Pepper spray
     ═══════════════════════════════════════════════════════════════════════ */
  function _pepperSpray () {
    if (!_player) return;
    var pPos = _player.position || (_player.mesh && _player.mesh.position);
    if (!pPos) return;
    _toast('PEPPER SPRAY!', '#aaff44');

    /* Spawn visual cone zone */
    var zoneGeo = new THREE.CylinderGeometry(PEPPER_RANGE, 0.2, 0.3, 8, 1, true);
    var zoneMat = new THREE.MeshLambertMaterial({ color: 0xAAFF00, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    var zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
    zoneMesh.position.set(pPos.x, 1, pPos.z);
    _scene.add(zoneMesh);

    _pepperZones.push({
      mesh:  zoneMesh,
      timer: PEPPER_DUR,
      pos:   pPos.clone()
    });

    /* Apply effect to all inmates in range */
    var inmates = _allInmates();
    for (var i = 0; i < inmates.length; i++) {
      var inm = inmates[i];
      if (!inm.mesh || inm.state === 'cuffed' || inm.state === 'dead') continue;
      if (_dist2D(pPos, inm.mesh.position) <= PEPPER_RANGE) {
        inm.pepTimer = PEPPER_DUR;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Arrest attempt
     ═══════════════════════════════════════════════════════════════════════ */
  function _findNearestStunned () {
    if (!_player) return null;
    var pPos   = _player.position || (_player.mesh && _player.mesh.position);
    if (!pPos) return null;
    var inmates = _allInmates();
    var nearest = null;
    var nearDist = 2.5;
    for (var i = 0; i < inmates.length; i++) {
      var inm = inmates[i];
      if (!inm.mesh || inm.state !== 'stunned') continue;
      var d = _dist2D(pPos, inm.mesh.position);
      if (d < nearDist) { nearDist = d; nearest = inm; }
    }
    return nearest;
  }

  function _completeArrest (inmate) {
    if (!inmate || inmate.state === 'cuffed') return;
    inmate.state = 'cuffed';
    if (inmate.mesh) {
      inmate.mesh.rotation.z = 0;
      inmate.mesh.rotation.x = Math.PI / 2;
      inmate.mesh.position.y = 0.15;
    }

    /* Spawn cuffed marker BoxGeometry 0x666644 */
    var cGeo  = new THREE.BoxGeometry(0.7, 0.2, 1.5);
    var cMat  = _makeMat(0x666644);
    var cMesh = new THREE.Mesh(cGeo, cMat);
    if (inmate.mesh) cMesh.position.copy(inmate.mesh.position);
    _scene.add(cMesh);
    _cuffedMeshes.push(cMesh);

    _arrested++;
    _score += 50;

    var isRingleader = (inmate === _ringleader);
    if (isRingleader) {
      inmate.secured = true;
      _toast('RINGLEADER SECURED! +100', '#ff4400');
      _score += 100;
      _checkWinCondition();
    } else {
      _toast('ARRESTED! +50 (TOTAL: ' + _arrested + '/' + ARREST_GOAL + ')', '#00ff88');
      _checkWinCondition();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Radio for backup
     ═══════════════════════════════════════════════════════════════════════ */
  function _callBackup () {
    if (_radioCooldown > 0) { _toast('RADIO COOLDOWN', '#ff4444'); return; }
    if (_backupCalled)      { _toast('BACKUP ALREADY EN ROUTE', '#ffcc00'); return; }
    _backupCalled  = true;
    _backupTimer   = BACKUP_DELAY;
    _radioCooldown = RADIO_COOLDOWN;
    _toast('BACKUP CALLED! ETA 30s', '#44ffff');
  }

  function _spawnBackupGuards () {
    _backupCalled = false;
    for (var i = 0; i < 4; i++) {
      var geo  = new THREE.BoxGeometry(0.6, 1.7, 0.5);
      var mat  = _makeMat(0x334433);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(-30 + i * 3, 0.85, -30);
      _scene.add(mesh);
      _backupGuards.push({
        mesh:   mesh,
        state:  'patrol',
        target: null,
        speed:  2.5
      });
    }
    _toast('BACKUP ARRIVED!', '#44ffff');
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Fire system
     ═══════════════════════════════════════════════════════════════════════ */
  function _startFire (pos) {
    if (!pos) pos = _kitchenPos;
    _fireActive = true;
    var fGeo  = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    var fMat  = _makeMat(0xFF4400);
    var fMesh = new THREE.Mesh(fGeo, fMat);
    fMesh.position.set(pos.x, 0.25, pos.z);
    _scene.add(fMesh);
    _fireZones.push({ mesh: fMesh, spread: 0, timer: 0 });
    _toast('FIRE IN KITCHEN!', '#ff4400');
  }

  function _extinguishFire () {
    if (!_playerHasExtinguisher) { _toast('NO EXTINGUISHER', '#ff4444'); return; }
    if (_fireZones.length === 0) { _toast('NO FIRE TO EXTINGUISH', '#ffcc00'); return; }

    var pPos = _player ? (_player.position || (_player.mesh && _player.mesh.position)) : null;
    if (!pPos) return;

    for (var i = _fireZones.length - 1; i >= 0; i--) {
      var fz = _fireZones[i];
      if (_dist2D(pPos, fz.mesh.position) <= 5) {
        _scene.remove(fz.mesh);
        _fireZones.splice(i, 1);
      }
    }
    if (_fireZones.length === 0) {
      _fireActive = false;
      _toast('FIRE EXTINGUISHED!', '#44ff88');
      _playerHasExtinguisher = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Win condition check
     ═══════════════════════════════════════════════════════════════════════ */
  function _checkWinCondition () {
    if (_riotOver) return;
    var ringleaderDone = _ringleader && _ringleader.secured;
    if (_arrested >= ARREST_GOAL || ringleaderDone) {
      _riotOver = true;
      _riotWon  = true;
      _toast('RIOT SUPPRESSED! ORDER RESTORED. SCORE: ' + _score, '#44ff88');
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Escalation — every 2 minutes, 5 more inmates from Cell Block C
     ═══════════════════════════════════════════════════════════════════════ */
  function _triggerEscalation () {
    _escalationCount++;
    _toast('CELL BLOCK C BREACH! MORE INMATES!', '#ff2200');
    for (var i = 0; i < 5; i++) {
      var isA   = (i % 2 === 0);
      var color = isA ? 0xAA2222 : 0x2222AA;
      var gang  = isA ? 'A' : 'B';
      var inm   = _spawnInmate(color, 0, 1, gang);
      inm.mesh.position.set(_randRange(-15, 15), 0.875, _randRange(-5, 5));
      if (isA) _gangA.push(inm);
      else     _gangB.push(inm);
    }
    /* Update riot level */
    if (_escalationCount >= 2) _riotLevel = 'CRITICAL';
  }

  /* ═══════════════════════════════════════════════════════════════════════
     AI: gang fighting logic
     ═══════════════════════════════════════════════════════════════════════ */
  function _updateInmateAI (inmate, enemies, delta) {
    if (!inmate.mesh) return;
    if (inmate.state === 'cuffed' || inmate.state === 'dead') return;

    /* Pepper timer */
    if (inmate.pepTimer > 0) {
      inmate.pepTimer -= delta;
      if (inmate.pepTimer < 0) inmate.pepTimer = 0;
    }

    /* Stun timer */
    if (inmate.state === 'stunned') {
      inmate.stunTimer -= delta;
      if (inmate.stunTimer <= 0) {
        inmate.state = 'roam';
        if (inmate.mesh) inmate.mesh.rotation.z = 0;
      }
      return;
    }

    var spd = inmate.speed * (inmate.pepTimer > 0 ? 0.5 : 1.0);

    /* Find nearest enemy to fight */
    var nearest    = null;
    var nearDist   = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.mesh || e.state === 'cuffed' || e.state === 'dead' || e.state === 'stunned') continue;
      var d = _dist2D(inmate.mesh.position, e.mesh.position);
      if (d < nearDist) { nearDist = d; nearest = e; }
    }

    if (nearest && nearDist < 30) {
      /* Move toward enemy */
      inmate.state = 'fight';
      var dx = nearest.mesh.position.x - inmate.mesh.position.x;
      var dz = nearest.mesh.position.z - inmate.mesh.position.z;
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      inmate.mesh.position.x += (dx / len) * spd * delta;
      inmate.mesh.position.z += (dz / len) * spd * delta;

      /* Close range: damage enemy */
      if (nearDist < 1.2) {
        inmate.fightTimer = (inmate.fightTimer || 0) + delta;
        if (inmate.fightTimer > 1.0) {
          inmate.fightTimer = 0;
          nearest.hp -= 10;
          _gangFights++;
          /* Check if enemy dies */
          if (nearest.hp <= 0) {
            nearest.state = 'dead';
            if (nearest.mesh) nearest.mesh.visible = false;
          }
        }
      }
    } else {
      /* Roam */
      inmate.state = 'roam';
      if (!inmate.roamTimer || inmate.roamTimer <= 0) {
        inmate.roamDir   = { x: _randRange(-1, 1), z: _randRange(-1, 1) };
        inmate.roamTimer = _randRange(1.5, 4);
      }
      if (inmate.roamDir) {
        inmate.mesh.position.x += inmate.roamDir.x * spd * delta;
        inmate.mesh.position.z += inmate.roamDir.z * spd * delta;
      }
      inmate.roamTimer = (inmate.roamTimer || 0) - delta;
      /* Clamp to cell block area */
      inmate.mesh.position.x = Math.max(-19, Math.min(19, inmate.mesh.position.x));
      inmate.mesh.position.z = Math.max(-9,  Math.min(9,  inmate.mesh.position.z));
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     AI: ringleader logic (stays near center, moves toward gang fights)
     ═══════════════════════════════════════════════════════════════════════ */
  function _updateRingleaderAI (delta) {
    if (!_ringleader || !_ringleader.mesh) return;
    if (_ringleader.secured || _ringleader.state === 'cuffed' || _ringleader.state === 'dead') return;

    if (_ringleader.state === 'stunned') {
      _ringleader.stunTimer -= delta;
      if (_ringleader.stunTimer <= 0) {
        _ringleader.state = 'roam';
        _ringleader.mesh.rotation.z = 0;
      }
      return;
    }

    /* Ringleader moves around central area */
    if (!_ringleader.roamTimer || _ringleader.roamTimer <= 0) {
      _ringleader.roamDir   = { x: _randRange(-1, 1), z: _randRange(-1, 1) };
      _ringleader.roamTimer = _randRange(2, 5);
    }
    var spd = _ringleader.speed * (_ringleader.pepTimer > 0 ? 0.5 : 1.0);
    if (_ringleader.roamDir) {
      _ringleader.mesh.position.x += _ringleader.roamDir.x * spd * delta;
      _ringleader.mesh.position.z += _ringleader.roamDir.z * spd * delta;
    }
    _ringleader.roamTimer = (_ringleader.roamTimer || 0) - delta;
    _ringleader.mesh.position.x = Math.max(-15, Math.min(15, _ringleader.mesh.position.x));
    _ringleader.mesh.position.z = Math.max(-8,  Math.min(8,  _ringleader.mesh.position.z));

    if (_ringleader.pepTimer > 0) _ringleader.pepTimer -= delta;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     AI: backup guards auto-arrest stunned inmates
     ═══════════════════════════════════════════════════════════════════════ */
  function _updateBackupGuards (delta) {
    for (var g = 0; g < _backupGuards.length; g++) {
      var guard = _backupGuards[g];
      if (!guard.mesh) continue;

      /* Find nearest stunned inmate */
      var inmates  = _allInmates();
      var nearest  = null;
      var nearDist = Infinity;
      for (var i = 0; i < inmates.length; i++) {
        var inm = inmates[i];
        if (!inm.mesh || inm.state !== 'stunned') continue;
        var d = _dist2D(guard.mesh.position, inm.mesh.position);
        if (d < nearDist) { nearDist = d; nearest = inm; }
      }

      if (nearest) {
        guard.target = nearest;
        var dx  = nearest.mesh.position.x - guard.mesh.position.x;
        var dz  = nearest.mesh.position.z - guard.mesh.position.z;
        var len = Math.sqrt(dx * dx + dz * dz) || 1;
        guard.mesh.position.x += (dx / len) * guard.speed * delta;
        guard.mesh.position.z += (dz / len) * guard.speed * delta;

        if (nearDist < 1.5) {
          guard.arrestTimer = (guard.arrestTimer || 0) + delta;
          if (guard.arrestTimer >= ARREST_TIME) {
            guard.arrestTimer = 0;
            _completeArrest(nearest);
          }
        } else {
          guard.arrestTimer = 0;
        }
      } else {
        /* Patrol */
        guard.target = null;
        if (!guard.roamTimer || guard.roamTimer <= 0) {
          guard.roamDir   = { x: _randRange(-1, 1), z: _randRange(-1, 1) };
          guard.roamTimer = _randRange(2, 4);
        }
        if (guard.roamDir) {
          guard.mesh.position.x += guard.roamDir.x * guard.speed * delta;
          guard.mesh.position.z += guard.roamDir.z * guard.speed * delta;
        }
        guard.roamTimer = (guard.roamTimer || 0) - delta;
        guard.mesh.position.x = Math.max(-35, Math.min(35, guard.mesh.position.x));
        guard.mesh.position.z = Math.max(-35, Math.min(35, guard.mesh.position.z));
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Update taser darts
     ═══════════════════════════════════════════════════════════════════════ */
  function _updateTaserDarts (delta) {
    for (var i = _taserDartMeshes.length - 1; i >= 0; i--) {
      var d = _taserDartMeshes[i];
      d.life += delta;

      if (d.hit || d.life >= d.maxLife) {
        _scene.remove(d.mesh);
        _taserDartMeshes.splice(i, 1);
        continue;
      }

      if (d.target && d.target.mesh) {
        /* Move toward target */
        var dx  = d.target.mesh.position.x - d.mesh.position.x;
        var dy  = d.target.mesh.position.y - d.mesh.position.y;
        var dz  = d.target.mesh.position.z - d.mesh.position.z;
        var len = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
        d.mesh.position.x += (dx / len) * d.speed * delta;
        d.mesh.position.y += (dy / len) * d.speed * delta;
        d.mesh.position.z += (dz / len) * d.speed * delta;

        if (len < 1.0) {
          d.hit = true;
          _stunInmate(d.target, TASER_STUN);
        }
      } else {
        /* No target: fly forward then disappear */
        d.mesh.position.z += d.speed * delta;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Update pepper zones (fade out)
     ═══════════════════════════════════════════════════════════════════════ */
  function _updatePepperZones (delta) {
    for (var i = _pepperZones.length - 1; i >= 0; i--) {
      var pz = _pepperZones[i];
      pz.timer -= delta;
      if (pz.mesh && pz.mesh.material) {
        pz.mesh.material.opacity = 0.35 * Math.max(0, pz.timer / PEPPER_DUR);
      }
      if (pz.timer <= 0) {
        _scene.remove(pz.mesh);
        _pepperZones.splice(i, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Update fire spread
     ═══════════════════════════════════════════════════════════════════════ */
  function _updateFire (delta) {
    if (!_fireActive) return;
    _fireSpreadTimer += delta;
    if (_fireSpreadTimer >= FIRE_SPREAD_INTERVAL && _fireZones.length < 6) {
      _fireSpreadTimer = 0;
      /* Spawn adjacent fire zone */
      var base = _fireZones[0];
      if (base) {
        var newGeo  = new THREE.BoxGeometry(1.5, 0.5, 1.5);
        var newMat  = _makeMat(0xFF4400);
        var newMesh = new THREE.Mesh(newGeo, newMat);
        newMesh.position.set(
          base.mesh.position.x + _randRange(-3, 3),
          0.25,
          base.mesh.position.z + _randRange(-3, 3)
        );
        _scene.add(newMesh);
        _fireZones.push({ mesh: newMesh, spread: 0, timer: 0 });
        _toast('FIRE SPREADING!', '#ff4400');
      }
    }

    /* Animate fire (gentle bob) */
    for (var i = 0; i < _fireZones.length; i++) {
      _fireZones[i].timer += delta;
      _fireZones[i].mesh.position.y = 0.25 + Math.sin(_fireZones[i].timer * 3) * 0.05;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Check fire trigger (if riot reaches kitchen area)
     ═══════════════════════════════════════════════════════════════════════ */
  function _checkFireTrigger () {
    if (_fireActive) return;
    var inmates = _allInmates();
    for (var i = 0; i < inmates.length; i++) {
      var inm = inmates[i];
      if (!inm.mesh || inm.state === 'cuffed' || inm.state === 'dead') continue;
      if (_dist2D(inm.mesh.position, _kitchenPos) < 5) {
        _startFire(_kitchenPos);
        return;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Check hostage safety (if hostages reach safe room)
     ═══════════════════════════════════════════════════════════════════════ */
  function _updateHostages (delta) {
    var allSafe = true;
    for (var i = 0; i < _hostages.length; i++) {
      var h = _hostages[i];
      if (h.safe) continue;

      /* If player is near hostage, escort them */
      var pPos = _player ? (_player.position || (_player.mesh && _player.mesh.position)) : null;
      if (pPos && _dist2D(pPos, h.mesh.position) < 2.5) {
        h.escorted = true;
        /* Follow player */
        var dx  = pPos.x - h.mesh.position.x;
        var dz  = pPos.z - h.mesh.position.z;
        var len = Math.sqrt(dx * dx + dz * dz) || 1;
        h.mesh.position.x += (dx / len) * 1.5 * delta;
        h.mesh.position.z += (dz / len) * 1.5 * delta;
      }

      /* Check if reached safe room */
      if (_safeRoom && _dist2D(h.mesh.position, _safeRoom.position) < 4) {
        h.safe = true;
        _score += 200;
        _toast('HOSTAGE SAFE! +200', '#44ff88');
      } else {
        allSafe = false;
      }
    }
    if (allSafe && _hostages.length > 0 && !_hostagesSafe) {
      _hostagesSafe = true;
      _toast('ALL HOSTAGES SAFE!', '#44ff88');
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Check contraband pickup
     ═══════════════════════════════════════════════════════════════════════ */
  function _checkContraband () {
    var pPos = _player ? (_player.position || (_player.mesh && _player.mesh.position)) : null;
    if (!pPos) return;
    for (var i = 0; i < _contraband.length; i++) {
      var c = _contraband[i];
      if (c.collected) continue;
      if (_dist2D(pPos, c.mesh.position) < 1.2) {
        c.collected = true;
        _scene.remove(c.mesh);
        _score += 30;
        _toast('CONTRABAND BAGGED! +30', '#ffaa44');
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Check extinguisher pickup
     ═══════════════════════════════════════════════════════════════════════ */
  function _checkExtinguisherPickup () {
    if (_playerHasExtinguisher) return;
    var pPos = _player ? (_player.position || (_player.mesh && _player.mesh.position)) : null;
    if (!pPos) return;
    for (var i = 0; i < _extinguishers.length; i++) {
      var e = _extinguishers[i];
      if (e.taken) continue;
      if (_dist2D(pPos, e.mesh.position) < 1.5) {
        e.taken = true;
        _scene.remove(e.mesh);
        _playerHasExtinguisher = true;
        _toast('EXTINGUISHER PICKED UP', '#ff8844');
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Shield position update (follow player)
     ═══════════════════════════════════════════════════════════════════════ */
  function _updateShield () {
    if (!_shield || !_player) return;
    var pPos = _player.position || (_player.mesh && _player.mesh.position);
    if (!pPos) return;
    /* Shield stays relative to player if not parented */
    if (!(_player.mesh && _player.mesh.children.indexOf(_shield) >= 0)) {
      _shield.position.set(pPos.x - 1, pPos.y + 1, pPos.z);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Update arrest progress (hold E)
     ═══════════════════════════════════════════════════════════════════════ */
  function _updateArrest (delta) {
    if (!_eKeyHeld) {
      _arrestTimer  = 0;
      _arrestTarget = null;
      return;
    }

    /* Find nearest stunned on first frame of hold */
    if (!_arrestTarget) {
      _arrestTarget = _findNearestStunned();
      if (!_arrestTarget) return;
    }

    /* Verify still stunned */
    if (_arrestTarget.state !== 'stunned') {
      _arrestTimer  = 0;
      _arrestTarget = null;
      return;
    }

    _arrestTimer += delta;
    if (_arrestTimer >= ARREST_TIME) {
      _arrestTimer = 0;
      _completeArrest(_arrestTarget);
      _arrestTarget = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Input handlers
     ═══════════════════════════════════════════════════════════════════════ */
  function _onKeyDown (e) {
    _keysDown[e.code] = true;

    var now = performance.now() / 1000;

    /* Activation: P + R simultaneous (within 400ms) */
    if (e.code === 'KeyP') {
      _lastPTime = now;
      /* If R was pressed within window, activate */
      if (!_active && (now - _lastRTime) <= ACTIVATION_WINDOW) {
        _activate();
        return;
      }
    }
    if (e.code === 'KeyR') {
      _lastRTime = now;
      if (!_active && (now - _lastPTime) <= ACTIVATION_WINDOW) {
        _activate();
        return;
      }
    }

    if (!_active) return;

    if (e.code === 'KeyB') { _batonStrike(); }
    if (e.code === 'KeyT') { _taserFire(); }
    if (e.code === 'KeyP') { _pepperSpray(); }
    if (e.code === 'KeyR') { _callBackup(); }
    if (e.code === 'KeyF') { _extinguishFire(); }
    if (e.code === 'KeyE') { _eKeyHeld = true; }
  }

  function _onKeyUp (e) {
    _keysDown[e.code] = false;
    if (e.code === 'KeyE') { _eKeyHeld = false; _arrestTimer = 0; _arrestTarget = null; }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Activation
     ═══════════════════════════════════════════════════════════════════════ */
  function _activate () {
    if (_active) return;
    _active = true;
    _toast('PRISON RIOT! RESTORE ORDER! [B=BATON T=TASER P=PEPPER E=ARREST R=BACKUP]', '#ff9900');
    _buildPrisonLayout();
    _spawnAllInmates();
    _spawnRingleader();
    _spawnHostages();
    _spawnContraband();
    _spawnExtinguishers();
    _spawnShield();
    _ensureHUD();
    _updateHUD();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Main update
     ═══════════════════════════════════════════════════════════════════════ */
  function update (delta) {
    if (!_active || !_scene) return;
    if (_riotOver) { _updateHUD(); return; }

    /* Timers */
    if (_batonCooldown > 0)  _batonCooldown  -= delta;
    if (_radioCooldown > 0)  _radioCooldown  -= delta;

    /* Escalation timer */
    _escalationTimer += delta;
    if (_escalationTimer >= ESCALATION_INTERVAL) {
      _escalationTimer = 0;
      _triggerEscalation();
    }

    /* Backup timer */
    if (_backupCalled && _backupTimer > 0) {
      _backupTimer -= delta;
      if (_backupTimer <= 0) {
        _backupTimer = 0;
        _spawnBackupGuards();
      }
    }

    /* Gang AI */
    for (var a = 0; a < _gangA.length; a++) {
      _updateInmateAI(_gangA[a], _gangB, delta);
    }
    for (var b = 0; b < _gangB.length; b++) {
      _updateInmateAI(_gangB[b], _gangA, delta);
    }

    /* Ringleader AI */
    _updateRingleaderAI(delta);

    /* Backup guards */
    _updateBackupGuards(delta);

    /* Taser darts */
    _updateTaserDarts(delta);

    /* Pepper zones */
    _updatePepperZones(delta);

    /* Shield */
    _updateShield();

    /* Arrest */
    _updateArrest(delta);

    /* Fire system */
    _checkFireTrigger();
    _updateFire(delta);

    /* Hostages */
    _updateHostages(delta);

    /* Contraband */
    _checkContraband();

    /* Extinguisher */
    _checkExtinguisherPickup();

    /* Win condition */
    _checkWinCondition();

    /* Update HUD */
    _updateHUD();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Cleanup helpers
     ═══════════════════════════════════════════════════════════════════════ */
  function _removeInmates () {
    var all = _gangA.concat(_gangB);
    for (var i = 0; i < all.length; i++) {
      if (all[i].mesh && _scene) _scene.remove(all[i].mesh);
    }
    _gangA = [];
    _gangB = [];
    if (_ringleader && _ringleader.mesh && _scene) { _scene.remove(_ringleader.mesh); _ringleader = null; }
  }

  function _removeHostages () {
    for (var i = 0; i < _hostages.length; i++) {
      if (_hostages[i].mesh && _scene) _scene.remove(_hostages[i].mesh);
    }
    _hostages = [];
  }

  function _removeContraband () {
    for (var i = 0; i < _contraband.length; i++) {
      if (_contraband[i].mesh && _scene) _scene.remove(_contraband[i].mesh);
    }
    _contraband = [];
  }

  function _removeGuards () {
    for (var i = 0; i < _backupGuards.length; i++) {
      if (_backupGuards[i].mesh && _scene) _scene.remove(_backupGuards[i].mesh);
    }
    _backupGuards = [];
  }

  function _removeFire () {
    for (var i = 0; i < _fireZones.length; i++) {
      if (_fireZones[i].mesh && _scene) _scene.remove(_fireZones[i].mesh);
    }
    _fireZones = [];
    for (var j = 0; j < _extinguishers.length; j++) {
      if (_extinguishers[j].mesh && _scene) _scene.remove(_extinguishers[j].mesh);
    }
    _extinguishers = [];
  }

  function _removePepper () {
    for (var i = 0; i < _pepperZones.length; i++) {
      if (_pepperZones[i].mesh && _scene) _scene.remove(_pepperZones[i].mesh);
    }
    _pepperZones = [];
  }

  function _removeTaserDarts () {
    for (var i = 0; i < _taserDartMeshes.length; i++) {
      if (_taserDartMeshes[i].mesh && _scene) _scene.remove(_taserDartMeshes[i].mesh);
    }
    _taserDartMeshes = [];
  }

  function _removeCuffed () {
    for (var i = 0; i < _cuffedMeshes.length; i++) {
      if (_cuffedMeshes[i] && _scene) _scene.remove(_cuffedMeshes[i]);
    }
    _cuffedMeshes = [];
  }

  function _removePrison () {
    if (_prisonGroup && _scene) _scene.remove(_prisonGroup);
    _prisonGroup  = null;
    _cellBlock    = null;
    _cellDoors    = [];
    _guardTower   = null;
    _wardenOffice = null;
    _cafeteria    = null;
    _safeRoom     = null;
  }

  function _removeShield () {
    if (_shield) {
      if (_player && _player.mesh) _player.mesh.remove(_shield);
      else if (_scene) _scene.remove(_shield);
      _shield = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Public: init
     ═══════════════════════════════════════════════════════════════════════ */
  function init (scene, camera, canvas, player) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || (typeof document !== 'undefined' ? document.querySelector('canvas') : null);
    _player = player || null;

    _ensureHUD();

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', _onKeyDown);
      document.addEventListener('keyup',   _onKeyUp);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Public: reset
     ═══════════════════════════════════════════════════════════════════════ */
  function reset () {
    _removeInmates();
    _removeHostages();
    _removeContraband();
    _removeGuards();
    _removeFire();
    _removePepper();
    _removeTaserDarts();
    _removeCuffed();
    _removePrison();
    _removeShield();

    _active          = false;
    _riotOver        = false;
    _riotWon         = false;
    _score           = 0;
    _arrested        = 0;
    _gangFights      = 0;
    _hostagesSafe    = false;
    _riotLevel       = 'HIGH';
    _taserDarts      = 4;
    _batonCooldown   = 0;
    _radioCooldown   = 0;
    _backupCalled    = false;
    _backupTimer     = 0;
    _escalationTimer = 0;
    _escalationCount = 0;
    _fireActive      = false;
    _fireSpreadTimer = 0;
    _playerHasExtinguisher = false;
    _eKeyHeld        = false;
    _arrestTimer     = 0;
    _arrestTarget    = null;
    _lastPTime       = -9999;
    _lastRTime       = -9999;

    if (_hudEl) _hudEl.style.display = 'none';
  }

  /* ── Public API ──────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset
  };
})();
