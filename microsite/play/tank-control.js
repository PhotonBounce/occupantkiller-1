window.TankControl = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _tank = null;
  var _mounted = false;
  var _tankHP = 500;
  var _tankMaxHP = 500;
  var _turretGroup = null;
  var _barrelGroup = null;
  var _mainGunCooldown = 0;
  var _mgCooldown = 0;
  var _speed = 0;
  var _turnSpeed = 0;
  var _turretAngle = 0;
  var _smokeActive = false;
  var _audioCtx = null;
  var _engineNode = null;
  var _hpBar = null;
  var _mountPrompt = null;
  var _hud = null;
  var _shells = [];
  var _explosions = [];
  var _keys = {};

  var TANK_SPEED = 5;
  var TANK_TURN = 1.2;
  var MAIN_GUN_COOLDOWN = 3.5;
  var MG_COOLDOWN = 0.12;
  var MAIN_GUN_DAMAGE = 120;
  var MG_DAMAGE = 18;
  var MOUNT_RANGE = 3;

  function _getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioCtx;
  }

  function _startEngine() {
    try {
      var ctx = _getAudioCtx();
      _engineNode = ctx.createOscillator();
      var gain = ctx.createGain();
      var distort = ctx.createWaveShaper();
      var curve = new Float32Array(256);
      for (var i = 0; i < 256; i++) {
        var x = (i * 2) / 256 - 1;
        curve[i] = (Math.PI + 400) * x / (Math.PI + 400 * Math.abs(x));
      }
      distort.curve = curve;
      _engineNode.connect(distort);
      distort.connect(gain);
      gain.connect(ctx.destination);
      _engineNode.frequency.value = 45;
      _engineNode.type = 'sawtooth';
      gain.gain.value = 0.08;
      _engineNode.start();
      window._tankEngineGain = gain;
    } catch(e) {}
  }

  function _stopEngine() {
    try {
      if (_engineNode) { _engineNode.stop(); _engineNode = null; }
    } catch(e) {}
  }

  function _buildTank(x, y, z) {
    var group = new THREE.Group();

    var hullGeo = new THREE.BoxGeometry(2.4, 0.8, 3.6);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x4A5A2A });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.4;
    group.add(hull);

    var turretBase = new THREE.CylinderGeometry(0.7, 0.75, 0.5, 8);
    var turretMat = new THREE.MeshLambertMaterial({ color: 0x3A4A1A });
    _turretGroup = new THREE.Group();
    var turret = new THREE.Mesh(turretBase, turretMat);
    turret.position.y = 0;
    _turretGroup.add(turret);

    _barrelGroup = new THREE.Group();
    var barrelGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8);
    var barrelMesh = new THREE.Mesh(barrelGeo, new THREE.MeshLambertMaterial({color: 0x222222}));
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.z = 1.1;
    _barrelGroup.add(barrelMesh);
    _turretGroup.position.y = 1.05;
    _turretGroup.add(_barrelGroup);
    group.add(_turretGroup);

    var trackGeo = new THREE.BoxGeometry(0.3, 0.35, 3.6);
    var trackMat = new THREE.MeshLambertMaterial({ color: 0x1A1A0A });
    [-1.2, 1.2].forEach(function(sx) {
      var track = new THREE.Mesh(trackGeo, trackMat);
      track.position.set(sx, 0.1, 0);
      group.add(track);
    });

    group.position.set(x, y, z);
    group.userData.isTank = true;
    group.userData.tankRef = true;
    _scene.add(group);
    return group;
  }

  function _createHUD() {
    _hud = document.createElement('div');
    _hud.id = 'tank-hud';
    _hud.style.cssText = [
      'position:fixed', 'bottom:20px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)', 'color:#FFCC00', 'font-family:monospace',
      'font-size:13px', 'padding:8px 18px', 'border:1px solid #FFCC00',
      'border-radius:5px', 'display:none', 'z-index:900', 'text-align:center'
    ].join(';');
    document.body.appendChild(_hud);

    _hpBar = document.createElement('div');
    _hpBar.id = 'tank-hp-bar';
    _hpBar.style.cssText = [
      'position:fixed', 'bottom:52px', 'left:50%', 'transform:translateX(-50%)',
      'width:160px', 'height:8px', 'background:#333',
      'border:1px solid #FFCC00', 'display:none', 'z-index:900'
    ].join(';');
    var fill = document.createElement('div');
    fill.id = 'tank-hp-fill';
    fill.style.cssText = 'width:100%;height:100%;background:#44FF44;transition:width 0.2s';
    _hpBar.appendChild(fill);
    document.body.appendChild(_hpBar);

    _mountPrompt = document.createElement('div');
    _mountPrompt.id = 'tank-mount-prompt';
    _mountPrompt.style.cssText = [
      'position:fixed', 'bottom:140px', 'left:50%', 'transform:translateX(-50%)',
      'color:#FFFF88', 'font-family:monospace', 'font-size:15px',
      'display:none', 'z-index:900'
    ].join(';');
    _mountPrompt.textContent = '[F] MOUNT T-72';
    document.body.appendChild(_mountPrompt);
  }

  function _fireMainGun() {
    if (_mainGunCooldown > 0 || !_tank) return;
    _mainGunCooldown = MAIN_GUN_COOLDOWN;

    var dir = new THREE.Vector3(0, 0, 1);
    dir.applyQuaternion(_tank.quaternion);
    dir.applyAxisAngle(new THREE.Vector3(0,1,0), _turretAngle);

    var origin = _tank.position.clone();
    origin.y += 1.1;
    origin.add(dir.clone().multiplyScalar(1.5));

    var shellGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6);
    var shellMesh = new THREE.Mesh(shellGeo, new THREE.MeshLambertMaterial({color: 0xFFAA00, emissive: 0xFF6600}));
    shellMesh.position.copy(origin);
    shellMesh.lookAt(origin.clone().add(dir));
    shellMesh.rotateX(Math.PI / 2);
    _scene.add(shellMesh);

    var muzzle = new THREE.PointLight(0xFF6600, 8, 4);
    muzzle.position.copy(origin);
    _scene.add(muzzle);
    setTimeout(function() { _scene.remove(muzzle); }, 80);

    _shells.push({ mesh: shellMesh, vel: dir.clone().multiplyScalar(40), life: 3, damage: MAIN_GUN_DAMAGE });

    try {
      var ctx = _getAudioCtx();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var g = ctx.createGain();
      g.gain.value = 0.6;
      src.connect(g); g.connect(ctx.destination);
      src.start();
    } catch(e) {}
  }

  function _fireMG() {
    if (_mgCooldown > 0 || !_tank) return;
    _mgCooldown = MG_COOLDOWN;
    if (!window.Enemies || !window.Enemies.getAll) return;
    var player = window.player || (_camera && {position: _camera.position});
    if (!player) return;
    var enemies = window.Enemies.getAll();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.mesh) continue;
      var dx = e.mesh.position.x - player.position.x;
      var dz = e.mesh.position.z - player.position.z;
      var dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < 20) {
        if (window.Enemies.damage) window.Enemies.damage(e, MG_DAMAGE);
        break;
      }
    }
  }

  function _spawnExplosion(pos) {
    for (var i = 0; i < 8; i++) {
      var geo = new THREE.SphereGeometry(0.2 + Math.random()*0.3, 6, 6);
      var mat = new THREE.MeshLambertMaterial({color: Math.random() > 0.5 ? 0xFF6600 : 0xFFCC00, emissive: 0xFF4400});
      var m = new THREE.Mesh(geo, mat);
      m.position.copy(pos);
      var vx = (Math.random()-0.5)*6, vy = Math.random()*5+2, vz = (Math.random()-0.5)*6;
      _scene.add(m);
      _explosions.push({mesh: m, vel: new THREE.Vector3(vx, vy, vz), life: 1.2});
    }
    var light = new THREE.PointLight(0xFF6600, 6, 8);
    light.position.copy(pos);
    _scene.add(light);
    setTimeout(function() { _scene.remove(light); }, 300);
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _createHUD();

    var tankX = 10, tankZ = 10;
    _tank = _buildTank(tankX, 0.5, tankZ);
    _tankHP = _tankMaxHP;

    document.addEventListener('keydown', function(e) { _keys[e.code] = true; });
    document.addEventListener('keyup', function(e) { _keys[e.code] = false; });

    document.addEventListener('keydown', function(e) {
      if (e.code === 'KeyF' && !e.repeat) {
        if (!_mounted) {
          var player = window.player || (_camera && {position: _camera.position});
          if (player && _tank) {
            var dx = player.position.x - _tank.position.x;
            var dz = player.position.z - _tank.position.z;
            if (Math.sqrt(dx*dx + dz*dz) < MOUNT_RANGE) {
              _mounted = true;
              _startEngine();
              if (_hud) _hud.style.display = 'block';
              if (_hpBar) _hpBar.style.display = 'block';
              if (_mountPrompt) _mountPrompt.style.display = 'none';
              if (window.HUD && window.HUD.showToast) window.HUD.showToast('MOUNTED T-72 — WASD:MOVE Q/E:TURRET LClick:CANNON RClick:MG');
            }
          }
        } else {
          _mounted = false;
          _stopEngine();
          if (_hud) _hud.style.display = 'none';
          if (_hpBar) _hpBar.style.display = 'none';
          if (window.HUD && window.HUD.showToast) window.HUD.showToast('DISMOUNTED T-72');
        }
      }
      if (_mounted) {
        if (e.button === 0 || e.code === 'Mouse0' || e.code === 'KeyV') _fireMainGun();
        if (e.button === 2 || e.code === 'Mouse2') _fireMG();
      }
    });

    document.addEventListener('mousedown', function(e) {
      if (!_mounted) return;
      if (e.button === 0) _fireMainGun();
      if (e.button === 2) _fireMG();
    });

    window._tankRef = _tank;
    window._tankHP = _tankHP;
    window._tankMounted = false;
  }

  function update(dt) {
    if (!_tank) return;
    _mainGunCooldown = Math.max(0, _mainGunCooldown - dt);
    _mgCooldown = Math.max(0, _mgCooldown - dt);

    var player = window.player || (_camera && {position: _camera.position});

    if (!_mounted) {
      if (player) {
        var dx2 = player.position.x - _tank.position.x;
        var dz2 = player.position.z - _tank.position.z;
        var nearDist = Math.sqrt(dx2*dx2 + dz2*dz2);
        if (_mountPrompt) _mountPrompt.style.display = nearDist < MOUNT_RANGE ? 'block' : 'none';
      }
    }

    if (_mounted) {
      window._tankMounted = true;
      var moveZ = 0, turn = 0;
      if (_keys['KeyW'] || _keys['ArrowUp']) moveZ = 1;
      if (_keys['KeyS'] || _keys['ArrowDown']) moveZ = -1;
      if (_keys['KeyA'] || _keys['ArrowLeft']) turn = 1;
      if (_keys['KeyD'] || _keys['ArrowRight']) turn = -1;
      if (_keys['KeyQ']) _turretAngle += 1.2 * dt;
      if (_keys['KeyE']) _turretAngle -= 1.2 * dt;

      _speed = moveZ * TANK_SPEED;
      _turnSpeed = turn * TANK_TURN;
      _tank.rotation.y += _turnSpeed * dt;
      var fwd = new THREE.Vector3(0, 0, 1);
      fwd.applyAxisAngle(new THREE.Vector3(0,1,0), _tank.rotation.y);
      _tank.position.addScaledVector(fwd, _speed * dt);

      if (_turretGroup) _turretGroup.rotation.y = _turretAngle;

      if (player) {
        player.position.x = _tank.position.x;
        player.position.y = _tank.position.y + 1.5;
        player.position.z = _tank.position.z;
      }

      if (_hud) _hud.textContent = '🎯 MAIN: ' + (_mainGunCooldown > 0 ? _mainGunCooldown.toFixed(1)+'s' : 'READY') + '  MG: CLICK';
      if (_hpBar) {
        var fill = document.getElementById('tank-hp-fill');
        if (fill) {
          var pct = (_tankHP / _tankMaxHP * 100) + '%';
          fill.style.width = pct;
          fill.style.background = _tankHP > 250 ? '#44FF44' : _tankHP > 100 ? '#FFAA00' : '#FF4444';
        }
      }
    } else {
      window._tankMounted = false;
    }

    for (var i = _shells.length - 1; i >= 0; i--) {
      var shell = _shells[i];
      shell.mesh.position.addScaledVector(shell.vel, dt);
      shell.life -= dt;
      if (shell.life <= 0) {
        _spawnExplosion(shell.mesh.position.clone());
        _scene.remove(shell.mesh);
        _shells.splice(i, 1);
        continue;
      }
      if (window.Enemies && window.Enemies.getAll) {
        var enemies = window.Enemies.getAll();
        for (var j = 0; j < enemies.length; j++) {
          var en = enemies[j];
          if (!en || !en.mesh) continue;
          var ed = shell.mesh.position.distanceTo(en.mesh.position);
          if (ed < 2) {
            if (window.Enemies.damage) window.Enemies.damage(en, shell.damage);
            _spawnExplosion(shell.mesh.position.clone());
            _scene.remove(shell.mesh);
            _shells.splice(i, 1);
            break;
          }
        }
      }
    }

    for (var k = _explosions.length - 1; k >= 0; k--) {
      var exp = _explosions[k];
      exp.mesh.position.addScaledVector(exp.vel, dt);
      exp.vel.y -= 9.8 * dt;
      exp.life -= dt;
      exp.mesh.material.opacity = exp.life;
      if (exp.life <= 0) {
        _scene.remove(exp.mesh);
        _explosions.splice(k, 1);
      }
    }

    window._tankHP = _tankHP;
    window._tankRef = _tank;
  }

  function damageTank(amount) {
    _tankHP = Math.max(0, _tankHP - amount);
    if (_tankHP <= 0 && _tank) {
      _spawnExplosion(_tank.position.clone());
      if (_mounted) {
        _mounted = false;
        _stopEngine();
        if (_hud) _hud.style.display = 'none';
        if (_hpBar) _hpBar.style.display = 'none';
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('TANK DESTROYED!');
      }
      _scene.remove(_tank);
      _tank = null;
    }
  }

  function reset() {
    _mounted = false;
    _stopEngine();
    _shells = [];
    _explosions = [];
    _keys = {};
    _mainGunCooldown = 0;
    _mgCooldown = 0;
    if (_tank) { _scene.remove(_tank); _tank = null; }
    if (_hud) _hud.style.display = 'none';
    if (_hpBar) _hpBar.style.display = 'none';
    if (_mountPrompt) _mountPrompt.style.display = 'none';
    window._tankRef = null;
    window._tankMounted = false;
  }

  return { init: init, update: update, damageTank: damageTank, reset: reset };
})();
