/* ============================================================
 *  GRAPPLE-HOOK.JS — Advanced grapple hook with pendulum swing
 *  physics and zipline mode
 *  Module: window.GrappleHook
 * ============================================================ */
window.GrappleHook = (function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────
  var CFG = {
    HOOK_SPEED: 30,           // units/s projectile travel speed
    MAX_RANGE: 25,            // max grapple range
    GRAVITY: -20,             // gravity acceleration (units/s²)
    SWING_DAMPING: 0.98,      // velocity damping per frame during swing
    MIN_ROPE: 3,              // minimum rope length (reel in limit)
    MAX_ROPE: 30,             // maximum rope length (reel out limit)
    REEL_SPEED: 4,            // units/s reel speed on scroll
    ZIPLINE_THRESHOLD: 5,     // height diff to trigger zipline mode
    ZIPLINE_DURATION: 2.5,    // seconds to travel to anchor on zipline
    WALL_RUN_ANGLE: 30,       // degrees — angle threshold to trigger wall-run
    CHECK_INTERVAL: 0.1,      // seconds between anchor-check samples
    WALL_HIT_SPEED: 6         // speed (units/s) considered a wall hit
  };

  // ── State ───────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;

  var _active = false;           // hook in flight or anchored
  var _anchored = false;         // hook has found a solid point

  // Hook projectile
  var _hookMesh = null;
  var _hookPos = null;           // THREE.Vector3 current position
  var _hookDir = null;           // THREE.Vector3 unit direction
  var _hookDistTraveled = 0;
  var _lastCheckPos = null;      // THREE.Vector3 position at last interval check

  // Rope & anchor
  var _ropeLine = null;          // THREE.Line visual
  var _anchorPos = null;         // THREE.Vector3 anchor point in world space
  var _ropeLength = 0;

  // Swing physics
  var _swingVelocity = null;     // THREE.Vector3 velocity during swing
  var _swingActive = false;

  // Zipline
  var _ziplineActive = false;
  var _ziplineTimer = 0;
  var _ziplineStart = null;      // THREE.Vector3

  // Reticle
  var _reticleMesh = null;

  // Scroll wheel tracking
  var _scrollDelta = 0;

  // Timer accumulator for check intervals
  var _checkTimer = 0;

  // Audio context (lazy)
  var _audioCtx = null;

  // ── Internal helpers ────────────────────────────────────────

  function _getScene() {
    return _scene || window._gameScene || null;
  }

  function _getCamera() {
    return _camera || window._camera || null;
  }

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window._audioCtx = _audioCtx;
      } catch (e) { /* audio not available */ }
    }
    return _audioCtx;
  }

  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
  }

  // ── Audio synthesis helpers ──────────────────────────────────

  function _playTone(frequency, type, duration, gain, detune) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gainNode = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = frequency;
      if (detune) osc.detune.value = detune;
      gainNode.gain.setValueAtTime(gain || 0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) { /* audio error */ }
  }

  function _playNoise(duration, gain) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufferSize = Math.floor(ctx.sampleRate * duration);
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      var source = ctx.createBufferSource();
      var gainNode = ctx.createGain();
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      source.buffer = buffer;
      gainNode.gain.setValueAtTime(gain || 0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(ctx.currentTime);
    } catch (e) { /* audio error */ }
  }

  function _soundMetallicClunk() {
    // Metallic clunk on attach: short percussive metallic tone
    _playTone(180, 'sawtooth', 0.12, 0.4);
    _playTone(90, 'square', 0.18, 0.2);
    _playNoise(0.08, 0.25);
  }

  function _soundWhoosh() {
    // Whoosh during swing: noise sweep
    _playNoise(0.3, 0.15);
    _playTone(300, 'sine', 0.3, 0.1, -400);
  }

  function _soundThud() {
    // Thud on wall hit
    _playTone(60, 'sine', 0.2, 0.5);
    _playNoise(0.15, 0.3);
  }

  // ── Scene object builders ────────────────────────────────────

  function _buildHookMesh() {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    var geo = new THREE.SphereGeometry(0.08, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xc0c0c0 });  // silver
    var mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return mesh;
  }

  function _buildRopeLine(startPos, endPos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    var points = [startPos.clone(), endPos.clone()];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0x999999 });  // silver-gray
    var line = new THREE.Line(geo, mat);
    scene.add(line);
    return line;
  }

  function _updateRopeLine() {
    var cam = _getCamera();
    if (!_ropeLine || !cam || !_anchorPos) return;
    var start = cam.position.clone();
    var end = _anchorPos.clone();
    var points = [start, end];
    _ropeLine.geometry.setFromPoints(points);
    _ropeLine.geometry.attributes.position.needsUpdate = true;
  }

  function _updateHookRopeTrail() {
    // While hook is in flight, update rope from camera to hook position
    var cam = _getCamera();
    if (!_ropeLine || !cam || !_hookPos) return;
    var start = cam.position.clone();
    var end = _hookPos.clone();
    var points = [start, end];
    _ropeLine.geometry.setFromPoints(points);
    _ropeLine.geometry.attributes.position.needsUpdate = true;
  }

  function _buildReticle(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    var geo = new THREE.SphereGeometry(0.15, 6, 6);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      wireframe: true
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return mesh;
  }

  function _removeFromScene(obj) {
    if (!obj) return;
    var scene = _getScene();
    if (scene) scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  }

  // ── Anchor detection ─────────────────────────────────────────
  // Simple solid-point check: compare current hookPos against last check pos.
  // If distance traveled since last check > 1 unit, assume solid contact.
  // Real games would use raycasting; here we sample at intervals and check
  // if the hook has stopped advancing (or we can do terrain/voxel lookup).

  function _checkAnchorHit() {
    var cam = _getCamera();
    if (!_hookPos || !cam) return false;

    // Check max range
    var distFromCam = cam.position.distanceTo(_hookPos);
    if (distFromCam >= CFG.MAX_RANGE) {
      return true; // attach at max range point
    }

    // Check voxel/terrain collision via optional globals
    if (window._voxelWorld && window._voxelWorld.isSolid) {
      var bx = Math.floor(_hookPos.x);
      var by = Math.floor(_hookPos.y);
      var bz = Math.floor(_hookPos.z);
      if (window._voxelWorld.isSolid(bx, by, bz)) {
        return true;
      }
    }

    // Check collision with scene objects via optional collision map
    if (window._solidObjects && Array.isArray(window._solidObjects)) {
      for (var i = 0; i < window._solidObjects.length; i++) {
        var obj = window._solidObjects[i];
        if (!obj || !obj.position) continue;
        var dist = _hookPos.distanceTo(obj.position);
        var size = (obj.userData && obj.userData.size) ? obj.userData.size : 1.0;
        if (dist < size) return true;
      }
    }

    return false;
  }

  // ── Swing physics update ──────────────────────────────────────

  function _updateSwing(dt) {
    var cam = _getCamera();
    if (!cam || !_anchorPos || !_swingVelocity) return;

    // Apply gravity
    _swingVelocity.y += CFG.GRAVITY * dt;

    // Apply WASD player swing control
    var wasdForce = 8;
    if (window._keys) {
      if (window._keys['KeyW'] || window._keys['ArrowUp']) {
        // Swing forward relative to camera yaw
        var fwd = new THREE.Vector3(
          -Math.sin(cam.rotation.y),
          0,
          -Math.cos(cam.rotation.y)
        );
        _swingVelocity.addScaledVector(fwd, wasdForce * dt);
      }
      if (window._keys['KeyS'] || window._keys['ArrowDown']) {
        var back = new THREE.Vector3(
          Math.sin(cam.rotation.y),
          0,
          Math.cos(cam.rotation.y)
        );
        _swingVelocity.addScaledVector(back, wasdForce * dt);
      }
      if (window._keys['KeyA'] || window._keys['ArrowLeft']) {
        var left = new THREE.Vector3(
          -Math.cos(cam.rotation.y),
          0,
          Math.sin(cam.rotation.y)
        );
        _swingVelocity.addScaledVector(left, wasdForce * dt);
      }
      if (window._keys['KeyD'] || window._keys['ArrowRight']) {
        var right = new THREE.Vector3(
          Math.cos(cam.rotation.y),
          0,
          -Math.sin(cam.rotation.y)
        );
        _swingVelocity.addScaledVector(right, wasdForce * dt);
      }
    }

    // Integrate position
    var newPos = cam.position.clone().addScaledVector(_swingVelocity, dt);

    // Pendulum constraint: clamp to sphere of radius _ropeLength from anchor
    var toPlayer = newPos.clone().sub(_anchorPos);
    var dist = toPlayer.length();
    if (dist > _ropeLength) {
      // Project velocity onto tangent (remove radial component)
      var radialDir = toPlayer.clone().normalize();
      var radialSpeed = _swingVelocity.dot(radialDir);
      if (radialSpeed > 0) {
        _swingVelocity.addScaledVector(radialDir, -radialSpeed);
      }
      // Re-constrain position
      toPlayer.setLength(_ropeLength);
      newPos.copy(_anchorPos).add(toPlayer);
    }

    // Apply damping
    _swingVelocity.multiplyScalar(CFG.SWING_DAMPING);

    // Apply position
    cam.position.copy(newPos);

    // Expose velocity to game globals
    window._grappleForceX = _swingVelocity.x;
    window._grappleForceY = _swingVelocity.y;
    window._grappleForceZ = _swingVelocity.z;

    // Sync player velocity globals
    if (window._playerVelocityX !== undefined) window._playerVelocityX = _swingVelocity.x;
    if (window._playerVelocityY !== undefined) window._playerVelocityY = _swingVelocity.y;
    if (window._playerVelocityZ !== undefined) window._playerVelocityZ = _swingVelocity.z;

    // Wall-run check: if swinging into a wall at shallow angle
    _checkWallImpact();

    // Whoosh audio periodically (tied to swing speed)
    var speed = _swingVelocity.length();
    if (speed > CFG.WALL_HIT_SPEED * 0.5 && Math.random() < 0.02) {
      _soundWhoosh();
    }
  }

  function _checkWallImpact() {
    // If there's a voxel system, check if the camera position is near solid
    var cam = _getCamera();
    if (!cam || !window._voxelWorld || !window._voxelWorld.isSolid) return;
    if (!_swingVelocity) return;

    var speed = _swingVelocity.length();
    if (speed < CFG.WALL_HIT_SPEED) return;

    var velDir = _swingVelocity.clone().normalize();
    var bx = Math.floor(cam.position.x + velDir.x * 0.6);
    var by = Math.floor(cam.position.y);
    var bz = Math.floor(cam.position.z + velDir.z * 0.6);

    if (window._voxelWorld.isSolid(bx, by, bz)) {
      // Compute angle between velocity and wall normal (approximate)
      // A wall face's normal would be one of ±X or ±Z
      // If velocity is nearly parallel to wall (angle < 30°), trigger wall-run
      var velXZ = new THREE.Vector2(velDir.x, velDir.z);
      var wallNormals = [
        new THREE.Vector2(1, 0),
        new THREE.Vector2(-1, 0),
        new THREE.Vector2(0, 1),
        new THREE.Vector2(0, -1)
      ];
      for (var i = 0; i < wallNormals.length; i++) {
        var cosA = velXZ.dot(wallNormals[i]);
        var angleDeg = Math.acos(Math.max(-1, Math.min(1, cosA))) * (180 / Math.PI);
        if (angleDeg < (90 - CFG.WALL_RUN_ANGLE)) {
          // Nearly parallel to wall — trigger wall-run
          window._wallRunActive = true;
          _soundThud();
          _toast('Wall-run triggered!');
          return;
        }
      }
      // Direct impact
      _soundThud();
    }
  }

  // ── Zipline update ───────────────────────────────────────────

  function _updateZipline(dt) {
    var cam = _getCamera();
    if (!cam || !_anchorPos || !_ziplineStart) return;

    _ziplineTimer += dt;
    var t = Math.min(1, _ziplineTimer / CFG.ZIPLINE_DURATION);

    // Lerp from start to anchor
    var newPos = new THREE.Vector3().lerpVectors(_ziplineStart, _anchorPos, t);
    cam.position.copy(newPos);

    // Set player velocity to match direction
    var dir = _anchorPos.clone().sub(_ziplineStart).normalize();
    var speed = _anchorPos.distanceTo(_ziplineStart) / CFG.ZIPLINE_DURATION;
    _swingVelocity = dir.clone().multiplyScalar(speed);

    window._grappleForceX = _swingVelocity.x;
    window._grappleForceY = _swingVelocity.y;
    window._grappleForceZ = _swingVelocity.z;

    if (t >= 1) {
      // Arrived at anchor
      _ziplineActive = false;
      _toast('Zipline complete!');
      release();
    }
  }

  // ── Check if zipline conditions met ─────────────────────────

  function _tryStartZipline() {
    var cam = _getCamera();
    if (!cam || !_anchorPos) return false;

    var heightDiff = _anchorPos.y - cam.position.y;
    if (heightDiff < CFG.ZIPLINE_THRESHOLD) return false;

    // Check if player is moving toward anchor
    var toAnchor = _anchorPos.clone().sub(cam.position).normalize();
    var velX = window._playerVelocityX || 0;
    var velZ = window._playerVelocityZ || 0;
    var playerMoveDir = new THREE.Vector3(velX, 0, velZ);

    if (playerMoveDir.length() < 0.1) {
      // Even without movement, if anchor is above us and grapple is active
      // start zipline
      _ziplineActive = true;
      _ziplineTimer = 0;
      _ziplineStart = cam.position.clone();
      _toast('Zipline mode!');
      return true;
    }

    playerMoveDir.normalize();
    var dot = toAnchor.dot(playerMoveDir);
    if (dot > 0.5) {
      _ziplineActive = true;
      _ziplineTimer = 0;
      _ziplineStart = cam.position.clone();
      _toast('Zipline mode!');
      return true;
    }

    return false;
  }

  // ── Reel in / out ────────────────────────────────────────────

  function _processScroll(dt) {
    if (_scrollDelta === 0) return;
    if (!_anchored) return;

    var change = _scrollDelta * CFG.REEL_SPEED * dt;
    _ropeLength -= change;  // scroll up (positive delta) = reel in (shorten)
    _ropeLength = Math.max(CFG.MIN_ROPE, Math.min(CFG.MAX_ROPE, _ropeLength));
    _scrollDelta = 0;
  }

  // ── Public API ───────────────────────────────────────────────

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;

    // Key listener for G (fire/release) and Space (release)
    document.addEventListener('keydown', _onKeyDown);

    // Scroll wheel listener for reel in/out
    window.addEventListener('wheel', _onWheel, { passive: true });

    if (window.__QA_MODE || window.__DEBUG_GRAPPLE) {
      console.log('[GrappleHook] initialized');
    }
  }

  function _onKeyDown(e) {
    if (e.code === 'KeyG') {
      // G key: fire or release
      if (_active) {
        release();
      } else {
        // Only fire if not mounted in tank
        if (!window._tankMounted) {
          fire();
        }
      }
    }
    if (e.code === 'Space' && _active) {
      release();
    }
  }

  function _onWheel(e) {
    // positive deltaY = scroll down = pay out rope
    // negative deltaY = scroll up = reel in
    if (_anchored) {
      _scrollDelta += e.deltaY > 0 ? -1 : 1;
    }
  }

  function fire() {
    var cam = _getCamera();
    var scene = _getScene();
    if (!cam || !scene || typeof THREE === 'undefined') return;

    // Already active — release first
    if (_active) {
      release();
      return;
    }

    _active = true;
    _anchored = false;
    _swingActive = false;
    _ziplineActive = false;
    _hookDistTraveled = 0;
    _checkTimer = 0;

    // Get look direction from camera
    _hookDir = new THREE.Vector3(0, 0, -1);
    _hookDir.applyQuaternion(cam.quaternion).normalize();

    // Start hook at camera position
    _hookPos = cam.position.clone();
    _lastCheckPos = _hookPos.clone();

    // Create hook projectile mesh
    _hookMesh = _buildHookMesh();
    if (_hookMesh) {
      _hookMesh.position.copy(_hookPos);
    }

    // Create initial rope line (from camera to hook)
    _ropeLine = _buildRopeLine(cam.position, _hookPos);

    _toast('Grapple fired!');
  }

  function release() {
    var cam = _getCamera();

    // Transfer swing momentum to player
    if (_swingVelocity && cam) {
      var momentum = _swingVelocity.clone();
      window._playerVelocityX = (window._playerVelocityX || 0) + momentum.x * 0.5;
      window._playerVelocityY = (window._playerVelocityY || 0) + momentum.y * 0.5;
      window._playerVelocityZ = (window._playerVelocityZ || 0) + momentum.z * 0.5;
    }

    // Clear forces
    window._grappleForceX = 0;
    window._grappleForceY = 0;
    window._grappleForceZ = 0;

    // Remove scene objects
    _removeFromScene(_hookMesh);
    _removeFromScene(_ropeLine);
    _removeFromScene(_reticleMesh);

    _hookMesh = null;
    _ropeLine = null;
    _reticleMesh = null;
    _hookPos = null;
    _hookDir = null;
    _anchorPos = null;
    _swingVelocity = null;
    _lastCheckPos = null;
    _ziplineStart = null;

    _active = false;
    _anchored = false;
    _swingActive = false;
    _ziplineActive = false;
    _hookDistTraveled = 0;
    _ropeLength = 0;
    _checkTimer = 0;
    _scrollDelta = 0;
  }

  function reset() {
    release();
  }

  function update(dt) {
    if (!dt || dt <= 0 || dt > 1) dt = 0.016;
    if (!_active) return;

    var cam = _getCamera();
    if (!cam) return;

    // ── Hook in flight ───────────────────────────────────────
    if (!_anchored) {
      // Advance hook position
      _hookPos.addScaledVector(_hookDir, CFG.HOOK_SPEED * dt);
      _hookDistTraveled += CFG.HOOK_SPEED * dt;

      // Update hook mesh
      if (_hookMesh) {
        _hookMesh.position.copy(_hookPos);
      }

      // Update rope trail
      _updateHookRopeTrail();

      // Check anchor at intervals
      _checkTimer += dt;
      if (_checkTimer >= CFG.CHECK_INTERVAL) {
        _checkTimer = 0;
        var distSinceCheck = _hookPos.distanceTo(_lastCheckPos);
        if (distSinceCheck > 1.0) {
          if (_checkAnchorHit()) {
            _doAnchor();
            return;
          }
        }
        _lastCheckPos.copy(_hookPos);
      }

      // Max range reached — auto-anchor at current position
      var distFromCam = cam.position.distanceTo(_hookPos);
      if (distFromCam >= CFG.MAX_RANGE) {
        _doAnchor();
      }

      return;
    }

    // ── Hook anchored ────────────────────────────────────────

    // Process scroll wheel reel in/out
    _processScroll(dt);

    if (_ziplineActive) {
      _updateZipline(dt);
      _updateRopeLine();
      return;
    }

    if (_swingActive) {
      _updateSwing(dt);
      _updateRopeLine();

      // Pulse reticle
      if (_reticleMesh) {
        _reticleMesh.rotation.y += dt * 2;
      }
    }
  }

  function _doAnchor() {
    var cam = _getCamera();
    if (!cam) return;

    _anchored = true;
    _anchorPos = _hookPos.clone();
    _ropeLength = cam.position.distanceTo(_anchorPos);

    // Remove flying hook mesh, keep rope
    _removeFromScene(_hookMesh);
    _hookMesh = null;

    // Rebuild rope from camera to anchor
    _removeFromScene(_ropeLine);
    _ropeLine = _buildRopeLine(cam.position, _anchorPos);

    // Reticle at impact point
    _removeFromScene(_reticleMesh);
    _reticleMesh = _buildReticle(_anchorPos);

    // Initialize swing velocity from player's current velocity
    _swingVelocity = new THREE.Vector3(
      window._playerVelocityX || 0,
      window._playerVelocityY || 0,
      window._playerVelocityZ || 0
    );

    // Try zipline first
    if (_tryStartZipline()) {
      _soundMetallicClunk();
      return;
    }

    // Otherwise swing
    _swingActive = true;
    _soundMetallicClunk();
    _toast('Grapple anchored! Swinging...');
  }

  // ── Public return ────────────────────────────────────────────
  return {
    init: init,
    update: update,
    fire: fire,
    release: release,
    reset: reset
  };

})();
