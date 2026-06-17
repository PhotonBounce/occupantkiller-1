/* ============================================================
 *  WAVE-COUNTDOWN.JS — dramatic 3-2-1 interwave countdown (passive)
 *
 *  Watches GameManager.getCurrentWave(). When the wave number
 *  increments (new wave starting), fires a 3-2-1 countdown in the
 *  centre of the screen before the wave ENGAGE banner.
 *
 *  Each digit scales in (1.8→1.0) and pulses out, taking 0.8s.
 *  After 0, "ENGAGE!" flashes red for 0.5s.
 *  Uses CSS keyframes. z-index 496 (below wave-intro-card 498, boss-warning 497).
 *  Passive — no keybind.
 * ============================================================ */
var WaveCountdown = (function () {
  'use strict';

  var DIGIT_DUR  = 0.75;   /* seconds per digit */
  var ENGAGE_DUR = 0.6;
  var COOLDOWN   = 3.0;    /* no repeat within N seconds of last trigger */

  var _el       = null;
  var _init     = false;
  var _lastWave = -1;
  var _lastTs   = 0;
  var _lastFire = 0;
  var _frameN   = 0;

  function _buildStyle() {
    var s = document.createElement('style');
    s.textContent = [
      '@keyframes wcdPop{',
        '0%{opacity:0;transform:translate(-50%,-50%) scale(2.0)}',
        '18%{opacity:1;transform:translate(-50%,-50%) scale(0.95)}',
        '70%{opacity:1;transform:translate(-50%,-50%) scale(1.0)}',
        '100%{opacity:0;transform:translate(-50%,-50%) scale(0.6)}',
      '}',
      '#wcd-wrap{',
        'position:fixed;left:50%;top:46%;',
        'transform:translate(-50%,-50%);',
        'pointer-events:none;z-index:496;',
        'display:none;',
        'font-family:"Courier New",monospace;',
        'font-weight:900;',
        'text-align:center;',
        'white-space:nowrap;',
      '}',
      '#wcd-digit{',
        'font-size:80px;',
        'letter-spacing:-2px;',
        'color:rgba(255,255,255,0.95);',
        'text-shadow:0 0 40px rgba(80,200,255,0.9),0 2px 0 rgba(0,0,0,0.6);',
        'line-height:1;',
      '}',
      '#wcd-engage{',
        'font-size:28px;',
        'letter-spacing:8px;',
        'color:rgba(255,60,60,1);',
        'text-shadow:0 0 30px rgba(255,0,0,0.9);',
        'line-height:1;',
        'display:none;',
      '}',
    ].join('');
    document.head.appendChild(s);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'wcd-wrap';
    _el.innerHTML = '<div id="wcd-digit"></div><div id="wcd-engage">ENGAGE!</div>';
    document.body.appendChild(_el);
  }

  function _showDigit(text, isEngage, delay) {
    setTimeout(function () {
      if (!_el) return;
      var digit   = document.getElementById('wcd-digit');
      var engage  = document.getElementById('wcd-engage');
      var dur = isEngage ? ENGAGE_DUR : DIGIT_DUR;

      _el.style.display = 'block';
      if (isEngage) {
        if (digit)  digit.style.display  = 'none';
        if (engage) {
          engage.style.display = 'block';
          engage.style.animation = 'none';
          void engage.offsetWidth;
          engage.style.animation = 'wcdPop ' + dur + 's cubic-bezier(0.4,0,0.2,1) forwards';
        }
      } else {
        if (engage) engage.style.display = 'none';
        if (digit) {
          digit.style.display = 'block';
          digit.textContent = text;
          digit.style.animation = 'none';
          void digit.offsetWidth;
          digit.style.animation = 'wcdPop ' + dur + 's cubic-bezier(0.4,0,0.2,1) forwards';
        }
      }

      setTimeout(function () {
        if (!isEngage) return;
        if (_el) _el.style.display = 'none';
      }, dur * 1000);
    }, delay);
  }

  function _fire() {
    _showDigit('3', false, 0);
    _showDigit('2', false, DIGIT_DUR * 1000);
    _showDigit('1', false, DIGIT_DUR * 1000 * 2);
    _showDigit('', true,  DIGIT_DUR * 1000 * 3);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Check wave every 30 frames (~2Hz) */
    if (_frameN % 30 !== 0) return;
    if (now - _lastFire < COOLDOWN) return;

    try {
      var w = null;
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        w = GameManager.getCurrentWave();
      }
      if (w === null || w === undefined) return;
      if (_lastWave < 0) { _lastWave = w; return; }

      if (w > _lastWave) {
        _lastWave = w;
        _lastFire = now;
        _fire();
      }
    } catch (er) {}
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildStyle();
    _buildDom();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.WaveCountdown = WaveCountdown;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { WaveCountdown.init(); });
} else {
  WaveCountdown.init();
}
