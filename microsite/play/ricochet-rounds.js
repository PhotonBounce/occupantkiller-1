/**
 * ricochet-rounds.js — Bullets bounce off walls and hit multiple enemies
 * window.RicochetRounds module
 *
 * Key: Shift+R to toggle ricochet mode (30 bullets, 60s recharge)
 * HUD: gold "🎱 RICOCHET ON [N]" indicator when active
 * Bullets bounce up to 3 times, damage reduces 25% per bounce
 * Trick shot bonus: +150 "RICOCHET KILL" toast after ≥1 bounce hit
 */
window.RicochetRounds = (function() {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MAX_BOUNCES      = 3;
  var BULLET_SPEED     = 8;      // units per dt step
  var MAX_BULLETS      = 30;     // ammo capacity
  var RECHARGE_RATE    = 10;     // bullets per 20 seconds when inactive
  var RECHARGE_PERIOD  = 20;     // seconds per RECHARGE_RATE bullets
  var BASE_DAMAGE      = 25;     // base damage per bullet
  var TRACER_RADIUS    = 0.08;
  var MARK_RADIUS      = 0.1;
  var FLASH_INTENSITY  = 5;
  var FLASH_RANGE      = 2;
  var FLASH_DURATION   = 0.08;   // seconds
  var TRACER_LIFE      = 1.2;    // seconds
  var MARK_LIFE        = 8.0;    // seconds ricochet marks stay on walls
  var HIT_RADIUS       = 0.55;   // enemy hit detection radius
  var SCREEN_FLASH_DUR = 0.35;   // yellow tint duration on trick-shot kill

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;
  var _active       = false;     // ricochet mode on/off
  var _ammo         = MAX_BULLETS;
  var _rechargeAcc  = 0;        // accumulator for recharge timer
  var _initialized  = false;

  // active bullets in flight
  var _bullets      = [];
  // temporary visual objects (tracers, marks, sparks)
  var _tracers      = [];
  var _marks        = [];
  var _sparks       = [];        // { light, timer, maxTimer }

  // HUD element
  var _hudEl        = null;

  // Screen flash overlay
  var _flashEl      = null;
  var _flashTimer   = 0;

  // Key state
  var _shiftDown    = false;
  var _rPressHandled = false;

  // AudioContext (shared or created)
  var _audioCtx     = null;

  // ── Audio helpers ─────────────────────────────────────────────────────────

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window._audioCtx = _audioCtx;
      } catch (e) { /* no audio ctx */ }
    }
    return _audioCtx;
  }

  // Metallic zing rising with each bounce (bounceIndex 0,1,2)
  function _playRicochetSound(bounceIndex) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var baseFreq = 800 + bounceIndex * 500;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);

      // Add metallic high overtone
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 3, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 6, ctx.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.14);
    } catch (e) { /* audio unavailable */ }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'ricochet-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'color:#FFD700',
      'text-shadow:0 0 8px rgba(255,180,0,0.9)',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid rgba(255,200,0,0.6)',
      'border-radius:6px',
      'padding:4px 12px',
      'z-index:220',
      'pointer-events:none',
      'display:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_active) {
      _hudEl.textContent = '🎱 RICOCHET ON [' + _ammo + ']';
      _hudEl.style.display = 'block';
      _hudEl.style.color = '#FFD700';
    } else if (_ammo < MAX_BULLETS) {
      _hudEl.textContent = '🎱 RICOCHET [' + _ammo + '/' + MAX_BULLETS + ']';
      _hudEl.style.display = 'block';
      _hudEl.style.color = '#AA8800';
    } else {
      _hudEl.style.display = 'none';
    }
  }

  // ── Screen flash ──────────────────────────────────────────────────────────

  function _createFlashEl() {
    if (_flashEl) return;
    _flashEl = document.createElement('div');
    _flashEl.id = 'ricochet-screen-flash';
    _flashEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9997',
      'background:rgba(255,200,0,0.15)',
      'opacity:0',
      'transition:opacity 0.05s ease'
    ].join(';');
    document.body.appendChild(_flashEl);
  }

  function _triggerScreenFlash() {
    if (!_flashEl) return;
    _flashTimer = SCREEN_FLASH_DUR;
    _flashEl.style.opacity = '1';
  }

  function _updateScreenFlash(dt) {
    if (!_flashEl || _flashTimer <= 0) return;
    _flashTimer -= dt;
    if (_flashTimer <= 0) {
      _flashTimer = 0;
      _flashEl.style.opacity = '0';
    } else {
      var pct = _flashTimer / SCREEN_FLASH_DUR;
      _flashEl.style.opacity = String(pct);
    }
  }

  // ── Toast helper ──────────────────────────────────────────────────────────

  function _toast(msg, color) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(msg, 2500, color || '#FFD700');
      }
    } catch (e) { /* no HUD */ }
  }

  // ── THREE helpers ─────────────────────────────────────────────────────────

  function _getScene() {
    return _scene || window._gameScene || null;
  }

  // ── Visual: gold tracer segment sphere ────────────────────────────────────

  function _spawnTracer(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    var geo = new THREE.SphereGeometry(TRACER_RADIUS, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFCC00, transparent: true, opacity: 0.85 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    _tracers.push({ mesh: mesh, timer: TRACER_LIFE, maxTimer: TRACER_LIFE });
  }

  // ── Visual: wall ricochet mark ────────────────────────────────────────────

  function _spawnWallMark(pos, normal) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    var geo = new THREE.CircleGeometry(MARK_RADIUS, 8);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xFFAA00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    // Offset slightly off wall to avoid z-fighting
    mesh.position.copy(pos).addScaledVector(normal, 0.02);
    // Orient circle to face the normal direction
    var up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(normal.dot(up)) > 0.9) {
      up.set(1, 0, 0);
    }
    var quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    mesh.quaternion.copy(quaternion);
    scene.add(mesh);
    _marks.push({ mesh: mesh, timer: MARK_LIFE, maxTimer: MARK_LIFE });
  }

  // ── Visual: spark burst at bounce point ───────────────────────────────────

  function _spawnSpark(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    var light = new THREE.PointLight(0xFFAA00, FLASH_INTENSITY, FLASH_RANGE);
    light.position.copy(pos);
    scene.add(light);
    _sparks.push({ light: light, timer: FLASH_DURATION, maxTimer: FLASH_DURATION });
  }

  // ── Wall collision ────────────────────────────────────────────────────────
  // Returns { hit: true, normal: THREE.Vector3 } or { hit: false }
  // Probes in X, Y, Z directions to find which axis is solid

  function _checkWallHit(pos) {
    var step = 0.15;
    var isSolid = (window.VoxelWorld && window.VoxelWorld.isSolid)
      ? window.VoxelWorld.isSolid
      : (window.isSolid || function() { return false; });

    // Test the current voxel — if solid, bullet is inside a wall (shouldn't happen normally)
    if (isSolid(pos.x, pos.y, pos.z)) {
      return { hit: true, normal: new THREE.Vector3(0, 1, 0) };
    }

    // Probe each axis to find wall normal
    var hitX = isSolid(pos.x + step, pos.y, pos.z) || isSolid(pos.x - step, pos.y, pos.z);
    var hitY = isSolid(pos.x, pos.y + step, pos.z) || isSolid(pos.x, pos.y - step, pos.z);
    var hitZ = isSolid(pos.x, pos.y, pos.z + step) || isSolid(pos.x, pos.y, pos.z - step);

    if (!hitX && !hitY && !hitZ) return { hit: false };

    // Determine dominant axis for normal
    var nx = 0, ny = 0, nz = 0;
    if (hitX) {
      nx = isSolid(pos.x + step, pos.y, pos.z) ? -1 : 1;
    }
    if (hitY && !hitX) {
      ny = isSolid(pos.x, pos.y + step, pos.z) ? -1 : 1;
    }
    if (hitZ && !hitX && !hitY) {
      nz = isSolid(pos.x, pos.y, pos.z + step) ? -1 : 1;
    }
    // If multiple axes hit, pick dominant
    if (hitX && hitZ && !hitY) {
      nx = isSolid(pos.x + step, pos.y, pos.z) ? -1 : 1;
      nz = 0; // use X axis
    }

    var normal = new THREE.Vector3(nx, ny, nz);
    if (normal.lengthSq() === 0) normal.set(0, 1, 0);
    normal.normalize();
    return { hit: true, normal: normal };
  }

  // ── Enemy hit test ────────────────────────────────────────────────────────

  function _checkEnemyHits(bullet) {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var enemies = Enemies.getAll();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      // Skip already-hit enemies for this bullet (chain tracking)
      if (bullet.hitEnemies.indexOf(i) >= 0) continue;

      var dist = bullet.pos.distanceTo(e.mesh.position);
      if (dist < HIT_RADIUS) {
        // Deal damage — reduce 25% per bounce
        var dmgMult = Math.pow(0.75, bullet.bounceCount);
        var dmg = Math.round(BASE_DAMAGE * dmgMult);
        Enemies.damage(e, dmg, false, 'ricochet');

        // Track hit enemy
        bullet.hitEnemies.push(i);

        // Trick shot: if hit after ≥1 bounce AND enemy dies
        if (bullet.bounceCount >= 1 && !e.alive) {
          _toast('+150 RICOCHET KILL!', '#FFD700');
          _triggerScreenFlash();
          if (window.GameManager && window.GameManager.addScore) {
            window.GameManager.addScore(150);
          } else if (window._score !== undefined) {
            window._score += 150;
          }
        }
      }
    }
  }

  // ── Fire a ricochet bullet ────────────────────────────────────────────────

  function _fireBullet() {
    if (!_active || _ammo <= 0) return;
    var cam = _camera || window._camera;
    if (!cam) return;
    if (typeof THREE === 'undefined') return;

    _ammo--;
    _updateHUD();

    // Get direction from camera
    var dir = new THREE.Vector3();
    cam.getWorldDirection(dir);

    var bullet = {
      pos:         cam.position.clone().addScaledVector(dir, 0.5),
      dir:         dir.clone(),
      bounceCount: 0,
      hitEnemies:  [],
      dead:        false
    };

    _bullets.push(bullet);

    if (_ammo <= 0) {
      _active = false;
      _toast('RICOCHET ammo depleted — recharging', '#AA8800');
      _updateHUD();
    }
  }

  // ── Activate / Deactivate ─────────────────────────────────────────────────

  function activate() {
    if (_active) {
      // Toggle off
      _active = false;
      _toast('Ricochet mode OFF', '#888888');
      _updateHUD();
      return;
    }
    if (_ammo <= 0) {
      _toast('No ricochet ammo! Recharging...', '#FF4444');
      return;
    }
    _active = true;
    _toast('🎱 RICOCHET ON — ' + _ammo + ' rounds', '#FFD700');
    _updateHUD();
  }

  // ── Key handlers ──────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if (e.shiftKey) _shiftDown = true;
    if (e.code === 'KeyR' && e.shiftKey && !_rPressHandled) {
      _rPressHandled = true;
      activate();
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') _shiftDown = false;
    if (e.code === 'KeyR') _rPressHandled = false;
  }

  // Hook into player shoot events
  function _onShoot() {
    if (!_active) return;
    _fireBullet();
  }

  // ── Update bullets in flight ───────────────────────────────────────────────

  function _updateBullets(dt) {
    var isSolid = (window.VoxelWorld && window.VoxelWorld.isSolid)
      ? window.VoxelWorld.isSolid
      : (window.isSolid || function() { return false; });

    var toRemove = [];
    for (var i = 0; i < _bullets.length; i++) {
      var b = _bullets[i];
      if (b.dead) { toRemove.push(i); continue; }

      // Step bullet forward
      var prevPos = b.pos.clone();
      b.pos.addScaledVector(b.dir, BULLET_SPEED * dt);

      // Spawn tracer at new position
      _spawnTracer(b.pos.clone());

      // Check enemy hits
      _checkEnemyHits(b);

      // Check wall collision
      if (isSolid(b.pos.x, b.pos.y, b.pos.z)) {
        if (b.bounceCount >= MAX_BOUNCES) {
          // Out of bounces — bullet dies
          b.dead = true;
          _spawnSpark(b.pos.clone());
          toRemove.push(i);
          continue;
        }

        // Probe to find the normal
        var wallResult = _checkWallHit(prevPos);
        var normal = wallResult.normal || new THREE.Vector3(0, 1, 0);

        // Reflect direction: r = d - 2(d·n)n
        var dot = b.dir.dot(normal);
        b.dir.addScaledVector(normal, -2 * dot);
        b.dir.normalize();

        // Push bullet out of wall
        b.pos.copy(prevPos).addScaledVector(b.dir, 0.2);

        b.bounceCount++;

        // Spawn wall mark and spark
        _spawnWallMark(prevPos.clone(), normal);
        _spawnSpark(prevPos.clone());
        _playRicochetSound(b.bounceCount - 1);

        // Check enemies immediately after bounce
        _checkEnemyHits(b);
      }

      // Kill bullet if it somehow exits a huge range (safety)
      var cam = _camera || window._camera;
      if (cam && b.pos.distanceTo(cam.position) > 200) {
        b.dead = true;
        toRemove.push(i);
      }
    }

    // Remove dead bullets (in reverse order)
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _bullets.splice(toRemove[j], 1);
    }
  }

  // ── Update tracer visuals ─────────────────────────────────────────────────

  function _updateTracers(dt) {
    var scene = _getScene();
    var toRemove = [];
    for (var i = 0; i < _tracers.length; i++) {
      var t = _tracers[i];
      t.timer -= dt;
      if (t.timer <= 0) {
        if (scene) scene.remove(t.mesh);
        if (t.mesh.geometry) t.mesh.geometry.dispose();
        if (t.mesh.material) t.mesh.material.dispose();
        toRemove.push(i);
      } else {
        t.mesh.material.opacity = (t.timer / t.maxTimer) * 0.85;
        // Shrink over time
        var scale = t.timer / t.maxTimer;
        t.mesh.scale.setScalar(0.4 + scale * 0.6);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _tracers.splice(toRemove[j], 1);
    }
  }

  // ── Update wall marks ─────────────────────────────────────────────────────

  function _updateMarks(dt) {
    var scene = _getScene();
    var toRemove = [];
    for (var i = 0; i < _marks.length; i++) {
      var m = _marks[i];
      m.timer -= dt;
      if (m.timer <= 0) {
        if (scene) scene.remove(m.mesh);
        if (m.mesh.geometry) m.mesh.geometry.dispose();
        if (m.mesh.material) m.mesh.material.dispose();
        toRemove.push(i);
      } else {
        // Fade out in last 2 seconds
        var fadeRatio = Math.min(1, m.timer / 2.0);
        m.mesh.material.opacity = fadeRatio * 0.8;
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _marks.splice(toRemove[j], 1);
    }
  }

  // ── Update spark flashes ──────────────────────────────────────────────────

  function _updateSparks(dt) {
    var scene = _getScene();
    var toRemove = [];
    for (var i = 0; i < _sparks.length; i++) {
      var s = _sparks[i];
      s.timer -= dt;
      if (s.timer <= 0) {
        if (scene) scene.remove(s.light);
        toRemove.push(i);
      } else {
        s.light.intensity = FLASH_INTENSITY * (s.timer / s.maxTimer);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _sparks.splice(toRemove[j], 1);
    }
  }

  // ── Ammo recharge ─────────────────────────────────────────────────────────

  function _updateRecharge(dt) {
    if (_active || _ammo >= MAX_BULLETS) return;
    _rechargeAcc += dt;
    if (_rechargeAcc >= RECHARGE_PERIOD) {
      _rechargeAcc -= RECHARGE_PERIOD;
      _ammo = Math.min(MAX_BULLETS, _ammo + RECHARGE_RATE);
      _updateHUD();
      if (_ammo < MAX_BULLETS) {
        _toast('Ricochet ammo: ' + _ammo + '/' + MAX_BULLETS, '#888800');
      } else {
        _toast('🎱 Ricochet ammo recharged!', '#FFD700');
      }
    }
  }

  // ── Clear all visual objects ───────────────────────────────────────────────

  function _clearVisuals() {
    var scene = _getScene();
    var i;

    for (i = 0; i < _tracers.length; i++) {
      var t = _tracers[i];
      if (scene) scene.remove(t.mesh);
      if (t.mesh.geometry) t.mesh.geometry.dispose();
      if (t.mesh.material) t.mesh.material.dispose();
    }
    _tracers = [];

    for (i = 0; i < _marks.length; i++) {
      var m = _marks[i];
      if (scene) scene.remove(m.mesh);
      if (m.mesh.geometry) m.mesh.geometry.dispose();
      if (m.mesh.material) m.mesh.material.dispose();
    }
    _marks = [];

    for (i = 0; i < _sparks.length; i++) {
      if (scene) scene.remove(_sparks[i].light);
    }
    _sparks = [];
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init(scene, camera) {
    if (_initialized) return;
    _initialized = true;

    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    _createHUD();
    _createFlashEl();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    // Hook into shoot events if the game provides a hook point
    if (typeof window._onShotForTracer !== 'undefined') {
      var prevHook = window._onShotForRicochet;
      window._onShotForRicochet = function() {
        if (prevHook) prevHook();
        _onShoot();
      };
    }

    // Also listen for a custom shoot event that game-manager may dispatch
    document.addEventListener('player-shoot', _onShoot);

    _updateHUD();
  }

  function update(dt) {
    // Lazy resolve scene/camera
    if (!_scene)  _scene  = window._gameScene || null;
    if (!_camera) _camera = window._camera    || null;

    var realDt = dt || 0.016;

    _updateBullets(realDt);
    _updateTracers(realDt);
    _updateMarks(realDt);
    _updateSparks(realDt);
    _updateRecharge(realDt);
    _updateScreenFlash(realDt);
  }

  function reset() {
    _active      = false;
    _ammo        = MAX_BULLETS;
    _rechargeAcc = 0;
    _flashTimer  = 0;
    _bullets     = [];
    _clearVisuals();
    if (_hudEl)   _hudEl.style.display   = 'none';
    if (_flashEl) _flashEl.style.opacity = '0';
  }

  return {
    init:     init,
    update:   update,
    activate: activate,
    reset:    reset,
    // expose for game-manager shoot hook
    onShoot:  _onShoot
  };

})();
