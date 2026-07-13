/* ───────────────────────────────────────────────────────────────────────────
   plasma-rifle.js — Chargeable secondary energy weapon
   Alt+F        → pick up / switch to plasma rifle
   Hold LMB or Ctrl+F → charge shot (0→1.0 over 2s)
   Tap fire     → quick bolt  (30 dmg)
   Full charge  → piercing beam (120 dmg, plasma burn on ground)
   >2.5s hold   → overcharge backfire (25 dmg to self, 3s forced cooldown)
   API          : window.PlasmaRifle = { init, update, fire, reset }
   Globals      : window._plasmaActive, window._plasmaAmmo
   ─────────────────────────────────────────────────────────────────────────── */
window.PlasmaRifle = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var CHARGE_TIME        = 2.0;    // seconds to full charge
  var OVERCHARGE_TIME    = 2.5;    // seconds before backfire
  var COOLDOWN_OVERCHARGE= 3.0;    // forced cooldown after backfire
  var BOLT_DAMAGE        = 30;
  var BEAM_DAMAGE        = 120;
  var SELF_DAMAGE        = 25;
  var PLASMA_CELLS       = 20;     // ammo per pickup
  var PROJECTILE_SPEED   = 40;     // units/s
  var STATION_INTERVAL   = 120;    // seconds between recharge stations
  var BURN_DURATION      = 3.0;    // ground burn lasts 3 s
  var BURN_DPS           = 15;     // dmg/s to enemies in burn radius
  var BURN_RADIUS        = 2.0;
  var IMPACT_RING_MAX    = 3.0;    // shockwave expands to 3 units

  /* ── scene refs ────────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _canvas   = null;

  /* ── weapon state ──────────────────────────────────────────────────────── */
  var _active        = false;   // rifle picked up and equipped
  var _ammo          = 0;
  var _chargeStart   = 0;       // timestamp when charge began (ms), 0 = not charging
  var _charging      = false;
  var _cooldownEnd   = 0;       // timestamp when cooldown expires (ms)
  var _riflePickedUp = false;

  /* ── 3-D objects ───────────────────────────────────────────────────────── */
  var _rifleMesh  = null;       // floating pickup mesh
  var _glowLight  = null;       // PointLight on gun while charging
  var _projectiles= [];         // { mesh, light, dir, pos, piercing, alive, t }
  var _burnZones  = [];         // { mesh, pos, t, life }
  var _impactRings= [];         // { mesh, t, life }
  var _station    = null;       // recharge cylinder mesh
  var _stationLight = null;
  var _stationTimer = 0;

  /* ── HUD elements ──────────────────────────────────────────────────────── */
  var _hudEl      = null;
  var _chargeBarEl= null;
  var _redFlashEl = null;

  /* ── key tracking ──────────────────────────────────────────────────────── */
  var _altDown    = false;
  var _ctrlDown   = false;
  var _fDown      = false;
  var _mouseDown  = false;
  var _keysHandled= false;

  /* ── audio ─────────────────────────────────────────────────────────────── */
  var _humSrc     = null;   // OscillatorNode for charging hum
  var _humGain    = null;

  /* ═══════════════════════════════════════════════════════════════════════
     AUDIO HELPERS
  ═══════════════════════════════════════════════════════════════════════ */
  function _ctx() {
    if (!window._audioCtx) {
      window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return window._audioCtx;
  }

  function _startHum() {
    try {
      if (_humSrc) return;
      var ctx = _ctx();
      _humSrc  = ctx.createOscillator();
      _humGain = ctx.createGain();
      _humSrc.type = 'sine';
      _humSrc.frequency.setValueAtTime(120, ctx.currentTime);
      _humGain.gain.setValueAtTime(0.0, ctx.currentTime);
      _humGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.12);
      _humSrc.connect(_humGain);
      _humGain.connect(ctx.destination);
      _humSrc.start();
    } catch (e) { /* silent */ }
  }

  function _updateHumPitch(charge) {
    try {
      if (!_humSrc) return;
      var ctx = _ctx();
      /* pitch rises from 120 Hz to 480 Hz as charge goes 0→1 */
      var freq = 120 + charge * 360;
      _humSrc.frequency.linearRampToValueAtTime(freq, ctx.currentTime + 0.08);
    } catch (e) { /* silent */ }
  }

  function _stopHum() {
    try {
      if (!_humSrc) return;
      var ctx = _ctx();
      _humGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
      var src = _humSrc;
      var g   = _humGain;
      setTimeout(function () {
        try { src.stop(); src.disconnect(); g.disconnect(); } catch(e) {}
      }, 200);
      _humSrc  = null;
      _humGain = null;
    } catch (e) { /* silent */ }
  }

  function _playPew() {
    try {
      var ctx = _ctx();
      var osc = ctx.createOscillator();
      var g   = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.35, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) { /* silent */ }
  }

  function _playBeamFire() {
    try {
      var ctx = _ctx();
      /* deep whoosh */
      var osc = ctx.createOscillator();
      var g   = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
      g.gain.setValueAtTime(0.5, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) { /* silent */ }
  }

  function _playCrack() {
    try {
      var ctx = _ctx();
      var bufSize = Math.floor(ctx.sampleRate * 0.22);
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.7, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
      src.connect(g);
      g.connect(ctx.destination);
      src.start();
      src.stop(ctx.currentTime + 0.25);
    } catch (e) { /* silent */ }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HUD HELPERS
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildHUD() {
    if (_hudEl) return;

    /* main badge */
    _hudEl = document.createElement('div');
    _hudEl.id = 'plasma-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:48px',
      'right:18px',
      'color:#cc66ff',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'text-shadow:0 0 8px #cc66ff,0 0 16px #7700cc',
      'pointer-events:none',
      'display:none',
      'z-index:9000',
      'user-select:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    /* charge bar */
    _chargeBarEl = document.createElement('div');
    _chargeBarEl.id = 'plasma-charge-bar';
    _chargeBarEl.style.cssText = [
      'position:fixed',
      'bottom:68px',
      'right:18px',
      'width:120px',
      'height:6px',
      'background:#330044',
      'border:1px solid #cc66ff',
      'display:none',
      'z-index:9001',
      'pointer-events:none'
    ].join(';');
    var fill = document.createElement('div');
    fill.id = 'plasma-charge-fill';
    fill.style.cssText = 'height:100%;width:0%;background:#cc66ff;transition:width 0.05s linear;';
    _chargeBarEl.appendChild(fill);
    document.body.appendChild(_chargeBarEl);

    /* full-screen red flash for overcharge */
    _redFlashEl = document.createElement('div');
    _redFlashEl.id = 'plasma-red-flash';
    _redFlashEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(255,0,0,0)',
      'pointer-events:none',
      'z-index:9999',
      'transition:background 0.1s'
    ].join(';');
    document.body.appendChild(_redFlashEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_active) {
      _hudEl.style.display = 'block';
      _hudEl.textContent = '⚡ PLASMA [' + _ammo + ']';
    } else {
      _hudEl.style.display = 'none';
    }
  }

  function _setChargeFill(pct) {
    if (!_chargeBarEl) return;
    var fill = document.getElementById('plasma-charge-fill');
    if (fill) fill.style.width = (pct * 100).toFixed(1) + '%';
  }

  function _showChargeBar(visible) {
    if (!_chargeBarEl) return;
    _chargeBarEl.style.display = visible ? 'block' : 'none';
  }

  function _flashRed() {
    if (!_redFlashEl) return;
    _redFlashEl.style.background = 'rgba(255,0,0,0.45)';
    setTimeout(function () {
      if (_redFlashEl) _redFlashEl.style.background = 'rgba(255,0,0,0)';
    }, 220);
    setTimeout(function () {
      if (_redFlashEl) _redFlashEl.style.background = 'rgba(255,0,0,0.3)';
    }, 360);
    setTimeout(function () {
      if (_redFlashEl) _redFlashEl.style.background = 'rgba(255,0,0,0)';
    }, 560);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SCENE OBJECT BUILDERS
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildRifleMesh() {
    if (!_scene || !window.THREE) return;
    var THREE = window.THREE;

    /* simple gun silhouette from merged box geometries */
    var group = new THREE.Group();

    /* barrel */
    var barrelGeo = new THREE.BoxGeometry(0.06, 0.06, 0.7);
    var barrelMat = new THREE.MeshBasicMaterial({ color: 0x220033 });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, 0, -0.2);
    group.add(barrel);

    /* body */
    var bodyGeo = new THREE.BoxGeometry(0.12, 0.14, 0.38);
    var bodyMat = new THREE.MeshBasicMaterial({ color: 0x440066 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0, 0.1);
    group.add(body);

    /* emitter tip glow */
    var tipGeo = new THREE.SphereGeometry(0.055, 8, 8);
    var tipMat = new THREE.MeshBasicMaterial({ color: 0xcc66ff });
    var tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(0, 0, -0.58);
    group.add(tip);

    /* ambient purple light on pickup */
    var light = new THREE.PointLight(0xcc66ff, 0.6, 2.5);
    light.position.set(0, 0.3, 0);
    group.add(light);

    /* position floating near player spawn */
    group.position.set(3, 1.2, 3);
    _scene.add(group);
    _rifleMesh = group;
  }

  function _removeRifleMesh() {
    if (_rifleMesh && _scene) {
      _scene.remove(_rifleMesh);
    }
    _rifleMesh = null;
  }

  function _buildGlowLight() {
    if (!_scene || !window.THREE) return;
    var THREE = window.THREE;
    _glowLight = new THREE.PointLight(0xcc66ff, 0, 3);
    _scene.add(_glowLight);
  }

  function _removeGlowLight() {
    if (_glowLight && _scene) _scene.remove(_glowLight);
    _glowLight = null;
  }

  function _spawnProjectile(piercing) {
    if (!_scene || !_camera || !window.THREE) return;
    var THREE = window.THREE;

    var geo  = new THREE.SphereGeometry(0.12, 8, 8);
    var mat  = new THREE.MeshBasicMaterial({ color: piercing ? 0x00ffff : 0xcc66ff });
    var mesh = new THREE.Mesh(geo, mat);

    /* start at camera position */
    var origin = new THREE.Vector3();
    _camera.getWorldPosition(origin);
    mesh.position.copy(origin);

    /* direction from camera forward */
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion).normalize();

    var light = new THREE.PointLight(piercing ? 0x00ffff : 0xcc66ff, 1.2, 4);
    light.position.copy(origin);
    _scene.add(light);
    _scene.add(mesh);

    _projectiles.push({
      mesh: mesh,
      light: light,
      mat: mat,
      dir: dir,
      piercing: piercing,
      alive: true,
      t: 0
    });
  }

  function _spawnImpactRing(pos) {
    if (!_scene || !window.THREE) return;
    var THREE = window.THREE;
    var geo = new THREE.PlaneGeometry(0.1, 0.1);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.rotation.x = -Math.PI / 2;
    _scene.add(mesh);

    /* cyan flash sphere */
    var fGeo = new THREE.SphereGeometry(0.3, 8, 8);
    var fMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });
    var flash = new THREE.Mesh(fGeo, fMat);
    flash.position.copy(pos);
    _scene.add(flash);

    _impactRings.push({ mesh: mesh, flash: flash, flashMat: fMat, mat: mat, pos: pos.clone(), t: 0, life: 0.6 });
  }

  function _spawnBurnZone(pos) {
    if (!_scene || !window.THREE) return;
    var THREE = window.THREE;
    var geo = new THREE.PlaneGeometry(BURN_RADIUS * 2, BURN_RADIUS * 2);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x7700cc,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.02, pos.z);
    mesh.rotation.x = -Math.PI / 2;
    _scene.add(mesh);
    _burnZones.push({ mesh: mesh, mat: mat, pos: pos.clone(), t: 0, life: BURN_DURATION });
  }

  function _buildRechargeStation(pos) {
    if (!_scene || !window.THREE) return;
    var THREE = window.THREE;

    if (_station) {
      _scene.remove(_station);
      if (_stationLight) _scene.remove(_stationLight);
    }

    var geo  = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 12);
    var mat  = new THREE.MeshBasicMaterial({ color: 0x9900cc });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    _station = mesh;

    var light = new THREE.PointLight(0xcc66ff, 1.0, 5);
    light.position.set(pos.x, pos.y + 1.2, pos.z);
    _scene.add(light);
    _stationLight = light;
  }

  function _removeStation() {
    if (_station && _scene) _scene.remove(_station);
    if (_stationLight && _scene) _scene.remove(_stationLight);
    _station = null;
    _stationLight = null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PICKUP / EQUIP
  ═══════════════════════════════════════════════════════════════════════ */
  function _pickUp() {
    if (_riflePickedUp) return; /* already have it */
    _riflePickedUp = true;
    _ammo  = PLASMA_CELLS;
    _active = true;
    window._plasmaActive = true;
    window._plasmaAmmo   = _ammo;
    _removeRifleMesh();
    _updateHUD();

    if (window.HUD && HUD.notifyPickup) {
      HUD.notifyPickup('⚡ Plasma Rifle acquired!', '#cc66ff');
    }
  }

  function _tryPickupIfNear() {
    /* check proximity to floating rifle mesh */
    if (_riflePickedUp || !_rifleMesh || !_camera) return;
    var THREE = window.THREE;
    if (!THREE) return;
    var camPos = new THREE.Vector3();
    _camera.getWorldPosition(camPos);
    var dist = camPos.distanceTo(_rifleMesh.position);
    if (dist < 2.5) {
      _pickUp();
    }
  }

  function _tryPickupStation() {
    if (!_station || !_camera) return;
    var THREE = window.THREE;
    if (!THREE) return;
    var camPos = new THREE.Vector3();
    _camera.getWorldPosition(camPos);
    var dist = camPos.distanceTo(_station.position);
    if (dist < 2.0 && _active) {
      _ammo = PLASMA_CELLS;
      window._plasmaAmmo = _ammo;
      _updateHUD();
      _removeStation();
      _stationTimer = 0;
      if (window.HUD && HUD.notifyPickup) {
        HUD.notifyPickup('⚡ Plasma cells recharged!', '#cc66ff');
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CHARGING LOGIC
  ═══════════════════════════════════════════════════════════════════════ */
  function _beginCharge() {
    if (!_active || _charging || _ammo <= 0) return;
    var now = performance.now();
    if (now < _cooldownEnd) return;
    _charging   = true;
    _chargeStart = now;
    _startHum();
    _showChargeBar(true);
    _setChargeFill(0);
  }

  function _getCharge() {
    if (!_charging) return 0;
    var elapsed = (performance.now() - _chargeStart) / 1000;
    return Math.min(elapsed / CHARGE_TIME, 1.0);
  }

  function _releaseCharge() {
    if (!_charging) return;
    var elapsed = (performance.now() - _chargeStart) / 1000;
    _charging = false;
    _stopHum();
    _showChargeBar(false);
    _setChargeFill(0);

    /* overcharge check */
    if (elapsed >= OVERCHARGE_TIME) {
      _triggerOvercharge();
      return;
    }

    var now = performance.now();
    if (now < _cooldownEnd) return;
    if (_ammo <= 0) return;

    if (elapsed >= CHARGE_TIME) {
      _fireBeam();
    } else {
      _fireBolt();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     FIRE MODES
  ═══════════════════════════════════════════════════════════════════════ */
  function _fireBolt() {
    if (_ammo <= 0) return;
    _ammo--;
    window._plasmaAmmo = _ammo;
    _updateHUD();
    _spawnProjectile(false);
    _playPew();
  }

  function _fireBeam() {
    if (_ammo <= 0) return;
    _ammo--;
    window._plasmaAmmo = _ammo;
    _updateHUD();
    _spawnProjectile(true);
    _playBeamFire();
  }

  function _triggerOvercharge() {
    _playCrack();
    _flashRed();
    _cooldownEnd = performance.now() + COOLDOWN_OVERCHARGE * 1000;

    /* hurt player */
    if (typeof window._takeDamageFromWaveEvent === 'function') {
      window._takeDamageFromWaveEvent(SELF_DAMAGE);
    } else if (window.GameManager && typeof GameManager.takeDamage === 'function') {
      GameManager.takeDamage(SELF_DAMAGE);
    }

    if (window.HUD && HUD.notifyPickup) {
      HUD.notifyPickup('⚡ OVERCHARGE! Rifle backfired!', '#ff3300');
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PROJECTILE UPDATE
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateProjectiles(dt) {
    if (!_scene || !window.THREE) return;
    var THREE = window.THREE;

    for (var i = _projectiles.length - 1; i >= 0; i--) {
      var p = _projectiles[i];
      if (!p.alive) {
        _scene.remove(p.mesh);
        _scene.remove(p.light);
        _projectiles.splice(i, 1);
        continue;
      }

      p.t += dt;
      var step = PROJECTILE_SPEED * dt;

      p.mesh.position.addScaledVector(p.dir, step);
      p.light.position.copy(p.mesh.position);

      /* lifetime limit (3 s = 120 units travel) */
      if (p.t > 3.0) {
        p.alive = false;
        continue;
      }

      /* enemy hit test */
      var hitEnemies = [];
      if (window.Enemies && typeof Enemies.getAll === 'function') {
        var all = Enemies.getAll();
        for (var j = 0; j < all.length; j++) {
          var e = all[j];
          if (!e || !e.alive || !e.mesh) continue;
          var eDist = p.mesh.position.distanceTo(e.mesh.position);
          if (eDist < 0.8) {
            hitEnemies.push(e);
          }
        }
      }

      if (hitEnemies.length > 0) {
        for (var k = 0; k < hitEnemies.length; k++) {
          var dmg = p.piercing ? BEAM_DAMAGE : BOLT_DAMAGE;
          if (window.Enemies && typeof Enemies.damage === 'function') {
            Enemies.damage(hitEnemies[k], dmg, false);
          }
          if (window.HUD && HUD.flashHit) HUD.flashHit();
        }

        /* impact effects */
        _spawnImpactRing(p.mesh.position.clone());

        if (p.piercing) {
          _spawnBurnZone(p.mesh.position.clone());
          /* piercing continues through enemies */
          if (!p.piercing) { p.alive = false; }
          /* piercing: mark enemies already hit to avoid re-hit */
        } else {
          p.alive = false;
        }

        if (!p.piercing) continue;
      }

      /* wall/world hit — simplified: kill if y < -1 or > 80 */
      if (p.mesh.position.y < -1 || p.mesh.position.y > 80) {
        _spawnImpactRing(p.mesh.position.clone());
        p.alive = false;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     BURN ZONE UPDATE
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateBurnZones(dt) {
    if (!_scene) return;
    for (var i = _burnZones.length - 1; i >= 0; i--) {
      var b = _burnZones[i];
      b.t += dt;
      var pct = 1 - b.t / b.life;
      b.mat.opacity = 0.45 * pct;

      /* tick damage to nearby enemies */
      if (window.Enemies && typeof Enemies.damageInRadius === 'function') {
        Enemies.damageInRadius(b.pos, BURN_RADIUS, BURN_DPS * dt);
      }

      if (b.t >= b.life) {
        _scene.remove(b.mesh);
        _burnZones.splice(i, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     IMPACT RING UPDATE
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateImpactRings(dt) {
    if (!_scene) return;
    for (var i = _impactRings.length - 1; i >= 0; i--) {
      var r = _impactRings[i];
      r.t += dt;
      var pct = r.t / r.life;
      var scale = 0.1 + pct * IMPACT_RING_MAX;
      r.mesh.scale.set(scale, scale, scale);
      r.mat.opacity = 0.8 * (1 - pct);

      /* fade flash sphere */
      if (r.flash) {
        r.flashMat.opacity = 0.7 * (1 - pct * 2);
        if (r.flashMat.opacity <= 0) {
          _scene.remove(r.flash);
          r.flash = null;
        }
      }

      if (r.t >= r.life) {
        _scene.remove(r.mesh);
        if (r.flash) _scene.remove(r.flash);
        _impactRings.splice(i, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RIFLE MESH FLOAT ANIMATION
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateRifleMesh(t) {
    if (!_rifleMesh) return;
    _rifleMesh.position.y = 1.2 + Math.sin(t * 1.8) * 0.12;
    _rifleMesh.rotation.y += 0.012;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     GLOW LIGHT UPDATE (charging)
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateGlowLight(charge) {
    if (!_glowLight || !_camera) return;
    var THREE = window.THREE;
    if (!THREE) return;
    var pos = new THREE.Vector3();
    _camera.getWorldPosition(pos);
    var fwd = new THREE.Vector3(0, 0, -0.6);
    fwd.applyQuaternion(_camera.quaternion);
    _glowLight.position.copy(pos).add(fwd);
    _glowLight.intensity = charge * 2.5;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     STATION TIMER
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateStation(dt) {
    if (!_active) return;
    if (_station) {
      /* pulse the station light */
      if (_stationLight) {
        _stationLight.intensity = 0.8 + Math.sin(performance.now() / 400) * 0.4;
      }
      _tryPickupStation();
      return;
    }

    _stationTimer += dt;
    if (_stationTimer >= STATION_INTERVAL) {
      _stationTimer = 0;
      /* spawn at random position within 20 units of origin */
      var THREE = window.THREE;
      if (!THREE) return;
      var px = (Math.random() - 0.5) * 40;
      var pz = (Math.random() - 0.5) * 40;
      _buildRechargeStation(new THREE.Vector3(px, 0.6, pz));
      if (window.HUD && HUD.notifyPickup) {
        HUD.notifyPickup('⚡ Plasma recharge station appeared!', '#cc66ff');
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     KEY / MOUSE HANDLERS
  ═══════════════════════════════════════════════════════════════════════ */
  function _onKeyDown(e) {
    if (e.key === 'Alt' || e.key === 'AltLeft' || e.key === 'AltRight') _altDown = true;
    if (e.key === 'Control' || e.key === 'ControlLeft' || e.key === 'ControlRight') _ctrlDown = true;
    if (e.key === 'f' || e.key === 'F') {
      if (!_fDown) {
        _fDown = true;
        /* Alt+F → pick up */
        if (_altDown) {
          e.preventDefault();
          _tryPickupIfNear();
          if (!_riflePickedUp) _pickUp(); /* force pickup regardless of distance */
        }
        /* Ctrl+F → start charge */
        if (_ctrlDown && _active) {
          e.preventDefault();
          _beginCharge();
        }
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'Alt' || e.key === 'AltLeft' || e.key === 'AltRight') _altDown = false;
    if (e.key === 'Control' || e.key === 'ControlLeft' || e.key === 'ControlRight') {
      _ctrlDown = false;
      /* releasing Ctrl while charging via Ctrl+F */
      if (_charging) _releaseCharge();
    }
    if (e.key === 'f' || e.key === 'F') {
      _fDown = false;
    }
  }

  function _onMouseDown(e) {
    if (e.button !== 0) return;
    _mouseDown = true;
    if (_active) _beginCharge();
  }

  function _onMouseUp(e) {
    if (e.button !== 0) return;
    _mouseDown = false;
    if (_charging) _releaseCharge();
  }

  function _attachHandlers() {
    if (_keysHandled) return;
    _keysHandled = true;
    window.addEventListener('keydown',   _onKeyDown,   false);
    window.addEventListener('keyup',     _onKeyUp,     false);
    window.addEventListener('mousedown', _onMouseDown, false);
    window.addEventListener('mouseup',   _onMouseUp,   false);
  }

  function _detachHandlers() {
    window.removeEventListener('keydown',   _onKeyDown,   false);
    window.removeEventListener('keyup',     _onKeyUp,     false);
    window.removeEventListener('mousedown', _onMouseDown, false);
    window.removeEventListener('mouseup',   _onMouseUp,   false);
    _keysHandled = false;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════ */
  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    window._plasmaActive = false;
    window._plasmaAmmo   = 0;

    _buildHUD();
    _buildRifleMesh();
    _buildGlowLight();
    _attachHandlers();
    _updateHUD();
  }

  function update(dt, elapsed) {
    /* overcharge check while charging */
    if (_charging) {
      var chargeElapsed = (performance.now() - _chargeStart) / 1000;
      var charge = Math.min(chargeElapsed / CHARGE_TIME, 1.0);

      _setChargeFill(Math.min(chargeElapsed / OVERCHARGE_TIME, 1.0));
      _updateHumPitch(charge);
      _updateGlowLight(charge);

      /* auto-trigger overcharge */
      if (chargeElapsed >= OVERCHARGE_TIME) {
        _charging = false;
        _stopHum();
        _showChargeBar(false);
        _setChargeFill(0);
        _triggerOvercharge();
      }
    } else {
      _updateGlowLight(0);
    }

    _updateRifleMesh(elapsed);
    _updateProjectiles(dt);
    _updateBurnZones(dt);
    _updateImpactRings(dt);
    _updateStation(dt);

    /* sync globals */
    window._plasmaActive = _active;
    window._plasmaAmmo   = _ammo;
  }

  /* external fire trigger (e.g. called by game-manager if needed) */
  function fire() {
    if (!_active || _ammo <= 0) return;
    var now = performance.now();
    if (now < _cooldownEnd) return;
    _fireBolt();
  }

  function reset() {
    _stopHum();
    _charging      = false;
    _chargeStart   = 0;
    _cooldownEnd   = 0;
    _ammo          = 0;
    _active        = false;
    _riflePickedUp = false;
    _altDown       = false;
    _ctrlDown      = false;
    _fDown         = false;
    _mouseDown     = false;

    /* remove projectiles */
    for (var i = 0; i < _projectiles.length; i++) {
      if (_scene) {
        _scene.remove(_projectiles[i].mesh);
        _scene.remove(_projectiles[i].light);
      }
    }
    _projectiles = [];

    for (var j = 0; j < _burnZones.length; j++) {
      if (_scene) _scene.remove(_burnZones[j].mesh);
    }
    _burnZones = [];

    for (var k = 0; k < _impactRings.length; k++) {
      if (_scene) {
        _scene.remove(_impactRings[k].mesh);
        if (_impactRings[k].flash) _scene.remove(_impactRings[k].flash);
      }
    }
    _impactRings = [];

    _removeRifleMesh();
    _removeGlowLight();
    _removeStation();

    if (_hudEl) _hudEl.style.display = 'none';
    _showChargeBar(false);
    _stationTimer = 0;

    window._plasmaActive = false;
    window._plasmaAmmo   = 0;
  }

  return { init: init, update: update, fire: fire, reset: reset };
})();
