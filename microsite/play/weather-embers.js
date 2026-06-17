/* ============================================================
 *  WEATHER-EMBERS.JS — Drifting ember and ash particles (passive)
 *
 *  Continuously spawns faint embers + ash flakes falling from
 *  the top of the screen, drifting sideways with small oscillation.
 *  Creates a post-battle, conflict-zone atmosphere.
 *
 *  Two particle types:
 *    ASH  — small grey flake, falls slowly, oscillates
 *    EMBER — orange-red glow dot, falls faster, fades in/out
 *
 *  EMBER_RATE scales up with kill count (more fire → more embers).
 *  Canvas z-index 305 (above streak-fire 302, below ambient-particles).
 *  MAX_PARTICLES 70. Passive, no keybind.
 * ============================================================ */
var WeatherEmbers = (function () {
  'use strict';

  var MAX_PARTICLES = 70;
  var SPAWN_RATE    = 1.5;   /* base particles per second */
  var EMBER_FRAC    = 0.35;  /* fraction of spawns that are embers */

  var _canvas  = null;
  var _ctx     = null;
  var _init    = false;
  var _lastTs  = 0;
  var _accum   = 0;
  var _particles = [];
  var _sessionKills = 0;
  var _killCheck = 0;

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:305;';
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

  function _spawnParticle() {
    var W = _canvas.width;
    var isEmber = Math.random() < EMBER_FRAC + Math.min(0.3, _sessionKills / 500 * 0.3);
    var life = 5 + Math.random() * 5;
    _particles.push({
      x: Math.random() * (W + 80) - 40,
      y: -10,
      vy: isEmber ? (50 + Math.random() * 70) : (20 + Math.random() * 30),
      vx: (Math.random() - 0.5) * 20,
      osc: Math.random() * Math.PI * 2,
      oscSpeed: 0.8 + Math.random() * 1.2,
      oscAmp: 8 + Math.random() * 20,
      r: isEmber ? (1.2 + Math.random() * 1.8) : (0.8 + Math.random() * 1.5),
      life: life,
      total: life,
      ember: isEmber,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 1.5 + Math.random() * 2.5,
    });
  }

  function _drawParticle(p) {
    var ctx = _ctx;
    var t = p.life / p.total;
    var fadeAlpha = Math.min(t * 4, 1) * Math.min((1 - t) * 4, 1);  /* fade in+out */

    if (p.ember) {
      var glow = (Math.sin(p.phase) * 0.5 + 0.5);
      var alpha = fadeAlpha * (0.5 + glow * 0.4) * 0.7;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = 'rgba(255,120,30,0.9)';
      ctx.shadowBlur  = 6 + glow * 6;
      ctx.fillStyle   = 'rgba(255,' + Math.round(80 + glow * 60) + ',20,1)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.8 + glow * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      var alpha2 = fadeAlpha * 0.25;
      ctx.save();
      ctx.globalAlpha = alpha2;
      ctx.fillStyle = 'rgba(190,190,185,1)';
      ctx.fillRect(p.x - p.r, p.y - p.r * 0.4, p.r * 2, p.r * 0.8);
      ctx.restore();
    }
  }

  var _prevHp = new WeakMap();
  var _counted = new WeakSet();
  var _frameN = 0;

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Kill count for ember intensity */
    if (_frameN % 30 === 0) {
      try {
        var stored = parseInt(sessionStorage.getItem('ok_session_kills') || '0', 10);
        if (!isNaN(stored)) _sessionKills = stored;
      } catch (e) {}
    }

    /* Spawn */
    if (!_ctx) return;
    var rate = SPAWN_RATE * (1 + _sessionKills / 100);
    _accum += dt * rate;
    while (_accum >= 1 && _particles.length < MAX_PARTICLES) {
      _spawnParticle();
      _accum -= 1;
    }
    if (_accum > 2) _accum = 0;

    /* Update + draw */
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    var H = _canvas.height;
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.life -= dt;
      if (p.life <= 0 || p.y > H + 20) { _particles.splice(i, 1); continue; }
      p.phase += p.phaseSpeed * dt;
      p.osc += p.oscSpeed * dt;
      p.x += (p.vx + Math.sin(p.osc) * p.oscAmp) * dt;
      p.y += p.vy * dt;
      _drawParticle(p);
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

window.WeatherEmbers = WeatherEmbers;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { WeatherEmbers.init(); });
} else {
  WeatherEmbers.init();
}