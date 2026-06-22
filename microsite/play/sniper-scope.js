/**
 * sniper-scope.js — Enhanced Sniper Scope System
 * Ukraine-conflict FPS (Three.js browser game)
 *
 * Replaces the basic ADS view for sniper rifles with a premium
 * full-screen scope overlay featuring mil-dot reticle, range estimation,
 * ballistic drop indicator, breath control, and wind indicator.
 *
 * IIFE pattern, all var (never let/const).
 * Exports: window.SniperScope
 *
 * Depends on: window.Weapons, window.Enemies, window.AdsSystem (optional)
 */
window.SniperScope = (function () {

  /* ── Sniper weapon type list ─────────────────────────────────────── */
  var SNIPER_TYPES = { SNIPER: true, AMR: true };

  /* Weapon IDs that are snipers regardless of type field */
  var SNIPER_IDS = { SVD: true, BARRETTM82: true, AXMC: true, AIAX: true, PSG1: true };

  /* Strings that identify a sniper if found in type or id */
  var SNIPER_SUBSTRINGS = ['SNIPER', 'SVD', 'AXMC', 'BARRETT', 'PSG', 'AMR'];

  /* ── FOV constants ───────────────────────────────────────────────── */
  var SCOPE_FOV   = 15;   /* 6× zoom */
  var HIPFIRE_FOV = 75;

  /* ── Sway constants ──────────────────────────────────────────────── */
  var SWAY_AMP_X        = 2;      /* pixels */
  var SWAY_AMP_Y        = 1.5;    /* pixels */
  var SWAY_FREQ_X       = 0.001;  /* rad/ms  */
  var SWAY_FREQ_Y       = 0.0013; /* rad/ms  */
  var BREATH_SWAY_MULT  = 0.1;    /* held-breath sway reduction */
  var BREATH_MAX_HOLD   = 3.0;    /* seconds before sway grows back */

  /* ── Wind constants ──────────────────────────────────────────────── */
  var WIND_CHANGE_MIN   = 15000;  /* ms minimum between direction changes */
  var WIND_CHANGE_MAX   = 30000;  /* ms maximum between direction changes */
  var WIND_DIRS = ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'];

  /* ── Ballistic drop threshold ────────────────────────────────────── */
  var DROP_RANGE_THRESHOLD = 150; /* meters — drop visible beyond this */

  /* ── Internal state ──────────────────────────────────────────────── */
  var _active          = false;
  var _camera          = null;

  /* Breath state */
  var _breathHeld      = false;
  var _breathHeldMs    = 0;       /* accumulated ms Space held */
  var _breathKeyDown   = false;

  /* Wind state */
  var _windSpeed       = 0;       /* m/s */
  var _windDirIdx      = 0;       /* index into WIND_DIRS */
  var _windNextChange  = 0;       /* timestamp ms */

  /* Range / drop */
  var _rangeM          = 0;       /* fake metres to nearest visible enemy */
  var _dropPx          = 0;       /* pixels drop offset */

  /* Sway offset applied to reticle wrapper */
  var _swayX           = 0;
  var _swayY           = 0;

  /* DOM references */
  var _overlayEl       = null;
  var _reticleWrapEl   = null;
  var _rangeTextEl     = null;
  var _windTextEl      = null;
  var _dropDotEl       = null;
  var _dropLabelEl     = null;
  var _windCorrEl      = null;

  /* Cached crosshair standard element so we can hide it while scoped */
  var _stdCrosshairEl  = null;

  /* ── Sniper weapon detection ─────────────────────────────────────── */
  function _isSniperWeapon() {
    if (typeof window.Weapons === 'undefined' || typeof window.Weapons.getCurrent !== 'function') {
      return false;
    }
    var w = window.Weapons.getCurrent();
    if (!w) return false;

    /* Check by type map */
    if (w.type && SNIPER_TYPES[w.type]) return true;

    /* Check by id map */
    if (w.id && SNIPER_IDS[w.id]) return true;

    /* Substring check on type and id */
    var i;
    for (i = 0; i < SNIPER_SUBSTRINGS.length; i++) {
      if (w.type && w.type.indexOf(SNIPER_SUBSTRINGS[i]) !== -1) return true;
      if (w.id   && w.id.indexOf(SNIPER_SUBSTRINGS[i])   !== -1) return true;
    }
    return false;
  }

  /* ── DOM Construction ────────────────────────────────────────────── */
  function _buildOverlay() {
    var old = document.getElementById('sniperScopeOverlay');
    if (old) old.parentNode.removeChild(old);

    var el = document.createElement('div');
    el.id = 'sniperScopeOverlay';

    el.innerHTML = [
      '<style>',

      /* Full-screen scope vignette — transparent centre, black border */
      '#sniperScopeOverlay {',
      '  display:none;',
      '  position:fixed;',
      '  top:0;left:0;right:0;bottom:0;',
      '  z-index:500;',
      '  pointer-events:none;',
      '  overflow:hidden;',
      '  background:radial-gradient(circle at 50% 50%, transparent 35%, black 36%);',
      '}',

      /* Sharp ring boundary around scope circle */
      '#sniperScopeOverlay .snsc-ring {',
      '  position:absolute;',
      '  top:50%;left:50%;',
      '  transform:translate(-50%,-50%);',
      '  width:70vmin;height:70vmin;',
      '  border-radius:50%;',
      '  border:3px solid rgba(0,0,0,0.95);',
      '  box-shadow:0 0 0 200vmax rgba(0,0,0,0.96);',
      '}',

      /* Reticle wrapper — sway is applied to this via inline transform */
      '#sniperScopeOverlay .snsc-reticle-wrap {',
      '  position:absolute;',
      '  top:50%;left:50%;',
      '  transform:translate(-50%,-50%);',
      '  width:70vmin;height:70vmin;',
      '}',

      /* SVG crosshair */
      '#sniperScopeOverlay .snsc-svg {',
      '  position:absolute;',
      '  top:0;left:0;',
      '  width:100%;height:100%;',
      '}',

      /* HUD info area — top-right inside scope */
      '#sniperScopeOverlay .snsc-hud {',
      '  position:absolute;',
      '  top:50%;left:50%;',
      '  margin-top:calc(-35vmin + 12px);',
      '  margin-left:calc(2vmin);',
      '  font-family:monospace;',
      '  font-size:11px;',
      '  color:#c8ddc8;',
      '  letter-spacing:1px;',
      '  line-height:1.6;',
      '  text-shadow:0 0 4px #000, 0 1px 2px #000;',
      '  white-space:nowrap;',
      '}',

      /* Ballistic drop dot */
      '#sniperScopeOverlay .snsc-drop-dot {',
      '  display:none;',
      '  position:absolute;',
      '  top:50%;left:50%;',
      '  width:8px;height:8px;',
      '  border-radius:50%;',
      '  background:#f44;',
      '  border:1px solid #faa;',
      '  transform:translate(-50%,-50%);',
      '}',

      /* "AIM HERE" drop label */
      '#sniperScopeOverlay .snsc-drop-label {',
      '  display:none;',
      '  position:absolute;',
      '  left:50%;',
      '  font-family:monospace;',
      '  font-size:9px;',
      '  color:#f44;',
      '  text-shadow:0 0 3px #000;',
      '  transform:translateX(8px);',
      '  white-space:nowrap;',
      '}',

      /* Wind correction arrow */
      '#sniperScopeOverlay .snsc-wind-corr {',
      '  display:none;',
      '  position:absolute;',
      '  top:50%;left:50%;',
      '  transform:translate(-50%,-50%);',
      '  font-size:18px;',
      '  color:rgba(255,200,80,0.85);',
      '  text-shadow:0 0 5px #000;',
      '}',

      /* Scope label badge */
      '#sniperScopeOverlay .snsc-badge {',
      '  position:absolute;',
      '  top:50%;left:50%;',
      '  margin-top:calc(-35vmin + 12px);',
      '  margin-left:calc(-35vmin);',
      '  font-family:monospace;',
      '  font-size:10px;',
      '  color:rgba(150,180,150,0.7);',
      '  letter-spacing:2px;',
      '  text-shadow:0 0 4px #000;',
      '  white-space:nowrap;',
      '}',

      '</style>',

      /* Black border ring */
      '<div class="snsc-ring"></div>',

      /* Reticle wrapper (sway applied here) */
      '<div class="snsc-reticle-wrap" id="snscReticleWrap">',

        /* SVG crosshair + mil-dots + BDC stadia */
        '<svg class="snsc-svg" viewBox="0 0 700 700" xmlns="http://www.w3.org/2000/svg">',

          /* Vertical crosshair line */
          '<line x1="350" y1="0" x2="350" y2="700"',
          '  stroke="rgba(0,0,0,0.88)" stroke-width="1.2"/>',

          /* Horizontal crosshair line */
          '<line x1="0" y1="350" x2="700" y2="350"',
          '  stroke="rgba(0,0,0,0.88)" stroke-width="1.2"/>',

          /* ── Horizontal mil-dot marks: 5 each side, 58px spacing ── */
          /* Left arm */
          '<circle cx="292" cy="350" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="234" cy="350" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="176" cy="350" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="118" cy="350" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="60"  cy="350" r="3.5" fill="rgba(0,0,0,0.85)"/>',

          /* Right arm */
          '<circle cx="408" cy="350" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="466" cy="350" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="524" cy="350" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="582" cy="350" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="640" cy="350" r="3.5" fill="rgba(0,0,0,0.85)"/>',

          /* ── Vertical mil-dot marks: 5 each side ── */
          /* Upper arm */
          '<circle cx="350" cy="292" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="350" cy="234" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="350" cy="176" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="350" cy="118" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="350" cy="60"  r="3.5" fill="rgba(0,0,0,0.85)"/>',

          /* Lower arm */
          '<circle cx="350" cy="408" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="350" cy="466" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="350" cy="524" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="350" cy="582" r="3.5" fill="rgba(0,0,0,0.85)"/>',
          '<circle cx="350" cy="640" r="3.5" fill="rgba(0,0,0,0.85)"/>',

          /* ── Range stadia — BDC hash marks below centre ── */
          /* 100m hash */
          '<line x1="338" y1="408" x2="362" y2="408"',
          '  stroke="rgba(0,0,0,0.80)" stroke-width="1.2"/>',
          '<text x="367" y="412" font-family="monospace" font-size="13"',
          '  fill="rgba(0,0,0,0.70)">100</text>',

          /* 200m hash */
          '<line x1="335" y1="466" x2="365" y2="466"',
          '  stroke="rgba(0,0,0,0.80)" stroke-width="1.2"/>',
          '<text x="370" y="470" font-family="monospace" font-size="13"',
          '  fill="rgba(0,0,0,0.70)">200</text>',

          /* 300m hash */
          '<line x1="332" y1="524" x2="368" y2="524"',
          '  stroke="rgba(0,0,0,0.80)" stroke-width="1.2"/>',
          '<text x="373" y="528" font-family="monospace" font-size="13"',
          '  fill="rgba(0,0,0,0.70)">300</text>',

          /* Centre dot */
          '<circle cx="350" cy="350" r="2.5" fill="rgba(0,0,0,0.92)"/>',

        '</svg>',

        /* Ballistic drop dot (shown when range > 150m) */
        '<div class="snsc-drop-dot" id="snscDropDot"></div>',
        '<div class="snsc-drop-label" id="snscDropLabel">AIM HERE</div>',

        /* Wind correction arrow (shown at high wind) */
        '<div class="snsc-wind-corr" id="snscWindCorr"></div>',

      '</div>',  /* end snsc-reticle-wrap */

      /* HUD: range + wind text */
      '<div class="snsc-hud">',
        '<div id="snscRangeText">RANGE: ---m</div>',
        '<div id="snscWindText">WIND: -- m/s --</div>',
      '</div>',

      /* Scope badge bottom-left */
      '<div class="snsc-badge">6&times; SNIPER</div>'

    ].join('');

    document.body.appendChild(el);
    return el;
  }

  /* ── Wind helpers ────────────────────────────────────────────────── */
  function _initWind() {
    _windSpeed   = Math.round(Math.random() * 8);
    _windDirIdx  = Math.floor(Math.random() * WIND_DIRS.length);
    _windNextChange = Date.now() + WIND_CHANGE_MIN +
                     Math.random() * (WIND_CHANGE_MAX - WIND_CHANGE_MIN);
  }

  function _tickWind() {
    var now = Date.now();
    if (now >= _windNextChange) {
      _windSpeed  = Math.round(Math.random() * 8);
      _windDirIdx = Math.floor(Math.random() * WIND_DIRS.length);
      _windNextChange = now + WIND_CHANGE_MIN +
                        Math.random() * (WIND_CHANGE_MAX - WIND_CHANGE_MIN);
    }
  }

  /* ── Range estimation ────────────────────────────────────────────── */
  function _updateRange() {
    _rangeM = 0;

    if (typeof window.Enemies === 'undefined' ||
        typeof window.Enemies.getAll !== 'function' ||
        !_camera) {
      return;
    }

    var enemies = window.Enemies.getAll();
    if (!enemies || !enemies.length) return;

    /* Project each enemy to NDC, pick closest to screen centre */
    var projVec = new THREE.Vector3();
    var halfW = window.innerWidth  / 2;
    var halfH = window.innerHeight / 2;
    var bestScreenDist = Infinity;
    var bestWorldDist  = Infinity;

    var i, e, screenDX, screenDY, screenDist;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e || !e.mesh || !e.alive) continue;

      projVec.copy(e.mesh.position);
      projVec.project(_camera);

      /* projVec.z > 1 means behind camera */
      if (projVec.z > 1) continue;

      screenDX = projVec.x * halfW;
      screenDY = projVec.y * halfH;
      screenDist = screenDX * screenDX + screenDY * screenDY;

      if (screenDist < bestScreenDist) {
        bestScreenDist = screenDist;
        bestWorldDist  = _camera.position.distanceTo(e.mesh.position);
      }
    }

    if (bestWorldDist !== Infinity) {
      _rangeM = Math.round(bestWorldDist * 4.7);
    }
  }

  /* ── Sway calculation ────────────────────────────────────────────── */
  function _calcSway() {
    var t = Date.now();
    var rawX = Math.sin(t * SWAY_FREQ_X) * SWAY_AMP_X;
    var rawY = Math.cos(t * SWAY_FREQ_Y) * SWAY_AMP_Y;

    var mult = 1.0;
    if (_breathKeyDown) {
      if (_breathHeldMs < BREATH_MAX_HOLD * 1000) {
        mult = BREATH_SWAY_MULT;
      } else {
        /* Over-held — sway grows back proportionally */
        var overMs = _breathHeldMs - BREATH_MAX_HOLD * 1000;
        mult = BREATH_SWAY_MULT + (1.0 - BREATH_SWAY_MULT) *
               Math.min(overMs / 2000, 1.0);
      }
    }

    _swayX = rawX * mult;
    _swayY = rawY * mult;
  }

  /* ── DOM update each frame ───────────────────────────────────────── */
  function _updateDOM() {
    if (!_overlayEl) return;

    /* Apply sway to reticle wrapper */
    if (_reticleWrapEl) {
      _reticleWrapEl.style.transform =
        'translate(calc(-50% + ' + _swayX.toFixed(1) + 'px),' +
        'calc(-50% + ' + _swayY.toFixed(1) + 'px))';
    }

    /* Range display */
    if (_rangeTextEl) {
      _rangeTextEl.textContent = _rangeM > 0
        ? 'RANGE: ' + _rangeM + 'm'
        : 'RANGE: ---m';
    }

    /* Wind display */
    if (_windTextEl) {
      _windTextEl.textContent = 'WIND: ' + _windSpeed + ' m/s ' + WIND_DIRS[_windDirIdx];
    }

    /* Ballistic drop indicator */
    _dropPx = 0;
    if (_rangeM > DROP_RANGE_THRESHOLD) {
      _dropPx = (_rangeM - DROP_RANGE_THRESHOLD) * 0.8;
    }

    if (_dropDotEl && _dropLabelEl) {
      if (_dropPx > 0) {
        _dropDotEl.style.display = 'block';
        _dropDotEl.style.marginTop = _dropPx + 'px';
        _dropLabelEl.style.display = 'block';
        _dropLabelEl.style.top = 'calc(50% + ' + _dropPx + 'px)';
      } else {
        _dropDotEl.style.display = 'none';
        _dropLabelEl.style.display = 'none';
      }
    }

    /* Wind correction arrow: show when wind >= 4 m/s */
    if (_windCorrEl) {
      if (_windSpeed >= 4) {
        _windCorrEl.style.display = 'block';
        /* Opposite direction to compensate */
        var oppIdx = (_windDirIdx + 4) % WIND_DIRS.length;
        _windCorrEl.textContent = WIND_DIRS[oppIdx];
        /* Offset correction arrow opposite to wind */
        var corrPx = _windSpeed * 2;
        /* Map cardinal direction to x/y offset */
        var corrX = 0, corrY = 0;
        var d = _windDirIdx;
        if (d === 0) { corrX = -corrPx; }            /* → aim left  */
        else if (d === 1) { corrX = -corrPx; corrY = corrPx; }  /* ↗ */
        else if (d === 2) { corrY = corrPx; }         /* ↑ aim down  */
        else if (d === 3) { corrX = corrPx; corrY = corrPx; }   /* ↖ */
        else if (d === 4) { corrX = corrPx; }         /* ← aim right */
        else if (d === 5) { corrX = corrPx; corrY = -corrPx; }  /* ↙ */
        else if (d === 6) { corrY = -corrPx; }        /* ↓ aim up    */
        else              { corrX = -corrPx; corrY = -corrPx; } /* ↘ */
        _windCorrEl.style.transform =
          'translate(calc(-50% + ' + corrX + 'px), calc(-50% + ' + corrY + 'px))';
      } else {
        _windCorrEl.style.display = 'none';
      }
    }
  }

  /* ── Show/hide standard crosshair ───────────────────────────────── */
  function _hideCrosshair() {
    _stdCrosshairEl = _stdCrosshairEl ||
      document.getElementById('crosshair') ||
      document.getElementById('adsReticle') ||
      document.getElementById('scopeOverlay');
    if (_stdCrosshairEl) _stdCrosshairEl.style.display = 'none';
  }

  function _restoreCrosshair() {
    /* We leave the crosshair hidden-state restoration to ADSSystem */
  }

  /* ── FOV helpers ─────────────────────────────────────────────────── */
  function _applyScopeFOV() {
    window._scopeFOV = SCOPE_FOV;
    if (_camera) {
      _camera.fov = SCOPE_FOV;
      _camera.updateProjectionMatrix();
    }
    /* Override ADS system FOV for sniper */
    if (window.AdsSystem && typeof window.AdsSystem.startADS === 'function') {
      /* AdsSystem already triggered; we take control of FOV via camera directly */
    }
  }

  function _restoreFOV() {
    window._scopeFOV = HIPFIRE_FOV;
    if (_camera) {
      _camera.fov = HIPFIRE_FOV;
      _camera.updateProjectionMatrix();
    }
  }

  /* ── Public: init ────────────────────────────────────────────────── */
  function init(scene, camera) {
    _camera = camera || _camera;

    if (typeof document === 'undefined') return;

    _overlayEl      = _buildOverlay();
    _reticleWrapEl  = document.getElementById('snscReticleWrap');
    _rangeTextEl    = document.getElementById('snscRangeText');
    _windTextEl     = document.getElementById('snscWindText');
    _dropDotEl      = document.getElementById('snscDropDot');
    _dropLabelEl    = document.getElementById('snscDropLabel');
    _windCorrEl     = document.getElementById('snscWindCorr');

    _initWind();

    /* Keyboard listeners for breath control */
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space') {
        _breathKeyDown = true;
        window._breathControl = true;
      }
    });
    document.addEventListener('keyup', function (e) {
      if (e.code === 'Space') {
        _breathKeyDown = false;
        _breathHeldMs  = 0;
        window._breathControl = false;
      }
    });

    console.log('[SniperScope] initialized');
  }

  /* ── Public: activate ────────────────────────────────────────────── */
  function activate(camera) {
    if (_active) return;
    if (camera) _camera = camera;

    _active = true;
    window._scopeFOV = SCOPE_FOV;

    _applyScopeFOV();

    if (_overlayEl) _overlayEl.style.display = 'block';
    _hideCrosshair();

    /* Reset breath timer */
    _breathHeldMs = 0;

    console.log('[SniperScope] activated');
  }

  /* ── Public: deactivate ──────────────────────────────────────────── */
  function deactivate() {
    if (!_active) return;
    _active = false;

    _restoreFOV();

    if (_overlayEl) _overlayEl.style.display = 'none';
    _restoreCrosshair();

    window._breathControl = false;
    _breathKeyDown = false;
    _breathHeldMs  = 0;

    console.log('[SniperScope] deactivated');
  }

  /* ── Public: update (call every frame with delta in seconds) ─────── */
  function update(delta) {
    if (!_active) return;

    /* Breath timer accumulation */
    if (_breathKeyDown) {
      _breathHeldMs += (delta || 0) * 1000;
    }

    /* Wind cycle */
    _tickWind();

    /* Range estimation */
    _updateRange();

    /* Sway */
    _calcSway();

    /* Update DOM */
    _updateDOM();
  }

  /* ── Public: isActive ────────────────────────────────────────────── */
  function isActive() {
    return _active;
  }

  /* ── Public: isSniperWeapon (exposed for ADS integration) ───────── */
  function isSniperWeapon() {
    return _isSniperWeapon();
  }

  /* ── Expose public API ───────────────────────────────────────────── */
  return {
    init:           init,
    activate:       activate,
    deactivate:     deactivate,
    update:         update,
    isActive:       isActive,
    isSniperWeapon: isSniperWeapon
  };

}());
