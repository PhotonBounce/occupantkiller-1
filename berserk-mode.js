// berserk-mode.js — Berserk Rage Mode for OccupantKiller
// Activates automatically at <20% HP or manually via Shift+B after picking up RAGE PILL
// IIFE, all var (no let/const)
//
// Public API:
//   BerserkMode.init(scene, camera)
//   BerserkMode.update(dt)
//   BerserkMode.activate()
//   BerserkMode.reset()
//
// Globals exposed:
//   window._berserkActive  — boolean, true while berserk is running
//   window._berserkTimer   — seconds remaining on current effect

window.BerserkMode = (function () {
  'use strict';

  // ─────────────────────────────────── config
  var EFFECT_DURATION      = 8;      // seconds of berserk rage
  var FADE_DURATION        = 2;      // seconds of post-berserk slowdown
  var DAMAGE_REDUCTION     = 0.40;   // multiplier on incoming damage (60% less)
  var SPEED_MULT           = 1.50;   // +50% move speed
  var MELEE_MULT           = 3;      // ×3 melee damage (knife-kill.js hook)
  var FADE_SPEED_MULT      = 0.80;   // 0.8× speed during fade
  var PILL_COLLECT_DIST    = 1.2;    // metres to auto-collect rage pill
  var PILL_BOB_SPEED       = 2.2;    // rad/s for pill bob
  var PILL_BOB_RANGE       = 0.06;   // metres
  var PILL_ROTATE_SPEED    = 1.5;    // rad/s
  var HEARTBEAT_HZ         = 80;     // sin wave frequency for audio
  var HEARTBEAT_BPM        = 120;    // beats per minute (interval between pulses)
  var VIGNETTE_ANIM_NAME   = 'berserkVignettePulse';
  var HUD_BLINK_ANIM_NAME  = 'berserkHudBlink';
  var CSS_FILTER_CANVAS    = 'hue-rotate(340deg) contrast(1.35) saturate(1.6)';

  // ─────────────────────────────────── state
  var _scene           = null;
  var _camera          = null;
  var _time            = 0;

  var _active          = false;
  var _timer           = 0;
  var _fading          = false;
  var _fadeTimer       = 0;

  // Per-life guard — once activated it cannot fire again until reset()
  var _usedThisLife    = false;
  // Rage pill earned by wave — requires pickup before Shift+B works
  var _pillCarried     = false;
  // Pill world object
  var _pillMesh        = null;
  var _pillPickedUp    = false;
  // Track wave count for pill spawn (every 3rd wave)
  var _wavesCompleted  = 0;

  // DOM / audio handles
  var _vigEl           = null;
  var _styleEl         = null;
  var _hudEl           = null;
  var _canvasEl        = null;
  var _audioCtx        = null;
  var _beatInterval    = null;
  var _masterGain      = null;
  var _originalFilter  = '';

  // ─────────────────────────────────── global flags
  window._berserkActive = false;
  window._berserkTimer  = 0;

  // ─────────────────────────────────── CSS injection
  function _injectStyles() {
    if (_styleEl) return;
    _styleEl = document.createElement('style');
    _styleEl.textContent = [
      '@keyframes ' + VIGNETTE_ANIM_NAME + ' {',
      '  0%,100% { box-shadow: inset 0 0 90px 30px rgba(180,0,0,0.55); }',
      '  50%      { box-shadow: inset 0 0 140px 55px rgba(255,0,0,0.80); }',
      '}',
      '@keyframes ' + HUD_BLINK_ANIM_NAME + ' {',
      '  0%,49%  { opacity: 1; }',
      '  50%,100% { opacity: 0; }',
      '}',
      '#berserk-vignette {',
      '  display: none;',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  pointer-events: none;',
      '  z-index: 191;',
      '  animation: ' + VIGNETTE_ANIM_NAME + ' 0.5s ease-in-out infinite;',
      '}',
      '#berserk-hud {',
      '  display: none;',
      '  position: fixed;',
      '  top: 10px;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  font-family: monospace;',
      '  font-size: 18px;',
      '  font-weight: bold;',
      '  color: #ff1111;',
      '  text-shadow: 0 0 12px rgba(255,0,0,0.9), 0 0 24px rgba(255,0,0,0.5);',
      '  z-index: 300;',
      '  pointer-events: none;',
      '  letter-spacing: 4px;',
      '  animation: ' + HUD_BLINK_ANIM_NAME + ' 0.45s step-start infinite;',
      '}'
    ].join('\n');
    document.head.appendChild(_styleEl);
  }

  // ─────────────────────────────────── DOM elements
  function _createDOMElements() {
    if (!_vigEl) {
      _vigEl = document.createElement('div');
      _vigEl.id = 'berserk-vignette';
      document.body.appendChild(_vigEl);
    }
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'berserk-hud';
      _hudEl.textContent = 'BERSERK';
      document.body.appendChild(_hudEl);
    }
  }

  // ─────────────────────────────────── audio
  function _startHeartbeat() {
    _stopHeartbeat();
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      _masterGain = _audioCtx.createGain();
      _masterGain.gain.value = 0.28;
      _masterGain.connect(_audioCtx.destination);
      var beatMs = 60000 / HEARTBEAT_BPM;
      _beatInterval = setInterval(function () {
        if (!_active || !_audioCtx) return;
        try {
          var osc = _audioCtx.createOscillator();
          var env = _audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.value = HEARTBEAT_HZ;
          env.gain.setValueAtTime(0.0, _audioCtx.currentTime);
          env.gain.linearRampToValueAtTime(0.6, _audioCtx.currentTime + 0.025);
          env.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.22);
          osc.connect(env);
          env.connect(_masterGain);
          osc.start(_audioCtx.currentTime);
          osc.stop(_audioCtx.currentTime + 0.25);
        } catch (e) {}
      }, beatMs);
    } catch (e) {}
  }

  function _stopHeartbeat() {
    if (_beatInterval) { clearInterval(_beatInterval); _beatInterval = null; }
    if (_masterGain) {
      try { _masterGain.disconnect(); } catch (e) {}
      _masterGain = null;
    }
    if (_audioCtx) {
      try { _audioCtx.close(); } catch (e) {}
      _audioCtx = null;
    }
  }

  // ─────────────────────────────────── canvas filter
  function _applyCanvasFilter(filterStr) {
    if (!_canvasEl) _canvasEl = document.querySelector('canvas');
    if (_canvasEl) _canvasEl.style.filter = filterStr;
  }

  function _clearCanvasFilter() {
    if (_canvasEl) _canvasEl.style.filter = _originalFilter;
  }

  // ─────────────────────────────────── HUD toast
  function _toast(msg, color) {
    try {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup(msg, color || '#ff2222');
        return;
      }
    } catch (e) {}
    // Fallback: brief on-screen div
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed;top:25%;left:50%;transform:translateX(-50%)',
      'font-family:monospace;font-size:20px;font-weight:bold',
      'color:' + (color || '#ff2222'),
      'text-shadow:0 0 12px rgba(255,0,0,0.8)',
      'z-index:310;pointer-events:none',
      'animation:' + HUD_BLINK_ANIM_NAME + ' 0.5s step-start 4'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2200);
  }

  // ─────────────────────────────────── damage interception
  // Wraps the window globals set by game-manager so berserk can reduce incoming damage.
  // Called after init() to ensure game-manager has already assigned these callbacks.
  function _hookDamageCallbacks() {
    // Helper: wrap one callback with damage reduction
    function _wrap(origFn) {
      return function (dmg, pos) {
        if (window._berserkActive) {
          dmg = Math.round(dmg * DAMAGE_REDUCTION);
        }
        return origFn.call(this, dmg, pos);
      };
    }

    var names = ['_takeDamageFromWaveEvent', '_takeVehicleRamDamage', '_takeBTRDamage'];
    for (var i = 0; i < names.length; i++) {
      (function (name) {
        // Use Object.defineProperty to intercept future assignments too
        var _stored = window[name];
        var _wrapped = null;
        Object.defineProperty(window, name, {
          configurable: true,
          get: function () { return _wrapped; },
          set: function (fn) {
            _stored = fn;
            _wrapped = fn ? _wrap(fn) : fn;
          }
        });
        // Wrap current value if already set
        if (typeof _stored === 'function') { window[name] = _stored; }
      })(names[i]);
    }
  }

  // ─────────────────────────────────── speed hook
  function _applySpeedMult(mult) {
    // Writes window._loadoutSpeedMult which game-manager reads in its speed pipeline.
    // We preserve any existing value set by loadout.js by stacking multiplicatively.
    window._loadoutSpeedMult = (window._loadoutSpeedMult || 1) * mult;
  }

  function _removeSpeedMult(mult) {
    if (window._loadoutSpeedMult && mult !== 0) {
      window._loadoutSpeedMult = (window._loadoutSpeedMult || mult) / mult;
      // Clamp to avoid floating-point drift to very-near-1 values
      if (Math.abs(window._loadoutSpeedMult - 1) < 0.001) window._loadoutSpeedMult = 1;
    }
  }

  // ─────────────────────────────────── melee hook
  function _applyMeleeMult() {
    // Signals to knife-kill.js (if loaded) that melee damage should be tripled.
    window._berserkMeleeMult = MELEE_MULT;
  }

  function _removeMeleeMult() {
    window._berserkMeleeMult = 1;
  }

  // ─────────────────────────────────── rage pill — 3D world pickup
  function _spawnPill(playerPos) {
    if (!_scene || _pillMesh) return; // already spawned
    try {
      var geo = new THREE.SphereGeometry(0.2, 8, 8);
      // Red-black candy-striped pill appearance via MeshPhongMaterial
      var mat = new THREE.MeshPhongMaterial({
        color: 0xcc0000,
        emissive: 0x220000,
        shininess: 80
      });
      _pillMesh = new THREE.Mesh(geo, mat);
      // Spawn 4–8 m ahead of player, clear of the ground
      var offsetX = (Math.random() - 0.5) * 6;
      var offsetZ = (Math.random() - 0.5) * 6;
      _pillMesh.position.set(
        (playerPos ? playerPos.x : 0) + offsetX,
        0.6,
        (playerPos ? playerPos.z : 0) + offsetZ
      );
      _pillMesh.castShadow = false;
      _pillMesh.receiveShadow = false;
      _pillMesh.userData.isBerserkPill = true;
      // Add a second dark sphere to make it look pill-shaped
      var capGeo = new THREE.SphereGeometry(0.18, 8, 8);
      var capMat = new THREE.MeshPhongMaterial({ color: 0x111111, emissive: 0x000000, shininess: 40 });
      var cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0.18, 0, 0);
      _pillMesh.add(cap);
      _scene.add(_pillMesh);
      _pillPickedUp = false;
    } catch (e) {}
  }

  function _removePill() {
    if (_pillMesh && _scene) {
      try { _scene.remove(_pillMesh); } catch (e) {}
      _pillMesh = null;
    }
  }

  // ─────────────────────────────────── activate / deactivate
  function activate() {
    if (_active) return;         // already berserk
    if (_usedThisLife) return;   // once per life
    _usedThisLife = true;
    _active = true;
    _timer = EFFECT_DURATION;
    _fading = false;
    _fadeTimer = 0;

    window._berserkActive = true;
    window._berserkTimer  = _timer;
    window._berserkMeleeMult = MELEE_MULT;

    // Visual
    if (_vigEl) _vigEl.style.display = 'block';
    if (_hudEl) _hudEl.style.display = 'block';
    _applyCanvasFilter(CSS_FILTER_CANVAS);
    _applySpeedMult(SPEED_MULT);
    _applyMeleeMult();

    // Audio
    _startHeartbeat();

    // HUD toast
    _toast('BERSERK RAGE!', '#ff0000');

    // Notify companion radio if present
    try {
      if (window.CompanionRadio && CompanionRadio.onPlayerLowHealth) {
        CompanionRadio.onPlayerLowHealth();
      }
    } catch (e) {}
  }

  function _deactivate() {
    if (!_active) return;
    _active = false;
    window._berserkActive = false;
    window._berserkTimer  = 0;

    // Remove speed mult (berserk contribution)
    _removeSpeedMult(SPEED_MULT);
    _removeMeleeMult();

    // Remove visuals
    if (_vigEl) _vigEl.style.display = 'none';
    if (_hudEl) _hudEl.style.display = 'none';
    _clearCanvasFilter();
    _stopHeartbeat();

    // Start fade slowdown
    _fading = true;
    _fadeTimer = FADE_DURATION;
    _applySpeedMult(FADE_SPEED_MULT);

    _toast('BERSERK FADING', '#ff8800');
  }

  // ─────────────────────────────────── keyboard handler
  function _onKeyDown(evt) {
    // Shift+B triggers manual activation (only if rage pill was collected)
    if ((evt.key === 'B' || evt.key === 'b') && evt.shiftKey) {
      if (_pillCarried && !_active && !_usedThisLife) {
        _pillCarried = false;
        activate();
      }
    }
  }

  // ─────────────────────────────────── low-HP auto-trigger check
  function _checkAutoTrigger() {
    if (_active || _usedThisLife) return;
    try {
      var gm = window.GameManager;
      if (!gm || !gm.getPlayer) return;
      var pl = gm.getPlayer();
      if (!pl || !pl.maxHp || pl.maxHp <= 0) return;
      var ratio = pl.hp / pl.maxHp;
      if (ratio > 0 && ratio < 0.20) {
        activate();
      }
    } catch (e) {}
  }

  // ─────────────────────────────────── pill proximity check
  function _checkPillPickup(playerPos) {
    if (!_pillMesh || _pillPickedUp) return;
    var dx = _pillMesh.position.x - playerPos.x;
    var dz = _pillMesh.position.z - playerPos.z;
    var distSq = dx * dx + dz * dz;
    if (distSq < PILL_COLLECT_DIST * PILL_COLLECT_DIST) {
      _pillPickedUp = true;
      _pillCarried = true;
      _removePill();
      _toast('RAGE PILL ACQUIRED — Shift+B to BERSERK', '#ff4400');
      try {
        if (window.AudioSystem && AudioSystem.playPickup) AudioSystem.playPickup();
      } catch (e) {}
    }
  }

  // ─────────────────────────────────── pill animation (bob + rotate)
  function _animatePill(dt) {
    if (!_pillMesh || _pillPickedUp) return;
    _time += dt;
    _pillMesh.position.y = 0.6 + Math.sin(_time * PILL_BOB_SPEED) * PILL_BOB_RANGE;
    _pillMesh.rotation.y += PILL_ROTATE_SPEED * dt;
  }

  // ─────────────────────────────────── wave complete hook
  function _onWaveComplete() {
    _wavesCompleted += 1;
    if (_wavesCompleted % 3 === 0) {
      // Spawn rage pill after every 3rd wave
      var playerPos = null;
      try {
        var gm = window.GameManager;
        if (gm && gm.getPlayer) playerPos = gm.getPlayer().position;
      } catch (e) {}
      _spawnPill(playerPos);
      _toast('RAGE PILL SPAWNED!', '#ff4400');
    }
    // Reset per-life guard for next wave (spec: once per life OR once per pickup)
    // The spec says "once per life" — we reset on wave end so each wave is a new "life phase"
    _usedThisLife = false;
  }

  // ─────────────────────────────────── public API

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _injectStyles();
    _createDOMElements();

    // Cache canvas original filter
    _canvasEl = document.querySelector('canvas');
    _originalFilter = _canvasEl ? (_canvasEl.style.filter || '') : '';

    // Hook damage callbacks (game-manager sets these on init)
    // Use a small delay to ensure game-manager has registered them
    setTimeout(_hookDamageCallbacks, 500);

    // Listen for keyboard
    document.addEventListener('keydown', _onKeyDown);

    // Hook into GameManager.onWaveComplete if available
    // We poll briefly to allow GameManager to finish loading
    var _hookAttempts = 0;
    var _hookInterval = setInterval(function () {
      _hookAttempts += 1;
      var gm = window.GameManager;
      if (gm && typeof gm.onWaveComplete === 'function' && !gm.__berserkHooked) {
        var _origWC = gm.onWaveComplete;
        gm.onWaveComplete = function () {
          _onWaveComplete();
          return _origWC.apply(this, arguments);
        };
        gm.__berserkHooked = true;
        clearInterval(_hookInterval);
      }
      if (_hookAttempts > 40) clearInterval(_hookInterval); // give up after 4 s
    }, 100);
  }

  function update(dt) {
    if (!dt || dt <= 0) return;

    // Animate pill in world
    _animatePill(dt);

    // Check player proximity to pill
    if (_pillMesh && !_pillPickedUp) {
      try {
        var gm = window.GameManager;
        if (gm && gm.getPlayer) {
          var pl = gm.getPlayer();
          if (pl && pl.position) _checkPillPickup(pl.position);
        }
      } catch (e) {}
    }

    // Auto-trigger on low HP
    _checkAutoTrigger();

    if (_active) {
      _timer -= dt;
      window._berserkTimer = Math.max(0, _timer);

      if (_timer <= 0) {
        _deactivate();
      }
    } else if (_fading) {
      _fadeTimer -= dt;
      if (_fadeTimer <= 0) {
        _fading = false;
        _removeSpeedMult(FADE_SPEED_MULT);
      }
    }
  }

  function reset() {
    // Called on player death / new game / wave reset
    _active      = false;
    _timer       = 0;
    _fading      = false;
    _fadeTimer   = 0;
    _usedThisLife = false;
    _pillCarried = false;
    _pillPickedUp = false;
    _wavesCompleted = 0;

    window._berserkActive = false;
    window._berserkTimer  = 0;
    window._berserkMeleeMult = 1;

    _removePill();
    if (_vigEl) _vigEl.style.display = 'none';
    if (_hudEl) _hudEl.style.display = 'none';
    _clearCanvasFilter();
    _stopHeartbeat();

    // Restore speed mult fully
    if (window._loadoutSpeedMult && window._loadoutSpeedMult !== 1) {
      window._loadoutSpeedMult = 1;
    }
  }

  return {
    init:     init,
    update:   update,
    activate: activate,
    reset:    reset
  };

})();
