// footstep-audio.js — Procedural surface footstep sounds
// Browser-based Three.js FPS — IIFE, all var (no let/const)
//
// Public API:
//   FootstepAudio.init()
//   FootstepAudio.update(dt)
//   FootstepAudio.reset()
//
// Reads globals:
//   window._playerMoving      — boolean, true when player is moving
//   window._playerPos         — {x, y, z} player world position
//   window._playerSprinting   — boolean
//   window._crouching         — boolean
//   window._prone             — boolean
//   window._currentSurface    — string surface type (default 'CONCRETE')
//   window._silencerEquipped  — boolean
//
// Sets globals:
//   window._playerStepNoise   — numeric distance of last step noise (for enemy AI)

window.FootstepAudio = (function () {
  'use strict';

  // ------------------------------------------------------------------ config
  var INTERVAL_WALK    = 0.50;   // seconds between steps (walking)
  var INTERVAL_SPRINT  = 0.32;   // seconds between steps (sprinting)
  var INTERVAL_CROUCH  = 0.65;   // seconds between steps (crouching)

  var VOL_WALK   = 0.4;
  var VOL_SPRINT = 0.7;
  var VOL_CROUCH = 0.2;

  var PITCH_VARY = 0.08;         // ±8% pitch variation
  var PAN_L      = -0.3;
  var PAN_R      =  0.3;
  var ENEMY_ALERT_DIST = 12;     // units — sprinting steps audible this far

  // ------------------------------------------------------------------ state
  var _ctx        = null;        // AudioContext
  var _timer      = 0;           // step timer accumulator
  var _stepLeft   = true;        // L/R alternation
  var _ready      = false;

  // ------------------------------------------------------------------ init
  function init() {
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) { return; }
      _ctx   = new Ctor();
      _timer = 0;
      _stepLeft = true;
      _ready = true;
    } catch (e) {
      _ready = false;
    }
  }

  // ------------------------------------------------------------------ helpers

  function _pitchedRate() {
    var deviation = (Math.random() * 2 - 1) * PITCH_VARY; // -0.08 … +0.08
    return 1 + deviation;
  }

  function _makeNoise(duration, startTime, filterType, filterFreq, gain, pan, extraSetup) {
    // White noise buffer
    var sampleRate  = _ctx.sampleRate;
    var frameCount  = Math.ceil(sampleRate * duration);
    var buffer      = _ctx.createBuffer(1, frameCount, sampleRate);
    var data        = buffer.getChannelData(0);
    for (var i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    var src = _ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = _pitchedRate();

    var filter = _ctx.createBiquadFilter();
    filter.type            = filterType;
    filter.frequency.value = filterFreq;

    var gainNode = _ctx.createGain();
    gainNode.gain.value = gain;

    var panner = _ctx.createStereoPanner();
    panner.pan.value = pan;

    src.connect(filter);
    filter.connect(gainNode);

    if (extraSetup) {
      extraSetup(gainNode, panner);
    } else {
      gainNode.connect(panner);
      panner.connect(_ctx.destination);
    }

    src.start(startTime);
    src.stop(startTime + duration + 0.05);
    return src;
  }

  function _makeTone(freq, duration, startTime, gainVal, pan, extraChain) {
    var osc = _ctx.createOscillator();
    osc.type      = 'sine';
    osc.frequency.value = freq * _pitchedRate();

    var gainNode = _ctx.createGain();
    gainNode.gain.setValueAtTime(gainVal, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    var panner = _ctx.createStereoPanner();
    panner.pan.value = pan;

    osc.connect(gainNode);

    if (extraChain) {
      extraChain(gainNode, panner);
    } else {
      gainNode.connect(panner);
      panner.connect(_ctx.destination);
    }

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
    return osc;
  }

  // ------------------------------------------------------------------ surface synthesis

  function _playConcrete(vol, pan) {
    // White noise burst 0.04s, high-pass 400 Hz, low volume
    var t = _ctx.currentTime;
    _makeNoise(0.04, t, 'highpass', 400, vol * 0.5, pan, null);
  }

  function _playGrass(vol, pan) {
    // Noise burst 0.07s, low-pass 600 Hz, softer
    var t = _ctx.currentTime;
    _makeNoise(0.07, t, 'lowpass', 600, vol * 0.4, pan, null);
  }

  function _playMetal(vol, pan) {
    // Sine 180 Hz + harmonic 360 Hz, 0.06s, delay node 0.12s feedback 0.3
    var t = _ctx.currentTime;

    var delay    = _ctx.createDelay(0.5);
    delay.delayTime.value = 0.12;
    var fbGain   = _ctx.createGain();
    fbGain.gain.value = 0.3;
    var panner   = _ctx.createStereoPanner();
    panner.pan.value = pan;

    delay.connect(fbGain);
    fbGain.connect(delay);
    delay.connect(panner);
    panner.connect(_ctx.destination);

    var setupChain = function (gainNode, _p) {
      gainNode.connect(delay);
      gainNode.connect(panner); // dry signal too
    };

    _makeTone(180, 0.06, t, vol * 0.6, pan, setupChain);
    _makeTone(360, 0.06, t, vol * 0.3, pan, setupChain);
  }

  function _playWood(vol, pan) {
    // Click wave 90 Hz 0.05s + noise 0.02s layered
    var t = _ctx.currentTime;
    _makeTone(90, 0.05, t, vol * 0.5, pan, null);
    _makeNoise(0.02, t, 'highpass', 200, vol * 0.3, pan, null);
  }

  function _playGravel(vol, pan) {
    // Two rapid noise bursts 0.02s apart, crackle texture
    var t = _ctx.currentTime;
    _makeNoise(0.025, t,        'bandpass', 1200, vol * 0.5, pan, null);
    _makeNoise(0.025, t + 0.02, 'bandpass', 900,  vol * 0.4, pan, null);
  }

  function _playWater(vol, pan) {
    // Splashing noise 0.1s, low-pass 300 Hz, volume 0.6
    var t = _ctx.currentTime;
    _makeNoise(0.10, t, 'lowpass', 300, vol * 0.6, pan, null);
  }

  function _playTile(vol, pan) {
    // Bright transient 600 Hz sine 0.03s
    var t = _ctx.currentTime;
    _makeTone(600, 0.03, t, vol * 0.5, pan, null);
  }

  var _surfaceHandlers = {
    CONCRETE : _playConcrete,
    GRASS    : _playGrass,
    METAL    : _playMetal,
    WOOD     : _playWood,
    GRAVEL   : _playGravel,
    WATER    : _playWater,
    TILE     : _playTile
  };

  // ------------------------------------------------------------------ step logic

  function _playStep() {
    if (!_ready || !_ctx) { return; }

    // Resume suspended context (browser autoplay policy)
    if (_ctx.state === 'suspended') {
      _ctx.resume();
    }

    var sprinting  = !!window._playerSprinting;
    var crouching  = !!window._crouching;

    // Base volume
    var vol = VOL_WALK;
    if (sprinting)  { vol = VOL_SPRINT; }
    if (crouching)  { vol = VOL_CROUCH; }

    // Silencer integration: crouching + silencer → -50%
    if (window._silencerEquipped && crouching) {
      vol = vol * 0.5;
    }

    // Stereo pan
    var pan = _stepLeft ? PAN_L : PAN_R;
    _stepLeft = !_stepLeft;

    // Surface
    var surface = (window._currentSurface || 'CONCRETE').toUpperCase();
    var handler = _surfaceHandlers[surface] || _playConcrete;
    handler(vol, pan);

    // Enemy noise alert: sprinting sets _playerStepNoise to distance threshold
    if (sprinting) {
      window._playerStepNoise = ENEMY_ALERT_DIST;
    } else {
      window._playerStepNoise = 0;
    }
  }

  function _stepInterval() {
    if (!!window._playerSprinting) { return INTERVAL_SPRINT; }
    if (!!window._crouching)       { return INTERVAL_CROUCH; }
    return INTERVAL_WALK;
  }

  // ------------------------------------------------------------------ update
  function update(dt) {
    if (!_ready) { return; }

    // Prone or not moving → no steps
    if (!!window._prone || !window._playerMoving) {
      _timer = 0;
      return;
    }

    _timer += dt;
    var interval = _stepInterval();
    if (_timer >= interval) {
      _timer -= interval;
      _playStep();
    }
  }

  // ------------------------------------------------------------------ reset
  function reset() {
    _timer    = 0;
    _stepLeft = true;
    window._playerStepNoise = 0;
  }

  // ------------------------------------------------------------------ public API
  return {
    init   : init,
    update : update,
    reset  : reset
  };

})();
