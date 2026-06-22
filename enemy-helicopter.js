window.EnemyHelicopter = (function () {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _playerRef = null;

  var _heliGroup = null;
  var _fuselage = null;
  var _mainRotor = null;
  var _tailRotor = null;
  var _searchlight = null;
  var _healthBar = null;
  var _healthBarBg = null;

  var _hp = 300;
  var _maxHp = 300;
  var _active = false;
  var _destroyed = false;

  var _orbitAngle = 0;
  var _orbitRadius = 20;
  var _orbitY = 12;
  var _orbitSpeed = 8;

  var _phase = 'circling';
  var _attackCooldown = 8;
  var _attackTimer = 0;
  var _rocketCooldown = 12;
  var _rocketTimer = 0;
  var _cannonBurstCount = 0;
  var _cannonBurstTimer = 0;

  var _shells = [];
  var _rockets = [];
  var _muzzleFlash = null;
  var _muzzleFlashTimer = 0;

  var _audioCtx = null;
  var _engineGain = null;
  var _engineOsc1 = null;
  var _engineOsc2 = null;

  var _fallTimer = 0;
  var _smokeParticles = [];
  var _warnDiv = null;

  function _vec3(x, y, z) { return new THREE.Vector3(x, y, z); }
  function _dist3(a, b) { return a.distanceTo(b); }

  function _initAudio() {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      _engineGain = _audioCtx.createGain();
      _engineGain.gain.value = 0;
      _engineGain.connect(_audioCtx.destination);
      _engineOsc1 = _audioCtx.createOscillator();
      _engineOsc1.type = 'sawtooth';
      _engineOsc1.frequency.value = 40;
      var g1 = _audioCtx.createGain();
      g1.gain.value = 0.6;
      _engineOsc1.connect(g1);
      g1.connect(_engineGain);
      _engineOsc1.start();
      _engineOsc2 = _audioCtx.createOscillator();
      _engineOsc2.type = 'sawtooth';
      _engineOsc2.frequency.value = 80;
      var g2 = _audioCtx.createGain();
      g2.gain.value = 0.3;
      _engineOsc2.connect(g2);
      g2.connect(_engineGain);
      _engineOsc2.start();
    } catch (e) { _audioCtx = null; }
  }

  function _updateAudioVolume(playerPos) {
    if (!_audioCtx || !_heliGroup || !_engineGain) return;
    var d = _dist3(_heliGroup.position, playerPos);
    var vol = Math.max(0, 1 - d / 60) * 0.6;
    _engineGain.gain.setTargetAtTime(vol, _audioCtx.currentTime, 0.1);
  }

  function _stopAudio() {
    if (!_audioCtx) return;
    try {
      _engineGain.gain.setTargetAtTime(0, _audioCtx.currentTime, 0.2);
      setTimeout(function () {
        try { if (_engineOsc1) _engineOsc1.stop(); if (_engineOsc2) _engineOsc2.stop(); } catch (e) {}
      }, 500);
    } catch (e) {}
  }

  function _showWarning() {
    if (_warnDiv) { document.body.removeChild(_warnDiv); }
    _warnDiv = document.createElement('div');
    _warnDiv.textContent = 'ENEMY HELO INBOUND!';
    _warnDiv.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);color:#ff2020;font-size:2.2rem;font-weight:bold;font-family:monospace;text-shadow:0 0 12px #ff0000;z-index:9999;pointer-events:none;animation:heloWarn 3s forwards';
    var style = document.createElement('style');
    style.textContent = '@keyframes heloWarn{0%{opacity:1}70%{opacity:1}100%{opacity:0}}';
    document.head.appendChild(style);
    document.body.appendChild(_warnDiv);
    setTimeout(function () {
      if (_warnDiv && _warnDiv.parentNode) { _warnDiv.parentNode.removeChild(_warnDiv); _warnDiv = null; }
    }, 3100);
  }

  function _createHealthBar() {
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 16;
    var tex = new THREE.CanvasTexture(canvas);
    var bgGeo = new THREE.PlaneGeometry(2.2, 0.28);
    var bgMat = new THREE.MeshBasicMaterial({ color: 0x222222, depthTest: false, transparent: true });
    _healthBarBg = new THREE.Mesh(bgGeo, bgMat);
    _healthBarBg.renderOrder = 999;
    var barGeo = new THREE.PlaneGeometry(2, 0.2);
    var barMat = new THREE.MeshBasicMaterial({ map: tex, depthTest: false, transparent: true });
    _healthBar = new THREE.Mesh(barGeo, barMat);
    _healthBar.renderOrder = 1000;
    _healthBar.userData.tex = tex;
    _healthBar.userData.canvas = canvas;
    _heliGroup.add(_healthBarBg);
    _heliGroup.add(_healthBar);
    _healthBarBg.position.set(0, 1.8, 0);
    _healthBar.position.set(0, 1.8, 0.01);
    _updateHealthBar();
  }

  function _updateHealthBar() {
    if (!_healthBar) return;
    var canvas = _healthBar.userData.canvas;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 16);
    var pct = Math.max(0, _hp / _maxHp);
    ctx.fillStyle = pct > 0.5 ? '#00ff44' : pct > 0.25 ? '#ffaa00' : '#ff2222';
    ctx.fillRect(0, 0, Math.round(pct * 128), 16);
    _healthBar.userData.tex.needsUpdate = true;
  }

  function _buildMesh() {
    _heliGroup = new THREE.Group();
    var fuseGeo = new THREE.BoxGeometry(2, 0.6, 1);
    var fuseMat = new THREE.MeshLambertMaterial({ color: 0x2A4A2A });
    _fuselage = new THREE.Mesh(fuseGeo, fuseMat);
    _fuselage.userData.isHeliFuselage = true;
    _heliGroup.add(_fuselage);
    var tailGeo = new THREE.BoxGeometry(0.2, 0.2, 1.2);
    var tailBoom = new THREE.Mesh(tailGeo, new THREE.MeshLambertMaterial({ color: 0x2A4A2A }));
    tailBoom.position.set(0, 0, 1.1);
    _heliGroup.add(tailBoom);
    var rotorGeo = new THREE.BoxGeometry(3, 0.05, 0.2);
    _mainRotor = new THREE.Mesh(rotorGeo, new THREE.MeshLambertMaterial({ color: 0x1A2A1A }));
    _mainRotor.position.set(0, 0.42, 0);
    _heliGroup.add(_mainRotor);
    var trGeo = new THREE.BoxGeometry(0.08, 0.6, 0.08);
    _tailRotor = new THREE.Mesh(trGeo, new THREE.MeshLambertMaterial({ color: 0x1A2A1A }));
    _tailRotor.position.set(0.15, 0, 1.65);
    _heliGroup.add(_tailRotor);
    _searchlight = new THREE.SpotLight(0xFFFFFF, 1.5, 30, 0.3);
    _searchlight.position.set(0, -0.5, -0.3);
    _heliGroup.add(_searchlight);
    var st = new THREE.Object3D();
    st.position.set(0, -10, -5);
    _heliGroup.add(st);
    _searchlight.target = st;
    _scene.add(_heliGroup);
    _createHealthBar();
  }

  function _fireCannonBurst(playerPos) {
    var mp = new THREE.Vector3();
    _fuselage.getWorldPosition(mp);
    mp.y -= 0.3;
    for (var i = 0; i < 5; i++) {
      var sg = new THREE.BoxGeometry(0.05, 0.05, 0.4);
      var sm = new THREE.MeshBasicMaterial({ color: 0xFFCC00 });
      var shell = new THREE.Mesh(sg, sm);
      shell.position.copy(mp);
      var dir = new THREE.Vector3().subVectors(playerPos, mp).normalize();
      dir.x += (Math.random() - 0.5) * 0.25;
      dir.y += (Math.random() - 0.5) * 0.15;
      dir.z += (Math.random() - 0.5) * 0.25;
      dir.normalize();
      shell.userData.velocity = dir.multiplyScalar(30);
      shell.userData.life = 1.5;
      _scene.add(shell);
      _shells.push(shell);
    }
    if (_muzzleFlash) { _muzzleFlash.intensity = 3; } else { _muzzleFlash = new THREE.PointLight(0xFF8800, 3, 5); _scene.add(_muzzleFlash); }
    _muzzleFlash.position.copy(mp);
    _muzzleFlashTimer = 0.08;
  }

  function _updateShells(dt, playerPos) {
    for (var i = _shells.length - 1; i >= 0; i--) {
      var s = _shells[i];
      s.position.addScaledVector(s.userData.velocity, dt);
      s.userData.life -= dt;
      if (_dist3(s.position, playerPos) < 2) { _dealDamageToPlayer(15); _scene.remove(s); _shells.splice(i, 1); continue; }
      if (s.position.y < 0 || s.userData.life <= 0) { _scene.remove(s); _shells.splice(i, 1); }
    }
  }

  function _fireRocket(playerPos) {
    var rg = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
    var rm = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var rocket = new THREE.Mesh(rg, rm);
    var sp = new THREE.Vector3();
    _heliGroup.getWorldPosition(sp);
    sp.y -= 0.3;
    rocket.position.copy(sp);
    var dir = new THREE.Vector3().subVectors(playerPos, sp).normalize();
    rocket.userData.velocity = dir.multiplyScalar(20);
    rocket.userData.life = 4;
    rocket.userData.active = true;
    rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    _scene.add(rocket);
    _rockets.push(rocket);
  }

  function _rocketExplode(pos, playerPos) {
    var em = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xFF6600 }));
    em.position.copy(pos);
    _scene.add(em);
    var el = new THREE.PointLight(0xFF4400, 4, 15);
    el.position.copy(pos);
    _scene.add(el);
    for (var i = 0; i < 8; i++) {
      var sp2 = new THREE.Mesh(new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 6, 6), new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.7 }));
      sp2.position.copy(pos);
      sp2.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random() * 3, (Math.random() - 0.5) * 2);
      sp2.userData.life = 1.5 + Math.random();
      _scene.add(sp2);
      _smokeParticles.push(sp2);
    }
    var d = _dist3(pos, playerPos);
    if (d < 5) { _dealDamageToPlayer(Math.max(10, Math.round(60 * (1 - d / 5)))); }
    setTimeout(function () { _scene.remove(em); _scene.remove(el); }, 300);
  }

  function _updateRockets(dt, playerPos) {
    for (var i = _rockets.length - 1; i >= 0; i--) {
      var r = _rockets[i];
      if (!r.userData.active) { _scene.remove(r); _rockets.splice(i, 1); continue; }
      r.position.addScaledVector(r.userData.velocity, dt);
      r.userData.life -= dt;
      if (_dist3(r.position, playerPos) < 1.5 || r.position.y < 0 || r.userData.life <= 0) {
        _rocketExplode(r.position.clone(), playerPos);
        r.userData.active = false;
        _scene.remove(r);
        _rockets.splice(i, 1);
      }
    }
  }

  function _dealDamageToPlayer(amount) {
    if (window.PlayerHealth && typeof window.PlayerHealth.takeDamage === 'function') { window.PlayerHealth.takeDamage(amount); }
    else if (window.player && typeof window.player.takeDamage === 'function') { window.player.takeDamage(amount); }
    else if (window.GameManager && typeof window.GameManager.damagePlayer === 'function') { window.GameManager.damagePlayer(amount); }
  }

  function _addScore(points) {
    if (window.ScoreSystem && typeof window.ScoreSystem.add === 'function') { window.ScoreSystem.add(points); }
    else if (window.GameManager && typeof window.GameManager.addScore === 'function') { window.GameManager.addScore(points); }
    else { window._score = (window._score || 0) + points; }
  }

  function _triggerDestruction() {
    _phase = 'falling';
    _fallTimer = 0;
    _stopAudio();
    _spawnCrashSmoke();
  }

  function _spawnCrashSmoke() {
    if (!_heliGroup || !_scene) return;
    var pos = _heliGroup.position.clone();
    for (var i = 0; i < 12; i++) {
      var sp = new THREE.Mesh(new THREE.SphereGeometry(0.4 + Math.random() * 0.6, 6, 6), new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.8 }));
      sp.position.copy(pos);
      sp.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 3, 3 + Math.random() * 5, (Math.random() - 0.5) * 3);
      sp.userData.life = 2 + Math.random() * 2;
      _scene.add(sp);
      _smokeParticles.push(sp);
    }
  }

  function _crashExplosion(pos) {
    var em = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 10), new THREE.MeshBasicMaterial({ color: 0xFF4400 }));
    em.position.copy(pos);
    _scene.add(em);
    var el = new THREE.PointLight(0xFF2200, 6, 25);
    el.position.copy(pos);
    _scene.add(el);
    for (var i = 0; i < 20; i++) {
      var sp = new THREE.Mesh(new THREE.SphereGeometry(0.5 + Math.random() * 0.8, 6, 6), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7 }));
      sp.position.copy(pos);
      sp.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 2, 4 + Math.random() * 6, (Math.random() - 0.5) * 2);
      sp.userData.life = 3 + Math.random() * 3;
      _scene.add(sp);
      _smokeParticles.push(sp);
    }
    setTimeout(function () { _scene.remove(em); _scene.remove(el); }, 500);
    _addScore(1000);
    _destroyed = true;
    window._helicopterActive = false;
    setTimeout(function () { if (_heliGroup && _scene) { _scene.remove(_heliGroup); _heliGroup = null; } }, 2000);
  }

  function _updateSmoke(dt) {
    for (var i = _smokeParticles.length - 1; i >= 0; i--) {
      var sp = _smokeParticles[i];
      sp.position.addScaledVector(sp.userData.vel, dt);
      sp.userData.life -= dt;
      sp.material.opacity = Math.max(0, sp.userData.life / 4) * 0.8;
      if (sp.userData.life <= 0) { _scene.remove(sp); _smokeParticles.splice(i, 1); }
    }
  }

  function init(scene, camera, playerRef) {
    _scene = scene;
    _camera = camera;
    _playerRef = playerRef;
  }

  function spawn() {
    if (_active || !_scene) return;
    _hp = _maxHp;
    _destroyed = false;
    _phase = 'circling';
    _attackTimer = 4;
    _rocketTimer = 0;
    _orbitAngle = Math.random() * Math.PI * 2;
    _shells = [];
    _rockets = [];
    _smokeParticles = [];
    _cannonBurstCount = 0;
    _cannonBurstTimer = 0;
    _muzzleFlash = null;
    _muzzleFlashTimer = 0;
    _fallTimer = 0;
    _buildMesh();
    _initAudio();
    _heliGroup.position.set(_orbitRadius + 5, 15, 0);
    _active = true;
    window._helicopterActive = true;
    _showWarning();
  }

  function update(dt, playerPos) {
    if (!_active || !_heliGroup || !_scene) return;
    if (!playerPos) { playerPos = _vec3(0, 0, 0); }
    if (_healthBar && _camera) { _healthBar.quaternion.copy(_camera.quaternion); _healthBarBg.quaternion.copy(_camera.quaternion); }
    _updateSmoke(dt);
    if (_muzzleFlashTimer > 0) { _muzzleFlashTimer -= dt; if (_muzzleFlashTimer <= 0 && _muzzleFlash) { _muzzleFlash.intensity = 0; } }
    if (_phase === 'falling') {
      _fallTimer += dt;
      _heliGroup.rotation.z += dt * 1.2;
      _heliGroup.position.y -= dt * 6;
      if (_mainRotor) { _mainRotor.rotation.y += dt * Math.max(0, 5 - _fallTimer * 3); }
      if (Math.random() < dt * 8) { _spawnCrashSmoke(); }
      if (_heliGroup.position.y < 0.5 && !_destroyed) { _crashExplosion(_heliGroup.position.clone()); }
      return;
    }
    if (_mainRotor) { _mainRotor.rotation.y += dt * 5; }
    if (_tailRotor) { _tailRotor.rotation.x += dt * 15; }
    _updateAudioVolume(playerPos);
    _updateShells(dt, playerPos);
    _updateRockets(dt, playerPos);
    if (_phase === 'circling') {
      _orbitAngle += (_orbitSpeed / _orbitRadius) * dt;
      var tx = Math.cos(_orbitAngle) * _orbitRadius;
      var tz = Math.sin(_orbitAngle) * _orbitRadius;
      _heliGroup.position.x += (tx - _heliGroup.position.x) * Math.min(1, dt * 3);
      _heliGroup.position.z += (tz - _heliGroup.position.z) * Math.min(1, dt * 3);
      _heliGroup.position.y += (_orbitY - _heliGroup.position.y) * Math.min(1, dt * 2);
      var na = _orbitAngle + 0.05;
      var nx = Math.cos(na) * _orbitRadius;
      var nz = Math.sin(na) * _orbitRadius;
      _heliGroup.lookAt(nx, _heliGroup.position.y, nz);
      if (_searchlight && _searchlight.target) { _searchlight.target.position.set(nx - _heliGroup.position.x, -8, nz - _heliGroup.position.z); }
      _attackTimer -= dt;
      if (_attackTimer <= 0) { _phase = 'attack'; _cannonBurstCount = 0; _cannonBurstTimer = 0; _attackTimer = _attackCooldown; }
      if (_hp < 150) { _rocketTimer -= dt; if (_rocketTimer <= 0) { _fireRocket(playerPos); _rocketTimer = _rocketCooldown; } }
    } else if (_phase === 'attack') {
      var dx = playerPos.x - _heliGroup.position.x;
      var dz = playerPos.z - _heliGroup.position.z;
      var hd = Math.sqrt(dx * dx + dz * dz);
      _heliGroup.position.y += (6 - _heliGroup.position.y) * Math.min(1, dt * 2);
      _heliGroup.position.x += (dx / Math.max(hd, 1)) * _orbitSpeed * dt;
      _heliGroup.position.z += (dz / Math.max(hd, 1)) * _orbitSpeed * dt;
      _heliGroup.lookAt(new THREE.Vector3(playerPos.x, _heliGroup.position.y, playerPos.z));
      if (hd < 10 && _cannonBurstCount < 3) {
        _cannonBurstTimer -= dt;
        if (_cannonBurstTimer <= 0) { _fireCannonBurst(playerPos); _cannonBurstCount++; _cannonBurstTimer = 0.35; }
      }
      if (_cannonBurstCount >= 3 && _cannonBurstTimer <= 0) { _phase = 'circling'; _orbitAngle = Math.atan2(_heliGroup.position.z, _heliGroup.position.x); }
      if (_hp < 150) { _rocketTimer -= dt; if (_rocketTimer <= 0) { _fireRocket(playerPos); _rocketTimer = _rocketCooldown; } }
    }
  }

  function takeDamage(amount, hitObject) {
    if (hitObject && !hitObject.userData.isHeliFuselage) return false;
    if (!_active || _destroyed || _phase === 'falling') return false;
    _hp -= amount;
    _updateHealthBar();
    if (_hp <= 0) { _hp = 0; _triggerDestruction(); }
    return true;
  }

  function reset() {
    _active = false;
    _destroyed = false;
    _phase = 'circling';
    window._helicopterActive = false;
    _stopAudio();
    if (_heliGroup && _scene) { _scene.remove(_heliGroup); }
    _heliGroup = null; _fuselage = null; _mainRotor = null; _tailRotor = null; _searchlight = null; _healthBar = null; _healthBarBg = null;
    if (_muzzleFlash && _scene) { _scene.remove(_muzzleFlash); }
    _muzzleFlash = null;
    for (var i = 0; i < _shells.length; i++) { if (_scene) _scene.remove(_shells[i]); }
    _shells = [];
    for (var j = 0; j < _rockets.length; j++) { if (_scene) _scene.remove(_rockets[j]); }
    _rockets = [];
    for (var k = 0; k < _smokeParticles.length; k++) { if (_scene) _scene.remove(_smokeParticles[k]); }
    _smokeParticles = [];
    if (_warnDiv && _warnDiv.parentNode) { _warnDiv.parentNode.removeChild(_warnDiv); _warnDiv = null; }
  }

  window._helicopterActive = false;

  return { init: init, update: update, spawn: spawn, reset: reset, takeDamage: takeDamage };
})();
