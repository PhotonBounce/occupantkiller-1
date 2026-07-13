/**
 * RappelSystem — building rappel traversal for the player
 *
 * Public API:
 *   RappelSystem.init()     — registers key handlers and creates HUD elements
 *   RappelSystem.update(dt) — advances rappel state each frame
 *   RappelSystem.reset()    — detaches rope, removes meshes, resets state
 *
 * Global flags:
 *   window._rappelActive  {boolean}  — true while player is rappelling
 */
window.RappelSystem = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var EDGE_DETECT_RADIUS  = 2.2;    // horizontal units from player to count as "near edge"
  var MIN_HEIGHT          = 4;      // player Y must be above this to allow rappel
  var DESCEND_SPEED       = 3;      // units/sec normal descent
  var FAST_SPEED          = 6;      // units/sec when S held
  var MAX_ROPE_LEN        = 20;     // maximum rope length in units
  var ROPE_RADIUS         = 0.025;
  var CAMERA_TILT         = -0.2618; // -15 degrees in radians
  var SWAY_AMPLITUDE      = 0.12;   // X sway amplitude (units)
  var SWAY_FREQUENCY      = 1.4;    // sway oscillation frequency (Hz)
  var ROPE_COLOR          = 0x22cc44;
  var ENEMY_CUT_DIST      = 1.2;    // distance from rope midpoint for enemy bullet to cut it

  // ── State ──────────────────────────────────────────────────────────────────
  var _initialized    = false;
  var _rappelling     = false;
  var _anchorX        = 0;
  var _anchorY        = 0;
  var _anchorZ        = 0;
  var _ropeLength     = 0;         // current deployed length (grows as player descends)
  var _swayTime       = 0;
  var _keyR           = false;
  var _keyS           = false;
  var _keyW           = false;
  var _ropeMesh       = null;
  var _promptEl       = null;
  var _badgeEl        = null;
  var _originalCamTilt = 0;

  // Web Audio
  var _audioCtx       = null;
  var _frictionSrc    = null;
  var _frictionGain   = null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _scene() {
    if (window.scene) return window.scene;
    if (window.GameManager && window.GameManager.scene) return window.GameManager.scene;
    if (window.gameScene) return window.gameScene;
    return null;
  }

  function _camera() {
    if (window.camera) return window.camera;
    if (window.GameManager && window.GameManager.camera) return window.GameManager.camera;
    return null;
  }

  function _playerPos() {
    if (window.player && window.player.position) return window.player.position;
    if (window.GameManager && window.GameManager.player && window.GameManager.player.position) {
      return window.GameManager.player.position;
    }
    if (window.playerObject && window.playerObject.position) return window.playerObject.position;
    return null;
  }

  function _THREE() {
    return window.THREE || null;
  }

  // ── Audio: rope friction (high-pitched scraping noise) ───────────────────
  function _ensureAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _startFriction() {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    _stopFriction();

    var bufferSize = ctx.sampleRate * 2;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    _frictionSrc = ctx.createBufferSource();
    _frictionSrc.buffer = buffer;
    _frictionSrc.loop = true;

    // High-pitched scrape: tight bandpass around 2400 Hz
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;
    bp.Q.value = 3.5;

    // Second harmonic layer
    var bp2 = ctx.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.frequency.value = 4800;
    bp2.Q.value = 5;

    _frictionGain = ctx.createGain();
    _frictionGain.gain.value = 0.09;

    _frictionSrc.connect(bp);
    bp.connect(bp2);
    bp2.connect(_frictionGain);
    _frictionGain.connect(ctx.destination);
    _frictionSrc.start();
  }

  function _stopFriction() {
    if (_frictionSrc) {
      try { _frictionSrc.stop(); } catch (e) {}
      _frictionSrc = null;
    }
    _frictionGain = null;
  }

  function _playSnapSound() {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    // Short crack sound for rope snap / detach
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 180;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  // ── DOM: "PRESS R TO RAPPEL" prompt ──────────────────────────────────────
  function _createPrompt() {
    if (_promptEl) return;
    _promptEl = document.createElement('div');
    _promptEl.id = 'rappel-prompt';
    _promptEl.style.cssText = [
      'position:fixed',
      'bottom:260px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid rgba(80,220,80,0.6)',
      'color:#66ee66',
      'padding:5px 16px',
      'border-radius:5px',
      'font-size:13px',
      'font-family:monospace',
      'z-index:900',
      'pointer-events:none',
      'display:none',
      'letter-spacing:0.08em'
    ].join(';');
    _promptEl.textContent = 'PRESS R TO RAPPEL';
    document.body.appendChild(_promptEl);
  }

  function _showPrompt(show) {
    if (!_promptEl) return;
    _promptEl.style.display = show ? 'block' : 'none';
  }

  // ── DOM: "RAPPELLING" HUD badge ───────────────────────────────────────────
  function _createBadge() {
    if (_badgeEl) return;
    _badgeEl = document.createElement('div');
    _badgeEl.id = 'rappel-badge';
    _badgeEl.style.cssText = [
      'position:fixed',
      'top:72px',
      'right:18px',
      'background:rgba(0,80,0,0.80)',
      'border:1px solid #44ff44',
      'color:#44ff44',
      'padding:3px 11px',
      'border-radius:4px',
      'font-size:12px',
      'font-family:monospace',
      'font-weight:bold',
      'z-index:950',
      'pointer-events:none',
      'display:none',
      'letter-spacing:0.12em'
    ].join(';');
    _badgeEl.textContent = 'RAPPELLING';
    document.body.appendChild(_badgeEl);
  }

  function _showBadge(show) {
    if (!_badgeEl) return;
    _badgeEl.style.display = show ? 'block' : 'none';
  }

  // ── Edge detection ────────────────────────────────────────────────────────
  function _nearEdge(pPos) {
    if (!pPos) return false;
    if (pPos.y <= MIN_HEIGHT) return false;

    var cam = _camera();
    var fwdX = 0, fwdZ = -1;
    if (cam) {
      fwdX = -Math.sin(cam.rotation.y);
      fwdZ = -Math.cos(cam.rotation.y);
    }

    var stepX = pPos.x + fwdX * EDGE_DETECT_RADIUS;
    var stepZ = pPos.z + fwdZ * EDGE_DETECT_RADIUS;

    // Try VoxelWorld height query
    if (window.VoxelWorld && typeof window.VoxelWorld.getHeight === 'function') {
      var edgeH = window.VoxelWorld.getHeight(stepX, stepZ);
      var playerFloorH = window.VoxelWorld.getHeight(pPos.x, pPos.z);
      if (playerFloorH - edgeH > 2) return true;
      return false;
    }

    // Fallback: Three.js Raycaster downward from step position
    var T = _THREE();
    var sc = _scene();
    if (T && sc) {
      var ray = new T.Raycaster(
        new T.Vector3(stepX, pPos.y + 0.5, stepZ),
        new T.Vector3(0, -1, 0),
        0.1,
        6
      );
      var hits = ray.intersectObjects(sc.children, true);
      if (hits.length === 0) return true;
    }

    // Broad fallback: Y high enough
    return pPos.y > MIN_HEIGHT;
  }

  // ── Rope mesh management ──────────────────────────────────────────────────
  function _buildRopeMesh(length) {
    var T = _THREE();
    var sc = _scene();
    if (!T || !sc) return;
    _destroyRopeMesh();
    var geo = new T.CylinderGeometry(ROPE_RADIUS, ROPE_RADIUS, length, 6, 1);
    var mat = new T.MeshLambertMaterial({ color: ROPE_COLOR });
    _ropeMesh = new T.Mesh(geo, mat);
    sc.add(_ropeMesh);
  }

  function _destroyRopeMesh() {
    var sc = _scene();
    if (_ropeMesh && sc) {
      sc.remove(_ropeMesh);
    }
    _ropeMesh = null;
  }

  function _updateRopeMesh(pPos) {
    if (!_ropeMesh || !pPos) return;
    var T = _THREE();
    if (!T) return;

    var swayX = Math.sin(_swayTime * SWAY_FREQUENCY * Math.PI * 2) * SWAY_AMPLITUDE;
    var ax = _anchorX + swayX;
    var ay = _anchorY;
    var az = _anchorZ;

    var dx = pPos.x - ax;
    var dy = pPos.y - ay;
    var dz = pPos.z - az;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.01) return;

    // Rebuild geometry when length changes significantly
    if (Math.abs(len - _ropeLength) > 0.25) {
      _buildRopeMesh(len);
      if (!_ropeMesh) return;
    }

    // Position at midpoint between anchor and player
    _ropeMesh.position.set(
      (ax + pPos.x) * 0.5,
      (ay + pPos.y) * 0.5,
      (az + pPos.z) * 0.5
    );

    // Orient from anchor to player
    var dir = new T.Vector3(dx, dy, dz).normalize();
    var up  = new T.Vector3(0, 1, 0);
    var axis = new T.Vector3();
    axis.crossVectors(up, dir).normalize();
    var angle = Math.acos(Math.max(-1, Math.min(1, up.dot(dir))));
    if (axis.lengthSq() < 0.0001) {
      if (dy < 0) _ropeMesh.rotation.z = Math.PI;
    } else {
      _ropeMesh.setRotationFromAxisAngle(axis, angle);
    }
  }

  // ── Start / Stop rappel ───────────────────────────────────────────────────
  function _startRappel() {
    var pPos = _playerPos();
    if (!pPos) return;
    if (_rappelling) return;

    // Anchor point: just above player at the building edge
    _anchorX = pPos.x;
    _anchorY = pPos.y + 0.5;
    _anchorZ = pPos.z;
    _ropeLength = 0.5;
    _swayTime = 0;
    _rappelling = true;
    window._rappelActive = true;

    _buildRopeMesh(_ropeLength);
    _startFriction();
    _showPrompt(false);
    _showBadge(true);

    // Tilt camera forward -15° for wall-facing view
    var cam = _camera();
    if (cam) {
      _originalCamTilt = cam.rotation.x;
      cam.rotation.x = CAMERA_TILT;
    }
  }

  function _stopRappel(applyGravity) {
    if (!_rappelling) return;
    _rappelling = false;
    window._rappelActive = false;

    _destroyRopeMesh();
    _stopFriction();
    _showBadge(false);

    // Restore camera tilt
    var cam = _camera();
    if (cam) {
      cam.rotation.x = _originalCamTilt;
    }

    if (applyGravity) {
      // Signal to game that player should fall
      if (window.GameManager && typeof window.GameManager.setFalling === 'function') {
        window.GameManager.setFalling(true);
      }
      window._playerFalling = true;
    }
  }

  // ── Enemy rope cutting ────────────────────────────────────────────────────
  function _checkEnemyCut(pPos) {
    if (!_rappelling || !pPos) return;

    var mx = (_anchorX + pPos.x) * 0.5;
    var my = (_anchorY + pPos.y) * 0.5;
    var mz = (_anchorZ + pPos.z) * 0.5;

    var bullets = window._enemyBullets || window._activeBullets || null;
    if (!bullets || !bullets.length) return;

    for (var i = 0; i < bullets.length; i++) {
      var b = bullets[i];
      if (!b || !b.position) continue;
      var dx = b.position.x - mx;
      var dy = b.position.y - my;
      var dz = b.position.z - mz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < ENEMY_CUT_DIST) {
        _playSnapSound();
        _stopRappel(true); // rope cut — player falls
        return;
      }
    }
  }

  // ── Key handlers ──────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.code === 'KeyR') {
      _keyR = true;
      if (!_rappelling) {
        var pPos = _playerPos();
        if (_nearEdge(pPos)) {
          _startRappel();
        }
      }
    }
    if (e.code === 'KeyS') _keyS = true;
    if (e.code === 'KeyW') _keyW = true;
    if (e.code === 'Space' && _rappelling) {
      // Space: detach — player drops
      _playSnapSound();
      _stopRappel(true);
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'KeyR') _keyR = false;
    if (e.code === 'KeyS') _keyS = false;
    if (e.code === 'KeyW') _keyW = false;
  }

  // ── init ──────────────────────────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    _createPrompt();
    _createBadge();
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
    window._rappelActive = false;
  }

  // ── update ────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!_initialized) return;

    var pPos = _playerPos();

    // Show "PRESS R TO RAPPEL" when near edge and at height
    if (!_rappelling) {
      _showPrompt(_nearEdge(pPos));
      return;
    }

    // Block shooting while rappelling
    window._canShoot = false;

    _swayTime += dt;

    // Determine descent speed
    var speed = 0;
    if (_keyR || (!_keyW && _rappelling)) {
      speed = DESCEND_SPEED;
    }
    if (_keyS) {
      speed = FAST_SPEED;
    }
    if (_keyW) {
      speed = 0; // W stops descent
    }

    if (speed > 0 && pPos) {
      pPos.y -= speed * dt;

      // Rope sway: sinusoidal X oscillation
      var swayX = Math.sin(_swayTime * SWAY_FREQUENCY * Math.PI * 2) * SWAY_AMPLITUDE;
      pPos.x = _anchorX + swayX;

      _ropeLength = _anchorY - pPos.y;

      // Enforce max rope length
      if (_ropeLength >= MAX_ROPE_LEN) {
        _ropeLength = MAX_ROPE_LEN;
        pPos.y = _anchorY - MAX_ROPE_LEN;
        _stopRappel(false);
        return;
      }

      // Ground check
      if (pPos.y <= 0.5) {
        pPos.y = 0.5;
        _stopRappel(false);
        return;
      }
    }

    _updateRopeMesh(pPos);
    _checkEnemyCut(pPos);

    // Modulate friction sound volume with speed
    if (_frictionGain) {
      _frictionGain.gain.value = (speed > 0) ? 0.09 : 0.02;
    }

    // Maintain camera tilt
    var cam = _camera();
    if (cam) {
      cam.rotation.x = CAMERA_TILT;
    }
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  function reset() {
    _stopRappel(false);
    _showPrompt(false);
    _showBadge(false);
    _keyR = false;
    _keyS = false;
    _keyW = false;
    _swayTime = 0;
    _ropeLength = 0;
    window._rappelActive = false;
    window._canShoot = true;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
