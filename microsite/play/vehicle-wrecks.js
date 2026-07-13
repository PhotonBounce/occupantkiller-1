// ============================================================
//  vehicle-wrecks.js — Destroyed vehicle shells as cover objects
//  Public API: init(scene), spawnWrecks(scene, count), update(dt), reset()
// ============================================================
window.VehicleWrecks = (function() {
  'use strict';

  var _scene = null;
  var _wrecks = [];
  var _smokePool = [];
  var _smokePoolSize = 50;
  var _initialized = false;

  // Shared materials (reused across wrecks for performance)
  var _matHull = null;
  var _matSoot = null;
  var _matGlow = null;
  var _matSmoke = null;
  var _matWheel = null;
  var _matBarrel = null;

  var WRECK_TYPES = [
    { id: 'T72_WRECK',   w: 3.5, h: 1.5, d: 6.5, color: 0x3a3a2a, name: 'T-72 TANK WRECK',  hasTurret: true,  hasWheels: false },
    { id: 'BMP_WRECK',   w: 3.0, h: 1.4, d: 5.5, color: 0x2a3a2a, name: 'BMP-2 WRECK',       hasTurret: true,  hasWheels: false },
    { id: 'TRUCK_WRECK', w: 2.2, h: 2.0, d: 5.0, color: 0x3a2a1a, name: 'CARGO TRUCK',       hasTurret: false, hasWheels: true  },
    { id: 'BTR_WRECK',   w: 2.8, h: 1.6, d: 5.8, color: 0x2a3a2a, name: 'BTR-80 WRECK',      hasTurret: false, hasWheels: true  },
    { id: 'SEDAN_WRECK', w: 1.8, h: 1.2, d: 3.8, color: 0x1a1a1a, name: 'CIVILIAN CAR',      hasTurret: false, hasWheels: true  }
  ];

  // Wreck state ages
  var AGE_COOLING = 30;   // seconds — glow dies
  var AGE_OLD     = 120;  // seconds — fully cold

  // ─── Material helpers ───────────────────────────────────────

  function _ensureMaterials() {
    if (_matHull) return;
    _matHull  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    _matSoot  = new THREE.MeshLambertMaterial({ color: 0x0d0d0d, transparent: true, opacity: 0.85 });
    _matGlow  = new THREE.MeshLambertMaterial({ color: 0x331100, emissive: 0x110500 });
    _matSmoke = new THREE.MeshLambertMaterial({ color: 0x444444, transparent: true, opacity: 0.55, depthWrite: false });
    _matWheel = new THREE.MeshLambertMaterial({ color: 0x222222 });
    _matBarrel = new THREE.MeshLambertMaterial({ color: 0x333333 });
  }

  // ─── Smoke particle pool ────────────────────────────────────

  function _buildSmokePool() {
    var geo = new THREE.SphereGeometry(0.18, 5, 5);
    for (var i = 0; i < _smokePoolSize; i++) {
      var mesh = new THREE.Mesh(geo, _matSmoke.clone());
      mesh.visible = false;
      _smokePool.push({ mesh: mesh, active: false, age: 0, maxAge: 0, vx: 0, vy: 0, vz: 0 });
    }
  }

  function _acquireSmoke() {
    for (var i = 0; i < _smokePool.length; i++) {
      if (!_smokePool[i].active) return _smokePool[i];
    }
    return null;
  }

  function _emitSmokePuff(x, y, z) {
    if (!_scene) return;
    var count = 5 + Math.floor(Math.random() * 4); // 5-8
    for (var i = 0; i < count; i++) {
      var p = _acquireSmoke();
      if (!p) break;
      p.active = true;
      p.age = 0;
      p.maxAge = 2.5 + Math.random() * 0.5; // 2.5-3s
      p.vx = (Math.random() - 0.5) * 0.3;
      p.vy = 0.6 + Math.random() * 0.4;
      p.vz = (Math.random() - 0.5) * 0.3;
      p.mesh.position.set(
        x + (Math.random() - 0.5) * 0.6,
        y + 0.5 + Math.random() * 0.4,
        z + (Math.random() - 0.5) * 0.6
      );
      p.mesh.material.opacity = 0.55;
      p.mesh.visible = true;
      if (!p.mesh.parent) _scene.add(p.mesh);
    }
  }

  // ─── Wreck mesh builder ─────────────────────────────────────

  function _buildWreck(type) {
    var w = type.w, h = type.h, d = type.d;
    var group = new THREE.Group();

    // Hull — main charred box
    var hullGeo = new THREE.BoxGeometry(w, h, d);
    var hull = new THREE.Mesh(hullGeo, _matHull);
    hull.position.y = h * 0.5;
    group.add(hull);

    // Burnt soot patch on top
    var sootGeo = new THREE.BoxGeometry(w * 0.8, 0.05, d * 0.7);
    var soot = new THREE.Mesh(sootGeo, _matSoot);
    soot.position.y = h + 0.01;
    group.add(soot);

    // Scorched underside detail
    var underGeo = new THREE.BoxGeometry(w * 0.9, 0.08, d * 0.9);
    var under = new THREE.Mesh(underGeo, _matSoot);
    under.position.y = 0.02;
    group.add(under);

    // Turret for tanks
    if (type.hasTurret) {
      var tw = w * 0.6, th = h * 0.4, td = d * 0.5;
      var turretGeo = new THREE.BoxGeometry(tw, th, td);
      var turret = new THREE.Mesh(turretGeo, _matHull);
      // Random rotational offset — blown-off turret look
      var turretAngle = (Math.random() - 0.5) * 1.2;
      turret.position.set(
        (Math.random() - 0.5) * w * 0.2,
        h + th * 0.5,
        (Math.random() - 0.5) * d * 0.1
      );
      turret.rotation.y = turretAngle;
      group.add(turret);

      // Gun barrel — thin box at random droop angle
      var barrelGeo = new THREE.BoxGeometry(0.15, 0.15, d * 0.65);
      var barrel = new THREE.Mesh(barrelGeo, _matBarrel);
      barrel.position.set(0, 0, td * 0.5);
      barrel.rotation.x = (Math.random() * 0.4); // droop downward
      turret.add(barrel);
    }

    // Wheels for wheeled vehicles (cylinder pairs)
    if (type.hasWheels) {
      var wheelCount = (type.id === 'SEDAN_WRECK') ? 2 : 3;
      var wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.22, 10);
      for (var wi = 0; wi < wheelCount; wi++) {
        var zOff = -d * 0.35 + (d * 0.7 / (wheelCount - 1)) * wi;
        // Left wheel
        var wL = new THREE.Mesh(wheelGeo, _matWheel);
        wL.rotation.z = Math.PI * 0.5;
        wL.position.set(-w * 0.52, 0.38, zOff);
        group.add(wL);
        // Right wheel
        var wR = new THREE.Mesh(wheelGeo, _matWheel);
        wR.rotation.z = Math.PI * 0.5;
        wR.position.set( w * 0.52, 0.38, zOff);
        group.add(wR);
      }
    }

    // Burning remnant point light (orange glow inside hull)
    var fireLight = new THREE.PointLight(0xFF6600, 0.5, 3);
    fireLight.position.set(0, h * 0.6, 0);
    group.add(fireLight);

    return { group: group, fireLight: fireLight };
  }

  // ─── Cover proximity label ──────────────────────────────────

  var _coverLabelEl = null;

  function _ensureCoverLabel() {
    if (_coverLabelEl) return;
    _coverLabelEl = document.createElement('div');
    _coverLabelEl.id = 'wreck-cover-label';
    _coverLabelEl.textContent = '[COVER POSITION]';
    _coverLabelEl.style.cssText = [
      'position:fixed',
      'bottom:28%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#88cc88',
      'font-family:monospace',
      'font-size:11px',
      'letter-spacing:2px',
      'pointer-events:none',
      'display:none',
      'z-index:200',
      'text-shadow:0 0 6px #003300'
    ].join(';');
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(_coverLabelEl);
    }
  }

  function _showCoverLabel(show) {
    if (_coverLabelEl) _coverLabelEl.style.display = show ? 'block' : 'none';
  }

  // ─── Public: init ───────────────────────────────────────────

  function init(scene) {
    _scene = scene || _scene;
    _ensureMaterials();
    _buildSmokePool();
    if (typeof document !== 'undefined') _ensureCoverLabel();
    window._wreckPositions = [];
    _initialized = true;
  }

  // ─── Public: spawnWrecks ────────────────────────────────────

  function spawnWrecks(scene, count) {
    if (scene) _scene = scene;
    if (!_initialized) init(_scene);

    reset();

    var spawnCount = count || (3 + Math.floor(Math.random() * 4)); // 3-6

    for (var i = 0; i < spawnCount; i++) {
      var type = WRECK_TYPES[Math.floor(Math.random() * WRECK_TYPES.length)];
      var built = _buildWreck(type);
      var group = built.group;
      var fireLight = built.fireLight;

      // Random position: ±30 units, min 5 from center
      var px, pz, dist;
      var attempts = 0;
      do {
        px = (Math.random() - 0.5) * 60;
        pz = (Math.random() - 0.5) * 60;
        dist = Math.sqrt(px * px + pz * pz);
        attempts++;
      } while (dist < 5 && attempts < 20);

      // Terrain height check
      var py = 0;
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
        py = VoxelWorld.getTerrainHeight(px, pz) || 0;
      }

      // Place at ground level
      group.position.set(px, py, pz);

      // Random yaw rotation
      group.rotation.y = Math.random() * Math.PI * 2;

      // Slight lean
      group.rotation.z = (Math.random() - 0.5) * 0.3;

      if (_scene) _scene.add(group);

      var wreck = {
        type: type,
        group: group,
        fireLight: fireLight,
        x: px, y: py, z: pz,
        age: 0,
        state: 'fresh',         // 'fresh' | 'cooling' | 'old'
        smokeTimer: 0,
        smokeInterval: 1.2 + Math.random() * 0.8
      };

      _wrecks.push(wreck);

      // Register cover position for AI
      if (!window._wreckPositions) window._wreckPositions = [];
      window._wreckPositions.push({ x: px, y: py, z: pz, type: type.id });
    }
  }

  // ─── Public: update ─────────────────────────────────────────

  function update(dt) {
    if (!_initialized) return;

    // Update smoke pool particles
    for (var pi = 0; pi < _smokePool.length; pi++) {
      var p = _smokePool[pi];
      if (!p.active) continue;
      p.age += dt;
      var frac = p.age / p.maxAge;
      if (frac >= 1.0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      // Rise and drift
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      // Expand
      var scale = 1.0 + frac * 2.5;
      p.mesh.scale.setScalar(scale);
      // Fade out
      p.mesh.material.opacity = 0.55 * (1.0 - frac);
    }

    // Update each wreck
    var playerPos = null;
    if (typeof window !== 'undefined' && window._playerPos) {
      playerPos = window._playerPos;
    }

    var nearCover = false;

    for (var i = 0; i < _wrecks.length; i++) {
      var wreck = _wrecks[i];
      wreck.age += dt;

      // Advance state
      if (wreck.state === 'fresh' && wreck.age > AGE_COOLING) {
        wreck.state = 'cooling';
        if (wreck.fireLight) wreck.fireLight.intensity = 0;
      } else if (wreck.state === 'cooling' && wreck.age > AGE_OLD) {
        wreck.state = 'old';
      }

      // Fire flicker for fresh wrecks
      if (wreck.state === 'fresh' && wreck.fireLight) {
        wreck.fireLight.intensity = 0.3 + Math.random() * 0.4;
      }

      // Smoke emission for fresh wrecks
      if (wreck.state === 'fresh') {
        wreck.smokeTimer += dt;
        if (wreck.smokeTimer >= wreck.smokeInterval) {
          wreck.smokeTimer = 0;
          _emitSmokePuff(wreck.x, wreck.y + wreck.type.h, wreck.z);
        }
      }

      // Cover proximity check
      if (playerPos) {
        var dx = playerPos.x - wreck.x;
        var dz = playerPos.z - wreck.z;
        var dist2 = dx * dx + dz * dz;
        if (dist2 < 1.5 * 1.5) nearCover = true;
      }
    }

    _showCoverLabel(nearCover);
  }

  // ─── Public: reset ──────────────────────────────────────────

  function reset() {
    // Remove wreck meshes from scene
    for (var i = 0; i < _wrecks.length; i++) {
      if (_scene && _wrecks[i].group) {
        _scene.remove(_wrecks[i].group);
      }
    }
    _wrecks = [];

    // Return smoke particles to pool
    for (var pi = 0; pi < _smokePool.length; pi++) {
      var p = _smokePool[pi];
      if (p.active) {
        p.active = false;
        p.mesh.visible = false;
      }
    }

    window._wreckPositions = [];
  }

  return {
    init: init,
    spawnWrecks: spawnWrecks,
    update: update,
    reset: reset
  };
})();
