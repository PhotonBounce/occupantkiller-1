/* ============================================================
 *  RADAR-RING.JS — Off-screen enemy direction ring (passive)
 *
 *  A thin compass ring sits at bottom-right. Glowing blips appear
 *  on the ring's circumference pointing toward each off-screen enemy.
 *  On-screen enemies are skipped (you can see them).
 *
 *  Blip colour by HP ratio:
 *    >0.6  → yellow-green  |  0.3–0.6 → orange  |  <0.3 → red
 *  DANGER types (SNIPER/HEAVY/TANK/MECH/SPETSNAZ/WAGNER) get a
 *  larger pulsing blip.
 *
 *  Canvas z-index 363. Ring radius 48px, margin 24px from corner.
 * ============================================================ */
var RadarRing = (function () {
  'use strict';

  var RING_R      = 48;
  var RING_W      = 1.2;
  var BLIP_R      = 3.5;
  var BLIP_DANGER = 5.0;
  var MARGIN      = 24;
  var PULSE_SPD   = 2.2;

  var DANGER_TYPES = { SNIPER:1, HEAVY:1, TANK:1, MECH:1, SPETSNAZ:1, WAGNER:1 };

  var _canvas = null;
  var _ctx    = null;
  var _init   = false;
  var _frameN = 0;
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
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:363;';
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

  function _cx() { return _canvas.width  - MARGIN - RING_R; }
  function _cy() { return _canvas.height - MARGIN - RING_R; }

  function _isOnScreen(sx, sy) {
    return sx >= 0 && sx <= _canvas.width && sy >= 0 && sy <= _canvas.height;
  }

  function _blipAngle(sx, sy) {
    return Math.atan2(sy - _canvas.height / 2, sx - _canvas.width / 2);
  }

  function _blipColor(hpFrac) {
    if (hpFrac > 0.6) return [130, 255, 80];
    if (hpFrac > 0.3) return [255, 160, 30];
    return [255, 50, 50];
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _phase += PULSE_SPD * dt;

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    var cx = _cx();
    var cy = _cy();

    _ctx.save();
    _ctx.strokeStyle = 'rgba(80,200,255,0.18)';
    _ctx.lineWidth = RING_W;
    _ctx.beginPath();
    _ctx.arc(cx, cy, RING_R, 0, Math.PI * 2);
    _ctx.stroke();

    _ctx.strokeStyle = 'rgba(80,200,255,0.45)';
    _ctx.lineWidth = 1.5;
    _ctx.beginPath();
    _ctx.moveTo(cx, cy - RING_R + 1);
    _ctx.lineTo(cx, cy - RING_R - 5);
    _ctx.stroke();
    _ctx.restore();

    var cam = _getCamera();
    if (_frameN % 2 !== 0 || !cam || typeof THREE === 'undefined') return;

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0)) continue;

        var hpFrac = 1;
        try {
          if (e.hp !== undefined) hpFrac = Math.max(0, Math.min(1, e.hp / (e.maxHp || 100)));
        } catch (er2) {}

        var isDanger = !!(DANGER_TYPES[e.type]);

        var v = new THREE.Vector3(e.mesh.position.x, e.mesh.position.y + 1.0, e.mesh.position.z);
        v.project(cam);
        if (v.z > 1) continue;
        var sx = (v.x * 0.5 + 0.5) * _canvas.width;
        var sy = (-v.y * 0.5 + 0.5) * _canvas.height;

        if (_isOnScreen(sx, sy)) continue;

        var ang  = _blipAngle(sx, sy);
        var bx   = cx + Math.cos(ang) * RING_R;
        var by   = cy + Math.sin(ang) * RING_R;
        var col  = _blipColor(hpFrac);
        var br   = isDanger ? BLIP_DANGER : BLIP_R;
        var pulse = isDanger ? (0.7 + 0.3 * Math.sin(_phase)) : 1;
        var alpha = 0.85 * pulse;

        _ctx.save();
        _ctx.shadowColor = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.7)';
        _ctx.shadowBlur  = isDanger ? 10 : 6;
        _ctx.fillStyle   = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + alpha.toFixed(2) + ')';
        _ctx.beginPath();
        _ctx.arc(bx, by, br * pulse, 0, Math.PI * 2);
        _ctx.fill();
        _ctx.restore();
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

window.RadarRing = RadarRing;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { RadarRing.init(); });
} else {
  RadarRing.init();
}