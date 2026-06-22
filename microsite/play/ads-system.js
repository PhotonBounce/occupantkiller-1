/**
 * ads-system.js — Aim Down Sights / Scope Overlay System
 * Ukraine-conflict FPS (Three.js browser game)
 *
 * IIFE pattern, all var (never let/const).
 * Exports: window.ADSSystem
 */
window.ADSSystem = (function () {

  /* ── ADS States ──────────────────────────────────────────────────── */
  var STATE_HIPFIRE          = 'HIPFIRE';
  var STATE_TRANSITIONING_IN = 'TRANSITIONING_IN';
  var STATE_ADS              = 'ADS';
  var STATE_TRANSITIONING_OUT = 'TRANSITIONING_OUT';

  /* ── Weapon type → ADS FOV map ───────────────────────────────────── */
  var ADS_FOV = {
    PISTOL:       65,
    SMG:          60,
    ASSAULT:      55,
    NATO:         55,   // assault-class alias
    NATO_HEAVY:   55,
    LMG:          58,
    HMG:          58,
    HMG_HEAVY:    58,
    MACHINEGUN:   58,
    MINIGUN:      58,
    SNIPER:       20,
    AMR:          15,   // heavy sniper
    AT:           50,
    ATGM:         50,
    AT_HEAVY:     50,
    AT_LIGHT:     50,
    LAUNCHER:     50,
    AA:           50
  };

  var HIPFIRE_FOV            = 75;
  var TRANSITION_IN_DURATION = 0.15;   // seconds
  var TRANSITION_OUT_DURATION= 0.12;   // seconds
  var FOV_LERP_SPEED         = 300;    // degrees per second (max)

  /* ── Scope sway constants ─────────────────────────────────────────── */
  var SWAY_FREQ_STAND  = 0.8;   // Hz
  var SWAY_AMP_STAND   = 0.3;   // degrees
  var SWAY_AMP_MOVE    = 0.5;   // degrees

  /* ── Breath control constants ─────────────────────────────────────── */
  var BREATH_MAX_HOLD  = 3.0;   // seconds held
  var BREATH_RECHARGE  = 8.0;   // seconds to refill

  /* ── Internal state ──────────────────────────────────────────────── */
  var _camera        = null;
  var _scene         = null;
  var _state         = STATE_HIPFIRE;
  var _weaponType    = 'ASSAULT';
  var _transTimer    = 0;
  var _transDuration = TRANSITION_IN_DURATION;
  var _currentFOV    = HIPFIRE_FOV;
  var _swayTime      = 0;
  var _isMoving      = false;

  // Breath control
  var _breathHeld    = false;
  var _breathTimer   = BREATH_MAX_HOLD;   // current charge (seconds)
  var _breathRecharging = false;
  var _breathRechargeTimer = 0;

  // Lens flare (heavy sniper entry flash)
  var _lensFlareTimer = 0;
  var _lensFlareActive = false;

  // DOM elements (created once)
  var _scopeEl    = null;
  var _reticleEl  = null;
  var _breathBarEl = null;
  var _breathBarContainerEl = null;
  var _crosshairEl = null;

  /* ── Helpers ─────────────────────────────────────────────────────── */
  function _isSniper() {
    return (_weaponType === 'SNIPER' || _weaponType === 'AMR');
  }

  function _isHeavySniper() {
    return (_weaponType === 'AMR');
  }

  function _adsFOV() {
    return ADS_FOV[_weaponType] || 55;
  }

  function _inADS() {
    return (_state === STATE_ADS || _state === STATE_TRANSITIONING_IN || _state === STATE_TRANSITIONING_OUT);
  }

  function _fullyADS() {
    return (_state === STATE_ADS);
  }

  /* ── DOM Injection ───────────────────────────────────────────────── */
  function _buildScopeOverlay() {
    // Remove stale element if already present
    var old = document.getElementById('scopeOverlay');
    if (old) old.parentNode.removeChild(old);

    var el = document.createElement('div');
    el.id = 'scopeOverlay';

    el.innerHTML = [
      '<style>',
      '#scopeOverlay {',
      '  display:none;',
      '  position:fixed;',
      '  top:0;left:0;right:0;bottom:0;',
      '  z-index:300;',
      '  pointer-events:none;',
      '  overflow:hidden;',
      '}',
      /* Black full-screen background except central circle (SVG clipPath) */
      '#scopeOverlay .scope-vignette {',
      '  position:absolute;',
      '  top:0;left:0;right:0;bottom:0;',
      '  background:radial-gradient(circle at 50% 50%,',
      '    transparent 34.0%,',
      '    rgba(0,0,0,0.05) 34.5%,',
      '    rgba(0,0,0,0.35) 36%,',
      '    rgba(0,0,0,0.85) 38%,',
      '    #000 40%);',
      '}',
      /* Crisp black border ring around scope circle */
      '#scopeOverlay .scope-ring {',
      '  position:absolute;',
      '  top:50%;left:50%;',
      '  transform:translate(-50%,-50%);',
      '  width:70vmin;height:70vmin;',
      '  border-radius:50%;',
      '  border:3px solid rgba(0,0,0,0.9);',
      '  box-shadow:0 0 0 200vmax rgba(0,0,0,0.92);',
      '}',
      /* Crosshair SVG overlay — spans scope circle */
      '#scopeOverlay .scope-crosshair {',
      '  position:absolute;',
      '  top:50%;left:50%;',
      '  transform:translate(-50%,-50%);',
      '  width:70vmin;height:70vmin;',
      '}',
      /* Zoom badge */
      '#scopeOverlay .scope-zoom-badge {',
      '  position:absolute;',
      '  top:calc(50% - 37vmin);',
      '  right:calc(50% - 37vmin);',
      '  background:rgba(0,0,0,0.65);',
      '  color:#dde;',
      '  font-family:monospace;',
      '  font-size:11px;',
      '  letter-spacing:1px;',
      '  padding:3px 7px;',
      '  border-radius:3px;',
      '  border:1px solid rgba(200,220,255,0.25);',
      '}',
      /* Lens flare flash (heavy sniper entry) */
      '#scopeOverlay .scope-lensflare {',
      '  display:none;',
      '  position:absolute;',
      '  top:50%;left:50%;',
      '  transform:translate(-50%,-50%);',
      '  width:70vmin;height:70vmin;',
      '  border-radius:50%;',
      '  background:radial-gradient(circle at 50% 50%,rgba(255,255,220,0.55) 0%,rgba(255,255,180,0.15) 55%,transparent 70%);',
      '  pointer-events:none;',
      '}',
      '</style>',

      /* Black vignette */
      '<div class="scope-vignette"></div>',

      /* Sharp ring boundary */
      '<div class="scope-ring"></div>',

      /* SVG crosshair + mil-dots + rangefinder */
      '<svg class="scope-crosshair" viewBox="0 0 700 700" xmlns="http://www.w3.org/2000/svg">',
      '  <!-- Vertical stave -->',
      '  <line x1="350" y1="0" x2="350" y2="700" stroke="rgba(0,0,0,0.82)" stroke-width="1.2"/>',
      '  <!-- Horizontal stave -->',
      '  <line x1="0" y1="350" x2="700" y2="350" stroke="rgba(0,0,0,0.82)" stroke-width="1.2"/>',
      /* Range-finder dashes: at ~100m (y=+58), 200m (y=+116), 300m (y=+174) from centre */
      '  <!-- Range marks: 100m -->',
      '  <line x1="338" y1="408" x2="362" y2="408" stroke="rgba(0,0,0,0.82)" stroke-width="1.2"/>',
      '  <text x="367" y="411" font-family="monospace" font-size="14" fill="rgba(0,0,0,0.75)">100</text>',
      '  <!-- Range marks: 200m -->',
      '  <line x1="335" y1="466" x2="365" y2="466" stroke="rgba(0,0,0,0.82)" stroke-width="1.2"/>',
      '  <text x="370" y="469" font-family="monospace" font-size="14" fill="rgba(0,0,0,0.75)">200</text>',
      '  <!-- Range marks: 300m -->',
      '  <line x1="332" y1="524" x2="368" y2="524" stroke="rgba(0,0,0,0.82)" stroke-width="1.2"/>',
      '  <text x="373" y="527" font-family="monospace" font-size="14" fill="rgba(0,0,0,0.75)">300</text>',
      /* Mil-dots — 5 on each arm, evenly spaced at ~58px intervals */
      '  <!-- Upper arm mil-dots -->',
      '  <circle cx="350" cy="292" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="350" cy="234" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="350" cy="176" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="350" cy="118" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="350" cy="60"  r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <!-- Lower arm mil-dots -->',
      '  <circle cx="350" cy="408" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="350" cy="466" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="350" cy="524" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="350" cy="582" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="350" cy="640" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <!-- Left arm mil-dots -->',
      '  <circle cx="292" cy="350" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="234" cy="350" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="176" cy="350" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="118" cy="350" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="60"  cy="350" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <!-- Right arm mil-dots -->',
      '  <circle cx="408" cy="350" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="466" cy="350" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="524" cy="350" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="582" cy="350" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <circle cx="640" cy="350" r="3.5" fill="rgba(0,0,0,0.80)"/>',
      '  <!-- Centre dot -->',
      '  <circle cx="350" cy="350" r="2.5" fill="rgba(0,0,0,0.90)"/>',
      '</svg>',

      /* Zoom badge (top-right of scope circle) */
      '<div class="scope-zoom-badge" id="scopeZoomBadge">4&times; MAGNIFICATION</div>',

      /* Lens flare div (heavy sniper only) */
      '<div class="scope-lensflare" id="scopeLensFlare"></div>'
    ].join('');

    document.body.appendChild(el);
    return el;
  }

  function _buildADSReticle() {
    var old = document.getElementById('adsReticle');
    if (old) old.parentNode.removeChild(old);

    var el = document.createElement('div');
    el.id = 'adsReticle';
    el.innerHTML = [
      '<style>',
      '#adsReticle {',
      '  display:none;',
      '  position:fixed;',
      '  top:50%;left:50%;',
      '  transform:translate(-50%,-50%);',
      '  z-index:299;',
      '  pointer-events:none;',
      '}',
      '#adsReticle .ads-dot {',
      '  position:absolute;',
      '  top:50%;left:50%;',
      '  width:3px;height:3px;',
      '  margin:-1.5px 0 0 -1.5px;',
      '  background:rgba(255,255,255,0.9);',
      '  border-radius:50%;',
      '}',
      '#adsReticle .ads-line {',
      '  position:absolute;',
      '  background:rgba(255,255,255,0.75);',
      '}',
      '#adsReticle .ads-top    { width:1px;height:7px;top:50%;left:50%;margin-left:-0.5px;margin-top:-14px; }',
      '#adsReticle .ads-bottom { width:1px;height:7px;top:50%;left:50%;margin-left:-0.5px;margin-top:7px; }',
      '#adsReticle .ads-left   { width:7px;height:1px;top:50%;left:50%;margin-top:-0.5px;margin-left:-14px; }',
      '#adsReticle .ads-right  { width:7px;height:1px;top:50%;left:50%;margin-top:-0.5px;margin-left:7px; }',
      '</style>',
      '<div class="ads-line ads-top"></div>',
      '<div class="ads-line ads-bottom"></div>',
      '<div class="ads-line ads-left"></div>',
      '<div class="ads-line ads-right"></div>',
      '<div class="ads-dot"></div>'
    ].join('');

    document.body.appendChild(el);
    return el;
  }

  function _buildBreathBar() {
    // Reuse the breath-bar-container from index.html if present, or create our own
    var existing = document.getElementById('breathBar');
    if (existing) return existing;

    var container = document.createElement('div');
    container.id = 'breathBarContainer';
    container.style.cssText = [
      'display:none',
      'position:fixed',
      'bottom:180px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:60px',
      'height:6px',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid rgba(100,200,255,0.5)',
      'border-radius:3px',
      'z-index:302',
      'pointer-events:none',
      'overflow:hidden'
    ].join(';');

    var bar = document.createElement('div');
    bar.id = 'breathBar';
    bar.style.cssText = [
      'width:100%',
      'height:100%',
      'background:linear-gradient(90deg,#00aaff,#66ddff)',
      'border-radius:3px',
      'transition:width 0.1s linear'
    ].join(';');

    container.appendChild(bar);
    document.body.appendChild(container);

    _breathBarContainerEl = container;
    return bar;
  }

  /* ── Show / hide scope overlay ────────────────────────────────────── */
  function _showScope() {
    if (!_scopeEl) return;
    _scopeEl.style.display = 'block';

    // Update zoom badge text
    var badge = document.getElementById('scopeZoomBadge');
    if (badge) {
      var mag = Math.round((HIPFIRE_FOV / _adsFOV()) * 10) / 10;
      if (_isHeavySniper()) {
        badge.textContent = '5× MAGNIFICATION';
      } else {
        badge.textContent = mag.toFixed(1).replace('.0', '') + '× MAGNIFICATION';
      }
    }

    // Heavy sniper lens flare
    if (_isHeavySniper()) {
      var flare = document.getElementById('scopeLensFlare');
      if (flare) {
        flare.style.display = 'block';
        flare.style.opacity = '1';
        _lensFlareActive = true;
        _lensFlareTimer = 0;
      }
    }

    // Hide standard crosshair while scope is active
    if (!_crosshairEl) _crosshairEl = document.getElementById('crosshair');
    if (_crosshairEl) _crosshairEl.style.display = 'none';
  }

  function _hideScope() {
    if (!_scopeEl) return;
    _scopeEl.style.display = 'none';
    _lensFlareActive = false;
    var flare = document.getElementById('scopeLensFlare');
    if (flare) { flare.style.display = 'none'; flare.style.opacity = '0'; }
  }

  function _showADSReticle() {
    if (!_reticleEl) return;
    _reticleEl.style.display = 'block';
    // Hide standard crosshair
    if (!_crosshairEl) _crosshairEl = document.getElementById('crosshair');
    if (_crosshairEl) _crosshairEl.style.display = 'none';
  }

  function _hideADSReticle() {
    if (!_reticleEl) return;
    _reticleEl.style.display = 'none';
  }

  function _restoreHipfireHUD() {
    _hideScope();
    _hideADSReticle();
    if (!_crosshairEl) _crosshairEl = document.getElementById('crosshair');
    if (_crosshairEl) _crosshairEl.style.display = '';
    // Hide breath bar
    if (_breathBarContainerEl) _breathBarContainerEl.style.display = 'none';
    var oldContainer = document.getElementById('breathBarContainer');
    if (oldContainer) oldContainer.style.display = 'none';
  }

  function _applyADSHUD() {
    if (_isSniper()) {
      _showScope();
      _hideADSReticle();
    } else {
      _hideScope();
      _showADSReticle();
    }
  }

  /* ── Global state setters ─────────────────────────────────────────── */
  function _setADSGlobals(isADS) {
    window._adsAccuracyBonus  = isADS;
    window._adsSpeedMult      = isADS ? 0.65 : 1.0;
    window._adsHeadbobMult    = isADS ? 0.2  : 1.0;
    window._adsFOVScale       = _camera ? (_camera.fov > 0 ? HIPFIRE_FOV / _camera.fov : 1.0) : 1.0;
  }

  function _clearADSGlobals() {
    window._adsAccuracyBonus  = false;
    window._adsSpeedMult      = 1.0;
    window._adsHeadbobMult    = 1.0;
    window._adsFOVScale       = 1.0;
  }

  /* ── Public API ───────────────────────────────────────────────────── */

  /**
   * init — call once at game boot.
   * @param {THREE.Scene}            scene
   * @param {THREE.PerspectiveCamera} camera
   */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _scopeEl    = _buildScopeOverlay();
    _reticleEl  = _buildADSReticle();
    _breathBarEl = _buildBreathBar();

    _clearADSGlobals();
    console.log('[ADSSystem] initialized');
  }

  /**
   * startADS — call on right-mouse-button down.
   */
  function startADS() {
    if (_state === STATE_ADS || _state === STATE_TRANSITIONING_IN) return;
    _state         = STATE_TRANSITIONING_IN;
    _transTimer    = 0;
    _transDuration = TRANSITION_IN_DURATION;
    _setADSGlobals(false); // accuracy bonus set after full ADS
  }

  /**
   * stopADS — call on right-mouse-button up.
   */
  function stopADS() {
    if (_state === STATE_HIPFIRE || _state === STATE_TRANSITIONING_OUT) return;
    _state         = STATE_TRANSITIONING_OUT;
    _transTimer    = 0;
    _transDuration = TRANSITION_OUT_DURATION;
    _clearADSGlobals();
    _restoreHipfireHUD();
    // Stop breath control
    _breathHeld = false;
    window._breathControl = false;
    _hideBreathBar();
  }

  /**
   * isADS — returns true when fully or transitioning into ADS.
   */
  function isADS() {
    return (_state !== STATE_HIPFIRE && _state !== STATE_TRANSITIONING_OUT);
  }

  /**
   * onWeaponChange — call whenever the player switches weapons.
   * @param {string} weaponType  e.g. 'SNIPER', 'ASSAULT', 'PISTOL'
   */
  function onWeaponChange(weaponType) {
    _weaponType = weaponType || 'ASSAULT';
    // If currently in ADS and new weapon is incompatible, exit gracefully
    if (_state !== STATE_HIPFIRE) {
      stopADS();
    }
  }

  /* ── Scope sway ───────────────────────────────────────────────────── */
  function _getScopeSwayDeg() {
    if (_breathHeld && window._breathControl) return 0;
    var amp = _isMoving ? SWAY_AMP_MOVE : SWAY_AMP_STAND;
    return amp * Math.sin(_swayTime * 2 * Math.PI * SWAY_FREQ_STAND);
  }

  function _applyScopeSway(delta) {
    if (!_scopeEl || _scopeEl.style.display === 'none') return;
    _swayTime += delta;
    var deg = _getScopeSwayDeg();
    // Apply to the SVG crosshair for subtle rotation effect
    var crosshair = _scopeEl.querySelector('.scope-crosshair');
    if (crosshair) {
      crosshair.style.transform = 'translate(-50%,-50%) rotate(' + deg.toFixed(3) + 'deg)';
    }
    var ring = _scopeEl.querySelector('.scope-ring');
    if (ring) {
      ring.style.transform = 'translate(-50%,-50%) rotate(' + deg.toFixed(3) + 'deg)';
    }
  }

  /* ── Breath control bar ───────────────────────────────────────────── */
  function _showBreathBar() {
    if (_breathBarContainerEl) _breathBarContainerEl.style.display = 'block';
    var c = document.getElementById('breathBarContainer');
    if (c) c.style.display = 'block';
  }

  function _hideBreathBar() {
    if (_breathBarContainerEl) _breathBarContainerEl.style.display = 'none';
    var c = document.getElementById('breathBarContainer');
    if (c) c.style.display = 'none';
  }

  function _updateBreathBar(pct) {
    if (!_breathBarEl) _breathBarEl = document.getElementById('breathBar');
    if (_breathBarEl) _breathBarEl.style.width = Math.max(0, Math.min(100, pct * 100)).toFixed(1) + '%';
  }

  function _updateBreathControl(delta, keys) {
    if (!_isSniper() || _state !== STATE_ADS) {
      _breathHeld = false;
      window._breathControl = false;
      _hideBreathBar();
      return;
    }

    // keys is an object from game-manager: keys['Space'] = true/false
    // We read window._adsBreathKeyHeld which game-manager sets, OR we check via a DOM keydown/up approach.
    // Since game-manager sets keys via keydown events, we rely on window._adsBreathKeyHeld
    // which is maintained by our own keydown listeners (set up in init).
    var spaceHeld = window._adsBreathKeyHeld || false;

    if (spaceHeld && _breathTimer > 0 && !_breathRecharging) {
      // Actively holding breath
      _breathHeld = true;
      window._breathControl = true;
      _breathTimer -= delta;
      if (_breathTimer <= 0) {
        _breathTimer = 0;
        _breathRecharging = true;
        _breathHeld = false;
        window._breathControl = false;
      }
      _showBreathBar();
      _updateBreathBar(_breathTimer / BREATH_MAX_HOLD);
    } else {
      _breathHeld = false;
      window._breathControl = false;

      if (_breathTimer < BREATH_MAX_HOLD) {
        // Recharge
        _breathTimer += delta / BREATH_RECHARGE * BREATH_MAX_HOLD;
        if (_breathTimer >= BREATH_MAX_HOLD) {
          _breathTimer = BREATH_MAX_HOLD;
          _breathRecharging = false;
        }
        _showBreathBar();
        _updateBreathBar(_breathTimer / BREATH_MAX_HOLD);
      } else {
        // Full charge — hide bar unless sniper & in ADS
        _hideBreathBar();
      }
    }
  }

  /* ── FOV lerp ─────────────────────────────────────────────────────── */
  function _updateFOV(delta) {
    if (!_camera) return;

    var targetFOV = HIPFIRE_FOV;

    if (_state === STATE_ADS) {
      targetFOV = _adsFOV();
    } else if (_state === STATE_TRANSITIONING_IN) {
      var tIn = Math.min(1, _transTimer / _transDuration);
      targetFOV = HIPFIRE_FOV + ((_adsFOV() - HIPFIRE_FOV) * tIn);
    } else if (_state === STATE_TRANSITIONING_OUT) {
      var tOut = Math.min(1, _transTimer / _transDuration);
      targetFOV = _adsFOV() + ((HIPFIRE_FOV - _adsFOV()) * tOut);
    }

    // Clamp the step
    var diff = targetFOV - _currentFOV;
    var maxStep = FOV_LERP_SPEED * delta;
    if (Math.abs(diff) > maxStep) {
      _currentFOV += maxStep * (diff > 0 ? 1 : -1);
    } else {
      _currentFOV = targetFOV;
    }

    _camera.fov = _currentFOV;
    _camera.updateProjectionMatrix();

    // Update FOV scale global
    window._adsFOVScale = (HIPFIRE_FOV / _currentFOV);
  }

  /* ── Lens flare decay ─────────────────────────────────────────────── */
  function _updateLensFlare(delta) {
    if (!_lensFlareActive) return;
    _lensFlareTimer += delta;
    var flare = document.getElementById('scopeLensFlare');
    if (!flare) return;
    var pct = 1 - Math.min(1, _lensFlareTimer / 0.15);
    flare.style.opacity = pct.toFixed(3);
    if (pct <= 0) {
      flare.style.display = 'none';
      _lensFlareActive = false;
    }
  }

  /**
   * update — call every frame from the game loop.
   * @param {number} delta  frame time in seconds
   */
  function update(delta) {
    if (!_camera) return;

    // Detect player movement from global (game-manager sets window._playerVelocity or we check speed)
    var vel = window._playerVelocityLen || 0;
    _isMoving = vel > 0.5;

    // ── State machine ──
    switch (_state) {
      case STATE_HIPFIRE:
        _currentFOV += (HIPFIRE_FOV - _currentFOV) * Math.min(1, delta * 15);
        _camera.fov = _currentFOV;
        _camera.updateProjectionMatrix();
        break;

      case STATE_TRANSITIONING_IN:
        _transTimer += delta;
        _updateFOV(delta);
        if (_transTimer >= _transDuration) {
          _state = STATE_ADS;
          _currentFOV = _adsFOV();
          _camera.fov = _currentFOV;
          _camera.updateProjectionMatrix();
          _applyADSHUD();
          _setADSGlobals(true);
        }
        break;

      case STATE_ADS:
        // Hold at ADS FOV
        if (_camera.fov !== _adsFOV()) {
          _camera.fov = _adsFOV();
          _camera.updateProjectionMatrix();
        }
        _applyScopeSway(delta);
        _updateBreathControl(delta, null);
        _updateLensFlare(delta);
        break;

      case STATE_TRANSITIONING_OUT:
        _transTimer += delta;
        _updateFOV(delta);
        if (_transTimer >= _transDuration) {
          _state = STATE_HIPFIRE;
          _currentFOV = HIPFIRE_FOV;
          _camera.fov = _currentFOV;
          _camera.updateProjectionMatrix();
          _clearADSGlobals();
          _restoreHipfireHUD();
        }
        break;
    }
  }

  /* ── Space key listener for breath control ──────────────────────────
   *   We maintain our own keydown/up listeners so the breath state is
   *   accurate even if game-manager's keys object is not exposed. */
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space') window._adsBreathKeyHeld = true;
    });
    document.addEventListener('keyup', function (e) {
      if (e.code === 'Space') window._adsBreathKeyHeld = false;
    });
  }

  /* ── Expose public API ───────────────────────────────────────────── */
  return {
    init:           init,
    startADS:       startADS,
    stopADS:        stopADS,
    isADS:          isADS,
    update:         update,
    onWeaponChange: onWeaponChange
  };

}());
