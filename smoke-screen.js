// smoke-screen.js — Smoke grenade / smoke screen tactical module
// Key: F3 to deploy smoke grenade at player position
// IIFE module — no let/const anywhere
window.SmokeScreen = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MAX_ACTIVE      = 3;       // max simultaneous smoke clouds
  var PARTICLE_COUNT  = 12;      // spheres per cloud
  var PARTICLE_RADIUS = 0.8;     // SphereGeometry radius
  var EXPAND_RADIUS   = 4;       // final cloud radius in world units
  var EXPAND_TIME     = 2;       // seconds to reach full radius
  var PERSIST_TIME    = 12;      // seconds cloud persists at full size
  var FADE_TIME       = 2;       // seconds to fade out after persist
  var TOTAL_LIFE      = EXPAND_TIME + PERSIST_TIME + FADE_TIME;
  var COOLDOWN_SEC    = 20;      // seconds between deploys
  var MAX_USES        = 3;       // uses per life
  var SMOKE_COLOR     = 0x888888;
  var SMOKE_OPACITY   = 0.6;
  var VIGNETTE_STYLE  = 'grayscale(30%) brightness(0.9)';

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene     = null;
  var _camera    = null;

  var _uses      = MAX_USES;
  var _cooldown  = 0;           // seconds remaining on cooldown
  var _clouds    = [];          // array of active cloud objects
  var _keyBound  = false;
  var _hudEl     = null;
  var _vigActive = false;

  // Public array readable by other modules
  window._smokeZones = [];

  // ── Init ──────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene    = scene;
    _camera   = camera;
    _uses     = MAX_USES;
    _cooldown = 0;
    _clouds   = [];
    window._smokeZones = [];
    _vigActive = false;
    _removeVignette();
    _ensureHUD();
    _updateHUD();
    _bindKey();
  }

  // ── Key binding (F3) ──────────────────────────────────────────────────────
  function _bindKey() {
    if (_keyBound) return;
    _keyBound = true;
    document.addEventListener('keydown', function (e) {
      if (e.code === 'F3' || e.key === 'F3') {
        e.preventDefault();
        deploy();
      }
    });
  }

  // ── Deploy ────────────────────────────────────────────────────────────────
  function deploy() {
    if (!_scene || !_camera) return;
    if (_uses <= 0) { _flashHUD('No smokes left!'); return; }
    if (_cooldown > 0) { _flashHUD('Cooldown ' + Math.ceil(_cooldown) + 's'); return; }
    if (_clouds.length >= MAX_ACTIVE) { _flashHUD('Max smokes active'); return; }

    _uses--;
    _cooldown = COOLDOWN_SEC;

    // Position: player camera position, ground level
    var pos = _camera.position.clone();
    pos.y = 0.1;

    var cloud = _buildCloud(pos);
    _clouds.push(cloud);
    _playHissSound();
    _updateHUD();
    _flashHUD('Smoke deployed!');
  }

  // ── Build a smoke cloud ───────────────────────────────────────────────────
  function _buildCloud(pos) {
    var particles = [];
    var geo  = new THREE.SphereGeometry(PARTICLE_RADIUS, 6, 6);
    var mat  = new THREE.MeshBasicMaterial({
      color:       SMOKE_COLOR,
      transparent: true,
      opacity:     SMOKE_OPACITY,
      depthWrite:  false
    });

    // Distribute particles in a sphere pattern using golden-angle spread
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var mesh = new THREE.Mesh(geo, mat.clone());
      // Fibonacci sphere distribution for even spacing
      var phi   = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
      var theta = Math.PI * (1 + Math.sqrt(5)) * i;
      // Store unit-sphere offset; radius scales during expansion
      var ox = Math.sin(phi) * Math.cos(theta);
      var oy = Math.abs(Math.sin(phi) * Math.sin(theta)); // keep above ground
      var oz = Math.cos(phi);
      mesh.userData.offset = { x: ox, y: oy, z: oz };
      mesh.position.set(pos.x, pos.y, pos.z);
      _scene.add(mesh);
      particles.push(mesh);
    }

    var cloud = {
      pos:       pos,
      particles: particles,
      age:       0,
      currentRadius: 0
    };
    return cloud;
  }

  // ── Update (call every frame with delta time in seconds) ──────────────────
  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;

    // Tick cooldown
    if (_cooldown > 0) {
      _cooldown -= delta;
      if (_cooldown < 0) _cooldown = 0;
      _updateHUD();
    }

    // Wind values from global (other modules may set these)
    var windX = (typeof window._windX === 'number') ? window._windX : 0;
    var windZ = (typeof window._windZ === 'number') ? window._windZ : 0;

    // Update each cloud
    var newClouds = [];
    window._smokeZones = [];

    for (var i = 0; i < _clouds.length; i++) {
      var cloud = _clouds[i];
      cloud.age += delta;

      // Apply wind drift to cloud center
      cloud.pos.x += windX * delta;
      cloud.pos.z += windZ * delta;

      // Calculate current radius
      var radius;
      if (cloud.age < EXPAND_TIME) {
        radius = EXPAND_RADIUS * (cloud.age / EXPAND_TIME);
      } else {
        radius = EXPAND_RADIUS;
      }
      cloud.currentRadius = radius;

      // Calculate opacity
      var opacity;
      if (cloud.age < EXPAND_TIME) {
        opacity = SMOKE_OPACITY * (cloud.age / EXPAND_TIME);
      } else if (cloud.age < EXPAND_TIME + PERSIST_TIME) {
        opacity = SMOKE_OPACITY;
      } else {
        var fadeProgress = (cloud.age - EXPAND_TIME - PERSIST_TIME) / FADE_TIME;
        opacity = SMOKE_OPACITY * (1 - fadeProgress);
        if (opacity < 0) opacity = 0;
      }

      // Position each particle
      for (var j = 0; j < cloud.particles.length; j++) {
        var p = cloud.particles[j];
        var off = p.userData.offset;
        p.position.set(
          cloud.pos.x + off.x * radius,
          cloud.pos.y + off.y * radius,
          cloud.pos.z + off.z * radius
        );
        p.material.opacity = opacity;
      }

      // Publish smoke zone for other modules
      window._smokeZones.push({
        x:      cloud.pos.x,
        z:      cloud.pos.z,
        radius: cloud.currentRadius,
        age:    cloud.age
      });

      // Tag enemies inside smoke
      _tagEnemiesInCloud(cloud);

      // Keep cloud if still alive
      if (cloud.age < TOTAL_LIFE) {
        newClouds.push(cloud);
      } else {
        _destroyCloud(cloud);
      }
    }
    _clouds = newClouds;

    // Player vignette: check if camera is inside any smoke zone
    _updateVignette();
  }

  // ── Tag enemies inside smoke ───────────────────────────────────────────────
  function _tagEnemiesInCloud(cloud) {
    // Attempt to read global enemy list from common game globals
    var enemies = window._enemies || window._activeEnemies || [];
    if (!Array.isArray(enemies)) return;

    var r2 = cloud.currentRadius * cloud.currentRadius;
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (!enemy) continue;
      var pos = enemy.position || (enemy.mesh && enemy.mesh.position);
      if (!pos) continue;
      var dx = pos.x - cloud.pos.x;
      var dz = pos.z - cloud.pos.z;
      var dist2 = dx * dx + dz * dz;
      enemy._lostInSmoke = (dist2 <= r2);
    }
  }

  // ── Vignette filter when player is inside own smoke ───────────────────────
  function _updateVignette() {
    if (!_camera) return;
    var px = _camera.position.x;
    var pz = _camera.position.z;
    var inside = false;
    for (var i = 0; i < _clouds.length; i++) {
      var cloud = _clouds[i];
      var dx = px - cloud.pos.x;
      var dz = pz - cloud.pos.z;
      var dist2 = dx * dx + dz * dz;
      var r2 = cloud.currentRadius * cloud.currentRadius;
      if (dist2 <= r2) { inside = true; break; }
    }
    if (inside && !_vigActive) {
      _applyVignette();
    } else if (!inside && _vigActive) {
      _removeVignette();
    }
  }

  function _applyVignette() {
    _vigActive = true;
    var canvas = document.querySelector('canvas');
    if (canvas) canvas.style.filter = VIGNETTE_STYLE;
  }

  function _removeVignette() {
    _vigActive = false;
    var canvas = document.querySelector('canvas');
    if (canvas) canvas.style.filter = '';
  }

  // ── Destroy cloud: remove meshes from scene ───────────────────────────────
  function _destroyCloud(cloud) {
    for (var i = 0; i < cloud.particles.length; i++) {
      _scene.remove(cloud.particles[i]);
      if (cloud.particles[i].geometry) cloud.particles[i].geometry.dispose();
      if (cloud.particles[i].material) cloud.particles[i].material.dispose();
    }
    cloud.particles = [];
  }

  // ── Hiss audio via Web Audio API (white noise burst) ─────────────────────
  function _playHissSound() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx = new AudioCtx();

      // White noise buffer (0.6 seconds)
      var bufferSize = ctx.sampleRate * 0.6;
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data   = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }

      var source = ctx.createBufferSource();
      source.buffer = buffer;

      // Band-pass filter to shape hiss
      var bpf = ctx.createBiquadFilter();
      bpf.type            = 'bandpass';
      bpf.frequency.value = 3000;
      bpf.Q.value         = 0.5;

      // Gain envelope: ramp up then down
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0,   ctx.currentTime + 0.6);

      source.connect(bpf);
      bpf.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      source.stop(ctx.currentTime + 0.65);

      // Close AudioContext after playback
      source.onended = function () {
        try { ctx.close(); } catch (ignore) {}
      };
    } catch (e) {
      // Audio unavailable — silently skip
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'smoke-screen-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.55)',
      'color:#ccc',
      'font-family:monospace',
      'font-size:13px',
      'padding:4px 10px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9998',
      'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var cdStr = (_cooldown > 0) ? ' | CD:' + Math.ceil(_cooldown) + 's' : '';
    _hudEl.textContent = '[F3] SMOKE ' + _uses + '/' + MAX_USES + cdStr;
  }

  var _flashTimer = null;
  function _flashHUD(msg) {
    if (!_hudEl) return;
    var prev = _hudEl.textContent;
    _hudEl.textContent = msg;
    _hudEl.style.color = '#fff';
    if (_flashTimer) clearTimeout(_flashTimer);
    _flashTimer = setTimeout(function () {
      _hudEl.style.color = '#ccc';
      _updateHUD();
      _flashTimer = null;
    }, 1800);
  }

  // ── Reset (called on player death / new life) ─────────────────────────────
  function reset() {
    // Destroy all active clouds
    for (var i = 0; i < _clouds.length; i++) {
      _destroyCloud(_clouds[i]);
    }
    _clouds    = [];
    window._smokeZones = [];
    _uses      = MAX_USES;
    _cooldown  = 0;
    _removeVignette();
    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    deploy: deploy,
    reset:  reset
  };
})();
