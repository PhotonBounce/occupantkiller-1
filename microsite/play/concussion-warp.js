/* ============================================================
 *  CONCUSSION-WARP.JS — SVG displacement screen warp on heavy hit (passive)
 *
 *  When the player takes ≥HEAVY_HIT HP in a single frame, a brief
 *  turbulence displacement overlay warps the screen (0.30s) — the
 *  classic FPS "concussion" effect.
 *
 *  Uses an SVG feTurbulence + feDisplacementMap filter applied to a
 *  full-screen transparent overlay div. The filter scale animates:
 *    0 → WARP_PEAK (0.10s) → 0 (0.20s).
 *
 *  For minor hits (MINOR_HIT..HEAVY_HIT) a lighter ripple fires (0.15s).
 *  Cooldown between warps: COOL=0.5s to avoid spam.
 *
 *  z-index 302 (above weather, below HUD). Passive — no keybind.
 * ============================================================ */
var ConcussionWarp = (function () {
  'use strict';

  var HEAVY_HIT  = 35;    /* HP threshold for full warp */
  var MINOR_HIT  = 15;    /* HP threshold for light ripple */
  var WARP_PEAK  = 28;    /* SVG scale at peak of full warp */
  var RIPPLE_PEAK= 12;    /* SVG scale for minor ripple */
  var WARP_DUR   = 0.30;  /* seconds for full warp */
  var RIPPLE_DUR = 0.15;  /* seconds for minor ripple */
  var COOL       = 0.50;  /* minimum gap between effects */

  var _wrap    = null;
  var _svgFilt = null;
  var _turbEl  = null;
  var _dispEl  = null;
  var _init    = false;
  var _lastHp  = null;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _lastWarp= 0;       /* timestamp of last warp */
  var _warpT   = 0;       /* remaining warp time */
  var _warpDur = 0;
  var _warpPk  = 0;

  function _buildDOM() {
    /* SVG filter definition (invisible) */
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;';
    svg.innerHTML = [
      '<defs>',
        '<filter id="cwFilt" x="-10%" y="-10%" width="120%" height="120%">',
          '<feTurbulence id="cwTurb" type="turbulence" baseFrequency="0.02 0.04"',
            ' numOctaves="2" seed="8" result="noise"/>',
          '<feDisplacementMap id="cwDisp" in="SourceGraphic" in2="noise"',
            ' scale="0" xChannelSelector="R" yChannelSelector="G"/>',
        '</filter>',
      '</defs>',
    ].join('');
    document.body.appendChild(svg);
    _turbEl = svg.querySelector('#cwTurb');
    _dispEl = svg.querySelector('#cwDisp');

    /* Full-screen overlay that the filter is applied to */
    _wrap = document.createElement('div');
    _wrap.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:302;',
      'filter:url(#cwFilt);',
      'opacity:0;',
      'background:rgba(255,240,200,0.04);',
    ].join('');
    document.body.appendChild(_wrap);
  }

  function _trigger(peak, dur) {
    _warpPk  = peak;
    _warpDur = dur;
    _warpT   = dur;
    _lastWarp = performance.now() / 1000;
    if (_wrap) _wrap.style.opacity = '1';
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* HP monitoring every frame */
    try {
      if (window.player) {
        var hp = window.player.hp;
        if (hp !== undefined && hp !== null) {
          if (_lastHp !== null && hp < _lastHp) {
            var dmg = _lastHp - hp;
            if (now - _lastWarp > COOL) {
              if (dmg >= HEAVY_HIT) {
                _trigger(_warpPk = WARP_PEAK, WARP_DUR);
              } else if (dmg >= MINOR_HIT) {
                _trigger(_warpPk = RIPPLE_PEAK, RIPPLE_DUR);
              }
            }
          }
          _lastHp = hp;
        }
      }
    } catch (er) {}

    /* Animate the displacement scale */
    if (_warpT > 0 && _dispEl) {
      _warpT -= dt;
      var t   = Math.max(0, _warpT / _warpDur);   /* 1→0 */
      /* Triangle envelope: peak at 0.35 through, zero at ends */
      var env = (t > 0.65) ? (1 - t) / 0.35 : t / 0.65;
      var scale = (_warpPk * env).toFixed(1);
      _dispEl.setAttribute('scale', scale);

      if (_warpT <= 0) {
        _dispEl.setAttribute('scale', '0');
        if (_wrap) _wrap.style.opacity = '0';
      }
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildDOM();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ConcussionWarp = ConcussionWarp;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ConcussionWarp.init(); });
} else {
  ConcussionWarp.init();
}
