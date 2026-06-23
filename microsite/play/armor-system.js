window.ArmorSystem = (function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Armor tier definitions
  // ---------------------------------------------------------------------------
  var TIERS = {
    NONE: {
      id: 'NONE',
      label: 'No Armor',
      reduction: 0,
      maxPts: 0,
      speedPenalty: 0,
      weight: 0
    },
    LIGHT_VEST: {
      id: 'LIGHT_VEST',
      label: 'Light Vest',
      reduction: 0.25,
      maxPts: 50,
      speedPenalty: 0,
      weight: 5
    },
    PLATE_CARRIER: {
      id: 'PLATE_CARRIER',
      label: 'Plate Carrier',
      reduction: 0.40,
      maxPts: 100,
      speedPenalty: 0,
      weight: 10
    },
    HEAVY_EXOSUIT: {
      id: 'HEAVY_EXOSUIT',
      label: 'Heavy Exosuit',
      reduction: 0.60,
      maxPts: 200,
      speedPenalty: 0.20,
      weight: 20
    }
  };

  // Equipment slot definitions
  var EQUIPMENT = {
    NONE: 'NONE',
    NIGHT_VISION: 'NIGHT_VISION',
    GAS_MASK: 'GAS_MASK',
    JETPACK: 'JETPACK'
  };

  // ---------------------------------------------------------------------------
  // Module state
  // ---------------------------------------------------------------------------
  var _scene = null;
  var _camera = null;
  var _initialized = false;

  // Armor state
  var _currentTier = TIERS.LIGHT_VEST;
  var _armorPts = 50;
  var _armorBroken = false;

  // Helmet state
  var _helmetDurability = 30;
  var _helmetMaxDurability = 30;
  var _helmetBroken = false;

  // Equipment
  var _equippedItem = EQUIPMENT.NONE;
  var _nvActive = false;
  var _jetpackCooldown = 0;
  var _jetpackActive = false;
  var _jetpackTime = 0;
  var _jetpackMaxTime = 2.0;
  var _jetpackCooldownMax = 15.0;

  // Armor repair kit
  var _repairing = false;
  var _repairProgress = 0;
  var _repairDuration = 3.0;
  var _repairAmt = 50;

  // Pickups in scene
  var _pickups = [];          // { mesh, type, position, label }
  var _nearPickup = null;

  // HUD elements
  var _hudContainer = null;
  var _armorPtsEl = null;
  var _armorTierEl = null;
  var _helmetBarEl = null;
  var _armorBarFill = null;
  var _crackOverlay = null;
  var _loadoutPanel = null;
  var _loadoutVisible = false;
  var _repairBar = null;
  var _repairBarFill = null;
  var _repairBarWrap = null;
  var _interactHint = null;

  // Hit directional indicators (arcs on screen)
  var _hitArcs = [];           // { canvas, timer, maxTimer, angle }
  var _hitArcContainer = null;

  // Night-vision overlay
  var _nvOverlay = null;
  var _nvEnemyMeshes = [];

  // Audio
  var _audioCtx = null;

  // ---------------------------------------------------------------------------
  // Audio helpers
  // ---------------------------------------------------------------------------
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    return _audioCtx;
  }

  function _playTone(freq, type, duration, gainVal) {
    try {
      var ctx = _getAudioCtx();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration);
      g.gain.setValueAtTime(gainVal || 0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function _playArmorHit() {
    _playTone(180, 'sawtooth', 0.12, 0.1);
  }

  function _playHelmetShatter() {
    _playTone(900, 'square', 0.05, 0.12);
    setTimeout(function () { _playTone(400, 'sawtooth', 0.15, 0.08); }, 60);
    setTimeout(function () { _playTone(200, 'sine', 0.3, 0.06); }, 120);
  }

  function _playJetpackBoost() {
    _playTone(220, 'sawtooth', 2.0, 0.07);
  }

  function _playPickupSound() {
    _playTone(660, 'sine', 0.15, 0.09);
    setTimeout(function () { _playTone(880, 'sine', 0.12, 0.07); }, 120);
  }

  // ---------------------------------------------------------------------------
  // HUD creation
  // ---------------------------------------------------------------------------
  function _createHUD() {
    // Main container (bottom-right)
    _hudContainer = document.createElement('div');
    _hudContainer.id = 'armor-hud';
    _hudContainer.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'display:flex',
      'flex-direction:column',
      'align-items:flex-end',
      'gap:6px',
      'pointer-events:none',
      'z-index:9000',
      'font-family:monospace',
      'user-select:none'
    ].join(';');
    document.body.appendChild(_hudContainer);

    // Helmet row
    var helmetRow = document.createElement('div');
    helmetRow.style.cssText = 'display:flex;align-items:center;gap:6px;';
    var helmetIcon = document.createElement('span');
    helmetIcon.textContent = '⛑'; // ⛑ helmet icon
    helmetIcon.style.cssText = 'font-size:16px;color:#aaa;';
    helmetRow.appendChild(helmetIcon);
    _helmetBarEl = document.createElement('div');
    _helmetBarEl.style.cssText = [
      'width:60px',
      'height:6px',
      'background:#333',
      'border:1px solid #555',
      'border-radius:3px',
      'overflow:hidden'
    ].join(';');
    var helmetFill = document.createElement('div');
    helmetFill.id = 'armor-helmet-fill';
    helmetFill.style.cssText = 'height:100%;width:100%;background:#88aaff;transition:width 0.2s;';
    _helmetBarEl.appendChild(helmetFill);
    helmetRow.appendChild(_helmetBarEl);
    _hudContainer.appendChild(helmetRow);

    // Armor row: shield icon + bar + pts + tier
    var armorRow = document.createElement('div');
    armorRow.style.cssText = 'display:flex;align-items:center;gap:6px;';
    var shieldIcon = document.createElement('span');
    shieldIcon.textContent = '🛡'; // 🛡
    shieldIcon.style.cssText = 'font-size:18px;';
    armorRow.appendChild(shieldIcon);

    var barWrap = document.createElement('div');
    barWrap.style.cssText = [
      'width:90px',
      'height:9px',
      'background:#333',
      'border:1px solid #666',
      'border-radius:4px',
      'overflow:hidden'
    ].join(';');
    _armorBarFill = document.createElement('div');
    _armorBarFill.style.cssText = 'height:100%;width:100%;background:#f8a020;transition:width 0.2s;';
    barWrap.appendChild(_armorBarFill);
    armorRow.appendChild(barWrap);

    _armorPtsEl = document.createElement('span');
    _armorPtsEl.style.cssText = 'color:#f8a020;font-size:13px;font-weight:bold;min-width:28px;text-align:right;';
    armorRow.appendChild(_armorPtsEl);

    _armorTierEl = document.createElement('span');
    _armorTierEl.style.cssText = 'color:#ccc;font-size:10px;';
    armorRow.appendChild(_armorTierEl);

    _hudContainer.appendChild(armorRow);

    // Repair bar (hidden by default)
    _repairBarWrap = document.createElement('div');
    _repairBarWrap.style.cssText = [
      'display:none',
      'flex-direction:column',
      'align-items:flex-end',
      'gap:2px'
    ].join(';');
    var repairLabel = document.createElement('span');
    repairLabel.textContent = 'REPAIRING...';
    repairLabel.style.cssText = 'color:#0cf;font-size:10px;';
    _repairBarWrap.appendChild(repairLabel);
    var repairOuter = document.createElement('div');
    repairOuter.style.cssText = [
      'width:90px',
      'height:6px',
      'background:#333',
      'border:1px solid #0cf',
      'border-radius:3px',
      'overflow:hidden'
    ].join(';');
    _repairBar = document.createElement('div');
    _repairBar.style.cssText = 'height:100%;width:0%;background:#0cf;transition:width 0.1s;';
    repairOuter.appendChild(_repairBar);
    _repairBarWrap.appendChild(repairOuter);
    _hudContainer.appendChild(_repairBarWrap);

    // Interact hint
    _interactHint = document.createElement('div');
    _interactHint.style.cssText = [
      'position:fixed',
      'bottom:140px',
      'right:50%',
      'transform:translateX(50%)',
      'color:#fff',
      'font-family:monospace',
      'font-size:13px',
      'background:rgba(0,0,0,0.55)',
      'padding:5px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9001',
      'display:none'
    ].join(';');
    document.body.appendChild(_interactHint);

    // Crack overlay (armor broken)
    _crackOverlay = document.createElement('div');
    _crackOverlay.id = 'armor-crack-overlay';
    _crackOverlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:8990',
      'opacity:0',
      'transition:opacity 0.4s'
    ].join(';');
    // Radial crack pattern via CSS box-shadow + border pattern
    _crackOverlay.style.background = [
      'radial-gradient(ellipse at 0% 0%, rgba(180,0,0,0.35) 0%, transparent 40%)',
      'radial-gradient(ellipse at 100% 0%, rgba(120,120,120,0.3) 0%, transparent 35%)',
      'radial-gradient(ellipse at 0% 100%, rgba(120,120,120,0.3) 0%, transparent 35%)',
      'radial-gradient(ellipse at 100% 100%, rgba(180,0,0,0.35) 0%, transparent 40%)',
      'radial-gradient(ellipse at 50% 0%, rgba(140,0,0,0.25) 0%, transparent 30%)',
      'radial-gradient(ellipse at 50% 100%, rgba(140,0,0,0.25) 0%, transparent 30%)',
      'radial-gradient(ellipse at 0% 50%, rgba(140,0,0,0.25) 0%, transparent 30%)',
      'radial-gradient(ellipse at 100% 50%, rgba(140,0,0,0.25) 0%, transparent 30%)'
    ].join(',');
    document.body.appendChild(_crackOverlay);

    // Night-vision overlay
    _nvOverlay = document.createElement('div');
    _nvOverlay.id = 'armor-nv-overlay';
    _nvOverlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:8980',
      'display:none',
      'background:rgba(0,10,0,0.82)'
    ].join(';');
    document.body.appendChild(_nvOverlay);

    // Hit arc container
    _hitArcContainer = document.createElement('canvas');
    _hitArcContainer.id = 'armor-hit-arcs';
    _hitArcContainer.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:8995'
    ].join(';');
    _hitArcContainer.width = window.innerWidth;
    _hitArcContainer.height = window.innerHeight;
    document.body.appendChild(_hitArcContainer);

    window.addEventListener('resize', function () {
      _hitArcContainer.width = window.innerWidth;
      _hitArcContainer.height = window.innerHeight;
    });

    // Loadout panel (Tab key)
    _loadoutPanel = document.createElement('div');
    _loadoutPanel.id = 'armor-loadout-panel';
    _loadoutPanel.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(0,0,0,0.78)',
      'z-index:10000',
      'display:none',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace',
      'color:#eee',
      'pointer-events:auto'
    ].join(';');
    document.body.appendChild(_loadoutPanel);
  }

  function _updateHUD() {
    if (!_hudContainer) return;

    // Armor bar
    var pct = _currentTier.maxPts > 0 ? Math.max(0, _armorPts / _currentTier.maxPts) : 0;
    if (_armorBarFill) {
      _armorBarFill.style.width = (pct * 100).toFixed(1) + '%';
      _armorBarFill.style.background = _armorBroken ? '#555' : '#f8a020';
    }
    if (_armorPtsEl) {
      _armorPtsEl.textContent = Math.ceil(_armorPts);
      _armorPtsEl.style.color = _armorBroken ? '#555' : '#f8a020';
    }
    if (_armorTierEl) {
      _armorTierEl.textContent = _currentTier.label;
    }

    // Helmet bar
    var helmetFill = document.getElementById('armor-helmet-fill');
    if (helmetFill) {
      var hPct = Math.max(0, _helmetDurability / _helmetMaxDurability);
      helmetFill.style.width = (hPct * 100).toFixed(1) + '%';
      helmetFill.style.background = _helmetBroken ? '#333' : '#88aaff';
    }

    // Crack overlay
    if (_crackOverlay) {
      _crackOverlay.style.opacity = _armorBroken ? '1' : '0';
    }

    // Repair bar
    if (_repairBarWrap) {
      _repairBarWrap.style.display = _repairing ? 'flex' : 'none';
      if (_repairing && _repairBar) {
        var rPct = (_repairProgress / _repairDuration) * 100;
        _repairBar.style.width = rPct.toFixed(1) + '%';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Loadout panel
  // ---------------------------------------------------------------------------
  function _renderLoadoutPanel() {
    if (!_loadoutPanel) return;
    _loadoutPanel.innerHTML = '';

    var title = document.createElement('h2');
    title.textContent = 'EQUIPMENT LOADOUT';
    title.style.cssText = 'margin-bottom:24px;letter-spacing:4px;color:#f8a020;font-size:22px;';
    _loadoutPanel.appendChild(title);

    var card = document.createElement('div');
    card.style.cssText = [
      'background:rgba(20,20,20,0.9)',
      'border:1px solid #444',
      'border-radius:8px',
      'padding:28px 40px',
      'min-width:360px',
      'display:flex',
      'flex-direction:column',
      'gap:16px'
    ].join(';');

    // Armor section
    var armorSec = document.createElement('div');
    armorSec.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    var armorTitle = document.createElement('div');
    armorTitle.textContent = '🛡 ARMOR';
    armorTitle.style.cssText = 'font-size:13px;color:#f8a020;letter-spacing:2px;';
    armorSec.appendChild(armorTitle);

    var armorInfo = document.createElement('div');
    armorInfo.style.cssText = 'display:flex;justify-content:space-between;font-size:12px;color:#ccc;';
    armorInfo.innerHTML = '<span>' + _currentTier.label + '</span><span>' + Math.ceil(_armorPts) + ' / ' + _currentTier.maxPts + ' pts</span>';
    armorSec.appendChild(armorInfo);

    var armorBarOuter = document.createElement('div');
    armorBarOuter.style.cssText = 'width:100%;height:8px;background:#222;border:1px solid #555;border-radius:4px;overflow:hidden;';
    var armorBarInner = document.createElement('div');
    var aPct = _currentTier.maxPts > 0 ? (_armorPts / _currentTier.maxPts * 100).toFixed(1) : 0;
    armorBarInner.style.cssText = 'height:100%;width:' + aPct + '%;background:#f8a020;';
    armorBarOuter.appendChild(armorBarInner);
    armorSec.appendChild(armorBarOuter);

    var armorStats = document.createElement('div');
    armorStats.style.cssText = 'font-size:11px;color:#888;';
    armorStats.textContent = 'Damage reduction: ' + (_currentTier.reduction * 100).toFixed(0) + '%  |  Speed penalty: ' + (_currentTier.speedPenalty * 100).toFixed(0) + '%';
    armorSec.appendChild(armorStats);
    card.appendChild(armorSec);

    // Helmet section
    var divider1 = document.createElement('hr');
    divider1.style.cssText = 'border:none;border-top:1px solid #333;margin:0;';
    card.appendChild(divider1);

    var helmetSec = document.createElement('div');
    helmetSec.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    var helmetTitle = document.createElement('div');
    helmetTitle.textContent = '⛑ HELMET';
    helmetTitle.style.cssText = 'font-size:13px;color:#88aaff;letter-spacing:2px;';
    helmetSec.appendChild(helmetTitle);

    var helmetInfo = document.createElement('div');
    helmetInfo.style.cssText = 'display:flex;justify-content:space-between;font-size:12px;color:#ccc;';
    var hStatus = _helmetBroken ? 'BROKEN' : (Math.ceil(_helmetDurability) + ' / ' + _helmetMaxDurability + ' pts');
    helmetInfo.innerHTML = '<span>' + (_helmetBroken ? 'Helmet (Broken)' : 'Combat Helmet') + '</span><span>' + hStatus + '</span>';
    helmetSec.appendChild(helmetInfo);

    var helmetBarOuter = document.createElement('div');
    helmetBarOuter.style.cssText = 'width:100%;height:8px;background:#222;border:1px solid #555;border-radius:4px;overflow:hidden;';
    var helmetBarInner = document.createElement('div');
    var hPct2 = (_helmetDurability / _helmetMaxDurability * 100).toFixed(1);
    helmetBarInner.style.cssText = 'height:100%;width:' + hPct2 + '%;background:' + (_helmetBroken ? '#333' : '#88aaff') + ';';
    helmetBarOuter.appendChild(helmetBarInner);
    helmetSec.appendChild(helmetBarOuter);

    var helmetStats = document.createElement('div');
    helmetStats.style.cssText = 'font-size:11px;color:#888;';
    helmetStats.textContent = _helmetBroken ? 'Headshot multiplier: 2.0x (unprotected)' : 'Headshot multiplier reduced: 2.0x → 1.3x';
    helmetSec.appendChild(helmetStats);
    card.appendChild(helmetSec);

    // Equipment section
    var divider2 = document.createElement('hr');
    divider2.style.cssText = 'border:none;border-top:1px solid #333;margin:0;';
    card.appendChild(divider2);

    var eqSec = document.createElement('div');
    eqSec.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    var eqTitle = document.createElement('div');
    eqTitle.textContent = '⚙ EQUIPMENT SLOT';
    eqTitle.style.cssText = 'font-size:13px;color:#0cf;letter-spacing:2px;';
    eqSec.appendChild(eqTitle);

    var eqItems = [
      { id: EQUIPMENT.NIGHT_VISION, icon: '👁', name: 'Night-Vision Goggles', key: 'N', detail: 'Toggle NV — darkens scene, enemies glow green' },
      { id: EQUIPMENT.GAS_MASK,     icon: '💨', name: 'Gas Mask',              key: 'Passive', detail: 'Immune to smoke/gas grenades' },
      { id: EQUIPMENT.JETPACK,      icon: '🚀', name: 'Jetpack',               key: 'Space\xD72', detail: '2s boost, 15s cooldown' }
    ];

    for (var ei = 0; ei < eqItems.length; ei++) {
      var item = eqItems[ei];
      var row = document.createElement('div');
      var isEquipped = (_equippedItem === item.id);
      row.style.cssText = [
        'display:flex',
        'align-items:center',
        'gap:10px',
        'padding:6px 8px',
        'border-radius:4px',
        'border:1px solid ' + (isEquipped ? '#0cf' : '#333'),
        'background:' + (isEquipped ? 'rgba(0,204,255,0.08)' : 'transparent'),
        'cursor:pointer'
      ].join(';');
      row.innerHTML = '<span style="font-size:18px;">' + item.icon + '</span>'
        + '<div style="flex:1;">'
        +   '<div style="font-size:12px;color:' + (isEquipped ? '#0cf' : '#aaa') + ';">' + item.name + '</div>'
        +   '<div style="font-size:10px;color:#666;">' + item.detail + '</div>'
        + '</div>'
        + '<span style="font-size:10px;color:#888;border:1px solid #555;padding:2px 5px;border-radius:3px;">' + item.key + '</span>';
      (function (itemId) {
        row.addEventListener('click', function () {
          _equippedItem = itemId;
          _renderLoadoutPanel();
        });
      })(item.id);
      eqSec.appendChild(row);
    }

    // Jetpack cooldown display
    if (_equippedItem === EQUIPMENT.JETPACK && _jetpackCooldown > 0) {
      var jcd = document.createElement('div');
      jcd.style.cssText = 'font-size:11px;color:#f80;';
      jcd.textContent = 'Jetpack cooldown: ' + _jetpackCooldown.toFixed(1) + 's';
      eqSec.appendChild(jcd);
    }

    card.appendChild(eqSec);

    // Weight section
    var divider3 = document.createElement('hr');
    divider3.style.cssText = 'border:none;border-top:1px solid #333;margin:0;';
    card.appendChild(divider3);

    var weightSec = document.createElement('div');
    weightSec.style.cssText = 'display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#888;';
    var totalWeight = _currentTier.weight + (_equippedItem !== EQUIPMENT.NONE ? 5 : 0);
    var staminaDrain = 1.0 + (totalWeight / 100);
    weightSec.innerHTML = '<span>Total weight: <b style="color:#ccc;">' + totalWeight + ' kg</b></span>'
      + '<span>Stamina drain: <b style="color:#f80;">' + staminaDrain.toFixed(2) + 'x</b></span>';
    card.appendChild(weightSec);

    _loadoutPanel.appendChild(card);

    var closeHint = document.createElement('div');
    closeHint.textContent = '[TAB] Close';
    closeHint.style.cssText = 'margin-top:18px;font-size:12px;color:#555;letter-spacing:2px;';
    _loadoutPanel.appendChild(closeHint);
  }

  function _toggleLoadout() {
    _loadoutVisible = !_loadoutVisible;
    if (_loadoutPanel) {
      _loadoutPanel.style.display = _loadoutVisible ? 'flex' : 'none';
      if (_loadoutVisible) _renderLoadoutPanel();
    }
  }

  // ---------------------------------------------------------------------------
  // Three.js pickup meshes
  // ---------------------------------------------------------------------------
  function _createArmorPickupMesh(color) {
    var geo = new THREE.CylinderGeometry(0.35, 0.35, 0.06, 6); // hexagonal disc
    var mat = new THREE.MeshStandardMaterial({
      color: color || 0xff6600,
      emissive: color || 0xff6600,
      emissiveIntensity: 0.7,
      metalness: 0.6,
      roughness: 0.3
    });
    var mesh = new THREE.Mesh(geo, mat);
    // Add a point light for glow
    var light = new THREE.PointLight(color || 0xff6600, 1.2, 3);
    mesh.add(light);
    return mesh;
  }

  function _spawnPickup(type, position) {
    if (!_scene) return;
    var color = (type === 'REPAIR_KIT') ? 0x00ccff : 0xff6600;
    var mesh = _createArmorPickupMesh(color);
    mesh.position.copy(position);
    _scene.add(mesh);
    _pickups.push({ mesh: mesh, type: type, position: position.clone(), label: type === 'REPAIR_KIT' ? 'Armor Repair Kit' : 'Armor Pickup' });
  }

  function _spawnDefaultPickups() {
    if (!_scene) return;
    var positions = [
      new THREE.Vector3(5, 0.1, 5),
      new THREE.Vector3(-8, 0.1, 3),
      new THREE.Vector3(2, 0.1, -10)
    ];
    for (var pi = 0; pi < positions.length; pi++) {
      _spawnPickup('REPAIR_KIT', positions[pi]);
    }
  }

  // ---------------------------------------------------------------------------
  // Hit directional arc
  // ---------------------------------------------------------------------------
  function _spawnHitArc(hitDir) {
    if (!_hitArcContainer || !_camera) return;

    // Convert 3D hit direction to 2D screen angle
    var angle = 0;
    if (hitDir && hitDir.isVector3) {
      var camDir = new THREE.Vector3();
      _camera.getWorldDirection(camDir);
      var right = new THREE.Vector3();
      right.crossVectors(camDir, _camera.up).normalize();
      var dot = hitDir.dot(right);
      var dotFwd = hitDir.dot(camDir);
      angle = Math.atan2(dot, dotFwd);
    }

    _hitArcs.push({ angle: angle, timer: 0, maxTimer: 1.0 });
  }

  function _updateHitArcs(delta) {
    if (!_hitArcContainer) return;
    var ctx = _hitArcContainer.getContext('2d');
    var W = _hitArcContainer.width;
    var H = _hitArcContainer.height;
    ctx.clearRect(0, 0, W, H);

    var cx = W / 2;
    var cy = H / 2;
    var radius = Math.min(W, H) * 0.38;
    var arcSpan = Math.PI; // 180 degrees

    for (var ai = _hitArcs.length - 1; ai >= 0; ai--) {
      var arc = _hitArcs[ai];
      arc.timer += delta;
      if (arc.timer >= arc.maxTimer) {
        _hitArcs.splice(ai, 1);
        continue;
      }
      var progress = arc.timer / arc.maxTimer;
      var alpha = 1 - progress;
      var startAngle = arc.angle - arcSpan / 2;
      var endAngle = arc.angle + arcSpan / 2;

      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.lineWidth = 8;
      ctx.strokeStyle = 'rgba(255,80,20,' + alpha + ')';
      ctx.shadowColor = 'rgba(255,80,20,0.6)';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Night vision helpers
  // ---------------------------------------------------------------------------
  function _applyNightVision(active) {
    if (_nvOverlay) {
      _nvOverlay.style.display = active ? 'block' : 'none';
    }
    // Apply green emissive glow to any tracked enemy meshes
    for (var ni = 0; ni < _nvEnemyMeshes.length; ni++) {
      var m = _nvEnemyMeshes[ni];
      if (m && m.material) {
        if (active) {
          m.material.emissive = new THREE.Color(0x00ff44);
          m.material.emissiveIntensity = 1.5;
        } else {
          m.material.emissive = new THREE.Color(0x000000);
          m.material.emissiveIntensity = 0;
        }
      }
    }
  }

  function registerEnemyMesh(mesh) {
    if (mesh && _nvEnemyMeshes.indexOf(mesh) === -1) {
      _nvEnemyMeshes.push(mesh);
      if (_nvActive) {
        mesh.material.emissive = new THREE.Color(0x00ff44);
        mesh.material.emissiveIntensity = 1.5;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Keyboard input
  // ---------------------------------------------------------------------------
  function _onKeyDown(e) {
    var key = e.key || e.code;

    // Tab: loadout panel
    if (key === 'Tab') {
      e.preventDefault();
      _toggleLoadout();
      return;
    }

    // F: interact with nearby repair kit
    if (key === 'f' || key === 'F') {
      if (_nearPickup && _nearPickup.type === 'REPAIR_KIT' && !_repairing) {
        _startRepair();
      }
      return;
    }

    // N: toggle night vision (if equipped)
    if ((key === 'n' || key === 'N') && _equippedItem === EQUIPMENT.NIGHT_VISION) {
      _nvActive = !_nvActive;
      _applyNightVision(_nvActive);
      return;
    }

    // Space+Space for jetpack — handled via double-tap detection
    if (key === ' ' && _equippedItem === EQUIPMENT.JETPACK) {
      _handleJetpackInput();
      return;
    }
  }

  // Jetpack double-tap detection
  var _lastSpaceTime = 0;
  function _handleJetpackInput() {
    var now = performance.now();
    if (now - _lastSpaceTime < 350) {
      // Double tap
      if (_jetpackCooldown <= 0 && !_jetpackActive) {
        _jetpackActive = true;
        _jetpackTime = 0;
        _playJetpackBoost();
      }
    }
    _lastSpaceTime = now;
  }

  // ---------------------------------------------------------------------------
  // Armor repair
  // ---------------------------------------------------------------------------
  function _startRepair() {
    _repairing = true;
    _repairProgress = 0;
  }

  function _tickRepair(delta) {
    if (!_repairing) return;
    _repairProgress += delta;
    if (_repairProgress >= _repairDuration) {
      _repairing = false;
      _repairProgress = 0;
      _armorPts = Math.min(_currentTier.maxPts, _armorPts + _repairAmt);
      if (_armorPts > 0) {
        _armorBroken = false;
      }
      // Remove the used pickup
      if (_nearPickup) {
        _removePickup(_nearPickup);
        _nearPickup = null;
      }
      _playPickupSound();
    }
  }

  function _removePickup(pickup) {
    var idx = _pickups.indexOf(pickup);
    if (idx !== -1) {
      if (_scene && pickup.mesh) {
        _scene.remove(pickup.mesh);
        if (pickup.mesh.geometry) pickup.mesh.geometry.dispose();
        if (pickup.mesh.material) pickup.mesh.material.dispose();
      }
      _pickups.splice(idx, 1);
    }
  }

  // ---------------------------------------------------------------------------
  // Pickup proximity check
  // ---------------------------------------------------------------------------
  function _checkPickupProximity() {
    if (!_camera) return;
    var playerPos = _camera.position;
    var closest = null;
    var closestDist = 2.5; // interaction radius in world units

    for (var pi = 0; pi < _pickups.length; pi++) {
      var p = _pickups[pi];
      var dist = playerPos.distanceTo(p.position);
      if (dist < closestDist) {
        closestDist = dist;
        closest = p;
      }
    }

    _nearPickup = closest;
    if (_interactHint) {
      if (closest) {
        _interactHint.style.display = 'block';
        _interactHint.textContent = '[F] ' + closest.label;
      } else {
        _interactHint.style.display = 'none';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Pickup bob animation
  // ---------------------------------------------------------------------------
  var _pickupTime = 0;
  function _animatePickups(delta) {
    _pickupTime += delta;
    for (var pi = 0; pi < _pickups.length; pi++) {
      var p = _pickups[pi];
      if (p.mesh) {
        p.mesh.position.y = p.position.y + Math.sin(_pickupTime * 2.0 + pi * 1.3) * 0.08;
        p.mesh.rotation.y += delta * 0.8;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Jetpack update
  // ---------------------------------------------------------------------------
  function _tickJetpack(delta) {
    if (_equippedItem !== EQUIPMENT.JETPACK) return;

    if (_jetpackActive) {
      _jetpackTime += delta;
      // Push camera upward as a gameplay effect hint (actual physics in engine)
      if (_camera) {
        _camera.position.y += delta * 4.5;
      }
      if (_jetpackTime >= _jetpackMaxTime) {
        _jetpackActive = false;
        _jetpackCooldown = _jetpackCooldownMax;
      }
    } else if (_jetpackCooldown > 0) {
      _jetpackCooldown -= delta;
      if (_jetpackCooldown < 0) _jetpackCooldown = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Public: applyDamage
  // ---------------------------------------------------------------------------
  function applyDamage(rawDamage, hitDir, isHeadshot) {
    var actualDamage = rawDamage;
    var headshotMult = 2.0;

    // Headshot: helmet reduces multiplier
    if (isHeadshot) {
      if (!_helmetBroken && _helmetDurability > 0) {
        headshotMult = 1.3;
        _helmetDurability -= rawDamage * 0.5;
        if (_helmetDurability <= 0) {
          _helmetDurability = 0;
          _helmetBroken = true;
          _playHelmetShatter();
        }
        rawDamage = rawDamage * headshotMult;
      } else {
        rawDamage = rawDamage * 2.0;
      }
    }

    // Armor mitigation
    if (!_armorBroken && _armorPts > 0 && _currentTier.reduction > 0) {
      actualDamage = rawDamage * (1 - _currentTier.reduction);
      _armorPts -= rawDamage * 0.5; // armor degrades
      if (_armorPts <= 0) {
        _armorPts = 0;
        _armorBroken = true;
      }
      _playArmorHit();
    } else {
      actualDamage = rawDamage;
    }

    // Directional hit arc
    _spawnHitArc(hitDir);

    _updateHUD();

    return actualDamage;
  }

  // ---------------------------------------------------------------------------
  // Public: equipArmor
  // ---------------------------------------------------------------------------
  function equipArmor(tierId) {
    var tier = TIERS[tierId];
    if (!tier) return;
    _currentTier = tier;
    _armorPts = tier.maxPts;
    _armorBroken = (tier.maxPts === 0);
    _updateHUD();
  }

  // ---------------------------------------------------------------------------
  // Public: getArmorValue
  // ---------------------------------------------------------------------------
  function getArmorValue() {
    return {
      tier: _currentTier.id,
      pts: _armorPts,
      maxPts: _currentTier.maxPts,
      reduction: _currentTier.reduction,
      broken: _armorBroken,
      speedPenalty: _currentTier.speedPenalty,
      helmetDurability: _helmetDurability,
      helmetBroken: _helmetBroken,
      equipment: _equippedItem,
      nvActive: _nvActive,
      jetpackCooldown: _jetpackCooldown,
      jetpackActive: _jetpackActive
    };
  }

  // ---------------------------------------------------------------------------
  // Public: init
  // ---------------------------------------------------------------------------
  function init(scene, camera) {
    if (_initialized) return;
    _initialized = true;
    _scene = scene;
    _camera = camera;

    _createHUD();
    _updateHUD();

    // Spawn some default pickups if scene provided
    if (_scene) {
      _spawnDefaultPickups();
    }

    document.addEventListener('keydown', _onKeyDown);
  }

  // ---------------------------------------------------------------------------
  // Public: update
  // ---------------------------------------------------------------------------
  function update(delta) {
    if (!_initialized) return;

    _tickRepair(delta);
    _tickJetpack(delta);
    _animatePickups(delta);
    _checkPickupProximity();
    _updateHitArcs(delta);
    _updateHUD();
  }

  // ---------------------------------------------------------------------------
  // Public: reset
  // ---------------------------------------------------------------------------
  function reset() {
    _currentTier = TIERS.LIGHT_VEST;
    _armorPts = 50;
    _armorBroken = false;
    _helmetDurability = 30;
    _helmetBroken = false;
    _equippedItem = EQUIPMENT.NONE;
    _nvActive = false;
    _applyNightVision(false);
    _jetpackCooldown = 0;
    _jetpackActive = false;
    _jetpackTime = 0;
    _repairing = false;
    _repairProgress = 0;
    _hitArcs = [];
    _loadoutVisible = false;
    if (_loadoutPanel) _loadoutPanel.style.display = 'none';

    // Remove pickup meshes
    for (var pi = 0; pi < _pickups.length; pi++) {
      var p = _pickups[pi];
      if (_scene && p.mesh) _scene.remove(p.mesh);
    }
    _pickups = [];
    _nearPickup = null;

    if (_interactHint) _interactHint.style.display = 'none';
    _updateHUD();
  }

  // ---------------------------------------------------------------------------
  // Expose public API
  // ---------------------------------------------------------------------------
  return {
    init: init,
    update: update,
    reset: reset,
    applyDamage: applyDamage,
    equipArmor: equipArmor,
    getArmorValue: getArmorValue,
    registerEnemyMesh: registerEnemyMesh,
    spawnPickup: _spawnPickup,
    TIERS: TIERS,
    EQUIPMENT: EQUIPMENT
  };
})();
