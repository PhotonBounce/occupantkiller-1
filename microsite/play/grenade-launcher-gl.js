window.GrenadeLauncherGL = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MAX_ROUNDS        = 6;
  var RELOAD_TIME       = 4.0;        // seconds for full reload
  var PROJECTILE_SPEED  = 18;         // m/s initial muzzle velocity
  var GRAVITY           = -5;         // m/s² (gentle arc)
  var MAX_RANGE         = 80;         // metres before detonation
  var MIN_ARM_DIST      = 5;          // metres before grenade is armed
  var BACK_BLAST_DIST   = 3;          // metres wall check behind camera
  var BACK_BLAST_DAMAGE = 10;
  var ARC_DOTS          = 8;          // trajectory preview dots
  var ARC_STEP_TIME     = 0.18;       // seconds per arc step
  var STAR_DURATION     = 8;          // seconds for illumination round
  var STAR_RANGE        = 20;         // metres illumination radius

  // Round type definitions
  var ROUND_TYPES = [
    { name: 'HE',       label: 'HE',      damage: 85, blastRadius: 4  },
    { name: 'SMOKE',    label: 'SMK',     damage: 0,  blastRadius: 0  },
    { name: 'STAR',     label: 'STAR',    damage: 0,  blastRadius: 0  },
    { name: 'BUCKSHOT', label: 'BUCK',    damage: 0,  blastRadius: 0  }
  ];

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;

  var _glMode         = false;        // underbarrel GL toggle
  var _roundIndex     = 0;            // current round type
  var _ammoCount      = MAX_ROUNDS;
  var _reloading      = false;
  var _reloadTimer    = 0;
  var _reloadAngle    = 0;            // GL tube rotation during reload

  var _projectiles    = [];   // active grenade objects
  var _particles      = [];   // explosion particle objects
  var _smokeClouds    = [];   // smoke spheres from SMOKE rounds
  var _starLights     = [];   // { light, age }

  var _glTubeMesh     = null; // GL tube attached to camera
  var _arcDots        = [];   // trajectory preview dot meshes

  var _hudEl          = null;
  var _warnEl         = null; // back-blast / unarmed warning element

  var _keysDown       = {};
  var _bKeyHeld       = false;
  var _altBHeld       = false;
  var _mouseDownGL    = false;
  var _ctrlGHeld      = false;

  var _playerHealth   = 100; // track self-damage; expose via window if needed

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'gl-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:155px',
      'left:20px',
      'color:#ccffaa',
      'font-family:monospace',
      'font-size:13px',
      'text-shadow:0 0 5px #000',
      'pointer-events:none',
      'z-index:501',
      'user-select:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    _warnEl = document.createElement('div');
    _warnEl.id = 'gl-warn';
    _warnEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ff4444',
      'font-family:monospace',
      'font-size:16px',
      'font-weight:bold',
      'text-shadow:0 0 8px #ff0000',
      'pointer-events:none',
      'z-index:600',
      'user-select:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_warnEl);

    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_glMode) {
      _hudEl.textContent = 'GL MODE [B]';
      _hudEl.style.color = '#888888';
      return;
    }
    var rnd = ROUND_TYPES[_roundIndex];
    var dots = '';
    for (var i = 0; i < MAX_ROUNDS; i++) {
      dots += (i < _ammoCount) ? '|' : 'o';
    }
    var reloadStr = _reloading ? ' [RELOADING ' + _reloadTimer.toFixed(1) + 's]' : '';
    _hudEl.textContent = 'GL [' + _ammoCount + '] ' + dots + '  ' + rnd.label + '  Alt+B:cycle' + reloadStr;
    _hudEl.style.color = '#ccffaa';
  }

  function _showWarning(msg, duration) {
    if (!_warnEl) return;
    _warnEl.textContent = msg;
    _warnEl.style.display = 'block';
    if (_warnEl._timer) clearTimeout(_warnEl._timer);
    _warnEl._timer = setTimeout(function () {
      if (_warnEl) _warnEl.style.display = 'none';
    }, (duration || 2) * 1000);
  }

  // ── GL Tube mesh ─────────────────────────────────────────────────────────
  function _createGLTube() {
    if (_glTubeMesh) {
      if (_camera) _camera.remove(_glTubeMesh);
      if (_glTubeMesh.geometry) _glTubeMesh.geometry.dispose();
      if (_glTubeMesh.material) _glTubeMesh.material.dispose();
      _glTubeMesh = null;
    }
    var geo = new THREE.BoxGeometry(0.05, 0.06, 0.3);
    var mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    _glTubeMesh = new THREE.Mesh(geo, mat);
    // Position below main weapon (camera-local space)
    _glTubeMesh.position.set(0.08, -0.14, -0.25);
    if (_camera) _camera.add(_glTubeMesh);
  }

  function _removeGLTube() {
    if (_glTubeMesh) {
      if (_camera) _camera.remove(_glTubeMesh);
      if (_glTubeMesh.geometry) _glTubeMesh.geometry.dispose();
      if (_glTubeMesh.material) _glTubeMesh.material.dispose();
      _glTubeMesh = null;
    }
  }

  // ── Trajectory arc preview ────────────────────────────────────────────────
  function _createArcDots() {
    _clearArcDots();
    for (var i = 0; i < ARC_DOTS; i++) {
      var geo = new THREE.SphereGeometry(0.05, 4, 4);
      var mat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.7 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      _scene.add(mesh);
      _arcDots.push(mesh);
    }
  }

  function _clearArcDots() {
    for (var i = 0; i < _arcDots.length; i++) {
      var m = _arcDots[i];
      if (_scene) _scene.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) m.material.dispose();
    }
    _arcDots = [];
  }

  function _updateArcDots() {
    if (!_glMode || !_camera || _arcDots.length === 0) {
      for (var h = 0; h < _arcDots.length; h++) _arcDots[h].visible = false;
      return;
    }

    var camPos = new THREE.Vector3();
    _camera.getWorldPosition(camPos);
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);

    var vx = dir.x * PROJECTILE_SPEED;
    var vy = dir.y * PROJECTILE_SPEED;
    var vz = dir.z * PROJECTILE_SPEED;

    var px = camPos.x;
    var py = camPos.y;
    var pz = camPos.z;

    for (var i = 0; i < ARC_DOTS; i++) {
      var t = (i + 1) * ARC_STEP_TIME;
      var nx = px + vx * t;
      var ny = py + vy * t + 0.5 * GRAVITY * t * t;
      var nz = pz + vz * t;
      _arcDots[i].position.set(nx, ny, nz);
      _arcDots[i].visible = (ny > 0);
    }
  }

  // ── Back-blast check ─────────────────────────────────────────────────────
  function _checkBackBlast() {
    if (!_camera || typeof THREE === 'undefined') return false;
    var camPos = new THREE.Vector3();
    _camera.getWorldPosition(camPos);
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    var behind = dir.clone().negate();

    var raycaster = new THREE.Raycaster(camPos, behind, 0, BACK_BLAST_DIST);
    // Try to get scene objects to intersect against
    var hits = [];
    if (_scene) {
      var candidates = [];
      _scene.traverse(function (obj) {
        if (obj.isMesh && obj !== _glTubeMesh) {
          candidates.push(obj);
        }
      });
      hits = raycaster.intersectObjects(candidates, false);
    }
    return hits.length > 0;
  }

  // ── Self-damage ───────────────────────────────────────────────────────────
  function _applySelfDamage(amount) {
    _playerHealth = Math.max(0, _playerHealth - amount);
    // Hook into game health system if available
    if (window.PlayerHealth && typeof window.PlayerHealth.damage === 'function') {
      window.PlayerHealth.damage(amount);
    } else if (window._playerHealth !== undefined) {
      window._playerHealth = _playerHealth;
    }
  }

  // ── Explosion / impact effects ────────────────────────────────────────────
  function _spawnExplosion(pos, roundType) {
    var count = 14;
    for (var i = 0; i < count; i++) {
      var geo = new THREE.SphereGeometry(0.07, 4, 4);
      var mat = new THREE.MeshBasicMaterial({
        color: (i % 3 === 0) ? 0xff6600 : (i % 3 === 1) ? 0xffcc00 : 0xff3300,
        transparent: true,
        opacity: 0.9
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      _scene.add(mesh);
      var speed = 2 + Math.random() * 4;
      var angle = Math.random() * Math.PI * 2;
      var elev  = (Math.random() - 0.3) * Math.PI;
      _particles.push({
        mesh: mesh,
        vx: Math.cos(angle) * Math.cos(elev) * speed,
        vy: Math.sin(elev) * speed + 1,
        vz: Math.sin(angle) * Math.cos(elev) * speed,
        age: 0,
        life: 0.5 + Math.random() * 0.4
      });
    }
  }

  function _spawnSmokeClouds(pos) {
    for (var i = 0; i < 3; i++) {
      var geo = new THREE.SphereGeometry(0.4, 6, 6);
      var mat = new THREE.MeshBasicMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.6,
        depthWrite: false
      });
      var mesh = new THREE.Mesh(geo, mat);
      var ox = (Math.random() * 2 - 1) * 1.5;
      var oz = (Math.random() * 2 - 1) * 1.5;
      mesh.position.set(pos.x + ox, pos.y + 0.3, pos.z + oz);
      _scene.add(mesh);
      _smokeClouds.push({ mesh: mesh, age: 0, life: 12 });
    }
  }

  function _spawnStarLight(pos) {
    var light = new THREE.PointLight(0xffffff, 2.5, STAR_RANGE);
    light.position.copy(pos);
    light.position.y += 3;
    _scene.add(light);

    // Small bright sphere to represent the flare
    var geo = new THREE.SphereGeometry(0.18, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(light.position);
    _scene.add(mesh);

    _starLights.push({ light: light, mesh: mesh, age: 0, life: STAR_DURATION });
  }

  function _fireBuckshotPellets(pos) {
    // 8 hitscan pellets in 20° cone from impact position
    var pelletCount = 8;
    var coneHalfAngle = (20 / 2) * (Math.PI / 180);

    // Pellets radiate outward from impact in all directions (simulate spread)
    for (var i = 0; i < pelletCount; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.random() * coneHalfAngle;
      var dx = Math.cos(phi);
      var dy = Math.sin(phi) * Math.sin(theta);
      var dz = Math.sin(phi) * Math.cos(theta);

      var dir = new THREE.Vector3(dx, dy, dz).normalize();
      var origin = pos.clone();
      origin.y += 0.5;

      if (typeof THREE !== 'undefined' && _scene) {
        var raycaster = new THREE.Raycaster(origin, dir, 0, 30);
        var candidates = [];
        _scene.traverse(function (obj) {
          if (obj.isMesh) candidates.push(obj);
        });
        var hits = raycaster.intersectObjects(candidates, false);
        if (hits.length > 0) {
          // Check if hit enemy
          if (window.Enemies && typeof window.Enemies.getAll === 'function') {
            var enemies = window.Enemies.getAll();
            for (var ei = 0; ei < enemies.length; ei++) {
              var en = enemies[ei];
              var epos = (en.mesh && en.mesh.position) ? en.mesh.position : en.position;
              if (!epos) continue;
              var dist = hits[0].point.distanceTo(epos);
              if (dist < 1.2) {
                if (typeof en.takeDamage === 'function') en.takeDamage(18);
                else if (typeof en.health !== 'undefined') en.health -= 18;
              }
            }
          }
        }
      }
    }
  }

  function _dealBlastDamage(pos, roundType) {
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;
    var r = ROUND_TYPES[roundType];
    if (!r || r.blastRadius <= 0) return;
    var enemies = window.Enemies.getAll();
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      var epos = (en.mesh && en.mesh.position) ? en.mesh.position : en.position;
      if (!epos) continue;
      var dx = epos.x - pos.x;
      var dy = epos.y - pos.y;
      var dz = epos.z - pos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= r.blastRadius) {
        var falloff = 1 - (dist / r.blastRadius);
        var dmg = Math.round(r.damage * falloff);
        if (typeof en.takeDamage === 'function') en.takeDamage(dmg);
        else if (typeof en.health !== 'undefined') en.health -= dmg;
      }
    }
  }

  // ── Impact detonation ─────────────────────────────────────────────────────
  function _detonate(projectile) {
    var pos = projectile.mesh.position.clone();
    var roundType = projectile.roundType;

    if (_scene) {
      _scene.remove(projectile.mesh);
    }
    if (projectile.mesh.geometry) projectile.mesh.geometry.dispose();
    if (projectile.mesh.material) projectile.mesh.material.dispose();

    var rnd = ROUND_TYPES[roundType];

    if (!projectile.armed) {
      _showWarning('UNARMED — DUD', 1.5);
      return;
    }

    // Round-specific effects
    if (rnd.name === 'HE') {
      _spawnExplosion(pos, roundType);
      _dealBlastDamage(pos, roundType);
      if (window.AudioSystem) window.AudioSystem.playExplosion();
    } else if (rnd.name === 'SMOKE') {
      _spawnSmokeClouds(pos);
      if (window.AudioSystem) window.AudioSystem.playSmoke();
    } else if (rnd.name === 'STAR') {
      _spawnStarLight(pos);
    } else if (rnd.name === 'BUCKSHOT') {
      _spawnExplosion(pos, 0); // small flash
      _fireBuckshotPellets(pos);
    }
  }

  // ── Fire ──────────────────────────────────────────────────────────────────
  function fire() {
    if (!_glMode) return;
    if (!_scene || !_camera) return;
    if (_ammoCount <= 0) {
      _showWarning('GL EMPTY — Press R to reload', 2);
      return;
    }
    if (_reloading) return;

    // Back-blast check
    var backBlast = _checkBackBlast();
    if (backBlast) {
      _showWarning('BACK-BLAST DANGER!', 2.5);
      _applySelfDamage(BACK_BLAST_DAMAGE);
    }

    _ammoCount -= 1;

    var geo = new THREE.SphereGeometry(0.08, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x556b2f }); // olive green
    var mesh = new THREE.Mesh(geo, mat);

    var camPos = new THREE.Vector3();
    _camera.getWorldPosition(camPos);
    // Spawn slightly in front of camera
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    mesh.position.copy(camPos).addScaledVector(dir, 0.5);
    _scene.add(mesh);

    var vel = new THREE.Vector3(
      dir.x * PROJECTILE_SPEED,
      dir.y * PROJECTILE_SPEED,
      dir.z * PROJECTILE_SPEED
    );

    _projectiles.push({
      mesh:       mesh,
      velocity:   vel,
      muzzlePos:  camPos.clone(),
      age:        0,
      roundType:  _roundIndex,
      armed:      false
    });

    _updateHUD();
    if (window.AudioSystem) window.AudioSystem.playGunshot();
  }

  // ── Reload ────────────────────────────────────────────────────────────────
  function _startReload() {
    if (_reloading) return;
    if (_ammoCount >= MAX_ROUNDS) return;
    _reloading  = true;
    _reloadTimer = RELOAD_TIME;
    _reloadAngle = 0;
    _updateHUD();
  }

  function _updateReload(dt) {
    if (!_reloading) return;
    _reloadTimer -= dt;

    // Animate GL tube: rotate 60° over reload duration
    if (_glTubeMesh) {
      var targetAngle = (Math.PI / 3); // 60 degrees
      var frac = 1 - Math.max(0, _reloadTimer / RELOAD_TIME);
      _glTubeMesh.rotation.x = frac * targetAngle;
    }

    if (_reloadTimer <= 0) {
      _reloading   = false;
      _ammoCount   = MAX_ROUNDS;
      _reloadTimer = 0;
      if (_glTubeMesh) _glTubeMesh.rotation.x = 0;
      _updateHUD();
    } else {
      _updateHUD();
    }
  }

  // ── Update projectiles ────────────────────────────────────────────────────
  function _updateProjectiles(dt) {
    var toRemove = [];
    for (var i = 0; i < _projectiles.length; i++) {
      var p = _projectiles[i];

      // Physics
      p.velocity.y += GRAVITY * dt;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      // Tumble
      p.mesh.rotation.x += 8 * dt;

      p.age += dt;

      // Arm check
      var distTraveled = p.mesh.position.distanceTo(p.muzzlePos);
      p.armed = (distTraveled >= MIN_ARM_DIST);

      // Detonation: ground impact or max range
      var impactGround = p.mesh.position.y <= 0;
      var impactRange  = distTraveled >= MAX_RANGE;

      if (impactGround || impactRange) {
        _detonate(p);
        toRemove.push(i);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _projectiles.splice(toRemove[j], 1);
    }
  }

  // ── Update particles ──────────────────────────────────────────────────────
  function _updateParticles(dt) {
    var toRemove = [];
    for (var i = 0; i < _particles.length; i++) {
      var pt = _particles[i];
      pt.age += dt;
      pt.vx *= 0.93;
      pt.vy += GRAVITY * dt * 0.5;
      pt.vz *= 0.93;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      var life = Math.max(0, 1 - pt.age / pt.life);
      pt.mesh.material.opacity = life * 0.9;
      if (pt.age >= pt.life) {
        if (_scene) _scene.remove(pt.mesh);
        if (pt.mesh.geometry) pt.mesh.geometry.dispose();
        if (pt.mesh.material) pt.mesh.material.dispose();
        toRemove.push(i);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _particles.splice(toRemove[j], 1);
    }
  }

  // ── Update smoke clouds ───────────────────────────────────────────────────
  function _updateSmokeClouds(dt) {
    var toRemove = [];
    for (var i = 0; i < _smokeClouds.length; i++) {
      var sc = _smokeClouds[i];
      sc.age += dt;
      // Expand slowly
      var scale = 1 + sc.age * 0.3;
      sc.mesh.scale.set(scale, scale, scale);
      // Fade out in last 3 seconds
      var remaining = sc.life - sc.age;
      if (remaining < 3) {
        sc.mesh.material.opacity = Math.max(0, 0.6 * (remaining / 3));
      }
      if (sc.age >= sc.life) {
        if (_scene) _scene.remove(sc.mesh);
        if (sc.mesh.geometry) sc.mesh.geometry.dispose();
        if (sc.mesh.material) sc.mesh.material.dispose();
        toRemove.push(i);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _smokeClouds.splice(toRemove[j], 1);
    }
  }

  // ── Update star lights ────────────────────────────────────────────────────
  function _updateStarLights(dt) {
    var toRemove = [];
    for (var i = 0; i < _starLights.length; i++) {
      var sl = _starLights[i];
      sl.age += dt;
      // Flicker
      sl.light.intensity = 2.0 + Math.sin(sl.age * 15) * 0.3;
      // Fade in last 2 seconds
      var remaining = sl.life - sl.age;
      if (remaining < 2) {
        var frac = remaining / 2;
        sl.light.intensity *= frac;
      }
      if (sl.age >= sl.life) {
        if (_scene) {
          _scene.remove(sl.light);
          _scene.remove(sl.mesh);
        }
        if (sl.mesh.geometry) sl.mesh.geometry.dispose();
        if (sl.mesh.material) sl.mesh.material.dispose();
        toRemove.push(i);
      }
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _starLights.splice(toRemove[j], 1);
    }
  }

  // ── Keyboard handling ─────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    // B → toggle GL mode
    if (e.code === 'KeyB' && !e.altKey && !e.ctrlKey) {
      if (!_bKeyHeld) {
        _bKeyHeld = true;
        _glMode = !_glMode;
        if (_glMode) {
          _createGLTube();
          _createArcDots();
        } else {
          _removeGLTube();
          _clearArcDots();
        }
        _updateHUD();
      }
    }

    // Alt+B → cycle round type
    if (e.code === 'KeyB' && e.altKey) {
      e.preventDefault();
      if (!_altBHeld) {
        _altBHeld = true;
        _roundIndex = (_roundIndex + 1) % ROUND_TYPES.length;
        _showWarning('GL: ' + ROUND_TYPES[_roundIndex].label, 1);
        _updateHUD();
      }
    }

    // R → reload GL (only when in GL mode)
    if (e.code === 'KeyR' && _glMode) {
      _startReload();
    }

    // Ctrl+G → fire GL
    if (e.code === 'KeyG' && e.ctrlKey) {
      e.preventDefault();
      if (!_ctrlGHeld) {
        _ctrlGHeld = true;
        fire();
      }
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
    if (e.code === 'KeyB') {
      _bKeyHeld = false;
      _altBHeld = false;
    }
    if (e.code === 'KeyG') {
      _ctrlGHeld = false;
    }
  }

  function _onMouseDown(e) {
    // Left click (button 0) while in GL mode
    if (e.button === 0 && _glMode) {
      if (!_mouseDownGL) {
        _mouseDownGL = true;
        fire();
      }
    }
  }

  function _onMouseUp(e) {
    if (e.button === 0) {
      _mouseDownGL = false;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _glMode      = false;
    _roundIndex  = 0;
    _ammoCount   = MAX_ROUNDS;
    _reloading   = false;
    _reloadTimer = 0;
    _reloadAngle = 0;
    _projectiles = [];
    _particles   = [];
    _smokeClouds = [];
    _starLights  = [];
    _arcDots     = [];
    _glTubeMesh  = null;
    _keysDown    = {};
    _bKeyHeld    = false;
    _altBHeld    = false;
    _mouseDownGL = false;
    _ctrlGHeld   = false;

    document.addEventListener('keydown',   _onKeyDown,   false);
    document.addEventListener('keyup',     _onKeyUp,     false);
    document.addEventListener('mousedown', _onMouseDown, false);
    document.addEventListener('mouseup',   _onMouseUp,   false);

    _createHUD();
  }

  function update(dt) {
    if (!_scene || !_camera) return;
    if (typeof dt !== 'number' || dt <= 0) dt = 0.016;

    _updateProjectiles(dt);
    _updateParticles(dt);
    _updateSmokeClouds(dt);
    _updateStarLights(dt);
    _updateReload(dt);
    _updateArcDots();
  }

  function reset() {
    // Dispose projectiles
    for (var i = 0; i < _projectiles.length; i++) {
      var p = _projectiles[i];
      if (_scene) _scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) p.mesh.material.dispose();
    }
    _projectiles = [];

    // Dispose particles
    for (var pi = 0; pi < _particles.length; pi++) {
      var pt = _particles[pi];
      if (_scene) _scene.remove(pt.mesh);
      if (pt.mesh.geometry) pt.mesh.geometry.dispose();
      if (pt.mesh.material) pt.mesh.material.dispose();
    }
    _particles = [];

    // Dispose smoke clouds
    for (var si = 0; si < _smokeClouds.length; si++) {
      var sc = _smokeClouds[si];
      if (_scene) _scene.remove(sc.mesh);
      if (sc.mesh.geometry) sc.mesh.geometry.dispose();
      if (sc.mesh.material) sc.mesh.material.dispose();
    }
    _smokeClouds = [];

    // Dispose star lights
    for (var li = 0; li < _starLights.length; li++) {
      var sl = _starLights[li];
      if (_scene) {
        _scene.remove(sl.light);
        _scene.remove(sl.mesh);
      }
      if (sl.mesh.geometry) sl.mesh.geometry.dispose();
      if (sl.mesh.material) sl.mesh.material.dispose();
    }
    _starLights = [];

    // Dispose arc dots
    _clearArcDots();

    // Dispose GL tube
    _removeGLTube();

    _glMode      = false;
    _roundIndex  = 0;
    _ammoCount   = MAX_ROUNDS;
    _reloading   = false;
    _reloadTimer = 0;
    _reloadAngle = 0;
    _keysDown    = {};
    _bKeyHeld    = false;
    _altBHeld    = false;
    _mouseDownGL = false;
    _ctrlGHeld   = false;

    _updateHUD();
  }

  return {
    init:   init,
    update: update,
    fire:   fire,
    reset:  reset
  };
})();
