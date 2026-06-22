/**
 * ZiplineSystem — player zipline traversal between map anchor points
 *
 * Public API:
 *   ZiplineSystem.init()                                 — spawns 3 default ziplines, registers key handler
 *   ZiplineSystem.update(dt)                             — advances player along active zipline
 *   ZiplineSystem.addZipline(sx,sy,sz, ex,ey,ez)        — creates a zipline rope between two anchors
 *   ZiplineSystem.reset()                                — removes all zipline meshes and resets state
 *
 * Global flags:
 *   window._onZipline   {boolean}  — true while player is riding a zipline
 *   window._cameraShake {intensity, duration}  — triggers camera shake on landing
 */
window.ZiplineSystem = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var MAX_ZIPLINES       = 4;
  var ATTACH_RADIUS      = 1.5;   // units — how close to start before Z attaches
  var TRAVEL_SPEED_FLAT  = 8;     // units/sec
  var TRAVEL_SPEED_STEEP = 12;    // units/sec when Y drop > 5
  var STEEP_Y_THRESHOLD  = 5;     // units of Y drop to trigger speed boost
  var CAMERA_LEAN        = 0.1;   // radians of camera roll while riding
  var ROPE_RADIUS        = 0.03;
  var POST_RADIUS        = 0.05;
  var POST_HEIGHT        = 0.5;
  var HANDLE_W           = 0.2;
  var HANDLE_H           = 0.1;
  var HANDLE_D           = 0.3;
  var LAND_SHAKE_INT     = 0.3;
  var LAND_SHAKE_DUR     = 0.2;

  // ── State ──────────────────────────────────────────────────────────────────
  var _ziplines      = [];   // array of zipline data objects
  var _attached      = false;
  var _activeZip     = null;
  var _progress      = 0;    // 0..1 along the rope
  var _speed         = 0;
  var _handleMesh    = null;
  var _promptEl      = null;
  var _initialized   = false;

  // Web Audio
  var _audioCtx      = null;
  var _whishSource   = null;
  var _whishGain     = null;

  // ── Helpers: check Three.js and scene ────────────────────────────────────
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

  // ── Audio: whoosh (band-pass noise) ──────────────────────────────────────
  function _ensureAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
    return _audioCtx;
  }

  function _startWhoosh() {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    _stopWhoosh();

    var bufferSize = ctx.sampleRate * 2;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    _whishSource = ctx.createBufferSource();
    _whishSource.buffer = buffer;
    _whishSource.loop = true;

    var bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 800;
    bandpass.Q.value = 0.8;

    _whishGain = ctx.createGain();
    _whishGain.gain.value = 0.18;

    _whishSource.connect(bandpass);
    bandpass.connect(_whishGain);
    _whishGain.connect(ctx.destination);
    _whishSource.start();
  }

  function _stopWhoosh() {
    if (_whishSource) {
      try { _whishSource.stop(); } catch (e) {}
      _whishSource = null;
    }
  }

  function _playDing() {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1100;
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  // ── DOM prompt ────────────────────────────────────────────────────────────
  function _createPrompt() {
    if (_promptEl) return;
    _promptEl = document.createElement('div');
    _promptEl.id = 'zipline-prompt';
    _promptEl.style.cssText = [
      'position:fixed',
      'bottom:220px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'border:1px solid rgba(100,200,255,0.6)',
      'color:#88ddff',
      'padding:5px 16px',
      'border-radius:5px',
      'font-size:13px',
      'font-family:monospace',
      'z-index:900',
      'pointer-events:none',
      'display:none',
      'letter-spacing:0.08em'
    ].join(';');
    _promptEl.innerHTML = '&#9660; [Z] Zipline';
    document.body.appendChild(_promptEl);
  }

  function _showPrompt(show) {
    if (!_promptEl) return;
    _promptEl.style.display = show ? 'block' : 'none';
  }

  // ── Geometry helpers ──────────────────────────────────────────────────────
  function _makeMaterial(color) {
    var T = _THREE();
    if (!T) return null;
    return new T.MeshLambertMaterial({ color: color });
  }

  function _addMesh(geo, mat, sc) {
    var T = _THREE();
    if (!T) return null;
    var mesh = new T.Mesh(geo, mat);
    sc.add(mesh);
    return mesh;
  }

  // ── addZipline ────────────────────────────────────────────────────────────
  function addZipline(sx, sy, sz, ex, ey, ez) {
    if (_ziplines.length >= MAX_ZIPLINES) {
      console.warn('[ZiplineSystem] Max ziplines reached (' + MAX_ZIPLINES + ')');
      return;
    }
    var T = _THREE();
    var sc = _scene();
    if (!T || !sc) {
      // Defer until scene is available
      _ziplines.push({ sx: sx, sy: sy, sz: sz, ex: ex, ey: ey, ez: ez, meshes: [], deferred: true });
      return;
    }

    var meshes = [];
    var grayMat  = _makeMaterial(0x888888);
    var postMat  = _makeMaterial(0x666666);

    // Rope
    var dx = ex - sx, dy = ey - sy, dz = ez - sz;
    var length = Math.sqrt(dx*dx + dy*dy + dz*dz);
    var ropeGeo = new T.CylinderGeometry(ROPE_RADIUS, ROPE_RADIUS, length, 6, 1);
    var ropeMesh = new T.Mesh(ropeGeo, grayMat);

    // Position at midpoint
    ropeMesh.position.set((sx + ex) / 2, (sy + ey) / 2, (sz + ez) / 2);

    // Orient along direction
    var dir = new T.Vector3(dx, dy, dz).normalize();
    var up  = new T.Vector3(0, 1, 0);
    var axis = new T.Vector3();
    axis.crossVectors(up, dir).normalize();
    var angle = Math.acos(Math.max(-1, Math.min(1, up.dot(dir))));
    if (axis.lengthSq() < 0.0001) {
      // Parallel to up — no rotation needed (or 180 flip)
      if (dy < 0) ropeMesh.rotation.z = Math.PI;
    } else {
      ropeMesh.setRotationFromAxisAngle(axis, angle);
    }
    sc.add(ropeMesh);
    meshes.push(ropeMesh);

    // Anchor posts
    var postGeo = new T.CylinderGeometry(POST_RADIUS, POST_RADIUS, POST_HEIGHT, 5, 1);

    var postStart = new T.Mesh(postGeo, postMat);
    postStart.position.set(sx, sy - POST_HEIGHT * 0.5, sz);
    sc.add(postStart);
    meshes.push(postStart);

    var postEnd = new T.Mesh(postGeo, postMat);
    postEnd.position.set(ex, ey - POST_HEIGHT * 0.5, ez);
    sc.add(postEnd);
    meshes.push(postEnd);

    var yDrop = sy - ey;
    var speed = (yDrop > STEEP_Y_THRESHOLD) ? TRAVEL_SPEED_STEEP : TRAVEL_SPEED_FLAT;

    _ziplines.push({
      sx: sx, sy: sy, sz: sz,
      ex: ex, ey: ey, ez: ez,
      length: length,
      speed: speed,
      meshes: meshes,
      deferred: false
    });
  }

  // ── _tryBuildDeferred: build any ziplines that were queued before scene ready ──
  function _tryBuildDeferred() {
    var T = _THREE();
    var sc = _scene();
    if (!T || !sc) return;
    for (var i = 0; i < _ziplines.length; i++) {
      if (_ziplines[i].deferred) {
        var z = _ziplines[i];
        _ziplines.splice(i, 1);
        i--;
        addZipline(z.sx, z.sy, z.sz, z.ex, z.ey, z.ez);
      }
    }
  }

  // ── Handle mesh (grab handle that slides along the rope) ──────────────────
  function _createHandle(sc) {
    var T = _THREE();
    if (!T || !sc) return;
    _destroyHandle(sc);
    var geo = new T.BoxGeometry(HANDLE_W, HANDLE_H, HANDLE_D);
    var mat = new T.MeshLambertMaterial({ color: 0x444444 });
    _handleMesh = new T.Mesh(geo, mat);
    sc.add(_handleMesh);
  }

  function _destroyHandle(sc) {
    if (_handleMesh && sc) {
      sc.remove(_handleMesh);
    }
    _handleMesh = null;
  }

  // ── Attach player to nearest zipline start ────────────────────────────────
  function _attach() {
    var pPos = _playerPos();
    if (!pPos) return;

    _tryBuildDeferred();

    for (var i = 0; i < _ziplines.length; i++) {
      var z = _ziplines[i];
      if (z.deferred) continue;
      var dx = pPos.x - z.sx;
      var dy = pPos.y - z.sy;
      var dz = pPos.z - z.sz;
      var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist <= ATTACH_RADIUS) {
        _attached    = true;
        _activeZip   = z;
        _progress    = 0;
        _speed       = z.speed;
        window._onZipline = true;
        _startWhoosh();
        _createHandle(_scene());
        _showPrompt(false);
        return;
      }
    }
  }

  function _detach() {
    _attached  = false;
    _activeZip = null;
    _progress  = 0;
    window._onZipline = false;
    _stopWhoosh();
    _playDing();
    _destroyHandle(_scene());

    // Camera shake on landing
    window._cameraShake = { intensity: LAND_SHAKE_INT, duration: LAND_SHAKE_DUR };

    // Reset camera lean
    var cam = _camera();
    if (cam) cam.rotation.z = 0;
  }

  // ── Key handler ───────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.code !== 'KeyZ') return;
    if (_attached) return; // already riding
    _attach();
  }

  // ── init ──────────────────────────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    _createPrompt();
    document.addEventListener('keydown', _onKeyDown);
    window._onZipline = false;

    // 3 default ziplines — high-to-low across the map using relative coordinates
    addZipline(-20, 12,  0,   0,  5,  0);   // zipline 1: left-high to centre-mid
    addZipline(  0, 10, -20,  0,  3, 10);   // zipline 2: back-high to front-low
    addZipline( 18,  9, -10, -5,  1, 15);   // zipline 3: right-high diagonal to far-left-low
  }

  // ── update ────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!_initialized) return;
    _tryBuildDeferred();

    var pPos = _playerPos();
    var cam  = _camera();

    // Show / hide "RIDE" prompt when near a zipline start (only when not attached)
    if (!_attached && pPos) {
      var nearAny = false;
      for (var i = 0; i < _ziplines.length; i++) {
        var z = _ziplines[i];
        if (z.deferred) continue;
        var ddx = pPos.x - z.sx;
        var ddy = pPos.y - z.sy;
        var ddz = pPos.z - z.sz;
        var d   = Math.sqrt(ddx*ddx + ddy*ddy + ddz*ddz);
        if (d <= ATTACH_RADIUS) { nearAny = true; break; }
      }
      _showPrompt(nearAny);
    }

    if (!_attached || !_activeZip) return;

    // Advance progress
    var az = _activeZip;
    var travelDist = _speed * dt;
    _progress += travelDist / az.length;

    if (_progress >= 1) {
      _progress = 1;

      // Snap player to end
      if (pPos) {
        pPos.x = az.ex;
        pPos.y = az.ey;
        pPos.z = az.ez;
      }

      // Reset handle
      if (_handleMesh) {
        _handleMesh.position.set(az.ex, az.ey, az.ez);
      }

      // Reset camera lean
      if (cam) cam.rotation.z = 0;

      _detach();
      return;
    }

    // Interpolate position along rope
    var px = az.sx + (az.ex - az.sx) * _progress;
    var py = az.sy + (az.ey - az.sy) * _progress;
    var pz = az.sz + (az.ez - az.sz) * _progress;

    if (pPos) {
      pPos.x = px;
      pPos.y = py;
      pPos.z = pz;
    }

    // Update handle mesh
    if (_handleMesh) {
      _handleMesh.position.set(px, py, pz);
    }

    // Camera lean based on horizontal travel direction
    if (cam) {
      var hDx = az.ex - az.sx;
      var hDz = az.ez - az.sz;
      var hLen = Math.sqrt(hDx*hDx + hDz*hDz);
      if (hLen > 0.001) {
        // lean direction: + = going right (positive X) lean clockwise
        var leanSign = (hDx / hLen);
        cam.rotation.z = -leanSign * CAMERA_LEAN;
      }
    }
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  function reset() {
    // Detach if riding
    if (_attached) {
      _stopWhoosh();
      _destroyHandle(_scene());
      _attached  = false;
      _activeZip = null;
      _progress  = 0;
      window._onZipline = false;

      var cam = _camera();
      if (cam) cam.rotation.z = 0;
    }

    // Remove all zipline meshes from scene
    var sc = _scene();
    for (var i = 0; i < _ziplines.length; i++) {
      var z = _ziplines[i];
      if (!z.meshes) continue;
      for (var j = 0; j < z.meshes.length; j++) {
        if (sc) sc.remove(z.meshes[j]);
      }
    }
    _ziplines = [];

    _showPrompt(false);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:        init,
    update:      update,
    addZipline:  addZipline,
    reset:       reset
  };

})();
