/* ════════════════════════════════════════════════════════════════════
 *  ENEMY ENGINEER — Tactical enemy that builds defensive cover
 *  ─────────────────────────────────────────────────────────────────
 *  - Spawns 1 per wave after wave 4
 *  - Runs to a position 8-12 units from player and builds sandbag walls
 *  - Cover pieces (BoxGeometry 2×1.2×0.4, color 0xC2A06E) give nearby
 *    enemies 50% damage reduction
 *  - Up to 3 cover pieces per life, 5s cooldown between builds
 *  - 3s build animation: stoops (rotation.x=0.5) + arm swing
 *  - Returns fire when not building (same as regular enemies)
 *  - On death: cover remains but becomes destroyable (80 HP each)
 *  - Score: +250 | HUD toast: "ENGINEER DOWN" + yellow flash
 *  - Cover destruction: fracture animation, 3 debris cubes scatter
 *  - Repairs nearby friendly mechs/shield generators via
 *    window._onEngineerRepair hook
 *
 *  Public API (window.EnemyEngineer):
 *    init()          — call once; sets up shot-fire listener
 *    update(delta)   — per-frame update
 *    reset()         — clear all engineers + cover (wave reset)
 *  Internal global:
 *    window._engineerEnemies = []  (read by other systems)
 * ════════════════════════════════════════════════════════════════════ */

