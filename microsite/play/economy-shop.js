/* economy-shop.js — Between-wave credit shop with upgrades and powerups
   Exposed as window.EconomyShop (IIFE, var-only)
   Credits global: window._credits (starts 500)
   Hooks: window._onWaveComplete, window._onEnemyKilled
*/
window.EconomyShop = (function () {
  'use strict';

  /* ── State ─────────────────────────────────────────────────────────────── */
  var _overlay = null;
  var _hudEl = null;
  var _countdownEl = null;
  var _autoCloseTimer = null;
  var _countdownInterval = null;
  var _countdownSec = 30;
  var _open = false;
  var _purchased = [];   // item IDs purchased this session

  /* ── Shop items ─────────────────────────────────────────────────────────── */
  var ITEMS = [
    {
      id: 'FULL_HEAL',
      name: 'FULL HEAL',
      icon: '💊',
      cost: 250,
      desc: 'Restore HP to maximum',
      effect: function () {
        var p = window.player;
        if (p) { p.hp = p.maxHp; if (window.HUD && HUD.setHealth) HUD.setHealth(p.hp, p.maxHp); }
        _toast('Full health restored');
      }
    },
    {
      id: 'AMMO_CRATE',
      name: 'AMMO CRATE',
      icon: '📦',
      cost: 150,
      desc: 'Refill all weapon ammo',
      effect: function () {
        window._shopAmmoRefill = true;
        _toast('Ammo refilled');
      }
    },
    {
      id: 'SPEED_BOOST',
      name: 'SPEED BOOST',
      icon: '⚡',
      cost: 300,
      desc: 'Permanent +15% move speed this run',
      effect: function () {
        window._shopSpeedBoost = (window._shopSpeedBoost || 1.0) * 1.15;
        _toast('+15% speed activated');
      }
    },
    {
      id: 'ARMOR_PLATE',
      name: 'ARMOR PLATE',
      icon: '🛡',
      cost: 400,
      desc: 'Add 75 armor points',
      effect: function () {
        window._playerArmor = (window._playerArmor || 0) + 75;
        if (window.player) { window.player.armor = (window.player.armor || 0) + 75; }
        _toast('+75 armor added');
      }
    },
    {
      id: 'GRENADE_PACK',
      name: 'GRENADE PACK',
      icon: '💣',
      cost: 200,
      desc: '+3 of each grenade type',
      effect: function () {
        var p = window.player;
        if (p) {
          p.grenades = (p.grenades || 0) + 3;
          p.smokeGrenades = (p.smokeGrenades || 0) + 3;
          p.flashGrenades = (p.flashGrenades || 0) + 3;
          if (window.HUD && HUD.setHandGrenades) HUD.setHandGrenades(p.grenades);
        }
        _toast('+3 of each grenade type');
      }
    },
    {
      id: 'ORBITAL_CHARGE',
      name: 'ORBITAL CHARGE',
      icon: '☄',
      cost: 500,
      desc: '+1 orbital strike charge',
      effect: function () {
        if (window.OrbitalStrike && OrbitalStrike._charges !== undefined) {
          OrbitalStrike._charges = (OrbitalStrike._charges || 0) + 1;
        } else {
          window._shopOrbitalCharge = (window._shopOrbitalCharge || 0) + 1;
        }
        _toast('+1 orbital strike charge');
      }
    },
    {
      id: 'NUKE_REARM',
      name: 'NUKE REARM',
      icon: '☢',
      cost: 800,
      desc: 'Rearm nuclear strike',
      effect: function () {
        if (window.NukeStrike && NukeStrike.reset) NukeStrike.reset();
        _toast('Nuke strike rearmed');
      }
    },
    {
      id: 'SENTRY_GUN',
      name: 'SENTRY GUN',
      icon: '🔫',
      cost: 350,
      desc: 'Deploy a free sentry gun next wave',
      effect: function () {
        window._shopSentryGun = (window._shopSentryGun || 0) + 1;
        _toast('Sentry gun queued for next wave');
      }
    }
  ];

  /* ── Helpers ─────────────────────────────────────────────────────────────── */

  function _toast(msg) {
    if (window.HUD && HUD.showToast) HUD.showToast(msg, 2500, '#33FF66');
  }

  function _updateHudCounter() {
    if (_hudEl) {
      _hudEl.textContent = '💰 ' + (window._credits || 0) + 'cr';
    }
  }

  function _canAfford(cost) {
    return (window._credits || 0) >= cost;
  }

  function _deductCredits(cost) {
    window._credits = Math.max(0, (window._credits || 0) - cost);
    _updateHudCounter();
  }

  /* ── Build shop HTML ─────────────────────────────────────────────────────── */

  function _buildItemCard(item, idx) {
    var alreadyBought = _purchased.indexOf(item.id) !== -1;
    var canBuy = !alreadyBought && _canAfford(item.cost);
    var cardStyle = [
      'display:inline-flex;flex-direction:column;align-items:center;justify-content:space-between;',
      'width:100px;height:130px;',
      'background:rgba(10,20,10,0.95);',
      'border:1px solid ' + (alreadyBought ? '#555' : '#33FF66') + ';',
      'border-radius:4px;',
      'padding:6px 4px;',
      'box-sizing:border-box;',
      'opacity:' + (alreadyBought ? '0.45' : (canBuy ? '1' : '0.6')) + ';',
      'cursor:' + (alreadyBought || !canBuy ? 'default' : 'pointer') + ';',
      'transition:border-color 0.15s,transform 0.1s;',
      'vertical-align:top;',
    ].join('');
    var iconStyle = 'font-size:26px;line-height:1;margin-bottom:2px;';
    var nameStyle = 'font-size:9px;font-weight:bold;color:#33FF66;text-align:center;letter-spacing:0.5px;margin-bottom:2px;';
    var descStyle = 'font-size:7.5px;color:#aaa;text-align:center;flex:1;line-height:1.2;';
    var btnText = alreadyBought ? 'PURCHASED' : (item.cost + 'cr');
    var btnStyle = [
      'margin-top:4px;',
      'padding:2px 6px;',
      'font-size:8px;font-weight:bold;',
      'background:' + (alreadyBought ? '#333' : (canBuy ? '#1a4a1a' : '#2a1a1a')) + ';',
      'color:' + (alreadyBought ? '#666' : (canBuy ? '#33FF66' : '#884444')) + ';',
      'border:1px solid ' + (alreadyBought ? '#444' : (canBuy ? '#33FF66' : '#884444')) + ';',
      'border-radius:2px;cursor:inherit;width:100%;',
    ].join('');

    return '<div class="es-item" data-es-idx="' + idx + '" style="' + cardStyle + '">' +
      '<span style="' + iconStyle + '">' + item.icon + '</span>' +
      '<div style="' + nameStyle + '">' + item.name + '</div>' +
      '<div style="' + descStyle + '">' + item.desc + '</div>' +
      '<button style="' + btnStyle + '">' + btnText + '</button>' +
      '</div>';
  }

  function _buildHTML() {
    var credits = window._credits || 0;
    var gridStyle = [
      'display:flex;flex-wrap:wrap;gap:10px;',
      'justify-content:center;max-width:900px;',
      'margin:12px auto;',
    ].join('');
    var cards = '';
    for (var i = 0; i < ITEMS.length; i++) {
      cards += _buildItemCard(ITEMS[i], i);
    }
    return '<div id="es-inner" style="max-width:920px;width:100%;margin:auto;padding:20px;box-sizing:border-box;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
        '<div style="font-size:28px;font-weight:bold;color:#FFD700;letter-spacing:3px;">⚔ ARMORY</div>' +
        '<div style="font-size:16px;color:#FFD700;font-weight:bold;">💰 ' + credits + 'cr</div>' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span id="es-countdown" style="font-size:12px;color:#aaa;">Auto-close: 30s</span>' +
          '<button id="es-close-btn" style="' +
            'background:#111;color:#33FF66;border:1px solid #33FF66;' +
            'padding:4px 12px;font-size:13px;cursor:pointer;border-radius:2px;font-weight:bold;' +
          '">[X] CLOSE</button>' +
        '</div>' +
      '</div>' +
      '<div id="es-grid" style="' + gridStyle + '">' + cards + '</div>' +
      '<div style="font-size:10px;color:#666;text-align:center;margin-top:8px;">' +
        'Press [B] or click X to close &nbsp;|&nbsp; Tab to reopen mid-wave' +
      '</div>' +
    '</div>';
  }

  /* ── Refresh grid without closing ─────────────────────────────────────────── */

  function _refreshGrid() {
    var grid = document.getElementById('es-grid');
    if (!grid) return;
    var html = '';
    for (var i = 0; i < ITEMS.length; i++) {
      html += _buildItemCard(ITEMS[i], i);
    }
    grid.innerHTML = html;
    // Update credits display
    var credEl = document.querySelector('#es-inner > div > div:nth-child(2)');
    if (credEl) credEl.textContent = '💰 ' + (window._credits || 0) + 'cr';
  }

  /* ── Open / Close ─────────────────────────────────────────────────────────── */

  function openShop() {
    if (_overlay) return;
    _open = true;
    _purchased = [];
    _countdownSec = 30;

    _overlay = document.createElement('div');
    _overlay.id = 'economy-shop-overlay';
    _overlay.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'background:rgba(0,0,0,0.92);',
      'z-index:9700;display:flex;flex-direction:column;',
      'align-items:center;justify-content:center;',
      'font-family:monospace;color:#fff;',
      'border:2px solid #33FF66;',
      'box-sizing:border-box;',
      'overflow-y:auto;',
    ].join('');

    _overlay.innerHTML = _buildHTML();
    document.body.appendChild(_overlay);

    _countdownEl = document.getElementById('es-countdown');

    // Close button
    var closeBtn = document.getElementById('es-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeShop);

    // Item click delegation
    _overlay.addEventListener('click', _handleClick);

    // Auto-close countdown
    _countdownInterval = setInterval(function () {
      _countdownSec--;
      if (_countdownEl) _countdownEl.textContent = 'Auto-close: ' + _countdownSec + 's';
      if (_countdownSec <= 0) closeShop();
    }, 1000);

    // Pause game if possible
    if (window._wavePaused !== undefined) window._wavePaused = true;
  }

  function closeShop() {
    if (!_overlay) return;
    _open = false;
    if (_autoCloseTimer) { clearTimeout(_autoCloseTimer); _autoCloseTimer = null; }
    if (_countdownInterval) { clearInterval(_countdownInterval); _countdownInterval = null; }
    document.body.removeChild(_overlay);
    _overlay = null;
    _countdownEl = null;
    // Resume game
    if (window._wavePaused !== undefined) window._wavePaused = false;
  }

  /* ── Click handler ─────────────────────────────────────────────────────────── */

  function _handleClick(e) {
    var target = e.target;
    // Walk up to find es-item
    var card = null;
    while (target && target !== _overlay) {
      if (target.classList && target.classList.contains('es-item')) { card = target; break; }
      target = target.parentNode;
    }
    if (!card) return;

    var idx = parseInt(card.getAttribute('data-es-idx'), 10);
    if (isNaN(idx) || idx < 0 || idx >= ITEMS.length) return;

    var item = ITEMS[idx];
    if (_purchased.indexOf(item.id) !== -1) return;
    if (!_canAfford(item.cost)) {
      _toast('Not enough credits — need ' + item.cost + 'cr');
      return;
    }

    _deductCredits(item.cost);
    _purchased.push(item.id);
    item.effect();
    _refreshGrid();
  }

  /* ── Keyboard handler ─────────────────────────────────────────────────────── */

  function _onKeyDown(e) {
    var key = e.key || '';
    if (key === 'b' || key === 'B' || key === 'Escape') {
      if (_open) { closeShop(); return; }
    }
    if (key === 'Tab') {
      e.preventDefault();
      if (_open) { closeShop(); } else { openShop(); }
    }
  }

  /* ── HUD credit counter ───────────────────────────────────────────────────── */

  function _createHudCounter() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'economy-shop-credits';
    _hudEl.style.cssText = [
      'position:fixed;top:8px;right:8px;',
      'background:rgba(0,0,0,0.7);',
      'color:#FFD700;',
      'font-family:monospace;font-size:14px;font-weight:bold;',
      'padding:4px 8px;border-radius:3px;',
      'border:1px solid #FFD700;',
      'z-index:9500;',
      'pointer-events:none;',
      'user-select:none;',
    ].join('');
    _hudEl.textContent = '💰 ' + (window._credits || 0) + 'cr';
    document.body.appendChild(_hudEl);
  }

  /* ── Hooks ─────────────────────────────────────────────────────────────────── */

  function _hookWaveComplete() {
    var prev = window._onWaveComplete;
    window._onWaveComplete = function (n) {
      if (prev) prev(n);
      setTimeout(openShop, 3000);
    };
  }

  function _hookEnemyKilled() {
    var prev = window._onEnemyKilled;
    window._onEnemyKilled = function (enemy) {
      if (prev) prev(enemy);
      var award = 50;
      window._credits = (window._credits || 0) + award;
      _updateHudCounter();
    };
  }

  /* ── Public API ─────────────────────────────────────────────────────────────── */

  function init() {
    // Initialise global credit balance
    if (typeof window._credits !== 'number') {
      window._credits = 500;
    }

    _createHudCounter();
    _hookWaveComplete();
    _hookEnemyKilled();

    document.addEventListener('keydown', _onKeyDown);
  }

  function update() {
    // Nothing to update per-frame currently; reserved for future use
  }

  function reset() {
    closeShop();
    window._credits = 500;
    _purchased = [];
    _updateHudCounter();
  }

  return {
    init: init,
    update: update,
    openShop: openShop,
    closeShop: closeShop,
    reset: reset
  };
})();
