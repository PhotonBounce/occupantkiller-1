/**
 * tracer-system.js – Cylinder-mesh tracer rounds with every-Nth-shot logic,
 * enemy tracers (40% chance), and a pre-allocated pool of 30 mesh+light pairs.
 *
 * Depends on: Three.js global (THREE), Tracers (tracers.js) for line tracers.
 * Exposes:  window.TracerSystem  { init, fireTracer, fireEnemyTracer, update, reset }
 *           window._tracerEnabled    (bool,  default true)
 *           window._tracerFrequency  (int,   default 3 — every Nth player shot)
 *           window._onShotForTracer  (hook — game-manager calls this on every shot)
 */
window.TracerSystem = (function() {

  // ── Globals / tunables ────────────────────────────────────────────────────
  if (typeof window._tracerEnabled === 'undefined')   window._tracerEnabled   = true;
  if (typeof window._tracerFrequency === 'undefined') window._tracerFrequency = 3;

  // ── Module state ──────────────────────────────────────────────────────────
  var _scene         = null;
  var _playerShotN   = 0;   // running count of player shots, used for Nth-shot check

  // Cylinder geometry shared across all pool entries
  // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
  var _cylGeo = null;   // created lazily after THREE is definitely available

  // ── Object pool ───────────────────────────────────────────────────────────
  var POOL_SIZE = 30;
  var _pool     = [];   // { mesh, light, active, origin, direction, distTravelled }
  var _active   = [];   // subset currently flying

  var MAX_RANGE = 60;          // units – tracer disappears after this distance
  var SPEED     = 80;          // units / second
  var MAX_LIFE  = 0.75;        // seconds hard cap

  // ── Color constants ───────────────────────────────────────────────────────
  var COLOR_DEFAULT = 0xFF6600;   // orange-yellow (most weapons)
  var COLOR_SNIPER  = 0xFF4400;   // brighter orange-red (sniper rifles)
  var COLOR_TRACER  = 0x00FF44;   // bright green (tracer-ammo attachment, every shot)
  var COLOR_ENEMY   = 0xFF2200;   // red-orange (enemy rounds zipping past)

  // ── Lazy geometry / pool init ─────────────────────────────────────────────
  function _ensurePool() {
    if (_pool.length >= POOL_SIZE) return;
    if (typeof THREE === 'undefined') return;
    if (!_cylGeo) {
      // Thin elongated cylinder oriented along Y axis; we rotate it to face direction
      _cylGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4);
    }
    var toCreate = POOL_SIZE - _pool.length;
    for (var i = 0; i < toCreate; i++) {
      var mat  = new THREE.MeshBasicMaterial({ color: COLOR_DEFAULT });
      var mesh = new THREE.Mesh(_cylGeo, mat);
      mesh.visible = false;
      var light = new THREE.PointLight(COLOR_DEFAULT, 2, 3);
      light.visible = false;
      _pool.push({
        mesh:          mesh,
        light:         light,
        active:        false,
        origin:        new THREE.Vector3(),
        direction:     new THREE.Vector3(),
        distTravelled: 0,
        life:          0,
        color:         COLOR_DEFAULT,
      });
    }
  }

  // ── Internal: pick a free entry from pool ─────────────────────────────────
  function _acquireEntry() {
    for (var i = 0; i < _pool.length; i++) {
      if (!_pool[i].active) return _pool[i];
    }
    return null;  // pool exhausted — skip this tracer
  }

  // ── Internal: orient mesh so its local Y axis points along dir ───────────
  var _up     = new THREE.Vector3(0, 1, 0);
  var _quatTmp = new THREE.Quaternion();

  function _orientToDir(mesh, dir) {
    // quaternion that rotates Y+ to dir
    _quatTmp.setFromUnitVectors(_up, dir);
    mesh.quaternion.copy(_quatTmp);
  }

  // ── Internal: spawn one cylinder tracer ───────────────────────────────────
  function _spawnCylinder(origin, direction, color) {
    if (!_scene) return;
    _ensurePool();
    var entry = _acquireEntry();
    if (!entry) return;

    entry.active        = true;
    entry.distTravelled = 0;
    entry.life          = 0;
    entry.color         = color;

    entry.origin.copy(origin);
    entry.direction.copy(direction).normalize();

    // Position mesh 0.5 units forward of camera so it doesn't clip
    entry.mesh.position.copy(origin).addScaledVector(entry.direction, 0.5);
    entry.mesh.material.color.setHex(color);
    entry.mesh.visible = true;
    _orientToDir(entry.mesh, entry.direction);

    entry.light.color.setHex(color);
    entry.light.intensity = 2;
    entry.light.position.copy(entry.mesh.position);
    entry.light.visible = true;

    if (_scene) {
      _scene.add(entry.mesh);
      _scene.add(entry.light);
    }

    _active.push(entry);
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene) {
    _scene = scene;
    _ensurePool();
  }

  // ── Public: fireTracer ────────────────────────────────────────────────────
  // Called by game-manager (or _onShotForTracer hook) on every player shot.
  // weaponType: 'default' | 'sniper' | 'tracer' | string
  // Returns true if a tracer was actually spawned.
  function fireTracer(origin, direction, weaponType) {
    if (!window._tracerEnabled) return false;

    _playerShotN++;

    // Tracer-ammo attachment fires every shot; otherwise every Nth
    var freq = (weaponType === 'tracer') ? 1 : (window._tracerFrequency || 3);
    if (_playerShotN % freq !== 0) return false;

    var color;
    if (weaponType === 'tracer') {
      color = COLOR_TRACER;
    } else if (weaponType === 'sniper' || weaponType === 'AMR') {
      color = COLOR_SNIPER;
    } else {
      color = COLOR_DEFAULT;
    }

    _spawnCylinder(origin, direction, color);
    return true;
  }

  // ── Public: fireEnemyTracer ───────────────────────────────────────────────
  // Called when an enemy fires at the player; 40% chance to emit a tracer.
  function fireEnemyTracer(enemyPos, targetPos) {
    if (!window._tracerEnabled) return false;
    if (Math.random() >= 0.4) return false;  // 40% chance

    if (!_scene || !enemyPos || !targetPos) return false;
    _ensurePool();

    var dir = new THREE.Vector3(
      targetPos.x - enemyPos.x,
      targetPos.y - enemyPos.y,
      targetPos.z - enemyPos.z
    ).normalize();

    _spawnCylinder(enemyPos, dir, COLOR_ENEMY);
    return true;
  }

  // ── Public: update ────────────────────────────────────────────────────────
  // Call each frame with delta time in seconds.
  function update(delta) {
    for (var i = _active.length - 1; i >= 0; i--) {
      var e = _active[i];
      if (!e.active) { _active.splice(i, 1); continue; }

      var step = SPEED * delta;
      e.mesh.position.addScaledVector(e.direction, step);
      e.light.position.copy(e.mesh.position);
      e.distTravelled += step;
      e.life          += delta;

      var expired = (e.distTravelled >= MAX_RANGE || e.life >= MAX_LIFE);
      if (expired) {
        _releaseEntry(e);
        _active.splice(i, 1);
      }
    }
  }

  // ── Internal: return entry to pool ────────────────────────────────────────
  function _releaseEntry(entry) {
    entry.active = false;
    entry.mesh.visible = false;
    entry.light.visible = false;
    if (_scene) {
      _scene.remove(entry.mesh);
      _scene.remove(entry.light);
    }
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    for (var i = _active.length - 1; i >= 0; i--) {
      _releaseEntry(_active[i]);
    }
    _active.length  = 0;
    _playerShotN    = 0;
  }

  // ── Hook: _onShotForTracer ────────────────────────────────────────────────
  // game-manager.js can call window._onShotForTracer(origin, direction, weaponType)
  // on every shot to drive the every-Nth logic automatically.
  window._onShotForTracer = function(origin, direction, weaponType) {
    fireTracer(origin, direction, weaponType);
  };

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init:             init,
    fireTracer:       fireTracer,
    fireEnemyTracer:  fireEnemyTracer,
    update:           update,
    reset:            reset,
  };

}());
