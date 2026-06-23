/* ═══════════════════════════════════════════════════════════════════════════
   VEHICLE CONVOY — Multi-vehicle escort mission with route protection,
   ambush response, IED threat, and convoy integrity scoring.
   ───────────────────────────────────────────────────────────────────────────
   Convoy composition (4 vehicles in column):
     [0] Lead Humvee      — box 3×2×1.5, olive 0x4A5240, HP 200
     [1] Cargo Truck A    — cab 2×2×2.5 + flatbed 5×1×2, HP 300
     [2] Cargo Truck B    — same geometry, HP 300
     [3] Trail Humvee     — same as lead, HP 200

   Route: 8 waypoints forming a Z-shape across the map.
   Player: escort on foot or board any vehicle (press E within 3 units).
   Spacing: 3-unit gap; if lead stops, all stop within 2 s.
   Ambush events: enemies spawn at 3 predetermined waypoint intervals.
   IED: one route segment has a buried IED — defuse or boom.
   Scoring:
     vehicles delivered × 250 = base (max 1000)
     +200 bonus if all 4 delivered with no damage (intact)
     -100 per crew KIA (2 per destroyed Humvee = up to -400)

   Public API  window.VehicleConvoy = { init(scene, camera), update(dt), reset() }
   ═══════════════════════════════════════════════════════════════════════════ */
