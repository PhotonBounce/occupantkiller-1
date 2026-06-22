window.DailyChallenges = (function() {
  'use strict';
  var STORAGE_KEY = 'okk_daily_challenges_v1';

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

  var _panelEl = null;
  var _panelVisible = false;

  function showDailyChallenges() {
    if (_panelEl) return;
    _panelEl = document.createElement('div');
    _panelEl.id = 'daily-challenges-panel';
    _panelEl.style.cssText = [
      'position:fixed;top:160px;left:12px;',
      'background:rgba(0,0,0,0.8);border:1px solid #334;',
      'border-radius:6px;padding:10px;z-index:700;',
      'font-family:monospace;font-size:11px;min-width:180px;',
      'pointer-events:none;',
    ].join('');
    _renderPanel();
    document.body.appendChild(_panelEl);
    _panelVisible = true;
  }

  function _renderPanel() {
    if (!_panelEl || !_state) return;
    var html = '<div style="color:#ffd700;font-size:12px;font-weight:bold;margin-bottom:8px">📅 DAILY CHALLENGES</div>';
    for (var i = 0; i < _state.challenges.length; i++) {
      var c = _state.challenges[i];
      var pct = Math.min(100, Math.round((c.progress / c.target) * 100));
      var col = c.completed ? '#44ff44' : '#aaa';
      html += '<div style="margin-bottom:6px">';
      html += '<div style="color:' + col + '">' + c.icon + ' ' + c.name + (c.completed ? ' ✓' : '') + '</div>';
      html += '<div style="color:#666;font-size:10px">' + c.desc + '</div>';
      if (!c.completed) {
        html += '<div style="background:#222;height:4px;border-radius:2px;margin-top:2px">';
        html += '<div style="background:#ffd700;height:100%;width:' + pct + '%;border-radius:2px"></div></div>';
        html += '<div style="color:#888;font-size:10px">' + c.progress + '/' + c.target + '</div>';
      }
      html += '</div>';
    }
    _panelEl.innerHTML = html;
  }

  function hidePanel() {
    if (_panelEl) { document.body.removeChild(_panelEl); _panelEl = null; }
    _panelVisible = false;
  }

  function togglePanel() {
    if (_panelVisible) hidePanel(); else showDailyChallenges();
    return _panelVisible;
  }

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

  _init();

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
  };
})();
