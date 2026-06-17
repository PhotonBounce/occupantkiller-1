/* ============================================================
 *  DAMAGE-DIRECTION.JS — Hit-direction indicator (passive)
 *
 *  When player.hp drops: find the nearest living enemy and compute
 *  the world-space bearing from player to that enemy. Convert the
 *  bearing into a canvas arc drawn near the screen edge in the
 *  corresponding direction. The arc fades out over 0.9s.
 *
 *  Uses GameManager.getCamera() for yaw offset so the indicator
 *  is camera-relative (same direction as the enemy on screen).
 *  Max 3 simultaneous indicators. Cooldown 0.15s to avoid spam.
 * ============================================================ */
var DamageDirection = (function () {
  'use strict';

  var _canvas  = null;
  var _ctx     = null;
  var _init    = false;
  var _lastTs  = 0;
  var _raf     = 0;
  var _prevHp  = null;
  var _lastHit = 0;
  var HIT_CD   = 0.15;

  /* Active indicators: { angle (rad, camera-relative), alpha, decay } */
  var _inds    = [];
  var MAX_INDS = 4;
  var FADE_T   = 0.9;   /* seconds to full fade */

  var _cam     = null;

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  function _getCamYaw(cam) {
    try {
      if (!cam || typeof THREE === 'undefined') return 0;
      var dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      return Math.atan2(dir.x, dir.z);
    } catch (e) { return 0; }
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:396;',
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

  function _nearestEnemy() {
    var px = 0, pz = 0;
    try {
      if (window.player && window.player.position) {
        px = window.player.position.x;
        pz = window.player.position.z;
      }
    } catch (e) {}

    var bestDist = Infinity, bestE = null;
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0)) continue;
          var dx = e.mesh.position.x - px;
          var dz = e.mesh.position.z - pz;
          var d  = dx * dx + dz * dz;
          if (d < bestDist) { bestDist = d; bestE = e; }
        }
      }
    } catch (er) {}
    return bestE;
  }

  function _onHit() {
    var e   = _nearestEnemy();
    if (!e || !e.mesh) return;

    var px  = 0, pz = 0;
    try {
      if (window.player && window.player.position) { px = window.player.position.x; pz = window.player.position.z; }
    } catch (e2) {}

    /* World bearing to enemy */
    var wx = e.mesh.position.x - px;
    var wz = e.mesh.position.z - pz;
    var worldAngle = Math.atan2(wx, wz);

    /* Camera yaw offset */
    var cam = _getCamera();
    var yaw = _getCamYaw(cam);
    var camAngle = worldAngle - yaw;   /* angle in camera space; 0 = forward (top) */

    /* Evict oldest if full */
    if (_inds.length >= MAX_INDS) _inds.shift();
    _inds.push({ angle: camAngle, alpha: 1.0 });
  }

  function _drawIndicator(ind) {
    if (!_ctx || ind.alpha <= 0) return;
    var ctx  = _ctx;
    var cx   = _canvas.width  / 2;
    var cy   = _canvas.height / 2;
    var rMin = Math.min(_canvas.width, _canvas.height) * 0.38;
    var rMax = rMin + 26;
    var arcW = 0.42;   /* half-arc width in radians (~24°) */

    /* Angle: 0 = top (forward), positive = clockwise */
    /* Canvas angle convention: top = -π/2, right = 0 */
    var a = ind.angle - Math.PI / 2;

    ctx.save();
    ctx.globalAlpha = Math.max(0, ind.alpha) * 0.85;

    /* Outer glow */
    ctx.beginPath();
    ctx.arc(cx, cy, rMax + 8, a - arcW * 1.3, a + arcW * 1.3);
    ctx.strokeStyle = 'rgba(255, 40, 40, 0.3)';
    ctx.lineWidth = 18;
    ctx.stroke();

    /* Main arc */
    ctx.beginPath();
    ctx.arc(cx, cy, (rMin + rMax) / 2, a - arcW, a + arcW);
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.92)';
    ctx.lineWidth = rMax - rMin;
    ctx.stroke();

    /* Bright centre line */
    ctx.beginPath();
    ctx.arc(cx, cy, (rMin + rMax) / 2, a - 0.04, a + 0.04);
    ctx.strokeStyle = 'rgba(255, 180, 180, 1.0)';
    ctx.lineWidth = rMax - rMin;
    ctx.stroke();

    ctx.restore();
  }

  function _tick(ts) {
    _raf = requestAnimationFrame(_tick);
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* HP watch */
    try {
      if (window.player && window.player.hp !== undefined) {
        var cur = window.player.hp;
        var now = ts / 1000;
        if (_prevHp !== null && cur < _prevHp && _prevHp - cur >= 3 && now - _lastHit > HIT_CD) {
          _lastHit = now;
          _onHit();
        }
        _prevHp = cur;
      }
    } catch (e) {}

    /* Clear + draw */
    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    for (var i = _inds.length - 1; i >= 0; i--) {
      var ind = _inds[i];
      _drawIndicator(ind);
      ind.alpha -= dt / FADE_T;
      if (ind.alpha <= 0) _inds.splice(i, 1);
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

window.DamageDirection = DamageDirection;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { DamageDirection.init(); });
} else {
  DamageDirection.init();
}