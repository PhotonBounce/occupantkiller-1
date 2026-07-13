// nanobots.js — Medical Nanobots passive health regen system
// Browser-based Three.js FPS — IIFE, all var (no let/const)
//
// Public API:
//   Nanobots.init(scene, camera, controls)
//   Nanobots.update(dt)
//   Nanobots.activate()
//   Nanobots.deactivate()
//   Nanobots.reset()
//
// Globals exposed:
//   window._nanobotsActive  — boolean, true while boost mode is running
//   window._nanobotsRegen   — boolean, true while passive regen is active

window.Nanobots = (function () {
  'use strict';

  // ------------------------------------------------------------------ config
  var REGEN_DELAY        = 8;     // seconds after last hit before regen begins
  var PASSIVE_REGEN_RATE = 2;     // HP per second (passive)
  var BOOST_REGEN_RATE   = 8;     // HP per second (boost mode)
  var BOOST_DURATION     = 15;    // seconds boost mode lasts
  var BOOST_COOLDOWN     = 45;    // seconds after boost before it can reactivate
  var ARMOR_ABSORB_BONUS = 0.20;  // extra armor absorption during boost
  var MAX_HP             = 100;

  // Injector pickup config
  var INJECTOR_RESPAWN   = 120;   // seconds between injector spawns
  var INJECTOR_HP_BONUS  = 30;    // HP granted on pickup
  var INJECTOR_BOOST_DUR = 10;    // seconds of enhanced regen on pickup
  var INJECT_COLLECT_DIST     = 1.2;
  var INJECT_COLLECT_DIST_SQ  = INJECT_COLLECT_DIST * INJECT_COLLECT_DIST;

  // Particle config
  var ORBIT_RADIUS       = 0.5;   // orbit radius for boost particles
  var ORBIT_SPEED        = 2.5;   // rad/s for orbit
  var DRIFT_PARTICLES    = 4;     // number of passive drift particles
  var DRIFT_SPEED        = 0.6;   // units per second drift speed
  var DRIFT_LIFE         = 2.0;   // seconds per drift particle lifetime

  // Sound
  var HUM_FREQ           = 8000;  // Hz — nanobot hum
  var HUM_GAIN           = 0.012; // barely audible
  var CHIME_INTERVAL     = 5;     // seconds between healing chimes

  // ------------------------------------------------------------------ state
  var _scene             = null;
  var _camera            = null;

  // Timers
  var _time              = 0;
  var _regenDelayTimer   = 0;     // counts up; regen starts when >= REGEN_DELAY
  var _hitTimer          = 0;     // set to REGEN_DELAY on hit, counts down
  var _boostTimer        = 0;     // seconds remaining in boost
  var _boostCooldown     = 0;     // seconds remaining on cooldown
  var _chimeTimer        = 0;     // counts up toward CHIME_INTERVAL
  var _injectorRespawnTimer = 0;  // counts up toward INJECTOR_RESPAWN

  var _regenActive       = false; // passive regen is running
  var _boostActive       = false; // boost mode is running
  var _prevHp            = -1;    // last seen player HP (for hit detection)

  // Three.js objects
  var _orbitParticles    = [];    // {mesh, angle} — 12 boost orbit specks
  var _boostLight        = null;  // PointLight during boost
  var _driftParticles    = [];    // {mesh, life, maxLife, vx, vz} — passive drift
  var _injectorMesh      = null;  // world pickup
  var _injectorPhase     = 0;

  // DOM elements
  var _hudIconEl         = null;
  var _hudBoostEl        = null;
  var _styleEl           = null;
  var _toastEl           = null;

  // Audio
  var _audioCtx          = null;
  var _humOsc            = null;
  var _humGain           = null;
  var _humActive         = false;

  // Globals
  window._nanobotsActive = false;
  window._nanobotsRegen  = false;

  // ------------------------------------------------------------------ audio

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { _audioCtx = null; }
    }
    return _audioCtx;
  }

  function _startHum() {
    if (_humActive) return;
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      _humGain = ctx.createGain();
      _humGain.gain.value = 0;
      _humGain.connect(ctx.destination);

      _humOsc = ctx.createOscillator();
      _humOsc.type = 'sine';
      _humOsc.frequency.value = HUM_FREQ;
      _humOsc.connect(_humGain);
      _humOsc.start();

      // Fade in
      _humGain.gain.setValueAtTime(0, ctx.currentTime);
      _humGain.gain.linearRampToValueAtTime(HUM_GAIN, ctx.currentTime + 0.5);

      _humActive = true;
    } catch (e) { _audioCtx = null; }
  }

  function _stopHum() {
    if (!_humActive) return;
    try {
      if (_humGain && _audioCtx) {
        _humGain.gain.setValueAtTime(_humGain.gain.value, _audioCtx.currentTime);
        _humGain.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 0.4);
      }
      var osc = _humOsc;
      _humOsc = null;
      _humGain = null;
      // Delay stop to allow fade-out
      window.setTimeout(function () {
        try { if (osc) osc.stop(); } catch (e2) {}
      }, 500);
    } catch (e) {}
    _humActive = false;
  }

  function _playChime() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Healing chime: ascending trio of notes
      var freqs = [523, 659, 784]; // C5 E5 G5
      for (var i = 0; i < freqs.length; i++) {
        (function (freq, delay) {
          var osc  = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.5);
        })(freqs[i], i * 0.12);
      }
    } catch (e) {}
  }

  function _playInjectorPickupSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  // ------------------------------------------------------------------ CSS / DOM

  function _injectStyles() {
    if (_styleEl) return;
    _styleEl = document.createElement('style');
    _styleEl.id = 'nanobotsStyles';
    _styleEl.textContent = [
      '@keyframes nanoPulse {',
      '  0%   { opacity: 0.7; transform: scale(1); }',
      '  50%  { opacity: 1;   transform: scale(1.15); }',
      '  100% { opacity: 0.7; transform: scale(1); }',
      '}',
      '@keyframes nanoBoostPulse {',
      '  0%   { opacity: 1;   text-shadow: 0 0 8px #00ccff; }',
      '  50%  { opacity: 0.8; text-shadow: 0 0 18px #00ccff, 0 0 30px #0066ff; }',
      '  100% { opacity: 1;   text-shadow: 0 0 8px #00ccff; }',
      '}',
      '@keyframes nanoToast {',
      '  0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }',
      '  15%  { opacity: 1; transform: translateX(-50%) translateY(0); }',
      '  75%  { opacity: 1; transform: translateX(-50%) translateY(0); }',
      '  100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }',
      '}'
    ].join('\n');
    document.head.appendChild(_styleEl);
  }

  function _ensureHudIcon() {
    if (_hudIconEl) return;
    _hudIconEl = document.createElement('div');
    _hudIconEl.id = 'nanobotsHudIcon';
    _hudIconEl.style.position = 'fixed';
    _hudIconEl.style.top = '36px';
    _hudIconEl.style.right = '12px';
    _hudIconEl.style.fontSize = '18px';
    _hudIconEl.style.fontFamily = 'monospace';
    _hudIconEl.style.pointerEvents = 'none';
    _hudIconEl.style.zIndex = '601';
    _hudIconEl.style.color = '#aaa';
    _hudIconEl.style.opacity = '0.35';
    _hudIconEl.style.transition = 'color 0.4s, opacity 0.4s';
    _hudIconEl.textContent = '🔬';
    document.body.appendChild(_hudIconEl);
  }

  function _ensureHudBoost() {
    if (_hudBoostEl) return;
    _hudBoostEl = document.createElement('div');
    _hudBoostEl.id = 'nanobotsHudBoost';
    _hudBoostEl.style.position = 'fixed';
    _hudBoostEl.style.top = '56px';
    _hudBoostEl.style.right = '10px';
    _hudBoostEl.style.fontFamily = 'monospace';
    _hudBoostEl.style.fontSize = '11px';
    _hudBoostEl.style.fontWeight = 'bold';
    _hudBoostEl.style.letterSpacing = '1px';
    _hudBoostEl.style.color = '#00ccff';
    _hudBoostEl.style.pointerEvents = 'none';
    _hudBoostEl.style.zIndex = '601';
    _hudBoostEl.style.display = 'none';
    _hudBoostEl.textContent = '🔬 NANOBOTS ACTIVE 15s';
    document.body.appendChild(_hudBoostEl);
  }

  function _ensureToast() {
    if (_toastEl) return;
    _toastEl = document.createElement('div');
    _toastEl.id = 'nanobotsToast';
    _toastEl.style.position = 'fixed';
    _toastEl.style.top = '38%';
    _toastEl.style.left = '50%';
    _toastEl.style.transform = 'translateX(-50%)';
    _toastEl.style.color = '#00ccff';
    _toastEl.style.fontFamily = 'monospace';
    _toastEl.style.fontSize = '18px';
    _toastEl.style.fontWeight = 'bold';
    _toastEl.style.letterSpacing = '2px';
    _toastEl.style.textShadow = '0 0 12px #0066ff, 0 0 24px #00ccff';
    _toastEl.style.pointerEvents = 'none';
    _toastEl.style.zIndex = '700';
    _toastEl.style.opacity = '0';
    _toastEl.style.whiteSpace = 'nowrap';
    document.body.appendChild(_toastEl);
  }

  function _showToast(text, durationSec) {
    _ensureToast();
    _toastEl.textContent = text;
    _toastEl.style.animation = 'none';
    void _toastEl.offsetWidth; // force reflow
    _toastEl.style.animation = 'nanoToast ' + (durationSec || 2.0) + 's ease forwards';
  }

  function _updateHudIcon() {
    if (!_hudIconEl) return;
    if (_regenActive || _boostActive) {
      _hudIconEl.style.color = '#00ccff';
      _hudIconEl.style.opacity = '1';
      _hudIconEl.style.animation = 'nanoPulse 1.8s ease-in-out infinite';
    } else {
      _hudIconEl.style.color = '#aaa';
      _hudIconEl.style.opacity = '0.35';
      _hudIconEl.style.animation = 'none';
    }
  }

  function _updateHudBoost() {
    if (!_hudBoostEl) return;
    if (_boostActive) {
      var secs = Math.ceil(_boostTimer);
      _hudBoostEl.textContent = '🔬 NANOBOTS ACTIVE ' + secs + 's';
      _hudBoostEl.style.display = 'block';
      _hudBoostEl.style.animation = 'nanoBoostPulse 1.2s ease-in-out infinite';
    } else {
      _hudBoostEl.style.display = 'none';
      _hudBoostEl.style.animation = 'none';
    }
  }

  // ------------------------------------------------------------------ player access

  function _getPlayer() {
    try {
      if (window.GameManager && typeof window.GameManager.getPlayer === 'function') {
        return window.GameManager.getPlayer();
      }
      if (window.player) return window.player;
    } catch (e) {}
    return null;
  }

  function _getPlayerPos() {
    try {
      if (window.GameManager && window.GameManager.playerPosition) return window.GameManager.playerPosition;
      if (window._playerPos) return window._playerPos;
      var pl = _getPlayer();
      if (pl && pl.position) return pl.position;
      if (_camera) return _camera.position;
    } catch (e) {}
    return null;
  }

  // ------------------------------------------------------------------ THREE geometry helpers

  function _makeOrbitParticles() {
    if (!_scene) return;
    for (var i = 0; i < 12; i++) {
      var geo  = new THREE.SphereGeometry(0.03, 4, 4);
      var mat  = new THREE.MeshBasicMaterial({ color: 0x00ccff });
      var mesh = new THREE.Mesh(geo, mat);
      _scene.add(mesh);
      _orbitParticles.push({ mesh: mesh, angle: (i / 12) * Math.PI * 2 });
    }
  }

  function _removeOrbitParticles() {
    for (var i = 0; i < _orbitParticles.length; i++) {
      if (_scene) _scene.remove(_orbitParticles[i].mesh);
    }
    _orbitParticles = [];
  }

  function _makeBoostLight() {
    if (!_scene) return;
    _boostLight = new THREE.PointLight(0x0066FF, 2, 2);
    _scene.add(_boostLight);
  }

  function _removeBoostLight() {
    if (_boostLight && _scene) {
      _scene.remove(_boostLight);
      _boostLight = null;
    }
  }

  function _spawnDriftParticle(pos) {
    if (!_scene || !pos) return;
    var geo  = new THREE.SphereGeometry(0.04, 4, 4);
    var mat  = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.8 });
    var mesh = new THREE.Mesh(geo, mat);
    // Start at player feet with random horizontal spread
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 0.4,
      pos.y - 0.8 + Math.random() * 0.2,
      pos.z + (Math.random() - 0.5) * 0.4
    );
    _scene.add(mesh);
    _driftParticles.push({
      mesh:    mesh,
      life:    DRIFT_LIFE,
      maxLife: DRIFT_LIFE,
      vx:      (Math.random() - 0.5) * 0.08,
      vz:      (Math.random() - 0.5) * 0.08
    });
  }

  function _updateDriftParticles(dt, playerPos) {
    var i = _driftParticles.length - 1;
    while (i >= 0) {
      var p = _driftParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        if (_scene) _scene.remove(p.mesh);
        _driftParticles.splice(i, 1);
        i--;
        continue;
      }
      // Drift upward, slight horizontal wander
      p.mesh.position.y += DRIFT_SPEED * dt;
      p.mesh.position.x += p.vx;
      p.mesh.position.z += p.vz;
      // Fade out
      var alpha = p.life / p.maxLife;
      if (p.mesh.material && p.mesh.material.opacity !== undefined) {
        p.mesh.material.opacity = alpha * 0.8;
      }
      i--;
    }
  }

  function _removeDriftParticles() {
    for (var i = 0; i < _driftParticles.length; i++) {
      if (_scene) _scene.remove(_driftParticles[i].mesh);
    }
    _driftParticles = [];
  }

  // ------------------------------------------------------------------ injector pickup

  function _makeInjectorMesh() {
    // CylinderGeometry(0.06, 0.08, 0.35) metallic blue syringe
    var bodyGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.35, 8);
    var bodyMat = new THREE.MeshLambertMaterial({
      color: 0x2244cc,
      emissive: 0x001166,
      emissiveIntensity: 0.5
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);

    // Cap top
    var capGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.06, 8);
    var capMat = new THREE.MeshLambertMaterial({ color: 0x00aaff, emissive: 0x002244, emissiveIntensity: 0.4 });
    var cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.205;

    // Needle tip
    var needleGeo = new THREE.CylinderGeometry(0.006, 0.002, 0.1, 6);
    var needleMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, emissive: 0x002244, emissiveIntensity: 0.3 });
    var needle = new THREE.Mesh(needleGeo, needleMat);
    needle.position.y = -0.225;

    var group = new THREE.Group();
    group.add(body);
    group.add(cap);
    group.add(needle);
    group.rotation.z = Math.PI / 3;
    return group;
  }

  function _spawnInjector() {
    if (!_scene || _injectorMesh) return;
    _injectorMesh = _makeInjectorMesh();
    // Place at a fixed map position (varied each respawn)
    var px = (Math.random() - 0.5) * 30;
    var pz = (Math.random() - 0.5) * 30;
    _injectorMesh.position.set(px, 0.6, pz);
    _injectorPhase = Math.random() * Math.PI * 2;
    _scene.add(_injectorMesh);
  }

  function _removeInjector() {
    if (_injectorMesh && _scene) {
      _scene.remove(_injectorMesh);
      _injectorMesh = null;
    }
  }

  function _updateInjector(dt, playerPos) {
    // Respawn timer
    if (!_injectorMesh) {
      _injectorRespawnTimer += dt;
      if (_injectorRespawnTimer >= INJECTOR_RESPAWN) {
        _injectorRespawnTimer = 0;
        _spawnInjector();
      }
      return;
    }

    // Animate: bob and rotate
    _injectorPhase += dt * 1.5;
    _injectorMesh.position.y = 0.6 + Math.sin(_injectorPhase) * 0.06;
    _injectorMesh.rotation.y += dt * 1.8;

    // Check pickup
    if (!playerPos) return;
    var dx = _injectorMesh.position.x - playerPos.x;
    var dz = _injectorMesh.position.z - playerPos.z;
    var distSq = dx * dx + dz * dz;

    if (distSq < INJECT_COLLECT_DIST_SQ) {
      _removeInjector();
      _injectorRespawnTimer = 0;
      _onInjectorPickup();
    }
  }

  function _onInjectorPickup() {
    var player = _getPlayer();
    if (player) {
      player.hp = Math.min(MAX_HP, (player.hp || 0) + INJECTOR_HP_BONUS);
      if (typeof HUD !== 'undefined' && HUD.setHealth) {
        HUD.setHealth(player.hp, player.maxHp || MAX_HP);
      }
    }
    // Start 10s enhanced regen (temporarily override boost timer)
    _startBoost(INJECTOR_BOOST_DUR);
    _playInjectorPickupSound();
    _showToast('🔬 +' + INJECTOR_HP_BONUS + 'HP  NANOBOTS INJECTED', 2.5);
  }

  // ------------------------------------------------------------------ regen / boost logic

  function _startPassiveRegen() {
    if (_regenActive) return;
    _regenActive = true;
    window._nanobotsRegen = true;
    _startHum();
    _chimeTimer = 0;
  }

  function _stopPassiveRegen() {
    if (!_regenActive) return;
    _regenActive = false;
    window._nanobotsRegen = false;
    if (!_boostActive) _stopHum();
  }

  function _startBoost(duration) {
    _boostTimer = duration || BOOST_DURATION;
    if (!_boostActive) {
      _boostActive = true;
      window._nanobotsActive = true;
      _makeOrbitParticles();
      _makeBoostLight();
      _startHum();
      _showToast('🔬 NANOBOTS ACTIVATED', 1.8);
    }
    if (!_regenActive) {
      _regenActive = true;
      window._nanobotsRegen = true;
    }
  }

  function _endBoost() {
    _boostActive = false;
    window._nanobotsActive = false;
    _boostCooldown = BOOST_COOLDOWN;
    _removeOrbitParticles();
    _removeBoostLight();
    if (!_regenActive) _stopHum();
  }

  function _onHit() {
    // Cancel regen for REGEN_DELAY seconds
    _hitTimer = REGEN_DELAY;
    _stopPassiveRegen();
    // Boost continues even if hit (boost is not disrupted, only passive regen delay resets)
  }

  // ------------------------------------------------------------------ key handler

  function _onKeyDown(e) {
    // Alt+N activates boost mode
    if (e.altKey && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      activate();
    }
  }

  // ------------------------------------------------------------------ public API

  function init(scene, camera, controls) {
    _scene  = scene;
    _camera = camera;

    _injectStyles();
    _ensureHudIcon();
    _ensureHudBoost();
    _ensureToast();

    // Reset state
    _regenActive          = false;
    _boostActive          = false;
    _hitTimer             = REGEN_DELAY; // start with delay so regen doesn't begin instantly
    _boostTimer           = 0;
    _boostCooldown        = 0;
    _chimeTimer           = 0;
    _injectorRespawnTimer = INJECTOR_RESPAWN * 0.5; // first injector arrives faster
    _prevHp               = -1;

    window._nanobotsActive = false;
    window._nanobotsRegen  = false;

    document.addEventListener('keydown', _onKeyDown);
  }

  function update(dt) {
    _time += dt;

    var player    = _getPlayer();
    var playerPos = _getPlayerPos();

    // -- Hit detection: compare current HP to last frame --
    if (player) {
      var currentHp = (typeof player.hp === 'number') ? player.hp : MAX_HP;
      if (_prevHp < 0) {
        _prevHp = currentHp;
      } else if (currentHp < _prevHp - 0.5) {
        // Took damage
        _onHit();
      }
      _prevHp = currentHp;
    }

    // -- Hit timer (delay before regen can start) --
    if (_hitTimer > 0) {
      _hitTimer -= dt;
    }

    // -- Passive regen gate --
    if (!_regenActive && !_boostActive && _hitTimer <= 0) {
      _startPassiveRegen();
    }

    // -- Apply regen --
    if ((_regenActive || _boostActive) && player) {
      var rate = _boostActive ? BOOST_REGEN_RATE : PASSIVE_REGEN_RATE;
      var hp   = (typeof player.hp === 'number') ? player.hp : 0;
      if (hp < MAX_HP) {
        hp = Math.min(MAX_HP, hp + rate * dt);
        player.hp = hp;
        _prevHp   = hp; // update so we don't self-trigger hit detection
        if (typeof HUD !== 'undefined' && HUD.setHealth) {
          HUD.setHealth(hp, player.maxHp || MAX_HP);
        }
      }
    }

    // -- Chime every 5s while regen is active --
    if (_regenActive || _boostActive) {
      _chimeTimer += dt;
      if (_chimeTimer >= CHIME_INTERVAL) {
        _chimeTimer = 0;
        _playChime();
      }
    }

    // -- Boost mode timer --
    if (_boostActive) {
      _boostTimer -= dt;
      if (_boostTimer <= 0) {
        _endBoost();
      }
    }

    // -- Boost cooldown --
    if (!_boostActive && _boostCooldown > 0) {
      _boostCooldown -= dt;
      if (_boostCooldown < 0) _boostCooldown = 0;
    }

    // -- Update boost visuals --
    if (_boostActive && playerPos) {
      // Orbit particles around player
      for (var i = 0; i < _orbitParticles.length; i++) {
        var op = _orbitParticles[i];
        op.angle += ORBIT_SPEED * dt;
        op.mesh.position.set(
          playerPos.x + Math.cos(op.angle) * ORBIT_RADIUS,
          playerPos.y + Math.sin(op.angle * 0.5) * 0.3,
          playerPos.z + Math.sin(op.angle) * ORBIT_RADIUS
        );
      }
      // Pulse boost light
      if (_boostLight) {
        _boostLight.position.copy(playerPos);
        _boostLight.intensity = 1.5 + Math.sin(_time * 4) * 0.5;
      }
    }

    // -- Passive drift particles --
    if (_regenActive && !_boostActive && playerPos) {
      // Spawn new drift particles occasionally
      var shouldSpawn = Math.random() < dt * (DRIFT_PARTICLES / DRIFT_LIFE);
      if (shouldSpawn && _driftParticles.length < DRIFT_PARTICLES * 2) {
        _spawnDriftParticle(playerPos);
      }
    } else if (!_regenActive && !_boostActive) {
      // No regen — no new drift particles; let existing ones expire
    }

    _updateDriftParticles(dt, playerPos);
    _updateInjector(dt, playerPos);

    // -- HUD updates --
    _updateHudIcon();
    _updateHudBoost();
  }

  function activate() {
    // Manual Alt+N boost activation
    if (_boostActive) return; // already running
    if (_boostCooldown > 0) {
      _showToast('🔬 COOLDOWN ' + Math.ceil(_boostCooldown) + 's', 1.5);
      return;
    }
    _startBoost(BOOST_DURATION);
    _boostCooldown = 0; // cooldown set in _endBoost
  }

  function deactivate() {
    if (_boostActive) {
      _endBoost();
    }
    _stopPassiveRegen();
    _stopHum();
  }

  function reset() {
    // Remove 3D objects
    _removeOrbitParticles();
    _removeBoostLight();
    _removeDriftParticles();
    _removeInjector();

    // Stop audio
    _stopHum();

    // Reset state
    _regenActive          = false;
    _boostActive          = false;
    _hitTimer             = REGEN_DELAY;
    _boostTimer           = 0;
    _boostCooldown        = 0;
    _chimeTimer           = 0;
    _injectorRespawnTimer = INJECTOR_RESPAWN * 0.5;
    _prevHp               = -1;
    _time                 = 0;
    _injectorPhase        = 0;

    // Reset globals
    window._nanobotsActive = false;
    window._nanobotsRegen  = false;

    // Reset HUD
    _updateHudIcon();
    _updateHudBoost();
  }

  // ================================================================== return

  return {
    init:       init,
    update:     update,
    activate:   activate,
    deactivate: deactivate,
    reset:      reset
  };

})();
