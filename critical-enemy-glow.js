/* ============================================================
 *  CRITICAL-ENEMY-GLOW.JS — "Finish them" ring on near-dead enemies (passive)
 *
 *  Enemies at ≤20% HP get a pulsing red ring at their projected
 *  screen position, signalling a kill opportunity.
 *
 *  Ring radius = 24px, pulses at 2.5Hz.
 *  DANGER-type enemies at critical HP pulse faster (3.5Hz) and glow
 *  more intensely — high priority targets.
 *
 *  Only draws on-screen enemies within 100 world units.
 *  Canvas z-index 398. Max 10 drawn per frame. Passive, no keybind.
 * ============================================================ */
var CriticalEnemyGlow = (function () {
  'use strict';

  var HP_THRESH  = 0.20;
  var RING_R     = 24;
  var RING_W     = 2.0;
  var PULSE_NORM = 2.5;
  var PULSE_DANG = 3.5;
  var MAX_DIST   = 100;
  var MAX_DRAW   = 10;

  var DANGER_TYPES = { SNIPER:1, HEAVY:1, TANK:1, MECH:1, SPETSNAZ:1, WAGNER:1 };

  var _canvas = null;
  var _ctx    = null;
  var _init   = false;
  var _lastTs = 0;
  var _phase  = 0;
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
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:398;';
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
    _phase += dt;

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    if (_frameN % 2 !== 0) return;

    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return;

    var player = null;
    try { player = window.player; } catch (e) {}

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all  = Enemies.getAll();
      var drawn = 0;

      for (var i = 0; i < all.length; i++) {
        if (drawn >= MAX_DRAW) break;
        var e = all[i];
        if (!e || !e.mesh) continue;
        if (e.hp === undefined || e.hp <= 0) continue;

        var hpFrac = Math.max(0, Math.min(1, e.hp / (e.maxHp || 100)));
        if (hpFrac > HP_THRESH) continue;

        /* Distance cull */
        if (player && player.position) {
          var dx = e.mesh.position.x - player.position.x;
          var dz = e.mesh.position.z - player.position.z;
          if (dx*dx + dz*dz > MAX_DIST * MAX_DIST) continue;
        }

        var v = new THREE.Vector3(e.mesh.position.x, e.mesh.position.y + 1.0, e.mesh.position.z);
        v.project(cam);
        if (v.z > 1) continue;
        var sx = (v.x * 0.5 + 0.5) * _canvas.width;
        var sy = (-v.y * 0.5 + 0.5) * _canvas.height;
        if (sx < -40 || sx > _canvas.width + 40 || sy < -40 || sy > _canvas.height + 40) continue;

        var isDanger = !!(DANGER_TYPES[e.type]);
        var hz       = isDanger ? PULSE_DANG : PULSE_NORM;
        var pulse    = (Math.sin(_phase * hz * Math.PI * 2) * 0.5 + 0.5);
        var alpha    = 0.5 + pulse * 0.5;
        var r        = RING_R * (0.85 + pulse * 0.2);

        _ctx.save();
        _ctx.strokeStyle = 'rgba(255,' + Math.round(30 + pulse * 30) + ',30,' + alpha.toFixed(2) + ')';
        _ctx.lineWidth   = RING_W + (isDanger ? 0.8 : 0);
        _ctx.shadowColor = 'rgba(255,40,0,0.8)';
        _ctx.shadowBlur  = 8 + pulse * 6;
        _ctx.beginPath();
        _ctx.arc(sx, sy, r, 0, Math.PI * 2);
        _ctx.stroke();
        _ctx.restore();
        drawn++;
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

window.CriticalEnemyGlow = CriticalEnemyGlow;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { CriticalEnemyGlow.init(); });
} else {
  CriticalEnemyGlow.init();
}