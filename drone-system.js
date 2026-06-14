/* ───────────────────────────────────────────────────────────────────────
   DRONE CONTROL SYSTEM — recon, FPV attack, bomb, surveillance drones
   ─────────────────────────────────────────────────────────────────────── */
const DroneSystem = (function () {
  'use strict';

  /* ── Drone Types ─────────────────────────────────────────────────── */
  // Reusable temp vectors for possessed drone update (avoids per-frame alloc)
  var _dTmpFwd = new THREE.Vector3();
  var _dTmpRight = new THREE.Vector3();
  var _fallbackPlayerPos = new THREE.Vector3(0, 5, 0);

  const DRONE_TYPE = Object.freeze({
    RECON:        'recon',
    FPV_ATTACK:   'fpv_attack',
    BOMB:         'bomb',
    SURVEILLANCE: 'surveillance',
    KAMIKAZE:     'kamikaze',
    INCENDIARY:   'incendiary',
    BABA_YAGA:    'baba_yaga',
    BAYRAKTAR:    'bayraktar',
    ENEMY_BOMBER: 'enemy_bomber',
    ENEMY_FPV:    'enemy_fpv',
    ENEMY_OBSERVER: 'enemy_observer',
  });

  const DRONE_STATS = {
    recon:          { speed: 12, health: 30,  battery: 120, damage: 0,   range: 80 },
    fpv_attack:     { speed: 18, health: 15,  battery: 45,  damage: 80,  range: 50 },
    bomb:           { speed: 8,  health: 40,  battery: 90,  damage: 200, range: 60 },
    surveillance:   { speed: 6,  health: 50,  battery: 300, damage: 0,   range: 100 },
    kamikaze:       { speed: 25, health: 8,   battery: 20,  damage: 120, range: 35 },
    incendiary:     { speed: 10, health: 25,  battery: 60,  damage: 60,  range: 70 },
    baba_yaga:      { speed: 5,  health: 100, battery: 150, damage: 90,  range: 60 },
    bayraktar:      { speed: 14, health: 120, battery: 240, damage: 0,   range: 300 }, // TB2: fixed-wing striker, armed with MAM-L
    enemy_bomber:   { speed: 7,  health: 35,  battery: 80,  damage: 150, range: 50 },
    enemy_fpv:      { speed: 22, health: 10,  battery: 30,  damage: 100, range: 40 },
    enemy_observer: { speed: 5,  health: 45,  battery: 200, damage: 0,   range: 120 },
  };
  const TB2_ALT = 35;        // loiter altitude
  const TB2_ORBIT_R = 40;    // orbit radius around loiter center
  const TB2_MISSILES = 4;    // MAM-L payload

  /* ── Faction helpers ────────────────────────────────────────────── */
  function factionForType(type) {
    if (type === DRONE_TYPE.ENEMY_BOMBER || type === DRONE_TYPE.ENEMY_FPV || type === DRONE_TYPE.ENEMY_OBSERVER) return 'russian';
    return 'ukrainian';
  }

  /* ── State ───────────────────────────────────────────────────────── */
  const drones = [];
  let _scene = null;
  let _camera = null;
  let nextId = 1;
  let _possessedDrone = null;
  var _explosionIntervals = [];
  var _activeExplosions = [];
  var _droneCacheDirty = true;
  var _cacheStamp = 1;

  /* ── Drone Nests ─────────────────────────────────────────────────── */
  var _droneNests = [];  // { x, y, z, alive, hp, mesh }
  var _nestMaxHp = 120;

  function registerNest(x, y, z) {
    _droneNests.push({ x: x, y: y, z: z, alive: true, hp: _nestMaxHp, mesh: null });
  }

  function buildNestMarker(nest) {
    if (!_scene) return;
    var g = new THREE.Group();
    // Red antenna beacon
    var poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 4, 6);
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 5, 0);
    g.add(pole);
    // Blinking red light
    var lightGeo = new THREE.SphereGeometry(0.2, 6, 6);
    var lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(0, 7.2, 0);
    light.userData.isNestLight = true;
    g.add(light);
    // Radar dish
    var dishGeo = new THREE.ConeGeometry(0.5, 0.3, 8);
    var dishMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(0, 6.5, 0);
    dish.rotation.x = Math.PI * 0.5;
    g.add(dish);
    g.position.set(nest.x, nest.y, nest.z);
    _scene.add(g);
    nest.mesh = g;
  }

  function initNests() {
    if (typeof window.VoxelWorld === 'undefined' || !window.VoxelWorld.getDroneNestPositions) return;
    var positions = window.VoxelWorld.getDroneNestPositions();
    for (var i = 0; i < positions.length; i++) {
      registerNest(positions[i].x, positions[i].y, positions[i].z);
      buildNestMarker(_droneNests[_droneNests.length - 1]);
    }
  }

  function damageNest(nestIndex, amount) {
    if (nestIndex < 0 || nestIndex >= _droneNests.length) return;
    var nest = _droneNests[nestIndex];
    if (!nest.alive) return;
    nest.hp -= amount;
    if (nest.hp <= 0) {
      nest.alive = false;
      nest.hp = 0;
      if (nest.mesh) {
        nest.mesh.traverse(function (child) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        if (_scene) _scene.remove(nest.mesh);
        nest.mesh = null;
      }
      // Destroy voxel structure
      if (typeof window.VoxelWorld !== 'undefined' && window.VoxelWorld.setBlock) {
        for (var bx = -3; bx <= 3; bx++) {
          for (var by = 0; by < 8; by++) {
            for (var bz = -3; bz <= 3; bz++) {
              window.VoxelWorld.setBlock(Math.floor(nest.x) + bx, Math.floor(nest.y) + by, Math.floor(nest.z) + bz, 0);
            }
          }
        }
      }
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('\uD83D\uDCA5 ENEMY DRONE NEST DESTROYED!', '#44ff88');
      }
    }
  }

  function getNearestNest(x, z) {
    var best = -1, bestDist = Infinity;
    for (var i = 0; i < _droneNests.length; i++) {
      if (!_droneNests[i].alive) continue;
      var dx = _droneNests[i].x - x;
      var dz = _droneNests[i].z - z;
      var d = dx * dx + dz * dz;
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }

  function getAliveNestCount() {
    var c = 0;
    for (var i = 0; i < _droneNests.length; i++) if (_droneNests[i].alive) c++;
    return c;
  }

  function getNests() { return _droneNests; }

  /* ── Create Drone Mesh ───────────────────────────────────────────── */
  function addRussianFlag(group) {
    const stripeGeo = new THREE.BoxGeometry(0.3, 0.02, 0.05);
    const white = new THREE.Mesh(stripeGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }));
    white.position.set(0, 0.095, -0.05);
    group.add(white);
    const blue = new THREE.Mesh(stripeGeo.clone(), new THREE.MeshLambertMaterial({ color: 0x0039A6 }));
    blue.position.set(0, 0.095, 0);
    group.add(blue);
    const red = new THREE.Mesh(stripeGeo.clone(), new THREE.MeshLambertMaterial({ color: 0xD52B1E }));
    red.position.set(0, 0.095, 0.05);
    group.add(red);
  }

  function buildDroneMesh(type) {
    const group = new THREE.Group();
    const stats = DRONE_STATS[type];
    const faction = factionForType(type);

    // ── Bayraktar TB2: large fixed-wing strike UAV (not a quadcopter) ──
    if (type === DRONE_TYPE.BAYRAKTAR) {
      const gray = new THREE.MeshLambertMaterial({ color: 0x9aa3ad });
      const dark = new THREE.MeshLambertMaterial({ color: 0x4a525c });
      // Fuselage (slender, bulged sensor nose)
      const fus = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 3.6), gray);
      group.add(fus);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), dark);
      nose.position.set(0, -0.08, -1.85); group.add(nose);
      // High-aspect straight wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 0.7), gray);
      wing.position.set(0, 0.12, -0.3); group.add(wing);
      // Signature inverted-V tail booms
      const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 1.0), gray);
      tailL.position.set(-0.55, 0.28, 1.7); tailL.rotation.z = 0.5; group.add(tailL);
      const tailR = tailL.clone(); tailR.position.x = 0.55; tailR.rotation.z = -0.5; group.add(tailR);
      // Pusher prop disc at the rear
      const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 10), dark);
      prop.rotation.x = Math.PI / 2; prop.position.set(0, 0, 1.95); group.add(prop);
      // MAM-L pylons under the wings (visual missiles; hidden as they fire)
      for (let mi = 0; mi < TB2_MISSILES; mi++) {
        const side = mi % 2 === 0 ? -1 : 1;
        const off = 1.0 + Math.floor(mi / 2) * 1.1;
        const mam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8), dark);
        mam.rotation.x = Math.PI / 2;
        mam.position.set(side * off, -0.12, -0.3);
        mam.userData.mamIndex = mi;
        group.add(mam);
      }
      // Ukrainian roundels on the wingtips
      const roundel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 12),
        new THREE.MeshBasicMaterial({ color: 0x0057B8 }));
      roundel.position.set(-3.0, 0.19, -0.3); group.add(roundel);
      const roundel2 = roundel.clone(); roundel2.position.x = 3.0; group.add(roundel2);
      return group;
    }

    // ── Baba Yaga: large Ukrainian heavy-lift fire-dropper hexacopter ──
    if (type === DRONE_TYPE.BABA_YAGA) {
      var byMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var byBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.7), byMat);
      group.add(byBody);
      var byYellow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.08),
        new THREE.MeshLambertMaterial({ color: 0xFFD700 }));
      byYellow.position.set(0, 0.1, 0); group.add(byYellow);
      var byYellow2 = byYellow.clone(); byYellow2.rotation.y = Math.PI / 2; group.add(byYellow2);
      for (var byi = 0; byi < 6; byi++) {
        var byAngle = (byi / 6) * Math.PI * 2;
        var byArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.38),
          new THREE.MeshLambertMaterial({ color: 0x333333 }));
        byArm.position.set(Math.cos(byAngle) * 0.42 * 0.7, 0.04, Math.sin(byAngle) * 0.42 * 0.7);
        byArm.rotation.y = byAngle + Math.PI / 2;
        group.add(byArm);
        var byRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 8),
          new THREE.MeshBasicMaterial({ color: 0x889900, transparent: true, opacity: 0.5 }));
        byRotor.position.set(Math.cos(byAngle) * 0.62, 0.08, Math.sin(byAngle) * 0.62);
        byRotor.userData.isRotor = true;
        group.add(byRotor);
      }
      for (var byci = 0; byci < 5; byci++) {
        var byCa = (byci / 5) * Math.PI * 2;
        var byCan = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.22, 8),
          new THREE.MeshLambertMaterial({ color: byci === 0 ? 0xff4400 : 0xcc2200 }));
        byCan.position.set(Math.cos(byCa) * 0.2, -0.2, Math.sin(byCa) * 0.2);
        byCan.userData.isPayload = true;
        byCan.userData.canisterIndex = byci;
        group.add(byCan);
      }
      var byGlow = new THREE.PointLight(0xff6600, 2.0, 5);
      byGlow.position.set(0, -0.2, 0);
      group.add(byGlow);
      group.castShadow = true;
      return group;
    }

    // Body color by faction and type
    let bodyColor;
    if (faction === 'russian') {
      bodyColor = type === DRONE_TYPE.ENEMY_BOMBER ? 0x3a3a2a : 0x8B0000;
    } else {
      bodyColor = 0x0057B8; // Ukrainian blue for all friendly drones
    }

    const bodyGeo = new THREE.BoxGeometry(0.5, 0.15, 0.5);
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // National flag stripes on drones
    if (faction === 'russian') {
      addRussianFlag(group);
    } else {
      // Ukrainian flag (blue top, yellow bottom)
      var flagGeo = new THREE.BoxGeometry(0.3, 0.02, 0.05);
      var blueStripe = new THREE.Mesh(flagGeo, new THREE.MeshLambertMaterial({ color: 0x005BBB }));
      blueStripe.position.set(0, 0.095, -0.03);
      group.add(blueStripe);
      var yellowStripe = new THREE.Mesh(flagGeo.clone(), new THREE.MeshLambertMaterial({ color: 0xFFD500 }));
      yellowStripe.position.set(0, 0.095, 0.03);
      group.add(yellowStripe);
    }

    // 4 Arms + rotors
    const armPositions = [
      [-0.35, 0.05, -0.35], [0.35, 0.05, -0.35],
      [-0.35, 0.05,  0.35], [0.35, 0.05,  0.35]
    ];
    for (const pos of armPositions) {
      // Arm
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 0.04),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
      );
      arm.position.set(...pos);
      group.add(arm);

      // Rotor disc
      const rotor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.02, 8),
        new THREE.MeshBasicMaterial({ color: 0xAABBCC, transparent: true, opacity: 0.4 })
      );
      rotor.position.set(pos[0], pos[1] + 0.06, pos[2]);
      rotor.userData.isRotor = true;
      group.add(rotor);
    }

    // Camera lens (front)
    const lens = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x001122 })
    );
    lens.position.set(0, -0.05, -0.28);
    group.add(lens);

    // Payload indicator for bomb drone
    if (type === DRONE_TYPE.BOMB) {
      const payload = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.06, 0.2, 8),
        new THREE.MeshLambertMaterial({ color: 0x666622 })
      );
      payload.position.set(0, -0.15, 0);
      payload.userData.isPayload = true;
      group.add(payload);
    }

    // Incendiary drone: red payload + flame glow
    if (type === DRONE_TYPE.INCENDIARY) {
      const payload = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.07, 0.22, 8),
        new THREE.MeshLambertMaterial({ color: 0xcc3300 })
      );
      payload.position.set(0, -0.15, 0);
      payload.userData.isPayload = true;
      group.add(payload);
      const glow = new THREE.PointLight(0xff4400, 1.5, 4);
      glow.position.set(0, -0.15, 0);
      group.add(glow);
    }

    group.castShadow = true;
    return group;
  }

  /* ── Init ────────────────────────────────────────────────────────── */
  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    drones.length = 0;
    nextId = 1;
    _possessedDrone = null;
    _invalidateDroneCaches();
    // Clear old nests and rebuild from level
    for (var ni = 0; ni < _droneNests.length; ni++) {
      if (_droneNests[ni].mesh) {
        _droneNests[ni].mesh.traverse(function (c) { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
        if (_scene) _scene.remove(_droneNests[ni].mesh);
      }
    }
    _droneNests.length = 0;
    initNests();
  }

  function _invalidateDroneCaches() {
    _droneCacheDirty = true;
    _cacheStamp++;
  }

  /* ── Spawn Drone ─────────────────────────────────────────────────── */
  function spawn(x, y, z, type) {
    type = type || DRONE_TYPE.RECON;
    const stats = DRONE_STATS[type];
    const drone = {
      id: nextId++,
      type,
      faction: factionForType(type),
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
      health:   stats.health,
      battery:  stats.battery,
      maxBattery: stats.battery,
      speed:    stats.speed,
      damage:   stats.damage,
      range:    stats.range,
      mesh:     null,
      alive:    true,
      active:   true,  // powered on
      hasPayload: type === DRONE_TYPE.BOMB || type === DRONE_TYPE.ENEMY_BOMBER || type === DRONE_TYPE.INCENDIARY || type === DRONE_TYPE.BABA_YAGA,
      payloadCount: type === DRONE_TYPE.BABA_YAGA ? 5 : undefined,
      _babaDropCooldown: 0,

      // AI patrol (for surveillance drones)
      patrolPoints: [],
      patrolIdx: 0,
      aiControlled: false,

      // Marks (recon)
      marks: [],
    };

    drone.mesh = buildDroneMesh(type);
    drone.mesh.position.copy(drone.position);
    drone.mesh.userData.droneId = drone.id;
    drone.mesh.userData.isDrone = true;
    drone.mesh.userData.faction = drone.faction;
    // Tag every child so raycaster hits register as drone hits regardless of which part is struck
    drone.mesh.traverse(function (c) {
      c.userData.droneId = drone.id;
      c.userData.isDrone = true;
      c.userData.faction = drone.faction;
    });

    // Attach faction patch (Ukrainian for friendly drones, Russian for enemy)
    if (typeof Flags !== 'undefined' && Flags.attachToDrone) {
      try { Flags.attachToDrone(drone); } catch (e) {}
    }

    if (_scene) _scene.add(drone.mesh);
    drones.push(drone);
    _invalidateDroneCaches();
    return drone;
  }

  function findByMesh(mesh) {
    if (!mesh) return null;
    var node = mesh;
    while (node) {
      if (node.userData && node.userData.droneId) {
        for (var i = 0; i < drones.length; i++) {
          if (drones[i].id === node.userData.droneId && drones[i].alive) return drones[i];
        }
        return null;
      }
      node = node.parent;
    }
    return null;
  }

  function getAllMeshes() {
    var arr = [];
    for (var i = 0; i < drones.length; i++) {
      if (drones[i].alive && drones[i].mesh) arr.push(drones[i].mesh);
    }
    return arr;
  }

  /* ── Possess / Release Drone ─────────────────────────────────────── */
  function possess(droneId) {
    const drone = drones.find(d => d.id === droneId && d.alive && d.active);
    if (!drone) return false;
    _possessedDrone = drone;
    drone.aiControlled = false;
    // EYE/FPV is the default view on possess — hide the drone's own mesh up-front
    // so its lens/body never flashes in the centre of the screen for one frame.
    if (drone.mesh) drone.mesh.visible = false;
    if (typeof CameraSystem !== 'undefined') {
      if (CameraSystem.setDroneViewMode) CameraSystem.setDroneViewMode('eye');
      CameraSystem.setMode(CameraSystem.MODE.DRONE);
      CameraSystem.setDroneTarget(drone.mesh);
      // Force camera to follow drone immediately
      if (CameraSystem.getCamera && CameraSystem.getDroneViewMode && CameraSystem.getMode) {
        const cam = CameraSystem.getCamera();
        if (cam && CameraSystem.getMode() === CameraSystem.MODE.DRONE) {
          cam.position.copy(drone.mesh.position);
          cam.quaternion.copy(drone.mesh.quaternion);
        }
      }
    }
    return true;
  }

  function release() {
    if (_possessedDrone) {
      _possessedDrone = null;
      if (typeof CameraSystem !== 'undefined') {
        if (CameraSystem.setDroneTarget) CameraSystem.setDroneTarget(null);
        if (CameraSystem.setDroneViewMode) CameraSystem.setDroneViewMode('eye');
        CameraSystem.setMode(CameraSystem.MODE.FIRST_PERSON);
      }
    }
  }

  function getPossessed() { return _possessedDrone; }
  function isPossessing() { return _possessedDrone !== null; }

  /* ── Drone Input (when possessed) ────────────────────────────────── */
  const _droneKeys = { w: false, a: false, s: false, d: false, up: false, down: false };

  function setDroneKey(key, pressed) {
    if (key in _droneKeys) _droneKeys[key] = pressed;
  }

  /* ── Enemy Drone AI ───────────────────────────────────────────────── */
  function updateEnemyDrone(drone, delta) {
    // Get player position from GameManager
    var gm = (typeof GameManager !== 'undefined') ? GameManager : null;
    var _p = gm && gm.getPlayer ? gm.getPlayer() : null;
    var playerPos = _p && _p.position ? _p.position : _fallbackPlayerPos;

    var dx = playerPos.x - drone.position.x;
    var dz = playerPos.z - drone.position.z;
    var distXZ = Math.sqrt(dx * dx + dz * dz);

    if (drone.type === DRONE_TYPE.ENEMY_BOMBER) {
      // Bomber: circle at altitude 18, drop bombs when close
      var targetAlt = 18;
      var altDiff = targetAlt - drone.position.y;
      drone.velocity.y = altDiff * 2;

      if (distXZ > 8) {
        // Move toward player
        var nx = dx / distXZ;
        var nz = dz / distXZ;
        drone.velocity.x = nx * drone.speed * 0.6;
        drone.velocity.z = nz * drone.speed * 0.6;
      } else {
        // Circle around player
        drone._circleAngle = (drone._circleAngle || Math.atan2(dz, dx)) + delta * 1.5;
        var angle = drone._circleAngle;
        drone.velocity.x = Math.cos(angle) * drone.speed * 0.4;
        drone.velocity.z = Math.sin(angle) * drone.speed * 0.4;

        // Drop bomb every 4 seconds
        if (!drone._bombTimer) drone._bombTimer = 4;
        drone._bombTimer -= delta;
        if (drone._bombTimer <= 0 && distXZ < 12) {
          drone._bombTimer = 4;
          // Create explosion at ground below drone
          var bombX = drone.position.x;
          var bombZ = drone.position.z;
          var bombY = (typeof window.VoxelWorld !== 'undefined') ? window.VoxelWorld.getTerrainHeight(bombX, bombZ) : 0;
          // Damage player via GameManager
          var bombPos = new THREE.Vector3(bombX, bombY, bombZ);
          var distToPlayer = bombPos.distanceTo(playerPos);
          if (distToPlayer < 6 && gm) {
            var dmg = Math.max(1, Math.floor(drone.damage * (1 - distToPlayer / 6)));
            var p = gm.getPlayer();
            if (p && !p.godMode) p.hp -= dmg;
          }
          // Terrain destruction
          if (typeof window.VoxelWorld !== 'undefined' && window.VoxelWorld.setBlock) {
            for (var rx = -2; rx <= 2; rx++) {
              for (var rz = -2; rz <= 2; rz++) {
                window.VoxelWorld.setBlock(Math.floor(bombX) + rx, Math.floor(bombY), Math.floor(bombZ) + rz, 0);
              }
            }
          }
          // Visual: spawn smoke
          if (typeof Tracers !== 'undefined' && Tracers.spawnSmoke) {
            Tracers.spawnSmoke(new THREE.Vector3(bombX, bombY, bombZ));
          }
        }
      }
    } else if (drone.type === DRONE_TYPE.ENEMY_FPV) {
      // FPV kamikaze: dive directly at player at high speed
      var targetY = playerPos.y + 1;
      var dy = targetY - drone.position.y;
      var dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist3D > 2) {
        var speed = drone.speed;
        drone.velocity.x = (dx / dist3D) * speed;
        drone.velocity.y = (dy / dist3D) * speed;
        drone.velocity.z = (dz / dist3D) * speed;
      } else {
        // Impact! Full kamikaze explosion
        var impactPos = drone.position.clone();
        // Blast radius damage to player + nearby enemies
        if (gm) {
          var p = gm.getPlayer();
          if (p && !p.godMode) {
            var d2p = impactPos.distanceTo(p.position);
            if (d2p < 5) {
              var blastDmg = Math.round(drone.damage * (1 - d2p / 5));
              p.hp = Math.max(0, p.hp - blastDmg);
              if (typeof HUD !== 'undefined') {
                if (HUD.setHealth) HUD.setHealth(p.hp, p.maxHp);
                if (HUD.showDamageFlash) HUD.showDamageFlash(0xff4400, 0.7);
                if (HUD.notifyPickup) HUD.notifyPickup('💥 ENEMY FPV HIT!', '#ff4400');
              }
            }
          }
        }
        // Area damage to enemies caught in blast
        if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
          Enemies.damageInRadius(impactPos, 4, drone.damage * 0.5);
        }
        // Explosion visuals
        if (typeof Tracers !== 'undefined') {
          if (Tracers.spawnExplosion) Tracers.spawnExplosion(impactPos, 4);
          else if (Tracers.spawnSmoke) Tracers.spawnSmoke(impactPos);
        }
        if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(0.7);
        // Terrain crater
        var ix = Math.floor(impactPos.x);
        var iy = Math.floor(impactPos.y);
        var iz = Math.floor(impactPos.z);
        if (typeof window.VoxelWorld !== 'undefined' && window.VoxelWorld.setBlock) {
          for (var bx = -1; bx <= 1; bx++) {
            for (var bz = -1; bz <= 1; bz++) {
              window.VoxelWorld.setBlock(ix + bx, iy, iz + bz, 0);
            }
          }
        }
        destroyDrone(drone);
        return;
      }
    }

    // Face movement direction
    if (drone.velocity.length() > 0.1) {
      drone.rotation.y = Math.atan2(drone.velocity.x, drone.velocity.z);
    }
  }

  /* ── Spawn Enemy Drone (convenience) ────────────────────────────── */
  function spawnEnemyDrone(x, y, z, type) {
    type = type || DRONE_TYPE.ENEMY_BOMBER;
    var d = spawn(x, y, z, type);
    d.aiControlled = true; // Enable AI processing
    return d;
  }

  /* ── Update All Drones ───────────────────────────────────────────── */
  var _droneMotorActive = false;
  /* ── Bayraktar TB2: fixed-wing orbit + MAM-L auto-engage ──────────── */
  var _mamls = [];   // in-flight guided missiles { pos, vel, target, life, mesh }

  function _tb2PickTarget(drone) {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return null;
    var all = Enemies.getAll();
    var best = null, bestScore = -1;
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive || !e.mesh || e._tb2Locked) continue;
      var tn = e.typeCfg && e.typeCfg.name;
      if (tn !== 'TANK' && tn !== 'BTR') continue;
      var d = e.mesh.position.distanceTo(drone.position);
      if (d > drone.range) continue;
      // prefer tanks, prefer convoy column leaders, prefer closer
      var score = (tn === 'TANK' ? 200 : 100) + (e._convoy && e._convoy.slot === 0 ? 80 : 0) - d * 0.2;
      if (score > bestScore) { bestScore = score; best = e; }
    }
    return best;
  }

  function updateBayraktar(drone, delta) {
    // Banked orbit around the loiter center at constant altitude
    if (!drone.loiterCenter) drone.loiterCenter = drone.position.clone();
    drone.orbitAngle = (drone.orbitAngle || 0) + (drone.speed / TB2_ORBIT_R) * delta;
    var tx = drone.loiterCenter.x + Math.cos(drone.orbitAngle) * TB2_ORBIT_R;
    var tz = drone.loiterCenter.z + Math.sin(drone.orbitAngle) * TB2_ORBIT_R;
    var ty = TB2_ALT;
    drone.velocity.set(tx - drone.position.x, (ty - drone.position.y) * 0.5, tz - drone.position.z);
    if (drone.velocity.lengthSq() > 0.01) {
      drone.velocity.normalize().multiplyScalar(drone.speed);
    }
    // Face along the velocity, bank into the turn
    drone.rotation.y = Math.atan2(-drone.velocity.x, -drone.velocity.z);
    drone.rotation.z = 0.35; // constant bank in the orbit
    // Auto-engage: one MAM-L every few seconds while armor is in range
    drone.fireTimer = (drone.fireTimer || 0) - delta;
    if (drone.missiles > 0 && drone.fireTimer <= 0) {
      var tgt = _tb2PickTarget(drone);
      if (tgt) {
        drone.fireTimer = 6;
        drone.missiles--;
        tgt._tb2Locked = true; // one missile per target at a time
        _launchMaml(drone, tgt);
        // hide one pylon missile on the model
        try {
          var idx = TB2_MISSILES - 1 - drone.missiles;
          drone.mesh.traverse(function (c) { if (c.userData && c.userData.mamIndex === idx) c.visible = false; });
        } catch (e) {}
        try { if (typeof HUD !== 'undefined' && HUD.showToast) HUD.showToast('🛩 TB2 — MAM-L AWAY', 2200, '#7fd0ff'); } catch (e2) {}
      }
    }
    // Winchester (out of missiles): leave the AO and despawn
    if (drone.missiles <= 0 && !drone._rtb && _mamls.length === 0) {
      drone._rtb = true;
      drone.loiterCenter = new THREE.Vector3(drone.position.x + 400, TB2_ALT + 30, drone.position.z + 400);
      try { if (typeof HUD !== 'undefined' && HUD.showToast) HUD.showToast('🛩 TB2 WINCHESTER — returning to base', 3000, '#9ab'); } catch (e) {}
      setTimeout(function () { try { destroyDrone(drone.id); } catch (e2) {} }, 12000);
    }
  }

  function _launchMaml(drone, target) {
    var geo = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 8);
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffe0a0 }));
    mesh.position.copy(drone.position);
    if (_scene) _scene.add(mesh);
    _mamls.push({
      pos: drone.position.clone(),
      vel: new THREE.Vector3(0, -8, 0),
      target: target,
      life: 12,
      mesh: mesh,
    });
  }

  function _updateMamls(delta) {
    for (var i = _mamls.length - 1; i >= 0; i--) {
      var m = _mamls[i];
      m.life -= delta;
      var tgtAlive = m.target && m.target.alive && m.target.mesh;
      if (tgtAlive) {
        // steer toward the target (same lerp-style homing as AT weapons)
        var want = m.target.mesh.position.clone().sub(m.pos).normalize().multiplyScalar(40);
        m.vel.lerp(want, Math.min(1, 2.2 * delta));
      }
      m.pos.addScaledVector(m.vel, delta);
      m.mesh.position.copy(m.pos);
      m.mesh.lookAt(m.pos.clone().add(m.vel));
      var hit = tgtAlive && m.pos.distanceTo(m.target.mesh.position) < 2.5;
      var ground = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
        ? m.pos.y <= VoxelWorld.getTerrainHeight(m.pos.x, m.pos.z) : m.pos.y <= 0;
      if (hit || ground || m.life <= 0) {
        if (tgtAlive) m.target._tb2Locked = false;
        if (hit) {
          // Top-attack: direct full damage (bypasses horizontal hull armor
          // by design — the missile dives onto the turret roof) + splash.
          try { Enemies.damage(m.target, 1200, false, 'ATGM'); } catch (e) {}
          try { if (Enemies.damageInRadius) Enemies.damageInRadius(m.pos, 3, 150); } catch (e2) {}
        }
        try { createDroneExplosion(m.pos); } catch (e3) {}
        try { if (typeof AudioSystem !== 'undefined' && AudioSystem.playExplosion) AudioSystem.playExplosion(); } catch (e4) {}
        if (_scene && m.mesh) _scene.remove(m.mesh);
        _mamls.splice(i, 1);
      }
    }
  }

  /* ── Call-in: Bayraktar on station (90s cooldown) ─────────────────── */
  var _tb2Cooldown = 0; // timestamp (ms) when next call is allowed
  function callBayraktar(centerOverride) {
    var now = Date.now();
    if (now < _tb2Cooldown) {
      var waitS = Math.ceil((_tb2Cooldown - now) / 1000);
      try { if (typeof HUD !== 'undefined' && HUD.showToast) HUD.showToast('🛩 TB2 rearming — ' + waitS + 's', 2500, '#9ab'); } catch (e) {}
      return false;
    }
    var gm = (typeof GameManager !== 'undefined') ? GameManager : null;
    var player = gm && gm.getPlayer ? gm.getPlayer() : null;
    var pos = player && player.position ? player.position : _fallbackPlayerPos;
    var center = centerOverride || null;
    if (!center && typeof ConvoySystem !== 'undefined' && ConvoySystem.getDefenseZone) {
      var dz = ConvoySystem.getDefenseZone();
      center = new THREE.Vector3(dz.x, TB2_ALT, dz.z);
    }
    if (!center) center = new THREE.Vector3(pos.x, TB2_ALT, pos.z);
    var tb2 = spawn(pos.x - 60, TB2_ALT, pos.z - 60, DRONE_TYPE.BAYRAKTAR);
    tb2.aiControlled = true;          // drains battery, flies itself
    tb2.loiterCenter = center;
    tb2.missiles = TB2_MISSILES;
    _tb2Cooldown = now + 90000;
    try { if (typeof HUD !== 'undefined' && HUD.showToast) HUD.showToast('🛩 BAYRAKTAR ON STATION — ' + TB2_MISSILES + ' MAM-L ready', 4000, '#7fd0ff'); } catch (e) {}
    return tb2.id;
  }

  function update(delta) {
    _updateMamls(delta);
    var nearestDroneDist = Infinity;
    for (const drone of drones) {
      if (!drone.alive || !drone.active) continue;

      // Battery drain (only when actively flying/possessed; idle friendly drones recharge)
      if (drone === _possessedDrone || drone.aiControlled || drone.faction === 'russian') {
        drone.battery -= delta * 0.5;
        if (drone.battery <= 0) {
          drone.active = false;
          // Drone falls
          drone.velocity.y = -5;
        }
      } else if (drone.faction === 'ukrainian' && drone.battery < drone.maxBattery) {
        // Idle friendly drones auto-recharge
        drone.battery = Math.min(drone.maxBattery, drone.battery + delta * 1.0);
      }

      if (drone === _possessedDrone) {
        updatePossessedDrone(drone, delta);
      } else if (drone.faction === 'russian') {
        // Enemy drones always use enemy AI (bomber/FPV/observer) regardless of aiControlled flag.
        // Observer reinforcement timer + patrol fallback are handled in updateAIDrone.
        if (drone.type === DRONE_TYPE.ENEMY_OBSERVER) {
          updateAIDrone(drone, delta);
        } else {
          updateEnemyDrone(drone, delta);
        }
      } else if (drone.type === DRONE_TYPE.BAYRAKTAR) {
        updateBayraktar(drone, delta);
      } else {
        // Friendly autonomous drones: hunt + attack enemies (FPV/BOMB/KAMIKAZE) or scout (RECON/SURVEILLANCE)
        updateAIDrone(drone, delta);
      }

      // Apply velocity
      drone.position.addScaledVector(drone.velocity, delta);

      // Ground collision
      const terrainH = (typeof window.VoxelWorld !== 'undefined' ? window.VoxelWorld.getTerrainHeight(drone.position.x, drone.position.z) : 0) + 1;
      if (drone.position.y < terrainH) {
        if (drone.type === DRONE_TYPE.FPV_ATTACK) {
          fireAttack(drone.id);
          continue;
        }
        drone.position.y = terrainH;
        if (!drone.active) {
          destroyDrone(drone);
          continue;
        }
      }

      // Update mesh
      drone.mesh.position.copy(drone.position);

      if (drone.type === DRONE_TYPE.RECON && typeof MissionSystem !== 'undefined' && MissionSystem.onDroneScout) {
        MissionSystem.onDroneScout(drone.position);
      }

      // Rotor animation
      drone.mesh.children.forEach(child => {
        if (child.userData.isRotor) {
          child.rotation.y += delta * 30;
        }
      });

      // Track nearest drone distance for motor sound — but only the drone the
      // player is piloting or hostile drones overhead should buzz. Idle friendly
      // companion drones were creating an ever-present mechanical hum.
      if (typeof CameraSystem !== 'undefined') {
        var motorRelevant = (drone === _possessedDrone) || drone.faction === 'russian';
        if (motorRelevant) {
          var cam = CameraSystem.getCamera ? CameraSystem.getCamera() : null;
          if (cam) {
            var dd = drone.position.distanceTo(cam.position);
            if (dd < nearestDroneDist) nearestDroneDist = dd;
          }
        }
      }
    }

    // Defensive: ensure AudioSystem motor stubs always exist for QA/headless
    if (typeof window !== 'undefined') {
      if (!window.AudioSystem) window.AudioSystem = {};
      if (typeof window.AudioSystem.startDroneMotor !== 'function') window.AudioSystem.startDroneMotor = function(){};
      if (typeof window.AudioSystem.updateDroneMotor !== 'function') window.AudioSystem.updateDroneMotor = function(){};
      if (typeof window.AudioSystem.stopDroneMotor !== 'function') window.AudioSystem.stopDroneMotor = function(){};
    }
    // Drone motor sound — start/update/stop based on nearest drone
    if (typeof window.AudioSystem !== 'undefined') {
      if (nearestDroneDist < 40) {
        if (!_droneMotorActive) { window.AudioSystem.startDroneMotor(); _droneMotorActive = true; }
        window.AudioSystem.updateDroneMotor(nearestDroneDist);
      } else if (_droneMotorActive) {
        window.AudioSystem.stopDroneMotor();
        _droneMotorActive = false;
      }
    }

    // Nest light blinking
    for (var ni = 0; ni < _droneNests.length; ni++) {
      var nest = _droneNests[ni];
      if (!nest.alive || !nest.mesh) continue;
      nest.mesh.traverse(function (c) {
        if (c.userData && c.userData.isNestLight) {
          c.visible = (Math.floor(performance.now() / 500) % 2 === 0);
        }
      });
    }
  }

  function updatePossessedDrone(drone, delta) {
    const yaw = (typeof CameraSystem !== 'undefined') ? CameraSystem.getYaw() : 0;
    const pitch = (typeof CameraSystem !== 'undefined') ? CameraSystem.getPitch() : 0;

    // Movement in drone's local space
    _dTmpFwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    _dTmpRight.set(Math.cos(yaw), 0, -Math.sin(yaw));

    drone.velocity.set(0, 0, 0);

    if (_droneKeys.w) drone.velocity.addScaledVector(_dTmpFwd, drone.speed);
    if (_droneKeys.s) drone.velocity.addScaledVector(_dTmpFwd, -drone.speed);
    if (_droneKeys.a) drone.velocity.addScaledVector(_dTmpRight, -drone.speed);
    if (_droneKeys.d) drone.velocity.addScaledVector(_dTmpRight, drone.speed);
    if (_droneKeys.up) drone.velocity.y = drone.speed * 0.6;
    if (_droneKeys.down) drone.velocity.y = -drone.speed * 0.6;

    // Tilt based on velocity
    drone.mesh.rotation.set(
      drone.velocity.z * 0.02,
      yaw,
      -drone.velocity.x * 0.02
    );

    // FPV auto-explode on contact: if within 1.5m of any enemy, kamikaze
    if (drone.type === DRONE_TYPE.FPV_ATTACK) {
      var _hitEnemy = false;
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var _eAll = Enemies.getAll();
        for (var _ei = 0; _ei < _eAll.length; _ei++) {
          var _ee = _eAll[_ei];
          if (!_ee || !_ee.alive || !_ee.mesh) continue;
          var _edx = _ee.mesh.position.x - drone.position.x;
          var _edy = _ee.mesh.position.y - drone.position.y;
          var _edz = _ee.mesh.position.z - drone.position.z;
          if ((_edx*_edx + _edy*_edy + _edz*_edz) < 6.25) { _hitEnemy = true; break; } // 2.5 unit radius
        }
      }
      if (!_hitEnemy && typeof VehicleSystem !== 'undefined' && VehicleSystem.getAll) {
        var _vAll = VehicleSystem.getAll();
        for (var _vi = 0; _vi < _vAll.length; _vi++) {
          var _vv = _vAll[_vi];
          if (!_vv || !_vv.mesh || !_vv.alive) continue;
          if (drone.position.distanceTo(_vv.mesh.position) < 2.5) { _hitEnemy = true; break; }
        }
      }
      if (_hitEnemy) {
        fireAttack(drone.id);
      }
    }
  }

  function updateAIDrone(drone, delta) {
    // ── Friendly autonomous drones: hunt and attack enemies ──
    if (drone.faction === 'ukrainian') {
      // Find nearest enemy
      var nearestEnemy = null;
      var nearestDsq = Infinity;
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var elist = Enemies.getAll();
        for (var ei = 0; ei < elist.length; ei++) {
          var en = elist[ei];
          if (!en || !en.alive || !en.mesh) continue;
          var edx = en.mesh.position.x - drone.position.x;
          var edz = en.mesh.position.z - drone.position.z;
          var edy = en.mesh.position.y - drone.position.y;
          var ed3 = edx * edx + edy * edy + edz * edz;
          if (ed3 < nearestDsq) { nearestDsq = ed3; nearestEnemy = en; }
        }
      }
      var rangeSq = drone.range * drone.range;

      // FPV_ATTACK: kamikaze dive at enemy
      if (drone.type === DRONE_TYPE.FPV_ATTACK && nearestEnemy && nearestDsq < rangeSq) {
        var fdx = nearestEnemy.mesh.position.x - drone.position.x;
        var fdy = (nearestEnemy.mesh.position.y + 1) - drone.position.y;
        var fdz = nearestEnemy.mesh.position.z - drone.position.z;
        var fd = Math.sqrt(fdx * fdx + fdy * fdy + fdz * fdz);
        if (fd > 1.2) {
          drone.velocity.x = (fdx / fd) * drone.speed;
          drone.velocity.y = (fdy / fd) * drone.speed;
          drone.velocity.z = (fdz / fd) * drone.speed;
          drone.mesh.rotation.y = Math.atan2(drone.velocity.x, drone.velocity.z);
        } else {
          // Impact — damage in radius, terrain destruction, player/NPC damage, self-destruct
          if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
            Enemies.damageInRadius(drone.position, 4, drone.damage);
          }
          // Damage player if too close
          try {
            const player = window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer();
            if (player && player.position && !player.godMode) {
              const ddx = player.position.x - drone.position.x;
              const ddy = player.position.y - drone.position.y;
              const ddz = player.position.z - drone.position.z;
              const ddist = Math.sqrt(ddx*ddx + ddy*ddy + ddz*ddz);
              if (ddist < 4) {
                const falloff = 1 - (ddist / 4) * 0.5;
                player.hp = Math.max(1, (player.hp || 100) - Math.floor(drone.damage * falloff));
                if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp || 100);
                if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff3300, 0.4);
              }
            }
          } catch (e) {}
          // Damage friendly NPCs if too close
          try {
            if (typeof NPCSystem !== 'undefined' && NPCSystem.damageInRadius) {
              NPCSystem.damageInRadius(drone.position, 4, drone.damage);
            }
          } catch (e) {}
          // Terrain destruction — carve a crater
          try {
            if (typeof VoxelWorld !== 'undefined' && VoxelWorld.setBlock) {
              const cx = Math.round(drone.position.x);
              const cy = Math.round(drone.position.y);
              const cz = Math.round(drone.position.z);
              for (let bx = -1; bx <= 1; bx++) {
                for (let by = -1; by <= 1; by++) {
                  for (let bz = -1; bz <= 1; bz++) {
                    if (Math.abs(bx) + Math.abs(by) + Math.abs(bz) <= 2) {
                      var vy = cy + by;
                      if (vy > 0) VoxelWorld.setBlock(cx + bx, vy, cz + bz, 0);
                    }
                  }
                }
              }
            }
          } catch (e) {}
          createDroneExplosion(drone.position.clone());
          if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion();
          destroyDrone(drone);
          return;
        }
        return;
      }

      // BOMB: hover to enemy, drop payload, then return
      if (drone.type === DRONE_TYPE.BOMB && drone.hasPayload && nearestEnemy && nearestDsq < rangeSq) {
        var bdx = nearestEnemy.mesh.position.x - drone.position.x;
        var bdz = nearestEnemy.mesh.position.z - drone.position.z;
        var bxz = Math.sqrt(bdx * bdx + bdz * bdz);
        var bombAlt = nearestEnemy.mesh.position.y + 12;
        drone.velocity.y = (bombAlt - drone.position.y) * 1.5;
        if (bxz > 1.5) {
          drone.velocity.x = (bdx / bxz) * drone.speed * 0.7;
          drone.velocity.z = (bdz / bxz) * drone.speed * 0.7;
        } else {
          drone.velocity.x = 0;
          drone.velocity.z = 0;
          // Drop the payload
          drone.hasPayload = false;
          drone.mesh.children.forEach(function (c) { if (c.userData.isPayload) c.visible = false; });
          var dropPos = drone.position.clone();
          dropPos.y = nearestEnemy.mesh.position.y;
          if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
            Enemies.damageInRadius(dropPos, 5, drone.damage);
          }
          createDroneExplosion(dropPos);
          if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion();
        }
        if (drone.velocity.length() > 0.1) drone.mesh.rotation.y = Math.atan2(drone.velocity.x, drone.velocity.z);
        return;
      }

      // KAMIKAZE: pure dive bomber, no payload — same as FPV_ATTACK essentially
      if (drone.type === DRONE_TYPE.KAMIKAZE && nearestEnemy && nearestDsq < rangeSq) {
        var kdx = nearestEnemy.mesh.position.x - drone.position.x;
        var kdy = nearestEnemy.mesh.position.y - drone.position.y;
        var kdz = nearestEnemy.mesh.position.z - drone.position.z;
        var kd = Math.sqrt(kdx * kdx + kdy * kdy + kdz * kdz);
        if (kd > 1) {
          drone.velocity.x = (kdx / kd) * drone.speed;
          drone.velocity.y = (kdy / kd) * drone.speed;
          drone.velocity.z = (kdz / kd) * drone.speed;
          drone.mesh.rotation.y = Math.atan2(drone.velocity.x, drone.velocity.z);
        } else {
          if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
            Enemies.damageInRadius(drone.position, 4, drone.damage);
          }
          createDroneExplosion(drone.position.clone());
          if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playExplosion) window.AudioSystem.playExplosion();
          destroyDrone(drone);
          return;
        }
        return;
      }

      // BABA YAGA: slow heavy hexacopter, drops thermite on enemy clusters on cooldown
      if (drone.type === DRONE_TYPE.BABA_YAGA && nearestEnemy && nearestDsq < rangeSq) {
        drone._babaDropCooldown = (drone._babaDropCooldown || 0) - delta;
        var bydx = nearestEnemy.mesh.position.x - drone.position.x;
        var bydz = nearestEnemy.mesh.position.z - drone.position.z;
        var byxz = Math.sqrt(bydx * bydx + bydz * bydz);
        var byAlt = nearestEnemy.mesh.position.y + 10;
        drone.velocity.y = (byAlt - drone.position.y) * 0.8;
        if (byxz > 5) {
          drone.velocity.x = (bydx / byxz) * drone.speed;
          drone.velocity.z = (bydz / byxz) * drone.speed;
        } else if (drone.hasPayload && drone._babaDropCooldown <= 0) {
          drone.velocity.x *= 0.5;
          drone.velocity.z *= 0.5;
          drone._babaDropCooldown = 4.5;
          var byDropPos = new THREE.Vector3(drone.position.x, nearestEnemy.mesh.position.y, drone.position.z);
          if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) Enemies.damageInRadius(byDropPos, 7, drone.damage);
          if (typeof Tracers !== 'undefined') {
            if (Tracers.spawnFire) Tracers.spawnFire(byDropPos, 7);
            if (Tracers.spawnExplosion) Tracers.spawnExplosion(byDropPos, 4);
          }
          var _byHide = false;
          drone.mesh.children.forEach(function(c) { if (!_byHide && c.userData.isPayload && c.visible) { c.visible = false; _byHide = true; } });
          drone.payloadCount = (drone.payloadCount || 1) - 1;
          if (drone.payloadCount <= 0) drone.hasPayload = false;
          if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playGunshot) window.AudioSystem.playGunshot('launcher');
          if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('🔥 BABA YAGA DROPS THERMITE!', '#ff6600');
        }
        if (drone.velocity.length() > 0.1) drone.mesh.rotation.y = Math.atan2(drone.velocity.x, drone.velocity.z);
        return;
      }

      // RECON / SURVEILLANCE without enemies in range: tag visible enemies on mission system if available
      if ((drone.type === DRONE_TYPE.RECON || drone.type === DRONE_TYPE.SURVEILLANCE) && nearestEnemy) {
        if (typeof MissionSystem !== 'undefined' && MissionSystem.onDroneScout) {
          MissionSystem.onDroneScout(nearestEnemy.mesh.position);
        }
      }
      // Fall through to patrol behavior below for drones with no current target
    }

    // Auto-generate patrol if drone has no path. Without this, friendly
    // autonomous drones spawned via launchAndPossessDrone() (and any drone
    // released from possession) freeze in place — user reported "drones don't
    // move". Build a 4-point square circuit around the drone's current spot.
    if (drone.patrolPoints.length === 0) {
      var _ax = drone.position.x;
      var _az = drone.position.z;
      var _ay = drone.position.y;
      var _pr = 18; // patrol radius
      drone.patrolPoints = [
        new THREE.Vector3(_ax + _pr, _ay, _az + _pr),
        new THREE.Vector3(_ax - _pr, _ay, _az + _pr),
        new THREE.Vector3(_ax - _pr, _ay, _az - _pr),
        new THREE.Vector3(_ax + _pr, _ay, _az - _pr),
      ];
      drone.patrolIdx = 0;
    }

    // Observer drones circle and call reinforcements
    if (drone.type === DRONE_TYPE.ENEMY_OBSERVER) {
      drone._observerTimer = (drone._observerTimer || 0) + delta;
      // Every 15 seconds, call extra enemy reinforcements
      if (drone._observerTimer >= 15) {
        drone._observerTimer = 0;
        if (typeof Enemies !== 'undefined' && Enemies.spawnReinforcement) {
          Enemies.spawnReinforcement(drone.position.x, drone.position.z, 3);
        } else if (typeof Enemies !== 'undefined' && Enemies.startWave) {
          // Fallback: spawn a few extra enemies near the observer
          if (typeof HUD !== 'undefined' && HUD.addCombatLog) {
            HUD.addCombatLog('Observer drone calling reinforcements!', '#ff4444');
          }
        }
      }
    }

    const target = drone.patrolPoints[drone.patrolIdx];
    _dTmpFwd.copy(target).sub(drone.position);
    const dist = _dTmpFwd.length();

    if (dist < 2) {
      drone.patrolIdx = (drone.patrolIdx + 1) % drone.patrolPoints.length;
      return;
    }

    _dTmpFwd.normalize().multiplyScalar(drone.speed * 0.5);
    drone.velocity.copy(_dTmpFwd);
    drone.mesh.rotation.y = Math.atan2(_dTmpFwd.x, _dTmpFwd.z);
  }

  /* ── Drone Actions ───────────────────────────────────────────────── */
  function markTarget(droneId, worldPos) {
    const drone = drones.find(d => d.id === droneId);
    if (!drone || drone.type !== DRONE_TYPE.RECON) return false;
    drone.marks.push(worldPos.clone());
    return true;
  }

  function callRecon() {
    var gm = (typeof GameManager !== 'undefined') ? GameManager : null;
    var player = gm && gm.getPlayer ? gm.getPlayer() : null;
    var pos = player && player.position ? player.position : null;
    if (!pos) return false;

    var startY = pos.y + 18;
    var recon = spawn(pos.x, startY, pos.z, DRONE_TYPE.RECON);
    var patrolHeight = startY;
    setPatrol(recon.id, [
      new THREE.Vector3(pos.x + 20, patrolHeight, pos.z + 20),
      new THREE.Vector3(pos.x - 20, patrolHeight, pos.z + 20),
      new THREE.Vector3(pos.x - 20, patrolHeight, pos.z - 20),
      new THREE.Vector3(pos.x + 20, patrolHeight, pos.z - 20),
    ]);
    return recon.id;
  }

  function dropPayload(droneId) {
    const drone = drones.find(d => d.id === droneId);
    if (!drone || !drone.hasPayload) return false;
    drone.hasPayload = false;
    // Remove payload mesh
    drone.mesh.children.forEach(child => {
      if (child.userData.isPayload) child.visible = false;
    });
    // Bomb falls to ground level before exploding
    const dropPos = drone.position.clone();
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
      dropPos.y = VoxelWorld.getTerrainHeight(Math.round(dropPos.x), Math.round(dropPos.z)) + 0.5;
    } else {
      dropPos.y -= 1;
    }
    if (typeof Enemies !== 'undefined') {
      Enemies.damageInRadius(dropPos, 6, drone.damage);
    }
    createDroneExplosion(dropPos);
    if (typeof window.AudioSystem !== 'undefined') window.AudioSystem.playGunshot('launcher');
    return { position: dropPos, damage: drone.damage };
  }

  function dropFire(droneId) {
    const drone = drones.find(d => d.id === droneId);
    if (!drone || (drone.type !== DRONE_TYPE.INCENDIARY && drone.type !== DRONE_TYPE.BABA_YAGA) || !drone.hasPayload) return false;
    if (drone.type === DRONE_TYPE.BABA_YAGA) {
      drone.payloadCount = (drone.payloadCount || 1) - 1;
      if (drone.payloadCount <= 0) drone.hasPayload = false;
      var _byHid = false;
      drone.mesh.children.forEach(function(ch) {
        if (!_byHid && ch.userData.isPayload && ch.visible) { ch.visible = false; _byHid = true; }
      });
    } else {
      drone.hasPayload = false;
      drone.mesh.children.forEach(function(ch) { if (ch.userData.isPayload) ch.visible = false; });
    }
    const dropPos = drone.position.clone();
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
      dropPos.y = VoxelWorld.getTerrainHeight(Math.round(dropPos.x), Math.round(dropPos.z)) + 0.5;
    } else {
      dropPos.y -= 1;
    }
    // Fire damage to enemies
    if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
      Enemies.damageInRadius(dropPos, 8, drone.damage);
    }
    // Spawn fire VFX
    if (typeof Tracers !== 'undefined') {
      if (Tracers.spawnFire) Tracers.spawnFire(dropPos, 8);
      if (Tracers.spawnExplosion) Tracers.spawnExplosion(dropPos, 3);
    }
    // Terrain fire: set blocks to fire type temporarily
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.setBlock) {
        var cx = Math.round(dropPos.x), cy = Math.round(dropPos.y), cz = Math.round(dropPos.z);
        for (var bx = -2; bx <= 2; bx++) {
          for (var bz = -2; bz <= 2; bz++) {
            if (bx * bx + bz * bz <= 5) {
              var by = cy;
              while (by > 0 && VoxelWorld.getBlock(cx + bx, by, cz + bz) === 0) by--;
              if (by >= 0 && VoxelWorld.getBlock(cx + bx, by, cz + bz) !== 0) {
                VoxelWorld.setBlock(cx + bx, by + 1, cz + bz, 13); // fire block
              }
            }
          }
        }
      }
    } catch (e) {}
    if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playGunshot) {
      window.AudioSystem.playGunshot('launcher');
    }
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('🔥 INCENDIARY DROPPED!', '#ff4400');
    }
    return { position: dropPos, damage: drone.damage };
  }

  function fireAttack(droneId) {
    const drone = drones.find(d => d.id === droneId);
    if (!drone || drone.type !== DRONE_TYPE.FPV_ATTACK) return false;
    // FPV kamikaze: damage enemies, player, NPCs, terrain at drone position, destroy drone
    if (typeof Enemies !== 'undefined') {
      Enemies.damageInRadius(drone.position, 4, drone.damage);
    }
    // Player damage
    try {
      const player = window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer();
      if (player && player.position && !player.godMode) {
        const ddx = player.position.x - drone.position.x;
        const ddy = player.position.y - drone.position.y;
        const ddz = player.position.z - drone.position.z;
        const ddist = Math.sqrt(ddx*ddx + ddy*ddy + ddz*ddz);
        if (ddist < 4) {
          const falloff = 1 - (ddist / 4) * 0.5;
          player.hp = Math.max(1, (player.hp || 100) - Math.floor(drone.damage * falloff));
          if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp || 100);
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff3300, 0.4);
        }
      }
    } catch (e) {}
    // NPC damage
    try {
      if (typeof NPCSystem !== 'undefined' && NPCSystem.damageInRadius) {
        NPCSystem.damageInRadius(drone.position, 4, drone.damage);
      }
    } catch (e) {}
    // Terrain destruction
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.setBlock) {
        const cx = Math.round(drone.position.x);
        const cy = Math.round(drone.position.y);
        const cz = Math.round(drone.position.z);
        for (let bx = -1; bx <= 1; bx++) {
          for (let by = -1; by <= 1; by++) {
            for (let bz = -1; bz <= 1; bz++) {
              if (Math.abs(bx) + Math.abs(by) + Math.abs(bz) <= 2) {
                var vy = cy + by;
                if (vy > 0) VoxelWorld.setBlock(cx + bx, vy, cz + bz, 0);
              }
            }
          }
        }
      }
    } catch (e) {}
    createDroneExplosion(drone.position.clone());
    if (typeof window.AudioSystem !== 'undefined') window.AudioSystem.playGunshot('launcher');
    destroyDrone(drone);
    return true;
  }

  function createDroneExplosion(pos) {
    if (!_scene) return;
    const flashGeo = new THREE.SphereGeometry(2, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xff6600, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(pos);
    _scene.add(flash);
    var explosion = { mesh: flash, geometry: flashGeo, material: flashMat, interval: null };
    let t = 0.3;
    const fadeInterval = setInterval(function () {
      t -= 0.016;
      flash.material.opacity = Math.max(0, t / 0.3) * 0.9;
      flash.scale.setScalar(1 + (0.3 - t) * 4);
      if (t <= 0) {
        if (_scene) _scene.remove(flash);
        flashGeo.dispose();
        flashMat.dispose();
        clearInterval(fadeInterval);
        var idx = _explosionIntervals.indexOf(fadeInterval);
        if (idx >= 0) _explosionIntervals.splice(idx, 1);
        idx = _activeExplosions.indexOf(explosion);
        if (idx >= 0) _activeExplosions.splice(idx, 1);
      }
    }, 16);
    explosion.interval = fadeInterval;
    _explosionIntervals.push(fadeInterval);
    _activeExplosions.push(explosion);
  }

  function setPatrol(droneId, points) {
    const drone = drones.find(d => d.id === droneId);
    if (!drone) return false;
    drone.patrolPoints = points;
    drone.patrolIdx = 0;
    drone.aiControlled = true;
    return true;
  }

  /* ── Damage / Destroy ────────────────────────────────────────────── */
  function damageDrone(droneId, amount) {
    const drone = drones.find(d => d.id === droneId);
    if (!drone || !drone.alive) return;
    drone.health -= amount;
    if (drone.health <= 0) destroyDrone(drone);
  }

  function destroyDrone(drone) {
    // Defensive: accept a drone id as well as a drone object so a stray
    // destroyDrone(id) call can never crash with "Cannot create property
    // 'alive' on number".
    if (typeof drone === 'number') drone = drones.find(d => d.id === drone);
    if (!drone || typeof drone !== 'object') return;
    drone.alive = false;
    drone.active = false;
    if (drone === _possessedDrone) release();
    if (drone.mesh) {
      drone.mesh.traverse(function (child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      if (_scene) _scene.remove(drone.mesh);
    }
    _droneCacheDirty = true;
  }

  /* ── Queries ─────────────────────────────────────────────────────── */
  var _droneAliveCache = [];
  var _activeDroneCache = [];
  var _enemyDroneCache = [];
  var _friendlyDroneCache = [];
  var _typeDroneCache = Object.create(null);
  var _cachedFrame = -1;

  function _rebuildDroneCache() {
    if (!_droneCacheDirty && _cachedFrame === _cacheStamp) return;
    _droneAliveCache.length = 0;
    _activeDroneCache.length = 0;
    _enemyDroneCache.length = 0;
    _friendlyDroneCache.length = 0;
    _typeDroneCache = Object.create(null);
    for (var i = drones.length - 1; i >= 0; i--) {
      if (!drones[i].alive) {
        drones.splice(i, 1);
        continue;
      }
      var drone = drones[i];
      _droneAliveCache.unshift(drone);
      if (drone.active) _activeDroneCache.unshift(drone);
      if (drone.faction === 'russian') _enemyDroneCache.unshift(drone);
      if (drone.faction === 'ukrainian') _friendlyDroneCache.unshift(drone);
      if (!_typeDroneCache[drone.type]) _typeDroneCache[drone.type] = [];
      _typeDroneCache[drone.type].unshift(drone);
    }
    _droneCacheDirty = false;
    _cachedFrame = _cacheStamp;
  }
  function getAll()        { _rebuildDroneCache(); return _droneAliveCache; }
  function getActive()     { _rebuildDroneCache(); return _activeDroneCache; }
  function getById(id)     { return drones.find(d => d.id === id && d.alive); }
  function getByType(type) { _rebuildDroneCache(); return _typeDroneCache[type] || []; }

  function clear() {
    if (_possessedDrone) release();
    // Clear any active explosion fade intervals
    for (var ei = 0; ei < _explosionIntervals.length; ei++) {
      clearInterval(_explosionIntervals[ei]);
    }
    _explosionIntervals.length = 0;
    for (var ai = 0; ai < _activeExplosions.length; ai++) {
      var explosion = _activeExplosions[ai];
      if (_scene && explosion.mesh) _scene.remove(explosion.mesh);
      if (explosion.geometry) explosion.geometry.dispose();
      if (explosion.material) explosion.material.dispose();
    }
    _activeExplosions.length = 0;
    for (const drone of drones) {
      if (drone.mesh) {
        drone.mesh.traverse(function (child) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        if (_scene) _scene.remove(drone.mesh);
      }
    }
    drones.length = 0;
    _possessedDrone = null;
    _invalidateDroneCaches();
    // Clear nests
    for (var ni = 0; ni < _droneNests.length; ni++) {
      if (_droneNests[ni].mesh) {
        _droneNests[ni].mesh.traverse(function (c) { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
        if (_scene) _scene.remove(_droneNests[ni].mesh);
      }
    }
    _droneNests.length = 0;
  }

  /* ── Drone Swarm ─────────────────────────────────────────────────── */
  var _swarmActive = false;
  var _swarmDrones = [];

  function launchSwarm(count, target, scene) {
    count = Math.max(3, Math.min(5, count || 3));
    _swarmDrones = [];
    _swarmActive = true;
    for (var i = 0; i < count; i++) {
      var offsetX = (Math.random() - 0.5) * 6;
      var offsetZ = (Math.random() - 0.5) * 6;
      var spawnPos = target.clone().add(new THREE.Vector3(offsetX, 15 + Math.random() * 5, offsetZ));
      var d = spawn(spawnPos.x, spawnPos.y, spawnPos.z, DRONE_TYPE.FPV_ATTACK);
      d.aiControlled = true;
      d._swarmTarget = target.clone();
      d.patrolPoints = [target.clone()];
      d.patrolIdx = 0;
      _swarmDrones.push(d);
    }
    return _swarmDrones;
  }

  function isSwarmActive() {
    if (!_swarmActive) return false;
    var anyAlive = false;
    for (var i = 0; i < _swarmDrones.length; i++) {
      if (_swarmDrones[i].alive) { anyAlive = true; break; }
    }
    if (!anyAlive) _swarmActive = false;
    return _swarmActive;
  }

  /* ── Drone Camera Feed (PIP) ─────────────────────────────────────── */
  var _pipActive = false;
  var _pipDroneId = null;

  function activatePIP(droneId) {
    var d = drones.find(function (d) { return d.id === droneId && d.alive && d.active; });
    if (!d) return false;
    _pipActive = true;
    _pipDroneId = droneId;
    return true;
  }

  function deactivatePIP() {
    _pipActive = false;
    _pipDroneId = null;
  }

  function isPIPActive() { return _pipActive; }
  function getPIPDroneId() { return _pipDroneId; }

  /* ── Counter-Drone System ────────────────────────────────────────── */
  var _enemyDrones = [];

  function spawnEnemyDroneCD(pos, scene) {
    var type = Math.random() > 0.5 ? DRONE_TYPE.ENEMY_BOMBER : DRONE_TYPE.ENEMY_FPV;
    var d = spawn(pos.x, pos.y || 20, pos.z, type);
    d.aiControlled = true;
    _enemyDrones.push(d);
    return d;
  }

  function updateEnemyDrones(delta, playerPos) {
    for (var i = _enemyDrones.length - 1; i >= 0; i--) {
      var d = _enemyDrones[i];
      if (!d.alive) { _enemyDrones.splice(i, 1); continue; }
      // Enemy drone AI is already handled in main update via updateEnemyDrone
    }
  }

  function shootDownDrone(droneId) {
    var d = drones.find(function (d) { return d.id === droneId && d.alive; });
    if (!d) return false;
    destroyDrone(d);
    for (var i = _enemyDrones.length - 1; i >= 0; i--) {
      if (_enemyDrones[i].id === droneId) { _enemyDrones.splice(i, 1); break; }
    }
    return true;
  }

  function getEnemyDronesList() {
    _rebuildDroneCache();
    return _enemyDroneCache;
  }

  /* ── Drone Upgrades ──────────────────────────────────────────────── */
  var DRONE_UPGRADES = {
    extended_battery: { label: 'Extended Battery', effect: 'battery_mult', value: 1.5 },
    armor_plating:    { label: 'Armor Plating',    effect: 'hp_add',       value: 30 },
    thermal_camera:   { label: 'Thermal Camera',   effect: 'thermal',      value: true },
    speed_boost:      { label: 'Speed Boost',      effect: 'speed_mult',   value: 1.3 },
    emp_payload:      { label: 'EMP Payload',      effect: 'emp',          value: true },
  };

  var _droneUpgrades = {}; // droneId -> [upgradeId]

  function upgradeDrone(droneId, upgradeId) {
    var d = drones.find(function (d) { return d.id === droneId && d.alive; });
    if (!d) return false;
    var upg = DRONE_UPGRADES[upgradeId];
    if (!upg) return false;
    if (!_droneUpgrades[droneId]) _droneUpgrades[droneId] = [];
    if (_droneUpgrades[droneId].indexOf(upgradeId) !== -1) return false;
    _droneUpgrades[droneId].push(upgradeId);
    if (upg.effect === 'battery_mult') {
      d.maxBattery = Math.floor(d.maxBattery * upg.value);
      d.battery = Math.min(d.battery + d.maxBattery * 0.3, d.maxBattery);
    } else if (upg.effect === 'hp_add') {
      d.health += upg.value;
    } else if (upg.effect === 'speed_mult') {
      d.speed = Math.floor(d.speed * upg.value);
    } else if (upg.effect === 'thermal') {
      d._hasThermal = true;
    } else if (upg.effect === 'emp') {
      d._hasEMP = true;
    }
    return true;
  }

  function getDroneUpgrades(droneId) {
    return _droneUpgrades[droneId] ? _droneUpgrades[droneId].slice() : [];
  }

  return {
    DRONE_TYPE,
    DRONE_STATS,
    init,
    spawn,
    possess,
    release,
    getPossessed,
    isPossessing,
    setDroneKey,
    update,
    markTarget,
    callRecon,
    callBayraktar,
    dropPayload,
    fireAttack,
    setPatrol,
    damageDrone,
    destroyDrone,
    findByMesh,
    getAllMeshes,
    getAll,
    getActive,
    getById,
    getByType,
    getEnemyDrones: function() { _rebuildDroneCache(); return _enemyDroneCache; },
    getFriendlyDrones: function() { _rebuildDroneCache(); return _friendlyDroneCache; },
    spawnEnemyDrone,
    clear,
    // Drone Swarm
    launchSwarm: launchSwarm,
    isSwarmActive: isSwarmActive,
    // Drone Camera Feed (PIP)
    activatePIP: activatePIP,
    deactivatePIP: deactivatePIP,
    isPIPActive: isPIPActive,
    getPIPDroneId: getPIPDroneId,
    // Counter-Drone System
    spawnEnemyDroneCD: spawnEnemyDroneCD,
    updateEnemyDrones: updateEnemyDrones,
    shootDownDrone: shootDownDrone,
    getEnemyDronesList: getEnemyDronesList,
    // Drone Upgrades
    DRONE_UPGRADES: DRONE_UPGRADES,
    upgradeDrone: upgradeDrone,
    getDroneUpgrades: getDroneUpgrades,
    // Drone Nests
    getNests: getNests,
    getAliveNestCount: getAliveNestCount,
    damageNest: damageNest,
    getNearestNest: getNearestNest,
  };
})();

if (typeof window !== 'undefined') window.DroneSystem = DroneSystem;
