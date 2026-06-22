window.RiotShieldEnemy = (function() {
  'use strict';

  var _enemies = [];
  var _scene = null;
  var _camera = null;
  var _audioCtx = null;

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _enemies = [];
    window._riotShieldCount = 0;
  }

  function _getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return _audioCtx;
  }

  function _playMetallicClank() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(400, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.15);
  }

  function _createBulletHoleCanvas() {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(68,68,102,0.85)';
    ctx.fillRect(0, 0, 256, 256);
    return canvas;
  }

  function _addBulletHole(enemy, u, v) {
    var ctx = enemy.shieldCanvas.getContext('2d');
    var x = u * 256;
    var y = v * 256;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    enemy.shieldTexture.needsUpdate = true;
  }

  function _spawnShieldSpark(position) {
    if (!_scene) return;
    var light = new THREE.PointLight(0xFFDD00, 2, 3);
    light.position.copy(position);
    _scene.add(light);
    setTimeout(function() { _scene.remove(light); }, 50);
  }

  function _shatterShield(enemy) {
    if (!_scene || !enemy.shieldMesh) return;
    enemy.group.remove(enemy.shieldMesh);
    var worldPos = new THREE.Vector3();
    enemy.shieldMesh.getWorldPosition(worldPos);
    enemy.shieldMesh = null;
    var fragments = [];
    var i;
    for (i = 0; i < 7; i++) {
      var geo = new THREE.PlaneGeometry(0.2 + Math.random() * 0.2, 0.2 + Math.random() * 0.2);
      var mat = new THREE.MeshBasicMaterial({ color: 0x444466, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      var frag = new THREE.Mesh(geo, mat);
      frag.position.copy(worldPos);
      frag.position.x += (Math.random() - 0.5) * 0.6;
      frag.position.y += Math.random() * 1.1;
      frag.position.z += (Math.random() - 0.5) * 0.3;
      frag._vel = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2 + 1, (Math.random() - 0.5) * 3);
      frag._rot = new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
      frag._age = 0;
      _scene.add(frag);
      fragments.push(frag);
    }
    enemy.shieldFragments = fragments;
    enemy.shieldHP = 0;
    enemy.shieldBroken = true;
  }

  function _updateFragments(fragments, dt) {
    var i;
    for (i = fragments.length - 1; i >= 0; i--) {
      var frag = fragments[i];
      frag._age += dt;
      frag.position.x += frag._vel.x * dt;
      frag.position.y += frag._vel.y * dt;
      frag.position.z += frag._vel.z * dt;
      frag._vel.y -= 5 * dt;
      frag.rotation.x += frag._rot.x * dt;
      frag.rotation.y += frag._rot.y * dt;
      frag.rotation.z += frag._rot.z * dt;
      frag.material.opacity = Math.max(0, 0.9 - frag._age / 1.5);
      if (frag._age > 1.5) {
        if (_scene) _scene.remove(frag);
        fragments.splice(i, 1);
      }
    }
  }

  function spawnRiotShield(x, y, z) {
    if (!_scene) return null;

    var group = new THREE.Group();
    group.position.set(x, y, z);

    var bodyGeo = new THREE.BoxGeometry(0.5, 1.6, 0.3);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0;
    group.add(bodyMesh);

    var canvas = _createBulletHoleCanvas();
    var texture = new THREE.CanvasTexture(canvas);
    var shieldGeo = new THREE.BoxGeometry(0.6, 1.1, 0.06);
    var shieldMat = new THREE.MeshPhongMaterial({
      color: 0x444466,
      transparent: true,
      opacity: 0.82,
      shininess: 80,
      specular: 0x8888aa,
      map: texture
    });
    var shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.set(0, 0.1, 0.3);
    group.add(shieldMesh);

    _scene.add(group);

    var enemy = {
      group: group,
      bodyMesh: bodyMesh,
      shieldMesh: shieldMesh,
      shieldCanvas: canvas,
      shieldTexture: texture,
      hp: 120,
      shieldHP: 200,
      shieldBroken: false,
      shieldFragments: [],
      bashCooldown: 0,
      dead: false,
      deathTimer: 0,
      collapseStarted: false
    };

    _enemies.push(enemy);
    return enemy;
  }

  function _isFlankShot(enemy, playerPos) {
    var dx = playerPos.x - enemy.group.position.x;
    var dz = playerPos.z - enemy.group.position.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    var toPlayerX = dx / len;
    var toPlayerZ = dz / len;
    var fwdX = Math.sin(enemy.group.rotation.y);
    var fwdZ = Math.cos(enemy.group.rotation.y);
    var dot = fwdX * toPlayerX + fwdZ * toPlayerZ;
    var angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    return angle > Math.PI / 4;
  }

  function takeDamage(enemy, amount, playerPos) {
    if (enemy.dead) return;
    if (!enemy.shieldBroken && playerPos && !_isFlankShot(enemy, playerPos)) {
      enemy.shieldHP -= amount;
      if (enemy.shieldMesh) {
        var worldPos = new THREE.Vector3();
        enemy.shieldMesh.getWorldPosition(worldPos);
        _spawnShieldSpark(worldPos);
        _addBulletHole(enemy, Math.random(), Math.random());
      }
      if (enemy.shieldHP <= 0) {
        _shatterShield(enemy);
      }
    } else {
      enemy.hp -= amount;
      if (enemy.hp <= 0) {
        _killEnemy(enemy);
      }
    }
  }

  function _killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    enemy.deathTimer = 0;
    if (window.GameManager && window.GameManager.addScore) {
      window.GameManager.addScore(350);
    }
  }

  function _spawnFallingShield(pos, yRot) {
    if (!_scene) return;
    var i;
    for (i = 0; i < 2; i++) {
      (function(idx) {
        var geo = new THREE.PlaneGeometry(0.28, 1.0);
        var mat = new THREE.MeshBasicMaterial({ color: 0x444466, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
        var piece = new THREE.Mesh(geo, mat);
        piece.position.set(pos.x + (idx === 0 ? -0.15 : 0.15), pos.y, pos.z);
        var velX = (idx === 0 ? -0.5 : 0.5);
        var velY = 0.2;
        var velZ = 1.2;
        var rotX = 2 + Math.random();
        var rotY = (Math.random() - 0.5);
        var age = 0;
        _scene.add(piece);
        var interval = setInterval(function() {
          age += 0.016;
          piece.position.x += velX * 0.016;
          piece.position.y += velY * 0.016;
          piece.position.z += velZ * 0.016;
          velY -= 5 * 0.016;
          piece.rotation.x += rotX * 0.016;
          piece.rotation.y += rotY * 0.016;
          piece.material.opacity = Math.max(0, 0.85 - age / 1.5);
          if (age > 1.5) {
            if (_scene) _scene.remove(piece);
            clearInterval(interval);
          }
        }, 16);
      })(i);
    }
  }

  function _doDeathCollapse(enemy, dt) {
    enemy.deathTimer += dt;
    var t = Math.min(enemy.deathTimer / 0.6, 1);
    enemy.group.rotation.x = t * (Math.PI / 2);
    if (!enemy.collapseStarted && enemy.deathTimer > 0.1 && enemy.shieldMesh) {
      enemy.collapseStarted = true;
      var worldPos = new THREE.Vector3();
      enemy.shieldMesh.getWorldPosition(worldPos);
      var savedYRot = enemy.group.rotation.y;
      enemy.group.remove(enemy.shieldMesh);
      enemy.shieldMesh = null;
      _spawnFallingShield(worldPos, savedYRot);
    }
    if (enemy.deathTimer > 1.2) {
      _removeEnemy(enemy);
    }
  }

  function _removeEnemy(enemy) {
    if (_scene) _scene.remove(enemy.group);
    var idx = _enemies.indexOf(enemy);
    if (idx !== -1) _enemies.splice(idx, 1);
  }

  function _doShieldBash(enemy, playerPos) {
    _playMetallicClank();

    if (window.GameManager && window.GameManager.takeDamage) {
      window.GameManager.takeDamage(30);
    } else if (window.playerHP !== undefined) {
      window.playerHP -= 30;
    }

    if (window.CameraShake && window.CameraShake.shake) {
      window.CameraShake.shake({ intensity: 0.6, duration: 0.4 });
    } else if (window.cameraShake) {
      window.cameraShake({ intensity: 0.6, duration: 0.4 });
    }

    var dx = playerPos.x - enemy.group.position.x;
    var dz = playerPos.z - enemy.group.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz) || 1;
    if (window.playerObject) {
      window.playerObject.position.x += (dx / dist) * 1.5;
      window.playerObject.position.z += (dz / dist) * 1.5;
    } else if (window.camera) {
      window.camera.position.x += (dx / dist) * 1.5;
      window.camera.position.z += (dz / dist) * 1.5;
    }
  }

  function update(dt, playerPos) {
    if (!playerPos) return;
    window._riotShieldCount = _enemies.length;

    var i;
    for (i = _enemies.length - 1; i >= 0; i--) {
      var enemy = _enemies[i];

      if (enemy.shieldFragments && enemy.shieldFragments.length > 0) {
        _updateFragments(enemy.shieldFragments, dt);
      }

      if (enemy.dead) {
        _doDeathCollapse(enemy, dt);
        continue;
      }

      var dx = playerPos.x - enemy.group.position.x;
      var dz = playerPos.z - enemy.group.position.z;
      var angle = Math.atan2(dx, dz);
      enemy.group.rotation.y = angle;

      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 3) {
        var speed = 2;
        enemy.group.position.x += (dx / dist) * speed * dt;
        enemy.group.position.z += (dz / dist) * speed * dt;
      } else {
        if (enemy.bashCooldown <= 0) {
          _doShieldBash(enemy, playerPos);
          enemy.bashCooldown = 3;
        }
      }

      if (enemy.bashCooldown > 0) {
        enemy.bashCooldown -= dt;
      }
    }
  }

  function reset() {
    var i;
    for (i = 0; i < _enemies.length; i++) {
      if (_scene) _scene.remove(_enemies[i].group);
    }
    _enemies = [];
    window._riotShieldCount = 0;
  }

  return { init: init, update: update, spawnRiotShield: spawnRiotShield, reset: reset, takeDamage: takeDamage };
})();
