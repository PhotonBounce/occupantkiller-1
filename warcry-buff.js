// warcry-buff.js — Warcry Buff for OccupantKiller
// Shift+W activates the warcry shout (60s cooldown, 8s buff window)
// IIFE, all var (no let/const)
//
// Public API:
//   WarcryBuff.init(scene, camera)
//   WarcryBuff.update(dt)
//   WarcryBuff.activate()
//   WarcryBuff.reset()
//
// Globals exposed:
//   window._warcryActive          — boolean, true while buff is running
//   window._warcryDmgMultiplier   — number, 1.4 while active (else 1.0)
//   window._warcrySpeedBonus      — number, 0.3 while active (else 0.0)
//   window._warcryRecoilReduction — number, 0.5 while active (else 0.0)

window.WarcryBuff = (function () {
  'use strict';

  // ─────────────────────────────────── config
  var BUFF_DURATION       = 8;      // seconds the buff lasts
  var COOLDOWN            = 60;     // seconds between activations
  var STUN_RADIUS         = 10;     // units — enemies within range get stunned
  var STUN_DURATION       = 1.5;    // seconds enemies are stunned
  var STUN_TILT           = 0.3;    // radians — mesh rotation.z while stunned

  var DMG_MULTIPLIER      = 1.4;    // damage multiplier while active
  var SPEED_BONUS         = 0.3;    // speed bonus while active
  var RECOIL_REDUCTION    = 0.5;    // recoil reduction while active

  var RING_EXPAND_TIME    = 0.5;    // seconds for one shockwave ring to expand to full radius
  var RING_MAX_RADIUS     = 10;     // units — full radius of shockwave ring
  var RING_INTERVALS      = 0.3;    // seconds between secondary rings
  var RING_COUNT          = 4;      // first ring + 3 secondary rings

  var FOV_NORMAL          = 75;     // default camera FOV
  var FOV_WARCRY          = 85;     // widened FOV during warcry shout
  var FOV_WIDEN_TIME      = 0.2;    // seconds to widen FOV
  var FOV_NARROW_TIME     = 0.4;    // seconds to narrow back (total duration of FOV effect)

  var PULSE_DURATION      = 0.4;    // seconds for screen golden pulse
  var PULSE_COLOR         = 'rgba(255,200,50,0.25)';

  var HUD_ID              = 'warcry-hud';
  var COOLDOWN_BAR_ID     = 'warcry-cooldown-bar';
  var PULSE_ID            = 'warcry-pulse';
  var STYLE_ID            = 'warcry-style';

  // ─────────────────────────────────── state
  var _scene        = null;
  var _camera       = null;

  var _active       = false;
  var _buffTimer    = 0;

  var _onCooldown   = false;
  var _cooldownTimer = 0;

  // FOV animation
  var _fovPhase     = 0;  // 0 = idle, 1 = widening, 2 = narrowing
  var _fovTimer     = 0;

  // Screen pulse
  var _pulseTimer   = 0;

  // DOM handles
  var _hudEl        = null;
  var _cooldownBarEl      = null;
  var _cooldownBarFillEl  = null;
  var _pulseEl      = null;
  var _styleEl      = null;

  // Shockwave ring pool
  var _rings        = [];  // [{mesh, age, delay}]

  // Stunned enemy records for cleanup
  var _stunnedEnemies = []; // [{enemy, timer, origRotZ}]

  // ─────────────────────────────────── global flags (set to neutral defaults)
  window._warcryActive          = false;
  window._warcryDmgMultiplier   = 1.0;
  window._warcrySpeedBonus      = 0.0;
  window._warcryRecoilReduction = 0.0;

  // ─────────────────────────────────── CSS injection
  function _injectStyles() {
    if (_styleEl) return;
    _styleEl = document.createElement('style');
    _styleEl.id = STYLE_ID;
    _styleEl.textContent = [
      '#' + HUD_ID + ' {',
      '  display: none;',
      '  position: fixed;',
      '  top: 14px;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  font-family: monospace;',
      '  font-size: 20px;',
      '  font-weight: bold;',
      '  color: #ffcc00;',
      '  text-shadow: 0 0 10px rgba(255,180,0,0.9), 0 0 22px rgba(255,140,0,0.6);',
      '  z-index: 310;',
      '  pointer-events: none;',
      '  letter-spacing: 3px;',
      '}',
      '#' + COOLDOWN_BAR_ID + ' {',
      '  display: none;',
      '  position: fixed;',
      '  top: 44px;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  width: 160px;',
      '  height: 6px;',
      '  background: rgba(80,60,0,0.6);',
      '  border: 1px solid rgba(255,180,0,0.5);',
      '  border-radius: 3px;',
      '  z-index: 310;',
      '  pointer-events: none;',
      '}',
      '#' + COOLDOWN_BAR_ID + ' .warcry-fill {',
      '  height: 100%;',
      '  background: linear-gradient(90deg, #cc7700, #ffcc00);',
      '  border-radius: 3px;',
      '  width: 0%;',
      '  transition: none;',
      '}',
      '#' + PULSE_ID + ' {',
      '  display: none;',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  background: ' + PULSE_COLOR + ';',
      '  pointer-events: none;',
      '  z-index: 200;',
      '}'
    ].join('\n');
    document.head.appendChild(_styleEl);
  }

  // ─────────────────────────────────── DOM elements
  function _createDOMElements() {
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = HUD_ID;
      _hudEl.textContent = '⚔ WARCRY 8s';
      document.body.appendChild(_hudEl);
    }
    if (!_cooldownBarEl) {
      _cooldownBarEl = document.createElement('div');
      _cooldownBarEl.id = COOLDOWN_BAR_ID;
      _cooldownBarFillEl = document.createElement('div');
      _cooldownBarFillEl.className = 'warcry-fill';
      _cooldownBarEl.appendChild(_cooldownBarFillEl);
      document.body.appendChild(_cooldownBarEl);
    }
    if (!_pulseEl) {
      _pulseEl = document.createElement('div');
      _pulseEl.id = PULSE_ID;
      document.body.appendChild(_pulseEl);
    }
  }

  // ─────────────────────────────────── shockwave rings (Three.js)
  function _spawnRings() {
    if (!_scene || typeof THREE === 'undefined') return;

    var playerY = 0.05; // ground level
    try {
      var gm = window.GameManager;
      if (gm && gm.getPlayer) {
        var pl = gm.getPlayer();
        if (pl && pl.position) {
          playerY = pl.position.y + 0.05;
        }
      }
    } catch (e) {}

    var playerX = 0;
    var playerZ = 0;
    try {
      var gm2 = window.GameManager;
      if (gm2 && gm2.getPlayer) {
        var pl2 = gm2.getPlayer();
        if (pl2 && pl2.position) {
          playerX = pl2.position.x;
          playerZ = pl2.position.z;
        }
      }
    } catch (e) {}

    var i;
    for (i = 0; i < RING_COUNT; i++) {
      (function (ringIndex) {
        var geo = new THREE.RingGeometry(0.01, 0.3, 48);
        // Rotate ring to lie flat on the ground (XZ plane)
        geo.applyMatrix4 ? null : null; // safety no-op
        var mat = new THREE.MeshBasicMaterial({
          color: 0xffaa00,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
          depthWrite: false
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(playerX, playerY, playerZ);
        _scene.add(mesh);
        _rings.push({ mesh: mesh, age: 0, delay: ringIndex * RING_INTERVALS, done: false });
      })(i);
    }
  }

  function _updateRings(dt) {
    var toRemove = [];
    var i;
    for (i = 0; i < _rings.length; i++) {
      var r = _rings[i];
      r.age += dt;
      var effectiveAge = r.age - r.delay;
      if (effectiveAge <= 0) continue;
      if (r.done) continue;

      var progress = effectiveAge / RING_EXPAND_TIME; // 0 → 1
      if (progress >= 1) {
        progress = 1;
        r.done = true;
        toRemove.push(i);
      }
      var radius = progress * RING_MAX_RADIUS;
      var innerR = Math.max(0.01, radius - 0.3);
      // Replace geometry each frame to animate ring expansion
      try {
        r.mesh.geometry.dispose();
        r.mesh.geometry = new THREE.RingGeometry(innerR, radius, 48);
      } catch (e) {}
      r.mesh.material.opacity = 0.85 * (1 - progress * 0.8);
    }
    // Remove finished rings (iterate backwards to preserve indices)
    for (i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      var ring = _rings[idx];
      try {
        ring.mesh.geometry.dispose();
        ring.mesh.material.dispose();
        _scene.remove(ring.mesh);
      } catch (e) {}
      _rings.splice(idx, 1);
    }
  }

  function _clearRings() {
    var i;
    for (i = 0; i < _rings.length; i++) {
      var r = _rings[i];
      try {
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        _scene.remove(r.mesh);
      } catch (e) {}
    }
    _rings = [];
  }

  // ─────────────────────────────────── audio
  function _playWarcrySound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Deep bass thud — 80 Hz sine
      var bassOsc = ctx.createOscillator();
      var bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.value = 80;
      bassGain.gain.setValueAtTime(0, ctx.currentTime);
      bassGain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.03);
      bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(ctx.currentTime);
      bassOsc.stop(ctx.currentTime + 0.65);

      // Metallic ring overtone — ~440 Hz triangle + decay
      var ringOsc = ctx.createOscillator();
      var ringGain = ctx.createGain();
      ringOsc.type = 'triangle';
      ringOsc.frequency.value = 440;
      ringGain.gain.setValueAtTime(0, ctx.currentTime);
      ringGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      ringGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      ringOsc.connect(ringGain);
      ringGain.connect(ctx.destination);
      ringOsc.start(ctx.currentTime);
      ringOsc.stop(ctx.currentTime + 1.3);

      // High harmonic shimmer
      var shimmerOsc = ctx.createOscillator();
      var shimmerGain = ctx.createGain();
      shimmerOsc.type = 'sawtooth';
      shimmerOsc.frequency.value = 880;
      shimmerGain.gain.setValueAtTime(0, ctx.currentTime);
      shimmerGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmerOsc.start(ctx.currentTime);
      shimmerOsc.stop(ctx.currentTime + 0.45);

      // Auto-close context when done
      setTimeout(function () {
        try { ctx.close(); } catch (e) {}
      }, 2000);

    } catch (e) {}
  }

  function _playStunSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 1000);
    } catch (e) {}
  }

  // ─────────────────────────────────── enemy stunner
  function _stunNearbyEnemies() {
    var playerPos = null;
    try {
      var gm = window.GameManager;
      if (gm && gm.getPlayer) {
        var pl = gm.getPlayer();
        if (pl && pl.position) playerPos = pl.position;
      }
    } catch (e) {}

    var enemies = [];
    try {
      if (window.GameManager && window.GameManager.getEnemies) {
        enemies = window.GameManager.getEnemies() || [];
      } else if (window._enemies) {
        enemies = window._enemies;
      }
    } catch (e) {}

    var stunned = 0;
    var i;
    for (i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e._dead || e._dying) continue;
      if (playerPos && e.position) {
        var dx = e.position.x - playerPos.x;
        var dz = e.position.z - playerPos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > STUN_RADIUS) continue;
      }
      // Apply stun globals expected by game-manager / enemies
      e._stunned = true;
      e._stunnedTimer = STUN_DURATION;
      // Visual stumble
      var origZ = (e.mesh && e.mesh.rotation) ? e.mesh.rotation.z : 0;
      if (e.mesh && e.mesh.rotation) {
        e.mesh.rotation.z = STUN_TILT;
      }
      _stunnedEnemies.push({ enemy: e, timer: STUN_DURATION, origRotZ: origZ });
      stunned++;
    }
    if (stunned > 0) _playStunSound();
  }

  function _updateStunnedEnemies(dt) {
    var toRemove = [];
    var i;
    for (i = 0; i < _stunnedEnemies.length; i++) {
      var rec = _stunnedEnemies[i];
      rec.timer -= dt;
      if (rec.timer <= 0) {
        // Restore rotation
        try {
          if (rec.enemy.mesh && rec.enemy.mesh.rotation) {
            rec.enemy.mesh.rotation.z = rec.origRotZ;
          }
          rec.enemy._stunned = false;
        } catch (e) {}
        toRemove.push(i);
      }
    }
    for (i = toRemove.length - 1; i >= 0; i--) {
      _stunnedEnemies.splice(toRemove[i], 1);
    }
  }

  // ─────────────────────────────────── FOV animation
  function _startFovEffect() {
    _fovPhase = 1;
    _fovTimer = 0;
  }

  function _updateFov(dt) {
    if (_fovPhase === 0) return;
    if (!_camera) return;
    _fovTimer += dt;

    if (_fovPhase === 1) {
      // Widening phase
      var t = Math.min(_fovTimer / FOV_WIDEN_TIME, 1);
      _camera.fov = FOV_NORMAL + (FOV_WARCRY - FOV_NORMAL) * t;
      _camera.updateProjectionMatrix();
      if (_fovTimer >= FOV_WIDEN_TIME) {
        _fovPhase = 2;
        _fovTimer = 0;
      }
    } else if (_fovPhase === 2) {
      // Narrowing phase
      var t2 = Math.min(_fovTimer / (FOV_NARROW_TIME - FOV_WIDEN_TIME), 1);
      _camera.fov = FOV_WARCRY + (FOV_NORMAL - FOV_WARCRY) * t2;
      _camera.updateProjectionMatrix();
      if (_fovTimer >= (FOV_NARROW_TIME - FOV_WIDEN_TIME)) {
        _fovPhase = 0;
        _camera.fov = FOV_NORMAL;
        _camera.updateProjectionMatrix();
      }
    }
  }

  // ─────────────────────────────────── screen pulse
  function _triggerPulse() {
    if (!_pulseEl) return;
    _pulseTimer = PULSE_DURATION;
    _pulseEl.style.display = 'block';
    _pulseEl.style.opacity = '1';
  }

  function _updatePulse(dt) {
    if (_pulseTimer <= 0) return;
    _pulseTimer -= dt;
    if (_pulseTimer <= 0) {
      _pulseTimer = 0;
      if (_pulseEl) {
        _pulseEl.style.display = 'none';
        _pulseEl.style.opacity = '0';
      }
    } else {
      var opacity = _pulseTimer / PULSE_DURATION;
      if (_pulseEl) _pulseEl.style.opacity = String(opacity);
    }
  }

  // ─────────────────────────────────── HUD update
  function _updateHUD() {
    if (_active) {
      // Show countdown
      if (_hudEl) {
        var secs = Math.ceil(_buffTimer);
        _hudEl.textContent = '⚔ WARCRY ' + secs + 's';
        _hudEl.style.display = 'block';
      }
      if (_cooldownBarEl) _cooldownBarEl.style.display = 'none';
    } else if (_onCooldown) {
      // Show cooldown bar
      if (_hudEl) _hudEl.style.display = 'none';
      if (_cooldownBarEl) {
        _cooldownBarEl.style.display = 'block';
        var pct = (1 - _cooldownTimer / COOLDOWN) * 100;
        if (_cooldownBarFillEl) _cooldownBarFillEl.style.width = pct + '%';
      }
    } else {
      if (_hudEl) _hudEl.style.display = 'none';
      if (_cooldownBarEl) _cooldownBarEl.style.display = 'none';
    }
  }

  // ─────────────────────────────────── deactivate buff effects
  function _deactivate() {
    _active = false;
    _buffTimer = 0;

    window._warcryActive          = false;
    window._warcryDmgMultiplier   = 1.0;
    window._warcrySpeedBonus      = 0.0;
    window._warcryRecoilReduction = 0.0;

    // Start cooldown
    _onCooldown = true;
    _cooldownTimer = COOLDOWN;
  }

  // ─────────────────────────────────── keyboard handler
  function _onKeyDown(evt) {
    if ((evt.key === 'W' || evt.key === 'w') && evt.shiftKey) {
      if (!_active && !_onCooldown) {
        activate();
      }
    }
  }

  // ─────────────────────────────────── public API

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _injectStyles();
    _createDOMElements();

    document.addEventListener('keydown', _onKeyDown);
  }

  function update(dt) {
    if (!dt || dt <= 0) return;

    // Animate shockwave rings
    _updateRings(dt);

    // Update stunned enemy timers
    _updateStunnedEnemies(dt);

    // FOV animation
    _updateFov(dt);

    // Screen pulse
    _updatePulse(dt);

    if (_active) {
      _buffTimer -= dt;
      if (_buffTimer <= 0) {
        _deactivate();
      }
    }

    if (_onCooldown) {
      _cooldownTimer -= dt;
      if (_cooldownTimer <= 0) {
        _cooldownTimer = 0;
        _onCooldown = false;
      }
    }

    _updateHUD();
  }

  function activate() {
    if (_active || _onCooldown) return;

    _active    = true;
    _buffTimer = BUFF_DURATION;

    // Apply global buff flags
    window._warcryActive          = true;
    window._warcryDmgMultiplier   = DMG_MULTIPLIER;
    window._warcrySpeedBonus      = SPEED_BONUS;
    window._warcryRecoilReduction = RECOIL_REDUCTION;

    // Shockwave rings
    _spawnRings();

    // Stun nearby enemies
    _stunNearbyEnemies();

    // FOV effect
    _startFovEffect();

    // Screen pulse
    _triggerPulse();

    // Audio
    _playWarcrySound();

    // Toast notification
    try {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('⚔ WARCRY ACTIVATED', '#ffcc00');
      }
    } catch (e) {}
  }

  function reset() {
    _active       = false;
    _buffTimer    = 0;
    _onCooldown   = false;
    _cooldownTimer = 0;
    _fovPhase     = 0;
    _fovTimer     = 0;
    _pulseTimer   = 0;

    window._warcryActive          = false;
    window._warcryDmgMultiplier   = 1.0;
    window._warcrySpeedBonus      = 0.0;
    window._warcryRecoilReduction = 0.0;

    // Clean up stun records
    var i;
    for (i = 0; i < _stunnedEnemies.length; i++) {
      var rec = _stunnedEnemies[i];
      try {
        if (rec.enemy.mesh && rec.enemy.mesh.rotation) {
          rec.enemy.mesh.rotation.z = rec.origRotZ;
        }
        rec.enemy._stunned = false;
      } catch (e) {}
    }
    _stunnedEnemies = [];

    _clearRings();

    // Restore FOV
    if (_camera) {
      _camera.fov = FOV_NORMAL;
      try { _camera.updateProjectionMatrix(); } catch (e) {}
    }

    if (_hudEl) _hudEl.style.display = 'none';
    if (_cooldownBarEl) _cooldownBarEl.style.display = 'none';
    if (_pulseEl) _pulseEl.style.display = 'none';
  }

  return {
    init:     init,
    update:   update,
    activate: activate,
    reset:    reset
  };

})();
