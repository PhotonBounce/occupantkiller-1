// ============================================================
//  decoy-flare.js — IR decoy flare countermeasure system
//  Ctrl+F deploys a burst of 3 bright flares to confuse guided
//  missiles and enemy IR sensors in a Three.js FPS game.
//
//  Features:
//   - 3-flare burst per deploy, arcing in slightly different dirs
//   - Each flare has PointLight (warm white, 2.5 intensity, 15m)
//   - Missiles (guided projectiles) have 70% chance to re-target flare
//   - window._playerIRSignature drops to 0.2 while flares active
//   - White particle trails (5 particles/s per flare, fade 1s)
//   - Auto-deploy when window._autoFlare === true & helicopter fires
//   - Capacity: 8 units, 3 per deploy, 15s recharge per unit
//   - Night mode: extra PointLight at 1.2 intensity for 30m illumination
//   - HUD: "FLARES [N] ■■■■■■■■"
//
//  Public API: init(scene, camera, renderer), update(dt),
//              deploy(), reset()
// ============================================================
window.DecoyFlare = (function () {
  'use strict';

  /* ── Constants ───────────────────────────────────────────── */
  var FLARES_PER_BURST   = 3;
  var MAX_CAPACITY       = 8;
  var RECHARGE_TIME      = 15;    // seconds per unit
  var BURN_DURATION      = 8;     // seconds each flare burns
  var GRAVITY            = -4;    // slower fall for spectacle
  var INITIAL_SPEED      = 8;     // horizontal launch speed
  var INITIAL_VY         = 6;     // initial upward velocity
  var SPREAD_ANGLE_DEG   = 15;    // ±15° spread from player facing
  var DECOY_RANGE        = 20;    // metres — missile decoy range
  var DECOY_CHANCE       = 0.70;  // 70% chance to re-target
  var IR_SIGNATURE_LOW   = 0.2;
  var IR_SIGNATURE_NORM  = 1.0;
  var PARTICLE_RATE      = 5;     // particles per second per flare
  var PARTICLE_LIFE      = 1.0;   // seconds
  var NIGHT_LIGHT_RANGE  = 30;    // metres
  var NIGHT_LIGHT_INTEN  = 1.2;

  /* ── Shared geometries (lazy) ────────────────────────────── */
  var _sphereGeo   = null;
  var _particleGeo = null;

  function _lazyGeos() {
    if (!_sphereGeo)   _sphereGeo   = new THREE.SphereGeometry(0.08, 8, 6);
    if (!_particleGeo) _particleGeo = new THREE.SphereGeometry(0.025, 4, 4);
  }

  /* ── Module state ─────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;

  var _flares   = [];   // active flare objects
  var _capacity = MAX_CAPACITY;
  var _recharge = 0;    // accumulated recharge seconds
  var _hudEl    = null;

  var _keyHandlerAttached = false;

  /* ── Helpers ─────────────────────────────────────────────── */
  function _deg2rad(d) { return d * Math.PI / 180; }

  function _isNightMode() {
    return (typeof window.NightAssault !== 'undefined' &&
            window.NightAssault !== null &&
            (window.NightAssault.isActive === true ||
             (typeof window.NightAssault.isActive === 'function' && window.NightAssault.isActive())));
  }

  /* ── Build one flare mesh + lights ──────────────────────────
     Returns an object with all Three.js refs and physics state  */
  function _createFlare(startPos, horizDir) {
    _lazyGeos();

    // Mesh — bright white-yellow
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFEE88 });
    var mesh = new THREE.Mesh(_sphereGeo, mat);
    mesh.position.copy(startPos);
    if (_scene) _scene.add(mesh);

    // Main warm-white point light
    var light = new THREE.PointLight(0xFFEECC, 2.5, 15);
    light.position.copy(startPos);
    if (_scene) _scene.add(light);

    // Night-mode wide-area illumination light (only when NightAssault active)
    var nightLight = null;
    if (_isNightMode()) {
      nightLight = new THREE.PointLight(0xFFDDAA, NIGHT_LIGHT_INTEN, NIGHT_LIGHT_RANGE);
      nightLight.position.copy(startPos);
      if (_scene) _scene.add(nightLight);
    }

    return {
      mesh:      mesh,
      mat:       mat,
      light:     light,
      nightLight: nightLight,
      // physics
      vx: horizDir.x * INITIAL_SPEED,
      vy: INITIAL_VY,
      vz: horizDir.z * INITIAL_SPEED,
      // state
      burnTimer:    0,
      active:       true,
      // particles
      particles:    [],
      particleTimer: 0,
      // convenient world-position reference for external systems
      position:     mesh.position,
    };
  }

  /* ── Spawn one white trail particle near a flare ─────────── */
  function _spawnParticle(flare) {
    if (!_scene) return;
    _lazyGeos();
    var mat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    var mesh = new THREE.Mesh(_particleGeo, mat);
    // Slight random offset from flare centre
    mesh.position.copy(flare.mesh.position);
    mesh.position.x += (Math.random() - 0.5) * 0.15;
    mesh.position.y += (Math.random() - 0.5) * 0.15;
    mesh.position.z += (Math.random() - 0.5) * 0.15;
    _scene.add(mesh);
    flare.particles.push({ mesh: mesh, mat: mat, life: PARTICLE_LIFE });
  }

  /* ── Update + expire trail particles for one flare ──────── */
  function _updateParticles(flare, dt) {
    for (var i = flare.particles.length - 1; i >= 0; i--) {
      var p = flare.particles[i];
      p.life -= dt;
      // Drift slightly upward
      p.mesh.position.y += 0.15 * dt;
      var t = Math.max(0, p.life / PARTICLE_LIFE);
      p.mat.opacity = t;
      if (p.life <= 0) {
        if (_scene) _scene.remove(p.mesh);
        if (p.mat && p.mat.dispose) p.mat.dispose();
        flare.particles.splice(i, 1);
      }
    }
  }

  /* ── Destroy all Three.js objects owned by a flare ─────── */
  function _destroyFlare(flare) {
    if (!flare) return;
    if (_scene) {
      if (flare.mesh)       _scene.remove(flare.mesh);
      if (flare.light)      _scene.remove(flare.light);
      if (flare.nightLight) _scene.remove(flare.nightLight);
    }
    for (var i = 0; i < flare.particles.length; i++) {
      var p = flare.particles[i];
      if (_scene) _scene.remove(p.mesh);
      if (p.mat && p.mat.dispose) p.mat.dispose();
    }
    flare.particles = [];
    if (flare.mat && flare.mat.dispose) flare.mat.dispose();
    flare.active = false;
  }

  /* ── Update IR signature global ─────────────────────────── */
  function _updateIRSignature() {
    var anyActive = false;
    for (var i = 0; i < _flares.length; i++) {
      if (_flares[i].active) { anyActive = true; break; }
    }
    window._playerIRSignature = anyActive ? IR_SIGNATURE_LOW : IR_SIGNATURE_NORM;

    // Notify thermal detection systems
    if (anyActive) {
      if (typeof window.ChemicalWarfare !== 'undefined' &&
          window.ChemicalWarfare !== null &&
          typeof window.ChemicalWarfare.onIRSignatureChanged === 'function') {
        window.ChemicalWarfare.onIRSignatureChanged(IR_SIGNATURE_LOW);
      }
      if (typeof window.ThermalDetection !== 'undefined' &&
          window.ThermalDetection !== null &&
          typeof window.ThermalDetection.onIRSignatureChanged === 'function') {
        window.ThermalDetection.onIRSignatureChanged(IR_SIGNATURE_LOW);
      }
    }
  }

  /* ── Redirect incoming guided missiles towards nearest flare */
  function _updateMissileDecoy() {
    // Support various common projectile array names
    var lists = [
      window.guidedProjectiles,
      window.missiles,
      window.enemyMissiles,
    ];
    for (var li = 0; li < lists.length; li++) {
      var list = lists[li];
      if (!Array.isArray(list)) continue;
      for (var pi = 0; pi < list.length; pi++) {
        var proj = list[pi];
        if (!proj) continue;
        // Only interfere with projectiles that target the player
        if (proj.target !== 'player' &&
            proj.target !== window.player &&
            !(proj.targetPlayer === true)) continue;
        // Find nearest active flare within DECOY_RANGE
        var nearest  = null;
        var nearDist = Infinity;
        for (var fi = 0; fi < _flares.length; fi++) {
          var fl = _flares[fi];
          if (!fl.active) continue;
          var dx = fl.position.x - proj.position.x;
          var dy = fl.position.y - proj.position.y;
          var dz = fl.position.z - proj.position.z;
          var d  = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < DECOY_RANGE && d < nearDist) {
            nearDist = d;
            nearest  = fl;
          }
        }
        if (nearest && Math.random() < DECOY_CHANCE) {
          proj.target = nearest.position;
        }
      }
    }
  }

  /* ── Check auto-deploy trigger from enemy helicopter ───────*/
  function _checkAutoFlare() {
    if (!window._autoFlare) return;
    if (_capacity <= 0) return;
    if (typeof window.EnemyHelicopter === 'undefined' || !window.EnemyHelicopter) return;
    var heli = window.EnemyHelicopter;
    var firing = (heli.isFiringMissile === true) ||
                 (typeof heli.isFiringMissile === 'function' && heli.isFiringMissile()) ||
                 (heli.missilesFired === true);
    if (firing) {
      deploy();
    }
  }

  /* ── Build the HUD element ──────────────────────────────── */
  function _buildHUD() {
    var existing = document.getElementById('decoy-flare-hud');
    if (existing) { _hudEl = existing; return; }
    var el = document.createElement('div');
    el.id = 'decoy-flare-hud';
    el.style.cssText =
      'position:fixed;bottom:370px;left:50%;transform:translateX(-50%);' +
      'color:#FFE066;font-size:11px;font-family:monospace;z-index:200;pointer-events:none;' +
      'background:rgba(0,0,0,0.55);padding:2px 10px;border-radius:3px;' +
      'border:1px solid #FFE066;letter-spacing:1px;';
    document.body.appendChild(el);
    _hudEl = el;
  }

  /* ── Refresh HUD display ────────────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    var filled   = _capacity;
    var empty    = MAX_CAPACITY - _capacity;
    var barFull  = '';
    var barEmpty = '';
    for (var i = 0; i < filled; i++) barFull  += '■';   // ■
    for (var i = 0; i < empty; i++)  barEmpty += '□';   // □
    _hudEl.textContent = 'FLARES [' + _capacity + '] ' + barFull + barEmpty;
  }

  /* ── Key-binding: Ctrl+F ─────────────────────────────────── */
  function _attachKeyHandler() {
    if (_keyHandlerAttached) return;
    _keyHandlerAttached = true;
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && (e.code === 'KeyF' || e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        deploy();
      }
    });
  }

  /* ── Public: init ────────────────────────────────────────── */
  function init(scene, camera, renderer) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;
    _flares   = [];
    _capacity = MAX_CAPACITY;
    _recharge = 0;

    window._playerIRSignature = IR_SIGNATURE_NORM;

    _buildHUD();
    _updateHUD();
    _attachKeyHandler();
  }

  /* ── Public: deploy — launch 3-flare burst ──────────────── */
  function deploy() {
    if (!_scene || !_camera) return;
    if (_capacity < FLARES_PER_BURST) {
      if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
        window.HUD.notifyPickup('NO FLARES', '#FF4444');
      }
      return;
    }

    _capacity -= FLARES_PER_BURST;

    // Player-facing horizontal direction
    var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    fwd.y = 0;
    if (fwd.lengthSq() < 0.0001) fwd.set(0, 0, -1);
    fwd.normalize();

    var startPos = _camera.position.clone();
    startPos.y -= 0.15; // slightly below eye level

    // Launch 3 flares with ±SPREAD_ANGLE_DEG spread
    var angleOffsets = [-SPREAD_ANGLE_DEG, 0, SPREAD_ANGLE_DEG];
    for (var i = 0; i < FLARES_PER_BURST; i++) {
      var rad   = _deg2rad(angleOffsets[i] + (Math.random() - 0.5) * 8);
      var cosA  = Math.cos(rad);
      var sinA  = Math.sin(rad);
      var hDir  = new THREE.Vector3(
        fwd.x * cosA - fwd.z * sinA,
        0,
        fwd.x * sinA + fwd.z * cosA
      );
      var flare = _createFlare(startPos.clone(), hDir);
      _flares.push(flare);
    }

    if (typeof window.HUD !== 'undefined' && window.HUD.notifyPickup) {
      window.HUD.notifyPickup('DECOY FLARES DEPLOYED [Ctrl+F]', '#FFE066');
    }
    _updateHUD();
  }

  /* ── Public: update(dt) — called every frame ────────────── */
  function update(dt) {
    if (!dt || dt <= 0) return;

    var time = (typeof performance !== 'undefined') ? performance.now() * 0.001 : 0;

    // Update each active flare
    for (var i = _flares.length - 1; i >= 0; i--) {
      var f = _flares[i];
      if (!f.active) {
        _flares.splice(i, 1);
        continue;
      }

      // ── Physics ──
      f.vy += GRAVITY * dt;
      f.mesh.position.x  += f.vx * dt;
      f.mesh.position.y  += f.vy * dt;
      f.mesh.position.z  += f.vz * dt;
      f.light.position.copy(f.mesh.position);
      if (f.nightLight) f.nightLight.position.copy(f.mesh.position);

      // Slow tumble
      f.mesh.rotation.x += dt * 3;
      f.mesh.rotation.z += dt * 2;

      // Ground clamp
      var groundY = 0;
      if (typeof window.VoxelWorld !== 'undefined' && window.VoxelWorld &&
          typeof window.VoxelWorld.getTerrainHeight === 'function') {
        groundY = window.VoxelWorld.getTerrainHeight(
          f.mesh.position.x, f.mesh.position.z) || 0;
      }
      if (f.mesh.position.y < groundY) {
        f.mesh.position.y = groundY;
        f.vy = 0; f.vx *= 0.1; f.vz *= 0.1; // bounce damp
      }

      // ── Burn timer ──
      f.burnTimer += dt;

      // Light flicker in last 2s
      var remaining = BURN_DURATION - f.burnTimer;
      if (remaining <= 2) {
        f.light.intensity = 0.4 + Math.abs(Math.sin(time * 14)) * 2.0;
      } else {
        f.light.intensity = 2.5;
      }

      // Fade mesh opacity in last 2s
      if (remaining <= 2 && f.mat.transparent === false) {
        f.mat.transparent = true;
        f.mat.needsUpdate = true;
      }
      if (f.mat.transparent) {
        f.mat.opacity = Math.max(0, remaining / 2);
      }

      // Bright pulse animation
      var pulse = 0.85 + Math.sin(time * 8 + i) * 0.2;
      f.mesh.scale.setScalar(pulse);

      // ── Trail particles ──
      f.particleTimer += dt;
      var particleInterval = 1 / PARTICLE_RATE;
      while (f.particleTimer >= particleInterval) {
        f.particleTimer -= particleInterval;
        _spawnParticle(f);
      }
      _updateParticles(f, dt);

      // ── Burn out ──
      if (f.burnTimer >= BURN_DURATION) {
        _destroyFlare(f);
        _flares.splice(i, 1);
        continue;
      }
    }

    // ── Recharge capacity ──
    if (_capacity < MAX_CAPACITY) {
      _recharge += dt;
      while (_recharge >= RECHARGE_TIME && _capacity < MAX_CAPACITY) {
        _recharge -= RECHARGE_TIME;
        _capacity++;
        _updateHUD();
      }
    }

    // ── Cross-system effects ──
    _updateIRSignature();
    _updateMissileDecoy();
    _checkAutoFlare();
  }

  /* ── Public: reset ───────────────────────────────────────── */
  function reset() {
    for (var i = 0; i < _flares.length; i++) {
      _destroyFlare(_flares[i]);
    }
    _flares   = [];
    _capacity = MAX_CAPACITY;
    _recharge = 0;
    window._playerIRSignature = IR_SIGNATURE_NORM;
    if (_hudEl) _updateHUD();
  }

  /* ── Expose public API ───────────────────────────────────── */
  return {
    init:   init,
    update: update,
    deploy: deploy,
    reset:  reset,
  };

})();
