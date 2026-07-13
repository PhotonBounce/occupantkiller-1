// ============================================================
//  lightning-storm.js — Dynamic Lightning Storm feature module
//  Public API: init(scene, camera, enemies, playerRef), update(dt), trigger(), reset()
//  window._lightningStormActive — boolean flag
// ============================================================
window.LightningStorm = (function () {
  'use strict';

  // ── private state ──────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;
  var _enemies      = null;
  var _playerRef    = null;

  // timing
  var _nextStormIn  = 0;   // seconds until next storm starts
  var _stormTimer   = 0;   // seconds remaining in active storm
  var STORM_DURATION = 30; // seconds

  // bolt state
  var _boltTimer    = 0;   // countdown to next bolt in storm
  var _boltLines    = [];  // active THREE.LineSegments in scene

  // screen flash
  var _flashEl      = null;
  var _flashTimer   = 0;
  var FLASH_DURATION = 0.05; // seconds

  // camera shake
  var _shakeMag     = 0;
  var _shakeTimer   = 0;
  var SHAKE_DURATION = 0.5;

  // ambient light reference
  var _ambientLight = null;
  var _ambientOrig  = 0.8;

  // thunder scheduling
  var _thunderQueue = []; // list of timestamps (Date.now ms) to fire thunder

  // AudioContext for thunder synthesis
  var _audioCtx     = null;

  // toast HUD
  var _toastShown   = false;

  // ── helpers ────────────────────────────────────────────────

  function _randRange(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function _pickNextInterval() {
    // 60–120 seconds between storms
    return _randRange(60, 120);
  }

  function _getOrCreateFlashEl() {
    if (_flashEl) return _flashEl;
    _flashEl = document.getElementById('lightning-flash-overlay');
    if (!_flashEl) {
      _flashEl = document.createElement('div');
      _flashEl.id = 'lightning-flash-overlay';
      _flashEl.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'right:0',
        'bottom:0',
        'background:rgba(255,255,255,0.8)',
        'opacity:0',
        'pointer-events:none',
        'z-index:197',
        'transition:opacity 0.05s'
      ].join(';');
      document.body.appendChild(_flashEl);
    }
    return _flashEl;
  }

  function _showToast(msg, color) {
    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast(msg, color || '#ffffaa');
    } else {
      // fallback: brief DOM toast
      var el = document.createElement('div');
      el.textContent = msg;
      el.style.cssText = [
        'position:fixed',
        'top:20%',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.75)',
        'color:' + (color || '#ffffaa'),
        'font-family:monospace',
        'font-size:14px',
        'padding:6px 18px',
        'border-radius:6px',
        'z-index:500',
        'pointer-events:none'
      ].join(';');
      document.body.appendChild(el);
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 2500);
    }
  }

  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _playThunder() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc    = ctx.createOscillator();
      var gain   = ctx.createGain();
      var filter = ctx.createBiquadFilter();

      osc.type            = 'sawtooth';
      osc.frequency.value = 60;
      filter.type         = 'lowpass';
      filter.frequency.value = 200;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      var now = ctx.currentTime;
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      osc.start(now);
      osc.stop(now + 2.0);
    } catch (e) {
      // silently ignore audio errors
    }
  }

  // Build a jagged lightning bolt LineSegments from sky to ground point
  function _createBolt(groundX, groundZ) {
    var segCount = Math.floor(_randRange(8, 13)); // 8–12 segments
    var positions = [];
    var topY = 30;
    var dx = groundX;
    var dz = groundZ;

    for (var i = 0; i <= segCount; i++) {
      var t = i / segCount;
      var baseX = dx * t;
      var baseY = topY * (1 - t);
      var baseZ = dz * t;

      if (i > 0 && i < segCount) {
        // random jagged offset ±1 unit in X and Z
        baseX += _randRange(-1, 1);
        baseZ += _randRange(-1, 1);
      }

      positions.push(baseX, baseY, baseZ);
    }

    // Build line pairs (each segment = start + end vertex)
    var linePositions = [];
    for (var j = 0; j < positions.length / 3 - 1; j++) {
      var idx = j * 3;
      linePositions.push(
        positions[idx],     positions[idx + 1],     positions[idx + 2],
        positions[idx + 3], positions[idx + 4], positions[idx + 5]
      );
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    );

    // white-yellow bolt color
    var mat = new THREE.LineBasicMaterial({
      color: 0xffffaa,
      linewidth: 2,
      transparent: true,
      opacity: 1.0
    });

    var bolt = new THREE.LineSegments(geo, mat);
    return bolt;
  }

  // Remove all active bolt meshes from scene
  function _clearBolts() {
    for (var i = 0; i < _boltLines.length; i++) {
      if (_scene) _scene.remove(_boltLines[i]);
      if (_boltLines[i].geometry) _boltLines[i].geometry.dispose();
      if (_boltLines[i].material) _boltLines[i].material.dispose();
    }
    _boltLines.length = 0;
  }

  // Damage checks: enemies and player
  function _checkStrikeEffects(groundX, groundZ) {
    // enemy check — within 3 units → 50 dmg + stun 2s
    if (_enemies) {
      var list = (typeof _enemies === 'function') ? _enemies() : _enemies;
      if (list && list.length) {
        for (var i = 0; i < list.length; i++) {
          var e = list[i];
          if (!e || !e.position) continue;
          var ex = e.position.x - groundX;
          var ez = e.position.z - groundZ;
          var eDist = Math.sqrt(ex * ex + ez * ez);
          if (eDist < 3) {
            if (typeof e.takeDamage === 'function') e.takeDamage(50);
            if (typeof e.stun       === 'function') e.stun(2);
            // fallback: mark stun on object
            e._lightningStunTimer = 2;
          }
        }
      }
    }

    // player check — within 5 units → 25 dmg + camera shake
    if (_playerRef) {
      var px = _playerRef.position ? _playerRef.position.x : (_camera ? _camera.position.x : 0);
      var pz = _playerRef.position ? _playerRef.position.z : (_camera ? _camera.position.z : 0);
      var pdx = px - groundX;
      var pdz = pz - groundZ;
      var pDist = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pDist < 5) {
        if (typeof _playerRef.takeDamage === 'function') _playerRef.takeDamage(25);
        // trigger camera shake
        _shakeMag   = 1.0;
        _shakeTimer = SHAKE_DURATION;
      }
    }
  }

  // Fire one lightning strike
  function _strikeBolt() {
    if (!_scene || !_camera) return;

    // Pick a random ground point within 30 units of camera
    var cx = _camera.position.x;
    var cz = _camera.position.z;
    var range = 30;
    var gx = cx + _randRange(-range, range);
    var gz = cz + _randRange(-range, range);

    // bolt count: 3–5
    var boltCount = Math.floor(_randRange(3, 6));
    for (var b = 0; b < boltCount; b++) {
      var bx = gx + _randRange(-4, 4);
      var bz = gz + _randRange(-4, 4);
      var bolt = _createBolt(bx, bz);
      _scene.add(bolt);
      _boltLines.push(bolt);
    }

    // Screen flash
    _flashTimer = FLASH_DURATION;
    var fEl = _getOrCreateFlashEl();
    fEl.style.opacity = '1';

    // Schedule thunder 2s after flash
    _thunderQueue.push(Date.now() + 2000);

    // Damage effects
    _checkStrikeEffects(gx, gz);
  }

  // Dim/restore ambient light
  function _findAmbientLight() {
    if (_ambientLight) return;
    if (!_scene) return;
    _scene.traverse(function (obj) {
      if (obj.isAmbientLight && !_ambientLight) {
        _ambientLight = obj;
        _ambientOrig = obj.intensity;
      }
    });
    // Also check scene.ambientLight shortcut some games use
    if (!_ambientLight && _scene.ambientLight) {
      _ambientLight = _scene.ambientLight;
      _ambientOrig = _ambientLight.intensity;
    }
  }

  function _setAmbientIntensity(val) {
    _findAmbientLight();
    if (_ambientLight) _ambientLight.intensity = val;
  }

  // ── Public API ─────────────────────────────────────────────

  function init(scene, camera, enemies, playerRef) {
    _scene     = scene  || null;
    _camera    = camera || null;
    _enemies   = enemies   || null;
    _playerRef = playerRef || null;

    _nextStormIn  = _pickNextInterval();
    _stormTimer   = 0;
    _boltTimer    = 0;
    _shakeMag     = 0;
    _shakeTimer   = 0;
    _flashTimer   = 0;
    _toastShown   = false;
    _thunderQueue = [];
    _boltLines    = [];

    window._lightningStormActive = false;

    // Ensure flash overlay exists
    _getOrCreateFlashEl();
  }

  function trigger() {
    if (window._lightningStormActive) return;
    window._lightningStormActive = true;
    _stormTimer  = STORM_DURATION;
    _boltTimer   = 0;
    _toastShown  = false;

    // Toast before first bolt
    _showToast('⚡ STORM INCOMING', '#ffffaa');

    // Dim ambient light
    _setAmbientIntensity(0.3);
  }

  function reset() {
    _clearBolts();
    window._lightningStormActive = false;
    _stormTimer  = 0;
    _boltTimer   = 0;
    _shakeMag    = 0;
    _shakeTimer  = 0;
    _flashTimer  = 0;
    _thunderQueue = [];
    _nextStormIn = _pickNextInterval();

    // Restore ambient light
    _setAmbientIntensity(_ambientOrig);

    // Clear flash
    var fEl = _getOrCreateFlashEl();
    fEl.style.opacity = '0';
  }

  function update(dt) {
    if (!_scene || !_camera) return;

    // Drain thunder queue
    var now = Date.now();
    var remaining = [];
    for (var q = 0; q < _thunderQueue.length; q++) {
      if (_thunderQueue[q] <= now) {
        _playThunder();
      } else {
        remaining.push(_thunderQueue[q]);
      }
    }
    _thunderQueue = remaining;

    // Camera shake
    if (_shakeTimer > 0) {
      _shakeTimer -= dt;
      var t = Date.now() / 1000;
      var mag = _shakeMag * Math.max(0, _shakeTimer / SHAKE_DURATION);
      _camera.position.x += Math.sin(t * 20) * 0.1 * mag;
      _camera.position.y += Math.sin(t * 17) * 0.05 * mag;
      if (_shakeTimer <= 0) {
        _shakeMag = 0;
        _shakeTimer = 0;
      }
    }

    // Screen flash decay
    if (_flashTimer > 0) {
      _flashTimer -= dt;
      if (_flashTimer <= 0) {
        _flashTimer = 0;
        var fEl = _getOrCreateFlashEl();
        fEl.style.opacity = '0';
        // Clear bolts once flash fades
        _clearBolts();
      }
    }

    // ── Storm lifecycle ──────────────────────────────────────
    if (!window._lightningStormActive) {
      // Count down to next storm
      _nextStormIn -= dt;
      if (_nextStormIn <= 0) {
        trigger();
      }
      return;
    }

    // Active storm
    _stormTimer -= dt;
    if (_stormTimer <= 0) {
      // Storm ended
      reset();
      return;
    }

    // Ambient flicker — interpolate toward dim while storm active
    _setAmbientIntensity(0.3 + 0.1 * Math.sin(Date.now() / 300));

    // Schedule bolts: every 1–3 seconds within storm
    _boltTimer -= dt;
    if (_boltTimer <= 0) {
      _strikeBolt();
      _boltTimer = _randRange(1, 3);
    }
  }

  // ── Export ─────────────────────────────────────────────────
  return {
    init:    init,
    update:  update,
    trigger: trigger,
    reset:   reset
  };

})();
