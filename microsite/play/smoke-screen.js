window.SmokeScreen = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _grenades = [];
  var _smokeClouds = [];
  var _charges = 3;
  var _cooldown = 0;
  var _COOLDOWN = 25;
  var _MAX_CHARGES = 3;
  var _hudEl = null;
  var _audioCtx = null;

  function _getAudio() {
    if (!_audioCtx) _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function _playHiss() {
    try {
      var ctx = _getAudio();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) {
        var env = Math.min(i / (ctx.sampleRate * 0.1), 1) * Math.exp(-i / (ctx.sampleRate * 0.3));
        d[i] = (Math.random() * 2 - 1) * env * 0.4;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'bandpass'; filt.frequency.value = 3000; filt.Q.value = 0.5;
      var g = ctx.createGain(); g.gain.value = 0.3;
      src.connect(filt); filt.connect(g); g.connect(ctx.destination);
      src.start();
    } catch(e) {}
  }

  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'smoke-screen-hud';
    _hudEl.style.cssText = 'position:fixed;bottom:180px;right:16px;color:#AAAAAA;font-family:monospace;font-size:13px;font-weight:bold;text-shadow:1px 1px 2px #000;z-index:1400;pointer-events:none';
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var icons = '';
    for (var i = 0; i < _MAX_CHARGES; i++) icons += i < _charges ? '💨' : '○';
    var cdText = _cooldown > 0 ? ' ' + Math.ceil(_cooldown) + 's' : '';
    _hudEl.textContent = 'SMOKE ' + icons + cdText;
  }

  function _spawnSmokeCloud(pos) {
    var sc = _scene || window._gameScene || window._scene;
    var cloudGroup = new THREE.Group();
    cloudGroup.position.copy(pos);
    cloudGroup.position.y = 0.5;

    var puffs = [];
    for (var i = 0; i < 12; i++) {
      var size = 0.6 + Math.random() * 0.8;
      var geo = new THREE.SphereGeometry(size, 6, 6);
      var mat = new THREE.MeshLambertMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      var puff = new THREE.Mesh(geo, mat);
      puff.position.set(
        (Math.random() - 0.5) * 3,
        Math.random() * 2,
        (Math.random() - 0.5) * 3
      );
      cloudGroup.add(puff);
      puffs.push({ mesh: puff, targetOpacity: 0.55 + Math.random() * 0.2, phase: Math.random() * Math.PI * 2 });
    }

    sc.add(cloudGroup);
    _smokeClouds.push({
      group: cloudGroup,
      puffs: puffs,
      life: 18,
      maxLife: 18,
      expanding: true,
      expandTimer: 2.0,
      radius: 4
    });

    _playHiss();
  }

  function _throwGrenade() {
    if (_charges <= 0 || _cooldown > 0) {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(_charges <= 0 ? 'NO SMOKE GRENADES' : 'SMOKE RECHARGING');
      }
      return;
    }

    var cam = _camera || window._camera;
    if (!cam) return;

    _charges--;
    if (_charges === 0) _cooldown = _COOLDOWN;
    _updateHUD();

    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
    var startPos = cam.position.clone().add(new THREE.Vector3(0, -0.3, 0));
    var sc = _scene || window._gameScene || window._scene;

    var geo = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    sc.add(mesh);

    _grenades.push({
      mesh: mesh,
      vel: {
        x: dir.x * 12 + (Math.random() - 0.5) * 0.5,
        y: dir.y * 12 + 4,
        z: dir.z * 12 + (Math.random() - 0.5) * 0.5
      },
      timer: 1.5,
      landed: false
    });
  }

  function _isInSmoke(pos) {
    for (var i = 0; i < _smokeClouds.length; i++) {
      var c = _smokeClouds[i];
      var dx = pos.x - c.group.position.x;
      var dz = pos.z - c.group.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < c.radius) return true;
    }
    return false;
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene || window._scene;
    _camera = camera || window._camera;
    _createHUD();
    _updateHUD();

    // Export smoke check for other systems
    window._isInSmoke = _isInSmoke;

    document.addEventListener('keydown', function(e) {
      if (window._menuOpen || window._isPaused || window._inMenu) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        _throwGrenade();
      }
    });
  }

  function update(dt) {
    var sc = _scene || window._gameScene || window._scene;
    if (!sc) return;

    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown <= 0) {
        _cooldown = 0;
        _charges = Math.min(_charges + 1, _MAX_CHARGES);
        if (_charges < _MAX_CHARGES) _cooldown = _COOLDOWN;
        _updateHUD();
        if (window.HUD && window.HUD.showToast && _charges > 0) window.HUD.showToast('SMOKE READY');
      }
    }

    // Grenade physics
    for (var j = _grenades.length - 1; j >= 0; j--) {
      var g = _grenades[j];
      g.mesh.position.x += g.vel.x * dt;
      g.mesh.position.y += g.vel.y * dt;
      g.mesh.position.z += g.vel.z * dt;
      g.vel.y -= 9.8 * dt;
      g.mesh.rotation.z += 5 * dt;

      if (g.mesh.position.y < 0.1 && !g.landed) {
        g.mesh.position.y = 0.1;
        g.vel.x *= 0.2;
        g.vel.z *= 0.2;
        g.vel.y = 0;
        g.landed = true;
      }

      g.timer -= dt;
      if (g.timer <= 0) {
        _spawnSmokeCloud(g.mesh.position.clone());
        sc.remove(g.mesh);
        _grenades.splice(j, 1);
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('SMOKE DEPLOYED');
      }
    }

    // Smoke cloud lifecycle
    var cam = _camera || window._camera;
    var playerInSmoke = cam ? _isInSmoke(cam.position) : false;

    // Screen effect for player in smoke
    var smokeEl = document.getElementById('smoke-screen-effect');
    if (!smokeEl && _smokeClouds.length > 0) {
      smokeEl = document.createElement('div');
      smokeEl.id = 'smoke-screen-effect';
      smokeEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1200;background:rgba(150,150,150,0);transition:background 0.5s';
      document.body.appendChild(smokeEl);
    }
    if (smokeEl) {
      smokeEl.style.background = playerInSmoke ? 'rgba(140,140,140,0.55)' : 'rgba(150,150,150,0)';
    }

    // Update enemy vision in smoke
    if (window.Enemies && window.Enemies.getAll) {
      var enemies = window.Enemies.getAll();
      for (var ei = 0; ei < enemies.length; ei++) {
        var e = enemies[ei];
        if (!e || !e.mesh) continue;
        e._inSmoke = _isInSmoke(e.mesh.position);
      }
    }

    for (var i = _smokeClouds.length - 1; i >= 0; i--) {
      var cloud = _smokeClouds[i];
      cloud.life -= dt;

      var lifePct = cloud.life / cloud.maxLife;
      var targetOp = lifePct > 0.2 ? 1.0 : lifePct / 0.2;

      if (cloud.expanding && cloud.expandTimer > 0) {
        cloud.expandTimer -= dt;
        var expandPct = 1.0 - (cloud.expandTimer / 2.0);
        cloud.group.scale.setScalar(0.2 + expandPct * 0.8);
      } else {
        cloud.expanding = false;
        cloud.group.scale.setScalar(1.0);
      }

      for (var pi = 0; pi < cloud.puffs.length; pi++) {
        var puff = cloud.puffs[pi];
        puff.mesh.material.opacity = puff.targetOpacity * targetOp;
        puff.mesh.position.y += 0.12 * dt;
        puff.mesh.rotation.y += 0.2 * dt;
      }

      if (cloud.life <= 0) {
        sc.remove(cloud.group);
        _smokeClouds.splice(i, 1);
      }
    }
  }

  function reset() {
    var sc = _scene || window._gameScene || window._scene;
    for (var i = 0; i < _grenades.length; i++) if (sc) sc.remove(_grenades[i].mesh);
    for (var j = 0; j < _smokeClouds.length; j++) if (sc) sc.remove(_smokeClouds[j].group);
    _grenades = [];
    _smokeClouds = [];
    _charges = _MAX_CHARGES;
    _cooldown = 0;
    _updateHUD();
  }

  return { init: init, update: update, throw: _throwGrenade, isInSmoke: _isInSmoke, reset: reset };
})();
