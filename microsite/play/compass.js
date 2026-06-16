/* ============================================================
 *  COMPASS.JS — Tactical heading strip
 *
 *  Renders a continuous compass bearing strip at the top-center
 *  of the screen, updating every frame from the THREE.js camera.
 *  Features:
 *    • Cardinal (N/E/S/W) and ordinal (NE/SE/SW/NW) labels
 *    • Current bearing readout in degrees (000–359)
 *    • Marked-enemy bearing ticks (integrates with Binoculars marks)
 *    • Objective bearing tick (if MissionSystem has a target pos)
 *    • Smooth, no jitter — draws on canvas, no DOM thrash
 * ============================================================ */
var CompassSystem = (function () {
  'use strict';

  var _initialized = false;
  var _canvas      = null;
  var _ctx         = null;
  var _wrapper     = null;

  var W = 320;
  var H = 34;

  /* pixels per degree */
  var PPD = W / 60; /* 60° visible arc */

  /* ── Get camera yaw (0=north, CW positive) ── */
  function _getYawDeg() {
    try {
      var cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
      if (!cam) return 0;
      var d = new THREE.Vector3();
      cam.getWorldDirection(d);
      /* atan2(x, -z) gives yaw: 0 = -Z axis = "into screen" = north convention */
      var rad = Math.atan2(d.x, -d.z);
      var deg = (rad * 180 / Math.PI + 360) % 360;
      return deg;
    } catch(e) { return 0; }
  }

  /* Bearing from player to world position */
  function _bearingTo(wx, wz) {
    try {
      var p = window.player && window.player.position;
      if (!p) return null;
      var dx = wx - p.x;
      var dz = wz - p.z;
      var rad = Math.atan2(dx, -dz);
      return (rad * 180 / Math.PI + 360) % 360;
    } catch(e) { return null; }
  }

  /* Angular distance from center (shortest path, signed) */
  function _delta(bearing, center) {
    var d = ((bearing - center) + 540) % 360 - 180;
    return d; /* negative=left, positive=right */
  }

  /* ── Draw ─────────────────────────────────── */
  var CARDINALS = [
    [0,   'N'], [45,  'NE'], [90,  'E'], [135, 'SE'],
    [180, 'S'], [225, 'SW'], [270, 'W'], [315, 'NW'],
    [360, 'N'],
  ];

  function _draw() {
    var ctx = _ctx;
    var ctr = W / 2;
    var yaw = _getYawDeg();

    ctx.clearRect(0, 0, W, H);

    /* Background bar */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, 'rgba(0,6,16,0.88)');
    bg.addColorStop(1, 'rgba(0,10,24,0.72)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* Top + bottom border lines */
    ctx.strokeStyle = 'rgba(68,170,255,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0);      ctx.lineTo(W, 0);      ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H - 1);  ctx.lineTo(W, H - 1);  ctx.stroke();

    /* Tick marks + cardinal labels */
    for (var i = 0; i < CARDINALS.length; i++) {
      var bear = CARDINALS[i][0];
      var label = CARDINALS[i][1];
      var delta = _delta(bear, yaw);
      if (Math.abs(delta) > 32) continue; /* outside visible arc */
      var sx = ctr + delta * PPD;

      var isCardinal = (bear % 90 === 0);
      var tickH = isCardinal ? 10 : 6;
      ctx.strokeStyle = isCardinal ? 'rgba(68,170,255,0.8)' : 'rgba(68,170,255,0.35)';
      ctx.lineWidth = isCardinal ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, tickH);
      ctx.stroke();

      if (label) {
        var isN = (label === 'N');
        ctx.font = isCardinal ? 'bold 9px monospace' : '8px monospace';
        ctx.fillStyle = isN ? 'rgba(255,80,80,0.9)' : 'rgba(68,170,255,0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(label, sx, tickH + 9);
      }

      /* Small degree ticks every 10° */
      var tenStart = Math.ceil((yaw - 31) / 10) * 10;
      for (var deg10 = tenStart; deg10 <= yaw + 31; deg10 += 10) {
        if (deg10 % 45 === 0) continue; /* already drawn above */
        var d10 = _delta(((deg10 % 360) + 360) % 360, yaw);
        if (Math.abs(d10) > 31) continue;
        var sx10 = ctr + d10 * PPD;
        ctx.strokeStyle = 'rgba(68,170,255,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx10, 0); ctx.lineTo(sx10, 4); ctx.stroke();
      }
    }

    /* Marked-enemy bearing ticks (Binoculars integration) */
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var enemies = Enemies.getAll();
        for (var ei = 0; ei < enemies.length; ei++) {
          var en = enemies[ei];
          if (!en || !en.mesh || en.dead) continue;
          /* Only show marked enemies (color changed to gold by Binoculars) */
          var col = en.mesh.children[0] && en.mesh.children[0].material && en.mesh.children[0].material.color;
          if (!col) continue;
          /* Gold hue heuristic: high R, medium G, low B */
          if (col.r < 0.8 || col.g < 0.5 || col.b > 0.3) continue;
          var eb = _bearingTo(en.mesh.position.x, en.mesh.position.z);
          if (eb === null) continue;
          var ed = _delta(eb, yaw);
          if (Math.abs(ed) > 32) continue;
          var esx = ctr + ed * PPD;
          ctx.fillStyle = '#ffcc44';
          ctx.beginPath();
          ctx.moveTo(esx, H - 4);
          ctx.lineTo(esx - 4, H - 1);
          ctx.lineTo(esx + 4, H - 1);
          ctx.closePath();
          ctx.fill();
        }
      }
    } catch(e) {}

    /* Objective bearing tick (from MissionSystem if available) */
    try {
      var obj = window.MissionSystem && MissionSystem.getObjectivePosition ? MissionSystem.getObjectivePosition() : null;
      if (obj) {
        var ob = _bearingTo(obj.x, obj.z);
        if (ob !== null) {
          var od = _delta(ob, yaw);
          if (Math.abs(od) <= 32) {
            var osx = ctr + od * PPD;
            ctx.fillStyle = '#44ff88';
            ctx.fillRect(osx - 1.5, 0, 3, 6);
          }
        }
      }
    } catch(e) {}

    /* Center heading marker */
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ctr, 0);
    ctx.lineTo(ctr, 6);
    ctx.stroke();
    /* Triangle pointer */
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(ctr, 7);
    ctx.lineTo(ctr - 3, 12);
    ctx.lineTo(ctr + 3, 12);
    ctx.closePath();
    ctx.fill();

    /* Bearing readout */
    var bearStr = String(Math.round(yaw) % 360);
    while (bearStr.length < 3) bearStr = '0' + bearStr;
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(bearStr + '°', ctr, H - 5);

    /* Left/Right fade masks */
    var fadeW = 32;
    var fL = ctx.createLinearGradient(0, 0, fadeW, 0);
    fL.addColorStop(0, 'rgba(0,6,16,0.95)');
    fL.addColorStop(1, 'rgba(0,6,16,0)');
    ctx.fillStyle = fL;
    ctx.fillRect(0, 0, fadeW, H);

    var fR = ctx.createLinearGradient(W - fadeW, 0, W, 0);
    fR.addColorStop(0, 'rgba(0,6,16,0)');
    fR.addColorStop(1, 'rgba(0,6,16,0.95)');
    ctx.fillStyle = fR;
    ctx.fillRect(W - fadeW, 0, fadeW, H);
  }

  /* ── rAF loop ───────────────────────────── */
  function _tick() {
    try { _draw(); } catch(e) {}
    requestAnimationFrame(_tick);
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;

    _wrapper = document.createElement('div');
    _wrapper.id = 'compass-wrap';
    _wrapper.style.cssText = [
      'position:fixed;top:0;left:50%;transform:translateX(-50%);',
      'z-index:220;pointer-events:none;',
    ].join('');

    _canvas = document.createElement('canvas');
    _canvas.width  = W;
    _canvas.height = H;
    _canvas.style.cssText = 'display:block;';
    _ctx = _canvas.getContext('2d');
    _wrapper.appendChild(_canvas);
    document.body.appendChild(_wrapper);

    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.CompassSystem = CompassSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { CompassSystem.init(); });
} else {
  CompassSystem.init();
}
