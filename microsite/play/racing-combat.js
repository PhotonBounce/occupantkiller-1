/* ───────────────────────────────────────────────────────────────────────────
   racing-combat.js — Racing Combat Mini-Game
   API: window.RacingCombat = { init, update, reset }
   Activation: R + C simultaneous keypress (both keys within 400ms)
   Controls:
     W          → accelerate
     S          → brake / reverse
     A / D      → steer left / right
     SPACE      → fire current weapon
   ─────────────────────────────────────────────────────────────────────────── */
window.RacingCombat = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation key tracking ───────────────────────────────────────────── */
  var _rTime = 0;
  var _cTime = 0;
  var _ACTIVATION_WINDOW = 400; // ms

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active       = false;
  var _score        = 0;
  var _lap          = 1;
  var _totalLaps    = 3;
  var _position     = 1;
  var _raceFinished = false;
  var _finishScore  = 0;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── Player vehicle ────────────────────────────────────────────────────── */
  var _playerBody    = null;
  var _playerWheels  = [];
  var _playerTurret  = null;
  var _playerHP      = 3;
  var _playerSpeed   = 0;
  var _maxSpeed      = 30;
  var _playerAngle   = 0;   // yaw radians
  var _steerAngle    = 0;
  var _playerPos     = null; // THREE.Vector3
  var _velocity      = null; // THREE.Vector3
  var _playerGroup   = null;
  var _bodyPanels    = [];
  var _pitStopTimer  = 0;
  var _inPitStop     = false;
  var _pitStopMesh   = null;
  var _empTimer      = 0;   // seconds remaining EMP stun
  var _spinoutTimer  = 0;   // seconds remaining spinout

  /* ── Weapon system ─────────────────────────────────────────────────────── */
  var _currentWeapon = 'none';  // 'none','shell','rocket','emp'
  var _shells        = [];
  var _shellCooldown = 0;

  /* ── Lap / checkpoint tracking ─────────────────────────────────────────── */
  var _checkpoints      = [];       // { x, z, radius }
  var _nextCheckpoint   = 0;
  var _lapProgress      = 0;        // 0..1 around track
  var _lastLapTime      = 0;
  var _finalSpeedBoost  = false;

  /* ── Track geometry ────────────────────────────────────────────────────── */
  var _trackSegments  = [];
  var _barriers       = [];
  var _ramps          = [];
  var _tunnel         = null;
  var _tunnelTurret   = null;
  var _craters        = [];
  var _pitStop        = null;

  /* ── Enemy racers ──────────────────────────────────────────────────────── */
  var _enemies = [];
  /* each enemy: { group, body, wheels, hp, speed, angle, pos, vel,
                   weapon, mines, rockets, empSpheres, oilSlicks,
                   lapProgress, lap, pitStopTimer, inPit } */

  /* ── Pickups ───────────────────────────────────────────────────────────── */
  var _pickups = [];  /* each: { mesh, type, collected } */

  /* ── Hazards ───────────────────────────────────────────────────────────── */
  var _mines       = [];  /* { mesh, owner } */
  var _rockets     = [];  /* { mesh, vel, owner } */
  var _empSpheres  = [];  /* { mesh, vel, owner } */
  var _oilSlicks   = [];  /* { mesh, owner } */
  var _bombs       = [];  /* { mesh, vel } helicopter bombs */
  var _civilianVehicles = [];  /* { mesh, speed, dir } */
  var _helicopter  = null;
  var _heliAngle   = 0;
  var _heliDropTimer = 0;

  /* ── HUD overlay ───────────────────────────────────────────────────────── */
  var _hudDiv = null;

  /* ── Timing ────────────────────────────────────────────────────────────── */
  var _lastTime = 0;
  var _raceTime = 0;

  /* ═══════════════════════════════════════════════════════════════════════
     TRACK LAYOUT — oval 80u long; segments along XZ plane
     Centre at (0,0,0); track runs in XZ plane; Y=0 is ground
  ═══════════════════════════════════════════════════════════════════════ */

  /* Oval waypoints for AI racing line (12 points) */
  var WAYPOINTS = [
    { x:  0,  z: -35 },
    { x: 14,  z: -33 },
    { x: 26,  z: -26 },
    { x: 34,  z: -14 },
    { x: 36,  z:   0 },
    { x: 34,  z:  14 },
    { x: 26,  z:  26 },
    { x: 14,  z:  33 },
    { x:  0,  z:  35 },
    { x:-14,  z:  33 },
    { x:-26,  z:  26 },
    { x:-34,  z:  14 },
    { x:-36,  z:   0 },
    { x:-34,  z: -14 },
    { x:-26,  z: -26 },
    { x:-14,  z: -33 }
  ];

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  function _THREE() { return window.THREE; }

  function _vec3(x, y, z) {
    return new (_THREE().Vector3)(x || 0, y || 0, z || 0);
  }

  function _dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _lerpAngle(a, b, t) {
    var d = b - a;
    while (d >  Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  function _makeMaterial(color, wireframe) {
    return new (_THREE().MeshLambertMaterial)({ color: color, wireframe: !!wireframe });
  }

  function _addMesh(geo, mat, parent, x, y, z) {
    var mesh = new (_THREE().Mesh)(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    (parent || _scene).add(mesh);
    return mesh;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     BUILD TRACK
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildTrack() {
    var T = _THREE();
    var trackMat = _makeMaterial(0x554433);
    var barrierMat = new T.LineBasicMaterial({ color: 0x888844 });
    var rampMat = _makeMaterial(0x664422);

    /* Straight sections */
    var straights = [
      { w:12, h:0.3, d:40, x: 36, y:-0.15, z:  0 },
      { w:12, h:0.3, d:40, x:-36, y:-0.15, z:  0 },
      { w:40, h:0.3, d:12, x:  0, y:-0.15, z: 36 },
      { w:40, h:0.3, d:12, x:  0, y:-0.15, z:-36 }
    ];
    var i;
    for (i = 0; i < straights.length; i++) {
      var s = straights[i];
      var seg = _addMesh(
        new T.BoxGeometry(s.w, s.h, s.d),
        trackMat, _scene, s.x, s.y, s.z
      );
      _trackSegments.push(seg);
    }

    /* Corner pieces */
    var corners = [
      { x: 28, z: 28 }, { x:-28, z: 28 },
      { x: 28, z:-28 }, { x:-28, z:-28 }
    ];
    for (i = 0; i < corners.length; i++) {
      var c = corners[i];
      var corner = _addMesh(
        new T.BoxGeometry(18, 0.3, 18),
        trackMat, _scene, c.x, -0.15, c.z
      );
      _trackSegments.push(corner);
    }

    /* Barriers (LineSegments around the oval) */
    function _addBarrierLine(pts) {
      var geo = new T.BufferGeometry().setFromPoints(pts);
      var line = new T.LineSegments(geo, barrierMat);
      _scene.add(line);
      _barriers.push(line);
    }
    var outerPts = [], innerPts = [];
    var numPts = 32;
    for (i = 0; i <= numPts; i++) {
      var ang = (i / numPts) * Math.PI * 2;
      outerPts.push(new T.Vector3(Math.sin(ang) * 48, 0.5, Math.cos(ang) * 48));
      innerPts.push(new T.Vector3(Math.sin(ang) * 24, 0.5, Math.cos(ang) * 24));
    }
    _addBarrierLine(outerPts);
    _addBarrierLine(innerPts);

    /* Ramps */
    var rampData = [
      { x: 36, y: 0,  z: -10, rx: -0.15 },
      { x:-36, y: 0,  z:  10, rx:  0.15 }
    ];
    for (i = 0; i < rampData.length; i++) {
      var r = rampData[i];
      var ramp = new T.Mesh(new T.BoxGeometry(10, 0.5, 6), rampMat);
      ramp.position.set(r.x, r.y, r.z);
      ramp.rotation.x = r.rx;
      _scene.add(ramp);
      _ramps.push(ramp);
    }

    /* Shortcut tunnel */
    var tunnelMat = _makeMaterial(0x334422);
    _tunnel = _addMesh(new T.BoxGeometry(4, 4, 20), tunnelMat, _scene, 0, 2, 0);
    /* Tunnel guardian turret */
    _tunnelTurret = _addMesh(
      new T.CylinderGeometry(0.4, 0.4, 0.8, 8),
      _makeMaterial(0x886622),
      _scene, 0, 4.5, -12
    );

    /* Explosion craters blocking lane */
    var craterMat = _makeMaterial(0x443322);
    var craterPositions = [
      { x: 28, z: 10 }, { x:-20, z:-28 }, { x: 10, z: 36 }
    ];
    for (i = 0; i < craterPositions.length; i++) {
      var cp = craterPositions[i];
      var crater = _addMesh(
        new T.BoxGeometry(4, 0.8, 4),
        craterMat, _scene, cp.x, 0.4, cp.z
      );
      _craters.push(crater);
    }

    /* Pit stop area */
    _pitStop = _addMesh(
      new T.BoxGeometry(8, 0.3, 8),
      _makeMaterial(0x445544),
      _scene, -40, -0.15, -20
    );

    /* Checkpoints */
    _checkpoints = [];
    for (i = 0; i < WAYPOINTS.length; i++) {
      _checkpoints.push({ x: WAYPOINTS[i].x, z: WAYPOINTS[i].z, radius: 10 });
    }

    /* Civilian vehicles */
    var civMat = _makeMaterial(0x887766);
    var civPositions = [
      { x: 36, z: 5, dir: 1 }, { x:-36, z:-5, dir: -1 }
    ];
    for (i = 0; i < civPositions.length; i++) {
      var cv = civPositions[i];
      var civMesh = _addMesh(
        new T.BoxGeometry(3, 1.2, 2),
        civMat, _scene, cv.x, 0.6, cv.z
      );
      _civilianVehicles.push({ mesh: civMesh, speed: 8, dir: cv.dir });
    }

    /* Helicopter */
    _helicopter = _addMesh(
      new T.CylinderGeometry(2, 2, 1, 8),
      _makeMaterial(0x334433),
      _scene, 0, 15, 0
    );
    _heliAngle = 0;
    _heliDropTimer = 0;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     BUILD PLAYER VEHICLE
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildPlayer() {
    var T = _THREE();
    _playerGroup = new T.Group();
    _scene.add(_playerGroup);

    /* Body */
    _playerBody = new T.Mesh(
      new T.BoxGeometry(4, 1.5, 2.5),
      _makeMaterial(0x334455)
    );
    _playerBody.position.set(0, 0.75, 0);
    _playerGroup.add(_playerBody);

    /* Body panels (damage visualization) */
    _bodyPanels = [];
    var panelMat = _makeMaterial(0x334455);
    var panelPositions = [
      { x: 2, y: 0.75, z: 0 },
      { x:-2, y: 0.75, z: 0 },
      { x: 0, y: 0.75, z: 1.25 }
    ];
    for (var pi = 0; pi < panelPositions.length; pi++) {
      var pp = panelPositions[pi];
      var panel = new T.Mesh(
        new T.BoxGeometry(0.2, 0.8, 1.2),
        new T.MeshLambertMaterial({ color: 0x334455 })
      );
      panel.position.set(pp.x, pp.y, pp.z);
      _playerGroup.add(panel);
      _bodyPanels.push(panel);
    }

    /* Wheels */
    _playerWheels = [];
    var wheelMat = _makeMaterial(0x222222);
    var wheelPositions = [
      { x: 2,  y: 0.5, z:  1.4 },
      { x: 2,  y: 0.5, z: -1.4 },
      { x:-2,  y: 0.5, z:  1.4 },
      { x:-2,  y: 0.5, z: -1.4 }
    ];
    for (var wi = 0; wi < wheelPositions.length; wi++) {
      var wp = wheelPositions[wi];
      var wheel = new T.Mesh(
        new T.CylinderGeometry(0.5, 0.5, 0.4, 8),
        wheelMat
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp.x, wp.y, wp.z);
      _playerGroup.add(wheel);
      _playerWheels.push(wheel);
    }

    /* Turret */
    _playerTurret = new T.Mesh(
      new T.CylinderGeometry(0.4, 0.4, 0.3, 8),
      _makeMaterial(0x445566)
    );
    _playerTurret.position.set(0, 1.8, 0);
    _playerGroup.add(_playerTurret);

    /* Initial position */
    _playerPos = _vec3(0, 0, -30);
    _velocity  = _vec3(0, 0, 0);
    _playerAngle = 0;
    _playerGroup.position.copy(_playerPos);
    _playerHP = 3;
    _playerSpeed = 0;
    _nextCheckpoint = 0;
    _lap = 1;
    _lapProgress = 0;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     BUILD ENEMIES
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildEnemies() {
    var T = _THREE();
    var configs = [
      { color: 0x553322, weapon: 'mines' },
      { color: 0x882222, weapon: 'rockets' },
      { color: 0x334422, weapon: 'emp' },
      { color: 0x553322, weapon: 'oil' },
      { color: 0x882222, weapon: 'ram' }
    ];
    var startOffset = [
      { x: 4,  z:-30 },
      { x:-4,  z:-30 },
      { x: 8,  z:-26 },
      { x:-8,  z:-26 },
      { x: 0,  z:-26 }
    ];

    for (var ei = 0; ei < configs.length; ei++) {
      var cfg = configs[ei];
      var grp = new T.Group();
      _scene.add(grp);

      var body = new T.Mesh(
        new T.BoxGeometry(4, 1.5, 2.5),
        _makeMaterial(cfg.color)
      );
      body.position.set(0, 0.75, 0);
      grp.add(body);

      var wheelMat2 = _makeMaterial(0x222222);
      var wPositions = [
        { x: 2, y: 0.5, z:  1.4 },
        { x: 2, y: 0.5, z: -1.4 },
        { x:-2, y: 0.5, z:  1.4 },
        { x:-2, y: 0.5, z: -1.4 }
      ];
      var eWheels = [];
      for (var ewi = 0; ewi < wPositions.length; ewi++) {
        var ewp = wPositions[ewi];
        var eWheel = new T.Mesh(
          new T.CylinderGeometry(0.5, 0.5, 0.4, 8),
          wheelMat2
        );
        eWheel.rotation.z = Math.PI / 2;
        eWheel.position.set(ewp.x, ewp.y, ewp.z);
        grp.add(eWheel);
        eWheels.push(eWheel);
      }

      var eTurret = new T.Mesh(
        new T.CylinderGeometry(0.4, 0.4, 0.3, 8),
        _makeMaterial(0x445566)
      );
      eTurret.position.set(0, 1.8, 0);
      grp.add(eTurret);

      var so = startOffset[ei];
      grp.position.set(so.x, 0, so.z);

      var enemy = {
        group:       grp,
        body:        body,
        wheels:      eWheels,
        turret:      eTurret,
        hp:          3,
        speed:       18 + Math.random() * 4,
        angle:       0,
        pos:         _vec3(so.x, 0, so.z),
        vel:         _vec3(0, 0, 0),
        weapon:      cfg.weapon,
        lapProgress: 0 - (ei + 1) * 0.05,
        lap:         1,
        pitStopTimer:0,
        inPit:       false,
        weaponTimer: 3 + Math.random() * 5,
        wpIndex:     ei % WAYPOINTS.length
      };
      _enemies.push(enemy);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     BUILD PICKUPS
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildPickups() {
    var T = _THREE();
    var types = ['shell', 'rocket', 'emp'];
    var colors = { shell: 0x44FF44, rocket: 0xFF4400, emp: 0x4444FF };
    var positions = [
      { x: 36, z:  15 },
      { x:-36, z: -15 },
      { x:  0, z:  36 },
      { x:  0, z: -36 },
      { x: 22, z:  22 },
      { x:-22, z: -22 }
    ];
    for (var pi = 0; pi < positions.length; pi++) {
      var ptype = types[pi % types.length];
      var pp = positions[pi];
      var pmesh = _addMesh(
        new T.BoxGeometry(1.5, 1.5, 1.5),
        _makeMaterial(colors[ptype]),
        _scene, pp.x, 1, pp.z
      );
      _pickups.push({ mesh: pmesh, type: ptype, collected: false });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     BUILD LIGHTS
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildLights() {
    var T = _THREE();
    var ambient = new T.AmbientLight(0x404040, 1.5);
    _scene.add(ambient);
    var dir = new T.DirectionalLight(0xffffff, 1);
    dir.position.set(20, 40, 20);
    _scene.add(dir);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildHUD() {
    if (_hudDiv) return;
    _hudDiv = document.createElement('div');
    _hudDiv.id = 'racing-combat-hud';
    _hudDiv.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#eef',
      'font:bold 14px monospace',
      'padding:6px 14px',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudDiv);
  }

  function _updateHUD() {
    if (!_hudDiv) return;
    var leaderAhead = _leaderGap();
    var speedDisplay = Math.round(Math.abs(_playerSpeed * 10)) / 10;
    _hudDiv.textContent =
      'RACE [LAP: ' + _lap + '/' + _totalLaps + '] ' +
      '[POSITION: ' + _position + '/6] ' +
      '[WEAPON: ' + _currentWeapon + '] ' +
      '[HP: ' + _playerHP + '/3] ' +
      '[SPEED: ' + speedDisplay + 'u/s] | ' +
      'LEADER: ' + leaderAhead + ' sec ahead';
  }

  function _leaderGap() {
    /* Find best lap progress among enemies; compute time gap estimate */
    var best = 0;
    for (var i = 0; i < _enemies.length; i++) {
      var ep = _enemies[i].lap + _enemies[i].lapProgress;
      if (ep > best) best = ep;
    }
    var myProg = _lap + _lapProgress;
    var gap = best - myProg;
    if (gap < 0) gap = 0;
    return (Math.round(gap * 100) / 10).toFixed(1);
  }

  function _removeHUD() {
    if (_hudDiv && _hudDiv.parentNode) {
      _hudDiv.parentNode.removeChild(_hudDiv);
    }
    _hudDiv = null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     INPUT
  ═══════════════════════════════════════════════════════════════════════ */
  function _onKeyDown(e) {
    var k = e.key.toLowerCase();
    _keys[k] = true;

    var now = Date.now();
    if (k === 'r') _rTime = now;
    if (k === 'c') _cTime = now;

    if (!_active && Math.abs(_rTime - _cTime) < _ACTIVATION_WINDOW && _rTime && _cTime) {
      _start();
      return;
    }

    if (!_active) return;

    if (k === ' ') {
      e.preventDefault();
      _fireWeapon();
    }
  }

  function _onKeyUp(e) {
    _keys[e.key.toLowerCase()] = false;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     WEAPON FIRE
  ═══════════════════════════════════════════════════════════════════════ */
  function _fireWeapon() {
    if (_shellCooldown > 0) return;
    if (_currentWeapon === 'none') {
      /* Auto-aim turret fires basic shell */
      _spawnShell(_playerPos, _playerAngle, null);
      _shellCooldown = 0.8;
    } else if (_currentWeapon === 'shell') {
      _spawnShell(_playerPos, _playerAngle, null);
      _shellCooldown = 0.8;
      _currentWeapon = 'none';
    } else if (_currentWeapon === 'rocket') {
      _spawnRocket(_playerPos, _playerAngle, null);
      _shellCooldown = 1.2;
      _currentWeapon = 'none';
    } else if (_currentWeapon === 'emp') {
      _spawnEMP(_playerPos, null);
      _shellCooldown = 2.0;
      _currentWeapon = 'none';
    }
  }

  function _spawnShell(fromPos, angle, owner) {
    var T = _THREE();
    var shell = new T.Mesh(
      new T.SphereGeometry(0.25, 6, 6),
      _makeMaterial(0xFFCC00)
    );
    var spd = 50;
    shell.position.set(fromPos.x, 1.5, fromPos.z);
    _scene.add(shell);
    _shells.push({
      mesh:  shell,
      vel:   _vec3(-Math.sin(angle) * spd, 0, -Math.cos(angle) * spd),
      owner: owner,
      life:  3
    });
  }

  function _spawnRocket(fromPos, angle, owner) {
    var T = _THREE();
    var rocket = new T.Mesh(
      new T.CylinderGeometry(0.15, 0.15, 0.8, 6),
      _makeMaterial(0x888844)
    );
    rocket.position.set(fromPos.x, 1.5, fromPos.z);
    rocket.rotation.z = Math.PI / 2;
    _scene.add(rocket);
    _rockets.push({
      mesh:  rocket,
      vel:   _vec3(-Math.sin(angle) * 60, 0, -Math.cos(angle) * 60),
      owner: owner,
      life:  4
    });
  }

  function _spawnEMP(fromPos, owner) {
    var T = _THREE();
    var empMesh = new T.Mesh(
      new T.SphereGeometry(1, 8, 8),
      new T.MeshLambertMaterial({ color: 0x4444FF, transparent: true, opacity: 0.7 })
    );
    empMesh.position.set(fromPos.x, 1.5, fromPos.z);
    _scene.add(empMesh);
    _empSpheres.push({
      mesh:  empMesh,
      vel:   _vec3(0, 0, 0),
      owner: owner,
      life:  0.5,
      radius: 12
    });
  }

  function _spawnMine(fromPos, owner) {
    var T = _THREE();
    var mine = new T.Mesh(
      new T.CylinderGeometry(0.6, 0.6, 0.3, 6),
      _makeMaterial(0xFF2200)
    );
    mine.position.set(fromPos.x, 0.15, fromPos.z);
    _scene.add(mine);
    _mines.push({ mesh: mine, owner: owner });
  }

  function _spawnOilSlick(fromPos, owner) {
    var T = _THREE();
    var oil = new T.Mesh(
      new T.BoxGeometry(3, 0.05, 3),
      new T.MeshLambertMaterial({ color: 0x222222, transparent: true, opacity: 0.8 })
    );
    oil.position.set(fromPos.x, 0.05, fromPos.z);
    _scene.add(oil);
    _oilSlicks.push({ mesh: oil, owner: owner, life: 20 });
  }

  function _spawnBomb(fromPos) {
    var T = _THREE();
    var bomb = new T.Mesh(
      new T.SphereGeometry(0.4, 6, 6),
      _makeMaterial(0x220000)
    );
    bomb.position.set(fromPos.x, fromPos.y, fromPos.z);
    _scene.add(bomb);
    _bombs.push({ mesh: bomb, vel: _vec3(0, -8, 0), life: 3 });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     START / RESET
  ═══════════════════════════════════════════════════════════════════════ */
  function _start() {
    if (_active) return;
    _active = true;
    _score = 0;
    _lap = 1;
    _position = 1;
    _raceFinished = false;
    _finishScore = 0;
    _raceTime = 0;
    _lastLapTime = 0;
    _finalSpeedBoost = false;
    _empTimer = 0;
    _spinoutTimer = 0;
    _currentWeapon = 'none';
    _shellCooldown = 0;
    _shells = [];
    _rockets = [];
    _empSpheres = [];
    _mines = [];
    _oilSlicks = [];
    _bombs = [];
    _enemies = [];
    _pickups = [];

    _buildLights();
    _buildTrack();
    _buildPlayer();
    _buildEnemies();
    _buildPickups();
    _buildHUD();

    /* Camera setup */
    if (_camera) {
      _camera.position.set(0, 20, -50);
      _camera.lookAt(0, 0, 0);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PLAYER UPDATE
  ═══════════════════════════════════════════════════════════════════════ */
  function _updatePlayer(dt) {
    if (_inPitStop) {
      _pitStopTimer -= dt;
      if (_pitStopTimer <= 0) {
        _inPitStop = false;
        _playerHP = 3;
        _updatePanelColors();
      }
      return;
    }

    if (_empTimer > 0) {
      _empTimer -= dt;
      /* No controls during EMP */
      _applyFriction(dt);
      _movePlayer(dt);
      return;
    }

    var accel = 0;
    var steerInput = 0;

    if (_keys['w']) accel = 1;
    if (_keys['s']) accel = -0.6;
    if (_keys['a']) steerInput = 1;
    if (_keys['d']) steerInput = -1;

    /* Speed boost on final lap */
    var topSpeed = _maxSpeed;
    if (_finalSpeedBoost) topSpeed = _maxSpeed * 1.2;

    /* Spinout overrides steering */
    if (_spinoutTimer > 0) {
      _spinoutTimer -= dt;
      steerInput = 3;
      accel = accel * 0.3;
    }

    /* Acceleration */
    if (accel > 0) {
      _playerSpeed += accel * 20 * dt;
      if (_playerSpeed > topSpeed) _playerSpeed = topSpeed;
    } else if (accel < 0) {
      _playerSpeed += accel * 15 * dt;
      if (_playerSpeed < -topSpeed * 0.4) _playerSpeed = -topSpeed * 0.4;
    }

    /* Steering */
    if (Math.abs(_playerSpeed) > 0.5) {
      _playerAngle += steerInput * 1.8 * dt * (_playerSpeed > 0 ? 1 : -1);
    }

    /* Friction */
    _applyFriction(dt);
    _movePlayer(dt);

    /* Spin wheels */
    for (var wi = 0; wi < _playerWheels.length; wi++) {
      _playerWheels[wi].rotation.y += _playerSpeed * dt * 0.5;
    }

    /* Auto-aim turret toward nearest enemy in 15u range */
    _autoAimTurret();

    /* Shell cooldown */
    if (_shellCooldown > 0) _shellCooldown -= dt;
  }

  function _applyFriction(dt) {
    var friction = 0.92;
    _playerSpeed *= Math.pow(friction, dt * 60);
    if (Math.abs(_playerSpeed) < 0.05) _playerSpeed = 0;
  }

  function _movePlayer(dt) {
    /* Momentum-based drift */
    var targetVelX = -Math.sin(_playerAngle) * _playerSpeed;
    var targetVelZ = -Math.cos(_playerAngle) * _playerSpeed;
    var driftFactor = 0.85;
    _velocity.x = _velocity.x * driftFactor + targetVelX * (1 - driftFactor);
    _velocity.z = _velocity.z * driftFactor + targetVelZ * (1 - driftFactor);

    _playerPos.x += _velocity.x * dt;
    _playerPos.z += _velocity.z * dt;

    /* Keep on ground */
    _playerPos.y = 0;

    _playerGroup.position.copy(_playerPos);
    _playerGroup.rotation.y = _playerAngle;
  }

  function _autoAimTurret() {
    var nearest = null;
    var nearDist = 15;
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      var d = _dist2(_playerPos, e.pos);
      if (d < nearDist) {
        nearDist = d;
        nearest = e;
      }
    }
    if (nearest && _playerTurret) {
      var dx = nearest.pos.x - _playerPos.x;
      var dz = nearest.pos.z - _playerPos.z;
      var aimAngle = Math.atan2(-dx, -dz);
      _playerTurret.rotation.y = aimAngle - _playerAngle;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ENEMY UPDATE
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateEnemies(dt) {
    for (var i = 0; i < _enemies.length; i++) {
      _updateSingleEnemy(_enemies[i], i, dt);
    }
  }

  function _updateSingleEnemy(e, idx, dt) {
    if (e.inPit) {
      e.pitStopTimer -= dt;
      if (e.pitStopTimer <= 0) {
        e.inPit = false;
        e.hp = 3;
      }
      return;
    }

    /* Follow racing line with variance */
    var wpIdx = e.wpIndex || 0;
    var wp = WAYPOINTS[wpIdx % WAYPOINTS.length];
    var dx = wp.x - e.pos.x;
    var dz = wp.z - e.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 4) {
      e.wpIndex = (wpIdx + 1) % WAYPOINTS.length;
      if (e.wpIndex === 0) {
        e.lap++;
        e.lapProgress = 0;
        if (e.lap > _totalLaps && !_raceFinished) {
          /* Enemy finished */
        }
      }
    }

    /* Variance in racing line */
    var variance = (Math.sin(_raceTime * 0.3 + idx) * 2);
    var targetAngle = Math.atan2(-(dx + variance), -(dz + variance));
    e.angle = _lerpAngle(e.angle, targetAngle, dt * 3);

    /* Speed */
    var eSpeed = e.speed;
    if (e.lap === _totalLaps) eSpeed *= 1.1; /* Final lap boost */

    e.vel.x = -Math.sin(e.angle) * eSpeed;
    e.vel.z = -Math.cos(e.angle) * eSpeed;
    e.pos.x += e.vel.x * dt;
    e.pos.z += e.vel.z * dt;
    e.pos.y  = 0;

    e.group.position.copy(e.pos);
    e.group.rotation.y = e.angle;

    /* Lap progress estimate */
    e.lapProgress = (e.wpIndex || 0) / WAYPOINTS.length;

    /* Weapon firing */
    e.weaponTimer -= dt;
    if (e.weaponTimer <= 0) {
      e.weaponTimer = 4 + Math.random() * 6;
      _enemyFireWeapon(e);
    }

    /* Spin wheels */
    for (var wi = 0; wi < e.wheels.length; wi++) {
      e.wheels[wi].rotation.y += eSpeed * dt * 0.5;
    }
  }

  function _enemyFireWeapon(e) {
    if (e.weapon === 'mines') {
      _spawnMine(e.pos, e);
    } else if (e.weapon === 'rockets') {
      _spawnRocket(e.pos, e.angle + Math.PI, e);
    } else if (e.weapon === 'emp') {
      _spawnEMP(e.pos, e);
    } else if (e.weapon === 'oil') {
      _spawnOilSlick(e.pos, e);
    } else if (e.weapon === 'ram') {
      /* Ram — just speed boost, handled via collision below */
      e.speed = Math.min(e.speed * 1.3, 40);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PROJECTILE UPDATE
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateProjectiles(dt) {
    var i;

    /* Shells */
    for (i = _shells.length - 1; i >= 0; i--) {
      var sh = _shells[i];
      sh.life -= dt;
      sh.mesh.position.x += sh.vel.x * dt;
      sh.mesh.position.z += sh.vel.z * dt;

      var hit = false;
      /* Check vs enemies if player fired */
      if (!sh.owner) {
        for (var ei = 0; ei < _enemies.length; ei++) {
          var e = _enemies[ei];
          if (_dist2(sh.mesh.position, e.pos) < 2.5) {
            _damageEnemy(e, 1);
            hit = true;
            break;
          }
        }
      } else {
        /* Enemy fired — check vs player */
        if (_dist2(sh.mesh.position, _playerPos) < 2.5) {
          _damagePlayer(1);
          hit = true;
        }
      }

      if (hit || sh.life <= 0) {
        _scene.remove(sh.mesh);
        _shells.splice(i, 1);
      }
    }

    /* Rockets */
    for (i = _rockets.length - 1; i >= 0; i--) {
      var rk = _rockets[i];
      rk.life -= dt;
      rk.mesh.position.x += rk.vel.x * dt;
      rk.mesh.position.z += rk.vel.z * dt;

      var rkHit = false;
      if (!rk.owner) {
        for (var rki = 0; rki < _enemies.length; rki++) {
          if (_dist2(rk.mesh.position, _enemies[rki].pos) < 3) {
            _damageEnemy(_enemies[rki], 2);
            rkHit = true;
            break;
          }
        }
      } else {
        if (_dist2(rk.mesh.position, _playerPos) < 3) {
          _damagePlayer(2);
          rkHit = true;
        }
      }

      if (rkHit || rk.life <= 0) {
        _scene.remove(rk.mesh);
        _rockets.splice(i, 1);
      }
    }

    /* EMP spheres */
    for (i = _empSpheres.length - 1; i >= 0; i--) {
      var emp = _empSpheres[i];
      emp.life -= dt;
      /* Scale up then fade */
      var scale = 1 + (0.5 - emp.life) * 4;
      if (scale > 0) emp.mesh.scale.setScalar(scale);

      /* Hit check */
      if (!emp.owner) {
        /* Player fired */
        for (var empi = 0; empi < _enemies.length; empi++) {
          if (_dist2(emp.mesh.position, _enemies[empi].pos) < emp.radius) {
            _enemies[empi].speed *= 0.3; /* slow enemy */
          }
        }
      } else {
        /* Enemy fired at player */
        if (_dist2(emp.mesh.position, _playerPos) < emp.radius) {
          _empTimer = Math.max(_empTimer, 3);
        }
      }

      if (emp.life <= 0) {
        _scene.remove(emp.mesh);
        _empSpheres.splice(i, 1);
      }
    }

    /* Mines */
    for (i = _mines.length - 1; i >= 0; i--) {
      var mn = _mines[i];
      var mineTriggered = false;

      if (!mn.owner) {
        /* Player dropped — check enemies */
        for (var mni = 0; mni < _enemies.length; mni++) {
          if (_dist2(mn.mesh.position, _enemies[mni].pos) < 2) {
            _damageEnemy(_enemies[mni], 1);
            mineTriggered = true;
            break;
          }
        }
      } else {
        if (_dist2(mn.mesh.position, _playerPos) < 2) {
          _damagePlayer(1);
          mineTriggered = true;
        }
      }

      if (mineTriggered) {
        _scene.remove(mn.mesh);
        _mines.splice(i, 1);
      }
    }

    /* Oil slicks */
    for (i = _oilSlicks.length - 1; i >= 0; i--) {
      var oil = _oilSlicks[i];
      oil.life -= dt;

      if (!oil.owner) {
        for (var oi = 0; oi < _enemies.length; oi++) {
          if (_dist2(oil.mesh.position, _enemies[oi].pos) < 2.5) {
            _enemies[oi].speed = Math.max(_enemies[oi].speed * 0.5, 5);
          }
        }
      } else {
        if (_dist2(oil.mesh.position, _playerPos) < 2.5) {
          _spinoutTimer = Math.max(_spinoutTimer, 2.5);
        }
      }

      if (oil.life <= 0) {
        _scene.remove(oil.mesh);
        _oilSlicks.splice(i, 1);
      }
    }

    /* Bombs */
    for (i = _bombs.length - 1; i >= 0; i--) {
      var bm = _bombs[i];
      bm.life -= dt;
      bm.mesh.position.y += bm.vel.y * dt;

      if (bm.mesh.position.y <= 0 || bm.life <= 0) {
        /* Explode: check player */
        if (_dist2(bm.mesh.position, _playerPos) < 4) {
          _damagePlayer(1);
        }
        _scene.remove(bm.mesh);
        _bombs.splice(i, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DAMAGE
  ═══════════════════════════════════════════════════════════════════════ */
  function _damagePlayer(amount) {
    if (_inPitStop) return;
    _playerHP -= amount;
    if (_playerHP < 0) _playerHP = 0;
    _updatePanelColors();
    if (_playerHP <= 0) {
      _inPitStop = true;
      _pitStopTimer = 5;
      _playerSpeed = 0;
      /* Force player to pit */
      _playerPos.x = -40;
      _playerPos.z = -20;
    }
  }

  function _damageEnemy(e, amount) {
    e.hp -= amount;
    if (e.hp < 0) e.hp = 0;
    /* Tint body red as damage */
    if (e.body && e.body.material) {
      e.body.material.color.setHex(0xAA0000);
    }
    if (e.hp <= 0) {
      e.inPit = true;
      e.pitStopTimer = 5;
      e.speed = 0;
      /* Force to pit */
      e.pos.x = -44;
      e.pos.z = -20;
    }
  }

  function _updatePanelColors() {
    var colors = [0x334455, 0x885533, 0xAA2200];
    var dmg = 3 - _playerHP;
    for (var pi = 0; pi < _bodyPanels.length; pi++) {
      if (pi < dmg) {
        _bodyPanels[pi].material.color.setHex(0x221100);
      } else {
        _bodyPanels[pi].material.color.setHex(0x334455);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PICKUPS
  ═══════════════════════════════════════════════════════════════════════ */
  function _updatePickups(dt) {
    for (var i = 0; i < _pickups.length; i++) {
      var pk = _pickups[i];
      if (pk.collected) continue;
      pk.mesh.rotation.y += dt * 2;
      pk.mesh.position.y = 1 + Math.sin(_raceTime * 2 + i) * 0.2;

      if (_dist2(pk.mesh.position, _playerPos) < 2.5) {
        pk.collected = true;
        _currentWeapon = pk.type;
        pk.mesh.visible = false;
        /* Respawn after 10s */
        (function(pkRef) {
          setTimeout(function() {
            pkRef.collected = false;
            pkRef.mesh.visible = true;
            var types = ['shell', 'rocket', 'emp'];
            pkRef.type = types[Math.floor(Math.random() * types.length)];
            var colors = { shell: 0x44FF44, rocket: 0xFF4400, emp: 0x4444FF };
            pkRef.mesh.material.color.setHex(colors[pkRef.type]);
          }, 10000);
        }(pk));
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CHECKPOINT / LAP TRACKING
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateLapTracking() {
    var cp = _checkpoints[_nextCheckpoint];
    if (!cp) return;

    var d = _dist2(_playerPos, { x: cp.x, z: cp.z });
    if (d < cp.radius) {
      _nextCheckpoint++;
      if (_nextCheckpoint >= _checkpoints.length) {
        _nextCheckpoint = 0;
        _lapProgress = 0;
        _lap++;
        if (_lap === _totalLaps && !_finalSpeedBoost) {
          _finalSpeedBoost = true;
          _maxSpeed = 36; /* +20% */
        }
        if (_lap > _totalLaps) {
          _finishRace();
        }
      } else {
        _lapProgress = _nextCheckpoint / _checkpoints.length;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     POSITION TRACKING
  ═══════════════════════════════════════════════════════════════════════ */
  function _updatePositions() {
    var myProgress = (_lap - 1) + _lapProgress;
    var ahead = 0;
    for (var i = 0; i < _enemies.length; i++) {
      var ep = (_enemies[i].lap - 1) + _enemies[i].lapProgress;
      if (ep > myProgress) ahead++;
    }
    _position = ahead + 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HAZARDS UPDATE
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateHazards(dt) {
    /* Civilian vehicles patrolling */
    for (var ci = 0; ci < _civilianVehicles.length; ci++) {
      var cv = _civilianVehicles[ci];
      cv.mesh.position.z += cv.speed * cv.dir * dt;
      if (Math.abs(cv.mesh.position.z) > 25) {
        cv.dir *= -1;
      }
      /* If player hits civilian */
      if (_dist2(cv.mesh.position, _playerPos) < 3) {
        _damagePlayer(1);
        _playerSpeed *= 0.3;
      }
    }

    /* Helicopter circling and dropping bombs on leaders */
    _heliAngle += dt * 0.4;
    if (_helicopter) {
      _helicopter.position.x = Math.sin(_heliAngle) * 30;
      _helicopter.position.z = Math.cos(_heliAngle) * 30;
      _helicopter.rotation.y = _heliAngle;
    }

    /* Drop bombs on leaders (position 1 or 2) */
    if (_position <= 2) {
      _heliDropTimer -= dt;
      if (_heliDropTimer <= 0 && _helicopter) {
        _heliDropTimer = 4 + Math.random() * 3;
        /* Drop bomb toward player if nearby */
        var heliDist = _dist2(_helicopter.position, _playerPos);
        if (heliDist < 40) {
          _spawnBomb({
            x: _helicopter.position.x,
            y: _helicopter.position.y,
            z: _helicopter.position.z
          });
        }
      }
    }

    /* Tunnel turret fires at player if near tunnel */
    if (_tunnelTurret) {
      var tunnelDist = _dist2(_playerPos, { x: 0, z: 0 });
      if (tunnelDist < 15 && Math.random() < 0.01) {
        _spawnShell(
          { x: _tunnelTurret.position.x, z: _tunnelTurret.position.z },
          Math.atan2(-(_playerPos.x - _tunnelTurret.position.x),
                     -(_playerPos.z - _tunnelTurret.position.z)),
          { isTurret: true }
        );
      }
    }

    /* Ram check — enemy 5 (ram weapon) rams player */
    for (var ri = 0; ri < _enemies.length; ri++) {
      if (_enemies[ri].weapon === 'ram') {
        var ramDist = _dist2(_enemies[ri].pos, _playerPos);
        if (ramDist < 3) {
          _damagePlayer(1);
          _playerSpeed -= 10;
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CAMERA FOLLOW
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateCamera() {
    if (!_camera) return;
    var behind = 12;
    var above  = 8;
    var cx = _playerPos.x + Math.sin(_playerAngle) * behind;
    var cz = _playerPos.z + Math.cos(_playerAngle) * behind;
    _camera.position.x += (cx - _camera.position.x) * 0.1;
    _camera.position.y += (above - _camera.position.y) * 0.1;
    _camera.position.z += (cz - _camera.position.z) * 0.1;
    _camera.lookAt(_playerPos.x, 0.5, _playerPos.z);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     FINISH
  ═══════════════════════════════════════════════════════════════════════ */
  function _finishRace() {
    if (_raceFinished) return;
    _raceFinished = true;
    var scores = [3000, 2000, 1000, 500, 500, 500];
    _finishScore = scores[Math.min(_position - 1, scores.length - 1)];
    _score += _finishScore;

    if (_hudDiv) {
      _hudDiv.textContent = 'RACE FINISHED! Position: ' + _position +
        '/6 | Score: ' + _score + ' | ' +
        (_position === 1 ? '1ST PLACE!' :
         _position === 2 ? '2ND PLACE!' :
         _position === 3 ? '3RD PLACE!' : 'FINISHED');
    }

    /* Broadcast score */
    if (window.GameManager && typeof window.GameManager.addScore === 'function') {
      window.GameManager.addScore(_score);
    }

    setTimeout(function() { _reset(); }, 6000);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CLEANUP
  ═══════════════════════════════════════════════════════════════════════ */
  function _cleanup() {
    /* Remove all game objects from scene */
    var removeList = [];
    var i;

    if (_playerGroup) removeList.push(_playerGroup);
    if (_tunnel) removeList.push(_tunnel);
    if (_tunnelTurret) removeList.push(_tunnelTurret);
    if (_pitStop) removeList.push(_pitStop);
    if (_helicopter) removeList.push(_helicopter);

    for (i = 0; i < _trackSegments.length; i++)  removeList.push(_trackSegments[i]);
    for (i = 0; i < _barriers.length; i++)        removeList.push(_barriers[i]);
    for (i = 0; i < _ramps.length; i++)           removeList.push(_ramps[i]);
    for (i = 0; i < _craters.length; i++)         removeList.push(_craters[i]);
    for (i = 0; i < _enemies.length; i++)         removeList.push(_enemies[i].group);
    for (i = 0; i < _pickups.length; i++)         removeList.push(_pickups[i].mesh);
    for (i = 0; i < _mines.length; i++)           removeList.push(_mines[i].mesh);
    for (i = 0; i < _rockets.length; i++)         removeList.push(_rockets[i].mesh);
    for (i = 0; i < _empSpheres.length; i++)      removeList.push(_empSpheres[i].mesh);
    for (i = 0; i < _oilSlicks.length; i++)       removeList.push(_oilSlicks[i].mesh);
    for (i = 0; i < _bombs.length; i++)           removeList.push(_bombs[i].mesh);
    for (i = 0; i < _shells.length; i++)          removeList.push(_shells[i].mesh);
    for (i = 0; i < _civilianVehicles.length; i++) removeList.push(_civilianVehicles[i].mesh);

    for (i = 0; i < removeList.length; i++) {
      if (removeList[i] && _scene) _scene.remove(removeList[i]);
    }

    _playerGroup = null;
    _playerBody = null;
    _playerWheels = [];
    _playerTurret = null;
    _bodyPanels = [];
    _tunnel = null;
    _tunnelTurret = null;
    _pitStop = null;
    _helicopter = null;
    _trackSegments = [];
    _barriers = [];
    _ramps = [];
    _craters = [];
    _enemies = [];
    _pickups = [];
    _mines = [];
    _rockets = [];
    _empSpheres = [];
    _oilSlicks = [];
    _bombs = [];
    _shells = [];
    _civilianVehicles = [];
  }

  function _reset() {
    _cleanup();
    _removeHUD();
    _active = false;
    _rTime = 0;
    _cTime = 0;
    _score = 0;
    _playerHP = 3;
    _playerSpeed = 0;
    _playerAngle = 0;
    _lap = 1;
    _position = 1;
    _raceFinished = false;
    _maxSpeed = 30;
    _finalSpeedBoost = false;
    _empTimer = 0;
    _spinoutTimer = 0;
    _currentWeapon = 'none';
    _shellCooldown = 0;
    _nextCheckpoint = 0;
    _lapProgress = 0;
    _heliAngle = 0;
    _heliDropTimer = 0;
    _raceTime = 0;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════ */
  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _lastTime = performance.now();
  }

  function update(timestamp) {
    if (!_active) return;

    var dt = Math.min((timestamp - _lastTime) / 1000, 0.05);
    _lastTime = timestamp;
    _raceTime += dt;

    if (_raceFinished) {
      _updateHUD();
      return;
    }

    _updatePlayer(dt);
    _updateEnemies(dt);
    _updateProjectiles(dt);
    _updatePickups(dt);
    _updateLapTracking();
    _updatePositions();
    _updateHazards(dt);
    _updateCamera();
    _updateHUD();
  }

  function reset() {
    _reset();
  }

  return { init: init, update: update, reset: reset };

}());
