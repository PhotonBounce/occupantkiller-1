// decoy-grenade.js — Noise/decoy grenade that lures and distracts enemies
// Throw key: hold Alt + G (or via grenade selector cycle Shift+G → DECOY, then G to throw)
// IIFE module — no let/const anywhere
window.DecoyGrenade = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;

  var _inventory   = 3;       // decoys available
  var _maxInventory = 3;

  // Active decoy state
  var _active     = false;
  var _decoyMesh  = null;
  var _decoyPos   = null;     // THREE.Vector3 where decoy landed
  var _timer      = 0;        // counts down from 8
  var _DURATION   = 8;        // seconds total active

  // Physics while in flight
  var _inFlight  = false;
  var _flyPos    = null;
  var _flyVel    = null;
  var _bounced   = false;

  // AudioContext for procedural sounds
  var _audioCtx  = null;
  var _soundIntervals = [];

  // HUD
  var _hudEl     = null;
  var _hudPulseT = 0;

  // Globals exposed
  window._decoyActiveAt = null;
  window._onDecoyThrow  = null;   // hook: called with {position} when thrown

  // ── Init ─────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene   = scene;
    _camera  = camera;
    _inventory = 3;
    _active    = false;
    _inFlight  = false;
    _timer     = 0;
    window._decoyActiveAt = null;
    _cleanupSound();
    _removeDecoyMesh();
    _ensureHUD();
    _updateHUD();
    _bindKey();
  }

  // ── Key binding (Alt + G to throw decoy) ─────────────────────────────────
  var _keyBound = false;
  function _bindKey() {
    if (_keyBound) return;
    _keyBound = true;
    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyG' && e.altKey && !e.ctrlKey && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        throwDecoy();
      }
    }, true);
  }

  // ── Mesh helpers ──────────────────────────────────────────────────────────
  function _buildDecoyMesh() {
    var group = new THREE.Group();

    // Body: small yellow cylinder
    var bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xFFDD00 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Speaker grill: 3 thin dark rings around the cylinder equator
    var grillMat = new THREE.MeshLambertMaterial({ color: 0x222200 });
    for (var gi = 0; gi < 3; gi++) {
      var grillRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.082, 0.008, 4, 10),
        grillMat
      );
      grillRing.rotation.x = Math.PI / 2;
      grillRing.position.y = -0.04 + gi * 0.04;
      group.add(grillRing);
    }

    // Top cap: small dark disc
    var capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12);
    var capMat = new THREE.MeshLambertMaterial({ color: 0x555500 });
    var cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.11;
    group.add(cap);

    return group;
  }

  function _removeDecoyMesh() {
    if (_decoyMesh && _scene) {
      try { _scene.remove(_decoyMesh); } catch (ex) {}
    }
    _decoyMesh = null;
  }

  // ── AudioContext helpers ──────────────────────────────────────────────────
  function _getAudioCtx() {
    if (_audioCtx && _audioCtx.state !== 'closed') return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (ex) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _cleanupSound() {
    for (var i = 0; i < _soundIntervals.length; i++) {
      clearInterval(_soundIntervals[i]);
    }
    _soundIntervals = [];
  }

  // Single short AudioContext tap (bounce sound)
  function _playTap(freq, dur) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch (ex) {}
  }

  // Noise burst (gunfire / footstep impact)
  function _playNoiseBurst(volume, freqLow, freqHigh, dur) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufferSize = ctx.sampleRate * dur;
      var buffer = ctx.createBuffer(1, bufferSize | 0, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      var src = ctx.createBufferSource();
      src.buffer = buffer;

      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = (freqLow + freqHigh) / 2;
      filter.Q.value = (freqLow + freqHigh) / (freqHigh - freqLow + 1);

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime);
    } catch (ex) {}
  }

  // Click sound (reload or deactivate)
  function _playClick() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch (ex) {}
  }

  // ── Sound phases ──────────────────────────────────────────────────────────
  // Phase 1: 0–3 s — footsteps (80Hz impacts, 2/s) + reload clicks
  function _startPhase1() {
    var ivFootstep = setInterval(function () {
      _playNoiseBurst(0.5, 60, 120, 0.12);  // heavy thud ~80Hz
    }, 500);
    _soundIntervals.push(ivFootstep);

    // Reload click sequence at ~0.5s, 1.2s, 2.0s, 2.7s
    var reloadTimes = [500, 1200, 2000, 2700];
    for (var ri = 0; ri < reloadTimes.length; ri++) {
      (function (t) {
        var tid = setTimeout(function () {
          _playClick();
          _playNoiseBurst(0.25, 800, 2000, 0.04);
        }, t);
        _soundIntervals.push(tid);
      })(reloadTimes[ri]);
    }
  }

  // Phase 2: 3–6 s — fake gunfire (noise bursts at 4Hz, louder)
  function _startPhase2() {
    var ivGunfire = setInterval(function () {
      _playNoiseBurst(0.9, 200, 4000, 0.08);   // sharp crack
      // Secondary low thud (muzzle blast)
      setTimeout(function () {
        _playNoiseBurst(0.4, 50, 300, 0.15);
      }, 30);
    }, 250);
    _soundIntervals.push(ivGunfire);
  }

  // Phase 3: 6–8 s — fake voices (300–3kHz noise bursts, quasi-speech rhythm)
  function _startPhase3() {
    // Irregular bursts to simulate shouting cadence
    var voiceTimes = [0, 180, 380, 600, 900, 1100, 1400, 1700];
    for (var vi = 0; vi < voiceTimes.length; vi++) {
      (function (t) {
        var tid = setTimeout(function () {
          var freqLow  = 300 + Math.random() * 400;
          var freqHigh = freqLow + 500 + Math.random() * 2000;
          _playNoiseBurst(0.35, freqLow, freqHigh, 0.15 + Math.random() * 0.2);
        }, t);
        _soundIntervals.push(tid);
      })(voiceTimes[vi]);
    }
  }

  // ── Bounce VFX (small ring flash on ground) ──────────────────────────────
  function _spawnBounceVFX(pos) {
    if (!_scene) return;
    var ringGeo = new THREE.RingGeometry(0.05, 0.25, 16);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0xFFFF66,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, pos.y + 0.02, pos.z);
    _scene.add(ring);

    var elapsed = 0;
    var totalDur = 0.45;
    var origOpacity = 0.85;

    // Animate expand + fade using requestAnimationFrame
    var lastT = performance.now();
    function animVFX(now) {
      var dt = (now - lastT) / 1000;
      lastT = now;
      elapsed += dt;
      var frac = Math.min(elapsed / totalDur, 1);
      ring.scale.set(1 + frac * 3, 1 + frac * 3, 1);
      ring.material.opacity = origOpacity * (1 - frac);
      if (frac < 1) {
        requestAnimationFrame(animVFX);
      } else {
        try { _scene.remove(ring); } catch (ex) {}
        ringGeo.dispose();
        ringMat.dispose();
      }
    }
    requestAnimationFrame(animVFX);
  }

  // ── Enemy attraction ──────────────────────────────────────────────────────
  var _ATTRACT_RADIUS = 20;
  var _INVESTIGATE_TIME = 4; // seconds enemies spend at decoy

  function _attractEnemies() {
    if (!_decoyPos) return;
    var allEnemies = [];
    if (window.Enemies && window.Enemies.getAll) {
      allEnemies = window.Enemies.getAll();
    } else if (window._enemies && Array.isArray(window._enemies)) {
      allEnemies = window._enemies;
    }

    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (!e || !e.alive || !e.mesh) continue;

      var dx = e.mesh.position.x - _decoyPos.x;
      var dz = e.mesh.position.z - _decoyPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > _ATTRACT_RADIUS) continue;

      var inCombat = (e._patrolState === 'combat' || e._detectedPlayer);
      if (inCombat && Math.random() > 0.40) continue; // 40% break-off chance

      // Mark enemy for investigation
      e._decoyInvestigating  = true;
      e._decoyTarget         = { x: _decoyPos.x, y: _decoyPos.y, z: _decoyPos.z };
      e._decoyInvestigateTimer = _INVESTIGATE_TIME;
      e._decoyKicked         = false;
      // Temporarily override patrol to move toward decoy
      if (e._patrolState !== 'combat') {
        e._patrolState = 'investigating_decoy';
      }
    }
  }

  function _updateEnemyInvestigation(dt) {
    if (!_decoyPos) return;
    var allEnemies = [];
    if (window.Enemies && window.Enemies.getAll) {
      allEnemies = window.Enemies.getAll();
    } else if (window._enemies && Array.isArray(window._enemies)) {
      allEnemies = window._enemies;
    }

    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (!e || !e.alive || !e.mesh || !e._decoyInvestigating) continue;

      var tx = e._decoyTarget.x;
      var tz = e._decoyTarget.z;
      var dx = tx - e.mesh.position.x;
      var dz = tz - e.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      e._decoyInvestigateTimer -= dt;

      if (dist < 1.5) {
        // Arrived — "kick" the decoy mesh once
        if (!e._decoyKicked && _decoyMesh) {
          e._decoyKicked = true;
          // Small nudge: shift decoy position slightly
          var kickX = (Math.random() - 0.5) * 0.6;
          var kickZ = (Math.random() - 0.5) * 0.6;
          _decoyMesh.position.x += kickX;
          _decoyMesh.position.z += kickZ;
          if (_decoyPos) {
            _decoyPos.x += kickX;
            _decoyPos.z += kickZ;
          }
          _playTap(300, 0.08); // soft thud
        }
        // Wait out the timer
        if (e._decoyInvestigateTimer <= 0) {
          // Return to patrol
          e._decoyInvestigating = false;
          e._decoyTarget        = null;
          if (e._patrolState === 'investigating_decoy') {
            e._patrolState = 'patrol';
          }
        }
      } else {
        // Move toward decoy position
        if (e._decoyInvestigateTimer <= 0) {
          // Time's up before arriving — return to patrol
          e._decoyInvestigating = false;
          e._decoyTarget        = null;
          if (e._patrolState === 'investigating_decoy') {
            e._patrolState = 'patrol';
          }
        } else {
          // Step toward decoy
          var speed = 3.5 * dt;
          if (dist > 0.01) {
            e.mesh.position.x += (dx / dist) * Math.min(speed, dist);
            e.mesh.position.z += (dz / dist) * Math.min(speed, dist);
          }
          // Face toward decoy
          if (e.mesh) {
            e.mesh.rotation.y = Math.atan2(dx, dz);
          }
        }
      }
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudEl && document.body.contains(_hudEl)) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'decoy-grenade-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:160px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid #FFDD00',
      'color:#FFDD00',
      'padding:3px 14px',
      'border-radius:4px',
      'font-size:12px',
      'font-family:monospace',
      'z-index:200',
      'pointer-events:none',
      'display:none',
      'letter-spacing:1px',
      'text-shadow:0 0 6px rgba(255,220,0,0.8)'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    _ensureHUD();
    if (_active) {
      _hudEl.style.display = 'block';
      _hudEl.textContent = 'DECOY ACTIVE [' + _inventory + ' left]';
    } else {
      _hudEl.style.display = 'none';
    }
  }

  function _pulseHUD(dt) {
    if (!_active || !_hudEl) return;
    _hudPulseT += dt * 3;
    var alpha = 0.5 + 0.5 * Math.sin(_hudPulseT);
    _hudEl.style.opacity = String(0.6 + alpha * 0.4);
    _hudEl.style.borderColor = 'rgba(255,' + Math.floor(180 + alpha * 75) + ',0,' + (0.7 + alpha * 0.3) + ')';
  }

  // ── Throw ─────────────────────────────────────────────────────────────────
  function throwDecoy() {
    if (_inventory <= 0) {
      if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('No decoy grenades!', '#888');
      return;
    }
    if (_active || _inFlight) {
      if (window.HUD && HUD.notifyPickup) HUD.notifyPickup('Decoy already active!', '#888');
      return;
    }
    if (!_scene || !_camera) return;

    _inventory--;
    _updateHUD();

    // Compute throw direction from camera
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    dir.normalize();

    // Start position: slightly in front of camera
    var cam = _camera.position;
    _flyPos = new THREE.Vector3(
      cam.x + dir.x * 0.5,
      cam.y - 0.1,
      cam.z + dir.z * 0.5
    );

    // Velocity: forward + upward arc
    var horizSpeed = 12;
    var vertSpeed  = 5;
    _flyVel = new THREE.Vector3(
      dir.x * horizSpeed,
      vertSpeed,
      dir.z * horizSpeed
    );

    // Create mesh and add to scene
    _decoyMesh = _buildDecoyMesh();
    _decoyMesh.position.copy(_flyPos);
    _scene.add(_decoyMesh);

    _inFlight = true;
    _bounced  = false;
    _active   = false;
    window._decoyActiveAt = null;

    // Call throw hook
    if (typeof window._onDecoyThrow === 'function') {
      window._onDecoyThrow({ position: _flyPos.clone() });
    }

    if (window.HUD && HUD.notifyPickup) {
      HUD.notifyPickup('DECOY thrown [Alt+G]', '#FFDD00');
    }
  }

  // ── Activate (once landed) ────────────────────────────────────────────────
  function _activateDecoy(pos) {
    _inFlight  = false;
    _active    = true;
    _timer     = _DURATION;
    _decoyPos  = pos.clone();
    window._decoyActiveAt = _decoyPos;

    _updateHUD();

    // Place mesh exactly on ground
    if (_decoyMesh) {
      _decoyMesh.position.copy(pos);
    }

    // Attract nearby enemies
    _attractEnemies();

    // Start sound phases
    _cleanupSound();
    _startPhase1();
    var t2id = setTimeout(function () {
      _cleanupSound();
      _startPhase2();
    }, 3000);
    _soundIntervals.push(t2id);
    var t3id = setTimeout(function () {
      _cleanupSound();
      _startPhase3();
    }, 6000);
    _soundIntervals.push(t3id);

    if (window.HUD && HUD.notifyPickup) {
      HUD.notifyPickup('DECOY ACTIVE — enemies diverted!', '#FFDD00');
    }
  }

  // ── Deactivate ────────────────────────────────────────────────────────────
  function _deactivateDecoy() {
    _active   = false;
    _timer    = 0;
    window._decoyActiveAt = null;

    _cleanupSound();
    _playClick(); // final click

    _removeDecoyMesh();
    _decoyPos = null;

    _updateHUD();

    // Clear investigating flags on any still-interested enemies
    var allEnemies = [];
    if (window.Enemies && window.Enemies.getAll) {
      allEnemies = window.Enemies.getAll();
    } else if (window._enemies && Array.isArray(window._enemies)) {
      allEnemies = window._enemies;
    }
    for (var i = 0; i < allEnemies.length; i++) {
      var e = allEnemies[i];
      if (e && e._decoyInvestigating) {
        e._decoyInvestigating = false;
        e._decoyTarget        = null;
        if (e._patrolState === 'investigating_decoy') {
          e._patrolState = 'patrol';
        }
      }
    }
  }

  // ── Update (called every frame) ───────────────────────────────────────────
  function update(dt) {
    if (!dt || dt <= 0) return;

    // Flight arc
    if (_inFlight && _flyPos && _flyVel && _decoyMesh) {
      var GRAVITY = 14;
      _flyVel.y -= GRAVITY * dt;
      _flyPos.x += _flyVel.x * dt;
      _flyPos.y += _flyVel.y * dt;
      _flyPos.z += _flyVel.z * dt;

      _decoyMesh.position.copy(_flyPos);

      // Spin while in flight
      _decoyMesh.rotation.x += 4 * dt;
      _decoyMesh.rotation.z += 2 * dt;

      // Ground check (y <= 0.1)
      if (_flyPos.y <= 0.1) {
        _flyPos.y = 0.1;
        if (!_bounced) {
          _bounced = true;
          // Bounce VFX + tap sound
          _spawnBounceVFX(_flyPos);
          _playTap(180, 0.15);
          // Dampen velocity: small bounce
          _flyVel.y = Math.abs(_flyVel.y) * 0.25;
          _flyVel.x *= 0.4;
          _flyVel.z *= 0.4;
          // If bounce is very small, settle
          if (Math.abs(_flyVel.y) < 0.5) {
            // Activate
            _activateDecoy(_flyPos);
          }
        } else {
          // Second touch — settle
          _activateDecoy(_flyPos);
        }
      }
    }

    // Active countdown
    if (_active) {
      _timer -= dt;
      _pulseHUD(dt);
      _updateEnemyInvestigation(dt);

      if (_timer <= 0) {
        _deactivateDecoy();
      }
    }
  }

  // ── Reset (called on wave start/game reset) ───────────────────────────────
  function reset() {
    _cleanupSound();
    _removeDecoyMesh();
    _active    = false;
    _inFlight  = false;
    _timer     = 0;
    _decoyPos  = null;
    _flyPos    = null;
    _flyVel    = null;
    _bounced   = false;
    _inventory = _maxInventory;
    window._decoyActiveAt = null;
    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function getInventory()    { return _inventory; }
  function addInventory(n)   { _inventory = Math.min(_inventory + (n | 0), _maxInventory); _updateHUD(); }
  function isActive()        { return _active; }

  return {
    init:   init,
    update: update,
    throw:  throwDecoy,
    reset:  reset,
    getInventory: getInventory,
    addInventory: addInventory,
    isActive:     isActive
  };

})();
