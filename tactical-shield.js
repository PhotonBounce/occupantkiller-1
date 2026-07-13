window.TacticalShield = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _equipped = false;
  var _shieldMesh = null;
  var _shieldHP = 200;
  var _maxShieldHP = 200;
  var _blocking = false;
  var _bashCooldown = 0;
  var _hudEl = null;
  var _hpBarEl = null;
  var _crackParticles = [];
  var _audioCtx = null;
  var _active = false;

  var SHIELD_ABSORPTION = 0.85;
  var BASH_DAMAGE = 35;
  var BASH_RANGE = 2.2;

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playImpact(power) {
    try {
      var ctx = _getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 300 + power * 100;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  }

  function _playBash() {
    try {
      var ctx = _getAudioCtx();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 400;
      var gain = ctx.createGain();
      gain.gain.value = 0.5;
      src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }

  function _buildShieldMesh() {
    var group = new THREE.Group();

    var shieldGeo = new THREE.BoxGeometry(0.7, 1.2, 0.06);
    var shieldMat = new THREE.MeshLambertMaterial({
      color: 0x334455, transparent: true, opacity: 0.85
    });
    var shieldBody = new THREE.Mesh(shieldGeo, shieldMat);
    group.add(shieldBody);

    var rimGeo = new THREE.BoxGeometry(0.72, 1.22, 0.03);
    var rimMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
    var rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.z = -0.04;
    group.add(rim);

    var viewportGeo = new THREE.BoxGeometry(0.3, 0.25, 0.08);
    var viewportMat = new THREE.MeshLambertMaterial({
      color: 0x88AABB, transparent: true, opacity: 0.5
    });
    var viewport = new THREE.Mesh(viewportGeo, viewportMat);
    viewport.position.set(0, 0.25, 0.04);
    group.add(viewport);

    var handleGeo = new THREE.BoxGeometry(0.08, 0.4, 0.12);
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.15, -0.1, -0.08);
    group.add(handle);

    var boltMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var positions = [[-0.28, 0.5], [0.28, 0.5], [-0.28, -0.5], [0.28, -0.5]];
    for (var i = 0; i < positions.length; i++) {
      var bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 6), boltMat);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(positions[i][0], positions[i][1], 0);
      group.add(bolt);
    }

    group.userData.shieldBody = shieldBody;
    group.userData.shieldMat = shieldMat;
    return group;
  }

  function _createHUD() {
    var wrap = document.createElement('div');
    wrap.id = 'tactical-shield-hud';
    wrap.style.cssText = [
      'position:fixed', 'bottom:75px', 'left:50%', 'transform:translateX(-50%)',
      'font-family:monospace', 'font-size:12px', 'color:#4488BB',
      'text-align:center', 'pointer-events:none', 'z-index:900', 'display:none'
    ].join(';');

    _hudEl = document.createElement('div');
    _hudEl.textContent = '🛡 TACTICAL SHIELD';
    wrap.appendChild(_hudEl);

    var barWrap = document.createElement('div');
    barWrap.style.cssText = 'width:120px;height:4px;background:#222;margin:3px auto;border:1px solid #446688';
    _hpBarEl = document.createElement('div');
    _hpBarEl.style.cssText = 'height:100%;background:#4488BB;transition:width 0.1s';
    barWrap.appendChild(_hpBarEl);
    wrap.appendChild(barWrap);

    var hint = document.createElement('div');
    hint.style.cssText = 'color:#555;font-size:10px';
    hint.textContent = 'RMB: RAISE  R: BASH  P: STOW';
    wrap.appendChild(hint);

    document.body.appendChild(wrap);
    return wrap;
  }

  function _updateHUD() {
    var wrap = document.getElementById('tactical-shield-hud');
    if (!wrap) return;
    wrap.style.display = _equipped ? 'block' : 'none';
    if (_hpBarEl) {
      var pct = (_shieldHP / _maxShieldHP) * 100;
      _hpBarEl.style.width = pct + '%';
      _hpBarEl.style.background = pct > 50 ? '#4488BB' : pct > 25 ? '#FFAA00' : '#FF4444';
    }
    if (_hudEl) {
      _hudEl.textContent = '🛡 SHIELD ' + Math.ceil(_shieldHP) + '/' + _maxShieldHP +
        (_blocking ? ' [RAISED]' : '') + (_bashCooldown > 0 ? ' BASH: ' + Math.ceil(_bashCooldown) + 's' : '');
    }
  }

  function _positionShield() {
    if (!_shieldMesh || !_camera) return;
    var cam = _camera;
    var forward = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation);
    var right = new THREE.Vector3(1, 0, 0).applyEuler(cam.rotation);

    _shieldMesh.position.copy(cam.position);
    _shieldMesh.position.addScaledVector(forward, 0.5);
    _shieldMesh.position.addScaledVector(right, 0.35);
    _shieldMesh.position.y -= 0.2;

    if (_blocking) {
      _shieldMesh.rotation.copy(cam.rotation);
      _shieldMesh.rotation.y += Math.PI;
    } else {
      _shieldMesh.rotation.y = cam.rotation.y + Math.PI / 2;
      _shieldMesh.position.addScaledVector(right, -0.15);
      _shieldMesh.position.y -= 0.3;
    }
  }

  function _spawnCrackParticles(pos) {
    if (!_scene) return;
    for (var i = 0; i < 5; i++) {
      var p = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 0.02),
        new THREE.MeshLambertMaterial({ color: 0x88AABB })
      );
      p.position.copy(pos);
      _scene.add(p);
      _crackParticles.push({
        mesh: p,
        vel: { x: (Math.random() - 0.5) * 3, y: 1 + Math.random() * 2, z: (Math.random() - 0.5) * 3 },
        life: 0.8
      });
    }
  }

  function absorbDamage(rawDamage, hitPos) {
    if (!_equipped || !_blocking || _shieldHP <= 0) return rawDamage;
    var absorbed = rawDamage * SHIELD_ABSORPTION;
    _shieldHP = Math.max(0, _shieldHP - absorbed);
    _playImpact(absorbed / rawDamage);

    if (hitPos) _spawnCrackParticles(hitPos);

    if (_shieldHP <= 0) {
      _shieldHP = 0;
      _shatterShield();
    }
    return rawDamage * (1 - SHIELD_ABSORPTION);
  }

  function _shatterShield() {
    if (window.HUD && window.HUD.showToast) window.HUD.showToast('SHIELD DESTROYED');
    if (_shieldMesh && _scene) {
      _scene.remove(_shieldMesh);
      _shieldMesh = null;
    }
    _equipped = false;
    _blocking = false;
    setTimeout(function() {
      _shieldHP = _maxShieldHP;
    }, 30000);
  }

  function _bash() {
    if (_bashCooldown > 0 || !_equipped) return;
    _bashCooldown = 4;
    _playBash();

    if (window.Enemies && window.Enemies.getAll) {
      var cam = _camera;
      if (!cam) return;
      var forward = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation);
      var enemies = window.Enemies.getAll();
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || !e.mesh) continue;
        var dx = e.mesh.position.x - cam.position.x;
        var dz = e.mesh.position.z - cam.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        var dot = (dx / dist) * forward.x + (dz / dist) * forward.z;
        if (dist < BASH_RANGE && dot > 0.4) {
          if (e.takeDamage) e.takeDamage(BASH_DAMAGE);
          if (e.velocity) { e.velocity.x += forward.x * 5; e.velocity.z += forward.z * 5; }
          if (window.HUD && window.HUD.showToast) window.HUD.showToast('SHIELD BASH! ' + BASH_DAMAGE + ' DMG');
        }
      }
    }

    if (_shieldMesh) {
      var origZ = _shieldMesh.position.z;
      _shieldMesh.position.z += 0.3;
      setTimeout(function() { if (_shieldMesh) _shieldMesh.position.z = origZ; }, 150);
    }
  }

  function equip() {
    if (_shieldHP <= 0) {
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('SHIELD DESTROYED — RECHARGING');
      return;
    }
    _equipped = !_equipped;
    if (_equipped) {
      if (!_shieldMesh) _shieldMesh = _buildShieldMesh();
      _scene && _scene.add(_shieldMesh);
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('TACTICAL SHIELD EQUIPPED — RMB: RAISE');
    } else {
      if (_shieldMesh) _scene && _scene.remove(_shieldMesh);
      _blocking = false;
    }
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _shieldHP = _maxShieldHP;
    _equipped = false;
    _blocking = false;
    _createHUD();

    window._shieldAbsorbDamage = absorbDamage;
    window._tacticalShieldHP = _shieldHP;
    window._tacticalShieldEquipped = false;

    document.addEventListener('keydown', function(e) {
      if (e.code === 'KeyP' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        equip();
      }
      if (e.code === 'KeyR' && _equipped) {
        _bash();
      }
    });
    document.addEventListener('mousedown', function(e) {
      if (_equipped && e.button === 2) { _blocking = true; }
    });
    document.addEventListener('mouseup', function(e) {
      if (e.button === 2) { _blocking = false; }
    });
    document.addEventListener('contextmenu', function(e) { if (_equipped) e.preventDefault(); });
  }

  function update(dt) {
    if (!_scene) return;

    if (_bashCooldown > 0) _bashCooldown -= dt;

    for (var i = _crackParticles.length - 1; i >= 0; i--) {
      var p = _crackParticles[i];
      p.life -= dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.vel.y -= 9.8 * dt;
      if (p.life <= 0) { _scene.remove(p.mesh); _crackParticles.splice(i, 1); }
    }

    if (_equipped && _shieldMesh) {
      _positionShield();
      var tiltTarget = _blocking ? 0 : 0.3;
      _shieldMesh.rotation.z += (tiltTarget - _shieldMesh.rotation.z) * dt * 8;

      var shimmer = Math.sin(Date.now() * 0.005) * 0.05;
      if (_shieldMesh.userData.shieldMat) {
        _shieldMesh.userData.shieldMat.opacity = (_blocking ? 0.92 : 0.7) + shimmer;
      }
    }

    window._tacticalShieldHP = _shieldHP;
    window._tacticalShieldEquipped = _equipped && _blocking;
    _updateHUD();
  }

  function reset() {
    if (_shieldMesh && _scene) _scene.remove(_shieldMesh);
    _shieldMesh = null;
    _equipped = false;
    _blocking = false;
    _shieldHP = _maxShieldHP;
    for (var i = 0; i < _crackParticles.length; i++) {
      if (_crackParticles[i].mesh) _scene && _scene.remove(_crackParticles[i].mesh);
    }
    _crackParticles = [];
  }

  return { init: init, update: update, equip: equip, absorbDamage: absorbDamage, reset: reset };
})();
