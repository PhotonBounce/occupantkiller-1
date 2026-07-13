/**
 * night-vision.js — Night Vision Goggles, Thermal Imaging & Low-Light Combat
 *
 * Public API: NightVision.init(scene, camera), .update(delta), .reset()
 *
 * N key          — toggle NVG mode
 * T key (NVG on) — switch to thermal imaging
 * Battery        — drains 1%/10s; auto-off at 0%; recharged via logistics module
 * Globals        — window.isNightVisionActive, window.isThermalActive
 */
window.NightVision = (function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────────────────────────
  var BATTERY_MAX          = 100;     // percent
  var BATTERY_DRAIN_RATE   = 1;       // % per 10 seconds (0.1 per second)
  var BATTERY_DRAIN_PER_SEC = 0.1;   // percent per second (1%/10s)
  var NVG_FOV              = 75;      // degrees, per spec
  var NVG_FOG_COLOR        = 0x000011;
  var NVG_FOG_DENSITY      = 0.08;
  var NVG_AMBIENT_INT      = 0.05;
  var NVG_GREEN_COLOR      = 0x00ff44;
  var THERMAL_TINT_COLOR   = '#FF6600';
  var THERMAL_ENEMY_COLOR  = 0xFF6600;
  var THERMAL_ENEMY_RADIUS = 3;
  var LENS_FLARE_THRESHOLD = 1;       // intensity above this triggers whitewash
  var LENS_FLARE_DISTANCE  = 30;      // units from camera
  var LENS_FLARE_DURATION  = 0.5;    // seconds
  var NOISE_INTERVAL_MS    = 100;     // grain refresh every 100ms
  var IRNV_BOOST_INTENSITY = 3.0;    // extra brightness for IR-flagged enemies

  // ── State ───────────────────────────────────────────────────────────────────
  var _scene          = null;
  var _camera         = null;

  var _nvgActive      = false;
  var _thermalActive  = false;
  var _battery        = BATTERY_MAX;

  var _origFogColor   = null;
  var _origFogDensity = null;
  var _origFog        = null;
  var _origAmbientInt = null;
  var _origFOV        = null;

  // Three.js objects owned by this module
  var _nvgLight       = null;   // green PointLight following camera
  var _thermalHalos   = [];     // enemy halo PointLights in thermal mode
  var _irnvHalos      = [];     // IRNV highlight lights

  // DOM elements
  var _overlayEl      = null;   // NVG green vignette overlay
  var _grainCanvas    = null;   // static grain canvas
  var _grainCtx       = null;
  var _grainTimer     = null;   // setInterval handle
  var _hudEl          = null;   // top-left HUD panel

  // Thermal DOM
  var _thermalTintEl  = null;

  // Lens flare whitewash
  var _lensFlareActive = false;
  var _lensFlareTimer  = 0;
  var _lensFlashEl    = null;

  // ── Utility ─────────────────────────────────────────────────────────────────
  function _clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function _getAmbient() {
    return window.__ambientLight || window._ambientLight || null;
  }

  function _getEnemies() {
    if (window.Enemies && window.Enemies.list) return window.Enemies.list;
    if (window._enemies)                       return window._enemies;
    if (window.GameState && window.GameState.enemies) return window.GameState.enemies;
    return [];
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'nv2-hud';
    var s = _hudEl.style;
    s.position     = 'fixed';
    s.top          = '12px';
    s.left         = '12px';
    s.color        = '#00ff44';
    s.fontFamily   = 'Courier New, Courier, monospace';
    s.fontSize     = '13px';
    s.fontWeight   = 'bold';
    s.textShadow   = '0 0 8px #00ff44, 0 0 2px #00ff44';
    s.letterSpacing = '0.05em';
    s.background   = 'rgba(0,10,0,0.65)';
    s.padding      = '5px 10px';
    s.borderRadius = '4px';
    s.border       = '1px solid rgba(0,255,68,0.3)';
    s.pointerEvents = 'none';
    s.zIndex       = '1002';
    s.display      = 'none';
    s.lineHeight   = '1.5';
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var battPct = Math.max(0, Math.ceil(_battery));
    var modeStr = _thermalActive ? 'THERMAL' : 'NVG';
    var battBar = _buildBattBar(battPct);
    _hudEl.innerHTML = 'NVG [BATT: ' + battPct + '%] [MODE: ' + modeStr + ']<br>' + battBar;
  }

  function _buildBattBar(pct) {
    var total = 20;
    var filled = Math.round((pct / 100) * total);
    var bar = '';
    for (var i = 0; i < total; i++) {
      bar += (i < filled) ? '|' : '-';
    }
    var color = pct > 40 ? '#00ff44' : pct > 15 ? '#ffcc00' : '#ff2222';
    return '<span style="color:' + color + '">[' + bar + ']</span>';
  }

  function _showHUD(visible) {
    if (!_hudEl) return;
    _hudEl.style.display = visible ? 'block' : 'none';
  }

  // ── NVG Overlay (radial gradient vignette) ───────────────────────────────────
  function _createOverlay() {
    if (_overlayEl) return;
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'nv2-overlay';
    var s = _overlayEl.style;
    s.position     = 'fixed';
    s.top          = '0';
    s.left         = '0';
    s.width        = '100vw';
    s.height       = '100vh';
    s.pointerEvents = 'none';
    s.zIndex       = '1000';
    s.display      = 'none';
    // Radial gradient: green center, black vignette edges, 0.3 opacity
    s.background   = 'radial-gradient(ellipse at 50% 50%, rgba(0,40,0,0.3) 0%, rgba(0,80,0,0.3) 40%, rgba(0,0,0,0.85) 100%)';
    s.opacity      = '0.3';
    document.body.appendChild(_overlayEl);
  }

  // ── Thermal tint overlay ─────────────────────────────────────────────────────
  function _createThermalTint() {
    if (_thermalTintEl) return;
    _thermalTintEl = document.createElement('div');
    _thermalTintEl.id = 'nv2-thermal-tint';
    var s = _thermalTintEl.style;
    s.position     = 'fixed';
    s.top          = '0';
    s.left         = '0';
    s.width        = '100vw';
    s.height       = '100vh';
    s.pointerEvents = 'none';
    s.zIndex       = '1001';
    s.display      = 'none';
    // Orange/red radial gradient for thermal
    s.background   = 'radial-gradient(ellipse at 50% 50%, rgba(255,80,0,0.12) 0%, rgba(200,30,0,0.2) 60%, rgba(0,0,0,0.88) 100%)';
    document.body.appendChild(_thermalTintEl);
  }

  // ── Lens Flare Whitewash ─────────────────────────────────────────────────────
  function _createLensFlash() {
    if (_lensFlashEl) return;
    _lensFlashEl = document.createElement('div');
    _lensFlashEl.id = 'nv2-lens-flash';
    var s = _lensFlashEl.style;
    s.position     = 'fixed';
    s.top          = '0';
    s.left         = '0';
    s.width        = '100vw';
    s.height       = '100vh';
    s.pointerEvents = 'none';
    s.zIndex       = '1003';
    s.display      = 'none';
    s.background   = 'rgba(180,255,180,0.85)';
    s.transition   = 'opacity 0.15s';
    document.body.appendChild(_lensFlashEl);
  }

  function _triggerLensFlare() {
    if (_lensFlareActive) return;
    _lensFlareActive = true;
    _lensFlareTimer  = 0;
    if (_lensFlashEl) {
      _lensFlashEl.style.display  = 'block';
      _lensFlashEl.style.opacity  = '1';
    }
  }

  function _updateLensFlare(dt) {
    if (!_lensFlareActive) return;
    _lensFlareTimer += dt;
    if (_lensFlareTimer >= LENS_FLARE_DURATION) {
      _lensFlareActive = false;
      if (_lensFlashEl) {
        _lensFlashEl.style.opacity = '0';
        setTimeout(function () {
          if (!_lensFlareActive && _lensFlashEl) {
            _lensFlashEl.style.display = 'none';
          }
        }, 200);
      }
    }
  }

  function _checkLensFlare() {
    if (!_nvgActive || !_camera || !_scene) return;
    // Scan scene for bright PointLights nearby
    try {
      _scene.traverse(function (obj) {
        if (_lensFlareActive) return;
        if (obj.isPointLight && obj.intensity > LENS_FLARE_THRESHOLD) {
          var dx = obj.getWorldPosition
            ? (function () { var p = new THREE.Vector3(); obj.getWorldPosition(p); return p.distanceTo(_camera.position); }())
            : obj.position.distanceTo(_camera.position);
          if (dx < LENS_FLARE_DISTANCE) {
            _triggerLensFlare();
          }
        }
      });
    } catch (e) {}
  }

  // ── Static Grain Canvas ──────────────────────────────────────────────────────
  function _createGrain() {
    if (_grainCanvas) return;
    _grainCanvas = document.createElement('canvas');
    _grainCanvas.id = 'nv2-grain';
    _grainCanvas.width  = 320;
    _grainCanvas.height = 240;
    var s = _grainCanvas.style;
    s.position     = 'fixed';
    s.top          = '0';
    s.left         = '0';
    s.width        = '100vw';
    s.height       = '100vh';
    s.pointerEvents = 'none';
    s.zIndex       = '1004';
    s.display      = 'none';
    s.opacity      = '0.12';
    s.imageRendering = 'pixelated';
    document.body.appendChild(_grainCanvas);
    try { _grainCtx = _grainCanvas.getContext('2d'); } catch (e) {}
  }

  function _drawGrain() {
    if (!_grainCtx) return;
    var w = _grainCanvas.width;
    var h = _grainCanvas.height;
    var imgData = _grainCtx.createImageData(w, h);
    var d = imgData.data;
    for (var i = 0; i < d.length; i += 4) {
      var lit = Math.random() > 0.94;  // sparse green pixels
      if (lit) {
        d[i]   = 0;                         // R
        d[i+1] = (100 + Math.random() * 155) | 0; // G — green phosphor
        d[i+2] = 0;                         // B
        d[i+3] = 255;
      } else {
        d[i+3] = 0; // transparent
      }
    }
    _grainCtx.putImageData(imgData, 0, 0);
  }

  function _startGrain() {
    if (_grainTimer) return;
    _drawGrain();
    _grainTimer = setInterval(_drawGrain, NOISE_INTERVAL_MS);
  }

  function _stopGrain() {
    if (_grainTimer) { clearInterval(_grainTimer); _grainTimer = null; }
  }

  // ── Three.js scene manipulation ──────────────────────────────────────────────
  function _saveFog() {
    if (!_scene) return;
    if (_scene.fog) {
      _origFog     = _scene.fog;
      if (_scene.fog.color) _origFogColor   = _scene.fog.color.getHex();
      if ('density' in _scene.fog) _origFogDensity = _scene.fog.density;
    }
  }

  function _applyNVGFog() {
    if (!_scene) return;
    try {
      _scene.fog = new THREE.FogExp2(NVG_FOG_COLOR, NVG_FOG_DENSITY);
    } catch (e) {}
  }

  function _restoreFog() {
    if (!_scene) return;
    try {
      _scene.fog = _origFog || null;
    } catch (e) {}
  }

  function _saveAmbient() {
    var amb = _getAmbient();
    if (amb && _origAmbientInt === null) {
      _origAmbientInt = amb.intensity;
    }
  }

  function _applyNVGAmbient() {
    var amb = _getAmbient();
    if (amb) amb.intensity = NVG_AMBIENT_INT;
  }

  function _restoreAmbient() {
    var amb = _getAmbient();
    if (amb && _origAmbientInt !== null) {
      amb.intensity = _origAmbientInt;
      _origAmbientInt = null;
    }
  }

  function _saveFOV() {
    if (_camera && _origFOV === null) {
      _origFOV = _camera.fov || 75;
    }
  }

  function _applyNVGFOV() {
    if (!_camera) return;
    try {
      _camera.fov = NVG_FOV;
      _camera.updateProjectionMatrix();
    } catch (e) {}
  }

  function _restoreFOV() {
    if (!_camera || _origFOV === null) return;
    try {
      _camera.fov = _origFOV;
      _camera.updateProjectionMatrix();
      _origFOV = null;
    } catch (e) {}
  }

  // Green PointLight that follows camera ─────────────────────────────────────
  function _addNVGLight() {
    if (_nvgLight || !_scene) return;
    try {
      _nvgLight = new THREE.PointLight(NVG_GREEN_COLOR, 1.5, 12);
      _nvgLight.name = '__nv2GreenLight';
      _scene.add(_nvgLight);
    } catch (e) {}
  }

  function _removeNVGLight() {
    if (!_nvgLight || !_scene) return;
    try {
      _scene.remove(_nvgLight);
      _nvgLight = null;
    } catch (e) {}
  }

  function _updateNVGLight() {
    if (!_nvgLight || !_camera) return;
    try {
      _nvgLight.position.copy(_camera.position);
    } catch (e) {}
  }

  // Thermal enemy halos ───────────────────────────────────────────────────────
  function _addThermalHalos() {
    _removeThermalHalos();
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e) continue;
      var target = e.mesh || e.group || e;
      if (!target || !target.add) continue;
      try {
        var halo = new THREE.PointLight(THERMAL_ENEMY_COLOR, 1.8, THERMAL_ENEMY_RADIUS);
        halo.name = '__nv2ThermalHalo';
        target.add(halo);
        _thermalHalos.push({ light: halo, parent: target });
      } catch (ex) {}
    }
  }

  function _removeThermalHalos() {
    for (var i = 0; i < _thermalHalos.length; i++) {
      var h = _thermalHalos[i];
      if (h && h.parent && h.light) {
        try { h.parent.remove(h.light); } catch (ex) {}
      }
    }
    _thermalHalos = [];
  }

  // IRNV mode — boost enemies with ir_signature flag ──────────────────────────
  function _addIRNVHighlights() {
    _removeIRNVHighlights();
    var enemies = _getEnemies();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.ir_signature) continue;
      var target = e.mesh || e.group || e;
      if (!target || !target.add) continue;
      try {
        var halo = new THREE.PointLight(NVG_GREEN_COLOR, IRNV_BOOST_INTENSITY, 5);
        halo.name = '__nv2IRNVHalo';
        target.add(halo);
        _irnvHalos.push({ light: halo, parent: target });
      } catch (ex) {}
    }
  }

  function _removeIRNVHighlights() {
    for (var i = 0; i < _irnvHalos.length; i++) {
      var h = _irnvHalos[i];
      if (h && h.parent && h.light) {
        try { h.parent.remove(h.light); } catch (ex) {}
      }
    }
    _irnvHalos = [];
  }

  // ── Battery ──────────────────────────────────────────────────────────────────
  function _drainBattery(dt) {
    if (!_nvgActive) return;
    _battery -= BATTERY_DRAIN_PER_SEC * dt;
    if (_battery < 0) _battery = 0;
    if (_battery <= 0) {
      _autoOff();
    }
  }

  function _autoOff() {
    deactivateNVG();
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('NVG BATTERY DEAD', 2500, '#ff2222');
      }
    } catch (e) {}
  }

  // Allow logistics module to recharge battery
  function rechargeBattery(amount) {
    _battery = _clamp(_battery + (amount || BATTERY_MAX), 0, BATTERY_MAX);
    if (_hudEl) _updateHUD();
  }

  // ── NVG Activate / Deactivate ────────────────────────────────────────────────
  function activateNVG() {
    if (_battery <= 0) return;
    if (_nvgActive) return;

    _saveFog();
    _saveAmbient();
    _saveFOV();

    _applyNVGFog();
    _applyNVGAmbient();
    _applyNVGFOV();

    _addNVGLight();
    _addIRNVHighlights();

    _nvgActive = true;
    window.isNightVisionActive = true;

    if (_overlayEl) _overlayEl.style.display = 'block';
    if (_grainCanvas) _grainCanvas.style.display = 'block';
    _startGrain();
    _showHUD(true);
    _updateHUD();
  }

  function deactivateNVG() {
    if (!_nvgActive) return;

    // Also turn off thermal if active
    if (_thermalActive) _deactivateThermalInternal();

    _restoreFog();
    _restoreAmbient();
    _restoreFOV();

    _removeNVGLight();
    _removeIRNVHighlights();

    _nvgActive = false;
    window.isNightVisionActive = false;

    if (_overlayEl) _overlayEl.style.display = 'none';
    if (_grainCanvas) _grainCanvas.style.display = 'none';
    _stopGrain();
    _showHUD(false);
    if (_lensFlashEl) _lensFlashEl.style.display = 'none';
    _lensFlareActive = false;
  }

  // ── Thermal Activate / Deactivate ────────────────────────────────────────────
  function activateThermal() {
    if (!_nvgActive) return;       // thermal only works while NVG is on
    if (_thermalActive) return;

    _thermalActive = true;
    window.isThermalActive = true;

    _addThermalHalos();

    if (_thermalTintEl) _thermalTintEl.style.display = 'block';
    _updateHUD();
  }

  function _deactivateThermalInternal() {
    _thermalActive = false;
    window.isThermalActive = false;
    _removeThermalHalos();
    if (_thermalTintEl) _thermalTintEl.style.display = 'none';
  }

  function deactivateThermal() {
    if (!_thermalActive) return;
    _deactivateThermalInternal();
    _updateHUD();
  }

  // ── Key Handlers ─────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    // N key — toggle NVG (no modifier)
    if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'n' || e.key === 'N')) {
      if (_nvgActive) {
        deactivateNVG();
      } else {
        activateNVG();
      }
      try { e.preventDefault(); } catch (ex) {}
    }

    // T key — toggle thermal (only while NVG active)
    if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 't' || e.key === 'T')) {
      if (_nvgActive) {
        if (_thermalActive) {
          deactivateThermal();
        } else {
          activateThermal();
        }
        try { e.preventDefault(); } catch (ex) {}
      }
    }
  }

  // ── DOM setup ────────────────────────────────────────────────────────────────
  function _createDOM() {
    _createOverlay();
    _createThermalTint();
    _createGrain();
    _createHUD();
    _createLensFlash();
  }

  // ── Public: init ─────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene  || window._gameScene  || null;
    _camera = camera || window._gameCamera || null;

    // Expose globals immediately
    window.isNightVisionActive = false;
    window.isThermalActive     = false;

    // Allow logistics module to call NightVision.rechargeBattery()
    window.NightVisionRecharge = rechargeBattery;

    if (document.body) {
      _createDOM();
    } else {
      document.addEventListener('DOMContentLoaded', _createDOM);
    }

    window.addEventListener('keydown', _onKeyDown);
  }

  // ── Public: update ────────────────────────────────────────────────────────────
  function update(dt) {
    if (typeof dt !== 'number' || isNaN(dt) || dt <= 0) return;
    if (dt > 1.0) dt = 1.0;

    if (!_nvgActive) return;

    // Allow camera ref to be acquired lazily
    if (!_camera) {
      _camera = window._gameCamera || null;
    }

    _drainBattery(dt);
    if (!_nvgActive) return;  // may have auto-off'd

    _updateNVGLight();
    _updateLensFlare(dt);
    _checkLensFlare();

    // Refresh thermal halos each tick so newly spawned enemies get them
    if (_thermalActive) {
      _addThermalHalos();
    }

    // IRNV: refresh highlights
    _addIRNVHighlights();

    _updateHUD();
  }

  // ── Public: reset ─────────────────────────────────────────────────────────────
  function reset() {
    if (_thermalActive) _deactivateThermalInternal();
    if (_nvgActive)     deactivateNVG();

    _battery = BATTERY_MAX;

    _removeNVGLight();
    _removeThermalHalos();
    _removeIRNVHighlights();

    _restoreFog();
    _restoreAmbient();
    _restoreFOV();

    window.isNightVisionActive = false;
    window.isThermalActive     = false;

    _origFog        = null;
    _origFogColor   = null;
    _origFogDensity = null;
    _origAmbientInt = null;
    _origFOV        = null;

    if (_overlayEl)      _overlayEl.style.display      = 'none';
    if (_grainCanvas)    _grainCanvas.style.display     = 'none';
    if (_thermalTintEl)  _thermalTintEl.style.display   = 'none';
    if (_lensFlashEl)    _lensFlashEl.style.display     = 'none';
    _lensFlareActive = false;
    _lensFlareTimer  = 0;
    _stopGrain();
    _showHUD(false);
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  return {
    init:             init,
    update:           update,
    reset:            reset,
    activateNVG:      activateNVG,
    deactivateNVG:    deactivateNVG,
    activateThermal:  activateThermal,
    deactivateThermal: deactivateThermal,
    rechargeBattery:  rechargeBattery
  };

})();
