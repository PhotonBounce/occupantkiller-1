window.NightVision = (function() {
  'use strict';
  // var only

  var _active = false;
  var _overlay = null;
  var _batteryEl = null;
  var _scanlineEl = null;
  var _battery = 100;      // 0-100%
  var _drainRate = 2;      // % per second when active
  var _renderer = null;    // THREE.js renderer DOM element
  var _originalFogColor = null;
  var _nvScene = null;     // reference to THREE.js scene for fog change
  var _activatedAt = 0;

  var NV_FOG_COLOR = 0x001a00;      // dark green fog
  var NV_AMBIENT_COLOR = 0x003300;  // dark green ambient

  function _createOverlay() {
    // Main green tint overlay
    _overlay = document.createElement('div');
    _overlay.id = 'nv-overlay';
    _overlay.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:6000;',
      'background:radial-gradient(ellipse at center, rgba(0,60,0,0.25) 0%, rgba(0,30,0,0.6) 80%, rgba(0,0,0,0.85) 100%);',
      'display:none;',
    ].join('');
    document.body.appendChild(_overlay);

    // Scanline effect
    _scanlineEl = document.createElement('div');
    _scanlineEl.id = 'nv-scanlines';
    _scanlineEl.style.cssText = [
      'position:fixed;top:0;left:0;width:100%;height:100%;',
      'pointer-events:none;z-index:6001;',
      'background:repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);',
      'display:none;',
    ].join('');
    document.body.appendChild(_scanlineEl);

    // Battery indicator
    _batteryEl = document.createElement('div');
    _batteryEl.id = 'nv-battery';
    _batteryEl.style.cssText = [
      'position:fixed;top:12px;right:15px;',
      'font-family:monospace;font-size:11px;color:#00ff44;',
      'pointer-events:none;z-index:6002;',
      'display:none;',
      'text-shadow:0 0 6px rgba(0,255,68,0.6);',
    ].join('');
    document.body.appendChild(_batteryEl);

    // NV active indicator
    var nvLabel = document.createElement('div');
    nvLabel.id = 'nv-label';
    nvLabel.style.cssText = [
      'position:fixed;top:28px;right:15px;',
      'font-family:monospace;font-size:9px;color:rgba(0,255,68,0.5);',
      'letter-spacing:3px;pointer-events:none;z-index:6002;display:none;',
    ].join('');
    nvLabel.textContent = 'NV';
    nvLabel.id = 'nv-label';
    document.body.appendChild(nvLabel);
    _overlay._nvLabel = nvLabel;
  }

  function activate() {
    if (_active || _battery <= 0) return;
    _active = true;
    _activatedAt = performance.now();

    if (!_overlay) _createOverlay();
    _overlay.style.display = 'block';
    _scanlineEl.style.display = 'block';
    _batteryEl.style.display = 'block';
    if (_overlay._nvLabel) _overlay._nvLabel.style.display = 'block';

    // Apply green CSS filter to Three.js canvas (renderer)
    if (_renderer) {
      _renderer.style.filter = 'brightness(2.5) hue-rotate(90deg) saturate(3) contrast(1.3)';
      _renderer.style.transition = 'filter 0.3s ease';
    }

    // Change scene fog to dark green
    if (_nvScene && _nvScene.fog) {
      _originalFogColor = _nvScene.fog.color.getHex();
      _nvScene.fog.color.setHex(NV_FOG_COLOR);
    }
  }

  function deactivate() {
    if (!_active) return;
    _active = false;

    if (_overlay) _overlay.style.display = 'none';
    if (_scanlineEl) _scanlineEl.style.display = 'none';
    if (_batteryEl) _batteryEl.style.display = 'none';
    if (_overlay && _overlay._nvLabel) _overlay._nvLabel.style.display = 'none';

    // Restore renderer filter
    if (_renderer) {
      _renderer.style.filter = '';
      _renderer.style.transition = 'filter 0.3s ease';
    }

    // Restore fog
    if (_nvScene && _nvScene.fog && _originalFogColor !== null) {
      _nvScene.fog.color.setHex(_originalFogColor);
      _originalFogColor = null;
    }
  }

  function toggle() {
    if (_battery <= 0) {
      // Flash "NO BATTERY" message
      if (_batteryEl) {
        _batteryEl.style.display = 'block';
        _batteryEl.textContent = '⚡ NO BATTERY';
        _batteryEl.style.color = '#ff4444';
        var el = _batteryEl;
        setTimeout(function() {
          el.style.display = 'none';
          el.style.color = '#00ff44';
        }, 2000);
      }
      return;
    }
    if (_active) deactivate(); else activate();
  }

  function update(delta) {
    if (_active) {
      // Drain battery
      _battery = Math.max(0, _battery - _drainRate * delta);

      // Update battery display
      if (_batteryEl) {
        var bars = Math.ceil(_battery / 10);
        var barStr = '';
        for (var i = 0; i < 10; i++) barStr += (i < bars ? '█' : '░');
        _batteryEl.textContent = '🔋 ' + barStr + ' ' + Math.round(_battery) + '%';
        _batteryEl.style.color = _battery > 30 ? '#00ff44' : _battery > 10 ? '#ffaa00' : '#ff4444';
      }

      // Flicker effect at low battery
      if (_battery < 20 && _overlay) {
        var flicker = Math.random() > 0.85;
        _overlay.style.opacity = flicker ? '0.3' : '1';
      }

      // Auto-deactivate at 0 battery
      if (_battery <= 0) {
        deactivate();
        // Flash deactivation message
        var msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-family:monospace;font-size:20px;color:#ff4444;pointer-events:none;z-index:9000;';
        msg.textContent = 'NVG BATTERY DEAD';
        document.body.appendChild(msg);
        setTimeout(function() { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 2000);
      }
    }
  }

  function recharge(amount) {
    _battery = Math.min(100, _battery + (amount || 30));
  }

  function isActive() { return _active; }
  function getBattery() { return _battery; }

  function init(rendererDomElement, scene) {
    _renderer = rendererDomElement;
    _nvScene = scene;
    _battery = 100;
    _createOverlay();
  }

  return {
    init: init,
    toggle: toggle,
    activate: activate,
    deactivate: deactivate,
    update: update,
    recharge: recharge,
    isActive: isActive,
    getBattery: getBattery,
  };
})();
