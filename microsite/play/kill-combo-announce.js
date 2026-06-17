/* ============================================================
 *  KILL-COMBO-ANNOUNCE.JS — Halo/UT rapid-kill announcements (passive)
 *
 *  Tracks kills within a sliding WINDOW=3.5s window.
 *  When multi-kill threshold is hit, shows a large centred announcement:
 *
 *    2 kills  → "DOUBLE KILL"       cyan
 *    3 kills  → "TRIPLE KILL"       gold
 *    4 kills  → "OVERKILL"          orange
 *    5 kills  → "KILLTACULAR"       red
 *    6 kills  → "KILLING FRENZY"    deep red
 *    7+ kills → "UNFREAKINGREAL"    purple
 *
 *  Only fires once per threshold step (each new kill during the
 *  window triggers the next tier, not the same one).
 *
 *  Text bursts in (scale 1.8→1.0) over 0.25s, holds 1.2s, fades.
 *  CSS-only. z-index 502 (above kill-milestone 505? no, below at 502).
 *  Passive — no keybind.
 * ============================================================ */
var KillComboAnnounce = (function () {
  'use strict';

  var WINDOW    = 3.5;
  var HOLD_TIME = 1.8;

  var TIERS = [
    { n: 2, label: 'DOUBLE KILL',       col: 'rgba(80,220,255,1)'  },
    { n: 3, label: 'TRIPLE KILL',       col: 'rgba(255,210,50,1)'  },
    { n: 4, label: 'OVERKILL',          col: 'rgba(255,140,40,1)'  },
    { n: 5, label: 'KILLTACULAR',       col: 'rgba(255,60,60,1)'   },
    { n: 6, label: 'KILLING FRENZY',    col: 'rgba(200,30,30,1)'   },
    { n: 7, label: 'UNFREAKINGREAL',    col: 'rgba(200,50,255,1)'  },
  ];

  var _el       = null;
  var _init     = false;
  var _prevHp   = new WeakMap();
  var _counted  = new WeakSet();
  var _killTimes = [];
  var _lastThresh = 0;
  var _lastTs   = 0;
  var _frameN   = 0;
  var _showing  = false;

  function _buildStyle() {
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes kcaBurst{',
        '0%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}',
        '18%{opacity:1;transform:translate(-50%,-50%) scale(1.0)}',
        '70%{opacity:1;transform:translate(-50%,-50%) scale(1.0)}',
        '100%{opacity:0;transform:translate(-50%,-50%) scale(0.9)}',
      '}',
      '#kca-wrap{',
        'position:fixed;top:40%;left:50%;',
        'transform:translate(-50%,-50%);',
        'font-family:"Courier New",monospace;',
        'font-size:22px;font-weight:900;',
        'letter-spacing:5px;text-align:center;',
        'pointer-events:none;z-index:502;',
        'display:none;white-space:nowrap;',
        'text-shadow:0 0 30px currentColor;',
      '}',
    ].join('');
    document.head.appendChild(style);
  }

  function _buildDom() {
    _el = document.createElement('div');
    _el.id = 'kca-wrap';
    document.body.appendChild(_el);
  }

  function _showAnnounce(tier) {
    if (!_el || _showing) return;
    _showing = true;
    _el.textContent = tier.label;
    _el.style.color = tier.col;
    _el.style.display = 'block';
    _el.style.animation = 'none';
    void _el.offsetWidth;
    _el.style.animation = 'kcaBurst ' + HOLD_TIME + 's cubic-bezier(0.4,0,0.2,1) forwards';
    var el = _el;
    setTimeout(function () {
      if (el) el.style.display = 'none';
      _showing = false;
    }, HOLD_TIME * 1000);
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    var now = ts / 1000;

    /* Kill detection every 2nd frame */
    if (_frameN % 2 === 0) {
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
        }
      } catch (er) {}
    }

    /* Prune window */
    _killTimes = _killTimes.filter(function (t) { return now - t <= WINDOW; });
    var count = _killTimes.length;

    /* Reset tracker if window cleared */
    if (count === 0) { _lastThresh = 0; return; }
    if (count < 2)   { return; }

    /* Find highest uncelebrated tier */
    for (var t = TIERS.length - 1; t >= 0; t--) {
      if (count >= TIERS[t].n && _lastThresh < TIERS[t].n) {
        _lastThresh = TIERS[t].n;
        _showAnnounce(TIERS[t]);
        break;
      }
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

window.KillComboAnnounce = KillComboAnnounce;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { KillComboAnnounce.init(); });
} else {
  KillComboAnnounce.init();
}