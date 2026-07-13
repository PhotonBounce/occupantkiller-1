/* ───────────────────────────────────────────────────────────────────────────
   WEAPON-ATTACHMENTS.JS — Full weapon attachment system for OccupantKiller
   Ukraine conflict theme. Press K to open the attachment menu.
   Slots: optic / muzzle / grip / ammo. Persists to localStorage.
   Applies global bonus flags read by game-manager and weapons.js.
   ─────────────────────────────────────────────────────────────────────────── */
window.WeaponAttachments = (function () {
  'use strict';

  // ── Attachment definitions ─────────────────────────────────────────────────
  var ATTACHMENTS = {
    // Optics
    IRON_SIGHTS: { slot: 'optic',  name: 'Iron Sights',        bonus: { accuracy: 0 },                          unlockAt: 0,  icon: '🔭' },
    RED_DOT:     { slot: 'optic',  name: 'Red Dot Sight',       bonus: { accuracy: 10 },                         unlockAt: 5,  icon: '🔴' },
    HOLO_SIGHT:  { slot: 'optic',  name: 'Holographic Sight',   bonus: { accuracy: 15 },                         unlockAt: 15, icon: '⊕'  },
    ACOG_4X:     { slot: 'optic',  name: 'ACOG 4× Scope',       bonus: { accuracy: 25, range: 20 },              unlockAt: 30, icon: '🔭' },
    SNIPER_10X:  { slot: 'optic',  name: '10× Sniper Scope',    bonus: { accuracy: 40, range: 50 },              unlockAt: 60, icon: '🎯' },
    // Muzzle
    NO_MUZZLE:   { slot: 'muzzle', name: 'No Muzzle',           bonus: {},                                       unlockAt: 0,  icon: '🔫' },
    FLASH_HIDER: { slot: 'muzzle', name: 'Flash Hider',         bonus: { stealth: 10 },                          unlockAt: 10, icon: '💥' },
    COMPENSATOR: { slot: 'muzzle', name: 'Compensator',         bonus: { recoil: -15 },                          unlockAt: 20, icon: '⚙'  },
    SUPPRESSOR:  { slot: 'muzzle', name: 'Suppressor',          bonus: { stealth: 40, recoil: -5, damage: -5 },  unlockAt: 40, icon: '🔇' },
    MUZZLE_BRAKE:{ slot: 'muzzle', name: 'Muzzle Brake',        bonus: { recoil: -25 },                          unlockAt: 35, icon: '⚙'  },
    // Grip
    NO_GRIP:        { slot: 'grip', name: 'No Grip',            bonus: {},                                       unlockAt: 0,  icon: '🤜' },
    VERTICAL_GRIP:  { slot: 'grip', name: 'Vertical Grip',      bonus: { recoil: -10 },                          unlockAt: 8,  icon: '|'  },
    ANGLED_GRIP:    { slot: 'grip', name: 'Angled Foregrip',    bonus: { recoil: -10, accuracy: 5 },             unlockAt: 18, icon: '/'  },
    BIPOD:          { slot: 'grip', name: 'Bipod',              bonus: { accuracy: 30, speed: -5 },              unlockAt: 25, icon: '⊥'  },
    // Ammunition
    STANDARD_AMMO: { slot: 'ammo', name: 'Standard Ammo',       bonus: {},                                       unlockAt: 0,  icon: '🟡' },
    AP_ROUNDS:     { slot: 'ammo', name: 'AP Rounds',           bonus: { armorPen: 50 },                         unlockAt: 20, icon: '🔵' },
    HP_ROUNDS:     { slot: 'ammo', name: 'Hollow Point',        bonus: { damage: 15, armorPen: -30 },            unlockAt: 15, icon: '🔴' },
    TRACER_AMMO:   { slot: 'ammo', name: 'Tracer Rounds',       bonus: { accuracy: 5 },                          unlockAt: 5,  icon: '✨' }
  };

  // ── Slot defaults ──────────────────────────────────────────────────────────
  var SLOT_DEFAULTS = {
    optic:  'IRON_SIGHTS',
    muzzle: 'NO_MUZZLE',
    grip:   'NO_GRIP',
    ammo:   'STANDARD_AMMO'
  };

  var SLOTS = ['optic', 'muzzle', 'grip', 'ammo'];
  var SLOT_LABELS = { optic: 'OPTIC', muzzle: 'MUZZLE', grip: 'GRIP', ammo: 'AMMO' };

  // ── State ──────────────────────────────────────────────────────────────────
  var _STORAGE_KEY = 'okk_attachments_v1';
  var _menuVisible = false;
  var _overlay = null;
  var _selectedWeaponId = null;
  var _selectedAttachKey = null;   // key in ATTACHMENTS, for preview
  var _previewEl = null;
  var _weaponListEl = null;
  var _slotPanelsEl = null;

  // window._weaponAttachmentState = { [weaponId]: { optic, muzzle, grip, ammo } }
  window._weaponAttachmentState = window._weaponAttachmentState || {};

  // ── Global bonus flags (read by game engine) ───────────────────────────────
  window._attachmentAccuracyBonus  = 0;
  window._attachmentRecoilBonus    = 0;
  window._attachmentStealth        = 0;
  window._attachmentDamageBonus    = 0;
  window._suppressorActive         = false;

  // ── Persistence ────────────────────────────────────────────────────────────
  function _load() {
    try {
      var raw = localStorage.getItem(_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          window._weaponAttachmentState = parsed;
        }
      }
    } catch (e) {}
  }

  function _save() {
    try {
      localStorage.setItem(_STORAGE_KEY, JSON.stringify(window._weaponAttachmentState));
    } catch (e) {}
  }

  // ── Get attachment state for a weapon, with defaults ───────────────────────
  function _getStateFor(weaponId) {
    if (!window._weaponAttachmentState[weaponId]) {
      window._weaponAttachmentState[weaponId] = {
        optic:  SLOT_DEFAULTS.optic,
        muzzle: SLOT_DEFAULTS.muzzle,
        grip:   SLOT_DEFAULTS.grip,
        ammo:   SLOT_DEFAULTS.ammo
      };
    }
    return window._weaponAttachmentState[weaponId];
  }

  // ── Compute and apply global bonuses for the active weapon ────────────────
  function _updateGlobals(weaponId) {
    var id = weaponId || _getActiveWeaponId();
    var state = _getStateFor(id);
    var totalAccuracy  = 0;
    var totalRecoil    = 0;
    var totalStealth   = 0;
    var totalDamage    = 0;
    var hasSuppressor  = false;

    for (var s = 0; s < SLOTS.length; s++) {
      var slot = SLOTS[s];
      var attachKey = state[slot];
      if (!attachKey || !ATTACHMENTS[attachKey]) continue;
      var bonus = ATTACHMENTS[attachKey].bonus;
      if (bonus.accuracy)  totalAccuracy  += bonus.accuracy;
      if (bonus.recoil)    totalRecoil    += bonus.recoil;
      if (bonus.stealth)   totalStealth   += bonus.stealth;
      if (bonus.damage)    totalDamage    += bonus.damage;
      if (attachKey === 'SUPPRESSOR') hasSuppressor = true;
    }

    window._attachmentAccuracyBonus = totalAccuracy;
    window._attachmentRecoilBonus   = totalRecoil;
    window._attachmentStealth       = totalStealth;
    window._attachmentDamageBonus   = totalDamage;
    window._suppressorActive        = hasSuppressor;

    _updateViewmodel(state);
  }

  // ── Get the currently active weapon id from the game ─────────────────────
  function _getActiveWeaponId() {
    if (window.Weapons && typeof window.Weapons.getCurrentWeapon === 'function') {
      var cw = window.Weapons.getCurrentWeapon();
      if (cw && cw.id) return cw.id;
    }
    // Fallback: check if there's a selectedWeapon global
    if (window._selectedWeaponId) return window._selectedWeaponId;
    return 'AK74';
  }

  // ── Viewmodel visual effects ──────────────────────────────────────────────
  var _suppressorMesh  = null;
  var _opticMesh       = null;

  function _updateViewmodel(state) {
    var vm = window._weaponViewmodel;
    if (!vm || typeof THREE === 'undefined') return;

    // ── Suppressor cylinder ────────────────────────────────────────────────
    if (state.muzzle === 'SUPPRESSOR') {
      if (!_suppressorMesh) {
        var geo = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 12);
        var mat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        _suppressorMesh = new THREE.Mesh(geo, mat);
        _suppressorMesh.name = '__wa_suppressor';
        _suppressorMesh.rotation.x = Math.PI / 2;
      }
      // Attach at barrel tip (forward along Z)
      _suppressorMesh.position.set(0, -0.02, 0.36);
      if (!vm.getObjectByName('__wa_suppressor')) {
        vm.add(_suppressorMesh);
      }
    } else {
      if (_suppressorMesh && _suppressorMesh.parent) {
        _suppressorMesh.parent.remove(_suppressorMesh);
      }
      _suppressorMesh = null;
    }

    // ── Optic enlargement for ACOG / SNIPER ───────────────────────────────
    var opticKey = state.optic;
    var needsLargeOptic = (opticKey === 'ACOG_4X' || opticKey === 'SNIPER_10X');
    if (needsLargeOptic) {
      if (!_opticMesh) {
        var oGeo = new THREE.BoxGeometry(0.045, 0.045, 0.12);
        var oMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        _opticMesh = new THREE.Mesh(oGeo, oMat);
        _opticMesh.name = '__wa_optic';
        // Lens tint
        var lGeo = new THREE.CircleGeometry(0.018, 16);
        var lMat = new THREE.MeshLambertMaterial({ color: 0x004488, transparent: true, opacity: 0.7 });
        var lens  = new THREE.Mesh(lGeo, lMat);
        lens.position.set(0, 0, 0.062);
        _opticMesh.add(lens);
      }
      // Slightly larger for 10x
      var s2 = (opticKey === 'SNIPER_10X') ? 1.4 : 1.0;
      _opticMesh.scale.set(s2, s2, s2);
      _opticMesh.position.set(0, 0.055, 0.05);
      if (!vm.getObjectByName('__wa_optic')) {
        vm.add(_opticMesh);
      }
    } else {
      if (_opticMesh && _opticMesh.parent) {
        _opticMesh.parent.remove(_opticMesh);
      }
      _opticMesh = null;
    }
  }

  // ── Player level helper ────────────────────────────────────────────────────
  function _getPlayerLevel() {
    // game-manager stores level on player object; try various paths
    if (window._player && typeof window._player.level === 'number') return window._player.level;
    // Progression module total XP -> level approximation
    if (window.Progression && typeof window.Progression.getLevel === 'function') {
      return window.Progression.getLevel();
    }
    // Fallback to reading kills (rough proxy)
    if (window._player && typeof window._player.kills === 'number') {
      return Math.floor(window._player.kills / 5) + 1;
    }
    return 99; // permissive default
  }

  // ── Attachment menu DOM ────────────────────────────────────────────────────
  function _ensureMenu() {
    if (_overlay && document.body.contains(_overlay)) return;
    _overlay = document.createElement('div');
    _overlay.id = 'attachmentMenu';
    _overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9800',
      'background:rgba(0,18,0,0.96)',
      'display:none', 'flex-direction:column',
      'font-family:monospace',
      'color:#aaffaa',
      'overflow:hidden',
      'user-select:none'
    ].join(';');

    // ── Header bar ──────────────────────────────────────────────────────────
    var header = document.createElement('div');
    header.style.cssText = [
      'background:#0a1f0a',
      'border-bottom:2px solid #2a6a2a',
      'padding:10px 20px',
      'display:flex',
      'align-items:center',
      'gap:20px'
    ].join(';');
    header.innerHTML = [
      '<span style="font-size:20px;font-weight:bold;letter-spacing:3px;color:#55ff55">',
      '[ WEAPON MODIFICATION SYSTEM ]',
      '</span>',
      '<span style="font-size:12px;color:#55aa55;margin-left:auto">',
      'K — CLOSE &nbsp;|&nbsp; CLICK TO SELECT',
      '</span>'
    ].join('');
    _overlay.appendChild(header);

    // ── Body row ────────────────────────────────────────────────────────────
    var body = document.createElement('div');
    body.style.cssText = 'display:flex;flex:1;overflow:hidden;';
    _overlay.appendChild(body);

    // Left: weapon list
    _weaponListEl = document.createElement('div');
    _weaponListEl.id = 'wa-weapon-list';
    _weaponListEl.style.cssText = [
      'width:220px', 'border-right:2px solid #2a6a2a',
      'overflow-y:auto', 'padding:8px 0',
      'background:#061206'
    ].join(';');
    body.appendChild(_weaponListEl);

    // Center: slot columns
    _slotPanelsEl = document.createElement('div');
    _slotPanelsEl.id = 'wa-slot-panels';
    _slotPanelsEl.style.cssText = [
      'flex:1', 'display:flex',
      'padding:10px', 'gap:10px',
      'overflow-x:auto', 'overflow-y:auto'
    ].join(';');
    body.appendChild(_slotPanelsEl);

    // Right: stat preview
    _previewEl = document.createElement('div');
    _previewEl.id = 'wa-preview';
    _previewEl.style.cssText = [
      'width:240px', 'border-left:2px solid #2a6a2a',
      'padding:12px', 'overflow-y:auto',
      'background:#061206'
    ].join(';');
    _previewEl.innerHTML = '<div style="color:#557755;text-align:center;padding-top:40px">Select an attachment<br>to preview stats</div>';
    body.appendChild(_previewEl);

    document.body.appendChild(_overlay);
  }

  // ── Get weapon list from window.WEAPONS or weapons module ─────────────────
  function _getWeaponList() {
    // Preferred: window.WEAPONS array
    if (window.WEAPONS && Array.isArray(window.WEAPONS)) return window.WEAPONS;
    // Try Weapons module
    if (window.Weapons && typeof window.Weapons.getList === 'function') {
      return window.Weapons.getList();
    }
    if (window.Weapons && typeof window.Weapons.getAll === 'function') {
      return window.Weapons.getAll();
    }
    // Build a minimal list from known IDs
    return [
      { id: 'MAKAROV',     name: 'Makarov PM' },
      { id: 'AK74',        name: 'AK-74M' },
      { id: 'RPK74',       name: 'RPK-74' },
      { id: 'SVD',         name: 'SVD Dragunov' },
      { id: 'PKM',         name: 'PKM' },
      { id: 'M4A1',        name: 'M4A1' },
      { id: 'MP5',         name: 'MP5 SMG' },
      { id: 'SCARH',       name: 'FN SCAR-H' },
      { id: 'BARRETTM82',  name: 'Barrett M82' },
      { id: 'CROSSBOW',    name: 'Tactical Crossbow' },
      { id: 'MG3',         name: 'MG3 Machine Gun' },
      { id: 'GATLING',     name: 'Gatling Machine Gun' },
      { id: 'MINIGUN',     name: 'M134 Minigun' },
      { id: 'DOUBLEBARREL',name: 'IZH-43 Shotgun' }
    ];
  }

  // ── Render weapon list panel ───────────────────────────────────────────────
  function _renderWeaponList() {
    _weaponListEl.innerHTML = '';
    var label = document.createElement('div');
    label.style.cssText = 'color:#337733;font-size:10px;letter-spacing:2px;padding:4px 10px 8px;border-bottom:1px solid #1a3a1a;';
    label.textContent = '// WEAPONS';
    _weaponListEl.appendChild(label);

    var weapons = _getWeaponList();
    // Filter out non-gun types for attachment purposes
    var skip = { MELEE: 1, MINE: 1, SMOKE: 1 };
    for (var w = 0; w < weapons.length; w++) {
      var wp = weapons[w];
      if (skip[wp.type]) continue;
      (function (wpObj) {
        var item = document.createElement('div');
        var isSelected = (_selectedWeaponId === wpObj.id);
        item.style.cssText = [
          'padding:8px 12px',
          'cursor:pointer',
          'border-bottom:1px solid #0e2a0e',
          'font-size:12px',
          'transition:background 0.1s',
          isSelected ? 'background:#0d2f0d;color:#88ff88;border-left:3px solid #44cc44;' : 'color:#66aa66;border-left:3px solid transparent;'
        ].join(';');
        item.textContent = wpObj.name || wpObj.id;
        item.addEventListener('mouseover', function () {
          if (_selectedWeaponId !== wpObj.id) item.style.background = '#0a230a';
        });
        item.addEventListener('mouseout', function () {
          if (_selectedWeaponId !== wpObj.id) item.style.background = '';
        });
        item.addEventListener('click', function () {
          _selectedWeaponId = wpObj.id;
          _selectedAttachKey = null;
          _renderWeaponList();
          _renderSlotPanels();
          _renderPreview(null);
        });
        _weaponListEl.appendChild(item);
      })(wp);
    }
  }

  // ── Render center slot columns ─────────────────────────────────────────────
  function _renderSlotPanels() {
    _slotPanelsEl.innerHTML = '';
    if (!_selectedWeaponId) {
      _slotPanelsEl.innerHTML = '<div style="color:#335533;padding:30px;font-size:13px;">Select a weapon from the left panel.</div>';
      return;
    }
    var state = _getStateFor(_selectedWeaponId);
    var playerLevel = _getPlayerLevel();

    for (var si = 0; si < SLOTS.length; si++) {
      var slot = SLOTS[si];
      (function (slotName) {
        var col = document.createElement('div');
        col.style.cssText = [
          'min-width:160px', 'flex:1',
          'border:1px solid #1e4a1e',
          'border-radius:4px', 'overflow:hidden',
          'background:#051505',
          'display:flex', 'flex-direction:column'
        ].join(';');

        var slotHeader = document.createElement('div');
        slotHeader.style.cssText = [
          'background:#0c2e0c',
          'padding:6px 10px',
          'font-size:11px',
          'letter-spacing:3px',
          'color:#66cc66',
          'border-bottom:1px solid #1e4a1e',
          'text-align:center',
          'font-weight:bold'
        ].join(';');
        slotHeader.textContent = SLOT_LABELS[slotName];
        col.appendChild(slotHeader);

        // Items for this slot
        var keys = Object.keys(ATTACHMENTS);
        for (var ki = 0; ki < keys.length; ki++) {
          var key = keys[ki];
          var att = ATTACHMENTS[key];
          if (att.slot !== slotName) continue;
          (function (attachKey, attDef) {
            var isEquipped  = (state[slotName] === attachKey);
            var locked      = (playerLevel < attDef.unlockAt);
            var isSelected  = (_selectedAttachKey === attachKey);

            var row = document.createElement('div');
            row.style.cssText = [
              'padding:7px 10px',
              'cursor:' + (locked ? 'not-allowed' : 'pointer'),
              'border-bottom:1px solid #0c250c',
              'font-size:12px',
              'display:flex', 'align-items:center', 'gap:6px',
              locked ? 'opacity:0.4;' : '',
              isEquipped ? 'background:#0e3a0e;border-left:3px solid #44ff44;' : 'border-left:3px solid transparent;',
              isSelected && !isEquipped ? 'background:#102a10;' : ''
            ].join(';');

            var iconSpan = document.createElement('span');
            iconSpan.textContent = attDef.icon;
            iconSpan.style.fontSize = '14px';

            var nameSpan = document.createElement('span');
            nameSpan.style.cssText = 'flex:1;color:' + (isEquipped ? '#88ff88' : locked ? '#446644' : '#77aa77') + ';';
            nameSpan.textContent = attDef.name;

            var badge = document.createElement('span');
            badge.style.fontSize = '10px';
            if (locked) {
              badge.style.color = '#335533';
              badge.textContent = 'LVL ' + attDef.unlockAt;
            } else if (isEquipped) {
              badge.style.color = '#44ff44';
              badge.textContent = 'EQ';
            } else {
              badge.textContent = '';
            }

            row.appendChild(iconSpan);
            row.appendChild(nameSpan);
            row.appendChild(badge);

            if (!locked) {
              row.addEventListener('mouseover', function () {
                _selectedAttachKey = attachKey;
                _renderPreview(attachKey);
                if (!isEquipped) row.style.background = '#0d280d';
              });
              row.addEventListener('mouseout', function () {
                if (!isEquipped) row.style.background = '';
              });
              row.addEventListener('click', function () {
                applyAttachment(_selectedWeaponId, slotName, attachKey);
                _renderSlotPanels();
                _renderPreview(attachKey);
              });
            }

            col.appendChild(row);
          })(key, att);
        }

        _slotPanelsEl.appendChild(col);
      })(slot);
    }
  }

  // ── Compute aggregate stat bonuses for a weapon's attachment loadout ───────
  function _computeTotals(weaponId, overrideSlot, overrideKey) {
    var state = _getStateFor(weaponId);
    var totals = { accuracy: 0, recoil: 0, stealth: 0, damage: 0, armorPen: 0, range: 0, speed: 0 };

    for (var s2 = 0; s2 < SLOTS.length; s2++) {
      var sl = SLOTS[s2];
      var key = (overrideSlot === sl && overrideKey) ? overrideKey : state[sl];
      if (!key || !ATTACHMENTS[key]) continue;
      var bonus = ATTACHMENTS[key].bonus;
      if (bonus.accuracy)  totals.accuracy  += bonus.accuracy;
      if (bonus.recoil)    totals.recoil    += bonus.recoil;
      if (bonus.stealth)   totals.stealth   += bonus.stealth;
      if (bonus.damage)    totals.damage    += bonus.damage;
      if (bonus.armorPen)  totals.armorPen  += bonus.armorPen;
      if (bonus.range)     totals.range     += bonus.range;
      if (bonus.speed)     totals.speed     += bonus.speed;
    }
    return totals;
  }

  // ── Render right preview panel ─────────────────────────────────────────────
  function _renderPreview(attachKey) {
    if (!_previewEl) return;
    if (!attachKey || !ATTACHMENTS[attachKey] || !_selectedWeaponId) {
      _previewEl.innerHTML = '<div style="color:#446644;text-align:center;padding-top:40px;font-size:12px;">Hover an attachment<br>to preview stats</div>';
      return;
    }

    var att         = ATTACHMENTS[attachKey];
    var currentTotals  = _computeTotals(_selectedWeaponId, null, null);
    var previewTotals  = _computeTotals(_selectedWeaponId, att.slot, attachKey);

    var statKeys = ['accuracy', 'recoil', 'stealth', 'damage', 'armorPen', 'range', 'speed'];
    var statLabels = {
      accuracy: 'Accuracy', recoil: 'Recoil Mod', stealth: 'Stealth',
      damage: 'Damage Mod', armorPen: 'Armor Pen', range: 'Range', speed: 'Speed Mod'
    };

    var html = [
      '<div style="border-bottom:1px solid #1e4a1e;padding-bottom:8px;margin-bottom:10px;">',
      '  <div style="font-size:16px">' + att.icon + '</div>',
      '  <div style="font-size:13px;font-weight:bold;color:#88ff88;margin-top:4px;">' + att.name + '</div>',
      '  <div style="font-size:10px;color:#446644;margin-top:2px;">SLOT: ' + att.slot.toUpperCase() + '</div>',
      '  <div style="font-size:10px;color:#335533;margin-top:2px;">',
      att.unlockAt > 0 ? ('UNLOCK: LVL ' + att.unlockAt) : 'ALWAYS AVAILABLE',
      '  </div>',
      '</div>',
      '<div style="font-size:10px;color:#446644;letter-spacing:2px;margin-bottom:6px;">// STAT COMPARISON</div>',
      '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
    ];

    var anyDiff = false;
    for (var k = 0; k < statKeys.length; k++) {
      var sk   = statKeys[k];
      var cur  = currentTotals[sk]  || 0;
      var nxt  = previewTotals[sk]  || 0;
      var diff = nxt - cur;
      if (cur === 0 && nxt === 0) continue;

      var diffStr  = '';
      var diffColor = '#aaaaaa';
      if (diff > 0) {
        diffStr  = '+' + diff;
        diffColor = '#44ff44';
        anyDiff = true;
      } else if (diff < 0) {
        diffStr  = String(diff);
        // For recoil, negative is good; for others negative is bad
        diffColor = (sk === 'recoil' || sk === 'speed') ? '#44ff44' : '#ff4444';
        anyDiff = true;
      }

      html.push(
        '<tr style="border-bottom:1px solid #0c250c">',
        '  <td style="padding:4px 6px;color:#558855;">' + statLabels[sk] + '</td>',
        '  <td style="padding:4px 6px;text-align:right;color:#888;">' + cur + '</td>',
        '  <td style="padding:4px 6px;text-align:right;color:#aaa;">',
            (nxt !== cur ? '<span style="color:' + diffColor + '">' + nxt + '</span>' : String(nxt)),
        '  </td>',
        '  <td style="padding:4px 6px;text-align:right;font-weight:bold;color:' + diffColor + '">' + diffStr + '</td>',
        '</tr>'
      );
    }

    if (!anyDiff) {
      html.push('<tr><td colspan="4" style="padding:4px 6px;color:#335533;">No stat changes</td></tr>');
    }

    html.push('</table>');

    // Attachment bonus summary
    var bonusKeys = Object.keys(att.bonus);
    if (bonusKeys.length > 0) {
      html.push('<div style="margin-top:12px;font-size:10px;color:#446644;letter-spacing:2px;">// ATTACHMENT BONUS</div>');
      html.push('<div style="margin-top:4px;font-size:11px;">');
      for (var bi = 0; bi < bonusKeys.length; bi++) {
        var bk  = bonusKeys[bi];
        var bv  = att.bonus[bk];
        var bColor = (bv >= 0) ? '#44ff88' : '#ff6644';
        html.push('<div style="color:' + bColor + '">' + (bv >= 0 ? '+' : '') + bv + ' ' + bk.toUpperCase() + '</div>');
      }
      html.push('</div>');
    }

    _previewEl.innerHTML = html.join('');
  }

  // ── Public: getAttachmentsFor(weaponId) ───────────────────────────────────
  function getAttachmentsFor(weaponId) {
    return _getStateFor(weaponId);
  }

  // ── Public: applyAttachment(weaponId, slot, attachKey) ────────────────────
  function applyAttachment(weaponId, slot, attachKey) {
    if (!ATTACHMENTS[attachKey]) return;
    if (ATTACHMENTS[attachKey].slot !== slot) return;
    var playerLevel = _getPlayerLevel();
    if (playerLevel < ATTACHMENTS[attachKey].unlockAt) {
      _toast('Locked — reach level ' + ATTACHMENTS[attachKey].unlockAt, '#ff8844');
      return;
    }
    _getStateFor(weaponId)[slot] = attachKey;
    _save();

    // Update globals if this is the active weapon
    var activeId = _getActiveWeaponId();
    if (!activeId || activeId === weaponId) {
      _updateGlobals(weaponId);
    }

    _toast(ATTACHMENTS[attachKey].icon + ' ' + ATTACHMENTS[attachKey].name + ' equipped', '#88ffaa');
  }

  // ── Public: getCurrentAttachments() ───────────────────────────────────────
  function getCurrentAttachments() {
    return _getStateFor(_getActiveWeaponId());
  }

  // ── Toast / HUD notification ───────────────────────────────────────────────
  function _toast(msg, color) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(msg, color || '#88ffaa');
      return;
    }
    // Fallback minimal toast
    var t = document.createElement('div');
    t.style.cssText = [
      'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)', 'color:' + (color || '#88ffaa'),
      'font-family:monospace', 'font-size:13px',
      'padding:7px 18px', 'border-radius:4px',
      'border:1px solid ' + (color || '#336633'),
      'z-index:9900', 'pointer-events:none'
    ].join(';');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2500);
  }

  // ── Show / hide ───────────────────────────────────────────────────────────
  function show() {
    _ensureMenu();
    // Pick the active weapon as default selection
    if (!_selectedWeaponId) {
      _selectedWeaponId = _getActiveWeaponId();
    }
    _renderWeaponList();
    _renderSlotPanels();
    _renderPreview(null);
    _overlay.style.display = 'flex';
    _menuVisible = true;
    window._inputBlocked = true;

    // Pointer lock release
    if (document.exitPointerLock) {
      try { document.exitPointerLock(); } catch (e) {}
    }
  }

  function hide() {
    if (_overlay) _overlay.style.display = 'none';
    _menuVisible = false;
    window._inputBlocked = false;
  }

  function toggle() {
    if (_menuVisible) { hide(); } else { show(); }
  }

  // ── K key binding ─────────────────────────────────────────────────────────
  function _bindKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'KeyK' || e.key === 'k' || e.key === 'K') {
        // Don't open if another blocking menu is visible
        if (!_menuVisible && window._inputBlocked) return;
        e.preventDefault();
        toggle();
      }
      if (e.code === 'Escape' && _menuVisible) {
        e.preventDefault();
        hide();
      }
    });

    // Click outside to close
    if (_overlay) {
      _overlay.addEventListener('click', function (e) {
        if (e.target === _overlay) hide();
      });
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    _load();
    _ensureMenu();
    _bindKeys();

    // Close button in header
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ CLOSE';
    closeBtn.style.cssText = [
      'background:#0a1f0a', 'color:#66cc66',
      'border:1px solid #2a6a2a', 'padding:5px 14px',
      'font-family:monospace', 'font-size:12px',
      'cursor:pointer', 'border-radius:3px'
    ].join(';');
    closeBtn.addEventListener('click', hide);
    // Find the header and append close button
    var hdr = _overlay.querySelector('div');
    if (hdr) hdr.appendChild(closeBtn);

    // Apply defaults for active weapon on start
    _updateGlobals(_getActiveWeaponId());
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Defer slightly so game systems have a chance to initialize first
    setTimeout(init, 300);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:                  init,
    toggle:                toggle,
    show:                  show,
    hide:                  hide,
    getAttachmentsFor:     getAttachmentsFor,
    applyAttachment:       applyAttachment,
    getCurrentAttachments: getCurrentAttachments
  };

})();
