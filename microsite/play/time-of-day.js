/* ───────────────────────────────────────────────────────────────────────
   TIME OF DAY — dynamic lighting, sky, stars, moon, phase transitions
   Each real second = 5 minutes of in-game time.
   Start time: 0600.
   ─────────────────────────────────────────────────────────────────────── */
window.TimeOfDay = (function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────────────── */
  // 1 real second = 5 game minutes  →  1 full day (1440 min) = 288 real seconds
  var REAL_SECONDS_PER_GAME_DAY = 288; // 1440 / 5

  // Phases defined as [startHour, endHour) using 24h clock (0–24)
  // NIGHT wraps: 1900–2400 and 0000–0500
  var PHASES = {
    DAWN:      { start: 5,  end: 7  },
    MORNING:   { start: 7,  end: 12 },
    AFTERNOON: { start: 12, end: 17 },
    DUSK:      { start: 17, end: 19 },
    NIGHT:     { start: 19, end: 29 }  // wraps: 19–24 + 0–5 (29 = 5 next day)
  };

  // Sky colours per phase
  var SKY = {
    DAWN:      { color: 0xff8844, alpha: 0.8 },
    MORNING:   { color: 0x87ceeb, alpha: 1.0 },
    AFTERNOON: { color: 0x87ceeb, alpha: 1.0 },
    DUSK:      { color: 0xff4422, alpha: 0.6 },
    NIGHT:     { color: 0x000011, alpha: 1.0 }
  };

  // Fog colours per phase — for smooth lerp transitions
  var FOG_COLORS = {
    DAWN:      0xff6633,   // warm orange-pink
    MORNING:   0xbbd8ee,   // cool light blue
    AFTERNOON: 0xd0e8f8,   // pale sky blue (clear)
    DUSK:      0xff5522,   // rich orange-red
    NIGHT:     0x050a1a    // deep blue-black
  };

  // Fog near/far per phase
  var FOG_RANGES = {
    DAWN:      { near: 20, far: 90 },
    MORNING:   { near: 20, far: 130 },
    AFTERNOON: { near: 25, far: 160 },
    DUSK:      { near: 18, far: 95 },
    NIGHT:     { near: 10, far: 70 }
  };

  // HUD toast info per phase
  var TOAST = {
    DAWN:      { text: '🌅 DAWN',      color: '#ff8844' },
    MORNING:   { text: '☀️ MORNING',   color: '#ffe066' },
    AFTERNOON: { text: '☀️ AFTERNOON',  color: '#ffcc44' },
    DUSK:      { text: '🌇 DUSK',      color: '#ff4422' },
    NIGHT:     { text: '🌙 NIGHT',     color: '#aaaaff' }
  };

  /* ── State ─────────────────────────────────────────────────────────── */
  // gameHour: 0.0 – 24.0 (fractional), starts at 06:00
  var gameHour       = 6.0;
  var currentPhase   = '';
  var lastPhase      = '';
  var starsAdded     = false;
  var moonLight      = null;
  var starsObject    = null;

  // Fog transition state
  var fogTargetColor    = null;   // THREE.Color target
  var fogCurrentColor   = null;   // THREE.Color current (lerped)
  var fogTargetNear     = 20;
  var fogTargetFar      = 130;
  var FOG_LERP_SPEED    = 0.8;    // per second blend rate (fraction)

  // Cloud shadow flicker state
  var cloudShadowTimer    = 0;     // countdown to next flicker (seconds)
  var cloudShadowActive   = false; // is flicker currently happening?
  var cloudShadowDuration = 0;     // how long current flicker lasts
  var cloudShadowElapsed  = 0;     // time elapsed in current flicker
  var cloudShadowBaseInt  = 0;     // sun intensity before flicker

  // Star fade state
  var starOpacity = 0;  // 0=invisible, 1=fully visible

  /* ── Helper: determine phase from hour ────────────────────────────── */
  function phaseForHour(h) {
    // Normalize to 0–24
    h = ((h % 24) + 24) % 24;
    if (h >= 5  && h < 7)  return 'DAWN';
    if (h >= 7  && h < 12) return 'MORNING';
    if (h >= 12 && h < 17) return 'AFTERNOON';
    if (h >= 17 && h < 19) return 'DUSK';
    return 'NIGHT'; // 19–24 and 0–5
  }

  /* ── Helper: linear interpolation ─────────────────────────────────── */
  function lerp(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return a + (b - a) * t;
  }

  /* ── Helper: hex color to RGB components ──────────────────────────── */
  function hexToRGB(hex) {
    return {
      r: ((hex >> 16) & 0xff) / 255,
      g: ((hex >> 8)  & 0xff) / 255,
      b: ( hex        & 0xff) / 255
    };
  }

  /* ── Stars (300 white/blue Points) ────────────────────────────────── */
  function addStars(scene) {
    if (starsAdded || !scene) return;
    try {
      var geo = new THREE.BufferGeometry();
      var COUNT = 300;
      var positions = new Float32Array(COUNT * 3);
      var colors    = new Float32Array(COUNT * 3);
      for (var i = 0; i < COUNT; i++) {
        var theta = Math.random() * Math.PI * 2;
        var phi   = Math.random() * Math.PI;
        var r     = 420 + Math.random() * 80;
        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 50; // above horizon
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

        // Vary star colours: mostly white, some blue-white, some warm
        var type = Math.random();
        if (type < 0.6) {
          // white
          colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0;
        } else if (type < 0.85) {
          // blue-white
          colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0;
        } else {
          // warm yellow-white
          colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.75;
        }
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
      var mat = new THREE.PointsMaterial({
        vertexColors: true,
        size: 1.4,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0   // start invisible; faded in by updateStarOpacity
      });
      starsObject = new THREE.Points(geo, mat);
      starsObject.name = '__timeOfDayStars';
      scene.add(starsObject);
      starsAdded = true;
    } catch (e) {
      // THREE may not be ready or geometry API differs — fail silently
    }
  }

  function removeStars(scene) {
    if (!starsAdded || !scene) return;
    try {
      if (starsObject) {
        scene.remove(starsObject);
        if (starsObject.geometry) starsObject.geometry.dispose();
        if (starsObject.material) starsObject.material.dispose();
        starsObject = null;
      }
      starsAdded = false;
      starOpacity = 0;
    } catch (e) {}
  }

  /* ── Update star fade opacity ──────────────────────────────────────── */
  function updateStarOpacity(dt) {
    var phase = currentPhase;
    var targetOpacity = 0;

    if (phase === 'NIGHT') {
      targetOpacity = 1;
    } else if (phase === 'DUSK') {
      // Fade in during dusk: DUSK spans 17-19, fade in from 17.5–19
      var h = ((gameHour % 24) + 24) % 24;
      targetOpacity = Math.max(0, Math.min(1, (h - 17.5) / 1.5));
    } else if (phase === 'DAWN') {
      // Fade out during dawn: DAWN spans 5-7, fully faded by 6.5
      var h2 = ((gameHour % 24) + 24) % 24;
      targetOpacity = Math.max(0, Math.min(1, 1.0 - (h2 - 5.0) / 1.5));
    }

    // Lerp current opacity toward target
    starOpacity = lerp(starOpacity, targetOpacity, Math.min(1, dt * 0.8));

    if (starsObject && starsObject.material) {
      starsObject.material.opacity = starOpacity;
    }

    // Ensure stars exist if they should be visible
    if (targetOpacity > 0 && !starsAdded) {
      addStars(window._gameScene);
    }
  }

  /* ── Moon DirectionalLight ─────────────────────────────────────────── */
  function addMoon(scene) {
    if (moonLight || !scene) return;
    try {
      // Bluish-white directional light, low intensity for night ambience
      moonLight = new THREE.DirectionalLight(0xaabbff, 0.08);
      moonLight.name = '__timeOfDayMoon';
      scene.add(moonLight);
    } catch (e) {}
  }

  function removeMoon(scene) {
    if (!moonLight || !scene) return;
    try {
      scene.remove(moonLight);
      moonLight = null;
    } catch (e) {}
  }

  /* ── Update moon position (opposite arc to sun) ────────────────────── */
  function updateMoonLight(h) {
    if (!moonLight) return;
    try {
      h = ((h % 24) + 24) % 24;

      // Moon rises at sunset (18:00) and sets at sunrise (06:00)
      // Map 18:00–06:00 (next day) to 0–PI arc
      var moonriseH = 18.0;
      var moonHours = h >= 18 ? (h - 18) : (h + 6); // hours since moonrise
      var moonSpan  = 12.0; // 18:00 to 06:00 = 12h arc
      var t = moonHours / moonSpan; // 0=east, 0.5=zenith, 1=west

      var angle  = t * Math.PI;
      var radius = 200;

      // Mirror the sun arc: moon comes from east and sets in west
      var moonX = Math.cos(angle) * radius;
      var moonY = Math.sin(angle) * radius;

      moonLight.position.set(moonX, Math.max(moonY, -10), 20);

      // Fade moon intensity near horizon
      var visible = Math.max(0, Math.sin(angle));
      moonLight.intensity = visible * 0.08;
    } catch (e) {}
  }

  /* ── Sky colour update ─────────────────────────────────────────────── */
  function updateSky(phase) {
    try {
      var renderer = window.__renderer;
      if (!renderer || !renderer.setClearColor) return;
      var sky = SKY[phase];
      if (sky) renderer.setClearColor(sky.color, sky.alpha);
    } catch (e) {}
  }

  /* ── Fog colour/range update ───────────────────────────────────────── */
  function setFogTarget(phase) {
    try {
      var scene = window._gameScene;
      if (!scene || !scene.fog) return;

      var targetHex = FOG_COLORS[phase];
      var ranges    = FOG_RANGES[phase];
      if (!targetHex || !ranges) return;

      if (!fogTargetColor) {
        fogTargetColor  = new THREE.Color(targetHex);
        fogCurrentColor = scene.fog.color ? scene.fog.color.clone() : new THREE.Color(targetHex);
      } else {
        fogTargetColor.setHex(targetHex);
      }
      fogTargetNear = ranges.near;
      fogTargetFar  = ranges.far;
    } catch (e) {}
  }

  function updateFog(dt) {
    try {
      var scene = window._gameScene;
      if (!scene || !scene.fog) return;
      if (!fogTargetColor || !fogCurrentColor) return;

      var alpha = Math.min(1, dt * FOG_LERP_SPEED);

      fogCurrentColor.r = lerp(fogCurrentColor.r, fogTargetColor.r, alpha);
      fogCurrentColor.g = lerp(fogCurrentColor.g, fogTargetColor.g, alpha);
      fogCurrentColor.b = lerp(fogCurrentColor.b, fogTargetColor.b, alpha);

      scene.fog.color.copy(fogCurrentColor);
      scene.fog.near = lerp(scene.fog.near, fogTargetNear, alpha);
      scene.fog.far  = lerp(scene.fog.far,  fogTargetFar,  alpha);
    } catch (e) {}
  }

  /* ── Sun light position & intensity ───────────────────────────────── */
  function updateSunLight(h) {
    try {
      var sun = window.__sunLight;
      if (!sun) return;

      // Normalize hour to [0,24)
      h = ((h % 24) + 24) % 24;

      // Sun travels on a hemisphere arc.
      // Sunrise at 06:00 (east, angle=0), noon at 12:00 (zenith), sunset at 18:00 (west).
      // Angle: map 06:00–18:00 to 0–PI (above horizon)
      // Outside that range sun is below horizon.
      var sunriseH = 6.0;
      var sunsetH  = 18.0;
      var t = (h - sunriseH) / (sunsetH - sunriseH); // 0 at sunrise, 1 at sunset

      var angle  = t * Math.PI; // 0=east, PI/2=zenith, PI=west
      var radius = 200;

      // East-West arc: x goes from +radius (east) to -radius (west)
      var sunX = Math.cos(angle) * radius;     // positive=east, negative=west
      var sunY = Math.sin(angle) * radius;     // positive=above horizon
      var sunZ = 0;

      sun.position.set(sunX, Math.max(sunY, -10), sunZ);

      // Intensity: 0 below horizon, peaks at noon
      var intensity = Math.max(0, Math.sin(angle));
      // Store base intensity for cloud shadow system to reference
      sun._todBaseIntensity = intensity * 1.5;

      // Only set if no cloud shadow is active
      if (!cloudShadowActive) {
        sun.intensity = sun._todBaseIntensity;
      }

      // Colour: warm orange near horizon, white-yellow at zenith
      var warm = 1.0 - intensity;
      var r = Math.round(255);
      var g = Math.round(lerp(100, 255, intensity));
      var b = Math.round(lerp(20,  255, intensity));
      sun.color.setRGB(r / 255, g / 255, b / 255);
    } catch (e) {}
  }

  /* ── Ambient light ─────────────────────────────────────────────────── */
  function updateAmbientLight(phase) {
    try {
      var amb = window.__ambientLight;
      if (!amb) return;
      switch (phase) {
        case 'DAWN':
          amb.color.setHex(0xff8866);
          amb.intensity = 0.35;
          break;
        case 'MORNING':
          amb.color.setHex(0xfff5cc);
          amb.intensity = 0.65;
          break;
        case 'AFTERNOON':
          amb.color.setHex(0xffffff);
          amb.intensity = 0.7;
          break;
        case 'DUSK':
          amb.color.setHex(0xff7744);
          amb.intensity = 0.4;
          break;
        case 'NIGHT':
          amb.color.setHex(0x112244);
          amb.intensity = 0.12;
          break;
        default:
          break;
      }
    } catch (e) {}
  }

  /* ── Cloud shadow flicker ──────────────────────────────────────────── */
  function scheduleNextCloudShadow() {
    // Next flicker between 30–120 real seconds from now
    cloudShadowTimer    = 30 + Math.random() * 90;
    cloudShadowActive   = false;
    cloudShadowElapsed  = 0;
  }

  function updateCloudShadow(dt) {
    // Cloud shadows only happen when sun is up (day phases)
    var phase = currentPhase;
    if (phase === 'NIGHT') {
      // Cancel any active shadow; reset timer
      cloudShadowActive = false;
      return;
    }

    var sun = window.__sunLight;
    if (!sun) return;

    if (!cloudShadowActive) {
      cloudShadowTimer -= dt;
      if (cloudShadowTimer <= 0) {
        // Start a cloud shadow flicker: 2–4 second duration
        cloudShadowActive   = true;
        cloudShadowDuration = 2 + Math.random() * 2;
        cloudShadowElapsed  = 0;
        cloudShadowBaseInt  = sun._todBaseIntensity !== undefined ? sun._todBaseIntensity : sun.intensity;
      }
    } else {
      cloudShadowElapsed += dt;
      var progress = cloudShadowElapsed / cloudShadowDuration;

      if (progress >= 1) {
        // Flicker done — restore sun intensity and schedule next
        sun.intensity = cloudShadowBaseInt;
        scheduleNextCloudShadow();
      } else {
        // Smooth dimming envelope: ramp down then back up
        // Use a sine curve: full dim at midpoint
        var dimFactor = 0.3 + 0.7 * Math.abs(Math.sin(progress * Math.PI));
        // dimFactor: 1.0 at start/end, 0.3 at peak shadow
        sun.intensity = cloudShadowBaseInt * dimFactor;
      }
    }
  }

  /* ── Phase transition ──────────────────────────────────────────────── */
  function onPhaseEnter(phase) {
    var scene = window._gameScene;

    updateSky(phase);
    updateAmbientLight(phase);
    setFogTarget(phase);

    if (phase === 'NIGHT') {
      addStars(scene);
      addMoon(scene);
    } else if (phase === 'DUSK') {
      // Stars start fading in during dusk — add the object early
      addStars(scene);
      removeMoon(scene);
    } else {
      // Dawn, Morning, Afternoon: ensure night objects removed
      // Stars fade out during dawn via updateStarOpacity; remove when fully faded
      removeMoon(scene);
    }

    // HUD toast
    try {
      var toast = TOAST[phase];
      if (toast && window.HUD && HUD.showToast) {
        HUD.showToast(toast.text, 3000, toast.color);
      }
    } catch (e) {}

    // Weather integration
    try {
      if (window.WeatherSystem && WeatherSystem.setTimePhase) {
        WeatherSystem.setTimePhase(phase);
      }
    } catch (e) {}
  }

  /* ── tick(dt) — called each frame with real-time delta in seconds ─── */
  function tick(dt) {
    if (typeof dt !== 'number' || isNaN(dt) || dt <= 0) return;

    // Advance game time: 1 real second = 5 game minutes = 5/60 game hours
    gameHour += (dt * 5) / 60;
    // Keep in [0, 24)
    if (gameHour >= 24) gameHour -= 24;

    var phase = phaseForHour(gameHour);
    if (phase !== currentPhase) {
      lastPhase    = currentPhase;
      currentPhase = phase;
      onPhaseEnter(phase);
    }

    // Continuous per-frame updates
    updateSunLight(gameHour);
    updateMoonLight(gameHour);
    updateFog(dt);
    updateStarOpacity(dt);
    updateCloudShadow(dt);

    // Clean up fully faded stars if we're past dawn
    if (starsAdded && starOpacity < 0.01 && phase !== 'NIGHT' && phase !== 'DUSK') {
      removeStars(window._gameScene);
    }
  }

  /* ── Public API ────────────────────────────────────────────────────── */
  function getPhase() {
    return currentPhase;
  }

  function getHour() {
    return gameHour;
  }

  function setHour(h) {
    h = parseFloat(h);
    if (isNaN(h)) return;
    gameHour = ((h % 24) + 24) % 24;
    currentPhase = phaseForHour(gameHour);
    onPhaseEnter(currentPhase);
    updateSunLight(gameHour);
    updateMoonLight(gameHour);
  }

  function getTimeString() {
    var h = ((gameHour % 24) + 24) % 24;
    var hours   = Math.floor(h) % 24;
    var minutes = Math.floor((h - Math.floor(h)) * 60);
    var hh = hours   < 10 ? '0' + hours   : '' + hours;
    var mm = minutes < 10 ? '0' + minutes : '' + minutes;
    return hh + ':' + mm;
  }

  /* ── Bootstrap: set initial hour and phase ─────────────────────────── */
  (function init() {
    gameHour     = 6.0; // 0600
    currentPhase = phaseForHour(gameHour);
    scheduleNextCloudShadow();
    // Don't fire HUD toast on init; just set visuals when scene is ready.
    // Visuals will be applied on first tick() call.
  })();

  function getCombatModifiers() {
    var phase = currentPhase;
    // Night: enemies have shorter detection range, player has NV-scope tint
    // Dawn/Dusk: reduced visibility for both sides
    var mods = {
      enemyDetectRange: 1.0,  // multiplier on enemy sight range
      playerVisibility: 1.0,  // how easily player is spotted
      fogDensity: 1.0,        // fog multiplier
      nightVision: false,     // show NV tint on HUD
      label: phase
    };
    switch (phase) {
      case 'NIGHT':
        mods.enemyDetectRange = 0.55;
        mods.playerVisibility = 0.6;
        mods.fogDensity = 1.4;
        mods.nightVision = true;
        break;
      case 'DAWN':
        mods.enemyDetectRange = 0.75;
        mods.playerVisibility = 0.8;
        mods.fogDensity = 1.2;
        break;
      case 'DUSK':
        mods.enemyDetectRange = 0.7;
        mods.playerVisibility = 0.75;
        mods.fogDensity = 1.15;
        break;
      case 'MORNING':
        mods.enemyDetectRange = 0.9;
        break;
      // AFTERNOON: defaults (full visibility)
    }
    return mods;
  }

  var _nvOverlay = null;

  function _ensureNVOverlay() {
    if (_nvOverlay) return;
    _nvOverlay = document.createElement('div');
    _nvOverlay.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:10;display:none;',
      'background:rgba(0,30,0,0.18);',
      'mix-blend-mode:multiply;'
    ].join('');
    if (document.body) document.body.appendChild(_nvOverlay);
  }

  function applyNightVisionHUD(enable) {
    if (typeof document === 'undefined') return;
    _ensureNVOverlay();
    if (_nvOverlay) _nvOverlay.style.display = enable ? 'block' : 'none';
  }

  return {
    tick:               tick,
    getPhase:           getPhase,
    getHour:            getHour,
    setHour:            setHour,
    getTimeString:      getTimeString,
    getCombatModifiers: getCombatModifiers,
    applyNightVisionHUD: applyNightVisionHUD
  };

})();
