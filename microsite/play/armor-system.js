// armor-system.js — Body armor, helmets, ballistic protection and degradation
// Browser-based — IIFE, all var (no let/const), Three.js as global THREE
//
// Public API:
//   ArmorSystem.init(scene, camera)
//   ArmorSystem.update(delta)
//   ArmorSystem.reset()
//   ArmorSystem.applyDamage(rawDamage, hitLocation, hitDir)
//   ArmorSystem.repairArmor(amount)
//   ArmorSystem.openArmorSelection()
//   ArmorSystem.getSpeedMultiplier()
//   ArmorSystem.getStaminaDrainRate()

window.ArmorSystem = (function () {
  'use strict';

  // ─────────────────────────────────────────────── armor tiers
  var TIERS = {
    LEVEL_I: {
      id: 'LEVEL_I',
      label: 'LEVEL_I',
      displayName: 'Soft Vest',
      maxHP: 150,
      speedPenalty: 0,
      staminaMult: 1.0,
      color: 0x4a7c59,
      description: 'Soft body armor — light and fast'
    },
    LEVEL_II: {
      id: 'LEVEL_II',
      label: 'LEVEL_II',
      displayName: 'Enhanced Vest',
      maxHP: 250,
      speedPenalty: 0.10,
      staminaMult: 1.15,
      color: 0x3d6b8a,
      description: 'Enhanced protection — 10% speed penalty'
    },
    LEVEL_III: {
      id: 'LEVEL_III',
      label: 'LEVEL_III',
      displayName: 'Plate Carrier',
      maxHP: 350,
      speedPenalty: 0.20,
      staminaMult: 1.35,
      color: 0x5a4a2a,
      description: 'Plate carrier — 20% speed penalty'
    },
    LEVEL_IV: {
      id: 'LEVEL_IV',
      label: 'LEVEL_IV',
      displayName: 'Full Kit',
      maxHP: 500,
      speedPenalty: 0.35,
      staminaMult: 1.60,
      color: 0x2a2a2a,
      description: 'Full combat kit — 35% speed penalty'
    }
  };

  // ─────────────────────────────────────────────── helmet types
  var HELMETS = {
    NONE: {
      id: 'NONE',
      label: 'No Helmet',
      maxHP: 0,
      hasNVG: false
    },
    PASGT: {
      id: 'PASGT',
      label: 'PASGT Helmet',
      maxHP: 100,
      hasNVG: false
    },
    FAST_HELMET: {
      id: 'FAST_HELMET',
      label: 'FAST Helmet',
      maxHP: 150,
      hasNVG: true
    }
  };

  // ─────────────────────────────────────────────── hit locations
  var HIT_LOCATION = {
    HEAD: 'HEAD',
    BODY: 'BODY',
    LIMB: 'LIMB'
  };

  // ─────────────────────────────────────────────── state
  var _scene = null;
  var _camera = null;
  var _initialized = false;

  var _currentTier = TIERS.LEVEL_I;
  var _armorHP = 150;
  var _armorBroken = false;
  var _repairCount = 0;
  var _maxRepairs = 2;

  var _currentHelmet = HELMETS.NONE;
  var _helmetHP = 0;
  var _helmetBroken = false;

  // Three.js chest plate mesh
  var _chestPlateMesh = null;
  var _crackMeshA = null;
  var _crackMeshB = null;
  var _cracksVisible = false;

  // Armor selection screen
  var _selectionPanel = null;
  var _selectionVisible = false;
  var _inventoryPanel = null;
  var _inventoryVisible = false;

  // HUD elements
  var _hudContainer = null;
  var _hudArmorText = null;
  var _hudHelmetText = null;

  // Audio
  var _audioCtx = null;

  // Key state for A+R combo
  var _keyA = false;
  var _keyR = false;
  var _comboTimer = 0;

  // ─────────────────────────────────────────────── audio helpers
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
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, ctx.currentTime + duration);
      g.gain.setValueAtTime(gainVal || 0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function _playCrackSound() {
    // Multi-tone crack/crunch noise
    _playTone(220, 'sawtooth', 0.08, 0.14);
    setTimeout(function () { _playTone(110, 'square', 0.12, 0.10); }, 40);
    setTimeout(function () { _playTone(55, 'sawtooth', 0.20, 0.08); }, 90);
    setTimeout(function () { _playTone(80, 'sine', 0.35, 0.06); }, 160);
  }

  function _playArmorHit() {
    _playTone(300, 'sawtooth', 0.10, 0.09);
    setTimeout(function () { _playTone(180, 'sine', 0.18, 0.06); }, 60);
  }

  function _playEquip() {
    _playTone(440, 'sine', 0.12, 0.07);
    setTimeout(function () { _playTone(550, 'sine', 0.10, 0.06); }, 80);
  }

  function _playRepair() {
    _playTone(660, 'sine', 0.15, 0.08);
    setTimeout(function () { _playTone(880, 'sine', 0.12, 0.07); }, 120);
    setTimeout(function () { _playTone(1100, 'sine', 0.10, 0.06); }, 220);
  }

  // ─────────────────────────────────────────────── Three.js mesh helpers
  function _buildChestPlateMesh() {
    if (!_camera) return;
    // Remove existing
    _removeChestMeshes();

    if (_currentTier.id === 'LEVEL_I' && _armorBroken) return;

    // Chest plate: BoxGeometry 0.6 x 0.8 x 0.1 offset (0, 0, -0.3) from camera
    var geo = new THREE.BoxGeometry(0.6, 0.8, 0.1);
    var mat = new THREE.MeshStandardMaterial({
      color: _armorBroken ? 0x333333 : _currentTier.color,
      roughness: 0.6,
      metalness: _currentTier.id === 'LEVEL_III' || _currentTier.id === 'LEVEL_IV' ? 0.7 : 0.2
    });
    _chestPlateMesh = new THREE.Mesh(geo, mat);
    _chestPlateMesh.position.set(0, 0, -0.3);
    _camera.add(_chestPlateMesh);

    // Build crack overlays (X shape from 2 BoxGeometries)
    _buildCrackMeshes();

    // Show cracks if HP < 50%
    _updateCrackVisibility();
  }

  function _buildCrackMeshes() {
    if (!_chestPlateMesh) return;

    var crackMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 1.0,
      metalness: 0.0
    });

    // Crack A: diagonal /
    var geoA = new THREE.BoxGeometry(0.62, 0.06, 0.12);
    _crackMeshA = new THREE.Mesh(geoA, crackMat);
    _crackMeshA.rotation.z = Math.PI / 4;
    _crackMeshA.position.set(0, 0, 0.01);
    _chestPlateMesh.add(_crackMeshA);

    // Crack B: diagonal \
    var geoB = new THREE.BoxGeometry(0.62, 0.06, 0.12);
    _crackMeshB = new THREE.Mesh(geoB, crackMat);
    _crackMeshB.rotation.z = -Math.PI / 4;
    _crackMeshB.position.set(0, 0, 0.01);
    _chestPlateMesh.add(_crackMeshB);

    _crackMeshA.visible = false;
    _crackMeshB.visible = false;
  }

  function _updateCrackVisibility() {
    if (!_chestPlateMesh) return;
    var maxHP = _currentTier.maxHP;
    var showCracks = (maxHP > 0) && (_armorHP < maxHP * 0.5);
    if (_crackMeshA) _crackMeshA.visible = showCracks;
    if (_crackMeshB) _crackMeshB.visible = showCracks;
    _cracksVisible = showCracks;

    // If armor broken, turn plate dark gray
    if (_chestPlateMesh.material) {
      _chestPlateMesh.material.color.setHex(_armorBroken ? 0x333333 : _currentTier.color);
    }
  }

  function _removeChestMeshes() {
    if (_chestPlateMesh) {
      if (_camera) _camera.remove(_chestPlateMesh);
      if (_crackMeshA) {
        _chestPlateMesh.remove(_crackMeshA);
        if (_crackMeshA.geometry) _crackMeshA.geometry.dispose();
        if (_crackMeshA.material) _crackMeshA.material.dispose();
        _crackMeshA = null;
      }
      if (_crackMeshB) {
        _chestPlateMesh.remove(_crackMeshB);
        if (_crackMeshB.geometry) _crackMeshB.geometry.dispose();
        if (_crackMeshB.material) _crackMeshB.material.dispose();
        _crackMeshB = null;
      }
      if (_chestPlateMesh.geometry) _chestPlateMesh.geometry.dispose();
      if (_chestPlateMesh.material) _chestPlateMesh.material.dispose();
      _chestPlateMesh = null;
    }
    _cracksVisible = false;
  }

  // ─────────────────────────────────────────────── HUD
  function _createHUD() {
    _hudContainer = document.createElement('div');
    _hudContainer.id = 'armor-hud-bl';
    _hudContainer.style.cssText = [
      'position:fixed',
      'bottom:18px',
      'left:18px',
      'display:flex',
      'flex-direction:column',
      'gap:3px',
      'pointer-events:none',
      'z-index:9100',
      'font-family:monospace',
      'user-select:none'
    ].join(';');
    document.body.appendChild(_hudContainer);

    _hudArmorText = document.createElement('div');
    _hudArmorText.id = 'armor-hud-armor-text';
    _hudArmorText.style.cssText = 'color:#f8a020;font-size:13px;font-weight:bold;text-shadow:0 0 4px #000;';
    _hudContainer.appendChild(_hudArmorText);

    _hudHelmetText = document.createElement('div');
    _hudHelmetText.id = 'armor-hud-helmet-text';
    _hudHelmetText.style.cssText = 'color:#88aaff;font-size:13px;font-weight:bold;text-shadow:0 0 4px #000;';
    _hudContainer.appendChild(_hudHelmetText);

    _updateHUD();
  }

  function _makeBar(current, maximum, filled, empty) {
    if (maximum <= 0) return empty + empty + empty + empty + empty + empty;
    var pct = Math.max(0, Math.min(1, current / maximum));
    var total = 6;
    var filledCount = Math.round(pct * total);
    var result = '';
    for (var i = 0; i < total; i++) {
      result += i < filledCount ? filled : empty;
    }
    return result;
  }

  function _updateHUD() {
    if (!_hudArmorText || !_hudHelmetText) return;

    // Armor bar: filled = block, partial = medium shade, empty = light
    var armorBar = _makeBar(_armorHP, _currentTier.maxHP, '█', '░');
    var armorLabel = _armorBroken ? '[BROKEN]' : '[' + _currentTier.label + ']';
    _hudArmorText.textContent = 'ARMOR: ' + armorBar + ' ' + armorLabel;
    _hudArmorText.style.color = _armorBroken ? '#555' : '#f8a020';

    // Helmet bar
    var helmetBar = _makeBar(_helmetHP, _currentHelmet.maxHP, '█', '░');
    var helmetLabel = _helmetBroken ? '[BROKEN]' : '[' + _currentHelmet.id + ']';
    if (_currentHelmet.id === 'NONE') {
      _hudHelmetText.textContent = 'HELMET: [NONE]';
      _hudHelmetText.style.color = '#555';
    } else {
      _hudHelmetText.textContent = 'HELMET: ' + helmetBar + ' ' + helmetLabel;
      _hudHelmetText.style.color = _helmetBroken ? '#555' : '#88aaff';
    }
  }

  // ─────────────────────────────────────────────── armor selection screen
  function _createSelectionPanel() {
    _selectionPanel = document.createElement('div');
    _selectionPanel.id = 'armor-selection-panel';
    _selectionPanel.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(0,0,0,0.85)',
      'z-index:10100',
      'display:none',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace',
      'color:#eee',
      'pointer-events:auto'
    ].join(';');
    document.body.appendChild(_selectionPanel);
  }

  function _renderSelectionPanel() {
    if (!_selectionPanel) return;
    _selectionPanel.innerHTML = '';

    var title = document.createElement('h2');
    title.textContent = 'ARMOR SELECTION';
    title.style.cssText = 'margin-bottom:8px;letter-spacing:4px;color:#f8a020;font-size:20px;margin-top:0;';
    _selectionPanel.appendChild(title);

    var subtitle = document.createElement('div');
    subtitle.textContent = 'Select protection tier — heavier armor slows movement';
    subtitle.style.cssText = 'color:#888;font-size:12px;margin-bottom:24px;letter-spacing:1px;';
    _selectionPanel.appendChild(subtitle);

    var grid = document.createElement('div');
    grid.style.cssText = [
      'display:grid',
      'grid-template-columns:repeat(2,1fr)',
      'gap:16px',
      'max-width:700px',
      'width:90%'
    ].join(';');

    var tierKeys = ['LEVEL_I', 'LEVEL_II', 'LEVEL_III', 'LEVEL_IV'];
    for (var ti = 0; ti < tierKeys.length; ti++) {
      (function (tierKey) {
        var tier = TIERS[tierKey];
        var isActive = (_currentTier.id === tierKey);
        var card = document.createElement('div');
        card.style.cssText = [
          'background:' + (isActive ? 'rgba(248,160,32,0.12)' : 'rgba(30,30,30,0.9)'),
          'border:2px solid ' + (isActive ? '#f8a020' : '#444'),
          'border-radius:8px',
          'padding:18px 20px',
          'cursor:pointer',
          'transition:border-color 0.15s'
        ].join(';');

        var header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';

        var tierName = document.createElement('span');
        tierName.textContent = tier.label;
        tierName.style.cssText = 'font-size:16px;font-weight:bold;color:' + (isActive ? '#f8a020' : '#ccc') + ';letter-spacing:2px;';
        header.appendChild(tierName);

        if (isActive) {
          var badge = document.createElement('span');
          badge.textContent = 'EQUIPPED';
          badge.style.cssText = 'font-size:9px;color:#f8a020;border:1px solid #f8a020;padding:2px 6px;border-radius:3px;';
          header.appendChild(badge);
        }
        card.appendChild(header);

        var dispName = document.createElement('div');
        dispName.textContent = tier.displayName;
        dispName.style.cssText = 'font-size:12px;color:#aaa;margin-bottom:10px;';
        card.appendChild(dispName);

        var stats = document.createElement('div');
        stats.style.cssText = 'display:flex;flex-direction:column;gap:4px;font-size:11px;color:#777;';
        stats.innerHTML = [
          '<span>HP Absorb: <b style="color:#0cf;">' + tier.maxHP + '</b></span>',
          '<span>Speed Penalty: <b style="color:#f80;">' + (tier.speedPenalty * 100).toFixed(0) + '%</b></span>',
          '<span>Stamina Drain: <b style="color:#f44;">' + tier.staminaMult.toFixed(2) + 'x</b></span>'
        ].join('');
        card.appendChild(stats);

        var desc = document.createElement('div');
        desc.textContent = tier.description;
        desc.style.cssText = 'font-size:10px;color:#555;margin-top:8px;font-style:italic;';
        card.appendChild(desc);

        card.addEventListener('click', function () {
          _equipTier(tierKey);
          _closeSelectionPanel();
        });

        grid.appendChild(card);
      })(tierKeys[ti]);
    }
    _selectionPanel.appendChild(grid);

    // Helmet section
    var helmetTitle = document.createElement('div');
    helmetTitle.textContent = 'HELMET';
    helmetTitle.style.cssText = 'margin-top:24px;margin-bottom:12px;letter-spacing:3px;color:#88aaff;font-size:14px;';
    _selectionPanel.appendChild(helmetTitle);

    var helmetGrid = document.createElement('div');
    helmetGrid.style.cssText = 'display:flex;gap:12px;max-width:700px;width:90%;';

    var helmetKeys = ['NONE', 'PASGT', 'FAST_HELMET'];
    for (var hi = 0; hi < helmetKeys.length; hi++) {
      (function (helmetKey) {
        var helm = HELMETS[helmetKey];
        var isActive = (_currentHelmet.id === helmetKey);
        var hCard = document.createElement('div');
        hCard.style.cssText = [
          'flex:1',
          'background:' + (isActive ? 'rgba(136,170,255,0.12)' : 'rgba(30,30,30,0.9)'),
          'border:2px solid ' + (isActive ? '#88aaff' : '#444'),
          'border-radius:8px',
          'padding:14px 16px',
          'cursor:pointer'
        ].join(';');

        var hName = document.createElement('div');
        hName.textContent = helm.label;
        hName.style.cssText = 'font-size:13px;font-weight:bold;color:' + (isActive ? '#88aaff' : '#ccc') + ';margin-bottom:6px;';
        hCard.appendChild(hName);

        var hStats = document.createElement('div');
        hStats.style.cssText = 'font-size:11px;color:#666;display:flex;flex-direction:column;gap:3px;';
        hStats.innerHTML = [
          '<span>HP: <b style="color:#0cf;">' + (helm.maxHP || 'N/A') + '</b></span>',
          '<span>NVG Rail: <b style="color:' + (helm.hasNVG ? '#0f0' : '#444') + ';">' + (helm.hasNVG ? 'Yes' : 'No') + '</b></span>'
        ].join('');
        hCard.appendChild(hStats);

        hCard.addEventListener('click', function () {
          _equipHelmet(helmetKey);
          _renderSelectionPanel();
        });

        helmetGrid.appendChild(hCard);
      })(helmetKeys[hi]);
    }
    _selectionPanel.appendChild(helmetGrid);

    var closeHint = document.createElement('div');
    closeHint.textContent = '[A+R] or [ESC] Close';
    closeHint.style.cssText = 'margin-top:20px;font-size:11px;color:#444;letter-spacing:2px;';
    _selectionPanel.appendChild(closeHint);
  }

  function openArmorSelection() {
    _selectionVisible = true;
    if (!_selectionPanel) _createSelectionPanel();
    _renderSelectionPanel();
    _selectionPanel.style.display = 'flex';
  }

  function _closeSelectionPanel() {
    _selectionVisible = false;
    if (_selectionPanel) _selectionPanel.style.display = 'none';
  }

  // ─────────────────────────────────────────────── inventory screen
  function _createInventoryPanel() {
    _inventoryPanel = document.createElement('div');
    _inventoryPanel.id = 'armor-inventory-panel';
    _inventoryPanel.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(10,10,10,0.95)',
      'border:1px solid #444',
      'border-radius:10px',
      'padding:28px 36px',
      'z-index:10050',
      'display:none',
      'flex-direction:row',
      'gap:32px',
      'font-family:monospace',
      'color:#eee',
      'pointer-events:auto',
      'min-width:480px'
    ].join(';');
    document.body.appendChild(_inventoryPanel);
  }

  function _renderInventoryPanel() {
    if (!_inventoryPanel) return;
    _inventoryPanel.innerHTML = '';

    // Silhouette column
    var silhouetteCol = document.createElement('div');
    silhouetteCol.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;min-width:120px;';

    var silTitle = document.createElement('div');
    silTitle.textContent = 'ARMOR STATUS';
    silTitle.style.cssText = 'font-size:11px;color:#888;letter-spacing:2px;margin-bottom:4px;';
    silhouetteCol.appendChild(silTitle);

    // SVG silhouette diagram
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '80');
    svg.setAttribute('height', '160');
    svg.style.cssText = 'display:block;';

    // Head
    var headColor = _helmetBroken ? '#333' : (_currentHelmet.id === 'NONE' ? '#555' : '#88aaff');
    var headCircle = document.createElementNS(svgNS, 'circle');
    headCircle.setAttribute('cx', '40');
    headCircle.setAttribute('cy', '22');
    headCircle.setAttribute('r', '16');
    headCircle.setAttribute('fill', headColor);
    svg.appendChild(headCircle);

    // Body
    var bodyColor = _armorBroken ? '#333' : '#f8a020';
    var bodyRect = document.createElementNS(svgNS, 'rect');
    bodyRect.setAttribute('x', '20');
    bodyRect.setAttribute('y', '44');
    bodyRect.setAttribute('width', '40');
    bodyRect.setAttribute('height', '52');
    bodyRect.setAttribute('rx', '4');
    bodyRect.setAttribute('fill', bodyColor);
    svg.appendChild(bodyRect);

    // Arms (limbs — unarmored)
    var leftArm = document.createElementNS(svgNS, 'rect');
    leftArm.setAttribute('x', '4');
    leftArm.setAttribute('y', '48');
    leftArm.setAttribute('width', '14');
    leftArm.setAttribute('height', '40');
    leftArm.setAttribute('rx', '3');
    leftArm.setAttribute('fill', '#444');
    svg.appendChild(leftArm);

    var rightArm = document.createElementNS(svgNS, 'rect');
    rightArm.setAttribute('x', '62');
    rightArm.setAttribute('y', '48');
    rightArm.setAttribute('width', '14');
    rightArm.setAttribute('height', '40');
    rightArm.setAttribute('rx', '3');
    rightArm.setAttribute('fill', '#444');
    svg.appendChild(rightArm);

    // Legs
    var leftLeg = document.createElementNS(svgNS, 'rect');
    leftLeg.setAttribute('x', '21');
    leftLeg.setAttribute('y', '100');
    leftLeg.setAttribute('width', '16');
    leftLeg.setAttribute('height', '52');
    leftLeg.setAttribute('rx', '3');
    leftLeg.setAttribute('fill', '#444');
    svg.appendChild(leftLeg);

    var rightLeg = document.createElementNS(svgNS, 'rect');
    rightLeg.setAttribute('x', '43');
    rightLeg.setAttribute('y', '100');
    rightLeg.setAttribute('width', '16');
    rightLeg.setAttribute('height', '52');
    rightLeg.setAttribute('rx', '3');
    rightLeg.setAttribute('fill', '#444');
    svg.appendChild(rightLeg);

    // Crack lines on body if damaged
    if (_cracksVisible || _armorBroken) {
      var crackA = document.createElementNS(svgNS, 'line');
      crackA.setAttribute('x1', '24');
      crackA.setAttribute('y1', '50');
      crackA.setAttribute('x2', '56');
      crackA.setAttribute('y2', '90');
      crackA.setAttribute('stroke', '#111');
      crackA.setAttribute('stroke-width', '3');
      svg.appendChild(crackA);

      var crackB = document.createElementNS(svgNS, 'line');
      crackB.setAttribute('x1', '56');
      crackB.setAttribute('y1', '50');
      crackB.setAttribute('x2', '24');
      crackB.setAttribute('y2', '90');
      crackB.setAttribute('stroke', '#111');
      crackB.setAttribute('stroke-width', '3');
      svg.appendChild(crackB);
    }

    silhouetteCol.appendChild(svg);

    var limbNote = document.createElement('div');
    limbNote.textContent = 'LIMBS: UNARMORED';
    limbNote.style.cssText = 'font-size:9px;color:#555;letter-spacing:1px;';
    silhouetteCol.appendChild(limbNote);

    _inventoryPanel.appendChild(silhouetteCol);

    // Stats column
    var statsCol = document.createElement('div');
    statsCol.style.cssText = 'display:flex;flex-direction:column;gap:14px;flex:1;';

    // Title
    var invTitle = document.createElement('div');
    invTitle.textContent = 'LOADOUT';
    invTitle.style.cssText = 'font-size:16px;font-weight:bold;letter-spacing:3px;color:#f8a020;';
    statsCol.appendChild(invTitle);

    // Chest HP bar
    var chestSec = document.createElement('div');
    chestSec.style.cssText = 'display:flex;flex-direction:column;gap:4px;';

    var chestLabel = document.createElement('div');
    chestLabel.style.cssText = 'display:flex;justify-content:space-between;font-size:12px;';
    chestLabel.innerHTML = '<span style="color:#f8a020;">CHEST — ' + _currentTier.displayName + '</span>'
      + '<span style="color:#ccc;">' + Math.ceil(_armorHP) + ' / ' + _currentTier.maxHP + ' HP</span>';
    chestSec.appendChild(chestLabel);

    var chestBarOuter = document.createElement('div');
    chestBarOuter.style.cssText = 'width:100%;height:10px;background:#222;border:1px solid #555;border-radius:4px;overflow:hidden;';
    var chestBarInner = document.createElement('div');
    var chestPct = _currentTier.maxHP > 0 ? (_armorHP / _currentTier.maxHP * 100).toFixed(1) : 0;
    chestBarInner.style.cssText = 'height:100%;width:' + chestPct + '%;background:' + (_armorBroken ? '#333' : '#f8a020') + ';transition:width 0.2s;';
    chestBarOuter.appendChild(chestBarInner);
    chestSec.appendChild(chestBarOuter);

    if (_armorBroken) {
      var brokenNote = document.createElement('div');
      brokenNote.textContent = 'ARMOR BROKEN — No protection';
      brokenNote.style.cssText = 'font-size:10px;color:#f44;';
      chestSec.appendChild(brokenNote);
    }
    statsCol.appendChild(chestSec);

    // Helmet HP bar
    var helmSec = document.createElement('div');
    helmSec.style.cssText = 'display:flex;flex-direction:column;gap:4px;';

    var helmLabel = document.createElement('div');
    helmLabel.style.cssText = 'display:flex;justify-content:space-between;font-size:12px;';
    helmLabel.innerHTML = '<span style="color:#88aaff;">HELMET — ' + _currentHelmet.label + '</span>'
      + '<span style="color:#ccc;">' + (_currentHelmet.maxHP > 0 ? Math.ceil(_helmetHP) + ' / ' + _currentHelmet.maxHP + ' HP' : 'N/A') + '</span>';
    helmSec.appendChild(helmLabel);

    if (_currentHelmet.maxHP > 0) {
      var helmBarOuter = document.createElement('div');
      helmBarOuter.style.cssText = 'width:100%;height:10px;background:#222;border:1px solid #555;border-radius:4px;overflow:hidden;';
      var helmBarInner = document.createElement('div');
      var helmPct = (_helmetHP / _currentHelmet.maxHP * 100).toFixed(1);
      helmBarInner.style.cssText = 'height:100%;width:' + helmPct + '%;background:' + (_helmetBroken ? '#333' : '#88aaff') + ';transition:width 0.2s;';
      helmBarOuter.appendChild(helmBarInner);
      helmSec.appendChild(helmBarOuter);

      if (_currentHelmet.hasNVG) {
        var nvgNote = document.createElement('div');
        nvgNote.textContent = 'NVG Rail equipped';
        nvgNote.style.cssText = 'font-size:10px;color:#0f0;';
        helmSec.appendChild(nvgNote);
      }
    }
    statsCol.appendChild(helmSec);

    // Divider
    var div = document.createElement('hr');
    div.style.cssText = 'border:none;border-top:1px solid #333;margin:0;';
    statsCol.appendChild(div);

    // Performance stats
    var perfSec = document.createElement('div');
    perfSec.style.cssText = 'font-size:11px;color:#777;display:flex;flex-direction:column;gap:4px;';
    perfSec.innerHTML = [
      '<span>Speed multiplier: <b style="color:#ccc;">' + ((1 - _currentTier.speedPenalty) * 100).toFixed(0) + '%</b></span>',
      '<span>Stamina drain: <b style="color:#f80;">' + _currentTier.staminaMult.toFixed(2) + 'x</b></span>',
      '<span>Repairs used: <b style="color:#0cf;">' + _repairCount + ' / ' + _maxRepairs + '</b></span>'
    ].join('');
    statsCol.appendChild(perfSec);

    var closeHint = document.createElement('div');
    closeHint.textContent = '[I] or [ESC] Close';
    closeHint.style.cssText = 'font-size:10px;color:#444;letter-spacing:2px;margin-top:4px;';
    statsCol.appendChild(closeHint);

    _inventoryPanel.appendChild(statsCol);
  }

  function _toggleInventory() {
    _inventoryVisible = !_inventoryVisible;
    if (!_inventoryPanel) _createInventoryPanel();
    if (_inventoryVisible) {
      _renderInventoryPanel();
      _inventoryPanel.style.display = 'flex';
    } else {
      _inventoryPanel.style.display = 'none';
    }
  }

  // ─────────────────────────────────────────────── equip helpers
  function _equipTier(tierId) {
    var tier = TIERS[tierId];
    if (!tier) return;
    _currentTier = tier;
    _armorHP = tier.maxHP;
    _armorBroken = (tier.maxHP === 0);
    _repairCount = 0;
    _playEquip();
    _buildChestPlateMesh();
    _updateHUD();
  }

  function _equipHelmet(helmetId) {
    var helm = HELMETS[helmetId];
    if (!helm) return;
    _currentHelmet = helm;
    _helmetHP = helm.maxHP;
    _helmetBroken = (helm.maxHP === 0);
    _playEquip();
    _updateHUD();
  }

  // ─────────────────────────────────────────────── damage system
  // hitLocation: 'HEAD', 'BODY', 'LIMB'
  // Returns actual damage that reaches the player HP
  function applyDamage(rawDamage, hitLocation, hitDir) {
    var loc = hitLocation || HIT_LOCATION.BODY;
    var playerDamage = rawDamage;

    if (loc === HIT_LOCATION.LIMB) {
      // Limb hits bypass armor entirely
      return rawDamage;
    }

    if (loc === HIT_LOCATION.HEAD) {
      if (!_helmetBroken && _currentHelmet.maxHP > 0) {
        // Helmet absorbs 75%, 25% bleed through
        var helmetAbsorb = rawDamage * 0.75;
        playerDamage = rawDamage * 0.25;
        _helmetHP -= helmetAbsorb;
        if (_helmetHP <= 0) {
          _helmetHP = 0;
          _helmetBroken = true;
          _playCrackSound();
        } else {
          _playArmorHit();
        }
      } else {
        // No helmet: 2x head damage
        playerDamage = rawDamage * 2.0;
      }
      _updateHUD();
      return playerDamage;
    }

    // BODY hit
    if (!_armorBroken && _armorHP > 0) {
      // 75% to armor, 25% bleed through
      var armorAbsorb = rawDamage * 0.75;
      playerDamage = rawDamage * 0.25;
      _armorHP -= armorAbsorb;
      if (_armorHP <= 0) {
        _armorHP = 0;
        _armorBroken = true;
        _playCrackSound();
        _updateCrackVisibility();
        if (_chestPlateMesh && _chestPlateMesh.material) {
          _chestPlateMesh.material.color.setHex(0x333333);
        }
      } else {
        _playArmorHit();
        _updateCrackVisibility();
      }
    } else {
      // Armor broken or none — full damage
      playerDamage = rawDamage;
    }

    _updateHUD();
    return playerDamage;
  }

  // ─────────────────────────────────────────────── repair
  // Called when player is near LogisticsSystem supply truck or FieldHospital
  function repairArmor(amount) {
    if (_repairCount >= _maxRepairs) return false;
    var repairAmt = amount !== undefined ? amount : 100;
    _armorHP = Math.min(_currentTier.maxHP, _armorHP + repairAmt);
    if (_armorHP > 0) {
      _armorBroken = false;
    }
    _repairCount++;
    _playRepair();
    _buildChestPlateMesh();
    _updateHUD();
    return true;
  }

  // ─────────────────────────────────────────────── speed / stamina
  function getSpeedMultiplier() {
    return 1.0 - _currentTier.speedPenalty;
  }

  function getStaminaDrainRate() {
    return _currentTier.staminaMult;
  }

  // ─────────────────────────────────────────────── keyboard input
  function _onKeyDown(e) {
    var key = (e.key || '').toLowerCase();

    if (key === 'a') {
      _keyA = true;
      _comboTimer = 0.4;
    }
    if (key === 'r') {
      _keyR = true;
      _comboTimer = 0.4;
    }

    // A+R combo: open armor selection
    if (_keyA && _keyR) {
      _keyA = false;
      _keyR = false;
      _comboTimer = 0;
      if (_selectionVisible) {
        _closeSelectionPanel();
      } else {
        openArmorSelection();
      }
      return;
    }

    // I: inventory screen
    if (key === 'i') {
      if (_selectionVisible) _closeSelectionPanel();
      _toggleInventory();
      return;
    }

    // ESC: close any open panel
    if (e.key === 'Escape') {
      if (_selectionVisible) _closeSelectionPanel();
      if (_inventoryVisible) {
        _inventoryVisible = false;
        if (_inventoryPanel) _inventoryPanel.style.display = 'none';
      }
    }
  }

  function _onKeyUp(e) {
    var key = (e.key || '').toLowerCase();
    if (key === 'a') _keyA = false;
    if (key === 'r') _keyR = false;
  }

  // ─────────────────────────────────────────────── init
  function init(scene, camera) {
    if (_initialized) return;
    _initialized = true;
    _scene = scene;
    _camera = camera;

    _createHUD();
    _createSelectionPanel();
    _createInventoryPanel();

    // Default loadout
    _currentTier = TIERS.LEVEL_I;
    _armorHP = _currentTier.maxHP;
    _armorBroken = false;
    _currentHelmet = HELMETS.NONE;
    _helmetHP = 0;
    _helmetBroken = false;
    _repairCount = 0;

    // Build initial chest mesh if camera available
    if (_camera && _currentTier.maxHP > 0) {
      _buildChestPlateMesh();
    }

    _updateHUD();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
  }

  // ─────────────────────────────────────────────── update
  function update(delta) {
    if (!_initialized) return;

    // Combo key timeout
    if (_comboTimer > 0) {
      _comboTimer -= delta;
      if (_comboTimer <= 0) {
        _comboTimer = 0;
        _keyA = false;
        _keyR = false;
      }
    }

    _updateHUD();
  }

  // ─────────────────────────────────────────────── reset
  function reset() {
    _currentTier = TIERS.LEVEL_I;
    _armorHP = _currentTier.maxHP;
    _armorBroken = false;
    _currentHelmet = HELMETS.NONE;
    _helmetHP = 0;
    _helmetBroken = false;
    _repairCount = 0;
    _cracksVisible = false;
    _keyA = false;
    _keyR = false;
    _comboTimer = 0;

    _removeChestMeshes();
    if (_camera && _currentTier.maxHP > 0) {
      _buildChestPlateMesh();
    }

    if (_selectionVisible) _closeSelectionPanel();
    if (_inventoryVisible) {
      _inventoryVisible = false;
      if (_inventoryPanel) _inventoryPanel.style.display = 'none';
    }

    _updateHUD();
  }

  // ─────────────────────────────────────────────── public API
  return {
    init: init,
    update: update,
    reset: reset,
    applyDamage: applyDamage,
    repairArmor: repairArmor,
    openArmorSelection: openArmorSelection,
    getSpeedMultiplier: getSpeedMultiplier,
    getStaminaDrainRate: getStaminaDrainRate,
    TIERS: TIERS,
    HELMETS: HELMETS,
    HIT_LOCATION: HIT_LOCATION
  };
})();
