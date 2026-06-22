window.EnemyFlamethrower = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _enemies = [];
  var _particles = [];
  var _waveCheckTimer = 0;
  var _spawnCooldown = 0;
  var _audioCtx = null;
  var _roarNodes = [];

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _playFlameSound() {
    try {
      var ctx = _getAudioCtx();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'bandpass'; filt.frequency.value = 600; filt.Q.value = 0.5;
      var gain = ctx.createGain();
      gain.gain.value = 0.15;
      src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  }

  function _buildMesh() {
    var group = new THREE.Group();

    var torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x3D2200 });
    var torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = 0.7;
    group.add(torso);

    var tankGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8);
    var tankMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var tank1 = new THREE.Mesh(tankGeo, tankMat);
    tank1.position.set(-0.22, 0.72, -0.2);
    tank1.rotation.z = 0.1;
    group.add(tank1);
    var tank2 = new THREE.Mesh(tankGeo, tankMat);
    tank2.position.set(0.22, 0.72, -0.2);
    tank2.rotation.z = -0.1;
    group.add(tank2);

    var helmetGeo = new THREE.BoxGeometry(0.34, 0.3, 0.34);
    var helmetMat = new THREE.MeshLambertMaterial({ color: 0x1A1A00 });
    var helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 1.2;
    group.add(helmet);

    var visorGeo = new THREE.BoxGeometry(0.28, 0.12, 0.08);
    var visorMat = new THREE.MeshLambertMaterial({ color: 0xFF6600, emissive: 0xFF3300 });
    var visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.2, 0.17);
    group.add(visor);

    var legMat = new THREE.MeshLambertMaterial({ color: 0x2A1A00 });
    [-0.12, 0.12].forEach(function(lx) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.22), legMat);
      leg.position.set(lx, 0.25, 0);
      group.add(leg);
    });

    var armMat = new THREE.MeshLambertMaterial({ color: 0x3D2200 });
    var armR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.2), armMat);
    armR.position.set(0.38, 0.68, 0);
    group.add(armR);
    var armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.2), armMat);
    armL.position.set(-0.38, 0.68, 0);
    group.add(armL);

    var nozzleGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.7, 6);
    var nozzleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(0.75, 0.68, 0.15);
    group.add(nozzle);

    var light = new THREE.PointLight(0xFF4400, 0, 6);
    light.position.set(0.8, 0.7, 0.15);
    group.add(light);

    group.userData.nozzleTip = new THREE.Vector3(1.1, 0.68, 0.15);
    group.userData.flameLight = light;

    return group;
  }

  function _spawnFlameParticles(e, dt) {
    if (!e.firing || !_scene) return;

    var worldTip = new THREE.Vector3();
    worldTip.copy(e.mesh.userData.nozzleTip);
    worldTip.applyMatrix4(e.mesh.matrixWorld);

    var dir = new THREE.Vector3();
    dir.subVectors(e.mesh.position, e.target.position).normalize().negate();
    dir.y = 0.15;

    var count = Math.ceil(12 * dt);
    for (var i = 0; i < count; i++) {
      var size = 0.15 + Math.random() * 0.25;
      var p = new THREE.Mesh(
        new THREE.SphereGeometry(size, 4, 4),
        new THREE.MeshLambertMaterial({
          color: Math.random() > 0.4 ? 0xFF5500 : 0xFFAA00,
          transparent: true, opacity: 0.85
        })
      );
      p.position.copy(worldTip);
      p.position.x += (Math.random() - 0.5) * 0.15;
      p.position.z += (Math.random() - 0.5) * 0.15;
      _scene.add(p);

      var speed = 5 + Math.random() * 4;
      _particles.push({
        mesh: p,
        vel: {
          x: dir.x * speed + (Math.random() - 0.5) * 2,
          y: dir.y * speed + Math.random() * 1.5,
          z: dir.z * speed + (Math.random() - 0.5) * 2
        },
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.5 + Math.random() * 0.4
      });
    }
  }

  function _checkFlameHit(e) {
    var player = window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
    if (!player || player.hp === undefined) return;
    var px = player.position ? player.position.x : 0;
    var pz = player.position ? player.position.z : 0;
    var dx = px - e.mesh.position.x;
    var dz = pz - e.mesh.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < e.flameRange && dist > 0) {
      var dmg = 12 * (1 - dist / e.flameRange);
      player.hp = Math.max(0, player.hp - dmg);
      if (window.HUD && window.HUD.setHealth) window.HUD.setHealth(player.hp);
      if (window._onPlayerDamage) window._onPlayerDamage(dmg, e.mesh);
      if (!window._playerOnFire) {
        window._playerOnFire = true;
        setTimeout(function() { window._playerOnFire = false; }, 3000);
      }
    }
  }

  function spawn(x, z) {
    if (!_scene) return null;
    var mesh = _buildMesh();
    var spawnX = x !== undefined ? x : (Math.random() - 0.5) * 60;
    var spawnZ = z !== undefined ? z : (Math.random() - 0.5) * 60;
    mesh.position.set(spawnX, 0, spawnZ);
    _scene.add(mesh);

    var e = {
      mesh: mesh,
      hp: 200,
      maxHp: 200,
      state: 'idle',
      moveSpeed: 2.2,
      flameRange: 8,
      fireDuration: 0,
      fireTimer: 0,
      fireCooldown: 4 + Math.random() * 2,
      burnTimer: 0,
      firing: false,
      target: null,
      alive: true
    };
    _enemies.push(e);

    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast('FLAMETHROWER ENEMY SPOTTED');
    }
    return e;
  }

  function _getPlayer() {
    return window.player || (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer());
  }

  function _updateEnemy(e, dt) {
    if (!e.alive) return;
    var player = _getPlayer();
    if (!player) return;
    var pp = player.position || { x: 0, y: 1.7, z: 0 };
    e.target = { position: pp };

    var dx = pp.x - e.mesh.position.x;
    var dz = pp.z - e.mesh.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    e.mesh.lookAt(new THREE.Vector3(pp.x, e.mesh.position.y, pp.z));
    e.mesh.rotation.y += Math.PI;

    if (dist > e.flameRange + 1) {
      e.mesh.position.x += (dx / dist) * e.moveSpeed * dt;
      e.mesh.position.z += (dz / dist) * e.moveSpeed * dt;
      e.firing = false;
      e.state = 'approach';
      if (e.mesh.userData.flameLight) e.mesh.userData.flameLight.intensity = 0;
    } else if (dist <= e.flameRange) {
      e.state = 'firing';
      e.fireTimer -= dt;
      if (e.fireTimer <= 0) {
        e.firing = !e.firing;
        if (e.firing) {
          e.fireTimer = e.fireDuration || (2 + Math.random());
          e.fireDuration = e.fireTimer;
        } else {
          e.fireTimer = e.fireCooldown;
        }
      }
      if (e.firing) {
        _spawnFlameParticles(e, dt);
        e.burnTimer -= dt;
        if (e.burnTimer <= 0) {
          e.burnTimer = 0.1;
          _checkFlameHit(e);
          _playFlameSound();
        }
        var fl = e.mesh.userData.flameLight;
        if (fl) fl.intensity = 3 + Math.random() * 2;
      } else {
        var fl2 = e.mesh.userData.flameLight;
        if (fl2) fl2.intensity = 0;
      }
    } else {
      e.firing = false;
      var fl3 = e.mesh.userData.flameLight;
      if (fl3) fl3.intensity = 0;
    }

    var legs = [];
    e.mesh.children.forEach(function(c) {
      if (c.position.y < 0.4) legs.push(c);
    });
    var legSwing = Math.sin(Date.now() * (e.state === 'approach' ? 0.008 : 0.003)) * 0.3;
    if (legs[0]) legs[0].rotation.x = legSwing;
    if (legs[1]) legs[1].rotation.x = -legSwing;
  }

  function _damageEnemy(e, dmg) {
    if (!e.alive) return;
    e.hp -= dmg;
    if (e.hp <= 0) {
      e.alive = false;
      e.firing = false;
      if (e.mesh.userData.flameLight) e.mesh.userData.flameLight.intensity = 0;
      _scene.remove(e.mesh);

      var player = _getPlayer();
      if (player && player.score !== undefined) {
        player.score += 700;
        if (window.HUD && window.HUD.setScore) window.HUD.setScore(player.score);
      }
      if (window._onEnemyKilled) window._onEnemyKilled(e);
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('+700 FLAMETHROWER DOWN');
    }
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _enemies = [];
    _particles = [];
    window._flamethrowerEnemies = _enemies;

    var prevHit = window._onBulletHit;
    window._onBulletHit = function(mesh, dmg) {
      if (prevHit) prevHit(mesh, dmg);
      for (var i = 0; i < _enemies.length; i++) {
        var e = _enemies[i];
        if (e.mesh === mesh || (mesh && e.mesh && mesh.parent === e.mesh)) {
          _damageEnemy(e, dmg || 25);
        }
      }
    };
  }

  function update(dt) {
    if (!_scene) return;

    _waveCheckTimer -= dt;
    if (_waveCheckTimer <= 0) {
      _waveCheckTimer = 6;
      var wave = (window.GameManager && window.GameManager.getCurrentWave) ?
        window.GameManager.getCurrentWave() : (window._waveNum || 1);
      if (wave >= 9) {
        _spawnCooldown -= 6;
        if (_spawnCooldown <= 0) {
          var aliveCount = 0;
          for (var k = 0; k < _enemies.length; k++) if (_enemies[k].alive) aliveCount++;
          if (aliveCount < 2) {
            var ang = Math.random() * Math.PI * 2;
            var rad = 35 + Math.random() * 10;
            spawn(Math.cos(ang) * rad, Math.sin(ang) * rad);
            _spawnCooldown = 18;
          }
        }
      }
    }

    for (var i = _enemies.length - 1; i >= 0; i--) {
      var e = _enemies[i];
      if (!e.alive) { _enemies.splice(i, 1); continue; }
      _updateEnemy(e, dt);
    }

    for (var j = _particles.length - 1; j >= 0; j--) {
      var p = _particles[j];
      p.life -= dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.vel.y += 0.5 * dt;
      var progress = 1 - p.life / p.maxLife;
      var opacity = 0.85 * (1 - progress);
      p.mesh.material.opacity = opacity;
      p.mesh.material.color.setHex(progress < 0.4 ? 0xFF5500 : 0x882200);
      p.mesh.scale.setScalar(1 + progress * 1.5);
      if (p.life <= 0) {
        _scene.remove(p.mesh);
        _particles.splice(j, 1);
      }
    }
  }

  function reset() {
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].mesh) _scene && _scene.remove(_enemies[i].mesh);
    }
    for (var j = 0; j < _particles.length; j++) {
      _scene && _scene.remove(_particles[j].mesh);
    }
    _enemies = [];
    _particles = [];
    window._flamethrowerEnemies = [];
  }

  return { init: init, update: update, spawn: spawn, reset: reset };
})();
