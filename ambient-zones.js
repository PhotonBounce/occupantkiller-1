/**
 * ambient-zones.js — Spatial ambient audio that changes based on player position/surroundings.
 * Self-initializing, standalone IIFE module.
 * All var, no let/const.
 */

window.AmbientZones = (function () {

  // ── Zone type constants ────────────────────────────────────────────────────
  var OUTDOOR_OPEN    = 'OUTDOOR_OPEN';
  var OUTDOOR_URBAN   = 'OUTDOOR_URBAN';
  var INDOOR_SMALL    = 'INDOOR_SMALL';
  var INDOOR_LARGE    = 'INDOOR_LARGE';
  var COMBAT_ACTIVE   = 'COMBAT_ACTIVE';
  var UNDERGROUND     = 'UNDERGROUND';
  var WATER_NEARBY    = 'WATER_NEARBY';
  var FIRE_NEARBY     = 'FIRE_NEARBY';

  // ── Module state ───────────────────────────────────────────────────────────
  var _ctx           = null;   // AudioContext
  var _masterGain    = null;   // master output gain
  var _activeZone    = null;   // current zone string
  var _baseZone      = null;   // per-level default zone
  var _zoneTimer     = 0;      // accumulates delta for 0.5s detection
  var _tinnitusTimer = 0;      // tracks how long tinnitus has been running
  var _initialized   = false;

  // Per-zone audio state containers:  { gain, nodes:[], timers:[], crossfadeGain }
  var _zones = {};

  // ── Internal helpers ───────────────────────────────────────────────────────
  function _ensureCtx() {
    if (_ctx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      _ctx = new AC();
      _masterGain = _ctx.createGain();
      // The per-zone ambient beds are continuous low-frequency sine drones +
      // looping wind noise that never stop — on a static level they are heard as
      // a constant background "tone". Default them OFF (the reported bug); the
      // global mute/unmute toggle can restore atmospheric ambience if wanted.
      _masterGain.gain.value = (typeof window !== 'undefined' && window.__AMBIENT_ZONES_GAIN != null) ? window.__AMBIENT_ZONES_GAIN : 0;
      _masterGain.connect(_ctx.destination);
      return true;
    } catch (e) {
      console.warn('[AmbientZones] AudioContext creation failed:', e);
      return false;
    }
  }

  // Create white/pink noise buffer (2 seconds, looped)
  function _makeNoiseBuffer(pink) {
    if (!_ctx) return null;
    var sampleRate = _ctx.sampleRate;
    var length = sampleRate * 2;
    var buffer = _ctx.createBuffer(1, length, sampleRate);
    var data = buffer.getChannelData(0);
    if (pink) {
      // Paul Kellet's pink noise approximation
      var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (var i = 0; i < length; i++) {
        var w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      for (var j = 0; j < length; j++) {
        data[j] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  // Create a looping noise source with optional filter
  function _makeNoise(pink, filterType, filterFreq, filterQ) {
    if (!_ctx) return null;
    var buf = _makeNoiseBuffer(pink);
    if (!buf) return null;
    var src = _ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    if (filterType) {
      var filt = _ctx.createBiquadFilter();
      filt.type = filterType;
      filt.frequency.value = filterFreq || 1000;
      if (filterQ !== undefined) filt.Q.value = filterQ;
      src.connect(filt);
      return { source: src, output: filt };
    }
    return { source: src, output: src };
  }

  // Create a constant-frequency oscillator
  function _makeOscillator(type, freq, gain) {
    if (!_ctx) return null;
    var osc = _ctx.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.value = freq || 440;
    var g = _ctx.createGain();
    g.gain.value = gain || 0.01;
    osc.connect(g);
    return { source: osc, output: g };
  }

  // Create a zone container with a crossfade gain node
  function _makeZoneContainer() {
    if (!_ctx) return null;
    var cfGain = _ctx.createGain();
    cfGain.gain.value = 0;
    cfGain.connect(_masterGain);
    return { cfGain: cfGain, nodes: [], timers: [] };
  }

  // Crossfade a zone in (target gain) or out (0) over 1.5s
  function _crossfade(zoneKey, targetGain) {
    if (!_zones[zoneKey] || !_ctx) return;
    var cfGain = _zones[zoneKey].cfGain;
    var t = _ctx.currentTime;
    cfGain.gain.cancelScheduledValues(t);
    cfGain.gain.setValueAtTime(cfGain.gain.value, t);
    cfGain.gain.linearRampToValueAtTime(targetGain, t + 1.5);
  }

  // Stop and tear down all nodes for a zone
  function _teardownZone(zoneKey) {
    if (!_zones[zoneKey]) return;
    var z = _zones[zoneKey];
    for (var i = 0; i < z.nodes.length; i++) {
      try { z.nodes[i].stop(); } catch (e) {}
      try { z.nodes[i].disconnect(); } catch (e) {}
    }
    for (var j = 0; j < z.timers.length; j++) {
      clearTimeout(z.timers[j]);
    }
    z.nodes = [];
    z.timers = [];
  }

  // ── Zone builders ──────────────────────────────────────────────────────────

  function _buildOutdoorOpen(z) {
    if (!_ctx) return;

    // Pink noise wind through LP 200Hz
    var wind = _makeNoise(true, 'lowpass', 200);
    if (wind) {
      var windGain = _ctx.createGain();
      windGain.gain.value = 0.012;
      wind.output.connect(windGain);
      windGain.connect(z.cfGain);
      wind.source.start();
      z.nodes.push(wind.source);
    }

    // Scheduled bird chirps every 8-15s (FM synthesis using two oscillators)
    function scheduleBird() {
      if (!_zones[OUTDOOR_OPEN]) return;
      var delay = 8000 + Math.random() * 7000;
      var t = setTimeout(function () {
        if (!_ctx || _activeZone !== OUTDOOR_OPEN) return;
        var carrier = _ctx.createOscillator();
        var modulator = _ctx.createOscillator();
        var modGain = _ctx.createGain();
        var envGain = _ctx.createGain();
        var baseFreq = 2000 + Math.random() * 1500;
        carrier.type = 'sine';
        carrier.frequency.value = baseFreq;
        modulator.type = 'sine';
        modulator.frequency.value = baseFreq * 2.1;
        modGain.gain.value = 300;
        envGain.gain.value = 0;
        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(envGain);
        envGain.connect(z.cfGain);
        var now = _ctx.currentTime;
        envGain.gain.setValueAtTime(0, now);
        envGain.gain.linearRampToValueAtTime(0.04, now + 0.02);
        envGain.gain.linearRampToValueAtTime(0.02, now + 0.08);
        envGain.gain.linearRampToValueAtTime(0.04, now + 0.14);
        envGain.gain.linearRampToValueAtTime(0, now + 0.25);
        carrier.start(now);
        modulator.start(now);
        carrier.stop(now + 0.35);
        modulator.stop(now + 0.35);
        scheduleBird();
      }, delay);
      if (_zones[OUTDOOR_OPEN]) _zones[OUTDOOR_OPEN].timers.push(t);
    }
    scheduleBird();
  }

  function _buildOutdoorUrban(z) {
    if (!_ctx) return;

    // Distant 40Hz city rumble
    var rumble = _makeOscillator('sine', 40, 0.008);
    if (rumble) {
      rumble.output.connect(z.cfGain);
      rumble.source.start();
      z.nodes.push(rumble.source);
    }

    // Pink-noise city ambience through LP 800Hz
    var ambience = _makeNoise(true, 'lowpass', 800);
    if (ambience) {
      var ambGain = _ctx.createGain();
      ambGain.gain.value = 0.006;
      ambience.output.connect(ambGain);
      ambGain.connect(z.cfGain);
      ambience.source.start();
      z.nodes.push(ambience.source);
    }

    // Occasional distant explosion thump every 12-25s
    function scheduleThump() {
      if (!_zones[OUTDOOR_URBAN]) return;
      var delay = 12000 + Math.random() * 13000;
      var t = setTimeout(function () {
        if (!_ctx || _activeZone !== OUTDOOR_URBAN) return;
        var buf = _makeNoiseBuffer(false);
        if (!buf) { scheduleThump(); return; }
        var src = _ctx.createBufferSource();
        src.buffer = buf;
        var lp = _ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 120;
        var envGain = _ctx.createGain();
        src.connect(lp);
        lp.connect(envGain);
        envGain.connect(z.cfGain);
        var now = _ctx.currentTime;
        envGain.gain.setValueAtTime(0.02, now);
        envGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        src.start(now);
        src.stop(now + 1.3);
        scheduleThump();
      }, delay);
      if (_zones[OUTDOOR_URBAN]) _zones[OUTDOOR_URBAN].timers.push(t);
    }
    scheduleThump();
  }

  function _buildIndoorSmall(z) {
    if (!_ctx) return;

    // HP filtered hiss at 2kHz
    var hiss = _makeNoise(false, 'highpass', 2000);
    if (hiss) {
      var hissGain = _ctx.createGain();
      hissGain.gain.value = 0.005;
      hiss.output.connect(hissGain);
      hissGain.connect(z.cfGain);
      hiss.source.start();
      z.nodes.push(hiss.source);
    }

    // 50Hz HVAC/electrical hum
    var hum = _makeOscillator('sine', 50, 0.004);
    if (hum) {
      hum.output.connect(z.cfGain);
      hum.source.start();
      z.nodes.push(hum.source);
    }
  }

  function _buildIndoorLarge(z) {
    if (!_ctx) return;

    // Same as INDOOR_SMALL
    var hiss = _makeNoise(false, 'highpass', 2000);
    if (hiss) {
      var hissGain = _ctx.createGain();
      hissGain.gain.value = 0.005;
      hiss.output.connect(hissGain);
      hissGain.connect(z.cfGain);
      hiss.source.start();
      z.nodes.push(hiss.source);
    }

    var hum = _makeOscillator('sine', 50, 0.004);
    if (hum) {
      hum.output.connect(z.cfGain);
      hum.source.start();
      z.nodes.push(hum.source);
    }

    // Fake convolution reverb: delay node 0.3s, feedback 0.4
    var buf = _makeNoiseBuffer(true);
    if (buf) {
      var revSrc = _ctx.createBufferSource();
      revSrc.buffer = buf;
      revSrc.loop = true;
      var revGain = _ctx.createGain();
      revGain.gain.value = 0.004;
      var delay = _ctx.createDelay(1.0);
      delay.delayTime.value = 0.3;
      var fbGain = _ctx.createGain();
      fbGain.gain.value = 0.4;
      revSrc.connect(revGain);
      revGain.connect(delay);
      delay.connect(fbGain);
      fbGain.connect(delay);
      delay.connect(z.cfGain);
      revSrc.start();
      z.nodes.push(revSrc);
    }
  }

  function _buildCombatActive(z) {
    if (!_ctx) return;

    // Narrow bandpass noise at 4000Hz — tinnitus ring
    var tinnitus = _makeNoise(false, 'bandpass', 4000, 30);
    if (tinnitus) {
      var tinGain = _ctx.createGain();
      tinGain.gain.value = 0.02;
      tinnitus.output.connect(tinGain);
      tinGain.connect(z.cfGain);
      tinnitus.source.start();
      z.nodes.push(tinnitus.source);
      z._tinnitusGain = tinGain;
    }

    // Debris/dust noise through BP 800Hz
    var dust = _makeNoise(false, 'bandpass', 800, 2);
    if (dust) {
      var dustGain = _ctx.createGain();
      dustGain.gain.value = 0.006;
      dust.output.connect(dustGain);
      dustGain.connect(z.cfGain);
      dust.source.start();
      z.nodes.push(dust.source);
    }
  }

  function _buildUnderground(z) {
    if (!_ctx) return;

    // Deep 30Hz rumble
    var rumble = _makeOscillator('sine', 30, 0.01);
    if (rumble) {
      rumble.output.connect(z.cfGain);
      rumble.source.start();
      z.nodes.push(rumble.source);
    }

    // Low subterranean reverb: delay 0.5s
    var buf = _makeNoiseBuffer(true);
    if (buf) {
      var revSrc = _ctx.createBufferSource();
      revSrc.buffer = buf;
      revSrc.loop = true;
      var revGain = _ctx.createGain();
      revGain.gain.value = 0.003;
      var delay = _ctx.createDelay(1.0);
      delay.delayTime.value = 0.5;
      var fbGain = _ctx.createGain();
      fbGain.gain.value = 0.35;
      revSrc.connect(revGain);
      revGain.connect(delay);
      delay.connect(fbGain);
      fbGain.connect(delay);
      delay.connect(z.cfGain);
      revSrc.start();
      z.nodes.push(revSrc);
    }

    // Occasional drip: 800Hz ping every 3-9s
    function scheduleDrip() {
      if (!_zones[UNDERGROUND]) return;
      var delay = 3000 + Math.random() * 6000;
      var t = setTimeout(function () {
        if (!_ctx || _activeZone !== UNDERGROUND) return;
        var osc = _ctx.createOscillator();
        var envGain = _ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 800 + Math.random() * 200;
        osc.connect(envGain);
        envGain.connect(z.cfGain);
        var now = _ctx.currentTime;
        envGain.gain.setValueAtTime(0.008, now);
        envGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
        scheduleDrip();
      }, delay);
      if (_zones[UNDERGROUND]) _zones[UNDERGROUND].timers.push(t);
    }
    scheduleDrip();
  }

  function _buildWaterNearby(z) {
    if (!_ctx) return;

    // White noise through bandpass ~400Hz for water ripple
    var water = _makeNoise(false, 'bandpass', 400, 0.5);
    if (water) {
      var wGain = _ctx.createGain();
      wGain.gain.value = 0.015;
      water.output.connect(wGain);
      wGain.connect(z.cfGain);
      water.source.start();
      z.nodes.push(water.source);
    }

    // Lower rumble-like flow
    var flow = _makeNoise(true, 'lowpass', 300);
    if (flow) {
      var fGain = _ctx.createGain();
      fGain.gain.value = 0.008;
      flow.output.connect(fGain);
      fGain.connect(z.cfGain);
      flow.source.start();
      z.nodes.push(flow.source);
    }
  }

  function _buildFireNearby(z) {
    if (!_ctx) return;

    // Low roar through LP 300Hz
    var roar = _makeNoise(true, 'lowpass', 300);
    if (roar) {
      var roarGain = _ctx.createGain();
      roarGain.gain.value = 0.018;
      roar.output.connect(roarGain);
      roarGain.connect(z.cfGain);
      roar.source.start();
      z.nodes.push(roar.source);
    }

    // Crackle through BP 1200Hz
    var crackle = _makeNoise(false, 'bandpass', 1200, 1);
    if (crackle) {
      var crackleGain = _ctx.createGain();
      crackleGain.gain.value = 0.010;
      crackle.output.connect(crackleGain);
      crackleGain.connect(z.cfGain);
      crackle.source.start();
      z.nodes.push(crackle.source);
    }

    // Heat/high-freq hiss
    var heat = _makeNoise(false, 'highpass', 3000);
    if (heat) {
      var heatGain = _ctx.createGain();
      heatGain.gain.value = 0.004;
      heat.output.connect(heatGain);
      heatGain.connect(z.cfGain);
      heat.source.start();
      z.nodes.push(heat.source);
    }
  }

  // Map of zone key -> builder function
  var _builders = {};
  _builders[OUTDOOR_OPEN]  = _buildOutdoorOpen;
  _builders[OUTDOOR_URBAN] = _buildOutdoorUrban;
  _builders[INDOOR_SMALL]  = _buildIndoorSmall;
  _builders[INDOOR_LARGE]  = _buildIndoorLarge;
  _builders[COMBAT_ACTIVE] = _buildCombatActive;
  _builders[UNDERGROUND]   = _buildUnderground;
  _builders[WATER_NEARBY]  = _buildWaterNearby;
  _builders[FIRE_NEARBY]   = _buildFireNearby;

  // ── Zone activation / transition ───────────────────────────────────────────

  function _activateZone(zoneKey) {
    if (!_ctx || zoneKey === _activeZone) return;
    var prev = _activeZone;
    _activeZone = zoneKey;

    // Crossfade out the previous zone
    if (prev && _zones[prev]) {
      _crossfade(prev, 0);
      // Teardown after fade completes (1.6s)
      var prevKey = prev;
      setTimeout(function () { _teardownZone(prevKey); }, 1700);
    }

    // Ensure new zone container exists and is built
    if (!_zones[zoneKey]) {
      _zones[zoneKey] = _makeZoneContainer();
      if (_zones[zoneKey] && _builders[zoneKey]) {
        _builders[zoneKey](_zones[zoneKey]);
      }
    }

    // Crossfade new zone in
    _crossfade(zoneKey, 1.0);
    console.log('[AmbientZones] Zone:', zoneKey);
  }

  // ── Zone detection ─────────────────────────────────────────────────────────

  function _detectZone(playerPos) {
    // Check underground: player Y < -1
    if (playerPos && playerPos.y !== undefined && playerPos.y < -1) {
      return UNDERGROUND;
    }

    // Check if fire nearby (global flag)
    if (window._nearFire) {
      return FIRE_NEARBY;
    }

    // Check if solid overhead = indoor
    if (playerPos && window.VoxelWorld && typeof window.VoxelWorld.isSolid === 'function') {
      var overheadX = Math.round(playerPos.x);
      var overheadY = Math.round(playerPos.y + 3);
      var overheadZ = Math.round(playerPos.z);
      if (window.VoxelWorld.isSolid(overheadX, overheadY, overheadZ)) {
        // Determine small vs large by checking room height heuristic
        // Check two more blocks overhead to guess size
        var veryHighX = Math.round(playerPos.x);
        var veryHighY = Math.round(playerPos.y + 7);
        var veryHighZ = Math.round(playerPos.z);
        if (window.VoxelWorld.isSolid(veryHighX, veryHighY, veryHighZ)) {
          return INDOOR_SMALL;
        }
        return INDOOR_LARGE;
      }
    }

    // Default to base zone or outdoor
    if (_baseZone) return _baseZone;
    return OUTDOOR_OPEN;
  }

  // Per-level base zone assignment
  var _LEVEL_ZONES = {
    'MOSCOW':     OUTDOOR_URBAN,
    'KREMLIN':    OUTDOOR_URBAN,
    'BELGOROD':   OUTDOOR_URBAN,
    'FOREST':     OUTDOOR_OPEN,
    'FOREST_1':   OUTDOOR_OPEN,
    'FOREST_2':   OUTDOOR_OPEN,
    'UNDERGROUND': UNDERGROUND,
    'TUNNEL':     UNDERGROUND,
    'TUNNEL_1':   UNDERGROUND,
    'TUNNEL_2':   UNDERGROUND
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  function init() {
    if (_initialized) return;
    _initialized = true;
    window._ambientZoneActive = true;

    // Defer AudioContext creation until a user gesture has fired
    // (to comply with browser autoplay policy)
    var _started = false;
    function _tryStart() {
      if (_started) return;
      if (!_ensureCtx()) return;
      if (_ctx.state === 'suspended') {
        _ctx.resume();
      }
      _started = true;
      // Start with outdoor open as default
      _activateZone(_baseZone || OUTDOOR_OPEN);
    }

    document.addEventListener('click',     _tryStart, { once: true });
    document.addEventListener('keydown',   _tryStart, { once: true });
    document.addEventListener('touchstart', _tryStart, { once: true });

    // If context already available (e.g. from AudioSystem), try immediately
    if (window.AudioContext || window.webkitAudioContext) {
      // Attempt after a short delay for page load
      setTimeout(_tryStart, 800);
    }

    console.log('[AmbientZones] Initialized');
  }

  function update(delta) {
    if (!_initialized || !_ctx) return;

    // Resume context if suspended
    if (_ctx.state === 'suspended') {
      _ctx.resume();
    }

    // Accumulate timer for zone detection (every 0.5s)
    _zoneTimer += delta;
    if (_zoneTimer >= 0.5) {
      _zoneTimer = 0;

      var playerPos = window._playerPos || null;
      var detectedZone = _detectZone(playerPos);

      // Override if water nearby
      if (window._nearWater) detectedZone = WATER_NEARBY;
      // Override if fire nearby
      if (window._nearFire) detectedZone = FIRE_NEARBY;

      // Combat override: tinnitus kicks in when shot was fired recently
      if (window._shotFiredRecently && detectedZone !== FIRE_NEARBY && detectedZone !== UNDERGROUND) {
        detectedZone = COMBAT_ACTIVE;
      }

      if (detectedZone !== _activeZone) {
        _activateZone(detectedZone);
      }
    }

    // Tinnitus management for COMBAT_ACTIVE
    if (_activeZone === COMBAT_ACTIVE) {
      if (window._shotFiredRecently) {
        _tinnitusTimer = 0; // reset countdown
      } else {
        _tinnitusTimer += delta;
        if (_tinnitusTimer >= 8) {
          // 8 seconds elapsed, clear shot flag and return to base zone
          window._shotFiredRecently = false;
          _tinnitusTimer = 0;
          var newZone = _detectZone(window._playerPos || null);
          if (newZone === COMBAT_ACTIVE) newZone = _baseZone || OUTDOOR_OPEN;
          _activateZone(newZone);
        }
      }
    }
  }

  function setLevel(levelId) {
    if (!levelId) return;
    var key = String(levelId).toUpperCase();
    _baseZone = null;

    // Check direct match
    if (_LEVEL_ZONES[key]) {
      _baseZone = _LEVEL_ZONES[key];
    } else {
      // Partial match check
      for (var k in _LEVEL_ZONES) {
        if (key.indexOf(k) !== -1) {
          _baseZone = _LEVEL_ZONES[k];
          break;
        }
      }
    }

    if (!_baseZone) {
      // Default: urban if city name detected, else outdoor open
      if (key.indexOf('URBAN') !== -1 || key.indexOf('CITY') !== -1 ||
          key.indexOf('MOSCOW') !== -1 || key.indexOf('KREMLIN') !== -1) {
        _baseZone = OUTDOOR_URBAN;
      } else {
        _baseZone = OUTDOOR_OPEN;
      }
    }

    // If audio context ready, transition to new base zone
    if (_ctx && _activeZone && _activeZone !== COMBAT_ACTIVE &&
        _activeZone !== FIRE_NEARBY && _activeZone !== WATER_NEARBY) {
      _activateZone(_baseZone);
    }

    console.log('[AmbientZones] setLevel:', levelId, '->', _baseZone);
  }

  function clear() {
    // Stop all zones
    for (var key in _zones) {
      _crossfade(key, 0);
      var zoneKey = key;
      setTimeout(function () { _teardownZone(zoneKey); }, 1700);
    }
    _activeZone = null;
    _tinnitusTimer = 0;
    _zoneTimer = 0;
  }

  // ── Self-activation ────────────────────────────────────────────────────────
  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready
    setTimeout(init, 0);
  }

  // Hook into window._currentLevelId changes via polling
  var _lastLevelId = null;
  setInterval(function () {
    if (!_initialized) return;
    var lvl = window._currentLevelId;
    if (lvl && lvl !== _lastLevelId) {
      _lastLevelId = lvl;
      setLevel(lvl);
    }
  }, 1000);

  // ── Public export ──────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    setLevel: setLevel,
    clear: clear,
    // Global mute hook (the ambient beds are off by default; this lets a settings
    // toggle silence or restore them alongside the main AudioSystem bus).
    setMuted: function (m) { try { if (_masterGain) _masterGain.gain.value = m ? 0 : 0.5; } catch (e) {} }
  };

})();
