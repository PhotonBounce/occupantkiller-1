/* ───────────────────────────────────────────────────────────────────────
   DESERT STORM — Desert warfare mission module
   Activation: D+T simultaneous (400ms window)
   Features: sandstorm cycle, heat shimmer, BTR vehicle, oasis, dunes,
             AT ambush, mines, camel decoy, radio direction finding
   Depends on: THREE (global)
   ─────────────────────────────────────────────────────────────────────── */
window.DesertStorm = (function () {
  'use strict';

  /* ── State ────────────────────────────────────────────────────────── */
  var _scene = null;
  var _active = false;
  var _camera = null;

  /* Timing */
  var _lastTime = 0;
  var _stormTimer = 0;          /* seconds until next storm or until storm ends */
  var _stormActive = false;
  var _stormCycle = 90;         /* storm every 90s */
  var _stormDuration = 30;

  /* Storm particles */
  var _sandParticles = [];
  var _stormAudioCtx = null;
  var _stormOscillator = null;
  var _stormGainNode = null;

  /* Heat */
  var _heatLight = null;
  var _heatOscTime = 0;
  var _playerHP = 100;
  var _heatTemp = 34;

  /* Player state */
  var _playerPos = { x: 0, y: 0, z: 0 };
  var _playerOnCamel = false;
  var _playerMounted = false;
  var _atArmed = true;
  var _atAmbushSet = false;
  var _atAmbushPos = { x: 0, y: 0, z: 0 };

  /* Scene objects */
  var _dunes = [];
  var _palmTrunks = [];
  var _oasisMesh = null;
  var _oasisPos = { x: 0, y: 0, z: -40 };
  var _oasisRadius = 8;
  var _civilians = [];
  var _camel = null;
  var _camelPos = { x: 15, y: 0, z: -35 };
  var _radioAntenna = null;
  var _radioPos = { x: -30, y: 0, z: 20 };
  var _radioDestroyed = false;
  var _mines = [];
  var _minesTriggered = [];

  /* Enemies */
  var _enemies = [];           /* { mesh, group, x, y, z, hp, alive, kind, patrol, patrolDir, blindTimer } */
  var _btr = null;             /* { group, mesh, turret, hp, alive, x, y, z, dir } */
  var _btrRotation = 0;

  /* HUD element */
  var _hudEl = null;

  /* Key tracking for D+T activation */
  var _keyDownTime = {};
  var _keyHandler = null;
  var _keyUpHandler = null;

  /* AT ambush RPG lines */
  var _rpgLines = [];

  /* ── Helpers ──────────────────────────────────────────────────────── */
  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _dist2d(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3d(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /* ── Scene construction ───────────────────────────────────────────── */
  function _buildEnvironment() {
    /* Background & fog */
    _scene.background = new THREE.Color(0xD4A017);
    _scene.fog = new THREE.FogExp2(0xD4A017, 0.02);

    /* Ground plane */
    var groundGeo = new THREE.BoxGeometry(400, 0.5, 400);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0xC8A04A });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.25, 0);
    _scene.add(ground);

    /* Ambient light */
    var ambient = new THREE.AmbientLight(0xfff5cc, 0.6);
    _scene.add(ambient);

    /* Sun directional light */
    var sun = new THREE.DirectionalLight(0xFFD700, 1.2);
    sun.position.set(60, 80, 30);
    _scene.add(sun);

    /* Heat shimmer point light */
    _heatLight = new THREE.PointLight(0xFF8C00, 0.1, 80);
    _heatLight.position.set(0, 4, 0);
    _scene.add(_heatLight);
  }

  function _buildDunes() {
    var duneMat = new THREE.MeshLambertMaterial({ color: 0xC8A04A });
    for (var i = 0; i < 30; i++) {
      var r = _rand(3, 8);
      var x = _rand(-90, 90);
      var z = _rand(-90, 90);
      /* Keep oasis area clearer */
      if (_dist2d(x, z, _oasisPos.x, _oasisPos.z) < 18) {
        x = x < 0 ? x - 20 : x + 20;
      }
      var duneGeo = new THREE.SphereGeometry(r, 10, 8);
      var dune = new THREE.Mesh(duneGeo, duneMat);
      dune.position.set(x, r * 0.3, z);
      dune.scale.y = 0.45;
      _scene.add(dune);
      _dunes.push({ mesh: dune, x: x, z: z, r: r, topY: r * 0.3 + r * 0.45 * 0.5 });
    }
  }

  function _buildOasis() {
    /* Pool */
    var poolGeo = new THREE.CylinderGeometry(_oasisRadius * 0.7, _oasisRadius * 0.7, 0.4, 20);
    var poolMat = new THREE.MeshLambertMaterial({ color: 0x1A5276 });
    _oasisMesh = new THREE.Mesh(poolGeo, poolMat);
    _oasisMesh.position.set(_oasisPos.x, 0.2, _oasisPos.z);
    _scene.add(_oasisMesh);

    /* Palm trees around oasis */
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var leafMat = new THREE.MeshLambertMaterial({ color: 0x2E7D32 });
    var palmPositions = [
      { x: _oasisPos.x - 6, z: _oasisPos.z - 4 },
      { x: _oasisPos.x + 6, z: _oasisPos.z - 3 },
      { x: _oasisPos.x + 2, z: _oasisPos.z + 7 },
      { x: _oasisPos.x - 4, z: _oasisPos.z + 6 },
    ];
    for (var i = 0; i < palmPositions.length; i++) {
      var pp = palmPositions[i];
      var g = new THREE.Group();
      /* Trunk */
      var trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 6, 8);
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3;
      g.add(trunk);
      /* Leaf crown using ConeGeometry */
      var leafGeo = new THREE.ConeGeometry(2.5, 2, 8);
      var leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 7.2;
      g.add(leaf);
      g.position.set(pp.x, 0, pp.z);
      _scene.add(g);
      _palmTrunks.push(g);
    }

    /* Civilians at oasis */
    var civMat = new THREE.MeshLambertMaterial({ color: 0xAA9977 });
    var civPositions = [
      { x: _oasisPos.x - 3, z: _oasisPos.z + 2 },
      { x: _oasisPos.x + 4, z: _oasisPos.z + 1 },
    ];
    for (var j = 0; j < civPositions.length; j++) {
      var cp = civPositions[j];
      var civGeo = new THREE.BoxGeometry(0.7, 1.8, 0.5);
      var civ = new THREE.Mesh(civGeo, civMat);
      civ.position.set(cp.x, 0.9, cp.z);
      _scene.add(civ);
      _civilians.push(civ);
    }
  }

  function _buildEnemies() {
    /* Desert camo color */
    var camouflage = 0x8B7355;
    var foxholeMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var bodyMat = new THREE.MeshLambertMaterial({ color: camouflage });

    /* 3 entrenched in foxholes */
    var foxholePositions = [
      { x: 20, z: 10 },
      { x: 28, z: -5 },
      { x: 15, z: -18 },
    ];
    for (var i = 0; i < foxholePositions.length; i++) {
      var fp = foxholePositions[i];
      var grp = new THREE.Group();

      /* Foxhole box */
      var foxGeo = new THREE.BoxGeometry(2, 1, 2);
      var foxMesh = new THREE.Mesh(foxGeo, foxholeMat);
      foxMesh.position.y = -0.4;
      grp.add(foxMesh);

      /* Enemy body */
      var bodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.5);
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.5;
      grp.add(body);

      /* Head */
      var headGeo = new THREE.SphereGeometry(0.28, 6, 5);
      var head = new THREE.Mesh(headGeo, bodyMat);
      head.position.y = 1.3;
      grp.add(head);

      grp.position.set(fp.x, 0, fp.z);
      _scene.add(grp);
      _enemies.push({
        group: grp,
        mesh: body,
        x: fp.x, y: 0, z: fp.z,
        hp: 50, maxHp: 50,
        alive: true,
        kind: 'entrenched',
        patrol: false,
        patrolDir: 1,
        blindTimer: 0,
        fireTimer: _rand(2, 5),
      });
    }

    /* 5 patrol enemies */
    var patrolStartPositions = [
      { x: -20, z: 15 },
      { x: -30, z: -10 },
      { x: 35, z: 25 },
      { x: -10, z: 35 },
      { x: 40, z: -20 },
    ];
    for (var j = 0; j < patrolStartPositions.length; j++) {
      var pp = patrolStartPositions[j];
      var pGrp = new THREE.Group();

      var pbodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.5);
      var pbody = new THREE.Mesh(pbodyGeo, bodyMat);
      pbody.position.y = 0.6;
      pGrp.add(pbody);

      var pheadGeo = new THREE.SphereGeometry(0.28, 6, 5);
      var phead = new THREE.Mesh(pheadGeo, bodyMat);
      phead.position.y = 1.4;
      pGrp.add(phead);

      pGrp.position.set(pp.x, 0, pp.z);
      _scene.add(pGrp);
      _enemies.push({
        group: pGrp,
        mesh: pbody,
        x: pp.x, y: 0, z: pp.z,
        hp: 50, maxHp: 50,
        alive: true,
        kind: 'patrol',
        patrol: true,
        patrolAngle: _rand(0, Math.PI * 2),
        patrolDir: 1,
        patrolRadius: _rand(8, 16),
        patrolSpeed: _rand(2, 4),
        blindTimer: 0,
        fireTimer: _rand(3, 8),
      });
    }
  }

  function _buildBTR() {
    var grp = new THREE.Group();
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x778866 });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x556655 });

    /* Hull */
    var hullGeo = new THREE.BoxGeometry(6, 2, 3);
    var hull = new THREE.Mesh(hullGeo, bodyMat);
    hull.position.y = 1.2;
    grp.add(hull);

    /* Wheels suggestion (side box strips) */
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var wheelStripGeo = new THREE.BoxGeometry(5.5, 0.7, 0.4);
    var leftStrip = new THREE.Mesh(wheelStripGeo, wheelMat);
    leftStrip.position.set(0, 0.35, 1.7);
    grp.add(leftStrip);
    var rightStrip = new THREE.Mesh(wheelStripGeo, wheelMat);
    rightStrip.position.set(0, 0.35, -1.7);
    grp.add(rightStrip);

    /* Turret ring */
    var turretGrp = new THREE.Group();
    var turretGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.9, 10);
    var turretBase = new THREE.Mesh(turretGeo, darkMat);
    turretBase.position.y = 0;
    turretGrp.add(turretBase);

    /* Cannon */
    var cannonGeo = new THREE.BoxGeometry(2.5, 0.28, 0.28);
    var cannon = new THREE.Mesh(cannonGeo, darkMat);
    cannon.position.set(1.3, 0.1, 0);
    turretGrp.add(cannon);

    turretGrp.position.set(0.5, 2.65, 0);
    grp.add(turretGrp);

    grp.position.set(-50, 0, 5);
    _scene.add(grp);

    _btr = {
      group: grp,
      turret: turretGrp,
      hp: 200, maxHp: 200,
      alive: true,
      x: -50, y: 0, z: 5,
      speed: 4,
      dir: 1,
      blindTimer: 0,
    };
  }

  function _buildRadioAntenna() {
    var grp = new THREE.Group();
    var antMat = new THREE.MeshLambertMaterial({ color: 0x334433 });

    /* Base */
    var baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.8, 8);
    var base = new THREE.Mesh(baseGeo, antMat);
    base.position.y = 0.4;
    grp.add(base);

    /* Mast */
    var mastGeo = new THREE.CylinderGeometry(0.1, 0.15, 5, 6);
    var mast = new THREE.Mesh(mastGeo, antMat);
    mast.position.y = 3.3;
    grp.add(mast);

    /* Cross arms */
    var arm1Geo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 4);
    var arm1 = new THREE.Mesh(arm1Geo, antMat);
    arm1.rotation.z = Math.PI * 0.5;
    arm1.position.y = 4.5;
    grp.add(arm1);
    var arm2Geo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 4);
    var arm2 = new THREE.Mesh(arm2Geo, antMat);
    arm2.rotation.z = Math.PI * 0.5;
    arm2.position.y = 3.8;
    grp.add(arm2);

    grp.position.set(_radioPos.x, 0, _radioPos.z);
    _scene.add(grp);
    _radioAntenna = { group: grp, x: _radioPos.x, z: _radioPos.z, alive: true };
  }

  function _buildMines() {
    var mineMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var minePositions = [
      { x: 10, z: 0 },
      { x: -10, z: 5 },
      { x: 5, z: 20 },
      { x: -5, z: -15 },
    ];
    for (var i = 0; i < minePositions.length; i++) {
      var mp = minePositions[i];
      /* Slightly below ground surface — almost invisible */
      var mineGeo = new THREE.BoxGeometry(0.8, 0.15, 0.8);
      var mine = new THREE.Mesh(mineGeo, mineMat);
      mine.position.set(mp.x, 0.01, mp.z);
      _scene.add(mine);
      _mines.push({ mesh: mine, x: mp.x, z: mp.z, triggered: false });
    }
  }

  function _buildCamel() {
    var camelMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    var grp = new THREE.Group();

    /* Body */
    var bodyGeo = new THREE.BoxGeometry(2, 1.2, 1);
    var body = new THREE.Mesh(bodyGeo, camelMat);
    body.position.y = 0.9;
    grp.add(body);

    /* Neck */
    var neckGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    var neck = new THREE.Mesh(neckGeo, camelMat);
    neck.position.set(0.8, 1.9, 0);
    grp.add(neck);

    /* Head */
    var headGeo = new THREE.BoxGeometry(0.6, 0.5, 0.45);
    var head = new THREE.Mesh(headGeo, camelMat);
    head.position.set(1.3, 2.55, 0);
    grp.add(head);

    /* Hump */
    var humpGeo = new THREE.SphereGeometry(0.45, 6, 5);
    var hump = new THREE.Mesh(humpGeo, camelMat);
    hump.position.set(-0.2, 1.7, 0);
    grp.add(hump);

    /* Legs */
    var legGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    var legMat = new THREE.MeshLambertMaterial({ color: 0xBFA07A });
    var legOffsets = [
      { x: 0.6, z: 0.35 }, { x: 0.6, z: -0.35 },
      { x: -0.6, z: 0.35 }, { x: -0.6, z: -0.35 },
    ];
    for (var i = 0; i < legOffsets.length; i++) {
      var leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(legOffsets[i].x, 0.45, legOffsets[i].z);
      grp.add(leg);
    }

    grp.position.set(_camelPos.x, 0, _camelPos.z);
    _scene.add(grp);
    _camel = { group: grp, x: _camelPos.x, z: _camelPos.z, targeted: false };
  }

  /* ── Sandstorm ────────────────────────────────────────────────────── */
  function _startSandstorm() {
    _stormActive = true;
    _stormTimer = _stormDuration;

    /* Dense fog */
    _scene.fog = new THREE.FogExp2(0xD4A017, 0.15);

    /* Sand particles */
    var particleMat = new THREE.MeshLambertMaterial({ color: 0xC8A04A });
    for (var i = 0; i < 50; i++) {
      var r = 0.3;
      var pGeo = new THREE.SphereGeometry(r, 4, 3);
      var p = new THREE.Mesh(pGeo, particleMat);
      p.position.set(
        _rand(-30, 30),
        _rand(0.5, 8),
        _rand(-30, 30)
      );
      p.userData.vx = _rand(-8, -3);
      p.userData.vy = _rand(-0.5, 1.5);
      p.userData.vz = _rand(-4, 4);
      _scene.add(p);
      _sandParticles.push(p);
    }

    /* Wind audio */
    try {
      _stormAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      _stormOscillator = _stormAudioCtx.createOscillator();
      _stormGainNode = _stormAudioCtx.createGain();
      _stormOscillator.type = 'sawtooth';
      _stormOscillator.frequency.setValueAtTime(200, _stormAudioCtx.currentTime);
      _stormOscillator.frequency.linearRampToValueAtTime(180, _stormAudioCtx.currentTime + 5);
      _stormGainNode.gain.setValueAtTime(0.12, _stormAudioCtx.currentTime);
      _stormOscillator.connect(_stormGainNode);
      _stormGainNode.connect(_stormAudioCtx.destination);
      _stormOscillator.start();
    } catch (e) {
      /* AudioContext unavailable — silent */
    }

    /* Blind enemies */
    for (var j = 0; j < _enemies.length; j++) {
      _enemies[j].blindTimer = _stormDuration;
    }
    if (_btr && _btr.alive) {
      _btr.blindTimer = _stormDuration;
    }

    _showNotification('SANDSTORM INCOMING! VISIBILITY ZERO — ENEMIES BLINDED', '#E8A020');
  }

  function _endSandstorm() {
    _stormActive = false;
    _stormTimer = _stormCycle;

    /* Restore normal fog */
    _scene.fog = new THREE.FogExp2(0xD4A017, 0.02);

    /* Remove particles */
    for (var i = 0; i < _sandParticles.length; i++) {
      _scene.remove(_sandParticles[i]);
    }
    _sandParticles = [];

    /* Stop audio */
    try {
      if (_stormOscillator) {
        _stormOscillator.stop();
        _stormOscillator.disconnect();
        _stormOscillator = null;
      }
      if (_stormGainNode) {
        _stormGainNode.disconnect();
        _stormGainNode = null;
      }
      if (_stormAudioCtx) {
        _stormAudioCtx.close();
        _stormAudioCtx = null;
      }
    } catch (e) { /* ignore */ }

    _showNotification('STORM CLEARING — ENEMIES REGROUPING', '#88CC44');
  }

  /* ── AT Ambush ────────────────────────────────────────────────────── */
  function _triggerATAmbush(targetX, targetZ) {
    if (!_atArmed) return;
    _atArmed = false;
    _atAmbushSet = false;

    /* Draw RPG burst as LineSegments */
    var ambushY = _atAmbushPos.y + 1.2;
    var targetY = 1.5;

    var points = [];
    /* Main bolt */
    points.push(new THREE.Vector3(_atAmbushPos.x, ambushY, _atAmbushPos.z));
    points.push(new THREE.Vector3(targetX, targetY, targetZ));
    /* Branching sparks */
    for (var i = 0; i < 6; i++) {
      var midX = (_atAmbushPos.x + targetX) * 0.5 + _rand(-3, 3);
      var midY = (ambushY + targetY) * 0.5 + _rand(-1, 2);
      var midZ = (_atAmbushPos.z + targetZ) * 0.5 + _rand(-3, 3);
      points.push(new THREE.Vector3(_atAmbushPos.x, ambushY, _atAmbushPos.z));
      points.push(new THREE.Vector3(midX, midY, midZ));
    }

    var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0xFF6600 });
    var lines = new THREE.LineSegments(lineGeo, lineMat);
    _scene.add(lines);
    _rpgLines.push({ mesh: lines, timer: 1.5 });

    /* Damage BTR */
    if (_btr && _btr.alive) {
      _btr.hp -= 140;
      if (_btr.hp <= 0) {
        _btr.alive = false;
        _scene.remove(_btr.group);
        _showNotification('BTR DESTROYED! AMBUSH SUCCESSFUL!', '#FF4400');
      }
    }

    _showNotification('RPG BURST FIRED!', '#FF8800');
    _updateHUD();
  }

  /* ── Mine explosion ───────────────────────────────────────────────── */
  function _triggerMine(mine) {
    if (mine.triggered) return;
    mine.triggered = true;
    _scene.remove(mine.mesh);

    /* Visual flash — temporary sphere */
    var flashGeo = new THREE.SphereGeometry(3, 8, 6);
    var flashMat = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
    var flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.set(mine.x, 1.5, mine.z);
    _scene.add(flash);
    _rpgLines.push({ mesh: flash, timer: 0.6 });

    _playerHP -= 30;
    if (_playerHP < 0) _playerHP = 0;
    _showNotification('MINE TRIGGERED! -30 HP', '#FF2200');
    _updateHUD();
  }

  /* ── HUD ──────────────────────────────────────────────────────────── */
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'desert-storm-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:14px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#E8D070',
      'font:bold 13px/1.4 monospace',
      'padding:7px 16px',
      'border-radius:5px',
      'pointer-events:none',
      'z-index:9999',
      'letter-spacing:0.04em',
      'white-space:nowrap',
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var stormStatus = _stormActive ? 'INCOMING' : 'CLEAR';
    var aliveEnemies = 0;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) aliveEnemies++;
    }
    var atStatus = _atArmed ? 'ARMED' : (_atAmbushSet ? 'SET' : 'EXPENDED');
    var oasisDist = Math.round(_dist2d(_playerPos.x, _playerPos.z, _oasisPos.x, _oasisPos.z));
    var oasisBearing = _compassBearing(_playerPos.x, _playerPos.z, _oasisPos.x, _oasisPos.z);

    _hudEl.textContent = (
      'DESERT OPS  [HEAT: ' + _heatTemp + '°C]' +
      '  [STORM: ' + stormStatus + ']' +
      '  [ENEMIES: ' + aliveEnemies + ']' +
      '  [AT: ' + atStatus + ']' +
      '  |  OASIS: ' + oasisDist + 'm ' + oasisBearing
    );
  }

  function _compassBearing(fromX, fromZ, toX, toZ) {
    var angle = Math.atan2(toX - fromX, -(toZ - fromZ)) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    var idx = Math.round(angle / 45) % 8;
    return dirs[idx];
  }

  function _showNotification(text, color) {
    var notif = document.createElement('div');
    notif.style.cssText = [
      'position:fixed',
      'top:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:' + (color || '#FFDD44'),
      'font:bold 15px monospace',
      'padding:6px 20px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:10000',
    ].join(';');
    notif.textContent = text;
    document.body.appendChild(notif);
    setTimeout(function () {
      if (notif.parentNode) notif.parentNode.removeChild(notif);
    }, 3000);
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;
  }

  /* ── Input ────────────────────────────────────────────────────────── */
  function _setupInput() {
    _keyHandler = function (e) {
      var k = e.key ? e.key.toUpperCase() : '';
      if (!_active) return;

      /* E = mount/dismount camel */
      if (k === 'E') {
        if (!_playerMounted) {
          var camelDist = _dist2d(_playerPos.x, _playerPos.z, _camel.x, _camel.z);
          if (camelDist < 5) {
            _playerMounted = true;
            _playerOnCamel = true;
            _showNotification('MOUNTED CAMEL — HEAT IMMUNE, SPEED 5', '#DDBB44');
          }
        } else {
          _playerMounted = false;
          _playerOnCamel = false;
          _showNotification('DISMOUNTED CAMEL', '#AABBAA');
        }
        _updateHUD();
      }

      /* A = set AT ambush behind dune */
      if (k === 'A') {
        var behindDune = false;
        for (var i = 0; i < _dunes.length; i++) {
          if (_dunes[i].r >= 5 && _dist2d(_playerPos.x, _playerPos.z, _dunes[i].x, _dunes[i].z) < _dunes[i].r + 2) {
            behindDune = true;
            break;
          }
        }
        if (behindDune && _atArmed) {
          _atAmbushSet = true;
          _atAmbushPos.x = _playerPos.x;
          _atAmbushPos.y = _playerPos.y;
          _atAmbushPos.z = _playerPos.z;
          _showNotification('AT AMBUSH SET — WAITING FOR VEHICLE', '#FF9900');
          _updateHUD();
        } else if (!_atArmed) {
          _showNotification('AT WEAPON EXPENDED', '#884422');
        } else {
          _showNotification('MUST BE BEHIND A DUNE TO SET AMBUSH', '#CC8822');
        }
      }
    };
    document.addEventListener('keydown', _keyHandler);
  }

  function _removeInput() {
    if (_keyHandler) {
      document.removeEventListener('keydown', _keyHandler);
      _keyHandler = null;
    }
  }

  /* ── Update helpers ───────────────────────────────────────────────── */
  function _updateStorm(dt) {
    _stormTimer -= dt;
    if (!_stormActive && _stormTimer <= 0) {
      _startSandstorm();
    } else if (_stormActive && _stormTimer <= 0) {
      _endSandstorm();
    }

    if (_stormActive) {
      for (var i = 0; i < _sandParticles.length; i++) {
        var p = _sandParticles[i];
        p.position.x += p.userData.vx * dt;
        p.position.y += p.userData.vy * dt;
        p.position.z += p.userData.vz * dt;
        /* Wrap particles */
        if (p.position.x < -35) p.position.x = 35;
        if (p.position.x > 35) p.position.x = -35;
        if (p.position.y < 0.2) p.position.y = _rand(3, 8);
        if (p.position.z < -35) p.position.z = 35;
        if (p.position.z > 35) p.position.z = -35;
      }
    }
  }

  function _updateHeat(dt) {
    /* Oscillate heat light */
    _heatOscTime += dt;
    if (_heatLight) {
      _heatLight.intensity = 0.08 + Math.sin(_heatOscTime * 3.7) * 0.06 + Math.sin(_heatOscTime * 7.1) * 0.03;
      if (typeof _playerPos !== 'undefined') {
        _heatLight.position.set(_playerPos.x, 4, _playerPos.z);
      }
    }

    /* HP drain from heat (not near oasis or palm, not on camel) */
    if (!_playerOnCamel) {
      var nearShade = false;
      /* Check oasis */
      if (_dist2d(_playerPos.x, _playerPos.z, _oasisPos.x, _oasisPos.z) < _oasisRadius + 3) {
        nearShade = true;
      }
      /* Check palm shade */
      for (var i = 0; i < _palmTrunks.length; i++) {
        var pt = _palmTrunks[i].position;
        if (_dist2d(_playerPos.x, _playerPos.z, pt.x, pt.z) < 3.5) {
          nearShade = true;
          break;
        }
      }
      if (!nearShade) {
        _playerHP -= 2 * dt;
        if (_playerHP < 0) _playerHP = 0;
      }
    }

    /* Restore HP when at oasis */
    if (_dist2d(_playerPos.x, _playerPos.z, _oasisPos.x, _oasisPos.z) < _oasisRadius) {
      _playerHP += 5 * dt;
      if (_playerHP > 100) _playerHP = 100;
    }
  }

  function _updateEnemies(dt) {
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) continue;

      /* Blind timer */
      if (e.blindTimer > 0) {
        e.blindTimer -= dt;
        if (e.blindTimer < 0) e.blindTimer = 0;
      }

      /* Patrol movement */
      if (e.patrol) {
        e.patrolAngle += dt * e.patrolDir * (e.patrolSpeed / e.patrolRadius);
        e.x = e.group.position.x + Math.cos(e.patrolAngle) * dt * e.patrolSpeed;
        e.z = e.group.position.z + Math.sin(e.patrolAngle) * dt * e.patrolSpeed;
        e.group.position.x = e.x;
        e.group.position.z = e.z;

        /* Turn toward movement */
        e.group.rotation.y = Math.atan2(
          Math.cos(e.patrolAngle + Math.PI * 0.5),
          Math.sin(e.patrolAngle + Math.PI * 0.5)
        );
      }

      /* Occasionally target camel instead of player (if mounted) */
      var targetX = _playerPos.x;
      var targetZ = _playerPos.z;
      if (_playerOnCamel && Math.random() < 0.3 && _camel) {
        _camel.targeted = true;
        targetX = _camel.x;
        targetZ = _camel.z;
      }

      /* Fire at player if not blinded */
      if (e.blindTimer <= 0) {
        e.fireTimer -= dt;
        if (e.fireTimer <= 0) {
          e.fireTimer = _rand(3, 7);
          var dist = _dist2d(e.x, e.z, targetX, targetZ);
          if (dist < 40) {
            /* Check dune accuracy bonus for player */
            var playerOnDune = false;
            for (var d = 0; d < _dunes.length; d++) {
              var dn = _dunes[d];
              if (dn.r >= 5 && _dist2d(_playerPos.x, _playerPos.z, dn.x, dn.z) < dn.r * 0.5) {
                if (_playerPos.y > dn.topY * 0.5) {
                  playerOnDune = true;
                  break;
                }
              }
            }
            /* Enemy is less accurate; player on dune returns fire more effectively */
            var hitChance = playerOnDune ? 0.15 : 0.25;
            if (Math.random() < hitChance) {
              if (!_playerOnCamel) {
                _playerHP -= 8;
                if (_playerHP < 0) _playerHP = 0;
                _showNotification('HIT! -8 HP', '#FF3300');
                _updateHUD();
              }
            }
          }
        }
      }
    }
  }

  function _updateBTR(dt) {
    if (!_btr || !_btr.alive) return;

    /* Rotate turret continuously */
    _btrRotation += dt * 0.5;
    _btr.turret.rotation.y = _btrRotation;

    /* Blind timer */
    if (_btr.blindTimer > 0) {
      _btr.blindTimer -= dt;
      if (_btr.blindTimer < 0) _btr.blindTimer = 0;
      return;
    }

    /* Move along X axis patrolling */
    _btr.x += _btr.speed * _btr.dir * dt;
    _btr.group.position.x = _btr.x;

    if (_btr.x > 50) {
      _btr.dir = -1;
      _btr.group.rotation.y = Math.PI;
    }
    if (_btr.x < -50) {
      _btr.dir = 1;
      _btr.group.rotation.y = 0;
    }

    /* Check ambush trigger */
    if (_atAmbushSet) {
      var distToAmbush = _dist2d(_btr.x, _btr.group.position.z, _atAmbushPos.x, _atAmbushPos.z);
      if (distToAmbush < 12) {
        _triggerATAmbush(_btr.x, _btr.group.position.z);
      }
    }
  }

  function _updateMines(dt) {
    for (var i = 0; i < _mines.length; i++) {
      var mine = _mines[i];
      if (mine.triggered) continue;
      /* Check player step */
      if (_dist2d(_playerPos.x, _playerPos.z, mine.x, mine.z) < 1.2 && !_playerOnCamel) {
        _triggerMine(mine);
      }
      /* Check BTR roll over */
      if (_btr && _btr.alive) {
        if (_dist2d(_btr.x, _btr.group.position.z, mine.x, mine.z) < 3.5) {
          _triggerMine(mine);
          if (_btr.alive) {
            _btr.hp -= 60;
            _showNotification('MINE DAMAGED BTR!', '#FF6600');
            if (_btr.hp <= 0) {
              _btr.alive = false;
              _scene.remove(_btr.group);
              _showNotification('BTR DESTROYED BY MINE!', '#FF4400');
            }
            _updateHUD();
          }
        }
      }
    }
  }

  function _updateRPGLines(dt) {
    for (var i = _rpgLines.length - 1; i >= 0; i--) {
      _rpgLines[i].timer -= dt;
      if (_rpgLines[i].timer <= 0) {
        _scene.remove(_rpgLines[i].mesh);
        _rpgLines.splice(i, 1);
      }
    }
  }

  function _updateDuneBonus() {
    /* Provide view range bonus hint if player is high on a dune */
    for (var i = 0; i < _dunes.length; i++) {
      var dn = _dunes[i];
      if (dn.r >= 5 && _dist2d(_playerPos.x, _playerPos.z, dn.x, dn.z) < dn.r * 0.6) {
        if (_playerPos.y >= dn.topY * 0.55) {
          /* Player is on high dune — bonus active */
          /* The accuracy bonus is applied in _updateEnemies; we just track it here */
          return true;
        }
      }
    }
    return false;
  }

  function _updateCamel(dt) {
    if (!_camel) return;
    /* Enemies occasionally re-target camel */
    if (_playerOnCamel) {
      _camel.group.position.x = _playerPos.x;
      _camel.group.position.z = _playerPos.z;
      _camel.x = _playerPos.x;
      _camel.z = _playerPos.z;
    }
  }

  function _updateRadioCompass() {
    if (!_radioAntenna || _radioDestroyed) return;
    /* Update HUD bearing line for radio DF */
    _updateHUD();
  }

  /* ── Public API ───────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene = scene;
    _camera = camera || null;
    _active = true;

    /* Reset state */
    _stormTimer = _stormCycle;
    _stormActive = false;
    _playerHP = 100;
    _playerOnCamel = false;
    _playerMounted = false;
    _atArmed = true;
    _atAmbushSet = false;
    _heatOscTime = 0;
    _radioDestroyed = false;
    _sandParticles = [];
    _dunes = [];
    _palmTrunks = [];
    _enemies = [];
    _mines = [];
    _minesTriggered = [];
    _rpgLines = [];
    _civilians = [];
    _btr = null;
    _radioAntenna = null;
    _camel = null;

    /* Sync player position from game camera */
    if (_camera) {
      _playerPos.x = _camera.position.x;
      _playerPos.y = _camera.position.y;
      _playerPos.z = _camera.position.z;
    }

    _buildEnvironment();
    _buildDunes();
    _buildOasis();
    _buildEnemies();
    _buildBTR();
    _buildRadioAntenna();
    _buildMines();
    _buildCamel();
    _createHUD();
    _setupInput();

    _showNotification('DESERT STORM — MISSION ACTIVE', '#E8D070');
    _lastTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  }

  function update(dt) {
    if (!_active) return;

    /* Sync player position from camera if available */
    if (_camera) {
      _playerPos.x = _camera.position.x;
      _playerPos.y = _camera.position.y;
      _playerPos.z = _camera.position.z;
    }

    var safeDt = (dt !== undefined && dt > 0 && dt < 1) ? dt : 0.016;

    _updateStorm(safeDt);
    _updateHeat(safeDt);
    _updateEnemies(safeDt);
    _updateBTR(safeDt);
    _updateMines(safeDt);
    _updateRPGLines(safeDt);
    _updateDuneBonus();
    _updateCamel(safeDt);
    _updateRadioCompass();

    /* Periodic HUD refresh */
    _heatOscTime += safeDt;
    if (Math.round(_heatOscTime * 4) % 8 === 0) {
      _updateHUD();
    }
  }

  function reset() {
    /* Remove all scene objects */
    for (var i = 0; i < _dunes.length; i++) _scene && _scene.remove(_dunes[i].mesh);
    for (var j = 0; j < _palmTrunks.length; j++) _scene && _scene.remove(_palmTrunks[j]);
    for (var k = 0; k < _enemies.length; k++) _scene && _scene.remove(_enemies[k].group);
    for (var m = 0; m < _mines.length; m++) _scene && _scene.remove(_mines[m].mesh);
    for (var n = 0; n < _civilians.length; n++) _scene && _scene.remove(_civilians[n]);
    for (var r = 0; r < _rpgLines.length; r++) _scene && _scene.remove(_rpgLines[r].mesh);
    for (var s = 0; s < _sandParticles.length; s++) _scene && _scene.remove(_sandParticles[s]);

    if (_oasisMesh && _scene) _scene.remove(_oasisMesh);
    if (_btr && _scene) _scene.remove(_btr.group);
    if (_camel && _scene) _scene.remove(_camel.group);
    if (_radioAntenna && _scene) _scene.remove(_radioAntenna.group);
    if (_heatLight && _scene) _scene.remove(_heatLight);

    /* Stop storm audio */
    try {
      if (_stormOscillator) { _stormOscillator.stop(); _stormOscillator.disconnect(); }
      if (_stormGainNode) { _stormGainNode.disconnect(); }
      if (_stormAudioCtx) { _stormAudioCtx.close(); }
    } catch (e) { /* ignore */ }
    _stormOscillator = null;
    _stormGainNode = null;
    _stormAudioCtx = null;

    /* Restore default fog/background */
    if (_scene) {
      _scene.fog = null;
      _scene.background = null;
    }

    _removeInput();
    _removeHUD();

    _active = false;
    _scene = null;
    _camera = null;
    _dunes = [];
    _palmTrunks = [];
    _enemies = [];
    _mines = [];
    _civilians = [];
    _rpgLines = [];
    _sandParticles = [];
    _oasisMesh = null;
    _btr = null;
    _camel = null;
    _radioAntenna = null;
    _heatLight = null;
  }

  /* ── Activation shortcut handler (D+T within 400ms) ─────────────── */
  (function _registerActivationKey() {
    var _dPressed = 0;
    var _tPressed = 0;
    var _WINDOW = 400;

    document.addEventListener('keydown', function (e) {
      var k = e.key ? e.key.toUpperCase() : '';
      var now = Date.now();
      if (k === 'D') _dPressed = now;
      if (k === 'T') _tPressed = now;
      if (_dPressed > 0 && _tPressed > 0 && Math.abs(_dPressed - _tPressed) <= _WINDOW) {
        _dPressed = 0;
        _tPressed = 0;
        if (!_active && window.DesertStorm) {
          /* Attempt to reuse current scene from known globals */
          var scene = (typeof window !== 'undefined' && window.scene) ? window.scene : new THREE.Scene();
          var cam = (typeof window !== 'undefined' && window.camera) ? window.camera : null;
          window.DesertStorm.init(scene, cam);
        }
      }
    });
  }());

  return {
    init: init,
    update: update,
    reset: reset,
  };
}());
