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
