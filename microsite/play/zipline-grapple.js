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
