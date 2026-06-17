/* ============================================================
 *  SNIPER-SCOPE.JS — Tactical zoom scope (Alt+Y)
 *
 *  Toggle: first Alt+Y zooms in (camera.fov 75→20°), second
 *  zooms out. While zoomed:
 *  - Canvas scope overlay: black mask outside circle, crosshair
 *    lines, mil-dot markings, distance readout to nearest enemy.
 *  - Smooth FOV transition (0.15s lerp).
 *  - HUD label shows "SCOPE ON / OFF".
 *  Auto-zooms out on wave change.
 * ============================================================ */
var SniperScope = (function () {
  'use strict';

  var FOV_NORMAL  = 75;
  var FOV_ZOOM    = 20;
  var FOV_SPEED   = 12;   /* lerp rate (higher = snappier) */

  var _zoomed     = false;
  var _fovCurrent = FOV_NORMAL;
  var _init       = false;
  var _lastTs     = 0;
  var _waveWas    = -1;

  var _canvas     = null;
  var _ctx        = null;
  var _hintEl     = null;
  var _cam        = null;

  /* ── Get camera ──────────────────────────── */
  function _getCamera() {
    if (!_cam) {
      try { _cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {}
    }
    return _cam;
  }

  /* ── Hint ────────────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'scope-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', top: '12px', right: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(180,220,180,0.45)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[Alt+Y] SCOPE';
    document.body.appendChild(_hintEl);
  }

  /* ── Scope canvas overlay ─────────────────── */
  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    Object.assign(_canvas.style, {
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 280, display: 'none'
    });
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
  }

  /* ── Nearest enemy distance ───────────────── */
  function _nearestEnemyDist() {
    var player = window.player;
    if (!player || !player.position) return null;
    var best = Infinity;
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || e.dead || !e.mesh) continue;
          var dx = e.mesh.position.x - player.position.x;
          var dz = e.mesh.position.z - player.position.z;
          var d  = Math.sqrt(dx*dx + dz*dz);
          if (d < best) best = d;
        }
      }
    } catch (e) {}
    return best < Infinity ? Math.round(best) : null;
  }

  /* ── Draw scope overlay ───────────────────── */
  function _drawScope(blend) {
    if (!_ctx || !_canvas) return;
    var w = window.innerWidth, h = window.innerHeight;
    if (_canvas.width !== w || _canvas.height !== h) { _canvas.width = w; _canvas.height = h; }
    _ctx.clearRect(0, 0, w, h);

    var cx = w / 2, cy = h / 2;
    var r  = Math.min(w, h) * 0.42;

    /* Black mask outside scope circle */
    _ctx.fillStyle = 'rgba(0,0,0,' + (blend * 0.96) + ')';
    _ctx.beginPath();
    _ctx.rect(0, 0, w, h);
    _ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    _ctx.fill('evenodd');

    /* Scope ring border */
    _ctx.strokeStyle = 'rgba(120,180,120,' + blend + ')';
    _ctx.lineWidth   = 2;
    _ctx.beginPath();
    _ctx.arc(cx, cy, r, 0, Math.PI * 2);
    _ctx.stroke();

    /* Crosshair lines */
    _ctx.strokeStyle = 'rgba(120,200,120,' + (blend * 0.85) + ')';
    _ctx.lineWidth   = 1;
    /* Horizontal */
    _ctx.beginPath(); _ctx.moveTo(cx - r + 2, cy); _ctx.lineTo(cx - r * 0.12, cy); _ctx.stroke();
    _ctx.beginPath(); _ctx.moveTo(cx + r * 0.12, cy); _ctx.lineTo(cx + r - 2, cy); _ctx.stroke();
    /* Vertical */
    _ctx.beginPath(); _ctx.moveTo(cx, cy - r + 2); _ctx.lineTo(cx, cy - r * 0.12); _ctx.stroke();
    _ctx.beginPath(); _ctx.moveTo(cx, cy + r * 0.12); _ctx.lineTo(cx, cy + r - 2); _ctx.stroke();
    /* Center dot */
    _ctx.fillStyle = 'rgba(120,220,120,' + blend + ')';
    _ctx.beginPath(); _ctx.arc(cx, cy, 2, 0, Math.PI * 2); _ctx.fill();

    /* Mil-dots on horizontal */
    var milSpacing = r * 0.18;
    for (var m = 1; m <= 3; m++) {
      _ctx.beginPath(); _ctx.arc(cx + m * milSpacing, cy, 2.5, 0, Math.PI * 2); _ctx.fill();
      _ctx.beginPath(); _ctx.arc(cx - m * milSpacing, cy, 2.5, 0, Math.PI * 2); _ctx.fill();
    }
    /* Vertical mil-dots */
    for (var mv = 1; mv <= 2; mv++) {
      _ctx.beginPath(); _ctx.arc(cx, cy + mv * milSpacing, 2.5, 0, Math.PI * 2); _ctx.fill();
      _ctx.beginPath(); _ctx.arc(cx, cy - mv * milSpacing, 2.5, 0, Math.PI * 2); _ctx.fill();
    }

    /* Range readout */
    var dist = _nearestEnemyDist();
    if (dist !== null) {
      _ctx.fillStyle = 'rgba(120,220,120,' + (blend * 0.8) + ')';
      _ctx.font = '10px Courier New';
      _ctx.textAlign = 'right';
      _ctx.fillText(dist + 'm', cx + r - 10, cy + r - 20);
    }

    /* Scope label */
    _ctx.fillStyle = 'rgba(120,220,120,' + (blend * 0.6) + ')';
    _ctx.font      = '9px Courier New';
    _ctx.textAlign = 'left';
    _ctx.letterSpacing = '0.1em';
    _ctx.fillText('6×  ACOG', cx - r + 10, cy - r + 18);
  }

  /* ── Toggle ───────────────────────────────── */
  function _toggle() {
    _zoomed = !_zoomed;
    _hintEl.textContent = _zoomed ? '[Alt+Y] SCOPE ON' : '[Alt+Y] SCOPE';
    _hintEl.style.color = _zoomed ? 'rgba(120,220,120,0.9)' : 'rgba(180,220,180,0.45)';
    if (!_zoomed && _canvas) { _canvas.style.display = 'none'; }
    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup(_zoomed ? '🔭 SCOPE ON' : '🔭 SCOPE OFF'); } catch (e) {}
  }

  /* ── rAF tick ─────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt   = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs  = ts;

    /* Auto-unzoom on wave change */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w;
          if (_zoomed) { _zoomed = false; if (_canvas) _canvas.style.display = 'none'; _hintEl.textContent = '[Alt+Y] SCOPE'; _hintEl.style.color = 'rgba(180,220,180,0.45)'; }
        }
      }
    } catch (e) {}

    /* FOV lerp */
    var targetFov = _zoomed ? FOV_ZOOM : FOV_NORMAL;
    _fovCurrent += (targetFov - _fovCurrent) * Math.min(1, FOV_SPEED * dt);
    var cam = _getCamera();
    if (cam && Math.abs(_fovCurrent - cam.fov) > 0.05) {
      cam.fov = _fovCurrent;
      cam.updateProjectionMatrix();
    }

    /* Draw scope overlay */
    if (_zoomed || Math.abs(_fovCurrent - FOV_NORMAL) > 1) {
      if (_canvas) _canvas.style.display = 'block';
      var blend = Math.max(0, Math.min(1, (FOV_NORMAL - _fovCurrent) / (FOV_NORMAL - FOV_ZOOM)));
      if (blend > 0.01) _drawScope(blend);
      else if (_canvas) _canvas.style.display = 'none';
    }
  }

  /* ── Key handler ──────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyY' && e.altKey && !e.repeat) {
      e.preventDefault();
      _toggle();
    }
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHint();
    _buildCanvas();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.SniperScope = SniperScope;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { SniperScope.init(); });
} else {
  SniperScope.init();
}
