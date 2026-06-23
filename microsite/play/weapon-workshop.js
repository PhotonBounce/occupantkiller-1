/* ─────────────────────────────────────────────────────────────────────────────
   weapon-workshop.js  — field weapon upgrade workbench
   Depends on: THREE (global), optional GameManager, LootSystem, DogTagCollector

   Public API  (window.WeaponWorkshop):
     init(scene, camera)      — call once after THREE scene exists
     update(dt)               — call every frame with delta-seconds
     spawnWorkshop(x, y, z)  — place a workbench in the world (max 2 per level)
     openWorkshop()           — open the upgrade UI programmatically
     reset()                  — clear all state (new game / restart)

   Global multipliers applied:
     window._weaponDamageMult  — damage multiplier (BARREL_UPGRADE)
     window._recoilMult        — recoil multiplier  (STOCK_UPGRADE)
     window._magBonus          — magazine bonus      (MAG_UPGRADE)
     window._fireRateMult      — fire rate mult      (TRIGGER_UPGRADE)
     window._adsSpeedMult      — ADS speed mult      (GRIP_UPGRADE)
     window._zoomMult          — zoom multiplier     (OPTIC_UPGRADE)

   Upgrade currency:
     window._scrapMetal  (preferred) or window._score

   Persistence:
     localStorage key 'ok_weaponUpgrades'
   ───────────────────────────────────────────────────────────────────────────── */

