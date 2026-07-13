window.ClusterBomb = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _charges = 2;
  var _maxCharges = 2;
  var _cooldown = 0;
  var _cooldownMax = 70;
  var _activeBombs = [];
  var _submunitions = [];
  var _audioCtx = null;
  var _hudEl = null;

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playLaunch() {
    try {
      var ctx = _getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 300;
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.4);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    } catch(e) {}
  }

  function _playBurst() {
    try {
      var ctx = _getAudioCtx();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'bandpass'; filt.frequency.value = 400;
      var gain = ctx.createGain();
      gain.gain.value = 0.4;
      src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  }

  function _playExplosion() {
    try {
      var ctx = _getAudioCtx();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 0.5);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 150;
      var gain = ctx.createGain();
      gain.gain.value = 0.7;
      src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + 0.8);
    } catch(e) {}
  }

  function _spawnDebris(pos, count, color) {
    for (var i = 0; i < count; i++) {
      var size = 0.06 + Math.random() * 0.1;
      var mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshLambertMaterial({ color: color })
      );
      mesh.position.copy(pos);
      _scene.add(mesh);
      var vel = {
        x: (Math.random() - 0.5) * 8,
        y: 2 + Math.random() * 5,
        z: (Math.random() - 0.5) * 8
      };
      _submunitions.push({ mesh: mesh, vel: vel, life: 2.5, isDebris: true });
    }
  }

  function _blastAt(pos, damage, radius) {
    var player = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
    if (player && player.hp !== undefined) {
      var pdx = (player.position ? player.position.x : 0) - pos.x;
      var pdz = (player.position ? player.position.z : 0) - pos.z;
      var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pdist < radius) {
        var falloff = 1 - pdist / radius;
        var dmg = Math.floor(damage * falloff);
        if (dmg > 0) {
          player.hp = Math.max(0, player.hp - dmg);
          if (window.HUD && window.HUD.setHealth) window.HUD.setHealth(player.hp);
          if (window._onPlayerDamage) window._onPlayerDamage(dmg);
        }
      }
    }

    if (window.Enemies && window.Enemies.getAll) {
      var enemies = window.Enemies.getAll();
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || !e.mesh) continue;
        var edx = e.mesh.position.x - pos.x;
        var edz = e.mesh.position.z - pos.z;
        var edist = Math.sqrt(edx * edx + edz * edz);
        if (edist < radius) {
          var efalloff = 1 - edist / radius;
          var edmg = Math.floor(damage * efalloff);
          if (edmg > 0 && e.takeDamage) e.takeDamage(edmg);
          var kbAngle = Math.atan2(edz, edx);
          var kb = efalloff * 3;
          if (e.velocity) {
            e.velocity.x = (e.velocity.x || 0) + Math.cos(kbAngle) * kb;
            e.velocity.z = (e.velocity.z || 0) + Math.sin(kbAngle) * kb;
          }
        }
      }
    }

    var light = new THREE.PointLight(0xFF6600, 12, radius * 2.5);
    light.position.copy(pos);
    _scene.add(light);
    _submunitions.push({ mesh: light, vel: { x: 0, y: 0, z: 0 }, life: 0.25, isLight: true });
  }

  function _openCluster(pos) {
    _playBurst();
    var subCount = 8 + Math.floor(Math.random() * 5);
    for (var i = 0; i < subCount; i++) {
      var angle = (i / subCount) * Math.PI * 2 + Math.random() * 0.4;
      var speed = 4 + Math.random() * 3;
      var sub = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 4, 4),
        new THREE.MeshLambertMaterial({ color: 0xFF4400 })
      );
      sub.position.copy(pos);
      sub.position.y += 0.2;
      _scene.add(sub);

      var trailParts = [];
      for (var t = 0; t < 3; t++) {
        var tp = new THREE.Mesh(
          new THREE.SphereGeometry(0.04),
          new THREE.MeshLambertMaterial({ color: 0xFF8800, transparent: true, opacity: 0.6 })
        );
        tp.position.copy(sub.position);
        _scene.add(tp);
        trailParts.push({ mesh: tp, life: 0.5 });
      }

      _submunitions.push({
        mesh: sub,
        vel: {
          x: Math.cos(angle) * speed,
          y: 0.5 + Math.random() * 1.5,
          z: Math.sin(angle) * speed
        },
        life: 1.8 + Math.random() * 0.6,
        isSubmunition: true,
        damage: 55,
        blastRadius: 2.5,
        trail: trailParts,
        exploded: false
      });
    }
    _spawnDebris(pos, 6, 0x888888);

    var smokeLight = new THREE.PointLight(0xFF8800, 8, 8);
    smokeLight.position.copy(pos);
    _scene.add(smokeLight);
    _submunitions.push({ mesh: smokeLight, vel: { x: 0, y: 0, z: 0 }, life: 0.4, isLight: true });
  }

  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'cluster-hud';
    _hudEl.style.cssText = [
      'position:fixed', 'bottom:110px', 'right:20px',
      'font-family:monospace', 'font-size:13px', 'color:#FF8800',
      'text-shadow:0 0 6px #FF6600', 'display:none',
      'z-index:900', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    _hudEl.style.display = _charges > 0 || _cooldown > 0 ? 'block' : 'none';
    if (_cooldown > 0 && _charges < _maxCharges) {
      _hudEl.textContent = '💥 CLUSTER ×' + _charges + ' (' + Math.ceil(_cooldown) + 's)';
    } else {
      _hudEl.textContent = '💥 CLUSTER ×' + _charges;
    }
    _hudEl.style.color = _charges > 0 ? '#FF8800' : '#666';
  }

  function _throw() {
    if (_charges <= 0) {
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('NO CLUSTER BOMBS');
      return;
    }

    _charges--;
    if (_charges < _maxCharges && _cooldown <= 0) {
      _cooldown = _cooldownMax;
    }

    var cam = _camera || window._camera;
    var startPos = cam ? cam.position.clone() : new THREE.Vector3(0, 1.7, 0);
    var dir = new THREE.Vector3(0, 0, -1);
    if (cam) dir.applyEuler(cam.rotation);
    dir.normalize();

    var bomb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.35, 8),
      new THREE.MeshLambertMaterial({ color: 0x444422 })
    );
    bomb.position.copy(startPos);
    _scene.add(bomb);
    _playLaunch();

    _activeBombs.push({
      mesh: bomb,
      vel: {
        x: dir.x * 14,
        y: dir.y * 14 + 3,
        z: dir.z * 14
      },
      life: 3,
      fuseTimer: 1.4 + Math.random() * 0.3,
      opened: false
    });
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _charges = 2;
    _cooldown = 0;
    _activeBombs = [];
    _submunitions = [];
    _createHUD();
    _updateHUD();

    document.addEventListener('keydown', function(e) {
      if (e.code === 'KeyB' && e.shiftKey && e.ctrlKey) {
        e.preventDefault();
        _throw();
      }
    });
  }

  function update(dt) {
    if (!_scene) return;

    if (_cooldown > 0) {
      _cooldown -= dt;
      if (_cooldown <= 0) {
        _cooldown = 0;
        if (_charges < _maxCharges) {
          _charges++;
          if (_charges < _maxCharges) _cooldown = _cooldownMax;
          if (window.HUD && window.HUD.showToast) window.HUD.showToast('CLUSTER BOMB RECHARGED');
        }
      }
    }

    for (var i = _activeBombs.length - 1; i >= 0; i--) {
      var b = _activeBombs[i];
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;
      b.vel.y -= 9.8 * dt;
      b.mesh.rotation.x += 3 * dt;
      b.fuseTimer -= dt;
      b.life -= dt;

      if ((b.fuseTimer <= 0 || b.mesh.position.y < 0.5) && !b.opened) {
        b.opened = true;
        _openCluster(b.mesh.position);
        _scene.remove(b.mesh);
        _activeBombs.splice(i, 1);
        continue;
      }
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _activeBombs.splice(i, 1);
      }
    }

    for (var j = _submunitions.length - 1; j >= 0; j--) {
      var s = _submunitions[j];
      s.life -= dt;

      if (s.isDebris || s.isSubmunition) {
        s.mesh.position.x += s.vel.x * dt;
        s.mesh.position.y += s.vel.y * dt;
        s.mesh.position.z += s.vel.z * dt;
        if (!s.isDebris) s.vel.y -= 9.8 * dt;
        else s.vel.y -= 6 * dt;
        s.mesh.rotation.x += 2 * dt;
        s.mesh.rotation.z += 1.5 * dt;
      }

      if (s.isSubmunition && !s.exploded && (s.mesh.position.y < 0.3 || s.life < 0.1)) {
        s.exploded = true;
        _blastAt(s.mesh.position, s.damage, s.blastRadius);
        _spawnDebris(s.mesh.position, 3, 0xFF6600);
        _playExplosion();
        if (s.trail) {
          for (var t = 0; t < s.trail.length; t++) {
            _scene.remove(s.trail[t].mesh);
          }
        }
        _scene.remove(s.mesh);
        _submunitions.splice(j, 1);
        continue;
      }

      if (s.isLight && !s.isSubmunition) {
        s.mesh.intensity = Math.max(0, s.mesh.intensity - (12 / (s.life > 0 ? 0.4 : 0.01)) * dt);
      }

      if (s.life <= 0) {
        if (!s.isLight) _scene.remove(s.mesh);
        else if (s.isLight) { s.mesh.intensity = 0; _scene.remove(s.mesh); }
        _submunitions.splice(j, 1);
      }
    }

    _updateHUD();
  }

  function reset() {
    for (var i = 0; i < _activeBombs.length; i++) _scene && _scene.remove(_activeBombs[i].mesh);
    for (var j = 0; j < _submunitions.length; j++) {
      if (!_submunitions[j].isLight) _scene && _scene.remove(_submunitions[j].mesh);
    }
    _activeBombs = [];
    _submunitions = [];
    _charges = _maxCharges;
    _cooldown = 0;
  }

  return { init: init, update: update, reset: reset };
})();
