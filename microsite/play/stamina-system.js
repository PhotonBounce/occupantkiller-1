/**
 * stamina-system.js — Comprehensive Player Stamina & Endurance Management
 * Three.js FPS game
 *
 * Features:
 *   - Stamina pool (100), drain/regen at contextual rates
 *   - HUD bar below crosshair: green→yellow→red, hidden when full
 *   - Exhaustion debuffs: speed reduction, grey-orange vignette, weapon sway
 *   - Adrenaline burst: rare auto-trigger at low stamina
 *   - Environmental drain in smoke/gas clouds
 *   - Energy drink pickups: +40 stamina, BoxGeometry, cyan, 1 per wave
 *   - Stats tracking: distance sprinted, total rolls
 *
 * IIFE pattern, all var (never let/const).
 * Exports: window.StaminaSystem
 */
window.StaminaSystem = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var MAX_STAMINA              = 100;
  var DRAIN_SPRINT             = 20;    // per second while sprinting
  var DRAIN_BREATH_HOLD        = 15;    // per second while holding breath (sniper)
  var DRAIN_SMOKE              = 10;    // per second in gas/smoke cloud
  var DRAIN_MELEE              = 10;    // per strike
  var DRAIN_ROLL               = 20;    // per combat roll
  var REGEN_MOVING             = 15;    // per second when not sprinting but moving
  var REGEN_STILL              = 8;     // per second when standing still
  var MIN_TO_SPRINT            = 5;     // cannot start sprinting below this
  var EXHAUSTION_SPEED_MULT    = 0.5;   // _playerSpeedMult when exhausted
  var EXHAUSTION_WEAPON_SWAY   = 0.4;   // _weaponSwayBonus when exhausted
  var EXHAUSTION_RECOVERY_TIME = 3.0;   // seconds before can sprint again after exhaustion
  var ADRENALINE_THRESHOLD     = 15;    // below this pct triggers possible adrenaline
  var ADRENALINE_CHANCE        = 0.05;  // 5% per second at low stamina
  var ADRENALINE_STAMINA       = 30;    // stamina restored on adrenaline
  var ADRENALINE_SPEED_MULT    = 1.4;   // speed spike during adrenaline
  var ADRENALINE_DURATION      = 3.0;   // seconds
  var ENERGY_DRINK_RESTORE     = 40;    // stamina restored by pickup
  var ENERGY_DRINK_SIZE        = 0.4;   // BoxGeometry half-size
  var ENERGY_DRINK_FLOAT_AMP   = 0.3;   // float bob amplitude
  var ENERGY_DRINK_FLOAT_FREQ  = 1.5;   // float bob Hz
  var ENERGY_DRINK_SPIN        = 1.2;   // spin speed rad/s
  var BAR_WIDTH                = 80;    // px
  var BAR_HEIGHT               = 5;     // px

  /* ── State ──────────────────────────────────────────────────────────────── */
  var _stamina              = MAX_STAMINA;
  var _sprinting            = false;
  var _exhausted            = false;
  var _exhaustionTimer      = 0;        // seconds since exhaustion started
  var _recoveryLock         = false;    // true during 3s recovery period
  var _recoveryTimer        = 0;
  var _adrenalineActive     = false;
  var _adrenalineTimer      = 0;
  var _adrenalineCheckTimer = 0;        // accumulates toward 1s check
  var _barFlash             = false;
  var _barFlashTimer        = 0;
  var _prevSprinting        = false;

  /* ── Sprint tracking for stats ──────────────────────────────────────────── */
  var _sprintDistanceTotal  = 0;        // metres sprinted lifetime
  var _rollsTotal           = 0;        // combat rolls lifetime
  var _sprintSpeedEst       = 8.0;      // estimated m/s sprint speed

  /* ── Energy drink pickups ───────────────────────────────────────────────── */
  var _drinkMeshes          = [];       // THREE.Mesh list
  var _drinkTime            = 0;        // time accumulator for animation

  /* ── DOM refs ───────────────────────────────────────────────────────────── */
  var _barWrap              = null;
  var _barFill              = null;
  var _exhaustedText        = null;
  var _adrenalineText       = null;
  var _exhaustVignette      = null;

  /* ── Audio ──────────────────────────────────────────────────────────────── */
  var _audioCtx             = null;

  /* ══════════════════════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════════════════════ */
  function _pct() {
    return _stamina / MAX_STAMINA;
  }

  function _isMoving() {
    return !!(window._playerMoving || window._playerIsMoving ||
              (window.player && window.player.isMoving));
  }

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_e) {}
    }
    return _audioCtx;
  }

  function _playTone(freq, dur, gain) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var g    = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(gain || 0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur + 0.02);
    } catch (_e) {}
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD CREATION
  ══════════════════════════════════════════════════════════════════════════ */
  function _createHUD() {
    /* Stamina bar wrapper — thin horizontal bar below crosshair */
    if (!document.getElementById('staminaBarWrap')) {
      _barWrap = document.createElement('div');
      _barWrap.id = 'staminaBarWrap';
      _barWrap.style.cssText = [
        'position:fixed',
        'left:50%',
        'top:calc(50% + 24px)',     /* just below crosshair */
        'transform:translateX(-50%)',
        'width:' + BAR_WIDTH + 'px',
        'height:' + BAR_HEIGHT + 'px',
        'background:rgba(0,0,0,0.50)',
        'border-radius:3px',
        'overflow:hidden',
        'opacity:0',
        'transition:opacity 0.6s ease',
        'z-index:510',
        'pointer-events:none'
      ].join(';');

      _barFill = document.createElement('div');
      _barFill.id = 'staminaBarFill';
      _barFill.style.cssText = [
        'width:100%',
        'height:100%',
        'border-radius:3px',
        'transition:background 0.25s',
        'background:#44ff55'
      ].join(';');

      _barWrap.appendChild(_barFill);
      document.body.appendChild(_barWrap);
    } else {
      _barWrap = document.getElementById('staminaBarWrap');
      _barFill = document.getElementById('staminaBarFill');
    }

    /* EXHAUSTED label */
    if (!document.getElementById('staminaExhaustedText')) {
      _exhaustedText = document.createElement('div');
      _exhaustedText.id = 'staminaExhaustedText';
      _exhaustedText.textContent = 'EXHAUSTED';
      _exhaustedText.style.cssText = [
        'position:fixed',
        'left:50%',
        'top:calc(50% + 34px)',
        'transform:translateX(-50%)',
        'color:#ff2200',
        'font-family:monospace',
        'font-size:11px',
        'font-weight:bold',
        'letter-spacing:2px',
        'opacity:0',
        'pointer-events:none',
        'z-index:511',
        'text-shadow:0 0 6px #ff2200'
      ].join(';');
      document.body.appendChild(_exhaustedText);
    } else {
      _exhaustedText = document.getElementById('staminaExhaustedText');
    }

    /* ADRENALINE label */
    if (!document.getElementById('staminaAdrenalineText')) {
      _adrenalineText = document.createElement('div');
      _adrenalineText.id = 'staminaAdrenalineText';
      _adrenalineText.textContent = 'ADRENALINE';
      _adrenalineText.style.cssText = [
        'position:fixed',
        'left:50%',
        'top:calc(50% - 60px)',
        'transform:translateX(-50%)',
        'color:#ffcc00',
        'font-family:monospace',
        'font-size:14px',
        'font-weight:bold',
        'letter-spacing:3px',
        'opacity:0',
        'pointer-events:none',
        'z-index:511',
        'text-shadow:0 0 12px #ffaa00'
      ].join(';');
      document.body.appendChild(_adrenalineText);
    } else {
      _adrenalineText = document.getElementById('staminaAdrenalineText');
    }

    /* Exhaustion vignette — grey-orange edges */
    if (!document.getElementById('staminaExhaustVig')) {
      _exhaustVignette = document.createElement('div');
      _exhaustVignette.id = 'staminaExhaustVig';
      _exhaustVignette.style.cssText = [
        'position:fixed',
        'inset:0',
        'pointer-events:none',
        'z-index:508',
        'opacity:0',
        'transition:opacity 0.4s ease',
        'background:radial-gradient(ellipse at center,',
        '  transparent 52%,',
        '  rgba(160,100,40,0.55) 100%)'
      ].join('');
      document.body.appendChild(_exhaustVignette);
    } else {
      _exhaustVignette = document.getElementById('staminaExhaustVig');
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BAR COLOR
  ══════════════════════════════════════════════════════════════════════════ */
  function _updateBarColor() {
    if (!_barFill) return;
    var p = _pct();
    var color;
    if (p > 0.55) {
      color = '#44ff55';      /* green */
    } else if (p > 0.25) {
      color = '#ffdd00';      /* yellow */
    } else {
      color = '#ff3300';      /* red */
    }
    _barFill.style.background = color;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     EXHAUSTION DEBUFFS
  ══════════════════════════════════════════════════════════════════════════ */
  function _applyExhaustionDebuffs() {
    window._playerSpeedMult  = EXHAUSTION_SPEED_MULT;
    window._weaponSwayBonus  = EXHAUSTION_WEAPON_SWAY;
    if (_exhaustVignette) _exhaustVignette.style.opacity = '1';
  }

  function _clearExhaustionDebuffs() {
    /* Restore defaults only if adrenaline isn't overriding */
    if (!_adrenalineActive) {
      if (window._playerSpeedMult !== undefined && window._playerSpeedMult < 1.0) {
        window._playerSpeedMult = 1.0;
      }
    }
    window._weaponSwayBonus = 0;
    if (_exhaustVignette) _exhaustVignette.style.opacity = '0';
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ADRENALINE BURST
  ══════════════════════════════════════════════════════════════════════════ */
  function _triggerAdrenaline() {
    _adrenalineActive   = true;
    _adrenalineTimer    = ADRENALINE_DURATION;
    _stamina            = Math.min(MAX_STAMINA, _stamina + ADRENALINE_STAMINA);
    window._playerStamina = _stamina;
    window._playerSpeedMult = ADRENALINE_SPEED_MULT;
    _exhausted          = false;
    _recoveryLock       = false;

    /* Flash golden text */
    if (_adrenalineText) {
      _adrenalineText.style.opacity = '1';
      _adrenalineText.style.transition = 'opacity 0.1s';
    }
    /* Play two rising tones */
    _playTone(330, 0.12, 0.2);
    setTimeout(function () { _playTone(495, 0.18, 0.22); }, 130);
    setTimeout(function () { _playTone(660, 0.25, 0.2); },  260);
  }

  function _tickAdrenaline(delta) {
    if (!_adrenalineActive) return;
    _adrenalineTimer -= delta;
    if (_adrenalineTimer <= 0) {
      _adrenalineActive = false;
      window._playerSpeedMult = 1.0;
      if (_adrenalineText) {
        _adrenalineText.style.transition = 'opacity 0.5s';
        _adrenalineText.style.opacity    = '0';
      }
    } else {
      /* Pulse gold text */
      var pulse = 0.65 + 0.35 * Math.abs(Math.sin(_adrenalineTimer * 3.5));
      if (_adrenalineText) _adrenalineText.style.opacity = String(pulse);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENERGY DRINK PICKUPS
  ══════════════════════════════════════════════════════════════════════════ */
  function _spawnEnergyDrink(scene) {
    if (!scene || !window.THREE) return;
    var geo  = new THREE.BoxGeometry(ENERGY_DRINK_SIZE, ENERGY_DRINK_SIZE * 2, ENERGY_DRINK_SIZE);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x00ffee, emissive: 0x003333 });
    var mesh = new THREE.Mesh(geo, mat);

    /* Random position on map — stay near origin bounded area */
    var range = 20;
    mesh.position.set(
      (Math.random() - 0.5) * range * 2,
      ENERGY_DRINK_FLOAT_AMP + 0.5,
      (Math.random() - 0.5) * range * 2
    );
    mesh.userData.isEnergyDrink = true;
    mesh.userData.baseY         = mesh.position.y;
    scene.add(mesh);
    _drinkMeshes.push(mesh);
  }

  function _animateDrinks(delta, camera) {
    _drinkTime += delta;
    var i;
    for (i = 0; i < _drinkMeshes.length; i++) {
      var m = _drinkMeshes[i];
      m.rotation.y += ENERGY_DRINK_SPIN * delta;
      m.position.y  = m.userData.baseY +
                      Math.sin(_drinkTime * ENERGY_DRINK_FLOAT_FREQ * Math.PI * 2) *
                      ENERGY_DRINK_FLOAT_AMP;

      /* Proximity pickup check */
      if (camera) {
        var dx = m.position.x - camera.position.x;
        var dz = m.position.z - camera.position.z;
        var dist2 = dx * dx + dz * dz;
        if (dist2 < 2.5 * 2.5) {
          _collectDrink(m);
        }
      }
    }
  }

  function _collectDrink(mesh) {
    /* Remove from scene */
    if (mesh.parent) mesh.parent.remove(mesh);
    var idx = _drinkMeshes.indexOf(mesh);
    if (idx !== -1) _drinkMeshes.splice(idx, 1);

    /* Grant stamina */
    restore(ENERGY_DRINK_RESTORE);

    /* Brief tone */
    _playTone(880, 0.12, 0.18);
    setTimeout(function () { _playTone(1100, 0.15, 0.15); }, 100);
  }

  function _removeAllDrinks(scene) {
    var i;
    for (i = 0; i < _drinkMeshes.length; i++) {
      var m = _drinkMeshes[i];
      if (m.parent) m.parent.remove(m);
    }
    _drinkMeshes = [];
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * init() — call once when game/wave starts.
   *   opts.scene  — THREE.Scene for energy drink spawning
   */
  function init(opts) {
    opts = opts || {};
    _stamina              = MAX_STAMINA;
    _sprinting            = false;
    _exhausted            = false;
    _exhaustionTimer      = 0;
    _recoveryLock         = false;
    _recoveryTimer        = 0;
    _adrenalineActive     = false;
    _adrenalineTimer      = 0;
    _adrenalineCheckTimer = 0;
    _barFlash             = false;
    _barFlashTimer        = 0;
    _prevSprinting        = false;
    _sprintDistanceTotal  = 0;
    _rollsTotal           = 0;
    _drinkTime            = 0;

    window._playerStamina   = MAX_STAMINA;
    window._playerSpeedMult = window._playerSpeedMult || 1.0;
    window._weaponSwayBonus = 0;

    _createHUD();

    if (opts.scene) {
      _removeAllDrinks(opts.scene);
      _spawnEnergyDrink(opts.scene);
    }
  }

  /**
   * update(delta, opts) — call every frame.
   *   delta        — seconds elapsed
   *   opts.camera  — THREE.Camera for drink proximity
   *   opts.scene   — THREE.Scene
   *   opts.isMoving — override motion detection
   */
  function update(delta, opts) {
    opts = opts || {};

    /* ── Sprint detection via global flags ──────────────────────────── */
    var shiftHeld = !!(window._shiftHeld || window._playerSprinting ||
                       (window._keys && (window._keys['ShiftLeft'] || window._keys['ShiftLeft'])));
    var moving    = (opts.isMoving !== undefined) ? opts.isMoving : _isMoving();

    var wantSprint = shiftHeld && moving && !_recoveryLock;

    /* ── Regen / drain ──────────────────────────────────────────────── */
    if (wantSprint && _stamina > MIN_TO_SPRINT) {
      /* Sprinting */
      _sprinting = true;
      _stamina   = Math.max(0, _stamina - DRAIN_SPRINT * delta);
      /* Accumulate distance estimate */
      _sprintDistanceTotal += _sprintSpeedEst * delta;
    } else {
      _sprinting = false;
      /* Regen: faster when still */
      var regenRate = moving ? REGEN_MOVING : REGEN_STILL;
      _stamina      = Math.min(MAX_STAMINA, _stamina + regenRate * delta);
    }

    /* ── Breath-hold drain (SniperScope) ────────────────────────────── */
    if (window.SniperScope && typeof window.SniperScope.isHoldingBreath === 'function') {
      if (window.SniperScope.isHoldingBreath()) {
        _stamina = Math.max(0, _stamina - DRAIN_BREATH_HOLD * delta);
      }
    }

    /* ── Smoke / gas cloud drain ────────────────────────────────────── */
    if (window._playerInSmoke || window._playerInGas) {
      _stamina = Math.max(0, _stamina - DRAIN_SMOKE * delta);
    }

    /* ── Adrenaline check (1 per second when stamina < threshold) ───── */
    if (_stamina < ADRENALINE_THRESHOLD && !_adrenalineActive) {
      _adrenalineCheckTimer += delta;
      if (_adrenalineCheckTimer >= 1.0) {
        _adrenalineCheckTimer = 0;
        if (Math.random() < ADRENALINE_CHANCE) {
          _triggerAdrenaline();
        }
      }
    } else {
      _adrenalineCheckTimer = 0;
    }

    /* ── Adrenaline tick ────────────────────────────────────────────── */
    _tickAdrenaline(delta);

    /* ── Exhaustion state ───────────────────────────────────────────── */
    if (_stamina <= 0 && !_exhausted) {
      _exhausted      = true;
      _recoveryLock   = true;
      _recoveryTimer  = EXHAUSTION_RECOVERY_TIME;
      _sprinting      = false;
      _applyExhaustionDebuffs();
      _playTone(110, 0.3, 0.15);
    }

    if (_recoveryLock) {
      _recoveryTimer -= delta;
      if (_recoveryTimer <= 0) {
        _recoveryLock = false;
      }
    }

    if (_exhausted && _stamina > MIN_TO_SPRINT && !_recoveryLock) {
      _exhausted = false;
      _clearExhaustionDebuffs();
    }

    /* Maintain debuffs while exhausted */
    if (_exhausted && !_adrenalineActive) {
      _applyExhaustionDebuffs();
    }

    /* ── Expose globals ─────────────────────────────────────────────── */
    window._playerStamina   = _stamina;
    window._sprintFOVDelta  = _sprinting ? 8 : 0;
    window._sprintHeadbob   = _sprinting;

    /* ── HUD bar ────────────────────────────────────────────────────── */
    if (_barWrap) {
      var p = _pct();
      /* Hide when full; show when below 100% */
      var showBar = (p < 1.0 || _sprinting);
      _barWrap.style.opacity = showBar ? '1' : '0';
      _barFill.style.width   = (p * 100) + '%';
      _updateBarColor();

      /* Flash when approaching exhaustion */
      if (p < 0.12) {
        _barFlashTimer += delta;
        if (_barFlashTimer > 0.22) {
          _barFlash      = !_barFlash;
          _barFlashTimer = 0;
        }
        _barFill.style.opacity = _barFlash ? '0.3' : '1';
      } else {
        _barFill.style.opacity = '1';
        _barFlashTimer         = 0;
        _barFlash              = false;
      }
    }

    /* ── EXHAUSTED text pulse ───────────────────────────────────────── */
    if (_exhaustedText) {
      if (_exhausted) {
        _exhaustionTimer  += delta;
        var pulse = 0.55 + 0.45 * Math.abs(Math.sin(_exhaustionTimer * 4.0));
        _exhaustedText.style.opacity = String(pulse);
      } else {
        _exhaustionTimer = 0;
        _exhaustedText.style.opacity = '0';
      }
    }

    /* ── Energy drink animation + proximity pickup ──────────────────── */
    _animateDrinks(delta, opts.camera || window._camera || null);

    _prevSprinting = _sprinting;
  }

  /**
   * drain(amount) — deduct stamina externally (melee, roll, etc.)
   */
  function drain(amount) {
    _stamina = Math.max(0, _stamina - amount);
    window._playerStamina = _stamina;
  }

  /**
   * restore(amount) — add stamina externally (pickup, regen ability, etc.)
   */
  function restore(amount) {
    _stamina = Math.min(MAX_STAMINA, _stamina + amount);
    window._playerStamina = _stamina;
    /* Cancel exhaustion if stamina recovered enough */
    if (_stamina > MIN_TO_SPRINT) {
      _exhausted    = false;
      _recoveryLock = false;
      _clearExhaustionDebuffs();
    }
  }

  /**
   * onMeleeStrike() — called by melee system per strike
   */
  function onMeleeStrike() {
    drain(DRAIN_MELEE);
  }

  /**
   * onCombatRoll() — called by CombatRoll system per roll
   */
  function onCombatRoll() {
    drain(DRAIN_ROLL);
    _rollsTotal++;
  }

  /**
   * onWaveStart(scene) — spawn one energy drink per wave
   */
  function onWaveStart(scene) {
    if (!scene) return;
    _removeAllDrinks(scene);
    _spawnEnergyDrink(scene);
  }

  /**
   * getStats() — for end-of-wave debrief
   */
  function getStats() {
    return {
      sprintDistanceMetres: Math.round(_sprintDistanceTotal * 10) / 10,
      totalRolls:           _rollsTotal,
      currentStamina:       Math.round(_stamina),
      exhausted:            _exhausted
    };
  }

  /**
   * reset() — full reset between rounds / on death
   */
  function reset() {
    _stamina              = MAX_STAMINA;
    _sprinting            = false;
    _exhausted            = false;
    _exhaustionTimer      = 0;
    _recoveryLock         = false;
    _recoveryTimer        = 0;
    _adrenalineActive     = false;
    _adrenalineTimer      = 0;
    _adrenalineCheckTimer = 0;
    _barFlash             = false;
    _barFlashTimer        = 0;
    _prevSprinting        = false;
    _sprintDistanceTotal  = 0;
    _rollsTotal           = 0;

    window._playerStamina   = MAX_STAMINA;
    window._playerSpeedMult = 1.0;
    window._weaponSwayBonus = 0;

    if (_barWrap)          _barWrap.style.opacity          = '0';
    if (_exhaustedText)    _exhaustedText.style.opacity    = '0';
    if (_adrenalineText)   _adrenalineText.style.opacity   = '0';
    if (_exhaustVignette)  _exhaustVignette.style.opacity  = '0';
  }

  /* ── Legacy compat helpers (keep callers that used old API working) ─── */
  function startSprint() { window._playerSprinting = true; }
  function stopSprint()  { window._playerSprinting = false; }
  function isSprinting() { return _sprinting; }
  function getStaminaPct() { return _pct(); }

  /* ══════════════════════════════════════════════════════════════════════════
     HOOK INTO CombatRoll + MeleeSystem automatically when available
  ══════════════════════════════════════════════════════════════════════════ */
  (function _patchSystems() {
    /* Try immediately and also after DOMContentLoaded in case systems load later */
    function _patch() {
      if (window.CombatRoll && !window.CombatRoll._staminaPatched) {
        var _origRoll = window.CombatRoll.roll || window.CombatRoll.startRoll;
        if (typeof _origRoll === 'function') {
          window.CombatRoll._origRoll = _origRoll;
          window.CombatRoll.roll = function () {
            window.StaminaSystem.onCombatRoll();
            return _origRoll.apply(this, arguments);
          };
          window.CombatRoll._staminaPatched = true;
        }
      }
      if (window.MeleeSystem && !window.MeleeSystem._staminaPatched) {
        var _origMelee = window.MeleeSystem.strike || window.MeleeSystem.attack;
        if (typeof _origMelee === 'function') {
          window.MeleeSystem._origMelee = _origMelee;
          window.MeleeSystem.strike = function () {
            window.StaminaSystem.onMeleeStrike();
            return _origMelee.apply(this, arguments);
          };
          window.MeleeSystem._staminaPatched = true;
        }
      }
    }
    _patch();
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', _patch);
    }
  })();

  /* ── Public interface ────────────────────────────────────────────────── */
  return {
    init:          init,
    update:        update,
    drain:         drain,
    restore:       restore,
    reset:         reset,
    getStats:      getStats,
    onMeleeStrike: onMeleeStrike,
    onCombatRoll:  onCombatRoll,
    onWaveStart:   onWaveStart,
    /* legacy compat */
    startSprint:   startSprint,
    stopSprint:    stopSprint,
    isSprinting:   isSprinting,
    getStaminaPct: getStaminaPct
  };

})();
