window.WeatherEffects = (function () {
  'use strict';

  // ─── Weather type constants ───────────────────────────────────────────────
  var WEATHER_TYPES = {
    CLEAR:        'CLEAR',
    FOG:          'FOG',
    RAIN:         'RAIN',
    BLIZZARD:     'BLIZZARD',
    SANDSTORM:    'SANDSTORM',
    THUNDERSTORM: 'THUNDERSTORM'
  };

  // ─── Fog density targets per weather type ────────────────────────────────
  var FOG_DENSITY = {
    CLEAR:        0.005,
    FOG:          0.04,
    RAIN:         0.015,
    BLIZZARD:     0.06,
    SANDSTORM:    0.05,
    THUNDERSTORM: 0.02
  };

  // ─── Wind compass directions ──────────────────────────────────────────────
  var WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  // ─── Module state ─────────────────────────────────────────────────────────
  var scene        = null;
  var camera       = null;
  var player       = null;
  var ambientLight = null;
  var audioCtx     = null;

  var currentWeather     = WEATHER_TYPES.CLEAR;
  var targetWeather      = WEATHER_TYPES.CLEAR;
  var transitionProgress = 1.0;   // 0 = start, 1 = complete
  var transitionDuration = 10.0;  // seconds

  var cycleTimer    = 0;
  var cycleInterval = 120; // seconds until next random weather change

  // Wind state
  var windDirIndex = 3;   // SW default
  var windSpeed    = 8;   // kph
  var windVecX     = 0;
  var windVecZ     = 0;

  // Particle pools
  var rainParticles     = [];
  var blizzardParticles = [];
  var sandParticles     = [];

  var rainGroup     = null;
  var blizzardGroup = null;
  var sandGroup     = null;

  // Puddle state
  var puddles         = [];
  var puddleTimer     = 0;
  var PUDDLE_LIFETIME = 60; // seconds

  // Thunder state
  var thunderTimer    = 0;
  var thunderInterval = 25;
  var isFlashing      = false;
  var flashTimer      = 0;
  var FLASH_DURATION  = 0.5;

  // HUD element
  var hudEl = null;

  // ─── Tactical flags (readable by other modules) ───────────────────────────
  var weaponJamChance    = 0;
  var radioJammed        = false;
  var enemyVisionMult    = 1.0;
  var playerVisionMult   = 1.0;
  var staminaWindPenalty = false;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function randRange(a, b) {
    return a + Math.random() * (b - a);
  }

  function randInt(a, b) {
    return Math.floor(a + Math.random() * (b - a + 1));
  }

  function windDirName() {
    return WIND_DIRS[windDirIndex % WIND_DIRS.length];
  }

  function weatherIcon(type) {
    var icons = {
      CLEAR:        '☀️',
      FOG:          '🌫️',
      RAIN:         '🌧️',
      BLIZZARD:     '❄️',
      SANDSTORM:    '🌪️',
      THUNDERSTORM: '⛈️'
    };
    return icons[type] || '☀️';
  }

  function applyTacticalEffects(type) {
    weaponJamChance = (type === WEATHER_TYPES.RAIN || type === WEATHER_TYPES.THUNDERSTORM) ? 0.05 : 0;
    radioJammed     = (type === WEATHER_TYPES.THUNDERSTORM);

    if (type === WEATHER_TYPES.FOG || type === WEATHER_TYPES.BLIZZARD || type === WEATHER_TYPES.SANDSTORM) {
      enemyVisionMult  = 0.5;
      playerVisionMult = 0.7;
    } else {
      enemyVisionMult  = 1.0;
      playerVisionMult = 1.0;
    }

    staminaWindPenalty = (type === WEATHER_TYPES.SANDSTORM || type === WEATHER_TYPES.BLIZZARD);
  }

  // ─── Wind vector from direction index ────────────────────────────────────
  function updateWindVector() {
    var angleRad = (windDirIndex / 8) * Math.PI * 2;
    var speedMS  = windSpeed / 3.6; // kph to m/s
    windVecX = Math.sin(angleRad) * speedMS;
    windVecZ = Math.cos(angleRad) * speedMS;
  }

  // ─── Particle factories ───────────────────────────────────────────────────
  function makeRainParticle(isBlizzard) {
    var w   = isBlizzard ? 0.04 : 0.02;
    var h   = 0.5;
    var d   = isBlizzard ? 0.04 : 0.02;
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshBasicMaterial({
      color:       isBlizzard ? 0xccddff : 0xaaddff,
      transparent: true,
      opacity:     isBlizzard ? 0.85 : 0.6
    });
    return new THREE.Mesh(geo, mat);
  }

  function makeSandParticle() {
    var geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    var mat = new THREE.MeshBasicMaterial({
      color:       0xc2a060,
      transparent: true,
      opacity:     0.75
    });
    return new THREE.Mesh(geo, mat);
  }

  function randomiseParticle(mesh, px, py, pz, isBlizzard, isSand) {
    var spread = isSand ? 30 : 20;
    var height = isSand ? 10 : 15;
    mesh.position.x = px + randRange(-spread, spread);
    mesh.position.y = py + randRange(2, height);
    mesh.position.z = pz + randRange(-spread, spread);
    if (isBlizzard) {
      mesh.rotation.z = randRange(-0.5, 0.5);
    }
  }

  // ─── Particle pool initialisation ────────────────────────────────────────
  function buildParticlePools() {
    rainGroup     = new THREE.Group();
    blizzardGroup = new THREE.Group();
    sandGroup     = new THREE.Group();

    var i, rp, bp, sp;

    for (i = 0; i < 500; i++) {
      rp = makeRainParticle(false);
      randomiseParticle(rp, 0, 0, 0, false, false);
      rainGroup.add(rp);
      rainParticles.push(rp);
    }

    for (i = 0; i < 500; i++) {
      bp = makeRainParticle(true);
      randomiseParticle(bp, 0, 0, 0, true, false);
      blizzardGroup.add(bp);
      blizzardParticles.push(bp);
    }

    for (i = 0; i < 300; i++) {
      sp = makeSandParticle();
      randomiseParticle(sp, 0, 0, 0, false, true);
      sandGroup.add(sp);
      sandParticles.push(sp);
    }

    rainGroup.visible     = false;
    blizzardGroup.visible = false;
    sandGroup.visible     = false;

    if (scene) {
      scene.add(rainGroup);
      scene.add(blizzardGroup);
      scene.add(sandGroup);
    }
  }

  // ─── Puddle factory ───────────────────────────────────────────────────────
  function spawnPuddle(px, py, pz) {
    if (puddles.length >= 5) return;
    var geo  = new THREE.CircleGeometry(0.5, 16);
    var mat  = new THREE.MeshBasicMaterial({
      color:       0x1E3A5F,
      transparent: true,
      opacity:     0.5,
      side:        THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x   = -Math.PI / 2;
    mesh.position.x   = px + randRange(-6, 6);
    mesh.position.y   = py;
    mesh.position.z   = pz + randRange(-6, 6);
    mesh.userData.age = 0;
    if (scene) scene.add(mesh);
    puddles.push(mesh);
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────
  function buildHUD() {
    if (typeof document === 'undefined') return;
    hudEl = document.createElement('div');
    hudEl.id = 'weather-hud';
    hudEl.style.position      = 'fixed';
    hudEl.style.top           = '12px';
    hudEl.style.left          = '50%';
    hudEl.style.transform     = 'translateX(-50%)';
    hudEl.style.background    = 'rgba(0,0,0,0.45)';
    hudEl.style.color         = '#fff';
    hudEl.style.font          = 'bold 13px/1.4 monospace';
    hudEl.style.padding       = '4px 12px';
    hudEl.style.borderRadius  = '6px';
    hudEl.style.pointerEvents = 'none';
    hudEl.style.zIndex        = '9999';
    hudEl.style.letterSpacing = '0.04em';
    hudEl.style.whiteSpace    = 'nowrap';
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    var icon = weatherIcon(currentWeather);
    hudEl.textContent = icon + ' ' + currentWeather + ' — Wind ' + windDirName() + ' ' + Math.round(windSpeed) + ' kph';
  }

  // ─── Audio (thunder boom) ─────────────────────────────────────────────────
  function ensureAudioCtx() {
    if (audioCtx) return;
    if (typeof AudioContext !== 'undefined') {
      audioCtx = new AudioContext();
    } else if (typeof window !== 'undefined' && window.webkitAudioContext) {
      audioCtx = new window.webkitAudioContext();
    }
  }

  function playThunderBoom() {
    ensureAudioCtx();
    if (!audioCtx) return;
    var duration = 1.8;
    var osc      = audioCtx.createOscillator();
    var gain     = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ─── Particle group visibility ────────────────────────────────────────────
  function isRainActive() {
    return currentWeather === WEATHER_TYPES.RAIN || currentWeather === WEATHER_TYPES.THUNDERSTORM;
  }

  function groupForWeather(type) {
    if (type === WEATHER_TYPES.RAIN || type === WEATHER_TYPES.THUNDERSTORM) return rainGroup;
    if (type === WEATHER_TYPES.BLIZZARD)  return blizzardGroup;
    if (type === WEATHER_TYPES.SANDSTORM) return sandGroup;
    return null;
  }

  function showOnlyGroup(grp) {
    if (rainGroup)     rainGroup.visible     = (rainGroup     === grp);
    if (blizzardGroup) blizzardGroup.visible = (blizzardGroup === grp);
    if (sandGroup)     sandGroup.visible     = (sandGroup     === grp);
  }

  // ─── Transition control ───────────────────────────────────────────────────
  function beginTransition(newType) {
    if (newType === targetWeather) return;
    targetWeather      = newType;
    transitionProgress = 0.0;
  }

  function randomNextWeather() {
    var types = ['CLEAR', 'FOG', 'RAIN', 'BLIZZARD', 'SANDSTORM', 'THUNDERSTORM'];
    var idx   = randInt(0, types.length - 1);
    beginTransition(types[idx]);
  }

  // ─── Lightning flash trigger ──────────────────────────────────────────────
  function triggerLightningFlash() {
    isFlashing = true;
    flashTimer = 0;
    if (ambientLight) ambientLight.intensity = 3.0;
  }

  // ─── init ─────────────────────────────────────────────────────────────────
  function init(threeScene, threeCamera, playerObj, ambLight) {
    scene        = threeScene;
    camera       = threeCamera;
    player       = playerObj;
    ambientLight = ambLight || null;

    if (scene && !scene.fog) {
      scene.fog = new THREE.FogExp2(0x88aacc, FOG_DENSITY.CLEAR);
    }

    windDirIndex = randInt(0, 7);
    windSpeed    = randRange(4, 20);
    updateWindVector();

    buildParticlePools();
    buildHUD();
    updateHUD();

    cycleInterval   = randRange(90, 180);
    cycleTimer      = 0;
    thunderInterval = randRange(15, 40);
    thunderTimer    = 0;
  }

  // ─── update (call every frame, dt = seconds since last frame) ────────────
  function update(dt) {
    if (!scene) return;

    var px = (player && player.position) ? player.position.x : 0;
    var py = (player && player.position) ? player.position.y : 0;
    var pz = (player && player.position) ? player.position.z : 0;

    // ── Weather cycle timer ──────────────────────────────────────────────
    cycleTimer += dt;
    if (cycleTimer >= cycleInterval) {
      cycleTimer    = 0;
      cycleInterval = randRange(90, 180);
      windDirIndex  = randInt(0, 7);
      windSpeed     = randRange(4, 30);
      updateWindVector();
      randomNextWeather();
    }

    // ── Smooth weather transition ────────────────────────────────────────
    if (transitionProgress < 1.0) {
      transitionProgress += dt / transitionDuration;
      if (transitionProgress >= 1.0) {
        transitionProgress = 1.0;
        currentWeather     = targetWeather;
        applyTacticalEffects(currentWeather);
        updateHUD();
      }

      var fromDensity = FOG_DENSITY[currentWeather]  || FOG_DENSITY.CLEAR;
      var toDensity   = FOG_DENSITY[targetWeather]   || FOG_DENSITY.CLEAR;
      if (scene.fog && scene.fog.density !== undefined) {
        scene.fog.density = fromDensity + (toDensity - fromDensity) * transitionProgress;
      }

      showOnlyGroup(groupForWeather(targetWeather));
    }

    // ── Thunder (THUNDERSTORM) ───────────────────────────────────────────
    if (currentWeather === WEATHER_TYPES.THUNDERSTORM || targetWeather === WEATHER_TYPES.THUNDERSTORM) {
      thunderTimer += dt;
      if (thunderTimer >= thunderInterval) {
        thunderTimer    = 0;
        thunderInterval = randRange(15, 40);
        triggerLightningFlash();
        playThunderBoom();
      }
    }

    // ── Flash decay ──────────────────────────────────────────────────────
    if (isFlashing) {
      flashTimer += dt;
      var t = flashTimer / FLASH_DURATION;
      if (t >= 1.0) {
        isFlashing = false;
        if (ambientLight) ambientLight.intensity = 0.3;
      } else {
        var intensity;
        if (t < 0.1) {
          intensity = 0.3 + (3.0 - 0.3) * (t / 0.1);
        } else {
          intensity = 3.0 - (3.0 - 0.3) * ((t - 0.1) / 0.9);
        }
        if (ambientLight) ambientLight.intensity = intensity;
      }
    }

    // ── Particle updates ─────────────────────────────────────────────────
    updateRainParticles(dt, px, py, pz);
    updateBlizzardParticles(dt, px, py, pz);
    updateSandParticles(dt, px, py, pz);

    // ── Puddle spawning & aging ──────────────────────────────────────────
    updatePuddles(dt, px, py, pz);
  }

  // ─── Rain particle update ─────────────────────────────────────────────────
  function updateRainParticles(dt, px, py, pz) {
    if (!rainGroup || !rainGroup.visible) return;
    var fallSpeed = 14;
    var wx = windVecX * 0.5;
    var wz = windVecZ * 0.5;
    var i, p;
    for (i = 0; i < rainParticles.length; i++) {
      p = rainParticles[i];
      p.position.y -= fallSpeed * dt;
      p.position.x += wx * dt;
      p.position.z += wz * dt;
      if (p.position.y < py - 2 || Math.abs(p.position.x - px) > 22 || Math.abs(p.position.z - pz) > 22) {
        randomiseParticle(p, px, py, pz, false, false);
      }
    }
  }

  // ─── Blizzard particle update ─────────────────────────────────────────────
  function updateBlizzardParticles(dt, px, py, pz) {
    if (!blizzardGroup || !blizzardGroup.visible) return;
    var fallSpeed = 5;
    var wx = windVecX * 0.8;
    var wz = windVecZ * 0.8;
    var i, p;
    for (i = 0; i < blizzardParticles.length; i++) {
      p = blizzardParticles[i];
      p.position.y -= fallSpeed * dt;
      p.position.x += (wx + Math.sin(p.position.y * 0.5) * 0.5) * dt;
      p.position.z += (wz + Math.cos(p.position.x * 0.5) * 0.5) * dt;
      if (p.position.y < py - 2 || Math.abs(p.position.x - px) > 22 || Math.abs(p.position.z - pz) > 22) {
        randomiseParticle(p, px, py, pz, true, false);
      }
    }
  }

  // ─── Sandstorm particle update ────────────────────────────────────────────
  function updateSandParticles(dt, px, py, pz) {
    if (!sandGroup || !sandGroup.visible) return;
    var swirlSpeed = 2.5;
    var now = Date.now() * 0.001;
    var i, p, dx, dz, dist, angle;
    for (i = 0; i < sandParticles.length; i++) {
      p  = sandParticles[i];
      dx = p.position.x - px;
      dz = p.position.z - pz;
      dist  = Math.sqrt(dx * dx + dz * dz);
      angle = Math.atan2(dz, dx);

      p.position.x += (-Math.sin(angle) * swirlSpeed + windVecX) * dt;
      p.position.z += ( Math.cos(angle) * swirlSpeed + windVecZ) * dt;
      p.position.y += Math.sin(now + i) * 0.5 * dt;

      if (p.position.y < py - 1 || p.position.y > py + 10 || dist > 32) {
        randomiseParticle(p, px, py, pz, false, true);
      }
    }
  }

  // ─── Puddle update ────────────────────────────────────────────────────────
  function updatePuddles(dt, px, py, pz) {
    if (isRainActive()) {
      puddleTimer += dt;
      if (puddleTimer > 8 && puddles.length < 5) {
        puddleTimer = 0;
        spawnPuddle(px, py, pz);
      }
    }

    var i, p, lifeRatio;
    for (i = puddles.length - 1; i >= 0; i--) {
      p = puddles[i];
      p.userData.age += dt;
      lifeRatio = p.userData.age / PUDDLE_LIFETIME;
      if (lifeRatio >= 1.0) {
        if (scene) scene.remove(p);
        if (p.geometry) p.geometry.dispose();
        if (p.material) p.material.dispose();
        puddles.splice(i, 1);
      } else if (lifeRatio > 0.8) {
        p.material.opacity = 0.5 * (1.0 - (lifeRatio - 0.8) / 0.2);
      }
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  function setWeather(type) {
    if (!WEATHER_TYPES[type]) return;
    beginTransition(type);
  }

  function getCurrentWeather() {
    return {
      type:               currentWeather,
      windDir:            windDirName(),
      windSpeed:          Math.round(windSpeed),
      visibility:         playerVisionMult,
      enemyVision:        enemyVisionMult,
      weaponJamChance:    weaponJamChance,
      radioJammed:        radioJammed,
      staminaWindPenalty: staminaWindPenalty
    };
  }

  function reset() {
    var i, p;
    for (i = 0; i < puddles.length; i++) {
      p = puddles[i];
      if (scene) scene.remove(p);
      if (p.geometry) p.geometry.dispose();
      if (p.material) p.material.dispose();
    }
    puddles     = [];
    puddleTimer = 0;

    if (rainGroup)     rainGroup.visible     = false;
    if (blizzardGroup) blizzardGroup.visible = false;
    if (sandGroup)     sandGroup.visible     = false;

    currentWeather     = WEATHER_TYPES.CLEAR;
    targetWeather      = WEATHER_TYPES.CLEAR;
    transitionProgress = 1.0;

    if (scene && scene.fog && scene.fog.density !== undefined) {
      scene.fog.density = FOG_DENSITY.CLEAR;
    }
    if (ambientLight) ambientLight.intensity = 0.3;

    isFlashing      = false;
    flashTimer      = 0;
    thunderTimer    = 0;
    thunderInterval = randRange(15, 40);
    cycleTimer      = 0;
    cycleInterval   = randRange(90, 180);

    applyTacticalEffects(WEATHER_TYPES.CLEAR);
    updateHUD();
  }

  return {
    WEATHER_TYPES:     WEATHER_TYPES,
    init:              init,
    update:            update,
    setWeather:        setWeather,
    getCurrentWeather: getCurrentWeather,
    reset:             reset
  };

})();
