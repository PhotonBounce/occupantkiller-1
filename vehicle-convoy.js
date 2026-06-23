/* ═══════════════════════════════════════════════════════════════════════════
   VEHICLE CONVOY — Enemy armored convoy with ambush mission
   ───────────────────────────────────────────────────────────────────────────
   3-vehicle convoy: lead armored car → cargo truck → rear escort.
   Each vehicle has 4 cylindrical wheels that rotate as the vehicle moves.
   Convoy follows a 6-waypoint loop. When within 30 units of player:
     - window._convoyNearby = true
     - "CONVOY INCOMING" HUD alert + arrow indicator
   Objective: destroy all 3 before they complete the loop.
   Escort vehicles carry 2 gunners each (HP 50, fire at player within 40 u).
   Cargo truck destruction triggers secondary ammo cook-off explosion.
   If convoy escapes: -100 score, window._convoyEscaped = true.
   Destroying truck drops loot (calls AirdropSupply.spawnCrate or Box mesh).
   New convoy spawns every 120 s (max 1 active).

   Public API  window.VehicleConvoy = { init(scene, camera), update(dt), spawnConvoy(), reset }
   ═══════════════════════════════════════════════════════════════════════════ */
window.VehicleConvoy = (function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────────────────── */
  var CONVOY_SPEED       = 8;     // m/s
  var VEHICLE_SPACING    = 6;     // units between vehicles
  var WP_REACH           = 4;     // waypoint advance threshold
  var AMBUSH_DIST        = 30;    // trigger distance
  var GUNNER_FIRE_DIST   = 40;    // gunner engagement distance
  var GUNNER_FIRE_RATE   = 1.5;   // seconds between shots
  var GUNNER_DAMAGE      = 8;     // damage per gunner shot
  var SPAWN_INTERVAL     = 120;   // seconds between convoy spawns
  var COOK_OFF_DELAY     = 2;     // seconds before secondary explosion
  var COOK_OFF_RADIUS    = 5;     // metres radius
  var COOK_OFF_DAMAGE    = 60;    // damage from cook-off
  var SMOKE_COUNT        = 10;    // rising smoke spheres per wreck
  var MAX_CONVOYS        = 1;

  /* ── Waypoints: 6-point loop around the map ────────────────────────────── */
  var WAYPOINTS = [
    { x:  80, z:   0 },
    { x:  60, z: -60 },
    { x:   0, z: -80 },
    { x: -60, z: -60 },
    { x: -80, z:   0 },
    { x:   0, z:  80 },
  ];

  /* ── Module state ───────────────────────────────────────────────────────── */
  var _scene        = null;
  var _camera       = null;
  var _inited       = false;
  var _convoys      = [];       // active convoy instances
  var _spawnTimer   = 0;        // countdown to next spawn
  var _pendingCookOffs = [];    // { timer, x, y, z }

  /* ── HUD elements ───────────────────────────────────────────────────────── */
  var _alertEl      = null;
  var _arrowEl      = null;
  var _alertTimer   = 0;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════════════ */

  function _getScene() {
    return _scene || window._gameScene || null;
  }

  function _getCamera() {
    return _camera || window._camera || null;
  }

  function _getPlayerPos() {
    if (window.GameManager && window.GameManager.getPlayerPosition) {
      return window.GameManager.getPlayerPosition();
    }
    if (window._playerPos) return window._playerPos;
    if (window.player && window.player.position) return window.player.position;
    var cam = _getCamera();
    if (cam) return cam.position;
    return null;
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

  function _toast(msg, color) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    } else {
      console.log('[VehicleConvoy] ' + msg);
    }
  }

  function _addScore(delta) {
    if (window.GameManager && window.GameManager.addScore) {
      window.GameManager.addScore(delta);
    } else if (window._score !== undefined) {
      window._score += delta;
    }
  }

  function _playerTakeDamage(amt) {
    if (window.GameManager && window.GameManager.damagePlayer) {
      window.GameManager.damagePlayer(amt);
    } else if (window._playerHP !== undefined) {
      window._playerHP = Math.max(0, window._playerHP - amt);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD — alert banner + convoy arrow
  ═══════════════════════════════════════════════════════════════════════ */

  function _ensureAlertEl() {
    if (_alertEl) return;
    _alertEl = document.createElement('div');
    _alertEl.id = 'convoy-alert';
    _alertEl.style.cssText = [
      'position:fixed',
      'top:18%',
      'left:50%',
      'transform:translateX(-50%)',
      'padding:10px 28px',
      'background:rgba(255,80,0,0.85)',
      'color:#fff',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'letter-spacing:4px',
      'border:2px solid #ff6600',
      'box-shadow:0 0 24px #ff6600',
      'pointer-events:none',
      'z-index:9100',
      'display:none',
      'text-align:center',
    ].join(';');
    document.body.appendChild(_alertEl);
  }

  function _ensureArrowEl() {
    if (_arrowEl) return;
    _arrowEl = document.createElement('div');
    _arrowEl.id = 'convoy-arrow';
    _arrowEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'font-size:36px',
      'color:#ff6600',
      'text-shadow:0 0 12px #ff6600',
      'pointer-events:none',
      'z-index:9101',
      'display:none',
    ].join(';');
    _arrowEl.textContent = '▶';
    document.body.appendChild(_arrowEl);
  }

  function _showConvoyAlert() {
    _ensureAlertEl();
    _alertEl.textContent = '⚠ CONVOY INCOMING ⚠';
    _alertEl.style.display = 'block';
    _alertTimer = 4;
  }

  function _showConvoyEscaped() {
    _ensureAlertEl();
    _alertEl.textContent = '✗ CONVOY ESCAPED';
    _alertEl.style.background = 'rgba(200,0,0,0.85)';
    _alertEl.style.borderColor = '#ff0000';
    _alertEl.style.display = 'block';
    _alertTimer = 5;
    _toast('CONVOY ESCAPED! -100 score');
    _addScore(-100);
    window._convoyEscaped = true;
  }

  function _updateHUD(dt, convoy) {
    /* alert timer */
    if (_alertTimer > 0) {
      _alertTimer -= dt;
      if (_alertTimer <= 0 && _alertEl) {
        _alertEl.style.display = 'none';
      }
    }

    /* arrow pointing toward convoy leader */
    _ensureArrowEl();
    if (!convoy || !convoy.active) {
      _arrowEl.style.display = 'none';
      return;
    }

    var playerPos = _getPlayerPos();
    var cam = _getCamera();
    if (!playerPos || !cam) { _arrowEl.style.display = 'none'; return; }

    var leader = convoy.vehicles[0];
    if (!leader || leader.destroyed) { _arrowEl.style.display = 'none'; return; }

    /* 2-D angle from player to convoy leader, relative to camera yaw */
    var dx = leader.mesh.position.x - playerPos.x;
    var dz = leader.mesh.position.z - playerPos.z;
    var worldAngle = Math.atan2(dx, dz);

    /* camera forward yaw */
    var camYaw = 0;
    if (cam.getWorldDirection) {
      var fwd = new THREE.Vector3();
      cam.getWorldDirection(fwd);
      camYaw = Math.atan2(fwd.x, fwd.z);
    }

    var relAngle = worldAngle - camYaw;
    /* edge position on screen */
    var margin = 80;
    var hw = window.innerWidth / 2 - margin;
    var hh = window.innerHeight / 2 - margin;
    var ex = Math.sin(relAngle) * hw;
    var ey = -Math.cos(relAngle) * hh;

    _arrowEl.style.display = 'block';
    _arrowEl.style.transform = 'translate(calc(-50% + ' + ex + 'px), calc(-50% + ' + ey + 'px)) rotate(' + (relAngle * 180 / Math.PI) + 'deg)';
  }

  /* ════════════════════════════════════════════════════════════════════════
     MINIMAP ICON — truck emoji on TacticalMinimap/TacticalMap canvas
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateMinimap(convoy) {
    if (!convoy || !convoy.active) return;
    var leader = convoy.vehicles[0];
    if (!leader || leader.destroyed) return;

    var map = window.TacticalMinimap || window.TacticalMap;
    if (!map || !map.addCustomIcon) return; // graceful — no minimap API
    try {
      map.addCustomIcon({
        id: 'convoy_icon',
        x: leader.mesh.position.x,
        z: leader.mesh.position.z,
        label: '🚛',
        color: '#ff6600',
      });
    } catch (e) {}
  }

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ═══════════════════════════════════════════════════════════════════════ */

  function _makeMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  /* Build 4 wheels for a vehicle and attach to chassis group */
  function _addWheels(group, bodyW, bodyH, bodyD) {
    var wheelR  = 0.35;
    var wheelT  = 0.25;
    var wGeo    = new THREE.CylinderGeometry(wheelR, wheelR, wheelT, 10);
    var wMat    = new THREE.MeshLambertMaterial({ color: 0x222222 });

    /* positions: front-left, front-right, rear-left, rear-right */
    var offsets = [
      { x: -(bodyW / 2 + wheelT / 2), z:  bodyD / 3 },
      { x:  (bodyW / 2 + wheelT / 2), z:  bodyD / 3 },
      { x: -(bodyW / 2 + wheelT / 2), z: -bodyD / 3 },
      { x:  (bodyW / 2 + wheelT / 2), z: -bodyD / 3 },
    ];

    var wheels = [];
    for (var i = 0; i < offsets.length; i++) {
      var w = new THREE.Mesh(wGeo, wMat);
      /* rotate to horizontal (cylinder axis is Y by default, we want Z) */
      w.rotation.z = Math.PI / 2;
      w.position.set(offsets[i].x, -(bodyH / 2 - wheelR), offsets[i].z);
      group.add(w);
      wheels.push(w);
    }
    return wheels;
  }

  function _buildLeadCar() {
    var group = new THREE.Group();
    var geo   = new THREE.BoxGeometry(3, 1.2, 1.5);
    var mat   = _makeMaterial(0x2d4a2d); /* dark green */
    var body  = new THREE.Mesh(geo, mat);
    body.castShadow = true;
    group.add(body);
    var wheels = _addWheels(group, 3, 1.2, 1.5);
    group._wheels = wheels;
    return group;
  }

  function _buildCargoTruck() {
    var group = new THREE.Group();
    var geo   = new THREE.BoxGeometry(4, 2, 1.8);
    var mat   = _makeMaterial(0xc3b280); /* khaki */
    var body  = new THREE.Mesh(geo, mat);
    body.castShadow = true;
    group.add(body);
    var wheels = _addWheels(group, 4, 2, 1.8);
    group._wheels = wheels;
    return group;
  }

  function _buildEscortCar() {
    return _buildLeadCar(); /* same geometry as lead */
  }

  /* Build 2 gunner pawns sitting on roof of an escort vehicle */
  function _buildGunners(escortGroup, bodyH) {
    var gunners = [];
    var gGeo = new THREE.BoxGeometry(0.4, 0.8, 0.4);
    var gMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var xOffsets = [-0.6, 0.6];
    for (var i = 0; i < 2; i++) {
      var g = new THREE.Mesh(gGeo, gMat);
      g.position.set(xOffsets[i], bodyH / 2 + 0.4, 0);
      escortGroup.add(g);
      gunners.push({ mesh: g, hp: 50, fireCooldown: Math.random() * GUNNER_FIRE_RATE, alive: true });
    }
    return gunners;
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSION & SMOKE VFX
  ═══════════════════════════════════════════════════════════════════════ */

  function _spawnExplosionLight(pos) {
    var sc = _getScene();
    if (!sc) return;
    var light = new THREE.PointLight(0xff6600, 8, 20);
    light.position.copy(pos);
    light.position.y += 1;
    sc.add(light);
    /* fade out */
    var elapsed = 0;
    var tid = setInterval(function () {
      elapsed += 0.05;
      light.intensity = Math.max(0, 8 - elapsed * 20);
      if (elapsed >= 0.4) {
        sc.remove(light);
        clearInterval(tid);
      }
    }, 50);
  }

  function _spawnSmoke(pos) {
    var sc = _getScene();
    if (!sc) return;
    var smokes = [];
    var sMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7 });
    for (var i = 0; i < SMOKE_COUNT; i++) {
      var sGeo = new THREE.SphereGeometry(0.25 + Math.random() * 0.25, 6, 6);
      var s = new THREE.Mesh(sGeo, sMat.clone());
      s.position.set(
        pos.x + (Math.random() - 0.5) * 2,
        pos.y + 0.5,
        pos.z + (Math.random() - 0.5) * 2
      );
      s._vy    = 1.5 + Math.random() * 2;
      s._life  = 2 + Math.random() * 1.5;
      s._age   = 0;
      sc.add(s);
      smokes.push(s);
    }
    /* animate smoke on interval */
    var interval = setInterval(function () {
      var allDone = true;
      for (var j = 0; j < smokes.length; j++) {
        var s = smokes[j];
        if (!s._done) {
          s._age += 0.05;
          s.position.y += s._vy * 0.05;
          s.material.opacity = Math.max(0, 0.7 * (1 - s._age / s._life));
          if (s._age >= s._life) {
            sc.remove(s);
            s._done = true;
          } else {
            allDone = false;
          }
        }
      }
      if (allDone) clearInterval(interval);
    }, 50);
  }

  function _destroyVehicleVFX(veh) {
    var pos = veh.mesh.position;
    _spawnExplosionLight(pos);
    _spawnSmoke(pos);
    if (window.AudioSystem && window.AudioSystem.playExplosion) {
      window.AudioSystem.playExplosion();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     LOOT DROP — truck cargo
  ═══════════════════════════════════════════════════════════════════════ */

  function _spawnLoot(pos) {
    /* Try AirdropSupply.spawnCrate first */
    if (window.AirdropSupply && window.AirdropSupply.spawnCrate) {
      try { window.AirdropSupply.spawnCrate(pos.x, pos.y, pos.z); return; } catch (e) {}
    }
    /* Fallback: simple loot box */
    var sc = _getScene();
    if (!sc) return;
    var geo = new THREE.BoxGeometry(1, 1, 1);
    var mat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    var box = new THREE.Mesh(geo, mat);
    box.position.copy(pos);
    box.position.y += 0.5;
    sc.add(box);
    box._isLoot = true;
    box._convoyLoot = true;
    /* Make it collectible */
    if (!window._convoyLootBoxes) window._convoyLootBoxes = [];
    window._convoyLootBoxes.push(box);
    _toast('SUPPLY CRATE DROPPED — ammo + health inside!');
  }

  /* ════════════════════════════════════════════════════════════════════════
     COOK-OFF — secondary explosion from truck ammo
  ═══════════════════════════════════════════════════════════════════════ */

  function _triggerCookOff(pos) {
    _pendingCookOffs.push({ timer: COOK_OFF_DELAY, x: pos.x, y: pos.y, z: pos.z });
  }

  function _updateCookOffs(dt) {
    for (var i = _pendingCookOffs.length - 1; i >= 0; i--) {
      var co = _pendingCookOffs[i];
      co.timer -= dt;
      if (co.timer <= 0) {
        _pendingCookOffs.splice(i, 1);
        var coPos = new THREE.Vector3(co.x, co.y, co.z);
        _spawnExplosionLight(coPos);
        _spawnSmoke(coPos);
        _toast('AMMO COOK-OFF! Secondary explosion!');
        /* damage player if within radius */
        var pPos = _getPlayerPos();
        if (pPos) {
          var d = _dist3D(pPos, coPos);
          if (d < COOK_OFF_RADIUS) {
            var dmg = Math.round(COOK_OFF_DAMAGE * (1 - d / COOK_OFF_RADIUS));
            _playerTakeDamage(dmg);
          }
        }
        if (window.AudioSystem && window.AudioSystem.playExplosion) {
          window.AudioSystem.playExplosion();
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     VEHICLE OBJECT FACTORY
  ═══════════════════════════════════════════════════════════════════════ */

  function _makeVehicle(type, index) {
    var mesh, hp, bodyH;
    if (type === 'lead' || type === 'escort') {
      mesh  = (type === 'lead') ? _buildLeadCar() : _buildEscortCar();
      hp    = 200;
      bodyH = 1.2;
    } else {
      mesh  = _buildCargoTruck();
      hp    = 150;
      bodyH = 2;
    }

    var sc = _getScene();
    if (sc) sc.add(mesh);

    var gunners = [];
    if (type === 'escort') {
      gunners = _buildGunners(mesh, bodyH);
    }

    return {
      type:        type,
      index:       index,   /* 0=lead, 1=truck, 2=escort */
      mesh:        mesh,
      hp:          hp,
      maxHp:       hp,
      destroyed:   false,
      wrecked:     false,   /* static wreck left behind */
      gunners:     gunners,
      _wheelAngle: 0,
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     CONVOY FACTORY
  ═══════════════════════════════════════════════════════════════════════ */

  function _createConvoy() {
    var sc = _getScene();
    if (!sc) return null;

    /* Start position: first waypoint */
    var wp0 = WAYPOINTS[0];
    var startX = wp0.x;
    var startZ = wp0.z;
    var startY = _terrainY(startX, startZ) + 0.9;

    var vehicles = [
      _makeVehicle('lead',   0),
      _makeVehicle('truck',  1),
      _makeVehicle('escort', 2),
    ];

    /* Stagger positions along convoy's initial direction (toward wp[1]) */
    var wp1 = WAYPOINTS[1];
    var dx = wp1.x - wp0.x, dz = wp1.z - wp0.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    var nx = dx / len, nz = dz / len;

    for (var i = 0; i < vehicles.length; i++) {
      var offset = i * VEHICLE_SPACING;
      vehicles[i].mesh.position.set(
        startX - nx * offset,
        startY,
        startZ - nz * offset
      );
    }

    var convoy = {
      vehicles:      vehicles,
      wpIndex:       0,       /* leader's current waypoint target */
      active:        true,
      nearbyAlerted: false,
      escaped:       false,
      destroyCount:  0,
    };

    return convoy;
  }

  /* ════════════════════════════════════════════════════════════════════════
     DESTROY A VEHICLE
  ═══════════════════════════════════════════════════════════════════════ */

  function _destroyVehicle(convoy, veh) {
    if (veh.destroyed) return;
    veh.destroyed = true;

    _destroyVehicleVFX(veh);

    /* Remove gunners from scene */
    for (var g = 0; g < veh.gunners.length; g++) {
      veh.gunners[g].alive = false;
      veh.mesh.remove(veh.gunners[g].mesh);
    }

    /* Leave a static wreck (darken the mesh) */
    veh.mesh.traverse(function (child) {
      if (child.isMesh && child.material) {
        child.material = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      }
    });
    veh.wrecked = true;

    convoy.destroyCount++;

    /* Truck-specific */
    if (veh.type === 'truck') {
      _spawnLoot(veh.mesh.position);
      _triggerCookOff(veh.mesh.position);
      _toast('CARGO TRUCK DESTROYED — COOK-OFF INCOMING!');
    } else {
      _toast((veh.type === 'lead' ? 'LEAD VEHICLE' : 'REAR ESCORT') + ' DESTROYED!');
    }

    _addScore(150);

    /* Check mission complete */
    if (convoy.destroyCount >= 3) {
      _toast('ALL CONVOY VEHICLES DESTROYED! Mission complete!');
      convoy.active = false;
      window._convoyNearby = false;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     DAMAGE API — called by weapons/explosions to damage a convoy vehicle
  ═══════════════════════════════════════════════════════════════════════ */

  function _damageVehicle(convoy, veh, amount) {
    if (veh.destroyed) return;
    veh.hp -= amount;
    if (veh.hp <= 0) {
      _destroyVehicle(convoy, veh);
    }
  }

  /* Expose a global hook so other systems can damage convoy vehicles */
  function _buildHitTestHook(convoy) {
    if (!window._convoyHitTargets) window._convoyHitTargets = [];
    for (var i = 0; i < convoy.vehicles.length; i++) {
      (function (veh, idx) {
        window._convoyHitTargets.push({
          mesh:    veh.mesh,
          onHit:   function (damage) { _damageVehicle(convoy, veh, damage || 10); },
          convoy:  convoy,
        });
      })(convoy.vehicles[i], i);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GUNNER AI — fire at player
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateGunners(dt, veh) {
    if (veh.destroyed || veh.type !== 'escort') return;
    var pPos = _getPlayerPos();
    if (!pPos) return;
    var d = _dist2D(veh.mesh.position.x, veh.mesh.position.z, pPos.x, pPos.z);
    if (d > GUNNER_FIRE_DIST) return;

    for (var g = 0; g < veh.gunners.length; g++) {
      var gn = veh.gunners[g];
      if (!gn.alive) continue;
      gn.fireCooldown -= dt;
      if (gn.fireCooldown <= 0) {
        gn.fireCooldown = GUNNER_FIRE_RATE + (Math.random() - 0.5) * 0.5;
        /* Simple hit probability (30%) — player can dodge */
        if (Math.random() < 0.30) {
          _playerTakeDamage(GUNNER_DAMAGE);
          if (window.AudioSystem && window.AudioSystem.playHit) {
            window.AudioSystem.playHit();
          }
        }
        /* Muzzle flash on gunner */
        if (window.AudioSystem && window.AudioSystem.playGunshot) {
          window.AudioSystem.playGunshot();
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CONVOY MOVEMENT
  ═══════════════════════════════════════════════════════════════════════ */

  function _updateConvoy(dt, convoy) {
    if (!convoy.active) return;

    var vehicles = convoy.vehicles;
    var leader   = vehicles[0];

    /* Advance leader along waypoints */
    var targetWp = WAYPOINTS[convoy.wpIndex % WAYPOINTS.length];
    var lx = leader.destroyed ? (vehicles[1] && !vehicles[1].destroyed ? vehicles[1].mesh.position.x : null) : leader.mesh.position.x;
    var lz = leader.destroyed ? (vehicles[1] && !vehicles[1].destroyed ? vehicles[1].mesh.position.z : null) : leader.mesh.position.z;

    if (lx !== null) {
      var dToWp = _dist2D(lx, lz, targetWp.x, targetWp.z);
      if (dToWp < WP_REACH) {
        convoy.wpIndex++;
        /* Check escape: completed full loop (all 6 waypoints) */
        if (convoy.wpIndex >= WAYPOINTS.length) {
          _onConvoyEscape(convoy);
          return;
        }
        targetWp = WAYPOINTS[convoy.wpIndex % WAYPOINTS.length];
      }
    }

    /* Move each vehicle */
    for (var i = 0; i < vehicles.length; i++) {
      var veh = vehicles[i];
      if (veh.destroyed) continue;

      var targetX, targetZ;
      if (i === 0) {
        /* Leader follows waypoints */
        targetX = targetWp.x;
        targetZ = targetWp.z;
      } else {
        /* Follower trails previous vehicle */
        var prev = vehicles[i - 1];
        /* Find a point VEHICLE_SPACING behind the previous vehicle */
        var pdx = veh.mesh.position.x - prev.mesh.position.x;
        var pdz = veh.mesh.position.z - prev.mesh.position.z;
        var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pdist < 0.01) { targetX = prev.mesh.position.x - 1; targetZ = prev.mesh.position.z; }
        else {
          /* Move toward the slot behind previous vehicle */
          var slotX = prev.mesh.position.x - (pdx / pdist) * VEHICLE_SPACING;
          var slotZ = prev.mesh.position.z - (pdz / pdist) * VEHICLE_SPACING;
          targetX = slotX;
          targetZ = slotZ;
        }
      }

      var dvx = targetX - veh.mesh.position.x;
      var dvz = targetZ - veh.mesh.position.z;
      var dvd = Math.sqrt(dvx * dvx + dvz * dvz);
      if (dvd < 0.01) continue;

      var nx2 = dvx / dvd;
      var nz2 = dvz / dvd;
      var speed = (i === 0) ? CONVOY_SPEED : Math.min(CONVOY_SPEED, dvd / dt);

      /* Apply movement */
      veh.mesh.position.x += nx2 * speed * dt;
      veh.mesh.position.z += nz2 * speed * dt;
      veh.mesh.position.y = _terrainY(veh.mesh.position.x, veh.mesh.position.z) + 0.9;

      /* Face direction of travel */
      veh.mesh.rotation.y = Math.atan2(nx2, nz2);

      /* Rotate wheels */
      veh._wheelAngle += speed * dt * 2;
      if (veh.mesh._wheels) {
        for (var w = 0; w < veh.mesh._wheels.length; w++) {
          /* wheel rotation around their local Z axis (since we rotated cylinder to Z) */
          veh.mesh._wheels[w].rotation.x = veh._wheelAngle;
        }
      }
    }

    /* Ambush proximity check */
    var pPos = _getPlayerPos();
    if (pPos) {
      for (var vi = 0; vi < vehicles.length; vi++) {
        if (vehicles[vi].destroyed) continue;
        var dd = _dist2D(vehicles[vi].mesh.position.x, vehicles[vi].mesh.position.z, pPos.x, pPos.z);
        if (dd < AMBUSH_DIST) {
          if (!window._convoyNearby) {
            window._convoyNearby = true;
            _showConvoyAlert();
          }
          if (!convoy.nearbyAlerted) {
            convoy.nearbyAlerted = true;
          }
          break;
        }
      }
      /* Clear flag when all vehicles move away */
      var anyNear = false;
      for (var vi2 = 0; vi2 < vehicles.length; vi2++) {
        if (vehicles[vi2].destroyed) continue;
        var dd2 = _dist2D(vehicles[vi2].mesh.position.x, vehicles[vi2].mesh.position.z, pPos.x, pPos.z);
        if (dd2 < AMBUSH_DIST) { anyNear = true; break; }
      }
      if (!anyNear) window._convoyNearby = false;
    }

    /* Update gunners on escort vehicles */
    for (var vi3 = 0; vi3 < vehicles.length; vi3++) {
      _updateGunners(dt, vehicles[vi3]);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ESCAPE
  ═══════════════════════════════════════════════════════════════════════ */

  function _onConvoyEscape(convoy) {
    convoy.active  = false;
    convoy.escaped = true;
    window._convoyNearby = false;
    _showConvoyEscaped();
    _addScore(-100);   /* also inside _showConvoyEscaped, guarded by flag */
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC — spawnConvoy
  ═══════════════════════════════════════════════════════════════════════ */

  function spawnConvoy() {
    if (_convoys.length >= MAX_CONVOYS) return null;
    var sc = _getScene();
    if (!sc) { console.warn('[VehicleConvoy] No scene — cannot spawn'); return null; }

    var convoy = _createConvoy();
    if (!convoy) return null;

    _convoys.push(convoy);
    _buildHitTestHook(convoy);
    _spawnTimer = SPAWN_INTERVAL;
    _toast('CONVOY SPAWNED — destroy it before it escapes!');
    return convoy;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC — init
  ═══════════════════════════════════════════════════════════════════════ */

  function init(scene, camera) {
    _scene   = scene  || null;
    _camera  = camera || null;
    _inited  = true;
    _convoys = [];
    _spawnTimer = SPAWN_INTERVAL;
    window._convoyNearby  = false;
    window._convoyEscaped = false;
    if (!window._convoyLootBoxes) window._convoyLootBoxes = [];
    if (!window._convoyHitTargets) window._convoyHitTargets = [];
    console.log('[VehicleConvoy] init');
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC — update
  ═══════════════════════════════════════════════════════════════════════ */

  function update(dt) {
    if (!_inited) return;

    /* Auto-spawn timer */
    _spawnTimer -= dt;
    if (_spawnTimer <= 0) {
      /* Only spawn if no active convoy */
      var hasActive = false;
      for (var i = 0; i < _convoys.length; i++) {
        if (_convoys[i].active) { hasActive = true; break; }
      }
      if (!hasActive) {
        spawnConvoy();
      } else {
        _spawnTimer = 5; /* retry shortly */
      }
    }

    /* Update cook-offs */
    _updateCookOffs(dt);

    /* Update each convoy */
    for (var c = 0; c < _convoys.length; c++) {
      var convoy = _convoys[c];
      if (!convoy.active) continue;
      _updateConvoy(dt, convoy);
    }

    /* Prune inactive convoys */
    for (var ci = _convoys.length - 1; ci >= 0; ci--) {
      if (!_convoys[ci].active) _convoys.splice(ci, 1);
    }

    /* HUD */
    var activeConvoy = null;
    for (var ca = 0; ca < _convoys.length; ca++) {
      if (_convoys[ca].active) { activeConvoy = _convoys[ca]; break; }
    }
    _updateHUD(dt, activeConvoy);
    _updateMinimap(activeConvoy);

    /* Loot box pickup check */
    if (window._convoyLootBoxes && window._convoyLootBoxes.length > 0) {
      var pPos2 = _getPlayerPos();
      if (pPos2) {
        var sc = _getScene();
        for (var li = window._convoyLootBoxes.length - 1; li >= 0; li--) {
          var lb = window._convoyLootBoxes[li];
          var ldist = _dist3D(pPos2, lb.position);
          if (ldist < 2) {
            /* Collect */
            if (sc) sc.remove(lb);
            window._convoyLootBoxes.splice(li, 1);
            _toast('SUPPLY CRATE COLLECTED — ammo + health restored!');
            _addScore(50);
            /* Restore player HP/ammo */
            if (window.GameManager && window.GameManager.healPlayer) {
              window.GameManager.healPlayer(30);
            } else if (window._playerHP !== undefined) {
              window._playerHP = Math.min((window._playerMaxHP || 100), window._playerHP + 30);
            }
          }
        }
      }
    }

    /* Hit-test: check if bullet hit any convoy vehicle */
    /* This hook lets Weapons system call _convoyHitTargets[i].onHit(damage) */
    /* (registration is done in _buildHitTestHook) */
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC — reset
  ═══════════════════════════════════════════════════════════════════════ */

  function reset() {
    var sc = _getScene();
    for (var c = 0; c < _convoys.length; c++) {
      var conv = _convoys[c];
      for (var v = 0; v < conv.vehicles.length; v++) {
        if (sc) sc.remove(conv.vehicles[v].mesh);
      }
    }
    _convoys       = [];
    _pendingCookOffs = [];
    _spawnTimer    = SPAWN_INTERVAL;
    window._convoyNearby  = false;
    window._convoyEscaped = false;
    window._convoyHitTargets = [];
    if (window._convoyLootBoxes) {
      for (var li = 0; li < window._convoyLootBoxes.length; li++) {
        if (sc) sc.remove(window._convoyLootBoxes[li]);
      }
      window._convoyLootBoxes = [];
    }
    if (_alertEl) _alertEl.style.display = 'none';
    if (_arrowEl) _arrowEl.style.display = 'none';
    _alertTimer = 0;
    console.log('[VehicleConvoy] reset');
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════ */

  return {
    init:         init,
    update:       update,
    spawnConvoy:  spawnConvoy,
    reset:        reset,
  };

})();
