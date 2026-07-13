window.NightVisionGoggles = (function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  var _active = false;
  var _battery = 1.0;          // 0-1; 1 = full
  var _lastTime = null;
  var _flickerTimer = 0;
  var _flickerState = true;
  var _powerOffAnim = false;
  var _powerOffTimer = 0;
  var _transitioning = false;

  // Battery constants
  var BATTERY_DRAIN_RATE   = 1 / 60;   // depletes in 60 s
  var BATTERY_CHARGE_RATE  = 1 / 120;  // recharges in 120 s (0.5× rate)
  var FLICKER_THRESHOLD    = 10 / 60;  // < 10 s remaining → flicker
  var FLICKER_INTERVAL     = 0.1;      // 100 ms on/off
  var POWER_OFF_DURATION   = 0.6;      // seconds for loss-of-power animation

  // ── DOM elements (created lazily in init) ─────────────────────────────────
  var _overlay      = null;   // green tint + vignette + scanlines
  var _frameLeft    = null;   // left goggle ring
  var _frameRight   = null;   // right goggle ring
  var _hud          = null;   // HUD status text
  var _lowBatWarn   = null;   // "NVG LOW BATTERY" warning
  var _staticAnim   = null;   // setInterval handle for static noise

  // ── Private helpers ────────────────────────────────────────────────────────

  function _createOverlay() {
    _overlay = document.createElement('div');
    _overlay.id = 'nvg-overlay';
    var s = _overlay.style;
    s.position   = 'fixed';
    s.top        = '0';
    s.left       = '0';
    s.width      = '100vw';
    s.height     = '100vh';
    s.pointerEvents = 'none';
    s.zIndex     = '998';
    s.display    = 'none';
    s.transition = 'opacity 0.4s';
    s.opacity    = '0';

    // Green phosphor tint
    s.background = 'rgba(0, 40, 0, 0.3)';

    // Vignette via radial gradient (edges dark, center clear)
    // Scan lines via repeating-linear-gradient layered on top
    s.backgroundImage = [
      'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.8) 100%)',
      'repeating-linear-gradient(to bottom, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 2px)'
    ].join(', ');

    // CSS keyframe for static noise (shift background-position)
    if (!document.getElementById('nvg-style')) {
      var style = document.createElement('style');
      style.id = 'nvg-style';
      style.textContent = [
        '@keyframes nvgStatic {',
        '  0%   { background-position: 0 0, 0 0; }',
        '  20%  { background-position: 0 0, 2px 0; }',
        '  40%  { background-position: 0 0, -1px 0; }',
        '  60%  { background-position: 0 0, 0 3px; }',
        '  80%  { background-position: 0 0, 1px -2px; }',
        '  100% { background-position: 0 0, 0 0; }',
        '}',
        '@keyframes nvgFlicker {',
        '  0%, 49%  { opacity: 1; }',
        '  50%, 100% { opacity: 0; }',
        '}',
        '@keyframes nvgPowerOff {',
        '  0%   { opacity: 1; filter: brightness(2.5) saturate(0) hue-rotate(90deg) contrast(1.3); }',
        '  30%  { opacity: 1; filter: brightness(0.1) saturate(0); }',
        '  60%  { opacity: 0; filter: brightness(0) saturate(0); }',
        '  100% { opacity: 0; filter: none; }',
        '}'
      ].join('\n');
      document.head.appendChild(style);
    }

    document.body.appendChild(_overlay);
  }

  function _createGoggleFrames() {
    var container = document.createElement('div');
    container.id = 'nvg-frames';
    var cs = container.style;
    cs.position = 'fixed';
    cs.top      = '0';
    cs.left     = '0';
    cs.width    = '100vw';
    cs.height   = '100vh';
    cs.pointerEvents = 'none';
    cs.zIndex   = '999';
    cs.display  = 'none';
    cs.transition = 'opacity 0.4s';
    cs.opacity  = '0';

    var size = '38vmin';

    _frameLeft = document.createElement('div');
    var ls = _frameLeft.style;
    ls.position     = 'absolute';
    ls.top          = '50%';
    ls.left         = '50%';
    ls.width        = size;
    ls.height       = size;
    ls.borderRadius = '50%';
    ls.border       = '3px solid rgba(0,100,0,0.5)';
    ls.transform    = 'translate(-105%, -50%)';
    ls.boxShadow    = 'inset 0 0 30px rgba(0,40,0,0.2), 0 0 8px rgba(0,100,0,0.3)';

    _frameRight = document.createElement('div');
    var rs = _frameRight.style;
    rs.position     = 'absolute';
    rs.top          = '50%';
    rs.left         = '50%';
    rs.width        = size;
    rs.height       = size;
    rs.borderRadius = '50%';
    rs.border       = '3px solid rgba(0,100,0,0.5)';
    rs.transform    = 'translate(5%, -50%)';
    rs.boxShadow    = 'inset 0 0 30px rgba(0,40,0,0.2), 0 0 8px rgba(0,100,0,0.3)';

    container.appendChild(_frameLeft);
    container.appendChild(_frameRight);
    document.body.appendChild(container);

    // Keep reference so we can hide/show together
    _frameLeft._container = container;
  }

  function _createHUD() {
    _hud = document.createElement('div');
    _hud.id = 'nvg-hud';
    var hs = _hud.style;
    hs.position   = 'fixed';
    hs.top        = '12px';
    hs.right      = '16px';
    hs.color      = '#00ff44';
    hs.fontFamily = 'monospace';
    hs.fontSize   = '13px';
    hs.fontWeight = 'bold';
    hs.zIndex     = '1000';
    hs.display    = 'none';
    hs.textShadow = '0 0 6px #00ff44';
    hs.pointerEvents = 'none';
    document.body.appendChild(_hud);

    _lowBatWarn = document.createElement('div');
    _lowBatWarn.id = 'nvg-lowbat';
    var ws = _lowBatWarn.style;
    ws.position   = 'fixed';
    ws.top        = '30px';
    ws.right      = '16px';
    ws.color      = '#ff2222';
    ws.fontFamily = 'monospace';
    ws.fontSize   = '12px';
    ws.fontWeight = 'bold';
    ws.zIndex     = '1000';
    ws.display    = 'none';
    ws.textShadow = '0 0 6px #ff0000';
    ws.pointerEvents = 'none';
    ws.textContent = 'NVG LOW BATTERY';
    document.body.appendChild(_lowBatWarn);
  }

  function _applyBodyFilter(on) {
    if (on) {
      document.body.style.filter = 'brightness(2.5) saturate(0) hue-rotate(90deg) contrast(1.3)';
      document.body.style.transition = 'filter 0.4s';
    } else {
      document.body.style.filter = '';
      document.body.style.transition = 'filter 0.4s';
    }
  }

  function _showOverlay(visible) {
    if (!_overlay) return;
    var frameContainer = _frameLeft ? _frameLeft._container : null;
    if (visible) {
      _overlay.style.display = 'block';
      if (frameContainer) frameContainer.style.display = 'block';
      // Force reflow then fade in
      void _overlay.offsetWidth;
      _overlay.style.opacity = '1';
      _overlay.style.animation = 'nvgStatic 0.5s steps(1) infinite';
      if (frameContainer) frameContainer.style.opacity = '1';
      _hud.style.display = 'block';
    } else {
      _overlay.style.opacity = '0';
      if (frameContainer) frameContainer.style.opacity = '0';
      _hud.style.display = 'none';
      _lowBatWarn.style.display = 'none';
      // Hide after transition
      setTimeout(function() {
        if (!_active) {
          _overlay.style.display = 'none';
          _overlay.style.animation = '';
          if (frameContainer) frameContainer.style.display = 'none';
        }
      }, 450);
    }
  }

  function _updateHUD() {
    if (!_hud || !_active) return;
    var secs = Math.ceil(_battery * 60);
    _hud.textContent = '🟢 NVG ON  ' + secs + 's';
  }

  function _addEnemyHalo(enemy) {
    if (!enemy || !enemy._nvgHalo) {
      try {
        var light = new THREE.PointLight(0x00FF00, 1, 8);
        light.name = '__nvgHalo';
        if (enemy && enemy.add) {
          enemy.add(light);
          enemy._nvgHalo = light;
        }
      } catch(e) { /* THREE not available */ }
    }
  }

  function _removeEnemyHalo(enemy) {
    if (enemy && enemy._nvgHalo) {
      try {
        enemy.remove(enemy._nvgHalo);
        if (enemy._nvgHalo.dispose) enemy._nvgHalo.dispose();
      } catch(e) {}
      enemy._nvgHalo = null;
    }
  }

  function _applyEnemyHalos(enable) {
    var enemies = null;
    // Try common game global patterns
    if (window.Enemies && window.Enemies.list) enemies = window.Enemies.list;
    else if (window._enemies) enemies = window._enemies;
    else if (window.GameState && window.GameState.enemies) enemies = window.GameState.enemies;
    if (!enemies || !enemies.length) return;
    for (var i = 0; i < enemies.length; i++) {
      if (enable) _addEnemyHalo(enemies[i]);
      else _removeEnemyHalo(enemies[i]);
    }
  }

  function _powerOff() {
    _active = false;
    window._nvgActive = false;
    _powerOffAnim = true;
    _powerOffTimer = 0;
    _transitioning = true;

    // Animate: brief darkness then back to normal
    if (_overlay) {
      _overlay.style.animation = 'nvgPowerOff 0.6s forwards';
    }
    _applyBodyFilter(false);
    _applyEnemyHalos(false);
    if (_lowBatWarn) _lowBatWarn.style.display = 'none';
    if (_hud) _hud.style.display = 'none';
    if (_frameLeft && _frameLeft._container) {
      _frameLeft._container.style.opacity = '0';
      setTimeout(function() {
        if (_frameLeft && _frameLeft._container) _frameLeft._container.style.display = 'none';
      }, 650);
    }

    setTimeout(function() {
      _powerOffAnim = false;
      _transitioning = false;
      if (_overlay) {
        _overlay.style.animation = '';
        _overlay.style.display = 'none';
        _overlay.style.opacity = '0';
      }
    }, 650);
  }

  function _handleKey(e) {
    // Alt+V or N key
    var isAltV = e.altKey && (e.key === 'v' || e.key === 'V');
    var isN    = !e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'n' || e.key === 'N');
    if (isAltV || isN) {
      // Don't steal N from chat/input fields
      var tag = document.activeElement ? document.activeElement.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      toggle();
      e.preventDefault && e.preventDefault();
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init() {
    _createOverlay();
    _createGoggleFrames();
    _createHUD();

    window.addEventListener('keydown', _handleKey);

    // Export globals
    window._nvgActive  = false;
    window._nvgBattery = 1.0;
  }

  function toggle() {
    if (_transitioning) return;

    if (_active) {
      // Turn off
      _active = false;
      window._nvgActive = false;
      _applyBodyFilter(false);
      _showOverlay(false);
      _applyEnemyHalos(false);
    } else {
      // Only turn on if battery > 0
      if (_battery <= 0) return;
      _active = true;
      window._nvgActive = true;
      _applyBodyFilter(true);
      _showOverlay(true);
      _applyEnemyHalos(true);
      _updateHUD();
    }
  }

  function update(deltaTime) {
    if (deltaTime === undefined || deltaTime === null) {
      var now = performance.now();
      if (_lastTime === null) { _lastTime = now; return; }
      deltaTime = (now - _lastTime) / 1000;
      _lastTime = now;
    } else {
      _lastTime = null; // reset if caller provides dt
    }

    // Clamp dt to avoid huge jumps after tab switch
    if (deltaTime > 1.0) deltaTime = 1.0;

    if (_active) {
      // Drain battery
      _battery -= BATTERY_DRAIN_RATE * deltaTime;
      if (_battery < 0) _battery = 0;
      window._nvgBattery = _battery;

      // Battery out → forced power-off
      if (_battery <= 0) {
        _powerOff();
        return;
      }

      // Low battery flicker + warning
      if (_battery < FLICKER_THRESHOLD) {
        if (_lowBatWarn) _lowBatWarn.style.display = 'block';
        _flickerTimer += deltaTime;
        if (_flickerTimer >= FLICKER_INTERVAL) {
          _flickerTimer = 0;
          _flickerState = !_flickerState;
          if (_overlay) _overlay.style.opacity = _flickerState ? '1' : '0';
          if (_frameLeft && _frameLeft._container) {
            _frameLeft._container.style.opacity = _flickerState ? '1' : '0';
          }
        }
      } else {
        if (_lowBatWarn) _lowBatWarn.style.display = 'none';
        _flickerTimer = 0;
      }

      _updateHUD();

    } else {
      // Recharge when off (not transitioning power-off anim)
      if (!_powerOffAnim && _battery < 1.0) {
        _battery += BATTERY_CHARGE_RATE * deltaTime;
        if (_battery > 1.0) _battery = 1.0;
        window._nvgBattery = _battery;
      }
    }

    // Continuously update enemy halos when active (enemies may spawn mid-game)
    if (_active) {
      _applyEnemyHalos(true);
    }
  }

  function reset() {
    if (_active) {
      _active = false;
      window._nvgActive = false;
      _applyBodyFilter(false);
      _showOverlay(false);
      _applyEnemyHalos(false);
    }
    _battery = 1.0;
    window._nvgBattery = 1.0;
    _flickerTimer = 0;
    _flickerState = true;
    _powerOffAnim = false;
    _powerOffTimer = 0;
    _transitioning = false;
    _lastTime = null;
    if (_lowBatWarn) _lowBatWarn.style.display = 'none';
  }

  return { init: init, update: update, toggle: toggle, reset: reset };

})();
