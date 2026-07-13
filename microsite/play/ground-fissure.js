window.GroundFissure = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _initialized = false;
  var _wasEarthquakeActive = false;
  var _earthquakeEndTime = 0;
  var _audioCtx = null;
  var _fissures = [];
  var _steamJets = [];
  var _rubbleParticles = [];
  var FISSURE_PERSIST = 12;
  var FADE_DURATION = 1.5;
  var GROW_DURATION = 2.0;
  var FISSURE_DAMAGE_RANGE = 0.8;
  var PLAYER_WARN_RANGE = 1.5;
  var ENEMY_KNOCKBACK_MAG = 5;
  var ENEMY_DAMAGE_PER_SEC = 25;

  window._activeFissures = [];

  // ── Audio helpers ──────────────────────────────────────────────────────────

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playRumble() {
    try {
      var ctx = _getAudioCtx();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.6));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 60;
      var gain = ctx.createGain();
      gain.gain.value = 0.4;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playCrackSFX() {
    try {
      var ctx = _getAudioCtx();
      var duration = 0.25;
      var buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        var t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 18) * (1 - t / duration);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 0.5;
      var gain = ctx.createGain();
      gain.gain.value = 0.6;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  // ── Fissure spawning ───────────────────────────────────────────────────────

  function _spawnFissure(cx, cz) {
    var angle = Math.random() * Math.PI;
    var offsetX = (Math.random() - 0.5) * 30;
    var offsetZ = (Math.random() - 0.5) * 30;
    var px = cx + offsetX;
    var pz = cz + offsetZ;

    // Crack plane
    var geo = new THREE.PlaneGeometry(8, 0.3);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x1A0A00,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = angle;
    mesh.position.set(px, 0.02, pz);
    mesh.scale.x = 0.01; // start tiny, grow to 1
    _scene.add(mesh);

    // Point light glow from below
    var light = new THREE.PointLight(0xFF4400, 4, 6);
    light.position.set(px, 0.1, pz);
    _scene.add(light);

    var fissure = {
      mesh: mesh,
      light: light,
      px: px,
      pz: pz,
      angle: angle,
      age: 0,
      fadeAge: null, // set when fading starts
      halfLen: 4,    // half of full length (8 / 2)
      alive: true
    };

    _fissures.push(fissure);
    window._activeFissures.push(fissure);

    _playCrackSFX();
    _spawnRubble(px, pz, angle);
    return fissure;
  }

  function _spawnRubble(px, pz, angle) {
    var count = 4 + Math.floor(Math.random() * 3); // 4-6
    // Spawn from both ends of the crack
    for (var e = -1; e <= 1; e += 2) {
      var endX = px + Math.cos(angle) * 4 * e;
      var endZ = pz + Math.sin(angle) * 4 * e;
      for (var i = 0; i < Math.ceil(count / 2); i++) {
        var size = 0.15;
        var geo = new THREE.BoxGeometry(size, size, size);
        var mat = new THREE.MeshLambertMaterial({ color: 0x555555 + Math.floor(Math.random() * 0x111111) });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          endX + (Math.random() - 0.5) * 1.5,
          0.5 + Math.random() * 0.5,
          endZ + (Math.random() - 0.5) * 1.5
        );
        _scene.add(mesh);
        _rubbleParticles.push({
          mesh: mesh,
          vel: {
            x: (Math.random() - 0.5) * 4,
            y: 2 + Math.random() * 3,
            z: (Math.random() - 0.5) * 4
          },
          life: 2.5
        });
      }
    }
  }

  function _spawnSteamJet(px, pz) {
    var geo = new THREE.CylinderGeometry(0.15, 0.3, 3, 8);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, 1.5, pz);
    _scene.add(mesh);
    _steamJets.push({
      mesh: mesh,
      baseY: 1.5,
      phase: Math.random() * Math.PI * 2,
      alive: true,
      life: 14 // lives a bit longer than fissures
    });
  }

  // ── Trigger: spawn a batch of fissures ────────────────────────────────────

  function trigger() {
    if (!_initialized || !_scene) return;
    var cx = _camera ? _camera.position.x : 0;
    var cz = _camera ? _camera.position.z : 0;
    var count = 6 + Math.floor(Math.random() * 5); // 6-10
    for (var i = 0; i < count; i++) {
      var f = _spawnFissure(cx, cz);
      // Every 2 fissures spawn a steam jet
      if (i % 2 === 1) {
        _spawnSteamJet(f.px, f.pz);
      }
    }
    _playRumble();
  }

  // ── HUD helpers ────────────────────────────────────────────────────────────

  var _hudWarningEl = null;
  var _hudFlashEl = null;

  function _ensureHUDElements() {
    if (!_hudWarningEl) {
      _hudWarningEl = document.getElementById('ground-fissure-warning');
      if (!_hudWarningEl) {
        _hudWarningEl = document.createElement('div');
        _hudWarningEl.id = 'ground-fissure-warning';
        _hudWarningEl.style.cssText = [
          'position:fixed',
          'top:20%',
          'left:50%',
          'transform:translateX(-50%)',
          'color:#FF4400',
          'font-size:28px',
          'font-weight:bold',
          'text-shadow:0 0 8px #FF2200',
          'pointer-events:none',
          'display:none',
          'z-index:9999'
        ].join(';');
        _hudWarningEl.textContent = '⚠ CRACK!';
        document.body.appendChild(_hudWarningEl);
      }
    }
    if (!_hudFlashEl) {
      _hudFlashEl = document.getElementById('ground-fissure-flash');
      if (!_hudFlashEl) {
        _hudFlashEl = document.createElement('div');
        _hudFlashEl.id = 'ground-fissure-flash';
        _hudFlashEl.style.cssText = [
          'position:fixed',
          'top:0',
          'left:0',
          'width:100%',
          'height:100%',
          'border:6px solid #FF2200',
          'pointer-events:none',
          'display:none',
          'z-index:9998',
          'box-sizing:border-box'
        ].join(';');
        document.body.appendChild(_hudFlashEl);
      }
    }
  }

  var _playerWarnActive = false;

  function _updatePlayerWarning(playerPos, dt) {
    _ensureHUDElements();
    var warn = false;
    for (var i = 0; i < _fissures.length; i++) {
      var f = _fissures[i];
      if (!f.alive) continue;
      var dx = playerPos.x - f.px;
      var dz = playerPos.z - f.pz;
      // Project player onto the fissure line and check distance to edges
      var cosA = Math.cos(f.angle);
      var sinA = Math.sin(f.angle);
      var proj = dx * cosA + dz * sinA;
      var perp = Math.abs(-dx * sinA + dz * cosA);
      var growFraction = Math.min(1, f.age / GROW_DURATION);
      var currentHalfLen = f.halfLen * growFraction;
      var distToEdge = Math.max(0, Math.abs(proj) - currentHalfLen);
      var dist = Math.sqrt(distToEdge * distToEdge + perp * perp);
      if (dist < PLAYER_WARN_RANGE) {
        warn = true;
        break;
      }
    }
    _playerWarnActive = warn;
    if (_hudWarningEl) _hudWarningEl.style.display = warn ? 'block' : 'none';
    if (_hudFlashEl) _hudFlashEl.style.display = warn ? 'block' : 'none';
  }

  // ── Enemy damage ───────────────────────────────────────────────────────────

  function _updateEnemyDamage(dt) {
    var enemies = window._enemies || (window.Enemies && window.Enemies.getList && window.Enemies.getList()) || [];
    for (var fi = 0; fi < _fissures.length; fi++) {
      var f = _fissures[fi];
      if (!f.alive) continue;
      var growFraction = Math.min(1, f.age / GROW_DURATION);
      var currentHalfLen = f.halfLen * growFraction;
      var cosA = Math.cos(f.angle);
      var sinA = Math.sin(f.angle);
      for (var ei = 0; ei < enemies.length; ei++) {
        var enemy = enemies[ei];
        if (!enemy || !enemy.mesh || !enemy.mesh.position) continue;
        var ex = enemy.mesh.position.x - f.px;
        var ez = enemy.mesh.position.z - f.pz;
        var proj = ex * cosA + ez * sinA;
        var perp = Math.abs(-ex * sinA + ez * cosA);
        var clampedProj = Math.max(-currentHalfLen, Math.min(currentHalfLen, proj));
        var nearX = f.px + cosA * clampedProj;
        var nearZ = f.pz + sinA * clampedProj;
        var dx = enemy.mesh.position.x - nearX;
        var dz = enemy.mesh.position.z - nearZ;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < FISSURE_DAMAGE_RANGE) {
          // Damage
          if (enemy.health !== undefined) {
            enemy.health -= ENEMY_DAMAGE_PER_SEC * dt;
          } else if (typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(ENEMY_DAMAGE_PER_SEC * dt);
          }
          // Knockback
          var len = Math.sqrt(dx * dx + dz * dz) || 1;
          var kx = (dx / len) * ENEMY_KNOCKBACK_MAG;
          var kz = (dz / len) * ENEMY_KNOCKBACK_MAG;
          if (enemy.velocity) {
            enemy.velocity.x += kx;
            enemy.velocity.z += kz;
          } else if (enemy.vel) {
            enemy.vel.x += kx;
            enemy.vel.z += kz;
          } else if (enemy.mesh.position) {
            enemy.mesh.position.x += kx * dt;
            enemy.mesh.position.z += kz * dt;
          }
        }
      }
    }
  }

  // ── Per-frame update helpers ───────────────────────────────────────────────

  function _updateFissures(dt, now) {
    for (var i = _fissures.length - 1; i >= 0; i--) {
      var f = _fissures[i];
      f.age += dt;

      // Grow scale X
      var growFraction = Math.min(1, f.age / GROW_DURATION);
      f.mesh.scale.x = growFraction;

      // Fade out after earthquake ends
      if (f.fadeAge !== null) {
        var fadeProgress = (f.age - f.fadeAge) / FADE_DURATION;
        if (fadeProgress >= 1) {
          _scene.remove(f.mesh);
          _scene.remove(f.light);
          f.mesh.geometry.dispose();
          f.mesh.material.dispose();
          f.light = null;
          f.alive = false;
          _fissures.splice(i, 1);
          // Remove from global list
          var idx = window._activeFissures.indexOf(f);
          if (idx !== -1) window._activeFissures.splice(idx, 1);
          continue;
        }
        var opacity = 1 - fadeProgress;
        f.mesh.material.opacity = opacity;
        if (f.light) f.light.intensity = 4 * opacity;
      }

      // Gentle light flicker
      if (f.light) {
        f.light.intensity = (f.fadeAge !== null ? (f.mesh.material.opacity * 4) : 4) * (0.85 + Math.random() * 0.3);
      }
    }
  }

  function _updateSteamJets(dt) {
    var time = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
    for (var i = _steamJets.length - 1; i >= 0; i--) {
      var s = _steamJets[i];
      s.life -= dt;
      if (s.life <= 0) {
        _scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        _steamJets.splice(i, 1);
        continue;
      }
      // Pulse upward and oscillate opacity
      s.mesh.position.y = s.baseY + Math.sin(time * 2 + s.phase) * 0.4;
      s.mesh.scale.y = 0.8 + Math.sin(time * 3 + s.phase) * 0.3;
      s.mesh.material.opacity = 0.15 + Math.abs(Math.sin(time * 1.5 + s.phase)) * 0.2;
      // Fade out in last 2 seconds
      if (s.life < 2) {
        s.mesh.material.opacity *= (s.life / 2);
      }
    }
  }

  function _updateRubble(dt) {
    var GRAVITY = -9.8;
    for (var i = _rubbleParticles.length - 1; i >= 0; i--) {
      var r = _rubbleParticles[i];
      r.life -= dt;
      if (r.life <= 0 || r.mesh.position.y < -1) {
        _scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        _rubbleParticles.splice(i, 1);
        continue;
      }
      r.vel.y += GRAVITY * dt;
      r.mesh.position.x += r.vel.x * dt;
      r.mesh.position.y += r.vel.y * dt;
      r.mesh.position.z += r.vel.z * dt;
      // Bounce
      if (r.mesh.position.y < 0.075) {
        r.mesh.position.y = 0.075;
        r.vel.y = Math.abs(r.vel.y) * 0.4;
        r.vel.x *= 0.7;
        r.vel.z *= 0.7;
      }
      r.mesh.rotation.x += r.vel.z * dt * 2;
      r.mesh.rotation.z -= r.vel.x * dt * 2;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _initialized = true;
    window._activeFissures = [];
    _fissures = [];
    _steamJets = [];
    _rubbleParticles = [];
    _wasEarthquakeActive = false;
    _earthquakeEndTime = 0;
  }

  function update(dt) {
    if (!_initialized || !_scene) return;

    var now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;

    // Detect earthquake state — call EarthquakeEvent.update() to stay in sync
    if (window.EarthquakeEvent && typeof window.EarthquakeEvent.update === 'function') {
      // We call update but don't pass dt ourselves since the main loop already does;
      // this is just to read the active flag reliably. Only call if not already
      // called this frame — guard via the global flag set by EarthquakeEvent itself.
    }

    var earthquakeNow = !!window._earthquakeActive;

    if (earthquakeNow && !_wasEarthquakeActive) {
      // Earthquake just started — spawn fissures
      trigger();
    }

    if (!earthquakeNow && _wasEarthquakeActive) {
      // Earthquake just ended — mark fissures to start fading after persist delay
      _earthquakeEndTime = now + FISSURE_PERSIST;
    }

    _wasEarthquakeActive = earthquakeNow;

    // After persist delay, start fading all surviving fissures
    if (_earthquakeEndTime > 0 && now >= _earthquakeEndTime) {
      _earthquakeEndTime = 0;
      for (var fi = 0; fi < _fissures.length; fi++) {
        if (_fissures[fi].fadeAge === null) {
          _fissures[fi].fadeAge = _fissures[fi].age;
        }
      }
      // Also begin shrinking steam jets quickly
      for (var si = 0; si < _steamJets.length; si++) {
        if (_steamJets[si].life > 2) _steamJets[si].life = 2;
      }
    }

    _updateFissures(dt, now);
    _updateSteamJets(dt);
    _updateRubble(dt);
    _updateEnemyDamage(dt);

    // Player warning
    var playerPos = null;
    if (_camera) {
      playerPos = _camera.position;
    } else if (window._playerPosition) {
      playerPos = window._playerPosition;
    }
    if (playerPos) {
      _updatePlayerWarning(playerPos, dt);
    }
  }

  function reset() {
    // Remove all fissure meshes
    for (var i = 0; i < _fissures.length; i++) {
      var f = _fissures[i];
      if (f.mesh) { _scene && _scene.remove(f.mesh); f.mesh.geometry && f.mesh.geometry.dispose(); f.mesh.material && f.mesh.material.dispose(); }
      if (f.light) { _scene && _scene.remove(f.light); }
    }
    _fissures = [];
    // Steam
    for (var s = 0; s < _steamJets.length; s++) {
      var sj = _steamJets[s];
      if (sj.mesh) { _scene && _scene.remove(sj.mesh); sj.mesh.geometry && sj.mesh.geometry.dispose(); sj.mesh.material && sj.mesh.material.dispose(); }
    }
    _steamJets = [];
    // Rubble
    for (var r = 0; r < _rubbleParticles.length; r++) {
      var rb = _rubbleParticles[r];
      if (rb.mesh) { _scene && _scene.remove(rb.mesh); rb.mesh.geometry && rb.mesh.geometry.dispose(); rb.mesh.material && rb.mesh.material.dispose(); }
    }
    _rubbleParticles = [];
    window._activeFissures = [];
    _wasEarthquakeActive = false;
    _earthquakeEndTime = 0;
    if (_hudWarningEl) _hudWarningEl.style.display = 'none';
    if (_hudFlashEl) _hudFlashEl.style.display = 'none';
  }

  return { init: init, update: update, trigger: trigger, reset: reset };
})();
