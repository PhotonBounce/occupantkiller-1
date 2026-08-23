window.NeonArena = (function() {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var _active = false, _scene, _camera;
  var _enemies = [], _projectiles = [], _powerUps = [];
  var _playerHP = 100, _shield = 0, _round = 0, _roundMax = 10;
  var _crowdMeter = 50, _killCount = 0;
  var _gameOver = false, _gameWon = false;
  var _keys = {}, _mouseDX = 0, _mouseDY = 0;
  var _yaw = 0, _pitch = 0, _vel = { x: 0, y: 0, z: 0 }, _onGround = false;
  var _container, _hud;
  var _lastNTime = 0, _lastATime = 0;
  var ACTIVATION_MS = 400;
  var _lastShot = 0, _timer = 0;
  var _nexus, _nexusPhase = 0;
  var _roundTimer = 0;
  var _platforms = [];
  var _shieldActive = false, _shieldTimer = 0;

  function buildArena() {
    _scene.background = new THREE.Color(0x050510);
    _scene.fog = new THREE.Fog(0x050510, 40, 120);

    var amb = new THREE.AmbientLight(0x111133, 0.8);
    _scene.add(amb);

    // Arena floor
    var floorG = new THREE.CylinderGeometry(30, 30, 0.5, 32);
    var floorM = new THREE.MeshLambertMaterial({ color: 0x0a0a2a });
    var floor = new THREE.Mesh(floorG, floorM);
    floor.position.y = -0.25;
    _scene.add(floor);
    _platforms.push({ y: 0, minX: -29, maxX: 29, minZ: -29, maxZ: 29 });

    // Neon grid lines on floor
    var gridMat = new THREE.LineBasicMaterial({ color: 0x0044ff });
    for (var g = -28; g <= 28; g += 4) {
      var pts1 = [new THREE.Vector3(g, 0.01, -28), new THREE.Vector3(g, 0.01, 28)];
      var pts2 = [new THREE.Vector3(-28, 0.01, g), new THREE.Vector3(28, 0.01, g)];
      _scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), gridMat));
      _scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), gridMat));
    }

    // Tiered seating (rings)
    var seatMat = new THREE.MeshLambertMaterial({ color: 0x1a1a3a });
    for (var t = 0; t < 3; t++) {
      var tier = new THREE.CylinderGeometry(35 + t * 5, 35 + t * 5 + 5, 3, 32, 1, true);
      var tierMesh = new THREE.Mesh(tier, seatMat);
      tierMesh.position.y = 1.5 + t * 3;
      _scene.add(tierMesh);
    }

    // Holographic panels
    var holoPts = [
      new THREE.Vector3(-4, 0, 0), new THREE.Vector3(4, 0, 0),
      new THREE.Vector3(4, 6, 0), new THREE.Vector3(-4, 6, 0),
      new THREE.Vector3(-4, 0, 0)
    ];
    var holoMat = new THREE.LineBasicMaterial({ color: 0x00ffff });
    var angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    for (var h = 0; h < 4; h++) {
      var holoLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(holoPts), holoMat);
      holoLine.position.set(Math.sin(angles[h]) * 28, 8, Math.cos(angles[h]) * 28);
      holoLine.rotation.y = angles[h];
      _scene.add(holoLine);
    }

    // Colored spotlights
    var spotColors = [0xff00ff, 0x00ffff, 0xff8800, 0x00ff44];
    for (var s = 0; s < 4; s++) {
      var sl = new THREE.PointLight(spotColors[s], 2, 35);
      sl.position.set(Math.sin(angles[s]) * 20, 15, Math.cos(angles[s]) * 20);
      _scene.add(sl);
    }

    // Cover obstacles in arena
    var obsMat = new THREE.MeshLambertMaterial({ color: 0x334466 });
    var obsPositions = [[10, 0, 10], [-10, 0, 10], [10, 0, -10], [-10, 0, -10], [0, 0, 15], [0, 0, -15]];
    for (var o = 0; o < obsPositions.length; o++) {
      var og = new THREE.BoxGeometry(2, 2.5, 2);
      var om = new THREE.Mesh(og, obsMat);
      om.position.set(obsPositions[o][0], 1.25, obsPositions[o][2]);
      _scene.add(om);
    }

    // Center platform for boss
    var cpG = new THREE.CylinderGeometry(4, 4, 0.5, 16);
    var cpM = new THREE.MeshLambertMaterial({ color: 0x330033 });
    var cp = new THREE.Mesh(cpG, cpM);
    cp.position.set(0, 0.25, 0);
    _scene.add(cp);
    var cpL = new THREE.PointLight(0xff00ff, 1.5, 10);
    cpL.position.set(0, 3, 0);
    _scene.add(cpL);

    startRound();
  }

  function startRound() {
    _round++;
    _roundTimer = 60 + _round * 10;
    if (_round > _roundMax) { _gameWon = true; showResult(true); return; }
    // Spawn enemies for this round
    var count = 2 + _round * 2;
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2;
      var r = 15 + Math.random() * 10;
      spawnEnemy(Math.sin(angle) * r, Math.cos(angle) * r, _round);
    }
    if (_round === 10) spawnNexus();
    updateHUD();
  }

  function spawnEnemy(x, z, round) {
    var types = ['warrior', 'gunner', 'brute'];
    var type = types[Math.min(Math.floor(round / 4), 2)];
    var colors = { warrior: 0xff6600, gunner: 0x0066ff, brute: 0xaa00aa };
    var sizes = { warrior: [0.8, 1.8, 0.5], gunner: [0.7, 1.7, 0.5], brute: [1.2, 2.2, 0.8] };
    var hps = { warrior: 40 + round * 10, gunner: 30 + round * 8, brute: 100 + round * 20 };
    var sz = sizes[type];
    var eg = new THREE.BoxGeometry(sz[0], sz[1], sz[2]);
    var em = new THREE.MeshLambertMaterial({ color: colors[type], emissive: colors[type], emissiveIntensity: 0.3 });
    var enemy = new THREE.Mesh(eg, em);
    enemy.position.set(x, sz[1] / 2, z);
    enemy.userData = { hp: hps[type], maxHP: hps[type], type: type, attackTimer: 1.5, shootTimer: 2, speed: type === 'brute' ? 2.5 : (type === 'gunner' ? 4.5 : 4) };
    _scene.add(enemy);
    _enemies.push(enemy);
    var el = new THREE.PointLight(colors[type], 1, 4);
    el.position.copy(enemy.position);
    enemy.userData.light = el;
    _scene.add(el);
    return enemy;
  }

  function spawnNexus() {
    var ng = new THREE.SphereGeometry(1.5, 10, 10);
    var nm = new THREE.MeshLambertMaterial({ color: 0xff00ff, emissive: 0x880088 });
    _nexus = new THREE.Mesh(ng, nm);
    _nexus.position.set(0, 2, 0);
    _nexus.userData = { hp: 800, maxHP: 800, type: 'nexus', attackTimer: 1, shootTimer: 0.5, phase: 1 };
    _scene.add(_nexus);
    var nl = new THREE.PointLight(0xff00ff, 3, 12);
    nl.position.copy(_nexus.position);
    _nexus.userData.light = nl;
    _scene.add(nl);
    _enemies.push(_nexus);
  }

  function updateEnemies(delta) {
    var camPos = _camera.position;
    var allDead = (_enemies.length === 0);
    for (var i = _enemies.length - 1; i >= 0; i--) {
      var e = _enemies[i];
      if (!e.parent) { _enemies.splice(i, 1); continue; }
      if (e.userData.hp <= 0) {
        _killCount++;
        _crowdMeter = Math.min(100, _crowdMeter + 5);
        dropPowerUp(e.position);
        _scene.remove(e);
        if (e.userData.light) _scene.remove(e.userData.light);
        if (e === _nexus) _nexus = null;
        _enemies.splice(i, 1);
        continue;
      }
      var dx = camPos.x - e.position.x, dz = camPos.z - e.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 25) {
        var spd = e.userData.speed * (1 + _round * 0.05);
        e.position.x += (dx / dist) * spd * delta;
        e.position.z += (dz / dist) * spd * delta;
        // Keep in arena
        var pr = Math.sqrt(e.position.x * e.position.x + e.position.z * e.position.z);
        if (pr > 28) { e.position.x *= 28 / pr; e.position.z *= 28 / pr; }
        e.lookAt(camPos.x, e.position.y, camPos.z);
      }
      e.userData.attackTimer -= delta;
      if (dist < 2.2 && e.userData.attackTimer <= 0) {
        var dmg = e.userData.type === 'nexus' ? 30 : (e.userData.type === 'brute' ? 20 : 12);
        if (_shieldActive) { /* blocked */ } else { _playerHP -= dmg; updateHUD(); }
        e.userData.attackTimer = 1.5;
      }
      // Ranged attack
      if ((e.userData.type === 'gunner' || e.userData.type === 'nexus') && dist < 20) {
        e.userData.shootTimer -= delta;
        if (e.userData.shootTimer <= 0) {
          var projectileColor = e.userData.type === 'nexus' ? 0xff00ff : 0x00aaff;
          fireAt(e.position, camPos, projectileColor, e.userData.type === 'nexus' ? 20 : 10);
          e.userData.shootTimer = e.userData.type === 'nexus' ? 1 : 2;
        }
      }
      // Nexus orbit
      if (e.userData.type === 'nexus') {
        e.rotation.y += delta * 2;
        if (e.userData.light) e.userData.light.position.copy(e.position);
        if (e.userData.hp < 600 && e.userData.phase === 1) { e.userData.phase = 2; e.material.emissive.setHex(0xff0000); }
        if (e.userData.hp < 300 && e.userData.phase === 2) { e.userData.phase = 3; e.material.color.setHex(0xffffff); }
      }
      if (e.userData.light) e.userData.light.position.copy(e.position);
    }
    // Check round clear
    if (_enemies.length === 0 && !_gameWon && _round < _roundMax) {
      setTimeout(function() { if (!_gameOver && !_gameWon) startRound(); }, 3000);
    }
    if (_enemies.length === 0 && _round >= _roundMax && !_gameWon) { _gameWon = true; showResult(true); }
  }

  function dropPowerUp(pos) {
    if (Math.random() > 0.3) return;
    var types = ['health', 'shield', 'ammo'];
    var type = types[Math.floor(Math.random() * types.length)];
    var colors = { health: 0xff4444, shield: 0x4444ff, ammo: 0xffff00 };
    var pg = new THREE.SphereGeometry(0.4, 6, 6);
    var pm = new THREE.MeshLambertMaterial({ color: colors[type], emissive: colors[type] });
    var pup = new THREE.Mesh(pg, pm);
    pup.position.copy(pos);
    pup.position.y = 0.5;
    pup.userData = { type: type, life: 15 };
    _scene.add(pup);
    _powerUps.push(pup);
  }

  function updatePowerUps(delta) {
    for (var i = _powerUps.length - 1; i >= 0; i--) {
      var p = _powerUps[i];
      p.rotation.y += delta * 2;
      p.userData.life -= delta;
      var d = p.position.distanceTo(_camera.position);
      if (d < 1.5) {
        if (p.userData.type === 'health') _playerHP = Math.min(100, _playerHP + 30);
        if (p.userData.type === 'shield') { _shield = 50; _shieldActive = true; _shieldTimer = 10; }
        _scene.remove(p); _powerUps.splice(i, 1);
        updateHUD(); continue;
      }
      if (p.userData.life <= 0) { _scene.remove(p); _powerUps.splice(i, 1); }
    }
  }

  function fireAt(from, to, color, dmg) {
    var pg = new THREE.SphereGeometry(0.2, 5, 5);
    var pm = new THREE.MeshLambertMaterial({ color: color, emissive: color });
    var proj = new THREE.Mesh(pg, pm);
    proj.position.copy(from);
    var dir = new THREE.Vector3(to.x - from.x, 0, to.z - from.z).normalize();
    proj.userData = { vel: dir.multiplyScalar(15), dmg: dmg, life: 3 };
    _scene.add(proj);
    _projectiles.push(proj);
  }

  function updateProjectiles(delta) {
    for (var i = _projectiles.length - 1; i >= 0; i--) {
      var p = _projectiles[i];
      p.position.add(p.userData.vel.clone().multiplyScalar(delta));
      p.userData.life -= delta;
      if (p.position.distanceTo(_camera.position) < 1.2) {
        if (!_shieldActive) { _playerHP -= p.userData.dmg; updateHUD(); }
        _scene.remove(p); _projectiles.splice(i, 1); continue;
      }
      if (p.userData.life <= 0) { _scene.remove(p); _projectiles.splice(i, 1); }
    }
  }

  function shoot() {
    var now = performance.now() / 1000;
    if (now - _lastShot < 0.18) return;
    _lastShot = now;
    var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      var d = e.position.distanceTo(_camera.position);
      if (d > 35) continue;
      var toE = e.position.clone().sub(_camera.position).normalize();
      if (fwd.dot(toE) > 0.95) { e.userData.hp -= 25; break; }
    }
  }

  function updatePlayer(delta) {
    var speed = 8;
    var fwd = new THREE.Vector3(-Math.sin(_yaw), 0, -Math.cos(_yaw));
    var right = new THREE.Vector3(Math.cos(_yaw), 0, -Math.sin(_yaw));
    var dir = new THREE.Vector3();
    if (_keys['w'] || _keys['W']) dir.add(fwd);
    if (_keys['s'] || _keys['S']) dir.sub(fwd);
    if (_keys['a'] || _keys['A']) dir.sub(right);
    if (_keys['d'] || _keys['D']) dir.add(right);
    if (dir.length() > 0) dir.normalize().multiplyScalar(speed * delta);
    _camera.position.x += dir.x;
    _camera.position.z += dir.z;
    var pr = Math.sqrt(_camera.position.x * _camera.position.x + _camera.position.z * _camera.position.z);
    if (pr > 28) { _camera.position.x *= 28 / pr; _camera.position.z *= 28 / pr; }
    if (_keys[' '] && _onGround) { _vel.y = 7; _onGround = false; }
    _vel.y -= 18 * delta;
    _camera.position.y += _vel.y * delta;
    if (_camera.position.y < 1.7) { _camera.position.y = 1.7; _vel.y = 0; _onGround = true; }
    // Q = shield
    if (_keys['q'] || _keys['Q']) { _shieldActive = true; _shieldTimer = Math.min(5, _shieldTimer + delta); }
    if (_shieldActive) {
      _shieldTimer -= delta;
      if (_shieldTimer <= 0) { _shieldActive = false; _shieldTimer = 0; }
    }
    _yaw -= _mouseDX * 0.002;
    _pitch = Math.max(-1.2, Math.min(1.2, _pitch - _mouseDY * 0.002));
    _mouseDX = 0; _mouseDY = 0;
    var qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), _yaw);
    var qP = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), _pitch);
    _camera.quaternion.copy(qY).multiply(qP);
  }

  function updateHUD() {
    if (!_hud) return;
    var nexusHP = _nexus ? Math.round(_nexus.userData.hp) + 'HP' : (_round >= _roundMax ? 'DESTROYED' : 'NOT YET');
    _hud.innerHTML = '<div style="position:absolute;top:10px;left:10px;color:#00ffff;font:bold 15px monospace;text-shadow:0 0 6px #00ffff">' +
      'NEON ARENA<br>' +
      'ROUND: ' + _round + '/' + _roundMax + '<br>' +
      'ENEMIES: ' + _enemies.length + '<br>' +
      'KILLS: ' + _killCount + '<br>' +
      'CROWD: ' + Math.round(_crowdMeter) + '%<br>' +
      'NEXUS: ' + nexusHP + '<br>' +
      'SHIELD: ' + (_shieldActive ? Math.ceil(_shieldTimer) + 's' : 'OFF') + '<br>' +
      'HP: ' + Math.max(0, Math.round(_playerHP)) +
      '</div>';
  }

  function showResult(win) {
    _hud.innerHTML += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:' + (win ? '#00ffff' : '#ff4444') + ';font:bold 32px monospace;text-align:center;text-shadow:0 0 12px currentColor">' + (win ? 'NEXUS DEFEATED — GLADIATOR SUPREME!' : 'THE ARENA CLAIMS YOU') + '</div>';
  }

  function onKeyDown(e) { _keys[e.key] = true; if (e.key === ' ') e.preventDefault(); }
  function onKeyUp(e) { _keys[e.key] = false; }
  function onMouseMove(e) { if (_active) { _mouseDX += e.movementX || 0; _mouseDY += e.movementY || 0; } }
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
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    canvas.style.cssText = 'width:100%;height:100%';
    _container.appendChild(canvas);
    _hud = document.createElement('div');
    _hud.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none';
    _container.appendChild(_hud);
    var cross = document.createElement('div');
    cross.style.cssText = 'position:absolute;top:50%;left:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border:2px solid #00ffff;border-radius:50%';
    _container.appendChild(cross);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    _scene = new THREE.Scene();
    _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    _camera.position.set(0, 1.7, 22);
    buildArena();
    updateHUD();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    _container.addEventListener('mousedown', onMouseDown);
    _container.requestPointerLock();
    document.addEventListener('keydown', function escFn(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('keydown', escFn);
        if (_container.parentNode) _container.parentNode.removeChild(_container);
        _active = false; reset();
      }
    });
    var clock = new THREE.Clock();
    function loop() {
      if (!_active) return;
      requestAnimationFrame(loop);
      var delta = Math.min(clock.getDelta(), 0.1);
      if (!_gameOver && !_gameWon) {
        _timer += delta;
        _crowdMeter = Math.max(0, _crowdMeter - delta * 0.5);
        updatePlayer(delta);
        updateEnemies(delta);
        updateProjectiles(delta);
        updatePowerUps(delta);
        updateHUD();
        if (_playerHP <= 0) { _gameOver = true; showResult(false); }
      }
      renderer.render(_scene, _camera);
    }
    loop();
  }

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */
}
  function update() {}
  function reset() {
    _enemies = []; _projectiles = []; _powerUps = []; _platforms = [];
    _playerHP = 100; _shield = 0; _round = 0; _killCount = 0; _crowdMeter = 50;
    _gameOver = false; _gameWon = false; _nexus = null; _nexusPhase = 0;
    _timer = 0; _yaw = 0; _pitch = 0; _vel = { x: 0, y: 0, z: 0 }; _onGround = false;
    _lastNTime = 0; _lastATime = 0; _shieldActive = false; _shieldTimer = 0; _active = false;
  }

  document.addEventListener('keydown', function(e) {
    var now = performance.now();
    if (e.key === 'n' || e.key === 'N') _lastNTime = now;
    if (e.key === 'a' || e.key === 'A') _lastATime = now;
    if (Math.abs(_lastNTime - _lastATime) < ACTIVATION_MS && _lastNTime > 0 && _lastATime > 0) {
      if (!_active) activate();
    }
  });

  return { init: init, update: update, reset: reset };
})();
