window.CompanionDrone = (function() {
  var _drone = null;  // {mesh, hpBar, hp, maxHp, target, fireTimer, orbitAngle, orbitRadius, ammo}
  var _scene = null;
  var _camera = null;
  var _active = false;
  var _cooldown = 0;
  var MAX_HP = 80;
  var MAX_AMMO = 30;
  var FIRE_RANGE = 18;
  var ORBIT_RADIUS = 3.5;
  var ORBIT_SPEED = 0.8;

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
  }

  function deploy(playerPos) {
    if (_active || _cooldown > 0) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup(_cooldown > 0 ? '🚁 DRONE RECHARGING...' : '🚁 DRONE ALREADY DEPLOYED', '#ff8800');
      }
      return;
    }

    // Build drone mesh — flat disc body + 4 rotor arms
    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);

    var group = new THREE.Group();
    group.add(body);

    // 4 rotor arms
    for (var i = 0; i < 4; i++) {
      var armGeo = new THREE.BoxGeometry(0.8, 0.05, 0.08);
      var arm = new THREE.Mesh(armGeo, new THREE.MeshLambertMaterial({ color: 0x334455 }));
      arm.rotation.y = (i * Math.PI / 2) + Math.PI / 4;
      group.add(arm);
      // Rotor disc
      var rotorGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 6);
      var rotor = new THREE.Mesh(rotorGeo, new THREE.MeshLambertMaterial({ color: 0x88aacc }));
      var angle = (i * Math.PI / 2) + Math.PI / 4;
      rotor.position.set(Math.cos(angle) * 0.5, 0.05, Math.sin(angle) * 0.5);
      group.add(rotor);
    }

    // Green running light
    var light = new THREE.PointLight(0x00ff44, 1.5, 3);
    light.position.y = 0.2;
    group.add(light);

    group.position.set(playerPos.x, playerPos.y + 2, playerPos.z);
    _scene.add(group);

    _drone = {
      mesh: group,
      hp: MAX_HP,
      maxHp: MAX_HP,
      ammo: MAX_AMMO,
      target: null,
      fireTimer: 0,
      orbitAngle: 0,
      hoverBob: 0
    };
    _active = true;

    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('🚁 COMPANION DRONE DEPLOYED — ' + MAX_AMMO + ' rounds', '#00ff88');
    }
  }

  function recall() {
    if (!_active || !_drone) return;
    _scene.remove(_drone.mesh);
    _drone = null;
    _active = false;
    _cooldown = 60; // 60 second cooldown after recall
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('🚁 DRONE RECALLED — recharging 60s', '#ffaa00');
    }
  }

  function update(delta, playerPos, enemies) {
    // Count down cooldown
    if (_cooldown > 0) { _cooldown = Math.max(0, _cooldown - delta); }

    if (!_active || !_drone || !_scene) return;

    // Orbit player
    _drone.orbitAngle += ORBIT_SPEED * delta;
    var targetX = playerPos.x + Math.cos(_drone.orbitAngle) * ORBIT_RADIUS;
    var targetZ = playerPos.z + Math.sin(_drone.orbitAngle) * ORBIT_RADIUS;
    var targetY = playerPos.y + 2 + Math.sin(_drone.hoverBob) * 0.15;
    _drone.hoverBob += 2 * delta;

    // Smooth movement toward orbit position
    _drone.mesh.position.x += (targetX - _drone.mesh.position.x) * 4 * delta;
    _drone.mesh.position.y += (targetY - _drone.mesh.position.y) * 3 * delta;
    _drone.mesh.position.z += (targetZ - _drone.mesh.position.z) * 4 * delta;

    // Spin rotors (rotate the group slightly)
    _drone.mesh.rotation.y += delta * 0.5;

    // Find nearest enemy in range
    _drone.target = null;
    var nearestDist = FIRE_RANGE;
    if (enemies && enemies.length) {
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (!e || !e.mesh || (e.hp !== undefined && e.hp <= 0)) continue;
        var ep = e.mesh.position;
        var dx = ep.x - _drone.mesh.position.x;
        var dz = ep.z - _drone.mesh.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < nearestDist) {
          nearestDist = dist;
          _drone.target = e;
        }
      }
    }

    // Fire at target
    _drone.fireTimer = Math.max(0, _drone.fireTimer - delta);
    if (_drone.target && _drone.fireTimer <= 0 && _drone.ammo > 0) {
      _drone.fireTimer = 0.6; // fire every 0.6 seconds
      _drone.ammo--;

      // Deal damage to target (direct hit, no projectile for simplicity)
      var dmg = 18 + Math.random() * 10;
      if (_drone.target.hp !== undefined) {
        _drone.target.hp -= dmg;
      }
      if (typeof Tracers !== 'undefined' && Tracers.spawnTracer) {
        // Spawn a visual tracer from drone to target
        var start = _drone.mesh.position.clone();
        var end = _drone.target.mesh.position.clone();
        Tracers.spawnTracer(start, end, 0x00ff88);
      }

      // Ammo depleted
      if (_drone.ammo <= 0) {
        if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
          HUD.notifyPickup('🚁 DRONE OUT OF AMMO — recalling', '#ff8800');
        }
        setTimeout(function() { recall(); }, 2000);
      }
    }

    // Show ammo status periodically (via a small HUD element)
    _updateStatusHud();
  }

  var _statusEl = null;
  function _updateStatusHud() {
    if (!_statusEl) {
      _statusEl = document.createElement('div');
      _statusEl.id = 'companion-drone-hud';
      _statusEl.style.cssText = 'position:fixed;bottom:120px;right:12px;background:rgba(0,0,0,0.6);border:1px solid #00ff88;color:#00ff88;font-family:monospace;font-size:11px;padding:4px 8px;border-radius:3px;z-index:8000;pointer-events:none;display:none;';
      document.body.appendChild(_statusEl);
    }
    if (_active && _drone) {
      _statusEl.style.display = 'block';
      _statusEl.innerHTML = '🚁 DRONE HP: ' + _drone.hp + '/' + _drone.maxHp + ' · AMMO: ' + _drone.ammo;
    } else if (_cooldown > 0) {
      _statusEl.style.display = 'block';
      _statusEl.innerHTML = '🚁 DRONE: RECHARGING ' + Math.ceil(_cooldown) + 's';
    } else {
      _statusEl.style.display = 'none';
    }
  }

  function isActive() { return _active; }
  function getCooldown() { return _cooldown; }

  return { init: init, deploy: deploy, recall: recall, update: update, isActive: isActive, getCooldown: getCooldown };
})();
