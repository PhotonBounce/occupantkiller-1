/* ============================================================
 *  COMBO-BURST.JS — Radial burst + flash on combo thresholds (passive)
 *
 *  Reads combo count from #cc-label DOM element.
 *  On hitting a new combo threshold, fires:
 *    3×  — small cyan burst (16 rays)
 *    5×  — medium gold burst (24 rays) + brief screen flash
 *    10× — large white burst (36 rays) + stronger flash + scale pop
 *    20× — godlike burst: 48 rays, rainbow, sustained glow
 *
 *  Rays expand outward from screen center, fade in BURST_LIFE=0.4s.
 *  Screen flash: brief white overlay at low alpha.
 *  Resets tracking on combo reset (label goes blank or ×0/1).
 *
 *  Canvas for rays z-index 399. Flash div z-index 399.
 *  Passive — no keybind.
 * ============================================================ */
var ComboBurst = (function () {
  'use strict';

  var BURST_LIFE = 0.40;
  var FLASH_LIFE = 0.18;
  var RAY_SPEED  = 320;  /* px/s */

  var THRESHOLDS = [
    { n: 3,  rays: 16, col: [80, 220, 255],  flash: 0.06, scale: false },
    { n: 5,  rays: 24, col: [255, 210, 50],  flash: 0.10, scale: false },
    { n: 10, rays: 36, col: [240, 240, 240], flash: 0.16, scale: true  },
    { n: 20, rays: 48, col: null,            flash: 0.22, scale: true  },  /* null = rainbow */
  ];

  var _canvas   = null;
  var _ctx      = null;
  var _flashEl  = null;
  var _init     = false;
  var _lastTs   = 0;
  var _frameN   = 0;

  var _prevCombo = 0;
  var _lastThresh = 0;
  var _bursts   = [];    /* {rays[], life, total} */
  var _flash    = 0;     /* remaining flash seconds */
  var _flashAlpha = 0;

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:399;';
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize);
  }

  function _buildFlash() {
    _flashEl = document.createElement('div');
    _flashEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:398;',
      'background:white;opacity:0;',
      'transition:none;',
    ].join('');
    document.body.appendChild(_flashEl);
  }

  function _resize() {
    if (!_canvas) return;
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  function _hueColor(h) {
    var r = Math.round(Math.sin(h) * 127 + 128);
    var g = Math.round(Math.sin(h + 2.094) * 127 + 128);
    var b = Math.round(Math.sin(h + 4.188) * 127 + 128);
    return [r, g, b];
  }

  function _fireBurst(def) {
    var cx = _canvas.width / 2;
    var cy = _canvas.height / 2;
    var rays = [];
    for (var i = 0; i < def.rays; i++) {
      var a = (i / def.rays) * Math.PI * 2;
      var col = def.col ? def.col : _hueColor(a);
      rays.push({ angle: a, col: col });
    }
    _bursts.push({ rays: rays, life: BURST_LIFE, total: BURST_LIFE, cx: cx, cy: cy });
    _flash = FLASH_LIFE;
    _flashAlpha = def.flash;
  }

  function _drawBurst(b) {
    var ctx = _ctx;
    var t   = b.life / b.total;  /* 1→0 */
    var dist = (1 - t) * RAY_SPEED * b.total;
    var len  = 30 + (1 - t) * 60;
    var alpha = t * 0.7;

    ctx.save();
    ctx.lineWidth = 1.5;
    for (var i = 0; i < b.rays.length; i++) {
      var r = b.rays[i];
      var sx = b.cx + Math.cos(r.angle) * dist;
      var sy = b.cy + Math.sin(r.angle) * dist;
      var ex = b.cx + Math.cos(r.angle) * (dist + len);
      var ey = b.cy + Math.sin(r.angle) * (dist + len);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(' + r.col[0] + ',' + r.col[1] + ',' + r.col[2] + ',1)';
      ctx.shadowColor  = 'rgba(' + r.col[0] + ',' + r.col[1] + ',' + r.col[2] + ',0.8)';
      ctx.shadowBlur   = 8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  }

  function _getCombo() {
    try {
      var lbl = document.getElementById('cc-label');
      if (lbl) {
        var n = parseInt((lbl.textContent || '').replace('×', '').replace('x', ''), 10);
        if (!isNaN(n) && n >= 2) return n;
      }
    } catch (e) {}
    return 0;
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Check combo every 3rd frame */
    if (_frameN % 3 === 0) {
      var combo = _getCombo();
      if (combo < _prevCombo - 1) _lastThresh = 0;  /* combo reset */
      if (combo > _prevCombo) {
        for (var k = THRESHOLDS.length - 1; k >= 0; k--) {
          var th = THRESHOLDS[k];
          if (combo >= th.n && _lastThresh < th.n) {
            _lastThresh = th.n;
            if (_canvas) _fireBurst(th);
            break;
          }
        }
      }
      _prevCombo = combo;
    }

    /* Render */
    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    for (var j = _bursts.length - 1; j >= 0; j--) {
      _bursts[j].life -= dt;
      if (_bursts[j].life <= 0) { _bursts.splice(j, 1); continue; }
      _drawBurst(_bursts[j]);
    }

    /* Flash */
    if (_flash > 0) {
      _flash -= dt;
      var flashT = Math.max(0, _flash / FLASH_LIFE);
      if (_flashEl) _flashEl.style.opacity = (_flashAlpha * flashT).toFixed(3);
    } else {
      if (_flashEl) _flashEl.style.opacity = '0';
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    _buildFlash();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ComboBurst = ComboBurst;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ComboBurst.init(); });
} else {
  ComboBurst.init();
}