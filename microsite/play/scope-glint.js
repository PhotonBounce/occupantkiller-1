/* ============================================================
 *  SCOPE-GLINT.JS — Enemy sniper lens glint warning (passive)
 *
 *  Finds living SNIPER enemies. For each on-screen sniper:
 *  randomly (every 2–5s) flashes a brief white star-burst glint
 *  at their projected screen position (head height +1.8u).
 *  Glint lasts ~0.18s then fades instantly.
 *
 *  Warns players that a sniper is drawing a bead on them.
 *  Canvas overlay, zero gameplay impact.
 *
 *  Also fires a "⚠ SNIPER!" HUD pick-up notification on first
 *  glint per sniper per wave (uses HUD.notifyPickup if available).
 * ============================================================ */
var ScopeGlint = (function () {
  'use strict';

  var GLINT_INTERVAL_MIN = 2.0;
  var GLINT_INTERVAL_MAX = 5.0;
  var GLINT_DURATION     = 0.18;
  var RANGE_MAX          = 60;   /* only show glint if sniper within this range */

  var _canvas = null;
  var _ctx    = null;
  var _init   = false;
  var _lastTs = 0;
  var _frameN = 0;
  var _cam    = null;

  /* Per-sniper state: nextGlintAt, glintT, alerted */
  var _sniperState = new WeakMap();
  var _waveWas     = -1;

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:388;',
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

  function _project(wx, wy, wz) {
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return null;
    try {
      var v = new THREE.Vector3(wx, wy, wz);
      v.project(cam);
      if (v.z > 1) return null;
      var sx = (v.x * 0.5 + 0.5) * window.innerWidth;
      var sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
      var M  = 30;
      if (sx < -M || sx > window.innerWidth + M || sy < -M || sy > window.innerHeight + M) return null;
      return { x: sx, y: sy };
    } catch (e) { return null; }
  }

  function _drawGlint(x, y, t) {
    /* t in [0,1] — 1=bright, 0=fade */
    var ctx   = _ctx;
    var alpha = t;
    var r     = 18 + (1 - t) * 10;
    var rays  = 8;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);

    /* Outer corona */
    var grad = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2);
    grad.addColorStop(0,   'rgba(255,255,230,1)');
    grad.addColorStop(0.3, 'rgba(255,255,200,0.7)');
    grad.addColorStop(1,   'rgba(255,255,180,0)');
    ctx.beginPath();
    ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    /* Star rays */
    ctx.strokeStyle = 'rgba(255,255,240,' + alpha.toFixed(2) + ')';
    ctx.lineWidth   = 1.5;
    for (var i = 0; i < rays; i++) {
      var ang = (i / rays) * Math.PI * 2;
      var len = (i % 2 === 0) ? r * 1.6 : r * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
      ctx.stroke();
    }

    /* Core dot */
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.fill();

    ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Wave reset — clear alerted flags */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas && _waveWas !== -1) {
          /* new wave — old WeakMap entries will be GC'd with old enemies */
        }
        _waveWas = w;
      }
    } catch (e) {}

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    var px = 0, pz = 0;
    try {
      if (window.player && window.player.position) { px = window.player.position.x; pz = window.player.position.z; }
    } catch (e) {}

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0)) continue;
        /* Only snipers */
        var type = e.type || e.name || '';
        if (type.toUpperCase().indexOf('SNIPER') < 0) continue;

        /* Range check */
        var dx = e.mesh.position.x - px;
        var dz = e.mesh.position.z - pz;
        if (Math.sqrt(dx * dx + dz * dz) > RANGE_MAX) continue;

        /* Init state */
        if (!_sniperState.has(e)) {
          _sniperState.set(e, {
            nextGlint: now + GLINT_INTERVAL_MIN + Math.random() * (GLINT_INTERVAL_MAX - GLINT_INTERVAL_MIN),
            glintStart: -999,
            alerted: false,
          });
        }
        var st = _sniperState.get(e);

        /* Trigger next glint */
        if (now >= st.nextGlint && st.glintStart < 0) {
          st.glintStart = now;
          st.nextGlint  = now + GLINT_DURATION + GLINT_INTERVAL_MIN + Math.random() * (GLINT_INTERVAL_MAX - GLINT_INTERVAL_MIN);

          /* Alert notification first time */
          if (!st.alerted) {
            st.alerted = true;
            try {
              if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
                HUD.notifyPickup('⚠ SNIPER SIGHTED', '#ffaa44');
              }
            } catch (err) {}
          }
        }

        /* Draw glint if active */
        if (st.glintStart > 0) {
          var elapsed = now - st.glintStart;
          if (elapsed <= GLINT_DURATION) {
            var t = 1 - (elapsed / GLINT_DURATION);
            var sc = _project(e.mesh.position.x, e.mesh.position.y + 2.0, e.mesh.position.z);
            if (sc) _drawGlint(sc.x, sc.y, t);
          } else {
            st.glintStart = -999;
          }
        }
      }
    } catch (err) {}
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ScopeGlint = ScopeGlint;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ScopeGlint.init(); });
} else {
  ScopeGlint.init();
}