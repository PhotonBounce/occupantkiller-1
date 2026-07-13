window.Flashbang = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _grenades = [];
  var _charges = 2;
  var _cooldown = 0;
  var _COOLDOWN = 20;
  var _MAX_CHARGES = 2;
  var _audioCtx = null;
  var _overlay = null;
  var _hudEl = null;

  function _getAudio() {
    if (!_audioCtx) _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function _playThrow() {
    try {
      var ctx = _getAudio();
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = 320;
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
  }

  function _playBang() {
    try {
      var ctx = _getAudio();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'highpass'; filt.frequency.value = 2000;
      var g = ctx.createGain();
      src.connect(filt); filt.connect(g); g.connect(ctx.destination);
      g.gain.value = 1.0;
      src.start();

      // High pitch ring after bang
      var ring = ctx.createOscillator();
      var rg = ctx.createGain();
      ring.connect(rg); rg.connect(ctx.destination);
      ring.frequency.value = 4000;
      rg.gain.setValueAtTime(0.3, ctx.currentTime + 0.1);
      rg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);
      ring.start(ctx.currentTime + 0.1);
      ring.stop(ctx.currentTime + 3.0);
    } catch(e) {}
  }

  function _createOverlay() {
    if (_overlay) return;
    _overlay = document.createElement('div');
    _overlay.id = 'flashbang-overlay';
    _overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:white;pointer-events:none;z-index:2500;opacity:0;transition:opacity 0.08s';
    document.body.appendChild(_overlay);
  }

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'flashbang-hud';
    _hudEl.style.cssText = 'position:fixed;bottom:160px;right:16px;color:#FFFFFF;font-family:monospace;font-size:13px;font-weight:bold;text-shadow:1px 1px 2px #000;z-index:1400;pointer-events:none';
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var icons = '';
    for (var i = 0; i < _MAX_CHARGES; i++) icons += i < _charges ? '💥' : '○';
    var cdText = _cooldown > 0 ? ' ' + Math.ceil(_cooldown) + 's' : '';
    _hudEl.textContent = 'FLASH ' + icons + cdText;
  }

  function _flashScreen(intensity) {
    if (!_overlay) return;
    _overlay.style.transition = 'opacity 0.08s';
    _overlay.style.opacity = String(Math.min(1, intensity));
    var fadeTime = 1.5 + intensity * 2.0;
    setTimeout(function() {
      _overlay.style.transition = 'opacity ' + fadeTime + 's';
      _overlay.style.opacity = '0';
    }, 80);
  }

  function _blindEnemies(pos, radius) {
    if (!window.Enemies || !window.Enemies.getAll) return;
    var enemies = window.Enemies.getAll();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh) continue;
      var dx = e.mesh.position.x - pos.x;
      var dz = e.mesh.position.z - pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius) {
        var intensity = 1.0 - (dist / radius);
        var blindTime = 2.0 + intensity * 4.0;
        e._flashBlinded = true;
        e._flashBlindTimer = blindTime;
        e._flashIntensity = intensity;
        // Slow movement during blind
        if (!e._origSpeed) e._origSpeed = e.speed || 3;
        e.speed = (e._origSpeed || 3) * (1.0 - intensity * 0.7);
      }
    }
  }

  function _throwGrenade() {
    if (_charges <= 0 || _cooldown > 0) {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(_charges <= 0 ? 'NO FLASHBANGS' : 'FLASHBANG RECHARGING');
      }
      return;
    }

    var cam = _camera || window._camera;
    if (!cam) return;

    _charges--;
    if (_charges === 0) _cooldown = _COOLDOWN;
    _playThrow();

    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
    var startPos = cam.position.clone().add(new THREE.Vector3(0, -0.3, 0));

    var geo = new THREE.SphereGeometry(0.08, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    (_scene || window._gameScene || window._scene).add(mesh);

    _grenades.push({
      mesh: mesh,
      vel: {
        x: dir.x * 14 + (Math.random() - 0.5) * 0.5,
        y: dir.y * 14 + 3,
        z: dir.z * 14 + (Math.random() - 0.5) * 0.5
      },
      timer: 1.8,
      exploded: false
    });

    _updateHUD();
  }

  function _explode(g) {
    if (g.exploded) return;
    g.exploded = true;

    var pos = g.mesh.position.clone();
    var sc = _scene || window._gameScene || window._scene;

    // Flash sphere
    var flashGeo = new THREE.SphereGeometry(0.5, 8, 8);
    var flashMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 1.0 });
    var flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.position.copy(pos);
    sc.add(flashMesh);

    var flashLight = new THREE.PointLight(0xFFFFFF, 80, 30);
    flashLight.position.copy(pos);
    sc.add(flashLight);

    // Check player distance for screen flash
    var cam = _camera || window._camera;
    if (cam) {
      var dx = cam.position.x - pos.x;
      var dz = cam.position.z - pos.z;
      var playerDist = Math.sqrt(dx * dx + dz * dz);
      if (playerDist < 18) {
        var playerIntensity = Math.max(0, 1.0 - playerDist / 18);
        _flashScreen(playerIntensity);
        if (playerIntensity > 0.3) _playBang();
      }
    }

    _blindEnemies(pos, 16);

    if (window.HUD && window.HUD.showToast) window.HUD.showToast('FLASHBANG!');

    // Fade out flash mesh and light
    var fadeTimer = 0;
    var fadeInterval = setInterval(function() {
      fadeTimer += 0.05;
      flashMat.opacity = Math.max(0, 1.0 - fadeTimer * 10);
      flashLight.intensity = Math.max(0, 80 - fadeTimer * 1600);
      if (fadeTimer >= 0.1) {
        sc.remove(flashMesh);
        sc.remove(flashLight);
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene || window._scene;
    _camera = camera || window._camera;
    _createOverlay();
    _createHUD();
    _updateHUD();

    document.addEventListener('keydown', function(e) {
      if (e.code === 'AltLeft' && e.altKey) return;
      if (window._menuOpen || window._isPaused || window._inMenu) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (e.code === 'AltRight' || (e.altKey && e.code === 'KeyF')) {
        if (e.altKey && e.code === 'KeyF') {
          e.preventDefault();
          _throwGrenade();
        }
      }
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        _throwGrenade();
      }
    });
  }

  function update(dt) {
    if (!_scene && !window._gameScene) return;
    var sc = _scene || window._gameScene || window._scene;

    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown <= 0) {
        _cooldown = 0;
        _charges = Math.min(_charges + 1, _MAX_CHARGES);
        if (_charges < _MAX_CHARGES) _cooldown = _COOLDOWN;
        if (window.HUD && window.HUD.showToast && _charges > 0) window.HUD.showToast('FLASHBANG READY');
        _updateHUD();
      }
    }

    // Update enemy blind timers
    if (window.Enemies && window.Enemies.getAll) {
      var enemies = window.Enemies.getAll();
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || !e._flashBlinded) continue;
        e._flashBlindTimer -= dt;
        if (e._flashBlindTimer <= 0) {
          e._flashBlinded = false;
          if (e._origSpeed !== undefined) {
            e.speed = e._origSpeed;
          }
        }
      }
    }

    // Update grenade physics
    for (var j = _grenades.length - 1; j >= 0; j--) {
      var g = _grenades[j];
      g.mesh.position.x += g.vel.x * dt;
      g.mesh.position.y += g.vel.y * dt;
      g.mesh.position.z += g.vel.z * dt;
      g.vel.y -= 9.8 * dt;
      g.mesh.rotation.x += 8 * dt;

      // Bounce off ground
      if (g.mesh.position.y < 0.1) {
        g.mesh.position.y = 0.1;
        g.vel.y = Math.abs(g.vel.y) * 0.4;
        g.vel.x *= 0.7;
        g.vel.z *= 0.7;
      }

      g.timer -= dt;
      if (g.timer <= 0 && !g.exploded) {
        _explode(g);
        sc.remove(g.mesh);
        _grenades.splice(j, 1);
      }
    }
  }

  function reset() {
    var sc = _scene || window._gameScene || window._scene;
    for (var i = 0; i < _grenades.length; i++) {
      if (sc) sc.remove(_grenades[i].mesh);
    }
    _grenades = [];
    _charges = _MAX_CHARGES;
    _cooldown = 0;
    _updateHUD();
  }

  return { init: init, update: update, throw: _throwGrenade, reset: reset };
})();
