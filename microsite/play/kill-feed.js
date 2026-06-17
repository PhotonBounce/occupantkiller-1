/* ============================================================
 *  KILL-FEED.JS — Kill stream + streak announcer (passive)
 *
 *  Tracks enemy deaths via WeakMap (hp crosses 0). On each kill:
 *
 *  FEED (top-right): sliding entries "X CONSCRIPT" that stack
 *  downward, each staying 3s then fading out.
 *
 *  STREAK (center): detects kills within a 3.5s rolling window:
 *    2 -> DOUBLE KILL (cyan)
 *    3 -> TRIPLE KILL (orange)
 *    4 -> KILLING SPREE (red)
 *    5 -> RAMPAGE (magenta)
 *    6+ -> UNSTOPPABLE (gold)
 *
 *  Streak resets if no kill in 3.5s.
 * ============================================================ */
var KillFeed = (function () {
  'use strict';

  var STREAK_WINDOW = 3.5;
  var FEED_LINGER   = 3.0;
  var MAX_FEED      = 6;

  var _prevHp       = new WeakMap();
  var _counted      = new WeakSet();
  var _init         = false;
  var _lastTs       = 0;
  var _frameN       = 0;
  var _killTimes    = [];
  var _streakLevel  = 0;

  var _feedEl       = null;
  var _streakEl     = null;
  var _streakT      = 0;
  var _style        = null;

  var STREAK_LABELS = [
    null, null,
    { text: 'DOUBLE KILL',   color: '#44ddff', size: '26px' },
    { text: 'TRIPLE KILL',   color: '#ff8800', size: '30px' },
    { text: 'KILLING SPREE', color: '#ff3333', size: '34px' },
    { text: 'RAMPAGE',       color: '#ff00cc', size: '38px' },
  ];
  var STREAK_MAX = { text: 'UNSTOPPABLE', color: '#ffdd00', size: '44px' };

  function _buildStyle() {
    _style = document.createElement('style');
    _style.textContent = [
      '@keyframes kfSlideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}',
      '@keyframes kfFadeOut{from{opacity:1}to{opacity:0}}',
      '@keyframes streakPop{0%{transform:translate(-50%,-50%) scale(0.6);opacity:0}',
        '30%{transform:translate(-50%,-50%) scale(1.15);opacity:1}',
        '70%{transform:translate(-50%,-50%) scale(1.0);opacity:1}',
        '100%{transform:translate(-50%,-50%) scale(1.0);opacity:0}}',
      '#kf-feed{position:fixed;top:18px;right:12px;z-index:400;',
        'pointer-events:none;display:flex;flex-direction:column;align-items:flex-end;gap:3px;}',
      '.kf-entry{font-family:"Courier New",monospace;font-size:11px;font-weight:bold;',
        'letter-spacing:0.12em;color:#ffffff;',
        'text-shadow:0 1px 5px rgba(0,0,0,0.9);',
        'animation:kfSlideIn 0.18s ease-out forwards;white-space:nowrap;}',
      '.kf-entry.dying{animation:kfFadeOut 0.4s ease-out forwards;}',
      '#kf-streak{position:fixed;top:38%;left:50%;',
        'transform:translate(-50%,-50%);',
        'font-family:"Courier New",monospace;font-weight:bold;',
        'letter-spacing:0.35em;text-align:center;',
        'pointer-events:none;z-index:410;',
        'text-shadow:0 0 18px currentColor;}',
    ].join('');
    document.head.appendChild(_style);
  }

  function _buildDom() {
    _feedEl = document.createElement('div');
    _feedEl.id = 'kf-feed';
    document.body.appendChild(_feedEl);
    _streakEl = document.createElement('div');
    _streakEl.id = 'kf-streak';
    _streakEl.style.opacity = 0;
    document.body.appendChild(_streakEl);
  }

  function _addFeed(label) {
    if (!_feedEl) return;
    while (_feedEl.children.length >= MAX_FEED) {
      var oldest = _feedEl.firstChild;
      if (oldest) _feedEl.removeChild(oldest);
    }
    var el = document.createElement('div');
    el.className = 'kf-entry';
    el.textContent = 'X ' + label;
    _feedEl.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) {
        el.classList.add('dying');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
      }
    }, FEED_LINGER * 1000);
  }

  function _showStreak(level) {
    if (!_streakEl) return;
    var def = level >= STREAK_LABELS.length ? STREAK_MAX : STREAK_LABELS[level];
    if (!def) return;
    _streakEl.textContent   = def.text;
    _streakEl.style.color   = def.color;
    _streakEl.style.fontSize = def.size;
    _streakEl.style.animation = 'none';
    void _streakEl.offsetWidth;
    _streakEl.style.animation = 'streakPop 1.4s ease-out forwards';
    _streakEl.style.opacity = 1;
    _streakT = 1.4;
  }

  function _onKill(e) {
    var typeName = 'ENEMY';
    try {
      if (e.type)      typeName = String(e.type).toUpperCase();
      else if (e.name) typeName = String(e.name).toUpperCase();
    } catch (ex) {}
    _addFeed(typeName);

    var now = performance.now() / 1000;
    _killTimes.push(now);
    _killTimes = _killTimes.filter(function (t) { return now - t < STREAK_WINDOW; });
    var streak = _killTimes.length;
    if (streak > _streakLevel) {
      _streakLevel = streak;
      if (streak >= 2) _showStreak(streak);
    }
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt  = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    if (_frameN % 2 === 0) {
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e || !e.mesh) continue;
            var curHp = e.hp !== undefined ? e.hp : null;
            if (curHp === null) continue;
            var prevHp = _prevHp.has(e) ? _prevHp.get(e) : curHp;
            if (curHp <= 0 && prevHp > 0 && !_counted.has(e)) {
              _counted.add(e);
              _onKill(e);
            }
            _prevHp.set(e, curHp);
          }
        }
      } catch (err) {}
    }

    var now2 = performance.now() / 1000;
    var prevCount = _killTimes.length;
    _killTimes = _killTimes.filter(function (t) { return now2 - t < STREAK_WINDOW; });
    if (_killTimes.length === 0 && prevCount > 0) _streakLevel = 0;

    if (_streakT > 0) {
      _streakT -= dt;
      if (_streakT <= 0 && _streakEl) _streakEl.style.opacity = 0;
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

window.KillFeed = KillFeed;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { KillFeed.init(); });
} else {
  KillFeed.init();
}
