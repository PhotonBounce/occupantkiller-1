// ============================================================
//  bunker-assault.js — Three.js FPS module: fortified bunker complex
//  with breach-and-clear mechanics, enemy AI, ventilation shaft,
//  radio intel, loot spawns and fortification damage.
//
//  Public API:
//    BunkerAssault.init(scene, camera)
//    BunkerAssault.update(delta)
//    BunkerAssault.spawnBunker(x, z)
//    BunkerAssault.getBunkers()
//    BunkerAssault.reset()
// ============================================================
window.BunkerAssault = (function () {
  'use strict';

  // ── Module-level state ─────────────────────────────────────────────────────
  var _scene  = null;
  var _camera = null;

  var _bunkers = [];          // all spawned bunker instances
  var _time    = 0;           // accumulated time

  // ── Constants ──────────────────────────────────────────────────────────────
  var BUNKER_W       = 20;    // footprint width (X axis)
  var BUNKER_D       = 12;    // footprint depth (Z axis)
  var BUNKER_H       = 4;     // wall height
  var WALL_THICKNESS = 0.5;
  var WALL_HP        = 500;
  var DOOR_HP        = 120;
  var CLEAR_BONUS    = 500;
  var INTEL_BONUS    = 250;
  var RESPAWN_DIST   = 30;    // units from bunker centre before respawn timer starts
  var RESPAWN_DELAY  = 90;    // seconds
  var SLIT_HALF_ANG  = Math.PI / 6;  // ±30°
  var PANIC_SPEED    = 4.5;
  var PATROL_SPEED   = 2.2;
  var GUNNER_FIRE_INTERVAL = 1.0; // seconds between shots

  // Concrete colour
  var COL_CONCRETE = 0x4a4a4a;
  var COL_STEEL    = 0x555566;
  var COL_FLOOR    = 0x3a3a3a;
  var COL_CRATE    = 0x5c4a2a;
  var COL_RADIO    = 0x223344;
  var COL_ALERT    = 0xff1111;

  // ── Material cache ─────────────────────────────────────────────────────────
  var _matConcrete = null;
  var _matSteel    = null;
  var _matFloor    = null;
  var _matCrate    = null;
  var _matRadio    = null;
  var _matGlass    = null;
  var _matEnemy    = null;

  function _initMaterials() {
    if (_matConcrete) return;
    _matConcrete = new THREE.MeshLambertMaterial({ color: COL_CONCRETE });
    _matSteel    = new THREE.MeshLambertMaterial({ color: COL_STEEL });
    _matFloor    = new THREE.MeshLambertMaterial({ color: COL_FLOOR });
    _matCrate    = new THREE.MeshLambertMaterial({ color: COL_CRATE });
    _matRadio    = new THREE.MeshLambertMaterial({ color: COL_RADIO });
    _matGlass    = new THREE.MeshLambertMaterial({ color: 0x88aacc, transparent: true, opacity: 0.3 });
    _matEnemy    = new THREE.MeshLambertMaterial({ color: 0x556622 });
  }

  // ── Toast helper ───────────────────────────────────────────────────────────
  function _toast(msg, color) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(msg, 2800, color || '#ffffff');
        return;
      }
    } catch (e) {}
    // Fallback: create our own small toast
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:22%',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'color:' + (color || '#ffffff'),
      'background:rgba(0,0,0,0.72)',
      'border:1px solid ' + (color || '#ffffff'),
      'padding:6px 22px',
      'border-radius:4px',
      'z-index:9000',
      'pointer-events:none',
      'letter-spacing:3px',
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2800);
  }

  // ── Score helper ───────────────────────────────────────────────────────────
  function _addScore(pts) {
    try {
      if (window.Score && window.Score.add) { window.Score.add(pts); return; }
      if (window.GameManager && window.GameManager.addScore) { window.GameManager.addScore(pts); return; }
      if (window.score !== undefined) { window.score += pts; }
    } catch (e) {}
  }

  // ── Simple box helper ──────────────────────────────────────────────────────
  function _box(w, h, d, mat) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  }

  // ── Enemy capsule mesh ─────────────────────────────────────────────────────
  function _makeEnemyMesh() {
    var group = new THREE.Group();
    // Body
    var body = _box(0.6, 1.2, 0.4, _matEnemy);
    body.position.y = 0.6;
    group.add(body);
    // Head
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), _matEnemy);
    head.position.y = 1.5;
    group.add(head);
    return group;
  }

  // ── Slit window mesh ──────────────────────────────────────────────────────
  function _makeSlitWindow(x, y, z, rotY, parent) {
    // Dark glass slit: 0.8 wide, 0.25 tall, thin
    var slit = _box(0.8, 0.25, WALL_THICKNESS + 0.02, _matGlass);
    slit.position.set(x, y, z);
    slit.rotation.y = rotY;
    parent.add(slit);
  }

  // ── Debris spawner ────────────────────────────────────────────────────────
  function _spawnDebris(pos, count, bunker) {
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    for (var i = 0; i < count; i++) {
      var sz = 0.1 + Math.random() * 0.3;
      var d  = _box(sz, sz, sz, debrisMat);
      d.position.copy(pos);
      d.position.y += 0.5;
      var angle = Math.random() * Math.PI * 2;
      var spd   = 2 + Math.random() * 5;
      var piece = {
        mesh: d,
        vel: {
          x: Math.cos(angle) * spd,
          y: 3 + Math.random() * 4,
          z: Math.sin(angle) * spd
        },
        life: 1.0 + Math.random() * 1.0
      };
      _scene.add(d);
      bunker.debris.push(piece);
    }
  }

  // ── Loot spawner ──────────────────────────────────────────────────────────
  function _spawnLoot(bunker) {
    var lootMatAmmo   = new THREE.MeshLambertMaterial({ color: 0x886600 });
    var lootMatHealth = new THREE.MeshLambertMaterial({ color: 0xdd2222 });

    // Ammo box on top of first crate stack
    if (bunker.cratePositions && bunker.cratePositions.length > 0) {
      var cp0 = bunker.cratePositions[0];
      var ammoBox = _box(0.5, 0.3, 0.35, lootMatAmmo);
      ammoBox.position.set(cp0.x, cp0.y + 0.65, cp0.z);
      _scene.add(ammoBox);
      bunker.loot.push(ammoBox);
    }
    if (bunker.cratePositions && bunker.cratePositions.length > 1) {
      var cp1 = bunker.cratePositions[1];
      var healthKit = _box(0.4, 0.25, 0.4, lootMatHealth);
      healthKit.position.set(cp1.x, cp1.y + 0.625, cp1.z);
      _scene.add(healthKit);
      bunker.loot.push(healthKit);
    }
  }

  // ── Warning light ─────────────────────────────────────────────────────────
  function _makeWarningLight(ox, oz, group) {
    var lightGeo = new THREE.SphereGeometry(0.15, 8, 8);
    var lightMat = new THREE.MeshLambertMaterial({
      color: COL_ALERT,
      emissive: COL_ALERT,
      emissiveIntensity: 1.0
    });
    var sphere = new THREE.Mesh(lightGeo, lightMat);
    // Position above the south door
    sphere.position.set(0, BUNKER_H + 0.3, BUNKER_D * 0.5 - 0.2);
    group.add(sphere);
    return { mesh: sphere, mat: lightMat };
  }

  // ── Build the bunker structure ────────────────────────────────────────────
  // L-shaped: main block 20×12, then a notch cut away from NE corner (8×6).
  // The footprint runs from -10…+10 in X, -6…+6 in Z.
  // South face (z=+6) has the steel door.
  // We build with explicit wall sections so each can take damage.
  function _buildBunkerMesh(ox, oz) {
    var group = new THREE.Group();
    group.position.set(ox, 0, oz);

    // ── Floor ───────────────────────────────────────────────────────────────
    // Main rectangle
    var floor = _box(BUNKER_W, 0.1, BUNKER_D, _matFloor);
    floor.position.set(0, 0.05, 0);
    group.add(floor);
    // L-leg: extra 8×6 floor to the SW (the L extra portion)
    // Actually: L-shaped = main 20×12 minus a NE 8×6 notch.
    // Treat as two rectangles: west block (12×12) + east strip (8×6 south half)
    var floorE = _box(8, 0.1, 6, _matFloor);
    floorE.position.set(6, 0.05, 3);
    group.add(floorE);

    // ── Walls ────────────────────────────────────────────────────────────────
    // We build each wall as a {mesh, hp, section} object
    var walls = [];

    function _addWall(wx, wy, wz, w, h, d, label) {
      var mat = new THREE.MeshLambertMaterial({ color: COL_CONCRETE });
      var mesh = _box(w, h, d, mat);
      mesh.position.set(wx, wy, wz);
      group.add(mesh);
      walls.push({ mesh: mesh, mat: mat, hp: WALL_HP, label: label || 'wall' });
    }

    var halfH = BUNKER_H / 2;

    // South wall (z = +6), full width with door gap 2 units wide
    // Left of door
    _addWall(-5.5, halfH, BUNKER_D * 0.5, 9, BUNKER_H, WALL_THICKNESS, 'south-L');
    // Right of door
    _addWall( 5.5, halfH, BUNKER_D * 0.5, 9, BUNKER_H, WALL_THICKNESS, 'south-R');
    // North wall (z = -6), but only western 12 units (L shape NE notch)
    _addWall(-4, halfH, -BUNKER_D * 0.5, 12, BUNKER_H, WALL_THICKNESS, 'north-W');
    // West wall (x = -10), full 12 units depth
    _addWall(-BUNKER_W * 0.5, halfH, 0, WALL_THICKNESS, BUNKER_H, BUNKER_D, 'west');
    // East wall (x = +10), only south 6 units (L-leg east)
    _addWall(BUNKER_W * 0.5, halfH, 3, WALL_THICKNESS, BUNKER_H, 6, 'east-S');
    // Inner NE step wall (x = +2, from z=-6 to z=0)
    _addWall(2, halfH, -3, WALL_THICKNESS, BUNKER_H, 6, 'inner-NE-vert');
    // Inner NE top wall (z = 0, from x=2 to x=10)
    _addWall(6, halfH, 0, 8, BUNKER_H, WALL_THICKNESS, 'inner-NE-horiz');

    // Interior dividing walls for 3 rooms:
    // Room 1 = entrance: south portion 20×8 (z: 6 to -2)
    // Room 2 = comms: west portion north 6×6 (x: -10 to -4, z: -6 to 0)
    // Room 3 = ammo store: east portion (x: -4 to +2, z: -6 to 0) + (x:2..10, z:0..6) wait…
    //   We keep it simple: 2 interior divider walls.
    // Divider 1: east-west wall at z=−2, x from -10 to +10
    _addWall(0, halfH, -2, BUNKER_W, BUNKER_H, WALL_THICKNESS, 'divider-EW');
    // Divider 2: north-south wall at x=−4, z from −6 to −2
    _addWall(-4, halfH, -4, WALL_THICKNESS, BUNKER_H, 4, 'divider-NS');

    // ── Roof ────────────────────────────────────────────────────────────────
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x3c3c3c });
    var roofMain = _box(BUNKER_W, 0.3, BUNKER_D, roofMat);
    roofMain.position.set(0, BUNKER_H + 0.15, 0);
    group.add(roofMain);
    var roofE = _box(8, 0.3, 6, roofMat);
    roofE.position.set(6, BUNKER_H + 0.15, 3);
    group.add(roofE);

    // ── Slit windows on long walls ───────────────────────────────────────────
    // 3 slots per long wall. South wall gets 3 (but door interrupts east side)
    // West wall: 3 slits at y=2.5, evenly spaced along Z (-4, 0, +4)
    _makeSlitWindow(-BUNKER_W * 0.5 + 0.01, 2.5, -4, 0, group);
    _makeSlitWindow(-BUNKER_W * 0.5 + 0.01, 2.5,  0, 0, group);
    _makeSlitWindow(-BUNKER_W * 0.5 + 0.01, 2.5,  4, 0, group);
    // North wall: 3 slits (only western section x from -10 to -2)
    _makeSlitWindow(-7, 2.5, -BUNKER_D * 0.5 + 0.01, 0, group);
    _makeSlitWindow(-4, 2.5, -BUNKER_D * 0.5 + 0.01, 0, group);
    _makeSlitWindow(-1, 2.5, -BUNKER_D * 0.5 + 0.01, 0, group);

    // ── Steel door on south face ────────────────────────────────────────────
    var doorMat = new THREE.MeshLambertMaterial({ color: COL_STEEL });
    var door = new THREE.Mesh(new THREE.BoxGeometry(2, 3.5, WALL_THICKNESS + 0.05), doorMat);
    door.position.set(0, 1.75, BUNKER_D * 0.5);
    group.add(door);

    // ── Ventilation shaft on roof ────────────────────────────────────────────
    // Shaft entrance: 1.5×1.5 opening at top of bunker, roof centre
    var ventMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    // Shaft exterior box (hollow cube appearance from above)
    var ventBox = _box(1.6, 0.4, 1.6, ventMat);
    ventBox.position.set(-3, BUNKER_H + 0.35, -4);
    group.add(ventBox);
    // Shaft tunnel: horizontal 12-unit tube going south, dropping into comms room
    // Represented as a group of box segments for collision / visual
    var shaftSegments = [];
    for (var si = 0; si < 4; si++) {
      var seg = _box(1.5, 1.5, 3, ventMat);
      seg.position.set(-3 - si * 0.5, BUNKER_H - 0.5, -4 + si * 3);
      seg.visible = false; // internal geometry, no need to render
      group.add(seg);
      shaftSegments.push(seg);
    }

    // ── Radio equipment in comms room (x: -10..-4, z: -6..-2) ─────────────
    var radioPole = _box(0.15, 1.2, 0.15, _matRadio);
    radioPole.position.set(-7, 0.6, -4.5);
    group.add(radioPole);
    var radioBody = _box(0.8, 0.5, 0.5, _matRadio);
    radioBody.position.set(-7, 1.4, -4.5);
    group.add(radioBody);
    // Antenna
    var antenna = _box(0.05, 0.9, 0.05, new THREE.MeshLambertMaterial({ color: 0x888888 }));
    antenna.position.set(-6.7, 2.1, -4.5);
    group.add(antenna);
    // Screen glow
    var screenMat = new THREE.MeshLambertMaterial({ color: 0x00ff88, emissive: 0x00ff44, emissiveIntensity: 0.7 });
    var screen = _box(0.6, 0.35, 0.05, screenMat);
    screen.position.set(-7, 1.45, -4.25);
    group.add(screen);

    // ── Ammo crates in ammo store (x: -4..+2, z: -6..-2 area) ────────────
    var cratePositions = [];
    var crateData = [
      { x: -2, z: -4.5 },
      { x:  0, z: -5.0 },
      { x:  1, z: -3.5 }
    ];
    for (var ci = 0; ci < crateData.length; ci++) {
      var cd = crateData[ci];
      // Stack of 2 crates
      var crate1 = _box(0.9, 0.6, 0.7, _matCrate);
      crate1.position.set(cd.x, 0.3, cd.z);
      group.add(crate1);
      var crate2 = _box(0.9, 0.6, 0.7, _matCrate);
      crate2.position.set(cd.x, 0.9, cd.z);
      group.add(crate2);
      cratePositions.push({ x: cd.x, y: 1.2, z: cd.z });
    }

    // ── Warning light above door ─────────────────────────────────────────────
    var warningLight = _makeWarningLight(0, 0, group);

    return {
      group:         group,
      walls:         walls,
      door:          { mesh: door, mat: doorMat, hp: DOOR_HP, destroyed: false },
      cratePositions: cratePositions,
      radioPos:      new THREE.Vector3(ox - 7, 1.4, oz - 4.5),
      warningLight:  warningLight,
      shaftEntrance: new THREE.Vector3(ox - 3, BUNKER_H, oz - 4),
      shaftExit:     new THREE.Vector3(ox - 7, 0.5, oz - 3.5)
    };
  }

  // ── Create enemy record ────────────────────────────────────────────────────
  function _makeEnemy(type, localX, localZ, slitDir, bunker) {
    var mesh = _makeEnemyMesh();
    var worldX = bunker.origin.x + localX;
    var worldZ = bunker.origin.z + localZ;
    mesh.position.set(worldX, 0, worldZ);
    if (slitDir !== undefined) {
      mesh.rotation.y = slitDir;
    }
    _scene.add(mesh);

    return {
      mesh:          mesh,
      type:          type,         // 'gunner' | 'patrol'
      hp:            80,
      alive:         true,
      slitDir:       slitDir,      // facing angle for gunners
      panicMode:     false,
      fireTimer:     Math.random() * GUNNER_FIRE_INTERVAL,
      // Patrol state
      patrolIndex:   0,
      patrolWaypointTimer: 0,
      patrolWaypoints: null,
      // Local coordinates for bunker-relative logic
      localX:        localX,
      localZ:        localZ
    };
  }

  // ── Spawn guards for a bunker ──────────────────────────────────────────────
  function _spawnEnemies(bunker, count) {
    var ox = bunker.origin.x;
    var oz = bunker.origin.z;

    // 2 machine gunners at slit windows (west wall)
    if (count === undefined || count >= 4) {
      // Gunner 1 — west wall slit at z=−4 (comms side)
      var g1 = _makeEnemy('gunner', -BUNKER_W * 0.5 + 1.5, -4, 0, bunker);
      bunker.enemies.push(g1);

      // Gunner 2 — west wall slit at z=+4 (entrance side)
      var g2 = _makeEnemy('gunner', -BUNKER_W * 0.5 + 1.5, 4, 0, bunker);
      bunker.enemies.push(g2);

      // Patrol 1 — entrance room
      var p1 = _makeEnemy('patrol', -5, 3, undefined, bunker);
      p1.patrolWaypoints = [
        new THREE.Vector3(ox - 5, 0, oz + 3),
        new THREE.Vector3(ox + 5, 0, oz + 3),
        new THREE.Vector3(ox + 5, 0, oz - 1),
        new THREE.Vector3(ox - 5, 0, oz - 1)
      ];
      bunker.enemies.push(p1);

      // Patrol 2 — ammo store area
      var p2 = _makeEnemy('patrol', -1, -4, undefined, bunker);
      p2.patrolWaypoints = [
        new THREE.Vector3(ox - 1, 0, oz - 4),
        new THREE.Vector3(ox + 1, 0, oz - 5),
        new THREE.Vector3(ox + 1, 0, oz - 3),
        new THREE.Vector3(ox - 3, 0, oz - 3)
      ];
      bunker.enemies.push(p2);
    } else {
      // Respawn: 2 guards only
      var rg1 = _makeEnemy('gunner', -BUNKER_W * 0.5 + 1.5, 2, 0, bunker);
      bunker.enemies.push(rg1);
      var rg2 = _makeEnemy('patrol', 0, 4, undefined, bunker);
      rg2.patrolWaypoints = [
        new THREE.Vector3(ox,     0, oz + 4),
        new THREE.Vector3(ox + 4, 0, oz + 4),
        new THREE.Vector3(ox + 4, 0, oz),
        new THREE.Vector3(ox,     0, oz)
      ];
      bunker.enemies.push(rg2);
    }
  }

  // ── Public: spawnBunker ────────────────────────────────────────────────────
  function spawnBunker(x, z) {
    if (!_scene) return null;
    _initMaterials();

    var meshData = _buildBunkerMesh(x, z);
    _scene.add(meshData.group);

    var bunker = {
      id:             _bunkers.length,
      origin:         new THREE.Vector3(x, 0, z),
      group:          meshData.group,
      walls:          meshData.walls,
      door:           meshData.door,
      cratePositions: meshData.cratePositions,
      radioPos:       meshData.radioPos,
      warningLight:   meshData.warningLight,
      shaftEntrance:  meshData.shaftEntrance,
      shaftExit:      meshData.shaftExit,
      enemies:        [],
      loot:           [],
      debris:         [],
      breached:       false,
      cleared:        false,
      intelCollected: false,
      // Respawn tracking
      playerNear:     true,
      awayTimer:      0,
      respawnPending: false,
      // Ambient point light above door
      alertLight:     null,
      alertLightTimer: 0
    };

    // Optional point light above bunker entrance
    try {
      var pLight = new THREE.PointLight(COL_ALERT, 0.8, 8);
      pLight.position.set(x, BUNKER_H + 1, z + BUNKER_D * 0.5);
      _scene.add(pLight);
      bunker.alertLight = pLight;
    } catch (e) {}

    _spawnEnemies(bunker, 4);
    _bunkers.push(bunker);
    return bunker;
  }

  // ── Line of sight check (simplified ray vs AABB walls) ────────────────────
  function _hasLOS(from, to, bunker) {
    // Use Three.js Raycaster against wall meshes for a basic LOS check
    try {
      var dir = new THREE.Vector3().subVectors(to, from).normalize();
      var rc  = new THREE.Raycaster(from, dir, 0, from.distanceTo(to) - 0.5);
      var wallMeshes = [];
      for (var wi = 0; wi < bunker.walls.length; wi++) {
        wallMeshes.push(bunker.walls[wi].mesh);
      }
      if (!bunker.door.destroyed) wallMeshes.push(bunker.door.mesh);
      var hits = rc.intersectObjects(wallMeshes, false);
      return hits.length === 0;
    } catch (e) {
      return true; // fail open for gameplay
    }
  }

  // ── Fire projectile at player (cosmetic tracer) ────────────────────────────
  function _fireAtPlayer(enemy, playerPos) {
    try {
      var tracerMat = new THREE.LineBasicMaterial({ color: 0xffee44, transparent: true, opacity: 0.7 });
      var tracerGeo = new THREE.BufferGeometry();
      var pts = new Float32Array([
        enemy.mesh.position.x, enemy.mesh.position.y + 1.2, enemy.mesh.position.z,
        playerPos.x,           playerPos.y + 0.8,           playerPos.z
      ]);
      tracerGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      var tracer = new THREE.Line(tracerGeo, tracerMat);
      _scene.add(tracer);
      // Remove tracer after 120ms
      setTimeout(function () {
        try { _scene.remove(tracer); } catch (e2) {}
      }, 120);

      // Deal damage to player
      try {
        if (window.PlayerHealth && window.PlayerHealth.damage) {
          window.PlayerHealth.damage(8);
        } else if (window.player && window.player.health !== undefined) {
          window.player.health -= 8;
        }
      } catch (dmgErr) {}
    } catch (e) {}
  }

  // ── Update a single enemy ─────────────────────────────────────────────────
  function _updateEnemy(enemy, bunker, dt, playerPos) {
    if (!enemy.alive || !enemy.mesh) return;

    if (enemy.hp <= 0) {
      enemy.alive = false;
      try { _scene.remove(enemy.mesh); } catch (e) {}
      enemy.mesh = null;
      return;
    }

    if (enemy.type === 'gunner') {
      if (enemy.panicMode) {
        // Panic: erratic movement toward player
        var dx = playerPos.x - enemy.mesh.position.x;
        var dz = playerPos.z - enemy.mesh.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.5) {
          var jitterX = (Math.random() - 0.5) * 2;
          var jitterZ = (Math.random() - 0.5) * 2;
          enemy.mesh.position.x += (dx / dist + jitterX * 0.4) * PANIC_SPEED * dt;
          enemy.mesh.position.z += (dz / dist + jitterZ * 0.4) * PANIC_SPEED * dt;
          enemy.mesh.rotation.y = Math.atan2(dx, dz);
        }
        // Panic gunner still fires
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0) {
          enemy.fireTimer = GUNNER_FIRE_INTERVAL * 0.6;
          _fireAtPlayer(enemy, playerPos);
        }
      } else {
        // Stationary gunner: check cone + LOS
        var gDx = playerPos.x - enemy.mesh.position.x;
        var gDz = playerPos.z - enemy.mesh.position.z;
        var angleToPlayer = Math.atan2(gDx, gDz);
        var angleDiff = angleToPlayer - enemy.slitDir;
        // Normalise to -PI..PI
        while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) <= SLIT_HALF_ANG) {
          var gunnerFrom = enemy.mesh.position.clone();
          gunnerFrom.y += 1.2;
          var playerTo = playerPos.clone();
          playerTo.y += 0.8;
          if (_hasLOS(gunnerFrom, playerTo, bunker)) {
            enemy.fireTimer -= dt;
            if (enemy.fireTimer <= 0) {
              enemy.fireTimer = GUNNER_FIRE_INTERVAL;
              _fireAtPlayer(enemy, playerPos);
            }
          }
        }
      }
    } else if (enemy.type === 'patrol') {
      if (enemy.panicMode) {
        // Panic patrol: charge at player
        var pdx = playerPos.x - enemy.mesh.position.x;
        var pdz = playerPos.z - enemy.mesh.position.z;
        var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pdist > 1.0) {
          var pjx = (Math.random() - 0.5) * 1.5;
          var pjz = (Math.random() - 0.5) * 1.5;
          enemy.mesh.position.x += (pdx / pdist + pjx * 0.35) * PANIC_SPEED * dt;
          enemy.mesh.position.z += (pdz / pdist + pjz * 0.35) * PANIC_SPEED * dt;
          enemy.mesh.rotation.y = Math.atan2(pdx, pdz);
        }
        // Fire if close
        if (pdist < 6) {
          enemy.fireTimer -= dt;
          if (enemy.fireTimer <= 0) {
            enemy.fireTimer = 1.2;
            _fireAtPlayer(enemy, playerPos);
          }
        }
      } else {
        // Normal patrol along waypoints
        if (enemy.patrolWaypoints && enemy.patrolWaypoints.length > 0) {
          var wp = enemy.patrolWaypoints[enemy.patrolIndex];
          var wdx = wp.x - enemy.mesh.position.x;
          var wdz = wp.z - enemy.mesh.position.z;
          var wdist = Math.sqrt(wdx * wdx + wdz * wdz);
          if (wdist < 0.4) {
            enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolWaypoints.length;
            enemy.patrolWaypointTimer = 0;
          } else {
            enemy.mesh.position.x += (wdx / wdist) * PATROL_SPEED * dt;
            enemy.mesh.position.z += (wdz / wdist) * PATROL_SPEED * dt;
            enemy.mesh.rotation.y = Math.atan2(wdx, wdz);
          }
        }
      }
    }
  }

  // ── Check if all enemies in bunker are dead ────────────────────────────────
  function _allDead(bunker) {
    for (var i = 0; i < bunker.enemies.length; i++) {
      if (bunker.enemies[i].alive) return false;
    }
    return true;
  }

  // ── Trigger panic mode ─────────────────────────────────────────────────────
  function _panicAll(bunker) {
    for (var i = 0; i < bunker.enemies.length; i++) {
      bunker.enemies[i].panicMode = true;
    }
  }

  // ── Get player position safely ─────────────────────────────────────────────
  function _getPlayerPos() {
    try {
      if (window.player && window.player.position) return window.player.position;
    } catch (e) {}
    return _camera ? _camera.position : new THREE.Vector3(0, 0, 0);
  }

  // ── Damage a door ─────────────────────────────────────────────────────────
  function applyDamageToDoor(bunker, dmg) {
    if (!bunker || bunker.door.destroyed) return;
    bunker.door.hp -= dmg;
    if (bunker.door.hp <= 0) {
      _destroyDoor(bunker);
    }
  }

  function _destroyDoor(bunker) {
    if (bunker.door.destroyed) return;
    bunker.door.destroyed = true;
    try { _scene.remove(bunker.door.mesh); } catch (e) {}
    // Spawn debris
    var doorPos = bunker.door.mesh.position.clone();
    doorPos.x += bunker.origin.x; // already world coords since mesh is child of group
    // Actually group handles world transform — get world pos
    var worldDoorPos = new THREE.Vector3();
    bunker.door.mesh.getWorldPosition(worldDoorPos);
    _spawnDebris(worldDoorPos, 18, bunker);
    _onBunkerBreached(bunker);
  }

  function _onBunkerBreached(bunker) {
    if (bunker.breached) return;
    bunker.breached = true;
    _toast('BUNKER BREACHED', '#ff6600');
    _panicAll(bunker);
  }

  // ── Damage a wall section ─────────────────────────────────────────────────
  function applyDamageToWall(bunker, wallIndex, dmg) {
    if (!bunker || wallIndex < 0 || wallIndex >= bunker.walls.length) return;
    var w = bunker.walls[wallIndex];
    if (!w || w.hp <= 0) return;
    w.hp -= dmg;
    // Tint darker as damaged
    var t = Math.max(0, w.hp / WALL_HP);
    try { w.mat.color.setHex(Math.round(COL_CONCRETE * t + 0x111111 * (1 - t))); } catch (e) {}
    if (w.hp <= 0) {
      // Wall breached
      try { _scene.remove(w.mesh); } catch (e) {}
      w.hp = 0;
      if (!bunker.breached) _onBunkerBreached(bunker);
    }
  }

  // ── Intel interaction (F key) ─────────────────────────────────────────────
  function _checkIntelInteract(bunker, playerPos) {
    if (bunker.intelCollected) return;
    if (!bunker.breached) return;
    var rp = bunker.radioPos;
    var dx = playerPos.x - rp.x;
    var dy = playerPos.y - rp.y;
    var dz = playerPos.z - rp.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 2.5) {
      bunker._intelPromptVisible = true;
      // Show prompt if not shown
      if (!bunker._intelPromptEl) {
        var el = document.createElement('div');
        el.style.cssText = [
          'position:fixed',
          'bottom:28%',
          'left:50%',
          'transform:translateX(-50%)',
          'font-family:monospace',
          'font-size:14px',
          'color:#00ff88',
          'background:rgba(0,0,0,0.65)',
          'border:1px solid #00ff88',
          'padding:4px 16px',
          'border-radius:3px',
          'z-index:8000',
          'pointer-events:none',
        ].join(';');
        el.textContent = '[F] COLLECT RADIO INTEL';
        document.body.appendChild(el);
        bunker._intelPromptEl = el;
      }
    } else {
      bunker._intelPromptVisible = false;
      if (bunker._intelPromptEl) {
        try { bunker._intelPromptEl.parentNode.removeChild(bunker._intelPromptEl); } catch (e) {}
        bunker._intelPromptEl = null;
      }
    }
  }

  function _collectIntel(bunker) {
    if (bunker.intelCollected) return;
    bunker.intelCollected = true;
    if (bunker._intelPromptEl) {
      try { bunker._intelPromptEl.parentNode.removeChild(bunker._intelPromptEl); } catch (e) {}
      bunker._intelPromptEl = null;
    }
    _addScore(INTEL_BONUS);
    _toast('RADIO INTEL SECURED  +' + INTEL_BONUS, '#00ff88');
    // Set mission bonus flag
    try {
      if (window.MissionFlags) window.MissionFlags.intelSecured = true;
      else window._bunkerIntelSecured = true;
    } catch (e) {}
  }

  // ── Key handler for F key (intel collect) ────────────────────────────────
  function _onKeyDown(e) {
    if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
      for (var bi = 0; bi < _bunkers.length; bi++) {
        var bunker = _bunkers[bi];
        if (bunker._intelPromptVisible && !bunker.intelCollected) {
          _collectIntel(bunker);
        }
      }
    }
  }

  // ── Update single bunker ───────────────────────────────────────────────────
  function _updateBunker(bunker, dt, playerPos) {
    // Warning light pulse
    bunker.alertLightTimer += dt;
    var anyAlive = !_allDead(bunker);
    if (bunker.warningLight && bunker.warningLight.mat) {
      var pulse = (Math.sin(bunker.alertLightTimer * 4) * 0.5 + 0.5);
      if (anyAlive) {
        bunker.warningLight.mat.emissiveIntensity = pulse;
        if (bunker.alertLight) bunker.alertLight.intensity = 0.8 * pulse;
      } else {
        bunker.warningLight.mat.emissiveIntensity = 0;
        if (bunker.alertLight) bunker.alertLight.intensity = 0;
      }
    }

    // Update enemies
    for (var ei = 0; ei < bunker.enemies.length; ei++) {
      _updateEnemy(bunker.enemies[ei], bunker, dt, playerPos);
    }

    // Debris physics
    for (var di = bunker.debris.length - 1; di >= 0; di--) {
      var piece = bunker.debris[di];
      piece.life -= dt;
      if (piece.life <= 0) {
        try { _scene.remove(piece.mesh); } catch (e) {}
        bunker.debris.splice(di, 1);
        continue;
      }
      piece.vel.y -= 9.8 * dt;
      piece.mesh.position.x += piece.vel.x * dt;
      piece.mesh.position.y += piece.vel.y * dt;
      piece.mesh.position.z += piece.vel.z * dt;
      if (piece.mesh.position.y < 0) {
        piece.mesh.position.y = 0;
        piece.vel.y = 0;
        piece.vel.x *= 0.55;
        piece.vel.z *= 0.55;
      }
    }

    // Check clear condition
    if (!bunker.cleared && bunker.breached && _allDead(bunker)) {
      bunker.cleared = true;
      _toast('BUNKER CLEARED  +' + CLEAR_BONUS, '#ffdd00');
      _addScore(CLEAR_BONUS);
      _spawnLoot(bunker);
    }

    // Intel check
    _checkIntelInteract(bunker, playerPos);

    // Respawn logic: track player distance
    var ox = bunker.origin.x;
    var oz = bunker.origin.z;
    var rdx = playerPos.x - ox;
    var rdz = playerPos.z - oz;
    var rdist = Math.sqrt(rdx * rdx + rdz * rdz);

    if (rdist > RESPAWN_DIST) {
      bunker.playerNear = false;
      bunker.awayTimer += dt;
      if (bunker.awayTimer >= RESPAWN_DELAY && !bunker.respawnPending && bunker.cleared) {
        bunker.respawnPending = true;
        // Clean dead enemy meshes already removed; reset state
        bunker.enemies = [];
        bunker.breached = false;
        bunker.cleared = false;
        bunker.awayTimer = 0;
        _spawnEnemies(bunker, 2); // 2 new guards
        _toast('BUNKER REOCCUPIED', '#ff4422');
        // Restore door if destroyed
        if (bunker.door.destroyed) {
          var newDoorMat = new THREE.MeshLambertMaterial({ color: COL_STEEL });
          var newDoor = _box(2, 3.5, WALL_THICKNESS + 0.05, newDoorMat);
          newDoor.position.set(0, 1.75, BUNKER_D * 0.5);
          bunker.group.add(newDoor);
          bunker.door.mesh = newDoor;
          bunker.door.mat  = newDoorMat;
          bunker.door.hp   = DOOR_HP;
          bunker.door.destroyed = false;
        }
      }
    } else {
      if (!bunker.playerNear) {
        bunker.playerNear = true;
        bunker.awayTimer  = 0;
        bunker.respawnPending = false;
      }
    }
  }

  // ── Check ventilation shaft use ────────────────────────────────────────────
  // This is called each frame; if player is near shaft entrance and crouching,
  // teleport them to shaft exit (inside comms room) after VENT_TRANSIT_TIME.
  var _ventTimer  = 0;
  var _ventActive = false;

  function _checkVentShaft(bunker, playerPos) {
    var se = bunker.shaftEntrance;
    var dx = playerPos.x - se.x;
    var dy = playerPos.y - se.y;
    var dz = playerPos.z - se.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var crouching = false;
    try { crouching = !!(window.CrouchSystem && window.CrouchSystem.isCrouching && window.CrouchSystem.isCrouching()); } catch (e) {}
    try { if (!crouching && window.player) crouching = !!window.player.crouching; } catch (e2) {}

    if (dist < 1.2 && crouching) {
      _ventActive = true;
      _ventTimer += 0.016; // approximate
      if (_ventTimer > 1.5) {
        // Transit complete
        _ventTimer  = 0;
        _ventActive = false;
        try {
          if (window.player && window.player.position) {
            window.player.position.copy(bunker.shaftExit);
          } else if (_camera) {
            _camera.position.copy(bunker.shaftExit);
            _camera.position.y += 1.7;
          }
        } catch (e) {}
        _toast('VENT SHAFT — COMMS ROOM', '#aaffee');
        if (!bunker.breached) _onBunkerBreached(bunker);
      }
    } else if (_ventActive && dist > 2) {
      _ventActive = false;
      _ventTimer  = 0;
    }
  }

  // ── Public: update ────────────────────────────────────────────────────────
  function update(delta) {
    if (!delta || isNaN(delta)) delta = 0.016;
    _time += delta;

    var playerPos = _getPlayerPos();

    for (var bi = 0; bi < _bunkers.length; bi++) {
      _updateBunker(_bunkers[bi], delta, playerPos);
      _checkVentShaft(_bunkers[bi], playerPos);
    }
  }

  // ── Public: getBunkers ────────────────────────────────────────────────────
  function getBunkers() {
    return _bunkers.slice();
  }

  // ── Public: init ──────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _bunkers = [];
    _time    = 0;
    _ventTimer  = 0;
    _ventActive = false;
    _initMaterials();

    document.removeEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keydown', _onKeyDown, false);
  }

  // ── Public: reset ─────────────────────────────────────────────────────────
  function reset() {
    for (var bi = 0; bi < _bunkers.length; bi++) {
      var bunker = _bunkers[bi];
      // Remove all enemies
      for (var ei = 0; ei < bunker.enemies.length; ei++) {
        try { if (bunker.enemies[ei].mesh) _scene.remove(bunker.enemies[ei].mesh); } catch (e) {}
      }
      // Remove debris
      for (var di = 0; di < bunker.debris.length; di++) {
        try { _scene.remove(bunker.debris[di].mesh); } catch (e) {}
      }
      // Remove loot
      for (var li = 0; li < bunker.loot.length; li++) {
        try { _scene.remove(bunker.loot[li]); } catch (e) {}
      }
      // Remove alert light
      if (bunker.alertLight) {
        try { _scene.remove(bunker.alertLight); } catch (e) {}
      }
      // Remove group (all walls, floor, etc.)
      try { _scene.remove(bunker.group); } catch (e) {}
      // Remove intel prompt
      if (bunker._intelPromptEl) {
        try { bunker._intelPromptEl.parentNode.removeChild(bunker._intelPromptEl); } catch (e) {}
      }
    }
    _bunkers = [];
    _time    = 0;
    _ventTimer  = 0;
    _ventActive = false;
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init:              init,
    update:            update,
    spawnBunker:       spawnBunker,
    getBunkers:        getBunkers,
    reset:             reset,
    applyDamageToDoor: applyDamageToDoor,
    applyDamageToWall: applyDamageToWall
  };

})();
