/**
 * night-vision.js — Night Vision Goggles, Dynamic Lighting & Stealth Darkness
 *
 * Public API: NightVision.init(scene, camera), .update(delta),
 *             .activateNVG(), .deactivateNVG(), .isNight(), .reset()
 *
 * Night cycle: every 4 real minutes → 60s dusk → night → 60s dawn → day, repeat
 * NVG toggle: N key (green phosphor, CSS filter on canvas)
 * Thermal: Alt+N (enemy heat blobs, terrain dark blue)
 * Flare gun: F+LMB with flare selected
 * Battery: 90s per charge, flickers at ≤10s, goes dark at 0
 */
window.NightVision = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var CYCLE_DAY_DURATION    = 4 * 60;   // 4 real minutes of day before dusk
  var DUSK_DURATION         = 60;        // 60s dusk transition
  var DAWN_DURATION         = 60;        // 60s dawn transition
  var NIGHT_DURATION        = 120;       // 2 minutes of pure night before dawn

  var NVG_BATTERY_MAX       = 90;        // seconds
  var NVG_FLICKER_THRESHOLD = 10;        // seconds remaining before flicker
  var NVG_FLICKER_INTERVAL  = 0.08;     // seconds per flicker toggle
  var THERMAL_BATTERY_MAX   = 60;        // seconds for thermal mode

  var NIGHT_FOG_NEAR        = 3;
  var NIGHT_AMBIENT_INT     = 0.05;
  var MOON_COLOR            = 0x6688cc; // cold blue
  var MOON_INTENSITY        = 0.15;

  var ENEMY_NIGHT_DETECT    = 8;         // units (down from 20 day)
  var FLARE_BURN_TIME       = 20;        // seconds
  var FLARE_LIGHT_INTENSITY = 2.0;
  var FLARE_LIGHT_RADIUS    = 60;
  var FLARE_EXPOSE_RADIUS   = 30;

  // Phase names
  var PHASE_DAY   = 'day';
  var PHASE_DUSK  = 'dusk';
  var PHASE_NIGHT = 'night';
  var PHASE_DAWN  = 'dawn';

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene         = null;
  var _camera        = null;
  var _canvas        = null;

  // Cycle
  var _cycleTimer    = 0;
  var _phase         = PHASE_DAY;
  var _nightDepth    = 0;  // 0=full day, 1=full night

  // Scene lighting
  var _moonLight     = null;
  var _savedAmbient  = null;
  var _origFogNear   = null;
  var _origFogFar    = null;

  // Environment lights (campfires, etc.)
  var _sceneLights   = [];

  // NVG
  var _nvgActive       = false;
  var _nvgBattery      = NVG_BATTERY_MAX;
  var _nvgFlickerTimer = 0;
  var _nvgFlickerState = true;
  var _nvgDead         = false;

  // Thermal
  var _thermalActive  = false;
  var _thermalBattery = THERMAL_BATTERY_MAX;

  // Flares
  var _flareCount    = 2;
  var _activeFlares  = [];
  var _holdingFlare  = false;

  // DOM
  var _hudEl         = null;
  var _vignetteEl    = null;
  var _noiseCanvas   = null;
  var _noiseCtx      = null;
  var _noiseAnim     = null;
  var _compassEl     = null;
  var _todBarEl      = null;
  var _battBarFillEl = null;
  var _flareCountEl  = null;

  // Battery pickup meshes
  var _batteryPickups = [];

  // ── Utilities ──────────────────────────────────────────────────────────────
  function _clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function _lerp(a, b, t) { t = _clamp(t, 0, 1); return a + (b - a) * t; }

  function _getCanvas() {
    if (_canvas) return _canvas;
    try {
      var renderer = window.__renderer || window._renderer;
      if (renderer && renderer.domElement) { _canvas = renderer.domElement; return _canvas; }
      _canvas = document.querySelector('canvas');
    } catch (e) {}
    return _canvas;
  }

  function _getAmbient() {
    return window.__ambientLight || window._ambientLight || null;
  }

  function _getEnemies() {
    if (window.Enemies && window.Enemies.list) return window.Enemies.list;
    if (window._enemies) return window._enemies;
    if (window.GameState && window.GameState.enemies) return window.GameState.enemies;
    return [];
  }

  // ── CSS Styles injection ───────────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('nv-style')) return;
    var s = document.createElement('style');
    s.id = 'nv-style';
    s.textContent = [
      '@keyframes nvNoise {',
      '  0%   { transform: translate(0,0); }',
      '  10%  { transform: translate(-3px, 2px); }',
      '  20%  { transform: translate(2px,-1px); }',
      '  30%  { transform: translate(-1px, 3px); }',
      '  40%  { transform: translate(3px,-2px); }',
      '  50%  { transform: translate(-2px, 1px); }',
      '  60%  { transform: translate(1px,-3px); }',
      '  70%  { transform: translate(-3px, 2px); }',
      '  80%  { transform: translate(2px, 0px); }',
      '  90%  { transform: translate(-1px,-2px); }',
      '  100% { transform: translate(0,0); }',
      '}',
      '#nv-vignette {',
      '  position:fixed; top:0; left:0; width:100vw; height:100vh;',
      '  pointer-events:none; z-index:990; display:none;',
      '  background: radial-gradient(ellipse at 50% 50%,',
      '    transparent 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.95) 100%);',
      '}',
      '#nv-noise {',
      '  position:fixed; top:-10px; left:-10px;',
      '  width:calc(100vw + 20px); height:calc(100vh + 20px);',
      '  pointer-events:none; z-index:991; display:none; opacity:0.08;',
      '  animation: nvNoise 0.07s steps(1) infinite;',
      '}',
      '#nv-compass {',
      '  position:fixed; top:10px; left:50%; transform:translateX(-50%);',
      '  color:#00ff44; font-family:monospace; font-size:14px; font-weight:bold;',
      '  text-shadow:0 0 6px #00ff44; pointer-events:none; z-index:995;',
      '  display:none; background:rgba(0,0,0,0.5); padding:2px 10px; border-radius:4px;',
      '}',
      '#nv-hud {',
      '  position:fixed; bottom:16px; right:16px;',
      '  color:#00ff44; font-family:monospace; font-size:12px; font-weight:bold;',
      '  text-shadow:0 0 5px #00ff44; pointer-events:none; z-index:995; display:none;',
      '}',
      '#nv-tod-bar {',
      '  position:fixed; bottom:16px; left:50%; transform:translateX(-50%);',
      '  width:120px; height:12px; background:rgba(0,0,0,0.5);',
      '  border:1px solid rgba(255,255,255,0.2); border-radius:6px;',
      '  pointer-events:none; z-index:994; overflow:hidden;',
      '}',
      '#nv-tod-fill {',
      '  height:100%; width:0%;',
      '  background: linear-gradient(to right, #001133, #334499, #ccccff);',
      '  transition: width 1s linear;',
      '}',
      '#nv-batt-bar {',
      '  display:inline-block; width:60px; height:8px;',
      '  background:rgba(0,0,0,0.5); border:1px solid #00ff44;',
      '  border-radius:3px; overflow:hidden; vertical-align:middle;',
      '}',
      '#nv-batt-fill {',
      '  height:100%; width:100%; background:#00ff44;',
      '  transition: width 0.5s;',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── DOM creation ───────────────────────────────────────────────────────────
  function _createDOM() {
    _injectStyles();

    // Vignette (circular mask around edges)
    _vignetteEl = document.createElement('div');
    _vignetteEl.id = 'nv-vignette';
    document.body.appendChild(_vignetteEl);

    // Animated static noise canvas
    _noiseCanvas = document.createElement('canvas');
    _noiseCanvas.id = 'nv-noise';
    _noiseCanvas.width = 256;
    _noiseCanvas.height = 256;
    document.body.appendChild(_noiseCanvas);
    try { _noiseCtx = _noiseCanvas.getContext('2d'); } catch (e) {}

    // Compass bearing (top-center)
    _compassEl = document.createElement('div');
    _compassEl.id = 'nv-compass';
    _compassEl.textContent = 'N 000';
    document.body.appendChild(_compassEl);

    // HUD: NVG icon + battery bar + flare count
    _hudEl = document.createElement('div');
    _hudEl.id = 'nv-hud';
    _hudEl.innerHTML = [
      '<span>&#128083;</span>',
      ' <span id="nv-batt-bar"><span id="nv-batt-fill"></span></span>',
      ' <span id="nv-batt-secs">90s</span>',
      '<br>',
      '&#10023; <span id="nv-flare-count">x2</span>'
    ].join('');
    document.body.appendChild(_hudEl);
    _battBarFillEl = document.getElementById('nv-batt-fill');
    _flareCountEl  = document.getElementById('nv-flare-count');

    // Time-of-day mini arc bar
    var todWrap = document.createElement('div');
    todWrap.id = 'nv-tod-bar';
    var todFill = document.createElement('div');
    todFill.id = 'nv-tod-fill';
    todWrap.appendChild(todFill);
    document.body.appendChild(todWrap);
    _todBarEl = todFill;
  }

  // ── Noise animation ────────────────────────────────────────────────────────
  function _drawNoise() {
    if (!_noiseCtx) return;
    var w = _noiseCanvas.width;
    var h = _noiseCanvas.height;
    var imgData = _noiseCtx.createImageData(w, h);
    var d = imgData.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      d[i]   = v;
      d[i+1] = v;
      d[i+2] = v;
      d[i+3] = 255;
    }
    _noiseCtx.putImageData(imgData, 0, 0);
  }

  function _startNoise() {
    if (_noiseAnim) return;
    _noiseAnim = setInterval(_drawNoise, 50);
  }

  function _stopNoise() {
    if (_noiseAnim) { clearInterval(_noiseAnim); _noiseAnim = null; }
  }

  // ── Canvas CSS filter (green phosphor NVG look) ────────────────────────────
  function _applyNVGFilter(on) {
    var c = _getCanvas();
    if (!c) return;
    if (on) {
      c.style.filter = 'sepia(1) hue-rotate(90deg) saturate(4) brightness(2.5)';
      c.style.transition = 'filter 0.3s';
    } else {
      c.style.filter = '';
      c.style.transition = 'filter 0.3s';
    }
  }

  function _applyThermalFilter(on) {
    var c = _getCanvas();
    if (!c) return;
    if (on) {
      c.style.filter = 'invert(1) sepia(1) hue-rotate(200deg) saturate(3) brightness(0.6)';
      c.style.transition = 'filter 0.3s';
    } else {
      c.style.filter = '';
      c.style.transition = 'filter 0.3s';
    }
  }

  // ── Compass bearing ────────────────────────────────────────────────────────
  function _updateCompass() {
    if (!_compassEl || !_camera) return;
    try {
      var dir = new THREE.Vector3(0, 0, -1);
      dir.applyQuaternion(_camera.quaternion);
      var bearing = (Math.atan2(dir.x, dir.z) * 180 / Math.PI + 360) % 360;
      var deg = Math.round(bearing);
      var dirs = ['N','NE','E','SE','S','SW','W','NW'];
      var label = dirs[Math.round(deg / 45) % 8];
      var pad = deg < 10 ? '00' : deg < 100 ? '0' : '';
      _compassEl.textContent = label + ' ' + pad + deg + '°';
    } catch (e) {}
  }

  // ── HUD update ─────────────────────────────────────────────────────────────
  function _updateHUD() {
    if (!_hudEl) return;
    var battSecs = _thermalActive ? _thermalBattery : _nvgBattery;
    var battMax  = _thermalActive ? THERMAL_BATTERY_MAX : NVG_BATTERY_MAX;
    var battPct  = _clamp(battSecs / battMax, 0, 1) * 100;

    var secEl = document.getElementById('nv-batt-secs');
    if (secEl) secEl.textContent = Math.ceil(battSecs) + 's';
    if (_battBarFillEl) {
      _battBarFillEl.style.width = battPct.toFixed(1) + '%';
      _battBarFillEl.style.background = battPct > 40 ? '#00ff44' : battPct > 15 ? '#ffcc00' : '#ff2222';
    }
    if (_flareCountEl) _flareCountEl.textContent = 'x' + _flareCount;
  }

  // ── Time-of-day bar ────────────────────────────────────────────────────────
  function _updateTODBar() {
    if (!_todBarEl) return;
    var phasePct = 0;
    if (_phase === PHASE_DAY) {
      phasePct = _clamp(_cycleTimer / CYCLE_DAY_DURATION, 0, 1);
      _todBarEl.style.background = 'linear-gradient(to right, #ffe066, #ff8800)';
    } else if (_phase === PHASE_DUSK) {
      phasePct = _clamp(_cycleTimer / DUSK_DURATION, 0, 1);
      _todBarEl.style.background = 'linear-gradient(to right, #ff8800, #110022)';
    } else if (_phase === PHASE_NIGHT) {
      phasePct = _clamp(_cycleTimer / NIGHT_DURATION, 0, 1);
      _todBarEl.style.background = 'linear-gradient(to right, #001133, #334499)';
    } else if (_phase === PHASE_DAWN) {
      phasePct = _clamp(_cycleTimer / DAWN_DURATION, 0, 1);
      _todBarEl.style.background = 'linear-gradient(to right, #334499, #ff8800)';
    }
    _todBarEl.style.width = (phasePct * 100).toFixed(1) + '%';
  }

  // ── Moon light ─────────────────────────────────────────────────────────────
  function _addMoonLight() {
    if (_moonLight || !_scene) return;
    try {
      _moonLight = new THREE.DirectionalLight(MOON_COLOR, MOON_INTENSITY);
      _moonLight.name = '__nvMoonLight';
      _moonLight.position.set(-50, 80, -30);
      _scene.add(_moonLight);
    } catch (e) {}
  }

  function _removeMoonLight() {
    if (!_moonLight || !_scene) return;
    try {
      _scene.remove(_moonLight);
      _moonLight = null;
    } catch (e) {}
  }

  // ── Fog helpers ────────────────────────────────────────────────────────────
  function _saveOrigFog() {
    if (!_scene || !_scene.fog) return;
    if (_origFogNear === null) _origFogNear = _scene.fog.near;
    if (_origFogFar  === null) _origFogFar  = _scene.fog.far;
  }

  function _restoreFog() {
    if (!_scene || !_scene.fog) return;
    if (_origFogNear !== null) _scene.fog.near = _origFogNear;
    if (_origFogFar  !== null) _scene.fog.far  = _origFogFar;
  }

  // ── Ambient helpers ────────────────────────────────────────────────────────
  function _saveAmbient() {
    if (_savedAmbient) return;
    var amb = _getAmbient();
    if (amb) _savedAmbient = { intensity: amb.intensity };
  }

  function _restoreAmbient() {
    var amb = _getAmbient();
    if (amb && _savedAmbient) {
      amb.intensity = _savedAmbient.intensity;
    }
    _savedAmbient = null;
  }

  // ── Dusk/Dawn lerp toward night ────────────────────────────────────────────
  function _lerpTowardNight(t) {
    try {
      if (_scene && _scene.fog && _origFogNear !== null) {
        _scene.fog.near = _lerp(_origFogNear, NIGHT_FOG_NEAR, t);
      }
    } catch (e) {}
    try {
      var amb = _getAmbient();
      if (amb && _savedAmbient) {
        amb.intensity = _lerp(_savedAmbient.intensity, NIGHT_AMBIENT_INT, t);
      }
    } catch (e) {}
  }

  // ── Phase transitions ──────────────────────────────────────────────────────
  function _enterDusk() {
    _phase = PHASE_DUSK;
    _cycleTimer = 0;
    _saveAmbient();
    _saveOrigFog();
    try { if (window.HUD && HUD.showToast) HUD.showToast('DUSK APPROACHING', 3000, '#ff8800'); } catch (e) {}
  }

  function _enterNight() {
    _phase = PHASE_NIGHT;
    _cycleTimer = 0;
    _nightDepth = 1;
    try { if (_scene && _scene.fog) _scene.fog.near = NIGHT_FOG_NEAR; } catch (e) {}
    var amb = _getAmbient();
    if (amb) amb.intensity = NIGHT_AMBIENT_INT;
    _addMoonLight();
    try { if (window.HUD && HUD.showToast) HUD.showToast('NIGHT FALLS', 3000, '#aaaaff'); } catch (e) {}
  }

  function _enterDawn() {
    _phase = PHASE_DAWN;
    _cycleTimer = 0;
    _removeMoonLight();
    try { if (window.HUD && HUD.showToast) HUD.showToast('DAWN BREAKING', 3000, '#ffbb44'); } catch (e) {}
  }

  function _enterDay() {
    _phase = PHASE_DAY;
    _cycleTimer = 0;
    _nightDepth = 0;
    _restoreFog();
    _restoreAmbient();
    try { if (window.HUD && HUD.showToast) HUD.showToast('DAY', 2000, '#ffe066'); } catch (e) {}
  }

  function _updateCycle(dt) {
    _cycleTimer += dt;

    if (_phase === PHASE_DAY) {
      _nightDepth = 0;
      if (_cycleTimer >= CYCLE_DAY_DURATION) _enterDusk();

    } else if (_phase === PHASE_DUSK) {
      _nightDepth = _clamp(_cycleTimer / DUSK_DURATION, 0, 1);
      _lerpTowardNight(_nightDepth);
      if (_cycleTimer >= DUSK_DURATION) _enterNight();

    } else if (_phase === PHASE_NIGHT) {
      _nightDepth = 1;
      if (_cycleTimer >= NIGHT_DURATION) _enterDawn();

    } else if (_phase === PHASE_DAWN) {
      _nightDepth = _clamp(1 - _cycleTimer / DAWN_DURATION, 0, 1);
      _lerpTowardNight(_nightDepth);
      if (_cycleTimer >= DAWN_DURATION) _enterDay();
    }
  }

  // ── Enemy AI night modifiers ───────────────────────────────────────────────
  function _applyEnemyNightModifiers(nightNow) {
    window._nvEnemyDetectRange  = nightNow ? ENEMY_NIGHT_DETECT : 20;
    window._nvEnemyReactionMult = nightNow ? 2.5 : 1.0;
  }

  // ── Thermal enemy highlighting ─────────────────────────────────────────────
  function _applyThermalEnemies(enable) {
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      try {
        e.traverse(function (node) {
          if (node.isMesh && node.material) {
            if (enable) {
              node._preThermEmissive = node.material.emissive
                ? node.material.emissive.clone()
                : new THREE.Color(0x000000);
              node.material.emissive = new THREE.Color(0xffffff);
              node.material.emissiveIntensity = 1.0;
            } else {
              if (node._preThermEmissive) {
                node.material.emissive.copy(node._preThermEmissive);
                node.material.emissiveIntensity = 0;
                node._preThermEmissive = null;
              }
            }
          }
        });
      } catch (ex) {}
    }
  }

  // ── NVG activate / deactivate ──────────────────────────────────────────────
  function activateNVG() {
    if (_thermalActive) deactivateThermal();
    if (_nvgBattery <= 0) return;
    _nvgActive = true;
    window._nvgActive = true;
    _applyNVGFilter(true);
    if (_vignetteEl) _vignetteEl.style.display = 'block';
    if (_noiseCanvas) _noiseCanvas.style.display = 'block';
    if (_compassEl)   _compassEl.style.display   = 'block';
    if (_hudEl)       _hudEl.style.display        = 'block';
    _startNoise();
    _nvgDead = false;
  }

  function deactivateNVG() {
    _nvgActive = false;
    window._nvgActive = false;
    _applyNVGFilter(false);
    if (_vignetteEl) _vignetteEl.style.display = 'none';
    if (_noiseCanvas) _noiseCanvas.style.display = 'none';
    if (_compassEl)   _compassEl.style.display   = 'none';
    if (_hudEl)       _hudEl.style.display        = 'none';
    _stopNoise();
  }

  function activateThermal() {
    if (_nvgActive) deactivateNVG();
    _thermalActive = true;
    window._thermalActive = true;
    _applyThermalFilter(true);
    _applyThermalEnemies(true);
    if (_vignetteEl) _vignetteEl.style.display = 'block';
    if (_hudEl)       _hudEl.style.display        = 'block';
  }

  function deactivateThermal() {
    _thermalActive = false;
    window._thermalActive = false;
    _applyThermalFilter(false);
    _applyThermalEnemies(false);
    if (_vignetteEl) _vignetteEl.style.display = 'none';
    if (_hudEl)       _hudEl.style.display        = 'none';
  }

  function _nvgDie() {
    _nvgDead = true;
    deactivateNVG();
    try { if (window.HUD && HUD.showToast) HUD.showToast('NVG BATTERY DEAD', 2500, '#ff2222'); } catch (e) {}
  }

  // ── Battery drain ──────────────────────────────────────────────────────────
  function _updateNVGBattery(dt) {
    if (_nvgActive) {
      _nvgBattery -= dt;
      if (_nvgBattery < 0) _nvgBattery = 0;
      if (_nvgBattery <= 0) { _nvgDie(); return; }

      // Flicker at low battery
      if (_nvgBattery <= NVG_FLICKER_THRESHOLD) {
        _nvgFlickerTimer += dt;
        if (_nvgFlickerTimer >= NVG_FLICKER_INTERVAL) {
          _nvgFlickerTimer = 0;
          _nvgFlickerState = !_nvgFlickerState;
          var c = _getCanvas();
          if (c) {
            c.style.filter = _nvgFlickerState
              ? 'sepia(1) hue-rotate(90deg) saturate(4) brightness(2.5)'
              : 'sepia(1) hue-rotate(90deg) saturate(1) brightness(0.3)';
          }
        }
      }
    }

    if (_thermalActive) {
      _thermalBattery -= dt;
      if (_thermalBattery < 0) _thermalBattery = 0;
      if (_thermalBattery <= 0) {
        deactivateThermal();
        try { if (window.HUD && HUD.showToast) HUD.showToast('THERMAL BATTERY DEAD', 2500, '#ff2222'); } catch (e) {}
      }
    }
  }

  // ── Battery pickup spawning / collection ───────────────────────────────────
  function _spawnBatteryPickup(x, y, z) {
    if (!_scene) return;
    try {
      var geo  = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 10);
      var mat  = new THREE.MeshStandardMaterial({ color: 0xffee00, emissive: 0xffaa00, emissiveIntensity: 0.7 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x || 0, y || 0.5, z || 0);
      mesh.name = '__nvBatteryPickup';
      var glow = new THREE.PointLight(0xffee00, 1.0, 4);
      glow.position.set(0, 0.5, 0);
      mesh.add(glow);
      _scene.add(mesh);
      _batteryPickups.push({ mesh: mesh, light: glow });
    } catch (e) {}
  }

  function _checkBatteryPickups() {
    if (!_camera || !_batteryPickups.length) return;
    var camPos = _camera.position;
    for (var i = _batteryPickups.length - 1; i >= 0; i--) {
      var bp = _batteryPickups[i];
      if (!bp || !bp.mesh) continue;
      try {
        var dx = bp.mesh.position.x - camPos.x;
        var dy = bp.mesh.position.y - camPos.y;
        var dz = bp.mesh.position.z - camPos.z;
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 1.5) {
          _nvgBattery = NVG_BATTERY_MAX;
          _nvgDead = false;
          _scene.remove(bp.mesh);
          try { bp.mesh.geometry.dispose(); } catch (ex) {}
          try { bp.mesh.material.dispose(); } catch (ex) {}
          _batteryPickups.splice(i, 1);
          try { if (window.HUD && HUD.showToast) HUD.showToast('NVG BATTERY RECHARGED', 2000, '#ffee00'); } catch (ex) {}
        }
      } catch (ex) {}
    }
  }

  // ── Campfire light spawning ────────────────────────────────────────────────
  function _spawnCampfire(x, y, z) {
    if (!_scene) return;
    try {
      var geo  = new THREE.CylinderGeometry(0.3, 0.5, 0.3, 8);
      var mat  = new THREE.MeshStandardMaterial({ color: 0x332211, emissive: 0xff4400, emissiveIntensity: 0.8 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x || 0, y || 0, z || 0);
      mesh.name = '__nvCampfire';
      var light = new THREE.PointLight(0xff6600, 1.5, 14);
      light.position.set(0, 1, 0);
      mesh.add(light);
      _scene.add(mesh);
      _sceneLights.push({ mesh: mesh, light: light });
    } catch (e) {}
  }

  function _flickerSceneLights(dt) {
    var t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
    for (var i = 0; i < _sceneLights.length; i++) {
      var sl = _sceneLights[i];
      if (!sl || !sl.light) continue;
      try {
        sl.light.intensity = 1.3 + Math.sin(t * 8 + i * 1.7) * 0.4 + (Math.random() - 0.5) * 0.2;
      } catch (e) {}
    }
  }

  // ── Flare gun ──────────────────────────────────────────────────────────────
  function _launchFlare() {
    if (_flareCount <= 0) {
      try { if (window.HUD && HUD.showToast) HUD.showToast('NO FLARES', 1500, '#ff4400'); } catch (e) {}
      return;
    }
    if (!_scene || !_camera) return;
    _flareCount--;

    try {
      var geo  = new THREE.SphereGeometry(0.1, 6, 6);
      var mat  = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff8800, emissiveIntensity: 2 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(_camera.position);

      var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
      var vel = new THREE.Vector3(fwd.x * 4, 8, fwd.z * 4);

      var flareLight = new THREE.PointLight(0xff6600, 0, FLARE_LIGHT_RADIUS);
      mesh.add(flareLight);
      _scene.add(mesh);

      _activeFlares.push({
        mesh:       mesh,
        light:      flareLight,
        vel:        vel,
        phase:      'arc',
        burnTimer:  0,
        parachuted: false
      });
    } catch (e) {}
  }

  function _exposeEnemiesInRadius(pos, radius) {
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      try {
        var dx = e.position.x - pos.x;
        var dy = e.position.y - pos.y;
        var dz = e.position.z - pos.z;
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < radius) {
          e._flareExposed = true;
          e._flareExposeTimer = 3;
        }
      } catch (ex) {}
    }
  }

  function _updateFlares(dt) {
    for (var i = _activeFlares.length - 1; i >= 0; i--) {
      var fl = _activeFlares[i];
      if (!fl || !fl.mesh) { _activeFlares.splice(i, 1); continue; }

      try {
        if (fl.phase === 'arc') {
          fl.vel.y -= 9.8 * dt * 0.5;
          fl.mesh.position.x += fl.vel.x * dt;
          fl.mesh.position.y += fl.vel.y * dt;
          fl.mesh.position.z += fl.vel.z * dt;

          if (fl.vel.y < 0 && !fl.parachuted) {
            fl.phase = 'parachute';
            fl.parachuted = true;
            fl.vel.set(0, -0.5, 0);
            fl.light.intensity = FLARE_LIGHT_INTENSITY;
          }

        } else if (fl.phase === 'parachute') {
          fl.mesh.position.y += fl.vel.y * dt;
          fl.burnTimer += dt;
          fl.light.intensity = FLARE_LIGHT_INTENSITY * (0.85 + Math.random() * 0.3);
          _exposeEnemiesInRadius(fl.mesh.position, FLARE_EXPOSE_RADIUS);

          if (fl.burnTimer >= FLARE_BURN_TIME) {
            fl.phase = 'dead';
          }

        } else {
          _scene.remove(fl.mesh);
          try { fl.mesh.geometry.dispose(); } catch (ex) {}
          try { fl.mesh.material.dispose(); } catch (ex) {}
          _activeFlares.splice(i, 1);
        }
      } catch (ex) {}
    }
  }

  // ── Enemy flashlights ──────────────────────────────────────────────────────
  function _updateEnemyLights() {
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      var target = e.mesh || (e.group) || e;
      if (!target || !target.add) continue;
      try {
        if (!e._nvFlashlight && Math.random() < 0.0005) {
          var fl = new THREE.SpotLight(0xffffff, 1.5, 20, 0.35, 0.5);
          fl.name = '__nvEnemyFlashlight';
          target.add(fl);
          e._nvFlashlight = fl;
        }
      } catch (ex) {}
    }
  }

  // ── Key & mouse handlers ───────────────────────────────────────────────────
  function _onKeyDown(e) {
    var tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'f' || e.key === 'F') _holdingFlare = true;

    // N key: toggle NVG (no modifier)
    if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'n' || e.key === 'N')) {
      if (_nvgActive) deactivateNVG();
      else            activateNVG();
      e.preventDefault && e.preventDefault();
    }

    // Alt+N: toggle thermal
    if (e.altKey && (e.key === 'n' || e.key === 'N')) {
      if (_thermalActive) deactivateThermal();
      else                activateThermal();
      e.preventDefault && e.preventDefault();
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'f' || e.key === 'F') _holdingFlare = false;
  }

  function _onMouseDown(e) {
    if (_holdingFlare && e.button === 0) _launchFlare();
  }

  // ── Public: init ───────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene  || window._gameScene  || null;
    _camera = camera || window._gameCamera || null;

    // Save initial fog values
    if (_scene && _scene.fog) {
      _origFogNear = _scene.fog.near;
      _origFogFar  = _scene.fog.far;
    }

    // Save initial ambient
    var amb = _getAmbient();
    if (amb && !_savedAmbient) _savedAmbient = { intensity: amb.intensity };

    if (document.body) {
      _createDOM();
    } else {
      document.addEventListener('DOMContentLoaded', _createDOM);
    }

    window.addEventListener('keydown',   _onKeyDown);
    window.addEventListener('keyup',     _onKeyUp);
    window.addEventListener('mousedown', _onMouseDown);

    // Export globals for other modules to read
    window._nvgActive           = false;
    window._thermalActive       = false;
    window._nvEnemyDetectRange  = 20;
    window._nvEnemyReactionMult = 1.0;
    window._nvIsNight           = false;
    window._nvFlareCount        = _flareCount;

    // Default world decorations
    _spawnCampfire(10, 0, -15);
    _spawnCampfire(-20, 0, 5);
    _spawnBatteryPickup(5, 0, -5);
  }

  // ── Public: update ─────────────────────────────────────────────────────────
  function update(dt) {
    if (typeof dt !== 'number' || isNaN(dt) || dt <= 0) return;
    if (dt > 1.0) dt = 1.0;

    _updateCycle(dt);

    var nightNow = (_phase === PHASE_NIGHT || _nightDepth > 0.7);
    _applyEnemyNightModifiers(nightNow);
    window._nvIsNight = (_phase === PHASE_NIGHT);

    _updateNVGBattery(dt);
    _updateFlares(dt);
    _checkBatteryPickups();
    _updateEnemyLights();
    _flickerSceneLights(dt);

    if (_nvgActive || _thermalActive) {
      _updateCompass();
      _updateHUD();
    }
    if (_phase !== PHASE_DAY || _nightDepth > 0) _updateTODBar();

    window._nvFlareCount = _flareCount;
  }

  // ── Public: isNight ────────────────────────────────────────────────────────
  function isNight() {
    return _phase === PHASE_NIGHT || _nightDepth > 0.7;
  }

  // ── Public: reset ──────────────────────────────────────────────────────────
  function reset() {
    deactivateNVG();
    deactivateThermal();

    _phase       = PHASE_DAY;
    _cycleTimer  = 0;
    _nightDepth  = 0;

    _nvgBattery     = NVG_BATTERY_MAX;
    _thermalBattery = THERMAL_BATTERY_MAX;
    _nvgDead        = false;
    _nvgFlickerTimer = 0;
    _nvgFlickerState = true;
    _flareCount     = 2;

    _removeMoonLight();
    _restoreFog();
    _restoreAmbient();

    for (var i = 0; i < _activeFlares.length; i++) {
      var fl = _activeFlares[i];
      if (fl && fl.mesh && _scene) { try { _scene.remove(fl.mesh); } catch (e) {} }
    }
    _activeFlares = [];

    for (var j = 0; j < _batteryPickups.length; j++) {
      var bp = _batteryPickups[j];
      if (bp && bp.mesh && _scene) { try { _scene.remove(bp.mesh); } catch (e) {} }
    }
    _batteryPickups = [];

    window._nvgActive           = false;
    window._thermalActive       = false;
    window._nvIsNight           = false;
    window._nvEnemyDetectRange  = 20;
    window._nvEnemyReactionMult = 1.0;
    window._nvFlareCount        = 2;

    if (_hudEl)   _hudEl.style.display   = 'none';
    if (_todBarEl) _todBarEl.style.width = '0%';
    _stopNoise();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init:          init,
    update:        update,
    activateNVG:   activateNVG,
    deactivateNVG: deactivateNVG,
    isNight:       isNight,
    reset:         reset
  };

})();
