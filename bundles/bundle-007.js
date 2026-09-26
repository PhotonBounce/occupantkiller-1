/* === perk-system.js === */
try {
;
// perk-system.js — XP leveling + perk selection system (IIFE, all var)
// Earn XP from kills, level up, choose a perk every 3 levels.
// Persists via localStorage key 'okk_perks_v1'.
// Exposes: window.PerkSystem = { init, update, onKill, onWaveComplete, reset }
// Globals set: window._playerLevel, window._playerPerks, window._playerXP
//              window._reloadSpeedMult, window._grenadeCountBonus,
//              window._grenadesRechargeBonus, window._enemyDetectMult,
//              window._scavengerEnabled, window._medRegenEnabled,
//              window._killstreakWindowBonus, window._ironLungsEnabled,
//              window._thickSkinBonus

window.PerkSystem = (function () {
  'use strict';

  // ── XP thresholds (quadratic progression) ───────────────────────────────
  // Index 0 = XP needed to reach level 2, index N = XP needed to reach level N+2
  var XP_TABLE = (function () {
    var t = [];
    // 100, 250, 450, 700, 1000, 1400, 1900, 2500, then continue quadratic
    var base = [100, 250, 450, 700, 1000, 1400, 1900, 2500];
    for (var i = 0; i < base.length; i++) t.push(base[i]);
    // Beyond level 9 — extend with quadratic formula: 3100, 3800, 4600, ...
    var last = 2500;
    var gap = 700;
    var gapInc = 100;
    for (var j = 0; j < 40; j++) {
      last = last + gap;
      t.push(last);
      gap += gapInc;
    }
    return t;
  })();

  // ── Perk pool ────────────────────────────────────────────────────────────
  var PERKS = [
    {
      id: 'IRON_LUNGS',
      name: 'Iron Lungs',
      icon: '🪱',
      desc: 'Hold breath longer — zoom stays stable 50% longer while ADS.'
    },
    {
      id: 'QUICK_RELOAD',
      name: 'Quick Reload',
      icon: '⚡',
      desc: '40% faster reload speed on all weapons.'
    },
    {
      id: 'THICK_SKIN',
      name: 'Thick Skin',
      icon: '🦏',
      desc: '+25 max HP permanently. Health bar extends.'
    },
    {
      id: 'GRENADIER',
      name: 'Grenadier',
      icon: '💣',
      desc: 'Grenade count +2 and cooldown reduced by 30%.'
    },
    {
      id: 'GHOST',
      name: 'Ghost',
      icon: '👻',
      desc: 'Enemies detect the player 25% slower.'
    },
    {
      id: 'SCAVENGER',
      name: 'Scavenger',
      icon: '🎒',
      desc: '60% chance enemies drop ammo on death.'
    },
    {
      id: 'MEDIC',
      name: 'Medic',
      icon: '💉',
      desc: 'Regenerate 1 HP/s when out of combat for 8 seconds.'
    },
    {
      id: 'KILLSTREAK',
      name: 'Killstreak',
      icon: '🔥',
      desc: 'Kill streak window extended from 8s to 14s.'
    }
  ];

  // ── Private state ────────────────────────────────────────────────────────
  var _level = 1;
  var _xp = 0;
  var _perks = [];          // array of perk IDs chosen
  var _initialized = false;
  var _overlayVisible = false;
  var _pendingPerkSelect = false;

  // HUD elements (created on init)
  var _levelBadge = null;
  var _xpBarWrap = null;
  var _xpBarFill = null;

  // Medic regen state
  var _combatTimer = 0;     // seconds since last damage taken
  var _medRegenActive = false;

  // ── Save / Load ──────────────────────────────────────────────────────────
  var SAVE_KEY = 'okk_perks_v1';

  function _save() {
    try {
      var data = { level: _level, xp: _xp, perks: _perks };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function _load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && typeof data.level === 'number') {
        _level = data.level;
        _xp    = data.xp || 0;
        _perks = Array.isArray(data.perks) ? data.perks : [];
      }
    } catch (e) {}
  }

  // ── XP threshold for next level ──────────────────────────────────────────
  function _xpForLevel(lvl) {
    // XP_TABLE[0] = threshold for level 1->2, [N] = threshold for level N+1->N+2
    var idx = lvl - 1;
    if (idx < 0) idx = 0;
    if (idx >= XP_TABLE.length) idx = XP_TABLE.length - 1;
    return XP_TABLE[idx];
  }

  // ── Apply active perks to window globals ─────────────────────────────────
  function _applyPerks() {
    // Reset all to defaults
    window._reloadSpeedMult       = 1.0;
    window._grenadeCountBonus     = 0;
    window._grenadesRechargeBonus = 0;
    window._enemyDetectMult       = 1.0;
    window._scavengerEnabled      = false;
    window._medRegenEnabled       = false;
    window._killstreakWindowBonus = 0;
    window._ironLungsEnabled      = false;
    window._thickSkinBonus        = 0;

    for (var i = 0; i < _perks.length; i++) {
      var pid = _perks[i];
      if (pid === 'QUICK_RELOAD') {
        window._reloadSpeedMult = 0.6;
      }
      if (pid === 'GRENADIER') {
        window._grenadeCountBonus     = 2;
        window._grenadesRechargeBonus = 0.3;
      }
      if (pid === 'GHOST') {
        window._enemyDetectMult = 0.75;
      }
      if (pid === 'SCAVENGER') {
        window._scavengerEnabled = true;
      }
      if (pid === 'MEDIC') {
        window._medRegenEnabled = true;
      }
      if (pid === 'KILLSTREAK') {
        window._killstreakWindowBonus = 6; // extra seconds
      }
      if (pid === 'IRON_LUNGS') {
        window._ironLungsEnabled = true;
      }
      if (pid === 'THICK_SKIN') {
        window._thickSkinBonus = 25;
      }
    }

    // Expose canonical globals
    window._playerLevel = _level;
    window._playerPerks = _perks.slice();
    window._playerXP    = _xp;
  }

  // ── HUD: level badge + XP bar ────────────────────────────────────────────
  function _ensureHUD() {
    if (_levelBadge && _levelBadge.parentNode) return;

    // Level badge — top-left
    _levelBadge = document.createElement('div');
    _levelBadge.id = 'perk-level-badge';
    _levelBadge.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:8px',
      'background:rgba(0,0,0,0.75)',
      'border:1px solid #c8a000',
      'border-radius:4px',
      'padding:2px 7px',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'color:#ffd700',
      'letter-spacing:1px',
      'z-index:300',
      'pointer-events:none',
      'user-select:none',
      'transition:box-shadow 0.3s'
    ].join(';');
    document.body.appendChild(_levelBadge);

    // XP bar container — thin bar below health bar (bottom-left)
    _xpBarWrap = document.createElement('div');
    _xpBarWrap.id = 'perk-xp-bar-wrap';
    _xpBarWrap.style.cssText = [
      'position:fixed',
      'bottom:36px',
      'left:12px',
      'width:180px',
      'height:5px',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(255,215,0,0.3)',
      'border-radius:3px',
      'z-index:300',
      'pointer-events:none',
      'overflow:hidden'
    ].join(';');

    _xpBarFill = document.createElement('div');
    _xpBarFill.id = 'perk-xp-bar-fill';
    _xpBarFill.style.cssText = [
      'height:100%',
      'width:0%',
      'background:linear-gradient(90deg,#c8a000,#ffd700)',
      'border-radius:2px',
      'transition:width 0.4s ease'
    ].join(';');

    _xpBarWrap.appendChild(_xpBarFill);
    document.body.appendChild(_xpBarWrap);
  }

  function _updateHUD() {
    if (!_levelBadge) return;
    _levelBadge.textContent = 'Lv.' + _level;
    if (!_xpBarFill) return;
    var needed = _xpForLevel(_level);
    var pct = needed > 0 ? Math.min(100, (_xp / needed) * 100) : 100;
    _xpBarFill.style.width = pct + '%';
  }

  // ── Level-up animation ───────────────────────────────────────────────────
  function _showLevelUpAnim(newLevel) {
    // Golden border flash
    var flash = document.createElement('div');
    flash.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'bottom:0',
      'pointer-events:none',
      'border:4px solid #ffd700',
      'box-shadow:inset 0 0 60px rgba(255,215,0,0.4),0 0 40px rgba(255,215,0,0.3)',
      'z-index:500',
      'opacity:1',
      'transition:opacity 0.9s ease'
    ].join(';');
    document.body.appendChild(flash);
    setTimeout(function () { flash.style.opacity = '0'; }, 200);
    setTimeout(function () {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 1150);

    // "LEVEL UP!" text banner
    var banner = document.createElement('div');
    banner.style.cssText = [
      'position:fixed',
      'top:28%',
      'left:50%',
      'transform:translateX(-50%) scale(0.6)',
      'font-family:monospace',
      'font-size:36px',
      'font-weight:bold',
      'color:#ffd700',
      'text-shadow:0 0 20px #ffd700,0 0 40px #ffa500,2px 2px 0 #000',
      'letter-spacing:4px',
      'pointer-events:none',
      'z-index:501',
      'opacity:1',
      'transition:transform 0.25s ease,opacity 0.6s ease',
      'white-space:nowrap'
    ].join(';');
    banner.textContent = 'LEVEL UP!  Lv.' + newLevel;
    document.body.appendChild(banner);
    setTimeout(function () { banner.style.transform = 'translateX(-50%) scale(1)'; }, 20);
    setTimeout(function () { banner.style.opacity = '0'; }, 1500);
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 2200);

    // Pulse level badge
    if (_levelBadge) {
      _levelBadge.style.boxShadow = '0 0 10px #ffd700,0 0 22px #ffd700';
      setTimeout(function () {
        if (_levelBadge) _levelBadge.style.boxShadow = '';
      }, 1600);
    }
  }

  // ── Pick 3 random perks for selection (prefer unowned) ──────────────────
  function _pickSelectionPool() {
    var unowned = [];
    var owned = [];
    var i;
    for (i = 0; i < PERKS.length; i++) {
      if (_perks.indexOf(PERKS[i].id) < 0) {
        unowned.push(PERKS[i]);
      } else {
        owned.push(PERKS[i]);
      }
    }

    function _shuffle(arr) {
      var a = arr.slice();
      var j, tmp;
      for (var ii = a.length - 1; ii > 0; ii--) {
        j = Math.floor(Math.random() * (ii + 1));
        tmp = a[ii]; a[ii] = a[j]; a[j] = tmp;
      }
      return a;
    }

    var pool = _shuffle(unowned).slice(0, 3);
    if (pool.length < 3) {
      var extra = _shuffle(owned);
      for (var k = 0; k < extra.length && pool.length < 3; k++) {
        pool.push(extra[k]);
      }
    }
    while (pool.length < 3 && pool.length > 0) pool.push(pool[0]);
    return pool;
  }

  // ── Perk selection overlay ───────────────────────────────────────────────
  function _showPerkSelect() {
    if (_overlayVisible) return;
    _overlayVisible = true;
    window._isPaused = true;

    var pool = _pickSelectionPool();
    if (!pool.length) {
      // Nothing to show (all 8 owned and pool still empty somehow)
      _overlayVisible = false;
      window._isPaused = false;
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'perk-select-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'bottom:0',
      'background:rgba(0,0,0,0.82)',
      'z-index:9000',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace'
    ].join(';');

    // Title
    var title = document.createElement('div');
    title.style.cssText = [
      'color:#ffd700',
      'font-size:26px',
      'font-weight:bold',
      'letter-spacing:4px',
      'text-shadow:0 0 15px #ffd700',
      'margin-bottom:8px'
    ].join(';');
    title.textContent = 'CHOOSE A PERK';
    overlay.appendChild(title);

    var sub = document.createElement('div');
    sub.style.cssText = 'color:#aaa;font-size:13px;margin-bottom:28px;letter-spacing:2px;';
    sub.textContent = 'LEVEL ' + _level + ' — SELECT ONE';
    overlay.appendChild(sub);

    // Card row
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:18px;align-items:stretch;';
    overlay.appendChild(row);

    for (var ci = 0; ci < pool.length; ci++) {
      (function (perk) {
        var alreadyOwned = _perks.indexOf(perk.id) >= 0;

        var card = document.createElement('div');
        card.style.cssText = [
          'width:160px',
          'min-height:220px',
          'background:rgba(15,20,15,0.97)',
          'border:2px solid ' + (alreadyOwned ? '#886600' : '#3a5a2a'),
          'border-radius:8px',
          'padding:18px 14px',
          'display:flex',
          'flex-direction:column',
          'align-items:center',
          'gap:10px',
          'cursor:pointer',
          'transition:border-color 0.15s,box-shadow 0.15s,transform 0.15s',
          'box-sizing:border-box',
          'text-align:center'
        ].join(';');

        // Icon
        var iconEl = document.createElement('div');
        iconEl.style.cssText = 'font-size:38px;line-height:1;';
        iconEl.textContent = perk.icon;
        card.appendChild(iconEl);

        // Name
        var nameEl = document.createElement('div');
        nameEl.style.cssText = [
          'color:#ffd700',
          'font-size:14px',
          'font-weight:bold',
          'letter-spacing:1px',
          'text-transform:uppercase'
        ].join(';');
        nameEl.textContent = perk.name;
        card.appendChild(nameEl);

        // Description
        var descEl = document.createElement('div');
        descEl.style.cssText = 'color:#bbb;font-size:11px;line-height:1.45;';
        descEl.textContent = perk.desc;
        card.appendChild(descEl);

        // Already-owned badge
        if (alreadyOwned) {
          var badgeEl = document.createElement('div');
          badgeEl.style.cssText = [
            'margin-top:auto',
            'color:#886600',
            'font-size:10px',
            'letter-spacing:1px',
            'border-top:1px solid #444',
            'padding-top:8px',
            'width:100%',
            'text-align:center'
          ].join(';');
          badgeEl.textContent = 'ALREADY OWNED';
          card.appendChild(badgeEl);
        }

        // Hover
        card.addEventListener('mouseover', function () {
          card.style.borderColor = '#ffd700';
          card.style.boxShadow = '0 0 20px rgba(255,215,0,0.35)';
          card.style.transform = 'translateY(-4px)';
        });
        card.addEventListener('mouseout', function () {
          card.style.borderColor = alreadyOwned ? '#886600' : '#3a5a2a';
          card.style.boxShadow = '';
          card.style.transform = '';
        });

        // Click to select
        card.addEventListener('click', function () {
          _selectPerk(perk.id, perk.name, overlay);
        });

        row.appendChild(card);
      })(pool[ci]);
    }

    document.body.appendChild(overlay);
  }

  function _selectPerk(perkId, perkName, overlay) {
    if (_perks.indexOf(perkId) < 0) {
      _perks.push(perkId);
    }
    _applyPerks();
    _save();

    // Fade out overlay
    overlay.style.transition = 'opacity 0.4s';
    overlay.style.opacity = '0';
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      _overlayVisible = false;
      window._isPaused = false;
      _showToast('PERK UNLOCKED: ' + perkName.toUpperCase(), '#ffd700');
    }, 450);
  }

  // ── Toast helper ─────────────────────────────────────────────────────────
  function _showToast(msg, color) {
    try {
      if (window.HUD && typeof HUD.showToast === 'function') {
        HUD.showToast(msg, 2200, color || '#ffd700');
        return;
      }
    } catch (e) {}
    var toast = document.createElement('div');
    toast.style.cssText = [
      'position:fixed',
      'top:20%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.88)',
      'border:1px solid ' + (color || '#ffd700'),
      'color:' + (color || '#ffd700'),
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'letter-spacing:2px',
      'padding:10px 20px',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'text-align:center',
      'opacity:1',
      'transition:opacity 0.5s'
    ].join(';');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.style.opacity = '0'; }, 1700);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2300);
  }

  // ── Add XP ───────────────────────────────────────────────────────────────
  function _addXP(amount) {
    _xp += amount;
    window._playerXP = _xp;

    var leveled = false;
    while (_xp >= _xpForLevel(_level)) {
      _xp -= _xpForLevel(_level);
      _level++;
      leveled = true;
      window._playerLevel = _level;
      window._playerXP    = _xp;
    }

    if (leveled) {
      _applyPerks();
      _save();
      _showLevelUpAnim(_level);

      // Every 3 levels: show perk selection (delayed so level-up banner shows first)
      if (_level % 3 === 0 && !_pendingPerkSelect) {
        _pendingPerkSelect = true;
        setTimeout(function () {
          _showPerkSelect();
          _pendingPerkSelect = false;
        }, 1600);
      }
    }

    _updateHUD();
  }

  // ── Public API ───────────────────────────────────────────────────────────

  function init() {
    if (_initialized) return;
    _initialized = true;
    _load();
    _applyPerks();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        _ensureHUD();
        _updateHUD();
      });
    } else {
      _ensureHUD();
      _updateHUD();
    }
  }

  // delta = seconds elapsed since last frame
  function update(delta) {
    if (!_initialized) return;

    // Medic: regen 1 HP/s after 8s out of combat
    if (_perks.indexOf('MEDIC') >= 0) {
      _combatTimer += delta;
      if (_combatTimer >= 8) {
        _medRegenActive = true;
        try {
          if (typeof player !== 'undefined' && player && typeof player.hp === 'number') {
            var cap = (typeof player.maxHp === 'number' ? player.maxHp : 100) +
                      (_perks.indexOf('THICK_SKIN') >= 0 ? 25 : 0);
            if (player.hp < cap) {
              player.hp = Math.min(cap, player.hp + delta);
              if (typeof HUD !== 'undefined' && HUD.setHP) HUD.setHP(player.hp, cap);
            }
          }
        } catch (e) {}
      } else {
        _medRegenActive = false;
      }
    }
  }

  // opts: { headshot: bool, boss: bool, enemyType: string }
  function onKill(opts) {
    if (!_initialized) return;
    opts = opts || {};

    var xpGain = 25;
    if (opts.headshot) xpGain += 50;
    if (opts.boss)     xpGain += 100;

    // Reset medic combat timer
    _combatTimer = 0;
    _medRegenActive = false;

    // Scavenger: 60% chance to drop ammo
    if (_perks.indexOf('SCAVENGER') >= 0 && Math.random() < 0.6) {
      try {
        if (typeof Weapons !== 'undefined' && Weapons.addAmmo) {
          Weapons.addAmmo(15);
          if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
            HUD.notifyPickup('SCAVENGER +15 ammo', '#88ff88');
          }
        }
      } catch (e) {}
    }

    _addXP(xpGain);
  }

  function onWaveComplete() {
    if (!_initialized) return;
    _addXP(50); // small wave-clear bonus
  }

  function reset() {
    _level = 1;
    _xp    = 0;
    _perks = [];
    _pendingPerkSelect = false;
    _combatTimer = 0;
    _medRegenActive = false;

    var ov = document.getElementById('perk-select-overlay');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    if (_overlayVisible) {
      _overlayVisible = false;
      window._isPaused = false;
    }

    _applyPerks();
    _save();
    _updateHUD();
  }

  // ── Auto-hook: intercept _onKillForFeed to catch all kills ───────────────
  (function () {
    var _prevKillHook = window._onKillForFeed;
    window._onKillForFeed = function (enemyType, weapon, isHeadshot) {
      if (typeof _prevKillHook === 'function') _prevKillHook(enemyType, weapon, isHeadshot);
      var isBoss = typeof enemyType === 'string' &&
                   (enemyType.indexOf('BOSS') >= 0 || enemyType.indexOf('boss') >= 0);
      if (window.PerkSystem && typeof PerkSystem.onKill === 'function') {
        PerkSystem.onKill({ headshot: !!isHeadshot, boss: isBoss, enemyType: enemyType });
      }
    };
  })();

  // ── Auto-hook: intercept _onPlayerDamage to reset medic timer ───────────
  (function () {
    var _prevDmgHook = window._onPlayerDamage;
    window._onPlayerDamage = function (amount) {
      if (typeof _prevDmgHook === 'function') _prevDmgHook(amount);
      _combatTimer = 0;
      _medRegenActive = false;
    };
  })();

  return {
    init: init,
    update: update,
    onKill: onKill,
    onWaveComplete: onWaveComplete,
    reset: reset
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail perk-system.js",_e&&_e.message); }
/* === ground-fissure.js === */
try {
;
window.GroundFissure = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _initialized = false;
  var _wasEarthquakeActive = false;
  var _earthquakeEndTime = 0;
  var _audioCtx = null;
  var _fissures = [];
  var _steamJets = [];
  var _rubbleParticles = [];
  var FISSURE_PERSIST = 12;
  var FADE_DURATION = 1.5;
  var GROW_DURATION = 2.0;
  var FISSURE_DAMAGE_RANGE = 0.8;
  var PLAYER_WARN_RANGE = 1.5;
  var ENEMY_KNOCKBACK_MAG = 5;
  var ENEMY_DAMAGE_PER_SEC = 25;

  window._activeFissures = [];

  // ── Audio helpers ──────────────────────────────────────────────────────────

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playRumble() {
    try {
      var ctx = _getAudioCtx();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.6));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 60;
      var gain = ctx.createGain();
      gain.gain.value = 0.4;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playCrackSFX() {
    try {
      var ctx = _getAudioCtx();
      var duration = 0.25;
      var buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        var t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 18) * (1 - t / duration);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 0.5;
      var gain = ctx.createGain();
      gain.gain.value = 0.6;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  // ── Fissure spawning ───────────────────────────────────────────────────────

  function _spawnFissure(cx, cz) {
    var angle = Math.random() * Math.PI;
    var offsetX = (Math.random() - 0.5) * 30;
    var offsetZ = (Math.random() - 0.5) * 30;
    var px = cx + offsetX;
    var pz = cz + offsetZ;

    // Crack plane
    var geo = new THREE.PlaneGeometry(8, 0.3);
    var mat = new THREE.MeshLambertMaterial({
      color: 0x1A0A00,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = angle;
    mesh.position.set(px, 0.02, pz);
    mesh.scale.x = 0.01; // start tiny, grow to 1
    _scene.add(mesh);

    // Point light glow from below
    var light = new THREE.PointLight(0xFF4400, 4, 6);
    light.position.set(px, 0.1, pz);
    _scene.add(light);

    var fissure = {
      mesh: mesh,
      light: light,
      px: px,
      pz: pz,
      angle: angle,
      age: 0,
      fadeAge: null, // set when fading starts
      halfLen: 4,    // half of full length (8 / 2)
      alive: true
    };

    _fissures.push(fissure);
    window._activeFissures.push(fissure);

    _playCrackSFX();
    _spawnRubble(px, pz, angle);
    return fissure;
  }

  function _spawnRubble(px, pz, angle) {
    var count = 4 + Math.floor(Math.random() * 3); // 4-6
    // Spawn from both ends of the crack
    for (var e = -1; e <= 1; e += 2) {
      var endX = px + Math.cos(angle) * 4 * e;
      var endZ = pz + Math.sin(angle) * 4 * e;
      for (var i = 0; i < Math.ceil(count / 2); i++) {
        var size = 0.15;
        var geo = new THREE.BoxGeometry(size, size, size);
        var mat = new THREE.MeshLambertMaterial({ color: 0x555555 + Math.floor(Math.random() * 0x111111) });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          endX + (Math.random() - 0.5) * 1.5,
          0.5 + Math.random() * 0.5,
          endZ + (Math.random() - 0.5) * 1.5
        );
        _scene.add(mesh);
        _rubbleParticles.push({
          mesh: mesh,
          vel: {
            x: (Math.random() - 0.5) * 4,
            y: 2 + Math.random() * 3,
            z: (Math.random() - 0.5) * 4
          },
          life: 2.5
        });
      }
    }
  }

  function _spawnSteamJet(px, pz) {
    var geo = new THREE.CylinderGeometry(0.15, 0.3, 3, 8);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, 1.5, pz);
    _scene.add(mesh);
    _steamJets.push({
      mesh: mesh,
      baseY: 1.5,
      phase: Math.random() * Math.PI * 2,
      alive: true,
      life: 14 // lives a bit longer than fissures
    });
  }

  // ── Trigger: spawn a batch of fissures ────────────────────────────────────

  function trigger() {
    if (!_initialized || !_scene) return;
    var cx = _camera ? _camera.position.x : 0;
    var cz = _camera ? _camera.position.z : 0;
    var count = 6 + Math.floor(Math.random() * 5); // 6-10
    for (var i = 0; i < count; i++) {
      var f = _spawnFissure(cx, cz);
      // Every 2 fissures spawn a steam jet
      if (i % 2 === 1) {
        _spawnSteamJet(f.px, f.pz);
      }
    }
    _playRumble();
  }

  // ── HUD helpers ────────────────────────────────────────────────────────────

  var _hudWarningEl = null;
  var _hudFlashEl = null;

  function _ensureHUDElements() {
    if (!_hudWarningEl) {
      _hudWarningEl = document.getElementById('ground-fissure-warning');
      if (!_hudWarningEl) {
        _hudWarningEl = document.createElement('div');
        _hudWarningEl.id = 'ground-fissure-warning';
        _hudWarningEl.style.cssText = [
          'position:fixed',
          'top:20%',
          'left:50%',
          'transform:translateX(-50%)',
          'color:#FF4400',
          'font-size:28px',
          'font-weight:bold',
          'text-shadow:0 0 8px #FF2200',
          'pointer-events:none',
          'display:none',
          'z-index:9999'
        ].join(';');
        _hudWarningEl.textContent = '⚠ CRACK!';
        document.body.appendChild(_hudWarningEl);
      }
    }
    if (!_hudFlashEl) {
      _hudFlashEl = document.getElementById('ground-fissure-flash');
      if (!_hudFlashEl) {
        _hudFlashEl = document.createElement('div');
        _hudFlashEl.id = 'ground-fissure-flash';
        _hudFlashEl.style.cssText = [
          'position:fixed',
          'top:0',
          'left:0',
          'width:100%',
          'height:100%',
          'border:6px solid #FF2200',
          'pointer-events:none',
          'display:none',
          'z-index:9998',
          'box-sizing:border-box'
        ].join(';');
        document.body.appendChild(_hudFlashEl);
      }
    }
  }

  var _playerWarnActive = false;

  function _updatePlayerWarning(playerPos, dt) {
    _ensureHUDElements();
    var warn = false;
    for (var i = 0; i < _fissures.length; i++) {
      var f = _fissures[i];
      if (!f.alive) continue;
      var dx = playerPos.x - f.px;
      var dz = playerPos.z - f.pz;
      // Project player onto the fissure line and check distance to edges
      var cosA = Math.cos(f.angle);
      var sinA = Math.sin(f.angle);
      var proj = dx * cosA + dz * sinA;
      var perp = Math.abs(-dx * sinA + dz * cosA);
      var growFraction = Math.min(1, f.age / GROW_DURATION);
      var currentHalfLen = f.halfLen * growFraction;
      var distToEdge = Math.max(0, Math.abs(proj) - currentHalfLen);
      var dist = Math.sqrt(distToEdge * distToEdge + perp * perp);
      if (dist < PLAYER_WARN_RANGE) {
        warn = true;
        break;
      }
    }
    _playerWarnActive = warn;
    if (_hudWarningEl) _hudWarningEl.style.display = warn ? 'block' : 'none';
    if (_hudFlashEl) _hudFlashEl.style.display = warn ? 'block' : 'none';
  }

  // ── Enemy damage ───────────────────────────────────────────────────────────

  function _updateEnemyDamage(dt) {
    var enemies = window._enemies || (window.Enemies && window.Enemies.getList && window.Enemies.getList()) || [];
    for (var fi = 0; fi < _fissures.length; fi++) {
      var f = _fissures[fi];
      if (!f.alive) continue;
      var growFraction = Math.min(1, f.age / GROW_DURATION);
      var currentHalfLen = f.halfLen * growFraction;
      var cosA = Math.cos(f.angle);
      var sinA = Math.sin(f.angle);
      for (var ei = 0; ei < enemies.length; ei++) {
        var enemy = enemies[ei];
        if (!enemy || !enemy.mesh || !enemy.mesh.position) continue;
        var ex = enemy.mesh.position.x - f.px;
        var ez = enemy.mesh.position.z - f.pz;
        var proj = ex * cosA + ez * sinA;
        var perp = Math.abs(-ex * sinA + ez * cosA);
        var clampedProj = Math.max(-currentHalfLen, Math.min(currentHalfLen, proj));
        var nearX = f.px + cosA * clampedProj;
        var nearZ = f.pz + sinA * clampedProj;
        var dx = enemy.mesh.position.x - nearX;
        var dz = enemy.mesh.position.z - nearZ;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < FISSURE_DAMAGE_RANGE) {
          // Damage
          if (enemy.health !== undefined) {
            enemy.health -= ENEMY_DAMAGE_PER_SEC * dt;
          } else if (typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(ENEMY_DAMAGE_PER_SEC * dt);
          }
          // Knockback
          var len = Math.sqrt(dx * dx + dz * dz) || 1;
          var kx = (dx / len) * ENEMY_KNOCKBACK_MAG;
          var kz = (dz / len) * ENEMY_KNOCKBACK_MAG;
          if (enemy.velocity) {
            enemy.velocity.x += kx;
            enemy.velocity.z += kz;
          } else if (enemy.vel) {
            enemy.vel.x += kx;
            enemy.vel.z += kz;
          } else if (enemy.mesh.position) {
            enemy.mesh.position.x += kx * dt;
            enemy.mesh.position.z += kz * dt;
          }
        }
      }
    }
  }

  // ── Per-frame update helpers ───────────────────────────────────────────────

  function _updateFissures(dt, now) {
    for (var i = _fissures.length - 1; i >= 0; i--) {
      var f = _fissures[i];
      f.age += dt;

      // Grow scale X
      var growFraction = Math.min(1, f.age / GROW_DURATION);
      f.mesh.scale.x = growFraction;

      // Fade out after earthquake ends
      if (f.fadeAge !== null) {
        var fadeProgress = (f.age - f.fadeAge) / FADE_DURATION;
        if (fadeProgress >= 1) {
          _scene.remove(f.mesh);
          _scene.remove(f.light);
          f.mesh.geometry.dispose();
          f.mesh.material.dispose();
          f.light = null;
          f.alive = false;
          _fissures.splice(i, 1);
          // Remove from global list
          var idx = window._activeFissures.indexOf(f);
          if (idx !== -1) window._activeFissures.splice(idx, 1);
          continue;
        }
        var opacity = 1 - fadeProgress;
        f.mesh.material.opacity = opacity;
        if (f.light) f.light.intensity = 4 * opacity;
      }

      // Gentle light flicker
      if (f.light) {
        f.light.intensity = (f.fadeAge !== null ? (f.mesh.material.opacity * 4) : 4) * (0.85 + Math.random() * 0.3);
      }
    }
  }

  function _updateSteamJets(dt) {
    var time = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
    for (var i = _steamJets.length - 1; i >= 0; i--) {
      var s = _steamJets[i];
      s.life -= dt;
      if (s.life <= 0) {
        _scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        _steamJets.splice(i, 1);
        continue;
      }
      // Pulse upward and oscillate opacity
      s.mesh.position.y = s.baseY + Math.sin(time * 2 + s.phase) * 0.4;
      s.mesh.scale.y = 0.8 + Math.sin(time * 3 + s.phase) * 0.3;
      s.mesh.material.opacity = 0.15 + Math.abs(Math.sin(time * 1.5 + s.phase)) * 0.2;
      // Fade out in last 2 seconds
      if (s.life < 2) {
        s.mesh.material.opacity *= (s.life / 2);
      }
    }
  }

  function _updateRubble(dt) {
    var GRAVITY = -9.8;
    for (var i = _rubbleParticles.length - 1; i >= 0; i--) {
      var r = _rubbleParticles[i];
      r.life -= dt;
      if (r.life <= 0 || r.mesh.position.y < -1) {
        _scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        _rubbleParticles.splice(i, 1);
        continue;
      }
      r.vel.y += GRAVITY * dt;
      r.mesh.position.x += r.vel.x * dt;
      r.mesh.position.y += r.vel.y * dt;
      r.mesh.position.z += r.vel.z * dt;
      // Bounce
      if (r.mesh.position.y < 0.075) {
        r.mesh.position.y = 0.075;
        r.vel.y = Math.abs(r.vel.y) * 0.4;
        r.vel.x *= 0.7;
        r.vel.z *= 0.7;
      }
      r.mesh.rotation.x += r.vel.z * dt * 2;
      r.mesh.rotation.z -= r.vel.x * dt * 2;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _initialized = true;
    window._activeFissures = [];
    _fissures = [];
    _steamJets = [];
    _rubbleParticles = [];
    _wasEarthquakeActive = false;
    _earthquakeEndTime = 0;
  }

  function update(dt) {
    if (!_initialized || !_scene) return;

    var now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;

    // Detect earthquake state — call EarthquakeEvent.update() to stay in sync
    if (window.EarthquakeEvent && typeof window.EarthquakeEvent.update === 'function') {
      // We call update but don't pass dt ourselves since the main loop already does;
      // this is just to read the active flag reliably. Only call if not already
      // called this frame — guard via the global flag set by EarthquakeEvent itself.
    }

    var earthquakeNow = !!window._earthquakeActive;

    if (earthquakeNow && !_wasEarthquakeActive) {
      // Earthquake just started — spawn fissures
      trigger();
    }

    if (!earthquakeNow && _wasEarthquakeActive) {
      // Earthquake just ended — mark fissures to start fading after persist delay
      _earthquakeEndTime = now + FISSURE_PERSIST;
    }

    _wasEarthquakeActive = earthquakeNow;

    // After persist delay, start fading all surviving fissures
    if (_earthquakeEndTime > 0 && now >= _earthquakeEndTime) {
      _earthquakeEndTime = 0;
      for (var fi = 0; fi < _fissures.length; fi++) {
        if (_fissures[fi].fadeAge === null) {
          _fissures[fi].fadeAge = _fissures[fi].age;
        }
      }
      // Also begin shrinking steam jets quickly
      for (var si = 0; si < _steamJets.length; si++) {
        if (_steamJets[si].life > 2) _steamJets[si].life = 2;
      }
    }

    _updateFissures(dt, now);
    _updateSteamJets(dt);
    _updateRubble(dt);
    _updateEnemyDamage(dt);

    // Player warning
    var playerPos = null;
    if (_camera) {
      playerPos = _camera.position;
    } else if (window._playerPosition) {
      playerPos = window._playerPosition;
    }
    if (playerPos) {
      _updatePlayerWarning(playerPos, dt);
    }
  }

  function reset() {
    // Remove all fissure meshes
    for (var i = 0; i < _fissures.length; i++) {
      var f = _fissures[i];
      if (f.mesh) { _scene && _scene.remove(f.mesh); f.mesh.geometry && f.mesh.geometry.dispose(); f.mesh.material && f.mesh.material.dispose(); }
      if (f.light) { _scene && _scene.remove(f.light); }
    }
    _fissures = [];
    // Steam
    for (var s = 0; s < _steamJets.length; s++) {
      var sj = _steamJets[s];
      if (sj.mesh) { _scene && _scene.remove(sj.mesh); sj.mesh.geometry && sj.mesh.geometry.dispose(); sj.mesh.material && sj.mesh.material.dispose(); }
    }
    _steamJets = [];
    // Rubble
    for (var r = 0; r < _rubbleParticles.length; r++) {
      var rb = _rubbleParticles[r];
      if (rb.mesh) { _scene && _scene.remove(rb.mesh); rb.mesh.geometry && rb.mesh.geometry.dispose(); rb.mesh.material && rb.mesh.material.dispose(); }
    }
    _rubbleParticles = [];
    window._activeFissures = [];
    _wasEarthquakeActive = false;
    _earthquakeEndTime = 0;
    if (_hudWarningEl) _hudWarningEl.style.display = 'none';
    if (_hudFlashEl) _hudFlashEl.style.display = 'none';
  }

  return { init: init, update: update, trigger: trigger, reset: reset };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail ground-fissure.js",_e&&_e.message); }
/* === weapon-wear.js === */
try {
;
/* ============================================================
 *  WEAPON-WEAR.JS — Gun degradation, field maintenance & repair
 *  Feature: Weapon Wear — guns degrade with use and need field maintenance
 *
 *  Condition states:
 *    100%      = PRISTINE  (green)
 *    75-99%    = GOOD      (yellow)
 *    50-74%    = WORN      (orange) — +15% recoil, -5% accuracy
 *    25-49%    = DAMAGED   (red)    — +30% recoil, -15% accuracy, 5% jam/shot
 *    0-24%     = CRITICAL  (flash)  — +60% recoil, -30% accuracy, 20% jam, misfire
 *
 *  Globals published:
 *    window._weaponCondition      (0-100)
 *    window._weaponJammed         (bool)
 *    window._weaponRecoilMult     (1.0 baseline)
 *    window._weaponAccuracyPenalty(0.0 baseline)
 *
 *  Integration surface:
 *    WeaponWear.init(scene)   — call once after scene ready
 *    WeaponWear.update(delta) — call each frame from game loop
 *    WeaponWear.onShot()      — call whenever weapon fires
 *    WeaponWear.repair()      — force full-repair (called internally by workbench)
 *    WeaponWear.reset()       — on weapon switch / level clear
 * ============================================================ */
window.WeaponWear = (function () {
  'use strict';

  /* ── Configuration ──────────────────────────────────────── */
  var CFG = {
    DEGRADE_PER_SHOT:     0.15,   // % lost per shot at normal conditions
    RAIN_DEGRADE_MULT:    2.0,    // multiplier when window._isRaining is truthy
    REPAIR_TARGET:        90,     // % restored after using workbench
    REPAIR_DURATION:      5.0,    // seconds at workbench to complete repair
    FIELD_STRIP_BONUS:    10,     // % condition gained from double-tap R
    FIELD_STRIP_DURATION: 3.0,    // seconds the field strip animation lasts
    FIELD_STRIP_THRESHOLD: 50,    // field strip only available below this %
    WORKBENCH_RANGE:      3.0,    // metres to trigger hold-F prompt
    WORKBENCH_GEOM: { w: 1.5, h: 0.8, d: 0.7 },
    NUM_WORKBENCHES:      2,      // spawned per level
    JAM_CLEAR_DURATION:   0.8,    // seconds for R-tap animation to clear jam
    SCRAPE_INTERVAL:      2.5,    // seconds between metallic-scrape ticks
    HUD_BLINK_RATE:       0.4,    // seconds per blink cycle in CRITICAL
    R_DBL_TAP_WINDOW:     0.35    // seconds between taps for double-tap detection
  };

  /* ── Condition band definitions ─────────────────────────── */
  var BANDS = [
    { min: 75, max: 100, name: 'PRISTINE', color: '#22cc44', recoil: 1.0, accuracy: 0.00, jamChance: 0.00 },
    { min: 50, max:  74, name: 'GOOD',     color: '#cccc00', recoil: 1.0, accuracy: 0.00, jamChance: 0.00 },
    { min: 25, max:  49, name: 'WORN',     color: '#ff8800', recoil: 1.15, accuracy: 0.05, jamChance: 0.00 },
    { min:  0, max:  24, name: 'DAMAGED',  color: '#cc2200', recoil: 1.30, accuracy: 0.15, jamChance: 0.05 },
    { min: -1, max:  -1, name: 'CRITICAL', color: '#ff0000', recoil: 1.60, accuracy: 0.30, jamChance: 0.20 }
  ];
  // Note: PRISTINE maps to 75-100, GOOD to 50-74, reordered for index lookup
  // We will compute band dynamically from condition value.

  /* ── State ──────────────────────────────────────────────── */
  var _scene             = null;
  var _condition         = 100;   // 0-100
  var _jammed            = false;
  var _jamClearTimer     = 0;     // counts down while clearing jam
  var _clearingJam       = false;
  var _fieldStripping    = false;
  var _fieldStripTimer   = 0;
  var _repairing         = false;
  var _repairTimer       = 0;
  var _lastRKeyTime      = 0;     // for double-tap detection
  var _workbenches       = [];    // THREE.Mesh[]
  var _nearWorkbench     = false;
  var _scrapeTimer       = 0;
  var _blinkTimer        = 0;
  var _blinkOn           = true;
  var _hudEl             = null;  // condition bar element
  var _hudBarFill        = null;
  var _hudLabel          = null;
  var _promptEl          = null;  // interaction-prompt element (reused)
  var _interactionPromptText = ''; // tracks what we wrote so we can clear it

  /* ── Publish globals ────────────────────────────────────── */
  function _syncGlobals() {
    var band = _getBand();
    window._weaponCondition      = _condition;
    window._weaponJammed         = _jammed;
    window._weaponRecoilMult     = _jammed ? 1.0 : band.recoil;
    window._weaponAccuracyPenalty = _jammed ? 0.0 : band.accuracy;
  }

  /* ── Band helper ─────────────────────────────────────────── */
  function _getBand() {
    if (_condition >= 75) return { name: 'PRISTINE', color: '#22cc44', recoil: 1.0,  accuracy: 0.00, jamChance: 0.00 };
    if (_condition >= 50) return { name: 'GOOD',     color: '#cccc00', recoil: 1.0,  accuracy: 0.00, jamChance: 0.00 };
    if (_condition >= 25) return { name: 'WORN',     color: '#ff8800', recoil: 1.15, accuracy: 0.05, jamChance: 0.00 };
    if (_condition > 0)   return { name: 'DAMAGED',  color: '#cc2200', recoil: 1.30, accuracy: 0.15, jamChance: 0.05 };
    return                       { name: 'CRITICAL', color: '#ff0000', recoil: 1.60, accuracy: 0.30, jamChance: 0.20 };
  }

  /* ── Audio helpers (safe-fallback) ─────────────────────── */
  function _playDryFire() {
    if (window.AudioSystem && typeof window.AudioSystem.playDryFire === 'function') {
      window.AudioSystem.playDryFire();
    }
  }

  function _playMetallicScrape() {
    // Reuse ricochet as a scraping proxy — many games do this
    if (window.AudioSystem && typeof window.AudioSystem.playRicochet === 'function') {
      window.AudioSystem.playRicochet();
    }
  }

  function _playFieldStripClunk() {
    if (window.AudioSystem && typeof window.AudioSystem.playImpact === 'function') {
      window.AudioSystem.playImpact();
    }
  }

  function _playRepairChime() {
    if (window.AudioSystem && typeof window.AudioSystem.playReadyChime === 'function') {
      window.AudioSystem.playReadyChime();
    }
  }

  /* ── Toast helper ───────────────────────────────────────── */
  function _toast(msg, color) {
    var el = document.getElementById('pickup-notif');
    if (!el) return;
    el.textContent = msg;
    el.style.color  = color || '#ffffff';
    el.style.display = 'block';
    el.style.opacity = '1';
    clearTimeout(el._wearTimer);
    el._wearTimer = setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () { el.style.display = 'none'; }, 400);
    }, 2200);
  }

  /* ── HUD creation ───────────────────────────────────────── */
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'weapon-wear-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:38px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'gap:2px',
      'z-index:200',
      'pointer-events:none',
      'font-family:monospace',
      'font-size:10px'
    ].join(';');

    _hudLabel = document.createElement('div');
    _hudLabel.style.cssText = 'color:#aaa;letter-spacing:1px;text-align:center;line-height:1';
    _hudLabel.textContent = '🔧 GUN: PRISTINE';

    var track = document.createElement('div');
    track.style.cssText = 'width:80px;height:4px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:2px;overflow:hidden';

    _hudBarFill = document.createElement('div');
    _hudBarFill.style.cssText = 'width:100%;height:100%;background:#22cc44;border-radius:2px;transition:width 0.3s,background 0.3s';

    track.appendChild(_hudBarFill);
    _hudEl.appendChild(_hudLabel);
    _hudEl.appendChild(track);
    document.body.appendChild(_hudEl);
  }

  /* ── HUD update ─────────────────────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    var band = _getBand();
    var pct  = Math.max(0, Math.min(100, _condition));

    _hudBarFill.style.width = pct + '%';

    var isCritical = (band.name === 'CRITICAL');
    var displayColor = (isCritical && !_blinkOn) ? 'rgba(255,0,0,0.2)' : band.color;
    _hudBarFill.style.background = displayColor;

    var labelColor = isCritical ? ((_blinkOn) ? '#ff4444' : '#aa2222') : band.color;
    _hudLabel.style.color = labelColor;
    _hudLabel.textContent = '🔧 GUN: ' + band.name;

    // Show jam state in HUD label
    if (_jammed) {
      _hudLabel.textContent = '🔧 GUN: JAMMED!';
      _hudLabel.style.color = '#ffcc00';
      _hudBarFill.style.background = '#ffcc00';
    } else if (_fieldStripping) {
      _hudLabel.textContent = '🔧 GUN: CLEANING...';
      _hudLabel.style.color = '#cccc00';
    } else if (_repairing) {
      var pctDone = Math.min(1, (CFG.REPAIR_DURATION - _repairTimer) / CFG.REPAIR_DURATION);
      _hudLabel.textContent = '🔧 GUN: REPAIRING ' + Math.round(pctDone * 100) + '%';
      _hudLabel.style.color = '#00ccff';
    }
  }

  /* ── Jam indicator (existing DOM element) ───────────────── */
  function _setJamHUD(visible) {
    var el = document.getElementById('jam-indicator');
    if (el) el.style.display = visible ? 'block' : 'none';
  }

  /* ── Maintenance indicator ──────────────────────────────── */
  function _setMaintenanceHUD(visible) {
    var el = document.getElementById('maintenance-indicator');
    if (el) el.style.display = visible ? 'block' : 'none';
  }

  /* ── Interaction prompt ─────────────────────────────────── */
  function _setPrompt(text) {
    var el = document.getElementById('interaction-prompt');
    if (!el) return;
    if (text) {
      el.textContent = text;
      el.style.display = 'block';
      _interactionPromptText = text;
    } else if (_interactionPromptText) {
      // Only clear if we set it
      el.style.display = 'none';
      el.textContent = '';
      _interactionPromptText = '';
    }
  }

  /* ── Workbench spawning ─────────────────────────────────── */
  function _spawnWorkbenches() {
    if (!_scene) return;
    if (typeof THREE === 'undefined') return;

    // Clear old workbenches
    for (var i = 0; i < _workbenches.length; i++) {
      _scene.remove(_workbenches[i]);
      if (_workbenches[i].geometry) _workbenches[i].geometry.dispose();
      if (_workbenches[i].material) _workbenches[i].material.dispose();
    }
    _workbenches = [];

    var count = CFG.NUM_WORKBENCHES;
    var geom  = new THREE.BoxGeometry(CFG.WORKBENCH_GEOM.w, CFG.WORKBENCH_GEOM.h, CFG.WORKBENCH_GEOM.d);
    var mat   = new THREE.MeshLambertMaterial({ color: 0x556655 }); // gray-olive

    // Simple placement: scatter around origin within a ring
    for (var n = 0; n < count; n++) {
      var angle = (n / count) * Math.PI * 2 + Math.PI * 0.25;
      var radius = 18 + n * 8;
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        Math.cos(angle) * radius,
        CFG.WORKBENCH_GEOM.h / 2 + 0.05,
        Math.sin(angle) * radius
      );
      mesh.castShadow    = true;
      mesh.receiveShadow = true;
      mesh.name = 'gun_workbench_' + n;
      mesh.userData.isGunWorkbench = true;
      _scene.add(mesh);
      _workbenches.push(mesh);
    }
  }

  /* ── Check proximity to workbench ───────────────────────── */
  function _checkWorkbenchProximity(playerPos) {
    if (!playerPos || _workbenches.length === 0) {
      _nearWorkbench = false;
      return;
    }
    var rangeSq = CFG.WORKBENCH_RANGE * CFG.WORKBENCH_RANGE;
    _nearWorkbench = false;
    for (var i = 0; i < _workbenches.length; i++) {
      var wb = _workbenches[i];
      var dx = wb.position.x - playerPos.x;
      var dz = wb.position.z - playerPos.z;
      if (dx * dx + dz * dz <= rangeSq) {
        _nearWorkbench = true;
        break;
      }
    }
  }

  /* ── Get player position from game globals ───────────────── */
  function _getPlayerPos() {
    if (window.GameManager && typeof window.GameManager.getCamera === 'function') {
      var cam = window.GameManager.getCamera();
      if (cam && cam.position) return cam.position;
    }
    if (window._playerPos) return window._playerPos;
    return null;
  }

  /* ── Public: init ───────────────────────────────────────── */
  function init(scene) {
    _scene = scene || null;
    _condition = 100;
    _jammed    = false;
    _clearingJam   = false;
    _fieldStripping = false;
    _repairing      = false;
    _nearWorkbench  = false;
    _repairTimer    = 0;
    _fieldStripTimer = 0;
    _jamClearTimer  = 0;
    _scrapeTimer    = 0;
    _blinkTimer     = 0;
    _blinkOn        = true;
    _lastRKeyTime   = 0;
    _syncGlobals();
    _createHUD();
    _updateHUD();
    if (_scene) _spawnWorkbenches();
    _bindKeys();
    console.log('[WeaponWear] init — condition 100%');
  }

  /* ── Public: reset (weapon switch) ─────────────────────── */
  function reset() {
    _condition = 100;
    _jammed    = false;
    _clearingJam   = false;
    _fieldStripping = false;
    _repairing      = false;
    _scrapeTimer    = 0;
    _jamClearTimer  = 0;
    _fieldStripTimer = 0;
    _setJamHUD(false);
    _setMaintenanceHUD(false);
    _setPrompt('');
    _syncGlobals();
    _updateHUD();
  }

  /* ── Public: repair (called by workbench interaction) ───── */
  function repair() {
    _condition = CFG.REPAIR_TARGET;
    _jammed    = false;
    _clearingJam   = false;
    _fieldStripping = false;
    _repairing      = false;
    _repairTimer    = 0;
    _setJamHUD(false);
    _setMaintenanceHUD(false);
    _syncGlobals();
    _updateHUD();
    _playRepairChime();
    _toast('WEAPON REPAIRED', '#44ff88');
    console.log('[WeaponWear] weapon repaired to ' + CFG.REPAIR_TARGET + '%');
  }

  /* ── Public: onShot ─────────────────────────────────────── */
  function onShot() {
    // If jammed or clearing, reject the shot
    if (_jammed || _clearingJam || _fieldStripping || _repairing) {
      if (_jammed) _playDryFire();
      return;
    }

    // Degrade condition
    var degradeRate = CFG.DEGRADE_PER_SHOT;
    if (window._isRaining) degradeRate *= CFG.RAIN_DEGRADE_MULT;
    _condition = Math.max(0, _condition - degradeRate);

    // CRITICAL misfire (intermittent — only sometimes fire+click)
    var band = _getBand();
    if (band.name === 'CRITICAL') {
      if (Math.random() < 0.12) {
        // Misfire: play dry click, suppress this shot
        _playDryFire();
        _syncGlobals();
        return;
      }
    }

    // Jam check
    var jamChance = band.jamChance;
    if (jamChance > 0 && Math.random() < jamChance) {
      _jammed = true;
      _setJamHUD(true);
      _syncGlobals();
      _updateHUD();
      _playDryFire();
      _toast('WEAPON JAMMED — Tap R to clear', '#ffcc00');
      return;
    }

    _syncGlobals();
    _updateHUD();
  }

  /* ── Key bindings ───────────────────────────────────────── */
  var _keysBound = false;
  function _bindKeys() {
    if (_keysBound) return;
    _keysBound = true;
    document.addEventListener('keydown', _onKeyDown, false);
  }

  function _onKeyDown(e) {
    var key = e.code || e.key;

    // R key — clear jam (single tap) OR field strip (double tap while worn/damaged)
    if (key === 'KeyR') {
      var now = performance.now ? performance.now() : Date.now();

      if (_jammed && !_clearingJam) {
        // Single R tap clears jam
        _clearingJam   = true;
        _jamClearTimer = CFG.JAM_CLEAR_DURATION;
        _setMaintenanceHUD(true);
        return;
      }

      // Double-tap R for field strip (condition < 50%, not jammed, not already stripping)
      if (!_jammed && !_fieldStripping && !_repairing && _condition < CFG.FIELD_STRIP_THRESHOLD) {
        var elapsed = (now - _lastRKeyTime) / 1000;
        if (elapsed < CFG.R_DBL_TAP_WINDOW) {
          // Second tap detected
          _fieldStripping  = true;
          _fieldStripTimer = CFG.FIELD_STRIP_DURATION;
          _setMaintenanceHUD(true);
          _playFieldStripClunk();
          _toast('FIELD STRIP — Quick clean in progress...', '#cccc00');
        }
        _lastRKeyTime = now;
        return;
      }

      _lastRKeyTime = now;
    }

    // F key (hold) — handled via _nearWorkbench check in update()
    // We track F being held to accumulate repair time
    if (key === 'KeyF') {
      if (_nearWorkbench && !_repairing && !_fieldStripping) {
        _repairing   = true;
        _repairTimer = CFG.REPAIR_DURATION;
        _setMaintenanceHUD(true);
        _toast('Hold F — Repairing weapon...', '#00ccff');
      }
    }
  }

  /* ── Public: update ─────────────────────────────────────── */
  function update(delta) {
    if (typeof delta !== 'number' || delta <= 0 || delta > 1) delta = 0.016;

    /* ── Jam clear animation countdown ─────────────── */
    if (_clearingJam) {
      _jamClearTimer -= delta;
      if (_jamClearTimer <= 0) {
        _clearingJam = false;
        _jammed      = false;
        _setJamHUD(false);
        _setMaintenanceHUD(false);
        _syncGlobals();
        _updateHUD();
        _toast('Jam cleared — reload to continue', '#88ff88');
      }
    }

    /* ── Field strip countdown ──────────────────────── */
    if (_fieldStripping) {
      _fieldStripTimer -= delta;
      if (_fieldStripTimer <= 0) {
        _fieldStripping = false;
        _condition = Math.min(100, _condition + CFG.FIELD_STRIP_BONUS);
        _setMaintenanceHUD(false);
        _syncGlobals();
        _updateHUD();
        _toast('+' + CFG.FIELD_STRIP_BONUS + '% condition — Field strip done', '#cccc44');
      }
    }

    /* ── Workbench repair countdown ─────────────────── */
    if (_repairing) {
      // Abort if player walks away
      _checkWorkbenchProximity(_getPlayerPos());
      if (!_nearWorkbench) {
        _repairing   = false;
        _repairTimer = 0;
        _setMaintenanceHUD(false);
        _toast('Repair aborted — moved away from workbench', '#ff8800');
      } else {
        _repairTimer -= delta;
        if (_repairTimer <= 0) {
          repair();
        }
      }
    }

    /* ── Workbench proximity prompt ─────────────────── */
    if (!_repairing) {
      _checkWorkbenchProximity(_getPlayerPos());
      if (_nearWorkbench) {
        _setPrompt('[Hold F] Repair weapon at workbench');
      } else if (_interactionPromptText.indexOf('Repair weapon') !== -1) {
        _setPrompt('');
      }
    }

    /* ── Metallic scraping sound when < 50% ─────────── */
    if (_condition < 50 && !_jammed && !_fieldStripping && !_repairing) {
      _scrapeTimer -= delta;
      if (_scrapeTimer <= 0) {
        _playMetallicScrape();
        _scrapeTimer = CFG.SCRAPE_INTERVAL;
      }
    } else {
      _scrapeTimer = 0;
    }

    /* ── CRITICAL blink timer ───────────────────────── */
    if (_getBand().name === 'CRITICAL' && !_jammed) {
      _blinkTimer -= delta;
      if (_blinkTimer <= 0) {
        _blinkOn    = !_blinkOn;
        _blinkTimer = CFG.HUD_BLINK_RATE;
        _updateHUD();
      }
    } else {
      _blinkOn    = true;
      _blinkTimer = 0;
    }

    _updateHUD();
  }

  /* ── Expose public API ───────────────────────────────────── */
  return {
    init:   init,
    update: update,
    onShot: onShot,
    repair: repair,
    reset:  reset
  };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail weapon-wear.js",_e&&_e.message); }
