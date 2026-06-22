/* ───────────────────────────────────────────────────────────
   ACHIEVEMENTS SYSTEM — 20 achievements with popup display
   ─────────────────────────────────────────────────────────── */
window.Achievements = (function () {
  'use strict';

  /* ── Achievement definitions ──────────────────────────────── */
  var ACHIEVEMENTS = {
    FIRST_BLOOD:    { id: 'FIRST_BLOOD',    name: 'First Blood',        desc: 'Kill your first enemy',                   icon: '🩸', unlocked: false },
    HEADHUNTER:     { id: 'HEADHUNTER',     name: 'Headhunter',         desc: 'Get 10 headshots',                        icon: '🎯', unlocked: false },
    SHARPSHOOTER:   { id: 'SHARPSHOOTER',   name: 'Sharpshooter',       desc: 'Get 25 headshots',                        icon: '🔫', unlocked: false },
    DOUBLE_KILL:    { id: 'DOUBLE_KILL',    name: 'Double Kill',         desc: 'Kill 2 enemies within 2 seconds',         icon: '💥', unlocked: false },
    TRIPLE_KILL:    { id: 'TRIPLE_KILL',    name: 'Triple Kill',         desc: 'Kill 3 enemies within 2 seconds',         icon: '🔥', unlocked: false },
    RAMPAGE:        { id: 'RAMPAGE',        name: 'Rampage',             desc: 'Kill 5 enemies within 5 seconds',         icon: '🔴', unlocked: false },
    UNSTOPPABLE:    { id: 'UNSTOPPABLE',    name: 'Unstoppable',         desc: 'Kill 10 enemies without taking damage',   icon: '⚡', unlocked: false },
    SURVIVOR:       { id: 'SURVIVOR',       name: 'Survivor',            desc: 'Complete a wave with less than 25% health', icon: '💪', unlocked: false },
    MEDIC:          { id: 'MEDIC',          name: 'Combat Medic',        desc: 'Use a bandage 10 times',                  icon: '🏥', unlocked: false },
    GRENADIER:      { id: 'GRENADIER',      name: 'Grenadier',           desc: 'Kill 5 enemies with a single grenade',    icon: '💣', unlocked: false },
    BARREL_MASTER:  { id: 'BARREL_MASTER',  name: 'Barrel Master',       desc: 'Trigger 3 chain barrel explosions',       icon: '🛢️', unlocked: false },
    DRONE_ACE:      { id: 'DRONE_ACE',      name: 'Drone Ace',           desc: 'Get 10 kills with FPV drone',             icon: '🚁', unlocked: false },
    WAVE_CLEAR:     { id: 'WAVE_CLEAR',     name: 'Wave Clearer',        desc: 'Complete 10 waves',                       icon: '🌊', unlocked: false },
    NVG_OPERATOR:   { id: 'NVG_OPERATOR',   name: 'Night Operator',      desc: 'Kill 10 enemies with NVG active',         icon: '🟢', unlocked: false },
    WEATHER_FIGHTER:{ id: 'WEATHER_FIGHTER',name: 'All Weather Warrior', desc: 'Complete a wave in rain, snow, and fog',  icon: '🌦️', unlocked: false },
    PRESTIGE_ONE:   { id: 'PRESTIGE_ONE',   name: 'Prestigious',         desc: 'Reach prestige level 1',                  icon: '⭐', unlocked: false },
    LEVEL_CONQUEROR:{ id: 'LEVEL_CONQUEROR',name: 'Level Conqueror',     desc: 'Complete 5 different city levels',         icon: '🏆', unlocked: false },
    MARKSMAN:       { id: 'MARKSMAN',       name: 'Marksman',            desc: 'Kill 50 enemies total',                   icon: '💯', unlocked: false },
    VETERAN:        { id: 'VETERAN',        name: 'Veteran',             desc: 'Kill 200 enemies total',                  icon: '🎖️', unlocked: false },
    LEGEND:         { id: 'LEGEND',         name: 'Legend',              desc: 'Kill 500 enemies total',                  icon: '👑', unlocked: false },
  };

  var _storage_key = 'okk_achievements_v1';
  var _stats_key   = 'okk_ach_stats_v1';

  /* ── Stats tracking ───────────────────────────────────────── */
  var _stats = {
    kills: 0,
    headshots: 0,
    bandagesUsed: 0,
    wavesCompleted: 0,
    droneKills: 0,
    grenadesMultiKills: 0,
    barrelChains: 0,
    levelsCompleted: [],
    nvgKills: 0,
    weatherTypesCompleted: [],
    // Transient (not persisted between sessions but tracked in-memory)
    _killsWithoutDamage: 0,
    _recentKillTimes: [],  // timestamps for multi-kill detection
  };

  /* ── Popup queue ──────────────────────────────────────────── */
  var _popupQueue = [];
  var _activePopups = 0;
  var _MAX_VISIBLE = 3;

  /* ── CSS injection ────────────────────────────────────────── */
  function _injectCSS() {
    if (document.getElementById('ach-style')) return;
    var style = document.createElement('style');
    style.id = 'ach-style';
    style.textContent = [
      '@keyframes achSlideIn {',
      '  from { transform: translateX(-120%); opacity: 0; }',
      '  to   { transform: translateX(0);     opacity: 1; }',
      '}',
      '@keyframes achSlideOut {',
      '  from { transform: translateX(0);     opacity: 1; }',
      '  to   { transform: translateX(-120%); opacity: 0; }',
      '}',
      '.ach-popup {',
      '  position: fixed;',
      '  left: 14px;',
      '  width: 260px;',
      '  background: rgba(10,10,10,0.92);',
      '  border: 2px solid #c8a800;',
      '  border-radius: 6px;',
      '  padding: 10px 14px;',
      '  z-index: 99999;',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 10px;',
      '  box-shadow: 0 4px 18px rgba(0,0,0,0.7), 0 0 10px rgba(200,168,0,0.3);',
      '  pointer-events: none;',
      '  font-family: "Courier New", monospace;',
      '  animation: achSlideIn 0.35s cubic-bezier(0.22,0.61,0.36,1) forwards;',
      '  transition: top 0.3s ease;',
      '}',
      '.ach-popup.sliding-out {',
      '  animation: achSlideOut 0.35s ease-in forwards;',
      '}',
      '.ach-popup__icon {',
      '  font-size: 2em;',
      '  line-height: 1;',
      '  flex-shrink: 0;',
      '}',
      '.ach-popup__body {',
      '  flex: 1;',
      '  min-width: 0;',
      '}',
      '.ach-popup__label {',
      '  font-size: 0.65em;',
      '  color: #c8a800;',
      '  text-transform: uppercase;',
      '  letter-spacing: 0.08em;',
      '  margin-bottom: 2px;',
      '}',
      '.ach-popup__name {',
      '  font-size: 0.9em;',
      '  color: #fff;',
      '  font-weight: bold;',
      '  white-space: nowrap;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '}',
      '.ach-popup__desc {',
      '  font-size: 0.7em;',
      '  color: #aaa;',
      '  white-space: nowrap;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Popup position helpers ───────────────────────────────── */
  var _POPUP_HEIGHT = 76;   // px per popup slot (height + gap)
  var _POPUP_TOP_BASE = 20; // px from top for first slot

  function _getSlotTop(slotIdx) {
    return _POPUP_TOP_BASE + slotIdx * _POPUP_HEIGHT;
  }

  /* ── Show popup ───────────────────────────────────────────── */
  function _showPopup(ach) {
    if (_activePopups >= _MAX_VISIBLE) {
      // Queue it for later
      _popupQueue.push(ach);
      return;
    }

    _injectCSS();

    var slotIdx = _activePopups;
    _activePopups++;

    var el = document.createElement('div');
    el.className = 'ach-popup';
    el.style.top = _getSlotTop(slotIdx) + 'px';
    el.innerHTML =
      '<div class="ach-popup__icon">' + ach.icon + '</div>' +
      '<div class="ach-popup__body">' +
        '<div class="ach-popup__label">Achievement Unlocked</div>' +
        '<div class="ach-popup__name">' + ach.name + '</div>' +
        '<div class="ach-popup__desc">' + ach.desc + '</div>' +
      '</div>';
    document.body.appendChild(el);

    // Slide out after 3 seconds, then remove
    var slideOutTimer = setTimeout(function () {
      el.classList.add('sliding-out');
      var removeTimer = setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        _activePopups--;
        // Shift remaining popups up
        _repositionPopups();
        // Show next queued achievement if any
        if (_popupQueue.length > 0) {
          _showPopup(_popupQueue.shift());
        }
      }, 350);
      void removeTimer;
    }, 3000);
    void slideOutTimer;
  }

  /* ── Reposition all visible popups ───────────────────────── */
  function _repositionPopups() {
    var popups = document.querySelectorAll('.ach-popup:not(.sliding-out)');
    for (var i = 0; i < popups.length; i++) {
      popups[i].style.top = _getSlotTop(i) + 'px';
    }
  }

  /* ── Load from localStorage ───────────────────────────────── */
  function _load() {
    try {
      var raw = localStorage.getItem(_storage_key);
      if (raw) {
        var saved = JSON.parse(raw);
        for (var id in saved) {
          if (ACHIEVEMENTS[id]) ACHIEVEMENTS[id].unlocked = !!saved[id];
        }
      }
      var rawStats = localStorage.getItem(_stats_key);
      if (rawStats) {
        var savedStats = JSON.parse(rawStats);
        // Merge persisted stats (skip transient fields starting with _)
        for (var k in savedStats) {
          if (k.charAt(0) !== '_' && k in _stats) {
            _stats[k] = savedStats[k];
          }
        }
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }

  /* ── Save to localStorage ─────────────────────────────────── */
  function _save() {
    try {
      var data = {};
      for (var id in ACHIEVEMENTS) {
        data[id] = ACHIEVEMENTS[id].unlocked;
      }
      localStorage.setItem(_storage_key, JSON.stringify(data));

      // Save only persistent stats (skip transient _ fields)
      var statsToSave = {};
      for (var k in _stats) {
        if (k.charAt(0) !== '_') statsToSave[k] = _stats[k];
      }
      localStorage.setItem(_stats_key, JSON.stringify(statsToSave));
    } catch (e) {
      // ignore localStorage errors
    }
  }

  /* ── Unlock achievement ───────────────────────────────────── */
  function unlock(id) {
    if (ACHIEVEMENTS[id] && !ACHIEVEMENTS[id].unlocked) {
      ACHIEVEMENTS[id].unlocked = true;
      _save();
      _showPopup(ACHIEVEMENTS[id]);
      return true;
    }
    return false;
  }

  /* ── Reset transient kill tracking when damage is taken ───── */
  function _onDamageTaken() {
    _stats._killsWithoutDamage = 0;
  }

  /* ── Record a kill ────────────────────────────────────────── */
  function recordKill(opts) {
    opts = opts || {};
    var isHeadshot  = !!opts.headshot;
    var isNvgActive = !!opts.isNvgActive;
    var isDroneKill = !!opts.isDroneKill;

    _stats.kills++;
    if (isHeadshot) _stats.headshots++;
    if (isNvgActive) _stats.nvgKills++;
    if (isDroneKill) _stats.droneKills++;

    // Unstoppable: kills without taking damage (transient counter)
    _stats._killsWithoutDamage++;

    // Multi-kill timing window
    var now = Date.now();
    _stats._recentKillTimes.push(now);
    // Prune old entries (> 5s)
    _stats._recentKillTimes = _stats._recentKillTimes.filter(function (t) {
      return now - t <= 5000;
    });

    _save();
    _checkKillAchievements();
  }

  /* ── Check kill-related achievements ─────────────────────── */
  function _checkKillAchievements() {
    var now = Date.now();

    // Total kill milestones
    if (_stats.kills >= 1)   unlock('FIRST_BLOOD');
    if (_stats.kills >= 50)  unlock('MARKSMAN');
    if (_stats.kills >= 200) unlock('VETERAN');
    if (_stats.kills >= 500) unlock('LEGEND');

    // Headshot milestones
    if (_stats.headshots >= 10) unlock('HEADHUNTER');
    if (_stats.headshots >= 25) unlock('SHARPSHOOTER');

    // NVG kills
    if (_stats.nvgKills >= 10) unlock('NVG_OPERATOR');

    // Drone kills
    if (_stats.droneKills >= 10) unlock('DRONE_ACE');

    // Unstoppable
    if (_stats._killsWithoutDamage >= 10) unlock('UNSTOPPABLE');

    // Multi-kill checks (within 2s window)
    var within2s = _stats._recentKillTimes.filter(function (t) {
      return now - t <= 2000;
    });
    if (within2s.length >= 2) unlock('DOUBLE_KILL');
    if (within2s.length >= 3) unlock('TRIPLE_KILL');

    // Rampage: 5 kills within 5s
    if (_stats._recentKillTimes.length >= 5) unlock('RAMPAGE');
  }

  /* ── Record bandage use ───────────────────────────────────── */
  function recordBandage() {
    _stats.bandagesUsed++;
    _save();
    if (_stats.bandagesUsed >= 10) unlock('MEDIC');
  }

  /* ── Record wave complete ─────────────────────────────────── */
  function recordWaveComplete(levelId) {
    _stats.wavesCompleted++;

    // Track unique levels completed
    if (levelId !== undefined && levelId !== null) {
      var lid = String(levelId);
      if (_stats.levelsCompleted.indexOf(lid) === -1) {
        _stats.levelsCompleted.push(lid);
      }
    }

    // Track weather type for current wave completion
    try {
      if (typeof WeatherSystem !== 'undefined' && WeatherSystem.getWeather) {
        var weather = WeatherSystem.getWeather();
        if (weather === 'rain' || weather === 'heavy_rain') {
          if (_stats.weatherTypesCompleted.indexOf('rain') === -1) {
            _stats.weatherTypesCompleted.push('rain');
          }
        } else if (weather === 'snow') {
          if (_stats.weatherTypesCompleted.indexOf('snow') === -1) {
            _stats.weatherTypesCompleted.push('snow');
          }
        } else if (weather === 'fog') {
          if (_stats.weatherTypesCompleted.indexOf('fog') === -1) {
            _stats.weatherTypesCompleted.push('fog');
          }
        }
      }
    } catch (eW) {}

    _save();
    _checkWaveAchievements();
  }

  /* ── Check wave-related achievements ─────────────────────── */
  function _checkWaveAchievements() {
    if (_stats.wavesCompleted >= 10) unlock('WAVE_CLEAR');

    if (_stats.levelsCompleted.length >= 5) unlock('LEVEL_CONQUEROR');

    // All Weather Warrior: completed a wave in rain, snow, and fog
    var hasRain  = _stats.weatherTypesCompleted.indexOf('rain') !== -1;
    var hasSnow  = _stats.weatherTypesCompleted.indexOf('snow') !== -1;
    var hasFog   = _stats.weatherTypesCompleted.indexOf('fog')  !== -1;
    if (hasRain && hasSnow && hasFog) unlock('WEATHER_FIGHTER');
  }

  /* ── Record survivor (low health wave complete) ───────────── */
  function recordSurvivor(currentHp, maxHp) {
    if (currentHp > 0 && maxHp > 0 && (currentHp / maxHp) < 0.25) {
      unlock('SURVIVOR');
    }
  }

  /* ── Record grenade multi-kill ────────────────────────────── */
  function recordGrenade(killCount) {
    if (killCount >= 5) {
      _stats.grenadesMultiKills++;
      _save();
      unlock('GRENADIER');
    }
  }

  /* ── Record barrel chain explosion ───────────────────────── */
  function recordBarrelChain() {
    _stats.barrelChains++;
    _save();
    if (_stats.barrelChains >= 3) unlock('BARREL_MASTER');
  }

  /* ── Record prestige level ────────────────────────────────── */
  function recordPrestige(level) {
    if (level >= 1) unlock('PRESTIGE_ONE');
  }

  /* ── Called externally when player takes damage ───────────── */
  function onDamageTaken() {
    _onDamageTaken();
  }

  /* ── Getters ──────────────────────────────────────────────── */
  function getAll() {
    return Object.values(ACHIEVEMENTS);
  }

  function getUnlocked() {
    return getAll().filter(function (a) { return a.unlocked; });
  }

  function getStats() {
    return _stats;
  }

  /* ── Initialize on load ───────────────────────────────────── */
  _load();

  /* ── Public API ───────────────────────────────────────────── */
  return {
    unlock: unlock,
    recordKill: recordKill,
    recordBandage: recordBandage,
    recordWaveComplete: recordWaveComplete,
    recordSurvivor: recordSurvivor,
    recordGrenade: recordGrenade,
    recordBarrelChain: recordBarrelChain,
    recordPrestige: recordPrestige,
    onDamageTaken: onDamageTaken,
    getAll: getAll,
    getUnlocked: getUnlocked,
    getStats: getStats,
  };
})();
