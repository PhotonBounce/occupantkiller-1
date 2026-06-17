/* ============================================================
 *  STREAK-FIRE.JS — Kill streak fire effect on screen edges (passive)
 *
 *  When the player is on a kill streak ≥ 5, animated fire particles
 *  rise up the left and right edges of the screen.
 *
 *  Intensity scales with streak:
 *    ≥ 5  RAMPAGE    — moderate fire, orange
 *    ≥ 7  UNSTOPPABL — intense fire, deep orange + red
 *    ≥ 10 GODLIKE    — raging fire, white-hot cores
 *
 *  Fire extinguishes 2.5s after the streak resets (player death
 *  or 3+ seconds without a kill).
 *
 *  Canvas z-index 302 (below ambient-particles 310, behind HUD).
 *  Particle count limited to MAX_PARTICLES to keep 60fps.
 * ============================================================ */
var StreakFire = (function () {
  'use strict';

  var KILL_WINDOW   = 3.0;   /* seconds: kills within this window count to streak */
  var DECAY_SECS    = 2.5;   /* seconds for fire to fade after streak drops */
  var MAX_PARTICLES = 60;

  var _canvas     = null;
  var _ctx        = null;
  var _init       = false;
  var _frameN     = 0;
  var _lastTs     = 0;
  var _particles  = [];

  /* Streak tracking */
  var _killTimes  = [];
  var _prevHp     = new WeakMap();
  var _counted    = new WeakSet();
  var _streak     = 0;
  var _streakInt  = 0;   /* 0=off, 1=rampage, 2=unstoppable, 3=godlike */
  var _lastKillT  = -999;
  var _fireTarget = 0;   /* target intensity 0-1 */
  var _fireActual = 0;   /* smoothed intensity */

  /* Particle: {x,y,vx,vy,life,total,r,hue} */

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:302;',
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

  function _spawnParticle(side, intensityTier) {
    var W = _canvas.width;
    var H = _canvas.height;

    /* side: 'L' or 'R' */
    var spread = 60 + intensityTier * 30;
    var x = side === 'L'
      ? Math.random() * spread
      : W - Math.random() * spread;
    var y = H * (0.6 + Math.random() * 0.4);  /* bottom 40% */

    var speed = 60 + Math.random() * 80 + intensityTier * 40;
    var life  = 1.0 + Math.random() * 0.8;

    /* Color: rampage=orange, unstoppable=red-orange, godlike=white-hot */
    var hue = intensityTier >= 2 ? (30 - intensityTier * 10) : 28;
    hue = Math.max(0, hue);

    _particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 30,
      vy: -speed,
      life: life, total: life,
      r: 6 + Math.random() * 8 + intensityTier * 4,
      hue: hue,
      tier: intensityTier,
    });
  }

  function _drawParticle(p) {
    var t     = p.life / p.total;          /* 1=fresh */
    var alpha = Math.min(1, t * 2) * 0.70;
    var r     = p.r * (0.4 + t * 0.6);

    var ctx = _ctx;
    ctx.save();
    ctx.globalAlpha = alpha * _fireActual;
    ctx.globalCompositeOperation = 'lighter';

    var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    if (p.tier >= 3) {
      /* godlike — white-hot core */
      grad.addColorStop(0,   'rgba(255,255,220,1)');
      grad.addColorStop(0.3, 'rgba(255,180,50,0.9)');
      grad.addColorStop(1,   'rgba(255,30,0,0)');
    } else if (p.tier >= 2) {
      grad.addColorStop(0,   'rgba(255,150,40,1)');
      grad.addColorStop(0.4, 'rgba(255,50,0,0.7)');
      grad.addColorStop(1,   'rgba(120,0,0,0)');
    } else {
      /* rampage — orange */
      grad.addColorStop(0,   'rgba(255,200,50,1)');
      grad.addColorStop(0.3, 'rgba(255,100,0,0.6)');
      grad.addColorStop(1,   'rgba(180,30,0,0)');
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Kill detection */
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
              _killTimes.push(now);
              _lastKillT = now;
            }
            _prevHp.set(e, cur);
          }
        }
      } catch (er) {}
    }

    /* Prune kill window */
    _killTimes = _killTimes.filter(function (t) { return now - t <= KILL_WINDOW; });
    _streak = _killTimes.length;

    /* Reset on player death */
    try {
      if (window.player && window.player.hp !== undefined && window.player.hp <= 0) {
        _streak = 0;
        _killTimes = [];
      }
    } catch (e) {}

    /* Fire intensity */
    var tier = 0;
    if (_streak >= 10)     tier = 3;
    else if (_streak >= 7) tier = 2;
    else if (_streak >= 5) tier = 1;

    _streakInt  = tier;
    _fireTarget = tier > 0 ? (0.5 + tier * 0.17) : 0;

    /* Decay if streak dead */
    if (now - _lastKillT > KILL_WINDOW && tier === 0) {
      _fireTarget = 0;
    }

    /* Smooth */
    var smoothK = _fireTarget > _fireActual ? dt * 4 : dt / DECAY_SECS;
    _fireActual += (_fireTarget - _fireActual) * Math.min(1, smoothK * 5);
    if (_fireActual < 0.005) _fireActual = 0;

    /* Spawn new particles */
    if (_fireActual > 0.05 && _particles.length < MAX_PARTICLES) {
      var spawnRate = Math.round(2 + _streakInt * 3);
      for (var s = 0; s < spawnRate; s++) {
        if (_particles.length < MAX_PARTICLES) {
          _spawnParticle('L', _streakInt);
          if (_particles.length < MAX_PARTICLES)
            _spawnParticle('R', _streakInt);
        }
      }
    }

    /* Render */
    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    if (_fireActual > 0.01) {
      for (var j = _particles.length - 1; j >= 0; j--) {
        var p = _particles[j];
        p.life -= dt;
        if (p.life <= 0) { _particles.splice(j, 1); continue; }
        p.x  += p.vx * dt;
        p.y  += p.vy * dt;
        p.vy -= 20 * dt;   /* slight upward acceleration */
        p.vx += (Math.random() - 0.5) * 15 * dt;
        _drawParticle(p);
      }
    } else {
      _particles = [];   /* clear when fire off */
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

window.StreakFire = StreakFire;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { StreakFire.init(); });
} else {
  StreakFire.init();
}