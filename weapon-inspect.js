/**
 * weapon-inspect.js — Weapon Inspect Animation
 *
 * Press O (or hold F for 1 second) to trigger a tactical weapon inspection.
 * Shows a military-style overlay card with weapon name, condition, ammo, and
 * a generated serial number. Blocks firing while active; cancelled by LMB or R.
 *
 * IIFE singleton — exposes init(), triggerInspect(), update(), isInspecting()
 * Depends on: window.Weapons (optional), window.AudioSystem (optional)
 */
window.WeaponInspect = (function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var _active       = false;   // inspect overlay visible?
  var _phase        = 0;       // 0=idle 1=slide-in 2=hold 3=slide-out
  var _phaseTimer   = 0;       // seconds elapsed in current phase
  var _serialNumber = '';      // regenerated each inspect
  var _overlayEl    = null;    // #inspectOverlay DOM node
  var _fHoldTimer   = 0;       // seconds F has been held without other action
  var _fHoldActive  = false;   // is F currently pressed
  var _fHoldFired   = false;   // did this F-press already trigger inspect?
  var _initialized  = false;

  // Phase durations (seconds)
  var PHASE_SLIDE_IN  = 0.3;
  var PHASE_HOLD      = 1.8;
  var PHASE_SLIDE_OUT = 0.4;
  var F_HOLD_THRESH   = 1.0;   // hold F for this long to trigger

  // ─── Utility ──────────────────────────────────────────────────────────────
  function _randomSerial() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    var prefix = chars[Math.floor(Math.random() * 24)];  // always a letter first
    var digits = '';
    for (var i = 0; i < 5; i++) {
      digits += chars[Math.floor(Math.random() * chars.length)];
    }
    return prefix + 'K-' + digits;
  }

  function _getWeaponName() {
    try {
      var w = window.Weapons && typeof window.Weapons.getCurrent === 'function'
        ? window.Weapons.getCurrent()
        : null;
      return (w && w.name) ? w.name.toUpperCase() : 'UNKNOWN';
    } catch (e) {
      return 'UNKNOWN';
    }
  }

  function _getAmmoString() {
    try {
      var st = window.Weapons && typeof window.Weapons.getState === 'function'
        ? window.Weapons.getState()
        : null;
      if (!st) return '— / —';
      var clip    = (st.clip    != null) ? st.clip    : '—';
      var reserve = (st.reserve != null) ? st.reserve : '—';
      if (clip === Infinity || clip === '—') return '∞ / ∞';
      return clip + ' / ' + reserve;
    } catch (e) {
      return '— / —';
    }
  }

  // ─── Sound ────────────────────────────────────────────────────────────────
  function _playClack() {
    try {
      if (window.AudioSystem && typeof window.AudioSystem.playFootstepEnhanced === 'function') {
        window.AudioSystem.playFootstepEnhanced('stone', false);
        return;
      }
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx = new AudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 200;
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
      // second lighter "clack" tap
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.value = 280;
      gain2.gain.setValueAtTime(0.10, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.18);
    } catch (e) {
      // silently ignore audio errors
    }
  }

  // ─── Overlay DOM ──────────────────────────────────────────────────────────
  function _buildOverlay() {
    if (document.getElementById('inspectOverlay')) {
      return document.getElementById('inspectOverlay');
    }
    var el = document.createElement('div');
    el.id = 'inspectOverlay';
    el.style.cssText = [
      'position:fixed',
      'right:-340px',        // starts off-screen to the right
      'bottom:120px',
      'width:280px',
      'background:rgba(0,10,0,0.88)',
      'border:2px solid #00cc44',
      'color:#00ff66',
      'font-family:"Courier New",Courier,monospace',
      'font-size:13px',
      'line-height:1.6',
      'padding:12px 16px',
      'letter-spacing:1px',
      'z-index:9999',
      'pointer-events:none',
      'transition:right 0.3s ease-out, opacity 0.4s ease-in',
      'opacity:0',
      'box-shadow:0 0 18px rgba(0,204,68,0.35)',
      'white-space:pre',
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  function _updateOverlayContent() {
    if (!_overlayEl) return;
    var wname  = _getWeaponName();
    var ammo   = _getAmmoString();
    var sn     = _serialNumber;

    // Pad / centre the weapon name inside a fixed 18-char field
    function centre(str, width) {
      if (str.length >= width) return str.slice(0, width);
      var pad   = width - str.length;
      var left  = Math.floor(pad / 2);
      var right = pad - left;
      return new Array(left + 1).join(' ') + str + new Array(right + 1).join(' ');
    }

    var W = 20; // inner content width
    var line1 = centre(wname,       W);
    var line2 = centre('COND: GOOD',  W);
    var line3 = centre('AMMO: ' + ammo, W);
    var line4 = centre('SN: ' + sn,  W);

    _overlayEl.textContent =
      '╔' + '═'.repeat(W) + '╗\n' +
      '║' + line1              + '║\n' +
      '║' + line2              + '║\n' +
      '║' + line3              + '║\n' +
      '║' + line4              + '║\n' +
      '╚' + '═'.repeat(W) + '╝';
  }

  // ─── Animation driver ─────────────────────────────────────────────────────
  function _startInspect() {
    if (_active) return;            // already running
    _active       = true;
    _phase        = 1;              // slide-in
    _phaseTimer   = 0;
    _serialNumber = _randomSerial();
    window._inspecting = true;

    if (!_overlayEl) _overlayEl = _buildOverlay();
    _updateOverlayContent();

    // Trigger slide-in: move into view
    // (uses requestAnimationFrame tick so transition fires)
    setTimeout(function () {
      if (!_overlayEl) return;
      _overlayEl.style.right   = '24px';
      _overlayEl.style.opacity = '1';
    }, 16);

    _playClack();

    // Also kick the weapon mesh animation if available
    if (window.Weapons && typeof window.Weapons.startInspect === 'function') {
      window.Weapons.startInspect();
    }
  }

  function _endInspect() {
    if (!_active) return;
    _active            = false;
    _phase             = 0;
    _phaseTimer        = 0;
    window._inspecting = false;

    if (_overlayEl) {
      _overlayEl.style.right   = '-340px';
      _overlayEl.style.opacity = '0';
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  function triggerInspect() {
    _startInspect();
  }

  function isInspecting() {
    return _active;
  }

  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;

    // F-hold timer logic
    if (_fHoldActive && !_fHoldFired) {
      _fHoldTimer += delta;
      if (_fHoldTimer >= F_HOLD_THRESH) {
        _fHoldFired = true;
        _startInspect();
      }
    }

    if (!_active) return;

    _phaseTimer += delta;

    if (_phase === 1) {
      // slide-in phase
      if (_phaseTimer >= PHASE_SLIDE_IN) {
        _phase      = 2;
        _phaseTimer = 0;
      }
    } else if (_phase === 2) {
      // hold phase
      if (_phaseTimer >= PHASE_HOLD) {
        _phase      = 3;
        _phaseTimer = 0;
        // begin slide-out
        if (_overlayEl) {
          _overlayEl.style.right   = '-340px';
          _overlayEl.style.opacity = '0';
        }
      }
    } else if (_phase === 3) {
      // slide-out phase
      if (_phaseTimer >= PHASE_SLIDE_OUT) {
        _endInspect();
      }
    }
  }

  function init() {
    if (_initialized) return;
    _initialized = true;

    // Pre-build the overlay element
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        _overlayEl = _buildOverlay();
      });
    } else {
      _overlayEl = _buildOverlay();
    }

    // ── O key → instant inspect ──────────────────────────────────────────
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyO') {
        _startInspect();
        return;
      }

      // ── F key hold tracking ──────────────────────────────────────────
      if (e.code === 'KeyF' && !e.repeat) {
        _fHoldActive = true;
        _fHoldTimer  = 0;
        _fHoldFired  = false;
      }

      // Cancel on fire (mouse handled separately) or reload key
      if (e.code === 'KeyR' && _active) {
        _endInspect();
      }
    });

    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyF') {
        _fHoldActive = false;
        _fHoldTimer  = 0;
        _fHoldFired  = false;
      }
    });

    // Cancel on LMB (fire button)
    document.addEventListener('mousedown', function (e) {
      if (e.button === 0 && _active) {
        _endInspect();
      }
    });
  }

  return {
    init:           init,
    triggerInspect: triggerInspect,
    update:         update,
    isInspecting:   isInspecting,
  };
})();
