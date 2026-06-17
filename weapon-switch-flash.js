/* ============================================================
 *  WEAPON-SWITCH-FLASH.JS — Radial colour sweep on weapon change (passive)
 *
 *  When the active weapon changes (detected via Weapons.getCurrentType),
 *  a brief colour-coded radial gradient ring expands from screen centre.
 *
 *  Weapon colours (matching dynamic-crosshair.js palette):
 *    RIFLE   → cyan    rgba(80,220,180)
 *    SHOTGUN → orange  rgba(255,160,50)
 *    SNIPER  → red     rgba(255,80,80)
 *    LAUNCHER→ yellow  rgba(255,220,50)
 *    MELEE   → grey    rgba(160,160,170)
 *
 *  Ring expands from 0 to RING_MAX_R=240px over LIFE=0.35s.
 *  Canvas z-index 457 (above ammo-warning 455, below kill-milestone 505).
 *  Passive — no keybind.
 * ============================================================ */
var WeaponSwitchFlash = (function () {
  'use strict';

  var LIFE        = 0.35;
  var RING_MAX_R  = 240;
  var RING_W      = 18;

  var WEAPON_COLS = {
    RIFLE:    [80,  220, 180],
    SHOTGUN:  [255, 160, 50 ],
    SNIPER:   [255, 80,  80 ],
    LAUNCHER: [255, 220, 50 ],
    MELEE:    [160, 160, 170],
  };
  var DEFAULT_COL = [140, 200, 255];

  var _canvas    = null;
  var _ctx       = null;
  var _init      = false;
  var _lastTs    = 0;
  var _prevType  = null;
  var _frameN    = 0;
  var _rings     = [];   /* {col, life, total} */

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:457;';
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

  function _getTypeKey() {
    try {
      if (typeof Weapons !== 'undefined' && Weapons.getCurrentType) {
        var t = (Weapons.getCurrentType() || '').toUpperCase();
        for (var k in WEAPON_COLS) { if (t.indexOf(k) >= 0) return k; }
        return t.slice(0, 6) || 'UNKNOWN';
      }
    } catch (e) {}
    return null;
  }

  function _colForKey(key) {
    return WEAPON_COLS[key] || DEFAULT_COL;
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Weapon change detection every 4th frame */
    if (_frameN % 4 === 0) {
      var t = _getTypeKey();
      if (t !== null && t !== _prevType) {
        if (_prevType !== null) {
          _rings.push({ col: _colForKey(t), life: LIFE, total: LIFE });
        }
        _prevType = t;
      }
    }

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    var cx = _canvas.width / 2;
    var cy = _canvas.height / 2;

    for (var j = _rings.length - 1; j >= 0; j--) {
      var r = _rings[j];
      r.life -= dt;
      if (r.life <= 0) { _rings.splice(j, 1); continue; }

      var t2  = 1 - r.life / r.total;  /* 0→1 */
      var radius = RING_MAX_R * t2;
      var alpha  = (1 - t2) * 0.45;

      var col = r.col;
      var grad = _ctx.createRadialGradient(cx, cy, Math.max(0, radius - RING_W), cx, cy, radius + RING_W);
      grad.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
      grad.addColorStop(0.4, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + alpha.toFixed(2) + ')');
      grad.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
      _ctx.fillStyle = grad;
      _ctx.beginPath();
      _ctx.arc(cx, cy, radius + RING_W, 0, Math.PI * 2);
      _ctx.fill();
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

window.WeaponSwitchFlash = WeaponSwitchFlash;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { WeaponSwitchFlash.init(); });
} else {
  WeaponSwitchFlash.init();
}