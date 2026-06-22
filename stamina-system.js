/* stamina-system.js — Player sprint stamina with HUD bar, visual effects, and breathing */
window.StaminaSystem = (function () {

  /* ── Constants ─────────────────────────────────────────────────────── */
  var MAX_STAMINA      = 100;
  var DRAIN_RATE       = 20;   // per second while sprinting
  var REGEN_RATE       = 12;   // per second while not sprinting
  var MIN_TO_SPRINT    = 5;    // cannot start sprinting below this

  /* ── State ─────────────────────────────────────────────────────────── */
  var _stamina         = MAX_STAMINA;
  var _wantSprint      = false;   // player is holding Shift
  var _sprinting       = false;   // actually sprinting right now
  var _exhausted       = false;   // became exhausted this cycle

  /* ── DOM refs ──────────────────────────────────────────────────────── */
  var _barWrap         = null;   // outer container
  var _barFill         = null;   // inner fill element
  var _vignette        = null;   // sprint edge vignette overlay
  var _breathVignette  = null;   // exhaustion pulse vignette
  var _breathOsc       = null;   // Web Audio oscillator for breathing
  var _breathGain      = null;   // gain node for breathing
  var _breathGainNode  = null;   // master gain

  /* ── Breathing state ───────────────────────────────────────────────── */
  var _breathTimer     = 0;
  var _breathPhase     = 0;      // 0..1 within one 1.2s period
  var _barFlash        = false;
  var _barFlashTimer   = 0;

  /* ── Helpers ───────────────────────────────────────────────────────── */
  function _pct() {
    return _stamina / MAX_STAMINA;
  }

  function _canSprint() {
    if (_stamina < MIN_TO_SPRINT) return false;
    if (window.CrouchSystem && CrouchSystem.isCrouching && CrouchSystem.isCrouching()) return false;
    if (window.player && window.player.prone) return false;
    return true;
  }

  /* ── HUD bar creation ──────────────────────────────────────────────── */
  function _createHUD() {
    if (document.getElementById('staminaBar')) {
      _barWrap = document.getElementById('staminaBar');
      _barFill = _barWrap.querySelector('.stamina-fill');
      return;
    }

    _barWrap = document.createElement('div');
    _barWrap.id = 'staminaBar';
    _barWrap.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:120px',
      'height:6px',
      'background:rgba(0,0,0,0.45)',
      'border-radius:3px',
      'overflow:hidden',
      'opacity:0',
      'transition:opacity 1s ease',
      'z-index:500',
      'pointer-events:none'
    ].join(';');

    _barFill = document.createElement('div');
    _barFill.className = 'stamina-fill';
    _barFill.style.cssText = [
      'width:100%',
      'height:100%',
      'border-radius:3px',
      'transition:background 0.3s',
      'background:#ffee00'
    ].join(';');

    _barWrap.appendChild(_barFill);
    document.body.appendChild(_barWrap);
  }

  /* ── Sprint vignette overlay ───────────────────────────────────────── */
  function _createVignette() {
    _vignette = document.createElement('div');
    _vignette.id = 'sprintVignette';
    _vignette.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:490',
      'opacity:0',
      'transition:opacity 0.25s',
      'background:radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.15) 100%)'
    ].join(';');
    document.body.appendChild(_vignette);

    _breathVignette = document.createElement('div');
    _breathVignette.id = 'breathVignette';
    _breathVignette.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:491',
      'opacity:0',
      'background:radial-gradient(ellipse at center, transparent 50%, rgba(180,0,0,0.22) 100%)'
    ].join(';');
    document.body.appendChild(_breathVignette);
  }

  /* ── Breathing SFX ─────────────────────────────────────────────────── */
  function _startBreathSFX() {
    if (!window._audioCtx) return;
    if (_breathOsc) return; // already running
    try {
      _breathGainNode = _audioCtx.createGain();
      _breathGainNode.gain.value = 0;
      _breathGainNode.connect(_audioCtx.destination);

      _breathOsc = _audioCtx.createOscillator();
      _breathOsc.type = 'sine';
      _breathOsc.frequency.value = 160;
      _breathOsc.connect(_breathGainNode);
      _breathOsc.start();
    } catch (_e) {
      _breathOsc = null;
      _breathGainNode = null;
    }
  }

  function _stopBreathSFX() {
    if (_breathOsc) {
      try { _breathOsc.stop(); } catch (_e) {}
      _breathOsc = null;
    }
    if (_breathGainNode) {
      try { _breathGainNode.disconnect(); } catch (_e) {}
      _breathGainNode = null;
    }
  }

  /* ── Update bar color ──────────────────────────────────────────────── */
  function _updateBarColor() {
    if (!_barFill) return;
    var p = _pct();
    var color;
    if (p > 0.5) {
      color = '#ffee00'; // yellow
    } else if (p > 0.2) {
      color = '#ff9900'; // orange
    } else {
      color = '#ff2200'; // red
    }
    _barFill.style.background = color;
  }

  /* ── Public API ────────────────────────────────────────────────────── */
  function init() {
    _stamina      = MAX_STAMINA;
    _wantSprint   = false;
    _sprinting    = false;
    _exhausted    = false;
    _breathTimer  = 0;
    _breathPhase  = 0;
    _barFlash     = false;
    _barFlashTimer = 0;

    _createHUD();
    _createVignette();
  }

  function startSprint() {
    _wantSprint = true;
  }

  function stopSprint() {
    _wantSprint = false;
  }

  function isSprinting() {
    return _sprinting;
  }

  function getStaminaPct() {
    return _pct();
  }

  function reset() {
    _stamina      = MAX_STAMINA;
    _wantSprint   = false;
    _sprinting    = false;
    _exhausted    = false;
    _breathTimer  = 0;
    _breathPhase  = 0;
    _barFlash     = false;
    _barFlashTimer = 0;
    _stopBreathSFX();
    if (_barWrap)       _barWrap.style.opacity = '0';
    if (_vignette)      _vignette.style.opacity = '0';
    if (_breathVignette) _breathVignette.style.opacity = '0';
  }

  function update(delta) {
    /* ── Determine if actually sprinting ─────────────────────────────── */
    if (_wantSprint && _canSprint()) {
      _sprinting = true;
    } else if (!_wantSprint || !_canSprint()) {
      _sprinting = false;
    }

    /* ── Stamina drain / regen ───────────────────────────────────────── */
    if (_sprinting) {
      _stamina = Math.max(0, _stamina - DRAIN_RATE * delta);
      if (_stamina <= 0) {
        _sprinting = false;
        _exhausted = true;
      }
    } else {
      _stamina = Math.min(MAX_STAMINA, _stamina + REGEN_RATE * delta);
      if (_stamina >= MIN_TO_SPRINT) {
        _exhausted = false;
      }
    }

    /* ── Expose globals for game-manager ────────────────────────────── */
    window._sprintFOVDelta  = _sprinting ? 8 : 0;
    window._sprintHeadbob  = _sprinting;

    /* ── HUD bar visibility ───────────────────────────────────────────── */
    if (_barWrap) {
      var pct = _pct();
      var showBar = _sprinting || (pct < 0.8);
      _barWrap.style.opacity = showBar ? '1' : '0';

      // Fill width
      _barFill.style.width = (pct * 100) + '%';
      _updateBarColor();

      // Flash red when exhausted (stamina < 20%)
      if (pct < 0.2) {
        _barFlashTimer += delta;
        if (_barFlashTimer > 0.25) {
          _barFlash = !_barFlash;
          _barFlashTimer = 0;
        }
        _barFill.style.opacity = _barFlash ? '0.35' : '1';
      } else {
        _barFill.style.opacity = '1';
        _barFlashTimer = 0;
        _barFlash = false;
      }
    }

    /* ── Sprint vignette ─────────────────────────────────────────────── */
    if (_vignette) {
      _vignette.style.opacity = _sprinting ? '1' : '0';
    }

    /* ── Breathing effects when exhausted (stamina < 20) ────────────── */
    var exhausted = (_stamina < 20);
    if (exhausted) {
      _startBreathSFX();

      // Advance breath phase (1.2s period)
      _breathPhase += delta / 1.2;
      if (_breathPhase >= 1) _breathPhase -= 1;

      // Rhythmic burst: burst on for first 0.35 of period, off for rest
      var inBurst = _breathPhase < 0.35;
      if (_breathGainNode) {
        _breathGainNode.gain.value = inBurst ? 0.06 : 0;
      }

      // Pulse breath vignette in sync
      if (_breathVignette) {
        var vigAmt = inBurst ? (0.35 + 0.65 * Math.sin(_breathPhase / 0.35 * Math.PI)) : 0;
        _breathVignette.style.opacity = String(Math.max(0, Math.min(1, vigAmt)));
      }
    } else {
      if (_breathGainNode) _breathGainNode.gain.value = 0;
      if (_breathVignette) _breathVignette.style.opacity = '0';
      if (!exhausted && _breathOsc) {
        // Stamina recovered — stop SFX
        _stopBreathSFX();
        _breathPhase = 0;
      }
    }
  }

  return {
    init:          init,
    update:        update,
    startSprint:   startSprint,
    stopSprint:    stopSprint,
    isSprinting:   isSprinting,
    getStaminaPct: getStaminaPct,
    reset:         reset
  };

})();
