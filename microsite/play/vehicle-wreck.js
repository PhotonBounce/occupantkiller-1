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
