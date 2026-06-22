window.Loadout = (function() {
  'use strict';
  // var only

  var _overlay = null;
  var _selectedPreset = 0;
  var _selectedPerk = 0;
  var _callback = null;  // called with {presetIdx, perkId} when confirmed

  // Loadout presets — weapon combinations
  var PRESETS = [
    {
      id: 'ASSAULT',
      name: 'Assault',
      icon: '⚔',
      desc: 'Balanced assault rifle loadout',
      weapons: ['AK-74', 'Glock-17'],
      bonus: '+10% movement speed',
      bonusKey: 'speedMult',
      bonusVal: 1.1,
    },
    {
      id: 'MARKSMAN',
      name: 'Marksman',
      icon: '🎯',
      desc: 'Precision long-range loadout',
      weapons: ['SVD Dragunov', 'PM Makarov'],
      bonus: '+25% headshot damage',
      bonusKey: 'headshotMult',
      bonusVal: 1.25,
    },
    {
      id: 'HEAVY',
      name: 'Heavy Gunner',
      icon: '💪',
      desc: 'Suppression fire specialist',
      weapons: ['PKM Machine Gun', 'F1 Frag Grenade'],
      bonus: '+50% ammo capacity',
      bonusKey: 'ammoMult',
      bonusVal: 1.5,
    },
    {
      id: 'DEMO',
      name: 'Demolitions',
      icon: '💣',
      desc: 'Explosive specialist with grenade launcher',
      weapons: ['RG-6 Grenade Launcher', 'AKS-74U'],
      bonus: '+2 grenades per wave',
      bonusKey: 'grenadeBonus',
      bonusVal: 2,
    },
    {
      id: 'GHOST',
      name: 'Ghost',
      icon: '👻',
      desc: 'Silent, fast, deadly',
      weapons: ['AS Val', 'Silenced PM'],
      bonus: 'Enemies detect you 30% slower',
      bonusKey: 'stealthMult',
      bonusVal: 0.7,
    },
  ];

  // Passive perks to choose from (3 shown per loadout screen)
  var LOADOUT_PERKS = [
    { id: 'IRON_LUNGS',   name: 'Iron Lungs',    icon: '🌬', desc: 'Hold breath 2x longer for scope sway reduction' },
    { id: 'FIELD_MEDIC',  name: 'Field Medic',   icon: '🏥', desc: 'Start each wave with +20 HP bonus' },
    { id: 'SCAVENGER',    name: 'Scavenger',      icon: '🎒', desc: 'Pick up ammo from enemy kills automatically' },
    { id: 'HARDENED',     name: 'Hardened',       icon: '🛡', desc: 'Take 15% less damage from explosives' },
    { id: 'ADRENALINE',   name: 'Adrenaline',     icon: '⚡', desc: '10 seconds of +20% speed after a kill' },
  ];

  function show(onConfirm) {
    if (_overlay) return;
    _callback = onConfirm;
    _selectedPreset = 0;
    _selectedPerk = 0;

    _overlay = document.createElement('div');
    _overlay.id = 'loadout-overlay';
    _overlay.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'background:rgba(0,0,0,0.92);',
      'z-index:9500;display:flex;flex-direction:column;',
      'align-items:center;justify-content:center;',
      'font-family:monospace;color:#fff;',
      'overflow-y:auto;',
    ].join('');

    _overlay.innerHTML = _buildHTML();
    document.body.appendChild(_overlay);

    // Bind click events
    _overlay.addEventListener('click', _handleClick);

    // Auto-confirm after 15 seconds (with countdown)
    var _countdown = 15;
    var _countEl = _overlay.querySelector('#loadout-countdown');
    var _timer = setInterval(function() {
      _countdown--;
      if (_countEl) _countEl.textContent = _countdown + 's';
      if (_countdown <= 0) {
        clearInterval(_timer);
        _confirm();
      }
    }, 1000);
    _overlay._clearTimer = function() { clearInterval(_timer); };
  }

  function _buildHTML() {
    var html = '<div style="max-width:800px;width:90%;padding:20px;">';
    html += '<h2 style="text-align:center;color:#ffdd00;letter-spacing:4px;margin-bottom:4px;">⚔ SELECT LOADOUT ⚔</h2>';
    html += '<p style="text-align:center;color:#888;font-size:12px;margin-bottom:20px;">Auto-selecting in <span id="loadout-countdown">15s</span> | Click to choose</p>';

    // Presets
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:20px;">';
    for (var i = 0; i < PRESETS.length; i++) {
      var p = PRESETS[i];
      var isActive = (i === _selectedPreset);
      html += '<div class="loadout-preset" data-preset="' + i + '" style="' +
        'width:140px;padding:12px 8px;text-align:center;cursor:pointer;' +
        'border:2px solid ' + (isActive ? '#ffdd00' : 'rgba(255,255,255,0.15)') + ';' +
        'background:' + (isActive ? 'rgba(255,220,0,0.1)' : 'rgba(255,255,255,0.03)') + ';' +
        'border-radius:4px;transition:all 0.2s;">' +
        '<div style="font-size:28px;margin-bottom:6px">' + p.icon + '</div>' +
        '<div style="font-size:13px;font-weight:bold;color:' + (isActive ? '#ffdd00' : '#ccc') + '">' + p.name + '</div>' +
        '<div style="font-size:10px;color:#888;margin-top:4px">' + p.desc + '</div>' +
        '<div style="font-size:10px;color:#44ff88;margin-top:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px">' + p.bonus + '</div>' +
        '</div>';
    }
    html += '</div>';

    // Perks
    html += '<p style="text-align:center;color:#aaa;font-size:12px;margin-bottom:10px;">SELECT PASSIVE PERK:</p>';
    html += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;">';
    for (var j = 0; j < LOADOUT_PERKS.length; j++) {
      var pk = LOADOUT_PERKS[j];
      var isPActive = (j === _selectedPerk);
      html += '<div class="loadout-perk" data-perk="' + j + '" style="' +
        'width:130px;padding:10px 8px;text-align:center;cursor:pointer;' +
        'border:2px solid ' + (isPActive ? '#44aaff' : 'rgba(255,255,255,0.12)') + ';' +
        'background:' + (isPActive ? 'rgba(68,170,255,0.1)' : 'rgba(255,255,255,0.02)') + ';' +
        'border-radius:4px;">' +
        '<div style="font-size:22px;margin-bottom:4px">' + pk.icon + '</div>' +
        '<div style="font-size:11px;font-weight:bold;color:' + (isPActive ? '#44aaff' : '#bbb') + '">' + pk.name + '</div>' +
        '<div style="font-size:9px;color:#777;margin-top:4px">' + pk.desc + '</div>' +
        '</div>';
    }
    html += '</div>';

    // Confirm button
    html += '<div style="text-align:center;">';
    html += '<button id="loadout-confirm" style="' +
      'background:#cc0000;color:#fff;border:none;' +
      'padding:12px 40px;font-family:monospace;font-size:16px;' +
      'letter-spacing:2px;cursor:pointer;border-radius:2px;">' +
      'DEPLOY →</button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function _handleClick(e) {
    var presetEl = e.target.closest('[data-preset]');
    var perkEl = e.target.closest('[data-perk]');
    var confirmEl = e.target.closest('#loadout-confirm');

    if (presetEl) {
      _selectedPreset = parseInt(presetEl.getAttribute('data-preset'), 10);
      _refreshSelection();
    }
    if (perkEl) {
      _selectedPerk = parseInt(perkEl.getAttribute('data-perk'), 10);
      _refreshSelection();
    }
    if (confirmEl) {
      _confirm();
    }
  }

  function _refreshSelection() {
    if (!_overlay) return;
    // Update preset borders
    var presets = _overlay.querySelectorAll('[data-preset]');
    for (var i = 0; i < presets.length; i++) {
      var isActive = (i === _selectedPreset);
      presets[i].style.borderColor = isActive ? '#ffdd00' : 'rgba(255,255,255,0.15)';
      presets[i].style.background = isActive ? 'rgba(255,220,0,0.1)' : 'rgba(255,255,255,0.03)';
    }
    // Update perk borders
    var perks = _overlay.querySelectorAll('[data-perk]');
    for (var j = 0; j < perks.length; j++) {
      var isPActive = (j === _selectedPerk);
      perks[j].style.borderColor = isPActive ? '#44aaff' : 'rgba(255,255,255,0.12)';
      perks[j].style.background = isPActive ? 'rgba(68,170,255,0.1)' : 'rgba(255,255,255,0.02)';
    }
  }

  function _confirm() {
    if (_overlay && _overlay._clearTimer) _overlay._clearTimer();
    var result = {
      preset: PRESETS[_selectedPreset],
      perk: LOADOUT_PERKS[_selectedPerk],
      presetIdx: _selectedPreset,
      perkId: LOADOUT_PERKS[_selectedPerk].id,
    };
    if (_overlay && _overlay.parentNode) {
      _overlay.removeEventListener('click', _handleClick);
      document.body.removeChild(_overlay);
      _overlay = null;
    }
    if (_callback) {
      _callback(result);
      _callback = null;
    }
  }

  function hide() {
    if (_overlay && _overlay._clearTimer) _overlay._clearTimer();
    if (_overlay && _overlay.parentNode) {
      _overlay.removeEventListener('click', _handleClick);
      document.body.removeChild(_overlay);
      _overlay = null;
    }
  }

  function applyLoadout(result, player) {
    if (!result || !player) return;
    var preset = result.preset;
    if (!preset) return;
    // Apply preset bonuses via window flags
    if (preset.bonusKey === 'speedMult')    window._loadoutSpeedMult    = preset.bonusVal;
    if (preset.bonusKey === 'headshotMult') window._loadoutHeadshotMult  = preset.bonusVal;
    if (preset.bonusKey === 'ammoMult')     window._loadoutAmmoMult      = preset.bonusVal;
    if (preset.bonusKey === 'grenadeBonus') player.grenadeCount = (player.grenadeCount || 3) + preset.bonusVal;
    if (preset.bonusKey === 'stealthMult')  window._loadoutStealthMult   = preset.bonusVal;

    // Apply perk
    var perkId = result.perkId;
    if (perkId === 'FIELD_MEDIC') player.hp = Math.min((player.maxHp || 100), (player.hp || 100) + 20);
  }

  return {
    show: show,
    hide: hide,
    applyLoadout: applyLoadout,
    PRESETS: PRESETS,
    LOADOUT_PERKS: LOADOUT_PERKS,
  };
})();
