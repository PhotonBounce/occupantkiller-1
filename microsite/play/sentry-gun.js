// sentry-gun.js — Deployable automated sentry turrets with AI targeting
// S+G keys to place sentry at player position (max 3 sentries).
// Sentry: BoxGeometry base, swivel, CylinderGeometry barrel, SphereGeometry eye.
// Detection: 180° arc, 25 unit range. Auto-fire 600 RPM. Ammo: 200 rounds.
// HP: 80. IFF: does not fire at player. Idle sweep ±45°. Manual E override.
// HUD: SENTRIES [1/3: 200rds OK] etc.
// Public API: init(scene, camera, getPlayer, getEnemies), update(dt), reset()

window.SentryGun = (function () {
  'use strict';

  // ─── Private state ────────────────────────────────────────────────────────

  var _scene = null;
  var _camera = null;
  var _getPlayer = null;
  var _getEnemies = null;

  var _sentries = [];
  var _MAX_SENTRIES = 3;
  var _RANGE = 25;
  var _MAX_HP = 80;
  var _MAX_AMMO = 200;
  var _FIRE_RATE = 60 / 600; // 600 RPM → seconds per shot = 0.1s
  var _SWEEP_SPEED = 15;     // degrees per second
  var _SWEEP_ARC = 45;       // ±45° idle sweep
  var _ROTATION_LIMIT = 90;  // ±90° from forward
  var _INTERACT_RANGE = 3;   // E key interaction range

  var _sKeyDown = false;
  var _gKeyDown = false;
  var _eKeyDown = false;
  var _placingMode = false;
  var _ghostMesh = null;

  var _hudEl = null;
  var _tracers = [];         // active tracer line objects
  var _TRACER_LIFE = 0.06;   // seconds each tracer lives

  // ─── Mesh builder ─────────────────────────────────────────────────────────

  function _buildSentryMesh() {
    var group = new THREE.Group();

    // Base — dark gray box 1×0.5×1
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), baseMat);
    base.position.y = 0.25;
    group.add(base);

    // Swivel group — rotates to track enemies
    var swivelGroup = new THREE.Group();
    swivelGroup.position.y = 0.5;
    group.add(swivelGroup);

    // Swivel body 0.6×0.4×0.8
    var swivelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var swivel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.8), swivelMat);
    swivel.position.y = 0.2;
    swivelGroup.add(swivel);

    // Barrel — CylinderGeometry r=0.1 length=1.2, pointing forward (along -Z)
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), barrelMat);
    barrel.position.set(0, 0.2, -0.6 - 0.3); // extend forward from swivel center
    barrel.rotation.x = Math.PI / 2; // cylinder Y → -Z direction
    swivelGroup.add(barrel);

    // Muzzle flash point light (hidden initially)
    var muzzleLight = new THREE.PointLight(0xFFAA00, 0, 4);
    muzzleLight.position.set(0, 0.2, -1.5);
    swivelGroup.add(muzzleLight);

    // Sensor "eye" — small red sphere on top of swivel
    var eyeMat = new THREE.MeshLambertMaterial({ color: 0xFF0000, emissive: 0x880000 });
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
    eye.position.set(0, 0.45, -0.1);
    swivelGroup.add(eye);

    // Status light — changes color when off
    var statusLight = new THREE.PointLight(0x00FF44, 0.3, 2);
    statusLight.position.set(0, 0.6, 0);
    group.add(statusLight);

    return {
      group: group,
      swivelGroup: swivelGroup,
      muzzleLight: muzzleLight,
      statusLight: statusLight,
      eye: eye,
      eyeMat: eyeMat
    };
  }

  function _buildGhostMesh() {
    var group = new THREE.Group();
    var mat = new THREE.MeshLambertMaterial({
      color: 0x00FF88,
      transparent: true,
      opacity: 0.45
    });
    var base = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), mat);
    base.position.y = 0.25;
    group.add(base);
    var swivel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.8), mat);
    swivel.position.y = 0.7;
    group.add(swivel);
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), mat);
    barrel.position.set(0, 0.7, -0.9);
    barrel.rotation.x = Math.PI / 2;
    group.add(barrel);
    return group;
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'sentry-gun-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:900',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (_sentries.length === 0) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var parts = ['SENTRIES'];
    for (var i = 0; i < _sentries.length; i++) {
      var s = _sentries[i];
      var idx = (i + 1) + '/' + _MAX_SENTRIES;
      var status;
      if (s.destroyed) {
        status = '[' + idx + ': DESTROYED]';
      } else if (!s.active) {
        status = '[' + idx + ': ' + s.ammo + 'rds OFF]';
      } else {
        status = '[' + idx + ': ' + s.ammo + 'rds OK]';
      }
      parts.push(status);
    }
    _hudEl.textContent = parts.join(' ');
  }

  // ─── Sentry placement ─────────────────────────────────────────────────────

  function _placeSentry() {
    if (_sentries.length >= _MAX_SENTRIES) return;
    var player = _getPlayer ? _getPlayer() : null;
    var pos = new THREE.Vector3(0, 0, 0);
    if (player && player.position) {
      pos.copy(player.position);
    } else if (_camera) {
      pos.copy(_camera.position);
    }

    var mesh = _buildSentryMesh();
    mesh.group.position.copy(pos);
    _scene.add(mesh.group);

    // Determine forward direction from camera or player
    var forwardAngle = 0;
    if (_camera) {
      forwardAngle = _camera.rotation.y;
    }
    mesh.group.rotation.y = forwardAngle;

    var sentry = {
      mesh: mesh,
      position: pos.clone(),
      hp: _MAX_HP,
      ammo: _MAX_AMMO,
      active: true,
      destroyed: false,
      fireTimer: 0,
      sweepAngle: 0,
      sweepDir: 1,
      swivelAngle: 0,    // current swivel offset in radians
      smokeTimer: 0,
      smokeParticles: [],
      flickerTimer: 0,
      forwardAngle: forwardAngle  // world Y rotation of the base (group)
    };

    _sentries.push(sentry);
    _updateHUD();
  }

  // ─── Smoke particles ──────────────────────────────────────────────────────

  function _spawnSmoke(sentry) {
    var geo = new THREE.SphereGeometry(0.15, 4, 4);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.6
    });
    var smoke = new THREE.Mesh(geo, mat);
    var pos = sentry.position.clone();
    pos.y += 0.5;
    pos.x += (Math.random() - 0.5) * 0.4;
    pos.z += (Math.random() - 0.5) * 0.4;
    smoke.position.copy(pos);
    smoke.userData.life = 1.5 + Math.random() * 0.5;
    smoke.userData.vy = 0.8 + Math.random() * 0.4;
    _scene.add(smoke);
    sentry.smokeParticles.push(smoke);
  }

  // ─── Tracer lines ─────────────────────────────────────────────────────────

  function _spawnTracer(from, to) {
    var points = [from.clone(), to.clone()];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0xFFFF44, linewidth: 1 });
    var line = new THREE.LineSegments(geo, mat);
    line.userData.life = _TRACER_LIFE;
    _scene.add(line);
    _tracers.push(line);
  }

  // ─── Angle helpers ────────────────────────────────────────────────────────

  function _angleDiff(a, b) {
    // Returns difference b - a wrapped to [-PI, PI]
    var diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  // ─── Main update ──────────────────────────────────────────────────────────

  function _updateTracers(dt) {
    for (var i = _tracers.length - 1; i >= 0; i--) {
      _tracers[i].userData.life -= dt;
      if (_tracers[i].userData.life <= 0) {
        _scene.remove(_tracers[i]);
        _tracers[i].geometry.dispose();
        _tracers[i].material.dispose();
        _tracers.splice(i, 1);
      }
    }
  }

  function _updateSentry(sentry, dt) {
    if (sentry.destroyed) {
      // Update smoke particles
      sentry.smokeTimer += dt;
      if (sentry.smokeTimer > 0.12) {
        sentry.smokeTimer = 0;
        _spawnSmoke(sentry);
      }
      for (var pi = sentry.smokeParticles.length - 1; pi >= 0; pi--) {
        var sp = sentry.smokeParticles[pi];
        sp.userData.life -= dt;
        sp.position.y += sp.userData.vy * dt;
        sp.material.opacity = Math.max(0, (sp.userData.life / 2) * 0.6);
        if (sp.userData.life <= 0) {
          _scene.remove(sp);
          sp.geometry.dispose();
          sp.material.dispose();
          sentry.smokeParticles.splice(pi, 1);
        }
      }
      // Flicker status light
      sentry.flickerTimer -= dt;
      if (sentry.flickerTimer <= 0) {
        sentry.mesh.statusLight.intensity = 0;
      }
      return;
    }

    // Off state — show yellow glow
    if (!sentry.active) {
      sentry.mesh.statusLight.color.setHex(0xFFFF00);
      sentry.mesh.statusLight.intensity = 0.5;
      sentry.mesh.muzzleLight.intensity = 0;
      return;
    }

    // Active — green status
    sentry.mesh.statusLight.color.setHex(0x00FF44);
    sentry.mesh.statusLight.intensity = 0.3;

    // Find nearest enemy in arc and range
    var enemies = _getEnemies ? _getEnemies() : [];
    var player = _getPlayer ? _getPlayer() : null;
    var bestEnemy = null;
    var bestDist = Infinity;

    for (var ei = 0; ei < enemies.length; ei++) {
      var enemy = enemies[ei];
      if (!enemy || !enemy.position) continue;
      // IFF: skip player
      if (player && enemy === player) continue;
      if (enemy.isPlayer || (enemy.userData && enemy.userData.isPlayer)) continue;

      var dx = enemy.position.x - sentry.position.x;
      var dz = enemy.position.z - sentry.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > _RANGE) continue;

      // Check 180° arc: angle from sentry forward direction
      // sentry base forward in world = -Z rotated by forwardAngle
      var worldAngle = Math.atan2(dx, -dz); // angle in world from -Z axis
      var relAngle = _angleDiff(sentry.forwardAngle, worldAngle);

      // ±90° = 180° total arc
      if (Math.abs(relAngle) > Math.PI / 2) continue;

      // Check rotation limit for swivel (already covered by arc check but ensure swivel can reach)
      if (dist < bestDist) {
        bestDist = dist;
        bestEnemy = enemy;
      }
    }

    if (bestEnemy) {
      // Rotate swivel toward enemy
      var dx2 = bestEnemy.position.x - sentry.position.x;
      var dz2 = bestEnemy.position.z - sentry.position.z;
      var targetWorldAngle = Math.atan2(dx2, -dz2);
      var targetSwivelAngle = _angleDiff(sentry.forwardAngle, targetWorldAngle);

      // Clamp to ±90°
      targetSwivelAngle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetSwivelAngle));

      // Smooth rotation toward target
      var angleDelta = _angleDiff(sentry.swivelAngle, targetSwivelAngle);
      var maxRotate = 2.5 * dt; // radians per second
      if (Math.abs(angleDelta) < maxRotate) {
        sentry.swivelAngle = targetSwivelAngle;
      } else {
        sentry.swivelAngle += Math.sign(angleDelta) * maxRotate;
      }
      sentry.mesh.swivelGroup.rotation.y = sentry.swivelAngle;

      // Attempt to fire
      sentry.fireTimer -= dt;
      if (sentry.fireTimer <= 0 && sentry.ammo > 0) {
        sentry.fireTimer = _FIRE_RATE;
        sentry.ammo--;

        // Muzzle flash
        sentry.mesh.muzzleLight.intensity = 3.5;
        (function (ml) {
          setTimeout(function () { ml.intensity = 0; }, 55);
        })(sentry.mesh.muzzleLight);

        // Tracer from barrel tip to enemy
        var muzzlePos = new THREE.Vector3();
        sentry.mesh.muzzleLight.getWorldPosition(muzzlePos);
        var targetPos = bestEnemy.position.clone();
        targetPos.y += 0.5;
        _spawnTracer(muzzlePos, targetPos);

        // Apply damage if enemy has hp/takeDamage
        if (typeof bestEnemy.takeDamage === 'function') {
          bestEnemy.takeDamage(15, 'sentry');
        } else if (bestEnemy.userData && bestEnemy.userData.hp !== undefined) {
          bestEnemy.userData.hp -= 15;
        }

        // Enemy shoots back 10% chance
        if (Math.random() < 0.10) {
          sentry.hp -= 5 + Math.floor(Math.random() * 8);
          if (sentry.hp <= 0) {
            _destroySentry(sentry);
            return;
          }
        }

        if (sentry.ammo <= 0) {
          sentry.mesh.muzzleLight.intensity = 0;
        }

        _updateHUD();
      } else {
        // Fade muzzle light
        if (sentry.mesh.muzzleLight.intensity > 0) {
          sentry.mesh.muzzleLight.intensity = Math.max(0, sentry.mesh.muzzleLight.intensity - dt * 40);
        }
      }

    } else {
      // No target — idle sweep ±45°
      sentry.mesh.muzzleLight.intensity = Math.max(0, sentry.mesh.muzzleLight.intensity - dt * 20);

      var sweepRad = _SWEEP_ARC * Math.PI / 180;
      sentry.sweepAngle += _SWEEP_SPEED * Math.PI / 180 * sentry.sweepDir * dt;
      if (sentry.sweepAngle >= sweepRad) {
        sentry.sweepAngle = sweepRad;
        sentry.sweepDir = -1;
      } else if (sentry.sweepAngle <= -sweepRad) {
        sentry.sweepAngle = -sweepRad;
        sentry.sweepDir = 1;
      }
      sentry.swivelAngle = sentry.sweepAngle;
      sentry.mesh.swivelGroup.rotation.y = sentry.swivelAngle;
      sentry.fireTimer = Math.max(sentry.fireTimer - dt, 0);
    }
  }

  function _destroySentry(sentry) {
    sentry.destroyed = true;
    sentry.hp = 0;
    sentry.mesh.statusLight.intensity = 0;
    sentry.mesh.muzzleLight.intensity = 0;

    // Tip over
    sentry.mesh.group.rotation.z = Math.PI / 2;

    // Flicker the status light briefly
    sentry.flickerTimer = 0.5;
    var flickerCount = 0;
    var flickerInterval = setInterval(function () {
      if (!sentry.mesh || !sentry.mesh.statusLight) {
        clearInterval(flickerInterval);
        return;
      }
      sentry.mesh.statusLight.intensity = (flickerCount % 2 === 0) ? 0.8 : 0;
      flickerCount++;
      if (flickerCount > 6) {
        clearInterval(flickerInterval);
        sentry.mesh.statusLight.intensity = 0;
      }
    }, 80);

    _updateHUD();
  }

  // ─── Ghost preview ────────────────────────────────────────────────────────

  function _updateGhost() {
    if (!_placingMode) {
      if (_ghostMesh) {
        _scene.remove(_ghostMesh);
        _ghostMesh = null;
      }
      return;
    }
    if (!_ghostMesh) {
      _ghostMesh = _buildGhostMesh();
      _scene.add(_ghostMesh);
    }
    var player = _getPlayer ? _getPlayer() : null;
    if (player && player.position) {
      _ghostMesh.position.copy(player.position);
    } else if (_camera) {
      _ghostMesh.position.copy(_camera.position);
    }
    if (_camera) {
      _ghostMesh.rotation.y = _camera.rotation.y;
    }
  }

  // ─── E-key interaction: toggle ON/OFF ─────────────────────────────────────

  function _checkInteraction() {
    var player = _getPlayer ? _getPlayer() : null;
    var playerPos = (player && player.position) ? player.position : (_camera ? _camera.position : null);
    if (!playerPos) return;

    for (var i = 0; i < _sentries.length; i++) {
      var s = _sentries[i];
      if (s.destroyed) continue;
      var dx = playerPos.x - s.position.x;
      var dz = playerPos.z - s.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= _INTERACT_RANGE) {
        s.active = !s.active;
        if (!s.active) {
          s.mesh.statusLight.color.setHex(0xFFFF00);
          s.mesh.statusLight.intensity = 0.5;
          s.mesh.muzzleLight.intensity = 0;
          // Yellow tint on eye when off
          s.mesh.eyeMat.color.setHex(0xFFFF00);
          s.mesh.eyeMat.emissive.setHex(0x888800);
        } else {
          s.mesh.statusLight.color.setHex(0x00FF44);
          s.mesh.statusLight.intensity = 0.3;
          s.mesh.eyeMat.color.setHex(0xFF0000);
          s.mesh.eyeMat.emissive.setHex(0x880000);
        }
        _updateHUD();
        break;
      }
    }
  }

  // ─── Key handlers ─────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if (e.code === 'KeyS' || e.key === 's' || e.key === 'S') _sKeyDown = true;
    if (e.code === 'KeyG' || e.key === 'g' || e.key === 'G') _gKeyDown = true;

    // S+G to enter/confirm placement
    if (_sKeyDown && _gKeyDown) {
      if (!_placingMode) {
        _placingMode = true;
      } else {
        // Place sentry on second press of both
        if (_sentries.length < _MAX_SENTRIES) {
          _placeSentry();
        }
        _placingMode = false;
        _sKeyDown = false;
        _gKeyDown = false;
      }
    }

    if ((e.code === 'KeyE' || e.key === 'e' || e.key === 'E') && !_eKeyDown) {
      _eKeyDown = true;
      _checkInteraction();
    }
  }

  function _onKeyUp(e) {
    if (e.code === 'KeyS' || e.key === 's' || e.key === 'S') _sKeyDown = false;
    if (e.code === 'KeyG' || e.key === 'g' || e.key === 'G') _gKeyDown = false;
    if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') _eKeyDown = false;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function init(scene, camera, getPlayer, getEnemies) {
    _scene = scene;
    _camera = camera;
    _getPlayer = getPlayer || null;
    _getEnemies = getEnemies || null;
    _sentries = [];
    _tracers = [];
    _placingMode = false;
    _sKeyDown = false;
    _gKeyDown = false;
    _eKeyDown = false;

    _ensureHUD();
    _updateHUD();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
  }

  function update(dt) {
    if (!_scene) return;

    _updateGhost();
    _updateTracers(dt);

    for (var i = 0; i < _sentries.length; i++) {
      _updateSentry(_sentries[i], dt);
    }
  }

  function reset() {
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup', _onKeyUp);

    for (var i = 0; i < _sentries.length; i++) {
      var s = _sentries[i];
      if (s.mesh && s.mesh.group && _scene) {
        _scene.remove(s.mesh.group);
      }
      for (var pi = 0; pi < s.smokeParticles.length; pi++) {
        if (_scene) _scene.remove(s.smokeParticles[pi]);
      }
    }
    _sentries = [];

    for (var ti = 0; ti < _tracers.length; ti++) {
      if (_scene) _scene.remove(_tracers[ti]);
    }
    _tracers = [];

    if (_ghostMesh && _scene) {
      _scene.remove(_ghostMesh);
      _ghostMesh = null;
    }

    if (_hudEl) {
      _hudEl.style.display = 'none';
    }

    _placingMode = false;
    _sKeyDown = false;
    _gKeyDown = false;
    _eKeyDown = false;
  }

  return { init: init, update: update, reset: reset };

}());
