// ============================================================
//  freeze-grenade.js — Cryogenic Freeze Grenade module
//  Alt+Z: throw freeze grenade (2 charges, 45s cooldown per charge)
//  Parabolic arc, 1.8s fuse, bounces once on ground
//  On detonation: expanding shockwave ring, 16 ice crystal shards,
//  point light flash; enemies frozen 4s (full) or slowed 3s (partial)
//  Frozen bonus: +50% damage to frozen enemies (_frozenEnemy flag)
//  HUD: "x CRYO xN" counter in cyan
//  Audio: cryo hiss on throw, crystalline impact, thaw crack
// ============================================================
window.FreezeGrenade = (function () {
  'use strict';

  // Constants
  var MAX_CHARGES = 2;
  var COOLDOWN_PER_CHARGE = 45;
  var FREEZE_RADIUS = 5;
  var SLOW_RADIUS = 8;
  var FREEZE_DURATION = 4;
  var SLOW_DURATION = 3;
  var SLOW_MULT = 0.4;
  var BLAST_DAMAGE = 20;
  var FUSE_TIME = 1.8;

  // State
  var _scene = null;
  var _camera = null;
  var _charges = MAX_CHARGES;
  var _cooldowns = [0, 0];
  var _active = [];
  var _particles = [];
  var _shockwaves = [];
  var _lights = [];
  var _hudEl = null;

  window._frozenEnemies = window._frozenEnemies || [];

  // HUD
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'freeze-grenade-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:16px',
      'color:#00CCFF',
      'font-size:13px',
      'font-family:monospace',
      'z-index:200',
      'pointer-events:none',
      'text-shadow:0 0 8px rgba(0,200,255,0.9)',
      'letter-spacing:1px',
      'transition:opacity 0.3s'
    ].join(';');
    var hud = document.getElementById('hud');
    if (hud) { hud.appendChild(_hudEl); } else { document.body.appendChild(_hudEl); }
  }

  function _updateHUD() {
    if (!_hudEl) _createHUD();
    _hudEl.textContent = '❄ CRYO \xD7' + _charges;
    if (_charges < MAX_CHARGES) {
      var secs = Math.ceil(_cooldowns[_charges]);
      _hudEl.textContent += ' [' + secs + 's]';
    }
    _hudEl.style.opacity = (_charges > 0) ? '1' : '0.35';
  }

  // Audio
  function _playCryoHiss() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var bufLen = Math.floor(ctx.sampleRate * 0.6);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.4)) * 0.4;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.5;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      src.onended = function () { try { ctx.close(); } catch (e) {} };
    } catch (e) {}
  }

  function _playCrystalImpact() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var freqs = [880, 1320, 1760, 2200, 2640];
      for (var f = 0; f < freqs.length; f++) {
        (function (freq, delay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.55);
        }(freqs[f], f * 0.04));
      }
      var bufLen2 = Math.floor(ctx.sampleRate * 0.15);
      var buf2 = ctx.createBuffer(1, bufLen2, ctx.sampleRate);
      var d2 = buf2.getChannelData(0);
      for (var i2 = 0; i2 < bufLen2; i2++) {
        d2[i2] = (Math.random() * 2 - 1) * Math.exp(-i2 / (bufLen2 * 0.08));
      }
      var nSrc = ctx.createBufferSource();
      nSrc.buffer = buf2;
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 3000;
      var nGain = ctx.createGain();
      nGain.gain.value = 0.8;
      nSrc.connect(hp);
      hp.connect(nGain);
      nGain.connect(ctx.destination);
      nSrc.start();
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 2000);
    } catch (e) {}
  }

  function _playThawCrack() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var bufLen = Math.floor(ctx.sampleRate * 0.2);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.05));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1500;
      var gain = ctx.createGain();
      gain.gain.value = 1.0;
      src.connect(hp);
      hp.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      src.onended = function () { try { ctx.close(); } catch (e) {} };
    } catch (e) {}
  }

  // Visual helpers
  function _spawnShockwave(pos) {
    if (!_scene) return;
    var geo = new THREE.SphereGeometry(0.3, 16, 8);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xCCEEFF,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    _shockwaves.push({ mesh: mesh, elapsed: 0, duration: 1.0 });
  }

  function _spawnFlashLight(pos) {
    if (!_scene) return;
    var light = new THREE.PointLight(0xAAEEFF, 8, 10);
    light.position.copy(pos);
    _scene.add(light);
    _lights.push({ light: light, elapsed: 0, duration: 0.4 });
  }

  function _spawnIceShards(pos) {
    if (!_scene) return;
    var SHARD_COUNT = 16;
    for (var i = 0; i < SHARD_COUNT; i++) {
      var geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      var mat = new THREE.MeshLambertMaterial({
        color: 0xCCEEFF,
        transparent: true,
        opacity: 0.9
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      var angle = (i / SHARD_COUNT) * Math.PI * 2;
      var upAngle = (Math.random() * 0.7 + 0.1) * Math.PI;
      var speed = 3 + Math.random() * 4;
      var vx = Math.cos(angle) * Math.cos(upAngle) * speed;
      var vy = Math.abs(Math.sin(upAngle)) * speed + 1;
      var vz = Math.sin(angle) * Math.cos(upAngle) * speed;
      _scene.add(mesh);
      _particles.push({ mesh: mesh, vel: { x: vx, y: vy, z: vz }, life: 0.7 + Math.random() * 0.5, elapsed: 0, type: 'shard' });
    }
  }

  function _spawnSmoke(pos) {
    if (!_scene) return;
    var geo = new THREE.SphereGeometry(0.06, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0x88BBFF, transparent: true, opacity: 0.5 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    _particles.push({
      mesh: mesh,
      vel: { x: (Math.random() - 0.5) * 0.3, y: 0.4 + Math.random() * 0.3, z: (Math.random() - 0.5) * 0.3 },
      life: 0.5 + Math.random() * 0.3,
      elapsed: 0,
      type: 'smoke'
    });
  }

  function _spawnOrbitParticle(enemy) {
    if (!_scene || !enemy || !enemy.mesh) return;
    var geo = new THREE.SphereGeometry(0.05, 3, 3);
    var mat = new THREE.MeshBasicMaterial({ color: 0xAAEEFF, transparent: true, opacity: 0.8 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(enemy.mesh.position);
    _scene.add(mesh);
    _particles.push({
      mesh: mesh,
      life: 1.5 + Math.random(),
      elapsed: 0,
      type: 'orbit',
      enemy: enemy,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitRadius: 0.5 + Math.random() * 0.3,
      orbitSpeed: 1.5 + Math.random(),
      orbitHeight: 0.3 + Math.random() * 0.8
    });
  }

  // Ice sphere overlay on enemy
  function _attachIceSphere(enemy) {
    if (!_scene || !enemy || !enemy.mesh) return;
    if (enemy._iceSphere) return;
    var geo = new THREE.SphereGeometry(0.7, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0xCCEEFF, transparent: true, opacity: 0.38 });
    var sphere = new THREE.Mesh(geo, mat);
    sphere.position.copy(enemy.mesh.position);
    _scene.add(sphere);
    enemy._iceSphere = sphere;
    for (var i = 0; i < 4; i++) { _spawnOrbitParticle(enemy); }
  }

  function _removeIceSphere(enemy) {
    if (!_scene || !enemy) return;
    if (enemy._iceSphere) {
      try { _scene.remove(enemy._iceSphere); } catch (ex) {}
      try { enemy._iceSphere.geometry.dispose(); } catch (ex) {}
      try { enemy._iceSphere.material.dispose(); } catch (ex) {}
      enemy._iceSphere = null;
    }
  }

  // Enemy access
  function _getEnemies() {
    if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      return window.Enemies.getAll();
    }
    return [];
  }

  // Material tint for frozen enemy
  function _tintEnemy(enemy, frozen) {
    if (!enemy || !enemy.mesh) return;
    enemy.mesh.traverse(function (obj) {
      if (obj.isMesh && obj.material) {
        if (frozen) {
          if (!obj._origColor) { obj._origColor = obj.material.color ? obj.material.color.getHex() : 0xffffff; }
          obj.material.color.setHex(0xCCEEFF);
        } else {
          if (obj._origColor !== undefined) {
            obj.material.color.setHex(obj._origColor);
            obj._origColor = undefined;
          }
        }
      }
    });
  }

  // Direct blast damage
  function _blastDamage(enemy) {
    if (!enemy) return;
    if (typeof enemy.hp !== 'undefined') {
      enemy.hp -= BLAST_DAMAGE;
      if (enemy.hp < 0) { enemy.hp = 0; }
    }
  }

  // Freeze / slow enemies in radius
  function _freezeEnemies(pos) {
    var enemies = _getEnemies();
    window._frozenEnemies = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive || !e.mesh) continue;
      var ePos = e.mesh.position;
      var dx = ePos.x - pos.x;
      var dy = ePos.y - pos.y;
      var dz = ePos.z - pos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= SLOW_RADIUS) { _blastDamage(e); }
      if (dist <= FREEZE_RADIUS) {
        e.frozen = true;
        e.frozenTimer = FREEZE_DURATION;
        e._frozenEnemy = true;
        e._slowedByFreeze = false;
        e._suppressionActive = true;
        if (!e._baseSpeedBackup) { e._baseSpeedBackup = e.speed; }
        _tintEnemy(e, true);
        _attachIceSphere(e);
        window._frozenEnemies.push(e);
      } else if (dist <= SLOW_RADIUS) {
        e.frozen = false;
        e._frozenEnemy = false;
        e._slowedByFreeze = true;
        e._slowTimer = SLOW_DURATION;
        if (!e._baseSpeedBackup) { e._baseSpeedBackup = e.speed; }
        e._speedMult = SLOW_MULT;
      }
    }
  }

  // Detonation
  function _detonate(data) {
    var pos = data.mesh.position.clone();
    if (_scene) { try { _scene.remove(data.mesh); } catch (ex) {} }
    _spawnShockwave(pos);
    _spawnFlashLight(pos);
    _spawnIceShards(pos);
    _freezeEnemies(pos);
    _playCrystalImpact();
    var canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.transition = 'filter 0.06s';
      canvas.style.filter = 'hue-rotate(190deg) saturate(1.8) brightness(1.3)';
      setTimeout(function () {
        canvas.style.transition = 'filter 0.5s';
        canvas.style.filter = '';
      }, 400);
    }
  }

  // Grenade mesh
  function _makeGrenadeMesh() {
    var geo = new THREE.SphereGeometry(0.14, 8, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x88DDFF });
    return new THREE.Mesh(geo, mat);
  }

  // Throw
  function throw_grenade() {
    if (!_scene || !_camera) return false;
    if (_charges <= 0) return false;
    _charges -= 1;
    var startPos = _camera.position.clone();
    startPos.y -= 0.15;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    dir.y = 0;
    if (dir.lengthSq() < 0.0001) { dir.z = -1; }
    dir.normalize();
    var speed = 10;
    var mesh = _makeGrenadeMesh();
    mesh.position.copy(startPos);
    _scene.add(mesh);
    _active.push({
      mesh: mesh,
      vel: { x: dir.x * speed, y: 5, z: dir.z * speed },
      elapsed: 0,
      fuse: FUSE_TIME,
      bounced: false,
      detonated: false,
      smokeTimer: 0
    });
    _cooldowns[_charges] = COOLDOWN_PER_CHARGE;
    _updateHUD();
    _playCryoHiss();
    return true;
  }

  // Update loop
  function update(dt) {
    var i, p, e, frac;

    // Cooldown recharge
    for (i = 0; i < MAX_CHARGES; i++) {
      if (_cooldowns[i] > 0) {
        _cooldowns[i] -= dt;
        if (_cooldowns[i] <= 0) {
          _cooldowns[i] = 0;
          if (_charges < MAX_CHARGES) { _charges += 1; }
        }
      }
    }
    _updateHUD();

    // In-flight grenades
    for (i = _active.length - 1; i >= 0; i--) {
      var g = _active[i];
      if (g.detonated) { _active.splice(i, 1); continue; }
      g.elapsed += dt;
      g.fuse -= dt;
      g.vel.y -= 9.8 * dt;
      g.mesh.position.x += g.vel.x * dt;
      g.mesh.position.y += g.vel.y * dt;
      g.mesh.position.z += g.vel.z * dt;
      g.mesh.rotation.x += 3 * dt;
      g.mesh.rotation.z += 2 * dt;
      if (!g.bounced && g.mesh.position.y <= 0.14) {
        g.mesh.position.y = 0.14;
        g.vel.y = Math.abs(g.vel.y) * 0.35;
        g.vel.x *= 0.6;
        g.vel.z *= 0.6;
        g.bounced = true;
      }
      g.smokeTimer -= dt;
      if (g.smokeTimer <= 0) { _spawnSmoke(g.mesh.position); g.smokeTimer = 0.06; }
      if (g.fuse <= 0) {
        g.detonated = true;
        _detonate(g);
        _active.splice(i, 1);
      }
    }

    // Shockwave rings
    for (i = _shockwaves.length - 1; i >= 0; i--) {
      var sw = _shockwaves[i];
      sw.elapsed += dt;
      frac = sw.elapsed / sw.duration;
      if (frac >= 1) {
        if (_scene) { try { _scene.remove(sw.mesh); } catch (ex) {} }
        _shockwaves.splice(i, 1);
        continue;
      }
      var scale = 0.3 + (5 - 0.3) * frac;
      sw.mesh.scale.setScalar(scale);
      sw.mesh.material.opacity = 0.7 * (1 - frac);
    }

    // Point light flashes
    for (i = _lights.length - 1; i >= 0; i--) {
      var lEntry = _lights[i];
      lEntry.elapsed += dt;
      frac = lEntry.elapsed / lEntry.duration;
      if (frac >= 1) {
        if (_scene) { try { _scene.remove(lEntry.light); } catch (ex) {} }
        _lights.splice(i, 1);
        continue;
      }
      lEntry.light.intensity = 8 * (1 - frac);
    }

    // Particles
    for (i = _particles.length - 1; i >= 0; i--) {
      p = _particles[i];
      p.elapsed += dt;
      if (p.elapsed >= p.life) {
        if (_scene) { try { _scene.remove(p.mesh); } catch (ex) {} }
        _particles.splice(i, 1);
        continue;
      }
      frac = p.elapsed / p.life;
      if (p.type === 'shard') {
        p.vel.y -= 9.8 * dt;
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.y += p.vel.y * dt;
        p.mesh.position.z += p.vel.z * dt;
        p.mesh.rotation.x += 5 * dt;
        p.mesh.rotation.z += 3 * dt;
        p.mesh.material.opacity = 0.9 * (1 - frac);
      } else if (p.type === 'smoke') {
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.y += p.vel.y * dt;
        p.mesh.position.z += p.vel.z * dt;
        p.mesh.scale.setScalar(1 + frac * 2);
        p.mesh.material.opacity = 0.5 * (1 - frac);
      } else if (p.type === 'orbit') {
        if (!p.enemy || !p.enemy.frozen || !p.enemy.mesh) {
          if (_scene) { try { _scene.remove(p.mesh); } catch (ex) {} }
          _particles.splice(i, 1);
          continue;
        }
        p.orbitAngle += p.orbitSpeed * dt;
        p.mesh.position.set(
          p.enemy.mesh.position.x + Math.cos(p.orbitAngle) * p.orbitRadius,
          p.enemy.mesh.position.y + p.orbitHeight,
          p.enemy.mesh.position.z + Math.sin(p.orbitAngle) * p.orbitRadius
        );
        p.mesh.material.opacity = 0.8 * (1 - frac * 0.3);
      }
    }

    // Frozen / slowed enemy tick
    var enemies = _getEnemies();
    window._frozenEnemies = [];
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e) continue;

      if (e.frozen) {
        e.frozenTimer -= dt;
        e._suppressionActive = true;
        if (e._iceSphere && e.mesh) { e._iceSphere.position.copy(e.mesh.position); }

        // Lethal shatter bonus
        if (e.hp !== undefined && e.hp <= 0 && !e._shattered) {
          e._shattered = true;
          _removeIceSphere(e);
          _tintEnemy(e, false);
          _playThawCrack();
          if (e.mesh) { _spawnIceShards(e.mesh.position.clone()); }
          if (window.player && typeof window.player.score !== 'undefined') { window.player.score += 150; }
          if (window.HUD && typeof window.HUD.showToast === 'function') { window.HUD.showToast('ICE SHATTER! +150'); }
          e.frozen = false;
          e.frozenTimer = 0;
          e._frozenEnemy = false;
          e._suppressionActive = false;
          if (e._baseSpeedBackup !== undefined) { e.speed = e._baseSpeedBackup; e._baseSpeedBackup = undefined; }
          continue;
        }

        if (e.frozenTimer <= 0) {
          // Thaw
          e.frozen = false;
          e.frozenTimer = 0;
          e._frozenEnemy = false;
          e._suppressionActive = false;
          if (e._baseSpeedBackup !== undefined) { e.speed = e._baseSpeedBackup; e._baseSpeedBackup = undefined; }
          _tintEnemy(e, false);
          _removeIceSphere(e);
          _playThawCrack();
          if (e.mesh) { _spawnIceShards(e.mesh.position.clone()); }
        } else {
          window._frozenEnemies.push(e);
        }
      }

      if (e._slowedByFreeze) {
        e._slowTimer -= dt;
        if (e._slowTimer <= 0) {
          e._slowedByFreeze = false;
          e._speedMult = undefined;
          if (e._baseSpeedBackup !== undefined) { e.speed = e._baseSpeedBackup; e._baseSpeedBackup = undefined; }
        }
      }
    }

    // Player freeze hook (future use)
    // window._playerFrozen and window._playerFrozenTimer reserved
  }

  // Key handler
  function _onKeyDown(ev) {
    if (ev.altKey && (ev.code === 'KeyZ' || ev.key === 'z' || ev.key === 'Z')) {
      ev.preventDefault();
      throw_grenade();
    }
  }

  // init
  function init(scene, camera) {
    _scene = scene || window._gameScene || window._scene;
    _camera = camera || window._camera;
    _charges = MAX_CHARGES;
    _cooldowns = [0, 0];
    _active = [];
    _particles = [];
    _shockwaves = [];
    _lights = [];
    _hudEl = null;
    window._frozenEnemies = [];
    _createHUD();
    _updateHUD();
    window.removeEventListener('keydown', _onKeyDown);
    window.addEventListener('keydown', _onKeyDown);
  }

  // reset
  function reset() {
    _charges = MAX_CHARGES;
    _cooldowns = [0, 0];
    var i, e;
    for (i = 0; i < _active.length; i++) {
      if (_scene && _active[i].mesh) { try { _scene.remove(_active[i].mesh); } catch (ex) {} }
    }
    _active = [];
    for (i = 0; i < _particles.length; i++) {
      if (_scene && _particles[i].mesh) { try { _scene.remove(_particles[i].mesh); } catch (ex) {} }
    }
    _particles = [];
    for (i = 0; i < _shockwaves.length; i++) {
      if (_scene && _shockwaves[i].mesh) { try { _scene.remove(_shockwaves[i].mesh); } catch (ex) {} }
    }
    _shockwaves = [];
    for (i = 0; i < _lights.length; i++) {
      if (_scene && _lights[i].light) { try { _scene.remove(_lights[i].light); } catch (ex) {} }
    }
    _lights = [];
    var enemies = _getEnemies();
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e) continue;
      if (e.frozen) {
        e.frozen = false;
        e.frozenTimer = 0;
        e._frozenEnemy = false;
        e._suppressionActive = false;
        if (e._baseSpeedBackup !== undefined) { e.speed = e._baseSpeedBackup; e._baseSpeedBackup = undefined; }
        _tintEnemy(e, false);
        _removeIceSphere(e);
      }
      if (e._slowedByFreeze) {
        e._slowedByFreeze = false;
        e._speedMult = undefined;
        if (e._baseSpeedBackup !== undefined) { e.speed = e._baseSpeedBackup; e._baseSpeedBackup = undefined; }
      }
    }
    window._frozenEnemies = [];
    _updateHUD();
  }

  // Public API
  return {
    init: init,
    update: update,
    throw_grenade: throw_grenade,
    reset: reset
  };

}());
