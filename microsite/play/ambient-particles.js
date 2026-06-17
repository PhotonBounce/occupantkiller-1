/* ============================================================
 *  AMBIENT-PARTICLES.JS — Stage-themed floating particles (passive)
 *
 *  Reads GameManager.getStageInfo().theme to set particle type:
 *    grassland → golden dust motes (slow drift)
 *    urban      → gray ash/paper bits (slow tumble)
 *    industrial → orange embers (rise + flicker)
 *    coastal    → pale blue mist specks (fast horizontal)
 *    wasteland  → tan sand grains (turbulent drift)
 *    cityscape  → dark ash flakes (slow diagonal fall)
 *
 *  40 particles per theme, drawn on a low-opacity canvas overlay.
 *  Stays very subtle — opacity capped at 0.45 so it reads as
 *  atmosphere, not obstruction. Adapts on stage change.
 * ============================================================ */
var AmbientParticles = (function () {
  'use strict';

  var COUNT    = 40;
  var _canvas  = null;
  var _ctx     = null;
  var _init    = false;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _parts   = [];
  var _theme   = null;
  var _cfg     = null;

  /* Theme configs: { color, minR, maxR, vx, vy, drift, flicker } */
  var THEMES = {
    grassland:  { color:'rgba(210,180,80,',  minR:1.0, maxR:2.2, vx: 0.15, vy:-0.08, drift:0.6,  flicker:false },
    urban:      { color:'rgba(160,155,145,', minR:0.8, maxR:1.8, vx: 0.10, vy:-0.05, drift:0.4,  flicker:false },
    industrial: { color:'rgba(255,140,30,',  minR:0.8, maxR:1.6, vx: 0.05, vy:-0.25, drift:0.3,  flicker:true  },
    coastal:    { color:'rgba(160,210,235,', minR:0.6, maxR:1.4, vx: 0.45, vy: 0.02, drift:0.5,  flicker:false },
    wasteland:  { color:'rgba(200,160,90,',  minR:0.7, maxR:2.0, vx: 0.20, vy: 0.05, drift:1.0,  flicker:false },
    cityscape:  { color:'rgba(90,90,95,',    minR:0.8, maxR:2.0, vx:-0.08, vy: 0.12, drift:0.35, flicker:false },
  };
  var DEFAULT_CFG = THEMES.grassland;

  function _cfgForTheme(t) {
    return THEMES[t] || DEFAULT_CFG;
  }

  function _rnd(min, max) { return min + Math.random() * (max - min); }

  function _spawnParticle(cfg, forceRandom) {
    var W = _canvas ? _canvas.width  : window.innerWidth;
    var H = _canvas ? _canvas.height : window.innerHeight;
    return {
      x:       forceRandom ? _rnd(0, W) : (cfg.vx > 0 ? -10 : W + 10),
      y:       _rnd(0, H),
      r:       _rnd(cfg.minR, cfg.maxR),
      alpha:   _rnd(0.08, 0.40),
      age:     _rnd(0, 20),   /* stagger initial ages */
      life:    _rnd(8, 25),   /* seconds */
      driftPh: _rnd(0, Math.PI * 2),
    };
  }

  function _initParticles(cfg) {
    _parts = [];
    for (var i = 0; i < COUNT; i++) {
      _parts.push(_spawnParticle(cfg, true));   /* spawn spread across screen */
    }
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:310;',   /* behind HUD, behind health bars */
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

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Theme check every 60 frames (~1s) */
    if (_frameN % 60 === 0) {
      try {
        var info = (typeof GameManager !== 'undefined' && GameManager.getStageInfo) ? GameManager.getStageInfo() : null;
        var t = info && info.theme ? info.theme : 'grassland';
        if (t !== _theme) {
          _theme = t;
          _cfg   = _cfgForTheme(t);
          _initParticles(_cfg);
        }
      } catch (e) {}
    }

    if (!_cfg) return;
    if (!_ctx)  return;

    var W = _canvas.width, H = _canvas.height;
    _ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < _parts.length; i++) {
      var p   = _parts[i];
      p.age  += dt;

      /* Drift oscillation */
      var wobbleX = Math.sin(p.age * 0.9 + p.driftPh)          * _cfg.drift * 12 * dt;
      var wobbleY = Math.cos(p.age * 0.7 + p.driftPh + 1.2)    * _cfg.drift * 6  * dt;

      p.x += (_cfg.vx + wobbleX / dt * dt) * dt * 60;
      p.y += (_cfg.vy + wobbleY / dt * dt) * dt * 60;

      /* Flicker for embers */
      var alpha = p.alpha;
      if (_cfg.flicker) alpha *= (0.5 + 0.5 * Math.sin(ts / 80 + i * 1.7));

      /* Recycle if off-screen or expired */
      var expired = p.age > p.life;
      var offEdge = p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20;
      if (expired || offEdge) {
        _parts[i] = _spawnParticle(_cfg, false);
        continue;
      }

      /* Draw */
      _ctx.beginPath();
      _ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      _ctx.fillStyle = _cfg.color + alpha.toFixed(3) + ')';
      _ctx.fill();
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    /* Default theme */
    _theme = 'grassland';
    _cfg   = DEFAULT_CFG;
    _initParticles(_cfg);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.AmbientParticles = AmbientParticles;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { AmbientParticles.init(); });
} else {
  AmbientParticles.init();
}