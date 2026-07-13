window.VehicleDamage = (function () {
  'use strict';

  // ── constants ──────────────────────────────────────────────────────────────
  var ZONE_HP = {
    ENGINE: 80,
    FUEL:   60,
    AMMO:   100,
    TRACK_L: 50,
    TRACK_R: 50,
    CREW:   70
  };

  var TOTAL_BASE_HP = 460; // sum of all zone HPs

  // ── module state ───────────────────────────────────────────────────────────
  var _scene       = null;
  var _camera      = null;
  var _vehicleStates = {};   // keyed by vehicle id
  var _hudCanvas   = null;
  var _hudCtx      = null;
  var _activeId    = null;   // vehicle the local player is riding

  // ── helpers ────────────────────────────────────────────────────────────────
  function _makeId(vehicle) {
    if (!vehicle._dmgId) {
      vehicle._dmgId = 'v_' + Math.random().toString(36).slice(2);
    }
    return vehicle._dmgId;
  }

  function _totalHP(state) {
    return state.zones.ENGINE + state.zones.FUEL + state.zones.AMMO +
           state.zones.TRACK_L + state.zones.TRACK_R + state.zones.CREW;
  }

  function _totalHPPct(state) {
    return _totalHP(state) / TOTAL_BASE_HP;
  }

  // ── state factory ──────────────────────────────────────────────────────────
  function _createState(vehicle) {
    return {
      vehicle:       vehicle,
      zones: {
        ENGINE:  ZONE_HP.ENGINE,
        FUEL:    ZONE_HP.FUEL,
        AMMO:    ZONE_HP.AMMO,
        TRACK_L: ZONE_HP.TRACK_L,
        TRACK_R: ZONE_HP.TRACK_R,
        CREW:    ZONE_HP.CREW
      },
      fires:           [],   // { mesh, light, age }
      smokeParticles:  [],   // { mesh, vel, age }
      fireParticles:   [],
      cookOffCount:    0,
      cookOffTimer:    0,
      cookOffInterval: 3 + Math.random() * 5,
      hullBreaches:    [],   // { mesh }
      ejectedCrew:     [],   // { mesh, vel }
      destroyed:       false,
      crewSlumped:     false,
      trackLBroken:    false,
      trackRBroken:    false
    };
  }

  // ── zone detection ─────────────────────────────────────────────────────────
  function _detectZone(vehicle, hitWorldPos) {
    var local = hitWorldPos.clone().sub(vehicle.position);

    // forward is +Z in local space (assumes vehicle faces +Z)
    var forward = local.z;
    var side    = local.x;
    var up      = local.y;

    // Relative bounds (loose classification)
    if (up > 0.8) { return 'CREW'; }
    if (forward > 1.5) { return 'ENGINE'; }   // front
    if (forward < -1.5) { return 'FUEL'; }    // rear
    if (Math.abs(forward) <= 1.5) {
      // center band – check horizontal
      if (side < -0.8) { return 'TRACK_L'; }
      if (side >  0.8) { return 'TRACK_R'; }
      return 'AMMO';
    }
    return 'AMMO';
  }

  // ── armor angling ──────────────────────────────────────────────────────────
  function _angleMultiplier(hitNormal, vehicleNormal) {
    if (!hitNormal || !vehicleNormal) { return 1.0; }
    var dot   = Math.abs(hitNormal.dot(vehicleNormal));
    var angle = Math.acos(Math.min(1, dot)) * (180 / Math.PI);
    return (angle > 30) ? 0.6 : 1.0;
  }

  // ── smoke / fire particle factories ───────────────────────────────────────
  function _spawnSmoke(state, origin) {
    if (!_scene) { return; }
    var geo  = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    var mat  = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.7 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin).add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.4, 0.3, (Math.random() - 0.5) * 0.4
    ));
    _scene.add(mesh);
    state.smokeParticles.push({
      mesh: mesh,
      vel:  new THREE.Vector3((Math.random() - 0.5) * 0.05, 0.12, (Math.random() - 0.5) * 0.05),
      age:  0,
      life: 2 + Math.random() * 2
    });
  }

  function _spawnFireParticle(state, origin) {
    if (!_scene) { return; }
    var geo  = new THREE.SphereGeometry(0.12, 4, 4);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin).add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.5, 0.1, (Math.random() - 0.5) * 0.5
    ));
    _scene.add(mesh);
    state.fireParticles.push({
      mesh: mesh,
      vel:  new THREE.Vector3((Math.random() - 0.5) * 0.04, 0.18 + Math.random() * 0.1, (Math.random() - 0.5) * 0.04),
      age:  0,
      life: 0.8 + Math.random()
    });
  }

  // ── effects helpers ────────────────────────────────────────────────────────
  function _addFuelFire(state) {
    if (!_scene || state.fuelFireLight) { return; }
    var vehicle = state.vehicle;
    var firePos = vehicle.position.clone().add(new THREE.Vector3(0, 1, -2));

    var light       = new THREE.PointLight(0xff4400, 2, 8);
    light.position.copy(firePos);
    _scene.add(light);
    state.fuelFireLight = light;
    state.fuelFirePos   = firePos;
  }

  function _removeFuelFire(state) {
    if (state.fuelFireLight && _scene) {
      _scene.remove(state.fuelFireLight);
      state.fuelFireLight = null;
    }
  }

  function _applyTrackBreak(state, side) {
    var vehicle = state.vehicle;
    if (!vehicle) { return; }
    var key = (side === 'L') ? 'trackLMesh' : 'trackRMesh';
    var mesh = vehicle[key];
    if (mesh && mesh.material) {
      mesh.material.transparent = true;
      mesh.material.opacity     = 0.3;
      // jagged appearance via scale distortion
      mesh.scale.y = 0.3;
    }
  }

  function _slumpCrew(state) {
    var vehicle = state.vehicle;
    if (!vehicle || !vehicle.crewMeshes || vehicle.crewMeshes.length === 0) { return; }
    var crewMesh = vehicle.crewMeshes[0];
    if (crewMesh) {
      crewMesh.rotation.x += 0.8;
    }
    state.crewSlumped = true;
  }

  function _addHullBreach(state, hitPos) {
    if (!_scene) { return; }
    var geo  = new THREE.BoxGeometry(0.2, 0.2, 0.05);
    var mat  = new THREE.MeshBasicMaterial({ color: 0x111111 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(hitPos);
    _scene.add(mesh);
    state.hullBreaches.push({ mesh: mesh });
  }

  function _spawnExplosion(pos, scale) {
    if (!_scene) { return; }
    scale = scale || 1;
    var geo  = new THREE.SphereGeometry(0.6 * scale, 8, 8);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.85 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos).add(new THREE.Vector3(
      (Math.random() - 0.5) * scale, scale * 0.5, (Math.random() - 0.5) * scale
    ));
    _scene.add(mesh);
    // auto-remove after 600 ms
    var start = Date.now();
    var ticker = function () {
      var age = (Date.now() - start) / 1000;
      if (age > 0.6) {
        _scene.remove(mesh);
        return;
      }
      mesh.material.opacity = 0.85 * (1 - age / 0.6);
      mesh.scale.setScalar(1 + age * 3);
      requestAnimationFrame(ticker);
    };
    requestAnimationFrame(ticker);
  }

  function _catastrophicKill(state) {
    if (!_scene) { return; }
    var vehicle = state.vehicle;
    var pos     = vehicle.position.clone();

    // large fireball
    _spawnExplosion(pos, 3);

    // turret tumble
    if (vehicle.turretMesh) {
      var turret = vehicle.turretMesh;
      var vel    = new THREE.Vector3(
        (Math.random() - 0.5) * 4, 6 + Math.random() * 3, (Math.random() - 0.5) * 4
      );
      var rot    = new THREE.Vector3(
        (Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)
      ).normalize().multiplyScalar(0.1);
      state.ejectedTurret    = { mesh: turret, vel: vel, rotVel: rot };
      state.turretEjected    = true;
    }

    // eject 2 crew cylinders
    var i;
    for (i = 0; i < 2; i++) {
      var cGeo  = new THREE.CylinderGeometry(0.15, 0.15, 0.7, 6);
      var cMat  = new THREE.MeshLambertMaterial({ color: 0x556644 });
      var cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.position.copy(pos).add(new THREE.Vector3((i === 0 ? -0.5 : 0.5), 1.2, 0));
      _scene.add(cMesh);
      state.ejectedCrew.push({
        mesh: cMesh,
        vel:  new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          5 + Math.random() * 3,
          (Math.random() - 0.5) * 6
        )
      });
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _ensureHUD() {
    if (_hudCanvas) { return; }
    _hudCanvas = document.createElement('canvas');
    _hudCanvas.id     = 'vd-hud';
    _hudCanvas.width  = 220;
    _hudCanvas.height = 170;
    _hudCanvas.style.cssText =
      'position:fixed;bottom:10px;left:10px;z-index:9999;background:rgba(0,0,0,0.55);border:1px solid #444;border-radius:4px;';
    document.body.appendChild(_hudCanvas);
    _hudCtx = _hudCanvas.getContext('2d');
  }

  function _zoneColor(hp, base) {
    var pct = hp / base;
    if (pct > 0.6) { return '#00cc44'; }
    if (pct > 0.3) { return '#ffaa00'; }
    return '#cc2200';
  }

  function _drawHUD(state) {
    if (!_hudCtx) { return; }
    var ctx = _hudCtx;
    ctx.clearRect(0, 0, 220, 170);

    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 11px monospace';
    ctx.fillText('VEHICLE DAMAGE', 10, 18);

    var zones = [
      { label: 'ENGINE',   key: 'ENGINE',  base: ZONE_HP.ENGINE,  x: 10,  y: 30  },
      { label: 'FUEL',     key: 'FUEL',    base: ZONE_HP.FUEL,    x: 10,  y: 50  },
      { label: 'AMMO',     key: 'AMMO',    base: ZONE_HP.AMMO,    x: 10,  y: 70  },
      { label: 'TRACK L',  key: 'TRACK_L', base: ZONE_HP.TRACK_L, x: 10,  y: 90  },
      { label: 'TRACK R',  key: 'TRACK_R', base: ZONE_HP.TRACK_R, x: 10,  y: 110 },
      { label: 'CREW',     key: 'CREW',    base: ZONE_HP.CREW,    x: 10,  y: 130 }
    ];

    var i;
    for (i = 0; i < zones.length; i++) {
      var z  = zones[i];
      var hp = state.zones[z.key];
      ctx.fillStyle = _zoneColor(hp, z.base);
      ctx.fillRect(z.x, z.y, Math.round(100 * hp / z.base), 14);
      ctx.fillStyle = '#ffffff';
      ctx.font      = '10px monospace';
      ctx.fillText(z.label + ': ' + Math.max(0, Math.round(hp)), z.x + 2, z.y + 11);
    }

    // overall HP bar
    ctx.fillStyle = '#555';
    ctx.fillRect(10, 150, 200, 12);
    var pct = _totalHPPct(state);
    ctx.fillStyle = _zoneColor(pct * TOTAL_BASE_HP, TOTAL_BASE_HP);
    ctx.fillRect(10, 150, Math.round(200 * pct), 12);
    ctx.fillStyle = '#fff';
    ctx.font      = '9px monospace';
    ctx.fillText('HULL ' + Math.round(pct * 100) + '%', 12, 160);
  }

  // ── public API ─────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene       = scene;
    _camera      = camera;
    _vehicleStates = {};
    _ensureHUD();
  }

  function applyHit(vehicle, hitWorldPos, damage, hitNormal, vehicleNormal) {
    if (!vehicle) { return; }
    var id = _makeId(vehicle);
    if (!_vehicleStates[id]) {
      _vehicleStates[id] = _createState(vehicle);
    }
    var state = _vehicleStates[id];
    if (state.destroyed) { return; }

    // armor angling
    var mult  = _angleMultiplier(hitNormal, vehicleNormal);
    var zone  = _detectZone(vehicle, hitWorldPos);
    var dmg   = damage * mult;

    state.zones[zone] = Math.max(0, state.zones[zone] - dmg);

    // per-zone effects
    if (zone === 'ENGINE') {
      // smoke spawned each hit; engine-speed handled in update
      _spawnSmoke(state, vehicle.position.clone().add(new THREE.Vector3(0, 1.2, 2)));
    }

    if (zone === 'FUEL' && state.zones.FUEL < ZONE_HP.FUEL * 0.3) {
      _addFuelFire(state);
    }

    if (zone === 'AMMO' && state.zones.AMMO <= 0 && !state.cookOffStarted) {
      state.cookOffStarted  = true;
      state.cookOffTimer    = state.cookOffInterval;
    }

    if (zone === 'TRACK_L' && !state.trackLBroken) {
      state.trackLBroken = true;
      _applyTrackBreak(state, 'L');
    }
    if (zone === 'TRACK_R' && !state.trackRBroken) {
      state.trackRBroken = true;
      _applyTrackBreak(state, 'R');
    }

    if (zone === 'CREW' && state.zones.CREW < ZONE_HP.CREW * 0.5 && !state.crewSlumped) {
      _slumpCrew(state);
    }

    // hull breach
    if (_totalHPPct(state) < 0.25) {
      _addHullBreach(state, hitWorldPos);
    }

    // catastrophic kill
    if (_totalHP(state) <= 0 && !state.destroyed) {
      state.destroyed = true;
      _catastrophicKill(state);
      _removeFuelFire(state);
    }
  }

  function update(dt) {
    // sync with external vehicle arrays
    var externalVehicles = (window._activeVehicles || []);
    var i;
    for (i = 0; i < externalVehicles.length; i++) {
      var veh = externalVehicles[i];
      var id  = _makeId(veh);
      if (!_vehicleStates[id]) {
        _vehicleStates[id] = _createState(veh);
      }
    }

    // iterate all tracked states
    var ids = Object.keys(_vehicleStates);
    var j;
    for (j = 0; j < ids.length; j++) {
      var state   = _vehicleStates[ids[j]];
      var vehicle = state.vehicle;

      if (state.destroyed) {
        _updateEjected(state, dt);
        continue;
      }

      // engine speed modifier
      var engPct = state.zones.ENGINE / ZONE_HP.ENGINE;
      if (vehicle.speedMultiplier !== undefined) {
        if (state.zones.ENGINE <= 0) {
          vehicle.speedMultiplier = 0;
        } else if (engPct < 0.5) {
          vehicle.speedMultiplier = 0.7;
        } else {
          vehicle.speedMultiplier = 1.0;
        }
      }

      // track veer
      if (state.trackLBroken && !state.trackRBroken && vehicle.steerOffset !== undefined) {
        vehicle.steerOffset = -0.015;
      } else if (state.trackRBroken && !state.trackLBroken && vehicle.steerOffset !== undefined) {
        vehicle.steerOffset = 0.015;
      }

      // fuel fire: hull damage over time + particles
      if (state.fuelFireLight) {
        state.zones.FUEL    = Math.max(0, state.zones.FUEL - 5 * dt);
        // spread fire damage to hull proxy (CREW zone)
        state.zones.CREW    = Math.max(0, state.zones.CREW - 5 * dt);
        state.fuelFireAge   = (state.fuelFireAge || 0) + dt;
        if (state.fuelFireAge > 0.15) {
          _spawnFireParticle(state, state.fuelFirePos);
          state.fuelFireAge = 0;
        }
      }

      // smoke particles
      _updateParticles(state.smokeParticles, dt, _scene);

      // fire particles
      _updateParticles(state.fireParticles, dt, _scene);

      // ammo cook-off
      if (state.cookOffStarted && state.cookOffCount < 4) {
        state.cookOffTimer -= dt;
        if (state.cookOffTimer <= 0) {
          state.cookOffCount++;
          _spawnExplosion(vehicle.position.clone(), 2);
          // damage nearby zones
          state.zones.ENGINE = Math.max(0, state.zones.ENGINE - 20);
          state.zones.FUEL   = Math.max(0, state.zones.FUEL   - 20);
          state.zones.CREW   = Math.max(0, state.zones.CREW   - 20);
          state.cookOffTimer = 3 + Math.random() * 5;
          // check catastrophic after cook-off
          if (_totalHP(state) <= 0 && !state.destroyed) {
            state.destroyed = true;
            _catastrophicKill(state);
            _removeFuelFire(state);
          }
        }
      }

      // update HUD for active vehicle
      if (_activeId && _activeId === ids[j]) {
        _drawHUD(state);
      }
    }

    // hide HUD if no active vehicle
    if (!_activeId && _hudCanvas) {
      _hudCtx.clearRect(0, 0, 220, 170);
    }
  }

  function _updateParticles(list, dt, scene) {
    var i = list.length - 1;
    while (i >= 0) {
      var p = list[i];
      p.age += dt;
      if (p.age >= p.life) {
        if (scene) { scene.remove(p.mesh); }
        list.splice(i, 1);
      } else {
        p.mesh.position.addScaledVector(p.vel, dt * 60);
        p.mesh.material.opacity = Math.max(0, p.mesh.material.opacity - dt * 0.3);
      }
      i--;
    }
  }

  function _updateEjected(state, dt) {
    var gravity = -9.8;
    var i;
    for (i = 0; i < state.ejectedCrew.length; i++) {
      var ec = state.ejectedCrew[i];
      ec.vel.y += gravity * dt;
      ec.mesh.position.addScaledVector(ec.vel, dt);
    }
    if (state.ejectedTurret) {
      var et = state.ejectedTurret;
      et.vel.y += gravity * dt;
      et.mesh.position.addScaledVector(et.vel, dt);
      et.mesh.rotation.x += et.rotVel.x;
      et.mesh.rotation.y += et.rotVel.y;
      et.mesh.rotation.z += et.rotVel.z;
    }
  }

  function setActiveVehicle(vehicleId) {
    _activeId = vehicleId;
    if (_hudCanvas) {
      _hudCanvas.style.display = vehicleId ? 'block' : 'none';
    }
  }

  function report() {
    var result = {};
    var ids    = Object.keys(_vehicleStates);
    var i;
    for (i = 0; i < ids.length; i++) {
      var state = _vehicleStates[ids[i]];
      result[ids[i]] = {
        zones:       JSON.parse(JSON.stringify(state.zones)),
        destroyed:   state.destroyed,
        totalHPPct:  _totalHPPct(state),
        cookOffCount: state.cookOffCount,
        fuelFire:    !!state.fuelFireLight,
        crewSlumped: state.crewSlumped
      };
    }
    return result;
  }

  function reset() {
    // remove all scene objects
    var ids = Object.keys(_vehicleStates);
    var i;
    for (i = 0; i < ids.length; i++) {
      var state = _vehicleStates[ids[i]];
      var j;
      for (j = 0; j < state.smokeParticles.length; j++) {
        if (_scene) { _scene.remove(state.smokeParticles[j].mesh); }
      }
      for (j = 0; j < state.fireParticles.length; j++) {
        if (_scene) { _scene.remove(state.fireParticles[j].mesh); }
      }
      for (j = 0; j < state.hullBreaches.length; j++) {
        if (_scene) { _scene.remove(state.hullBreaches[j].mesh); }
      }
      for (j = 0; j < state.ejectedCrew.length; j++) {
        if (_scene) { _scene.remove(state.ejectedCrew[j].mesh); }
      }
      _removeFuelFire(state);
    }
    _vehicleStates = {};
    _activeId      = null;
    if (_hudCanvas) {
      _hudCtx.clearRect(0, 0, 220, 170);
    }
  }

  // expose _vehicleDamage.report() alias expected by BattleDamageAssessment
  window._vehicleDamage = { report: report };

  return {
    init:             init,
    update:           update,
    reset:            reset,
    applyHit:         applyHit,
    setActiveVehicle: setActiveVehicle,
    report:           report
  };
})();
