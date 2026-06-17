/* ============================================================
 *  LOW-AMMO-WARNING.JS — Low ammo visual alert (passive)
 *
 *  Watches Weapons.getState().clip every 6 frames.
 *  Threshold: clip ≤ 20% of clipSize → LOW AMMO state.
 *             clip === 0              → EMPTY state.
 *  Melee weapons ignored.
 *
 *  In LOW AMMO state:
 *  - Pulsing "LOW AMMO" text in bottom-center, orange
 *  - Subtle orange edge vignette on canvas
 *
 *  In EMPTY state (clip=0, reserve>0):
 *  - Text changes to "RELOAD NOW!" in red
 *  - Faster pulsing vignette
 *
 *  Turns off immediately on reload (clip goes back up).
 * ============================================================ */
var LowAmmoWarning = (function () {
  'use strict';

  var LOW_PCT   = 0.20;   /* ≤ this fraction = LOW AMMO */

  var _canvas   = null;
  var _ctx      = null;
  var _el       = null;
  var _style    = null;
  var _init     = false;
  var _lastTs   = 0;
  var _frameN   = 0;
  var _state    = 'ok';   /* 'ok' | 'low' | 'empty' */

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes laWarn{',
        '0%{opacity:0.9}50%{opacity:0.3}100%{opacity:0.9}',
      '}',
      '@keyframes laWarnFast{',
        '0%{opacity:1}40%{opacity:0.1}100%{opacity:1}',
      '}',
      '#la-text{',
        'position:fixed;bottom:62px;left:50%;transform:translateX(-50%);',
        'font-family:"Courier New",monospace;font-weight:bold;font-size:15px;',
        'letter-spacing:0.3em;text-transform:uppercase;',
        'pointer-events:none;z-index:435;',
        'display:none;white-space:nowrap;',
        'text-shadow:0 0 12px currentColor;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'la-text';
    document.body.appendChild(_el);
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:392;',
    ].join('');
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize);
  }

  function _resize() {
    if (!_canvas) return;
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  function _setState(s) {
    if (s === _state) return;
    _state = s;

    if (s === 'ok') {
      if (_el) { _el.style.display = 'none'; _el.style.animation = 'none'; }
      if (_ctx) _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    } else if (s === 'low') {
      if (_el) {
        _el.textContent = 'LOW AMMO';
        _el.style.color = '#ff8800';
        _el.style.display = 'block';
        _el.style.animation = 'laWarn 0.9s ease-in-out infinite';
      }
    } else if (s === 'empty') {
      if (_el) {
        _el.textContent = 'RELOAD NOW!';
        _el.style.color = '#ff3333';
        _el.style.display = 'block';
        _el.style.animation = 'laWarnFast 0.45s ease-in-out infinite';
      }
    }
  }

  function _drawVignette(color, alpha) {
    if (!_ctx) return;
    var W = _canvas.width, H = _canvas.height;
    var grad = _ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.3, W/2, H/2, Math.max(W,H) * 0.68);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, color.replace('1)', alpha + ')'));
    _ctx.clearRect(0, 0, W, H);
    _ctx.fillStyle = grad;
    _ctx.fillRect(0, 0, W, H);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    if (_frameN % 6 !== 0) {
      /* Keep vignette animated even between scans */
      if (_state !== 'ok' && _ctx) {
        var rate  = _state === 'empty' ? 3.5 : 1.5;
        var pulse = (Math.sin(ts / 1000 * rate * Math.PI * 2) * 0.5 + 0.5);
        var aMax  = _state === 'empty' ? 0.45 : 0.28;
        _drawVignette(_state === 'empty' ? 'rgba(255,30,30,1)' : 'rgba(255,130,0,1)', (pulse * aMax).toFixed(3));
      }
      return;
    }

    /* Weapon check */
    try {
      if (typeof Weapons === 'undefined' || !Weapons.getState || !Weapons.getCurrentType) return;
      if (Weapons.getCurrentType() === 'MELEE') { _setState('ok'); return; }
      var st  = Weapons.getState();
      var cur = st ? st.clip : null;
      if (cur === null) return;

      var clipSize = 0;
      try {
        var wdef = Weapons.getCurrent();
        clipSize = wdef ? wdef.clipSize : 30;
      } catch (e) { clipSize = 30; }

      if (cur === 0) {
        _setState('empty');
      } else if (clipSize > 0 && cur / clipSize <= LOW_PCT) {
        _setState('low');
      } else {
        _setState('ok');
      }
    } catch (err) { _setState('ok'); }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildStyle();
    _buildDom();
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.LowAmmoWarning = LowAmmoWarning;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { LowAmmoWarning.init(); });
} else {
  LowAmmoWarning.init();
}