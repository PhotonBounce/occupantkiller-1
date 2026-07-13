/**
 * magazine-system.js — Realistic Magazine Management for OccupantKiller
 *
 * Tracks individual magazines per weapon. Partial reloads return the
 * partially-spent mag to the stash rather than discarding remaining rounds.
 *
 * Integrates via global hooks:
 *   window._onReloadForMags(weaponType, currentAmmo)  → new loaded round count
 *   window._onAmmoPickupForMags(weaponType, amount)
 *   window._onWeaponSwitchForMags(weaponType)
 */
window.MagazineSystem = (function () {
  'use strict';

  // ── Per-weapon magazine capacity config ──────────────────────────────────
  var MAG_SIZE = {
    // Assault / NATO
    AK74:          30,
    AK12:          30,
    M4A1:          30,
    SCARH:         20,
    VSS:           20,
    // SMG
    MP5:           30,
    P90:           50,
    // LMG / HMG / Minigun
    RPK74:         45,
    PKM:          100,
    MG3:          120,
    DSHK:          50,
    MINIGUN:      500,
    GATLING:      200,
    // Sniper / DMR
    SVD:           10,
    BARRETTM82:    10,
    AXMC:           5,
    // Pistols
    MAKAROV:        8,
    GLOCK:         17,
    // AT / Rockets
    RPG7:           1,
    NLAW:           1,
    STUGNA:         1,
    JAVELIN:        1,
    IGLA:           1,
    AT4:            1,
    STINGER:        1,
    FLAMETHROWER:   1,
    // Grenade / Special
    GP25:           1,
    AGS17:          6,
    CLAYMORE:       1,
    SMOKE:          1,
    FLASHBANG:      1,
    CROSSBOW:       1,
    MOLOTOV:        1,
    // Shotguns
    DOUBLEBARREL:   2,
    KS23:           3,
  };

  // ── Initial reserve magazine counts on first equip ───────────────────────
  var INITIAL_MAGS = {
    AK74:          4,
    AK12:          4,
    M4A1:          4,
    SCARH:         4,
    VSS:           4,
    MP5:           4,
    P90:           4,
    RPK74:         3,
    PKM:           3,
    MG3:           2,
    DSHK:          2,
    MINIGUN:       2,
    GATLING:       2,
    SVD:           3,
    BARRETTM82:    3,
    AXMC:          3,
    MAKAROV:       4,
    GLOCK:         4,
    RPG7:          2,
    NLAW:          2,
    STUGNA:        2,
    JAVELIN:       2,
    IGLA:          2,
    AT4:           2,
    STINGER:       2,
    FLAMETHROWER:  2,
    GP25:          4,
    AGS17:         3,
    CLAYMORE:      3,
    SMOKE:         3,
    FLASHBANG:     3,
    CROSSBOW:      4,
    MOLOTOV:       4,
    DOUBLEBARREL:  4,
    KS23:          3,
  };

  // ── State ─────────────────────────────────────────────────────────────────
  // _mags[weaponId] = array of round counts, e.g. [30, 30, 17, 22]
  var _mags = {};

  // Track which weapons have been initialised
  var _inited = {};

  // Current weapon being tracked
  var _currentWeapon = null;

  // HUD element for magazine count display (injected once)
  var _magHudEl = null;
  var _magHudStylesInjected = false;

  // Toast de-duplicate timer
  var _lastToastKey = '';
  var _toastDebounce = null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _magSize(weaponType) {
    return MAG_SIZE[weaponType] || 30;
  }

  function _initialMagCount(weaponType) {
    return INITIAL_MAGS[weaponType] || 4;
  }

  /** Ensure the weapon has an entry in _mags.  Called on first equip. */
  function _ensureInit(weaponType) {
    if (_inited[weaponType]) return;
    _inited[weaponType] = true;
    var size = _magSize(weaponType);
    var count = _initialMagCount(weaponType);
    _mags[weaponType] = [];
    for (var i = 0; i < count; i++) {
      _mags[weaponType].push(size);
    }
  }

  /** Total rounds across all stash mags for a weapon */
  function _totalReserve(weaponType) {
    var stash = _mags[weaponType];
    if (!stash) return 0;
    var total = 0;
    for (var i = 0; i < stash.length; i++) {
      total += stash[i];
    }
    return total;
  }

  /** Show a toast via HUD if available, with deduplication */
  function _toast(msg, durationMs, color) {
    var key = msg;
    if (key === _lastToastKey) return;
    _lastToastKey = key;
    if (_toastDebounce) clearTimeout(_toastDebounce);
    _toastDebounce = setTimeout(function () { _lastToastKey = ''; }, durationMs || 2000);
    if (typeof window !== 'undefined' && window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg, durationMs || 2000, color || '#ffffff');
    }
  }

  // ── HUD injection ─────────────────────────────────────────────────────────
  function _injectMagHudStyles() {
    if (_magHudStylesInjected) return;
    _magHudStylesInjected = true;
    var st = document.createElement('style');
    st.id = 'mag-system-styles';
    st.textContent = [
      '#mag-count-hud { font-family:monospace; font-size:11px; letter-spacing:1px;',
      '  color:#44ff44; margin-top:3px; min-height:14px; pointer-events:none; }',
      '#mag-count-hud.mag-yellow { color:#ffcc44; }',
      '#mag-count-hud.mag-red    { color:#ff4444; }',
      '#mag-count-hud.mag-zero   { color:#ff2200; animation: magBlink 0.45s infinite; }',
      '@keyframes magBlink { 0%,100%{opacity:1} 50%{opacity:0.15} }',
    ].join('');
    document.head.appendChild(st);
  }

  function _ensureMagHud() {
    if (_magHudEl) return;
    if (typeof document === 'undefined') return;
    _injectMagHudStyles();
    // Attach below the ammo-reserve element if it exists
    var ammoSection = document.getElementById('ammo-section');
    if (!ammoSection) return;
    _magHudEl = document.createElement('div');
    _magHudEl.id = 'mag-count-hud';
    ammoSection.appendChild(_magHudEl);
  }

  /** Render magazine icons + count */
  function _updateMagHud(weaponType, currentAmmo) {
    _ensureMagHud();
    if (!_magHudEl) return;

    var stash = _mags[weaponType] || [];
    var size  = _magSize(weaponType);
    var count = stash.length;

    // Build pip string: ■ = full (>= magSize), □ = partial, up to 4 shown
    var pips = '';
    var shown = Math.min(count, 4);
    for (var i = 0; i < shown; i++) {
      pips += (stash[i] >= size) ? '■' : '□';
    }
    if (count > 4) pips += '+';

    var label = count + ' MAG' + (count !== 1 ? 'S' : '');
    _magHudEl.textContent = '[' + pips + '] ' + label;

    // Low-ammo indicator for current loaded rounds
    if (typeof currentAmmo === 'number' && currentAmmo < 5 && currentAmmo > 0) {
      _magHudEl.textContent += '  LOW AMMO';
    }

    // Colour coding
    _magHudEl.className = '';
    if (count === 0) {
      _magHudEl.classList.add('mag-zero');
    } else if (count === 1) {
      _magHudEl.classList.add('mag-red');
    } else if (count === 2) {
      _magHudEl.classList.add('mag-yellow');
    }
    // else default green via CSS
  }

  // ── Ammo scarcity warnings ────────────────────────────────────────────────
  function _checkScarcity(weaponType, currentAmmo) {
    var stash = _mags[weaponType] || [];
    var total = _totalReserve(weaponType) + (currentAmmo || 0);

    if (stash.length === 0) {
      _toast('WINCHESTER', 3000, '#ff2200');
    } else if (stash.length === 1) {
      _toast('LAST MAGAZINE', 2500, '#ff6600');
    } else if (total < 10) {
      _toast('AMMO CRITICAL', 2500, '#ff2200');
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * init() — call once at game start; sets up global hooks.
   */
  function init() {
    // Global reload hook
    window._onReloadForMags = function (weaponType, currentAmmo) {
      return MagazineSystem.onReload(weaponType, currentAmmo);
    };
    // Global ammo pickup hook
    window._onAmmoPickupForMags = function (weaponType, amount) {
      MagazineSystem.addAmmo(weaponType, amount);
    };
    // Global weapon switch hook
    window._onWeaponSwitchForMags = function (weaponType) {
      MagazineSystem.onWeaponSwitch(weaponType);
    };
  }

  /**
   * onWeaponSwitch(weaponType) — call when player equips a weapon.
   * Initialises the magazine stash if first time.
   */
  function onWeaponSwitch(weaponType) {
    if (!weaponType) return;
    _currentWeapon = weaponType;
    _ensureInit(weaponType);
    _updateMagHud(weaponType, null);
    _checkScarcity(weaponType, null);
  }

  /**
   * onReload(weaponType, currentAmmo) — called when player presses R.
   * Returns the new loaded round count (or -1 if no mags available).
   *
   * Side effects:
   *   • If currentAmmo > 0, pushes it back into the stash.
   *   • Picks the fullest mag from the stash.
   *   • Shows TACTICAL vs EMERGENCY RELOAD toast.
   *   • Adjusts reload time (returned via side-channel window._lastReloadTime).
   */
  function onReload(weaponType, currentAmmo) {
    if (!weaponType) return -1;
    _ensureInit(weaponType);

    var stash = _mags[weaponType];
    var isTactical = (typeof currentAmmo === 'number' && currentAmmo > 0);

    // Check any mags with rounds
    var hasMag = false;
    for (var i = 0; i < stash.length; i++) {
      if (stash[i] > 0) { hasMag = true; break; }
    }
    if (!hasMag) {
      _toast('WINCHESTER — no ammo remaining', 3000, '#ff2200');
      window._lastReloadTime = 0;
      return -1;
    }

    // Already at full mag — nothing to reload
    var size = _magSize(weaponType);
    if (isTactical && currentAmmo >= size) {
      // Magazine already full
      window._lastReloadTime = 0;
      return currentAmmo;
    }

    // Put current partial mag back in stash
    if (isTactical) {
      stash.push(currentAmmo);
    }

    // Sort stash descending by rounds, take the fullest
    stash.sort(function (a, b) { return b - a; });
    var newAmmo = stash.shift();

    // Toast + reload time
    if (isTactical) {
      _toast('TACTICAL RELOAD', 1400, '#44ffaa');
      window._lastReloadTime = 1.8;
    } else {
      _toast('EMERGENCY RELOAD', 1800, '#ffcc44');
      window._lastReloadTime = 2.5;
    }

    _updateMagHud(weaponType, newAmmo);
    _checkScarcity(weaponType, newAmmo);

    return newAmmo;
  }

  /**
   * getMagazines(weaponType) — returns a copy of the stash array.
   */
  function getMagazines(weaponType) {
    _ensureInit(weaponType);
    return (_mags[weaponType] || []).slice();
  }

  /**
   * getCurrentMag(weaponType) — returns round count of the fullest stash mag
   * without removing it (peek).
   */
  function getCurrentMag(weaponType) {
    _ensureInit(weaponType);
    var stash = (_mags[weaponType] || []).slice().sort(function (a, b) { return b - a; });
    return stash.length ? stash[0] : 0;
  }

  /**
   * addAmmo(weaponType, amount) — add rounds from a pickup.
   * Fills partial mags first, then creates new full mags.
   * Shows a toast describing how many rounds were added.
   */
  function addAmmo(weaponType, amount) {
    if (!weaponType || !amount || amount <= 0) return;
    _ensureInit(weaponType);

    var stash  = _mags[weaponType];
    var size   = _magSize(weaponType);
    var remaining = amount;
    var roundsAdded = 0;

    // Fill partial mags first (ascending order so smallest gets topped first)
    stash.sort(function (a, b) { return a - b; });
    for (var i = 0; i < stash.length && remaining > 0; i++) {
      if (stash[i] < size) {
        var space = size - stash[i];
        var fill  = Math.min(space, remaining);
        stash[i] += fill;
        remaining -= fill;
        roundsAdded += fill;
      }
    }

    // Create new full mags from leftover
    while (remaining >= size) {
      stash.push(size);
      remaining -= size;
      roundsAdded += size;
    }
    // Partial mag from leftover
    if (remaining > 0) {
      stash.push(remaining);
      roundsAdded += remaining;
      remaining = 0;
    }

    // Toast
    var fullMagsAdded = Math.floor(roundsAdded / size);
    var toastMsg = '+' + roundsAdded + ' rounds';
    if (fullMagsAdded > 0) {
      toastMsg += ' (' + fullMagsAdded + ' full mag' + (fullMagsAdded !== 1 ? 's' : '') + ')';
    }
    _toast(toastMsg, 1800, '#88ffcc');

    _updateMagHud(weaponType, null);
  }

  /**
   * reset() — clears all magazine state (call on game restart / new match).
   */
  function reset() {
    _mags    = {};
    _inited  = {};
    _currentWeapon = null;
    _lastToastKey  = '';
    if (_toastDebounce) { clearTimeout(_toastDebounce); _toastDebounce = null; }
    if (_magHudEl) { _magHudEl.textContent = ''; }
  }

  // ── Expose public API ─────────────────────────────────────────────────────
  return {
    init:           init,
    onReload:       onReload,
    onWeaponSwitch: onWeaponSwitch,
    getMagazines:   getMagazines,
    getCurrentMag:  getCurrentMag,
    addAmmo:        addAmmo,
    reset:          reset,
  };
})();
