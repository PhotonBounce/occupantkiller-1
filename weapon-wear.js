/* ============================================================
 *  WEAPON-WEAR.JS — Gun degradation, field maintenance & repair
 *  Feature: Weapon Wear — guns degrade with use and need field maintenance
 *
 *  Condition states:
 *    100%      = PRISTINE  (green)
 *    75-99%    = GOOD      (yellow)
 *    50-74%    = WORN      (orange) — +15% recoil, -5% accuracy
 *    25-49%    = DAMAGED   (red)    — +30% recoil, -15% accuracy, 5% jam/shot
 *    0-24%     = CRITICAL  (flash)  — +60% recoil, -30% accuracy, 20% jam, misfire
 *
 *  Globals published:
 *    window._weaponCondition      (0-100)
 *    window._weaponJammed         (bool)
 *    window._weaponRecoilMult     (1.0 baseline)
 *    window._weaponAccuracyPenalty(0.0 baseline)
 *
 *  Integration surface:
 *    WeaponWear.init(scene)   — call once after scene ready
 *    WeaponWear.update(delta) — call each frame from game loop
 *    WeaponWear.onShot()      — call whenever weapon fires
 *    WeaponWear.repair()      — force full-repair (called internally by workbench)
 *    WeaponWear.reset()       — on weapon switch / level clear
 * ============================================================ */
