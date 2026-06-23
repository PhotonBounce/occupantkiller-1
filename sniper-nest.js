// sniper-nest.js — Elevated sniper nest with AI enemy, player takeover, wind compensation
// Features: elevated platform, enemy sniper AI, laser warning, player takeover,
//           wind HUD, nest HP collapse, camouflage bonus, reinforcement respawn
// Public API: init(scene, camera), update(dt), spawnNest(x, y, z), reset()

window.SniperNest = (function () {
  'use strict';

  // ─── Private state ────────────────────────────────────────────────────────

  var _scene  = null;
  var _camera = null;

  var _nests   = [];   // active nest objects
  var _debris  = [];   // falling debris pieces
  var _bullets = [];   // flying bullet projectiles

  // Player takeover state
  var _playerInNest     = false;
  var _currentNest      = null;   // nest player is occupying
  var _baseFOV          = 75;
  var _eKeyDown         = false;
  var _climbTimer       = 0;      // time touching pillar base
  var _nearNest         = null;   // nest player is near (for climb)
  var _stealthApplied   = false;  // track if stealth bonus applied

  // HUD elements
  var _overlay          = null;
  var _windHUD          = null;
  var _crosshair        = null;
  var _promptEl         = null;

  // ─── Constants ────────────────────────────────────────────────────────────

  var NEST_HP           = 200;
  var SNIPER_HP         = 80;
  var SNIPER_FIRE_INT   = 2.5;    // seconds between shots
  var SNIPER_ROT_SPEED  = 0.8;    // rad/s rotation speed
  var SNIPER_ACCURACY   = 0.90;   // hit chance within range
  var SNIPER_RANGE      = 60;     // meters
  var SNIPER_DAMAGE     = 45;
  var LASER_WARN_TIME   = 0.8;    // seconds laser visible before shot
  var PLATFORM_Y        = 5;      // platform elevation
  var CLIMB_DIST        = 1.5;    // distance to pillar to trigger climb
  var CLIMB_DELAY       = 0.5;    // seconds before teleport up
  var TAKEOVER_DIST     = 2.0;    // distance to press E and take over
  var REINFORCE_DELAY   = 30;     // seconds until replacement sniper spawns
  var GRAVITY           = 9.8;

  // Wind state (one global wind per session)
  var _windAngle  = Math.random() * Math.PI * 2;
  var _windSpeed  = Math.random() * 5;         // 0-5 m/s

  // ─── DOM helpers ─────────────────────────────────────────────────────────

  function _ensureOverlay() {
    if (_overlay) return;
    _overlay = document.createElement('div');
    _overlay.id = 'sniper-nest-overlay';
    _overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:250;overflow:hidden';
    document.body.appendChild(_overlay);
  }

  function _ensureWindHUD() {
    if (_windHUD) return;
    _ensureOverlay();
    _windHUD = document.createElement('div');
    _windHUD.id = 'sn-wind-hud';
    _windHUD.style.cssText = [
      'position:fixed',
      'bottom:180px',
      'right:24px',
      'background:rgba(0,0,0,0.7)',
      'border:1px solid rgba(255,255,255,0.25)',
      'color:#fff',
      'font-family:monospace',
      'font-size:12px',
      'padding:8px 12px',
      'border-radius:6px',
      'z-index:252',
      'pointer-events:none',
      'display:none',
      'min-width:120px'
    ].join(';');
    _overlay.appendChild(_windHUD);
  }

  function _ensureCrosshair() {
    if (_crosshair) return;
    _ensureOverlay();
    _crosshair = document.createElement('div');
    _crosshair.id = 'sn-crosshair';
    _crosshair.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'z-index:251',
      'pointer-events:none',
      'display:none'
    ].join(';');
    // Thin cross SVG
    _crosshair.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32">' +
      '<line x1="16" y1="0" x2="16" y2="32" stroke="white" stroke-width="1"/>' +
      '<line x1="0" y1="16" x2="32" y2="16" stroke="white" stroke-width="1"/>' +
      '<circle cx="16" cy="16" r="1.5" fill="white"/>' +
      '</svg>';
    _overlay.appendChild(_crosshair);
  }

  function _ensurePrompt() {
    if (_promptEl) return;
    _ensureOverlay();
    _promptEl = document.createElement('div');
    _promptEl.id = 'sn-prompt';
    _promptEl.style.cssText = [
      'position:fixed',
      'bottom:200px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'border:1px solid rgba(255,220,0,0.5)',
      'color:#ffd700',
      'font-family:monospace',
      'font-size:13px',
      'padding:5px 20px',
      'border-radius:5px',
      'z-index:252',
      'pointer-events:none',
      'display:none'
    ].join(';');
    _overlay.appendChild(_promptEl);
  }

  function _showPrompt(msg) {
    _ensurePrompt();
    _promptEl.textContent = msg;
    _promptEl.style.display = '';
  }

  function _hidePrompt() {
    if (_promptEl) _promptEl.style.display = 'none';
  }

  function _updateWindHUD(visible) {
    _ensureWindHUD();
    if (!visible) {
      _windHUD.style.display = 'none';
      return;
    }
    _windHUD.style.display = '';
    // Arrow using Unicode direction; map windAngle to compass arrow
    var deg = ((_windAngle * 180 / Math.PI) % 360 + 360) % 360;
    // Build a simple ASCII arrow rotated by angle
    var arrowChars = ['↑','↗','→','↘','↓','↙','←','↖'];
    var arrowIdx   = Math.round(deg / 45) % 8;
    var arrow      = arrowChars[arrowIdx];
    var speed      = _windSpeed.toFixed(1);
    _windHUD.innerHTML = '<b>WIND</b><br>' +
      '<span style="font-size:20px">' + arrow + '</span><br>' +
      speed + ' m/s<br>' +
      '<span style="color:#aaa;font-size:10px">Drift ' +
      (_windSpeed * SNIPER_RANGE * 0.002).toFixed(2) + 'u@60m</span>';
  }

  // ─── Toast / score helpers ────────────────────────────────────────────────

  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) window.HUD.showToast(msg);
  }

  function _addScore(pts) {
    if (window.player && typeof window.player.score !== 'undefined') window.player.score += pts;
  }

  // ─── Player health ────────────────────────────────────────────────────────

  function _damagePlayer(dmg) {
    if (window.player) {
      if (typeof window.player.health !== 'undefined') {
        window.player.health -= dmg;
        if (window.player.health < 0) window.player.health = 0;
      }
      if (window.player.takeDamage) window.player.takeDamage(dmg);
    }
    if (window.HUD && window.HUD.flashDamage) window.HUD.flashDamage();
  }

  // ─── Three.js mesh builders ───────────────────────────────────────────────

  function _buildPlatform() {
    var group = new THREE.Group();

    // Main platform slab (3 x 0.3 x 2)
    var platMat  = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var platform = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 2), platMat);
    platform.position.y = 0;   // group placed at y=PLATFORM_Y
    group.add(platform);

    // Supporting pillar (thin cylinder from ground to platform)
    var pillarMat = new THREE.MeshLambertMaterial({ color: 0x6B4F0A });
    var pillarH   = PLATFORM_Y;   // reaches from y=0 down to ground
    var pillar    = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, pillarH, 8), pillarMat);
    pillar.position.y = -(pillarH / 2) - 0.15;   // hangs below platform center
    group.add(pillar);

    // Sandbag wall — front (two blocks side by side)
    var sbMat = new THREE.MeshLambertMaterial({ color: 0xB8A878 });
    var sb1   = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.35), sbMat);
    sb1.position.set(-0.75, 0.35, -0.825);
    group.add(sb1);
    var sb2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.35), sbMat);
    sb2.position.set(0.75, 0.35, -0.825);
    group.add(sb2);

    return { group: group, platform: platform, pillar: pillar };
  }

  function _buildSniperMesh() {
    var group = new THREE.Group();

    // Body — dark green camo base
    var bodyMat  = new THREE.MeshLambertMaterial({ color: 0x2D4A1E });
    var body     = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.35), bodyMat);
    body.position.y = 0.4;
    group.add(body);

    // Camo patches (darker splotches)
    var patchMat = new THREE.MeshLambertMaterial({ color: 0x1A2E12 });
    var p1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.36), patchMat);
    p1.position.set(0.1, 0.55, 0);
    group.add(p1);
    var p2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.36), patchMat);
    p2.position.set(-0.15, 0.3, 0);
    group.add(p2);

    // Head
    var headMat = new THREE.MeshLambertMaterial({ color: 0x3A5C28 });
    var head    = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), headMat);
    head.position.y = 0.96;
    group.add(head);

    // Ghillie bush decoration — 6 sphere clusters
    var ghillieMat = new THREE.MeshLambertMaterial({ color: 0x4A6B30 });
    var ghillieDark= new THREE.MeshLambertMaterial({ color: 0x2E4A1A });
    var ghilliePositions = [
      [0.28, 0.6, 0], [-0.28, 0.6, 0],
      [0, 0.8, 0.2],  [0, 0.8, -0.2],
      [0.2, 0.4, 0.18], [-0.2, 0.4, 0.18]
    ];
    for (var gi = 0; gi < ghilliePositions.length; gi++) {
      var gp  = ghilliePositions[gi];
      var gMat= (gi % 2 === 0) ? ghillieMat : ghillieDark;
      var gs  = 0.1 + Math.random() * 0.08;
      var gm  = new THREE.Mesh(new THREE.SphereGeometry(gs, 5, 4), gMat);
      gm.position.set(gp[0], gp[1], gp[2]);
      group.add(gm);
    }

    // Rifle — long thin cylinder
    var rifleMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var rifle    = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6), rifleMat);
    rifle.rotation.z = Math.PI / 2;
    rifle.position.set(0.9, 0.7, 0);   // extends to the right by default
    group.add(rifle);

    // Muzzle flash light (starts invisible)
    var muzzleLight = new THREE.PointLight(0xFFFFFF, 0, 4);
    muzzleLight.position.set(1.65, 0.7, 0);
    group.add(muzzleLight);

    return { group: group, rifle: rifle, muzzleLight: muzzleLight };
  }

  // ─── Laser line helper ────────────────────────────────────────────────────

  function _buildLaser() {
    var points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)];
    var geo    = new THREE.BufferGeometry().setFromPoints(points);
    var mat    = new THREE.LineBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.85 });
    var line   = new THREE.Line(geo, mat);
    return line;
  }

  function _updateLaserPoints(laser, from, to) {
    var pts = [from.clone(), to.clone()];
    laser.geometry.dispose();
    laser.geometry = new THREE.BufferGeometry().setFromPoints(pts);
  }

  // ─── Bullet projectile builder ────────────────────────────────────────────

  function _spawnBullet(from, dir, isEnemy) {
    var mat  = new THREE.MeshLambertMaterial({ color: isEnemy ? 0xFF4400 : 0xFFFF00 });
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 5), mat);
    mesh.position.copy(from);
    // Align cylinder along direction
    var axis = new THREE.Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(axis, dir.clone().normalize());
    _scene.add(mesh);
    return {
      mesh:    mesh,
      dir:     dir.clone().normalize(),
      speed:   80,
      life:    2.0,
      isEnemy: isEnemy
    };
  }

  // ─── Enemy position helper ────────────────────────────────────────────────

  function _getPlayerPos() {
    if (_camera) return _camera.position.clone();
    if (window.player && window.player.position) return window.player.position.clone();
    return new THREE.Vector3(0, 1.7, 0);
  }

  // ─── Sniper sniper spawner ────────────────────────────────────────────────

  function _spawnSniperInNest(nest) {
    if (!_scene) return;
    if (nest.sniper) return;   // already has one

    var meshData = _buildSniperMesh();
    var group    = meshData.group;

    // Position on platform: slightly back from sandbag wall
    group.position.set(
      nest.group.position.x,
      nest.group.position.y + 0.0 + 0.9,   // stand on platform (platform.y = PLATFORM_Y)
      nest.group.position.z + 0.3
    );

    var laser = _buildLaser();
    laser.visible = false;
    _scene.add(laser);

    _scene.add(group);

    nest.sniper = {
      group:       group,
      rifle:       meshData.rifle,
      muzzleLight: meshData.muzzleLight,
      laser:       laser,
      hp:          SNIPER_HP,
      fireTimer:   0,
      laserTimer:  0,
      laserActive: false,
      dead:        false
    };
  }

  // ─── Nest collapse ────────────────────────────────────────────────────────

  function _triggerCollapse(nest) {
    if (nest.collapsing) return;
    nest.collapsing  = true;
    nest.collapseVY  = 0;
    _toast('Sniper nest collapsing!');
    // Eject player if in this nest
    if (_playerInNest && _currentNest === nest) {
      _exitNest();
    }
  }

  // ─── Stealth integration ──────────────────────────────────────────────────

  function _applyStealthBonus() {
    if (_stealthApplied) return;
    if (window.StealthSystem || typeof window._stealthLevel !== 'undefined') {
      if (typeof window._stealthLevel !== 'undefined') {
        window._stealthLevel = Math.max(0, (window._stealthLevel || 0.5) - 0.4);
      }
      _stealthApplied = true;
    }
  }

  function _removeStealthBonus() {
    if (!_stealthApplied) return;
    if (typeof window._stealthLevel !== 'undefined') {
      window._stealthLevel = Math.min(1, (window._stealthLevel || 0.1) + 0.4);
    }
    _stealthApplied = false;
  }

  // ─── Player enter / exit nest ─────────────────────────────────────────────

  function _enterNest(nest) {
    if (_playerInNest) return;
    if (!_camera) return;
    _playerInNest = true;
    _currentNest  = nest;
    nest.playerOccupying = true;

    // Snap camera to platform level (sniper prone position)
    _camera.position.set(
      nest.group.position.x,
      nest.group.position.y + 0.6,   // prone on platform
      nest.group.position.z + 0.3
    );

    // Zoom in: FOV 30
    if (typeof _camera.fov !== 'undefined') {
      _baseFOV = _camera.fov;
      _camera.fov = 30;
      _camera.updateProjectionMatrix();
    }

    // Show wind HUD + custom crosshair
    _ensureCrosshair();
    _crosshair.style.display = '';
    _updateWindHUD(true);
    _hidePrompt();

    // Camouflage bonus
    _applyStealthBonus();

    _toast('SNIPER NEST — E to exit | Wind compensation active | FOV 30');
  }

  function _exitNest() {
    if (!_playerInNest) return;
    _playerInNest = false;
    if (_currentNest) _currentNest.playerOccupying = false;
    _currentNest = null;

    // Restore FOV
    if (_camera && typeof _camera.fov !== 'undefined') {
      _camera.fov = _baseFOV;
      _camera.updateProjectionMatrix();
    }

    // Hide wind HUD + crosshair
    if (_crosshair) _crosshair.style.display = 'none';
    _updateWindHUD(false);

    // Remove stealth bonus
    _removeStealthBonus();

    _toast('Exited sniper nest');
  }

  // ─── Teleport player onto platform ───────────────────────────────────────

  function _teleportOnto(nest) {
    if (!_camera) return;
    _camera.position.set(
      nest.group.position.x,
      nest.group.position.y + 1.7,   // standing height on platform
      nest.group.position.z + 0.3
    );
    _toast('Climbed to sniper platform!');
  }

  // ─── Damage nest ──────────────────────────────────────────────────────────

  function _damageNest(nest, dmg) {
    if (nest.collapsing) return;
    nest.hp -= dmg;
    if (nest.hp <= 0) {
      nest.hp = 0;
      _triggerCollapse(nest);
    }
  }

  // ─── Spawn a nest at position ─────────────────────────────────────────────

  function spawnNest(x, y, z) {
    if (!_scene) return;
    x = x || 0;
    y = y || 0;
    z = z || 0;

    var platData = _buildPlatform();
    var group    = platData.group;

    // Group is placed at platform level
    group.position.set(x, y + PLATFORM_Y, z);
    _scene.add(group);

    var nest = {
      group:          group,
      pillar:         platData.pillar,
      platform:       platData.platform,
      hp:             NEST_HP,
      sniper:         null,
      collapsing:     false,
      collapseVY:     0,
      playerOccupying: false,
      // base world position of pillar base (for climb detection)
      pillarBaseX:    x,
      pillarBaseZ:    z,
      pillarBaseY:    y,
      // reinforcement tracking
      reinforceTimer: 0,
      awaitingReinforce: false
    };

    _spawnSniperInNest(nest);
    _nests.push(nest);
    return nest;
  }

  // ─── Update sniper AI ─────────────────────────────────────────────────────

  function _updateSniperAI(nest, dt) {
    var s = nest.sniper;
    if (!s || s.dead) {
      // Check reinforcement
      if (nest.awaitingReinforce) {
        nest.reinforceTimer -= dt;
        if (nest.reinforceTimer <= 0) {
          nest.awaitingReinforce = false;
          _spawnSniperInNest(nest);
          _toast('Enemy sniper reinforcement arrived at nest!');
        }
      }
      return;
    }

    // Check if sniper is dead
    if (s.hp <= 0 && !s.dead) {
      s.dead = true;
      s.laser.visible = false;
      s.muzzleLight.intensity = 0;
      // Slump the body
      s.group.rotation.z = Math.PI / 2;
      s.group.position.y -= 0.4;
      _addScore(300);
      _toast('Enemy sniper neutralized! Press E at nest to take over.');
      // Schedule reinforcement
      nest.awaitingReinforce = true;
      nest.reinforceTimer    = REINFORCE_DELAY;
      // Clear sniper ref after a moment (leave body)
      nest.sniper = null;
      return;
    }

    var playerPos = _getPlayerPos();
    var sniperPos = s.group.position;

    var dx   = playerPos.x - sniperPos.x;
    var dy   = playerPos.y - sniperPos.y;
    var dz   = playerPos.z - sniperPos.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Only act if player within range
    if (dist > SNIPER_RANGE) {
      s.laser.visible = false;
      return;
    }

    // Rotate sniper body to face player (slowly)
    var targetAngle = Math.atan2(dx, dz);
    var currentAngle = s.group.rotation.y;
    var angleDiff    = targetAngle - currentAngle;
    // Normalize to -PI..PI
    while (angleDiff >  Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    var maxRot = SNIPER_ROT_SPEED * dt;
    if (Math.abs(angleDiff) < maxRot) {
      s.group.rotation.y = targetAngle;
    } else {
      s.group.rotation.y += (angleDiff > 0 ? 1 : -1) * maxRot;
    }

    // Fire cycle timer
    s.fireTimer += dt;

    // Show laser warning 0.8s before shot
    var timeToShot = SNIPER_FIRE_INT - s.fireTimer;
    if (timeToShot <= LASER_WARN_TIME && timeToShot > 0) {
      s.laser.visible = true;
      // Muzzle tip in world space
      var muzzleTip = new THREE.Vector3(0, 0.7, -0.9);
      s.group.localToWorld(muzzleTip);
      _updateLaserPoints(s.laser, muzzleTip, playerPos);
    } else {
      s.laser.visible = false;
    }

    // Fire
    if (s.fireTimer >= SNIPER_FIRE_INT) {
      s.fireTimer = 0;
      s.laser.visible = false;

      // Muzzle flash
      s.muzzleLight.intensity = 3;
      s.muzzleLight.distance  = 8;
      var muzzleMesh = s.group.localToWorld(new THREE.Vector3(0, 0.7, -0.9));

      // Accuracy roll
      if (Math.random() < SNIPER_ACCURACY) {
        _damagePlayer(SNIPER_DAMAGE);
        _toast('Sniper hit! -' + SNIPER_DAMAGE + ' HP');
      }

      // Spawn bullet projectile toward player
      var bFrom = muzzleMesh.clone();
      var bDir  = playerPos.clone().sub(bFrom).normalize();
      var bullet = _spawnBullet(bFrom, bDir, true);
      bullet.life = dist / 80;   // travel time at 80 m/s
      _bullets.push(bullet);

      // Fade muzzle flash after 0.05s (handled in update)
      s.muzzleFlashTimer = 0.05;
    }

    // Fade muzzle flash
    if (s.muzzleFlashTimer > 0) {
      s.muzzleFlashTimer -= dt;
      if (s.muzzleFlashTimer <= 0) {
        s.muzzleLight.intensity = 0;
        s.muzzleFlashTimer = 0;
      }
    }
  }

  // ─── Update bullets ───────────────────────────────────────────────────────

  function _updateBullets(dt) {
    for (var i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
        continue;
      }
      b.mesh.position.x += b.dir.x * b.speed * dt;
      b.mesh.position.y += b.dir.y * b.speed * dt;
      b.mesh.position.z += b.dir.z * b.speed * dt;
    }
  }

  // ─── Update debris ────────────────────────────────────────────────────────

  function _updateDebris(dt) {
    for (var i = _debris.length - 1; i >= 0; i--) {
      var d = _debris[i];
      d.life -= dt;
      if (d.life <= 0) {
        _scene.remove(d.mesh);
        _debris.splice(i, 1);
        continue;
      }
      d.vy -= GRAVITY * dt;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      d.mesh.rotation.x += dt * 3;
      d.mesh.rotation.z += dt * 2;
    }
  }

  function _spawnDebris(pos) {
    if (!_scene) return;
    var mat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    for (var i = 0; i < 8; i++) {
      var sz = 0.1 + Math.random() * 0.3;
      var m  = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, sz), mat);
      m.position.copy(pos);
      m.position.x += (Math.random() - 0.5) * 3;
      m.position.y += Math.random() * 2;
      m.position.z += (Math.random() - 0.5) * 3;
      _scene.add(m);
      _debris.push({
        mesh: m,
        vx:   (Math.random() - 0.5) * 6,
        vy:   2 + Math.random() * 4,
        vz:   (Math.random() - 0.5) * 6,
        life: 2 + Math.random()
      });
    }
  }

  // ─── Climb proximity detection ────────────────────────────────────────────

  function _checkClimbAndTakeover(dt) {
    if (!_camera) return;

    var camPos = _camera.position;
    var found  = null;
    var foundDist = 9999;

    for (var i = 0; i < _nests.length; i++) {
      var n = _nests[i];
      if (n.collapsing) continue;

      // Pillar base world pos
      var pbx = n.pillarBaseX;
      var pbz = n.pillarBaseZ;
      var pby = n.pillarBaseY;

      var dx = camPos.x - pbx;
      var dz = camPos.z - pbz;
      var dy = camPos.y - pby;
      var d  = Math.sqrt(dx * dx + dz * dz + dy * dy);

      if (d < foundDist) {
        foundDist = d;
        found = n;
      }
    }

    if (!_playerInNest) {
      // Near pillar base → show climb progress
      if (found && foundDist < CLIMB_DIST) {
        _nearNest = found;
        _climbTimer += dt;
        var pct = Math.min(100, Math.round((_climbTimer / CLIMB_DELAY) * 100));
        _showPrompt('Climbing... ' + pct + '%');
        if (_climbTimer >= CLIMB_DELAY) {
          _climbTimer = 0;
          _nearNest = null;
          _teleportOnto(found);
        }
      } else {
        // Near nest platform (sniper dead) — show E prompt for takeover
        if (found && foundDist < TAKEOVER_DIST + PLATFORM_Y) {
          var sniperDead = (!found.sniper || found.sniper.dead);
          if (sniperDead && !found.collapsing) {
            _showPrompt('[E] Take sniper position');
            _nearNest = found;
          } else {
            _hidePrompt();
            _nearNest = null;
          }
        } else {
          _hidePrompt();
          _nearNest = null;
          _climbTimer = 0;
        }
      }
    }

    // Wind indicator update while in nest
    if (_playerInNest) {
      _updateWindHUD(true);
    }
  }

  // ─── Nest collapse update ─────────────────────────────────────────────────

  function _updateCollapse(nest, dt) {
    nest.collapseVY -= GRAVITY * dt;
    nest.group.position.y += nest.collapseVY * dt;
    nest.group.rotation.z += dt * 0.5;   // topple
    if (nest.group.position.y < -10) {
      // Spawn debris and remove
      _spawnDebris(nest.group.position);
      _scene.remove(nest.group);
      if (nest.sniper) {
        _scene.remove(nest.sniper.group);
        _scene.remove(nest.sniper.laser);
      }
      return true;   // signal removal
    }
    return false;
  }

  // ─── Keyboard handler ─────────────────────────────────────────────────────

  function _onKeyDown(e) {
    if (e.key === 'e' || e.key === 'E') {
      if (_eKeyDown) return;
      _eKeyDown = true;
      if (_playerInNest) {
        _exitNest();
      } else if (_nearNest && (!_nearNest.sniper || _nearNest.sniper.dead)) {
        _enterNest(_nearNest);
      }
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'e' || e.key === 'E') _eKeyDown = false;
  }

  // ─── Randomize wind periodically ─────────────────────────────────────────

  var _windChangeTimer = 0;

  function _updateWind(dt) {
    _windChangeTimer -= dt;
    if (_windChangeTimer <= 0) {
      _windChangeTimer  = 15 + Math.random() * 20;   // change every 15-35s
      _windAngle  = Math.random() * Math.PI * 2;
      _windSpeed  = Math.random() * 5;
      if (_playerInNest) _toast('Wind changed: ' + _windSpeed.toFixed(1) + ' m/s');
    }
  }

  // ─── Expose nest damage to other systems ─────────────────────────────────

  function _exposeGlobals() {
    // Allow explosions/enemy bullets to damage nests
    window._sniperNests = _nests;
    window._damageNestAt = function (x, z, dmg) {
      for (var i = 0; i < _nests.length; i++) {
        var n = _nests[i];
        var dx = n.pillarBaseX - x;
        var dz = n.pillarBaseZ - z;
        if (dx * dx + dz * dz < 25) {   // within 5m
          _damageNest(n, dmg);
        }
      }
    };
  }

  // ─── Public: init ─────────────────────────────────────────────────────────

  function init(scene, camera) {
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    _ensureOverlay();
    _ensureWindHUD();
    _ensureCrosshair();
    _ensurePrompt();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _exposeGlobals();
  }

  // ─── Public: update ───────────────────────────────────────────────────────

  function update(dt) {
    if (!dt || dt > 1) dt = 0.016;
    if (!_scene)        return;

    _updateWind(dt);
    _updateBullets(dt);
    _updateDebris(dt);
    _checkClimbAndTakeover(dt);

    for (var i = _nests.length - 1; i >= 0; i--) {
      var n = _nests[i];

      if (n.collapsing) {
        var done = _updateCollapse(n, dt);
        if (done) {
          _nests.splice(i, 1);
        }
        continue;
      }

      // Only run AI if player is not occupying the nest
      if (!n.playerOccupying) {
        _updateSniperAI(n, dt);
      }
    }
  }

  // ─── Public: reset ────────────────────────────────────────────────────────

  function reset() {
    _exitNest();

    for (var i = 0; i < _nests.length; i++) {
      var n = _nests[i];
      _scene.remove(n.group);
      if (n.sniper) {
        _scene.remove(n.sniper.group);
        _scene.remove(n.sniper.laser);
      }
    }
    _nests = [];

    for (var j = 0; j < _bullets.length; j++) _scene.remove(_bullets[j].mesh);
    _bullets = [];

    for (var k = 0; k < _debris.length; k++) _scene.remove(_debris[k].mesh);
    _debris = [];

    _climbTimer = 0;
    _nearNest   = null;
    _hidePrompt();
    _updateWindHUD(false);
    if (_crosshair) _crosshair.style.display = 'none';
    _removeStealthBonus();
  }

  return { init: init, update: update, spawnNest: spawnNest, reset: reset };

}());
