/* ============================================================
 *  BLOOD-SPLATTER.JS — COD-style screen-edge splatter on damage (passive)
 *
 *  Each time the player takes damage, 1–3 blood splatter shapes
 *  appear at a random screen edge and fade over FADE_TIME=2.0s.
 *
 *  Splatters are irregular radial shapes (bezier blob) in deep red.
 *  Damage ≥ 30 spawns an extra splatter at screen center.
 *  Max 8 simultaneous active splatters.
 *
 *  Canvas z-index 395 (above suppression 394, below blood/cinematic).
 * ============================================================ */
var BloodSplatter = (function () {
  'use strict';

  var MAX_SPLATTERS = 8;
  var FADE_TIME     = 2.0;
  var HEAVY_DMG     = 30;

  var _canvas   = null;
  var _ctx      = null;
  var _init     = false;
  var _lastTs   = 0;
  var _splatters = [];
  var _prevPHp  = null;
  var _frameN   = 0;

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:395;';
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

  function _randEdgePos() {
    var W = _canvas.width;
    var H = _canvas.height;
    var edge = Math.floor(Math.random() * 4);  /* 0=top 1=right 2=bottom 3=left */
    switch (edge) {
      case 0: return { x: Math.random() * W, y: 0, };
      case 1: return { x: W, y: Math.random() * H };
      case 2: return { x: Math.random() * W, y: H };
      default: return { x: 0, y: Math.random() * H };
    }
  }

  function _spawnSplat(x, y, size) {
    if (_splatters.length >= MAX_SPLATTERS) _splatters.shift();
    var pts = [];
    var nPts = 7 + Math.floor(Math.random() * 4);
    for (var i = 0; i < nPts; i++) {
      var a = (i / nPts) * Math.PI * 2;
      var r = size * (0.5 + Math.random() * 0.6);
      pts.push({ a: a, r: r });
    }
    _splatters.push({ x: x, y: y, pts: pts, life: FADE_TIME, total: FADE_TIME });
  }

  function _drawSplat(s) {
    var t = s.life / s.total;
    var alpha = Math.min(1, t * 3) * 0.55;
    var ctx = _ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(140,0,0,1)';
    ctx.beginPath();
    var p0 = s.pts[0];
    ctx.moveTo(s.x + Math.cos(p0.a) * p0.r, s.y + Math.sin(p0.a) * p0.r);
    for (var i = 1; i < s.pts.length; i++) {
      var p = s.pts[i];
      var pp = s.pts[i - 1];
      var mx = s.x + Math.cos((pp.a + p.a) / 2) * (pp.r + p.r) * 0.55;
      var my = s.y + Math.sin((pp.a + p.a) / 2) * (pp.r + p.r) * 0.55;
      ctx.quadraticCurveTo(mx, my, s.x + Math.cos(p.a) * p.r, s.y + Math.sin(p.a) * p.r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Damage detection */
    if (_frameN % 2 === 0) {
      try {
        if (window.player && window.player.hp !== undefined) {
          var php = window.player.hp;
          if (_prevPHp !== null && _prevPHp > php && php > 0) {
            var dmg = _prevPHp - php;
            var count = dmg >= HEAVY_DMG ? 3 : (dmg >= 15 ? 2 : 1);
            for (var k = 0; k < count; k++) {
              var ep = _randEdgePos();
              var sz = 40 + dmg * 1.2 + Math.random() * 30;
              _spawnSplat(ep.x, ep.y, sz);
            }
            if (dmg >= HEAVY_DMG) {
              _spawnSplat(_canvas.width / 2 + (Math.random() - 0.5) * 80,
                         _canvas.height / 2 + (Math.random() - 0.5) * 60,
                         55 + Math.random() * 25);
            }
          }
          _prevPHp = php;
        }
      } catch (e) {}
    }

    /* Render */
    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    for (var j = _splatters.length - 1; j >= 0; j--) {
      _splatters[j].life -= dt;
      if (_splatters[j].life <= 0) { _splatters.splice(j, 1); continue; }
      _drawSplat(_splatters[j]);
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

window.BloodSplatter = BloodSplatter;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { BloodSplatter.init(); });
} else {
  BloodSplatter.init();
}