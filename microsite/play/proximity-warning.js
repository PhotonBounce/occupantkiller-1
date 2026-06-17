/* ============================================================
 *  PROXIMITY-WARNING.JS — CQB danger flash when enemy < 4u (passive)
 *
 *  Scans Enemies.getAll() every 3 frames. If any living enemy is
 *  within DANGER_DIST world units of the player:
 *  - Red vignette pulses urgently on a fullscreen canvas
 *  - Brief CameraSystem.shake() for each new entrant
 *  - Pulse rate and intensity scale with proximity (closer = faster)
 *
 *  Cooldown per enemy (0.8s) prevents continuous shake spam.
 * ============================================================ */
var ProximityWarning = (function () {
  'use strict';

  var DANGER_DIST  = 4.5;    /* world units — CQB danger zone */
  var CRITICAL_DIST = 2.0;   /* inside this: max intensity */

  var _canvas  = null;
  var _ctx     = null;
  var _init    = false;
  var _lastTs  = 0;
  var _frameN  = 0;

  /* Per-enemy shake throttle */
  var _shakeCd = new WeakMap();
  var SHAKE_CD = 0.8;   /* seconds between shakes per enemy */

  /* Vignette state */
  var _vigAlpha  = 0;   /* current rendered alpha */
  var _vigTarget = 0;   /* target alpha for this frame */

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:393;',
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

  function _drawVignette(alpha) {
    if (!_ctx || alpha <= 0) return;
    var ctx = _ctx;
    var W = _canvas.width, H = _canvas.height;
    var grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.25, W/2, H/2, Math.max(W,H)*0.72);
    grad.addColorStop(0,   'rgba(255, 0, 0, 0)');
    grad.addColorStop(0.6, 'rgba(220, 0, 0, 0)');
    grad.addColorStop(1,   'rgba(255, 0, 0, ' + (alpha * 0.75).toFixed(3) + ')');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    /* Inner danger zone cross-hatch corners */
    if (alpha > 0.4) {
      ctx.strokeStyle = 'rgba(255, 50, 50, ' + (alpha * 0.35).toFixed(3) + ')';
      ctx.lineWidth = 2;
      var sz = 28;
      /* corners */
      [[0,0,sz,0,0,sz], [W,0,W-sz,0,W,sz], [0,H,sz,H,0,H-sz], [W,H,W-sz,H,W,H-sz]].forEach(function (d) {
        ctx.beginPath();
        ctx.moveTo(d[0], d[1]);
        ctx.lineTo(d[2], d[3]);
        ctx.moveTo(d[0], d[1]);
        ctx.lineTo(d[4], d[5]);
        ctx.stroke();
      });
    }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.12, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Scan every 3 frames */
    _vigTarget = 0;
    if (_frameN % 3 === 0) {
      var px = 0, pz = 0;
      try {
        if (window.player && window.player.position) { px = window.player.position.x; pz = window.player.position.z; }
      } catch (e) {}

      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          var now = ts / 1000;
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0)) continue;
            var dx = e.mesh.position.x - px;
            var dz = e.mesh.position.z - pz;
            var dist = Math.sqrt(dx * dx + dz * dz);

            if (dist <= DANGER_DIST) {
              /* Proximity intensity: 1.0 at critical, 0.3 at edge */
              var t = 1 - dist / DANGER_DIST;
              var intensity = 0.3 + t * 0.7;
              if (intensity > _vigTarget) _vigTarget = intensity;

              /* Shake on new entrant, throttled */
              var lastShake = _shakeCd.has(e) ? _shakeCd.get(e) : -999;
              if (now - lastShake > SHAKE_CD) {
                _shakeCd.set(e, now);
                try {
                  if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
                    CameraSystem.shake(0.06 + t * 0.1, 0.18);
                  }
                } catch (er) {}
              }
            }
          }
        }
      } catch (err) {}
    }

    /* Pulse the vignette — oscillate at rate scaled by intensity */
    var pulseRate = 2.5 + _vigTarget * 4.0;
    var pulse     = (Math.sin(ts / 1000 * pulseRate * Math.PI * 2) * 0.5 + 0.5);
    var rendered  = _vigTarget * (0.4 + pulse * 0.6);

    /* Smooth alpha (fast approach, slow decay) */
    var approach  = rendered > _vigAlpha ? 8 : 3;
    _vigAlpha    += (rendered - _vigAlpha) * Math.min(1, approach * dt);

    if (_vigAlpha > 0.01) {
      _drawVignette(_vigAlpha);
    } else if (_ctx) {
      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ProximityWarning = ProximityWarning;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ProximityWarning.init(); });
} else {
  ProximityWarning.init();
}