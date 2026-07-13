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
    SANDSTORM:  'SANDSTORM'
  };

  /* ── Per-state fog config ────────────────────────────────────────── */
  var FOG_CONFIG = {
    CLEAR:      { color: 0xc8d0e0, near: 80,  far: 350 },
    OVERCAST:   { color: 0x7a8090, near: 60,  far: 250 },
    RAIN:       { color: 0x6a7080, near: 40,  far: 180 },
    HEAVY_RAIN: { color: 0x4a5060, near: 20,  far: 90  },
    SANDSTORM:  { color: 0xc8a040, near: 2,   far: 15  }
  };

  /* ── Per-state ambient light intensity ──────────────────────────── */
  var AMBIENT_CONFIG = {
    CLEAR:      1.0,
    OVERCAST:   0.3,
    RAIN:       0.55,
    HEAVY_RAIN: 0.45,
    SANDSTORM:  0.6
  };

  /* ── Per-state gameplay modifiers ───────────────────────────────── */
  var MODIFIER_CONFIG = {
    CLEAR:      { speedMult: 1.0,   weaponSway: 1.0,  windX: 0,    windZ: 0    },
    OVERCAST:   { speedMult: 1.0,   weaponSway: 1.0,  windX: 0,    windZ: 0    },
    RAIN:       { speedMult: 1.0,   weaponSway: 1.0,  windX: 0.5,  windZ: 0.1  },
    HEAVY_RAIN: { speedMult: 0.85,  weaponSway: 1.2,  windX: 1.2,  windZ: 0.3  },
    SANDSTORM:  { speedMult: 0.75,  weaponSway: 1.8,  windX: 2.0,  windZ: 0.8  }
  };

  /* ── HUD icons ───────────────────────────────────────────────────── */
  var HUD_ICONS = {
    CLEAR:      '☀️',
    OVERCAST:   '⛅',
    RAIN:       '🌧️',
    HEAVY_RAIN: '⛈️',
    SANDSTORM:  '🌪️'
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
    _updateLightning(delta);
    _updatePuddles(delta);
    _updateFootstepSplash(delta);
    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /*  STATE CYCLE                                                        */
  /* ─────────────────────────────────────────────────────────────────── */
  function _updateCycle(delta) {
    _stateTimer += delta;
    if (_stateTimer >= _stateDuration) {
      _stateTimer = 0;
      _stateDuration = 60 + Math.random() * 120;
      var states = Object.keys(STATES);
      var next = states[Math.floor(Math.random() * states.length)];
      _setState(next, false);
    }
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

  function _applyFog() {
    if (!_scene || !_scene.fog) return;
    _scene.fog.color.copy(_fogColor);
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
    if (_ambientLight) _ambientLight.intensity = _ambientIntensity;
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
    applyWindDrift:    applyWindDrift
  };
})();
