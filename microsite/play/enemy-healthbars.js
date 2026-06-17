/* ============================================================
 *  ENEMY-HEALTHBARS.JS — HP bars above damaged enemies (passive)
 *
 *  When an enemy takes damage a small HP bar appears above their
 *  head (projected to screen via camera.project). Bar shows
 *  percentage HP remaining. Color: green > 50%, yellow > 25%,
 *  red <= 25%. Fades out 1.5s after last hit.
 *  Max 20 bars active at once (oldest evicted).
 * ============================================================ */
var EnemyHealthbars = (function () {
  'use strict';

  var LINGER_TIME  = 1.5;
  var MAX_BARS     = 20;
  var BAR_W        = 46;   /* px */
  var BAR_H        = 5;

  var _prevHp      = new WeakMap();
  var _bars        = new Map();   /* enemy -> { el, bg, fill, lastHit, maxHp } */
  var _init        = false;
  var _lastTs      = 0;
  var _frameN      = 0;
  var _cam         = null;
  var _style       = null;

  function _getCamera() {
    if (!_cam) { try { _cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {} }
    return _cam;
  }

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '.ehb-wrap{position:fixed;pointer-events:none;z-index:390;',
        'transform:translateX(-50%);transition:opacity 0.25s;}',
      '.ehb-bg{width:' + BAR_W + 'px;height:' + BAR_H + 'px;',
        'background:rgba(0,0,0,0.65);border-radius:2px;overflow:hidden;}',
      '.ehb-fill{height:100%;border-radius:2px;transition:width 0.1s linear;}',
    ].join('');
    document.head.appendChild(_style);
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
      if (sx < 10 || sx > window.innerWidth - 10 || sy < 10 || sy > window.innerHeight - 10) return null;
      return { x: sx, y: sy };
    } catch (e) { return null; }
  }

  function _createBar(e) {
    /* Evict oldest if at cap */
    if (_bars.size >= MAX_BARS) {
      var oldest = null, oldestTime = Infinity;
      _bars.forEach(function (b, key) { if (b.lastHit < oldestTime) { oldestTime = b.lastHit; oldest = key; } });
      if (oldest) { var ob = _bars.get(oldest); if (ob.el.parentNode) ob.el.parentNode.removeChild(ob.el); _bars.delete(oldest); }
    }
    var wrap  = document.createElement('div'); wrap.className = 'ehb-wrap';
    var bg    = document.createElement('div'); bg.className   = 'ehb-bg';
    var fill  = document.createElement('div'); fill.className = 'ehb-fill';
    bg.appendChild(fill);
    wrap.appendChild(bg);
    document.body.appendChild(wrap);
    var maxHp = e.hp !== undefined ? Math.max(e.hp, 1) : 100;
    var bar   = { el: wrap, fill: fill, lastHit: performance.now() / 1000, maxHp: maxHp, visible: true };
    _bars.set(e, bar);
    return bar;
  }

  function _colorForPct(pct) {
    if (pct > 0.5)  return '#44cc44';
    if (pct > 0.25) return '#ffcc00';
    return '#ff3333';
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* HP scan every 2 frames */
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
            if (prev - cur >= 1) {
              /* Hit — create or refresh bar */
              var bar = _bars.has(e) ? _bars.get(e) : _createBar(e);
              bar.lastHit = performance.now() / 1000;
              if (bar.maxHp < prev) bar.maxHp = prev;
              var pct = Math.max(0, cur / bar.maxHp);
              bar.fill.style.width = Math.round(pct * 100) + '%';
              bar.fill.style.background = _colorForPct(pct);
              bar.el.style.opacity = 1;
              bar.visible = true;
            }
            _prevHp.set(e, cur);
          }
        }
      } catch (err) {}
    }

    /* Update positions + fade */
    var now = performance.now() / 1000;
    _bars.forEach(function (bar, e) {
      /* Remove if enemy dead or bar gone */
      if (!e.mesh || (e.dead && !bar.visible)) {
        if (bar.el.parentNode) bar.el.parentNode.removeChild(bar.el);
        _bars.delete(e);
        return;
      }

      var age = now - bar.lastHit;
      if (age > LINGER_TIME) {
        /* Fade out */
        bar.el.style.opacity = Math.max(0, 1 - (age - LINGER_TIME) / 0.4);
        if (age > LINGER_TIME + 0.4) {
          if (bar.el.parentNode) bar.el.parentNode.removeChild(bar.el);
          _bars.delete(e);
          return;
        }
        bar.visible = false;
      }

      /* Update screen position */
      if (e.mesh) {
        var sc = _project(e.mesh.position.x, e.mesh.position.y + 2.3, e.mesh.position.z);
        if (sc) {
          bar.el.style.left = sc.x + 'px';
          bar.el.style.top  = sc.y + 'px';
          bar.el.style.display = 'block';
        } else {
          bar.el.style.display = 'none';
        }
      }
    });
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildStyle();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.EnemyHealthbars = EnemyHealthbars;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { EnemyHealthbars.init(); });
} else {
  EnemyHealthbars.init();
}