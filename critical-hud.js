/* ============================================================
 *  CRITICAL-HUD.JS — Low-HP vignette + emergency stim
 *
 *  Below 25% HP: pulsing red vignette scales with damage taken.
 *  Below 10% HP: emergency combat stim AUTO-fires (1 per wave),
 *  restoring 30 HP instantly — "LAST STAND" moment. Screen flash
 *  + camera shake on stim trigger. No key binding — automatic.
 * ============================================================ */
var CriticalHUD = (function () {
  'use strict';

  var STIM_HP_THRESHOLD = 0.10;  /* stim fires when HP < 10% max */
  var STIM_RESTORE      = 30;
  var STIM_STOCK_MAX    = 1;

  var _stimStock  = STIM_STOCK_MAX;
  var _stimUsed   = false;
  var _waveWas    = -1;
  var _init       = false;
  var _lastTs     = 0;
  var _canvas, _ctx;
  var _flashT     = 0;           /* white flash timer on stim */

  /* ── Build DOM ──────────────────────────── */
  function _buildDOM() {
    _canvas = document.createElement('canvas');
    _canvas.id = 'crit-canvas';
    Object.assign(_canvas.style, {
      position:      'fixed',
      top:           0, left: 0,
      width:         '100%', height: '100%',
      pointerEvents: 'none',
      zIndex:        290,
      display:       'none'
    });
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
  }

  function _resize() {
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  /* ── Draw vignette overlay ──────────────── */
  function _drawVignette(t, pct) {
    var W = _canvas.width, H = _canvas.height;
    _ctx.clearRect(0, 0, W, H);

    /* Pulse rate increases as HP drops */
    var rate  = pct < 0.10 ? 7.5 : pct < 0.18 ? 4.5 : 2.5;
    var pulse = 0.5 + Math.sin(t * rate) * 0.5;  /* 0→1 */

    /* Vignette intensity: 0.22 at 25%, up to 0.75 at near-death */
    var base  = 1 - (pct / 0.25);                 /* 0 at 25%, 1 at 0% */
    var intens = (0.20 + base * 0.55) * (0.8 + pulse * 0.2);

    var vg = _ctx.createRadialGradient(W / 2, H / 2, H * 0.20, W / 2, H / 2, H * 0.70);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(190,0,0,' + Math.min(0.88, intens).toFixed(2) + ')');
    _ctx.fillStyle = vg;
    _ctx.fillRect(0, 0, W, H);

    /* Near-death: red scanline flash on beat peaks */
    if (pct < 0.10 && pulse > 0.88) {
      _ctx.fillStyle = 'rgba(255,0,0,0.09)';
      _ctx.fillRect(0, 0, W, H);
    }

    /* Stim flash — white bloom fading */
    if (_flashT > 0) {
      var flashAlpha = (_flashT / 0.35) * 0.55;
      _ctx.fillStyle = 'rgba(255,220,100,' + flashAlpha.toFixed(2) + ')';
      _ctx.fillRect(0, 0, W, H);
    }
  }

  /* ── Fire emergency stim ────────────────── */
  function _fireStim(player) {
    if (_stimUsed || _stimStock <= 0) return;
    _stimUsed  = true;
    _stimStock = 0;

    var restore = Math.min(STIM_RESTORE, (player.maxHp || 100) - player.hp);
    player.hp  += restore;
    if (restore > 0) {
      try { if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp); } catch (e) {}
    }

    _flashT = 0.35;

    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.45, 0.3);
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('⚡ EMERGENCY STIM — +' + restore + ' HP  LAST STAND');
    }
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    if (_flashT > 0) _flashT = Math.max(0, _flashT - dt);

    /* Restock on new wave */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) { _waveWas = w; _stimStock = STIM_STOCK_MAX; _stimUsed = false; }
      }
    } catch (e) {}

    var player = window.player;
    if (!player) return;

    var hp    = player.hp    || 0;
    var maxHp = player.maxHp || 100;
    var pct   = hp / maxHp;

    /* Auto-stim when critically low */
    if (!_stimUsed && _stimStock > 0 && pct < STIM_HP_THRESHOLD && pct > 0) {
      _fireStim(player);
    }

    /* Show / hide vignette */
    if (pct < 0.25 || _flashT > 0) {
      _canvas.style.display = 'block';
      _drawVignette(ts / 1000, Math.min(pct, 0.25));
    } else {
      _canvas.style.display = 'none';
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildDOM();
    _resize();
    window.addEventListener('resize', _resize);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.CriticalHUD = CriticalHUD;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { CriticalHUD.init(); });
} else {
  CriticalHUD.init();
}
