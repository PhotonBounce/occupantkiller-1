/* ─────────────────────────────────────────────────────────────────────────
   ROPE SWING — pendulum traversal system
   Keys:
     F (near anchor, not prone/dead/in-vehicle) → grab / release rope
   Scroll wheel while attached                  → shorten / lengthen rope
   Physics:
     Sinusoidal pendulum sway while swinging
     Camera leans 8° in swing direction
     Player launches with momentum on release
   Audio:
     60 Hz thump on grab (AudioContext)
     Band-pass white-noise whoosh during swing (volume by speed)
   ──────────────────────────────────────────────────────────────────────── */
window.RopeSwing = (function () {
  'use strict';

  /* ── constants ──────────────────────────────────────────────────── */
  var ANCHOR_COUNT      = 4;
  var GRAB_RADIUS       = 3.0;       // units — proximity trigger
  var ROPE_RADIUS       = 0.03;      // CylinderGeometry radius
  var HOOK_RADIUS       = 0.15;      // SphereGeometry radius
  var HOOK_COLOR        = 0x888888;  // gray
  var ROPE_COLOR        = 0xc8a96e;  // tan
  var CAMERA_LEAN_DEG   = 8;         // degrees
  var CAMERA_LEAN_RAD   = CAMERA_LEAN_DEG * Math.PI / 180;
  var PENDULUM_FREQ     = 0.55;      // Hz — full swing cycle
  var PENDULUM_AMP      = 0.55;      // radians max arc
  var ROPE_LEN_DEFAULT  = 5.0;       // units
  var ROPE_LEN_MIN      = 1.5;
  var ROPE_LEN_MAX      = 12.0;
  var ROPE_SCROLL_STEP  = 0.4;       // length change per scroll tick
  var LAUNCH_SCALE      = 7.0;       // momentum multiplier on release
  var WHOOSH_SPEED_MIN  = 1.5;       // speed below which whoosh is silent
  var WHOOSH_SPEED_MAX  = 9.0;

  /* ── default anchor positions (X, Y, Z) ────────────────────────── */
  var DEFAULT_ANCHORS = [
    [  8, 10,  5 ],
    [ -6, 12, -8 ],
    [ 14,  9, -3 ],
    [ -2,  8, 14 ],
  ];

  /* ── state ──────────────────────────────────────────────────────── */
  var _scene          = null;
  var _camera         = null;
  var _anchors        = [];   // { pos: Vector3, hookMesh: Mesh }
  var _rope           = null; // THREE.Mesh (CylinderGeometry)
  var _activeAnchor   = null; // { pos, hookMesh }
  var _ropeLen        = ROPE_LEN_DEFAULT;
  var _swingTime      = 0;
  var _swingDir       = 1;    // +1 or -1 for initial swing direction
  var _swingAngle     = 0;    // current pendulum angle (radians)
  var _swingVel       = 0;    // angular velocity (radians/sec)
  var _promptEl       = null;
  var _nearAnchor     = null; // anchor currently in range
  var _attached       = false;
  var _audioCtx       = null;
  var _whooshNode     = null; // oscillator / gain node chain
  var _whooshGain     = null;
  var _playerVel      = null; // THREE.Vector3 — velocity on release

  /* ── helpers: scene / camera / player accessors ─────────────────── */
  function _getScene() {
    if (_scene) return _scene;
    if (window.scene) return window.scene;
    if (window.GameManager && window.GameManager.scene) return window.GameManager.scene;
    return null;
  }

  function _getCamera() {
    if (_camera) return _camera;
    if (window.camera) return window.camera;
    if (window.GameManager && window.GameManager.camera) return window.GameManager.camera;
    return null;
  }

  function _getPlayer() {
    if (window.GameManager && window.GameManager._player) return window.GameManager._player;
    if (typeof player !== 'undefined' && player) return player;
    return null;
  }

  function _getPlayerPos() {
    var p = _getPlayer();
    if (p && p.position) return p.position;
    var cam = _getCamera();
    if (cam) return cam.position;
    return null;
  }

  /* ── guard: can player grab? ────────────────────────────────────── */
  function _canGrab() {
    var p = _getPlayer();
    if (!p) return true; // no player state available — allow
    // Prone check
    if (p.prone || p.isProne) return false;
    // Dead check
    if (p.dead || p.isDead || p.health <= 0) return false;
    // Vehicle check
    if (window._inVehicle || (p.inVehicle) || (window.GameManager && window.GameManager._inVehicle)) return false;
    return true;
  }

  /* ── audio ──────────────────────────────────────────────────────── */
  function _ensureAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _playGrabThump() {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) { /* ignore */ }
  }

  function _startWhoosh() {
    var ctx = _ensureAudioCtx();
    if (!ctx || _whooshNode) return;
    try {
      // White noise buffer (1 second, looped)
      var bufLen = ctx.sampleRate;
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      // Band-pass filter centred at 800 Hz — gives "air rushing" quality
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 800;
      bpf.Q.value = 0.8;

      _whooshGain = ctx.createGain();
      _whooshGain.gain.value = 0;

      src.connect(bpf);
      bpf.connect(_whooshGain);
      _whooshGain.connect(ctx.destination);
      src.start();
      _whooshNode = src;
    } catch (e) { /* ignore */ }
  }

  function _stopWhoosh() {
    if (_whooshNode) {
      try { _whooshNode.stop(); } catch (e) { /* ignore */ }
      _whooshNode = null;
      _whooshGain = null;
    }
  }

  function _updateWhooshVolume(speed) {
    if (!_whooshGain) return;
    var t = Math.max(0, Math.min(1, (speed - WHOOSH_SPEED_MIN) / (WHOOSH_SPEED_MAX - WHOOSH_SPEED_MIN)));
    try {
      _whooshGain.gain.setTargetAtTime(t * 0.35, _audioCtx.currentTime, 0.05);
    } catch (e) { /* ignore */ }
  }

  /* ── visuals: build rope mesh ───────────────────────────────────── */
  function _buildRopeMesh(anchorPos, playerPos) {
    var sc = _getScene();
    if (!sc) return;

    _removeRopeMesh();

    var dx = playerPos.x - anchorPos.x;
    var dy = playerPos.y - anchorPos.y;
    var dz = playerPos.z - anchorPos.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || _ropeLen;

    var geo = new THREE.CylinderGeometry(ROPE_RADIUS, ROPE_RADIUS, len, 6, 1);
    var mat = new THREE.MeshBasicMaterial({ color: ROPE_COLOR });
    _rope = new THREE.Mesh(geo, mat);
    _rope.frustumCulled = false;

    // Position at midpoint, orient toward anchor
    _rope.position.set(
      (anchorPos.x + playerPos.x) * 0.5,
      (anchorPos.y + playerPos.y) * 0.5,
      (anchorPos.z + playerPos.z) * 0.5
    );
    _rope.lookAt(anchorPos.x, anchorPos.y, anchorPos.z);
    _rope.rotateX(Math.PI * 0.5);

    sc.add(_rope);
  }

  function _updateRopeMesh(anchorPos, playerPos) {
    if (!_rope) {
      _buildRopeMesh(anchorPos, playerPos);
      return;
    }
    var dx = playerPos.x - anchorPos.x;
    var dy = playerPos.y - anchorPos.y;
    var dz = playerPos.z - anchorPos.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;

    // Rebuild geometry only when length changes significantly (scroll)
    var oldLen = _rope._ropeLen || len;
    if (Math.abs(len - oldLen) > 0.05) {
      if (_rope.geometry) _rope.geometry.dispose();
      _rope.geometry = new THREE.CylinderGeometry(ROPE_RADIUS, ROPE_RADIUS, len, 6, 1);
      _rope._ropeLen = len;
    }

    _rope.position.set(
      (anchorPos.x + playerPos.x) * 0.5,
      (anchorPos.y + playerPos.y) * 0.5,
      (anchorPos.z + playerPos.z) * 0.5
    );
    _rope.lookAt(anchorPos.x, anchorPos.y, anchorPos.z);
    _rope.rotateX(Math.PI * 0.5);
  }

  function _removeRopeMesh() {
    if (_rope) {
      var sc = _getScene();
      if (sc) sc.remove(_rope);
      if (_rope.geometry) _rope.geometry.dispose();
      if (_rope.material) _rope.material.dispose();
      _rope = null;
    }
  }

  /* ── visuals: anchor hooks ──────────────────────────────────────── */
  function _buildAnchorMesh(pos) {
    var sc = _getScene();
    if (!sc) return null;
    var geo = new THREE.SphereGeometry(HOOK_RADIUS, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: HOOK_COLOR });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    sc.add(mesh);
    return mesh;
  }

  /* ── prompt HUD ─────────────────────────────────────────────────── */
  function _buildPrompt() {
    if (_promptEl || typeof document === 'undefined') return;
    _promptEl = document.createElement('div');
    _promptEl.id = 'rope-swing-prompt';
    _promptEl.style.cssText = [
      'position:fixed',
      'bottom:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'color:#e8d8a0',
      'background:rgba(0,0,0,0.55)',
      'padding:5px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9001',
      'display:none',
      'user-select:none',
    ].join(';');
    _promptEl.textContent = 'PRESS F to GRAB ROPE';
    document.body.appendChild(_promptEl);
  }

  function _showPrompt(visible) {
    if (!_promptEl) return;
    _promptEl.style.display = visible ? 'block' : 'none';
  }

  /* ── attach / detach ────────────────────────────────────────────── */
  function _attach(anchor) {
    if (!_canGrab()) return;
    _activeAnchor = anchor;
    _attached = true;
    _swingTime = 0;
    _swingAngle = 0;
    _swingVel = 0;
    _swingDir = 1;
    _playerVel = null;
    window._ropeSwingActive = true;
    _showPrompt(false);

    var playerPos = _getPlayerPos();
    if (playerPos) {
      var aPos = anchor.pos;
      var dx = playerPos.x - aPos.x;
      var dz = playerPos.z - aPos.z;
      _ropeLen = Math.min(ROPE_LEN_MAX, Math.max(ROPE_LEN_MIN,
        Math.sqrt(dx * dx + (playerPos.y - aPos.y) * (playerPos.y - aPos.y) + dz * dz)));
      _buildRopeMesh(aPos, playerPos);
    }

    _playGrabThump();
    _startWhoosh();
  }

  function _detach() {
    if (!_attached) return;

    // Compute launch velocity from pendulum angular velocity
    var cam = _getCamera();
    if (cam) {
      // Swing direction: camera's local X axis lean direction
      var speed = Math.abs(_swingVel) * _ropeLen;
      var swingRight = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      var swingFwd   = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      // Blend: lateral + slight upward kick
      _playerVel = new THREE.Vector3(
        swingRight.x * _swingVel * _ropeLen * LAUNCH_SCALE * 0.6 + swingFwd.x * speed * 0.4,
        Math.abs(_swingVel) * _ropeLen * LAUNCH_SCALE * 0.5,
        swingRight.z * _swingVel * _ropeLen * LAUNCH_SCALE * 0.6 + swingFwd.z * speed * 0.4
      );
      // Push back into GameManager player velocity
      var gm = window.GameManager;
      if (gm && gm._player && gm._player.velocity) {
        gm._player.velocity.copy(_playerVel);
      } else {
        var pl = _getPlayer();
        if (pl && pl.velocity) pl.velocity.copy(_playerVel);
      }
    }

    // Restore camera roll
    if (cam) cam.rotation.z = 0;

    _activeAnchor = null;
    _attached = false;
    window._ropeSwingActive = false;
    _removeRopeMesh();
    _stopWhoosh();
  }

  /* ── key and scroll events ──────────────────────────────────────── */
  function _onKeyDown(e) {
    if (e.code !== 'KeyF') return;
    if (_attached) {
      _detach();
    } else if (_nearAnchor && _canGrab()) {
      _attach(_nearAnchor);
    }
  }

  function _onWheel(e) {
    if (!_attached) return;
    e.preventDefault();
    var delta = e.deltaY > 0 ? ROPE_SCROLL_STEP : -ROPE_SCROLL_STEP;
    _ropeLen = Math.min(ROPE_LEN_MAX, Math.max(ROPE_LEN_MIN, _ropeLen + delta));
  }

  /* ── pendulum physics helper ────────────────────────────────────── */
  function _stepPendulum(dt) {
    // Simple pendulum: alpha = -(g/L) * sin(theta)
    // Use g=9.8 for natural feel, damped slightly
    var g = 9.8;
    var damping = 0.015;
    var alpha = -(g / _ropeLen) * Math.sin(_swingAngle) - damping * _swingVel;
    _swingVel += alpha * dt;
    _swingAngle += _swingVel * dt;
    _swingTime += dt;
  }

  /* ── public: init ───────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene = scene || null;
    _camera = camera || null;
    _attached = false;
    _activeAnchor = null;
    _nearAnchor = null;
    _swingTime = 0;
    _swingAngle = 0;
    _swingVel = 0;
    window._ropeSwingActive = false;

    _buildPrompt();

    // Register input events
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('wheel', _onWheel, { passive: false });

    // Spawn default anchors (deferred so scene is ready)
    _spawnAnchors();
  }

  function _spawnAnchors() {
    var sc = _getScene();
    // If scene not ready yet, defer
    if (!sc) {
      setTimeout(_spawnAnchors, 500);
      return;
    }
    // Clear any existing anchors
    for (var i = 0; i < _anchors.length; i++) {
      if (_anchors[i].hookMesh) sc.remove(_anchors[i].hookMesh);
    }
    _anchors = [];

    for (var j = 0; j < DEFAULT_ANCHORS.length; j++) {
      var posArr = DEFAULT_ANCHORS[j];
      var posVec = new THREE.Vector3(posArr[0], posArr[1], posArr[2]);
      var mesh = _buildAnchorMesh(posArr);
      _anchors.push({ pos: posVec, hookMesh: mesh });
    }
  }

  /* ── public: update ─────────────────────────────────────────────── */
  function update(dt) {
    if (!dt || dt <= 0) return;

    var playerPos = _getPlayerPos();
    var cam = _getCamera();

    // — Proximity detection for prompt —
    _nearAnchor = null;
    if (playerPos && !_attached) {
      for (var i = 0; i < _anchors.length; i++) {
        var a = _anchors[i];
        var dist = playerPos.distanceTo(a.pos);
        if (dist <= GRAB_RADIUS) {
          _nearAnchor = a;
          break;
        }
      }
      _showPrompt(_nearAnchor !== null && _canGrab());
    }

    if (!_attached || !_activeAnchor) return;

    // — Pendulum physics step —
    _stepPendulum(dt);

    // — Update player position along pendulum arc —
    if (playerPos) {
      var anchor = _activeAnchor.pos;
      // Swing in the horizontal plane (XZ), angle from the vertical
      // The pendulum axis is the camera's right vector projected to XZ
      var swingAxis = new THREE.Vector3(1, 0, 0);
      if (cam) {
        swingAxis.set(1, 0, 0).applyQuaternion(cam.quaternion);
        swingAxis.y = 0;
        if (swingAxis.length() > 0.001) swingAxis.normalize();
      }

      // Desired player position: anchor + pendulum offset
      var fwdAxis = new THREE.Vector3(0, 0, -1);
      if (cam) {
        fwdAxis.set(0, 0, -1).applyQuaternion(cam.quaternion);
        fwdAxis.y = 0;
        if (fwdAxis.length() > 0.001) fwdAxis.normalize();
      }

      // Pendulum position: rotate downward vector by _swingAngle around fwdAxis
      var down = new THREE.Vector3(0, -1, 0);
      var swingOffsetDir = down.clone().applyAxisAngle(fwdAxis, _swingAngle);
      var targetPos = anchor.clone().addScaledVector(swingOffsetDir, _ropeLen);

      // Smoothly move player toward pendulum target
      var lerpFactor = Math.min(1, dt * 12);
      playerPos.lerp(targetPos, lerpFactor);

      // Update rope visual
      _updateRopeMesh(anchor, playerPos);

      // — Camera lean —
      if (cam) {
        var leanDir = Math.sign(_swingVel) * _swingAngle;
        var leanAmt = Math.max(-CAMERA_LEAN_RAD, Math.min(CAMERA_LEAN_RAD, leanDir * CAMERA_LEAN_RAD));
        cam.rotation.z += (leanAmt - cam.rotation.z) * Math.min(1, dt * 5);
      }

      // — Whoosh volume by speed —
      var angSpeed = Math.abs(_swingVel) * _ropeLen;
      _updateWhooshVolume(angSpeed);
    }
  }

  /* ── public: reset ──────────────────────────────────────────────── */
  function reset() {
    _detach();
    _stopWhoosh();
    _showPrompt(false);
    _nearAnchor = null;
    _swingTime = 0;
    _swingAngle = 0;
    _swingVel = 0;
    window._ropeSwingActive = false;
    // Remove and re-spawn anchor hooks
    var sc = _getScene();
    for (var i = 0; i < _anchors.length; i++) {
      if (_anchors[i].hookMesh && sc) sc.remove(_anchors[i].hookMesh);
    }
    _anchors = [];
    _spawnAnchors();
  }

  /* ── public API ─────────────────────────────────────────────────── */
  return {
    init: init,
    update: update,
    reset: reset,
  };
})();
