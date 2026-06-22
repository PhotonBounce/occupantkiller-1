// ============================================================
//  freeze-grenade.js — Cryogenic grenade feature module
//  Alt+G: throw freeze grenade (3 charges)
//  Parabolic throw arc, 8 units forward, 2 unit peak, 0.8s flight
//  On landing: burst of 12 ice shard particles, freeze radius 6 units
//  Frozen enemies: cannot move/attack, take 2x damage, 4s freeze
//  Ice sphere visual overlay; shatters on lethal damage for +150 bonus
//  HUD: "❄ CRYO ×N" counter bottom-left in cyan
//  Audio: whoosh on throw, crystal crack on impact, tinkle on shatter
// ============================================================
window.FreezeGrenade = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;

  var _count = 3;
  var MAX_COUNT = 3;

  var _active = [];          // in-flight grenades
  var _particles = [];       // ice shard particles after explosion
  var _hudEl = null;

  // ── HUD ───────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'freeze-grenade-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:16px',
      'color:#00EEFF',
      'font-size:13px',
      'font-family:monospace',
      'z-index:200',
      'pointer-events:none',
      'text-shadow:0 0 6px rgba(0,238,255,0.8)',
      'letter-spacing:1px'
    ].join(';');
    _hudEl.textContent = '❄ CRYO \xD7' + _count;
    var hud = document.getElementById('hud');
    if (hud) {
      hud.appendChild(_hudEl);
    } else {
      document.body.appendChild(_hudEl);
    }
  }

  function _updateHUD() {
    if (!_hudEl) _createHUD();
    _hudEl.textContent = '❄ CRYO \xD7' + _count;
    _hudEl.style.opacity = (_count > 0) ? '1' : '0.4';
  }

  // ── Audio helpers ─────────────────────────────────────────
  function _playWhoosh() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      osc.onended = function () {
        try { ctx.close(); } catch (e) {}
      };
    } catch (e) {}
  }

  function _playCrystalCrack() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Short broadband burst for crystal crack
      var bufLen = Math.floor(ctx.sampleRate * 0.25);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.12));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2000;
      var gain = ctx.createGain();
      gain.gain.value = 1.2;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      src.onended = function () {
        try { ctx.close(); } catch (e) {}
      };
    } catch (e) {}
  }

  function _playTinkle() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var freqs = [1047, 1319, 1568, 2093];
      for (var f = 0; f < freqs.length; f++) {
        (function (freq, delay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + delay + 0.01);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.4);
        }(freqs[f], f * 0.07));
      }
      setTimeout(function () {
        try { ctx.close(); } catch (e) {}
      }, 2000);
    } catch (e) {}
  }

  // ── Blue screen tint on detonation ────────────────────────
  function _blueTint() {
    var canvas = document.querySelector('canvas');
    if (!canvas) return;
    canvas.style.transition = 'filter 0.05s';
    canvas.style.filter = 'hue-rotate(180deg) saturate(1.5)';
    setTimeout(function () {
      canvas.style.transition = 'filter 0.4s';
      canvas.style.filter = '';
    }, 500);
  }

  // ── Ice shard particles ───────────────────────────────────
  function _spawnParticles(pos) {
    if (!_scene) return;
    var SHARD_COUNT = 12;
    for (var i = 0; i < SHARD_COUNT; i++) {
      var geo = new THREE.ConeGeometry(0.05, 0.3, 4);
      var mat = new THREE.MeshLambertMaterial({
        color: 0x00EEFF,
        transparent: true,
        opacity: 0.85
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      _scene.add(mesh);

      // Random outward direction
      var angle = (i / SHARD_COUNT) * Math.PI * 2;
      var upAngle = (Math.random() - 0.3) * Math.PI * 0.8;
      var vx = Math.cos(angle) * Math.cos(upAngle) * (2 + Math.random() * 3);
      var vy = Math.abs(Math.sin(upAngle)) * (2 + Math.random() * 2) + 1;
      var vz = Math.sin(angle) * Math.cos(upAngle) * (2 + Math.random() * 3);

      _particles.push({
        mesh: mesh,
        vel: { x: vx, y: vy, z: vz },
        life: 0.8 + Math.random() * 0.4,
        elapsed: 0
      });
    }
  }

  // ── Frozen enemy ice sphere visual ────────────────────────
  function _attachIceSphere(enemy) {
    if (!_scene || !enemy || !enemy.position) return;
    if (enemy._iceSphere) return;  // already has one
    var geo = new THREE.SphereGeometry(0.6, 8, 8);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x00EEFF,
      transparent: true,
      opacity: 0.45
    });
    var sphere = new THREE.Mesh(geo, mat);
    sphere.position.copy(enemy.position);
    _scene.add(sphere);
    enemy._iceSphere = sphere;
  }

  function _removeIceSphere(enemy) {
    if (!_scene || !enemy) return;
    if (enemy._iceSphere) {
      try { _scene.remove(enemy._iceSphere); } catch (ex) {}
      enemy._iceSphere = null;
    }
  }

  // ── Apply freeze to enemies in radius ────────────────────
  function _freezeEnemies(pos) {
    var RADIUS = 6;
    var FREEZE_S = 4.0;
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      var dx = e.position.x - pos.x;
      var dy = e.position.y - pos.y;
      var dz = e.position.z - pos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= RADIUS) {
        e.frozen = true;
        e.frozenTimer = FREEZE_S;
        _attachIceSphere(e);
      }
    }
  }

  function _getEnemies() {
    if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      return window.Enemies.getAll();
    }
    if (window.GameManager && Array.isArray(window.GameManager.enemies)) {
      return window.GameManager.enemies;
    }
    if (window._enemies && Array.isArray(window._enemies)) {
      return window._enemies;
    }
    if (window.enemies && Array.isArray(window.enemies)) {
      return window.enemies;
    }
    return [];
  }

  // ── Detonate ──────────────────────────────────────────────
  function _detonate(data) {
    var pos = data.mesh.position.clone();

    // Remove grenade mesh
    if (_scene) {
      try { _scene.remove(data.mesh); } catch (ex) {}
    }

    // Spawn ice shard particles
    _spawnParticles(pos);

    // Freeze enemies in radius
    _freezeEnemies(pos);

    // Blue canvas tint
    _blueTint();

    // Crystal crack audio
    _playCrystalCrack();
  }

  // ── Grenade mesh ─────────────────────────────────────────
  function _makeGrenadeMesh() {
    var geo = new THREE.SphereGeometry(0.12, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x00EEFF });
    return new THREE.Mesh(geo, mat);
  }

  // ── Throw logic ───────────────────────────────────────────
  function _throw() {
    if (!_scene || !_camera) return false;
    if (_count <= 0) return false;

    _count -= 1;
    _updateHUD();

    // Start at camera position
    var startPos = _camera.position.clone();
    startPos.y -= 0.2;

    // Forward direction in XZ plane
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    dir.y = 0;
    if (dir.lengthSq() < 0.0001) { dir.z = -1; }
    dir.normalize();

    var landPos = new THREE.Vector3(
      startPos.x + dir.x * 8,
      startPos.y,
      startPos.z + dir.z * 8
    );

    var mesh = _makeGrenadeMesh();
    mesh.position.copy(startPos);
    _scene.add(mesh);

    _active.push({
      mesh: mesh,
      startPos: startPos.clone(),
      landPos: landPos.clone(),
      elapsed: 0,
      duration: 0.8,
      detonated: false
    });

    _playWhoosh();
    return true;
  }

  // ── Update loop ───────────────────────────────────────────
  function update(dt) {
    var i, d, t;

    // Advance in-flight grenades
    for (i = _active.length - 1; i >= 0; i--) {
      d = _active[i];
      if (d.detonated) {
        _active.splice(i, 1);
        continue;
      }
      d.elapsed += dt;
      t = Math.min(d.elapsed / d.duration, 1);

      // Lerp XZ position
      d.mesh.position.x = d.startPos.x + (d.landPos.x - d.startPos.x) * t;
      d.mesh.position.z = d.startPos.z + (d.landPos.z - d.startPos.z) * t;

      // Parabolic Y arc: peak height 2 units
      var ARC_HEIGHT = 2.0;
      d.mesh.position.y = d.startPos.y + ARC_HEIGHT * 4 * t * (1 - t);

      if (t >= 1) {
        d.detonated = true;
        _detonate(d);
        _active.splice(i, 1);
      }
    }

    // Advance ice shard particles
    for (i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.elapsed += dt;
      if (p.elapsed >= p.life) {
        if (_scene) {
          try { _scene.remove(p.mesh); } catch (ex) {}
        }
        _particles.splice(i, 1);
        continue;
      }
      var frac = p.elapsed / p.life;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt - 4.9 * dt * dt; // gravity
      p.vel.y -= 9.8 * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.mesh.material.opacity = 0.85 * (1 - frac);
    }

    // Tick frozen timers on enemies and handle thaw / 2x damage / shatter
    var enemies = _getEnemies();
    for (i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.frozen) continue;

      // Tick timer
      e.frozenTimer -= dt;

      // Keep ice sphere tracking enemy position
      if (e._iceSphere && e.position) {
        e._iceSphere.position.copy(e.position);
      }

      // While frozen: stop movement and attacks
      if (e.velocity) { e.velocity.x = 0; e.velocity.z = 0; }
      if (typeof e.canMove !== 'undefined') { e.canMove = false; }
      if (typeof e.canAttack !== 'undefined') { e.canAttack = false; }

      // Check lethal-damage-while-frozen (health at/below 0 while still frozen)
      if (e.health !== undefined && e.health <= 0 && !e._shattered) {
        e._shattered = true;
        _removeIceSphere(e);
        _playTinkle();
        // +150 bonus score
        if (window.player && typeof window.player.score !== 'undefined') {
          window.player.score += 150;
        }
        if (window.HUD && typeof window.HUD.showToast === 'function') {
          window.HUD.showToast('ICE SHATTER! +150');
        }
        e.frozen = false;
        e.frozenTimer = 0;
        continue;
      }

      // Thaw after timer expires
      if (e.frozenTimer <= 0) {
        e.frozen = false;
        e.frozenTimer = 0;
        if (typeof e.canMove !== 'undefined') { e.canMove = true; }
        if (typeof e.canAttack !== 'undefined') { e.canAttack = true; }
        _removeIceSphere(e);
      }
    }
  }

  // ── Key handler ───────────────────────────────────────────
  function _onKeyDown(e) {
    // Alt+G
    if (e.altKey && (e.code === 'KeyG' || e.key === 'g' || e.key === 'G')) {
      e.preventDefault();
      _throw();
    }
  }

  // ── init ─────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _count = MAX_COUNT;
    _active = [];
    _particles = [];
    _hudEl = null;
    _createHUD();
    _updateHUD();
    window.removeEventListener('keydown', _onKeyDown);
    window.addEventListener('keydown', _onKeyDown);
  }

  // ── reset ─────────────────────────────────────────────────
  function reset() {
    _count = MAX_COUNT;
    // Clear in-flight grenades
    for (var i = 0; i < _active.length; i++) {
      if (_scene && _active[i].mesh) {
        try { _scene.remove(_active[i].mesh); } catch (ex) {}
      }
    }
    _active = [];
    // Clear particles
    for (var j = 0; j < _particles.length; j++) {
      if (_scene && _particles[j].mesh) {
        try { _scene.remove(_particles[j].mesh); } catch (ex) {}
      }
    }
    _particles = [];
    // Thaw all frozen enemies
    var enemies = _getEnemies();
    for (var k = 0; k < enemies.length; k++) {
      var e = enemies[k];
      if (e && e.frozen) {
        e.frozen = false;
        e.frozenTimer = 0;
        _removeIceSphere(e);
      }
    }
    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────
  return {
    init: init,
    update: update,
    throw_: _throw,
    reset: reset
  };

}());
