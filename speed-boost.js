window.SpeedBoost = (function() {
  'use strict';

  var _active = false;
  var _timer = 0;
  var _DURATION = 6;
  var _cooldown = 0;
  var _COOLDOWN = 45;
  var _hudEl = null;
  var _barEl = null;
  var _audioCtx = null;
  var _trailPool = [];
  var _syringePickup = null;
  var _syringeTimer = 0;
  var _scene = null;
  var _camera = null;
  var _borderEl = null;

  function _getAudio() {
    if (!_audioCtx) _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function _playWhoosh() {
    try {
      var ctx = _getAudio();
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.6);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    } catch(e) {}
  }

  function _playHeartbeat() {
    try {
      var ctx = _getAudio();
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = 80;
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    } catch(e) {}
  }

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'speed-boost-hud';
    _hudEl.style.cssText = 'position:fixed;top:170px;left:16px;color:#00FFFF;font-family:monospace;font-size:14px;font-weight:bold;text-shadow:0 0 8px #00AAFF;z-index:1400;pointer-events:none;display:none';
    document.body.appendChild(_hudEl);

    _barEl = document.createElement('div');
    _barEl.id = 'speed-boost-bar';
    _barEl.style.cssText = 'position:fixed;top:188px;left:16px;width:100px;height:4px;background:#113;z-index:1401;pointer-events:none;border-radius:2px;display:none';
    var fill = document.createElement('div');
    fill.id = 'speed-boost-fill';
    fill.style.cssText = 'height:100%;width:100%;background:#00FFFF;border-radius:2px;transition:background 0.2s';
    _barEl.appendChild(fill);
    document.body.appendChild(_barEl);

    // Border effect for speed sensation
    _borderEl = document.createElement('div');
    _borderEl.id = 'speed-boost-border';
    _borderEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1200;border:0px solid #00FFFF;transition:border-width 0.2s;box-shadow:none';
    document.body.appendChild(_borderEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_active) {
      _hudEl.style.display = 'block';
      _barEl.style.display = 'block';
      _hudEl.textContent = '⚡ SPEED ' + Math.ceil(_timer) + 's';
      var fill = document.getElementById('speed-boost-fill');
      if (fill) fill.style.width = Math.round((_timer / _DURATION) * 100) + '%';
      _hudEl.style.color = _timer < 1.5 ? '#FF8800' : '#00FFFF';
    } else if (_cooldown > 0) {
      _hudEl.style.display = 'block';
      _barEl.style.display = 'block';
      _hudEl.style.color = '#335566';
      _hudEl.textContent = '⚡ SPEED ' + Math.ceil(_cooldown) + 's';
      var fill2 = document.getElementById('speed-boost-fill');
      if (fill2) {
        fill2.style.width = Math.round((1 - _cooldown / _COOLDOWN) * 100) + '%';
        fill2.style.background = '#335566';
      }
    } else {
      _hudEl.style.display = 'none';
      _barEl.style.display = 'none';
    }
  }

  function _spawnTrail() {
    var cam = _camera || window._camera;
    var sc = _scene || window._gameScene || window._scene;
    if (!cam || !sc) return;
    var geo = new THREE.BoxGeometry(0.06, 0.06, 0.25);
    var mat = new THREE.MeshBasicMaterial({ color: 0x00CCFF, transparent: true, opacity: 0.8 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(cam.position);
    mesh.position.y -= 0.5;
    mesh.rotation.copy(cam.rotation);
    sc.add(mesh);
    _trailPool.push({ mesh: mesh, mat: mat, life: 0.4 });
  }

  function _spawnSyringe() {
    var sc = _scene || window._gameScene || window._scene;
    if (!sc) return;
    var cam = window._camera;
    var x = cam ? cam.position.x + (Math.random() - 0.5) * 20 : (Math.random() - 0.5) * 20;
    var z = cam ? cam.position.z + (Math.random() - 0.5) * 20 : (Math.random() - 0.5) * 20;
    var geo = new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF2244 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 1.2, z);
    var light = new THREE.PointLight(0xFF0044, 3, 3);
    light.position.copy(mesh.position);
    sc.add(mesh);
    sc.add(light);
    _syringePickup = { mesh: mesh, light: light, collected: false };
    _syringeTimer = 0;
  }

  function _activate() {
    if (_active || _cooldown > 0) {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(_cooldown > 0 ? 'SPEED BOOST RECHARGING' : 'ALREADY ACTIVE');
      }
      return;
    }
    _active = true;
    _timer = _DURATION;
    _cooldown = _COOLDOWN;
    window._speedBoostActive = true;
    window._speedBoostMult = 2.0;
    window._speedBoostTimer = _DURATION;

    // FOV change
    var cam = _camera || window._camera;
    if (cam && cam.fov !== undefined) {
      cam.fov = 90;
      cam.updateProjectionMatrix();
    }

    // Edge effect
    if (_borderEl) {
      _borderEl.style.boxShadow = 'inset 0 0 30px rgba(0,255,255,0.4)';
    }

    _playWhoosh();
    if (window.HUD && window.HUD.showToast) window.HUD.showToast('⚡ SPEED BOOST ACTIVE');
  }

  function _deactivate() {
    _active = false;
    window._speedBoostActive = false;
    window._speedBoostMult = 1.0;
    window._speedBoostTimer = 0;

    var cam = _camera || window._camera;
    if (cam && cam.fov !== undefined) {
      cam.fov = 75;
      cam.updateProjectionMatrix();
    }

    if (_borderEl) _borderEl.style.boxShadow = 'none';
    _updateHUD();
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene || window._scene;
    _camera = camera || window._camera;
    _createHUD();
    window._speedBoostActive = false;
    window._speedBoostMult = 1.0;
    window._speedBoostTimer = 0;

    document.addEventListener('keydown', function(e) {
      if (window._menuOpen || window._isPaused || window._inMenu) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        _activate();
      }
    });

    // Spawn first syringe after 30s
    setTimeout(_spawnSyringe, 30000);
  }

  function update(dt) {
    var sc = _scene || window._gameScene || window._scene;

    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown <= 0) {
        _cooldown = 0;
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('⚡ SPEED BOOST READY');
      }
    }

    if (_active) {
      _timer -= dt;
      window._speedBoostTimer = _timer;

      // Warning at 1.5s remaining
      if (_timer < 1.5 && _timer > 0) {
        if (Math.floor(_timer * 4) % 2 === 0) {
          if (window.HUD && window.HUD.showToast && Math.floor(_timer) !== Math.floor(_timer + dt)) {
            window.HUD.showToast('⚡ SPEED FADING');
          }
        }
      }

      // Heartbeat sound
      if (Math.floor(Date.now() / 500) % 2 === 0 && Math.floor((Date.now() + dt * 1000) / 500) % 2 !== 0) {
        _playHeartbeat();
      }

      // Trail particles
      _spawnTrail();

      // Camera shake
      var cam = _camera || window._camera;
      if (cam) {
        cam.position.x += (Math.random() - 0.5) * 0.006;
        cam.position.y += (Math.random() - 0.5) * 0.004;
      }

      if (_timer <= 0) _deactivate();
    }

    // Update trails
    for (var i = _trailPool.length - 1; i >= 0; i--) {
      var t = _trailPool[i];
      t.life -= dt;
      t.mat.opacity = Math.max(0, t.life / 0.4 * 0.8);
      if (t.life <= 0) {
        if (sc) sc.remove(t.mesh);
        _trailPool.splice(i, 1);
      }
    }

    // Syringe pickup check
    if (_syringePickup && !_syringePickup.collected) {
      _syringeTimer += dt;
      _syringePickup.mesh.rotation.y += 1.5 * dt;
      _syringePickup.mesh.position.y = 1.2 + Math.sin(_syringeTimer * 2) * 0.15;
      var cam2 = _camera || window._camera;
      if (cam2) {
        var dx = cam2.position.x - _syringePickup.mesh.position.x;
        var dz = cam2.position.z - _syringePickup.mesh.position.z;
        if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
          _syringePickup.collected = true;
          if (sc) { sc.remove(_syringePickup.mesh); sc.remove(_syringePickup.light); }
          _cooldown = 0;
          if (window.HUD && window.HUD.showToast) window.HUD.showToast('💉 ADRENALINE — SPEED READY');
          setTimeout(_spawnSyringe, 90000);
        }
      }
    }

    _updateHUD();
  }

  function reset() {
    _deactivate();
    _cooldown = 0;
    _syringePickup = null;
    for (var i = 0; i < _trailPool.length; i++) {
      var sc = _scene || window._gameScene || window._scene;
      if (sc) sc.remove(_trailPool[i].mesh);
    }
    _trailPool = [];
    _updateHUD();
  }

  return { init: init, update: update, activate: _activate, reset: reset };
})();
