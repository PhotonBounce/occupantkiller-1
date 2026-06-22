window.Shop = (function() {
  'use strict';

  var _panel = null;
  var _visible = false;
  var _onClose = null;

  // Upgrade categories
  var UPGRADES = [
    // Weapon damage
    { id: 'dmg_1', name: '🔥 Damage Boost I', desc: '+15% weapon damage', cost: 80, maxLevel: 3,
      apply: function() { window._weaponDamageMultiplier = (window._weaponDamageMultiplier || 1) * 1.15; } },
    { id: 'dmg_2', name: '💥 Damage Boost II', desc: '+25% weapon damage', cost: 200, maxLevel: 2,
      apply: function() { window._weaponDamageMultiplier = (window._weaponDamageMultiplier || 1) * 1.25; } },
    // Fire rate
    { id: 'rof_1', name: '⚡ Rate of Fire I', desc: '-15% fire interval', cost: 90, maxLevel: 3,
      apply: function() { window._rofMultiplier = (window._rofMultiplier || 1) * 0.85; } },
    // Reload speed
    { id: 'reload_1', name: '🔄 Fast Reload', desc: '-20% reload time', cost: 70, maxLevel: 3,
      apply: function() { window._reloadMultiplier = (window._reloadMultiplier || 1) * 0.80; } },
    // Health
    { id: 'hp_1', name: '❤️ Health Pack', desc: 'Restore 50 HP', cost: 60, maxLevel: 99,
      apply: function() { if (window.GameManager && GameManager.healPlayer) GameManager.healPlayer(50); } },
    { id: 'hp_2', name: '💊 Max HP Boost', desc: '+25 max HP', cost: 150, maxLevel: 3,
      apply: function() { window._maxHPBonus = (window._maxHPBonus || 0) + 25; } },
    // Armor
    { id: 'armor_1', name: '🛡️ Body Armor', desc: '-20% incoming damage', cost: 120, maxLevel: 3,
      apply: function() { window._armorDamageReduction = (window._armorDamageReduction || 0) + 0.20; } },
    // Ammo
    { id: 'ammo_1', name: '📦 Ammo Cache', desc: 'Full ammo refill', cost: 50, maxLevel: 99,
      apply: function() { if (window.Weapons && Weapons.refillAllAmmo) Weapons.refillAllAmmo(); } },
    // Grenades
    { id: 'nade_1', name: '💣 Grenade Pack (+3)', desc: '+3 grenades', cost: 45, maxLevel: 99,
      apply: function() { window._bonusGrenades = (window._bonusGrenades || 0) + 3; } },
    // Speed
    { id: 'spd_1', name: '🏃 Sprint Boost', desc: '+20% movement speed', cost: 100, maxLevel: 2,
      apply: function() { window._speedMultiplier = (window._speedMultiplier || 1) * 1.20; } },
  ];

  var _purchased = {}; // { upgradeId: count }

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
    // Full-screen dimmed overlay
    _panel = document.createElement('div');
    _panel.id = 'shop-panel';
    _panel.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:20px;overflow-y:auto;font-family:monospace;color:#eee;';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'font-size:28px;font-weight:bold;color:#ffcc00;margin-bottom:8px;';
    header.textContent = '🏪 FIELD SHOP';
    _panel.appendChild(header);

    var okc = document.createElement('div');
    okc.id = 'shop-panel-okc';
    okc.style.cssText = 'font-size:18px;color:#44ff88;margin-bottom:16px;';
    okc.textContent = '💰 OKC: ' + _getOKC();
    _panel.appendChild(okc);

    // Grid of upgrade cards
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;width:90%;max-width:900px;';

    UPGRADES.forEach(function(upg) {
      var purchased = _purchased[upg.id] || 0;
      var maxed = purchased >= upg.maxLevel;
      var canAfford = _getOKC() >= upg.cost;

      var card = document.createElement('div');
      card.style.cssText = 'background:rgba(255,255,255,0.08);border:1px solid ' + (maxed ? '#555' : (canAfford ? '#44ff88' : '#cc4444')) + ';border-radius:8px;padding:12px;cursor:' + (maxed ? 'default' : 'pointer') + ';';

      card.innerHTML = '<div style="font-size:15px;font-weight:bold;margin-bottom:4px;">' + upg.name + '</div>' +
        '<div style="font-size:12px;color:#aaa;margin-bottom:8px;">' + upg.desc + '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="color:#ffcc00;">💰 ' + upg.cost + ' OKC</span>' +
          (upg.maxLevel < 99 ? '<span style="color:#888;font-size:11px;">' + purchased + '/' + upg.maxLevel + '</span>' : '') +
        '</div>' +
        (maxed ? '<div style="color:#888;margin-top:6px;font-size:11px;">MAXED</div>' : '');

      if (!maxed) {
        card.addEventListener('click', function() {
          if (_getOKC() < upg.cost) {
            if (window.HUD && HUD.showToast) HUD.showToast('Not enough OKC!', 2000, '#ff4444');
            return;
          }
          _spendOKC(upg.cost);
          if (window.HUD && HUD.updateOKC && window.Marketplace) HUD.updateOKC(Marketplace.getOKC());
          _purchased[upg.id] = (_purchased[upg.id] || 0) + 1;
          try { upg.apply(); } catch(e) {}
          if (window.AudioSystem && AudioSystem.playShopPurchase) AudioSystem.playShopPurchase();
          if (window.HUD && HUD.showToast) HUD.showToast('✅ ' + upg.name + ' purchased!', 2000, '#44ff88');
          // Rebuild panel to reflect new state
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
    closeBtn.style.cssText = 'margin-top:20px;padding:12px 48px;font-size:18px;background:#446644;color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:monospace;';
    closeBtn.textContent = '▶ START NEXT WAVE';
    closeBtn.addEventListener('click', hide);
    _panel.appendChild(closeBtn);

    document.body.appendChild(_panel);
  }

  return {
    show: show,
    hide: hide,
    isVisible: function() { return _visible; },
    reset: function() { _purchased = {}; }
  };
})();
