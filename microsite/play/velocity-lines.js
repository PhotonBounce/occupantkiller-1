/* ============================================================
 *  VELOCITY-LINES.JS — Speed streaks when moving fast (passive)
 *
 *  Tracks player.position delta each frame to estimate movement speed.
 *  When speed > SPEED_MIN (units/s), draws radial streak lines from
 *  screen centre — the faster the movement, the more lines and longer.
 *
 *  Lines point in the movement direction projected to screen space.
 *  At max speed (SPEED_MAX) the effect is dramatic; below SPEED_MIN it
 *  fades out quickly.
 *
 *  Speed is smoothed with a low-pass filter to avoid jitter.
 *  Canvas z-index 308 (above weather-embers 305, below ambient-particles).
 *  MAX_LINES 28. Passive, no keybind.
 * ============================================================ */
var VelocityLines = (function () {
  'use strict';

  var SPEED_MIN  = 5.0;   /* units/s to start effect */
  var SPEED_MAX  = 15.0;  /* units/s at full effect */
  var MAX_LINES  = 28;
  var LINE_MIN   = 30;    /* px shortest line */
  var LINE_MAX   = 140;   /* px longest at full speed */
  var SPREAD_R   = 160;   /* inner ring radius at screen center */
  var SMOOTH     = 0.18;  /* low-pass: lower = slower response */

  var _canvas    = null;
  var _ctx       = null;
  var _init      = false;
  var _lastTs    = 0;
  var _speedSmooth = 0;
  var _prevPos   = null;

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:308;';
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
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    /* Speed measurement */
    var speed = 0;
    try {
      if (window.player && window.player.position) {
        var pos = window.player.position;
        if (_prevPos && dt > 0) {
          var dx = pos.x - _prevPos.x;
          var dz = pos.z - _prevPos.z;
          speed = Math.sqrt(dx*dx + dz*dz) / dt;
        }
        _prevPos = { x: pos.x, y: pos.y, z: pos.z };
      }
    } catch (e) {}

    /* Low-pass smooth */
    _speedSmooth += (speed - _speedSmooth) * Math.min(1, SMOOTH + dt * 2);

    var eff = Math.max(0, (_speedSmooth - SPEED_MIN) / (SPEED_MAX - SPEED_MIN));
    eff = Math.min(1, eff);
    if (eff < 0.02) return;

    var W  = _canvas.width;
    var H  = _canvas.height;
    var cx = W / 2;
    var cy = H / 2;

    var lineCount = Math.round(MAX_LINES * eff);
    var lineLen   = LINE_MIN + (LINE_MAX - LINE_MIN) * eff;
    var alpha     = eff * 0.35;

    _ctx.save();
    for (var i = 0; i < lineCount; i++) {
      var angle = (i / lineCount) * Math.PI * 2 + (ts / 1000 * 0.3);  /* slow rotation */
      var len   = lineLen * (0.7 + Math.random() * 0.5);
      var r1    = SPREAD_R * 0.6;
      var r2    = r1 + len;
      var sx    = cx + Math.cos(angle) * r1;
      var sy    = cy + Math.sin(angle) * r1;
      var ex    = cx + Math.cos(angle) * r2;
      var ey    = cy + Math.sin(angle) * r2;

      var lAlpha = alpha * (0.5 + Math.random() * 0.5);
      _ctx.strokeStyle = 'rgba(180,200,220,' + lAlpha.toFixed(2) + ')';
      _ctx.lineWidth   = 0.8 + eff * 0.8;
      _ctx.beginPath();
      _ctx.moveTo(sx, sy);
      _ctx.lineTo(ex, ey);
      _ctx.stroke();
    }
    _ctx.restore();
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.VelocityLines = VelocityLines;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { VelocityLines.init(); });
} else {
  VelocityLines.init();
}