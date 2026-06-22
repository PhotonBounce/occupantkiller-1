/* weather-effects.js — Dynamic rain, snow, and fog weather system per level
 * Exposes window.WeatherEffects = { init, update, setWeather, clear, getType }
 */
window.WeatherEffects = (function () {
  'use strict';

  var _scene = null;
  var _currentType = 'CLEAR';
  var _rainMeshes = [];
  var _snowMeshes = [];
  var _splashPool = [];
  var _splashActive = [];
  var _groundPatch = null;
  var _weatherCanvas = null;
  var _overlayDiv = null;
  var _lightningTimer = 0;
  var _lightningNext = 10;
  var _lightningAmbient = null;
  var _lightningPhase = 'idle'; // 'idle' | 'flash' | 'decay'
  var _lightningFlashTimer = 0;
  var _thunderTimer = 0;
  var _thunderPending = false;
  var _fogStoredNear = 18;
  var _fogStoredFar = 105;
  var _fogStormTimer = 0;
  var _fogColors = [
    new THREE.Color(0x888888),
    new THREE.Color(0x555555),
    new THREE.Color(0x556644)
  ];
  var _fogColorIndex = 0;
  var _fogColorTimer = 0;
  var _fogColorDuration = 4.0;

  // ── Helpers ───────────────────────────────────────────────────────────

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _getOrCreateOverlay() {
    if (_overlayDiv) return _overlayDiv;
    _overlayDiv = document.createElement('div');
    _overlayDiv.id = 'weather-effects-overlay';
    _overlayDiv.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:190',
      'transition:background 0.5s'
    ].join(';');
    document.body.appendChild(_overlayDiv);
    return _overlayDiv;
  }

  function _setOverlay(css) {
    var el = _getOrCreateOverlay();
    el.style.background = css || '';
  }

  function _getRendererCanvas() {
    if (_weatherCanvas) return _weatherCanvas;
    _weatherCanvas = document.querySelector('canvas');
    return _weatherCanvas;
  }

  // ── Rain particle creation ─────────────────────────────────────────

  function _createRainParticles() {
    var geo = new THREE.BoxGeometry(0.015, 0.3, 0.015);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xaaccff,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    for (var i = 0; i < 800; i++) {
      var mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z = 0.08; // slight tilt
      mesh.position.set(
        _rand(-30, 30),
        _rand(0, 25),
        _rand(-30, 30)
      );
      mesh.userData.driftX = _rand(-0.5, 0.5);
      _scene.add(mesh);
      _rainMeshes.push(mesh);
    }
  }

  // ── Splash pool creation ───────────────────────────────────────────

  function _createSplashPool() {
    var geo = new THREE.RingGeometry(0.03, 0.04, 8);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xaaccff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    for (var i = 0; i < 5; i++) {
      var mesh = new THREE.Mesh(geo, mat.clone());
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.01;
      mesh.visible = false;
      _scene.add(mesh);
      _splashPool.push({ mesh: mesh, age: 0, active: false });
    }
  }

  // ── Snow particle creation ─────────────────────────────────────────

  function _createSnowParticles() {
    var geo = new THREE.SphereGeometry(0.04, 4, 4);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    for (var i = 0; i < 500; i++) {
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        _rand(-30, 30),
        _rand(0, 25),
        _rand(-30, 30)
      );
      mesh.userData.driftX = _rand(-0.6, 0.6);
      mesh.userData.driftZ = _rand(-0.6, 0.6);
      _scene.add(mesh);
      _snowMeshes.push(mesh);
    }
  }

  // ── Snow ground patch ──────────────────────────────────────────────

  function _createGroundPatch() {
    var geo = new THREE.PlaneGeometry(60, 60);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });
    _groundPatch = new THREE.Mesh(geo, mat);
    _groundPatch.rotation.x = -Math.PI / 2;
    _groundPatch.position.y = 0.01;
    _scene.add(_groundPatch);
  }

  // ── Lightning ambient ──────────────────────────────────────────────

  function _createLightningAmbient() {
    _lightningAmbient = new THREE.AmbientLight(0xffffff, 0);
    _scene.add(_lightningAmbient);
  }

  // ── Thunder SFX ───────────────────────────────────────────────────

  function _playThunder() {
    var ctx = window._audioCtx;
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(_rand(30, 50), ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // audio not available
    }
  }

  // ── Screen flare ──────────────────────────────────────────────────

  function _doScreenFlare() {
    var canvas = _getRendererCanvas();
    if (!canvas) return;
    canvas.style.filter = 'brightness(3)';
    setTimeout(function () {
      canvas.style.filter = '';
    }, 80);
  }

  // ── Clear all particles ────────────────────────────────────────────

  function _clearAllParticles() {
    var i;
    for (i = 0; i < _rainMeshes.length; i++) {
      _scene.remove(_rainMeshes[i]);
    }
    _rainMeshes = [];
    for (i = 0; i < _snowMeshes.length; i++) {
      _scene.remove(_snowMeshes[i]);
    }
    _snowMeshes = [];
    for (i = 0; i < _splashPool.length; i++) {
      _scene.remove(_splashPool[i].mesh);
    }
    _splashPool = [];
    _splashActive = [];
    if (_groundPatch) {
      _scene.remove(_groundPatch);
      _groundPatch = null;
    }
    if (_lightningAmbient) {
      _scene.remove(_lightningAmbient);
      _lightningAmbient = null;
    }
  }

  // ── Restore fog to default ─────────────────────────────────────────

  function _restoreFog() {
    if (_scene && _scene.fog) {
      _scene.fog.near = _fogStoredNear;
      _scene.fog.far = _fogStoredFar;
    }
    window._weatherVisibilityMult = 1.0;
  }

  // ── Save current fog ───────────────────────────────────────────────

  function _saveFog() {
    if (_scene && _scene.fog) {
      _fogStoredNear = _scene.fog.near;
      _fogStoredFar = _scene.fog.far;
    }
  }

  // ── Activate a splash at a ground point ───────────────────────────

  function _triggerSplash(x, z) {
    for (var i = 0; i < _splashPool.length; i++) {
      var s = _splashPool[i];
      if (!s.active) {
        s.mesh.position.set(x, 0.01, z);
        s.mesh.scale.set(1, 1, 1);
        s.mesh.material.opacity = 0.4;
        s.mesh.visible = true;
        s.active = true;
        s.age = 0;
        _splashActive.push(s);
        return;
      }
    }
  }

  // ── Public API ────────────────────────────────────────────────────

  function init(scene) {
    _scene = scene;
    _currentType = 'CLEAR';
    window._weatherVisibilityMult = 1.0;
  }

  function clear() {
    _clearAllParticles();
    _restoreFog();
    _setOverlay('');
    _currentType = 'CLEAR';
    _lightningPhase = 'idle';
    _thunderPending = false;
    _fogStormTimer = 0;
    window._weatherVisibilityMult = 1.0;
  }

  function getType() {
    return _currentType;
  }

  function setWeather(type) {
    if (!_scene) return;
    _clearAllParticles();
    _restoreFog();
    _setOverlay('');
    _currentType = type || 'CLEAR';
    _lightningPhase = 'idle';
    _lightningTimer = 0;
    _lightningNext = _rand(8, 15);
    _thunderPending = false;
    _thunderTimer = 0;
    _fogStormTimer = 0;
    _fogColorIndex = 0;
    _fogColorTimer = 0;

    if (_currentType === 'RAIN') {
      _saveFog();
      _createRainParticles();
      _createSplashPool();
      _setOverlay('rgba(50,70,100,0.08)');
      window._weatherVisibilityMult = 0.8;
    } else if (_currentType === 'THUNDERSTORM') {
      _saveFog();
      _createRainParticles();
      _createSplashPool();
      _createLightningAmbient();
      _setOverlay('rgba(50,70,100,0.08)');
      window._weatherVisibilityMult = 0.8;
    } else if (_currentType === 'SNOW') {
      _saveFog();
      _createSnowParticles();
      _createGroundPatch();
      _setOverlay('radial-gradient(ellipse at center, transparent 40%, rgba(255,255,255,0.12) 100%)');
    } else if (_currentType === 'FOG_STORM') {
      _saveFog();
      if (_scene.fog) {
        _scene.fog.near = 4;
        _scene.fog.far = 18;
        _scene.fog.color.copy(_fogColors[0]);
      }
      window._weatherVisibilityMult = 0.5;
    }
    // CLEAR: already restored above
  }

  function update(delta, playerPos) {
    if (!_scene || !playerPos) return;

    var i, p, mesh;

    if (_currentType === 'RAIN' || _currentType === 'THUNDERSTORM') {
      // Update rain particles — keep them centered on player
      for (i = 0; i < _rainMeshes.length; i++) {
        mesh = _rainMeshes[i];
        mesh.position.y -= 22 * delta;
        mesh.position.x += mesh.userData.driftX * delta;
        // Reposition if below ground
        if (mesh.position.y < 0) {
          mesh.position.y = 25 + _rand(0, 5);
          mesh.position.x = playerPos.x + _rand(-30, 30);
          mesh.position.z = playerPos.z + _rand(-30, 30);
        }
        // Keep in box around player
        if (mesh.position.x < playerPos.x - 30 || mesh.position.x > playerPos.x + 30) {
          mesh.position.x = playerPos.x + _rand(-30, 30);
        }
        if (mesh.position.z < playerPos.z - 30 || mesh.position.z > playerPos.z + 30) {
          mesh.position.z = playerPos.z + _rand(-30, 30);
        }
      }
      // Splash updates
      for (i = _splashActive.length - 1; i >= 0; i--) {
        p = _splashActive[i];
        p.age += delta;
        var t = p.age / 0.4;
        var scale = 1 + (0.25 / 0.03) * t * (1 - t * 0.5);
        p.mesh.scale.set(scale, scale, scale);
        p.mesh.material.opacity = 0.4 * Math.max(0, 1 - t);
        if (p.age >= 0.4) {
          p.mesh.visible = false;
          p.active = false;
          _splashActive.splice(i, 1);
        }
      }
      // Random splash spawn
      if (Math.random() < delta * 6 && _splashActive.length < 5) {
        _triggerSplash(
          playerPos.x + _rand(-20, 20),
          playerPos.z + _rand(-20, 20)
        );
      }
      // Move ground patch with player
      for (i = 0; i < _splashPool.length; i++) {
        // splashes track their own positions
      }
    }

    if (_currentType === 'SNOW') {
      for (i = 0; i < _snowMeshes.length; i++) {
        mesh = _snowMeshes[i];
        mesh.position.y -= 5 * delta;
        mesh.position.x += mesh.userData.driftX * delta;
        mesh.position.z += mesh.userData.driftZ * delta;
        if (mesh.position.y < 0) {
          mesh.position.y = 25 + _rand(0, 5);
          mesh.position.x = playerPos.x + _rand(-30, 30);
          mesh.position.z = playerPos.z + _rand(-30, 30);
        }
        if (mesh.position.x < playerPos.x - 30 || mesh.position.x > playerPos.x + 30) {
          mesh.position.x = playerPos.x + _rand(-30, 30);
        }
        if (mesh.position.z < playerPos.z - 30 || mesh.position.z > playerPos.z + 30) {
          mesh.position.z = playerPos.z + _rand(-30, 30);
        }
      }
      if (_groundPatch) {
        _groundPatch.position.x = playerPos.x;
        _groundPatch.position.z = playerPos.z;
      }
    }

    if (_currentType === 'FOG_STORM' && _scene.fog) {
      // Roll fog color over time
      _fogColorTimer += delta;
      if (_fogColorTimer >= _fogColorDuration) {
        _fogColorTimer -= _fogColorDuration;
        _fogColorIndex = (_fogColorIndex + 1) % _fogColors.length;
      }
      var nextIndex = (_fogColorIndex + 1) % _fogColors.length;
      var lerpT = _fogColorTimer / _fogColorDuration;
      _scene.fog.color.copy(_fogColors[_fogColorIndex]).lerp(_fogColors[nextIndex], lerpT);
    }

    if (_currentType === 'THUNDERSTORM') {
      // Lightning timing
      _lightningTimer += delta;
      if (_lightningPhase === 'idle' && _lightningTimer >= _lightningNext) {
        _lightningTimer = 0;
        _lightningNext = _rand(8, 15);
        _lightningPhase = 'flash';
        _lightningFlashTimer = 0;
        _thunderPending = true;
        _thunderTimer = 0;
        _doScreenFlare();
      }
      if (_lightningPhase === 'flash') {
        _lightningFlashTimer += delta;
        if (_lightningAmbient) {
          // ramp 0→3→0 over 0.15s
          var ft = _lightningFlashTimer / 0.15;
          var fi = ft < 0.5 ? ft * 6 : (1 - ft) * 6;
          _lightningAmbient.intensity = Math.max(0, Math.min(3, fi));
        }
        if (_lightningFlashTimer >= 0.15) {
          _lightningPhase = 'idle';
          if (_lightningAmbient) _lightningAmbient.intensity = 0;
        }
      }
      // Thunder 0.4s after flash
      if (_thunderPending) {
        _thunderTimer += delta;
        if (_thunderTimer >= 0.4) {
          _thunderPending = false;
          _playThunder();
        }
      }
    }
  }

  return {
    init: init,
    update: update,
    setWeather: setWeather,
    clear: clear,
    getType: getType
  };

})();
