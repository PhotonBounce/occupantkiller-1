window.SmokeLauncher = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MAX_GRENADES     = 4;
  var RELOAD_TIME      = 15;      // seconds per grenade
  var SMOKE_DURATION   = 12;      // seconds total
  var SMOKE_FADE_RATE  = 0.02;    // opacity reduction per frame
  var EXPAND_TIME      = 4;       // seconds to reach full size
  var START_RADIUS     = 0.3;
  var END_RADIUS       = 3.5;
  var SPHERE_COUNT     = 15;
  var SPREAD_XZ        = 1.5;
  var PROJECTILE_SPEED = 12;
  var GRAVITY          = -9.8;
  var GROUND_LEVEL     = 0.1;
  var PLAYER_SMOKE_DIST = 4;      // metres
  var WP_DPS           = 5;       // damage/second for PURPLE variant

  // Color variant definitions
  var COLOR_VARIANTS = [
    { name: 'WHITE',  color: 0xffffff, label: 'WHITE' },
    { name: 'RED',    color: 0xff2222, label: 'RED'   },
    { name: 'PURPLE', color: 0xcc44ff, label: 'PURPLE' }
  ];

  // ── State ─────────────────────────────────────────────────────────────────
  var _scene    = null;
  var _camera   = null;

  var _grenadeCount  = MAX_GRENADES;
  var _reloadTimers  = [];          // remaining reload time per missing grenade
  var _colorIndex    = 0;           // current color variant index

  var _projectiles = [];  // { mesh, velocity, age }
  var _clouds      = [];  // { spheres:[{mesh,startPos,offset}], age, center, colorVariant }

  var _keysDown = {};
  var _altSHeld  = false;
  var _ctrlSHeld = false;

  var _hudEl = null;

  // ── HUD ───────────────────────────────────────────────────────────────────
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'smoke-launcher-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:20px',
      'color:#ccffcc',
      'font-family:monospace',
      'font-size:14px',
      'text-shadow:0 0 4px #000',
      'pointer-events:none',
      'z-index:500',
      'user-select:none'
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var filled = _grenadeCount;
    var dots = '';
    for (var i = 0; i < MAX_GRENADES; i++) {
      dots += (i < filled) ? '●' : '○';
    }
    var variant = COLOR_VARIANTS[_colorIndex];
    _hudEl.textContent = 'SMOKE [' + _grenadeCount + '] ' + dots + '  (' + variant.label + ')';
  }

  // ── Smoke cloud material factory ─────────────────────────────────────────
  function _makeSmokeSphereMesh(colorHex, opacity) {
    var geo = new THREE.SphereGeometry(START_RADIUS, 6, 6);
    var mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: opacity,
      depthWrite: false
    });
    return new THREE.Mesh(geo, mat);
  }

  // ── Fire ──────────────────────────────────────────────────────────────────
  function fire() {
    if (_grenadeCount <= 0) return;
    if (!_scene || !_camera) return;

    _grenadeCount -= 1;
    _reloadTimers.push(RELOAD_TIME);

    // Build projectile mesh
    var geo = new THREE.SphereGeometry(0.1, 6, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0x6b6b2a }); // olive
    var mesh = new THREE.Mesh(geo, mat);

    // Start at camera position
    var pos = new THREE.Vector3();
    _camera.getWorldPosition(pos);
    mesh.position.copy(pos);
    _scene.add(mesh);

    // Velocity = camera direction * PROJECTILE_SPEED
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    var vel = dir.multiplyScalar(PROJECTILE_SPEED);

    _projectiles.push({
      mesh: mesh,
      velocity: vel,
      age: 0,
      colorVariantIndex: _colorIndex
    });

    _updateHUD();
  }

  // ── Spawn smoke cloud at impact point ────────────────────────────────────
  function _spawnCloud(impactPos, colorVariantIndex) {
    var variant   = COLOR_VARIANTS[colorVariantIndex];
    var colorHex  = variant.color;
    var spheres   = [];

    for (var i = 0; i < SPHERE_COUNT; i++) {
      // Random opacity 0.4 – 0.6
      var opacity = 0.4 + Math.random() * 0.2;
      var mesh    = _makeSmokeSphereMesh(colorHex, opacity);

      // Random XZ offset ±1.5
      var ox = (Math.random() * 2 - 1) * SPREAD_XZ;
      var oz = (Math.random() * 2 - 1) * SPREAD_XZ;

      mesh.position.set(
        impactPos.x + ox,
        impactPos.y,
        impactPos.z + oz
      );
      _scene.add(mesh);

      spheres.push({ mesh: mesh, baseOpacity: opacity });
    }

    _clouds.push({
      spheres: spheres,
      age: 0,
      center: new THREE.Vector3(impactPos.x, impactPos.y, impactPos.z),
      colorVariantIndex: colorVariantIndex,
      wpDamageAccum: 0
    });
  }

  // ── Update projectiles ────────────────────────────────────────────────────
  function _updateProjectiles(dt) {
    var toRemove = [];
    for (var i = 0; i < _projectiles.length; i++) {
      var p = _projectiles[i];
      p.velocity.y += GRAVITY * dt;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;
      p.age += dt;

      if (p.mesh.position.y <= GROUND_LEVEL) {
        // Impact — spawn smoke cloud
        var impact = p.mesh.position.clone();
        impact.y = GROUND_LEVEL;
        _spawnCloud(impact, p.colorVariantIndex);

        _scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
        toRemove.push(i);
      }
    }
    // Remove from back to front to keep indices valid
    for (var j = toRemove.length - 1; j >= 0; j--) {
      _projectiles.splice(toRemove[j], 1);
    }
  }

  // ── Update clouds ─────────────────────────────────────────────────────────
  function _updateClouds(dt) {
    var playerPos = null;
    if (_camera) {
      playerPos = new THREE.Vector3();
      _camera.getWorldPosition(playerPos);
    }

    var playerInSmoke = false;
    var cloudsToRemove = [];

    for (var c = 0; c < _clouds.length; c++) {
      var cloud = _clouds[c];
      cloud.age += dt;

      // Compute expand fraction (0→1 over EXPAND_TIME)
      var expandFrac = Math.min(cloud.age / EXPAND_TIME, 1.0);
      var curRadius  = START_RADIUS + (END_RADIUS - START_RADIUS) * expandFrac;

      // Fade after SMOKE_DURATION
      var fadeFrac = 0;
      if (cloud.age > SMOKE_DURATION) {
        fadeFrac = (cloud.age - SMOKE_DURATION) * SMOKE_FADE_RATE * 60; // per-second at ~60fps rate
      }

      var variant = COLOR_VARIANTS[cloud.colorVariantIndex];
      var isWP    = (variant.name === 'PURPLE');

      // ── WP damage to enemies inside cloud ──────────────────────────────
      if (isWP && cloud.age <= SMOKE_DURATION) {
        var wpDamageThisFrame = WP_DPS * dt;
        if (window.Enemies && typeof window.Enemies.getAll === 'function') {
          var allEnemies = window.Enemies.getAll();
          for (var ei = 0; ei < allEnemies.length; ei++) {
            var en = allEnemies[ei];
            var epos = null;
            if (en.mesh && en.mesh.position) epos = en.mesh.position;
            else if (en.position) epos = en.position;
            if (!epos) continue;
            var dx = epos.x - cloud.center.x;
            var dz = epos.z - cloud.center.z;
            var distXZ = Math.sqrt(dx * dx + dz * dz);
            if (distXZ <= END_RADIUS) {
              if (typeof en.health !== 'undefined') {
                en.health -= wpDamageThisFrame;
              }
              if (typeof en.takeDamage === 'function') {
                en.takeDamage(wpDamageThisFrame);
              }
            }
          }
        }
      }

      // ── Enemy AI concealment & player smoke detection ─────────────────
      if (cloud.age <= SMOKE_DURATION) {
        // Enemy accuracy penalty
        if (window.Enemies && typeof window.Enemies.getAll === 'function') {
          var enemies = window.Enemies.getAll();
          for (var ei2 = 0; ei2 < enemies.length; ei2++) {
            var e = enemies[ei2];
            var ep = null;
            if (e.mesh && e.mesh.position) ep = e.mesh.position;
            else if (e.position) ep = e.position;
            if (!ep) continue;
            var ddx = ep.x - cloud.center.x;
            var ddz = ep.z - cloud.center.z;
            var edist = Math.sqrt(ddx * ddx + ddz * ddz);
            if (edist <= END_RADIUS) {
              e.accuracyMultiplier = 0.2;
            }
          }
        }

        // Player concealment
        if (playerPos) {
          var pdx = playerPos.x - cloud.center.x;
          var pdz = playerPos.z - cloud.center.z;
          var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
          if (pdist <= PLAYER_SMOKE_DIST) {
            playerInSmoke = true;
          }
        }
      }

      // ── Update sphere geometry and opacity ───────────────────────────
      var allGone = true;
      var spheresToRemove = [];
      for (var s = 0; s < cloud.spheres.length; s++) {
        var sp = cloud.spheres[s];

        // Scale sphere to current radius
        var scale = curRadius / START_RADIUS;
        sp.mesh.scale.set(scale, scale, scale);

        // Compute opacity
        var opacity = sp.baseOpacity;
        if (cloud.age > SMOKE_DURATION) {
          opacity = sp.baseOpacity - fadeFrac;
        }

        if (opacity <= 0) {
          _scene.remove(sp.mesh);
          if (sp.mesh.geometry) sp.mesh.geometry.dispose();
          if (sp.mesh.material) sp.mesh.material.dispose();
          spheresToRemove.push(s);
        } else {
          sp.mesh.material.opacity = opacity;
          allGone = false;
        }
      }
      // Remove disposed spheres (back to front)
      for (var sr = spheresToRemove.length - 1; sr >= 0; sr--) {
        cloud.spheres.splice(spheresToRemove[sr], 1);
      }

      if (allGone || cloud.spheres.length === 0) {
        cloudsToRemove.push(c);
      }
    }

    // Remove expired clouds (back to front)
    for (var cr = cloudsToRemove.length - 1; cr >= 0; cr--) {
      _clouds.splice(cloudsToRemove[cr], 1);
    }

    // Set player smoke flag
    window._playerInSmoke = playerInSmoke;
  }

  // ── Update reload timers ──────────────────────────────────────────────────
  function _updateReload(dt) {
    if (_reloadTimers.length === 0) return;
    _reloadTimers[0] -= dt;
    if (_reloadTimers[0] <= 0) {
      _reloadTimers.shift();
      if (_grenadeCount < MAX_GRENADES) {
        _grenadeCount += 1;
        _updateHUD();
      }
    }
  }

  // ── Keyboard handling ─────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    // Alt+S → fire
    if ((e.code === 'KeyS') && e.altKey && !e.ctrlKey) {
      e.preventDefault();
      if (!_altSHeld) {
        _altSHeld = true;
        fire();
      }
    }

    // Ctrl+S → cycle color
    if ((e.code === 'KeyS') && e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (!_ctrlSHeld) {
        _ctrlSHeld = true;
        _colorIndex = (_colorIndex + 1) % COLOR_VARIANTS.length;
        _updateHUD();
      }
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
    if (e.code === 'KeyS') {
      _altSHeld  = false;
      _ctrlSHeld = false;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _grenadeCount = MAX_GRENADES;
    _reloadTimers = [];
    _colorIndex   = 0;
    _projectiles  = [];
    _clouds       = [];
    _keysDown     = {};
    _altSHeld     = false;
    _ctrlSHeld    = false;

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);

    _createHUD();
  }

  function update(dt) {
    if (!_scene || !_camera) return;
    if (typeof dt !== 'number' || dt <= 0) dt = 0.016;

    _updateProjectiles(dt);
    _updateClouds(dt);
    _updateReload(dt);
  }

  function reset() {
    // Dispose all active projectiles
    for (var i = 0; i < _projectiles.length; i++) {
      var p = _projectiles[i];
      if (_scene) _scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) p.mesh.material.dispose();
    }
    _projectiles = [];

    // Dispose all smoke cloud spheres
    for (var c = 0; c < _clouds.length; c++) {
      var cloud = _clouds[c];
      for (var s = 0; s < cloud.spheres.length; s++) {
        var sp = cloud.spheres[s];
        if (_scene) _scene.remove(sp.mesh);
        if (sp.mesh.geometry) sp.mesh.geometry.dispose();
        if (sp.mesh.material) sp.mesh.material.dispose();
      }
    }
    _clouds = [];

    _grenadeCount  = MAX_GRENADES;
    _reloadTimers  = [];
    _colorIndex    = 0;
    _keysDown      = {};
    _altSHeld      = false;
    _ctrlSHeld     = false;
    window._playerInSmoke = false;

    _updateHUD();
  }

  return {
    init:   init,
    update: update,
    fire:   fire,
    reset:  reset
  };
})();
