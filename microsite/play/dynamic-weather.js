/* ───────────────────────────────────────────────────────────────────────────
   DYNAMIC WEATHER — Rotating weather cycle with 4 states:
   CLEAR, HEAVY_FOG, SANDSTORM, BLIZZARD
   Rotates every 90-150s with 15s linear interpolation transitions.
   Integrates with rain-system.js via window._isRaining.
   ─────────────────────────────────────────────────────────────────────────── */
window.DynamicWeather = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var STATE_CLEAR      = 'CLEAR';
  var STATE_HEAVY_FOG  = 'HEAVY_FOG';
  var STATE_SANDSTORM  = 'SANDSTORM';
  var STATE_BLIZZARD   = 'BLIZZARD';

  var CYCLE_MIN        = 90;   // seconds minimum per state
  var CYCLE_MAX        = 150;  // seconds maximum per state
  var TRANSITION_TIME  = 15;   // seconds to interpolate between states

  var SANDSTORM_COUNT  = 200;
  var BLIZZARD_COUNT   = 400;

  // Fog settings per state
  var FOG_SETTINGS = {
    CLEAR:      { far: 60,  color: 0xCCCCCC },
    HEAVY_FOG:  { far: 10,  color: 0x999999 },
    SANDSTORM:  { far: 12,  color: 0xC8A060 },
    BLIZZARD:   { far: 8,   color: 0xDDEEFF }
  };

  // Ambient light colors per state
  var AMBIENT_COLORS = {
    CLEAR:      0xFFFFEE,
    HEAVY_FOG:  0x888899,
    SANDSTORM:  0xCC9955,
    BLIZZARD:   0x8888BB
  };

  // HUD icons per state
  var HUD_ICONS = {
    CLEAR:      '☀️ CLEAR',
    HEAVY_FOG:  '🌫️ FOG',
    SANDSTORM:  '🌪️ SANDSTORM',
    BLIZZARD:   '❄️ BLIZZARD'
  };

  // Movement penalty multipliers per state
  var MOVE_MULT = {
    CLEAR:      1.0,
    HEAVY_FOG:  0.85,
    SANDSTORM:  1.0,
    BLIZZARD:   0.7
  };

  // Visibility multipliers per state
  var VIS_MULT = {
    CLEAR:      1.0,
    HEAVY_FOG:  0.5,
    SANDSTORM:  0.6,
    BLIZZARD:   0.5
  };

  // ── Internal state ─────────────────────────────────────────────────────────
  var _scene       = null;
  var _camera      = null;
  var _ambientLight = null;

  var _currentState   = STATE_CLEAR;
  var _previousState  = STATE_CLEAR;
  var _nextState      = STATE_CLEAR;
  var _stateTimer     = 0;   // time spent in current state
  var _stateDuration  = 120; // seconds until next change
  var _transitionT    = 1.0; // 0=start transition, 1=fully in currentState
  var _inTransition   = false;

  // Fog originals
  var _origFogFar   = null;
  var _origFogColor = null;

  // Particle groups
  var _sandGroup   = null;
  var _snowGroup   = null;
  var _sandParticles = [];
  var _snowParticles = [];

  // DOM / CSS refs
  var _canvas    = null;
  var _hudBadge  = null;
  var _hudTimer  = null;

  // Audio nodes
  var _audioCtx      = null;
  var _activeAudio   = null; // { osc, noise, gainNode }
  var _activeState   = null; // which state the audio was created for

  var _initialized = false;

  // ── Utilities ──────────────────────────────────────────────────────────────
  function _rand(mn, mx) {
    return mn + Math.random() * (mx - mn);
  }

  function _clamp(v, mn, mx) {
    return v < mn ? mn : v > mx ? mx : v;
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _lerpColor(c1, c2, t) {
    var r1 = (c1 >> 16) & 0xFF, g1 = (c1 >> 8) & 0xFF, b1 = c1 & 0xFF;
    var r2 = (c2 >> 16) & 0xFF, g2 = (c2 >> 8) & 0xFF, b2 = c2 & 0xFF;
    var r = Math.round(_lerp(r1, r2, t));
    var g = Math.round(_lerp(g1, g2, t));
    var b = Math.round(_lerp(b1, b2, t));
    return (r << 16) | (g << 8) | b;
  }

  function _getCanvas() {
    if (!_canvas) { _canvas = document.querySelector('canvas'); }
    return _canvas;
  }

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx ||
          new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { _audioCtx = null; }
    }
    return _audioCtx;
  }

  function _pickNextState() {
    // If raining, jump to HEAVY_FOG
    if (window._isRaining) { return STATE_HEAVY_FOG; }
    var states = [STATE_CLEAR, STATE_HEAVY_FOG, STATE_SANDSTORM, STATE_BLIZZARD];
    // Remove the current state to avoid repetition
    var choices = [];
    for (var i = 0; i < states.length; i++) {
      if (states[i] !== _currentState) { choices.push(states[i]); }
    }
    return choices[Math.floor(Math.random() * choices.length)];
  }

  // ── Particle helpers ───────────────────────────────────────────────────────
  function _createSandParticles() {
    if (_sandGroup) { _destroySandParticles(); }
    _sandGroup = new THREE.Group();
    _sandParticles = [];
    var mat = new THREE.MeshBasicMaterial({ color: 0xC8A060, transparent: true, opacity: 0.7 });
    for (var i = 0; i < SANDSTORM_COUNT; i++) {
      var geo = new THREE.SphereGeometry(0.03, 4, 4);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        _rand(-20, 20),
        _rand(0.5, 4),
        _rand(-20, 20)
      );
      mesh.userData.velX = _rand(3, 8);   // sand flies horizontally
      mesh.userData.velY = _rand(-0.1, 0.1);
      mesh.userData.velZ = _rand(-1, 1);
      _sandGroup.add(mesh);
      _sandParticles.push(mesh);
    }
    _scene.add(_sandGroup);
  }

  function _destroySandParticles() {
    if (!_sandGroup) { return; }
    for (var i = 0; i < _sandParticles.length; i++) {
      _sandParticles[i].geometry.dispose();
    }
    _scene.remove(_sandGroup);
    _sandGroup = null;
    _sandParticles = [];
  }

  function _createSnowParticles() {
    if (_snowGroup) { _destroySnowParticles(); }
    _snowGroup = new THREE.Group();
    _snowParticles = [];
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.85 });
    for (var i = 0; i < BLIZZARD_COUNT; i++) {
      var geo = new THREE.SphereGeometry(0.03, 4, 4);
      var mesh = new THREE.Mesh(geo, mat);
      var angle = _rand(0, Math.PI * 2);
      var radius = _rand(0, 15);
      mesh.position.set(
        Math.cos(angle) * radius,
        _rand(0.5, 8),
        Math.sin(angle) * radius
      );
      mesh.userData.helixAngle  = angle;
      mesh.userData.helixRadius = radius;
      mesh.userData.helixY      = mesh.position.y;
      mesh.userData.helixSpeed  = _rand(0.5, 1.5);
      mesh.userData.fallSpeed   = _rand(0.5, 1.5);
      _snowGroup.add(mesh);
      _snowParticles.push(mesh);
    }
    _scene.add(_snowGroup);
  }

  function _destroySnowParticles() {
    if (!_snowGroup) { return; }
    for (var i = 0; i < _snowParticles.length; i++) {
      _snowParticles[i].geometry.dispose();
    }
    _scene.remove(_snowGroup);
    _snowGroup = null;
    _snowParticles = [];
  }

  // ── Audio ──────────────────────────────────────────────────────────────────
  function _stopAudio() {
    if (!_activeAudio) { return; }
    try {
      if (_activeAudio.gainNode) {
        _activeAudio.gainNode.gain.setTargetAtTime(0, _audioCtx.currentTime, 0.5);
      }
      var audio = _activeAudio;
      setTimeout(function () {
        try { if (audio.osc)   { audio.osc.stop();   } } catch (e) {}
        try { if (audio.noise) { audio.noise.stop();  } } catch (e) {}
      }, 1500);
    } catch (e) {}
    _activeAudio = null;
    _activeState = null;
  }

  function _makeNoiseBuffer(ctx) {
    var bufSize = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  function _startAudioForState(state) {
    var ctx = _getAudioCtx();
    if (!ctx || state === STATE_CLEAR) { return; }
    if (_activeState === state) { return; }
    _stopAudio();

    try {
      var gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2);
      gainNode.connect(ctx.destination);

      var osc = null;
      var noiseSource = null;

      if (state === STATE_HEAVY_FOG) {
        // Low howling wind — sine wave ~120 Hz + noise
        osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 3);
        var oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(gainNode);
        osc.start();

        var noiseBuf = _makeNoiseBuffer(ctx);
        noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf;
        noiseSource.loop = true;
        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);
        noiseSource.connect(filter);
        filter.connect(gainNode);
        noiseSource.start();

      } else if (state === STATE_SANDSTORM) {
        // Sand-rush — bandpass noise ~800 Hz
        var noiseBuf2 = _makeNoiseBuffer(ctx);
        noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf2;
        noiseSource.loop = true;
        var bpFilter = ctx.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.setValueAtTime(800, ctx.currentTime);
        bpFilter.Q.setValueAtTime(0.5, ctx.currentTime);
        noiseSource.connect(bpFilter);
        bpFilter.connect(gainNode);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);
        noiseSource.start();

      } else if (state === STATE_BLIZZARD) {
        // Howling blizzard — sawtooth ~200 Hz + high noise
        osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        var oscGain2 = ctx.createGain();
        oscGain2.gain.setValueAtTime(0.15, ctx.currentTime);
        var oscFilter = ctx.createBiquadFilter();
        oscFilter.type = 'lowpass';
        oscFilter.frequency.setValueAtTime(600, ctx.currentTime);
        osc.connect(oscFilter);
        oscFilter.connect(oscGain2);
        oscGain2.connect(gainNode);
        osc.start();

        var noiseBuf3 = _makeNoiseBuffer(ctx);
        noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf3;
        noiseSource.loop = true;
        var hiFilter = ctx.createBiquadFilter();
        hiFilter.type = 'highpass';
        hiFilter.frequency.setValueAtTime(2000, ctx.currentTime);
        noiseSource.connect(hiFilter);
        hiFilter.connect(gainNode);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 2);
        noiseSource.start();
      }

      _activeAudio = { osc: osc, noise: noiseSource, gainNode: gainNode };
      _activeState = state;
    } catch (e) {
      _activeAudio = null;
      _activeState = null;
    }
  }

  // ── CSS / DOM effects ──────────────────────────────────────────────────────
  function _applyCanvasFilter(state) {
    var cv = _getCanvas();
    if (!cv) { return; }
    if (state === STATE_HEAVY_FOG) {
      cv.style.filter = 'blur(0.5px) brightness(0.7)';
    } else if (state === STATE_SANDSTORM) {
      // handled by body filter
      cv.style.filter = '';
    } else if (state === STATE_BLIZZARD) {
      cv.style.filter = 'brightness(0.85) saturate(0.8)';
    } else {
      cv.style.filter = '';
    }
  }

  function _applyBodyFilter(state) {
    if (state === STATE_SANDSTORM) {
      document.body.style.filter = 'sepia(0.4) contrast(1.1)';
    } else {
      document.body.style.filter = '';
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _createHUD() {
    if (_hudBadge) { return; }
    _hudBadge = document.createElement('div');
    _hudBadge.id = 'dynamic-weather-hud';
    _hudBadge.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.55)',
      'color:#fff',
      'font-family:monospace',
      'font-size:14px',
      'padding:4px 12px',
      'border-radius:6px',
      'z-index:9999',
      'pointer-events:none',
      'text-align:center',
      'line-height:1.4'
    ].join(';');
    document.body.appendChild(_hudBadge);
  }

  function _updateHUD(secondsLeft) {
    if (!_hudBadge) { _createHUD(); }
    var icon = HUD_ICONS[_currentState] || _currentState;
    var secs = Math.max(0, Math.ceil(secondsLeft));
    _hudBadge.innerHTML = icon + '<br><span style="font-size:10px;opacity:0.7">next: ' + secs + 's</span>';
  }

  function _removeHUD() {
    if (_hudBadge && _hudBadge.parentNode) {
      _hudBadge.parentNode.removeChild(_hudBadge);
    }
    _hudBadge = null;
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  function _showToast(msg) {
    if (window.HUD && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast(msg);
    }
  }

  // ── State transitions ──────────────────────────────────────────────────────
  function _activateState(state) {
    _currentState = state;
    window._currentWeather = state;
    window._weatherVisibilityMult = VIS_MULT[state] || 1.0;

    // Spawn / despawn particles
    if (state === STATE_SANDSTORM) {
      _createSandParticles();
      _destroySnowParticles();
    } else if (state === STATE_BLIZZARD) {
      _createSnowParticles();
      _destroySandParticles();
    } else {
      _destroySandParticles();
      _destroySnowParticles();
    }

    // Canvas/body CSS
    _applyCanvasFilter(state);
    _applyBodyFilter(state);

    // Audio
    if (state === STATE_CLEAR) {
      _stopAudio();
    } else {
      _startAudioForState(state);
    }

    // Toast alerts
    if (state === STATE_HEAVY_FOG) {
      _showToast('HEAVY FOG');
    } else if (state === STATE_SANDSTORM) {
      _showToast('SANDSTORM INCOMING');
    } else if (state === STATE_BLIZZARD) {
      _showToast('BLIZZARD ALERT');
    }
  }

  // ── Enemy effect globals ───────────────────────────────────────────────────
  function _applyEnemyEffects(state) {
    // Enemy detection range halved in heavy fog and blizzard
    if (state === STATE_HEAVY_FOG || state === STATE_BLIZZARD) {
      window._enemyDetectMult   = 0.5;
      window._enemyAccuracyMult = 1.0;
    } else if (state === STATE_SANDSTORM) {
      window._enemyDetectMult   = 1.0;
      window._enemyAccuracyMult = 0.7; // enemy accuracy -30%
    } else {
      window._enemyDetectMult   = 1.0;
      window._enemyAccuracyMult = 1.0;
    }
  }

  // ── Player effect globals ──────────────────────────────────────────────────
  function _applyPlayerEffects(state) {
    window._weatherMoveMult    = MOVE_MULT[state]     || 1.0;
    window._weatherVisibilityMult = VIS_MULT[state]   || 1.0;
    // Sandstorm bullet accuracy penalty (-20%)
    window._weatherBulletAccMult = (state === STATE_SANDSTORM) ? 0.8 : 1.0;
  }

  // ── Fog interpolation ──────────────────────────────────────────────────────
  function _updateFog(t) {
    if (!_scene || !_scene.fog) { return; }
    var prevFog  = FOG_SETTINGS[_previousState] || FOG_SETTINGS[STATE_CLEAR];
    var curFog   = FOG_SETTINGS[_currentState]  || FOG_SETTINGS[STATE_CLEAR];
    _scene.fog.far   = _lerp(prevFog.far,   curFog.far,   t);
    var c = _lerpColor(prevFog.color, curFog.color, t);
    _scene.fog.color.setHex(c);
  }

  // ── Ambient light interpolation ────────────────────────────────────────────
  function _updateAmbient(t) {
    if (!_ambientLight) { return; }
    var prevC = AMBIENT_COLORS[_previousState] || AMBIENT_COLORS[STATE_CLEAR];
    var curC  = AMBIENT_COLORS[_currentState]  || AMBIENT_COLORS[STATE_CLEAR];
    _ambientLight.color.setHex(_lerpColor(prevC, curC, t));
  }

  // ── Particle animation ─────────────────────────────────────────────────────
  function _updateSandParticles(dt) {
    if (!_sandGroup || !_camera) { return; }
    var cx = _camera.position.x;
    var cy = _camera.position.y;
    var cz = _camera.position.z;
    for (var i = 0; i < _sandParticles.length; i++) {
      var p = _sandParticles[i];
      p.position.x += p.userData.velX * dt;
      p.position.y += p.userData.velY * dt;
      p.position.z += p.userData.velZ * dt;
      // Wrap around camera
      if (p.position.x - cx > 20) { p.position.x = cx - 20 + Math.random(); }
      if (p.position.x - cx < -20) { p.position.x = cx + 20 - Math.random(); }
      if (p.position.z - cz > 20) { p.position.z = cz - 20 + Math.random(); }
      if (p.position.z - cz < -20) { p.position.z = cz + 20 - Math.random(); }
      if (p.position.y < 0.2) { p.position.y = _rand(0.5, 4); }
      if (p.position.y > 5) { p.position.y = _rand(0.5, 4); }
    }
  }

  function _updateSnowParticles(dt) {
    if (!_snowGroup || !_camera) { return; }
    var cx = _camera.position.x;
    var cz = _camera.position.z;
    for (var i = 0; i < _snowParticles.length; i++) {
      var p = _snowParticles[i];
      p.userData.helixAngle += p.userData.helixSpeed * dt;
      p.userData.helixY     -= p.userData.fallSpeed  * dt;
      if (p.userData.helixY < 0) { p.userData.helixY = _rand(4, 8); }
      var r = p.userData.helixRadius;
      p.position.x = cx + Math.cos(p.userData.helixAngle) * r;
      p.position.z = cz + Math.sin(p.userData.helixAngle) * r;
      p.position.y = p.userData.helixY;
    }
  }

  // ── Ambient light helper ───────────────────────────────────────────────────
  function _findOrCreateAmbient() {
    if (!_scene) { return; }
    _scene.traverse(function (obj) {
      if (!_ambientLight && obj.isAmbientLight) { _ambientLight = obj; }
    });
    // If no ambient exists, create one
    if (!_ambientLight) {
      _ambientLight = new THREE.AmbientLight(AMBIENT_COLORS[STATE_CLEAR], 0.6);
      _scene.add(_ambientLight);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function init(scene, camera) {
    if (_initialized) { return; }
    _scene  = scene  || window._gameScene  || null;
    _camera = camera || window._camera     || null;
    if (!_scene) { return; }

    // Store original fog values
    if (_scene.fog) {
      _origFogFar   = _scene.fog.far;
      _origFogColor = _scene.fog.color ? _scene.fog.color.getHex() : 0xCCCCCC;
      // Treat CLEAR far as the original
      FOG_SETTINGS[STATE_CLEAR].far   = _origFogFar   || 60;
      FOG_SETTINGS[STATE_CLEAR].color = _origFogColor  || 0xCCCCCC;
    }

    _findOrCreateAmbient();
    _createHUD();

    _currentState  = STATE_CLEAR;
    _previousState = STATE_CLEAR;
    _stateTimer    = 0;
    _stateDuration = _rand(CYCLE_MIN, CYCLE_MAX);
    _transitionT   = 1.0;
    _inTransition  = false;

    window._currentWeather        = STATE_CLEAR;
    window._weatherVisibilityMult = 1.0;
    window._weatherMoveMult       = 1.0;
    window._weatherBulletAccMult  = 1.0;
    window._enemyDetectMult       = 1.0;
    window._enemyAccuracyMult     = 1.0;

    _initialized = true;
  }

  function update(dt) {
    if (!_initialized || !_scene) { return; }
    if (!dt || dt <= 0) { return; }

    // Clamp dt so a tab sleep doesn't jump the cycle
    dt = _clamp(dt, 0, 0.1);

    // If rain system is active, force HEAVY_FOG
    if (window._isRaining && _currentState !== STATE_HEAVY_FOG && !_inTransition) {
      _previousState = _currentState;
      _currentState  = STATE_HEAVY_FOG;
      _inTransition  = true;
      _transitionT   = 0;
      _activateState(STATE_HEAVY_FOG);
    }

    _stateTimer += dt;

    if (_inTransition) {
      _transitionT += dt / TRANSITION_TIME;
      if (_transitionT >= 1.0) {
        _transitionT  = 1.0;
        _inTransition = false;
      }
    }

    // Update interpolated fog & ambient
    _updateFog(_transitionT);
    _updateAmbient(_transitionT);

    // Particle updates
    if (_currentState === STATE_SANDSTORM) {
      _updateSandParticles(dt);
    } else if (_currentState === STATE_BLIZZARD) {
      _updateSnowParticles(dt);
    }

    // Check if it's time to switch states
    if (!_inTransition && _stateTimer >= _stateDuration) {
      _stateTimer   = 0;
      _stateDuration = _rand(CYCLE_MIN, CYCLE_MAX);
      _previousState = _currentState;
      _nextState     = _pickNextState();
      _inTransition  = true;
      _transitionT   = 0;
      _activateState(_nextState);
    }

    // Apply player and enemy effect globals every frame
    _applyPlayerEffects(_currentState);
    _applyEnemyEffects(_currentState);

    // Update HUD countdown
    var timeLeft = _stateDuration - _stateTimer;
    _updateHUD(timeLeft);
  }

  function setWeather(state) {
    if (!_initialized) { return; }
    var valid = [STATE_CLEAR, STATE_HEAVY_FOG, STATE_SANDSTORM, STATE_BLIZZARD];
    var found = false;
    for (var i = 0; i < valid.length; i++) {
      if (valid[i] === state) { found = true; break; }
    }
    if (!found) { return; }
    _previousState = _currentState;
    _inTransition  = true;
    _transitionT   = 0;
    _stateTimer    = 0;
    _stateDuration = _rand(CYCLE_MIN, CYCLE_MAX);
    _activateState(state);
  }

  function reset() {
    _stopAudio();
    _destroySandParticles();
    _destroySnowParticles();
    _applyCanvasFilter(STATE_CLEAR);
    _applyBodyFilter(STATE_CLEAR);
    _removeHUD();

    if (_scene && _scene.fog) {
      if (_origFogFar   !== null) { _scene.fog.far = _origFogFar; }
      if (_origFogColor !== null) { _scene.fog.color.setHex(_origFogColor); }
    }

    _currentState  = STATE_CLEAR;
    _previousState = STATE_CLEAR;
    _nextState     = STATE_CLEAR;
    _stateTimer    = 0;
    _transitionT   = 1.0;
    _inTransition  = false;
    _initialized   = false;

    window._currentWeather        = STATE_CLEAR;
    window._weatherVisibilityMult = 1.0;
    window._weatherMoveMult       = 1.0;
    window._weatherBulletAccMult  = 1.0;
    window._enemyDetectMult       = 1.0;
    window._enemyAccuracyMult     = 1.0;
  }

  return { init: init, update: update, setWeather: setWeather, reset: reset };
})();
