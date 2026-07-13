// nbc-protection.js — CBRN protective suit and decontamination system
// IIFE module — var only, no import/export, no build step.
window.NBCProtection = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────────
  var SUIT_INTEGRITY_MAX     = 100;
  var COLLECT_RADIUS         = 1.5;       // metres to press F and equip
  var EQUIP_FLASH_DURATION   = 0.5;       // seconds for yellow screen flash
  var GAS_DRAIN_RATE         = 2;         // %/s integrity drain in gas cloud
  var EXPLOSION_DRAIN        = 15;        // % per explosion hit
  var FIRE_DRAIN_RATE        = 5;         // %/s in fire
  var RADIATION_REDUCTION    = 0.85;      // 85 % reduction
  var SMOKE_REDUCTION        = 0.70;      // 70 % reduction
  var COMPROMISED_THRESHOLD  = 30;        // % — "SUIT COMPROMISED" warning
  var PENETRATION_THRESHOLD  = 15;        // % — gas starts partially penetrating
  var SPEED_PENALTY          = 0.85;      // move speed multiplier while suited
  var FIRERATE_PENALTY       = 0.90;      // fire-rate multiplier while suited
  var UNEQUIP_HOLD_TIME      = 2.0;       // seconds to hold F to unequip
  var REPAIR_RADIUS          = 2.0;       // metres to a water barrel for Ctrl+F repair
  var REPAIR_DURATION        = 3.0;       // seconds decontamination takes
  var REPAIR_AMOUNT          = 50;        // % integrity restored
  var EMERGENCY_DURATION     = 15;        // seconds full immunity from Alt+F
  var EMERGENCY_COOLDOWN     = 60;        // seconds cooldown
  var BREATH_INTERVAL        = 3.0;       // seconds between breathing puffs
  var GEIGER_BASE_INTERVAL   = 1.5;       // seconds between base Geiger ticks
  var HAZMAT_HERO_TIME       = 30;        // seconds in contamination zone for achievement
  var HAZMAT_HERO_SCORE      = 250;
  var HAZMAT_HERO_CHEM_BONUS = 0.10;     // permanent 10 % chemical resistance

  // ── State ────────────────────────────────────────────────────────────────────
  var _scene           = null;
  var _camera          = null;

  var _pickups         = [];    // { mesh, x, z }
  var _waterBarrels    = [];    // { mesh, x, z }

  var _suitAvailable   = false;
  var _suitEquipped    = false;
  var _suitIntegrity   = SUIT_INTEGRITY_MAX;

  // Equip / unequip
  var _equipFlashTimer = 0;
  var _unequipHoldTimer = 0;
  var _fKeyDown        = false;
  var _ctrlFDown       = false;
  var _altFDown        = false;

  // Repair
  var _repairing       = false;
  var _repairTimer     = 0;
  var _repairStartIntegrity = 0;

  // Emergency air
  var _emergencyActive    = false;
  var _emergencyTimer     = 0;
  var _emergencyCooldown  = 0;

  // Breathing audio
  var _audioCtx           = null;
  var _breathTimer        = 0;

  // Geiger
  var _geigerTimer        = 0;

  // Hazmat hero achievement
  var _hazmatHeroTimer    = 0;
  var _hazmatHeroEarned   = false;
  var _chemResistBonus    = 0;

  // HUD elements
  var _vignetteEl         = null;
  var _statusTextEl       = null;
  var _integrityBarWrapEl = null;
  var _integrityFillEl    = null;
  var _warningEl          = null;
  var _geigerEl           = null;
  var _emergencyEl        = null;
  var _repairProgressEl   = null;

  // Flashing state
  var _warningFlashTimer  = 0;
  var _warningVisible     = false;

  // ── Audio helpers ─────────────────────────────────────────────────────────────

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { /* audio unavailable */ }
    }
    return _audioCtx;
  }

  function _playBreath() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      src.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  function _playHiss() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4)) * 0.15;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
      src.connect(gainNode);
      gainNode.connect(ctx.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  function _playGeigerTick() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gainNode = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 2200;
      gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) { /* ignore */ }
  }

  function _playAlert() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gainNode = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) { /* ignore */ }
  }

  // ── Biohazard canvas texture ──────────────────────────────────────────────────

  function _createBiohazardTexture() {
    var canvas = document.createElement('canvas');
    canvas.width  = 64;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');

    // Yellow background
    ctx.fillStyle = '#ddaa00';
    ctx.fillRect(0, 0, 64, 64);

    // Black biohazard symbol (simplified trefoil)
    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3;

    var cx = 32, cy = 32, r1 = 6, r2 = 14, r3 = 20;

    // Centre circle
    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, Math.PI * 2);
    ctx.fill();

    // Three arcs at 120° intervals
    for (var a = 0; a < 3; a++) {
      var angle = (a * 120 - 90) * Math.PI / 180;
      var ax = cx + Math.cos(angle) * (r1 + r2) * 0.7;
      var ay = cy + Math.sin(angle) * (r1 + r2) * 0.7;

      ctx.beginPath();
      ctx.arc(ax, ay, r2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r3, 0, Math.PI * 2);
    ctx.stroke();

    var tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // ── Pickup mesh (yellow hazmat suit) ─────────────────────────────────────────

  function _createPickupMesh(x, y, z) {
    var group = new THREE.Group();

    var tex = _createBiohazardTexture();

    // Main suit body (1 × 1.5 × 0.5)
    var bodyGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xddaa00, map: tex });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Arms
    var armGeo = new THREE.BoxGeometry(0.25, 1.0, 0.25);
    var armMat = new THREE.MeshLambertMaterial({ color: 0xddaa00 });
    var armL   = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.625, 0, 0);
    group.add(armL);
    var armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.625, 0, 0);
    group.add(armR);

    // Helmet dome
    var helmGeo = new THREE.SphereGeometry(0.28, 12, 8);
    var helmMat = new THREE.MeshLambertMaterial({ color: 0xffee44, transparent: true, opacity: 0.8 });
    var helm    = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 0.88;
    group.add(helm);

    // Glow
    var light = new THREE.PointLight(0xffee00, 0.8, 2.5);
    light.position.y = 0.5;
    group.add(light);

    group.position.set(x, y + 0.75, z);
    group._bobOffset = Math.random() * Math.PI * 2;

    if (_scene) _scene.add(group);
    return group;
  }

  // ── Water barrel mesh ─────────────────────────────────────────────────────────

  function _createWaterBarrelMesh(x, y, z) {
    var group = new THREE.Group();

    var barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.9, 12);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2255cc });
    var barrel    = new THREE.Mesh(barrelGeo, barrelMat);
    group.add(barrel);

    // Lid
    var lidGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 12);
    var lidMat = new THREE.MeshLambertMaterial({ color: 0x113388 });
    var lid    = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.48;
    group.add(lid);

    // Blue glow
    var light = new THREE.PointLight(0x2255cc, 0.5, 2);
    light.position.y = 0.5;
    group.add(light);

    group.position.set(x, y + 0.45, z);

    if (_scene) _scene.add(group);
    return group;
  }

  // ── HUD creation ─────────────────────────────────────────────────────────────

  function _createHUD() {
    // Yellow vignette border (CSS box-shadow inset)
    _vignetteEl = document.createElement('div');
    _vignetteEl.id = 'nbcVignette';
    _vignetteEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:3500;',
      'box-shadow:inset 0 0 60px 20px rgba(220,170,0,0.55);',
      'display:none;',
    ].join('');
    document.body.appendChild(_vignetteEl);

    // "NBC SUIT ACTIVE" text in top-right
    _statusTextEl = document.createElement('div');
    _statusTextEl.id = 'nbcStatusText';
    _statusTextEl.textContent = 'NBC SUIT ACTIVE';
    _statusTextEl.style.cssText = [
      'position:fixed;top:12px;right:15px;',
      'color:#ffee00;font:bold 13px monospace;',
      'text-shadow:0 0 6px #ffaa00;',
      'pointer-events:none;z-index:4200;display:none;',
    ].join('');
    document.body.appendChild(_statusTextEl);

    // Integrity bar
    _integrityBarWrapEl = document.createElement('div');
    _integrityBarWrapEl.id = 'nbcIntegrityWrap';
    _integrityBarWrapEl.style.cssText = [
      'position:fixed;top:34px;right:15px;',
      'pointer-events:none;z-index:4200;display:none;',
    ].join('');

    var barLabel = document.createElement('div');
    barLabel.textContent = 'SUIT';
    barLabel.style.cssText = 'color:#ddaa00;font:10px monospace;margin-bottom:2px;';
    _integrityBarWrapEl.appendChild(barLabel);

    var barOuter = document.createElement('div');
    barOuter.style.cssText = [
      'width:90px;height:6px;',
      'background:rgba(0,0,0,0.5);',
      'border:1px solid rgba(220,170,0,0.4);',
      'border-radius:3px;overflow:hidden;',
    ].join('');

    _integrityFillEl = document.createElement('div');
    _integrityFillEl.style.cssText = [
      'height:100%;width:100%;',
      'background:linear-gradient(90deg,#ddaa00,#ffee44);',
      'transition:width 0.3s,background 0.3s;',
    ].join('');

    barOuter.appendChild(_integrityFillEl);
    _integrityBarWrapEl.appendChild(barOuter);

    // Integrity percentage text
    var intPct = document.createElement('div');
    intPct.id = 'nbcIntegrityPct';
    intPct.style.cssText = 'color:#ddaa00;font:9px monospace;margin-top:1px;text-align:right;';
    intPct.textContent = '100%';
    _integrityBarWrapEl.appendChild(intPct);

    document.body.appendChild(_integrityBarWrapEl);

    // "SUIT COMPROMISED" warning
    _warningEl = document.createElement('div');
    _warningEl.id = 'nbcWarning';
    _warningEl.textContent = 'SUIT COMPROMISED';
    _warningEl.style.cssText = [
      'position:fixed;top:50%;left:50%;',
      'transform:translate(-50%,-50%);',
      'color:#ff8800;font:bold 22px monospace;',
      'text-shadow:0 0 10px #ff5500;',
      'pointer-events:none;z-index:5000;display:none;',
    ].join('');
    document.body.appendChild(_warningEl);

    // Geiger counter HUD
    _geigerEl = document.createElement('div');
    _geigerEl.id = 'nbcGeiger';
    _geigerEl.style.cssText = [
      'position:fixed;bottom:80px;right:15px;',
      'background:rgba(0,0,0,0.65);',
      'padding:4px 8px;border-radius:4px;',
      'color:#44ff88;font:11px monospace;',
      'pointer-events:none;z-index:4200;display:none;',
    ].join('');
    _geigerEl.innerHTML = 'RAD: <span id="nbcGeigerLevel">LOW</span>';
    document.body.appendChild(_geigerEl);

    // Emergency air supply HUD
    _emergencyEl = document.createElement('div');
    _emergencyEl.id = 'nbcEmergency';
    _emergencyEl.style.cssText = [
      'position:fixed;top:58px;right:15px;',
      'background:rgba(0,0,50,0.8);',
      'padding:3px 7px;border-radius:4px;',
      'color:#44aaff;font:bold 11px monospace;',
      'pointer-events:none;z-index:4200;display:none;',
    ].join('');
    _emergencyEl.textContent = 'AIR: 15s';
    document.body.appendChild(_emergencyEl);

    // Repair progress bar
    _repairProgressEl = document.createElement('div');
    _repairProgressEl.id = 'nbcRepairProgress';
    _repairProgressEl.style.cssText = [
      'position:fixed;bottom:50px;left:50%;',
      'transform:translateX(-50%);',
      'background:rgba(0,0,0,0.7);',
      'padding:4px 10px;border-radius:4px;',
      'color:#44aaff;font:11px monospace;',
      'pointer-events:none;z-index:5000;display:none;',
    ].join('');
    _repairProgressEl.textContent = 'DECONTAMINATING...';
    document.body.appendChild(_repairProgressEl);
  }

  // ── HUD update ────────────────────────────────────────────────────────────────

  function _updateHUD(dt) {
    if (!_suitEquipped) {
      if (_vignetteEl)         _vignetteEl.style.display = 'none';
      if (_statusTextEl)       _statusTextEl.style.display = 'none';
      if (_integrityBarWrapEl) _integrityBarWrapEl.style.display = 'none';
      if (_warningEl)          _warningEl.style.display = 'none';
      if (_geigerEl)           _geigerEl.style.display = 'none';
      if (_emergencyEl)        _emergencyEl.style.display = 'none';
      if (_repairProgressEl)   _repairProgressEl.style.display = 'none';
      return;
    }

    // Vignette + status
    if (_vignetteEl)   _vignetteEl.style.display = 'block';
    if (_statusTextEl) _statusTextEl.style.display = 'block';

    // Integrity bar
    if (_integrityBarWrapEl) _integrityBarWrapEl.style.display = 'block';
    if (_integrityFillEl) {
      var pct = Math.max(0, Math.min(100, _suitIntegrity));
      _integrityFillEl.style.width = pct + '%';
      if (pct > COMPROMISED_THRESHOLD) {
        _integrityFillEl.style.background = 'linear-gradient(90deg,#ddaa00,#ffee44)';
      } else if (pct > PENETRATION_THRESHOLD) {
        _integrityFillEl.style.background = 'linear-gradient(90deg,#ff8800,#ffaa00)';
      } else {
        _integrityFillEl.style.background = 'linear-gradient(90deg,#ff2200,#ff5500)';
      }
    }
    var pctEl = document.getElementById('nbcIntegrityPct');
    if (pctEl) pctEl.textContent = Math.floor(_suitIntegrity) + '%';

    // Compromised warning (flashing)
    if (_suitIntegrity > 0 && _suitIntegrity <= COMPROMISED_THRESHOLD) {
      _warningFlashTimer += dt;
      if (_warningFlashTimer >= 0.5) {
        _warningFlashTimer = 0;
        _warningVisible = !_warningVisible;
      }
      if (_warningEl) {
        _warningEl.style.display = _warningVisible ? 'block' : 'none';
        _warningEl.style.color = _suitIntegrity <= PENETRATION_THRESHOLD ? '#ff2200' : '#ff8800';
        _warningEl.textContent = _suitIntegrity <= PENETRATION_THRESHOLD ? 'SUIT BREACHED' : 'SUIT COMPROMISED';
      }
    } else {
      _warningFlashTimer = 0;
      if (_warningEl) _warningEl.style.display = 'none';
    }

    // Geiger counter
    if (_geigerEl) {
      _geigerEl.style.display = 'block';
      var nearChem = (typeof window.ChemicalWarfare !== 'undefined' &&
                      typeof window._playerInGasCloud !== 'undefined' &&
                      window._playerInGasCloud);
      var radEl = document.getElementById('nbcGeigerLevel');
      if (radEl) {
        if (nearChem) {
          radEl.textContent = 'HIGH';
          radEl.style.color = '#ff4444';
        } else {
          radEl.textContent = 'LOW';
          radEl.style.color = '#44ff88';
        }
      }
    }

    // Emergency air countdown
    if (_emergencyActive) {
      if (_emergencyEl) {
        _emergencyEl.style.display = 'block';
        _emergencyEl.textContent = 'AIR: ' + Math.ceil(_emergencyTimer) + 's';
      }
    } else if (_emergencyCooldown > 0) {
      if (_emergencyEl) {
        _emergencyEl.style.display = 'block';
        _emergencyEl.textContent = 'AIR CD: ' + Math.ceil(_emergencyCooldown) + 's';
        _emergencyEl.style.color = '#888888';
      }
    } else {
      if (_emergencyEl) _emergencyEl.style.display = 'none';
    }

    // Repair progress
    if (_repairing) {
      if (_repairProgressEl) {
        _repairProgressEl.style.display = 'block';
        var repPct = Math.floor((_repairTimer / REPAIR_DURATION) * 100);
        _repairProgressEl.textContent = 'DECONTAMINATING... ' + repPct + '%';
      }
    } else {
      if (_repairProgressEl) _repairProgressEl.style.display = 'none';
    }
  }

  // ── Equip flash ───────────────────────────────────────────────────────────────

  function _doEquipFlash() {
    _equipFlashTimer = EQUIP_FLASH_DURATION;
    var flashEl = document.getElementById('nbcEquipFlash');
    if (!flashEl) {
      flashEl = document.createElement('div');
      flashEl.id = 'nbcEquipFlash';
      flashEl.style.cssText = [
        'position:fixed;top:0;left:0;width:100%;height:100%;',
        'background:rgba(220,170,0,0.45);',
        'pointer-events:none;z-index:9000;',
      ].join('');
      document.body.appendChild(flashEl);
    }
    flashEl.style.display = 'block';
    flashEl.style.opacity = '1';
    var start = performance.now();
    function fade() {
      var elapsed = (performance.now() - start) / 1000;
      var t = 1 - elapsed / EQUIP_FLASH_DURATION;
      if (t <= 0) {
        flashEl.style.display = 'none';
        return;
      }
      flashEl.style.opacity = String(t);
      requestAnimationFrame(fade);
    }
    requestAnimationFrame(fade);
  }

  // ── Contamination zone detection ──────────────────────────────────────────────

  function _inGasCloud() {
    return (typeof window._playerInGasCloud !== 'undefined' && window._playerInGasCloud);
  }

  function _inRadiation() {
    return (typeof window._playerInRadiation !== 'undefined' && window._playerInRadiation);
  }

  function _inFire() {
    return (typeof window._playerInFire !== 'undefined' && window._playerInFire);
  }

  function _inAnyContamination() {
    return _inGasCloud() || _inRadiation() || _inFire();
  }

  // ── Notify helper ─────────────────────────────────────────────────────────────

  function _notify(msg, color) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(msg, color || '#ffee00');
    }
  }

  // ── Keyboard binding ──────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    var key = e.key;

    // F key — equip / unequip hold
    if (key === 'f' || key === 'F') {
      if (e.altKey) {
        // Alt+F → emergency air
        _triggerEmergencyAir();
        return;
      }
      if (e.ctrlKey) {
        // Ctrl+F → start repair (handled below)
        _ctrlFDown = true;
        return;
      }
      if (!_fKeyDown) {
        _fKeyDown = true;
        _unequipHoldTimer = 0;
        if (!_suitEquipped && _suitAvailable) {
          equip();
        }
      }
    }
  }

  function _onKeyUp(e) {
    var key = e.key;
    if (key === 'f' || key === 'F') {
      _fKeyDown = false;
      _unequipHoldTimer = 0;
    }
    if (key === 'Control') {
      _ctrlFDown = false;
    }
  }

  function _bindKeys() {
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  // ── Emergency air ─────────────────────────────────────────────────────────────

  function _triggerEmergencyAir() {
    if (!_suitEquipped) return;
    if (_emergencyActive) return;
    if (_emergencyCooldown > 0) {
      _notify('Emergency air on cooldown: ' + Math.ceil(_emergencyCooldown) + 's', '#888888');
      return;
    }
    _emergencyActive = true;
    _emergencyTimer  = EMERGENCY_DURATION;
    _notify('EMERGENCY AIR SUPPLY ACTIVATED — 15s full immunity!', '#44aaff');
  }

  // ── Score / achievement ───────────────────────────────────────────────────────

  function _awardHazmatHero() {
    _hazmatHeroEarned = true;
    _chemResistBonus  = HAZMAT_HERO_CHEM_BONUS;
    window._nbcChemResistBonus = _chemResistBonus;

    if (typeof window.ScoreManager !== 'undefined' && window.ScoreManager.add) {
      window.ScoreManager.add(HAZMAT_HERO_SCORE);
    } else if (typeof window._score !== 'undefined') {
      window._score += HAZMAT_HERO_SCORE;
    }

    if (typeof window.AchievementSystem !== 'undefined' && window.AchievementSystem.unlock) {
      window.AchievementSystem.unlock('HAZMAT_HERO');
    }

    _notify('HAZMAT HERO! +' + HAZMAT_HERO_SCORE + ' score, +10% chemical resistance unlocked!', '#ffee00');
  }

  // ── Public: equip ─────────────────────────────────────────────────────────────

  function equip() {
    if (!_suitAvailable) return;
    if (_suitEquipped) return;
    _suitEquipped = true;
    _unequipHoldTimer = 0;

    // Chemical warfare immunity flag
    if (typeof window.ChemicalWarfare !== 'undefined') {
      window._gasImmune = true;
    }

    // Speed / fire-rate hooks (other modules poll these)
    window._nbcSpeedMult    = SPEED_PENALTY;
    window._nbcFireRateMult = FIRERATE_PENALTY;

    _doEquipFlash();
    _playBreath();
    _notify('NBC SUIT EQUIPPED', '#ffee00');
  }

  // ── Public: unequip ───────────────────────────────────────────────────────────

  function unequip() {
    if (!_suitEquipped) return;
    _suitEquipped = false;
    _repairing    = false;

    window._gasImmune       = false;
    window._nbcSpeedMult    = 1;
    window._nbcFireRateMult = 1;

    _notify('NBC suit removed', '#888888');
    _updateHUD(0);
  }

  // ── Public: spawnPickup ───────────────────────────────────────────────────────

  function spawnPickup(x, y, z) {
    if (typeof x === 'undefined') x = 0;
    if (typeof y === 'undefined') y = 0;
    if (typeof z === 'undefined') z = 0;
    var mesh = _createPickupMesh(x, y, z);
    _pickups.push({ mesh: mesh, x: x, y: y, z: z });
  }

  // ── Public: spawnWaterBarrel ──────────────────────────────────────────────────

  function spawnWaterBarrel(x, y, z) {
    if (typeof x === 'undefined') x = 0;
    if (typeof y === 'undefined') y = 0;
    if (typeof z === 'undefined') z = 0;
    var mesh = _createWaterBarrelMesh(x, y, z);
    _waterBarrels.push({ mesh: mesh, x: x, y: y, z: z });
  }

  // ── Repair near water barrel ──────────────────────────────────────────────────

  function _tryRepair(playerPos) {
    if (!_suitEquipped) return false;
    if (_repairing) return true;
    for (var i = 0; i < _waterBarrels.length; i++) {
      var b = _waterBarrels[i];
      if (!b.mesh) continue;
      var dx = playerPos.x - b.mesh.position.x;
      var dz = playerPos.z - b.mesh.position.z;
      if (Math.sqrt(dx * dx + dz * dz) <= REPAIR_RADIUS) {
        _repairing = true;
        _repairTimer = 0;
        _repairStartIntegrity = _suitIntegrity;
        _playHiss();
        _notify('Decontamination started — hold Ctrl+F...', '#44aaff');
        return true;
      }
    }
    _notify('No water barrel nearby', '#888888');
    return false;
  }

  // ── Main update ───────────────────────────────────────────────────────────────

  function update(dt) {
    if (!dt || dt <= 0) return;

    var playerPos = null;
    if (typeof window._camera !== 'undefined' && window._camera) {
      playerPos = window._camera.position;
    } else if (_camera) {
      playerPos = _camera.position;
    }

    var t = performance.now() / 1000;

    // Animate pickups (bob + rotate) and check proximity for F-key equip
    for (var i = _pickups.length - 1; i >= 0; i--) {
      var p = _pickups[i];
      if (!p.mesh) continue;

      p.mesh.rotation.y += dt * 1.0;
      if (!p.mesh.userData.baseY) p.mesh.userData.baseY = p.mesh.position.y;
      p.mesh.position.y = p.mesh.userData.baseY + Math.sin(t * 1.8 + p.mesh._bobOffset) * 0.1;

      if (!playerPos) continue;
      var dx = playerPos.x - p.mesh.position.x;
      var dz = playerPos.z - p.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < COLLECT_RADIUS) {
        // Prompt if not already available
        if (!_suitAvailable) {
          _notify('NBC suit nearby — press F to equip', '#ffee00');
          _suitAvailable = true;
          _suitIntegrity = SUIT_INTEGRITY_MAX;
        }
        if (_fKeyDown && !_suitEquipped) {
          _scene.remove(p.mesh);
          _pickups.splice(i, 1);
          equip();
        }
      }
    }

    if (!_suitEquipped) {
      _updateHUD(dt);
      return;
    }

    // ── Suit logic ────────────────────────────────────────────────────

    // Apply integrity drain from environment
    var inGas  = _inGasCloud();
    var inFire = _inFire();

    if (_suitIntegrity > 0) {
      if (inGas)  _suitIntegrity = Math.max(0, _suitIntegrity - GAS_DRAIN_RATE * dt);
      if (inFire) _suitIntegrity = Math.max(0, _suitIntegrity - FIRE_DRAIN_RATE * dt);
    }

    // Suit disabled at 0
    if (_suitIntegrity <= 0) {
      window._gasImmune = false;
      // gas fully penetrates — no override
    } else if (_suitIntegrity <= PENETRATION_THRESHOLD) {
      // Partial protection (25% damage reduction)
      window._gasImmune = false;
      window._nbcGasDamageReduction = 0.25;
    } else {
      // Full chemical immunity
      if (typeof window.ChemicalWarfare !== 'undefined') {
        window._gasImmune = true;
      }
      window._nbcGasDamageReduction = 1.0;
    }

    // Radiation reduction always active while suited + integrity > 0
    window._nbcRadiationReduction = (_suitIntegrity > 0) ? RADIATION_REDUCTION : 0;
    // Smoke reduction
    window._nbcSmokeReduction = (_suitIntegrity > 0) ? SMOKE_REDUCTION : 0;

    // Emergency air
    if (_emergencyActive) {
      _emergencyTimer -= dt;
      if (_emergencyTimer <= 0) {
        _emergencyActive = false;
        _emergencyTimer  = 0;
        _emergencyCooldown = EMERGENCY_COOLDOWN;
        _notify('Emergency air exhausted', '#888888');
      } else {
        // Full immunity override regardless of suit integrity
        window._gasImmune = true;
        window._nbcGasDamageReduction = 1.0;
      }
    } else if (_emergencyCooldown > 0) {
      _emergencyCooldown = Math.max(0, _emergencyCooldown - dt);
    }

    // Breathing audio
    _breathTimer += dt;
    if (_breathTimer >= BREATH_INTERVAL) {
      _breathTimer = 0;
      _playBreath();
    }

    // Geiger counter ticks
    var inChem = (typeof window._playerInGasCloud !== 'undefined' && window._playerInGasCloud);
    var geigerInterval = inChem ? GEIGER_BASE_INTERVAL * 0.3 : GEIGER_BASE_INTERVAL;
    _geigerTimer += dt;
    if (_geigerTimer >= geigerInterval) {
      _geigerTimer = 0;
      _playGeigerTick();
      if (inChem) _playAlert();
    }

    // Unequip hold (F held for UNEQUIP_HOLD_TIME, not in contamination zone)
    if (_fKeyDown && _suitEquipped) {
      if (!_inAnyContamination()) {
        _unequipHoldTimer += dt;
        if (_unequipHoldTimer >= UNEQUIP_HOLD_TIME) {
          _unequipHoldTimer = 0;
          unequip();
        }
      } else {
        _unequipHoldTimer = 0;
        _notify('Cannot remove suit in contamination zone!', '#ff8800');
      }
    }

    // Ctrl+F repair
    if (_ctrlFDown && playerPos) {
      if (!_repairing) {
        _tryRepair(playerPos);
      }
    } else if (_repairing && !_ctrlFDown) {
      // Key released — cancel repair
      _repairing = false;
      _repairTimer = 0;
      _notify('Decontamination cancelled', '#888888');
    }

    // Repair progress
    if (_repairing) {
      _repairTimer += dt;
      if (_repairTimer >= REPAIR_DURATION) {
        var restored = Math.min(REPAIR_AMOUNT, SUIT_INTEGRITY_MAX - _suitIntegrity);
        _suitIntegrity = Math.min(SUIT_INTEGRITY_MAX, _suitIntegrity + REPAIR_AMOUNT);
        _repairing = false;
        _repairTimer = 0;
        _playHiss();
        _notify('Decontamination complete — suit integrity +' + Math.floor(restored) + '%', '#44aaff');
      }
    }

    // Hazmat Hero achievement tracking
    if (_inAnyContamination()) {
      if (!_hazmatHeroEarned) {
        _hazmatHeroTimer += dt;
        if (_hazmatHeroTimer >= HAZMAT_HERO_TIME) {
          _awardHazmatHero();
        }
      }
    } else {
      _hazmatHeroTimer = 0;
    }

    _updateHUD(dt);
  }

  // ── Explosion damage hook ─────────────────────────────────────────────────────
  // Call this from explosion code: NBCProtection.onExplosion()

  function onExplosion() {
    if (!_suitEquipped) return;
    _suitIntegrity = Math.max(0, _suitIntegrity - EXPLOSION_DRAIN);
    if (_suitIntegrity <= 0) {
      window._gasImmune = false;
      _notify('NBC SUIT DESTROYED by explosion!', '#ff2200');
    } else {
      _notify('Suit integrity reduced by explosion: ' + Math.floor(_suitIntegrity) + '%', '#ff8800');
    }
  }

  // ── Public: init ─────────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _pickups      = [];
    _waterBarrels = [];
    _suitAvailable   = false;
    _suitEquipped    = false;
    _suitIntegrity   = SUIT_INTEGRITY_MAX;
    _repairing       = false;
    _repairTimer     = 0;
    _emergencyActive = false;
    _emergencyTimer  = 0;
    _emergencyCooldown = 0;
    _breathTimer     = 0;
    _geigerTimer     = 0;
    _hazmatHeroTimer = 0;
    _hazmatHeroEarned= false;
    _chemResistBonus = 0;
    _unequipHoldTimer = 0;
    _fKeyDown        = false;
    _ctrlFDown       = false;
    _warningFlashTimer = 0;
    _warningVisible  = false;

    window._gasImmune              = false;
    window._nbcSpeedMult           = 1;
    window._nbcFireRateMult        = 1;
    window._nbcRadiationReduction  = 0;
    window._nbcSmokeReduction      = 0;
    window._nbcGasDamageReduction  = 0;
    window._nbcChemResistBonus     = 0;

    if (!_vignetteEl) _createHUD();
    _bindKeys();
    _updateHUD(0);
  }

  // ── Public: reset ─────────────────────────────────────────────────────────────

  function reset() {
    // Remove all pickup meshes
    for (var i = 0; i < _pickups.length; i++) {
      if (_scene && _pickups[i].mesh) _scene.remove(_pickups[i].mesh);
    }
    _pickups = [];

    // Remove all water barrel meshes
    for (var j = 0; j < _waterBarrels.length; j++) {
      if (_scene && _waterBarrels[j].mesh) _scene.remove(_waterBarrels[j].mesh);
    }
    _waterBarrels = [];

    if (_suitEquipped) unequip();

    _suitAvailable    = false;
    _suitIntegrity    = SUIT_INTEGRITY_MAX;
    _repairing        = false;
    _repairTimer      = 0;
    _emergencyActive  = false;
    _emergencyTimer   = 0;
    _emergencyCooldown = 0;
    _breathTimer      = 0;
    _geigerTimer      = 0;
    _hazmatHeroTimer  = 0;
    _hazmatHeroEarned = false;
    _chemResistBonus  = 0;
    _unequipHoldTimer = 0;
    _warningFlashTimer = 0;
    _warningVisible   = false;

    window._gasImmune             = false;
    window._nbcSpeedMult          = 1;
    window._nbcFireRateMult       = 1;
    window._nbcRadiationReduction = 0;
    window._nbcSmokeReduction     = 0;
    window._nbcGasDamageReduction = 0;
    window._nbcChemResistBonus    = 0;

    _updateHUD(0);
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  return {
    init:            init,
    update:          update,
    equip:           equip,
    unequip:         unequip,
    spawnPickup:     spawnPickup,
    spawnWaterBarrel: spawnWaterBarrel,
    onExplosion:     onExplosion,
    reset:           reset,
  };
})();
