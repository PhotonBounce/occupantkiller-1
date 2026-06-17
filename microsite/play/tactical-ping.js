/* ============================================================
 *  TACTICAL-PING.JS — sonar sweep enemy reveal (passive)
 *
 *  Every PING_INTERVAL seconds, fires a "tactical recon ping":
 *  — 3 concentric cyan rings expand from screen centre over 0.9s
 *  — Simultaneously, a bright cyan dot lights up at each visible
 *    enemy's projected screen position for HIGHLIGHT_DUR=0.6s
 *
 *  First ping fires FIRST_DELAY=10s after page load.
 *  Canvas-based. z-index 399. Passive — no keybind.
 * ============================================================ */
var TacticalPing = (function () {
  'use strict';

  var PING_INTERVAL  = 90.0;   /* seconds between auto-pings */
  var FIRST_DELAY    = 10.0;   /* delay before first ping */
  var RING_DUR       = 0.90;   /* seconds per ring expansion */
  var RING_DELAY     = 0.18;   /* stagger between rings */
  var HIGHLIGHT_DUR  = 0.65;
  var RING_COL       = 'rgba(80,220,255,';
  var MAX_DIST       = 200;    /* world units */

  var _canvas     = null;
  var _ctx        = null;
  var _init       = false;
  var _lastTs     = 0;
  var _startTs    = 0;
  var _lastPing   = 0;
  var _rings      = [];    /* {life, total, delay} */
  var _highlights = [];    /* {sx,sy,life,total} */
  var _cam        = null;

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:399;';
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

  function _firePing(ts) {
    _lastPing = ts;
    /* Queue 3 rings with stagger */
    for (var i = 0; i < 3; i++) {
      _rings.push({ life: RING_DUR + i * RING_DELAY, total: RING_DUR, delay: i * RING_DELAY });
    }

    /* Project all visible enemies to screen */
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return;
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      var pp  = window.player ? window.player.position : null;
      for (var j = 0; j < all.length; j++) {
        var e = all[j];
        if (!e || !e.mesh || e.hp <= 0) continue;
        if (pp) {
          var dx = e.mesh.position.x - pp.x;
          var dz = e.mesh.position.z - pp.z;
          if (dx*dx + dz*dz > MAX_DIST * MAX_DIST) continue;
        }
        var v = new THREE.Vector3(e.mesh.position.x, e.mesh.position.y + 1.0, e.mesh.position.z);
        v.project(cam);
        if (v.z > 1) continue;
        var sx = (v.x * 0.5 + 0.5) * _canvas.width;
        var sy = (-v.y * 0.5 + 0.5) * _canvas.height;
        if (sx < -20 || sx > _canvas.width + 20 || sy < -20 || sy > _canvas.height + 20) continue;
        _highlights.push({ sx: sx, sy: sy, life: HIGHLIGHT_DUR, total: HIGHLIGHT_DUR });
      }
    } catch (er) {}
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    if (_startTs === 0) _startTs = ts;
    var elapsed = (ts - _startTs) / 1000;

    /* Auto ping trigger */
    if (elapsed > FIRST_DELAY && ts / 1000 - _lastPing / 1000 > PING_INTERVAL) {
      _firePing(ts / 1000);
    }

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    var cx = _canvas.width / 2;
    var cy = _canvas.height / 2;
    var diagR = Math.sqrt(cx*cx + cy*cy);

    /* Draw rings */
    for (var i = _rings.length - 1; i >= 0; i--) {
      var r = _rings[i];
      r.life -= dt;
      if (r.life <= 0) { _rings.splice(i, 1); continue; }

      var active = r.life - r.delay;
      if (active <= 0) continue;
      var t = Math.max(0, 1 - active / r.total);   /* 0→1 */
      var radius = diagR * 1.15 * t;
      var alpha  = Math.pow(1 - t, 1.2) * 0.55;

      _ctx.save();
      _ctx.strokeStyle = RING_COL + alpha.toFixed(2) + ')';
      _ctx.lineWidth   = 1.5;
      _ctx.shadowColor = 'rgba(80,220,255,0.4)';
      _ctx.shadowBlur  = 6;
      _ctx.beginPath();
      _ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      _ctx.stroke();
      _ctx.restore();
    }

    /* Draw highlights */
    for (var j = _highlights.length - 1; j >= 0; j--) {
      var h = _highlights[j];
      h.life -= dt;
      if (h.life <= 0) { _highlights.splice(j, 1); continue; }

      var ht = 1 - h.life / h.total;
      var ha = Math.pow(1 - ht, 1.5) * 0.9;
      var hr = 4 + ht * 8;

      _ctx.save();
      _ctx.fillStyle   = 'rgba(80,255,220,' + ha.toFixed(2) + ')';
      _ctx.shadowColor = 'rgba(0,255,200,0.8)';
      _ctx.shadowBlur  = 12;
      _ctx.beginPath();
      _ctx.arc(h.sx, h.sy, hr, 0, Math.PI * 2);
      _ctx.fill();
      _ctx.restore();
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  /* Manual trigger (can be called from console for testing) */
  function ping() { _firePing(performance.now() / 1000); }

  return { init: init, ping: ping };
})();

window.TacticalPing = TacticalPing;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { TacticalPing.init(); });
} else {
  TacticalPing.init();
}
