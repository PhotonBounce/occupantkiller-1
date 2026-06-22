// ============================================================
//  blood-trail.js — Wounded enemies leave blood trails for tracking
//  Features:
//    - Ground blood drops (trail + splatter on hit)
//    - Wound-type-specific visuals (normal, shotgun, headshot)
//    - Pre-pooled geometry (200 floor drops + 50 wall splatters)
//    - Drop fade-out after 30s (opacity lerp over 2s)
//    - Death pool cluster on enemy death (60s lifetime)
//    - Wall splatter via simple heuristic (no raycast)
//  Public API: init(scene), update(dt), onEnemyDamaged(enemy, dmg),
//              onEnemyDeath(enemy), clear(), reset()
//  Hooks: window._onEnemyDamageForBlood, window._onEnemyDeathForBlood
// ============================================================
window.BloodTrail = (function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────
  var MAX_FLOOR_DROPS   = 200;
  var MAX_WALL_SPLATTERS = 50;
  var DROP_INTERVAL_NORMAL = 0.30;   // seconds between trail drops (>30% HP)
  var DROP_INTERVAL_HEAVY  = 0.15;   // seconds between trail drops (<30% HP)
  var BLEED_THRESHOLD  = 0.60;       // start bleeding below 60% HP
  var DROP_LIFETIME    = 30.0;       // seconds before fade begins
  var FADE_DURATION    = 2.0;        // seconds to fade to 0 opacity
  var BLOOD_COLOR      = 0x8B0000;   // base dark red

  // ── Module state ────────────────────────────────────────
  var _scene      = null;
  var _initialized = false;

  // Shared material for all floor blood drops
  var _floorMat   = null;
  // Shared material for all wall splatters
  var _wallMat    = null;

  // Pool arrays: all meshes pre-created at init
  var _floorPool  = [];  // array of {mesh, active, timer, lifetime}
  var _wallPool   = [];  // array of {mesh, active, timer}

  // Active drop records (point into pool by index)
  // Using parallel arrays instead of objects for perf
  var _floorActive  = [];  // indices into _floorPool that are currently live
  var _wallActive   = [];  // indices into _wallPool currently live

  // Per-enemy bleeding state
  var _enemyState = {};  // keyed by enemy._btId, value: {timer, active}
  var _btIdCounter = 0;

  // ── Helpers ─────────────────────────────────────────────
  function _rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function _varyColor(base) {
    // Vary brightness slightly per-drop so drops look organic
    var r = ((base >> 16) & 0xff);
    var g = ((base >>  8) & 0xff);
    var b =  (base        & 0xff);
    var delta = Math.floor(_rnd(-12, 12));
    r = Math.max(0, Math.min(255, r + delta));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return (r << 16) | (g << 8) | b;
  }

  // ── Pool management ─────────────────────────────────────

  function _buildFloorPool() {
    for (var i = 0; i < MAX_FLOOR_DROPS; i++) {
      var radius = 0.08;
      var geo = new THREE.CircleGeometry(radius, 6);
      var mesh = new THREE.Mesh(geo, _floorMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      mesh.renderOrder = 1;
      _scene.add(mesh);
      _floorPool.push({ mesh: mesh, active: false, timer: 0, lifetime: DROP_LIFETIME });
    }
  }

  function _buildWallPool() {
    for (var i = 0; i < MAX_WALL_SPLATTERS; i++) {
      var geo = new THREE.PlaneGeometry(0.1, 0.1);
      var mesh = new THREE.Mesh(geo, _wallMat);
      mesh.visible = false;
      mesh.renderOrder = 1;
      _scene.add(mesh);
      _wallPool.push({ mesh: mesh, active: false, timer: 0 });
    }
  }

  // Return a free floor pool slot (recycles oldest if full)
  function _acquireFloorSlot() {
    // Try to find inactive
    for (var i = 0; i < _floorPool.length; i++) {
      if (!_floorPool[i].active) return i;
    }
    // All in use — recycle oldest active (first in _floorActive list)
    if (_floorActive.length > 0) {
      var oldest = _floorActive.shift();
      _floorPool[oldest].mesh.visible = false;
      _floorPool[oldest].active = false;
      return oldest;
    }
    return 0;
  }

  function _acquireWallSlot() {
    for (var i = 0; i < _wallPool.length; i++) {
      if (!_wallPool[i].active) return i;
    }
    if (_wallActive.length > 0) {
      var oldest = _wallActive.shift();
      _wallPool[oldest].mesh.visible = false;
      _wallPool[oldest].active = false;
      return oldest;
    }
    return 0;
  }

  // ── Place a single floor blood drop ─────────────────────
  // woundType: 'normal' | 'shotgun' | 'headshot' | 'death'
  // x, z: world XZ position
  // lifetime: optional override (for death pools)
  function _placeFloorDrop(x, z, woundType, lifetime) {
    var slot = _acquireFloorSlot();
    var entry = _floorPool[slot];
    var mesh  = entry.mesh;

    // Rebuild geometry with wound-type-specific radius
    var radius;
    if (woundType === 'headshot') {
      radius = 0.2 + _rnd(-0.02, 0.02);
    } else if (woundType === 'shotgun') {
      radius = 0.15 + _rnd(-0.02, 0.04);
    } else if (woundType === 'death') {
      radius = _rnd(0.10, 0.30);
    } else {
      radius = 0.08 + Math.random() * 0.06;
    }

    // Dispose old geometry, create new (pool is small enough that this is OK
    // for infrequent death/headshot events; trail drops reuse)
    mesh.geometry.dispose();
    mesh.geometry = new THREE.CircleGeometry(radius, 6);

    // Color variation
    var col = _varyColor(BLOOD_COLOR);
    mesh.material = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });

    mesh.position.set(x, 0.01, z);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = _rnd(0, Math.PI * 2); // random angular tilt for organic look
    mesh.visible = true;

    entry.active   = true;
    entry.timer    = 0;
    entry.lifetime = (lifetime !== undefined) ? lifetime : DROP_LIFETIME;

    _floorActive.push(slot);
    return slot;
  }

  // ── Place a wall splatter ───────────────────────────────
  // pos: THREE.Vector3 of impact, normal: facing direction (unit vec)
  function _placeWallSplatter(px, py, pz, nx, ny, nz) {
    var slot = _acquireWallSlot();
    var entry = _wallPool[slot];
    var mesh  = entry.mesh;

    var size = _rnd(0.07, 0.14);
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(size, size);
    mesh.material = new THREE.MeshBasicMaterial({
      color: _varyColor(BLOOD_COLOR),
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    // Offset slightly off the wall surface to avoid z-fighting
    var OFFSET = 0.015;
    mesh.position.set(
      px + nx * OFFSET,
      py + _rnd(-0.15, 0.15),
      pz + nz * OFFSET
    );

    // Orient plane to face along normal (yaw only — we ignore roll)
    mesh.rotation.set(0, Math.atan2(nx, nz), 0);

    mesh.visible = true;
    entry.active  = true;
    entry.timer   = 0;

    _wallActive.push(slot);
  }

  // ── Splatter on hit (multiple drops in radius) ───────────
  function _spawnSplatter(x, z, woundType) {
    var count, radius;
    if (woundType === 'shotgun') {
      count  = Math.floor(_rnd(6, 9));   // 6-8
      radius = 0.50;
    } else if (woundType === 'headshot') {
      count  = Math.floor(_rnd(4, 7));   // 4-6
      radius = 0.40;
    } else {
      count  = Math.floor(_rnd(3, 6));   // 3-5
      radius = 0.30;
    }
    for (var i = 0; i < count; i++) {
      var angle = _rnd(0, Math.PI * 2);
      var dist  = _rnd(0, radius);
      _placeFloorDrop(
        x + Math.cos(angle) * dist,
        z + Math.sin(angle) * dist,
        woundType,
        DROP_LIFETIME
      );
    }
  }

  // ── Heuristic wall splatter near enemy ─────────────────
  // We pick the closest wall axis (X or Z) relative to enemy position
  // and place a splatter in that direction.
  function _spawnWallSplatterHeuristic(ex, ey, ez) {
    // Simple heuristic: emit a splatter on the dominant axis from scene origin
    // In a grid-based voxel world this approximation is sufficient without raycasting
    var absX = Math.abs(ex);
    var absZ = Math.abs(ez);
    var nx, nz;
    if (absX >= absZ) {
      nx = (ex > 0) ? 1 : -1;
      nz = 0;
    } else {
      nx = 0;
      nz = (ez > 0) ? 1 : -1;
    }
    // Place the splatter 0.5 units in that direction from the enemy
    _placeWallSplatter(
      ex + nx * 0.5,
      ey + _rnd(0.5, 1.2),
      ez + nz * 0.5,
      nx, 0, nz
    );
  }

  // ── Death pool cluster ──────────────────────────────────
  function _spawnDeathPool(x, z) {
    var count = Math.floor(_rnd(5, 9)); // 5-8
    for (var i = 0; i < count; i++) {
      var angle = _rnd(0, Math.PI * 2);
      var dist  = _rnd(0, 0.35);
      _placeFloorDrop(
        x + Math.cos(angle) * dist,
        z + Math.sin(angle) * dist,
        'death',
        60.0   // 60s lifetime
      );
    }
  }

  // ── Public API ──────────────────────────────────────────

  function init(scene) {
    _scene = scene;

    // Shared materials (one instance — shared across all drops via per-slot override for color variety)
    _floorMat = new THREE.MeshBasicMaterial({
      color: BLOOD_COLOR,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });
    _wallMat = new THREE.MeshBasicMaterial({
      color: BLOOD_COLOR,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    _floorPool   = [];
    _wallPool    = [];
    _floorActive = [];
    _wallActive  = [];
    _enemyState  = {};
    _btIdCounter = 0;

    _buildFloorPool();
    _buildWallPool();

    _initialized = true;

    // Register global hooks
    window._onEnemyDamageForBlood = function (enemy, dmg) {
      BloodTrail.onEnemyDamaged(enemy, dmg);
    };
    window._onEnemyDeathForBlood = function (enemy) {
      BloodTrail.onEnemyDeath(enemy);
    };

    console.log('[BloodTrail] initialized — ' + MAX_FLOOR_DROPS + ' floor slots, ' + MAX_WALL_SPLATTERS + ' wall slots');
  }

  function update(dt) {
    if (!_initialized || !_scene) return;

    // Update floor drops: fade and deactivate
    var i = 0;
    while (i < _floorActive.length) {
      var idx   = _floorActive[i];
      var entry = _floorPool[idx];
      if (!entry.active) {
        _floorActive.splice(i, 1);
        continue;
      }
      entry.timer += dt;
      // Fade phase
      if (entry.timer >= entry.lifetime) {
        var fadeT = (entry.timer - entry.lifetime) / FADE_DURATION;
        if (fadeT >= 1.0) {
          // Fully faded — deactivate
          entry.mesh.visible = false;
          entry.active = false;
          _floorActive.splice(i, 1);
          continue;
        }
        var targetOpacity = 0.92 * (1.0 - fadeT);
        if (entry.mesh.material && entry.mesh.material.opacity !== undefined) {
          entry.mesh.material.opacity = targetOpacity;
        }
      }
      i++;
    }

    // Update wall splatters: fade over same schedule as floor drops
    var j = 0;
    while (j < _wallActive.length) {
      var widx  = _wallActive[j];
      var wentry = _wallPool[widx];
      if (!wentry.active) {
        _wallActive.splice(j, 1);
        continue;
      }
      wentry.timer += dt;
      if (wentry.timer >= DROP_LIFETIME) {
        var wfadeT = (wentry.timer - DROP_LIFETIME) / FADE_DURATION;
        if (wfadeT >= 1.0) {
          wentry.mesh.visible = false;
          wentry.active = false;
          _wallActive.splice(j, 1);
          continue;
        }
        if (wentry.mesh.material && wentry.mesh.material.opacity !== undefined) {
          wentry.mesh.material.opacity = 0.85 * (1.0 - wfadeT);
        }
      }
      j++;
    }

    // Tick per-enemy bleed timers (drop placement happens in onEnemyDamaged)
    // We only need to tick the interval counters that drive passive trail drops.
    // Passive drops are driven externally via repeated onEnemyDamaged calls or
    // a separate game loop that tracks enemy position. We expose addTrailDrop
    // for that purpose. The timer resets are also managed there.
  }

  // Called every frame by the game loop for each wounded enemy
  // (Game must call this if it wants passive trail drops while enemy moves)
  function tickEnemyTrail(enemy, dt) {
    if (!_initialized) return;
    if (!enemy || enemy.hp === undefined || enemy.maxHp === undefined) return;

    var hpFrac = enemy.hp / enemy.maxHp;
    if (hpFrac >= BLEED_THRESHOLD || enemy.hp <= 0) return;

    // Ensure state record exists
    var id = enemy._btId;
    if (!id) return;
    var state = _enemyState[id];
    if (!state) return;

    state.timer += dt;
    var interval = (hpFrac < 0.30) ? DROP_INTERVAL_HEAVY : DROP_INTERVAL_NORMAL;

    if (state.timer >= interval) {
      state.timer -= interval;
      var ex = enemy.position ? enemy.position.x : 0;
      var ez = enemy.position ? enemy.position.z : 0;
      _placeFloorDrop(ex + _rnd(-0.05, 0.05), ez + _rnd(-0.05, 0.05), 'normal', DROP_LIFETIME);
    }
  }

  function onEnemyDamaged(enemy, damage, woundType) {
    if (!_initialized || !enemy) return;

    // Assign a unique ID to this enemy for state tracking
    if (!enemy._btId) {
      enemy._btId = ++_btIdCounter;
    }

    var id = enemy._btId;

    // Ensure state record
    if (!_enemyState[id]) {
      _enemyState[id] = { timer: 0, active: false };
    }

    var maxHp = (enemy.maxHp !== undefined) ? enemy.maxHp : 100;
    var curHp = (enemy.hp   !== undefined) ? enemy.hp   : 0;
    var hpFrac = maxHp > 0 ? curHp / maxHp : 0;

    // Resolve wound type
    var type = woundType || 'normal';
    if (type !== 'shotgun' && type !== 'headshot') type = 'normal';

    // Only spawn effects if enemy survived (hp > 0)
    if (curHp <= 0) return;

    var ex = enemy.position ? enemy.position.x : 0;
    var ey = enemy.position ? enemy.position.y : 0;
    var ez = enemy.position ? enemy.position.z : 0;

    // Always spawn impact splatter at hit position
    _spawnSplatter(ex, ez, type);

    // Heuristic wall splatter for shotgun or close-range hits
    if (type === 'shotgun') {
      _spawnWallSplatterHeuristic(ex, ey, ez);
    }

    // Start bleeding trail if below threshold
    if (hpFrac < BLEED_THRESHOLD) {
      _enemyState[id].active = true;
    }
  }

  function onEnemyDeath(enemy) {
    if (!_initialized || !enemy) return;

    var ex = enemy.position ? enemy.position.x : 0;
    var ez = enemy.position ? enemy.position.z : 0;
    var ey = enemy.position ? enemy.position.y : 0;

    // Headshot death pool (larger)
    _placeFloorDrop(ex, ez, 'headshot', 60.0);

    // Cluster death pool
    _spawnDeathPool(ex, ez);

    // Wall splatter on death
    _spawnWallSplatterHeuristic(ex, ey, ez);

    // Clean up enemy state
    if (enemy._btId && _enemyState[enemy._btId]) {
      delete _enemyState[enemy._btId];
      delete enemy._btId;
    }
  }

  function clear() {
    if (!_initialized) return;

    for (var i = 0; i < _floorPool.length; i++) {
      _floorPool[i].mesh.visible = false;
      _floorPool[i].active = false;
      _floorPool[i].timer  = 0;
    }
    for (var j = 0; j < _wallPool.length; j++) {
      _wallPool[j].mesh.visible = false;
      _wallPool[j].active = false;
      _wallPool[j].timer  = 0;
    }
    _floorActive = [];
    _wallActive  = [];
    _enemyState  = {};
  }

  function reset() {
    clear();
    _btIdCounter = 0;
  }

  // ── Public object ────────────────────────────────────────
  var BloodTrail = {
    init:            init,
    update:          update,
    tickEnemyTrail:  tickEnemyTrail,
    onEnemyDamaged:  onEnemyDamaged,
    onEnemyDeath:    onEnemyDeath,
    clear:           clear,
    reset:           reset
  };

  return BloodTrail;

})();