/* === radar-pulse.js === */
try {
;
// No let/const — only var throughout, IIFE pattern
window.RadarPulse = (function() {
  'use strict';

  // --- State ---
  var _scene = null;
  var _camera = null;
  var _audioCtx = null;

  var _MAX_CHARGES = 3;
  var _COOLDOWN_PER_CHARGE = 30; // seconds
  var _PULSE_DURATION = 1.5;     // seconds for ring to expand
  var _MAX_RADIUS = 40;
  var _REVEAL_DURATION = 4;      // seconds enemies stay revealed
  var _RING_COUNT = 3;           // rings per pulse
  var _RING_DELAY = 0.2;         // seconds between rings

  var _charges = 3;
  var _cooldownTimer = 0;        // countdown until next charge restore

  // Active rings: each {mesh, mat, age, delay}
  var _rings = [];

  // Revealed enemies: {enemy, timer, blipMesh}
  var _revealed = [];

  // HUD element
  var _hudEl = null;

  // Screen flash element
  var _flashEl = null;

  // --- Audio ---
  function _getAudio() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playSonarPing() {
    try {
      var ctx = _getAudio();
      // 3 pings, 0.3s apart
      for (var i = 0; i < 3; i++) {
        (function(offset) {
          var osc = ctx.createOscillator();
          var g = ctx.createGain();
          osc.connect(g);
          g.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime + offset);
          g.gain.setValueAtTime(0.18, ctx.currentTime + offset);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.4);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.4);
        })(i * 0.3);
      }
    } catch(e) {}
  }

  // --- HUD ---
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'radar-pulse-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00FF44',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'text-shadow:0 0 8px #00CC33',
      'z-index:1500',
      'pointer-events:none',
      'background:rgba(0,0,0,0.45)',
      'padding:3px 10px',
      'border-radius:4px',
      'border:1px solid #00FF4455',
      'letter-spacing:1px'
    ].join(';');
    _hudEl.textContent = '📡 RADAR \xD73';
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_charges >= _MAX_CHARGES) {
      _hudEl.textContent = '📡 RADAR \xD7' + _charges;
      _hudEl.style.color = '#00FF44';
    } else if (_charges > 0) {
      var cd = Math.ceil(_cooldownTimer);
      _hudEl.textContent = '📡 RADAR \xD7' + _charges + ' (' + cd + 's)';
      _hudEl.style.color = '#88FF99';
    } else {
      var cd2 = Math.ceil(_cooldownTimer);
      _hudEl.textContent = '📡 RADAR \xD70 (' + cd2 + 's)';
      _hudEl.style.color = '#336633';
    }
  }

  // --- Screen flash ---
  function _createFlash() {
    if (_flashEl) return;
    _flashEl = document.createElement('div');
    _flashEl.id = 'radar-pulse-flash';
    _flashEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:1499',
      'background:rgba(0,200,0,0)',
      'transition:background 0.08s ease-out'
    ].join(';');
    document.body.appendChild(_flashEl);
  }

  function _triggerFlash() {
    if (!_flashEl) return;
    _flashEl.style.background = 'rgba(0,200,0,0.15)';
    setTimeout(function() {
      if (_flashEl) _flashEl.style.background = 'rgba(0,200,0,0)';
    }, 140);
  }

  // --- Ring geometry ---
  function _createRing() {
    var sc = _scene || window._gameScene || window._scene;
    if (!sc) return null;
    var geo = new THREE.SphereGeometry(1, 12, 12);
    var wireGeo = new THREE.WireframeGeometry(geo);
    var mat = new THREE.LineBasicMaterial({
      color: 0x00FF44,
      transparent: true,
      opacity: 0.8
    });
    var mesh = new THREE.LineSegments(wireGeo, mat);
    var cam = _camera || window._camera;
    if (cam) {
      mesh.position.copy(cam.position);
    }
    mesh.scale.set(0.1, 0.1, 0.1);
    sc.add(mesh);
    return { mesh: mesh, mat: mat, age: 0, active: false };
  }

  function _removeRing(ring) {
    var sc = _scene || window._gameScene || window._scene;
    if (sc && ring.mesh) sc.remove(ring.mesh);
  }

  // --- Enemy reveal ---
  function _markRevealed(enemy) {
    // Check if already revealed — reset timer
    for (var i = 0; i < _revealed.length; i++) {
      if (_revealed[i].enemy === enemy) {
        _revealed[i].timer = _REVEAL_DURATION;
        return;
      }
    }
    var sc = _scene || window._gameScene || window._scene;
    var blipMesh = null;
    if (sc && enemy.mesh) {
      var blipGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      var blipMat = new THREE.MeshBasicMaterial({ color: 0x00FF44, transparent: true, opacity: 1.0 });
      blipMesh = new THREE.Mesh(blipGeo, blipMat);
      sc.add(blipMesh);
    }
    enemy._radarRevealed = true;
    enemy._minimapVisible = true;
    _revealed.push({ enemy: enemy, timer: _REVEAL_DURATION, blipMesh: blipMesh, blipMat: blipMesh ? blipMesh.material : null });

    // Register globally for minimap
    if (!window._radarRevealedEnemies) window._radarRevealedEnemies = [];
    window._radarRevealedEnemies.push(enemy);
  }

  function _unrevealEnemy(item) {
    item.enemy._radarRevealed = false;
    item.enemy._minimapVisible = false;
    var sc = _scene || window._gameScene || window._scene;
    if (sc && item.blipMesh) sc.remove(item.blipMesh);
    // Remove from global array
    if (window._radarRevealedEnemies) {
      for (var i = window._radarRevealedEnemies.length - 1; i >= 0; i--) {
        if (window._radarRevealedEnemies[i] === item.enemy) {
          window._radarRevealedEnemies.splice(i, 1);
        }
      }
    }
  }

  function _getEnemies() {
    // Try common global enemy arrays used in this game
    return window._enemies || window._activeEnemies || (window.Enemies && window.Enemies.getAll && window.Enemies.getAll()) || [];
  }

  function _checkEnemyDetection(pulseRadius, pulseOrigin) {
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      var pos = (e.mesh && e.mesh.position) || e.position;
      if (!pos) continue;
      var dx = pos.x - pulseOrigin.x;
      var dy = pos.y - pulseOrigin.y;
      var dz = pos.z - pulseOrigin.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= pulseRadius) {
        _markRevealed(e);
      }
    }
  }

  // --- Pulse trigger ---
  function pulse() {
    if (_charges <= 0) {
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('RADAR RECHARGING');
      return;
    }

    _charges--;
    window._pulseActive = true;

    // Start cooldown countdown for restoring one charge
    // Timer only counts when below max charges
    if (_cooldownTimer <= 0) {
      _cooldownTimer = _COOLDOWN_PER_CHARGE;
    }

    _playSonarPing();
    _triggerFlash();

    if (window.HUD && window.HUD.showToast) window.HUD.showToast('📡 RADAR PULSE');

    // Spawn 3 rings with staggered delays
    for (var i = 0; i < _RING_COUNT; i++) {
      (function(ringIndex) {
        var ring = _createRing();
        if (!ring) return;
        ring.delay = ringIndex * _RING_DELAY;
        ring.active = false; // wait until delay passes
        _rings.push(ring);
      })(i);
    }

    _updateHUD();
  }

  // --- Init ---
  function init(scene, camera) {
    _scene = scene || window._gameScene || window._scene;
    _camera = camera || window._camera;

    window._pulseActive = false;
    window._radarRevealedEnemies = [];

    _charges = _MAX_CHARGES;
    _cooldownTimer = 0;
    _rings = [];
    _revealed = [];

    _createHUD();
    _createFlash();
    _updateHUD();

    document.addEventListener('keydown', function(e) {
      if (window._menuOpen || window._isPaused || window._inMenu) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (e.ctrlKey && e.code === 'KeyP') {
        e.preventDefault();
        pulse();
      }
    });
  }

  // --- Update (call each frame with dt in seconds) ---
  function update(dt) {
    var time = Date.now() * 0.001;

    // Cooldown / charge restore
    if (_charges < _MAX_CHARGES && _cooldownTimer > 0) {
      _cooldownTimer -= dt;
      if (_cooldownTimer <= 0) {
        _charges++;
        if (_charges < _MAX_CHARGES) {
          // Start another cooldown cycle for the next missing charge
          _cooldownTimer = _COOLDOWN_PER_CHARGE;
        } else {
          _cooldownTimer = 0;
          window._pulseActive = false;
        }
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('📡 RADAR CHARGE READY');
      }
    }

    var cam = _camera || window._camera;
    var origin = cam ? cam.position : { x: 0, y: 0, z: 0 };

    // Update rings
    for (var i = _rings.length - 1; i >= 0; i--) {
      var ring = _rings[i];
      ring.age += dt;

      // Wait for stagger delay
      if (!ring.active) {
        if (ring.age >= ring.delay) {
          ring.active = true;
          ring.age = ring.age - ring.delay; // reset age to time since activation
        } else {
          continue;
        }
      }

      var progress = ring.age / _PULSE_DURATION; // 0..1
      if (progress >= 1.0) {
        _removeRing(ring);
        _rings.splice(i, 1);
        continue;
      }

      // Scale from 0.1 to _MAX_RADIUS
      var currentRadius = 0.1 + progress * (_MAX_RADIUS - 0.1);
      ring.mesh.scale.set(currentRadius, currentRadius, currentRadius);

      // Opacity fades from 0.8 to 0
      ring.mat.opacity = 0.8 * (1.0 - progress);

      // Detection sweep — check once per frame at current radius
      _checkEnemyDetection(currentRadius, origin);
    }

    // Update revealed enemies
    for (var j = _revealed.length - 1; j >= 0; j--) {
      var item = _revealed[j];
      item.timer -= dt;

      if (item.timer <= 0) {
        _unrevealEnemy(item);
        _revealed.splice(j, 1);
        continue;
      }

      // Update blip position above enemy
      if (item.blipMesh && item.enemy) {
        var epos = (item.enemy.mesh && item.enemy.mesh.position) || item.enemy.position;
        if (epos) {
          item.blipMesh.position.set(epos.x, epos.y + 2.2, epos.z);
          // Pulse blip opacity
          item.blipMesh.material.opacity = 0.5 + 0.5 * Math.sin(time * 8);
          // Spin slightly
          item.blipMesh.rotation.y += dt * 3;
        }
      }
    }

    _updateHUD();
  }

  // --- Reset ---
  function reset() {
    // Remove all rings
    for (var i = 0; i < _rings.length; i++) {
      _removeRing(_rings[i]);
    }
    _rings = [];

    // Unreveal all enemies
    for (var j = 0; j < _revealed.length; j++) {
      _unrevealEnemy(_revealed[j]);
    }
    _revealed = [];

    _charges = _MAX_CHARGES;
    _cooldownTimer = 0;
    window._pulseActive = false;
    window._radarRevealedEnemies = [];

    _updateHUD();
  }

  return { init: init, update: update, pulse: pulse, reset: reset };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail radar-pulse.js",_e&&_e.message); }
