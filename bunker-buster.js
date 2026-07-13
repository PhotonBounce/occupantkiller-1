// ============================================================
//  bunker-buster.js — Heavy anti-fortification bunker-buster bomb system
//  Ctrl+Shift+B to equip. Left-click to fire guided bomb from Y=80.
//  Laser-guided descent, penetrating detonation, voxel demolition,
//  shockwave ring, structural collapse sweep.
//  Public API: init(scene, camera, controls), update(dt), arm(), fire(), reset()
// ============================================================
window.BunkerBuster = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _controls = null;

  var _armed     = false;   // currently equipped
  var _expended  = false;   // bomb used this wave

  // Active bomb state
  var _bomb         = null; // { mesh, velocity, target, laserLine, laserGeo }
  var _penetrating  = false;
  var _penetratePos = null;
  var _penetrateTimer = 0;
  var PENETRATE_DELAY = 0.3;

  // Particles
  var _particles = [];   // [{mesh, vel, life, maxLife}]

  // Shockwave
  var _shockwave = null; // {mesh, age}

  // Screen shake
  var _shakeTime   = 0;
  var _shakeMag    = 0;

  // HUD element
  var _hudEl   = null;
  var _reticle = null;   // container div with 4 corner brackets
  var _pulseT  = 0;

  // Original FOV (restore on disarm)
  var _origFov = 75;

  // Descent speed m/s
  var DESCENT_SPEED = 30;
  // Blast radius for voxel removal
  var BLAST_RADIUS_VOXEL = 5;
  // Blast radius for enemy suppression check
  var BLAST_RADIUS_ENEMY = 25;
  // Damage
  var DAMAGE = 400;
  // Particle count
  var PARTICLE_COUNT = 200;

  // ── DOM helpers ────────────────────────────────────────────
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'bb-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:110px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:13px',
      'color:#ff4444',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid #ff4444',
      'padding:3px 14px',
      'border-radius:4px',
      'z-index:300',
      'pointer-events:none',
      'letter-spacing:2px',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_armed) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    if (_expended) {
      _hudEl.textContent = 'BB [EXPENDED]';
      _hudEl.style.color = '#888';
      _hudEl.style.borderColor = '#555';
    } else {
      _hudEl.textContent = 'BUNKER BUSTER [CTRL+B] ARMED  BB [1]';
      _hudEl.style.color = '#ff4444';
      _hudEl.style.borderColor = '#ff4444';
    }
  }

  function _createReticle() {
    if (_reticle) return;
    // Container
    _reticle = document.createElement('div');
    _reticle.id = 'bb-reticle';
    _reticle.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'width:80px',
      'height:80px',
      'transform:translate(-50%,-50%)',
      'pointer-events:none',
      'z-index:299',
      'display:none'
    ].join(';');

    // 4 corner bracket divs + center cross
    var corners = [
      { top:'0',    left:'0',    borderTop:'3px solid #ff2222', borderLeft:'3px solid #ff2222' },
      { top:'0',    right:'0',   borderTop:'3px solid #ff2222', borderRight:'3px solid #ff2222' },
      { bottom:'0', left:'0',    borderBottom:'3px solid #ff2222', borderLeft:'3px solid #ff2222' },
      { bottom:'0', right:'0',   borderBottom:'3px solid #ff2222', borderRight:'3px solid #ff2222' }
    ];

    for (var i = 0; i < corners.length; i++) {
      var c = document.createElement('div');
      c.className = 'bb-corner';
      var cs = 'position:absolute;width:18px;height:18px;';
      for (var k in corners[i]) {
        cs += k.replace(/([A-Z])/g, function(m){ return '-' + m.toLowerCase(); }) + ':' + corners[i][k] + ';';
      }
      c.style.cssText = cs;
      _reticle.appendChild(c);
    }

    // Horizontal bar of cross
    var hBar = document.createElement('div');
    hBar.style.cssText = 'position:absolute;top:50%;left:0;width:100%;height:2px;margin-top:-1px;background:#ff2222;opacity:0.85;';
    _reticle.appendChild(hBar);

    // Vertical bar of cross
    var vBar = document.createElement('div');
    vBar.style.cssText = 'position:absolute;left:50%;top:0;width:2px;height:100%;margin-left:-1px;background:#ff2222;opacity:0.85;';
    _reticle.appendChild(vBar);

    document.body.appendChild(_reticle);
  }

  function _showReticle(show) {
    if (_reticle) _reticle.style.display = show ? 'block' : 'none';
  }

  // ── Geometry helpers ───────────────────────────────────────
  function _makeBombMesh() {
    var group = new THREE.Group();
    var mat   = new THREE.MeshLambertMaterial({ color: 0x333333 });

    // Main body
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 10), mat);
    body.position.y = 0;
    group.add(body);

    // Nose cone
    var noseMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var nose = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 10), noseMat);
    nose.position.y = -1.3;  // bottom tip
    group.add(nose);

    // 4 tail fins
    var finMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var finAngles = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
    for (var i = 0; i < 4; i++) {
      var fin = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.05), finMat);
      fin.position.y = 0.8;
      fin.position.x = Math.cos(finAngles[i]) * 0.25;
      fin.position.z = Math.sin(finAngles[i]) * 0.25;
      fin.rotation.y = finAngles[i];
      group.add(fin);
    }

    return group;
  }

  function _makeLaserLine(fromVec, toVec) {
    var geo = new THREE.BufferGeometry();
    var pts = new Float32Array([
      fromVec.x, fromVec.y, fromVec.z,
      toVec.x, toVec.y, toVec.z
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.85 });
    return { line: new THREE.Line(geo, mat), geo: geo };
  }

  function _updateLaserLine(laserObj, fromVec, toVec) {
    var pos = laserObj.geo.attributes.position;
    pos.setXYZ(0, fromVec.x, fromVec.y, fromVec.z);
    pos.setXYZ(1, toVec.x, toVec.y, toVec.z);
    pos.needsUpdate = true;
  }

  // ── Shockwave ring ─────────────────────────────────────────
  function _spawnShockwave(x, y, z) {
    var geo = new THREE.TorusGeometry(1, 0.3, 8, 32);
    var mat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2; // flat ring
    mesh.position.set(x, y + 0.2, z);
    _scene.add(mesh);
    _shockwave = { mesh: mesh, mat: mat, age: 0 };
  }

  // ── Particle system ────────────────────────────────────────
  function _spawnParticles(x, y, z) {
    var colors = [0x8B5E3C, 0x666666, 0xff8800, 0x555544, 0xaa7744, 0xff4400];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var sz = 0.15 + Math.random() * 0.35;
      var geo = new THREE.SphereGeometry(sz, 4, 4);
      var mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      _scene.add(mesh);

      // Random velocity arc outward
      var angle = Math.random() * Math.PI * 2;
      var pitch = Math.random() * Math.PI * 0.65; // 0–117 deg up
      var spd   = 4 + Math.random() * 11;
      var vx = Math.cos(angle) * Math.cos(pitch) * spd;
      var vy = Math.sin(pitch) * spd;
      var vz = Math.sin(angle) * Math.cos(pitch) * spd;

      var life = 1.0 + Math.random() * 1.5;
      _particles.push({ mesh: mesh, mat: mat, vel: { x: vx, y: vy, z: vz }, life: life, maxLife: life });
    }
  }

  // ── Voxel destruction ──────────────────────────────────────
  function _removeVoxelsInRadius(cx, cy, cz, radius) {
    if (!window.VoxelWorld || !window.VoxelWorld.removeBlock) return;
    var r = Math.ceil(radius);
    for (var dx = -r; dx <= r; dx++) {
      for (var dy = -r; dy <= r; dy++) {
        for (var dz = -r; dz <= r; dz++) {
          if (dx * dx + dy * dy + dz * dz <= radius * radius) {
            try {
              window.VoxelWorld.removeBlock(
                Math.round(cx) + dx,
                Math.round(cy) + dy,
                Math.round(cz) + dz
              );
            } catch (e) {}
          }
        }
      }
    }
  }

  // Structural collapse: one additional sweep — remove blocks with no support below
  function _collapseFloating(cx, cy, cz, radius) {
    if (!window.VoxelWorld || !window.VoxelWorld.removeBlock || !window.VoxelWorld.getBlock) return;
    var r = Math.ceil(radius) + 2;
    for (var dx = -r; dx <= r; dx++) {
      for (var dz = -r; dz <= r; dz++) {
        for (var dy = -r; dy <= r; dy++) {
          var bx = Math.round(cx) + dx;
          var by = Math.round(cy) + dy;
          var bz = Math.round(cz) + dz;
          try {
            var here  = window.VoxelWorld.getBlock && window.VoxelWorld.getBlock(bx, by, bz);
            var below = window.VoxelWorld.getBlock && window.VoxelWorld.getBlock(bx, by - 1, bz);
            if (here && !below && by > 0) {
              window.VoxelWorld.removeBlock(bx, by, bz);
            }
          } catch (e) {}
        }
      }
    }
  }

  // ── Enemy suppression ──────────────────────────────────────
  function _suppressEnemies(x, y, z) {
    try {
      if (!window.Enemies) return;
      var list = window.Enemies.getList ? window.Enemies.getList() : (window.Enemies.enemies || []);
      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        var em = e.mesh || e;
        if (!em || !em.position) continue;
        var dx = em.position.x - x;
        var dy = em.position.y - y;
        var dz = em.position.z - z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist <= BLAST_RADIUS_ENEMY) {
          if (e.suppress) e.suppress(8);
          else if (e.stunTime !== undefined) e.stunTime = 8;
        }
        if (dist <= 15) {
          // Kill in damage radius
          if (e.takeDamage) e.takeDamage(DAMAGE);
          else if (e.hp !== undefined) { e.hp -= DAMAGE; }
        }
      }
    } catch (err) {}
  }

  // ── Camera shake ───────────────────────────────────────────
  function _startShake(dur, mag) {
    _shakeTime = dur;
    _shakeMag  = mag;
  }

  // ── Detonation ─────────────────────────────────────────────
  function _detonate(x, y, z) {
    // Voxel radius destruction
    _removeVoxelsInRadius(x, y, z, BLAST_RADIUS_VOXEL);

    // Particle blast
    _spawnParticles(x, y, z);

    // Shockwave ring
    _spawnShockwave(x, y, z);

    // Screen shake 1.5s
    _startShake(1.5, 0.18);

    // Audio
    try { if (window.AudioSystem && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion(); } catch (e) {}

    // Enemy suppression / damage
    _suppressEnemies(x, y, z);

    // Structural collapse sweep
    setTimeout(function () {
      _collapseFloating(x, y, z, BLAST_RADIUS_VOXEL + 2);
    }, 600);

    // HUD toast
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('BUNKER BUSTER — DETONATED', 2500, '#ff4444');
      }
    } catch (e) {}

    _expended = true;
    _updateHUD();
  }

  // ── Equip / Disarm ─────────────────────────────────────────
  function arm() {
    if (_expended) {
      try {
        if (window.HUD && window.HUD.showToast) window.HUD.showToast('BB EXPENDED — RESUPPLY NEXT WAVE', 2000, '#888');
      } catch (e) {}
      return;
    }
    _armed = !_armed;

    if (_armed) {
      // FOV change
      if (_camera) {
        _origFov = _camera.fov || 75;
        _camera.fov = 45;
        _camera.updateProjectionMatrix();
      }
      _showReticle(true);
    } else {
      // Restore FOV
      if (_camera) {
        _camera.fov = _origFov;
        _camera.updateProjectionMatrix();
      }
      _showReticle(false);
    }
    _updateHUD();
  }

  // ── Fire ───────────────────────────────────────────────────
  function fire() {
    if (!_armed || _expended || _bomb) return;
    if (!_camera || !_scene) return;

    // Raycast where player is looking on the ground plane
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), _camera);
    var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    var targetPos = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, targetPos);

    // If no intersection, use a point directly below camera at Y=0
    if (!targetPos || isNaN(targetPos.x)) {
      targetPos = new THREE.Vector3(_camera.position.x, 0, _camera.position.z);
    }

    // Bomb starts from sky above target
    var startPos = new THREE.Vector3(targetPos.x, 80, targetPos.z);

    var bombMesh = _makeBombMesh();
    bombMesh.position.copy(startPos);
    _scene.add(bombMesh);

    // Create laser trail geometry
    var laser = _makeLaserLine(startPos, targetPos);
    _scene.add(laser.line);

    _bomb = {
      mesh:      bombMesh,
      target:    targetPos.clone(),
      velocity:  new THREE.Vector3(0, -DESCENT_SPEED, 0),
      laserLine: laser.line,
      laserGeo:  laser.geo
    };

    // HUD feedback
    try {
      if (window.HUD && window.HUD.showToast) window.HUD.showToast('BB INBOUND', 1200, '#ff8800');
    } catch (e) {}

    // Disarm after fire
    _armed = false;
    if (_camera) {
      _camera.fov = _origFov;
      _camera.updateProjectionMatrix();
    }
    _showReticle(false);
    _updateHUD();
  }

  // ── Update ─────────────────────────────────────────────────
  function update(dt) {
    if (!dt || isNaN(dt)) dt = 0.016;

    // Reticle pulse
    if (_armed && _reticle) {
      _pulseT += dt * 2.5;
      var scale = 1.0 + 0.12 * Math.sin(_pulseT);
      _reticle.style.transform = 'translate(-50%,-50%) scale(' + scale + ')';
    }

    // Camera shake
    if (_shakeTime > 0) {
      _shakeTime -= dt;
      if (_camera && _shakeTime > 0) {
        _camera.position.x += (Math.random() - 0.5) * _shakeMag;
        _camera.position.y += (Math.random() - 0.5) * _shakeMag;
        _camera.position.z += (Math.random() - 0.5) * _shakeMag;
      }
    }

    // Penetrating delay
    if (_penetrating) {
      _penetrateTimer -= dt;
      if (_penetrateTimer <= 0) {
        _penetrating = false;
        _detonate(_penetratePos.x, _penetratePos.y, _penetratePos.z);
        _penetratePos = null;
      }
      return;
    }

    // Bomb guidance update
    if (_bomb) {
      var b = _bomb;
      var pos = b.mesh.position;
      var tgt = b.target;

      // Lerp velocity toward target direction
      var toTarget = new THREE.Vector3(tgt.x - pos.x, tgt.y - pos.y, tgt.z - pos.z);
      var dist = toTarget.length();

      toTarget.normalize().multiplyScalar(DESCENT_SPEED);
      b.velocity.lerp(toTarget, 0.08);

      // Move bomb
      pos.addScaledVector(b.velocity, dt);

      // Orient bomb mesh to face velocity direction
      if (b.velocity.length() > 0.01) {
        var dir = b.velocity.clone().normalize();
        b.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.negate());
      }

      // Update laser line
      _updateLaserLine({ geo: b.laserGeo }, pos, tgt);

      // Impact detection: reached or passed Y<=0 or within 1m of target
      if (pos.y <= 0.5 || dist < 1.2) {
        // Disappear bomb mesh
        _scene.remove(b.mesh);
        _scene.remove(b.laserLine);

        var px = pos.x, py = 0, pz = pos.z;

        _bomb = null;

        // Penetrating fuse: 0.3s delay
        _penetrating     = true;
        _penetrateTimer  = PENETRATE_DELAY;
        _penetratePos    = new THREE.Vector3(px, py, pz);
      }
    }

    // Particle update
    var gravity = -9.8;
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        _scene.remove(p.mesh);
        _particles.splice(i, 1);
        continue;
      }
      p.vel.y += gravity * dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      // Fade out
      var alpha = p.life / p.maxLife;
      if (p.mat.transparent !== true) { p.mat.transparent = true; }
      p.mat.opacity = alpha;
    }

    // Shockwave update: expand 0→20 over 1s then dispose
    if (_shockwave) {
      _shockwave.age += dt;
      var t = _shockwave.age;
      if (t >= 1.0) {
        _scene.remove(_shockwave.mesh);
        _shockwave = null;
      } else {
        var s = t * 20;
        _shockwave.mesh.scale.set(s, s, s);
        _shockwave.mat.opacity = 0.7 * (1 - t);
      }
    }
  }

  // ── Reset (new wave) ───────────────────────────────────────
  function reset() {
    _expended  = false;
    _armed     = false;
    _penetrating = false;
    _penetratePos = null;

    // Clean up any live bomb
    if (_bomb) {
      if (_scene) {
        try { _scene.remove(_bomb.mesh); } catch (e) {}
        try { _scene.remove(_bomb.laserLine); } catch (e) {}
      }
      _bomb = null;
    }

    // Clean particles
    for (var i = 0; i < _particles.length; i++) {
      try { _scene.remove(_particles[i].mesh); } catch (e) {}
    }
    _particles.length = 0;

    // Shockwave
    if (_shockwave) {
      try { _scene.remove(_shockwave.mesh); } catch (e) {}
      _shockwave = null;
    }

    // Restore camera FOV
    if (_camera) {
      _camera.fov = _origFov;
      _camera.updateProjectionMatrix();
    }

    _showReticle(false);
    _updateHUD();
  }

  // ── Keyboard binding ───────────────────────────────────────
  function _onKeyDown(e) {
    // Ctrl+Shift+B to equip/toggle
    if (e.ctrlKey && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
      e.preventDefault();
      arm();
    }
    // Ctrl+B also arms (per spec hint text)
    if (e.ctrlKey && !e.shiftKey && (e.key === 'B' || e.key === 'b')) {
      e.preventDefault();
      arm();
    }
  }

  function _onMouseDown(e) {
    if (!_armed) return;
    if (e.button !== 0) return; // left click only
    e.preventDefault();
    fire();
  }

  // ── Init ───────────────────────────────────────────────────
  function init(scene, camera, controls) {
    _scene    = scene;
    _camera   = camera;
    _controls = controls;
    _origFov  = (camera && camera.fov) ? camera.fov : 75;

    _armed     = false;
    _expended  = false;
    _bomb      = null;
    _penetrating = false;
    _particles.length = 0;
    _shockwave = null;
    _shakeTime = 0;

    _createHUD();
    _createReticle();
    _updateHUD();

    // Remove old listeners to avoid duplicates
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('mousedown', _onMouseDown);
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('mousedown', _onMouseDown);
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    arm:    arm,
    fire:   fire,
    reset:  reset
  };

})();
