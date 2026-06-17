/* ============================================================
 *  HEALTH-PICKUP-FLASH.JS — Green edge glow on HP gain (passive)
 *
 *  When player.hp increases (health pickup, regen, wave bonus),
 *  a brief green screen-edge radial glow fades in and out.
 *
 *  Glow intensity scales with the HP amount gained:
 *    < 10 HP  → subtle pulse
 *    10–30 HP → medium
 *    > 30 HP  → strong (+text label briefly)
 *
 *  Canvas z-index 303. FADE_TIME=0.8s. Passive — no keybind.
 * ============================================================ */
var HealthPickupFlash = (function () {
  'use strict';

  var FADE_TIME  = 0.8;
  var BIG_HEAL   = 30;
  var MED_HEAL   = 10;

  var _canvas  = null;
  var _ctx     = null;
  var _labelEl = null;
  var _init    = false;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _glow    = 0;    /* 0-1 current glow */
  var _prevHp  = null;

  function _buildCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:303;';
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize);
  }

  function _buildLabel() {
    _labelEl = document.createElement('div');
    _labelEl.style.cssText = [
      'position:fixed;bottom:130px;left:50%;transform:translateX(-50%);',
      'font-family:"Courier New",monospace;font-size:11px;',
      'font-weight:bold;letter-spacing:3px;',
      'color:rgba(80,240,100,1);',
      'text-shadow:0 0 12px rgba(50,220,80,0.9);',
      'pointer-events:none;z-index:303;',
      'opacity:0;transition:opacity 0.1s ease;',
      'white-space:nowrap;',
    ].join('');
    document.body.appendChild(_labelEl);
  }

  function _resize() {
    if (!_canvas) return;
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  function _trigger(gain) {
    var intensity = gain >= BIG_HEAL ? 1.0 : (gain >= MED_HEAL ? 0.65 : 0.35);
    _glow = Math.max(_glow, intensity);

    if (gain >= BIG_HEAL && _labelEl) {
      _labelEl.textContent = '+' + Math.round(gain) + ' HP';
      _labelEl.style.opacity = '1';
      var lbl = _labelEl;
      setTimeout(function () { if (lbl) lbl.style.opacity = '0'; }, 900);
    }
  }

  function _draw() {
    var ctx = _ctx;
    var W   = _canvas.width; var H = _canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (_glow < 0.01) return;

    var grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.25, W/2, H/2, Math.max(W,H)*0.65);
    grad.addColorStop(0,   'rgba(50,200,80,0)');
    grad.addColorStop(0.6, 'rgba(40,180,70,' + (_glow * 0.12).toFixed(3) + ')');
    grad.addColorStop(1,   'rgba(20,140,50,' + (_glow * 0.30).toFixed(3) + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.08, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    if (_frameN % 2 === 0) {
      try {
        if (window.player && window.player.hp !== undefined) {
          var hp = window.player.hp;
          if (_prevHp !== null && hp > _prevHp + 0.5) {
            _trigger(hp - _prevHp);
          }
          _prevHp = hp;
        }
      } catch (e) {}
    }

    if (_glow > 0) {
      _glow = Math.max(0, _glow - dt / FADE_TIME);
    }

    if (_ctx) _draw();
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildCanvas();
    _buildLabel();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.HealthPickupFlash = HealthPickupFlash;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { HealthPickupFlash.init(); });
} else {
  HealthPickupFlash.init();
}