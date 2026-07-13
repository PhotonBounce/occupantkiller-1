/*
 * wingsuit.js — Wingsuit Glide feature module
 * Part of the OccupantKiller FPS project.
 *
 * Integrates with game-manager.js via the same pattern as Grapple:
 *   Wingsuit.init(_scene, _camera)
 *   Wingsuit.update(delta, player, keys)
 *   Wingsuit.reset()
 *   Wingsuit.gravityMultiplier()   → called inside _gravMult calculation
 *   Wingsuit.isActive()
 *
 * window._wingsuitActive is kept in sync for other modules to read.
 */
window.Wingsuit = (function () {
  'use strict';

  /* ── State ─────────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _active   = false;
  var _cooldown = 0;          // seconds remaining before next deploy
  var _glideSpeed = 0;        // current horizontal glide speed (units/s)
  var _roll     = 0;          // current camera roll (radians)
  var _rollTarget = 0;

  /* ── Wingsuit mesh (two flat panels) ───────────────────────────── */
  var _leftPanel  = null;
  var _rightPanel = null;

  /* ── Audio (Web Audio API white-noise wind rush) ───────────────── */
  var _audioCtx   = null;
  var _noiseNode  = null;
  var _noiseGain  = null;
  var _noiseFilter = null;

  /* ── HUD badge element ─────────────────────────────────────────── */
  var _badge = null;

  /* ── Screen vignette element ───────────────────────────────────── */
  var _vignette = null;

  /* ── Constants ─────────────────────────────────────────────────── */
  var GRAVITY_FULL       = 18;       // must match game-manager GRAVITY
  var GRAV_GLIDE_FRAC    = 0.20;     // 20% gravity while gliding
  var MAX_GLIDE_SPEED    = 18;       // units/s
  var ACCEL_RATE         = 4;        // units/s² nose-down acceleration
  var DECEL_RATE         = 2;        // units/s² nose-up deceleration
  var PANEL_OFFSET_X     = 0.72;     // lateral distance from camera centre
  var PANEL_OFFSET_Z     = -0.15;    // slightly forward of camera pivot
  var MAX_ROLL_RAD       = 0.2094;   // ±12°
  var ROLL_SPEED         = 4;        // radians/s
  var DEPLOY_MIN_Y       = 2;        // minimum height above ground
  var LAND_DEPLOY_DIST   = 1;        // auto-land distance from ground
  var COOLDOWN_SECS      = 10;       // seconds after landing

  /* ─────────────────────────────────────────────────────────────── */
  /*  PUBLIC: init                                                    */
  /* ─────────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _createPanels();
    _createHUDBadge();
    _createVignette();
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PUBLIC: reset                                                   */
  /* ─────────────────────────────────────────────────────────────── */
  function reset() {
    _deactivate();
    _cooldown    = 0;
    _glideSpeed  = 0;
    _roll        = 0;
    _rollTarget  = 0;
    window._wingsuitActive = false;
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PUBLIC: isActive                                                */
  /* ─────────────────────────────────────────────────────────────── */
  function isActive() {
    return _active;
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PUBLIC: gravityMultiplier — called by game-manager             */
  /* ─────────────────────────────────────────────────────────────── */
  function gravityMultiplier() {
    return _active ? GRAV_GLIDE_FRAC : 1.0;
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PUBLIC: update                                                  */
  /*    Called every frame by game-manager after physics settle.      */
  /*    player  — the player object (position, velocity, onGround)    */
  /*    keys    — the keys{} object                                   */
  /* ─────────────────────────────────────────────────────────────── */
  function update(delta, player, keys) {
    if (!_scene || !_camera) return;

    /* Cooldown ticker */
    if (_cooldown > 0) {
      _cooldown = Math.max(0, _cooldown - delta);
    }

    /* ── Deploy check (Space pressed while in the air) ── */
    if (!_active && _cooldown <= 0) {
      var aboveGround = _heightAboveGround(player);
      if (keys && keys['Space'] && !player.onGround && aboveGround >= DEPLOY_MIN_Y) {
        _activate(player);
      }
    }

    /* ── Glide update ── */
    if (_active) {
      _updateGlide(delta, player, keys);
    }
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PRIVATE: _activate                                              */
  /* ─────────────────────────────────────────────────────────────── */
  function _activate(player) {
    _active = true;
    window._wingsuitActive = true;

    /* Seed glide speed from current horizontal speed */
    var hSpd = Math.sqrt(
      player.velocity.x * player.velocity.x +
      player.velocity.z * player.velocity.z
    );
    _glideSpeed = Math.min(Math.max(hSpd, 4), MAX_GLIDE_SPEED);

    _showPanels(true);
    _showBadge(true);
    _showVignette(true);
    _startAudio();
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PRIVATE: _deactivate                                            */
  /* ─────────────────────────────────────────────────────────────── */
  function _deactivate() {
    if (!_active) return;
    _active = false;
    window._wingsuitActive = false;
    _roll = 0;
    _rollTarget = 0;
    _showPanels(false);
    _showBadge(false);
    _showVignette(false);
    _stopAudio();
    _cooldown = COOLDOWN_SECS;
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PRIVATE: _updateGlide                                           */
  /* ─────────────────────────────────────────────────────────────── */
  function _updateGlide(delta, player, keys) {
    /* ── Auto-land: within LAND_DEPLOY_DIST of ground ── */
    if (player.onGround || _heightAboveGround(player) < LAND_DEPLOY_DIST) {
      _deactivate();
      return;
    }

    /* ── Pitch-based speed control ─────────────────────
       pitch < 0  = looking down → accelerate
       pitch > 0  = looking up   → decelerate / climb    */
    var pitch = (window.CameraSystem && CameraSystem.getPitch) ? CameraSystem.getPitch() : 0;
    if (pitch < -0.08) {
      /* nose down: accelerate */
      _glideSpeed = Math.min(MAX_GLIDE_SPEED, _glideSpeed + ACCEL_RATE * delta);
    } else if (pitch > 0.08) {
      /* nose up: trade speed for altitude */
      _glideSpeed = Math.max(0, _glideSpeed - DECEL_RATE * delta);
      /* slight upward push proportional to pitch-up and speed */
      player.velocity.y += pitch * _glideSpeed * 0.4 * delta;
    }

    /* ── Horizontal steering (A/D keys → bank roll) ── */
    if (keys && keys['KeyA']) {
      _rollTarget = -MAX_ROLL_RAD;
    } else if (keys && keys['KeyD']) {
      _rollTarget = MAX_ROLL_RAD;
    } else {
      _rollTarget = 0;
    }
    _roll += (_rollTarget - _roll) * Math.min(1, ROLL_SPEED * delta);

    /* Apply camera roll via CameraSystem strafe-tilt hook if available,
       otherwise write directly to euler.z on the camera */
    if (_camera) {
      var euler = new THREE.Euler().setFromQuaternion(_camera.quaternion, 'YXZ');
      euler.z = _roll;
      _camera.quaternion.setFromEuler(euler);
    }

    /* ── Forward thrust — project camera forward onto XZ plane ── */
    var yaw = (window.CameraSystem && CameraSystem.getYaw) ? CameraSystem.getYaw() : 0;
    var fwdX = -Math.sin(yaw);
    var fwdZ = -Math.cos(yaw);

    /* A/D lateral contribution from bank angle */
    var rightX = Math.cos(yaw);
    var rightZ = -Math.sin(yaw);
    var bankTurn = _roll * _glideSpeed * 0.6 * delta;

    player.velocity.x = fwdX * _glideSpeed + rightX * bankTurn;
    player.velocity.z = fwdZ * _glideSpeed + rightZ * bankTurn;

    /* ── Audio volume scales with speed ── */
    if (_noiseGain) {
      var speedFrac = _glideSpeed / MAX_GLIDE_SPEED;
      _noiseGain.gain.setTargetAtTime(speedFrac * 0.18, _audioCtx.currentTime, 0.1);
    }

    /* ── Update panel positions relative to camera ── */
    _updatePanelPositions();
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PRIVATE: _heightAboveGround                                     */
  /* ─────────────────────────────────────────────────────────────── */
  function _heightAboveGround(player) {
    if (!window.VoxelWorld) return player.position.y;
    var solidH = (typeof VoxelWorld.getTopSolidY === 'function')
      ? VoxelWorld.getTopSolidY(player.position.x, player.position.z)
      : VoxelWorld.getTerrainHeight(player.position.x, player.position.z) + 1;
    return player.position.y - (solidH + (player.height || 1.7));
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PRIVATE: panel mesh helpers                                     */
  /* ─────────────────────────────────────────────────────────────── */
  function _createPanels() {
    if (!_scene || !_camera) return;
    if (_leftPanel) return; // already created

    var geo  = new THREE.BoxGeometry(1.2, 0.04, 0.5);
    var mat  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

    _leftPanel  = new THREE.Mesh(geo, mat);
    _rightPanel = new THREE.Mesh(geo, mat);
    _leftPanel.visible  = false;
    _rightPanel.visible = false;

    _scene.add(_leftPanel);
    _scene.add(_rightPanel);
  }

  function _showPanels(visible) {
    if (_leftPanel)  _leftPanel.visible  = visible;
    if (_rightPanel) _rightPanel.visible = visible;
  }

  function _updatePanelPositions() {
    if (!_camera || !_leftPanel || !_rightPanel) return;

    /* Compute world-space right vector from camera */
    var right = new THREE.Vector3(1, 0, 0).applyQuaternion(_camera.quaternion);
    var fwd   = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);

    var lPos = _camera.position.clone()
      .addScaledVector(right, -PANEL_OFFSET_X)
      .addScaledVector(fwd,    PANEL_OFFSET_Z);
    var rPos = _camera.position.clone()
      .addScaledVector(right,  PANEL_OFFSET_X)
      .addScaledVector(fwd,    PANEL_OFFSET_Z);

    _leftPanel.position.copy(lPos);
    _rightPanel.position.copy(rPos);

    /* Match panel rotation to camera */
    _leftPanel.quaternion.copy(_camera.quaternion);
    _rightPanel.quaternion.copy(_camera.quaternion);
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PRIVATE: HUD badge                                              */
  /* ─────────────────────────────────────────────────────────────── */
  function _createHUDBadge() {
    if (_badge) return;
    _badge = document.createElement('div');
    _badge.id = 'wingsuit-badge';
    _badge.textContent = '🦅 WINGSUIT'; /* 🦅 */
    _badge.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(30,80,180,0.82)',
      'color:#cce8ff',
      'font:bold 13px/1 monospace',
      'letter-spacing:2px',
      'padding:5px 14px',
      'border-radius:4px',
      'border:1px solid rgba(120,200,255,0.5)',
      'pointer-events:none',
      'display:none',
      'z-index:9999',
    ].join(';');
    document.body.appendChild(_badge);
  }

  function _showBadge(visible) {
    if (_badge) _badge.style.display = visible ? 'block' : 'none';
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PRIVATE: Screen vignette (blue-white edge)                      */
  /* ─────────────────────────────────────────────────────────────── */
  function _createVignette() {
    if (_vignette) return;
    _vignette = document.createElement('div');
    _vignette.id = 'wingsuit-vignette';
    _vignette.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'background:radial-gradient(ellipse at center, transparent 55%, rgba(100,180,255,0.28) 100%)',
      'display:none',
      'z-index:9998',
    ].join(';');
    document.body.appendChild(_vignette);
  }

  function _showVignette(visible) {
    if (_vignette) _vignette.style.display = visible ? 'block' : 'none';
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  PRIVATE: Wind-rush audio (white noise + low-pass filter)        */
  /* ─────────────────────────────────────────────────────────────── */
  function _startAudio() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_audioCtx.state === 'suspended') _audioCtx.resume();

      /* Generate 2-second white-noise buffer and loop it */
      var bufLen  = _audioCtx.sampleRate * 2;
      var buffer  = _audioCtx.createBuffer(1, bufLen, _audioCtx.sampleRate);
      var data    = buffer.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      _noiseNode = _audioCtx.createBufferSource();
      _noiseNode.buffer = buffer;
      _noiseNode.loop   = true;

      _noiseFilter = _audioCtx.createBiquadFilter();
      _noiseFilter.type            = 'lowpass';
      _noiseFilter.frequency.value = 1200;
      _noiseFilter.Q.value         = 0.8;

      _noiseGain = _audioCtx.createGain();
      _noiseGain.gain.value = 0;

      _noiseNode.connect(_noiseFilter);
      _noiseFilter.connect(_noiseGain);
      _noiseGain.connect(_audioCtx.destination);
      _noiseNode.start();
    } catch (e) {
      /* Audio unavailable — silent fail */
      _audioCtx  = null;
      _noiseNode  = null;
      _noiseGain  = null;
      _noiseFilter = null;
    }
  }

  function _stopAudio() {
    try {
      if (_noiseGain && _audioCtx) {
        _noiseGain.gain.setTargetAtTime(0, _audioCtx.currentTime, 0.15);
      }
      if (_noiseNode) {
        var node = _noiseNode;
        _noiseNode = null;
        setTimeout(function () { try { node.stop(); } catch (e) { /* noop */ } }, 400);
      }
    } catch (e) { /* noop */ }
  }

  /* ─────────────────────────────────────────────────────────────── */
  /*  Public API                                                      */
  /* ─────────────────────────────────────────────────────────────── */
  window._wingsuitActive = false;

  return {
    init:              init,
    update:            update,
    reset:             reset,
    isActive:          isActive,
    gravityMultiplier: gravityMultiplier,
  };
})();
