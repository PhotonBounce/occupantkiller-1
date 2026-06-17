/* ============================================================
 *  ENEMY-HEALTH-BARS.JS — HP bars above on-screen enemies (passive)
 *
 *  Projects each living enemy to screen space and draws a small
 *  HP bar above their head. Bars only visible within 80 units.
 *
 *  Bar appearance:
 *    Background: dark semi-transparent rect
 *    Fill colour: green → orange → red by HP ratio
 *    DANGER types (SNIPER/HEAVY/TANK/MECH/SPETSNAZ/WAGNER): wider bar
 *
 *  Bars fade out when enemy is off-screen. Max 24 drawn per frame.
 *  Canvas z-index 397. No keybind. Purely passive.
 * ============================================================ */
var EnemyHealthBars = (function () {
  'use strict';

  var MAX_DRAW   = 24;
  var MAX_DIST   = 80;   /* world units */
  var BAR_W      = 28;
  var BAR_H      = 3;
  var BAR_Y_OFF  = -18;  /* px above projected head */
  var DANGER_BW  = 36;

  var DANGER_TYPES = { SNIPER:1, HEAVY:1, TANK:1, MECH:1, SPETSNAZ:1, WAGNER:1 };

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
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:397;';
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

  function _hpColor(f) {
    if (f > 0.6) return [80, 200, 80];
    if (f > 0.3) return [230, 150, 40];
    return [220, 50, 50];
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    if (_frameN % 2 !== 0) return;

    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return;

    var player = null;
    try { player = window.player; } catch (e) {}

    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      var drawn = 0;

      for (var i = 0; i < all.length; i++) {
        if (drawn >= MAX_DRAW) break;
        var e = all[i];
        if (!e || !e.mesh) continue;
        if (e.hp !== undefined && e.hp <= 0) continue;

        /* Distance cull */
        if (player && player.position) {
          var dx = e.mesh.position.x - player.position.x;
          var dz = e.mesh.position.z - player.position.z;
          if (dx*dx + dz*dz > MAX_DIST * MAX_DIST) continue;
        }

        var hpFrac = 1;
        if (e.hp !== undefined) hpFrac = Math.max(0, Math.min(1, e.hp / (e.maxHp || 100)));

        var v = new THREE.Vector3(e.mesh.position.x, e.mesh.position.y + 2.0, e.mesh.position.z);
        v.project(cam);
        if (v.z > 1 || v.z < -1) continue;
        var sx = (v.x * 0.5 + 0.5) * _canvas.width;
        var sy = (-v.y * 0.5 + 0.5) * _canvas.height + BAR_Y_OFF;

        if (sx < -40 || sx > _canvas.width + 40 || sy < -20 || sy > _canvas.height + 20) continue;

        var isDanger = !!(DANGER_TYPES[e.type]);
        var bw = isDanger ? DANGER_BW : BAR_W;
        var bx = sx - bw / 2;
        var by = sy;
        var col = _hpColor(hpFrac);

        var ctx = _ctx;
        ctx.save();

        /* Background */
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(bx - 1, by - 1, bw + 2, BAR_H + 2);

        /* Fill */
        ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0.85)';
        ctx.fillRect(bx, by, Math.max(1, bw * hpFrac), BAR_H);

        ctx.restore();
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

window.EnemyHealthBars = EnemyHealthBars;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { EnemyHealthBars.init(); });
} else {
  EnemyHealthBars.init();
}