/**
 * thermal-vision.js — Thermal Imaging Camera Mode
 * Toggle with I key. Enemies appear as white/red heat signatures.
 * CSS post-processing approach — no shader modifications needed.
 */
window.ThermalVision = (function() {
  'use strict';

  // ── State ─────────────────────────────────────────────────
  var _active = false;
  var _renderer = null;         // THREE.js canvas DOM element
  var _overlay = null;          // main dark overlay div
  var _vignetteEl = null;       // red vignette div
  var _tintEl = null;           // warm color tint div
  var _batteryBarEl = null;     // battery bar container
  var _batteryFillEl = null;    // battery bar fill
  var _batteryLabelEl = null;   // battery text label
  var _heatContainer = null;    // container for enemy heat sigs
  var _heatElements = [];       // pool of reusable heat sig elements
  var _battery = 100;           // 0-100
  var _drainRate = 1.5;         // % per second
  var _flickerTimer = 0;
  var _flickerInterval = 1 / 4; // 4Hz
  var _initialized = false;
  var _keyBound = false;

  // ── Enemy heat signature sizes by type ────────────────────
  var HEAT_SIZES = {
    SOLDIER:     14,
    CONSCRIPT:   14,
    STORMER:     14,
    SNIPER:      14,
    SNIPER_ELITE:14,
    OFFICER:     14,
    ENGINEER:    14,
    DRONE_OP:    14,
    SABOTEUR:    14,
    BOMBER:      14,
    WAR_DOG:     10,
    HEAVY:       20,
    ARMORED:     20,
    FLAMETHROWER:20,
    SHIELD_BEARER:20,
    WAGNER:      20,
    SPETSNAZ:    20,
    KADYROVITE:  20,
    THERMOBARIC: 20,
    HEAVY_SNIPER:20,
    KAMIKAZE_DRONE:14,
    MEDIC:       12,
    BOSS:        28,
    DEFAULT:     14,
  };

  // ── Helpers ───────────────────────────────────────────────
  function _getHeatSize(enemy) {
    var name = (enemy.typeName || (enemy.typeCfg && enemy.typeCfg.name) || 'DEFAULT').toUpperCase();
    // Boss detection — any type with "boss" in name or role
    var isBoss = (name === 'BOSS' || name.indexOf('BOSS') !== -1 ||
                  (enemy.typeCfg && enemy.typeCfg.role === 'boss'));
    if (isBoss) return HEAT_SIZES.BOSS;
    // Heavy types
    var isHeavy = (name === 'ARMORED' || name === 'HEAVY' || name === 'FLAMETHROWER' ||
                   name === 'SHIELD_BEARER' || name === 'WAGNER' || name === 'SPETSNAZ' ||
                   name === 'KADYROVITE' || name === 'THERMOBARIC' || name === 'HEAVY_SNIPER');
    if (isHeavy) return HEAT_SIZES.HEAVY;
    if (name === 'MEDIC' || (enemy.typeCfg && enemy.typeCfg.role === 'medic')) {
      return HEAT_SIZES.MEDIC;
    }
    return HEAT_SIZES[name] || HEAT_SIZES.DEFAULT;
  }

  function _findRenderer() {
    // Try the game canvas (Three.js appends to #game-container or body)
    var canvas = document.querySelector('#game-container canvas') ||
                 document.querySelector('canvas');
    return canvas || null;
  }

  // ── DOM creation ──────────────────────────────────────────
  function _buildDOM() {
    // Main dark overlay — darkens base to near-black via multiply blend
    _overlay = document.createElement('div');
    _overlay.id = 'thermalOverlay';
    _overlay.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:950;',
      'background:rgba(10,0,20,0.5);',
      'mix-blend-mode:multiply;',
      'display:none;',
    ].join('');
    document.body.appendChild(_overlay);

    // Red vignette — radial gradient darkening edges
    _vignetteEl = document.createElement('div');
    _vignetteEl.id = 'thermalVignette';
    _vignetteEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:951;',
      'background:radial-gradient(ellipse at center, transparent 40%, rgba(50,0,0,0.6) 100%);',
      'display:none;',
    ].join('');
    document.body.appendChild(_vignetteEl);

    // Warm color temperature tint
    _tintEl = document.createElement('div');
    _tintEl.id = 'thermalTint';
    _tintEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:952;',
      'background:rgba(20,5,0,0.3);',
      'display:none;',
    ].join('');
    document.body.appendChild(_tintEl);

    // Container for enemy heat signatures (below HUD at z-index 953)
    _heatContainer = document.createElement('div');
    _heatContainer.id = 'thermalHeatContainer';
    _heatContainer.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:953;',
      'display:none;overflow:hidden;',
    ].join('');
    document.body.appendChild(_heatContainer);

    // Battery bar
    var batteryWrap = document.createElement('div');
    batteryWrap.id = 'thermalBattery';
    batteryWrap.style.cssText = [
      'position:fixed;top:12px;left:50%;transform:translateX(-50%);',
      'pointer-events:none;z-index:960;',
      'display:none;',
      'background:rgba(0,0,0,0.6);border:1px solid rgba(0,220,255,0.5);',
      'border-radius:4px;padding:3px 8px;font-family:monospace;',
      'font-size:10px;color:#00ddff;letter-spacing:1px;',
      'text-align:center;min-width:120px;',
    ].join('');

    _batteryLabelEl = document.createElement('div');
    _batteryLabelEl.style.cssText = 'margin-bottom:2px;';
    _batteryLabelEl.textContent = 'THERMAL PWR';

    var batteryTrack = document.createElement('div');
    batteryTrack.style.cssText = [
      'width:100px;height:5px;background:rgba(0,0,0,0.5);',
      'border:1px solid rgba(0,220,255,0.3);border-radius:3px;overflow:hidden;',
    ].join('');

    _batteryFillEl = document.createElement('div');
    _batteryFillEl.style.cssText = [
      'width:100%;height:100%;',
      'background:linear-gradient(90deg,#00aaff,#00ffee);',
      'border-radius:3px;transition:width 0.2s;',
    ].join('');

    batteryTrack.appendChild(_batteryFillEl);
    batteryWrap.appendChild(_batteryLabelEl);
    batteryWrap.appendChild(batteryTrack);
    document.body.appendChild(batteryWrap);
    _batteryBarEl = batteryWrap;
  }

  // ── Heat signature element pool ───────────────────────────
  function _getHeatEl(index) {
    if (_heatElements[index]) {
      return _heatElements[index];
    }
    // Create a new heat signature element
    var wrap = document.createElement('div');
    wrap.style.cssText = [
      'position:absolute;',
      'pointer-events:none;',
      'transform:translate(-50%,-50%);',
    ].join('');

    var aura = document.createElement('div');
    aura.style.cssText = [
      'position:absolute;',
      'border-radius:50%;',
      'filter:blur(8px);',
      'transform:translate(-50%,-50%);',
      'top:50%;left:50%;',
      'background:rgba(255,136,0,0.6);',
      'opacity:0.6;',
    ].join('');

    var core = document.createElement('div');
    core.style.cssText = [
      'position:absolute;',
      'border-radius:50%;',
      'top:50%;left:50%;',
      'transform:translate(-50%,-50%);',
      'background:#ffeecc;',
      'box-shadow:0 0 6px 2px rgba(255,220,180,0.8);',
    ].join('');

    wrap.appendChild(aura);
    wrap.appendChild(core);
    _heatContainer.appendChild(wrap);

    _heatElements[index] = { wrap: wrap, aura: aura, core: core };
    return _heatElements[index];
  }

  function _hideExcessHeatEls(count) {
    for (var i = count; i < _heatElements.length; i++) {
      if (_heatElements[i]) {
        _heatElements[i].wrap.style.display = 'none';
      }
    }
  }

  // ── Project 3D world position to 2D screen ────────────────
  // Needs THREE camera — grabbed from window.GameManager or window._camera
  function _worldToScreen(worldPos) {
    var camera = (window.GameManager && window.GameManager._camera) ||
                 window._camera || window._playerCamera;
    if (!camera) return null;

    // Use THREE.Vector3 project
    var vec = worldPos.clone().project(camera);

    // Convert to CSS pixels
    var w = window.innerWidth;
    var h = window.innerHeight;
    var x = (vec.x * 0.5 + 0.5) * w;
    var y = (-vec.y * 0.5 + 0.5) * h;

    // Check if behind camera (z > 1)
    if (vec.z > 1) return null;

    return { x: x, y: y };
  }

  // ── Update enemy heat signatures ──────────────────────────
  function _updateHeatSigs() {
    var enemies = null;

    if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      enemies = window.Enemies.getAll();
    } else if (window._activeEnemies) {
      enemies = window._activeEnemies;
    }

    if (!enemies || enemies.length === 0) {
      _hideExcessHeatEls(0);
      return;
    }

    var count = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh) continue;

      // Get position (slightly above enemy center for body heat)
      var pos = e.mesh.position;
      var headOffset = (e.typeCfg && e.typeCfg.scale) ? e.typeCfg.scale * 1.0 : 1.0;

      // Create a temporary vector for the head position
      var headPos = pos.clone();
      headPos.y = headPos.y + headOffset;

      var screen = _worldToScreen(headPos);
      if (!screen) continue;

      var size = _getHeatSize(e);
      var auraSize = size * 2.2;

      var el = _getHeatEl(count);
      el.wrap.style.display = 'block';
      el.wrap.style.left = screen.x + 'px';
      el.wrap.style.top = screen.y + 'px';

      // Alive vs dying/dead color
      if (e.alive) {
        el.core.style.width = size + 'px';
        el.core.style.height = size + 'px';
        el.core.style.background = '#ffeecc';
        el.core.style.boxShadow = '0 0 6px 2px rgba(255,220,180,0.8)';
        el.aura.style.width = auraSize + 'px';
        el.aura.style.height = auraSize + 'px';
        el.aura.style.background = 'rgba(255,136,0,0.6)';
        el.aura.style.opacity = '0.6';
      } else {
        // Dead/dying: fade to gray-blue
        el.core.style.width = size + 'px';
        el.core.style.height = size + 'px';
        el.core.style.background = '#667788';
        el.core.style.boxShadow = '0 0 3px 1px rgba(100,120,140,0.4)';
        el.aura.style.width = auraSize + 'px';
        el.aura.style.height = auraSize + 'px';
        el.aura.style.background = 'rgba(80,100,120,0.3)';
        el.aura.style.opacity = '0.3';
      }

      count++;
    }

    _hideExcessHeatEls(count);
  }

  // ── Battery display update ─────────────────────────────────
  function _updateBatteryDisplay() {
    if (!_batteryFillEl) return;
    _batteryFillEl.style.width = _battery + '%';

    if (_battery < 15) {
      // Low battery: red color
      _batteryFillEl.style.background = 'linear-gradient(90deg,#ff2200,#ff6600)';
      _batteryLabelEl.style.color = '#ff4422';
      _batteryLabelEl.textContent = 'THERMAL PWR LOW';
    } else {
      _batteryFillEl.style.background = 'linear-gradient(90deg,#00aaff,#00ffee)';
      _batteryLabelEl.style.color = '#00ddff';
      _batteryLabelEl.textContent = 'THERMAL PWR';
    }
  }

  // ── Canvas filter ─────────────────────────────────────────
  function _applyCanvasFilter() {
    if (!_renderer) _renderer = _findRenderer();
    if (_renderer) {
      _renderer.style.filter = 'grayscale(1) invert(1) contrast(3) brightness(0.4)';
      _renderer.style.transition = 'filter 0.25s ease';
    }
  }

  function _removeCanvasFilter() {
    if (!_renderer) _renderer = _findRenderer();
    if (_renderer) {
      _renderer.style.filter = '';
      _renderer.style.transition = 'filter 0.25s ease';
    }
  }

  // ── Show / hide overlays ──────────────────────────────────
  function _showOverlays() {
    if (_overlay)        _overlay.style.display = 'block';
    if (_vignetteEl)     _vignetteEl.style.display = 'block';
    if (_tintEl)         _tintEl.style.display = 'block';
    if (_heatContainer)  _heatContainer.style.display = 'block';
    if (_batteryBarEl)   _batteryBarEl.style.display = 'block';
  }

  function _hideOverlays() {
    if (_overlay)        _overlay.style.display = 'none';
    if (_vignetteEl)     _vignetteEl.style.display = 'none';
    if (_tintEl)         _tintEl.style.display = 'none';
    if (_heatContainer)  _heatContainer.style.display = 'none';
    if (_batteryBarEl)   _batteryBarEl.style.display = 'none';
  }

  // ── Public API ────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    _buildDOM();
    _bindKey();

    // Try to find renderer immediately; will retry on enable if not found yet
    _renderer = _findRenderer();
  }

  function enable() {
    if (_active) return;
    if (_battery <= 0) return;

    // If night vision is on, turn it off first
    if (window.NightVision && typeof window.NightVision.isActive === 'function' &&
        window.NightVision.isActive()) {
      if (typeof window.NightVision.toggle === 'function') {
        window.NightVision.toggle();
      } else if (typeof window.NightVision.deactivate === 'function') {
        window.NightVision.deactivate();
      }
    }

    _active = true;
    window._thermalActive = true;

    if (!_initialized) init();

    // Find renderer if not already set
    if (!_renderer) _renderer = _findRenderer();

    _applyCanvasFilter();
    _showOverlays();
    _updateBatteryDisplay();
  }

  function disable() {
    if (!_active) return;
    _active = false;
    window._thermalActive = false;

    _removeCanvasFilter();
    _hideOverlays();
    _hideExcessHeatEls(0);
  }

  function toggle() {
    if (_active) {
      disable();
    } else {
      enable();
    }
  }

  function isActive() {
    return _active;
  }

  function update(delta) {
    if (!_active) return;

    // Drain battery — share with NightVision battery if available
    var batterySource = null;
    if (typeof window._nightVisionBattery !== 'undefined') {
      // Shared battery pool
      window._nightVisionBattery = Math.max(0, window._nightVisionBattery - _drainRate * delta);
      _battery = window._nightVisionBattery;
    } else {
      _battery = Math.max(0, _battery - _drainRate * delta);
    }

    // Force off at 0%
    if (_battery <= 0) {
      disable();
      return;
    }

    // Flicker at < 15% battery
    if (_battery < 15) {
      _flickerTimer -= delta;
      if (_flickerTimer <= 0) {
        _flickerTimer = _flickerInterval;
        var flickerOpacity = 0.6 + Math.random() * 0.4; // 0.6 - 1.0
        if (_overlay) _overlay.style.opacity = flickerOpacity.toString();
        if (_vignetteEl) _vignetteEl.style.opacity = flickerOpacity.toString();
        if (_tintEl) _tintEl.style.opacity = flickerOpacity.toString();
      }
    } else {
      if (_overlay && _overlay.style.opacity !== '1') _overlay.style.opacity = '1';
      if (_vignetteEl && _vignetteEl.style.opacity !== '1') _vignetteEl.style.opacity = '1';
      if (_tintEl && _tintEl.style.opacity !== '1') _tintEl.style.opacity = '1';
    }

    _updateBatteryDisplay();
    _updateHeatSigs();
  }

  // ── Key binding ───────────────────────────────────────────
  function _bindKey() {
    if (_keyBound) return;
    _keyBound = true;

    document.addEventListener('keydown', function(evt) {
      // I key — but only when not typing in an input
      if (evt.key !== 'i' && evt.key !== 'I') return;
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      // Skip if inventory is opening (check for inventory modal being visible)
      // The game uses I for inventory too, so we need to be careful.
      // If thermal is off and inventory would open, we skip.
      // We let the thermal toggle fire here; game-manager can still open inventory
      // because this fires before game-manager's listener (added later).
      // Actually: the I key is listed in controls as "I / TAB - Inventory"
      // We need to handle the conflict: only toggle thermal if thermal is already
      // active, OR if a modifier or separate mechanism is desired.
      // Per spec, I key toggles thermal vision. We'll stopPropagation only when
      // thermal becomes active, to avoid double-triggering inventory.
      toggle();
      if (_active) {
        evt.stopPropagation();
      }
    }, true); // use capture to intercept before other handlers
  }

  // ── Self-init on DOMContentLoaded or immediately ──────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
    });
  } else {
    // DOM is already ready
    // Defer slightly so Three.js canvas is appended
    setTimeout(function() {
      init();
    }, 500);
  }

  return {
    init: init,
    toggle: toggle,
    enable: enable,
    disable: disable,
    isActive: isActive,
    update: update,
  };
})();
