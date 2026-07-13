window.CombatRoll = (function() {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────────
  var ROLL_DURATION        = 0.45;   // seconds, normal roll
  var ROLL_CROUCH_DURATION = 0.30;   // seconds, crouch roll
  var ROLL_DISTANCE        = 3.5;    // units, normal roll
  var ROLL_CROUCH_DISTANCE = 2.5;    // units, crouch roll
  var ROLL_INVINCIBLE_TIME = 0.25;   // seconds of iFrame at roll start
  var ROLL_COOLDOWN        = 1.8;    // seconds between rolls
  var ROLL_STAMINA_COST    = 20;     // normal roll
  var ROLL_CHAIN_STAMINA   = 35;     // sprint-roll chain cost
  var ROLL_CHAIN_WINDOW    = 0.3;    // seconds remaining on cooldown for chain roll
  var DOUBLE_TAP_WINDOW    = 0.3;    // seconds to detect double-tap
  var CAMERA_TILT_MAX      = 35;     // degrees Z-axis camera tilt during roll
  var CAMERA_TILT_RETURN   = 0.2;    // seconds to untilt after roll
  var CAMERA_PITCH_MAX     = -0.4;   // radians X-axis pitch at mid-roll
  var F_KEY                = 'f';    // roll key code

  // ── State ────────────────────────────────────────────────────────────────────
  var _rolling        = false;
  var _rollStartTime  = 0;
  var _rollDuration   = ROLL_DURATION;
  var _rollDir        = { x: 0, z: -1 };  // default: forward
  var _lastCooldownEnd = 0;
  var _invincibleEnd  = 0;

  // double-tap tracking per direction key
  var _doubleTap = {
    w: { last: 0 },
    a: { last: 0 },
    s: { last: 0 },
    d: { last: 0 }
  };
  var _keysHeld = {};

  // UI elements (created on init)
  var _cooldownBar    = null;
  var _iframeOverlay  = null;
  var _canvas         = null;
  var _audioCtx       = null;

  // camera tilt / untilt tracking
  var _tiltActive     = false;
  var _untiltStart    = 0;
  var _tiltSign       = 1;   // +1 = right, -1 = left

  // ── Audio helpers ─────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { }
    }
    return _audioCtx;
  }

  function _playTone(freq, duration, gainVal) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal || 0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.02);
    } catch (e) { }
  }

  function _playRollStart() {
    _playTone(180, 0.08, 0.22);
  }

  function _playRollEnd() {
    _playTone(220, 0.05, 0.18);
  }

  // ── HUD creation ─────────────────────────────────────────────────────────────
  function _createCooldownBar() {
    if (_cooldownBar) return;
    _cooldownBar = document.createElement('div');
    _cooldownBar.id = 'combat-roll-cooldown';
    _cooldownBar.style.cssText = [
      'position:fixed',
      'bottom:calc(50% - 28px)',
      'left:50%',
      'transform:translateX(-50%)',
      'width:60px',
      'height:3px',
      'background:rgba(255,255,255,0.15)',
      'border-radius:2px',
      'overflow:hidden',
      'pointer-events:none',
      'z-index:9998',
      'display:none'
    ].join(';');

    var fill = document.createElement('div');
    fill.id = 'combat-roll-cooldown-fill';
    fill.style.cssText = [
      'height:100%',
      'width:0%',
      'background:rgba(255,220,80,0.85)',
      'border-radius:2px',
      'transition:none'
    ].join(';');

    _cooldownBar.appendChild(fill);
    document.body.appendChild(_cooldownBar);
  }

  function _createIframeOverlay() {
    if (_iframeOverlay) return;
    _iframeOverlay = document.createElement('div');
    _iframeOverlay.id = 'combat-roll-iframe';
    _iframeOverlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'bottom:0',
      'pointer-events:none',
      'z-index:9997',
      'box-shadow:inset 0 0 0 4px rgba(255,200,50,0)',
      'border-radius:2px',
      'transition:box-shadow 0.05s ease'
    ].join(';');
    document.body.appendChild(_iframeOverlay);
  }

  function _flashIframe() {
    if (!_iframeOverlay) return;
    _iframeOverlay.style.boxShadow = 'inset 0 0 0 4px rgba(255,200,50,0.7)';
    var overlay = _iframeOverlay;
    setTimeout(function() {
      overlay.style.boxShadow = 'inset 0 0 0 4px rgba(255,200,50,0)';
    }, 200);
  }

  function _findCanvas() {
    if (_canvas) return _canvas;
    // Try common Three.js renderer canvas selectors
    _canvas = document.querySelector('canvas');
    return _canvas;
  }

  function _applyMotionBlur() {
    var c = _findCanvas();
    if (c) c.style.filter = 'blur(1px)';
  }

  function _removeMotionBlur() {
    var c = _findCanvas();
    if (c) c.style.filter = '';
  }

  // ── Cooldown bar update ───────────────────────────────────────────────────────
  function _updateCooldownBar(now) {
    if (!_cooldownBar) return;
    var fill = document.getElementById('combat-roll-cooldown-fill');
    if (!fill) return;
    var cooldownStart = _lastCooldownEnd - ROLL_COOLDOWN;
    if (_lastCooldownEnd <= now) {
      _cooldownBar.style.display = 'none';
      fill.style.width = '0%';
      return;
    }
    _cooldownBar.style.display = 'block';
    var elapsed  = now - cooldownStart;
    var pct      = Math.min(100, (elapsed / ROLL_COOLDOWN) * 100);
    fill.style.width = pct + '%';
  }

  // ── Direction helpers ─────────────────────────────────────────────────────────
  function _getMovementDirection() {
    // Returns normalised {x,z} based on current keys held and player facing
    var dx = 0;
    var dz = 0;
    if (_keysHeld['w'] || _keysHeld['arrowup'])    dz -= 1;
    if (_keysHeld['s'] || _keysHeld['arrowdown'])  dz += 1;
    if (_keysHeld['a'] || _keysHeld['arrowleft'])  dx -= 1;
    if (_keysHeld['d'] || _keysHeld['arrowright']) dx += 1;

    // If no key held, fall back to player forward vector
    if (dx === 0 && dz === 0) {
      if (window.player && window.player.getWorldDirection) {
        var fwd = { x: 0, y: 0, z: 0 };
        try {
          var v3 = window.player.getWorldDirection(new (window.THREE && window.THREE.Vector3 ? window.THREE.Vector3 : Object)());
          fwd.x = v3.x || 0;
          fwd.z = v3.z || 0;
        } catch (e) { }
        dx = fwd.x;
        dz = fwd.z;
      } else {
        dz = -1; // default forward
      }
    }

    // Normalise
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0.001) { dx /= len; dz /= len; }
    return { x: dx, z: dz };
  }

  function _tiltSignFromDir(dir) {
    // Roll left/right: use x component; if no lateral, use 1
    if (dir.x > 0.1) return 1;
    if (dir.x < -0.1) return -1;
    return 1;
  }

  // ── Core roll logic ───────────────────────────────────────────────────────────
  function _canRoll(chain) {
    var now = performance.now() / 1000;
    // Cooldown check — allow chain roll if within chain window
    if (chain) {
      var remaining = _lastCooldownEnd - now;
      if (remaining > ROLL_CHAIN_WINDOW) return false; // not in chain window
    } else {
      if (now < _lastCooldownEnd) return false; // on cooldown
    }
    // Already rolling
    if (_rolling) return false;
    // Stamina check
    var cost = chain ? ROLL_CHAIN_STAMINA : ROLL_STAMINA_COST;
    if (typeof window._playerStamina !== 'undefined' && window._playerStamina < cost) {
      return false;
    }
    return true;
  }

  function roll(dirOverride, forceChain) {
    var now = performance.now() / 1000;
    var isChain = forceChain || false;

    if (!_canRoll(isChain)) return false;

    var dir = dirOverride || _getMovementDirection();
    var isCrouched = !!window._isCrouching;

    _rollDuration = isCrouched ? ROLL_CROUCH_DURATION : ROLL_DURATION;
    var dist      = isCrouched ? ROLL_CROUCH_DISTANCE : ROLL_DISTANCE;
    var staminaCost = isChain ? ROLL_CHAIN_STAMINA : ROLL_STAMINA_COST;

    // Deduct stamina
    if (typeof window._playerStamina !== 'undefined') {
      window._playerStamina = Math.max(0, window._playerStamina - staminaCost);
    }

    // Begin roll
    _rolling           = true;
    _rollStartTime     = now;
    _rollDir           = dir;
    _lastCooldownEnd   = now + _rollDuration + ROLL_COOLDOWN;
    _invincibleEnd     = now + ROLL_INVINCIBLE_TIME;
    _tiltSign          = _tiltSignFromDir(dir);
    _tiltActive        = true;
    _untiltStart       = 0;

    // Globals
    window._playerRolling   = true;
    window._rollInvincible  = true;
    if (isCrouched) window._isCrouching = true;

    // Apply velocity / position impulse
    var speed = dist / _rollDuration;
    if (window._playerVelocity && typeof window._playerVelocity.x !== 'undefined') {
      window._playerVelocity.x += dir.x * speed;
      window._playerVelocity.z += dir.z * speed;
    } else if (window.player && window.player.position) {
      // Will be lerped in update; store target offset
      _rollDir._dx = dir.x * dist;
      _rollDir._dz = dir.z * dist;
    }

    // Effects
    _applyMotionBlur();
    _flashIframe();
    _playRollStart();

    if (_cooldownBar) _cooldownBar.style.display = 'block';

    return true;
  }

  // ── Update (call each frame with delta seconds) ───────────────────────────────
  function update(delta) {
    var now = performance.now() / 1000;
    delta = delta || 0.016;

    // Update cooldown bar
    _updateCooldownBar(now);

    if (!_rolling) {
      // Handle untilt animation after roll
      if (_tiltActive && _untiltStart > 0) {
        var untiltElapsed = now - _untiltStart;
        if (untiltElapsed >= CAMERA_TILT_RETURN) {
          _applyCameraZTilt(0);
          _applyCameraXPitch(0);
          _tiltActive = false;
        } else {
          var tPct = 1 - (untiltElapsed / CAMERA_TILT_RETURN);
          var tiltDeg = CAMERA_TILT_MAX * tPct * _tiltSign;
          _applyCameraZTilt(tiltDeg);
          _applyCameraXPitch(CAMERA_PITCH_MAX * tPct);
        }
      }
      return;
    }

    var elapsed = now - _rollStartTime;
    var t       = Math.min(1, elapsed / _rollDuration);

    // Invincibility window
    if (now >= _invincibleEnd && window._rollInvincible) {
      window._rollInvincible = false;
    }

    // Camera Z tilt (full tilt during roll)
    var tiltDeg = CAMERA_TILT_MAX * _tiltSign;
    _applyCameraZTilt(tiltDeg);

    // Camera X pitch: 0 -> -0.4 at mid-roll -> 0
    var pitchT   = (t < 0.5) ? (t / 0.5) : (1 - (t - 0.5) / 0.5);
    var pitchVal = CAMERA_PITCH_MAX * pitchT;
    _applyCameraXPitch(pitchVal);

    // Direct position push (when no velocity system)
    if (_rollDir._dx !== undefined && window.player && window.player.position) {
      var frac = delta / _rollDuration;
      window.player.position.x += _rollDir._dx * frac;
      window.player.position.z += _rollDir._dz * frac;
    }

    // Roll end
    if (t >= 1) {
      _rolling             = false;
      window._playerRolling = false;
      window._rollInvincible = false;

      // Remove motion blur
      _removeMotionBlur();

      // Landing crack sound
      _playRollEnd();

      // Begin untilt
      _untiltStart = now;

      // Clear direct position state
      _rollDir._dx = undefined;
      _rollDir._dz = undefined;
    }
  }

  // ── Camera helpers ────────────────────────────────────────────────────────────
  function _applyCameraZTilt(degrees) {
    var radians = degrees * (Math.PI / 180);
    // Try window.camera first (common Three.js global)
    if (window.camera && typeof window.camera.rotation !== 'undefined') {
      window.camera.rotation.z = radians;
      return;
    }
    // Try window.player children (camera rig attached to player)
    if (window.playerCamera) {
      window.playerCamera.rotation.z = radians;
    }
  }

  function _applyCameraXPitch(radians) {
    if (window.camera && typeof window.camera.rotation !== 'undefined') {
      // Only override pitch delta (add to base pitch)
      // Store base pitch on first access
      if (!window.camera._combatRollBasePitchSet) {
        window.camera._combatRollPitchDelta = 0;
        window.camera._combatRollBasePitchSet = true;
      }
      window.camera._combatRollPitchDelta = radians;
      return;
    }
    if (window.playerCamera) {
      window.playerCamera._combatRollPitchDelta = radians;
    }
  }

  // ── Input handling ────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var key = (e.key || '').toLowerCase();
    _keysHeld[key] = true;

    // F key — roll in current movement direction
    if (key === F_KEY && !e.repeat) {
      var dir = _getMovementDirection();
      var now = performance.now() / 1000;
      var remaining = _lastCooldownEnd - now;
      var isChain = (!_rolling && remaining > 0 && remaining <= ROLL_CHAIN_WINDOW);
      roll(dir, isChain);
      return;
    }

    // Shift + double-tap WASD
    if (!e.shiftKey) return;
    if (e.repeat) return;

    var wasd = { w: true, a: true, s: true, d: true };
    if (!wasd[key]) return;

    var now   = performance.now() / 1000;
    var state = _doubleTap[key];
    if (state) {
      if (now - state.last < DOUBLE_TAP_WINDOW) {
        // Double-tap detected
        var dirMap = {
          w: { x: 0,  z: -1 },
          s: { x: 0,  z:  1 },
          a: { x: -1, z:  0 },
          d: { x:  1, z:  0 }
        };
        var tapDir   = dirMap[key];
        var remaining = _lastCooldownEnd - now;
        var isChain   = (!_rolling && remaining > 0 && remaining <= ROLL_CHAIN_WINDOW);
        roll(tapDir, isChain);
        state.last = 0; // reset so triple-tap doesn't re-trigger
      } else {
        state.last = now;
      }
    }
  }

  function _onKeyUp(e) {
    var key = (e.key || '').toLowerCase();
    delete _keysHeld[key];
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  function init() {
    _createCooldownBar();
    _createIframeOverlay();
    _findCanvas();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    // Expose damage interception point
    if (typeof window._playerRolling === 'undefined') window._playerRolling  = false;
    if (typeof window._rollInvincible === 'undefined') window._rollInvincible = false;
  }

  function reset() {
    _rolling            = false;
    _rollStartTime      = 0;
    _lastCooldownEnd    = 0;
    _invincibleEnd      = 0;
    _tiltActive         = false;
    _untiltStart        = 0;
    _keysHeld           = {};
    _doubleTap          = { w: { last: 0 }, a: { last: 0 }, s: { last: 0 }, d: { last: 0 } };
    window._playerRolling  = false;
    window._rollInvincible = false;

    _applyCameraZTilt(0);
    _applyCameraXPitch(0);
    _removeMotionBlur();

    if (_cooldownBar) _cooldownBar.style.display = 'none';
    if (_iframeOverlay) _iframeOverlay.style.boxShadow = 'inset 0 0 0 4px rgba(255,200,50,0)';
  }

  return {
    init:   init,
    update: update,
    roll:   roll,
    reset:  reset
  };

})();
