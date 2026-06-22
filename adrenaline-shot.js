// adrenaline-shot.js — Adrenaline syringe pickup with speed boost, audio, and HUD effects
// Browser-based Three.js FPS — IIFE, all var (no let/const)
//
// Public API:
//   AdrenalineShot.init(scene, camera, controls)
//   AdrenalineShot.update(dt)
//   AdrenalineShot.activate()
//   AdrenalineShot.reset()
//
// Globals exposed:
//   window._adrenalineActive  — boolean, true while effect is running
//   window._adrenalineTimer   — seconds remaining on current effect
//   window._moveSpeedMult     — 1.8 while active, 0.7 during crash, 1 otherwise
//   window._jumpHeightMult    — 1.5 while active, 1 otherwise

window.AdrenalineShot = (function () {
  'use strict';

  // ------------------------------------------------------------------ config
  var EFFECT_DURATION    = 10;     // seconds
  var CRASH_DURATION     = 2;      // seconds of post-crash slowdown
  var COLLECT_DIST       = 1.0;    // metres to auto-collect
  var COLLECT_DIST_SQ    = COLLECT_DIST * COLLECT_DIST;
  var MAX_CARRY          = 2;      // max syringes carried
  var BOB_SPEED          = 2.0;    // rad/s for syringe bob animation
  var BOB_RANGE          = 0.05;   // metres
  var ROTATE_SPEED       = 1.2;    // rad/s
  var BPM                = 80;     // heartbeat BPM for audio LFO
  var ACTIVE_SPEED_MULT  = 1.8;
  var ACTIVE_JUMP_MULT   = 1.5;
  var CRASH_SPEED_MULT   = 0.7;
  var COOLDOWN_AFTER     = 0;      // no cooldown beyond crash duration

  // Fixed spawn positions: 3 syringes spread across the map
  var SPAWN_POSITIONS = [
    { x:  12, y: 0.5, z:  8  },
    { x: -18, y: 0.5, z: -5  },
    { x:   4, y: 0.5, z: -22 }
  ];

  // ------------------------------------------------------------------ state
  var _scene         = null;
  var _camera        = null;
  var _time          = 0;
  var _syringes      = [];   // world pickup objects
  var _carried       = 0;    // syringes in inventory
  var _effectActive  = false;
  var _effectTimer   = 0;
  var _crashActive   = false;
  var _crashTimer    = 0;
  var _onCooldown    = false;

  // DOM elements
  var _vigEl         = null;
  var _styleEl       = null;
  var _hudBar        = null;
  var _hudFill       = null;
  var _hudLabel      = null;
  var _hudCounter    = null;
  var _toastEl       = null;

  // Audio
  var _audioCtx      = null;
  var _lfoNode       = null;
  var _lfoGain       = null;
  var _noiseSource   = null;
  var _noiseGain     = null;
  var _masterGain    = null;

  // Crosshair original size (cached on first expand)
  var _crosshairEl           = null;
  var _crosshairOrigWidth    = null;
  var _crosshairOrigHeight   = null;

  // Globals
  window._adrenalineActive = false;
  window._adrenalineTimer  = 0;
  window._moveSpeedMult    = 1;
  window._jumpHeightMult   = 1;

  // ================================================================== audio

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { _audioCtx = null; }
    }
    return _audioCtx;
  }

  // Generate pink noise buffer (approx via white noise low-passed)
  function _makePinkNoiseBuffer(ctx, durationSec) {
    var rate     = ctx.sampleRate;
    var length   = Math.floor(rate * durationSec);
    var buffer   = ctx.createBuffer(1, length, rate);
    var data     = buffer.getChannelData(0);
    // Paul Kellet's pink noise approximation
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < length; i++) {
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  function _startHeartbeatAudio() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      _masterGain = ctx.createGain();
      _masterGain.gain.value = 0.55;
      _masterGain.connect(ctx.destination);

      // LFO at 80 BPM (80/60 = 1.333 Hz) driving a kick-like thump
      var lfoHz = BPM / 60;

      // Oscillator as LFO source for gain shaping
      _lfoNode = ctx.createOscillator();
      _lfoNode.type = 'sine';
      _lfoNode.frequency.value = lfoHz;

      _lfoGain = ctx.createGain();
      _lfoGain.gain.value = 0.4;

      // Carrier: low thump oscillator
      var thumper = ctx.createOscillator();
      thumper.type = 'sine';
      thumper.frequency.value = 60;

      var thumperGain = ctx.createGain();
      thumperGain.gain.value = 0;

      // LFO modulates thumper gain (creates pulsing beat)
      _lfoNode.connect(_lfoGain);
      _lfoGain.connect(thumperGain.gain);
      thumper.connect(thumperGain);
      thumperGain.connect(_masterGain);

      // Pink noise rhythm layer, looped
      var pinkBuffer = _makePinkNoiseBuffer(ctx, 4);
      _noiseSource = ctx.createBufferSource();
      _noiseSource.buffer = pinkBuffer;
      _noiseSource.loop = true;

      _noiseGain = ctx.createGain();
      _noiseGain.gain.value = 0;

      // LFO also modulates noise gain (rhythm sync'd)
      var noiseModGain = ctx.createGain();
      noiseModGain.gain.value = 0.12;
      _lfoNode.connect(noiseModGain);
      noiseModGain.connect(_noiseGain.gain);

      _noiseSource.connect(_noiseGain);
      _noiseGain.connect(_masterGain);

      _lfoNode.start();
      thumper.start();
      _noiseSource.start();

      // Store thumper ref for cleanup
      _lfoNode._thumper = thumper;
    } catch (e) {
      _audioCtx = null;
    }
  }

  function _stopHeartbeatAudio() {
    try {
      if (_lfoNode) {
        try { _lfoNode._thumper && _lfoNode._thumper.stop(); } catch (e2) {}
        try { _lfoNode.stop(); } catch (e2) {}
        _lfoNode = null;
      }
      if (_noiseSource) {
        try { _noiseSource.stop(); } catch (e2) {}
        _noiseSource = null;
      }
      if (_masterGain) {
        _masterGain.gain.setValueAtTime(_masterGain.gain.value, _audioCtx.currentTime);
        _masterGain.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 0.3);
        _masterGain = null;
      }
    } catch (e) {}
  }

  function _playPickupSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Sharp ascending blip — medical "ping"
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  function _playCrashSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Descending woozy tone
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {}
  }

  // ================================================================== CSS / DOM

  function _injectStyles() {
    if (_styleEl) return;
    _styleEl = document.createElement('style');
    _styleEl.id = 'adrenalineShotStyles';
    _styleEl.textContent = [
      '@keyframes adrenVignettePulse {',
      '  0%   { opacity: 0.35; }',
      '  50%  { opacity: 0.70; }',
      '  100% { opacity: 0.35; }',
      '}',
      '@keyframes adrenCrashFade {',
      '  0%   { opacity: 0.45; }',
      '  100% { opacity: 0; }',
      '}',
      '@keyframes adrenToast {',
      '  0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }',
      '  15%  { opacity: 1; transform: translateX(-50%) translateY(0); }',
      '  75%  { opacity: 1; transform: translateX(-50%) translateY(0); }',
      '  100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }',
      '}'
    ].join('\n');
    document.head.appendChild(_styleEl);
  }

  function _ensureVignette() {
    if (_vigEl) return;
    _vigEl = document.createElement('div');
    _vigEl.id = 'adrenVignette';
    _vigEl.style.position = 'fixed';
    _vigEl.style.top = '0';
    _vigEl.style.left = '0';
    _vigEl.style.width = '100%';
    _vigEl.style.height = '100%';
    _vigEl.style.pointerEvents = 'none';
    _vigEl.style.zIndex = '460';
    _vigEl.style.opacity = '0';
    _vigEl.style.boxShadow = 'inset 0 0 90px 40px rgba(255,40,0,0.55)';
    document.body.appendChild(_vigEl);
  }

  function _ensureHUD() {
    if (_hudBar) return;

    // Duration bar
    var wrap = document.createElement('div');
    wrap.id = 'adrenHUD';
    wrap.style.position = 'fixed';
    wrap.style.bottom = '80px';
    wrap.style.left = '50%';
    wrap.style.transform = 'translateX(-50%)';
    wrap.style.width = '180px';
    wrap.style.pointerEvents = 'none';
    wrap.style.zIndex = '601';
    wrap.style.display = 'none';

    _hudLabel = document.createElement('div');
    _hudLabel.style.color = '#FF3300';
    _hudLabel.style.fontFamily = 'monospace, sans-serif';
    _hudLabel.style.fontSize = '11px';
    _hudLabel.style.fontWeight = 'bold';
    _hudLabel.style.textAlign = 'center';
    _hudLabel.style.marginBottom = '3px';
    _hudLabel.style.textShadow = '0 0 8px #FF6600';
    _hudLabel.style.letterSpacing = '1px';
    _hudLabel.textContent = 'ADRENALINE';
    wrap.appendChild(_hudLabel);

    var track = document.createElement('div');
    track.style.width = '100%';
    track.style.height = '7px';
    track.style.background = 'rgba(0,0,0,0.55)';
    track.style.border = '1px solid #FF3300';
    track.style.borderRadius = '3px';
    track.style.overflow = 'hidden';
    wrap.appendChild(track);

    _hudFill = document.createElement('div');
    _hudFill.style.height = '100%';
    _hudFill.style.width = '100%';
    _hudFill.style.background = 'linear-gradient(90deg, #FF2200, #FF8800)';
    _hudFill.style.borderRadius = '3px';
    _hudFill.style.transition = 'width 0.1s';
    track.appendChild(_hudFill);

    _hudBar = wrap;
    document.body.appendChild(_hudBar);
  }

  function _ensureCounter() {
    if (_hudCounter) return;

    _hudCounter = document.createElement('div');
    _hudCounter.id = 'adrenCounter';
    _hudCounter.style.position = 'fixed';
    _hudCounter.style.bottom = '110px';
    _hudCounter.style.right = '18px';
    _hudCounter.style.color = '#FF4400';
    _hudCounter.style.fontFamily = 'monospace, sans-serif';
    _hudCounter.style.fontSize = '16px';
    _hudCounter.style.fontWeight = 'bold';
    _hudCounter.style.textShadow = '0 0 8px #FF2200, 1px 1px 2px #000';
    _hudCounter.style.pointerEvents = 'none';
    _hudCounter.style.zIndex = '601';
    _hudCounter.style.display = 'none';
    document.body.appendChild(_hudCounter);
  }

  function _ensureToast() {
    if (_toastEl) return;
    _toastEl = document.createElement('div');
    _toastEl.id = 'adrenToast';
    _toastEl.style.position = 'fixed';
    _toastEl.style.top = '38%';
    _toastEl.style.left = '50%';
    _toastEl.style.transform = 'translateX(-50%)';
    _toastEl.style.color = '#FF2200';
    _toastEl.style.fontFamily = 'monospace, sans-serif';
    _toastEl.style.fontSize = '22px';
    _toastEl.style.fontWeight = 'bold';
    _toastEl.style.letterSpacing = '3px';
    _toastEl.style.textShadow = '0 0 12px #FF6600, 0 0 24px #FF2200, 1px 1px 3px #000';
    _toastEl.style.pointerEvents = 'none';
    _toastEl.style.zIndex = '700';
    _toastEl.style.opacity = '0';
    _toastEl.style.whiteSpace = 'nowrap';
    document.body.appendChild(_toastEl);
  }

  function _showToast(text, durationSec) {
    _ensureToast();
    _toastEl.textContent = text;
    _toastEl.style.animation = 'none';
    // Force reflow
    void _toastEl.offsetWidth;
    _toastEl.style.animation = 'adrenToast ' + (durationSec || 2.2) + 's ease forwards';
  }

  function _updateCounterHUD() {
    _ensureCounter();
    if (_carried > 0) {
      var icons = '';
      for (var i = 0; i < _carried; i++) icons += '💉'; // 💉
      _hudCounter.textContent = icons + '×' + _carried;
      _hudCounter.style.display = 'block';
    } else {
      _hudCounter.style.display = 'none';
    }
  }

  function _setDurationBarVisible(visible) {
    _ensureHUD();
    _hudBar.style.display = visible ? 'block' : 'none';
  }

  function _updateDurationBar() {
    if (!_effectActive) {
      _setDurationBarVisible(false);
      return;
    }
    _setDurationBarVisible(true);
    var pct = Math.max(0, _effectTimer / EFFECT_DURATION);
    _hudFill.style.width = (pct * 100) + '%';
    _hudLabel.textContent = 'ADRENALINE ' + Math.ceil(_effectTimer) + 's';
  }

  // ================================================================== crosshair

  function _expandCrosshair() {
    if (!_crosshairEl) {
      _crosshairEl = document.getElementById('crosshair') ||
                     document.getElementById('crosshairEl') ||
                     document.querySelector('.crosshair') ||
                     document.querySelector('[id*="crosshair"]');
    }
    if (!_crosshairEl) return;
    if (_crosshairOrigWidth === null) {
      _crosshairOrigWidth  = _crosshairEl.style.width  || '';
      _crosshairOrigHeight = _crosshairEl.style.height || '';
    }
    _crosshairEl.style.width  = '28px';
    _crosshairEl.style.height = '28px';
    _crosshairEl.style.transition = 'width 0.08s, height 0.08s';
  }

  function _restoreCrosshair() {
    if (!_crosshairEl) return;
    _crosshairEl.style.width  = _crosshairOrigWidth;
    _crosshairEl.style.height = _crosshairOrigHeight;
  }

  // ================================================================== motion blur

  var _motionBlurEl = null;

  function _ensureMotionBlurEl() {
    if (_motionBlurEl) return;
    _motionBlurEl = document.getElementById('renderCanvas') ||
                    document.querySelector('canvas');
  }

  function _setMotionBlur(active) {
    _ensureMotionBlurEl();
    if (!_motionBlurEl) return;
    if (active) {
      _motionBlurEl.style.filter = 'blur(1px)';
      _motionBlurEl.style.transition = 'filter 0.05s';
    } else {
      _motionBlurEl.style.filter = '';
      _motionBlurEl.style.transition = 'filter 0.2s';
    }
  }

  // Previous camera direction for "rapid movement" blur detection
  var _prevCamDir = null;
  var _blurActive = false;

  function _updateMotionBlur() {
    if (!_effectActive || !_camera) {
      if (_blurActive) { _setMotionBlur(false); _blurActive = false; }
      _prevCamDir = null;
      return;
    }
    if (!_prevCamDir) {
      _prevCamDir = { x: _camera.rotation.y, y: _camera.rotation.x };
      return;
    }
    var dx = Math.abs(_camera.rotation.y - _prevCamDir.x);
    var dy = Math.abs(_camera.rotation.x - _prevCamDir.y);
    // Wrap around PI/-PI
    if (dx > Math.PI) dx = 2 * Math.PI - dx;
    var rapid = (dx + dy) > 0.012; // threshold — fast turn
    if (rapid !== _blurActive) {
      _setMotionBlur(rapid);
      _blurActive = rapid;
    }
    _prevCamDir.x = _camera.rotation.y;
    _prevCamDir.y = _camera.rotation.x;
  }

  // ================================================================== player pos

  function _getPlayerPos() {
    try {
      if (window.GameManager && window.GameManager.playerPosition) return window.GameManager.playerPosition;
      if (window._playerPos) return window._playerPos;
      if (window.player && window.player.position) return window.player.position;
      if (window.Player && window.Player.position) return window.Player.position;
      if (_camera) return _camera.position;
    } catch (e) {}
    return null;
  }

  // ================================================================== syringe mesh

  function _makeSyringeMesh() {
    // Body: CylinderGeometry(0.05, 0.05, 0.3, 8) — bright red barrel
    var bodyGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
    var bodyMat = new THREE.MeshLambertMaterial({
      color: 0xFF1111,
      emissive: 0x550000,
      emissiveIntensity: 0.4
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);

    // Plunger handle: small yellow flat disc on top
    var plungerGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.02, 8);
    var plungerMat = new THREE.MeshLambertMaterial({
      color: 0xFFEE00,
      emissive: 0x554400,
      emissiveIntensity: 0.3
    });
    var plunger = new THREE.Mesh(plungerGeo, plungerMat);
    plunger.position.y = 0.16;

    // Needle: thin long cylinder at bottom
    var needleGeo = new THREE.CylinderGeometry(0.008, 0.002, 0.12, 6);
    var needleMat = new THREE.MeshLambertMaterial({
      color: 0xCCCCCC,
      emissive: 0x222222,
      emissiveIntensity: 0.2
    });
    var needle = new THREE.Mesh(needleGeo, needleMat);
    needle.position.y = -0.21;

    // Yellow band near top of barrel
    var bandGeo = new THREE.CylinderGeometry(0.053, 0.053, 0.04, 8);
    var bandMat = new THREE.MeshLambertMaterial({
      color: 0xFFCC00,
      emissive: 0x443300,
      emissiveIntensity: 0.3
    });
    var band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = 0.08;

    // Group everything
    var group = new THREE.Group();
    group.add(body);
    group.add(plunger);
    group.add(needle);
    group.add(band);

    // Tilt syringe slightly so it looks thrown on the ground
    group.rotation.z = Math.PI / 2.5;

    return group;
  }

  // ================================================================== effect control

  function _applyEffect() {
    _effectActive = true;
    _effectTimer  = EFFECT_DURATION;
    _crashActive  = false;
    _crashTimer   = 0;
    _onCooldown   = true;

    window._adrenalineActive = true;
    window._adrenalineTimer  = EFFECT_DURATION;
    window._moveSpeedMult    = ACTIVE_SPEED_MULT;
    window._jumpHeightMult   = ACTIVE_JUMP_MULT;

    _ensureVignette();
    _vigEl.style.animation = 'adrenVignettePulse 0.75s ease-in-out infinite';
    _vigEl.style.opacity   = '0.35';

    _expandCrosshair();
    _startHeartbeatAudio();
    _showToast('ADRENALINE!', 1.8);
  }

  function _endEffect() {
    _effectActive = false;
    _effectTimer  = 0;

    window._adrenalineActive = false;
    window._adrenalineTimer  = 0;
    window._moveSpeedMult    = CRASH_SPEED_MULT;
    window._jumpHeightMult   = 1;

    _stopHeartbeatAudio();
    _restoreCrosshair();
    _setMotionBlur(false);
    _blurActive = false;

    if (_vigEl) {
      _vigEl.style.animation = 'adrenCrashFade 1s ease forwards';
    }

    _crashActive = true;
    _crashTimer  = CRASH_DURATION;
    _setDurationBarVisible(false);

    _playCrashSound();
    _showToast('ADRENALINE CRASH', 2.5);
  }

  function _endCrash() {
    _crashActive = false;
    _crashTimer  = 0;
    _onCooldown  = false;

    window._moveSpeedMult   = 1;
    window._jumpHeightMult  = 1;

    if (_vigEl) {
      _vigEl.style.animation = 'none';
      _vigEl.style.opacity   = '0';
    }
  }

  // ================================================================== public API

  function init(scene, camera, controls) {
    _scene  = scene;
    _camera = camera;

    _injectStyles();
    _ensureVignette();
    _ensureHUD();
    _ensureCounter();
    _ensureToast();

    // Spawn 3 syringes at fixed positions
    for (var i = 0; i < SPAWN_POSITIONS.length; i++) {
      var sp = SPAWN_POSITIONS[i];
      _spawnSyringe(sp.x, sp.y, sp.z);
    }

    _updateCounterHUD();

    // Alt+A key listener
    document.addEventListener('keydown', _onKeyDown);
  }

  function _spawnSyringe(x, y, z) {
    if (!_scene) return;
    var mesh  = _makeSyringeMesh();
    var baseY = (y !== undefined ? y : 0.5);
    mesh.position.set(x || 0, baseY, z || 0);
    _scene.add(mesh);

    _syringes.push({
      mesh:   mesh,
      baseY:  baseY,
      phase:  Math.random() * Math.PI * 2,
      active: true
    });
  }

  function activate() {
    // Use a stored syringe (Alt+A), or called programmatically
    if (_effectActive) return;   // can't stack
    if (_onCooldown && _crashActive) return;
    if (_carried <= 0) return;

    _carried--;
    _updateCounterHUD();
    _playPickupSound();
    _applyEffect();
  }

  function update(dt) {
    _time += dt;

    var playerPos = _getPlayerPos();

    // -- Animate syringes and check collection --
    var i = _syringes.length - 1;
    while (i >= 0) {
      var s = _syringes[i];

      // Bob + rotate
      s.mesh.position.y = s.baseY + Math.sin(_time * BOB_SPEED + s.phase) * BOB_RANGE;
      s.mesh.rotation.y += ROTATE_SPEED * dt;

      // Proximity collection
      if (playerPos) {
        var dx = s.mesh.position.x - playerPos.x;
        var dz = s.mesh.position.z - playerPos.z;
        var distSq = dx * dx + dz * dz;

        if (distSq < COLLECT_DIST_SQ) {
          // Collect this syringe
          _scene.remove(s.mesh);
          _syringes.splice(i, 1);

          _playPickupSound();

          if (!_effectActive && !_onCooldown) {
            // Auto-activate immediately
            _applyEffect();
          } else if (_carried < MAX_CARRY) {
            // Store it
            _carried++;
            _updateCounterHUD();
            _showToast('💉 SYRINGE STORED', 1.4);
          }
          // else: already at carry cap, syringe is simply collected/wasted

          i--;
          continue;
        }
      }

      i--;
    }

    // -- Effect countdown --
    if (_effectActive) {
      _effectTimer -= dt;
      window._adrenalineTimer = Math.max(0, _effectTimer);

      if (_effectTimer <= 0) {
        _endEffect();
      }
    }

    // -- Crash countdown --
    if (_crashActive) {
      _crashTimer -= dt;
      if (_crashTimer <= 0) {
        _endCrash();
      }
    }

    // -- Vignette pulse: update animation only when active --
    // (CSS animation handles pulsing, just manage visibility here)

    // -- Motion blur on rapid camera movement --
    _updateMotionBlur();

    // -- HUD duration bar --
    _updateDurationBar();
  }

  function reset() {
    // Remove all world syringes
    var i;
    for (i = 0; i < _syringes.length; i++) {
      if (_scene) _scene.remove(_syringes[i].mesh);
    }
    _syringes = [];

    // Cancel audio
    _stopHeartbeatAudio();

    // Reset DOM
    if (_vigEl) {
      _vigEl.style.animation = 'none';
      _vigEl.style.opacity   = '0';
    }
    _setDurationBarVisible(false);
    if (_hudCounter) _hudCounter.style.display = 'none';
    _setMotionBlur(false);
    _blurActive   = false;
    _prevCamDir   = null;
    _restoreCrosshair();

    // Reset state
    _carried      = 0;
    _effectActive = false;
    _effectTimer  = 0;
    _crashActive  = false;
    _crashTimer   = 0;
    _onCooldown   = false;
    _time         = 0;

    // Reset globals
    window._adrenalineActive = false;
    window._adrenalineTimer  = 0;
    window._moveSpeedMult    = 1;
    window._jumpHeightMult   = 1;
  }

  function _onKeyDown(e) {
    // Alt+A activates stored syringe
    if (e.altKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      activate();
    }
  }

  // ================================================================== return

  return {
    init:     init,
    update:   update,
    activate: activate,
    reset:    reset
  };

})();
