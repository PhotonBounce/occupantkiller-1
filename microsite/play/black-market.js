/* black-market.js — Underground Black Market Weapons Trading System
   Exposed as window.BlackMarket (IIFE, var-only)
   Public API: { init(scene, camera), update(delta), spawnDealer(x, z), getCash(), addCash(n), reset() }
*/
window.BlackMarket = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var INTERACT_RANGE = 2.5;
  var FLEE_RANGE = 15;
  var FLEE_DURATION = 60;
  var RIVAL_SPAWN_TIME = 60;
  var TRUSTED_CLIENT_THRESHOLD = 3;
  var TRUSTED_DISCOUNT = 0.8;

  /* ── Item Pool ──────────────────────────────────────────────────────────── */
  var ITEM_POOL = [
    {
      id: 'BLACK_OPS_PISTOL',
      name: 'BLACK OPS PISTOL',
      desc: 'Suppressed, high-damage sidearm',
      baseCost: 200,
      icon: '[GUN]',
      activate: function () {
        window._blackOpsGunActive = true;
        window._blackOpsGunDamageBonus = 1.5;
        _notify('BLACK OPS PISTOL equipped — suppressed +50% dmg');
      }
    },
    {
      id: 'BODY_ARMOR_UPGRADE',
      name: 'BODY ARMOR UPGRADE',
      desc: '+75 armor points',
      baseCost: 150,
      icon: '[ARM]',
      activate: function () {
        window._playerArmor = (window._playerArmor || 0) + 75;
        if (window.player) { window.player.armor = (window.player.armor || 0) + 75; }
        if (window.ArmorSystem && window.ArmorSystem.addArmor) { window.ArmorSystem.addArmor(75); }
        _notify('BODY ARMOR +75 pts');
      }
    },
    {
      id: 'EMP_GRENADE_x3',
      name: 'EMP GRENADES x3',
      desc: '3 EMP grenades that disable electronics',
      baseCost: 100,
      icon: '[EMP]',
      activate: function () {
        window._empGrenades = (window._empGrenades || 0) + 3;
        _notify('EMP GRENADES x3 added to inventory');
      }
    },
    {
      id: 'INTEL_PACKAGE',
      name: 'INTEL PACKAGE',
      desc: 'Reveals all enemy positions for 120s',
      baseCost: 300,
      icon: '[INT]',
      activate: function () {
        window._intelPackageActive = true;
        window._intelPackageTimer = 120;
        _notify('INTEL PACKAGE — all enemies revealed for 120s');
      }
    },
    {
      id: 'FORGED_PAPERS',
      name: 'FORGED PAPERS',
      desc: 'Enemies ignore you for 30s (disguise)',
      baseCost: 250,
      icon: '[DOC]',
      activate: function () {
        window._forgedPapersActive = true;
        window._forgedPapersTimer = 30;
        _notify('FORGED PAPERS — enemies ignore you for 30s');
      }
    },
    {
      id: 'EXPLOSIVE_ROUNDS',
      name: 'EXPLOSIVE ROUNDS',
      desc: '+50% damage for 60s',
      baseCost: 180,
      icon: '[EXP]',
      activate: function () {
        window._explosiveRoundsActive = true;
        window._explosiveRoundsTimer = 60;
        window._explosiveRoundsDamageBonus = 1.5;
        _notify('EXPLOSIVE ROUNDS — +50% damage for 60s');
      }
    },
    {
      id: 'BRIBE_FILE',
      name: 'BRIBE FILE',
      desc: '-50% enemy reinforcement chance for 2min',
      baseCost: 220,
      icon: '[BRB]',
      activate: function () {
        window._bribeFileActive = true;
        window._bribeFileTimer = 120;
        window._reinforcementChanceMultiplier = 0.5;
        _notify('BRIBE FILE — reinforcements reduced 50% for 2min');
      }
    },
    {
      id: 'SNIPER_SCOPE',
      name: 'SNIPER SCOPE',
      desc: '4x zoom toggle for any weapon',
      baseCost: 160,
      icon: '[SCO]',
      activate: function () {
        window._sniperScopeAvailable = true;
        window._sniperScopeZoom = 4;
        _notify('SNIPER SCOPE — press Z to toggle 4x zoom');
      }
    }
  ];

  /* ── State ──────────────────────────────────────────────────────────────── */
  var _scene = null;
  var _camera = null;
  var _inited = false;

  var _cash = 0;
  var _dealerMesh = null;
  var _dealerGroup = null;
  var _dealerPos = new THREE.Vector3(0, 0, 0);
  var _dealerActive = false;
  var _dealerFleeing = false;
  var _dealerFleeTimer = 0;
  var _dealerOrigPos = new THREE.Vector3(0, 0, 0);
  var _dealerFound = false;

  var _rivalNPC = null;
  var _rivalTimer = 0;
  var _rivalAlive = false;
  var _rivalBoughtIntel = false;
  var _rivalIntelTimer = 0;

  var _tradeOpen = false;
  var _tradeOverlay = null;
  var _dealerInventory = [];
  var _itemsBought = 0;
  var _trustedClient = false;

  var _cashHudEl = null;
  var _notifyEl = null;
  var _notifyTimer = 0;

  var _confirmPending = null;
  var _confirmOverlay = null;

  /* ── Mesh Builders ──────────────────────────────────────────────────────── */
  function _buildDealerMesh() {
    var group = new THREE.Group();

    // Torso — dark cloak
    var bodyGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.2, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    group.add(body);

    // Hood / head — dark sphere with concealed face
    var headGeo = new THREE.SphereGeometry(0.28, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.55;
    group.add(head);

    // Hood brim (torus)
    var hoodGeo = new THREE.TorusGeometry(0.32, 0.08, 6, 12);
    var hoodMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.rotation.x = Math.PI / 2;
    hood.position.y = 1.62;
    group.add(hood);

    // Glowing red eyes
    var eyeGeo = new THREE.SphereGeometry(0.05, 6, 6);
    var eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.1, 1.57, 0.22);
    group.add(eyeL);
    var eyeR = new THREE.Mesh(eyeGeo, eyeMat.clone());
    eyeR.position.set(0.1, 1.57, 0.22);
    group.add(eyeR);

    // Cloak bottom fringe
    var cloakGeo = new THREE.ConeGeometry(0.52, 0.5, 8, 1, true);
    var cloakMat = new THREE.MeshLambertMaterial({ color: 0x0d0d0d, side: THREE.DoubleSide });
    var cloak = new THREE.Mesh(cloakGeo, cloakMat);
    cloak.position.y = 0.25;
    group.add(cloak);

    // Interaction prompt marker — thin cylinder beacon
    var beaconGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);
    var beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    var beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 2.4;
    beacon.name = 'dealer_beacon';
    group.add(beacon);

    return group;
  }

  function _buildRivalMesh() {
    var group = new THREE.Group();

    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.1, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x223355 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.24, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.38;
    group.add(head);

    return group;
  }

  /* ── Inventory Builder ──────────────────────────────────────────────────── */
  function _buildInventory() {
    var pool = ITEM_POOL.slice();
    // Fisher-Yates shuffle
    var i = pool.length;
    while (i > 0) {
      var j = Math.floor(Math.random() * i);
      i--;
      var tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, 8);
  }

  /* ── Cash HUD ───────────────────────────────────────────────────────────── */
  function _buildCashHud() {
    if (_cashHudEl) { return; }
    var el = document.createElement('div');
    el.id = 'bm-cash-hud';
    el.style.cssText = [
      'position:fixed',
      'top:12px',
      'right:16px',
      'z-index:9500',
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'color:#FFD700',
      'text-shadow:0 0 8px #FF6600, 0 1px 0 #000',
      'pointer-events:none',
      'background:rgba(0,0,0,0.55)',
      'padding:4px 12px',
      'border:1px solid #FF6600',
      'border-radius:4px',
      'letter-spacing:2px'
    ].join(';');
    document.body.appendChild(el);
    _cashHudEl = el;
    _updateCashHud();
  }

  function _updateCashHud() {
    if (_cashHudEl) {
      _cashHudEl.textContent = '$ ' + _cash;
    }
  }

  /* ── Notification Toast ─────────────────────────────────────────────────── */
  function _buildNotifyEl() {
    if (_notifyEl) { return; }
    var el = document.createElement('div');
    el.id = 'bm-notify';
    el.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:9600',
      'font-family:monospace',
      'font-size:15px',
      'color:#FF4444',
      'text-shadow:0 0 6px #FF0000',
      'background:rgba(0,0,0,0.75)',
      'padding:6px 18px',
      'border:1px solid #FF4444',
      'border-radius:3px',
      'pointer-events:none',
      'display:none',
      'text-align:center',
      'max-width:520px'
    ].join(';');
    document.body.appendChild(el);
    _notifyEl = el;
  }

  function _notify(msg) {
    if (!_notifyEl) { _buildNotifyEl(); }
    _notifyEl.textContent = msg;
    _notifyEl.style.display = 'block';
    _notifyTimer = 3.5;
  }

  /* ── Trade Interface ────────────────────────────────────────────────────── */
  function _openTradeUI() {
    if (_tradeOpen) { return; }
    _tradeOpen = true;

    var overlay = document.createElement('div');
    overlay.id = 'bm-trade-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:10000',
      'background:rgba(0,0,0,0.92)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace',
      'color:#CC0000'
    ].join(';');

    // Panel
    var panel = document.createElement('div');
    panel.style.cssText = [
      'background:#0a0000',
      'border:2px solid #CC0000',
      'border-radius:6px',
      'padding:24px 32px',
      'width:680px',
      'max-width:95vw',
      'max-height:85vh',
      'overflow-y:auto',
      'box-shadow:0 0 40px #CC000055'
    ].join(';');

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'text-align:center;margin-bottom:18px;';
    header.innerHTML = '<div style="font-size:22px;letter-spacing:4px;color:#FF0000;text-shadow:0 0 12px #FF0000;">▼ BLACK MARKET ▼</div>' +
      '<div style="font-size:12px;color:#880000;letter-spacing:2px;margin-top:4px;">UNDERGROUND ARMS DEALER — KEEP QUIET</div>' +
      (_trustedClient ? '<div style="font-size:11px;color:#FFD700;margin-top:4px;">★ TRUSTED CLIENT — 20% DISCOUNT APPLIED ★</div>' : '');
    panel.appendChild(header);

    // Cash display
    var cashRow = document.createElement('div');
    cashRow.style.cssText = 'text-align:right;margin-bottom:14px;font-size:16px;color:#FFD700;letter-spacing:2px;border-bottom:1px solid #330000;padding-bottom:8px;';
    cashRow.textContent = 'YOUR CASH:  $ ' + _cash;
    panel.appendChild(cashRow);

    // Items
    var grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    for (var i = 0; i < _dealerInventory.length; i++) {
      (function (item) {
        var cost = _getItemCost(item);
        var affordable = _cash >= cost;

        var row = document.createElement('div');
        row.style.cssText = [
          'display:flex',
          'align-items:center',
          'justify-content:space-between',
          'background:' + (affordable ? '#100000' : '#080000'),
          'border:1px solid ' + (affordable ? '#660000' : '#330000'),
          'border-radius:4px',
          'padding:10px 14px',
          'gap:12px',
          'opacity:' + (affordable ? '1' : '0.5')
        ].join(';');

        var infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'flex:1;';
        infoDiv.innerHTML = '<div style="font-size:14px;color:#FF4444;letter-spacing:1px;">' + item.icon + '  ' + item.name + '</div>' +
          '<div style="font-size:11px;color:#884444;margin-top:3px;">' + item.desc + '</div>';

        var buyBtn = document.createElement('button');
        buyBtn.textContent = '$ ' + cost;
        buyBtn.disabled = !affordable;
        buyBtn.style.cssText = [
          'background:' + (affordable ? '#330000' : '#1a0000'),
          'color:' + (affordable ? '#FF4444' : '#550000'),
          'border:1px solid ' + (affordable ? '#CC0000' : '#330000'),
          'border-radius:3px',
          'padding:6px 14px',
          'font-family:monospace',
          'font-size:14px',
          'font-weight:bold',
          'cursor:' + (affordable ? 'pointer' : 'not-allowed'),
          'letter-spacing:1px',
          'white-space:nowrap'
        ].join(';');

        if (affordable) {
          buyBtn.addEventListener('mouseenter', function () {
            buyBtn.style.background = '#550000';
          });
          buyBtn.addEventListener('mouseleave', function () {
            buyBtn.style.background = '#330000';
          });
          buyBtn.addEventListener('click', function () {
            _closeTradeUI();
            _openConfirm(item, cost);
          });
        }

        row.appendChild(infoDiv);
        row.appendChild(buyBtn);
        grid.appendChild(row);
      })(this._dealerInventory[i]);
    }

    panel.appendChild(grid);

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '[ CLOSE MARKET — ESC ]';
    closeBtn.style.cssText = [
      'margin-top:20px',
      'background:#1a0000',
      'color:#880000',
      'border:1px solid #550000',
      'border-radius:3px',
      'padding:8px 24px',
      'font-family:monospace',
      'font-size:13px',
      'cursor:pointer',
      'width:100%',
      'letter-spacing:2px'
    ].join(';');
    closeBtn.addEventListener('click', _closeTradeUI);
    panel.appendChild(closeBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    _tradeOverlay = overlay;

    // ESC to close
    document.addEventListener('keydown', _onTradeKey);
  }

  // Fix: use module-scoped _dealerInventory instead of this
  function _openTradeUIFixed() {
    if (_tradeOpen) { return; }
    _tradeOpen = true;

    var overlay = document.createElement('div');
    overlay.id = 'bm-trade-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:10000',
      'background:rgba(0,0,0,0.92)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace',
      'color:#CC0000'
    ].join(';');

    var panel = document.createElement('div');
    panel.style.cssText = [
      'background:#0a0000',
      'border:2px solid #CC0000',
      'border-radius:6px',
      'padding:24px 32px',
      'width:680px',
      'max-width:95vw',
      'max-height:85vh',
      'overflow-y:auto',
      'box-shadow:0 0 40px #CC000055'
    ].join(';');

    var header = document.createElement('div');
    header.style.cssText = 'text-align:center;margin-bottom:18px;';
    header.innerHTML = '<div style="font-size:22px;letter-spacing:4px;color:#FF0000;text-shadow:0 0 12px #FF0000;">&#9660; BLACK MARKET &#9660;</div>' +
      '<div style="font-size:12px;color:#880000;letter-spacing:2px;margin-top:4px;">UNDERGROUND ARMS DEALER &#8212; KEEP QUIET</div>' +
      (_trustedClient ? '<div style="font-size:11px;color:#FFD700;margin-top:4px;">&#9733; TRUSTED CLIENT &#8212; 20% DISCOUNT APPLIED &#9733;</div>' : '');
    panel.appendChild(header);

    var cashRow = document.createElement('div');
    cashRow.style.cssText = 'text-align:right;margin-bottom:14px;font-size:16px;color:#FFD700;letter-spacing:2px;border-bottom:1px solid #330000;padding-bottom:8px;';
    cashRow.textContent = 'YOUR CASH:  $ ' + _cash;
    panel.appendChild(cashRow);

    var grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    var inv = _dealerInventory;
    for (var i = 0; i < inv.length; i++) {
      (function (item) {
        var cost = _getItemCost(item);
        var affordable = _cash >= cost;

        var row = document.createElement('div');
        row.style.cssText = [
          'display:flex',
          'align-items:center',
          'justify-content:space-between',
          'background:' + (affordable ? '#100000' : '#080000'),
          'border:1px solid ' + (affordable ? '#660000' : '#330000'),
          'border-radius:4px',
          'padding:10px 14px',
          'gap:12px',
          'opacity:' + (affordable ? '1' : '0.5')
        ].join(';');

        var infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'flex:1;';
        infoDiv.innerHTML = '<div style="font-size:14px;color:#FF4444;letter-spacing:1px;">' +
          item.icon + '  ' + item.name + '</div>' +
          '<div style="font-size:11px;color:#884444;margin-top:3px;">' + item.desc + '</div>';

        var buyBtn = document.createElement('button');
        buyBtn.textContent = '$ ' + cost;
        buyBtn.disabled = !affordable;
        buyBtn.style.cssText = [
          'background:' + (affordable ? '#330000' : '#1a0000'),
          'color:' + (affordable ? '#FF4444' : '#550000'),
          'border:1px solid ' + (affordable ? '#CC0000' : '#330000'),
          'border-radius:3px',
          'padding:6px 14px',
          'font-family:monospace',
          'font-size:14px',
          'font-weight:bold',
          'cursor:' + (affordable ? 'pointer' : 'not-allowed'),
          'letter-spacing:1px',
          'white-space:nowrap'
        ].join(';');

        if (affordable) {
          buyBtn.addEventListener('mouseenter', function () { buyBtn.style.background = '#550000'; });
          buyBtn.addEventListener('mouseleave', function () { buyBtn.style.background = '#330000'; });
          buyBtn.addEventListener('click', function () {
            _closeTradeUI();
            _openConfirm(item, cost);
          });
        }

        row.appendChild(infoDiv);
        row.appendChild(buyBtn);
        grid.appendChild(row);
      })(inv[i]);
    }

    panel.appendChild(grid);

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '[ CLOSE MARKET - ESC ]';
    closeBtn.style.cssText = [
      'margin-top:20px',
      'background:#1a0000',
      'color:#880000',
      'border:1px solid #550000',
      'border-radius:3px',
      'padding:8px 24px',
      'font-family:monospace',
      'font-size:13px',
      'cursor:pointer',
      'width:100%',
      'letter-spacing:2px'
    ].join(';');
    closeBtn.addEventListener('click', _closeTradeUI);
    panel.appendChild(closeBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    _tradeOverlay = overlay;

    document.addEventListener('keydown', _onTradeKey);
  }

  function _closeTradeUI() {
    _tradeOpen = false;
    if (_tradeOverlay) {
      _tradeOverlay.parentNode && _tradeOverlay.parentNode.removeChild(_tradeOverlay);
      _tradeOverlay = null;
    }
    document.removeEventListener('keydown', _onTradeKey);
  }

  function _onTradeKey(e) {
    if (e.key === 'Escape') { _closeTradeUI(); }
  }

  /* ── Confirmation Prompt ────────────────────────────────────────────────── */
  function _openConfirm(item, cost) {
    _confirmPending = item;

    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:10100',
      'background:rgba(0,0,0,0.85)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace'
    ].join(';');

    var box = document.createElement('div');
    box.style.cssText = [
      'background:#080000',
      'border:2px solid #FF0000',
      'border-radius:5px',
      'padding:28px 36px',
      'text-align:center',
      'box-shadow:0 0 30px #FF000044'
    ].join(';');

    box.innerHTML = '<div style="font-size:17px;color:#FF4444;letter-spacing:2px;margin-bottom:10px;">CONFIRM PURCHASE</div>' +
      '<div style="font-size:14px;color:#CC2222;margin-bottom:6px;">' + item.name + '</div>' +
      '<div style="font-size:12px;color:#884444;margin-bottom:18px;">' + item.desc + '</div>' +
      '<div style="font-size:18px;color:#FFD700;margin-bottom:22px;">COST: $ ' + cost + '</div>';

    var yesBtn = document.createElement('button');
    yesBtn.textContent = '[CONFIRM]';
    yesBtn.style.cssText = 'background:#330000;color:#FF4444;border:1px solid #CC0000;border-radius:3px;padding:8px 22px;font-family:monospace;font-size:14px;font-weight:bold;cursor:pointer;margin-right:14px;letter-spacing:1px;';
    yesBtn.addEventListener('click', function () {
      _purchaseItem(item, cost);
      _closeConfirm(overlay);
    });

    var noBtn = document.createElement('button');
    noBtn.textContent = '[CANCEL]';
    noBtn.style.cssText = 'background:#0a0000;color:#880000;border:1px solid #550000;border-radius:3px;padding:8px 22px;font-family:monospace;font-size:14px;cursor:pointer;letter-spacing:1px;';
    noBtn.addEventListener('click', function () {
      _closeConfirm(overlay);
      _openTradeUIFixed();
    });

    box.appendChild(yesBtn);
    box.appendChild(noBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    _confirmOverlay = overlay;
  }

  function _closeConfirm(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    _confirmOverlay = null;
    _confirmPending = null;
  }

  /* ── Purchase Logic ─────────────────────────────────────────────────────── */
  function _getItemCost(item) {
    return _trustedClient ? Math.floor(item.baseCost * TRUSTED_DISCOUNT) : item.baseCost;
  }

  function _purchaseItem(item, cost) {
    if (_cash < cost) {
      _notify('NOT ENOUGH CASH');
      return;
    }
    _cash -= cost;
    _updateCashHud();
    _itemsBought++;
    if (_itemsBought >= TRUSTED_CLIENT_THRESHOLD && !_trustedClient) {
      _trustedClient = true;
      _notify('TRUSTED CLIENT STATUS UNLOCKED — 20% off all items');
    }
    item.activate();
  }

  /* ── Rival NPC ──────────────────────────────────────────────────────────── */
  function _spawnRival() {
    if (!_scene || !_dealerActive) { return; }
    _rivalAlive = true;
    var rGroup = _buildRivalMesh();
    rGroup.position.set(
      _dealerPos.x + 2 + Math.random() * 2,
      0,
      _dealerPos.z + 2 + Math.random() * 2
    );
    _scene.add(rGroup);
    _rivalNPC = rGroup;
    _notify('RIVAL BUYER SPOTTED — eliminate or lose intel');
  }

  function _eliminateRival() {
    if (!_rivalAlive || !_rivalNPC) { return; }
    _rivalAlive = false;
    if (_rivalNPC.parent) { _rivalNPC.parent.removeChild ? _rivalNPC.parent.removeChild(_rivalNPC) : _scene.remove(_rivalNPC); }
    _rivalNPC = null;
    _notify('RIVAL ELIMINATED — intel secured');
  }

  function _rivalBuyIntel() {
    _rivalAlive = false;
    if (_rivalNPC && _scene) { _scene.remove(_rivalNPC); }
    _rivalNPC = null;
    _rivalBoughtIntel = true;
    _rivalIntelTimer = 60;
    window._enemyKnowsPlayerPos = true;
    _notify('RIVAL BOUGHT INTEL — enemies know your position for 60s');
  }

  /* ── Dealer Flee Logic ──────────────────────────────────────────────────── */
  function _dealerFlee() {
    if (_dealerFleeing || !_dealerActive) { return; }
    _dealerFleeing = true;
    _dealerFleeTimer = FLEE_DURATION;
    _closeTradeUI();
    _notify('DEALER SPOOKED — running away, returns in 60s');
  }

  /* ── Proximity / Interaction Check ─────────────────────────────────────── */
  function _checkInteract() {
    if (!_dealerActive || _dealerFleeing || !_camera) { return; }
    var camPos = _camera.position;
    var dx = camPos.x - _dealerPos.x;
    var dz = camPos.z - _dealerPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= INTERACT_RANGE && !_tradeOpen) {
      _showInteractPrompt(true);
    } else {
      _showInteractPrompt(false);
    }
  }

  var _interactPromptEl = null;
  function _showInteractPrompt(show) {
    if (!_interactPromptEl) {
      var el = document.createElement('div');
      el.id = 'bm-interact-prompt';
      el.style.cssText = [
        'position:fixed',
        'bottom:140px',
        'left:50%',
        'transform:translateX(-50%)',
        'z-index:9700',
        'font-family:monospace',
        'font-size:14px',
        'color:#FFD700',
        'background:rgba(0,0,0,0.75)',
        'border:1px solid #CC6600',
        'border-radius:3px',
        'padding:5px 16px',
        'pointer-events:none',
        'display:none',
        'letter-spacing:1px'
      ].join(';');
      el.textContent = '[E] ENTER BLACK MARKET';
      document.body.appendChild(el);
      _interactPromptEl = el;
    }
    _interactPromptEl.style.display = show ? 'block' : 'none';
  }

  function _onKeyDown(e) {
    if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
      if (!_dealerActive || _dealerFleeing) { return; }
      var camPos = _camera ? _camera.position : null;
      if (!camPos) { return; }
      var dx = camPos.x - _dealerPos.x;
      var dz = camPos.z - _dealerPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= INTERACT_RANGE) {
        if (_tradeOpen) {
          _closeTradeUI();
        } else {
          if (!_dealerFound) {
            _dealerFound = true;
            if (window.player) { window.player.score = (window.player.score || 0) + 100; }
            if (window.HUD && window.HUD.setScore) { window.HUD.setScore(window.player ? window.player.score : 0); }
            _notify('BLACK MARKET DISCOVERED — +100 score');
          }
          _openTradeUIFixed();
        }
      }
    }
  }

  /* ── Gunfire Detection ──────────────────────────────────────────────────── */
  function _checkGunfire() {
    // Listen for global gunfire flag set by weapons system
    if (window._lastGunfirePos && _dealerActive && !_dealerFleeing) {
      var gp = window._lastGunfirePos;
      var dx = gp.x - _dealerPos.x;
      var dz = (gp.z !== undefined ? gp.z : 0) - _dealerPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < FLEE_RANGE) {
        _dealerFlee();
        window._lastGunfirePos = null;
      }
    }
  }

  /* ── Active Effect Timers ───────────────────────────────────────────────── */
  function _tickEffects(delta) {
    if (window._intelPackageActive && window._intelPackageTimer > 0) {
      window._intelPackageTimer -= delta;
      if (window._intelPackageTimer <= 0) {
        window._intelPackageActive = false;
        _notify('INTEL PACKAGE expired');
      }
    }
    if (window._forgedPapersActive && window._forgedPapersTimer > 0) {
      window._forgedPapersTimer -= delta;
      if (window._forgedPapersTimer <= 0) {
        window._forgedPapersActive = false;
        _notify('FORGED PAPERS expired — you are visible again');
      }
    }
    if (window._explosiveRoundsActive && window._explosiveRoundsTimer > 0) {
      window._explosiveRoundsTimer -= delta;
      if (window._explosiveRoundsTimer <= 0) {
        window._explosiveRoundsActive = false;
        window._explosiveRoundsDamageBonus = 1;
        _notify('EXPLOSIVE ROUNDS expired');
      }
    }
    if (window._bribeFileActive && window._bribeFileTimer > 0) {
      window._bribeFileTimer -= delta;
      if (window._bribeFileTimer <= 0) {
        window._bribeFileActive = false;
        window._reinforcementChanceMultiplier = 1;
        _notify('BRIBE FILE expired — reinforcements normalized');
      }
    }
    if (_rivalBoughtIntel && _rivalIntelTimer > 0) {
      _rivalIntelTimer -= delta;
      if (_rivalIntelTimer <= 0) {
        _rivalBoughtIntel = false;
        window._enemyKnowsPlayerPos = false;
        _notify('Enemy intel expired — you are hidden again');
      }
    }
  }

  /* ── Dealer Animate (hover bob) ─────────────────────────────────────────── */
  var _dealerBobTime = 0;
  var _dealerOrigY = 0;
  function _animateDealer(delta) {
    if (!_dealerGroup) { return; }
    _dealerBobTime += delta;
    _dealerGroup.position.y = _dealerOrigY + Math.sin(_dealerBobTime * 1.5) * 0.04;
    // Rotate beacon
    var beacon = _dealerGroup.getObjectByName('dealer_beacon');
    if (beacon) { beacon.rotation.y += delta * 2; }
  }

  /* ── Public: spawnDealer ────────────────────────────────────────────────── */
  function spawnDealer(x, z) {
    if (!_scene) { return; }
    if (_dealerGroup) {
      _scene.remove(_dealerGroup);
    }
    _dealerGroup = _buildDealerMesh();
    _dealerPos.set(x, 0, z);
    _dealerOrigPos.set(x, 0, z);
    _dealerGroup.position.set(x, 0, z);
    _dealerOrigY = 0;
    _scene.add(_dealerGroup);
    _dealerActive = true;
    _dealerFleeing = false;
    _dealerFleeTimer = 0;
    _dealerInventory = _buildInventory();
    _rivalTimer = 0;
    _rivalAlive = false;
    _rivalBoughtIntel = false;
    _rivalIntelTimer = 0;
    if (_rivalNPC && _rivalNPC.parent) { _scene.remove(_rivalNPC); }
    _rivalNPC = null;
  }

  /* ── Public: init ───────────────────────────────────────────────────────── */
  function init(scene, camera) {
    if (_inited) { return; }
    _inited = true;
    _scene = scene;
    _camera = camera;

    _buildCashHud();
    _buildNotifyEl();

    document.addEventListener('keydown', _onKeyDown);

    // Hook into kill events for cash rewards
    var _origOnEnemyKilled = window._onEnemyKilled;
    window._onEnemyKilled = function (enemy) {
      if (_origOnEnemyKilled) { _origOnEnemyKilled(enemy); }
      var reward = (enemy && enemy.boss) ? 50 : 10;
      addCash(reward);
    };
  }

  /* ── Public: update ─────────────────────────────────────────────────────── */
  function update(delta) {
    if (!_inited) { return; }

    // Notify timer
    if (_notifyTimer > 0) {
      _notifyTimer -= delta;
      if (_notifyTimer <= 0 && _notifyEl) {
        _notifyEl.style.display = 'none';
      }
    }

    if (!_dealerActive) { return; }

    // Dealer flee logic
    if (_dealerFleeing) {
      _dealerFleeTimer -= delta;
      if (_dealerGroup) {
        _dealerGroup.position.x += delta * 4;
        _dealerGroup.position.z += delta * 4;
        _dealerGroup.rotation.y += delta * 3;
      }
      if (_dealerFleeTimer <= 0) {
        // Return dealer
        _dealerFleeing = false;
        _dealerPos.copy(_dealerOrigPos);
        if (_dealerGroup) {
          _dealerGroup.position.copy(_dealerOrigPos);
          _dealerGroup.rotation.y = 0;
        }
        _notify('DEALER has returned');
      }
      return;
    }

    _animateDealer(delta);
    _checkInteract();
    _checkGunfire();
    _tickEffects(delta);

    // Rival buyer timer
    if (!_rivalAlive && !_rivalBoughtIntel) {
      _rivalTimer += delta;
      if (_rivalTimer >= RIVAL_SPAWN_TIME) {
        // 50% chance rival spawns
        if (Math.random() < 0.5) {
          _spawnRival();
        }
        _rivalTimer = 0; // Reset so it doesn't spam
      }
    }

    // If rival is alive, check if they have reached the dealer
    if (_rivalAlive && _rivalNPC) {
      var rx = _dealerPos.x - _rivalNPC.position.x;
      var rz = _dealerPos.z - _rivalNPC.position.z;
      var rdist = Math.sqrt(rx * rx + rz * rz);

      // Move rival toward dealer
      if (rdist > 0.5) {
        var speed = 1.5 * delta;
        _rivalNPC.position.x += (rx / rdist) * speed;
        _rivalNPC.position.z += (rz / rdist) * speed;
      } else {
        // Rival reached dealer — buys INTEL_PACKAGE
        _rivalBuyIntel();
      }

      // Check if player shot rival (rival within 1.5 units of camera)
      if (_camera) {
        var cx = _camera.position.x - _rivalNPC.position.x;
        var cz = _camera.position.z - _rivalNPC.position.z;
        var cdist = Math.sqrt(cx * cx + cz * cz);
        if (window._lastKillPos) {
          var kp = window._lastKillPos;
          var kx = kp.x - _rivalNPC.position.x;
          var kz = (kp.z !== undefined ? kp.z : 0) - _rivalNPC.position.z;
          if (Math.sqrt(kx * kx + kz * kz) < 1.5) {
            _eliminateRival();
            window._lastKillPos = null;
          }
        }
      }
    }
  }

  /* ── Public: getCash ────────────────────────────────────────────────────── */
  function getCash() {
    return _cash;
  }

  /* ── Public: addCash ────────────────────────────────────────────────────── */
  function addCash(n) {
    _cash += n;
    if (_cash < 0) { _cash = 0; }
    _updateCashHud();
  }

  /* ── Cash Pickup Spawning ───────────────────────────────────────────────── */
  function _spawnCashPickup(x, y, z, amount) {
    if (!_scene) { return; }
    var geo = new THREE.BoxGeometry(0.3, 0.15, 0.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y || 0.1, z);
    mesh.userData.cashPickup = true;
    mesh.userData.cashAmount = amount || 25;
    mesh.userData.bobPhase = Math.random() * Math.PI * 2;
    _scene.add(mesh);
    _cashPickups.push(mesh);
  }

  var _cashPickups = [];

  /* ── Public: reset ──────────────────────────────────────────────────────── */
  function reset() {
    _cash = 0;
    _updateCashHud();

    _dealerActive = false;
    _dealerFleeing = false;
    _dealerFleeTimer = 0;
    _dealerFound = false;
    _itemsBought = 0;
    _trustedClient = false;
    _rivalTimer = 0;
    _rivalAlive = false;
    _rivalBoughtIntel = false;
    _rivalIntelTimer = 0;
    _dealerBobTime = 0;

    if (_dealerGroup && _scene) { _scene.remove(_dealerGroup); }
    _dealerGroup = null;

    if (_rivalNPC && _scene) { _scene.remove(_rivalNPC); }
    _rivalNPC = null;

    for (var i = 0; i < _cashPickups.length; i++) {
      if (_cashPickups[i] && _scene) { _scene.remove(_cashPickups[i]); }
    }
    _cashPickups = [];

    _closeTradeUI();
    if (_confirmOverlay && _confirmOverlay.parentNode) {
      _confirmOverlay.parentNode.removeChild(_confirmOverlay);
      _confirmOverlay = null;
    }

    _showInteractPrompt(false);

    // Reset active effects
    window._blackOpsGunActive = false;
    window._blackOpsGunDamageBonus = 1;
    window._intelPackageActive = false;
    window._intelPackageTimer = 0;
    window._forgedPapersActive = false;
    window._forgedPapersTimer = 0;
    window._explosiveRoundsActive = false;
    window._explosiveRoundsTimer = 0;
    window._explosiveRoundsDamageBonus = 1;
    window._bribeFileActive = false;
    window._bribeFileTimer = 0;
    window._reinforcementChanceMultiplier = 1;
    window._sniperScopeAvailable = false;
    window._sniperScopeZoom = 1;
    window._enemyKnowsPlayerPos = false;
    window._empGrenades = 0;
  }

  /* ── Expose ─────────────────────────────────────────────────────────────── */
  return {
    init: init,
    update: update,
    spawnDealer: spawnDealer,
    getCash: getCash,
    addCash: addCash,
    reset: reset
  };

})();
