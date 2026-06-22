window.PerformanceScaler = (function() {
  'use strict';

  // Quality levels (4=ultra, 3=high, 2=medium, 1=low, 0=potato)
  var _level = 3; // start at high
  var _locked = false; // user can lock level

  var _frameTimes = [];
  var _sampleWindow = 60; // frames to average
  var _lastCheck = 0;
  var _checkInterval = 3.0; // seconds between checks
  var _renderer = null;
  var _scene = null;

  var TARGET_FPS = 45;
  var LOW_FPS_THRESHOLD = 35;
  var HIGH_FPS_THRESHOLD = 58;

  var QUALITY_CONFIGS = [
    // Level 0: Potato
    { pixelRatio: 0.5, shadows: false, fog: true, fogNear: 30, fogFar: 60, particleScale: 0.3, drawDistance: 60 },
    // Level 1: Low
    { pixelRatio: 0.65, shadows: false, fog: true, fogNear: 40, fogFar: 80, particleScale: 0.5, drawDistance: 80 },
    // Level 2: Medium
    { pixelRatio: 0.8, shadows: false, fog: true, fogNear: 50, fogFar: 100, particleScale: 0.75, drawDistance: 100 },
    // Level 3: High (default)
    { pixelRatio: 1.0, shadows: true, fog: true, fogNear: 60, fogFar: 130, particleScale: 1.0, drawDistance: 130 },
    // Level 4: Ultra
    { pixelRatio: Math.min(window.devicePixelRatio || 1, 2), shadows: true, fog: true, fogNear: 80, fogFar: 180, particleScale: 1.0, drawDistance: 180 },
  ];

  function init(renderer, scene) {
    _renderer = renderer;
    _scene = scene;

    // Detect initial device quality
    var mem = (navigator.deviceMemory || 4); // GB
    var cores = (navigator.hardwareConcurrency || 4);
    var dpr = window.devicePixelRatio || 1;

    // Score: low memory or low cores = start lower
    if (mem <= 2 || cores <= 2) {
      _level = 0; // potato
    } else if (mem <= 4 || cores <= 4) {
      _level = 1; // low
    } else if (mem <= 6) {
      _level = 2; // medium
    } else {
      _level = 3; // high
    }

    // Mobile detection: force low
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      _level = Math.min(_level, 1);
    }

    _applyLevel(_level);
    _showQualityToast();
  }

  function _applyLevel(level) {
    var cfg = QUALITY_CONFIGS[level];
    if (!cfg || !_renderer) return;

    _renderer.setPixelRatio(cfg.pixelRatio);
    _renderer.shadowMap.enabled = cfg.shadows;

    // Update fog if scene and fog exist
    if (_scene && _scene.fog) {
      _scene.fog.near = cfg.fogNear;
      _scene.fog.far = cfg.fogFar;
    }

    // Store globally for other systems to read
    window._perfDrawDistance = cfg.drawDistance;
    window._perfParticleScale = cfg.particleScale;
    window._perfLevel = level;

    if (_renderer.domElement) {
      _renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
  }

  function _showQualityToast() {
    var names = ['POTATO', 'LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
    try {
      if (window.HUD && HUD.notifyPickup) {
        HUD.notifyPickup('Quality: ' + names[_level], '#44ddff');
      }
    } catch(e) {}
  }

  function recordFrame(dt) {
    if (!dt || dt > 0.5) return; // skip bad frames (paused etc)

    _frameTimes.push(dt);
    if (_frameTimes.length > _sampleWindow) _frameTimes.shift();

    _lastCheck += dt;
    if (_lastCheck < _checkInterval) return;
    _lastCheck = 0;

    if (_locked) return;

    // Calculate average FPS
    if (_frameTimes.length < 20) return;
    var sum = 0;
    for (var i = 0; i < _frameTimes.length; i++) sum += _frameTimes[i];
    var avgDt = sum / _frameTimes.length;
    var avgFps = 1 / avgDt;

    if (avgFps < LOW_FPS_THRESHOLD && _level > 0) {
      _level--;
      _applyLevel(_level);
      _showQualityToast();
    } else if (avgFps > HIGH_FPS_THRESHOLD && _level < 3) {
      _level++;
      _applyLevel(_level);
      _showQualityToast();
    }
  }

  function setLevel(level) {
    _level = Math.max(0, Math.min(4, level));
    _applyLevel(_level);
    _locked = true; // user manually set it — don't auto-scale
    _showQualityToast();
  }

  function getLevel() { return _level; }
  function unlock() { _locked = false; }

  return {
    init: init,
    recordFrame: recordFrame,
    setLevel: setLevel,
    getLevel: getLevel,
    unlock: unlock,
  };
})();
