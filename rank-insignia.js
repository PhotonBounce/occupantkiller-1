/* ============================================================
 *  RANK-INSIGNIA.JS — Rank badge display + enhanced kill streak HUD
 *  Pattern: IIFE, all var, no let/const
 * ============================================================ */
window.RankInsignia = (function () {
  'use strict';

  /* ── Rank table (27 entries, level 0-20 with repeats for gap fill) ── */
  var RANKS = [
    { level: 0,  name: 'Private',         insignia: '▪',                     stars: 0, color: '#888888' },
    { level: 1,  name: 'Private 1st Cl.', insignia: '▪▪',               stars: 0, color: '#888888' },
    { level: 2,  name: 'Specialist',      insignia: '▲',                     stars: 0, color: '#aaaaaa' },
    { level: 3,  name: 'Corporal',        insignia: '▲▲',               stars: 0, color: '#aaaaaa' },
    { level: 4,  name: 'Sergeant',        insignia: '★',                     stars: 1, color: '#ddaa00' },
    { level: 5,  name: 'Staff Sergeant',  insignia: '★★',               stars: 2, color: '#ddaa00' },
    { level: 6,  name: 'Sgt. 1st Class', insignia: '★★★',         stars: 3, color: '#ddaa00' },
    { level: 7,  name: 'Master Sgt.',     insignia: '★★★★',   stars: 4, color: '#ddaa00' },
    { level: 8,  name: 'Sergeant Major',  insignia: '◆★★★',   stars: 3, color: '#ffcc00' },
    { level: 9,  name: '2nd Lieutenant',  insignia: '◆',                     stars: 0, color: '#88aaff' },
    { level: 10, name: '1st Lieutenant',  insignia: '◆◆',               stars: 0, color: '#88aaff' },
    { level: 11, name: 'Captain',         insignia: '◆◆◆',         stars: 0, color: '#88aaff' },
    { level: 12, name: 'Major',           insignia: '◆◆◆◆',   stars: 0, color: '#88aaff' },
    { level: 13, name: 'Lt. Colonel',     insignia: '◈',                     stars: 0, color: '#aaccff' },
    { level: 14, name: 'Colonel',         insignia: '◈◈',               stars: 0, color: '#aaccff' },
    { level: 15, name: 'Brigadier Gen.',  insignia: '⭐',                     stars: 1, color: '#ffffff' },
    { level: 16, name: 'Major General',   insignia: '⭐⭐',               stars: 2, color: '#ffffff' },
    { level: 17, name: 'Lt. General',     insignia: '⭐⭐⭐',         stars: 3, color: '#ffffff' },
    { level: 18, name: 'General',         insignia: '⭐⭐⭐⭐',   stars: 4, color: '#ffffff' },
    { level: 19, name: 'General of Army', insignia: '⭐⭐⭐⭐⭐', stars: 5, color: '#ffdd00' },
    { level: 20, name: 'Supreme Marshal', insignia: '☆★★★★★☆', stars: 6, color: '#ff8800' }
  ];

  /* ── Internal state ── */
  var _badgeEl = null;
  var _stylesInjected = false;
  var _streakStack = [];  // array of active streak notif elements

  /* ── CSS injection ── */
  function _injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    var style = document.createElement('style');
    style.id = 'rankInsigniaStyles';
    style.textContent = [
      /* Rank badge */
      '#rankBadge {',
      '  position: fixed;',
      '  top: 22px;',        /* below XP bar at top:0 */
      '  left: 8px;',
      '  width: 120px;',
      '  height: 30px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  background: rgba(0,0,0,0.72);',
      '  border-radius: 4px;',
      '  border: 1px solid #888888;',
      '  font-family: monospace;',
      '  font-size: 11px;',
      '  color: #cccccc;',
      '  z-index: 9997;',
      '  pointer-events: none;',
      '  overflow: hidden;',
      '  white-space: nowrap;',
      '  text-overflow: ellipsis;',
      '  transition: border-color 0.4s, color 0.4s;',
      '}',

      /* Promotion banner */
      '@keyframes rankBannerSlideDown {',
      '  from { transform: translateX(-50%) translateY(-110%); opacity: 0; }',
      '  to   { transform: translateX(-50%) translateY(0);    opacity: 1; }',
      '}',
      '@keyframes rankBannerSlideUp {',
      '  from { transform: translateX(-50%) translateY(0);    opacity: 1; }',
      '  to   { transform: translateX(-50%) translateY(-110%); opacity: 0; }',
      '}',
      '@keyframes goldShimmer {',
      '  0%   { background-position: -200% center; }',
      '  100% { background-position:  200% center; }',
      '}',

      /* Streak notif slide-in from right */
      '@keyframes streakSlideIn {',
      '  from { transform: translateX(120%); opacity: 0; }',
      '  to   { transform: translateX(0);    opacity: 1; }',
      '}',
      '@keyframes streakFadeOut {',
      '  from { opacity: 1; }',
      '  to   { opacity: 0; }',
      '}',

      /* Rampage flashing */
      '@keyframes rampageFlash {',
      '  0%, 100% { opacity: 1; }',
      '  50%       { opacity: 0.4; }',
      '}',

      /* Unstoppable edge pulse */
      '@keyframes edgePulse {',
      '  0%, 100% { box-shadow: inset 0 0 0px 0px rgba(255,0,0,0); }',
      '  50%       { box-shadow: inset 0 0 60px 20px rgba(255,0,0,0.35); }',
      '}',
      '#unstoppableEdge {',
      '  position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
      '  pointer-events: none; z-index: 8190;',
      '  animation: edgePulse 0.6s ease-in-out 4;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Badge creation ── */
  function _buildBadge() {
    if (document.getElementById('rankBadge')) {
      _badgeEl = document.getElementById('rankBadge');
      return;
    }
    _badgeEl = document.createElement('div');
    _badgeEl.id = 'rankBadge';
    _badgeEl.title = 'Current Rank';
    document.body.appendChild(_badgeEl);
  }

  /* ── Get rank entry for a given level ── */
  function _rankForLevel(level) {
    var lv = (typeof level === 'number') ? level : 0;
    /* Clamp to last rank if beyond max */
    for (var i = RANKS.length - 1; i >= 0; i--) {
      if (lv >= RANKS[i].level) return RANKS[i];
    }
    return RANKS[0];
  }

  /* ── Promotion sound (ascending 4-note arpeggio) ── */
  function _playPromotionSound() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx = new AudioCtx();
      var freqs = [523.25, 659.25, 783.99, 1046.50]; /* C5, E5, G5, C6 */
      var noteLen = 0.18;
      var gap = 0.04;
      for (var i = 0; i < freqs.length; i++) {
        (function (freq, idx) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.value = freq;
          var start = ctx.currentTime + idx * (noteLen + gap);
          var end = start + noteLen;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
          gain.gain.setValueAtTime(0.22, end - 0.04);
          gain.gain.linearRampToValueAtTime(0, end);
          osc.start(start);
          osc.stop(end);
        })(freqs[i], i);
      }
    } catch (e) {
      /* AudioContext unavailable — silent failure */
    }
  }

  /* ── Rank-up banner ── */
  function showRankUp(newLevel) {
    if (typeof document === 'undefined') return;
    var rank = _rankForLevel(newLevel);

    /* Play promotion sound */
    _playPromotionSound();

    /* Remove any existing banner */
    var existing = document.getElementById('rankPromoBanner');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var banner = document.createElement('div');
    banner.id = 'rankPromoBanner';
    banner.style.cssText = [
      'position:fixed',
      'top:0',
      'left:50%',
      'transform:translateX(-50%) translateY(-110%)',
      'width:min(600px,96vw)',
      'background:rgba(0,0,0,0.92)',
      'border:2px solid ' + rank.color,
      'border-top:none',
      'border-radius:0 0 8px 8px',
      'padding:16px 24px',
      'text-align:center',
      'font-family:monospace',
      'z-index:99998',
      'pointer-events:none',
      'box-shadow:0 4px 32px rgba(0,0,0,0.8)',
      'animation:rankBannerSlideDown 0.5s ease forwards'
    ].join(';');

    var divider = '════════════════════════════════';

    banner.innerHTML = [
      '<div style="color:' + rank.color + ';font-size:11px;letter-spacing:2px;margin-bottom:4px">' + divider + '</div>',
      '<div style="',
        'font-size:18px;',
        'font-weight:bold;',
        'background:linear-gradient(90deg,#b8860b,#ffd700,#fffacd,#ffd700,#b8860b);',
        'background-size:200% auto;',
        'color:transparent;',
        '-webkit-background-clip:text;',
        'background-clip:text;',
        'animation:goldShimmer 1.5s linear infinite;',
        'letter-spacing:3px;',
        'text-shadow:none;',
      '">⭐ PROMOTED TO ' + rank.name.toUpperCase() + ' ⭐</div>',
      '<div style="font-size:26px;margin:8px 0;color:' + rank.color + ';text-shadow:0 0 12px ' + rank.color + '">' + rank.insignia + '</div>',
      '<div style="color:' + rank.color + ';font-size:11px;letter-spacing:2px;margin-top:4px">' + divider + '</div>'
    ].join('');

    document.body.appendChild(banner);

    /* Slide in, stay 3s, then slide back up */
    setTimeout(function () {
      if (!banner.parentNode) return;
      banner.style.animation = 'rankBannerSlideUp 0.5s ease forwards';
      setTimeout(function () {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      }, 500);
    }, 3000);

    /* Also refresh the badge */
    updateRank(newLevel);
  }

  /* ── Kill streak display ── */
  function showStreak(streak) {
    if (typeof document === 'undefined') return;

    var config = null;
    if (streak >= 20) {
      config = {
        icon: '💀',     /* skull */
        label: 'x' + streak + ' UNSTOPPABLE!',
        color: '#ff2222',
        fontSize: '20px',
        flash: false,
        edge: true
      };
    } else if (streak >= 10) {
      config = {
        icon: '⚡',           /* lightning */
        label: 'x' + streak + ' RAMPAGE!',
        color: '#ff8800',
        fontSize: '18px',
        flash: true,
        edge: false
      };
    } else if (streak >= 5) {
      config = {
        icon: '🔥🔥', /* two fire */
        label: 'x' + streak + ' STREAK!',
        color: '#ffcc00',
        fontSize: '16px',
        flash: false,
        edge: false
      };
    } else if (streak >= 3) {
      config = {
        icon: '🔥',     /* fire */
        label: 'x' + streak,
        color: '#ffaa44',
        fontSize: '15px',
        flash: false,
        edge: false
      };
    }

    if (!config) return;

    /* Edge pulse for Unstoppable */
    if (config.edge) {
      var oldEdge = document.getElementById('unstoppableEdge');
      if (oldEdge && oldEdge.parentNode) oldEdge.parentNode.removeChild(oldEdge);
      var edgeEl = document.createElement('div');
      edgeEl.id = 'unstoppableEdge';
      document.body.appendChild(edgeEl);
      /* Remove after animation completes (4 cycles × 0.6s = 2.4s) */
      setTimeout(function () {
        if (edgeEl.parentNode) edgeEl.parentNode.removeChild(edgeEl);
      }, 2500);
    }

    /* Create streak notification */
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'right:12px',
      'top:' + _nextStreakTop() + 'px',
      'background:rgba(0,0,0,0.8)',
      'border:1px solid ' + config.color,
      'border-radius:4px',
      'padding:5px 12px',
      'font-family:monospace',
      'font-size:' + config.fontSize,
      'font-weight:bold',
      'color:' + config.color,
      'text-shadow:0 0 10px ' + config.color,
      'z-index:8300',
      'pointer-events:none',
      'animation:streakSlideIn 0.3s ease forwards',
      'opacity:1',
      (config.flash ? 'animation:streakSlideIn 0.3s ease forwards,rampageFlash 0.4s ease-in-out 4 2s' : '')
    ].join(';');
    el.textContent = config.icon + ' ' + config.label;

    document.body.appendChild(el);
    _streakStack.push(el);

    /* Fade and remove after 2s */
    setTimeout(function () {
      if (!el.parentNode) return;
      el.style.transition = 'opacity 0.5s';
      el.style.opacity = '0';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        var idx = _streakStack.indexOf(el);
        if (idx !== -1) _streakStack.splice(idx, 1);
      }, 500);
    }, 2000);
  }

  /* Calculate stacked vertical offset for multiple streak notifs */
  function _nextStreakTop() {
    var base = 140;
    var spacing = 40;
    return base + (_streakStack.length * spacing);
  }

  /* ── updateRank — refresh badge from level ── */
  function updateRank(level) {
    if (!_badgeEl) return;
    var rank = _rankForLevel(level);
    _badgeEl.style.borderColor = rank.color;
    _badgeEl.style.color = rank.color;
    _badgeEl.textContent = '[' + rank.insignia + '] ' + rank.name.toUpperCase();
    _badgeEl.title = 'Rank: ' + rank.name;
  }

  /* ── getCurrentInsignia — return rank entry for current level ── */
  function getCurrentInsignia() {
    var level = 0;
    /* Try Progression module first */
    if (window.Progression && typeof window.Progression.getLevel === 'function') {
      level = window.Progression.getLevel() || 0;
    } else {
      /* Fall back to localStorage */
      try {
        var raw = localStorage.getItem('okk_progression_v2');
        if (raw) {
          var data = JSON.parse(raw);
          if (typeof data.level === 'number') level = data.level;
          else if (typeof data.rankIndex === 'number') level = data.rankIndex;
        }
      } catch (e) { /* ignore parse errors */ }
    }
    return _rankForLevel(level);
  }

  /* ── init — build DOM, wire global hooks ── */
  function init() {
    if (typeof document === 'undefined') return;
    _injectStyles();
    _buildBadge();

    /* Initial render */
    var current = getCurrentInsignia();
    updateRank(current.level);

    /* Global hooks for other modules to call */
    window._onRankUp = function (newLevel) {
      RankInsignia.showRankUp(newLevel);
    };
    window._onKillStreakDisplay = function (streak) {
      RankInsignia.showStreak(streak);
    };
  }

  /* ── Public API ── */
  return {
    init: init,
    updateRank: updateRank,
    showRankUp: showRankUp,
    showStreak: showStreak,
    getCurrentInsignia: getCurrentInsignia
  };
})();
