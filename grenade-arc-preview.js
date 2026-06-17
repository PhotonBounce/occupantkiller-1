/* ============================================================
 *  GRENADE-ARC-PREVIEW.JS — Parabolic throw arc overlay (passive)
 *
 *  Listens for Alt+C (cryo-grenade) and Alt+K (cluster-bomb) keydown.
 *  While the key combo is held: projects a parabolic arc from the
 *  player's position along camera forward vector using simulated
 *  throw physics (v0_fwd=15 u/s, v0_up=8 u/s, gravity=9.8 u/s²).
 *
 *  30 sample points over 2.8s total flight are projected to screen
 *  via camera.project() and drawn as a dotted line with a landing
 *  circle at the terminal point.
 *
 *  Separate colors: cryo = pale blue, cluster = orange.
 *  Arc hides instantly on keyup.
 * ============================================================ */
var GrenadeArcPreview = (function () {
  'use strict';

  var GRAVITY  = 9.8;
  var V0_FWD   = 15;   /* forward velocity units/sec */
  var V0_UP    = 8;    /* initial upward velocity units/sec */
  var SAMPLES  = 30;
  var FLIGHT_T = 2.8;  /* total simulation time seconds */

  var _canvas   = null;
  var _ctx      = null;
  var _init     = false;
  var _lastTs   = 0;
  var _frameN   = 0;
  var _cam      = null;
  var _active   = null;   /* null | 'cryo' | 'cluster' */

  var COLORS = {
    cryo:    { stroke: 'rgba(80, 180, 255, 0.80)', land: 'rgba(80, 180, 255, 0.50)' },
    cluster: { stroke: 'rgba(255, 130, 40, 0.80)', land: 'rgba(255, 130, 40, 0.50)' },
  };

  function _getCamera() {
    if (!_cam) {
      try { _cam = (typeof GameManager !== 'undefined' && GameManager.getCamera) ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = [
      'position:fixed;top:0;left:0;',
      'width:100%;height:100%;',
      'pointer-events:none;z-index:398;',
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

  function _drawArc(colorKey) {
    if (!_ctx) return;
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return;

    var px = 0, py = 0, pz = 0;
    try {
      if (window.player && window.player.position) {
        px = window.player.position.x;
        py = window.player.position.y + 1.6;   /* eye height */
        pz = window.player.position.z;
      }
    } catch (e) {}

    /* Camera forward direction (horizontal component) */
    var fwd = new THREE.Vector3();
    try { cam.getWorldDirection(fwd); } catch (e) { return; }
    fwd.y = 0;
    if (fwd.lengthSq() < 0.001) return;
    fwd.normalize();

    /* Project arc points */
    var pts = [];
    for (var i = 0; i <= SAMPLES; i++) {
      var t  = (i / SAMPLES) * FLIGHT_T;
      var x  = px + fwd.x * V0_FWD * t;
      var y  = py + V0_UP * t - 0.5 * GRAVITY * t * t;
      var z  = pz + fwd.z * V0_FWD * t;

      /* Clamp to terrain if available */
      if (y < (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight ? VoxelWorld.getTerrainHeight(x, z) : -999)) {
        /* Hit terrain — stop */
        break;
      }

      try {
        var v = new THREE.Vector3(x, y, z);
        v.project(cam);
        if (v.z > 1) { pts.push(null); continue; }   /* behind camera */
        var sx = (v.x * 0.5 + 0.5) * window.innerWidth;
        var sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
        pts.push({ x: sx, y: sy, wx: x, wy: y, wz: z });
      } catch (er) { pts.push(null); }
    }

    var color = COLORS[colorKey] || COLORS.cryo;
    var ctx   = _ctx;
    ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    /* Draw dotted path */
    ctx.strokeStyle  = color.stroke;
    ctx.lineWidth    = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    var started = false;
    for (var j = 0; j < pts.length; j++) {
      var p = pts[j];
      if (!p) { started = false; continue; }
      if (!started) { ctx.moveTo(p.x, p.y); started = true; }
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    /* Landing circle */
    var last = null;
    for (var k = pts.length - 1; k >= 0; k--) { if (pts[k]) { last = pts[k]; break; } }
    if (last) {
      ctx.beginPath();
      ctx.arc(last.x, last.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = color.land;
      ctx.lineWidth   = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color.stroke;
      ctx.fill();
    }

    /* Key label */
    ctx.fillStyle = color.stroke;
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'center';
    var label = colorKey === 'cryo' ? 'CRYO GRENADE' : 'CLUSTER BOMB';
    ctx.fillText(label, _canvas.width / 2, _canvas.height / 2 + 40);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    if (_frameN % 2 !== 0) return;
    _lastTs = ts;

    if (_active) {
      _drawArc(_active);
    } else if (_ctx) {
      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    }
  }

  function _onKeyDown(e) {
    if (e.altKey && (e.code === 'KeyC' || e.key === 'c' || e.key === 'C')) {
      _active = 'cryo';
    } else if (e.altKey && (e.code === 'KeyK' || e.key === 'k' || e.key === 'K')) {
      _active = 'cluster';
    }
  }

  function _onKeyUp(e) {
    if (!e.altKey || e.code === 'AltLeft' || e.code === 'AltRight') {
      _active = null;
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    window.addEventListener('keydown', _onKeyDown, { passive: true });
    window.addEventListener('keyup',   _onKeyUp,   { passive: true });
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.GrenadeArcPreview = GrenadeArcPreview;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { GrenadeArcPreview.init(); });
} else {
  GrenadeArcPreview.init();
}