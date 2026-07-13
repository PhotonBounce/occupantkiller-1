/**
 * prone-system.js — Prone crawl stance for FPS gameplay
 *
 * Key Z — toggle prone (Z is already used for smoke grenades in game-manager; this
 * module intercepts keydown early and coordinates via window._isProne).
 *
 * Behaviour:
 *   - Camera Y lerps to 0.3 (ground level) over ~0.4 s
 *   - FOV narrows 5° when prone
 *   - Movement speed × 0.30
 *   - Sprint and jump blocked while prone
 *   - Recoil × 0.30, spread × 0.40 (extreme precision)
 *   - Prone + ADS: ultimate precision mode flag
 *   - Enemy detection radius −30% via window._proneStealthRadius
 *   - Smaller player hitbox: window._proneHitboxScale = 0.45
 *   - Crouch → Prone transition supported (intermediate state consumed here)
 *   - Integrates with BipodSystem: auto-deploys bipod when prone
 *   - HUD: "PRONE" badge bottom-left
 *
 * Globals set each frame:
 *   window._isProne            boolean
 *   window._prone              boolean   (alias read by bipod-system etc.)
 *   window._proneSpeedMult     0.30 / 1.0
 *   window._proneRecoilMult    0.30 / 1.0
 *   window._proneSpreadMult    0.40 / 1.0
 *   window._proneFOVDelta      -5  / 0
 *   window._proneNoSprint      boolean
 *   window._proneNoJump        boolean
 *   window._proneStealthRadius 0.70 / 1.0  (multiplier on enemy detect radius)
 *   window._proneHitboxScale   0.45 / 1.0
 *   window._proneADSPrecision  boolean  (true when prone AND ADS active)
 */
