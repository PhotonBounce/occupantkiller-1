/* ============================================================
 *  SCOPE-GLINT.JS — Sniper scope lens flare warning (passive)
 *
 *  Active SNIPER enemies render a small lens-glint at their
 *  projected screen position: a bright white dot with yellow/cyan
 *  lens cross-rays, pulsing at 1.5Hz.
 *
 *  This gives the player a visual warning — "there's a sniper
 *  at that position" — before they get hit.
 *
 *  Glint only shows on-screen (within bounds). Off-screen snipers
 *  are already indicated by radar-ring blips.
 *
 *  Canvas z-index 396. No keybind. Passive.
 * ============================================================ */
var ScopeGlint = (function () {
  'use strict';

  var PULSE_HZ  = 1.5;
  var GLINT_R   = 6;
  var RAY_LEN   = 14;
  var SNIPER_TYPE = 'SNIPER';

  var _canvas = null;
  var _ctx    = null;
  var _init   = false;
  var _lastTs = 0;
  var _phase  = 0;
  var _cam    = null;

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:396;';
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

  function _drawGlint(x, y, pulse) {
    var ctx = _ctx;
    var alpha = 0.55 + pulse * 0.4;

    ctx.save();
    ctx.shadowColor = 'rgba(255,240,150,0.9)';
    ctx.shadowBlur  = 12 + pulse * 6;

    /* Core dot */
    ctx.fillStyle = 'rgba(255,255,220,' + alpha.toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(x, y, GLINT_R * (0.8 + pulse * 0.4), 0, Math.PI * 2);
    ctx.fill();

    /* Cross rays */
    ctx.strokeStyle = 'rgba(255,210,80,' + (alpha * 0.7).toFixed(2) + ')';
    ctx.lineWidth = 1.0;
    var rl = RAY_LEN * (0.8 + pulse * 0.3);
    ctx.beginPath();
    ctx.moveTo(x - rl, y); ctx.lineTo(x + rl, y);
    ctx.moveTo(x, y - rl); ctx.lineTo(x, y + rl);
    ctx.stroke();

    /* Diagonal rays (shorter) */
    ctx.strokeStyle = 'rgba(180,220,255,' + (alpha * 0.4).toFixed(2) + ')';
    var dl = rl * 0.55;
    ctx.beginPath();
    ctx.moveTo(x - dl, y - dl); ctx.lineTo(x + dl, y + dl);
    ctx.moveTo(x + dl, y - dl); ctx.lineTo(x - dl, y + dl);
    ctx.stroke();

    ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _phase += PULSE_HZ * Math.PI * 2 * dt;

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return;

    var pulse = (Math.sin(_phase) * 0.5 + 0.5);  /* 0-1 */

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh) continue;
        if ((e.type || '').toUpperCase() !== SNIPER_TYPE) continue;
        if (e.hp !== undefined && e.hp <= 0) continue;

        var v = new THREE.Vector3(e.mesh.position.x, e.mesh.position.y + 1.4, e.mesh.position.z);
        v.project(cam);
        if (v.z > 1) continue;
        var sx = (v.x * 0.5 + 0.5) * _canvas.width;
        var sy = (-v.y * 0.5 + 0.5) * _canvas.height;
        if (sx < 0 || sx > _canvas.width || sy < 0 || sy > _canvas.height) continue;

        _drawGlint(sx, sy, pulse);
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

window.ScopeGlint = ScopeGlint;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ScopeGlint.init(); });
} else {
  ScopeGlint.init();
}