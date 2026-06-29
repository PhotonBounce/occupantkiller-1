const UIManager = (function() {
  'use strict';

  /* ── Private state ─────────────────────────────────────────────── */
  var _callbacks = {};

  /* ── Dependency helpers (placeholder callbacks for GameManager) ──── */
  function _get(name) {
    if (_callbacks[name] !== undefined) return _callbacks[name];
    if (typeof window !== 'undefined' && window[name] !== undefined) return window[name];
    return undefined;
  }

  function _getSystem(name) {
    return _get(name) || {};
  }

  function _getPlayer() {
    return _get('player') || {};
  }

  function _getTouch() {
    return _get('touch') || {};
  }

  function _getState() {
    return _get('gameState');
  }

  function _setState(val) {
    if (typeof _callbacks.setGameState === 'function') {
      _callbacks.setGameState(val);
    } else if (typeof window !== 'undefined' && window.gameState !== undefined) {
      window.gameState = val;
    }
  }

  function _getSTATE() {
    return _get('STATE') || {};
  }

  function _call(name /*, args... */) {
    var fn = _callbacks[name];
    if (typeof fn === 'function') {
      return fn.apply(null, Array.prototype.slice.call(arguments, 1));
    }
    if (typeof window !== 'undefined' && typeof window[name] === 'function') {
      return window[name].apply(null, Array.prototype.slice.call(arguments, 1));
    }
    return undefined;
  }

  /* ── Internal helper (replicated from GameManager) ─────────────── */
  function _releaseMouseForUI() {
    try {
      if (typeof document.exitPointerLock === 'function' && document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch (_) {}
    try { document.body.style.cursor = 'auto'; } catch (_) {}
  }

  /* ── Overlay helpers ───────────────────────────────────────────── */
  function showOverlay(name) {
    document.querySelectorAll('.overlay').forEach(function (el) { el.style.display = 'none'; });
    // Unified pause: redirect legacy 'pause' to inventory-overlay
    if (name === 'pause') {
      var inv = document.getElementById('inventory-overlay');
      if (inv) {
        if (typeof showInventory === 'function') showInventory();
        inv.style.display = 'flex';
        _releaseMouseForUI();
        return;
      }
    }
    var el = document.getElementById('overlay-' + name);
    if (el) el.style.display = 'flex';
    _releaseMouseForUI();
  }

  function hideOverlays() {
    document.querySelectorAll('.overlay').forEach(function (el) { el.style.display = 'none'; });
    // Release any stuck mobile look touch when overlays change
    var touch = _getTouch();
    touch.lookTouchId = null;
    touch.lookActive = false;
    touch.lookX = 0;
    touch.lookY = 0;
    try { var _lz = document.getElementById('mobile-look-zone'); if (_lz) _lz.classList.remove('look-active'); } catch (_e) {}
  }

  /* ── Inventory / Pause / Menu ──────────────────────────────────── */
  function showInventory() {
    // ── Materials / Resources section ──
    var matGrid = document.getElementById('materials-grid');
    if (matGrid) {
      matGrid.innerHTML = '';
      var resIcons = { wood: 'W', metal: 'M', electronics: 'E', fuel: 'F', stone: 'S', food: 'Fd' };
      var resColors = { wood: '#8B6914', metal: '#aaa', electronics: '#00ccff', fuel: '#ff8800', stone: '#999', food: '#aacc44' };
      var Economy = _getSystem('Economy');
      var resources = (typeof Economy.getResources === 'function') ? Economy.getResources() : {};
      for (var resType in resources) {
        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid ' + (resColors[resType] || '#555') + ';border-radius:4px;padding:6px;text-align:center';
        cell.innerHTML = '<div style="font-size:20px">' + (resIcons[resType] || '📦') + '</div>' +
          '<div style="font-size:11px;color:#ccc;text-transform:uppercase">' + resType + '</div>' +
          '<div style="font-size:16px;font-weight:bold;color:' + (resColors[resType] || '#fff') + '">' + resources[resType] + '</div>';
        matGrid.appendChild(cell);
      }
    }
    var currDisplay = document.getElementById('currency-display');
    if (currDisplay) {
      var Economy = _getSystem('Economy');
      currDisplay.textContent = '💰 Currency: ' + ((typeof Economy.getCurrency === 'function') ? Economy.getCurrency() : 0) + ' gold';
    }

    // ── Weapons grid ──
    var grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var Weapons = _getSystem('Weapons');
    var count = (typeof Weapons.getWeaponCount === 'function') ? Weapons.getWeaponCount() : 0;
    var curIdx = (typeof Weapons.getCurrentIdx === 'function') ? Weapons.getCurrentIdx() : 0;
    for (var i = 0; i < count; i++) {
      var slot = document.createElement('div');
      slot.className = 'inv-slot';
      var isUnlocked = (typeof Weapons.isUnlocked === 'function') ? Weapons.isUnlocked(i) : false;
      if (!isUnlocked) {
        slot.classList.add('locked');
        slot.textContent = '🔒 ' + ((typeof Weapons.getWeaponName === 'function') ? Weapons.getWeaponName(i) : '');
      } else {
        var info = (typeof Weapons.getWeaponInfo === 'function') ? Weapons.getWeaponInfo(i) : null;
        if (i === curIdx) slot.classList.add('active');
        slot.textContent = (info ? info.name : '') + '\n⚔' + (info ? info.damage : 0);
        if (info && info.clip !== undefined && info.type !== 'MELEE') {
          slot.textContent += ' | ' + info.clip + '/' + info.reserve;
        }
      }
      slot.style.whiteSpace = 'pre-line';

      // Allow tapping to switch weapons
      if (isUnlocked) {
        (function (idx) {
          slot.addEventListener('click', function () {
            if (typeof Weapons.switchTo === 'function') Weapons.switchTo(idx);
            showInventory();
          });
        })(i);
      }
      grid.appendChild(slot);
    }

    var statsEl = document.getElementById('player-stats');
    if (statsEl) {
      var STAGES = _get('STAGES') || [];
      var currentStage = _get('currentStage') || 0;
      var stage = STAGES[currentStage] || {};
      var player = _getPlayer();
      var npcCount = 0;
      var NPCSystem = _getSystem('NPCSystem');
      if (typeof NPCSystem.getAll === 'function') npcCount = NPCSystem.getAll().length;
      var vehicleCount = 0;
      var VehicleSystem = _getSystem('VehicleSystem');
      if (typeof VehicleSystem.getAll === 'function') vehicleCount = VehicleSystem.getAll().length;
      var droneCount = 0;
      var DroneSystem = _getSystem('DroneSystem');
      if (typeof DroneSystem.getAll === 'function') droneCount = DroneSystem.getAll().length;
      statsEl.innerHTML =
        '❤ HP: ' + (player.hp || 0) + '/' + (player.maxHp || 0) +
        ' &nbsp;|&nbsp; 🏆 Score: ' + (player.score || 0) +
        ' &nbsp;|&nbsp; 💀 Kills: ' + (player.kills || 0) +
        '<br>📍 Stage ' + (stage.id || '') + ': ' + (stage.name || '') +
        ' &nbsp;|&nbsp; 🌊 Wave: ' + (_get('currentWave') || 0) + '/' + (stage.wavesPerStage || 0) +
        '<br>👥 NPCs: ' + npcCount +
        ' &nbsp;|&nbsp; 🚗 Vehicles: ' + vehicleCount +
        ' &nbsp;|&nbsp; 🛸 Drones: ' + droneCount;
    }
  }

  function toggleInventory() {
    var invOverlay = document.getElementById('inventory-overlay');
    if (!invOverlay) return;
    var STATE = _getSTATE();
    var gameState = _getState();
    if (gameState === STATE.PLAYING || gameState === STATE.BUILD_MODE) {
      _setState(STATE.PAUSED);
      try { showInventory(); } catch (e) {}
      invOverlay.style.display = 'flex';
      _releaseMouseForUI();
      _call('updateMobileControlsVisibility');
    } else if (gameState === STATE.PAUSED) {
      _setState(STATE.PLAYING);
      invOverlay.style.display = 'none';
      hideOverlays();
      _call('updateMobileControlsVisibility');
      _call('requestPointerLock');
    }
  }

  function resumeFromPause() {
    var invOverlay = document.getElementById('inventory-overlay');
    var pauseOverlay = document.getElementById('overlay-pause');
    if (invOverlay) invOverlay.style.display = 'none';
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    hideOverlays();
    var STATE = _getSTATE();
    _setState(STATE.PLAYING);
    _call('updateMobileControlsVisibility');
    _call('requestPointerLock');
  }

  function quitToMenu() {
    var invOverlay = document.getElementById('inventory-overlay');
    var pauseOverlay = document.getElementById('overlay-pause');
    if (invOverlay) invOverlay.style.display = 'none';
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    hideOverlays();
    showOverlay('start');
    var STATE = _getSTATE();
    _setState(STATE.MENU);
    var AudioSystem = _getSystem('AudioSystem');
    if (AudioSystem && typeof AudioSystem.stopAmbientLoop === 'function') AudioSystem.stopAmbientLoop();
    _call('updateMobileControlsVisibility');
  }

  /* ── HUD helpers ───────────────────────────────────────────────── */
  function updateExtendedHUD() {
    var TimeSystem = _getSystem('TimeSystem');
    var timeEl = document.getElementById('hud-time');
    if (timeEl) {
      var info = (typeof TimeSystem.getInfo === 'function') ? TimeSystem.getInfo() : {};
      timeEl.textContent = (info.time || '') + ' ' + (info.phase || '').toUpperCase() +
        ' | Day ' + (info.day || 0) + ' | ' + (info.season || '') +
        (info.speed > 1 ? ' [x' + info.speed + ']' : '') +
        (info.isPaused ? ' [PAUSED]' : '');
    }

    var RankSystem = _getSystem('RankSystem');
    var rankEl = document.getElementById('hud-rank');
    if (rankEl) {
      var rank = (typeof RankSystem.getRank === 'function') ? RankSystem.getRank() : {};
      var prog = (typeof RankSystem.getProgress === 'function') ? RankSystem.getProgress() : {};
      rankEl.textContent = (rank.icon || '') + ' ' + (rank.name || '') +
        ' (' + Math.floor(prog.percent || 0) + '%)';
    }

    var Economy = _getSystem('Economy');
    var resEl = document.getElementById('hud-resources');
    if (resEl) {
      var r = (typeof Economy.getResources === 'function') ? Economy.getResources() : {};
      resEl.innerHTML =
        '<span style="color:#8B6914" title="Wood">W' + (r.wood || 0) + '</span> ' +
        '<span style="color:#aaa" title="Metal">M' + (r.metal || 0) + '</span> ' +
        '<span style="color:#00ccff" title="Electronics">E' + (r.electronics || 0) + '</span> ' +
        '<span style="color:#ff8800" title="Fuel">F' + (r.fuel || 0) + '</span> ' +
        '<span style="color:#999" title="Stone">S' + (r.stone || 0) + '</span> ' +
        '<span style="color:#aacc44" title="Food">Fd' + (r.food || 0) + '</span> ' +
        '| <span style="color:#ffcc00" title="Currency">$' + ((typeof Economy.getCurrency === 'function') ? Economy.getCurrency() : 0) + '</span>';
    }

    var CameraSystem = _getSystem('CameraSystem');
    var modeEl = document.getElementById('hud-mode');
    if (modeEl) {
      var mode = (typeof CameraSystem.getMode === 'function') ? CameraSystem.getMode() : 'fps';
      var modeNames = { fps: 'FPS', tps: '3RD PERSON', rts: 'STRATEGIC', drone: 'DRONE FPV', vehicle: 'VEHICLE' };
      var label = modeNames[mode] || mode;
      var STATE = _getSTATE();
      var gameState = _getState();
      if (gameState === STATE.BUILD_MODE) label = 'BUILD MODE';
      var DroneSystem = _getSystem('DroneSystem');
      if (typeof DroneSystem.isPossessing === 'function' && DroneSystem.isPossessing()) {
        var d = (typeof DroneSystem.getPossessed === 'function') ? DroneSystem.getPossessed() : {};
        label = 'DRONE: ' + (d.type || '').toUpperCase() + ' [' + Math.floor(d.battery || 0) + 's]';
      }
      var VehicleSystem = _getSystem('VehicleSystem');
      if (typeof VehicleSystem.isInVehicle === 'function' && VehicleSystem.isInVehicle()) {
        var v = (typeof VehicleSystem.getOccupied === 'function') ? VehicleSystem.getOccupied() : {};
        label = 'VEHICLE: ' + (v.type || '').toUpperCase() + ' [' + (v.health || 0) + '/' + (v.maxHealth || 0) + ']';
      }
      modeEl.textContent = label;
    }

    var NPCSystem = _getSystem('NPCSystem');
    var npcEl = document.getElementById('hud-npcs');
    if (npcEl) {
      npcEl.textContent = 'NPCs: ' + ((typeof NPCSystem.getCount === 'function') ? NPCSystem.getCount() : 0) +
        ' | Morale: ' + Math.floor((typeof NPCSystem.getAverageMorale === 'function') ? NPCSystem.getAverageMorale() : 0) + '%';
    }

    var MissionSystem = _getSystem('MissionSystem');
    var missionEl = document.getElementById('hud-missions');
    if (missionEl) {
      var active = (typeof MissionSystem.getActive === 'function') ? MissionSystem.getActive() : [];
      if (active.length > 0) {
        missionEl.textContent = '📋 ' + active[0].name + ' (' + active[0].status + ')';
      } else {
        missionEl.textContent = '📋 No active missions';
      }
    }
  }

  function updateAIIndicator(strategy) {
    var aiEl = document.getElementById('ai-learning-indicator');
    if (!aiEl) return;
    if (!strategy) {
      aiEl.style.display = 'none';
      return;
    }
    aiEl.style.display = 'block';
    var levels = ['📡 LEARNING', '🔄 ADAPTING', '🧠 COUNTERING'];
    var colors = ['#888888', '#ffaa00', '#ff00ff'];
    var MLSystem = _getSystem('MLSystem');
    var summary = (typeof MLSystem.getBehaviorSummary === 'function') ? MLSystem.getBehaviorSummary() : {};
    aiEl.textContent = levels[strategy.adaptationLevel] + ' | Style: ' +
      (summary.style || '').toUpperCase() + ' (' + Math.round((summary.confidence || 0) * 100) + '%)';
    aiEl.style.color = colors[strategy.adaptationLevel];
    aiEl.style.borderColor = colors[strategy.adaptationLevel];
  }

  /* ── Weapons grid helper ───────────────────────────────────────── */
  function populateWeaponsGrid(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    var Weapons = _getSystem('Weapons');
    var count = (typeof Weapons.getWeaponCount === 'function') ? Weapons.getWeaponCount() : 0;
    for (var i = 0; i < count; i++) {
      var info = (typeof Weapons.getWeaponInfo === 'function') ? Weapons.getWeaponInfo(i) : null;
      if (!info) continue;
      var cell = document.createElement('div');
      cell.style.cssText = 'background:rgba(255,255,255,0.06);border:1px solid #444;padding:4px;border-radius:3px;text-align:center;color:#ccc';
      var key = i < 9 ? String(i + 1) : (i === 9 ? '0' : '');
      cell.innerHTML = '<div style="color:#fff;font-weight:bold;font-size:11px">' + (key ? '[' + key + '] ' : '') + info.name + '</div>' +
        '<div style="font-size:9px;color:#aaa">' + info.type + ' · DMG ' + info.damage + '</div>';
      el.appendChild(cell);
    }
  }

  /* ── Marketplace UI Builder ────────────────────────────────────── */
  function refreshMarketplaceUI(tab) {
    var Marketplace = _getSystem('Marketplace');
    var okc = (typeof Marketplace.getOKC === 'function') ? Marketplace.getOKC() : 0;
    var okcEl = document.getElementById('inv-okc-display');
    if (okcEl) okcEl.textContent = '🪙 ' + okc + ' OKC';
    var hudOkc = document.getElementById('hud-okc');
    if (hudOkc) hudOkc.textContent = '🪙 ' + okc + ' OKC';

    var premTag = document.getElementById('hud-premium-tag');
    if (premTag && typeof Marketplace.isPremium === 'function' && Marketplace.isPremium()) {
      var pi = (typeof Marketplace.getPremiumInfo === 'function') ? Marketplace.getPremiumInfo() : {};
      premTag.textContent = pi.name + ' (' + pi.daysLeft + 'd)';
      premTag.style.display = 'inline';
    } else if (premTag) {
      premTag.style.display = 'none';
    }

    if (tab === 'shop') { buildShopUI(); }
    else if (tab === 'sell') { buildSellUI(); }
    else if (tab === 'premium') { buildPremiumUI(); }
    else if (tab === 'assets') { buildAssetsUI(); }
  }

  function buildShopUI() {
    var grid = document.getElementById('shop-items-grid');
    var Marketplace = _getSystem('Marketplace');
    var HUD = _getSystem('HUD');
    if (!grid || typeof Marketplace.getShopItems !== 'function') return;
    grid.innerHTML = '';
    var items = Marketplace.getShopItems();
    for (var i = 0; i < items.length; i++) {
      (function (idx) {
        var it = items[idx];
        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(255,215,0,0.05);border:1px solid #555;border-radius:6px;padding:8px;text-align:center';
        var discOkc = (typeof Marketplace.getDiscountedPrice === 'function') ? Marketplace.getDiscountedPrice(it.okcCost) : it.okcCost;
        cell.innerHTML =
          '<div style="color:#fff;font-weight:bold;font-size:12px">' + it.name + '</div>' +
          '<div style="font-size:10px;color:#ffd700;margin:4px 0">🪙 ' + discOkc + ' OKC | 💎 ' + it.polCost + ' POL</div>';
        var btnOkc = document.createElement('button');
        btnOkc.className = 'btn';
        btnOkc.style.cssText = 'font-size:10px;padding:2px 8px;border-color:#ffd700;color:#ffd700;margin:2px';
        btnOkc.textContent = 'Buy (OKC)';
        btnOkc.addEventListener('click', function () {
          var result = (typeof Marketplace.buyItemWithOKC === 'function') ? Marketplace.buyItemWithOKC(idx) : null;
          if (result) {
            applyShopItem(result);
            if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('✅ ' + result.name, '#ffd700');
            refreshMarketplaceUI('shop');
          } else {
            if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('❌ Not enough OKC', '#ff4444');
          }
        });
        cell.appendChild(btnOkc);

        var btnPol = document.createElement('button');
        btnPol.className = 'btn';
        btnPol.style.cssText = 'font-size:10px;padding:2px 8px;border-color:#8247e5;color:#8247e5;margin:2px';
        btnPol.textContent = 'Buy (POL)';
        btnPol.addEventListener('click', function () {
          if (typeof Marketplace.buyItemWithPOL === 'function') {
            Marketplace.buyItemWithPOL(idx).then(function (result) {
              if (result) {
                applyShopItem(result);
                if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('✅ ' + result.name + ' (POL)', '#8247e5');
                refreshMarketplaceUI('shop');
              } else {
                if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('❌ Transaction failed', '#ff4444');
              }
            });
          }
        });
        cell.appendChild(btnPol);
        grid.appendChild(cell);
      })(i);
    }
  }

  function applyShopItem(item) {
    var Weapons = _getSystem('Weapons');
    var HUD = _getSystem('HUD');
    var player = _getPlayer();
    if (item.type === 'ammo') {
      if (typeof Weapons.addAmmo === 'function') Weapons.addAmmo(item.value);
    } else if (item.type === 'health') {
      player.hp = Math.min(player.maxHp || 100, (player.hp || 0) + item.value);
      if (typeof HUD.setHealth === 'function') HUD.setHealth(player.hp, player.maxHp);
    } else if (item.type === 'armor') {
      player.maxHp = (player.maxHp || 100) + item.value;
      player.hp = (player.hp || 0) + item.value;
      if (typeof HUD.setHealth === 'function') HUD.setHealth(player.hp, player.maxHp);
    } else if (item.type === 'grenade') {
      if (!player.godMode) player.grenades = Math.min(99, (player.grenades || 0) + (item.value || 1));
      if (typeof HUD.setHandGrenades === 'function') HUD.setHandGrenades(player.godMode ? Infinity : player.grenades);
    }
  }

  function buildSellUI() {
    var grid = document.getElementById('sell-weapons-grid');
    var ammoGrid = document.getElementById('sell-ammo-grid');
    var Marketplace = _getSystem('Marketplace');
    var Weapons = _getSystem('Weapons');
    var HUD = _getSystem('HUD');
    if (!grid || typeof Marketplace.getWeaponPriceOKC !== 'function') return;
    grid.innerHTML = '';
    if (ammoGrid) ammoGrid.innerHTML = '';
    var count = (typeof Weapons.getWeaponCount === 'function') ? Weapons.getWeaponCount() : 0;
    for (var i = 0; i < count; i++) {
      (function (idx) {
        var info = (typeof Weapons.getWeaponInfo === 'function') ? Weapons.getWeaponInfo(idx) : null;
        if (!info) return;
        var priceOkc = (typeof Marketplace.getWeaponPriceOKC === 'function') ? Marketplace.getWeaponPriceOKC(info.id || (typeof Weapons.getWeaponId === 'function' ? Weapons.getWeaponId(idx) : idx)) : 0;
        var pricePol = (typeof Marketplace.getWeaponPricePOL === 'function') ? Marketplace.getWeaponPricePOL(info.id || (typeof Weapons.getWeaponId === 'function' ? Weapons.getWeaponId(idx) : idx)) : 0;
        if (priceOkc <= 0) return;
        if (!(typeof Weapons.isUnlocked === 'function' && Weapons.isUnlocked(idx))) return;

        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(255,136,68,0.05);border:1px solid #555;border-radius:6px;padding:6px;text-align:center';
        cell.innerHTML =
          '<div style="color:#fff;font-size:11px;font-weight:bold">' + info.name + '</div>' +
          '<div style="font-size:10px;color:#ff8844;margin:2px 0">🪙 ' + priceOkc + ' OKC | 💎 ' + pricePol + ' POL</div>';

        var sellBtn = document.createElement('button');
        sellBtn.className = 'btn';
        sellBtn.style.cssText = 'font-size:10px;padding:2px 8px;border-color:#ff8844;color:#ff8844;margin:2px';
        sellBtn.textContent = 'Sell (OKC)';
        sellBtn.addEventListener('click', function () {
          var earned = (typeof Marketplace.sellWeaponForOKC === 'function') ? Marketplace.sellWeaponForOKC(idx) : 0;
          if (earned > 0) {
            if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('💰 Sold for ' + earned + ' OKC', '#ffd700');
            refreshMarketplaceUI('sell');
          }
        });
        cell.appendChild(sellBtn);
        grid.appendChild(cell);

        var state = (typeof Weapons.getWeaponState === 'function') ? Weapons.getWeaponState(idx) : null;
        if (state && state.reserve > 0 && ammoGrid) {
          var aCell = document.createElement('div');
          aCell.style.cssText = 'background:rgba(255,136,68,0.05);border:1px solid #444;border-radius:6px;padding:6px;text-align:center';
          var sellAmt = Math.min(state.reserve, 50);
          var ammoVal = sellAmt * 2;
          aCell.innerHTML =
            '<div style="color:#ccc;font-size:10px">' + info.name + ' ammo (' + state.reserve + ')</div>' +
            '<div style="font-size:10px;color:#ffd700">Sell ' + sellAmt + ' → 🪙 ' + ammoVal + ' OKC</div>';
          var aSellBtn = document.createElement('button');
          aSellBtn.className = 'btn';
          aSellBtn.style.cssText = 'font-size:9px;padding:2px 6px;border-color:#ff8844;color:#ff8844;margin:2px';
          aSellBtn.textContent = 'Sell Ammo';
          aSellBtn.addEventListener('click', function () {
            var earned = (typeof Marketplace.sellAmmoForOKC === 'function') ? Marketplace.sellAmmoForOKC(idx, sellAmt) : 0;
            if (earned > 0) {
              if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('💰 Sold ammo for ' + earned + ' OKC', '#ffd700');
              refreshMarketplaceUI('sell');
            }
          });
          aCell.appendChild(aSellBtn);
          ammoGrid.appendChild(aCell);
        }
      })(i);
    }
  }

  function buildPremiumUI() {
    var grid = document.getElementById('premium-tiers-grid');
    var status = document.getElementById('premium-status');
    var Marketplace = _getSystem('Marketplace');
    var HUD = _getSystem('HUD');
    if (!grid || typeof Marketplace.getPremiumTiers !== 'function') return;
    grid.innerHTML = '';

    if (typeof Marketplace.isPremium === 'function' && Marketplace.isPremium()) {
      var pi = (typeof Marketplace.getPremiumInfo === 'function') ? Marketplace.getPremiumInfo() : {};
      if (status) {
        status.style.display = 'block';
        status.innerHTML = '✅ Active: <b>' + pi.name + '</b> — ' + pi.daysLeft + ' days remaining';
      }
    } else if (status) {
      status.style.display = 'none';
    }

    var tiers = Marketplace.getPremiumTiers();
    for (var i = 0; i < tiers.length; i++) {
      (function (idx) {
        var tier = tiers[idx];
        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(130,71,229,0.08);border:1px solid #8247e5;border-radius:8px;padding:10px;text-align:center';
        var perksHtml = tier.perks.map(function (p) { return '<div style="font-size:9px;color:#aaa">• ' + p + '</div>'; }).join('');
        cell.innerHTML =
          '<div style="color:#fff;font-weight:bold;font-size:13px">' + tier.name + '</div>' +
          '<div style="font-size:11px;color:#8247e5;margin:4px 0">' + tier.duration + ' days</div>' +
          perksHtml +
          '<div style="font-size:11px;color:#ffd700;margin:6px 0">🪙 ' + tier.okcCost + ' OKC | 💎 ' + tier.polCost + ' POL</div>';

        var btnOkc = document.createElement('button');
        btnOkc.className = 'btn';
        btnOkc.style.cssText = 'font-size:10px;padding:3px 8px;border-color:#ffd700;color:#ffd700;margin:2px';
        btnOkc.textContent = 'Buy (OKC)';
        btnOkc.addEventListener('click', function () {
          if (typeof Marketplace.buyPremiumWithOKC === 'function' && Marketplace.buyPremiumWithOKC(idx)) {
            if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('⭐ ' + tier.name + ' activated!', '#8247e5');
            refreshMarketplaceUI('premium');
          } else {
            if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('❌ Not enough OKC', '#ff4444');
          }
        });
        cell.appendChild(btnOkc);

        var btnPol = document.createElement('button');
        btnPol.className = 'btn';
        btnPol.style.cssText = 'font-size:10px;padding:3px 8px;border-color:#8247e5;color:#8247e5;margin:2px';
        btnPol.textContent = 'Buy (POL)';
        btnPol.addEventListener('click', function () {
          if (typeof Marketplace.buyPremiumWithPOL === 'function') {
            Marketplace.buyPremiumWithPOL(idx).then(function (ok) {
              if (ok) {
                if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('⭐ ' + tier.name + ' activated! (POL)', '#8247e5');
                refreshMarketplaceUI('premium');
              } else {
                if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('❌ Transaction failed', '#ff4444');
              }
            });
          }
        });
        cell.appendChild(btnPol);
        grid.appendChild(cell);
      })(i);
    }
  }

  function buildAssetsUI() {
    var grid = document.getElementById('assets-grid');
    var Marketplace = _getSystem('Marketplace');
    var HUD = _getSystem('HUD');
    if (!grid || typeof Marketplace.getGameAssets !== 'function') return;
    grid.innerHTML = '';
    var assets = Marketplace.getGameAssets();
    for (var i = 0; i < assets.length; i++) {
      (function (idx) {
        var asset = assets[idx];
        var owned = (typeof Marketplace.ownsAsset === 'function') ? Marketplace.ownsAsset(asset.id) : false;
        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(0,255,204,0.05);border:1px solid ' + (owned ? '#0f6' : '#555') + ';border-radius:6px;padding:8px;text-align:center';
        cell.innerHTML =
          '<div style="color:#fff;font-weight:bold;font-size:11px">' + asset.name + '</div>' +
          '<div style="font-size:9px;color:#aaa;margin:2px 0">' + asset.type.toUpperCase() + '</div>' +
          (owned ? '<div style="color:#0f6;font-size:10px">✅ OWNED</div>'
            : '<div style="font-size:10px;color:#ffd700;margin:4px 0">🪙 ' + asset.okcCost + ' OKC | 💎 ' + asset.polCost + ' POL</div>');

        if (!owned) {
          var btnOkc = document.createElement('button');
          btnOkc.className = 'btn';
          btnOkc.style.cssText = 'font-size:9px;padding:2px 6px;border-color:#ffd700;color:#ffd700;margin:2px';
          btnOkc.textContent = 'Buy (OKC)';
          btnOkc.addEventListener('click', function () {
            if (asset.tokenId && typeof Marketplace.buyCatalogAssetWithOKC === 'function') {
              Marketplace.buyCatalogAssetWithOKC(asset.tokenId, 1).then(function (ok) {
                if (ok) {
                  if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('🎨 ' + asset.name + ' unlocked!', '#00ffcc');
                  refreshMarketplaceUI('assets');
                } else {
                  if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('❌ Purchase failed', '#ff4444');
                }
              });
            } else if (typeof Marketplace.buyAssetWithOKC === 'function' && Marketplace.buyAssetWithOKC(idx)) {
              if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('🎨 ' + asset.name + ' unlocked!', '#00ffcc');
              refreshMarketplaceUI('assets');
            } else {
              if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('❌ Not enough OKC', '#ff4444');
            }
          });
          cell.appendChild(btnOkc);

          var btnPol = document.createElement('button');
          btnPol.className = 'btn';
          btnPol.style.cssText = 'font-size:9px;padding:2px 6px;border-color:#8247e5;color:#8247e5;margin:2px';
          btnPol.textContent = 'Buy (POL)';
          btnPol.addEventListener('click', function () {
            if (typeof Marketplace.buyAssetWithPOL === 'function') {
              Marketplace.buyAssetWithPOL(idx).then(function (ok) {
                if (ok) {
                  if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('🎨 ' + asset.name + ' unlocked! (POL)', '#00ffcc');
                  refreshMarketplaceUI('assets');
                } else {
                  if (typeof HUD.notifyPickup === 'function') HUD.notifyPickup('❌ Transaction failed', '#ff4444');
                }
              });
            }
          });
          cell.appendChild(btnPol);
        }
        grid.appendChild(cell);
      })(i);
    }
  }

  /* ── Public API ────────────────────────────────────────────────── */
  return {
    init: function(callbacks) {
      if (callbacks) _callbacks = callbacks;
    },
    showOverlay: showOverlay,
    hideOverlays: hideOverlays,
    showInventory: showInventory,
    toggleInventory: toggleInventory,
    resumeFromPause: resumeFromPause,
    quitToMenu: quitToMenu,
    updateHUD: updateExtendedHUD,
    updateAIIndicator: updateAIIndicator,
    populateWeaponsGrid: populateWeaponsGrid,
    buildShop: buildShopUI,
    buildSell: buildSellUI,
    buildPremium: buildPremiumUI,
    buildAssets: buildAssetsUI,
    refreshMarketplace: refreshMarketplaceUI,
    applyShopItem: applyShopItem
  };
})();
