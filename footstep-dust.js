/* ============================================================
 *  FOOTSTEP-DUST.JS — Player movement dust particles (passive)
 *
 *  Detects player movement via player.position delta each frame.
 *  When moving at > 0.15 u/frame: spawn dust puffs that alternate
 *  left/right at bottom-center of screen, simulating footfall.
 *  Puff timing tracks a step accumulator so puffs occur ~4 per sec
 *  regardless of frame rate.
 *  Particles: small circles drifting outward + upward, fade 0.4s.
 * ============================================================ */
var FootstepDust = (function () {
  'use strict';

  var STEP_INTERVAL = 0.24;  /* seconds between puff bursts */
  var PUFFS_PER_STEP = 5;   /* particles per puff */
  var MOVE_THRESH   = 0.04;  /* min move dist (units) per frame to count as moving */

  var _canvas   = null;
  var _ctx      = null;
  var _init     = false;
  var _lastTs   = 0;
  var _frameN   = 0;
  var _parts    = [];

  var _prevPx = null, _prevPz = null;
  var _stepAcc = 0;    /* time accumulator for step rhythm */
  var _stepSide = 1;   /* 1 = right foot, -1 = left foot */
  var _moving = false;

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:312;',
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

  function _spawnPuff(side) {
    var W = _canvas ? _canvas.width  : window.innerWidth;
    var H = _canvas ? _canvas.height : window.innerHeight;
    var cx = W / 2 + side * (12 + Math.random() * 20);
    var cy = H - 8;

    for (var i = 0; i < PUFFS_PER_STEP; i++) {
      var ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.2 + side * 0.3;
      var spd = 25 + Math.random() * 45;
      _parts.push({
        x:    cx + (Math.random() - 0.5) * 10,
        y:    cy + (Math.random() - 0.5) * 4,
        vx:   Math.cos(ang) * spd,
        vy:   Math.sin(ang) * spd,
        r:    1.5 + Math.random() * 2.5,
        alpha: 0.25 + Math.random() * 0.2,
        decay: 0.6 + Math.random() * 0.5,
      });
    }
  }

  function _rnd() { return Math.random(); }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Movement detection */
    _moving = false;
    try {
      if (window.player && window.player.position) {
        var px = window.player.position.x;
        var pz = window.player.position.z;
        if (_prevPx !== null) {
          var dx = px - _prevPx;
          var dz = pz - _prevPz;
          var moved = Math.sqrt(dx * dx + dz * dz);
          if (moved > MOVE_THRESH) _moving = true;
        }
        _prevPx = px;
        _prevPz = pz;
      }
    } catch (e) {}

    /* Step accumulator */
    if (_moving) {
      _stepAcc += dt;
      if (_stepAcc >= STEP_INTERVAL) {
        _stepAcc -= STEP_INTERVAL;
        _spawnPuff(_stepSide);
        _stepSide *= -1;
      }
    } else {
      _stepAcc = 0;
    }

    /* Draw */
    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    for (var i = _parts.length - 1; i >= 0; i--) {
      var p = _parts[i];
      p.x     += p.vx * dt;
      p.y     += p.vy * dt;
      p.vy    -= 30 * dt;   /* gravity slow-down */
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) { _parts.splice(i, 1); continue; }

      _ctx.beginPath();
      _ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      _ctx.fillStyle = 'rgba(180, 150, 100, ' + p.alpha.toFixed(3) + ')';
      _ctx.fill();
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

window.FootstepDust = FootstepDust;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { FootstepDust.init(); });
} else {
  FootstepDust.init();
}