/* === kill-feed-events.js === */
try {
;
/* kill-feed-events.js — Enhanced military-style kill feed event log
 * Top-right corner, 8 events max, each fades after 4s.
 * All var, no let/const. IIFE pattern.
 */

window.KillFeedEvents = (function () {
  'use strict';

  /* ── Configuration ─────────────────────────────────────────── */
  var MAX_ENTRIES   = 8;
  var DISPLAY_MS    = 4000;    // base display time (ms)
  var SLIDE_MS      = 200;     // slide-in transition (ms)
  var FADE_AFTER_MS = 3500;    // when opacity begins fading
  var FADE_DUR_MS   = 500;     // opacity transition duration

  /* ── State ─────────────────────────────────────────────────── */
  var _container    = null;
  var _totalKills   = 0;       // for 5-kill divider
  var _stylesInjected = false;

  /* ── Default enabled flag ───────────────────────────────────── */
  if (typeof window._killFeedEnabled === 'undefined') {
    window._killFeedEnabled = true;
  }

  /* ── Weapon icon map ────────────────────────────────────────── */
  var WEAPON_ICONS = {
    knife:     '🔪',
    melee:     '🔪',
    bayonet:   '🔪',
    shovel:    '🔪',
    launcher:  '🚀',
    rpg:       '🚀',
    rocket:    '🚀',
    missile:   '🚀',
    stinger:   '🚀',
    grenade:   '💥',
    explosive: '💥',
    mortar:    '💥',
    c4:        '💥',
    claymore:  '💥',
    mine:      '💥',
    artillery: '💥',
    frag:      '💥',
    vehicle:   '🚗',
    tank:      '🚗',
    car:       '🚗',
    truck:     '🚗',
    drone:     '✈'
  };

  function _weaponIcon(weapon) {
    if (!weapon) return '🔫';
    var w = String(weapon).toLowerCase();
    if (WEAPON_ICONS[w]) return WEAPON_ICONS[w];
    for (var key in WEAPON_ICONS) {
      if (WEAPON_ICONS.hasOwnProperty(key) && w.indexOf(key) !== -1) {
        return WEAPON_ICONS[key];
      }
    }
    return '🔫';
  }

  /* ── Timestamp helper ───────────────────────────────────────── */
  function _timestamp() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    return '[' +
      (h < 10 ? '0' : '') + h + ':' +
      (m < 10 ? '0' : '') + m + ':' +
      (s < 10 ? '0' : '') + s + ']';
  }

  /* ── Inject stylesheet once ─────────────────────────────────── */
  function _injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    if (document.getElementById('kfe-style')) return;
    var st = document.createElement('style');
    st.id = 'kfe-style';
    st.textContent = [
      '@keyframes kfeSlideIn {',
      '  from { transform: translateX(100px); opacity: 0; }',
      '  to   { transform: translateX(0);     opacity: 1; }',
      '}',
      '@keyframes kfeBossFlash {',
      '  0%,100% { background: rgba(120,0,0,0.65); }',
      '  40%     { background: rgba(255,40,0,0.75); }',
      '}',
      '#kfe-container {',
      '  position: fixed;',
      '  top: 80px;',
      '  right: 15px;',
      '  width: 300px;',
      '  z-index: 203;',
      '  pointer-events: none;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 3px;',
      '}',
      '.kfe-entry {',
      '  background: rgba(0,0,0,0.60);',
      '  padding: 3px 8px;',
      '  font-family: monospace;',
      '  font-size: 11px;',
      '  border-radius: 3px;',
      '  color: #fff;',
      '  animation: kfeSlideIn ' + (SLIDE_MS / 1000) + 's ease-out;',
      '  transition: opacity ' + (FADE_DUR_MS / 1000) + 's;',
      '  overflow: hidden;',
      '  white-space: nowrap;',
      '  text-overflow: ellipsis;',
      '  line-height: 1.5;',
      '  border-left: 2px solid rgba(255,255,255,0.15);',
      '}',
      '.kfe-entry.kfe-fading {',
      '  opacity: 0;',
      '}',
      '.kfe-boss {',
      '  font-size: 13px;',
      '  font-weight: bold;',
      '  border-left: 3px solid #ff3333;',
      '  animation: kfeSlideIn ' + (SLIDE_MS / 1000) + 's ease-out, kfeBossFlash 0.6s ease-in-out 0.1s 3;',
      '}',
      '.kfe-divider {',
      '  text-align: center;',
      '  color: #888;',
      '  font-size: 10px;',
      '  letter-spacing: 2px;',
      '  background: rgba(0,0,0,0.4);',
      '  border-left: none;',
      '}',
      '.kfe-ts {',
      '  color: #555;',
      '  font-size: 10px;',
      '  margin-right: 4px;',
      '}',
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ── Get or create container ────────────────────────────────── */
  function _getContainer() {
    if (_container && _container.parentNode) return _container;
    _container = document.getElementById('kfe-container');
    if (!_container) {
      _container = document.createElement('div');
      _container.id = 'kfe-container';
      document.body.appendChild(_container);
    }
    return _container;
  }

  /* ── Trim to MAX_ENTRIES ────────────────────────────────────── */
  function _trim() {
    var c = _getContainer();
    while (c.children.length > MAX_ENTRIES) {
      c.removeChild(c.firstChild);
    }
  }

  /* ── Schedule fade + removal ────────────────────────────────── */
  function _scheduleRemove(el, duration) {
    var dur = duration || DISPLAY_MS;
    var fadeDelay = (dur <= FADE_DUR_MS) ? 0 : (dur - FADE_DUR_MS);
    setTimeout(function () {
      el.classList.add('kfe-fading');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, FADE_DUR_MS);
    }, fadeDelay);
  }

  /* ── Play confirm tick sound ────────────────────────────────── */
  function _playTick() {
    try {
      if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 50;
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // audio not available — silent fail
    }
  }

  /* ── Append a raw entry div ─────────────────────────────────── */
  function _append(html, extraClass, duration) {
    _injectStyles();
    if (!window._killFeedEnabled) return null;
    var c = _getContainer();
    var div = document.createElement('div');
    div.className = 'kfe-entry' + (extraClass ? ' ' + extraClass : '');
    div.innerHTML = html;
    c.appendChild(div);
    _trim();
    _scheduleRemove(div, duration || DISPLAY_MS);
    return div;
  }

  /* ── 5-kill divider logic ───────────────────────────────────── */
  function _checkMilestone(killCount) {
    if (killCount > 0 && killCount % 5 === 0) {
      var divHtml = '--- ' + killCount + ' KILLS ---';
      _append(divHtml, 'kfe-divider', DISPLAY_MS);
    }
  }

  /* ── Multi-kill label from streak ──────────────────────────── */
  function _multiKillLabel(streak) {
    if (streak >= 5) return '💀\xd7' + streak + ' MEGA KILL';
    if (streak === 4) return '💀\xd74 ULTRA KILL';
    if (streak === 3) return '💀\xd73 TRIPLE KILL';
    if (streak === 2) return '💀\xd72 DOUBLE KILL';
    return null;
  }

  /* ══════════════════════════════════════════════════════════════
     Public API
  ══════════════════════════════════════════════════════════════ */

  /**
   * init() — call once after DOM ready (auto-called on DOMContentLoaded too).
   */
  function init() {
    _injectStyles();
    _getContainer();
  }

  /**
   * update(delta) — called each frame from game loop (no-op for now; reserved).
   */
  function update(delta) {
    // no per-frame work needed; fade is CSS-driven
  }

  /**
   * addKill(type, weapon)
   *   type   — 'kill' | 'headshot' | 'boss' | 'friendly' | 'player_death' |
   *             'explosive' | 'vehicle' | 'multi'
   *   weapon — weapon id string (optional)
   */
  function addKill(type, weapon) {
    _injectStyles();
    if (!window._killFeedEnabled) return;

    var ts = _timestamp();
    var tsSpan = '<span class="kfe-ts">' + ts + '</span>';
    var icon = _weaponIcon(weapon);
    var streak = (typeof window._headshotStreak === 'number') ? window._headshotStreak : 0;
    var html, extraClass, duration;
    duration = DISPLAY_MS;

    if (type === 'headshot') {
      _totalKills++;
      html = tsSpan + '&#127919; <span style="color:#ffee00;font-weight:bold">HEADSHOT KILL</span>';
      extraClass = '';
      _playTick();
      _checkMilestone(_totalKills);

    } else if (type === 'boss') {
      html = tsSpan + '&#9760; <span style="color:#ff3333;font-weight:bold;font-size:13px">BOSS ELIMINATED</span>';
      extraClass = 'kfe-boss';
      duration = 8000;
      _playTick();

    } else if (type === 'friendly') {
      html = tsSpan + '&#9888; <span style="color:#ff8800;font-weight:bold">FRIENDLY FIRE</span>';
      extraClass = '';

    } else if (type === 'player_death') {
      html = tsSpan + '&#128128; <span style="color:#ff3333;font-weight:bold">PLAYER DOWN</span>';
      extraClass = '';

    } else if (type === 'explosive') {
      _totalKills++;
      html = tsSpan + '&#128165; <span style="color:#ff8800;font-weight:bold">FRAG KILL</span>';
      extraClass = '';
      _playTick();
      _checkMilestone(_totalKills);

    } else if (type === 'vehicle') {
      _totalKills++;
      html = tsSpan + '&#128663; <span style="color:#ffee00;font-weight:bold">VEHICLE DESTROYED</span>';
      extraClass = '';
      _playTick();
      _checkMilestone(_totalKills);

    } else if (type === 'multi') {
      var label = _multiKillLabel(streak) || ('&#128128;\xd7' + Math.max(streak, 2) + ' MULTI KILL');
      html = tsSpan + '<span style="color:#ffd700;font-weight:bold">' + label + '</span>';
      extraClass = '';
      _playTick();

    } else {
      /* default: standard kill */
      _totalKills++;
      var multiLabel = (streak >= 2) ? _multiKillLabel(streak) : null;
      if (multiLabel) {
        html = tsSpan + '<span style="color:#ffd700;font-weight:bold">' + multiLabel + '</span>';
      } else {
        html = tsSpan + icon + ' <span style="color:#44ff88;font-weight:bold">ENEMY ELIMINATED</span>';
      }
      extraClass = '';
      _playTick();
      _checkMilestone(_totalKills);
    }

    _append(html, extraClass, duration);
  }

  /**
   * addEvent(text, color, icon, duration)
   *   Generic event — usable by any system.
   */
  function addEvent(text, color, icon, duration) {
    _injectStyles();
    if (!window._killFeedEnabled) return;
    var ts = _timestamp();
    var tsSpan = '<span class="kfe-ts">' + ts + '</span>';
    var c = color || '#ffcc00';
    var ic = icon ? (icon + ' ') : '';
    var html = tsSpan + ic + '<span style="color:' + c + '">' + text + '</span>';
    _append(html, '', duration || DISPLAY_MS);
  }

  /**
   * reset() — clear all visible entries and reset kill counter.
   */
  function reset() {
    _totalKills = 0;
    var c = _getContainer();
    if (c) {
      while (c.firstChild) c.removeChild(c.firstChild);
    }
  }

  /* ── Hook window._onEnemyKilled (chain) ─────────────────────── */
  var _prevOnEnemyKilled = window._onEnemyKilled || null;
  window._onEnemyKilled = function (enemyType, weapon, isHeadshot) {
    // Call prior handler first
    if (typeof _prevOnEnemyKilled === 'function') {
      _prevOnEnemyKilled(enemyType, weapon, isHeadshot);
    }
    // Determine kill type
    if (isHeadshot) {
      addKill('headshot', weapon);
    } else if (enemyType && (String(enemyType).toUpperCase().indexOf('BOSS') !== -1)) {
      addKill('boss', weapon);
    } else if (weapon && (String(weapon).toLowerCase() === 'grenade' ||
                          String(weapon).toLowerCase() === 'explosive' ||
                          String(weapon).toLowerCase() === 'frag' ||
                          String(weapon).toLowerCase().indexOf('mortar') !== -1 ||
                          String(weapon).toLowerCase().indexOf('artillery') !== -1)) {
      addKill('explosive', weapon);
    } else if (weapon && (String(weapon).toLowerCase().indexOf('vehicle') !== -1 ||
                          String(weapon).toLowerCase().indexOf('tank') !== -1)) {
      addKill('vehicle', weapon);
    } else {
      addKill('kill', weapon);
    }
  };

  /* Built-in event helpers for external systems */
  window._kfeAddEvent = function (text, color, icon, duration) {
    addEvent(text, color, icon, duration);
  };

  /* Supply cache found */
  window._kfeSupplyFound = function () {
    addEvent('CACHE FOUND', '#4499ff', '&#128230;', DISPLAY_MS);
  };

  /* Player death */
  window._kfePlayerDeath = function () {
    addKill('player_death', null);
  };

  /* Friendly fire */
  window._kfeFriendlyFire = function () {
    addKill('friendly', null);
  };

  /* ── Auto-init when DOM is ready ─────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init: init, update: update, addKill: addKill, addEvent: addEvent, reset: reset };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail kill-feed-events.js",_e&&_e.message); }
