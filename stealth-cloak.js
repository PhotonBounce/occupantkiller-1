// stealth-cloak.js — Active Camouflage / Stealth Cloak for OccupantKiller
// Ctrl+S toggles stealth cloak on/off (when not in menu)
// IIFE, all var (no let/const)
//
// Public API:
//   StealthCloak.init(scene, camera)
//   StealthCloak.update(dt)
//   StealthCloak.activate()
//   StealthCloak.deactivate()
//   StealthCloak.reset()
//
// Globals exposed:
//   window._stealthActive  — boolean, true while cloak is active
//   window._stealthEnergy  — number 0-15, current energy seconds remaining

window.StealthCloak = (function () {
  'use strict';

  // ─────────────────────────────────── config
  var MAX_ENERGY           = 15;     // seconds of cloak duration
  var RECHARGE_DELAY       = 45;     // seconds to recharge when fully depleted
  var RECHARGE_RATE        = MAX_ENERGY / RECHARGE_DELAY; // energy per second
  var ENEMY_DETECT_DIST    = 12;     // units: no detection beyond this when cloaked
  var ENEMY_NEAR_DIST      = 3;      // units: enemy detects player even when cloaked
  var SHOT_ENERGY_COST     = 4;      // extra energy per shot while cloaked
  var RUN_ENERGY_MULT      = 2;      // run costs 2x normal drain
  var HUM_FREQUENCY        = 400;    // Hz for cloak oscillator
  var HUM_GAIN             = 0.03;   // gain for hum oscillator
  var SHIMMER_HZ           = 0.5;    // pulse rate of edge shimmer in Hz
  var PICKUP_ENERGY_PCT    = 0.30;   // fraction of max energy restored per pickup
  var PICKUP_BOB_SPEED     = 2.0;    // rad/s for pickup bob
  var PICKUP_BOB_RANGE     = 0.07;   // metres
  var PICKUP_ROTATE_SPEED  = 1.8;    // rad/s for pickup spin
  var PICKUP_COLLECT_DIST  = 1.4;    // metres to auto-collect energy pickup
  var CSS_FILTER_ACTIVE    = 'opacity(0.85) contrast(0.9)';
  var DECLOAK_FLASH_MS     = 350;    // duration of decloak flash in ms
  var HUD_ID               = 'stealth-cloak-hud';
  var SHIMMER_ID           = 'stealth-cloak-shimmer';
  var FLASH_ID             = 'stealth-cloak-flash';
  var STYLE_ID             = 'stealth-cloak-style';

  // ─────────────────────────────────── state
  var _scene           = null;
  var _camera          = null;
  var _time            = 0;

  var _active          = false;
  var _energy          = MAX_ENERGY;
  var _depleted        = false;      // true when energy hit zero — must fully recharge
  var _recharging      = false;      // true while recharge timer runs after depletion
  var _rechargeTimer   = 0;          // countdown before recharge begins

  // 3D pickup
  var _pickupMesh      = null;
  var _pickupRing      = null;

  // DOM handles
  var _hudEl           = null;
  var _shimmerEl       = null;
  var _flashEl         = null;
  var _styleEl         = null;
  var _canvasEl        = null;
  var _originalFilter  = '';

  // Audio
  var _audioCtx        = null;
  var _humOsc          = null;
  var _humGain         = null;

  // ─────────────────────────────────── global flags
  window._stealthActive = false;
  window._stealthEnergy = MAX_ENERGY;

  // ─────────────────────────────────── CSS injection
  function _injectStyles() {
    if (_styleEl) return;
    _styleEl = document.createElement('style');
    _styleEl.id = STYLE_ID;
    _styleEl.textContent = [
      '@keyframes stealthShimmer {',
      '  0%,100% { box-shadow: inset 0 0 20px rgba(0,200,255,0.3); opacity: 0.6; }',
      '  50%      { box-shadow: inset 0 0 36px rgba(0,220,255,0.6); opacity: 1.0; }',
      '}',
      '@keyframes stealthFlash {',
      '  0%   { opacity: 1; }',
      '  60%  { opacity: 0.5; }',
      '  100% { opacity: 0; }',
      '}',
      '#' + SHIMMER_ID + ' {',
      '  display: none;',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  pointer-events: none;',
      '  z-index: 190;',
      '  animation: stealthShimmer ' + (1 / SHIMMER_HZ).toFixed(1) + 's ease-in-out infinite;',
      '}',
      '#' + FLASH_ID + ' {',
      '  display: none;',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  pointer-events: none;',
      '  z-index: 195;',
      '  background: rgba(0,220,255,0.45);',
      '}',
      '#' + HUD_ID + ' {',
      '  display: none;',
      '  position: fixed;',
      '  top: 10px;',
      '  right: 14px;',
      '  font-family: monospace;',
      '  font-size: 13px;',
      '  font-weight: bold;',
      '  color: #00e5ff;',
      '  text-shadow: 0 0 8px rgba(0,200,255,0.9), 0 0 18px rgba(0,200,255,0.5);',
      '  z-index: 300;',
      '  pointer-events: none;',
      '  letter-spacing: 2px;',
      '  background: rgba(0,0,0,0.55);',
      '  padding: 3px 10px;',
      '  border-radius: 4px;',
      '  border-left: 3px solid #00e5ff;',
      '}'
    ].join('\n');
    document.head.appendChild(_styleEl);
  }

  // ─────────────────────────────────── DOM elements
  function _createDOMElements() {
    if (!_shimmerEl) {
      _shimmerEl = document.createElement('div');
      _shimmerEl.id = SHIMMER_ID;
      document.body.appendChild(_shimmerEl);
    }
    if (!_flashEl) {
      _flashEl = document.createElement('div');
      _flashEl.id = FLASH_ID;
      document.body.appendChild(_flashEl);
    }
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = HUD_ID;
      document.body.appendChild(_hudEl);
    }
  }

  // ─────────────────────────────────── HUD rendering
  function _renderHUD() {
    if (!_hudEl) return;

    var energy = Math.max(0, Math.min(MAX_ENERGY, _energy));
    var frac = energy / MAX_ENERGY;
    var totalBars = 9;
    var filledBars = Math.round(frac * totalBars);
    var bar = '';
    var i;
    for (i = 0; i < totalBars; i++) {
      bar += (i < filledBars) ? '█' : '░';
    }
    var secsLabel = _active ? (energy.toFixed(0) + 's') : (_depleted ? 'WAIT' : (energy.toFixed(0) + 's'));
    _hudEl.textContent = '👻 CLOAK [' + bar + '] ' + secsLabel;

    // Always show HUD (visible as long as energy < max or active)
    var shouldShow = _active || _depleted || _energy < MAX_ENERGY;
    _hudEl.style.display = shouldShow ? 'block' : 'none';
    // Dim when depleted
    _hudEl.style.opacity = _depleted ? '0.4' : '1';
  }

  // ─────────────────────────────────── canvas filter
  function _applyCanvasFilter(filterStr) {
    if (!_canvasEl) _canvasEl = document.querySelector('canvas');
    if (_canvasEl) _canvasEl.style.filter = filterStr;
  }

  function _clearCanvasFilter() {
    if (_canvasEl) _canvasEl.style.filter = _originalFilter;
  }

  // ─────────────────────────────────── audio: hum
  function _startHum() {
    _stopHum();
    try {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      _humGain = _audioCtx.createGain();
      _humGain.gain.value = HUM_GAIN;
      _humGain.connect(_audioCtx.destination);
      _humOsc = _audioCtx.createOscillator();
      _humOsc.type = 'sine';
      _humOsc.frequency.value = HUM_FREQUENCY;
      _humOsc.connect(_humGain);
      _humOsc.start();
    } catch (e) {}
  }

  function _stopHum() {
    if (_humOsc) {
      try { _humOsc.stop(); } catch (e) {}
      try { _humOsc.disconnect(); } catch (e) {}
      _humOsc = null;
    }
    if (_humGain) {
      try { _humGain.disconnect(); } catch (e) {}
      _humGain = null;
    }
  }

  // ─────────────────────────────────── audio: deactivation zap
  function _playZap() {
    try {
      var ctx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var env = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
      env.gain.setValueAtTime(0.18, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(env);
      env.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  // ─────────────────────────────────── decloak flash effect
  function _doCloakFlash() {
    if (!_flashEl) return;
    _flashEl.style.display = 'block';
    _flashEl.style.animation = 'none';
    // Force reflow to restart animation
    void _flashEl.offsetWidth;
    _flashEl.style.animation = 'stealthFlash ' + (DECLOAK_FLASH_MS / 1000).toFixed(2) + 's ease-out forwards';
    setTimeout(function () {
      if (_flashEl) _flashEl.style.display = 'none';
    }, DECLOAK_FLASH_MS + 50);
  }

  // ─────────────────────────────────── 3D energy pickup
  function _spawnPickup() {
    if (!_scene || _pickupMesh) return;
    try {
      var geo = new THREE.BoxGeometry(0.2, 0.3, 0.2);
      var mat = new THREE.MeshPhongMaterial({
        color: 0x00e5ff,
        emissive: 0x003344,
        shininess: 120
      });
      _pickupMesh = new THREE.Mesh(geo, mat);

      // Spinning ring around the cell
      var ringGeo = new THREE.TorusGeometry(0.22, 0.025, 6, 16);
      var ringMat = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x004466,
        shininess: 90
      });
      _pickupRing = new THREE.Mesh(ringGeo, ringMat);
      _pickupMesh.add(_pickupRing);

      // Spawn at a random offset from world centre (or camera if available)
      var baseX = 0;
      var baseZ = 0;
      if (_camera) {
        baseX = _camera.position.x + (Math.random() - 0.5) * 12;
        baseZ = _camera.position.z + (Math.random() - 0.5) * 12;
      } else {
        baseX = (Math.random() - 0.5) * 20;
        baseZ = (Math.random() - 0.5) * 20;
      }
      _pickupMesh.position.set(baseX, 0.7, baseZ);
      _pickupMesh.castShadow = false;
      _pickupMesh.receiveShadow = false;
      _pickupMesh.userData.isStealthPickup = true;

      _scene.add(_pickupMesh);
    } catch (e) {}
  }

  function _removePickup() {
    if (_pickupMesh && _scene) {
      try { _scene.remove(_pickupMesh); } catch (e) {}
      _pickupMesh = null;
      _pickupRing = null;
    }
  }

  function _animatePickup(dt) {
    if (!_pickupMesh) return;
    _time += dt;
    _pickupMesh.position.y = 0.7 + Math.sin(_time * PICKUP_BOB_SPEED) * PICKUP_BOB_RANGE;
    _pickupMesh.rotation.y += PICKUP_ROTATE_SPEED * dt;
    if (_pickupRing) {
      _pickupRing.rotation.x += PICKUP_ROTATE_SPEED * 1.3 * dt;
    }
  }

  function _checkPickupCollect() {
    if (!_pickupMesh || !_camera) return;
    var dx = _pickupMesh.position.x - _camera.position.x;
    var dz = _pickupMesh.position.z - _camera.position.z;
    var distSq = dx * dx + dz * dz;
    if (distSq < PICKUP_COLLECT_DIST * PICKUP_COLLECT_DIST) {
      var added = MAX_ENERGY * PICKUP_ENERGY_PCT;
      _energy = Math.min(MAX_ENERGY, _energy + added);
      window._stealthEnergy = _energy;
      _depleted = false;
      _recharging = false;
      _rechargeTimer = 0;
      _removePickup();
      _toast('👻 CLOAK CELL +30% energy');
      try {
        if (window.AudioSystem && AudioSystem.playPickup) AudioSystem.playPickup();
      } catch (e) {}
      // Spawn next one eventually
      setTimeout(_spawnPickup, 30000 + Math.random() * 30000);
    }
  }

  // ─────────────────────────────────── toast helper
  function _toast(msg) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(msg);
        return;
      }
    } catch (e) {}
    // Fallback
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed;top:20%;left:50%;transform:translateX(-50%)',
      'font-family:monospace;font-size:18px;font-weight:bold',
      'color:#00e5ff',
      'text-shadow:0 0 10px rgba(0,200,255,0.9)',
      'z-index:310;pointer-events:none',
      'background:rgba(0,0,0,0.6);padding:6px 18px;border-radius:4px'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2200);
  }

  // ─────────────────────────────────── enemy AI integration
  // Called each frame when cloaked: patch each enemy's detection so that
  // enemies beyond ENEMY_DETECT_DIST are blind to the player, and enemies
  // within ENEMY_NEAR_DIST can still detect.
  function _patchEnemyDetection() {
    try {
      var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e) continue;
        // Tag enemies: if they have a detectRadius, override while cloaked
        if (!e.__origDetectRadius && typeof e.detectRadius === 'number') {
          e.__origDetectRadius = e.detectRadius;
        }
        if (typeof e.__origDetectRadius === 'number') {
          e.detectRadius = ENEMY_NEAR_DIST;
        }
        // Also set a flag for game-manager / enemy AI systems
        e._stealthBlind = true;
      }
    } catch (err) {}
  }

  function _restoreEnemyDetection() {
    try {
      var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e) continue;
        if (typeof e.__origDetectRadius === 'number') {
          e.detectRadius = e.__origDetectRadius;
        }
        e._stealthBlind = false;
      }
    } catch (err) {}
  }

  // ─────────────────────────────────── shot hook
  function _hookShotFired() {
    var prev = window._onShotFired;
    window._onShotFired = function (p, d) {
      if (prev) prev(p, d);
      _onShot();
    };
  }

  function _onShot() {
    if (!_active) return;
    // Shooting while cloaked: costs 4 extra energy and breaks cloak if out of energy
    _energy -= SHOT_ENERGY_COST;
    if (_energy <= 0) {
      _energy = 0;
      deactivate(true); // broken
    }
    window._stealthEnergy = Math.max(0, _energy);
  }

  // ─────────────────────────────────── damage hook (deactivate on damage)
  function _hookDamage() {
    var names = ['_takeDamageFromWaveEvent', '_takeVehicleRamDamage', '_takeBTRDamage', '_onPlayerDamaged'];
    for (var i = 0; i < names.length; i++) {
      (function (name) {
        var _orig = window[name];
        Object.defineProperty(window, name, {
          configurable: true,
          get: function () { return _orig; },
          set: function (fn) {
            _orig = fn;
          }
        });
        // Override so we intercept calls
        window[name] = typeof _orig === 'function' ? (function (origFn) {
          return function (dmg, pos) {
            if (window._stealthActive) {
              deactivate(true);
            }
            return origFn.call(this, dmg, pos);
          };
        })(_orig) : function (dmg, pos) {
          if (window._stealthActive) {
            deactivate(true);
          }
        };
      })(names[i]);
    }
  }

  // ─────────────────────────────────── activate
  function activate() {
    if (_active) return;
    if (_depleted) {
      _toast('👻 CLOAK depleted — recharging');
      return;
    }
    if (_energy <= 0) {
      _toast('👻 No cloak energy');
      return;
    }

    _active = true;
    window._stealthActive = true;
    window._muteFootsteps = true;

    // Visual
    _applyCanvasFilter(CSS_FILTER_ACTIVE);
    if (_shimmerEl) _shimmerEl.style.display = 'block';

    // Audio
    _startHum();

    // Enemy blind
    _patchEnemyDetection();

    _toast('👻 CLOAK ACTIVE');
  }

  // ─────────────────────────────────── deactivate
  function deactivate(broken) {
    if (!_active) return;
    _active = false;
    window._stealthActive = false;
    window._muteFootsteps = false;

    // Visual
    _clearCanvasFilter();
    if (_shimmerEl) _shimmerEl.style.display = 'none';

    // Decloak flash + shimmer
    _doCloakFlash();

    // Audio zap
    _stopHum();
    _playZap();

    // Restore enemy detection
    _restoreEnemyDetection();

    if (broken) {
      _toast('👻 CLOAK BROKEN');
    } else {
      _toast('👻 CLOAK OFF');
    }
  }

  // ─────────────────────────────────── keyboard
  function _onKeyDown(evt) {
    // Ctrl+S (not in a menu/paused state)
    if (evt.key === 's' && evt.ctrlKey && !evt.shiftKey && !evt.altKey) {
      // Don't steal Ctrl+S from any active input elements
      var tag = document.activeElement ? document.activeElement.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      // Check if menu is open via common game globals
      if (window._menuOpen || window._isPaused || window._inMenu) return;

      evt.preventDefault();
      if (_active) {
        deactivate(false);
      } else {
        activate();
      }
    }
  }

  // ─────────────────────────────────── public API

  function init(scene, camera) {
    _scene  = scene  || window._gameScene  || null;
    _camera = camera || window._camera     || null;

    _injectStyles();
    _createDOMElements();

    // Cache canvas original filter
    _canvasEl = document.querySelector('canvas');
    _originalFilter = _canvasEl ? (_canvasEl.style.filter || '') : '';

    // Hook keyboard
    document.addEventListener('keydown', _onKeyDown, false);

    // Hook shot fired (chain-safe)
    _hookShotFired();

    // Hook damage callbacks — delay to let game-manager set them first
    setTimeout(_hookDamage, 600);

    // Spawn first pickup after 60–90 s
    setTimeout(_spawnPickup, 60000 + Math.random() * 30000);

    // Render initial HUD
    _renderHUD();
  }

  function update(dt) {
    if (!dt || dt <= 0) return;

    // Animate pickup
    _animatePickup(dt);
    _checkPickupCollect();

    if (_active) {
      // Drain energy; running costs 2x
      var drainMult = (window._isSprinting || window._sprinting) ? RUN_ENERGY_MULT : 1;
      _energy -= dt * drainMult;

      if (_energy <= 0) {
        _energy = 0;
        _depleted = true;
        _rechargeTimer = RECHARGE_DELAY;
        _recharging = false;
        deactivate(true);
      }

      // Keep enemy detection patched each frame (new enemies may have spawned)
      _patchEnemyDetection();
    } else {
      // Recharge logic
      if (_depleted) {
        if (_rechargeTimer > 0) {
          _rechargeTimer -= dt;
        } else {
          _depleted = false;
          _recharging = true;
        }
      }
      if (_recharging) {
        _energy += RECHARGE_RATE * dt;
        if (_energy >= MAX_ENERGY) {
          _energy = MAX_ENERGY;
          _recharging = false;
          _toast('👻 CLOAK READY');
        }
      } else if (!_depleted && _energy < MAX_ENERGY) {
        // Slow passive trickle when not depleted (5x slower than normal recharge)
        _energy += (RECHARGE_RATE / 5) * dt;
        if (_energy > MAX_ENERGY) _energy = MAX_ENERGY;
      }
    }

    window._stealthEnergy = Math.max(0, Math.min(MAX_ENERGY, _energy));
    _renderHUD();
  }

  function reset() {
    _active       = false;
    _energy       = MAX_ENERGY;
    _depleted     = false;
    _recharging   = false;
    _rechargeTimer = 0;
    _time         = 0;

    window._stealthActive = false;
    window._stealthEnergy = MAX_ENERGY;
    window._muteFootsteps = false;

    _clearCanvasFilter();
    _stopHum();
    _restoreEnemyDetection();
    _removePickup();

    if (_shimmerEl) _shimmerEl.style.display = 'none';
    if (_flashEl)   _flashEl.style.display   = 'none';
    if (_hudEl)     _hudEl.style.display      = 'none';
  }

  return {
    init:       init,
    update:     update,
    activate:   activate,
    deactivate: deactivate,
    reset:      reset
  };

})();
