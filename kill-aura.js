/* ============================================================
 *  KILL-AURA.JS — golden radial halo burst on kill (passive)
 *
 *  On each enemy kill, 18 thin golden rays burst outward from
 *  screen centre and fade in 0.28s — a subtle "soul leaving" halo
 *  that reinforces the kill without obscuring gameplay.
 *
 *  High-value kills (SNIPER/WAGNER/SPETSNAZ/MECH/TANK) fire 30 rays
 *  in white-gold and scale slightly larger.
 *
 *  Uses canvas. z-index 301 (below all HUD, above background).
 *  Max 3 active auras stacked. Passive — no keybind.
 * ============================================================ */
var KillAura = (function () {
  'use strict';

  var RAY_NORM   = 18;
  var RAY_ELITE  = 30;
  var RAY_LEN_N  = 90;    /* px */
  var RAY_LEN_E  = 140;   /* px */
  var LIFE       = 0.28;  /* seconds */
  var MAX_AURAS  = 3;

  var ELITE_TYPES = { SNIPER:1, WAGNER:1, SPETSNAZ:1, MECH:1, TANK:1 };

  var _canvas  = null;
  var _ctx     = null;
  var _init    = false;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _prevHp  = new WeakMap();
  var _counted = new WeakSet();
  var _auras   = [];   /* {life, total, rays, elite} */

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:301;';
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

  function _spawn(isElite) {
    if (_auras.length >= MAX_AURAS) _auras.shift();
    var n   = isElite ? RAY_ELITE : RAY_NORM;
    var len = isElite ? RAY_LEN_E : RAY_LEN_N;
    var rays = [];
    for (var i = 0; i < n; i++) {
      var angle = (i / n) * Math.PI * 2 + Math.random() * 0.15;
      rays.push({ angle: angle, len: len * (0.7 + Math.random() * 0.5) });
    }
    _auras.push({ life: LIFE, total: LIFE, rays: rays, elite: isElite });
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Kill detection every 2nd frame */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh) continue;
            var cur  = e.hp !== undefined ? e.hp : null;
            if (cur === null) continue;
            var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
            if (cur <= 0 && prev > 0 && !_counted.has(e)) {
              _counted.add(e);
              _spawn(!!(ELITE_TYPES[(e.type || '').toUpperCase()]));
            }
            _prevHp.set(e, cur);
          }
        }
      } catch (er) {}
    }

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    var cx = _canvas.width / 2;
    var cy = _canvas.height / 2;

    for (var j = _auras.length - 1; j >= 0; j--) {
      var a = _auras[j];
      a.life -= dt;
      if (a.life <= 0) { _auras.splice(j, 1); continue; }

      var t     = 1 - a.life / a.total;   /* 0→1 */
      var alpha = Math.pow(1 - t, 1.5) * 0.55;
      var inner = 20 + t * 40;

      _ctx.save();
      for (var k = 0; k < a.rays.length; k++) {
        var ray = a.rays[k];
        var r2  = inner + a.rays[k].len * t;
        var r1  = inner + a.rays[k].len * t * 0.3;
        var sx  = cx + Math.cos(ray.angle) * r1;
        var sy  = cy + Math.sin(ray.angle) * r1;
        var ex  = cx + Math.cos(ray.angle) * r2;
        var ey  = cy + Math.sin(ray.angle) * r2;

        var col = a.elite
          ? 'rgba(255,240,160,' + alpha.toFixed(2) + ')'
          : 'rgba(255,210,80,' + alpha.toFixed(2) + ')';

        _ctx.strokeStyle = col;
        _ctx.lineWidth   = a.elite ? 1.2 : 0.9;
        _ctx.shadowColor = a.elite ? 'rgba(255,220,50,0.6)' : 'rgba(220,160,0,0.5)';
        _ctx.shadowBlur  = 6;
        _ctx.beginPath();
        _ctx.moveTo(sx, sy);
        _ctx.lineTo(ex, ey);
        _ctx.stroke();
      }
      _ctx.restore();
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

window.KillAura = KillAura;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { KillAura.init(); });
} else {
  KillAura.init();
}
