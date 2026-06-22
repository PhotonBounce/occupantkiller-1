// destruction-scoring.js — Destruction Combo Scoring Feature Module
// Ukraine conflict FPS — Three.js browser game
// IIFE pattern, all var (no let/const)

window.DestructionScoring = (function () {
  'use strict';

  // ── Private state ──────────────────────────────────────────────────────────
  var _comboCount       = 0;        // destructions in current combo
  var _comboTimer       = 0;        // ms timestamp of last destruction (Date.now())
  var _comboWindowMs    = 3000;     // 3s combo window
  var _totalScore       = 0;        // session score from this module
  var _bestCombo        = 0;        // session best combo chain length
  var _audioCtx         = null;     // AudioContext for ascending notes

  // Fireworks bonus tracking — types seen within 5s
  var _fireworksTypes   = {};       // { barrel: timestamp, vehicle: timestamp, ammo: timestamp }
  var _fireworksWindowMs = 5000;    // 5s window for FIREWORKS! bonus
  var _fireworksAwarded = false;    // prevent double-award in same window

  // Combo timeout handle
  var _comboTimeoutId   = null;

  // ── Audio helpers ──────────────────────────────────────────────────────────
  function _ensureAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) _audioCtx = new Ctx();
    } catch (e) { /* no audio available */ }
    return _audioCtx;
  }

  function _playNote(freqHz, durationMs) {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freqHz;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) { /* ignore audio errors */ }
  }

  // Play ascending note per combo level: maps combo 1..7+ to 440..880Hz
  function _playComboNote(comboCount) {
    var steps = Math.min(comboCount - 1, 6); // 0..6
    var freq = 440 + steps * (880 - 440) / 6; // 440 → 880 Hz in steps
    _playNote(freq, 300);
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────
  function _showComboText(text, color) {
    try {
      var el = document.createElement('div');
      el.textContent = text;
      el.style.cssText = [
        'position:fixed',
        'top:40%',
        'left:50%',
        'transform:translateX(-50%) translateY(0px)',
        'font-family:monospace',
        'font-size:22px',
        'font-weight:bold',
        'color:' + color,
        'text-shadow:0 0 12px ' + color,
        'z-index:9000',
        'pointer-events:none',
        'white-space:nowrap',
        'transition:transform 1.5s ease-out, opacity 1.5s ease-out',
        'opacity:1'
      ].join(';');
      document.body.appendChild(el);
      // Trigger animation after brief paint delay
      setTimeout(function () {
        el.style.transform = 'translateX(-50%) translateY(-80px)';
        el.style.opacity = '0';
      }, 50);
      // Remove from DOM after animation
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 1600);
    } catch (e) { /* DOM may not be ready */ }
  }

  // ── Multiplier / tier logic ───────────────────────────────────────────────
  function _getMultiplier(count) {
    if (count >= 7) return 5;   // CHAIN REACTION! — 5× (base label handled in _getLabel)
    if (count >= 5) return 5;   // 5+
    if (count >= 3) return 3;   // 3×
    if (count >= 2) return 2;   // 2×
    return 1;
  }

  function _getColor(count) {
    if (count >= 7) return '#ff2222'; // red
    if (count >= 5) return '#ff6600'; // orange-red
    if (count >= 3) return '#ff8800'; // orange
    return '#ffdd00';                 // yellow
  }

  function _getLabel(count, points) {
    var pts = '+' + points;
    if (count >= 7) return 'CHAIN REACTION! ' + pts;
    if (count >= 5) return 'UNSTOPPABLE! ' + pts;
    if (count >= 3) return 'TRIPLE! ' + pts;
    if (count >= 2) return 'DOUBLE DESTROY! ' + pts;
    return null; // no popup for single destructions
  }

  // ── Combo timeout reset ──────────────────────────────────────────────────
  function _scheduleComboReset() {
    if (_comboTimeoutId !== null) {
      clearTimeout(_comboTimeoutId);
    }
    _comboTimeoutId = setTimeout(function () {
      _comboTimeoutId = null;
      _comboCount = 0;
      _fireworksAwarded = false;
    }, _comboWindowMs);
  }

  // ── Public: onDestruction(type) ───────────────────────────────────────────
  function onDestruction(type) {
    var now = Date.now();

    // Increment combo
    _comboCount += 1;

    // Track session best
    if (_comboCount > _bestCombo) {
      _bestCombo = _comboCount;
      window._bestDestrCombo = _bestCombo;
    }

    // Compute multiplier and points for this destruction
    var mult = _getMultiplier(_comboCount);
    var points = 100 * mult;
    _totalScore += points;

    // Show combo popup (only for 2+ chains)
    var label = _getLabel(_comboCount, points);
    if (label) {
      _showComboText(label, _getColor(_comboCount));
    }

    // Play ascending audio note
    _playComboNote(_comboCount);

    // Fireworks bonus tracking
    var typeNorm = (type || '').toLowerCase();
    var isBarrel = typeNorm.indexOf('barrel') !== -1;
    var isVehicle = typeNorm.indexOf('vehicle') !== -1 || typeNorm.indexOf('car') !== -1 ||
                    typeNorm.indexOf('tank') !== -1 || typeNorm.indexOf('truck') !== -1;
    var isAmmo = typeNorm.indexOf('ammo') !== -1 || typeNorm.indexOf('ammunition') !== -1;

    if (isBarrel)  _fireworksTypes.barrel  = now;
    if (isVehicle) _fireworksTypes.vehicle = now;
    if (isAmmo)    _fireworksTypes.ammo    = now;

    // Check FIREWORKS! bonus: barrel + vehicle + ammo all within 5s
    if (!_fireworksAwarded) {
      var hasBarrel  = _fireworksTypes.barrel  && (now - _fireworksTypes.barrel)  < _fireworksWindowMs;
      var hasVehicle = _fireworksTypes.vehicle && (now - _fireworksTypes.vehicle) < _fireworksWindowMs;
      var hasAmmo    = _fireworksTypes.ammo    && (now - _fireworksTypes.ammo)    < _fireworksWindowMs;
      if (hasBarrel && hasVehicle && hasAmmo) {
        _fireworksAwarded = true;
        _totalScore += 1000;
        _showComboText('FIREWORKS! +1000', '#ff44ff');
        _playNote(880, 600);
      }
    }

    // Restart combo expiry timer
    _scheduleComboReset();
  }

  // ── Hook into explosion / destructible callbacks ──────────────────────────
  function _hookCallbacks() {
    // Wrap window._onExplosionForScorch — called by C4, grenade, mortar, etc.
    var _prevExplosion = window._onExplosionForScorch;
    window._onExplosionForScorch = function (x, y, z, radius) {
      onDestruction('explosion');
      if (typeof _prevExplosion === 'function') {
        _prevExplosion(x, y, z, radius);
      }
    };

    // Wrap window._onDestructibleDestroyed — called when destructible objects die
    var _prevDestroyed = window._onDestructibleDestroyed;
    window._onDestructibleDestroyed = function (type, pos) {
      onDestruction(type || 'destructible');
      if (typeof _prevDestroyed === 'function') {
        _prevDestroyed(type, pos);
      }
    };
  }

  // ── Public: init() ────────────────────────────────────────────────────────
  function init() {
    window._bestDestrCombo = 0;
    _hookCallbacks();
  }

  // ── Public: update(dt) ────────────────────────────────────────────────────
  // Called each frame. dt = delta time in seconds. Kept for API compatibility;
  // combo timeout is timer-driven so no per-frame work is strictly required.
  function update(dt) {
    // Reserved for future per-frame combo HUD animation updates.
    void dt;
  }

  // ── Public: reset() ───────────────────────────────────────────────────────
  function reset() {
    if (_comboTimeoutId !== null) {
      clearTimeout(_comboTimeoutId);
      _comboTimeoutId = null;
    }
    _comboCount = 0;
    _totalScore = 0;
    _bestCombo = 0;
    _fireworksTypes = {};
    _fireworksAwarded = false;
    window._bestDestrCombo = 0;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    onDestruction: onDestruction,
    reset: reset
  };

})();
