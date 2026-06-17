/* ============================================================
 *  DAMAGE-LOG.JS — scrolling hit-received log (passive)
 *
 *  Each time the player loses HP, a line is prepended to a
 *  small log at bottom-left:
 *
 *    • -35 HP
 *    • -12 HP
 *    • -8 HP
 *
 *  Each entry slides in from the left and fades after ENTRY_LIFE=3s.
 *  Max MAX_ENTRIES=4 visible at once (oldest auto-removed).
 *
 *  Heavy hits (≥30 HP) are shown in orange; critical (≥50 HP) in red.
 *  CSS-only. z-index 463. Passive — no keybind.
 * ============================================================ */
var DamageLog = (function () {
  'use strict';

  var ENTRY_LIFE   = 3.0;
  var MAX_ENTRIES  = 4;
  var HEAVY_HIT    = 30;
  var CRIT_HIT     = 50;

  var _wrap    = null;
  var _init    = false;
  var _lastHp  = null;
  var _lastTs  = 0;
  var _frameN  = 0;
  var _entries = [];   /* {el, life} */

  function _buildStyle() {
    var s = document.createElement('style');
    s.textContent = [
      '@keyframes dlSlide{',
        '0%{opacity:0;transform:translateX(-14px)}',
        '12%{opacity:1;transform:translateX(0)}',
        '70%{opacity:1;transform:translateX(0)}',
        '100%{opacity:0;transform:translateX(-8px)}',
        '}',
      '#dl-wrap{',
        'position:fixed;left:14px;bottom:90px;',
        'pointer-events:none;z-index:463;',
        'display:flex;flex-direction:column-reverse;gap:3px;',
        '}',
      '.dl-entry{',
        'font-family:"Courier New",monospace;',
        'font-size:9px;font-weight:bold;',
        'letter-spacing:2px;',
        'color:rgba(200,200,200,0.8);',
        'text-shadow:0 0 6px rgba(0,0,0,0.9);',
        'white-space:nowrap;',
        'animation:dlSlide ' + ENTRY_LIFE + 's ease forwards;',
        '}',
      '.dl-entry.heavy{color:rgba(255,160,50,0.9);}',
      '.dl-entry.crit{color:rgba(255,60,60,1);text-shadow:0 0 10px rgba(255,0,0,0.6);}',
    ].join('');
    document.head.appendChild(s);
  }

  function _buildDom() {
    _wrap = document.createElement('div');
    _wrap.id = 'dl-wrap';
    document.body.appendChild(_wrap);
  }

  function _addEntry(dmg) {
    if (!_wrap) return;

    /* Remove oldest if at max */
    while (_entries.length >= MAX_ENTRIES) {
      var old = _entries.shift();
      if (old.el && old.el.parentNode) old.el.parentNode.removeChild(old.el);
    }

    var el = document.createElement('div');
    el.className = 'dl-entry' + (dmg >= CRIT_HIT ? ' crit' : dmg >= HEAVY_HIT ? ' heavy' : '');
    el.textContent = '• -' + Math.round(dmg) + ' HP';
    _wrap.appendChild(el);
    _entries.push({ el: el, life: ENTRY_LIFE });
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* HP check every frame */
    try {
      if (window.player) {
        var hp = window.player.hp;
        if (hp !== undefined && hp !== null) {
          if (_lastHp !== null && hp < _lastHp) {
            _addEntry(_lastHp - hp);
          }
          _lastHp = hp;
        }
      }
    } catch (er) {}

    /* Age entries */
    for (var j = _entries.length - 1; j >= 0; j--) {
      _entries[j].life -= dt;
      if (_entries[j].life <= 0) {
        var el = _entries[j].el;
        if (el && el.parentNode) el.parentNode.removeChild(el);
        _entries.splice(j, 1);
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

window.DamageLog = DamageLog;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { DamageLog.init(); });
} else {
  DamageLog.init();
}
