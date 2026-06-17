/* ============================================================
 *  OFFSCREEN-ARROWS.JS — Edge arrows for off-screen enemies (passive)
 *
 *  Uses camera.project() same as enemy-healthbars. Enemies that
 *  project outside the viewport (or behind the camera) get a small
 *  red triangle arrow placed on the corresponding screen edge,
 *  pointing inward toward the enemy.
 *
 *  Arrows are drawn on a fullscreen canvas.
 *  Max 8 arrows rendered (closest enemies prioritised).
 *  Only enemies within DETECT_RANGE world units shown.
 * ============================================================ */
var OffscreenArrows = (function () {
  'use strict';

  var DETECT_RANGE  = 80;    /* only show arrows for enemies within this range */
  var EDGE_PAD      = 32;    /* px inset from screen edge */
  var ARROW_SIZE    = 10;    /* half-size of triangle tip (px) */
  var MAX_ARROWS    = 8;
  var ARROW_COLOR   = 'rgba(255, 60, 60, 0.85)';
  var ARROW_OUTLINE = 'rgba(0, 0, 0, 0.55)';

  var _canvas = null;
  var _ctx    = null;
  var _init   = false;
  var _lastTs = 0;
  var _frameN = 0;
  var _cam    = null;

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
      'pointer-events:none;z-index:375;',
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

  function _drawArrow(cx, cy, angle) {
    /* Draw a triangle at (cx, cy) pointing in `angle` direction (rad from up) */
    var ctx = _ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    var h = ARROW_SIZE * 1.8;   /* triangle height */
    var w = ARROW_SIZE;         /* half-base width */

    ctx.beginPath();
    ctx.moveTo(0, -h);          /* tip */
    ctx.lineTo(-w, h * 0.4);
    ctx.lineTo(w, h * 0.4);
    ctx.closePath();

    ctx.strokeStyle = ARROW_OUTLINE;
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.fillStyle   = ARROW_COLOR;
    ctx.fill();

    ctx.restore();
  }

  function _project(ex, ey, ez) {
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return null;
    try {
      var v = new THREE.Vector3(ex, ey, ez);
      v.project(cam);
      return v;
    } catch (e) { return null; }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    if (_frameN % 3 !== 0) return;   /* ~20fps update */
    _lastTs = ts;

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    var W = _canvas.width;
    var H = _canvas.height;
    var cx = W / 2, cy = H / 2;

    /* Player pos for range check */
    var plx = 0, ply = 0, plz = 0;
    try {
      if (window.player && window.player.position) {
        plx = window.player.position.x;
        ply = window.player.position.y;
        plz = window.player.position.z;
      }
    } catch (e) {}

    /* Collect off-screen enemies sorted by distance */
    var candidates = [];
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0)) continue;
        var ep = e.mesh.position;

        /* Range check */
        var dx = ep.x - plx, dy = ep.y - ply, dz = ep.z - plz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > DETECT_RANGE) continue;

        /* Project */
        var v = _project(ep.x, ep.y + 1.0, ep.z);
        if (!v) continue;

        /* Behind camera: v.z > 1 */
        var behindCam = v.z > 1;
        var sx = (v.x * 0.5 + 0.5) * W;
        var sy = (-v.y * 0.5 + 0.5) * H;
        var MARGIN = 10;
        var inFrustum = !behindCam && sx >= MARGIN && sx <= W - MARGIN && sy >= MARGIN && sy <= H - MARGIN;

        if (!inFrustum) {
          candidates.push({ sx: behindCam ? W - sx : sx, sy: behindCam ? H - sy : sy, dist: dist });
        }
      }
    } catch (er) {}

    /* Sort by distance, take closest MAX_ARROWS */
    candidates.sort(function (a, b) { return a.dist - b.dist; });
    if (candidates.length > MAX_ARROWS) candidates.length = MAX_ARROWS;

    /* Draw arrows */
    for (var j = 0; j < candidates.length; j++) {
      var c = candidates[j];

      /* Direction from screen centre to projected point */
      var vx = c.sx - cx;
      var vy = c.sy - cy;
      var len = Math.sqrt(vx * vx + vy * vy);
      if (len < 1) continue;
      vx /= len; vy /= len;

      /* Find intersection with screen rectangle at EDGE_PAD inset */
      var left = EDGE_PAD, right = W - EDGE_PAD, top = EDGE_PAD, bottom = H - EDGE_PAD;
      var tMin = Infinity;
      var edges = [
        { t: vx !== 0 ? (left   - cx) / vx : Infinity },
        { t: vx !== 0 ? (right  - cx) / vx : Infinity },
        { t: vy !== 0 ? (top    - cy) / vy : Infinity },
        { t: vy !== 0 ? (bottom - cy) / vy : Infinity },
      ];
      for (var k = 0; k < edges.length; k++) {
        if (edges[k].t > 0 && edges[k].t < tMin) {
          var ex2 = cx + vx * edges[k].t;
          var ey2 = cy + vy * edges[k].t;
          if (ex2 >= left - 1 && ex2 <= right + 1 && ey2 >= top - 1 && ey2 <= bottom + 1) {
            tMin = edges[k].t;
          }
        }
      }
      if (!isFinite(tMin)) continue;

      var ax = cx + vx * tMin;
      var ay = cy + vy * tMin;

      /* Angle: 0 = up, clockwise */
      var arrowAngle = Math.atan2(vx, -vy);
      _drawArrow(ax, ay, arrowAngle);
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

window.OffscreenArrows = OffscreenArrows;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { OffscreenArrows.init(); });
} else {
  OffscreenArrows.init();
}