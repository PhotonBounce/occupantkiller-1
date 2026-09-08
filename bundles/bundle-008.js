/* === nanobots.js === */
try {
;
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
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail nanobots.js",_e&&_e.message); }
/* === enemy-riot-police.js === */
try {
;
/* ════════════════════════════════════════════════════════════════════
 *  ENEMY RIOT POLICE — armored officer with riot shield who advances on player
 *  ─────────────────────────────────────────────────────────────────
 *  Starting wave 5, riot police spawn in groups of 2-3.
 *  150 HP, 200 shield HP, medium speed 2.5 u/s.
 *  Shield blocks 90% dmg from front, 40% from sides, 0% from behind.
 *  Gas/explosives bypass shield completely.
 *  Shield bash at 4 units (20 dmg, 2s cooldown).
 *  Baton strike at 2 units (30 dmg, 1s cooldown).
 *  Formation: spread 3 units apart, advance in a line.
 *  Score: +200 on kill, +100 bonus for killing while shield still up.
 *
 *  Public API:
 *    EnemyRiotPolice.init(scene, camera)  — call once after scene exists
 *    EnemyRiotPolice.update(delta)        — per-frame (called from game loop)
 *    EnemyRiotPolice.spawn(x, y, z)      — spawn one officer
 *    EnemyRiotPolice.reset()             — clear state between stages/waves
 * ════════════════════════════════════════════════════════════════════ */
window.EnemyRiotPolice = (function () {
  'use strict';

  /* ── internal state ─────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _audioCtx = null;

  window._riotPoliceEnemies = [];

  /* ── constants ──────────────────────────────────────────────────── */
  var MAX_HP           = 150;
  var SHIELD_HP        = 200;
  var WALK_SPEED       = 2.5;
  var RAGE_SPEED       = 4.5;    /* speed after shield breaks */
  var SCORE_KILL       = 200;
  var SCORE_HEADSHOT   = 100;    /* bonus for killing while shield still up */

  var BASH_RANGE       = 4;
  var BASH_DAMAGE      = 20;
  var BASH_COOLDOWN    = 2.0;
  var BASH_PUSH        = 3.0;

  var BATON_RANGE      = 2;
  var BATON_DAMAGE     = 30;
  var BATON_COOLDOWN   = 1.0;

  var FORM_SPREAD      = 3.0;    /* formation spread distance */
  var TOAST_RANGE      = 30;     /* show toast when spawned within this distance */

  /* ════════════════════════════════════════════════════════════════
     AUDIO
  ════════════════════════════════════════════════════════════════ */
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    return _audioCtx;
  }

  function _playClank() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type  = 'square';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(340, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  function _playBatonSwing() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf  = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      var data = buf.getChannelData(0);
      var i;
      for (i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      var filt = ctx.createBiquadFilter();
      src.buffer = buf;
      filt.type  = 'bandpass';
      filt.frequency.value = 800;
      filt.Q.value = 2;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.4;
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  function _playShieldShatter() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var buf  = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      var data = buf.getChannelData(0);
      var i;
      for (i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      var filt = ctx.createBiquadFilter();
      src.buffer = buf;
      filt.type  = 'highpass';
      filt.frequency.value = 1200;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.6;
      src.start(ctx.currentTime);
    } catch (e) {}
  }

  /* ════════════════════════════════════════════════════════════════
     MESH BUILDER
  ════════════════════════════════════════════════════════════════ */
  function _buildMesh() {
    var group = new THREE.Group();

    /* torso — dark blue */
    var torsoGeo = new THREE.BoxGeometry(0.5, 0.7, 0.28);
    var torsoMat = new THREE.MeshLambertMaterial({ color: 0x1A1A4A });
    var torso    = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.35;
    group.add(torso);

    /* chest armor plate — slightly lighter blue */
    var plateGeo = new THREE.BoxGeometry(0.44, 0.5, 0.06);
    var plateMat = new THREE.MeshLambertMaterial({ color: 0x22227A });
    var plate    = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, 0.38, 0.17);
    group.add(plate);

    /* legs */
    var legGeo = new THREE.BoxGeometry(0.18, 0.55, 0.2);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x111133 });

    var leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.14, -0.27, 0);
    group.add(leftLeg);

    var rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.14, -0.27, 0);
    group.add(rightLeg);

    /* boots */
    var bootGeo = new THREE.BoxGeometry(0.2, 0.14, 0.24);
    var bootMat = new THREE.MeshLambertMaterial({ color: 0x0A0A0A });

    var leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.14, -0.58, 0.02);
    group.add(leftBoot);

    var rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.14, -0.58, 0.02);
    group.add(rightBoot);

    /* arms */
    var armGeo = new THREE.BoxGeometry(0.16, 0.5, 0.18);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x1A1A4A });

    /* right arm holds baton — starts at side */
    var rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.35, 0.2, 0);
    group.add(rightArm);

    /* baton */
    var batonGeo = new THREE.BoxGeometry(0.05, 0.45, 0.05);
    var batonMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var baton    = new THREE.Mesh(batonGeo, batonMat);
    baton.position.set(0.35, -0.12, 0);
    group.add(baton);

    /* left arm — holds shield in front */
    var leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.25, 0.2, 0.18);
    leftArm.rotation.x = -0.3;
    group.add(leftArm);

    /* helmet — black with visor */
    var helmGeo = new THREE.BoxGeometry(0.3, 0.35, 0.32);
    var helmMat = new THREE.MeshLambertMaterial({ color: 0x0A0A0A });
    var helm    = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 0.93;
    group.add(helm);

    /* visor — dark tinted semi-transparent */
    var visorGeo = new THREE.BoxGeometry(0.24, 0.12, 0.04);
    var visorMat = new THREE.MeshPhongMaterial({
      color:       0x001133,
      transparent: true,
      opacity:     0.75,
      shininess:   120,
      specular:    0x4488FF
    });
    var visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.9, 0.18);
    group.add(visor);

    /* riot shield — held slightly in front and to the left */
    var shieldGeo = new THREE.BoxGeometry(0.5, 1.0, 0.05);
    var shieldMat = new THREE.MeshPhongMaterial({
      color:       0x4488FF,
      transparent: true,
      opacity:     0.65,
      shininess:   80,
      specular:    0xAADDFF,
      side:        THREE.DoubleSide
    });
    var shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.set(-0.1, 0.3, 0.38);
    group.add(shieldMesh);

    /* shield blue rim light */
    var shieldLight = new THREE.PointLight(0x4488FF, 1.2, 2);
    shieldLight.position.set(-0.1, 0.3, 0.5);
    group.add(shieldLight);

    /* store refs */
    group.userData.shieldMesh  = shieldMesh;
    group.userData.shieldMat   = shieldMat;
    group.userData.shieldLight = shieldLight;
    group.userData.rightArm    = rightArm;
    group.userData.baton       = baton;
    group.userData.visor       = visor;
    group.userData.leftArm     = leftArm;

    return group;
  }

  /* ════════════════════════════════════════════════════════════════
     SHIELD SHATTER PARTICLES
  ════════════════════════════════════════════════════════════════ */
  function _shatterShield(enemy) {
    if (!_scene || !enemy.shieldMesh) return;

    /* remove shield from group */
    enemy.group.remove(enemy.shieldMesh);
    var worldPos = new THREE.Vector3();
    enemy.shieldMesh.getWorldPosition(worldPos);

    /* remove shield light */
    if (enemy.shieldLight) {
      enemy.group.remove(enemy.shieldLight);
      enemy.shieldLight = null;
    }

    enemy.shieldMesh = null;
    enemy.shieldBroken = true;
    enemy.shieldHP = 0;
    enemy.speed = RAGE_SPEED;  /* rage speed after shield breaks */

    _playShieldShatter();

    /* spawn blue glass shatter particles */
    var fragments = [];
    var i;
    for (i = 0; i < 10; i++) {
      var geo = new THREE.PlaneGeometry(0.08 + Math.random() * 0.14, 0.08 + Math.random() * 0.14);
      var mat = new THREE.MeshBasicMaterial({
        color:       0x4488FF,
        transparent: true,
        opacity:     0.85,
        side:        THREE.DoubleSide,
        depthWrite:  false
      });
      var frag = new THREE.Mesh(geo, mat);
      frag.position.copy(worldPos);
      frag.position.x += (Math.random() - 0.5) * 0.5;
      frag.position.y += Math.random() * 1.0;
      frag.position.z += (Math.random() - 0.5) * 0.3;
      frag._vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      );
      frag._rot = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      frag._age = 0;
      _scene.add(frag);
      fragments.push(frag);
    }
    enemy.shieldFragments = fragments;

    /* brief blue flash */
    var light = new THREE.PointLight(0x4488FF, 5, 5);
    light.position.copy(worldPos);
    _scene.add(light);
    setTimeout(function () { if (_scene) _scene.remove(light); }, 120);

    /* toast */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('SHIELD BROKEN — ENEMY ENRAGED!');
    }
  }

  function _updateShieldFragments(enemy, dt) {
    if (!enemy.shieldFragments || enemy.shieldFragments.length === 0) return;
    var i;
    for (i = enemy.shieldFragments.length - 1; i >= 0; i--) {
      var frag = enemy.shieldFragments[i];
      frag._age += dt;
      frag.position.x += frag._vel.x * dt;
      frag.position.y += frag._vel.y * dt;
      frag.position.z += frag._vel.z * dt;
      frag._vel.y -= 6 * dt;
      frag.rotation.x += frag._rot.x * dt;
      frag.rotation.y += frag._rot.y * dt;
      frag.rotation.z += frag._rot.z * dt;
      frag.material.opacity = Math.max(0, 0.85 - frag._age / 1.2);
      if (frag._age > 1.2) {
        if (_scene) _scene.remove(frag);
        enemy.shieldFragments.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     DAMAGE DIRECTION CHECK
  ════════════════════════════════════════════════════════════════ */
  /* Returns: 'front', 'side', or 'back' relative to enemy facing */
  function _getDamageDirection(enemy, playerPos) {
    var ex = enemy.group.position.x;
    var ez = enemy.group.position.z;
    var dx = playerPos.x - ex;
    var dz = playerPos.z - ez;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    var toPlayerX = dx / len;
    var toPlayerZ = dz / len;
    /* enemy forward direction (facing toward player by default) */
    var fwdX = Math.sin(enemy.group.rotation.y);
    var fwdZ = Math.cos(enemy.group.rotation.y);
    /* dot product: 1=front, -1=back */
    var dot = fwdX * toPlayerX + fwdZ * toPlayerZ;
    if (dot > 0.0) return 'front';   /* front hemisphere (>90 deg) */
    var cross = fwdX * toPlayerZ - fwdZ * toPlayerX;
    if (Math.abs(cross) > 0.5) return 'side';
    return 'back';
  }

  /* ════════════════════════════════════════════════════════════════
     TAKE DAMAGE (public, accepts enemy obj + optional flags)
  ════════════════════════════════════════════════════════════════ */
  function _applyDamageToEnemy(enemy, amount, playerPos, opts) {
    if (enemy.dead) return;

    opts = opts || {};
    var bypassShield = opts.gas || opts.explosive;
    var finalAmount  = amount;

    if (!bypassShield && !enemy.shieldBroken && playerPos) {
      var dir = _getDamageDirection(enemy, playerPos);
      if (dir === 'front') {
        finalAmount = amount * 0.10;   /* 90% reduction */
        /* still damage shield */
        enemy.shieldHP -= amount;
        if (enemy.shieldMesh) {
          /* flash shield on hit */
          enemy.shieldMesh.material.opacity = 0.95;
          setTimeout(function () {
            if (enemy.shieldMesh) enemy.shieldMesh.material.opacity = 0.65;
          }, 80);
          _playClank();
        }
        if (enemy.shieldHP <= 0) {
          _shatterShield(enemy);
        }
      } else if (dir === 'side') {
        finalAmount = amount * 0.60;   /* 40% reduction */
      }
      /* back: no reduction, falls through */
    }

    enemy.hp -= finalAmount;
    if (enemy.hp <= 0) {
      _killEnemy(enemy);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     KILL
  ════════════════════════════════════════════════════════════════ */
  function _killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead      = true;
    enemy.deathTimer = 0;

    /* score */
    var score = SCORE_KILL;
    if (!enemy.shieldBroken) {
      score += SCORE_HEADSHOT;  /* killed while shield still up = headshot bonus */
    }
    if (window.GameManager && window.GameManager.addScore) {
      window.GameManager.addScore(score);
    } else if (window.player) {
      window.player.score = (window.player.score || 0) + score;
    }
  }

  /* ════════════════════════════════════════════════════════════════
     DEATH COLLAPSE ANIMATION
  ════════════════════════════════════════════════════════════════ */
  function _doDeathCollapse(enemy, dt) {
    enemy.deathTimer += dt;
    var t = Math.min(enemy.deathTimer / 0.8, 1);
    enemy.group.rotation.x = t * (Math.PI / 2);
    enemy.group.position.y = -t * 0.4;

    if (enemy.deathTimer > 1.4) {
      _removeEnemy(enemy);
    }
  }

  function _removeEnemy(enemy) {
    if (_scene) _scene.remove(enemy.group);
    var idx = window._riotPoliceEnemies.indexOf(enemy);
    if (idx !== -1) window._riotPoliceEnemies.splice(idx, 1);
  }

  /* ════════════════════════════════════════════════════════════════
     PLAYER HELPERS
  ════════════════════════════════════════════════════════════════ */
  function _damagePlayer(dmg) {
    if (window.GameManager && window.GameManager.takeDamage) {
      window.GameManager.takeDamage(dmg);
    } else if (window.player && window.player.health !== undefined) {
      window.player.health -= dmg;
    }
    if (window.HUD && window.HUD.showDamageFlash) {
      window.HUD.showDamageFlash(0xff0000, 0.5);
    }
  }

  function _pushPlayer(enemy, playerPos, pushDist) {
    var dx = playerPos.x - enemy.group.position.x;
    var dz = playerPos.z - enemy.group.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz) || 1;
    var cam = _camera || window._camera;
    if (cam && cam.position) {
      cam.position.x += (dx / dist) * pushDist;
      cam.position.z += (dz / dist) * pushDist;
    }
  }

  function _cameraShake(amount) {
    if (window.CameraShake && window.CameraShake.shake) {
      window.CameraShake.shake({ intensity: amount, duration: 0.3 });
    } else {
      var cam = _camera || window._camera;
      if (cam) {
        cam.position.x += (Math.random() - 0.5) * amount * 0.3;
        cam.position.y += (Math.random() - 0.5) * amount * 0.15;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     ATTACK: SHIELD BASH
  ════════════════════════════════════════════════════════════════ */
  function _doShieldBash(enemy, playerPos) {
    if (enemy.shieldBroken) return;   /* can't bash without shield */
    _playClank();
    _damagePlayer(BASH_DAMAGE);
    _pushPlayer(enemy, playerPos, BASH_PUSH);
    _cameraShake(0.5);
    enemy.bashCooldown = BASH_COOLDOWN;
  }

  /* ════════════════════════════════════════════════════════════════
     ATTACK: BATON STRIKE
  ════════════════════════════════════════════════════════════════ */
  function _doBatonStrike(enemy) {
    _playBatonSwing();
    _damagePlayer(BATON_DAMAGE);

    /* arm animation */
    var rightArm = enemy.group.userData.rightArm;
    var baton    = enemy.group.userData.baton;
    if (rightArm) rightArm.rotation.x = -1.2;
    if (baton)    baton.rotation.x    = -1.2;

    setTimeout(function () {
      if (rightArm) rightArm.rotation.x = 0;
      if (baton)    baton.rotation.x    = 0;
    }, 300);

    enemy.batonCooldown = BATON_COOLDOWN;
  }

  /* ════════════════════════════════════════════════════════════════
     FORMATION HELPER — steer away from sibling officers
  ════════════════════════════════════════════════════════════════ */
  function _formationSteer(enemy) {
    var steerX = 0;
    var steerZ = 0;
    var i;
    for (i = 0; i < window._riotPoliceEnemies.length; i++) {
      var other = window._riotPoliceEnemies[i];
      if (other === enemy || other.dead) continue;
      var dx = enemy.group.position.x - other.group.position.x;
      var dz = enemy.group.position.z - other.group.position.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < FORM_SPREAD && d > 0.01) {
        steerX += (dx / d) * (FORM_SPREAD - d) * 0.5;
        steerZ += (dz / d) * (FORM_SPREAD - d) * 0.5;
      }
    }
    return { x: steerX, z: steerZ };
  }

  /* ════════════════════════════════════════════════════════════════
     WALK CYCLE ANIMATION
  ════════════════════════════════════════════════════════════════ */
  function _animateWalk(enemy, dt) {
    enemy.walkCycle = (enemy.walkCycle || 0) + dt * enemy.speed * 3;
    var swing = Math.sin(enemy.walkCycle) * 0.25;
    var leftLeg  = enemy.group.children[3];
    var rightLeg = enemy.group.children[4];
    if (leftLeg  && leftLeg.isMesh)  leftLeg.rotation.x  =  swing;
    if (rightLeg && rightLeg.isMesh) rightLeg.rotation.x = -swing;
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE LOOP
  ════════════════════════════════════════════════════════════════ */
  function update(delta) {
    var cam = _camera || window._camera;
    if (!cam) return;
    var playerPos = cam.position;

    var i;
    for (i = window._riotPoliceEnemies.length - 1; i >= 0; i--) {
      var enemy = window._riotPoliceEnemies[i];

      /* update shield fragments regardless */
      _updateShieldFragments(enemy, delta);

      if (enemy.dead) {
        _doDeathCollapse(enemy, delta);
        continue;
      }

      /* timers */
      if (enemy.bashCooldown  > 0) enemy.bashCooldown  -= delta;
      if (enemy.batonCooldown > 0) enemy.batonCooldown -= delta;

      /* direction to player */
      var dx   = playerPos.x - enemy.group.position.x;
      var dz   = playerPos.z - enemy.group.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      /* face player */
      if (dist > 0.1) {
        enemy.group.rotation.y = Math.atan2(dx, dz);
      }

      /* formation separation */
      var steer = _formationSteer(enemy);

      /* advance toward player if not in melee range */
      if (dist > BATON_RANGE) {
        var moveX = (dx / dist) * enemy.speed * delta;
        var moveZ = (dz / dist) * enemy.speed * delta;
        enemy.group.position.x += moveX + steer.x * delta;
        enemy.group.position.z += moveZ + steer.z * delta;
        _animateWalk(enemy, delta);
      }

      /* shield bash — 4 units, has shield */
      if (dist <= BASH_RANGE && !enemy.shieldBroken && enemy.bashCooldown <= 0) {
        _doShieldBash(enemy, playerPos);
      }

      /* baton strike — 2 units */
      if (dist <= BATON_RANGE && enemy.batonCooldown <= 0) {
        _doBatonStrike(enemy);
      }

      /* shield shimmer animation */
      if (enemy.shieldMesh && !enemy.shieldBroken) {
        enemy.shieldMesh.material.opacity = 0.55 + Math.sin(Date.now() * 0.003 + i) * 0.1;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     SPAWN
  ════════════════════════════════════════════════════════════════ */
  function spawn(x, y, z) {
    if (!_scene) {
      _scene  = window._gameScene;
      _camera = window._camera;
    }
    if (!_scene) return null;

    var group = _buildMesh();

    var cam = _camera || window._camera;

    /* pick position if not provided */
    if (typeof x !== 'number') {
      if (cam && cam.position) {
        var ang = Math.random() * Math.PI * 2;
        var rad = 14 + Math.random() * 8;
        x = cam.position.x + Math.cos(ang) * rad;
        z = cam.position.z + Math.sin(ang) * rad;
      } else {
        x = (Math.random() - 0.5) * 30;
        z = (Math.random() - 0.5) * 30;
      }
      y = 0;
    }

    group.position.set(x, y || 0, z);
    _scene.add(group);

    var enemy = {
      group:          group,
      shieldMesh:     group.userData.shieldMesh,
      shieldLight:    group.userData.shieldLight,
      hp:             MAX_HP,
      shieldHP:       SHIELD_HP,
      shieldBroken:   false,
      shieldFragments: [],
      dead:           false,
      deathTimer:     0,
      speed:          WALK_SPEED,
      bashCooldown:   0,
      batonCooldown:  0,
      walkCycle:      Math.random() * Math.PI * 2   /* stagger walk phase */
    };

    window._riotPoliceEnemies.push(enemy);

    /* toast if spawned near player */
    if (cam && cam.position) {
      var tdx = x - cam.position.x;
      var tdz = (z || 0) - cam.position.z;
      var tdist = Math.sqrt(tdx * tdx + tdz * tdz);
      if (tdist <= TOAST_RANGE) {
        if (window.HUD && window.HUD.showToast) {
          window.HUD.showToast('RIOT POLICE INCOMING');
        }
        /* red flash */
        if (window.HUD && window.HUD.showDamageFlash) {
          window.HUD.showDamageFlash(0xFF0000, 0.3);
        }
      }
    }

    return enemy;
  }

  /* Spawn a group of 2-3 officers in formation */
  function _spawnGroup(count) {
    var cam = _camera || window._camera;
    var ang = Math.random() * Math.PI * 2;
    var rad = 16 + Math.random() * 6;
    var baseX, baseZ;
    if (cam && cam.position) {
      baseX = cam.position.x + Math.cos(ang) * rad;
      baseZ = cam.position.z + Math.sin(ang) * rad;
    } else {
      baseX = (Math.random() - 0.5) * 30;
      baseZ = (Math.random() - 0.5) * 30;
    }

    /* perpendicular spread for formation line */
    var perpX = -Math.sin(ang);
    var perpZ =  Math.cos(ang);

    var i;
    for (i = 0; i < count; i++) {
      var offset = (i - (count - 1) / 2) * FORM_SPREAD;
      spawn(
        baseX + perpX * offset,
        0,
        baseZ + perpZ * offset
      );
    }

    /* single toast for the group */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('RIOT POLICE INCOMING');
    }
    if (window.HUD && window.HUD.showDamageFlash) {
      window.HUD.showDamageFlash(0xFF0000, 0.35);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;
    window._riotPoliceEnemies = [];
  }

  /* ════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    var i;
    for (i = 0; i < window._riotPoliceEnemies.length; i++) {
      var e = window._riotPoliceEnemies[i];
      if (_scene) _scene.remove(e.group);
      if (e.shieldFragments) {
        var j;
        for (j = 0; j < e.shieldFragments.length; j++) {
          if (_scene) _scene.remove(e.shieldFragments[j]);
        }
      }
    }
    window._riotPoliceEnemies = [];
  }

  /* ════════════════════════════════════════════════════════════════
     WAVE HOOK — spawn groups from wave 5
  ════════════════════════════════════════════════════════════════ */
  (function _hookWaveEvents() {
    var _prevWave = 0;

    function _checkWave() {
      var gm = window.GameManager;
      if (!gm) return;
      var wave = (gm.getCurrentWave && gm.getCurrentWave()) ||
                 (gm.getWave && gm.getWave())               ||
                 (gm.wave)                                   ||
                 0;
      if (wave >= 5 && wave !== _prevWave) {
        _prevWave = wave;
        setTimeout(function () {
          /* 2-3 officers per group */
          var count = 2 + Math.floor(Math.random() * 2);
          _spawnGroup(count);
        }, 2000);
      }
    }

    setInterval(_checkWave, 5000);
  })();

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  return {
    init:   init,
    update: update,
    spawn:  spawn,
    reset:  reset
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail enemy-riot-police.js",_e&&_e.message); }
/* === spy-drone.js === */
try {
;
window.SpyDrone = (function () {
  'use strict';

  // ─── private state ────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _enemies  = null; // reference to enemies array (set in init)

  // Drone object: null when not deployed
  var _drone = null;
  /*
    _drone shape:
    {
      mesh       : THREE.Group,
      rotors     : [ THREE.Mesh, ... ],   // 4 rotor meshes to spin
      hp         : Number,                // 80 max
      position   : THREE.Vector3,         // drone world position (separate from player)
      battery    : Number,                // seconds remaining (60)
      reconLight : THREE.PointLight,      // dim blue for stealth
    }
  */

  var _state = {
    active      : false,   // drone is flying
    droneView   : false,   // player is looking through drone camera
    battery     : 60,      // seconds remaining
    cooldown    : 0,       // seconds until can re-deploy
    mouseDeltaX : 0,
    mouseDeltaY : 0
  };

  var _savedCameraPos    = null; // THREE.Vector3 snapshot before entering drone view
  var _savedCameraQuat   = null; // THREE.Quaternion snapshot

  // HUD element (injected once)
  var _hudEl = null;

  // Constants
  var BATTERY_MAX     = 60;
  var COOLDOWN_NORMAL = 90;
  var COOLDOWN_SHOT   = 30; // extra penalty on top of normal when destroyed
  var DRONE_HP        = 80;
  var DRONE_SPEED     = 8;   // units per second
  var MAX_ALTITUDE    = 15;  // above ground (y=0 assumed ground)
  var RECON_RANGE     = 20;  // reveal radius
  var REVEAL_DURATION = 8;   // seconds enemy stays revealed
  var STEALTH_DETECT  = 3;   // units — enemy notices drone only within this range
  var SCORE_BONUS     = 50;  // bonus per drone-spotted kill

  // ─── key state ────────────────────────────────────────────────────────────
  var _keys = {};

  // ─── helpers ──────────────────────────────────────────────────────────────

  function _notify(msg, color) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(msg, color || '#00e5ff');
    }
  }

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'spy-drone-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:110px',
      'right:18px',
      'background:rgba(0,0,0,0.72)',
      'color:#00e5ff',
      'font:bold 13px/1.4 monospace',
      'padding:6px 10px',
      'border-radius:6px',
      'border:1px solid #00e5ff44',
      'pointer-events:none',
      'display:none',
      'z-index:9999'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _batteryBar(seconds) {
    var total  = 10;
    var filled = Math.round((seconds / BATTERY_MAX) * total);
    var bar    = '';
    var i;
    for (i = 0; i < filled; i++)  { bar += '█'; }
    for (i = filled; i < total; i++) { bar += '░'; }
    return bar;
  }

  function _updateHUD() {
    if (!_hudEl) return;

    if (!_state.active && _state.cooldown <= 0) {
      _hudEl.style.display = 'none';
      return;
    }

    _hudEl.style.display = 'block';

    if (_state.cooldown > 0 && !_state.active) {
      _hudEl.textContent = '🛸 DRONE [COOLDOWN] ' + Math.ceil(_state.cooldown) + 's';
      _hudEl.style.color = '#ff6600';
      return;
    }

    var secs = Math.ceil(_state.battery);
    _hudEl.innerHTML = '🛸 DRONE [' + _batteryBar(_state.battery) + '] ' + secs + 's' +
      (_state.droneView ? ' &nbsp;<span style="color:#ffe600">DRONE-CAM</span>' : '') +
      '<br><span style="font-size:11px;color:#88ccff">Ctrl+Shift+D recall &nbsp; E toggle view</span>';
    _hudEl.style.color = _state.battery < 15 ? '#ff4400' : '#00e5ff';
  }

  function _buildDroneMesh() {
    var group = new THREE.Group();

    // Flat body
    var bodyGeo = new THREE.BoxGeometry(0.8, 0.15, 0.8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // 4 motor arms + rotors
    var rotors = [];
    var armOffsets = [
      [ 0.4, 0,  0.4],
      [-0.4, 0,  0.4],
      [ 0.4, 0, -0.4],
      [-0.4, 0, -0.4]
    ];
    var i;
    for (i = 0; i < 4; i++) {
      var off = armOffsets[i];

      // Motor arm (thin box from centre out to corner)
      var armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 6);
      var armMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var arm    = new THREE.Mesh(armGeo, armMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(off[0], 0, off[2]);
      group.add(arm);

      // Rotor blade (flat disc)
      var rotorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 8);
      var rotorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var rotor    = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(off[0], 0.08, off[2]);
      group.add(rotor);
      rotors.push(rotor);
    }

    // Stealth point-light — very dim blue, only visible close up
    var reconLight = new THREE.PointLight(0x0044ff, 0.3, 4);
    reconLight.position.set(0, 0.1, 0);
    group.add(reconLight);

    return { group: group, rotors: rotors, reconLight: reconLight };
  }

  // ─── launch ───────────────────────────────────────────────────────────────

  function launch() {
    if (_state.active) {
      // Already flying — treat as recall
      recall();
      return;
    }
    if (_state.cooldown > 0) {
      _notify('🛸 DRONE recharging — ' + Math.ceil(_state.cooldown) + 's', '#ff6600');
      return;
    }
    if (!_scene || !_camera) {
      console.warn('[SpyDrone] Not initialised — call SpyDrone.init(scene, camera) first');
      return;
    }

    var meshData = _buildDroneMesh();

    // Start drone slightly above and in front of camera
    var spawnPos = _camera.position.clone();
    spawnPos.y += 2.5;
    spawnPos.x += _camera.getWorldDirection(new THREE.Vector3()).x * 2;
    spawnPos.z += _camera.getWorldDirection(new THREE.Vector3()).z * 2;

    meshData.group.position.copy(spawnPos);
    _scene.add(meshData.group);

    _drone = {
      mesh       : meshData.group,
      rotors     : meshData.rotors,
      reconLight : meshData.reconLight,
      hp         : DRONE_HP,
      position   : spawnPos.clone()
    };

    _state.active   = true;
    _state.droneView = false;
    _state.battery  = BATTERY_MAX;

    _notify('🛸 SPY DRONE LAUNCHED — 60s battery | E = toggle drone-cam', '#00e5ff');
    _createHUD();
    _updateHUD();
  }

  // ─── recall ───────────────────────────────────────────────────────────────

  function recall() {
    if (!_state.active || !_drone) return;

    // Exit drone view first
    if (_state.droneView) {
      _exitDroneView();
    }

    _scene.remove(_drone.mesh);
    _drone = null;
    _state.active    = false;
    _state.droneView = false;
    _state.cooldown  = COOLDOWN_NORMAL;

    _notify('🛸 DRONE RECALLED — ' + COOLDOWN_NORMAL + 's cooldown', '#ffaa00');
    _updateHUD();
  }

  // ─── view switching ───────────────────────────────────────────────────────

  function _enterDroneView() {
    if (!_drone || !_camera) return;
    _savedCameraPos  = _camera.position.clone();
    _savedCameraQuat = _camera.quaternion.clone();
    _state.droneView = true;
    // Snap camera immediately; update() will track drone
    _camera.position.copy(_drone.position);
    // Tilt slightly downward for recon look
    _camera.lookAt(
      _drone.position.x,
      _drone.position.y - 5,
      _drone.position.z
    );
    _notify('DRONE-CAM ACTIVE — E to return', '#ffe600');
  }

  function _exitDroneView() {
    if (!_camera) return;
    _state.droneView = false;
    if (_savedCameraPos)  { _camera.position.copy(_savedCameraPos); }
    if (_savedCameraQuat) { _camera.quaternion.copy(_savedCameraQuat); }
    _savedCameraPos  = null;
    _savedCameraQuat = null;
    _notify('RETURNED TO PLAYER VIEW', '#aaffcc');
  }

  // ─── recon — reveal nearby enemies ────────────────────────────────────────

  function _doRecon() {
    if (!_drone || !_enemies) return;
    var dronePos = _drone.position;
    var now      = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    var i;
    for (i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy || !enemy.position) continue;
      var dx = enemy.position.x - dronePos.x;
      var dz = enemy.position.z - dronePos.z;
      var dy = enemy.position.y - dronePos.y;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < RECON_RANGE) {
        // Mark enemy as revealed
        enemy._spyDroneRevealed = true;
        enemy._spyDroneRevealedUntil = now + REVEAL_DURATION * 1000;
        enemy._spyDroneScoreBonus = SCORE_BONUS;

        // Add / refresh a flashing reveal light above the enemy (if not already there)
        if (!enemy._spyDroneLight && _scene) {
          var revealLight = new THREE.PointLight(0xffffff, 2.5, 6);
          revealLight.position.copy(enemy.position);
          revealLight.position.y += 2.5;
          _scene.add(revealLight);
          enemy._spyDroneLight = revealLight;
        }
      }

      // Check stealth detection threshold
      if (dist < STEALTH_DETECT && enemy.alert !== undefined) {
        enemy.alert = true;
      }
    }
  }

  // Remove expired reveal lights
  function _tickReconLights(nowMs) {
    if (!_enemies) return;
    var i;
    for (i = 0; i < _enemies.length; i++) {
      var enemy = _enemies[i];
      if (!enemy) continue;
      if (enemy._spyDroneLight) {
        if (!enemy._spyDroneRevealed || nowMs > enemy._spyDroneRevealedUntil) {
          // Expire
          if (_scene) { _scene.remove(enemy._spyDroneLight); }
          enemy._spyDroneLight    = null;
          enemy._spyDroneRevealed = false;
        } else {
          // Flash: toggle intensity on ~8Hz
          var flash = Math.sin(nowMs * 0.016) > 0;
          enemy._spyDroneLight.intensity = flash ? 2.5 : 0.8;
          // Track enemy position
          enemy._spyDroneLight.position.copy(enemy.position);
          enemy._spyDroneLight.position.y += 2.5;
        }
      }
    }
  }

  // ─── receive mouse delta from the input handler ───────────────────────────
  // game-manager.js (or whoever handles mousemove) should call
  //   SpyDrone.onMouseMove(dx, dy) while drone is active.
  function onMouseMove(dx, dy) {
    if (!_state.active) return;
    _state.mouseDeltaX += dx;
    _state.mouseDeltaY += dy;
  }

  // ─── damage (called externally when projectile hits drone) ────────────────
  function takeDamage(amount) {
    if (!_state.active || !_drone) return;
    _drone.hp -= (amount || 10);
    if (_drone.hp <= 0) {
      _destroyDrone();
    }
  }

  function _destroyDrone() {
    if (!_drone) return;

    // Small explosion effect
    if (typeof StageVFX !== 'undefined' && StageVFX.spawnExplosion) {
      StageVFX.spawnExplosion(_drone.position.clone(), 1.5);
    }

    // Exit drone view
    if (_state.droneView) { _exitDroneView(); }

    _scene.remove(_drone.mesh);
    _drone = null;
    _state.active    = false;
    _state.droneView = false;
    // Normal cooldown + 30s penalty
    _state.cooldown  = COOLDOWN_NORMAL + COOLDOWN_SHOT;

    _notify('🛸 DRONE DESTROYED! +' + COOLDOWN_SHOT + 's penalty cooldown', '#ff2200');
    _updateHUD();
  }

  // ─── keyboard wiring ──────────────────────────────────────────────────────

  function _onKeyDown(e) {
    // Ctrl+Shift+D — launch or recall
    if (e.ctrlKey && e.shiftKey && (e.code === 'KeyD' || e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      if (_state.active) {
        recall();
      } else {
        launch();
      }
      return;
    }

    // E — toggle drone camera (only while drone is active)
    if ((e.code === 'KeyE' || e.key === 'e' || e.key === 'E') && _state.active) {
      if (_state.droneView) {
        _exitDroneView();
      } else {
        _enterDroneView();
      }
    }
  }

  // ─── init ─────────────────────────────────────────────────────────────────

  function init(scene, camera, enemies) {
    _scene   = scene;
    _camera  = camera;
    _enemies = enemies || null;

    _createHUD();

    // Keyboard listener (guard against double-registration)
    if (!window._spyDroneKeyBound) {
      window.addEventListener('keydown', _onKeyDown, false);
      window._spyDroneKeyBound = true;
    }
  }

  // ─── update (called every frame from game-manager) ────────────────────────

  function update(delta) {
    var nowMs = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    // Tick cooldown when drone is NOT active
    if (!_state.active) {
      if (_state.cooldown > 0) {
        _state.cooldown = Math.max(0, _state.cooldown - delta);
        _updateHUD();
      }
      _tickReconLights(nowMs);
      return;
    }

    // ── Drain battery ──
    _state.battery -= delta;
    if (_state.battery <= 0) {
      _state.battery = 0;
      _notify('🛸 DRONE BATTERY DEAD — recalled', '#ff4400');
      recall();
      return;
    }

    if (!_drone) return;

    // ── Spin rotors ──
    var ROTOR_SPEED = 15; // rad/s
    var r;
    for (r = 0; r < _drone.rotors.length; r++) {
      _drone.rotors[r].rotation.y += ROTOR_SPEED * delta;
    }

    // ── Move drone based on mouse delta + camera look direction ──
    var sensitivityH = 0.003; // radians per pixel
    var sensitivityV = 0.003;

    var dx = _state.mouseDeltaX * sensitivityH;
    var dy = _state.mouseDeltaY * sensitivityV;
    _state.mouseDeltaX = 0;
    _state.mouseDeltaY = 0;

    if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
      // Use camera's horizontal orientation for lateral movement
      var forward = new THREE.Vector3();
      _camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      var right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      // Horizontal movement from left/right mouse
      _drone.position.addScaledVector(right,   dx * DRONE_SPEED);
      // Vertical movement from up/down mouse (inverted so "up" raises drone)
      _drone.position.y -= dy * DRONE_SPEED;

      // Clamp altitude
      if (_drone.position.y > MAX_ALTITUDE) { _drone.position.y = MAX_ALTITUDE; }
      if (_drone.position.y < 1.0)          { _drone.position.y = 1.0; }
    }

    // Also allow WASD-style movement via held keys when in drone view
    if (_state.droneView) {
      var forwardDir = new THREE.Vector3();
      _camera.getWorldDirection(forwardDir);
      forwardDir.y = 0;
      forwardDir.normalize();

      var rightDir = new THREE.Vector3();
      rightDir.crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();

      var moveSpeed = DRONE_SPEED * delta;
      if (_keys['KeyW'] || _keys['ArrowUp'])    { _drone.position.addScaledVector(forwardDir,  moveSpeed); }
      if (_keys['KeyS'] || _keys['ArrowDown'])  { _drone.position.addScaledVector(forwardDir, -moveSpeed); }
      if (_keys['KeyA'] || _keys['ArrowLeft'])  { _drone.position.addScaledVector(rightDir,   -moveSpeed); }
      if (_keys['KeyD'] || _keys['ArrowRight']) { _drone.position.addScaledVector(rightDir,    moveSpeed); }
      if (_keys['KeyQ'])                        { _drone.position.y = Math.max(1, _drone.position.y - moveSpeed); }
      if (_keys['KeyR'])                        { _drone.position.y = Math.min(MAX_ALTITUDE, _drone.position.y + moveSpeed); }
    }

    // Sync mesh position
    _drone.mesh.position.copy(_drone.position);

    // Hover bob
    _drone.mesh.position.y += Math.sin(nowMs * 0.002) * 0.03;

    // ── Drone-camera tracking ──
    if (_state.droneView && _camera) {
      _camera.position.copy(_drone.position);
      // Slight downward angle for recon
      var lookTarget = new THREE.Vector3(
        _drone.position.x,
        _drone.position.y - 5,
        _drone.position.z
      );
      _camera.lookAt(lookTarget);
    }

    // ── Recon sweep every 0.5s (throttled) ──
    if (!_drone._lastReconTime || nowMs - _drone._lastReconTime > 500) {
      _doRecon();
      _drone._lastReconTime = nowMs;
    }

    // ── Tick reveal lights ──
    _tickReconLights(nowMs);

    // ── Update HUD ──
    _updateHUD();
  }

  // ─── reset (called on game restart) ──────────────────────────────────────

  function reset() {
    if (_drone) {
      if (_state.droneView) { _exitDroneView(); }
      if (_scene) { _scene.remove(_drone.mesh); }
      _drone = null;
    }

    // Clean up all reveal lights
    if (_enemies) {
      var i;
      for (i = 0; i < _enemies.length; i++) {
        var enemy = _enemies[i];
        if (enemy && enemy._spyDroneLight && _scene) {
          _scene.remove(enemy._spyDroneLight);
          enemy._spyDroneLight    = null;
          enemy._spyDroneRevealed = false;
        }
      }
    }

    _state.active    = false;
    _state.droneView = false;
    _state.battery   = BATTERY_MAX;
    _state.cooldown  = 0;
    _state.mouseDeltaX = 0;
    _state.mouseDeltaY = 0;

    _savedCameraPos  = null;
    _savedCameraQuat = null;

    _updateHUD();
  }

  // ─── key tracking for WASD in drone view ─────────────────────────────────
  (function () {
    function _onDown(e) { _keys[e.code] = true; }
    function _onUp(e)   { _keys[e.code] = false; }
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', _onDown, false);
      window.addEventListener('keyup',   _onUp,   false);
    }
  }());

  // ─── public API ──────────────────────────────────────────────────────────
  return {
    init       : init,
    update     : update,
    launch     : launch,
    recall     : recall,
    reset      : reset,
    takeDamage : takeDamage,
    onMouseMove: onMouseMove,
    isActive   : function () { return _state.active; },
    isDroneView: function () { return _state.droneView; }
  };
}());
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail spy-drone.js",_e&&_e.message); }
/* === boss-final-form.js === */
try {
;
/* ─────────────────────────────────────────────────────────────────────────────
   BOSS FINAL FORM — Wave 20 ultimate boss second phase transformation
   When the final boss's HP drops to 30%, it transforms into a devastating
   second phase with new attacks, visuals, and a massive reward on death.
   ───────────────────────────────────────────────────────────────────────────── */
window.BossFinalForm = (function () {
  'use strict';

  /* ── internal state ───────────────────────────────────────────────────────── */
  var _scene           = null;
  var _camera          = null;
  var _phase2Active    = false;
  var _triggered       = false;   // one-shot: only transform once per session
  var _boss            = null;    // reference to the enemy object

  /* transformation */
  var _scaleTimer      = 0;       // time into scale-up animation (0→2s)
  var _scaleDuration   = 2.0;

  /* shield orbs */
  var _shieldOrbs      = [];      // array of {mesh, angle}
  var _orbitRadius     = 3.5;
  var _orbitSpeed      = 1.2;     // radians/sec
  var _orbAngleOffset  = Math.PI * 2 / 4;  // 90° between orbs

  /* laser beam */
  var _laserMesh       = null;
  var _laserAngle      = 0;
  var _laserSpeed      = 0.4;     // rad/sec
  var _laserDmgTimer   = 0;
  var _laserDmgRate    = 0.1;     // check every 0.1s

  /* minion summon */
  var _minionTimer     = 0;
  var _minionInterval  = 15;

  /* ground slam */
  var _slamTimer       = 0;
  var _slamInterval    = 10;
  var _slamParticles   = [];      // {mesh, vel, life, maxLife}

  /* shockwave (spawn-burst visual) */
  var _shockwaveMesh   = null;
  var _shockwaveTimer  = 0;
  var _shockwaveDur    = 0.5;

  /* light dim */
  var _lightDimTimer   = 0;
  var _lightDimDur     = 1.5;
  var _lightsDimmed    = false;
  var _savedLights     = [];      // [{light, originalIntensity}]

  /* vignette */
  var _vignetteEl      = null;

  /* audio ctx (Web Audio fallback) */
  var _audioCtx        = null;

  /* phase 2 death explosion */
  var _deathActive     = false;
  var _deathTimer      = 0;
  var _deathDuration   = 5.0;
  var _deathParticles  = [];
  var _deathStage      = 0;       // 0,1,2 — three explosion stages
  var _deathStageTimes = [1.5, 3.0, 5.0];

  /* ── geometry/material caches ─────────────────────────────────────────────── */
  var _geoShield   = null;    // SphereGeometry(0.4)
  var _matShield   = null;
  var _geoFire     = null;    // fire burst particles
  var _matFire     = null;
  var _geoExplosion = null;
  var _matExplosion = null;

  /* ────────────────────────────────────────────────────────────────────────────
     PUBLIC API
   ─────────────────────────────────────────────────────────────────────────── */

  /* init(scene, camera) — called once when scene is ready */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _reset();
  }

  /* update(delta) — called every frame from the main game loop */
  function update(delta) {
    if (!_scene) return;

    /* ── watch for trigger condition ── */
    if (!_triggered && !_phase2Active) {
      _checkTrigger();
    }

    if (!_phase2Active && !_deathActive) return;

    /* ── shockwave expand/fade ── */
    if (_shockwaveMesh) {
      _shockwaveTimer += delta;
      var sw = _shockwaveTimer / _shockwaveDur;
      if (sw >= 1) {
        _scene.remove(_shockwaveMesh);
        _shockwaveMesh = null;
      } else {
        var swScale = 1 + sw * 24;   // expand from 1 to 25 units
        _shockwaveMesh.scale.setScalar(swScale);
        _shockwaveMesh.material.opacity = (1 - sw) * 0.7;
      }
    }

    /* ── scale boss up over 2s ── */
    if (_phase2Active && _boss && _boss.mesh && _scaleTimer < _scaleDuration) {
      _scaleTimer += delta;
      var t = Math.min(_scaleTimer / _scaleDuration, 1);
      var s = 1 + t * 2;   // lerp 1→3
      _boss.mesh.scale.setScalar(s);
    }

    /* ── dim lights momentarily after transform ── */
    if (_lightsDimmed) {
      _lightDimTimer += delta;
      var progress = _lightDimTimer / _lightDimDur;
      if (progress >= 1) {
        /* restore */
        for (var ri = 0; ri < _savedLights.length; ri++) {
          _savedLights[ri].light.intensity = _savedLights[ri].orig;
        }
        _savedLights = [];
        _lightsDimmed = false;
      } else {
        /* 0→0.5: dim; 0.5→1: restore */
        var factor;
        if (progress < 0.5) {
          factor = 1 - (progress / 0.5) * 0.7;   // 1→0.3
        } else {
          factor = 0.3 + ((progress - 0.5) / 0.5) * 0.7;  // 0.3→1
        }
        for (var li2 = 0; li2 < _savedLights.length; li2++) {
          _savedLights[li2].light.intensity = _savedLights[li2].orig * factor;
        }
      }
    }

    if (_phase2Active) {
      /* guard: boss may have died */
      if (!_boss || !_boss.alive) {
        if (_boss && _boss.hp <= 0 && !_deathActive) {
          _startPhase2Death();
        }
        return;
      }

      /* ── orbit shield orbs ── */
      for (var oi = 0; oi < _shieldOrbs.length; oi++) {
        var orb = _shieldOrbs[oi];
        orb.angle += _orbitSpeed * delta;
        if (_boss.mesh) {
          orb.mesh.position.x = _boss.mesh.position.x + Math.cos(orb.angle) * _orbitRadius;
          orb.mesh.position.y = _boss.mesh.position.y + 1.2;
          orb.mesh.position.z = _boss.mesh.position.z + Math.sin(orb.angle) * _orbitRadius;
        }
      }

      /* ── rotate laser beam ── */
      if (_laserMesh && _boss.mesh) {
        _laserAngle += _laserSpeed * delta;
        _laserMesh.position.copy(_boss.mesh.position);
        _laserMesh.position.y += 1.5;
        _laserMesh.rotation.y = _laserAngle;

        /* check player hit */
        _laserDmgTimer += delta;
        if (_laserDmgTimer >= _laserDmgRate) {
          _laserDmgTimer = 0;
          _checkLaserHit();
        }
      }

      /* ── minion summon every 15s ── */
      _minionTimer += delta;
      if (_minionTimer >= _minionInterval) {
        _minionTimer = 0;
        _spawnMinions();
      }

      /* ── ground slam every 10s ── */
      _slamTimer += delta;
      if (_slamTimer >= _slamInterval) {
        _slamTimer = 0;
        _groundSlam();
      }

      /* ── tick fire burst particles ── */
      for (var fi = _slamParticles.length - 1; fi >= 0; fi--) {
        var fp = _slamParticles[fi];
        fp.life -= delta;
        if (fp.life <= 0) {
          _scene.remove(fp.mesh);
          _slamParticles.splice(fi, 1);
        } else {
          fp.mesh.position.x += fp.vel.x * delta;
          fp.mesh.position.y += fp.vel.y * delta;
          fp.mesh.position.z += fp.vel.z * delta;
          fp.vel.y -= 4 * delta;   // gravity
          fp.mesh.material.opacity = fp.life / fp.maxLife;
        }
      }

      /* ── update boss bar HUD ── */
      if (typeof HUD !== 'undefined' && HUD.showBossBar) {
        HUD.showBossBar('PHASE 2 — THE DESTROYER', _boss.hp, _boss.maxHp || 2500);
      }
    }

    /* ── death explosion sequence ── */
    if (_deathActive) {
      _tickDeathExplosion(delta);
    }
  }

  /* trigger() — force-trigger the phase 2 transformation (for testing) */
  function trigger() {
    if (_triggered) return;
    var allEnemies = (typeof Enemies !== 'undefined' && Enemies.getAll) ? Enemies.getAll() : [];
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (e && e.alive && e.typeName && e.typeName.indexOf('BOSS') !== -1) {
        _boss = e;
        break;
      }
    }
    if (_boss) _beginTransformation();
  }

  /* reset() — called between waves/stages */
  function reset() {
    _reset();
  }

  /* ────────────────────────────────────────────────────────────────────────────
     INTERNAL — trigger check
   ─────────────────────────────────────────────────────────────────────────── */
  function _checkTrigger() {
    /* must be wave 20 */
    var wave = 0;
    if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
      wave = GameManager.getCurrentWave();
    } else if (typeof window._waveNum === 'number') {
      wave = window._waveNum;
    }
    if (wave < 20) return;

    /* find the active boss */
    var allEnemies = (typeof Enemies !== 'undefined' && Enemies.getAll) ? Enemies.getAll() : [];
    var foundBoss = null;
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (!e || !e.alive) continue;
      var tn = e.typeName || (e.typeCfg && e.typeCfg.name) || '';
      if (tn.indexOf('BOSS') !== -1 || (e.typeCfg && e.typeCfg.role === 'boss')) {
        foundBoss = e;
        break;
      }
    }
    if (!foundBoss) return;

    /* check HP threshold: 30% */
    var hpPct = foundBoss.hp / (foundBoss.maxHp || foundBoss.hp);
    if (hpPct <= 0.30) {
      _boss = foundBoss;
      _beginTransformation();
    }
  }

  /* ────────────────────────────────────────────────────────────────────────────
     INTERNAL — transformation
   ─────────────────────────────────────────────────────────────────────────── */
  function _beginTransformation() {
    if (_triggered) return;
    _triggered    = true;
    _phase2Active = true;
    _scaleTimer   = 0;

    /* ── shockwave sphere (visual only) ── */
    var geoSW = new THREE.SphereGeometry(1, 16, 8);
    var matSW = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.7,
      wireframe: true
    });
    _shockwaveMesh = new THREE.Mesh(geoSW, matSW);
    if (_boss && _boss.mesh) {
      _shockwaveMesh.position.copy(_boss.mesh.position);
    }
    _scene.add(_shockwaveMesh);
    _shockwaveTimer = 0;

    /* ── boss color → blood red + orange emissive ── */
    if (_boss && _boss.mesh) {
      _boss.mesh.traverse(function (child) {
        if (child.isMesh && child.material) {
          var mats = Array.isArray(child.material) ? child.material : [child.material];
          for (var mi = 0; mi < mats.length; mi++) {
            try { mats[mi].color.setHex(0x8B0000); } catch (e) {}
            try {
              if (mats[mi].emissive) mats[mi].emissive.setHex(0xff6600);
              if (typeof mats[mi].emissiveIntensity !== 'undefined') mats[mi].emissiveIntensity = 0.6;
            } catch (e) {}
          }
        }
      });
    }

    /* ── refill HP to 2500 ── */
    if (_boss) {
      _boss.hp    = 2500;
      _boss.maxHp = 2500;
    }

    /* ── dim all scene lights to 30% ── */
    _dimLights();

    /* ── spawn 4 orbiting shield orbs ── */
    _spawnShieldOrbs();

    /* ── spawn rotating laser beam ── */
    _spawnLaser();

    /* ── show vignette ── */
    _showVignette();

    /* ── dramatic audio ── */
    _playTransformSound();

    /* ── HUD announcement ── */
    if (typeof HUD !== 'undefined' && HUD.showBossIntro) {
      HUD.showBossIntro('THE DESTROYER — PHASE 2');
    } else if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('⚠ PHASE 2 — THE DESTROYER ⚠', '#8B0000');
    }

    /* reset attack timers so attacks don't fire immediately */
    _minionTimer = 5;   /* first minions after 5s */
    _slamTimer   = 5;   /* first slam after 5s */
  }

  /* ── dim scene lights ── */
  function _dimLights() {
    if (!_scene) return;
    _savedLights = [];
    _scene.traverse(function (obj) {
      if (obj.isLight && typeof obj.intensity === 'number') {
        _savedLights.push({ light: obj, orig: obj.intensity });
      }
    });
    /* apply 30% immediately; _lightsDimmed loop will interpolate */
    _lightsDimmed  = true;
    _lightDimTimer = 0;
  }

  /* ── spawn 4 orbiting shield spheres ── */
  function _spawnShieldOrbs() {
    if (!_geoShield) _geoShield = new THREE.SphereGeometry(0.4, 8, 6);
    if (!_matShield) _matShield = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: new THREE.Color(0xff3300),
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85
    });

    _shieldOrbs = [];
    for (var i = 0; i < 4; i++) {
      var orbMesh = new THREE.Mesh(_geoShield, _matShield.clone());
      var startAngle = i * _orbAngleOffset;
      if (_boss && _boss.mesh) {
        orbMesh.position.set(
          _boss.mesh.position.x + Math.cos(startAngle) * _orbitRadius,
          _boss.mesh.position.y + 1.2,
          _boss.mesh.position.z + Math.sin(startAngle) * _orbitRadius
        );
      }
      _scene.add(orbMesh);
      _shieldOrbs.push({ mesh: orbMesh, angle: startAngle });
    }
  }

  /* ── spawn rotating laser cylinder ── */
  function _spawnLaser() {
    var geoLaser = new THREE.CylinderGeometry(0.05, 0.05, 50, 8);
    var matLaser = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.85
    });
    _laserMesh = new THREE.Mesh(geoLaser, matLaser);
    /* rotate cylinder so it lies horizontally along X; then rotation.y sweeps it */
    _laserMesh.rotation.z = Math.PI / 2;
    /* offset so it extends forward from the centre: CylinderGeometry is centred,
       so we wrap it in a pivot group offset by half the length */
    var pivot = new THREE.Group();
    if (_boss && _boss.mesh) {
      pivot.position.copy(_boss.mesh.position);
      pivot.position.y += 1.5;
    }
    _laserMesh.position.x = 25;   /* half of 50, beam extends 0→50 from boss */
    pivot.add(_laserMesh);
    _laserMesh._pivot = pivot;     /* store ref for updates */
    _scene.add(pivot);
    /* replace _laserMesh reference with the group for position updates */
    _laserMesh = pivot;
  }

  /* ── check laser hit on player ── */
  function _checkLaserHit() {
    if (!_boss || !_boss.mesh || !_camera) return;
    var playerPos = _camera.position;
    var bossPos   = _boss.mesh.position;

    /* project player onto laser plane (assume laser sweeps in XZ at height ~bossPos.y + 1.5) */
    var dx = playerPos.x - bossPos.x;
    var dz = playerPos.z - bossPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 1 || dist > 26) return;   /* too close or too far */

    var playerAngle = Math.atan2(dz, dx);
    /* normalise angles to [0, 2π] */
    var la = ((_laserAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    var pa = ((playerAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    var diff = Math.abs(la - pa);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;

    if (diff < 0.25) {   /* within ~14° */
      /* 15 dmg/s, but checked every 0.1s → 1.5 dmg per check */
      var dmg = 15 * _laserDmgRate;
      var gm = typeof GameManager !== 'undefined' ? GameManager : null;
      if (gm && gm.getPlayer) {
        var p = gm.getPlayer();
        if (p && !p.godMode) {
          p.hp = Math.max(0, p.hp - dmg);
          if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(p.hp, p.maxHp);
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff0000, 0.1);
        }
      }
    }
  }

  /* ── spawn 3 regular enemies ── */
  function _spawnMinions() {
    if (typeof Enemies === 'undefined' || !Enemies.spawnSingle || !_boss || !_boss.mesh) return;
    var bx = _boss.mesh.position.x;
    var bz = _boss.mesh.position.z;
    var minionTypes = ['STORMER', 'CONSCRIPT', 'ARMORED'];
    for (var i = 0; i < 3; i++) {
      var angle = (i / 3) * Math.PI * 2;
      var sx = bx + Math.cos(angle) * 6;
      var sz = bz + Math.sin(angle) * 6;
      try {
        Enemies.spawnSingle(minionTypes[i] || 'STORMER', { x: sx, z: sz });
      } catch (e) {}
    }
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('THE DESTROYER CALLS REINFORCEMENTS', '#ff4400');
    }
  }

  /* ── ground slam ── */
  function _groundSlam() {
    if (!_boss || !_boss.mesh || !_scene) return;
    var bpos = _boss.mesh.position;

    /* camera shake */
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
      CameraSystem.shake(0.3, 1.0);
    }

    /* radial fire burst — 16 particles outward 8 units */
    if (!_geoFire) _geoFire = new THREE.SphereGeometry(0.15, 4, 4);
    if (!_matFire) _matFire = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 1.0
    });

    for (var i = 0; i < 16; i++) {
      var angle  = (i / 16) * Math.PI * 2;
      var speed  = 6 + Math.random() * 3;
      var pMesh  = new THREE.Mesh(_geoFire, _matFire.clone());
      pMesh.position.set(bpos.x, bpos.y + 0.3, bpos.z);
      _scene.add(pMesh);
      var life = 1.2 + Math.random() * 0.6;
      _slamParticles.push({
        mesh: pMesh,
        vel:  {
          x: Math.cos(angle) * speed,
          y: 2 + Math.random() * 3,
          z: Math.sin(angle) * speed
        },
        life:    life,
        maxLife: life
      });
    }

    /* damage player if within 8 units */
    var gm = typeof GameManager !== 'undefined' ? GameManager : null;
    if (gm && gm.getPlayer && _camera) {
      var p = gm.getPlayer();
      if (p) {
        var pdx = _camera.position.x - bpos.x;
        var pdz = _camera.position.z - bpos.z;
        var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pdist <= 8 && !p.godMode) {
          p.hp = Math.max(0, p.hp - 30);
          if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(p.hp, p.maxHp);
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff6600, 0.3);
        }
      }
    }
  }

  /* ── vignette ── */
  function _showVignette() {
    if (_vignetteEl) return;
    _vignetteEl = document.createElement('div');
    _vignetteEl.id = 'boss-phase2-vignette';
    _vignetteEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:500;',
      'background:radial-gradient(',
      '  transparent 55%,',
      '  rgba(139,0,0,0.35) 80%,',
      '  rgba(100,0,0,0.6) 100%',
      ');'
    ].join('');
    document.body.appendChild(_vignetteEl);
  }

  function _removeVignette() {
    if (_vignetteEl && _vignetteEl.parentNode) {
      _vignetteEl.parentNode.removeChild(_vignetteEl);
    }
    _vignetteEl = null;
  }

  /* ── dramatic transformation audio (Web Audio API) ── */
  function _playTransformSound() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;

      /* deep bass crash */
      var bassOsc  = ctx.createOscillator();
      var bassGain = ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(60, ctx.currentTime);
      bassOsc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.5);
      bassGain.gain.setValueAtTime(0.6, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(ctx.currentTime);
      bassOsc.stop(ctx.currentTime + 2.0);

      /* rising tone */
      var riseOsc  = ctx.createOscillator();
      var riseGain = ctx.createGain();
      riseOsc.type = 'sine';
      riseOsc.frequency.setValueAtTime(80, ctx.currentTime + 0.3);
      riseOsc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 2.5);
      riseGain.gain.setValueAtTime(0.0, ctx.currentTime + 0.3);
      riseGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.0);
      riseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);
      riseOsc.connect(riseGain);
      riseGain.connect(ctx.destination);
      riseOsc.start(ctx.currentTime + 0.3);
      riseOsc.stop(ctx.currentTime + 3.0);

      /* reverb crash (noise burst) */
      var bufLen    = ctx.sampleRate * 0.8;
      var buffer    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var bufData   = buffer.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        bufData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 3);
      }
      var bufSrc    = ctx.createBufferSource();
      var noiseGain = ctx.createGain();
      bufSrc.buffer = buffer;
      noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);
      bufSrc.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      bufSrc.start(ctx.currentTime);
    } catch (e) {
      /* audio unavailable — silent fail */
    }
  }

  /* ────────────────────────────────────────────────────────────────────────────
     INTERNAL — phase 2 death
   ─────────────────────────────────────────────────────────────────────────── */
  function _startPhase2Death() {
    _deathActive = true;
    _deathTimer  = 0;
    _deathStage  = 0;
    _phase2Active = false;

    /* clear laser, orbs */
    _clearPhase2Objects();

    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('THE DESTROYER HAS FALLEN', '#ffd700');
    }
    _spawnDeathParticles(0);
  }

  function _tickDeathExplosion(delta) {
    _deathTimer += delta;

    /* progress to next explosion stage */
    if (_deathStage < 3 && _deathTimer >= _deathStageTimes[_deathStage]) {
      _deathStage++;
      if (_deathStage < 3) {
        _spawnDeathParticles(_deathStage);
        if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
          CameraSystem.shake(0.4, 1.5);
        }
      }
    }

    /* tick death particles */
    for (var i = _deathParticles.length - 1; i >= 0; i--) {
      var dp = _deathParticles[i];
      dp.life -= delta;
      if (dp.life <= 0) {
        if (_scene) _scene.remove(dp.mesh);
        _deathParticles.splice(i, 1);
      } else {
        dp.mesh.position.x += dp.vel.x * delta;
        dp.mesh.position.y += dp.vel.y * delta;
        dp.mesh.position.z += dp.vel.z * delta;
        dp.vel.y -= 5 * delta;
        var lifePct = dp.life / dp.maxLife;
        dp.mesh.material.opacity = lifePct;
        var s = 1 + (1 - lifePct) * 2;
        dp.mesh.scale.setScalar(s);
      }
    }

    /* done: grant reward, remove vignette */
    if (_deathTimer >= _deathDuration && _deathActive) {
      _deathActive = false;
      _grantPhase2Reward();
      _removeVignette();
    }
  }

  function _spawnDeathParticles(stage) {
    if (!_scene || !_boss || !_boss.mesh) return;
    if (!_geoExplosion) _geoExplosion = new THREE.SphereGeometry(0.3, 6, 4);
    if (!_matExplosion) _matExplosion = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 1.0
    });

    var bpos  = _boss.mesh.position;
    var count = 20 + stage * 15;
    var speedMulti = 1 + stage * 0.8;

    for (var i = 0; i < count; i++) {
      var pMesh = new THREE.Mesh(_geoExplosion, _matExplosion.clone());
      pMesh.position.copy(bpos);
      pMesh.position.x += (Math.random() - 0.5) * 3;
      pMesh.position.y += (Math.random()) * 2;
      pMesh.position.z += (Math.random() - 0.5) * 3;
      _scene.add(pMesh);
      var speed = (4 + Math.random() * 6) * speedMulti;
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.random() * Math.PI;
      var life  = 1.5 + Math.random() * 1.5;
      _deathParticles.push({
        mesh: pMesh,
        vel: {
          x: Math.sin(phi) * Math.cos(theta) * speed,
          y: Math.abs(Math.cos(phi)) * speed,
          z: Math.sin(phi) * Math.sin(theta) * speed
        },
        life:    life,
        maxLife: life
      });
    }
  }

  function _grantPhase2Reward() {
    var reward = 2500;
    if (typeof Marketplace !== 'undefined') {
      if (Marketplace.awardCustomOKC) {
        Marketplace.awardCustomOKC(reward, 'boss_phase2_kill', {});
      } else if (Marketplace.addOKC) {
        Marketplace.addOKC(reward);
      }
      if (typeof HUD !== 'undefined' && HUD.updateOKC) {
        HUD.updateOKC(Marketplace.getOKC());
      }
    }
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('+2500 OKC — THE DESTROYER SLAIN', '#ffd700');
    }
  }

  /* ────────────────────────────────────────────────────────────────────────────
     INTERNAL — cleanup helpers
   ─────────────────────────────────────────────────────────────────────────── */
  function _clearPhase2Objects() {
    /* shield orbs */
    for (var i = 0; i < _shieldOrbs.length; i++) {
      if (_scene) _scene.remove(_shieldOrbs[i].mesh);
    }
    _shieldOrbs = [];

    /* laser */
    if (_laserMesh) {
      if (_scene) _scene.remove(_laserMesh);
      _laserMesh = null;
    }

    /* shockwave */
    if (_shockwaveMesh) {
      if (_scene) _scene.remove(_shockwaveMesh);
      _shockwaveMesh = null;
    }

    /* slam particles */
    for (var si = _slamParticles.length - 1; si >= 0; si--) {
      if (_scene) _scene.remove(_slamParticles[si].mesh);
    }
    _slamParticles = [];
  }

  function _reset() {
    _clearPhase2Objects();

    /* death particles */
    for (var di = _deathParticles.length - 1; di >= 0; di--) {
      if (_scene) _scene.remove(_deathParticles[di].mesh);
    }
    _deathParticles = [];

    /* restore lights if dimmed */
    if (_lightsDimmed) {
      for (var li = 0; li < _savedLights.length; li++) {
        _savedLights[li].light.intensity = _savedLights[li].orig;
      }
    }
    _savedLights   = [];
    _lightsDimmed  = false;
    _lightDimTimer = 0;

    _removeVignette();

    _phase2Active  = false;
    _triggered     = false;
    _boss          = null;
    _scaleTimer    = 0;
    _laserAngle    = 0;
    _laserDmgTimer = 0;
    _minionTimer   = 0;
    _slamTimer     = 0;
    _shockwaveTimer = 0;
    _deathActive   = false;
    _deathTimer    = 0;
    _deathStage    = 0;
  }

  /* ────────────────────────────────────────────────────────────────────────────
     SHIELD DAMAGE REDUCTION (called by Enemies.damage intercept if supported)
   ─────────────────────────────────────────────────────────────────────────── */
  /* Returns the damage multiplier for the active boss when phase 2 shields are up. */
  function getPhase2DamageMultiplier() {
    if (_phase2Active && _shieldOrbs.length > 0) {
      return 0.30;   /* 70% reduction */
    }
    return 1.0;
  }

  /* ────────────────────────────────────────────────────────────────────────────
     EXPORTS
   ─────────────────────────────────────────────────────────────────────────── */
  return {
    init:   init,
    update: update,
    trigger: trigger,
    reset:  reset,
    isPhase2Active:             function () { return _phase2Active; },
    getPhase2DamageMultiplier:  getPhase2DamageMultiplier
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail boss-final-form.js",_e&&_e.message); }
/* === night-vision-goggles.js === */
try {
;
window.NightVisionGoggles = (function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  var _active = false;
  var _battery = 1.0;          // 0-1; 1 = full
  var _lastTime = null;
  var _flickerTimer = 0;
  var _flickerState = true;
  var _powerOffAnim = false;
  var _powerOffTimer = 0;
  var _transitioning = false;

  // Battery constants
  var BATTERY_DRAIN_RATE   = 1 / 60;   // depletes in 60 s
  var BATTERY_CHARGE_RATE  = 1 / 120;  // recharges in 120 s (0.5× rate)
  var FLICKER_THRESHOLD    = 10 / 60;  // < 10 s remaining → flicker
  var FLICKER_INTERVAL     = 0.1;      // 100 ms on/off
  var POWER_OFF_DURATION   = 0.6;      // seconds for loss-of-power animation

  // ── DOM elements (created lazily in init) ─────────────────────────────────
  var _overlay      = null;   // green tint + vignette + scanlines
  var _frameLeft    = null;   // left goggle ring
  var _frameRight   = null;   // right goggle ring
  var _hud          = null;   // HUD status text
  var _lowBatWarn   = null;   // "NVG LOW BATTERY" warning
  var _staticAnim   = null;   // setInterval handle for static noise

  // ── Private helpers ────────────────────────────────────────────────────────

  function _createOverlay() {
    _overlay = document.createElement('div');
    _overlay.id = 'nvg-overlay';
    var s = _overlay.style;
    s.position   = 'fixed';
    s.top        = '0';
    s.left       = '0';
    s.width      = '100vw';
    s.height     = '100vh';
    s.pointerEvents = 'none';
    s.zIndex     = '998';
    s.display    = 'none';
    s.transition = 'opacity 0.4s';
    s.opacity    = '0';

    // Green phosphor tint
    s.background = 'rgba(0, 40, 0, 0.3)';

    // Vignette via radial gradient (edges dark, center clear)
    // Scan lines via repeating-linear-gradient layered on top
    s.backgroundImage = [
      'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.8) 100%)',
      'repeating-linear-gradient(to bottom, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 2px)'
    ].join(', ');

    // CSS keyframe for static noise (shift background-position)
    if (!document.getElementById('nvg-style')) {
      var style = document.createElement('style');
      style.id = 'nvg-style';
      style.textContent = [
        '@keyframes nvgStatic {',
        '  0%   { background-position: 0 0, 0 0; }',
        '  20%  { background-position: 0 0, 2px 0; }',
        '  40%  { background-position: 0 0, -1px 0; }',
        '  60%  { background-position: 0 0, 0 3px; }',
        '  80%  { background-position: 0 0, 1px -2px; }',
        '  100% { background-position: 0 0, 0 0; }',
        '}',
        '@keyframes nvgFlicker {',
        '  0%, 49%  { opacity: 1; }',
        '  50%, 100% { opacity: 0; }',
        '}',
        '@keyframes nvgPowerOff {',
        '  0%   { opacity: 1; filter: brightness(2.5) saturate(0) hue-rotate(90deg) contrast(1.3); }',
        '  30%  { opacity: 1; filter: brightness(0.1) saturate(0); }',
        '  60%  { opacity: 0; filter: brightness(0) saturate(0); }',
        '  100% { opacity: 0; filter: none; }',
        '}'
      ].join('\n');
      document.head.appendChild(style);
    }

    document.body.appendChild(_overlay);
  }

  function _createGoggleFrames() {
    var container = document.createElement('div');
    container.id = 'nvg-frames';
    var cs = container.style;
    cs.position = 'fixed';
    cs.top      = '0';
    cs.left     = '0';
    cs.width    = '100vw';
    cs.height   = '100vh';
    cs.pointerEvents = 'none';
    cs.zIndex   = '999';
    cs.display  = 'none';
    cs.transition = 'opacity 0.4s';
    cs.opacity  = '0';

    var size = '38vmin';

    _frameLeft = document.createElement('div');
    var ls = _frameLeft.style;
    ls.position     = 'absolute';
    ls.top          = '50%';
    ls.left         = '50%';
    ls.width        = size;
    ls.height       = size;
    ls.borderRadius = '50%';
    ls.border       = '3px solid rgba(0,100,0,0.5)';
    ls.transform    = 'translate(-105%, -50%)';
    ls.boxShadow    = 'inset 0 0 30px rgba(0,40,0,0.2), 0 0 8px rgba(0,100,0,0.3)';

    _frameRight = document.createElement('div');
    var rs = _frameRight.style;
    rs.position     = 'absolute';
    rs.top          = '50%';
    rs.left         = '50%';
    rs.width        = size;
    rs.height       = size;
    rs.borderRadius = '50%';
    rs.border       = '3px solid rgba(0,100,0,0.5)';
    rs.transform    = 'translate(5%, -50%)';
    rs.boxShadow    = 'inset 0 0 30px rgba(0,40,0,0.2), 0 0 8px rgba(0,100,0,0.3)';

    container.appendChild(_frameLeft);
    container.appendChild(_frameRight);
    document.body.appendChild(container);

    // Keep reference so we can hide/show together
    _frameLeft._container = container;
  }

  function _createHUD() {
    _hud = document.createElement('div');
    _hud.id = 'nvg-hud';
    var hs = _hud.style;
    hs.position   = 'fixed';
    hs.top        = '12px';
    hs.right      = '16px';
    hs.color      = '#00ff44';
    hs.fontFamily = 'monospace';
    hs.fontSize   = '13px';
    hs.fontWeight = 'bold';
    hs.zIndex     = '1000';
    hs.display    = 'none';
    hs.textShadow = '0 0 6px #00ff44';
    hs.pointerEvents = 'none';
    document.body.appendChild(_hud);

    _lowBatWarn = document.createElement('div');
    _lowBatWarn.id = 'nvg-lowbat';
    var ws = _lowBatWarn.style;
    ws.position   = 'fixed';
    ws.top        = '30px';
    ws.right      = '16px';
    ws.color      = '#ff2222';
    ws.fontFamily = 'monospace';
    ws.fontSize   = '12px';
    ws.fontWeight = 'bold';
    ws.zIndex     = '1000';
    ws.display    = 'none';
    ws.textShadow = '0 0 6px #ff0000';
    ws.pointerEvents = 'none';
    ws.textContent = 'NVG LOW BATTERY';
    document.body.appendChild(_lowBatWarn);
  }

  function _applyBodyFilter(on) {
    if (on) {
      document.body.style.filter = 'brightness(2.5) saturate(0) hue-rotate(90deg) contrast(1.3)';
      document.body.style.transition = 'filter 0.4s';
    } else {
      document.body.style.filter = '';
      document.body.style.transition = 'filter 0.4s';
    }
  }

  function _showOverlay(visible) {
    if (!_overlay) return;
    var frameContainer = _frameLeft ? _frameLeft._container : null;
    if (visible) {
      _overlay.style.display = 'block';
      if (frameContainer) frameContainer.style.display = 'block';
      // Force reflow then fade in
      void _overlay.offsetWidth;
      _overlay.style.opacity = '1';
      _overlay.style.animation = 'nvgStatic 0.5s steps(1) infinite';
      if (frameContainer) frameContainer.style.opacity = '1';
      _hud.style.display = 'block';
    } else {
      _overlay.style.opacity = '0';
      if (frameContainer) frameContainer.style.opacity = '0';
      _hud.style.display = 'none';
      _lowBatWarn.style.display = 'none';
      // Hide after transition
      setTimeout(function() {
        if (!_active) {
          _overlay.style.display = 'none';
          _overlay.style.animation = '';
          if (frameContainer) frameContainer.style.display = 'none';
        }
      }, 450);
    }
  }

  function _updateHUD() {
    if (!_hud || !_active) return;
    var secs = Math.ceil(_battery * 60);
    _hud.textContent = '🟢 NVG ON  ' + secs + 's';
  }

  function _addEnemyHalo(enemy) {
    if (!enemy || !enemy._nvgHalo) {
      try {
        var light = new THREE.PointLight(0x00FF00, 1, 8);
        light.name = '__nvgHalo';
        if (enemy && enemy.add) {
          enemy.add(light);
          enemy._nvgHalo = light;
        }
      } catch(e) { /* THREE not available */ }
    }
  }

  function _removeEnemyHalo(enemy) {
    if (enemy && enemy._nvgHalo) {
      try {
        enemy.remove(enemy._nvgHalo);
        if (enemy._nvgHalo.dispose) enemy._nvgHalo.dispose();
      } catch(e) {}
      enemy._nvgHalo = null;
    }
  }

  function _applyEnemyHalos(enable) {
    var enemies = null;
    // Try common game global patterns
    if (window.Enemies && window.Enemies.list) enemies = window.Enemies.list;
    else if (window._enemies) enemies = window._enemies;
    else if (window.GameState && window.GameState.enemies) enemies = window.GameState.enemies;
    if (!enemies || !enemies.length) return;
    for (var i = 0; i < enemies.length; i++) {
      if (enable) _addEnemyHalo(enemies[i]);
      else _removeEnemyHalo(enemies[i]);
    }
  }

  function _powerOff() {
    _active = false;
    window._nvgActive = false;
    _powerOffAnim = true;
    _powerOffTimer = 0;
    _transitioning = true;

    // Animate: brief darkness then back to normal
    if (_overlay) {
      _overlay.style.animation = 'nvgPowerOff 0.6s forwards';
    }
    _applyBodyFilter(false);
    _applyEnemyHalos(false);
    if (_lowBatWarn) _lowBatWarn.style.display = 'none';
    if (_hud) _hud.style.display = 'none';
    if (_frameLeft && _frameLeft._container) {
      _frameLeft._container.style.opacity = '0';
      setTimeout(function() {
        if (_frameLeft && _frameLeft._container) _frameLeft._container.style.display = 'none';
      }, 650);
    }

    setTimeout(function() {
      _powerOffAnim = false;
      _transitioning = false;
      if (_overlay) {
        _overlay.style.animation = '';
        _overlay.style.display = 'none';
        _overlay.style.opacity = '0';
      }
    }, 650);
  }

  function _handleKey(e) {
    // Alt+V or N key
    var isAltV = e.altKey && (e.key === 'v' || e.key === 'V');
    var isN    = !e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'n' || e.key === 'N');
    if (isAltV || isN) {
      // Don't steal N from chat/input fields
      var tag = document.activeElement ? document.activeElement.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      toggle();
      e.preventDefault && e.preventDefault();
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init() {
    _createOverlay();
    _createGoggleFrames();
    _createHUD();

    window.addEventListener('keydown', _handleKey);

    // Export globals
    window._nvgActive  = false;
    window._nvgBattery = 1.0;
  }

  function toggle() {
    if (_transitioning) return;

    if (_active) {
      // Turn off
      _active = false;
      window._nvgActive = false;
      _applyBodyFilter(false);
      _showOverlay(false);
      _applyEnemyHalos(false);
    } else {
      // Only turn on if battery > 0
      if (_battery <= 0) return;
      _active = true;
      window._nvgActive = true;
      _applyBodyFilter(true);
      _showOverlay(true);
      _applyEnemyHalos(true);
      _updateHUD();
    }
  }

  function update(deltaTime) {
    if (deltaTime === undefined || deltaTime === null) {
      var now = performance.now();
      if (_lastTime === null) { _lastTime = now; return; }
      deltaTime = (now - _lastTime) / 1000;
      _lastTime = now;
    } else {
      _lastTime = null; // reset if caller provides dt
    }

    // Clamp dt to avoid huge jumps after tab switch
    if (deltaTime > 1.0) deltaTime = 1.0;

    if (_active) {
      // Drain battery
      _battery -= BATTERY_DRAIN_RATE * deltaTime;
      if (_battery < 0) _battery = 0;
      window._nvgBattery = _battery;

      // Battery out → forced power-off
      if (_battery <= 0) {
        _powerOff();
        return;
      }

      // Low battery flicker + warning
      if (_battery < FLICKER_THRESHOLD) {
        if (_lowBatWarn) _lowBatWarn.style.display = 'block';
        _flickerTimer += deltaTime;
        if (_flickerTimer >= FLICKER_INTERVAL) {
          _flickerTimer = 0;
          _flickerState = !_flickerState;
          if (_overlay) _overlay.style.opacity = _flickerState ? '1' : '0';
          if (_frameLeft && _frameLeft._container) {
            _frameLeft._container.style.opacity = _flickerState ? '1' : '0';
          }
        }
      } else {
        if (_lowBatWarn) _lowBatWarn.style.display = 'none';
        _flickerTimer = 0;
      }

      _updateHUD();

    } else {
      // Recharge when off (not transitioning power-off anim)
      if (!_powerOffAnim && _battery < 1.0) {
        _battery += BATTERY_CHARGE_RATE * deltaTime;
        if (_battery > 1.0) _battery = 1.0;
        window._nvgBattery = _battery;
      }
    }

    // Continuously update enemy halos when active (enemies may spawn mid-game)
    if (_active) {
      _applyEnemyHalos(true);
    }
  }

  function reset() {
    if (_active) {
      _active = false;
      window._nvgActive = false;
      _applyBodyFilter(false);
      _showOverlay(false);
      _applyEnemyHalos(false);
    }
    _battery = 1.0;
    window._nvgBattery = 1.0;
    _flickerTimer = 0;
    _flickerState = true;
    _powerOffAnim = false;
    _powerOffTimer = 0;
    _transitioning = false;
    _lastTime = null;
    if (_lowBatWarn) _lowBatWarn.style.display = 'none';
  }

  return { init: init, update: update, toggle: toggle, reset: reset };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail night-vision-goggles.js",_e&&_e.message); }
/* === shield-bubble.js === */
try {
;
window.ShieldBubble = (function () {
  'use strict';

  // ── globals exposed for game integration ──────────────────────────────────
  window._shieldBubbleActive = false;
  window._shieldBubbleHP = 0;

  // ── constants ─────────────────────────────────────────────────────────────
  var SHIELD_RADIUS = 4;
  var SHIELD_MAX_HP = 300;
  var SHIELD_DURATION = 20;       // seconds
  var COOLDOWN_DURATION = 60;     // seconds
  var MAX_CHARGES = 1;

  // ── internal state ────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _playerRef = null;

  var _shieldGroup = null;
  var _sphereMesh = null;
  var _wireframeMesh = null;
  var _pointLight = null;

  var _active = false;
  var _hp = 0;
  var _timeRemaining = 0;
  var _cooldown = 0;
  var _charges = MAX_CHARGES;

  var _breakAnimActive = false;
  var _breakAnimTime = 0;
  var _breakSphere = null;

  // Audio nodes
  var _audioCtx = null;
  var _humOscillator = null;
  var _humGain = null;

  // HUD element
  var _hudEl = null;
  var _hudBar = null;

  // Crackle sparks pool
  var _sparks = [];
  var _sparkMaterial = null;

  // ── helpers ───────────────────────────────────────────────────────────────
  function _getPlayerPosition() {
    if (_playerRef && _playerRef.position) {
      return _playerRef.position;
    }
    if (window.GameManager && window.GameManager.getPlayerPosition) {
      return window.GameManager.getPlayerPosition();
    }
    if (_camera) {
      return _camera.position;
    }
    return new THREE.Vector3(0, 0, 0);
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _hexToR(hex) { return ((hex >> 16) & 0xFF) / 255; }
  function _hexToG(hex) { return ((hex >> 8) & 0xFF) / 255; }
  function _hexToB(hex) { return (hex & 0xFF) / 255; }

  function _colorLerp(hexA, hexB, t) {
    var r = Math.round(_lerp(_hexToR(hexA) * 255, _hexToR(hexB) * 255, t));
    var g = Math.round(_lerp(_hexToG(hexA) * 255, _hexToG(hexB) * 255, t));
    var b = Math.round(_lerp(_hexToB(hexA) * 255, _hexToB(hexB) * 255, t));
    return (r << 16) | (g << 8) | b;
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  function _initAudio() {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
  }

  function _startHum() {
    if (!_audioCtx) { return; }
    try {
      _humOscillator = _audioCtx.createOscillator();
      _humGain = _audioCtx.createGain();
      _humOscillator.type = 'sine';
      _humOscillator.frequency.setValueAtTime(60, _audioCtx.currentTime);
      _humGain.gain.setValueAtTime(0.06, _audioCtx.currentTime);
      _humOscillator.connect(_humGain);
      _humGain.connect(_audioCtx.destination);
      _humOscillator.start();
    } catch (e) {}
  }

  function _stopHum() {
    if (!_humOscillator) { return; }
    try {
      _humGain.gain.setValueAtTime(0.06, _audioCtx.currentTime);
      _humGain.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 0.15);
      _humOscillator.stop(_audioCtx.currentTime + 0.2);
    } catch (e) {}
    _humOscillator = null;
    _humGain = null;
  }

  function _playImpactPing() {
    if (!_audioCtx) { return; }
    try {
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, _audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, _audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, _audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.start();
      osc.stop(_audioCtx.currentTime + 0.25);
    } catch (e) {}
  }

  function _playShatterSound() {
    if (!_audioCtx) { return; }
    try {
      var bufferSize = _audioCtx.sampleRate * 0.4;
      var buffer = _audioCtx.createBuffer(1, bufferSize, _audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.5);
      }
      var source = _audioCtx.createBufferSource();
      source.buffer = buffer;
      var filter = _audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 0.5;
      var gain = _audioCtx.createGain();
      gain.gain.setValueAtTime(0.5, _audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 0.4);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(_audioCtx.destination);
      source.start();
    } catch (e) {}
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'shield-bubble-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:54px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,60,0.75)',
      'border:1px solid #0088FF',
      'border-radius:6px',
      'padding:5px 14px 6px',
      'color:#44AAFF',
      'font-family:monospace',
      'font-size:13px',
      'pointer-events:none',
      'display:none',
      'z-index:9999',
      'min-width:220px',
      'text-align:center'
    ].join(';');

    var label = document.createElement('div');
    label.id = 'shield-bubble-label';
    label.textContent = '⚡ SHIELD 300HP (20s)';
    label.style.marginBottom = '4px';

    var barBg = document.createElement('div');
    barBg.style.cssText = 'background:#002244;border-radius:3px;height:6px;width:100%;overflow:hidden';
    _hudBar = document.createElement('div');
    _hudBar.style.cssText = 'background:#0088FF;height:6px;width:100%;border-radius:3px;transition:width 0.1s,background 0.1s';
    barBg.appendChild(_hudBar);

    _hudEl.appendChild(label);
    _hudEl.appendChild(barBg);
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    var label = document.getElementById('shield-bubble-label');
    if (_active) {
      _hudEl.style.display = 'block';
      var hpRatio = Math.max(0, _hp / SHIELD_MAX_HP);
      var secs = Math.ceil(_timeRemaining);
      if (label) {
        label.textContent = '⚡ SHIELD ' + Math.ceil(_hp) + 'HP (' + secs + 's)';
      }
      var pct = (hpRatio * 100).toFixed(1) + '%';
      if (_hudBar) {
        _hudBar.style.width = pct;
        // Color: blue → red as HP drops
        var barColor = hpRatio > 0.5
          ? '#0088FF'
          : hpRatio > 0.25
            ? '#FF8800'
            : '#FF2200';
        _hudBar.style.background = barColor;
      }
    } else if (_cooldown > 0) {
      _hudEl.style.display = 'block';
      var cdSecs = Math.ceil(_cooldown);
      if (label) {
        label.textContent = '⚡ SHIELD (cooldown ' + cdSecs + 's)';
      }
      if (_hudBar) {
        _hudBar.style.width = ((_cooldown / COOLDOWN_DURATION) * 100).toFixed(1) + '%';
        _hudBar.style.background = '#334466';
      }
    } else {
      _hudEl.style.display = _charges > 0 ? 'block' : 'block';
      if (label) {
        label.textContent = '⚡ SHIELD READY [Ctrl+Shift+S]';
      }
      if (_hudBar) {
        _hudBar.style.width = '100%';
        _hudBar.style.background = '#0088FF';
      }
      // Hide after half a second if idle — keep showing so player knows it's available
    }
  }

  // ── Visual construction ───────────────────────────────────────────────────
  function _buildShieldVisuals() {
    _shieldGroup = new THREE.Group();

    // Sphere shell
    var sphereGeo = new THREE.SphereGeometry(SHIELD_RADIUS, 16, 16);
    var sphereMat = new THREE.MeshBasicMaterial({
      color: 0x0088FF,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    _sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    _shieldGroup.add(_sphereMesh);

    // Wireframe overlay
    var wireGeo = new THREE.WireframeGeometry(sphereGeo);
    var wireMat = new THREE.LineBasicMaterial({
      color: 0x44AAFF,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });
    _wireframeMesh = new THREE.LineSegments(wireGeo, wireMat);
    _shieldGroup.add(_wireframeMesh);

    // Interior point light
    _pointLight = new THREE.PointLight(0x0055FF, 3, 8);
    _shieldGroup.add(_pointLight);

    // Spark material (for crackle)
    _sparkMaterial = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    _scene.add(_shieldGroup);
  }

  function _removeShieldVisuals() {
    if (_shieldGroup && _scene) {
      _scene.remove(_shieldGroup);
    }
    _shieldGroup = null;
    _sphereMesh = null;
    _wireframeMesh = null;
    _pointLight = null;
    _removeSparks();
  }

  // ── Crackle sparks ────────────────────────────────────────────────────────
  function _removeSparks() {
    for (var i = 0; i < _sparks.length; i++) {
      if (_sparks[i].parent) { _sparks[i].parent.remove(_sparks[i]); }
      _sparks[i].geometry.dispose();
    }
    _sparks = [];
  }

  function _updateCrackleSparks() {
    // Remove old sparks
    _removeSparks();

    if (!_shieldGroup || !_active) { return; }

    var NUM_SPARKS = 5;
    for (var i = 0; i < NUM_SPARKS; i++) {
      // Random point on sphere surface
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var r = SHIELD_RADIUS;
      var x0 = r * Math.sin(phi) * Math.cos(theta);
      var y0 = r * Math.sin(phi) * Math.sin(theta);
      var z0 = r * Math.cos(phi);

      // Small random offset for the other end
      var dx = (Math.random() - 0.5) * 1.2;
      var dy = (Math.random() - 0.5) * 1.2;
      var dz = (Math.random() - 0.5) * 1.2;

      var positions = new Float32Array([x0, y0, z0, x0 + dx, y0 + dy, z0 + dz]);
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      var spark = new THREE.LineSegments(geo, _sparkMaterial);
      _shieldGroup.add(spark);
      _sparks.push(spark);
    }
  }

  // ── Break animation ───────────────────────────────────────────────────────
  function _startBreakAnim(pos) {
    var geo = new THREE.SphereGeometry(SHIELD_RADIUS, 16, 16);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
      wireframe: true
    });
    _breakSphere = new THREE.Mesh(geo, mat);
    _breakSphere.position.copy(pos);
    _scene.add(_breakSphere);
    _breakAnimActive = true;
    _breakAnimTime = 0;
  }

  function _updateBreakAnim(dt) {
    if (!_breakAnimActive || !_breakSphere) { return; }
    _breakAnimTime += dt;
    var t = _breakAnimTime / 0.3; // 0.3 second animation
    if (t >= 1) {
      _scene.remove(_breakSphere);
      _breakSphere.geometry.dispose();
      _breakSphere.material.dispose();
      _breakSphere = null;
      _breakAnimActive = false;
      return;
    }
    // Expand from SHIELD_RADIUS to 6, fade out
    var scale = _lerp(1, 6 / SHIELD_RADIUS, t);
    _breakSphere.scale.setScalar(scale);
    _breakSphere.material.opacity = _lerp(0.8, 0, t);
    // Shift color from white toward dim blue
    _breakSphere.material.color.setHex(_colorLerp(0xFFFFFF, 0x002244, t));
  }

  // ── Activation & deactivation ─────────────────────────────────────────────
  function _activateShield() {
    if (_active || _charges < 1 || _cooldown > 0) { return; }

    _active = true;
    _hp = SHIELD_MAX_HP;
    _timeRemaining = SHIELD_DURATION;
    _charges = 0;

    window._shieldBubbleActive = true;
    window._shieldBubbleHP = _hp;

    _buildShieldVisuals();
    _startHum();
    _updateHUD();
  }

  function _deactivateShield(broken) {
    if (!_active) { return; }

    var pos = _getPlayerPosition().clone();

    _active = false;
    window._shieldBubbleActive = false;
    window._shieldBubbleHP = 0;
    _cooldown = COOLDOWN_DURATION;

    _stopHum();

    if (broken) {
      _playShatterSound();
      _startBreakAnim(pos);
    }

    _removeShieldVisuals();
    _updateHUD();
  }

  // ── Damage absorption (called externally) ────────────────────────────────
  function _absorbDamage(amount) {
    if (!_active) { return amount; } // pass through

    _playImpactPing();
    _hp -= amount;
    window._shieldBubbleHP = _hp;

    if (_hp <= 0) {
      _hp = 0;
      window._shieldBubbleHP = 0;
      _deactivateShield(true);
      return 0; // shield absorbed everything
    }

    return 0; // shield absorbed all damage
  }

  // ── Keyboard handler ─────────────────────────────────────────────────────
  function _onKeyDown(e) {
    // Ctrl+Shift+S
    if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's' || e.code === 'KeyS')) {
      e.preventDefault();
      deploy();
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function init(scene, camera, playerRef) {
    _scene = scene;
    _camera = camera;
    _playerRef = playerRef || null;

    _active = false;
    _hp = 0;
    _timeRemaining = 0;
    _cooldown = 0;
    _charges = MAX_CHARGES;
    _breakAnimActive = false;

    window._shieldBubbleActive = false;
    window._shieldBubbleHP = 0;

    _initAudio();
    _createHUD();

    document.addEventListener('keydown', _onKeyDown);

    // Expose damage absorber globally so game can call it
    window._shieldAbsorbDamage = _absorbDamage;
  }

  function deploy() {
    if (_active) { return; }   // already up
    if (_cooldown > 0) { return; } // on cooldown
    if (_charges < 1) { return; }
    _activateShield();
  }

  function update(dt) {
    // Handle break animation regardless of active state
    if (_breakAnimActive) {
      _updateBreakAnim(dt);
    }

    // Cooldown tick
    if (!_active && _cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown <= 0) {
        _cooldown = 0;
        _charges = MAX_CHARGES;
      }
      _updateHUD();
      return;
    }

    if (!_active) {
      _updateHUD();
      return;
    }

    // --- Shield is active ---

    // Follow player
    var pos = _getPlayerPosition();
    if (_shieldGroup) {
      _shieldGroup.position.copy(pos);
    }

    // Tick duration
    _timeRemaining -= dt;
    if (_timeRemaining <= 0 || _hp <= 0) {
      _deactivateShield(_hp <= 0);
      return;
    }

    var hpRatio = Math.max(0, _hp / SHIELD_MAX_HP);
    var timeRatio = Math.max(0, _timeRemaining / SHIELD_DURATION);

    // Update sphere opacity and color
    if (_sphereMesh) {
      var opacity = _lerp(0.5, 0.18, hpRatio); // more opaque when damaged
      _sphereMesh.material.opacity = opacity;
      var col = _colorLerp(0xFF2200, 0x0088FF, hpRatio); // red when low HP
      _sphereMesh.material.color.setHex(col);
    }

    // Rotate wireframe slowly (simulating shimmer/animation)
    if (_wireframeMesh) {
      _wireframeMesh.rotation.y += dt * 0.4;
      _wireframeMesh.rotation.x += dt * 0.15;
    }

    // Pulse point light
    if (_pointLight) {
      var pulse = 2.5 + Math.sin(Date.now() * 0.006) * 0.5;
      _pointLight.intensity = pulse;
      // Light color shifts to red when damaged
      _pointLight.color.setHex(_colorLerp(0xFF2200, 0x0055FF, hpRatio));
    }

    // Crackle sparks when HP < 100
    if (_hp < 100 && _active) {
      _updateCrackleSparks();
    } else {
      _removeSparks();
    }

    window._shieldBubbleHP = _hp;
    _updateHUD();
  }

  function reset() {
    _deactivateShield(false);
    _active = false;
    _hp = 0;
    _timeRemaining = 0;
    _cooldown = 0;
    _charges = MAX_CHARGES;
    window._shieldBubbleActive = false;
    window._shieldBubbleHP = 0;
    _removeShieldVisuals();
    _stopHum();
    if (_hudEl) {
      _hudEl.style.display = 'none';
    }
    _removeSparks();
    if (_breakAnimActive && _breakSphere) {
      if (_scene) { _scene.remove(_breakSphere); }
      _breakSphere.geometry.dispose();
      _breakSphere.material.dispose();
      _breakSphere = null;
      _breakAnimActive = false;
      _breakAnimTime = 0;
    }
  }

  return { init: init, update: update, deploy: deploy, reset: reset };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail shield-bubble.js",_e&&_e.message); }
/* === enemy-juggernaut.js === */
try {
;
/* ════════════════════════════════════════════════════════════════════
 *  ENEMY JUGGERNAUT — super heavy armored soldier
 *  ─────────────────────────────────────────────────────────────────
 *  Wave 12+, one per 6 waves.  600 HP, 50% bullet damage reduction,
 *  immune to knife damage.  Minigun arm, shoulder charge, ground slam.
 *  Rage mode at ≤150 HP (2× speed, 6 s charge cooldown).
 *  Slow collapse death, body stays 4 s as obstacle, 8 debris pieces.
 *
 *  Global:
 *    window._juggernautEnemies = []   (array of live juggernaut objects)
 *
 *  Public API:
 *    EnemyJuggernaut.init(scene, camera)  — call once after scene ready
 *    EnemyJuggernaut.update(delta)        — per-frame (seconds)
 *    EnemyJuggernaut.spawn()              — force-spawn one juggernaut
 *    EnemyJuggernaut.reset()             — clear all juggernauts
 * ═════════════════════════════════════════════════════════════════ */
window.EnemyJuggernaut = (function () {
  'use strict';

  /* ── internal scene refs ─────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── config ──────────────────────────────────────────────────────── */
  var MAX_HP              = 600;
  var RAGE_HP_THRESHOLD   = 150;
  var SMOKE_HP_THRESHOLD  = 300;
  var WALK_SPEED          = 1.5;   /* units / s */
  var RAGE_SPEED          = 3.0;   /* 2× walk */
  var BULLET_DMG_MULT     = 0.5;   /* 50% reduction */
  var SCORE_VALUE         = 1500;
  var SPAWN_MIN_WAVE      = 12;
  var SPAWN_WAVE_INTERVAL = 6;
  var SPAWN_MIN_DIST      = 40;    /* units from player */

  /* minigun */
  var MINIGUN_DAMAGE      = 35;
  var MINIGUN_FIRE_RATE   = 0.08; /* seconds between rounds */
  var MINIGUN_RANGE       = 20;
  var MINIGUN_SPIN_SPEED  = 8;    /* rad/s when firing */

  /* charge */
  var CHARGE_TRIGGER_DIST = 6;
  var CHARGE_COOLDOWN     = 12;   /* seconds */
  var RAGE_CHARGE_COOLDOWN= 6;
  var CHARGE_SPEED        = 8;    /* units/s */
  var CHARGE_DIST         = 3;    /* units travelled */
  var CHARGE_DAMAGE       = 80;

  /* slam */
  var SLAM_TRIGGER_DIST   = 3;
  var SLAM_DAMAGE         = 60;
  var SLAM_COOLDOWN       = 4;

  /* footstep */
  var FOOTSTEP_INTERVAL   = 0.8;

  /* death */
  var COLLAPSE_DURATION   = 1.5;
  var BODY_STAY_DURATION  = 4.0;
  var DEBRIS_COUNT        = 8;

  /* ── live juggernauts ────────────────────────────────────────────── */
  var _juggs = [];
  window._juggernautEnemies = _juggs;

  /* ── smoke particles (shared pool) ──────────────────────────────── */
  var _smokeParticles = [];

  /* ── wave tracking (for auto-spawn) ─────────────────────────────── */
  var _lastSpawnWave = 0;

  /* ════════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene;
    _camera = camera || window._camera;
    _juggs  = [];
    window._juggernautEnemies = _juggs;
    _smokeParticles = [];
    _lastSpawnWave  = 0;
  }

  /* ════════════════════════════════════════════════════════════════
     MESH BUILDER
  ════════════════════════════════════════════════════════════════ */
  function _buildMesh() {
    var group = new THREE.Group();

    /* ── torso (huge, dark gray) ── */
    var torsoGeo = new THREE.BoxGeometry(0.8, 1.0, 0.5);
    var torsoMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
    var torso    = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.5;
    group.add(torso);

    /* ── legs ── */
    var legGeo = new THREE.BoxGeometry(0.3, 0.72, 0.32);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var leftLeg  = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.23, -0.36, 0);
    group.add(leftLeg);
    var rightLeg = new THREE.Mesh(legGeo, legMat.clone());
    rightLeg.position.set(0.23, -0.36, 0);
    group.add(rightLeg);

    /* ── heavy boots ── */
    var bootGeo = new THREE.BoxGeometry(0.32, 0.18, 0.38);
    var bootMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var leftBoot  = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.23, -0.81, 0.03);
    group.add(leftBoot);
    var rightBoot = new THREE.Mesh(bootGeo, bootMat.clone());
    rightBoot.position.set(0.23, -0.81, 0.03);
    group.add(rightBoot);

    /* ── shoulder pads ── */
    var padGeo = new THREE.BoxGeometry(0.35, 0.25, 0.35);
    var padMat = new THREE.MeshLambertMaterial({ color: 0x1E1E1E });
    var leftPad = new THREE.Mesh(padGeo, padMat);
    leftPad.position.set(-0.6, 0.92, 0);
    group.add(leftPad);
    var rightPad = new THREE.Mesh(padGeo, padMat.clone());
    rightPad.position.set(0.6, 0.92, 0);
    group.add(rightPad);

    /* ── left arm (normal, thick) ── */
    var armGeo = new THREE.BoxGeometry(0.32, 0.8, 0.32);
    var armMat = new THREE.MeshLambertMaterial({ color: 0x242424 });
    var leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.63, 0.5, 0);
    group.add(leftArm);

    /* ── right arm — minigun arm ── */
    var rightArmGeo = new THREE.BoxGeometry(0.32, 0.75, 0.32);
    var rightArmMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var rightArm = new THREE.Mesh(rightArmGeo, rightArmMat);
    rightArm.position.set(0.63, 0.5, 0);
    group.add(rightArm);

    /* ── minigun — main barrel housing ── */
    var minigunGroup = new THREE.Group();
    minigunGroup.position.set(0.63, 0.12, 0.0);

    var barrelHousingGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
    var barrelHousingMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
    var barrelHousing = new THREE.Mesh(barrelHousingGeo, barrelHousingMat);
    barrelHousing.rotation.x = Math.PI / 2;
    minigunGroup.add(barrelHousing);

    /* barrel cluster — 6 thin cylinders around the main barrel */
    var barrelCluster = new THREE.Group();
    for (var bi = 0; bi < 6; bi++) {
      var ba = (bi / 6) * Math.PI * 2;
      var bGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.92, 6);
      var bMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.rotation.x = Math.PI / 2;
      bMesh.position.set(Math.cos(ba) * 0.05, Math.sin(ba) * 0.05, 0);
      barrelCluster.add(bMesh);
    }
    minigunGroup.add(barrelCluster);

    /* muzzle flash point light — starts off */
    var muzzleLight = new THREE.PointLight(0xFF8800, 0, 4);
    muzzleLight.position.set(0, 0, 0.5);
    minigunGroup.add(muzzleLight);

    group.add(minigunGroup);

    /* ── black helmet with visor ── */
    var helmGeo = new THREE.BoxGeometry(0.55, 0.52, 0.52);
    var helmMat = new THREE.MeshLambertMaterial({ color: 0x0A0A0A });
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 1.32;
    group.add(helm);

    /* visor — dark amber strip */
    var visorGeo = new THREE.BoxGeometry(0.42, 0.1, 0.03);
    var visorMat = new THREE.MeshBasicMaterial({ color: 0x884400 });
    var visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.31, 0.27);
    group.add(visor);

    /* store refs for animation */
    group.userData.leftLeg      = leftLeg;
    group.userData.rightLeg     = rightLeg;
    group.userData.leftArm      = leftArm;
    group.userData.rightArm     = rightArm;
    group.userData.leftPad      = leftPad;
    group.userData.rightPad     = rightPad;
    group.userData.minigunGroup = minigunGroup;
    group.userData.barrelCluster= barrelCluster;
    group.userData.muzzleLight  = muzzleLight;
    group.userData.helm         = helm;

    return group;
  }

  /* ════════════════════════════════════════════════════════════════
     SPAWN
  ════════════════════════════════════════════════════════════════ */
  function spawn() {
    if (!_scene) {
      _scene  = window._gameScene;
      _camera = window._camera;
    }
    if (!_scene) return;

    var playerPos = _getPlayerPos();
    var px, pz;
    if (playerPos) {
      var angle = Math.random() * Math.PI * 2;
      var dist  = SPAWN_MIN_DIST + Math.random() * 10;
      px = playerPos.x + Math.cos(angle) * dist;
      pz = playerPos.z + Math.sin(angle) * dist;
    } else {
      px = (Math.random() - 0.5) * 80;
      pz = (Math.random() - 0.5) * 80;
    }

    var mesh = _buildMesh();
    mesh.position.set(px, 0, pz);
    _scene.add(mesh);

    var j = {
      mesh:           mesh,
      hp:             MAX_HP,
      alive:          true,
      dying:          false,
      collapseTimer:  0,
      bodyTimer:      0,
      rageMode:       false,
      /* minigun */
      minigunTimer:   0,
      barrelAngle:    0,
      /* charge */
      chargeCooldown: 0,
      charging:       false,
      chargeDir:      new THREE.Vector3(),
      chargeLeft:     0,
      chargeTargetDist: 0,
      chargeStartPos: new THREE.Vector3(),
      /* slam */
      slamCooldown:   0,
      /* footstep */
      footstepTimer:  0,
      /* walk animation */
      walkCycle:      0,
      /* smoke (tracked per-jugg) */
      smokeTimer:     0,
      /* debris (post-death) */
      debrisList:     [],
    };

    _juggs.push(j);
    window._juggernautEnemies = _juggs;

    /* HUD toast */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('JUGGERNAUT INBOUND', 3000, '#FF4400');
    }

    _playFootstepThump(true); /* announce with heavy thump */

    return j;
  }

  /* ════════════════════════════════════════════════════════════════
     UPDATE — called every frame
  ════════════════════════════════════════════════════════════════ */
  function update(delta) {
    if (!_scene) return;
    if (!_camera) _camera = window._camera;

    /* auto-spawn wave check */
    _checkWaveSpawn();

    /* update smoke particles */
    _updateSmoke(delta);

    for (var i = _juggs.length - 1; i >= 0; i--) {
      var j = _juggs[i];
      if (!j.alive && !j.dying) {
        /* fully dead, remove from list */
        _juggs.splice(i, 1);
        continue;
      }
      if (j.dying) {
        _updateDying(j, delta);
      } else {
        _updateJugg(j, delta);
      }
    }
    window._juggernautEnemies = _juggs;
  }

  /* ── per-juggernaut live update ── */
  function _updateJugg(j, delta) {
    var playerPos = _getPlayerPos();
    if (!playerPos) return;

    var pos = j.mesh.position;
    var dx  = playerPos.x - pos.x;
    var dz  = playerPos.z - pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    /* ── rage threshold check ── */
    if (!j.rageMode && j.hp <= RAGE_HP_THRESHOLD) {
      j.rageMode = true;
      _enterRage(j);
    }

    /* ── timers ── */
    if (j.chargeCooldown > 0) j.chargeCooldown -= delta;
    if (j.slamCooldown   > 0) j.slamCooldown   -= delta;
    j.footstepTimer -= delta;
    j.smokeTimer    -= delta;

    /* ── footstep thumps ── */
    if (j.footstepTimer <= 0) {
      j.footstepTimer = FOOTSTEP_INTERVAL;
      if (dist < 60) {
        _playFootstepThump(false);
        /* camera shake scales with proximity */
        var shakeAmt = Math.max(0, (1 - dist / 30)) * 0.12;
        if (shakeAmt > 0) _cameraShake(shakeAmt);
      }
    }

    /* ── smoke at ≤300 HP from helmet ── */
    if (j.hp <= SMOKE_HP_THRESHOLD && j.smokeTimer <= 0) {
      j.smokeTimer = 0.15;
      _emitSmoke(j);
    }

    /* ── CHARGING ── */
    if (j.charging) {
      j.chargeLeft -= delta;
      /* advance along charge dir */
      pos.x += j.chargeDir.x * CHARGE_SPEED * delta;
      pos.z += j.chargeDir.z * CHARGE_SPEED * delta;

      /* check contact or distance limit */
      var cdx = playerPos.x - pos.x;
      var cdz = playerPos.z - pos.z;
      var cdist = Math.sqrt(cdx * cdx + cdz * cdz);
      var travelDist = pos.distanceTo(j.chargeStartPos);

      if (cdist < 1.2 || travelDist >= CHARGE_DIST || j.chargeLeft <= 0) {
        j.charging = false;
        var cooldown = j.rageMode ? RAGE_CHARGE_COOLDOWN : CHARGE_COOLDOWN;
        j.chargeCooldown = cooldown;
        if (cdist < 1.5) {
          _damagePlayer(CHARGE_DAMAGE);
          _cameraShake(0.4);
          _playImpact();
        }
      }
    } else {
      /* ── SLAM at close range ── */
      if (dist <= SLAM_TRIGGER_DIST && j.slamCooldown <= 0) {
        j.slamCooldown = SLAM_COOLDOWN;
        _doSlam(j);
      }

      /* ── SHOULDER CHARGE ── */
      if (dist <= CHARGE_TRIGGER_DIST && j.chargeCooldown <= 0) {
        /* lower head (tilt mesh) and charge */
        j.mesh.rotation.z = 0.15; /* slight forward lean */
        j.charging  = true;
        j.chargeLeft = CHARGE_DIST / CHARGE_SPEED + 0.2;
        j.chargeStartPos.copy(pos);
        var len = Math.max(0.001, dist);
        j.chargeDir.set(dx / len, 0, dz / len);
        _playImpact();
      } else {
        /* ── normal movement ── */
        j.mesh.rotation.z = 0; /* restore */
        if (dist > 1.2) {
          var spd = j.rageMode ? RAGE_SPEED : WALK_SPEED;
          var len2 = Math.max(0.001, dist);
          pos.x += (dx / len2) * spd * delta;
          pos.z += (dz / len2) * spd * delta;
        }
      }

      /* ── MINIGUN fire ── */
      if (dist <= MINIGUN_RANGE) {
        j.minigunTimer -= delta;
        /* spin barrel */
        j.barrelAngle += MINIGUN_SPIN_SPEED * delta;
        if (j.mesh.userData.barrelCluster) {
          j.mesh.userData.barrelCluster.rotation.z = j.barrelAngle;
        }

        if (j.minigunTimer <= 0) {
          j.minigunTimer = MINIGUN_FIRE_RATE;
          _fireMinnigun(j, dist);
        }
      } else {
        /* slow barrel to stop when out of range */
        if (j.barrelAngle !== 0) {
          j.barrelAngle += MINIGUN_SPIN_SPEED * 0.2 * delta;
          if (j.mesh.userData.barrelCluster) {
            j.mesh.userData.barrelCluster.rotation.z = j.barrelAngle;
          }
        }
      }
    }

    /* ── face player ── */
    j.mesh.rotation.y = Math.atan2(dx, dz);

    /* ── walk animation ── */
    j.walkCycle += delta * (j.charging ? 6 : (j.rageMode ? 4 : 2));
    var legSwing = Math.sin(j.walkCycle) * 0.35;
    if (j.mesh.userData.leftLeg)  j.mesh.userData.leftLeg.rotation.x  =  legSwing;
    if (j.mesh.userData.rightLeg) j.mesh.userData.rightLeg.rotation.x = -legSwing;
    if (j.mesh.userData.leftArm)  j.mesh.userData.leftArm.rotation.x  = -legSwing * 0.6;
    if (j.mesh.userData.rightArm) j.mesh.userData.rightArm.rotation.x =  legSwing * 0.6;
  }

  /* ════════════════════════════════════════════════════════════════
     MINIGUN FIRE
  ════════════════════════════════════════════════════════════════ */
  function _fireMinnigun(j, distToPlayer) {
    /* muzzle flash */
    var ml = j.mesh.userData.muzzleLight;
    if (ml) {
      ml.intensity = 6;
      setTimeout(function () { if (ml) ml.intensity = 0; }, 60);
    }

    /* damage — spread (not every shot hits) */
    var hitChance = Math.max(0.3, 1 - distToPlayer / (MINIGUN_RANGE * 1.5));
    if (Math.random() < hitChance) {
      _damagePlayer(MINIGUN_DAMAGE);
    }

    /* minigun whine sound */
    _playMinigunWhine();
  }

  /* ════════════════════════════════════════════════════════════════
     GROUND SLAM
  ════════════════════════════════════════════════════════════════ */
  function _doSlam(j) {
    _damagePlayer(SLAM_DAMAGE);
    _cameraShake(0.5);
    _playImpact();

    /* shockwave ring */
    if (!_scene) return;
    var ringGeo = new THREE.RingGeometry(0.2, 0.5, 24);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xFF6600, transparent: true, opacity: 0.8,
      side: THREE.DoubleSide, depthWrite: false
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(j.mesh.position.x, 0.1, j.mesh.position.z);
    _scene.add(ring);

    /* animate ring outward then remove */
    var slamLife = 0;
    var slamMax  = 0.6;
    function _animRing() {
      slamLife += 0.016;
      var k = slamLife / slamMax;
      ring.scale.setScalar(1 + k * 8);
      ringMat.opacity = Math.max(0, 0.8 * (1 - k));
      if (slamLife < slamMax) {
        requestAnimationFrame(_animRing);
      } else {
        if (_scene) _scene.remove(ring);
        ringGeo.dispose();
        ringMat.dispose();
      }
    }
    requestAnimationFrame(_animRing);
  }

  /* ════════════════════════════════════════════════════════════════
     TAKE DAMAGE — public
  ════════════════════════════════════════════════════════════════ */
  function takeDamage(j, dmg, type) {
    if (!j || !j.alive) return;

    /* immune to knife */
    if (type === 'knife' || type === 'melee') return;

    /* 50% bullet damage reduction */
    var reducedDmg = dmg * BULLET_DMG_MULT;
    j.hp -= reducedDmg;

    if (j.hp <= 0) {
      j.hp = 0;
      _startDying(j);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     RAGE MODE
  ════════════════════════════════════════════════════════════════ */
  function _enterRage(j) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('JUGGERNAUT ENRAGED!', 2500, '#FF0000');
    }
    /* red tint visor */
    j.mesh.traverse(function (obj) {
      if (obj.isMesh && obj.material && obj.material.color) {
        /* tint torso slightly red */
        if (obj.material.color.getHex() === 0x2A2A2A) {
          obj.material.color.setHex(0x4A1A1A);
        }
      }
    });
    _playRoar();
  }

  /* ════════════════════════════════════════════════════════════════
     DEATH — slow collapse over 1.5 s, body stays 4 s
  ════════════════════════════════════════════════════════════════ */
  function _startDying(j) {
    j.alive  = false;
    j.dying  = true;
    j.collapseTimer = 0;
    j.bodyTimer     = 0;

    /* score */
    if (window.player && window.player.score !== undefined) {
      window.player.score += SCORE_VALUE;
    }

    /* toast */
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('JUGGERNAUT DOWN', 3000, '#00FF44');
    }

    /* spawn armor fragments */
    _spawnDebris(j);

    /* turn off minigun light */
    if (j.mesh.userData.muzzleLight) {
      j.mesh.userData.muzzleLight.intensity = 0;
    }

    _playImpact();
  }

  function _updateDying(j, delta) {
    j.collapseTimer += delta;
    var k = Math.min(1, j.collapseTimer / COLLAPSE_DURATION);

    /* tilt forward and sink into ground */
    j.mesh.rotation.x = k * (Math.PI / 2);
    j.mesh.position.y = -k * 0.5;

    if (j.collapseTimer >= COLLAPSE_DURATION) {
      /* fully collapsed — start body timer */
      j.bodyTimer += delta;
      if (j.bodyTimer >= BODY_STAY_DURATION) {
        /* remove body and debris */
        _removeJugg(j);
        j.dying = false;
        j.alive = false;
      }
    }

    /* update debris */
    for (var di = j.debrisList.length - 1; di >= 0; di--) {
      var d = j.debrisList[di];
      d.life += delta;
      d.mesh.position.x += d.vx * delta;
      d.mesh.position.y += d.vy * delta;
      d.mesh.position.z += d.vz * delta;
      d.vy -= 9.8 * delta; /* gravity */
      d.mesh.rotation.x  += d.rx * delta;
      d.mesh.rotation.z  += d.rz * delta;
      d.mat.opacity = Math.max(0, 1 - d.life / 3.0);
      if (d.life >= 3.0 && _scene) {
        _scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mat.dispose();
        j.debrisList.splice(di, 1);
      }
    }
  }

  function _spawnDebris(j) {
    if (!_scene) return;
    for (var i = 0; i < DEBRIS_COUNT; i++) {
      var geo = new THREE.BoxGeometry(
        0.08 + Math.random() * 0.14,
        0.06 + Math.random() * 0.1,
        0.06 + Math.random() * 0.1
      );
      var mat = new THREE.MeshLambertMaterial({
        color: (Math.random() > 0.5) ? 0x2A2A2A : 0x1A1A1A,
        transparent: true, opacity: 1.0
      });
      var dMesh = new THREE.Mesh(geo, mat);
      dMesh.position.copy(j.mesh.position);
      dMesh.position.y += 0.8 + Math.random() * 0.6;
      _scene.add(dMesh);

      j.debrisList.push({
        mesh: dMesh,
        mat:  mat,
        vx:   (Math.random() - 0.5) * 4,
        vy:   2 + Math.random() * 3,
        vz:   (Math.random() - 0.5) * 4,
        rx:   (Math.random() - 0.5) * 6,
        rz:   (Math.random() - 0.5) * 6,
        life: 0,
      });
    }
  }

  function _removeJugg(j) {
    if (_scene && j.mesh) {
      _scene.remove(j.mesh);
      j.mesh.traverse(function (obj) {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        }
      });
    }
    /* remove any remaining debris */
    for (var di = 0; di < j.debrisList.length; di++) {
      var d = j.debrisList[di];
      if (_scene && d.mesh) _scene.remove(d.mesh);
      if (d.mesh && d.mesh.geometry) d.mesh.geometry.dispose();
      if (d.mat) d.mat.dispose();
    }
    j.debrisList = [];
  }

  /* ════════════════════════════════════════════════════════════════
     SMOKE PARTICLES (from helmet at ≤300 HP)
  ════════════════════════════════════════════════════════════════ */
  function _emitSmoke(j) {
    if (!_scene) return;
    var helmPos = j.mesh.position.clone();
    helmPos.y += 1.35;

    var geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x777777, transparent: true, opacity: 0.5, depthWrite: false
    });
    var pMesh = new THREE.Mesh(geo, mat);
    pMesh.position.copy(helmPos);
    _scene.add(pMesh);

    _smokeParticles.push({
      mesh:    pMesh,
      mat:     mat,
      vx:      (Math.random() - 0.5) * 0.5,
      vy:      0.6 + Math.random() * 0.4,
      vz:      (Math.random() - 0.5) * 0.5,
      life:    0,
      maxLife: 0.8 + Math.random() * 0.5,
    });
  }

  function _updateSmoke(delta) {
    if (!_scene) return;
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var p = _smokeParticles[i];
      p.life += delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.mat.opacity = Math.max(0, 0.5 * (1 - p.life / p.maxLife));
      p.mesh.scale.setScalar(1 + p.life * 2);
      if (p.life >= p.maxLife) {
        _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mat.dispose();
        _smokeParticles.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     WAVE AUTO-SPAWN
  ════════════════════════════════════════════════════════════════ */
  function _checkWaveSpawn() {
    var gm   = window.GameManager;
    var wave = 0;
    if (gm) {
      wave = (gm.getWave && gm.getWave()) || gm.wave || 0;
    } else if (window.currentWave !== undefined) {
      wave = window.currentWave;
    }
    if (wave < SPAWN_MIN_WAVE) return;
    if (wave === _lastSpawnWave) return;
    if ((wave - SPAWN_MIN_WAVE) % SPAWN_WAVE_INTERVAL !== 0) return;

    _lastSpawnWave = wave;
    setTimeout(function () {
      spawn();
    }, 1500);
  }

  /* ════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════ */
  function _getPlayerPos() {
    if (window.player && window.player.position) return window.player.position;
    if (_camera) return _camera.position;
    return null;
  }

  function _damagePlayer(dmg) {
    if (window.player && window.player.health !== undefined) {
      window.player.health -= dmg;
    }
    if (window.HUD && window.HUD.showDamageFlash) {
      window.HUD.showDamageFlash(0xff0000, 0.4);
    }
  }

  function _cameraShake(amount) {
    var cam = _camera || window._camera;
    if (!cam) return;
    cam.position.x += (Math.random() - 0.5) * amount * 0.5;
    cam.position.y += (Math.random() - 0.5) * amount * 0.25;
  }

  /* ════════════════════════════════════════════════════════════════
     AUDIO
  ════════════════════════════════════════════════════════════════ */
  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      var ctx = new Ctx();
      window._audioCtx = ctx;
      return ctx;
    } catch (e) { return null; }
  }

  /* heavy low-frequency footstep thump */
  function _playFootstepThump(loud) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;

      /* sub-bass thud */
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(loud ? 55 : 45, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.25);
      gain.gain.setValueAtTime(loud ? 0.7 : 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);

      /* noise crunch */
      var bufLen = Math.floor(ctx.sampleRate * 0.08);
      var buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
      }
      var nSrc  = ctx.createBufferSource();
      var nGain = ctx.createGain();
      var filt  = ctx.createBiquadFilter();
      nSrc.buffer = buf;
      filt.type = 'lowpass';
      filt.frequency.value = 180;
      nGain.gain.value = loud ? 0.5 : 0.3;
      nSrc.connect(filt);
      filt.connect(nGain);
      nGain.connect(ctx.destination);
      nSrc.start(now);
    } catch (e) {}
  }

  /* minigun spin-up whine */
  function _playMinigunWhine() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);

      /* short noise tick */
      var bLen = Math.floor(ctx.sampleRate * 0.03);
      var bbuf = ctx.createBuffer(1, bLen, ctx.sampleRate);
      var bd   = bbuf.getChannelData(0);
      for (var i = 0; i < bLen; i++) {
        bd[i] = (Math.random() * 2 - 1) * (1 - i / bLen);
      }
      var bSrc  = ctx.createBufferSource();
      var bGain = ctx.createGain();
      bSrc.buffer  = bbuf;
      bGain.gain.value = 0.12;
      bSrc.connect(bGain);
      bGain.connect(ctx.destination);
      bSrc.start(now);
    } catch (e) {}
  }

  /* impact thud for slam/charge */
  function _playImpact() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;
      var bufLen = Math.floor(ctx.sampleRate * 0.25);
      var buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data   = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
      }
      var src   = ctx.createBufferSource();
      var gain  = ctx.createGain();
      var filt  = ctx.createBiquadFilter();
      src.buffer = buf;
      filt.type  = 'lowpass';
      filt.frequency.value = 120;
      gain.gain.value = 0.6;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
    } catch (e) {}
  }

  /* low roar for rage mode activation */
  function _playRoar() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var now = ctx.currentTime;
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(70, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 1.0);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.15);
    } catch (e) {}
  }

  /* ════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════ */
  function reset() {
    for (var i = 0; i < _juggs.length; i++) {
      _removeJugg(_juggs[i]);
    }
    _juggs.length = 0;
    window._juggernautEnemies = _juggs;

    for (var si = 0; si < _smokeParticles.length; si++) {
      var p = _smokeParticles[si];
      if (_scene && p.mesh) _scene.remove(p.mesh);
      if (p.mesh && p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mat) p.mat.dispose();
    }
    _smokeParticles.length = 0;

    _lastSpawnWave = 0;
  }

  /* ── public API ── */
  return {
    init:       init,
    update:     update,
    spawn:      spawn,
    reset:      reset,
    takeDamage: takeDamage
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail enemy-juggernaut.js",_e&&_e.message); }
/* === tripwire-trap.js === */
try {
;
/* ───────────────────────────────────────────────────────────────────────
   TRIPWIRE TRAP — deployable wire that triggers an explosion on enemy crossing
   Alt+W to plant (max 3). Wire arms after 1.5s, triggers on enemy crossing.
   Refills from supply caches. +300 score for enemy killed by tripwire.
   ─────────────────────────────────────────────────────────────────────── */
window.TripwireTrap = (function () {
  'use strict';

  var _scene   = null;
  var _camera  = null;
  var _traps   = [];          // active tripwire objects
  var _MAX_TRAPS = 3;

  window._activeTripwires = [];
  window._tripwireCount   = _MAX_TRAPS;

  // ── HUD element ──────────────────────────────────────────────────────
  var _hudEl = null;

  function _ensureHUD() {
    if (_hudEl && document.body.contains(_hudEl)) return;
    _hudEl = document.getElementById('tripwire-hud-badge');
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'tripwire-hud-badge';
      _hudEl.style.cssText = [
        'position:fixed',
        'top:14px',
        'left:14px',
        'background:rgba(30,10,10,0.82)',
        'color:#c06060',
        'font-family:monospace',
        'font-size:14px',
        'font-weight:bold',
        'padding:5px 12px',
        'border-radius:5px',
        'border:1px solid #702020',
        'pointer-events:none',
        'z-index:9010',
        'user-select:none',
        'letter-spacing:1px'
      ].join(';');
      if (document.body) document.body.appendChild(_hudEl);
    }
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    _hudEl.textContent = 'TRIPWIRE x' + window._tripwireCount;
    // Turns red when any wire is armed
    var hasArmed = false;
    for (var i = 0; i < _traps.length; i++) {
      if (_traps[i].armed) { hasArmed = true; break; }
    }
    _hudEl.style.color = hasArmed ? '#ff2222' : '#c06060';
    _hudEl.style.borderColor = hasArmed ? '#ff2222' : '#702020';
  }

  // ── Geometry helpers ─────────────────────────────────────────────────
  function _makePost(color) {
    var geo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function _makeWireLine(a, b) {
    var positions = new Float32Array([a.x, a.y + 0.15, a.z, b.x, b.y + 0.15, b.z]);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({
      color: 0xff2222,
      transparent: true,
      opacity: 0.22
    });
    return new THREE.Line(geo, mat);
  }

  function _updateWireLine(trap) {
    var a = trap.anchorA;
    var b = trap.anchorB;
    var positions = trap.wireLine.geometry.attributes.position.array;
    positions[0] = a.x; positions[1] = a.y + 0.15; positions[2] = a.z;
    positions[3] = b.x; positions[4] = b.y + 0.15; positions[5] = b.z;
    trap.wireLine.geometry.attributes.position.needsUpdate = true;
  }

  // ── Planting ─────────────────────────────────────────────────────────
  function plant(playerPos, playerDir) {
    if (window._tripwireCount <= 0) return;

    var anchorA = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
    // Second anchor 6 units in the direction the player faces (horizontal only)
    var fwd = new THREE.Vector3(playerDir.x, 0, playerDir.z).normalize();
    var anchorB = anchorA.clone().addScaledVector(fwd, 6);

    var group = new THREE.Group();
    _scene.add(group);

    // Posts
    var postA = _makePost(0x6b3a1f);
    postA.position.copy(anchorA);
    postA.position.y += 0.15;
    group.add(postA);

    var postB = _makePost(0x6b3a1f);
    postB.position.copy(anchorB);
    postB.position.y += 0.15;
    group.add(postB);

    // Wire line
    var wireLine = _makeWireLine(anchorA, anchorB);
    group.add(wireLine);

    // Midpoint glow light
    var mid = anchorA.clone().add(anchorB).multiplyScalar(0.5);
    mid.y += 0.15;
    var glow = new THREE.PointLight(0xff0000, 0.5, 4);
    glow.position.copy(mid);
    group.add(glow);

    var trap = {
      group:    group,
      postA:    postA,
      postB:    postB,
      wireLine: wireLine,
      glow:     glow,
      anchorA:  anchorA,
      anchorB:  anchorB,
      armed:    false,
      armTimer: 0,
      triggered: false,
      blastTimer: 0
    };

    _traps.push(trap);
    window._activeTripwires.push(trap);
    window._tripwireCount--;
    _updateHUD();

    // Beep during arming
    _playBeep();

    return trap;
  }

  // ── Closest-point distance from point P to segment AB (2D XZ) ────────
  function _distPointToSegment(px, pz, ax, az, bx, bz) {
    var abx = bx - ax, abz = bz - az;
    var apx = px - ax, apz = pz - az;
    var len2 = abx * abx + abz * abz;
    if (len2 < 0.0001) return Math.sqrt(apx * apx + apz * apz);
    var t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / len2));
    var cx = ax + t * abx, cz = az + t * abz;
    var dx = px - cx, dz = pz - cz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ── Blast ─────────────────────────────────────────────────────────────
  function _triggerBlast(trap) {
    if (trap.triggered) return;
    trap.triggered = true;
    trap.armed     = false;

    var mid = trap.anchorA.clone().add(trap.anchorB).multiplyScalar(0.5);
    mid.y += 0.3;

    // Fireball light
    var fireLight = new THREE.PointLight(0xff8800, 6, 10);
    fireLight.position.copy(mid);
    _scene.add(fireLight);

    // 8 debris particles (simple sphere meshes)
    var debrisMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    var debrisGeo = new THREE.SphereGeometry(0.07, 4, 4);
    var debris = [];
    for (var d = 0; d < 8; d++) {
      var m = new THREE.Mesh(debrisGeo, debrisMat);
      m.position.copy(mid);
      var vx = (Math.random() - 0.5) * 8;
      var vy = Math.random() * 6 + 2;
      var vz = (Math.random() - 0.5) * 8;
      debris.push({ mesh: m, vx: vx, vy: vy, vz: vz, life: 1.2 });
      _scene.add(m);
    }

    // Remove wire group immediately
    _scene.remove(trap.group);

    // Damage enemies
    _damageEnemiesInBlast(mid);

    // Whip / explosion sound
    _playWhip();

    // Animate fireball then clean up
    trap.blastTimer   = 0;
    trap.fireLight    = fireLight;
    trap.debris       = debris;
    trap.blastActive  = true;

    _updateHUD();
  }

  function _damageEnemiesInBlast(mid) {
    try {
      var enemies = window.Enemies ? window.Enemies.getAll() : [];
      if (!enemies) return;
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || e.dead) continue;
        var ep = e.position || (e.mesh && e.mesh.position);
        if (!ep) continue;
        var dx = ep.x - mid.x;
        var dy = ep.y - mid.y;
        var dz = ep.z - mid.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        var dmg = 0;
        if (dist <= 3) dmg = 120;
        else if (dist <= 6) dmg = 60;
        if (dmg > 0) {
          var killed = false;
          if (typeof e.takeDamage === 'function') {
            killed = e.takeDamage(dmg, 'tripwire');
          } else if (typeof window.Enemies.damage === 'function') {
            killed = window.Enemies.damage(e, dmg);
          }
          if (killed) {
            try {
              if (window.GameManager && typeof window.GameManager.addScore === 'function') {
                window.GameManager.addScore(300);
              }
            } catch (ex2) {}
          }
        }
      }
    } catch (ex) {}
  }

  // ── Audio stubs ───────────────────────────────────────────────────────
  function _playBeep() {
    try {
      if (window.AudioSystem && typeof window.AudioSystem.playTone === 'function') {
        window.AudioSystem.playTone(880, 0.1, 0.08);
        setTimeout(function () {
          try { window.AudioSystem.playTone(880, 0.1, 0.08); } catch (e2) {}
        }, 300);
      }
    } catch (ex) {}
  }

  function _playWhip() {
    try {
      if (window.AudioSystem) {
        if (typeof window.AudioSystem.playExplosion === 'function') {
          window.AudioSystem.playExplosion(1.0);
        } else if (typeof window.AudioSystem.play === 'function') {
          window.AudioSystem.play('explosion');
        }
      }
    } catch (ex) {}
  }

  // ── Key handling ──────────────────────────────────────────────────────
  var _altHeld = false;

  function _onKeyDown(e) {
    if (e.key === 'Alt') _altHeld = true;
    if ((e.key === 'w' || e.key === 'W') && _altHeld) {
      e.preventDefault();
      _tryPlant();
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'Alt') _altHeld = false;
  }

  function _tryPlant() {
    if (window._tripwireCount <= 0) return;
    try {
      var playerPos = null;
      var playerDir = null;
      if (window.GameManager && window.GameManager.getPlayerPosition) {
        playerPos = window.GameManager.getPlayerPosition();
      } else if (window.CameraSystem && window.CameraSystem.getPosition) {
        playerPos = window.CameraSystem.getPosition();
      }
      if (!playerPos) return;

      if (window.GameManager && window.GameManager.getPlayerDirection) {
        playerDir = window.GameManager.getPlayerDirection();
      } else if (window.CameraSystem && window.CameraSystem.getDirection) {
        playerDir = window.CameraSystem.getDirection();
      }
      if (!playerDir) {
        if (_camera) {
          var v = new THREE.Vector3();
          _camera.getWorldDirection(v);
          playerDir = v;
        } else {
          playerDir = new THREE.Vector3(0, 0, -1);
        }
      }
      plant(playerPos, playerDir);
    } catch (ex) {}
  }

  // ── Public init ───────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene   = scene;
    _camera  = camera || null;
    window._activeTripwires = [];
    window._tripwireCount   = _MAX_TRAPS;
    _traps   = [];
    _altHeld = false;
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    _ensureHUD();
  }

  // ── Update loop ───────────────────────────────────────────────────────
  function update(dt) {
    if (!_scene) return;
    _ensureHUD();

    for (var i = _traps.length - 1; i >= 0; i--) {
      var trap = _traps[i];

      if (trap.blastActive) {
        // Animate blast
        trap.blastTimer += dt;
        var fadeRatio = Math.max(0, 1 - trap.blastTimer / 0.6);
        if (trap.fireLight) trap.fireLight.intensity = 6 * fadeRatio;

        if (trap.debris) {
          for (var d = 0; d < trap.debris.length; d++) {
            var p = trap.debris[d];
            p.life -= dt;
            if (p.life > 0) {
              p.mesh.position.x += p.vx * dt;
              p.mesh.position.y += p.vy * dt;
              p.mesh.position.z += p.vz * dt;
              p.vy -= 9.8 * dt;
            } else {
              _scene.remove(p.mesh);
            }
          }
        }

        if (trap.blastTimer > 0.7) {
          if (trap.fireLight) _scene.remove(trap.fireLight);
          if (trap.debris) {
            for (var d2 = 0; d2 < trap.debris.length; d2++) {
              _scene.remove(trap.debris[d2].mesh);
            }
          }
          _traps.splice(i, 1);
          var wIdx = window._activeTripwires.indexOf(trap);
          if (wIdx !== -1) window._activeTripwires.splice(wIdx, 1);
        }
        continue;
      }

      if (trap.triggered) continue;

      if (!trap.armed) {
        trap.armTimer += dt;
        // Blink glow during arming
        if (trap.glow) {
          trap.glow.intensity = (Math.floor(trap.armTimer * 8) % 2 === 0) ? 0.8 : 0;
        }
        if (trap.armTimer >= 1.5) {
          trap.armed = true;
          if (trap.glow) trap.glow.intensity = 0.5;
          _updateHUD();
        }
        continue;
      }

      // Armed — check enemies
      try {
        var enemies = window.Enemies ? window.Enemies.getAll() : [];
        if (!enemies) continue;
        for (var j = 0; j < enemies.length; j++) {
          var en = enemies[j];
          if (!en || en.dead) continue;
          var ep = en.position || (en.mesh && en.mesh.position);
          if (!ep) continue;
          var dist2d = _distPointToSegment(
            ep.x, ep.z,
            trap.anchorA.x, trap.anchorA.z,
            trap.anchorB.x, trap.anchorB.z
          );
          if (dist2d < 0.3) {
            _triggerBlast(trap);
            break;
          }
        }
      } catch (ex) {}
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  function reset() {
    for (var i = 0; i < _traps.length; i++) {
      var trap = _traps[i];
      if (trap.group && _scene) _scene.remove(trap.group);
      if (trap.fireLight && _scene) _scene.remove(trap.fireLight);
      if (trap.debris && _scene) {
        for (var d = 0; d < trap.debris.length; d++) {
          _scene.remove(trap.debris[d].mesh);
        }
      }
    }
    _traps = [];
    window._activeTripwires = [];
    window._tripwireCount   = _MAX_TRAPS;
    _altHeld = false;
    _updateHUD();
  }

  // ── Supply cache refill (called externally) ───────────────────────────
  function refill(amount) {
    window._tripwireCount = Math.min(_MAX_TRAPS, window._tripwireCount + (amount || 1));
    _updateHUD();
  }

  return { init: init, update: update, plant: plant, reset: reset, refill: refill };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail tripwire-trap.js",_e&&_e.message); }
/* === zipline-grapple.js === */
try {
;
/* ─────────────────────────────────────────────────────────────────────────
   ZIPLINE-GRAPPLE — grappling hook for rapid traversal
   Keys:
     Ctrl+Shift+G  → fire hook in camera look direction
     Q             → release / cancel hook
   Mechanics:
     - 2 charges; 20 s cooldown per charge
     - Hook projectile: SphereGeometry(0.08), grey, travels 40 u/s, max 25 u
     - On solid hit   → attaches; swing (pendulum) or zipline (anchor above +2)
     - On miss        → hook falls and retracts (fail audio)
     - Zipline mode   → pulled toward anchor at 12 u/s
     - Swing mode     → pendulum physics; player can still WASD
     - Q release      → drops hook; momentum carries player
   Globals set:
     window._grappleActive   (bool)
     window._grappleAnchor   (THREE.Vector3 | null)
   ──────────────────────────────────────────────────────────────────────── */
window.ZiplineGrapple = (function () {
  'use strict';

  /* ── constants ──────────────────────────────────────────────────────── */
  var HOOK_SPEED      = 40;    // units/s while travelling
  var MAX_RANGE       = 25;    // max hook range (units)
  var ZIP_SPEED       = 12;    // units/s pull toward anchor in zipline mode
  var SWING_GRAVITY   = 9.8;   // m/s² pendulum gravity
  var MAX_CHARGES     = 2;
  var CHARGE_COOLDOWN = 20;    // seconds per charge
  var FOV_SWING       = 80;    // FOV while swinging
  var FOV_NORMAL      = 75;    // restored FOV
  var ZIPLINE_Y_MIN   = 2;     // anchor must be this far above player for zipline
  var MISS_RETRACT    = 0.6;   // seconds to retract after miss

  /* ── module state ───────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;

  // 'idle' | 'firing' | 'attached' | 'retracting' | 'miss'
  var _phase    = 'idle';

  var _charges     = MAX_CHARGES;
  var _cooldowns   = [0, 0];   // per-charge countdown

  // Hook travel state
  var _hookPos  = null;   // THREE.Vector3 — current hook tip world pos
  var _hookDir  = null;   // THREE.Vector3 — normalised travel direction
  var _hookDist = 0;      // distance travelled so far

  // Anchor
  var _anchor       = null;   // THREE.Vector3 — world attach point
  var _anchorMode   = 'swing'; // 'swing' | 'zipline'
  var _swingVelX    = 0;
  var _swingVelZ    = 0;
  var _ropeLen      = 0;

  // Retract / miss
  var _missTimer    = 0;
  var _retractFrom  = null;   // THREE.Vector3

  // Visuals
  var _hookMesh     = null;   // THREE.Mesh (sphere)
  var _ropeLine     = null;   // THREE.Line (BufferGeometry)
  var _ropePositions = null;  // Float32Array (6 floats)

  // HUD element
  var _hudEl = null;

  // Key state
  var _ctrlDown  = false;
  var _shiftDown = false;
  var _qDown     = false;

  // Audio buffers (Web Audio)
  var _audioCtx   = null;
  var _sndThunk   = null;
  var _sndClank   = null;
  var _sndZip     = null;
  var _zipNode    = null;   // oscillator for zip sound (looping)

  /* ── helpers ────────────────────────────────────────────────────────── */
  function _getPlayer() {
    if (window.GameManager && window.GameManager.getPlayer) {
      return window.GameManager.getPlayer();
    }
    return null;
  }

  function _getCamera() {
    if (_camera) return _camera;
    if (window.GameManager && window.GameManager.getCamera) {
      return window.GameManager.getCamera();
    }
    return null;
  }

  function _getScene() {
    if (_scene) return _scene;
    if (window.GameManager && window.GameManager.getScene) {
      return window.GameManager.getScene();
    }
    if (window._gameScene) return window._gameScene;
    return null;
  }

  function _isSolid(pos) {
    // Use VoxelWorld.isSolid if available, otherwise check getBlock
    if (window.VoxelWorld) {
      if (typeof window.VoxelWorld.isSolid === 'function') {
        return window.VoxelWorld.isSolid(
          Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z)
        );
      }
      if (typeof window.VoxelWorld.getBlock === 'function') {
        var b = window.VoxelWorld.getBlock(
          Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z)
        );
        return b && b !== 0;
      }
      // Fallback: treat anything at Y <= terrain height as solid
      if (typeof window.VoxelWorld.getTerrainHeight === 'function') {
        var th = window.VoxelWorld.getTerrainHeight(pos.x, pos.z);
        return pos.y <= th;
      }
    }
    // Last-resort fallback: world floor
    return pos.y <= 0;
  }

  /* ── Audio helpers ──────────────────────────────────────────────────── */
  function _ensureAudio() {
    if (_audioCtx) return;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { /* audio not available */ }
  }

  function _playThunk() {
    _ensureAudio();
    if (!_audioCtx) return;
    try {
      var buf = _audioCtx.createBuffer(1, _audioCtx.sampleRate * 0.12, _audioCtx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
      }
      var src = _audioCtx.createBufferSource();
      src.buffer = buf;
      var gain = _audioCtx.createGain();
      gain.gain.value = 0.35;
      src.connect(gain);
      gain.connect(_audioCtx.destination);
      src.start();
    } catch (e) {}
  }

  function _playClank() {
    _ensureAudio();
    if (!_audioCtx) return;
    try {
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, _audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, _audioCtx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.3, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.start();
      osc.stop(_audioCtx.currentTime + 0.18);
    } catch (e) {}
  }

  function _startZipSound() {
    _ensureAudio();
    if (!_audioCtx || _zipNode) return;
    try {
      _zipNode = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      _zipNode.type = 'sawtooth';
      _zipNode.frequency.value = 320;
      gain.gain.value = 0.08;
      _zipNode.connect(gain);
      gain.connect(_audioCtx.destination);
      _zipNode.start();
    } catch (e) {}
  }

  function _stopZipSound() {
    if (_zipNode) {
      try { _zipNode.stop(); } catch (e) {}
      _zipNode = null;
    }
  }

  function _playFail() {
    _ensureAudio();
    if (!_audioCtx) return;
    try {
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, _audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, _audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.start();
      osc.stop(_audioCtx.currentTime + 0.3);
    } catch (e) {}
  }

  /* ── Visuals ────────────────────────────────────────────────────────── */
  function _buildVisuals() {
    var sc = _getScene();
    if (!sc) return;

    // Hook sphere
    var geo = new THREE.SphereGeometry(0.08, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    _hookMesh = new THREE.Mesh(geo, mat);
    _hookMesh.frustumCulled = false;
    _hookMesh.visible = false;
    sc.add(_hookMesh);

    // Rope line: 2 points × 3 components
    var rGeo = new THREE.BufferGeometry();
    _ropePositions = new Float32Array(6);
    rGeo.setAttribute('position', new THREE.BufferAttribute(_ropePositions, 3));
    var rMat = new THREE.LineBasicMaterial({ color: 0x555555 });
    _ropeLine = new THREE.Line(rGeo, rMat);
    _ropeLine.frustumCulled = false;
    _ropeLine.visible = false;
    sc.add(_ropeLine);
  }

  function _destroyVisuals() {
    var sc = _getScene();
    if (!sc) return;
    if (_hookMesh) {
      sc.remove(_hookMesh);
      _hookMesh.geometry.dispose();
      _hookMesh.material.dispose();
      _hookMesh = null;
    }
    if (_ropeLine) {
      sc.remove(_ropeLine);
      _ropeLine.geometry.dispose();
      _ropeLine.material.dispose();
      _ropeLine = null;
      _ropePositions = null;
    }
  }

  function _updateRope(tipX, tipY, tipZ, tailX, tailY, tailZ) {
    if (!_ropeLine || !_ropePositions) return;
    // tail = player chest (~Y+1)
    _ropePositions[0] = tailX;
    _ropePositions[1] = tailY + 1.0;
    _ropePositions[2] = tailZ;
    _ropePositions[3] = tipX;
    _ropePositions[4] = tipY;
    _ropePositions[5] = tipZ;
    _ropeLine.geometry.attributes.position.needsUpdate = true;
    _ropeLine.visible = true;
    if (_hookMesh) {
      _hookMesh.position.set(tipX, tipY, tipZ);
      _hookMesh.visible = true;
    }
  }

  function _hideRope() {
    if (_ropeLine) _ropeLine.visible = false;
    if (_hookMesh) _hookMesh.visible = false;
  }

  /* ── HUD ────────────────────────────────────────────────────────────── */
  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'zg-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:14px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#e0e0e0',
      'font-family:monospace',
      'font-size:13px',
      'letter-spacing:2px',
      'text-shadow:0 0 6px #000',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_phase === 'idle' && _charges === MAX_CHARGES) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var icons = '';
    for (var i = 0; i < MAX_CHARGES; i++) {
      if (i < _charges) {
        icons += 'HOOK';
      } else {
        var pct = Math.max(0, 1 - _cooldowns[i] / CHARGE_COOLDOWN);
        icons += '[' + Math.floor(pct * 10) + ']';
      }
      if (i < MAX_CHARGES - 1) icons += ' ';
    }
    if (_phase === 'attached') {
      icons += ' • ' + (_anchorMode === 'zipline' ? 'ZIP' : 'SWING');
    }
    if (_phase === 'firing') {
      icons += ' • →';
    }
    _hudEl.textContent = icons;
  }

  function _setCrosshairMode(active) {
    // Try to toggle a crosshair class if HUD system supports it
    var ch = document.getElementById('crosshair') || document.getElementById('hud-crosshair');
    if (!ch) return;
    if (active) {
      ch.style.borderColor = '#ff9900';
      ch.style.boxShadow = '0 0 6px #ff9900';
    } else {
      ch.style.borderColor = '';
      ch.style.boxShadow = '';
    }
  }

  /* ── FOV tweening ───────────────────────────────────────────────────── */
  function _setFOV(target) {
    var cam = _getCamera();
    if (!cam) return;
    cam.fov = target;
    cam.updateProjectionMatrix();
  }

  /* ── Core: fire ─────────────────────────────────────────────────────── */
  function fire() {
    if (_charges <= 0) return;
    if (_phase !== 'idle') return;

    var cam = _getCamera();
    var player = _getPlayer();
    if (!cam || !player) return;

    // Consume a charge; start its cooldown
    _charges--;
    _cooldowns[_charges] = CHARGE_COOLDOWN;

    // Hook starts at player chest in world space
    _hookPos = new THREE.Vector3(
      player.position.x,
      player.position.y + 1.2,
      player.position.z
    );

    // Fire direction from camera
    _hookDir = new THREE.Vector3(0, 0, -1);
    _hookDir.applyQuaternion(cam.quaternion);
    _hookDir.normalize();

    _hookDist = 0;
    _phase = 'firing';

    // Ensure visuals are ready
    if (!_hookMesh) _buildVisuals();

    _playThunk();
    _setCrosshairMode(true);
    window._grappleActive = true;
    window._grappleAnchor = null;
  }

  /* ── Core: release ──────────────────────────────────────────────────── */
  function release() {
    if (_phase === 'idle') return;

    _stopZipSound();
    _setFOV(FOV_NORMAL);
    _hideRope();
    _phase = 'idle';
    _anchor = null;
    _hookPos = null;
    _hookDir = null;
    _swingVelX = 0;
    _swingVelZ = 0;
    _setCrosshairMode(false);
    window._grappleActive = false;
    window._grappleAnchor = null;
  }

  /* ── Core: update (called each frame) ─────────────────────────────── */
  function update(delta) {
    // Tick charge cooldowns
    for (var ci = 0; ci < MAX_CHARGES; ci++) {
      if (_cooldowns[ci] > 0) {
        _cooldowns[ci] -= delta;
        if (_cooldowns[ci] <= 0) {
          _cooldowns[ci] = 0;
          if (_charges < MAX_CHARGES) _charges++;
        }
      }
    }

    var player = _getPlayer();
    var cam    = _getCamera();

    if (_phase === 'idle') {
      _updateHUD();
      return;
    }

    if (!player || !cam) {
      _updateHUD();
      return;
    }

    var px = player.position.x;
    var py = player.position.y;
    var pz = player.position.z;

    /* ── Phase: firing ──────────────────────────────────────────────── */
    if (_phase === 'firing') {
      var step = HOOK_SPEED * delta;
      _hookPos.x += _hookDir.x * step;
      _hookPos.y += _hookDir.y * step;
      _hookPos.z += _hookDir.z * step;
      _hookDist  += step;

      var hit = _isSolid(_hookPos);

      if (hit) {
        // Attach
        _anchor = _hookPos.clone();
        _ropeLen = _anchor.distanceTo(player.position);
        _anchorMode = (_anchor.y > py + ZIPLINE_Y_MIN) ? 'zipline' : 'swing';
        _phase = 'attached';
        _swingVelX = 0;
        _swingVelZ = 0;
        _playClank();
        if (_anchorMode === 'zipline') _startZipSound();
        if (_anchorMode === 'swing') _setFOV(FOV_SWING);
        window._grappleAnchor = _anchor;
      } else if (_hookDist >= MAX_RANGE) {
        // Miss: begin fall/retract
        _phase = 'miss';
        _missTimer = MISS_RETRACT;
        _retractFrom = _hookPos.clone();
        _playFail();
      }

      if (_hookPos) {
        _updateRope(_hookPos.x, _hookPos.y, _hookPos.z, px, py, pz);
      }
      _updateHUD();
      return;
    }

    /* ── Phase: attached ────────────────────────────────────────────── */
    if (_phase === 'attached') {
      var ax = _anchor.x;
      var ay = _anchor.y;
      var az = _anchor.z;
      var dx = ax - px;
      var dy = ay - py;
      var dz = az - pz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (_anchorMode === 'zipline') {
        /* Pull player toward anchor */
        if (dist < 0.8) {
          // Arrived — release
          release();
          return;
        }
        var speed = ZIP_SPEED * delta / dist;
        player.position.x += dx * speed;
        player.position.y += dy * speed;
        player.position.z += dz * speed;
        // Zero out vertical velocity so game physics don't fight us
        if (player.velocity) player.velocity.y = 0;

      } else {
        /* Swing mode — pendulum physics */
        // Tension: keep player at rope length from anchor
        if (dist > 0.1) {
          // Pendulum gravity component along rope perpendicular
          // tangential gravity = g * sin(theta) where theta = angle from vertical
          // simplified: apply gravity-derived tangential force
          var nx = dx / dist;
          var ny = dy / dist;
          var nz = dz / dist;

          // Gravity projected perpendicular to rope
          var gravDotRope = -ny; // dot(g_down, -rope_dir)
          var tanGravX = 0  - gravDotRope * nx;
          var tanGravY = -1 - gravDotRope * ny;
          var tanGravZ = 0  - gravDotRope * nz;

          _swingVelX += tanGravX * SWING_GRAVITY * delta;
          _swingVelZ += tanGravZ * SWING_GRAVITY * delta;
          // Apply tangential only (no Y stored, gravity is applied by main loop too)
          player.position.x += _swingVelX * delta;
          player.position.z += _swingVelZ * delta;

          // Constraint: keep at rope length
          var newDx = player.position.x - ax;
          var newDy = player.position.y - ay;
          var newDz = player.position.z - az;
          var newDist = Math.sqrt(newDx * newDx + newDy * newDy + newDz * newDz);
          if (newDist > 0.001) {
            var scale = _ropeLen / newDist;
            player.position.x = ax + newDx * scale;
            player.position.y = ay + newDy * scale;
            player.position.z = az + newDz * scale;
          }
        }
      }

      // Update rope to current player pos (may have changed)
      _updateRope(ax, ay, az,
        player.position.x, player.position.y, player.position.z);
      _updateHUD();
      return;
    }

    /* ── Phase: miss / retract ──────────────────────────────────────── */
    if (_phase === 'miss') {
      _missTimer -= delta;
      var t = Math.max(0, _missTimer / MISS_RETRACT);
      // Hook sags downward while retracting
      var tipX = _retractFrom.x * t + px * (1 - t);
      var tipY = (_retractFrom.y - (1 - t) * 3) * t + py * (1 - t);
      var tipZ = _retractFrom.z * t + pz * (1 - t);
      _updateRope(tipX, tipY, tipZ, px, py, pz);

      if (_missTimer <= 0) {
        _phase = 'idle';
        _hideRope();
        window._grappleActive = false;
        window._grappleAnchor = null;
        _setCrosshairMode(false);
      }
      _updateHUD();
      return;
    }

    _updateHUD();
  }

  /* ── Input handlers ─────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    var tag = (e.target || {}).tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'Control')   _ctrlDown  = true;
    if (e.key === 'Shift')     _shiftDown = true;

    // Ctrl+Shift+G → fire
    if (e.key === 'G' && _ctrlDown && _shiftDown) {
      e.preventDefault();
      fire();
      return;
    }

    // Q → release
    if (e.key === 'q' || e.key === 'Q') {
      if (_phase !== 'idle') {
        e.preventDefault();
        release();
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'Control')   _ctrlDown  = false;
    if (e.key === 'Shift')     _shiftDown = false;
  }

  /* ── Public API ─────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;

    _charges   = MAX_CHARGES;
    _cooldowns = [0, 0];
    _phase     = 'idle';

    window._grappleActive = false;
    window._grappleAnchor = null;

    _buildHUD();
    _buildVisuals();

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);
  }

  function reset() {
    release();
    _charges   = MAX_CHARGES;
    _cooldowns = [0, 0];
    _destroyVisuals();
    _buildVisuals();
    window._grappleActive = false;
    window._grappleAnchor = null;
    if (_hudEl) _hudEl.style.display = 'none';
  }

  return { init: init, update: update, fire: fire, reset: reset };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail zipline-grapple.js",_e&&_e.message); }
/* === dynamic-weather.js === */
try {
;
/* ───────────────────────────────────────────────────────────────────────────
   DYNAMIC WEATHER — Rotating weather cycle with 4 states:
   CLEAR, HEAVY_FOG, SANDSTORM, BLIZZARD
   Rotates every 90-150s with 15s linear interpolation transitions.
   Integrates with rain-system.js via window._isRaining.
   ─────────────────────────────────────────────────────────────────────────── */
window.DynamicWeather = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var STATE_CLEAR      = 'CLEAR';
  var STATE_HEAVY_FOG  = 'HEAVY_FOG';
  var STATE_SANDSTORM  = 'SANDSTORM';
  var STATE_BLIZZARD   = 'BLIZZARD';

  var CYCLE_MIN        = 90;   // seconds minimum per state
  var CYCLE_MAX        = 150;  // seconds maximum per state
  var TRANSITION_TIME  = 15;   // seconds to interpolate between states

  var SANDSTORM_COUNT  = 200;
  var BLIZZARD_COUNT   = 400;

  // Fog settings per state
  var FOG_SETTINGS = {
    CLEAR:      { far: 60,  color: 0xCCCCCC },
    HEAVY_FOG:  { far: 10,  color: 0x999999 },
    SANDSTORM:  { far: 12,  color: 0xC8A060 },
    BLIZZARD:   { far: 8,   color: 0xDDEEFF }
  };

  // Ambient light colors per state
  var AMBIENT_COLORS = {
    CLEAR:      0xFFFFEE,
    HEAVY_FOG:  0x888899,
    SANDSTORM:  0xCC9955,
    BLIZZARD:   0x8888BB
  };

  // HUD icons per state
  var HUD_ICONS = {
    CLEAR:      '☀️ CLEAR',
    HEAVY_FOG:  '🌫️ FOG',
    SANDSTORM:  '🌪️ SANDSTORM',
    BLIZZARD:   '❄️ BLIZZARD'
  };

  // Movement penalty multipliers per state
  var MOVE_MULT = {
    CLEAR:      1.0,
    HEAVY_FOG:  0.85,
    SANDSTORM:  1.0,
    BLIZZARD:   0.7
  };

  // Visibility multipliers per state
  var VIS_MULT = {
    CLEAR:      1.0,
    HEAVY_FOG:  0.5,
    SANDSTORM:  0.6,
    BLIZZARD:   0.5
  };

  // ── Internal state ─────────────────────────────────────────────────────────
  var _scene       = null;
  var _camera      = null;
  var _ambientLight = null;

  var _currentState   = STATE_CLEAR;
  var _previousState  = STATE_CLEAR;
  var _nextState      = STATE_CLEAR;
  var _stateTimer     = 0;   // time spent in current state
  var _stateDuration  = 120; // seconds until next change
  var _transitionT    = 1.0; // 0=start transition, 1=fully in currentState
  var _inTransition   = false;

  // Fog originals
  var _origFogFar   = null;
  var _origFogColor = null;

  // Particle groups
  var _sandGroup   = null;
  var _snowGroup   = null;
  var _sandParticles = [];
  var _snowParticles = [];

  // DOM / CSS refs
  var _canvas    = null;
  var _hudBadge  = null;
  var _hudTimer  = null;

  // Audio nodes
  var _audioCtx      = null;
  var _activeAudio   = null; // { osc, noise, gainNode }
  var _activeState   = null; // which state the audio was created for

  var _initialized = false;

  // ── Utilities ──────────────────────────────────────────────────────────────
  function _rand(mn, mx) {
    return mn + Math.random() * (mx - mn);
  }

  function _clamp(v, mn, mx) {
    return v < mn ? mn : v > mx ? mx : v;
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _lerpColor(c1, c2, t) {
    var r1 = (c1 >> 16) & 0xFF, g1 = (c1 >> 8) & 0xFF, b1 = c1 & 0xFF;
    var r2 = (c2 >> 16) & 0xFF, g2 = (c2 >> 8) & 0xFF, b2 = c2 & 0xFF;
    var r = Math.round(_lerp(r1, r2, t));
    var g = Math.round(_lerp(g1, g2, t));
    var b = Math.round(_lerp(b1, b2, t));
    return (r << 16) | (g << 8) | b;
  }

  function _getCanvas() {
    if (!_canvas) { _canvas = document.querySelector('canvas'); }
    return _canvas;
  }

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx ||
          new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { _audioCtx = null; }
    }
    return _audioCtx;
  }

  function _pickNextState() {
    // If raining, jump to HEAVY_FOG
    if (window._isRaining) { return STATE_HEAVY_FOG; }
    var states = [STATE_CLEAR, STATE_HEAVY_FOG, STATE_SANDSTORM, STATE_BLIZZARD];
    // Remove the current state to avoid repetition
    var choices = [];
    for (var i = 0; i < states.length; i++) {
      if (states[i] !== _currentState) { choices.push(states[i]); }
    }
    return choices[Math.floor(Math.random() * choices.length)];
  }

  // ── Particle helpers ───────────────────────────────────────────────────────
  function _createSandParticles() {
    if (_sandGroup) { _destroySandParticles(); }
    _sandGroup = new THREE.Group();
    _sandParticles = [];
    var mat = new THREE.MeshBasicMaterial({ color: 0xC8A060, transparent: true, opacity: 0.7 });
    for (var i = 0; i < SANDSTORM_COUNT; i++) {
      var geo = new THREE.SphereGeometry(0.03, 4, 4);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        _rand(-20, 20),
        _rand(0.5, 4),
        _rand(-20, 20)
      );
      mesh.userData.velX = _rand(3, 8);   // sand flies horizontally
      mesh.userData.velY = _rand(-0.1, 0.1);
      mesh.userData.velZ = _rand(-1, 1);
      _sandGroup.add(mesh);
      _sandParticles.push(mesh);
    }
    _scene.add(_sandGroup);
  }

  function _destroySandParticles() {
    if (!_sandGroup) { return; }
    for (var i = 0; i < _sandParticles.length; i++) {
      _sandParticles[i].geometry.dispose();
    }
    _scene.remove(_sandGroup);
    _sandGroup = null;
    _sandParticles = [];
  }

  function _createSnowParticles() {
    if (_snowGroup) { _destroySnowParticles(); }
    _snowGroup = new THREE.Group();
    _snowParticles = [];
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.85 });
    for (var i = 0; i < BLIZZARD_COUNT; i++) {
      var geo = new THREE.SphereGeometry(0.03, 4, 4);
      var mesh = new THREE.Mesh(geo, mat);
      var angle = _rand(0, Math.PI * 2);
      var radius = _rand(0, 15);
      mesh.position.set(
        Math.cos(angle) * radius,
        _rand(0.5, 8),
        Math.sin(angle) * radius
      );
      mesh.userData.helixAngle  = angle;
      mesh.userData.helixRadius = radius;
      mesh.userData.helixY      = mesh.position.y;
      mesh.userData.helixSpeed  = _rand(0.5, 1.5);
      mesh.userData.fallSpeed   = _rand(0.5, 1.5);
      _snowGroup.add(mesh);
      _snowParticles.push(mesh);
    }
    _scene.add(_snowGroup);
  }

  function _destroySnowParticles() {
    if (!_snowGroup) { return; }
    for (var i = 0; i < _snowParticles.length; i++) {
      _snowParticles[i].geometry.dispose();
    }
    _scene.remove(_snowGroup);
    _snowGroup = null;
    _snowParticles = [];
  }

  // ── Audio ──────────────────────────────────────────────────────────────────
  function _stopAudio() {
    if (!_activeAudio) { return; }
    try {
      if (_activeAudio.gainNode) {
        _activeAudio.gainNode.gain.setTargetAtTime(0, _audioCtx.currentTime, 0.5);
      }
      var audio = _activeAudio;
      setTimeout(function () {
        try { if (audio.osc)   { audio.osc.stop();   } } catch (e) {}
        try { if (audio.noise) { audio.noise.stop();  } } catch (e) {}
      }, 1500);
    } catch (e) {}
    _activeAudio = null;
    _activeState = null;
  }

  function _makeNoiseBuffer(ctx) {
    var bufSize = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  function _startAudioForState(state) {
    var ctx = _getAudioCtx();
    if (!ctx || state === STATE_CLEAR) { return; }
    if (_activeState === state) { return; }
    _stopAudio();

    try {
      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2);
      gainNode.connect(ctx.destination);

      var osc = null;
      var noiseSource = null;

      if (state === STATE_HEAVY_FOG) {
        // Low howling wind — sine wave ~120 Hz + noise
        osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 3);
        var oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(gainNode);
        osc.start();

        var noiseBuf = _makeNoiseBuffer(ctx);
        noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf;
        noiseSource.loop = true;
        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);
        noiseSource.connect(filter);
        filter.connect(gainNode);
        noiseSource.start();

      } else if (state === STATE_SANDSTORM) {
        // Sand-rush — bandpass noise ~800 Hz
        var noiseBuf2 = _makeNoiseBuffer(ctx);
        noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf2;
        noiseSource.loop = true;
        var bpFilter = ctx.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.setValueAtTime(800, ctx.currentTime);
        bpFilter.Q.setValueAtTime(0.5, ctx.currentTime);
        noiseSource.connect(bpFilter);
        bpFilter.connect(gainNode);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);
        noiseSource.start();

      } else if (state === STATE_BLIZZARD) {
        // Howling blizzard — sawtooth ~200 Hz + high noise
        osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        var oscGain2 = ctx.createGain();
        oscGain2.gain.setValueAtTime(0.15, ctx.currentTime);
        var oscFilter = ctx.createBiquadFilter();
        oscFilter.type = 'lowpass';
        oscFilter.frequency.setValueAtTime(600, ctx.currentTime);
        osc.connect(oscFilter);
        oscFilter.connect(oscGain2);
        oscGain2.connect(gainNode);
        osc.start();

        var noiseBuf3 = _makeNoiseBuffer(ctx);
        noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf3;
        noiseSource.loop = true;
        var hiFilter = ctx.createBiquadFilter();
        hiFilter.type = 'highpass';
        hiFilter.frequency.setValueAtTime(2000, ctx.currentTime);
        noiseSource.connect(hiFilter);
        hiFilter.connect(gainNode);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 2);
        noiseSource.start();
      }

      _activeAudio = { osc: osc, noise: noiseSource, gainNode: gainNode };
      _activeState = state;
    } catch (e) {
      _activeAudio = null;
      _activeState = null;
    }
  }

  // ── CSS / DOM effects ──────────────────────────────────────────────────────
  function _applyCanvasFilter(state) {
    var cv = _getCanvas();
    if (!cv) { return; }
    if (state === STATE_HEAVY_FOG) {
      cv.style.filter = 'blur(0.5px) brightness(0.7)';
    } else if (state === STATE_SANDSTORM) {
      // handled by body filter
      cv.style.filter = '';
    } else if (state === STATE_BLIZZARD) {
      cv.style.filter = 'brightness(0.85) saturate(0.8)';
    } else {
      cv.style.filter = '';
    }
  }

  function _applyBodyFilter(state) {
    if (state === STATE_SANDSTORM) {
      document.body.style.filter = 'sepia(0.4) contrast(1.1)';
    } else {
      document.body.style.filter = '';
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _createHUD() {
    if (_hudBadge) { return; }
    _hudBadge = document.createElement('div');
    _hudBadge.id = 'dynamic-weather-hud';
    _hudBadge.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.55)',
      'color:#fff',
      'font-family:monospace',
      'font-size:14px',
      'padding:4px 12px',
      'border-radius:6px',
      'z-index:9999',
      'pointer-events:none',
      'text-align:center',
      'line-height:1.4'
    ].join(';');
    document.body.appendChild(_hudBadge);
  }

  function _updateHUD(secondsLeft) {
    if (!_hudBadge) { _createHUD(); }
    var icon = HUD_ICONS[_currentState] || _currentState;
    var secs = Math.max(0, Math.ceil(secondsLeft));
    _hudBadge.innerHTML = icon + '<br><span style="font-size:10px;opacity:0.7">next: ' + secs + 's</span>';
  }

  function _removeHUD() {
    if (_hudBadge && _hudBadge.parentNode) {
      _hudBadge.parentNode.removeChild(_hudBadge);
    }
    _hudBadge = null;
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  function _showToast(msg) {
    if (window.HUD && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast(msg);
    }
  }

  // ── State transitions ──────────────────────────────────────────────────────
  function _activateState(state) {
    _currentState = state;
    window._currentWeather = state;
    window._weatherVisibilityMult = VIS_MULT[state] || 1.0;

    // Spawn / despawn particles
    if (state === STATE_SANDSTORM) {
      _createSandParticles();
      _destroySnowParticles();
    } else if (state === STATE_BLIZZARD) {
      _createSnowParticles();
      _destroySandParticles();
    } else {
      _destroySandParticles();
      _destroySnowParticles();
    }

    // Canvas/body CSS
    _applyCanvasFilter(state);
    _applyBodyFilter(state);

    // Audio
    if (state === STATE_CLEAR) {
      _stopAudio();
    } else {
      _startAudioForState(state);
    }

    // Toast alerts
    if (state === STATE_HEAVY_FOG) {
      _showToast('HEAVY FOG');
    } else if (state === STATE_SANDSTORM) {
      _showToast('SANDSTORM INCOMING');
    } else if (state === STATE_BLIZZARD) {
      _showToast('BLIZZARD ALERT');
    }
  }

  // ── Enemy effect globals ───────────────────────────────────────────────────
  function _applyEnemyEffects(state) {
    // Enemy detection range halved in heavy fog and blizzard
    if (state === STATE_HEAVY_FOG || state === STATE_BLIZZARD) {
      window._enemyDetectMult   = 0.5;
      window._enemyAccuracyMult = 1.0;
    } else if (state === STATE_SANDSTORM) {
      window._enemyDetectMult   = 1.0;
      window._enemyAccuracyMult = 0.7; // enemy accuracy -30%
    } else {
      window._enemyDetectMult   = 1.0;
      window._enemyAccuracyMult = 1.0;
    }
  }

  // ── Player effect globals ──────────────────────────────────────────────────
  function _applyPlayerEffects(state) {
    window._weatherMoveMult    = MOVE_MULT[state]     || 1.0;
    window._weatherVisibilityMult = VIS_MULT[state]   || 1.0;
    // Sandstorm bullet accuracy penalty (-20%)
    window._weatherBulletAccMult = (state === STATE_SANDSTORM) ? 0.8 : 1.0;
  }

  // ── Fog interpolation ──────────────────────────────────────────────────────
  function _updateFog(t) {
    if (!_scene || !_scene.fog) { return; }
    var prevFog  = FOG_SETTINGS[_previousState] || FOG_SETTINGS[STATE_CLEAR];
    var curFog   = FOG_SETTINGS[_currentState]  || FOG_SETTINGS[STATE_CLEAR];
    _scene.fog.far   = _lerp(prevFog.far,   curFog.far,   t);
    var c = _lerpColor(prevFog.color, curFog.color, t);
    _scene.fog.color.setHex(c);
  }

  // ── Ambient light interpolation ────────────────────────────────────────────
  function _updateAmbient(t) {
    if (!_ambientLight) { return; }
    var prevC = AMBIENT_COLORS[_previousState] || AMBIENT_COLORS[STATE_CLEAR];
    var curC  = AMBIENT_COLORS[_currentState]  || AMBIENT_COLORS[STATE_CLEAR];
    _ambientLight.color.setHex(_lerpColor(prevC, curC, t));
  }

  // ── Particle animation ─────────────────────────────────────────────────────
  function _updateSandParticles(dt) {
    if (!_sandGroup || !_camera) { return; }
    var cx = _camera.position.x;
    var cy = _camera.position.y;
    var cz = _camera.position.z;
    for (var i = 0; i < _sandParticles.length; i++) {
      var p = _sandParticles[i];
      p.position.x += p.userData.velX * dt;
      p.position.y += p.userData.velY * dt;
      p.position.z += p.userData.velZ * dt;
      // Wrap around camera
      if (p.position.x - cx > 20) { p.position.x = cx - 20 + Math.random(); }
      if (p.position.x - cx < -20) { p.position.x = cx + 20 - Math.random(); }
      if (p.position.z - cz > 20) { p.position.z = cz - 20 + Math.random(); }
      if (p.position.z - cz < -20) { p.position.z = cz + 20 - Math.random(); }
      if (p.position.y < 0.2) { p.position.y = _rand(0.5, 4); }
      if (p.position.y > 5) { p.position.y = _rand(0.5, 4); }
    }
  }

  function _updateSnowParticles(dt) {
    if (!_snowGroup || !_camera) { return; }
    var cx = _camera.position.x;
    var cz = _camera.position.z;
    for (var i = 0; i < _snowParticles.length; i++) {
      var p = _snowParticles[i];
      p.userData.helixAngle += p.userData.helixSpeed * dt;
      p.userData.helixY     -= p.userData.fallSpeed  * dt;
      if (p.userData.helixY < 0) { p.userData.helixY = _rand(4, 8); }
      var r = p.userData.helixRadius;
      p.position.x = cx + Math.cos(p.userData.helixAngle) * r;
      p.position.z = cz + Math.sin(p.userData.helixAngle) * r;
      p.position.y = p.userData.helixY;
    }
  }

  // ── Ambient light helper ───────────────────────────────────────────────────
  function _findOrCreateAmbient() {
    if (!_scene) { return; }
    _scene.traverse(function (obj) {
      if (!_ambientLight && obj.isAmbientLight) { _ambientLight = obj; }
    });
    // If no ambient exists, create one
    if (!_ambientLight) {
      _ambientLight = new THREE.AmbientLight(AMBIENT_COLORS[STATE_CLEAR], 0.6);
      _scene.add(_ambientLight);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function init(scene, camera) {
    if (_initialized) { return; }
    _scene  = scene  || window._gameScene  || null;
    _camera = camera || window._camera     || null;
    if (!_scene) { return; }

    // Store original fog values
    if (_scene.fog) {
      _origFogFar   = _scene.fog.far;
      _origFogColor = _scene.fog.color ? _scene.fog.color.getHex() : 0xCCCCCC;
      // Treat CLEAR far as the original
      FOG_SETTINGS[STATE_CLEAR].far   = _origFogFar   || 60;
      FOG_SETTINGS[STATE_CLEAR].color = _origFogColor  || 0xCCCCCC;
    }

    _findOrCreateAmbient();
    _createHUD();

    _currentState  = STATE_CLEAR;
    _previousState = STATE_CLEAR;
    _stateTimer    = 0;
    _stateDuration = _rand(CYCLE_MIN, CYCLE_MAX);
    _transitionT   = 1.0;
    _inTransition  = false;

    window._currentWeather        = STATE_CLEAR;
    window._weatherVisibilityMult = 1.0;
    window._weatherMoveMult       = 1.0;
    window._weatherBulletAccMult  = 1.0;
    window._enemyDetectMult       = 1.0;
    window._enemyAccuracyMult     = 1.0;

    _initialized = true;
  }

  function update(dt) {
    if (!_initialized || !_scene) { return; }
    if (!dt || dt <= 0) { return; }

    // Clamp dt so a tab sleep doesn't jump the cycle
    dt = _clamp(dt, 0, 0.1);

    // If rain system is active, force HEAVY_FOG
    if (window._isRaining && _currentState !== STATE_HEAVY_FOG && !_inTransition) {
      _previousState = _currentState;
      _currentState  = STATE_HEAVY_FOG;
      _inTransition  = true;
      _transitionT   = 0;
      _activateState(STATE_HEAVY_FOG);
    }

    _stateTimer += dt;

    if (_inTransition) {
      _transitionT += dt / TRANSITION_TIME;
      if (_transitionT >= 1.0) {
        _transitionT  = 1.0;
        _inTransition = false;
      }
    }

    // Update interpolated fog & ambient
    _updateFog(_transitionT);
    _updateAmbient(_transitionT);

    // Particle updates
    if (_currentState === STATE_SANDSTORM) {
      _updateSandParticles(dt);
    } else if (_currentState === STATE_BLIZZARD) {
      _updateSnowParticles(dt);
    }

    // Check if it's time to switch states
    if (!_inTransition && _stateTimer >= _stateDuration) {
      _stateTimer   = 0;
      _stateDuration = _rand(CYCLE_MIN, CYCLE_MAX);
      _previousState = _currentState;
      _nextState     = _pickNextState();
      _inTransition  = true;
      _transitionT   = 0;
      _activateState(_nextState);
    }

    // Apply player and enemy effect globals every frame
    _applyPlayerEffects(_currentState);
    _applyEnemyEffects(_currentState);

    // Update HUD countdown
    var timeLeft = _stateDuration - _stateTimer;
    _updateHUD(timeLeft);
  }

  function setWeather(state) {
    if (!_initialized) { return; }
    var valid = [STATE_CLEAR, STATE_HEAVY_FOG, STATE_SANDSTORM, STATE_BLIZZARD];
    var found = false;
    for (var i = 0; i < valid.length; i++) {
      if (valid[i] === state) { found = true; break; }
    }
    if (!found) { return; }
    _previousState = _currentState;
    _inTransition  = true;
    _transitionT   = 0;
    _stateTimer    = 0;
    _stateDuration = _rand(CYCLE_MIN, CYCLE_MAX);
    _activateState(state);
  }

  function reset() {
    _stopAudio();
    _destroySandParticles();
    _destroySnowParticles();
    _applyCanvasFilter(STATE_CLEAR);
    _applyBodyFilter(STATE_CLEAR);
    _removeHUD();

    if (_scene && _scene.fog) {
      if (_origFogFar   !== null) { _scene.fog.far = _origFogFar; }
      if (_origFogColor !== null) { _scene.fog.color.setHex(_origFogColor); }
    }

    _currentState  = STATE_CLEAR;
    _previousState = STATE_CLEAR;
    _nextState     = STATE_CLEAR;
    _stateTimer    = 0;
    _transitionT   = 1.0;
    _inTransition  = false;
    _initialized   = false;

    window._currentWeather        = STATE_CLEAR;
    window._weatherVisibilityMult = 1.0;
    window._weatherMoveMult       = 1.0;
    window._weatherBulletAccMult  = 1.0;
    window._enemyDetectMult       = 1.0;
    window._enemyAccuracyMult     = 1.0;
  }

  return { init: init, update: update, setWeather: setWeather, reset: reset };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail dynamic-weather.js",_e&&_e.message); }
/* === enemy-suicide-bomber.js === */
try {
;
/**
 * enemy-suicide-bomber.js – Suicide Bomber enemy type for Occupant Killer
 *
 * Fast enemy that sprints at the player and detonates on contact.
 * Spawns from wave 7+, 1–2 per wave, mixed with normal enemies.
 *
 * Depends on: THREE (global), AudioSystem, CameraSystem, Tracers, HUD
 * Communicates damage via window._takeDamageFromWaveEvent
 * Registers itself as window.EnemySuicideBomber
 * Maintains active bomber list at window._suicideBombers
 */
window.EnemySuicideBomber = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var HP              = 60;
  var DETECT_RANGE    = 20;    // units — switches IDLE → SPRINT
  var WARN_RANGE      = 10;    // units — shows HUD warning
  var SPRINT_SPEED    = 7;     // units/s
  var WANDER_SPEED    = 1.5;   // units/s in IDLE
  var PRIME_RANGE     = 3;     // units — switches SPRINT → PRIMED
  var DETONATE_RANGE  = 2;     // units — immediate detonation
  var FALL_THRESHOLD  = -2;    // Y below which emergency detonate

  // Explosion damage tiers  [damage, radius]
  var EXPL_TIERS = [
    [150, 4],
    [80,  8],
    [30,  14]
  ];
  // Death explosion (smaller)
  var EXPL_TIERS_DEATH = [
    [80,  3],
    [40,  6],
    [20,  10]
  ];

  var BEEP_FREQ       = 800;   // Hz
  var BEEP_INTERVAL_FAR  = 1.0;  // seconds at max range
  var BEEP_INTERVAL_NEAR = 0.15; // seconds when primed

  var SCORE_KILL_BEFORE  = 400;  // shot before reaching player
  var SCORE_KILL_DURING  = 200;  // killed while already exploding

  // Visual colours
  var COLOR_VEST      = 0x556B2F; // olive green
  var COLOR_LED       = 0xFF0000; // red LED strips
  var COLOR_DETONATOR = 0x333333; // dark grey
  var COLOR_SKIN      = 0xC68642;
  var COLOR_UNIFORM   = 0x4A5240;
  var COLOR_EYES      = 0x222222;

  // FSM states
  var STATE_IDLE     = 'IDLE';
  var STATE_SPRINT   = 'SPRINT';
  var STATE_PRIMED   = 'PRIMED';
  var STATE_DETONATE = 'DETONATE';
  var STATE_DEAD     = 'DEAD';

  // ── Module-level state ────────────────────────────────────────────────────
  var _scene         = null;
  var _inited        = false;
  var _warningShown  = false;
  var _warningEl     = null;  // DOM element for the ⚠ flash

  // Public bomber list
  window._suicideBombers = window._suicideBombers || [];

  // ── Geometry / material caches ────────────────────────────────────────────
  var _geoBody     = null;
  var _geoHead     = null;
  var _geoVest     = null;
  var _geoLED      = null;
  var _geoArm      = null;
  var _geoDet      = null;
  var _geoDebris   = null;
  var _geoSmoke    = null;

  var _matVest     = null;
  var _matLED      = null;
  var _matSkin     = null;
  var _matUniform  = null;
  var _matDet      = null;
  var _matDebris   = null;
  var _matSmoke    = null;

  // Active debris / smoke particles (for cleanup)
  var _particles   = [];

  // ── Internal helpers ──────────────────────────────────────────────────────

  function _ensureGeos() {
    if (_geoBody)   return;
    _geoBody    = new THREE.BoxGeometry(0.6, 1.1, 0.35);
    _geoHead    = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    _geoVest    = new THREE.BoxGeometry(0.5, 0.6, 0.3);
    _geoLED     = new THREE.BoxGeometry(0.04, 0.04, 0.32);
    _geoArm     = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    _geoDet     = new THREE.BoxGeometry(0.12, 0.22, 0.08);
    _geoDebris  = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    _geoSmoke   = new THREE.SphereGeometry(1.5, 6, 6);

    _matVest    = new THREE.MeshLambertMaterial({ color: COLOR_VEST });
    _matLED     = new THREE.MeshBasicMaterial({ color: COLOR_LED });
    _matSkin    = new THREE.MeshLambertMaterial({ color: COLOR_SKIN });
    _matUniform = new THREE.MeshLambertMaterial({ color: COLOR_UNIFORM });
    _matDet     = new THREE.MeshLambertMaterial({ color: COLOR_DETONATOR });
    _matDebris  = new THREE.MeshLambertMaterial({ color: 0x888866 });
    _matSmoke   = new THREE.MeshBasicMaterial({
      color: 0x666666, transparent: true, opacity: 0.6,
      depthWrite: false
    });
  }

  function _buildMesh() {
    _ensureGeos();

    var root = new THREE.Group();

    // Body
    var body = new THREE.Mesh(_geoBody, _matUniform);
    body.position.y = 0;
    root.add(body);

    // Head
    var head = new THREE.Mesh(_geoHead, _matSkin);
    head.position.y = 0.75;
    root.add(head);

    // Vest (olive, sits over chest)
    var vest = new THREE.Mesh(_geoVest, _matVest);
    vest.position.set(0, 0.05, 0.02);
    root.add(vest);

    // LED strip across vest front
    var led = new THREE.Mesh(_geoLED, _matLED);
    led.position.set(0, 0.12, 0.185);
    root.add(led);

    // Second LED strip (lower)
    var led2 = new THREE.Mesh(_geoLED, _matLED);
    led2.position.set(0, -0.05, 0.185);
    root.add(led2);

    // Left arm (raised slightly)
    var armL = new THREE.Mesh(_geoArm, _matUniform);
    armL.position.set(-0.4, 0.1, 0);
    armL.rotation.z = -0.4;   // raised
    root.add(armL);

    // Right arm (raised, holds detonator)
    var armR = new THREE.Mesh(_geoArm, _matUniform);
    armR.position.set(0.4, 0.1, 0);
    armR.rotation.z = 0.4;    // raised
    root.add(armR);

    // Detonator in right hand
    var det = new THREE.Mesh(_geoDet, _matDet);
    det.position.set(0.42, -0.12, 0.08);
    root.add(det);

    // Red glow light (starts dim, intensifies in PRIMED)
    var glow = new THREE.PointLight(COLOR_LED, 0.3, 3);
    glow.position.set(0, 0.1, 0.25);
    root.add(glow);
    root._glow = glow;

    // HP bar (simple canvas texture plane — minimal version)
    root._hpBar  = null; // will be created on demand

    return root;
  }

  // ── Beep audio ────────────────────────────────────────────────────────────

  function _playBeep(bomber) {
    var now = performance.now() / 1000;
    if (now < (bomber._nextBeep || 0)) return;

    // Compute interval based on distance to player
    var dist = bomber._distToPlayer || DETECT_RANGE;
    var t    = 1 - Math.min(1, Math.max(0, (dist - PRIME_RANGE) / (DETECT_RANGE - PRIME_RANGE)));
    var interval = BEEP_INTERVAL_FAR + (BEEP_INTERVAL_NEAR - BEEP_INTERVAL_FAR) * t;

    bomber._nextBeep = now + interval;

    // Use AudioSystem's internal Web Audio context if available
    try {
      var AS = window.AudioSystem;
      if (!AS || !AS._ctx) {
        // Minimal fallback using raw Web Audio
        var ctx = (window._bomberAudioCtx = window._bomberAudioCtx ||
          new (window.AudioContext || window.webkitAudioContext)());
        if (ctx.state === 'suspended') ctx.resume();
        var osc  = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.frequency.value = BEEP_FREQ;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.09);
        return;
      }
      // AudioSystem exposes _ctx on some builds; try direct access
      if (typeof AS._ctx !== 'undefined') {
        var ctx2  = AS._ctx;
        if (ctx2.state === 'suspended') ctx2.resume();
        var osc2  = ctx2.createOscillator();
        var gain2 = ctx2.createGain();
        osc2.frequency.value = BEEP_FREQ;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.15, ctx2.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.08);
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        osc2.start(ctx2.currentTime);
        osc2.stop(ctx2.currentTime + 0.09);
      }
    } catch (e) { /* audio unavailable */ }
  }

  // ── Warning HUD ───────────────────────────────────────────────────────────

  function _createWarningEl() {
    if (_warningEl) return;
    _warningEl = document.createElement('div');
    _warningEl.id = 'sb-warning';
    _warningEl.style.cssText = [
      'position:fixed',
      'top:18%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff1111',
      'font-family:"Segoe UI",monospace,sans-serif',
      'font-size:15px',
      'font-weight:900',
      'letter-spacing:2px',
      'text-shadow:0 0 8px #ff0000,0 0 2px #000',
      'z-index:500',
      'pointer-events:none',
      'display:none',
      'text-align:center',
      'white-space:nowrap'
    ].join(';');
    _warningEl.textContent = '⚠️ SUICIDE BOMBER';
    document.body.appendChild(_warningEl);
  }

  function _showWarning(show) {
    if (!_warningEl) _createWarningEl();
    if (show === _warningShown) return;
    _warningShown = show;
    if (show) {
      _warningEl.style.display = 'block';
      // Flashing via CSS animation injected once
      if (!_warningEl._animated) {
        _warningEl._animated = true;
        var styleEl = document.createElement('style');
        styleEl.textContent = '@keyframes sb-flash{0%,100%{opacity:1}50%{opacity:0.1}}' +
          '#sb-warning{animation:sb-flash 0.45s infinite}';
        document.head.appendChild(styleEl);
      }
    } else {
      _warningEl.style.display = 'none';
    }
  }

  // ── Explosion VFX + damage ────────────────────────────────────────────────

  function _doExplosion(bomber, tiers) {
    if (!_scene) return;
    _ensureGeos();

    var pos = bomber.mesh.position;

    // Use Tracers.spawnExplosion for the main VFX
    if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
      Tracers.spawnExplosion(pos, tiers[0][1]);
    } else {
      // Fallback: manual flash light + camera shake
      var flash = new THREE.PointLight(0xFF4400, 20, 16);
      flash.position.copy(pos);
      _scene.add(flash);
      setTimeout(function () { _scene.remove(flash); flash.dispose ? flash.dispose() : null; }, 200);

      if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
        CameraSystem.shake(0.8, 0.5);
      }

      // 12 debris chunks
      for (var di = 0; di < 12; di++) {
        var dbMesh = new THREE.Mesh(_geoDebris, _matDebris);
        dbMesh.position.copy(pos);
        _scene.add(dbMesh);
        var dbVel = new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          Math.random() * 8 + 2,
          (Math.random() - 0.5) * 12
        );
        _particles.push({ mesh: dbMesh, vel: dbVel, life: 0.8, maxLife: 0.8, type: 'debris' });
      }

      // Smoke cloud
      var smokeMesh = new THREE.Mesh(_geoSmoke, _matSmoke.clone());
      smokeMesh.position.copy(pos);
      smokeMesh.position.y += 1;
      _scene.add(smokeMesh);
      _particles.push({ mesh: smokeMesh, vel: new THREE.Vector3(0, 0.5, 0), life: 2.0, maxLife: 2.0, type: 'smoke' });
    }

    // Apply damage to player through wave-event bridge
    var playerPos = null;
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getPlayer) {
        var pl = GameManager.getPlayer();
        if (pl && pl.position) playerPos = pl.position;
      }
    } catch (e2) {}

    if (playerPos && window._takeDamageFromWaveEvent) {
      var px = playerPos.x - pos.x;
      var py = playerPos.y - pos.y;
      var pz = playerPos.z - pos.z;
      var dist = Math.sqrt(px * px + py * py + pz * pz);

      for (var ti = 0; ti < tiers.length; ti++) {
        var dmg    = tiers[ti][0];
        var radius = tiers[ti][1];
        if (dist <= radius) {
          // Linear falloff within tier
          var falloff = Math.max(0, 1 - dist / radius);
          window._takeDamageFromWaveEvent(Math.round(dmg * falloff));
          break;
        }
      }
    }

    // Loud explosion audio
    try {
      if (window.AudioSystem && window.AudioSystem.playExplosion) {
        window.AudioSystem.playExplosion();
      }
    } catch (e3) {}
  }

  // ── Create / remove HP bar ────────────────────────────────────────────────

  function _updateHpBar(bomber) {
    // Minimal float label — reuse same approach as enemies.js (canvas texture plane)
    if (!bomber._hpBarMesh) {
      var canvas  = document.createElement('canvas');
      canvas.width = 64; canvas.height = 8;
      var tex = new THREE.CanvasTexture(canvas);
      var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false });
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.12), mat);
      mesh.position.y = 1.4;
      bomber.mesh.add(mesh);
      bomber._hpBarMesh   = mesh;
      bomber._hpBarCanvas = canvas;
      bomber._hpBarTex    = tex;
    }
    var ctx2  = bomber._hpBarCanvas.getContext('2d');
    var frac  = Math.max(0, bomber.hp / HP);
    ctx2.clearRect(0, 0, 64, 8);
    ctx2.fillStyle = '#000';
    ctx2.fillRect(0, 0, 64, 8);
    ctx2.fillStyle = frac > 0.5 ? '#22ff22' : frac > 0.25 ? '#ffaa00' : '#ff2222';
    ctx2.fillRect(1, 1, Math.round(frac * 62), 6);
    bomber._hpBarTex.needsUpdate = true;
  }

  // ── Per-bomber update (FSM) ───────────────────────────────────────────────

  function _updateBomber(bomber, playerPos, delta) {
    if (bomber.state === STATE_DEAD) return;

    var pos  = bomber.mesh.position;
    var dx   = playerPos.x - pos.x;
    var dz   = playerPos.z - pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    bomber._distToPlayer = dist;

    // ── Emergency fall detonate ────────────────────────────────────────────
    if (pos.y < FALL_THRESHOLD && bomber.state !== STATE_DETONATE && bomber.state !== STATE_DEAD) {
      bomber.state = STATE_DETONATE;
      _triggerDetonate(bomber, EXPL_TIERS_DEATH);
      return;
    }

    // ── FSM transitions ───────────────────────────────────────────────────
    if (bomber.state === STATE_IDLE) {
      if (dist <= DETECT_RANGE) {
        bomber.state = STATE_SPRINT;
      } else {
        _wander(bomber, delta);
      }
    }

    if (bomber.state === STATE_SPRINT) {
      _playBeep(bomber);
      _facePlayer(bomber, dx, dz);
      _moveToward(bomber, dx, dz, dist, SPRINT_SPEED, delta);

      if (dist <= PRIME_RANGE) {
        bomber.state = STATE_PRIMED;
        bomber._primeTimer = 1.0; // 1s countdown
        _setPrimed(bomber);
      } else if (dist <= DETONATE_RANGE) {
        // reached player — detonate immediately
        bomber.state = STATE_DETONATE;
        _triggerDetonate(bomber, EXPL_TIERS);
        return;
      }
    }

    if (bomber.state === STATE_PRIMED) {
      _playBeep(bomber);
      bomber._primeTimer -= delta;

      // Arms fully raised animation
      _animPrimed(bomber, bomber._primeTimer);

      if (dist <= DETONATE_RANGE || bomber._primeTimer <= 0) {
        bomber.state = STATE_DETONATE;
        _triggerDetonate(bomber, EXPL_TIERS);
        return;
      }
    }

    // HUD warning when in range
    _checkWarning(dist);

    // Billboard HP bar toward camera
    if (bomber._hpBarMesh) {
      var cam = null;
      try {
        if (typeof GameManager !== 'undefined' && GameManager.getCamera) {
          cam = GameManager.getCamera();
        }
      } catch (e4) {}
      if (cam) bomber._hpBarMesh.lookAt(cam.position);
    }
  }

  function _wander(bomber, delta) {
    if (!bomber._wanderTimer || bomber._wanderTimer <= 0) {
      bomber._wanderDir = new THREE.Vector3(
        (Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2
      ).normalize();
      bomber._wanderTimer = 1.5 + Math.random() * 2;
    }
    bomber._wanderTimer -= delta;
    var d = bomber._wanderDir;
    bomber.mesh.position.x += d.x * WANDER_SPEED * delta;
    bomber.mesh.position.z += d.z * WANDER_SPEED * delta;
    bomber.mesh.rotation.y = Math.atan2(d.x, d.z);
  }

  function _facePlayer(bomber, dx, dz) {
    bomber.mesh.rotation.y = Math.atan2(dx, dz);
  }

  function _moveToward(bomber, dx, dz, dist, speed, delta) {
    if (dist < 0.1) return;
    var nx = dx / dist;
    var nz = dz / dist;
    bomber.mesh.position.x += nx * speed * delta;
    bomber.mesh.position.z += nz * speed * delta;
    // Bob up/down slightly while running
    bomber.mesh.position.y += Math.sin(performance.now() / 120) * delta * 0.6;
  }

  function _setPrimed(bomber) {
    // Intensify glow
    if (bomber.mesh._glow) {
      bomber.mesh._glow.intensity = 2.0;
      bomber.mesh._glow.distance  = 6;
    }
  }

  function _animPrimed(bomber, timerLeft) {
    // Arms raised higher over countdown
    var t = 1 - Math.max(0, timerLeft);
    // Pulse glow rapidly
    if (bomber.mesh._glow) {
      bomber.mesh._glow.intensity = 2.0 + Math.sin(performance.now() / 60) * 1.5;
    }
  }

  function _checkWarning(nearestDist) {
    // Show warning if any bomber is within WARN_RANGE
    _showWarning(nearestDist <= WARN_RANGE);
  }

  function _triggerDetonate(bomber, tiers) {
    bomber.state = STATE_DEAD;
    _doExplosion(bomber, tiers);
    _removeBomber(bomber);

    // Scoring
    if (window.Economy && window.Economy.addScore) {
      var score = (tiers === EXPL_TIERS_DEATH) ? SCORE_KILL_BEFORE : SCORE_KILL_DURING;
      try { window.Economy.addScore(score); } catch (e5) {}
    }
    if (typeof HUD !== 'undefined' && HUD.addKill) {
      HUD.addKill('C4 VEST', 'SUICIDE BOMBER', false);
    }
  }

  function _removeBomber(bomber) {
    if (bomber._removed) return;
    bomber._removed = true;
    if (_scene && bomber.mesh) {
      _scene.remove(bomber.mesh);
      _disposeMesh(bomber.mesh);
    }
    // Remove from global list
    var idx = window._suicideBombers.indexOf(bomber);
    if (idx !== -1) window._suicideBombers.splice(idx, 1);
  }

  function _disposeMesh(obj) {
    if (!obj) return;
    if (obj.children && obj.children.length) {
      var children = obj.children.slice();
      for (var ci = 0; ci < children.length; ci++) {
        _disposeMesh(children[ci]);
      }
    }
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
    }
  }

  // ── Particle update (debris + smoke fallback VFX) ─────────────────────────

  function _updateParticles(delta) {
    for (var pi = _particles.length - 1; pi >= 0; pi--) {
      var p = _particles[pi];
      p.life -= delta;
      if (p.life <= 0) {
        if (_scene) _scene.remove(p.mesh);
        _disposeMesh(p.mesh);
        _particles.splice(pi, 1);
        continue;
      }
      var t2 = p.life / p.maxLife;
      p.mesh.position.x += p.vel.x * delta;
      p.mesh.position.y += p.vel.y * delta;
      p.mesh.position.z += p.vel.z * delta;
      if (p.type === 'debris') {
        p.vel.y -= 9.8 * delta;
        p.mesh.material.opacity = t2;
      } else if (p.type === 'smoke') {
        var s2 = 1 + (1 - t2) * 1.5;
        p.mesh.scale.setScalar(s2);
        p.mesh.material.opacity = t2 * 0.5;
      }
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init(scene) {
    _scene   = scene;
    _inited  = true;
    _createWarningEl();
    window._suicideBombers = window._suicideBombers || [];
  }

  /**
   * update(delta, playerPos)
   * Called each frame (e.g. from game-manager's render loop or
   * alongside Enemies.update).
   */
  function update(delta, playerPos) {
    if (!_inited || !_scene || !playerPos) return;

    _updateParticles(delta);

    var anyNear = false;
    var bombers = window._suicideBombers;
    for (var bi = bombers.length - 1; bi >= 0; bi--) {
      var bomber = bombers[bi];
      if (!bomber || bomber.state === STATE_DEAD || bomber._removed) {
        bombers.splice(bi, 1);
        continue;
      }
      _updateBomber(bomber, playerPos, delta);
      if (bomber._distToPlayer <= WARN_RANGE) anyNear = true;
    }
    // If no bombers in warning range, hide warning
    if (!anyNear) _showWarning(false);
  }

  /**
   * spawn(options)
   * options: { x, y, z }  – world position to spawn at
   * Returns the bomber object.
   */
  function spawn(options) {
    if (!_inited || !_scene) {
      console.warn('[EnemySuicideBomber] spawn() called before init()');
      return null;
    }
    options = options || {};

    var mesh = _buildMesh();
    mesh.position.set(
      options.x || 0,
      options.y != null ? options.y : 0,
      options.z || 0
    );
    // Resolve terrain height if VoxelWorld is available
    if (typeof window.VoxelWorld !== 'undefined' && window.VoxelWorld.getTerrainHeight) {
      try {
        var th = window.VoxelWorld.getTerrainHeight(mesh.position.x, mesh.position.z);
        if (typeof th === 'number' && isFinite(th)) {
          mesh.position.y = th;
        }
      } catch (et) {}
    }

    _scene.add(mesh);

    var bomber = {
      mesh:          mesh,
      hp:            HP,
      state:         STATE_IDLE,
      _distToPlayer: 999,
      _nextBeep:     0,
      _primeTimer:   0,
      _wanderTimer:  0,
      _wanderDir:    new THREE.Vector3(1, 0, 0),
      _removed:      false,
      _hpBarMesh:    null,
      _hpBarCanvas:  null,
      _hpBarTex:     null
    };

    _updateHpBar(bomber);
    window._suicideBombers.push(bomber);
    return bomber;
  }

  /**
   * hit(bomber, damage)
   * Call this when a projectile hits a suicide bomber.
   * Returns true if the bomber died.
   */
  function hit(bomber, damage) {
    if (!bomber || bomber.state === STATE_DEAD || bomber._removed) return false;

    bomber.hp -= (damage || 0);
    _updateHpBar(bomber);

    if (bomber.hp <= 0) {
      bomber.state = STATE_DETONATE;
      _triggerDetonate(bomber, EXPL_TIERS_DEATH);
      // Give score for shooting it
      if (window.Economy && window.Economy.addScore) {
        try { window.Economy.addScore(SCORE_KILL_BEFORE); } catch (e6) {}
      }
      return true;
    }
    return false;
  }

  /**
   * spawnForWave(waveNumber, playerPos)
   * Spawns 1–2 bombers on wave 7+. Called from game-manager or wave system.
   */
  function spawnForWave(waveNumber, playerPos) {
    if (waveNumber < 7) return;
    if (!_inited || !_scene) return;

    var count = (Math.random() < 0.5) ? 1 : 2;
    var baseX  = (playerPos && playerPos.x) || 0;
    var baseZ  = (playerPos && playerPos.z) || 0;

    for (var si = 0; si < count; si++) {
      var angle  = Math.random() * Math.PI * 2;
      var radius = 25 + Math.random() * 10;
      spawn({
        x: baseX + Math.cos(angle) * radius,
        z: baseZ + Math.sin(angle) * radius
      });
    }
  }

  /**
   * reset()
   * Remove all active bombers and clear state. Call on game reset / stage change.
   */
  function reset() {
    var bombers = window._suicideBombers;
    for (var ri = bombers.length - 1; ri >= 0; ri--) {
      _removeBomber(bombers[ri]);
    }
    bombers.length = 0;
    _particles.length = 0;
    _warningShown = false;
    _showWarning(false);
  }

  // ── Public surface ─────────────────────────────────────────────────────────
  return {
    init:         init,
    update:       update,
    spawn:        spawn,
    spawnForWave: spawnForWave,
    hit:          hit,
    reset:        reset
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail enemy-suicide-bomber.js",_e&&_e.message); }
/* === mounted-turret.js === */
try {
;
// ============================================================
//  mounted-turret.js — Static heavy machine gun player can man
//  Placement: 1-2 turrets per level at fixed strategic positions
//  Public API: init(scene, camera, controls), update(dt), interact(), reset()
// ============================================================
window.MountedTurret = (function () {
  'use strict';

  // ── Globals ───────────────────────────────────────────────
  window._mountedTurrets = [];
  window._playerMountedTurret = null;

  // ── Internal state ────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _controls = null;
  var _playerPos = null;   // reference updated via update()

  var SPAWN_POINTS = [
    { x: 15, y: 2, z: 0 },
    { x: -15, y: 2, z: 8 }
  ];

  var INTERACT_DIST = 2;
  var TURRET_HP_MAX = 150;
  var FIRE_DAMAGE = 55;
  var FIRE_RATE = 0.08;        // seconds between shots
  var OVERHEAT_SHOTS = 150;    // continuous shots before overheat
  var OVERHEAT_DURATION = 10;  // seconds overheated
  var COOLDOWN_DURATION = 5;   // seconds to cool after overheat
  var MAX_YAW = Math.PI / 3;   // ±60 degrees horizontal limit

  // HUD elements
  var _hudEl = null;
  var _hudBarEl = null;
  var _hudPctEl = null;
  var _dismountEl = null;

  // Mouse tracking for turret rotation
  var _mouseDeltaX = 0;
  var _mouseMoveHandler = null;
  var _keyDownHandler = null;
  var _fireLoopHandle = null;

  // ── Material cache ────────────────────────────────────────
  var _matSandbag = null;
  var _matMgBody = null;
  var _matBarrel = null;
  var _matAmmoBelt = null;
  var _matBipod = null;
  var _matShield = null;
  var _matTracer = null;

  function _getMats() {
    if (!_matSandbag) {
      _matSandbag  = new THREE.MeshLambertMaterial({ color: 0xC8A060 });
      _matMgBody   = new THREE.MeshLambertMaterial({ color: 0x333333 });
      _matBarrel   = new THREE.MeshLambertMaterial({ color: 0x222222 });
      _matAmmoBelt = new THREE.MeshLambertMaterial({ color: 0xAA8833 });
      _matBipod    = new THREE.MeshLambertMaterial({ color: 0x444444 });
      _matShield   = new THREE.MeshLambertMaterial({ color: 0x555566 });
      _matTracer   = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    }
  }

  // ── Build turret mesh ──────────────────────────────────────
  function _buildTurretMesh() {
    _getMats();
    var root = new THREE.Group();

    // --- Sandbag base: 3 BoxGeometry(1,0.4,0.6) in U-shape ---
    var sbGeo = new THREE.BoxGeometry(1, 0.4, 0.6);
    // Center back
    var sb0 = new THREE.Mesh(sbGeo, _matSandbag);
    sb0.position.set(0, 0, 0.5);
    root.add(sb0);
    // Left arm
    var sb1 = new THREE.Mesh(sbGeo, _matSandbag);
    sb1.position.set(-0.65, 0, -0.1);
    sb1.rotation.y = Math.PI / 2;
    root.add(sb1);
    // Right arm
    var sb2 = new THREE.Mesh(sbGeo, _matSandbag);
    sb2.position.set(0.65, 0, -0.1);
    sb2.rotation.y = Math.PI / 2;
    root.add(sb2);

    // --- Pivot group (rotates with mouse) ---
    var pivot = new THREE.Group();
    pivot.position.set(0, 0.5, 0);
    root.add(pivot);

    // MG body: BoxGeometry(0.3, 0.25, 1.2)
    var mgGeo = new THREE.BoxGeometry(0.3, 0.25, 1.2);
    var mgBody = new THREE.Mesh(mgGeo, _matMgBody);
    mgBody.position.set(0, 0, -0.1);
    pivot.add(mgBody);

    // Barrel: CylinderGeometry(0.06, 0.06, 0.8) protruding forward (negative Z)
    var barrelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 10);
    var barrel = new THREE.Mesh(barrelGeo, _matBarrel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, -0.85);
    pivot.add(barrel);

    // Ammo belt: looping CylinderGeometry(0.04) segments hanging from receiver
    var beltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 6);
    for (var bi = 0; bi < 6; bi++) {
      var beltSeg = new THREE.Mesh(beltGeo, _matAmmoBelt);
      beltSeg.position.set(
        0.2 + bi * 0.06,
        -0.12 - bi * 0.04,
        0.1
      );
      beltSeg.rotation.z = 0.3 + bi * 0.08;
      pivot.add(beltSeg);
    }

    // Bipod legs: two thin rods angling down
    var legGeo = new THREE.BoxGeometry(0.04, 0.55, 0.04);
    var leg1 = new THREE.Mesh(legGeo, _matBipod);
    leg1.position.set(-0.12, -0.27, -0.55);
    leg1.rotation.z = 0.25;
    pivot.add(leg1);
    var leg2 = new THREE.Mesh(legGeo, _matBipod);
    leg2.position.set(0.12, -0.27, -0.55);
    leg2.rotation.z = -0.25;
    pivot.add(leg2);

    // HMG shield: BoxGeometry(0.8, 0.6, 0.05) in front
    var shieldGeo = new THREE.BoxGeometry(0.8, 0.6, 0.05);
    var shield = new THREE.Mesh(shieldGeo, _matShield);
    shield.position.set(0, 0.05, -0.45);
    // Vision slit (thin dark box cut across upper third)
    var slitGeo = new THREE.BoxGeometry(0.5, 0.06, 0.06);
    var slitMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    var slit = new THREE.Mesh(slitGeo, slitMat);
    slit.position.set(0, 0.13, 0);
    shield.add(slit);
    pivot.add(shield);

    return { root: root, pivot: pivot };
  }

  // ── Spawn all turrets ─────────────────────────────────────
  function _spawnTurrets() {
    window._mountedTurrets = [];
    for (var i = 0; i < SPAWN_POINTS.length; i++) {
      var sp = SPAWN_POINTS[i];
      var meshData = _buildTurretMesh();
      meshData.root.position.set(sp.x, sp.y, sp.z);
      _scene.add(meshData.root);

      var turret = {
        mesh: meshData.root,
        pivot: meshData.pivot,
        baseYaw: 0,           // current yaw offset from base direction
        hp: TURRET_HP_MAX,
        manned: false,
        fireCooldown: 0,
        shotCount: 0,
        overheatTimer: 0,
        coolTimer: 0,
        isOverheated: false,
        position: new THREE.Vector3(sp.x, sp.y, sp.z),
        active: true,
        tracers: []
      };
      window._mountedTurrets.push(turret);
    }
  }

  // ── HUD ───────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'turret-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'border:1px solid #ff8800',
      'border-radius:6px',
      'padding:8px 18px',
      'color:#fff',
      'font-family:monospace',
      'font-size:13px',
      'z-index:500',
      'display:none',
      'text-align:center',
      'min-width:220px'
    ].join(';');

    _hudEl.innerHTML = [
      '<div style="color:#ff8800;font-weight:bold;letter-spacing:2px;margin-bottom:4px">&#9711; TURRET</div>',
      '<div style="font-size:11px;color:#aaa;margin-bottom:6px">OVERHEAT</div>',
      '<div style="background:#222;border:1px solid #555;border-radius:3px;height:10px;width:180px;margin:0 auto 6px">',
      '  <div id="turret-overheat-bar" style="height:100%;width:0%;background:#ff4400;border-radius:3px;transition:width 0.1s"></div>',
      '</div>',
      '<div id="turret-overheat-pct" style="font-size:11px;color:#ff8800;margin-bottom:4px">0%</div>',
      '<div id="turret-dismount-hint" style="font-size:11px;color:#aaa">E: DISMOUNT</div>'
    ].join('');

    document.body.appendChild(_hudEl);
    _hudBarEl  = document.getElementById('turret-overheat-bar');
    _hudPctEl  = document.getElementById('turret-overheat-pct');
    _dismountEl = document.getElementById('turret-dismount-hint');
  }

  function _showHUD(show) {
    if (_hudEl) _hudEl.style.display = show ? 'block' : 'none';
  }

  function _updateHUDBar(pct) {
    if (!_hudBarEl) return;
    var p = Math.max(0, Math.min(100, pct));
    _hudBarEl.style.width = p + '%';
    _hudBarEl.style.background = p > 80 ? '#ff0000' : '#ff4400';
    if (_hudPctEl) _hudPctEl.textContent = Math.round(p) + '%';
  }

  // ── Interaction prompt ────────────────────────────────────
  var _promptEl = null;
  function _showPrompt(show, turret) {
    if (!_promptEl) {
      _promptEl = document.createElement('div');
      _promptEl.id = 'turret-interact-prompt';
      _promptEl.style.cssText = [
        'position:fixed',
        'bottom:140px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.65)',
        'border:1px solid #aaa',
        'border-radius:4px',
        'padding:5px 14px',
        'color:#fff',
        'font-family:monospace',
        'font-size:12px',
        'z-index:500',
        'display:none',
        'pointer-events:none'
      ].join(';');
      _promptEl.textContent = '[E] MAN TURRET';
      document.body.appendChild(_promptEl);
    }
    _promptEl.style.display = (show && turret && turret.hp > 0) ? 'block' : 'none';
  }

  // ── Man / dismount ────────────────────────────────────────
  function _manTurret(turret) {
    if (turret.manned || !turret.active || turret.hp <= 0) return;
    turret.manned = true;
    window._playerMountedTurret = turret;

    // Lock player movement — disable PointerLockControls movement
    if (_controls && typeof _controls.lock === 'function') {
      // Keep pointer lock but block movement via flag
    }
    window._turretManning = true;

    // Listen to mouse X for yaw
    _mouseDeltaX = 0;
    _mouseMoveHandler = function (e) {
      if (!window._playerMountedTurret) return;
      _mouseDeltaX += e.movementX || 0;
    };
    window.addEventListener('mousemove', _mouseMoveHandler);

    // E key to dismount; also fire on mousedown while manned
    _keyDownHandler = function (e) {
      if (e.code === 'KeyE') {
        _dismountTurret(turret);
      }
    };
    window.addEventListener('keydown', _keyDownHandler);

    _showHUD(true);
    _showPrompt(false);
    console.log('[MountedTurret] Player manned turret');
  }

  function _dismountTurret(turret) {
    if (!turret || !turret.manned) return;
    turret.manned = false;
    window._playerMountedTurret = null;
    window._turretManning = false;

    if (_mouseMoveHandler) {
      window.removeEventListener('mousemove', _mouseMoveHandler);
      _mouseMoveHandler = null;
    }
    if (_keyDownHandler) {
      window.removeEventListener('keydown', _keyDownHandler);
      _keyDownHandler = null;
    }

    _showHUD(false);
    console.log('[MountedTurret] Player dismounted turret');
  }

  // ── Fire tracer round ─────────────────────────────────────
  function _fireTracer(turret) {
    if (!_scene) return;
    var pivot = turret.pivot;
    // World direction turret faces (negative Z in local space)
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(pivot.getWorldQuaternion(new THREE.Quaternion()));

    var startPos = new THREE.Vector3();
    pivot.getWorldPosition(startPos);
    startPos.addScaledVector(dir, 0.9); // start at barrel tip

    var tracerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
    var tracer = new THREE.Mesh(tracerGeo, _matTracer);
    tracer.position.copy(startPos);
    tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    _scene.add(tracer);

    turret.tracers.push({
      mesh: tracer,
      dir: dir.clone(),
      speed: 80,
      life: 0.4
    });

    // Camera shake
    if (_camera) {
      var shakeAmt = 0.05;
      _camera.position.x += (Math.random() - 0.5) * shakeAmt;
      _camera.position.y += (Math.random() - 0.5) * shakeAmt;
    }

    // Audio
    if (window.AudioSystem && typeof window.AudioSystem.playGunshot === 'function') {
      window.AudioSystem.playGunshot();
    }

    // Hit detection — simple raycast
    var raycaster = new THREE.Raycaster(startPos, dir, 0, 120);
    var hits = [];
    if (window._enemies && Array.isArray(window._enemies)) {
      for (var ei = 0; ei < window._enemies.length; ei++) {
        var enemy = window._enemies[ei];
        if (enemy && enemy.mesh && enemy.hp > 0) {
          hits.push(enemy.mesh);
        }
      }
    }
    if (hits.length > 0) {
      var intersects = raycaster.intersectObjects(hits, true);
      if (intersects.length > 0) {
        var hitObj = intersects[0].object;
        // Walk up to find enemy
        for (var ei2 = 0; ei2 < window._enemies.length; ei2++) {
          var en = window._enemies[ei2];
          if (en && en.mesh && (hitObj === en.mesh || en.mesh.getObjectById(hitObj.id))) {
            en.hp -= FIRE_DAMAGE;
            if (window.AudioSystem && typeof window.AudioSystem.playHit === 'function') {
              window.AudioSystem.playHit();
            }
            break;
          }
        }
      }
    }
  }

  // ── Turret death explosion ────────────────────────────────
  function _explodeTurret(turret) {
    if (!_scene || !turret.active) return;
    turret.active = false;
    _scene.remove(turret.mesh);

    // Simple flash sphere
    var expGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var expMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
    var expMesh = new THREE.Mesh(expGeo, expMat);
    expMesh.position.copy(turret.position);
    _scene.add(expMesh);

    var startTime = performance.now();
    function fadeOut() {
      var elapsed = (performance.now() - startTime) / 1000;
      if (elapsed > 0.5) {
        _scene.remove(expMesh);
        return;
      }
      expMat.opacity = 0.9 * (1 - elapsed / 0.5);
      expMesh.scale.setScalar(1 + elapsed * 3);
      requestAnimationFrame(fadeOut);
    }
    fadeOut();

    if (window.AudioSystem && typeof window.AudioSystem.playExplosion === 'function') {
      window.AudioSystem.playExplosion();
    }

    if (turret.manned) {
      _dismountTurret(turret);
    }
  }

  // ── Public: interact (E key from game-manager or player) ──
  function interact() {
    // If already manned, dismount
    if (window._playerMountedTurret) {
      _dismountTurret(window._playerMountedTurret);
      return;
    }
    // Find nearest turret within range
    if (!window._mountedTurrets || !_camera) return;
    var playerPos = _camera.position;
    for (var i = 0; i < window._mountedTurrets.length; i++) {
      var t = window._mountedTurrets[i];
      if (!t.active || t.hp <= 0) continue;
      var dist = playerPos.distanceTo(t.position);
      if (dist <= INTERACT_DIST) {
        _manTurret(t);
        return;
      }
    }
  }

  // ── Public: update (dt in seconds) ────────────────────────
  function update(dt) {
    if (!_scene || !window._mountedTurrets) return;
    var playerPos = _camera ? _camera.position : null;

    // Check proximity for interact prompt
    var nearTurret = null;
    if (playerPos && !window._playerMountedTurret) {
      for (var i = 0; i < window._mountedTurrets.length; i++) {
        var t0 = window._mountedTurrets[i];
        if (!t0.active || t0.hp <= 0) continue;
        if (playerPos.distanceTo(t0.position) <= INTERACT_DIST) {
          nearTurret = t0;
          break;
        }
      }
    }
    _showPrompt(!!nearTurret, nearTurret);

    // Update each turret
    for (var j = 0; j < window._mountedTurrets.length; j++) {
      var turret = window._mountedTurrets[j];
      if (!turret.active) continue;

      // Update tracers
      for (var ti = turret.tracers.length - 1; ti >= 0; ti--) {
        var tr = turret.tracers[ti];
        tr.life -= dt;
        if (tr.life <= 0) {
          _scene.remove(tr.mesh);
          turret.tracers.splice(ti, 1);
        } else {
          tr.mesh.position.addScaledVector(tr.dir, tr.speed * dt);
        }
      }

      if (!turret.manned) continue;

      // Rotate pivot with mouse delta
      if (_mouseDeltaX !== 0) {
        var sensitivity = 0.003;
        turret.baseYaw -= _mouseDeltaX * sensitivity;
        // Clamp to ±60°
        turret.baseYaw = Math.max(-MAX_YAW, Math.min(MAX_YAW, turret.baseYaw));
        turret.pivot.rotation.y = turret.baseYaw;
        _mouseDeltaX = 0;
      }

      // Overheat logic
      if (turret.isOverheated) {
        turret.overheatTimer -= dt;
        if (turret.overheatTimer <= 0) {
          turret.isOverheated = false;
          turret.overheatTimer = 0;
          turret.coolTimer = COOLDOWN_DURATION;
          turret.shotCount = 0;
        }
        _updateHUDBar(100);
        continue; // cannot fire while overheated
      }

      // Cooling down after overheat
      if (turret.coolTimer > 0) {
        turret.coolTimer -= dt;
        var coolPct = (1 - turret.coolTimer / COOLDOWN_DURATION) * 0; // bar goes to 0
        _updateHUDBar(turret.coolTimer / COOLDOWN_DURATION * 100);
        if (turret.coolTimer <= 0) turret.coolTimer = 0;
      } else {
        // Normal heat display proportional to shot count
        _updateHUDBar((turret.shotCount / OVERHEAT_SHOTS) * 100);
      }

      // Auto-fire while mouse is held (check global flag set by game-manager or mousedown)
      var isFiring = window._turretFiring === true;
      if (isFiring) {
        turret.fireCooldown -= dt;
        if (turret.fireCooldown <= 0) {
          turret.fireCooldown = FIRE_RATE;
          _fireTracer(turret);
          turret.shotCount++;
          if (turret.shotCount >= OVERHEAT_SHOTS) {
            turret.isOverheated = true;
            turret.overheatTimer = OVERHEAT_DURATION;
          }
        }
      } else {
        // Passive cool-down when not firing
        if (turret.shotCount > 0 && turret.coolTimer <= 0) {
          turret.shotCount = Math.max(0, turret.shotCount - dt * 15);
        }
        turret.fireCooldown = 0;
      }

      // Dismount if player moved too far (camera drifted away while manned)
      if (playerPos && playerPos.distanceTo(turret.position) > INTERACT_DIST + 1.5) {
        _dismountTurret(turret);
      }
    }
  }

  // ── Damage a turret (callable by enemy AI) ────────────────
  function damageTurret(turret, amount) {
    if (!turret || !turret.active) return;
    turret.hp -= amount;
    if (turret.hp <= 0) {
      turret.hp = 0;
      _explodeTurret(turret);
    }
  }
  window._damageMountedTurret = damageTurret;

  // ── Public: init ──────────────────────────────────────────
  function init(scene, camera, controls) {
    _scene    = scene;
    _camera   = camera;
    _controls = controls;

    window._mountedTurrets = [];
    window._playerMountedTurret = null;
    window._turretManning = false;
    window._turretFiring  = false;

    _getMats();
    _createHUD();
    _spawnTurrets();

    // Listen for mousedown/up to set fire flag while manned
    window.addEventListener('mousedown', function (e) {
      if (e.button === 0 && window._playerMountedTurret) {
        window._turretFiring = true;
      }
    });
    window.addEventListener('mouseup', function (e) {
      if (e.button === 0) {
        window._turretFiring = false;
      }
    });

    console.log('[MountedTurret] init — ' + window._mountedTurrets.length + ' turret(s) spawned');
  }

  // ── Public: reset (call between levels) ───────────────────
  function reset() {
    // Dismount if manned
    if (window._playerMountedTurret) {
      _dismountTurret(window._playerMountedTurret);
    }

    // Remove old meshes
    if (_scene && window._mountedTurrets) {
      for (var i = 0; i < window._mountedTurrets.length; i++) {
        var t = window._mountedTurrets[i];
        if (t.mesh) _scene.remove(t.mesh);
        // Remove any stray tracers
        for (var ti = 0; ti < t.tracers.length; ti++) {
          _scene.remove(t.tracers[ti].mesh);
        }
      }
    }

    window._mountedTurrets = [];
    window._playerMountedTurret = null;
    window._turretManning = false;
    window._turretFiring  = false;

    if (_scene) {
      _spawnTurrets();
      console.log('[MountedTurret] reset — ' + window._mountedTurrets.length + ' turret(s) respawned');
    }
  }

  // ── Expose API ────────────────────────────────────────────
  return {
    init: init,
    update: update,
    interact: interact,
    reset: reset
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail mounted-turret.js",_e&&_e.message); }
/* === vehicle-turret.js === */
try {
;
// ============================================================
//  vehicle-turret.js — Vehicle-mounted turret system for Three.js FPS
//  Player can mount a tank-style turret on a vehicle hull.
//  Public API: init, update, spawn, mount, dismount, reset
// ============================================================
window.VehicleTurret = (function () {
  'use strict';

  // ── Module-level globals ──────────────────────────────────
  window._vehicleTurrets = [];
  window._playerMountedVehicleTurret = null;

  // ── Internal state ────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _controls = null;

  // Constants
  var MOUNT_DIST       = 3;       // metres to press F and mount
  var TURRET_HP_MAX    = 800;
  var SHELL_SPEED      = 120;     // m/s
  var SHELL_RELOAD     = 3.0;     // seconds
  var MG_RPM           = 800;
  var MG_BELT_MAX      = 500;
  var MG_DMG           = 20;
  var MG_TRACER_EVERY  = 5;
  var BARREL_ELEV_MIN  = -10 * Math.PI / 180;  // -10°
  var BARREL_ELEV_MAX  =  20 * Math.PI / 180;  // +20°
  var SCREEN_SHAKE_DUR = 0.25;   // seconds

  // Ammo types: [name, damage, blastRadius, speed]
  var AMMO_TYPES = [
    { name: 'APFSDS', dmg: 500, blast: 0.5,  speed: 180, color: 0xCCCCDD },
    { name: 'HEAT',   dmg: 300, blast: 8.0,  speed: 130, color: 0xFFAA00 },
    { name: 'HE',     dmg: 200, blast: 12.0, speed: 110, color: 0xFF4400 }
  ];

  // ── Material cache ────────────────────────────────────────
  var _matHull      = null;
  var _matRing      = null;
  var _matCannon    = null;
  var _matMantlet   = null;
  var _matCupola    = null;
  var _matShell     = null;
  var _matTracer    = null;
  var _matSmoke     = null;
  var _matFlash     = null;
  var _matFire      = null;
  var _matDestroyed = null;

  function _initMats() {
    if (_matHull) return;
    _matHull      = new THREE.MeshLambertMaterial({ color: 0x2D4A1E }); // dark military green
    _matRing      = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
    _matCannon    = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    _matMantlet   = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
    _matCupola    = new THREE.MeshLambertMaterial({ color: 0x3D3D2A });
    _matShell     = new THREE.MeshLambertMaterial({ color: 0xFFDD00 });
    _matTracer    = new THREE.MeshBasicMaterial ({ color: 0xFF8800, transparent: true, opacity: 0.9 });
    _matSmoke     = new THREE.MeshBasicMaterial ({ color: 0x888888, transparent: true, opacity: 0.4 });
    _matFlash     = new THREE.MeshBasicMaterial ({ color: 0xFFFFAA, transparent: true, opacity: 0.95 });
    _matFire      = new THREE.MeshBasicMaterial ({ color: 0xFF6600, transparent: true, opacity: 0.75 });
    _matDestroyed = new THREE.MeshLambertMaterial({ color: 0x111111 });
  }

  // ── Build full turret mesh ────────────────────────────────
  function _buildTurretGroup() {
    _initMats();
    var root = new THREE.Group();

    // --- Base hull: BoxGeometry(5×1.5×2.5) ---
    var hullGeo  = new THREE.BoxGeometry(5, 1.5, 2.5);
    var hullMesh = new THREE.Mesh(hullGeo, _matHull);
    hullMesh.position.set(0, 0, 0);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    root.add(hullMesh);

    // --- Turret ring: CylinderGeometry(0.8r, 0.9r, 0.4h) ---
    var ringGeo  = new THREE.CylinderGeometry(0.8, 0.9, 0.4, 16);
    var ringMesh = new THREE.Mesh(ringGeo, _matRing);
    ringMesh.position.set(0, 1.0, 0); // sits on top of hull
    root.add(ringMesh);

    // --- Turret rotating group (ring + mantlet + cannon + cupola) ---
    var turretGroup = new THREE.Group();
    turretGroup.position.set(0, 1.0, 0);
    root.add(turretGroup);

    // Inner ring cap
    var ringCapGeo  = new THREE.CylinderGeometry(0.78, 0.78, 0.1, 16);
    var ringCapMesh = new THREE.Mesh(ringCapGeo, _matRing);
    ringCapMesh.position.set(0, 0.25, 0);
    turretGroup.add(ringCapMesh);

    // --- Gun mantlet: BoxGeometry(1.2×0.7×0.6) angled slightly ---
    var mantletGeo  = new THREE.BoxGeometry(1.2, 0.7, 0.6);
    var mantletMesh = new THREE.Mesh(mantletGeo, _matMantlet);
    mantletMesh.position.set(0, 0.3, -0.9);
    mantletMesh.rotation.x = -0.12; // slight forward tilt
    turretGroup.add(mantletMesh);

    // --- Barrel elevation group (pivots on mantlet) ---
    var barrelGroup = new THREE.Group();
    barrelGroup.position.set(0, 0.3, -0.9);
    turretGroup.add(barrelGroup);

    // --- Main cannon: CylinderGeometry(0.12r, 0.15r, 3.0h) pointing forward ---
    // Three.js cylinders are vertical by default; rotate to point forward (along -Z)
    var cannonGeo  = new THREE.CylinderGeometry(0.12, 0.15, 3.0, 10);
    var cannonMesh = new THREE.Mesh(cannonGeo, _matCannon);
    cannonMesh.rotation.x = Math.PI / 2;   // point along -Z
    cannonMesh.position.set(0, 0, -1.5);   // extend forward from pivot
    barrelGroup.add(cannonMesh);

    // Muzzle brake cap
    var muzzleGeo  = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 8);
    var muzzleMesh = new THREE.Mesh(muzzleGeo, _matCannon);
    muzzleMesh.rotation.x = Math.PI / 2;
    muzzleMesh.position.set(0, 0, -3.05);
    barrelGroup.add(muzzleMesh);

    // Coaxial MG barrel (thinner, next to main cannon)
    var coaxGeo  = new THREE.CylinderGeometry(0.04, 0.05, 1.8, 6);
    var coaxMesh = new THREE.Mesh(coaxGeo, _matCannon);
    coaxMesh.rotation.x = Math.PI / 2;
    coaxMesh.position.set(0.22, -0.18, -0.9);
    barrelGroup.add(coaxMesh);

    // --- Commander's cupola: small cylinder on top of ring ---
    var cupolaGeo  = new THREE.CylinderGeometry(0.28, 0.32, 0.35, 12);
    var cupolaMesh = new THREE.Mesh(cupolaGeo, _matCupola);
    cupolaMesh.position.set(0.3, 0.65, 0.3);
    turretGroup.add(cupolaMesh);

    // Cupola hatch lid
    var hatchGeo  = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 10);
    var hatchMesh = new THREE.Mesh(hatchGeo, _matCannon);
    hatchMesh.position.set(0.3, 0.87, 0.3);
    turretGroup.add(hatchMesh);

    // --- Muzzle flash placeholder (hidden by default) ---
    var flashGeo  = new THREE.SphereGeometry(0.35, 6, 6);
    var flashMesh = new THREE.Mesh(flashGeo, _matFlash);
    flashMesh.position.set(0, 0, -3.1);
    flashMesh.visible = false;
    barrelGroup.add(flashMesh);

    return {
      root:          root,
      turretGroup:   turretGroup,
      barrelGroup:   barrelGroup,
      hullMesh:      hullMesh,
      cannonMesh:    cannonMesh,
      flashMesh:     flashMesh,
      muzzleWorldPos: new THREE.Vector3()
    };
  }

  // ── HUD ───────────────────────────────────────────────────
  var _hud = null;

  function _createHUD() {
    if (_hud) return;
    var el = document.createElement('div');
    el.id = 'vt-hud';
    el.style.cssText = [
      'display:none',
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.75)',
      'border:1px solid #2a6a2a',
      'color:#aaffaa',
      'font-family:monospace',
      'font-size:12px',
      'padding:8px 18px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:300',
      'text-align:center',
      'min-width:220px'
    ].join(';');
    document.body.appendChild(el);
    _hud = el;
  }

  function _updateHUD(t) {
    if (!_hud) return;
    if (!t || !t.mounted) {
      _hud.style.display = 'none';
      return;
    }
    _hud.style.display = 'block';
    var ammo   = AMMO_TYPES[t.ammoIdx];
    var reload = t.shellReloadTimer > 0 ? ' [RELOADING ' + t.shellReloadTimer.toFixed(1) + 's]' : ' [READY]';
    var mgStr  = 'MG ' + t.mgBelt + '/' + MG_BELT_MAX;
    var hpPct  = Math.max(0, Math.round(t.hp / TURRET_HP_MAX * 100));
    var dest   = t.destroyed ? ' <span style="color:#ff4444">DESTROYED</span>' : '';
    _hud.innerHTML =
      '<b>VEHICLE TURRET</b> ' + dest + '<br>' +
      'ROUND: <span style="color:#ffdd88">' + ammo.name + '</span>' + reload + '<br>' +
      mgStr + ' | HP: <span style="color:' + (hpPct < 25 ? '#ff4444' : '#aaffaa') + '">' + hpPct + '%</span><br>' +
      '<span style="color:#888">[A/D] Rotate &nbsp; [W/S] Elevate &nbsp; [Q] Ammo &nbsp; [E] Exit</span>';
  }

  // ── Muzzle smoke particles ────────────────────────────────
  function _spawnMuzzleSmoke(scene, pos) {
    _initMats();
    var count = 6;
    for (var i = 0; i < count; i++) {
      var geo  = new THREE.SphereGeometry(0.18 + Math.random() * 0.18, 5, 5);
      var mat  = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      var vx = (Math.random() - 0.5) * 1.5;
      var vy = 1.2 + Math.random() * 1.5;
      var vz = (Math.random() - 0.5) * 1.5;
      var life = 0.6 + Math.random() * 0.6;
      (function (m, dvx, dvy, dvz, maxLife) {
        var elapsed = 0;
        var ticker = setInterval(function () {
          elapsed += 0.05;
          if (elapsed >= maxLife) {
            clearInterval(ticker);
            scene.remove(m);
            m.geometry.dispose();
            m.material.dispose();
            return;
          }
          m.position.x += dvx * 0.05;
          m.position.y += dvy * 0.05;
          m.position.z += dvz * 0.05;
          m.material.opacity = 0.5 * (1 - elapsed / maxLife);
          m.scale.setScalar(1 + elapsed * 2);
        }, 50);
      })(mesh, vx, vy, vz, life);
    }
  }

  // ── Screen shake ──────────────────────────────────────────
  var _shakeTime = 0;
  var _shakeAmt  = 0;

  function _triggerScreenShake(amount, duration) {
    _shakeAmt  = amount;
    _shakeTime = duration || SCREEN_SHAKE_DUR;
  }

  function _applyScreenShake(dt) {
    if (!_camera || _shakeTime <= 0) return;
    _shakeTime -= dt;
    var s = _shakeAmt * (_shakeTime / SCREEN_SHAKE_DUR);
    _camera.position.x += (Math.random() - 0.5) * s;
    _camera.position.y += (Math.random() - 0.5) * s;
    if (_shakeTime <= 0) {
      _shakeTime = 0;
    }
  }

  // ── Projectile pool ───────────────────────────────────────
  var _projectiles = [];

  function _fireMainGun(t) {
    if (!t || t.destroyed) return;
    if (t.shellReloadTimer > 0) return;

    var ammo = AMMO_TYPES[t.ammoIdx];
    t.shellReloadTimer = SHELL_RELOAD;

    // Muzzle world position
    var muzzleLocal = new THREE.Vector3(0, 0, -3.1);
    t.barrelGroup.localToWorld(muzzleLocal);

    // Fire direction: barrel group's -Z axis in world space
    var dir = new THREE.Vector3(0, 0, -1);
    t.barrelGroup.getWorldQuaternion(_tmpQ);
    dir.applyQuaternion(_tmpQ);
    dir.normalize();

    // Muzzle flash
    t.flashMesh.visible = true;
    setTimeout(function () { if (t.flashMesh) t.flashMesh.visible = false; }, 80);

    // Muzzle smoke
    _spawnMuzzleSmoke(_scene, muzzleLocal);

    // Screen shake
    _triggerScreenShake(0.15, SCREEN_SHAKE_DUR);

    // Audio
    if (window.AudioSystem && AudioSystem.playTankCannon) {
      AudioSystem.playTankCannon();
    }

    // Projectile sphere
    var geo  = new THREE.SphereGeometry(0.12, 6, 6);
    var mat  = new THREE.MeshBasicMaterial({ color: ammo.color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(muzzleLocal);
    _scene.add(mesh);

    _projectiles.push({
      mesh:     mesh,
      dir:      dir,
      speed:    ammo.speed,
      dmg:      ammo.dmg,
      blast:    ammo.blast,
      life:     4.0,
      isShell:  true
    });
  }

  var _mgTimer    = 0;
  var _mgFiring   = false;
  var _mgRoundCnt = 0;
  var _tmpQ       = new THREE.Quaternion();
  var _tmpV       = new THREE.Vector3();

  function _fireCoaxMG(t, dt) {
    if (!t || t.destroyed) return;
    if (t.mgBelt <= 0) return;

    _mgTimer -= dt;
    if (_mgTimer > 0) return;
    _mgTimer = 60 / MG_RPM;

    t.mgBelt = Math.max(0, t.mgBelt - 1);
    _mgRoundCnt++;

    // Coax muzzle world position (offset from barrel)
    var coaxLocal = new THREE.Vector3(0.22, -0.18, -1.85);
    t.barrelGroup.localToWorld(coaxLocal);

    // Direction with slight random spread
    var dir = new THREE.Vector3(0, 0, -1);
    t.barrelGroup.getWorldQuaternion(_tmpQ);
    dir.applyQuaternion(_tmpQ);
    dir.x += (Math.random() - 0.5) * 0.02;
    dir.y += (Math.random() - 0.5) * 0.02;
    dir.normalize();

    // Tracer every 5th round
    if (_mgRoundCnt % MG_TRACER_EVERY === 0) {
      var tGeo  = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4);
      var tMat  = new THREE.MeshBasicMaterial({ color: 0xFF8800 });
      var tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.copy(coaxLocal);
      // Align tracer to direction
      tMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      _scene.add(tMesh);
      _projectiles.push({
        mesh:    tMesh,
        dir:     dir,
        speed:   400,
        dmg:     MG_DMG,
        blast:   0.3,
        life:    0.5,
        isShell: false
      });
    }

    // Hitscan damage to nearest enemy in direction
    _doHitscanDmg(coaxLocal, dir, MG_DMG);

    // Audio
    if (window.AudioSystem && AudioSystem.playGunshot) {
      AudioSystem.playGunshot();
    }
  }

  function _doHitscanDmg(origin, dir, dmg) {
    if (!window._enemies) return;
    var best = null;
    var bestDist = 200;
    for (var i = 0; i < window._enemies.length; i++) {
      var e = window._enemies[i];
      if (!e || !e.mesh) continue;
      var toE = new THREE.Vector3().subVectors(e.mesh.position, origin);
      var dist = toE.length();
      if (dist > 200) continue;
      toE.normalize();
      var dot = toE.dot(dir);
      if (dot > 0.97 && dist < bestDist) {
        best = e;
        bestDist = dist;
      }
    }
    if (best && best.takeDamage) {
      best.takeDamage(dmg);
    }
  }

  // ── Explosion ─────────────────────────────────────────────
  function _doExplosion(pos, radius, dmg, scene) {
    if (!scene) return;
    // Flash sphere
    var geo  = new THREE.SphereGeometry(radius * 0.5, 8, 8);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xFF8800, transparent: true, opacity: 0.8 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);

    // Point light
    var light = new THREE.PointLight(0xFF6600, 4, radius * 3);
    light.position.copy(pos);
    scene.add(light);

    // Fade out
    var elapsed = 0;
    var ticker = setInterval(function () {
      elapsed += 0.05;
      if (elapsed > 0.4) {
        clearInterval(ticker);
        scene.remove(mesh);
        scene.remove(light);
        mesh.geometry.dispose();
        mesh.material.dispose();
        return;
      }
      mat.opacity = 0.8 * (1 - elapsed / 0.4);
      light.intensity = 4 * (1 - elapsed / 0.4);
    }, 50);

    // Damage enemies in radius
    if (!window._enemies) return;
    for (var i = 0; i < window._enemies.length; i++) {
      var e = window._enemies[i];
      if (!e || !e.mesh) continue;
      var dist = e.mesh.position.distanceTo(pos);
      if (dist <= radius) {
        var falloff = 1 - dist / radius;
        if (e.takeDamage) e.takeDamage(Math.round(dmg * falloff));
      }
    }
  }

  // ── Destroyed state ───────────────────────────────────────
  function _destroyTurret(t) {
    if (t.destroyed) return;
    t.destroyed = true;

    // Droop barrel
    if (t.barrelGroup) {
      t.barrelGroup.rotation.x = 0.6; // droop ~35°
    }

    // Darken hull
    if (t.hullMesh) {
      t.hullMesh.material = _matDestroyed;
    }

    // Fire flicker light
    var fireLight = new THREE.PointLight(0xFF4400, 2, 5);
    fireLight.position.copy(t.root.position);
    fireLight.position.y += 2;
    _scene.add(fireLight);

    // Fire mesh
    var fGeo  = new THREE.SphereGeometry(0.5, 6, 6);
    var fMat  = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.75 });
    var fMesh = new THREE.Mesh(fGeo, fMat);
    fMesh.position.copy(t.root.position);
    fMesh.position.y += 1.5;
    _scene.add(fMesh);

    t._fireLight = fireLight;
    t._fireMesh  = fMesh;
    t._fireMat   = fMat;

    // Dismount player if mounted
    if (window._playerMountedVehicleTurret === t) {
      dismount();
    }
  }

  // ── Update projectiles ────────────────────────────────────
  function _updateProjectiles(dt) {
    for (var i = _projectiles.length - 1; i >= 0; i--) {
      var p = _projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _projectiles.splice(i, 1);
        continue;
      }
      var move = p.speed * dt;
      p.mesh.position.addScaledVector(p.dir, move);

      // Hit detection (simple ground plane + enemies)
      if (p.mesh.position.y <= 0.1 && p.isShell) {
        _doExplosion(p.mesh.position.clone(), p.blast, p.dmg, _scene);
        _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _projectiles.splice(i, 1);
        continue;
      }

      // Enemy hit
      if (window._enemies) {
        var hit = false;
        for (var j = 0; j < window._enemies.length; j++) {
          var e = window._enemies[j];
          if (!e || !e.mesh) continue;
          var dist = e.mesh.position.distanceTo(p.mesh.position);
          if (dist < 1.2) {
            if (p.isShell) {
              _doExplosion(p.mesh.position.clone(), p.blast, p.dmg, _scene);
            } else {
              if (e.takeDamage) e.takeDamage(p.dmg);
            }
            _scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            _projectiles.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      }
    }
  }

  // ── Key/mouse state ───────────────────────────────────────
  var _keys           = {};
  var _lmbDown        = false;
  var _rmbDown        = false;
  var _keyHandler     = null;
  var _keyUpHandler   = null;
  var _mouseHandler   = null;
  var _clickHandler   = null;
  var _contextHandler = null;

  function _attachInputHandlers(t) {
    _keyHandler = function (e) {
      _keys[e.code] = true;
      if (!window._playerMountedVehicleTurret) return;

      // Q — cycle ammo type
      if (e.code === 'KeyQ') {
        t.ammoIdx = (t.ammoIdx + 1) % AMMO_TYPES.length;
      }
      // E — dismount
      if (e.code === 'KeyE') {
        dismount();
      }
    };
    _keyUpHandler = function (e) {
      _keys[e.code] = false;
    };
    _mouseHandler = function (e) {
      if (!window._playerMountedVehicleTurret) return;
      e.preventDefault();
    };
    _clickHandler = function (e) {
      if (!window._playerMountedVehicleTurret) return;
      var mt = window._playerMountedVehicleTurret;
      if (e.button === 0) { // LMB
        _lmbDown = true;
        _fireMainGun(mt);
      }
      if (e.button === 2) { // RMB
        _rmbDown = true;
      }
    };
    _contextHandler = function (e) {
      if (window._playerMountedVehicleTurret) e.preventDefault();
    };

    document.addEventListener('keydown',     _keyHandler,     false);
    document.addEventListener('keyup',       _keyUpHandler,   false);
    document.addEventListener('mousedown',   _clickHandler,   false);
    document.addEventListener('mouseup',     function (e) {
      if (e.button === 0) _lmbDown = false;
      if (e.button === 2) _rmbDown = false;
    }, false);
    document.addEventListener('contextmenu', _contextHandler, false);
  }

  function _detachInputHandlers() {
    if (_keyHandler)     document.removeEventListener('keydown',     _keyHandler,     false);
    if (_keyUpHandler)   document.removeEventListener('keyup',       _keyUpHandler,   false);
    if (_clickHandler)   document.removeEventListener('mousedown',   _clickHandler,   false);
    if (_contextHandler) document.removeEventListener('contextmenu', _contextHandler, false);
    _keyHandler     = null;
    _keyUpHandler   = null;
    _mouseHandler   = null;
    _clickHandler   = null;
    _contextHandler = null;
    _keys = {};
    _lmbDown = false;
    _rmbDown = false;
  }

  // ── Mount / dismount ──────────────────────────────────────
  function mount(t) {
    if (!t || t.destroyed) return;
    if (window._playerMountedVehicleTurret) return; // already mounted

    window._playerMountedVehicleTurret = t;
    t.mounted = true;

    // Snap camera to turret cupola position
    if (_camera) {
      var wp = new THREE.Vector3();
      t.root.getWorldPosition(wp);
      _camera.position.set(wp.x, wp.y + 3.0, wp.z);
      _camera._vtOrigPos = _camera.position.clone(); // stash for return
    }

    // Disable character controls
    if (_controls) {
      if (typeof _controls.lock === 'function') {
        // PointerLockControls — keep locked but override input
      }
      _controls._vtDisabled = true;
    }

    _updateHUD(t);
  }

  function dismount() {
    var t = window._playerMountedVehicleTurret;
    if (!t) return;

    t.mounted = false;
    window._playerMountedVehicleTurret = null;

    // Restore camera position beside hull
    if (_camera && _camera._vtOrigPos) {
      var wp = new THREE.Vector3();
      t.root.getWorldPosition(wp);
      _camera.position.set(wp.x + 3, wp.y + 1.6, wp.z + 3);
    }

    // Re-enable controls
    if (_controls) {
      _controls._vtDisabled = false;
    }

    _lmbDown = false;
    _rmbDown = false;
    _mgFiring = false;

    _updateHUD(null);
  }

  // ── Per-frame update for mounted turret ───────────────────
  var ROTATE_SPEED = 1.4; // rad/s
  var ELEVATE_SPEED = 0.8;

  function _updateMountedControl(t, dt) {
    if (!t || !t.mounted) return;

    // A/D — rotate turret ring (360° freedom)
    if (_keys['KeyA']) {
      t.turretGroup.rotation.y += ROTATE_SPEED * dt;
    }
    if (_keys['KeyD']) {
      t.turretGroup.rotation.y -= ROTATE_SPEED * dt;
    }

    // W/S — elevate barrel, clamped ±
    if (_keys['KeyW']) {
      t.barrelElevation = Math.max(BARREL_ELEV_MIN, t.barrelElevation - ELEVATE_SPEED * dt);
    }
    if (_keys['KeyS']) {
      t.barrelElevation = Math.min(BARREL_ELEV_MAX, t.barrelElevation + ELEVATE_SPEED * dt);
    }
    t.barrelGroup.rotation.x = t.barrelElevation;

    // Camera follows turret
    if (_camera) {
      var wp = new THREE.Vector3();
      t.root.getWorldPosition(wp);
      var camX = wp.x + Math.sin(t.turretGroup.rotation.y) * 1.5;
      var camZ = wp.z + Math.cos(t.turretGroup.rotation.y) * 1.5;
      _camera.position.set(camX, wp.y + 2.8, camZ);
      _camera.lookAt(
        wp.x - Math.sin(t.turretGroup.rotation.y) * 8,
        wp.y + 0.8 + Math.sin(-t.barrelElevation) * 5,
        wp.z - Math.cos(t.turretGroup.rotation.y) * 8
      );
    }

    // RMB — coaxial MG fire
    if (_rmbDown) {
      _mgFiring = true;
    } else {
      _mgFiring = false;
    }
    if (_mgFiring) {
      _fireCoaxMG(t, dt);
    } else {
      _mgTimer = 0;
    }

    // Shell reload countdown
    if (t.shellReloadTimer > 0) {
      t.shellReloadTimer -= dt;
      if (t.shellReloadTimer < 0) t.shellReloadTimer = 0;
    }

    _updateHUD(t);
  }

  // ── Spawn ─────────────────────────────────────────────────
  function spawn(scene, x, y, z) {
    if (!scene) { console.warn('[VehicleTurret] spawn() requires scene'); return null; }

    _initMats();
    var parts = _buildTurretGroup();
    parts.root.position.set(x || 0, y || 0, z || 0);
    scene.add(parts.root);

    var t = {
      root:             parts.root,
      turretGroup:      parts.turretGroup,
      barrelGroup:      parts.barrelGroup,
      hullMesh:         parts.hullMesh,
      cannonMesh:       parts.cannonMesh,
      flashMesh:        parts.flashMesh,
      hp:               TURRET_HP_MAX,
      destroyed:        false,
      mounted:          false,
      ammoIdx:          0,           // APFSDS by default
      shellReloadTimer: 0,
      barrelElevation:  0,
      mgBelt:           MG_BELT_MAX,
      _fireLight:       null,
      _fireMesh:        null,
      _fireMat:         null,
      _fireFlicker:     0
    };

    window._vehicleTurrets.push(t);
    return t;
  }

  // ── F-key proximity check (called from game loop or input) ──
  function _checkMountProximity(playerPos) {
    if (window._playerMountedVehicleTurret) return; // already in turret
    for (var i = 0; i < window._vehicleTurrets.length; i++) {
      var t = window._vehicleTurrets[i];
      if (t.destroyed) continue;
      var wp = new THREE.Vector3();
      t.root.getWorldPosition(wp);
      var dist = wp.distanceTo(playerPos);
      if (dist <= MOUNT_DIST) {
        mount(t);
        return;
      }
    }
  }

  // ── takeDamage (called externally or by explosion) ────────
  function _applyDamage(t, dmg) {
    if (!t || t.destroyed) return;
    t.hp -= dmg;
    if (t.hp <= 0) {
      t.hp = 0;
      _destroyTurret(t);
    }
  }

  // ── Init ─────────────────────────────────────────────────
  function init(scene, camera, controls) {
    _scene    = scene    || _scene;
    _camera   = camera   || _camera;
    _controls = controls || _controls;

    _createHUD();
    _attachInputHandlers(null); // handlers are turret-aware via global

    // Listen for F key to mount
    document.addEventListener('keydown', function (e) {
      if (e.code !== 'KeyF') return;
      var playerPos = null;
      if (_camera) {
        playerPos = _camera.position.clone();
        playerPos.y -= 1.5; // approximate ground level
      } else if (window._playerPos) {
        playerPos = window._playerPos.clone();
      }
      if (playerPos) _checkMountProximity(playerPos);
    }, false);
  }

  // ── Update (call every frame with delta time) ─────────────
  function update(dt) {
    if (!dt || dt <= 0) return;

    var mt = window._playerMountedVehicleTurret;

    // Update mounted turret controls
    if (mt) {
      _updateMountedControl(mt, dt);
    }

    // Update projectiles
    if (_scene) _updateProjectiles(dt);

    // Screen shake
    _applyScreenShake(dt);

    // Fire flicker on destroyed turrets
    for (var i = 0; i < window._vehicleTurrets.length; i++) {
      var t = window._vehicleTurrets[i];
      if (t.destroyed && t._fireLight) {
        t._fireFlicker += dt * 8;
        var flicker = 1.5 + Math.sin(t._fireFlicker) * 0.8 + Math.random() * 0.5;
        t._fireLight.intensity = flicker;
        if (t._fireMesh) {
          t._fireMesh.scale.setScalar(0.9 + Math.sin(t._fireFlicker * 1.3) * 0.15);
        }
        if (t._fireMat) {
          t._fireMat.opacity = 0.6 + Math.sin(t._fireFlicker * 0.7) * 0.2;
        }
      }
    }
  }

  // ── Reset ─────────────────────────────────────────────────
  function reset() {
    // Dismount if mounted
    if (window._playerMountedVehicleTurret) {
      dismount();
    }

    // Remove all turrets from scene
    for (var i = 0; i < window._vehicleTurrets.length; i++) {
      var t = window._vehicleTurrets[i];
      if (t.root && _scene) _scene.remove(t.root);
      if (t._fireLight && _scene) _scene.remove(t._fireLight);
      if (t._fireMesh  && _scene) _scene.remove(t._fireMesh);
    }
    window._vehicleTurrets = [];

    // Clear projectiles
    for (var j = 0; j < _projectiles.length; j++) {
      var p = _projectiles[j];
      if (_scene) _scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) p.mesh.material.dispose();
    }
    _projectiles = [];

    // Reset shake
    _shakeTime = 0;
    _shakeAmt  = 0;

    // Hide HUD
    if (_hud) _hud.style.display = 'none';

    _mgTimer    = 0;
    _mgRoundCnt = 0;
    _lmbDown    = false;
    _rmbDown    = false;
    _mgFiring   = false;
    _keys       = {};
  }

  // ── Public API ────────────────────────────────────────────
  return {
    init:     init,
    update:   update,
    spawn:    spawn,
    mount:    mount,
    dismount: dismount,
    reset:    reset
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail vehicle-turret.js",_e&&_e.message); }
/* === tactical-minimap.js === */
try {
;
window.TacticalMinimap = (function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  var canvas = null;
  var ctx = null;
  var container = null;
  var visible = true;
  var zoom = 1.0;
  var frameCount = 0;
  var solidCache = null;   // cached grid of solid voxels
  var CACHE_RANGE = 80;    // world units sampled
  var CACHE_STEP  = 4;     // sample every N units
  var MAP_SIZE    = 160;   // canvas px
  var BASE_SCALE  = 2;     // 1 world unit → 2 px at zoom 1

  // ── Key bindings ───────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var key = e.key || '';
    if (key === 'm' || key === 'M') {
      visible = !visible;
      container.style.display = visible ? 'block' : 'none';
    } else if (key === '+' || key === '=') {
      zoom = Math.min(2.0, zoom + 0.25);
    } else if (key === '-' || key === '_') {
      zoom = Math.max(0.5, zoom - 0.25);
    }
  }

  // ── Build voxel cache ─────────────────────────────────────────────────────
  // Sampled once at init relative to world-origin; re-centered on player each frame.
  function buildSolidCache(cx, cz) {
    solidCache = [];
    var half = CACHE_RANGE / 2;
    for (var wx = cx - half; wx <= cx + half; wx += CACHE_STEP) {
      for (var wz = cz - half; wz <= cz + half; wz += CACHE_STEP) {
        var solid = false;
        try {
          if (window.VoxelWorld && typeof VoxelWorld.isSolid === 'function') {
            solid = VoxelWorld.isSolid(Math.round(wx), 0, Math.round(wz));
          }
        } catch (err) { /* ignore */ }
        if (solid) {
          solidCache.push({ wx: wx, wz: wz });
        }
      }
    }
  }

  // ── DOM setup ─────────────────────────────────────────────────────────────
  function createDOM() {
    container = document.createElement('div');
    container.id = 'tactical-minimap-container';
    container.style.cssText = [
      'position:fixed',
      'top:12px',
      'right:12px',
      'z-index:9999',
      'pointer-events:none',
      'font-family:monospace',
      'user-select:none'
    ].join(';');

    // HUD label
    var label = document.createElement('div');
    label.textContent = 'TACTICAL MAP';
    label.style.cssText = [
      'color:#3A6A3A',
      'font-size:9px',
      'letter-spacing:2px',
      'text-align:center',
      'margin-bottom:3px',
      'font-weight:bold'
    ].join(';');

    canvas = document.createElement('canvas');
    canvas.width  = MAP_SIZE;
    canvas.height = MAP_SIZE;
    canvas.style.cssText = [
      'display:block',
      'border:2px solid #2A4A2A',
      'border-radius:6px',
      'opacity:0.85',
      'background:#0A1A0A'
    ].join(';');

    container.appendChild(label);
    container.appendChild(canvas);
    document.body.appendChild(container);
    ctx = canvas.getContext('2d');
  }

  // ── World → canvas coordinate helper ──────────────────────────────────────
  function worldToMap(wx, wz, playerX, playerZ) {
    var scale = BASE_SCALE * zoom;
    var half  = MAP_SIZE / 2;
    var mx = half + (wx - playerX) * scale;
    var mz = half + (wz - playerZ) * scale;
    return { x: mx, y: mz };
  }

  // ── Draw functions ────────────────────────────────────────────────────────
  function drawBackground() {
    ctx.fillStyle = '#0A1A0A';
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
  }

  function drawWalls(playerX, playerZ) {
    if (!solidCache) { return; }
    var scale = BASE_SCALE * zoom;
    var cellPx = Math.max(2, CACHE_STEP * scale);
    ctx.fillStyle = '#333333';
    for (var i = 0; i < solidCache.length; i++) {
      var c = solidCache[i];
      var p = worldToMap(c.wx, c.wz, playerX, playerZ);
      if (p.x < -cellPx || p.x > MAP_SIZE + cellPx ||
          p.y < -cellPx || p.y > MAP_SIZE + cellPx) { continue; }
      ctx.fillRect(p.x - cellPx / 2, p.y - cellPx / 2, cellPx, cellPx);
    }
  }

  function drawObjective(playerX, playerZ) {
    if (!window._objectivePos) { return; }
    var op = window._objectivePos;
    var p  = worldToMap(op.x || 0, op.z || 0, playerX, playerZ);
    var s  = 6; // half-size of diamond
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - s);
    ctx.lineTo(p.x + s, p.y);
    ctx.lineTo(p.x, p.y + s);
    ctx.lineTo(p.x - s, p.y);
    ctx.closePath();
    ctx.fill();
  }

  function drawTripwires(playerX, playerZ) {
    if (!window._activeTripwires || !window._activeTripwires.length) { return; }
    ctx.fillStyle = '#FF8800';
    for (var i = 0; i < window._activeTripwires.length; i++) {
      var tw = window._activeTripwires[i];
      if (!tw) { continue; }
      var wx = tw.x !== undefined ? tw.x : (tw.position ? tw.position.x : null);
      var wz = tw.z !== undefined ? tw.z : (tw.position ? tw.position.z : null);
      if (wx === null || wz === null) { continue; }
      var p = worldToMap(wx, wz, playerX, playerZ);
      var s = 4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - s);
      ctx.lineTo(p.x + s, p.y + s);
      ctx.lineTo(p.x - s, p.y + s);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawEnemies(playerX, playerZ) {
    var enemies = [];
    try {
      if (window.Enemies && typeof Enemies.getAll === 'function') {
        enemies = Enemies.getAll() || [];
      }
    } catch (err) { /* ignore */ }

    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en) { continue; }
      var ex = en.x !== undefined ? en.x : (en.position ? en.position.x : null);
      var ez = en.z !== undefined ? en.z : (en.position ? en.position.z : null);
      if (ex === null || ez === null) { continue; }

      var revealed = en._radarRevealed;
      var radius   = revealed ? 4 : 3;
      var color    = revealed ? '#FF4444' : '#CC2222';
      var p = worldToMap(ex, ez, playerX, playerZ);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer(yaw) {
    var cx = MAP_SIZE / 2;
    var cy = MAP_SIZE / 2;

    // White filled circle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Directional triangle pointing toward camera-facing direction
    var angle = (yaw !== undefined && yaw !== null) ? yaw : 0;
    var tipLen = 8;
    var baseHalf = 4;

    var tx = cx + Math.sin(angle) * tipLen;
    var ty = cy - Math.cos(angle) * tipLen;
    var lx = cx + Math.sin(angle + Math.PI * 0.7) * baseHalf;
    var ly = cy - Math.cos(angle + Math.PI * 0.7) * baseHalf;
    var rx = cx + Math.sin(angle - Math.PI * 0.7) * baseHalf;
    var ry = cy - Math.cos(angle - Math.PI * 0.7) * baseHalf;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(lx, ly);
    ctx.lineTo(rx, ry);
    ctx.closePath();
    ctx.fill();
  }

  function drawLegend() {
    var x = 6;
    var y = MAP_SIZE - 28;
    ctx.font = '8px monospace';

    // Enemy dot
    ctx.fillStyle = '#CC2222';
    ctx.beginPath();
    ctx.arc(x + 4, y + 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('enemy', x + 10, y + 8);

    // Objective diamond
    y += 14;
    var s = 4;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 4 + s, y + s);
    ctx.lineTo(x + 4, y + s * 2);
    ctx.lineTo(x + 4 - s, y + s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('objective', x + 10, y + 9);
  }

  // ── Resolve player position / yaw from scene ───────────────────────────────
  function getPlayerState() {
    var px = 0, pz = 0, yaw = 0;

    // Try window.player (common pattern)
    if (window.player) {
      var pos = window.player.position || window.player;
      if (pos.x !== undefined) { px = pos.x; pz = pos.z; }
      if (window.player.rotation) { yaw = window.player.rotation.y || 0; }
    }

    // Try window.camera (Three.js camera)
    if (window.camera && window.camera.position) {
      if (px === 0 && pz === 0) {
        px = window.camera.position.x;
        pz = window.camera.position.z;
      }
      if (window.camera.rotation) {
        yaw = window.camera.rotation.y || 0;
      }
    }

    // Try window._playerPos
    if (window._playerPos) {
      px = window._playerPos.x || px;
      pz = window._playerPos.z || pz;
    }

    return { x: px, z: pz, yaw: yaw };
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function init() {
    createDOM();
    document.addEventListener('keydown', onKeyDown);

    // Build solid cache from origin to start; will refresh on first update
    buildSolidCache(0, 0);
  }

  var _lastCacheX = null;
  var _lastCacheZ = null;
  var CACHE_REFRESH_DIST = 20; // rebuild cache when player moves this far

  function update() {
    if (!ctx || !visible) { return; }

    // Throttle to ~10fps (assuming 60fps game loop → skip 5 of every 6 frames)
    frameCount++;
    if (frameCount % 6 !== 0) { return; }

    var state  = getPlayerState();
    var px     = state.x;
    var pz     = state.z;
    var yaw    = state.yaw;

    // Rebuild solid cache when player moves significantly
    if (_lastCacheX === null ||
        Math.abs(px - _lastCacheX) > CACHE_REFRESH_DIST ||
        Math.abs(pz - _lastCacheZ) > CACHE_REFRESH_DIST) {
      buildSolidCache(px, pz);
      _lastCacheX = px;
      _lastCacheZ = pz;
    }

    drawBackground();
    drawWalls(px, pz);
    drawObjective(px, pz);
    drawTripwires(px, pz);
    drawEnemies(px, pz);
    drawPlayer(yaw);
    drawLegend();
  }

  function reset() {
    solidCache   = null;
    _lastCacheX  = null;
    _lastCacheZ  = null;
    frameCount   = 0;
    zoom         = 1.0;
    visible      = true;
    if (container) {
      container.style.display = 'block';
    }
  }

  return { init: init, update: update, reset: reset };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail tactical-minimap.js",_e&&_e.message); }
/* === proximity-mine.js === */
try {
;
// proximity-mine.js — Precision deployable proximity mine with pressure sensor
// Keybind: Alt+M to plant at feet; 4 mines max, 25s recharge per mine
// Player NOT affected by own mines; approach + hold F 3s to recover.
// All var — no let/const. IIFE pattern.
window.ProximityMine = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MAX_MINES        = 4;     // max mines in world simultaneously
  var RECHARGE_TIME    = 25;    // seconds per mine recharge
  var ARM_DELAY        = 2.0;   // seconds after planting before mine arms
  var TRIGGER_RADIUS   = 1.2;   // units — enemy step-on radius
  var TRIGGER_DELAY    = 0.5;   // seconds between trigger and explosion
  var DISARM_RADIUS    = 1.5;   // units — player must be within to disarm
  var DISARM_HOLD      = 3.0;   // seconds F must be held to recover mine
  var BLAST_DMG_CLOSE  = 180;   // damage within 2.5 units
  var BLAST_DMG_MID    = 90;    // damage within 5 units
  var BLAST_DMG_FAR    = 40;    // damage within 8 units
  var BLAST_RADIUS_1   = 2.5;   // inner blast zone (units)
  var BLAST_RADIUS_2   = 5.0;   // mid blast zone (units)
  var BLAST_RADIUS_3   = 8.0;   // outer blast zone (units)
  var KNOCKBACK_Y      = 8;     // upward knockback applied to enemy
  var CHAIN_RADIUS     = 4.0;   // mines within this distance also trigger (1 chain max)
  var SCORE_PER_KILL   = 350;   // score per enemy killed
  var BLINK_ARMED      = 1.5;   // blink interval (seconds) when armed
  var BLINK_ARMING     = 0.15;  // fast blink interval (seconds) when arming

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene       = null;
  var _camera      = null;
  var _mines       = [];        // active mine objects
  var _inventory   = MAX_MINES; // mines available to plant
  var _recharge    = 0;         // seconds until next mine recharges
  var _keyBound    = false;
  var _fKeyDown    = false;     // is F currently held
  var _disarmTimer = 0;         // how long F has been held near a mine
  var _disarmTarget = null;     // mine object being disarmed
  var _hudEl       = null;

  // Global array of active mine objects (for other systems to read)
  window._activeMines = window._activeMines || [];

  // ── Enemy / player access helpers ─────────────────────────────────────────
  function _getEnemies() {
    if (window._enemies && Array.isArray(window._enemies)) return window._enemies;
    if (window.Enemies && Array.isArray(window.Enemies.list)) return window.Enemies.list;
    if (window.Enemies && typeof window.Enemies.getAll === 'function') return window.Enemies.getAll();
    return [];
  }

  function _getPlayerPos() {
    if (window._player && window._player.position) return window._player.position;
    if (window.player  && window.player.position)  return window.player.position;
    if (_camera) return _camera.position;
    return new THREE.Vector3();
  }

  function _addScore(n) {
    if (window.player  && typeof window.player.score  === 'number') window.player.score  += n;
    if (window._player && typeof window._player.score === 'number') window._player.score += n;
    if (window.HUD && typeof window.HUD.setScore === 'function') {
      var s = (window.player && window.player.score) || (window._player && window._player.score) || 0;
      window.HUD.setScore(s);
    }
  }

  function _damageEnemy(en, dmg) {
    if (typeof en.takeDamage === 'function') {
      en.takeDamage(dmg);
    } else if (typeof en.hp === 'number') {
      en.hp -= dmg;
    } else if (typeof en.health === 'number') {
      en.health -= dmg;
    }
    var hp = (typeof en.hp === 'number') ? en.hp
           : (typeof en.health === 'number') ? en.health : 1;
    return hp <= 0;
  }

  // ── Audio helpers ──────────────────────────────────────────────────────────
  function _playBeep(freq, dur, type) {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  }

  function _playPlantSFX() {
    // Soft thud — mine set down
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      var buf  = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / data.length) * 0.25;
      }
      var src  = ctx.createBufferSource();
      var gain = ctx.createGain();
      src.buffer = buf;
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playExplosionSFX() {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      var osc1  = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(80, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(16, ctx.currentTime + 0.3);
      gain1.gain.setValueAtTime(1.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);

      var osc2  = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(900, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.18);
      gain2.gain.setValueAtTime(0.45, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  function _playDisarmSFX() {
    _playBeep(1400, 0.06, 'square');
    setTimeout(function () { _playBeep(1800, 0.06, 'square'); }, 80);
  }

  function _playArmedSFX() {
    // Short double-beep: mine is now armed
    _playBeep(660, 0.05, 'square');
    setTimeout(function () { _playBeep(880, 0.05, 'square'); }, 90);
  }

  // ── Mine mesh builder ──────────────────────────────────────────────────────
  function _buildMineMesh() {
    var group = new THREE.Group();

    // Flat disk — main body, olive drab
    var diskGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 12);
    var diskMat = new THREE.MeshLambertMaterial({ color: 0x4A5A2A });
    var disk = new THREE.Mesh(diskGeo, diskMat);
    group.add(disk);

    // Raised pressure plate in center
    var plateGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 8);
    var plateMat = new THREE.MeshLambertMaterial({ color: 0x3A4A1A });
    var plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = 0.05;
    group.add(plate);

    // Tiny blinking red point light on top
    var light = new THREE.PointLight(0xFF0000, 0.3, 1);
    light.position.y = 0.1;
    group.add(light);

    return { group: group, light: light };
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('proximityMineHUD')) {
      _hudEl = document.getElementById('proximityMineHUD');
      return;
    }
    var el = document.createElement('div');
    el.id = 'proximityMineHUD';
    el.style.cssText = [
      'position:fixed',
      'bottom:112px',
      'right:14px',
      'font-family:monospace',
      'font-size:13px',
      'color:#88cc55',
      'text-shadow:0 0 5px #336600,0 0 2px #000',
      'background:rgba(0,0,0,0.50)',
      'padding:3px 8px',
      'border-radius:4px',
      'z-index:1000',
      'pointer-events:none',
      'user-select:none'
    ].join(';');
    document.body.appendChild(el);
    _hudEl = el;
  }

  function _updateHUD() {
    if (!_hudEl) _hudEl = document.getElementById('proximityMineHUD');
    if (!_hudEl) return;

    // Count live mines and check for any arming
    var liveMines = 0;
    var anyArming = false;
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (m && !m.triggered && !m.exploded) {
        liveMines++;
        if (!m.armed) anyArming = true;
      }
    }

    var label = '💣 MINE \xD7' + _inventory;
    if (_inventory < MAX_MINES) {
      var secs = Math.ceil(_recharge);
      label += ' (' + secs + 's)';
    }
    if (anyArming) {
      label += ' — ARMING...';
      _hudEl.style.color = '#ffcc00';
    } else {
      _hudEl.style.color = _inventory > 0 ? '#88cc55' : '#666655';
    }
    if (liveMines > 0 && !anyArming) {
      label += ' — PLACED:' + liveMines;
    }
    _hudEl.textContent = label;
  }

  // ── Disarm progress bar ────────────────────────────────────────────────────
  function _ensureDisarmBar() {
    if (document.getElementById('proximityMineDisarmBar')) return;
    var bar = document.createElement('div');
    bar.id = 'proximityMineDisarmBar';
    bar.style.cssText = [
      'position:fixed',
      'bottom:135px',
      'right:14px',
      'width:120px',
      'height:6px',
      'background:rgba(0,0,0,0.5)',
      'border-radius:3px',
      'z-index:1001',
      'pointer-events:none',
      'display:none'
    ].join(';');
    var fill = document.createElement('div');
    fill.id = 'proximityMineDisarmFill';
    fill.style.cssText = [
      'height:100%',
      'width:0%',
      'background:#ffcc00',
      'border-radius:3px',
      'transition:width 0.1s linear'
    ].join(';');
    bar.appendChild(fill);
    document.body.appendChild(bar);
  }

  function _setDisarmBar(pct) {
    var bar  = document.getElementById('proximityMineDisarmBar');
    var fill = document.getElementById('proximityMineDisarmFill');
    if (!bar || !fill) return;
    if (pct <= 0) {
      bar.style.display = 'none';
      fill.style.width  = '0%';
    } else {
      bar.style.display = 'block';
      fill.style.width  = Math.min(100, pct * 100) + '%';
    }
  }

  // ── Explosion VFX ─────────────────────────────────────────────────────────
  function _spawnExplosionVFX(pos) {
    if (!_scene) return;

    // Orange point light flash
    var flashLight = new THREE.PointLight(0xFF8800, 8, 10);
    flashLight.position.copy(pos);
    flashLight.position.y += 0.5;
    _scene.add(flashLight);

    // Smoke sphere
    var smokeGeo = new THREE.SphereGeometry(1, 7, 7);
    var smokeMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.55 });
    var smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.copy(pos);
    smoke.position.y += 0.4;
    _scene.add(smoke);

    // 10 debris chunks
    var debrisGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x4A5A2A });
    var debrisList = [];
    for (var di = 0; di < 10; di++) {
      var d = new THREE.Mesh(debrisGeo, debrisMat);
      d.position.copy(pos);
      d.position.y += 0.1;
      var angle = (di / 10) * Math.PI * 2;
      var speed = 2 + Math.random() * 4;
      var dvel = {
        x: Math.sin(angle) * speed * (0.6 + Math.random() * 0.4),
        y: 3 + Math.random() * 4,
        z: Math.cos(angle) * speed * (0.6 + Math.random() * 0.4)
      };
      _scene.add(d);
      debrisList.push({ mesh: d, vel: dvel, life: 0.9 + Math.random() * 0.5 });
    }

    // Camera shake
    window._cameraShake = { intensity: 0.7, duration: 0.8 };

    var startTs = null;
    function animExp(ts) {
      if (!startTs) startTs = ts;
      var t = (ts - startTs) / 1000;

      // Flash light fades over 0.4s
      if (t < 0.4) {
        flashLight.intensity = 8 * (1 - t / 0.4);
      } else {
        if (_scene) _scene.remove(flashLight);
      }

      // Smoke rises and fades over 1.8s
      if (t < 1.8) {
        var ss = 1 + t * 1.5;
        smoke.scale.set(ss, ss * 0.6, ss);
        smoke.position.y = pos.y + 0.4 + t * 2;
        smokeMat.opacity = 0.55 * (1 - t / 1.8);
      } else {
        if (_scene) _scene.remove(smoke);
      }

      // Debris physics
      var anyDebris = false;
      for (var dbi = 0; dbi < debrisList.length; dbi++) {
        var dp = debrisList[dbi];
        if (!dp || dp.life <= 0) continue;
        dp.life -= 0.016;
        dp.vel.y -= 9.8 * 0.016;
        dp.mesh.position.x += dp.vel.x * 0.016;
        dp.mesh.position.y += dp.vel.y * 0.016;
        dp.mesh.position.z += dp.vel.z * 0.016;
        dp.mesh.rotation.x += dp.vel.x * 0.04;
        dp.mesh.rotation.z += dp.vel.z * 0.04;
        if (dp.mesh.position.y < pos.y) { dp.mesh.position.y = pos.y; dp.vel.y = 0; }
        if (dp.life <= 0) {
          if (_scene) _scene.remove(dp.mesh);
          debrisList[dbi] = null;
        } else { anyDebris = true; }
      }

      if (t < 1.8 || anyDebris) requestAnimationFrame(animExp);
    }
    requestAnimationFrame(animExp);
  }

  // ── Detonate a single mine ─────────────────────────────────────────────────
  function _detonateMine(mine, isChain) {
    if (mine.triggered || mine.exploded) return;
    mine.triggered = true;

    // Rapid red blink pre-explosion (already set in update loop, but force here)
    mine.rapidBlink = true;

    // Apply 0.5s delay before actual explosion
    setTimeout(function () {
      if (mine.exploded) return;
      mine.exploded = true;

      // Remove mesh from scene
      if (_scene && mine.group) _scene.remove(mine.group);

      _spawnExplosionVFX(mine.position.clone());
      _playExplosionSFX();

      var pos = mine.position;
      var enemies = _getEnemies();
      var kills = 0;
      for (var i = 0; i < enemies.length; i++) {
        var en = enemies[i];
        if (!en || !en.position) continue;
        var dist = en.position.distanceTo(pos);
        var dmg = 0;
        if (dist <= BLAST_RADIUS_1)      dmg = BLAST_DMG_CLOSE;
        else if (dist <= BLAST_RADIUS_2) dmg = BLAST_DMG_MID;
        else if (dist <= BLAST_RADIUS_3) dmg = BLAST_DMG_FAR;
        if (dmg > 0) {
          // Upward knockback
          if (en.velocity) {
            en.velocity.y = (en.velocity.y || 0) + KNOCKBACK_Y;
          } else if (en.vel) {
            en.vel.y = (en.vel.y || 0) + KNOCKBACK_Y;
          }
          var killed = _damageEnemy(en, dmg);
          if (killed) {
            kills++;
            if (window.HUD && typeof window.HUD.addKillFeedEntry === 'function') {
              window.HUD.addKillFeedEntry('You', 'Enemy', 'Proximity Mine');
            }
          }
        }
      }
      if (kills > 0) {
        _addScore(kills * SCORE_PER_KILL);
      }

      // Chain reaction — trigger nearby mines (1 chain max)
      if (!isChain) {
        for (var j = 0; j < _mines.length; j++) {
          var other = _mines[j];
          if (!other || other === mine || other.triggered || other.exploded) continue;
          if (other.position.distanceTo(pos) <= CHAIN_RADIUS) {
            (function (m) {
              setTimeout(function () { _detonateMine(m, true); }, 200);
            })(other);
          }
        }
      }

      _syncGlobals();
      _updateHUD();
    }, TRIGGER_DELAY * 1000);
  }

  // ── Sync global array ──────────────────────────────────────────────────────
  function _syncGlobals() {
    window._activeMines = [];
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (m && !m.exploded) window._activeMines.push(m);
    }
  }

  // ── Key binding ────────────────────────────────────────────────────────────
  function _bindKeys() {
    if (_keyBound) return;
    _keyBound = true;

    document.addEventListener('keydown', function (e) {
      // Alt+M — plant mine at feet
      if (e.altKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        plant();
        return;
      }
      // F — start disarm hold
      if (e.key === 'f' || e.key === 'F') {
        _fKeyDown = true;
      }
    });

    document.addEventListener('keyup', function (e) {
      if (e.key === 'f' || e.key === 'F') {
        _fKeyDown = false;
        _disarmTimer  = 0;
        _disarmTarget = null;
        _setDisarmBar(0);
      }
    });
  }

  // ── Public: plant ──────────────────────────────────────────────────────────
  function plant() {
    if (_inventory <= 0) {
      if (window.HUD && typeof window.HUD.showToast === 'function') {
        window.HUD.showToast('MINE RECHARGING...', 1500, '#888866');
      }
      return;
    }

    var playerPos = _getPlayerPos();
    // Snap to ground — place at feet (y - 0.9 from eye height, or floor at y=0)
    var groundY = 0;
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
      groundY = VoxelWorld.getTerrainHeight(playerPos.x, playerPos.z);
    } else {
      groundY = playerPos.y - 0.9;
    }

    var built = _buildMineMesh();
    built.group.position.set(playerPos.x, groundY + 0.03, playerPos.z);
    if (_scene) _scene.add(built.group);

    var mine = {
      group:     built.group,
      light:     built.light,
      position:  built.group.position,
      armed:     false,           // becomes true after ARM_DELAY
      armTimer:  0,               // counts up to ARM_DELAY
      triggered: false,           // true once an enemy steps on it
      exploded:  false,           // true after boom
      rapidBlink:false,           // pre-explosion rapid blink state
      blinkTimer: 0,
      lightOn:   true,
      chainUsed: false
    };
    _mines.push(mine);
    _inventory--;

    if (_inventory < MAX_MINES && _recharge <= 0) {
      _recharge = RECHARGE_TIME;
    }

    _playPlantSFX();
    _syncGlobals();
    _updateHUD();

    if (window.HUD && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast('💣 MINE PLANTED — ARMING...', 2000, '#ffcc00');
    }
    if (window.HUD && typeof window.HUD.addCombatLog === 'function') {
      window.HUD.addCombatLog('Proximity mine planted — arming in 2s', '#88cc55');
    }
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene      = scene;
    _camera     = camera;
    _mines      = [];
    _inventory  = MAX_MINES;
    _recharge   = 0;
    _disarmTimer = 0;
    _disarmTarget = null;
    _fKeyDown   = false;

    window._activeMines = [];

    _ensureHUD();
    _ensureDisarmBar();
    _updateHUD();
    _bindKeys();
  }

  // ── Public: update (called each frame with delta in seconds) ──────────────
  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;

    // Recharge logic
    if (_inventory < MAX_MINES) {
      _recharge -= delta;
      if (_recharge <= 0) {
        _inventory++;
        _recharge = _inventory < MAX_MINES ? RECHARGE_TIME : 0;
        _updateHUD();
        if (window.HUD && typeof window.HUD.showToast === 'function') {
          window.HUD.showToast('💣 MINE READY', 1600, '#88cc55');
        }
      }
      _updateHUD();
    }

    var playerPos = _getPlayerPos();
    var enemies   = _getEnemies();
    var didChange = false;

    // Disarm check — is player near a mine and holding F?
    var disarmCandidate = null;
    var disarmDist = Infinity;
    for (var di = 0; di < _mines.length; di++) {
      var dm = _mines[di];
      if (!dm || dm.triggered || dm.exploded) continue;
      var dDist = dm.position.distanceTo(playerPos);
      if (dDist <= DISARM_RADIUS && dDist < disarmDist) {
        disarmDist = dDist;
        disarmCandidate = dm;
      }
    }

    if (_fKeyDown && disarmCandidate) {
      if (_disarmTarget !== disarmCandidate) {
        _disarmTarget = disarmCandidate;
        _disarmTimer  = 0;
      }
      _disarmTimer += delta;
      _setDisarmBar(_disarmTimer / DISARM_HOLD);

      if (_disarmTimer >= DISARM_HOLD) {
        // Recover mine
        _disarmTarget.exploded = true;
        if (_scene && _disarmTarget.group) _scene.remove(_disarmTarget.group);
        _inventory = Math.min(MAX_MINES, _inventory + 1);
        _playDisarmSFX();
        if (window.HUD && typeof window.HUD.showToast === 'function') {
          window.HUD.showToast('💣 MINE RECOVERED', 1800, '#88cc55');
        }
        _disarmTarget = null;
        _disarmTimer  = 0;
        _setDisarmBar(0);
        didChange = true;
      }
    } else {
      if (!_fKeyDown) {
        _disarmTimer  = 0;
        _disarmTarget = null;
        _setDisarmBar(0);
      }
    }

    // Per-mine update loop
    for (var i = 0; i < _mines.length; i++) {
      var mine = _mines[i];
      if (!mine || mine.exploded) continue;

      // Arming countdown
      if (!mine.armed) {
        mine.armTimer += delta;
        // Yellow fast blink while arming
        mine.blinkTimer += delta;
        if (mine.blinkTimer >= BLINK_ARMING) {
          mine.blinkTimer = 0;
          mine.lightOn = !mine.lightOn;
          if (mine.light) {
            mine.light.color.set(0xFFFF00);
            mine.light.intensity = mine.lightOn ? 0.5 : 0;
          }
        }
        if (mine.armTimer >= ARM_DELAY) {
          mine.armed = true;
          mine.blinkTimer = 0;
          mine.lightOn = true;
          if (mine.light) {
            mine.light.color.set(0xFF0000);
            mine.light.intensity = 0.3;
          }
          _playArmedSFX();
          _updateHUD();
        }
        continue;
      }

      if (mine.triggered) {
        // Rapid red blink while waiting to explode
        mine.blinkTimer += delta;
        if (mine.blinkTimer >= 0.05) {
          mine.blinkTimer = 0;
          mine.lightOn = !mine.lightOn;
          if (mine.light) {
            mine.light.intensity = mine.lightOn ? 1.5 : 0;
          }
        }
        continue;
      }

      // Normal armed blink — red, 1.5s interval
      mine.blinkTimer += delta;
      if (mine.blinkTimer >= BLINK_ARMED) {
        mine.blinkTimer = 0;
        mine.lightOn = !mine.lightOn;
        if (mine.light) {
          mine.light.intensity = mine.lightOn ? 0.3 : 0;
        }
      }

      // Enemy trigger check
      for (var j = 0; j < enemies.length; j++) {
        var en = enemies[j];
        if (!en || !en.position) continue;
        var eDist = en.position.distanceTo(mine.position);
        if (eDist <= TRIGGER_RADIUS) {
          _detonateMine(mine, false);
          didChange = true;
          break;
        }
      }
    }

    // Prune dead mines
    if (didChange) {
      var live = [];
      for (var k = 0; k < _mines.length; k++) {
        if (_mines[k] && !_mines[k].exploded) live.push(_mines[k]);
      }
      _mines = live;
      _syncGlobals();
      _updateHUD();
    }
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (m && m.group && _scene) _scene.remove(m.group);
    }
    _mines       = [];
    _inventory   = MAX_MINES;
    _recharge    = 0;
    _disarmTimer = 0;
    _disarmTarget = null;
    _fKeyDown    = false;
    window._activeMines = [];
    _setDisarmBar(0);
    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return { init: init, update: update, plant: plant, reset: reset };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail proximity-mine.js",_e&&_e.message); }
