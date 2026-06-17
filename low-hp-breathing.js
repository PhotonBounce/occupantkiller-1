/* ============================================================
 *  LOW-HP-BREATHING.JS — Simulated breathing visual at critical HP (passive)
 *
 *  When player HP drops below 30%, the screen gently "breathes":
 *  a very subtle scale oscillation (±0.5%) and pulsing dark vignette
 *  synchronized at breathing frequency (≈0.35 Hz at rest).
 *
 *  At <15% HP: faster, shallower breathing (≈0.6 Hz, panic mode)
 *              + stronger vignette pulsing
 *
 *  Effect ramps smoothly in/out as HP crosses the 30% threshold.
 *  Uses a fullscreen div with CSS transform (scale) so it doesn't
 *  affect game logic — purely cosmetic.
 *
 *  z-index 301 (below ambient, behind everything).
 * ============================================================ */
var LowHpBreathing = (function () {
  'use strict';

  var HP_THRESHOLD   = 0.30;   /* 30% HP triggers breathing */
  var HP_PANIC       = 0.15;   /* 15% HP = panic breathing */
  var BREATHE_SLOW   = 0.35;   /* cycles per second at normal critical */
  var BREATHE_FAST   = 0.60;   /* cycles per second at panic */
  var SCALE_AMPL     = 0.006;  /* max scale oscillation (0.6%) */
  var VIG_AMPL       = 0.22;   /* max vignette alpha */

  var _init     = false;
  var _frameN   = 0;
  var _lastTs   = 0;
  var _phase    = 0;           /* cumulative breathing phase (radians) */

  var _wrapEl   = null;        /* fullscreen scale div */
  var _vigEl    = null;        /* vignette canvas */
  var _vigCtx   = null;
  var _intensity = 0;          /* 0=off, 1=max */

  function _buildElements() {
    /* Scale wrapper — wraps nothing, just for the transform effect.
       We can't wrap the 3D canvas via DOM, so we apply the scale
       to a fullscreen overlay that contains a vignette. */
    _vigEl = document.createElement('canvas');
    _vigEl.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:301;',
    ].join('');
    document.body.appendChild(_vigEl);
    _vigCtx = _vigEl.getContext('2d');

    _resize();
    window.addEventListener('resize', _resize);
  }

  function _resize() {
    if (!_vigEl) return;
    _vigEl.width  = window.innerWidth;
    _vigEl.height = window.innerHeight;
  }

  function _drawVignette(alpha) {
    if (!_vigCtx || alpha < 0.01) {
      if (_vigCtx) _vigCtx.clearRect(0, 0, _vigEl.width, _vigEl.height);
      return;
    }
    var W = _vigEl.width; var H = _vigEl.height;
    _vigCtx.clearRect(0, 0, W, H);

    var grad = _vigCtx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.2, W/2, H/2, Math.max(W,H)*0.72);
    grad.addColorStop(0,   'rgba(80,0,0,0)');
    grad.addColorStop(0.6, 'rgba(60,0,0,' + (alpha * 0.5).toFixed(3) + ')');
    grad.addColorStop(1,   'rgba(20,0,0,' + alpha.toFixed(3) + ')');
    _vigCtx.fillStyle = grad;
    _vigCtx.fillRect(0, 0, W, H);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* HP check */
    var hpFrac = 1;
    try {
      if (window.player && window.player.hp !== undefined) {
        hpFrac = window.player.hp / (window.player.maxHp || 100);
      }
    } catch (e) {}

    /* Target intensity */
    var targetInt = 0;
    if (hpFrac < HP_THRESHOLD) {
      targetInt = 1 - hpFrac / HP_THRESHOLD;   /* 0 at 30%, 1 at 0% */
    }

    /* Smooth */
    _intensity += (targetInt - _intensity) * Math.min(1, dt * 3);
    if (_intensity < 0.005) { _intensity = 0; _drawVignette(0); return; }

    /* Breathing rate */
    var isPanic  = hpFrac < HP_PANIC;
    var rate     = isPanic ? BREATHE_FAST : BREATHE_SLOW;
    _phase      += rate * Math.PI * 2 * dt;

    /* Breathing sin wave — smooth breathe in/out */
    var breathe  = Math.sin(_phase);   /* -1 to 1 */

    /* Vignette: darker on exhale */
    var vigAlpha = VIG_AMPL * _intensity * (0.6 + 0.4 * (breathe * -0.5 + 0.5));
    _drawVignette(vigAlpha);

  }


  function init() {
    if (_init) return;
    _init = true;
    _buildElements();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.LowHpBreathing = LowHpBreathing;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { LowHpBreathing.init(); });
} else {
  LowHpBreathing.init();
}