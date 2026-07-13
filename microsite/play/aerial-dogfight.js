/* ───────────────────────────────────────────────────────────────────────────
   aerial-dogfight.js — Aerial Dogfight Mini-Game
   API: window.AerialDogfight = { init, update, reset }
   Controls:
     A + D (together)    → launch dogfight (spawns player + 3 enemy jets)
     W / S               → throttle up / down (20–120 units/s)
     A / D               → roll / bank left / right
     Mouse               → pitch / yaw (camera + jet)
     Shift               → afterburner (+40% speed, engine glow, particle trail)
     Space               → fire missile toward nearest locked enemy
     E                   → release chaff (4 cubes that detonate incoming missiles)
   ─────────────────────────────────────────────────────────────────────────── */
window.AerialDogfight = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active       = false;
  var _score        = 0;
  var _kills        = 0;
  var _missionClear = false;

  /* ── Player jet ────────────────────────────────────────────────────────── */
  var _playerJet    = null;
  var _playerHP     = 100;
  var _speed        = 60;          // current throttle speed units/s
  var _minSpeed     = 20;
  var _maxSpeed     = 120;
  var _throttleDir  = 0;           // +1 accel, -1 decel, 0 hold
  var _rollAngle    = 0;           // accumulated roll radians
  var _rollRate     = 0;           // current roll angular velocity
  var _missileCount = 4;
  var _chaff        = [];          // active chaff cubes
  var _chaffCooldown= 0;

  /* ── Afterburner ───────────────────────────────────────────────────────── */
  var _afterburner      = false;
  var _engineLight      = null;    // PointLight
  var _exhaustParticles = [];      // array of { mesh, life, vel }

  /* ── Mouse look ────────────────────────────────────────────────────────── */
  var _mouseX = 0;   // normalized -1..1
  var _mouseY = 0;
  var _pitchAngle = 0;
  var _yawAngle   = 0;

  /* ── Missiles ──────────────────────────────────────────────────────────── */
  var _playerMissiles = [];  // { mesh, target, vel, life }
  var _enemyMissiles  = [];  // { mesh, target, vel, life, light }

  /* ── Enemy jets ────────────────────────────────────────────────────────── */
  var _enemies = [];   // { group, hp, vel, fireTimer, alive, engineLight }

  /* ── Explosions ────────────────────────────────────────────────────────── */
  var _explosions = []; // { mesh, light, life }

  /* ── Lock-on ───────────────────────────────────────────────────────────── */
  var _lockedEnemy = null;
  var _lockReticle = null;  // DOM div
  var _lockWarningCtx = null;
  var _lockWarningOsc = null;
  var _lockWarningGain = null;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud       = null;   // DOM div
  var _vigEl     = null;   // DOM div for G-force vignette
  var _altWarnEl = null;   // DOM div for PULL UP
  var _clearEl   = null;   // DOM div for DOGFIGHT CLEAR

  /* ── G-force ───────────────────────────────────────────────────────────── */
  var _gForce       = 1;
  var _prevRollRate = 0;

  /* ── Input state ───────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── A+D simultaneous launch tracking ─────────────────────────────────── */
  var _adPressTime = { A: 0, D: 0 };
  var AD_WINDOW    = 0.25; // seconds both must be held together

  /* ── Internal timers ───────────────────────────────────────────────────── */
  var _lastTime = 0;

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildJetGroup(color) {
    var group = new THREE.Group();

    /* Fuselage */
    var fuseGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
    var fuseMat = new THREE.MeshLambertMaterial({ color: color });
    var fuse    = new THREE.Mesh(fuseGeo, fuseMat);
    fuse.rotation.x = Math.PI / 2;
    group.add(fuse);

    /* Delta wing left */
    var wingGeo  = new THREE.BoxGeometry(4, 0.1, 2);
    var wingMat  = new THREE.MeshLambertMaterial({ color: (color === 0x778899 ? 0x667788 : 0x882222) });
    var wingL    = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(0, 0, 0.5);
    wingL.rotation.y = -0.25;
    group.add(wingL);

    /* Delta wing right */
    var wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(0, 0, 0.5);
    wingR.rotation.y = 0.25;
    group.add(wingR);

    /* Engine left */
    var engGeo  = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
    var engMat  = new THREE.MeshLambertMaterial({ color: 0xAA4400, emissive: 0xAA4400, emissiveIntensity: 0.4 });
    var engL    = new THREE.Mesh(engGeo, engMat);
    engL.rotation.x = Math.PI / 2;
    engL.position.set(-0.6, 0, -2.8);
    group.add(engL);

    /* Engine right */
    var engR = new THREE.Mesh(engGeo, engMat);
    engR.rotation.x = Math.PI / 2;
    engR.position.set(0.6, 0, -2.8);
    group.add(engR);

    return group;
  }

  /* ════════════════════════════════════════════════════════════════════════
     DOGFIGHT LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launchDogfight() {
    if (_active) return;
    _active       = true;
    _score        = 0;
    _kills        = 0;
    _missionClear = false;
    _missileCount = 4;
    _playerHP     = 100;
    _speed        = 60;
    _pitchAngle   = 0;
    _yawAngle     = 0;
    _rollAngle    = 0;
    _rollRate     = 0;
    _gForce       = 1;

    /* Player jet */
    _playerJet = buildJetGroup(0x778899);
    _playerJet.position.set(0, 90, 0);
    _scene.add(_playerJet);

    /* Engine point light */
    _engineLight = new THREE.PointLight(0xFF6600, 1.5, 12);
    _engineLight.position.set(0, 90, -3);
    _scene.add(_engineLight);

    /* Enemy jets — loose formation */
    _enemies = [];
    var offsets = [
      new THREE.Vector3(15,  80 + Math.random() * 20, -30),
      new THREE.Vector3(-20, 85 + Math.random() * 15, -25),
      new THREE.Vector3(5,   95 + Math.random() * 5,  -50)
    ];
    for (var i = 0; i < 3; i++) {
      var eg = buildJetGroup(0x992222);
      eg.position.copy(offsets[i]);
      _scene.add(eg);
      var el = new THREE.PointLight(0xFF2200, 1, 10);
      el.position.copy(eg.position);
      _scene.add(el);
      _enemies.push({
        group:       eg,
        hp:          50,
        vel:         new THREE.Vector3(0, 0, 1),
        fireTimer:   2 + Math.random() * 3,
        alive:       true,
        engineLight: el
      });
    }

    showHUD();
    _clearEl.style.display = 'none';
    _altWarnEl.style.display = 'none';
    _vigEl.style.opacity = '0';
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD / DOM
  ════════════════════════════════════════════════════════════════════════ */

  function showHUD() {
    _hud.style.display = 'block';
    updateHUD();
  }

  function updateHUD() {
    if (!_active || !_hud) return;
    var spd  = Math.round(_speed);
    var alt  = _playerJet ? Math.round(_playerJet.position.y * 46.5) : 0; // rough metres
    var lock = _lockedEnemy ? 'LOCKED' : '---';
    _hud.textContent = 'JET [SPD: ' + spd + '] [ALT: ' + alt + 'm] [MISSILES: ' + _missileCount + '] [LOCK: ' + lock + '] | KILLS: ' + _kills + '/3';
  }

  /* ════════════════════════════════════════════════════════════════════════
     LOCK-ON RETICLE
  ════════════════════════════════════════════════════════════════════════ */

  function updateLockOn() {
    if (!_active || !_camera || !_playerJet) return;

    var FOV_COS   = Math.cos((40 / 2) * Math.PI / 180);
    var LOCK_DIST = 60;
    var camDir    = new THREE.Vector3();
    _camera.getWorldDirection(camDir);

    _lockedEnemy = null;
    var closest  = Infinity;

    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) continue;
      var toEnemy = new THREE.Vector3().subVectors(e.group.position, _playerJet.position);
      var dist    = toEnemy.length();
      if (dist > LOCK_DIST) continue;
      toEnemy.normalize();
      var dot = camDir.dot(toEnemy);
      if (dot >= FOV_COS && dist < closest) {
        closest      = dist;
        _lockedEnemy = e;
      }
    }

    if (_lockedEnemy) {
      _lockReticle.style.display = 'block';
      /* Rotate reticle */
      var rot = (Date.now() / 500) % (Math.PI * 2);
      _lockReticle.style.transform = 'translate(-50%,-50%) rotate(' + (rot * 180 / Math.PI) + 'deg)';
      /* Lock-on warning tone */
      if (!_lockWarningOsc) {
        startLockTone();
      }
    } else {
      _lockReticle.style.display = 'none';
      stopLockTone();
    }
  }

  function startLockTone() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx  = new AudioCtx();
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.frequency.value = 1200;
      osc.type = 'square';
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      _lockWarningCtx  = ctx;
      _lockWarningOsc  = osc;
      _lockWarningGain = gain;
    } catch (e) { /* audio not available */ }
  }

  function stopLockTone() {
    if (_lockWarningOsc) {
      try { _lockWarningOsc.stop(); } catch (e) { /* ignore */ }
      _lockWarningOsc  = null;
      _lockWarningGain = null;
      _lockWarningCtx  = null;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MISSILES
  ════════════════════════════════════════════════════════════════════════ */

  function fireMissile() {
    if (!_active || !_playerJet || _missileCount <= 0) return;
    if (!_lockedEnemy) return;
    _missileCount--;

    var geo  = new THREE.CylinderGeometry(0.08, 0.08, 1, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(_playerJet.position);
    mesh.rotation.x = Math.PI / 2;
    _scene.add(mesh);

    var dir = new THREE.Vector3().subVectors(_lockedEnemy.group.position, _playerJet.position).normalize();
    _playerMissiles.push({
      mesh:   mesh,
      target: _lockedEnemy,
      vel:    dir.multiplyScalar(80),
      life:   6
    });
  }

  function updatePlayerMissiles(dt) {
    for (var i = _playerMissiles.length - 1; i >= 0; i--) {
      var m = _playerMissiles[i];
      m.life -= dt;
      if (m.life <= 0) {
        _scene.remove(m.mesh);
        _playerMissiles.splice(i, 1);
        continue;
      }

      /* Homing: lerp velocity toward target */
      if (m.target && m.target.alive) {
        var toTarget = new THREE.Vector3().subVectors(m.target.group.position, m.mesh.position);
        var desiredDir = toTarget.normalize().multiplyScalar(80);
        m.vel.lerp(desiredDir, dt * 3);
      }

      m.mesh.position.addScaledVector(m.vel, dt);

      /* Check chaff intercept */
      var intercepted = false;
      for (var c = _chaff.length - 1; c >= 0; c--) {
        var ch = _chaff[c];
        if (!ch.mesh) continue;
        if (m.mesh.position.distanceTo(ch.mesh.position) < 3) {
          spawnExplosion(m.mesh.position.clone());
          _scene.remove(m.mesh);
          _playerMissiles.splice(i, 1);
          intercepted = true;
          break;
        }
      }
      if (intercepted) continue;

      /* Hit enemy */
      if (m.target && m.target.alive) {
        if (m.mesh.position.distanceTo(m.target.group.position) < 4) {
          spawnExplosion(m.target.group.position.clone());
          killEnemy(m.target);
          _scene.remove(m.mesh);
          _playerMissiles.splice(i, 1);
        }
      }
    }
  }

  function killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    _scene.remove(e.group);
    _scene.remove(e.engineLight);
    _kills++;
    _score += 500;
    updateHUD();
    if (_kills >= 3) {
      triggerMissionClear();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY AI MISSILES
  ════════════════════════════════════════════════════════════════════════ */

  function enemyFireMissile(e) {
    if (!_playerJet) return;
    var geo  = new THREE.CylinderGeometry(0.08, 0.08, 1, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFF6633 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(e.group.position);
    mesh.rotation.x = Math.PI / 2;
    _scene.add(mesh);

    var dir = new THREE.Vector3().subVectors(_playerJet.position, e.group.position).normalize();
    var lt  = new THREE.PointLight(0xFF4400, 2, 8);
    lt.position.copy(mesh.position);
    _scene.add(lt);

    _enemyMissiles.push({
      mesh:  mesh,
      light: lt,
      vel:   dir.multiplyScalar(65),
      life:  8
    });
  }

  function updateEnemyMissiles(dt) {
    for (var i = _enemyMissiles.length - 1; i >= 0; i--) {
      var m = _enemyMissiles[i];
      m.life -= dt;
      if (m.life <= 0) {
        _scene.remove(m.mesh);
        _scene.remove(m.light);
        _enemyMissiles.splice(i, 1);
        continue;
      }

      /* Homing toward player */
      if (_playerJet) {
        var toPlayer = new THREE.Vector3().subVectors(_playerJet.position, m.mesh.position);
        var dDir = toPlayer.normalize().multiplyScalar(65);
        m.vel.lerp(dDir, dt * 2.5);
      }

      m.mesh.position.addScaledVector(m.vel, dt);
      m.light.position.copy(m.mesh.position);

      /* Check chaff intercept */
      var hitChaff = false;
      for (var c = _chaff.length - 1; c >= 0; c--) {
        var ch = _chaff[c];
        if (!ch.mesh) continue;
        if (m.mesh.position.distanceTo(ch.mesh.position) < 3) {
          spawnExplosion(m.mesh.position.clone());
          _scene.remove(m.mesh);
          _scene.remove(m.light);
          _enemyMissiles.splice(i, 1);
          hitChaff = true;
          break;
        }
      }
      if (hitChaff) continue;

      /* Hit player */
      if (_playerJet && m.mesh.position.distanceTo(_playerJet.position) < 5) {
        spawnExplosion(_playerJet.position.clone());
        _playerHP -= 30;
        _scene.remove(m.mesh);
        _scene.remove(m.light);
        _enemyMissiles.splice(i, 1);
        if (_playerHP <= 0) {
          endDogfightFailure();
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSIONS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(pos) {
    var geo  = new THREE.SphereGeometry(3, 8, 8);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);

    var lt = new THREE.PointLight(0xFF6600, 8, 30);
    lt.position.copy(pos);
    _scene.add(lt);

    _explosions.push({ mesh: mesh, light: lt, life: 1.0 });
  }

  function updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life -= dt;
      if (ex.life <= 0) {
        _scene.remove(ex.mesh);
        _scene.remove(ex.light);
        _explosions.splice(i, 1);
        continue;
      }
      var t = ex.life;
      ex.mesh.material.opacity = t * 0.9;
      ex.light.intensity       = t * 8;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CHAFF
  ════════════════════════════════════════════════════════════════════════ */

  function releaseChaff() {
    if (!_active || !_playerJet || _chaffCooldown > 0) return;
    _chaffCooldown = 4;

    for (var i = 0; i < 4; i++) {
      var geo  = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var mat  = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(_playerJet.position);
      _scene.add(mesh);
      _chaff.push({
        mesh: mesh,
        vel:  new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ),
        life: 3.0
      });
    }
  }

  function updateChaff(dt) {
    _chaffCooldown = Math.max(0, _chaffCooldown - dt);
    for (var i = _chaff.length - 1; i >= 0; i--) {
      var c = _chaff[i];
      c.life -= dt;
      if (c.life <= 0) {
        _scene.remove(c.mesh);
        _chaff.splice(i, 1);
        continue;
      }
      c.mesh.position.addScaledVector(c.vel, dt);
      c.vel.multiplyScalar(0.97);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     AFTERBURNER PARTICLES
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExhaustParticle() {
    if (!_playerJet) return;
    var geo  = new THREE.SphereGeometry(0.15, 4, 4);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xFF4400, transparent: true, opacity: 1.0 });
    var mesh = new THREE.Mesh(geo, mat);

    /* Spawn at rear of jet in world space */
    var rear = new THREE.Vector3(0, 0, -3);
    rear.applyQuaternion(_playerJet.quaternion);
    rear.add(_playerJet.position);
    mesh.position.copy(rear);
    _scene.add(mesh);

    var spreadVel = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      0
    );
    var backDir = new THREE.Vector3(0, 0, -1).applyQuaternion(_playerJet.quaternion);
    backDir.multiplyScalar(8 + Math.random() * 4);
    backDir.add(spreadVel);

    _exhaustParticles.push({ mesh: mesh, life: 0.6, vel: backDir });
  }

  function updateExhaustParticles(dt) {
    for (var i = _exhaustParticles.length - 1; i >= 0; i--) {
      var p = _exhaustParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        _scene.remove(p.mesh);
        _exhaustParticles.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.material.opacity = p.life / 0.6;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY AI UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateEnemies(dt) {
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) continue;

      /* Chase: steer toward behind player */
      var targetPos = _playerJet ? _playerJet.position.clone() : e.group.position.clone();
      /* Aim to get behind player — offset behind player */
      if (_playerJet) {
        var behindPlayer = new THREE.Vector3(0, 0, -20).applyQuaternion(_playerJet.quaternion);
        targetPos.add(behindPlayer);
      }

      var toTarget = new THREE.Vector3().subVectors(targetPos, e.group.position);
      var dist     = toTarget.length();
      if (dist > 0.1) {
        var desiredVel = toTarget.normalize().multiplyScalar(55);
        e.vel.lerp(desiredVel, dt * 0.8);
      }

      /* Banking visual — tilt group toward turn */
      e.group.position.addScaledVector(e.vel, dt);
      e.engineLight.position.copy(e.group.position);

      /* Face direction of movement */
      if (e.vel.length() > 0.1) {
        var lookTarget = e.group.position.clone().add(e.vel);
        e.group.lookAt(lookTarget);
        e.group.rotateX(Math.PI / 2);
      }

      /* Fire timer */
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && _playerJet) {
        enemyFireMissile(e);
        e.fireTimer = 2 + Math.random() * 3;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER FLIGHT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayerFlight(dt) {
    if (!_playerJet || !_camera) return;

    /* Throttle */
    if (_keys['w'] || _keys['W']) { _speed = Math.min(_maxSpeed, _speed + 25 * dt); }
    if (_keys['s'] || _keys['S']) { _speed = Math.max(_minSpeed, _speed - 25 * dt); }

    /* Roll from A/D */
    var rollInput = 0;
    if (_keys['a'] || _keys['A']) rollInput -= 1;
    if (_keys['d'] || _keys['D']) rollInput += 1;
    _rollRate = rollInput * 2.0;
    _rollAngle += _rollRate * dt;

    /* G-force from roll rate change */
    var angAccel = Math.abs(_rollRate - _prevRollRate) / dt;
    _gForce = 1 + angAccel * 0.15;
    _gForce = Math.min(9, _gForce);
    _prevRollRate = _rollRate;

    /* Mouse look: pitch/yaw applied to jet and camera together */
    _pitchAngle += _mouseY * dt * 1.5;
    _yawAngle   += _mouseX * dt * 1.5;
    _pitchAngle  = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, _pitchAngle));

    /* Build jet quaternion from yaw * pitch * roll */
    var qYaw   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -_yawAngle);
    var qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), _pitchAngle);
    var qRoll  = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), _rollAngle);
    var jetQ   = new THREE.Quaternion().multiplyQuaternions(qYaw, qPitch).multiply(qRoll);

    _playerJet.quaternion.slerp(jetQ, dt * 5);
    /* Rotate fuselage to face forward (jet model is along Y axis) */
    var fwdLocal = new THREE.Vector3(0, 0, -1);
    /* The model fuselage already points along -Z via rotation.x = PI/2 in buildJetGroup */

    /* Afterburner */
    var effectiveSpeed = _speed;
    if (_afterburner) {
      effectiveSpeed *= 1.4;
      _engineLight.intensity = 6;
      _engineLight.color.setHex(0xFF6600);
      if (Math.random() < 0.6) spawnExhaustParticle();
    } else {
      _engineLight.intensity = 1.5;
    }

    /* Move forward */
    var forward = new THREE.Vector3(0, 0, -1).applyQuaternion(_playerJet.quaternion);
    _playerJet.position.addScaledVector(forward, effectiveSpeed * dt);

    /* Sync engine light */
    var engineOffset = new THREE.Vector3(0, 0, -3).applyQuaternion(_playerJet.quaternion);
    _engineLight.position.copy(_playerJet.position).add(engineOffset);

    /* Camera follows behind and above */
    var camOffset  = new THREE.Vector3(0, 4, 18).applyQuaternion(_playerJet.quaternion);
    var desiredCam = _playerJet.position.clone().add(camOffset);
    _camera.position.lerp(desiredCam, dt * 8);
    _camera.lookAt(_playerJet.position);

    /* Altitude warning */
    if (_playerJet.position.y < 20) {
      _altWarnEl.style.display = 'block';
      if (!_altWarnEl._blinkTimer) {
        _altWarnEl._blinkTimer = setInterval(function () {
          _altWarnEl.style.visibility = (_altWarnEl.style.visibility === 'hidden') ? 'visible' : 'hidden';
        }, 200);
      }
      /* Prevent going underground */
      if (_playerJet.position.y < 5) {
        _playerJet.position.y = 5;
      }
    } else {
      _altWarnEl.style.display = 'none';
      if (_altWarnEl._blinkTimer) {
        clearInterval(_altWarnEl._blinkTimer);
        _altWarnEl._blinkTimer = null;
      }
    }

    /* G-force vignette */
    var gNorm = Math.max(0, (_gForce - 1) / 8);
    _vigEl.style.opacity = String(gNorm * 0.85);

    /* Decay G-force */
    _gForce = Math.max(1, _gForce - dt * 3);
  }

  /* ════════════════════════════════════════════════════════════════════════
     MISSION END
  ════════════════════════════════════════════════════════════════════════ */

  function triggerMissionClear() {
    _missionClear = true;
    _clearEl.style.display = 'block';
    _clearEl.innerHTML = 'DOGFIGHT CLEAR<br><span style="font-size:18px">Score: ' + _score + ' pts | All 3 enemies downed</span>';
    stopLockTone();
  }

  function endDogfightFailure() {
    _active = false;
    _clearEl.style.display = 'block';
    _clearEl.innerHTML = 'JET DESTROYED<br><span style="font-size:18px">Score: ' + _score + ' | Kills: ' + _kills + '/3</span>';
    _clearEl.style.color = '#FF4444';
    stopLockTone();
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.key] = true;

    /* A+D simultaneous launch */
    if (e.key === 'a' || e.key === 'A') _adPressTime.A = Date.now();
    if (e.key === 'd' || e.key === 'D') _adPressTime.D = Date.now();
    var aDiff = Math.abs(_adPressTime.A - _adPressTime.D) / 1000;
    if ((_keys['a'] || _keys['A']) && (_keys['d'] || _keys['D']) && aDiff < AD_WINDOW && !_active) {
      launchDogfight();
    }

    /* Afterburner */
    if (e.key === 'Shift') _afterburner = true;

    /* Missile */
    if (e.key === ' ' && _active) {
      e.preventDefault();
      fireMissile();
    }

    /* Chaff */
    if ((e.key === 'e' || e.key === 'E') && _active) {
      releaseChaff();
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
    if (e.key === 'Shift') _afterburner = false;
  }

  function onMouseMove(e) {
    if (!_canvas) return;
    var rect = _canvas.getBoundingClientRect();
    _mouseX  = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    _mouseY  = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    /* HUD elements */
    _hud = document.createElement('div');
    _hud.id = 'dogfight-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.55)',
      'padding:6px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:900',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hud);

    _lockReticle = document.createElement('div');
    _lockReticle.id = 'dogfight-reticle';
    _lockReticle.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'width:48px',
      'height:48px',
      'border:3px solid #00FF88',
      'display:none',
      'pointer-events:none',
      'z-index:901',
      'box-shadow:0 0 8px #00FF88'
    ].join(';');
    var lockedLabel = document.createElement('div');
    lockedLabel.textContent = 'LOCKED';
    lockedLabel.style.cssText = 'position:absolute;top:52px;left:50%;transform:translateX(-50%);color:#00FF88;font-family:monospace;font-size:11px;white-space:nowrap;text-shadow:0 0 4px #00FF88';
    _lockReticle.appendChild(lockedLabel);
    document.body.appendChild(_lockReticle);

    _altWarnEl = document.createElement('div');
    _altWarnEl.id = 'dogfight-altwarning';
    _altWarnEl.textContent = '! PULL UP !';
    _altWarnEl.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FF2222',
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'pointer-events:none',
      'display:none',
      'z-index:902',
      'text-shadow:0 0 12px #FF2222'
    ].join(';');
    document.body.appendChild(_altWarnEl);

    _clearEl = document.createElement('div');
    _clearEl.id = 'dogfight-clear';
    _clearEl.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:32px',
      'font-weight:bold',
      'text-align:center',
      'background:rgba(0,0,0,0.75)',
      'padding:20px 40px',
      'border-radius:8px',
      'pointer-events:none',
      'display:none',
      'z-index:903',
      'text-shadow:0 0 16px #00FF88'
    ].join(';');
    document.body.appendChild(_clearEl);

    _vigEl = document.createElement('div');
    _vigEl.id = 'dogfight-vignette';
    _vigEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'bottom:0',
      'pointer-events:none',
      'z-index:899',
      'opacity:0',
      'background:radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.97) 100%)'
    ].join(';');
    document.body.appendChild(_vigEl);

    /* G-meter label inside vignette corner */
    var gLabel = document.createElement('div');
    gLabel.id = 'dogfight-gmeter';
    gLabel.style.cssText = 'position:fixed;bottom:14px;left:14px;color:#00FF88;font-family:monospace;font-size:13px;pointer-events:none;z-index:904';
    document.body.appendChild(gLabel);
    _vigEl._gLabel = gLabel;

    /* Input listeners */
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
  }

  function update(delta) {
    if (!_active || !_scene) return;

    var dt = delta || 0.016;

    updatePlayerFlight(dt);
    updateEnemies(dt);
    updatePlayerMissiles(dt);
    updateEnemyMissiles(dt);
    updateExplosions(dt);
    updateExhaustParticles(dt);
    updateChaff(dt);
    updateLockOn();

    /* G-meter display */
    if (_vigEl._gLabel) {
      _vigEl._gLabel.textContent = 'G: ' + _gForce.toFixed(1);
    }

    updateHUD();
  }

  function reset() {
    _active       = false;
    _missionClear = false;

    /* Remove player jet */
    if (_playerJet && _scene) {
      _scene.remove(_playerJet);
      _playerJet = null;
    }
    if (_engineLight && _scene) {
      _scene.remove(_engineLight);
      _engineLight = null;
    }

    /* Remove enemies */
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (_scene) {
        _scene.remove(e.group);
        _scene.remove(e.engineLight);
      }
    }
    _enemies = [];

    /* Remove missiles */
    for (var j = 0; j < _playerMissiles.length; j++) {
      if (_scene) _scene.remove(_playerMissiles[j].mesh);
    }
    _playerMissiles = [];

    for (var k = 0; k < _enemyMissiles.length; k++) {
      if (_scene) {
        _scene.remove(_enemyMissiles[k].mesh);
        _scene.remove(_enemyMissiles[k].light);
      }
    }
    _enemyMissiles = [];

    /* Remove explosions */
    for (var x = 0; x < _explosions.length; x++) {
      if (_scene) {
        _scene.remove(_explosions[x].mesh);
        _scene.remove(_explosions[x].light);
      }
    }
    _explosions = [];

    /* Remove particles */
    for (var p = 0; p < _exhaustParticles.length; p++) {
      if (_scene) _scene.remove(_exhaustParticles[p].mesh);
    }
    _exhaustParticles = [];

    /* Remove chaff */
    for (var cc = 0; cc < _chaff.length; cc++) {
      if (_scene) _scene.remove(_chaff[cc].mesh);
    }
    _chaff = [];

    /* Stop audio */
    stopLockTone();

    /* Reset DOM */
    if (_hud)       _hud.style.display      = 'none';
    if (_lockReticle) _lockReticle.style.display = 'none';
    if (_altWarnEl) {
      _altWarnEl.style.display = 'none';
      if (_altWarnEl._blinkTimer) {
        clearInterval(_altWarnEl._blinkTimer);
        _altWarnEl._blinkTimer = null;
      }
    }
    if (_clearEl)   _clearEl.style.display  = 'none';
    if (_vigEl)     _vigEl.style.opacity    = '0';

    _keys       = {};
    _mouseX     = 0;
    _mouseY     = 0;
    _score      = 0;
    _kills      = 0;
    _lockedEnemy = null;
    _afterburner = false;
  }

  return { init: init, update: update, reset: reset };

}());
