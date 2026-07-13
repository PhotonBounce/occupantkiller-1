/* death-cam.js — slow-motion cinematic death replay camera
 * IIFE pattern, all var. Exposes window.DeathCam = { init, triggerDeath, update, isActive, skip }
 */
window.DeathCam = (function () {

  // ── Private state ────────────────────────────────────────────────
  var _active        = false;
  var _elapsed       = 0;
  var _phase         = 'slowmo';   // 'slowmo' | 'freeze'
  var _timeScale     = 1;

  var _scene         = null;
  var _playerCam     = null;       // original game camera ref (stored, not mutated)
  var _cam           = null;       // our cinematic THREE.PerspectiveCamera
  var _deathPos      = null;       // THREE.Vector3 — player death position
  var _killerPos     = null;       // THREE.Vector3 — killer position (may be null)
  var _killerMesh    = null;       // THREE.Object3D (optional)
  var _orbitTarget   = null;       // THREE.Vector3 — what we orbit around

  // shake state
  var _shakeRemaining = 0;
  var _shakeBasePos   = null;      // THREE.Vector3

  // fog
  var _fogFarOriginal = 0;
  var _fogNearOriginal = 0;

  // key state
  var _spaceDown = false;
  var _spaceHandler = null;
  var _clickHandler = null;

  // overlay elements (created once)
  var _overlay     = null;  // #deathCamOverlay red tint
  var _kiaText     = null;  // #kiaText
  var _skipBtn     = null;  // skip button
  var _blackFade   = null;  // full-black fade-out div

  var _kiaShown    = false;
  var _skipShown   = false;
  var _fading      = false;
  var _fadeElapsed = 0;

  // ── DOM helpers ─────────────────────────────────────────────────
  function _ensureOverlays() {
    // Red tint overlay
    if (!document.getElementById('deathCamOverlay')) {
      var el = document.createElement('div');
      el.id = 'deathCamOverlay';
      el.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'right:0', 'bottom:0',
        'background:rgba(120,0,0,0)',
        'pointer-events:none',
        'z-index:990',
        'transition:background 0.5s',
        'display:none'
      ].join(';');
      document.body.appendChild(el);
    }
    _overlay = document.getElementById('deathCamOverlay');

    // "KILLED IN ACTION" text
    if (!document.getElementById('kiaText')) {
      var kt = document.createElement('div');
      kt.id = 'kiaText';
      kt.style.cssText = [
        'position:fixed',
        'top:30%',
        'left:50%',
        'transform:translateX(-50%)',
        'font-family:Georgia,"Times New Roman",serif',
        'font-size:48px',
        'font-weight:bold',
        'color:#ffffff',
        'letter-spacing:8px',
        'text-shadow:0 0 30px rgba(255,0,0,0.8),0 2px 4px rgba(0,0,0,0.9)',
        'pointer-events:none',
        'z-index:992',
        'opacity:0',
        'transition:opacity 1s ease-in',
        'display:none',
        'white-space:nowrap'
      ].join(';');
      kt.textContent = 'KILLED IN ACTION';
      document.body.appendChild(kt);
    }
    _kiaText = document.getElementById('kiaText');

    // Skip button
    if (!document.getElementById('deathCamSkipBtn')) {
      var sb = document.createElement('div');
      sb.id = 'deathCamSkipBtn';
      sb.style.cssText = [
        'position:fixed',
        'bottom:40px',
        'left:50%',
        'transform:translateX(-50%)',
        'font-family:monospace',
        'font-size:14px',
        'color:#ffffff',
        'background:rgba(0,0,0,0.6)',
        'border:1px solid rgba(255,255,255,0.4)',
        'padding:6px 24px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:993',
        'opacity:0',
        'transition:opacity 0.4s',
        'display:none',
        'letter-spacing:2px'
      ].join(';');
      sb.textContent = 'PRESS SPACE/CLICK TO SKIP';
      document.body.appendChild(sb);
    }
    _skipBtn = document.getElementById('deathCamSkipBtn');

    // Black fade overlay
    if (!document.getElementById('deathCamBlackFade')) {
      var bf = document.createElement('div');
      bf.id = 'deathCamBlackFade';
      bf.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'right:0', 'bottom:0',
        'background:rgba(0,0,0,0)',
        'pointer-events:none',
        'z-index:995',
        'transition:background 0.5s',
        'display:none'
      ].join(';');
      document.body.appendChild(bf);
    }
    _blackFade = document.getElementById('deathCamBlackFade');
  }

  function _showOverlay(show) {
    if (!_overlay) return;
    _overlay.style.display = show ? 'block' : 'none';
  }

  function _setRedTint(alpha) {
    if (!_overlay) return;
    _overlay.style.background = 'rgba(120,0,0,' + alpha + ')';
  }

  function _showKIA(show) {
    if (!_kiaText) return;
    _kiaText.style.display = show ? 'block' : 'none';
    // Force reflow then fade in
    if (show) {
      _kiaText.style.opacity = '0';
      // Use setTimeout to allow display to take effect before transition
      setTimeout(function () {
        if (_kiaText) _kiaText.style.opacity = '1';
      }, 20);
    }
  }

  function _showSkip(show) {
    if (!_skipBtn) return;
    _skipBtn.style.display = show ? 'block' : 'none';
    if (show) {
      _skipBtn.style.opacity = '0';
      setTimeout(function () {
        if (_skipBtn) _skipBtn.style.opacity = '1';
      }, 20);
    }
  }

  function _startBlackFade(onDone) {
    if (!_blackFade) { if (onDone) onDone(); return; }
    _blackFade.style.display = 'block';
    _blackFade.style.background = 'rgba(0,0,0,0)';
    _fading = true;
    _fadeElapsed = 0;
    // Trigger CSS transition
    setTimeout(function () {
      if (_blackFade) _blackFade.style.background = 'rgba(0,0,0,1)';
    }, 20);
    setTimeout(function () {
      _fading = false;
      if (onDone) onDone();
    }, 520);
  }

  function _hideAll() {
    _showOverlay(false);
    if (_kiaText) { _kiaText.style.display = 'none'; _kiaText.style.opacity = '0'; }
    if (_skipBtn) { _skipBtn.style.display = 'none'; _skipBtn.style.opacity = '0'; }
    if (_blackFade) { _blackFade.style.display = 'none'; _blackFade.style.background = 'rgba(0,0,0,0)'; }
  }

  // ── Input handlers ──────────────────────────────────────────────
  function _attachInputHandlers() {
    _spaceDown = false;
    _spaceHandler = function (e) {
      if (e.code === 'Space' || e.keyCode === 32) {
        _spaceDown = true;
        e.preventDefault();
        e.stopPropagation();
      }
    };
    _clickHandler = function () {
      if (_active && _phase === 'freeze') {
        skip();
      }
    };
    document.addEventListener('keydown', _spaceHandler, true);
    document.addEventListener('click',   _clickHandler, true);
  }

  function _detachInputHandlers() {
    if (_spaceHandler) { document.removeEventListener('keydown', _spaceHandler, true); _spaceHandler = null; }
    if (_clickHandler) { document.removeEventListener('click',   _clickHandler, true); _clickHandler = null; }
  }

  // ── Camera setup ────────────────────────────────────────────────
  function _createCinematicCamera() {
    if (typeof THREE === 'undefined') return;
    _cam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
    // Start 6 units away at Y+3
    _cam.position.set(
      _orbitTarget.x + 6,
      _orbitTarget.y + 3,
      _orbitTarget.z
    );
    _cam.lookAt(_orbitTarget);
  }

  // ── Camera orbit math ───────────────────────────────────────────
  // angle in radians from start, r = radius, y = height
  function _setCamOrbit(angle, r, y) {
    if (!_cam || !_orbitTarget) return;
    _cam.position.set(
      _orbitTarget.x + Math.cos(angle) * r,
      _orbitTarget.y + y,
      _orbitTarget.z + Math.sin(angle) * r
    );
    _cam.lookAt(_orbitTarget);
  }

  // ── Cleanup ─────────────────────────────────────────────────────
  function _cleanup() {
    _active = false;
    _phase  = 'slowmo';
    _elapsed = 0;
    _kiaShown = false;
    _skipShown = false;
    _spaceDown = false;
    _fading = false;
    _shakeRemaining = 0;
    window._deathTimeScale = 1;
    _detachInputHandlers();
    _hideAll();
    // Restore fog
    if (_scene && _scene.fog) {
      _scene.fog.near = _fogNearOriginal;
      _scene.fog.far  = _fogFarOriginal;
    }
  }

  function _complete() {
    _cleanup();
    if (typeof window._onDeathCamComplete === 'function') {
      window._onDeathCamComplete();
    }
  }

  // ── Public API ──────────────────────────────────────────────────

  function init(scene, camera) {
    _scene     = scene;
    _playerCam = camera;
    _ensureOverlays();
  }

  function triggerDeath(playerPos, killerPos, killerMesh) {
    if (typeof THREE === 'undefined') {
      // THREE not available — call complete immediately
      if (typeof window._onDeathCamComplete === 'function') window._onDeathCamComplete();
      return;
    }

    _ensureOverlays();
    _active      = false; // reset first
    _elapsed     = 0;
    _phase       = 'slowmo';
    _kiaShown    = false;
    _skipShown   = false;
    _spaceDown   = false;
    _fading      = false;

    // Store positions
    _deathPos   = playerPos  ? playerPos.clone()  : new THREE.Vector3();
    _killerPos  = killerPos  ? killerPos.clone()   : null;
    _killerMesh = killerMesh || null;

    // Orbit target: killer if available, else death point
    _orbitTarget = (_killerMesh ? _killerMesh.position : (_killerPos ? _killerPos : _deathPos)).clone();

    // Save original fog
    if (_scene && _scene.fog) {
      _fogFarOriginal  = _scene.fog.far;
      _fogNearOriginal = _scene.fog.near;
    }

    // Create cinematic camera
    _createCinematicCamera();
    if (!_cam) {
      // Fallback: no THREE camera
      if (typeof window._onDeathCamComplete === 'function') window._onDeathCamComplete();
      return;
    }

    // Apply slow-motion
    window._deathTimeScale = 0.15;

    // Show overlays
    _showOverlay(true);

    // Vignette: flash white, then fade to red
    _setRedTint(0);
    // White flash via a temporary extra overlay
    var _flashEl = document.createElement('div');
    _flashEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(255,255,255,0.6)',
      'pointer-events:none',
      'z-index:991',
      'transition:opacity 0.5s',
      'opacity:1'
    ].join(';');
    document.body.appendChild(_flashEl);
    setTimeout(function () {
      _flashEl.style.opacity = '0';
      // After 0.1s flash, begin red tint fade-in over 0.5s
      setTimeout(function () {
        _setRedTint(0.25);
        setTimeout(function () {
          if (_flashEl.parentNode) _flashEl.parentNode.removeChild(_flashEl);
        }, 600);
      }, 100);
    }, 100);

    // Camera shake: 0.3s of jitter
    _shakeRemaining = 0.3;
    _shakeBasePos = _cam.position.clone();

    // Attach input handlers
    _detachInputHandlers();
    _attachInputHandlers();

    // Activate
    _active = true;
  }

  function update(delta) {
    if (!_active || !_cam) return;

    // Advance time at _deathTimeScale (slow-mo or freeze)
    _elapsed += delta * (window._deathTimeScale || 1);

    // ── Camera shake on first 0.3s ──────────────────────────────
    if (_shakeRemaining > 0) {
      _shakeRemaining -= delta;
      if (_shakeBasePos && _cam) {
        var jx = (Math.random() - 0.5) * 0.4;
        var jy = (Math.random() - 0.5) * 0.4;
        var jz = (Math.random() - 0.5) * 0.4;
        _cam.position.x = _shakeBasePos.x + jx;
        _cam.position.y = _shakeBasePos.y + jy;
        _cam.position.z = _shakeBasePos.z + jz;
        _cam.lookAt(_orbitTarget);
      }
    }

    // ── Phase 1: 0–2s slow-mo orbit ────────────────────────────
    if (_phase === 'slowmo') {
      // Elapsed here is scaled by slow-mo (0.15), so real 13.3s feels like 2s
      // But we use unscaled elapsed in the caller: _elapsed += delta (not scaled)
      // We want the phase based on real elapsed, so re-derive from _elapsed / _deathTimeScale
      // Actually per spec: update receives delta already unscaled from game loop,
      // and we scale it ourselves. So _elapsed is "slow-mo seconds" (slow).
      // To phase at 2s real, we need _elapsed / 0.15 >= 2 → _elapsed >= 0.30
      // BUT: spec says "0–2s" in the display. Let's use a rawElapsed tracking instead.
      // We'll track in real seconds separately.
      // Re-implementation: _elapsed tracks real seconds (delta not multiplied by timescale here).
      // We already did: _elapsed += delta * (window._deathTimeScale || 1)
      // That means _elapsed is "slow" time. Let's instead NOT multiply by timescale here
      // and track raw real seconds:
      // (Note: triggerDeath sets this, so we'll refactor to use rawElapsed approach)
      // Since we already did += delta * timescale, let's keep _elapsed as real seconds instead.
      // We'll undo the timescale multiplication here and just use delta directly.

      // [Design note: the _elapsed logic above multiplies by _deathTimeScale.
      //  For phase transitions at real-world clock times (2s, 4s), we need raw time.
      //  We store rawElapsed separately below.]

      // orbit params: radius 6, Y from +3 to +7 over 2s, 60° arc
      var t1 = Math.min(_elapsed / 2, 1); // normalized 0→1 over 2 real seconds
      var orbitY = 3 + (7 - 3) * t1;
      var orbitAngle = (Math.PI / 3) * t1; // 60° sweep = PI/3 radians
      if (_shakeRemaining <= 0) {
        _setCamOrbit(orbitAngle, 6, orbitY);
        _shakeBasePos = _cam.position.clone();
      }

      // Narrow fog
      if (_scene && _scene.fog) {
        _scene.fog.far  = _fogFarOriginal - (_fogFarOriginal - 15) * t1;
        _scene.fog.near = _fogNearOriginal;
      }

      // Deepen red tint slightly over phase
      _setRedTint(0.25 + 0.1 * t1);

      // Show KIA at 1.5s
      if (_elapsed >= 1.5 && !_kiaShown) {
        _kiaShown = true;
        _showKIA(true);
      }

      // Transition to phase 2 at 2s
      if (_elapsed >= 2) {
        _phase = 'freeze';
        window._deathTimeScale = 0;
        _setRedTint(0.35);
        if (!_skipShown) {
          _skipShown = true;
          _showSkip(true);
        }
      }
    }

    // ── Phase 2: 2–4s freeze zoom ───────────────────────────────
    if (_phase === 'freeze') {
      // _elapsed still advances (timescale is 0 so delta * 0 = 0 addition)
      // We need a secondary real-time counter for the freeze phase.
      // delta is always raw real seconds from game loop — timescale=0 means game world
      // is frozen but our camera still needs to animate.
      // _elapsed was already incremented above by delta * 0 = 0 — stuck!
      // We need to use raw delta for phase 2 animation. Let's track freeze-elapsed.
      // This is handled below via _freezeElapsed tracked separately.

      // Show skip
      if (!_skipShown) {
        _skipShown = true;
        _showSkip(true);
      }

      // Space key check
      if (_spaceDown) {
        _spaceDown = false;
        skip();
        return;
      }

      // End at 4s total (2s freeze) — _freezeElapsed handled after this block
      if (_freezeElapsed >= 2) {
        _startBlackFade(function () { _complete(); });
        _active = false;
        return;
      }

      // Camera zoom toward killer: Y from +3 to +1.5 over 2s freeze
      var t2 = Math.min(_freezeElapsed / 2, 1);
      var zoomAngle = Math.PI / 3; // end of phase 1 angle
      var zoomY = 3 - (3 - 1.5) * t2;
      // Zoom radius: 6 → 3
      var zoomRadius = 6 - 3 * t2;
      _setCamOrbit(zoomAngle, zoomRadius, zoomY);
    }
  }

  // ── Freeze-phase real-elapsed tracker ──────────────────────────
  // We override update to split the two phases properly.
  // Use a wrapper that tracks raw delta separately for phase 2.
  var _freezeElapsed = 0;
  var _rawElapsed    = 0;  // actual wall-clock seconds since triggerDeath

  // Override the update function with the proper implementation:
  function _updateImpl(delta) {
    if (!_active || !_cam) return;

    _rawElapsed += delta;

    // ── Camera shake ────────────────────────────────────────────
    if (_shakeRemaining > 0) {
      _shakeRemaining -= delta;
      if (_shakeBasePos && _cam) {
        var jx = (Math.random() - 0.5) * 0.4;
        var jy = (Math.random() - 0.5) * 0.4;
        var jz = (Math.random() - 0.5) * 0.4;
        _cam.position.x = _shakeBasePos.x + jx;
        _cam.position.y = _shakeBasePos.y + jy;
        _cam.position.z = _shakeBasePos.z + jz;
        _cam.lookAt(_orbitTarget);
        return; // skip camera positioning while shaking
      }
    }

    if (_phase === 'slowmo') {
      // Phase 1: 0–2 real seconds
      var t1 = Math.min(_rawElapsed / 2, 1);
      var orbitY   = 3 + 4 * t1;               // Y: 3 → 7
      var orbitAngle = (Math.PI / 3) * t1;     // angle: 0 → 60°
      _setCamOrbit(orbitAngle, 6, orbitY);
      _shakeBasePos = _cam.position.clone();

      // Narrow fog for drama
      if (_scene && _scene.fog) {
        _scene.fog.far = _fogFarOriginal - (_fogFarOriginal - 15) * t1;
      }

      // Deepen tint
      _setRedTint(0.25 + 0.1 * t1);

      // KIA text at 1.5s
      if (_rawElapsed >= 1.5 && !_kiaShown) {
        _kiaShown = true;
        _showKIA(true);
      }

      // Phase 1 → 2 at 2s
      if (_rawElapsed >= 2) {
        _phase = 'freeze';
        _freezeElapsed = 0;
        window._deathTimeScale = 0;
        _setRedTint(0.35);
        if (!_skipShown) {
          _skipShown = true;
          _showSkip(true);
        }
      }

    } else if (_phase === 'freeze') {
      _freezeElapsed += delta;

      // Space key
      if (_spaceDown) {
        _spaceDown = false;
        skip();
        return;
      }

      // End after 2s of freeze (4s total)
      if (_freezeElapsed >= 2) {
        _active = false;
        _startBlackFade(function () { _complete(); });
        return;
      }

      // Zoom toward killer: radius 6→3, Y 3→1.5
      var t2 = Math.min(_freezeElapsed / 2, 1);
      var zoomAngle  = Math.PI / 3;
      var zoomY      = 3 - 1.5 * t2;
      var zoomRadius = 6 - 3  * t2;
      _setCamOrbit(zoomAngle, zoomRadius, zoomY);
    }
  }

  function isActive() {
    return _active;
  }

  function getCamera() {
    return _cam;
  }

  function skip() {
    if (!_active) return;
    _active = false;
    _startBlackFade(function () { _complete(); });
  }

  // reset _rawElapsed on triggerDeath — patch into triggerDeath after definition
  var _origTriggerDeath = triggerDeath;
  triggerDeath = function (playerPos, killerPos, killerMesh) {
    _rawElapsed    = 0;
    _freezeElapsed = 0;
    _origTriggerDeath(playerPos, killerPos, killerMesh);
  };

  return {
    init:         init,
    triggerDeath: triggerDeath,
    update:       _updateImpl,
    isActive:     isActive,
    getCamera:    getCamera,
    skip:         skip
  };

}());
