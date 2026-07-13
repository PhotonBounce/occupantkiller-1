/**
 * weapon-skins.js — Cosmetic weapon skin & camo system with unlock progression
 *
 * Standalone module; does NOT modify weapons.js or game-manager.js.
 *
 * Integration point (weapons.js):
 *   createGunMesh() at line ~5127 already calls applySkinToMesh() on each
 *   freshly-built mesh. WeaponSkins.applyToMesh(mesh, weaponId) can be
 *   wired there by passing the weapon name string as weaponId, giving this
 *   module full control of the visual result without touching weapons.js.
 *
 * localStorage keys:
 *   okk_weapon_skins_v1          — { skinId: boolean, … }  (unlocked flags)
 *   okk_weapon_skin_selection_v1 — { weaponId: skinId, … } (per-weapon choice)
 */

window.WeaponSkins = (function () {

  // ── Skin definitions ──────────────────────────────────────────────────────
  var SKINS = {
    DEFAULT: { id: 'DEFAULT', name: 'Factory',       color: 0x2a2a2a, metalness: 0.5, roughness: 0.7, unlocked: true  },
    DESERT:  { id: 'DESERT',  name: 'Desert Tan',    color: 0xc8a96e, metalness: 0.3, roughness: 0.8, unlocked: false },
    ARCTIC:  { id: 'ARCTIC',  name: 'Arctic White',  color: 0xe8e8e8, metalness: 0.2, roughness: 0.6, unlocked: false },
    CAMO_UA: { id: 'CAMO_UA', name: 'UA Pixel Camo', color: 0x4a6e2a, metalness: 0.3, roughness: 0.9, unlocked: false },
    CAMO_RU: { id: 'CAMO_RU', name: 'Russian Flora', color: 0x3d5a1e, metalness: 0.3, roughness: 0.9, unlocked: false },
    GOLD:    { id: 'GOLD',    name: 'Gold Plated',   color: 0xffd700, metalness: 0.9, roughness: 0.2, unlocked: false },
    CARBON:  { id: 'CARBON',  name: 'Carbon Fiber',  color: 0x111111, metalness: 0.8, roughness: 0.3, unlocked: false },
  };

  // Human-readable unlock condition strings (shown in UI for locked skins)
  var UNLOCK_CONDS = {
    DEFAULT: 'FREE',
    DESERT:  'Score 25K',
    ARCTIC:  '10 Waves',
    CAMO_UA: '5 Levels',
    CAMO_RU: '50 Headshots',
    GOLD:    '20 Levels or 100K',
    CARBON:  'Unlock All',
  };

  var LS_UNLOCKS   = 'okk_weapon_skins_v1';
  var LS_SELECTION = 'okk_weapon_skin_selection_v1';

  // Internal state
  var _unlocked   = {};   // skinId → bool
  var _selection  = {};   // weaponId → skinId
  var _selectorVisible = false;
  var _currentWeaponId = '';
  var _selectorEl = null;
  var _toastTimeout = null;

  // ── Persistence helpers ────────────────────────────────────────────────────
  function _saveUnlocks() {
    try {
      var obj = {};
      for (var id in SKINS) {
        obj[id] = !!_unlocked[id];
      }
      localStorage.setItem(LS_UNLOCKS, JSON.stringify(obj));
    } catch (e) {}
  }

  function _loadUnlocks() {
    try {
      var raw = localStorage.getItem(LS_UNLOCKS);
      if (raw) {
        var parsed = JSON.parse(raw);
        for (var id in SKINS) {
          _unlocked[id] = !!parsed[id];
        }
      }
    } catch (e) {}
    // DEFAULT is always unlocked
    _unlocked['DEFAULT'] = true;
  }

  function _saveSelection() {
    try {
      localStorage.setItem(LS_SELECTION, JSON.stringify(_selection));
    } catch (e) {}
  }

  function _loadSelection() {
    try {
      var raw = localStorage.getItem(LS_SELECTION);
      if (raw) {
        _selection = JSON.parse(raw) || {};
      }
    } catch (e) {}
  }

  // ── Public: init ───────────────────────────────────────────────────────────
  function init() {
    _loadUnlocks();
    _loadSelection();
    _buildSelectorDOM();
    _hookTabKey();
  }

  // ── Public: getSkinForWeapon ───────────────────────────────────────────────
  function getSkinForWeapon(weaponId) {
    var skinId = _selection[weaponId] || 'DEFAULT';
    return SKINS[skinId] || SKINS['DEFAULT'];
  }

  // ── Public: unlockSkin ─────────────────────────────────────────────────────
  function unlockSkin(skinId) {
    if (!SKINS[skinId]) return false;
    if (_unlocked[skinId]) return false; // already unlocked — no toast
    _unlocked[skinId] = true;
    _saveUnlocks();
    _showToast('🎨 New skin unlocked: ' + SKINS[skinId].name);
    if (_selectorVisible) _refreshSelectorContent();
    return true;
  }

  // ── Public: applyToMesh ───────────────────────────────────────────────────
  function applyToMesh(mesh, weaponId) {
    if (!mesh) return;
    var skin = getSkinForWeapon(weaponId);
    if (!skin || skin.id === 'DEFAULT') return;
    mesh.traverse(function (child) {
      if (!child.material || !child.material.color) return;
      var mat = child.material;
      // Skip transparent parts (glass, scope lenses)
      if (mat.transparent && mat.opacity < 0.7) return;
      mat.color.setHex(skin.color);
      if (skin.metalness != null && 'metalness' in mat) mat.metalness = skin.metalness;
      if (skin.roughness != null && 'roughness' in mat) mat.roughness = skin.roughness;
    });
  }

  // ── Public: getUnlockedSkins ──────────────────────────────────────────────
  function getUnlockedSkins() {
    var result = [];
    for (var id in SKINS) {
      if (_unlocked[id]) result.push(SKINS[id]);
    }
    return result;
  }

  // ── Public: checkUnlocks ─────────────────────────────────────────────────
  // stats: { score, wavesCompleted, levelsCompleted, headshots }
  function checkUnlocks(stats) {
    if (!stats) return;
    var score    = stats.score           || 0;
    var waves    = stats.wavesCompleted  || 0;
    var levels   = stats.levelsCompleted || 0;
    var headshot = stats.headshots       || 0;

    if (score >= 25000)  unlockSkin('DESERT');
    if (waves >= 10)     unlockSkin('ARCTIC');
    if (levels >= 5)     unlockSkin('CAMO_UA');
    if (headshot >= 50)  unlockSkin('CAMO_RU');
    if (levels >= 20 || score >= 100000) unlockSkin('GOLD');

    // CARBON: unlocked when all others are unlocked
    var allOthers = ['DEFAULT','DESERT','ARCTIC','CAMO_UA','CAMO_RU','GOLD'];
    var allDone = true;
    for (var j = 0; j < allOthers.length; j++) {
      if (!_unlocked[allOthers[j]]) { allDone = false; break; }
    }
    if (allDone) unlockSkin('CARBON');
  }

  // ── Public: showSelector / hideSelector ───────────────────────────────────
  function showSelector(weaponId) {
    if (weaponId) _currentWeaponId = weaponId;
    if (!_currentWeaponId) {
      // Try to infer from WeaponSystem if available
      try {
        if (window.WeaponSystem && WeaponSystem.getWeaponId) {
          var idx = WeaponSystem.getCurrentWeaponIndex ? WeaponSystem.getCurrentWeaponIndex() : 0;
          _currentWeaponId = WeaponSystem.getWeaponId(idx) || 'AK-74M';
        }
      } catch (e) {}
      if (!_currentWeaponId) _currentWeaponId = 'AK-74M';
    }
    _selectorVisible = true;
    _refreshSelectorContent();
    if (_selectorEl) {
      _selectorEl.style.display = 'block';
    }
  }

  function hideSelector() {
    _selectorVisible = false;
    if (_selectorEl) {
      _selectorEl.style.display = 'none';
    }
  }

  // ── Toast notification ────────────────────────────────────────────────────
  function _showToast(msg) {
    var existing = document.getElementById('wsk-toast');
    if (existing) existing.remove();
    if (_toastTimeout) clearTimeout(_toastTimeout);

    var el = document.createElement('div');
    el.id = 'wsk-toast';
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed',
      'bottom:180px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)',
      'border:1px solid #ffd700',
      'color:#ffd700',
      'padding:8px 20px',
      'border-radius:6px',
      'font-size:13px',
      'font-family:monospace',
      'z-index:9000',
      'pointer-events:none',
      'text-align:center',
      'letter-spacing:1px',
      'box-shadow:0 0 12px rgba(255,215,0,0.3)',
    ].join(';');
    document.body.appendChild(el);

    _toastTimeout = setTimeout(function () {
      if (el.parentNode) el.remove();
    }, 3500);
  }

  // ── Selector DOM ──────────────────────────────────────────────────────────
  function _buildSelectorDOM() {
    if (_selectorEl) return; // already built

    _selectorEl = document.createElement('div');
    _selectorEl.id = 'wsk-selector';
    _selectorEl.style.cssText = [
      'display:none',
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(10,10,16,0.97)',
      'border:2px solid #4488ff',
      'border-radius:10px',
      'padding:18px 20px 14px 20px',
      'z-index:8000',
      'font-family:monospace',
      'color:#fff',
      'min-width:340px',
      'max-width:90vw',
      'box-shadow:0 0 30px rgba(68,136,255,0.25)',
      'pointer-events:auto',
    ].join(';');

    document.body.appendChild(_selectorEl);
    _refreshSelectorContent();
  }

  function _refreshSelectorContent() {
    if (!_selectorEl) return;

    var currentSkinId = _selection[_currentWeaponId] || 'DEFAULT';
    var currentSkin   = SKINS[currentSkinId] || SKINS['DEFAULT'];

    var skinOrder = ['DEFAULT','DESERT','ARCTIC','CAMO_UA','CAMO_RU','GOLD','CARBON'];
    var html = '';

    html += '<div style="text-align:center;color:#4488ff;font-size:14px;letter-spacing:2px;margin-bottom:10px">WEAPON APPEARANCE</div>';
    html += '<div style="text-align:center;color:#aaa;font-size:11px;margin-bottom:12px">';
    html += '<span style="color:#fff">' + (_currentWeaponId || '—') + '</span>';
    html += ' &nbsp;|&nbsp; Current: <span style="color:#ffcc44">' + currentSkin.name + '</span>';
    html += '</div>';

    // 3-column grid
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">';

    for (var si = 0; si < skinOrder.length; si++) {
      var sid  = skinOrder[si];
      var skin = SKINS[sid];
      if (!skin) continue;

      var isUnlocked = !!_unlocked[sid];
      var isActive   = (sid === currentSkinId);
      var hexColor   = '#' + ('000000' + skin.color.toString(16)).slice(-6);
      var condText   = UNLOCK_CONDS[sid] || '';
      var border     = isActive ? '2px solid #ffcc00' : '1px solid #333';
      var cursor     = isUnlocked ? 'pointer' : 'default';
      var opacity    = isUnlocked ? '1' : '0.65';

      html += '<div style="border:' + border + ';border-radius:6px;padding:8px 4px;text-align:center;background:rgba(255,255,255,0.04);cursor:' + cursor + ';opacity:' + opacity + '" ';
      if (isUnlocked) {
        html += 'data-skinid="' + sid + '" class="wsk-swatch"';
      }
      html += '>';

      // Color swatch square
      html += '<div style="width:32px;height:32px;background:' + hexColor + ';border-radius:4px;margin:0 auto 5px auto;border:1px solid rgba(255,255,255,0.15)"></div>';

      // Skin name
      html += '<div style="font-size:10px;color:' + (isActive ? '#ffcc44' : '#ccc') + ';margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + skin.name + '</div>';

      // Unlock status
      if (isUnlocked) {
        html += '<div style="font-size:9px;color:' + (isActive ? '#ffcc44' : '#44bb44') + '">' + (isActive ? 'EQUIPPED' : 'FREE') + '</div>';
      } else {
        html += '<div style="font-size:9px;color:#888">🔒 ' + condText + '</div>';
      }

      html += '</div>';
    }

    html += '</div>'; // end grid

    // Close button
    html += '<div style="text-align:center">';
    html += '<button id="wsk-close-btn" style="background:rgba(0,0,0,0.5);border:1px solid #555;color:#aaa;padding:5px 20px;border-radius:4px;cursor:pointer;font-family:monospace;font-size:11px">Close  [Esc]</button>';
    html += '</div>';

    _selectorEl.innerHTML = html;

    // Bind close button
    var closeBtn = document.getElementById('wsk-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { hideSelector(); });
    }

    // Bind swatch clicks
    var swatches = _selectorEl.querySelectorAll('.wsk-swatch');
    for (var wi = 0; wi < swatches.length; wi++) {
      (function (el) {
        el.addEventListener('click', function () {
          var sid = el.getAttribute('data-skinid');
          if (!sid || !_unlocked[sid]) return;
          _selection[_currentWeaponId] = sid;
          _saveSelection();
          // Apply to live mesh if WeaponSystem exposes it
          try {
            if (window.WeaponSystem && WeaponSystem.setWeaponSkin) {
              var idx = WeaponSystem.getCurrentWeaponIndex ? WeaponSystem.getCurrentWeaponIndex() : 0;
              WeaponSystem.setWeaponSkin(idx, sid);
            }
          } catch (e) {}
          _refreshSelectorContent();
        });
      })(swatches[wi]);
    }
  }

  // ── Tab / Esc key handler ─────────────────────────────────────────────────
  function _hookTabKey() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        // Only intercept Tab when no other modal/menu is open (check common overlays)
        var statsPanel = document.getElementById('stats-panel');
        var perksMenu  = document.getElementById('perks-menu');
        if ((statsPanel && statsPanel.style.display !== 'none') ||
            (perksMenu  && perksMenu.style.display  !== 'none')) {
          return; // let those panels handle Tab themselves
        }
        e.preventDefault();
        if (_selectorVisible) {
          hideSelector();
        } else {
          showSelector();
        }
      }
      if (e.key === 'Escape' && _selectorVisible) {
        hideSelector();
      }
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:             init,
    getSkinForWeapon: getSkinForWeapon,
    unlockSkin:       unlockSkin,
    applyToMesh:      applyToMesh,
    getUnlockedSkins: getUnlockedSkins,
    checkUnlocks:     checkUnlocks,
    showSelector:     showSelector,
    hideSelector:     hideSelector,
  };

})();
