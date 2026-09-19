/* ───────────────────────────────────────────────────────────────────────────
   WEATHER SYSTEM — Dynamic weather effects for Three.js FPS game
   States: CLEAR, OVERCAST, RAIN, HEAVY_RAIN, SANDSTORM
   Auto-cycles with smooth transitions, particles, fog, lightning, puddles, HUD
   ─────────────────────────────────────────────────────────────────────────── */
window.WeatherSystem = (function () {
  'use strict';

  /* ── Weather state constants ─────────────────────────────────────── */
  var STATES = {
    CLEAR:      'CLEAR',
    OVERCAST:   'OVERCAST',
    RAIN:       'RAIN',
    HEAVY_RAIN: 'HEAVY_RAIN',
    SANDSTORM:  'SANDSTORM',
    SNOW:       'SNOW',
    BLIZZARD:   'BLIZZARD',
    FOG:        'FOG'
  };

  /* ── Per-state fog config ────────────────────────────────────────── */
  var FOG_CONFIG = {
    CLEAR:      { color: 0xc8d0e0, near: 80,  far: 350 },
    OVERCAST:   { color: 0x7a8090, near: 60,  far: 250 },
    RAIN:       { color: 0x6a7080, near: 40,  far: 180 },
    HEAVY_RAIN: { color: 0x4a5060, near: 20,  far: 90  },
    SANDSTORM:  { color: 0xc8a040, near: 2,   far: 15  },
    SNOW:       { color: 0xb8c2d0, near: 30,  far: 140 },
    BLIZZARD:   { color: 0xd8dee8, near: 6,   far: 45  },
    FOG:        { color: 0xa8b0b8, near: 3,   far: 38  }
  };

  /* ── Per-state ambient light intensity ──────────────────────────── */
  /* Multipliers applied ON TOP of the day/night ambient level, not absolutes. */
  var AMBIENT_CONFIG = {
    CLEAR:      1.0,
    OVERCAST:   0.62,
    RAIN:       0.72,
    HEAVY_RAIN: 0.6,
    SANDSTORM:  0.7,
    SNOW:       0.85,
    BLIZZARD:   0.65,
    FOG:        0.75
  };

  /* ── Per-state gameplay modifiers ───────────────────────────────── */
  var MODIFIER_CONFIG = {
    CLEAR:      { speedMult: 1.0,   weaponSway: 1.0,  windX: 0,    windZ: 0,    visionRange: 1.0  },
    OVERCAST:   { speedMult: 1.0,   weaponSway: 1.0,  windX: 0,    windZ: 0,    visionRange: 1.0  },
    RAIN:       { speedMult: 1.0,   weaponSway: 1.0,  windX: 0.5,  windZ: 0.1,  visionRange: 0.85 },
    HEAVY_RAIN: { speedMult: 0.85,  weaponSway: 1.2,  windX: 1.2,  windZ: 0.3,  visionRange: 0.65 },
    SANDSTORM:  { speedMult: 0.75,  weaponSway: 1.8,  windX: 2.0,  windZ: 0.8,  visionRange: 0.40 },
    SNOW:       { speedMult: 0.92,  weaponSway: 1.1,  windX: 0.4,  windZ: 0.2,  visionRange: 0.80 },
    BLIZZARD:   { speedMult: 0.7,   weaponSway: 1.6,  windX: 1.8,  windZ: 1.0,  visionRange: 0.45 },
    FOG:        { speedMult: 1.0,   weaponSway: 1.0,  windX: 0.1,  windZ: 0.05, visionRange: 0.35 }
  };

  /* ── HUD icons ───────────────────────────────────────────────────── */
  var HUD_ICONS = {
    CLEAR:      '☀️',
    OVERCAST:   '⛅',
    RAIN:       '🌧️',
    HEAVY_RAIN: '⛈️',
    SANDSTORM:  '🌪️',
    SNOW:       '🌨️',
    BLIZZARD:   '❄️',
    FOG:        '🌫️'
  };

  /* ── Module state ────────────────────────────────────────────────── */
  var _scene = null;
  var _camera = null;
  var _currentState = STATES.CLEAR;
  var _previousState = STATES.CLEAR;
  var _transitionProgress = 1.0;   // 0=start of transition, 1=fully in new state
  var _stateDuration = 120;
  var _stateTimer = 0;
  var _transitionDuration = 15.0;  // seconds for smooth transition

  /* ── Particle system (LineSegments for rain, Points for sandstorm) ── */
  var _rainLines = null;           // THREE.LineSegments for rain/heavy_rain
  var _sandParticles = null;       // THREE.Points for sandstorm
  var _rainPositions = null;       // Float32Array, paired [start, end] for line segs
  var _sandPositions = null;       // Float32Array
  var _sandVelocities = null;      // Float32Array
  var _snowParticles = null;       // THREE.Points for snow/blizzard
  var _snowPositions = null;       // Float32Array
  var _snowPhase = null;           // Float32Array, per-flake sway phase
  var SNOW_COUNT = 1400;
  var _groundSnow = 0;             // 0..1 accumulation, drives world whitening
  var _groundSnowApplied = -1;
  var RAIN_COUNT = 800;
  var HEAVY_RAIN_COUNT = 2000;
  var SAND_COUNT = 1500;
  var _activeParticleCount = 0;

  /* ── Fog lerp state ──────────────────────────────────────────────── */
  var _fogColor = new THREE.Color(0xc8d0e0);
  var _fogNear = 80;
  var _fogFar = 350;
  var _fogColorTarget = new THREE.Color(0xc8d0e0);
  var _fogNearTarget = 80;
  var _fogFarTarget = 350;

  /* ── Ambient light ───────────────────────────────────────────────── */
  var _ambientLight = null;
  var _ambientIntensity = 1.0;
  var _ambientTarget = 1.0;

  /* ── Lightning ───────────────────────────────────────────────────── */
  var _lightningTimer = 0;
  var _lightningInterval = 12;
  var _lightningFlashTime = 0;
  var _thunderDelay = 0;
  var _thunderPending = false;
  var _thunderTimer = 0;
  var _audioCtx = null;

  /* ── Puddles ─────────────────────────────────────────────────────── */
  var _puddles = [];
  var PUDDLE_COUNT = 5;
  var _puddleGroup = null;

  /* ── Wind ────────────────────────────────────────────────────────── */
  var _windX = 0;
  var _windZ = 0;
  var _windSpeedKmh = 0;

  /* ── Footstep splash timing ──────────────────────────────────────── */
  var _splashTimer = 0;
  var _splashInterval = 0.4;  // seconds between splashes

  /* ── HUD elements ────────────────────────────────────────────────── */
  var _hudEl = null;
  var _hudIcon = null;
  var _hudWind = null;

  /* ─────────────────────────────────────────────────────────────────── */
  /*  INIT                                                               */
  /* ─────────────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene = scene;
    _camera = camera;

    _setupFog();
    _createAmbientLight();
    _createRainSystem();
    _createSandSystem();
    _createSnowSystem();
    _createPuddleGroup();
    _createHUD();
    _setState(STATES.CLEAR, true);
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  UPDATE                                                             */
  /* ─────────────────────────────────────────────────────────────────── */
  function update(delta) {
    if (!_scene || !_camera) return;

    _updateCycle(delta);
    _updateTransition(delta);
    _updateFog(delta);
    _updateAmbient(delta);
    _updateRain(delta);
    _updateSand(delta);
    _updateSnow(delta);
    _updateGroundSnow(delta);
    _updateLightning(delta);
    _updatePuddles(delta);
    _updateFootstepSplash(delta);
    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  STATE CYCLE                                                        */
  /* ─────────────────────────────────────────────────────────────────── */
  var _cycleLast = null;
  function _updateCycle(delta) {
    // Wall time, not the clamped physics delta. A state lasts 60-180 seconds,
    // and delta is capped at 0.1s so a frame spike cannot tunnel the player —
    // which on a machine running at 3fps stretched every weather state to
    // between three and nine real MINUTES. Weather was changing; nobody was
    // playing long enough in one sitting to see it.
    var now = (typeof performance !== 'undefined' && performance.now)
      ? performance.now() / 1000 : Date.now() / 1000;
    var real = (_cycleLast === null) ? (delta || 0) : Math.min(now - _cycleLast, 5);
    _cycleLast = now;
    _stateTimer += real;
    if (_stateTimer >= _stateDuration) {
      _stateTimer = 0;
      _stateDuration = 60 + Math.random() * 120;
      _setState(_pickState(), false);
    }
  }

  /* Weather is drawn from a season-weighted table. A uniform pick over every
     state meant snow in July and a sandstorm every third cycle everywhere. */
  var SEASON_WEIGHTS = {
    Spring: { CLEAR: 34, OVERCAST: 22, RAIN: 24, HEAVY_RAIN: 8,  FOG: 10, SNOW: 2,  BLIZZARD: 0,  SANDSTORM: 0 },
    Summer: { CLEAR: 52, OVERCAST: 16, RAIN: 12, HEAVY_RAIN: 6,  FOG: 6,  SNOW: 0,  BLIZZARD: 0,  SANDSTORM: 8 },
    Autumn: { CLEAR: 26, OVERCAST: 26, RAIN: 22, HEAVY_RAIN: 8,  FOG: 16, SNOW: 2,  BLIZZARD: 0,  SANDSTORM: 0 },
    Winter: { CLEAR: 16, OVERCAST: 22, RAIN: 4,  HEAVY_RAIN: 0,  FOG: 14, SNOW: 30, BLIZZARD: 14, SANDSTORM: 0 }
  };
  function _pickState() {
    var season = 'Summer';
    try { if (window.TimeSystem && TimeSystem.getSeason) season = TimeSystem.getSeason(); } catch (e) {}
    _seasonIsWinter = (season === 'Winter');
    var w = SEASON_WEIGHTS[season] || SEASON_WEIGHTS.Summer;
    var total = 0, k;
    for (k in w) total += w[k];
    var r = Math.random() * total;
    for (k in w) { r -= w[k]; if (r <= 0) return k; }
    return STATES.CLEAR;
  }

  function _setState(state, immediate) {
    if (state === _currentState && !immediate) return;
    _previousState = _currentState;
    _currentState = state;
    _transitionProgress = immediate ? 1.0 : 0.0;

    /* Choose new wind direction per cycle */
    var mod = MODIFIER_CONFIG[state];
    var angle = Math.random() * Math.PI * 2;
    var spd = Math.sqrt(mod.windX * mod.windX + mod.windZ * mod.windZ);
    _windX = Math.cos(angle) * spd;
    _windZ = Math.sin(angle) * spd;
    _windSpeedKmh = Math.round(spd * 3.6 * 10) / 10;

    /* Fog targets */
    var fc = FOG_CONFIG[state];
    _fogColorTarget.setHex(fc.color);
    _fogNearTarget = fc.near;
    _fogFarTarget = fc.far;

    /* Ambient target */
    _ambientTarget = AMBIENT_CONFIG[state];

    /* Lightning timer */
    _lightningTimer = 8 + Math.random() * 12;

    /* Show/hide particle systems */
    _updateParticleVisibility(state);

    /* Puddles */
    if (state === STATES.RAIN || state === STATES.HEAVY_RAIN) {
      _spawnPuddles();
    } else {
      _removePuddles();
    }

    if (immediate) {
      _fogColor.copy(_fogColorTarget);
      _fogNear = _fogNearTarget;
      _fogFar = _fogFarTarget;
      _ambientIntensity = _ambientTarget;
      _applyFog();
      _applyAmbient();
    }
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  TRANSITION LERP                                                    */
  /* ─────────────────────────────────────────────────────────────────── */
  function _updateTransition(delta) {
    if (_transitionProgress >= 1.0) return;
    _transitionProgress = Math.min(1.0, _transitionProgress + delta / _transitionDuration);
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  FOG                                                                */
  /* ─────────────────────────────────────────────────────────────────── */
  function _setupFog() {
    if (!_scene) return;
    _scene.fog = new THREE.Fog(FOG_CONFIG.CLEAR.color, FOG_CONFIG.CLEAR.near, FOG_CONFIG.CLEAR.far);
    _fogColor.setHex(FOG_CONFIG.CLEAR.color);
    _fogNear = FOG_CONFIG.CLEAR.near;
    _fogFar = FOG_CONFIG.CLEAR.far;
  }

  function _updateFog(delta) {
    var t = Math.min(1.0, delta * 0.8);
    _fogColor.lerp(_fogColorTarget, t);
    _fogNear += (_fogNearTarget - _fogNear) * t;
    _fogFar  += (_fogFarTarget  - _fogFar)  * t;
    _applyFog();
  }

  var _fogTmp = new THREE.Color();
  var _fogClear = new THREE.Color(FOG_CONFIG.CLEAR.color);
  function _applyFog() {
    if (!_scene || !_scene.fog) return;
    var base = _timeBase();
    if (base) {
      // Weather is a RELATIVE tint on the day/night fog colour, not a blend
      // toward it. Blending pulled a midnight sky 60% back toward the weather
      // table's daylight grey, so night rendered as bright overcast noon. Using
      // the ratio against CLEAR means CLEAR weather leaves the time-of-day
      // colour untouched and rain/fog/snow darken or cool it from there.
      _fogTmp.setHex(base.fogColor);
      _fogTmp.r *= Math.min(1.6, _fogColor.r / Math.max(0.02, _fogClear.r));
      _fogTmp.g *= Math.min(1.6, _fogColor.g / Math.max(0.02, _fogClear.g));
      _fogTmp.b *= Math.min(1.6, _fogColor.b / Math.max(0.02, _fogClear.b));
      _scene.fog.color.copy(_fogTmp);
      if (_scene.background && _scene.background.isColor) _scene.background.copy(_fogTmp);
    } else {
      _scene.fog.color.copy(_fogColor);
      if (_scene.background && _scene.background.isColor) _scene.background.copy(_fogColor);
    }
    _scene.fog.near = _fogNear;
    _scene.fog.far  = _fogFar;
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  AMBIENT LIGHT                                                      */
  /* ─────────────────────────────────────────────────────────────────── */
  function _createAmbientLight() {
    if (!_scene) return;
    /* Reuse any existing ambient light if present */
    _scene.traverse(function (o) {
      if (!_ambientLight && o.isAmbientLight) _ambientLight = o;
    });
    if (!_ambientLight) {
      _ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      _scene.add(_ambientLight);
    }
    _ambientIntensity = _ambientLight.intensity;
  }

  function _updateAmbient(delta) {
    _ambientIntensity += (_ambientTarget - _ambientIntensity) * Math.min(1.0, delta * 0.5);
    _applyAmbient();
  }

  function _applyAmbient() {
    if (!_ambientLight) return;
    // _ambientIntensity is a per-weather FACTOR, not an absolute. TimeSystem
    // sets the day/night baseline first each frame; assigning here instead of
    // multiplying was overwriting it, so the world stayed equally lit at 03:00
    // and at noon. Clamped so a dark weather state can never black the level out.
    var base = _timeBase();
    var lit = (base ? base.ambient : 0.65) * _ambientIntensity;
    _ambientLight.intensity = Math.max(0.06, Math.min(3.0, lit));
  }

  function _timeBase() {
    try {
      if (window.TimeSystem && TimeSystem.getLightingBase) return TimeSystem.getLightingBase();
    } catch (e) {}
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  RAIN — LineSegments                                                */
  /* ─────────────────────────────────────────────────────────────────── */
  function _createRainSystem() {
    if (!_scene) return;

    /* Allocate for HEAVY_RAIN max (2000 segments = 4000 vertices) */
    var maxCount = HEAVY_RAIN_COUNT;
    var geo = new THREE.BufferGeometry();
    /* Each segment: 2 vertices × 3 floats */
    _rainPositions = new Float32Array(maxCount * 6);
    for (var i = 0; i < maxCount; i++) {
      var ix = i * 6;
      _rainPositions[ix]     = (Math.random() - 0.5) * 60;
      _rainPositions[ix + 1] = Math.random() * 35;
      _rainPositions[ix + 2] = (Math.random() - 0.5) * 60;
      /* End vertex offset (diagonal direction of fall) */
      _rainPositions[ix + 3] = _rainPositions[ix]     + 0.15;
      _rainPositions[ix + 4] = _rainPositions[ix + 1] - 0.6;
      _rainPositions[ix + 5] = _rainPositions[ix + 2] + 0.05;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(_rainPositions, 3));
    /* Draw only the desired count by setting draw range */
    geo.setDrawRange(0, RAIN_COUNT * 2);

    var mat = new THREE.LineBasicMaterial({
      color: 0xeeeeff,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    _rainLines = new THREE.LineSegments(geo, mat);
    _rainLines.frustumCulled = false;
    _rainLines.visible = false;
    _scene.add(_rainLines);
  }

  function _updateParticleVisibility(state) {
    if (_rainLines) {
      _rainLines.visible = (state === STATES.RAIN || state === STATES.HEAVY_RAIN);
      if (state === STATES.RAIN) {
        _rainLines.geometry.setDrawRange(0, RAIN_COUNT * 2);
        _rainLines.material.opacity = 0.45;
        _activeParticleCount = RAIN_COUNT;
      } else if (state === STATES.HEAVY_RAIN) {
        _rainLines.geometry.setDrawRange(0, HEAVY_RAIN_COUNT * 2);
        _rainLines.material.opacity = 0.55;
        _activeParticleCount = HEAVY_RAIN_COUNT;
      }
    }
    if (_sandParticles) {
      _sandParticles.visible = (state === STATES.SANDSTORM);
    }
    if (_snowParticles) {
      _snowParticles.visible = (state === STATES.SNOW || state === STATES.BLIZZARD);
      _snowParticles.material.opacity = (state === STATES.BLIZZARD) ? 0.95 : 0.85;
    }
  }

  function _updateRain(delta) {
    if (!_rainLines || !_rainLines.visible || !_camera) return;

    var state = _currentState;
    var fallSpeed = (state === STATES.HEAVY_RAIN) ? 22 : 14;
    var diagX     = (state === STATES.HEAVY_RAIN) ? 3.5 : 1.8;
    var diagZ     = (state === STATES.HEAVY_RAIN) ? 0.8 : 0.4;
    var spread    = 60;
    var height    = 35;
    var camX = _camera.position.x;
    var camY = _camera.position.y;
    var camZ = _camera.position.z;
    var count = _activeParticleCount;
    var pos = _rainPositions;

    for (var i = 0; i < count; i++) {
      var ix = i * 6;
      /* Move start vertex */
      pos[ix]     += (diagX + _windX * 0.3) * delta;
      pos[ix + 1] -= fallSpeed * delta;
      pos[ix + 2] += (diagZ + _windZ * 0.3) * delta;

      /* Loop when hitting ground */
      if (pos[ix + 1] < camY - 2) {
        pos[ix]     = camX + (Math.random() - 0.5) * spread;
        pos[ix + 1] = camY + height * (0.5 + Math.random() * 0.5);
        pos[ix + 2] = camZ + (Math.random() - 0.5) * spread;
      }
      /* Keep near camera horizontally */
      if (Math.abs(pos[ix] - camX) > spread * 0.6) {
        pos[ix] = camX + (Math.random() - 0.5) * spread;
        pos[ix + 2] = camZ + (Math.random() - 0.5) * spread;
      }
      if (Math.abs(pos[ix + 2] - camZ) > spread * 0.6) {
        pos[ix]     = camX + (Math.random() - 0.5) * spread;
        pos[ix + 2] = camZ + (Math.random() - 0.5) * spread;
      }

      /* Sync end vertex (segment tip) */
      pos[ix + 3] = pos[ix]     + diagX * 0.07;
      pos[ix + 4] = pos[ix + 1] - 0.55;
      pos[ix + 5] = pos[ix + 2] + diagZ * 0.07;
    }
    _rainLines.geometry.attributes.position.needsUpdate = true;
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  SANDSTORM — Points                                                 */
  /* ─────────────────────────────────────────────────────────────────── */
  function _createSandSystem() {
    if (!_scene) return;

    var geo = new THREE.BufferGeometry();
    _sandPositions  = new Float32Array(SAND_COUNT * 3);
    _sandVelocities = new Float32Array(SAND_COUNT * 3);

    for (var i = 0; i < SAND_COUNT; i++) {
      var ix = i * 3;
      var angle = Math.random() * Math.PI * 2;
      var r     = Math.random() * 30;
      _sandPositions[ix]     = Math.cos(angle) * r;
      _sandPositions[ix + 1] = Math.random() * 12;
      _sandPositions[ix + 2] = Math.sin(angle) * r;
      /* Swirling vels: tangential + upward bias + drift */
      _sandVelocities[ix]     = -Math.sin(angle) * (3 + Math.random() * 4) + (Math.random() - 0.5) * 2;
      _sandVelocities[ix + 1] = (Math.random() - 0.3) * 2;
      _sandVelocities[ix + 2] =  Math.cos(angle) * (3 + Math.random() * 4) + (Math.random() - 0.5) * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(_sandPositions, 3));

    /* Brownish-tan color */
    var mat = new THREE.PointsMaterial({
      color: 0xc8a050,
      size: 0.18,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });

    _sandParticles = new THREE.Points(geo, mat);
    _sandParticles.frustumCulled = false;
    _sandParticles.visible = false;
    _scene.add(_sandParticles);
  }

  /* ── SNOW ──────────────────────────────────────────────────────────
     Same Points-based approach as sand, but flakes fall slowly and sway,
     and they respawn in a box that follows the camera so the field never
     runs out no matter how far the player walks. */
  function _createSnowSystem() {
    if (!_scene) return;
    var geo = new THREE.BufferGeometry();
    _snowPositions = new Float32Array(SNOW_COUNT * 3);
    _snowPhase     = new Float32Array(SNOW_COUNT * 2);
    for (var i = 0; i < SNOW_COUNT; i++) {
      var ix = i * 3;
      _snowPositions[ix]     = (Math.random() - 0.5) * 70;
      _snowPositions[ix + 1] = Math.random() * 30;
      _snowPositions[ix + 2] = (Math.random() - 0.5) * 70;
      _snowPhase[i * 2]     = Math.random() * Math.PI * 2;   // sway phase
      _snowPhase[i * 2 + 1] = 0.6 + Math.random() * 0.9;     // fall speed factor
    }
    geo.setAttribute('position', new THREE.BufferAttribute(_snowPositions, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.16, transparent: true, opacity: 0.9, depthWrite: false
    });
    _snowParticles = new THREE.Points(geo, mat);
    _snowParticles.frustumCulled = false;
    _snowParticles.visible = false;
    _scene.add(_snowParticles);
  }

  function _updateSnow(delta) {
    if (!_snowParticles || !_snowParticles.visible || !_camera) return;
    var heavy = (_currentState === STATES.BLIZZARD);
    var fall  = heavy ? 6.5 : 2.4;
    var sway  = heavy ? 2.2 : 1.0;
    var span  = 35;
    var cx = _camera.position.x, cy = _camera.position.y, cz = _camera.position.z;
    var t = (_snowClock += delta);
    var count = heavy ? SNOW_COUNT : (SNOW_COUNT * 0.5) | 0;
    for (var i = 0; i < count; i++) {
      var ix = i * 3;
      _snowPositions[ix + 1] -= fall * _snowPhase[i * 2 + 1] * delta;
      _snowPositions[ix]     += Math.sin(t * 0.9 + _snowPhase[i * 2]) * sway * delta + _windX * delta * 0.35;
      _snowPositions[ix + 2] += Math.cos(t * 0.7 + _snowPhase[i * 2]) * sway * delta + _windZ * delta * 0.35;
      /* Recycle into a box centred on the camera. */
      if (_snowPositions[ix + 1] < cy - 4) {
        _snowPositions[ix]     = cx + (Math.random() - 0.5) * span * 2;
        _snowPositions[ix + 1] = cy + 22 + Math.random() * 8;
        _snowPositions[ix + 2] = cz + (Math.random() - 0.5) * span * 2;
      }
      if (Math.abs(_snowPositions[ix] - cx) > span) _snowPositions[ix] = cx - (_snowPositions[ix] - cx);
      if (Math.abs(_snowPositions[ix + 2] - cz) > span) _snowPositions[ix + 2] = cz - (_snowPositions[ix + 2] - cz);
    }
    _snowParticles.geometry.setDrawRange(0, count);
    _snowParticles.geometry.attributes.position.needsUpdate = true;
  }
  var _snowClock = 0;

  /* Ground snow. Rebuilding world geometry to add a snow layer would be far too
     expensive, so accumulation is expressed as a whitening of the existing
     terrain material colours — one pass over the world materials whenever the
     depth changes by a visible step, not per frame. */
  function _updateGroundSnow(delta) {
    var target = 0;
    if (_currentState === STATES.SNOW) target = 0.55;
    else if (_currentState === STATES.BLIZZARD) target = 1.0;
    else {
      var season = 'Summer';
      try { if (window.TimeSystem && TimeSystem.getSeason) season = TimeSystem.getSeason(); } catch (e) {}
      _seasonIsWinter = (season === 'Winter');
      if (_seasonIsWinter) target = 0.35;
    }
    /* Per SECOND, not per frame: ~20s to lay a full cover, and melting takes
       several minutes. The previous expression multiplied delta by both 60 and
       0.016, which made accumulation frame-rate dependent and about 60x too
       slow — snow fell for a whole mission and the ground never changed. */
    var rate = (target > _groundSnow) ? 0.05 : 0.006;
    var diff = target - _groundSnow;
    if (diff !== 0) {
      var stepAmt = rate * delta;
      _groundSnow += (diff > 0 ? 1 : -1) * Math.min(Math.abs(diff), stepAmt);
    }
    _groundSnow = Math.max(0, Math.min(1, _groundSnow));
    var step = Math.round(_groundSnow * 8) / 8;
    if (step === _groundSnowApplied) return;
    _groundSnowApplied = step;
    if (window.VoxelWorld && VoxelWorld.setSnowCover) {
      try { VoxelWorld.setSnowCover(step); } catch (e) {}
    }
  }
  var _seasonIsWinter = false;

  function _updateSand(delta) {
    if (!_sandParticles || !_sandParticles.visible || !_camera) return;

    var camX = _camera.position.x;
    var camY = _camera.position.y;
    var camZ = _camera.position.z;
    var pos  = _sandPositions;
    var vel  = _sandVelocities;
    var radius = 30;

    for (var i = 0; i < SAND_COUNT; i++) {
      var ix = i * 3;
      pos[ix]     += (vel[ix]     + _windX * 0.5) * delta;
      pos[ix + 1] += vel[ix + 1] * delta;
      pos[ix + 2] += (vel[ix + 2] + _windZ * 0.5) * delta;

      /* Swirl: nudge velocity tangentially to add rotation */
      var dx = pos[ix] - camX;
      var dz = pos[ix + 2] - camZ;
      var dist = Math.sqrt(dx * dx + dz * dz) + 0.001;
      var swirl = 0.4 * delta;
      vel[ix]     += (-dz / dist) * swirl - vel[ix] * 0.02 * delta;
      vel[ix + 2] += ( dx / dist) * swirl - vel[ix + 2] * 0.02 * delta;

      /* Vertical bounce */
      if (pos[ix + 1] < camY - 1 || pos[ix + 1] > camY + 14) {
        pos[ix + 1] = camY + Math.random() * 10;
        vel[ix + 1] = (Math.random() - 0.5) * 2;
      }

      /* Recycle out-of-radius particles */
      if (dist > radius + 5) {
        var ang = Math.random() * Math.PI * 2;
        pos[ix]     = camX + Math.cos(ang) * radius * Math.random();
        pos[ix + 2] = camZ + Math.sin(ang) * radius * Math.random();
        pos[ix + 1] = camY + Math.random() * 10;
      }
    }
    _sandParticles.geometry.attributes.position.needsUpdate = true;
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  LIGHTNING                                                          */
  /* ─────────────────────────────────────────────────────────────────── */
  function _updateLightning(delta) {
    if (_currentState !== STATES.HEAVY_RAIN) {
      /* Restore ambient if a flash was in progress */
      if (_lightningFlashTime > 0) {
        _lightningFlashTime = 0;
        _applyAmbient();
      }
      if (_thunderPending) {
        _thunderPending = false;
        _thunderTimer = 0;
      }
      return;
    }

    /* Count down to next strike */
    _lightningTimer -= delta;
    if (_lightningTimer <= 0) {
      _lightningTimer = 8 + Math.random() * 12;
      _lightningFlashTime = 0.1;

      /* Schedule thunder after 1-3s */
      _thunderPending = true;
      _thunderDelay = 1 + Math.random() * 2;
      _thunderTimer = _thunderDelay;
    }

    /* Flash: spike ambient to 3.0, hold for 0.1s then revert */
    if (_lightningFlashTime > 0) {
      _lightningFlashTime -= delta;
      if (_ambientLight) _ambientLight.intensity = 3.0;
      if (_lightningFlashTime <= 0) {
        _lightningFlashTime = 0;
        _ambientIntensity = _ambientTarget;
        _applyAmbient();
      }
    }

    /* Thunder rumble */
    if (_thunderPending) {
      _thunderTimer -= delta;
      if (_thunderTimer <= 0) {
        _thunderPending = false;
        _playThunder();
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  PUDDLES                                                            */
  /* ─────────────────────────────────────────────────────────────────── */
  function _createPuddleGroup() {
    if (!_scene) return;
    _puddleGroup = new THREE.Group();
    _puddleGroup.name = 'weather-puddles';
    _scene.add(_puddleGroup);
  }

  function _spawnPuddles() {
    if (!_puddleGroup || !_camera) return;
    _removePuddles();

    var geo = new THREE.CylinderGeometry(1.2, 1.2, 0.02, 16);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x334455,
      metalness: 0.9,
      roughness: 0.05,
      transparent: true,
      opacity: 0.75
    });

    for (var i = 0; i < PUDDLE_COUNT; i++) {
      var mesh = new THREE.Mesh(geo, mat);
      var angle = (i / PUDDLE_COUNT) * Math.PI * 2 + Math.random();
      var r = 5 + Math.random() * 12;
      var px = _camera.position.x + Math.cos(angle) * r;
      var pz = _camera.position.z + Math.sin(angle) * r;
      var py = 0.01;
      if (window.VoxelWorld && typeof window.VoxelWorld.getHeight === 'function') {
        try { py = window.VoxelWorld.getHeight(px, pz) + 0.02; } catch (e) {}
      }
      mesh.position.set(px, py, pz);
      _puddleGroup.add(mesh);
      _puddles.push(mesh);
    }
  }

  function _removePuddles() {
    for (var i = 0; i < _puddles.length; i++) {
      _puddleGroup.remove(_puddles[i]);
      if (_puddles[i].geometry) _puddles[i].geometry.dispose();
      if (_puddles[i].material) _puddles[i].material.dispose();
    }
    _puddles = [];
  }

  function _updatePuddles(delta) {
    /* Subtle ripple: scale oscillation */
    var t = Date.now() * 0.001;
    for (var i = 0; i < _puddles.length; i++) {
      var s = 1.0 + Math.sin(t * 1.5 + i * 1.3) * 0.04;
      _puddles[i].scale.set(s, 1, s);
    }
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  FOOTSTEP SPLASH (Web Audio white-noise burst ~2kHz)               */
  /* ─────────────────────────────────────────────────────────────────── */
  function _ensureAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) _audioCtx = new AC();
    } catch (e) {}
    return _audioCtx;
  }

  function _playThunder() {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    try {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / (ctx.sampleRate * 0.8));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'lowpass';
      bpf.frequency.value = 120;
      bpf.Q.value = 0.5;
      var gain = ctx.createGain();
      gain.gain.value = 0.6;
      src.connect(bpf);
      bpf.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _playFootstepSplash() {
    var ctx = _ensureAudioCtx();
    if (!ctx) return;
    try {
      var duration = 0.06;
      var buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 2000;
      bpf.Q.value = 1.5;
      var gain = ctx.createGain();
      gain.gain.value = 0.25;
      src.connect(bpf);
      bpf.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function _updateFootstepSplash(delta) {
    var needsSplash = (_currentState === STATES.RAIN || _currentState === STATES.HEAVY_RAIN);
    if (!needsSplash) return;

    /* Detect player movement via camera position change (approximate) */
    if (!_camera) return;
    _splashTimer += delta;
    if (_splashTimer >= _splashInterval) {
      _splashTimer = 0;
      _playFootstepSplash();
    }
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  HUD                                                                */
  /* ─────────────────────────────────────────────────────────────────── */
  function _createHUD() {
    if (typeof document === 'undefined') return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'weather-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'z-index:9999',
      'background:rgba(0,0,0,0.45)',
      'color:#fff',
      'font-family:sans-serif',
      'font-size:18px',
      'padding:6px 10px',
      'border-radius:6px',
      'pointer-events:none',
      'user-select:none',
      'line-height:1.4'
    ].join(';');

    _hudIcon = document.createElement('span');
    _hudIcon.textContent = HUD_ICONS.CLEAR;

    _hudWind = document.createElement('span');
    _hudWind.style.cssText = 'font-size:12px;margin-left:6px;opacity:0.8;vertical-align:middle';
    _hudWind.textContent = '0 km/h';

    _hudEl.appendChild(_hudIcon);
    _hudEl.appendChild(_hudWind);
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudIcon || !_hudWind) return;
    _hudIcon.textContent = HUD_ICONS[_currentState] || HUD_ICONS.CLEAR;
    _hudWind.textContent = _windSpeedKmh + ' km/h';
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  PUBLIC API                                                         */
  /* ─────────────────────────────────────────────────────────────────── */

  /**
   * Apply bullet wind drift: modifies a THREE.Vector3 velocity in-place.
   * Call per projectile update: WeatherSystem.applyWindDrift(velocity, distanceTravelled)
   */
  function applyWindDrift(velocityVec, distanceMetres) {
    if (!velocityVec) return;
    var drift = 0.002;
    velocityVec.x += _windX * drift * distanceMetres;
    velocityVec.z += _windZ * drift * distanceMetres;
  }

  function forceWeather(state) {
    if (!STATES[state]) {
      var valid = Object.keys(STATES).join(', ');
      console.warn('[WeatherSystem] Unknown state "' + state + '". Valid: ' + valid);
      return;
    }
    _stateTimer = 0;
    _stateDuration = 60 + Math.random() * 120;
    _setState(state, false);
  }

  function getCurrentWeather() {
    return _currentState;
  }

  /**
   * Returns per-state gameplay modifiers so other systems can read them.
   * {
   *   speedMult    : number  — multiply player move speed by this
   *   weaponSway   : number  — weapon sway scale multiplier
   *   windX, windZ : number  — world-space wind m/s
   * }
   */
  function getModifiers() {
    return MODIFIER_CONFIG[_currentState];
  }

  function reset() {
    _setState(STATES.CLEAR, true);
    _stateTimer = 0;
    _stateDuration = 120;
    _transitionProgress = 1.0;
    _lightningTimer = 8 + Math.random() * 12;
    _lightningFlashTime = 0;
    _thunderPending = false;
    _splashTimer = 0;
    _windX = 0;
    _windZ = 0;
    _windSpeedKmh = 0;
    _removePuddles();
    if (_rainLines)     _rainLines.visible = false;
    if (_sandParticles) _sandParticles.visible = false;
  }

  return {
    STATES: STATES,
    init:              init,
    update:            update,
    reset:             reset,
    forceWeather:      forceWeather,
    getCurrentWeather: getCurrentWeather,
    getModifiers:      getModifiers,
    getGroundSnow:     function () { return _groundSnow; },
    applyWindDrift:    applyWindDrift
  };
})();
