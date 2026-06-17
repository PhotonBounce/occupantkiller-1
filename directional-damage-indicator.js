/* ============================================================
 *  DIRECTIONAL-DAMAGE-INDICATOR.JS — Incoming fire compass ring (passive)
 *
 *  When the player takes damage, finds the closest living enemy
 *  with line-of-sight (< 120 units) and displays a red arc on
 *  a compass ring around screen center pointing toward the source.
 *
 *  The arc is 40° wide at the threat bearing, fading over FADE=1.0s.
 *  Multiple simultaneous arcs supported (up to 4), each independent.
 *
 *  Bearing is derived by projecting the enemy → player direction
 *  against the camera's forward vector (yaw only).
 *
 *  Canvas z-index 393. Ring radius: 55px from screen center.
 *  Passive — no keybind.
 * ============================================================ */
var DirectionalDamageIndicator = (function () {
  'use strict';

  var RING_R    = 55;    /* screen radius px */
  var ARC_DEG   = 40;   /* arc width in degrees */
  var FADE_TIME = 1.0;  /* seconds */
  var MAX_ARCS  = 4;
  var MAX_DIST  = 120;  /* world units max threat distance */

  var _canvas  = null;
  var _ctx     = null;
  var _init    = false;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _arcs    = [];  /* {angle, life, total} */
  var _prevPHp = null;
  var _cam     = null;

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:393;';
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

  /* Find the closest shooting enemy's screen bearing (-PI to PI from top) */
  function _findThreatAngle() {
    try {
      var cam = _getCamera();
      if (!cam || !window.player || !window.player.position) return null;
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return null;
      if (typeof THREE === 'undefined') return null;

      var ppos = window.player.position;
      var all  = Enemies.getAll();
      var best = null;
      var bestDist = MAX_DIST * MAX_DIST;

      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0)) continue;
        var dx = e.mesh.position.x - ppos.x;
        var dz = e.mesh.position.z - ppos.z;
        var d2 = dx * dx + dz * dz;
        if (d2 < bestDist) { bestDist = d2; best = e; }
      }

      if (!best) return null;

      /* World-space direction from player to threat (xz plane) */
      var threatDx = best.mesh.position.x - ppos.x;
      var threatDz = best.mesh.position.z - ppos.z;

      /* Camera forward direction (xz) */
      var camDir = new THREE.Vector3(0, 0, -1);
      camDir.applyQuaternion(cam.quaternion);
      /* Yaw angle of camera on xz plane */
      var camYaw = Math.atan2(camDir.x, camDir.z);

      /* Angle from player to threat in world xz */
      var threatAngle = Math.atan2(threatDx, threatDz);

      /* Relative bearing (from camera forward) */
      var bearing = threatAngle - camYaw;
      /* Normalise to -PI..PI */
      while (bearing >  Math.PI) bearing -= Math.PI * 2;
      while (bearing < -Math.PI) bearing += Math.PI * 2;

      return bearing;
    } catch (e) { return null; }
  }

  function _spawnArc(angle) {
    if (_arcs.length >= MAX_ARCS) _arcs.shift();
    _arcs.push({ angle: angle, life: FADE_TIME, total: FADE_TIME });
  }

  function _drawArc(a) {
    var t     = a.life / a.total;
    var alpha = t * 0.75;
    var cx    = _canvas.width  / 2;
    var cy    = _canvas.height / 2;
    var halfW = (ARC_DEG / 2) * Math.PI / 180;
    /* Arc: bearing 0 = forward = top = -PI/2 in canvas angle */
    var startA = a.angle - Math.PI / 2 - halfW;
    var endA   = a.angle - Math.PI / 2 + halfW;

    var grad = _ctx.createLinearGradient(
      cx + Math.cos(startA) * RING_R, cy + Math.sin(startA) * RING_R,
      cx + Math.cos(endA)   * RING_R, cy + Math.sin(endA)   * RING_R
    );
    grad.addColorStop(0,   'rgba(255,30,30,0)');
    grad.addColorStop(0.5, 'rgba(255,80,50,' + alpha.toFixed(2) + ')');
    grad.addColorStop(1,   'rgba(255,30,30,0)');

    _ctx.save();
    _ctx.beginPath();
    _ctx.arc(cx, cy, RING_R, startA, endA);
    _ctx.strokeStyle = grad;
    _ctx.lineWidth   = 5;
    _ctx.shadowColor = 'rgba(255,50,30,0.7)';
    _ctx.shadowBlur  = 10;
    _ctx.stroke();
    _ctx.restore();
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Damage detection every 2nd frame */
    if (_frameN % 2 === 0) {
      try {
        if (window.player && window.player.hp !== undefined) {
          var php = window.player.hp;
          if (_prevPHp !== null && _prevPHp > php && php > 0) {
            var ang = _findThreatAngle();
            if (ang !== null) _spawnArc(ang);
          }
          _prevPHp = php;
        }
      } catch (e) {}
    }

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    for (var j = _arcs.length - 1; j >= 0; j--) {
      _arcs[j].life -= dt;
      if (_arcs[j].life <= 0) { _arcs.splice(j, 1); continue; }
      _drawArc(_arcs[j]);
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

window.DirectionalDamageIndicator = DirectionalDamageIndicator;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { DirectionalDamageIndicator.init(); });
} else {
  DirectionalDamageIndicator.init();
}