window.WeaponWear = (function () {
  'use strict';

  /* ── Configuration ──────────────────────────────────────── */
  var CFG = {
    DEGRADE_PER_SHOT:     0.15,   // % lost per shot at normal conditions
    RAIN_DEGRADE_MULT:    2.0,    // multiplier when window._isRaining is truthy
    REPAIR_TARGET:        90,     // % restored after using workbench
    REPAIR_DURATION:      5.0,    // seconds at workbench to complete repair
    FIELD_STRIP_BONUS:    10,     // % condition gained from double-tap R
    FIELD_STRIP_DURATION: 3.0,    // seconds the field strip animation lasts
    FIELD_STRIP_THRESHOLD: 50,    // field strip only available below this %
    WORKBENCH_RANGE:      3.0,    // metres to trigger hold-F prompt
    WORKBENCH_GEOM: { w: 1.5, h: 0.8, d: 0.7 },
    NUM_WORKBENCHES:      2,      // spawned per level
    JAM_CLEAR_DURATION:   0.8,    // seconds for R-tap animation to clear jam
    SCRAPE_INTERVAL:      2.5,    // seconds between metallic-scrape ticks
    HUD_BLINK_RATE:       0.4,    // seconds per blink cycle in CRITICAL
    R_DBL_TAP_WINDOW:     0.35    // seconds between taps for double-tap detection
  };

  /* ── Condition band definitions ─────────────────────────── */
  var BANDS = [
    { min: 75, max: 100, name: 'PRISTINE', color: '#22cc44', recoil: 1.0, accuracy: 0.00, jamChance: 0.00 },
    { min: 50, max:  74, name: 'GOOD',     color: '#cccc00', recoil: 1.0, accuracy: 0.00, jamChance: 0.00 },
    { min: 25, max:  49, name: 'WORN',     color: '#ff8800', recoil: 1.15, accuracy: 0.05, jamChance: 0.00 },
    { min:  0, max:  24, name: 'DAMAGED',  color: '#cc2200', recoil: 1.30, accuracy: 0.15, jamChance: 0.05 },
    { min: -1, max:  -1, name: 'CRITICAL', color: '#ff0000', recoil: 1.60, accuracy: 0.30, jamChance: 0.20 }
  ];
  // Note: PRISTINE maps to 75-100, GOOD to 50-74, reordered for index lookup
  // We will compute band dynamically from condition value.

  /* ── State ──────────────────────────────────────────────── */
  var _scene             = null;
  var _condition         = 100;   // 0-100
  var _jammed            = false;
  var _jamClearTimer     = 0;     // counts down while clearing jam
  var _clearingJam       = false;
  var _fieldStripping    = false;
  var _fieldStripTimer   = 0;
  var _repairing         = false;
  var _repairTimer       = 0;
  var _lastRKeyTime      = 0;     // for double-tap detection
  var _workbenches       = [];    // THREE.Mesh[]
  var _nearWorkbench     = false;
  var _scrapeTimer       = 0;
  var _blinkTimer        = 0;
  var _blinkOn           = true;
  var _hudEl             = null;  // condition bar element
  var _hudBarFill        = null;
  var _hudLabel          = null;
  var _promptEl          = null;  // interaction-prompt element (reused)
  var _interactionPromptText = ''; // tracks what we wrote so we can clear it

  /* ── Publish globals ────────────────────────────────────── */
  function _syncGlobals() {
    var band = _getBand();
    window._weaponCondition      = _condition;
    window._weaponJammed         = _jammed;
    window._weaponRecoilMult     = _jammed ? 1.0 : band.recoil;
    window._weaponAccuracyPenalty = _jammed ? 0.0 : band.accuracy;
  }

  /* ── Band helper ─────────────────────────────────────────── */
  function _getBand() {
    if (_condition >= 75) return { name: 'PRISTINE', color: '#22cc44', recoil: 1.0,  accuracy: 0.00, jamChance: 0.00 };
    if (_condition >= 50) return { name: 'GOOD',     color: '#cccc00', recoil: 1.0,  accuracy: 0.00, jamChance: 0.00 };
    if (_condition >= 25) return { name: 'WORN',     color: '#ff8800', recoil: 1.15, accuracy: 0.05, jamChance: 0.00 };
    if (_condition > 0)   return { name: 'DAMAGED',  color: '#cc2200', recoil: 1.30, accuracy: 0.15, jamChance: 0.05 };
    return                       { name: 'CRITICAL', color: '#ff0000', recoil: 1.60, accuracy: 0.30, jamChance: 0.20 };
  }

  /* ── Audio helpers (safe-fallback) ─────────────────────── */
  function _playDryFire() {
    if (window.AudioSystem && typeof window.AudioSystem.playDryFire === 'function') {
      window.AudioSystem.playDryFire();
    }
  }

  function _playMetallicScrape() {
    // Reuse ricochet as a scraping proxy — many games do this
    if (window.AudioSystem && typeof window.AudioSystem.playRicochet === 'function') {
      window.AudioSystem.playRicochet();
    }
  }

  function _playFieldStripClunk() {
    if (window.AudioSystem && typeof window.AudioSystem.playImpact === 'function') {
      window.AudioSystem.playImpact();
    }
  }

  function _playRepairChime() {
    if (window.AudioSystem && typeof window.AudioSystem.playReadyChime === 'function') {
      window.AudioSystem.playReadyChime();
    }
  }

  /* ── Toast helper ───────────────────────────────────────── */
  function _toast(msg, color) {
    var el = document.getElementById('pickup-notif');
    if (!el) return;
    el.textContent = msg;
    el.style.color  = color || '#ffffff';
    el.style.display = 'block';
    el.style.opacity = '1';
    clearTimeout(el._wearTimer);
    el._wearTimer = setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () { el.style.display = 'none'; }, 400);
    }, 2200);
  }

  /* ── HUD creation ───────────────────────────────────────── */
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'weapon-wear-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:38px',
      'left:50%',
      'transform:translateX(-50%)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'gap:2px',
      'z-index:200',
      'pointer-events:none',
      'font-family:monospace',
      'font-size:10px'
    ].join(';');

    _hudLabel = document.createElement('div');
    _hudLabel.style.cssText = 'color:#aaa;letter-spacing:1px;text-align:center;line-height:1';
    _hudLabel.textContent = '🔧 GUN: PRISTINE';

    var track = document.createElement('div');
    track.style.cssText = 'width:80px;height:4px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:2px;overflow:hidden';

    _hudBarFill = document.createElement('div');
    _hudBarFill.style.cssText = 'width:100%;height:100%;background:#22cc44;border-radius:2px;transition:width 0.3s,background 0.3s';

    track.appendChild(_hudBarFill);
    _hudEl.appendChild(_hudLabel);
    _hudEl.appendChild(track);
    document.body.appendChild(_hudEl);
  }

  /* ── HUD update ─────────────────────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    var band = _getBand();
    var pct  = Math.max(0, Math.min(100, _condition));

    _hudBarFill.style.width = pct + '%';

    var isCritical = (band.name === 'CRITICAL');
    var displayColor = (isCritical && !_blinkOn) ? 'rgba(255,0,0,0.2)' : band.color;
    _hudBarFill.style.background = displayColor;

    var labelColor = isCritical ? ((_blinkOn) ? '#ff4444' : '#aa2222') : band.color;
    _hudLabel.style.color = labelColor;
    _hudLabel.textContent = '🔧 GUN: ' + band.name;

    // Show jam state in HUD label
    if (_jammed) {
      _hudLabel.textContent = '🔧 GUN: JAMMED!';
      _hudLabel.style.color = '#ffcc00';
      _hudBarFill.style.background = '#ffcc00';
    } else if (_fieldStripping) {
      _hudLabel.textContent = '🔧 GUN: CLEANING...';
      _hudLabel.style.color = '#cccc00';
    } else if (_repairing) {
      var pctDone = Math.min(1, (CFG.REPAIR_DURATION - _repairTimer) / CFG.REPAIR_DURATION);
      _hudLabel.textContent = '🔧 GUN: REPAIRING ' + Math.round(pctDone * 100) + '%';
      _hudLabel.style.color = '#00ccff';
    }
  }

  /* ── Jam indicator (existing DOM element) ───────────────── */
  function _setJamHUD(visible) {
    var el = document.getElementById('jam-indicator');
    if (el) el.style.display = visible ? 'block' : 'none';
  }

  /* ── Maintenance indicator ──────────────────────────────── */
  function _setMaintenanceHUD(visible) {
    var el = document.getElementById('maintenance-indicator');
    if (el) el.style.display = visible ? 'block' : 'none';
  }

  /* ── Interaction prompt ─────────────────────────────────── */
  function _setPrompt(text) {
    var el = document.getElementById('interaction-prompt');
    if (!el) return;
    if (text) {
      el.textContent = text;
      el.style.display = 'block';
      _interactionPromptText = text;
    } else if (_interactionPromptText) {
      // Only clear if we set it
      el.style.display = 'none';
      el.textContent = '';
      _interactionPromptText = '';
    }
  }

  /* ── Workbench spawning ─────────────────────────────────── */
  function _spawnWorkbenches() {
    if (!_scene) return;
    if (typeof THREE === 'undefined') return;

    // Clear old workbenches
    for (var i = 0; i < _workbenches.length; i++) {
      _scene.remove(_workbenches[i]);
      if (_workbenches[i].geometry) _workbenches[i].geometry.dispose();
      if (_workbenches[i].material) _workbenches[i].material.dispose();
    }
    _workbenches = [];

    var count = CFG.NUM_WORKBENCHES;
    var geom  = new THREE.BoxGeometry(CFG.WORKBENCH_GEOM.w, CFG.WORKBENCH_GEOM.h, CFG.WORKBENCH_GEOM.d);
    var mat   = new THREE.MeshLambertMaterial({ color: 0x556655 }); // gray-olive

    // Simple placement: scatter around origin within a ring
    for (var n = 0; n < count; n++) {
      var angle = (n / count) * Math.PI * 2 + Math.PI * 0.25;
      var radius = 18 + n * 8;
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        Math.cos(angle) * radius,
        CFG.WORKBENCH_GEOM.h / 2 + 0.05,
        Math.sin(angle) * radius
      );
      mesh.castShadow    = true;
      mesh.receiveShadow = true;
      mesh.name = 'gun_workbench_' + n;
      mesh.userData.isGunWorkbench = true;
      _scene.add(mesh);
      _workbenches.push(mesh);
    }
  }

  /* ── Check proximity to workbench ───────────────────────── */
  function _checkWorkbenchProximity(playerPos) {
    if (!playerPos || _workbenches.length === 0) {
      _nearWorkbench = false;
      return;
    }
    var rangeSq = CFG.WORKBENCH_RANGE * CFG.WORKBENCH_RANGE;
    _nearWorkbench = false;
    for (var i = 0; i < _workbenches.length; i++) {
      var wb = _workbenches[i];
      var dx = wb.position.x - playerPos.x;
      var dz = wb.position.z - playerPos.z;
      if (dx * dx + dz * dz <= rangeSq) {
        _nearWorkbench = true;
        break;
      }
    }
  }

  /* ── Get player position from game globals ───────────────── */
  function _getPlayerPos() {
    if (window.GameManager && typeof window.GameManager.getCamera === 'function') {
      var cam = window.GameManager.getCamera();
      if (cam && cam.position) return cam.position;
    }
    if (window._playerPos) return window._playerPos;
    return null;
  }

  /* ── Public: init ───────────────────────────────────────── */
  function init(scene) {
    _scene = scene || null;
    _condition = 100;
    _jammed    = false;
    _clearingJam   = false;
    _fieldStripping = false;
    _repairing      = false;
    _nearWorkbench  = false;
    _repairTimer    = 0;
    _fieldStripTimer = 0;
    _jamClearTimer  = 0;
    _scrapeTimer    = 0;
    _blinkTimer     = 0;
    _blinkOn        = true;
    _lastRKeyTime   = 0;
    _syncGlobals();
    _createHUD();
    _updateHUD();
    if (_scene) _spawnWorkbenches();
    _bindKeys();
    console.log('[WeaponWear] init — condition 100%');
  }

  /* ── Public: reset (weapon switch) ─────────────────────── */
  function reset() {
    _condition = 100;
    _jammed    = false;
    _clearingJam   = false;
    _fieldStripping = false;
    _repairing      = false;
    _scrapeTimer    = 0;
    _jamClearTimer  = 0;
    _fieldStripTimer = 0;
    _setJamHUD(false);
    _setMaintenanceHUD(false);
    _setPrompt('');
    _syncGlobals();
    _updateHUD();
  }

  /* ── Public: repair (called by workbench interaction) ───── */
  function repair() {
    _condition = CFG.REPAIR_TARGET;
    _jammed    = false;
    _clearingJam   = false;
    _fieldStripping = false;
    _repairing      = false;
    _repairTimer    = 0;
    _setJamHUD(false);
    _setMaintenanceHUD(false);
    _syncGlobals();
    _updateHUD();
    _playRepairChime();
    _toast('WEAPON REPAIRED', '#44ff88');
    console.log('[WeaponWear] weapon repaired to ' + CFG.REPAIR_TARGET + '%');
  }

  /* ── Public: onShot ─────────────────────────────────────── */
  function onShot() {
    // If jammed or clearing, reject the shot
    if (_jammed || _clearingJam || _fieldStripping || _repairing) {
      if (_jammed) _playDryFire();
      return;
    }

    // Degrade condition
    var degradeRate = CFG.DEGRADE_PER_SHOT;
    if (window._isRaining) degradeRate *= CFG.RAIN_DEGRADE_MULT;
    _condition = Math.max(0, _condition - degradeRate);

    // CRITICAL misfire (intermittent — only sometimes fire+click)
    var band = _getBand();
    if (band.name === 'CRITICAL') {
      if (Math.random() < 0.12) {
        // Misfire: play dry click, suppress this shot
        _playDryFire();
        _syncGlobals();
        return;
      }
    }

    // Jam check
    var jamChance = band.jamChance;
    if (jamChance > 0 && Math.random() < jamChance) {
      _jammed = true;
      _setJamHUD(true);
      _syncGlobals();
      _updateHUD();
      _playDryFire();
      _toast('WEAPON JAMMED — Tap R to clear', '#ffcc00');
      return;
    }

    _syncGlobals();
    _updateHUD();
  }

  /* ── Key bindings ───────────────────────────────────────── */
  var _keysBound = false;
  function _bindKeys() {
    if (_keysBound) return;
    _keysBound = true;
    document.addEventListener('keydown', _onKeyDown, false);
  }

  function _onKeyDown(e) {
    var key = e.code || e.key;

    // R key — clear jam (single tap) OR field strip (double tap while worn/damaged)
    if (key === 'KeyR') {
      var now = performance.now ? performance.now() : Date.now();

      if (_jammed && !_clearingJam) {
        // Single R tap clears jam
        _clearingJam   = true;
        _jamClearTimer = CFG.JAM_CLEAR_DURATION;
        _setMaintenanceHUD(true);
        return;
      }

      // Double-tap R for field strip (condition < 50%, not jammed, not already stripping)
      if (!_jammed && !_fieldStripping && !_repairing && _condition < CFG.FIELD_STRIP_THRESHOLD) {
        var elapsed = (now - _lastRKeyTime) / 1000;
        if (elapsed < CFG.R_DBL_TAP_WINDOW) {
          // Second tap detected
          _fieldStripping  = true;
          _fieldStripTimer = CFG.FIELD_STRIP_DURATION;
          _setMaintenanceHUD(true);
          _playFieldStripClunk();
          _toast('FIELD STRIP — Quick clean in progress...', '#cccc00');
        }
        _lastRKeyTime = now;
        return;
      }

      _lastRKeyTime = now;
    }

    // F key (hold) — handled via _nearWorkbench check in update()
    // We track F being held to accumulate repair time
    if (key === 'KeyF') {
      if (_nearWorkbench && !_repairing && !_fieldStripping) {
        _repairing   = true;
        _repairTimer = CFG.REPAIR_DURATION;
        _setMaintenanceHUD(true);
        _toast('Hold F — Repairing weapon...', '#00ccff');
      }
    }
  }

  /* ── Public: update ─────────────────────────────────────── */
  function update(delta) {
    if (typeof delta !== 'number' || delta <= 0 || delta > 1) delta = 0.016;

    /* ── Jam clear animation countdown ─────────────── */
    if (_clearingJam) {
      _jamClearTimer -= delta;
      if (_jamClearTimer <= 0) {
        _clearingJam = false;
        _jammed      = false;
        _setJamHUD(false);
        _setMaintenanceHUD(false);
        _syncGlobals();
        _updateHUD();
        _toast('Jam cleared — reload to continue', '#88ff88');
      }
    }

    /* ── Field strip countdown ──────────────────────── */
    if (_fieldStripping) {
      _fieldStripTimer -= delta;
      if (_fieldStripTimer <= 0) {
        _fieldStripping = false;
        _condition = Math.min(100, _condition + CFG.FIELD_STRIP_BONUS);
        _setMaintenanceHUD(false);
        _syncGlobals();
        _updateHUD();
        _toast('+' + CFG.FIELD_STRIP_BONUS + '% condition — Field strip done', '#cccc44');
      }
    }

    /* ── Workbench repair countdown ─────────────────── */
    if (_repairing) {
      // Abort if player walks away
      _checkWorkbenchProximity(_getPlayerPos());
      if (!_nearWorkbench) {
        _repairing   = false;
        _repairTimer = 0;
        _setMaintenanceHUD(false);
        _toast('Repair aborted — moved away from workbench', '#ff8800');
      } else {
        _repairTimer -= delta;
        if (_repairTimer <= 0) {
          repair();
        }
      }
    }

    /* ── Workbench proximity prompt ─────────────────── */
    if (!_repairing) {
      _checkWorkbenchProximity(_getPlayerPos());
      if (_nearWorkbench) {
        _setPrompt('[Hold F] Repair weapon at workbench');
      } else if (_interactionPromptText.indexOf('Repair weapon') !== -1) {
        _setPrompt('');
      }
    }

    /* ── Metallic scraping sound when < 50% ─────────── */
    if (_condition < 50 && !_jammed && !_fieldStripping && !_repairing) {
      _scrapeTimer -= delta;
      if (_scrapeTimer <= 0) {
        _playMetallicScrape();
        _scrapeTimer = CFG.SCRAPE_INTERVAL;
      }
    } else {
      _scrapeTimer = 0;
    }

    /* ── CRITICAL blink timer ───────────────────────── */
    if (_getBand().name === 'CRITICAL' && !_jammed) {
      _blinkTimer -= delta;
      if (_blinkTimer <= 0) {
        _blinkOn    = !_blinkOn;
        _blinkTimer = CFG.HUD_BLINK_RATE;
        _updateHUD();
      }
    } else {
      _blinkOn    = true;
      _blinkTimer = 0;
    }

    _updateHUD();
  }

  /* ── Expose public API ───────────────────────────────────── */
  return {
    init:   init,
    update: update,
    onShot: onShot,
    repair: repair,
    reset:  reset
  };
})();
