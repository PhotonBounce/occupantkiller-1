/* ============================================================
 *  RADAR-MINIMAP.JS — 2D canvas radar overlay (passive)
 *
 *  Renders a circular radar in the bottom-right corner:
 *  - Player = white dot at center
 *  - Camera forward direction = cyan wedge arc + heading tick
 *  - Enemies = red dots, distance-scaled within RADAR_RANGE units
 *  - Friendly NPCs (type includes 'ally'/'friendly') = green dots
 *  - Range ring + cardinal tick marks
 *
 *  Canvas is 110×110 px; radar circle radius = 48 px.
 *  World range mapped: RADAR_RANGE units → 48 px radius.
 *  Requires window.player.position, GameManager.getCamera(),
 *  Enemies.getAll().
 * ============================================================ */
var RadarMinimap = (function () {
  'use strict';

  var RADAR_RANGE  = 55;   /* world units captured in the radar radius */
  var SIZE         = 110;  /* canvas px (width + height) */
  var CX           = SIZE / 2;
  var CY           = SIZE / 2;
  var R            = 48;   /* px radius of radar circle */

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
    _canvas.width  = SIZE;
    _canvas.height = SIZE;
    _canvas.style.cssText = [
      'position:fixed;bottom:16px;right:16px;',
      'width:' + SIZE + 'px;height:' + SIZE + 'px;',
      'pointer-events:none;z-index:380;',
      'border-radius:50%;',
      'box-shadow:0 0 8px rgba(0,200,255,0.35), inset 0 0 12px rgba(0,0,0,0.7);',
    ].join('');
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
  }

  function _worldToRadar(px, pz, ex, ez, yawRad) {
    /* Offset from player in world space */
    var dx = ex - px;
    var dz = ez - pz;
    /* Rotate so camera forward = up on radar */
    var cos = Math.cos(-yawRad);
    var sin = Math.sin(-yawRad);
    var rx  = dx * cos - dz * sin;
    var ry  = dx * sin + dz * cos;
    /* Scale to radar pixels */
    var scale = R / RADAR_RANGE;
    return { x: CX + rx * scale, y: CY - ry * scale };
  }

  function _getYaw(cam) {
    /* Extract yaw from camera's world direction */
    try {
      if (!cam || typeof THREE === 'undefined') return 0;
      var dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      return Math.atan2(dir.x, dir.z);
    } catch (e) { return 0; }
  }

  function _drawFrame() {
    if (!_ctx) return;
    var ctx = _ctx;
    ctx.clearRect(0, 0, SIZE, SIZE);

    /* Background circle */
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();

    /* Dark fill */
    ctx.fillStyle = 'rgba(0, 8, 18, 0.82)';
    ctx.fillRect(0, 0, SIZE, SIZE);

    /* Grid rings */
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.12)';
    ctx.lineWidth = 1;
    [R * 0.33, R * 0.66].forEach(function (r) {
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    /* Cardinal ticks (N/E/S/W in radar = fwd/right/back/left) */
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.28)';
    [[0, -R], [R, 0], [0, R], [-R, 0]].forEach(function (d) {
      ctx.beginPath();
      ctx.moveTo(CX + d[0] * 0.85, CY + d[1] * 0.85);
      ctx.lineTo(CX + d[0], CY + d[1]);
      ctx.stroke();
    });

    var cam  = _getCamera();
    var yaw  = _getYaw(cam);
    var plx  = 0, plz = 0;
    try {
      if (window.player && window.player.position) {
        plx = window.player.position.x;
        plz = window.player.position.z;
      }
    } catch (e) {}

    /* Camera forward FOV wedge */
    var fovHalf = 0.55;   /* ~63° half-angle wedge */
    var wedgeA1 = -Math.PI / 2 - fovHalf;
    var wedgeA2 = -Math.PI / 2 + fovHalf;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R * 0.90, wedgeA1, wedgeA2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 200, 255, 0.07)';
    ctx.fill();

    /* Enemies */
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0)) continue;
          var ep = e.mesh.position;
          var rp = _worldToRadar(plx, plz, ep.x, ep.z, yaw);
          /* Clamp to circle boundary */
          var ddx = rp.x - CX;
          var ddy = rp.y - CY;
          var dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist > R - 2) { rp.x = CX + ddx / dist * (R - 2); rp.y = CY + ddy / dist * (R - 2); }

          var isAlly = e.type && (e.type.toLowerCase().indexOf('ally') >= 0 || e.type.toLowerCase().indexOf('friendly') >= 0 || e.type.toLowerCase().indexOf('ukraine') >= 0);
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isAlly ? '#44ff88' : '#ff3333';
          ctx.fill();
        }
      }
    } catch (err) {}

    /* Player dot (center) */
    ctx.beginPath();
    ctx.arc(CX, CY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    /* Forward tick */
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX, CY - 7);
    ctx.stroke();

    ctx.restore();

    /* Outer ring border */
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* "RADAR" label */
    ctx.fillStyle = 'rgba(0, 200, 255, 0.45)';
    ctx.font = '7px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('RADAR', CX, SIZE - 4);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    /* Redraw every 3rd frame (~20 fps update is enough for radar) */
    if (_frameN % 3 !== 0) return;
    _lastTs = ts;
    _drawFrame();
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.RadarMinimap = RadarMinimap;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { RadarMinimap.init(); });
} else {
  RadarMinimap.init();
}