/* === loot-system.js === */
try {
;
window.LootSystem = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _drops = [];
  var _audioCtx = null;
  var _hudEl = null;
  var _pickupTimer = 0;
  var _lastPickup = null;
  var _lastPickupTimer = 0;

  var RARITIES = { COMMON: 'COMMON', UNCOMMON: 'UNCOMMON', RARE: 'RARE', EPIC: 'EPIC', LEGENDARY: 'LEGENDARY' };

  var LOOT_TABLE = [
    { id: 'ammo_pack', name: 'AMMO PACK', rarity: RARITIES.COMMON, weight: 35, color: 0x888844, icon: '🔧',
      effect: function() {
        if (window._addAmmo) window._addAmmo(40);
        else if (window.player && window.player.ammo !== undefined) window.player.ammo = Math.min(999, (window.player.ammo || 0) + 40);
      }
    },
    { id: 'medkit', name: 'MEDKIT', rarity: RARITIES.COMMON, weight: 30, color: 0xFF4444, icon: '🩹',
      effect: function() {
        var p = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
        if (p) { p.hp = Math.min(100, (p.hp || 50) + 30); if (window.HUD && window.HUD.setHealth) window.HUD.setHealth(p.hp); }
      }
    },
    { id: 'credits', name: 'CREDITS', rarity: RARITIES.UNCOMMON, weight: 20, color: 0xFFCC00, icon: '💰',
      effect: function() { window._credits = (window._credits || 0) + 150; }
    },
    { id: 'armor_vest', name: 'ARMOR VEST', rarity: RARITIES.UNCOMMON, weight: 12, color: 0x4488BB, icon: '🛡',
      effect: function() {
        window._armorAbsorption = Math.min(0.6, (window._armorAbsorption || 0) + 0.2);
        if (window.ArmorSystem && window.ArmorSystem.addArmor) window.ArmorSystem.addArmor(50);
      }
    },
    { id: 'speed_boost_item', name: 'STIM SHOT', rarity: RARITIES.RARE, weight: 8, color: 0xFF8800, icon: '💉',
      effect: function() {
        if (!window._adrenalineActive) {
          window._adrenalineActive = true;
          setTimeout(function() { window._adrenalineActive = false; }, 10000);
          if (window.HUD && window.HUD.showToast) window.HUD.showToast('STIM SHOT! +SPEED +DAMAGE 10s');
        }
      }
    },
    { id: 'grenade_pack', name: 'GRENADE PACK', rarity: RARITIES.RARE, weight: 7, color: 0xFF4400, icon: '💣',
      effect: function() {
        window._grenadeCount = Math.min(6, (window._grenadeCount || 0) + 2);
        window._grenadeCountBonus = (window._grenadeCountBonus || 0) + 2;
      }
    },
    { id: 'repair_kit', name: 'REPAIR KIT', rarity: RARITIES.UNCOMMON, weight: 10, color: 0x44CC44, icon: '🔩',
      effect: function() {
        window._weaponCondition = Math.min(100, (window._weaponCondition || 50) + 30);
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('WEAPON REPAIRED +30%');
      }
    },
    { id: 'tactical_nuke_intel', name: 'INTEL DOCS', rarity: RARITIES.EPIC, weight: 3, color: 0xAA44FF, icon: '📋',
      effect: function() {
        var p = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
        if (p) { p.score = (p.score || 0) + 500; if (window.HUD && window.HUD.setScore) window.HUD.setScore(p.score); }
        if (window.PerkSystem && window.PerkSystem.onKill) window.PerkSystem.onKill({ boss: true });
      }
    },
    { id: 'golden_ammo', name: 'GOLDEN AMMO', rarity: RARITIES.LEGENDARY, weight: 2, color: 0xFFDD00, icon: '✨',
      effect: function() {
        window._goldenAmmoActive = true;
        window._goldenAmmoShots = 20;
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('✨ GOLDEN AMMO: 2x DAMAGE 20 SHOTS');
      }
    }
  ];

  var RARITY_COLORS = {
    COMMON: '#888888', UNCOMMON: '#44AA44', RARE: '#4488FF',
    EPIC: '#AA44FF', LEGENDARY: '#FFCC00'
  };

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playPickupSound(rarity) {
    try {
      var ctx = _getAudioCtx();
      var freqs = rarity === RARITIES.LEGENDARY ? [523, 659, 784, 1047, 1319] :
        rarity === RARITIES.EPIC ? [440, 554, 659, 880] :
        rarity === RARITIES.RARE ? [392, 494, 587] :
        [330, 392];
      for (var i = 0; i < freqs.length; i++) {
        (function(freq, delay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.05, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.2);
        })(freqs[i], i * 0.1);
      }
    } catch(e) {}
  }

  function _rollLoot() {
    var totalWeight = 0;
    for (var i = 0; i < LOOT_TABLE.length; i++) totalWeight += LOOT_TABLE[i].weight;
    var roll = Math.random() * totalWeight;
    var cumulative = 0;
    for (var j = 0; j < LOOT_TABLE.length; j++) {
      cumulative += LOOT_TABLE[j].weight;
      if (roll < cumulative) return LOOT_TABLE[j];
    }
    return LOOT_TABLE[0];
  }

  function _buildDropMesh(item) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: item.color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    var glowColor = {
      COMMON: 0x888888, UNCOMMON: 0x44FF44, RARE: 0x4488FF,
      EPIC: 0xAA44FF, LEGENDARY: 0xFFCC00
    }[item.rarity] || 0xFFFFFF;

    var light = new THREE.PointLight(glowColor, 2, 4);
    group.add(light);
    group.userData.light = light;

    if (item.rarity === RARITIES.LEGENDARY || item.rarity === RARITIES.EPIC) {
      var outerGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
      var outerMat = new THREE.MeshLambertMaterial({
        color: glowColor, transparent: true, opacity: 0.25, wireframe: true
      });
      var outer = new THREE.Mesh(outerGeo, outerMat);
      group.add(outer);
      group.userData.outerBox = outer;
    }

    return group;
  }

  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'loot-pickup-toast';
    _hudEl.style.cssText = [
      'position:fixed', 'bottom:160px', 'left:50%',
      'transform:translateX(-50%)', 'font-family:monospace',
      'font-size:14px', 'font-weight:bold', 'text-align:center',
      'pointer-events:none', 'z-index:1600', 'display:none',
      'text-shadow:0 0 8px currentColor', 'letter-spacing:2px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _showPickupHUD(item) {
    if (!_hudEl) return;
    var col = RARITY_COLORS[item.rarity] || '#FFF';
    _hudEl.style.color = col;
    _hudEl.style.display = 'block';
    _hudEl.innerHTML = item.icon + ' [' + item.rarity + '] ' + item.name + ' ACQUIRED';
    _lastPickupTimer = 2.5;
  }

  function spawnDrop(x, y, z, forcedItem) {
    if (!_scene) return;
    var item = forcedItem || _rollLoot();
    var mesh = _buildDropMesh(item);
    mesh.position.set(x, y || 0.5, z);
    _scene.add(mesh);

    _drops.push({
      mesh: mesh,
      item: item,
      bobPhase: Math.random() * Math.PI * 2,
      age: 0,
      lifetime: 30,
      collected: false
    });
  }

  function _distSq(ax, az, bx, bz) {
    var dx = ax - bx; var dz = az - bz;
    return dx * dx + dz * dz;
  }

  function _hookKillDrops() {
    var prev = window._onEnemyKilled;
    window._onEnemyKilled = function(enemy) {
      if (prev) prev(enemy);
      if (!enemy || !enemy.mesh) return;
      var pos = enemy.mesh.position;
      var roll = Math.random();
      var isBoss = enemy.typeCfg && enemy.typeCfg.role === 'boss';
      var dropChance = isBoss ? 1.0 : 0.3;
      if (roll < dropChance) {
        var count = isBoss ? 3 : 1;
        for (var i = 0; i < count; i++) {
          spawnDrop(
            pos.x + (Math.random() - 0.5) * 2,
            0.5,
            pos.z + (Math.random() - 0.5) * 2
          );
        }
      }
    };
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _drops = [];
    _createHUD();
    _hookKillDrops();
    window._lootDrops = _drops;
    window._spawnLootDrop = spawnDrop;
  }

  function update(dt) {
    if (!_scene) return;

    if (_lastPickupTimer > 0) {
      _lastPickupTimer -= dt;
      if (_lastPickupTimer <= 0 && _hudEl) _hudEl.style.display = 'none';
    }

    var player = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
    var px = player && player.position ? (player.position.x || 0) : 0;
    var pz = player && player.position ? (player.position.z || 0) : 0;

    _pickupTimer -= dt;

    for (var i = _drops.length - 1; i >= 0; i--) {
      var d = _drops[i];
      if (d.collected) { _drops.splice(i, 1); continue; }

      d.age += dt;
      if (d.age >= d.lifetime) {
        _scene.remove(d.mesh);
        _drops.splice(i, 1);
        continue;
      }

      d.bobPhase += dt * 2.5;
      d.mesh.position.y = 0.5 + Math.sin(d.bobPhase) * 0.15;
      d.mesh.rotation.y += dt * 1.5;

      if (d.mesh.userData.outerBox) {
        d.mesh.userData.outerBox.rotation.y -= dt * 2;
        d.mesh.userData.outerBox.rotation.x += dt * 0.7;
      }

      var fade = d.lifetime - d.age;
      if (fade < 5 && d.mesh.userData.light) {
        d.mesh.userData.light.intensity = (fade / 5) * 2;
      }

      if (_pickupTimer <= 0) {
        var distSq = _distSq(px, pz, d.mesh.position.x, d.mesh.position.z);
        if (distSq < 2.25) {
          d.collected = true;
          _scene.remove(d.mesh);
          d.item.effect();
          _playPickupSound(d.item.rarity);
          _showPickupHUD(d.item);
          window._kfeSupplyFound = true;
        }
      }
    }

    if (_pickupTimer <= 0) _pickupTimer = 0.15;
  }

  function reset() {
    for (var i = 0; i < _drops.length; i++) {
      if (_drops[i].mesh) _scene && _scene.remove(_drops[i].mesh);
    }
    _drops = [];
    if (_hudEl) _hudEl.style.display = 'none';
  }

  return { init: init, update: update, spawnDrop: spawnDrop, reset: reset };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail loot-system.js",_e&&_e.message); }
