/* wave-shop.js — between-wave shop where player spends score to buy upgrades
   Exposed as window.WaveShop (IIFE, var-only)
*/
window.WaveShop = (function() {
  'use strict';
  // var only

  var _overlay = null;
  var _callback = null;   // called with (newScore, array of purchased item IDs)
  var _playerScore = 0;   // current score passed in
  var _purchased = [];    // items bought this shop visit

  // Shop items
  var ITEMS = [
    { id: 'HEALTH_SMALL',  name: 'Field Medkit',      icon: '💊', price: 500,   desc: 'Restore 30 HP',                  effect: function(p) { p.hp = Math.min((p.maxHp||100), p.hp+30); } },
    { id: 'HEALTH_LARGE',  name: 'Combat Medkit',      icon: '🏥', price: 1200,  desc: 'Restore 60 HP',                  effect: function(p) { p.hp = Math.min((p.maxHp||100), p.hp+60); } },
    { id: 'AMMO_REFILL',   name: 'Ammo Crate',         icon: '📦', price: 800,   desc: 'Full ammo reload',               effect: function(p) { window._shopAmmoRefill = true; } },
    { id: 'GRENADE',       name: 'Grenades x3',         icon: '💣', price: 600,   desc: '+3 grenades',                    effect: function(p) { p.grenadeCount = (p.grenadeCount||3)+3; } },
    { id: 'ARMOR_VEST',    name: 'Armor Vest',          icon: '🛡', price: 1000,  desc: '+50 armor',                      effect: function(p) { if(window.ArmorSystem) ArmorSystem.setArmor(Math.min(100,(ArmorSystem.getArmor()||0)+50)); } },
    { id: 'SPEED_BOOST',   name: 'Adrenaline Shot',     icon: '⚡', price: 700,   desc: '+15% speed next wave',           effect: function(p) { window._shopSpeedBoost = 1.15; } },
    { id: 'SCORE_MULT',    name: 'Propaganda Bonus',    icon: '📺', price: 1500,  desc: 'Score x1.5 next wave',           effect: function(p) { window._shopScoreMult = 1.5; } },
    { id: 'DAMAGE_BOOST',  name: 'AP Rounds',           icon: '🔵', price: 1800,  desc: '+25% weapon damage next wave',   effect: function(p) { window._shopDamageBoost = 1.25; } },
    { id: 'DRONE_CHARGE',  name: 'Drone Battery',       icon: '🚁', price: 900,   desc: '+5 drone payload charges',       effect: function(p) { window._shopDroneCharge = (window._shopDroneCharge||0)+5; } },
    { id: 'NV_BATTERY',    name: 'NVG Battery',          icon: '🔋', price: 400,   desc: 'Recharge night vision',          effect: function(p) { if(window.NightVision) NightVision.recharge(100); } },
  ];

  /* ── Build and show shop ──────────────────────────────────────────── */

  function show(currentScore, player, onClose) {
    if (_overlay) return;
    _playerScore = currentScore;
    _callback = onClose;
    _purchased = [];

    _overlay = document.createElement('div');
    _overlay.id = 'wave-shop';
    _overlay.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'background:rgba(0,0,0,0.9);',
      'z-index:9600;display:flex;flex-direction:column;',
      'align-items:center;justify-content:center;',
      'font-family:monospace;color:#fff;',
      'overflow-y:auto;',
    ].join('');

    _overlay.innerHTML = _buildHTML(currentScore);
    document.body.appendChild(_overlay);

    _overlay.addEventListener('click', function(e) { _handleClick(e, player); });

    // Auto-close after 20 seconds
    var _cd = 20;
    var _cdEl = _overlay.querySelector('#shop-countdown');
    var _timer = setInterval(function() {
      _cd--;
      if (_cdEl) _cdEl.textContent = _cd + 's';
      if (_cd <= 0) { clearInterval(_timer); _close(player); }
    }, 1000);
    _overlay._timer = _timer;
  }

  function _buildHTML(score) {
    var html = '<div style="max-width:700px;width:90%;padding:20px;">';
    html += '<h2 style="text-align:center;color:#ffd700;letter-spacing:3px;margin-bottom:4px;">🛒 WAVE SHOP</h2>';
    html += '<p style="text-align:center;color:#aaa;font-size:12px;margin-bottom:8px;">';
    html += 'Score: <span style="color:#ffd700">' + score.toLocaleString() + '</span>';
    html += ' | Auto-close in <span id="shop-countdown">20</span>s';
    html += '</p>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-bottom:16px;">';

    for (var i = 0; i < ITEMS.length; i++) {
      var item = ITEMS[i];
      var canAfford = score >= item.price;
      html += '<div class="shop-item" data-item="' + i + '" style="' +
        'padding:12px;text-align:center;cursor:' + (canAfford ? 'pointer' : 'default') + ';' +
        'border:1px solid ' + (canAfford ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)') + ';' +
        'background:rgba(255,255,255,' + (canAfford ? '0.05' : '0.02') + ');' +
        'border-radius:4px;opacity:' + (canAfford ? '1' : '0.4') + ';">' +
        '<div style="font-size:26px;margin-bottom:4px">' + item.icon + '</div>' +
        '<div style="font-size:12px;font-weight:bold;color:#fff;margin-bottom:2px">' + item.name + '</div>' +
        '<div style="font-size:10px;color:#aaa;margin-bottom:6px">' + item.desc + '</div>' +
        '<div style="font-size:13px;color:#ffd700;font-weight:bold">⬙ ' + item.price.toLocaleString() + '</div>' +
        '</div>';
    }

    html += '</div>';
    html += '<div style="text-align:center;">';
    html += '<button id="shop-close" style="background:#333;color:#fff;border:1px solid #555;padding:10px 30px;font-family:monospace;font-size:14px;cursor:pointer;border-radius:2px;">Close Shop (keep score)</button>';
    html += '</div></div>';
    return html;
  }

  function _handleClick(e, player) {
    var closeEl = e.target.closest && e.target.closest('#shop-close');
    if (!closeEl && e.target.id === 'shop-close') closeEl = e.target;

    if (closeEl) {
      _close(player);
      return;
    }

    var itemEl = e.target.closest && e.target.closest('[data-item]');
    if (!itemEl) {
      // fallback for browsers without closest
      var t = e.target;
      while (t && t !== _overlay) {
        if (t.getAttribute && t.getAttribute('data-item') !== null) { itemEl = t; break; }
        t = t.parentNode;
      }
    }

    if (itemEl) {
      var idx = parseInt(itemEl.getAttribute('data-item'), 10);
      var item = ITEMS[idx];
      if (!item || _playerScore < item.price) return;

      _playerScore -= item.price;
      _purchased.push(item.id);
      item.effect(player);

      // Rebuild HTML with updated score; re-attach timer reference
      var oldTimer = _overlay._timer;
      _overlay.innerHTML = _buildHTML(_playerScore);
      _overlay._timer = oldTimer;
      // Re-attach countdown display to updated element
      var _cdEl = _overlay.querySelector('#shop-countdown');
      if (_cdEl) {
        // sync remaining seconds from the stored interval logic
        // (the timer still fires against the captured _cd; just update text on next tick)
      }
      _overlay.addEventListener('click', function(e2) { _handleClick(e2, player); });

      // Flash purchase confirmation
      var flash = document.createElement('div');
      flash.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-family:monospace;font-size:18px;color:#44ff88;pointer-events:none;z-index:9700;';
      flash.textContent = '✓ ' + item.name + ' purchased!';
      document.body.appendChild(flash);
      setTimeout(function() { if(flash.parentNode) flash.parentNode.removeChild(flash); }, 1200);
    }
  }

  function _close(player) {
    if (_overlay && _overlay._timer) clearInterval(_overlay._timer);
    if (_overlay && _overlay.parentNode) {
      document.body.removeChild(_overlay);
      _overlay = null;
    }
    if (_callback) {
      _callback(_playerScore, _purchased);
      _callback = null;
    }
  }

  function shouldShow(waveNumber) {
    // Show shop every 3 waves: after wave 3, 6, 9, etc.
    return waveNumber > 0 && waveNumber % 3 === 0;
  }

  return {
    show: show,
    shouldShow: shouldShow,
    ITEMS: ITEMS,
  };
})();
