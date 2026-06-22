window.Shop = (function() {
  'use strict';

  var _panel = null;
  var _visible = false;
  var _onClose = null;

  var UPGRADES = [
    // ── Weapon Damage ─────────────────────────────────────────────────────
    { id: 'dmg_1', cat: 'WEAPONS', name: '🔥 Damage Boost I', desc: '+15% weapon damage', cost: 80, maxLevel: 3,
      apply: function() { window._weaponDamageMultiplier = (window._weaponDamageMultiplier || 1) * 1.15; } },
    { id: 'dmg_2', cat: 'WEAPONS', name: '💥 Damage Boost II', desc: '+25% weapon damage', cost: 200, maxLevel: 2,
      apply: function() { window._weaponDamageMultiplier = (window._weaponDamageMultiplier || 1) * 1.25; } },
    { id: 'explosive_rounds', cat: 'WEAPONS', name: '🧨 Explosive Rounds', desc: 'Bullets cause small area damage', cost: 250, maxLevel: 1,
      apply: function() { window._explosiveRounds = true; } },
    { id: 'armor_pierce', cat: 'WEAPONS', name: '🔩 Armor Piercing', desc: '+40% damage vs armored enemies', cost: 180, maxLevel: 2,
      apply: function() { window._armorPierceMultiplier = (window._armorPierceMultiplier || 1) * 1.40; } },

    // ── Rate of Fire / Reload ──────────────────────────────────────────────
    { id: 'rof_1', cat: 'WEAPONS', name: '⚡ Rate of Fire I', desc: '-15% fire interval', cost: 90, maxLevel: 3,
      apply: function() { window._rofMultiplier = (window._rofMultiplier || 1) * 0.85; } },
    { id: 'reload_1', cat: 'WEAPONS', name: '🔄 Fast Reload', desc: '-20% reload time', cost: 70, maxLevel: 3,
      apply: function() { window._reloadMultiplier = (window._reloadMultiplier || 1) * 0.80; } },
    { id: 'ext_mag', cat: 'WEAPONS', name: '📎 Extended Mag', desc: '+30% magazine capacity', cost: 130, maxLevel: 2,
      apply: function() { window._magCapMultiplier = (window._magCapMultiplier || 1) * 1.30; } },

    // ── Ammo ──────────────────────────────────────────────────────────────
    { id: 'ammo_1', cat: 'SUPPLIES', name: '📦 Ammo Cache', desc: 'Full ammo refill', cost: 50, maxLevel: 99,
      apply: function() { if (window.Weapons && Weapons.refillAllAmmo) Weapons.refillAllAmmo(); } },
    { id: 'nade_1', cat: 'SUPPLIES', name: '💣 Grenade Pack (+3)', desc: '+3 grenades', cost: 45, maxLevel: 99,
      apply: function() { window._bonusGrenades = (window._bonusGrenades || 0) + 3; } },
    { id: 'drone_ammo', cat: 'SUPPLIES', name: '🎯 FPV Payload Pack', desc: '+10 FPV drone payloads', cost: 65, maxLevel: 99,
      apply: function() { window._dronePayloadBonus = (window._dronePayloadBonus || 0) + 10; } },
    { id: 'claymore_1', cat: 'SUPPLIES', name: '⚠️ Claymore x3', desc: '+3 claymore mines', cost: 55, maxLevel: 99,
      apply: function() { window._bonusClaymores = (window._bonusClaymores || 0) + 3; } },
    { id: 'tow_reload', cat: 'SUPPLIES', name: '🚀 TOW Reload', desc: '+2 TOW missiles (Bradley)', cost: 80, maxLevel: 99,
      apply: function() { window._bonusTOW = (window._bonusTOW || 0) + 2; } },

    // ── Health / Survival ─────────────────────────────────────────────────
    { id: 'hp_1', cat: 'SURVIVAL', name: '❤️ Health Pack', desc: 'Restore 50 HP', cost: 60, maxLevel: 99,
      apply: function() { if (window.GameManager && GameManager.healPlayer) GameManager.healPlayer(50); } },
    { id: 'hp_2', cat: 'SURVIVAL', name: '💊 Max HP Boost', desc: '+25 max HP', cost: 150, maxLevel: 3,
      apply: function() { window._maxHPBonus = (window._maxHPBonus || 0) + 25; } },
    { id: 'medkit_1', cat: 'SURVIVAL', name: '🩹 Field Medkit', desc: 'Restore 80 HP', cost: 100, maxLevel: 99,
      apply: function() { if (window.GameManager && GameManager.healPlayer) GameManager.healPlayer(80); } },
    { id: 'armor_1', cat: 'SURVIVAL', name: '🛡️ Body Armor', desc: '-20% incoming damage', cost: 120, maxLevel: 3,
      apply: function() { window._armorDamageReduction = Math.min(0.75, (window._armorDamageReduction || 0) + 0.20); } },
    { id: 'stim_1', cat: 'SURVIVAL', name: '💉 Stim Pack', desc: 'Full stamina + 5s regen boost', cost: 70, maxLevel: 99,
      apply: function() { window._staminaRefill = true; window._stimActive = true; window._stimTimer = 5.0; } },
    { id: 'regen_1', cat: 'SURVIVAL', name: '🩸 Combat Regen', desc: 'HP regens faster out of combat', cost: 160, maxLevel: 2,
      apply: function() { window._combatRegenMultiplier = (window._combatRegenMultiplier || 1) * 2.0; } },

    // ── Tactical ──────────────────────────────────────────────────────────
    { id: 'spd_1', cat: 'TACTICAL', name: '🏃 Sprint Boost', desc: '+20% movement speed', cost: 100, maxLevel: 2,
      apply: function() { window._speedMultiplier = (window._speedMultiplier || 1) * 1.20; } },
    { id: 'suppressor', cat: 'TACTICAL', name: '🔇 Suppressor', desc: 'Enemy detection range -30%', cost: 140, maxLevel: 1,
      apply: function() { window._silencerEquipped = true; } },
    { id: 'nvg', cat: 'TACTICAL', name: '🌙 Night Vision', desc: 'Full vision in night combat', cost: 200, maxLevel: 1,
      apply: function() { window._nightVisionEquipped = true; if (window.HUD && HUD.setNightVision) HUD.setNightVision(true); } },
    { id: 'airstrike', cat: 'TACTICAL', name: '✈️ Airstrike Beacon', desc: '+1 HIMARS strike (press N)', cost: 300, maxLevel: 99,
      apply: function() { window._airstrikeCount = (window._airstrikeCount || 0) + 1; } },
    { id: 'radar', cat: 'TACTICAL', name: '📡 Radar Pulse', desc: 'Enemies visible on minimap 20s', cost: 110, maxLevel: 99,
      apply: function() { window._radarActive = (window._radarActive || 0) + 20; } },
  ];

  var _purchased = {}; // { upgradeId: count }
  var _activeCategory = 'ALL';

  var CATEGORIES = ['ALL', 'WEAPONS', 'SUPPLIES', 'SURVIVAL', 'TACTICAL'];

  function _getOKC() {
    if (window.Marketplace && Marketplace.getOKC) return Marketplace.getOKC();
    if (window.GameManager && GameManager.getOKC) return GameManager.getOKC();
    return (window._playerOKC || 0);
  }

  function _spendOKC(amount) {
    if (window.Marketplace && Marketplace.spendOKC) return Marketplace.spendOKC(amount);
    if (window.GameManager && GameManager.spendOKC) return GameManager.spendOKC(amount);
    if (window._playerOKC !== undefined) { window._playerOKC -= amount; return true; }
    return false;
  }

  function show(onCloseCb) {
    if (_visible) return;
    _visible = true;
    _onClose = onCloseCb || null;
    _buildPanel();
  }

  function hide() {
    if (!_visible) return;
    _visible = false;
    if (_panel && _panel.parentNode) _panel.parentNode.removeChild(_panel);
    _panel = null;
    if (_onClose) { _onClose(); _onClose = null; }
  }

  function _buildPanel() {
    _panel = document.createElement('div');
    _panel.id = 'shop-panel';
    _panel.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:16px;overflow-y:auto;font-family:monospace;color:#eee;';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'font-size:26px;font-weight:bold;color:#ffcc00;margin-bottom:4px;letter-spacing:2px;';
    header.textContent = '🏪 FIELD SHOP';
    _panel.appendChild(header);

    var okc = document.createElement('div');
    okc.id = 'shop-panel-okc';
    okc.style.cssText = 'font-size:17px;color:#44ff88;margin-bottom:10px;';
    okc.textContent = '💰 OKC: ' + _getOKC();
    _panel.appendChild(okc);

    // Category tabs
    var tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;justify-content:center;';
    CATEGORIES.forEach(function(cat) {
      var tab = document.createElement('button');
      var isActive = (_activeCategory === cat);
      tab.style.cssText = 'padding:5px 14px;font-size:12px;font-family:monospace;cursor:pointer;border-radius:4px;border:1px solid ' +
        (isActive ? '#ffcc00' : '#555') + ';background:' + (isActive ? '#443300' : 'rgba(255,255,255,0.06)') + ';color:' + (isActive ? '#ffcc00' : '#aaa') + ';';
      tab.textContent = cat;
      tab.addEventListener('click', function() {
        _activeCategory = cat;
        if (_panel && _panel.parentNode) _panel.parentNode.removeChild(_panel);
        _panel = null;
        _buildPanel();
      });
      tabs.appendChild(tab);
    });
    _panel.appendChild(tabs);

    // Grid of upgrade cards
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:10px;width:92%;max-width:960px;';

    var filtered = UPGRADES.filter(function(u) { return _activeCategory === 'ALL' || u.cat === _activeCategory; });

    filtered.forEach(function(upg) {
      var purchased = _purchased[upg.id] || 0;
      var maxed = purchased >= upg.maxLevel;
      var canAfford = _getOKC() >= upg.cost;

      var card = document.createElement('div');
      var borderColor = maxed ? '#444' : (canAfford ? '#44ff88' : '#883333');
      card.style.cssText = 'background:rgba(255,255,255,0.07);border:1px solid ' + borderColor + ';border-radius:8px;padding:11px;cursor:' + (maxed ? 'default' : 'pointer') + ';transition:background 0.15s;';

      var catBadge = '<span style="font-size:9px;color:#666;background:rgba(255,255,255,0.07);padding:1px 5px;border-radius:3px;float:right;">' + upg.cat + '</span>';
      var levelBadge = (upg.maxLevel < 99 ? '<span style="color:#888;font-size:10px;">' + purchased + '/' + upg.maxLevel + '</span>' : '');
      var maxBadge = maxed ? '<div style="color:#666;margin-top:5px;font-size:10px;font-style:italic;">MAXED OUT</div>' : '';

      card.innerHTML =
        '<div style="font-size:13px;font-weight:bold;margin-bottom:3px;">' + catBadge + upg.name + '</div>' +
        '<div style="font-size:11px;color:#bbb;margin-bottom:8px;clear:both;">' + upg.desc + '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="color:#ffcc00;font-size:13px;">💰 ' + upg.cost + '</span>' +
          levelBadge +
        '</div>' + maxBadge;

      if (!maxed) {
        card.addEventListener('mouseenter', function() { card.style.background = 'rgba(255,255,255,0.12)'; });
        card.addEventListener('mouseleave', function() { card.style.background = 'rgba(255,255,255,0.07)'; });
        card.addEventListener('click', function() {
          if (_getOKC() < upg.cost) {
            if (window.HUD && HUD.showToast) HUD.showToast('❌ Not enough OKC!', 1800, '#ff4444');
            return;
          }
          _spendOKC(upg.cost);
          if (window.HUD && HUD.updateOKC && window.Marketplace) HUD.updateOKC(Marketplace.getOKC());
          _purchased[upg.id] = (_purchased[upg.id] || 0) + 1;
          try { upg.apply(); } catch(e) {}
          if (window.AudioSystem && AudioSystem.playShopPurchase) AudioSystem.playShopPurchase();
          if (window.HUD && HUD.showToast) HUD.showToast('✅ ' + upg.name + ' purchased!', 2000, '#44ff88');
          if (_panel && _panel.parentNode) _panel.parentNode.removeChild(_panel);
          _panel = null;
          _buildPanel();
        });
      }
      grid.appendChild(card);
    });

    _panel.appendChild(grid);

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'margin-top:18px;margin-bottom:24px;padding:11px 44px;font-size:17px;background:#2a5c2a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:monospace;letter-spacing:1px;';
    closeBtn.textContent = '▶ START NEXT WAVE';
    closeBtn.addEventListener('click', hide);
    _panel.appendChild(closeBtn);

    document.body.appendChild(_panel);
  }

  return {
    show: show,
    hide: hide,
    isVisible: function() { return _visible; },
    reset: function() { _purchased = {}; _activeCategory = 'ALL'; }
  };
})();
