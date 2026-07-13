/* ───────────────────────────────────────────────────────────────────────────
   naval-combat.js — Riverine & coastal naval combat
   Patrol boats, enemy gunboats, torpedoes, depth charges, naval mines,
   coastal gun emplacements, boarding/disembarking, naval HUD.

   Controls (when aboard):
     WASD      — throttle / steer boat
     E         — board / disembark
     Right-MB  — mounted MG auto-fire (150 rounds)
     G         — drop depth charge (3 s delay, underwater explosion)
     T         — fire torpedo (thin cylinder, 200 dmg, r=6 blast)

   API: window.NavalCombat = { init, update, reset }
   ─────────────────────────────────────────────────────────────────────────── */
window.NavalCombat = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var BOAT_Y              = 0.5;
  var WATER_Y             = 0.0;
  var PATROL_SPAWN_Z      = 60;      // absolute Z threshold to trigger spawn
  var PATROL_SPAWN_DIST   = 30;      // player proximity to spawn
  var BOARD_DIST          = 2;       // metres to board
  var BOAT_ACCEL          = 0.1;
  var BOAT_MAX_SPEED      = 8;
  var BOAT_TURN_RATE      = 0.02;    // rad / s
  var MG_ROUNDS_MAX       = 150;
  var MG_FIRE_RATE        = 0.08;    // s between shots
  var MG_DAMAGE           = 10;
  var DEPTH_CHARGE_MAX    = 3;
  var DEPTH_CHARGE_DELAY  = 3.0;    // seconds
  var DEPTH_CHARGE_RADIUS = 8;
  var DEPTH_CHARGE_DMG    = 180;
  var TORPEDO_SPEED       = 15;
  var TORPEDO_RANGE       = 40;
  var TORPEDO_DAMAGE      = 200;
  var TORPEDO_BLAST_R     = 6;
  var MINE_RADIUS         = 0.4;
  var MINE_DAMAGE         = 150;
  var MINE_SPACING        = 20;
  var MINE_COUNT          = 12;
  var ENEMY_SPAWN_DIST    = 60;
  var ENEMY_APPROACH_SPD  = 3.5;
  var ENEMY_FIRE_RATE     = 2.0;    // s between bursts
  var ENEMY_SHOT_DMG      = 10;
  var COASTAL_GUN_RANGE   = 50;
  var COASTAL_GUN_RATE    = 3.0;    // s between shots
  var COASTAL_GUN_DMG     = 30;
  var WAKE_LIFETIME       = 2.0;    // seconds before alpha = 0
  var WAKE_INTERVAL       = 0.15;   // spawn interval

  /* ── state ─────────────────────────────────────────────────────────────── */
  var _scene        = null;
  var _camera       = null;
  var _playerPos    = null;   // THREE.Vector3 reference from host game
  var _playerHealth = null;   // { value } reference
  var _keys         = {};
  var _mouse        = { right: false };
  var _initialized  = false;

  /* patrol boat (player) */
  var _boat = null;
  /*  _boat = {
        group, hull, wh, speed, heading,
        mgAmmo, mgCooldown, mgRightClick,
        depthCharges, torpedoCooldown,
        health, boarded
      } */
  var _boatSpawned = false;
  var _aboard      = false;
  var _boardPromptShown = false;

  /* enemy gunboat */
  var _enemyBoat = null;
  /*  _enemyBoat = {
        group, hull, speed, heading,
        health, fireCooldown, alive
      } */

  /* projectiles & effects */
  var _mgProjectiles    = [];  // { mesh, dir, dist }
  var _torpedoes        = [];  // { mesh, dir, dist, travelled }
  var _depthCharges     = [];  // { mesh, timer, exploded, pos }
  var _explosions       = [];  // { mesh, age, maxAge }
  var _wakeParticles    = [];  // { mesh, age, maxAge }
  var _wakeTimer        = 0;
  var _enemyProjectiles = [];  // { mesh, dir, dist }
  var _coastalGuns      = [];  // { group, barrel, fireCooldown, pos }
  var _mines            = [];  // { mesh, pos, active }

  /* HUD */
  var _hudEl = null;

  /* cached geometries / materials */
  var _sphereGeo  = null;
  var _wakeGeo    = null;
  var _wakeMat    = null;

  /* ── helpers ───────────────────────────────────────────────────────────── */
  function _makeColor(hex) {
    return new THREE.MeshLambertMaterial({ color: hex });
  }

  function _makeMat(hex, opts) {
    var cfg = { color: hex };
    if (opts) {
      if (opts.transparent !== undefined) cfg.transparent = opts.transparent;
      if (opts.opacity !== undefined)     cfg.opacity     = opts.opacity;
      if (opts.side !== undefined)        cfg.side        = opts.side;
      if (opts.depthWrite !== undefined)  cfg.depthWrite  = opts.depthWrite;
    }
    return new THREE.MeshLambertMaterial(cfg);
  }

  function _box(w, h, d, mat) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, mat);
  }

  function _sphere(r, mat) {
    if (!_sphereGeo) _sphereGeo = new THREE.SphereGeometry(1, 8, 8);
    var m = new THREE.Mesh(_sphereGeo, mat);
    m.scale.setScalar(r);
    return m;
  }

  function _cylinder(rt, rb, h, mat) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    return new THREE.Mesh(geo, mat);
  }

  function _dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _v3(x, y, z) { return new THREE.Vector3(x, y, z); }

  function _clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }

  function _degFromRad(r) {
    var d = (r * 180 / Math.PI) % 360;
    return d < 0 ? d + 360 : d;
  }

  /* ── HUD ────────────────────────────────────────────────────────────────── */
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'naval-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,10,0.75)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 14px',
      'border:1px solid #00ff88',
      'border-radius:4px',
      'display:none',
      'pointer-events:none',
      'z-index:9999'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_aboard || !_boat) {
      _hudEl.style.display = 'none';
      return;
    }
    _hudEl.style.display = 'block';
    var spd     = Math.abs(_boat.speed).toFixed(1);
    var heading = Math.round(_degFromRad(_boat.heading));
    var ammo    = _boat.mgAmmo;
    var dc      = _boat.depthCharges;
    _hudEl.textContent = '⚓ SPEED: ' + spd + ' | HEADING: ' + heading + '° | AMMO: ' + ammo + ' | DEPTH CHARGES: ' + dc;
  }

  function _showPrompt(msg) {
    var el = document.getElementById('naval-prompt');
    if (!el) {
      el = document.createElement('div');
      el.id = 'naval-prompt';
      el.style.cssText = [
        'position:fixed',
        'top:40%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'background:rgba(0,0,0,0.6)',
        'color:#fff',
        'font-family:monospace',
        'font-size:16px',
        'padding:8px 20px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:9998'
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  /* ── boat builder ───────────────────────────────────────────────────────── */
  function _buildBoatGroup(isEnemy) {
    var grp   = new THREE.Group();
    var color = isEnemy ? 0x4A1010 : 0x2D3A1E;
    var whColor = isEnemy ? 0x5A2020 : 0x3D4A2E;

    /* hull  — 6 × 1 × 2.5, tapered by scaling bow / stern */
    var hullMat = _makeColor(color);
    var hull = _box(6, 1, 2.5, hullMat);
    hull.position.y = 0;
    grp.add(hull);

    /* bow taper (front) */
    var bowMat = _makeColor(color);
    var bow = _box(1.5, 0.9, 2.0, bowMat);
    bow.position.set(3.3, 0, 0);
    bow.scale.x = 0.5;
    grp.add(bow);

    /* stern taper (back) */
    var sternMat = _makeColor(color);
    var stern = _box(1.5, 0.8, 2.0, sternMat);
    stern.position.set(-3.3, 0, 0);
    stern.scale.x = 0.5;
    grp.add(stern);

    /* wheelhouse — 1.5 × 1 × 1.5 */
    var whMat = _makeColor(whColor);
    var wh = _box(1.5, 1, 1.5, whMat);
    wh.position.set(-1, 1, 0);
    grp.add(wh);

    /* mounted MG barrel */
    var mgMat = _makeColor(0x222222);
    var mgBarrel = _cylinder(0.05, 0.05, 1.2, mgMat);
    mgBarrel.rotation.z = Math.PI / 2;
    mgBarrel.position.set(1.5, 1.2, 0);
    grp.add(mgBarrel);

    return { group: grp, hull: hull };
  }

  /* ── patrol boat spawn ──────────────────────────────────────────────────── */
  function _spawnPatrolBoat() {
    var built   = _buildBoatGroup(false);
    var grp     = built.group;
    var spawnZ  = (_playerPos.z > 0) ? PATROL_SPAWN_Z : -PATROL_SPAWN_Z;

    grp.position.set(_playerPos.x, BOAT_Y, spawnZ);
    _scene.add(grp);

    _boat = {
      group:        grp,
      hull:         built.hull,
      speed:        0,
      heading:      0,   // radians, 0 = +X direction
      mgAmmo:       MG_ROUNDS_MAX,
      mgCooldown:   0,
      depthCharges: DEPTH_CHARGE_MAX,
      torpedoCooldown: 0,
      health:       400,
      alive:        true
    };
    _boatSpawned = true;
  }

  /* ── enemy gunboat spawn ────────────────────────────────────────────────── */
  function _spawnEnemyBoat() {
    if (_enemyBoat) return;
    var built = _buildBoatGroup(true);
    var grp   = built.group;
    var bpos  = _boat ? _boat.group.position : _v3(0, BOAT_Y, 0);
    var angle = Math.random() * Math.PI * 2;
    grp.position.set(
      bpos.x + Math.cos(angle) * ENEMY_SPAWN_DIST,
      BOAT_Y,
      bpos.z + Math.sin(angle) * ENEMY_SPAWN_DIST
    );
    _scene.add(grp);

    _enemyBoat = {
      group:       grp,
      speed:       ENEMY_APPROACH_SPD,
      heading:     0,
      health:      300,
      fireCooldown: 1.0,
      alive:        true
    };
  }

  /* ── coastal gun emplacements ───────────────────────────────────────────── */
  function _spawnCoastalGun(x, z) {
    var grp     = new THREE.Group();
    var baseMat = _makeColor(0x5C4A2A);
    var base    = _box(2, 0.8, 2, baseMat);
    base.position.y = 0.4;
    grp.add(base);

    var turretMat = _makeColor(0x3A3A3A);
    var turret = _box(1.2, 0.8, 1.2, turretMat);
    turret.position.y = 1.2;
    grp.add(turret);

    var barrelMat = _makeColor(0x222222);
    var barrel = _cylinder(0.1, 0.1, 2.5, barrelMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(1.5, 1.5, 0);
    grp.add(barrel);

    grp.position.set(x, 0, z);
    _scene.add(grp);

    _coastalGuns.push({
      group:       grp,
      barrel:      barrel,
      fireCooldown: Math.random() * COASTAL_GUN_RATE,
      pos:          _v3(x, 1.5, z)
    });
  }

  /* ── mine field ─────────────────────────────────────────────────────────── */
  function _spawnMines() {
    var mineMat = _makeMat(0xFF0000, { transparent: true, opacity: 0.85 });
    for (var i = 0; i < MINE_COUNT; i++) {
      var mx = (Math.random() - 0.5) * MINE_SPACING * 6;
      var mz = (Math.random() - 0.5) * MINE_SPACING * 6;
      var ms = _sphere(MINE_RADIUS, mineMat);
      ms.position.set(mx, WATER_Y + MINE_RADIUS, mz);
      _scene.add(ms);
      _mines.push({ mesh: ms, pos: ms.position.clone(), active: true });
    }
  }

  /* ── wake / foam ─────────────────────────────────────────────────────────── */
  function _spawnWake(pos, heading) {
    if (!_wakeGeo) {
      _wakeGeo = new THREE.PlaneGeometry(1.0, 0.3);
    }
    if (!_wakeMat) {
      _wakeMat = new THREE.MeshBasicMaterial({
        color:       0xffffff,
        transparent: true,
        opacity:     0.6,
        side:        THREE.DoubleSide,
        depthWrite:  false
      });
    }

    var offsets = [0.8, -0.8];
    for (var i = 0; i < offsets.length; i++) {
      var mat  = _wakeMat.clone();
      var mesh = new THREE.Mesh(_wakeGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      var side = offsets[i];
      var wx   = pos.x - Math.cos(heading) * 3.5 + Math.sin(heading) * side;
      var wz   = pos.z - Math.sin(heading) * 3.5 - Math.cos(heading) * side;
      mesh.position.set(wx, WATER_Y + 0.02, wz);
      mesh.rotation.z = heading;
      _scene.add(mesh);
      _wakeParticles.push({ mesh: mesh, age: 0, maxAge: WAKE_LIFETIME });
    }
  }

  /* ── explosion visual ────────────────────────────────────────────────────── */
  function _spawnExplosion(pos, radius) {
    var mat  = _makeMat(0xFF6600, { transparent: true, opacity: 0.85 });
    var mesh = _sphere(radius, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    _explosions.push({ mesh: mesh, age: 0, maxAge: 0.5 });

    /* inner white flash */
    var imat  = _makeMat(0xFFFFFF, { transparent: true, opacity: 1.0 });
    var imesh = _sphere(radius * 0.5, imat);
    imesh.position.copy(pos);
    _scene.add(imesh);
    _explosions.push({ mesh: imesh, age: 0, maxAge: 0.25 });
  }

  /* ── MG fire (from player boat) ──────────────────────────────────────────── */
  function _fireMG() {
    if (!_boat || _boat.mgAmmo <= 0) return;
    _boat.mgAmmo--;
    var dir = _v3(Math.cos(_boat.heading), 0, Math.sin(_boat.heading));
    var projMat = _makeColor(0xFFFF00);
    var projGeo = new THREE.SphereGeometry(0.06, 4, 4);
    var proj    = new THREE.Mesh(projGeo, projMat);
    var bpos    = _boat.group.position;
    proj.position.set(bpos.x + dir.x * 3.5, BOAT_Y + 1.2, bpos.z + dir.z * 3.5);
    _scene.add(proj);
    _mgProjectiles.push({ mesh: proj, dir: dir.clone(), dist: 0 });
  }

  /* ── torpedo fire ───────────────────────────────────────────────────────── */
  function _fireTorpedo() {
    if (!_boat || !_aboard) return;
    var dir = _v3(Math.cos(_boat.heading), 0, Math.sin(_boat.heading));
    var torpMat = _makeColor(0xFF4400);
    var torpGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
    var torp    = new THREE.Mesh(torpGeo, torpMat);
    torp.rotation.z = Math.PI / 2;
    var bpos = _boat.group.position;
    torp.position.set(bpos.x + dir.x * 4, BOAT_Y, bpos.z + dir.z * 4);
    torp.rotation.y = -_boat.heading;
    _scene.add(torp);
    _torpedoes.push({ mesh: torp, dir: dir.clone(), dist: 0, travelled: 0 });
  }

  /* ── depth charge drop ──────────────────────────────────────────────────── */
  function _dropDepthCharge() {
    if (!_boat || _boat.depthCharges <= 0 || !_aboard) return;
    _boat.depthCharges--;
    var dcMat = _makeColor(0x445566);
    var dcMesh = _cylinder(0.3, 0.3, 0.8, dcMat);
    var bpos   = _boat.group.position;
    dcMesh.position.set(bpos.x - Math.cos(_boat.heading) * 3.5, WATER_Y, bpos.z - Math.sin(_boat.heading) * 3.5);
    _scene.add(dcMesh);
    _depthCharges.push({
      mesh:     dcMesh,
      timer:    DEPTH_CHARGE_DELAY,
      exploded: false,
      pos:      dcMesh.position.clone()
    });
  }

  /* ── coastal gun fire ───────────────────────────────────────────────────── */
  function _coastalGunFire(gun, target) {
    var dir = target.clone().sub(gun.pos).normalize();
    var projMat = _makeColor(0xFF8800);
    var projGeo = new THREE.SphereGeometry(0.12, 6, 6);
    var proj    = new THREE.Mesh(projGeo, projMat);
    proj.position.copy(gun.pos);
    _scene.add(proj);
    /* re-use enemy projectiles list (same logic) */
    _enemyProjectiles.push({ mesh: proj, dir: dir.clone(), dist: 0 });
  }

  /* ── boarding ───────────────────────────────────────────────────────────── */
  function _tryBoard() {
    if (!_boat || !_boat.alive) return;
    if (_aboard) {
      /* disembark — teleport player to nearest shore edge */
      _aboard = false;
      if (_playerPos) {
        var spawnZ = (_boat.group.position.z > 0) ? PATROL_SPAWN_Z + 4 : -PATROL_SPAWN_Z - 4;
        _playerPos.set(_boat.group.position.x, 0, spawnZ);
      }
      /* restore camera from boat */
      if (_camera) {
        _camera.position.set(
          _boat.group.position.x,
          _playerPos ? _playerPos.y + 1.7 : 1.7,
          (_boat.group.position.z > 0) ? PATROL_SPAWN_Z + 4 : -PATROL_SPAWN_Z - 4
        );
      }
      _showPrompt('');
      return;
    }
    if (!_playerPos) return;
    var d = _dist2(_playerPos, _boat.group.position);
    if (d < BOARD_DIST) {
      _aboard = true;
      _showPrompt('');
      if (!_enemyBoat) {
        _spawnEnemyBoat();
      }
    }
  }

  /* ── damage application ─────────────────────────────────────────────────── */
  function _damagePlayer(amount) {
    if (_playerHealth) {
      _playerHealth.value = Math.max(0, _playerHealth.value - amount);
    }
  }

  function _damageBoat(amount) {
    if (!_boat) return;
    _boat.health -= amount;
    if (_boat.health <= 0 && _boat.alive) {
      _boat.alive = false;
      _spawnExplosion(_boat.group.position.clone(), 5);
      _scene.remove(_boat.group);
      if (_aboard) {
        _aboard = false;
        if (_playerPos) {
          _playerPos.set(_boat.group.position.x, 0, PATROL_SPAWN_Z + 8);
        }
      }
    }
  }

  function _damageEnemyBoat(amount) {
    if (!_enemyBoat || !_enemyBoat.alive) return;
    _enemyBoat.health -= amount;
    if (_enemyBoat.health <= 0) {
      _enemyBoat.alive = false;
      _spawnExplosion(_enemyBoat.group.position.clone(), 5);
      _scene.remove(_enemyBoat.group);
    }
  }

  /* ── input handlers ─────────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    _keys[e.code] = true;
    if (e.code === 'KeyE') {
      _tryBoard();
    }
    if (e.code === 'KeyG' && _aboard) {
      _dropDepthCharge();
    }
    if (e.code === 'KeyT' && _aboard) {
      _fireTorpedo();
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _onMouseDown(e) {
    if (e.button === 2) _mouse.right = true;
  }

  function _onMouseUp(e) {
    if (e.button === 2) _mouse.right = false;
  }

  /* ── update helpers ─────────────────────────────────────────────────────── */
  function _updateBoatPhysics(dt) {
    if (!_boat || !_boat.alive || !_aboard) return;

    /* throttle */
    if (_keys['KeyW']) {
      _boat.speed = Math.min(_boat.speed + BOAT_ACCEL, BOAT_MAX_SPEED);
    } else if (_keys['KeyS']) {
      _boat.speed = Math.max(_boat.speed - BOAT_ACCEL, -BOAT_MAX_SPEED * 0.4);
    } else {
      /* drag */
      _boat.speed *= 0.98;
      if (Math.abs(_boat.speed) < 0.01) _boat.speed = 0;
    }

    /* steering */
    if (_keys['KeyA']) {
      _boat.heading -= BOAT_TURN_RATE;
    }
    if (_keys['KeyD']) {
      _boat.heading += BOAT_TURN_RATE;
    }

    /* move */
    _boat.group.position.x += Math.cos(_boat.heading) * _boat.speed * dt;
    _boat.group.position.z += Math.sin(_boat.heading) * _boat.speed * dt;
    _boat.group.position.y  = BOAT_Y;  // lock to water surface

    /* rotate mesh */
    _boat.group.rotation.y = -_boat.heading;

    /* attach camera to boat when aboard */
    if (_camera) {
      _camera.position.set(
        _boat.group.position.x - Math.cos(_boat.heading) * 8,
        BOAT_Y + 4,
        _boat.group.position.z - Math.sin(_boat.heading) * 8
      );
      _camera.lookAt(_boat.group.position);
    }

    /* keep player position in sync */
    if (_playerPos) {
      _playerPos.copy(_boat.group.position);
      _playerPos.y = BOAT_Y;
    }
  }

  function _updateWake(dt) {
    if (!_boat || !_boat.alive || !_aboard) return;
    _wakeTimer -= dt;
    if (_wakeTimer <= 0 && Math.abs(_boat.speed) > 0.5) {
      _spawnWake(_boat.group.position, _boat.heading);
      _wakeTimer = WAKE_INTERVAL;
    }
    for (var i = _wakeParticles.length - 1; i >= 0; i--) {
      var wp = _wakeParticles[i];
      wp.age += dt;
      var frac = wp.age / wp.maxAge;
      wp.mesh.material.opacity = 0.6 * (1 - frac);
      if (wp.age >= wp.maxAge) {
        _scene.remove(wp.mesh);
        _wakeParticles.splice(i, 1);
      }
    }
  }

  function _updateMG(dt) {
    if (!_boat || !_aboard) return;
    if (_boat.mgCooldown > 0) _boat.mgCooldown -= dt;
    if (_mouse.right && _boat.mgAmmo > 0 && _boat.mgCooldown <= 0) {
      _fireMG();
      _boat.mgCooldown = MG_FIRE_RATE;
    }

    var MG_PROJ_SPEED = 60;
    var MG_RANGE      = 80;
    for (var i = _mgProjectiles.length - 1; i >= 0; i--) {
      var p  = _mgProjectiles[i];
      var ds = MG_PROJ_SPEED * dt;
      p.mesh.position.x += p.dir.x * ds;
      p.mesh.position.z += p.dir.z * ds;
      p.dist += ds;

      var hit = false;
      /* check enemy boat */
      if (_enemyBoat && _enemyBoat.alive) {
        if (_dist2(p.mesh.position, _enemyBoat.group.position) < 2.5) {
          _damageEnemyBoat(MG_DAMAGE);
          hit = true;
        }
      }

      if (p.dist > MG_RANGE || hit) {
        _scene.remove(p.mesh);
        _mgProjectiles.splice(i, 1);
      }
    }
  }

  function _updateTorpedoes(dt) {
    for (var i = _torpedoes.length - 1; i >= 0; i--) {
      var t  = _torpedoes[i];
      var ds = TORPEDO_SPEED * dt;
      t.mesh.position.x += t.dir.x * ds;
      t.mesh.position.z += t.dir.z * ds;
      t.travelled += ds;

      var hit = false;
      /* check enemy boat */
      if (_enemyBoat && _enemyBoat.alive) {
        if (_dist2(t.mesh.position, _enemyBoat.group.position) < 3) {
          _spawnExplosion(t.mesh.position.clone(), TORPEDO_BLAST_R);
          _damageEnemyBoat(TORPEDO_DAMAGE);
          hit = true;
        }
      }
      /* check mines */
      for (var m = 0; m < _mines.length; m++) {
        if (_mines[m].active && _dist2(t.mesh.position, _mines[m].pos) < MINE_RADIUS + 0.3) {
          _spawnExplosion(_mines[m].pos.clone(), 4);
          _mines[m].active = false;
          _scene.remove(_mines[m].mesh);
          hit = true;
          break;
        }
      }

      if (t.travelled > TORPEDO_RANGE || hit) {
        if (!hit) {
          _spawnExplosion(t.mesh.position.clone(), 2);
        }
        _scene.remove(t.mesh);
        _torpedoes.splice(i, 1);
      }
    }
  }

  function _updateDepthCharges(dt) {
    for (var i = _depthCharges.length - 1; i >= 0; i--) {
      var dc = _depthCharges[i];
      dc.timer -= dt;
      /* sink below water */
      dc.mesh.position.y = Math.max(dc.mesh.position.y - dt * 1.5, -6);

      if (dc.timer <= 0 && !dc.exploded) {
        dc.exploded = true;
        _spawnExplosion(_v3(dc.pos.x, -3, dc.pos.z), DEPTH_CHARGE_RADIUS);
        /* damage nearby boats */
        if (_enemyBoat && _enemyBoat.alive && _dist2(dc.pos, _enemyBoat.group.position) < DEPTH_CHARGE_RADIUS * 2) {
          _damageEnemyBoat(DEPTH_CHARGE_DMG);
        }
        _scene.remove(dc.mesh);
        _depthCharges.splice(i, 1);
      }
    }
  }

  function _updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.age += dt;
      var frac = ex.age / ex.maxAge;
      ex.mesh.scale.setScalar(1 + frac * 1.5);
      ex.mesh.material.opacity = 0.85 * (1 - frac);
      if (ex.age >= ex.maxAge) {
        _scene.remove(ex.mesh);
        _explosions.splice(i, 1);
      }
    }
  }

  function _updateEnemyBoat(dt) {
    if (!_enemyBoat || !_enemyBoat.alive) return;
    var target = _boat && _boat.alive ? _boat.group.position : (_playerPos || _v3(0, 0, 0));

    /* steer toward target */
    var dx      = target.x - _enemyBoat.group.position.x;
    var dz      = target.z - _enemyBoat.group.position.z;
    var desired = Math.atan2(dz, dx);
    var diff    = desired - _enemyBoat.heading;
    /* normalize to [-pi, pi] */
    while (diff > Math.PI)  diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    _enemyBoat.heading += _clamp(diff, -BOAT_TURN_RATE * 2, BOAT_TURN_RATE * 2);

    /* move */
    _enemyBoat.group.position.x += Math.cos(_enemyBoat.heading) * _enemyBoat.speed * dt;
    _enemyBoat.group.position.z += Math.sin(_enemyBoat.heading) * _enemyBoat.speed * dt;
    _enemyBoat.group.position.y  = BOAT_Y;
    _enemyBoat.group.rotation.y  = -_enemyBoat.heading;

    /* fire at player boat */
    _enemyBoat.fireCooldown -= dt;
    if (_enemyBoat.fireCooldown <= 0) {
      _enemyBoat.fireCooldown = ENEMY_FIRE_RATE;
      var dist = _dist2(_enemyBoat.group.position, target);
      if (dist < 60) {
        var dir = _v3(dx, 0, dz).normalize();
        var projMat = _makeColor(0xFF2200);
        var projGeo = new THREE.SphereGeometry(0.1, 5, 5);
        var proj    = new THREE.Mesh(projGeo, projMat);
        proj.position.copy(_enemyBoat.group.position);
        proj.position.y = BOAT_Y + 1;
        _scene.add(proj);
        _enemyProjectiles.push({ mesh: proj, dir: dir.clone(), dist: 0 });
      }
    }

    /* mine collision */
    for (var m = 0; m < _mines.length; m++) {
      if (_mines[m].active && _dist2(_enemyBoat.group.position, _mines[m].pos) < MINE_RADIUS + 2) {
        _spawnExplosion(_mines[m].pos.clone(), 5);
        _damageEnemyBoat(MINE_DAMAGE);
        _mines[m].active = false;
        _scene.remove(_mines[m].mesh);
        break;
      }
    }
  }

  function _updateEnemyProjectiles(dt) {
    var EPROJ_SPEED = 20;
    var EPROJ_RANGE = 80;
    for (var i = _enemyProjectiles.length - 1; i >= 0; i--) {
      var p  = _enemyProjectiles[i];
      var ds = EPROJ_SPEED * dt;
      p.mesh.position.x += p.dir.x * ds;
      p.mesh.position.z += p.dir.z * ds;
      p.dist += ds;

      var hit = false;
      /* hit player boat */
      if (_boat && _boat.alive && _dist2(p.mesh.position, _boat.group.position) < 3) {
        _damageBoat(ENEMY_SHOT_DMG);
        if (_aboard) _damagePlayer(ENEMY_SHOT_DMG * 0.3);
        hit = true;
      }
      /* hit player directly */
      if (!hit && _playerPos && !_aboard && _dist2(p.mesh.position, _playerPos) < 1) {
        _damagePlayer(ENEMY_SHOT_DMG);
        hit = true;
      }

      if (p.dist > EPROJ_RANGE || hit) {
        _scene.remove(p.mesh);
        _enemyProjectiles.splice(i, 1);
      }
    }
  }

  function _updateCoastalGuns(dt) {
    for (var g = 0; g < _coastalGuns.length; g++) {
      var gun    = _coastalGuns[g];
      gun.fireCooldown -= dt;

      /* find closest boat */
      var target  = null;
      var closest = Infinity;

      if (_boat && _boat.alive) {
        var d = _dist2(gun.pos, _boat.group.position);
        if (d < closest && d < COASTAL_GUN_RANGE) { closest = d; target = _boat.group.position; }
      }
      if (_enemyBoat && _enemyBoat.alive) {
        var de = _dist2(gun.pos, _enemyBoat.group.position);
        if (de < closest && de < COASTAL_GUN_RANGE) { closest = de; target = _enemyBoat.group.position; }
      }

      if (target && gun.fireCooldown <= 0) {
        gun.fireCooldown = COASTAL_GUN_RATE;
        _coastalGunFire(gun, target);
      }

      /* aim barrel toward target */
      if (target) {
        var dx = target.x - gun.pos.x;
        var dz = target.z - gun.pos.z;
        var ang = Math.atan2(dz, dx);
        gun.group.rotation.y = -ang;
      }
    }
  }

  function _updateMineCollision() {
    if (!_boat || !_boat.alive) return;
    for (var m = 0; m < _mines.length; m++) {
      if (!_mines[m].active) continue;
      if (_dist2(_boat.group.position, _mines[m].pos) < MINE_RADIUS + 2.5) {
        _spawnExplosion(_mines[m].pos.clone(), 5);
        _damageBoat(MINE_DAMAGE);
        if (_aboard) _damagePlayer(MINE_DAMAGE * 0.5);
        _mines[m].active = false;
        _scene.remove(_mines[m].mesh);
      }
    }
  }

  function _checkSpawnTrigger() {
    if (_boatSpawned || !_playerPos) return;
    var nearNorth = Math.abs(_playerPos.z - PATROL_SPAWN_Z)  < PATROL_SPAWN_DIST;
    var nearSouth = Math.abs(_playerPos.z + PATROL_SPAWN_Z)  < PATROL_SPAWN_DIST;
    if (nearNorth || nearSouth) {
      _spawnPatrolBoat();
    }
  }

  function _updateBoardPrompt() {
    if (!_boat || !_boat.alive || _aboard || !_playerPos) {
      if (!_aboard) _showPrompt('');
      return;
    }
    var d = _dist2(_playerPos, _boat.group.position);
    if (d < BOARD_DIST + 1.5) {
      _showPrompt('Press [E] to board patrol boat');
    } else {
      _showPrompt('');
    }
  }

  /* ── public API ─────────────────────────────────────────────────────────── */
  function init(scene, camera, playerPos, playerHealth) {
    if (_initialized) return;
    _initialized  = true;
    _scene        = scene;
    _camera       = camera;
    _playerPos    = playerPos;
    _playerHealth = playerHealth;

    _createHUD();
    _spawnMines();

    /* coastal gun emplacements on shore */
    _spawnCoastalGun( 20, 70);
    _spawnCoastalGun(-30, 70);
    _spawnCoastalGun( 10, -70);

    /* input */
    window.addEventListener('keydown',   _onKeyDown);
    window.addEventListener('keyup',     _onKeyUp);
    window.addEventListener('mousedown', _onMouseDown);
    window.addEventListener('mouseup',   _onMouseUp);
  }

  function update(dt) {
    if (!_initialized) return;

    _checkSpawnTrigger();
    _updateBoatPhysics(dt);
    _updateWake(dt);
    _updateMG(dt);
    _updateTorpedoes(dt);
    _updateDepthCharges(dt);
    _updateExplosions(dt);
    _updateEnemyBoat(dt);
    _updateEnemyProjectiles(dt);
    _updateCoastalGuns(dt);
    _updateMineCollision();
    _updateBoardPrompt();
    _updateHUD();
  }

  function reset() {
    /* remove all scene objects */
    var i;
    if (_boat) { _scene.remove(_boat.group); _boat = null; }
    if (_enemyBoat) { _scene.remove(_enemyBoat.group); _enemyBoat = null; }
    for (i = 0; i < _mgProjectiles.length;    i++) _scene.remove(_mgProjectiles[i].mesh);
    for (i = 0; i < _torpedoes.length;         i++) _scene.remove(_torpedoes[i].mesh);
    for (i = 0; i < _depthCharges.length;      i++) _scene.remove(_depthCharges[i].mesh);
    for (i = 0; i < _explosions.length;        i++) _scene.remove(_explosions[i].mesh);
    for (i = 0; i < _wakeParticles.length;     i++) _scene.remove(_wakeParticles[i].mesh);
    for (i = 0; i < _enemyProjectiles.length;  i++) _scene.remove(_enemyProjectiles[i].mesh);
    for (i = 0; i < _coastalGuns.length;       i++) _scene.remove(_coastalGuns[i].group);
    for (i = 0; i < _mines.length;             i++) _scene.remove(_mines[i].mesh);

    _mgProjectiles    = [];
    _torpedoes        = [];
    _depthCharges     = [];
    _explosions       = [];
    _wakeParticles    = [];
    _enemyProjectiles = [];
    _coastalGuns      = [];
    _mines            = [];

    _boatSpawned = false;
    _aboard      = false;
    _keys        = {};
    _mouse       = { right: false };
    _wakeTimer   = 0;
    _sphereGeo   = null;
    _wakeGeo     = null;
    _wakeMat     = null;
    _initialized = false;

    if (_hudEl)  { _hudEl.style.display = 'none'; }
    _showPrompt('');

    window.removeEventListener('keydown',   _onKeyDown);
    window.removeEventListener('keyup',     _onKeyUp);
    window.removeEventListener('mousedown', _onMouseDown);
    window.removeEventListener('mouseup',   _onMouseUp);
  }

  return { init: init, update: update, reset: reset };
}());
