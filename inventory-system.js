window.InventorySystem = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var ITEM_TYPES = {
    MEDKIT:      { icon: '🩹', label: 'Medkit',      max: 3, key: 'MEDKIT' },
    AMMO_PACK:   { icon: '🔧', label: 'Ammo Pack',   max: 3, key: 'AMMO_PACK' },
    FLASHBANG:   { icon: '💥', label: 'Flashbang',   max: 2, key: 'FLASHBANG' },
    SHIELD_CELL: { icon: '🛡', label: 'Shield Cell', max: 3, key: 'SHIELD_CELL' },
    ADRENALINE:  { icon: '💉', label: 'Adrenaline',  max: 2, key: 'ADRENALINE' },
    FRAG_GRENADE:{ icon: '💣', label: 'Frag Grenade',max: 3, key: 'FRAG_GRENADE' }
  };

  var SLOT_COUNT = 6;
  var STORAGE_KEY = 'okk_inventory_v1';

  // ── Private state ──────────────────────────────────────────────────────────
  var _scene = null;
  var _player = null;
  var _selectedSlot = 0;       // 0-based
  var _panelOpen = false;
  var _adrenalineTimer = 0;
  var _worldCrates = [];        // { mesh, light, type, age }
  var _inited = false;

  // Exposed on window per spec
  window._inventory = [];       // array of { type, count } per slot; null = empty

  // ── DOM references (built lazily) ──────────────────────────────────────────
  var _hudRoot = null;
  var _modalRoot = null;

  // ── Persistence ────────────────────────────────────────────────────────────
  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window._inventory));
    } catch (e) { /* quota or private mode */ }
  }

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === SLOT_COUNT) {
          window._inventory = parsed;
          return;
        }
      }
    } catch (e) { /* corrupt data */ }
    // Default: 6 empty slots
    window._inventory = [];
    for (var i = 0; i < SLOT_COUNT; i++) {
      window._inventory.push(null);
    }
  }

  // ── HUD creation ──────────────────────────────────────────────────────────
  function _buildHUD() {
    if (_hudRoot) return;

    _hudRoot = document.createElement('div');
    _hudRoot.id = 'inv-quickbar';
    _hudRoot.style.cssText = [
      'position:fixed',
      'bottom:18px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'gap:4px',
      'z-index:900',
      'pointer-events:none'
    ].join(';');

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:4px;';

    var keyRow = document.createElement('div');
    keyRow.style.cssText = 'display:flex;gap:4px;';

    for (var i = 0; i < SLOT_COUNT; i++) {
      (function (idx) {
        var slot = document.createElement('div');
        slot.id = 'inv-slot-' + idx;
        slot.style.cssText = [
          'width:56px',
          'height:56px',
          'background:rgba(0,0,0,0.7)',
          'border:1px solid #444',
          'border-radius:4px',
          'display:flex',
          'flex-direction:column',
          'align-items:center',
          'justify-content:center',
          'font-size:22px',
          'position:relative',
          'box-sizing:border-box',
          'transition:border-color 0.1s'
        ].join(';');
        row.appendChild(slot);

        var keyLabel = document.createElement('div');
        keyLabel.style.cssText = [
          'width:56px',
          'text-align:center',
          'font-size:11px',
          'color:#aaa',
          'font-family:monospace'
        ].join(';');
        keyLabel.textContent = String(idx + 1);
        keyRow.appendChild(keyLabel);
      })(i);
    }

    _hudRoot.appendChild(row);
    _hudRoot.appendChild(keyRow);
    document.body.appendChild(_hudRoot);
    _renderHUD();
  }

  function _renderHUD() {
    if (!_hudRoot) return;
    var row = _hudRoot.querySelector('div');
    if (!row) return;
    var slots = row.querySelectorAll('[id^="inv-slot-"]');
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var item = window._inventory[i];

      // Clear
      slot.innerHTML = '';

      if (item && ITEM_TYPES[item.type]) {
        var def = ITEM_TYPES[item.type];
        var ico = document.createElement('span');
        ico.textContent = def.icon;
        slot.appendChild(ico);

        var cnt = document.createElement('span');
        cnt.style.cssText = [
          'position:absolute',
          'bottom:3px',
          'right:5px',
          'font-size:11px',
          'color:#fff',
          'font-family:monospace',
          'font-weight:bold'
        ].join(';');
        cnt.textContent = item.count;
        slot.appendChild(cnt);
      }

      // Selection glow
      if (i === _selectedSlot) {
        slot.style.borderColor = '#FFCC00';
        slot.style.boxShadow = '0 0 6px #FFCC00';
      } else {
        slot.style.borderColor = '#444';
        slot.style.boxShadow = 'none';
      }
    }
  }

  // ── Full inventory modal ───────────────────────────────────────────────────
  function _buildModal() {
    if (_modalRoot) return;

    _modalRoot = document.createElement('div');
    _modalRoot.id = 'inv-modal';
    _modalRoot.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(10,10,10,0.95)',
      'border:1px solid #555',
      'border-radius:8px',
      'padding:20px',
      'z-index:1100',
      'display:none',
      'flex-direction:column',
      'gap:14px',
      'min-width:260px'
    ].join(';');

    var title = document.createElement('div');
    title.style.cssText = 'color:#FFCC00;font-size:15px;font-family:monospace;font-weight:bold;text-align:center;letter-spacing:2px;';
    title.textContent = 'INVENTORY';
    _modalRoot.appendChild(title);

    var grid = document.createElement('div');
    grid.id = 'inv-modal-grid';
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;';
    _modalRoot.appendChild(grid);

    var hint = document.createElement('div');
    hint.style.cssText = 'color:#888;font-size:11px;font-family:monospace;text-align:center;';
    hint.textContent = '[1-6] select  [Enter/F] use  [G] drop  [I] close';
    _modalRoot.appendChild(hint);

    document.body.appendChild(_modalRoot);
  }

  function _renderModal() {
    if (!_modalRoot) return;
    var grid = document.getElementById('inv-modal-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (var i = 0; i < SLOT_COUNT; i++) {
      (function (idx) {
        var cell = document.createElement('div');
        cell.style.cssText = [
          'background:rgba(255,255,255,0.05)',
          'border:1px solid ' + (idx === _selectedSlot ? '#FFCC00' : '#444'),
          'border-radius:6px',
          'padding:10px 6px',
          'text-align:center',
          'cursor:pointer',
          'font-family:monospace',
          'position:relative',
          'box-shadow:' + (idx === _selectedSlot ? '0 0 6px #FFCC00' : 'none')
        ].join(';');

        var item = window._inventory[idx];
        if (item && ITEM_TYPES[item.type]) {
          var def = ITEM_TYPES[item.type];
          var ico = document.createElement('div');
          ico.style.fontSize = '28px';
          ico.textContent = def.icon;
          cell.appendChild(ico);

          var lbl = document.createElement('div');
          lbl.style.cssText = 'font-size:10px;color:#ccc;margin-top:4px;';
          lbl.textContent = def.label;
          cell.appendChild(lbl);

          var cnt = document.createElement('div');
          cnt.style.cssText = 'font-size:11px;color:#FFCC00;font-weight:bold;';
          cnt.textContent = 'x' + item.count;
          cell.appendChild(cnt);
        } else {
          var emp = document.createElement('div');
          emp.style.cssText = 'font-size:22px;color:#333;';
          emp.textContent = '—';
          cell.appendChild(emp);

          var eslot = document.createElement('div');
          eslot.style.cssText = 'font-size:10px;color:#333;';
          eslot.textContent = 'empty';
          cell.appendChild(eslot);
        }

        var keyBadge = document.createElement('div');
        keyBadge.style.cssText = [
          'position:absolute',
          'top:4px',
          'left:5px',
          'font-size:9px',
          'color:#666'
        ].join(';');
        keyBadge.textContent = String(idx + 1);
        cell.appendChild(keyBadge);

        cell.addEventListener('click', function () {
          _selectedSlot = idx;
          _renderHUD();
          _renderModal();
        });

        grid.appendChild(cell);
      })(i);
    }
  }

  function _openPanel() {
    _panelOpen = true;
    if (!_modalRoot) _buildModal();
    _renderModal();
    _modalRoot.style.display = 'flex';
  }

  function _closePanel() {
    _panelOpen = false;
    if (_modalRoot) _modalRoot.style.display = 'none';
  }

  function _togglePanel() {
    if (_panelOpen) { _closePanel(); } else { _openPanel(); }
  }

  // ── Reject beep ────────────────────────────────────────────────────────────
  function _rejectBeep() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 220;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* audio context unavailable */ }
  }

  // ── Use effects ────────────────────────────────────────────────────────────
  function _applyItem(type) {
    var p = _player;

    if (type === 'MEDKIT') {
      if (p) {
        p.hp = Math.min((p.maxHp || 100), (p.hp || 0) + 50);
      }
      _toast('Medkit used! +50 HP', '#44ff88');
    }

    else if (type === 'AMMO_PACK') {
      if (window.Weapons && typeof window.Weapons.getCurrent === 'function') {
        var wep = window.Weapons.getCurrent();
        if (wep) {
          // Restore 50% of max reserve
          var restore = Math.floor((wep.maxReserve || 90) * 0.5);
          if (typeof window.Weapons.addAmmo === 'function') {
            window.Weapons.addAmmo(restore);
          } else if (p && typeof p.reserve !== 'undefined') {
            p.reserve = Math.min(wep.maxReserve || 90, (p.reserve || 0) + restore);
          }
        }
      }
      _toast('Ammo Pack! +50% reserve', '#44aaff');
    }

    else if (type === 'FLASHBANG') {
      if (window.Flashbang && typeof window.Flashbang.throw === 'function') {
        window.Flashbang.throw();
      } else if (p && typeof p.flashGrenades !== 'undefined') {
        p.flashGrenades = (p.flashGrenades || 0) + 1;
        // trigger grenade key if GameManager exposes it
        if (window.GameManager && typeof window.GameManager.throwFlash === 'function') {
          window.GameManager.throwFlash();
        }
      }
      _toast('Flashbang thrown!', '#ffff44');
    }

    else if (type === 'SHIELD_CELL') {
      if (typeof window._shieldBubbleHP !== 'undefined') {
        window._shieldBubbleHP = Math.min(200, (window._shieldBubbleHP || 0) + 50);
        _toast('Shield Cell! +50 shield', '#44ddff');
      } else {
        // Fallback: give HP armor buffer
        if (p) {
          p.armor = Math.min(100, (p.armor || 0) + 25);
        }
        _toast('Shield Cell! +25 armor', '#44ddff');
      }
    }

    else if (type === 'ADRENALINE') {
      window._adrenalineActive = true;
      _adrenalineTimer = 8.0;
      // Apply speed/fire rate multipliers if player exposes them
      if (p) {
        p._invSpeedMult = 1.2;
        p._invFireRateMult = 1.2;
      }
      _toast('Adrenaline! +20% speed & fire rate (8s)', '#ff44ff');
    }

    else if (type === 'FRAG_GRENADE') {
      if (p && typeof p.grenades !== 'undefined') {
        p.grenades = (p.grenades || 0) + 1;
      }
      // Fire it immediately if GameManager supports it
      if (window.GameManager && typeof window.GameManager.throwGrenade === 'function') {
        window.GameManager.throwGrenade();
      }
      _toast('Frag Grenade armed!', '#ff8844');
    }
  }

  function _toast(msg, color) {
    if (window.HUD && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast(msg);
      return;
    }
    // Fallback toast
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'bottom:130px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:' + (color || '#fff'),
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border-radius:4px',
      'z-index:1200',
      'pointer-events:none',
      'transition:opacity 0.5s'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; }, 1500);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2100);
  }

  // ── Public: addItem ────────────────────────────────────────────────────────
  function addItem(type) {
    if (!ITEM_TYPES[type]) return false;
    var def = ITEM_TYPES[type];

    // Find existing stack with room
    for (var i = 0; i < SLOT_COUNT; i++) {
      if (window._inventory[i] && window._inventory[i].type === type) {
        if (window._inventory[i].count < def.max) {
          window._inventory[i].count++;
          _save();
          _renderHUD();
          if (_panelOpen) _renderModal();
          return true;
        }
      }
    }

    // Find empty slot
    for (var j = 0; j < SLOT_COUNT; j++) {
      if (!window._inventory[j]) {
        window._inventory[j] = { type: type, count: 1 };
        _save();
        _renderHUD();
        if (_panelOpen) _renderModal();
        return true;
      }
    }

    // Full — reject beep
    _rejectBeep();
    _toast('Inventory full!', '#ff4444');
    return false;
  }

  // ── Public: removeItem ─────────────────────────────────────────────────────
  function removeItem(type) {
    for (var i = 0; i < SLOT_COUNT; i++) {
      if (window._inventory[i] && window._inventory[i].type === type) {
        window._inventory[i].count--;
        if (window._inventory[i].count <= 0) {
          window._inventory[i] = null;
        }
        _save();
        _renderHUD();
        if (_panelOpen) _renderModal();
        return true;
      }
    }
    return false;
  }

  // ── Public: useItem ────────────────────────────────────────────────────────
  function useItem(slotIdx) {
    if (typeof slotIdx === 'undefined') slotIdx = _selectedSlot;
    var item = window._inventory[slotIdx];
    if (!item || item.count <= 0) return false;

    _applyItem(item.type);
    item.count--;
    if (item.count <= 0) {
      window._inventory[slotIdx] = null;
    }
    _save();
    _renderHUD();
    if (_panelOpen) _renderModal();
    return true;
  }

  // ── Drop item ──────────────────────────────────────────────────────────────
  function _dropItem(slotIdx) {
    if (typeof slotIdx === 'undefined') slotIdx = _selectedSlot;
    var item = window._inventory[slotIdx];
    if (!item) return;
    // Spawn world crate at player position + small offset
    if (_scene && _player) {
      _spawnCrateAt(item.type, {
        x: (_player.position ? _player.position.x : 0) + (Math.random() - 0.5),
        y: 0.2,
        z: (_player.position ? _player.position.z : 0) + (Math.random() - 0.5)
      });
    }
    window._inventory[slotIdx] = null;
    _save();
    _renderHUD();
    if (_panelOpen) _renderModal();
  }

  // ── World crate spawning ───────────────────────────────────────────────────
  var _crateGeo = null;
  var _crateMats = {};

  function _getCrateMat(type) {
    if (!_crateMats[type]) {
      var color = 0xFFCC00;
      _crateMats[type] = new THREE.MeshStandardMaterial({ color: color, emissive: 0x332200, roughness: 0.6 });
    }
    return _crateMats[type];
  }

  function _spawnCrateAt(type, pos) {
    if (!_scene || typeof THREE === 'undefined') return;
    if (!_crateGeo) {
      _crateGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    }
    var mat = _getCrateMat(type);
    var mesh = new THREE.Mesh(_crateGeo, mat);
    mesh.position.set(pos.x, pos.y + 0.2, pos.z);
    mesh.castShadow = true;
    mesh.userData.invType = type;

    var light = new THREE.PointLight(0xFFCC00, 2, 3);
    light.position.copy(mesh.position);
    _scene.add(mesh);
    _scene.add(light);

    _worldCrates.push({ mesh: mesh, light: light, type: type, age: 0 });
  }

  function _spawnCrateFromEnemy(enemyPosition) {
    if (Math.random() > 0.25) return;
    var types = Object.keys(ITEM_TYPES);
    var type = types[Math.floor(Math.random() * types.length)];
    _spawnCrateAt(type, {
      x: enemyPosition.x + (Math.random() - 0.5) * 2,
      y: enemyPosition.y || 0,
      z: enemyPosition.z + (Math.random() - 0.5) * 2
    });
  }

  function _updateCrates(delta) {
    if (!_player) return;
    var px = _player.position ? _player.position.x : 0;
    var py = _player.position ? _player.position.y : 0;
    var pz = _player.position ? _player.position.z : 0;

    for (var i = _worldCrates.length - 1; i >= 0; i--) {
      var c = _worldCrates[i];
      c.age += delta;

      // Bob and rotate
      c.mesh.rotation.y += delta * 1.2;
      c.mesh.position.y = 0.2 + Math.sin(c.age * 2.5) * 0.06;
      c.light.position.copy(c.mesh.position);

      // Proximity pickup (E key handled in keydown; here we just check 2-unit radius passively)
      var dx = px - c.mesh.position.x;
      var dy = py - c.mesh.position.y;
      var dz = pz - c.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 2.0 && _pendingPickup) {
        _pendingPickup = false;
        var picked = addItem(c.type);
        if (picked) {
          var def = ITEM_TYPES[c.type];
          _toast('Picked up ' + def.label + ' ' + def.icon, '#44ff88');
          _scene.remove(c.mesh);
          _scene.remove(c.light);
          _worldCrates.splice(i, 1);
        }
      }
    }
  }

  var _pendingPickup = false;

  // ── Adrenaline timer ───────────────────────────────────────────────────────
  function _updateAdrenaline(delta) {
    if (!window._adrenalineActive) return;
    _adrenalineTimer -= delta;
    if (_adrenalineTimer <= 0) {
      window._adrenalineActive = false;
      _adrenalineTimer = 0;
      if (_player) {
        _player._invSpeedMult = 1.0;
        _player._invFireRateMult = 1.0;
      }
    }
  }

  // ── Keyboard handler ───────────────────────────────────────────────────────
  function _onKeyDown(e) {
    // Ignore when typing in an input
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

    var key = e.key;

    // 1-6: select slot
    if (key >= '1' && key <= '6') {
      _selectedSlot = parseInt(key, 10) - 1;
      _renderHUD();
      if (_panelOpen) _renderModal();
      return;
    }

    // Enter or F: use selected item
    if ((key === 'Enter' || key === 'f' || key === 'F') && !_panelOpen) {
      useItem(_selectedSlot);
      return;
    }

    // I: toggle full panel
    if (key === 'i' || key === 'I') {
      _togglePanel();
      return;
    }

    // G: drop while panel open
    if ((key === 'g' || key === 'G') && _panelOpen) {
      _dropItem(_selectedSlot);
      return;
    }

    // E: pickup from world crate
    if (key === 'e' || key === 'E') {
      _pendingPickup = true;
      return;
    }
  }

  // ── Public: init ───────────────────────────────────────────────────────────
  function init(player, scene) {
    if (_inited) return;
    _inited = true;

    _player = player || null;
    _scene = scene || null;

    _load();
    _buildHUD();
    _buildModal();

    document.addEventListener('keydown', _onKeyDown, false);

    // Expose enemy death hook
    window._inventoryOnEnemyDeath = function (enemyPosition) {
      _spawnCrateFromEnemy(enemyPosition || { x: 0, y: 0, z: 0 });
    };
  }

  // ── Public: update ─────────────────────────────────────────────────────────
  function update(delta) {
    if (!_inited) return;
    _updateCrates(delta || 0.016);
    _updateAdrenaline(delta || 0.016);
    // Reset one-shot pickup flag each frame (set by E key)
    // (already consumed in _updateCrates)
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    window._inventory = [];
    for (var i = 0; i < SLOT_COUNT; i++) {
      window._inventory.push(null);
    }
    _selectedSlot = 0;
    _adrenalineTimer = 0;
    window._adrenalineActive = false;

    // Remove world crates
    for (var j = 0; j < _worldCrates.length; j++) {
      if (_scene) {
        _scene.remove(_worldCrates[j].mesh);
        _scene.remove(_worldCrates[j].light);
      }
    }
    _worldCrates = [];

    _save();
    _renderHUD();
    if (_panelOpen) _renderModal();
  }

  return {
    init: init,
    update: update,
    addItem: addItem,
    removeItem: removeItem,
    useItem: useItem,
    reset: reset
  };
})();
