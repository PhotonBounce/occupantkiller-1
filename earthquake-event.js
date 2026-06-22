window.EarthquakeEvent = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _active = false;
  var _timer = 0;
  var _cooldown = 0;
  var _shakeMag = 0;
  var _audioCtx = null;
  var _rumbleNode = null;
  var _rumbleGain = null;
  var _interval = 90;
  var _duration = 8;
  var _debrisPool = [];
  var _fallTimer = 0;
  var _screenShakeX = 0;
  var _screenShakeZ = 0;

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _startRumble() {
    try {
      var ctx = _getAudioCtx();
      _rumbleNode = ctx.createOscillator();
      _rumbleGain = ctx.createGain();
      var buf = ctx.createBuffer(1, ctx.sampleRate * _duration, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.min(1, i / (ctx.sampleRate * 0.5));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 80;
      src.connect(filter);
      filter.connect(_rumbleGain);
      _rumbleGain.connect(ctx.destination);
      _rumbleGain.gain.value = 0.5;
      src.start();
    } catch(e) {}
  }

  function _spawnDebris(camera) {
    var cx = camera ? camera.position.x : 0;
    var cz = camera ? camera.position.z : 0;
    for (var i = 0; i < 6; i++) {
      var size = 0.1 + Math.random() * 0.25;
      var geo = new THREE.BoxGeometry(size, size, size);
      var mat = new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? 0x888888 : 0x664422 });
      var m = new THREE.Mesh(geo, mat);
      m.position.set(
        cx + (Math.random() - 0.5) * 20,
        4 + Math.random() * 8,
        cz + (Math.random() - 0.5) * 20
      );
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      _scene.add(m);
      _debrisPool.push({
        mesh: m,
        vel: {
          x: (Math.random() - 0.5) * 3,
          y: Math.random() * 2,
          z: (Math.random() - 0.5) * 3
        },
        life: 3
      });
    }
  }

  function _triggerQuake() {
    if (_active) return;
    _active = true;
    _timer = _duration;
    _shakeMag = 0.18;
    _startRumble();
    _cooldown = _interval + Math.random() * 60;

    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('⚠️ EARTHQUAKE!');
    }

    if (window._scene && window._scene.fog) {
      window._scene.fog.far = Math.max(8, (window._scene.fog.far || 50) * 0.6);
    }

    if (window._onEarthquake) window._onEarthquake();
  }

  function _createHUD() {
    var hud = document.createElement('div');
    hud.id = 'earthquake-hud';
    hud.style.cssText = [
      'position:fixed', 'top:80px', 'left:50%', 'transform:translateX(-50%)',
      'color:#FF6600', 'font-family:monospace', 'font-size:18px',
      'font-weight:bold', 'text-shadow:0 0 8px #FF4400',
      'display:none', 'z-index:1500', 'pointer-events:none'
    ].join(';');
    hud.textContent = '⚠️ EARTHQUAKE';
    document.body.appendChild(hud);
    return hud;
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _cooldown = 30 + Math.random() * 60;
    _createHUD();
    window._earthquakeActive = false;
  }

  function update(dt) {
    if (!_scene) return;

    if (!_active) {
      _cooldown -= dt;
      if (_cooldown <= 0) {
        _triggerQuake();
      }
      return;
    }

    _timer -= dt;
    window._earthquakeActive = true;

    var progress = (_duration - _timer) / _duration;
    var envelope = Math.sin(progress * Math.PI);
    var shake = _shakeMag * envelope;

    if (_camera) {
      _screenShakeX = (Math.random() - 0.5) * 2 * shake;
      _screenShakeZ = (Math.random() - 0.5) * 2 * shake;
      _camera.position.x += _screenShakeX * 0.5;
      _camera.position.y += (Math.random() - 0.5) * shake * 0.3;
      _camera.rotation.z += (Math.random() - 0.5) * shake * 0.04;
    }

    _fallTimer -= dt;
    if (_fallTimer <= 0) {
      _fallTimer = 0.4;
      _spawnDebris(_camera);
    }

    for (var i = _debrisPool.length - 1; i >= 0; i--) {
      var d = _debrisPool[i];
      d.mesh.position.x += d.vel.x * dt;
      d.mesh.position.y += d.vel.y * dt;
      d.mesh.position.z += d.vel.z * dt;
      d.vel.y -= 9.8 * dt;
      d.mesh.rotation.x += 2 * dt;
      d.mesh.rotation.z += 1.5 * dt;
      d.life -= dt;
      if (d.mesh.position.y < -1 || d.life <= 0) {
        _scene.remove(d.mesh);
        _debrisPool.splice(i, 1);
      }
    }

    if (window.Enemies && window.Enemies.getAll) {
      var enemies = window.Enemies.getAll();
      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (e && e.mesh) {
          e.mesh.position.x += (Math.random() - 0.5) * shake * 0.08;
        }
      }
    }

    var hudEl = document.getElementById('earthquake-hud');
    if (hudEl) {
      hudEl.style.display = 'block';
      hudEl.style.transform = 'translateX(-50%) translate(' +
        ((Math.random() - 0.5) * 4) + 'px,' +
        ((Math.random() - 0.5) * 4) + 'px)';
    }

    if (_timer <= 0) {
      _active = false;
      window._earthquakeActive = false;
      _shakeMag = 0;
      if (hudEl) hudEl.style.display = 'none';

      if (window._scene && window._scene.fog) {
        window._scene.fog.far = 50;
      }

      for (var k = _debrisPool.length - 1; k >= 0; k--) {
        _scene.remove(_debrisPool[k].mesh);
      }
      _debrisPool = [];
    }
  }

  function trigger() {
    _cooldown = 0;
  }

  function reset() {
    _active = false;
    _timer = 0;
    _cooldown = 60;
    window._earthquakeActive = false;
    for (var i = _debrisPool.length - 1; i >= 0; i--) {
      if (_scene) _scene.remove(_debrisPool[i].mesh);
    }
    _debrisPool = [];
    var hud = document.getElementById('earthquake-hud');
    if (hud) hud.style.display = 'none';
  }

  return { init: init, update: update, trigger: trigger, reset: reset };
})();
