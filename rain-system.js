/* ───────────────────────────────────────────────────────────
   RAIN SYSTEM — Dynamic rain with mud puddles, screen effects,
   fog thickening, thunder, and camera droplets.
   ─────────────────────────────────────────────────────────── */
window.RainSystem = (function () {
  'use strict';

  // ── Internal state ──────────────────────────────────────────
  var _scene = null;
  var _camera = null;

  // Raindrops (THREE.Line segments)
  var _rainGroup = null;
  var _drops = [];          // [{line, vel}]
  var DROP_COUNT = 300;
  var DROP_LENGTH = 0.15;
  var DROP_SPREAD = 30;     // 30x30 box
  var DROP_Y_MIN = 8;
  var DROP_Y_MAX = 10;

  // Splash rings
  var _splashes = [];       // [{mesh, age}]
  var SPLASH_DURATION = 0.3;

  // Mud puddles
  var _puddleGroup = null;
  var _puddles = [];        // [{mesh, x, z}]
  var PUDDLE_COUNT = 5;
  var PUDDLE_RADIUS = 1.2;
  var _puddleTimer = 0;
  var PUDDLE_LINGER = 30;   // seconds after rain stops

  // Rain scheduling
  var _isRaining = false;
  var _rainTimer = 0;
  var _rainDuration = 0;
  var _nextRainIn = 0;      // seconds until next rain

  // Fog
  var _origFogFar = null;

  // CSS / DOM effects
  var _canvas = null;
  var _hudBadge = null;
  var _camDroplets = [];    // DOM divs

  // Thunder
  var _thunderTimer = 0;
  var _audioCtx = null;

  // ── Utility ─────────────────────────────────────────────────
  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = window._audioCtx ||
          new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { _audioCtx = null; }
    }
    return _audioCtx;
  }

  function _getCanvas() {
    if (!_canvas) {
      _canvas = document.querySelector('canvas');
    }
    return _canvas;
  }

  // ── Raindrop geometry ───────────────────────────────────────
  function _createRainGroup() {
    _rainGroup = new THREE.Group();
    _drops = [];

    var mat = new THREE.LineBasicMaterial({ color: 0xAAAACC, transparent: true, opacity: 0.55 });

    for (var i = 0; i < DROP_COUNT; i++) {
      var geo = new THREE.BufferGeometry();
      var pts = new Float32Array(6); // two vertices
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));

      var line = new THREE.Line(geo, mat);
      line.frustumCulled = false;

      var drop = {
        line: line,
        x: _rand(-DROP_SPREAD / 2, DROP_SPREAD / 2),
        y: _rand(DROP_Y_MIN, DROP_Y_MAX),
        z: _rand(-DROP_SPREAD / 2, DROP_SPREAD / 2),
        vel: _rand(8, 12)
      };
      _drops.push(drop);
      _rainGroup.add(line);
    }

    if (_scene) { _scene.add(_rainGroup); }
  }

  function _removeRainGroup() {
    if (_rainGroup && _scene) {
      _scene.remove(_rainGroup);
    }
    for (var i = 0; i < _drops.length; i++) {
      if (_drops[i].line.geometry) { _drops[i].line.geometry.dispose(); }
    }
    _drops = [];
    _rainGroup = null;
  }

  function _updateDropPositions() {
    var windX = (typeof window._windX === 'number') ? window._windX : 0.3;
    var windZ = (typeof window._windZ === 'number') ? window._windZ : 0.1;
    windX = Math.max(-0.5, Math.min(0.5, windX));
    windZ = Math.max(-0.5, Math.min(0.5, windZ));

    _rainGroup.position.x = _camera ? _camera.position.x : 0;
    _rainGroup.position.z = _camera ? _camera.position.z : 0;

    return { windX: windX, windZ: windZ };
  }

  // ── Splash effect ───────────────────────────────────────────
  function _spawnSplash(x, z) {
    var geo = new THREE.CircleGeometry(PUDDLE_RADIUS * 0.125, 4);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x8899BB,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.02, z);
    if (_scene) { _scene.add(mesh); }
    _splashes.push({ mesh: mesh, age: 0 });
  }

  function _updateSplashes(dt) {
    for (var i = _splashes.length - 1; i >= 0; i--) {
      var s = _splashes[i];
      s.age += dt;
      var t = s.age / SPLASH_DURATION;
      s.mesh.material.opacity = (t < 0.5) ? t * 1.4 : (1 - t) * 1.4;
      s.mesh.scale.setScalar(1 + t * 2);
      if (s.age >= SPLASH_DURATION) {
        if (_scene) { _scene.remove(s.mesh); }
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        _splashes.splice(i, 1);
      }
    }
  }

  // ── Mud puddles ─────────────────────────────────────────────
  function _createPuddles() {
    if (!_puddleGroup) {
      _puddleGroup = new THREE.Group();
      if (_scene) { _scene.add(_puddleGroup); }
    }

    var px = _camera ? _camera.position.x : 0;
    var pz = _camera ? _camera.position.z : 0;

    while (_puddleGroup.children.length > 0) {
      var c = _puddleGroup.children[0];
      c.geometry.dispose();
      c.material.dispose();
      _puddleGroup.remove(c);
    }
    _puddles = [];

    var sharedGeo = new THREE.CircleGeometry(PUDDLE_RADIUS, 8);

    for (var i = 0; i < PUDDLE_COUNT; i++) {
      var mat = new THREE.MeshBasicMaterial({
        color: 0x3B2A1A,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
      });
      var m = new THREE.Mesh(sharedGeo, mat);
      m.rotation.x = -Math.PI / 2;
      var ox = _rand(-8, 8);
      var oz = _rand(-8, 8);
      m.position.set(px + ox, 0.01, pz + oz);
      _puddleGroup.add(m);
      _puddles.push({ mesh: m, x: px + ox, z: pz + oz });
    }
  }

  function _removePuddles() {
    if (_puddleGroup && _scene) {
      _scene.remove(_puddleGroup);
    }
    _puddles = [];
    _puddleGroup = null;
  }

  function _checkMudEffect() {
    if (_puddles.length === 0) {
      window._mudSpeedFactor = 1.0;
      return;
    }
    var px = _camera ? _camera.position.x : 0;
    var pz = _camera ? _camera.position.z : 0;
    var inPuddle = false;
    for (var i = 0; i < _puddles.length; i++) {
      var p = _puddles[i];
      var dx = px - p.x;
      var dz = pz - p.z;
      if (Math.sqrt(dx * dx + dz * dz) < PUDDLE_RADIUS) {
        inPuddle = true;
        break;
      }
    }
    window._mudSpeedFactor = inPuddle ? 0.6 : 1.0;
  }

  // ── Screen / CSS effects ─────────────────────────────────────
  function _applyScreenBlur() {
    var cv = _getCanvas();
    if (cv) { cv.style.filter = 'blur(0.5px)'; }
  }

  function _removeScreenBlur() {
    var cv = _getCanvas();
    if (cv) { cv.style.filter = ''; }
  }

  function _showHudBadge() {
    if (_hudBadge) { return; }
    _hudBadge = document.createElement('div');
    _hudBadge.id = 'rain-hud-badge';
    _hudBadge.textContent = '🌧'; // rain cloud emoji
    _hudBadge.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:5000',
      'font-size:18px',
      'pointer-events:none',
      'text-shadow:0 0 6px rgba(100,160,255,0.8)',
      'opacity:0.85'
    ].join(';');
    document.body.appendChild(_hudBadge);
  }

  function _removeHudBadge() {
    if (_hudBadge && _hudBadge.parentNode) {
      _hudBadge.parentNode.removeChild(_hudBadge);
    }
    _hudBadge = null;
  }

  function _createCamDroplets() {
    _removeCamDroplets();
    var count = Math.floor(_rand(3, 6));
    for (var i = 0; i < count; i++) {
      var d = document.createElement('div');
      var side = Math.random() < 0.5 ? 'left' : 'right';
      var edgePct = _rand(2, 12);
      d.style.cssText = [
        'position:fixed',
        'z-index:4999',
        'pointer-events:none',
        'width:6px',
        'height:10px',
        'border-radius:50%',
        'background:rgba(100,160,255,0.35)',
        'top:' + _rand(5, 30) + '%',
        (side === 'left' ? 'left:' + edgePct + '%' : 'right:' + edgePct + '%'),
        'transition:top 4s linear',
        'opacity:0.7'
      ].join(';');
      document.body.appendChild(d);
      _camDroplets.push(d);

      (function (el) {
        setTimeout(function () {
          el.style.top = _rand(70, 95) + '%';
          el.style.opacity = '0';
        }, 50 + Math.random() * 500);
      })(d);
    }
  }

  function _removeCamDroplets() {
    for (var i = 0; i < _camDroplets.length; i++) {
      if (_camDroplets[i].parentNode) {
        _camDroplets[i].parentNode.removeChild(_camDroplets[i]);
      }
    }
    _camDroplets = [];
  }

  // ── Fog ─────────────────────────────────────────────────────
  function _thickenFog() {
    if (_scene && _scene.fog) {
      if (_origFogFar === null) {
        _origFogFar = _scene.fog.far;
      }
      _scene.fog.far = _origFogFar * 0.7;
    }
  }

  function _restoreFog() {
    if (_scene && _scene.fog && _origFogFar !== null) {
      _scene.fog.far = _origFogFar;
    }
  }

  // ── Thunder ─────────────────────────────────────────────────
  function _playThunder() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }

    try {
      var duration = 2.5;
      var bufLen = Math.floor(ctx.sampleRate * duration);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);

      for (var i = 0; i < bufLen; i++) {
        var t = i / ctx.sampleRate;
        var decay = Math.exp(-t * 1.2);
        var rumbleFreq = 60 + 40 * Math.exp(-t * 0.8);
        var noise = (Math.random() * 2 - 1);
        data[i] = noise * decay * 0.3 + Math.sin(2 * Math.PI * rumbleFreq * t) * 0.15 * decay;
      }

      var src = ctx.createBufferSource();
      src.buffer = buf;

      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {
      // Silently ignore audio errors
    }
  }

  // ── Enemy tracking ───────────────────────────────────────────
  function _applyUavEffect() {
    window._uavRainReduction = 0.5;
  }

  function _removeUavEffect() {
    window._uavRainReduction = 1.0;
  }

  // ── Start / Stop ─────────────────────────────────────────────
  function startRain() {
    if (_isRaining) { return; }
    _isRaining = true;
    window._isRaining = true;

    _rainDuration = _rand(45, 90);
    _rainTimer = 0;
    _thunderTimer = _rand(15, 30);
    _puddleTimer = 0;

    _createRainGroup();
    _createPuddles();
    _applyScreenBlur();
    _thickenFog();
    _showHudBadge();
    _createCamDroplets();
    _applyUavEffect();

    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('RAIN INCOMING');
    }
  }

  function stopRain() {
    if (!_isRaining) { return; }
    _isRaining = false;
    window._isRaining = false;
    _puddleTimer = 0;

    _removeRainGroup();
    _removeScreenBlur();
    _restoreFog();
    _removeHudBadge();
    _removeCamDroplets();
    _removeUavEffect();
  }

  // ── Init ─────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene = scene || window._gameScene || null;
    _camera = camera || window._camera || null;
    _isRaining = false;
    window._isRaining = false;
    window._mudSpeedFactor = 1.0;
    window._uavRainReduction = 1.0;

    _nextRainIn = _rand(120, 300);
  }

  // ── Update (call each frame with delta time in seconds) ──────
  function update(dt) {
    if (!_scene) { _scene = window._gameScene || null; }
    if (!_camera) { _camera = window._camera || null; }

    if (dt === undefined || dt === null || dt > 1) { dt = 0.016; }

    if (!_isRaining) {
      _nextRainIn -= dt;
      if (_nextRainIn <= 0) {
        startRain();
      }

      if (_puddles.length > 0) {
        _puddleTimer += dt;
        _checkMudEffect();
        if (_puddleTimer >= PUDDLE_LINGER) {
          _removePuddles();
          window._mudSpeedFactor = 1.0;
        }
      }

      _updateSplashes(dt);
      return;
    }

    // Rain is active
    _rainTimer += dt;
    if (_rainTimer >= _rainDuration) {
      stopRain();
      _nextRainIn = _rand(120, 300);
      return;
    }

    if (_rainGroup) {
      var wind = _updateDropPositions();
      var windX = wind.windX;
      var windZ = wind.windZ;

      for (var i = 0; i < _drops.length; i++) {
        var drop = _drops[i];

        drop.y -= drop.vel * dt;
        drop.x += windX * dt;
        drop.z += windZ * dt;

        if (drop.y <= 0) {
          var wx = (_camera ? _camera.position.x : 0) + drop.x;
          var wz = (_camera ? _camera.position.z : 0) + drop.z;
          _spawnSplash(wx, wz);

          drop.y = _rand(DROP_Y_MIN, DROP_Y_MAX);
          drop.x = _rand(-DROP_SPREAD / 2, DROP_SPREAD / 2);
          drop.z = _rand(-DROP_SPREAD / 2, DROP_SPREAD / 2);
        }

        if (drop.x > DROP_SPREAD / 2) { drop.x -= DROP_SPREAD; }
        if (drop.x < -DROP_SPREAD / 2) { drop.x += DROP_SPREAD; }
        if (drop.z > DROP_SPREAD / 2) { drop.z -= DROP_SPREAD; }
        if (drop.z < -DROP_SPREAD / 2) { drop.z += DROP_SPREAD; }

        var pos = drop.line.geometry.attributes.position;
        pos.setXYZ(0, drop.x, drop.y, drop.z);
        pos.setXYZ(1, drop.x, drop.y - DROP_LENGTH, drop.z);
        pos.needsUpdate = true;
      }
    }

    _thunderTimer -= dt;
    if (_thunderTimer <= 0) {
      _playThunder();
      _thunderTimer = _rand(15, 30);
    }

    if (Math.random() < 0.005) {
      _createCamDroplets();
    }

    _updateSplashes(dt);
    _checkMudEffect();
  }

  // ── Reset ────────────────────────────────────────────────────
  function reset() {
    stopRain();
    _removePuddles();
    _removeCamDroplets();
    _removeHudBadge();
    _removeScreenBlur();
    _restoreFog();
    _removeUavEffect();
    _origFogFar = null;
    _audioCtx = null;
    _canvas = null;
    window._mudSpeedFactor = 1.0;
    window._isRaining = false;
    window._uavRainReduction = 1.0;
    _nextRainIn = _rand(120, 300);
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    init: init,
    update: update,
    startRain: startRain,
    stopRain: stopRain,
    reset: reset
  };

})();
