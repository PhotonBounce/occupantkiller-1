window.ArmorTiers = (function() {
  'use strict';
  // var only — no let/const

  var ARMOR_TIERS = [
    { id: 0, name: 'NO ARMOR',        protection: 0.0,  maxHP: 0,   color: '#666666', icon: '○' },
    { id: 1, name: 'SOFT VEST',       protection: 0.2,  maxHP: 50,  color: '#88aa88', icon: '◐' },
    { id: 2, name: 'LEVEL II VEST',   protection: 0.35, maxHP: 75,  color: '#44aa44', icon: '●' },
    { id: 3, name: 'LEVEL III PLATE', protection: 0.50, maxHP: 100, color: '#22cc44', icon: '◉' },
    { id: 4, name: 'LEVEL IV PLATE',  protection: 0.65, maxHP: 125, color: '#00eecc', icon: '★' },
    { id: 5, name: 'CERAMIC ARMOR',   protection: 0.75, maxHP: 150, color: '#ffaa00', icon: '⬟' },
  ];

  var REPAIR_AMOUNT = 25;

  // ── internal state ───────────────────────────────────────────────────────────
  var _currentArmor = ARMOR_TIERS[1];  // start with SOFT VEST
  var _armorHP      = ARMOR_TIERS[1].maxHP;
  var _broken       = false;

  // HUD elements
  var _hudEl        = null;
  var _barFillEl    = null;
  var _hpTextEl     = null;
  var _tierLabelEl  = null;
  var _statusEl     = null;  // "ARMOR BROKEN" / flash messages
  var _flashTimer   = 0;
  var _notifyTimer  = 0;
  var _notifyEl     = null;
  var _blinkState   = false;
  var _blinkTimer   = 0;

  // ── globals readable by other systems ───────────────────────────────────────
  window._playerArmorHP  = _armorHP;
  window._playerArmorMax = _currentArmor.maxHP;

  // ── HUD creation ─────────────────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'armor-tiers-hud';
    _hudEl.style.cssText = [
      'position:fixed;top:55px;right:15px;',
      'font-family:monospace;font-size:12px;color:#cccccc;',
      'pointer-events:none;z-index:4100;',
      'display:flex;flex-direction:column;align-items:flex-end;gap:3px;',
    ].join('');

    // Top row: label "ARMOR" + bar + HP text
    var rowEl = document.createElement('div');
    rowEl.style.cssText = 'display:flex;align-items:center;gap:5px;';

    var labelEl = document.createElement('span');
    labelEl.textContent = 'ARMOR';
    labelEl.style.cssText = 'color:#aaaaaa;font-size:10px;';

    var barOuter = document.createElement('div');
    barOuter.style.cssText = [
      'width:100px;height:8px;',
      'background:rgba(0,0,0,0.5);',
      'border:1px solid rgba(200,200,200,0.25);',
      'border-radius:2px;overflow:hidden;',
    ].join('');

    _barFillEl = document.createElement('div');
    _barFillEl.style.cssText = 'height:100%;width:100%;transition:width 0.25s,background-color 0.25s;';

    _hpTextEl = document.createElement('span');
    _hpTextEl.style.cssText = 'color:#cccccc;min-width:50px;text-align:right;font-size:11px;';

    barOuter.appendChild(_barFillEl);
    rowEl.appendChild(labelEl);
    rowEl.appendChild(barOuter);
    rowEl.appendChild(_hpTextEl);
    _hudEl.appendChild(rowEl);

    // Second row: tier icon + tier name
    _tierLabelEl = document.createElement('div');
    _tierLabelEl.style.cssText = 'font-size:10px;color:#aaaaaa;text-align:right;';
    _hudEl.appendChild(_tierLabelEl);

    // Status row: "ARMOR BROKEN" warning / flash text
    _statusEl = document.createElement('div');
    _statusEl.style.cssText = [
      'font-size:11px;font-weight:bold;',
      'color:#ff3333;text-align:right;',
      'min-height:14px;',
    ].join('');
    _hudEl.appendChild(_statusEl);

    // Equip / repair notification (appears briefly, positioned below)
    _notifyEl = document.createElement('div');
    _notifyEl.style.cssText = [
      'position:fixed;top:120px;right:15px;',
      'font-family:monospace;font-size:12px;font-weight:bold;',
      'color:#ffd700;pointer-events:none;z-index:4200;',
      'text-align:right;opacity:0;transition:opacity 0.3s;',
    ].join('');
    document.body.appendChild(_notifyEl);

    document.body.appendChild(_hudEl);
    _refreshHUD();
  }

  function _refreshHUD() {
    if (!_barFillEl) return;

    var tier = _currentArmor;
    var maxHP = tier.maxHP;
    var pct = (maxHP > 0) ? Math.max(0, Math.min(1, _armorHP / maxHP)) : 0;

    // Bar width
    _barFillEl.style.width = (pct * 100) + '%';
    _barFillEl.style.backgroundColor = _broken ? '#333333' : tier.color;

    // HP text
    if (tier.id === 0 || maxHP === 0) {
      _hpTextEl.textContent = '--/--';
    } else {
      _hpTextEl.textContent = Math.ceil(_armorHP) + '/' + maxHP;
    }

    // Tier label
    if (tier.id === 0) {
      _tierLabelEl.textContent = tier.icon + ' ' + tier.name;
    } else {
      _tierLabelEl.textContent = tier.icon + ' ' + tier.name;
    }

    // Status line
    if (_broken && tier.id > 0) {
      _statusEl.textContent = 'ARMOR BROKEN';
      _statusEl.style.color = '#ff3333';
    } else {
      _statusEl.textContent = '';
    }

    // Update globals
    window._playerArmorHP  = _armorHP;
    window._playerArmorMax = maxHP;
  }

  // ── notify popup ──────────────────────────────────────────────────────────────
  function _showNotify(msg, color) {
    if (!_notifyEl) return;
    _notifyEl.textContent = msg;
    _notifyEl.style.color = color || '#ffd700';
    _notifyEl.style.opacity = '1';
    _notifyTimer = 2.5;
  }

  // ── flash gold on upgrade ─────────────────────────────────────────────────────
  function _flashUpgrade() {
    if (!_hudEl) return;
    _hudEl.style.boxShadow = '0 0 12px 4px #ffd700';
    _flashTimer = 0.6;
  }

  // ── public: init ──────────────────────────────────────────────────────────────
  function init() {
    _currentArmor = ARMOR_TIERS[1];
    _armorHP      = _currentArmor.maxHP;
    _broken       = false;
    _createHUD();
    _refreshHUD();

    // Install global damage hook
    window._onArmorDamage = function(dmg) {
      return takeDamage(dmg);
    };

    // Install global pickup hook
    window._onArmorPickup = function(tierIdOrObj) {
      equipArmor(tierIdOrObj);
    };
  }

  // ── public: equipArmor ────────────────────────────────────────────────────────
  // Accept tier id (number), tier name (string), or tier object
  function equipArmor(tierIdOrObj) {
    var newTier = null;
    if (typeof tierIdOrObj === 'object' && tierIdOrObj !== null && typeof tierIdOrObj.id === 'number') {
      newTier = tierIdOrObj;
    } else if (typeof tierIdOrObj === 'number') {
      for (var i = 0; i < ARMOR_TIERS.length; i++) {
        if (ARMOR_TIERS[i].id === tierIdOrObj) { newTier = ARMOR_TIERS[i]; break; }
      }
    } else if (typeof tierIdOrObj === 'string') {
      for (var j = 0; j < ARMOR_TIERS.length; j++) {
        if (ARMOR_TIERS[j].name === tierIdOrObj) { newTier = ARMOR_TIERS[j]; break; }
      }
    }

    if (!newTier) return;

    var isUpgrade = (newTier.id > _currentArmor.id);

    // Only allow same tier to repair, or higher tier to equip
    if (newTier.id < _currentArmor.id) return;

    var prevTier = _currentArmor;
    _currentArmor = newTier;
    _armorHP      = newTier.maxHP;
    _broken       = false;

    _refreshHUD();

    if (isUpgrade) {
      _flashUpgrade();
      _showNotify('🛡 ' + newTier.name + ' EQUIPPED', '#ffd700');
    } else if (prevTier.id === newTier.id) {
      // same tier re-equip = full repair
      _showNotify('🛡 ARMOR REPAIRED', '#88ff88');
    }
  }

  // ── public: getArmor ─────────────────────────────────────────────────────────
  function getArmor() {
    return {
      tier:       _currentArmor,
      hp:         _armorHP,
      maxHP:      _currentArmor.maxHP,
      broken:     _broken,
      protection: _broken ? 0 : _currentArmor.protection,
    };
  }

  // ── public: takeDamage ────────────────────────────────────────────────────────
  function takeDamage(incomingDamage) {
    if (_broken || _currentArmor.id === 0 || _currentArmor.maxHP === 0) {
      return { playerDamage: incomingDamage, armorDamage: 0 };
    }

    var absorbed    = incomingDamage * _currentArmor.protection;
    var playerDamage = incomingDamage - absorbed;
    var armorDamage  = absorbed;

    _armorHP -= armorDamage;

    if (_armorHP < 0) {
      // overflow: remaining armor deficit becomes extra player damage
      playerDamage += Math.abs(_armorHP);
      _armorHP = 0;
    }

    if (_armorHP <= 0 && !_broken) {
      _broken  = true;
      _armorHP = 0;
      _showNotify('ARMOR BROKEN!', '#ff3333');
    }

    _refreshHUD();

    window._playerArmorHP = _armorHP;
    return { playerDamage: playerDamage, armorDamage: armorDamage };
  }

  // ── public: repairArmor (partial plate pickup) ────────────────────────────────
  function repairArmor(amount) {
    if (_currentArmor.id === 0) return;
    var repAmt = amount !== undefined ? amount : REPAIR_AMOUNT;
    if (_broken) {
      // partial repair doesn't un-break; need full tier pickup for that
      // But +25 gives at least some hp back, un-break if reaches > 0
      _armorHP = Math.min(_currentArmor.maxHP, _armorHP + repAmt);
      if (_armorHP > 0) _broken = false;
    } else {
      _armorHP = Math.min(_currentArmor.maxHP, _armorHP + repAmt);
    }
    _refreshHUD();
    _showNotify('🛡 +' + repAmt + ' ARMOR RESTORED', '#88ff88');
    window._playerArmorHP = _armorHP;
  }

  // ── public: update (call each frame, delta in seconds) ────────────────────────
  function update(delta) {
    // Blink bar when armor HP < 20%
    if (_currentArmor.id > 0 && !_broken && _armorHP > 0) {
      var lowThreshold = _currentArmor.maxHP * 0.2;
      if (_armorHP < lowThreshold) {
        _blinkTimer -= delta;
        if (_blinkTimer <= 0) {
          _blinkState  = !_blinkState;
          _blinkTimer  = 0.4;
          if (_barFillEl) {
            _barFillEl.style.opacity = _blinkState ? '0.3' : '1';
          }
          if (_hpTextEl) {
            _hpTextEl.style.color = _blinkState ? '#ff4444' : '#cccccc';
          }
        }
      } else {
        // reset blink
        if (_barFillEl) _barFillEl.style.opacity = '1';
        if (_hpTextEl)  _hpTextEl.style.color    = '#cccccc';
        _blinkTimer = 0;
        _blinkState = false;
      }
    } else {
      if (_barFillEl) _barFillEl.style.opacity = '1';
      _blinkTimer = 0;
      _blinkState = false;
    }

    // Tick flash timer
    if (_flashTimer > 0) {
      _flashTimer -= delta;
      if (_flashTimer <= 0 && _hudEl) {
        _hudEl.style.boxShadow = 'none';
        _flashTimer = 0;
      }
    }

    // Tick notify timer
    if (_notifyTimer > 0) {
      _notifyTimer -= delta;
      if (_notifyTimer <= 0 && _notifyEl) {
        _notifyEl.style.opacity = '0';
        _notifyTimer = 0;
      }
    }
  }

  // ── public: reset ─────────────────────────────────────────────────────────────
  function reset() {
    _currentArmor = ARMOR_TIERS[1];
    _armorHP      = _currentArmor.maxHP;
    _broken       = false;
    _flashTimer   = 0;
    _notifyTimer  = 0;
    _blinkState   = false;
    _blinkTimer   = 0;
    if (_barFillEl) _barFillEl.style.opacity = '1';
    if (_hudEl)     _hudEl.style.boxShadow   = 'none';
    if (_notifyEl)  _notifyEl.style.opacity  = '0';
    _refreshHUD();

    window._playerArmorHP  = _armorHP;
    window._playerArmorMax = _currentArmor.maxHP;
  }

  // ── expose public API ─────────────────────────────────────────────────────────
  return {
    init:        init,
    equipArmor:  equipArmor,
    getArmor:    getArmor,
    takeDamage:  takeDamage,
    repairArmor: repairArmor,
    update:      update,
    reset:       reset,
    TIERS:       ARMOR_TIERS,
  };
})();
