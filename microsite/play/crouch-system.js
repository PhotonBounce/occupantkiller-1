/**
 * CrouchSystem — player crouch and prone movement with reduced hitbox
 *
 * States:
 *   STANDING  – camera offset 1.6, speed x1.0
 *   CROUCHING – camera offset 0.85, speed x0.55 (toggle: single Ctrl press)
 *   PRONE     – camera offset 0.3,  speed x0.22 (double-tap Ctrl while crouching)
 *
 * Global flags set each frame:
 *   window._crouchAccuracyBonus  – 0 / 0.25 / 0.5
 *   window._crouchStealthMult    – 1 / 0.75 / 0.5
 */
window.CrouchSystem = (function () {

  var STATE_STANDING  = 'standing';
  var STATE_CROUCHING = 'crouching';
  var STATE_PRONE     = 'prone';

  var CAMERA_Y_STANDING  = 1.6;
  var CAMERA_Y_CROUCHING = 0.85;
  var CAMERA_Y_PRONE     = 0.3;

  var SPEED_MULT_STANDING  = 1.0;
  var SPEED_MULT_CROUCHING = 0.55;
  var SPEED_MULT_PRONE     = 0.22;

  var LERP_RATE = 8; // units per second

  var DOUBLE_TAP_WINDOW = 0.3; // seconds

  var _state           = STATE_STANDING;
  var _currentCameraY  = CAMERA_Y_STANDING;
  var _targetCameraY   = CAMERA_Y_STANDING;
  var _lastCtrlTime    = -999; // timestamp of last Ctrl press
  var _statusEl        = null;
  var _initialized     = false;

  // ── HUD element ──────────────────────────────────────────────────────────

  function _createHUD() {
    if (_statusEl) return;
    _statusEl = document.getElementById('crouchStatus');
    if (!_statusEl) {
      _statusEl = document.createElement('div');
      _statusEl.id = 'crouchStatus';
      _statusEl.style.cssText = [
        'position:fixed',
        'bottom:120px',
        'left:50%',
        'transform:translateX(-50%)',
        'color:rgba(180,220,180,0.85)',
        'font-family:monospace',
        'font-size:13px',
        'font-weight:bold',
        'letter-spacing:0.12em',
        'text-shadow:0 1px 4px rgba(0,0,0,0.8)',
        'background:rgba(0,0,0,0.35)',
        'padding:3px 10px',
        'border-radius:3px',
        'pointer-events:none',
        'display:none',
        'z-index:900',
      ].join(';');
      document.body.appendChild(_statusEl);
    }
  }

  function _updateHUD() {
    if (!_statusEl) return;
    if (_state === STATE_STANDING) {
      _statusEl.style.display = 'none';
      _statusEl.textContent   = '';
    } else if (_state === STATE_CROUCHING) {
      _statusEl.style.display = 'block';
      _statusEl.textContent   = '⬇ CROUCHING';
    } else {
      _statusEl.style.display = 'block';
      _statusEl.textContent   = '⬇⬇ PRONE';
    }
  }

  // ── Global flags ─────────────────────────────────────────────────────────

  function _applyGlobals() {
    if (_state === STATE_STANDING) {
      window._crouchAccuracyBonus = 0;
      window._crouchStealthMult   = 1.0;
    } else if (_state === STATE_CROUCHING) {
      window._crouchAccuracyBonus = 0.25;
      window._crouchStealthMult   = 0.75;
    } else {
      window._crouchAccuracyBonus = 0.5;
      window._crouchStealthMult   = 0.5;
    }
  }

  // ── State transitions ─────────────────────────────────────────────────────

  function _setState(newState) {
    _state = newState;
    if (_state === STATE_STANDING) {
      _targetCameraY = CAMERA_Y_STANDING;
    } else if (_state === STATE_CROUCHING) {
      _targetCameraY = CAMERA_Y_CROUCHING;
    } else {
      _targetCameraY = CAMERA_Y_PRONE;
    }
    _applyGlobals();
    _updateHUD();
  }

  // ── Key handler ───────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if (e.code !== 'ControlLeft' && e.code !== 'ControlRight') return;
    // Prevent browser context menus / default Ctrl behaviour
    e.preventDefault();

    var now = (typeof performance !== 'undefined') ? performance.now() / 1000 : Date.now() / 1000;
    var timeSinceLastCtrl = now - _lastCtrlTime;

    if (_state === STATE_STANDING) {
      // Standing → Crouching
      _setState(STATE_CROUCHING);
      _lastCtrlTime = now;
    } else if (_state === STATE_CROUCHING) {
      if (timeSinceLastCtrl <= DOUBLE_TAP_WINDOW) {
        // Double-tap while crouching → Prone
        _setState(STATE_PRONE);
      } else {
        // Single tap while crouching → Standing
        _setState(STATE_STANDING);
      }
      _lastCtrlTime = now;
    } else {
      // Prone → Crouching
      _setState(STATE_CROUCHING);
      _lastCtrlTime = now;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function init() {
    _initialized = true;
    _createHUD();
    document.addEventListener('keydown', _onKeyDown);
    _applyGlobals();
    _updateHUD();
  }

  function update(delta) {
    if (!_initialized) return;
    // Lerp currentCameraY toward targetCameraY
    var diff = _targetCameraY - _currentCameraY;
    var step = LERP_RATE * delta;
    if (Math.abs(diff) <= step) {
      _currentCameraY = _targetCameraY;
    } else {
      _currentCameraY += (diff > 0 ? 1 : -1) * step;
    }
  }

  function toggleCrouch() {
    if (_state === STATE_CROUCHING) {
      _setState(STATE_STANDING);
    } else {
      _setState(STATE_CROUCHING);
    }
  }

  function toggleProne() {
    if (_state === STATE_PRONE) {
      _setState(STATE_CROUCHING);
    } else {
      _setState(STATE_PRONE);
    }
  }

  function isCrouching() {
    return _state === STATE_CROUCHING;
  }

  function isProne() {
    return _state === STATE_PRONE;
  }

  /** Smoothly lerped camera height offset from player feet */
  function getCameraY() {
    return _currentCameraY;
  }

  /** Target camera Y (instantaneous, not lerped) */
  function getHeightOffset() {
    return _targetCameraY;
  }

  /** Movement speed multiplier for current stance */
  function getSpeedMult() {
    if (_state === STATE_PRONE)     return SPEED_MULT_PRONE;
    if (_state === STATE_CROUCHING) return SPEED_MULT_CROUCHING;
    return SPEED_MULT_STANDING;
  }

  function reset() {
    _setState(STATE_STANDING);
    _currentCameraY = CAMERA_Y_STANDING;
  }

  return {
    init:          init,
    update:        update,
    toggleCrouch:  toggleCrouch,
    toggleProne:   toggleProne,
    isCrouching:   isCrouching,
    isProne:       isProne,
    getHeightOffset: getHeightOffset,
    getCameraY:    getCameraY,
    getSpeedMult:  getSpeedMult,
    reset:         reset,
  };

})();
