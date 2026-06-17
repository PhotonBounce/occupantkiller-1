/* ============================================================
 *  SURVIVOR-CLOCK.JS — elapsed stage time display (passive)
 *
 *  Shows how long the player has been alive in the current stage.
 *  Resets when the stage ID changes (GameManager.getStageInfo).
 *
 *  Format: MM:SS in a small monospace readout at bottom-right,
 *  above the ammo display.
 *
 *  At 5:00+ the clock turns orange ("veteran" status).
 *  At 10:00+ it turns gold (pace indicator for scoring).
 *
 *  Also tracks session-best per stage (stored in sessionStorage
 *  under key "ok_best_<stageId>") and shows ▲ if beating it.
 *
 *  CSS-only. z-index 362. Passive — no keybind.
 * ============================================================ */
var SurvivorClock = (function () {
  'use strict';

  var _wrap    = null;
  var _label   = null;
  var _init    = false;
  var _startTs = null;
  var _stageId = null;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _best    = 0;
  var _beating = false;

  function _buildStyle() {
    var s = document.createElement('style');
    s.textContent = [
      '#sclk-wrap{',
        'position:fixed;right:14px;bottom:50px;',
        'pointer-events:none;z-index:362;',
        'font-family:"Courier New",monospace;',
        'font-size:9px;font-weight:bold;',
        'letter-spacing:2px;',
        'color:rgba(160,200,160,0.7);',
        'text-shadow:0 0 6px rgba(0,0,0,0.8);',
        'text-align:right;',
      '}',
      '#sclk-wrap.veteran{color:rgba(255,160,60,0.85);}',
      '#sclk-wrap.gold{color:rgba(255,210,50,0.9);text-shadow:0 0 10px rgba(220,180,0,0.6);}',
    ].join('');
    document.head.appendChild(s);
  }

  function _buildDom() {
    _wrap = document.createElement('div');
    _wrap.id = 'sclk-wrap';
    _label = document.createElement('span');
    _label.textContent = '00:00';
    _wrap.appendChild(_label);
    document.body.appendChild(_wrap);
  }

  function _fmt(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function _loadBest(id) {
    try { return parseFloat(sessionStorage.getItem('ok_best_' + id) || '0') || 0; } catch (e) { return 0; }
  }

  function _saveBest(id, t) {
    try { sessionStorage.setItem('ok_best_' + id, t.toFixed(1)); } catch (e) {}
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Check stage every 60 frames (~1Hz) */
    if (_frameN % 60 === 0) {
      try {
        if (typeof GameManager !== 'undefined' && GameManager.getStageInfo) {
          var info = GameManager.getStageInfo();
          if (info) {
            var id = info.id !== undefined ? info.id : info.name;
            if (id !== _stageId) {
              /* Save best for old stage */
              if (_stageId !== null && _startTs !== null) {
                var elapsed0 = (ts - _startTs) / 1000;
                if (elapsed0 > _best) _saveBest(_stageId, elapsed0);
              }
              _stageId  = id;
              _startTs  = ts;
              _best     = _loadBest(id);
              _beating  = false;
            }
          }
        }
      } catch (er) {}
    }

    if (_startTs === null) return;
    var elapsed = (ts - _startTs) / 1000;

    if (!_label || !_wrap) return;

    /* Beating best */
    if (!_beating && elapsed > _best && _best > 10) {
      _beating = true;
    }

    _label.textContent = _fmt(elapsed) + (_beating ? ' ▲' : '');

    /* Colour tier */
    if (elapsed >= 600) {
      _wrap.className = 'gold';
    } else if (elapsed >= 300) {
      _wrap.className = 'veteran';
    } else {
      _wrap.className = '';
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _buildStyle();
    _buildDom();
    _startTs = performance.now();
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.SurvivorClock = SurvivorClock;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { SurvivorClock.init(); });
} else {
  SurvivorClock.init();
}
