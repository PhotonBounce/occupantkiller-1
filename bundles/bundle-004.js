/* === vehicle-wrecks.js === */
try {
;
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
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail vehicle-wrecks.js",_e&&_e.message); }
/* === vehicle-wreck.js === */
try {
;
// ============================================================
//  vehicle-wreck.js — Burned vehicle wrecks as FPS cover objects
//  Public API: init, update, spawn, populateLevel, reset
// ============================================================
window.VehicleWreck = (function() {
  'use strict';

  // ─── Internal state ────────────────────────────────────────
  var _wrecks = [];
  var _smokeParticles = [];
  var _debrisParticles = [];
  var _initialized = false;
  var _clock = 0;

  // Shared materials (lazy-init when THREE is available)
  var _matCharred = null;
  var _matSmoke = null;
  var _matDebris = null;
  var _matWheel = null;
  var _matFlame = null;
  var _matBarrel = null;
  var _matTurret = null;
  var _matAmmo = null;

  // ─── Constants ─────────────────────────────────────────────
  var SMOKE_DRIFT_SPEED = 0.3;       // units/s upward
  var SMOKE_LIFE = 4.0;              // seconds per puff
  var SMOKE_RESPAWN_INTERVAL = 0.8;  // seconds between new puffs per emitter
  var EXPLOSION_DAMAGE_THRESHOLD = 200;
  var DEBRIS_SPEED = 10;             // m/s initial velocity
  var DEBRIS_COUNT = 15;
  var FLAME_FLICKER_DURATION = 5.0;  // seconds
  var MIN_DIST_FROM_SPAWN = 5.0;     // metres

  // ─── Material helpers ──────────────────────────────────────

  function _ensureMaterials() {
    if (_matCharred) return;
    _matCharred = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    _matSmoke   = new THREE.MeshLambertMaterial({ color: 0x888888, transparent: true, opacity: 0.55, depthWrite: false });
    _matDebris  = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    _matWheel   = new THREE.MeshLambertMaterial({ color: 0x111111 });
    _matFlame   = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0x441100 });
    _matBarrel  = new THREE.MeshLambertMaterial({ color: 0x222222 });
    _matTurret  = new THREE.MeshLambertMaterial({ color: 0x151515 });
    _matAmmo    = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
  }

  // ─── Mesh builders ────────────────────────────────────────

  function _buildCar(group) {
    // Main body
    var bodyGeo = new THREE.BoxGeometry(3.5, 1.2, 1.8);
    var body = new THREE.Mesh(bodyGeo, _matCharred);
    body.position.set(0, 0.6, 0);
    group.add(body);

    // Cabin (slightly raised, narrower)
    var cabinGeo = new THREE.BoxGeometry(2.0, 0.8, 1.6);
    var cabin = new THREE.Mesh(cabinGeo, _matCharred);
    cabin.position.set(0, 1.4, 0);
    // Crush the cabin to simulate wreck
    cabin.scale.y = 0.7;
    group.add(cabin);

    // 4 wheel wells (Cylinder)
    var wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 10);
    var offsets = [
      [1.35, 0.25,  0.95],
      [1.35, 0.25, -0.95],
      [-1.35, 0.25,  0.95],
      [-1.35, 0.25, -0.95]
    ];
    for (var i = 0; i < offsets.length; i++) {
      var wheel = new THREE.Mesh(wheelGeo, _matWheel);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(offsets[i][0], offsets[i][1], offsets[i][2]);
      group.add(wheel);
    }

    return { body: body, cabin: cabin };
  }

  function _buildTruck(group) {
    // Long cab
    var cabGeo = new THREE.BoxGeometry(5.0, 1.5, 2.2);
    var cab = new THREE.Mesh(cabGeo, _matCharred);
    cab.position.set(0, 0.75, 0);
    group.add(cab);

    // Bed (flat platform behind cab)
    var bedGeo = new THREE.BoxGeometry(4.0, 0.5, 2.0);
    var bed = new THREE.Mesh(bedGeo, _matCharred);
    bed.position.set(-3.0, 0.45, 0);
    group.add(bed);

    // Cab front / cabin top
    var cabinGeo = new THREE.BoxGeometry(2.2, 1.0, 2.0);
    var cabin = new THREE.Mesh(cabinGeo, _matCharred);
    cabin.position.set(1.8, 1.75, 0);
    cabin.scale.y = 0.7;
    group.add(cabin);

    // Exhaust pipes (2x)
    var pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 6);
    var pipe1 = new THREE.Mesh(pipeGeo, _matBarrel);
    pipe1.position.set(1.5, 1.85, 0.9);
    group.add(pipe1);
    var pipe2 = new THREE.Mesh(pipeGeo, _matBarrel);
    pipe2.position.set(1.5, 1.85, -0.9);
    group.add(pipe2);

    // Wheels (6 — dual rear)
    var wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.25, 10);
    var wheelPos = [
      [ 2.0, 0.35,  1.15], [ 2.0, 0.35, -1.15],
      [-1.0, 0.35,  1.15], [-1.0, 0.35, -1.15],
      [-2.8, 0.35,  1.15], [-2.8, 0.35, -1.15]
    ];
    for (var j = 0; j < wheelPos.length; j++) {
      var whl = new THREE.Mesh(wheelGeo, _matWheel);
      whl.rotation.z = Math.PI / 2;
      whl.position.set(wheelPos[j][0], wheelPos[j][1], wheelPos[j][2]);
      group.add(whl);
    }

    return { body: cab, cabin: cabin };
  }

  function _buildAPC(group) {
    // Box hull
    var hullGeo = new THREE.BoxGeometry(4.5, 1.8, 2.5);
    var hull = new THREE.Mesh(hullGeo, _matCharred);
    hull.position.set(0, 0.9, 0);
    group.add(hull);

    // Sloped front (wedge approximated with a squashed, angled box)
    var frontGeo = new THREE.BoxGeometry(1.2, 1.2, 2.5);
    var front = new THREE.Mesh(frontGeo, _matCharred);
    front.position.set(2.4, 1.1, 0);
    front.rotation.z = -0.3;
    group.add(front);

    // Turret stub (Cylinder)
    var turretBaseGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.5, 10);
    var turretBase = new THREE.Mesh(turretBaseGeo, _matTurret);
    turretBase.position.set(0.3, 2.05, 0);
    group.add(turretBase);

    var turretTopGeo = new THREE.CylinderGeometry(0.5, 0.7, 0.45, 10);
    var turretTop = new THREE.Mesh(turretTopGeo, _matTurret);
    turretTop.position.set(0.3, 2.5, 0);
    group.add(turretTop);

    // Short gun barrel stub
    var barrelGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.4, 6);
    var barrel = new THREE.Mesh(barrelGeo, _matBarrel);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(1.1, 2.45, 0);
    group.add(barrel);

    return { body: hull, cabin: turretTop };
  }

  function _buildTank(group) {
    // Heavy box hull
    var hullGeo = new THREE.BoxGeometry(5.0, 1.5, 2.8);
    var hull = new THREE.Mesh(hullGeo, _matCharred);
    hull.position.set(0, 0.75, 0);
    group.add(hull);

    // Track skirts (low flat boxes on sides)
    var skirtGeoL = new THREE.BoxGeometry(5.2, 0.25, 0.3);
    var skirtL = new THREE.Mesh(skirtGeoL, _matCharred);
    skirtL.position.set(0, 0.12, 1.55);
    group.add(skirtL);
    var skirtR = skirtL.clone();
    skirtR.position.set(0, 0.12, -1.55);
    group.add(skirtR);

    // Turret body (Cylinder)
    var turretGeo = new THREE.CylinderGeometry(1.0, 1.1, 0.7, 12);
    var turret = new THREE.Mesh(turretGeo, _matTurret);
    turret.position.set(0.3, 1.85, 0);
    group.add(turret);

    // Turret top dome
    var domeGeo = new THREE.CylinderGeometry(0.7, 1.0, 0.45, 12);
    var dome = new THREE.Mesh(domeGeo, _matTurret);
    dome.position.set(0.3, 2.52, 0);
    dome.scale.y = 0.7;
    group.add(dome);

    // Long barrel
    var barrelGeo = new THREE.CylinderGeometry(0.09, 0.12, 3.8, 8);
    var barrel = new THREE.Mesh(barrelGeo, _matBarrel);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(2.4, 2.05, 0);
    group.add(barrel);

    // Barrel tip (slight muzzle)
    var muzzleGeo = new THREE.CylinderGeometry(0.13, 0.09, 0.3, 8);
    var muzzle = new THREE.Mesh(muzzleGeo, _matBarrel);
    muzzle.rotation.z = Math.PI / 2;
    muzzle.position.set(4.35, 2.05, 0);
    group.add(muzzle);

    return { body: hull, cabin: dome };
  }

  // ─── Smoke emitter helpers ─────────────────────────────────

  function _createSmokeParticle(scene, x, y, z) {
    var geo = new THREE.SphereGeometry(0.3, 5, 5);
    var mat = new THREE.MeshBasicMaterial({
      color: (Math.random() > 0.5) ? 0xaaaaaa : 0x888888,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    var particle = {
      mesh: mesh,
      age: 0,
      maxAge: SMOKE_LIFE,
      vx: (Math.random() - 0.5) * 0.15,
      vy: SMOKE_DRIFT_SPEED,
      vz: (Math.random() - 0.5) * 0.15,
      active: true
    };
    _smokeParticles.push(particle);
    return particle;
  }

  function _addSmokeEmitters(scene, wreck) {
    // 2-3 random smoke origins on the wreck mesh
    var numEmitters = 2 + Math.floor(Math.random() * 2);
    var hw = wreck.dims.w / 2;
    var hd = wreck.dims.d / 2;
    for (var i = 0; i < numEmitters; i++) {
      wreck.smokeEmitters.push({
        x: wreck.group.position.x + (Math.random() - 0.5) * hw,
        y: wreck.group.position.y + wreck.dims.h,
        z: wreck.group.position.z + (Math.random() - 0.5) * hd,
        timer: Math.random() * SMOKE_RESPAWN_INTERVAL  // stagger start
      });
    }
  }

  // ─── Collision / cover ────────────────────────────────────

  function _registerCoverObject(wreck) {
    if (!window._coverObjects) { window._coverObjects = []; }
    var hx = wreck.dims.w / 2;
    var hy = wreck.dims.h;
    var hz = wreck.dims.d / 2;
    var px = wreck.group.position.x;
    var py = wreck.group.position.y;
    var pz = wreck.group.position.z;
    var aabb = {
      min: new THREE.Vector3(px - hx, py,      pz - hz),
      max: new THREE.Vector3(px + hx, py + hy, pz + hz),
      meshes: wreck.meshes,
      penetrable: false   // standard bullets stopped; heavy enemies override
    };
    wreck.aabb = aabb;
    window._coverObjects.push(aabb);
  }

  // ─── Loot spawn ───────────────────────────────────────────

  function _spawnAmmoBox(scene, x, y, z) {
    var geo = new THREE.BoxGeometry(0.4, 0.25, 0.3);
    var mesh = new THREE.Mesh(geo, _matAmmo);
    mesh.position.set(x, y + 0.13, z);
    scene.add(mesh);
    // Register as a pickable if the pickup system is available
    if (window._pickupObjects) {
      window._pickupObjects.push({
        mesh: mesh,
        type: 'ammo',
        amount: 30 + Math.floor(Math.random() * 30)
      });
    }
    return mesh;
  }

  // ─── Secondary explosion ──────────────────────────────────

  function _triggerSecondaryExplosion(scene, wreck) {
    if (wreck.exploded) return;
    wreck.exploded = true;

    var px = wreck.group.position.x;
    var py = wreck.group.position.y + wreck.dims.h * 0.5;
    var pz = wreck.group.position.z;

    // PointLight flash (white, brief)
    var flashLight = new THREE.PointLight(0xffffff, 8, 18);
    flashLight.position.set(px, py + 1, pz);
    scene.add(flashLight);
    wreck.flashLight = flashLight;
    wreck.flashTimer = 0.15; // 150 ms flash

    // Debris particles
    var debrisGeo = new THREE.BoxGeometry(0.18, 0.12, 0.08);
    for (var i = 0; i < DEBRIS_COUNT; i++) {
      var mat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      var mesh = new THREE.Mesh(debrisGeo, mat);
      mesh.position.set(px, py, pz);
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.random() * Math.PI;
      var speed = DEBRIS_SPEED * (0.5 + Math.random() * 0.5);
      scene.add(mesh);
      _debrisParticles.push({
        mesh: mesh,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.abs(Math.cos(phi)) * speed + 3,
        vz: Math.sin(phi) * Math.sin(theta) * speed,
        age: 0,
        maxAge: 2.5,
        scene: scene,
        active: true
      });
    }

    // Persistent flame light (orange, flickers for 5 s)
    var flameLight = new THREE.PointLight(0xff6600, 3, 10);
    flameLight.position.set(px, py + 0.5, pz);
    scene.add(flameLight);
    wreck.flameLight = flameLight;
    wreck.flameLightTimer = FLAME_FLICKER_DURATION;

    // 30% loot chance
    if (wreck.hasLoot) {
      _spawnAmmoBox(scene, px, wreck.group.position.y, pz);
    }

    // Audio
    if (window.AudioSystem && typeof window.AudioSystem.playExplosion === 'function') {
      window.AudioSystem.playExplosion();
    }
  }

  // ─── Spawn ────────────────────────────────────────────────

  function spawn(scene, x, y, z, type) {
    _ensureMaterials();

    var group = new THREE.Group();
    group.position.set(x, y, z);

    var dims = { w: 3.5, h: 1.5, d: 1.8 };
    var meshes = [];
    var parts;

    var t = (type || 'CAR').toUpperCase();

    if (t === 'CAR') {
      dims = { w: 3.5, h: 2.2, d: 1.8 };
      parts = _buildCar(group);
    } else if (t === 'TRUCK') {
      dims = { w: 7.5, h: 2.8, d: 2.2 };
      parts = _buildTruck(group);
    } else if (t === 'APC') {
      dims = { w: 5.8, h: 2.8, d: 2.5 };
      parts = _buildAPC(group);
    } else if (t === 'TANK') {
      dims = { w: 5.0, h: 2.7, d: 2.8 };
      parts = _buildTank(group);
    } else {
      dims = { w: 3.5, h: 2.2, d: 1.8 };
      parts = _buildCar(group);
    }

    // Collect all meshes in group for raycasting
    group.traverse(function(child) {
      if (child.isMesh) { meshes.push(child); }
    });

    // Burn state: random tilt
    group.rotation.z = (Math.random() - 0.5) * 0.30;  // ±0.15 rad
    group.rotation.y = Math.random() * Math.PI * 2;    // random facing

    // Crush random part
    if (parts && parts.cabin) {
      parts.cabin.scale.y = 0.65 + Math.random() * 0.1;  // 0.65–0.75
    }

    scene.add(group);

    var wreck = {
      group: group,
      meshes: meshes,
      dims: dims,
      type: t,
      hp: 200,
      exploded: false,
      hasLoot: (Math.random() < 0.30),
      smokeEmitters: [],
      flashLight: null,
      flashTimer: 0,
      flameLight: null,
      flameLightTimer: 0,
      aabb: null
    };

    _addSmokeEmitters(scene, wreck);
    _registerCoverObject(wreck);
    _wrecks.push(wreck);
    return wreck;
  }

  // ─── populateLevel ────────────────────────────────────────

  function populateLevel(scene, count) {
    var n = count || 6;
    var types = ['CAR', 'TRUCK', 'APC', 'TANK'];
    var range = 40;
    for (var i = 0; i < n; i++) {
      var attempts = 0;
      var px, pz;
      do {
        px = (Math.random() - 0.5) * range * 2;
        pz = (Math.random() - 0.5) * range * 2;
        attempts++;
      } while (Math.sqrt(px * px + pz * pz) < MIN_DIST_FROM_SPAWN && attempts < 20);
      var t = types[Math.floor(Math.random() * types.length)];
      spawn(scene, px, 0, pz, t);
    }
  }

  // ─── Bullet / hit registration ────────────────────────────

  function registerHit(wreck, damage, heavy) {
    if (wreck.exploded) return;
    // Heavy enemies penetrate; normal bullets are stopped
    if (!heavy && wreck.hp > 0) {
      // bullet is stopped — caller should treat this as a cover block
      return true;  // true = blocked
    }
    wreck.hp -= (damage || 50);
    if (wreck.hp <= 0 && !wreck.exploded) {
      _triggerSecondaryExplosion(wreck.group.parent || window._scene, wreck);
    }
    return false;  // penetrated (heavy enemy)
  }

  // ─── Update ───────────────────────────────────────────────

  function update(dt) {
    if (!dt || dt <= 0) return;
    _clock += dt;

    // ── Smoke emitters ───
    for (var wi = 0; wi < _wrecks.length; wi++) {
      var wreck = _wrecks[wi];
      var emitters = wreck.smokeEmitters;
      for (var ei = 0; ei < emitters.length; ei++) {
        var em = emitters[ei];
        em.timer -= dt;
        if (em.timer <= 0) {
          em.timer = SMOKE_RESPAWN_INTERVAL + Math.random() * 0.4;
          // find which scene to use
          var sc = wreck.group.parent;
          if (sc) {
            _createSmokeParticle(sc, em.x, em.y, em.z);
          }
        }
      }

      // Flash light (brief white flash after explosion)
      if (wreck.flashLight && wreck.flashTimer > 0) {
        wreck.flashTimer -= dt;
        if (wreck.flashTimer <= 0) {
          if (wreck.flashLight.parent) {
            wreck.flashLight.parent.remove(wreck.flashLight);
          }
          wreck.flashLight = null;
        }
      }

      // Flame light flicker
      if (wreck.flameLight && wreck.flameLightTimer > 0) {
        wreck.flameLightTimer -= dt;
        wreck.flameLight.intensity = 2.5 + Math.sin(_clock * 12) * 0.8 + Math.random() * 0.5;
        if (wreck.flameLightTimer <= 0) {
          if (wreck.flameLight.parent) {
            wreck.flameLight.parent.remove(wreck.flameLight);
          }
          wreck.flameLight = null;
        }
      }
    }

    // ── Smoke particles ───
    for (var si = _smokeParticles.length - 1; si >= 0; si--) {
      var p = _smokeParticles[si];
      if (!p.active) continue;
      p.age += dt;
      var frac = p.age / p.maxAge;
      if (frac >= 1.0) {
        if (p.mesh.parent) { p.mesh.parent.remove(p.mesh); }
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _smokeParticles.splice(si, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      // Grow and fade
      var scale = 1.0 + frac * 2.5;
      p.mesh.scale.set(scale, scale, scale);
      p.mesh.material.opacity = 0.55 * (1.0 - frac);
    }

    // ── Debris particles ───
    for (var di = _debrisParticles.length - 1; di >= 0; di--) {
      var d = _debrisParticles[di];
      if (!d.active) continue;
      d.age += dt;
      if (d.age >= d.maxAge) {
        if (d.mesh.parent) { d.mesh.parent.remove(d.mesh); }
        d.mesh.geometry.dispose();
        d.mesh.material.dispose();
        _debrisParticles.splice(di, 1);
        continue;
      }
      d.vy -= 9.8 * dt;  // gravity
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      // Tumble
      d.mesh.rotation.x += d.vx * dt * 0.5;
      d.mesh.rotation.z += d.vz * dt * 0.5;
      // Stop at ground
      if (d.mesh.position.y < 0) {
        d.mesh.position.y = 0;
        d.vy = 0;
        d.vx *= 0.5;
        d.vz *= 0.5;
      }
    }
  }

  // ─── Init ─────────────────────────────────────────────────

  function init() {
    if (_initialized) return;
    _initialized = true;
    if (!window._coverObjects) { window._coverObjects = []; }
    if (!window._pickupObjects) { window._pickupObjects = []; }
  }

  // ─── Reset ────────────────────────────────────────────────

  function reset() {
    // Remove all wreck groups from their scenes
    for (var wi = 0; wi < _wrecks.length; wi++) {
      var wreck = _wrecks[wi];
      if (wreck.group.parent) {
        wreck.group.parent.remove(wreck.group);
      }
      if (wreck.flashLight && wreck.flashLight.parent) {
        wreck.flashLight.parent.remove(wreck.flashLight);
      }
      if (wreck.flameLight && wreck.flameLight.parent) {
        wreck.flameLight.parent.remove(wreck.flameLight);
      }
      // Remove AABB from cover system
      if (window._coverObjects && wreck.aabb) {
        var idx = window._coverObjects.indexOf(wreck.aabb);
        if (idx !== -1) { window._coverObjects.splice(idx, 1); }
      }
    }
    _wrecks = [];

    // Clean up smoke
    for (var si = 0; si < _smokeParticles.length; si++) {
      var sp = _smokeParticles[si];
      if (sp.mesh.parent) { sp.mesh.parent.remove(sp.mesh); }
      sp.mesh.geometry.dispose();
      sp.mesh.material.dispose();
    }
    _smokeParticles = [];

    // Clean up debris
    for (var di = 0; di < _debrisParticles.length; di++) {
      var dp = _debrisParticles[di];
      if (dp.mesh.parent) { dp.mesh.parent.remove(dp.mesh); }
      dp.mesh.geometry.dispose();
      dp.mesh.material.dispose();
    }
    _debrisParticles = [];

    _clock = 0;
    _initialized = false;

    // Dispose shared materials
    if (_matCharred) { _matCharred.dispose(); _matCharred = null; }
    if (_matSmoke)   { _matSmoke.dispose();   _matSmoke   = null; }
    if (_matDebris)  { _matDebris.dispose();  _matDebris  = null; }
    if (_matWheel)   { _matWheel.dispose();   _matWheel   = null; }
    if (_matFlame)   { _matFlame.dispose();   _matFlame   = null; }
    if (_matBarrel)  { _matBarrel.dispose();  _matBarrel  = null; }
    if (_matTurret)  { _matTurret.dispose();  _matTurret  = null; }
    if (_matAmmo)    { _matAmmo.dispose();    _matAmmo    = null; }
  }

  // ─── Public API ───────────────────────────────────────────
  return {
    init: init,
    update: update,
    spawn: spawn,
    populateLevel: populateLevel,
    reset: reset,
    registerHit: registerHit
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail vehicle-wreck.js",_e&&_e.message); }
/* === helicopter-extraction.js === */
try {
;
/* ─────────────────────────────────────────────────────────────────────────────
   HELICOPTER EXTRACTION — dramatic end-of-wave extraction event
   Phases: Inbound (10s) → Hovering (5s) → Extraction (3s / 8s timeout)
   Fallback: auto-trigger mission complete after 18s total.
   ───────────────────────────────────────────────────────────────────────────── */
window.HelicopterExtraction = (function () {
  'use strict';

  /* ── State ──────────────────────────────────────────────────────────────── */
  var _scene = null;
  var _camera = null;
  var _active = false;
  var _phase = 0; // 0=idle, 1=inbound, 2=hovering, 3=extraction
  var _phaseTimer = 0;
  var _totalTimer = 0;
  var _extractionTriggered = false;
  var _missionCompleteTriggered = false;

  /* ── Helicopter group and parts ─────────────────────────────────────────── */
  var _heliGroup = null;
  var _rotorTop = null;
  var _rotorTail = null;
  var _searchLight = null;
  var _searchLightTarget = null;

  /* ── VFX ────────────────────────────────────────────────────────────────── */
  var _dustParticles = [];
  var _smokeGrenade = null;
  var _lzRing = null;

  /* ── HUD elements ───────────────────────────────────────────────────────── */
  var _hudMsg = null;
  var _lzDistEl = null;
  var _flashInterval = null;

  /* ── Audio ──────────────────────────────────────────────────────────────── */
  var _rotorSource = null;

  /* ────────────────────────────────────────────────────────────────────────
     PUBLIC API
   ──────────────────────────────────────────────────────────────────────── */

  function init(scene, camera) {
    _scene = scene;
    _camera = camera || (window.GameManager && window.GameManager.getCamera && window.GameManager.getCamera()) || null;
    reset();
  }

  function trigger(opts) {
    if (_active) return;
    _active = true;
    _phase = 1;
    _phaseTimer = 0;
    _totalTimer = 0;
    _extractionTriggered = false;
    _missionCompleteTriggered = false;

    _buildHelicopter();
    _buildLZRing();
    _buildHUD();
    _startPhaseInbound();
  }

  function update(dt) {
    if (!_active) return;

    _totalTimer += dt;
    _phaseTimer += dt;

    // Animate rotors
    if (_rotorTop) _rotorTop.rotation.y += dt * 18;
    if (_rotorTail) _rotorTail.rotation.x += dt * 22;

    // Animate search light sweep
    if (_searchLight && _heliGroup) {
      var sweep = Math.sin(_totalTimer * 0.8) * 6;
      _searchLight.target.position.set(sweep, 0, 2);
      _searchLight.target.updateMatrixWorld();
    }

    // Per-phase update
    if (_phase === 1) _updateInbound(dt);
    else if (_phase === 2) _updateHovering(dt);
    else if (_phase === 3) _updateExtraction(dt);

    // Update LZ distance in HUD
    _updateLZDistance();

    // Fallback: 18s total → force mission complete
    if (_totalTimer >= 18 && !_missionCompleteTriggered) {
      _forceMissionComplete('auto-fallback');
    }
  }

  function reset() {
    _active = false;
    _phase = 0;
    _phaseTimer = 0;
    _totalTimer = 0;
    _extractionTriggered = false;
    _missionCompleteTriggered = false;

    // Remove helicopter from scene
    if (_heliGroup && _scene) {
      _scene.remove(_heliGroup);
    }
    _heliGroup = null;
    _rotorTop = null;
    _rotorTail = null;

    // Remove search light
    if (_searchLight && _scene) {
      _scene.remove(_searchLight);
      _scene.remove(_searchLight.target);
    }
    _searchLight = null;
    _searchLightTarget = null;

    // Remove dust particles
    for (var i = 0; i < _dustParticles.length; i++) {
      if (_dustParticles[i] && _scene) _scene.remove(_dustParticles[i]);
    }
    _dustParticles = [];

    // Remove smoke grenade
    if (_smokeGrenade && _scene) _scene.remove(_smokeGrenade);
    _smokeGrenade = null;

    // Remove LZ ring
    if (_lzRing && _scene) _scene.remove(_lzRing);
    _lzRing = null;

    // Remove HUD
    _removeHUD();

    // Stop rotor audio
    _stopRotorSound();
  }

  /* ────────────────────────────────────────────────────────────────────────
     PHASE 1: INBOUND (10s)
   ──────────────────────────────────────────────────────────────────────── */

  function _startPhaseInbound() {
    // Play helicopter sound
    if (window.AudioSystem && window.AudioSystem.playHelicopterRotor) {
      window.AudioSystem.playHelicopterRotor();
    } else {
      _playRotorDrone();
    }

    // Radio crackle on approach
    if (window.AudioSystem && window.AudioSystem.playRadioChatter) {
      window.AudioSystem.playRadioChatter();
    }

    // HUD message
    _showHUDMessage('🚁 EXTRACTION INBOUND — 10s', '#00ff44', true);

    // Position helicopter at start: X=80, Y=20, Z=0
    if (_heliGroup) {
      _heliGroup.position.set(80, 20, 0);
    }
  }

  function _updateInbound(dt) {
    var progress = Math.min(_phaseTimer / 10, 1);

    // Fly from (80, 20, 0) toward (0, 8, 0) linearly
    if (_heliGroup) {
      _heliGroup.position.x = 80 * (1 - progress);
      _heliGroup.position.y = 20 + (8 - 20) * progress; // 20 → 8
      _heliGroup.position.z = 0;

      // Tilt forward during approach
      _heliGroup.rotation.z = -0.15 * (1 - progress);
    }

    // Update countdown in HUD
    var remaining = Math.max(0, Math.ceil(10 - _phaseTimer));
    _updateHUDText('🚁 EXTRACTION INBOUND — ' + remaining + 's');

    // Phase transition
    if (_phaseTimer >= 10) {
      _phase = 2;
      _phaseTimer = 0;
      _startPhaseHovering();
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     PHASE 2: HOVERING (5s)
   ──────────────────────────────────────────────────────────────────────── */

  function _startPhaseHovering() {
    _showHUDMessage('🚁 EXTRACT NOW — RUN TO LZ', '#00ff44', true);

    // Show LZ ring on ground
    if (_lzRing) _lzRing.visible = true;

    // Build rotor wash dust particles
    _buildDustParticles();

    // Drop green smoke grenade
    _dropSmokeGrenade();
  }

  function _updateHovering(dt) {
    // Gentle bob animation ±0.1 on Y
    if (_heliGroup) {
      _heliGroup.position.x = 0;
      _heliGroup.position.y = 8 + Math.sin(_totalTimer * 2.5) * 0.1;
      _heliGroup.position.z = 0;
      _heliGroup.rotation.z = 0;
    }

    // Animate smoke grenade falling
    if (_smokeGrenade && _smokeGrenade.position.y > 0) {
      _smokeGrenade.position.y -= dt * 4;
      if (_smokeGrenade.position.y < 0) _smokeGrenade.position.y = 0;
    }

    // Animate dust particles radiating outward
    for (var i = 0; i < _dustParticles.length; i++) {
      var p = _dustParticles[i];
      if (!p || !p.userData) continue;
      var ud = p.userData;
      ud.t = (ud.t || 0) + dt;
      var frac = (ud.t % 1.2) / 1.2;
      p.position.x = ud.ox + ud.dx * frac * 5;
      p.position.z = ud.oz + ud.dz * frac * 5;
      p.position.y = 0.1 + Math.sin(frac * Math.PI) * 0.4;
      p.material.opacity = 0.6 * (1 - frac);
    }

    // Phase transition
    if (_phaseTimer >= 5) {
      _phase = 3;
      _phaseTimer = 0;
      _startPhaseExtraction();
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     PHASE 3: EXTRACTION (3s for player / 8s timeout)
   ──────────────────────────────────────────────────────────────────────── */

  function _startPhaseExtraction() {
    _showHUDMessage('🚁 EXTRACT NOW — RUN TO LZ', '#00ff44', true);
  }

  function _updateExtraction(dt) {
    // Check if player is within 3 units of LZ (0,0,0)
    var player = _getPlayerPosition();
    if (player) {
      var dx = player.x - 0;
      var dz = player.z - 0;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= 3 && !_extractionTriggered) {
        _doExtraction();
        return;
      }
    }

    // Lift off if extraction triggered
    if (_extractionTriggered && _heliGroup) {
      _heliGroup.position.y += 0.5 * dt;
    }

    // 8 second timeout — abort
    if (_phaseTimer >= 8 && !_extractionTriggered) {
      _showHUDMessage('⚠ EXTRACTION ABORTED — LZ COMPROMISED', '#ff2222', false);
      _clearFlash();
      setTimeout(function () {
        _forceMissionComplete('lz-aborted');
      }, 2000);
      _phase = 0; // prevent re-entry
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     EXTRACTION / MISSION COMPLETE
   ──────────────────────────────────────────────────────────────────────── */

  function _doExtraction() {
    _extractionTriggered = true;
    _showHUDMessage('✅ MISSION COMPLETE', '#ffff00', false);
    _clearFlash();

    // Triumphant sound
    _playExtractionFanfare();

    // Hide player from scene (optional)
    if (window.GameManager && window.GameManager.getPlayer) {
      var pl = window.GameManager.getPlayer();
      if (pl && pl.visible !== undefined) pl.visible = false;
    }

    // Helicopter lifts off — handled in update loop
    if (_heliGroup) {
      _heliGroup.position.set(0, 8, 0);
    }

    // Fire callbacks after short delay
    setTimeout(function () {
      _fireMissionCompleteCallbacks();
    }, 1500);
  }

  function _forceMissionComplete(reason) {
    if (_missionCompleteTriggered) return;
    _fireMissionCompleteCallbacks();
  }

  function _fireMissionCompleteCallbacks() {
    if (_missionCompleteTriggered) return;
    _missionCompleteTriggered = true;

    if (typeof window._onExtractionComplete === 'function') {
      try { window._onExtractionComplete(); } catch (e) {}
    }

    var kills = (window.GameManager && window.GameManager.getKills) ? window.GameManager.getKills() : 0;
    var score = (window.GameManager && window.GameManager.getScore) ? window.GameManager.getScore() : 0;
    var levelName = (window.GameManager && window.GameManager.getLevelName) ? window.GameManager.getLevelName() : 'Unknown';
    var xp = kills * 10 + Math.floor(score / 100);

    if (typeof window._onMissionComplete === 'function') {
      try {
        window._onMissionComplete({
          levelName: levelName,
          kills: kills,
          score: score,
          xpEarned: xp
        });
      } catch (e) {}
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     BUILD: HELICOPTER MESH
   ──────────────────────────────────────────────────────────────────────── */

  function _buildHelicopter() {
    if (!_scene || !window.THREE) return;

    _heliGroup = new THREE.Group();

    var milGreen = new THREE.MeshLambertMaterial({ color: 0x2a3a2a });
    var darkMetal = new THREE.MeshLambertMaterial({ color: 0x1a2a1a });

    // ── Main body ────────────────────────────────────────
    var bodyGeo = new THREE.BoxGeometry(2, 0.6, 4);
    var body = new THREE.Mesh(bodyGeo, milGreen);
    body.position.set(0, 0, 0);
    _heliGroup.add(body);

    // Cockpit nose (slightly narrower box at front)
    var noseGeo = new THREE.BoxGeometry(1.4, 0.5, 1.2);
    var nose = new THREE.Mesh(noseGeo, milGreen);
    nose.position.set(0, -0.05, -2.4);
    _heliGroup.add(nose);

    // Cockpit glass (dark blue-tinted)
    var glassGeo = new THREE.BoxGeometry(1.2, 0.35, 0.5);
    var glassMat = new THREE.MeshLambertMaterial({ color: 0x112233, transparent: true, opacity: 0.7 });
    var glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 0.05, -2.7);
    _heliGroup.add(glass);

    // ── Tail boom ────────────────────────────────────────
    var tailGeo = new THREE.BoxGeometry(0.3, 0.25, 3);
    var tail = new THREE.Mesh(tailGeo, milGreen);
    tail.position.set(0, 0.05, 2.8);
    _heliGroup.add(tail);

    // Tail fin (vertical stabiliser)
    var finGeo = new THREE.BoxGeometry(0.1, 0.6, 0.5);
    var fin = new THREE.Mesh(finGeo, milGreen);
    fin.position.set(0, 0.4, 4.1);
    _heliGroup.add(fin);

    // ── Tail rotor ───────────────────────────────────────
    var tailRotorGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
    var tailRotorHub = new THREE.Mesh(tailRotorGeo, darkMetal);
    tailRotorHub.rotation.z = Math.PI / 2;
    tailRotorHub.position.set(0.2, 0.1, 4.2);
    _heliGroup.add(tailRotorHub);

    var tailBlade1Geo = new THREE.BoxGeometry(0.05, 0.04, 0.6);
    _rotorTail = new THREE.Group();
    var tb1 = new THREE.Mesh(tailBlade1Geo, darkMetal);
    var tb2 = new THREE.Mesh(tailBlade1Geo, darkMetal);
    tb2.rotation.y = Math.PI / 2;
    _rotorTail.add(tb1);
    _rotorTail.add(tb2);
    _rotorTail.position.set(0.22, 0.1, 4.2);
    _heliGroup.add(_rotorTail);

    // ── Main rotor mast ──────────────────────────────────
    var mastGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6);
    var mast = new THREE.Mesh(mastGeo, darkMetal);
    mast.position.set(0, 0.5, 0);
    _heliGroup.add(mast);

    // ── Main rotor blades ────────────────────────────────
    _rotorTop = new THREE.Group();
    _rotorTop.position.set(0, 0.72, 0);

    var bladeMat = new THREE.MeshLambertMaterial({ color: 0x1c2c1c });
    var bladeGeo = new THREE.BoxGeometry(5.5, 0.04, 0.28);
    var blade1 = new THREE.Mesh(bladeGeo, bladeMat);
    var blade2 = new THREE.Mesh(bladeGeo, bladeMat);
    blade2.rotation.y = Math.PI / 2;
    var blade3 = new THREE.Mesh(bladeGeo, bladeMat);
    blade3.rotation.y = Math.PI;
    var blade4 = new THREE.Mesh(bladeGeo, bladeMat);
    blade4.rotation.y = Math.PI * 1.5;
    _rotorTop.add(blade1);
    _rotorTop.add(blade2);
    _rotorTop.add(blade3);
    _rotorTop.add(blade4);
    _heliGroup.add(_rotorTop);

    // ── Landing skids ────────────────────────────────────
    var skidMat = new THREE.MeshLambertMaterial({ color: 0x111811 });

    // Left skid
    var skidLGeo = new THREE.BoxGeometry(0.1, 0.08, 3.6);
    var skidL = new THREE.Mesh(skidLGeo, skidMat);
    skidL.position.set(-0.75, -0.45, 0);
    _heliGroup.add(skidL);

    // Right skid
    var skidR = new THREE.Mesh(skidLGeo, skidMat);
    skidR.position.set(0.75, -0.45, 0);
    _heliGroup.add(skidR);

    // Skid struts (front)
    var strutGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
    var strutMat = new THREE.MeshLambertMaterial({ color: 0x1a2a1a });

    var strut1 = new THREE.Mesh(strutGeo, strutMat);
    strut1.position.set(-0.75, -0.2, -1);
    _heliGroup.add(strut1);
    var strut2 = new THREE.Mesh(strutGeo, strutMat);
    strut2.position.set(0.75, -0.2, -1);
    _heliGroup.add(strut2);

    // Skid struts (rear)
    var strut3 = new THREE.Mesh(strutGeo, strutMat);
    strut3.position.set(-0.75, -0.2, 1.2);
    _heliGroup.add(strut3);
    var strut4 = new THREE.Mesh(strutGeo, strutMat);
    strut4.position.set(0.75, -0.2, 1.2);
    _heliGroup.add(strut4);

    // ── Search spotlight ─────────────────────────────────
    _searchLight = new THREE.SpotLight(0x88ffaa, 2, 30, Math.PI / 8, 0.3, 1);
    _searchLight.position.set(0, 0, 0);
    _searchLight.target = new THREE.Object3D();
    _searchLight.target.position.set(0, -8, 0);
    _heliGroup.add(_searchLight);
    _scene.add(_searchLight.target);

    // Start position
    _heliGroup.position.set(80, 20, 0);
    _scene.add(_heliGroup);
  }

  /* ────────────────────────────────────────────────────────────────────────
     BUILD: LZ RING (ground marker)
   ──────────────────────────────────────────────────────────────────────── */

  function _buildLZRing() {
    if (!_scene || !window.THREE) return;

    var ringGeo = new THREE.RingGeometry(3, 3.5, 32);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff44, side: THREE.DoubleSide });
    _lzRing = new THREE.Mesh(ringGeo, ringMat);
    _lzRing.rotation.x = -Math.PI / 2; // lay flat on ground
    _lzRing.position.set(0, 0.05, 0);
    _lzRing.visible = false; // shown in phase 2
    _scene.add(_lzRing);
  }

  /* ────────────────────────────────────────────────────────────────────────
     BUILD: DUST PARTICLES (rotor wash)
   ──────────────────────────────────────────────────────────────────────── */

  function _buildDustParticles() {
    if (!_scene || !window.THREE) return;

    var dustGeo = new THREE.SphereGeometry(0.12, 4, 4);

    for (var i = 0; i < 20; i++) {
      var angle = (i / 20) * Math.PI * 2;
      var dustMat = new THREE.MeshBasicMaterial({
        color: 0xbbaa88,
        transparent: true,
        opacity: 0.5
      });
      var dust = new THREE.Mesh(dustGeo, dustMat);
      var ox = Math.cos(angle) * 0.5;
      var oz = Math.sin(angle) * 0.5;
      dust.position.set(ox, 0.1, oz);
      dust.userData = {
        ox: ox,
        oz: oz,
        dx: Math.cos(angle),
        dz: Math.sin(angle),
        t: (i / 20) // stagger start
      };
      _scene.add(dust);
      _dustParticles.push(dust);
    }
  }

  /* ────────────────────────────────────────────────────────────────────────
     DROP: GREEN SMOKE GRENADE
   ──────────────────────────────────────────────────────────────────────── */

  function _dropSmokeGrenade() {
    if (!_scene || !window.THREE) return;

    var smokeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8);
    var smokeMat = new THREE.MeshLambertMaterial({ color: 0x226622 });
    _smokeGrenade = new THREE.Mesh(smokeGeo, smokeMat);
    _smokeGrenade.position.set(0, 8, 0); // drops from heli position
    _scene.add(_smokeGrenade);
  }

  /* ────────────────────────────────────────────────────────────────────────
     HUD HELPERS
   ──────────────────────────────────────────────────────────────────────── */

  function _buildHUD() {
    _removeHUD();

    // Main extraction message (top-center)
    _hudMsg = document.createElement('div');
    _hudMsg.id = 'heli-extraction-msg';
    _hudMsg.style.cssText = [
      'position:fixed',
      'top:18px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2000',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'color:#00ff44',
      'text-shadow:0 0 10px #00ff44',
      'pointer-events:none',
      'letter-spacing:2px',
      'background:rgba(0,0,0,0.55)',
      'padding:5px 18px',
      'border-radius:6px',
      'border:1px solid rgba(0,255,68,0.4)'
    ].join(';');
    document.body.appendChild(_hudMsg);

    // LZ distance label (below main msg)
    _lzDistEl = document.createElement('div');
    _lzDistEl.id = 'heli-lz-dist';
    _lzDistEl.style.cssText = [
      'position:fixed',
      'top:52px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2000',
      'font-family:monospace',
      'font-size:13px',
      'color:#88ffaa',
      'pointer-events:none',
      'letter-spacing:1px',
      'background:rgba(0,0,0,0.45)',
      'padding:2px 12px',
      'border-radius:4px'
    ].join(';');
    _lzDistEl.textContent = 'LZ: — m';
    document.body.appendChild(_lzDistEl);
  }

  function _showHUDMessage(text, color, flashing) {
    if (!_hudMsg) _buildHUD();
    _clearFlash();
    _hudMsg.textContent = text;
    _hudMsg.style.color = color || '#00ff44';
    _hudMsg.style.textShadow = '0 0 10px ' + (color || '#00ff44');

    if (flashing) {
      var visible = true;
      _flashInterval = setInterval(function () {
        if (_hudMsg) _hudMsg.style.opacity = visible ? '1' : '0.25';
        visible = !visible;
      }, 500);
    }
  }

  function _updateHUDText(text) {
    if (_hudMsg) _hudMsg.textContent = text;
  }

  function _clearFlash() {
    if (_flashInterval) {
      clearInterval(_flashInterval);
      _flashInterval = null;
    }
    if (_hudMsg) _hudMsg.style.opacity = '1';
  }

  function _removeHUD() {
    _clearFlash();
    var old = document.getElementById('heli-extraction-msg');
    if (old) old.parentNode.removeChild(old);
    var oldDist = document.getElementById('heli-lz-dist');
    if (oldDist) oldDist.parentNode.removeChild(oldDist);
    _hudMsg = null;
    _lzDistEl = null;
  }

  function _updateLZDistance() {
    if (!_lzDistEl) return;
    var player = _getPlayerPosition();
    if (!player) {
      _lzDistEl.textContent = 'LZ: — m';
      return;
    }
    var dx = player.x;
    var dz = player.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    _lzDistEl.textContent = 'LZ: ' + Math.round(dist) + 'm';
  }

  /* ────────────────────────────────────────────────────────────────────────
     PLAYER POSITION HELPER
   ──────────────────────────────────────────────────────────────────────── */

  function _getPlayerPosition() {
    // Try various ways to get player position
    if (window.GameManager) {
      if (typeof window.GameManager.getPlayerPosition === 'function') {
        return window.GameManager.getPlayerPosition();
      }
      if (typeof window.GameManager.getPlayer === 'function') {
        var pl = window.GameManager.getPlayer();
        if (pl && pl.position) return pl.position;
      }
    }
    if (window._playerMesh && window._playerMesh.position) {
      return window._playerMesh.position;
    }
    if (window._camera && window._camera.position) {
      return window._camera.position;
    }
    if (_camera && _camera.position) {
      return _camera.position;
    }
    return null;
  }

  /* ────────────────────────────────────────────────────────────────────────
     AUDIO
   ──────────────────────────────────────────────────────────────────────── */

  function _playRotorDrone() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc1 = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.value = 48;
      osc2.type = 'square';
      osc2.frequency.value = 96;

      gain.gain.value = 0.08;

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      // Store so we can stop it
      _rotorSource = { ctx: ctx, nodes: [osc1, osc2, gain] };

      // Auto-stop after 20s
      setTimeout(function () { _stopRotorSound(); }, 20000);
    } catch (e) {}
  }

  function _stopRotorSound() {
    if (_rotorSource) {
      try {
        _rotorSource.nodes.forEach(function (n) {
          try { n.stop && n.stop(); } catch (e) {}
          try { n.disconnect && n.disconnect(); } catch (e) {}
        });
        _rotorSource.ctx.close();
      } catch (e) {}
      _rotorSource = null;
    }
  }

  function _playExtractionFanfare() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var gain = ctx.createGain();
      gain.gain.value = 0.22;
      gain.connect(ctx.destination);

      // Ascending major chord: C4, E4, G4, C5
      var freqs = [261.63, 329.63, 392.00, 523.25];
      freqs.forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        noteGain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        noteGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.9);
        osc.connect(noteGain);
        noteGain.connect(gain);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.9);
      });

      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 2000);
    } catch (e) {}
  }

  /* ────────────────────────────────────────────────────────────────────────
     EXPORTS
   ──────────────────────────────────────────────────────────────────────── */

  return {
    init: init,
    trigger: trigger,
    update: update,
    reset: reset
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail helicopter-extraction.js",_e&&_e.message); }
/* === heli-extraction.js === */
try {
;
// heli-extraction.js — helicopter extraction/evacuation mechanic for Three.js FPS
window.HeliExtraction = (function () {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────────
  var scene, camera, renderer, playerRef;

  var state = 'idle'; // idle | approaching | hovering | rope_descending | lifting | departing
  var heliGroup = null;
  var mainRotor = null;
  var tailRotor = null;
  var searchlight = null;
  var ropeObj = null;
  var ropeLengthTarget = 0;
  var ropeLengthCurrent = 0;
  var ropeEnd = null; // Three.js Object3D tracking rope bottom

  var hoverPosition = null; // THREE.Vector3
  var spawnPosition = null; // THREE.Vector3
  var heliSpeed = 8;
  var heliAltitude = 15;
  var landingZone = null; // THREE.Vector3 — (0, 15, -10)

  var etaTimer = 0;
  var totalETA = 20;
  var hoverTimer = 0;
  var maxHoverTime = 60;
  var ropeMesh = null;
  var ropeDescendTimer = 0;
  var ropeDescendDuration = 4;
  var liftTimer = 0;
  var liftDuration = 5;
  var playerLifting = false;
  var extractionUsedThisWave = false;
  var cooldownActive = false;

  var underFireTimer = 0;
  var underFireCooldown = 0;
  var evasiveOffsetX = 0;
  var evasiveOffsetZ = 0;

  var audioCtx = null;
  var heliAudioNodes = null; // { osc, gainNode, amOsc, amGain }

  var hudEl = null; // main HUD div for extraction messages
  var hudTimeout = null;

  // ─── Key binding ─────────────────────────────────────────────────────────────
  var keysDown = {};

  function onKeyDown(e) {
    keysDown[e.code] = true;
    // Ctrl+Shift+E => call extraction
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyE') {
      callExtraction();
    }
    // E => grab rope
    if (e.code === 'KeyE' && state === 'rope_descending') {
      tryGrabRope();
    }
  }

  function onKeyUp(e) {
    keysDown[e.code] = false;
  }

  // ─── HUD helpers ─────────────────────────────────────────────────────────────
  function ensureHUD() {
    if (hudEl) return;
    hudEl = document.createElement('div');
    hudEl.id = 'heli-extraction-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:18%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'text-shadow:0 0 8px #00ff88',
      'pointer-events:none',
      'text-align:center',
      'z-index:9999',
      'letter-spacing:2px',
      'display:none'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function showHUD(msg, duration, color) {
    ensureHUD();
    hudEl.style.color = color || '#00ff88';
    hudEl.style.textShadow = '0 0 8px ' + (color || '#00ff88');
    hudEl.innerText = msg;
    hudEl.style.display = 'block';
    if (hudTimeout) clearTimeout(hudTimeout);
    if (duration) {
      hudTimeout = setTimeout(function () {
        if (hudEl) hudEl.style.display = 'none';
      }, duration);
    }
  }

  function hideHUD() {
    if (hudEl) hudEl.style.display = 'none';
    if (hudTimeout) clearTimeout(hudTimeout);
  }

  // ─── Web Audio: helicopter approach sound ────────────────────────────────────
  function startHeliSound() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (heliAudioNodes) stopHeliSound();

      // Main rotor oscillator at ~200 Hz
      var osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);

      // AM modulator at 8 Hz for blade slap
      var amOsc = audioCtx.createOscillator();
      amOsc.type = 'sine';
      amOsc.frequency.setValueAtTime(8, audioCtx.currentTime);

      var amGain = audioCtx.createGain();
      amGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      amOsc.connect(amGain);

      // Carrier gain node
      var carrierGain = audioCtx.createGain();
      carrierGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      amGain.connect(carrierGain.gain); // AM modulation

      // Master gain (quiet distant at first)
      var masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + totalETA);

      osc.connect(carrierGain);
      carrierGain.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      osc.start();
      amOsc.start();

      heliAudioNodes = { osc: osc, amOsc: amOsc, amGain: amGain, carrierGain: carrierGain, masterGain: masterGain };
    } catch (err) {
      // Web Audio not available — silently skip
    }
  }

  function stopHeliSound() {
    if (!heliAudioNodes) return;
    try {
      heliAudioNodes.osc.stop();
      heliAudioNodes.amOsc.stop();
    } catch (e) {}
    heliAudioNodes = null;
  }

  // ─── Helicopter mesh construction ────────────────────────────────────────────
  function buildHelicopter() {
    var THREE = window.THREE;
    var group = new THREE.Group();

    // Fuselage
    var fuselageGeo = new THREE.BoxGeometry(4, 1.5, 1.3);
    var oliveMat = new THREE.MeshLambertMaterial({ color: 0x4b5320 });
    var fuselage = new THREE.Mesh(fuselageGeo, oliveMat);
    fuselage.castShadow = true;
    group.add(fuselage);

    // Tail boom — angled up slightly
    var tailGeo = new THREE.CylinderGeometry(0.2, 0.1, 3, 8);
    var tailMat = new THREE.MeshLambertMaterial({ color: 0x4b5320 });
    var tailBoom = new THREE.Mesh(tailGeo, tailMat);
    tailBoom.position.set(-3.0, 0.3, 0);
    tailBoom.rotation.z = 0.2; // slight upward angle
    group.add(tailBoom);

    // Main rotor hub
    var rotorHub = new THREE.Group();
    rotorHub.position.set(0, 1.0, 0);
    group.add(rotorHub);
    mainRotor = rotorHub;

    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var blade1Geo = new THREE.BoxGeometry(0.1, 0.05, 2.5);
    var blade1 = new THREE.Mesh(blade1Geo, rotorMat);
    rotorHub.add(blade1);

    var blade2Geo = new THREE.BoxGeometry(0.1, 0.05, 2.5);
    var blade2 = new THREE.Mesh(blade2Geo, rotorMat);
    blade2.rotation.y = Math.PI / 2;
    rotorHub.add(blade2);

    // Tail rotor hub
    var tailRotorHub = new THREE.Group();
    tailRotorHub.position.set(-4.3, 0.5, 0.3);
    group.add(tailRotorHub);
    tailRotor = tailRotorHub;

    var tBladeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var tBlade1Geo = new THREE.BoxGeometry(0.05, 0.05, 0.8);
    var tBlade1 = new THREE.Mesh(tBlade1Geo, tBladeMat);
    tailRotorHub.add(tBlade1);

    var tBlade2Geo = new THREE.BoxGeometry(0.05, 0.05, 0.8);
    var tBlade2 = new THREE.Mesh(tBlade2Geo, tBladeMat);
    tBlade2.rotation.z = Math.PI / 2;
    tailRotorHub.add(tBlade2);

    // Landing skids
    var skidMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var skidGeo1 = new THREE.CylinderGeometry(0.05, 0.05, 4, 6);
    var skid1 = new THREE.Mesh(skidGeo1, skidMat);
    skid1.rotation.z = Math.PI / 2;
    skid1.position.set(0, -1.0, 0.5);
    group.add(skid1);

    var skidGeo2 = new THREE.CylinderGeometry(0.05, 0.05, 4, 6);
    var skid2 = new THREE.Mesh(skidGeo2, skidMat);
    skid2.rotation.z = Math.PI / 2;
    skid2.position.set(0, -1.0, -0.5);
    group.add(skid2);

    // Searchlight (SpotLight pointing down)
    var spot = new THREE.SpotLight(0xffffff, 1.5, 40, Math.PI / 6, 0.3);
    spot.position.set(0.5, -1.2, 0);
    spot.target.position.set(0.5, -20, 0);
    group.add(spot);
    group.add(spot.target);
    searchlight = spot;

    return group;
  }

  function buildRope() {
    var THREE = window.THREE;
    // Start with height=0 so it's invisible; we'll scale it each frame
    var ropeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 6);
    var ropeMat = new THREE.MeshLambertMaterial({ color: 0xd4a017 });
    var mesh = new THREE.Mesh(ropeGeo, ropeMat);
    mesh.geometry.translate(0, -0.5, 0); // pivot at top
    mesh.visible = false;
    return mesh;
  }

  // ─── Helicopter spawning ──────────────────────────────────────────────────────
  function spawnHeli() {
    var THREE = window.THREE;
    if (!scene || !THREE) return;

    heliGroup = buildHelicopter();
    landingZone = new THREE.Vector3(0, heliAltitude, -10);

    // Spawn 80 units away in a random horizontal direction from landing zone
    var angle = Math.random() * Math.PI * 2;
    spawnPosition = new THREE.Vector3(
      landingZone.x + Math.cos(angle) * 80,
      heliAltitude,
      landingZone.z + Math.sin(angle) * 80
    );

    heliGroup.position.copy(spawnPosition);
    scene.add(heliGroup);

    // Rope (added as child of heliGroup so it moves with it; but rope descends world-space)
    ropeMesh = buildRope();
    ropeMesh.position.set(0, -1.2, 0); // hang below fuselage
    heliGroup.add(ropeMesh);
    ropeObj = ropeMesh;
    ropeLengthCurrent = 0;
    ropeLengthTarget = 0;

    hoverPosition = landingZone.clone();
  }

  // ─── ETA HUD update ──────────────────────────────────────────────────────────
  function updateETAHUD() {
    var remaining = Math.ceil(totalETA - etaTimer);
    if (remaining > 0) {
      showHUD('EXTRACTION CALLED — ETA ' + remaining + 's', null, '#00ff88');
    } else {
      showHUD('HELICOPTER ARRIVING', null, '#00ff88');
    }
  }

  // ─── Public: callExtraction ───────────────────────────────────────────────────
  function callExtraction() {
    if (state !== 'idle') return;
    if (extractionUsedThisWave) {
      showHUD('EXTRACTION ALREADY USED THIS WAVE', 3000, '#ff8800');
      return;
    }
    if (cooldownActive) {
      showHUD('EXTRACTION ON COOLDOWN', 3000, '#ff8800');
      return;
    }
    if (window._bossActive) {
      showHUD('CANNOT EXTRACT DURING BOSS FIGHT', 3000, '#ff4444');
      return;
    }

    state = 'approaching';
    etaTimer = 0;
    hoverTimer = 0;

    startHeliSound();
    spawnHeli();
    showHUD('EXTRACTION CALLED — ETA ' + totalETA + 's', null, '#00ff88');
  }

  // ─── Try to grab rope ─────────────────────────────────────────────────────────
  function tryGrabRope() {
    if (state !== 'rope_descending') return;
    if (!playerRef) return;
    var THREE = window.THREE;

    // Compute world position of rope end
    var ropeWorldEnd = getRopeEndWorld();
    if (!ropeWorldEnd) return;

    var playerPos = playerRef.position;
    var dist = playerPos.distanceTo(ropeWorldEnd);

    if (dist <= 2.0) {
      state = 'lifting';
      liftTimer = 0;
      playerLifting = true;
      showHUD('GRAB ROPE — LIFTING…', null, '#00ff88');
    }
  }

  function getRopeEndWorld() {
    if (!heliGroup || !ropeMesh) return null;
    var THREE = window.THREE;
    // Rope hangs below heli; its end is at ropeLengthCurrent below ropeMesh's world position
    var ropeTop = new THREE.Vector3();
    ropeMesh.getWorldPosition(ropeTop);
    return new THREE.Vector3(ropeTop.x, ropeTop.y - ropeLengthCurrent, ropeTop.z);
  }

  // ─── Enemy proximity check ───────────────────────────────────────────────────
  function checkUnderFire() {
    if (!heliGroup) return false;
    var enemies = window._enemies || (window.Enemies && window.Enemies.getList ? window.Enemies.getList() : null);
    if (!enemies || !enemies.length) return false;
    var THREE = window.THREE;
    var heliPos = heliGroup.position;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      var dx = e.position.x - heliPos.x;
      var dy = e.position.y - heliPos.y;
      var dz = e.position.z - heliPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 15) return true;
    }
    return false;
  }

  // ─── Evasive action ──────────────────────────────────────────────────────────
  function applyEvasive(dt) {
    underFireTimer += dt;
    if (underFireTimer > 0.5) {
      underFireTimer = 0;
      evasiveOffsetX = (Math.random() - 0.5) * 4; // ±2m
      evasiveOffsetZ = (Math.random() - 0.5) * 4;
      showHUD('HELICOPTER TAKING FIRE', 2000, '#ff4444');

      // Retract rope
      if (state === 'rope_descending' || state === 'hovering') {
        ropeLengthTarget = 0;
        state = 'hovering';
      }
    }

    if (hoverPosition && heliGroup) {
      heliGroup.position.x += (hoverPosition.x + evasiveOffsetX - heliGroup.position.x) * Math.min(1, dt * 3);
      heliGroup.position.z += (hoverPosition.z + evasiveOffsetZ - heliGroup.position.z) * Math.min(1, dt * 3);
    }
  }

  // ─── Depart ──────────────────────────────────────────────────────────────────
  function depart() {
    state = 'departing';
    stopHeliSound();
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────────
  function cleanupHeli() {
    if (heliGroup && scene) {
      scene.remove(heliGroup);
    }
    heliGroup = null;
    mainRotor = null;
    tailRotor = null;
    searchlight = null;
    ropeMesh = null;
    ropeObj = null;
    ropeLengthCurrent = 0;
    ropeLengthTarget = 0;
    stopHeliSound();
    state = 'idle';
    playerLifting = false;
    underFireTimer = 0;
    evasiveOffsetX = 0;
    evasiveOffsetZ = 0;
    hideHUD();
  }

  // ─── Public: reset ────────────────────────────────────────────────────────────
  function reset() {
    cleanupHeli();
    extractionUsedThisWave = false;
    cooldownActive = false;
    hoverTimer = 0;
    etaTimer = 0;
  }

  // ─── Public: init ─────────────────────────────────────────────────────────────
  function init(opts) {
    opts = opts || {};
    scene = opts.scene || window._scene || null;
    camera = opts.camera || window._camera || null;
    renderer = opts.renderer || window._renderer || null;
    playerRef = opts.player || window._player || null;

    ensureHUD();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  // ─── Public: update ───────────────────────────────────────────────────────────
  function update(dt) {
    // Allow late binding of scene/player
    if (!scene) scene = window._scene || null;
    if (!playerRef) playerRef = window._player || null;
    if (!window.THREE) return;
    var THREE = window.THREE;

    // Spin rotors
    if (mainRotor) mainRotor.rotation.y += 5 * dt;
    if (tailRotor) tailRotor.rotation.x += 12 * dt;

    if (state === 'idle') return;

    // ── Approaching ────────────────────────────────────────────────────────────
    if (state === 'approaching') {
      etaTimer += dt;
      updateETAHUD();

      if (!heliGroup) return;

      var target = hoverPosition.clone();
      var toTarget = target.clone().sub(heliGroup.position);
      var distToTarget = toTarget.length();

      // Decelerate last 20 units
      var speed = heliSpeed;
      if (distToTarget < 20) {
        speed = heliSpeed * (distToTarget / 20);
        speed = Math.max(speed, 1.0);
      }

      if (distToTarget > 0.3) {
        var dir = toTarget.normalize();
        heliGroup.position.addScaledVector(dir, speed * dt);

        // Face direction of travel
        var angle = Math.atan2(dir.x, dir.z);
        heliGroup.rotation.y = angle;
      } else {
        heliGroup.position.copy(hoverPosition);
        state = 'hovering';
        hoverTimer = 0;
        showHUD('HELICOPTER HOVERING — DEPLOYING ROPE', 3000, '#00ff88');
        ropeLengthTarget = 0; // will be set in hover state
        ropeMesh.visible = true;

        // After 2s in hover, start rope descent
        setTimeout(function () {
          if (state === 'hovering') {
            state = 'rope_descending';
            ropeDescendTimer = 0;
            ropeLengthTarget = heliAltitude - 1.5; // from heli altitude down to y=1.5
          }
        }, 2000);
      }
    }

    // ── Hovering ──────────────────────────────────────────────────────────────
    if (state === 'hovering') {
      hoverTimer += dt;

      // Face player
      if (playerRef && heliGroup) {
        var px = playerRef.position.x - heliGroup.position.x;
        var pz = playerRef.position.z - heliGroup.position.z;
        var faceAngle = Math.atan2(px, pz);
        heliGroup.rotation.y += (faceAngle - heliGroup.rotation.y) * Math.min(1, dt * 2);
      }

      // Under fire check
      if (checkUnderFire()) {
        applyEvasive(dt);
      } else {
        underFireTimer = 0;
      }

      // Max hover time exceeded => depart
      if (hoverTimer > maxHoverTime) {
        depart();
      }
    }

    // ── Rope descending ───────────────────────────────────────────────────────
    if (state === 'rope_descending') {
      hoverTimer += dt;
      ropeDescendTimer += dt;

      // Face player
      if (playerRef && heliGroup) {
        var rpx = playerRef.position.x - heliGroup.position.x;
        var rpz = playerRef.position.z - heliGroup.position.z;
        var rfaceAngle = Math.atan2(rpx, rpz);
        heliGroup.rotation.y += (rfaceAngle - heliGroup.rotation.y) * Math.min(1, dt * 2);
      }

      // Under fire
      if (checkUnderFire()) {
        applyEvasive(dt);
        // rope retracts on evasive
      } else {
        underFireTimer = 0;
        evasiveOffsetX = 0;
        evasiveOffsetZ = 0;
      }

      // Grow rope
      var progress = Math.min(ropeDescendTimer / ropeDescendDuration, 1);
      ropeLengthCurrent = ropeLengthTarget * progress;

      // Update rope mesh scale (grows downward)
      if (ropeMesh) {
        ropeMesh.scale.y = Math.max(ropeLengthCurrent, 0.001);
      }

      // Show GRAB prompt if rope is near full
      if (progress > 0.9) {
        showHUD('GRAB ROPE [E]', null, '#00ff88');
      }

      // Check player nearby rope end
      if (playerRef) {
        var ropeEnd = getRopeEndWorld();
        if (ropeEnd) {
          var distToRope = playerRef.position.distanceTo(ropeEnd);
          if (distToRope <= 2.0) {
            showHUD('GRAB ROPE [E]', null, '#ffff00');
          }
        }
      }

      // Max hover exceeded
      if (hoverTimer > maxHoverTime) {
        depart();
      }
    }

    // ── Lifting ────────────────────────────────────────────────────────────────
    if (state === 'lifting') {
      liftTimer += dt;
      if (playerRef) {
        playerRef.position.y += 0.8 * dt;
      }

      var liftProgress = liftTimer / liftDuration;
      showHUD('LIFTING… ' + Math.floor(liftProgress * 100) + '%', null, '#00ff88');

      if (liftTimer >= liftDuration) {
        // Extraction complete
        state = 'departing';
        extractionUsedThisWave = true;
        cooldownActive = true;
        playerLifting = false;
        showHUD('EXTRACTION SUCCESSFUL! +5000 SCORE', 5000, '#00ff88');

        // Award score
        if (window._score !== undefined) {
          window._score += 5000;
        } else if (window.ScoreSystem && window.ScoreSystem.add) {
          window.ScoreSystem.add(5000);
        }

        // Trigger next wave after a delay
        setTimeout(function () {
          if (window._triggerNextWave) window._triggerNextWave();
          else if (window.WaveManager && window.WaveManager.nextWave) window.WaveManager.nextWave();
        }, 3000);

        depart();
      }
    }

    // ── Departing ─────────────────────────────────────────────────────────────
    if (state === 'departing') {
      if (!heliGroup) return;

      // Ascend then fly away
      heliGroup.position.y += 5 * dt;
      heliGroup.position.z -= 12 * dt; // fly away in -Z

      // Retract rope
      if (ropeMesh) {
        ropeLengthCurrent = Math.max(0, ropeLengthCurrent - 8 * dt);
        ropeMesh.scale.y = Math.max(ropeLengthCurrent, 0.001);
      }

      // Far enough away => cleanup
      if (heliGroup.position.y > 60 || heliGroup.position.z < -200) {
        cleanupHeli();
      }
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    callExtraction: callExtraction,
    reset: reset
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail heli-extraction.js",_e&&_e.message); }
/* === dynamic-objectives.js === */
try {
;
/* ─────────────────────────────────────────────────────────────────────────────
   DYNAMIC OBJECTIVES — mission objectives that update based on player progress
   Left-side HUD panel, wave-aware, bonus objectives, secret classified missions
   All var, IIFE pattern — no let/const
   ───────────────────────────────────────────────────────────────────────────── */
window.DynamicObjectives = (function () {
  'use strict';

  /* ── Objective type constants ─────────────────────────────────────────────── */
  var OBJECTIVE_TYPES = {
    KILL_COUNT:     'Eliminate X enemies',
    KILL_STREAK:    'Achieve X kill streak without dying',
    HEADSHOT_COUNT: 'Land X headshots',
    SURVIVE_TIME:   'Survive for X seconds',
    CAPTURE_POINT:  'Capture the objective',
    PROTECT_AREA:   'Keep enemies out of the zone',
    COLLECT_INTEL:  'Collect X intel documents',
    ELIMINATE_HVT:  'Eliminate the High Value Target',
    REACH_POSITION: 'Reach the marked position'
  };

  /* ── Internal state ───────────────────────────────────────────────────────── */
  var _primaryObjective   = null;   // { type, label, target, progress, complete, failed }
  var _bonusObjective     = null;   // same shape, or null
  var _classifiedObj      = null;   // secret objective or null
  var _classifiedUnlocked = false;
  var _hasClassified      = false;  // 10% chance roll per wave
  var _waveNum            = 0;
  var _waveEnemyCount     = 0;      // total enemies for this wave (set by init)
  var _midBonusTriggered  = false;  // guard: add bonus once at 50%
  var _surviveTimer       = 0;      // seconds elapsed this wave
  var _surviveTarget      = 0;      // seconds required for survive-time objective
  var _panelEl            = null;   // left HUD panel DOM element
  var _stylesInjected     = false;
  var _timeIntervalId     = null;   // setInterval handle for survive-time ticking
  var _bannerQueue        = [];     // queued full-screen banners
  var _bannerActive       = false;

  /* ── Style injection ──────────────────────────────────────────────────────── */
  function _injectStyles() {
    if (_stylesInjected || document.getElementById('dyn-obj-style')) { _stylesInjected = true; return; }
    _stylesInjected = true;
    var st = document.createElement('style');
    st.id = 'dyn-obj-style';
    st.textContent = [
      '@keyframes doSlideIn {',
      '  from { transform: translateX(-110%); opacity: 0; }',
      '  to   { transform: translateX(0);     opacity: 1; }',
      '}',
      '@keyframes doSlideOut {',
      '  from { transform: translateX(0);     opacity: 1; }',
      '  to   { transform: translateX(-110%); opacity: 0; }',
      '}',
      '@keyframes doCheckFlash {',
      '  0%   { color: #fff; text-shadow: 0 0 8px #0f0; }',
      '  40%  { color: #0f0; text-shadow: 0 0 16px #0f0; }',
      '  100% { color: #0f0; text-shadow: 0 0 4px #0f0; }',
      '}',
      '@keyframes doBannerIn {',
      '  from { opacity: 0; transform: translateX(-50%) scaleX(0.6); }',
      '  to   { opacity: 1; transform: translateX(-50%) scaleX(1); }',
      '}',
      '@keyframes doBannerOut {',
      '  from { opacity: 1; }',
      '  to   { opacity: 0; }',
      '}',
      '@keyframes doClassifiedPulse {',
      '  0%,100% { box-shadow: 0 0 8px #a020f0; }',
      '  50%     { box-shadow: 0 0 24px #d060ff; }',
      '}',
      '#dyn-obj-panel {',
      '  position: fixed;',
      '  top: 200px;',
      '  left: 12px;',
      '  width: 220px;',
      '  z-index: 210;',
      '  pointer-events: none;',
      '  font-family: "Courier New", Courier, monospace;',
      '  font-size: 12px;',
      '  animation: doSlideIn 0.45s cubic-bezier(0.22,0.61,0.36,1) both;',
      '}',
      '#dyn-obj-panel.do-hidden {',
      '  animation: doSlideOut 0.35s ease-in both;',
      '}',
      '.do-box {',
      '  background: rgba(0,0,0,0.72);',
      '  border: 1px solid rgba(255,200,60,0.45);',
      '  border-radius: 4px;',
      '  margin-bottom: 6px;',
      '  overflow: hidden;',
      '}',
      '.do-box-classified {',
      '  border-color: rgba(160,32,240,0.7);',
      '  animation: doClassifiedPulse 1.4s ease-in-out infinite;',
      '}',
      '.do-header {',
      '  background: rgba(255,200,60,0.18);',
      '  color: #ffd24a;',
      '  font-weight: bold;',
      '  font-size: 10px;',
      '  letter-spacing: 1.5px;',
      '  padding: 3px 7px;',
      '  border-bottom: 1px solid rgba(255,200,60,0.25);',
      '}',
      '.do-header-bonus {',
      '  background: rgba(0,180,255,0.15);',
      '  color: #66ddff;',
      '  border-bottom-color: rgba(0,180,255,0.25);',
      '}',
      '.do-header-classified {',
      '  background: rgba(160,32,240,0.2);',
      '  color: #d080ff;',
      '  border-bottom-color: rgba(160,32,240,0.35);',
      '}',
      '.do-body {',
      '  padding: 5px 7px;',
      '  color: #e0e0e0;',
      '  line-height: 1.45;',
      '}',
      '.do-label {',
      '  margin-bottom: 3px;',
      '}',
      '.do-progress-row {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 5px;',
      '  margin-top: 3px;',
      '}',
      '.do-progress-track {',
      '  flex: 1;',
      '  height: 6px;',
      '  background: rgba(255,255,255,0.12);',
      '  border-radius: 3px;',
      '  overflow: hidden;',
      '}',
      '.do-progress-fill {',
      '  height: 100%;',
      '  background: linear-gradient(90deg, #ffd24a, #ff8800);',
      '  border-radius: 3px;',
      '  transition: width 0.3s ease;',
      '}',
      '.do-progress-fill-bonus {',
      '  background: linear-gradient(90deg, #00c8ff, #0055ff);',
      '}',
      '.do-progress-fill-classified {',
      '  background: linear-gradient(90deg, #a020f0, #d060ff);',
      '}',
      '.do-progress-txt {',
      '  color: #aaa;',
      '  font-size: 10px;',
      '  min-width: 28px;',
      '  text-align: right;',
      '}',
      '.do-complete .do-header { background: rgba(0,180,0,0.2); color: #44ff88; border-bottom-color: rgba(0,200,0,0.3); }',
      '.do-complete .do-progress-fill { background: #44cc66; }',
      '.do-complete .do-check { animation: doCheckFlash 0.6s ease-out both; color: #44ff88; }',
      '.do-failed .do-header { color: #888; background: rgba(80,80,80,0.2); }',
      '.do-failed .do-body   { color: #666; }',
      '.do-failed .do-progress-fill { background: #555; }',
      '#dyn-obj-banner {',
      '  position: fixed;',
      '  top: 28%;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  pointer-events: none;',
      '  z-index: 300;',
      '  font-family: "Courier New", Courier, monospace;',
      '  font-size: 22px;',
      '  font-weight: bold;',
      '  text-shadow: 0 0 16px #000, 0 2px 6px #000;',
      '  text-align: center;',
      '  padding: 8px 28px;',
      '  border-radius: 6px;',
      '  white-space: nowrap;',
      '  animation: doBannerIn 0.3s cubic-bezier(0.22,0.61,0.36,1) both;',
      '  display: none;',
      '}',
      '#dyn-obj-banner.do-banner-gold {',
      '  color: #ffd700;',
      '  background: rgba(0,0,0,0.82);',
      '  border: 2px solid #ffd700;',
      '  box-shadow: 0 0 24px rgba(255,215,0,0.55);',
      '}',
      '#dyn-obj-banner.do-banner-purple {',
      '  color: #d080ff;',
      '  background: rgba(0,0,0,0.82);',
      '  border: 2px solid #a020f0;',
      '  box-shadow: 0 0 24px rgba(160,32,240,0.6);',
      '}',
      '#dyn-obj-banner.do-banner-green {',
      '  color: #44ff88;',
      '  background: rgba(0,0,0,0.82);',
      '  border: 2px solid #44ff88;',
      '  box-shadow: 0 0 24px rgba(68,255,136,0.5);',
      '}',
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ── DOM helpers ──────────────────────────────────────────────────────────── */
  function _getOrCreatePanel() {
    if (_panelEl && _panelEl.parentNode) return _panelEl;
    _panelEl = document.getElementById('dyn-obj-panel');
    if (!_panelEl) {
      _panelEl = document.createElement('div');
      _panelEl.id = 'dyn-obj-panel';
      document.body.appendChild(_panelEl);
    }
    return _panelEl;
  }

  function _getOrCreateBanner() {
    var el = document.getElementById('dyn-obj-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dyn-obj-banner';
      document.body.appendChild(el);
    }
    return el;
  }

  /* ── Progress bar ASCII (16 cells) ────────────────────────────────────────── */
  function _buildAsciiBar(progress, target, cells) {
    cells = cells || 16;
    var pct = target > 0 ? Math.min(1, progress / target) : 0;
    var filled = Math.round(pct * cells);
    var bar = '';
    for (var i = 0; i < cells; i++) bar += i < filled ? '█' : '░';
    return bar;
  }

  /* ── Render a single objective box ────────────────────────────────────────── */
  function _renderBox(obj, role) {
    if (!obj) return '';
    var isBonus      = role === 'bonus';
    var isClassified = role === 'classified';
    var complete     = !!obj.complete;
    var failed       = !!obj.failed;

    var boxClass    = 'do-box';
    var headerClass = 'do-header';
    if (isBonus)      headerClass += ' do-header-bonus';
    if (isClassified) { boxClass += ' do-box-classified'; headerClass += ' do-header-classified'; }
    if (complete)  boxClass += ' do-complete';
    if (failed)    boxClass += ' do-failed';

    var headerLabel = isBonus      ? 'BONUS OBJECTIVE'
                    : isClassified ? 'CLASSIFIED'
                    :                'PRIMARY OBJECTIVE';

    var checkMark = complete ? '<span class="do-check"> ✔</span>' : (failed ? ' ✗' : '');

    var labelText = obj.label || '';
    if (isClassified && !_classifiedUnlocked && !complete && !failed) {
      labelText = '??? (Complete a hidden action)';
    }

    var pct     = obj.target > 0 ? Math.min(1, obj.progress / obj.target) : 0;
    var fillPct = Math.round(pct * 100);
    var fillClass = 'do-progress-fill';
    if (isBonus)      fillClass += ' do-progress-fill-bonus';
    if (isClassified) fillClass += ' do-progress-fill-classified';

    var progressRow = '';
    if (obj.type !== OBJECTIVE_TYPES.ELIMINATE_HVT && obj.type !== OBJECTIVE_TYPES.REACH_POSITION && obj.type !== OBJECTIVE_TYPES.CAPTURE_POINT) {
      progressRow = '<div class="do-progress-row">'
        + '<div class="do-progress-track"><div class="' + fillClass + '" style="width:' + fillPct + '%"></div></div>'
        + '<span class="do-progress-txt">' + obj.progress + '/' + obj.target + '</span>'
        + '</div>';
    }

    return '<div class="' + boxClass + '">'
      + '<div class="' + headerClass + '">' + headerLabel + checkMark + '</div>'
      + '<div class="do-body">'
      + '<div class="do-label">' + _esc(labelText) + '</div>'
      + progressRow
      + '</div>'
      + '</div>';
  }

  /* ── Full panel re-render ─────────────────────────────────────────────────── */
  function _render() {
    var panel = _getOrCreatePanel();
    var html  = '';
    html += _renderBox(_primaryObjective, 'primary');
    if (_bonusObjective) html += _renderBox(_bonusObjective, 'bonus');
    if (_hasClassified && (_classifiedUnlocked || (_classifiedObj && (_classifiedObj.complete || _classifiedObj.failed)))) {
      html += _renderBox(_classifiedObj, 'classified');
    }
    panel.innerHTML = html;
  }

  /* ── Show the panel (slide in) ────────────────────────────────────────────── */
  function _showPanel() {
    var panel = _getOrCreatePanel();
    panel.classList.remove('do-hidden');
    panel.style.display = 'block';
    // Re-trigger animation
    panel.style.animation = 'none';
    /* jshint ignore:start */
    void panel.offsetWidth; // reflow
    /* jshint ignore:end */
    panel.style.animation = '';
    _render();
  }

  /* ── Hide the panel (slide out) ───────────────────────────────────────────── */
  function _hidePanel() {
    if (!_panelEl) return;
    _panelEl.classList.add('do-hidden');
    var el = _panelEl;
    setTimeout(function () {
      if (el && el.parentNode) el.style.display = 'none';
    }, 400);
  }

  /* ── Full-screen banner queue ─────────────────────────────────────────────── */
  function _showBanner(text, styleClass, duration) {
    _bannerQueue.push({ text: text, styleClass: styleClass || 'do-banner-gold', duration: duration || 3000 });
    if (!_bannerActive) _nextBanner();
  }

  function _nextBanner() {
    if (_bannerQueue.length === 0) { _bannerActive = false; return; }
    _bannerActive = true;
    var item = _bannerQueue.shift();
    var el = _getOrCreateBanner();
    el.textContent = item.text;
    el.className   = item.styleClass;
    el.style.display = 'block';
    el.style.opacity = '1';
    setTimeout(function () {
      el.style.transition = 'opacity 0.4s';
      el.style.opacity = '0';
      setTimeout(function () {
        el.style.display = 'none';
        el.style.transition = '';
        _nextBanner();
      }, 420);
    }, item.duration);
  }

  /* ── HTML escape ──────────────────────────────────────────────────────────── */
  function _esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── Add score + XP to player via game globals ────────────────────────────── */
  function _awardScore(score, xp) {
    try {
      if (window.GameManager && GameManager._addScore) {
        GameManager._addScore(score);
      } else if (window.GameManager && GameManager.player) {
        GameManager.player.score = (GameManager.player.score || 0) + score;
        if (window.HUD && HUD.setScore) HUD.setScore(GameManager.player.score);
      }
    } catch (e) {}
    try {
      if (window.Progression && Progression.addXP) Progression.addXP(xp);
    } catch (e) {}
    try {
      if (window.HUD && HUD.showStreakBanner) HUD.showStreakBanner('+' + score + ' BONUS SCORE', score);
    } catch (e) {}
  }

  /* ── Award dog tag (classified reward) ────────────────────────────────────── */
  function _awardDogTag(label) {
    try {
      if (window.DogTags && DogTags.awardSpecial) DogTags.awardSpecial(label || 'CLASSIFIED OP');
    } catch (e) {}
  }

  /* ── Build objective object ───────────────────────────────────────────────── */
  function _makeObjective(type, label, target, progress) {
    return {
      type:     type,
      label:    label,
      target:   target   || 0,
      progress: progress || 0,
      complete: false,
      failed:   false
    };
  }

  /* ── Wave-to-objective mapping ────────────────────────────────────────────── */
  function _buildPrimaryForWave(waveNum, enemyCount) {
    var killTarget = enemyCount || Math.max(5, 5 + waveNum * 2);
    // Boss wave: multiples of 10, or wave 10+
    if (waveNum > 0 && waveNum % 10 === 0) {
      return _makeObjective(
        OBJECTIVE_TYPES.ELIMINATE_HVT,
        'Eliminate the High Value Target',
        1, 0
      );
    }
    // All other waves: kill count primary
    return _makeObjective(
      OBJECTIVE_TYPES.KILL_COUNT,
      'Eliminate ' + killTarget + ' enemies',
      killTarget, 0
    );
  }

  function _buildBonusForWave(waveNum) {
    if (waveNum <= 2) {
      // No bonus for first waves — bonus is added mid-wave at 50%
      return null;
    }
    if (waveNum <= 4) {
      return _makeObjective(OBJECTIVE_TYPES.HEADSHOT_COUNT, 'Land 5 headshots', 5, 0);
    }
    if (waveNum <= 6) {
      _surviveTarget = 30 + waveNum * 5;
      return _makeObjective(OBJECTIVE_TYPES.SURVIVE_TIME, 'Survive for ' + _surviveTarget + ' seconds', _surviveTarget, 0);
    }
    // wave 7+
    return _makeObjective(OBJECTIVE_TYPES.KILL_STREAK, 'Achieve a 3-kill streak for +500 score', 3, 0);
  }

  function _buildMidWaveBonus(waveNum) {
    // Added dynamically at 50% kills
    if (waveNum <= 2) {
      return _makeObjective(OBJECTIVE_TYPES.KILL_STREAK, 'BONUS: Achieve 3-kill streak for +500 score', 3, 0);
    }
    if (waveNum <= 4) {
      return _makeObjective(OBJECTIVE_TYPES.HEADSHOT_COUNT, 'BONUS: Land 3 headshots for +500 score', 3, 0);
    }
    if (waveNum <= 6) {
      _surviveTarget = 20 + waveNum * 3;
      return _makeObjective(OBJECTIVE_TYPES.SURVIVE_TIME, 'BONUS: Survive ' + _surviveTarget + 's under pressure for +500 score', _surviveTarget, 0);
    }
    return _makeObjective(OBJECTIVE_TYPES.KILL_STREAK, 'BONUS: 3-kill streak for +500 score', 3, 0);
  }

  function _buildClassifiedForWave(waveNum) {
    return {
      type:      'CLASSIFIED',
      label:     'Land a headshot from beyond 40m',
      target:    1,
      progress:  0,
      complete:  false,
      failed:    false,
      reward:    { score: 1000, tag: 'CLASSIFIED OP WAVE ' + waveNum }
    };
  }

  /* ── Start survive-time ticker ────────────────────────────────────────────── */
  function _startSurviveTimer() {
    _stopSurviveTimer();
    _surviveTimer = 0;
    _timeIntervalId = setInterval(function () {
      if (!_bonusObjective || _bonusObjective.complete || _bonusObjective.failed) {
        _stopSurviveTimer();
        return;
      }
      if (_bonusObjective.type !== OBJECTIVE_TYPES.SURVIVE_TIME) {
        _stopSurviveTimer();
        return;
      }
      _surviveTimer++;
      _bonusObjective.progress = _surviveTimer;
      if (_surviveTimer >= _surviveTarget) {
        _completeObjective('bonus');
      } else {
        _render();
        if (window._onTimeForObjective) {
          try { window._onTimeForObjective(_surviveTimer, _surviveTarget); } catch (e) {}
        }
      }
    }, 1000);
  }

  function _stopSurviveTimer() {
    if (_timeIntervalId !== null) {
      clearInterval(_timeIntervalId);
      _timeIntervalId = null;
    }
  }

  /* ── Complete objective helper ────────────────────────────────────────────── */
  function _completeObjective(role) {
    var obj = role === 'primary' ? _primaryObjective
            : role === 'bonus'   ? _bonusObjective
            :                      _classifiedObj;
    if (!obj || obj.complete) return;
    obj.complete  = true;
    obj.progress  = obj.target;
    _render();

    if (role === 'bonus') {
      _stopSurviveTimer();
      _awardScore(500, 50);
      _showBanner('★ BONUS COMPLETE ★', 'do-banner-gold', 3000);
    } else if (role === 'classified') {
      _awardScore(1000, 100);
      _awardDogTag(obj.reward ? obj.reward.tag : 'CLASSIFIED OP');
      _showBanner('★ CLASSIFIED OBJECTIVE COMPLETE ★', 'do-banner-purple', 3500);
    } else if (role === 'primary') {
      // Check for "perfect mission" (primary + bonus + classified all complete)
      var bonusDone      = !_bonusObjective   || _bonusObjective.complete;
      var classifiedDone = !_hasClassified    || !_classifiedUnlocked || (_classifiedObj && _classifiedObj.complete);
      if (bonusDone && classifiedDone) {
        _awardScore(1500, 150);
        _showBanner('+1500 BONUS SCORE — PERFECT MISSION', 'do-banner-green', 4000);
      }
    }
  }

  /* ── Kill handling (called from game-manager hook) ────────────────────────── */
  function onKill(enemy, isHeadshot, streak) {
    if (!_primaryObjective || _primaryObjective.complete) return;

    // Primary: kill count
    if (_primaryObjective.type === OBJECTIVE_TYPES.KILL_COUNT && !_primaryObjective.failed) {
      _primaryObjective.progress = Math.min(_primaryObjective.target, _primaryObjective.progress + 1);
      if (_primaryObjective.progress >= _primaryObjective.target) {
        _completeObjective('primary');
      }
    }

    // Primary: HVT — game must mark enemy.isHVT = true
    if (_primaryObjective.type === OBJECTIVE_TYPES.ELIMINATE_HVT && enemy && enemy.isHVT) {
      _primaryObjective.progress = 1;
      _completeObjective('primary');
    }

    // Mid-wave bonus trigger: add at 50% kills
    if (!_midBonusTriggered && _primaryObjective.type === OBJECTIVE_TYPES.KILL_COUNT
        && _waveEnemyCount > 0
        && _primaryObjective.progress >= Math.ceil(_waveEnemyCount * 0.5)) {
      _midBonusTriggered = true;
      if (!_bonusObjective) {
        _bonusObjective = _buildMidWaveBonus(_waveNum);
        if (_bonusObjective && _bonusObjective.type === OBJECTIVE_TYPES.SURVIVE_TIME) {
          _startSurviveTimer();
        }
        _render();
        _showBanner('BONUS OBJECTIVE ADDED!', 'do-banner-gold', 2500);
      }
    }

    // Bonus: headshot count
    if (_bonusObjective && !_bonusObjective.complete && !_bonusObjective.failed
        && _bonusObjective.type === OBJECTIVE_TYPES.HEADSHOT_COUNT && isHeadshot) {
      _bonusObjective.progress = Math.min(_bonusObjective.target, _bonusObjective.progress + 1);
      if (_bonusObjective.progress >= _bonusObjective.target) {
        _completeObjective('bonus');
      }
    }

    // Bonus: kill streak
    if (_bonusObjective && !_bonusObjective.complete && !_bonusObjective.failed
        && _bonusObjective.type === OBJECTIVE_TYPES.KILL_STREAK) {
      var currentStreak = (streak !== undefined && streak !== null) ? streak : 0;
      if (currentStreak > _bonusObjective.progress) {
        _bonusObjective.progress = currentStreak;
      }
      if (_bonusObjective.progress >= _bonusObjective.target) {
        _completeObjective('bonus');
      }
    }

    // Classified: long-range headshot trigger
    if (_hasClassified && !_classifiedUnlocked && !_classifiedObj.complete) {
      var killDist = 0;
      try {
        if (enemy && enemy.mesh && window.GameManager && GameManager.player) {
          killDist = enemy.mesh.position.distanceTo(GameManager.player.position);
        }
      } catch (e) {}
      if (isHeadshot && killDist >= 40) {
        _classifiedUnlocked = true;
        _classifiedObj.progress = 1;
        _completeObjective('classified');
        _render();
        _showBanner('★ CLASSIFIED OBJECTIVE UNLOCKED ★', 'do-banner-purple', 3500);
      }
    }

    _render();
  }

  /* ── Public: setObjective (manual override) ──────────────────────────────── */
  function setObjective(role, type, label, target, progress) {
    var obj = _makeObjective(type || '', label || '', target || 0, progress || 0);
    if (role === 'primary') {
      _primaryObjective = obj;
    } else if (role === 'bonus') {
      _bonusObjective = obj;
    }
    _render();
  }

  /* ── Public: completeObjective ────────────────────────────────────────────── */
  function completeObjective(role) {
    _completeObjective(role);
  }

  /* ── Public: getActive ────────────────────────────────────────────────────── */
  function getActive() {
    return {
      primary:    _primaryObjective,
      bonus:      _bonusObjective,
      classified: _hasClassified ? _classifiedObj : null
    };
  }

  /* ── Public: reset ────────────────────────────────────────────────────────── */
  function reset() {
    _stopSurviveTimer();
    _primaryObjective   = null;
    _bonusObjective     = null;
    _classifiedObj      = null;
    _classifiedUnlocked = false;
    _hasClassified      = false;
    _midBonusTriggered  = false;
    _surviveTimer       = 0;
    _surviveTarget      = 0;
    _waveNum            = 0;
    _waveEnemyCount     = 0;
    _bannerQueue        = [];
    _bannerActive       = false;
    if (_panelEl) { _panelEl.innerHTML = ''; _panelEl.style.display = 'none'; }
  }

  /* ── Public: init — called at each wave start ─────────────────────────────── */
  function init(waveNum, enemyCount) {
    _injectStyles();
    _stopSurviveTimer();

    _waveNum        = waveNum  || 1;
    _waveEnemyCount = enemyCount || 0;
    _midBonusTriggered  = false;
    _classifiedUnlocked = false;
    _bannerQueue        = [];
    _bannerActive       = false;

    // Build primary
    _primaryObjective = _buildPrimaryForWave(_waveNum, _waveEnemyCount);

    // Build bonus (if wave >= 3; waves 1-2 get bonus added dynamically at 50%)
    if (_waveNum >= 3) {
      _bonusObjective = _buildBonusForWave(_waveNum);
      if (_bonusObjective && _bonusObjective.type === OBJECTIVE_TYPES.SURVIVE_TIME) {
        _startSurviveTimer();
      }
    } else {
      _bonusObjective = null;
    }

    // 10% chance of classified objective
    _hasClassified = (Math.random() < 0.10);
    if (_hasClassified) {
      _classifiedObj = _buildClassifiedForWave(_waveNum);
    } else {
      _classifiedObj = null;
    }

    // Install global kill hook
    window._onKillForObjective = function (enemy, isHeadshot, streak) {
      onKill(enemy, isHeadshot, streak);
    };

    // Time hook (for external time-of-day or survive-time polling)
    window._onTimeForObjective = null;

    _showPanel();
  }

  /* ── Public: update — called each game frame (optional) ──────────────────── */
  function update(dt) {
    // Survive-time is handled via setInterval; nothing extra needed per-frame.
    // This hook is available for future objectives needing per-frame checks.
  }

  /* ── Public API ──────────────────────────────────────────────────────────── */
  return {
    init:             init,
    update:           update,
    setObjective:     setObjective,
    completeObjective: completeObjective,
    getActive:        getActive,
    reset:            reset,
    onKill:           onKill,
    // Expose constants for external use
    TYPES:            OBJECTIVE_TYPES
  };

})();
;
} catch(_e){ if(window.console&&console.warn)console.warn("mod fail dynamic-objectives.js",_e&&_e.message); }
