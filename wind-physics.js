/**
 * wind-physics.js — Dynamic Wind System
 * Affects bullets, particles, debris, rain, smoke, flags, trees, and grass.
 *
 * Exposes: window.WindPhysics = { init, update, getWind, reset }
 * Globals set each frame: window._windX, window._windZ
 *
 * IIFE pattern, all var — no let/const anywhere.
 */

window.WindPhysics = (function () {
  'use strict';

  /* ── Private state ──────────────────────────────────────────────────── */

  var _initialized    = false;
  var _time           = 0;          // accumulated seconds

  // Base wind (slow variation)
  var _baseX          = 0;
  var _baseZ          = 0;

  // Gust state
  var _gustActive     = false;
  var _gustTimer      = 0;          // how long current gust has lasted
  var _gustDuration   = 0;          // total duration of current gust
  var _gustX          = 0;
  var _gustZ          = 0;
  var _gustSpeed      = 0;
  var _nextGustIn     = 30;         // seconds until next gust
  var _gustCooldown   = 0;          // counts down between gusts

  // Warning throttle
  var _gustWarnSent   = false;

  // HUD element
  var _hudEl          = null;

  // Audio
  var _audioCtx       = null;
  var _gustSource     = null;
  var _gustGain       = null;
  var _gustFilter     = null;
  var _gustPlaying    = false;

  // Flag meshes cache
  var _flagMeshes     = [];
  var _flagScanTimer  = 0;

  // Grass/tree meshes cache
  var _swayMeshes     = [];
  var _swayScanTimer  = 0;

  /* ── Helpers ────────────────────────────────────────────────────────── */

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function _showToast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
  }

  /* ── Wind generation ────────────────────────────────────────────────── */

  function _computeBaseWind(t) {
    // Slow sinusoidal variation — never exceeds +/-3 units/s per axis
    var bx = Math.sin(t / 30) * Math.cos(t / 47) * 3;
    var bz = Math.cos(t / 23) * Math.sin(t / 41) * 3;
    return { x: bx, z: bz };
  }

  function _scheduleNextGust() {
    _nextGustIn   = _rand(20, 60);
    _gustCooldown = _nextGustIn;
  }

  function _startGust() {
    _gustActive   = true;
    _gustDuration = _rand(3, 8);
    _gustTimer    = 0;
    _gustSpeed    = _rand(5, 8);
    _gustWarnSent = false;

    // Random direction for the gust
    var angle = Math.random() * Math.PI * 2;
    _gustX = Math.cos(angle) * _gustSpeed;
    _gustZ = Math.sin(angle) * _gustSpeed;

    _startGustAudio();
  }

  function _endGust() {
    _gustActive = false;
    _gustX      = 0;
    _gustZ      = 0;
    _gustSpeed  = 0;
    _stopGustAudio();
    _scheduleNextGust();
  }

  /* ── Audio ──────────────────────────────────────────────────────────── */

  function _ensureAudioCtx() {
    if (_audioCtx) return true;
    try {
      _audioCtx = window._audioCtx ||
        new (window.AudioContext || window.webkitAudioContext)();
      return true;
    } catch (e) {
      return false;
    }
  }

  function _startGustAudio() {
    if (!_ensureAudioCtx()) return;
    if (_gustPlaying) return;

    try {
      // White noise buffer — 2 seconds, looped
      var bufLen = _audioCtx.sampleRate * 2;
      var buffer = _audioCtx.createBuffer(1, bufLen, _audioCtx.sampleRate);
      var data   = buffer.getChannelData(0);
      var i;
      for (i = 0; i < bufLen; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      _gustSource        = _audioCtx.createBufferSource();
      _gustSource.buffer = buffer;
      _gustSource.loop   = true;

      _gustFilter                    = _audioCtx.createBiquadFilter();
      _gustFilter.type               = 'bandpass';
      _gustFilter.frequency.value    = 400;
      _gustFilter.Q.value            = 0.5;

      _gustGain            = _audioCtx.createGain();
      _gustGain.gain.value = 0;   // fade in via update

      _gustSource.connect(_gustFilter);
      _gustFilter.connect(_gustGain);
      _gustGain.connect(_audioCtx.destination);
      _gustSource.start(0);
      _gustPlaying = true;
    } catch (e) {
      // audio unavailable
    }
  }

  function _stopGustAudio() {
    if (!_gustPlaying) return;
    try {
      if (_gustGain) {
        _gustGain.gain.setTargetAtTime(0, _audioCtx.currentTime, 0.3);
      }
      if (_gustSource) {
        _gustSource.stop(_audioCtx.currentTime + 1.0);
      }
    } catch (e) { }
    _gustPlaying = false;
    _gustSource  = null;
    _gustGain    = null;
    _gustFilter  = null;
  }

  function _updateGustAudio(speed) {
    if (!_gustPlaying || !_gustGain) return;
    // Amplitude proportional to wind speed (max ~8)
    var targetGain = _clamp(speed / 8, 0, 1) * 0.15;
    try {
      _gustGain.gain.setTargetAtTime(targetGain, _audioCtx.currentTime, 0.2);
    } catch (e) { }
  }

  /* ── HUD indicator ──────────────────────────────────────────────────── */

  function _ensureHud() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'wind-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:14px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.45)',
      'color:#e8f4ff',
      'font-family:monospace',
      'font-size:13px',
      'padding:4px 10px',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:500',
      'display:flex',
      'align-items:center',
      'gap:6px',
      'user-select:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHud(windX, windZ, speed) {
    if (!_hudEl) return;
    // Arrow rotation: atan2 gives angle from +Z axis, rotated to CSS degrees
    var deg   = Math.round(Math.atan2(windX, windZ) * 180 / Math.PI);
    var arrow = '<span style="display:inline-block;transform:rotate(' + deg + 'deg)">&#8593;</span>';
    _hudEl.innerHTML = '💨 ' + arrow + ' ' + speed.toFixed(1) + 'm/s';
  }

  /* ── Flag waving ────────────────────────────────────────────────────── */

  function _scanForFlags() {
    _flagMeshes = [];

    // window._captureFlag (single mesh / group)
    if (window._captureFlag) {
      _flagMeshes.push(window._captureFlag);
    }

    // Any Three.js objects in the scene named "flag" (case-insensitive)
    if (window._scene && window._scene.traverse) {
      window._scene.traverse(function (obj) {
        if (obj.name && /flag/i.test(obj.name) && obj !== window._captureFlag) {
          _flagMeshes.push(obj);
        }
      });
    }
  }

  function _updateFlags(t, speed) {
    var i, obj;
    for (i = 0; i < _flagMeshes.length; i++) {
      obj = _flagMeshes[i];
      if (!obj || !obj.rotation) continue;
      // Oscillate around Y and Z proportional to wind speed
      obj.rotation.y = Math.sin(t * 3.5 + i) * (speed / 8) * 0.4;
      obj.rotation.z = Math.sin(t * 5.1 + i * 0.7) * (speed / 8) * 0.15;
    }
  }

  /* ── Grass / tree sway ──────────────────────────────────────────────── */

  function _scanForSwayMeshes() {
    _swayMeshes = [];
    if (!window._scene || !window._scene.traverse) return;
    window._scene.traverse(function (obj) {
      if (obj.name && /grass|tree/i.test(obj.name)) {
        _swayMeshes.push(obj);
      }
    });
  }

  function _updateSway(t, speed) {
    var i, obj;
    for (i = 0; i < _swayMeshes.length; i++) {
      obj = _swayMeshes[i];
      if (!obj || !obj.rotation) continue;
      obj.rotation.z = Math.sin(t * 2.3 + i * 0.4) * (speed / 8) * 0.12;
      obj.rotation.x = Math.sin(t * 1.9 + i * 0.6) * (speed / 8) * 0.06;
    }
  }

  /* ── Wind barrier (fortification integration) ───────────────────────── */

  function _getBarrierReduction() {
    // If BaseFortify placed METAL_WALL forts, treat them as wind barriers
    if (!window.BaseFortify || !window.BaseFortify.getForts) return 1;
    var forts = window.BaseFortify.getForts();
    if (!forts || forts.length === 0) return 1;
    var reduction = 1;
    var i, fort;
    for (i = 0; i < forts.length; i++) {
      fort = forts[i];
      if (fort && fort.type === 'METAL_WALL') {
        reduction *= 0.6; // each metal wall reduces wind by 40%
        if (reduction < 0.1) { reduction = 0.1; break; }
      }
    }
    return reduction;
  }

  /* ── Bullet drift helper (called externally) ─────────────────────────── */
  // Long-range shots (>15 units) drift by windX/Z * range/50 on impact.
  // This function is provided for weapon code to call; it returns the drift offset.
  function _bulletDrift(rangeUnits) {
    if (rangeUnits <= 15) return { x: 0, z: 0 };
    var wx = window._windX || 0;
    var wz = window._windZ || 0;
    var factor = rangeUnits / 50;
    return { x: wx * factor, z: wz * factor };
  }

  /* ── Public API ─────────────────────────────────────────────────────── */

  function init() {
    if (_initialized) return;
    _initialized = true;

    _scheduleNextGust();
    _ensureHud();

    window._windX = 0;
    window._windZ = 0;
  }

  function update(dt) {
    if (!_initialized) return;

    dt = dt || 0.016;
    _time += dt;

    /* 1. Base wind */
    var base = _computeBaseWind(_time);
    _baseX = base.x;
    _baseZ = base.z;

    /* 2. Gust lifecycle */
    if (_gustActive) {
      _gustTimer += dt;

      // Warn player if strong enough and not yet warned
      if (!_gustWarnSent && _gustSpeed > 6) {
        _showToast('STRONG GUST!');
        _gustWarnSent = true;
      }

      if (_gustTimer >= _gustDuration) {
        _endGust();
      }
    } else {
      _gustCooldown -= dt;
      if (_gustCooldown <= 0) {
        _startGust();
      }
    }

    /* 3. Combined wind (base + gust) */
    var rawX = _baseX + _gustX;
    var rawZ = _baseZ + _gustZ;

    /* 4. Apply barrier reduction */
    var reduction = _getBarrierReduction();
    rawX *= reduction;
    rawZ *= reduction;

    /* 5. Clamp to [-8, +8] during gusts, [-3, +3] normally */
    var cap = _gustActive ? 8 : 3;
    rawX = _clamp(rawX, -cap, cap);
    rawZ = _clamp(rawZ, -cap, cap);

    /* 6. Expose globals */
    window._windX = rawX;
    window._windZ = rawZ;

    var speed = Math.sqrt(rawX * rawX + rawZ * rawZ);

    /* 7. Update audio */
    if (_gustActive) {
      _updateGustAudio(speed);
    }

    /* 8. Update HUD */
    _updateHud(rawX, rawZ, speed);

    /* 9. Flag waving — rescan every 5 s */
    _flagScanTimer += dt;
    if (_flagScanTimer > 5) {
      _scanForFlags();
      _flagScanTimer = 0;
    }
    _updateFlags(_time, speed);

    /* 10. Grass/tree sway — rescan every 10 s */
    _swayScanTimer += dt;
    if (_swayScanTimer > 10) {
      _scanForSwayMeshes();
      _swayScanTimer = 0;
    }
    _updateSway(_time, speed);
  }

  function getWind() {
    var x = window._windX || 0;
    var z = window._windZ || 0;
    return {
      x: x,
      z: z,
      speed: Math.sqrt(x * x + z * z)
    };
  }

  function reset() {
    _time         = 0;
    _baseX        = 0;
    _baseZ        = 0;
    _gustActive   = false;
    _gustTimer    = 0;
    _gustDuration = 0;
    _gustX        = 0;
    _gustZ        = 0;
    _gustSpeed    = 0;
    _gustWarnSent = false;
    _flagMeshes   = [];
    _swayMeshes   = [];
    _flagScanTimer  = 0;
    _swayScanTimer  = 0;

    window._windX = 0;
    window._windZ = 0;

    _stopGustAudio();
    _scheduleNextGust();

    if (_hudEl) {
      _updateHud(0, 0, 0);
    }
  }

  return {
    init: init,
    update: update,
    getWind: getWind,
    reset: reset,
    bulletDrift: _bulletDrift
  };

}());
