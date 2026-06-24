/* ───────────────────────────────────────────────────────────────────────────
   storm-the-castle.js — Storm the Castle Mini-Game
   API: window.StormTheCastle = { init, update, reset }
   Controls:
     S + C (simultaneous, within 400ms) → activate module
     Q    → Fireball (20 mana, 50 dmg, 3u splash)
     E    → Frost Wall barrier 4x3 (25 mana, 8s duration)
     R    → Lightning chain 3 targets (30 mana, 40 dmg each)
     T    → Shield aura reflects projectiles (35 mana, 4s)
     WASD → move player
     Mouse → aim / look
   ─────────────────────────────────────────────────────────────────────────── */
window.StormTheCastle = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active          = false;
  var _sPressed        = false;
  var _cPressed        = false;
  var _sTime           = 0;
  var _cTime           = 0;
  var ACTIVATION_WINDOW = 400; // ms

  /* ── Mana system ────────────────────────────────────────────────────────── */
  var _mana            = 100;
  var MANA_MAX         = 100;
  var MANA_REGEN       = 5; // per second

  /* ── Castle geometry refs ───────────────────────────────────────────────── */
  var _castleGroup     = null;
  var _lava            = null;
  var _portcullis      = null;
  var _innerSanctum    = null;

  /* ── Enemy state ────────────────────────────────────────────────────────── */
  var _soldiers        = [];   // 25 BoxGeometry soldiers
  var _mages           = [];   // 5 CylinderGeometry counter-spell mages
  var _golems          = [];   // 2 stone golems 300HP immune frost
  var _projectiles     = [];   // player + enemy projectiles
  var _frostWalls      = [];   // active frost wall barriers
  var _lightningBolts  = [];   // active lightning LineSegments
  var _shieldActive    = false;
  var _shieldTimer     = 0;
  var _shieldLight     = null;

  /* ── Dragon state ───────────────────────────────────────────────────────── */
  var _dragonGroup     = null;
  var _dragonActive    = false;
  var _dragonHP        = 5;    // fireballs needed to defeat
  var _dragonHead      = null;
  var _dragonTimer     = 0;    // time elapsed (activate at 5min = 300s)
  var _dragonFlyTimer  = 0;    // fly-by interval 30s
  var _dragonFirebombs = [];
  var _dragonDefeated  = false;
  var DRAGON_APPEAR_TIME = 300; // 5 minutes in seconds
  var DRAGON_FLYBY_INTERVAL = 30;

  /* ── Allied mages ───────────────────────────────────────────────────────── */
  var _alliedMages     = [];   // 3 allied mages
  var _alliedMageCastTimers = [];
  var ALLIED_MAGE_CAST_INTERVAL = 15; // cast every 15s

  /* ── Boss: Dark Lord ────────────────────────────────────────────────────── */
  var _bossGroup       = null;
  var _bossHP          = 600;
  var _bossMaxHP       = 600;
  var _bossPhase       = 0;   // 0=shield, 1=summon skeletons, 2=final flurry
  var _bossShieldActive = false;
  var _bossSkeletons   = [];
  var _bossActive      = false;

  /* ── Player state ───────────────────────────────────────────────────────── */
  var _playerPos       = null;
  var _playerMesh      = null;
  var _moveKeys        = { w: false, a: false, s: false, d: false };
  var _mouse           = { x: 0, y: 0 };
  var _playerSpeed     = 10;

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  var _hudEl           = null;

  /* ── Clock / timing ─────────────────────────────────────────────────────── */
  var _clock           = null;
  var _totalTime       = 0;

  /* ═══════════════════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════════════════ */

  function _makeColor(hex) {
    return new THREE.Color(hex);
  }

  function _makeMat(hex, emissive, emissiveIntensity) {
    var mat = new THREE.MeshLambertMaterial({ color: hex });
    if (emissive !== undefined) {
      mat.emissive = _makeColor(emissive);
      mat.emissiveIntensity = emissiveIntensity !== undefined ? emissiveIntensity : 0.5;
    }
    return mat;
  }

  function _vecDist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _vecAdd(a, b) {
    return new THREE.Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
  }

  function _vecSub(a, b) {
    return new THREE.Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  function _vecNorm(v) {
    var l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    return new THREE.Vector3(v.x / l, v.y / l, v.z / l);
  }

  function _vecScale(v, s) {
    return new THREE.Vector3(v.x * s, v.y * s, v.z * s);
  }

  function _randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function _removeMesh(mesh) {
    if (mesh && mesh.parent) {
      mesh.parent.remove(mesh);
    }
    if (mesh && mesh.geometry) { mesh.geometry.dispose(); }
    if (mesh && mesh.material) { mesh.material.dispose(); }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     CASTLE CONSTRUCTION
  ═══════════════════════════════════════════════════════════════════════════ */

  function _buildCastle() {
    _castleGroup = new THREE.Group();
    _scene.add(_castleGroup);

    var wallMat = _makeMat(0x778877);

    // Four stone walls BoxGeometry 60x15x3
    var wallPositions = [
      { x: 0,   y: 7.5, z: -31.5, ry: 0 },           // north wall
      { x: 0,   y: 7.5, z:  31.5, ry: 0 },            // south wall
      { x: -31.5, y: 7.5, z: 0, ry: Math.PI / 2 },   // west wall
      { x:  31.5, y: 7.5, z: 0, ry: Math.PI / 2 }    // east wall
    ];

    for (var wi = 0; wi < wallPositions.length; wi++) {
      var wp = wallPositions[wi];
      var wallGeo = new THREE.BoxGeometry(60, 15, 3);
      var wall    = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(wp.x, wp.y, wp.z);
      wall.rotation.y = wp.ry;
      _castleGroup.add(wall);
    }

    // 4 turrets CylinderGeometry r=3 h=20
    var turretMat = _makeMat(0x667766);
    var turretCorners = [
      { x: -30, z: -30 },
      { x:  30, z: -30 },
      { x: -30, z:  30 },
      { x:  30, z:  30 }
    ];
    for (var ti = 0; ti < turretCorners.length; ti++) {
      var tc      = turretCorners[ti];
      var tGeo    = new THREE.CylinderGeometry(3, 3, 20, 8);
      var turret  = new THREE.Mesh(tGeo, turretMat);
      turret.position.set(tc.x, 10, tc.z);
      _castleGroup.add(turret);
    }

    // Great gate BoxGeometry 8x14x4
    var gateMat = _makeMat(0x556655);
    var gateGeo = new THREE.BoxGeometry(8, 14, 4);
    var gate    = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(0, 7, 31.5);
    _castleGroup.add(gate);

    // Portcullis as LineSegments
    var portPoints = [];
    var barCount   = 6;
    for (var pi = 0; pi < barCount; pi++) {
      var px = -3.5 + pi * 1.2;
      portPoints.push(px, 0.5, 31.4,  px, 13, 31.4);
    }
    for (var ri = 0; ri < 5; ri++) {
      var ry = 1 + ri * 2.5;
      portPoints.push(-3.5, ry, 31.4,  3.5, ry, 31.4);
    }
    var portGeo = new THREE.BufferGeometry();
    portGeo.setAttribute('position', new THREE.Float32BufferAttribute(portPoints, 3));
    var portMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    _portcullis  = new THREE.LineSegments(portGeo, portMat);
    _castleGroup.add(_portcullis);

    // Inner sanctum BoxGeometry 20x20x15
    var sanctumMat = _makeMat(0x554466);
    var sanctumGeo = new THREE.BoxGeometry(20, 20, 15);
    _innerSanctum  = new THREE.Mesh(sanctumGeo, sanctumMat);
    _innerSanctum.position.set(0, 10, -15);
    _castleGroup.add(_innerSanctum);

    // Lava moat PlaneGeometry
    var lavaGeo = new THREE.PlaneGeometry(80, 80);
    var lavaMat = new THREE.MeshLambertMaterial({
      color:    0xFF4400,
      emissive: new THREE.Color(0xFF4400),
      emissiveIntensity: 0.6
    });
    _lava = new THREE.Mesh(lavaGeo, lavaMat);
    _lava.rotation.x = -Math.PI / 2;
    _lava.position.set(0, -0.5, 0);
    // Cut-out effect: outer ring only (visual approximation)
    _castleGroup.add(_lava);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ENEMY SPAWNING
  ═══════════════════════════════════════════════════════════════════════════ */

  function _spawnSoldiers() {
    var soldierMat = _makeMat(0x557755);
    for (var i = 0; i < 25; i++) {
      var geo  = new THREE.BoxGeometry(1, 2, 1);
      var mesh = new THREE.Mesh(geo, soldierMat);
      mesh.position.set(
        _randomBetween(-25, 25),
        1,
        _randomBetween(-28, 28)
      );
      _scene.add(mesh);
      _soldiers.push({
        mesh:   mesh,
        hp:     80,
        speed:  _randomBetween(2, 4),
        alive:  true,
        moveDir: new THREE.Vector3(
          _randomBetween(-1, 1),
          0,
          _randomBetween(-1, 1)
        ).normalize()
      });
    }
  }

  function _spawnMages() {
    var mageMat = _makeMat(0x553377);
    for (var i = 0; i < 5; i++) {
      var geo  = new THREE.CylinderGeometry(0.7, 0.7, 2.2, 8);
      var mesh = new THREE.Mesh(geo, mageMat);
      mesh.position.set(
        _randomBetween(-20, 20),
        1.1,
        _randomBetween(-25, 25)
      );
      _scene.add(mesh);
      _mages.push({
        mesh:      mesh,
        hp:        60,
        alive:     true,
        castTimer: _randomBetween(3, 8)
      });
    }
  }

  function _spawnGolems() {
    var golemMat = _makeMat(0x778877);
    for (var i = 0; i < 2; i++) {
      var geo  = new THREE.BoxGeometry(3, 5, 3);
      var mesh = new THREE.Mesh(geo, golemMat);
      mesh.position.set(
        i === 0 ? -15 : 15,
        2.5,
        -20
      );
      _scene.add(mesh);
      _golems.push({
        mesh:         mesh,
        hp:           300,
        maxHp:        300,
        alive:        true,
        immuneFrost:  true,
        speed:        1.5
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     DRAGON
  ═══════════════════════════════════════════════════════════════════════════ */

  function _buildDragon() {
    _dragonGroup = new THREE.Group();

    // Body CylinderGeometry
    var bodyGeo = new THREE.CylinderGeometry(2, 2.5, 8, 8);
    var bodyMat = _makeMat(0x662211);
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    _dragonGroup.add(body);

    // Wings BoxGeometry
    var wingMat = _makeMat(0x551100);
    var wGeoL   = new THREE.BoxGeometry(8, 0.4, 5);
    var wingL   = new THREE.Mesh(wGeoL, wingMat);
    wingL.position.set(0, 1.5, -4);
    _dragonGroup.add(wingL);

    var wGeoR = new THREE.BoxGeometry(8, 0.4, 5);
    var wingR = new THREE.Mesh(wGeoR, wingMat);
    wingR.position.set(0, 1.5, 4);
    _dragonGroup.add(wingR);

    // Head SphereGeometry (hit target for fireball defeats)
    var headGeo = new THREE.SphereGeometry(2, 8, 8);
    var headMat = _makeMat(0x882200);
    _dragonHead = new THREE.Mesh(headGeo, headMat);
    _dragonHead.position.set(5, 0, 0);
    _dragonGroup.add(_dragonHead);

    _dragonGroup.position.set(0, 60, 0); // starts high/off-map
    _dragonGroup.visible = false;
    _scene.add(_dragonGroup);
  }

  function _dragonFlyBy(dt) {
    if (_dragonDefeated) { return; }

    _dragonFlyTimer -= dt;
    if (_dragonFlyTimer > 0) {
      // Animate flying
      _dragonGroup.position.x += 15 * dt;
      _dragonGroup.position.y = 40 + Math.sin(_totalTime * 0.5) * 5;
      if (_dragonGroup.position.x > 80) {
        _dragonGroup.position.x = -80;
      }
      // Drop fire bomb periodically during fly-by
      if (Math.floor(_totalTime * 2) % 4 === 0 && _dragonFirebombs.length < 6) {
        _spawnDragonFirebomb(_dragonGroup.position.clone());
      }
      return;
    }

    // Reset fly-by timer, retract dragon to high altitude briefly
    _dragonFlyTimer = DRAGON_FLYBY_INTERVAL;
    _dragonGroup.position.y = 60;
  }

  function _spawnDragonFirebomb(origin) {
    var geo  = new THREE.SphereGeometry(0.5, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({
      color: 0xFF6600,
      emissive: new THREE.Color(0xFF2200),
      emissiveIntensity: 0.8
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    _scene.add(mesh);
    _dragonFirebombs.push({
      mesh:  mesh,
      vel:   new THREE.Vector3(
        _randomBetween(-5, 5),
        -8,
        _randomBetween(-5, 5)
      ),
      alive: true
    });
  }

  function _updateDragonFirebombs(dt) {
    for (var i = _dragonFirebombs.length - 1; i >= 0; i--) {
      var fb = _dragonFirebombs[i];
      if (!fb.alive) { continue; }
      fb.mesh.position.x += fb.vel.x * dt;
      fb.mesh.position.y += fb.vel.y * dt;
      fb.mesh.position.z += fb.vel.z * dt;
      fb.vel.y -= 5 * dt; // gravity

      if (fb.mesh.position.y < 0) {
        // Impact
        fb.alive = false;
        _removeMesh(fb.mesh);
        _dragonFirebombs.splice(i, 1);
        // Damage player if nearby
        if (_playerPos && _vecDist(fb.mesh.position, _playerPos) < 4) {
          // Player hit by dragon firebomb
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ALLIED MAGES
  ═══════════════════════════════════════════════════════════════════════════ */

  function _spawnAlliedMages() {
    var alliedMat = _makeMat(0x334477);
    for (var i = 0; i < 3; i++) {
      var geo  = new THREE.BoxGeometry(1, 2.2, 1);
      var mesh = new THREE.Mesh(geo, alliedMat);
      mesh.position.set(-5 + i * 5, 1, 45);
      _scene.add(mesh);
      _alliedMages.push({
        mesh:      mesh,
        alive:     true,
        castTimer: ALLIED_MAGE_CAST_INTERVAL + _randomBetween(0, 5)
      });
    }
  }

  function _updateAlliedMages(dt) {
    for (var i = 0; i < _alliedMages.length; i++) {
      var am = _alliedMages[i];
      if (!am.alive) { continue; }

      // Follow player
      if (_playerPos) {
        var targetX = _playerPos.x + (i - 1) * 3;
        var targetZ = _playerPos.z + 6;
        var dx = targetX - am.mesh.position.x;
        var dz = targetZ - am.mesh.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 2) {
          am.mesh.position.x += (dx / dist) * 4 * dt;
          am.mesh.position.z += (dz / dist) * 4 * dt;
        }
      }

      // Cast fireball every 15s at nearest enemy
      am.castTimer -= dt;
      if (am.castTimer <= 0) {
        am.castTimer = ALLIED_MAGE_CAST_INTERVAL;
        _castAlliedFireball(am.mesh.position);
      }
    }
  }

  function _castAlliedFireball(origin) {
    // Find nearest enemy
    var nearest    = null;
    var nearestDist = Infinity;

    for (var i = 0; i < _soldiers.length; i++) {
      if (!_soldiers[i].alive) { continue; }
      var d = _vecDist(origin, _soldiers[i].mesh.position);
      if (d < nearestDist) {
        nearestDist = d;
        nearest     = _soldiers[i];
      }
    }
    for (var j = 0; j < _mages.length; j++) {
      if (!_mages[j].alive) { continue; }
      var d2 = _vecDist(origin, _mages[j].mesh.position);
      if (d2 < nearestDist) {
        nearestDist = d2;
        nearest     = _mages[j];
      }
    }

    if (!nearest) { return; }

    var dir = _vecNorm(_vecSub(nearest.mesh.position, origin));
    _spawnProjectile(origin, dir, 50, 3, 0xFF4400, 'allied');
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     BOSS: DARK LORD
  ═══════════════════════════════════════════════════════════════════════════ */

  function _buildBoss() {
    _bossGroup = new THREE.Group();

    var bossMat = _makeMat(0x221133);
    var bossGeo = new THREE.BoxGeometry(2, 4, 2);
    var bossMesh = new THREE.Mesh(bossGeo, bossMat);
    _bossGroup.add(bossMesh);

    _bossGroup.scale.set(1.8, 1.8, 1.8);
    _bossGroup.position.set(0, 3.6, -22);
    _bossGroup.visible = false;
    _scene.add(_bossGroup);
    _bossActive = false;
  }

  function _activateBoss() {
    if (_bossActive) { return; }
    _bossActive = true;
    _bossGroup.visible = true;
    _bossPhase = 0;
    _bossShieldActive = true;
  }

  function _updateBoss(dt) {
    if (!_bossActive || _bossHP <= 0) { return; }

    // Phase transitions based on HP
    if (_bossHP <= 400 && _bossPhase === 0) {
      _bossPhase = 1;
      _bossShieldActive = false;
      _spawnBossSkeletons();
    } else if (_bossHP <= 200 && _bossPhase === 1) {
      _bossPhase = 2; // final flurry
      _clearBossSkeletons();
    }

    // Phase 0: shield — boss drifts, shield blocks damage
    if (_bossPhase === 0) {
      _bossGroup.position.x = Math.sin(_totalTime * 0.3) * 8;
    }

    // Phase 1: summon skeletons, move erratically
    if (_bossPhase === 1) {
      _bossGroup.position.x = Math.sin(_totalTime * 0.5) * 12;
      _updateBossSkeletons(dt);
    }

    // Phase 2: final flurry — boss charges toward player, fires projectiles
    if (_bossPhase === 2) {
      if (_playerPos) {
        var dx = _playerPos.x - _bossGroup.position.x;
        var dz = _playerPos.z - _bossGroup.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 5) {
          _bossGroup.position.x += (dx / dist) * 6 * dt;
          _bossGroup.position.z += (dz / dist) * 6 * dt;
        }
        // Fire projectiles at player every 1.5s
        if (Math.floor(_totalTime * (2 / 3)) % 2 === 0) {
          var dir = _vecNorm(new THREE.Vector3(dx, 0, dz));
          _spawnProjectile(_bossGroup.position, dir, 60, 1, 0xAA00FF, 'enemy');
        }
      }
    }
  }

  function _spawnBossSkeletons() {
    _clearBossSkeletons();
    var skelMat = _makeMat(0xCCCCCC);
    for (var i = 0; i < 6; i++) {
      var geo  = new THREE.BoxGeometry(0.8, 1.8, 0.8);
      var mesh = new THREE.Mesh(geo, skelMat);
      mesh.position.set(
        _bossGroup.position.x + _randomBetween(-8, 8),
        0.9,
        _bossGroup.position.z + _randomBetween(-8, 8)
      );
      _scene.add(mesh);
      _bossSkeletons.push({
        mesh:  mesh,
        hp:    40,
        alive: true,
        speed: 3
      });
    }
  }

  function _clearBossSkeletons() {
    for (var i = 0; i < _bossSkeletons.length; i++) {
      _removeMesh(_bossSkeletons[i].mesh);
    }
    _bossSkeletons = [];
  }

  function _updateBossSkeletons(dt) {
    for (var i = 0; i < _bossSkeletons.length; i++) {
      var sk = _bossSkeletons[i];
      if (!sk.alive) { continue; }
      if (_playerPos) {
        var dx = _playerPos.x - sk.mesh.position.x;
        var dz = _playerPos.z - sk.mesh.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 1.5) {
          sk.mesh.position.x += (dx / dist) * sk.speed * dt;
          sk.mesh.position.z += (dz / dist) * sk.speed * dt;
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     MAGIC SYSTEM
  ═══════════════════════════════════════════════════════════════════════════ */

  function _spawnProjectile(origin, dir, damage, splashRadius, colorHex, team) {
    var geo  = new THREE.SphereGeometry(0.4, 6, 6);
    var mat  = new THREE.MeshLambertMaterial({
      color: colorHex,
      emissive: new THREE.Color(colorHex),
      emissiveIntensity: 0.7
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.position.y = Math.max(mesh.position.y, 1);
    _scene.add(mesh);
    _projectiles.push({
      mesh:         mesh,
      vel:          _vecScale(dir, 25),
      damage:       damage,
      splashRadius: splashRadius,
      alive:        true,
      team:         team,   // 'player', 'allied', 'enemy'
      lifetime:     4
    });
  }

  function _castFireball() {
    if (_mana < 20) { return; }
    _mana -= 20;

    var dir = _getCastDirection();
    var origin = _playerPos.clone();
    origin.y = 1.5;
    _spawnProjectile(origin, dir, 50, 3, 0xFF4400, 'player');
  }

  function _castFrostWall() {
    if (_mana < 25) { return; }
    _mana -= 25;

    var geo  = new THREE.BoxGeometry(4, 3, 0.4);
    var mat  = new THREE.MeshLambertMaterial({
      color: 0x88CCFF,
      transparent: true,
      opacity: 0.75
    });
    var mesh = new THREE.Mesh(geo, mat);
    var pos  = _playerPos.clone();
    pos.z -= 6;
    pos.y  = 1.5;
    mesh.position.copy(pos);
    _scene.add(mesh);
    _frostWalls.push({
      mesh:    mesh,
      alive:   true,
      timer:   8,
      bounds: {
        minX: pos.x - 2, maxX: pos.x + 2,
        minY: 0,         maxY: 3,
        minZ: pos.z - 0.5, maxZ: pos.z + 0.5
      }
    });

    // Order allied mages toward frost wall with E
    for (var i = 0; i < _alliedMages.length; i++) {
      _alliedMages[i].mesh.position.z = pos.z + 3;
    }
  }

  function _castLightning() {
    if (_mana < 30) { return; }
    _mana -= 30;

    // Find 3 nearest targets
    var targets  = [];
    var allEnemy = [];
    var ei;
    for (ei = 0; ei < _soldiers.length; ei++) {
      if (_soldiers[ei].alive) { allEnemy.push(_soldiers[ei]); }
    }
    for (ei = 0; ei < _mages.length; ei++) {
      if (_mages[ei].alive) { allEnemy.push(_mages[ei]); }
    }
    for (ei = 0; ei < _golems.length; ei++) {
      if (_golems[ei].alive) { allEnemy.push(_golems[ei]); }
    }

    allEnemy.sort(function (a, b) {
      return _vecDist(a.mesh.position, _playerPos) - _vecDist(b.mesh.position, _playerPos);
    });

    for (var ti = 0; ti < Math.min(3, allEnemy.length); ti++) {
      targets.push(allEnemy[ti]);
    }

    if (targets.length === 0) { return; }

    // Build chain line segments
    var pts      = [];
    var prevPos  = _playerPos.clone();
    prevPos.y = 1.5;

    for (var li = 0; li < targets.length; li++) {
      var tgt  = targets[li];
      var tPos = tgt.mesh.position.clone();
      tPos.y = 1.5;

      // Jagged bolt: add midpoint jitter
      var mid = new THREE.Vector3(
        (prevPos.x + tPos.x) / 2 + _randomBetween(-2, 2),
        (prevPos.y + tPos.y) / 2 + _randomBetween(1, 4),
        (prevPos.z + tPos.z) / 2 + _randomBetween(-2, 2)
      );
      pts.push(prevPos.x, prevPos.y, prevPos.z);
      pts.push(mid.x, mid.y, mid.z);
      pts.push(mid.x, mid.y, mid.z);
      pts.push(tPos.x, tPos.y, tPos.z);

      // Apply damage
      tgt.hp -= 40;
      if (tgt.hp <= 0) {
        tgt.alive = false;
        tgt.mesh.visible = false;
      }

      prevPos = tPos;
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var mat  = new THREE.LineBasicMaterial({ color: 0xCCDDFF, linewidth: 2 });
    var bolt = new THREE.LineSegments(geo, mat);
    _scene.add(bolt);
    _lightningBolts.push({ mesh: bolt, timer: 0.3 });
  }

  function _castShield() {
    if (_mana < 35) { return; }
    _mana -= 35;

    _shieldActive = true;
    _shieldTimer  = 4;

    if (!_shieldLight) {
      _shieldLight = new THREE.PointLight(0x4488FF, 2, 8);
      _scene.add(_shieldLight);
    }
    _shieldLight.visible = true;
  }

  function _getCastDirection() {
    // Direction based on camera look direction
    if (_camera) {
      var dir = new THREE.Vector3();
      _camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      if (dir.length() < 0.1) {
        dir.set(0, 0, -1);
      }
      return dir;
    }
    return new THREE.Vector3(0, 0, -1);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     UPDATE HELPERS
  ═══════════════════════════════════════════════════════════════════════════ */

  function _updateMana(dt) {
    _mana = Math.min(MANA_MAX, _mana + MANA_REGEN * dt);
  }

  function _updateProjectiles(dt) {
    for (var i = _projectiles.length - 1; i >= 0; i--) {
      var p = _projectiles[i];
      if (!p.alive) { continue; }

      p.lifetime -= dt;
      if (p.lifetime <= 0) {
        p.alive = false;
        _removeMesh(p.mesh);
        _projectiles.splice(i, 1);
        continue;
      }

      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;

      // Check shield reflection
      if (p.team === 'enemy' && _shieldActive && _playerPos) {
        if (_vecDist(p.mesh.position, _playerPos) < 4) {
          // Reflect: reverse velocity
          p.vel.x = -p.vel.x;
          p.vel.z = -p.vel.z;
          p.team  = 'player';
        }
      }

      // Frost wall collision
      for (var fi = 0; fi < _frostWalls.length; fi++) {
        var fw = _frostWalls[fi];
        if (!fw.alive) { continue; }
        var pp = p.mesh.position;
        var b  = fw.bounds;
        if (pp.x >= b.minX && pp.x <= b.maxX &&
            pp.y >= b.minY && pp.y <= b.maxY &&
            pp.z >= b.minZ && pp.z <= b.maxZ) {
          p.alive = false;
          _removeMesh(p.mesh);
          _projectiles.splice(i, 1);
          break;
        }
      }
      if (!p.alive) { continue; }

      if (p.team === 'player' || p.team === 'allied') {
        _checkProjectileHitEnemies(p);
        if (p.alive && _dragonHead && !_dragonDefeated && _dragonActive) {
          var dragonHeadWorld = new THREE.Vector3();
          _dragonHead.getWorldPosition(dragonHeadWorld);
          if (_vecDist(p.mesh.position, dragonHeadWorld) < 3) {
            _dragonHP -= 1;
            p.alive = false;
            _removeMesh(p.mesh);
            _projectiles.splice(i, 1);
            if (_dragonHP <= 0) {
              _dragonDefeated = true;
              _dragonGroup.visible = false;
              _dragonActive = false;
            }
          }
        }
        if (p.alive && _bossActive && _bossHP > 0 && !_bossShieldActive) {
          if (_vecDist(p.mesh.position, _bossGroup.position) < 5) {
            _bossHP -= p.damage;
            if (_bossHP <= 0) { _bossHP = 0; _bossGroup.visible = false; }
            p.alive = false;
            _removeMesh(p.mesh);
            _projectiles.splice(i, 1);
          }
        }
      }
    }
  }

  function _checkProjectileHitEnemies(p) {
    var hitList = [_soldiers, _mages, _golems, _bossSkeletons];
    for (var gi = 0; gi < hitList.length; gi++) {
      var grp = hitList[gi];
      for (var ei = 0; ei < grp.length; ei++) {
        var en = grp[ei];
        if (!en.alive) { continue; }

        var d = _vecDist(p.mesh.position, en.mesh.position);
        if (d < 2) {
          // Splash damage check
          if (p.splashRadius > 1) {
            _applySplashDamage(p.mesh.position, p.damage, p.splashRadius);
          } else {
            // Frost wall immune for golems
            if (p.damage < 0 /* frost special */ && en.immuneFrost) {
              // skip
            } else {
              en.hp -= p.damage;
            }
          }
          p.alive = false;
          _removeMesh(p.mesh);
          return;
        }
      }
    }
  }

  function _applySplashDamage(origin, damage, radius) {
    var allEnemy = _soldiers.concat(_mages).concat(_golems).concat(_bossSkeletons);
    for (var i = 0; i < allEnemy.length; i++) {
      var en = allEnemy[i];
      if (!en.alive) { continue; }
      var d = _vecDist(origin, en.mesh.position);
      if (d <= radius) {
        var falloff = 1 - (d / radius);
        en.hp -= Math.floor(damage * falloff);
        if (en.hp <= 0) {
          en.alive = false;
          en.mesh.visible = false;
        }
      }
    }
  }

  function _updateFrostWalls(dt) {
    for (var i = _frostWalls.length - 1; i >= 0; i--) {
      var fw = _frostWalls[i];
      if (!fw.alive) { continue; }
      fw.timer -= dt;
      if (fw.timer <= 0) {
        fw.alive = false;
        _removeMesh(fw.mesh);
        _frostWalls.splice(i, 1);
      }
    }
  }

  function _updateLightningBolts(dt) {
    for (var i = _lightningBolts.length - 1; i >= 0; i--) {
      var lb = _lightningBolts[i];
      lb.timer -= dt;
      if (lb.timer <= 0) {
        _removeMesh(lb.mesh);
        _lightningBolts.splice(i, 1);
      }
    }
  }

  function _updateShield(dt) {
    if (!_shieldActive) { return; }
    _shieldTimer -= dt;
    if (_shieldTimer <= 0) {
      _shieldActive = false;
      if (_shieldLight) { _shieldLight.visible = false; }
    } else if (_shieldLight && _playerPos) {
      _shieldLight.position.copy(_playerPos);
      _shieldLight.position.y = 2;
    }
  }

  function _updateEnemyAI(dt) {
    // Soldiers patrol/attack
    for (var si = 0; si < _soldiers.length; si++) {
      var sol = _soldiers[si];
      if (!sol.alive) { continue; }
      if (_playerPos) {
        var dx = _playerPos.x - sol.mesh.position.x;
        var dz = _playerPos.z - sol.mesh.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 40) {
          sol.mesh.position.x += (dx / dist) * sol.speed * dt;
          sol.mesh.position.z += (dz / dist) * sol.speed * dt;
        } else {
          // Random patrol
          sol.mesh.position.x += sol.moveDir.x * sol.speed * 0.5 * dt;
          sol.mesh.position.z += sol.moveDir.z * sol.speed * 0.5 * dt;
          // Bounce inside castle bounds
          if (Math.abs(sol.mesh.position.x) > 28) { sol.moveDir.x *= -1; }
          if (Math.abs(sol.mesh.position.z) > 28) { sol.moveDir.z *= -1; }
        }
      }
    }

    // Mages counter-spell (fire projectiles at player)
    for (var mi = 0; mi < _mages.length; mi++) {
      var mg = _mages[mi];
      if (!mg.alive) { continue; }
      mg.castTimer -= dt;
      if (mg.castTimer <= 0 && _playerPos) {
        mg.castTimer = _randomBetween(3, 6);
        var dir = _vecNorm(_vecSub(_playerPos, mg.mesh.position));
        _spawnProjectile(mg.mesh.position, dir, 20, 0, 0xAA44AA, 'enemy');
      }
    }

    // Golems: slow advance
    for (var gi = 0; gi < _golems.length; gi++) {
      var gl = _golems[gi];
      if (!gl.alive) { continue; }
      if (_playerPos) {
        var gdx = _playerPos.x - gl.mesh.position.x;
        var gdz = _playerPos.z - gl.mesh.position.z;
        var gdist = Math.sqrt(gdx * gdx + gdz * gdz);
        if (gdist > 3) {
          gl.mesh.position.x += (gdx / gdist) * gl.speed * dt;
          gl.mesh.position.z += (gdz / gdist) * gl.speed * dt;
        }
      }
    }
  }

  function _updatePlayerMovement(dt) {
    if (!_playerPos || !_camera) { return; }

    var camDir = new THREE.Vector3();
    _camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    var right = new THREE.Vector3();
    right.crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();

    var moveVec = new THREE.Vector3(0, 0, 0);
    if (_moveKeys.w) { moveVec.add(camDir); }
    if (_moveKeys.s) { moveVec.sub(camDir); }
    if (_moveKeys.a) { moveVec.sub(right); }
    if (_moveKeys.d) { moveVec.add(right); }

    if (moveVec.length() > 0) {
      moveVec.normalize();
      _playerPos.x += moveVec.x * _playerSpeed * dt;
      _playerPos.z += moveVec.z * _playerSpeed * dt;
    }

    if (_playerMesh) {
      _playerMesh.position.copy(_playerPos);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════════ */

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'stc-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#CCE8CC',
      'font:bold 13px monospace',
      'padding:6px 16px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }

    var aliveSoldiers = 0;
    for (var si = 0; si < _soldiers.length; si++) {
      if (_soldiers[si].alive) { aliveSoldiers++; }
    }

    var dragonStatus = _dragonDefeated ? 'DEFEATED' :
                       _dragonActive   ? 'ACTIVE'   : 'DORMANT';

    var alliedAlive = 0;
    for (var ai = 0; ai < _alliedMages.length; ai++) {
      if (_alliedMages[ai].alive) { alliedAlive++; }
    }

    var manaPercent = Math.floor((_mana / MANA_MAX) * 100);

    var bossHPStr = _bossActive ? String(Math.max(0, _bossHP)) : '---';

    _hudEl.textContent = [
      'CASTLE',
      '[MANA: ' + manaPercent + '%]',
      '[SOLDIERS: ' + aliveSoldiers + ']',
      '[DRAGON: ' + dragonStatus + ']',
      '[ALLIED MAGES: ' + alliedAlive + ']',
      '| DARK LORD: HP ' + bossHPStr
    ].join(' ');
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     INPUT
  ═══════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    var key = e.key.toLowerCase();
    var now = Date.now();

    // Activation tracking: S and C within 400ms
    if (key === 's' && !_active) {
      _sPressed = true;
      _sTime    = now;
      if (_cPressed && (now - _cTime) <= ACTIVATION_WINDOW) {
        _activate();
      }
    }
    if (key === 'c' && !_active) {
      _cPressed = true;
      _cTime    = now;
      if (_sPressed && (now - _sTime) <= ACTIVATION_WINDOW) {
        _activate();
      }
    }

    if (!_active) { return; }

    // Movement (no conflict with S activation — only active when module on)
    if (key === 'w') { _moveKeys.w = true; }
    if (key === 'a') { _moveKeys.a = true; }
    if (key === 's') { _moveKeys.s = true; }
    if (key === 'd') { _moveKeys.d = true; }

    // Magic spells
    if (key === 'q') { _castFireball(); }
    if (key === 'e') { _castFrostWall(); }
    if (key === 'r') { _castLightning(); }
    if (key === 't') { _castShield(); }
  }

  function _onKeyUp(e) {
    var key = e.key.toLowerCase();
    if (!_active) {
      // Reset activation tracking if key released
      if (key === 's') { _sPressed = false; }
      if (key === 'c') { _cPressed = false; }
      return;
    }
    if (key === 'w') { _moveKeys.w = false; }
    if (key === 'a') { _moveKeys.a = false; }
    if (key === 's') { _moveKeys.s = false; }
    if (key === 'd') { _moveKeys.d = false; }
  }

  function _onMouseMove(e) {
    if (!_active) { return; }
    _mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ACTIVATION / DEACTIVATION
  ═══════════════════════════════════════════════════════════════════════════ */

  function _activate() {
    if (_active) { return; }
    _active = true;
    _sPressed = false;
    _cPressed = false;

    // Build / show everything
    _buildCastle();
    _spawnSoldiers();
    _spawnMages();
    _spawnGolems();
    _buildDragon();
    _spawnAlliedMages();
    _buildBoss();

    // Spawn player marker
    var pGeo = new THREE.BoxGeometry(1, 2, 1);
    var pMat = _makeMat(0x33AA55);
    _playerMesh = new THREE.Mesh(pGeo, pMat);
    _playerPos  = new THREE.Vector3(0, 1, 50);
    _playerMesh.position.copy(_playerPos);
    _scene.add(_playerMesh);

    // Ambient light for scene
    var ambLight = new THREE.AmbientLight(0x443333, 0.8);
    ambLight.name = 'stc-ambient';
    _scene.add(ambLight);

    var dirLight = new THREE.DirectionalLight(0xFFAA66, 0.6);
    dirLight.position.set(20, 40, 30);
    dirLight.name = 'stc-dir';
    _scene.add(dirLight);

    // Fire glow from lava
    var lavaLight = new THREE.PointLight(0xFF4400, 1.5, 80);
    lavaLight.position.set(0, 1, 0);
    lavaLight.name = 'stc-lava';
    _scene.add(lavaLight);

    _buildHUD();

    _dragonTimer    = 0;
    _dragonFlyTimer = DRAGON_FLYBY_INTERVAL;
    _totalTime      = 0;
    _mana           = MANA_MAX;
  }

  function _deactivate() {
    if (!_active) { return; }
    _active = false;

    // Remove castle
    if (_castleGroup) {
      _scene.remove(_castleGroup);
      _castleGroup = null;
    }

    // Remove enemies
    var allMeshLists = [_soldiers, _mages, _golems, _bossSkeletons, _alliedMages];
    for (var li = 0; li < allMeshLists.length; li++) {
      for (var ei = 0; ei < allMeshLists[li].length; ei++) {
        _removeMesh(allMeshLists[li][ei].mesh);
      }
    }
    _soldiers = []; _mages = []; _golems = [];
    _bossSkeletons = []; _alliedMages = [];

    // Remove projectiles
    for (var pi = 0; pi < _projectiles.length; pi++) {
      _removeMesh(_projectiles[pi].mesh);
    }
    _projectiles = [];

    // Remove frost walls
    for (var fi = 0; fi < _frostWalls.length; fi++) {
      _removeMesh(_frostWalls[fi].mesh);
    }
    _frostWalls = [];

    // Remove lightning
    for (var lbi = 0; lbi < _lightningBolts.length; lbi++) {
      _removeMesh(_lightningBolts[lbi].mesh);
    }
    _lightningBolts = [];

    // Remove firebombs
    for (var fbi = 0; fbi < _dragonFirebombs.length; fbi++) {
      _removeMesh(_dragonFirebombs[fbi].mesh);
    }
    _dragonFirebombs = [];

    // Remove dragon
    if (_dragonGroup) { _scene.remove(_dragonGroup); _dragonGroup = null; }
    _dragonHead = null;

    // Remove boss
    if (_bossGroup) { _scene.remove(_bossGroup); _bossGroup = null; }

    // Remove player
    if (_playerMesh) { _removeMesh(_playerMesh); _playerMesh = null; }
    _playerPos = null;

    // Remove shield light
    if (_shieldLight) { _scene.remove(_shieldLight); _shieldLight = null; }

    // Remove added lights
    var toRemove = [];
    _scene.traverse(function (obj) {
      if (obj.name && obj.name.indexOf('stc-') === 0) {
        toRemove.push(obj);
      }
    });
    for (var ri = 0; ri < toRemove.length; ri++) {
      _scene.remove(toRemove[ri]);
    }

    // Remove HUD
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
      _hudEl = null;
    }

    _shieldActive = false;
    _bossActive   = false;
    _dragonActive = false;
    _dragonDefeated = false;
    _dragonHP     = 5;
    _bossHP       = 600;
    _bossPhase    = 0;
    _mana         = MANA_MAX;
    _moveKeys     = { w: false, a: false, s: false, d: false };
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    _clock  = new THREE.Clock();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
  }

  function update() {
    if (!_active) { return; }

    var dt = _clock.getDelta();
    dt = Math.min(dt, 0.05); // cap delta
    _totalTime += dt;

    // Mana regeneration
    _updateMana(dt);

    // Dragon timer
    if (!_dragonActive && !_dragonDefeated) {
      _dragonTimer += dt;
      if (_dragonTimer >= DRAGON_APPEAR_TIME) {
        _dragonActive = true;
        _dragonGroup.visible = true;
        _dragonFlyTimer = DRAGON_FLYBY_INTERVAL;
      }
    }
    if (_dragonActive && !_dragonDefeated) {
      _dragonFlyBy(dt);
      _updateDragonFirebombs(dt);
    }

    // Activate boss when all soldiers + golems dead
    if (!_bossActive) {
      var anyAlive = false;
      for (var si = 0; si < _soldiers.length; si++) {
        if (_soldiers[si].alive) { anyAlive = true; break; }
      }
      if (!anyAlive) { _activateBoss(); }
    }

    // Update all systems
    _updatePlayerMovement(dt);
    _updateEnemyAI(dt);
    _updateAlliedMages(dt);
    _updateProjectiles(dt);
    _updateFrostWalls(dt);
    _updateLightningBolts(dt);
    _updateShield(dt);
    _updateBoss(dt);
    _updateHUD();

    // Lava pulsing
    if (_lava && _lava.material) {
      _lava.material.emissiveIntensity = 0.4 + Math.sin(_totalTime * 2) * 0.2;
    }
  }

  function reset() {
    _deactivate();
    _sPressed = false;
    _cPressed = false;
    _sTime    = 0;
    _cTime    = 0;
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
