/**
 * stats-screen.js — Career Dossier / Trophy Room
 *
 * Military dossier overlay showing complete career statistics.
 * Toggle with P key. Self-initializing, no game-manager.js changes needed.
 *
 * localStorage keys used:
 *   okk_career_stats_v1   — career stats managed by this module
 *   okk_achievements_v1   — achievement unlocks (read-only)
 *   okk_ach_stats_v1      — shot/hit/headshot counters (read-only)
 *   okk_progression_v2    — XP, prestige (read-only)
 *   okk_leaderboard_v1    — best scores/waves (read-only)
 *   okk_level_records_v1  — completed levels (read-only)
 */

window.StatsScreen = (function () {

  /* ── Constants ──────────────────────────────────────────────────────── */
  var CAREER_KEY      = 'okk_career_stats_v1';
  var ACH_KEY         = 'okk_achievements_v1';
  var ACH_STATS_KEY   = 'okk_ach_stats_v1';
  var PROG_KEY        = 'okk_progression_v2';
  var LB_KEY          = 'okk_leaderboard_v1';
  var LEVELS_KEY      = 'okk_level_records_v1';

  var TOTAL_MISSIONS   = 90;
  var TOTAL_ACHIEVEMENTS = 48;
  var PLAYTIME_SAVE_INTERVAL_MS = 60000;  // save playtime every 60 s

  /* ── Module state ───────────────────────────────────────────────────── */
  var _visible        = false;
  var _overlay        = null;
  var _sessionStartMs = 0;
  var _playtimeTimer  = null;
  var _initialized    = false;

  /* ── Default career stats structure ────────────────────────────────── */
  function _defaultStats() {
    return {
      totalKills:       0,
      totalDeaths:      0,
      totalShots:       0,
      totalHits:        0,
      totalHeadshots:   0,
      bestWave:         0,
      bestScore:        0,
      bestStreak:       0,
      bestKillsInWave:  0,
      totalPlaytimeMs:  0,
      sessionsPlayed:   0,
      weaponKills:      {},
      enemyKills:       {},
      levelsCompleted:  0,
      lastPlayed:       0
    };
  }

  /* ── localStorage helpers ───────────────────────────────────────────── */
  function _loadCareerStats() {
    try {
      var raw = localStorage.getItem(CAREER_KEY);
      if (!raw) return _defaultStats();
      var parsed = JSON.parse(raw);
      var def = _defaultStats();
      // Merge so new fields always exist
      for (var k in def) {
        if (typeof parsed[k] === 'undefined') parsed[k] = def[k];
      }
      return parsed;
    } catch (e) {
      return _defaultStats();
    }
  }

  function _saveCareerStats(stats) {
    try {
      localStorage.setItem(CAREER_KEY, JSON.stringify(stats));
    } catch (e) { /* storage full or unavailable */ }
  }

  function _loadAchStats() {
    try {
      var raw = localStorage.getItem(ACH_STATS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function _loadProgression() {
    try {
      var raw = localStorage.getItem(PROG_KEY);
      return raw ? JSON.parse(raw) : { xp: 0, prestige: 0 };
    } catch (e) { return { xp: 0, prestige: 0 }; }
  }

  function _loadLeaderboard() {
    try {
      var raw = localStorage.getItem(LB_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function _loadLevelRecords() {
    try {
      var raw = localStorage.getItem(LEVELS_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) { return {}; }
  }

  function _loadAchievements() {
    try {
      var raw = localStorage.getItem(ACH_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  /* ── Rank lookup (mirrors progression.js RANKS array) ───────────────── */
  var RANKS = [
    { name: 'Recruit',          xpRequired: 0      },
    { name: 'Private',          xpRequired: 500    },
    { name: 'Corporal',         xpRequired: 1500   },
    { name: 'Senior Corporal',  xpRequired: 3000   },
    { name: 'Sergeant',         xpRequired: 6000   },
    { name: 'Senior Sergeant',  xpRequired: 10000  },
    { name: 'Master Sergeant',  xpRequired: 16000  },
    { name: 'Warrant Officer',  xpRequired: 24000  },
    { name: 'Senior WO',        xpRequired: 34000  },
    { name: 'Lieutenant',       xpRequired: 46000  },
    { name: 'Senior Lt.',       xpRequired: 60000  },
    { name: 'Captain',          xpRequired: 80000  },
    { name: 'Major',            xpRequired: 105000 },
    { name: 'Lt. Colonel',      xpRequired: 135000 },
    { name: 'Colonel',          xpRequired: 170000 },
    { name: 'Brigadier Gen.',   xpRequired: 220000 },
    { name: 'Major General',    xpRequired: 280000 },
    { name: 'Lt. General',      xpRequired: 360000 },
    { name: 'General',          xpRequired: 480000 },
    { name: 'Marshal',          xpRequired: 650000 }
  ];

  function _getRankName(xp) {
    var name = RANKS[0].name;
    for (var i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].xpRequired) name = RANKS[i].name;
    }
    return name;
  }

  function _getRankLevel(xp) {
    var idx = 0;
    for (var i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].xpRequired) idx = i;
    }
    return idx + 1;
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

  function _fmtKD(kills, deaths) {
    if (!deaths || deaths === 0) return kills > 0 ? kills.toFixed(1) : '0.0';
    return (kills / deaths).toFixed(1);
  }

  function _fmtPlaytime(ms) {
    var totalSec = Math.floor(ms / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    return h + 'h ' + m + 'm';
  }

  function _fmtBig(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'k';
    return '' + n;
  }

  /* ── Progress bar HTML ──────────────────────────────────────────────── */
  function _progressBar(value, max, width) {
    width = width || 24;
    var pct  = max > 0 ? Math.min(value / max, 1.0) : 0;
    var fill = Math.round(pct * width);
    var empty = width - fill;
    var bar  = '';
    for (var i = 0; i < fill;  i++) bar += '█';
    for (var j = 0; j < empty; j++) bar += '░';
    return bar;
  }

  /* ── Top weapon / top enemy ──────────────────────────────────────────── */
  function _topEntry(obj) {
    var topKey   = null;
    var topCount = 0;
    var total    = 0;
    for (var k in obj) {
      total += obj[k];
      if (obj[k] > topCount) { topCount = obj[k]; topKey = k; }
    }
    if (!topKey) return { name: 'N/A', pct: 0 };
    var pct = total > 0 ? Math.round((topCount / total) * 100) : 0;
    return { name: topKey, count: topCount, pct: pct };
  }

  /* ── Build overlay HTML ─────────────────────────────────────────────── */
  function _buildHTML() {
    var cs   = _loadCareerStats();
    var ach  = _loadAchievements();
    var ast  = _loadAchStats();
    var prog = _loadProgression();
    var lb   = _loadLeaderboard();
    var lvls = _loadLevelRecords();

    // Merge ach_stats counters into career stats display (ach_stats may be more up-to-date)
    var totalShots     = Math.max(cs.totalShots,     ast.shots      || 0);
    var totalHits      = Math.max(cs.totalHits,      ast.hits       || 0);
    var totalHeadshots = Math.max(cs.totalHeadshots, ast.headshots  || 0);
    var totalKills     = Math.max(cs.totalKills,     ast.kills      || 0);

    // Best scores from leaderboard
    var lbBestScore = 0;
    var lbBestWave  = 0;
    for (var i = 0; i < lb.length; i++) {
      if (lb[i] && typeof lb[i].score === 'number' && lb[i].score > lbBestScore) lbBestScore = lb[i].score;
      if (lb[i] && typeof lb[i].wave  === 'number' && lb[i].wave  > lbBestWave)  lbBestWave  = lb[i].wave;
    }
    var bestWave  = Math.max(cs.bestWave,  lbBestWave);
    var bestScore = Math.max(cs.bestScore, lbBestScore);

    // Missions from level records
    var completedMissions = 0;
    if (lvls && typeof lvls === 'object') {
      completedMissions = Object.keys(lvls).length;
    }

    // Achievements unlocked count
    var achUnlocked = 0;
    if (ach && typeof ach === 'object') {
      for (var id in ach) {
        if (ach[id] && ach[id].unlockedAt) achUnlocked++;
      }
    }

    // Progression data
    var xp       = prog.xp       || 0;
    var prestige = prog.prestige  || 0;
    var rankName = _getRankName(xp);
    var rankLvl  = _getRankLevel(xp);

    // Playtime — include current session's elapsed time
    var sessionElapsed = _sessionStartMs > 0 ? (Date.now() - _sessionStartMs) : 0;
    var totalPlaytimeMs = cs.totalPlaytimeMs + sessionElapsed;

    // Top weapon / enemy
    var topWeapon = _topEntry(cs.weaponKills);
    var topEnemy  = _topEntry(cs.enemyKills);

    // Progress bar values
    var missionBar   = _progressBar(completedMissions, TOTAL_MISSIONS, 24);
    var bestWaveBar  = _progressBar(bestWave, Math.max(bestWave, 100), 22);
    var bestScoreBar = _progressBar(bestScore, Math.max(bestScore, 500000), 22);
    var bestStreakBar = _progressBar(cs.bestStreak, Math.max(cs.bestStreak, 50), 22);
    var bestKWBar    = _progressBar(cs.bestKillsInWave, Math.max(cs.bestKillsInWave, 60), 22);

    var html = '';

    html += '<div id="ss-panel">';

    // Header
    html += '<div id="ss-header">';
    html += '<div id="ss-title-box">';
    html += '<span id="ss-icon">&#127894;</span>';
    html += ' CAREER DOSSIER &mdash; ';
    html += '<span id="ss-rank-name">' + rankName.toUpperCase() + '</span>';
    html += '</div>';
    html += '</div>';

    // Three stat cards
    html += '<div id="ss-cards">';

    // Card 1: Combat
    html += '<div class="ss-card">';
    html += '<div class="ss-card-title">COMBAT</div>';
    html += '<div class="ss-stat"><span class="ss-label">Kills</span><span class="ss-val">' + _fmt(totalKills) + '</span></div>';
    html += '<div class="ss-stat"><span class="ss-label">Deaths</span><span class="ss-val">' + _fmt(cs.totalDeaths) + '</span></div>';
    html += '<div class="ss-stat"><span class="ss-label">K/D</span><span class="ss-val">' + _fmtKD(totalKills, cs.totalDeaths) + '</span></div>';
    html += '<div class="ss-stat"><span class="ss-label">Headshots</span><span class="ss-val">' + _fmtBig(totalHeadshots) + '</span></div>';
    html += '</div>';

    // Card 2: Accuracy
    html += '<div class="ss-card">';
    html += '<div class="ss-card-title">ACCURACY</div>';
    html += '<div class="ss-stat"><span class="ss-label">Shots</span><span class="ss-val">' + _fmtBig(totalShots) + '</span></div>';
    html += '<div class="ss-stat"><span class="ss-label">Hits</span><span class="ss-val">' + _fmtBig(totalHits) + '</span></div>';
    html += '<div class="ss-stat"><span class="ss-label">Accuracy</span><span class="ss-val">' + _fmtPct(totalHits, totalShots) + '</span></div>';
    html += '<div class="ss-stat"><span class="ss-label">HS%</span><span class="ss-val">' + _fmtPct(totalHeadshots, totalKills) + '</span></div>';
    html += '</div>';

    // Card 3: Progression
    html += '<div class="ss-card">';
    html += '<div class="ss-card-title">PROGRESSION</div>';
    html += '<div class="ss-stat"><span class="ss-label">Rank</span><span class="ss-val">' + rankName + '</span></div>';
    html += '<div class="ss-stat"><span class="ss-label">Level</span><span class="ss-val">' + rankLvl + '</span></div>';
    html += '<div class="ss-stat"><span class="ss-label">XP</span><span class="ss-val">' + _fmt(xp) + '</span></div>';
    html += '<div class="ss-stat"><span class="ss-label">Prestige</span><span class="ss-val">' + prestige + '</span></div>';
    html += '</div>';

    html += '</div>'; // ss-cards

    // Best Performances
    html += '<div id="ss-best">';
    html += '<div class="ss-section-title">BEST PERFORMANCES</div>';
    html += '<div class="ss-bar-row"><span class="ss-bar-label">Best Wave: ' + bestWave + '</span><span class="ss-bar">' + bestWaveBar + '</span></div>';
    html += '<div class="ss-bar-row"><span class="ss-bar-label">Best Score: ' + _fmt(bestScore) + '</span><span class="ss-bar">' + bestScoreBar + '</span></div>';
    html += '<div class="ss-bar-row"><span class="ss-bar-label">Best Streak: ' + cs.bestStreak + ' kills</span><span class="ss-bar">' + bestStreakBar + '</span></div>';
    html += '<div class="ss-bar-row"><span class="ss-bar-label">Most Kills/Wave: ' + cs.bestKillsInWave + '</span><span class="ss-bar">' + bestKWBar + '</span></div>';
    html += '</div>';

    // Mission progress
    html += '<div id="ss-missions">';
    html += '<div class="ss-info-row">MISSIONS COMPLETED: <span class="ss-bar-mono">' + missionBar + '</span> ' + completedMissions + '/' + TOTAL_MISSIONS + '</div>';
    html += '<div class="ss-info-row">ACHIEVEMENTS: <span class="ss-highlight">' + achUnlocked + '/' + TOTAL_ACHIEVEMENTS + '</span> unlocked</div>';
    html += '<div class="ss-info-row">SESSIONS PLAYED: <span class="ss-highlight">' + _fmt(cs.sessionsPlayed) + '</span></div>';
    html += '</div>';

    // Extra stats
    html += '<div id="ss-extra">';
    html += '<div class="ss-info-row">FAVORITE WEAPON: <span class="ss-highlight">' + topWeapon.name + (topWeapon.pct ? ' (' + topWeapon.pct + '% of kills)' : '') + '</span></div>';
    html += '<div class="ss-info-row">MOST KILLED ENEMY: <span class="ss-highlight">' + topEnemy.name + (topEnemy.pct ? ' (' + topEnemy.pct + '%)' : '') + '</span></div>';
    html += '<div class="ss-info-row">TOTAL PLAYTIME: <span class="ss-highlight">' + _fmtPlaytime(totalPlaytimeMs) + '</span></div>';
    html += '</div>';

    // Buttons
    html += '<div id="ss-buttons">';
    html += '<button class="ss-btn" id="ss-btn-export" onclick="window.StatsScreen._exportStats()">[ EXPORT STATS ]</button>';
    html += '<button class="ss-btn ss-btn-danger" id="ss-btn-reset" onclick="window.StatsScreen._confirmReset()">[ RESET STATS ]</button>';
    html += '<button class="ss-btn ss-btn-close" onclick="window.StatsScreen.hide()">[ CLOSE (P) ]</button>';
    html += '</div>';

    html += '</div>'; // ss-panel

    return html;
  }

  /* ── CSS ────────────────────────────────────────────────────────────── */
  function _injectStyles() {
    if (document.getElementById('ss-styles')) return;
    var style = document.createElement('style');
    style.id = 'ss-styles';
    style.textContent = [
      '#ss-overlay {',
      '  position: fixed; top: 0; left: 0; width: 100%; height: 100%;',
      '  background: rgba(0, 0, 0, 0.88);',
      '  z-index: 9000;',
      '  display: flex; align-items: center; justify-content: center;',
      '  font-family: "Courier New", Courier, monospace;',
      '  color: #c8d8a0;',
      '}',
      '#ss-panel {',
      '  background: #0a100a;',
      '  border: 2px solid #3a5a2a;',
      '  box-shadow: 0 0 40px rgba(80, 160, 60, 0.3), inset 0 0 80px rgba(0,0,0,0.5);',
      '  padding: 28px 36px;',
      '  max-width: 780px; width: 92vw;',
      '  max-height: 92vh; overflow-y: auto;',
      '}',
      '#ss-header {',
      '  text-align: center; margin-bottom: 22px;',
      '}',
      '#ss-title-box {',
      '  display: inline-block;',
      '  border: 2px solid #5a8a3a;',
      '  padding: 8px 24px;',
      '  font-size: 1.1rem;',
      '  letter-spacing: 0.12em;',
      '  color: #a8e060;',
      '  text-shadow: 0 0 10px rgba(120,200,60,0.6);',
      '}',
      '#ss-icon { font-size: 1.2rem; }',
      '#ss-rank-name { color: #ffd060; font-weight: bold; }',
      '#ss-cards {',
      '  display: flex; gap: 16px; margin-bottom: 20px;',
      '}',
      '.ss-card {',
      '  flex: 1;',
      '  border: 1px solid #3a5a2a;',
      '  padding: 12px 14px;',
      '  background: #0d160d;',
      '}',
      '.ss-card-title {',
      '  font-size: 0.75rem;',
      '  color: #70a040;',
      '  letter-spacing: 0.15em;',
      '  border-bottom: 1px solid #2a4a1a;',
      '  padding-bottom: 6px;',
      '  margin-bottom: 8px;',
      '}',
      '.ss-stat {',
      '  display: flex; justify-content: space-between;',
      '  font-size: 0.82rem; margin: 4px 0;',
      '}',
      '.ss-label { color: #8aaa60; }',
      '.ss-val { color: #d0f080; font-weight: bold; }',
      '#ss-best {',
      '  border: 1px solid #3a5a2a;',
      '  padding: 12px 16px;',
      '  margin-bottom: 16px;',
      '  background: #0d160d;',
      '}',
      '.ss-section-title {',
      '  font-size: 0.72rem;',
      '  color: #70a040;',
      '  letter-spacing: 0.15em;',
      '  margin-bottom: 10px;',
      '}',
      '.ss-bar-row {',
      '  display: flex; justify-content: space-between; align-items: center;',
      '  font-size: 0.78rem; margin: 5px 0;',
      '}',
      '.ss-bar-label {',
      '  color: #a0c070;',
      '  min-width: 200px;',
      '}',
      '.ss-bar {',
      '  color: #50a030;',
      '  letter-spacing: -0.05em;',
      '  font-size: 0.72rem;',
      '}',
      '#ss-missions, #ss-extra {',
      '  margin-bottom: 14px;',
      '  font-size: 0.82rem;',
      '}',
      '.ss-info-row { margin: 6px 0; color: #a0b880; }',
      '.ss-bar-mono {',
      '  color: #50a030;',
      '  letter-spacing: -0.05em;',
      '  font-size: 0.7rem;',
      '}',
      '.ss-highlight { color: #d0f080; font-weight: bold; }',
      '#ss-buttons {',
      '  display: flex; gap: 12px; justify-content: center;',
      '  margin-top: 20px; flex-wrap: wrap;',
      '}',
      '.ss-btn {',
      '  background: none;',
      '  border: 1px solid #5a8a3a;',
      '  color: #a0d060;',
      '  font-family: "Courier New", Courier, monospace;',
      '  font-size: 0.82rem;',
      '  padding: 8px 18px;',
      '  cursor: pointer;',
      '  letter-spacing: 0.08em;',
      '  transition: background 0.15s, color 0.15s;',
      '}',
      '.ss-btn:hover {',
      '  background: #1e3a0e;',
      '  color: #c8f080;',
      '}',
      '.ss-btn-danger { border-color: #8a3a2a; color: #d08060; }',
      '.ss-btn-danger:hover { background: #2a0e08; color: #f0a060; }',
      '.ss-btn-close { border-color: #4a6a8a; color: #80a0c8; }',
      '.ss-btn-close:hover { background: #0a1a2a; color: #a0c8f0; }',
      '#ss-export-notice {',
      '  text-align: center; font-size: 0.75rem;',
      '  color: #70c050; margin-top: 8px;',
      '  min-height: 18px;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Overlay management ─────────────────────────────────────────────── */
  function _createOverlay() {
    var el = document.createElement('div');
    el.id = 'ss-overlay';
    el.innerHTML = _buildHTML();
    document.body.appendChild(el);
    _overlay = el;

    // Notice div for export feedback
    var notice = document.createElement('div');
    notice.id = 'ss-export-notice';
    _overlay.querySelector('#ss-panel').appendChild(notice);

    // Click outside closes
    el.addEventListener('click', function (e) {
      if (e.target === el) hide();
    });
  }

  function _destroyOverlay() {
    if (_overlay) {
      _overlay.parentNode && _overlay.parentNode.removeChild(_overlay);
      _overlay = null;
    }
  }

  /* ── Public: show / hide ────────────────────────────────────────────── */
  function show() {
    if (_visible) return;
    _visible = true;
    _injectStyles();
    _destroyOverlay();   // rebuild fresh with latest data
    _createOverlay();
  }

  function hide() {
    if (!_visible) return;
    _visible = false;
    _destroyOverlay();
  }

  /* ── Export to clipboard ────────────────────────────────────────────── */
  function _exportStats() {
    var cs   = _loadCareerStats();
    var ast  = _loadAchStats();
    var prog = _loadProgression();
    var lb   = _loadLeaderboard();
    var lvls = _loadLevelRecords();

    var totalKills = Math.max(cs.totalKills, ast.kills || 0);
    var totalShots = Math.max(cs.totalShots, ast.shots || 0);
    var totalHits  = Math.max(cs.totalHits,  ast.hits  || 0);
    var totalHS    = Math.max(cs.totalHeadshots, ast.headshots || 0);

    var lbBestScore = 0;
    var lbBestWave  = 0;
    for (var i = 0; i < lb.length; i++) {
      if (lb[i] && typeof lb[i].score === 'number' && lb[i].score > lbBestScore) lbBestScore = lb[i].score;
      if (lb[i] && typeof lb[i].wave  === 'number' && lb[i].wave  > lbBestWave)  lbBestWave  = lb[i].wave;
    }

    var completedMissions = lvls ? Object.keys(lvls).length : 0;
    var xp       = prog.xp || 0;
    var rankName = _getRankName(xp);

    var sessionElapsed  = _sessionStartMs > 0 ? (Date.now() - _sessionStartMs) : 0;
    var totalPlaytimeMs = cs.totalPlaytimeMs + sessionElapsed;

    var lines = [
      '=== CAREER DOSSIER EXPORT ===',
      'Kills: ' + _fmt(totalKills) + ' | Deaths: ' + _fmt(cs.totalDeaths) + ' | K/D: ' + _fmtKD(totalKills, cs.totalDeaths),
      'Accuracy: ' + _fmtPct(totalHits, totalShots) + ' | Headshots: ' + _fmtPct(totalHS, totalKills),
      'Best Wave: ' + Math.max(cs.bestWave, lbBestWave) + ' | Best Score: ' + _fmt(Math.max(cs.bestScore, lbBestScore)),
      'Rank: ' + rankName + ' | XP: ' + _fmt(xp),
      'Missions: ' + completedMissions + ' completed',
      'Playtime: ' + _fmtPlaytime(totalPlaytimeMs),
      '#OccupantKiller'
    ];
    var text = lines.join('\n');

    var notice = document.getElementById('ss-export-notice');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (notice) notice.textContent = 'Stats copied to clipboard!';
      }).catch(function () {
        _fallbackCopy(text, notice);
      });
    } else {
      _fallbackCopy(text, notice);
    }
  }

  function _fallbackCopy(text, notice) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (notice) notice.textContent = 'Stats copied to clipboard!';
    } catch (e) {
      if (notice) notice.textContent = 'Could not copy. Please copy manually.';
    }
  }

  /* ── Reset confirmation ─────────────────────────────────────────────── */
  function _confirmReset() {
    var panel = _overlay && _overlay.querySelector('#ss-panel');
    if (!panel) return;

    // Check if confirm prompt already exists
    if (document.getElementById('ss-reset-confirm')) return;

    var box = document.createElement('div');
    box.id = 'ss-reset-confirm';
    box.style.cssText = [
      'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);',
      'background:#0a100a; border:2px solid #8a3a2a;',
      'padding:28px 36px; text-align:center;',
      'font-family:"Courier New",Courier,monospace;',
      'color:#d08060; z-index:9100;',
      'box-shadow: 0 0 40px rgba(200,80,40,0.4);'
    ].join('');
    box.innerHTML = [
      '<div style="font-size:1rem;margin-bottom:14px;letter-spacing:0.1em;">CONFIRM RESET</div>',
      '<div style="font-size:0.8rem;color:#a08060;margin-bottom:20px;">This will permanently erase all career statistics.</div>',
      '<button class="ss-btn ss-btn-danger" id="ss-reset-yes" style="margin-right:12px;">[ YES, RESET ]</button>',
      '<button class="ss-btn" id="ss-reset-no">[ CANCEL ]</button>'
    ].join('');

    _overlay.style.position = 'relative';
    _overlay.appendChild(box);

    document.getElementById('ss-reset-yes').onclick = function () {
      _overlay.removeChild(box);
      _doReset();
    };
    document.getElementById('ss-reset-no').onclick = function () {
      _overlay.removeChild(box);
    };
  }

  function _doReset() {
    try { localStorage.removeItem(CAREER_KEY); } catch (e) {}
    // Rebuild overlay with fresh data
    hide();
    show();
  }

  /* ── Playtime tracking ──────────────────────────────────────────────── */
  function _savePlaytime() {
    if (_sessionStartMs <= 0) return;
    var cs = _loadCareerStats();
    var elapsed = Date.now() - _sessionStartMs;
    cs.totalPlaytimeMs += elapsed;
    _saveCareerStats(cs);
    // Reset start so we don't double-count on next save
    _sessionStartMs = Date.now();
  }

  function _startPlaytimeTracking() {
    _sessionStartMs = Date.now();
    // Update sessionsPlayed on init
    var cs = _loadCareerStats();
    cs.sessionsPlayed += 1;
    cs.lastPlayed = Date.now();
    _saveCareerStats(cs);

    _playtimeTimer = setInterval(function () {
      _savePlaytime();
    }, PLAYTIME_SAVE_INTERVAL_MS);

    // Save playtime on page unload
    window.addEventListener('beforeunload', function () {
      _savePlaytime();
    });
  }

  /* ── Public: record events ──────────────────────────────────────────── */
  function recordKill(opts) {
    // opts: { weapon, enemyType, isHeadshot, currentStreak, killsThisWave }
    opts = opts || {};
    var cs = _loadCareerStats();
    cs.totalKills += 1;

    if (opts.weapon) {
      cs.weaponKills[opts.weapon] = (cs.weaponKills[opts.weapon] || 0) + 1;
    }
    if (opts.enemyType) {
      cs.enemyKills[opts.enemyType] = (cs.enemyKills[opts.enemyType] || 0) + 1;
    }
    if (opts.isHeadshot) {
      cs.totalHeadshots += 1;
    }
    if (typeof opts.currentStreak === 'number' && opts.currentStreak > cs.bestStreak) {
      cs.bestStreak = opts.currentStreak;
    }
    if (typeof opts.killsThisWave === 'number' && opts.killsThisWave > cs.bestKillsInWave) {
      cs.bestKillsInWave = opts.killsThisWave;
    }
    _saveCareerStats(cs);
  }

  function recordDeath() {
    var cs = _loadCareerStats();
    cs.totalDeaths += 1;
    _saveCareerStats(cs);
  }

  function recordLevel(opts) {
    // opts: { score, wave, shotsThisRound, hitsThisRound }
    opts = opts || {};
    var cs = _loadCareerStats();
    cs.levelsCompleted += 1;
    if (typeof opts.score === 'number' && opts.score > cs.bestScore) {
      cs.bestScore = opts.score;
    }
    if (typeof opts.wave === 'number' && opts.wave > cs.bestWave) {
      cs.bestWave = opts.wave;
    }
    if (typeof opts.shotsThisRound === 'number') {
      cs.totalShots += opts.shotsThisRound;
    }
    if (typeof opts.hitsThisRound === 'number') {
      cs.totalHits += opts.hitsThisRound;
    }
    _saveCareerStats(cs);
  }

  /* ── Public: init ───────────────────────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    _injectStyles();
    _startPlaytimeTracking();
  }

  /* ── Self-initialization ────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    StatsScreen.init();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'p' || e.key === 'P') {
      // Don't trigger if user is typing in an input/textarea
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (window.StatsScreen) {
        window.StatsScreen._visible ? StatsScreen.hide() : StatsScreen.show();
      }
    }
  });

  /* ── Public API ─────────────────────────────────────────────────────── */
  return {
    init:          init,
    show:          show,
    hide:          hide,
    recordKill:    recordKill,
    recordDeath:   recordDeath,
    recordLevel:   recordLevel,
    _visible:      false,        // updated by show/hide via property pattern below
    _exportStats:  _exportStats,
    _confirmReset: _confirmReset
  };

})();

// Keep _visible in sync (since the returned object's _visible is a snapshot)
// We patch show/hide to update the exposed property
(function () {
  var _origShow = window.StatsScreen.show;
  var _origHide = window.StatsScreen.hide;
  window.StatsScreen.show = function () {
    _origShow();
    window.StatsScreen._visible = true;
  };
  window.StatsScreen.hide = function () {
    _origHide();
    window.StatsScreen._visible = false;
  };
})();
