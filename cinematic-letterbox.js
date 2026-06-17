/* ============================================================
 *  CINEMATIC-LETTERBOX.JS — Black bars for dramatic moments (passive)
 *
 *  Adds 60px black bars (top + bottom) that slide in/out CSS-smoothly
 *  for high-drama gameplay events:
 *
 *  - WAVE CLEARED — bars appear 0.2s with "SECTOR CLEARED" text
 *  - PLAYER DEATH  — bars appear 0.15s with "MAN DOWN" red text
 *  - RAMPAGE/5+    — bars appear briefly with kill-count caption
 *
 *  Bars hold for 1.8s then retract. If another event fires while
 *  bars are in, the text updates without retraction.
 *
 *  No keybind — completely passive. z-index 500 (top of stack).
 * ============================================================ */
var CinematicLetterbox = (function () {
  'use strict';

  var BAR_H     = 55;    /* px height of each bar */
  var HOLD_TIME = 1.8;   /* seconds to hold before retracting */
  var IN_DUR    = '0.25s';
  var OUT_DUR   = '0.35s';

  var _init      = false;
  var _frameN    = 0;
  var _lastTs    = 0;

  var _barTop    = null;
  var _barBot    = null;
  var _caption   = null;
  var _style     = null;

  var _showing   = false;
  var _holdT     = 0;

  /* State tracking */
  var _waveWas   = -1;
  var _prevPlayerHp = null;
  var _deadShown = false;
  var _killTimes = [];
  var _prevHp    = new WeakMap();
  var _counted   = new WeakSet();

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '#cl-top,#cl-bot{',
        'position:fixed;left:0;width:100%;',
        'background:#000;pointer-events:none;z-index:500;',
      '}',
      '#cl-top{',
        'top:0;height:' + BAR_H + 'px;',
        'transform:translateY(-100%);',
        'transition:transform 0.25s cubic-bezier(0.4,0,0.2,1);',
      '}',
      '#cl-bot{',
        'bottom:0;height:' + BAR_H + 'px;',
        'transform:translateY(100%);',
        'transition:transform 0.25s cubic-bezier(0.4,0,0.2,1);',
      '}',
      '#cl-top.cl-in{transform:translateY(0);}',
      '#cl-bot.cl-in{transform:translateY(0);}',
      '#cl-caption{',
        'position:fixed;top:' + (BAR_H / 2) + 'px;',
        'left:50%;transform:translate(-50%,-50%);',
        'font-family:"Courier New",monospace;',
        'font-size:11px;letter-spacing:4px;',
        'pointer-events:none;z-index:501;',
        'display:none;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _barTop = document.createElement('div');
    _barTop.id = 'cl-top';
    _barBot = document.createElement('div');
    _barBot.id = 'cl-bot';
    _caption = document.createElement('div');
    _caption.id = 'cl-caption';
    document.body.appendChild(_barTop);
    document.body.appendChild(_barBot);
    document.body.appendChild(_caption);
  }

  function _show(text, color, holdTime) {
    var hold = holdTime || HOLD_TIME;
    _holdT   = hold;

    _barTop.classList.add('cl-in');
    _barBot.classList.add('cl-in');

    _caption.textContent  = text;
    _caption.style.color  = color || 'rgba(255,255,255,0.85)';
    _caption.style.display = 'block';

    _showing = true;
  }

  function _hide() {
    _barTop.classList.remove('cl-in');
    _barBot.classList.remove('cl-in');
    _caption.style.display = 'none';
    _showing = false;
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Decay hold timer */
    if (_showing) {
      _holdT -= dt;
      if (_holdT <= 0) _hide();
    }

    /* Wave cleared */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (_waveWas > 0 && w > _waveWas) {
          _show('SECTOR CLEARED — WAVE ' + _waveWas + ' COMPLETE', 'rgba(80,255,140,0.9)', 2.0);
        }
        _waveWas = w;
      }
    } catch (e) {}

    /* Death */
    try {
      if (window.player && window.player.hp !== undefined) {
        var hp = window.player.hp;
        if (_prevPlayerHp !== null && hp <= 0 && _prevPlayerHp > 0 && !_deadShown) {
          _deadShown = true;
          _show('MAN DOWN', 'rgba(255,60,60,0.95)', 2.5);
        }
        if (hp > 0 && _prevPlayerHp !== null && _prevPlayerHp <= 0) _deadShown = false;
        _prevPlayerHp = hp;
      }
    } catch (e) {}

    /* Rampage — 5+ kills in 2.5s */
    if (_frameN % 3 === 0) {
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh) continue;
            var cur  = e.hp !== undefined ? e.hp : null;
            if (cur === null) continue;
            var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
            if (cur <= 0 && prev > 0 && !_counted.has(e)) {
              _counted.add(e);
              _killTimes.push(now);
            }
            _prevHp.set(e, cur);
          }
          _killTimes = _killTimes.filter(function (t) { return now - t <= 2.5; });
          var kc = _killTimes.length;
          if (kc === 5) {
            _show('RAMPAGE — ' + kc + ' KILLS', 'rgba(255,120,40,0.9)', 1.2);
          } else if (kc === 7) {
            _show('UNSTOPPABLE — ' + kc + ' KILLS', 'rgba(200,60,255,0.9)', 1.2);
          } else if (kc >= 10) {
            _show('G O D L I K E', 'rgba(255,220,60,0.95)', 1.8);
          }
        }
      } catch (er) {}
    }
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

window.CinematicLetterbox = CinematicLetterbox;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { CinematicLetterbox.init(); });
} else {
  CinematicLetterbox.init();
}