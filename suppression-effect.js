/* ============================================================
 *  SUPPRESSION-EFFECT.JS — Visual suppression under rapid fire (passive)
 *
 *  Tracks player HP drops. When 3+ hits land within 1.5 seconds,
 *  the player is "suppressed":
 *
 *  - Semi-transparent gray/smoke overlay pulses at screen edges
 *  - "SUPPRESSED" text appears center-screen
 *  - CSS desaturation filter on a fullscreen div simulates loss of color
 *  - Suppression decays over 2s after last hit
 *
 *  Severity:
 *    1-2 hits  → none
 *    3-4 hits  → mild (text hidden, light edge smoke)
 *    5+  hits  → heavy (SUPPRESSED text, strong smoke, desaturation)
 *
 *  No keybind — completely passive. z-index 394 (above proximity-warning 393).
 * ============================================================ */
var SuppressionEffect = (function () {
  'use strict';

  var HIT_WINDOW    = 1.5;   /* seconds: how long a hit stays in rolling window */
  var DECAY_TIME    = 2.0;   /* seconds: suppression fades after last hit */
  var MIN_HITS      = 3;     /* hits needed for any effect */
  var HEAVY_HITS    = 5;     /* hits for full heavy effect */

  var _canvas     = null;
  var _overlay    = null;    /* desaturation div */
  var _textEl     = null;
  var _ctx        = null;
  var _init       = false;
  var _frameN     = 0;
  var _lastTs     = 0;

  var _hitTimes   = [];   /* rolling timestamps of HP drops */
  var _lastHitT   = -999;
  var _prevHp     = null;
  var _suppressed = 0;    /* current suppression intensity 0-1 */

  function _buildElements() {
    /* Canvas for smoke vignette */
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:394;',
    ].join('');
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize);

    /* Desaturation overlay div */
    _overlay = document.createElement('div');
    _overlay.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:393;',
      'transition:filter 0.3s ease;',
    ].join('');
    document.body.appendChild(_overlay);

    /* SUPPRESSED text */
    _textEl = document.createElement('div');
    _textEl.style.cssText = [
      'position:fixed;top:50%;left:50%;',
      'transform:translate(-50%,-50%);',
      'font-family:"Courier New",monospace;font-size:11px;',
      'letter-spacing:5px;color:rgba(180,190,180,0.75);',
      'pointer-events:none;z-index:395;',
      'display:none;text-transform:uppercase;',
    ].join('');
    _textEl.textContent = 'SUPPRESSED';
    document.body.appendChild(_textEl);
  }

  function _resize() {
    if (!_canvas) return;
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  function _drawSmoke(intensity) {
    if (!_ctx) return;
    var W  = _canvas.width;
    var H  = _canvas.height;
    var ctx = _ctx;
    ctx.clearRect(0, 0, W, H);

    if (intensity <= 0.01) return;

    /* Animate: slow pulse */
    var pulse = 0.85 + 0.15 * Math.sin(_lastTs / 300);
    var alpha = intensity * pulse * 0.40;

    /* Radial gradient from edges in */
    var grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.2, W/2, H/2, Math.max(W,H)*0.75);
    grad.addColorStop(0,   'rgba(120,130,120,0)');
    grad.addColorStop(0.5, 'rgba(100,110,100,' + (alpha * 0.3).toFixed(2) + ')');
    grad.addColorStop(1,   'rgba(80,90,80,' + alpha.toFixed(2) + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    /* Corner wisps */
    var corners = [[0,0],[W,0],[0,H],[W,H]];
    corners.forEach(function (c) {
      var cg = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], Math.min(W,H) * 0.35);
      cg.addColorStop(0,   'rgba(80,90,80,' + (alpha * 0.6).toFixed(2) + ')');
      cg.addColorStop(1,   'rgba(80,90,80,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(c[0], c[1], Math.min(W,H) * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* HP drop detection */
    try {
      if (window.player && window.player.hp !== undefined) {
        var hp = window.player.hp;
        if (_prevHp !== null && _prevHp - hp >= 2 && hp > 0) {
          /* Hit registered */
          _hitTimes.push(now);
          _lastHitT = now;
        }
        _prevHp = hp;
      }
    } catch (e) {}

    /* Prune old hits */
    _hitTimes = _hitTimes.filter(function (t) { return now - t <= HIT_WINDOW; });
    var recentHits = _hitTimes.length;

    /* Compute target suppression intensity */
    var targetSup = 0;
    if (recentHits >= MIN_HITS) {
      targetSup = Math.min(1, (recentHits - MIN_HITS + 1) / (HEAVY_HITS - MIN_HITS + 1));
    }
    /* Decay if no recent hits */
    if (now - _lastHitT > 0.1) {
      targetSup = Math.max(0, targetSup - dt / DECAY_TIME);
    }

    /* Smooth */
    _suppressed += (targetSup - _suppressed) * Math.min(1, dt * 5);
    if (_suppressed < 0.01) _suppressed = 0;

    /* Apply effects */
    _drawSmoke(_suppressed);

    if (_overlay) {
      var desat = Math.round(_suppressed * 70);
      _overlay.style.filter = _suppressed > 0.05
        ? 'saturate(' + (100 - desat) + '%) contrast(105%)'
        : '';
    }

    if (_textEl) {
      var heavy = _suppressed >= 0.65;
      _textEl.style.display = heavy ? 'block' : 'none';
      if (heavy) {
        var flashA = 0.5 + 0.25 * Math.sin(now * 4);
        _textEl.style.opacity = flashA.toFixed(2);
      }
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildElements();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.SuppressionEffect = SuppressionEffect;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { SuppressionEffect.init(); });
} else {
  SuppressionEffect.init();
}