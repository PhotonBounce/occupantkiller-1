// chemical-warfare.js — CBRN / Chemical Warfare module for Three.js FPS
// Features: enemy chem mortars, gas clouds, player gas canisters (Alt+G),
//           contamination spread, decontamination, CBRN mask prompts,
//           gas particle effects, enemy choking, cloud dissipation.
// IIFE module — var only, no import/export.
window.ChemicalWarfare = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────────
  var GAS_COLOR_ENEMY     = 0xaaff00;  // yellow-green (enemy shells / enemy clouds)
  var GAS_COLOR_PLAYER    = 0x44aaff;  // blue-tinted (player canisters)
  var CLOUD_PARTICLE_COUNT = 10;       // spheres per cloud
  var CLOUD_SPHERE_RADIUS  = 0.55;     // SphereGeometry radius for each puff
  var CLOUD_INIT_RADIUS    = 3;        // starting radius (m)
  var CLOUD_MAX_RADIUS     = 5;        // max radius after expansion
  var CLOUD_EXPAND_RATE    = 0.02;     // radius grows 0.02/s
  var CLOUD_DURATION       = 20;       // seconds at full opacity before fade
  var CLOUD_FADE_RATE      = 0.04;     // opacity drop per second during fade
  var CLOUD_INIT_OPACITY   = 0.45;
  var WIND_SPEED           = 0.3;      // units/s drift
  var PLAYER_DAMAGE_RATE   = 3;        // HP/s without mask
  var PLAYER_CANISTER_COUNT = 4;       // player Alt+G grenades
  var ENEMY_CLOUD_DPS      = 8;        // damage/s to enemies inside player cloud
  var CONTAMINATION_DURATION = 5;      // seconds "CONTAMINATED" lingers after leaving
  var CONTAMINATION_DPS    = 1;        // HP/s while contaminated
  var MORTAR_SHELL_RADIUS  = 0.25;     // SphereGeometry for flying shell
  var MORTAR_ARC_HEIGHT    = 12;       // peak arc height for enemy shells
  var MORTAR_TRAVEL_TIME   = 2.8;      // seconds shell is in flight
  var PARTICLE_COUNT_IN_CLOUD = 20;    // small spiral particles per cloud
  var POINT_LIGHT_INTENSITY = 0.3;     // dim yellow glow inside cloud
  var THROW_DISTANCE       = 7;        // units ahead of player
  var THROW_ARC_HEIGHT     = 4;
  var THROW_TRAVEL_TIME    = 0.7;      // seconds canister flight

  // ── State ────────────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;
  var _clouds   = [];      // active gas cloud objects
  var _shells   = [];      // enemy mortar shells in flight
  var _canisters = [];     // player gas canisters in flight
  var _playerCanisters = PLAYER_CANISTER_COUNT;

  // Wind — random direction chosen at init
  var _windX = 0;
  var _windZ = 0;

  // Contamination state
  var _contaminatedTimer = 0;   // countdown (seconds)
  var _wasInGas = false;

  // HUD elements
  var _hudRoot       = null;  // container div
  var _maskPromptEl  = null;
  var _contamEl      = null;
  var _vignetteEl    = null;
  var _canisterHudEl = null;

  // Vignette fade timer
  var _vignetteTimeout = null;

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _clouds = [];
    _shells = [];
    _canisters = [];
    _playerCanisters = PLAYER_CANISTER_COUNT;
    _contaminatedTimer = 0;
    _wasInGas = false;
    window._playerContaminated = false;

    // Random wind direction, constant speed
    var angle = Math.random() * Math.PI * 2;
    _windX = Math.cos(angle) * WIND_SPEED;
    _windZ = Math.sin(angle) * WIND_SPEED;

    _buildHUD();
    _bindKeys();
    _updateCanisterHUD();
  }

  // ── Key Binding (Alt+G) ───────────────────────────────────────────────────
  var _keysBound = false;
  function _bindKeys() {
    if (_keysBound) return;
    _keysBound = true;
    document.addEventListener('keydown', function (e) {
      if (e.altKey && (e.code === 'KeyG' || e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        throwCanister();
      }
    });
  }

  // ── HUD Build ─────────────────────────────────────────────────────────────
  function _buildHUD() {
    if (_hudRoot) return;

    // Root container
    _hudRoot = document.createElement('div');
    _hudRoot.id = 'cbrn-hud-root';
    _hudRoot.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9990;';
    document.body.appendChild(_hudRoot);

    // Green fog vignette overlay (screen-edge fog when in gas without mask)
    _vignetteEl = document.createElement('div');
    _vignetteEl.id = 'cbrn-vignette';
    _vignetteEl.style.cssText = [
      'position:absolute',
      'inset:0',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 0.3s',
      'background:radial-gradient(ellipse at center, transparent 40%, rgba(80,200,40,0.55) 100%)',
    ].join(';');
    _hudRoot.appendChild(_vignetteEl);

    // "EQUIP GAS MASK [M]" red warning
    _maskPromptEl = document.createElement('div');
    _maskPromptEl.id = 'cbrn-mask-prompt';
    _maskPromptEl.textContent = 'EQUIP GAS MASK [M]';
    _maskPromptEl.style.cssText = [
      'position:absolute',
      'top:22%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff2222',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'letter-spacing:2px',
      'text-shadow:0 0 10px #ff0000,0 0 3px #000',
      'display:none',
      'animation:cbrn-flash 0.6s infinite alternate',
    ].join(';');
    _hudRoot.appendChild(_maskPromptEl);

    // "CONTAMINATED" orange text
    _contamEl = document.createElement('div');
    _contamEl.id = 'cbrn-contaminated';
    _contamEl.textContent = 'CONTAMINATED';
    _contamEl.style.cssText = [
      'position:absolute',
      'top:30%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ff8800',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'letter-spacing:3px',
      'text-shadow:0 0 8px #ff6600,0 0 3px #000',
      'display:none',
    ].join(';');
    _hudRoot.appendChild(_contamEl);

    // Canister counter (bottom-left)
    _canisterHudEl = document.createElement('div');
    _canisterHudEl.id = 'cbrn-canister-hud';
    _canisterHudEl.style.cssText = [
      'position:absolute',
      'bottom:60px',
      'left:16px',
      'color:#44aaff',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'text-shadow:0 0 6px #0066aa,0 0 2px #000',
      'letter-spacing:1px',
    ].join(';');
    _hudRoot.appendChild(_canisterHudEl);

    // Inject keyframe animation for flash
    if (!document.getElementById('cbrn-anim-style')) {
      var style = document.createElement('style');
      style.id = 'cbrn-anim-style';
      style.textContent = '@keyframes cbrn-flash{from{opacity:1}to{opacity:0.15}}';
      document.head.appendChild(style);
    }
  }

  function _updateCanisterHUD() {
    if (!_canisterHudEl) return;
    _canisterHudEl.textContent = '[Alt+G] GAS CAN x' + _playerCanisters;
  }

  function _showVignette(visible) {
    if (!_vignetteEl) return;
    _vignetteEl.style.opacity = visible ? '1' : '0';
  }

  function _showMaskPrompt(visible) {
    if (!_maskPromptEl) return;
    _maskPromptEl.style.display = visible ? 'block' : 'none';
  }

  function _showContaminated(visible) {
    if (!_contamEl) return;
    _contamEl.style.display = visible ? 'block' : 'none';
  }

  // ── Build Gas Cloud ───────────────────────────────────────────────────────
  function spawnGasCloud(pos, isPlayer) {
    if (!_scene) return;

    var color   = isPlayer ? GAS_COLOR_PLAYER : GAS_COLOR_ENEMY;
    var opacity = CLOUD_INIT_OPACITY;

    // 10 semi-transparent sphere meshes forming the cloud puff
    var particles = [];
    for (var i = 0; i < CLOUD_PARTICLE_COUNT; i++) {
      var geo = new THREE.SphereGeometry(CLOUD_SPHERE_RADIUS, 7, 7);
      var mat = new THREE.MeshBasicMaterial({
        color:       color,
        transparent: true,
        opacity:     opacity,
        depthWrite:  false,
      });
      var mesh = new THREE.Mesh(geo, mat);
      // Distribute around circumference
      var angle = (i / CLOUD_PARTICLE_COUNT) * Math.PI * 2;
      var r = CLOUD_INIT_RADIUS * 0.6;
      mesh.userData.angle  = angle;
      mesh.userData.height = (Math.random() - 0.5) * 1.5;
      mesh.position.set(
        pos.x + Math.cos(angle) * r,
        pos.y + mesh.userData.height,
        pos.z + Math.sin(angle) * r
      );
      _scene.add(mesh);
      particles.push(mesh);
    }

    // 20 small spiral particles
    var spiralParticles = [];
    for (var si = 0; si < PARTICLE_COUNT_IN_CLOUD; si++) {
      var sgeo = new THREE.SphereGeometry(0.1, 4, 4);
      var smat = new THREE.MeshBasicMaterial({
        color:       color,
        transparent: true,
        opacity:     0.6,
        depthWrite:  false,
      });
      var smesh = new THREE.Mesh(sgeo, smat);
      smesh.userData.spiralAngle  = (si / PARTICLE_COUNT_IN_CLOUD) * Math.PI * 2;
      smesh.userData.spiralHeight = (si / PARTICLE_COUNT_IN_CLOUD) * 2.5 - 1.25;
      smesh.userData.spiralR      = 0.5 + Math.random() * 0.8;
      smesh.position.copy(pos);
      _scene.add(smesh);
      spiralParticles.push(smesh);
    }

    // Dim point light inside cloud for glow effect
    var light = new THREE.PointLight(0xddff44, POINT_LIGHT_INTENSITY, 6);
    light.position.set(pos.x, pos.y + 1, pos.z);
    _scene.add(light);

    var cloud = {
      pos:            new THREE.Vector3(pos.x, pos.y, pos.z),
      isPlayer:       !!isPlayer,
      radius:         CLOUD_INIT_RADIUS,
      opacity:        opacity,
      age:            0,             // total age (seconds)
      fadeStarted:    false,
      particles:      particles,
      spiralParticles: spiralParticles,
      light:          light,
      spiralTime:     0,
    };

    _clouds.push(cloud);
    return cloud;
  }

  // ── Enemy Mortar Shell ────────────────────────────────────────────────────
  function _spawnMortarShell(startPos, targetPos) {
    if (!_scene) return;
    var geo = new THREE.SphereGeometry(MORTAR_SHELL_RADIUS, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: GAS_COLOR_ENEMY });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    _scene.add(mesh);

    _shells.push({
      mesh:       mesh,
      startPos:   startPos.clone(),
      endPos:     targetPos.clone(),
      age:        0,
      travelTime: MORTAR_TRAVEL_TIME,
    });
  }

  // ── Throw Player Gas Canister (Alt+G) ──────────────────────────────────
  function throwCanister() {
    if (!_scene || !_camera) return;
    if (_playerCanisters <= 0) {
      _flashMessage('No gas canisters!', '#44aaff');
      return;
    }
    _playerCanisters--;
    _updateCanisterHUD();

    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() < 0.001) dir.set(0, 0, -1);
    dir.normalize();

    var startPos = _camera.position.clone();
    var endPos   = new THREE.Vector3(
      startPos.x + dir.x * THROW_DISTANCE,
      0.1,
      startPos.z + dir.z * THROW_DISTANCE
    );

    var geo  = new THREE.SphereGeometry(0.14, 6, 6);
    var mat  = new THREE.MeshBasicMaterial({ color: GAS_COLOR_PLAYER });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);
    _scene.add(mesh);

    _canisters.push({
      mesh:       mesh,
      startPos:   startPos.clone(),
      endPos:     endPos.clone(),
      age:        0,
      travelTime: THROW_TRAVEL_TIME,
    });
  }

  // ── Damage Player ─────────────────────────────────────────────────────────
  function _damagePlayer(amount) {
    if (typeof window._playerHealth === 'number') {
      window._playerHealth = Math.max(0, window._playerHealth - amount);
    } else if (window.GameManager && typeof window.GameManager.damagePlayer === 'function') {
      window.GameManager.damagePlayer(amount);
    }
  }

  // ── Flash message helper ──────────────────────────────────────────────────
  function _flashMessage(msg, color) {
    if (!_canisterHudEl) return;
    var prev = _canisterHudEl.textContent;
    var prevColor = _canisterHudEl.style.color;
    _canisterHudEl.textContent = msg;
    _canisterHudEl.style.color = color || '#fff';
    setTimeout(function () {
      _canisterHudEl.textContent = prev;
      _canisterHudEl.style.color = prevColor;
    }, 1400);
  }

  // ── Update In-Flight Shells ───────────────────────────────────────────────
  function _updateShells(dt) {
    var alive = [];
    for (var i = 0; i < _shells.length; i++) {
      var s = _shells[i];
      s.age += dt;
      var t = s.age / s.travelTime;
      if (t >= 1) {
        _scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        // Impact: spawn enemy gas cloud
        spawnGasCloud(s.endPos, false);
      } else {
        var ix = s.startPos.x + (s.endPos.x - s.startPos.x) * t;
        var iz = s.startPos.z + (s.endPos.z - s.startPos.z) * t;
        var iy = s.startPos.y + MORTAR_ARC_HEIGHT * 4 * t * (1 - t);
        s.mesh.position.set(ix, iy, iz);
        alive.push(s);
      }
    }
    _shells = alive;
  }

  // ── Update In-Flight Canisters ────────────────────────────────────────────
  function _updateCanisters(dt) {
    var alive = [];
    for (var i = 0; i < _canisters.length; i++) {
      var c = _canisters[i];
      c.age += dt;
      var t = c.age / c.travelTime;
      if (t >= 1) {
        _scene.remove(c.mesh);
        c.mesh.geometry.dispose();
        c.mesh.material.dispose();
        // Impact: spawn PLAYER gas cloud (blue, non-damaging to player, 8 dps enemies)
        spawnGasCloud(c.endPos, true);
      } else {
        var ix = c.startPos.x + (c.endPos.x - c.startPos.x) * t;
        var iz = c.startPos.z + (c.endPos.z - c.startPos.z) * t;
        var iy = c.startPos.y + THROW_ARC_HEIGHT * 4 * t * (1 - t);
        c.mesh.position.set(ix, iy, iz);
        alive.push(c);
      }
    }
    _canisters = alive;
  }

  // ── Update Clouds ──────────────────────────────────────────────────────────
  function _updateClouds(dt) {
    var newClouds = [];
    var playerInGas    = false;
    var playerUnmasked = false;

    for (var ci = 0; ci < _clouds.length; ci++) {
      var cloud = _clouds[ci];
      cloud.age += dt;
      cloud.spiralTime += dt;

      // Contamination spread: radius grows up to max
      if (cloud.radius < CLOUD_MAX_RADIUS) {
        cloud.radius += CLOUD_EXPAND_RATE * dt;
        if (cloud.radius > CLOUD_MAX_RADIUS) cloud.radius = CLOUD_MAX_RADIUS;
      }

      // Wind drift
      cloud.pos.x += _windX * dt;
      cloud.pos.z += _windZ * dt;

      // Dissipation: start fading after CLOUD_DURATION seconds
      if (cloud.age >= CLOUD_DURATION) {
        cloud.opacity -= CLOUD_FADE_RATE * dt;
        if (cloud.opacity < 0) cloud.opacity = 0;
      }

      // Fully gone?
      if (cloud.opacity <= 0) {
        _destroyCloud(cloud);
        continue;
      }

      // Update 10 cloud puff meshes
      for (var pi = 0; pi < cloud.particles.length; pi++) {
        var p = cloud.particles[pi];
        var ang = p.userData.angle + cloud.spiralTime * 0.15;
        var r   = cloud.radius * 0.75;
        p.position.set(
          cloud.pos.x + Math.cos(ang) * r,
          cloud.pos.y + p.userData.height,
          cloud.pos.z + Math.sin(ang) * r
        );
        p.material.opacity = cloud.opacity;
      }

      // Update 20 spiral particles
      for (var si = 0; si < cloud.spiralParticles.length; si++) {
        var sp  = cloud.spiralParticles[si];
        var sa  = sp.userData.spiralAngle + cloud.spiralTime * 0.9;
        var sr  = sp.userData.spiralR * (cloud.radius / CLOUD_MAX_RADIUS);
        sp.position.set(
          cloud.pos.x + Math.cos(sa) * sr,
          cloud.pos.y + sp.userData.spiralHeight,
          cloud.pos.z + Math.sin(sa) * sr
        );
        sp.material.opacity = cloud.opacity * 0.7;
      }

      // Update point light position
      cloud.light.position.set(cloud.pos.x, cloud.pos.y + 1, cloud.pos.z);
      cloud.light.intensity = POINT_LIGHT_INTENSITY * (cloud.opacity / CLOUD_INIT_OPACITY);

      // Check player inside cloud
      if (_camera) {
        var dx = _camera.position.x - cloud.pos.x;
        var dz = _camera.position.z - cloud.pos.z;
        if (dx * dx + dz * dz < cloud.radius * cloud.radius) {
          playerInGas = true;
          if (!cloud.isPlayer && !window._gasMaskEquipped) {
            playerUnmasked = true;
          }
        }
      }

      // Affect enemies
      _affectEnemies(cloud, dt);

      newClouds.push(cloud);
    }

    _clouds = newClouds;
    return { playerInGas: playerInGas, playerUnmasked: playerUnmasked };
  }

  // ── Affect Enemies in Cloud ───────────────────────────────────────────────
  function _affectEnemies(cloud, dt) {
    var enemies = window._enemies || window._activeEnemies || [];
    if (!Array.isArray(enemies)) return;

    var dps = cloud.isPlayer ? ENEMY_CLOUD_DPS : 0;  // player clouds damage enemies

    for (var ei = 0; ei < enemies.length; ei++) {
      var e = enemies[ei];
      if (!e) continue;

      var ex = 0, ez = 0;
      if (e.mesh && e.mesh.position) {
        ex = e.mesh.position.x;
        ez = e.mesh.position.z;
      } else if (e.position) {
        ex = e.position.x;
        ez = e.position.z;
      } else {
        continue;
      }

      var dx = ex - cloud.pos.x;
      var dz = ez - cloud.pos.z;
      if (dx * dx + dz * dz < cloud.radius * cloud.radius) {
        // Enemy is inside cloud
        e.choked = true;
        if (typeof e.chokeTimer !== 'number' || e.chokeTimer < 3) {
          e.chokeTimer = 3;
        }

        // Coughing animation: oscillate Y position
        if (e.mesh && e.mesh.position) {
          e.mesh.position.y += Math.sin(Date.now() * 0.015) * 0.008;
        }

        // Apply damage from player canisters
        if (dps > 0) {
          if (typeof e.takeDamage === 'function') {
            e.takeDamage(dps * dt);
          } else if (typeof e.health === 'number') {
            e.health -= dps * dt;
          }
        }

        // Enemy also takes damage from enemy clouds (enemy-on-enemy not applicable;
        // non-player clouds affect player only, but we can skip enemies for enemy clouds)
      } else {
        // Outside cloud — don't reset chokeTimer here (handled by enemy update)
      }
    }
  }

  // ── Destroy Cloud ─────────────────────────────────────────────────────────
  function _destroyCloud(cloud) {
    if (!_scene) return;
    for (var pi = 0; pi < cloud.particles.length; pi++) {
      var p = cloud.particles[pi];
      _scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
    }
    for (var si = 0; si < cloud.spiralParticles.length; si++) {
      var sp = cloud.spiralParticles[si];
      _scene.remove(sp);
      sp.geometry.dispose();
      sp.material.dispose();
    }
    _scene.remove(cloud.light);
    cloud.particles = [];
    cloud.spiralParticles = [];
  }

  // ── Main Update (called every frame) ──────────────────────────────────────
  function update(delta) {
    if (!delta || delta <= 0) delta = 0.016;
    if (!_scene) return;

    _updateShells(delta);
    _updateCanisters(delta);

    var result = _updateClouds(delta);
    var playerInGas    = result.playerInGas;
    var playerUnmasked = result.playerUnmasked;

    var hasMask = !!window._gasMaskEquipped;

    // ── Player gas exposure ─────────────────────────────────────────────────
    if (playerInGas) {
      if (!hasMask) {
        // Damage
        _damagePlayer(PLAYER_DAMAGE_RATE * delta);
        // Show green vignette on screen edges
        _showVignette(true);
        // Flash "EQUIP GAS MASK [M]"
        _showMaskPrompt(true);
      } else {
        _showVignette(false);
        _showMaskPrompt(false);
      }
      _wasInGas = true;
      _contaminatedTimer = 0;    // reset while still inside
      window._playerContaminated = false;
    } else {
      _showVignette(false);
      _showMaskPrompt(false);

      // Just left the cloud
      if (_wasInGas) {
        _wasInGas = false;
        // Start contamination countdown
        _contaminatedTimer = CONTAMINATION_DURATION;
        window._playerContaminated = true;
      }
    }

    // ── Contamination lingering ──────────────────────────────────────────────
    if (_contaminatedTimer > 0) {
      _contaminatedTimer -= delta;
      window._playerContaminated = true;
      _showContaminated(true);
      // 1 HP/s while contaminated
      _damagePlayer(CONTAMINATION_DPS * delta);
      if (_contaminatedTimer <= 0) {
        _contaminatedTimer = 0;
        window._playerContaminated = false;
        _showContaminated(false);
      }
    } else if (!playerInGas) {
      _showContaminated(false);
    }

    // ── Choke timer tick-down for enemies ──────────────────────────────────
    var enemies = window._enemies || window._activeEnemies || [];
    if (Array.isArray(enemies)) {
      for (var ei = 0; ei < enemies.length; ei++) {
        var e = enemies[ei];
        if (!e) continue;
        if (e.choked && typeof e.chokeTimer === 'number') {
          e.chokeTimer -= delta;
          if (e.chokeTimer <= 0) {
            e.choked = false;
            e.chokeTimer = 0;
          }
        }
      }
    }
  }

  // ── Public: trigger enemy mortar chem shell ───────────────────────────────
  // Call this from enemy-mortar-team.js or game manager
  function fireEnemyMortarShell(fromPos, targetPos) {
    _spawnMortarShell(fromPos, targetPos);
  }

  // ── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    // Remove shells
    for (var si = 0; si < _shells.length; si++) {
      if (_shells[si].mesh && _scene) {
        _scene.remove(_shells[si].mesh);
        _shells[si].mesh.geometry.dispose();
        _shells[si].mesh.material.dispose();
      }
    }
    _shells = [];

    // Remove canisters
    for (var ci = 0; ci < _canisters.length; ci++) {
      if (_canisters[ci].mesh && _scene) {
        _scene.remove(_canisters[ci].mesh);
        _canisters[ci].mesh.geometry.dispose();
        _canisters[ci].mesh.material.dispose();
      }
    }
    _canisters = [];

    // Destroy all clouds
    for (var ki = 0; ki < _clouds.length; ki++) {
      _destroyCloud(_clouds[ki]);
    }
    _clouds = [];

    _playerCanisters = PLAYER_CANISTER_COUNT;
    _contaminatedTimer = 0;
    _wasInGas = false;
    window._playerContaminated = false;

    // Re-randomise wind
    var angle = Math.random() * Math.PI * 2;
    _windX = Math.cos(angle) * WIND_SPEED;
    _windZ = Math.sin(angle) * WIND_SPEED;

    _showVignette(false);
    _showMaskPrompt(false);
    _showContaminated(false);
    _updateCanisterHUD();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init:                 init,
    update:               update,
    spawnGasCloud:        spawnGasCloud,
    throwCanister:        throwCanister,
    fireEnemyMortarShell: fireEnemyMortarShell,
    reset:                reset,
  };

})();
