/* ============================================================
 *  THREAT-LINES.JS — targeting grid lines to visible enemies (passive)
 *
 *  Draws thin semi-transparent lines from screen centre to each
 *  visible, on-screen enemy within MAX_DIST world units.
 *
 *  Line colour by HP fraction:
 *    > 0.6 HP → green   rgba(60,220,60,  0.12)
 *    > 0.3 HP → orange  rgba(255,160,40, 0.14)
 *    ≤ 0.3 HP → red     rgba(255,40,40,  0.18)
 *
 *  DANGER types (SNIPER/HEAVY/TANK/MECH/SPETSNAZ/WAGNER) get
 *  a dashed line style and slightly higher alpha.
 *
 *  Max 8 lines drawn per frame. Canvas z-index 300 (below all HUD).
 *  Passive — no keybind.
 * ============================================================ */
var ThreatLines = (function () {
  'use strict';

  var MAX_DIST   = 80;   /* world units */
  var MAX_LINES  = 8;

  var DANGER_TYPES = { SNIPER:1, HEAVY:1, TANK:1, MECH:1, SPETSNAZ:1, WAGNER:1 };

  var _canvas = null;
  var _ctx    = null;
  var _init   = false;
  var _lastTs = 0;
  var _frameN = 0;
  var _cam    = null;

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

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

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    /* Update every 2nd frame */
    if (_frameN % 2 !== 0) return;

    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return;

    var cx = _canvas.width / 2;
    var cy = _canvas.height / 2;

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var pp  = window.player ? window.player.position : null;
      var all = Enemies.getAll();
      var drawn = 0;

      for (var i = 0; i < all.length; i++) {
        if (drawn >= MAX_LINES) break;
        var e = all[i];
        if (!e || !e.mesh || e.hp <= 0) continue;

        if (pp) {
          var dx = e.mesh.position.x - pp.x;
          var dz = e.mesh.position.z - pp.z;
          if (dx*dx + dz*dz > MAX_DIST * MAX_DIST) continue;
        }

        var v = new THREE.Vector3(e.mesh.position.x, e.mesh.position.y + 0.8, e.mesh.position.z);
        v.project(cam);
        if (v.z > 1) continue;
        var ex = (v.x * 0.5 + 0.5) * _canvas.width;
        var ey = (-v.y * 0.5 + 0.5) * _canvas.height;
        if (ex < -10 || ex > _canvas.width + 10 || ey < -10 || ey > _canvas.height + 10) continue;

        var hpFrac = Math.max(0, Math.min(1, e.hp / (e.maxHp || 100)));
        var isDanger = !!(DANGER_TYPES[(e.type || '').toUpperCase()]);

        var col, alpha;
        if (hpFrac > 0.6) {
          col = '60,220,60';   alpha = isDanger ? 0.16 : 0.10;
        } else if (hpFrac > 0.3) {
          col = '255,160,40';  alpha = isDanger ? 0.20 : 0.13;
        } else {
          col = '255,40,40';   alpha = isDanger ? 0.25 : 0.16;
        }

        _ctx.save();
        _ctx.strokeStyle = 'rgba(' + col + ',' + alpha + ')';
        _ctx.lineWidth   = isDanger ? 1.0 : 0.7;
        if (isDanger) _ctx.setLineDash([4, 6]);
        else          _ctx.setLineDash([]);
        _ctx.beginPath();
        _ctx.moveTo(cx, cy);
        _ctx.lineTo(ex, ey);
        _ctx.stroke();
        _ctx.restore();
        drawn++;
      }
    } catch (er) {}
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.ThreatLines = ThreatLines;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ThreatLines.init(); });
} else {
  ThreatLines.init();
}
