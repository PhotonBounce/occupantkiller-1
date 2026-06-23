window.RiotShieldPickup = (function () {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _pickups = [];
  var _equipped = false;
  var _shieldHP = 0;
  var _maxShieldHP = 180;
  var _shieldMesh = null;
  var _impactTimer = 0;
  var _hudEl = null;

  var _PICKUP_RADIUS = 1.8;

  function _buildPickupMesh(scene, x, y, z) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.1, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.5, transparent: true, opacity: 0.88 })
    );
    var window_ = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.35, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x88BBFF, transparent: true, opacity: 0.55 })
    );
    window_.position.set(0, 0.2, 0);
    group.add(body);
    group.add(window_);
    group.position.set(x, y + 0.6, z);
    group.userData.isRiotShieldPickup = true;
    group.userData.hp = _maxShieldHP;
    var light = new THREE.PointLight(0x4488FF, 0.5, 3);
    light.position.set(0, 0.8, 0);
    group.add(light);
    scene.add(group);
    return group;
  }

  function _buildEquippedMesh() {
    if (!_camera) return;
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 1.0, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.5, transparent: true, opacity: 0.88 })
    );
    var window_ = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.3, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x88BBFF, transparent: true, opacity: 0.55 })
    );
    window_.position.set(0, 0.15, 0);
    group.add(body);
    group.add(window_);
    group.position.set(-0.35, -0.1, -0.55);
    _camera.add(group);
    _shieldMesh = group;
  }

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'riot-shield-hud';
    _hudEl.style.cssText = 'position:fixed;bottom:85px;right:20px;color:#88BBFF;font-family:monospace;font-size:11px;letter-spacing:1px;pointer-events:none;display:none;z-index:1500;text-shadow:0 0 6px #0088FF';
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_equipped) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';
    var pct = Math.max(0, _shieldHP) / _maxShieldHP;
    var bars = Math.round(pct * 10);
    _hudEl.textContent = 'SHIELD [' + '█'.repeat(bars) + '░'.repeat(10 - bars) + '] ' + Math.max(0, Math.round(_shieldHP)) + 'HP';
  }

  function _onKey(e) {
    if (e.code === 'KeyQ' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      if (_equipped) _dropShield();
    }
  }

  function _dropShield() {
    _equipped = false;
    _shieldHP = 0;
    if (_shieldMesh && _camera) { _camera.remove(_shieldMesh); _shieldMesh = null; }
    window._playerHasRiotShield = false;
    _updateHUD();
  }

  function spawnPickup(scene, x, y, z) {
    var mesh = _buildPickupMesh(scene, x, y, z);
    _pickups.push({ mesh: mesh, hp: _maxShieldHP, bobTimer: Math.random() * Math.PI * 2 });
  }

  function init(scene, camera) {
    _scene = scene || window._gameScene;
    _camera = camera || window._camera;
    _pickups = [];
    _equipped = false;
    _shieldHP = 0;
    _buildHUD();
    document.addEventListener('keydown', _onKey);
    window._playerHasRiotShield = false;
    window._riotShieldAbsorb = function (dmg) {
      if (!_equipped || _shieldHP <= 0) return dmg;
      var absorbed = Math.min(dmg * 0.75, _shieldHP);
      _shieldHP -= absorbed;
      _impactTimer = 0.15;
      if (_shieldMesh) _shieldMesh.position.z = -0.45;
      if (_shieldHP <= 0) _dropShield();
      return dmg - absorbed;
    };
  }

  function update(dt) {
    var playerPos = _camera ? _camera.position : null;
    for (var i = _pickups.length - 1; i >= 0; i--) {
      var p = _pickups[i];
      if (!p.mesh) { _pickups.splice(i, 1); continue; }
      p.bobTimer += dt;
      p.mesh.position.y = 0.6 + Math.sin(p.bobTimer * 1.2) * 0.08;
      p.mesh.rotation.y += dt * 0.6;

      if (playerPos && !_equipped) {
        var dx = p.mesh.position.x - playerPos.x;
        var dz = p.mesh.position.z - playerPos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < _PICKUP_RADIUS) {
          _scene.remove(p.mesh);
          _pickups.splice(i, 1);
          _equipped = true;
          _shieldHP = _maxShieldHP;
          _buildEquippedMesh();
          window._playerHasRiotShield = true;
          if (window.KillFeedEvents && KillFeedEvents.addEvent) {
            KillFeedEvents.addEvent('RIOT SHIELD EQUIPPED');
          }
          continue;
        }
      }
    }

    if (_impactTimer > 0) {
      _impactTimer -= dt;
      if (_shieldMesh) {
        _shieldMesh.position.z = -0.45 + (0.15 - _impactTimer) * 0.3;
      }
      if (_impactTimer <= 0 && _shieldMesh) {
        _shieldMesh.position.z = -0.55;
      }
    }

    _updateHUD();
  }

  function reset() {
    _equipped = false;
    _shieldHP = 0;
    _pickups = [];
    window._playerHasRiotShield = false;
    if (_shieldMesh && _camera) { _camera.remove(_shieldMesh); _shieldMesh = null; }
    if (_hudEl) _hudEl.style.display = 'none';
  }

  return { init: init, update: update, spawnPickup: spawnPickup, reset: reset };
})();
