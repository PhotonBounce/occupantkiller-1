/* ============================================================
 *  REPLAY SYSTEM — F3 key — records last 30 seconds of gameplay
 *  Records game state every 100ms (10 fps of replay data) in a
 *  circular buffer of 300 frames (30 seconds). Press F3 to watch
 *  a ghost replay of the last 30 seconds.
 *
 *  Depends on: THREE (for ghost sphere pool), CameraSystem
 *  (getYaw / getPitch), Enemies (getAll)
 * ============================================================ */
window.ReplaySystem = (function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────── */
  var MAX_FRAMES    = 300;   // 30s × 10fps
  var RECORD_INTERVAL = 100; // ms between recorded frames
  var GHOST_POOL_SIZE = 20;  // max simultaneous enemy ghosts
  var SEEK_DELTA    = 3.0;   // seconds per arrow-key seek

  /* ── Recording state ───────────────────────────────────── */
  var _buffer       = [];    // circular array of frame objects
  var _head         = 0;     // write pointer
  var _count        = 0;     // total frames stored (capped at MAX_FRAMES)
  var _lastRecord   = 0;     // timestamp of last recorded frame (ms)

  /* ── Playback state ─────────────────────────────────────── */
  var _playing      = false;
  var _paused       = false;
  var _playIdx      = 0;     // current frame index (float for lerp)
  var _playSpeed    = 1.0;   // frames per second during playback

  /* ── Three.js ghost pool ────────────────────────────────── */
  var _ghostPool    = [];    // array of THREE.Mesh spheres
  var _scene        = null;  // injected on init

  /* ── DOM overlay elements ───────────────────────────────── */
  var _overlay      = null;
  var _labelEl      = null;
  var _barFill      = null;

  /* ── Kill-flash element ─────────────────────────────────── */
  var _killFlash    = null;
  var _killFlashTimer = 0;

  /* ── Saved camera state (restore on exit) ─────────────────*/
  var _savedYaw     = 0;
  var _savedPitch   = 0;

  /* ── Key handler refs for cleanup ──────────────────────────*/
  var _keyHandler   = null;

  /* ─────────────────────────────────────────────────────────
   *  INIT — called once by game-manager after THREE scene
   *  exists. Builds ghost pool and overlay DOM.
   * ───────────────────────────────────────────────────────── */
  function init(scene) {
    _scene = scene || null;
    _buildGhostPool();
    _buildOverlay();
    _buildKillFlash();

    // Register F3 key at window level
    _keyHandler = function (e) {
      if (e.code === 'F3') {
        e.preventDefault();
        if (_playing) {
          stopPlayback();
        } else {
          playback();
        }
      }
    };
    window.addEventListener('keydown', _keyHandler, false);
  }

  /* ─────────────────────────────────────────────────────────
   *  RECORD FRAME
   *  Called from game loop hook (window._onGameFrame).
   *  Only runs when NOT in replay mode.
   * ───────────────────────────────────────────────────────── */
  function recordFrame(player, enemies, camera) {
    if (_playing) return;  // never record during replay
    if (window._replayMode) return;

    var now = Date.now();
    if (now - _lastRecord < RECORD_INTERVAL) return;
    _lastRecord = now;

    // Build enemy snapshot array (only lightweight data — no meshes)
    var enemySnap = [];
    if (enemies && enemies.length) {
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e) continue;
        var pos = e.mesh ? e.mesh.position : (e.position || null);
        enemySnap.push({
          id:    e.id || i,
          x:     pos ? pos.x : 0,
          y:     pos ? pos.y : 0,
          z:     pos ? pos.z : 0,
          hp:    e.hp || 0,
          alive: !!e.alive
        });
      }
    }

    var yaw   = (typeof CameraSystem !== 'undefined' && CameraSystem.getYaw)   ? CameraSystem.getYaw()   : 0;
    var pitch = (typeof CameraSystem !== 'undefined' && CameraSystem.getPitch) ? CameraSystem.getPitch() : 0;

    var frame = {
      t:       now,
      px:      player ? player.position.x : 0,
      py:      player ? player.position.y : 0,
      pz:      player ? player.position.z : 0,
      prx:     pitch,
      pry:     yaw,
      ph:      player ? (player.hp || 0) : 0,
      kills:   player ? (player.kills || 0) : 0,
      enemies: enemySnap
    };

    // Write into circular buffer
    _buffer[_head] = frame;
    _head = (_head + 1) % MAX_FRAMES;
    if (_count < MAX_FRAMES) _count++;
  }

  /* ─────────────────────────────────────────────────────────
   *  PLAYBACK — start replaying the recorded buffer
   * ───────────────────────────────────────────────────────── */
  function playback() {
    if (_count === 0) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('REPLAY: no data recorded yet', '#ffcc00');
      }
      return;
    }

    // Pause main game
    window._replayMode = true;
    window._gamePaused = true;

    _playing = true;
    _paused  = false;
    _playIdx = 0;
    _playSpeed = 10.0;   // 10 frames/s matches our record rate → real-time

    // Save camera angles so we can restore them
    _savedYaw   = (typeof CameraSystem !== 'undefined' && CameraSystem.getYaw)   ? CameraSystem.getYaw()   : 0;
    _savedPitch = (typeof CameraSystem !== 'undefined' && CameraSystem.getPitch) ? CameraSystem.getPitch() : 0;

    // Show all ghosts, overlay
    _setGhostsVisible(true);
    _showOverlay(true);

    // Register playback-specific keys
    _registerPlaybackKeys();

    // Kick off playback loop
    _playbackTick();
  }

  /* ─────────────────────────────────────────────────────────
   *  STOP PLAYBACK — exit replay, return to live game
   * ───────────────────────────────────────────────────────── */
  function stopPlayback() {
    if (!_playing) return;

    _playing = false;
    _paused  = false;

    // Hide ghosts
    _setGhostsVisible(false);
    _showOverlay(false);

    // Unregister playback keys
    _unregisterPlaybackKeys();

    // Resume game
    window._replayMode = false;
    window._gamePaused = false;

    // Restore camera
    if (typeof CameraSystem !== 'undefined') {
      if (CameraSystem.setYaw)   CameraSystem.setYaw(_savedYaw);
      if (CameraSystem.setPitch) CameraSystem.setPitch(_savedPitch);
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  PLAYBACK TICK — runs on rAF while replaying
   * ───────────────────────────────────────────────────────── */
  var _lastPlayTime = 0;

  function _playbackTick() {
    if (!_playing) return;

    var now = performance.now();
    var dt  = _lastPlayTime ? Math.min((now - _lastPlayTime) / 1000, 0.1) : 0;
    _lastPlayTime = now;

    if (!_paused) {
      _playIdx += dt * _playSpeed;
    }

    // Clamp and end-of-replay check
    if (_playIdx >= _count - 1) {
      _applyFrame(_count - 1);
      _updateHUD(_count - 1, _count);
      stopPlayback();
      return;
    }

    _applyFrame(_playIdx);
    _updateHUD(_playIdx, _count);

    requestAnimationFrame(_playbackTick);
  }

  /* ─────────────────────────────────────────────────────────
   *  APPLY FRAME — lerp between two recorded frames and
   *  position ghost camera + enemy spheres
   * ───────────────────────────────────────────────────────── */
  function _applyFrame(floatIdx) {
    var iA  = Math.floor(floatIdx) % _count;
    var iB  = Math.min(Math.floor(floatIdx) + 1, _count - 1) % _count;
    var t   = floatIdx - Math.floor(floatIdx);

    // Map logical indices to buffer positions accounting for wrap-around
    var offsetA = (_head - _count + iA + MAX_FRAMES) % MAX_FRAMES;
    var offsetB = (_head - _count + iB + MAX_FRAMES) % MAX_FRAMES;

    var fA = _buffer[offsetA];
    var fB = _buffer[offsetB];
    if (!fA || !fB) return;

    // Lerp player position
    var px = fA.px + (fB.px - fA.px) * t;
    var py = fA.py + (fB.py - fA.py) * t;
    var pz = fA.pz + (fB.pz - fA.pz) * t;
    var yaw   = fA.pry + (fB.pry - fA.pry) * t;
    var pitch = fA.prx + (fB.prx - fA.prx) * t;

    // Move camera to recorded player position + look angle
    if (typeof CameraSystem !== 'undefined') {
      if (CameraSystem.setYaw)      CameraSystem.setYaw(yaw);
      if (CameraSystem.setPitch)    CameraSystem.setPitch(pitch);
      if (CameraSystem.setPosition) CameraSystem.setPosition(px, py, pz);
    }

    // Position enemy ghosts
    _applyEnemyGhosts(fA, fB, t);

    // Kill-flash: detect increase in kills between frames
    if (fB.kills > fA.kills) {
      _triggerKillFlash();
    }

    // Update kill-flash fade
    _tickKillFlash();
  }

  /* ─────────────────────────────────────────────────────────
   *  ENEMY GHOSTS — position semi-transparent spheres
   * ───────────────────────────────────────────────────────── */
  function _applyEnemyGhosts(fA, fB, t) {
    var enemies = fA.enemies || [];
    var enemiesB = fB.enemies || [];

    for (var i = 0; i < _ghostPool.length; i++) {
      var ghost = _ghostPool[i];
      var eA    = enemies[i];
      var eB    = enemiesB[i];

      if (!eA) {
        ghost.visible = false;
        ghost.material.opacity = 0;
        continue;
      }

      // Lerp position
      var ex = eA.x + ((eB ? eB.x : eA.x) - eA.x) * t;
      var ey = eA.y + ((eB ? eB.y : eA.y) - eA.y) * t;
      var ez = eA.z + ((eB ? eB.z : eA.z) - eA.z) * t;

      ghost.position.set(ex, ey, ez);

      if (eA.alive) {
        ghost.visible = true;
        ghost.material.opacity = 0.4;
      } else {
        ghost.visible = false;
        ghost.material.opacity = 0;
      }
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  GHOST POOL — pre-built sphere meshes
   * ───────────────────────────────────────────────────────── */
  function _buildGhostPool() {
    if (!_scene || typeof THREE === 'undefined') return;
    var geo = new THREE.SphereGeometry(0.5, 8, 8);
    for (var i = 0; i < GHOST_POOL_SIZE; i++) {
      var mat  = new THREE.MeshBasicMaterial({
        color:       0x4488ff,
        transparent: true,
        opacity:     0.4
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.userData.isReplayGhost = true;
      _scene.add(mesh);
      _ghostPool.push(mesh);
    }
  }

  function _setGhostsVisible(vis) {
    for (var i = 0; i < _ghostPool.length; i++) {
      _ghostPool[i].visible = vis ? _ghostPool[i].visible : false;
      if (!vis) _ghostPool[i].material.opacity = 0;
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  OVERLAY DOM — replay HUD bar
   * ───────────────────────────────────────────────────────── */
  function _buildOverlay() {
    _overlay = document.createElement('div');
    _overlay.id = 'replay-overlay';
    _overlay.style.cssText = [
      'display:none',
      'position:fixed',
      'top:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:9000',
      'background:rgba(0,0,0,0.75)',
      'border:1px solid #ffd700',
      'border-radius:6px',
      'padding:8px 16px',
      'font-family:monospace',
      'font-size:13px',
      'color:#ffd700',
      'text-align:center',
      'pointer-events:none',
      'min-width:320px'
    ].join(';');

    _labelEl = document.createElement('div');
    _labelEl.id = 'replay-label';
    _labelEl.style.cssText = 'margin-bottom:6px;letter-spacing:1px;';
    _labelEl.textContent = '◄◄  ▶ REPLAY 0.0s / 0.0s  ►►';

    var barTrack = document.createElement('div');
    barTrack.style.cssText = [
      'width:100%',
      'height:8px',
      'background:#333',
      'border:1px solid #555',
      'border-radius:4px',
      'overflow:hidden'
    ].join(';');

    _barFill = document.createElement('div');
    _barFill.style.cssText = [
      'width:0%',
      'height:100%',
      'background:linear-gradient(90deg,#ffd700,#ffaa00)',
      'border-radius:4px',
      'transition:width 0.05s linear'
    ].join(';');

    barTrack.appendChild(_barFill);

    var hint = document.createElement('div');
    hint.style.cssText = 'font-size:10px;color:#aaa;margin-top:5px;';
    hint.textContent = 'SPACE: pause/resume  ←→: ±3s  ESC: exit replay';

    _overlay.appendChild(_labelEl);
    _overlay.appendChild(barTrack);
    _overlay.appendChild(hint);
    document.body.appendChild(_overlay);
  }

  function _showOverlay(vis) {
    if (_overlay) _overlay.style.display = vis ? 'block' : 'none';
  }

  function _updateHUD(idx, total) {
    if (!_labelEl || !_barFill) return;
    var cur  = idx / _playSpeed;     // seconds elapsed in replay
    var dur  = (total - 1) / _playSpeed;
    var pct  = total > 1 ? (idx / (total - 1)) * 100 : 0;

    var pauseMark = _paused ? '⏸ ' : '▶ ';
    _labelEl.textContent = '◄◄  ' + pauseMark + 'REPLAY '
      + cur.toFixed(1) + 's / ' + dur.toFixed(1) + 's  ►►';
    _barFill.style.width = pct.toFixed(1) + '%';
  }

  /* ─────────────────────────────────────────────────────────
   *  KILL FLASH — brief gold flash on screen at kill moments
   * ───────────────────────────────────────────────────────── */
  function _buildKillFlash() {
    _killFlash = document.createElement('div');
    _killFlash.id = 'replay-kill-flash';
    _killFlash.style.cssText = [
      'display:none',
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'z-index:9001',
      'color:#ffd700',
      'font-family:monospace',
      'font-size:32px',
      'font-weight:bold',
      'text-shadow:0 0 20px #ffd700',
      'pointer-events:none',
      'letter-spacing:4px'
    ].join(';');
    _killFlash.textContent = 'KILL';
    document.body.appendChild(_killFlash);
  }

  function _triggerKillFlash() {
    if (_killFlash) {
      _killFlash.style.display = 'block';
      _killFlash.style.opacity = '1';
      _killFlashTimer = 0.6; // seconds
    }
  }

  function _tickKillFlash() {
    if (!_killFlash || _killFlashTimer <= 0) return;
    _killFlashTimer -= 1 / 60;
    if (_killFlashTimer <= 0) {
      _killFlash.style.display = 'none';
      _killFlashTimer = 0;
    } else {
      _killFlash.style.opacity = (_killFlashTimer / 0.6).toFixed(2);
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  PLAYBACK KEY HANDLER
   * ───────────────────────────────────────────────────────── */
  var _pbKeyHandler = null;

  function _registerPlaybackKeys() {
    _pbKeyHandler = function (e) {
      if (!_playing) return;

      if (e.code === 'Space') {
        e.preventDefault();
        _paused = !_paused;
        if (!_paused) {
          _lastPlayTime = 0;
          _playbackTick();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        _playIdx = Math.max(0, _playIdx - SEEK_DELTA * _playSpeed);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        _playIdx = Math.min(_count - 2, _playIdx + SEEK_DELTA * _playSpeed);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stopPlayback();
      }
    };
    window.addEventListener('keydown', _pbKeyHandler, false);
  }

  function _unregisterPlaybackKeys() {
    if (_pbKeyHandler) {
      window.removeEventListener('keydown', _pbKeyHandler, false);
      _pbKeyHandler = null;
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  PUBLIC API
   * ───────────────────────────────────────────────────────── */
  function isRecording() { return !_playing; }
  function isPlaying()   { return _playing;  }

  return {
    init:         init,
    recordFrame:  recordFrame,
    playback:     playback,
    stopPlayback: stopPlayback,
    isRecording:  isRecording,
    isPlaying:    isPlaying
  };
})();
