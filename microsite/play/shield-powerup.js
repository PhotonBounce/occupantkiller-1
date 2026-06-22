// ============================================================
//  shield-powerup.js — Energy Shield Power-up
//  Spawns 2 cyan pickup orbs; collecting one grants a 10-second
//  energy shield that absorbs up to 60 damage before breaking.
//  Public API: init, update, activate, reset
// ============================================================
window.ShieldPowerup = (function () {
  'use strict';

  /* ── Private state ─────────────────────────────────────────── */
  var _scene        = null;
  var _camera       = null;

  /* Pickup spawn positions (world-space XZ, Y auto-set to ground) */
  var SPAWN_POSITIONS = [
    { x:  8, y: 0.4, z:  8 },
    { x: -8, y: 0.4, z: -8 }
  ];

  var PICKUP_RADIUS   = 1.2;   // collect distance (units)
  var MAX_SHIELD_HP   = 60;    // damage capacity
  var SHIELD_DURATION = 10;    // seconds
  var RESPAWN_DELAY   = 90;    // seconds before pickup reappears

  /* Per-pickup state */
  var _pickups = [];           // [{ mesh, light, alive, respawnTimer }]

  /* Pulse animation */
  var _pulseTime = 0;

  /* Shield state */
  var _active       = false;
  var _shieldHP     = 0;
  var _shieldTimer  = 0;

  /* Break VFX particles */
  var _particles    = [];      // [{ mesh, vel, life }]

  /* AudioContext for break sound */
  var _audioCtx     = null;

  /* DOM */
  var _hudBar       = null;    // cyan HP bar container (injected)
  var _hudFill      = null;    // inner fill element
  var _hudLabel     = null;    // "SHIELD" text
  var _borderEl     = null;    // screen-edge glow div
  var _canvas       = null;    // game canvas (for box-shadow glow)

  /* ── Build a single pickup mesh ───────────────────────────── */
  function _buildPickupMesh() {
    var geo  = new THREE.SphereGeometry(0.3, 12, 12);
    var mat  = new THREE.MeshStandardMaterial({
      color:      0x00FFFF,
      emissive:   0x00CCCC,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity:    0.92,
      metalness:  0.3,
      roughness:  0.2
    });
    return new THREE.Mesh(geo, mat);
  }

  /* ── Build a pulsing PointLight ────────────────────────────── */
  function _buildPickupLight() {
    var light = new THREE.PointLight(0x00FFFF, 1.2, 6);
    return light;
  }

  /* ── Inject HUD elements ───────────────────────────────────── */
  function _buildHUD() {
    /* Shield HP bar — top-right corner */
    _hudBar = document.createElement('div');
    _hudBar.id = 'shield-powerup-bar';
    _hudBar.style.cssText = [
      'display:none',
      'position:fixed',
      'top:8px',
      'right:8px',
      'width:140px',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(0,255,255,0.6)',
      'border-radius:4px',
      'padding:3px 6px',
      'z-index:220',
      'pointer-events:none',
      'font-family:monospace',
      'font-size:11px',
      'color:#00ffff'
    ].join(';');

    _hudLabel = document.createElement('div');
    _hudLabel.textContent = 'SHIELD';
    _hudLabel.style.cssText = 'margin-bottom:2px;letter-spacing:1px;text-shadow:0 0 6px #00ffff';
    _hudBar.appendChild(_hudLabel);

    var trackEl = document.createElement('div');
    trackEl.style.cssText = [
      'width:100%',
      'height:7px',
      'background:rgba(0,255,255,0.15)',
      'border-radius:3px',
      'overflow:hidden'
    ].join(';');

    _hudFill = document.createElement('div');
    _hudFill.style.cssText = [
      'height:100%',
      'width:100%',
      'background:linear-gradient(90deg,#00ccff,#00ffff)',
      'border-radius:3px',
      'transition:width 0.1s linear',
      'box-shadow:0 0 4px #00ffff'
    ].join(';');

    trackEl.appendChild(_hudFill);
    _hudBar.appendChild(trackEl);
    document.body.appendChild(_hudBar);

    /* Blue screen-edge border while shield active */
    _borderEl = document.createElement('div');
    _borderEl.id = 'shield-powerup-border';
    _borderEl.style.cssText = [
      'display:none',
      'position:fixed',
      'top:0','left:0','right:0','bottom:0',
      'pointer-events:none',
      'z-index:187',
      'box-shadow:inset 0 0 36px 12px rgba(0,255,255,0.25)',
      'border:2px solid rgba(0,255,255,0.35)',
      'transition:opacity 0.2s'
    ].join(';');
    document.body.appendChild(_borderEl);
  }

  /* ── Show / hide HUD ─────────────────────────────────────────── */
  function _showHUD() {
    if (_hudBar)    _hudBar.style.display    = 'block';
    if (_borderEl)  _borderEl.style.display  = 'block';
    /* Canvas glow */
    _canvas = _canvas || document.querySelector('canvas');
    if (_canvas) {
      _canvas.style.boxShadow = '0 0 0 4px rgba(0,255,255,0.3)';
    }
  }

  function _hideHUD() {
    if (_hudBar)    _hudBar.style.display    = 'none';
    if (_borderEl)  _borderEl.style.display  = 'none';
    if (_canvas) {
      _canvas.style.boxShadow = '';
    }
  }

  function _updateHUDFill() {
    if (!_hudFill) return;
    var pct = Math.max(0, Math.min(100, (_shieldHP / MAX_SHIELD_HP) * 100));
    _hudFill.style.width = pct + '%';
  }

  /* ── Shatter audio ───────────────────────────────────────────── */
  function _playShatterSound() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;
      /* Short high-frequency glassy noise burst */
      var bufLen = Math.floor(ctx.sampleRate * 0.18);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        /* White noise with exponential decay */
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 2.5);
      }

      var src = ctx.createBufferSource();
      src.buffer = buf;

      /* High-pass filter to keep it glassy/high */
      var hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 3200;

      /* Gain */
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.55, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      src.connect(hpf);
      hpf.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {
      /* AudioContext unavailable — silent fail */
    }
  }

  /* ── Break VFX: 6 cyan sphere particles ─────────────────────── */
  function _spawnBreakParticles(pos) {
    var mat = new THREE.MeshStandardMaterial({
      color:    0x00FFFF,
      emissive: 0x00CCCC,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.9
    });

    for (var i = 0; i < 6; i++) {
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat.clone());
      mesh.position.copy(pos);
      _scene.add(mesh);

      /* Random outward velocity */
      var vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 6
      );

      _particles.push({ mesh: mesh, vel: vel, life: 0.8 });
    }
  }

  /* ── Show toast notification ─────────────────────────────────── */
  function _showToast(msg) {
    /* Try HUD.notifyPickup first (existing API) */
    if (window.HUD && typeof HUD.notifyPickup === 'function') {
      HUD.notifyPickup(msg, '#00ffff');
      return;
    }
    /* Fallback: simple floating div */
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#00ffff',
      'font-family:monospace',
      'font-size:16px',
      'padding:8px 18px',
      'border-radius:6px',
      'border:1px solid #00ffff',
      'z-index:9999',
      'pointer-events:none',
      'text-shadow:0 0 8px #00ffff'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2200);
  }

  /* ── Shield break sequence ───────────────────────────────────── */
  function _breakShield() {
    _active      = false;
    _shieldHP    = 0;
    _shieldTimer = 0;

    window._shieldActive = false;
    window._shieldHP     = 0;

    _hideHUD();
    _showToast('SHIELD BROKEN!');
    _playShatterSound();

    /* Particles at player position */
    var playerPos = new THREE.Vector3(0, 1, 0);
    if (window.GameManager && typeof GameManager.getPlayerPosition === 'function') {
      playerPos = GameManager.getPlayerPosition();
    } else if (window._playerPosition) {
      playerPos = window._playerPosition.clone();
    }
    if (_scene) _spawnBreakParticles(playerPos);
  }

  /* ── Public: activate ────────────────────────────────────────── */
  function activate() {
    _active      = true;
    _shieldHP    = MAX_SHIELD_HP;
    _shieldTimer = SHIELD_DURATION;

    window._shieldActive = true;
    window._shieldHP     = _shieldHP;

    _showHUD();
    _updateHUDFill();
    _showToast('SHIELD ACTIVE [10s]');
  }

  /* ── Public: init ─────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _buildHUD();

    /* Create pickup meshes */
    for (var i = 0; i < SPAWN_POSITIONS.length; i++) {
      var pos  = SPAWN_POSITIONS[i];
      var mesh = _buildPickupMesh();
      mesh.position.set(pos.x, pos.y, pos.z);
      scene.add(mesh);

      var light = _buildPickupLight();
      light.position.set(pos.x, pos.y + 0.3, pos.z);
      scene.add(light);

      _pickups.push({
        mesh:         mesh,
        light:        light,
        spawnPos:     { x: pos.x, y: pos.y, z: pos.z },
        alive:        true,
        respawnTimer: 0
      });
    }

    /* Expose globals */
    window._shieldActive = false;
    window._shieldHP     = 0;
  }

  /* ── Public: update (called each frame) ──────────────────────── */
  function update(delta) {
    if (!_scene || !_camera) return;

    _pulseTime += delta;

    var playerPos = _camera.position;

    /* ── Pickup animation & collection ── */
    for (var i = 0; i < _pickups.length; i++) {
      var pk = _pickups[i];

      if (!pk.alive) {
        /* Countdown to respawn */
        pk.respawnTimer -= delta;
        if (pk.respawnTimer <= 0) {
          /* Respawn */
          pk.mesh.position.set(pk.spawnPos.x, pk.spawnPos.y, pk.spawnPos.z);
          pk.light.position.set(pk.spawnPos.x, pk.spawnPos.y + 0.3, pk.spawnPos.z);
          pk.mesh.visible  = true;
          pk.light.visible = true;
          pk.alive         = true;
        }
        continue;
      }

      /* Bob up/down */
      pk.mesh.position.y  = pk.spawnPos.y + Math.sin(_pulseTime * 2.2 + i * Math.PI) * 0.12;
      pk.mesh.rotation.y += delta * 1.4;

      /* Pulsing light intensity */
      pk.light.intensity = 0.7 + 0.6 * Math.sin(_pulseTime * 3.0 + i);
      pk.light.position.y = pk.mesh.position.y + 0.3;

      /* Proximity check — collect if within PICKUP_RADIUS */
      var dx = playerPos.x - pk.mesh.position.x;
      var dy = playerPos.y - pk.mesh.position.y;
      var dz = playerPos.z - pk.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < PICKUP_RADIUS && !_active) {
        /* Collect */
        pk.alive         = false;
        pk.respawnTimer  = RESPAWN_DELAY;
        pk.mesh.visible  = false;
        pk.light.visible = false;
        activate();
      }
    }

    /* ── Shield tick ── */
    if (_active) {
      _shieldTimer -= delta;
      window._shieldHP = _shieldHP;

      _updateHUDFill();

      if (_shieldTimer <= 0 && _active) {
        /* Timer expired — deactivate cleanly (no break VFX for natural expiry) */
        _active      = false;
        _shieldHP    = 0;
        _shieldTimer = 0;

        window._shieldActive = false;
        window._shieldHP     = 0;

        _hideHUD();
        _showToast('SHIELD EXPIRED');
      }
    }

    /* ── Break particles ── */
    for (var j = _particles.length - 1; j >= 0; j--) {
      var p = _particles[j];
      p.life -= delta;
      if (p.life <= 0) {
        _scene.remove(p.mesh);
        _particles.splice(j, 1);
        continue;
      }
      /* Move outward, gravity */
      p.vel.y -= delta * 9.8;
      p.mesh.position.x += p.vel.x * delta;
      p.mesh.position.y += p.vel.y * delta;
      p.mesh.position.z += p.vel.z * delta;
      /* Fade out */
      p.mesh.material.opacity = Math.max(0, p.life / 0.8);
    }
  }

  /* ── Public: absorb damage while shield is active ─────────────── */
  /* Called externally (or hooked via window._shieldAbsorbDamage).  */
  /* Returns remaining damage after shield absorbs what it can.     */
  function absorbDamage(dmg) {
    if (!_active) return dmg;

    if (_shieldHP >= dmg) {
      _shieldHP -= dmg;
      window._shieldHP = _shieldHP;
      _updateHUDFill();
      if (_shieldHP <= 0) {
        _breakShield();
      }
      return 0; /* all absorbed */
    } else {
      /* Partial — shield breaks, remainder passes through */
      var remaining = dmg - _shieldHP;
      _shieldHP = 0;
      _breakShield();
      return remaining;
    }
  }

  /* ── Public: reset ────────────────────────────────────────────── */
  function reset() {
    _active      = false;
    _shieldHP    = 0;
    _shieldTimer = 0;

    window._shieldActive = false;
    window._shieldHP     = 0;

    _hideHUD();

    /* Remove break particles */
    for (var j = 0; j < _particles.length; j++) {
      if (_scene) _scene.remove(_particles[j].mesh);
    }
    _particles = [];

    /* Restore pickups */
    for (var i = 0; i < _pickups.length; i++) {
      var pk = _pickups[i];
      pk.alive         = true;
      pk.respawnTimer  = 0;
      if (pk.mesh)  pk.mesh.visible  = true;
      if (pk.light) pk.light.visible = true;
      if (pk.mesh)  pk.mesh.position.set(pk.spawnPos.x, pk.spawnPos.y, pk.spawnPos.z);
      if (pk.light) pk.light.position.set(pk.spawnPos.x, pk.spawnPos.y + 0.3, pk.spawnPos.z);
    }
  }

  /* ── Expose absorb hook on window for game-manager to call ───── */
  window._shieldAbsorbDamage = absorbDamage;

  return {
    init:         init,
    update:       update,
    activate:     activate,
    reset:        reset,
    absorbDamage: absorbDamage,
    isActive:     function () { return _active; },
    getShieldHP:  function () { return _shieldHP; }
  };
})();
