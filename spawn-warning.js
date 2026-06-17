/* ============================================================
 *  SPAWN-WARNING.JS — "INCOMING!" alert when enemies spawn (passive)
 *
 *  Watches Enemies.getAll().length every 6 frames. If count jumps
 *  by ≥ 3 in a single tick, it means a new batch spawned.
 *  Displays "⚠ INCOMING! +N" centered text that flashes in and fades.
 *  Also plays a brief screen flash (red tint) on the game canvas.
 *
 *  Cooldown: 2s between alerts so fast-spawning waves don't spam.
 *  Ignores wave transitions (wave change = expected, not a warning).
 * ============================================================ */
var SpawnWarning = (function () {
  'use strict';

  var SPAWN_THRESHOLD = 3;    /* min enemy count jump to trigger */
  var COOLDOWN        = 2.0;  /* seconds between alerts */

  var _prevCount  = -1;
  var _waveWas    = -1;
  var _lastAlert  = -999;
  var _init       = false;
  var _lastTs     = 0;
  var _frameN     = 0;

  var _el      = null;
  var _timer   = null;
  var _style   = null;
  var _flashEl = null;   /* brief red overlay */

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes swIn{',
        '0%{opacity:0;transform:translate(-50%,-50%) scale(0.6)}',
        '20%{opacity:1;transform:translate(-50%,-50%) scale(1.06)}',
        '55%{opacity:1;transform:translate(-50%,-50%) scale(1.0)}',
        '100%{opacity:0;transform:translate(-50%,-50%) scale(0.92)}',
      '}',
      '#sw-el{',
        'position:fixed;top:30%;left:50%;',
        'transform:translate(-50%,-50%);',
        'font-family:"Courier New",monospace;font-weight:bold;',
        'font-size:20px;color:#ff4444;letter-spacing:0.35em;',
        'text-shadow:0 0 16px rgba(255,60,60,0.8);',
        'pointer-events:none;z-index:425;',
        'display:none;white-space:nowrap;',
      '}',
      '@keyframes swFlash{',
        '0%{opacity:0.22}',
        '100%{opacity:0}',
      '}',
      '#sw-flash{',
        'position:fixed;top:0;left:0;width:100%;height:100%;',
        'background:rgba(255,30,30,1);',
        'pointer-events:none;z-index:424;',
        'opacity:0;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'sw-el';
    document.body.appendChild(_el);

    _flashEl = document.createElement('div');
    _flashEl.id = 'sw-flash';
    document.body.appendChild(_flashEl);
  }

  function _trigger(count) {
    if (!_el) return;

    /* Text */
    if (_timer) { clearTimeout(_timer); _timer = null; }
    _el.textContent = '⚠ INCOMING! +' + count;
    _el.style.display = 'block';
    _el.style.animation = 'none';
    void _el.offsetWidth;
    _el.style.animation = 'swIn 2.0s ease-out forwards';
    _timer = setTimeout(function () { if (_el) _el.style.display = 'none'; }, 2050);

    /* Flash */
    if (_flashEl) {
      _flashEl.style.animation = 'none';
      void _flashEl.offsetWidth;
      _flashEl.style.animation = 'swFlash 0.40s ease-out forwards';
    }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    if (_frameN % 6 !== 0) return;
    _lastTs = ts;
    var now = ts / 1000;

    /* Current wave — ignore transitions */
    var wave = -1;
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        wave = GameManager.getCurrentWave();
      }
    } catch (e) {}

    var waveChanged = (wave !== _waveWas && _waveWas !== -1);
    _waveWas = wave;

    /* Count living enemies */
    var count = 0;
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (e && (e.hp === undefined || e.hp > 0)) count++;
        }
      }
    } catch (er) {}

    /* Detect spawn */
    if (!waveChanged && _prevCount >= 0) {
      var delta = count - _prevCount;
      if (delta >= SPAWN_THRESHOLD && now - _lastAlert > COOLDOWN) {
        _lastAlert = now;
        _trigger(delta);
      }
    }
    _prevCount = count;
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

window.SpawnWarning = SpawnWarning;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { SpawnWarning.init(); });
} else {
  SpawnWarning.init();
}