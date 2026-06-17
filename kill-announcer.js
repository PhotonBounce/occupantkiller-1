/* ============================================================
 *  KILL-ANNOUNCER.JS — Multi-kill & killstreak announcements (passive)
 *
 *  Watches enemy HP drops. Kills within a 2.5s window escalate:
 *  2=DOUBLE KILL, 3=TRIPLE KILL, 4=QUAD KILL,
 *  5=RAMPAGE, 6=UNSTOPPABLE, 7+=GODLIKE (+ "N KILLS" if even higher).
 *  Separately tracks consecutive kills without dying — at milestones
 *  shows a KILLSTREAK banner beneath the multi-kill pop.
 *  Announcements scale-in + fade, stack vertically (multi-kill on top,
 *  streak info beneath). No keybindings.
 * ============================================================ */
var KillAnnouncer = (function () {
  'use strict';

  /* --- Tier definitions ---------------------------------- */
  var MULTI_TIERS = [
    { n: 2, label: 'DOUBLE KILL',     color: '#ffcc00' },
    { n: 3, label: 'TRIPLE KILL',     color: '#ff8800' },
    { n: 4, label: 'QUAD KILL',       color: '#ff4400' },
    { n: 5, label: 'RAMPAGE',         color: '#ff2200' },
    { n: 6, label: 'UNSTOPPABLE',     color: '#cc00ff' },
    { n: 7, label: 'GODLIKE',         color: '#ffffff' },
  ];

  var STREAK_MILESTONES = [5, 10, 15, 20, 25, 30, 50];
  /* streak announcements use same color as RAMPAGE tier at lower counts */
  var STREAK_COLORS = ['#ffcc00','#ff8800','#ff4400','#ff2200','#cc00ff','#cc00ff','#ffffff'];

  /* --- State --------------------------------------------- */
  var _prevHp     = new WeakMap();
  var _counted    = new WeakSet();
  var _killTimes  = [];        /* timestamps (s) of recent kills */
  var _streak     = 0;         /* total kills since last player death */
  var _prevPlHp   = null;
  var _init       = false;
  var _lastTs     = 0;
  var _frameN     = 0;

  var MULTI_WINDOW = 2.5;      /* seconds — kills within this window count together */

  /* --- DOM ----------------------------------------------- */
  var _style   = null;
  var _wrapEl  = null;         /* outer container centered in screen */
  var _mainEl  = null;         /* multi-kill label */
  var _subEl   = null;         /* streak label */
  var _mainTimer = null;
  var _subTimer  = null;

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes kaIn{',
        '0%{opacity:0;transform:translate(-50%,0) scale(0.4) skewX(-6deg)}',
        '18%{opacity:1;transform:translate(-50%,0) scale(1.12) skewX(-3deg)}',
        '32%{transform:translate(-50%,0) scale(0.97) skewX(0)}',
        '55%{opacity:1;transform:translate(-50%,0) scale(1.0)}',
        '100%{opacity:0;transform:translate(-50%,0) scale(0.9)}',
      '}',
      '@keyframes kaInSub{',
        '0%{opacity:0;transform:translate(-50%,0) scale(0.6)}',
        '20%{opacity:1;transform:translate(-50%,0) scale(1.04)}',
        '60%{opacity:0.9}',
        '100%{opacity:0;transform:translate(-50%,0) scale(0.95)}',
      '}',
      '#ka-main{',
        'position:fixed;top:38%;left:50%;',
        'transform:translate(-50%,0);',
        'font-family:"Courier New",monospace;font-weight:900;',
        'font-size:30px;letter-spacing:0.3em;text-transform:uppercase;',
        'pointer-events:none;z-index:430;',
        'text-shadow:0 0 18px currentColor, 0 2px 4px #000;',
        'white-space:nowrap;display:none;',
      '}',
      '#ka-sub{',
        'position:fixed;top:43.5%;left:50%;',
        'transform:translate(-50%,0);',
        'font-family:"Courier New",monospace;font-weight:bold;',
        'font-size:13px;letter-spacing:0.25em;text-transform:uppercase;',
        'pointer-events:none;z-index:430;',
        'text-shadow:0 0 10px currentColor, 0 1px 3px #000;',
        'white-space:nowrap;display:none;',
      '}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _mainEl = document.createElement('div');
    _mainEl.id = 'ka-main';
    document.body.appendChild(_mainEl);

    _subEl = document.createElement('div');
    _subEl.id = 'ka-sub';
    document.body.appendChild(_subEl);
  }

  function _showMain(text, color, dur) {
    if (!_mainEl) return;
    if (_mainTimer) { clearTimeout(_mainTimer); _mainTimer = null; }
    _mainEl.textContent = text;
    _mainEl.style.color = color;
    _mainEl.style.display = 'block';
    _mainEl.style.animation = 'none';
    void _mainEl.offsetWidth;
    _mainEl.style.animation = 'kaIn ' + dur + 's ease-out forwards';
    _mainTimer = setTimeout(function () { if (_mainEl) _mainEl.style.display = 'none'; }, dur * 1000);
  }

  function _showSub(text, color, dur) {
    if (!_subEl) return;
    if (_subTimer) { clearTimeout(_subTimer); _subTimer = null; }
    _subEl.textContent = text;
    _subEl.style.color = color;
    _subEl.style.display = 'block';
    _subEl.style.animation = 'none';
    void _subEl.offsetWidth;
    _subEl.style.animation = 'kaInSub ' + dur + 's ease-out forwards';
    _subTimer = setTimeout(function () { if (_subEl) _subEl.style.display = 'none'; }, dur * 1000);
  }

  function _onKill() {
    var now = performance.now() / 1000;
    _killTimes.push(now);
    _streak++;

    /* Prune kills outside the multi-kill window */
    _killTimes = _killTimes.filter(function (t) { return now - t <= MULTI_WINDOW; });

    var cnt = _killTimes.length;

    /* Multi-kill announcement */
    if (cnt >= 2) {
      var tier = null;
      for (var i = MULTI_TIERS.length - 1; i >= 0; i--) {
        if (cnt >= MULTI_TIERS[i].n) { tier = MULTI_TIERS[i]; break; }
      }
      if (tier) {
        var label = tier.label;
        if (cnt > 7) label = cnt + ' KILLS';
        _showMain(label, tier.color, 2.2);
      }
    }

    /* Streak milestone announcement */
    if (STREAK_MILESTONES.indexOf(_streak) !== -1) {
      var mi = STREAK_MILESTONES.indexOf(_streak);
      var sc = STREAK_COLORS[Math.min(mi, STREAK_COLORS.length - 1)];
      _showSub(_streak + ' KILLSTREAK', sc, 2.0);
    }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Player death detection — reset streak */
    try {
      if (window.player && window.player.hp !== undefined) {
        var plHp = window.player.hp;
        if (_prevPlHp !== null && plHp <= 0 && _prevPlHp > 0) {
          _streak = 0;
          _killTimes = [];
        }
        _prevPlHp = plHp;
      }
    } catch (e) {}

    /* Kill tracking every 2 frames */
    if (_frameN % 2 === 0) {
      try {
        if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh) continue;
          var cur  = e.hp !== undefined ? e.hp : null;
          if (cur === null) continue;
          var prev = _prevHp.has(e) ? _prevHp.get(e) : cur;
          if (cur <= 0 && prev > 0 && !_counted.has(e)) {
            _counted.add(e);
            _onKill();
          }
          _prevHp.set(e, cur);
        }
      } catch (err) {}
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

window.KillAnnouncer = KillAnnouncer;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { KillAnnouncer.init(); });
} else {
  KillAnnouncer.init();
}