/* ============================================================
 *  DOUBLE-JUMP.JS — Unlockable double-jump ability with jet-boost visual
 *
 *  API:
 *    DoubleJump.init()      — call once after DOM ready
 *    DoubleJump.update(dt)  — call each frame with delta-time seconds
 *    DoubleJump.reset()     — reset jump counter and clear particles
 *    DoubleJump.isEnabled() — returns true if double-jump is unlocked
 *    DoubleJump.enable()    — unlock double-jump (called by powerup systems)
 *
 *  Globals set/read:
 *    window._doubleJumpEnabled  {boolean} — true when ability is unlocked
 *    window._playerAirborne     {boolean} — true while player is in the air
 *    window._playerVelocityY    {number}  — player vertical velocity
 *    window._camera             — Three.js camera reference
 *    window._gameScene          — Three.js scene reference
 *    window._audioCtx           — shared AudioContext
 *    window.player              — player object (position, score, height)
 *    window.HUD                 — HUD system for toasts
 * ============================================================ */
window.DoubleJump = (function () {
  'use strict';

  /* ── Config ─────────────────────────────────── */
  var CFG = {
    SECOND_JUMP_VY:     14,      // vertical velocity for second jump
    FIRST_JUMP_DETECT:  2,       // velocity threshold to detect a first jump
    GROUND_Y_THRESH:    0.2,     // how close to ground level to reset jumps
    TRAIL_DURATION:     0.5,     // seconds afterburner trail stays active
    TRAIL_LIGHTS:       5,       // number of fading lights in trail
    TRAIL_LIGHT_INT:    3,       // PointLight intensity
    TRAIL_LIGHT_DIST:   4,       // PointLight distance
    TRAIL_LIGHT_COLOR:  0xFF8800,// orange
    PARTICLE_COUNT:     8,       // jet boost particles
    PARTICLE_LIFE:      0.6,     // seconds particles live
    PICKUP_RADIUS:      1.2,     // collection radius for bootpack
    PICKUP_FLOAT_SPD:   1.2,     // radians/sec rotation for pickup
    PICKUP_BOB_SPD:     2.0,     // vertical bob cycles/sec
    PICKUP_BOB_AMP:     0.15,    // bob amplitude in units
    AUDIO_WHOOSH_FREQ1: 200,     // Hz start for whoosh
    AUDIO_WHOOSH_FREQ2: 600,     // Hz end for whoosh
    AUDIO_WHOOSH_DUR:   0.15,    // seconds whoosh
    AUDIO_POP_FREQ:     800,     // Hz ignition pop
    AUDIO_POP_DUR:      0.08,    // seconds pop
    AUTO_UNLOCK_WAVE:   3        // wave after which ability auto-unlocks
  };

  /* ── State ──────────────────────────────────── */
  var _enabled        = false;
  var _jumpsUsed      = 0;
  var _wasAirborne    = false;
  var _particles      = [];
  var _trailLights    = [];
  var _trailTimer     = 0;
  var _trailActive    = false;
  var _audioCtx       = null;
  var _hudEl          = null;
  var _scene          = null;
  var _camera         = null;
  var _pickupMesh     = null;
  var _pickupBaseY    = 0;
  var _pickupAge      = 0;

  /* ── Scene / Camera accessors ───────────────── */
  function _getScene() {
    return _scene || window._gameScene || window._scene || null;
  }

  function _getCamera() {
    return _camera || window._camera || null;
  }

  function _getPlayer() {
    return window.player || null;
  }

  function _getPlayerPos() {
    var p = _getPlayer();
    if (p && p.position) return p.position;
    var cam = _getCamera();
    if (cam) return cam.position;
    return null;
  }

  /* ── Ground level detection ─────────────────── */
  function _isNearGround() {
    var pos = _getPlayerPos();
    if (!pos) return false;
    // Use player height offset; default ground reference is y ~= 1.8 (eye height)
    var p = _getPlayer();
    var h = (p && p.height) ? p.height : 1.8;
    var groundY = h; // approximate ground-level eye height
    return Math.abs(pos.y - groundY) <= CFG.GROUND_Y_THRESH;
  }

  /* ── Audio ──────────────────────────────────── */
  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        window._audioCtx = _audioCtx;
      } catch (e) { return null; }
    }
    return _audioCtx;
  }

  function _playJumpAudio() {
    try {
      var ctx = _getAudioCtx();
      if (!ctx) return;
      var now = ctx.currentTime;

      // Whoosh: 200→600Hz sweep
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(CFG.AUDIO_WHOOSH_FREQ1, now);
      osc1.frequency.exponentialRampToValueAtTime(CFG.AUDIO_WHOOSH_FREQ2, now + CFG.AUDIO_WHOOSH_DUR);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + CFG.AUDIO_WHOOSH_DUR);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + CFG.AUDIO_WHOOSH_DUR);

      // Ignition pop: short 800Hz sine burst
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(CFG.AUDIO_POP_FREQ, now + CFG.AUDIO_WHOOSH_DUR);
      gain2.gain.setValueAtTime(0.0, now);
      gain2.gain.setValueAtTime(0.5, now + CFG.AUDIO_WHOOSH_DUR);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + CFG.AUDIO_WHOOSH_DUR + CFG.AUDIO_POP_DUR);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + CFG.AUDIO_WHOOSH_DUR);
      osc2.stop(now + CFG.AUDIO_WHOOSH_DUR + CFG.AUDIO_POP_DUR);
    } catch (e) {
      // Audio not available — silent fail
    }
  }

  /* ── Jet-boost particles ────────────────────── */
  function _spawnJetParticles() {
    var sc = _getScene();
    if (!sc || typeof THREE === 'undefined') return;
    var pos = _getPlayerPos();
    if (!pos) return;

    var p = _getPlayer();
    var h = (p && p.height) ? p.height : 1.8;
    var feetY = pos.y - h + 0.1; // approximate feet level

    for (var i = 0; i < CFG.PARTICLE_COUNT; i++) {
      var geo = new THREE.SphereGeometry(0.05, 4, 4);
      var isOrange = (i % 2 === 0);
      var mat = new THREE.MeshBasicMaterial({
        color: isOrange ? 0xFF6600 : 0xFFFFDD,
        transparent: true,
        opacity: 1.0
      });
      var mesh = new THREE.Mesh(geo, mat);
      var spread = 0.25;
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * spread,
        feetY,
        pos.z + (Math.random() - 0.5) * spread
      );
      sc.add(mesh);

      // Particles shoot downward with slight horizontal spread
      var angle = (i / CFG.PARTICLE_COUNT) * Math.PI * 2;
      _particles.push({
        mesh: mesh,
        age: 0,
        vx: Math.cos(angle) * 0.8,
        vy: -(2.5 + Math.random() * 2.0),
        vz: Math.sin(angle) * 0.8
      });
    }
  }

  function _updateParticles(dt) {
    var sc = _getScene();
    for (var i = _particles.length - 1; i >= 0; i--) {
      var d = _particles[i];
      d.age += dt;
      var t = d.age / CFG.PARTICLE_LIFE;
      if (t >= 1) {
        if (sc) sc.remove(d.mesh);
        if (d.mesh.geometry) d.mesh.geometry.dispose();
        if (d.mesh.material) d.mesh.material.dispose();
        _particles.splice(i, 1);
        continue;
      }
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      d.mesh.material.opacity = 1.0 - t;
      // Decelerate
      d.vy *= (1 - dt * 1.5);
    }
  }

  /* ── Afterburner trail ──────────────────────── */
  function _spawnTrailLight() {
    var sc = _getScene();
    if (!sc || typeof THREE === 'undefined') return;
    var pos = _getPlayerPos();
    if (!pos) return;

    var light = new THREE.PointLight(CFG.TRAIL_LIGHT_COLOR, CFG.TRAIL_LIGHT_INT, CFG.TRAIL_LIGHT_DIST);
    var p = _getPlayer();
    var h = (p && p.height) ? p.height : 1.8;
    light.position.set(pos.x, pos.y - h + 0.3, pos.z);
    sc.add(light);

    _trailLights.push({
      light: light,
      age: 0,
      maxAge: CFG.TRAIL_DURATION
    });

    // Keep only the most recent TRAIL_LIGHTS entries
    if (_trailLights.length > CFG.TRAIL_LIGHTS) {
      var old = _trailLights.shift();
      if (sc) sc.remove(old.light);
    }
  }

  function _updateTrail(dt) {
    var sc = _getScene();
    for (var i = _trailLights.length - 1; i >= 0; i--) {
      var t = _trailLights[i];
      t.age += dt;
      var frac = t.age / t.maxAge;
      if (frac >= 1) {
        if (sc) sc.remove(t.light);
        _trailLights.splice(i, 1);
        continue;
      }
      t.light.intensity = CFG.TRAIL_LIGHT_INT * (1 - frac);
    }
  }

  /* ── HUD badge ──────────────────────────────── */
  function _buildHUD() {
    if (_hudEl) return;
    var el = document.createElement('div');
    el.id = 'double-jump-hud';
    el.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.55)',
      'color:#FF8800',
      'font-family:monospace',
      'font-size:12px',
      'letter-spacing:2px',
      'padding:4px 10px',
      'border-radius:4px',
      'border:1px solid #FF8800',
      'pointer-events:none',
      'z-index:900',
      'display:none',
      'text-shadow:0 0 6px #FF8800',
      'box-shadow:0 0 8px rgba(255,136,0,0.4)'
    ].join(';');
    el.textContent = '🦋 BOOST';
    document.body.appendChild(el);
    _hudEl = el;
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_enabled) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    // Bright when second jump is ready while airborne
    if (window._playerAirborne && _jumpsUsed === 1) {
      _hudEl.style.color = '#FFD700';
      _hudEl.style.borderColor = '#FFD700';
      _hudEl.style.textShadow = '0 0 10px #FFD700';
      _hudEl.style.boxShadow = '0 0 12px rgba(255,215,0,0.7)';
    } else {
      _hudEl.style.color = '#FF8800';
      _hudEl.style.borderColor = '#FF8800';
      _hudEl.style.textShadow = '0 0 6px #FF8800';
      _hudEl.style.boxShadow = '0 0 8px rgba(255,136,0,0.4)';
    }
  }

  /* ── Bootpack pickup ────────────────────────── */
  function _spawnBootpackPickup() {
    var sc = _getScene();
    if (!sc || typeof THREE === 'undefined') return;
    if (_pickupMesh) return; // already spawned

    var group = new THREE.Group();

    // Main sphere — orange bootpack core
    var coreGeo = new THREE.SphereGeometry(0.25, 12, 12);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
    var coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Wing left
    var wingGeo = new THREE.BoxGeometry(0.3, 0.05, 0.15);
    var wingMat = new THREE.MeshBasicMaterial({ color: 0xFF8800 });
    var wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-0.28, 0, 0);
    wingL.rotation.z = 0.2;
    group.add(wingL);

    // Wing right
    var wingR = new THREE.Mesh(wingGeo.clone(), wingMat.clone());
    wingR.position.set(0.28, 0, 0);
    wingR.rotation.z = -0.2;
    group.add(wingR);

    // Random spawn position — flat area near player or random in level bounds
    var spawnX = (Math.random() - 0.5) * 30;
    var spawnZ = (Math.random() - 0.5) * 30;
    var spawnY = 1.5;
    group.position.set(spawnX, spawnY, spawnZ);
    _pickupBaseY = spawnY;
    _pickupAge = 0;

    sc.add(group);
    _pickupMesh = group;
  }

  function _updatePickup(dt) {
    if (!_pickupMesh) return;
    _pickupAge += dt;

    // Rotation
    _pickupMesh.rotation.y += CFG.PICKUP_FLOAT_SPD * dt;

    // Bob
    _pickupMesh.position.y = _pickupBaseY + Math.sin(_pickupAge * CFG.PICKUP_BOB_SPD * Math.PI * 2) * CFG.PICKUP_BOB_AMP;

    // Proximity collection check
    var pos = _getPlayerPos();
    if (!pos) return;
    var dx = pos.x - _pickupMesh.position.x;
    var dy = pos.y - _pickupMesh.position.y;
    var dz = pos.z - _pickupMesh.position.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist <= CFG.PICKUP_RADIUS) {
      _removePickup();
      enable();
    }
  }

  function _removePickup() {
    var sc = _getScene();
    if (!_pickupMesh) return;
    if (sc) sc.remove(_pickupMesh);
    // Dispose children
    _pickupMesh.traverse(function (obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    _pickupMesh = null;
  }

  /* ── Double-jump execution ──────────────────── */
  function _doDoubleJump() {
    _jumpsUsed = 2;
    window._playerVelocityY = CFG.SECOND_JUMP_VY;

    _playJumpAudio();
    _spawnJetParticles();

    // Start afterburner trail
    _trailActive = true;
    _trailTimer = 0;

    _updateHUD();
  }

  /* ── Keydown handler ────────────────────────── */
  function _onKeyDown(e) {
    if (e.code !== 'Space') return;
    if (!_enabled) return;
    if (!window._playerAirborne) return;
    if (_jumpsUsed >= 2) return;

    e.preventDefault();
    _doDoubleJump();
  }

  /* ── Wave auto-unlock check ─────────────────── */
  function _checkAutoUnlock() {
    if (_enabled) return;
    var wave = window._currentWave || window._wave || 0;
    if (wave > CFG.AUTO_UNLOCK_WAVE) {
      enable();
    }
  }

  /* ── Public: enable() ───────────────────────── */
  function enable(scene, camera) {
    if (_enabled) return;
    _enabled = true;
    window._doubleJumpEnabled = true;

    // Optional scene/camera override
    if (scene) _scene = scene;
    if (camera) _camera = camera;

    // Score bonus
    if (window.player) {
      window.player.score = (window.player.score || 0) + 100;
    }

    // Toast
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('JETPACK BOOTS EQUIPPED! +100');
    }

    _updateHUD();
  }

  /* ── Public: isEnabled() ────────────────────── */
  function isEnabled() {
    return _enabled;
  }

  /* ── Public: init(scene, camera) ────────────── */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene || window._scene  || null;
    _camera = camera || window._camera || null;

    window._doubleJumpEnabled = false;
    _enabled   = false;
    _jumpsUsed = 0;
    _wasAirborne = false;

    window.addEventListener('keydown', _onKeyDown);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _buildHUD);
    } else {
      _buildHUD();
    }
  }

  /* ── Public: update(dt) ─────────────────────── */
  function update(dt) {
    // Late-bind scene/camera if not yet set
    if (!_scene)  _scene  = window._gameScene || window._scene  || null;
    if (!_camera) _camera = window._camera || null;

    var airborne = !!window._playerAirborne;
    var vy = window._playerVelocityY || 0;

    // Detect first jump: player just became airborne with upward velocity
    if (airborne && !_wasAirborne && vy > CFG.FIRST_JUMP_DETECT) {
      if (_jumpsUsed < 1) {
        _jumpsUsed = 1;
      }
    }

    // Ground reset
    if (!airborne && _wasAirborne) {
      _jumpsUsed = 0;
    }
    // Also reset if we detect we are near ground even if _playerAirborne is still set
    if (!airborne && _isNearGround()) {
      _jumpsUsed = 0;
    }

    _wasAirborne = airborne;

    // Particles
    _updateParticles(dt);

    // Afterburner trail
    if (_trailActive) {
      _trailTimer += dt;
      // Spawn lights periodically while trail is active
      if (_trailTimer < CFG.TRAIL_DURATION) {
        _spawnTrailLight();
      } else {
        _trailActive = false;
      }
    }
    _updateTrail(dt);

    // Pickup
    _updatePickup(dt);

    // Auto-unlock check
    _checkAutoUnlock();

    // HUD
    _updateHUD();
  }

  /* ── Public: reset() ────────────────────────── */
  function reset() {
    _jumpsUsed = 0;
    _wasAirborne = false;
    _trailActive = false;
    _trailTimer = 0;

    // Clear particles
    var sc = _getScene();
    for (var i = 0; i < _particles.length; i++) {
      if (sc) sc.remove(_particles[i].mesh);
      if (_particles[i].mesh.geometry) _particles[i].mesh.geometry.dispose();
      if (_particles[i].mesh.material) _particles[i].mesh.material.dispose();
    }
    _particles = [];

    // Clear trail lights
    for (var j = 0; j < _trailLights.length; j++) {
      if (sc) sc.remove(_trailLights[j].light);
    }
    _trailLights = [];

    // Remove pickup if present
    _removePickup();
  }

  /* ── Level-start hook: spawn one bootpack if not unlocked ── */
  function onLevelStart() {
    if (_enabled) return;
    _spawnBootpackPickup();
  }

  // Expose onLevelStart so GameManager can call it
  if (typeof window !== 'undefined') {
    window._doubleJumpEnabled = false;
  }

  return {
    init:        init,
    update:      update,
    reset:       reset,
    isEnabled:   isEnabled,
    enable:      enable,
    onLevelStart: onLevelStart
  };
}());
