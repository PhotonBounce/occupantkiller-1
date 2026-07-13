window.ParachuteInsert = (function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var _active = false;
  var _phase = 0;          // 1 = freefall, 2 = chute deploy, 3 = landing, 0 = idle
  var _phaseTimer = 0;
  var _triggered = false;  // guard: only fires once per level (wave 1)
  var _skipped = false;

  var _scene = null;
  var _camera = null;

  // Audio
  var _audioCtx = null;
  var _windSource = null;
  var _windGain = null;
  var _windFilter = null;

  // Chute mesh group
  var _chuteGroup = null;
  var _shroudLines = [];

  // Overlay elements
  var _overlay = null;      // full-screen black fade
  var _altDisplay = null;   // altitude readout
  var _insertText = null;   // "INSERTION COMPLETE"

  // Phase durations (seconds)
  var PHASE1_DUR = 3;
  var PHASE2_DUR = 2;
  var PHASE3_DUR = 1;

  // Camera Y boundaries
  var Y_START = 80;
  var Y_CHUTE_DEPLOY = 20;
  var Y_LAND = 1;

  // Descent speeds (units/sec)
  var SPEED_FREEFALL = 25;
  var SPEED_CHUTE = 3;

  // Jolt state for phase 2 entry
  var _joltApplied = false;

  // Camera shake state (phase 3 landing)
  var _shakeTimer = 0;
  var _shakeIntensity = 0;
  var _origCamPos = null;

  // Phase 3 text fade state
  var _textTimer = 0;
  var _TEXT_FADE_DUR = 1.5;

  // Steer input (phase 2, A/D keys)
  var _steerLeft = false;
  var _steerRight = false;
  var _steerSpeed = 3; // units/sec horizontal

  // ---------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------
  function _createOverlay() {
    _overlay = document.createElement('div');
    _overlay.id = 'parachute-overlay';
    _overlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(0,0,0,1)',
      'pointer-events:none',
      'z-index:9999',
      'transition:none',
      'opacity:1'
    ].join(';');
    document.body.appendChild(_overlay);

    _altDisplay = document.createElement('div');
    _altDisplay.id = 'parachute-alt';
    _altDisplay.style.cssText = [
      'position:fixed',
      'top:16px',
      'right:20px',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:10000',
      'text-shadow:0 0 6px #00ff88',
      'display:none'
    ].join(';');
    _altDisplay.textContent = 'ALT: 800m';
    document.body.appendChild(_altDisplay);

    _insertText = document.createElement('div');
    _insertText.id = 'parachute-insert-text';
    _insertText.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ffffff',
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'letter-spacing:4px',
      'pointer-events:none',
      'z-index:10000',
      'text-shadow:0 0 12px #fff',
      'opacity:0',
      'display:none'
    ].join(';');
    _insertText.textContent = 'INSERTION COMPLETE';
    document.body.appendChild(_insertText);
  }

  function _removeOverlay() {
    if (_overlay && _overlay.parentNode) { _overlay.parentNode.removeChild(_overlay); }
    if (_altDisplay && _altDisplay.parentNode) { _altDisplay.parentNode.removeChild(_altDisplay); }
    if (_insertText && _insertText.parentNode) { _insertText.parentNode.removeChild(_insertText); }
    _overlay = null;
    _altDisplay = null;
    _insertText = null;
  }

  // ---------------------------------------------------------------------------
  // Audio
  // ---------------------------------------------------------------------------
  function _startWindAudio() {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var bufferSize = _audioCtx.sampleRate * 2;
      var buffer = _audioCtx.createBuffer(1, bufferSize, _audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      _windSource = _audioCtx.createBufferSource();
      _windSource.buffer = buffer;
      _windSource.loop = true;

      _windFilter = _audioCtx.createBiquadFilter();
      _windFilter.type = 'bandpass';
      _windFilter.frequency.value = 2000;
      _windFilter.Q.value = 1.5;

      _windGain = _audioCtx.createGain();
      _windGain.gain.value = 0.8;

      _windSource.connect(_windFilter);
      _windFilter.connect(_windGain);
      _windGain.connect(_audioCtx.destination);
      _windSource.start();
    } catch (e) {
      // AudioContext not available; silently skip
    }
  }

  function _transitionToGentleWhoosh() {
    // Phase 2: fade wind down and reduce filter frequency for gentle whoosh
    if (_windGain && _audioCtx) {
      _windGain.gain.setTargetAtTime(0.3, _audioCtx.currentTime, 0.5);
    }
    if (_windFilter && _audioCtx) {
      _windFilter.frequency.setTargetAtTime(600, _audioCtx.currentTime, 0.5);
    }
  }

  function _stopWindAudio() {
    try {
      if (_windSource) { _windSource.stop(); _windSource = null; }
      if (_audioCtx) { _audioCtx.close(); _audioCtx = null; }
    } catch (e) { /* ignore */ }
    _windGain = null;
    _windFilter = null;
  }

  // ---------------------------------------------------------------------------
  // Three.js parachute mesh
  // ---------------------------------------------------------------------------
  function _buildChuteMesh() {
    if (!window.THREE) { return; }

    _chuteGroup = new window.THREE.Group();

    // Two arc-shaped canopy halves using TorusGeometry
    var canopyMat = new window.THREE.MeshBasicMaterial({ color: 0xffffff, side: window.THREE.DoubleSide, transparent: true, opacity: 0.9 });

    var canopy1 = new window.THREE.Mesh(
      new window.THREE.TorusGeometry(1.5, 0.08, 6, 12, Math.PI),
      canopyMat
    );
    canopy1.rotation.y = 0;
    _chuteGroup.add(canopy1);

    var canopy2 = new window.THREE.Mesh(
      new window.THREE.TorusGeometry(1.5, 0.08, 6, 12, Math.PI),
      canopyMat.clone()
    );
    canopy2.rotation.y = Math.PI / 2;
    _chuteGroup.add(canopy2);

    // 8 shroud lines from canopy base down to player (2.5 units)
    var lineMat = new window.THREE.MeshBasicMaterial({ color: 0xdddddd });
    var lineGeo = new window.THREE.CylinderGeometry(0.01, 0.01, 2.5, 4);
    for (var i = 0; i < 8; i++) {
      var line = new window.THREE.Mesh(lineGeo, lineMat);
      var angle = (i / 8) * Math.PI * 2;
      var radius = 1.2;
      line.position.set(Math.cos(angle) * radius * 0.5, -1.25, Math.sin(angle) * radius * 0.5);
      line.rotation.z = Math.cos(angle) * 0.3;
      line.rotation.x = Math.sin(angle) * 0.3;
      _shroudLines.push(line);
      _chuteGroup.add(line);
    }

    // Position canopy above camera (player)
    _chuteGroup.position.set(0, 3, 0);
    if (_scene) { _scene.add(_chuteGroup); }
  }

  function _updateChutePosition() {
    if (!_chuteGroup || !_camera) { return; }
    _chuteGroup.position.x = _camera.position.x;
    _chuteGroup.position.z = _camera.position.z;
    _chuteGroup.position.y = _camera.position.y + 3;
  }

  function _removeChuteMesh() {
    if (_chuteGroup && _scene) {
      _scene.remove(_chuteGroup);
      _chuteGroup = null;
      _shroudLines = [];
    }
  }

  // ---------------------------------------------------------------------------
  // Keyboard handlers
  // ---------------------------------------------------------------------------
  function _onKeyDown(e) {
    if (!_active) { return; }
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === ' ' || e.code === 'Space') {
      _skip();
      return;
    }
    if (_phase === 2) {
      if (key === 'a') { _steerLeft = true; }
      if (key === 'd') { _steerRight = true; }
    }
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toLowerCase() : '';
    if (key === 'a') { _steerLeft = false; }
    if (key === 'd') { _steerRight = false; }
  }

  function _registerKeys() {
    document.addEventListener('keydown', _onKeyDown, true);
    document.addEventListener('keyup', _onKeyUp, true);
  }

  function _unregisterKeys() {
    document.removeEventListener('keydown', _onKeyDown, true);
    document.removeEventListener('keyup', _onKeyUp, true);
  }

  // ---------------------------------------------------------------------------
  // Skip
  // ---------------------------------------------------------------------------
  function _skip() {
    if (_skipped) { return; }
    _skipped = true;
    _complete();
  }

  // ---------------------------------------------------------------------------
  // Completion
  // ---------------------------------------------------------------------------
  function _complete() {
    _active = false;
    _phase = 0;

    _stopWindAudio();
    _removeChuteMesh();
    _removeOverlay();
    _unregisterKeys();

    // Place camera/player at spawn height
    if (_camera) {
      _camera.position.y = Y_LAND;
    }

    window._controlsLocked = false;
    window._insertionComplete = true;
  }

  // ---------------------------------------------------------------------------
  // Phase transitions
  // ---------------------------------------------------------------------------
  function _enterPhase1() {
    _phase = 1;
    _phaseTimer = 0;
    _joltApplied = false;

    if (_camera) {
      _camera.position.y = Y_START;
    }

    // Overlay: start fully black, fade to semi-transparent over 0.5s
    if (_overlay) {
      _overlay.style.opacity = '1';
      // Allow fade to clear after a short moment so world is visible
      setTimeout(function () {
        if (_overlay) { _overlay.style.transition = 'opacity 0.5s'; _overlay.style.opacity = '0'; }
      }, 300);
    }

    if (_altDisplay) { _altDisplay.style.display = 'block'; }

    _startWindAudio();
  }

  function _enterPhase2() {
    _phase = 2;
    _phaseTimer = 0;

    // Camera jolts upward 2 units (sudden decel illusion)
    if (_camera) {
      _camera.position.y += 2;
    }

    _buildChuteMesh();
    _transitionToGentleWhoosh();
  }

  function _enterPhase3() {
    _phase = 3;
    _phaseTimer = 0;
    _textTimer = 0;
    _shakeTimer = 0.5;
    _shakeIntensity = 0.4;
    _origCamPos = _camera ? _camera.position.clone() : null;

    // Detach chute — let it fall and fade
    if (_chuteGroup) {
      // Tag it for fall; handled in update
      _chuteGroup.userData.falling = true;
      _chuteGroup.userData.fallSpeed = 0;
    }

    // Show "INSERTION COMPLETE" text
    if (_insertText) {
      _insertText.style.display = 'block';
      _insertText.style.opacity = '0';
      _insertText.style.transition = 'opacity 0.4s';
      setTimeout(function () {
        if (_insertText) { _insertText.style.opacity = '1'; }
      }, 50);
    }
  }

  // ---------------------------------------------------------------------------
  // Per-phase update helpers
  // ---------------------------------------------------------------------------
  function _updatePhase1(dt) {
    _phaseTimer += dt;

    // Move camera down at freefall speed
    if (_camera) {
      _camera.position.y -= SPEED_FREEFALL * dt;

      // Clamp to chute deploy threshold
      if (_camera.position.y <= Y_CHUTE_DEPLOY) {
        _camera.position.y = Y_CHUTE_DEPLOY;
      }
    }

    // Altitude readout: map camera Y to meters (Y=80 => 800m, Y=20 => 200m)
    if (_altDisplay && _camera) {
      var altM = Math.max(0, Math.round((_camera.position.y / Y_START) * 800));
      _altDisplay.textContent = 'ALT: ' + altM + 'm';
    }

    // Transition condition: phase timer elapsed OR camera hit deploy altitude
    if (_phaseTimer >= PHASE1_DUR || (_camera && _camera.position.y <= Y_CHUTE_DEPLOY)) {
      _enterPhase2();
    }
  }

  function _updatePhase2(dt) {
    _phaseTimer += dt;

    if (_camera) {
      // Slow descent
      _camera.position.y -= SPEED_CHUTE * dt;

      // A/D steering
      if (_steerLeft)  { _camera.position.x -= _steerSpeed * dt; }
      if (_steerRight) { _camera.position.x += _steerSpeed * dt; }

      if (_camera.position.y <= Y_LAND) {
        _camera.position.y = Y_LAND;
      }
    }

    // Altitude readout update
    if (_altDisplay && _camera) {
      var altM = Math.max(0, Math.round((_camera.position.y / Y_START) * 800));
      _altDisplay.textContent = 'ALT: ' + altM + 'm';
    }

    _updateChutePosition();

    // Transition: phase timer elapsed OR camera hit land altitude
    if (_phaseTimer >= PHASE2_DUR || (_camera && _camera.position.y <= Y_LAND)) {
      if (_camera) { _camera.position.y = Y_LAND; }
      _enterPhase3();
    }
  }

  function _updatePhase3(dt) {
    _phaseTimer += dt;
    _textTimer += dt;

    // Camera shake
    if (_shakeTimer > 0) {
      _shakeTimer -= dt;
      if (_camera && _origCamPos) {
        var sx = (Math.random() - 0.5) * 2 * _shakeIntensity;
        var sy = (Math.random() - 0.5) * 2 * _shakeIntensity;
        _camera.position.x = _origCamPos.x + sx;
        _camera.position.z = _origCamPos.z + sy;
      }
    } else {
      // Restore camera position after shake
      if (_camera && _origCamPos) {
        _camera.position.x = _origCamPos.x;
        _camera.position.z = _origCamPos.z;
      }
    }

    // Falling chute mesh
    if (_chuteGroup && _chuteGroup.userData.falling) {
      _chuteGroup.userData.fallSpeed = (_chuteGroup.userData.fallSpeed || 0) + 4 * dt;
      _chuteGroup.position.y -= _chuteGroup.userData.fallSpeed * dt;
      // Fade out chute
      _chuteGroup.children.forEach(function (child) {
        if (child.material && child.material.transparent) {
          child.material.opacity = Math.max(0, child.material.opacity - dt * 1.5);
        }
      });
    }

    // Text fade: in over first ~0.4s (handled via CSS transition), out after 1s
    if (_insertText && _textTimer >= 1.0) {
      var fadeRatio = Math.min(1, (_textTimer - 1.0) / 0.5);
      _insertText.style.opacity = String(1 - fadeRatio);
    }

    if (_phaseTimer >= PHASE3_DUR) {
      // Hide alt display
      if (_altDisplay) { _altDisplay.style.display = 'none'; }
      // Give text its remaining fade time
      setTimeout(function () {
        _complete();
      }, Math.max(0, (_TEXT_FADE_DUR - _phaseTimer) * 1000 + 500));
      _phase = 0; // prevent re-entry
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  function init(scene, camera) {
    _scene = scene || _scene;
    _camera = camera || _camera;
    _triggered = false;
    _active = false;
    _phase = 0;

    // Hook for level system to call
    window._onLevelStartForParachute = function (waveNumber) {
      if (waveNumber === 1) {
        trigger();
      }
    };
  }

  function trigger() {
    if (_active || _triggered) { return; }
    _triggered = true;
    _active = true;
    _skipped = false;
    _steerLeft = false;
    _steerRight = false;
    _shroudLines = [];

    window._controlsLocked = true;
    window._insertionComplete = false;

    _createOverlay();
    _registerKeys();
    _enterPhase1();
  }

  function update(dt) {
    if (!_active || _phase === 0) { return; }
    if (_phase === 1) { _updatePhase1(dt); }
    else if (_phase === 2) { _updatePhase2(dt); }
    else if (_phase === 3) { _updatePhase3(dt); }
  }

  function reset() {
    _stopWindAudio();
    _removeChuteMesh();
    _removeOverlay();
    _unregisterKeys();

    _active = false;
    _phase = 0;
    _phaseTimer = 0;
    _triggered = false;
    _skipped = false;
    _steerLeft = false;
    _steerRight = false;
    _shroudLines = [];
    _shakeTimer = 0;
    _textTimer = 0;
    _origCamPos = null;

    window._controlsLocked = false;
    window._insertionComplete = false;
    window._onLevelStartForParachute = null;
  }

  return { init: init, trigger: trigger, update: update, reset: reset };
}());
