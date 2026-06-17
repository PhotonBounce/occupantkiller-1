/* ============================================================
 *  AMMO-WARNING.JS — Low-ammo and empty-clip HUD alerts (passive)
 *
 *  Monitors Weapons.getState() clip vs clipSize:
 *    clip = 0         → "⬛ RELOAD REQUIRED"  red, fast pulse 3Hz
 *    clip < 25% full  → "▣ LOW AMMO"          yellow, slow pulse 1.5Hz
 *
 *  Alert strip appears at bottom-center just above the ammo counter.
 *  Hides immediately when clip is refilled.
 *
 *  Also: when reserve ammo = 0 AND clip = 0 → "NO AMMO"  dark red.
 *
 *  CSS-only. z-index 455. Passive — no keybind.
 * ============================================================ */
var AmmoWarning = (function () {
  'use strict';

  var LOW_FRAC   = 0.25;
  var PULSE_FAST = 3.0;
  var PULSE_SLOW = 1.5;
  var UPDATE_INT = 0.1;  /* seconds between checks */

  var _el      = null;
  var _init    = false;
  var _lastTs  = 0;
  var _phase   = 0;
  var _lastUpd = 0;
  var _state   = 'hidden';  /* 'hidden' | 'low' | 'empty' | 'noammo' */

  function _buildStyle() {
    var style = document.createElement('style');
    style.textContent = [
      '#aw-bar{',
        'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);',
        'font-family:"Courier New",monospace;font-size:10px;',
        'letter-spacing:4px;font-weight:bold;',
        'padding:4px 16px;border-radius:3px;',
        'pointer-events:none;z-index:455;',
        'white-space:nowrap;display:none;',
        'transition:opacity 0.15s ease;',
      '}',
    ].join('');
    document.head.appendChild(style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'aw-bar';
    document.body.appendChild(_el);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _phase += dt;

    var now = ts / 1000;
    if (now - _lastUpd < UPDATE_INT) {
      /* Only update alpha for pulse on off-frames */
      if (_el && _state !== 'hidden') _applyPulse();
      return;
    }
    _lastUpd = now;

    /* Check ammo state */
    var newState = 'hidden';
    try {
      if (typeof Weapons !== 'undefined' && Weapons.getState && Weapons.getCurrent) {
        var st  = Weapons.getState();
        var wep = Weapons.getCurrent();
        if (st && wep) {
          var clip     = st.clip  !== undefined ? st.clip  : 1;
          var reserve  = st.reserve !== undefined ? st.reserve : 1;
          var clipSize = wep.clipSize || 30;
          var isMelee  = (typeof Weapons.getCurrentType === 'function'
            && (Weapons.getCurrentType() || '').toUpperCase().indexOf('MELEE') >= 0);
          if (!isMelee) {
            if (clip <= 0 && reserve <= 0) newState = 'noammo';
            else if (clip <= 0) newState = 'empty';
            else if (clip / clipSize < LOW_FRAC) newState = 'low';
          }
        }
      }
    } catch (e) {}

    if (newState !== _state) {
      _state = newState;
      _setState(newState);
    } else if (_state !== 'hidden') {
      _applyPulse();
    }
  }

  function _setState(s) {
    if (!_el) return;
    if (s === 'hidden') {
      _el.style.display = 'none';
      return;
    }
    _el.style.display = 'block';
    if (s === 'noammo') {
      _el.textContent = 'NO AMMO';
      _el.style.background = 'rgba(60,0,0,0.75)';
      _el.style.color = 'rgba(180,60,60,1)';
    } else if (s === 'empty') {
      _el.textContent = '■ RELOAD REQUIRED';
      _el.style.background = 'rgba(80,10,10,0.80)';
      _el.style.color = 'rgba(255,70,70,1)';
    } else {
      _el.textContent = '▣ LOW AMMO';
      _el.style.background = 'rgba(60,50,0,0.75)';
      _el.style.color = 'rgba(255,210,60,1)';
    }
  }

  function _applyPulse() {
    if (!_el || _state === 'hidden') return;
    var hz = (_state === 'empty') ? PULSE_FAST : PULSE_SLOW;
    var p  = (Math.sin(_phase * hz * Math.PI * 2) * 0.5 + 0.5);
    _el.style.opacity = (0.55 + p * 0.45).toFixed(2);
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildStyle();
    _buildDom();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.AmmoWarning = AmmoWarning;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { AmmoWarning.init(); });
} else {
  AmmoWarning.init();
}