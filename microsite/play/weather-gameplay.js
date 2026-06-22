/* weather-gameplay.js — Weather conditions affect movement, visibility, and combat
 * Exposes window.WeatherGameplay = { init, update, getCurrentCondition, applyEffects }
 *
 * Global flags set for other systems to read:
 *   window._weatherVisibilityMult  — enemy sight range multiplier (0.4–1.0)
 *   window._weatherMovementMult    — movement speed multiplier   (0.7–1.0)
 *   window._weatherAccuracyMult    — accuracy multiplier         (0.75–1.0)
 *   window._currentWeather         — current condition string
 */
window.WeatherGameplay = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────

  var CONDITIONS = {
    CLEAR:      'CLEAR',
    LIGHT_RAIN: 'LIGHT_RAIN',
    HEAVY_RAIN: 'HEAVY_RAIN',
    FOG:        'FOG',
    BLIZZARD:   'BLIZZARD',
    DUST_STORM: 'DUST_STORM'
  };

  // Condition definitions: multipliers and fog settings
  var CONDITION_CONFIG = {
    CLEAR: {
      visibilityMult: 1.0,
      movementMult:   1.0,
      accuracyMult:   1.0,
      soundMult:      1.0,
      fogNear:        18,
      fogFar:         105,
      enemyMoveMult:  1.0,
      icon:           '☀', // ☀
      label:          'CLEAR'
    },
    LIGHT_RAIN: {
      visibilityMult: 0.8,
      movementMult:   0.95,
      accuracyMult:   0.95,
      soundMult:      0.7,
      fogNear:        15,
      fogFar:         70,
      enemyMoveMult:  1.0,
      icon:           '🌧', // 🌧
      label:          'RAIN'
    },
    HEAVY_RAIN: {
      visibilityMult: 0.6,
      movementMult:   0.85,
      accuracyMult:   0.85,
      soundMult:      0.7,
      fogNear:        10,
      fogFar:         45,
      enemyMoveMult:  1.0,
      icon:           '🌧', // 🌧
      label:          'HEAVY RAIN'
    },
    FOG: {
      visibilityMult: 0.4,
      movementMult:   1.0,
      accuracyMult:   1.0,
      soundMult:      1.0,
      fogNear:        3,
      fogFar:         15,
      enemyMoveMult:  1.0,
      icon:           '🌫', // 🌫
      label:          'FOG'
    },
    BLIZZARD: {
      visibilityMult: 0.6,
      movementMult:   0.8,
      accuracyMult:   0.75,
      soundMult:      0.8,
      fogNear:        8,
      fogFar:         35,
      enemyMoveMult:  0.7,
      icon:           '🌨', // 🌨
      label:          'BLIZZARD'
    },
    DUST_STORM: {
      visibilityMult: 0.3,
      movementMult:   1.0,
      accuracyMult:   0.85,
      soundMult:      0.9,
      fogNear:        5,
      fogFar:         20,
      enemyMoveMult:  0.5,
      icon:           '💨', // 💨
      label:          'DUST STORM'
    }
  };

  // Bias tables: which conditions are likely per biome
  var BIOME_WEIGHTS = {
    russia:  { CLEAR:5, LIGHT_RAIN:15, HEAVY_RAIN:10, FOG:30, BLIZZARD:30, DUST_STORM:10 },
    desert:  { CLEAR:10, LIGHT_RAIN:5, HEAVY_RAIN:5,  FOG:10, BLIZZARD:0,  DUST_STORM:70 },
    urban:   { CLEAR:20, LIGHT_RAIN:30, HEAVY_RAIN:15, FOG:25, BLIZZARD:5, DUST_STORM:5  },
    default: { CLEAR:35, LIGHT_RAIN:20, HEAVY_RAIN:15, FOG:20, BLIZZARD:5, DUST_STORM:5  }
  };

  // Russia stage IDs: 8=Outer Moscow, 11=Belgorod, 12=Kremlin
  var RUSSIA_STAGE_IDS   = { 8:true, 11:true, 12:true };
  // Desert/southern stage IDs: 9=Sevastopol, 15=Saky Airbase, 6=Crimea Bridge, 7=Chornobyl
  var DESERT_STAGE_IDS   = { 9:true, 15:true };
  // Urban stage IDs
  var URBAN_STAGE_IDS    = { 1:true, 3:true, 5:true, 13:true };

  // ── State ─────────────────────────────────────────────────────────────────

  var _scene              = null;
  var _camera             = null;
  var _currentCondition   = CONDITIONS.CLEAR;
  var _targetCondition    = CONDITIONS.CLEAR;
  var _transitionTimer    = 0;   // seconds into current transition
  var _transitionDuration = 20;  // seconds for full transition
  var _weatherTimer       = 0;   // seconds until next weather change
  var _weatherInterval    = 150; // 2.5 minutes baseline; randomised on change
  var _fogPulseTime       = 0;   // for fog oscillation
  var _blizzardPoints     = null; // THREE.Points for blizzard snow
  var _blizzardGeo        = null;
  var _cameraShakeTimer   = 0;   // blizzard wind jitter
  var _dustOverlay        = null; // orange tint div for dust storm
  var _rainOverlay        = null; // rain streaks container div
  var _hudIndicator       = null; // HUD weather element
  var _inited             = false;

  // Fog values for smooth lerp
  var _fogNearCurrent  = 18;
  var _fogFarCurrent   = 105;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // Return biome key based on current stage
  function _getBiome() {
    var stageId = 0;
    try {
      if (window.GameManager && typeof window.GameManager.getStageInfo === 'function') {
        var info = window.GameManager.getStageInfo();
        if (info && info.id) stageId = info.id;
      }
    } catch (e) {}
    if (RUSSIA_STAGE_IDS[stageId])  return 'russia';
    if (DESERT_STAGE_IDS[stageId])  return 'desert';
    if (URBAN_STAGE_IDS[stageId])   return 'urban';
    return 'default';
  }

  // Weighted random choice from weight table
  function _pickWeightedCondition(weights) {
    var total = 0;
    var key;
    for (key in weights) {
      if (weights.hasOwnProperty(key)) total += weights[key];
    }
    var roll = Math.random() * total;
    var accum = 0;
    for (key in weights) {
      if (weights.hasOwnProperty(key)) {
        accum += weights[key];
        if (roll <= accum) return key;
      }
    }
    return 'CLEAR';
  }

  // Pick a new condition different from current
  function _pickNextCondition() {
    var biome   = _getBiome();
    var weights = BIOME_WEIGHTS[biome] || BIOME_WEIGHTS.default;
    // Clone so we can zero out the current
    var w = {};
    var k;
    for (k in weights) {
      if (weights.hasOwnProperty(k)) w[k] = weights[k];
    }
    w[_currentCondition] = 0; // avoid same condition
    return _pickWeightedCondition(w);
  }

  // ── Rain CSS overlay ──────────────────────────────────────────────────────

  function _createRainOverlay() {
    if (_rainOverlay) return;
    var style = document.createElement('style');
    style.id  = 'wg-rain-keyframes';
    style.textContent =
      '@keyframes rainFall { from { transform: translateY(-100vh) translateX(0) } to { transform: translateY(100vh) translateX(20px) } }';
    document.head.appendChild(style);

    _rainOverlay = document.createElement('div');
    _rainOverlay.id = 'rainOverlay';
    _rainOverlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:5',
      'overflow:hidden',
      'display:none'
    ].join(';');
    document.body.appendChild(_rainOverlay);

    // 30 rain streak divs
    var i;
    for (i = 0; i < 30; i++) {
      var streak = document.createElement('div');
      var dur    = (_rand(0.5, 1.2)).toFixed(2);
      var delay  = (_rand(0, 1.2)).toFixed(2);
      var left   = Math.floor(Math.random() * 100);
      streak.style.cssText = [
        'position:absolute',
        'width:1px',
        'height:15px',
        'background:rgba(255,255,255,0.3)',
        'left:' + left + '%',
        'top:0',
        'animation:rainFall ' + dur + 's linear ' + delay + 's infinite'
      ].join(';');
      _rainOverlay.appendChild(streak);
    }
  }

  function _showRain(heavy) {
    if (!_rainOverlay) _createRainOverlay();
    _rainOverlay.style.display = 'block';
    // Adjust opacity for heavy vs light
    var streaks = _rainOverlay.children;
    var i;
    for (i = 0; i < streaks.length; i++) {
      streaks[i].style.background = heavy
        ? 'rgba(200,220,255,0.45)'
        : 'rgba(255,255,255,0.3)';
    }
  }

  function _hideRain() {
    if (_rainOverlay) _rainOverlay.style.display = 'none';
  }

  // ── Dust storm overlay ────────────────────────────────────────────────────

  function _createDustOverlay() {
    if (_dustOverlay) return;
    _dustOverlay = document.createElement('div');
    _dustOverlay.id = 'dustStormOverlay';
    _dustOverlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:6',
      'background:rgba(180,100,20,0)',
      'transition:background 3s ease'
    ].join(';');
    document.body.appendChild(_dustOverlay);
  }

  function _showDustOverlay() {
    if (!_dustOverlay) _createDustOverlay();
    // Force reflow before changing
    void _dustOverlay.offsetWidth;
    _dustOverlay.style.background = 'rgba(180,100,20,0.3)';
  }

  function _hideDustOverlay() {
    if (_dustOverlay) _dustOverlay.style.background = 'rgba(180,100,20,0)';
  }

  // ── Blizzard 3-D particles ────────────────────────────────────────────────

  function _createBlizzardParticles() {
    if (_blizzardPoints || !_scene || typeof THREE === 'undefined') return;
    _blizzardGeo = new THREE.BufferGeometry();
    var count = 200;
    var positions = new Float32Array(count * 3);
    var spread = 40;
    var i;
    for (i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = Math.random() * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    _blizzardGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color:       0xffffff,
      size:        0.22,
      transparent: true,
      opacity:     0.75,
      depthWrite:  false
    });
    _blizzardPoints = new THREE.Points(_blizzardGeo, mat);
    _blizzardPoints.name = 'blizzard-particles';
    _scene.add(_blizzardPoints);
  }

  function _removeBlizzardParticles() {
    if (_blizzardPoints && _scene) {
      _scene.remove(_blizzardPoints);
      if (_blizzardGeo) _blizzardGeo.dispose();
      _blizzardPoints = null;
      _blizzardGeo    = null;
    }
  }

  function _updateBlizzardParticles(delta) {
    if (!_blizzardPoints || !_camera) return;
    var pos = _blizzardGeo.attributes.position.array;
    var count = pos.length / 3;
    var i;
    for (i = 0; i < count; i++) {
      pos[i * 3]     += (Math.random() - 0.5) * 0.4;  // horizontal drift
      pos[i * 3 + 1] -= 3 * delta;                      // fall
      pos[i * 3 + 2] += (Math.random() - 0.5) * 0.2;
      // Wrap vertically relative to camera
      if (pos[i * 3 + 1] < _camera.position.y - 5) {
        pos[i * 3 + 1] = _camera.position.y + 25;
      }
      // Keep around camera horizontally
      var dx = pos[i * 3]     - _camera.position.x;
      var dz = pos[i * 3 + 2] - _camera.position.z;
      if (Math.abs(dx) > 22) pos[i * 3]     = _camera.position.x + (Math.random() - 0.5) * 40;
      if (Math.abs(dz) > 22) pos[i * 3 + 2] = _camera.position.z + (Math.random() - 0.5) * 40;
    }
    _blizzardGeo.attributes.position.needsUpdate = true;
  }

  // ── Fog helpers ───────────────────────────────────────────────────────────

  function _applyFogToScene(near, far, colorHex) {
    if (!_scene || !_scene.fog) return;
    _scene.fog.near = near;
    _scene.fog.far  = far;
    if (colorHex !== undefined && _scene.fog.color) {
      _scene.fog.color.setHex(colorHex);
    }
  }

  // ── HUD indicator ─────────────────────────────────────────────────────────

  function _updateHUD(condition) {
    var cfg = CONDITION_CONFIG[condition] || CONDITION_CONFIG.CLEAR;
    // Try to find or create the indicator element
    if (!_hudIndicator) {
      _hudIndicator = document.getElementById('wg-weather-hud');
    }
    if (!_hudIndicator) {
      _hudIndicator = document.createElement('div');
      _hudIndicator.id = 'wg-weather-hud';
      _hudIndicator.style.cssText = [
        'position:fixed',
        'top:80px',
        'right:12px',
        'color:#ccc',
        'font-size:12px',
        'font-family:monospace',
        'z-index:200',
        'pointer-events:none',
        'text-shadow:1px 1px 2px rgba(0,0,0,0.8)',
        'background:rgba(0,0,0,0.35)',
        'padding:2px 6px',
        'border-radius:3px',
        'letter-spacing:0.05em'
      ].join(';');
      document.body.appendChild(_hudIndicator);
    }
    _hudIndicator.textContent = cfg.icon + ' ' + cfg.label;
  }

  // ── Global flags ──────────────────────────────────────────────────────────

  function _setGlobalFlags(condition) {
    var cfg = CONDITION_CONFIG[condition] || CONDITION_CONFIG.CLEAR;
    window._weatherVisibilityMult = cfg.visibilityMult;
    window._weatherMovementMult   = cfg.movementMult;
    window._weatherAccuracyMult   = cfg.accuracyMult;
    window._weatherSoundMult      = cfg.soundMult;
    window._weatherEnemyMoveMult  = cfg.enemyMoveMult;
    window._currentWeather        = condition;
  }

  // ── Condition activation / deactivation ──────────────────────────────────

  function _activateCondition(condition) {
    // Deactivate outgoing effects first
    _deactivateAllEffects();

    _currentCondition = condition;
    var cfg = CONDITION_CONFIG[condition] || CONDITION_CONFIG.CLEAR;

    // Set fog
    _fogNearCurrent = cfg.fogNear;
    _fogFarCurrent  = cfg.fogFar;

    switch (condition) {
      case CONDITIONS.LIGHT_RAIN:
        _showRain(false);
        break;
      case CONDITIONS.HEAVY_RAIN:
        _showRain(true);
        break;
      case CONDITIONS.FOG:
        if (_scene && _scene.fog) {
          _scene.fog.near = cfg.fogNear;
          _scene.fog.far  = cfg.fogFar;
        }
        break;
      case CONDITIONS.BLIZZARD:
        _createBlizzardParticles();
        break;
      case CONDITIONS.DUST_STORM:
        _showDustOverlay();
        if (_scene && _scene.fog && _scene.fog.color) {
          _scene.fog.color.setHex(0x8B5A1A);
        }
        break;
      default:
        // CLEAR — restore fog
        if (_scene && _scene.fog && _scene.fog.color) {
          _scene.fog.color.setHex(0x888888);
        }
        break;
    }

    _setGlobalFlags(condition);
    _updateHUD(condition);
  }

  function _deactivateAllEffects() {
    _hideRain();
    _hideDustOverlay();
    _removeBlizzardParticles();
    // Restore fog color
    if (_scene && _scene.fog && _scene.fog.color) {
      _scene.fog.color.setHex(0x888888);
    }
  }

  // ── Transition ────────────────────────────────────────────────────────────

  function _startTransition(next) {
    _targetCondition  = next;
    _transitionTimer  = 0;
  }

  function _updateTransition(delta) {
    if (_currentCondition === _targetCondition) return;
    _transitionTimer += delta;
    var t = _clamp(_transitionTimer / _transitionDuration, 0, 1);

    // Lerp fog values towards target
    var targetCfg  = CONDITION_CONFIG[_targetCondition] || CONDITION_CONFIG.CLEAR;
    var currentCfg = CONDITION_CONFIG[_currentCondition] || CONDITION_CONFIG.CLEAR;

    _fogNearCurrent = _lerp(currentCfg.fogNear, targetCfg.fogNear, t);
    _fogFarCurrent  = _lerp(currentCfg.fogFar,  targetCfg.fogFar,  t);

    // Apply current interpolated fog
    if (_scene && _scene.fog) {
      _scene.fog.near = _fogNearCurrent;
      _scene.fog.far  = _fogFarCurrent;
    }

    // Lerp global flags
    window._weatherVisibilityMult = _lerp(currentCfg.visibilityMult, targetCfg.visibilityMult, t);
    window._weatherMovementMult   = _lerp(currentCfg.movementMult,   targetCfg.movementMult,   t);
    window._weatherAccuracyMult   = _lerp(currentCfg.accuracyMult,   targetCfg.accuracyMult,   t);
    window._weatherSoundMult      = _lerp(currentCfg.soundMult,      targetCfg.soundMult,       t);
    window._weatherEnemyMoveMult  = _lerp(currentCfg.enemyMoveMult,  targetCfg.enemyMoveMult,   t);

    // Fade in particles / overlays at 50% through
    if (t >= 0.5 && _targetCondition === CONDITIONS.BLIZZARD && !_blizzardPoints) {
      _createBlizzardParticles();
    }
    if (t >= 0.5 && (_targetCondition === CONDITIONS.LIGHT_RAIN || _targetCondition === CONDITIONS.HEAVY_RAIN) && _rainOverlay && _rainOverlay.style.display !== 'block') {
      _showRain(_targetCondition === CONDITIONS.HEAVY_RAIN);
    }
    if (t >= 0.5 && _targetCondition === CONDITIONS.DUST_STORM && _dustOverlay && _dustOverlay.style.background === 'rgba(180,100,20,0)') {
      _showDustOverlay();
    }

    if (t >= 1.0) {
      _activateCondition(_targetCondition);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene  = scene  || _scene;
    _camera = camera || _camera;

    // Initialise global flags
    _setGlobalFlags(CONDITIONS.CLEAR);

    // Create overlay elements lazily (DOM must exist)
    _createRainOverlay();
    _createDustOverlay();

    // Schedule first change 2–3 min from now
    _weatherTimer = _rand(120, 180);

    _inited = true;

    _updateHUD(CONDITIONS.CLEAR);
  }

  function update(delta, scene) {
    if (!_inited) return;
    if (scene && !_scene) _scene = scene;

    // Count down weather change timer
    _weatherTimer -= delta;
    if (_weatherTimer <= 0) {
      var next = _pickNextCondition();
      _startTransition(next);
      // Next change in 2–3 minutes
      _weatherTimer = _rand(120, 180);
    }

    // Smooth transition
    _updateTransition(delta);

    // Per-condition per-frame effects
    switch (_currentCondition) {
      case CONDITIONS.FOG:
        // Slowly oscillating fog density
        _fogPulseTime += delta;
        var pulse = Math.sin(_fogPulseTime * 0.4); // slow oscillation
        if (_scene && _scene.fog && _currentCondition === _targetCondition) {
          var cfg = CONDITION_CONFIG.FOG;
          _scene.fog.near = cfg.fogNear + pulse * 1;
          _scene.fog.far  = cfg.fogFar  + pulse * 1;
        }
        break;

      case CONDITIONS.BLIZZARD:
        _updateBlizzardParticles(delta);
        // Camera jitter from wind
        if (_camera && _currentCondition === _targetCondition) {
          _cameraShakeTimer += delta;
          var jitter = (Math.sin(_cameraShakeTimer * 7.3) * 0.0015 + Math.cos(_cameraShakeTimer * 5.1) * 0.001);
          _camera.rotation.z += jitter;
        }
        break;

      default:
        break;
    }
  }

  function getCurrentCondition() {
    return _currentCondition;
  }

  // Apply gameplay effects — called by other systems, returns current multipliers
  function applyEffects() {
    return {
      visibilityMult:  window._weatherVisibilityMult  || 1.0,
      movementMult:    window._weatherMovementMult    || 1.0,
      accuracyMult:    window._weatherAccuracyMult    || 1.0,
      soundMult:       window._weatherSoundMult       || 1.0,
      enemyMoveMult:   window._weatherEnemyMoveMult   || 1.0,
      condition:       _currentCondition
    };
  }

  // Force-set a condition immediately (e.g. from level load)
  function setCondition(condition) {
    if (!CONDITIONS[condition]) return;
    _targetCondition = condition;
    _activateCondition(condition);
    _weatherTimer = _rand(120, 180);
  }

  // ── Init globals to safe defaults before init() is called ─────────────────

  window._weatherVisibilityMult = 1.0;
  window._weatherMovementMult   = 1.0;
  window._weatherAccuracyMult   = 1.0;
  window._weatherSoundMult      = 1.0;
  window._weatherEnemyMoveMult  = 1.0;
  window._currentWeather        = 'CLEAR';

  // ── Module export ─────────────────────────────────────────────────────────

  return {
    init:               init,
    update:             update,
    getCurrentCondition: getCurrentCondition,
    applyEffects:       applyEffects,
    setCondition:       setCondition,
    CONDITIONS:         CONDITIONS
  };

})();