window.EnemyEngineer = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────
  var ENGINEER_HP        = 90;
  var SCORE_KILL         = 250;
  var COVER_HP           = 80;
  var COVER_COLOR        = 0xC2A06E;
  var COVER_BUILD_TIME   = 3.0;    // seconds to complete one build
  var COVER_COOLDOWN     = 5.0;    // seconds between builds
  var MAX_COVERS         = 3;      // max covers per engineer life
  var MOVE_SPEED         = 4.5;    // units/sec
  var FIRE_RANGE         = 22;     // units — max combat range
  var FIRE_RATE          = 1.8;    // seconds between shots
  var BUILD_RANGE_MIN    = 8;
  var BUILD_RANGE_MAX    = 12;
  var REPAIR_RANGE       = 6;      // units — repair nearby structures
  var REPAIR_INTERVAL    = 2.0;    // seconds between repair ticks
  var HAT_COLOR          = 0xFFCC00;   // yellow hard hat
  var VEST_COLOR         = 0xFF6600;   // orange vest
  var BODY_COLOR         = 0x8B7355;   // skin / uniform

  // ── Module state ───────────────────────────────────────────────────
  var _scene      = null;
  var _inited     = false;
  var _shotFired  = false;   // toggled by _onShotFired listener

  // ── Public engineer registry ───────────────────────────────────────
  window._engineerEnemies = window._engineerEnemies || [];

  // ── Cover pieces registry (global so other systems can query) ─────
  var _coverPieces = [];   // { mesh, hp, dmgReduction }

  // ══════════════════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════════════════

  function _getScene() {
    if (_scene) return _scene;
    _scene = (typeof window !== 'undefined' && window._gameScene) ||
             (typeof window !== 'undefined' && window._scene) ||
             (window.GameManager && window.GameManager.getScene && window.GameManager.getScene()) ||
             null;
    return _scene;
  }

  function _getPlayer() {
    return (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer()) || null;
  }

  function _getCurrentWave() {
    if (window.GameManager && window.GameManager.getWave) return window.GameManager.getWave();
    if (window._currentWave !== undefined) return window._currentWave;
    return 1;
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _randomAngle() {
    return Math.random() * Math.PI * 2;
  }

  // Show HUD pickup/toast notification
  function _hudToast(msg, color, duration) {
    try {
      if (typeof HUD !== 'undefined') {
        if (HUD.showToast)   { HUD.showToast(msg, duration || 2500, color || '#ffdd00'); return; }
        if (HUD.notifyPickup){ HUD.notifyPickup(msg, color || '#ffdd00'); return; }
      }
      if (window.HUD) {
        if (window.HUD.showToast)    { window.HUD.showToast(msg, duration || 2500, color || '#ffdd00'); return; }
        if (window.HUD.notifyPickup) { window.HUD.notifyPickup(msg, color || '#ffdd00'); }
      }
    } catch (e) {}
  }

  // Yellow screen flash for "ENGINEER DOWN"
  function _flashYellow() {
    try {
      var el = document.getElementById('flashbang-overlay');
      if (el) {
        el.style.background  = '#ffff00';
        el.style.opacity     = '0.35';
        el.style.transition  = 'opacity 0.05s';
        setTimeout(function () {
          el.style.transition = 'opacity 0.6s';
          el.style.opacity    = '0';
        }, 80);
      }
    } catch (e) {}
  }

  // Add score
  function _addScore(points) {
    try {
      if (window.GameManager && window.GameManager.addScore) {
        window.GameManager.addScore(points);
        return;
      }
      if (window._score !== undefined) { window._score += points; }
    } catch (e) {}
  }

  // ══════════════════════════════════════════════════════════════════
  //  MESH BUILDERS
  // ══════════════════════════════════════════════════════════════════

  // Build the engineer character mesh (Group: body + hard-hat + vest-band)
  function _buildEngineerMesh() {
    var sc = _getScene();
    if (!sc) return null;

    var group = new THREE.Group();

    // Body (torso) — orange vest
    var bodyGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: VEST_COLOR });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    group.add(body);

    // Legs
    var legGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25);
    var legMat = new THREE.MeshLambertMaterial({ color: BODY_COLOR });
    var legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.17, -0.3, 0);
    group.add(legL);
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.17, -0.3, 0);
    group.add(legR);

    // Head
    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var headMat = new THREE.MeshLambertMaterial({ color: BODY_COLOR });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.0;
    group.add(head);

    // Hard hat — BoxGeometry(0.3, 0.15, 0.3) yellow
    var hatGeo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
    var hatMat = new THREE.MeshLambertMaterial({ color: HAT_COLOR });
    var hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.22;
    group.add(hat);
    // Hat brim (wider flat box)
    var brimGeo = new THREE.BoxGeometry(0.45, 0.04, 0.45);
    var brim    = new THREE.Mesh(brimGeo, hatMat);
    brim.position.y = 1.14;
    group.add(brim);

    // Right arm (used for build animation)
    var armGeo = new THREE.BoxGeometry(0.15, 0.55, 0.15);
    var armMat = new THREE.MeshLambertMaterial({ color: VEST_COLOR });
    var armR   = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.42, 0.42, 0);
    group.add(armR);

    // Left arm
    var armL = new THREE.Mesh(armGeo, armMat.clone());
    armL.position.set(-0.42, 0.42, 0);
    group.add(armL);

    // Ground the group so feet sit at y=0
    group.position.y = 0.3;

    sc.add(group);

    // Store references for animation
    group.userData.armR = armR;
    group.userData.head = head;

    return group;
  }

  // Build one sandbag cover piece at a given world position
  function _buildCoverMesh(x, y, z, faceAngle) {
    var sc = _getScene();
    if (!sc) return null;

    var geo = new THREE.BoxGeometry(2, 1.2, 0.4);
    var mat = new THREE.MeshLambertMaterial({ color: COVER_COLOR });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.6, z);
    mesh.rotation.y = faceAngle || 0;
    sc.add(mesh);
    return mesh;
  }

  // Explode a cover piece into 3 debris cubes
  function _destroyCoverPiece(coverObj) {
    var sc = _getScene();
    if (!sc) return;

    // White flash
    if (coverObj.mesh && coverObj.mesh.material) {
      coverObj.mesh.material.color.setHex(0xffffff);
      coverObj.mesh.material.emissive = new THREE.Color(0xffffff);
    }
    var pos = coverObj.mesh ? coverObj.mesh.position.clone() : new THREE.Vector3();

    setTimeout(function () {
      if (sc && coverObj.mesh) sc.remove(coverObj.mesh);

      // Spawn 3 debris cubes
      var debrisGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var debrisMat = new THREE.MeshLambertMaterial({ color: COVER_COLOR });
      for (var d = 0; d < 3; d++) {
        var debris = new THREE.Mesh(debrisGeo, debrisMat.clone());
        debris.position.set(
          pos.x + (Math.random() - 0.5) * 1.5,
          pos.y + 0.3 + Math.random() * 0.5,
          pos.z + (Math.random() - 0.5) * 1.5
        );
        if (sc) sc.add(debris);
        // Fade debris out after 1.5s
        (function (deb, scene) {
          setTimeout(function () {
            if (scene) scene.remove(deb);
          }, 1500);
        })(debris, sc);
      }
    }, 120);

    // Remove from cover registry
    var idx = _coverPieces.indexOf(coverObj);
    if (idx !== -1) _coverPieces.splice(idx, 1);
  }

  // ══════════════════════════════════════════════════════════════════
  //  ENGINEER SPAWNING
  // ══════════════════════════════════════════════════════════════════

  function _spawnEngineer() {
    var sc = _getScene();
    if (!sc) return;

    var player = _getPlayer();
    if (!player || !player.position) return;

    // Spawn near other enemies if any, else near player
    var spawnX = player.position.x;
    var spawnZ = player.position.z;

    // Try to spawn near an existing enemy
    var enemyList = [];
    try {
      if (window.Enemies && window.Enemies.getAll) {
        enemyList = window.Enemies.getAll().filter(function (e) { return e && e.alive && e.mesh; });
      }
    } catch (e) {}

    if (enemyList.length > 0) {
      var ref = enemyList[Math.floor(Math.random() * enemyList.length)];
      var rp  = ref.mesh.position;
      var ang = _randomAngle();
      var r   = 3 + Math.random() * 5;
      spawnX  = rp.x + Math.cos(ang) * r;
      spawnZ  = rp.z + Math.sin(ang) * r;
    } else {
      // Spawn on periphery, 20-30 units from player
      var ang2 = _randomAngle();
      var rad2 = 20 + Math.random() * 10;
      spawnX   = player.position.x + Math.cos(ang2) * rad2;
      spawnZ   = player.position.z + Math.sin(ang2) * rad2;
    }

    var mesh = _buildEngineerMesh();
    if (!mesh) return;

    var groundY = 0;
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTopSolidY) {
        groundY = VoxelWorld.getTopSolidY(spawnX, spawnZ) || 0;
      }
    } catch (e) {}

    mesh.position.set(spawnX, groundY, spawnZ);

    var engineer = {
      mesh:         mesh,
      hp:           ENGINEER_HP,
      maxHp:        ENGINEER_HP,
      alive:        true,

      // State machine: 'approach' | 'build' | 'combat' | 'idle'
      state:        'approach',

      // Build state
      buildTarget:  null,   // {x, y, z, faceAngle}
      buildTimer:   0,
      buildCooldown:0,
      coversBuilt:  0,

      // Combat state
      fireTimer:    0,
      alerted:      false,

      // Repair state
      repairTimer:  0,

      // Animation helpers
      armSwing:     0,      // phase for arm-swing animation
    };

    window._engineerEnemies.push(engineer);
    return engineer;
  }

  // ══════════════════════════════════════════════════════════════════
  //  BUILD LOGIC
  // ══════════════════════════════════════════════════════════════════

  // Pick a cover build position 8-12 units from player, angled to face player
  function _pickBuildTarget(engineer) {
    var player = _getPlayer();
    if (!player || !player.position) return null;

    var px = player.position.x;
    var pz = player.position.z;
    var dist = BUILD_RANGE_MIN + Math.random() * (BUILD_RANGE_MAX - BUILD_RANGE_MIN);

    // Place between engineer and player
    var ex = engineer.mesh.position.x;
    var ez = engineer.mesh.position.z;
    var toPlayerAng = Math.atan2(px - ex, pz - ez);
    // Offset slightly sideways so cover flanks approach
    var sideOff = (Math.random() - 0.5) * 4;
    var tx = px + Math.cos(toPlayerAng + Math.PI + 0.3) * dist + Math.cos(toPlayerAng + Math.PI / 2) * sideOff;
    var tz = pz + Math.sin(toPlayerAng + Math.PI + 0.3) * dist + Math.sin(toPlayerAng + Math.PI / 2) * sideOff;

    var groundY = 0;
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTopSolidY) {
        groundY = VoxelWorld.getTopSolidY(tx, tz) || 0;
      }
    } catch (e) {}

    // Face angle: cover wall perpendicular to player direction (blocks line-of-sight)
    var faceAng = toPlayerAng;

    return { x: tx, y: groundY, z: tz, faceAngle: faceAng };
  }

  function _placeCover(engineer) {
    var sc = _getScene();
    if (!sc || !engineer.buildTarget) return;

    var bt = engineer.buildTarget;
    var mesh = _buildCoverMesh(bt.x, bt.y, bt.z, bt.faceAngle);
    if (!mesh) return;

    var coverObj = {
      mesh:         mesh,
      hp:           COVER_HP,
      maxHp:        COVER_HP,
      dmgReduction: 0.5,   // 50% damage reduction for enemies behind it
    };
    _coverPieces.push(coverObj);

    engineer.coversBuilt++;
    engineer.buildTarget  = null;
    engineer.buildCooldown = COVER_COOLDOWN;

    // Return engineer to upright posture
    engineer.mesh.rotation.x = 0;
    if (engineer.mesh.userData.armR) {
      engineer.mesh.userData.armR.rotation.x = 0;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  COMBAT LOGIC
  // ══════════════════════════════════════════════════════════════════

  function _fireAtPlayer(engineer) {
    var player = _getPlayer();
    if (!player || !player.position || player.hp <= 0) return;
    if (player.godMode) return;

    var dist = _dist2D(engineer.mesh.position, player.position);
    if (dist > FIRE_RANGE) return;

    // Check if player is behind cover (50% mitigation if so)
    var dmg = 10 + Math.floor(Math.random() * 10);

    // Basic cover check: is the player right behind a cover piece facing the engineer?
    // If so, apply cover mitigation from that cover piece (for enemies protected by engineer's walls)
    // We don't apply the reduction to player here (player would use their own cover system)

    try {
      if (player.hp !== undefined) {
        player.hp = Math.max(0, player.hp - dmg);
        if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp || 100);
        if (typeof HUD !== 'undefined' && HUD.showDamageFlash) HUD.showDamageFlash(0xff4400, 0.3);
      }
    } catch (e) {}
  }

  // ══════════════════════════════════════════════════════════════════
  //  DAMAGE & DEATH
  // ══════════════════════════════════════════════════════════════════

  // Called when a cover piece takes a hit
  function _damageCover(coverObj, amount) {
    coverObj.hp -= amount;
    // Flash white on hit
    try {
      if (coverObj.mesh && coverObj.mesh.material) {
        var origColor = COVER_COLOR;
        coverObj.mesh.material.color.setHex(0xffffff);
        setTimeout(function () {
          if (coverObj.mesh && coverObj.mesh.material) {
            coverObj.mesh.material.color.setHex(origColor);
          }
        }, 80);
      }
    } catch (e) {}

    if (coverObj.hp <= 0) {
      _destroyCoverPiece(coverObj);
    }
  }

  // Deal damage to an engineer; returns true if killed
  function _damageEngineer(engineer, amount) {
    if (!engineer.alive) return false;
    engineer.hp -= amount;
    if (engineer.hp <= 0) {
      _killEngineer(engineer);
      return true;
    }
    // Alert engineer to combat when hit
    engineer.alerted = true;
    return false;
  }

  function _killEngineer(engineer) {
    if (!engineer.alive) return;
    engineer.alive = false;
    engineer.state = 'dead';

    var sc = _getScene();
    if (sc && engineer.mesh) {
      // Topple animation: lay flat
      engineer.mesh.rotation.x = Math.PI / 2;
      engineer.mesh.position.y -= 0.2;

      // Remove mesh from scene after brief delay
      var mesh = engineer.mesh;
      setTimeout(function () {
        if (sc) sc.remove(mesh);
      }, 2000);
    }

    // Covers remain but become destroyable (already tracked in _coverPieces)
    // They are now fully damageable — no special action needed

    // Score
    _addScore(SCORE_KILL);

    // HUD toast + yellow flash
    _hudToast('ENGINEER DOWN', '#FFFF00', 2800);
    _flashYellow();

    // Remove from engineer list
    var idx = window._engineerEnemies.indexOf(engineer);
    if (idx !== -1) window._engineerEnemies.splice(idx, 1);
  }

  // ══════════════════════════════════════════════════════════════════
  //  COVER DAMAGE REDUCTION (utility for other systems to call)
  // ══════════════════════════════════════════════════════════════════

  // Returns the damage reduction factor (0..1) for a position if behind cover
  // Other enemy AI can call this to reduce damage taken
  function getCoverReductionAt(px, py, pz) {
    for (var i = 0; i < _coverPieces.length; i++) {
      var c = _coverPieces[i];
      if (!c.mesh) continue;
      var cp = c.mesh.position;
      var dx = cp.x - px;
      var dz = cp.z - pz;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d < 2.5) return c.dmgReduction;
    }
    return 0;
  }

  // ══════════════════════════════════════════════════════════════════
  //  REPAIR LOGIC
  // ══════════════════════════════════════════════════════════════════

  function _doRepairNearby(engineer) {
    // Call hook if registered (mech/shield generator repair)
    try {
      if (typeof window._onEngineerRepair === 'function') {
        window._onEngineerRepair(engineer.mesh.position, REPAIR_RANGE);
      }
    } catch (e) {}
  }

  // ══════════════════════════════════════════════════════════════════
  //  PER-FRAME UPDATE FOR ONE ENGINEER
  // ══════════════════════════════════════════════════════════════════

  function _updateEngineer(engineer, delta) {
    if (!engineer.alive) return;

    var mesh   = engineer.mesh;
    var player = _getPlayer();
    if (!player || !player.position) return;

    var pos    = mesh.position;
    var dist   = _dist2D(pos, player.position);

    // Alert check: player fired a shot OR player is within fire range
    if (_shotFired || dist < FIRE_RANGE) {
      engineer.alerted = true;
    }

    // Repair tick
    engineer.repairTimer += delta;
    if (engineer.repairTimer >= REPAIR_INTERVAL) {
      engineer.repairTimer = 0;
      _doRepairNearby(engineer);
    }

    // Build cooldown countdown
    if (engineer.buildCooldown > 0) {
      engineer.buildCooldown -= delta;
    }

    // ── State machine ──────────────────────────────────────────────
    if (engineer.state === 'approach') {
      // Move toward a build target; if alerted and not yet building, pick a spot
      if (!engineer.buildTarget && engineer.coversBuilt < MAX_COVERS && engineer.buildCooldown <= 0) {
        engineer.buildTarget = _pickBuildTarget(engineer);
      }

      if (engineer.buildTarget) {
        var bt  = engineer.buildTarget;
        var ddx = bt.x - pos.x;
        var ddz = bt.z - pos.z;
        var dd  = Math.sqrt(ddx * ddx + ddz * ddz);

        if (dd < 0.5) {
          // Arrived — start building
          engineer.state     = 'build';
          engineer.buildTimer = 0;
          // Stoop animation
          mesh.rotation.x = 0.5;
        } else {
          // Walk toward build target
          var spd = MOVE_SPEED * delta / dd;
          pos.x += ddx * spd;
          pos.z += ddz * spd;
          // Face direction of travel
          mesh.rotation.y = Math.atan2(ddx, ddz);
        }
      } else if (engineer.alerted) {
        // No build target available — switch to combat
        engineer.state = 'combat';
      }

    } else if (engineer.state === 'build') {
      // Build animation
      engineer.buildTimer += delta;
      engineer.armSwing   += delta * 4;

      // Arm swing: oscillate up and down
      if (mesh.userData.armR) {
        mesh.userData.armR.rotation.x = Math.sin(engineer.armSwing) * 0.8 - 0.4;
      }

      if (engineer.buildTimer >= COVER_BUILD_TIME) {
        // Finish building
        _placeCover(engineer);

        if (engineer.coversBuilt < MAX_COVERS && engineer.buildCooldown <= 0) {
          // Go pick another build spot
          engineer.state = 'approach';
        } else {
          // Done building (max or on cooldown) — switch to combat
          engineer.state = 'combat';
          mesh.rotation.x = 0;
          if (mesh.userData.armR) mesh.userData.armR.rotation.x = 0;
        }
      }

    } else if (engineer.state === 'combat') {
      // Face player
      var dpx = player.position.x - pos.x;
      var dpz = player.position.z - pos.z;
      mesh.rotation.x = 0;
      mesh.rotation.y = Math.atan2(dpx, dpz);

      // Shoot
      engineer.fireTimer += delta;
      if (engineer.fireTimer >= FIRE_RATE && dist <= FIRE_RANGE) {
        engineer.fireTimer = 0;
        _fireAtPlayer(engineer);
      }

      // If build cooldown cleared and we can still build, go back to approach
      if (engineer.buildCooldown <= 0 && engineer.coversBuilt < MAX_COVERS) {
        engineer.state = 'approach';
      }

      // Idle arm swing while in combat
      engineer.armSwing += delta * 1.5;
      if (mesh.userData.armR) {
        mesh.userData.armR.rotation.x = Math.sin(engineer.armSwing) * 0.2;
      }

    } else if (engineer.state === 'idle') {
      // Not yet alerted — stand still, look around
      engineer.armSwing += delta * 0.4;
      mesh.rotation.y += delta * 0.3;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  SHOT LISTENER (detects player gunfire to alert engineers)
  // ══════════════════════════════════════════════════════════════════

  function _setupShotListener() {
    var _prevOnShotFired = window._onShotFired;
    window._onShotFired = function () {
      _shotFired = true;
      // Reset flag next frame via setTimeout
      setTimeout(function () { _shotFired = false; }, 100);
      // Propagate to any previous handler
      if (typeof _prevOnShotFired === 'function') {
        try { _prevOnShotFired(); } catch (e) {}
      }
    };
  }

  // ══════════════════════════════════════════════════════════════════
  //  RAYCASTING — check if player's bullets hit covers or engineers
  // ══════════════════════════════════════════════════════════════════

  // Call this from the game's bullet-hit system (or we hook it here if
  // window._onBulletHit is available, else engineers/covers just persist
  // unless other code calls damageCover/damageEngineer).
  function _setupBulletHook() {
    var _prevHit = window._onBulletHit;
    window._onBulletHit = function (hitObject, damage) {
      // Check covers
      for (var ci = 0; ci < _coverPieces.length; ci++) {
        if (_coverPieces[ci].mesh === hitObject) {
          _damageCover(_coverPieces[ci], damage || 20);
          return true;
        }
      }
      // Check engineers
      for (var ei = 0; ei < window._engineerEnemies.length; ei++) {
        var eng = window._engineerEnemies[ei];
        if (eng.alive && eng.mesh === hitObject) {
          _damageEngineer(eng, damage || 20);
          return true;
        }
      }
      // Propagate
      if (typeof _prevHit === 'function') {
        try { return _prevHit(hitObject, damage); } catch (e) {}
      }
      return false;
    };
  }

  // ══════════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ══════════════════════════════════════════════════════════════════

  function init() {
    if (_inited) return;
    _inited = true;

    _setupShotListener();
    _setupBulletHook();

    // Ensure registry is fresh
    window._engineerEnemies = window._engineerEnemies || [];
  }

  function update(delta) {
    // Lazy scene resolution
    _getScene();

    // Only run during active gameplay
    var player = _getPlayer();
    if (!player || !player.position) return;
    if (player.hp !== undefined && player.hp <= 0) return;

    // Auto-spawn: 1 engineer per wave after wave 4, if none alive
    var wave = _getCurrentWave();
    if (wave > 4 && window._engineerEnemies.length === 0) {
      // Only spawn at start of wave combat (use alerted flag via wave state)
      // Spawn once immediately when wave > 4 and no engineers present
      // (the wave controller is expected to call init; we self-spawn here
      //  as a fallback if SpawnManager doesn't call us directly)
      _spawnEngineer();
    }

    // Update each engineer
    for (var i = window._engineerEnemies.length - 1; i >= 0; i--) {
      var eng = window._engineerEnemies[i];
      _updateEngineer(eng, delta);
    }

    // Reset one-shot flag
    // (_shotFired is reset by its own setTimeout, but clear here too)
  }

  function reset() {
    var sc = _getScene();

    // Remove all engineer meshes
    for (var i = 0; i < window._engineerEnemies.length; i++) {
      var eng = window._engineerEnemies[i];
      if (sc && eng.mesh) sc.remove(eng.mesh);
    }
    window._engineerEnemies.length = 0;

    // Remove all cover pieces
    for (var j = 0; j < _coverPieces.length; j++) {
      var cp = _coverPieces[j];
      if (sc && cp.mesh) sc.remove(cp.mesh);
    }
    _coverPieces.length = 0;

    _shotFired = false;
  }

  // Expose internal methods for integration by other modules
  return {
    init:                  init,
    update:                update,
    reset:                 reset,
    spawnEngineer:         _spawnEngineer,
    damageEngineer:        _damageEngineer,
    damageCover:           _damageCover,
    getCoverReductionAt:   getCoverReductionAt,
    getCoverPieces:        function () { return _coverPieces; },
  };

})();
