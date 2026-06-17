/* ============================================================
 *  SHELL-EJECT.JS — Brass casing ejection particles (passive)
 *
 *  Spawns 1-2 tumbling brass ellipses just right of centre-screen
 *  on each shot fired (clip size decrements). They arc outward to
 *  the right, spin, and fade over ~0.45s.
 *
 *  Colors:
 *    Rifle/pistol → gold/brass (rgba 210,170,50)
 *    Shotgun      → red hull   (rgba 180,70,50)
 *    Sniper       → larger, silver-brass (rgba 220,190,100)
 *    Melee/launchers → no casing
 *
 *  Canvas z-index 315 (above ambient-particles 310, well below HUD).
 *  Max 24 casings in-flight at once.
 * ============================================================ */
var ShellEject = (function () {
  'use strict';

  var MAX_CASINGS = 24;
  var LIFE        = 0.45;  /* seconds a casing lives */

  var _canvas   = null;
  var _ctx      = null;
  var _init     = false;
  var _frameN   = 0;
  var _lastTs   = 0;
  var _prevClip = null;
  var _casings  = [];

  /* casing: {x,y,vx,vy,rot,rotV,life,total,w,h,col} */

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:315;',
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

  function _getStyle() {
    var type = '';
    try {
      if (typeof Weapons !== 'undefined' && Weapons.getCurrentType) {
        type = (Weapons.getCurrentType() || '').toUpperCase();
      }
    } catch (e) {}

    if (type.indexOf('MELEE') >= 0 || type.indexOf('KNIFE') >= 0 || type.indexOf('AXE') >= 0)
      return null;
    if (type.indexOf('LAUNCH') >= 0 || type.indexOf('RPG') >= 0)
      return null;
    if (type.indexOf('GRENADE') >= 0)
      return null;
    if (type.indexOf('SHOTGUN') >= 0)
      return { w: 5, h: 9,  col: [180, 70, 50],  count: 2 };
    if (type.indexOf('SNIPER') >= 0)
      return { w: 4, h: 14, col: [220, 190, 100], count: 1 };
    /* default: rifle / pistol */
    return { w: 3, h: 10, col: [210, 170, 50], count: 1 };
  }

  function _spawnCasings(count, style) {
    var CX = _canvas.width  / 2 + 28;   /* eject right of centre */
    var CY = _canvas.height / 2 - 2;    /* roughly gun height */

    for (var i = 0; i < count; i++) {
      if (_casings.length >= MAX_CASINGS) _casings.shift();
      var speed = 70 + Math.random() * 80;
      var angle = -0.4 + (Math.random() - 0.5) * 0.5;  /* mostly rightward+down */
      _casings.push({
        x:    CX + (Math.random() - 0.5) * 8,
        y:    CY + (Math.random() - 0.5) * 6,
        vx:   Math.cos(angle) * speed,
        vy:   Math.sin(angle) * speed - 30,
        rot:  Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 20,
        life: LIFE,
        total: LIFE,
        w: style.w,
        h: style.h,
        col: style.col,
      });
    }
  }

  function _drawCasing(c) {
    var t     = c.life / c.total;        /* 1=fresh → 0=gone */
    var alpha = t * 0.88;
    var r     = c.col;
    var ctx   = _ctx;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.globalAlpha = alpha;

    /* Brass body */
    ctx.fillStyle = 'rgb(' + r[0] + ',' + r[1] + ',' + r[2] + ')';
    ctx.beginPath();
    ctx.ellipse(0, 0, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    /* Highlight edge */
    ctx.strokeStyle = 'rgba(255,240,180,' + (alpha * 0.5).toFixed(2) + ')';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Shot detection (every 2nd frame) */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Weapons !== 'undefined' && Weapons.getState) {
          var st = Weapons.getState();
          if (st && _prevClip !== null && st.clip < _prevClip) {
            var shots = _prevClip - st.clip;
            if (shots >= 1 && shots <= 5) {
              var style = _getStyle();
              if (style) _spawnCasings(style.count, style);
            }
          }
          _prevClip = st ? st.clip : _prevClip;
        }
      } catch (e) {}
    }

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    for (var i = _casings.length - 1; i >= 0; i--) {
      var c = _casings[i];
      c.life -= dt;
      if (c.life <= 0) { _casings.splice(i, 1); continue; }

      /* Physics */
      c.vy  += 180 * dt;   /* gravity */
      c.x   += c.vx * dt;
      c.y   += c.vy * dt;
      c.rot += c.rotV * dt;
      /* Air resistance */
      c.vx *= 1 - dt * 1.5;
      c.rotV *= 1 - dt * 2.0;

      _drawCasing(c);
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

window.ShellEject = ShellEject;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ShellEject.init(); });
} else {
  ShellEject.init();
}