/**
 * time-warp.js — Bullet Time power-up for OccupantKiller Three.js FPS.
 * Earned via kill streaks (10, 20) or rare loot drops.
 * Q key activates/deactivates; slows world to 20% speed for 5 seconds per charge.
 * IIFE pattern, all var (no let/const).
 */

window.TimeWarp = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  var _charges  = 0;        // current bullet-time charges (max 3)
  var _active   = false;    // is bullet time currently running?
  var _duration = 5.0;      // seconds per charge
  var _elapsed  = 0;        // seconds consumed from the current charge
  var _snapBackTimer = 0;   // tracks 0.08s snap-back speed-up after deactivation
  var _snapBack      = false;
  var _initialized   = false;

  // DOM element references (created in init)
  var _elOverlay  = null;   // div#timeWarpOverlay – blue tint while active
  var _elFlash    = null;   // div#timeWarpFlash   – white ring on activation
  var _elTimer    = null;   // div#timeWarpTimer   – countdown text
  var _elCharges  = null;   // div#timeWarpCharges – charge pip display
  var _elRing     = null;   // div#timeWarpRing    – circular charge ring

  // Canvas reference for chromatic aberration filter
  var _canvas = null;

  // ── Private helpers ────────────────────────────────────────────────────────

  function _getCanvas() {
    if (_canvas) return _canvas;
    _canvas = document.querySelector('canvas');
    return _canvas;
  }

  function _createElements() {
    // Blue tint overlay
    if (!document.getElementById('timeWarpOverlay')) {
      _elOverlay = document.createElement('div');
      _elOverlay.id = 'timeWarpOverlay';
      _elOverlay.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'right:0',
        'bottom:0',
        'background:rgba(0,50,120,0.10)',
        'pointer-events:none',
        'z-index:197',
        'display:none',
        'transition:opacity 0.3s',
      ].join(';');
      document.body.appendChild(_elOverlay);
    } else {
      _elOverlay = document.getElementById('timeWarpOverlay');
    }

    // White flash ring on activation
    if (!document.getElementById('timeWarpFlash')) {
      _elFlash = document.createElement('div');
      _elFlash.id = 'timeWarpFlash';
      _elFlash.style.cssText = [
        'position:fixed',
        'top:50%',
        'left:50%',
        'transform:translate(-50%,-50%) scale(0)',
        'width:200vw',
        'height:200vw',
        'border-radius:50%',
        'background:radial-gradient(circle,rgba(255,255,255,0.9) 0%,rgba(100,180,255,0.4) 40%,transparent 70%)',
        'pointer-events:none',
        'z-index:198',
        'opacity:0',
        'display:none',
      ].join(';');
      document.body.appendChild(_elFlash);
    } else {
      _elFlash = document.getElementById('timeWarpFlash');
    }

    // Timer + ring container
    if (!document.getElementById('timeWarpTimer')) {
      var _wrapDiv = document.createElement('div');
      _wrapDiv.style.cssText = [
        'position:fixed',
        'top:48px',
        'left:50%',
        'transform:translateX(-50%)',
        'z-index:201',
        'pointer-events:none',
        'text-align:center',
        'display:none',
      ].join(';');
      _wrapDiv.id = 'timeWarpTimerWrap';

      _elTimer = document.createElement('div');
      _elTimer.id = 'timeWarpTimer';
      _elTimer.style.cssText = [
        'font-family:monospace',
        'font-size:15px',
        'font-weight:bold',
        'color:#00aaff',
        'text-shadow:0 0 8px rgba(0,170,255,0.8)',
        'letter-spacing:2px',
        'margin-bottom:4px',
      ].join(';');
      _elTimer.textContent = '⏱ 5.0s';

      // SVG charge ring
      _elRing = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      _elRing.id = 'timeWarpRing';
      _elRing.setAttribute('width', '50');
      _elRing.setAttribute('height', '50');
      _elRing.style.display = 'block';
      _elRing.style.margin = '0 auto';

      var _bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      _bgCircle.setAttribute('cx', '25');
      _bgCircle.setAttribute('cy', '25');
      _bgCircle.setAttribute('r', '20');
      _bgCircle.setAttribute('fill', 'none');
      _bgCircle.setAttribute('stroke', 'rgba(0,50,100,0.4)');
      _bgCircle.setAttribute('stroke-width', '4');

      var _fgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      _fgCircle.setAttribute('cx', '25');
      _fgCircle.setAttribute('cy', '25');
      _fgCircle.setAttribute('r', '20');
      _fgCircle.setAttribute('fill', 'none');
      _fgCircle.setAttribute('stroke', '#00aaff');
      _fgCircle.setAttribute('stroke-width', '4');
      _fgCircle.setAttribute('stroke-linecap', 'round');
      _fgCircle.setAttribute('transform', 'rotate(-90 25 25)');
      _fgCircle.id = 'timeWarpRingArc';

      _elRing.appendChild(_bgCircle);
      _elRing.appendChild(_fgCircle);

      _wrapDiv.appendChild(_elTimer);
      _wrapDiv.appendChild(_elRing);
      document.body.appendChild(_wrapDiv);
    } else {
      _elTimer  = document.getElementById('timeWarpTimer');
      _elRing   = document.getElementById('timeWarpRing');
    }

    // Charge pip display (bottom-center)
    if (!document.getElementById('timeWarpCharges')) {
      _elCharges = document.createElement('div');
      _elCharges.id = 'timeWarpCharges';
      _elCharges.style.cssText = [
        'position:fixed',
        'bottom:108px',
        'left:50%',
        'transform:translateX(-50%)',
        'z-index:201',
        'pointer-events:none',
        'font-family:monospace',
        'font-size:18px',
        'color:#00aaff',
        'text-shadow:0 0 6px rgba(0,170,255,0.7)',
        'letter-spacing:4px',
        'display:none',
      ].join(';');
      document.body.appendChild(_elCharges);
    } else {
      _elCharges = document.getElementById('timeWarpCharges');
    }
  }

  function _refreshChargeDisplay() {
    if (!_elCharges) return;
    if (_charges <= 0) {
      _elCharges.style.display = 'none';
      return;
    }
    _elCharges.style.display = 'block';
    var _pips = '';
    for (var _i = 0; _i < 3; _i++) {
      _pips += (_i < _charges) ? '◉' : '◎';  // ◉ vs ◎
    }
    _elCharges.textContent = _pips;
  }

  function _updateRingArc(fraction) {
    var _arc = document.getElementById('timeWarpRingArc');
    if (!_arc) return;
    var _circ = 2 * Math.PI * 20;   // circumference for r=20
    var _dash = _circ * fraction;
    _arc.setAttribute('stroke-dasharray', _dash + ' ' + _circ);
  }

  function _updateTimer(remaining) {
    if (!_elTimer) return;
    _elTimer.textContent = '⏱ ' + remaining.toFixed(1) + 's';
  }

  function _showTimerUI(visible) {
    var _wrap = document.getElementById('timeWarpTimerWrap');
    if (_wrap) _wrap.style.display = visible ? 'block' : 'none';
  }

  function _triggerFlash() {
    if (!_elFlash) return;
    _elFlash.style.display = 'block';
    _elFlash.style.transition = 'none';
    _elFlash.style.opacity = '1';
    _elFlash.style.transform = 'translate(-50%,-50%) scale(0)';

    // Force reflow so transition fires
    void _elFlash.offsetHeight;

    _elFlash.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
    _elFlash.style.transform  = 'translate(-50%,-50%) scale(1.2)';
    _elFlash.style.opacity    = '0';

    var _f = _elFlash;
    setTimeout(function () { _f.style.display = 'none'; }, 420);
  }

  function _applyChromAberration(enable) {
    var _cv = _getCanvas();
    if (!_cv) return;
    if (enable) {
      _cv.style.filter = 'saturate(2) contrast(1.2) hue-rotate(-10deg)';
    } else {
      _cv.style.filter = '';
    }
  }

  function _playDeactivateSound() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var _actx = new AC();
      var _osc  = _actx.createOscillator();
      var _gain = _actx.createGain();
      _osc.connect(_gain);
      _gain.connect(_actx.destination);
      _osc.type = 'sine';
      _gain.gain.setValueAtTime(0.18, _actx.currentTime);
      _gain.gain.exponentialRampToValueAtTime(0.001, _actx.currentTime + 0.5);
      _osc.frequency.setValueAtTime(800, _actx.currentTime);
      _osc.frequency.exponentialRampToValueAtTime(200, _actx.currentTime + 0.5);
      _osc.start(_actx.currentTime);
      _osc.stop(_actx.currentTime + 0.5);
      _osc.onended = function () { try { _actx.close(); } catch (e) {} };
    } catch (e) {
      // AudioContext unavailable — silently skip
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init() {
    if (_initialized) return;
    _initialized = true;
    _charges  = 0;
    _active   = false;
    _elapsed  = 0;
    _snapBack = false;
    _snapBackTimer = 0;

    _createElements();
    _refreshChargeDisplay();

    // Kill streak hook: award charges at streaks 10 and 20
    window._onKillStreakForTimeWarp = function (n) {
      if (n === 10 || n === 20) {
        TimeWarp.addCharge(1);
      }
    };

    // Q key listener (add once at the document level)
    document.addEventListener('keydown', function (e) {
      if (e.code !== 'KeyQ') return;
      if (e.altKey) return;   // Alt+Q is used by lean / quickswap
      if (!window.TimeWarp) return;
      // Only act when game is in PLAYING state (read from global GameManager)
      var _gm = window.GameManager;
      if (_gm && typeof _gm.getState === 'function') {
        if (_gm.getState() !== 'playing') return;
      }
      if (_active) {
        TimeWarp.deactivate();
      } else {
        TimeWarp.activate();
      }
    });
  }

  function activate() {
    if (_active) return;
    if (_charges <= 0) return;

    _charges--;
    _active  = true;
    _elapsed = 0;

    // Global time scale
    window._bulletTimeScale = 0.15;

    // FOV hint for game loop
    window._timeWarpFOVDelta = 5;

    // Visual effects
    if (_elOverlay) {
      _elOverlay.style.display = 'block';
      _elOverlay.style.opacity = '1';
    }
    _triggerFlash();
    _applyChromAberration(true);

    // Timer UI
    _showTimerUI(true);
    _updateTimer(_duration);
    _updateRingArc(1.0);
    _refreshChargeDisplay();

    // Toast notification
    if (window.HUD && HUD.notifyPickup) {
      HUD.notifyPickup('⚡ BULLET TIME!', '#00aaff');
    }
  }

  function deactivate() {
    if (!_active) return;
    _active = false;
    _elapsed = 0;

    // Snap-back: brief 150% speed-up for 0.08s to make deactivation feel snappy
    _snapBack = true;
    _snapBackTimer = 0.08;
    window._bulletTimeScale = 1.5;

    // FOV returns to normal
    window._timeWarpFOVDelta = 0;

    // Hide overlays (fade)
    if (_elOverlay) {
      _elOverlay.style.transition = 'opacity 0.3s';
      _elOverlay.style.opacity = '0';
      var _ov = _elOverlay;
      setTimeout(function () { _ov.style.display = 'none'; _ov.style.transition = ''; }, 350);
    }
    _applyChromAberration(false);
    _showTimerUI(false);
    _refreshChargeDisplay();
    _playDeactivateSound();
  }

  function isActive() {
    return _active;
  }

  function addCharge(n) {
    _charges = Math.min(3, _charges + (n || 1));
    _refreshChargeDisplay();
    if (window.HUD && HUD.notifyPickup) {
      HUD.notifyPickup('⚡ BULLET TIME READY!', '#00aaff');
    }
  }

  function getCharges() {
    return _charges;
  }

  /**
   * update(delta) — called every frame from the game loop with the *real* delta
   * (before time-scale is applied). TimeWarp manages its own elapsed count using
   * the unscaled real-time delta so the 5s charge always drains in wall-clock time
   * regardless of the bullet-time scale value.
   */
  function update(delta) {
    // Snap-back: brief 150% then restore 1.0
    if (_snapBack) {
      _snapBackTimer -= delta;
      if (_snapBackTimer <= 0) {
        _snapBack = false;
        window._bulletTimeScale = 1.0;
      }
      return;
    }

    if (!_active) return;

    _elapsed += delta;

    var _remaining = Math.max(0, _duration - _elapsed);
    _updateTimer(_remaining);
    _updateRingArc(_remaining / _duration);

    if (_elapsed >= _duration) {
      deactivate();
    }
  }

  /** clear() — called from applyStage to reset visual state without removing charges */
  function clear() {
    if (_active) {
      // Force deactivate without snap-back
      _active   = false;
      _elapsed  = 0;
      _snapBack = false;
      _snapBackTimer = 0;
      window._bulletTimeScale  = 1.0;
      window._timeWarpFOVDelta = 0;
      _applyChromAberration(false);
      if (_elOverlay) { _elOverlay.style.display = 'none'; _elOverlay.style.opacity = '0'; }
      _showTimerUI(false);
    }
    _refreshChargeDisplay();
  }

  /** reset() — full reset (called after KillStreak.reset on new game) */
  function reset() {
    _charges = 0;
    clear();
    _refreshChargeDisplay();
  }

  return {
    init:        init,
    update:      update,
    activate:    activate,
    deactivate:  deactivate,
    isActive:    isActive,
    addCharge:   addCharge,
    getCharges:  getCharges,
    clear:       clear,
    reset:       reset,
  };

})();