window.ProneSystem = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────

  var CAMERA_Y_PRONE    = 0.3;
  var CAMERA_Y_STANDING = 1.6;   // fallback; defers to CrouchSystem when available
  var CAMERA_Y_CROUCH   = 0.85;

  var LERP_SPEED = 2.5;          // camera lerp: 1/0.4s ≈ 2.5 units/s

  var FOV_DELTA_PRONE   = -5;    // degrees narrowed

  var SPEED_MULT_PRONE  = 0.30;
  var RECOIL_MULT_PRONE = 0.30;
  var SPREAD_MULT_PRONE = 0.40;

  var STEALTH_RADIUS_MULT = 0.70;   // enemies detect 30% shorter
  var HITBOX_SCALE_PRONE  = 0.45;   // player hitbox 55% smaller

  // ── Internal state ────────────────────────────────────────────────────────

  var _prone        = false;
  var _initialized  = false;
  var _cameraY      = CAMERA_Y_STANDING;   // current lerped camera Y
  var _targetCameraY = CAMERA_Y_STANDING;
  var _badgeEl      = null;   // DOM: "PRONE" indicator

  // ── HUD ──────────────────────────────────────────────────────────────────

  function _createBadge() {
    // Try pre-existing element first (index.html has id="prone-indicator")
    _badgeEl = document.getElementById('prone-indicator');
    if (!_badgeEl) {
      _badgeEl = document.createElement('div');
      _badgeEl.id = 'prone-indicator';
      _badgeEl.style.cssText = [
        'position:fixed',
        'bottom:18px',
        'left:18px',
        'color:#b4e47a',
        'font-family:monospace',
        'font-size:12px',
        'font-weight:bold',
        'letter-spacing:0.18em',
        'text-shadow:0 1px 4px rgba(0,0,0,0.9)',
        'background:rgba(0,0,0,0.55)',
        'padding:3px 10px 3px 10px',
        'border-radius:3px',
        'border-left:3px solid #6db33f',
        'pointer-events:none',
        'display:none',
        'z-index:950',
      ].join(';');
      _badgeEl.textContent = 'PRONE';
      document.body.appendChild(_badgeEl);
    } else {
      // Ensure text is set in case the pre-built element is empty
      if (!_badgeEl.textContent) _badgeEl.textContent = 'PRONE';
    }
  }

  function _showBadge(visible) {
    if (!_badgeEl) return;
    _badgeEl.style.display = visible ? 'block' : 'none';
  }

  // ── Global flags ──────────────────────────────────────────────────────────

  function _applyGlobals() {
    window._isProne   = _prone;
    window._prone     = _prone;   // alias consumed by bipod-system, recoil-system, etc.

    if (_prone) {
      window._proneSpeedMult     = SPEED_MULT_PRONE;
      window._proneRecoilMult    = RECOIL_MULT_PRONE;
      window._proneSpreadMult    = SPREAD_MULT_PRONE;
      window._proneFOVDelta      = FOV_DELTA_PRONE;
      window._proneNoSprint      = true;
      window._proneNoJump        = true;
      window._proneStealthRadius = STEALTH_RADIUS_MULT;
      window._proneHitboxScale   = HITBOX_SCALE_PRONE;
      // Prone + ADS = ultimate precision mode
      window._proneADSPrecision  = !!(window._isADS || window._adsActive || window._aiming);
    } else {
      window._proneSpeedMult     = 1.0;
      window._proneRecoilMult    = 1.0;
      window._proneSpreadMult    = 1.0;
      window._proneFOVDelta      = 0;
      window._proneNoSprint      = false;
      window._proneNoJump        = false;
      window._proneStealthRadius = 1.0;
      window._proneHitboxScale   = 1.0;
      window._proneADSPrecision  = false;
    }
  }

  // ── Bipod integration ─────────────────────────────────────────────────────

  function _tryAutoBipod() {
    if (typeof window.BipodSystem === 'undefined') return;
    if (!_prone) return;
    // Auto-deploy bipod when going prone (if eligible weapon and not already deployed)
    if (typeof window.BipodSystem.deploy === 'function') {
      window.BipodSystem.deploy();
    }
  }

  function _tryFoldBipod() {
    if (typeof window.BipodSystem === 'undefined') return;
    if (typeof window.BipodSystem.fold === 'function') {
      window.BipodSystem.fold();
    }
  }

  // ── Transition helpers ────────────────────────────────────────────────────

  function _enterProne() {
    if (_prone) return;
    _prone = true;

    // If CrouchSystem exists, put it in prone state too so camera lerp is unified
    if (typeof window.CrouchSystem !== 'undefined') {
      if (typeof window.CrouchSystem.toggleProne === 'function') {
        // Only call if CrouchSystem is not already prone
        if (!window.CrouchSystem.isProne()) {
          window.CrouchSystem.toggleProne();
        }
      }
    }

    _targetCameraY = CAMERA_Y_PRONE;
    _applyGlobals();
    _showBadge(true);
    _tryAutoBipod();
  }

  function _exitProne() {
    if (!_prone) return;
    _prone = false;

    // Determine target height: back to crouch if CrouchSystem was crouching, else standing
    var wasCrouching = false;
    if (typeof window.CrouchSystem !== 'undefined') {
      // CrouchSystem.toggleProne() from prone → crouching
      if (typeof window.CrouchSystem.toggleProne === 'function') {
        window.CrouchSystem.toggleProne();   // prone → crouching
        wasCrouching = true;
      }
      _targetCameraY = (typeof window.CrouchSystem.getCameraY === 'function')
        ? window.CrouchSystem.getHeightOffset()
        : (wasCrouching ? CAMERA_Y_CROUCH : CAMERA_Y_STANDING);
    } else {
      _targetCameraY = CAMERA_Y_STANDING;
    }

    _applyGlobals();
    _showBadge(false);
    _tryFoldBipod();
  }

  // ── Key handler ───────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if (e.code !== 'KeyZ') return;
    // Do not consume the event — smoke grenade in game-manager also listens.
    // We just read the key and act on stance; game-manager handles grenade.

    // Intercept to toggle prone
    _toggleProne();
  }

  function _toggleProne() {
    if (_prone) {
      _exitProne();
    } else {
      // Support crouch → prone intermediate: if currently crouching via CrouchSystem,
      // transition directly into prone.
      _enterProne();
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function init() {
    if (_initialized) return;
    _initialized = true;
    _createBadge();
    document.addEventListener('keydown', _onKeyDown, false);

    // Initialise globals to safe defaults
    _applyGlobals();
  }

  function update(delta) {
    if (!_initialized) return;

    // ── Camera Y lerp ──────────────────────────────────────────────────────
    // When CrouchSystem is present and NOT prone, defer camera Y tracking to it.
    // When prone (our domain), we drive _targetCameraY ourselves.
    if (!_prone && typeof window.CrouchSystem !== 'undefined') {
      // Mirror CrouchSystem's lerped value so we don't fight it
      _cameraY = (typeof window.CrouchSystem.getCameraY === 'function')
        ? window.CrouchSystem.getCameraY()
        : CAMERA_Y_STANDING;
      _targetCameraY = _cameraY;
    } else {
      // Lerp at LERP_SPEED units/s (reaches CAMERA_Y_PRONE 0.3 in ~0.4 s from 1.6)
      var diff = _targetCameraY - _cameraY;
      var step = LERP_SPEED * delta;
      if (Math.abs(diff) <= step) {
        _cameraY = _targetCameraY;
      } else {
        _cameraY += (diff > 0 ? 1 : -1) * step;
      }
    }

    // Publish lerped camera Y for any system that reads it
    window._proneCameraY = _cameraY;

    // ── Sprint / jump blocking ─────────────────────────────────────────────
    // window._proneNoSprint / window._proneNoJump are already set via _applyGlobals.
    // game-manager reads these flags before applying sprint/jump, so no extra
    // work needed here — but refresh ADS precision each frame since ADS state
    // can change independently.
    if (_prone) {
      window._proneADSPrecision = !!(window._isADS || window._adsActive || window._aiming);
    }

    // ── FOV application ────────────────────────────────────────────────────
    // Communicate delta to any FOV controller (camera-system reads window._fovOverrideDelta)
    window._fovOverrideDelta = _prone ? FOV_DELTA_PRONE : 0;
  }

  function reset() {
    _prone = false;
    _cameraY = CAMERA_Y_STANDING;
    _targetCameraY = CAMERA_Y_STANDING;
    _showBadge(false);
    _applyGlobals();
  }

  // Expose isProne for external queries
  function isProne() {
    return _prone;
  }

  // Expose lerped camera Y (alternative to window._proneCameraY)
  function getCameraY() {
    return _cameraY;
  }

  return {
    init:      init,
    update:    update,
    reset:     reset,
    isProne:   isProne,
    getCameraY: getCameraY,
  };

})();
