// ============================================================
//  vehicle-physics.js — Generic Vehicle Driving Physics
//
//  Complements driveable-car.js with a dedicated physics layer.
//
//  Controls (while in vehicle, window._inVehicle = true):
//    W     = accelerate (up to 25 m/s)
//    S     = brake / reverse (down to -8 m/s)
//    A/D   = steer left / right (±45°)
//    E     = exit vehicle
//
//  Public API:
//    VehiclePhysics.init(scene, camera, renderer)
//    VehiclePhysics.update(dt)
//    VehiclePhysics.enterVehicle(vehicleMesh)
//    VehiclePhysics.exitVehicle()
//    VehiclePhysics.reset()
// ============================================================
window.VehiclePhysics = (function () {
  'use strict';

  // ── External references ─────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _renderer = null;

  // ── Vehicle body state ──────────────────────────────────────
  var _vehicleMesh   = null;   // THREE.Object3D representing the car body
  var _velocity      = null;   // THREE.Vector3 — world-space velocity
  var _angularVel    = 0;      // rad/s yaw rotation
  var _speed         = 0;      // scalar m/s (+ forward, - reverse)
  var _yaw           = 0;      // current heading in radians
  var _turnAngle     = 0;      // steering angle in radians (±PI/4)
  var _lateralOffset = null;   // THREE.Vector3 — accumulated drift offset

  // ── HP ──────────────────────────────────────────────────────
  var _HP_MAX = 100;
  window._vehicleHP = _HP_MAX;

  // ── Camera follow state ──────────────────────────────────────
  var _chaseCamPos    = null;  // THREE.Vector3 — smoothed chase camera pos
  var _mousePitchY    = 0;     // accumulated mouse-Y pitch for look-down
  var _origCamPos     = null;  // stored camera position when not driving
  var _origCamRot     = null;  // stored camera quaternion when not driving

  // ── Input state ─────────────────────────────────────────────
  var _keys = { w: false, s: false, a: false, d: false, e: false };
  var _keyHandlerBound = false;

  // ── Audio ───────────────────────────────────────────────────
  var _audioCtx    = null;
  var _oscillator  = null;   // carrier — engine tone
  var _amOsc       = null;   // modulator — rumble
  var _gainNode    = null;
  var _amGain      = null;
  var _audioReady  = false;

  // ── Smoke / damage FX ────────────────────────────────────────
  var _smokeLight      = null;   // THREE.PointLight (orange) at HP < 25 %
  var _smokeParticles  = [];     // array of {mesh, vy, life, maxLife}
  var _smokeTimer      = 0;

  // ── Screen-shake accumulator ─────────────────────────────────
  var _shakeOffsetX = 0;
  var _shakeOffsetY = 0;

  // ── E-key debounce ───────────────────────────────────────────
  var _eKeyWasDown = false;

  // ── Constants ────────────────────────────────────────────────
  var ACCEL_RATE      =  8;          // m/s² forward
  var BRAKE_RATE      = 12;          // m/s² braking
  var REVERSE_RATE    =  6;          // m/s² reverse
  var MAX_SPEED       = 25;          // m/s
  var MAX_REVERSE     = -8;          // m/s
  var STEER_RATE      = 1.2;         // rad/s
  var MAX_STEER       = Math.PI / 4; // 45°
  var FRICTION        = 3.5;         // passive deceleration m/s²
  var STEER_RETURN    = 2.5;         // rad/s steering self-centre
  var DRIFT_THRESHOLD = 15;          // m/s — above this, drift kicks in
  var DRIFT_FORCE     = 0.3;         // lateral force coefficient
  var COLLISION_DMG   = 30;          // HP per collision
  var CHASE_BACK      = 6;           // units behind vehicle
  var CHASE_UP        = 3;           // units above vehicle
  var CHASE_LERP      = 6;           // camera lerp speed
  var MOUSE_PITCH_MAX = 0.4;         // radians max pitch from mouse-Y
  var IDLE_FREQ       = 200;         // Hz engine idle
  var MAX_FREQ        = 600;         // Hz engine at top speed
  var SMOKE_INTERVAL  = 0.08;        // seconds between smoke particles

  // ── Helpers ──────────────────────────────────────────────────
  function _sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }
  function _clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function _lerp(a, b, t) { return a + (b - a) * t; }

  // ── Input ─────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var k = e.key.toLowerCase();
    if (k === 'w') _keys.w = true;
    if (k === 's') _keys.s = true;
    if (k === 'a') _keys.a = true;
    if (k === 'd') _keys.d = true;
    if (k === 'e') _keys.e = true;
  }

  function _onKeyUp(e) {
    var k = e.key.toLowerCase();
    if (k === 'w') _keys.w = false;
    if (k === 's') _keys.s = false;
    if (k === 'a') _keys.a = false;
    if (k === 'd') _keys.d = false;
    if (k === 'e') _keys.e = false;
  }

  function _onMouseMove(e) {
    if (!window._inVehicle) return;
    // Accumulate vertical mouse movement for slight pitch control while driving
    var dy = e.movementY || 0;
    _mousePitchY += dy * 0.002;
    _mousePitchY = _clamp(_mousePitchY, -MOUSE_PITCH_MAX, MOUSE_PITCH_MAX);
  }

  function _bindInput() {
    if (_keyHandlerBound) return;
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    _keyHandlerBound = true;
  }

  // ── Web Audio ─────────────────────────────────────────────────
  function _initAudio() {
    if (_audioReady) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      _audioCtx = new Ctx();

      // AM modulator (rumble)
      _amOsc  = _audioCtx.createOscillator();
      _amGain = _audioCtx.createGain();
      _amOsc.type      = 'sine';
      _amOsc.frequency.value = 30;   // 30 Hz rumble
      _amGain.gain.value = 60;       // modulation depth in Hz
      _amOsc.connect(_amGain);

      // Carrier (engine tone)
      _oscillator = _audioCtx.createOscillator();
      _gainNode   = _audioCtx.createGain();
      _oscillator.type = 'sawtooth';
      _oscillator.frequency.value = IDLE_FREQ;

      // Wire AM: amGain feeds into carrier frequency
      _amGain.connect(_oscillator.frequency);

      _gainNode.gain.value = 0;      // start silent — ramps up on enter
      _oscillator.connect(_gainNode);
      _gainNode.connect(_audioCtx.destination);

      _oscillator.start();
      _amOsc.start();
      _audioReady = true;
    } catch (ex) {
      // Silently fail — audio is non-critical
      _audioReady = false;
    }
  }

  function _updateAudio(dt) {
    if (!_audioReady || !_audioCtx) return;
    // Resume context if suspended (browser autoplay policy)
    if (_audioCtx.state === 'suspended') {
      _audioCtx.resume();
    }
    var t = _audioCtx.currentTime;
    var absSpeed = Math.abs(_speed);
    var t01 = absSpeed / MAX_SPEED;                          // 0..1
    var freq = IDLE_FREQ + t01 * (MAX_FREQ - IDLE_FREQ);
    _oscillator.frequency.setTargetAtTime(freq, t, 0.1);

    if (window._inVehicle) {
      _gainNode.gain.setTargetAtTime(0.18, t, 0.2);
    } else {
      _gainNode.gain.setTargetAtTime(0, t, 0.3);
    }
  }

  // ── Smoke / damage FX ─────────────────────────────────────────
  function _spawnSmokeParticle() {
    if (!_vehicleMesh || !_scene) return;
    var geo  = new THREE.SphereGeometry(0.15, 4, 4);
    var mat  = new THREE.MeshBasicMaterial({
      color: 0x555555,
      transparent: true,
      opacity: 0.7
    });
    var mesh = new THREE.Mesh(geo, mat);
    var pos  = _vehicleMesh.position;
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 0.6,
      pos.y + 1.2,
      pos.z + (Math.random() - 0.5) * 0.6
    );
    _scene.add(mesh);
    _smokeParticles.push({
      mesh:    mesh,
      vy:      0.8 + Math.random() * 0.6,
      life:    0,
      maxLife: 1.2 + Math.random() * 0.6
    });
  }

  function _updateSmoke(dt) {
    if (!window._inVehicle && _smokeParticles.length === 0) return;

    var hp = window._vehicleHP;

    // Spawn smoke only at HP < 25 %
    if (hp < _HP_MAX * 0.25 && _vehicleMesh) {
      _smokeTimer -= dt;
      if (_smokeTimer <= 0) {
        _smokeTimer = SMOKE_INTERVAL;
        _spawnSmokeParticle();
      }
    }

    // Animate existing particles
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var p = _smokeParticles[i];
      p.life += dt;
      p.mesh.position.y += p.vy * dt;
      var alpha = 1 - p.life / p.maxLife;
      p.mesh.material.opacity = Math.max(0, alpha * 0.7);
      var s = 1 + p.life * 0.8;
      p.mesh.scale.set(s, s, s);

      if (p.life >= p.maxLife) {
        _scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _smokeParticles.splice(i, 1);
      }
    }

    // Orange point light (HP < 25 %)
    if (_smokeLight) {
      _smokeLight.visible = (hp < _HP_MAX * 0.25 && !!_vehicleMesh);
      if (_vehicleMesh) {
        _smokeLight.position.copy(_vehicleMesh.position);
        _smokeLight.position.y += 1.5;
        // Flicker
        _smokeLight.intensity = 1.5 + Math.random() * 1.5;
      }
    }
  }

  // ── Collision detection ────────────────────────────────────────
  function _checkCollision() {
    if (!_vehicleMesh) return false;
    var vw = window.VoxelWorld;
    if (!vw || typeof vw.isSolid !== 'function') return false;

    // Probe one unit in front of vehicle
    var frontX = _vehicleMesh.position.x + Math.sin(_yaw) * 1.2;
    var frontY = _vehicleMesh.position.y;
    var frontZ = _vehicleMesh.position.z + Math.cos(_yaw) * 1.2;

    return vw.isSolid(Math.floor(frontX), Math.floor(frontY), Math.floor(frontZ));
  }

  // ── Camera follow ─────────────────────────────────────────────
  function _updateCamera(dt) {
    if (!_camera || !_vehicleMesh) return;

    // Target position: behind and above vehicle
    var behindX = _vehicleMesh.position.x - Math.sin(_yaw) * CHASE_BACK;
    var behindY = _vehicleMesh.position.y + CHASE_UP;
    var behindZ = _vehicleMesh.position.z - Math.cos(_yaw) * CHASE_BACK;

    // Smooth lerp
    var lerpT = _clamp(CHASE_LERP * dt, 0, 1);
    _chaseCamPos.x = _lerp(_chaseCamPos.x, behindX, lerpT);
    _chaseCamPos.y = _lerp(_chaseCamPos.y, behindY, lerpT);
    _chaseCamPos.z = _lerp(_chaseCamPos.z, behindZ, lerpT);

    _camera.position.copy(_chaseCamPos);

    // Look at vehicle with optional mouse-Y pitch offset
    var lookTarget = _vehicleMesh.position.clone();
    lookTarget.y += _mousePitchY * 4;   // slight vertical offset from mouse
    _camera.lookAt(lookTarget);
  }

  // ── Screen shake ──────────────────────────────────────────────
  function _applyScreenShake() {
    if (!_camera) return;
    var hp = window._vehicleHP;
    if (hp < _HP_MAX * 0.5 && Math.abs(_speed) > 1) {
      var mag = 0.003 * Math.abs(_speed);
      _shakeOffsetX = (Math.random() - 0.5) * 2 * mag;
      _shakeOffsetY = (Math.random() - 0.5) * 2 * mag;
      _camera.position.x += _shakeOffsetX;
      _camera.position.y += _shakeOffsetY;
    }
  }

  // ── Physics update ────────────────────────────────────────────
  function _updatePhysics(dt) {
    if (!window._inVehicle || !_vehicleMesh) return;

    // --- Acceleration / braking ---
    if (_keys.w) {
      _speed += ACCEL_RATE * dt;
      if (_speed > MAX_SPEED) _speed = MAX_SPEED;
    } else if (_keys.s) {
      if (_speed > 0) {
        // Braking
        _speed -= BRAKE_RATE * dt;
        if (_speed < 0) _speed = 0;
      } else {
        // Reverse
        _speed -= REVERSE_RATE * dt;
        if (_speed < MAX_REVERSE) _speed = MAX_REVERSE;
      }
    } else {
      // Passive friction
      var fric = FRICTION * dt * _sign(_speed);
      if (Math.abs(fric) >= Math.abs(_speed)) {
        _speed = 0;
      } else {
        _speed -= fric;
      }
    }

    // --- Steering ---
    if (_keys.a) {
      _turnAngle -= STEER_RATE * dt;
      if (_turnAngle < -MAX_STEER) _turnAngle = -MAX_STEER;
    } else if (_keys.d) {
      _turnAngle += STEER_RATE * dt;
      if (_turnAngle > MAX_STEER) _turnAngle = MAX_STEER;
    } else {
      // Self-centre steering
      var ret = STEER_RETURN * dt * _sign(_turnAngle);
      if (Math.abs(ret) >= Math.abs(_turnAngle)) {
        _turnAngle = 0;
      } else {
        _turnAngle -= ret;
      }
    }

    // Angular velocity proportional to speed and steering
    if (Math.abs(_speed) > 0.5) {
      _angularVel = (_turnAngle / MAX_STEER) * (_speed / MAX_SPEED) * 2.2;
    } else {
      _angularVel = 0;
    }
    _yaw += _angularVel * dt;

    // --- Forward velocity in world space ---
    _velocity.set(
      Math.sin(_yaw) * _speed,
      0,
      Math.cos(_yaw) * _speed
    );

    // --- Drift physics ---
    if (Math.abs(_speed) > DRIFT_THRESHOLD && Math.abs(_turnAngle) > 0.05) {
      // Perpendicular (right) direction
      var perpX = Math.cos(_yaw);
      var perpZ = -Math.sin(_yaw);
      var lateralForce = DRIFT_FORCE * _turnAngle * _speed;
      _lateralOffset.x += perpX * lateralForce * dt;
      _lateralOffset.z += perpZ * lateralForce * dt;

      // Decay lateral drift
      _lateralOffset.x *= Math.max(0, 1 - 2.0 * dt);
      _lateralOffset.z *= Math.max(0, 1 - 2.0 * dt);
    } else {
      _lateralOffset.x *= Math.max(0, 1 - 4.0 * dt);
      _lateralOffset.z *= Math.max(0, 1 - 4.0 * dt);
    }

    // --- Collision check ---
    var hitWall = _checkCollision();
    if (hitWall && Math.abs(_speed) > 0.5) {
      _speed = 0;
      _velocity.set(0, 0, 0);
      _lateralOffset.set(0, 0, 0);
      window._vehicleHP -= COLLISION_DMG;
      if (window._vehicleHP < 0) window._vehicleHP = 0;
    }

    // --- Apply movement to mesh ---
    _vehicleMesh.position.x += (_velocity.x + _lateralOffset.x) * dt;
    _vehicleMesh.position.z += (_velocity.z + _lateralOffset.z) * dt;
    _vehicleMesh.rotation.y = -_yaw;

    // Expose speed globally
    window._vehicleSpeed = _speed;
  }

  // ── Public: enterVehicle ──────────────────────────────────────
  function enterVehicle(vehicleMesh) {
    if (window._inVehicle) return;
    _vehicleMesh = vehicleMesh || null;

    if (_camera) {
      _origCamPos = _camera.position.clone();
      _origCamRot = _camera.quaternion.clone();
      if (_vehicleMesh) {
        _chaseCamPos.copy(_vehicleMesh.position);
        _chaseCamPos.y += CHASE_UP;
      }
    }

    _speed      = 0;
    _turnAngle  = 0;
    _angularVel = 0;
    _yaw        = _vehicleMesh ? -_vehicleMesh.rotation.y : 0;
    _velocity.set(0, 0, 0);
    _lateralOffset.set(0, 0, 0);
    _mousePitchY = 0;

    window._inVehicle = true;

    _initAudio();
  }

  // ── Public: exitVehicle ───────────────────────────────────────
  function exitVehicle() {
    if (!window._inVehicle) return;
    window._inVehicle  = false;
    window._vehicleSpeed = 0;
    _speed = 0;

    // Move player to vehicle side
    if (window._player && _vehicleMesh) {
      window._player.position.set(
        _vehicleMesh.position.x + Math.cos(_yaw) * 2.5,
        _vehicleMesh.position.y,
        _vehicleMesh.position.z - Math.sin(_yaw) * 2.5
      );
    }

    // Restore camera
    if (_camera && _origCamPos && _origCamRot) {
      _camera.position.copy(_origCamPos);
      _camera.quaternion.copy(_origCamRot);
    }

    _vehicleMesh = null;
    _mousePitchY = 0;
    _keys.w = _keys.s = _keys.a = _keys.d = _keys.e = false;
  }

  // ── Public: init ─────────────────────────────────────────────
  function init(scene, camera, renderer) {
    _scene    = scene    || null;
    _camera   = camera   || null;
    _renderer = renderer || null;

    // Initialise THREE vectors now that we know THREE is loaded
    _velocity      = new THREE.Vector3();
    _lateralOffset = new THREE.Vector3();
    _chaseCamPos   = new THREE.Vector3();

    window._vehicleHP   = _HP_MAX;
    window._inVehicle   = window._inVehicle   || false;
    window._vehicleSpeed = window._vehicleSpeed || 0;

    _bindInput();

    // Orange smoke light
    if (_scene) {
      _smokeLight = new THREE.PointLight(0xff6600, 0, 12);
      _smokeLight.visible = false;
      _scene.add(_smokeLight);
    }
  }

  // ── Public: update ────────────────────────────────────────────
  function update(dt) {
    if (!dt || dt <= 0) return;

    // E key — exit vehicle (edge-triggered)
    if (_keys.e && !_eKeyWasDown && window._inVehicle) {
      exitVehicle();
    }
    _eKeyWasDown = _keys.e;

    if (!window._inVehicle) {
      _updateAudio(dt);
      _updateSmoke(dt);
      return;
    }

    _updatePhysics(dt);
    _updateCamera(dt);
    _applyScreenShake();
    _updateAudio(dt);
    _updateSmoke(dt);
  }

  // ── Public: reset ─────────────────────────────────────────────
  function reset() {
    exitVehicle();
    window._vehicleHP    = _HP_MAX;
    window._vehicleSpeed = 0;
    _speed      = 0;
    _turnAngle  = 0;
    _angularVel = 0;
    _yaw        = 0;
    if (_velocity)      _velocity.set(0, 0, 0);
    if (_lateralOffset) _lateralOffset.set(0, 0, 0);

    // Clean up smoke particles
    for (var i = 0; i < _smokeParticles.length; i++) {
      var p = _smokeParticles[i];
      if (_scene) _scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    _smokeParticles.length = 0;
    _smokeTimer = 0;
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    init:         init,
    update:       update,
    enterVehicle: enterVehicle,
    exitVehicle:  exitVehicle,
    reset:        reset
  };
})();
