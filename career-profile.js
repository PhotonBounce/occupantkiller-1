/* ════════════════════════════════════════════════════════════════════════
   CAREER PROFILE — Military Personnel File  (U key)
   Shows a classified dossier card with the player's full combat record.

   localStorage keys:
     okk_career_stats_v1  — cumulative career stats (managed here)
     okk_achievements_v1  — achievement unlocks (read-only)
     okk_progression_v2   — XP / prestige (read-only)

   Exported hooks (called by other modules):
     window._onCareerKill()
     window._onCareerShot()
     window._onCareerHit()
     window._onCareerHeadshot()
   ════════════════════════════════════════════════════════════════════════ */

window.CareerProfile = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────── */
  var CAREER_KEY   = 'okk_career_stats_v1';
  var ACH_KEY      = 'okk_achievements_v1';
  var PROG_KEY     = 'okk_progression_v2';

  var CALLSIGNS = [
    'GHOST-7', 'WOLFPACK', 'RAPTOR', 'VIPER', 'NIGHTHAWK',
    'STALKER', 'REAPER', 'SPECTER', 'PHANTOM', 'NOMAD'
  ];

  var SERVICE_NUMBERS = [
    'UA-2847-4', 'UA-1193-7', 'UA-5521-2', 'UA-3308-9',
    'UA-7744-1', 'UA-0019-6', 'UA-8832-3', 'UA-4467-8'
  ];

  var DEFAULT_STATS = {
    totalKills:       0,
    totalShots:       0,
    totalHits:        0,
    totalHeadshots:   0,
    totalScore:       0,
    totalMissions:    0,
    longestKillStreak: 0,
    totalTimeSec:     0,
    weaponKills:      {},
    lastUpdated:      0
  };

  /* ── Rank table (mirrors progression.js) ───────────────────────────── */
  var RANKS_TABLE = [
    { name: 'Recruit',         xpRequired: 0      },
    { name: 'Private',         xpRequired: 500    },
    { name: 'Corporal',        xpRequired: 1500   },
    { name: 'Senior Cpl',      xpRequired: 3000   },
    { name: 'SGT',             xpRequired: 6000   },
    { name: 'SSgt',            xpRequired: 10000  },
    { name: 'MSgt',            xpRequired: 16000  },
    { name: 'Warrant Officer', xpRequired: 24000  },
    { name: 'Senior WO',       xpRequired: 34000  },
    { name: 'Lieutenant',      xpRequired: 46000  },
    { name: 'Senior Lt.',      xpRequired: 60000  },
    { name: 'Captain',         xpRequired: 80000  },
    { name: 'Major',           xpRequired: 105000 },
    { name: 'Lt. Colonel',     xpRequired: 135000 },
    { name: 'Colonel',         xpRequired: 170000 },
    { name: 'Brigadier Gen.',  xpRequired: 220000 },
    { name: 'Major General',   xpRequired: 280000 },
    { name: 'Lt. General',     xpRequired: 360000 },
    { name: 'General',         xpRequired: 480000 },
    { name: 'Marshal',         xpRequired: 650000 }
  ];

  /* ── Module state ───────────────────────────────────────────────────── */
  var _visible      = false;
  var _overlay      = null;
  var _initialized  = false;
  var _callsign     = '';
  var _serviceNo    = '';
  var _sessionStart = 0;

  /* ── localStorage helpers ───────────────────────────────────────────── */
  function _loadStats() {
    try {
      var raw = localStorage.getItem(CAREER_KEY);
      if (!raw) return _cloneDefaults();
      var parsed = JSON.parse(raw);
      var def = _cloneDefaults();
      for (var k in def) {
        if (typeof parsed[k] === 'undefined') parsed[k] = def[k];
      }
      if (!parsed.weaponKills || typeof parsed.weaponKills !== 'object') {
        parsed.weaponKills = {};
      }
      return parsed;
    } catch (e) {
      return _cloneDefaults();
    }
  }

  function _cloneDefaults() {
    var d = {};
    for (var k in DEFAULT_STATS) {
      d[k] = (k === 'weaponKills') ? {} : DEFAULT_STATS[k];
    }
    return d;
  }

  function _saveStats(stats) {
    try {
      stats.lastUpdated = Date.now();
      localStorage.setItem(CAREER_KEY, JSON.stringify(stats));
    } catch (e) { /* storage full */ }
  }

  function _loadAchievements() {
    try {
      var raw = localStorage.getItem(ACH_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function _loadProgression() {
    try {
      var raw = localStorage.getItem(PROG_KEY);
      return raw ? JSON.parse(raw) : { xp: 0, prestige: 0 };
    } catch (e) { return { xp: 0, prestige: 0 }; }
  }

  /* ── Rank helpers ───────────────────────────────────────────────────── */
  function _getRankName(xp) {
    /* Prefer live Progression module if available */
    if (window.Progression && typeof window.Progression.getRankName === 'function') {
      return window.Progression.getRankName();
    }
    var name = RANKS_TABLE[0].name;
    for (var i = 0; i < RANKS_TABLE.length; i++) {
      if (xp >= RANKS_TABLE[i].xpRequired) name = RANKS_TABLE[i].name;
    }
    return name;
  }

  /* ── Formatting helpers ─────────────────────────────────────────────── */
  function _fmt(n) {
    if (typeof n !== 'number' || isNaN(n)) return '0';
    return n.toLocaleString();
  }

  function _fmtPct(num, den) {
    if (!den || den === 0) return '0.0%';
    return ((num / den) * 100).toFixed(1) + '%';
  }

  function _fmtTime(sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    return h + 'h ' + m + 'm';
  }

  /* ── Threat assessment ──────────────────────────────────────────────── */
  function _threatLevel(totalKills) {
    if (totalKills < 50)   return 'LOW';
    if (totalKills < 200)  return 'MODERATE';
    if (totalKills < 500)  return 'HIGH';
    if (totalKills < 1000) return 'VERY HIGH';
    return 'EXTREME';
  }

  /* ── Favorite weapon ────────────────────────────────────────────────── */
  function _favoriteWeapon(weaponKills) {
    var top = null;
    var topCount = 0;
    for (var w in weaponKills) {
      if (weaponKills[w] > topCount) {
        topCount = weaponKills[w];
        top = w;
      }
    }
    return top || 'NONE';
  }

  /* ── Awards from achievements ───────────────────────────────────────── */
  var AWARD_MAP = {
    FIRST_BLOOD:    { icon: '🎖️', label: 'FIRST BLOOD' },
    HEADHUNTER:     { icon: '🎖️', label: 'HEADHUNTER'  },
    SHARPSHOOTER:   { icon: '🎖️', label: 'SNIPER ELITE'},
    RAMPAGE:        { icon: '🎖️', label: 'RAMPAGE'     },
    UNSTOPPABLE:    { icon: '🎖️', label: 'UNSTOPPABLE' },
    SURVIVOR:       { icon: '🎖️', label: 'SURVIVOR'    },
    GRENADIER:      { icon: '🎖️', label: 'DEMOLITIONS' },
    DRONE_ACE:      { icon: '🎖️', label: 'DRONE ACE'   },
    WAVE_CLEAR:     { icon: '🎖️', label: 'WAVE CLEARER'},
    NVG_OPERATOR:   { icon: '🎖️', label: 'NIGHT OPS'   },
    MARKSMAN:       { icon: '🎖️', label: 'MARKSMAN'    },
    VETERAN:        { icon: '🎖️', label: 'VETERAN'     },
    LEGEND:         { icon: '🎖️', label: 'LEGEND'      },
    PRESTIGE_ONE:   { icon: '🎖️', label: 'PRESTIGIOUS' },
    KILL_100:       { icon: '🎖️', label: 'CENTURY'     },
    KILL_500:       { icon: '🎖️', label: 'IRON CROSS'  },
    KNIFE_ONLY:     { icon: '🎖️', label: 'GHOST'       },
    LONG_SHOT:      { icon: '🎖️', label: 'LONG SHOT'   }
  };

  function _getAwards() {
    /* Prefer live Achievements module */
    var unlocked = [];
    if (window.Achievements && typeof window.Achievements.getUnlocked === 'function') {
      unlocked = window.Achievements.getUnlocked() || [];
    } else {
      var achData = _loadAchievements();
      for (var id in achData) {
        if (achData[id] === true || (achData[id] && achData[id].unlocked)) {
          unlocked.push(id);
        }
      }
    }
    var awards = [];
    for (var i = 0; i < unlocked.length; i++) {
      var key = typeof unlocked[i] === 'string' ? unlocked[i] : unlocked[i].id;
      if (key && AWARD_MAP[key]) awards.push(AWARD_MAP[key]);
    }
    return awards;
  }

  /* ── Build overlay HTML ─────────────────────────────────────────────── */
  function _buildHTML() {
    var cs   = _loadStats();
    var prog = _loadProgression();

    /* Merge live session kills / score */
    var liveKills = (window._player && typeof window._player.kills === 'number')
      ? window._player.kills : 0;
    var liveScore = (window._player && typeof window._player.score === 'number')
      ? window._player.score : 0;

    var totalKills   = cs.totalKills + liveKills;
    var totalScore   = Math.max(cs.totalScore, liveScore);
    var totalShots   = cs.totalShots;
    var totalHits    = cs.totalHits;
    var totalHS      = cs.totalHeadshots;
    var totalMiss    = cs.totalMissions;
    var bestStreak   = cs.longestKillStreak;
    var totalTimeSec = cs.totalTimeSec;
    var weapKills    = cs.weaponKills;

    /* Session time */
    var elapsed = _sessionStart > 0 ? Math.floor((Date.now() - _sessionStart) / 1000) : 0;
    var displayTimeSec = totalTimeSec + elapsed;

    var accuracy     = _fmtPct(totalHits, totalShots);
    var hsPct        = _fmtPct(totalHS, totalKills);
    var favWeapon    = _favoriteWeapon(weapKills);
    var rankName     = _getRankName(prog.xp);
    var threat       = _threatLevel(totalKills);
    var awards       = _getAwards();

    /* Threat color */
    var threatColor = '#44ff88';
    if (threat === 'MODERATE')  threatColor = '#ffcc00';
    if (threat === 'HIGH')      threatColor = '#ff8800';
    if (threat === 'VERY HIGH') threatColor = '#ff4444';
    if (threat === 'EXTREME')   threatColor = '#ff0000';

    /* Awards grid (max 8, two per row) */
    var awardsHTML = '';
    var displayAwards = awards.slice(0, 8);
    if (displayAwards.length === 0) {
      awardsHTML = '<div style="color:#666;font-size:11px;font-family:monospace;padding:2px 0">  — No awards yet —</div>';
    } else {
      awardsHTML = '<div style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:2px">';
      for (var i = 0; i < displayAwards.length; i++) {
        awardsHTML += '<div style="font-size:11px;font-family:monospace;white-space:nowrap">' +
          displayAwards[i].icon + ' ' + displayAwards[i].label +
          '</div>';
      }
      awardsHTML += '</div>';
    }

    /* ── Card HTML ─────────────────────────────────────────────────────── */
    var html = '';

    /* Outer full-screen overlay */
    html += '<div id="career-profile-overlay" style="' +
      'position:fixed;top:0;left:0;right:0;bottom:0;' +
      'background:rgba(0,0,0,0.78);' +
      'z-index:9000;' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-family:monospace;' +
      '">';

    /* Folder panel */
    html += '<div style="' +
      'position:relative;' +
      'background:#f5e9c8;' +
      'border:4px solid #8B6914;' +
      'border-radius:4px;' +
      'padding:0;' +
      'min-width:440px;max-width:540px;width:90vw;' +
      'box-shadow:0 0 40px rgba(0,0,0,0.8),inset 0 0 0 2px #c8a030;' +
      'overflow:hidden;' +
      '">';

    /* CLASSIFIED watermark */
    html += '<div style="' +
      'position:absolute;top:50%;left:50%;' +
      'transform:translate(-50%,-50%) rotate(25deg);' +
      'font-size:64px;font-weight:900;color:rgba(180,0,0,0.08);' +
      'letter-spacing:4px;pointer-events:none;z-index:1;white-space:nowrap;' +
      'font-family:monospace;' +
      '">CLASSIFIED</div>';

    /* TOP SECRET red stamp */
    html += '<div style="' +
      'position:absolute;top:14px;right:16px;z-index:2;' +
      'border:3px solid #cc0000;color:#cc0000;' +
      'padding:3px 8px;font-size:11px;font-weight:900;letter-spacing:2px;' +
      'font-family:monospace;transform:rotate(-8deg);opacity:0.85;' +
      'background:rgba(255,255,255,0.15);border-radius:2px;' +
      '">TOP SECRET</div>';

    /* Inner content (z-index:3 to be above watermarks) */
    html += '<div style="position:relative;z-index:3;">';

    /* Header bar */
    html += '<div style="' +
      'background:#8B6914;color:#f5e9c8;' +
      'text-align:center;padding:10px 12px 8px;' +
      'font-size:13px;font-weight:bold;letter-spacing:2px;' +
      'border-bottom:2px solid #6b4f10;' +
      '">' +
      '★★★ CLASSIFIED PERSONNEL FILE ★★★' +
      '</div>';

    /* Operator / rank row */
    html += '<div style="' +
      'display:flex;justify-content:space-between;' +
      'padding:8px 14px 4px;' +
      'border-bottom:1px solid #c8a030;' +
      'color:#1a1a1a;font-size:12px;' +
      '">';
    html += '<span><strong>OPERATOR:</strong> ' + _callsign + '</span>';
    html += '<span><strong>RANK:</strong> ' + rankName + '</span>';
    html += '</div>';

    html += '<div style="' +
      'display:flex;justify-content:space-between;' +
      'padding:4px 14px 8px;' +
      'border-bottom:2px solid #8B6914;' +
      'color:#1a1a1a;font-size:12px;' +
      '">';
    html += '<span><strong>SERVICE NO:</strong> ' + _serviceNo + '</span>';
    html += '<span><strong>UNIT:</strong> SOF</span>';
    html += '</div>';

    /* Combat Record section */
    html += '<div style="padding:6px 14px 2px;color:#1a1a1a;font-size:12px;">';
    html += '<div style="font-weight:bold;letter-spacing:1px;margin-bottom:4px;color:#5a3d00;">COMBAT RECORD</div>';

    var rows = [
      ['Total Missions',      _fmt(totalMiss)],
      ['Enemies Eliminated',  _fmt(totalKills)],
      ['Total Score',         _fmt(totalScore)],
      ['Accuracy Rating',     accuracy],
      ['Headshot %',          hsPct],
      ['Longest Kill Streak', _fmt(bestStreak)],
      ['Favorite Weapon',     favWeapon],
      ['Time in Combat',      _fmtTime(displayTimeSec)]
    ];

    for (var r = 0; r < rows.length; r++) {
      html += '<div style="display:flex;justify-content:space-between;padding:1px 0;">';
      html += '<span>' + rows[r][0] + '</span>';
      html += '<span style="color:#3a3a3a;font-weight:bold;">[' + rows[r][1] + ']</span>';
      html += '</div>';
    }
    html += '</div>';

    /* Divider */
    html += '<div style="border-top:1px solid #c8a030;margin:4px 14px 4px;"></div>';

    /* Awards section */
    html += '<div style="padding:4px 14px 6px;color:#1a1a1a;">';
    html += '<div style="font-weight:bold;letter-spacing:1px;margin-bottom:4px;font-size:12px;color:#5a3d00;">AWARDS</div>';
    html += awardsHTML;
    html += '</div>';

    /* Divider */
    html += '<div style="border-top:1px solid #c8a030;margin:4px 14px 4px;"></div>';

    /* Threat / status footer */
    html += '<div style="padding:6px 14px 10px;font-size:12px;">';
    html += '<div style="color:#1a1a1a;margin-bottom:2px;">' +
      '<strong>THREAT ASSESSMENT:</strong> ' +
      '<span style="color:' + threatColor + ';font-weight:900;">' + threat + '</span>' +
      '</div>';
    html += '<div style="color:#1a1a1a;">' +
      '<strong>STATUS:</strong> ACTIVE — IN THEATER' +
      '</div>';
    html += '</div>';

    /* Close hint */
    html += '<div style="' +
      'background:#8B6914;color:#f5e9c8;' +
      'text-align:center;padding:4px;font-size:10px;letter-spacing:1px;' +
      '">' +
      'Press U or ESC to close' +
      '</div>';

    html += '</div>'; /* end inner content */
    html += '</div>'; /* end folder panel */
    html += '</div>'; /* end overlay */

    return html;
  }

  /* ── Operator identity (persistent within session) ──────────────────── */
  function _ensureIdentity() {
    if (_callsign) return;
    /* Try to load from localStorage so it's sticky across sessions */
    try {
      var saved = localStorage.getItem('okk_career_identity_v1');
      if (saved) {
        var obj = JSON.parse(saved);
        _callsign  = obj.callsign  || '';
        _serviceNo = obj.serviceNo || '';
      }
    } catch (e) { /* ignore */ }

    if (!_callsign) {
      _callsign  = CALLSIGNS[Math.floor(Math.random() * CALLSIGNS.length)];
      _serviceNo = SERVICE_NUMBERS[Math.floor(Math.random() * SERVICE_NUMBERS.length)];
      try {
        localStorage.setItem('okk_career_identity_v1', JSON.stringify({
          callsign: _callsign,
          serviceNo: _serviceNo
        }));
      } catch (e) { /* ignore */ }
    }
  }

  /* ── Show / Hide ────────────────────────────────────────────────────── */
  function show() {
    if (_visible) return;
    _visible = true;
    _ensureIdentity();

    if (!_overlay) {
      _overlay = document.createElement('div');
      document.body.appendChild(_overlay);
    }
    _overlay.innerHTML = _buildHTML();
    _overlay.style.display = 'block';

    /* Click outside to close */
    var overlayEl = document.getElementById('career-profile-overlay');
    if (overlayEl) {
      overlayEl.addEventListener('click', function (e) {
        if (e.target === overlayEl) hide();
      });
    }
  }

  function hide() {
    if (!_visible) return;
    _visible = false;
    if (_overlay) _overlay.innerHTML = '';
    _overlay.style.display = 'none';
  }

  function toggle() {
    if (_visible) hide(); else show();
  }

  /* ── recordStat ─────────────────────────────────────────────────────── */
  function recordStat(key, value) {
    var stats = _loadStats();
    if (key === 'kill') {
      stats.totalKills += (value || 1);
      /* Track current kill streak via window._player */
      var streak = (window._player && typeof window._player.killStreak === 'number')
        ? window._player.killStreak : 0;
      if (streak > stats.longestKillStreak) stats.longestKillStreak = streak;
    } else if (key === 'shot') {
      stats.totalShots += (value || 1);
    } else if (key === 'hit') {
      stats.totalHits += (value || 1);
    } else if (key === 'headshot') {
      stats.totalHeadshots += (value || 1);
    } else if (key === 'score') {
      /* Pass current total score */
      if (value > stats.totalScore) stats.totalScore = value;
    } else if (key === 'mission') {
      stats.totalMissions += (value || 1);
    } else if (key === 'streak') {
      if (value > stats.longestKillStreak) stats.longestKillStreak = value;
    } else if (key === 'weaponKill') {
      /* value should be weapon name string */
      if (typeof value === 'string') {
        stats.weaponKills[value] = (stats.weaponKills[value] || 0) + 1;
      }
    } else if (key === 'timeSec') {
      stats.totalTimeSec += (value || 0);
    }
    _saveStats(stats);
  }

  /* ── Keyboard handler ───────────────────────────────────────────────── */
  function _onKey(e) {
    /* Ignore if typing in input */
    var tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (e.code === 'KeyU' || e.key === 'u' || e.key === 'U') {
      toggle();
      e.stopPropagation();
      return;
    }
    if ((e.code === 'Escape' || e.key === 'Escape') && _visible) {
      hide();
      e.stopPropagation();
    }
  }

  /* ── Session time tracking ──────────────────────────────────────────── */
  function _startSessionTimer() {
    _sessionStart = Date.now();

    /* Flush session time to localStorage every 60 s */
    setInterval(function () {
      if (_sessionStart <= 0) return;
      var elapsed = Math.floor((Date.now() - _sessionStart) / 1000);
      var stats = _loadStats();
      stats.totalTimeSec += elapsed;
      _saveStats(stats);
      _sessionStart = Date.now(); /* reset so next flush only counts fresh delta */
    }, 60000);

    /* Flush on page unload */
    window.addEventListener('beforeunload', function () {
      if (_sessionStart <= 0) return;
      var elapsed = Math.floor((Date.now() - _sessionStart) / 1000);
      var stats = _loadStats();
      stats.totalTimeSec += elapsed;
      _saveStats(stats);
    });
  }

  /* ── init ───────────────────────────────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    _ensureIdentity();

    /* Create hidden overlay container */
    _overlay = document.createElement('div');
    _overlay.style.display = 'none';
    document.body.appendChild(_overlay);

    /* Keyboard */
    document.addEventListener('keydown', _onKey, true);

    /* Session timer */
    _startSessionTimer();

    /* Global hooks for other modules */
    window._onCareerKill = function () { recordStat('kill', 1); };
    window._onCareerShot = function () { recordStat('shot', 1); };
    window._onCareerHit  = function () { recordStat('hit',  1); };
    window._onCareerHeadshot = function () { recordStat('headshot', 1); };

    console.log('[CareerProfile] initialized — press U to view');
  }

  /* ── Public API ─────────────────────────────────────────────────────── */
  return {
    init:       init,
    toggle:     toggle,
    show:       show,
    hide:       hide,
    recordStat: recordStat
  };

})();

/* Auto-init when DOM is ready */
(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.CareerProfile.init();
    });
  } else {
    window.CareerProfile.init();
  }
})();
