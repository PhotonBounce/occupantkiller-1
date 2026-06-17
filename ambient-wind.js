/* ============================================================
 *  AMBIENT-WIND.JS — Atmospheric wind streaks across the screen (passive)
 *
 *  Thin diagonal lines drift right-and-slightly-down, giving the scene
 *  a sense of weather and open-air environment.
 *
 *  Wind gusts every 8–18s, each lasting 3–6s, with smooth ramp in/out.
 *  Streak count and speed scale with gust intensity.
 *
 *  During high-intensity moments (low HP, active kill streak) the wind
 *  speeds up slightly — subconscious urgency cue.
 *
 *  Canvas z-index 300 (behind everything else, purely atmospheric).
 *  MAX_STREAKS 40. No keybind.
 * ============================================================ */
var AmbientWind = (function () {
  'use strict';

  var MAX_STREAKS = 40;
  var BASE_VX     = 220;  /* px/s base speed */
  var ANGLE_DEG   = 12;   /* streak angle below horizontal */
  var GUST_INT_LO = 8;    /* seconds between gusts low */
  var GUST_INT_HI = 18;   /* seconds between gusts high */
  var GUST_DUR_LO = 3;
  var GUST_DUR_HI = 6;

  var _canvas   = null;
  var _ctx      = null;
  var _init     = false;
  var _lastTs   = 0;
  var _now      = 0;

  var _streaks  = [];
  var _intensity = 0;     /* 0-1 smoothed */
  var _gustTarget = 0;    /* 0-1 gust target */
  var _nextGust = 4;      /* seconds until next gust (from _now) */
  var _gustEnd  = 0;

  var _ang = ANGLE_DEG * Math.PI / 180;

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:300;';
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

  function _spawnStreak(intensity) {
    var W = _canvas.width;
    var H = _canvas.height;
    var speed = BASE_VX * (0.7 + intensity * 0.6) * (0.8 + Math.random() * 0.4);
    var len   = 40 + Math.random() * 80 + intensity * 60;
    var alpha = (0.04 + Math.random() * 0.06) * intensity;
    _streaks.push({
      x: -len + Math.random() * (W + len * 2),  /* spread entry */
      y: Math.random() * (H + 60) - 30,
      vx: speed,
      vy: speed * Math.tan(_ang),
      len: len,
      alpha: alpha,
      life: (W + len) / speed + 0.5,            /* time to cross screen */
    });
  }

  function _drawStreak(s) {
    var ctx = _ctx;
    var ex = s.x - Math.cos(_ang) * s.len;
    var ey = s.y - Math.sin(_ang) * s.len;
    var grad = ctx.createLinearGradient(ex, ey, s.x, s.y);
    grad.addColorStop(0,   'rgba(200,215,230,0)');
    grad.addColorStop(0.4, 'rgba(200,215,230,' + s.alpha.toFixed(3) + ')');
    grad.addColorStop(1,   'rgba(200,215,230,0)');
    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 0.7 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _now += dt;

    /* Urgency mod: faster wind during low HP or kill streak */
    var urgency = 0;
    try {
      if (window.player && window.player.hp !== undefined) {
        var hf = window.player.hp / (window.player.maxHp || 100);
        if (hf < 0.3) urgency = Math.max(urgency, 1 - hf / 0.3);
      }
    } catch (e) {}

    /* Gust scheduling */
    if (_now >= _nextGust && _gustTarget === 0) {
      _gustTarget = 0.3 + Math.random() * 0.7;
      _gustEnd    = _now + GUST_DUR_LO + Math.random() * (GUST_DUR_HI - GUST_DUR_LO);
    }
    if (_now >= _gustEnd && _gustTarget > 0) {
      _gustTarget = 0;
      _nextGust   = _now + GUST_INT_LO + Math.random() * (GUST_INT_HI - GUST_INT_LO);
    }

    var targetInt = Math.min(1, _gustTarget + urgency * 0.35);
    var smoothK = targetInt > _intensity ? dt * 1.5 : dt * 0.6;
    _intensity += (targetInt - _intensity) * Math.min(1, smoothK);
    if (_intensity < 0.005) _intensity = 0;

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    if (_intensity < 0.01) return;

    /* Spawn rate scales with intensity */
    var wantCount = Math.round(_intensity * MAX_STREAKS);
    var spawnThisFrame = Math.max(0, wantCount - _streaks.length);
    if (spawnThisFrame > 3) spawnThisFrame = 3;
    for (var s = 0; s < spawnThisFrame; s++) _spawnStreak(_intensity);

    /* Update + draw */
    for (var j = _streaks.length - 1; j >= 0; j--) {
      var st = _streaks[j];
      st.life -= dt;
      if (st.life <= 0) { _streaks.splice(j, 1); continue; }
      st.x += st.vx * dt;
      st.y += st.vy * dt;
      _drawStreak(st);
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

window.AmbientWind = AmbientWind;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { AmbientWind.init(); });
} else {
  AmbientWind.init();
}