window.WeaponWorkshop = (function () {
  'use strict';

  /* ─── upgrade definitions ─────────────────────────────────────────────── */
  var UPGRADES = [
    {
      id:         'BARREL_UPGRADE',
      label:      'BARREL',
      desc:       '+15% Damage',
      cost:       [50, 100, 150],
      rareParts:  [0, 1, 2],
      maxTier:    3,
      apply:      function (tier) {
        window._weaponDamageMult = (window._weaponDamageMult || 1.0) * 1.15;
      },
      resultText: function (tier) {
        return 'BARREL LV.' + tier + ' — DAMAGE +' + (tier * 15) + '%';
      }
    },
    {
      id:         'STOCK_UPGRADE',
      label:      'STOCK',
      desc:       '-10% Recoil',
      cost:       [50, 100, 150],
      rareParts:  [0, 0, 1],
      maxTier:    3,
      apply:      function (tier) {
        window._recoilMult = (window._recoilMult || 1.0) * 0.90;
      },
      resultText: function (tier) {
        return 'STOCK LV.' + tier + ' — RECOIL -' + (tier * 10) + '%';
      }
    },
    {
      id:         'MAG_UPGRADE',
      label:      'MAGAZINE',
      desc:       '+8 Rounds',
      cost:       [75, 125, 175],
      rareParts:  [0, 0, 1],
      maxTier:    3,
      apply:      function (tier) {
        window._magBonus = (window._magBonus || 0) + 8;
      },
      resultText: function (tier) {
        return 'MAG LV.' + tier + ' — CAPACITY +' + (tier * 8) + ' RDS';
      }
    },
    {
      id:         'TRIGGER_UPGRADE',
      label:      'TRIGGER',
      desc:       '+12% Fire Rate',
      cost:       [60, 120, 200],
      rareParts:  [0, 1, 2],
      maxTier:    3,
      apply:      function (tier) {
        window._fireRateMult = (window._fireRateMult || 1.0) * 1.12;
      },
      resultText: function (tier) {
        return 'TRIGGER LV.' + tier + ' — FIRE RATE +' + (tier * 12) + '%';
      }
    },
    {
      id:         'GRIP_UPGRADE',
      label:      'GRIP',
      desc:       '+20% ADS Speed',
      cost:       [60, 100, 140],
      rareParts:  [0, 0, 1],
      maxTier:    3,
      apply:      function (tier) {
        window._adsSpeedMult = (window._adsSpeedMult || 1.0) * 1.20;
      },
      resultText: function (tier) {
        return 'GRIP LV.' + tier + ' — ADS SPEED +' + (tier * 20) + '%';
      }
    },
    {
      id:         'OPTIC_UPGRADE',
      label:      'OPTIC',
      desc:       '+0.5x Zoom',
      cost:       [80, 130, 180],
      rareParts:  [0, 1, 1],
      maxTier:    3,
      apply:      function (tier) {
        window._zoomMult = (window._zoomMult || 1.0) * 1.167;  /* approx +0.5x per tier */
      },
      resultText: function (tier) {
        return 'OPTIC LV.' + tier + ' — ZOOM +' + (tier * 0.5).toFixed(1) + 'x';
      }
    }
  ];

  /* ─── module state ────────────────────────────────────────────────────── */
  var _scene   = null;
  var _camera  = null;

  /* workshop benches: { mesh, light, glowLight, pos:{x,y,z}, proximityGlow } */
  var _stations   = [];
  var MAX_STATIONS = 2;

  /* upgrade tiers persisted per upgrade id */
  var _tiers = {};

  /* UI state */
  var _uiOpen          = false;
  var _panelEl         = null;
  var _selectedIndex   = 0;
  var _upgrading       = false;
  var _upgradeTimer    = 0;
  var _upgradeDuration = 1.5;
  var _upgradeIndex    = 0;

  /* progress bar elements */
  var _progressWrapEl  = null;
  var _progressBarEl   = null;
  var _progressLabelEl = null;

  /* result text element */
  var _resultEl        = null;
  var _resultTimer     = 0;

  /* toast */
  var _toastEl    = null;
  var _toastTimer = 0;

  /* flash state: { light, timer } */
  var _flash = null;

  /* ─── global mult init ────────────────────────────────────────────────── */
  window._weaponDamageMult = window._weaponDamageMult || 1.0;
  window._recoilMult       = window._recoilMult       || 1.0;
  window._magBonus         = window._magBonus         || 0;
  window._fireRateMult     = window._fireRateMult     || 1.0;
  window._adsSpeedMult     = window._adsSpeedMult     || 1.0;
  window._zoomMult         = window._zoomMult         || 1.0;
  window._scrapMetal       = window._scrapMetal       || 0;
  window._rareParts        = window._rareParts        || 0;

  /* ─── helpers ─────────────────────────────────────────────────────────── */
  function _getScene() {
    if (_scene) return _scene;
    if (window.GameManager && window.GameManager.scene) return window.GameManager.scene;
    if (window._scene) return window._scene;
    return null;
  }

  function _getCamera() {
    if (_camera) return _camera;
    if (window.GameManager && window.GameManager.camera) return window.GameManager.camera;
    if (window._camera) return window._camera;
    return null;
  }

  function _getCurrency() {
    if (typeof window._scrapMetal === 'number' && window._scrapMetal > 0) return window._scrapMetal;
    return (window._score || 0);
  }

  function _spendCurrency(amount) {
    if (typeof window._scrapMetal === 'number' && window._scrapMetal >= amount) {
      window._scrapMetal -= amount;
      return true;
    }
    if (typeof window._score === 'number' && window._score >= amount) {
      window._score -= amount;
      return true;
    }
    return false;
  }

  function _getRareParts() {
    /* check LootSystem, DogTagCollector, or direct global */
    if (window.LootSystem && typeof window.LootSystem.rareParts === 'number') {
      return window.LootSystem.rareParts;
    }
    if (window.DogTagCollector && typeof window.DogTagCollector.rareParts === 'number') {
      return window.DogTagCollector.rareParts;
    }
    return (window._rareParts || 0);
  }

  function _spendRareParts(amount) {
    if (amount <= 0) return true;
    if (window.LootSystem && typeof window.LootSystem.rareParts === 'number') {
      if (window.LootSystem.rareParts >= amount) {
        window.LootSystem.rareParts -= amount;
        return true;
      }
      return false;
    }
    if (window.DogTagCollector && typeof window.DogTagCollector.rareParts === 'number') {
      if (window.DogTagCollector.rareParts >= amount) {
        window.DogTagCollector.rareParts -= amount;
        return true;
      }
      return false;
    }
    if (typeof window._rareParts === 'number' && window._rareParts >= amount) {
      window._rareParts -= amount;
      return true;
    }
    return false;
  }

  function _distSq(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return dx*dx + dy*dy + dz*dz;
  }

  /* ─── persistence ─────────────────────────────────────────────────────── */
  function _saveTiers() {
    try {
      localStorage.setItem('ok_weaponUpgrades', JSON.stringify(_tiers));
    } catch (e) { /* ignore */ }
  }

  function _loadTiers() {
    try {
      var raw = localStorage.getItem('ok_weaponUpgrades');
      if (raw) _tiers = JSON.parse(raw);
    } catch (e) { _tiers = {}; }
  }

  function _applyAllUpgrades() {
    /* reset multipliers to 1 before reapplying */
    window._weaponDamageMult = 1.0;
    window._recoilMult       = 1.0;
    window._magBonus         = 0;
    window._fireRateMult     = 1.0;
    window._adsSpeedMult     = 1.0;
    window._zoomMult         = 1.0;

    var i, upg, tier, t;
    for (i = 0; i < UPGRADES.length; i++) {
      upg  = UPGRADES[i];
      tier = _tiers[upg.id] || 0;
      for (t = 0; t < tier; t++) {
        upg.apply(t + 1);
      }
    }
  }

  /* ─── 3-D geometry ────────────────────────────────────────────────────── */
  function _buildBenchMesh() {
    var group = new THREE.Group();

    /* main workbench body */
    var bodyGeo = new THREE.BoxGeometry(2.0, 0.8, 1.0);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    /* legs */
    var legGeo = new THREE.BoxGeometry(0.08, 0.8, 0.08);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var legPositions = [
      [-0.9, -0.4,  0.45],
      [ 0.9, -0.4,  0.45],
      [-0.9, -0.4, -0.45],
      [ 0.9, -0.4, -0.45]
    ];
    var li, leg;
    for (li = 0; li < legPositions.length; li++) {
      leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(legPositions[li][0], legPositions[li][1], legPositions[li][2]);
      leg.castShadow = true;
      group.add(leg);
    }

    /* tool: small cylinder (wrench-like) on top */
    var cylGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
    var cylMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var cyl    = new THREE.Mesh(cylGeo, cylMat);
    cyl.rotation.z = Math.PI / 4;
    cyl.position.set(-0.5, 0.85, 0.1);
    group.add(cyl);

    /* tool: small box (ammo box) on top */
    var boxGeo = new THREE.BoxGeometry(0.25, 0.15, 0.18);
    var boxMat = new THREE.MeshLambertMaterial({ color: 0x4a6a2a });
    var box    = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(0.5, 0.88, -0.1);
    group.add(box);

    /* vise-like block on top */
    var viseGeo = new THREE.BoxGeometry(0.18, 0.14, 0.14);
    var viseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var vise    = new THREE.Mesh(viseGeo, viseMat);
    vise.position.set(0.0, 0.87, 0.2);
    group.add(vise);

    return group;
  }

  /* ─── spawn ──────────────────────────────────────────────────────────── */
  function spawnWorkshop(x, y, z) {
    var sc = _getScene();
    if (!sc) return;
    if (_stations.length >= MAX_STATIONS) {
      console.warn('[WeaponWorkshop] max stations (' + MAX_STATIONS + ') reached');
      return;
    }

    var group = _buildBenchMesh();
    group.position.set(x, y, z);
    sc.add(group);

    /* warm yellow point light above bench */
    var warmLight = new THREE.PointLight(0xffcc66, 1.2, 5);
    warmLight.position.set(x, y + 2.5, z);
    sc.add(warmLight);

    /* faint green proximity glow (shown when player within 10m) */
    var glowLight = new THREE.PointLight(0x44ff88, 0.0, 12);
    glowLight.position.set(x, y + 1.5, z);
    sc.add(glowLight);

    _stations.push({
      mesh:         group,
      light:        warmLight,
      glowLight:    glowLight,
      pos:          { x: x, y: y, z: z },
      proximityGlow: false
    });
  }

  /* ─── proximity & interaction ────────────────────────────────────────── */
  function _checkProximity() {
    var cam = _getCamera();
    if (!cam) return;
    var camPos = cam.position;
    var i, st, d2;
    for (i = 0; i < _stations.length; i++) {
      st = _stations[i];
      d2 = _distSq(camPos, st.pos);

      /* glow within 10m */
      if (d2 <= 100) {
        if (!st.proximityGlow) {
          st.glowLight.intensity = 0.6;
          st.proximityGlow = true;
        }
      } else {
        if (st.proximityGlow) {
          st.glowLight.intensity = 0.0;
          st.proximityGlow = false;
        }
      }

      /* prompt: within 2m (d2 <= 4) show hint */
      if (d2 <= 4) {
        _showProximityHint(true);
      }
    }
    /* hide hint if no station within 2m */
    var anyClose = false;
    for (i = 0; i < _stations.length; i++) {
      if (_distSq(camPos, _stations[i].pos) <= 4) { anyClose = true; break; }
    }
    _showProximityHint(anyClose);
  }

  /* ─── proximity hint ─────────────────────────────────────────────────── */
  var _hintEl     = null;
  var _hintVisible = false;

  function _buildHint() {
    if (_hintEl) return;
    _hintEl = document.createElement('div');
    _hintEl.id = 'ww-proximity-hint';
    _hintEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#ffdd88',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'letter-spacing:1px',
      'padding:6px 18px',
      'border:1px solid #886600',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:900',
      'display:none'
    ].join(';');
    _hintEl.textContent = '[F] Open Weapon Workshop';
    document.body.appendChild(_hintEl);
  }

  function _showProximityHint(show) {
    if (!_hintEl) _buildHint();
    if (show === _hintVisible) return;
    _hintVisible = show;
    _hintEl.style.display = show ? 'block' : 'none';
  }

  /* ─── UI panel ────────────────────────────────────────────────────────── */
  function _buildPanel() {
    if (_panelEl) return;

    _panelEl = document.createElement('div');
    _panelEl.id = 'ww-panel';
    _panelEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(5,5,10,0.92)',
      'color:#e0e0c0',
      'font-family:monospace',
      'z-index:2000',
      'display:none',
      'overflow:auto'
    ].join(';');
    document.body.appendChild(_panelEl);
  }

  function _renderPanel() {
    if (!_panelEl) return;

    var currency    = _getCurrency();
    var rareParts   = _getRareParts();
    var html        = '';

    /* header */
    html += '<div style="text-align:center;padding:30px 20px 10px;">';
    html += '<div style="font-size:22px;font-weight:bold;color:#ffcc44;letter-spacing:3px;text-shadow:0 0 12px #cc8800;">&#9874; WEAPON WORKSHOP &#9874;</div>';
    html += '<div style="margin-top:8px;font-size:13px;color:#aaa;">Upgrade your weapon for enhanced battlefield performance</div>';
    html += '</div>';

    /* currency bar */
    html += '<div style="text-align:center;margin-bottom:16px;">';
    html += '<span style="color:#ffdd88;font-size:14px;font-weight:bold;">&#9652; SCRAP: ' + currency + '</span>';
    html += '&nbsp;&nbsp;&nbsp;';
    html += '<span style="color:#88ddff;font-size:14px;font-weight:bold;">&#9670; RARE PARTS: ' + rareParts + '</span>';
    html += '</div>';

    /* upgrades grid */
    html += '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px;padding:0 20px 20px;">';

    var i, upg, tier, cost, rp, canAfford, maxed;
    for (i = 0; i < UPGRADES.length; i++) {
      upg    = UPGRADES[i];
      tier   = _tiers[upg.id] || 0;
      maxed  = tier >= upg.maxTier;
      cost   = maxed ? 0 : upg.cost[tier];
      rp     = maxed ? 0 : upg.rareParts[tier];
      canAfford = maxed ? false : (currency >= cost && rareParts >= rp);

      var isSelected = (i === _selectedIndex);
      var borderColor = isSelected ? '#ffcc44' : (maxed ? '#44cc44' : (canAfford ? '#667744' : '#444'));
      var bgColor     = isSelected ? 'rgba(255,200,50,0.12)' : 'rgba(20,20,30,0.8)';

      html += '<div id="ww-upg-' + i + '" style="';
      html += 'width:200px;min-height:160px;';
      html += 'border:2px solid ' + borderColor + ';';
      html += 'border-radius:6px;';
      html += 'background:' + bgColor + ';';
      html += 'padding:14px;';
      html += 'cursor:pointer;';
      html += 'box-sizing:border-box;';
      html += 'transition:border-color 0.15s;';
      html += '">';

      /* tier pips */
      var pips = '', p;
      for (p = 0; p < upg.maxTier; p++) {
        pips += '<span style="color:' + (p < tier ? '#ffcc44' : '#444') + ';margin-right:2px;">&#9632;</span>';
      }

      html += '<div style="font-size:15px;font-weight:bold;color:#ffdd88;margin-bottom:4px;">' + upg.label + '</div>';
      html += '<div style="font-size:11px;color:#aaa;margin-bottom:8px;">' + upg.desc + '</div>';
      html += '<div style="margin-bottom:10px;">' + pips + '</div>';

      if (maxed) {
        html += '<div style="font-size:12px;color:#44cc44;font-weight:bold;">&#10003; MAXED OUT</div>';
      } else {
        html += '<div style="font-size:12px;color:' + (canAfford ? '#e0e080' : '#666') + ';">';
        html += '&#9652; ' + cost + ' SCRAP';
        if (rp > 0) {
          html += '&nbsp;&nbsp;&#9670; ' + rp + ' RARE';
        }
        html += '</div>';
        html += '<div style="margin-top:8px;">';
        html += '<button onclick="window.WeaponWorkshop._uiPurchase(' + i + ')" style="';
        html += 'background:' + (canAfford ? '#664400' : '#222') + ';';
        html += 'color:' + (canAfford ? '#ffcc44' : '#555') + ';';
        html += 'border:1px solid ' + (canAfford ? '#cc8800' : '#444') + ';';
        html += 'font-family:monospace;font-size:11px;font-weight:bold;';
        html += 'padding:5px 12px;border-radius:3px;cursor:' + (canAfford ? 'pointer' : 'default') + ';';
        html += 'letter-spacing:0.5px;';
        html += '">' + (canAfford ? 'UPGRADE' : 'LOCKED') + '</button>';
        html += '</div>';
      }

      html += '</div>';  /* end card */
    }

    html += '</div>';  /* end grid */

    /* current stats summary */
    html += '<div style="text-align:center;padding:10px 20px 20px;border-top:1px solid #333;margin-top:10px;">';
    html += '<div style="font-size:12px;color:#888;margin-bottom:8px;letter-spacing:1px;">CURRENT WEAPON STATS</div>';
    html += '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px;font-size:12px;color:#b0b0a0;">';
    html += '<span>DMG: x' + (window._weaponDamageMult || 1).toFixed(2) + '</span>';
    html += '<span>RECOIL: x' + (window._recoilMult || 1).toFixed(2) + '</span>';
    html += '<span>MAG+' + (window._magBonus || 0) + '</span>';
    html += '<span>FIRE: x' + (window._fireRateMult || 1).toFixed(2) + '</span>';
    html += '<span>ADS: x' + (window._adsSpeedMult || 1).toFixed(2) + '</span>';
    html += '<span>ZOOM: x' + (window._zoomMult || 1).toFixed(2) + '</span>';
    html += '</div>';
    html += '</div>';

    /* footer */
    html += '<div style="text-align:center;padding-bottom:24px;">';
    html += '<div style="font-size:11px;color:#666;letter-spacing:1px;">[ESC] Close Workshop&nbsp;&nbsp;[Click upgrade card or button]</div>';
    html += '</div>';

    _panelEl.innerHTML = html;
  }

  function openWorkshop() {
    if (_upgrading) return;
    _uiOpen = true;
    if (!_panelEl) _buildPanel();
    _panelEl.style.display = 'block';
    _renderPanel();
    /* hide pointer-lock hint */
    if (document.exitPointerLock) {
      try { document.exitPointerLock(); } catch(e) { /* ignore */ }
    }
  }

  function _closeWorkshop() {
    _uiOpen = false;
    if (_panelEl) _panelEl.style.display = 'none';
    _hideProgress();
  }

  /* ─── progress bar ────────────────────────────────────────────────────── */
  function _buildProgress() {
    if (_progressWrapEl) return;

    _progressWrapEl = document.createElement('div');
    _progressWrapEl.id = 'ww-progress-wrap';
    _progressWrapEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.92)',
      'border:2px solid #cc8800',
      'border-radius:8px',
      'padding:24px 40px',
      'text-align:center',
      'z-index:3000',
      'display:none',
      'min-width:280px'
    ].join(';');

    _progressLabelEl = document.createElement('div');
    _progressLabelEl.style.cssText = [
      'color:#ffcc44',
      'font-family:monospace',
      'font-size:16px',
      'font-weight:bold',
      'letter-spacing:2px',
      'margin-bottom:14px',
      'text-shadow:0 0 8px #cc8800'
    ].join(';');
    _progressLabelEl.textContent = 'UPGRADING...';

    var track = document.createElement('div');
    track.style.cssText = [
      'background:rgba(0,0,0,0.6)',
      'border:1px solid #664400',
      'border-radius:4px',
      'height:14px',
      'overflow:hidden'
    ].join(';');

    _progressBarEl = document.createElement('div');
    _progressBarEl.style.cssText = [
      'background:linear-gradient(90deg,#cc6600,#ffcc44)',
      'height:100%',
      'width:0%',
      'transition:none'
    ].join(';');

    track.appendChild(_progressBarEl);
    _progressWrapEl.appendChild(_progressLabelEl);
    _progressWrapEl.appendChild(track);
    document.body.appendChild(_progressWrapEl);
  }

  function _showProgress() {
    if (!_progressWrapEl) _buildProgress();
    _progressLabelEl.textContent = 'UPGRADING...';
    _progressBarEl.style.width   = '0%';
    _progressWrapEl.style.display = 'block';
  }

  function _hideProgress() {
    if (_progressWrapEl) _progressWrapEl.style.display = 'none';
  }

  /* ─── result text ─────────────────────────────────────────────────────── */
  function _buildResultEl() {
    if (_resultEl) return;
    _resultEl = document.createElement('div');
    _resultEl.id = 'ww-result';
    _resultEl.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#88ff88',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'letter-spacing:2px',
      'padding:12px 28px',
      'border:2px solid #44aa44',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:3100',
      'display:none',
      'text-align:center',
      'text-shadow:0 0 10px #44ff44'
    ].join(';');
    document.body.appendChild(_resultEl);
  }

  function _showResult(text) {
    if (!_resultEl) _buildResultEl();
    _resultEl.textContent = text;
    _resultEl.style.display = 'block';
    _resultTimer = 2.5;
  }

  /* ─── toast ──────────────────────────────────────────────────────────── */
  function _buildToast() {
    if (_toastEl) return;
    _toastEl = document.createElement('div');
    _toastEl.id = 'ww-toast';
    _toastEl.style.cssText = [
      'position:fixed',
      'top:28%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:#ff8888',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'letter-spacing:1px',
      'padding:8px 20px',
      'border:1px solid #aa4444',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:3200',
      'display:none'
    ].join(';');
    document.body.appendChild(_toastEl);
  }

  function _showToast(msg) {
    if (!_toastEl) _buildToast();
    _toastEl.textContent = msg;
    _toastEl.style.display = 'block';
    _toastTimer = 2.0;
  }

  /* ─── flash animation on weapon mesh ─────────────────────────────────── */
  function _flashWeapon() {
    var sc = _getScene();
    if (!sc) return;
    var cam = _getCamera();
    if (!cam) return;

    /* create a white point light near camera */
    var flashLight = new THREE.PointLight(0xffffff, 3.0, 4);
    if (cam.position) {
      flashLight.position.set(cam.position.x, cam.position.y, cam.position.z);
    }
    sc.add(flashLight);
    _flash = { light: flashLight, timer: 0.3 };
  }

  /* ─── purchase logic ──────────────────────────────────────────────────── */
  /* exposed on module for onclick handlers */
  function _uiPurchase(index) {
    if (_upgrading) return;
    if (index < 0 || index >= UPGRADES.length) return;

    var upg  = UPGRADES[index];
    var tier = _tiers[upg.id] || 0;

    if (tier >= upg.maxTier) {
      _showToast(upg.label + ' IS ALREADY MAXED');
      return;
    }

    var cost = upg.cost[tier];
    var rp   = upg.rareParts[tier];

    if (_getCurrency() < cost) {
      _showToast('NOT ENOUGH SCRAP METAL (' + cost + ' needed)');
      return;
    }
    if (_getRareParts() < rp) {
      _showToast('NOT ENOUGH RARE PARTS (' + rp + ' needed)');
      return;
    }

    /* spend resources */
    if (!_spendCurrency(cost)) {
      _showToast('TRANSACTION FAILED');
      return;
    }
    if (!_spendRareParts(rp)) {
      /* refund currency if rare parts fail */
      if (typeof window._scrapMetal === 'number') window._scrapMetal += cost;
      else if (typeof window._score === 'number') window._score += cost;
      _showToast('RARE PARTS TRANSACTION FAILED');
      return;
    }

    /* begin upgrade animation */
    _upgrading    = true;
    _upgradeIndex = index;
    _upgradeTimer = 0;

    /* hide main panel, show progress */
    if (_panelEl) _panelEl.style.display = 'none';
    _showProgress();
  }

  function _finishUpgrade() {
    var upg   = UPGRADES[_upgradeIndex];
    var tier  = (_tiers[upg.id] || 0) + 1;
    _tiers[upg.id] = tier;

    /* apply upgrade */
    upg.apply(tier);

    /* persist */
    _saveTiers();

    /* hide progress */
    _hideProgress();

    /* flash */
    _flashWeapon();

    /* show result text */
    _showResult(upg.resultText(tier));

    /* re-open panel after result */
    setTimeout(function () {
      _upgrading = false;
      if (_uiOpen) {
        if (_panelEl) _panelEl.style.display = 'block';
        _renderPanel();
      }
    }, 2000);
  }

  /* ─── keyboard handler ────────────────────────────────────────────────── */
  function _onKey(e) {
    var key = e.key || e.code;

    /* F key — open workshop when near a station */
    if ((key === 'f' || key === 'F') && !_uiOpen) {
      var cam = _getCamera();
      if (!cam) return;
      var i, anyClose = false;
      for (i = 0; i < _stations.length; i++) {
        if (_distSq(cam.position, _stations[i].pos) <= 4) {
          anyClose = true;
          break;
        }
      }
      if (anyClose || _stations.length === 0) {
        openWorkshop();
      }
      return;
    }

    /* Escape — close */
    if (key === 'Escape' && _uiOpen) {
      _closeWorkshop();
      return;
    }
  }

  /* ─── update ─────────────────────────────────────────────────────────── */
  function update(dt) {
    /* proximity checks */
    if (_stations.length > 0) {
      _checkProximity();
    }

    /* upgrade progress bar */
    if (_upgrading) {
      _upgradeTimer += dt;
      var pct = Math.min(_upgradeTimer / _upgradeDuration, 1.0);
      if (_progressBarEl) {
        _progressBarEl.style.width = (pct * 100).toFixed(1) + '%';
      }
      if (_upgradeTimer >= _upgradeDuration) {
        _finishUpgrade();
      }
    }

    /* flash decay */
    if (_flash) {
      _flash.timer -= dt;
      if (_flash.timer <= 0) {
        var sc = _getScene();
        if (sc) sc.remove(_flash.light);
        _flash = null;
      } else {
        /* fade intensity */
        _flash.light.intensity = 3.0 * (_flash.timer / 0.3);
      }
    }

    /* toast fade */
    if (_toastTimer > 0) {
      _toastTimer -= dt;
      if (_toastTimer <= 0 && _toastEl) {
        _toastEl.style.display = 'none';
      }
    }

    /* result fade */
    if (_resultTimer > 0) {
      _resultTimer -= dt;
      if (_resultTimer <= 0 && _resultEl) {
        _resultEl.style.display = 'none';
      }
    }
  }

  /* ─── init ────────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;

    /* load saved tiers and reapply stats */
    _loadTiers();
    _applyAllUpgrades();

    /* build DOM */
    _buildHint();
    _buildPanel();
    _buildProgress();
    _buildResultEl();
    _buildToast();

    /* key listener */
    document.addEventListener('keydown', _onKey);
  }

  /* ─── reset ─────────────────────────────────────────────────────────────*/
  function reset() {
    /* clear tiers */
    _tiers = {};
    _saveTiers();

    /* reset multipliers */
    window._weaponDamageMult = 1.0;
    window._recoilMult       = 1.0;
    window._magBonus         = 0;
    window._fireRateMult     = 1.0;
    window._adsSpeedMult     = 1.0;
    window._zoomMult         = 1.0;

    /* remove 3D stations */
    var sc = _getScene();
    var i, st;
    for (i = 0; i < _stations.length; i++) {
      st = _stations[i];
      if (sc) {
        sc.remove(st.mesh);
        sc.remove(st.light);
        sc.remove(st.glowLight);
      }
    }
    _stations = [];

    /* close UI */
    _closeWorkshop();
    _upgrading    = false;
    _upgradeTimer = 0;
    _flash        = null;

    if (_hintEl) { _hintEl.style.display = 'none'; _hintVisible = false; }
    if (_resultEl) _resultEl.style.display = 'none';
    if (_toastEl) _toastEl.style.display = 'none';
  }

  /* ─── public API ──────────────────────────────────────────────────────── */
  return {
    init:          init,
    update:        update,
    spawnWorkshop: spawnWorkshop,
    openWorkshop:  openWorkshop,
    reset:         reset,
    /* exposed for onclick handlers in rendered HTML */
    _uiPurchase:   _uiPurchase
  };

}());
