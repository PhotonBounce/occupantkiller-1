/* ============================================================
 *  KILL-FEED.JS — CS:GO-style elimination feed (passive)
 *
 *  Each kill appends a new line at the top-right:
 *    ▸ [WEAPON]  CONSCRIPT   ×
 *  where WEAPON is the current active weapon type and
 *  the × turns red on kill, green on headshot-tier high dmg.
 *
 *  Lines slide in from the right, hold for ENTRY_LIFE=4s, then fade.
 *  Max 6 simultaneous entries. Stacked top-to-bottom.
 *  CSS-only, no canvas. z-index 362.
 * ============================================================ */
var KillFeed = (function () {
  'use strict';

  var MAX_ENTRIES = 6;
  var ENTRY_LIFE  = 4.0;
  var SLIDE_DUR   = '0.25s';

  var _init    = false;
  var _wrap    = null;
  var _style   = null;
  var _entries = [];  /* {el, born} */

  var _prevHp  = new WeakMap();
  var _counted = new WeakSet();
  var _lastTs  = 0;
  var _now     = 0;
  var _frameN  = 0;

  var WEAPON_SHORT = {
    RIFLE:    'AR',
    SHOTGUN:  'SG',
    SNIPER:   'SR',
    LAUNCHER: 'RL',
    MELEE:    'KN',
    PISTOL:   'HG',
  };

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '#kf-wrap{',
        'position:fixed;top:50px;right:16px;',
        'display:flex;flex-direction:column;gap:3px;',
        'pointer-events:none;z-index:362;',
        'align-items:flex-end;',
      '}',
      '.kf-row{',
        'font-family:"Courier New",monospace;font-size:9px;',
        'letter-spacing:2px;',
        'background:rgba(0,0,0,0.45);',
        'padding:3px 7px 3px;border-radius:2px;',
        'color:rgba(200,215,200,0.80);',
        'border-right:2px solid rgba(255,80,80,0.60);',
        'transform:translateX(120%);opacity:0;',
        'transition:transform ' + SLIDE_DUR + ' ease, opacity ' + SLIDE_DUR + ' ease;',
        'white-space:nowrap;',
      '}',
      '.kf-row.kf-in{transform:translateX(0);opacity:1;}',
      '.kf-row.kf-out{opacity:0;transform:translateX(40%);}',
      '.kf-weap{color:rgba(80,200,255,0.85);margin-right:4px;}',
      '.kf-x{color:rgba(255,80,80,0.90);margin-left:4px;}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _wrap = document.createElement('div');
    _wrap.id = 'kf-wrap';
    document.body.appendChild(_wrap);
  }

  function _getWeaponLabel() {
    try {
      if (typeof Weapons !== 'undefined' && Weapons.getCurrentType) {
        var t = (Weapons.getCurrentType() || '').toUpperCase();
        for (var k in WEAPON_SHORT) {
          if (t.indexOf(k) >= 0) return WEAPON_SHORT[k];
        }
        return t.slice(0, 2) || '??';
      }
    } catch (e) {}
    return '??';
  }

  function _pushEntry(enemyType) {
    if (!_wrap) return;

    /* Trim oldest if at cap */
    if (_entries.length >= MAX_ENTRIES) {
      var oldest = _entries.shift();
      if (oldest.el && oldest.el.parentNode) oldest.el.parentNode.removeChild(oldest.el);
    }

    var row = document.createElement('div');
    row.className = 'kf-row';

    var weap = document.createElement('span');
    weap.className = 'kf-weap';
    weap.textContent = '[' + _getWeaponLabel() + ']';

    var name = document.createElement('span');
    name.textContent = (enemyType || 'ENEMY').toUpperCase();

    var x = document.createElement('span');
    x.className = 'kf-x';
    x.textContent = ' ×';

    row.appendChild(weap);
    row.appendChild(name);
    row.appendChild(x);
    _wrap.appendChild(row);

    _entries.push({ el: row, born: _now });

    /* Trigger slide-in */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { if (row) row.classList.add('kf-in'); });
    });
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _now += dt;

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
              _pushEntry(e.type || '');
            }
            _prevHp.set(e, cur);
          }
        }
      } catch (er) {}
    }

    /* Age out expired entries */
    var now = _now;
    _entries = _entries.filter(function (en) {
      if (now - en.born > ENTRY_LIFE) {
        if (en.el) {
          en.el.classList.add('kf-out');
          en.el.classList.remove('kf-in');
          var doomed = en.el;
          setTimeout(function () { if (doomed.parentNode) doomed.parentNode.removeChild(doomed); }, 350);
        }
        return false;
      }
      return true;
    });
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

window.KillFeed = KillFeed;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { KillFeed.init(); });
} else {
  KillFeed.init();
}