/* ───────────────────────────────────────────────────────────────────────────
   sky-fortress.js — Sky Fortress Mini-Game
   API: window.SkyFortress = { init, update, reset }
   Activation: S + F simultaneous keypress (both within 400ms)

   Features:
     Large floating steel platform at y=80, 60x4x40
     3 corner towers, command bridge, 4 AA cannons
     Parachute arrival (WASD steer, 2u/s descent)
     Constant eastward wind 2u/s + gusts every 30s
     12 fortress soldiers (patrol + stationed)
     3 elevator shafts (E key to ride)
     3 platform levels: DECK / MID-DECK / TOP-DECK
     Fuel tanks that explode and chain
     Sky commander boss (500 HP) with jet strafe every 60s
     Grapple hook (G key) for under-platform cover
     Fortress destruction sequence + parachute escape
     HUD overlay
   ─────────────────────────────────────────────────────────────────────────── */
window.SkyFortress = (function () {
  'use strict';

  /* ── Scene references ────────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation key tracking ─────────────────────────────────────────────── */
  var _sfPressTime   = { S: 0, F: 0 };
  var SF_WINDOW      = 400; // ms

  /* ── Game state ──────────────────────────────────────────────────────────── */
  var _active          = false;
  var _phase           = 'PARACHUTE'; // PARACHUTE | DECK | MID-DECK | TOP-DECK | ESCAPE | DEAD
  var _currentLevel    = 'DECK';
  var _destroyCountdown = 0;
  var _fortressDestroyed = false;

  /* ── Platform & structure meshes ─────────────────────────────────────────── */
  var _platform       = null;
  var _platformGroup  = null;  // parent group (tilts when listing)
  var _towers         = [];
  var _commandBridge  = null;
  var _aaCannons      = [];    // { group, barrel, angle }
  var _railingLines   = null;
  var _elevators      = [];    // { shaft, basePosY, topPosY, position }
  var _platformTilt   = 0;     // degrees, ramps to 15 when fuel all gone
  var _fuelDestroyed  = 0;

  /* ── Fuel tanks ──────────────────────────────────────────────────────────── */
  var _fuelTanks      = [];    // { mesh, alive, light, explodeTimer }
  var _fuelTotal      = 3;

  /* ── Cover objects on platform ───────────────────────────────────────────── */
  var _coverObjects   = [];

  /* ── Soldiers ────────────────────────────────────────────────────────────── */
  var _soldiers       = [];    // { mesh, hp, alive, type, level, patrolDir, patrolTimer, angle }
  var _soldierTotal   = 12;
  var _soldierAlive   = 12;

  /* ── Sky Commander boss ──────────────────────────────────────────────────── */
  var _boss           = null;  // mesh
  var _bossHP         = 500;
  var _bossAlive      = false;
  var _bossJetTimer   = 0;
  var _strafeJets     = [];    // { mesh, vel, alive, bullets }
  var _strafeBullets  = [];    // { mesh, vel, life }

  /* ── Player ──────────────────────────────────────────────────────────────── */
  var _player         = null;  // mesh (placeholder cube or capsule)
  var _playerPos      = new THREE.Vector3(0, 200, 0);
  var _playerVel      = new THREE.Vector3(0, 0, 0);
  var _playerHP       = 100;
  var _parachuting    = true;
  var _canopyMesh     = null;
  var _onGround       = false;  // standing on platform
  var _playerLevel    = 'DECK'; // which deck the player is on
  var _falling        = false;
  var _dead           = false;
  var _escapingFortress = false;

  /* ── Wind ────────────────────────────────────────────────────────────────── */
  var _windBase       = 2;   // u/s eastward (X+)
  var _windGust       = 0;   // extra speed during gust
  var _gustTimer      = 0;
  var _gustActive     = false;
  var _gustDuration   = 5;   // seconds per gust
  var _gustInterval   = 30;  // seconds between gusts

  /* ── Grapple ─────────────────────────────────────────────────────────────── */
  var _grappleActive  = false;
  var _grappleLine    = null;  // LineSegments
  var _grappleAnchor  = null;  // Vector3
  var _grappleLength  = 0;
  var _grappling      = false; // swinging

  /* ── Explosions / VFX ────────────────────────────────────────────────────── */
  var _explosions     = [];  // { mesh, light, life, maxLife }

  /* ── Input state ─────────────────────────────────────────────────────────── */
  var _keys           = {};
  var _keyTimestamps  = {};

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  var _hud            = null;
  var _countdownEl    = null;

  /* ── Timers ──────────────────────────────────────────────────────────────── */
  var _lastTime       = 0;
  var _elapsedTime    = 0;

  /* ── Elevator ride state ─────────────────────────────────────────────────── */
  var _inElevator     = false;
  var _elevatorTarget = 0;
  var _elevatorSpeed  = 5;

  /* ── Bullet / projectiles ────────────────────────────────────────────────── */
  var _soldierBullets = [];  // { mesh, vel, life, damage }

  /* ════════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════════ */

  function buildPlatform() {
    _platformGroup = new THREE.Group();
    _platformGroup.position.set(0, 80, 0);
    _scene.add(_platformGroup);

    /* Main deck */
    var deckGeo = new THREE.BoxGeometry(60, 4, 40);
    var deckMat = new THREE.MeshLambertMaterial({ color: 0x446677 });
    _platform   = new THREE.Mesh(deckGeo, deckMat);
    _platform.position.set(0, 0, 0);
    _platformGroup.add(_platform);

    /* Edge railing as LineSegments */
    buildRailing();

    /* Towers at 3 corners (skip front-center): front-left, front-right, back-center */
    var towerPositions = [
      new THREE.Vector3(-27, 12, -18),
      new THREE.Vector3(27, 12, -18),
      new THREE.Vector3(0, 12, 18)
    ];
    var towerGeo = new THREE.BoxGeometry(6, 20, 6);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x557788 });
    for (var i = 0; i < 3; i++) {
      var tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.copy(towerPositions[i]);
      _platformGroup.add(tower);
      _towers.push(tower);
    }

    /* Command bridge at center-top */
    var bridgeGeo = new THREE.BoxGeometry(12, 8, 8);
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    _commandBridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    _commandBridge.position.set(0, 26, 0);
    _platformGroup.add(_commandBridge);

    /* AA cannons at 4 corners */
    var aaPositions = [
      new THREE.Vector3(-28, 3, -18),
      new THREE.Vector3(28, 3, -18),
      new THREE.Vector3(-28, 3, 18),
      new THREE.Vector3(28, 3, 18)
    ];
    for (var j = 0; j < 4; j++) {
      var cannonGroup = new THREE.Group();
      cannonGroup.position.copy(aaPositions[j]);
      var baseGeo = new THREE.BoxGeometry(2, 3, 2);
      var baseMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
      var cannonBase = new THREE.Mesh(baseGeo, baseMat);
      cannonGroup.add(cannonBase);
      /* Rotating barrel */
      var barrelGeo = new THREE.BoxGeometry(0.5, 4, 0.5);
      var barrelMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(0, 3.5, 0);
      cannonGroup.add(barrel);
      _platformGroup.add(cannonGroup);
      _aaCannons.push({ group: cannonGroup, barrel: barrel, angle: 0 });
    }

    /* Elevator shafts: 3 CylinderGeometry r=2 at key positions */
    var elevPositions = [
      new THREE.Vector3(-20, 0, 0),
      new THREE.Vector3(20, 0, 0),
      new THREE.Vector3(0, 0, -15)
    ];
    for (var k = 0; k < 3; k++) {
      var shaftGeo = new THREE.CylinderGeometry(2, 2, 30, 12);
      var shaftMat = new THREE.MeshLambertMaterial({ color: 0x335566, transparent: true, opacity: 0.6 });
      var shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.copy(elevPositions[k]);
      shaft.position.y = 15;
      _platformGroup.add(shaft);
      _elevators.push({
        shaft:    shaft,
        position: elevPositions[k].clone(),
        basePosY: 2,
        topPosY:  30
      });
    }

    /* Fuel tanks on MID-DECK (y = 22 relative to platform) */
    var fuelPositions = [
      new THREE.Vector3(-15, 22, 5),
      new THREE.Vector3(0, 22, 5),
      new THREE.Vector3(15, 22, 5)
    ];
    for (var f = 0; f < 3; f++) {
      var ftGeo = new THREE.BoxGeometry(3, 4, 3);
      var ftMat = new THREE.MeshLambertMaterial({ color: 0xAA4422 });
      var ft = new THREE.Mesh(ftGeo, ftMat);
      ft.position.copy(fuelPositions[f]);
      _platformGroup.add(ft);
      _fuelTanks.push({ mesh: ft, alive: true, light: null, explodeTimer: 0, chainTimer: 0 });
    }

    /* Cover boxes on main deck */
    var coverPositions = [
      new THREE.Vector3(-10, 3, -5),
      new THREE.Vector3(10, 3, -5),
      new THREE.Vector3(-10, 3, 5),
      new THREE.Vector3(10, 3, 5),
      new THREE.Vector3(0, 3, 10)
    ];
    for (var c = 0; c < coverPositions.length; c++) {
      var covGeo = new THREE.BoxGeometry(3, 2, 2);
      var covMat = new THREE.MeshLambertMaterial({ color: 0x445555 });
      var cov = new THREE.Mesh(covGeo, covMat);
      cov.position.copy(coverPositions[c]);
      _platformGroup.add(cov);
      _coverObjects.push(cov);
    }
  }

  function buildRailing() {
    var points = [];
    var hw = 30, hd = 20, h = 3; // half-width, half-depth, rail height

    /* Top rail loop */
    points.push(new THREE.Vector3(-hw, h, -hd));
    points.push(new THREE.Vector3( hw, h, -hd));
    points.push(new THREE.Vector3( hw, h, -hd));
    points.push(new THREE.Vector3( hw, h,  hd));
    points.push(new THREE.Vector3( hw, h,  hd));
    points.push(new THREE.Vector3(-hw, h,  hd));
    points.push(new THREE.Vector3(-hw, h,  hd));
    points.push(new THREE.Vector3(-hw, h, -hd));

    /* Mid rail loop */
    points.push(new THREE.Vector3(-hw, h * 0.5, -hd));
    points.push(new THREE.Vector3( hw, h * 0.5, -hd));
    points.push(new THREE.Vector3( hw, h * 0.5, -hd));
    points.push(new THREE.Vector3( hw, h * 0.5,  hd));
    points.push(new THREE.Vector3( hw, h * 0.5,  hd));
    points.push(new THREE.Vector3(-hw, h * 0.5,  hd));
    points.push(new THREE.Vector3(-hw, h * 0.5,  hd));
    points.push(new THREE.Vector3(-hw, h * 0.5, -hd));

    /* Vertical posts every 10 units */
    var xs = [-hw, -hw + 10, -hw + 20, hw - 10, hw];
    for (var i = 0; i < xs.length; i++) {
      points.push(new THREE.Vector3(xs[i], 0, -hd));
      points.push(new THREE.Vector3(xs[i], h, -hd));
      points.push(new THREE.Vector3(xs[i], 0,  hd));
      points.push(new THREE.Vector3(xs[i], h,  hd));
    }
    var zs = [-hd, -hd + 10, hd - 10, hd];
    for (var j = 0; j < zs.length; j++) {
      points.push(new THREE.Vector3(-hw, 0, zs[j]));
      points.push(new THREE.Vector3(-hw, h, zs[j]));
      points.push(new THREE.Vector3( hw, 0, zs[j]));
      points.push(new THREE.Vector3( hw, h, zs[j]));
    }

    var railGeo = new THREE.BufferGeometry().setFromPoints(points);
    var railMat = new THREE.LineBasicMaterial({ color: 0x99AABB });
    _railingLines = new THREE.LineSegments(railGeo, railMat);
    _railingLines.position.set(0, 2, 0);
    _platformGroup.add(_railingLines);
  }

  function buildSoldiers() {
    _soldiers = [];
    /* DECK: 4 guards */
    var deckPositions = [
      new THREE.Vector3(-20, 84, -10),
      new THREE.Vector3(20, 84, -10),
      new THREE.Vector3(-20, 84, 10),
      new THREE.Vector3(20, 84, 10)
    ];
    for (var i = 0; i < 4; i++) {
      _soldiers.push(makeSoldier(deckPositions[i], 'patrol', 'DECK', 80));
    }
    /* MID-DECK: 4 guards (y = 80+22 = 102) */
    var midPositions = [
      new THREE.Vector3(-15, 102, -5),
      new THREE.Vector3(15, 102, -5),
      new THREE.Vector3(-15, 102, 8),
      new THREE.Vector3(15, 102, 8)
    ];
    for (var j = 0; j < 4; j++) {
      _soldiers.push(makeSoldier(midPositions[j], 'stationed', 'MID-DECK', 80));
    }
    /* TOP-DECK: boss guards (y = 80+26+4 = 110) */
    var topPositions = [
      new THREE.Vector3(-8, 110, -3),
      new THREE.Vector3(8, 110, -3),
      new THREE.Vector3(-8, 110, 3),
      new THREE.Vector3(8, 110, 3)
    ];
    for (var k = 0; k < 4; k++) {
      _soldiers.push(makeSoldier(topPositions[k], 'stationed', 'TOP-DECK', 100));
    }
    _soldierAlive = _soldiers.length;
  }

  function makeSoldier(pos, type, level, hp) {
    var geo = new THREE.BoxGeometry(1, 2, 1);
    var mat = new THREE.MeshLambertMaterial({ color: 0x334466 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    return {
      mesh:        mesh,
      hp:          hp,
      maxHp:       hp,
      alive:       true,
      type:        type,
      level:       level,
      patrolDir:   new THREE.Vector3(1, 0, 0),
      patrolTimer: Math.random() * 3,
      angle:       0,
      fireTimer:   2 + Math.random() * 3,
      aggroRange:  20
    };
  }

  function buildBoss() {
    var geo = new THREE.BoxGeometry(1.4, 2.8, 1.4);
    var mat = new THREE.MeshLambertMaterial({ color: 0x222244 });
    _boss = new THREE.Mesh(geo, mat);
    _boss.position.set(0, 114, 0);
    _scene.add(_boss);
    _bossAlive = true;
    _bossHP    = 500;
    _bossJetTimer = 60;
  }

  function buildPlayerMesh() {
    var geo = new THREE.BoxGeometry(1, 2, 1);
    var mat = new THREE.MeshLambertMaterial({ color: 0x88AACC });
    _player = new THREE.Mesh(geo, mat);
    _player.position.copy(_playerPos);
    _scene.add(_player);
  }

  function buildCanopy() {
    var geo = new THREE.CylinderGeometry(4, 1, 3, 10);
    var mat = new THREE.MeshLambertMaterial({ color: 0xEEEEDD, transparent: true, opacity: 0.7 });
    _canopyMesh = new THREE.Mesh(geo, mat);
    _scene.add(_canopyMesh);
  }

  function removeCanopy() {
    if (_canopyMesh) {
      _scene.remove(_canopyMesh);
      _canopyMesh = null;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     LAUNCH / RESET
  ════════════════════════════════════════════════════════════════════════════ */

  function launch() {
    if (_active) return;
    _active             = true;
    _phase              = 'PARACHUTE';
    _currentLevel       = 'DECK';
    _dead               = false;
    _parachuting        = true;
    _onGround           = false;
    _falling            = false;
    _fortressDestroyed  = false;
    _destroyCountdown   = 0;
    _escapingFortress   = false;
    _fuelDestroyed      = 0;
    _platformTilt       = 0;
    _bossHP             = 500;
    _bossAlive          = false;
    _bossJetTimer       = 60;
    _gustTimer          = _gustInterval;
    _gustActive         = false;
    _windGust           = 0;
    _playerHP           = 100;
    _grappleActive      = false;
    _grappling          = false;
    _inElevator         = false;
    _elapsedTime        = 0;
    _playerPos.set(0, 200, 0);
    _playerVel.set(0, 0, 0);
    _towers        = [];
    _aaCannons     = [];
    _elevators     = [];
    _fuelTanks     = [];
    _coverObjects  = [];
    _explosions    = [];
    _strafeJets    = [];
    _strafeBullets = [];
    _soldierBullets = [];

    buildPlatform();
    buildSoldiers();
    buildBoss();
    buildPlayerMesh();
    buildCanopy();
    buildHUD();

    /* Camera follows player from behind and above */
    if (_camera) {
      _camera.position.set(0, 210, 30);
      _camera.lookAt(0, 200, 0);
    }
  }

  function reset() {
    cleanupScene();
    _active = false;
    _phase  = 'PARACHUTE';
    if (_hud) { _hud.parentNode && _hud.parentNode.removeChild(_hud); _hud = null; }
    if (_countdownEl) { _countdownEl.parentNode && _countdownEl.parentNode.removeChild(_countdownEl); _countdownEl = null; }
  }

  function cleanupScene() {
    if (_platformGroup) { _scene.remove(_platformGroup); _platformGroup = null; }
    if (_player) { _scene.remove(_player); _player = null; }
    if (_boss) { _scene.remove(_boss); _boss = null; }
    if (_canopyMesh) { _scene.remove(_canopyMesh); _canopyMesh = null; }
    if (_grappleLine) { _scene.remove(_grappleLine); _grappleLine = null; }
    for (var i = 0; i < _soldiers.length; i++) {
      if (_soldiers[i].mesh) _scene.remove(_soldiers[i].mesh);
    }
    _soldiers = [];
    for (var j = 0; j < _explosions.length; j++) {
      if (_explosions[j].mesh) _scene.remove(_explosions[j].mesh);
      if (_explosions[j].light) _scene.remove(_explosions[j].light);
    }
    _explosions = [];
    for (var k = 0; k < _strafeJets.length; k++) {
      if (_strafeJets[k].mesh) _scene.remove(_strafeJets[k].mesh);
    }
    _strafeJets = [];
    for (var s = 0; s < _strafeBullets.length; s++) {
      if (_strafeBullets[s].mesh) _scene.remove(_strafeBullets[s].mesh);
    }
    _strafeBullets = [];
    for (var b = 0; b < _soldierBullets.length; b++) {
      if (_soldierBullets[b].mesh) _scene.remove(_soldierBullets[b].mesh);
    }
    _soldierBullets = [];
  }

  /* ════════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    if (_hud) { _hud.parentNode && _hud.parentNode.removeChild(_hud); }
    _hud = document.createElement('div');
    _hud.id = 'skyfortress-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,40,0.82)',
      'color:#99DDFF',
      'font:bold 13px monospace',
      'padding:6px 16px',
      'border:1px solid #446677',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hud);

    _countdownEl = document.createElement('div');
    _countdownEl.id = 'skyfortress-countdown';
    _countdownEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(80,0,0,0.85)',
      'color:#FF4444',
      'font:bold 32px monospace',
      'padding:16px 32px',
      'border:2px solid #FF0000',
      'border-radius:6px',
      'z-index:10000',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_countdownEl);
  }

  function updateHUD() {
    if (!_hud || !_active) return;
    var fuelCount = _fuelTotal - _fuelDestroyed;
    var windStr   = _gustActive ? 'EAST (GUST)' : 'EAST';
    var bossStr   = _bossAlive ? 'BRIDGE' : 'ELIMINATED';
    var hpStr     = 'HP:' + Math.max(0, Math.round(_playerHP));
    _hud.textContent = 'SKY FORTRESS [LEVEL: ' + _currentLevel + '] [SOLDIERS: ' + _soldierAlive +
      '] [FUEL TANKS: ' + fuelCount + '/' + _fuelTotal + '] [WIND: ' + windStr +
      '] | BOSS: ' + bossStr + ' | ' + hpStr;
  }

  /* ════════════════════════════════════════════════════════════════════════════
     PARACHUTE PHASE
  ════════════════════════════════════════════════════════════════════════════ */

  function updateParachute(dt) {
    /* Descent */
    _playerVel.y = -2; // 2 u/s constant descent

    /* WASD steering */
    var steerX = 0, steerZ = 0;
    if (_keys['w'] || _keys['W']) steerZ = -5;
    if (_keys['s'] || _keys['S']) steerZ =  5;
    if (_keys['a'] || _keys['A']) steerX = -5;
    if (_keys['d'] || _keys['D']) steerX =  5;

    /* Wind applies during descent */
    var totalWindX = _windBase + _windGust;
    _playerVel.x = steerX + totalWindX;
    _playerVel.z = steerZ;

    _playerPos.x += _playerVel.x * dt;
    _playerPos.y += _playerVel.y * dt;
    _playerPos.z += _playerVel.z * dt;

    /* Check landing on platform */
    var platformWorldY = 80 + 2; /* top of 4-thick platform is y=82 */
    var px = _playerPos.x, pz = _playerPos.z;
    var onPlatform = (px > -30 && px < 30 && pz > -20 && pz < 20);

    if (_playerPos.y <= platformWorldY + 1 && onPlatform) {
      /* Land on deck */
      _playerPos.y = platformWorldY + 1;
      _parachuting = false;
      _onGround    = true;
      _phase       = 'DECK';
      _currentLevel = 'DECK';
      removeCanopy();
      _playerVel.set(0, 0, 0);
    } else if (_playerPos.y <= 0 && !onPlatform) {
      /* Fell outside fortress */
      killPlayer('fall');
    }

    if (_canopyMesh) {
      _canopyMesh.position.set(_playerPos.x, _playerPos.y + 5, _playerPos.z);
    }

    if (_player) _player.position.copy(_playerPos);
  }

  /* ════════════════════════════════════════════════════════════════════════════
     GROUND MOVEMENT
  ════════════════════════════════════════════════════════════════════════════ */

  function updateGroundMovement(dt) {
    if (_inElevator) return;
    if (_grappling) {
      updateGrappleSwing(dt);
      return;
    }

    var moveX = 0, moveZ = 0;
    var speed = 8;
    if (_keys['w'] || _keys['W']) moveZ = -1;
    if (_keys['s'] || _keys['S']) moveZ =  1;
    if (_keys['a'] || _keys['A']) moveX = -1;
    if (_keys['d'] || _keys['D']) moveX =  1;

    /* Tilt affects movement (listing) */
    var tiltRad = (_platformTilt * Math.PI / 180);
    var slideX  = Math.sin(tiltRad) * 3 * dt; /* slide toward tilt direction */

    _playerPos.x += (moveX * speed + (_windBase + _windGust) * 0.3 + slideX) * dt;
    _playerPos.z += moveZ * speed * dt;

    /* Determine current level from Y */
    var deckY    = 83;
    var midDeckY = 102;
    var topDeckY = 110;

    /* Clamp to platform */
    var onFortress = checkOnPlatform();
    if (!onFortress) {
      /* Falling off */
      _playerVel.y -= 20 * dt;
      _playerPos.y += _playerVel.y * dt;
      if (_playerPos.y < 0) {
        killPlayer('fall');
      }
    } else {
      /* Stay on floor */
      _playerVel.y = 0;
    }

    if (_player) _player.position.copy(_playerPos);
  }

  function checkOnPlatform() {
    var px = _playerPos.x, pz = _playerPos.z, py = _playerPos.y;
    /* Main deck: y ~ 83 */
    if (py >= 82 && py <= 86 && px > -30 && px < 30 && pz > -20 && pz < 20) return true;
    /* Mid-deck level ~ 102 (on top of towers/mid structure) */
    if (py >= 100 && py <= 106 && px > -28 && px < 28 && pz > -18 && pz < 18) return true;
    /* Top-deck / bridge level ~ 110 */
    if (py >= 108 && py <= 116 && px > -6 && px < 6 && pz > -4 && pz < 4) return true;
    return false;
  }

  /* ════════════════════════════════════════════════════════════════════════════
     WIND
  ════════════════════════════════════════════════════════════════════════════ */

  function updateWind(dt) {
    _gustTimer -= dt;
    if (_gustActive) {
      /* Gust is on */
      if (_gustTimer <= 0) {
        _gustActive = false;
        _windGust   = 0;
        _gustTimer  = _gustInterval;
      }
    } else {
      if (_gustTimer <= 0) {
        _gustActive = true;
        _windGust   = 5;
        _gustTimer  = _gustDuration;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     SOLDIERS
  ════════════════════════════════════════════════════════════════════════════ */

  function updateSoldiers(dt) {
    for (var i = 0; i < _soldiers.length; i++) {
      var s = _soldiers[i];
      if (!s.alive) continue;

      /* Patrol movement */
      if (s.type === 'patrol') {
        s.patrolTimer -= dt;
        if (s.patrolTimer <= 0) {
          /* Reverse direction and pick random */
          s.patrolDir.x = (Math.random() - 0.5) * 2;
          s.patrolDir.z = (Math.random() - 0.5) * 2;
          s.patrolDir.normalize();
          s.patrolTimer = 2 + Math.random() * 3;
        }
        s.mesh.position.x += s.patrolDir.x * 3 * dt;
        s.mesh.position.z += s.patrolDir.z * 3 * dt;
      }

      /* AA cannon operators — rotate cannon barrel toward player */
      if (i < 4) {
        var cannon = _aaCannons[i];
        if (cannon) {
          cannon.angle += dt * 0.8;
          cannon.group.rotation.y = cannon.angle;
        }
      }

      /* Fire at player if in range */
      s.fireTimer -= dt;
      var dx = _playerPos.x - s.mesh.position.x;
      var dy = _playerPos.y - s.mesh.position.y;
      var dz = _playerPos.z - s.mesh.position.z;
      var distSq = dx*dx + dy*dy + dz*dz;
      if (s.fireTimer <= 0 && distSq < s.aggroRange * s.aggroRange) {
        fireSoldierBullet(s);
        s.fireTimer = 2 + Math.random() * 2;
      }
    }
  }

  function fireSoldierBullet(soldier) {
    var geo = new THREE.SphereGeometry(0.15, 4, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF8800, emissive: 0xFF4400, emissiveIntensity: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(soldier.mesh.position);
    _scene.add(mesh);
    var dx = _playerPos.x - soldier.mesh.position.x;
    var dy = _playerPos.y - soldier.mesh.position.y;
    var dz = _playerPos.z - soldier.mesh.position.z;
    var len = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
    var speed = 20;
    _soldierBullets.push({
      mesh:    mesh,
      vel:     new THREE.Vector3(dx/len*speed, dy/len*speed, dz/len*speed),
      life:    3,
      damage:  10
    });
  }

  function updateSoldierBullets(dt) {
    for (var i = _soldierBullets.length - 1; i >= 0; i--) {
      var b = _soldierBullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;
      /* Hit player */
      var bx = b.mesh.position.x - _playerPos.x;
      var by = b.mesh.position.y - _playerPos.y;
      var bz = b.mesh.position.z - _playerPos.z;
      if (bx*bx + by*by + bz*bz < 2) {
        _playerHP -= b.damage;
        b.life = 0;
      }
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _soldierBullets.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     BOSS
  ════════════════════════════════════════════════════════════════════════════ */

  function updateBoss(dt) {
    if (!_bossAlive || !_boss) return;
    /* Bob boss slightly */
    _boss.rotation.y += dt * 0.5;
    /* Call in jets on timer */
    _bossJetTimer -= dt;
    if (_bossJetTimer <= 0) {
      launchStrafeJets();
      _bossJetTimer = 60;
    }
  }

  function launchStrafeJets() {
    /* Two jets come from the west, fly east past platform at y=85 */
    for (var i = 0; i < 2; i++) {
      var geo = new THREE.BoxGeometry(6, 1, 3);
      var mat = new THREE.MeshLambertMaterial({ color: 0x334455 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(-120, 85, -10 + i * 20);
      _scene.add(mesh);
      _strafeJets.push({
        mesh:      mesh,
        vel:       new THREE.Vector3(40, 0, 0),
        alive:     true,
        fireTimer: 0.2,
        passed:    false
      });
    }
  }

  function updateStrafeJets(dt) {
    for (var i = _strafeJets.length - 1; i >= 0; i--) {
      var jet = _strafeJets[i];
      if (!jet.alive) continue;
      jet.mesh.position.x += jet.vel.x * dt;
      /* Fire bullets as they pass over fortress */
      if (jet.mesh.position.x > -50 && jet.mesh.position.x < 50) {
        jet.fireTimer -= dt;
        if (jet.fireTimer <= 0) {
          fireStrafeBullet(jet);
          jet.fireTimer = 0.15;
        }
      }
      /* Remove when far away */
      if (jet.mesh.position.x > 150) {
        _scene.remove(jet.mesh);
        jet.alive = false;
        _strafeJets.splice(i, 1);
      }
    }
  }

  function fireStrafeBullet(jet) {
    var geo = new THREE.SphereGeometry(0.2, 4, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF2200, emissive: 0xFF0000, emissiveIntensity: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(jet.mesh.position);
    _scene.add(mesh);
    _strafeBullets.push({
      mesh:   mesh,
      vel:    new THREE.Vector3(0, -5, 0),
      life:   4,
      damage: 40
    });
  }

  function updateStrafeBullets(dt) {
    for (var i = _strafeBullets.length - 1; i >= 0; i--) {
      var b = _strafeBullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;
      /* Hit player */
      var bx = b.mesh.position.x - _playerPos.x;
      var by = b.mesh.position.y - _playerPos.y;
      var bz = b.mesh.position.z - _playerPos.z;
      if (bx*bx + by*by + bz*bz < 3) {
        _playerHP -= b.damage;
        b.life = 0;
      }
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _strafeBullets.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     FUEL TANKS
  ════════════════════════════════════════════════════════════════════════════ */

  function shootFuelTank(index) {
    var ft = _fuelTanks[index];
    if (!ft || !ft.alive) return;
    ft.alive = false;
    _fuelDestroyed++;

    /* Explosion visual */
    var expGeo = new THREE.SphereGeometry(3, 8, 8);
    var expMat = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: 0xFF2200, emissiveIntensity: 2 });
    var expMesh = new THREE.Mesh(expGeo, expMat);
    expMesh.position.copy(ft.mesh.position);
    /* Convert from platform local to world */
    _platformGroup.localToWorld(expMesh.position);
    _scene.add(expMesh);

    var expLight = new THREE.PointLight(0xFF4400, 8, 18);
    expLight.position.copy(expMesh.position);
    _scene.add(expLight);

    _explosions.push({ mesh: expMesh, light: expLight, life: 1.5, maxLife: 1.5 });

    /* Damage player if close */
    var ftWorld = ft.mesh.position.clone();
    _platformGroup.localToWorld(ftWorld);
    var dx = ftWorld.x - _playerPos.x;
    var dy = ftWorld.y - _playerPos.y;
    var dz = ftWorld.z - _playerPos.z;
    var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (dist < 6) _playerHP -= 80;

    /* Chain to adjacent tanks */
    for (var i = 0; i < _fuelTanks.length; i++) {
      if (i === index) continue;
      var other = _fuelTanks[i];
      if (!other.alive) continue;
      var ox = ft.mesh.position.x - other.mesh.position.x;
      var oz = ft.mesh.position.z - other.mesh.position.z;
      if (Math.sqrt(ox*ox + oz*oz) < 10) {
        other.chainTimer = 0.5; /* explode after 0.5s */
      }
    }

    _scene.remove(ft.mesh);

    /* Check if all destroyed */
    if (_fuelDestroyed >= _fuelTotal) {
      startFortressListing();
    }
  }

  function updateFuelTanks(dt) {
    for (var i = 0; i < _fuelTanks.length; i++) {
      var ft = _fuelTanks[i];
      if (!ft.alive) continue;
      if (ft.chainTimer > 0) {
        ft.chainTimer -= dt;
        if (ft.chainTimer <= 0) {
          shootFuelTank(i);
        }
      }
    }
  }

  function startFortressListing() {
    /* Platform will tilt to 15 degrees over time */
  }

  /* ════════════════════════════════════════════════════════════════════════════
     PLATFORM TILT
  ════════════════════════════════════════════════════════════════════════════ */

  function updatePlatformTilt(dt) {
    if (_fuelDestroyed >= _fuelTotal && _platformTilt < 15) {
      _platformTilt += dt * 2; /* tilt 2 degrees/second */
      if (_platformTilt > 15) _platformTilt = 15;
    }
    if (_platformGroup) {
      _platformGroup.rotation.z = _platformTilt * Math.PI / 180;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     ELEVATOR
  ════════════════════════════════════════════════════════════════════════════ */

  function tryElevator() {
    if (_inElevator) return;
    for (var i = 0; i < _elevators.length; i++) {
      var elev = _elevators[i];
      var epWorld = elev.position.clone();
      epWorld.y = 83; /* base of elevator on deck */
      _platformGroup.localToWorld(epWorld);
      var dx = epWorld.x - _playerPos.x;
      var dz = epWorld.z - _playerPos.z;
      if (Math.sqrt(dx*dx + dz*dz) < 3) {
        /* Ride up */
        _inElevator = true;
        _elevatorTarget = _playerPos.y + 20;
        break;
      }
    }
  }

  function updateElevator(dt) {
    if (!_inElevator) return;
    _playerPos.y += _elevatorSpeed * dt;
    if (_player) _player.position.copy(_playerPos);
    if (_playerPos.y >= _elevatorTarget) {
      _playerPos.y = _elevatorTarget;
      _inElevator  = false;
      /* Update level based on new Y */
      if (_playerPos.y >= 108) {
        _currentLevel = 'TOP-DECK';
        _phase = 'TOP-DECK';
      } else if (_playerPos.y >= 100) {
        _currentLevel = 'MID-DECK';
        _phase = 'MID-DECK';
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     GRAPPLE
  ════════════════════════════════════════════════════════════════════════════ */

  function fireGrapple() {
    if (_grappleActive) {
      releaseGrapple();
      return;
    }
    /* Anchor to underside of platform */
    _grappleAnchor  = new THREE.Vector3(_playerPos.x, 78, _playerPos.z);
    _grappleLength  = Math.abs(_playerPos.y - 78);
    _grappleActive  = true;
    _grappling      = true;

    /* Build line */
    if (_grappleLine) _scene.remove(_grappleLine);
    var pts = [
      new THREE.Vector3(_playerPos.x, _playerPos.y, _playerPos.z),
      _grappleAnchor.clone()
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: 0xCCBB88 });
    _grappleLine = new THREE.LineSegments(geo, mat);
    _scene.add(_grappleLine);
  }

  function releaseGrapple() {
    _grappleActive = false;
    _grappling     = false;
    if (_grappleLine) { _scene.remove(_grappleLine); _grappleLine = null; }
  }

  function updateGrappleSwing(dt) {
    if (!_grappleActive || !_grappleAnchor) return;
    /* Simple pendulum-like swing toward anchor */
    var dx = _grappleAnchor.x - _playerPos.x;
    var dy = _grappleAnchor.y - _playerPos.y;
    var dz = _grappleAnchor.z - _playerPos.z;
    var len = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
    /* Tension force */
    var tension = 5;
    _playerVel.x += (dx/len) * tension * dt;
    _playerVel.y += (dy/len) * tension * dt - 4 * dt;
    _playerVel.z += (dz/len) * tension * dt;

    _playerPos.x += _playerVel.x * dt;
    _playerPos.y += _playerVel.y * dt;
    _playerPos.z += _playerVel.z * dt;

    /* Clamp to grapple length */
    var cx = _playerPos.x - _grappleAnchor.x;
    var cy = _playerPos.y - _grappleAnchor.y;
    var cz = _playerPos.z - _grappleAnchor.z;
    var clen = Math.sqrt(cx*cx + cy*cy + cz*cz);
    if (clen > _grappleLength) {
      var scale = _grappleLength / clen;
      _playerPos.x = _grappleAnchor.x + cx * scale;
      _playerPos.y = _grappleAnchor.y + cy * scale;
      _playerPos.z = _grappleAnchor.z + cz * scale;
    }

    if (_player) _player.position.copy(_playerPos);
    /* Update line geometry */
    if (_grappleLine) {
      var pts = [
        new THREE.Vector3(_playerPos.x, _playerPos.y, _playerPos.z),
        _grappleAnchor.clone()
      ];
      var geo = new THREE.BufferGeometry().setFromPoints(pts);
      _grappleLine.geometry.dispose();
      _grappleLine.geometry = geo;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     EXPLOSIONS VFX UPDATE
  ════════════════════════════════════════════════════════════════════════════ */

  function updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life -= dt;
      var t = 1 - ex.life / ex.maxLife;
      var scale = 1 + t * 2;
      ex.mesh.scale.setScalar(scale);
      if (ex.light) ex.light.intensity = (1 - t) * 8;
      if (ex.life <= 0) {
        _scene.remove(ex.mesh);
        if (ex.light) _scene.remove(ex.light);
        _explosions.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     FORTRESS DESTRUCTION SEQUENCE
  ════════════════════════════════════════════════════════════════════════════ */

  function checkVictoryConditions() {
    if (_fortressDestroyed) return;
    if (!_bossAlive && _fuelDestroyed >= _fuelTotal) {
      startFortressDestruction();
    }
  }

  function startFortressDestruction() {
    _fortressDestroyed  = true;
    _destroyCountdown   = 30;
    _escapingFortress   = true;
    if (_countdownEl) {
      _countdownEl.style.display = 'block';
    }
  }

  function updateDestroyCountdown(dt) {
    if (!_fortressDestroyed || !_escapingFortress) return;
    _destroyCountdown -= dt;
    if (_countdownEl) {
      _countdownEl.textContent = 'FORTRESS CRITICAL — ESCAPE IN ' + Math.ceil(Math.max(0, _destroyCountdown)) + 's';
    }
    /* Tilt faster */
    if (_platformGroup) {
      _platformGroup.rotation.z += dt * 0.02;
    }
    if (_destroyCountdown <= 0) {
      /* Explode fortress */
      spawnMassExplosion();
      if (_parachuting || _escapingFortress) {
        /* Player survived */
        _phase = 'DEAD';
        if (_countdownEl) {
          _countdownEl.textContent = 'FORTRESS DESTROYED — MISSION COMPLETE!';
          _countdownEl.style.color = '#44FF44';
          _countdownEl.style.background = 'rgba(0,60,0,0.85)';
          _countdownEl.style.borderColor = '#00FF00';
        }
      } else {
        killPlayer('explosion');
      }
      _escapingFortress = false;
    }
  }

  function spawnMassExplosion() {
    for (var i = 0; i < 8; i++) {
      var geo = new THREE.SphereGeometry(4 + Math.random() * 4, 8, 8);
      var mat = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: 0xFF2200, emissiveIntensity: 2 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        80 + Math.random() * 20,
        (Math.random() - 0.5) * 30
      );
      _scene.add(mesh);
      var light = new THREE.PointLight(0xFF4400, 10, 25);
      light.position.copy(mesh.position);
      _scene.add(light);
      _explosions.push({ mesh: mesh, light: light, life: 2 + Math.random(), maxLife: 2 });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     ESCAPE PARACHUTE
  ════════════════════════════════════════════════════════════════════════════ */

  function deployEscapeParachute() {
    if (!_escapingFortress) return;
    _parachuting = true;
    buildCanopy();
    _playerVel.set(0, 0, 0);
    /* Detach from platform */
    _onGround = false;
    _grappling = false;
    releaseGrapple();
  }

  function updateEscapeParachute(dt) {
    if (!_parachuting || !_escapingFortress) return;
    _playerVel.y = -2;
    var totalWindX = _windBase + _windGust;
    _playerPos.x += totalWindX * 0.5 * dt;
    _playerPos.y += _playerVel.y * dt;
    if (_canopyMesh) {
      _canopyMesh.position.set(_playerPos.x, _playerPos.y + 5, _playerPos.z);
    }
    if (_player) _player.position.copy(_playerPos);
  }

  /* ════════════════════════════════════════════════════════════════════════════
     PLAYER DEATH
  ════════════════════════════════════════════════════════════════════════════ */

  function killPlayer(cause) {
    if (_dead) return;
    _dead  = true;
    _phase = 'DEAD';
    if (_hud) {
      _hud.textContent = 'YOU DIED — ' + (cause === 'fall' ? 'FELL FROM THE SKY FORTRESS' : 'KILLED IN ACTION') +
        ' | Press S+F to restart';
      _hud.style.color = '#FF4444';
    }
    if (_countdownEl) _countdownEl.style.display = 'none';
  }

  /* ════════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var k = e.key;
    var now = Date.now();
    if (!_keys[k]) _keyTimestamps[k] = now;
    _keys[k] = true;

    /* S+F simultaneous activation */
    if (k === 'S' || k === 's') _sfPressTime['S'] = now;
    if (k === 'F' || k === 'f') _sfPressTime['F'] = now;
    if ((k === 'S' || k === 's' || k === 'F' || k === 'f')) {
      var dt = Math.abs(_sfPressTime['S'] - _sfPressTime['F']);
      if (dt < SF_WINDOW && _sfPressTime['S'] > 0 && _sfPressTime['F'] > 0) {
        if (!_active) {
          launch();
        } else {
          reset();
        }
        _sfPressTime['S'] = 0;
        _sfPressTime['F'] = 0;
      }
    }

    if (!_active || _dead) return;

    /* Elevator */
    if (k === 'e' || k === 'E') {
      if (_onGround && !_parachuting) tryElevator();
    }

    /* Grapple */
    if (k === 'g' || k === 'G') {
      if (!_parachuting) fireGrapple();
    }

    /* Space: escape parachute */
    if (k === ' ' || k === 'Space') {
      if (_escapingFortress && !_parachuting) {
        deployEscapeParachute();
      }
    }

    /* F key: shoot closest fuel tank (simplified shoot action) */
    if (k === 'q' || k === 'Q') {
      var closest = -1, closestDist = 12;
      for (var i = 0; i < _fuelTanks.length; i++) {
        if (!_fuelTanks[i].alive) continue;
        var ftWorld = _fuelTanks[i].mesh.position.clone();
        _platformGroup.localToWorld(ftWorld);
        var dx = ftWorld.x - _playerPos.x;
        var dy = ftWorld.y - _playerPos.y;
        var dz = ftWorld.z - _playerPos.z;
        var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      }
      if (closest >= 0) shootFuelTank(closest);
    }

    /* X: attack closest soldier */
    if (k === 'x' || k === 'X') {
      var closestSoldier = null, closestSDist = 8;
      for (var si = 0; si < _soldiers.length; si++) {
        var s = _soldiers[si];
        if (!s.alive) continue;
        var sdx = s.mesh.position.x - _playerPos.x;
        var sdy = s.mesh.position.y - _playerPos.y;
        var sdz = s.mesh.position.z - _playerPos.z;
        var sd = Math.sqrt(sdx*sdx + sdy*sdy + sdz*sdz);
        if (sd < closestSDist) { closestSDist = sd; closestSoldier = s; }
      }
      if (closestSoldier) {
        closestSoldier.hp -= 50;
        if (closestSoldier.hp <= 0) {
          closestSoldier.alive = false;
          _soldierAlive--;
          _scene.remove(closestSoldier.mesh);
        }
      }
    }

    /* Z: attack boss when adjacent */
    if (k === 'z' || k === 'Z') {
      if (_bossAlive && _boss) {
        var bdx = _boss.position.x - _playerPos.x;
        var bdy = _boss.position.y - _playerPos.y;
        var bdz = _boss.position.z - _playerPos.z;
        if (Math.sqrt(bdx*bdx + bdy*bdy + bdz*bdz) < 10) {
          _bossHP -= 50;
          if (_bossHP <= 0) {
            _bossAlive = false;
            _scene.remove(_boss);
            _boss = null;
          }
        }
      }
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
  }

  /* ════════════════════════════════════════════════════════════════════════════
     CAMERA FOLLOW
  ════════════════════════════════════════════════════════════════════════════ */

  function updateCamera() {
    if (!_camera) return;
    _camera.position.x += (_playerPos.x - _camera.position.x + 0) * 0.08;
    _camera.position.y += (_playerPos.y + 15 - _camera.position.y) * 0.08;
    _camera.position.z += (_playerPos.z + 25 - _camera.position.z) * 0.08;
    _camera.lookAt(_playerPos.x, _playerPos.y, _playerPos.z);
  }

  /* ════════════════════════════════════════════════════════════════════════════
     LEVEL TRACKING
  ════════════════════════════════════════════════════════════════════════════ */

  function updateLevelTracking() {
    var py = _playerPos.y;
    if (py >= 108) {
      _currentLevel = 'TOP-DECK';
    } else if (py >= 100) {
      _currentLevel = 'MID-DECK';
    } else {
      _currentLevel = 'DECK';
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     MAIN UPDATE
  ════════════════════════════════════════════════════════════════════════════ */

  function update(timestamp) {
    if (!_active) return;
    if (_lastTime === 0) _lastTime = timestamp;
    var dt = Math.min((timestamp - _lastTime) / 1000, 0.05);
    _lastTime     = timestamp;
    _elapsedTime += dt;

    if (_dead && !_escapingFortress) return;

    /* Wind */
    updateWind(dt);

    if (_parachuting && !_escapingFortress) {
      /* Arrival parachute phase */
      updateParachute(dt);
    } else if (_parachuting && _escapingFortress) {
      updateEscapeParachute(dt);
    } else {
      /* On platform */
      updateGroundMovement(dt);
      updateElevator(dt);
    }

    /* Check HP */
    if (_playerHP <= 0) {
      killPlayer('damage');
      return;
    }

    updateSoldiers(dt);
    updateSoldierBullets(dt);
    updateBoss(dt);
    updateStrafeJets(dt);
    updateStrafeBullets(dt);
    updateFuelTanks(dt);
    updatePlatformTilt(dt);
    updateExplosions(dt);
    checkVictoryConditions();
    updateDestroyCountdown(dt);
    updateLevelTracking();
    updateCamera();
    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
  }

  /* ── Public API ──────────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
