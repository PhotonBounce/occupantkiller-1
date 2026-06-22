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

  /* ── Stars (200 small white Points) ───────────────────────────────── */
  function addStars(scene) {
    if (starsAdded || !scene) return;
    try {
      var geo = new THREE.BufferGeometry();
      var positions = new Float32Array(200 * 3);
      for (var i = 0; i < 200; i++) {
        var theta = Math.random() * Math.PI * 2;
        var phi   = Math.random() * Math.PI;
        var r     = 400 + Math.random() * 100;
        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 50; // above horizon
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true });
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
    } catch (e) {}
  }

  /* ── Moon PointLight ───────────────────────────────────────────────── */
  function addMoon(scene) {
    if (moonLight || !scene) return;
    try {
      moonLight = new THREE.PointLight(0xffffff, 0.2, 600);
      moonLight.position.set(100, 150, 0);
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

  /* ── Sky colour update ─────────────────────────────────────────────── */
  function updateSky(phase) {
    try {
      var renderer = window.__renderer;
      if (!renderer || !renderer.setClearColor) return;
      var sky = SKY[phase];
      if (sky) renderer.setClearColor(sky.color, sky.alpha);
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
      sun.intensity = intensity * 1.5;

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

  /* ── Phase transition ──────────────────────────────────────────────── */
  function onPhaseEnter(phase) {
    var scene = window._gameScene;

    updateSky(phase);
    updateAmbientLight(phase);

    if (phase === 'NIGHT') {
      addStars(scene);
      addMoon(scene);
    } else {
      // Remove night objects at dawn or later
      removeStars(scene);
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

    // Continuous updates (sun position, sky alpha already set on transition)
    updateSunLight(gameHour);
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
