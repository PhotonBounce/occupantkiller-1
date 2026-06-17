/* ============================================================
 *  KILL-MILESTONE.JS — Session kill milestone celebrations (passive)
 *
 *  Tracks cumulative session kills (persisted in sessionStorage).
 *  When a milestone is reached, fires a full-screen brief splash:
 *
 *  Milestones and labels:
 *    10   → "10 KILLS"           white
 *    25   → "25 KILLS"           cyan
 *    50   → "50 KILLS"           gold
 *    100  → "CENTURY KILLER"     gold + glow
 *    250  → "WAR MACHINE"        orange
 *    500  → "KILLING MACHINE"    red
 *    1000 → "APEX PREDATOR"      purple
 *
 *  Splash: large text scales in from center, holds 1.2s, fades.
 *  Counter shown top-left as small "SESSION: N" stat.
 *  Uses sessionStorage key `ok_session_kills`.
 * ============================================================ */
var KillMilestone = (function () {
  'use strict';

  var STORAGE_KEY = 'ok_session_kills';

  var MILESTONES = [
    { n: 10,   label: '10 KILLS',        color: 'rgba(200,220,200,0.95)' },
    { n: 25,   label: '25 KILLS',        color: 'rgba(80,220,255,0.95)'  },
    { n: 50,   label: '50 KILLS',        color: 'rgba(255,220,50,0.95)'  },
    { n: 100,  label: 'CENTURY KILLER',  color: 'rgba(255,220,50,0.95)'  },
    { n: 250,  label: 'WAR MACHINE',     color: 'rgba(255,140,40,0.95)'  },
    { n: 500,  label: 'KILLING MACHINE', color: 'rgba(255,60,60,0.95)'   },
    { n: 1000, label: 'APEX PREDATOR',   color: 'rgba(200,60,255,0.95)'  },
  ];
  var _nextMilestoneIdx = 0;

  var _init     = false;
  var _frameN   = 0;
  var _lastTs   = 0;
  var _totalKills = 0;

  var _prevHp   = new WeakMap();
  var _counted  = new WeakSet();

  /* DOM */
  var _splashEl = null;
  var _counterEl = null;
  var _style    = null;

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes kmPop{',
        '0%{opacity:0;transform:translate(-50%,-50%) scale(2.5)}',
        '20%{opacity:1;transform:translate(-50%,-50%) scale(1.0)}',
        '70%{opacity:1;transform:translate(-50%,-50%) scale(1.0)}',
        '100%{opacity:0;transform:translate(-50%,-50%) scale(0.8)}',
      '}',
      '#km-splash{',
        'position:fixed;top:50%;left:50%;',
        'transform:translate(-50%,-50%);',
        'font-family:"Courier New",monospace;font-weight:900;',
        'font-size:36px;letter-spacing:4px;text-align:center;',
        'pointer-events:none;z-index:505;',
        'display:none;white-space:nowrap;',
      '}',
      '#km-sub{',
        'display:block;font-size:10px;font-weight:400;',
        'letter-spacing:8px;opacity:0.6;margin-top:4px;',
      '}',
      '#km-counter{',
        'position:fixed;bottom:20px;left:20px;',
        'font-family:"Courier New",monospace;font-size:8px;',
        'letter-spacing:2px;color:rgba(150,170,150,0.45);',
        'pointer-events:none;z-index:360;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _splashEl = document.createElement('div');
    _splashEl.id = 'km-splash';

    var txt = document.createElement('span');
    txt.id = 'km-txt';
    var sub = document.createElement('span');
    sub.id = 'km-sub';
    sub.textContent = 'SESSION MILESTONE';
    _splashEl.appendChild(txt);
    _splashEl.appendChild(sub);
    document.body.appendChild(_splashEl);

    _counterEl = document.createElement('div');
    _counterEl.id = 'km-counter';
    document.body.appendChild(_counterEl);
  }

  function _getStored() {
    try { return parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10) || 0; } catch (e) { return 0; }
  }

  function _setStored(n) {
    try { sessionStorage.setItem(STORAGE_KEY, '' + n); } catch (e) {}
  }

  function _fireMilestone(m) {
    var txt = document.getElementById('km-txt');
    if (!txt || !_splashEl) return;

    txt.textContent = m.label;
    _splashEl.style.color      = m.color;
    _splashEl.style.textShadow = '0 0 40px ' + m.color;

    _splashEl.style.display   = 'block';
    _splashEl.style.animation = 'none';
    void _splashEl.offsetWidth;
    _splashEl.style.animation = 'kmPop 1.8s cubic-bezier(0.4,0,0.2,1) forwards';

    setTimeout(function () {
      if (_splashEl) _splashEl.style.display = 'none';
    }, 1850);
  }

  function _checkMilestone(n) {
    while (_nextMilestoneIdx < MILESTONES.length && n >= MILESTONES[_nextMilestoneIdx].n) {
      _fireMilestone(MILESTONES[_nextMilestoneIdx]);
      _nextMilestoneIdx++;
    }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Kill detection (every 2nd frame) */
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
              _totalKills++;
              _setStored(_totalKills);
              _checkMilestone(_totalKills);
              if (_counterEl) _counterEl.textContent = 'SESSION KILLS: ' + _totalKills;
            }
            _prevHp.set(e, cur);
          }
        }
      } catch (er) {}
    }
  }

  function init() {
    if (_init) return;
    _init = true;

    /* Load session total */
    _totalKills = _getStored();

    /* Advance milestone pointer past already-hit milestones */
    while (_nextMilestoneIdx < MILESTONES.length && _totalKills >= MILESTONES[_nextMilestoneIdx].n) {
      _nextMilestoneIdx++;
    }

    _buildStyle();
    _buildDom();
    if (_counterEl) _counterEl.textContent = 'SESSION KILLS: ' + _totalKills;
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.KillMilestone = KillMilestone;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { KillMilestone.init(); });
} else {
  KillMilestone.init();
}