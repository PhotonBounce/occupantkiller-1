/* ───────────────────────────────────────────────────────────────────────────
   combat-swimming.js — Underwater combat and swimming mechanics
   Browser-based Three.js game module. THREE must be a global.

   Controls:
     C + W     — toggle swim mode (enter/exit water zone)
     WASD      — move while swimming (60% normal speed)
     Mouse     — look direction while swimming
     F         — slash with diving knife when submerged (range 3, 2s cooldown)

   Features:
     - Underwater zone (flat semi-transparent blue-green plane at Y=-2)
     - Oxygen meter: 30-second breath hold, 5 HP/sec damage when depleted
     - Resurfacing refills oxygen at 2× rate
     - Blue-green CSS overlay tint when submerged
     - 2 SCUBA enemy NPCs patrolling in figure-8 at Y=-3 to Y=-6
     - 3 anchored underwater mines (pulsing red PointLight, 50 HP + shockwave)
     - Underwater ammo cache crate (restores 100 ammo on pickup)
     - 20 rising bubble particles when submerged
     - Splash particle burst on water entry/exit
     - HUD bar: OXYGEN | DEPTH | KNIFE status (top-center, monospace)

   API: window.CombatSwimming = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */

window.CombatSwimming = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var WATER_SURFACE_Y   = -2;
  var WATER_PLANE_Y     = -2;
  var SWIM_SPEED_FACTOR = 0.6;
  var MAX_OXYGEN        = 30;          // seconds
  var O2_DEPLETE_RATE   = 1;           // per second while submerged
  var O2_REFILL_RATE    = 2;           // per second while surfaced (2x depletion)
  var DROWN_DAMAGE      = 5;           // HP per second when O2=0
  var KNIFE_RANGE       = 3;           // units
  var KNIFE_COOLDOWN    = 2;           // seconds
  var MINE_COUNT        = 3;
  var MINE_RADIUS       = 0.6;
  var MINE_TRIGGER_DIST = 1.5;
  var MINE_DAMAGE       = 50;
  var MINE_SHOCKWAVE    = 8;           // push-back units
  var SCUBA_COUNT       = 2;
  var SCUBA_PATROL_Y_LO = -6;
  var SCUBA_PATROL_Y_HI = -3;
  var BUBBLE_COUNT      = 20;
  var BUBBLE_RISE_SPEED = 1.2;
  var SPLASH_COUNT      = 6;
  var CACHE_PICKUP_DIST = 1;
  var CACHE_AMMO        = 100;

  /* ── State ──────────────────────────────────────────────────────────────── */
  var _scene          = null;
  var _camera         = null;
  var _playerPos      = null;
  var _playerHealth   = null;
  var _playerAmmo     = null;
  var _keys           = {};
  var _initialized    = false;
  var _swimMode       = false;
  var _isSubmerged    = false;
  var _wasSubmerged   = false;
  var _oxygen         = MAX_OXYGEN;
  var _drownAccum     = 0;
  var _knifeTimer     = 0;
  var _knifeSlashing  = false;
  var _cDown          = false;
  var _wDown          = false;
  var _swimToggleCooldown = 0;

  /* ── Three.js objects ───────────────────────────────────────────────────── */
  var _waterPlane     = null;
  var _scubaEnemies   = [];
  var _mines          = [];
  var _mineLights     = [];
  var _mineChains     = [];
  var _cacheObj       = null;
  var _cachePickedUp  = false;
  var _bubbles        = [];
  var _bubbleGeo      = null;
  var _splashParticles = [];

  /* ── DOM ─────────────────────────────────────────────────────────────────── */
  var _hud            = null;
  var _tintOverlay    = null;

  /* ── Figure-8 patrol state ──────────────────────────────────────────────── */
  var _scubaT         = [0, Math.PI]; // offset start positions

  /* ── Timing ──────────────────────────────────────────────────────────────── */
  var _time           = 0;

  /* ═══════════════════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════════════════ */
  function init(scene, camera, playerPos, playerHealth, playerAmmo) {
    if (_initialized) { reset(); }
    _scene        = scene;
    _camera       = camera;
    _playerPos    = playerPos    || { x: 0, y: 0, z: 0 };
    _playerHealth = playerHealth || { value: 100 };
    _playerAmmo   = playerAmmo   || { value: 0 };
    _oxygen       = MAX_OXYGEN;
    _swimMode     = false;
    _isSubmerged  = false;
    _time         = 0;
    _knifeTimer   = 0;
    _cachePickedUp = false;

    _buildWaterPlane();
    _buildScubaEnemies();
    _buildMines();
    _buildCache();
    _buildHUD();
    _buildTintOverlay();
    _attachKeys();

    _initialized = true;
  }

  /* ── Water plane ─────────────────────────────────────────────────────────── */
  function _buildWaterPlane() {
    var geo = new THREE.BoxGeometry(80, 0.5, 80);
    var mat = new THREE.MeshBasicMaterial({
      color:       0x006688,
      transparent: true,
      opacity:     0.5,
      depthWrite:  false
    });
    _waterPlane = new THREE.Mesh(geo, mat);
    _waterPlane.position.set(0, WATER_PLANE_Y, 0);
    _scene.add(_waterPlane);
  }

  /* ── SCUBA enemy NPCs ────────────────────────────────────────────────────── */
  function _buildScubaEnemies() {
    _scubaEnemies = [];
    for (var i = 0; i < SCUBA_COUNT; i++) {
      var group = new THREE.Group();

      /* body — cylinder */
      var bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
      var mat = new THREE.MeshLambertMaterial({ color: 0x113344 });
      var body = new THREE.Mesh(bodyGeo, mat);
      group.add(body);

      /* head — sphere */
      var headGeo = new THREE.SphereGeometry(0.28, 8, 8);
      var head = new THREE.Mesh(headGeo, mat);
      head.position.set(0, 0.8, 0);
      group.add(head);

      /* tank on back — box */
      var tankGeo = new THREE.BoxGeometry(0.2, 0.5, 0.15);
      var tank = new THREE.Mesh(tankGeo, mat);
      tank.position.set(0, 0.1, -0.35);
      group.add(tank);

      /* start position offset so they don't overlap */
      group.position.set(
        (i % 2 === 0 ? 6 : -6),
        SCUBA_PATROL_Y_HI,
        (i % 2 === 0 ? 4 : -4)
      );

      _scene.add(group);
      _scubaEnemies.push({
        group:   group,
        alive:   true,
        t:       _scubaT[i]
      });
    }
  }

  /* ── Underwater mines ────────────────────────────────────────────────────── */
  function _buildMines() {
    _mines      = [];
    _mineLights = [];
    _mineChains = [];

    var minePositions = [
      { x:  8, z:  5 },
      { x: -7, z:  9 },
      { x:  3, z: -8 }
    ];

    for (var i = 0; i < MINE_COUNT; i++) {
      var px = minePositions[i].x;
      var pz = minePositions[i].z;
      var mineY = -5;
      var floorY = -10;

      /* mine sphere */
      var geo = new THREE.SphereGeometry(MINE_RADIUS, 10, 10);
      var mat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, mineY, pz);
      _scene.add(mesh);

      /* pulsing PointLight */
      var light = new THREE.PointLight(0xFF4400, 1.5, 8);
      light.position.set(px, mineY, pz);
      _scene.add(light);

      /* chain — LineSegments from mine down to sea floor */
      var chainPoints = [
        new THREE.Vector3(px, mineY, pz),
        new THREE.Vector3(px, floorY, pz)
      ];
      var chainGeo = new THREE.BufferGeometry().setFromPoints(chainPoints);
      var chainMat = new THREE.LineBasicMaterial({ color: 0x888888 });
      var chain = new THREE.LineSegments(chainGeo, chainMat);
      _scene.add(chain);

      _mines.push({ mesh: mesh, light: light, alive: true, px: px, pz: pz, y: mineY });
      _mineLights.push(light);
      _mineChains.push(chain);
    }
  }

  /* ── Underwater ammo cache ───────────────────────────────────────────────── */
  function _buildCache() {
    var geo = new THREE.BoxGeometry(1.5, 1, 1);
    var mat = new THREE.MeshLambertMaterial({ color: 0x4A3000 });
    _cacheObj = new THREE.Mesh(geo, mat);
    _cacheObj.position.set(0, -10, 5);
    _scene.add(_cacheObj);
  }

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  function _buildHUD() {
    if (_hud) {
      document.body.removeChild(_hud);
    }
    _hud = document.createElement('div');
    _hud.id = 'cs-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:14px',
      'color:#00FFCC',
      'background:rgba(0,0,0,0.55)',
      'padding:6px 14px',
      'border-radius:4px',
      'display:none',
      'z-index:9999',
      'white-space:nowrap',
      'pointer-events:none',
      'text-shadow:0 0 6px #00FFCC'
    ].join(';');
    document.body.appendChild(_hud);
  }

  /* ── Tint overlay ────────────────────────────────────────────────────────── */
  function _buildTintOverlay() {
    if (_tintOverlay) {
      document.body.removeChild(_tintOverlay);
    }
    _tintOverlay = document.createElement('div');
    _tintOverlay.id = 'cs-tint';
    _tintOverlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(0,80,120,0.35)',
      'display:none',
      'z-index:9998',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_tintOverlay);
  }

  /* ── Key listeners ───────────────────────────────────────────────────────── */
  function _attachKeys() {
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  function _onKeyDown(e) {
    var k = e.key.toLowerCase();
    _keys[k] = true;

    /* C+W toggle swim mode */
    if (k === 'c') { _cDown = true; }
    if (k === 'w') { _wDown = true; }
    if (_cDown && _wDown && _swimToggleCooldown <= 0) {
      _swimMode = !_swimMode;
      _swimToggleCooldown = 0.5;
      if (!_swimMode) {
        /* force exit — push player above water */
        if (_playerPos && _playerPos.y < WATER_SURFACE_Y) {
          _playerPos.y = WATER_SURFACE_Y + 0.5;
        }
      }
    }

    /* F — diving knife slash */
    if (k === 'f' && _isSubmerged && _knifeTimer <= 0) {
      _doKnifeSlash();
    }
  }

  function _onKeyUp(e) {
    var k = e.key.toLowerCase();
    _keys[k] = false;
    if (k === 'c') { _cDown = false; }
    if (k === 'w') { _wDown = false; }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     UPDATE  (called every frame, dt = delta seconds)
     ═══════════════════════════════════════════════════════════════════════════ */
  function update(dt, playerPos, playerHealth, playerAmmo) {
    if (!_initialized) { return; }

    /* allow callers to pass fresh references each frame */
    if (playerPos)    { _playerPos    = playerPos; }
    if (playerHealth) { _playerHealth = playerHealth; }
    if (playerAmmo)   { _playerAmmo   = playerAmmo; }

    _time += dt;
    if (_swimToggleCooldown > 0) { _swimToggleCooldown -= dt; }

    /* ── Submersion detection ─────────────────────────────────────────────── */
    _wasSubmerged = _isSubmerged;
    _isSubmerged  = _swimMode && (_playerPos.y < WATER_SURFACE_Y);

    /* ── Water entry / exit splash ────────────────────────────────────────── */
    if (_isSubmerged !== _wasSubmerged) {
      _spawnSplash();
    }

    /* ── Tint overlay ─────────────────────────────────────────────────────── */
    if (_tintOverlay) {
      _tintOverlay.style.display = _isSubmerged ? 'block' : 'none';
    }

    /* ── Oxygen ───────────────────────────────────────────────────────────── */
    if (_isSubmerged) {
      _oxygen -= O2_DEPLETE_RATE * dt;
      if (_oxygen < 0) { _oxygen = 0; }
    } else if (_swimMode && _playerPos.y >= WATER_SURFACE_Y) {
      /* resurfaced while in swim mode — refill at 2x rate */
      _oxygen += O2_REFILL_RATE * dt;
      if (_oxygen > MAX_OXYGEN) { _oxygen = MAX_OXYGEN; }
    } else if (!_swimMode) {
      /* fully out of water */
      _oxygen += O2_REFILL_RATE * dt;
      if (_oxygen > MAX_OXYGEN) { _oxygen = MAX_OXYGEN; }
    }

    /* ── Drowning damage ──────────────────────────────────────────────────── */
    if (_isSubmerged && _oxygen <= 0) {
      _drownAccum += dt;
      while (_drownAccum >= 1) {
        _drownAccum -= 1;
        _playerHealth.value -= DROWN_DAMAGE;
        if (_playerHealth.value < 0) { _playerHealth.value = 0; }
      }
    } else {
      _drownAccum = 0;
    }

    /* ── Swimming movement ────────────────────────────────────────────────── */
    if (_swimMode) {
      _applySwimMovement(dt);
    }

    /* ── Knife cooldown ───────────────────────────────────────────────────── */
    if (_knifeTimer > 0) {
      _knifeTimer -= dt;
      if (_knifeTimer < 0) { _knifeTimer = 0; }
    }

    /* ── SCUBA patrol ─────────────────────────────────────────────────────── */
    _updateScubaPatrol(dt);

    /* ── Mine pulse & proximity ───────────────────────────────────────────── */
    _updateMines(dt);

    /* ── Cache pickup ─────────────────────────────────────────────────────── */
    _updateCache();

    /* ── Bubbles ──────────────────────────────────────────────────────────── */
    _updateBubbles(dt);

    /* ── Splash particles ─────────────────────────────────────────────────── */
    _updateSplash(dt);

    /* ── HUD ──────────────────────────────────────────────────────────────── */
    _updateHUD();
  }

  /* ── Swimming movement ───────────────────────────────────────────────────── */
  function _applySwimMovement(dt) {
    if (!_camera || !_playerPos) { return; }

    var speed = 4 * SWIM_SPEED_FACTOR; /* base 4 units/sec × 60% */
    var moved = false;

    /* derive forward/right from camera */
    var forward = new THREE.Vector3();
    _camera.getWorldDirection(forward);
    forward.normalize();

    var right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (_keys['w']) { _playerPos.x += forward.x * speed * dt; _playerPos.z += forward.z * speed * dt; moved = true; }
    if (_keys['s']) { _playerPos.x -= forward.x * speed * dt; _playerPos.z -= forward.z * speed * dt; moved = true; }
    if (_keys['a']) { _playerPos.x -= right.x * speed * dt; _playerPos.z -= right.z * speed * dt; moved = true; }
    if (_keys['d']) { _playerPos.x += right.x * speed * dt; _playerPos.z += right.z * speed * dt; moved = true; }

    /* vertical movement when submerged */
    if (_isSubmerged) {
      if (_keys[' ']) { _playerPos.y += speed * dt; }   /* space = rise */
      if (_keys['shift']) { _playerPos.y -= speed * dt; } /* shift = dive */
    }

    if (moved) { /* bubble spawn handled in _updateBubbles */ }
  }

  /* ── Knife slash ─────────────────────────────────────────────────────────── */
  function _doKnifeSlash() {
    _knifeTimer   = KNIFE_COOLDOWN;
    _knifeSlashing = true;

    if (!_playerPos) { return; }
    for (var i = 0; i < _scubaEnemies.length; i++) {
      var e = _scubaEnemies[i];
      if (!e.alive) { continue; }
      var ep = e.group.position;
      var dx = ep.x - _playerPos.x;
      var dy = ep.y - _playerPos.y;
      var dz = ep.z - _playerPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= KNIFE_RANGE) {
        _killScuba(i);
      }
    }

    /* reset slash flag after short visual moment */
    setTimeout(function () { _knifeSlashing = false; }, 200);
  }

  function _killScuba(i) {
    var e = _scubaEnemies[i];
    if (!e.alive) { return; }
    e.alive = false;
    _scene.remove(e.group);
  }

  /* ── SCUBA figure-8 patrol ───────────────────────────────────────────────── */
  function _updateScubaPatrol(dt) {
    var yRange  = SCUBA_PATROL_Y_HI - SCUBA_PATROL_Y_LO; /* 3 units */
    var yMid    = (SCUBA_PATROL_Y_HI + SCUBA_PATROL_Y_LO) / 2;

    for (var i = 0; i < _scubaEnemies.length; i++) {
      var e = _scubaEnemies[i];
      if (!e.alive) { continue; }

      e.t += dt * 0.4; /* speed of patrol */

      /* figure-8: Lissajous x=sin(t), z=sin(2t), scaled */
      var xOff = i === 0 ? 6 : -6;
      var zOff = i === 0 ? 4 : -4;
      var px = xOff + Math.sin(e.t) * 5;
      var pz = zOff + Math.sin(e.t * 2) * 3;
      var py = yMid + Math.sin(e.t * 0.7) * (yRange / 2);

      e.group.position.set(px, py, pz);
      /* face movement direction */
      e.group.rotation.y = Math.atan2(
        Math.cos(e.t) * 5,
        Math.cos(e.t * 2) * 3 * 2
      );
    }
  }

  /* ── Mines ───────────────────────────────────────────────────────────────── */
  function _updateMines(dt) {
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (!m.alive) { continue; }

      /* pulse light intensity */
      var pulse = 1.2 + Math.sin(_time * 3 + i * 2.1) * 0.8;
      m.light.intensity = pulse;

      /* proximity check */
      if (!_playerPos) { continue; }
      var dx = _playerPos.x - m.px;
      var dy = _playerPos.y - m.y;
      var dz = _playerPos.z - m.pz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < MINE_TRIGGER_DIST) {
        _explodeMine(i);
      }
    }
  }

  function _explodeMine(i) {
    var m = _mines[i];
    if (!m.alive) { return; }
    m.alive = false;

    /* damage player */
    _playerHealth.value -= MINE_DAMAGE;
    if (_playerHealth.value < 0) { _playerHealth.value = 0; }

    /* shockwave push — move player away from mine */
    if (_playerPos) {
      var dx = _playerPos.x - m.px;
      var dy = _playerPos.y - m.y;
      var dz = _playerPos.z - m.pz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      _playerPos.x += (dx / dist) * MINE_SHOCKWAVE;
      _playerPos.y += (dy / dist) * MINE_SHOCKWAVE;
      _playerPos.z += (dz / dist) * MINE_SHOCKWAVE;
    }

    /* remove objects from scene */
    _scene.remove(m.mesh);
    _scene.remove(m.light);
    if (_mineChains[i]) { _scene.remove(_mineChains[i]); }

    /* brief bright flash */
    var flash = new THREE.PointLight(0xFF8800, 8, 20);
    flash.position.set(m.px, m.y, m.pz);
    _scene.add(flash);
    setTimeout(function () { _scene.remove(flash); }, 300);
  }

  /* ── Cache ───────────────────────────────────────────────────────────────── */
  function _updateCache() {
    if (_cachePickedUp || !_cacheObj || !_playerPos) { return; }
    var cp = _cacheObj.position;
    var dx = _playerPos.x - cp.x;
    var dy = _playerPos.y - cp.y;
    var dz = _playerPos.z - cp.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < CACHE_PICKUP_DIST) {
      _cachePickedUp = true;
      _playerAmmo.value += CACHE_AMMO;
      _scene.remove(_cacheObj);
      _cacheObj = null;
    }
  }

  /* ── Bubbles ─────────────────────────────────────────────────────────────── */
  function _spawnBubble() {
    if (!_playerPos || !_isSubmerged) { return; }
    if (_bubbles.length >= BUBBLE_COUNT) { return; }

    /* random radius 0.1 – 0.3 */
    var r = 0.1 + Math.random() * 0.2;
    var geo = _bubbleGeo || new THREE.SphereGeometry(1, 6, 6);
    _bubbleGeo = geo;

    var mat = new THREE.MeshBasicMaterial({
      color:       0xAAEEFF,
      transparent: true,
      opacity:     0.4,
      depthWrite:  false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(r);

    /* spawn near player mouth area */
    mesh.position.set(
      _playerPos.x + (Math.random() - 0.5) * 0.4,
      _playerPos.y + 0.3,
      _playerPos.z + (Math.random() - 0.5) * 0.4
    );
    _scene.add(mesh);
    _bubbles.push({ mesh: mesh, vy: BUBBLE_RISE_SPEED + Math.random() * 0.5 });
  }

  var _bubbleSpawnTimer = 0;

  function _updateBubbles(dt) {
    if (_isSubmerged) {
      _bubbleSpawnTimer += dt;
      if (_bubbleSpawnTimer >= 0.12) {
        _bubbleSpawnTimer = 0;
        _spawnBubble();
      }
    }

    /* update existing bubbles */
    for (var i = _bubbles.length - 1; i >= 0; i--) {
      var b = _bubbles[i];
      b.mesh.position.y += b.vy * dt;

      /* slight horizontal drift */
      b.mesh.position.x += (Math.random() - 0.5) * 0.02;

      /* despawn when past surface */
      if (b.mesh.position.y > WATER_SURFACE_Y) {
        _scene.remove(b.mesh);
        _bubbles.splice(i, 1);
      }
    }
  }

  /* ── Splash particles ────────────────────────────────────────────────────── */
  function _spawnSplash() {
    if (!_playerPos) { return; }
    var sx = _playerPos.x;
    var sy = WATER_SURFACE_Y;
    var sz = _playerPos.z;

    for (var i = 0; i < SPLASH_COUNT; i++) {
      var geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(sx, sy, sz);

      /* outward velocity */
      var angle = (i / SPLASH_COUNT) * Math.PI * 2;
      var speed = 2 + Math.random() * 3;
      var vx = Math.cos(angle) * speed;
      var vy = 3 + Math.random() * 4;
      var vz = Math.sin(angle) * speed;

      _scene.add(mesh);
      _splashParticles.push({
        mesh: mesh,
        vx: vx,
        vy: vy,
        vz: vz,
        life: 0.8 + Math.random() * 0.4
      });
    }
  }

  function _updateSplash(dt) {
    for (var i = _splashParticles.length - 1; i >= 0; i--) {
      var p = _splashParticles[i];
      p.life -= dt;
      p.vy   -= 9.8 * dt; /* gravity */
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      if (p.life <= 0) {
        _scene.remove(p.mesh);
        _splashParticles.splice(i, 1);
      }
    }
  }

  /* ── HUD update ──────────────────────────────────────────────────────────── */
  function _updateHUD() {
    if (!_hud) { return; }

    if (!_swimMode) {
      _hud.style.display = 'none';
      return;
    }

    _hud.style.display = 'block';

    /* oxygen bar */
    var pct   = _oxygen / MAX_OXYGEN;
    var bars  = 8;
    var filled = Math.round(pct * bars);
    var bar   = '';
    for (var i = 0; i < bars; i++) {
      bar += i < filled ? '█' : '░';
    }

    /* depth */
    var depth = _playerPos ? Math.max(0, -((_playerPos.y) - WATER_SURFACE_Y)) : 0;
    var depthStr = depth.toFixed(1) + 'm';

    /* knife status */
    var knifeStr = _knifeTimer > 0
      ? ('CD ' + _knifeTimer.toFixed(1) + 's')
      : 'READY';

    /* remaining oxygen seconds */
    var oxygenSec = Math.ceil(_oxygen);

    _hud.textContent =
      'OXYGEN [' + bar + '] ' + oxygenSec + 's' +
      ' | DEPTH: ' + depthStr +
      ' | KNIFE [' + knifeStr + ']';
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RESET
     ═══════════════════════════════════════════════════════════════════════════ */
  function reset() {
    /* remove scene objects */
    if (_waterPlane) { _scene.remove(_waterPlane); _waterPlane = null; }

    for (var i = 0; i < _scubaEnemies.length; i++) {
      _scene.remove(_scubaEnemies[i].group);
    }
    _scubaEnemies = [];

    for (var j = 0; j < _mines.length; j++) {
      _scene.remove(_mines[j].mesh);
      _scene.remove(_mines[j].light);
    }
    for (var k = 0; k < _mineChains.length; k++) {
      _scene.remove(_mineChains[k]);
    }
    _mines      = [];
    _mineLights = [];
    _mineChains = [];

    if (_cacheObj) { _scene.remove(_cacheObj); _cacheObj = null; }

    for (var b = 0; b < _bubbles.length; b++) {
      _scene.remove(_bubbles[b].mesh);
    }
    _bubbles = [];

    for (var s = 0; s < _splashParticles.length; s++) {
      _scene.remove(_splashParticles[s].mesh);
    }
    _splashParticles = [];

    /* remove DOM */
    if (_hud && _hud.parentNode) { _hud.parentNode.removeChild(_hud); _hud = null; }
    if (_tintOverlay && _tintOverlay.parentNode) { _tintOverlay.parentNode.removeChild(_tintOverlay); _tintOverlay = null; }

    /* detach events */
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);

    /* reset state */
    _oxygen       = MAX_OXYGEN;
    _swimMode     = false;
    _isSubmerged  = false;
    _wasSubmerged = false;
    _drownAccum   = 0;
    _knifeTimer   = 0;
    _cachePickedUp = false;
    _keys         = {};
    _cDown        = false;
    _wDown        = false;
    _time         = 0;
    _bubbleSpawnTimer = 0;
    _initialized  = false;
  }

  /* ── Public API ──────────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