window.VehicleConvoy = (function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────────────────── */
  var CONVOY_SPEED         = 4;      // units/s normal travel
  var VEHICLE_SPACING      = 3;      // gap between vehicles
  var WP_REACH             = 4;      // distance to advance waypoint
  var STOP_PROPAGATION_T   = 2.0;    // seconds for full convoy to halt after lead stops
  var BOARD_RANGE          = 3;      // units — press E within this to board
  var HUMVEE_HP            = 200;
  var TRUCK_HP             = 300;
  var IED_SEGMENT          = 4;      // IED appears between waypoint 4→5
  var IED_TRIGGER_DIST     = 2.5;    // vehicle drives over IED within this radius
  var IED_DEFUSE_DIST      = 2.0;    // player must be within this to defuse
  var IED_EXPLOSION_RANGE  = 8;
  var IED_EXPLOSION_DAMAGE = 120;
  var AMBUSH_WP            = [2, 4, 6]; // waypoint indices that trigger ambush
  var AMBUSH_ENEMY_COUNT   = 3;      // 2-4 enemies per ambush (set per wave)
  var AMBUSH_HOLD_DIST     = 30;     // convoy stops if enemies within this range
  var CREW_PER_HUMVEE      = 2;      // simulated crew KIA per destroyed Humvee
  var SCORE_PER_VEHICLE    = 250;
  var SCORE_BONUS_INTACT   = 200;
  var SCORE_CREW_KIA       = -100;
  var OLIVE                = 0x4A5240;

  /* ── Z-shape Route: 8 waypoints ─────────────────────────────────────── */
  var WAYPOINTS = [
    { x: -80, z: -60 },   // WP 0 — start, far left
    { x: -30, z: -60 },   // WP 1 — move right
    { x:  30, z: -20 },   // WP 2 — diagonal cross (ambush!)
    { x:  80, z: -20 },   // WP 3 — far right mid
    { x:  80, z:  20 },   // WP 4 — same right, shift depth (IED here→5)
    { x: -30, z:  20 },   // WP 5 — diagonal cross (ambush!)
    { x: -80, z:  60 },   // WP 6 — far left far (ambush!)
    { x:   0, z:  60 },   // WP 7 — extraction zone
  ];

  /* ── Module state ───────────────────────────────────────────────────────── */
  var _scene       = null;
  var _camera      = null;
  var _inited      = false;

  /* Convoy state */
  var _vehicles    = [];   // array of vehicle objects
  var _wpIndex     = 0;    // leader's current target waypoint
  var _missionDone = false;
  var _missionStarted = false;

  /* Boarding */
  var _boardedVehicleIdx = -1;  // which vehicle player is riding (-1 = none)

  /* Convoy halt */
  var _leadStopped        = false;
  var _stopPropagateTimer = 0;
  var _haltReason         = '';  // 'ambush' | 'ied' | ''
  var _convoyHalted       = false;

  /* Ambush state */
  var _ambushTriggered = [false, false, false]; // per AMBUSH_WP entry
  var _activeEnemies   = [];   // { mesh, hp, pos, fireCooldown, dead }
  var _ambushActive    = false;

  /* IED state */
  var _iedSpawned    = false;
  var _iedDefused    = false;
  var _iedDetonated  = false;
  var _iedMesh       = null;
  var _iedPos        = null;   // THREE.Vector3

  /* Scoring */
  var _crewKIA         = 0;
  var _vehiclesIntact  = [true, true, true, true]; // starts all intact

  /* HUD elements */
  var _hudEl           = null;
  var _miniConvoyEl    = null;
  var _contactEl       = null;
  var _contactTimer    = 0;
  var _defusePromptEl  = null;

  /* Particle/fire pools */
  var _fires  = [];   // { mesh, age }
  var _smokes = [];   // { mesh, vy, life, age }

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════════════ */

  function _getScene() { return _scene || window._gameScene || null; }
  function _getCamera() { return _camera || window._camera || null; }

  function _getPlayerPos() {
    if (window.GameManager && window.GameManager.getPlayerPosition) return window.GameManager.getPlayerPosition();
    if (window._playerPos) return window._playerPos;
    if (window.player && window.player.position) return window.player.position;
    var cam = _getCamera();
    return cam ? cam.position : null;
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3D(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _terrainY(x, z) {
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
        return VoxelWorld.getTerrainHeight(x, z) || 0;
      }
    } catch (e) {}
    return 0;
  }

  function _lerp(a, b, t) { return a + (b - a) * t; }

  function _lerpAngle(from, to, t) {
    var diff = to - from;
    while (diff > Math.PI)  diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return from + diff * t;
  }

  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    } else {
      console.log('[VehicleConvoy] ' + msg);
    }
  }

  function _addScore(delta) {
    if (window.GameManager && window.GameManager.addScore) {
      window.GameManager.addScore(delta);
    } else if (typeof window._score === 'number') {
      window._score += delta;
    }
  }

  function _playerTakeDamage(amt) {
    if (window.GameManager && window.GameManager.damagePlayer) {
      window.GameManager.damagePlayer(amt);
    } else if (typeof window._playerHP === 'number') {
      window._playerHP = Math.max(0, window._playerHP - amt);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ═══════════════════════════════════════════════════════════════════════ */

  function _mat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function _addWheels(group, w, h, d) {
    var wR  = 0.35;
    var wT  = 0.22;
    var geo = new THREE.CylinderGeometry(wR, wR, wT, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var xO  = w / 2 + wT / 2;
    var yO  = -(h / 2) + wR * 0.8;
    var offsets = [
      { x: -xO, z:  d * 0.3 },
      { x:  xO, z:  d * 0.3 },
      { x: -xO, z: -d * 0.3 },
      { x:  xO, z: -d * 0.3 },
    ];
    var wheels = [];
    for (var i = 0; i < 4; i++) {
      var wm = new THREE.Mesh(geo, mat);
      wm.rotation.z = Math.PI / 2;
      wm.position.set(offsets[i].x, yO, offsets[i].z);
      group.add(wm);
      wheels.push(wm);
    }
    return wheels;
  }

  function _buildHumvee() {
    var group = new THREE.Group();
    /* Body 3×2×1.5 */
    var body = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 1.5), _mat(OLIVE));
    body.castShadow = true;
    group.add(body);
    /* Roof gun mount */
    var turret = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), _mat(0x2a2e28));
    turret.position.set(0, 1.2, 0.2);
    group.add(turret);
    group._wheels = _addWheels(group, 3, 2, 1.5);
    group._bodyH  = 2;
    group._type   = 'humvee';
    return group;
  }

  function _buildCargoTruck() {
    var group = new THREE.Group();
    /* Cab 2×2×2.5 — front */
    var cab = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2.5), _mat(OLIVE));
    cab.position.set(0, 0, -1.75);  // forward
    cab.castShadow = true;
    group.add(cab);
    /* Flatbed 5×1×2 — rear */
    var bed = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 2), _mat(0x3d4035));
    bed.position.set(0, -0.5, 1.5);  // behind cab, lower
    bed.castShadow = true;
    group.add(bed);
    /* Cargo box on bed */
    var cargo = new THREE.Mesh(new THREE.BoxGeometry(4, 1.4, 1.8), _mat(0x5a5e52));
    cargo.position.set(0, 0.7, 1.5);
    group.add(cargo);
    group._wheels = _addWheels(group, 5, 2, 4.5);
    group._bodyH  = 2;
    group._type   = 'truck';
    return group;
  }

  /* ════════════════════════════════════════════════════════════════════════
     VEHICLE OBJECT FACTORY
  ═══════════════════════════════════════════════════════════════════════ */

  function _makeVehicle(role, idx) {
    var mesh, maxHp;
    if (role === 'humvee') {
      mesh  = _buildHumvee();
      maxHp = HUMVEE_HP;
    } else {
      mesh  = _buildCargoTruck();
      maxHp = TRUCK_HP;
    }

    var sc = _getScene();
    if (sc) sc.add(mesh);

    return {
      role:        role,     // 'humvee' or 'truck'
      idx:         idx,      // 0-3
      mesh:        mesh,
      hp:          maxHp,
      maxHp:       maxHp,
      destroyed:   false,
      damageTaken: 0,
      _wheelAngle: 0,
      _heading:    0,        // current facing angle (radians)
      _stopTimer:  0,        // stop propagation timer for this vehicle
      _isStopped:  false,
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     IED
  ═══════════════════════════════════════════════════════════════════════ */

  function _spawnIED() {
    if (_iedSpawned) return;
    var sc = _getScene();
    if (!sc) return;

    /* Place IED midway between WP[IED_SEGMENT] and WP[IED_SEGMENT+1] */
    var wpa = WAYPOINTS[IED_SEGMENT];
    var wpb = WAYPOINTS[IED_SEGMENT + 1];
    var mx  = (wpa.x + wpb.x) / 2;
    var mz  = (wpa.z + wpb.z) / 2;
    var my  = _terrainY(mx, mz);

    _iedPos = new THREE.Vector3(mx, my + 0.05, mz);

    /* Small buried box — darker than terrain */
    var geo = new THREE.BoxGeometry(0.6, 0.15, 0.6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x2a1800, emissive: 0x330000 });
    _iedMesh = new THREE.Mesh(geo, mat);
    _iedMesh.position.copy(_iedPos);
    sc.add(_iedMesh);

    _iedSpawned   = true;
    _iedDefused   = false;
    _iedDetonated = false;
    _toast('IED DETECTED ON ROUTE — defuse before convoy reaches segment 5!');
    window._iedOnRoute = true;
  }

  function _detonateIED(triggerVeh) {
    if (_iedDetonated || _iedDefused) return;
    _iedDetonated = true;
    window._iedOnRoute = false;

    var sc = _getScene();
    if (sc && _iedMesh) sc.remove(_iedMesh);
    _iedMesh = null;

    /* VFX */
    if (_iedPos) {
      _spawnFireAt(_iedPos, 3.0);
      _spawnSmokeAt(_iedPos, 12);
      _spawnExplosionLight(_iedPos, 0xff4400, 12, 25);
    }

    if (window.AudioSystem && window.AudioSystem.playExplosion) {
      window.AudioSystem.playExplosion();
    }
    _toast('IED DETONATED! Vehicle hit!');

    /* Damage the triggering vehicle */
    if (triggerVeh) {
      _damageVehicle(triggerVeh, IED_EXPLOSION_DAMAGE);
    }

    /* Damage player if nearby */
    var pPos = _getPlayerPos();
    if (pPos && _iedPos) {
      var d = _dist3D(pPos, _iedPos);
      if (d < IED_EXPLOSION_RANGE) {
        var dmg = Math.round(IED_EXPLOSION_DAMAGE * (1 - d / IED_EXPLOSION_RANGE));
        _playerTakeDamage(dmg);
      }
    }
  }

  function _defuseIED() {
    if (_iedDefused || _iedDetonated || !_iedSpawned) return;
    _iedDefused = true;
    window._iedOnRoute = false;

    var sc = _getScene();
    if (sc && _iedMesh) sc.remove(_iedMesh);
    _iedMesh = null;

    _toast('IED DEFUSED! Route clear.');
    _addScore(300);
    if (_defusePromptEl) _defusePromptEl.style.display = 'none';
  }

  /* ════════════════════════════════════════════════════════════════════════
     AMBUSH SPAWNING
  ═══════════════════════════════════════════════════════════════════════ */

  function _spawnAmbushAt(wpIdx) {
    var sc = _getScene();
    if (!sc) return;

    var wp    = WAYPOINTS[wpIdx];
    var count = 2 + Math.floor(Math.random() * 3); // 2-4
    var geo   = new THREE.BoxGeometry(0.5, 1.8, 0.5);
    var mat   = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    var wpXZ  = { x: wp.x, z: wp.z };

    /* Spawn from flanks (perpendicular to convoy direction) */
    for (var i = 0; i < count; i++) {
      var side   = (i % 2 === 0) ? 1 : -1;
      var spread = 8 + Math.random() * 6;
      var ex     = wp.x + side * spread;
      var ez     = wp.z + (Math.random() - 0.5) * 10;
      var ey     = _terrainY(ex, ez) + 0.9;

      var m = new THREE.Mesh(geo, mat);
      m.position.set(ex, ey, ez);
      sc.add(m);

      _activeEnemies.push({
        mesh:         m,
        hp:           60,
        fireCooldown: 1 + Math.random() * 2,
        dead:         false,
        wpTarget:     wpXZ,
      });
    }

    _ambushActive = true;
    _convoyHalted = true;
    _haltReason   = 'ambush';

    /* Find direction of enemies relative to convoy */
    var leader = _vehicles[0];
    var dir    = 'FLANK';
    if (leader && !leader.destroyed) {
      var dx = wp.x - leader.mesh.position.x;
      var dz = wp.z - leader.mesh.position.z;
      var a  = Math.atan2(dx, dz) * 180 / Math.PI;
      if (a > -45 && a < 45)        dir = 'NORTH';
      else if (a >= 45 && a < 135)  dir = 'EAST';
      else if (a >= 135 || a < -135) dir = 'SOUTH';
      else                           dir = 'WEST';
    }
    _showContact(dir);
    _toast('CONTACT ' + dir + '! Eliminate hostiles to resume convoy!');

    /* Passengers dismount and crouch (visual: sink vehicle Y slightly) */
    for (var v = 0; v < _vehicles.length; v++) {
      if (!_vehicles[v].destroyed) {
        _vehicles[v]._isStopped = true;
      }
    }
  }

  function _updateAmbushEnemies(dt) {
    if (!_ambushActive) return;

    var pPos   = _getPlayerPos();
    var allDead = true;

    for (var i = 0; i < _activeEnemies.length; i++) {
      var e = _activeEnemies[i];
      if (e.dead) continue;
      allDead = false;

      /* Fire at player */
      if (pPos) {
        e.fireCooldown -= dt;
        var dist = _dist2D(e.mesh.position.x, e.mesh.position.z, pPos.x, pPos.z);
        if (e.fireCooldown <= 0 && dist < 40) {
          e.fireCooldown = 1.5 + Math.random() * 1.5;
          if (Math.random() < 0.25) {
            _playerTakeDamage(12);
          }
        }

        /* Slow advance toward convoy */
        if (dist > 5) {
          var dx = pPos.x - e.mesh.position.x;
          var dz = pPos.z - e.mesh.position.z;
          var dl = Math.sqrt(dx * dx + dz * dz);
          if (dl > 0.01) {
            e.mesh.position.x += (dx / dl) * 1.5 * dt;
            e.mesh.position.z += (dz / dl) * 1.5 * dt;
          }
        }
      }
    }

    if (allDead) {
      _ambushActive  = false;
      _convoyHalted  = false;
      _haltReason    = '';
      /* Resume vehicles */
      for (var vi = 0; vi < _vehicles.length; vi++) {
        _vehicles[vi]._isStopped = false;
        _vehicles[vi]._stopTimer = 0;
      }
      _activeEnemies = [];
      _toast('HOSTILES ELIMINATED — CONVOY RESUMING');
    }
  }

  /* Called by weapons / hit system */
  function damageEnemy(enemyMesh, amount) {
    for (var i = 0; i < _activeEnemies.length; i++) {
      var e = _activeEnemies[i];
      if (e.dead) continue;
      if (e.mesh === enemyMesh) {
        e.hp -= (amount || 10);
        if (e.hp <= 0) {
          e.dead = true;
          var sc = _getScene();
          if (sc) sc.remove(e.mesh);
          _addScore(50);
        }
        break;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     VEHICLE DAMAGE & DESTRUCTION
  ═══════════════════════════════════════════════════════════════════════ */

  function _damageVehicle(veh, amount) {
    if (veh.destroyed) return;
    veh.hp        -= amount;
    veh.damageTaken += amount;
    _vehiclesIntact[veh.idx] = false;

    /* Flash red tint */
    veh.mesh.traverse(function (child) {
      if (child.isMesh && child.material) {
        child.material.emissive = new THREE.Color(0.4, 0, 0);
      }
    });
    setTimeout(function () {
      if (!veh.destroyed) {
        veh.mesh.traverse(function (child) {
          if (child.isMesh && child.material) {
            child.material.emissive = new THREE.Color(0, 0, 0);
          }
        });
      }
    }, 200);

    if (veh.hp <= 0) {
      _destroyVehicle(veh);
    }
  }

  function _destroyVehicle(veh) {
    if (veh.destroyed) return;
    veh.destroyed = true;
    veh.hp        = 0;

    /* VFX */
    var pos = veh.mesh.position;
    _spawnFireAt(pos, 5.0);
    _spawnSmokeAt(pos, 16);
    _spawnExplosionLight(pos, 0xff5500, 10, 20);

    if (window.AudioSystem && window.AudioSystem.playExplosion) {
      window.AudioSystem.playExplosion();
    }

    /* Darken wreck */
    veh.mesh.traverse(function (child) {
      if (child.isMesh) {
        child.material = new THREE.MeshLambertMaterial({ color: 0x111111 });
      }
    });

    if (veh.role === 'humvee') {
      _crewKIA += CREW_PER_HUMVEE;
      _toast('HUMVEE DESTROYED — ' + CREW_PER_HUMVEE + ' CREW KIA!');
    } else {
      _toast('CARGO TRUCK DESTROYED!');
    }

    /* Check if we can bypass wreck — mark convoy to steer around */
    _scheduleBypass(veh);
  }

  function _scheduleBypass(destroyedVeh) {
    /* Mark the destroyed vehicle as a bypass obstacle.
       Followers will receive a lateral offset for 8 s. */
    destroyedVeh._bypassOffset = 5;   // lateral offset units
    destroyedVeh._bypassTimer  = 8;
  }

  /* ════════════════════════════════════════════════════════════════════════
     VFX — fire, smoke, light
  ═══════════════════════════════════════════════════════════════════════ */

  function _spawnFireAt(pos, life) {
    var sc = _getScene();
    if (!sc) return;
    var geo = new THREE.SphereGeometry(0.5 + Math.random() * 0.4, 6, 6);
    var mat = new THREE.MeshBasicMaterial({
      color:       0xff4400,
      transparent: true,
      opacity:     0.9,
    });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(pos.x + (Math.random() - 0.5), pos.y + 0.5, pos.z + (Math.random() - 0.5));
    sc.add(m);
    _fires.push({ mesh: m, age: 0, life: life || 4, mat: mat });
  }

  function _spawnSmokeAt(pos, count) {
    var sc = _getScene();
    if (!sc) return;
    var cnt = count || 8;
    for (var i = 0; i < cnt; i++) {
      var geo = new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 5, 5);
      var mat = new THREE.MeshBasicMaterial({
        color:       0x111111,
        transparent: true,
        opacity:     0.7,
      });
      var m = new THREE.Mesh(geo, mat);
      m.position.set(
        pos.x + (Math.random() - 0.5) * 2,
        pos.y + 0.5 + Math.random(),
        pos.z + (Math.random() - 0.5) * 2
      );
      sc.add(m);
      _smokes.push({
        mesh: m,
        mat:  mat,
        vy:   1.5 + Math.random() * 2,
        life: 2.5 + Math.random() * 1.5,
        age:  0,
      });
    }
  }

  function _spawnExplosionLight(pos, color, intensity, distance) {
    var sc = _getScene();
    if (!sc) return;
    var light = new THREE.PointLight(color || 0xff4400, intensity || 8, distance || 20);
    light.position.set(pos.x, pos.y + 1, pos.z);
    sc.add(light);
    var elapsed = 0;
    var interval = setInterval(function () {
      elapsed += 0.05;
      light.intensity = Math.max(0, (intensity || 8) - elapsed * 22);
      if (elapsed >= 0.5) {
        sc.remove(light);
        clearInterval(interval);
      }
    }, 50);
  }

  function _updateVFX(dt) {
    var sc = _getScene();
    /* Fires */
    for (var i = _fires.length - 1; i >= 0; i--) {
      var f = _fires[i];
      f.age += dt;
      f.mesh.position.y += 1.5 * dt;
      f.mesh.scale.setScalar(_lerp(1, 0.2, f.age / f.life));
      if (f.mat) f.mat.opacity = Math.max(0, 0.9 * (1 - f.age / f.life));
      if (f.age >= f.life) {
        if (sc) sc.remove(f.mesh);
        _fires.splice(i, 1);
      }
    }
    /* Smokes */
    for (var j = _smokes.length - 1; j >= 0; j--) {
      var s = _smokes[j];
      s.age += dt;
      s.mesh.position.y += s.vy * dt;
      if (s.mat) s.mat.opacity = Math.max(0, 0.7 * (1 - s.age / s.life));
      if (s.age >= s.life) {
        if (sc) sc.remove(s.mesh);
        _smokes.splice(j, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CONVOY MOVEMENT
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateConvoyMovement(dt) {
    if (!_missionStarted || _missionDone) return;

    var leader = _vehicles[0];

    /* Find effective leader (first non-destroyed vehicle) */
    var effectiveLeader = null;
    for (var v = 0; v < _vehicles.length; v++) {
      if (!_vehicles[v].destroyed) { effectiveLeader = _vehicles[v]; break; }
    }
    if (!effectiveLeader) return;

    /* Advance waypoint for effective leader */
    if (!_convoyHalted && !_leadStopped) {
      var wp  = WAYPOINTS[_wpIndex];
      var lx  = effectiveLeader.mesh.position.x;
      var lz  = effectiveLeader.mesh.position.z;
      var dWp = _dist2D(lx, lz, wp.x, wp.z);

      if (dWp < WP_REACH) {
        _wpIndex++;

        /* Spawn IED when convoy is about to enter IED segment */
        if (_wpIndex === IED_SEGMENT && !_iedSpawned) {
          _spawnIED();
        }

        /* Check ambush triggers */
        for (var ai = 0; ai < AMBUSH_WP.length; ai++) {
          if (_wpIndex === AMBUSH_WP[ai] && !_ambushTriggered[ai]) {
            _ambushTriggered[ai] = true;
            _spawnAmbushAt(AMBUSH_WP[ai]);
          }
        }

        if (_wpIndex >= WAYPOINTS.length) {
          _finishMission();
          return;
        }
      }
    }

    /* Move each vehicle */
    for (var i = 0; i < _vehicles.length; i++) {
      var veh = _vehicles[i];
      if (veh.destroyed) continue;
      if (_convoyHalted && !_ambushActive) continue; // only ambush can halt

      /* Determine stop state from propagation */
      var effectiveStopped = veh._isStopped;
      if (!effectiveStopped && _convoyHalted) effectiveStopped = true;

      if (effectiveStopped) {
        /* Animate stop timer */
        if (veh._stopTimer > 0) {
          veh._stopTimer -= dt;
          if (veh._stopTimer < 0) veh._stopTimer = 0;
        }
        continue;
      }

      /* Compute target */
      var targetX, targetZ;
      if (veh === effectiveLeader) {
        var twp = WAYPOINTS[_wpIndex];
        targetX = twp.x;
        targetZ = twp.z;
      } else {
        /* Follow the vehicle ahead in the original order */
        var prev = null;
        for (var pi = veh.idx - 1; pi >= 0; pi--) {
          if (!_vehicles[pi].destroyed) { prev = _vehicles[pi]; break; }
        }
        if (!prev) { prev = effectiveLeader; }

        /* Slot: VEHICLE_SPACING behind prev, in prev's backward direction */
        var hdx = veh.mesh.position.x - prev.mesh.position.x;
        var hdz = veh.mesh.position.z - prev.mesh.position.z;
        var hdl = Math.sqrt(hdx * hdx + hdz * hdz);
        if (hdl < 0.01) { hdx = 0; hdz = 1; hdl = 1; }
        var slotX = prev.mesh.position.x + (hdx / hdl) * VEHICLE_SPACING;
        var slotZ = prev.mesh.position.z + (hdz / hdl) * VEHICLE_SPACING;

        /* Lateral bypass offset around a destroyed wreck */
        for (var wi = 0; wi < _vehicles.length; wi++) {
          var wv = _vehicles[wi];
          if (!wv.destroyed || !wv._bypassOffset) continue;
          wv._bypassTimer -= dt;
          if (wv._bypassTimer <= 0) { wv._bypassOffset = 0; continue; }
          var bDist = _dist2D(slotX, slotZ, wv.mesh.position.x, wv.mesh.position.z);
          if (bDist < 6) {
            slotX += wv._bypassOffset;
          }
        }

        targetX = slotX;
        targetZ = slotZ;
      }

      var dvx = targetX - veh.mesh.position.x;
      var dvz = targetZ - veh.mesh.position.z;
      var dvd = Math.sqrt(dvx * dvx + dvz * dvz);
      if (dvd < 0.1) continue;

      var nx2   = dvx / dvd;
      var nz2   = dvz / dvd;
      var speed = Math.min(CONVOY_SPEED, dvd / dt);

      veh.mesh.position.x += nx2 * speed * dt;
      veh.mesh.position.z += nz2 * speed * dt;
      veh.mesh.position.y  = _terrainY(veh.mesh.position.x, veh.mesh.position.z) + 1.0;

      /* Smooth heading lerp */
      var targetHeading = Math.atan2(nx2, nz2);
      veh._heading      = _lerpAngle(veh._heading, targetHeading, Math.min(1, dt * 3));
      veh.mesh.rotation.y = veh._heading;

      /* Wheel spin */
      veh._wheelAngle += speed * dt * 2.5;
      if (veh.mesh._wheels) {
        for (var wi2 = 0; wi2 < veh.mesh._wheels.length; wi2++) {
          veh.mesh._wheels[wi2].rotation.x = veh._wheelAngle;
        }
      }

      /* IED check — vehicle drives over IED */
      if (_iedSpawned && !_iedDefused && !_iedDetonated && _iedPos) {
        var iedDist = _dist2D(
          veh.mesh.position.x, veh.mesh.position.z,
          _iedPos.x, _iedPos.z
        );
        if (iedDist < IED_TRIGGER_DIST) {
          _detonateIED(veh);
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MISSION FINISH
  ═══════════════════════════════════════════════════════════════════════ */

  function _finishMission() {
    _missionDone = true;
    _convoyHalted = false;

    /* Count delivered vehicles */
    var delivered   = 0;
    var allIntact   = true;
    for (var i = 0; i < _vehicles.length; i++) {
      if (!_vehicles[i].destroyed) delivered++;
      if (!_vehiclesIntact[i])     allIntact = false;
    }

    var score = delivered * SCORE_PER_VEHICLE;
    if (allIntact && delivered === 4) score += SCORE_BONUS_INTACT;
    var crewPenalty = _crewKIA * SCORE_CREW_KIA;
    score += crewPenalty;

    _addScore(score);
    window._convoyMissionScore = score;

    var msg = 'CONVOY EXTRACTED: ' + delivered + '/4 VEHICLES DELIVERED | SCORE +' + score;
    if (allIntact && delivered === 4) msg += ' (+200 INTACT BONUS)';
    if (_crewKIA > 0) msg += ' | ' + _crewKIA + ' CREW KIA (-' + Math.abs(crewPenalty) + ')';
    _toast(msg);
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     BOARDING
  ═══════════════════════════════════════════════════════════════════════ */

  function _checkBoardInput() {
    /* Triggered externally; also check via _keyE flag */
    if (!window._keyE && !window._boardConvoyPressed) return;
    window._keyE               = false;
    window._boardConvoyPressed = false;

    var pPos = _getPlayerPos();
    if (!pPos) return;

    /* Disembark if already boarded */
    if (_boardedVehicleIdx >= 0) {
      _toast('DISEMBARKED VEHICLE ' + (_boardedVehicleIdx + 1));
      _boardedVehicleIdx = -1;
      return;
    }

    /* Find closest vehicle within BOARD_RANGE */
    var best  = -1;
    var bestD = BOARD_RANGE;
    for (var i = 0; i < _vehicles.length; i++) {
      if (_vehicles[i].destroyed) continue;
      var d = _dist3D(pPos, _vehicles[i].mesh.position);
      if (d < bestD) { bestD = d; best = i; }
    }

    if (best >= 0) {
      _boardedVehicleIdx = best;
      _toast('BOARDED VEHICLE ' + (best + 1) + ' — press E to disembark');
    }
  }

  function _updateBoardedPlayer(dt) {
    if (_boardedVehicleIdx < 0) return;
    var veh = _vehicles[_boardedVehicleIdx];
    if (!veh || veh.destroyed) {
      _boardedVehicleIdx = -1;
      return;
    }

    /* Move player to ride-along position */
    var cam = _getCamera();
    if (cam) {
      cam.position.x = veh.mesh.position.x;
      cam.position.y = veh.mesh.position.y + 2.5;
      cam.position.z = veh.mesh.position.z;
    }
    if (window._playerPos) {
      window._playerPos.x = veh.mesh.position.x;
      window._playerPos.y = veh.mesh.position.y + 1.0;
      window._playerPos.z = veh.mesh.position.z;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     IED DEFUSE PROMPT
  ═══════════════════════════════════════════════════════════════════════ */

  function _checkDefusePrompt() {
    if (!_iedSpawned || _iedDefused || _iedDetonated || !_iedPos) return;

    var pPos = _getPlayerPos();
    if (!pPos) return;

    var d = _dist3D(pPos, _iedPos);
    if (d < IED_DEFUSE_DIST) {
      _showDefusePrompt(true);
      /* F key or _defusePressed */
      if (window._keyF || window._defuseIEDPressed) {
        window._keyF              = false;
        window._defuseIEDPressed  = false;
        _defuseIED();
      }
    } else {
      _showDefusePrompt(false);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════ */

  function _ensureHUD() {
    if (_hudEl) return;

    /* Main status bar */
    _hudEl = document.createElement('div');
    _hudEl.id = 'convoy-escort-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:90px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)',
      'color:#a8ff80',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 18px',
      'border:1px solid #4A5240',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:8900',
      'min-width:340px',
      'text-align:center',
    ].join(';');
    document.body.appendChild(_hudEl);

    /* Mini convoy diagram */
    _miniConvoyEl = document.createElement('div');
    _miniConvoyEl.id = 'convoy-mini-diagram';
    _miniConvoyEl.style.cssText = [
      'position:fixed',
      'bottom:135px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.6)',
      'color:#fff',
      'font-family:monospace',
      'font-size:11px',
      'padding:4px 12px',
      'border:1px solid #333',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:8900',
      'white-space:nowrap',
    ].join(';');
    document.body.appendChild(_miniConvoyEl);

    /* CONTACT alert */
    _contactEl = document.createElement('div');
    _contactEl.id = 'convoy-contact';
    _contactEl.style.cssText = [
      'position:fixed',
      'top:15%',
      'left:50%',
      'transform:translateX(-50%)',
      'padding:12px 32px',
      'background:rgba(200,0,0,0.88)',
      'color:#fff',
      'font-family:monospace',
      'font-size:24px',
      'font-weight:bold',
      'letter-spacing:5px',
      'border:2px solid #ff0000',
      'box-shadow:0 0 28px #ff0000',
      'pointer-events:none',
      'z-index:9100',
      'display:none',
      'text-align:center',
    ].join(';');
    document.body.appendChild(_contactEl);

    /* Defuse prompt */
    _defusePromptEl = document.createElement('div');
    _defusePromptEl.id = 'convoy-defuse-prompt';
    _defusePromptEl.style.cssText = [
      'position:fixed',
      'top:45%',
      'left:50%',
      'transform:translateX(-50%)',
      'padding:8px 20px',
      'background:rgba(180,100,0,0.9)',
      'color:#fff',
      'font-family:monospace',
      'font-size:16px',
      'border:1px solid #ffaa00',
      'pointer-events:none',
      'z-index:9000',
      'display:none',
      'text-align:center',
    ].join(';');
    _defusePromptEl.textContent = '[F] DEFUSE IED';
    document.body.appendChild(_defusePromptEl);
  }

  function _showContact(dir) {
    _ensureHUD();
    _contactEl.textContent = 'CONTACT ' + dir + '!';
    _contactEl.style.display = 'block';
    _contactTimer = 5;
  }

  function _showDefusePrompt(visible) {
    if (_defusePromptEl) {
      _defusePromptEl.style.display = visible ? 'block' : 'none';
    }
  }

  function _vehicleHealthColor(veh) {
    if (veh.destroyed) return '#444';
    var pct = veh.hp / veh.maxHp;
    if (pct > 0.6) return '#44ff44';
    if (pct > 0.3) return '#ffcc00';
    return '#ff3300';
  }

  function _vehicleIcon(veh) {
    if (veh.destroyed) return '[XX]';
    var pct = veh.hp / veh.maxHp;
    if (veh.role === 'humvee') {
      return pct > 0.5 ? '[HV]' : '[H!]';
    }
    return pct > 0.5 ? '[TK]' : '[T!]';
  }

  function _updateHUD() {
    _ensureHUD();

    /* Count alive vehicles */
    var alive = 0;
    for (var i = 0; i < _vehicles.length; i++) {
      if (!_vehicles[i].destroyed) alive++;
    }

    var wp      = Math.min(_wpIndex, WAYPOINTS.length - 1);
    var speed   = _convoyHalted ? 0.0 : CONVOY_SPEED;
    var statusLine = 'CONVOY STATUS: ' + alive + '/4 VEHICLES | SPEED: ' + speed.toFixed(1) +
                     ' | NEXT WP: ' + wp;
    if (_missionDone) statusLine = 'MISSION COMPLETE — ' + alive + '/4 EXTRACTED';
    if (_ambushActive) statusLine += ' | !AMBUSH!';
    if (_iedSpawned && !_iedDefused && !_iedDetonated) statusLine += ' | IED ON ROUTE';
    if (_boardedVehicleIdx >= 0) statusLine += ' | RIDING V' + (_boardedVehicleIdx + 1);

    _hudEl.textContent = statusLine;

    /* Mini diagram */
    var diag = '';
    for (var j = 0; j < _vehicles.length; j++) {
      var veh = _vehicles[j];
      var col = _vehicleHealthColor(veh);
      var ico = _vehicleIcon(veh);
      diag += '<span style="color:' + col + '">' + ico + '</span>';
      if (j < _vehicles.length - 1) diag += ' &rarr; ';
    }
    _miniConvoyEl.innerHTML = 'LEAD &rarr; ' + diag + ' &rarr; TRAIL';

    /* HP bars above each vehicle (world-to-screen) */
    _updateVehicleHPBars();
  }

  /* Per-vehicle HP bars using screen-space overlay divs */
  var _hpBarEls = [];

  function _ensureHPBars() {
    while (_hpBarEls.length < _vehicles.length) {
      var bar = document.createElement('div');
      bar.style.cssText = [
        'position:fixed',
        'width:60px',
        'height:7px',
        'background:#222',
        'border:1px solid #555',
        'pointer-events:none',
        'z-index:8800',
        'display:none',
      ].join(';');
      var fill = document.createElement('div');
      fill.style.cssText = 'height:100%;width:100%;background:#44ff44;transition:width 0.1s';
      bar.appendChild(fill);

      var label = document.createElement('div');
      label.style.cssText = [
        'position:absolute',
        'top:-14px',
        'left:0',
        'font-family:monospace',
        'font-size:9px',
        'color:#ccc',
        'white-space:nowrap',
      ].join(';');
      bar.appendChild(label);

      document.body.appendChild(bar);
      _hpBarEls.push({ bar: bar, fill: fill, label: label });
    }
  }

  function _updateVehicleHPBars() {
    var cam = _getCamera();
    if (!cam) return;
    _ensureHPBars();

    for (var i = 0; i < _vehicles.length; i++) {
      var veh   = _vehicles[i];
      var barEl = _hpBarEls[i];
      if (!barEl) continue;

      if (veh.destroyed) {
        barEl.bar.style.display = 'none';
        continue;
      }

      /* Project vehicle position to screen */
      var worldPos = new THREE.Vector3(
        veh.mesh.position.x,
        veh.mesh.position.y + 3,
        veh.mesh.position.z
      );
      var projected = worldPos.clone().project(cam);

      /* Only show if in front and on-screen */
      if (projected.z > 1 || projected.z < -1) {
        barEl.bar.style.display = 'none';
        continue;
      }

      var sx = (projected.x * 0.5 + 0.5) * window.innerWidth;
      var sy = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      if (sx < -100 || sx > window.innerWidth + 100 ||
          sy < -50  || sy > window.innerHeight + 50) {
        barEl.bar.style.display = 'none';
        continue;
      }

      barEl.bar.style.display  = 'block';
      barEl.bar.style.left     = (sx - 30) + 'px';
      barEl.bar.style.top      = sy + 'px';

      var pct = Math.max(0, veh.hp / veh.maxHp);
      barEl.fill.style.width      = (pct * 100) + '%';
      barEl.fill.style.background = _vehicleHealthColor(veh);

      var roleName = veh.role === 'humvee' ? (veh.idx === 0 ? 'LEAD HV' : 'TRAIL HV') :
                     ('TRUCK ' + (veh.idx === 1 ? 'A' : 'B'));
      barEl.label.textContent = roleName + ' ' + veh.hp + '/' + veh.maxHp;
    }
  }

  function _updateContactTimer(dt) {
    if (_contactTimer > 0) {
      _contactTimer -= dt;
      if (_contactTimer <= 0 && _contactEl) {
        _contactEl.style.display = 'none';
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CONVOY INITIALIZATION
  ═══════════════════════════════════════════════════════════════════════ */

  function _spawnConvoy() {
    var sc = _getScene();
    if (!sc) { console.warn('[VehicleConvoy] No scene'); return; }

    /* Roles in order: lead humvee, truck A, truck B, trail humvee */
    var roles = ['humvee', 'truck', 'truck', 'humvee'];
    _vehicles  = [];

    var wp0 = WAYPOINTS[0];
    var wp1 = WAYPOINTS[1];
    var dxR = wp1.x - wp0.x;
    var dzR = wp1.z - wp0.z;
    var lenR = Math.sqrt(dxR * dxR + dzR * dzR);
    var nxR  = dxR / lenR;
    var nzR  = dzR / lenR;

    for (var i = 0; i < 4; i++) {
      var veh    = _makeVehicle(roles[i], i);
      var offset = i * (VEHICLE_SPACING + 2);
      veh.mesh.position.set(
        wp0.x - nxR * offset,
        _terrainY(wp0.x - nxR * offset, wp0.z - nzR * offset) + 1.0,
        wp0.z - nzR * offset
      );
      veh._heading = Math.atan2(nxR, nzR);
      veh.mesh.rotation.y = veh._heading;
      _vehicles.push(veh);
    }

    _wpIndex       = 0;
    _missionDone   = false;
    _missionStarted = true;
    _convoyHalted  = false;
    _leadStopped   = false;
    _boardedVehicleIdx = -1;
    _crewKIA       = 0;
    _vehiclesIntact = [true, true, true, true];
    _ambushTriggered = [false, false, false];
    _activeEnemies = [];
    _ambushActive  = false;
    _iedSpawned    = false;
    _iedDefused    = false;
    _iedDetonated  = false;
    _iedMesh       = null;
    _iedPos        = null;
    _fires         = [];
    _smokes        = [];

    window._convoyVehicles    = _vehicles;
    window._convoyHitTargets  = [];

    /* Register hit targets */
    for (var hi = 0; hi < _vehicles.length; hi++) {
      (function (veh) {
        window._convoyHitTargets.push({
          mesh:  veh.mesh,
          onHit: function (dmg) { _damageVehicle(veh, dmg || 10); },
        });
      })(_vehicles[hi]);
    }

    /* Register enemy hit targets */
    window._convoyEnemyTargets = _activeEnemies;

    _toast('CONVOY ESCORT MISSION STARTED — protect the convoy to the extraction zone!');
    _toast('Press E to board a vehicle. Press F near IED marker to defuse.');
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC — init
  ═══════════════════════════════════════════════════════════════════════ */

  function init(scene, camera) {
    _scene   = scene  || null;
    _camera  = camera || null;
    _inited  = true;

    _ensureHUD();
    _spawnConvoy();

    console.log('[VehicleConvoy] init — escort mission started');
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC — update
  ═══════════════════════════════════════════════════════════════════════ */

  function update(dt) {
    if (!_inited || !_missionStarted) return;

    /* Boarding */
    _checkBoardInput();
    _updateBoardedPlayer(dt);

    /* IED defuse prompt */
    _checkDefusePrompt();

    /* Convoy movement */
    _updateConvoyMovement(dt);

    /* Ambush enemy AI */
    _updateAmbushEnemies(dt);

    /* VFX */
    _updateVFX(dt);

    /* HUD */
    _updateContactTimer(dt);
    _updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC — reset
  ═══════════════════════════════════════════════════════════════════════ */

  function reset() {
    var sc = _getScene();

    /* Remove vehicle meshes */
    for (var i = 0; i < _vehicles.length; i++) {
      if (sc) sc.remove(_vehicles[i].mesh);
    }
    _vehicles = [];

    /* Remove IED */
    if (sc && _iedMesh) sc.remove(_iedMesh);
    _iedMesh = null;

    /* Remove enemy meshes */
    for (var ei = 0; ei < _activeEnemies.length; ei++) {
      if (sc) sc.remove(_activeEnemies[ei].mesh);
    }
    _activeEnemies = [];

    /* Remove VFX */
    for (var fi = 0; fi < _fires.length; fi++) {
      if (sc) sc.remove(_fires[fi].mesh);
    }
    _fires = [];
    for (var si = 0; si < _smokes.length; si++) {
      if (sc) sc.remove(_smokes[si].mesh);
    }
    _smokes = [];

    /* Remove HP bars */
    for (var bi = 0; bi < _hpBarEls.length; bi++) {
      var b = _hpBarEls[bi];
      if (b.bar && b.bar.parentNode) b.bar.parentNode.removeChild(b.bar);
    }
    _hpBarEls = [];

    /* Hide HUD */
    if (_hudEl)          _hudEl.style.display          = 'none';
    if (_miniConvoyEl)   _miniConvoyEl.style.display    = 'none';
    if (_contactEl)      _contactEl.style.display       = 'none';
    if (_defusePromptEl) _defusePromptEl.style.display  = 'none';

    /* Reset state */
    _missionDone        = false;
    _missionStarted     = false;
    _wpIndex            = 0;
    _convoyHalted       = false;
    _leadStopped        = false;
    _boardedVehicleIdx  = -1;
    _crewKIA            = 0;
    _iedSpawned         = false;
    _iedDefused         = false;
    _iedDetonated       = false;
    _iedPos             = null;
    _ambushActive       = false;
    _ambushTriggered    = [false, false, false];
    _contactTimer       = 0;
    _vehiclesIntact     = [true, true, true, true];
    window._iedOnRoute          = false;
    window._convoyVehicles      = [];
    window._convoyHitTargets    = [];
    window._convoyEnemyTargets  = [];
    window._convoyMissionScore  = 0;

    console.log('[VehicleConvoy] reset');
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════ */

  return {
    init:        init,
    update:      update,
    reset:       reset,
    damageEnemy: damageEnemy,
    defuseIED:   _defuseIED,
  };

})();
