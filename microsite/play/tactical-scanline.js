/* ============================================================
 *  TACTICAL-SCANLINE.JS — Subtle CRT scanline overlay (passive)
 *
 *  Renders very faint horizontal scanlines across the screen at
 *  3px intervals, giving a military tactical display / CRT aesthetic.
 *
 *  Implementation: a single CSS repeating-linear-gradient div —
 *  zero canvas overhead, pure CSS. The scanlines scroll very slowly
 *  downward at 8px/s, giving a living display feel.
 *
 *  A bright "sweep line" (single brighter line) scrolls at 40px/s
 *  as a secondary visual cue. Both are extremely subtle.
 *
 *  Opacity: 0.03 base (barely visible, just texture). On damage
 *  the opacity briefly spikes to 0.08 for a "signal disturbance" cue.
 *
 *  z-index 306. Passive — no keybind.
 * ============================================================ */
var TacticalScanline = (function () {
  'use strict';

  var SCROLL_SPEED = 8;    /* px/s for scanlines */
  var SWEEP_SPEED  = 40;   /* px/s for sweep line */
  var BASE_ALPHA   = 0.03;
  var DAMAGE_ALPHA = 0.10;
  var DAMAGE_FADE  = 0.5;  /* seconds to fade back */

  var _overlayEl = null;
  var _sweepEl   = null;
  var _init      = false;
  var _lastTs    = 0;
  var _scanY     = 0;
  var _sweepY    = 0;
  var _damageT   = 0;
  var _prevPHp   = null;
  var _frameN    = 0;

  function _buildDom() {
    /* Scanline overlay — CSS repeating gradient */
    _overlayEl = document.createElement('div');
    _overlayEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:306;',
      'background:repeating-linear-gradient(',
        'to bottom,',
        'rgba(0,0,0,0.0) 0px,rgba(0,0,0,0.0) 2px,',
        'rgba(0,30,40,1) 2px,rgba(0,30,40,1) 3px',
      ');',
      'background-size:100% 3px;',
      'opacity:' + BASE_ALPHA + ';',
      'will-change:background-position;',
    ].join('');
    document.body.appendChild(_overlayEl);

    /* Sweep line */
    _sweepEl = document.createElement('div');
    _sweepEl.style.cssText = [
      'position:fixed;left:0;width:100%;height:1px;',
      'pointer-events:none;z-index:306;',
      'background:rgba(0,200,255,0.06);',
      'top:0;',
    ].join('');
    document.body.appendChild(_sweepEl);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Damage detection */
    if (_frameN % 3 === 0) {
      try {
        if (window.player && window.player.hp !== undefined) {
          var hp = window.player.hp;
          if (_prevPHp !== null && _prevPHp > hp && hp > 0) _damageT = DAMAGE_FADE;
          _prevPHp = hp;
        }
      } catch (e) {}
    }

    if (_damageT > 0) _damageT = Math.max(0, _damageT - dt);

    /* Scroll scanlines */
    _scanY = (_scanY + SCROLL_SPEED * dt) % 3;
    if (_overlayEl) {
      var alpha = BASE_ALPHA + (_damageT / DAMAGE_FADE) * (DAMAGE_ALPHA - BASE_ALPHA);
      _overlayEl.style.backgroundPositionY = _scanY.toFixed(1) + 'px';
      _overlayEl.style.opacity = alpha.toFixed(3);
    }

    /* Scroll sweep */
    _sweepY += SWEEP_SPEED * dt;
    if (_sweepY > window.innerHeight) _sweepY = -2;
    if (_sweepEl) _sweepEl.style.top = Math.round(_sweepY) + 'px';
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildDom();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.TacticalScanline = TacticalScanline;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { TacticalScanline.init(); });
} else {
  TacticalScanline.init();
}