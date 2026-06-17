/* ============================================================
 *  FLASH-BANG-EFFECT.JS — white-out on massive damage (passive)
 *
 *  When the player takes ≥FLASH_HIT HP in a single frame (tank
 *  shell / rocket / point-blank shotgun), a full-screen white
 *  flash fires and fades over FADE=0.85s — the "you got hit hard"
 *  moment. Complements concussion-warp.js (which does SVG spatial
 *  distortion on lighter hits).
 *
 *  ULTRA_HIT (≥80 HP) fires a more intense, longer flash.
 *  COOL=1.0s prevents stacking.
 *
 *  CSS div. z-index 503 (above all HUD except kill-milestone 505).
 *  Passive — no keybind.
 * ============================================================ */
var FlashBangEffect = (function () {
  'use strict';

  var FLASH_HIT  = 60;   /* HP threshold for regular flash */
  var ULTRA_HIT  = 80;   /* HP threshold for intense flash */
  var FADE_NORM  = 0.85;
  var FADE_ULTRA = 1.2;
  var COOL       = 1.0;

  var _el      = null;
  var _init    = false;
  var _lastHp  = null;
  var _lastTs  = 0;
  var _lastFire= 0;
  var _active  = false;

  function _buildDom() {
    _el = document.createElement('div');
    _el.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:503;',
      'background:rgba(255,255,255,0);',
      'transition:none;',
    ].join('');
    document.body.appendChild(_el);
  }

  function _fire(intense) {
    if (!_el) return;
    _active = true;
    var dur = intense ? FADE_ULTRA : FADE_NORM;
    var peak = intense ? 0.92 : 0.70;

    /* Instant white-out */
    _el.style.transition = 'none';
    _el.style.background = 'rgba(255,255,255,' + peak + ')';

    /* Fade out */
    var el = _el;
    setTimeout(function () {
      el.style.transition = 'background ' + dur + 's ease-out';
      el.style.background = 'rgba(255,255,255,0)';
      setTimeout(function () { _active = false; }, dur * 1000);
    }, 20);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    try {
      if (window.player) {
        var hp = window.player.hp;
        if (hp !== undefined && hp !== null) {
          if (_lastHp !== null && hp < _lastHp && !_active) {
            var dmg = _lastHp - hp;
            if (now - _lastFire >= COOL) {
              if (dmg >= FLASH_HIT) {
                _lastFire = now;
                _fire(dmg >= ULTRA_HIT);
              }
            }
          }
          _lastHp = hp;
        }
      }
    } catch (er) {}
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildDom();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.FlashBangEffect = FlashBangEffect;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { FlashBangEffect.init(); });
} else {
  FlashBangEffect.init();
}
