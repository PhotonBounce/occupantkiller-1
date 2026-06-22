/* ============================================================
 *  PROGRESSION.JS — 7 new progression/meta features
 *  Features: prestige system, daily challenges, bounty board,
 *  war journal, stats tracking, leaderboard, challenge modes,
 *  XP leveling, Ukrainian military rank system, prestige bonuses
 * ============================================================ */
const Progression = (function () {
  'use strict';

  /* ── XP & Ukrainian Military Rank System ───── */
  var RANKS = [
    { rank: 1,  name: 'Рядовий',                  eng: 'Private',           xpRequired: 0      },
    { rank: 2,  name: 'Молодший сержант',           eng: 'Private 1st',       xpRequired: 500    },
    { rank: 3,  name: 'Сержант',                    eng: 'Corporal',          xpRequired: 1200   },
    { rank: 4,  name: 'Старший сержант',             eng: 'Sergeant',          xpRequired: 2500   },
    { rank: 5,  name: 'Старшина',                   eng: 'Staff Sergeant',    xpRequired: 4500   },
    { rank: 6,  name: 'Прапорщик',                  eng: 'Warrant Officer',   xpRequired: 7500   },
    { rank: 7,  name: 'Молодший лейтенант',          eng: 'Second Lt',         xpRequired: 12000  },
    { rank: 8,  name: 'Лейтенант',                  eng: 'Lieutenant',        xpRequired: 18000  },
    { rank: 9,  name: 'Старший лейтенант',           eng: 'Senior Lt',         xpRequired: 26000  },
    { rank: 10, name: 'Капітан',                    eng: 'Captain',           xpRequired: 36000  },
    { rank: 11, name: 'Майор',                      eng: 'Major',             xpRequired: 50000  },
    { rank: 12, name: 'Підполковник',               eng: 'Lt Colonel',        xpRequired: 70000  },
    { rank: 13, name: 'Полковник',                  eng: 'Colonel',           xpRequired: 95000  },
    { rank: 14, name: 'Бригадний генерал',           eng: 'Brigadier',         xpRequired: 130000 },
    { rank: 15, name: 'Генерал-майор',              eng: 'Major General',     xpRequired: 175000 },
    { rank: 16, name: 'Генерал-лейтенант',          eng: 'Lt General',        xpRequired: 230000 },
    { rank: 17, name: 'Генерал',                    eng: 'General',           xpRequired: 300000 },
    { rank: 18, name: 'Генерал армії',              eng: 'General of Army',   xpRequired: 400000 },
    { rank: 19, name: 'Маршал',                     eng: 'Marshal',           xpRequired: 550000 },
    { rank: 20, name: 'Верховний Головнокомандувач', eng: 'Supreme Commander', xpRequired: 750000 }
  ];

  /* Rank emoji by rank number */
  var RANK_EMOJIS = ['🪖','🪖','🎖️','🎖️','🏅','🏅','⭐','⭐','🌟','🌟','🌟','💫','💫','🏆','🏆','🏆','👑','👑','👑','⚜️'];

  /* Prestige badge styles */
  var PRESTIGE_BADGE_STYLES = {
    0: { color: '#aaaaaa', label: '' },
    1: { color: '#aaaaaa', label: '★'  },
    2: { color: '#c0c0c0', label: '★★' },
    3: { color: '#ffd700', label: '★★★' },
    4: { color: 'rainbow', label: '★★★★' },
    5: { color: '#ff44ff', label: '★★★★★' }
  };

  var _totalXP = 0;
  var _rankIndex = 0; // 0-based index into RANKS array

  function _getRankIndexForXP(xp) {
    var idx = 0;
    for (var i = RANKS.length - 1; i >= 0; i--) {
      if (xp >= RANKS[i].xpRequired) { idx = i; break; }
    }
    return idx;
  }

  function _getPrestigeXPMult() {
    if (prestigeLevel >= 5) return 2.0;
    if (prestigeLevel === 4) return 1.75;
    if (prestigeLevel === 3) return 1.50;
    if (prestigeLevel === 2) return 1.25;
    if (prestigeLevel === 1) return 1.10;
    return 1.0;
  }

  function addXP(amount, reason) {
    var mult = _getPrestigeXPMult();
    var gained = Math.round(amount * mult);
    _totalXP += gained;
    var newIdx = _getRankIndexForXP(_totalXP);
    var didRankUp = newIdx > _rankIndex;
    _rankIndex = newIdx;
    if (didRankUp) {
      onRankUp(RANKS[_rankIndex]);
    }
    _saveXPData();
    /* Update XP bar UI */
    _updateXPBar(didRankUp);
    _showXPGainPopup(gained);
    /* Show at full opacity for 4s on any XP gain */
    if (typeof document !== 'undefined') {
      var xpBar = document.getElementById('xpProgressBar');
      if (xpBar) {
        if (_xpBarFadeTimer) clearTimeout(_xpBarFadeTimer);
        xpBar.style.opacity = '1';
        _xpBarFadeTimer = setTimeout(function () {
          var b = document.getElementById('xpProgressBar');
          if (b) { b.style.opacity = '0.4'; }
        }, 4000);
      }
    }
    return { gained: gained, totalXP: _totalXP, rankedUp: didRankUp };
  }

  function getRank() {
    return RANKS[_rankIndex];
  }

  function getXP() {
    return _totalXP;
  }

  function getXPToNext() {
    if (_rankIndex >= RANKS.length - 1) return 0;
    return RANKS[_rankIndex + 1].xpRequired - _totalXP;
  }

  function getXPProgress() {
    if (_rankIndex >= RANKS.length - 1) return 1.0;
    var cur = RANKS[_rankIndex].xpRequired;
    var next = RANKS[_rankIndex + 1].xpRequired;
    return (_totalXP - cur) / (next - cur);
  }

  function onRankUp(newRank) {
    var rankIdx = newRank.rank - 1;
    var emoji = RANK_EMOJIS[rankIdx] || '🏅';

    /* Determine border color from prestige */
    var borderColor = '#4fc3f7';
    if (prestigeLevel >= 4) borderColor = 'transparent';
    else if (prestigeLevel === 3) borderColor = '#ffd700';
    else if (prestigeLevel === 2) borderColor = '#c0c0c0';
    else if (prestigeLevel === 1) borderColor = '#b0b0b0';

    /* Build and inject toast overlay (browser only) */
    if (typeof document !== 'undefined') {
      var existing = document.getElementById('rankUpToast');
      if (existing) existing.remove();

      var toast = document.createElement('div');
      toast.id = 'rankUpToast';
      toast.style.cssText = [
        'position:fixed',
        'top:50%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'background:rgba(0,0,0,0.88)',
        'color:#fff',
        'font-family:monospace',
        'font-size:22px',
        'font-weight:bold',
        'padding:28px 48px',
        'border-radius:10px',
        'z-index:99999',
        'text-align:center',
        'pointer-events:none',
        (prestigeLevel >= 4
          ? 'border:3px solid transparent;background-clip:padding-box;outline:3px solid;outline-color:hsl(' + ((Date.now() / 20) % 360) + 'deg,100%,60%)'
          : 'border:3px solid ' + borderColor)
      ].join(';');

      toast.innerHTML = [
        '<div style="font-size:14px;letter-spacing:3px;color:#aaa;margin-bottom:6px">RANK UP</div>',
        '<div style="font-size:36px;margin:4px 0">' + emoji + '</div>',
        '<div style="color:#4fc3f7">' + newRank.name + '</div>',
        '<div style="font-size:16px;color:#ccc;margin-top:4px">(' + newRank.eng + ')</div>'
      ].join('');

      document.body.appendChild(toast);

      /* Rainbow border animation for prestige 4+ */
      if (prestigeLevel >= 4) {
        var hue = 0;
        var rainbowInterval = setInterval(function () {
          hue = (hue + 6) % 360;
          toast.style.outlineColor = 'hsl(' + hue + 'deg,100%,60%)';
        }, 33);
        setTimeout(function () { clearInterval(rainbowInterval); }, 4000);
      }

      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 4000);
    }

    _updateRankBadge();
    _showRankUpBanner(newRank);
  }

  /* ── XP Progress Bar HUD ────────────────────── */
  var _xpBarFadeTimer = null;

  function _buildXPBar() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('xpProgressBar')) return;

    /* Inject keyframe CSS for animations */
    if (!document.getElementById('xpBarStyles')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'xpBarStyles';
      styleEl.textContent = [
        '@keyframes xpGainFloat {',
        '  0%   { opacity:1; transform:translateX(-50%) translateY(0); }',
        '  100% { opacity:0; transform:translateX(-50%) translateY(-25px); }',
        '}',
        '@keyframes rankBannerSlide {',
        '  0%   { opacity:0; transform:translateX(-50%) translateY(-30px); }',
        '  15%  { opacity:1; transform:translateX(-50%) translateY(0); }',
        '  80%  { opacity:1; transform:translateX(-50%) translateY(0); }',
        '  100% { opacity:0; transform:translateX(-50%) translateY(-20px); }',
        '}'
      ].join('\n');
      document.head.appendChild(styleEl);
    }

    /* Outer container */
    var bar = document.createElement('div');
    bar.id = 'xpProgressBar';
    bar.style.cssText = [
      'position:fixed',
      'top:0px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:400px',
      'height:18px',
      'z-index:9998',
      'display:flex',
      'align-items:center',
      'background:rgba(0,0,0,0.7)',
      'border-radius:0 0 6px 6px',
      'overflow:hidden',
      'pointer-events:none',
      'opacity:1',
      'transition:opacity 0.6s ease'
    ].join(';');

    /* Fill bar */
    var fill = document.createElement('div');
    fill.id = 'xpBarFill';
    fill.style.cssText = [
      'position:absolute',
      'left:0',
      'top:0',
      'height:100%',
      'width:0%',
      'background:linear-gradient(90deg,#0066cc,#00aaff)',
      'transition:width 0.4s ease',
      'z-index:1'
    ].join(';');

    /* Left rank label */
    var leftLabel = document.createElement('span');
    leftLabel.id = 'xpBarLeftLabel';
    leftLabel.style.cssText = [
      'position:absolute',
      'left:4px',
      'font-family:monospace',
      'font-size:9px',
      'color:#fff',
      'font-weight:bold',
      'white-space:nowrap',
      'z-index:2',
      'text-shadow:0 0 3px #000'
    ].join(';');

    /* Right rank label */
    var rightLabel = document.createElement('span');
    rightLabel.id = 'xpBarRightLabel';
    rightLabel.style.cssText = [
      'position:absolute',
      'right:4px',
      'font-family:monospace',
      'font-size:9px',
      'color:#fff',
      'font-weight:bold',
      'white-space:nowrap',
      'z-index:2',
      'text-shadow:0 0 3px #000'
    ].join(';');

    /* Center XP text */
    var centerText = document.createElement('span');
    centerText.id = 'xpBarCenterText';
    centerText.style.cssText = [
      'position:absolute',
      'left:0',
      'right:0',
      'text-align:center',
      'font-family:monospace',
      'font-size:9px',
      'color:#fff',
      'font-weight:bold',
      'z-index:2',
      'text-shadow:0 0 3px #000'
    ].join(';');

    bar.appendChild(fill);
    bar.appendChild(leftLabel);
    bar.appendChild(rightLabel);
    bar.appendChild(centerText);
    document.body.appendChild(bar);

    _updateXPBar(false);
    _scheduleXPBarFade();
  }

  function _updateXPBar(flashGold) {
    if (typeof document === 'undefined') return;
    var bar = document.getElementById('xpProgressBar');
    if (!bar) return;

    var fill = document.getElementById('xpBarFill');
    var leftLabel = document.getElementById('xpBarLeftLabel');
    var rightLabel = document.getElementById('xpBarRightLabel');
    var centerText = document.getElementById('xpBarCenterText');
    if (!fill || !leftLabel || !rightLabel || !centerText) return;

    var curRank = RANKS[_rankIndex];
    var isMaxRank = _rankIndex >= RANKS.length - 1;
    var nextRank = isMaxRank ? null : RANKS[_rankIndex + 1];

    var progress = getXPProgress();
    var pct = Math.round(progress * 100);
    fill.style.width = pct + '%';

    leftLabel.textContent = curRank.name.toUpperCase();
    rightLabel.textContent = isMaxRank ? 'MAX' : nextRank.name.toUpperCase();

    if (isMaxRank) {
      centerText.textContent = _totalXP + ' XP (MAX)';
    } else {
      centerText.textContent = _totalXP + ' / ' + nextRank.xpRequired + ' XP';
    }

    if (flashGold) {
      fill.style.background = 'linear-gradient(90deg,#ffd700,#ffec6e)';
      setTimeout(function () {
        var f = document.getElementById('xpBarFill');
        if (f) { f.style.background = 'linear-gradient(90deg,#0066cc,#00aaff)'; }
      }, 500);
    }
  }

  function _scheduleXPBarFade() {
    if (typeof document === 'undefined') return;
    var bar = document.getElementById('xpProgressBar');
    if (!bar) return;
    if (_xpBarFadeTimer) { clearTimeout(_xpBarFadeTimer); }
    bar.style.opacity = '1';
    _xpBarFadeTimer = setTimeout(function () {
      var b = document.getElementById('xpProgressBar');
      if (b) { b.style.opacity = '0.4'; }
    }, 3000);
  }

  function _showXPGainPopup(amount) {
    if (typeof document === 'undefined') return;
    var popup = document.createElement('div');
    popup.style.cssText = [
      'position:fixed',
      'top:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00aaff',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'z-index:10001',
      'pointer-events:none',
      'text-shadow:0 0 6px #0066cc',
      'animation:xpGainFloat 1.5s ease-out forwards'
    ].join(';');
    popup.textContent = '+' + amount + ' XP';
    document.body.appendChild(popup);
    setTimeout(function () {
      if (popup.parentNode) { popup.parentNode.removeChild(popup); }
    }, 1500);
  }

  function _showRankUpBanner(newRank) {
    if (typeof document === 'undefined') return;
    var existing = document.getElementById('rankUpBanner');
    if (existing) { existing.remove(); }

    var banner = document.createElement('div');
    banner.id = 'rankUpBanner';
    banner.style.cssText = [
      'position:fixed',
      'top:33vh',
      'left:50%',
      'transform:translateX(-50%) translateY(-30px)',
      'background:rgba(0,0,0,0.88)',
      'color:#ffd700',
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'padding:18px 40px',
      'border-radius:8px',
      'z-index:10000',
      'text-align:center',
      'pointer-events:none',
      'border:2px solid #ffd700',
      'animation:rankBannerSlide 3s ease forwards'
    ].join(';');
    banner.textContent = '⭐ RANK UP! ' + newRank.name.toUpperCase() + ' ⭐';
    document.body.appendChild(banner);

    setTimeout(function () {
      if (banner.parentNode) { banner.parentNode.removeChild(banner); }
    }, 3000);

    if (typeof AudioSystem !== 'undefined' && AudioSystem.playAchievementUnlockNew) {
      AudioSystem.playAchievementUnlockNew();
    }
  }

  /* ── Rank HUD Badge ─────────────────────────── */
  function _updateRankBadge() {
    if (typeof document === 'undefined') return;
    var badge = document.getElementById('rankBadge');
    if (!badge) return;
    var r = RANKS[_rankIndex];
    var emoji = RANK_EMOJIS[_rankIndex] || '🏅';
    var prestigeStyle = PRESTIGE_BADGE_STYLES[Math.min(prestigeLevel, 5)];
    var borderCol = prestigeLevel >= 4 ? '#ff44ff' : prestigeStyle.color;

    badge.style.borderColor = borderCol;
    badge.innerHTML = emoji + ' ' + r.name + '<br><span style="font-size:10px;color:#bbb">' + r.eng + (prestigeStyle.label ? ' ' + prestigeStyle.label : '') + '</span>';
  }

  function _injectRankBadge() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('rankBadge')) return;
    var badge = document.createElement('div');
    badge.id = 'rankBadge';
    badge.style.cssText = [
      'position:fixed',
      'bottom:12px',
      'left:12px',
      'background:rgba(0,0,0,0.7)',
      'color:#fff',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'padding:6px 12px',
      'border-radius:6px',
      'z-index:9999',
      'border:2px solid #aaa',
      'pointer-events:none',
      'line-height:1.4'
    ].join(';');
    document.body.appendChild(badge);
    _updateRankBadge();
  }

  /* ── XP Persistence (okk_progression_v2) ────── */
  function _saveXPData() {
    try {
      localStorage.setItem('okk_progression_v2', JSON.stringify({ xp: _totalXP, prestige: prestigeLevel }));
    } catch (_e) { /* noop */ }
  }

  function _loadXPData() {
    try {
      var raw = localStorage.getItem('okk_progression_v2');
      if (raw) {
        var d = JSON.parse(raw);
        if (typeof d.xp === 'number') _totalXP = d.xp;
        if (typeof d.prestige === 'number') prestigeLevel = d.prestige;
        _rankIndex = _getRankIndexForXP(_totalXP);
      }
    } catch (_e) { /* noop */ }
  }

  /* ── Feature 53: Prestige System ───────────── */
  const PRESTIGE = {
    MAX_LEVEL: 10,
    BONUSES_PER_LEVEL: {
      xpMult: 0.1,        // +10% XP per prestige
      okcMult: 0.05,      // +5% OKC per prestige
      startingWeapon: 1,   // extra starting weapon slot per prestige
      maxHP: 5,            // +5 HP per prestige
      damageBonus: 0.02    // +2% damage per prestige
    },
    ICONS: ['⭐', '⭐⭐', '🌟', '🌟🌟', '💫', '💫💫', '🏆', '🏆🏆', '👑', '👑👑']
  };

  let prestigeLevel = 0;
  let prestigeXPRequired = 50000; // XP needed to prestige
  var _highestStage = 0;

  function canPrestige(totalXP) { return totalXP >= prestigeXPRequired && prestigeLevel < PRESTIGE.MAX_LEVEL; }

  function doPrestige() {
    if (prestigeLevel >= PRESTIGE.MAX_LEVEL) return false;
    prestigeLevel++;
    prestigeXPRequired = Math.floor(prestigeXPRequired * 1.5);
    _saveXPData();
    _updateRankBadge();
    return {
      level: prestigeLevel,
      icon: PRESTIGE.ICONS[prestigeLevel - 1],
      bonuses: getPrestigeBonuses()
    };
  }

  function getPrestigeBonuses() {
    const b = PRESTIGE.BONUSES_PER_LEVEL;
    return {
      xpMult: 1 + b.xpMult * prestigeLevel,
      okcMult: 1 + b.okcMult * prestigeLevel,
      startingWeapons: b.startingWeapon * prestigeLevel,
      maxHPBonus: b.maxHP * prestigeLevel,
      damageMult: 1 + b.damageBonus * prestigeLevel
    };
  }

  function getPrestigeLevel() { return prestigeLevel; }
  function getPrestigeIcon() { return prestigeLevel > 0 ? PRESTIGE.ICONS[prestigeLevel - 1] : ''; }

  /* ── Feature 54: Daily Challenges ──────────── */
  const DAILY_CHALLENGES = [
    { id: 'unlock_nightvision', name: 'Nightvision Unlocked', desc: 'Unlock nightvision goggles via shop or progression', target: 1, reward: 300, stat: 'nightvisionUnlocked' },
    { id: 'headshot_10', name: 'Headhunter', desc: 'Get 10 headshots', target: 10, reward: 200, stat: 'headshots' },
    { id: 'kill_50', name: 'Body Count', desc: 'Kill 50 enemies', target: 50, reward: 150, stat: 'kills' },
    { id: 'survive_5', name: 'Endurance', desc: 'Survive 5 waves', target: 5, reward: 100, stat: 'wavesCleared' },
    { id: 'no_damage_wave', name: 'Flawless', desc: 'Clear a wave without taking damage', target: 1, reward: 250, stat: 'flawlessWaves' },
    { id: 'melee_5', name: 'Up Close', desc: 'Get 5 melee kills', target: 5, reward: 120, stat: 'meleeKills' },
    { id: 'build_10', name: 'Fortifier', desc: 'Build 10 structures', target: 10, reward: 100, stat: 'structures' },
    { id: 'drone_kills_5', name: 'Drone Pilot', desc: '5 kills with drones', target: 5, reward: 130, stat: 'droneKills' },
    { id: 'explosive_multi', name: 'Blast Zone', desc: '3 explosive multi-kills', target: 3, reward: 180, stat: 'explosiveMultis' },
    { id: 'sniper_3', name: 'Long Shot', desc: '3 kills at 30m+ range', target: 3, reward: 160, stat: 'longRangeKills' },
    { id: 'collect_20', name: 'Scavenger', desc: 'Collect 20 pickups', target: 20, reward: 90, stat: 'pickupsCollected' },
    { id: 'vehicle_kill', name: 'Road Rage', desc: 'Destroy 2 vehicles', target: 2, reward: 140, stat: 'vehicleKills' },
    { id: 'streak_7', name: 'On Fire', desc: 'Get a 7-kill streak', target: 7, reward: 200, stat: 'maxStreak' }
  ];

  let activeDailies = [];
  let dailyProgress = {};
  let lastDailyRefresh = 0;

  function refreshDailies() {
    // Pick 3 random challenges
    const shuffled = [...DAILY_CHALLENGES].sort(() => Math.random() - 0.5);
    activeDailies = shuffled.slice(0, 3).map(c => ({ ...c, completed: false }));
    dailyProgress = {};
    for (const c of activeDailies) dailyProgress[c.id] = 0;
    lastDailyRefresh = Date.now();
  }

  function getDailies() { return activeDailies.map(c => ({ ...c, progress: dailyProgress[c.id] || 0 })); }

  function updateDailyStat(stat, amount) {
    const completions = [];
    for (const c of activeDailies) {
      if (c.completed || c.stat !== stat) continue;
      dailyProgress[c.id] = (dailyProgress[c.id] || 0) + amount;
      if (dailyProgress[c.id] >= c.target) {
        c.completed = true;
        completions.push({ ...c });
      }
    }
    return completions;
  }

  /* ── Feature 55: Bounty Board ──────────────── */
  const BOUNTY_TEMPLATES = [
    { name: 'Kill {n} enemies with {weapon}', type: 'weapon_kill', rewards: [50, 100, 200] },
    { name: 'Survive {n} waves without dying', type: 'survive', rewards: [75, 150, 300] },
    { name: 'Build {n} structures', type: 'build', rewards: [40, 80, 160] },
    { name: 'Collect {n} pickups', type: 'collect', rewards: [30, 60, 120] },
    { name: 'Deal {n} total damage', type: 'damage', rewards: [60, 120, 240] },
    { name: 'Get {n} headshots in one wave', type: 'headshot_wave', rewards: [80, 160, 320] },
    { name: 'Complete wave in under {n}s', type: 'speed_wave', rewards: [100, 200, 400] },
    { name: 'Take less than {n} damage in a wave', type: 'low_damage', rewards: [70, 140, 280] }
  ];

  let activeBounties = [];
  let completedBounties = 0;

  function generateBounties(wave) {
    activeBounties = [];
    const count = Math.min(3, 1 + Math.floor(wave / 3));
    const shuffled = [...BOUNTY_TEMPLATES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < count; i++) {
      const template = shuffled[i];
      const tier = Math.min(2, Math.floor(wave / 4));
      const targets = { weapon_kill: [5, 10, 20], survive: [2, 4, 6], build: [3, 6, 10], collect: [5, 10, 15], damage: [500, 1000, 2000], headshot_wave: [3, 5, 8], speed_wave: [60, 45, 30], low_damage: [50, 25, 10] };
      const targetVal = (targets[template.type] || [5, 10, 20])[tier];
      let resolvedName = template.name.replace('{n}', targetVal);
      if (resolvedName.indexOf('{weapon}') !== -1) {
        const weaponNames = ['AK-74M', 'RPK-74', 'SVD Dragunov', 'PKM', 'M4A1', 'FN SCAR-H', 'Barrett M82', 'MP5 SMG'];
        resolvedName = resolvedName.replace('{weapon}', weaponNames[Math.floor(Math.random() * weaponNames.length)]);
      }
      activeBounties.push({
        ...template,
        name: resolvedName,
        tier,
        target: targetVal,
        reward: template.rewards[tier],
        progress: 0,
        completed: false
      });
    }
  }

  function updateBounty(type, amount) {
    const completed = [];
    for (const b of activeBounties) {
      if (b.completed || b.type !== type) continue;
      b.progress += amount;
      if (b.progress >= b.target) {
        b.completed = true;
        completedBounties++;
        completed.push(b);
      }
    }
    return completed;
  }

  function getBounties() { return activeBounties; }

  /* ── Feature 56: War Journal / Codex ───────── */
  const JOURNAL_CATEGORIES = {
    ENEMIES: 'Enemy Intel',
    WEAPONS: 'Weapon Data',
    LOCATIONS: 'Field Reports',
    LORE: 'War Stories',
    TACTICS: 'Tactical Notes'
  };

  let journalEntries = [];

  const CODEX_ENTRIES = [
    { id: 'entry_conscript', cat: 'ENEMIES', title: 'Conscript Profile', text: 'Poorly trained infantry, forced into service. Low accuracy but dangerous in numbers.', unlockKills: 5 },
    { id: 'entry_stormer', cat: 'ENEMIES', title: 'Stormer Profile', text: 'Aggressive assault infantry. Trained for close-quarters combat. Fast and deadly.', unlockKills: 10 },
    { id: 'entry_armored', cat: 'ENEMIES', title: 'Armored Profile', text: 'Heavy infantry with body armor and reinforced helmets. Slow but extremely tough.', unlockKills: 15 },
    { id: 'entry_boss', cat: 'ENEMIES', title: 'Commander Intel', text: 'Enemy field commander. Can summon reinforcements and enters rage mode when wounded.', unlockKills: 1 },
    { id: 'entry_wagner', cat: 'ENEMIES', title: 'Wagner PMC Profile', text: 'Russian private military contractor. Recruited from prisons, used as cannon fodder. Led the assault on Bakhmut.', unlockKills: 25 },
    { id: 'entry_tank', cat: 'ENEMIES', title: 'T-72B3 Analysis', text: 'Russian main battle tank. Front armor is nearly impenetrable — target the rear or use Javelin top-attack mode.', unlockKills: 2 },
    { id: 'entry_drone_op', cat: 'ENEMIES', title: 'FPV Drone Operator', text: 'Controls kamikaze drones from a safe distance. Eliminating the operator disables nearby drones.', unlockKills: 8 },
    { id: 'entry_ak74', cat: 'WEAPONS', title: 'AK-74M Analysis', text: 'Standard-issue assault rifle. Reliable in all conditions. Moderate recoil.', unlockShots: 100 },
    { id: 'entry_svd', cat: 'WEAPONS', title: 'SVD Report', text: 'Designated marksman rifle. Devastating at range. Requires patience and precision.', unlockShots: 50 },
    { id: 'entry_javelin', cat: 'WEAPONS', title: 'Javelin Fire-and-Forget', text: 'Top-attack mode defeats any tank. Lock, fire, and relocate. The weapon that changed the war.', unlockShots: 3 },
    { id: 'entry_nlaw', cat: 'WEAPONS', title: 'NLAW Overfly-Attack', text: 'Lightweight anti-tank weapon distributed to Ukrainian territorial defense. Devastating against unsupported armor.', unlockShots: 5 },
    { id: 'entry_hostomol', cat: 'LOCATIONS', title: 'Hostomel Airport', text: 'Feb 24 2022: Russia\'s first objective. VDV paratroopers seized the airstrip to fly in heavy forces. Ukraine retook it within 48 hours.', unlockVisit: true },
    { id: 'entry_avdiivka', cat: 'LOCATIONS', title: 'Avdiivka Industrial Zone', text: 'Fell Feb 17 2024 after Russia threw 47,000 casualties at a city of 32,000. The AKHZ coking plant was the final holdout.', unlockVisit: true },
    { id: 'entry_bucha', cat: 'LOCATIONS', title: 'Bucha War Crimes', text: 'After Russian withdrawal March 30 2022, satellite images revealed 458+ civilians executed. ICC issued arrest warrant for Putin.', unlockVisit: true },
    { id: 'entry_mariupol', cat: 'LOCATIONS', title: 'Mariupol Siege', text: 'Mar–May 2022: 80% of city destroyed. Azovstal steelworks sheltered 2,500 fighters + civilians for 82 days. Theatre bombed with 1,000 sheltering inside.', unlockVisit: true },
    { id: 'entry_bakhmut', cat: 'LOCATIONS', title: 'Bakhmut Meat Grinder', text: 'Feb 2023: After 224 days of fighting, Russia captured a pre-war city of 70,000 — now just rubble. Ukraine used it to attrite Wagner PMC at 1:5 loss ratio.', unlockVisit: true },
    { id: 'entry_lviv', cat: 'LOCATIONS', title: 'Lviv — Gate of Ukraine', text: 'Western Ukraine\'s cultural capital. UNESCO heritage zone. Major NATO weapons transit hub: Leopard tanks, Patriots, and HIMARS all transited through Lviv station en route to the front.', unlockVisit: true },
    { id: 'entry_kramatorsk', cat: 'LOCATIONS', title: 'Kramatorsk Station Massacre', text: 'April 8 2022: Russia fired a Tochka-U missile at the station while civilians were evacuating. 59 killed including 7 children. The missile had "FOR THE CHILDREN" written on it.', unlockVisit: true },
    { id: 'entry_vinnytsia', cat: 'LOCATIONS', title: 'Vinnytsia Vortex Strike', text: 'July 14 2022: Kalibr cruise missile hit the "Vortex" shopping center. 23 killed including 4yo Liza Dmytrieva, whose stroller photo went around the world. ICC declared it a war crime.', unlockVisit: true },
    { id: 'entry_donetsk', cat: 'LOCATIONS', title: 'Donetsk — Occupied Capital', text: 'Russian-backed "DNR" declared April 6 2014 after storming the Oblast Admin building. Donetsk has been under occupation for 10+ years. The namesake of this entire conflict.', unlockVisit: true },
    { id: 'entry_kursk', cat: 'LOCATIONS', title: 'Kursk Incursion', text: 'Aug 6 2024: Ukraine crossed into Kursk Oblast, capturing 1,200 km² at peak — first foreign occupation of Russian territory since WWII. Key objective: Sudzha gas metering station.', unlockVisit: true },
    { id: 'entry_bayraktar', cat: 'LORE', title: 'Bayraktar TB-2', text: 'The Turkish drone that became a symbol of Ukrainian resistance. Viral song, sold-out toy models, and decisive early-war strikes on Russian supply columns.', unlockDrone: true },
    { id: 'entry_himars', cat: 'LORE', title: 'HIMARS Game-Changer', text: 'M142 HIMARS precision rockets allowed Ukraine to strike ammunition depots 80km behind the front. Changed the war\'s course in summer 2022. Russia called it "escalatory."', unlockWave: 4 },
    { id: 'entry_irondragon', cat: 'LORE', title: 'Iron Dragon Line', text: 'Ukraine\'s defensive line stretching from Zaporizhzhia to Donetsk. Named after the Zalizna Sotnya (Iron Hundred). Held against Russian mechanized assaults since 2023.', unlockWave: 6 },
    { id: 'entry_flanking', cat: 'TACTICS', title: 'Flanking Tactics', text: 'Enemies attempt flanking maneuvers. Watch your sides during waves 3+.', unlockWave: 3 },
    { id: 'entry_mortar', cat: 'TACTICS', title: 'Indirect Fire', text: 'Mortar teams set up at range. Eliminate quickly or relocate to avoid barrages.', unlockWave: 7 },
    { id: 'entry_shield', cat: 'TACTICS', title: 'Shield Tactics', text: 'Shield bearers block frontal damage. Flank them or use explosives.', unlockWave: 5 },
    { id: 'entry_ew', cat: 'TACTICS', title: 'Electronic Warfare', text: 'EW operators disrupt drone controls and comms. Eliminate them first to maintain FPV advantage and HUD integrity.', unlockWave: 9 },
    { id: 'entry_fpv', cat: 'TACTICS', title: 'FPV Drone Operations', text: 'Press V to possess your own drone. Use scroll wheel to cycle payloads. FPV drones detonate on any solid obstacle — aim into windows and vehicles.', unlockDrone: true },
    // --- LOCATIONS (additional levels) ---
    { id: 'entry_kyiv', cat: 'LOCATIONS', title: 'Kyiv — Capital Siege', text: 'Feb 24 – March 30 2022: Russian forces reached Kyiv\'s northern suburbs within 48 hours. Ukrainian territorial defense and T-64s halted the column at Irpin bridge. Russia withdrew claiming it was a "gesture of goodwill."', unlockVisit: true },
    { id: 'entry_chornobyl', cat: 'LOCATIONS', title: 'Chornobyl Exclusion Zone', text: 'Russian troops occupied the Chornobyl plant Feb 24–March 31 2022, digging trenches in the Red Forest — the most radioactive soil on Earth. Dosimeters were confiscated so soldiers wouldn\'t panic. Several later required treatment for radiation exposure.', unlockVisit: true },
    { id: 'entry_snake_island', cat: 'LOCATIONS', title: 'Snake Island Defiance', text: 'Feb 24 2022: The Russian cruiser Moskva ordered 13 Ukrainian border guards to surrender. Their reply — "Russian warship, go fuck yourself" — became the war\'s rallying cry. Ukraine later sank the Moskva with Neptune missiles on April 13 2022.', unlockVisit: true },
    { id: 'entry_kherson', cat: 'LOCATIONS', title: 'Kherson Liberation', text: 'Nov 11 2022: Ukraine liberated Kherson city after an 8-month occupation. Russia had time to loot the regional museum, Kherson Zoo, and even hospital equipment. The liberation parade was held under drone attack.', unlockVisit: true },
    { id: 'entry_sevastopol', cat: 'LOCATIONS', title: 'Sevastopol Naval Base', text: 'Home of Russia\'s Black Sea Fleet since 1783. Ukraine\'s drone boats and cruise missiles have struck the fleet multiple times since 2022, sinking the Moskva, Rostov-on-Don submarine, and Minsk landing ship. The fleet now operates from Novorossiysk.', unlockVisit: true },
    { id: 'entry_donbas', cat: 'LOCATIONS', title: 'Donbas Front', text: '2014–present: The longest continuous land war in Europe since WWII. Two "people\'s republics" backed by Russian FSB officers and mercenaries. Ukrainian forces have faced trench warfare, drone swarms, and glide bomb attacks across a 1,200km front.', unlockVisit: true },
    { id: 'entry_belgorod', cat: 'LOCATIONS', title: 'Belgorod Raid', text: 'Russian citizens opposed to Putin\'s war formed the Russian Volunteer Corps and Legion of Free Russia. On May 22 2023 they crossed from Ukraine into Belgorod Oblast, holding territory briefly — demonstrating Russian territory was not inviolable.', unlockVisit: true },
    { id: 'entry_moscow', cat: 'LOCATIONS', title: 'Moscow — Heart of the War', text: 'The Kremlin directed the full-scale invasion from Moscow. Ukrainian drone attacks reached the capital itself in May 2023 — two drones struck the Senate Palace roof. Putin was not present. It was the first attack on Moscow since WWII.', unlockVisit: true },
    { id: 'entry_kremlin', cat: 'LOCATIONS', title: 'The Kremlin', text: 'The seat of Russian power for 500 years. From this fortified compound Putin signed the illegal annexation of Ukrainian territories. The complex houses FSB headquarters, the Presidential Administration, and command bunkers beneath.', unlockVisit: true },
    { id: 'entry_saky', cat: 'LOCATIONS', title: 'Saky Airbase Strike', text: 'Aug 9 2022: Ukraine destroyed nine Russian aircraft at Saky airbase in occupied Crimea — without officially claiming responsibility (likely Ukrainian Neptune cruise missiles). The base commander was killed. Russia scrambled jets into the Black Sea.', unlockVisit: true },
    { id: 'entry_vuhledar', cat: 'LOCATIONS', title: 'Vuhledar Coal Fortress', text: 'Russia lost 130+ tanks and APCs in frontal assaults on this elevated coal-mining town in January 2023 — one of the worst single armored defeats of the war. Ukrainian defenders used Javelin, NLAW, and drone-dropped grenades to massacre column after column.', unlockVisit: true },
    { id: 'entry_refinery', cat: 'LOCATIONS', title: 'Refinery Infiltration', text: 'Ukrainian sabotage operations have struck Russian oil refineries deep behind lines — Saratov, Ryazan, Tuapse. Each strike reduces jet fuel available for Russian aviation. FPV drones guided by local partisans are the preferred weapon.', unlockVisit: true },
    // --- ENEMIES (elite and advanced unit types) ---
    { id: 'entry_thermobaric', cat: 'ENEMIES', title: 'Thermobaric Trooper', text: 'Carries TOS-1A fuel-air warheads. Thermobaric detonations fill enclosed spaces with vaporized fuel then ignite it — catastrophic in buildings. Stay in the open and eliminate from range before they close distance.', unlockKills: 35 },
    { id: 'entry_assault_mech', cat: 'ENEMIES', title: 'Assault Mech', text: 'Experimental powered-exoskeleton unit. Augmented speed and armor absorption — requires multiple hits from heavy caliber. Javelin top-attack or EMP payload disables the servo systems. Rare but lethal.', unlockKills: 50 },
    { id: 'entry_commissar', cat: 'ENEMIES', title: 'Commissar', text: 'Political officer embedded with front-line units. Does not retreat and forces nearby soldiers to continue attacking even when routed. Eliminating the Commissar causes a morale collapse in adjacent enemies. Always high-value target.', unlockKills: 30 },
    { id: 'entry_swarm_op', cat: 'ENEMIES', title: 'Swarm Operator', text: 'Coordinates AI-controlled drone swarms using encrypted radio link. Individual swarm drones are fragile; the coordinator is the real threat. EMP payload or direct kill disrupts the swarm immediately.', unlockKills: 40 },
    { id: 'entry_heavy_sniper', cat: 'ENEMIES', title: 'Heavy Sniper', text: 'Equipped with KSVK or AS-50 anti-material rifle. Can penetrate light vehicle armor and kill through most cover. Uses thermal optics — concealment does not help. Counter with smoke and indirect approach.', unlockKills: 20 },
    { id: 'entry_kadyrovite', cat: 'ENEMIES', title: 'Kadyrovite Fighter', text: 'Chechen special forces loyal to Ramzan Kadyrov. Highly aggressive, often filmed for TikTok from safe rear positions then repositioned to cleared areas. Formidable in CQC but prone to surrender when isolated. Known for beheadings of POWs.', unlockKills: 45 },
    { id: 'entry_spetsnaz', cat: 'ENEMIES', title: 'Spetsnaz Operator', text: 'Russian special operations forces. GRU and FSB units infiltrate ahead of main assault to assassinate commanders and disrupt communications. Expert at ambush and sabotage. Use controlled burst and instant flanking response.', unlockKills: 55 },
    // --- LORE ---
    { id: 'entry_ghost_kyiv', cat: 'LORE', title: 'Ghost of Kyiv', text: 'The legend of a Ukrainian MiG-29 ace who shot down 6 Russian aircraft on Feb 24 2022 — now confirmed a composite myth to boost morale. The real pilots of the 40th Tactical Aviation Brigade flew outnumbered 10:1, losing aircraft but denying Russia air superiority.', unlockWave: 5 },
    { id: 'entry_atacms', cat: 'LORE', title: 'ATACMS Long-Range Strikes', text: 'Army Tactical Missile Systems finally delivered secretly in 2023. Ukraine used them to destroy 9 Russian helicopters at Berdyansk airfield in a single strike. Range: 300km. Putin called it "a red line." The line moved.', unlockWave: 8 },
    { id: 'entry_kharkiv_counter', cat: 'LORE', title: 'Kharkiv Counteroffensive', text: 'Sept 6–10 2022: Ukraine retook 8,000 km² in four days — the fastest advance in European warfare since WWII. Russian troops fled so fast they left T-80s still running. HIMARS had pre-destroyed Russian supply dumps weeks earlier.', unlockWave: 10 },
    { id: 'entry_shahed', cat: 'LORE', title: 'Shahed-136 Kamikaze Doctrine', text: 'Iran-supplied loitering munitions costing $20,000 each — Ukraine shoots them down with $200,000 missiles. Russia saturates air defense by launching 100+ per night. Target: electrical grid in winter. 12 million Ukrainians lost heat in January 2023.', unlockWave: 12 },
    // --- TACTICS ---
    { id: 'entry_urban', cat: 'TACTICS', title: 'Urban Assault', text: 'Clear buildings floor by floor. Enemies above have tactical advantage. Breach lower windows, grenade before entering. Use drone overwatch to identify room occupants before pushing in.', unlockWave: 2 },
    { id: 'entry_supply', cat: 'TACTICS', title: 'Supply Line Interdiction', text: 'Surveillance drones can call artillery strikes on enemy logistics. Destroying supply convoys degrades enemy ammo replenishment and causes visible morale drop in wave composition. Mark trucks, not soldiers.', unlockDrone: true }
  ];

  let unlockedEntries = new Set();

  // Nightvision progression unlock
  let nightvisionUnlocked = false;
  function unlockNightvision() { nightvisionUnlocked = true; }
  function hasNightvision() { return nightvisionUnlocked; }

  function unlockJournalEntry(entryId) {
    if (unlockedEntries.has(entryId)) return false;
    const entry = CODEX_ENTRIES.find(e => e.id === entryId);
    if (!entry) return false;
    unlockedEntries.add(entryId);
    journalEntries.push({ ...entry, unlockedAt: Date.now() });
    return true;
  }

  function getJournal() { return journalEntries; }
  function getJournalByCategory(cat) { return journalEntries.filter(e => e.cat === cat); }
  function isEntryUnlocked(id) { return unlockedEntries.has(id); }

  /* ── Feature 57: Stats Tracking ────────────── */
  let stats = {
    totalKills: 0, headshots: 0, meleeKills: 0, droneKills: 0,
    vehicleKills: 0, longRangeKills: 0, explosiveMultis: 0,
    totalDamageDealt: 0, totalDamageTaken: 0,
    shotsFired: 0, shotsHit: 0,
    wavesCleared: 0, flawlessWaves: 0, stagesCleared: 0,
    deathCount: 0, totalPlayTime: 0,
    structures: 0, blocksDestroyed: 0,
    pickupsCollected: 0, okCEarned: 0,
    longestStreak: 0, maxStreak: 0,
    favoriteWeapon: '', weaponKills: {},
    distanceTraveled: 0,
    lastPosition: null
  };

  function trackStat(stat, amount) {
    if (stats[stat] !== undefined) {
      if (typeof stats[stat] === 'number') {
        stats[stat] += amount;
      }
    }
    // Also update daily challenges
    return updateDailyStat(stat, amount);
  }

  function trackWeaponKill(weaponName) {
    stats.weaponKills[weaponName] = (stats.weaponKills[weaponName] || 0) + 1;
    // Find favorite
    let maxKills = 0;
    for (const [name, kills] of Object.entries(stats.weaponKills)) {
      if (kills > maxKills) { maxKills = kills; stats.favoriteWeapon = name; }
    }
  }

  function getStats() { return { ...stats }; }

  function getAccuracy() {
    if (stats.shotsFired === 0) return 0;
    return Math.round((stats.shotsHit / stats.shotsFired) * 100);
  }

  function getKDR() {
    if (stats.deathCount === 0) return stats.totalKills;
    return Math.round((stats.totalKills / stats.deathCount) * 100) / 100;
  }

  /* ── Feature 58: Leaderboard (Local) ───────── */
  let leaderboard = [];
  const MAX_ENTRIES = 20;

  function loadLeaderboard() {
    try {
      const data = localStorage.getItem('ok_leaderboard');
      if (data) leaderboard = JSON.parse(data);
    } catch (_e) { leaderboard = []; }
  }

  function saveLeaderboard() {
    try { localStorage.setItem('ok_leaderboard', JSON.stringify(leaderboard)); } catch (_e) { /* noop */ }
  }

  function submitScore(playerName, score, wave, stage, kills) {
    const entry = {
      name: playerName || 'Player',
      score, wave, stage, kills,
      accuracy: getAccuracy(),
      date: new Date().toISOString().split('T')[0],
      prestige: prestigeLevel
    };
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    if (leaderboard.length > MAX_ENTRIES) leaderboard = leaderboard.slice(0, MAX_ENTRIES);
    saveLeaderboard();
    return leaderboard.indexOf(entry) + 1; // rank
  }

  function getLeaderboard() { return leaderboard; }

  /* ── Feature 59: Challenge Modes ───────────── */
  const CHALLENGE_MODES = {
    HARDCORE: {
      id: 'HARDCORE', name: 'Hardcore', icon: '💀',
      desc: 'No HUD. 50% HP. Enemies deal 2× damage. No respawn.',
      modifiers: { hpMult: 0.5, enemyDmgMult: 2.0, noHUD: true, noRespawn: true, xpMult: 2.0 }
    },
    SPEEDRUN: {
      id: 'SPEEDRUN', name: 'Speedrun', icon: '⏱️',
      desc: 'Timer runs. Beat all waves as fast as possible. Score = time-based.',
      modifiers: { timed: true, xpMult: 1.5, scoreByTime: true }
    },
    PACIFIST: {
      id: 'PACIFIST', name: 'Pacifist', icon: '🕊️',
      desc: 'Cannot shoot. Must survive using only building and abilities.',
      modifiers: { noShooting: true, buildSpeedMult: 2.0, xpMult: 3.0 }
    },
    ONE_SHOT: {
      id: 'ONE_SHOT', name: 'One in the Chamber', icon: '🎱',
      desc: 'One bullet. Kills give one bullet. Melee is your backup.',
      modifiers: { oneAmmo: true, xpMult: 2.5 }
    },
    JUGGERNAUT_MODE: {
      id: 'JUGGERNAUT_MODE', name: 'Juggernaut', icon: '🛡️',
      desc: '3× HP, can\'t sprint. Enemies spawn 2× faster.',
      modifiers: { hpMult: 3.0, noSprint: true, spawnRateMult: 2.0, xpMult: 1.5 }
    },
    SNIPER_ONLY: {
      id: 'SNIPER_ONLY', name: 'Sniper Only', icon: '🔭',
      desc: 'Only sniper rifles. Headshots deal 5× damage.',
      modifiers: { sniperOnly: true, headshotMult: 5.0, xpMult: 2.0 }
    },
    NIGHT_OPS: {
      id: 'NIGHT_OPS', name: 'Night Operations', icon: '🌙',
      desc: 'Permanent night. Limited visibility. Night vision recommended.',
      modifiers: { permanentNight: true, visRange: 15, xpMult: 1.8 }
    }
  };

  let activeChallengeMode = null;

  function setChallenge(modeId) {
    if (!CHALLENGE_MODES[modeId]) return false;
    activeChallengeMode = modeId;
    return true;
  }

  function getChallengeMode() {
    if (!activeChallengeMode) return null;
    return CHALLENGE_MODES[activeChallengeMode];
  }

  function getChallengeModifiers() {
    if (!activeChallengeMode) return {};
    return CHALLENGE_MODES[activeChallengeMode].modifiers || {};
  }

  function clearChallenge() { activeChallengeMode = null; }

  /* ── Achievement System ──────────────────────── */
  const ACHIEVEMENTS = {
    FIRST_BLOOD:    { id: 'FIRST_BLOOD',    name: 'First Blood',    description: 'Get your first kill',              icon: '🩸', requirement: 1,     reward: { okc: 50,   xp: 100 }  },
    SHARPSHOOTER:   { id: 'SHARPSHOOTER',   name: 'Sharpshooter',   description: '50% accuracy over 100 shots',      icon: '🎯', requirement: 50,    reward: { okc: 200,  xp: 500 }  },
    HEADHUNTER:     { id: 'HEADHUNTER',     name: 'Headhunter',     description: 'Get 100 headshots',                icon: '💀', requirement: 100,   reward: { okc: 300,  xp: 750 }  },
    SURVIVOR:       { id: 'SURVIVOR',        name: 'Survivor',       description: 'Survive 10 waves',                 icon: '🛡️', requirement: 10,    reward: { okc: 150,  xp: 400 }  },
    SLAYER:         { id: 'SLAYER',          name: 'Slayer',         description: '1000 total kills',                  icon: '⚔️', requirement: 1000,  reward: { okc: 500,  xp: 1000 } },
    DEMOLITIONIST:  { id: 'DEMOLITIONIST',  name: 'Demolitionist',  description: 'Destroy 50 structures',            icon: '💥', requirement: 50,    reward: { okc: 200,  xp: 500 }  },
    DRONE_ACE:      { id: 'DRONE_ACE',      name: 'Drone Ace',      description: 'Get 50 drone kills',               icon: '🛩️', requirement: 50,    reward: { okc: 250,  xp: 600 }  },
    TREASURE_HUNTER:{ id: 'TREASURE_HUNTER', name: 'Treasure Hunter', description: 'Collect 50 pickups',              icon: '💎', requirement: 50,    reward: { okc: 150,  xp: 350 }  },
    SPEEDRUNNER:    { id: 'SPEEDRUNNER',    name: 'Speedrunner',    description: 'Clear a wave under 30 seconds',    icon: '⚡', requirement: 30,    reward: { okc: 300,  xp: 700 }  },
    IRONMAN:        { id: 'IRONMAN',         name: 'Ironman',        description: 'Clear a wave without taking damage', icon: '🏋️', requirement: 1,     reward: { okc: 400,  xp: 800 }  },
    PRESTIGE:       { id: 'PRESTIGE',        name: 'Prestige',       description: 'Prestige at least once',           icon: '⭐', requirement: 1,     reward: { okc: 500,  xp: 1000 } },
    COLLECTOR:      { id: 'COLLECTOR',       name: 'Collector',      description: 'Unlock all weapons',               icon: '🗄️', requirement: 1,     reward: { okc: 600,  xp: 1200 } },
    COMMANDER:      { id: 'COMMANDER',       name: 'Commander',      description: 'Have 10 NPCs alive at once',       icon: '👥', requirement: 10,    reward: { okc: 350,  xp: 700 }  },
    WEALTHY:        { id: 'WEALTHY',         name: 'Wealthy',        description: 'Earn 10000 OKC total',             icon: '💰', requirement: 10000, reward: { okc: 1000, xp: 2000 } },
    LEGENDARY:      { id: 'LEGENDARY',       name: 'Legendary',      description: 'Reach level 50',                   icon: '👑', requirement: 50,    reward: { okc: 2000, xp: 5000 } }
  };

  const unlockedAchievements = new Set();

  function checkAchievement(id, value) {
    if (!ACHIEVEMENTS[id] || unlockedAchievements.has(id)) return null;
    if (value >= ACHIEVEMENTS[id].requirement) {
      unlockedAchievements.add(id);
      return { ...ACHIEVEMENTS[id], unlockedAt: Date.now() };
    }
    return null;
  }

  function getAchievements() {
    return Object.values(ACHIEVEMENTS).map(a => ({
      ...a,
      unlocked: unlockedAchievements.has(a.id)
    }));
  }

  function isAchievementUnlocked(id) { return unlockedAchievements.has(id); }

  /* ── Season Pass ───────────────────────────── */
  const SEASON_REWARDS = [];
  (function buildSeasonRewards() {
    const freePool = [
      { type: 'okc', amount: 50 },  { type: 'okc', amount: 100 }, { type: 'okc', amount: 150 },
      { type: 'ammo', amount: 30 },  { type: 'ammo', amount: 60 },
      { type: 'xp_boost', amount: 1.25 }, { type: 'xp_boost', amount: 1.5 }
    ];
    const premiumPool = [
      { type: 'skin', id: 'skin_gold_ak' },     { type: 'skin', id: 'skin_neon_smg' },
      { type: 'skin', id: 'skin_camo_sniper' },  { type: 'skin', id: 'skin_chrome_pistol' },
      { type: 'skin', id: 'skin_flame_shotgun' }, { type: 'weapon', id: 'weapon_plasma' },
      { type: 'weapon', id: 'weapon_railgun' },   { type: 'cosmetic', id: 'cosmetic_helmet_gold' },
      { type: 'cosmetic', id: 'cosmetic_trail_fire' }, { type: 'cosmetic', id: 'cosmetic_emblem_skull' }
    ];
    for (let i = 0; i < 50; i++) {
      SEASON_REWARDS.push({
        level: i + 1,
        free: freePool[i % freePool.length],
        premium: premiumPool[i % premiumPool.length]
      });
    }
  })();

  let seasonLevel = 0;
  let seasonXP = 0;
  let seasonPremium = false;
  const SEASON_XP_PER_LEVEL = 1000;

  function addSeasonXP(amount) {
    seasonXP += amount;
    const newLevel = Math.min(50, Math.floor(seasonXP / SEASON_XP_PER_LEVEL));
    const leveled = newLevel > seasonLevel;
    seasonLevel = newLevel;
    return leveled ? seasonLevel : false;
  }

  function getSeasonLevel() { return seasonLevel; }

  function getSeasonRewards(level) {
    if (level < 1 || level > 50) return null;
    return SEASON_REWARDS[level - 1];
  }

  function isSeasonPremium() { return seasonPremium; }

  /* ── Combat Rating ─────────────────────────── */
  function calculateCombatRating() {
    var accuracy = stats.shotsFired > 0 ? (stats.shotsHit / stats.shotsFired) * 100 : 0;
    var kd = stats.deathCount > 0 ? stats.totalKills / stats.deathCount : stats.totalKills;
    var hsRatio = stats.totalKills > 0 ? (stats.headshots / stats.totalKills) * 100 : 0;
    var waves = stats.wavesCleared;
    var prestige = prestigeLevel;

    var raw =
      (Math.min(accuracy, 100) / 100) * 1500 * 0.30 +
      Math.min(kd, 20) / 20 * 1250 * 0.25 +
      (Math.min(hsRatio, 100) / 100) * 1000 * 0.20 +
      Math.min(waves, 100) / 100 * 750 * 0.15 +
      (prestige / PRESTIGE.MAX_LEVEL) * 500 * 0.10;

    var rating = Math.round(Math.min(5000, raw));
    var rankThresholds = [
      { min: 0,    rank: 'Bronze',   stars: 1 },
      { min: 500,  rank: 'Bronze',   stars: 2 },
      { min: 1000, rank: 'Bronze',   stars: 3 },
      { min: 1500, rank: 'Silver',   stars: 1 },
      { min: 2000, rank: 'Silver',   stars: 2 },
      { min: 2250, rank: 'Silver',   stars: 3 },
      { min: 2500, rank: 'Gold',     stars: 1 },
      { min: 2800, rank: 'Gold',     stars: 2 },
      { min: 3000, rank: 'Gold',     stars: 3 },
      { min: 3300, rank: 'Platinum', stars: 1 },
      { min: 3600, rank: 'Platinum', stars: 2 },
      { min: 3800, rank: 'Platinum', stars: 3 },
      { min: 4000, rank: 'Diamond',  stars: 1 },
      { min: 4300, rank: 'Diamond',  stars: 2 },
      { min: 4500, rank: 'Diamond',  stars: 3 },
      { min: 4700, rank: 'Master',   stars: 1 },
      { min: 4850, rank: 'Master',   stars: 2 },
      { min: 5000, rank: 'Master',   stars: 3 }
    ];
    var result = { rating: rating, rank: 'Bronze', stars: 1 };
    for (var i = rankThresholds.length - 1; i >= 0; i--) {
      if (rating >= rankThresholds[i].min) {
        result.rank = rankThresholds[i].rank;
        result.stars = rankThresholds[i].stars;
        break;
      }
    }
    return result;
  }

  /* ── Loadout Presets ───────────────────────── */
  const _loadouts = [];
  const MAX_LOADOUTS = 5;

  function saveLoadout(name, weaponIds, perkIds) {
    if (_loadouts.length >= MAX_LOADOUTS) return false;
    _loadouts.push({ name: name, weapons: weaponIds.slice(), perks: perkIds.slice(), createdAt: Date.now() });
    return true;
  }

  function loadLoadout(index) {
    if (index < 0 || index >= _loadouts.length) return null;
    return { ..._loadouts[index], weapons: _loadouts[index].weapons.slice(), perks: _loadouts[index].perks.slice() };
  }

  function getLoadouts() { return _loadouts.map(function (l) { return { ...l }; }); }

  function deleteLoadout(index) {
    if (index < 0 || index >= _loadouts.length) return false;
    _loadouts.splice(index, 1);
    return true;
  }

  /* ── Save/Load ─────────────────────────────── */
  function save() {
    try {
      var saveData = {
        prestigeLevel, stats, unlockedEntries: [...unlockedEntries],
        unlockedAchievements: typeof Feedback !== 'undefined' ? Feedback.getUnlocked() : [],
        highestStage: _highestStage || 0,
      };
      // Save weapon unlocks
      if (typeof Weapons !== 'undefined' && Weapons.getWeaponCount && Weapons.isUnlocked) {
        var wUnlocks = [];
        for (var wi = 0; wi < Weapons.getWeaponCount(); wi++) wUnlocks.push(Weapons.isUnlocked(wi));
        saveData.weaponUnlocks = wUnlocks;
      }
      // Save economy currency
      if (typeof Economy !== 'undefined' && Economy.getCurrency) {
        saveData.currency = Economy.getCurrency();
      }
      localStorage.setItem('ok_progression', JSON.stringify(saveData));
    } catch (_e) { /* noop */ }
  }

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem('ok_progression') || '{}');
      if (data.prestigeLevel !== undefined) prestigeLevel = data.prestigeLevel;
      if (data.stats) Object.assign(stats, data.stats);
      if (data.unlockedEntries) data.unlockedEntries.forEach(id => unlockedEntries.add(id));
      if (data.highestStage !== undefined) _highestStage = data.highestStage;
      // Restore weapon unlocks
      if (data.weaponUnlocks && typeof Weapons !== 'undefined' && Weapons.unlockWeapon) {
        for (var wi = 0; wi < data.weaponUnlocks.length; wi++) {
          if (data.weaponUnlocks[wi]) Weapons.unlockWeapon(wi);
        }
      }
      // Restore economy currency
      if (data.currency !== undefined && typeof Economy !== 'undefined' && Economy.setCurrency) {
        Economy.setCurrency(data.currency);
      }
    } catch (_e) { /* noop */ }
    loadLeaderboard();
  }

  function reset() {
    stats = {
      totalKills: 0, headshots: 0, meleeKills: 0, droneKills: 0,
      vehicleKills: 0, longRangeKills: 0, explosiveMultis: 0,
      totalDamageDealt: 0, totalDamageTaken: 0,
      shotsFired: 0, shotsHit: 0,
      wavesCleared: 0, flawlessWaves: 0, stagesCleared: 0,
      deathCount: 0, totalPlayTime: 0,
      structures: 0, blocksDestroyed: 0,
      pickupsCollected: 0, okCEarned: 0,
      longestStreak: 0, maxStreak: 0,
      favoriteWeapon: '', weaponKills: {},
      distanceTraveled: 0, lastPosition: null
    };
    activeDailies = [];
    dailyProgress = {};
    activeBounties = [];
    activeChallengeMode = null;
  }

  function init() {
    _loadXPData();
    load();
    refreshDailies();
    /* Inject rank badge and XP bar after DOM is ready */
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          _injectRankBadge();
          _buildXPBar();
        });
      } else {
        _injectRankBadge();
        _buildXPBar();
      }
    }
  }

  return {
    PRESTIGE, CHALLENGE_MODES, DAILY_CHALLENGES, BOUNTY_TEMPLATES,
    JOURNAL_CATEGORIES, CODEX_ENTRIES, ACHIEVEMENTS, SEASON_REWARDS,
    RANKS, RANK_EMOJIS,
    init, reset, save, load,
    // XP & Rank system
    addXP, getRank, getXP, getXPToNext, getXPProgress, onRankUp,
    // Prestige
    canPrestige, doPrestige, getPrestigeBonuses, getPrestigeLevel, getPrestigeIcon,
    // Dailies
    refreshDailies, getDailies, updateDailyStat,
    // Bounties
    generateBounties, updateBounty, getBounties,
    // Journal
    unlockJournalEntry, getJournal, getJournalByCategory, isEntryUnlocked,
    // Stats
    trackStat, trackWeaponKill, getStats, getAccuracy, getKDR,
    // Leaderboard
    submitScore, getLeaderboard,
    // Challenge modes
    setChallenge, getChallengeMode, getChallengeModifiers, clearChallenge,
    // Achievements
    checkAchievement, getAchievements, isAchievementUnlocked,
    // Season Pass
    addSeasonXP, getSeasonLevel, getSeasonRewards, isSeasonPremium,
    // Combat Rating
    calculateCombatRating,
    // Loadout Presets
    saveLoadout, loadLoadout, getLoadouts, deleteLoadout,
    // Stage persistence
    getHighestStage: function () { return _highestStage; },
    setHighestStage: function (s) { if (s > _highestStage) _highestStage = s; }
  };
})();

/* ── Global XP Hook Exposure (after Progression is defined) ── */
if (typeof window !== 'undefined') {
  window.Progression_addKillXP = function (isHeadshot) {
    return Progression.addXP(isHeadshot ? 75 : 50, 'kill');
  };
  window.Progression_addWaveClearXP = function (waveNum) {
    return Progression.addXP(100 * waveNum, 'wave');
  };
  window.Progression_addLevelXP = function (difficulty) {
    return Progression.addXP(500 * difficulty, 'level');
  };
  window.Progression_addBossKillXP = function () {
    return Progression.addXP(1000, 'boss');
  };
}
