/* ============================================================
 *  BATTLE REPLAY — Ctrl+R — records last 60 seconds of gameplay
 *  Records game state every 100ms (10 fps) in a circular buffer
 *  of 600 frames (60 seconds). Press Ctrl+R to watch a ghost
 *  replay with timeline scrubber, cinematic mode, and clip export.
 *
 *  Depends on: THREE (ghost meshes), CameraSystem (setYaw/setPitch/
 *  setPosition/getYaw/getPitch), Enemies.getAll (optional)
 *
 *  Public API: { init(scene, camera), update(dt), startReplay(),
 *                stopReplay(), reset }
 * ============================================================ */
window.BattleReplay = (function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────── */
  var MAX_FRAMES       = 600;   // 60s × 10fps
  var RECORD_INTERVAL  = 100;   // ms between recorded frames
  var GHOST_POOL_SIZE  = 20;    // max simultaneous enemy ghosts
  var MAX_CLIP_FRAMES  = 300;   // max 30s clip

  /* ── Core state ─────────────────────────────────────────── */
  var _scene           = null;
  var _camera          = null;

  /* ── Recording state ─────────────────────────────────────── */
  var _buffer          = [];    // circular array of frame objects
  var _head            = 0;     // write pointer
  var _count           = 0;     // frames stored (capped at MAX_FRAMES)
  var _lastRecord      = 0;     // ms timestamp of last recorded frame
  var _accumDt         = 0;     // dt accumulator for update()-driven recording

  /* ── Playback state ──────────────────────────────────────── */
  var _playing         = false;
  var _playIdx         = 0;     // current frame index (float for lerp)
  var _playSpeed       = 0.5;   // multiplier vs real-time (0.5 = slow-mo)
  var _lastPlayTime    = 0;     // performance.now() of last tick
  var _savedYaw        = 0;
  var _savedPitch      = 0;
  var _savedCamPos     = null;

  /* ── Speed cycle ─────────────────────────────────────────── */
  var _speedCycle      = [0.5, 1.0, 2.0];
  var _speedIdx        = 0;

  /* ── Cinematic mode ──────────────────────────────────────── */
  var _cinematic       = false;
  var _cinAngle        = 0;     // orbital angle in radians
  var _cinCenter       = null;  // THREE.Vector3 action center
  var _cinRadius       = 8;

  /* ── Clip export ─────────────────────────────────────────── */
  var _clipStart       = -1;
  var _clipEnd         = -1;

  /* ── Kill-flash state ────────────────────────────────────── */
  var _killFlashTimer  = 0;
  var _killTextEl      = null;

  /* ── Ghost pool ──────────────────────────────────────────── */
  var _ghostPool       = [];

  /* ── DOM elements ────────────────────────────────────────── */
  var _overlay         = null;
  var _frameCountEl    = null;
  var _timeEl          = null;
  var _speedEl         = null;
  var _scrubTrack      = null;
  var _scrubDot        = null;
  var _scrubTimeEl     = null;
  var _clipMsgEl       = null;
  var _clipMsgTimer    = 0;

  /* ── Key handlers ─────────────────────────────────────────── */
  var _globalKeyHandler = null;
  var _pbKeyHandler     = null;

  /* ─────────────────────────────────────────────────────────
   *  INIT
   * ───────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;
    _savedCamPos = (typeof THREE !== 'undefined') ? new THREE.Vector3() : null;
    _cinCenter   = (typeof THREE !== 'undefined') ? new THREE.Vector3() : null;

    _buildGhostPool();
    _buildOverlay();
    _buildKillText();

    _globalKeyHandler = function (e) {
      if (e.ctrlKey && (e.code === 'KeyR' || e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        if (_playing) {
          stopReplay();
        } else {
          startReplay();
        }
      }
    };
    window.addEventListener('keydown', _globalKeyHandler, false);
  }

  /* ─────────────────────────────────────────────────────────
   *  UPDATE — called every game frame with delta time (seconds)
   *  Drives recording; also ticks playback if active.
   * ───────────────────────────────────────────────────────── */
  function update(dt) {
    if (!_playing) {
      _accumDt += dt;
      if (_accumDt * 1000 >= RECORD_INTERVAL) {
        _accumDt = 0;
        _recordFrame();
      }
    } else {
      _tickPlayback(dt);
    }

    if (_killFlashTimer > 0) {
      _killFlashTimer -= dt;
      if (_killFlashTimer <= 0) {
        _killFlashTimer = 0;
        if (_killTextEl) { _killTextEl.style.display = 'none'; }
      } else if (_killTextEl) {
        _killTextEl.style.opacity = String(Math.min(1, _killFlashTimer / 0.3));
        _killTextEl.style.top = (50 - (1 - _killFlashTimer / 0.6) * 15) + '%';
      }
    }

    if (_clipMsgTimer > 0) {
      _clipMsgTimer -= dt;
      if (_clipMsgTimer <= 0) {
        _clipMsgTimer = 0;
        if (_clipMsgEl) { _clipMsgEl.style.display = 'none'; }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  RECORD FRAME
   * ───────────────────────────────────────────────────────── */
  function _recordFrame() {
    var now = Date.now();
    var camPos = { x: 0, y: 0, z: 0 };
    var camRot = { x: 0, y: 0 };

    if (_camera) {
      camPos.x = _camera.position.x;
      camPos.y = _camera.position.y;
      camPos.z = _camera.position.z;
      if (_camera.rotation) {
        camRot.x = _camera.rotation.x;
        camRot.y = _camera.rotation.y;
      }
    } else if (typeof CameraSystem !== 'undefined') {
      camRot.y = CameraSystem.getYaw   ? CameraSystem.getYaw()   : 0;
      camRot.x = CameraSystem.getPitch ? CameraSystem.getPitch() : 0;
    }

    var enemySnap = [];
    try {
      var allEnemies = (typeof Enemies !== 'undefined' && Enemies.getAll)
        ? Enemies.getAll()
        : (typeof window.enemies !== 'undefined' ? window.enemies : []);
      if (allEnemies && allEnemies.length) {
        for (var i = 0; i < allEnemies.length; i++) {
          var e = allEnemies[i];
          if (!e) continue;
          var pos = e.mesh ? e.mesh.position : (e.position || null);
          var rot = e.mesh ? e.mesh.rotation : (e.rotation || null);
          enemySnap.push({
            id:  e.id || i,
            pos: pos ? { x: pos.x, y: pos.y, z: pos.z } : { x: 0, y: 0, z: 0 },
            rot: rot ? { y: rot.y } : { y: 0 },
            hp:  (e.hp !== undefined) ? e.hp : 100
          });
        }
      }
    } catch (err) { /* ignore enemy read errors */ }

    var score = (typeof window.score !== 'undefined') ? window.score : 0;
    var kills = (typeof window.kills !== 'undefined') ? window.kills : 0;

    var frame = {
      t:       now,
      camPos:  camPos,
      camRot:  camRot,
      enemies: enemySnap,
      score:   score,
      kills:   kills
    };

    _buffer[_head] = frame;
    _head = (_head + 1) % MAX_FRAMES;
    if (_count < MAX_FRAMES) { _count++; }
  }

  /* ─────────────────────────────────────────────────────────
   *  GET ORDERED FRAMES — returns frames in chronological order
   * ───────────────────────────────────────────────────────── */
  function _getFrame(logicalIdx) {
    var physical = (_head - _count + logicalIdx + MAX_FRAMES * 2) % MAX_FRAMES;
    return _buffer[physical] || null;
  }

  /* ─────────────────────────────────────────────────────────
   *  START REPLAY
   * ───────────────────────────────────────────────────────── */
  function startReplay() {
    if (_count < 2) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('REPLAY: not enough data', '#ff4444');
      }
      return;
    }

    window._replayMode  = true;
    window._gamePaused  = true;
    _playing            = true;
    _playIdx            = 0;
    _speedIdx           = 0;
    _playSpeed          = _speedCycle[0];
    _cinematic          = false;
    _lastPlayTime       = 0;
    _clipStart          = -1;
    _clipEnd            = -1;

    // Save camera state
    if (_camera) {
      if (_savedCamPos) { _savedCamPos.copy(_camera.position); }
      _savedYaw   = 0;
      _savedPitch = 0;
      if (_camera.rotation) {
        _savedYaw   = _camera.rotation.y;
        _savedPitch = _camera.rotation.x;
      }
    } else if (typeof CameraSystem !== 'undefined') {
      _savedYaw   = CameraSystem.getYaw   ? CameraSystem.getYaw()   : 0;
      _savedPitch = CameraSystem.getPitch ? CameraSystem.getPitch() : 0;
    }

    _setGhostsVisible(false);
    _showOverlay(true);
    _registerPlaybackKeys();
  }

  /* ─────────────────────────────────────────────────────────
   *  STOP REPLAY
   * ───────────────────────────────────────────────────────── */
  function stopReplay() {
    if (!_playing) return;
    _playing   = false;
    _cinematic = false;

    _setGhostsVisible(false);
    _showOverlay(false);
    _unregisterPlaybackKeys();

    window._replayMode = false;
    window._gamePaused = false;

    // Restore camera
    if (_camera) {
      if (_savedCamPos) { _camera.position.copy(_savedCamPos); }
      if (_camera.rotation) {
        _camera.rotation.y = _savedYaw;
        _camera.rotation.x = _savedPitch;
      }
    } else if (typeof CameraSystem !== 'undefined') {
      if (CameraSystem.setYaw)   { CameraSystem.setYaw(_savedYaw); }
      if (CameraSystem.setPitch) { CameraSystem.setPitch(_savedPitch); }
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  TICK PLAYBACK — driven by update(dt)
   * ───────────────────────────────────────────────────────── */
  function _tickPlayback(dt) {
    if (!_playing) return;

    _playIdx += dt * 10 * _playSpeed; // 10fps record rate

    if (_playIdx >= _count - 1) {
      _applyFrame(_count - 1);
      _updateHUD(_count - 1);
      stopReplay();
      return;
    }

    _applyFrame(_playIdx);
    _updateHUD(_playIdx);

    if (_cinematic) {
      _tickCinematic(dt);
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  APPLY FRAME — lerp between consecutive recorded frames
   * ───────────────────────────────────────────────────────── */
  function _applyFrame(floatIdx) {
    var iA = Math.floor(floatIdx);
    var iB = Math.min(iA + 1, _count - 1);
    var t  = floatIdx - iA;

    var fA = _getFrame(iA);
    var fB = _getFrame(iB);
    if (!fA || !fB) return;

    if (!_cinematic) {
      // Lerp camera position
      var cx = fA.camPos.x + (fB.camPos.x - fA.camPos.x) * t;
      var cy = fA.camPos.y + (fB.camPos.y - fA.camPos.y) * t;
      var cz = fA.camPos.z + (fB.camPos.z - fA.camPos.z) * t;
      var ry = fA.camRot.y + (fB.camRot.y - fA.camRot.y) * t;
      var rx = fA.camRot.x + (fB.camRot.x - fA.camRot.x) * t;

      if (_camera) {
        _camera.position.set(cx, cy, cz);
        if (_camera.rotation) {
          _camera.rotation.y = ry;
          _camera.rotation.x = rx;
        }
      } else if (typeof CameraSystem !== 'undefined') {
        if (CameraSystem.setYaw)      { CameraSystem.setYaw(ry); }
        if (CameraSystem.setPitch)    { CameraSystem.setPitch(rx); }
        if (CameraSystem.setPosition) { CameraSystem.setPosition(cx, cy, cz); }
      }
    }

    // Position enemy ghosts
    _applyEnemyGhosts(fA, fB, t);

    // Detect kills (enemy HP dropped from >0 to <=0)
    _detectKills(fA, fB);
  }

  /* ─────────────────────────────────────────────────────────
   *  ENEMY GHOSTS
   * ───────────────────────────────────────────────────────── */
  function _applyEnemyGhosts(fA, fB, t) {
    var enA = fA.enemies || [];
    var enB = fB.enemies || [];

    // Hide all first
    for (var i = 0; i < _ghostPool.length; i++) {
      _ghostPool[i].visible = false;
    }

    for (var j = 0; j < enA.length && j < _ghostPool.length; j++) {
      var eA = enA[j];
      var eB = enB[j] || eA;
      var ghost = _ghostPool[j];

      // Only show if alive (hp > 0) in frame A
      if (!eA || eA.hp <= 0) { continue; }

      var ex = eA.pos.x + (eB.pos.x - eA.pos.x) * t;
      var ey = eA.pos.y + (eB.pos.y - eA.pos.y) * t;
      var ez = eA.pos.z + (eB.pos.z - eA.pos.z) * t;
      var ery = eA.rot.y + (eB.rot.y - eA.rot.y) * t;

      ghost.position.set(ex, ey, ez);
      ghost.rotation.y = ery;
      ghost.material.opacity = 0.4;
      ghost.visible = true;
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  KILL DETECTION — flash gold on kills
   * ───────────────────────────────────────────────────────── */
  function _detectKills(fA, fB) {
    var enA = fA.enemies || [];
    var enB = fB.enemies || [];
    for (var i = 0; i < enA.length; i++) {
      var a = enA[i];
      var b = enB[i];
      if (a && b && a.hp > 0 && b.hp <= 0) {
        _triggerKillFlash();
        break;
      }
    }
    // Also detect by kill count increment
    if (fB.kills > fA.kills) {
      _triggerKillFlash();
    }
  }

  function _triggerKillFlash() {
    if (!_killTextEl) return;
    _killTextEl.style.display = 'block';
    _killTextEl.style.opacity = '1';
    _killTextEl.style.top = '50%';
    _killFlashTimer = 0.6;
  }

  /* ─────────────────────────────────────────────────────────
   *  CINEMATIC MODE — find most action-packed 10s window
   * ───────────────────────────────────────────────────────── */
  function _enableCinematic() {
    _cinematic = true;
    _cinAngle  = 0;

    // Find 10-second window (100 frames) with most kills
    var windowSize = 100;
    var bestStart  = 0;
    var bestScore  = -1;
    for (var i = 0; i < _count - windowSize; i++) {
      var deaths = 0;
      for (var j = i; j < i + windowSize - 1; j++) {
        var fA = _getFrame(j);
        var fB = _getFrame(j + 1);
        if (!fA || !fB) continue;
        if (fB.kills > fA.kills) { deaths += (fB.kills - fA.kills); }
        var enA = fA.enemies || [];
        var enB = fB.enemies || [];
        for (var k = 0; k < enA.length; k++) {
          if (enA[k] && enB[k] && enA[k].hp > 0 && enB[k].hp <= 0) { deaths++; }
        }
      }
      if (deaths > bestScore) {
        bestScore = deaths;
        bestStart = i;
      }
    }

    // Jump to best window
    _playIdx = bestStart;

    // Compute center of action: average enemy positions in that window
    if (_cinCenter && typeof THREE !== 'undefined') {
      _cinCenter.set(0, 0, 0);
      var count = 0;
      for (var wi = bestStart; wi < bestStart + windowSize && wi < _count; wi++) {
        var f = _getFrame(wi);
        if (!f) continue;
        var en = f.enemies || [];
        for (var ei = 0; ei < en.length; ei++) {
          if (en[ei] && en[ei].hp > 0) {
            _cinCenter.x += en[ei].pos.x;
            _cinCenter.y += en[ei].pos.y;
            _cinCenter.z += en[ei].pos.z;
            count++;
          }
        }
      }
      if (count > 0) {
        _cinCenter.x /= count;
        _cinCenter.y /= count;
        _cinCenter.z /= count;
      } else {
        // Fallback to camera position at best frame
        var bf = _getFrame(bestStart);
        if (bf) {
          _cinCenter.x = bf.camPos.x;
          _cinCenter.y = bf.camPos.y;
          _cinCenter.z = bf.camPos.z;
        }
      }
    }
  }

  function _tickCinematic(dt) {
    if (!_cinCenter || typeof THREE === 'undefined') return;
    _cinAngle += dt * 0.4; // slow orbital pan

    var px = _cinCenter.x + Math.sin(_cinAngle) * _cinRadius;
    var py = _cinCenter.y + 3;
    var pz = _cinCenter.z + Math.cos(_cinAngle) * _cinRadius;

    if (_camera) {
      _camera.position.set(px, py, pz);
      _camera.lookAt(_cinCenter);
    } else if (typeof CameraSystem !== 'undefined' && CameraSystem.setPosition) {
      CameraSystem.setPosition(px, py, pz);
      // Compute yaw/pitch to look at center
      var dx = _cinCenter.x - px;
      var dy = _cinCenter.y - py;
      var dz = _cinCenter.z - pz;
      var yaw = Math.atan2(dx, dz);
      var dist = Math.sqrt(dx * dx + dz * dz);
      var pitch = Math.atan2(-dy, dist);
      if (CameraSystem.setYaw)   { CameraSystem.setYaw(yaw); }
      if (CameraSystem.setPitch) { CameraSystem.setPitch(pitch); }
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  CLIP EXPORT — S to mark start, E to mark end
   * ───────────────────────────────────────────────────────── */
  function _markClipStart() {
    _clipStart = Math.floor(_playIdx);
    _showClipMsg('CLIP START: ' + (_clipStart / 10).toFixed(1) + 's');
  }

  function _markClipEnd() {
    if (_clipStart < 0) {
      _showClipMsg('MARK START FIRST (S)');
      return;
    }
    _clipEnd = Math.floor(_playIdx);
    if (_clipEnd <= _clipStart) {
      _showClipMsg('END must be after START');
      return;
    }
    var frameCount = _clipEnd - _clipStart;
    if (frameCount > MAX_CLIP_FRAMES) {
      _clipEnd = _clipStart + MAX_CLIP_FRAMES;
      frameCount = MAX_CLIP_FRAMES;
    }
    var duration = frameCount / 10;

    // Build clip frames array
    var clipFrames = [];
    for (var i = _clipStart; i <= _clipEnd; i++) {
      var f = _getFrame(i);
      if (f) { clipFrames.push(f); }
    }

    var clip = {
      version:   1,
      duration:  duration,
      frames:    clipFrames,
      savedAt:   Date.now()
    };

    try {
      localStorage.setItem('ok_battleClip', JSON.stringify(clip));
      _showClipMsg('CLIP SAVED: ' + duration.toFixed(1) + 's');
    } catch (err) {
      _showClipMsg('CLIP SAVE FAILED (storage full?)');
    }

    _clipStart = -1;
    _clipEnd   = -1;
  }

  function _showClipMsg(msg) {
    if (!_clipMsgEl) return;
    _clipMsgEl.textContent = msg;
    _clipMsgEl.style.display = 'block';
    _clipMsgTimer = 3.0;
  }

  /* ─────────────────────────────────────────────────────────
   *  TIMELINE SCRUBBER — click to jump
   * ───────────────────────────────────────────────────────── */
  function _onScrubClick(e) {
    if (!_playing || !_scrubTrack) return;
    var rect = _scrubTrack.getBoundingClientRect();
    var ratio = (e.clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    _playIdx = ratio * (_count - 1);
  }

  /* ─────────────────────────────────────────────────────────
   *  GHOST POOL
   * ───────────────────────────────────────────────────────── */
  function _buildGhostPool() {
    if (!_scene || typeof THREE === 'undefined') return;
    var geo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
    for (var i = 0; i < GHOST_POOL_SIZE; i++) {
      var mat = new THREE.MeshBasicMaterial({
        color:       0x6688aa,  // blue-grey
        transparent: true,
        opacity:     0.4,
        depthWrite:  false
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.userData.isBattleReplayGhost = true;
      _scene.add(mesh);
      _ghostPool.push(mesh);
    }
  }

  function _setGhostsVisible(vis) {
    for (var i = 0; i < _ghostPool.length; i++) {
      if (!vis) {
        _ghostPool[i].visible = false;
        _ghostPool[i].material.opacity = 0;
      }
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  OVERLAY DOM
   * ───────────────────────────────────────────────────────── */
  function _buildOverlay() {
    // Main replay overlay — red border + REPLAY label top-right
    _overlay = document.createElement('div');
    _overlay.id = 'battle-replay-overlay';
    _overlay.style.cssText = [
      'display:none',
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'bottom:0',
      'border:3px solid #cc0000',
      'pointer-events:none',
      'z-index:8900',
      'box-sizing:border-box'
    ].join(';');

    // REPLAY label — top-right
    var labelBox = document.createElement('div');
    labelBox.style.cssText = [
      'position:absolute',
      'top:10px',
      'right:14px',
      'background:rgba(180,0,0,0.85)',
      'color:#fff',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'letter-spacing:3px',
      'padding:4px 10px',
      'border-radius:3px',
      'pointer-events:none'
    ].join(';');
    labelBox.textContent = 'REPLAY';
    _overlay.appendChild(labelBox);

    // HUD bar — top-left
    var hudBar = document.createElement('div');
    hudBar.style.cssText = [
      'position:absolute',
      'top:10px',
      'left:14px',
      'background:rgba(0,0,0,0.7)',
      'color:#fff',
      'font-family:monospace',
      'font-size:12px',
      'padding:5px 10px',
      'border-radius:3px',
      'line-height:1.6',
      'pointer-events:none'
    ].join(';');

    _speedEl = document.createElement('div');
    _speedEl.id = 'br-speed';
    _speedEl.textContent = 'Speed: 0.5x';
    hudBar.appendChild(_speedEl);

    _frameCountEl = document.createElement('div');
    _frameCountEl.id = 'br-frame';
    _frameCountEl.textContent = 'Frame 0/0';
    hudBar.appendChild(_frameCountEl);

    _timeEl = document.createElement('div');
    _timeEl.id = 'br-time';
    _timeEl.textContent = '0.0s / 60.0s';
    hudBar.appendChild(_timeEl);

    var hintEl = document.createElement('div');
    hintEl.style.cssText = 'color:#aaa;font-size:10px;margin-top:3px;';
    hintEl.textContent = 'TAB:speed  C:cinematic  S/E:clip  ESC:exit';
    hudBar.appendChild(hintEl);

    _overlay.appendChild(hudBar);

    // Timeline scrubber — bottom of screen
    var scrubContainer = document.createElement('div');
    scrubContainer.style.cssText = [
      'position:absolute',
      'bottom:20px',
      'left:40px',
      'right:40px',
      'height:28px',
      'pointer-events:all',
      'cursor:pointer'
    ].join(';');

    _scrubTrack = document.createElement('div');
    _scrubTrack.style.cssText = [
      'position:absolute',
      'top:10px',
      'left:0',
      'right:0',
      'height:8px',
      'background:rgba(40,40,40,0.9)',
      'border:1px solid #555',
      'border-radius:4px'
    ].join(';');
    scrubContainer.appendChild(_scrubTrack);

    _scrubDot = document.createElement('div');
    _scrubDot.style.cssText = [
      'position:absolute',
      'top:-4px',
      'left:0%',
      'width:16px',
      'height:16px',
      'background:#ffffff',
      'border-radius:50%',
      'transform:translateX(-50%)',
      'pointer-events:none',
      'box-shadow:0 0 4px rgba(0,0,0,0.5)'
    ].join(';');
    _scrubTrack.appendChild(_scrubDot);

    _scrubTimeEl = document.createElement('div');
    _scrubTimeEl.style.cssText = [
      'position:absolute',
      'bottom:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#fff',
      'font-family:monospace',
      'font-size:11px',
      'background:rgba(0,0,0,0.6)',
      'padding:1px 6px',
      'border-radius:2px',
      'pointer-events:none'
    ].join(';');
    _scrubTimeEl.textContent = '0.0s';
    scrubContainer.appendChild(_scrubTimeEl);

    scrubContainer.addEventListener('click', _onScrubClick, false);
    _overlay.appendChild(scrubContainer);

    // Clip message
    _clipMsgEl = document.createElement('div');
    _clipMsgEl.id = 'br-clip-msg';
    _clipMsgEl.style.cssText = [
      'display:none',
      'position:absolute',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:#ffdd00',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'padding:6px 16px',
      'border-radius:4px',
      'pointer-events:none',
      'letter-spacing:1px'
    ].join(';');
    _overlay.appendChild(_clipMsgEl);

    document.body.appendChild(_overlay);
  }

  function _showOverlay(vis) {
    if (_overlay) { _overlay.style.display = vis ? 'block' : 'none'; }
  }

  function _updateHUD(floatIdx) {
    var cur  = floatIdx / 10;           // seconds
    var total = (_count - 1) / 10;
    var pct  = _count > 1 ? floatIdx / (_count - 1) : 0;

    if (_frameCountEl) {
      _frameCountEl.textContent = 'Frame ' + Math.floor(floatIdx) + '/' + (_count - 1);
    }
    if (_timeEl) {
      _timeEl.textContent = cur.toFixed(1) + 's / ' + total.toFixed(1) + 's';
    }
    if (_speedEl) {
      _speedEl.textContent = 'Speed: ' + _playSpeed.toFixed(1) + 'x';
    }
    if (_scrubDot) {
      _scrubDot.style.left = (pct * 100).toFixed(1) + '%';
    }
    if (_scrubTimeEl) {
      _scrubTimeEl.textContent = cur.toFixed(1) + 's';
    }
  }

  /* ─────────────────────────────────────────────────────────
   *  KILL TEXT — "KILL" floating up in gold
   * ───────────────────────────────────────────────────────── */
  function _buildKillText() {
    _killTextEl = document.createElement('div');
    _killTextEl.id = 'battle-replay-kill';
    _killTextEl.style.cssText = [
      'display:none',
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'z-index:9100',
      'color:#ffd700',
      'font-family:monospace',
      'font-size:36px',
      'font-weight:bold',
      'letter-spacing:6px',
      'text-shadow:0 0 20px #ffaa00,0 0 40px #ff6600',
      'pointer-events:none'
    ].join(';');
    _killTextEl.textContent = 'KILL';
    document.body.appendChild(_killTextEl);
  }

  /* ─────────────────────────────────────────────────────────
   *  PLAYBACK KEY HANDLER
   * ───────────────────────────────────────────────────────── */
  function _registerPlaybackKeys() {
    _pbKeyHandler = function (e) {
      if (!_playing) return;

      // Tab — cycle speed
      if (e.code === 'Tab') {
        e.preventDefault();
        _speedIdx = (_speedIdx + 1) % _speedCycle.length;
        _playSpeed = _speedCycle[_speedIdx];
        return;
      }

      // C — toggle cinematic mode
      if (e.code === 'KeyC') {
        e.preventDefault();
        if (_cinematic) {
          _cinematic = false;
        } else {
          _enableCinematic();
        }
        return;
      }

      // S — mark clip start
      if (e.code === 'KeyS') {
        e.preventDefault();
        _markClipStart();
        return;
      }

      // E — mark clip end
      if (e.code === 'KeyE') {
        e.preventDefault();
        _markClipEnd();
        return;
      }

      // Escape — exit replay
      if (e.code === 'Escape') {
        e.preventDefault();
        stopReplay();
        return;
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
   *  RESET — clear buffer, stop replay
   * ───────────────────────────────────────────────────────── */
  function reset() {
    if (_playing) { stopReplay(); }
    _buffer  = [];
    _head    = 0;
    _count   = 0;
    _accumDt = 0;
    _lastRecord = 0;
    _clipStart  = -1;
    _clipEnd    = -1;
    _setGhostsVisible(false);
    _showOverlay(false);
  }

  /* ─────────────────────────────────────────────────────────
   *  PUBLIC API
   * ───────────────────────────────────────────────────────── */
  return {
    init:         init,
    update:       update,
    startReplay:  startReplay,
    stopReplay:   stopReplay,
    reset:        reset
  };
})();
