/* ───────────────────────────────────────────────────────────────────────────
   WEAPON MASTERY SYSTEM
   Tracks kills and headshots per weapon, awarding star ratings and titles.
   Toggle panel with Y key. Persists via localStorage.
   ─────────────────────────────────────────────────────────────────────────── */
window.WeaponMastery = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var STORAGE_KEY = 'okk_weapon_mastery_v1';

  var THRESHOLDS = [0, 10, 25, 50, 100];
  var STAR_LABELS = [
    '★☆☆☆☆',
    '★★☆☆☆',
    '★★★☆☆',
    '★★★★☆',
    '★★★★★'
  ];
  var LEVEL_NAMES = ['Unranked', 'Trained', 'Proficient', 'Expert', 'Mastered'];

  /* Weapon-specific title overrides */
  var WEAPON_TITLES = {
    'AK74':    ['Unranked', 'Conscript', 'Strelok', 'Frontovnik', 'AK Master'],
    'AXMC':    ['Unranked', 'Marksman', 'Sharpshooter', 'Sniper', 'Ghost'],
    'RPG7':    ['Unranked', 'Recruit', 'Grenadier', 'Rocketeer', 'Demolitions Expert'],
    'MG3':     ['Unranked', 'Gunner', 'Suppressor', 'Field Gunner', 'Iron Curtain'],
    'GLOCK17': ['Unranked', 'Carry', 'Sidearm Pro', 'Pistolero', 'Pistol Saint']
  };

  /* Emoji mapping by weapon type keyword */
  var WEAPON_EMOJI_KEYS = [
    'AK', 'M4', 'M16', 'AR', 'RIFLE',
    'AXMC', 'SNIPER', 'AWP',
    'MG', 'LMG', 'M60', 'PKM',
    'GLOCK', 'PISTOL', 'P226', 'BERETTA',
    'RPG', 'LAUNCHER', 'ROCKET',
    'SHOTGUN', 'SPAS', 'M870',
    'SMG', 'MP5', 'UZI', 'VECTOR'
  ];
  var WEAPON_EMOJI_VALS = [
    '🔫', '🔫', '🔫', '🔫', '🔫',
    '🎯', '🎯', '🎯',
    '⚡', '⚡', '⚡', '⚡',
    '🔰', '🔰', '🔰', '🔰',
    '💥', '💥', '💥',
    '💢', '💢', '💢',
    '🌀', '🌀', '🌀', '🌀'
  ];
  var DEFAULT_EMOJI = '🔫';

  /* ── Module state ───────────────────────────────────────────────────────── */
  var _masteryData = {};   /* { 'AK74': { kills: 0, headshots: 0, level: 0 }, ... } */
  var _panelVisible = false;
  var _panelEl = null;
  var _initialized = false;
  var _bannerTimeout = null;

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  function _getLevel(kills) {
    var level = 0;
    var i;
    for (i = THRESHOLDS.length - 1; i >= 0; i--) {
      if (kills >= THRESHOLDS[i]) {
        level = i;
        break;
      }
    }
    return level;
  }

  function _getTitle(weaponType, level) {
    var titles = WEAPON_TITLES[weaponType] || ['Unranked', 'Novice', 'Competent', 'Veteran', 'Elite'];
    return titles[level] || titles[0];
  }

  function _getEmoji(weaponType) {
    var upper = weaponType.toUpperCase();
    var i;
    for (i = 0; i < WEAPON_EMOJI_KEYS.length; i++) {
      if (upper.indexOf(WEAPON_EMOJI_KEYS[i]) !== -1) {
        return WEAPON_EMOJI_VALS[i];
      }
    }
    return DEFAULT_EMOJI;
  }

  function _ensureWeapon(weaponType) {
    if (!_masteryData[weaponType]) {
      _masteryData[weaponType] = { kills: 0, headshots: 0, level: 0 };
    }
  }

  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_masteryData));
    } catch (e) {
      /* storage quota exceeded — ignore */
    }
  }

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        _masteryData = JSON.parse(raw);
      }
    } catch (e) {
      _masteryData = {};
    }
  }

  /* ── Mastery-up banner ──────────────────────────────────────────────────── */
  function _showMasteryBanner(weaponType, newLevel) {
    var title = _getTitle(weaponType, newLevel);
    var stars = STAR_LABELS[newLevel];

    /* Remove any existing banner */
    var old = document.getElementById('okk-mastery-banner');
    if (old && old.parentNode) { old.parentNode.removeChild(old); }
    if (_bannerTimeout) { clearTimeout(_bannerTimeout); _bannerTimeout = null; }

    /* Inject keyframe animation once */
    if (!document.getElementById('okk-mastery-style')) {
      var style = document.createElement('style');
      style.id = 'okk-mastery-style';
      style.textContent =
        '@keyframes okk-mastery-flash{' +
          'from{opacity:0;transform:translate(-50%,-50%) scale(0.7)}' +
          'to{opacity:1;transform:translate(-50%,-50%) scale(1)}' +
        '}';
      document.head.appendChild(style);
    }

    var banner = document.createElement('div');
    banner.id = 'okk-mastery-banner';
    banner.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:linear-gradient(135deg,#c8a000,#ffd700,#c8a000)',
      'color:#1a1000',
      'font-family:"Courier New",Courier,monospace',
      'font-weight:900',
      'text-align:center',
      'padding:32px 56px',
      'border:4px solid #fff8a0',
      'box-shadow:0 0 60px #ffd700,0 0 20px rgba(0,0,0,0.8)',
      'z-index:99999',
      'pointer-events:none',
      'border-radius:4px',
      'animation:okk-mastery-flash 0.3s ease-out'
    ].join(';');

    banner.innerHTML =
      '<div style="font-size:22px;letter-spacing:4px;margin-bottom:8px">' +
        '★ WEAPON MASTERY ★' +
      '</div>' +
      '<div style="font-size:28px;letter-spacing:2px;margin-bottom:4px">' +
        weaponType.toUpperCase() +
      '</div>' +
      '<div style="font-size:20px;margin-bottom:8px">' +
        title.toUpperCase() +
      '</div>' +
      '<div style="font-size:30px;letter-spacing:6px">' +
        stars +
      '</div>';

    document.body.appendChild(banner);

    _bannerTimeout = setTimeout(function () {
      if (banner.parentNode) { banner.parentNode.removeChild(banner); }
      _bannerTimeout = null;
    }, 1500);
  }

  /* ── Mastery-up sound: two ascending tones ──────────────────────────────── */
  function _playMasterySound() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) { return; }
      var ctx = new AudioCtx();
      var gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

      var osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(660, ctx.currentTime);
      osc1.connect(gain);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      var osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(990, ctx.currentTime + 0.38);
      osc2.connect(gain);
      osc2.start(ctx.currentTime + 0.38);
      osc2.stop(ctx.currentTime + 0.85);
    } catch (e) {
      /* No AudioContext available */
    }
  }

  /* ── Headshot expert toast ──────────────────────────────────────────────── */
  function _showHeadshotToast(weaponType) {
    var old = document.getElementById('okk-hs-toast');
    if (old && old.parentNode) { old.parentNode.removeChild(old); }

    var toast = document.createElement('div');
    toast.id = 'okk-hs-toast';
    toast.style.cssText = [
      'position:fixed',
      'top:22%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(180,0,0,0.88)',
      'color:#fff',
      'font-family:"Courier New",Courier,monospace',
      'font-weight:700',
      'font-size:16px',
      'padding:10px 24px',
      'border:2px solid #ff4444',
      'border-radius:3px',
      'z-index:99998',
      'pointer-events:none',
      'letter-spacing:2px',
      'transition:opacity 0.4s'
    ].join(';');
    toast.textContent = '+HEADSHOT EXPERT — ' + weaponType.toUpperCase();
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () {
        if (toast.parentNode) { toast.parentNode.removeChild(toast); }
      }, 450);
    }, 1200);
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */
  function init() {
    if (_initialized) { return; }
    _initialized = true;
    _load();
    _bindKey();
  }

  function recordKill(weaponType) {
    if (!weaponType) { return; }
    _ensureWeapon(weaponType);
    var data = _masteryData[weaponType];
    data.kills++;
    var newLevel = _getLevel(data.kills);
    if (newLevel > data.level) {
      data.level = newLevel;
      _showMasteryBanner(weaponType, newLevel);
      _playMasterySound();
      if (typeof window._onWeaponMasteryUp === 'function') {
        window._onWeaponMasteryUp(weaponType, newLevel);
      }
    }
    _save();
  }

  function recordHeadshot(weaponType) {
    if (!weaponType) { return; }
    _ensureWeapon(weaponType);
    var data = _masteryData[weaponType];
    data.headshots++;
    if (data.headshots % 10 === 0) {
      _showHeadshotToast(weaponType);
    }
    _save();
  }

  function getMastery(weaponType) {
    _ensureWeapon(weaponType);
    var data = _masteryData[weaponType];
    var level = data.level;
    return {
      kills:     data.kills,
      headshots: data.headshots,
      level:     level,
      stars:     STAR_LABELS[level],
      title:     _getTitle(weaponType, level),
      levelName: LEVEL_NAMES[level]
    };
  }

  function getTitle(weaponType) {
    _ensureWeapon(weaponType);
    return _getTitle(weaponType, _masteryData[weaponType].level);
  }

  function reset() {
    _masteryData = {};
    _save();
  }

  /* ── Mastery panel (Y key) ──────────────────────────────────────────────── */
  function showMasteryPanel() {
    if (_panelVisible) {
      _destroyPanel();
      return;
    }
    _buildPanel();
  }

  function _destroyPanel() {
    if (_panelEl && _panelEl.parentNode) {
      _panelEl.parentNode.removeChild(_panelEl);
    }
    _panelEl = null;
    _panelVisible = false;
  }

  function _buildPanel() {
    _panelVisible = true;

    var overlay = document.createElement('div');
    _panelEl = overlay;
    overlay.id = 'okk-mastery-panel';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,0.92)',
      'z-index:99990',
      'overflow-y:auto',
      'font-family:"Courier New",Courier,monospace',
      'color:#e0d8c0',
      'padding:32px 24px 48px'
    ].join(';');

    /* Click outside (on overlay background) to close */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { _destroyPanel(); }
    });

    /* Count mastered weapons */
    var totalMastered = 0;
    var w;
    for (w in _masteryData) {
      if (_masteryData.hasOwnProperty(w) && _masteryData[w].level >= 4) {
        totalMastered++;
      }
    }

    /* Header */
    var header = document.createElement('div');
    header.style.cssText = 'text-align:center;margin-bottom:24px';
    header.innerHTML =
      '<div style="font-size:26px;font-weight:900;letter-spacing:6px;color:#ffd700">' +
        '★ WEAPON MASTERY ★' +
      '</div>' +
      '<div style="font-size:14px;margin-top:8px;color:#a09070">' +
        'Weapons Mastered: <span style="color:#ffd700;font-weight:700">' + totalMastered + '</span>' +
        '&nbsp;&nbsp;|&nbsp;&nbsp;Press Y or click outside to close' +
      '</div>';
    overlay.appendChild(header);

    /* Collect and sort weapons: mastered first, then by kills descending */
    var weapons = [];
    for (w in _masteryData) {
      if (_masteryData.hasOwnProperty(w)) {
        weapons.push(w);
      }
    }
    weapons.sort(function (a, b) {
      var da = _masteryData[a], db = _masteryData[b];
      if (da.level !== db.level) { return db.level - da.level; }
      return db.kills - da.kills;
    });

    if (weapons.length === 0) {
      var empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;color:#606060;font-size:18px;margin-top:80px';
      empty.textContent = 'No weapon kills recorded yet.';
      overlay.appendChild(empty);
      document.body.appendChild(overlay);
      return;
    }

    /* Grid — 4 cards per row */
    var grid = document.createElement('div');
    grid.style.cssText = [
      'display:grid',
      'grid-template-columns:repeat(4,1fr)',
      'gap:16px',
      'max-width:960px',
      'margin:0 auto'
    ].join(';');

    var i;
    for (i = 0; i < weapons.length; i++) {
      grid.appendChild(_buildCard(weapons[i]));
    }

    overlay.appendChild(grid);
    document.body.appendChild(overlay);
  }

  function _buildCard(weaponType) {
    var data = _masteryData[weaponType];
    var level = data.level;
    var isMastered = (level >= 4);
    var title = _getTitle(weaponType, level);
    var stars = STAR_LABELS[level];
    var emoji = _getEmoji(weaponType);

    /* Progress toward next level */
    var nextThreshold = (level < 4) ? THRESHOLDS[level + 1] : THRESHOLDS[4];
    var prevThreshold = THRESHOLDS[level];
    var progressPct = (level >= 4)
      ? 100
      : Math.min(100, Math.floor(((data.kills - prevThreshold) / (nextThreshold - prevThreshold)) * 100));

    var card = document.createElement('div');
    card.style.cssText = [
      'background:' + (isMastered
        ? 'linear-gradient(135deg,#2a2000,#3d3000)'
        : 'rgba(30,28,22,0.9)'),
      'border:2px solid ' + (isMastered ? '#ffd700' : '#3a3520'),
      'border-radius:6px',
      'padding:16px 12px',
      'text-align:center',
      'box-shadow:' + (isMastered ? '0 0 18px rgba(255,215,0,0.3)' : 'none')
    ].join(';');

    card.innerHTML =
      '<div style="font-size:28px;margin-bottom:4px">' + emoji + '</div>' +
      '<div style="font-size:13px;font-weight:700;letter-spacing:2px;color:' +
        (isMastered ? '#ffd700' : '#c8b880') + ';margin-bottom:4px">' +
        weaponType.toUpperCase() +
      '</div>' +
      '<div style="font-size:18px;letter-spacing:3px;margin-bottom:6px;color:' +
        (isMastered ? '#ffd700' : '#888') + '">' + stars + '</div>' +
      '<div style="font-size:11px;color:#a09070;margin-bottom:8px">' + title + '</div>' +
      '<div style="font-size:11px;color:#806050;margin-bottom:4px">' +
        data.kills + ' kills' +
        (data.headshots ? ' &nbsp;|&nbsp; ' + data.headshots + ' HS' : '') +
      '</div>' +
      '<div style="background:#1a1810;border-radius:3px;height:6px;overflow:hidden;margin-top:4px">' +
        '<div style="height:100%;width:' + progressPct + '%;' +
          'background:' + (isMastered ? '#ffd700' : '#6a8a3a') + ';' +
          'border-radius:3px"></div>' +
      '</div>' +
      (level < 4
        ? '<div style="font-size:10px;color:#504838;margin-top:3px">' +
            data.kills + ' / ' + nextThreshold + ' to ' + LEVEL_NAMES[level + 1] +
          '</div>'
        : '<div style="font-size:10px;color:#ffd700;margin-top:3px">★ MASTERED ★</div>');

    return card;
  }

  /* ── Key binding: Y toggles panel ──────────────────────────────────────── */
  function _bindKey() {
    document.addEventListener('keydown', function (e) {
      /* Ignore if focus is in a text field */
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'y' || e.key === 'Y') {
        showMasteryPanel();
      }
    });
  }

  /* ── Global hooks ───────────────────────────────────────────────────────── */
  window._onWeaponKillForMastery = function (weaponType) {
    WeaponMastery.recordKill(weaponType);
  };
  window._onHeadshotForMastery = function (weaponType) {
    WeaponMastery.recordHeadshot(weaponType);
  };

  /* Auto-init */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init:             init,
    recordKill:       recordKill,
    recordHeadshot:   recordHeadshot,
    getMastery:       getMastery,
    getTitle:         getTitle,
    showMasteryPanel: showMasteryPanel,
    reset:            reset
  };

})();