/* === tactical-shield.js === */
try {
;
window.TacticalShield = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _equipped = false;
  var _shieldMesh = null;
  var _shieldHP = 200;
  var _maxShieldHP = 200;
  var _blocking = false;
  var _bashCooldown = 0;
  var _hudEl = null;
  var _hpBarEl = null;
  var _crackParticles = [];
  var _audioCtx = null;
  var _active = false;

  var SHIELD_ABSORPTION = 0.85;
  var BASH_DAMAGE = 35;
  var BASH_RANGE = 2.2;

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playImpact(power) {
    try {
      var ctx = _getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 300 + power * 100;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  }

  function _playBash() {
    try {
      var ctx = _getAudioCtx();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 400;
      var gain = ctx.createGain();
      gain.gain.value = 0.5;
      src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }

  function _buildShieldMesh() {
    var group = new THREE.Group();

    var shieldGeo = new THREE.BoxGeometry(0.7, 1.2, 0.06);
    var shieldMat = new THREE.MeshLambertMaterial({
      color: 0x334455, transparent: true, opacity: 0.85
    });
    var shieldBody = new THREE.Mesh(shieldGeo, shieldMat);
    group.add(shieldBody);

    var rimGeo = new THREE.BoxGeometry(0.72, 1.22, 0.03);
    var rimMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
    var rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.z = -0.04;
    group.add(rim);

    var viewportGeo = new THREE.BoxGeometry(0.3, 0.25, 0.08);
    var viewportMat = new THREE.MeshLambertMaterial({
      color: 0x88AABB, transparent: true, opacity: 0.5
    });
    var viewport = new THREE.Mesh(viewportGeo, viewportMat);
    viewport.position.set(0, 0.25, 0.04);
    group.add(viewport);

    var handleGeo = new THREE.BoxGeometry(0.08, 0.4, 0.12);
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.15, -0.1, -0.08);
    group.add(handle);

    var boltMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var positions = [[-0.28, 0.5], [0.28, 0.5], [-0.28, -0.5], [0.28, -0.5]];
    for (var i = 0; i < positions.length; i++) {
      var bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 6), boltMat);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(positions[i][0], positions[i][1], 0);
      group.add(bolt);
    }

    group.userData.shieldBody = shieldBody;
    group.userData.shieldMat = shieldMat;
    return group;
  }

  function _createHUD() {
    var wrap = document.createElement('div');
    wrap.id = 'tactical-shield-hud';
    wrap.style.cssText = [
      'position:fixed', 'bottom:75px', 'left:50%', 'transform:translateX(-50%)',
      'font-family:monospace', 'font-size:12px', 'color:#4488BB',
      'text-align:center', 'pointer-events:none', 'z-index:900', 'display:none'
    ].join(';');

    _hudEl = document.createElement('div');
    _hudEl.textContent = '🛡 TACTICAL SHIELD';
    wrap.appendChild(_hudEl);

    var barWrap = document.createElement('div');
    barWrap.style.cssText = 'width:120px;height:4px;background:#222;margin:3px auto;border:1px solid #446688';
    _hpBarEl = document.createElement('div');
    _hpBarEl.style.cssText = 'height:100%;background:#4488BB;transition:width 0.1s';
    barWrap.appendChild(_hpBarEl);
    wrap.appendChild(barWrap);

    var hint = document.createElement('div');
    hint.style.cssText = 'color:#555;font-size:10px';
    hint.textContent = 'RMB: RAISE  R: BASH  P: STOW';
    wrap.appendChild(hint);

    document.body.appendChild(wrap);
    return wrap;
  }

  function _updateHUD() {
    var wrap = document.getElementById('tactical-shield-hud');
    if (!wrap) return;
    wrap.style.display = _equipped ? 'block' : 'none';
    if (_hpBarEl) {
      var pct = (_shieldHP / _maxShieldHP) * 100;
      _hpBarEl.style.width = pct + '%';
      _hpBarEl.style.background = pct > 50 ? '#4488BB' : pct > 25 ? '#FFAA00' : '#FF4444';
    }
    if (_hudEl) {
      _hudEl.textContent = '🛡 SHIELD ' + Math.ceil(_shieldHP) + '/' + _maxShieldHP +
        (_blocking ? ' [RAISED]' : '') + (_bashCooldown > 0 ? ' BASH: ' + Math.ceil(_bashCooldown) + 's' : '');
    }
  }

  function _positionShield() {
    if (!_shieldMesh || !_camera) return;
    var cam = _camera;
    var forward = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation);
    var right = new THREE.Vector3(1, 0, 0).applyEuler(cam.rotation);

    _shieldMesh.position.copy(cam.position);
    _shieldMesh.position.addScaledVector(forward, 0.5);
    _shieldMesh.position.addScaledVector(right, 0.35);
    _shieldMesh.position.y -= 0.2;

    if (_blocking) {
      _shieldMesh.rotation.copy(cam.rotation);
      _shieldMesh.rotation.y += Math.PI;
    } else {
      _shieldMesh.rotation.y = cam.rotation.y + Math.PI / 2;
      _shieldMesh.position.addScaledVector(right, -0.15);
      _shieldMesh.position.y -= 0.3;
    }
  }

  function _spawnCrackParticles(pos) {
    if (!_scene) return;
    for (var i = 0; i < 5; i++) {
      var p = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 0.02),
        new THREE.MeshLambertMaterial({ color: 0x88AABB })
      );
      p.position.copy(pos);
      _scene.add(p);
      _crackParticles.push({
        mesh: p,
        vel: { x: (Math.random() - 0.5) * 3, y: 1 + Math.random() * 2, z: (Math.random() - 0.5) * 3 },
        life: 0.8
      });
    }
  }

  function absorbDamage(rawDamage, hitPos) {
    if (!_equipped || !_blocking || _shieldHP <= 0) return rawDamage;
    var absorbed = rawDamage * SHIELD_ABSORPTION;
    _shieldHP = Math.max(0, _shieldHP - absorbed);
    _playImpact(absorbed / rawDamage);

    if (hitPos) _spawnCrackParticles(hitPos);

    if (_shieldHP <= 0) {
      _shieldHP = 0;
      _shatterShield();
    }
    return rawDamage * (1 - SHIELD_ABSORPTION);
  }

  function _shatterShield() {
    if (window.HUD && window.HUD.showToast) window.HUD.showToast('SHIELD DESTROYED');
    if (_shieldMesh && _scene) {
      _scene.remove(_shieldMesh);
      _shieldMesh = null;
    }
    _equipped = false;
    _blocking = false;
    setTimeout(function() {
      _shieldHP = _maxShieldHP;
    }, 30000);
  }

  function _bash() {
    if (_bashCooldown > 0 || !_equipped) return;
    _bashCooldown = 4;
    _playBash();

    if (window.Enemies && window.Enemies.getAll) {
      var cam = _camera;
      if (!cam) return;
      var forward = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation);
      var enemies = window.Enemies.getAll();
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || !e.mesh) continue;
        var dx = e.mesh.position.x - cam.position.x;
        var dz = e.mesh.position.z - cam.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        var dot = (dx / dist) * forward.x + (dz / dist) * forward.z;
        if (dist < BASH_RANGE && dot > 0.4) {
          if (e.takeDamage) e.takeDamage(BASH_DAMAGE);
          if (e.velocity) { e.velocity.x += forward.x * 5; e.velocity.z += forward.z * 5; }
          if (window.HUD && window.HUD.showToast) window.HUD.showToast('SHIELD BASH! ' + BASH_DAMAGE + ' DMG');
        }
      }
    }

    if (_shieldMesh) {
      var origZ = _shieldMesh.position.z;
      _shieldMesh.position.z += 0.3;
      setTimeout(function() { if (_shieldMesh) _shieldMesh.position.z = origZ; }, 150);
    }
  }

  function equip() {
    if (_shieldHP <= 0) {
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('SHIELD DESTROYED — RECHARGING');
      return;
    }
    _equipped = !_equipped;
    if (_equipped) {
      if (!_shieldMesh) _shieldMesh = _buildShieldMesh();
      _scene && _scene.add(_shieldMesh);
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('TACTICAL SHIELD EQUIPPED — RMB: RAISE');
    } else {
      if (_shieldMesh) _scene && _scene.remove(_shieldMesh);
      _blocking = false;
    }
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _shieldHP = _maxShieldHP;
    _equipped = false;
    _blocking = false;
    _createHUD();

    window._shieldAbsorbDamage = absorbDamage;
    window._tacticalShieldHP = _shieldHP;
    window._tacticalShieldEquipped = false;

    document.addEventListener('keydown', function(e) {
      if (e.code === 'KeyP' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        equip();
      }
      if (e.code === 'KeyR' && _equipped) {
        _bash();
      }
    });
    document.addEventListener('mousedown', function(e) {
      if (_equipped && e.button === 2) { _blocking = true; }
    });
    document.addEventListener('mouseup', function(e) {
      if (e.button === 2) { _blocking = false; }
    });
    document.addEventListener('contextmenu', function(e) { if (_equipped) e.preventDefault(); });
  }

  function update(dt) {
    if (!_scene) return;

    if (_bashCooldown > 0) _bashCooldown -= dt;

    for (var i = _crackParticles.length - 1; i >= 0; i--) {
      var p = _crackParticles[i];
      p.life -= dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.vel.y -= 9.8 * dt;
      if (p.life <= 0) { _scene.remove(p.mesh); _crackParticles.splice(i, 1); }
    }

    if (_equipped && _shieldMesh) {
      _positionShield();
      var tiltTarget = _blocking ? 0 : 0.3;
      _shieldMesh.rotation.z += (tiltTarget - _shieldMesh.rotation.z) * dt * 8;

      var shimmer = Math.sin(Date.now() * 0.005) * 0.05;
      if (_shieldMesh.userData.shieldMat) {
        _shieldMesh.userData.shieldMat.opacity = (_blocking ? 0.92 : 0.7) + shimmer;
      }
    }

    window._tacticalShieldHP = _shieldHP;
    window._tacticalShieldEquipped = _equipped && _blocking;
    _updateHUD();
  }

  function reset() {
    if (_shieldMesh && _scene) _scene.remove(_shieldMesh);
    _shieldMesh = null;
    _equipped = false;
    _blocking = false;
    _shieldHP = _maxShieldHP;
    for (var i = 0; i < _crackParticles.length; i++) {
      if (_crackParticles[i].mesh) _scene && _scene.remove(_crackParticles[i].mesh);
    }
    _crackParticles = [];
  }

  return { init: init, update: update, equip: equip, absorbDamage: absorbDamage, reset: reset };
})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail tactical-shield.js",_e&&_e.message); }
