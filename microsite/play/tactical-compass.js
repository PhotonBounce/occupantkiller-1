/* ============================================================
 *  TACTICAL-COMPASS.JS — Horizontal heading compass (passive)
 *
 *  A canvas strip at the top-center of the screen (180×22 px).
 *  Shows:
 *  - Scrolling compass tape with N/NE/E/SE/S/SW/W/NW/degree marks
 *  - Centre triangle marker = current camera heading
 *  - Red enemy bearing ticks below the tape for enemies within 60u
 *  Reads camera world direction to derive yaw heading (0°=North=+Z).
 * ============================================================ */
var TacticalCompass = (function () {
  'use strict';

  var W = 220;   /* canvas px width */
  var H = 30;    /* canvas px height */
  var DEG_PER_PX = 0.45;   /* compass degrees scrolled per pixel */
  var ENEMY_RANGE = 60;

  var CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  var _canvas  = null;
  var _ctx     = null;
  var _init    = false;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _cam     = null;

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.width  = W;
    _canvas.height = H;
    _canvas.style.cssText = [
      'position:fixed;top:8px;',
      'left:50%;transform:translateX(-50%);',
      'pointer-events:none;z-index:369;',
      'border-radius:3px;',
      'box-shadow:0 0 6px rgba(0,0,0,0.6);',
    ].join('');
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
  }

  function _getHeading() {
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return 0;
    try {
      var dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      /* Heading: angle from +Z axis, clockwise. 0=North, 90=East */
      var heading = Math.atan2(dir.x, dir.z) * 180 / Math.PI;
      return ((heading % 360) + 360) % 360;
    } catch (e) { return 0; }
  }

  function _enemyBearings(heading) {
    var bearings = [];
    var px = 0, pz = 0;
    try {
      if (window.player && window.player.position) { px = window.player.position.x; pz = window.player.position.z; }
    } catch (e) {}
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0)) continue;
          var dx = e.mesh.position.x - px;
          var dz = e.mesh.position.z - pz;
          var dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > ENEMY_RANGE) continue;
          var bearing = Math.atan2(dx, dz) * 180 / Math.PI;
          bearing = ((bearing % 360) + 360) % 360;
          bearings.push(bearing);
        }
      }
    } catch (er) {}
    return bearings;
  }

  function _draw(heading) {
    var ctx = _ctx;
    var CX  = W / 2;

    ctx.clearRect(0, 0, W, H);

    /* Background */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, 'rgba(0, 8, 15, 0.82)');
    bg.addColorStop(1, 'rgba(0, 5, 10, 0.60)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* Clip to canvas */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();

    /* Draw compass tape */
    /* Every 10°: minor tick. Every 45°: cardinal label */
    var totalDeg = W * DEG_PER_PX;
    var startDeg = heading - totalDeg / 2;

    for (var d = Math.floor(startDeg / 10) * 10; d <= startDeg + totalDeg; d += 10) {
      var relDeg = d - heading;
      var x = CX + relDeg / DEG_PER_PX;
      if (x < -5 || x > W + 5) continue;

      var normDeg = ((d % 360) + 360) % 360;
      var isCardinal = normDeg % 45 === 0;

      if (isCardinal) {
        /* Tall tick + label */
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, 2);
        ctx.lineTo(x, 14);
        ctx.stroke();

        var cardIdx = Math.round(normDeg / 45) % 8;
        ctx.fillStyle = 'rgba(0, 200, 255, 0.95)';
        ctx.font = 'bold 8px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(CARDINALS[cardIdx], x, H - 5);
      } else if (normDeg % 10 === 0) {
        /* Minor tick */
        ctx.strokeStyle = 'rgba(0, 150, 200, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 5);
        ctx.lineTo(x, 10);
        ctx.stroke();
      }
    }

    /* Enemy bearing ticks */
    var bearings = _enemyBearings(heading);
    for (var b = 0; b < bearings.length; b++) {
      var relB  = bearings[b] - heading;
      /* Wrap: keep in [-180, 180] */
      if (relB >  180) relB -= 360;
      if (relB < -180) relB += 360;
      var bx = CX + relB / DEG_PER_PX;
      if (bx < 0 || bx > W) continue;
      ctx.fillStyle = 'rgba(255, 60, 60, 0.85)';
      ctx.beginPath();
      ctx.arc(bx, H - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    /* Centre chevron */
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.moveTo(CX, H - 9);
    ctx.lineTo(CX - 5, H - 2);
    ctx.lineTo(CX + 5, H - 2);
    ctx.closePath();
    ctx.fill();

    /* Heading readout */
    ctx.fillStyle = 'rgba(200, 230, 255, 0.75)';
    ctx.font = '7px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(heading) + '°', CX, 10);

    /* Border */
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    if (_frameN % 2 !== 0) return;   /* ~30fps update */
    _lastTs = ts;

    if (!_ctx) return;
    var heading = _getHeading();
    _draw(heading);
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.TacticalCompass = TacticalCompass;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { TacticalCompass.init(); });
} else {
  TacticalCompass.init();
}