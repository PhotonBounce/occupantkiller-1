/* ============================================================
 *  MUZZLE-FLASH-SCREEN.JS — Subtle screen flash on each shot (passive)
 *
 *  Detects weapon fire via clip count drop and flashes a very faint
 *  warm-white radial gradient at screen center — simulating muzzle
 *  light briefly illuminating the scene.
 *
 *  Alpha by weapon type:
 *    LAUNCHER → 0.18  (most dramatic)
 *    SHOTGUN  → 0.12
 *    SNIPER   → 0.10
 *    RIFLE    → 0.07
 *    default  → 0.06
 *
 *  Flash decays in FLASH_DECAY=0.06s (very fast). Canvas z-index 304.
 *  Passive — no keybind.
 * ============================================================ */
var MuzzleFlashScreen = (function () {
  'use strict';

  var FLASH_DECAY = 0.06;  /* seconds to zero */

  var TYPE_ALPHA = {
    LAUNCHER: 0.18,
    SHOTGUN:  0.12,
    SNIPER:   0.10,
    RIFLE:    0.07,
  };
  var DEFAULT_ALPHA = 0.06;

  var _canvas    = null;
  var _ctx       = null;
  var _init      = false;
  var _lastTs    = 0;
  var _frameN    = 0;
  var _flashAmt  = 0;  /* current flash intensity 0-1 */
  var _prevClip  = null;

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:304;';
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

  function _getWeaponAlpha() {
    try {
      if (typeof Weapons !== 'undefined' && Weapons.getCurrentType) {
        var t = (Weapons.getCurrentType() || '').toUpperCase();
        for (var k in TYPE_ALPHA) {
          if (t.indexOf(k) >= 0) return TYPE_ALPHA[k];
        }
      }
    } catch (e) {}
    return DEFAULT_ALPHA;
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Shot detection every frame */
    try {
      if (typeof Weapons !== 'undefined' && Weapons.getState) {
        var st  = Weapons.getState();
        var isMelee = (typeof Weapons.getCurrentType === 'function'
          && (Weapons.getCurrentType() || '').toUpperCase().indexOf('MELEE') >= 0);
        if (!isMelee && st && _prevClip !== null && st.clip < _prevClip) {
          _flashAmt = _getWeaponAlpha();
        }
        _prevClip = st ? st.clip : _prevClip;
      }
    } catch (e) {}

    /* Decay */
    if (_flashAmt > 0) _flashAmt = Math.max(0, _flashAmt - dt / FLASH_DECAY * _flashAmt);
    if (_flashAmt < 0.002) _flashAmt = 0;

    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    if (_flashAmt < 0.003) return;

    var W = _canvas.width; var H = _canvas.height;
    var grad = _ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.55);
    grad.addColorStop(0,   'rgba(255,240,200,' + _flashAmt.toFixed(3) + ')');
    grad.addColorStop(0.5, 'rgba(255,220,150,' + (_flashAmt * 0.4).toFixed(3) + ')');
    grad.addColorStop(1,   'rgba(255,200,100,0)');
    _ctx.fillStyle = grad;
    _ctx.fillRect(0, 0, W, H);
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.MuzzleFlashScreen = MuzzleFlashScreen;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { MuzzleFlashScreen.init(); });
} else {
  MuzzleFlashScreen.init();
}