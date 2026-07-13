/* ───────────────────────────────────────────────────────────────────────
   RECOIL SYSTEM — realistic per-weapon recoil patterns with recovery
   Handles recoil impulse, recovery, burst-fire stacking, weapon sway,
   and crosshair spread. Camera reads window._recoilPitchDelta and
   window._recoilYawDelta each frame to apply the offsets.
   ─────────────────────────────────────────────────────────────────────── */
window.RecoilSystem = (function () {
  'use strict';

  // ── Recoil profiles per weapon ─────────────────────────────────────
  var RECOIL_PROFILES = {
    'AK74':     { vertical: 1.2, horizontal: 0.6, recovery: 3.0, pattern: 'V_CURVE' },
    'M4A1':     { vertical: 0.9, horizontal: 0.4, recovery: 4.0, pattern: 'STRAIGHT' },
    'AXMC':     { vertical: 3.0, horizontal: 0.2, recovery: 2.0, pattern: 'STRAIGHT' },
    'SVD':      { vertical: 2.5, horizontal: 0.3, recovery: 2.5, pattern: 'STRAIGHT' },
    'MG3':      { vertical: 1.5, horizontal: 1.0, recovery: 1.5, pattern: 'RANDOM' },
    'GLOCK17':  { vertical: 0.8, horizontal: 0.3, recovery: 5.0, pattern: 'STRAIGHT' },
    'MOSSBERG': { vertical: 4.0, horizontal: 1.5, recovery: 1.0, pattern: 'RANDOM' },
    'RPG7':     { vertical: 5.0, horizontal: 0.5, recovery: 0.5, pattern: 'STRAIGHT' },
    'DEFAULT':  { vertical: 1.0, horizontal: 0.5, recovery: 3.0, pattern: 'STRAIGHT' }
  };

  // ── Accumulated recoil state ────────────────────────────────────────
  var _recoilPitch  = 0;   // vertical recoil accumulation (degrees)
  var _recoilYaw    = 0;   // horizontal recoil accumulation (degrees)

  // ── Burst-fire tracking ─────────────────────────────────────────────
  var _burstCount   = 0;   // shots fired in current burst
  var _lastShotTime = 0;   // timestamp (ms) of last shot

  // ── Pattern state for V_CURVE ───────────────────────────────────────
  var _vcurvePhase  = 0;   // tracks AK-74 curve phase (shot index)

  // ── Max recoil clamp ────────────────────────────────────────────────
  var MAX_RECOIL    = 15;  // degrees

  // ── Burst-fire time threshold ───────────────────────────────────────
  var BURST_THRESHOLD = 0.15; // seconds between shots to count as burst

  // ── Sensitivity base scale ─────────────────────────────────────────
  var BASE_SENSITIVITY = 0.05; // scales degree values to camera-friendly range

  // ── Private helpers ─────────────────────────────────────────────────
  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  // Compute stance sensitivity multiplier
  function _stanceMultiplier() {
    var mult = 1.0;

    if (window._prone) {
      mult *= 0.4;
      if (window._proneAccuracyBonus) {
        mult *= (1.0 - window._proneAccuracyBonus);
      }
    } else if (window._crouching) {
      mult *= 0.7;
      if (window._crouchAccuracyBonus) {
        mult *= (1.0 - window._crouchAccuracyBonus);
      }
    }

    if (window._adsActive) {
      mult *= 0.5;
    }

    if (window._sprinting) {
      mult *= 1.5;
    }

    return mult;
  }

  // Compute burst multiplier based on shot count in current burst
  function _burstMultiplier() {
    if (_burstCount <= 1) return 1.0;
    if (_burstCount === 2) return 1.2;
    return 1.4;
  }

  // Compute horizontal pattern modifier
  // STRAIGHT: no horizontal drift beyond profile.horizontal
  // V_CURVE:  first shots go up, then drift right, then left
  // RANDOM:   each shot random direction
  function _patternHorizModifier(pattern) {
    if (pattern === 'STRAIGHT') {
      return 0.0; // no horizontal drift beyond small base
    }
    if (pattern === 'V_CURVE') {
      // Phase 0-2: straight up (modifier near 0)
      // Phase 3-6: drift right (+1)
      // Phase 7+: drift left (-1)
      _vcurvePhase++;
      if (_vcurvePhase <= 2) return 0.0;
      if (_vcurvePhase <= 6) return 1.0;
      return -1.0;
    }
    if (pattern === 'RANDOM') {
      return (Math.random() * 2.0 - 1.0); // -1 to +1
    }
    return 0.0;
  }

  // ── Public: init ────────────────────────────────────────────────────
  function init() {
    // Initialise all window globals to safe defaults
    window._recoilPitchDelta = 0;
    window._recoilYawDelta   = 0;
    window._swayDeltaX       = 0;
    window._swayDeltaY       = 0;
    window._crosshairSpread  = 0;

    // Hook for game-manager to call on each shot fired
    window._onShotForRecoil = function (weaponType) {
      onShot(weaponType);
    };

    // Internal state reset
    _recoilPitch  = 0;
    _recoilYaw    = 0;
    _burstCount   = 0;
    _lastShotTime = 0;
    _vcurvePhase  = 0;
  }

  // ── Public: onShot ─────────────────────────────────────────────────
  function onShot(weaponType) {
    var profile = RECOIL_PROFILES[weaponType] || RECOIL_PROFILES['DEFAULT'];
    var now     = Date.now();

    // Determine burst vs fresh shot
    var timeSinceLast = (now - _lastShotTime) / 1000; // convert to seconds
    if (_lastShotTime === 0 || timeSinceLast > BURST_THRESHOLD) {
      // New burst — reset counter and V_CURVE phase
      _burstCount  = 1;
      _vcurvePhase = 0;
    } else {
      _burstCount++;
    }
    _lastShotTime = now;

    // Get modifiers
    var stanceMult  = _stanceMultiplier();
    var burstMult   = _burstMultiplier();
    var sensitivity = BASE_SENSITIVITY * stanceMult * burstMult;

    // Vertical recoil impulse
    var pitchAdd = profile.vertical * sensitivity;
    _recoilPitch += pitchAdd;

    // Horizontal drift based on pattern
    var horizMod = _patternHorizModifier(profile.pattern);
    var yawAdd   = profile.horizontal * horizMod * sensitivity;
    _recoilYaw   += yawAdd;

    // Clamp accumulated recoil
    _recoilPitch = _clamp(_recoilPitch, -MAX_RECOIL, MAX_RECOIL);
    _recoilYaw   = _clamp(_recoilYaw,   -MAX_RECOIL, MAX_RECOIL);

    // Push to window so camera reads them this frame
    window._recoilPitchDelta = _recoilPitch;
    window._recoilYawDelta   = _recoilYaw;

    // Update crosshair spread proportional to total recoil magnitude
    window._crosshairSpread = Math.abs(_recoilPitch) + Math.abs(_recoilYaw);
  }

  // ── Public: update (called every frame) ────────────────────────────
  function update(delta) {
    if (!delta || delta <= 0) return;

    // Determine current weapon profile for recovery rate
    var currentWeapon = window._currentWeapon || window._equippedWeapon || 'DEFAULT';
    var profile = RECOIL_PROFILES[currentWeapon] || RECOIL_PROFILES['DEFAULT'];
    var recoveryRate = profile.recovery; // degrees per second

    // Recover recoil toward 0
    var recoverAmount = recoveryRate * delta;

    if (_recoilPitch > 0) {
      _recoilPitch = Math.max(0, _recoilPitch - recoverAmount);
    } else if (_recoilPitch < 0) {
      _recoilPitch = Math.min(0, _recoilPitch + recoverAmount);
    }

    if (_recoilYaw > 0) {
      _recoilYaw = Math.max(0, _recoilYaw - recoverAmount);
    } else if (_recoilYaw < 0) {
      _recoilYaw = Math.min(0, _recoilYaw + recoverAmount);
    }

    // Push recovered values to window
    window._recoilPitchDelta = _recoilPitch;
    window._recoilYawDelta   = _recoilYaw;

    // Update crosshair spread to reflect recovery
    window._crosshairSpread = Math.abs(_recoilPitch) + Math.abs(_recoilYaw);

    // ── Weapon sway (separate from recoil) ─────────────────────────
    var movingFactor = 0;
    if (window._playerMoving) {
      movingFactor = 1.0;
    }

    // Reduce sway when ADS or prone
    if (window._adsActive)  movingFactor *= 0.3;
    if (window._prone)      movingFactor *= 0.2;
    if (window._crouching)  movingFactor *= 0.5;

    var t = Date.now();
    var swayX = Math.sin(t * 0.003) * 0.1 * movingFactor;
    var swayY = Math.cos(t * 0.004) * 0.05 * movingFactor;

    window._swayDeltaX = swayX;
    window._swayDeltaY = swayY;
  }

  // ── Public: reset (called between waves/rounds) ─────────────────────
  function reset() {
    _recoilPitch  = 0;
    _recoilYaw    = 0;
    _burstCount   = 0;
    _lastShotTime = 0;
    _vcurvePhase  = 0;

    window._recoilPitchDelta = 0;
    window._recoilYawDelta   = 0;
    window._swayDeltaX       = 0;
    window._swayDeltaY       = 0;
    window._crosshairSpread  = 0;
  }

  // ── Public API ──────────────────────────────────────────────────────
  return {
    init:   init,
    onShot: onShot,
    update: update,
    reset:  reset
  };
})();
