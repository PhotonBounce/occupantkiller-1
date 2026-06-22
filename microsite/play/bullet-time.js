/**
 * bullet-time.js — Slow-motion bullet-time power with visual film-noir effects
 * window.BulletTime module
 */
window.BulletTime = (function () {
  'use strict';

  // --- Private state ---
  var _scene = null;
  var _camera = null;
  var _active = false;
  var _charge = 1.0;          // 0..1, full = 1.0
  var _cooldownTimer = 0;     // seconds remaining in cooldown
  var _activeTimer = 0;       // seconds remaining while active
  var _maxDuration = 5.0;     // seconds
  var _cooldown = 30.0;       // seconds
  var _timeScaleActive = 0.2;
  var _normalFOV = 75;
  var _activeFOV = 70;        // FOV reduced by 5 during bullet-time
  var _qKeyDown = false;
  var _qPressHandled = false;

  // Visual / audio state
  var _flashLight = null;
  var _flashTimer = 0;
  var _speedLines = null;
  var _speedLineTimer = 0;
  var _oversatTimer = 0;      // post-deactivate over-saturation timer
  var _particles = [];        // dust-mote particle meshes
  var _meterEl = null;        // HUD meter DOM element
  var _meterFill = null;
  var _vignetteEl = null;
  var _canvasEl = null;
  var _audioCtx = null;
  var _initialized = false;

  // --- Helpers ---

  function _getCanvas() {
    if (!_canvasEl) {
      _canvasEl = document.querySelector('canvas');
    }
    return _canvasEl;
  }

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window._audioCtx = _audioCtx;
      } catch (e) { /* no audio */ }
    }
    return _audioCtx;
  }

  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    }
  }

  // --- HUD Meter ---

  function _createMeter() {
    if (_meterEl) return;

    _meterEl = document.createElement('div');
    _meterEl.id = 'bt-meter';
    _meterEl.style.cssText = [
      'position:fixed',
      'right:18px',
      'top:50%',
      'transform:translateY(-50%)',
      'width:10px',
      'height:120px',
      'background:rgba(0,0,0,0.5)',
      'border:1px solid rgba(0,100,255,0.7)',
      'border-radius:5px',
      'overflow:hidden',
      'z-index:9999',
      'pointer-events:none'
    ].join(';');

    _meterFill = document.createElement('div');
    _meterFill.style.cssText = [
      'position:absolute',
      'bottom:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:linear-gradient(to top,rgba(0,80,255,0.9),rgba(100,180,255,0.7))',
      'transition:height 0.1s linear'
    ].join(';');

    _meterEl.appendChild(_meterFill);
    document.body.appendChild(_meterEl);
  }

  function _updateMeter() {
    if (!_meterFill) return;
    var pct = Math.max(0, Math.min(1, _charge)) * 100;
    _meterFill.style.height = pct + '%';
    // Pulse blue border when active
    if (_active) {
      _meterEl.style.borderColor = 'rgba(80,160,255,1)';
      _meterEl.style.boxShadow = '0 0 6px rgba(0,100,255,0.8)';
    } else {
      _meterEl.style.borderColor = 'rgba(0,100,255,0.7)';
      _meterEl.style.boxShadow = 'none';
    }
  }

  // --- Vignette overlay ---

  function _createVignette() {
    if (_vignetteEl) return;
    _vignetteEl = document.createElement('div');
    _vignetteEl.id = 'bt-vignette';
    _vignetteEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9998',
      'transition:box-shadow 0.3s ease'
    ].join(';');
    document.body.appendChild(_vignetteEl);
  }

  function _applyVisualActive() {
    var canvas = _getCanvas();
    if (canvas) {
      canvas.style.filter = 'saturate(0.3) contrast(1.4)';
      canvas.style.transition = 'filter 0.3s ease';
    }
    if (_vignetteEl) {
      _vignetteEl.style.boxShadow = 'inset 0 0 80px rgba(0,100,255,0.5)';
    }
  }

  function _applyVisualDeactivate() {
    var canvas = _getCanvas();
    if (canvas) {
      // Brief over-saturation flash
      canvas.style.filter = 'saturate(3.0) contrast(1.1) brightness(1.3)';
      canvas.style.transition = 'filter 0.05s ease';
      _oversatTimer = 0.3;
    }
    if (_vignetteEl) {
      _vignetteEl.style.boxShadow = 'none';
    }
  }

  function _restoreVisualNormal() {
    var canvas = _getCanvas();
    if (canvas) {
      canvas.style.filter = 'none';
      canvas.style.transition = 'filter 0.4s ease';
    }
  }

  // --- Camera FOV ---

  function _setCameraFOV(fov) {
    var cam = _camera || window._camera;
    if (!cam) return;
    if (cam.fov !== undefined) {
      cam.fov = fov;
      cam.updateProjectionMatrix && cam.updateProjectionMatrix();
    }
  }

  // --- Speed lines (LineSegments from center outward) ---

  function _createSpeedLines() {
    var scene = _scene || window._gameScene;
    if (!scene) return;
    if (typeof THREE === 'undefined') return;

    var positions = [];
    var count = 32;
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2;
      var r1 = 2 + Math.random() * 2;
      var r2 = r1 + 3 + Math.random() * 5;
      // Start point
      positions.push(Math.cos(angle) * r1, Math.sin(angle) * r1, 0);
      // End point
      positions.push(Math.cos(angle) * r2, Math.sin(angle) * r2, 0);
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    _speedLines = new THREE.LineSegments(geo, mat);

    var cam = _camera || window._camera;
    if (cam) {
      _speedLines.position.copy(cam.position);
      _speedLines.quaternion.copy(cam.quaternion);
      _speedLines.translateZ(-8);
    }

    scene.add(_speedLines);
    _speedLineTimer = 0.5;
  }

  function _removeSpeedLines() {
    if (!_speedLines) return;
    var scene = _scene || window._gameScene;
    if (scene) scene.remove(_speedLines);
    if (_speedLines.geometry) _speedLines.geometry.dispose();
    if (_speedLines.material) _speedLines.material.dispose();
    _speedLines = null;
  }

  // --- Flash point light ---

  function _createFlashLight() {
    var scene = _scene || window._gameScene;
    if (!scene) return;
    if (typeof THREE === 'undefined') return;

    var cam = _camera || window._camera;
    _flashLight = new THREE.PointLight(0xffffff, 8, 30);
    if (cam) {
      _flashLight.position.copy(cam.position);
    }
    scene.add(_flashLight);
    _flashTimer = 0.25;
  }

  function _removeFlashLight() {
    if (!_flashLight) return;
    var scene = _scene || window._gameScene;
    if (scene) scene.remove(_flashLight);
    _flashLight = null;
  }

  // --- Dust mote particles ---

  function _spawnDustParticle(x, y, z) {
    var scene = _scene || window._gameScene;
    if (!scene) return;
    if (typeof THREE === 'undefined') return;

    var geo = new THREE.SphereGeometry(0.05, 4, 4);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.7
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.4,
      y + (Math.random() - 0.5) * 0.4,
      z + (Math.random() - 0.5) * 0.4
    );
    mesh._life = 0.6 + Math.random() * 0.4;
    mesh._maxLife = mesh._life;
    mesh._vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      (Math.random()) * 0.3,
      (Math.random() - 0.5) * 0.5
    );
    scene.add(mesh);
    _particles.push(mesh);
  }

  function _updateParticles(dt) {
    var scene = _scene || window._gameScene;
    var toRemove = [];
    for (var i = 0; i < _particles.length; i++) {
      var p = _particles[i];
      p._life -= dt;
      if (p._life <= 0) {
        toRemove.push(i);
        if (scene) scene.remove(p);
        if (p.geometry) p.geometry.dispose();
        if (p.material) p.material.dispose();
      } else {
        p.position.addScaledVector(p._vel, dt);
        p.material.opacity = (p._life / p._maxLife) * 0.7;
      }
    }
    // Remove dead particles in reverse order
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _particles.splice(toRemove[j], 1);
    }
  }

  function _clearAllParticles() {
    var scene = _scene || window._gameScene;
    for (var i = 0; i < _particles.length; i++) {
      var p = _particles[i];
      if (scene) scene.remove(p);
      if (p.geometry) p.geometry.dispose();
      if (p.material) p.material.dispose();
    }
    _particles = [];
  }

  // --- Audio ---

  function _playActivateSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Low-pitched rumble oscillator
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);

      // Echo layer
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(80, ctx.currentTime + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.6);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.9);
    } catch (e) { /* audio unavailable */ }
  }

  function _playDeactivateSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Time-restore whoosh — rising pitch
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) { /* audio unavailable */ }
  }

  // --- Activation / Deactivation ---

  function activate() {
    if (_active) return;
    if (_charge <= 0) {
      _toast('Bullet-Time not charged!');
      return;
    }
    if (_cooldownTimer > 0) {
      _toast('Bullet-Time cooling down...');
      return;
    }

    _active = true;
    _activeTimer = _maxDuration * _charge;
    window._timeScale = _timeScaleActive;
    window._scoreMultiplier = 1.5;

    _applyVisualActive();
    _setCameraFOV(_activeFOV);
    _createFlashLight();
    _createSpeedLines();
    _playActivateSound();
    _toast('BULLET TIME!');
  }

  function deactivate() {
    if (!_active) return;

    _active = false;
    _cooldownTimer = _cooldown;
    _charge = 0;
    window._timeScale = 1.0;
    window._scoreMultiplier = 1.0;

    _applyVisualDeactivate();
    _setCameraFOV(_normalFOV);
    _removeSpeedLines();
    _playDeactivateSound();
    _clearAllParticles();
    _toast('Bullet-Time ended. Cooling down...');
  }

  // --- Key handlers ---

  function _onKeyDown(e) {
    if (e.code === 'KeyQ' && !_qKeyDown) {
      _qKeyDown = true;
      if (!_qPressHandled) {
        _qPressHandled = true;
        if (_active) {
          deactivate();
        } else {
          activate();
        }
      }
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'KeyQ') {
      _qKeyDown = false;
      _qPressHandled = false;
    }
  }

  // --- Public API ---

  function init(scene, camera) {
    if (_initialized) return;
    _initialized = true;

    _scene = scene || window._gameScene || null;
    _camera = camera || window._camera || null;

    // Capture normal FOV
    var cam = _camera || window._camera;
    if (cam && cam.fov !== undefined) {
      _normalFOV = cam.fov;
      _activeFOV = _normalFOV - 5;
    }

    // Init global timeScale
    window._timeScale = window._timeScale || 1.0;
    window._scoreMultiplier = window._scoreMultiplier || 1.0;

    _createMeter();
    _createVignette();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
  }

  function update(dt) {
    // Allow scene/camera to be resolved lazily
    if (!_scene) _scene = window._gameScene || null;
    if (!_camera) _camera = window._camera || null;

    var realDt = dt || 0.016;

    // --- Flash light fade ---
    if (_flashLight) {
      _flashTimer -= realDt;
      if (_flashTimer <= 0) {
        _removeFlashLight();
      } else {
        _flashLight.intensity = 8 * (_flashTimer / 0.25);
      }
    }

    // --- Speed lines fade ---
    if (_speedLines) {
      _speedLineTimer -= realDt;
      if (_speedLineTimer <= 0) {
        _removeSpeedLines();
      } else {
        _speedLines.material.opacity = _speedLineTimer / 0.5;
      }
    }

    // --- Over-saturation timer ---
    if (_oversatTimer > 0) {
      _oversatTimer -= realDt;
      if (_oversatTimer <= 0) {
        _restoreVisualNormal();
      }
    }

    // --- Active bullet-time tick ---
    if (_active) {
      _activeTimer -= realDt;
      _charge = Math.max(0, _activeTimer / _maxDuration);

      // Spawn dust on enemies
      var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
      for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        if (enemy && enemy.mesh && Math.random() < 0.3) {
          var pos = enemy.mesh.position;
          _spawnDustParticle(pos.x, pos.y, pos.z);
        }
      }

      // Score multiplier while active
      window._scoreMultiplier = (_timeScaleActive < 0.5) ? 1.5 : 1.0;

      if (_activeTimer <= 0) {
        deactivate();
      }
    } else {
      // Cooldown
      if (_cooldownTimer > 0) {
        _cooldownTimer -= realDt;
        if (_cooldownTimer < 0) _cooldownTimer = 0;
        // Refill charge during cooldown
        _charge = 1.0 - (_cooldownTimer / _cooldown);
      } else {
        _charge = 1.0;
      }
    }

    // Update particles
    _updateParticles(realDt);

    // Update meter
    _updateMeter();
  }

  function reset() {
    if (_active) {
      deactivate();
    }
    _charge = 1.0;
    _cooldownTimer = 0;
    _activeTimer = 0;
    window._timeScale = 1.0;
    window._scoreMultiplier = 1.0;
    _clearAllParticles();
    _removeFlashLight();
    _removeSpeedLines();
    _restoreVisualNormal();
    if (_vignetteEl) _vignetteEl.style.boxShadow = 'none';
    _updateMeter();
  }

  return {
    init: init,
    update: update,
    activate: activate,
    deactivate: deactivate,
    reset: reset
  };

})();
