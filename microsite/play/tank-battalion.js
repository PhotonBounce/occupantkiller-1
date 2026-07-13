/* ───────────────────────────────────────────────────────────────────────────
   tank-battalion.js — Tank Battalion Mini-Game
   API: window.TankBattalion = { init, update, reset }
   Activation: T + B simultaneous keypress (both keys within 400ms)
   Controls:
     W / S               → drive forward / reverse
     A / D               → steer left / right
     Mouse               → aim turret independently
     SPACE               → fire main gun
     TAB                 → cycle ammo (AP / HEAT / Smoke)
     F                   → call artillery strike (120s cooldown)
     G                   → call 2 allied tanks (follow for 60s)
   ─────────────────────────────────────────────────────────────────────────── */
window.TankBattalion = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active        = false;
  var _tKeyTime      = 0;
  var _bKeyTime      = 0;
  var ACTIVATION_WINDOW = 400;

  /* ── Key state ─────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── Mouse state ───────────────────────────────────────────────────────── */
  var _mouseX      = 0;
  var _mouseY      = 0;
  var _turretYaw   = 0;
  var _barrelPitch = 0;

  /* ── Player tank ───────────────────────────────────────────────────────── */
  var _playerGroup   = null;
  var _playerHull    = null;
  var _playerTurret  = null;
  var _playerBarrel  = null;
  var _playerWheels  = [];
  var _playerHullHP  = 400;
  var _playerTurretHP = 120;
  var _playerYaw     = 0;
  var _playerSpeed   = 0;
  var _inHullDown    = false;

  /* ── Ammo ──────────────────────────────────────────────────────────────── */
  var AMMO_AP    = 0;
  var AMMO_HEAT  = 1;
  var AMMO_SMOKE = 2;
  var _currentAmmo = AMMO_AP;
  var _ammoHEAT    = 3;
  var _ammoSmoke   = 2;

  /* ── Reload ────────────────────────────────────────────────────────────── */
  var _reloadTime  = 3.0;
  var _reloadTimer = 0;

  /* ── Shells / projectiles ──────────────────────────────────────────────── */
  var _shells = [];

  /* ── Craters & smoke clouds ────────────────────────────────────────────── */
  var _craters     = [];
  var _smokeClouds = [];

  /* ── Enemy tanks ───────────────────────────────────────────────────────── */
  var _enemies = [];
  var NUM_ENEMIES = 8;

  /* ── Allied tanks ──────────────────────────────────────────────────────── */
  var _allies         = [];
  var _allyTimer      = 0;
  var _alliesLost     = 0;

  /* ── Artillery support ─────────────────────────────────────────────────── */
  var _artyCooldown   = 0;
  var _artyPending    = false;
  var _artyTimer      = 0;
  var _artyTargetX    = 0;
  var _artyTargetZ    = 0;
  var _artyIndicators = [];

  /* ── Battlefield objects ───────────────────────────────────────────────── */
  var _wrecks    = [];
  var _ridges    = [];
  var _trees     = [];

  /* ── HUD overlay ───────────────────────────────────────────────────────── */
  var _hudEl = null;

  /* ── Score / timing ────────────────────────────────────────────────────── */
  var _startTime     = 0;
  var _elapsedTime   = 0;
  var _missionClear  = false;

  /* ── Constants ─────────────────────────────────────────────────────────── */
  var SHELL_SPEED     = 60;
  var SHELL_GRAVITY   = 0.01; // 0.1u drop per 10u traveled → 0.01 per u
  var DIRECT_DAMAGE   = 150;
  var HEAT_DAMAGE     = 150;
  var HEAT_SPLASH     = 30;
  var HEAT_SPLASH_RAD = 8;
  var ENEMY_FRONT_HP  = 200;
  var ENEMY_SIDE_HP   = 120;
  var ENEMY_REAR_HP   = 80;
  var HULL_DOWN_REDUCTION = 0.5;

  /* ═══════════════════════════════════════════════════════════════════════
     GEOMETRY HELPERS
  ═══════════════════════════════════════════════════════════════════════ */

  function makeMesh(geo, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  /* ── Build a tank group ─────────────────────────────────────────────── */
  function buildTank(hullColor, turretColor, barrelColor) {
    var group = new THREE.Group();

    // Hull 5×1.8×3
    var hullGeo = new THREE.BoxGeometry(5, 1.8, 3);
    var hull = makeMesh(hullGeo, hullColor);
    hull.position.set(0, 0, 0);
    group.add(hull);

    // Turret cylinder r=1 h=0.8
    var turretGroup = new THREE.Group();
    turretGroup.position.set(0, 1.3, 0);
    var turretGeo = new THREE.CylinderGeometry(1, 1, 0.8, 12);
    var turret = makeMesh(turretGeo, turretColor);
    turretGroup.add(turret);

    // Barrel cylinder r=0.15 h=2.5 (extends forward)
    var barrelGroup = new THREE.Group();
    barrelGroup.position.set(0, 0, 0);
    var barrelGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8);
    var barrel = makeMesh(barrelGeo, barrelColor);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, -1.25); // tip extends forward (negative Z)
    barrelGroup.add(barrel);
    turretGroup.add(barrelGroup);

    group.add(turretGroup);

    // 4 wheels per side (8 total)
    var wheelPositions = [-1.5, -0.5, 0.5, 1.5];
    var wheels = [];
    var wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 10);
    for (var wi = 0; wi < wheelPositions.length; wi++) {
      // left side
      var wL = makeMesh(wheelGeo, 0x333333);
      wL.rotation.z = Math.PI / 2;
      wL.position.set(wheelPositions[wi], -0.9, -1.65);
      group.add(wL);
      wheels.push(wL);
      // right side
      var wR = makeMesh(wheelGeo, 0x333333);
      wR.rotation.z = Math.PI / 2;
      wR.position.set(wheelPositions[wi], -0.9, 1.65);
      group.add(wR);
      wheels.push(wR);
    }

    return {
      group: group,
      hull: hull,
      turretGroup: turretGroup,
      barrelGroup: barrelGroup,
      barrel: barrel,
      wheels: wheels
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     BATTLEFIELD SETUP
  ═══════════════════════════════════════════════════════════════════════ */

  function buildBattlefield() {
    // Ground plane
    var groundGeo = new THREE.BoxGeometry(300, 0.2, 300);
    var ground = makeMesh(groundGeo, 0x6B7C3A);
    ground.position.set(0, -1, 0);
    _scene.add(ground);

    // Ambient + directional light
    var ambient = new THREE.AmbientLight(0x888888);
    _scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xffffcc, 1.0);
    sun.position.set(50, 80, 30);
    _scene.add(sun);

    // 6 vehicle wrecks as cover
    var wreckPositions = [
      [-20, 0, -15], [15, 0, -25], [-35, 0, 10],
      [30, 0, 20],  [-10, 0, 35], [25, 0, -10]
    ];
    for (var wi = 0; wi < wreckPositions.length; wi++) {
      var wGeo = new THREE.BoxGeometry(5, 1.5, 2.5);
      var wreck = makeMesh(wGeo, 0x444433);
      wreck.position.set(wreckPositions[wi][0], 0, wreckPositions[wi][2]);
      wreck.rotation.y = Math.random() * Math.PI;
      _scene.add(wreck);
      _wrecks.push(wreck);
    }

    // 3 ridgelines providing hull-down positions
    var ridgePositions = [
      [-40, 0, 0], [0, 0, -40], [40, 0, 15]
    ];
    for (var ri = 0; ri < ridgePositions.length; ri++) {
      var rGeo = new THREE.BoxGeometry(20, 3, 2);
      var ridge = makeMesh(rGeo, 0x556644);
      ridge.position.set(ridgePositions[ri][0], 0.5, ridgePositions[ri][2]);
      var rAngle = (ri === 1) ? Math.PI / 4 : 0;
      ridge.rotation.y = rAngle;
      _scene.add(ridge);
      _ridges.push({ mesh: ridge, pos: ridgePositions[ri] });
    }

    // Tree clusters
    var treePositions = [
      [-25, 0, -30], [-28, 0, -25], [-22, 0, -28],
      [20, 0, 30],   [25, 0, 28],   [18, 0, 33],
      [-50, 0, 20],  [-48, 0, 25]
    ];
    for (var ti = 0; ti < treePositions.length; ti++) {
      var tGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 6);
      var tree = makeMesh(tGeo, 0x224411);
      tree.position.set(treePositions[ti][0], 1, treePositions[ti][2]);
      _scene.add(tree);
      _trees.push({ mesh: tree, alive: true });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PLAYER SETUP
  ═══════════════════════════════════════════════════════════════════════ */

  function spawnPlayer() {
    var built = buildTank(0x556644, 0x445533, 0x334422);
    _playerGroup  = built.group;
    _playerHull   = built.hull;
    _playerTurret = built.turretGroup;
    _playerBarrel = built.barrelGroup;
    _playerWheels = built.wheels;

    _playerGroup.position.set(0, 0, 0);
    _scene.add(_playerGroup);

    _playerHullHP   = 400;
    _playerTurretHP = 120;
    _playerYaw      = 0;
    _playerSpeed    = 0;
    _turretYaw      = 0;
    _barrelPitch    = 0;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ENEMY SETUP
  ═══════════════════════════════════════════════════════════════════════ */

  function spawnEnemies() {
    _enemies = [];
    var spawnRing = [
      [-60, 0, -60], [60, 0, -60], [-60, 0, 60], [60, 0, 60],
      [0, 0, -80],   [0, 0, 80],   [-80, 0, 0],  [80, 0, 0]
    ];
    for (var ei = 0; ei < NUM_ENEMIES; ei++) {
      var built = buildTank(0x553322, 0x442211, 0x331100);
      var sp = spawnRing[ei];
      built.group.position.set(sp[0], 0, sp[2]);
      var initYaw = Math.atan2(-sp[0], -sp[2]);
      built.group.rotation.y = initYaw;
      _scene.add(built.group);

      _enemies.push({
        group:      built.group,
        turretGroup: built.turretGroup,
        wheels:     built.wheels,
        frontHP:    ENEMY_FRONT_HP,
        sideHP:     ENEMY_SIDE_HP,
        rearHP:     ENEMY_REAR_HP,
        alive:      true,
        yaw:        initYaw,
        turretYaw:  0,
        fireTimer:  4 + Math.random() * 2,
        waypointTimer: 0,
        waypointX:  (Math.random() - 0.5) * 60,
        waypointZ:  (Math.random() - 0.5) * 60
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     FIRING
  ═══════════════════════════════════════════════════════════════════════ */

  function firePlayerShell() {
    if (_reloadTimer > 0) return;
    if (_currentAmmo === AMMO_HEAT && _ammoHEAT <= 0) return;
    if (_currentAmmo === AMMO_SMOKE && _ammoSmoke <= 0) return;

    if (_currentAmmo === AMMO_HEAT)  _ammoHEAT--;
    if (_currentAmmo === AMMO_SMOKE) _ammoSmoke--;
    _reloadTimer = _reloadTime;

    // Shell start pos = barrel tip in world space
    var barrelTip = new THREE.Vector3(0, 0, -2.5);
    _playerBarrel.localToWorld(barrelTip);

    // Direction: forward along barrel in world space
    var dir = new THREE.Vector3(0, 0, -1);
    var quat = new THREE.Quaternion();
    _playerBarrel.getWorldQuaternion(quat);
    dir.applyQuaternion(quat).normalize();

    var shellGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6);
    var shellColor = (_currentAmmo === AMMO_SMOKE) ? 0x888888 : 0xCCCC44;
    var shellMesh = makeMesh(shellGeo, shellColor);
    shellMesh.position.copy(barrelTip);

    // Align shell mesh to direction
    shellMesh.quaternion.copy(quat);
    _scene.add(shellMesh);

    _shells.push({
      mesh:      shellMesh,
      vel:       dir.clone().multiplyScalar(SHELL_SPEED),
      distTraveled: 0,
      ammoType:  _currentAmmo,
      fromPlayer: true,
      alive:     true
    });
  }

  function fireEnemyShell(enemy) {
    var turretDir = new THREE.Vector3(0, 0, -1);
    var quat = new THREE.Quaternion();
    enemy.turretGroup.getWorldQuaternion(quat);
    turretDir.applyQuaternion(quat).normalize();

    var startPos = new THREE.Vector3();
    enemy.group.getWorldPosition(startPos);
    startPos.addScaledVector(turretDir, 2.0);
    startPos.y += 1.3;

    var shellGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6);
    var shellMesh = makeMesh(shellGeo, 0xFF6622);
    shellMesh.position.copy(startPos);
    _scene.add(shellMesh);

    _shells.push({
      mesh:      shellMesh,
      vel:       turretDir.clone().multiplyScalar(40),
      distTraveled: 0,
      ammoType:  AMMO_AP,
      fromPlayer: false,
      alive:     true
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DAMAGE CALCULATION
  ═══════════════════════════════════════════════════════════════════════ */

  function getHitFace(shellVel, targetGroup) {
    // Determine hit face from relative angle of shell vs enemy facing
    var enemyFwd = new THREE.Vector3(0, 0, -1);
    enemyFwd.applyQuaternion(targetGroup.quaternion);
    var shellDir = shellVel.clone().normalize();
    // dot product: positive → hitting from front (shell going same dir as enemy front → rear hit)
    var dot = shellDir.dot(enemyFwd);
    var cross = new THREE.Vector3().crossVectors(shellDir, enemyFwd);
    var side = Math.abs(cross.y);

    if (dot > 0.5) return 'rear';
    if (dot < -0.5) return 'front';
    if (side > 0.5) return 'side';
    return 'front';
  }

  function applyDamageToEnemy(enemy, shellVel, dmg) {
    var face = getHitFace(shellVel, enemy.group);
    if (face === 'front') {
      enemy.frontHP -= dmg;
      if (enemy.frontHP <= 0) killEnemy(enemy);
    } else if (face === 'side') {
      enemy.sideHP -= dmg;
      if (enemy.sideHP <= 0) killEnemy(enemy);
    } else {
      enemy.rearHP -= dmg;
      if (enemy.rearHP <= 0) killEnemy(enemy);
    }
  }

  function killEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    _scene.remove(enemy.group);
    // spawn wreck
    var wreckGeo = new THREE.BoxGeometry(5, 1.5, 3);
    var wreck = makeMesh(wreckGeo, 0x333322);
    wreck.position.copy(enemy.group.position);
    wreck.rotation.y = Math.random() * Math.PI;
    _scene.add(wreck);
    _wrecks.push(wreck);
    checkVictory();
  }

  function applyDamageToPlayer(dmg) {
    var reduced = _inHullDown ? dmg * HULL_DOWN_REDUCTION : dmg;
    if (_inHullDown) {
      // hull-down: only turret exposed
      _playerTurretHP -= reduced;
      if (_playerTurretHP <= 0) {
        _playerTurretHP = 0;
        gameOver(false);
      }
    } else {
      _playerHullHP -= reduced;
      if (_playerHullHP <= 0) {
        _playerHullHP = 0;
        gameOver(false);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CRATER / EFFECTS
  ═══════════════════════════════════════════════════════════════════════ */

  function spawnCrater(pos) {
    var cGeo = new THREE.BoxGeometry(1, 0.3, 1);
    var crater = makeMesh(cGeo, 0x444433);
    crater.position.set(pos.x, -0.85, pos.z);
    _scene.add(crater);
    _craters.push(crater);
  }

  function spawnSmokeCloud(pos) {
    var sGeo = new THREE.BoxGeometry(6, 3, 6);
    var smoke = makeMesh(sGeo, 0x888888);
    smoke.position.set(pos.x, 1.5, pos.z);
    smoke.material.transparent = true;
    smoke.material.opacity = 0.6;
    _scene.add(smoke);
    _smokeClouds.push({ mesh: smoke, life: 12 });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ARTILLERY SUPPORT
  ═══════════════════════════════════════════════════════════════════════ */

  function callArtillery() {
    if (_artyCooldown > 0 || _artyPending) return;
    _artyPending = true;
    _artyTimer   = 4.0;
    // target = 30 units ahead of player
    var fwd = new THREE.Vector3(0, 0, -1);
    fwd.applyEuler(new THREE.Euler(0, _playerYaw, 0));
    _artyTargetX = _playerGroup.position.x + fwd.x * 30;
    _artyTargetZ = _playerGroup.position.z + fwd.z * 30;

    // spawn aim indicator
    for (var ai = 0; ai < 3; ai++) {
      var iGeo = new THREE.BoxGeometry(2, 0.2, 2);
      var ind = makeMesh(iGeo, 0xFF4400);
      var ox = (Math.random() - 0.5) * 20;
      var oz = (Math.random() - 0.5) * 20;
      ind.position.set(_artyTargetX + ox, 0, _artyTargetZ + oz);
      _scene.add(ind);
      _artyIndicators.push({ mesh: ind, ox: ox, oz: oz });
    }
  }

  function resolveArtillery() {
    for (var ai = 0; ai < _artyIndicators.length; ai++) {
      var ind = _artyIndicators[ai];
      var hitPos = ind.mesh.position.clone();
      // deal area damage to nearby enemies
      for (var ei = 0; ei < _enemies.length; ei++) {
        var en = _enemies[ei];
        if (!en.alive) continue;
        var d = en.group.position.distanceTo(hitPos);
        if (d < 8) {
          applyDamageToEnemy(en, new THREE.Vector3(0, -1, 0), 200);
        }
      }
      spawnCrater(hitPos);
      _scene.remove(ind.mesh);
    }
    _artyIndicators = [];
    _artyPending    = false;
    _artyCooldown   = 120;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ALLIED TANKS
  ═══════════════════════════════════════════════════════════════════════ */

  function callAllies() {
    if (_allyTimer > 0) return;
    _allyTimer = 60;
    for (var ai = 0; ai < 2; ai++) {
      var built = buildTank(0x448844, 0x336633, 0x224422);
      var side = ai === 0 ? -8 : 8;
      built.group.position.set(
        _playerGroup.position.x + side,
        0,
        _playerGroup.position.z + 10
      );
      _scene.add(built.group);
      _allies.push({
        group:  built.group,
        turretGroup: built.turretGroup,
        wheels: built.wheels,
        hp:     300,
        alive:  true,
        yaw:    0,
        fireTimer: 3 + Math.random() * 2
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HULL-DOWN DETECTION
  ═══════════════════════════════════════════════════════════════════════ */

  function updateHullDown() {
    _inHullDown = false;
    var pp = _playerGroup.position;
    for (var ri = 0; ri < _ridges.length; ri++) {
      var ridge = _ridges[ri].mesh;
      var ridgePos = ridge.position;
      var dx = pp.x - ridgePos.x;
      var dz = pp.z - ridgePos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 12) {
        _inHullDown = true;
        break;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SHELL UPDATE
  ═══════════════════════════════════════════════════════════════════════ */

  function updateShells(dt) {
    var toRemove = [];
    for (var si = 0; si < _shells.length; si++) {
      var sh = _shells[si];
      if (!sh.alive) { toRemove.push(si); continue; }

      var dx = sh.vel.x * dt;
      var dz = sh.vel.z * dt;
      var stepDist = Math.sqrt(dx * dx + sh.vel.z * dt * dz);
      sh.distTraveled += Math.sqrt(dx * dx + dz * dz);

      // gravity arc: drop 0.1u per 10u traveled = 0.01 per u
      sh.vel.y -= SHELL_GRAVITY * Math.sqrt(dx * dx + dz * dz);

      sh.mesh.position.x += sh.vel.x * dt;
      sh.mesh.position.y += sh.vel.y * dt;
      sh.mesh.position.z += sh.vel.z * dt;

      // Out of bounds / hit ground
      if (sh.mesh.position.y < -0.5 || sh.distTraveled > 500) {
        sh.alive = false;
        _scene.remove(sh.mesh);
        if (sh.fromPlayer && sh.ammoType === AMMO_SMOKE) {
          spawnSmokeCloud(sh.mesh.position);
        } else {
          spawnCrater(sh.mesh.position);
        }
        toRemove.push(si);
        continue;
      }

      // Check hits
      var hit = false;
      var shellPos = sh.mesh.position;

      if (sh.fromPlayer) {
        // vs enemies
        for (var ei = 0; ei < _enemies.length; ei++) {
          var en = _enemies[ei];
          if (!en.alive) continue;
          var dist = shellPos.distanceTo(en.group.position);
          if (dist < 3.5) {
            sh.alive = false;
            _scene.remove(sh.mesh);
            if (sh.ammoType === AMMO_HEAT) {
              applyDamageToEnemy(en, sh.vel, HEAT_DAMAGE);
              // splash
              for (var sej = 0; sej < _enemies.length; sej++) {
                if (_enemies[sej].alive) {
                  var sd = shellPos.distanceTo(_enemies[sej].group.position);
                  if (sd < HEAT_SPLASH_RAD) {
                    applyDamageToEnemy(_enemies[sej], sh.vel, HEAT_SPLASH);
                  }
                }
              }
            } else if (sh.ammoType === AMMO_SMOKE) {
              spawnSmokeCloud(shellPos);
            } else {
              applyDamageToEnemy(en, sh.vel, DIRECT_DAMAGE);
            }
            hit = true;
            toRemove.push(si);
            break;
          }
        }
      } else {
        // enemy shell vs player
        if (_playerGroup) {
          var pd = shellPos.distanceTo(_playerGroup.position);
          if (pd < 3.5) {
            sh.alive = false;
            _scene.remove(sh.mesh);
            applyDamageToPlayer(80);
            hit = true;
            toRemove.push(si);
          }
        }
        // enemy shell vs allies
        if (!hit) {
          for (var alj = 0; alj < _allies.length; alj++) {
            var al = _allies[alj];
            if (!al.alive) continue;
            var ad = shellPos.distanceTo(al.group.position);
            if (ad < 3.5) {
              sh.alive = false;
              _scene.remove(sh.mesh);
              al.hp -= 80;
              if (al.hp <= 0) {
                al.alive = false;
                _scene.remove(al.group);
                _alliesLost++;
              }
              hit = true;
              toRemove.push(si);
              break;
            }
          }
        }
      }
    }

    // Remove dead shells in reverse order
    for (var ri2 = toRemove.length - 1; ri2 >= 0; ri2--) {
      _shells.splice(toRemove[ri2], 1);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ENEMY AI UPDATE
  ═══════════════════════════════════════════════════════════════════════ */

  function updateEnemies(dt) {
    if (!_playerGroup) return;
    var playerPos = _playerGroup.position;

    for (var ei = 0; ei < _enemies.length; ei++) {
      var en = _enemies[ei];
      if (!en.alive) continue;

      // Update waypoint
      en.waypointTimer -= dt;
      if (en.waypointTimer <= 0) {
        // Move toward player with slight randomness
        en.waypointX = playerPos.x + (Math.random() - 0.5) * 20;
        en.waypointZ = playerPos.z + (Math.random() - 0.5) * 20;
        en.waypointTimer = 3 + Math.random() * 2;
      }

      // Drive toward waypoint
      var toWPx = en.waypointX - en.group.position.x;
      var toWPz = en.waypointZ - en.group.position.z;
      var toWPDist = Math.sqrt(toWPx * toWPx + toWPz * toWPz);
      if (toWPDist > 5) {
        var targetYaw = Math.atan2(toWPx, toWPz);
        var yawDiff = targetYaw - en.yaw;
        // Normalize
        while (yawDiff > Math.PI)  yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        en.yaw += yawDiff * Math.min(1.0, dt * 1.5);
        en.group.rotation.y = en.yaw;
        en.group.position.x += Math.sin(en.yaw) * 8 * dt;
        en.group.position.z += Math.cos(en.yaw) * 8 * dt;
      }

      // Turret tracks player
      var toDx = playerPos.x - en.group.position.x;
      var toDz = playerPos.z - en.group.position.z;
      var desiredTurretYaw = Math.atan2(toDx, toDz);
      en.turretYaw = desiredTurretYaw - en.yaw;
      en.turretGroup.rotation.y = en.turretYaw;

      // Fire
      en.fireTimer -= dt;
      if (en.fireTimer <= 0) {
        var toPlayer = en.group.position.distanceTo(playerPos);
        if (toPlayer < 100) {
          fireEnemyShell(en);
        }
        en.fireTimer = 4 + Math.random() * 2;
      }

      // Crush trees
      for (var ti = 0; ti < _trees.length; ti++) {
        var tr = _trees[ti];
        if (!tr.alive) continue;
        var td = en.group.position.distanceTo(tr.mesh.position);
        if (td < 3) {
          tr.alive = false;
          _scene.remove(tr.mesh);
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ALLIED AI UPDATE
  ═══════════════════════════════════════════════════════════════════════ */

  function updateAllies(dt) {
    if (!_playerGroup) return;
    var playerPos = _playerGroup.position;

    _allyTimer -= dt;
    if (_allyTimer <= 0 && _allies.length > 0) {
      // Dismiss allies
      for (var ai = 0; ai < _allies.length; ai++) {
        if (_allies[ai].alive) {
          _scene.remove(_allies[ai].group);
        }
      }
      _allies = [];
      return;
    }

    // Find nearest enemy for allies to attack
    var nearestEnemy = null;
    var nearestDist = Infinity;
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (!_enemies[ei].alive) continue;
      var d = _enemies[ei].group.position.distanceTo(playerPos);
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemy = _enemies[ei];
      }
    }

    for (var ai2 = 0; ai2 < _allies.length; ai2++) {
      var al = _allies[ai2];
      if (!al.alive) continue;

      // Follow player at offset
      var offsetX = (ai2 === 0) ? -8 : 8;
      var followX = playerPos.x + offsetX;
      var followZ = playerPos.z + 10;
      var toFx = followX - al.group.position.x;
      var toFz = followZ - al.group.position.z;
      var toFDist = Math.sqrt(toFx * toFx + toFz * toFz);
      if (toFDist > 5) {
        var alYaw = Math.atan2(toFx, toFz);
        al.yaw = alYaw;
        al.group.rotation.y = alYaw;
        al.group.position.x += Math.sin(alYaw) * 9 * dt;
        al.group.position.z += Math.cos(alYaw) * 9 * dt;
      }

      // Fire at nearest enemy
      al.fireTimer -= dt;
      if (al.fireTimer <= 0 && nearestEnemy) {
        var toEx = nearestEnemy.group.position.x - al.group.position.x;
        var toEz = nearestEnemy.group.position.z - al.group.position.z;
        var toEDist = Math.sqrt(toEx * toEx + toEz * toEz);
        if (toEDist < 80) {
          var alTurretYaw = Math.atan2(toEx, toEz) - al.yaw;
          al.turretGroup.rotation.y = alTurretYaw;
          // Simple projectile for ally
          var dir = new THREE.Vector3(toEx / toEDist, 0, toEz / toEDist);
          var startP = al.group.position.clone();
          startP.y += 1.3;
          var aGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6);
          var aMesh = makeMesh(aGeo, 0xCCCC44);
          aMesh.position.copy(startP);
          _scene.add(aMesh);
          _shells.push({
            mesh: aMesh,
            vel:  dir.clone().multiplyScalar(55),
            distTraveled: 0,
            ammoType: AMMO_AP,
            fromPlayer: true, // treat as friendly
            alive: true
          });
        }
        al.fireTimer = 3 + Math.random() * 2;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PLAYER UPDATE
  ═══════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (!_playerGroup) return;

    // Drive
    var accel = 0;
    if (_keys['w'] || _keys['W']) accel = 1;
    if (_keys['s'] || _keys['S']) accel = -1;

    var steer = 0;
    if (_keys['a'] || _keys['A']) steer = 1;
    if (_keys['d'] || _keys['D']) steer = -1;

    _playerSpeed += accel * 15 * dt;
    _playerSpeed *= 0.92; // friction
    _playerSpeed = Math.max(-12, Math.min(20, _playerSpeed));

    _playerYaw += steer * 1.2 * dt * (Math.abs(_playerSpeed) > 0.5 ? 1 : 0.3);
    _playerGroup.rotation.y = _playerYaw;

    _playerGroup.position.x += Math.sin(_playerYaw) * _playerSpeed * dt;
    _playerGroup.position.z += Math.cos(_playerYaw) * _playerSpeed * dt;

    // Clamp to battlefield
    _playerGroup.position.x = Math.max(-140, Math.min(140, _playerGroup.position.x));
    _playerGroup.position.z = Math.max(-140, Math.min(140, _playerGroup.position.z));

    // Turret follows mouse
    _turretYaw   += (_mouseX * 1.5 - _turretYaw) * 0.1;
    _barrelPitch += (_mouseY * 20 - _barrelPitch) * 0.1;
    _barrelPitch  = Math.max(-20, Math.min(20, _barrelPitch));
    _playerTurret.rotation.y = _turretYaw;
    _playerBarrel.rotation.x = _barrelPitch * Math.PI / 180;

    // Hull-down check
    updateHullDown();

    // Crush trees
    for (var ti = 0; ti < _trees.length; ti++) {
      var tr = _trees[ti];
      if (!tr.alive) continue;
      var td = _playerGroup.position.distanceTo(tr.mesh.position);
      if (td < 3) {
        tr.alive = false;
        _scene.remove(tr.mesh);
      }
    }

    // Wheel spin animation
    var spinRate = _playerSpeed * dt * 2;
    for (var wi = 0; wi < _playerWheels.length; wi++) {
      _playerWheels[wi].rotation.y += spinRate;
    }

    // Camera follow
    if (_camera) {
      var camOffset = new THREE.Vector3(0, 12, 22);
      camOffset.applyEuler(new THREE.Euler(0, _playerYaw, 0));
      _camera.position.copy(_playerGroup.position).add(camOffset);
      _camera.lookAt(_playerGroup.position);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SMOKE CLOUD UPDATE
  ═══════════════════════════════════════════════════════════════════════ */

  function updateSmokeClouds(dt) {
    for (var si = _smokeClouds.length - 1; si >= 0; si--) {
      var sc = _smokeClouds[si];
      sc.life -= dt;
      sc.mesh.material.opacity = Math.max(0, sc.life / 12 * 0.6);
      if (sc.life <= 0) {
        _scene.remove(sc.mesh);
        _smokeClouds.splice(si, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ARTILLERY UPDATE
  ═══════════════════════════════════════════════════════════════════════ */

  function updateArtillery(dt) {
    if (_artyCooldown > 0) _artyCooldown -= dt;
    if (_artyPending) {
      _artyTimer -= dt;
      if (_artyTimer <= 0) {
        resolveArtillery();
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RELOAD UPDATE
  ═══════════════════════════════════════════════════════════════════════ */

  function updateReload(dt) {
    if (_reloadTimer > 0) _reloadTimer -= dt;
    if (_reloadTimer < 0) _reloadTimer = 0;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════ */

  function updateHUD() {
    if (!_hudEl) return;
    var ammoName = _currentAmmo === AMMO_AP ? 'AP' : (_currentAmmo === AMMO_HEAT ? 'HEAT' : 'SMOKE');
    var ammoCount = _currentAmmo === AMMO_AP ? '∞' : (_currentAmmo === AMMO_HEAT ? _ammoHEAT : _ammoSmoke);
    var allyCount = 0;
    for (var ai = 0; ai < _allies.length; ai++) {
      if (_allies[ai].alive) allyCount++;
    }
    var enemyCount = 0;
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (_enemies[ei].alive) enemyCount++;
    }
    var reloadStr = _reloadTimer > 0 ? _reloadTimer.toFixed(1) + 's' : 'RDY';
    var hdStr = _inHullDown ? ' [HULL-DOWN]' : '';
    var artyStr = _artyCooldown > 0 ? ' [ARTY: ' + Math.ceil(_artyCooldown) + 's]' : ' [ARTY: RDY]';
    var allyTimerStr = _allyTimer > 0 ? ' [ALLY TIMER: ' + Math.ceil(_allyTimer) + 's]' : '';

    _hudEl.textContent =
      'BATTALION' + hdStr +
      ' [HULL: ' + Math.max(0, Math.ceil(_playerHullHP)) + ']' +
      ' [TURRET: ' + Math.max(0, Math.ceil(_playerTurretHP)) + ']' +
      ' [AMMO: ' + ammoName + ' ' + ammoCount + ']' +
      ' [ALLIES: ' + allyCount + ']' +
      ' [ENEMIES: ' + enemyCount + '/8]' +
      ' | RELOAD: ' + reloadStr +
      artyStr + allyTimerStr;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     VICTORY / DEFEAT
  ═══════════════════════════════════════════════════════════════════════ */

  function checkVictory() {
    var surviving = 0;
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (_enemies[ei].alive) surviving++;
    }
    if (surviving === 0 && !_missionClear) {
      _missionClear = true;
      var timeBonus = Math.max(0, 600 - Math.floor(_elapsedTime));
      var allyBonus = _alliesLost === 0 ? 500 : 0;
      if (_hudEl) {
        _hudEl.textContent =
          'MISSION COMPLETE! All enemy tanks destroyed! ' +
          'Ally bonus: +' + allyBonus + ' | Time bonus: +' + timeBonus +
          ' | Total: ' + (allyBonus + timeBonus);
      }
    }
  }

  function gameOver(playerWon) {
    _missionClear = true;
    if (_hudEl) {
      _hudEl.textContent = playerWon ? 'VICTORY!' : 'TANK DESTROYED — MISSION FAILED';
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     KEYBOARD / MOUSE EVENTS
  ═══════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var key = e.key;
    _keys[key] = true;

    // Activation check: T + B within 400ms
    if (key === 't' || key === 'T') _tKeyTime = Date.now();
    if (key === 'b' || key === 'B') _bKeyTime = Date.now();

    var tAge = Date.now() - _tKeyTime;
    var bAge = Date.now() - _bKeyTime;
    if (_tKeyTime > 0 && _bKeyTime > 0 && tAge < ACTIVATION_WINDOW && bAge < ACTIVATION_WINDOW && !_active) {
      _tKeyTime = 0;
      _bKeyTime = 0;
      activate();
      return;
    }

    if (!_active) return;

    // SPACE = fire
    if (key === ' ') {
      e.preventDefault();
      firePlayerShell();
    }

    // TAB = cycle ammo
    if (key === 'Tab') {
      e.preventDefault();
      _currentAmmo = (_currentAmmo + 1) % 3;
    }

    // F = artillery
    if (key === 'f' || key === 'F') {
      callArtillery();
    }

    // G = allies
    if (key === 'g' || key === 'G') {
      callAllies();
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
  }

  function onMouseMove(e) {
    if (!_active) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    _mouseX = (e.clientX / w - 0.5) * 2;
    _mouseY = -(e.clientY / h - 0.5) * 2;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ACTIVATE / RESET
  ═══════════════════════════════════════════════════════════════════════ */

  function activate() {
    if (_active) return;
    _active = true;
    reset();
  }

  function reset() {
    // Clear old objects
    if (_playerGroup && _scene) _scene.remove(_playerGroup);
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (_scene) _scene.remove(_enemies[ei].group);
    }
    for (var ai = 0; ai < _allies.length; ai++) {
      if (_scene) _scene.remove(_allies[ai].group);
    }
    for (var si = 0; si < _shells.length; si++) {
      if (_scene) _scene.remove(_shells[si].mesh);
    }
    for (var ci = 0; ci < _craters.length; ci++) {
      if (_scene) _scene.remove(_craters[ci]);
    }
    for (var sci = 0; sci < _smokeClouds.length; sci++) {
      if (_scene) _scene.remove(_smokeClouds[sci].mesh);
    }
    for (var aii = 0; aii < _artyIndicators.length; aii++) {
      if (_scene) _scene.remove(_artyIndicators[aii].mesh);
    }
    for (var wi = 0; wi < _wrecks.length; wi++) {
      if (_scene) _scene.remove(_wrecks[wi]);
    }
    for (var ri = 0; ri < _ridges.length; ri++) {
      if (_scene) _scene.remove(_ridges[ri].mesh);
    }
    for (var ti = 0; ti < _trees.length; ti++) {
      if (_scene) _scene.remove(_trees[ti].mesh);
    }

    _enemies         = [];
    _allies          = [];
    _shells          = [];
    _craters         = [];
    _smokeClouds     = [];
    _artyIndicators  = [];
    _wrecks          = [];
    _ridges          = [];
    _trees           = [];

    _playerHullHP    = 400;
    _playerTurretHP  = 120;
    _currentAmmo     = AMMO_AP;
    _ammoHEAT        = 3;
    _ammoSmoke       = 2;
    _reloadTimer     = 0;
    _playerYaw       = 0;
    _playerSpeed     = 0;
    _turretYaw       = 0;
    _barrelPitch     = 0;
    _inHullDown      = false;
    _artyCooldown    = 0;
    _artyPending     = false;
    _artyTimer       = 0;
    _allyTimer       = 0;
    _alliesLost      = 0;
    _missionClear    = false;
    _startTime       = Date.now();
    _elapsedTime     = 0;

    buildBattlefield();
    spawnPlayer();
    spawnEnemies();
    updateHUD();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    // HUD element
    _hudEl = document.createElement('div');
    _hudEl.id = 'tank-battalion-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00ff44',
      'font:bold 13px monospace',
      'background:rgba(0,0,0,0.65)',
      'padding:5px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
  }

  function update(dt) {
    if (!_active || _missionClear) return;

    _elapsedTime += dt;

    updatePlayer(dt);
    updateEnemies(dt);
    updateAllies(dt);
    updateShells(dt);
    updateSmokeClouds(dt);
    updateArtillery(dt);
    updateReload(dt);
    updateHUD();

    // Show HUD when active
    if (_hudEl) _hudEl.style.display = 'block';
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
