/* ───────────────────────────────────────────────────────────────────────────
   WEATHER AMBIENCE — Dynamic sky, day/night cycle, atmospheric effects,
   fog of war, ambient sound cues, and HUD display for Three.js browser game.
   Cycle: 0=dawn, 0.25=noon, 0.5=dusk, 0.75=midnight (10-min real-time default)
   ─────────────────────────────────────────────────────────────────────────── */
window.WeatherAmbience = (function () {
  'use strict';

  /* ── Cycle config ────────────────────────────────────────────────────────── */
  var _cycleDuration  = 600;   // seconds for a full day/night cycle (10 minutes)
  var _timeOfDay      = 0;     // 0..1 normalized (0=dawn,0.25=noon,0.5=dusk,0.75=midnight)
  var _lastTimestamp  = 0;
  var _manualAdvance  = 0;     // accumulated key-press advances in fractional day units

  /* ── Scene references ───────────────────────────────────────────────────── */
  var _scene       = null;
  var _camera      = null;
  var _renderer    = null;
  var _weather     = 'clear';  // 'clear' | 'storm'

  /* ── Sky / sun / moon objects ───────────────────────────────────────────── */
  var _sunLight    = null;
  var _ambientLight = null;
  var _moon        = null;
  var _moonLight   = null;
  var _stars       = [];
  var _clouds      = [];

  /* ── Lightning ──────────────────────────────────────────────────────────── */
  var _lightningLight   = null;
  var _lightningTimer   = 0;
  var _lightningNext    = 0;   // seconds until next flash
  var _lightningActive  = false;
  var _lightningTimeout = 0;

  /* ── Fog of war ─────────────────────────────────────────────────────────── */
  var FOW_FADE_START = 40;   // units — enemies start fading
  var FOW_HIDE_START = 60;   // units — enemies fully hidden

  /* ── Fog color palette ──────────────────────────────────────────────────── */
  var FOG_DAY   = new THREE.Color(0x87CEEB);  // light blue
  var FOG_DAWN  = new THREE.Color(0xFF7733);  // orange
  var FOG_DUSK  = new THREE.Color(0xFF7733);  // orange
  var FOG_NIGHT = new THREE.Color(0x111133);  // dark blue

  /* ── Sky color palette ──────────────────────────────────────────────────── */
  var SKY_DAWN    = new THREE.Color(0xFF9966);
  var SKY_NOON    = new THREE.Color(0x87CEEB);
  var SKY_DUSK    = new THREE.Color(0xFF6633);
  var SKY_NIGHT   = new THREE.Color(0x0A0A1A);

  /* ── Sun color stops ────────────────────────────────────────────────────── */
  var SUN_DAWN  = new THREE.Color(0xFFAA66);
  var SUN_NOON  = new THREE.Color(0xFFFFDD);
  var SUN_DUSK  = new THREE.Color(0xFF6633);

  /* ── HUD element ────────────────────────────────────────────────────────── */
  var _hud = null;

  /* ── Audio ──────────────────────────────────────────────────────────────── */
  var _audioCtx    = null;
  var _droneNode   = null;   // dawn drone
  var _windNode    = null;   // dusk wind
  var _audioPhase  = '';     // 'dawn' | 'dusk' | ''

  /* ── Key state ──────────────────────────────────────────────────────────── */
  var _keysDown    = {};

  /* ── Sunrise/sunset transition tracking ────────────────────────────────── */
  var _bgColor     = new THREE.Color(0xFF9966);  // starts at dawn

  /* ─────────────────────────────────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────────────────────────────────── */

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _lerpColor(target, a, b, t) {
    target.r = _lerp(a.r, b.r, t);
    target.g = _lerp(a.g, b.g, t);
    target.b = _lerp(a.b, b.b, t);
  }

  /* Convert 0..1 time to "HH:MM" string (0=06:00 dawn, 0.25=12:00, etc.) */
  function _timeLabel(t) {
    // 0 → 06:00, 0.25 → 12:00, 0.5 → 18:00, 0.75 → 00:00
    var totalMinutes = Math.floor((t * 1440 + 360) % 1440);
    var hh = Math.floor(totalMinutes / 60);
    var mm = totalMinutes % 60;
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }

  function _phaseName(t) {
    if (t < 0.12 || t > 0.9) return 'DAWN';
    if (t < 0.38) return 'DAY';
    if (t < 0.62) return 'DUSK';
    return 'NIGHT';
  }

  /* Visibility in metres based on fog far plane */
  function _visibilityMetres() {
    if (_scene && _scene.fog) {
      return Math.round(_scene.fog.far);
    }
    return 300;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     BUILD SCENE OBJECTS
  ───────────────────────────────────────────────────────────────────────── */

  function _buildSun() {
    _sunLight = new THREE.DirectionalLight(0xFFFFDD, 1.0);
    _sunLight.name = 'wa_sun';
    _scene.add(_sunLight);
  }

  function _buildAmbient() {
    _ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    _ambientLight.name = 'wa_ambient';
    _scene.add(_ambientLight);
  }

  function _buildMoon() {
    var geo  = new THREE.SphereGeometry(3, 16, 16);
    var mat  = new THREE.MeshStandardMaterial({
      color: 0xDDDDFF,
      emissive: new THREE.Color(0xFFFFFF),
      emissiveIntensity: 0.6
    });
    _moon = new THREE.Mesh(geo, mat);
    _moon.name = 'wa_moon';
    _moon.position.set(0, 80, -80);
    _scene.add(_moon);

    _moonLight = new THREE.PointLight(0x8888FF, 0.3, 200);
    _moonLight.position.copy(_moon.position);
    _moonLight.name = 'wa_moonLight';
    _scene.add(_moonLight);
  }

  function _buildStars() {
    var starGeo = new THREE.SphereGeometry(0.2, 4, 4);
    var starMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0 });
    var i, theta, phi, r, star;
    for (i = 0; i < 300; i++) {
      star = new THREE.Mesh(starGeo, starMat.clone());
      star.name = 'wa_star_' + i;
      theta = Math.random() * Math.PI * 2;
      phi   = Math.random() * Math.PI;
      r     = 120;
      star.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        Math.abs(r * Math.cos(phi)),          // keep stars above horizon
        r * Math.sin(phi) * Math.sin(theta)
      );
      _scene.add(star);
      _stars.push(star);
    }
  }

  function _buildClouds() {
    var cloudGeo = new THREE.BoxGeometry(8, 1, 6);
    var cloudMat = new THREE.MeshLambertMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.7
    });
    var i, cloud;
    for (i = 0; i < 15; i++) {
      cloud = new THREE.Mesh(cloudGeo, cloudMat.clone());
      cloud.name = 'wa_cloud_' + i;
      cloud.position.set(
        (Math.random() - 0.5) * 200,
        40 + (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 200
      );
      cloud.userData.driftSpeed = 0.5 + Math.random() * 0.5;
      cloud.userData.driftDir   = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        0,
        (Math.random() - 0.5) * 0.1
      ).normalize();
      _scene.add(cloud);
      _clouds.push(cloud);
    }
  }

  function _buildLightning() {
    _lightningLight = new THREE.PointLight(0xDDDDFF, 0, 300);
    _lightningLight.position.set(0, 50, 0);
    _lightningLight.name = 'wa_lightning';
    _scene.add(_lightningLight);
    _lightningNext = 8 + Math.random() * 22;  // first flash 8-30s
  }

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'wa-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.55)',
      'color:#EEFFCC',
      'font-family:monospace',
      'font-size:13px',
      'padding:4px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hud);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     AUDIO
  ───────────────────────────────────────────────────────────────────────── */

  function _ensureAudioCtx() {
    if (_audioCtx) return;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
  }

  function _stopNode(node) {
    if (!node) return null;
    try { node.stop(); } catch (e) {}
    return null;
  }

  function _startDrone() {
    _ensureAudioCtx();
    if (!_audioCtx) return;
    if (_droneNode) return;
    var osc  = _audioCtx.createOscillator();
    var gain = _audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, _audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, _audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.start();
    _droneNode = osc;
    _droneNode._gain = gain;
  }

  function _stopDrone() {
    if (!_droneNode) return;
    _droneNode = _stopNode(_droneNode);
  }

  function _startWind() {
    _ensureAudioCtx();
    if (!_audioCtx) return;
    if (_windNode) return;
    var osc  = _audioCtx.createOscillator();
    var gain = _audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, _audioCtx.currentTime);
    gain.gain.setValueAtTime(0.035, _audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.start();
    _windNode = osc;
    _windNode._gain = gain;
  }

  function _stopWind() {
    if (!_windNode) return;
    _windNode = _stopNode(_windNode);
  }

  /* Modulate wind frequency each frame */
  function _updateAudio(elapsed) {
    if (!_audioCtx) return;
    var t     = _audioCtx.currentTime;
    var phase = _phaseName(_timeOfDay);

    if (phase === 'DAWN') {
      if (_audioPhase !== 'dawn') {
        _stopWind();
        _startDrone();
        _audioPhase = 'dawn';
      }
      // gentle frequency drift on drone
      if (_droneNode) {
        _droneNode.frequency.setValueAtTime(
          200 + 10 * Math.sin(t * 0.3),
          t
        );
      }
    } else if (phase === 'DUSK') {
      if (_audioPhase !== 'dusk') {
        _stopDrone();
        _startWind();
        _audioPhase = 'dusk';
      }
      // whistle modulation: 200 + 100*sin(wave)
      if (_windNode) {
        _windNode.frequency.setValueAtTime(
          200 + 100 * Math.sin(t * 1.5),
          t
        );
      }
    } else {
      if (_audioPhase !== '') {
        _stopDrone();
        _stopWind();
        _audioPhase = '';
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     KEY HANDLING
  ───────────────────────────────────────────────────────────────────────── */

  function _onKeyDown(e) {
    _keysDown[e.key] = true;

    // W key: advance 1 hour
    if (e.key === 'w' || e.key === 'W') {
      _manualAdvance += 1 / 24;
    }
    // A key: advance 1 hour (as specified: W+A both advance by 1 hour)
    if (e.key === 'a' || e.key === 'A') {
      _manualAdvance += 1 / 24;
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.key] = false;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     UPDATE SUN
  ───────────────────────────────────────────────────────────────────────── */

  function _updateSun(t) {
    if (!_sunLight) return;

    // t=0 dawn, t=0.25 noon, t=0.5 dusk — sun active in 0..0.5
    // orbit along X-Z arc, angle 0 at dawn, pi at dusk
    var angle     = t * Math.PI * 2;  // full circle
    var radius    = 100;
    var sunX      = radius * Math.cos(angle - Math.PI * 0.5);
    var sunY      = radius * Math.sin(angle - Math.PI * 0.5);  // below horizon at night
    var sunZ      = 0;

    _sunLight.position.set(sunX, sunY, sunZ);

    // Intensity: peaks at noon (t=0.25), 0 at night (t>0.5)
    var intensity = 0;
    if (t <= 0.5) {
      // day half: sine wave 0→1→0
      intensity = Math.max(0, Math.sin(t * Math.PI * 2));
    }
    _sunLight.intensity = intensity;

    // Color lerp: dawn → noon → dusk
    if (t < 0.125) {
      // dawn → noon first quarter
      _lerpColor(_sunLight.color, SUN_DAWN, SUN_NOON, t / 0.125);
    } else if (t < 0.375) {
      // noon steady
      _sunLight.color.copy(SUN_NOON);
    } else if (t <= 0.5) {
      // noon → dusk
      _lerpColor(_sunLight.color, SUN_NOON, SUN_DUSK, (t - 0.375) / 0.125);
    } else {
      // night — no sun
      _sunLight.color.copy(SUN_DUSK);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     UPDATE MOON
  ───────────────────────────────────────────────────────────────────────── */

  function _updateMoon(t) {
    if (!_moon) return;

    // Moon active at night: 0.5..1.0
    var nightT = 0;
    if (t > 0.5) {
      nightT = (t - 0.5) * 2;  // 0→1 over night half
    }

    // Moon orbits opposite the sun
    var angle  = (t + 0.5) * Math.PI * 2;
    var radius = 100;
    var mx = radius * Math.cos(angle - Math.PI * 0.5);
    var my = radius * Math.sin(angle - Math.PI * 0.5);

    _moon.position.set(mx, my, 0);
    _moonLight.position.copy(_moon.position);

    var moonVisible = t > 0.5 && my > -10;
    _moon.visible        = moonVisible;
    _moonLight.intensity = moonVisible ? 0.3 : 0;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     UPDATE STARS
  ───────────────────────────────────────────────────────────────────────── */

  function _updateStars(t) {
    // Stars visible after sunset (t > 0.5) and fade in
    var starOpacity = 0;
    if (t > 0.55) {
      starOpacity = _clamp((t - 0.55) / 0.1, 0, 1);
    } else if (t < 0.05) {
      // fade out just before dawn
      starOpacity = _clamp(1 - t / 0.05, 0, 1);
    } else if (t > 0.45 && t <= 0.55) {
      // sunset fade in
      starOpacity = _clamp((t - 0.45) / 0.1, 0, 1);
    }

    var i;
    for (i = 0; i < _stars.length; i++) {
      _stars[i].material.opacity = starOpacity;
      _stars[i].visible = starOpacity > 0.01;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     UPDATE FOG
  ───────────────────────────────────────────────────────────────────────── */

  function _updateFog(t) {
    if (!_scene || !_scene.fog) return;
    var fc = new THREE.Color();

    if (t < 0.1) {
      // dawn
      _lerpColor(fc, FOG_NIGHT, FOG_DAWN, t / 0.1);
    } else if (t < 0.15) {
      // dawn → day
      _lerpColor(fc, FOG_DAWN, FOG_DAY, (t - 0.1) / 0.05);
    } else if (t < 0.4) {
      // day
      fc.copy(FOG_DAY);
    } else if (t < 0.5) {
      // day → dusk
      _lerpColor(fc, FOG_DAY, FOG_DUSK, (t - 0.4) / 0.1);
    } else if (t < 0.6) {
      // dusk → night
      _lerpColor(fc, FOG_DUSK, FOG_NIGHT, (t - 0.5) / 0.1);
    } else {
      // night
      fc.copy(FOG_NIGHT);
    }

    _scene.fog.color.copy(fc);

    // Fog far distance: better visibility during day, worse at night
    var isDay  = t > 0.1 && t < 0.5;
    _scene.fog.near = isDay ? 80  : 30;
    _scene.fog.far  = isDay ? 350 : 150;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     UPDATE SKY (scene.background color)
  ───────────────────────────────────────────────────────────────────────── */

  function _updateSky(t, dt) {
    var targetColor = new THREE.Color();

    if (t < 0.1) {
      _lerpColor(targetColor, SKY_NIGHT, SKY_DAWN, t / 0.1);
    } else if (t < 0.2) {
      _lerpColor(targetColor, SKY_DAWN, SKY_NOON, (t - 0.1) / 0.1);
    } else if (t < 0.4) {
      targetColor.copy(SKY_NOON);
    } else if (t < 0.5) {
      _lerpColor(targetColor, SKY_NOON, SKY_DUSK, (t - 0.4) / 0.1);
    } else if (t < 0.6) {
      _lerpColor(targetColor, SKY_DUSK, SKY_NIGHT, (t - 0.5) / 0.1);
    } else {
      targetColor.copy(SKY_NIGHT);
    }

    // Lerp towards target over 60s transition (dt/60 blend weight)
    var blendSpeed = dt / 60.0;
    _bgColor.lerp(targetColor, _clamp(blendSpeed * 3, 0, 1));

    if (_scene) {
      _scene.background = _bgColor.clone();
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     UPDATE AMBIENT LIGHT
  ───────────────────────────────────────────────────────────────────────── */

  function _updateAmbient(t) {
    if (!_ambientLight) return;
    var intensity;
    if (t < 0.1) {
      intensity = _lerp(0.1, 0.4, t / 0.1);
    } else if (t < 0.4) {
      intensity = _lerp(0.4, 0.8, (t - 0.1) / 0.3);
    } else if (t < 0.5) {
      intensity = _lerp(0.8, 0.2, (t - 0.4) / 0.1);
    } else if (t < 0.6) {
      intensity = _lerp(0.2, 0.1, (t - 0.5) / 0.1);
    } else {
      intensity = 0.1;
    }
    _ambientLight.intensity = intensity;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     UPDATE CLOUDS
  ───────────────────────────────────────────────────────────────────────── */

  function _updateClouds(dt) {
    var i, cloud;
    for (i = 0; i < _clouds.length; i++) {
      cloud = _clouds[i];
      cloud.position.x += cloud.userData.driftDir.x * cloud.userData.driftSpeed * dt;
      cloud.position.z += cloud.userData.driftDir.z * cloud.userData.driftSpeed * dt;

      // Wrap clouds around the map boundary
      if (cloud.position.x > 120)  cloud.position.x = -120;
      if (cloud.position.x < -120) cloud.position.x =  120;
      if (cloud.position.z > 120)  cloud.position.z = -120;
      if (cloud.position.z < -120) cloud.position.z =  120;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     UPDATE LIGHTNING
  ───────────────────────────────────────────────────────────────────────── */

  function _updateLightning(dt) {
    if (_weather !== 'storm') {
      if (_lightningLight) _lightningLight.intensity = 0;
      return;
    }

    _lightningTimer += dt;

    if (_lightningActive) {
      _lightningTimeout -= dt;
      if (_lightningTimeout <= 0) {
        _lightningActive = false;
        _lightningLight.intensity = 0;
        // Schedule next flash 8-30s from now
        _lightningNext = 8 + Math.random() * 22;
        _lightningTimer = 0;
      }
    } else {
      if (_lightningTimer >= _lightningNext) {
        // Trigger flash
        _lightningActive  = true;
        _lightningTimeout = 0.1;    // 100ms flash
        _lightningTimer   = 0;

        // Random position
        _lightningLight.position.set(
          (Math.random() - 0.5) * 100,
          50,
          (Math.random() - 0.5) * 100
        );
        _lightningLight.intensity = 5 + Math.random() * 5;
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     FOG OF WAR
  ───────────────────────────────────────────────────────────────────────── */

  function _applyFogOfWar(enemies, playerPos) {
    if (!enemies || !playerPos) return;
    var i, enemy, dist, t;
    for (i = 0; i < enemies.length; i++) {
      enemy = enemies[i];
      if (!enemy || !enemy.position) continue;

      dist = playerPos.distanceTo(enemy.position);

      if (dist > FOW_HIDE_START) {
        // Fully hidden beyond 60 units
        enemy.visible = false;
      } else if (dist > FOW_FADE_START) {
        // Fade from opacity 1 at 40u to 0 at 60u
        enemy.visible = true;
        t = 1 - (dist - FOW_FADE_START) / (FOW_HIDE_START - FOW_FADE_START);
        t = _clamp(t, 0, 1);
        if (enemy.material) {
          enemy.material.transparent = true;
          enemy.material.opacity     = t;
        } else if (enemy.traverse) {
          enemy.traverse(function (child) {
            if (child.isMesh && child.material) {
              child.material.transparent = true;
              child.material.opacity     = t;
            }
          });
        }
      } else {
        // Fully visible within 40 units
        enemy.visible = true;
        if (enemy.material) {
          enemy.material.opacity = 1;
        } else if (enemy.traverse) {
          enemy.traverse(function (child) {
            if (child.isMesh && child.material) {
              child.material.opacity = 1;
            }
          });
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     UPDATE HUD
  ───────────────────────────────────────────────────────────────────────── */

  function _updateHUD(t) {
    if (!_hud) return;
    var timeStr = _timeLabel(t);
    var phase   = _phaseName(t);
    var vis     = _visibilityMetres();
    _hud.textContent = 'TIME: ' + timeStr + ' | ' + phase + ' | VIS: ' + vis + 'm';
  }

  /* ─────────────────────────────────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────────────────────────────────── */

  /**
   * init(scene, camera, renderer, options)
   * options: { weather: 'clear'|'storm', cycleDuration: seconds, startTime: 0..1 }
   */
  function init(scene, camera, renderer, options) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;

    options = options || {};
    if (options.weather)       _weather       = options.weather;
    if (options.cycleDuration) _cycleDuration = options.cycleDuration;
    if (typeof options.startTime === 'number') _timeOfDay = options.startTime;

    // Ensure scene has fog
    if (_scene && !_scene.fog) {
      _scene.fog = new THREE.Fog(FOG_DAY, 80, 350);
    }

    _buildAmbient();
    _buildSun();
    _buildMoon();
    _buildStars();
    _buildClouds();
    _buildLightning();
    _buildHUD();

    // Key listeners
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);

    _lastTimestamp = performance.now();
  }

  /**
   * update(dt, enemies, playerPos)
   * dt        — delta time in seconds
   * enemies   — array of THREE.Object3D (optional, for fog of war)
   * playerPos — THREE.Vector3 (optional, for fog of war)
   */
  function update(dt, enemies, playerPos) {
    if (!_scene) return;

    // Apply any manual time advances
    if (_manualAdvance > 0) {
      _timeOfDay    += _manualAdvance;
      _manualAdvance = 0;
    }

    // Advance time by dt / cycleDuration
    _timeOfDay += dt / _cycleDuration;
    _timeOfDay  = _timeOfDay % 1;

    var t = _timeOfDay;

    _updateSun(t);
    _updateMoon(t);
    _updateStars(t);
    _updateFog(t);
    _updateSky(t, dt);
    _updateAmbient(t);
    _updateClouds(dt);
    _updateLightning(dt);
    _updateAudio(dt);
    _updateHUD(t);

    if (enemies && playerPos) {
      _applyFogOfWar(enemies, playerPos);
    }
  }

  /**
   * reset() — Remove all WeatherAmbience objects and listeners
   */
  function reset() {
    var i;

    if (_sunLight)    { _scene.remove(_sunLight);    _sunLight    = null; }
    if (_ambientLight){ _scene.remove(_ambientLight); _ambientLight = null; }
    if (_moon)        { _scene.remove(_moon);         _moon        = null; }
    if (_moonLight)   { _scene.remove(_moonLight);    _moonLight   = null; }
    if (_lightningLight) { _scene.remove(_lightningLight); _lightningLight = null; }

    for (i = 0; i < _stars.length;  i++) { _scene.remove(_stars[i]);  }
    for (i = 0; i < _clouds.length; i++) { _scene.remove(_clouds[i]); }
    _stars  = [];
    _clouds = [];

    _stopDrone();
    _stopWind();

    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }

    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup',   _onKeyUp);

    _timeOfDay     = 0;
    _manualAdvance = 0;
    _audioPhase    = '';
    _weather       = 'clear';
  }

  /* ── Expose weather setter ──────────────────────────────────────────────── */
  function setWeather(w) {
    _weather = w;
  }

  return {
    init:       init,
    update:     update,
    reset:      reset,
    setWeather: setWeather
  };

}());
