window.DailyChallenges = (function() {
  'use strict';
  var STORAGE_KEY = 'okk_daily_challenges_v1';
  var WEEKLY_STORAGE_KEY = 'okk_weekly_v1';

  var CHALLENGE_TEMPLATES = [
    { id: 'kills_50',      name: 'Slaughter',          desc: 'Get 50 kills',                       icon: '💀', type: 'kills',        target: 50,    xp: 200 },
    { id: 'kills_100',     name: 'Carnage',             desc: 'Get 100 kills',                      icon: '☠',  type: 'kills',        target: 100,   xp: 400 },
    { id: 'headshots_20',  name: 'Marksman',            desc: 'Get 20 headshots',                   icon: '🎯', type: 'headshots',    target: 20,    xp: 300 },
    { id: 'headshots_50',  name: 'Sniper Elite',        desc: 'Get 50 headshots',                   icon: '🔭', type: 'headshots',    target: 50,    xp: 500 },
    { id: 'waves_5',       name: 'Veteran',             desc: 'Survive 5 waves',                    icon: '🌊', type: 'waves',        target: 5,     xp: 150 },
    { id: 'waves_10',      name: 'Iron Man',            desc: 'Survive 10 waves',                   icon: '🏆', type: 'waves',        target: 10,    xp: 300 },
    { id: 'nodmg_wave',    name: 'Untouchable',         desc: 'Clear a wave without taking damage', icon: '🛡', type: 'nodmg_wave',   target: 1,     xp: 350 },
    { id: 'levels_3',      name: 'Campaigner',          desc: 'Complete 3 missions',                icon: '🗺', type: 'levels',       target: 3,     xp: 400 },
    { id: 'drone_kills_10',name: 'Drone Ace',           desc: 'Get 10 drone kills',                 icon: '🚁', type: 'drone_kills',  target: 10,    xp: 250 },
    { id: 'grenade_kills_5',name:'Grenadier',           desc: 'Kill 5 enemies with grenades',       icon: '💣', type: 'grenade_kills',target: 5,     xp: 200 },
    { id: 'score_10k',     name: 'High Scorer',         desc: 'Reach 10,000 score',                 icon: '⭐', type: 'score',        target: 10000, xp: 300 },
    { id: 'revive',        name: 'Last Stand Survivor', desc: 'Survive a last stand',               icon: '💪', type: 'last_stand',   target: 1,     xp: 500 },
  ];

  var WEEKLY_TEMPLATES = [
    { id: 'WK_TOTAL_KILLS',   desc: 'Kill {n} enemies this week',        metric: 'weekKills',          target: 500,   reward: 2500, icon: '💀' },
    { id: 'WK_HEADSHOTS',     desc: 'Get {n} headshots',                 metric: 'weekHeadshots',      target: 100,   reward: 1500, icon: '🎯' },
    { id: 'WK_WAVES',         desc: 'Complete {n} waves',                metric: 'weekWaves',          target: 30,    reward: 2000, icon: '🌊' },
    { id: 'WK_LEVELS',        desc: 'Complete {n} levels',               metric: 'weekLevels',         target: 10,    reward: 3000, icon: '🏆' },
    { id: 'WK_SCORE',         desc: 'Earn {n} total score',              metric: 'weekScore',          target: 50000, reward: 2000, icon: '⭐' },
    { id: 'WK_MELEE',         desc: 'Kill {n} enemies with knife',       metric: 'weekMelee',          target: 25,    reward: 1800, icon: '🔪' },
    { id: 'WK_SURVIVAL',      desc: 'Complete {n} waves without dying',  metric: 'weekSurvivalWaves',  target: 5,     reward: 2200, icon: '🛡️' },
    { id: 'WK_ACCURACY',      desc: 'Hit {n}% accuracy over 5 levels',   metric: 'weekAccuracy',       target: 60,    reward: 1600, icon: '🎯' },
  ];

  // ── Daily helpers ────────────────────────────────────────────────────────────

  function _getDayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function _seededRand(seed) {
    // Simple LCG
    var x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  }

  function _getDailyIndices() {
    var key = _getDayKey();
    var seed = 0;
    for (var i = 0; i < key.length; i++) seed = seed * 31 + key.charCodeAt(i);
    var indices = [];
    var used = {};
    var s = seed;
    while (indices.length < 3) {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      var idx = s % CHALLENGE_TEMPLATES.length;
      if (!used[idx]) { used[idx] = true; indices.push(idx); }
    }
    return indices;
  }

  // ── Weekly helpers ───────────────────────────────────────────────────────────

  function _getWeekNum() {
    var d = new Date(); d.setUTCHours(0,0,0,0);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  function _getDaysUntilMonday() {
    var now = new Date();
    var day = now.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
    var daysUntil = (8 - day) % 7; // days until next Monday
    if (daysUntil === 0) daysUntil = 7;
    return daysUntil;
  }

  function _getWeeklyIndices(weekNum) {
    var seed = weekNum * 31337;
    var indices = [];
    var used = {};
    var s = seed;
    while (indices.length < 3) {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      var idx = s % WEEKLY_TEMPLATES.length;
      if (!used[idx]) { used[idx] = true; indices.push(idx); }
    }
    return indices;
  }

  // ── Daily state ──────────────────────────────────────────────────────────────

  var _state = null; // {dayKey, challenges: [{...template, progress, completed}]}

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) _state = JSON.parse(raw);
    } catch(e) {}
  }

  function _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_state)); } catch(e) {}
  }

  function _init() {
    _load();
    var today = _getDayKey();
    if (!_state || _state.dayKey !== today) {
      // New day — generate fresh challenges
      var indices = _getDailyIndices();
      _state = {
        dayKey: today,
        challenges: indices.map(function(i) {
          return {
            id:        CHALLENGE_TEMPLATES[i].id,
            name:      CHALLENGE_TEMPLATES[i].name,
            desc:      CHALLENGE_TEMPLATES[i].desc,
            icon:      CHALLENGE_TEMPLATES[i].icon,
            type:      CHALLENGE_TEMPLATES[i].type,
            target:    CHALLENGE_TEMPLATES[i].target,
            xp:        CHALLENGE_TEMPLATES[i].xp,
            progress:  0,
            completed: false,
          };
        })
      };
      _save();
    }
  }

  function _record(type, amount) {
    if (!_state) return;
    var changed = false;
    for (var i = 0; i < _state.challenges.length; i++) {
      var c = _state.challenges[i];
      if (c.completed || c.type !== type) continue;
      c.progress = Math.min(c.target, c.progress + (amount || 1));
      if (c.progress >= c.target && !c.completed) {
        c.completed = true;
        changed = true;
        _onComplete(c);
      }
      changed = true;
    }
    if (changed) _save();
  }

  function _onComplete(challenge) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(challenge.icon + ' DAILY CHALLENGE: ' + challenge.name + ' COMPLETE! +' + challenge.xp + ' XP', '#ffdd00');
    }
    // Grant XP via Progression if available
    if (typeof Progression !== 'undefined' && Progression.addSeasonXP) {
      Progression.addSeasonXP(challenge.xp);
    }
  }

  // ── Weekly state ─────────────────────────────────────────────────────────────

  var _weeklyStats = null;
  // Resolved weekly challenge entries (from WEEKLY_TEMPLATES), with progress fields
  var _weeklyChallenges = [];

  function _loadWeekly() {
    try {
      var raw = localStorage.getItem(WEEKLY_STORAGE_KEY);
      if (raw) _weeklyStats = JSON.parse(raw);
    } catch(e) {}
  }

  function _saveWeekly() {
    try { localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify(_weeklyStats)); } catch(e) {}
  }

  function _initWeekly() {
    _loadWeekly();
    var weekNum = _getWeekNum();
    if (!_weeklyStats || _weeklyStats.weekNum !== weekNum) {
      _weeklyStats = {
        weekNum:           weekNum,
        weekKills:         0,
        weekHeadshots:     0,
        weekWaves:         0,
        weekLevels:        0,
        weekScore:         0,
        weekMelee:         0,
        weekSurvivalWaves: 0,
        weekAccuracy:      0,
        completed:         [],
      };
      _saveWeekly();
    }
    // Build the challenge list from seed indices
    _rebuildWeeklyChallenges();
  }

  function _rebuildWeeklyChallenges() {
    var weekNum = _weeklyStats ? _weeklyStats.weekNum : _getWeekNum();
    var indices = _getWeeklyIndices(weekNum);
    _weeklyChallenges = indices.map(function(i) {
      var tpl = WEEKLY_TEMPLATES[i];
      var progress = _weeklyStats ? (_weeklyStats[tpl.metric] || 0) : 0;
      var completed = _weeklyStats ? (_weeklyStats.completed.indexOf(tpl.id) !== -1) : false;
      return {
        id:        tpl.id,
        desc:      tpl.desc.replace('{n}', tpl.target),
        metric:    tpl.metric,
        target:    tpl.target,
        reward:    tpl.reward,
        icon:      tpl.icon,
        progress:  progress,
        completed: completed,
      };
    });
  }

  function _checkWeekly() {
    if (!_weeklyStats) return;
    var changed = false;
    for (var i = 0; i < _weeklyChallenges.length; i++) {
      var c = _weeklyChallenges[i];
      if (c.completed) continue;
      var progress = _weeklyStats[c.metric] || 0;
      c.progress = progress;
      if (progress >= c.target) {
        c.completed = true;
        _weeklyStats.completed.push(c.id);
        changed = true;
        _onWeeklyComplete(c);
      }
    }
    if (changed) {
      _saveWeekly();
      _renderPanel();
    }
  }

  function _onWeeklyComplete(challenge) {
    // Gold toast notification
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('🏆 WEEKLY CHALLENGE COMPLETE! +' + challenge.reward + ' XP', '#ffd700');
    }
    // XP via Progression_addKillXP if available
    if (typeof window.Progression_addKillXP === 'function') {
      window.Progression_addKillXP(challenge.reward);
    } else if (typeof Progression !== 'undefined' && Progression.addSeasonXP) {
      Progression.addSeasonXP(challenge.reward);
    }
    // Achievement SFX
    if (typeof AudioSystem !== 'undefined' && AudioSystem.playAchievementUnlockNew) {
      AudioSystem.playAchievementUnlockNew();
    }
  }

  // ── Window-level update hooks ─────────────────────────────────────────────────

  window._onWeeklyKill = function() {
    if (!_weeklyStats) return;
    _weeklyStats.weekKills++;
    _saveWeekly();
    _checkWeekly();
  };

  window._onWeeklyHeadshot = function() {
    if (!_weeklyStats) return;
    _weeklyStats.weekHeadshots++;
    _saveWeekly();
    _checkWeekly();
  };

  window._onWeeklyWave = function() {
    if (!_weeklyStats) return;
    _weeklyStats.weekWaves++;
    _saveWeekly();
    _checkWeekly();
  };

  window._onWeeklyLevel = function() {
    if (!_weeklyStats) return;
    _weeklyStats.weekLevels++;
    _saveWeekly();
    _checkWeekly();
  };

  window._onWeeklyScore = function(score) {
    if (!_weeklyStats) return;
    _weeklyStats.weekScore = (_weeklyStats.weekScore || 0) + (score || 0);
    _saveWeekly();
    _checkWeekly();
  };

  window._onWeeklyMelee = function() {
    if (!_weeklyStats) return;
    _weeklyStats.weekMelee++;
    _saveWeekly();
    _checkWeekly();
  };

  window._onWeeklySurvivalWave = function() {
    if (!_weeklyStats) return;
    _weeklyStats.weekSurvivalWaves++;
    _saveWeekly();
    _checkWeekly();
  };

  window._onWeeklyAccuracy = function(pct) {
    if (!_weeklyStats) return;
    // weekAccuracy tracks best % achieved
    if ((pct || 0) > (_weeklyStats.weekAccuracy || 0)) {
      _weeklyStats.weekAccuracy = pct;
      _saveWeekly();
      _checkWeekly();
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────────

  var _panelEl = null;
  var _panelVisible = false;
  var _activeTab = 'daily'; // 'daily' | 'weekly'

  function showDailyChallenges() {
    if (_panelEl) return;
    _panelEl = document.createElement('div');
    _panelEl.id = 'daily-challenges-panel';
    _panelEl.style.cssText = [
      'position:fixed;top:160px;left:12px;',
      'background:rgba(0,0,0,0.8);border:1px solid #334;',
      'border-radius:6px;padding:10px;z-index:700;',
      'font-family:monospace;font-size:11px;min-width:200px;',
      'pointer-events:auto;',
    ].join('');
    _renderPanel();
    document.body.appendChild(_panelEl);
    _panelVisible = true;
  }

  function _renderPanel() {
    if (!_panelEl || !_state) return;

    var daysLeft = _getDaysUntilMonday();
    var tabBarHtml = [
      '<div style="display:flex;gap:4px;margin-bottom:8px">',
        '<div id="dc-tab-daily" style="',
          'cursor:pointer;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:bold;',
          _activeTab === 'daily'
            ? 'background:#ffd700;color:#000;'
            : 'background:#222;color:#888;border:1px solid #444;',
        '" onclick="DailyChallenges._setTab(\'daily\')">DAILY</div>',
        '<div id="dc-tab-weekly" style="',
          'cursor:pointer;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:bold;',
          _activeTab === 'weekly'
            ? 'background:#c084fc;color:#000;'
            : 'background:#222;color:#888;border:1px solid #444;',
        '" onclick="DailyChallenges._setTab(\'weekly\')">WEEKLY</div>',
      '</div>',
    ].join('');

    var contentHtml = '';
    if (_activeTab === 'daily') {
      contentHtml += '<div style="color:#ffd700;font-size:12px;font-weight:bold;margin-bottom:8px">📅 DAILY CHALLENGES</div>';
      for (var i = 0; i < _state.challenges.length; i++) {
        var c = _state.challenges[i];
        var pct = Math.min(100, Math.round((c.progress / c.target) * 100));
        var col = c.completed ? '#44ff44' : '#aaa';
        contentHtml += '<div style="margin-bottom:6px">';
        contentHtml += '<div style="color:' + col + '">' + c.icon + ' ' + c.name + (c.completed ? ' ✓' : '') + '</div>';
        contentHtml += '<div style="color:#666;font-size:10px">' + c.desc + '</div>';
        if (!c.completed) {
          contentHtml += '<div style="background:#222;height:4px;border-radius:2px;margin-top:2px">';
          contentHtml += '<div style="background:#ffd700;height:100%;width:' + pct + '%;border-radius:2px"></div></div>';
          contentHtml += '<div style="color:#888;font-size:10px">' + c.progress + '/' + c.target + '</div>';
        }
        contentHtml += '</div>';
      }
    } else {
      // Weekly tab
      contentHtml += '<div style="color:#c084fc;font-size:12px;font-weight:bold;margin-bottom:4px">🗓️ WEEKLY CHALLENGES</div>';
      contentHtml += '<div style="color:#666;font-size:10px;margin-bottom:8px">Resets in ' + daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + '</div>';
      for (var j = 0; j < _weeklyChallenges.length; j++) {
        var wc = _weeklyChallenges[j];
        // Sync latest progress from stats
        if (_weeklyStats) wc.progress = _weeklyStats[wc.metric] || 0;
        var wpct = Math.min(100, Math.round((wc.progress / wc.target) * 100));
        var wcol = wc.completed ? '#44ff44' : '#aaa';
        contentHtml += '<div style="margin-bottom:8px">';
        contentHtml += '<div style="color:' + wcol + '">' + wc.icon + ' ' + wc.desc + (wc.completed ? ' ✓' : '') + '</div>';
        contentHtml += '<div style="color:#c084fc;font-size:10px">Reward: +' + wc.reward + ' XP</div>';
        if (!wc.completed) {
          contentHtml += '<div style="background:#222;height:4px;border-radius:2px;margin-top:2px">';
          contentHtml += '<div style="background:#c084fc;height:100%;width:' + wpct + '%;border-radius:2px"></div></div>';
          contentHtml += '<div style="color:#888;font-size:10px">' + wc.progress + '/' + wc.target + '</div>';
        }
        contentHtml += '</div>';
      }
    }

    _panelEl.innerHTML = tabBarHtml + contentHtml;
  }

  function hidePanel() {
    if (_panelEl) { document.body.removeChild(_panelEl); _panelEl = null; }
    _panelVisible = false;
  }

  function togglePanel() {
    if (_panelVisible) hidePanel(); else showDailyChallenges();
    return _panelVisible;
  }

  function _setTab(tab) {
    _activeTab = tab;
    _renderPanel();
  }

  // ── Daily record functions ────────────────────────────────────────────────────

  function recordKill()        { _record('kills', 1);        _renderPanel(); }
  function recordHeadshot()    { _record('headshots', 1);    _renderPanel(); }
  function recordWave()        { _record('waves', 1);        _renderPanel(); }
  function recordLevel()       { _record('levels', 1);       _renderPanel(); }
  function recordDroneKill()   { _record('drone_kills', 1);  _renderPanel(); }
  function recordGrenadeKill() { _record('grenade_kills', 1);_renderPanel(); }
  function recordScore(score) {
    if (_state) {
      for (var i = 0; i < _state.challenges.length; i++) {
        if (_state.challenges[i].type === 'score') {
          _state.challenges[i].progress = Math.max(_state.challenges[i].progress, score || 0);
        }
      }
      _save(); _renderPanel();
    }
  }
  function recordNoDamageWave() { _record('nodmg_wave', 1);  _renderPanel(); }
  function recordLastStand()    { _record('last_stand', 1);   _renderPanel(); }

  // ── Weekly public update function ─────────────────────────────────────────────

  function updateWeekly(metric, value) {
    if (!_weeklyStats) return;
    if (metric === 'weekScore' || metric === 'weekAccuracy') {
      _weeklyStats[metric] = (_weeklyStats[metric] || 0) + (value || 0);
    } else {
      _weeklyStats[metric] = (_weeklyStats[metric] || 0) + (value || 1);
    }
    _saveWeekly();
    _checkWeekly();
  }

  // ── Init ──────────────────────────────────────────────────────────────────────

  _init();
  _initWeekly();

  return {
    showDailyChallenges: showDailyChallenges,
    hidePanel:           hidePanel,
    togglePanel:         togglePanel,
    recordKill:          recordKill,
    recordHeadshot:      recordHeadshot,
    recordWave:          recordWave,
    recordLevel:         recordLevel,
    recordDroneKill:     recordDroneKill,
    recordGrenadeKill:   recordGrenadeKill,
    recordScore:         recordScore,
    recordNoDamageWave:  recordNoDamageWave,
    recordLastStand:     recordLastStand,
    getState:            function() { return _state; },
    getWeeklyStats:      function() { return _weeklyStats; },
    getWeeklyChallenges: function() { return _weeklyChallenges; },
    updateWeekly:        updateWeekly,
    _setTab:             _setTab,
  };
})();
