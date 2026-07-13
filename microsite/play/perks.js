window.Perks = (function() {
  'use strict';

  var PERKS = [
    { id: 'IRON_LUNGS',    name: 'Iron Lungs',       icon: '🫁', desc: 'Sprint does not reduce accuracy; stamina drains 30% slower', apply: function(p) { p._perkIronLungs = true; } },
    { id: 'EXTRA_MAG',     name: 'Extended Mag',      icon: '📦', desc: '+30% max ammo for all weapons', apply: function(p) { p.maxAmmo = Math.round((p.maxAmmo || 90) * 1.3); p.ammo = Math.min(p.maxAmmo, (p.ammo || 30) + 15); } },
    { id: 'MEDIC_BELT',    name: 'Medic Belt',        icon: '🏥', desc: 'Bandages heal 25 extra HP', apply: function(p) { p._perkMedicBelt = true; } },
    { id: 'IRON_SKIN',     name: 'Iron Skin',         icon: '🛡', desc: 'Max armor increased by 30, gain 20 armor now', apply: function(p) { p.maxArmor = (p.maxArmor || 100) + 30; p.armor = Math.min(p.maxArmor, (p.armor || 0) + 20); } },
    { id: 'HEADHUNTER',    name: 'Headhunter',        icon: '🎯', desc: 'Headshots do 1.5x more damage', apply: function(p) { p._perkHeadshot = true; } },
    { id: 'TACTICAL_VEST', name: 'Tactical Vest',     icon: '🦺', desc: 'Take 15% less damage from all sources', apply: function(p) { p._perkDamageReduction = (p._perkDamageReduction || 1.0) * 0.85; } },
    { id: 'SCAVENGER',     name: 'Scavenger',         icon: '🔍', desc: 'Enemy kills have 25% chance to drop ammo', apply: function(p) { p._perkScavenger = true; } },
    { id: 'DOUBLE_TIME',   name: 'Double Time',       icon: '⚡', desc: 'Move 15% faster permanently', apply: function(p) { p._perkSpeedMult = (p._perkSpeedMult || 1.0) * 1.15; } },
    { id: 'GRENADIER',     name: 'Grenadier Training',icon: '💣', desc: 'Start each level with 3 extra grenades', apply: function(p) { p.grenades = (p.grenades || 5) + 3; } },
    { id: 'EAGLE_EYE',     name: 'Eagle Eye',         icon: '👁', desc: 'Enemies appear highlighted (red glow) through walls', apply: function(p) { p._perkEagleEye = true; } },
    { id: 'LIFESTEAL',     name: 'Lifesteal',         icon: '❤', desc: 'Each kill restores 3 HP (max 30 per wave)', apply: function(p) { p._perkLifesteal = true; } },
    { id: 'INCENDIARY',    name: 'Incendiary Rounds', icon: '🔥', desc: 'Bullets have 20% chance to set enemies on fire (+5 DPS for 3s)', apply: function(p) { p._perkIncendiary = true; } },
    { id: 'COMMS_JAM',     name: 'Comms Jammer',      icon: '📡', desc: 'Enemy call-for-backup radius reduced 50%', apply: function(p) { p._perkCommsJam = true; } },
    { id: 'STEADY_HAND',   name: 'Steady Hand',       icon: '🖐', desc: 'Weapon recoil reduced 35%', apply: function(p) { p._perkSteadyHand = true; } },
    { id: 'CLAYMORES',     name: 'Claymore Expert',   icon: '💥', desc: 'Start each level with 2 extra mines', apply: function(p) { if (typeof Mines !== 'undefined') Mines.addStartingMines(2); } },
  ];

  var _unlockedPerks = [];
  var _perkChoices = [];
  var _overlayEl = null;
  var _onChosenCallback = null;

  function showPerkSelect(player, onChosen) {
    _onChosenCallback = onChosen;
    // Pick 3 random perks not yet owned
    var available = PERKS.filter(function(p) { return _unlockedPerks.indexOf(p.id) < 0; });
    // Shuffle
    for (var i = available.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = available[i]; available[i] = available[j]; available[j] = tmp;
    }
    _perkChoices = available.slice(0, 3);

    // Build overlay
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'perk-select-overlay';
    _overlayEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9800;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;';

    var html = '<div style="text-align:center;margin-bottom:20px"><div style="font-size:14px;color:#888;letter-spacing:3px">MISSION COMPLETE</div><div style="font-size:24px;color:#ffd700;font-weight:bold;margin-top:6px">CHOOSE YOUR PERK</div></div><div style="display:flex;gap:16px">';

    for (var k = 0; k < _perkChoices.length; k++) {
      var perk = _perkChoices[k];
      html += '<div class="perk-card" data-perk-idx="' + k + '" style="background:rgba(20,20,30,0.95);border:2px solid #334;border-radius:8px;padding:20px 16px;width:160px;text-align:center;cursor:pointer;transition:border-color 0.2s,transform 0.15s" onmouseover="this.style.borderColor=\'#ffd700\';this.style.transform=\'scale(1.05)\'" onmouseout="this.style.borderColor=\'#334\';this.style.transform=\'scale(1)\'">';
      html += '<div style="font-size:40px;margin-bottom:10px">' + perk.icon + '</div>';
      html += '<div style="color:#fff;font-weight:bold;font-size:13px;margin-bottom:8px">' + perk.name + '</div>';
      html += '<div style="color:#aaa;font-size:11px;line-height:1.4">' + perk.desc + '</div>';
      html += '</div>';
    }
    html += '</div><div style="margin-top:18px;font-size:11px;color:#555">[Right-click to skip]</div>';

    _overlayEl.innerHTML = html;
    document.body.appendChild(_overlayEl);

    // Click handler
    _overlayEl.addEventListener('click', function(e) {
      var card = e.target.closest('[data-perk-idx]');
      if (!card) return;
      var idx = parseInt(card.getAttribute('data-perk-idx'), 10);
      var chosen = _perkChoices[idx];
      if (!chosen) return;
      chosen.apply(player);
      _unlockedPerks.push(chosen.id);
      document.body.removeChild(_overlayEl);
      _overlayEl = null;
      if (_onChosenCallback) _onChosenCallback(chosen.id);
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup(chosen.icon + ' PERK: ' + chosen.name, '#ffd700');
      }
    });
    _overlayEl.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      if (_overlayEl) { document.body.removeChild(_overlayEl); _overlayEl = null; }
      if (_onChosenCallback) _onChosenCallback(null);
    });
  }

  function reset() {
    _unlockedPerks = [];
    _perkChoices = [];
    if (_overlayEl && document.body.contains(_overlayEl)) {
      document.body.removeChild(_overlayEl);
      _overlayEl = null;
    }
  }

  function getUnlocked() { return _unlockedPerks.slice(); }

  return { showPerkSelect: showPerkSelect, reset: reset, getUnlocked: getUnlocked, PERKS: PERKS };
})();
