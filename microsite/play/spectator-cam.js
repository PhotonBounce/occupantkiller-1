/* spectator-cam.js — post-death spectator camera (5s, orbit or enemy-follow)
 * IIFE pattern, all var. Exposes window.SpectatorCam = { init, activate, deactivate, update, isActive }
 * Hook: window._onPlayerDeathSpectator() — called by game-manager before death screen.
 * On end: calls window._onSpectateEnd?.() to trigger death screen.
 */
window.SpectatorCam = (function () {

  // ── Config ───────────────────────────────────────────────────────
  var SPECTATE_DURATION  = 5;      // seconds before auto-end
  var ORBIT_RADIUS       = 8;      // units from death position
  var ORBIT_HEIGHT       = 4;      // units above death position
  var ORBIT_PERIOD       = 8;      // seconds for full 360° rotation
  var ENEMY_OFFSET_BACK  = 3;      // units behind enemy
  var ENEMY_OFFSET_UP    = 2;      // units above enemy
  var FADE_DURATION      = 0.5;    // seconds for fade-to-black
  var DEATH_TIME_SCALE   = 0.4;    // slow motion factor

  // ── Private state ────────────────────────────────────────────────
  var _active        = false;
  var _camera        = null;   // Three.js camera ref from init()
  var _scene         = null;   // Three.js scene ref from init()

  // Saved camera state
  var _savedPosition   = null;
  var _savedQuaternion = null;

  // Death position (THREE.Vector3)
  var _deathPos = null;

  // Timers
  var _elapsed      = 0;
  var _fadeElapsed  = 0;
  var _fading       = false;
  var _done         = false;

  // Mode
  var _mode         = 'orbit';   // 'orbit' | 'follow'
  var _targetEnemy  = null;      // enemy object for follow mode

  // Input
  var _spaceHandler = null;

  // DOM overlay elements
  var _spectateBar     = null;
  var _progressBar     = null;
  var _progressFill    = null;
  var _eliminatedText  = null;
  var _vignetteEl      = null;
  var _blackFade       = null;
  var _canvasEl        = null;   // Three.js canvas (for filter)

  // ── DOM helpers ──────────────────────────────────────────────────
  function _ensureOverlays() {
    // Spectating HUD bar (top-center)
    if (!document.getElementById('spectatorBar')) {
      var bar = document.createElement('div');
      bar.id = 'spectatorBar';
      bar.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'right:0',
        'background:rgba(0,0,0,0.65)',
        'color:#fff',
        'font-family:monospace',
        'font-size:14px',
        'text-align:center',
        'padding:6px 0 4px',
        'z-index:1050',
        'pointer-events:none',
        'display:none'
      ].join(';');
      bar.innerHTML = '<span id="spectatorLabel">&#11044; SPECTATING &#8212; <span id="spectatorTimer">5.0s</span> remaining</span>' +
        '<br><span style="font-size:11px;color:#aaa;letter-spacing:1px">Press SPACE to skip</span>' +
        '<div id="spectatorProgressTrack" style="height:3px;background:rgba(255,255,255,0.15);margin:4px 20px 0;border-radius:2px;overflow:hidden">' +
        '<div id="spectatorProgressFill" style="height:100%;width:100%;background:#ff4444;transition:none;border-radius:2px"></div>' +
        '</div>';
      document.body.appendChild(bar);
    }
    _spectateBar   = document.getElementById('spectatorBar');
    _progressFill  = document.getElementById('spectatorProgressFill');

    // "ELIMINATED" center text
    if (!document.getElementById('spectatorEliminated')) {
      var el = document.createElement('div');
      el.id = 'spectatorEliminated';
      el.style.cssText = [
        'position:fixed',
        'top:50%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'font-family:monospace',
        'font-size:64px',
        'font-weight:bold',
        'color:rgba(200,0,0,0.45)',
        'letter-spacing:10px',
        'pointer-events:none',
        'z-index:1051',
        'display:none',
        'white-space:nowrap',
        'text-shadow:0 0 40px rgba(255,0,0,0.3)'
      ].join(';');
      el.textContent = 'ELIMINATED';
      document.body.appendChild(el);
    }
    _eliminatedText = document.getElementById('spectatorEliminated');

    // Vignette overlay (dark edges)
    if (!document.getElementById('spectatorVignette')) {
      var vig = document.createElement('div');
      vig.id = 'spectatorVignette';
      vig.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'right:0', 'bottom:0',
        'background:radial-gradient(transparent 40%, black 100%)',
        'pointer-events:none',
        'z-index:1048',
        'display:none'
      ].join(';');
      document.body.appendChild(vig);
    }
    _vignetteEl = document.getElementById('spectatorVignette');

    // Black fade overlay
    if (!document.getElementById('spectatorBlackFade')) {
      var bf = document.createElement('div');
      bf.id = 'spectatorBlackFade';
      bf.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'right:0', 'bottom:0',
        'background:rgba(0,0,0,0)',
        'pointer-events:none',
        'z-index:1055',
        'transition:background ' + FADE_DURATION + 's linear',
        'display:none'
      ].join(';');
      document.body.appendChild(bf);
    }
    _blackFade = document.getElementById('spectatorBlackFade');
  }

  // ── Canvas visual filter ────────────────────────────────────────
  function _applyCanvasFilter() {
    if (!_canvasEl) {
      _canvasEl = document.querySelector('canvas');
    }
    if (_canvasEl) {
      _canvasEl.style.filter = 'saturate(0.3) sepia(0.4)';
    }
  }

  function _removeCanvasFilter() {
    if (!_canvasEl) {
      _canvasEl = document.querySelector('canvas');
    }
    if (_canvasEl) {
      _canvasEl.style.filter = '';
    }
  }

  // ── Show / hide overlays ────────────────────────────────────────
  function _showOverlays() {
    if (_spectateBar)    _spectateBar.style.display = 'block';
    if (_eliminatedText) _eliminatedText.style.display = 'block';
    if (_vignetteEl)     _vignetteEl.style.display = 'block';
  }

  function _hideOverlays() {
    if (_spectateBar)    _spectateBar.style.display = 'none';
    if (_eliminatedText) _eliminatedText.style.display = 'none';
    if (_vignetteEl)     _vignetteEl.style.display = 'none';
    if (_blackFade) {
      _blackFade.style.display = 'none';
      _blackFade.style.background = 'rgba(0,0,0,0)';
    }
  }

  function _updateHUD() {
    var remaining = Math.max(0, SPECTATE_DURATION - _elapsed);
    var timerEl = document.getElementById('spectatorTimer');
    if (timerEl) timerEl.textContent = remaining.toFixed(1) + 's';
    if (_progressFill) {
      var pct = (remaining / SPECTATE_DURATION) * 100;
      _progressFill.style.width = pct + '%';
    }
  }

  // ── Save / restore camera ───────────────────────────────────────
  function _saveCameraState() {
    if (!_camera || typeof THREE === 'undefined') return;
    _savedPosition   = _camera.position.clone();
    _savedQuaternion = _camera.quaternion.clone();
  }

  function _restoreCameraState() {
    if (!_camera || !_savedPosition || !_savedQuaternion) return;
    _camera.position.copy(_savedPosition);
    _camera.quaternion.copy(_savedQuaternion);
  }

  // ── Enemy discovery ─────────────────────────────────────────────
  function _findNearestEnemy(fromPos) {
    if (!fromPos) return null;
    try {
      var enemies = null;
      if (window.Enemies && typeof window.Enemies.getAll === 'function') {
        enemies = window.Enemies.getAll();
      }
      if (!enemies || enemies.length === 0) return null;

      var nearest = null;
      var nearestDist = Infinity;

      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || !e.alive || !e.mesh) continue;
        var epos = e.mesh.position;
        var dx = epos.x - fromPos.x;
        var dy = epos.y - fromPos.y;
        var dz = epos.z - fromPos.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = e;
        }
      }
      return nearest;
    } catch (err) {
      return null;
    }
  }

  // ── Camera orbit update ─────────────────────────────────────────
  function _updateOrbitCamera(rawElapsed) {
    if (!_camera || !_deathPos || typeof THREE === 'undefined') return;
    var angle = (rawElapsed / ORBIT_PERIOD) * Math.PI * 2;
    _camera.position.set(
      _deathPos.x + Math.cos(angle) * ORBIT_RADIUS,
      _deathPos.y + ORBIT_HEIGHT,
      _deathPos.z + Math.sin(angle) * ORBIT_RADIUS
    );
    _camera.lookAt(_deathPos);
  }

  // ── Camera follow-enemy update ──────────────────────────────────
  function _updateFollowCamera() {
    if (!_camera || !_targetEnemy || !_targetEnemy.mesh || typeof THREE === 'undefined') {
      // Fall back to orbit if enemy is gone
      _mode = 'orbit';
      return;
    }

    var emesh = _targetEnemy.mesh;
    var epos  = emesh.position;

    // Get enemy facing direction from its quaternion / rotation
    var forwardX = 0;
    var forwardZ = -1;
    if (emesh.rotation) {
      forwardX = Math.sin(emesh.rotation.y);
      forwardZ = Math.cos(emesh.rotation.y);
    }

    // Position camera: behind = subtract forward, above = +up
    _camera.position.set(
      epos.x - forwardX * ENEMY_OFFSET_BACK,
      epos.y + ENEMY_OFFSET_UP,
      epos.z - forwardZ * ENEMY_OFFSET_BACK
    );

    // Look where the enemy is facing (ahead of them)
    var lookAtX = epos.x + forwardX * 10;
    var lookAtY = epos.y;
    var lookAtZ = epos.z + forwardZ * 10;
    _camera.lookAt(new THREE.Vector3(lookAtX, lookAtY, lookAtZ));
  }

  // ── Fade to black then end ──────────────────────────────────────
  function _startFade(onDone) {
    if (!_blackFade) { if (onDone) onDone(); return; }
    _blackFade.style.display = 'block';
    _blackFade.style.background = 'rgba(0,0,0,0)';
    // Force reflow then transition
    void _blackFade.offsetHeight;
    _blackFade.style.background = 'rgba(0,0,0,1)';
    setTimeout(function () {
      if (onDone) onDone();
    }, Math.round(FADE_DURATION * 1000) + 60);
  }

  // ── Input ────────────────────────────────────────────────────────
  function _attachSpaceHandler() {
    _spaceHandler = function (e) {
      if ((e.code === 'Space' || e.keyCode === 32) && _active) {
        e.preventDefault();
        e.stopPropagation();
        deactivate();
      }
    };
    document.addEventListener('keydown', _spaceHandler, true);
  }

  function _detachSpaceHandler() {
    if (_spaceHandler) {
      document.removeEventListener('keydown', _spaceHandler, true);
      _spaceHandler = null;
    }
  }

  // ── Cleanup ──────────────────────────────────────────────────────
  function _cleanup() {
    _active       = false;
    _fading       = false;
    _done         = false;
    _elapsed      = 0;
    _fadeElapsed  = 0;
    _targetEnemy  = null;
    _mode         = 'orbit';
    window._deathTimeScale = 1;
    _detachSpaceHandler();
    _removeCanvasFilter();
    _hideOverlays();
    _restoreCameraState();
  }

  function _complete() {
    _cleanup();
    if (typeof window._onSpectateEnd === 'function') {
      window._onSpectateEnd();
    }
  }

  // ── Public API ───────────────────────────────────────────────────

  function init(camera, scene) {
    _camera = camera;
    _scene  = scene;
    _ensureOverlays();

    // Register hook: game-manager calls this when player dies
    window._onPlayerDeathSpectator = function (deathPos) {
      activate(deathPos);
    };
  }

  function activate(deathPos) {
    if (_active) return;

    if (typeof THREE === 'undefined') {
      // THREE not available — skip straight to death screen
      if (typeof window._onSpectateEnd === 'function') window._onSpectateEnd();
      return;
    }

    _ensureOverlays();

    _elapsed     = 0;
    _fadeElapsed = 0;
    _fading      = false;
    _done        = false;

    // Store death position
    _deathPos = deathPos
      ? (deathPos.isVector3 ? deathPos.clone() : new THREE.Vector3(deathPos.x || 0, deathPos.y || 0, deathPos.z || 0))
      : new THREE.Vector3();

    // Save original camera state
    _saveCameraState();

    // Try to find nearest enemy for follow mode
    var nearestEnemy = _findNearestEnemy(_deathPos);
    if (nearestEnemy) {
      _mode = 'follow';
      _targetEnemy = nearestEnemy;
    } else {
      _mode = 'orbit';
      _targetEnemy = null;
    }

    // Apply slow motion
    window._deathTimeScale = DEATH_TIME_SCALE;

    // Apply visual filter to canvas
    _applyCanvasFilter();

    // Show overlays
    _showOverlays();
    _updateHUD();

    // Attach space-to-skip handler
    _detachSpaceHandler();
    _attachSpaceHandler();

    _active = true;
  }

  function deactivate() {
    if (!_active || _fading) return;
    _fading = true;
    _active = false;
    _detachSpaceHandler();
    _startFade(function () {
      _complete();
    });
  }

  function update(delta) {
    if (!_active) return;

    _elapsed += delta;

    // Update HUD timer
    _updateHUD();

    // Update camera
    if (_mode === 'follow') {
      // Verify enemy still alive
      if (_targetEnemy && _targetEnemy.alive && _targetEnemy.mesh) {
        _updateFollowCamera();
      } else {
        _mode = 'orbit';
        _targetEnemy = null;
        _updateOrbitCamera(_elapsed);
      }
    } else {
      _updateOrbitCamera(_elapsed);
    }

    // Auto-end after SPECTATE_DURATION
    if (_elapsed >= SPECTATE_DURATION && !_fading) {
      deactivate();
    }
  }

  function isActive() {
    return _active;
  }

  return {
    init:       init,
    activate:   activate,
    deactivate: deactivate,
    update:     update,
    isActive:   isActive
  };

}());
