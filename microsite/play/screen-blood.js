/* ============================================================
 *  SCREEN-BLOOD.JS — Blood splatter VFX when player takes damage (passive)
 *
 *  Watches window.player.hp each frame. On HP drop: spawn 3–6 red
 *  ink-blob splats at random edge positions on a fullscreen canvas
 *  overlay. Each blob: irregular circle (hand-wobbled path) with a
 *  dark red centre and a softer glow, fades alpha over 0.8–1.4s.
 *  Heavier hit = more/larger blobs.
 *  Canvas sits above game canvas but below HUD elements.
 * ============================================================ */
var ScreenBlood = (function () {
  'use strict';

  var _canvas  = null;
  var _ctx     = null;
  var _blobs   = [];     /* { x, y, r, alpha, decay } */
  var _prevHp  = null;
  var _init    = false;
  var _lastTs  = 0;
  var _raf     = 0;

  /* Throttle — don't stack blobs faster than this */
  var _lastHitT = 0;
  var HIT_COOLDOWN = 0.12;   /* seconds */

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:395;',
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

  /* Irregular blob path — wobbled circle */
  function _blobPath(ctx, cx, cy, r) {
    var pts = 14;
    ctx.beginPath();
    for (var i = 0; i <= pts; i++) {
      var ang = (i / pts) * Math.PI * 2;
      var wobble = r * (0.7 + Math.random() * 0.55);
      var x = cx + Math.cos(ang) * wobble;
      var y = cy + Math.sin(ang) * wobble;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function _spawnBlobs(damage) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    /* More blobs for heavier hits */
    var count = Math.min(6, Math.max(3, Math.floor(damage / 15)));

    for (var i = 0; i < count; i++) {
      /* Place on screen edges/corners with some inward spread */
      var edge  = Math.floor(Math.random() * 4);
      var pad   = Math.random() * 0.25 + 0.02;
      var cx, cy;
      switch (edge) {
        case 0: cx = Math.random() * w;       cy = h * pad;           break; /* top */
        case 1: cx = w - w * pad;             cy = Math.random() * h; break; /* right */
        case 2: cx = Math.random() * w;       cy = h - h * pad;       break; /* bottom */
        default:cx = w * pad;                 cy = Math.random() * h; break; /* left */
      }
      var radius = (damage * 0.9 + 15) * (0.5 + Math.random() * 1.2);
      _blobs.push({
        x:     cx,
        y:     cy,
        r:     radius,
        alpha: 0.7 + Math.random() * 0.25,
        decay: 0.6 + Math.random() * 0.9,   /* alpha units per second */
      });
    }
  }

  function _drawBlob(ctx, b) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, b.alpha);

    /* Outer glow */
    var grad = ctx.createRadialGradient(b.x, b.y, b.r * 0.1, b.x, b.y, b.r * 1.3);
    grad.addColorStop(0,   'rgba(180, 0, 0, 0.9)');
    grad.addColorStop(0.5, 'rgba(120, 0, 0, 0.55)');
    grad.addColorStop(1,   'rgba(80,  0, 0, 0)');
    _blobPath(ctx, b.x, b.y, b.r * 1.3);
    ctx.fillStyle = grad;
    ctx.fill();

    /* Core blob */
    _blobPath(ctx, b.x, b.y, b.r);
    ctx.fillStyle = 'rgba(160, 0, 0, 0.85)';
    ctx.fill();

    /* Dark centre spot */
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80, 0, 0, 0.9)';
    ctx.fill();

    ctx.restore();
  }

  function _tick(ts) {
    _raf = requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* HP watch */
    try {
      if (window.player && window.player.hp !== undefined) {
        var cur = window.player.hp;
        if (_prevHp !== null) {
          var drop = _prevHp - cur;
          var now  = ts / 1000;
          if (drop >= 3 && now - _lastHitT > HIT_COOLDOWN) {
            _lastHitT = now;
            _spawnBlobs(drop);
          }
        }
        _prevHp = cur;
      }
    } catch (e) {}

    /* Decay + draw */
    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    for (var i = _blobs.length - 1; i >= 0; i--) {
      var b = _blobs[i];
      b.alpha -= b.decay * dt;
      if (b.alpha <= 0) { _blobs.splice(i, 1); continue; }
      _drawBlob(_ctx, b);
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

window.ScreenBlood = ScreenBlood;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ScreenBlood.init(); });
} else {
  ScreenBlood.init();
}