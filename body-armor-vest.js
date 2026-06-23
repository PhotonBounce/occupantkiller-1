window.BodyArmorVest = (function() {
  'use strict';

  // ── Armor tier constants ──────────────────────────────────────────────────
  var TIER = {
    NONE:   { name: 'NONE',   hp: 0,   speedMult: 1.0,  accuracyMult: 1.0,  absorption: 0.70, color: null },
    LIGHT:  { name: 'LIGHT',  hp: 60,  speedMult: 1.0,  accuracyMult: 1.0,  absorption: 0.70, color: 0x4488ff },
    MEDIUM: { name: 'MEDIUM', hp: 120, speedMult: 0.9,  accuracyMult: 1.0,  absorption: 0.70, color: 0x44bb44 },
    HEAVY:  { name: 'HEAVY',  hp: 200, speedMult: 0.75, accuracyMult: 0.85, absorption: 0.85, color: 0x886644 }
  };

  // ── State ─────────────────────────────────────────────────────────────────
  var _currentTier = TIER.NONE;
  var _armorHP = 0;
  var _maxArmorHP = 0;
  var _plateCracked = false;
  var _plateCrackNotified = false;

  // Repair state
  var _repairing = false;
  var _repairTimer = 0;
  var _repairTotal = 5.0;
  var _repairAmount = 20;
  var _stationary = false;
  var _stationaryTimer = 0;
  var _stationaryCoverThreshold = 2.0;
  var _lastPlayerPos = null;

  // Screen shake
  var _shakeTimer = 0;
  var _shakeDuration = 0.35;
  var _shakeIntensity = 6;

  // Pickup list
  var _pickups = [];

  // DOM / scene refs
  var _scene = null;
  var _camera = null;
  var _audioCtx = null;

  // Cached DOM elements
  var _hudEl = null;
  var _crackOverlayEl = null;
  var _repairBarEl = null;
  var _repairBarFillEl = null;
  var _plateWarningEl = null;
  var _vestHitEl = null;

  // ── Internal helpers ──────────────────────────────────────────────────────

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {}
    }
    return _audioCtx;
  }

  function _playMetallicClang() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }

  function _playCeramicCrack() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    // Burst of noise via multiple oscillators + detune
    var i, osc, gain;
    var freqs = [1200, 900, 1500, 600];
    for (i = 0; i < freqs.length; i++) {
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freqs[i], ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    }
  }

  function _ensureDOMElements() {
    // HUD bar
    if (!_hudEl) {
      _hudEl = document.getElementById('body-armor-hud');
      if (!_hudEl) {
        _hudEl = document.createElement('div');
        _hudEl.id = 'body-armor-hud';
        _hudEl.style.cssText = [
          'position:fixed',
          'bottom:14px',
          'left:50%',
          'transform:translateX(-50%)',
          'font-family:monospace',
          'font-size:13px',
          'color:#eee',
          'background:rgba(0,0,0,0.55)',
          'padding:3px 10px',
          'border-radius:4px',
          'z-index:500',
          'pointer-events:none',
          'display:none'
        ].join(';');
        document.body.appendChild(_hudEl);
      }
    }

    // Crack overlay (screen edge glow)
    if (!_crackOverlayEl) {
      _crackOverlayEl = document.getElementById('body-armor-crack-overlay');
      if (!_crackOverlayEl) {
        _crackOverlayEl = document.createElement('div');
        _crackOverlayEl.id = 'body-armor-crack-overlay';
        _crackOverlayEl.style.cssText = [
          'position:fixed',
          'inset:0',
          'pointer-events:none',
          'z-index:490',
          'border:0px solid transparent',
          'box-sizing:border-box',
          'transition:border-width 0.3s,border-color 0.3s'
        ].join(';');
        document.body.appendChild(_crackOverlayEl);
        // Inject keyframe animation for pulsing
        if (!document.getElementById('body-armor-style')) {
          var style = document.createElement('style');
          style.id = 'body-armor-style';
          style.textContent = [
            '@keyframes armor-pulse{0%,100%{opacity:1}50%{opacity:0.3}}',
            '#body-armor-crack-overlay.pulsing{animation:armor-pulse 0.6s ease-in-out infinite}'
          ].join('');
          document.head.appendChild(style);
        }
      }
    }

    // Repair bar
    if (!_repairBarEl) {
      _repairBarEl = document.getElementById('body-armor-repair-bar');
      if (!_repairBarEl) {
        _repairBarEl = document.createElement('div');
        _repairBarEl.id = 'body-armor-repair-bar';
        _repairBarEl.style.cssText = [
          'position:fixed',
          'bottom:36px',
          'left:50%',
          'transform:translateX(-50%)',
          'width:200px',
          'font-family:monospace',
          'font-size:11px',
          'color:#aaffaa',
          'text-align:center',
          'z-index:501',
          'pointer-events:none',
          'display:none'
        ].join(';');
        _repairBarEl.innerHTML = '<div style="margin-bottom:2px">REPAIRING VEST</div><div style="background:#111;border:1px solid #44aa44;border-radius:3px;height:8px;width:100%"><div id="body-armor-repair-fill" style="height:100%;width:0%;background:#44ff44;border-radius:3px;transition:width 0.1s"></div></div>';
        document.body.appendChild(_repairBarEl);
        _repairBarFillEl = document.getElementById('body-armor-repair-fill');
      }
    }

    // Plate cracked warning
    if (!_plateWarningEl) {
      _plateWarningEl = document.getElementById('body-armor-plate-warn');
      if (!_plateWarningEl) {
        _plateWarningEl = document.createElement('div');
        _plateWarningEl.id = 'body-armor-plate-warn';
        _plateWarningEl.style.cssText = [
          'position:fixed',
          'top:30%',
          'left:50%',
          'transform:translateX(-50%)',
          'font-family:monospace',
          'font-size:18px',
          'color:#ffaa00',
          'font-weight:bold',
          'text-shadow:0 0 8px #ff8800',
          'z-index:502',
          'pointer-events:none',
          'opacity:0',
          'transition:opacity 0.3s'
        ].join(';');
        _plateWarningEl.textContent = '⚠ PLATE CRACKED';
        document.body.appendChild(_plateWarningEl);
      }
    }

    // Vest hit indicator
    if (!_vestHitEl) {
      _vestHitEl = document.getElementById('body-armor-vest-hit');
      if (!_vestHitEl) {
        _vestHitEl = document.createElement('div');
        _vestHitEl.id = 'body-armor-vest-hit';
        _vestHitEl.style.cssText = [
          'position:fixed',
          'font-family:monospace',
          'font-size:14px',
          'font-weight:bold',
          'color:#ffff44',
          'text-shadow:0 0 6px #ffff00',
          'z-index:503',
          'pointer-events:none',
          'opacity:0',
          'transition:opacity 0.08s'
        ].join(';');
        _vestHitEl.textContent = 'VEST';
        document.body.appendChild(_vestHitEl);
      }
    }
  }

  function _getEffectiveAbsorption() {
    if (_currentTier === TIER.NONE || _armorHP <= 0) return 0;
    var base = _currentTier.absorption;
    // Cracked plate drops to 50%
    if (_plateCracked) return Math.min(base, 0.50);
    return base;
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_currentTier === TIER.NONE || _armorHP <= 0) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var ratio = _armorHP / _maxArmorHP;
    var barLen = 10;
    var filled = Math.round(ratio * barLen);
    var empty = barLen - filled;
    var bar = '';
    var i;
    for (i = 0; i < filled; i++) bar += '█';
    for (i = 0; i < empty; i++) bar += '░';

    var color;
    if (ratio > 0.6) color = '#44ff44';
    else if (ratio > 0.25) color = '#ffaa00';
    else color = '#ff3333';

    _hudEl.style.color = color;
    _hudEl.textContent = 'VEST: [' + bar + '] ' + Math.ceil(_armorHP) + 'HP' + (_plateCracked ? ' ⚠CRACKED' : '');
  }

  function _updateCrackOverlay() {
    if (!_crackOverlayEl) return;
    if (_currentTier === TIER.NONE || _armorHP <= 0 || _maxArmorHP === 0) {
      _crackOverlayEl.style.border = '0px solid transparent';
      _crackOverlayEl.classList.remove('pulsing');
      return;
    }
    var ratio = _armorHP / _maxArmorHP;
    if (ratio >= 0.5) {
      _crackOverlayEl.style.border = '0px solid transparent';
      _crackOverlayEl.classList.remove('pulsing');
    } else if (ratio >= 0.25) {
      _crackOverlayEl.style.border = '4px solid rgba(255,40,40,0.65)';
      _crackOverlayEl.classList.remove('pulsing');
    } else {
      _crackOverlayEl.style.border = '10px solid rgba(255,20,20,0.80)';
      _crackOverlayEl.classList.add('pulsing');
    }
  }

  function _showVestHit(screenX, screenY) {
    if (!_vestHitEl) return;
    _vestHitEl.style.left = (screenX - 20) + 'px';
    _vestHitEl.style.top  = (screenY - 20) + 'px';
    _vestHitEl.style.opacity = '1';
    clearTimeout(_vestHitEl._fadeTimer);
    _vestHitEl._fadeTimer = setTimeout(function() {
      _vestHitEl.style.opacity = '0';
    }, 350);
  }

  function _showPlateWarning() {
    if (!_plateWarningEl) return;
    _plateWarningEl.style.opacity = '1';
    clearTimeout(_plateWarningEl._hideTimer);
    _plateWarningEl._hideTimer = setTimeout(function() {
      _plateWarningEl.style.opacity = '0';
    }, 2500);
  }

  function _triggerScreenShake() {
    _shakeTimer = _shakeDuration;
  }

  function _applyScreenShake(dt, camera) {
    if (_shakeTimer <= 0 || !camera) return;
    _shakeTimer -= dt;
    if (_shakeTimer <= 0) {
      _shakeTimer = 0;
      return;
    }
    var s = (_shakeTimer / _shakeDuration) * _shakeIntensity * 0.002;
    camera.position.x += (Math.random() - 0.5) * s;
    camera.position.y += (Math.random() - 0.5) * s;
  }

  function _checkPlateCrack(prevHP) {
    if (_plateCrackNotified) return;
    if (_maxArmorHP === 0) return;
    var prevRatio = prevHP / _maxArmorHP;
    var currRatio = _armorHP / _maxArmorHP;
    if (prevRatio > 0.5 && currRatio <= 0.5) {
      _plateCracked = true;
      _plateCrackNotified = true;
      _playCeramicCrack();
      _triggerScreenShake();
      _showPlateWarning();
    }
  }

  // ── Pickup geometry creation ──────────────────────────────────────────────

  function _createPickupMesh(tierName) {
    if (typeof THREE === 'undefined') return null;
    var tier = TIER[tierName];
    if (!tier || tier === TIER.NONE) return null;

    var size;
    if (tierName === 'LIGHT')  size = [0.4, 0.55, 0.12];
    else if (tierName === 'MEDIUM') size = [0.5, 0.65, 0.14];
    else size = [0.6, 0.75, 0.18]; // HEAVY

    var geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    var mat = new THREE.MeshLambertMaterial({ color: tier.color, transparent: true, opacity: 0.92 });
    var mesh = new THREE.Mesh(geo, mat);

    // Extra visual detail for HEAVY: add a second slightly smaller box
    if (tierName === 'HEAVY') {
      var geo2 = new THREE.BoxGeometry(size[0] * 0.8, size[1] * 0.4, size[2] * 1.1);
      var mat2 = new THREE.MeshLambertMaterial({ color: 0xaa7744 });
      var plate = new THREE.Mesh(geo2, mat2);
      plate.position.y = 0.05;
      mesh.add(plate);
    }
    return mesh;
  }

  // ── Pickup key handler ────────────────────────────────────────────────────

  var _eKeyDown = false;

  function _onKeyDown(e) {
    if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
      _eKeyDown = true;
      _tryEquipNearby();
    }
    if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyR' || e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      _tryStartRepair();
    }
  }

  function _tryEquipNearby() {
    if (!_camera) return;
    var playerPos = _camera.position;
    var EQUIP_RANGE = 2.5;
    var closest = null;
    var closestDist = Infinity;
    var i, pu, dx, dy, dz, dist;
    for (i = 0; i < _pickups.length; i++) {
      pu = _pickups[i];
      if (!pu.mesh || pu.collected) continue;
      dx = pu.mesh.position.x - playerPos.x;
      dy = pu.mesh.position.y - playerPos.y;
      dz = pu.mesh.position.z - playerPos.z;
      dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist < EQUIP_RANGE && dist < closestDist) {
        closestDist = dist;
        closest = pu;
      }
    }
    if (closest) {
      equip(closest.tierName);
      closest.collected = true;
      if (_scene && closest.mesh) {
        _scene.remove(closest.mesh);
      }
    }
  }

  function _tryStartRepair() {
    if (_currentTier === TIER.NONE || _armorHP <= 0) return;
    if (_armorHP >= _maxArmorHP) return;
    if (!_stationary) return;
    if (_repairing) return;
    _repairing = true;
    _repairTimer = 0;
    if (_repairBarEl) _repairBarEl.style.display = 'block';
  }

  // ── Stationarity tracking ─────────────────────────────────────────────────

  function _updateStationarity(dt) {
    if (!_camera) return;
    var pos = _camera.position;
    if (!_lastPlayerPos) {
      _lastPlayerPos = { x: pos.x, y: pos.y, z: pos.z };
      return;
    }
    var dx = pos.x - _lastPlayerPos.x;
    var dy = pos.y - _lastPlayerPos.y;
    var dz = pos.z - _lastPlayerPos.z;
    var moved = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (moved < 0.01) {
      _stationaryTimer += dt;
      if (_stationaryTimer >= _stationaryCoverThreshold) {
        _stationary = true;
      }
    } else {
      _stationaryTimer = 0;
      _stationary = false;
      if (_repairing) {
        _repairing = false;
        if (_repairBarEl) _repairBarEl.style.display = 'none';
      }
    }
    _lastPlayerPos = { x: pos.x, y: pos.y, z: pos.z };
  }

  function _updateRepair(dt) {
    if (!_repairing) return;
    _repairTimer += dt;
    var progress = Math.min(_repairTimer / _repairTotal, 1.0);
    if (_repairBarFillEl) _repairBarFillEl.style.width = (progress * 100) + '%';
    var targetHP = Math.min(_maxArmorHP, _armorHP + _repairAmount);
    // Smoothly heal
    _armorHP = Math.min(targetHP, _armorHP + (_repairAmount / _repairTotal) * dt);
    window._armorHP = _armorHP;
    if (_repairTimer >= _repairTotal) {
      _repairing = false;
      if (_repairBarEl) _repairBarEl.style.display = 'none';
    }
  }

  function _updatePickupBob(dt) {
    var t = Date.now() * 0.001;
    var i, pu;
    for (i = 0; i < _pickups.length; i++) {
      pu = _pickups[i];
      if (!pu.mesh || pu.collected) continue;
      pu.mesh.position.y = pu.baseY + Math.sin(t * 2 + i) * 0.12;
      pu.mesh.rotation.y += dt * 1.2;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene || null;
    _camera = camera || null;
    _ensureDOMElements();
    window._armorHP = 0;
    window._armorSpeedMult = 1.0;
    window._armorAccuracyMult = 1.0;
    document.addEventListener('keydown', _onKeyDown);
    _updateHUD();
    _updateCrackOverlay();
  }

  function update(dt) {
    _updateStationarity(dt);
    _updateRepair(dt);
    _updatePickupBob(dt);
    _applyScreenShake(dt, _camera);
    _updateHUD();
    _updateCrackOverlay();
  }

  function equip(tierName) {
    var tier = TIER[tierName];
    if (!tier) return;
    _currentTier = tier;
    _maxArmorHP = tier.hp;
    _armorHP = tier.hp;
    _plateCracked = false;
    _plateCrackNotified = false;
    window._armorHP = _armorHP;
    window._armorSpeedMult = tier.speedMult;
    window._armorAccuracyMult = tier.accuracyMult;
    _updateHUD();
    _updateCrackOverlay();
  }

  function takeDamage(rawDamage, screenX, screenY) {
    if (_currentTier === TIER.NONE || _armorHP <= 0) {
      return rawDamage; // full damage to player
    }
    var absorption = _getEffectiveAbsorption();
    var absorbed = rawDamage * absorption;
    var passthrough = rawDamage - absorbed;

    var prevHP = _armorHP;
    _armorHP = Math.max(0, _armorHP - absorbed);
    window._armorHP = _armorHP;

    // Check plate crack event
    _checkPlateCrack(prevHP);

    // Show hit indicator
    var sx = (screenX !== undefined) ? screenX : window.innerWidth * 0.5;
    var sy = (screenY !== undefined) ? screenY : window.innerHeight * 0.4;
    _showVestHit(sx, sy);
    _playMetallicClang();

    _updateHUD();
    _updateCrackOverlay();

    return passthrough;
  }

  function repair(amount) {
    if (_currentTier === TIER.NONE) return;
    _armorHP = Math.min(_maxArmorHP, _armorHP + (amount || 20));
    window._armorHP = _armorHP;
    _updateHUD();
    _updateCrackOverlay();
  }

  function reset() {
    _currentTier = TIER.NONE;
    _armorHP = 0;
    _maxArmorHP = 0;
    _plateCracked = false;
    _plateCrackNotified = false;
    _repairing = false;
    _repairTimer = 0;
    _stationary = false;
    _stationaryTimer = 0;
    _shakeTimer = 0;
    _lastPlayerPos = null;
    window._armorHP = 0;
    window._armorSpeedMult = 1.0;
    window._armorAccuracyMult = 1.0;
    // Remove all pickups
    var i;
    for (i = 0; i < _pickups.length; i++) {
      if (_scene && _pickups[i].mesh) _scene.remove(_pickups[i].mesh);
    }
    _pickups = [];
    if (_hudEl) _hudEl.style.display = 'none';
    if (_crackOverlayEl) {
      _crackOverlayEl.style.border = '0px solid transparent';
      _crackOverlayEl.classList.remove('pulsing');
    }
    if (_repairBarEl) _repairBarEl.style.display = 'none';
    if (_plateWarningEl) _plateWarningEl.style.opacity = '0';
  }

  // ── Pickup spawning helper (bonus public utility) ─────────────────────────

  function spawnPickup(tierName, x, y, z) {
    var mesh = _createPickupMesh(tierName);
    if (!mesh || !_scene) return null;
    mesh.position.set(x || 0, y || 0.5, z || 0);
    _scene.add(mesh);
    var pu = { tierName: tierName, mesh: mesh, baseY: mesh.position.y, collected: false };
    _pickups.push(pu);
    return pu;
  }

  return {
    init: init,
    update: update,
    equip: equip,
    takeDamage: takeDamage,
    repair: repair,
    reset: reset,
    spawnPickup: spawnPickup,
    TIER: TIER
  };

})();
