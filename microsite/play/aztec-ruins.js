window.AztecRuins = (function() {
  'use strict';

  var _scene, _camera, _active = false;
  var _enemies = [], _projectiles = [], _traps = [];
  var _playerHP = 100, _artifacts = 0, _artifactsTotal = 5;
  var _priestKilled = false, _timer = 0, _timerLimit = 720;
  var _container, _hud, _crosshair;
  var _keys = {}, _mouseDX = 0, _mouseDY = 0;
  var _yaw = 0, _pitch = 0;
  var _velocity = { x: 0, y: 0, z: 0 };
  var _onGround = false;
  var _lastATime = 0, _lastZTime = 0;
  var ACTIVATION_MS = 400;
  var _altarActivated = false, _altarTimer = 0;
  var _gameOver = false, _gameWon = false;
  var _raycaster, _poisonDarts = [];
  var _lastShot = 0;
  var _platforms = [];
  var _sacrificeAltar, _godPriest;

  function buildWorld() {
    _scene.background = new THREE.Color(0x2a1a0a);
    _scene.fog = new THREE.FogExp2(0x3a2a10, 0.03);

    var amb = new THREE.AmbientLight(0x442200, 0.6);
    _scene.add(amb);
    var sun = new THREE.DirectionalLight(0xffaa44, 1.2);
    sun.position.set(20, 40, -10);
    _scene.add(sun);

    // Ground
    var groundG = new THREE.BoxGeometry(120, 1, 120);
    var groundM = new THREE.MeshLambertMaterial({ color: 0x5a3a10 });
    var ground = new THREE.Mesh(groundG, groundM);
    ground.position.set(0, -0.5, 0);
    _scene.add(ground);
    _platforms.push({ mesh: ground, y: 0, minX: -60, maxX: 60, minZ: -60, maxZ: 60 });

    // Main pyramid
    buildPyramid(0, 0, 0);

    // Temple structures
    buildTemple(-30, 0, -30);
    buildTemple(30, 0, -30);

    // Jungle trees
    for (var t = 0; t < 40; t++) {
      var tx = (Math.random() - 0.5) * 100;
      var tz = (Math.random() - 0.5) * 100;
      if (Math.abs(tx) < 15 && Math.abs(tz) < 15) continue;
      buildTree(tx, 0, tz);
    }

    // Artifacts (gold cubes with glow)
    var artifactPositions = [
      [0, 1, 25], [-20, 1, 10], [20, 1, 10], [-15, 5, -15], [15, 5, -15]
    ];
    for (var a = 0; a < artifactPositions.length; a++) {
      var ag = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      var am = new THREE.MeshLambertMaterial({ color: 0xffcc00, emissive: 0x886600 });
      var artMesh = new THREE.Mesh(ag, am);
      artMesh.position.set(artifactPositions[a][0], artifactPositions[a][1], artifactPositions[a][2]);
      artMesh.userData = { type: 'artifact', id: a };
      _scene.add(artMesh);
      _traps.push(artMesh);

      var aLight = new THREE.PointLight(0xffcc00, 1, 5);
      aLight.position.copy(artMesh.position);
      _scene.add(aLight);
    }

    // Poison dart traps
    var dartTrapPositions = [[-10, 1, 5], [10, 1, 5], [0, 1, 15], [-5, 1, -10], [5, 1, -10]];
    for (var d = 0; d < dartTrapPositions.length; d++) {
      var dtg = new THREE.BoxGeometry(0.3, 0.3, 1.5);
      var dtm = new THREE.MeshLambertMaterial({ color: 0x336633 });
      var dart = new THREE.Mesh(dtg, dtm);
      dart.position.set(dartTrapPositions[d][0], dartTrapPositions[d][1], dartTrapPositions[d][2]);
      dart.userData = { type: 'dartTrap', nextFire: 3 + d * 1.5, interval: 4, active: true };
      _scene.add(dart);
      _poisonDarts.push(dart);
    }

    // Sacrifice altar at top of pyramid
    var altarG = new THREE.BoxGeometry(4, 1.5, 4);
    var altarM = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    _sacrificeAltar = new THREE.Mesh(altarG, altarM);
    _sacrificeAltar.position.set(0, 16.75, -2);
    _scene.add(_sacrificeAltar);

    var altarLight = new THREE.PointLight(0xff2200, 2, 8);
    altarLight.position.copy(_sacrificeAltar.position);
    _scene.add(altarLight);

    // Spawn enemies
    spawnWarriors();
    spawnPriest();
  }

  function buildPyramid(ox, oy, oz) {
    var mat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var steps = [[18, 2, 18], [14, 2, 14], [10, 2, 10], [7, 2, 7], [5, 2, 5], [3, 2, 3]];
    var yOff = 0;
    for (var i = 0; i < steps.length; i++) {
      var sg = new THREE.BoxGeometry(steps[i][0], steps[i][1], steps[i][2]);
      var sm = new THREE.Mesh(sg, mat);
      sm.position.set(ox, oy + yOff + steps[i][1] / 2, oz);
      _scene.add(sm);
      var py = oy + yOff;
      _platforms.push({ mesh: sm, y: py + steps[i][1], minX: ox - steps[i][0] / 2, maxX: ox + steps[i][0] / 2, minZ: oz - steps[i][2] / 2, maxZ: oz + steps[i][2] / 2 });
      yOff += steps[i][1];
    }
    // Staircase up front face
    for (var s = 0; s < 12; s++) {
      var stairG = new THREE.BoxGeometry(2, 0.5, 1);
      var stairMesh = new THREE.Mesh(stairG, mat);
      stairMesh.position.set(ox, oy + s * 1.2 + 0.25, oz + 8 - s * 0.8);
      _scene.add(stairMesh);
      _platforms.push({ mesh: stairMesh, y: oy + s * 1.2 + 0.5, minX: ox - 1, maxX: ox + 1, minZ: oz + 8 - s * 0.8 - 0.5, maxZ: oz + 8 - s * 0.8 + 0.5 });
    }
  }

  function buildTemple(ox, oy, oz) {
    var mat = new THREE.MeshLambertMaterial({ color: 0x9B8465 });
    var baseG = new THREE.BoxGeometry(12, 8, 10);
    var base = new THREE.Mesh(baseG, mat);
    base.position.set(ox, oy + 4, oz);
    _scene.add(base);
    _platforms.push({ mesh: base, y: oy + 8, minX: ox - 6, maxX: ox + 6, minZ: oz - 5, maxZ: oz + 5 });

    var roofG = new THREE.BoxGeometry(13, 2, 11);
    var roof = new THREE.Mesh(roofG, mat);
    roof.position.set(ox, oy + 9, oz);
    _scene.add(roof);
    _platforms.push({ mesh: roof, y: oy + 10, minX: ox - 6.5, maxX: ox + 6.5, minZ: oz - 5.5, maxZ: oz + 5.5 });

    var lc = new THREE.PointLight(0xff6600, 1.5, 6);
    lc.position.set(ox, oy + 5, oz);
    _scene.add(lc);
  }

  function buildTree(ox, oy, oz) {
    var trunkG = new THREE.CylinderGeometry(0.3, 0.5, 5, 6);
    var trunkM = new THREE.MeshLambertMaterial({ color: 0x3a2010 });
    var trunk = new THREE.Mesh(trunkG, trunkM);
    trunk.position.set(ox, oy + 2.5, oz);
    _scene.add(trunk);
    var foliageG = new THREE.ConeGeometry(2.5, 5, 7);
    var foliageM = new THREE.MeshLambertMaterial({ color: 0x1a4a10 });
    var foliage = new THREE.Mesh(foliageG, foliageM);
    foliage.position.set(ox, oy + 7, oz);
    _scene.add(foliage);
  }

  function spawnWarriors() {
    var positions = [
      [10, 0, 20], [-10, 0, 20], [0, 0, -20], [15, 0, -5], [-15, 0, -5],
      [25, 0, 25], [-25, 0, 25], [0, 8, -30], [20, 0, 0], [-20, 0, 0]
    ];
    for (var i = 0; i < positions.length; i++) {
      spawnEnemy(positions[i][0], positions[i][1], positions[i][2], 'warrior', 60);
    }
  }

  function spawnPriest() {
    var pg = new THREE.BoxGeometry(1, 2, 0.6);
    var pm = new THREE.MeshLambertMaterial({ color: 0x7700aa });
    _godPriest = new THREE.Mesh(pg, pm);
    _godPriest.position.set(0, 17.5, -2);
    _godPriest.userData = { hp: 400, maxHP: 400, type: 'priest', phase: 1, attackTimer: 0 };
    _scene.add(_godPriest);
    var pl = new THREE.PointLight(0xaa00ff, 2, 6);
    pl.position.copy(_godPriest.position);
    _godPriest.userData.light = pl;
    _scene.add(pl);
    _enemies.push(_godPriest);
  }

  function spawnEnemy(x, y, z, type, hp) {
    var bodyG = new THREE.BoxGeometry(0.8, 1.6, 0.5);
    var bodyM = new THREE.MeshLambertMaterial({ color: type === 'warrior' ? 0xaa6622 : 0x7700aa });
    var enemy = new THREE.Mesh(bodyG, bodyM);
    enemy.position.set(x, y + 0.8, z);
    enemy.userData = { hp: hp, maxHP: hp, type: type, attackTimer: 2, patrol: true, angle: Math.random() * Math.PI * 2 };
    _scene.add(enemy);
    _enemies.push(enemy);
    return enemy;
  }

  function updateEnemies(delta) {
    var camPos = _camera.position;
    for (var i = _enemies.length - 1; i >= 0; i--) {
      var e = _enemies[i];
      if (!e.parent) { _enemies.splice(i, 1); continue; }
      if (e.userData.hp <= 0) {
        _scene.remove(e);
        if (e.userData.light) _scene.remove(e.userData.light);
        if (e === _godPriest) _priestKilled = true;
        _enemies.splice(i, 1);
        continue;
      }
      var dx = camPos.x - e.position.x;
      var dz = camPos.z - e.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      e.lookAt(camPos.x, e.position.y, camPos.z);
      if (dist < 25) {
        var speed = e.userData.type === 'priest' ? 2 : 4;
        e.position.x += (dx / dist) * speed * delta;
        e.position.z += (dz / dist) * speed * delta;
      }
      e.userData.attackTimer -= delta;
      if (dist < 2.5 && e.userData.attackTimer <= 0) {
        _playerHP -= e.userData.type === 'priest' ? 20 : 10;
        e.userData.attackTimer = 1.5;
        updateHUD();
      }
      if (e.userData.type === 'priest' && e.userData.light) {
        e.userData.light.position.copy(e.position);
      }
      // Priest phase 2
      if (e.userData.type === 'priest' && e.userData.hp < 200 && e.userData.phase === 1) {
        e.userData.phase = 2;
        e.material.color.setHex(0xff00ff);
        fireProjectile(e.position, camPos, 0xff00aa, 15);
      }
      // Priest fires projectiles
      if (e.userData.type === 'priest' && dist < 20) {
        e.userData.attackTimer -= delta;
        if (e.userData.attackTimer <= 0) {
          fireProjectile(e.position, camPos, 0xaa00ff, 8);
          e.userData.attackTimer = 2;
        }
      }
    }
  }

  function fireProjectile(from, to, color, dmg) {
    var pg = new THREE.SphereGeometry(0.2, 5, 5);
    var pm = new THREE.MeshLambertMaterial({ color: color, emissive: color });
    var proj = new THREE.Mesh(pg, pm);
    proj.position.copy(from);
    var dir = new THREE.Vector3(to.x - from.x, to.y - from.y, to.z - from.z).normalize();
    proj.userData = { vel: dir.multiplyScalar(12), dmg: dmg, life: 3 };
    _scene.add(proj);
    _projectiles.push(proj);
  }

  function updateProjectiles(delta) {
    for (var i = _projectiles.length - 1; i >= 0; i--) {
      var p = _projectiles[i];
      p.position.x += p.userData.vel.x * delta;
      p.position.y += p.userData.vel.y * delta;
      p.position.z += p.userData.vel.z * delta;
      p.userData.life -= delta;
      var d = p.position.distanceTo(_camera.position);
      if (d < 1.2) {
        _playerHP -= p.userData.dmg;
        _scene.remove(p);
        _projectiles.splice(i, 1);
        updateHUD();
        continue;
      }
      if (p.userData.life <= 0) {
        _scene.remove(p);
        _projectiles.splice(i, 1);
      }
    }
  }

  function updateDartTraps(delta) {
    for (var i = 0; i < _poisonDarts.length; i++) {
      var dt = _poisonDarts[i];
      if (!dt.userData.active) continue;
      dt.userData.nextFire -= delta;
      if (dt.userData.nextFire <= 0) {
        dt.userData.nextFire = dt.userData.interval;
        var d = dt.position.distanceTo(_camera.position);
        if (d < 12) {
          fireProjectile(dt.position, _camera.position, 0x00aa44, 5);
        }
      }
    }
  }

  function checkArtifacts() {
    for (var i = _traps.length - 1; i >= 0; i--) {
      var obj = _traps[i];
      if (obj.userData.type !== 'artifact') continue;
      var d = obj.position.distanceTo(_camera.position);
      if (d < 1.8) {
        _artifacts++;
        _scene.remove(obj);
        _traps.splice(i, 1);
        updateHUD();
      }
    }
  }

  function shoot() {
    var now = performance.now() / 1000;
    if (now - _lastShot < 0.25) return;
    _lastShot = now;
    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    var from = _camera.position.clone();
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      var d = e.position.distanceTo(from);
      if (d > 30) continue;
      var toE = e.position.clone().sub(from).normalize();
      if (dir.dot(toE) > 0.97) {
        e.userData.hp -= 25;
        break;
      }
    }
  }

  function updatePlayer(delta) {
    var speed = 8;
    var dir = new THREE.Vector3();
    var fwd = new THREE.Vector3(-Math.sin(_yaw), 0, -Math.cos(_yaw));
    var right = new THREE.Vector3(Math.cos(_yaw), 0, -Math.sin(_yaw));
    if (_keys['w'] || _keys['W']) dir.add(fwd);
    if (_keys['s'] || _keys['S']) dir.sub(fwd);
    if (_keys['a'] || _keys['A']) dir.sub(right);
    if (_keys['d'] || _keys['D']) dir.add(right);
    if (dir.length() > 0) dir.normalize().multiplyScalar(speed * delta);
    _camera.position.x += dir.x;
    _camera.position.z += dir.z;
    if (_keys[' '] && _onGround) { _velocity.y = 7; _onGround = false; }
    _velocity.y -= 18 * delta;
    _camera.position.y += _velocity.y * delta;
    var floorY = getFloorY(_camera.position.x, _camera.position.z);
    if (_camera.position.y < floorY + 1.7) {
      _camera.position.y = floorY + 1.7;
      _velocity.y = 0;
      _onGround = true;
    }
    _yaw -= _mouseDX * 0.002;
    _pitch -= _mouseDY * 0.002;
    _pitch = Math.max(-1.2, Math.min(1.2, _pitch));
    _mouseDX = 0; _mouseDY = 0;
    var qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);
    var qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), _pitch);
    _camera.quaternion.copy(qYaw).multiply(qPitch);
  }

  function getFloorY(x, z) {
    var maxY = 0;
    for (var i = 0; i < _platforms.length; i++) {
      var p = _platforms[i];
      if (x >= p.minX && x <= p.maxX && z >= p.minZ && z <= p.maxZ) {
        if (p.y > maxY) maxY = p.y;
      }
    }
    return maxY;
  }

  function updateHUD() {
    if (!_hud) return;
    var priestStatus = _godPriest && _godPriest.userData.hp > 0 ? 'ALIVE (' + Math.round(_godPriest.userData.hp) + 'HP)' : 'SLAIN';
    _hud.innerHTML = '<div style="position:absolute;top:10px;left:10px;color:#ffcc44;font:bold 16px monospace;text-shadow:0 0 4px #000">' +
      'AZTEC RUINS<br>' +
      'ARTIFACTS: ' + _artifacts + '/' + _artifactsTotal + '<br>' +
      'HIGH PRIEST: ' + priestStatus + '<br>' +
      'ENEMIES: ' + _enemies.length + '<br>' +
      'HP: ' + Math.max(0, Math.round(_playerHP)) + '<br>' +
      'TIME: ' + Math.floor((_timerLimit - _timer) / 60) + ':' + String(Math.floor((_timerLimit - _timer) % 60)).padStart(2, '0') +
      '</div>';
  }

  function showResult(win) {
    var msg = win ? 'AZTEC GODS APPEASED — VICTORY!' : 'THE JUNGLE CLAIMS YOU';
    _hud.innerHTML += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:' + (win ? '#ffcc00' : '#ff4444') + ';font:bold 36px monospace;text-align:center;text-shadow:0 0 10px #000">' + msg + '</div>';
  }

  function onKeyDown(e) {
    _keys[e.key] = true;
    var now = performance.now();
    if (e.key === 'a' || e.key === 'A') _lastATime = now;
    if (e.key === 'z' || e.key === 'Z') _lastZTime = now;
    if (Math.abs(_lastATime - _lastZTime) < ACTIVATION_MS && _lastATime > 0 && _lastZTime > 0) activate();
    if (e.key === ' ') e.preventDefault();
  }

  function onKeyUp(e) { _keys[e.key] = false; }

  function onMouseMove(e) {
    if (!_active) return;
    _mouseDX += e.movementX || 0;
    _mouseDY += e.movementY || 0;
  }

  function onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) shoot();
    if (!document.pointerLockElement) _container.requestPointerLock();
  }

  function activate() {
    if (_active) return;
    _active = true;
    _container = document.createElement('div');
    _container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:1000;background:#000';
    document.body.appendChild(_container);

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    _container.appendChild(canvas);

    _hud = document.createElement('div');
    _hud.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none';
    _container.appendChild(_hud);

    _crosshair = document.createElement('div');
    _crosshair.style.cssText = 'position:absolute;top:50%;left:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border:2px solid #ffcc44;border-radius:50%';
    _container.appendChild(_crosshair);

    var esc = document.createElement('div');
    esc.style.cssText = 'position:absolute;top:10px;right:10px;color:#888;font:12px monospace';
    esc.textContent = '[ESC to exit]';
    _container.appendChild(esc);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;

    _scene = new THREE.Scene();
    _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    _camera.position.set(0, 1.7, 30);

    buildWorld();
    updateHUD();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    _container.addEventListener('mousedown', onMouseDown);
    _container.requestPointerLock();

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('mousemove', onMouseMove);
        if (_container && _container.parentNode) _container.parentNode.removeChild(_container);
        _active = false;
        reset();
      }
    });

    var clock = new THREE.Clock();
    function loop() {
      if (!_active) return;
      requestAnimationFrame(loop);
      var delta = Math.min(clock.getDelta(), 0.1);
      if (!_gameOver && !_gameWon) {
        _timer += delta;
        updatePlayer(delta);
        updateEnemies(delta);
        updateProjectiles(delta);
        updateDartTraps(delta);
        checkArtifacts();
        updateHUD();
        if (_playerHP <= 0 || _timer >= _timerLimit) { _gameOver = true; showResult(false); }
        if (_artifacts >= _artifactsTotal && _priestKilled) { _gameWon = true; showResult(true); }
      }
      renderer.render(_scene, _camera);
    }
    loop();
  }

  function init() {}

  function update(delta) {
    var now = performance.now();
  }

  function reset() {
    _enemies = []; _projectiles = []; _traps = []; _poisonDarts = []; _platforms = [];
    _playerHP = 100; _artifacts = 0; _priestKilled = false;
    _timer = 0; _gameOver = false; _gameWon = false;
    _yaw = 0; _pitch = 0; _velocity = { x: 0, y: 0, z: 0 };
    _onGround = false; _lastATime = 0; _lastZTime = 0;
    _active = false;
  }

  document.addEventListener('keydown', function(e) {
    var now = performance.now();
    if (e.key === 'a' || e.key === 'A') _lastATime = now;
    if (e.key === 'z' || e.key === 'Z') _lastZTime = now;
    if (Math.abs(_lastATime - _lastZTime) < ACTIVATION_MS && _lastATime > 0 && _lastZTime > 0) {
      if (!_active) activate();
    }
  });

  return { init: init, update: update, reset: reset };
})();
