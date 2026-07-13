/* ============================================================
 *  SLIDE-SYSTEM.JS — Slide + Prone movement mechanics
 *  Ctrl+Sprint = Slide, Double-Ctrl = Prone
 *  All var, IIFE pattern
 * ============================================================ */
window.SlideSystem = (function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────
  var CFG = {
    SLIDE_DURATION: 0.8,          // seconds
    SLIDE_SPEED_MULT: 1.5,        // speed multiplier during slide
    SLIDE_DISTANCE: 5,            // units of forward travel
    SLIDE_CAM_LOW: 0.4,           // camera height during slide
    SLIDE_CAM_LOWER_TIME: 0.3,    // seconds to lower camera
    SLIDE_CAM_CROUCH: 0.8,        // camera height at end of slide (crouch)
    SLIDE_CAM_STAND: 1.6,         // normal standing camera height
    SLIDE_COOLDOWN: 2.0,          // seconds between slides
    SLIDE_FOV_BOOST: 8,           // extra FOV delta during slide
    SLIDE_TILT: 5,                // camera tilt degrees

    PRONE_CAM_HEIGHT: 0.2,        // camera height while prone
    PRONE_SPEED_MULT: 0.4,        // movement speed while prone
    PRONE_ACCURACY_BONUS: 0.3,    // accuracy bonus while prone
    PRONE_PLAYER_HEIGHT: 0.3,     // hitbox height while prone
    PRONE_STAND_TIME: 0.5,        // seconds to stand from prone

    DOUBLE_CTRL_WINDOW: 0.3       // seconds for double-tap detection
  };

  // ── State ───────────────────────────────────────────────────
  var state = {
    stance: 'STANDING',           // STANDING / CROUCHING / SLIDING / PRONE
    slideTimer: 0,
    slideCooldown: 0,
    slideDir: 0,                  // direction multiplier for tilt
    standFromProneTimer: 0,
    isStandingFromProne: false,

    // Double-Ctrl detection
    lastCtrlTime: 0,
    ctrlTapCount: 0,

    // HUD element ref
    hudEl: null,
    speedLinesEl: null
  };

  // ── Global flag initialisation ──────────────────────────────
  function _initGlobals() {
    window._sliding = false;
    window._prone = false;
    window._playerStance = 'STANDING';
    window._proneAccuracyBonus = 0;
    window._playerHeight = 1.8;
    window._sprintFOVDelta = window._sprintFOVDelta || 0;
    window._cameraTiltDelta = window._cameraTiltDelta || 0;
  }

  // ── HUD: stance indicator ───────────────────────────────────
  function _createHUD() {
    if (state.hudEl) return;
    var el = document.createElement('div');
    el.id = 'stance-indicator';
    el.style.cssText = [
      'position:fixed',
      'bottom:14px',
      'right:160px',
      'z-index:202',
      'pointer-events:none',
      'font-family:monospace',
      'font-size:10px',
      'color:#aaa',
      'background:rgba(0,0,0,0.45)',
      'padding:2px 7px',
      'border-radius:3px',
      'border:1px solid rgba(255,255,255,0.12)',
      'letter-spacing:1px',
      'white-space:nowrap'
    ].join(';');
    el.textContent = '🚶 STANDING';
    document.body.appendChild(el);
    state.hudEl = el;
  }

  function _updateHUD() {
    if (!state.hudEl) return;
    var icons = {
      'STANDING':  '🚶 STANDING',
      'CROUCHING': '🧘 CROUCHING',
      'SLIDING':   '➡ SLIDING',
      'PRONE':     '😑 PRONE'
    };
    state.hudEl.textContent = icons[state.stance] || state.stance;
  }

  // ── Speed-lines overlay ──────────────────────────────────────
  function _createSpeedLines() {
    if (state.speedLinesEl) return;
    var el = document.createElement('div');
    el.id = 'slideSpeedLines';
    el.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'bottom:0',
      'z-index:196',
      'pointer-events:none',
      'opacity:0',
      'background:radial-gradient(ellipse at center,',
        'transparent 30%,',
        'rgba(0,180,255,0.06) 55%,',
        'rgba(0,120,255,0.14) 75%,',
        'rgba(0,80,200,0.22) 100%)',
      'transition:opacity 0.1s'
    ].join('');
    document.body.appendChild(el);
    state.speedLinesEl = el;
  }

  function _showSpeedLines(on) {
    if (!state.speedLinesEl) return;
    state.speedLinesEl.style.opacity = on ? '1' : '0';
  }

  // ── Slide begin ──────────────────────────────────────────────
  function trySlide(player) {
    if (state.stance === 'SLIDING') return false;
    if (state.slideCooldown > 0) return false;
    if (!window._sprinting) return false;   // must be sprinting (Shift held)

    state.stance = 'SLIDING';
    state.slideTimer = CFG.SLIDE_DURATION;
    state.slideDir = 1;

    window._sliding = true;
    window._playerStance = 'SLIDING';
    window._sprintFOVDelta = (window._sprintFOVDelta || 0) + CFG.SLIDE_FOV_BOOST;
    window._cameraTiltDelta = CFG.SLIDE_TILT * state.slideDir;

    _showSpeedLines(true);

    // Update existing slide indicator if present
    var si = document.getElementById('slide-indicator');
    if (si) si.style.display = 'block';

    if (typeof window._onSlideStart === 'function') {
      window._onSlideStart();
    }

    _updateHUD();
    return true;
  }

  // ── Prone begin / end ────────────────────────────────────────
  function tryProne(player) {
    if (state.stance === 'PRONE') {
      // Stand from prone
      _standFromProne();
      return true;
    }
    if (state.stance === 'SLIDING') return false; // can't prone mid-slide

    state.stance = 'PRONE';
    window._prone = true;
    window._playerStance = 'PRONE';
    window._proneAccuracyBonus = CFG.PRONE_ACCURACY_BONUS;
    window._playerHeight = CFG.PRONE_PLAYER_HEIGHT;
    window._sliding = false;

    // Show prone indicator
    var pi = document.getElementById('prone-indicator');
    if (pi) pi.style.display = 'block';

    if (typeof window._onProneToggle === 'function') {
      window._onProneToggle(true);
    }

    _updateHUD();
    return true;
  }

  function _standFromProne() {
    state.isStandingFromProne = true;
    state.standFromProneTimer = CFG.PRONE_STAND_TIME;
  }

  function _finishStandFromProne() {
    state.isStandingFromProne = false;
    state.stance = 'STANDING';
    window._prone = false;
    window._playerStance = 'STANDING';
    window._proneAccuracyBonus = 0;
    window._playerHeight = 1.8;

    var pi = document.getElementById('prone-indicator');
    if (pi) pi.style.display = 'none';

    if (typeof window._onProneToggle === 'function') {
      window._onProneToggle(false);
    }

    _updateHUD();
  }

  // ── Crouch→Stand via Ctrl ────────────────────────────────────
  function _standFromCrouch() {
    state.stance = 'STANDING';
    window._playerStance = 'STANDING';
    window._playerHeight = 1.8;
    _updateHUD();
  }

  // ── Slide update (per frame) ─────────────────────────────────
  function _tickSlide(delta, player) {
    state.slideTimer -= delta;

    // Lower camera
    if (player && player.camera) {
      var elapsed = CFG.SLIDE_DURATION - state.slideTimer;
      if (elapsed < CFG.SLIDE_CAM_LOWER_TIME) {
        var t = elapsed / CFG.SLIDE_CAM_LOWER_TIME;
        player.camera.position.y = CFG.SLIDE_CAM_STAND + t * (CFG.SLIDE_CAM_LOW - CFG.SLIDE_CAM_STAND);
      } else {
        player.camera.position.y = CFG.SLIDE_CAM_LOW;
      }
    }

    // Move player forward during slide
    if (player && player.velocity) {
      var fwd = CFG.SLIDE_DISTANCE * CFG.SLIDE_SPEED_MULT * delta;
      if (player.velocity.z !== undefined) {
        player.velocity.z -= fwd;    // negative Z = forward in Three.js camera space
      }
    }

    if (state.slideTimer <= 0) {
      _endSlide(player);
    }
  }

  function _endSlide(player) {
    state.slideTimer = 0;
    state.slideCooldown = CFG.SLIDE_COOLDOWN;
    state.stance = 'CROUCHING';
    window._sliding = false;
    window._playerStance = 'CROUCHING';

    // Remove FOV boost
    window._sprintFOVDelta = Math.max(0, (window._sprintFOVDelta || 0) - CFG.SLIDE_FOV_BOOST);
    window._cameraTiltDelta = 0;

    _showSpeedLines(false);

    // Set camera to crouch height
    if (player && player.camera) {
      player.camera.position.y = CFG.SLIDE_CAM_CROUCH;
    }

    // Hide slide indicator
    var si = document.getElementById('slide-indicator');
    if (si) si.style.display = 'none';

    _updateHUD();
  }

  // ── Prone-stand animation tick ───────────────────────────────
  function _tickProneStand(delta, player) {
    state.standFromProneTimer -= delta;
    // Animate camera rising from prone height to stand height
    if (player && player.camera) {
      var t = 1 - (state.standFromProneTimer / CFG.PRONE_STAND_TIME);
      t = Math.max(0, Math.min(1, t));
      player.camera.position.y = CFG.PRONE_CAM_HEIGHT + t * (CFG.SLIDE_CAM_STAND - CFG.PRONE_CAM_HEIGHT);
    }
    if (state.standFromProneTimer <= 0) {
      _finishStandFromProne();
      if (player && player.camera) {
        player.camera.position.y = CFG.SLIDE_CAM_STAND;
      }
    }
  }

  // ── Cooldown tick ────────────────────────────────────────────
  function _tickCooldowns(delta) {
    if (state.slideCooldown > 0) {
      state.slideCooldown -= delta;
      if (state.slideCooldown < 0) state.slideCooldown = 0;
    }
  }

  // ── Camera height during prone ────────────────────────────────
  function _applyProneCamera(player) {
    if (player && player.camera) {
      player.camera.position.y = CFG.PRONE_CAM_HEIGHT;
    }
  }

  // ── Speed multiplier ──────────────────────────────────────────
  function _applySpeedMultiplier() {
    if (state.stance === 'PRONE') {
      window._proneSpeedMult = CFG.PRONE_SPEED_MULT;
    } else {
      window._proneSpeedMult = 1;
    }
  }

  // ── Keydown listener for double-Ctrl + Ctrl actions ──────────
  function _onKeyDown(e) {
    var key = e.key;

    if (key === 'Control') {
      var now = performance.now ? performance.now() / 1000 : Date.now() / 1000;
      var gap = now - state.lastCtrlTime;

      if (gap < CFG.DOUBLE_CTRL_WINDOW && state.ctrlTapCount >= 1) {
        // Double-tap: enter/exit prone
        state.ctrlTapCount = 0;
        state.lastCtrlTime = 0;
        tryProne(null);
      } else {
        state.ctrlTapCount = 1;
        state.lastCtrlTime = now;

        // Single Ctrl: context-sensitive
        if (state.stance === 'SLIDING') {
          // ignore Ctrl while sliding
        } else if (state.stance === 'PRONE' || state.isStandingFromProne) {
          // handled on second tap
        } else if (state.stance === 'CROUCHING') {
          _standFromCrouch();
        } else if (state.stance === 'STANDING') {
          // try slide if sprinting, else nothing
          trySlide(null);
        }
      }
    }

    if (key === ' ' || key === 'Spacebar') {
      // Space: stand from prone
      if (state.stance === 'PRONE' && !state.isStandingFromProne) {
        _standFromProne();
      }
    }
  }

  // ── Public: update (called every frame) ─────────────────────
  function update(delta, player) {
    _tickCooldowns(delta);

    if (state.stance === 'SLIDING') {
      _tickSlide(delta, player);
    }

    if (state.isStandingFromProne) {
      _tickProneStand(delta, player);
    }

    if (state.stance === 'PRONE' && !state.isStandingFromProne) {
      _applyProneCamera(player);
    }

    _applySpeedMultiplier();
  }

  // ── Public: getState ─────────────────────────────────────────
  function getState() {
    return {
      stance: state.stance,
      sliding: window._sliding,
      prone: window._prone,
      slideCooldown: state.slideCooldown,
      slideTimer: state.slideTimer
    };
  }

  function isSliding() { return state.stance === 'SLIDING'; }
  function isProne()   { return state.stance === 'PRONE'; }

  // ── Public: reset ────────────────────────────────────────────
  function reset() {
    state.stance = 'STANDING';
    state.slideTimer = 0;
    state.slideCooldown = 0;
    state.slideDir = 0;
    state.standFromProneTimer = 0;
    state.isStandingFromProne = false;
    state.lastCtrlTime = 0;
    state.ctrlTapCount = 0;
    _initGlobals();
    _showSpeedLines(false);
    _updateHUD();
  }

  // ── Public: init ─────────────────────────────────────────────
  function init() {
    _initGlobals();
    _createHUD();
    _createSpeedLines();
    document.addEventListener('keydown', _onKeyDown);
    _updateHUD();
    if (typeof window !== 'undefined' && (window.__QA_MODE || window.__DEBUG_SLIDE)) {
      console.log('[SlideSystem] Initialized');
    }
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    init: init,
    update: update,
    trySlide: trySlide,
    tryProne: tryProne,
    getState: getState,
    isSliding: isSliding,
    isProne: isProne,
    reset: reset
  };
})();
