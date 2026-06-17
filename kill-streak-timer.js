/* ============================================================
 *  KILL-STREAK-TIMER.JS — combo window countdown bar (passive)
 *
 *  A thin glowing bar just below the top-center of the screen
 *  shows how much time remains in the current kill-combo window
 *  (matches kill-combo-announce.js WINDOW = 3.5s).
 *
 *  Bar is invisible when no kill is active.
 *  At ≥5 kills the bar turns gold; ≥10 kills it turns purple.
 *  Bar drains right→left and flashes on each new kill.
 *
 *  CSS-only. z-index 461. Passive — no keybind.
 * ============================================================ */
var KillStreakTimer = (function () {
  'use strict';

  var WINDOW     = 3.5;    /* must match kill-combo-announce.js */
  var BAR_W      = 220;    /* px */
  var BAR_H      = 3;      /* px */
  var FADE_OUT   = 0.4;    /* seconds to fade after window expires */

  var _wrap    = null;
  var _bar     = null;
  var _init    = false;
  var _prevHp  = new WeakMap();
  var _counted = new WeakSet();
  var _killTimes = [];
  var _lastTs  = 0;
  var _frameN  = 0;
  var _flashT  = 0;
  var _fadeT   = 0;   /* countdown for fade-out */
  var _visible = false;

  function _buildStyle() {
    var s = document.createElement('style');
    s.textContent = [
      '@keyframes kstFlash{',
        '0%{opacity:1;filter:brightness(2.5)}',
        '100%{opacity:1;filter:brightness(1)}',
      '}',
      '#kst-wrap{',
        'position:fixed;left:50%;top:6px;',
        'transform:translateX(-50%);',
        'width:' + BAR_W + 'px;height:' + BAR_H + 'px;',
        'background:rgba(255,255,255,0.08);',
        'border-radius:2px;',
        'pointer-events:none;z-index:461;',
        'opacity:0;transition:opacity 0.3s;',
      '}',
      '#kst-bar{',
        'height:100%;width:100%;',
        'border-radius:2px;',
        'background:rgba(80,220,180,0.9);',
        'box-shadow:0 0 6px rgba(80,220,180,0.7);',
        'transform-origin:left center;',
        'transition:background 0.2s;',
      '}',
    ].join('');
    document.head.appendChild(s);
  }

  function _buildDom() {
    _wrap = document.createElement('div');
    _wrap.id = 'kst-wrap';
    _bar = document.createElement('div');
    _bar.id = 'kst-bar';
    _wrap.appendChild(_bar);
    document.body.appendChild(_wrap);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Kill detection every 3rd frame */
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
              _flashT = 0.18;  /* flash the bar */
            }
            _prevHp.set(e, cur);
          }
        }
      } catch (er) {}
    }

    /* Prune old kills */
    _killTimes = _killTimes.filter(function (t) { return now - t <= WINDOW; });
    var count = _killTimes.length;

    if (!_bar || !_wrap) return;

    if (count === 0) {
      /* Fade out */
      if (_visible) {
        _fadeT -= dt;
        if (_fadeT <= 0) {
          _wrap.style.opacity = '0';
          _visible = false;
        }
      }
      return;
    }

    /* Show bar */
    _visible = true;
    _fadeT = FADE_OUT;
    _wrap.style.opacity = '1';

    /* Compute fill fraction: time since last kill / WINDOW */
    var lastKill = _killTimes[_killTimes.length - 1];
    var elapsed  = now - lastKill;
    var frac     = Math.max(0, 1 - elapsed / WINDOW);

    _bar.style.transform = 'scaleX(' + frac.toFixed(3) + ')';

    /* Colour by tier */
    var col;
    if (count >= 10) {
      col = 'rgba(200,50,255,0.9)';
      _bar.style.boxShadow = '0 0 8px rgba(180,0,255,0.8)';
    } else if (count >= 5) {
      col = 'rgba(255,210,50,0.9)';
      _bar.style.boxShadow = '0 0 8px rgba(255,190,0,0.7)';
    } else {
      col = 'rgba(80,220,180,0.9)';
      _bar.style.boxShadow = '0 0 6px rgba(80,220,180,0.7)';
    }
    _bar.style.background = col;

    /* Flash on new kill */
    if (_flashT > 0) {
      _flashT -= dt;
      _bar.style.filter = 'brightness(' + (1 + _flashT * 8).toFixed(1) + ')';
    } else {
      _bar.style.filter = 'brightness(1)';
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

window.KillStreakTimer = KillStreakTimer;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { KillStreakTimer.init(); });
} else {
  KillStreakTimer.init();
}
