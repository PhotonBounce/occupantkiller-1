/* ============================================================
 *  PROXIMITY-ALARM.JS — enemy too close screen alarm (passive)
 *
 *  If any living enemy is within ALARM_DIST=15 world units of
 *  the player, a pulsing red radial gradient ring appears at
 *  all four screen corners — the classic "flanked" warning.
 *
 *  Alarm intensity scales with proximity:
 *    15u  → subtle pulse (alpha 0.12)
 *    8u   → medium pulse (alpha 0.22)
 *    <4u  → intense rapid pulse (alpha 0.36)
 *
 *  DANGER types (SNIPER/HEAVY/TANK/MECH/SPETSNAZ/WAGNER) trigger
 *  at DANGER_DIST=22u so heavy units alarm earlier.
 *
 *  Canvas z-index 309 (above velocity-lines 308, below scanlines 306).
 *  Passive — no keybind.
 * ============================================================ */
var ProximityAlarm = (function () {
  'use strict';

  var ALARM_DIST   = 15;   /* world units */
  var DANGER_DIST  = 22;   /* for DANGER types */
  var PULSE_BASE   = 1.8;  /* Hz at 15u */
  var PULSE_FAST   = 4.0;  /* Hz at <4u */

  var DANGER_TYPES = { SNIPER:1, HEAVY:1, TANK:1, MECH:1, SPETSNAZ:1, WAGNER:1 };

  var _canvas  = null;
  var _ctx     = null;
  var _init    = false;
  var _lastTs  = 0;
  var _phase   = 0;
  var _frameN  = 0;

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:309;';
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

    /* Scan enemies every 3rd frame */
    var minDist = Infinity;
    var isDanger = false;

    if (_frameN % 3 === 0) {
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll && window.player && window.player.position) {
          var pp  = window.player.position;
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh || e.hp <= 0) continue;
            var dx = e.mesh.position.x - pp.x;
            var dz = e.mesh.position.z - pp.z;
            var d2 = dx*dx + dz*dz;
            var etype = (e.type || '').toUpperCase();
            var threshold = DANGER_TYPES[etype] ? DANGER_DIST : ALARM_DIST;
            if (d2 < threshold * threshold) {
              var d = Math.sqrt(d2);
              if (d < minDist) { minDist = d; isDanger = DANGER_TYPES[etype]; }
            }
          }
        }
      } catch (er) {}
    }

    if (minDist === Infinity) {
      _phase = 0;
      return;
    }

    /* Intensity by distance */
    var normDist = Math.max(0, Math.min(1, minDist / (isDanger ? DANGER_DIST : ALARM_DIST)));
    var intensity = 1 - normDist;          /* 0=far, 1=touching */
    var baseAlpha = 0.10 + intensity * 0.28;
    var hz        = PULSE_BASE + (PULSE_FAST - PULSE_BASE) * intensity;

    _phase += dt * hz;
    var pulse = (Math.sin(_phase * Math.PI * 2) * 0.5 + 0.5);
    var alpha = baseAlpha * (0.5 + pulse * 0.6);

    var W = _canvas.width;
    var H = _canvas.height;
    var R = Math.max(W, H) * 0.55;

    /* Four corner radial gradients */
    var corners = [[0,0],[W,0],[0,H],[W,H]];
    for (var c = 0; c < corners.length; c++) {
      var gx = corners[c][0];
      var gy = corners[c][1];
      var g  = _ctx.createRadialGradient(gx, gy, 0, gx, gy, R);
      g.addColorStop(0,   'rgba(255,30,30,' + (alpha * 0.9).toFixed(3) + ')');
      g.addColorStop(0.3, 'rgba(200,0,0,'  + (alpha * 0.4).toFixed(3) + ')');
      g.addColorStop(1,   'rgba(200,0,0,0)');
      _ctx.fillStyle = g;
      _ctx.fillRect(0, 0, W, H);
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

window.ProximityAlarm = ProximityAlarm;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { ProximityAlarm.init(); });
} else {
  ProximityAlarm.init();
}
