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

    /* ── Combat mastery ───────────────────────────────────────── */
    QUICK_DRAW:     { id: 'QUICK_DRAW',     name: 'Quick Draw',          desc: 'Kill an enemy within 2 seconds of the wave starting', icon: '⚡', unlocked: false },
    TRIPLE_HEADSHOT:{ id: 'TRIPLE_HEADSHOT',name: 'Triple Tap',          desc: '3 headshots in a row without missing',    icon: '🎯', unlocked: false },
    KNIFE_ONLY:     { id: 'KNIFE_ONLY',     name: 'Ghost Protocol',      desc: 'Kill 3 enemies in one wave with grenades only', icon: '💣', unlocked: false },
    NO_RELOAD:      { id: 'NO_RELOAD',      name: 'Steady Hands',        desc: 'Kill 5 enemies without reloading',        icon: '🔫', unlocked: false },
    LONG_SHOT:      { id: 'LONG_SHOT',      name: 'Long Distance',       desc: 'Kill an enemy from more than 40 units away', icon: '🏹', unlocked: false },
    CLOSE_QUARTERS: { id: 'CLOSE_QUARTERS', name: 'In Your Face',        desc: 'Kill 3 enemies from within 3 units',      icon: '🥊', unlocked: false },
    REVENGE_KILL:   { id: 'REVENGE_KILL',   name: 'Comeback Kid',        desc: 'Kill the enemy who last damaged you within 5 seconds', icon: '😤', unlocked: false },

    /* ── Progression ──────────────────────────────────────────── */
    WAVE_10:        { id: 'WAVE_10',        name: 'Veteran',             desc: 'Survive 10 waves',                        icon: '🌊', unlocked: false },
    WAVE_25:        { id: 'WAVE_25',        name: 'Hardened Soldier',    desc: 'Survive 25 waves',                        icon: '🎖️', unlocked: false },
    WAVE_50:        { id: 'WAVE_50',        name: 'Iron Man',            desc: 'Survive 50 waves',                        icon: '🛡️', unlocked: false },
    LEVEL_5:        { id: 'LEVEL_5',        name: 'Tour of Duty',        desc: 'Complete 5 levels',                       icon: '📋', unlocked: false },
    LEVEL_10:       { id: 'LEVEL_10',       name: 'Combat Veteran',      desc: 'Complete 10 levels',                      icon: '🏅', unlocked: false },
    SCORE_50K:      { id: 'SCORE_50K',      name: 'High Achiever',       desc: 'Reach a score of 50,000',                 icon: '💰', unlocked: false },
    SCORE_200K:     { id: 'SCORE_200K',     name: 'Legendary',           desc: 'Reach a score of 200,000',                icon: '👑', unlocked: false },
    KILL_100:       { id: 'KILL_100',       name: 'Century',             desc: 'Get 100 total kills',                     icon: '💯', unlocked: false },
    KILL_500:       { id: 'KILL_500',       name: 'Unstoppable',         desc: 'Get 500 total kills',                     icon: '🔥', unlocked: false },

    /* ── Special ──────────────────────────────────────────────── */
    PERK_MASTER:    { id: 'PERK_MASTER',    name: 'Perk Master',         desc: 'Unlock 5 different perks in a single run', icon: '✨', unlocked: false },
    PERFECT_WAVE:   { id: 'PERFECT_WAVE',   name: 'Perfect Wave',        desc: 'Complete a wave with 100% headshot accuracy', icon: '🎯', unlocked: false },
    DRONE_ACE_NEW:  { id: 'DRONE_ACE_NEW',  name: 'Drone Ace',           desc: 'Destroy 10 enemies using drones',         icon: '🚁', unlocked: false },
    SURVIVOR_1HP:   { id: 'SURVIVOR_1HP',   name: 'By A Thread',         desc: 'Complete a wave with 1 HP remaining',     icon: '❤️', unlocked: false },

    /* ── New achievements ─────────────────────────────────────── */
    FIRST_BLOOD_NEW: { id: 'FIRST_BLOOD_NEW', name: 'First Blood',        desc: 'Score your first kill',                   icon: '🩸', unlocked: false },
    VETERAN_WAVES:   { id: 'VETERAN_WAVES',   name: 'Wave Veteran',       desc: 'Survive 20 waves',                        icon: '🎖️', unlocked: false },
    IRON_WILL:       { id: 'IRON_WILL',       name: 'Iron Will',          desc: 'Complete a level with only 5 HP remaining', icon: '🛡️', unlocked: false },
    SILENT_APPROACH: { id: 'SILENT_APPROACH', name: 'Silent Approach',    desc: 'Kill 10 enemies with the knife',          icon: '🔪', unlocked: false },
    DRAGON_SLAYER:   { id: 'DRAGON_SLAYER',   name: 'Dragon Slayer',      desc: 'Defeat 5 boss enemies',                   icon: '🐉', unlocked: false },
    SPRAY_N_PRAY:    { id: 'SPRAY_N_PRAY',    name: 'Spray \'n\' Pray',  desc: 'Fire 1000 rounds in one session',         icon: '💥', unlocked: false },
    PRECISION:       { id: 'PRECISION',       name: 'Precision',          desc: 'Achieve 80% accuracy in a wave',          icon: '🎯', unlocked: false },
    SURVIVOR_I:      { id: 'SURVIVOR_I',      name: 'Survivor I',         desc: 'Complete a level without dying',          icon: '💪', unlocked: false },
    RAMPAGE_NEW:     { id: 'RAMPAGE_NEW',     name: 'Rampage',            desc: 'Kill 5 enemies in 3 seconds',             icon: '🔴', unlocked: false },
    DEMOLITIONS:     { id: 'DEMOLITIONS',     name: 'Demolitions Expert', desc: 'Destroy 10 explosive barrels',            icon: '🛢️', unlocked: false },
    GHOST:           { id: 'GHOST',           name: 'Ghost',              desc: 'Complete a wave without taking damage',   icon: '👻', unlocked: false },
    SNIPER_ELITE:    { id: 'SNIPER_ELITE',    name: 'Sniper Elite',       desc: 'Get 25 headshots in one level',           icon: '🔭', unlocked: false },
    WARMONGER:       { id: 'WARMONGER',       name: 'Warmonger',          desc: 'Reach a 15-kill streak',                  icon: '⚔️', unlocked: false },
    SHOCK_AND_AWE:   { id: 'SHOCK_AND_AWE',   name: 'Shock and Awe',      desc: 'Kill 3 enemies with one grenade',         icon: '💣', unlocked: false },
    GROUND_CONTROL:  { id: 'GROUND_CONTROL',  name: 'Ground Control',     desc: 'Kill 20 enemies while crouched',          icon: '🪖', unlocked: false },
    LIBERATOR:       { id: 'LIBERATOR',       name: 'Liberator',          desc: 'Complete all Ukraine-defense levels',     icon: '🇺🇦', unlocked: false },
    BEAR_HUNTER:     { id: 'BEAR_HUNTER',     name: 'Bear Hunter',        desc: 'Kill 50 Russian bosses',                  icon: '🐻', unlocked: false },
    CENTURION:       { id: 'CENTURION',       name: 'Centurion',          desc: 'Score 100 total kills',                   icon: '💯', unlocked: false },
    MILLENNIUM:      { id: 'MILLENNIUM',      name: 'Millennium',         desc: 'Score 1000 total kills',                  icon: '🌟', unlocked: false },
    LEGENDARY:       { id: 'LEGENDARY',       name: 'Legendary',          desc: 'Unlock all other achievements',           icon: '👑', unlocked: false },
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
    // New persistent stats
    longestKillDist: 0,
    totalLevelsCompleted: 0,
    score: 0,
    totalKills: 0,
    // New persistent stats for added achievements
    knifeKills: 0,
    bossKills: 0,
    russBossKills: 0,
    sessionShots: 0,
    crouchKills: 0,
    barrelKills: 0,
    uaLevelsCompleted: [],
    // Transient (not persisted between sessions but tracked in-memory)
    _killsWithoutDamage: 0,
    _recentKillTimes: [],  // timestamps for multi-kill detection
    _headshotStreak: 0,
    _killsSinceReload: 0,
    _waveGrenadeKills: 0,
    _closeKills: 0,
    _revengeKill: false,
    _lastDamagerTime: 0,
    _perksUnlocked: 0,
    _waveShots: 0,
    _waveHeadshots: 0,
    _waveStartTime: 0,
    _firstWaveKillDone: false,
    _waveHits: 0,
    _levelDeaths: 0,
    _levelHeadshots: 0,
    _killStreak: 0,
    _maxKillStreak: 0,
    _recentKillTimes3s: [],  // for 3-second rampage window
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

  /* ── Check if all achievements are unlocked (Legendary) ─────── */
  function _checkLegendary() {
    var allIds = Object.keys(ACHIEVEMENTS);
    for (var i = 0; i < allIds.length; i++) {
      if (allIds[i] === 'LEGENDARY') continue;
      if (!ACHIEVEMENTS[allIds[i]].unlocked) return;
    }
    unlock('LEGENDARY');
  }

  /* ── Reset transient kill tracking when damage is taken ───── */
  function _onDamageTaken() {
    _stats._killsWithoutDamage = 0;
    _stats._lastDamagerTime = Date.now();
    _stats._revengeKill = false;
    _stats._waveHits++;
    _stats._killStreak = 0;
  }

  /* ── Record a kill ────────────────────────────────────────── */
  function recordKill(opts) {
    opts = opts || {};
    var isHeadshot    = !!opts.headshot;
    var isNvgActive   = !!opts.isNvgActive;
    var isDroneKill   = !!opts.isDroneKill;
    var isGrenadeKill = !!opts.isGrenadeKill;
    var killDist      = opts.distance || 0;
    var isCloseKill   = killDist > 0 && killDist <= 3;
    var isRevengeKill = !!opts.isRevengeKill;
    var isKnifeKill   = !!opts.isKnifeKill;
    var isBossKill    = !!opts.isBossKill;
    var isRussBoss    = !!opts.isRussBoss;
    var isCrouched    = !!opts.isCrouched;
    var isBarrelKill  = !!opts.isBarrelKill;

    _stats.kills++;
    _stats.totalKills++;
    if (isHeadshot) _stats.headshots++;
    if (isNvgActive) _stats.nvgKills++;
    if (isDroneKill) _stats.droneKills++;
    if (isKnifeKill)  _stats.knifeKills++;
    if (isBossKill)   _stats.bossKills++;
    if (isRussBoss)   _stats.russBossKills++;
    if (isCrouched)   _stats.crouchKills++;
    if (isBarrelKill) _stats.barrelKills++;
    if (isHeadshot)   _stats._levelHeadshots++;
    _stats.sessionShots++;

    // Kill streak tracking
    _stats._killStreak++;
    if (_stats._killStreak > _stats._maxKillStreak) {
      _stats._maxKillStreak = _stats._killStreak;
    }

    // 3-second rampage window
    var nowRampage = Date.now();
    _stats._recentKillTimes3s.push(nowRampage);
    _stats._recentKillTimes3s = _stats._recentKillTimes3s.filter(function (t) {
      return nowRampage - t <= 3000;
    });

    // Headshot streak tracking
    if (isHeadshot) {
      _stats._headshotStreak++;
    } else {
      _stats._headshotStreak = 0;
    }

    // Kills without reloading
    _stats._killsSinceReload++;

    // Grenade kills this wave
    if (isGrenadeKill) _stats._waveGrenadeKills++;

    // Distance tracking
    if (killDist > _stats.longestKillDist) _stats.longestKillDist = killDist;

    // Close kills
    if (isCloseKill) _stats._closeKills++;

    // Revenge kill
    if (isRevengeKill) _stats._revengeKill = true;

    // Wave shot / headshot accuracy tracking
    _stats._waveShots++;
    if (isHeadshot) _stats._waveHeadshots++;

    // Unstoppable: kills without taking damage (transient counter)
    _stats._killsWithoutDamage++;

    // Multi-kill timing window
    var now = Date.now();

    // Quick draw: first kill within 2s of wave start
    if (!_stats._firstWaveKillDone && _stats._waveStartTime > 0) {
      if (now - _stats._waveStartTime <= 2000) {
        unlock('QUICK_DRAW');
      }
      _stats._firstWaveKillDone = true;
    }
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

    // New total kill milestones
    if (_stats.totalKills >= 100) unlock('KILL_100');
    if (_stats.totalKills >= 500) unlock('KILL_500');

    // Headshot milestones
    if (_stats.headshots >= 10) unlock('HEADHUNTER');
    if (_stats.headshots >= 25) unlock('SHARPSHOOTER');

    // Headshot streak
    if (_stats._headshotStreak >= 3) unlock('TRIPLE_HEADSHOT');

    // NVG kills
    if (_stats.nvgKills >= 10) unlock('NVG_OPERATOR');

    // Drone kills
    if (_stats.droneKills >= 10) unlock('DRONE_ACE');
    if (_stats.droneKills >= 10) unlock('DRONE_ACE_NEW');

    // Unstoppable
    if (_stats._killsWithoutDamage >= 10) unlock('UNSTOPPABLE');

    // Kills without reloading
    if (_stats._killsSinceReload >= 5) unlock('NO_RELOAD');

    // Long distance kill
    if (_stats.longestKillDist >= 40) unlock('LONG_SHOT');

    // Close quarters kills
    if (_stats._closeKills >= 3) unlock('CLOSE_QUARTERS');

    // Revenge kill
    if (_stats._revengeKill) unlock('REVENGE_KILL');

    // Multi-kill checks (within 2s window)
    var within2s = _stats._recentKillTimes.filter(function (t) {
      return now - t <= 2000;
    });
    if (within2s.length >= 2) unlock('DOUBLE_KILL');
    if (within2s.length >= 3) unlock('TRIPLE_KILL');

    // Rampage: 5 kills within 5s
    if (_stats._recentKillTimes.length >= 5) unlock('RAMPAGE');

    // New achievement checks
    if (_stats.kills >= 1)                       unlock('FIRST_BLOOD_NEW');
    if (_stats.totalKills >= 100)                unlock('CENTURION');
    if (_stats.totalKills >= 1000)               unlock('MILLENNIUM');
    if (_stats.knifeKills >= 10)                 unlock('SILENT_APPROACH');
    if (_stats.bossKills >= 5)                   unlock('DRAGON_SLAYER');
    if (_stats.sessionShots >= 1000)             unlock('SPRAY_N_PRAY');
    if (_stats.crouchKills >= 20)                unlock('GROUND_CONTROL');
    if (_stats.barrelKills >= 10)                unlock('DEMOLITIONS');
    if (_stats.russBossKills >= 50)              unlock('BEAR_HUNTER');
    if (_stats._maxKillStreak >= 15)             unlock('WARMONGER');
    // Rampage new: 5 kills within 3 seconds
    if (_stats._recentKillTimes3s.length >= 5)   unlock('RAMPAGE_NEW');
    // Check legendary (all other achievements unlocked)
    _checkLegendary();
  }

  /* ── Record bandage use ───────────────────────────────────── */
  function recordBandage() {
    _stats.bandagesUsed++;
    _save();
    if (_stats.bandagesUsed >= 10) unlock('MEDIC');
  }

  /* ── Record player death ─────────────────────────────────── */
  function recordDeath() {
    _stats._levelDeaths++;
    _stats._killStreak = 0;
  }

  /* ── Record a Ukraine-defense level complete ─────────────── */
  function recordUALevel(levelId) {
    var lid = String(levelId);
    if (_stats.uaLevelsCompleted.indexOf(lid) === -1) {
      _stats.uaLevelsCompleted.push(lid);
      _save();
    }
    // Liberator: all 5 UA levels completed (adjust count to match game design)
    if (_stats.uaLevelsCompleted.length >= 5) unlock('LIBERATOR');
  }

  /* ── Record wave complete ─────────────────────────────────── */
  function recordWaveComplete(opts) {
    // Support legacy call style: recordWaveComplete(levelId)
    var levelId, currentHp, maxHp;
    if (opts !== null && typeof opts === 'object') {
      levelId   = opts.levelId;
      currentHp = opts.hp;
      maxHp     = opts.maxHp;
    } else {
      levelId = opts;
    }

    _stats.wavesCompleted++;

    // Track unique levels completed
    if (levelId !== undefined && levelId !== null) {
      var lid = String(levelId);
      if (_stats.levelsCompleted.indexOf(lid) === -1) {
        _stats.levelsCompleted.push(lid);
        _stats.totalLevelsCompleted++;
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

    // Perfect wave: 100% headshot accuracy (and at least 1 shot)
    if (_stats._waveShots > 0 && _stats._waveShots === _stats._waveHeadshots) {
      unlock('PERFECT_WAVE');
    }

    // Grenade only wave: 3 grenade kills in one wave
    if (_stats._waveGrenadeKills >= 3) unlock('KNIFE_ONLY');

    // Survivor 1HP
    if (currentHp !== undefined && maxHp !== undefined) {
      if (currentHp <= 1 && currentHp > 0) unlock('SURVIVOR_1HP');
    }

    // Ghost: complete a wave without taking damage
    if (_stats._waveHits === 0) unlock('GHOST');

    // Precision: 80% accuracy in a wave (at least 5 shots fired)
    if (_stats._waveShots >= 5 && (_stats._waveHeadshots / _stats._waveShots) >= 0.8) {
      unlock('PRECISION');
    }

    // Sniper Elite: 25 headshots in one level
    if (_stats._levelHeadshots >= 25) unlock('SNIPER_ELITE');

    // Iron Will: complete a level (wave) with only 5 HP remaining
    if (currentHp !== undefined && currentHp > 0 && currentHp <= 5) {
      unlock('IRON_WILL');
    }

    // Survivor I: complete a level without dying
    if (_stats._levelDeaths === 0) unlock('SURVIVOR_I');

    // Reset per-wave transient stats
    _stats._waveGrenadeKills  = 0;
    _stats._closeKills        = 0;
    _stats._waveShots         = 0;
    _stats._waveHeadshots     = 0;
    _stats._waveStartTime     = 0;
    _stats._firstWaveKillDone = false;
    _stats._waveHits          = 0;

    _save();
    _checkWaveAchievements();
  }

  /* ── Check wave-related achievements ─────────────────────── */
  function _checkWaveAchievements() {
    if (_stats.wavesCompleted >= 10) unlock('WAVE_CLEAR');
    if (_stats.wavesCompleted >= 10) unlock('WAVE_10');
    if (_stats.wavesCompleted >= 20) unlock('VETERAN_WAVES');
    if (_stats.wavesCompleted >= 25) unlock('WAVE_25');
    if (_stats.wavesCompleted >= 50) unlock('WAVE_50');

    if (_stats.levelsCompleted.length >= 5)  unlock('LEVEL_CONQUEROR');
    if (_stats.totalLevelsCompleted >= 5)    unlock('LEVEL_5');
    if (_stats.totalLevelsCompleted >= 10)   unlock('LEVEL_10');

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
    if (currentHp <= 1 && currentHp > 0) {
      unlock('SURVIVOR_1HP');
    }
  }

  /* ── Record grenade multi-kill ────────────────────────────── */
  function recordGrenade(killCount) {
    if (killCount >= 3) {
      unlock('SHOCK_AND_AWE');
    }
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

  /* ── Record reload (resets killsSinceReload counter) ─────── */
  function recordReload() {
    _stats._killsSinceReload = 0;
  }

  /* ── Record a shot fired (for wave accuracy tracking) ────── */
  function recordShot(opts) {
    opts = opts || {};
    _stats._waveShots++;
    if (opts.headshot) _stats._waveHeadshots++;
  }

  /* ── Record wave start (for quick draw timing) ───────────── */
  function recordWaveStart() {
    _stats._waveStartTime     = Date.now();
    _stats._firstWaveKillDone = false;
    _stats._waveGrenadeKills  = 0;
    _stats._closeKills        = 0;
    _stats._waveShots         = 0;
    _stats._waveHeadshots     = 0;
    _stats._waveHits          = 0;
  }

  /* ── Record level start (reset level-scoped transient stats) ── */
  function recordLevelStart() {
    _stats._levelDeaths    = 0;
    _stats._levelHeadshots = 0;
    _stats._maxKillStreak  = 0;
    _stats._killStreak     = 0;
  }

  /* ── Record score update ──────────────────────────────────── */
  function recordScore(newScore) {
    _stats.score = newScore || 0;
    _save();
    if (_stats.score >= 50000)  unlock('SCORE_50K');
    if (_stats.score >= 200000) unlock('SCORE_200K');
  }

  /* ── Record perk unlocked ─────────────────────────────────── */
  function recordPerkUnlocked() {
    _stats._perksUnlocked++;
    if (_stats._perksUnlocked >= 5) unlock('PERK_MASTER');
  }

  /* ── Reset per-run perk counter (call at run start) ──────── */
  function recordRunStart() {
    _stats._perksUnlocked      = 0;
    _stats._headshotStreak     = 0;
    _stats._killsSinceReload   = 0;
    _stats._revengeKill        = false;
    _stats._levelDeaths        = 0;
    _stats._levelHeadshots     = 0;
    _stats._killStreak         = 0;
    _stats._maxKillStreak      = 0;
    _stats._recentKillTimes3s  = [];
    _stats.sessionShots        = 0;
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
    recordReload: recordReload,
    recordShot: recordShot,
    recordWaveStart: recordWaveStart,
    recordScore: recordScore,
    recordPerkUnlocked: recordPerkUnlocked,
    recordRunStart: recordRunStart,
    recordDeath: recordDeath,
    recordUALevel: recordUALevel,
    recordLevelStart: recordLevelStart,
    onDamageTaken: onDamageTaken,
    getAll: getAll,
    getUnlocked: getUnlocked,
    getStats: getStats,
  };
})();
