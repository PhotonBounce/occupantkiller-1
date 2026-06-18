/* ============================================================
 *  EXPLOSION-RING.JS — Expanding concentric blast rings (passive)
 *
 *  Intercepts Tracers.spawnExplosion (if available).
 *  For each explosion: projects world-space position to screen,
 *  spawns 2-3 concentric expanding translucent rings that fade
 *  outward over 0.5s. Fallback: triggers on large player HP drops.
 *
 *  Close explosions (near screen center) also flash a brief white
 *  border-flash simulating shockwave. Max 12 rings in flight.
 *  Canvas z-index 390.
 * ============================================================ */
var ExplosionRing = (function () {
  'use strict';

  var MAX_RINGS   = 16;
  var RING_LIFE   = 0.55;    /* seconds */
  var RING_SPEED  = 220;     /* px/s expansion rate */
  var FLASH_R     = 200;     /* px from center to trigger border flash */

  var _canvas   = null;
  var _ctx      = null;
  var _init     = false;
  var _frameN   = 0;
  var _lastTs   = 0;
  var _rings    = [];   /* [{x,y,r,maxR,life,total,col}] */
  var _cam      = null;

  /* HP monitoring for fallback */
  var _prevPlayerHp = null;

  function _getCamera() {
    if (!_cam) {
      try {
        _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera)
          ? GameManager.getCamera() : null;
      } catch (e) {}
    }
    return _cam;
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:390;',
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

  function _projectWorld(wx, wy, wz) {
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') {
      /* fallback: screen centre */
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    try {
      var v = new THREE.Vector3(wx, wy, wz);
      v.project(cam);
      if (v.z > 1) return null;   /* behind camera */
      return {
        x: (v.x * 0.5 + 0.5) * window.innerWidth,
        y: (-v.y * 0.5 + 0.5) * window.innerHeight,
      };
    } catch (e) { return null; }
  }

  function _spawnRings(sx, sy, size) {
    /* 2 rings per explosion, slightly staggered */
    var W = _canvas ? _canvas.width : window.innerWidth;
    var H = _canvas ? _canvas.height : window.innerHeight;
    var cx = W / 2; var cy = H / 2;
    var distCenter = Math.sqrt((sx - cx) * (sx - cx) + (sy - cy) * (sy - cy));
    var isClose = distCenter < FLASH_R;

    var colours = [
      'rgba(255,140,60,',    /* orange blast */
      'rgba(255,230,150,',   /* yellow afterglow */
    ];

    for (var i = 0; i < 2; i++) {
      if (_rings.length >= MAX_RINGS) _rings.shift();
      var delay = i * 0.06;   /* second ring starts 60ms later */
      _rings.push({
        x: sx, y: sy,
        r: 4 + size * 2,
        maxR: 80 + size * 30,
        life: RING_LIFE - delay,
        total: RING_LIFE - delay,
        col: colours[i % colours.length],
        delay: delay,
        active: delay <= 0,
      });
    }

    /* Border flash for close explosions */
    if (isClose && _ctx) {
      _borderFlash();
    }
  }

  function _borderFlash() {
    if (!_canvas) return;
    var ctx = _ctx;
    var W = _canvas.width; var H = _canvas.height;
    ctx.save();
    var grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.8);
    grad.addColorStop(0,   'rgba(255,200,80,0)');
    grad.addColorStop(0.7, 'rgba(255,200,80,0)');
    grad.addColorStop(1,   'rgba(255,180,40,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function _drawRing(ring) {
    var t     = ring.life / ring.total;   /* 1=fresh → 0=done */
    var alpha = t * 0.8;
    var ctx   = _ctx;

    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.strokeStyle = ring.col + alpha.toFixed(2) + ')';
    ctx.lineWidth   = Math.max(0.5, t * 4);
    ctx.stroke();
  }

  function _onExplosion(wx, wy, wz, size) {
    /* Called by the interceptor */
    var sc = _projectWorld(wx, wy, wz);
    if (sc) _spawnRings(sc.x, sc.y, size || 1);
  }

  function _hookTracers() {
    try {
      if (typeof Tracers === 'undefined' || !Tracers.spawnExplosion) return;
      if (Tracers._explosionRingHooked) return;
      var _orig = Tracers.spawnExplosion.bind(Tracers);
      // Real signature is spawnExplosion(posVector3, radius) — not (x,y,z,size).
      Tracers.spawnExplosion = function (pos, radius) {
        _orig(pos, radius);
        try {
          var x, y, z, size;
          if (pos && typeof pos === 'object') { x = pos.x; y = pos.y; z = pos.z; size = radius; }
          else { x = pos; y = radius; z = arguments[2]; size = arguments[3]; }
          _onExplosion(x, y, z, size);
        } catch (e) {}
      };
      Tracers._explosionRingHooked = true;
    } catch (e) {}
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Hook ASAP — retry every frame until Tracers is ready (self-guards once hooked) */
    if (typeof Tracers === 'undefined' || !Tracers._explosionRingHooked) _hookTracers();

    /* Fallback: large HP drop on player → trigger rings at screen center */
    try {
      if (window.player && window.player.hp !== undefined) {
        var hp = window.player.hp;
        if (_prevPlayerHp !== null && _prevPlayerHp - hp >= 18) {
          /* Large hit — assume explosion near player */
          _spawnRings(_canvas.width / 2, _canvas.height / 2, 1.5);
        }
        _prevPlayerHp = hp;
      }
    } catch (e) {}

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    for (var i = _rings.length - 1; i >= 0; i--) {
      var ring = _rings[i];
      ring.life -= dt;
      if (ring.life <= 0) { _rings.splice(i, 1); continue; }
      ring.r += RING_SPEED * dt;
      if (ring.r > ring.maxR) { _rings.splice(i, 1); continue; }
      _drawRing(ring);
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    _hookTracers();
    requestAnimationFrame(_tick);
  }

  return { init: init, onExplosion: _onExplosion };
})();

window.ExplosionRing = ExplosionRing;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ExplosionRing.init(); });
} else {
  ExplosionRing.init();
}