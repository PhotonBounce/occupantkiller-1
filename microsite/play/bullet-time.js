/**
 * bullet-time.js -- Bullet Time slow-motion ability
 * Keybind: Shift+T to toggle
 * Exports: window._bulletTimeActive, window._bulletTimeScale, window._bulletTimeEnergy
 */

// Exported state globals set immediately so other modules can read them
window._bulletTimeActive     = false;
window._bulletTimeScale      = 1.0;
window._bulletTimeEnergy     = 1.0;
window._bulletTimeAudioPitch = 1.0;

window.BulletTime = (function () {
  'use strict';

  // Constants
  var SLOW_SCALE      = 0.2;
  var DRAIN_RATE      = 0.25;
  var CHARGE_RATE     = 0.15;
  var MAX_DURATION    = 8.0;
  var MIN_RECHARGE    = 4.0;
  var MOTE_COUNT      = 30;
  var BASS_FREQ       = 100;
  var BASS_GAIN_LEVEL = 0.04;

  // Private state
  var _scene        = null;
  var _camera       = null;
  var _active       = false;
  var _energy       = 1.0;
  var _runTime      = 0.0;
  var _rechargeWait = 0.0;
  var _forcedOff    = false;

  // Shift+T keybind state
  var _shiftHeld     = false;
  var _tHeld         = false;
  var _toggleHandled = false;

  // DOM refs
  var _canvasEl      = null;
  var _vignetteEl    = null;
  var _labelEl       = null;
  var _energyWrap    = null;
  var _energyBarFill = null;
  var _energyBarText = null;
  var _pulseDir      = 1;
  var _pulseAlpha    = 1.0;

  // Three.js mote group
  var _moteGroup = null;
  var _moteVels  = [];

  // Audio
  var _audioCtx     = null;
  var _bassOsc      = null;
  var _bassGainNode = null;

  // Misc legacy audio state
  var _initialized = false;

  // --- Canvas helper ---
  function _getCanvas() {
    if (!_canvasEl) {
      _canvasEl = document.getElementById('gameCanvas') ||
                  document.querySelector('canvas');
    }
    return _canvasEl;
  }

  // --- Key handlers: Shift+T ---
  function _onKeyDown(e) {
    if (e.key === 'Shift') { _shiftHeld = true; }
    if (e.key === 'T' || e.key === 't') {
      if (!_tHeld) {
        _tHeld = true;
        if (_shiftHeld && !_toggleHandled) {
          _toggleHandled = true;
          if (_active) { _deactivate(); } else { _activate(); }
        }
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'Shift') { _shiftHeld = false; _toggleHandled = false; }
    if (e.key === 'T' || e.key === 't') { _tHeld = false; _toggleHandled = false; }
  }

  // --- Build spec UI ---
  function _buildUI() {
    // Vignette overlay rgba(0,0,0,0.25) edge darkening
    if (!_vignetteEl) {
      _vignetteEl = document.createElement('div');
      _vignetteEl.id = 'bt-vignette';
      _vignetteEl.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'pointer-events:none;z-index:9000;display:none;' +
        'background:radial-gradient(ellipse at center,' +
        'transparent 50%,rgba(0,0,0,0.25) 100%);';
      document.body.appendChild(_vignetteEl);
    }

    // SLOW label pulsing at bottom
    if (!_labelEl) {
      _labelEl = document.createElement('div');
      _labelEl.id = 'bt-label';
      _labelEl.textContent = '▶▶ SLOW';
      _labelEl.style.cssText =
        'position:fixed;bottom:40px;left:50%;transform:translateX(-50%);' +
        'color:#4af;font-family:monospace;font-size:22px;font-weight:bold;' +
        'letter-spacing:4px;text-shadow:0 0 12px #4af,0 0 24px #08f;' +
        'pointer-events:none;z-index:9001;display:none;opacity:1;';
      document.body.appendChild(_labelEl);
    }

    // Horizontal energy bar 200px wide electric blue at top
    if (!_energyWrap) {
      _energyWrap = document.createElement('div');
      _energyWrap.id = 'bt-energy-wrap';
      _energyWrap.style.cssText =
        'position:fixed;top:8px;left:50%;transform:translateX(-50%);' +
        'width:200px;z-index:9002;pointer-events:none;' +
        'display:flex;flex-direction:column;align-items:center;gap:2px;';

      _energyBarText = document.createElement('div');
      _energyBarText.style.cssText =
        'font-family:monospace;font-size:10px;color:#4af;' +
        'letter-spacing:2px;text-shadow:0 0 6px #08f;';
      _energyBarText.textContent = 'BULLET TIME';

      var barOuter = document.createElement('div');
      barOuter.style.cssText =
        'width:200px;height:6px;background:rgba(0,60,120,0.5);' +
        'border:1px solid #4af;border-radius:3px;overflow:hidden;';

      _energyBarFill = document.createElement('div');
      _energyBarFill.style.cssText =
        'height:100%;width:100%;' +
        'background:linear-gradient(90deg,#08f,#4af);' +
        'border-radius:3px;transition:width 0.05s linear;';

      barOuter.appendChild(_energyBarFill);
      _energyWrap.appendChild(_energyBarText);
      _energyWrap.appendChild(barOuter);
      document.body.appendChild(_energyWrap);
    }
  }

  function _showActiveUI() {
    var canvas = _getCanvas();
    if (canvas) { canvas.style.filter = 'saturate(1.4) contrast(1.1)'; }
    if (_vignetteEl) _vignetteEl.style.display = 'block';
    if (_labelEl)    _labelEl.style.display    = 'block';
  }

  function _hideActiveUI() {
    var canvas = _getCanvas();
    if (canvas) { canvas.style.filter = ''; }
    if (_vignetteEl) _vignetteEl.style.display = 'none';
    if (_labelEl)    _labelEl.style.display    = 'none';
    if (_labelEl)    _labelEl.style.opacity    = '1';
    _pulseAlpha = 1.0;
    _pulseDir   = 1;
  }

  function _refreshEnergyBar() {
    if (!_energyBarFill) return;
    var pct = Math.max(0, Math.min(1, _energy)) * 100;
    _energyBarFill.style.width = pct + '%';
    if (!_energyBarText) return;
    if (_forcedOff && _energy < 1.0) {
      _energyBarText.textContent      = 'RECHARGING';
      _energyBarText.style.color      = '#f80';
      _energyBarText.style.textShadow = '0 0 6px #f80';
    } else {
      _energyBarText.textContent      = 'BULLET TIME';
      _energyBarText.style.color      = '#4af';
      _energyBarText.style.textShadow = '0 0 6px #08f';
    }
  }

  // --- 30 floating blue dust motes ---
  function _buildMotes() {
    var THREE = window.THREE;
    if (!THREE) return;
    _moteGroup = new THREE.Group();
    _moteVels  = [];
    var geo = new THREE.SphereGeometry(0.03, 4, 4);
    var i;
    for (i = 0; i < MOTE_COUNT; i++) {
      var mat = new THREE.MeshBasicMaterial({
        color: 0x4499ff,
        transparent: true,
        opacity: 0.7
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      );
      _moteGroup.add(mesh);
      _moteVels.push({
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.3
      });
    }
  }

  function _addMotesToScene() {
    var scene = _scene || window._gameScene;
    if (scene && _moteGroup) scene.add(_moteGroup);
  }

  function _removeMotesFromScene() {
    var scene = _scene || window._gameScene;
    if (scene && _moteGroup) scene.remove(_moteGroup);
  }

  function _tickMotes(realDt, camera) {
    if (!_moteGroup || !camera) return;
    var children = _moteGroup.children;
    var i;
    for (i = 0; i < children.length; i++) {
      var m = children[i];
      var v = _moteVels[i];
      m.position.x += v.x * realDt * 0.5;
      m.position.y += v.y * realDt * 0.5;
      m.position.z += v.z * realDt * 0.5;
      if (Math.abs(m.position.x - camera.position.x) > 3) {
        m.position.x = camera.position.x + (Math.random() - 0.5) * 4;
      }
      if (Math.abs(m.position.y - camera.position.y) > 3) {
        m.position.y = camera.position.y + (Math.random() - 0.5) * 4;
      }
      if (Math.abs(m.position.z - camera.position.z) > 3) {
        m.position.z = camera.position.z + (Math.random() - 0.5) * 4;
      }
    }
    _moteGroup.position.copy(camera.position);
  }

  // --- Audio: 100Hz bass hum oscillator, gain 0.04 ---
  function _ensureAudioCtx() {
    if (_audioCtx) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (window.AudioSystem && window.AudioSystem._ctx) {
        _audioCtx = window.AudioSystem._ctx;
      } else {
        _audioCtx = new AC();
      }
    } catch (e) { _audioCtx = null; }
  }

  function _startBassHum() {
    _ensureAudioCtx();
    if (!_audioCtx) return;
    try {
      _bassOsc      = _audioCtx.createOscillator();
      _bassGainNode = _audioCtx.createGain();
      _bassOsc.type = 'sine';
      _bassOsc.frequency.setValueAtTime(BASS_FREQ, _audioCtx.currentTime);
      _bassGainNode.gain.setValueAtTime(0, _audioCtx.currentTime);
      _bassGainNode.gain.linearRampToValueAtTime(
        BASS_GAIN_LEVEL,
        _audioCtx.currentTime + 0.3
      );
      _bassOsc.connect(_bassGainNode);
      _bassGainNode.connect(_audioCtx.destination);
      _bassOsc.start();
      window._bulletTimeAudioPitch = 0.7;
    } catch (e) {
      _bassOsc = null;
      _bassGainNode = null;
    }
  }

  function _stopBassHum() {
    window._bulletTimeAudioPitch = 1.0;
    if (!_bassOsc || !_bassGainNode || !_audioCtx) return;
    try {
      _bassGainNode.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 0.3);
      var oscRef = _bassOsc;
      _bassOsc      = null;
      _bassGainNode = null;
      setTimeout(function () {
        try { oscRef.stop(); } catch (e2) { /* already stopped */ }
      }, 400);
    } catch (e) {
      _bassOsc = null;
      _bassGainNode = null;
    }
  }

  // --- Activate / Deactivate ---
  function _activate() {
    if (_active)         return;
    if (_forcedOff)      return;
    if (_energy <= 0.01) return;

    _active  = true;
    _runTime = 0.0;

    window._bulletTimeActive = true;
    window._bulletTimeScale  = SLOW_SCALE;
    if (typeof window._timeScale !== 'undefined') window._timeScale = SLOW_SCALE;

    _showActiveUI();
    _addMotesToScene();
    _startBassHum();
  }

  function _deactivate() {
    if (!_active) return;

    _active       = false;
    _rechargeWait = 0.0;

    window._bulletTimeActive = false;
    window._bulletTimeScale  = 1.0;
    if (typeof window._timeScale !== 'undefined') window._timeScale = 1.0;

    _hideActiveUI();
    _removeMotesFromScene();
    _stopBassHum();
  }

  // --- Public init ---
  function init(scene) {
    if (_initialized) return;
    _initialized = true;

    _scene = scene || null;
    if (!_scene && window.GameManager && window.GameManager._scene) {
      _scene = window.GameManager._scene;
    }

    _buildUI();
    _buildMotes();

    window._bulletTimeActive     = false;
    window._bulletTimeScale      = 1.0;
    window._bulletTimeEnergy     = 1.0;
    window._bulletTimeAudioPitch = 1.0;

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
  }

  // --- Public update (called with REAL unscaled dt every frame) ---
  function update(realDt, camera) {
    if (!_initialized) return;

    // Lazy scene resolution
    if (!_scene) _scene = window._gameScene || null;
    if (!camera)  camera = window._camera || null;

    var dt = realDt || 0.016;

    if (_active) {
      _runTime += dt;
      _energy  -= DRAIN_RATE * dt;
      if (_energy < 0) _energy = 0;

      // Force exit on max duration or depletion
      if (_runTime >= MAX_DURATION || _energy <= 0) {
        _forcedOff = true;
        _deactivate();
      }
    } else {
      // Recharge
      _energy += CHARGE_RATE * dt;
      if (_energy > 1.0) _energy = 1.0;

      // Mandatory recharge window after forced exit
      if (_forcedOff) {
        _rechargeWait += dt;
        if (_rechargeWait >= MIN_RECHARGE) {
          _forcedOff    = false;
          _rechargeWait = 0.0;
        }
      }
    }

    window._bulletTimeEnergy = _energy;
    _refreshEnergyBar();

    // Pulse SLOW label
    if (_active && _labelEl) {
      _pulseAlpha += _pulseDir * dt * 2.5;
      if (_pulseAlpha >= 1.0) { _pulseAlpha = 1.0; _pulseDir = -1; }
      if (_pulseAlpha <= 0.3) { _pulseAlpha = 0.3; _pulseDir =  1; }
      _labelEl.style.opacity = String(_pulseAlpha.toFixed(2));
    }

    // Drift motes
    if (_active && camera) {
      _tickMotes(dt, camera);
    }
  }

  // --- Public activate (can be called externally) ---
  function activate() { _activate(); }

  // --- Public reset ---
  function reset() {
    _deactivate();
    _energy       = 1.0;
    _runTime      = 0.0;
    _rechargeWait = 0.0;
    _forcedOff    = false;
    _pulseAlpha   = 1.0;
    _pulseDir     = 1;

    window._bulletTimeActive = false;
    window._bulletTimeScale  = 1.0;
    window._bulletTimeEnergy = 1.0;
    _refreshEnergyBar();
  }

  // --- Kill bonus: +20 score per kill while active ---
  function getKillBonus() {
    return _active ? 20 : 0;
  }

  return {
    init:         init,
    update:       update,
    activate:     activate,
    reset:        reset,
    getKillBonus: getKillBonus
  };

})();
