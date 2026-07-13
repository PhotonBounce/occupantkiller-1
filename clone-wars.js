/* ============================================================
 *  CLONE-WARS.JS — FPS Clone Army Module
 *  Activation: C + W simultaneous keypress (within 400ms)
 *  Player fights alongside 10 friendly clones vs 10 enemy clones,
 *  3 commanders, and 1 Alpha boss.
 *  Z = sync nearest clone (mirror player 10s, 25s CD)
 *  X = command all clones to focus nearest enemy
 *  E = enter supply depot (health + ammo)
 *  Win: kill the Alpha. Lose: player dies with no promotable clone.
 * ============================================================ */
window.CloneWars = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────── */
  var MAX_FRIENDLY_CLONES = 10;
  var MAX_ENEMY_CLONES    = 10;
  var MAX_COMMANDERS      = 3;
  var CLONE_HP            = 100;
  var CLONE_SPEED         = 4.0;
  var CLONE_DMG           = 15;
  var CLONE_COOLDOWN      = 1.0;    // seconds between shots
  var CLONE_RANGE         = 20;
  var ENEMY_HP            = 100;
  var ENEMY_SPEED         = 3.5;
  var ENEMY_DMG           = 15;
  var CMD_HP              = 200;
  var CMD_BUFF_RADIUS     = 6;
  var CMD_DMG_BOOST       = 0.10;
  var ALPHA_HP            = 500;
  var ALPHA_SPEED         = 3.0;
  var ALPHA_DMG           = 30;
  var VAT_RESPAWN_TIME    = 30.0;
  var VAT_ENEMY_HP        = 150;
  var SYNC_DURATION       = 10.0;
  var SYNC_COOLDOWN       = 25.0;
  var MUTATION_INTERVAL   = 90.0;
  var BOOST_DURATION      = 30.0;
  var SURGE_COUNT         = 5;
  var RAMPAGE_DURATION    = 10.0;
  var PLAYER_HP           = 100;
  var KEY_WINDOW          = 0.4;    // 400ms for C+W chord
  var FIRE_RANGE          = 30;

  /* ── Module state ───────────────────────────────────────── */
  var _active       = false;
  var _initialized  = false;
  var _scene        = null;
  var _camera       = null;
  var _playerPos    = null;   // THREE.Vector3 reference from host
  var _playerHP     = PLAYER_HP;
  var _playerDead   = false;
  var _promoted     = false;  // one-time promotion used

  /* Clone arrays */
  var _friendlyClones = [];   // {mesh, hp, dead, respawnTimer, syncTarget, vatIndex, shootCd, pathBuf}
  var _enemyClones    = [];   // {mesh, hp, dead, isCommander, isAlpha, shootCd, buffed}
  var _friendlyVats   = [];   // {mesh, glowMesh, respawnQueue:[{cloneIdx,timer}]}
  var _enemyVats      = [];   // {mesh, hp, dead}

  /* Battlefield objects */
  var _barriers     = [];
  var _depot        = null;
  var _depotUsed    = false;
  var _alpha        = null;   // ref into _enemyClones

  /* Timers and flags */
  var _syncTimer      = 0;    // remaining sync time
  var _syncCD         = 0;    // sync cooldown remaining
  var _syncCloneIdx   = -1;   // which clone is syncing
  var _commandTarget  = null; // THREE.Vector3 of focus target

  /* Mutation */
  var _mutationTimer  = MUTATION_INTERVAL;
  var _boostActive    = false;
  var _boostTimer     = 0;
  var _rampageActive  = false;
  var _rampageTimer   = 0;

  /* Key tracking for C+W chord */
  var _keyC           = false;
  var _keyW           = false;
  var _keyCTime       = 0;
  var _keyWTime       = 0;

  /* HUD */
  var _hudEl          = null;
  var _overlayEl      = null;
  var _gameOver       = false;
  var _gameWon        = false;

  /* Player path buffer for clone sync mirror */
  var _playerPathBuf  = [];   // [{x,y,z,t}, ...]
  var _PATH_LAG       = 0.5;  // clones trail player by 0.5s

  /* ── Utility ─────────────────────────────────────────────── */
  function _v3(x, y, z) {
    return new THREE.Vector3(x || 0, y || 0, z || 0);
  }

  function _dist(a, b) {
    return a.distanceTo(b);
  }

  function _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function _randPos(range) {
    return _v3(_rand(-range, range), 0.9, _rand(-range, range));
  }

  /* ── HUD ─────────────────────────────────────────────────── */
  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'cw-hud';
    _hudEl.style.cssText = [
      'display:none',
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'color:#44ff88',
      'text-shadow:0 0 8px rgba(0,255,100,0.7)',
      'z-index:300',
      'pointer-events:none',
      'white-space:nowrap',
      'background:rgba(0,0,0,0.55)',
      'padding:4px 10px',
      'border-radius:4px',
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _ensureOverlay() {
    if (_overlayEl) return;
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'cw-overlay';
    _overlayEl.style.cssText = [
      'display:none',
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:36px',
      'font-weight:bold',
      'color:#ffffff',
      'text-shadow:0 0 20px rgba(255,255,255,0.9)',
      'z-index:500',
      'pointer-events:none',
      'text-align:center',
    ].join(';');
    document.body.appendChild(_overlayEl);
  }

  function _updateHUD() {
    if (!_hudEl || !_active) return;
    var aliveFC = 0;
    var i;
    for (i = 0; i < _friendlyClones.length; i++) {
      if (!_friendlyClones[i].dead) aliveFC++;
    }
    var aliveEC = 0;
    for (i = 0; i < _enemyClones.length; i++) {
      if (!_enemyClones[i].dead && !_enemyClones[i].isCommander && !_enemyClones[i].isAlpha) aliveEC++;
    }
    var alphaHP = _alpha && !_alpha.dead ? _alpha.hp : 0;
    var syncTxt = _syncCD > 0 ? Math.ceil(_syncCD) + 's' : 'READY';
    var vatCount = 0;
    for (i = 0; i < _enemyVats.length; i++) {
      if (!_enemyVats[i].dead) vatCount++;
    }
    _hudEl.innerHTML =
      'CLONE WARS' +
      ' [CLONES: ' + aliveFC + '/' + MAX_FRIENDLY_CLONES + ']' +
      ' [ENEMY CLONES: ' + aliveEC + ']' +
      ' [ALPHA: ' + alphaHP + ' HP]' +
      ' [SYNC: ' + syncTxt + ']' +
      ' | ENEMY VATS: ' + vatCount + '/2' +
      ' | HP: ' + _playerHP;
  }

  function _showOverlay(msg, color) {
    if (!_overlayEl) return;
    _overlayEl.style.color = color || '#ffffff';
    _overlayEl.innerHTML = msg;
    _overlayEl.style.display = 'block';
  }

  /* ── Geometry builders ───────────────────────────────────── */
  function _makeFriendlyClone(scene, pos) {
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x336633 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return mesh;
  }

  function _makeEnemyClone(scene, pos) {
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x662222 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return mesh;
  }

  function _makeCommander(scene, pos) {
    var geo = new THREE.BoxGeometry(1.0, 2.0, 0.7);
    var mat = new THREE.MeshLambertMaterial({ color: 0x441111 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return mesh;
  }

  function _makeAlpha(scene, pos) {
    var geo = new THREE.BoxGeometry(1.2, 2.2, 0.9);
    var mat = new THREE.MeshLambertMaterial({ color: 0x440000 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return mesh;
  }

  function _makeFriendlyVat(scene, pos) {
    var geo = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x224422, emissive: 0x112211 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return mesh;
  }

  function _makeEnemyVat(scene, pos) {
    var geo = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x882222, emissive: 0x441111 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return mesh;
  }

  function _makeBarrier(scene, pos, w, h, d) {
    var geo = new THREE.BoxGeometry(w || 3, h || 1.5, d || 0.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return mesh;
  }

  function _makeDepot(scene, pos) {
    var geo = new THREE.BoxGeometry(3, 2, 3);
    var mat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return mesh;
  }

  function _makeHPBar(scene) {
    var geo = new THREE.BoxGeometry(0.8, 0.08, 0.02);
    var mat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
    var bar = new THREE.Mesh(geo, mat);
    scene.add(bar);
    return bar;
  }

  function _makeBullet(scene, fromPos, toDir, color) {
    var geo = new THREE.SphereGeometry(0.06, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: color || 0xffff00 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(fromPos);
    mesh.position.y += 0.9;
    scene.add(mesh);
    return { mesh: mesh, dir: toDir.clone().normalize(), life: 0.4, speed: 35 };
  }

  /* ── Battlefield setup ───────────────────────────────────── */
  function _buildBattlefield(scene) {
    var i;
    /* 12 concrete barriers arranged around the field */
    var barrierConfigs = [
      { x: -12, z: -5,  w: 4, h: 1.5, d: 0.5 },
      { x:  12, z: -5,  w: 4, h: 1.5, d: 0.5 },
      { x:  -6, z:  8,  w: 0.5, h: 1.5, d: 4 },
      { x:   6, z:  8,  w: 0.5, h: 1.5, d: 4 },
      { x:  -6, z: -8,  w: 0.5, h: 1.5, d: 4 },
      { x:   6, z: -8,  w: 0.5, h: 1.5, d: 4 },
      { x: -16, z:  2,  w: 4, h: 1.5, d: 0.5 },
      { x:  16, z:  2,  w: 4, h: 1.5, d: 0.5 },
      { x:   0, z: -14, w: 6, h: 1.5, d: 0.5 },
      { x:   0, z:  14, w: 6, h: 1.5, d: 0.5 },
      { x: -10, z:  12, w: 3, h: 1.5, d: 0.5 },
      { x:  10, z:  12, w: 3, h: 1.5, d: 0.5 },
    ];
    for (i = 0; i < barrierConfigs.length; i++) {
      var bc = barrierConfigs[i];
      _barriers.push(_makeBarrier(scene, _v3(bc.x, 0.75, bc.z), bc.w, bc.h, bc.d));
    }

    /* 2 friendly clone vats */
    var fvPos = [_v3(-18, 1.5, 0), _v3(-14, 1.5, 10)];
    for (i = 0; i < 2; i++) {
      var vatMesh = _makeFriendlyVat(scene, fvPos[i]);
      _friendlyVats.push({ mesh: vatMesh, respawnQueue: [] });
    }

    /* 2 enemy vats */
    var evPos = [_v3(18, 1.5, 0), _v3(14, 1.5, -10)];
    for (i = 0; i < 2; i++) {
      var evMesh = _makeEnemyVat(scene, evPos[i]);
      _enemyVats.push({ mesh: evMesh, hp: VAT_ENEMY_HP, dead: false });
    }

    /* Supply depot */
    _depot = _makeDepot(scene, _v3(-5, 1, -18));
    _depotUsed = false;

    /* Ground plane */
    var groundGeo = new THREE.BoxGeometry(80, 0.2, 80);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.1, 0);
    scene.add(ground);

    /* Ambient light */
    var ambient = new THREE.AmbientLight(0x888888);
    scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);
  }

  /* ── Spawn units ─────────────────────────────────────────── */
  function _spawnFriendlyClones(scene) {
    var i;
    for (i = 0; i < MAX_FRIENDLY_CLONES; i++) {
      var pos = _v3(-15 + _rand(-4, 4), 0.9, _rand(-10, 10));
      var mesh = _makeFriendlyClone(scene, pos);
      var hpBar = _makeHPBar(scene);
      _friendlyClones.push({
        mesh:        mesh,
        hpBar:       hpBar,
        hp:          CLONE_HP,
        maxHp:       CLONE_HP,
        dead:        false,
        respawnTimer: 0,
        vatIndex:    i % 2,
        shootCd:     _rand(0, 1.0),
        syncing:     false,
        pathBuf:     [],
        boosted:     false,
      });
    }
  }

  function _spawnEnemyClones(scene) {
    var i;
    for (i = 0; i < MAX_ENEMY_CLONES; i++) {
      var pos = _v3(15 + _rand(-4, 4), 0.9, _rand(-10, 10));
      var mesh = _makeEnemyClone(scene, pos);
      _enemyClones.push({
        mesh:         mesh,
        hp:           ENEMY_HP,
        maxHp:        ENEMY_HP,
        dead:         false,
        isCommander:  false,
        isAlpha:      false,
        shootCd:      _rand(0, 1.2),
        buffed:       false,
        chargingPlayer: false,
      });
    }
    /* 3 commanders */
    for (i = 0; i < MAX_COMMANDERS; i++) {
      var cpos = _v3(18 + _rand(-3, 3), 1.0, _rand(-14, 14));
      var cmesh = _makeCommander(scene, cpos);
      _enemyClones.push({
        mesh:         cmesh,
        hp:           CMD_HP,
        maxHp:        CMD_HP,
        dead:         false,
        isCommander:  true,
        isAlpha:      false,
        shootCd:      _rand(0, 1.5),
        buffed:       false,
        chargingPlayer: false,
      });
    }
    /* 1 Alpha */
    var apos = _v3(22, 1.1, 0);
    var amesh = _makeAlpha(scene, apos);
    _alpha = {
      mesh:         amesh,
      hp:           ALPHA_HP,
      maxHp:        ALPHA_HP,
      dead:         false,
      isCommander:  false,
      isAlpha:      true,
      shootCd:      2.0,
      buffed:       false,
      chargingPlayer: false,
    };
    _enemyClones.push(_alpha);
  }

  function _spawnSurgeClones(scene) {
    var aliveVats = [];
    var i;
    for (i = 0; i < _enemyVats.length; i++) {
      if (!_enemyVats[i].dead) aliveVats.push(_enemyVats[i]);
    }
    if (aliveVats.length === 0) return;
    for (i = 0; i < SURGE_COUNT; i++) {
      var vat = aliveVats[i % aliveVats.length];
      var pos = vat.mesh.position.clone();
      pos.x += _rand(-2, 2);
      pos.z += _rand(-2, 2);
      pos.y = 0.9;
      var mesh = _makeEnemyClone(_scene, pos);
      _enemyClones.push({
        mesh:         mesh,
        hp:           ENEMY_HP,
        maxHp:        ENEMY_HP,
        dead:         false,
        isCommander:  false,
        isAlpha:      false,
        shootCd:      0.5,
        buffed:       false,
        chargingPlayer: false,
      });
    }
  }

  /* ── AI helpers ──────────────────────────────────────────── */
  function _getNearestEnemy(fromPos) {
    var best = null;
    var bestD = Infinity;
    var i;
    for (i = 0; i < _enemyClones.length; i++) {
      var e = _enemyClones[i];
      if (e.dead) continue;
      var d = _dist(fromPos, e.mesh.position);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  function _getNearestFriendlyClone(fromPos) {
    var best = null;
    var bestD = Infinity;
    var i;
    for (i = 0; i < _friendlyClones.length; i++) {
      var c = _friendlyClones[i];
      if (c.dead) continue;
      var d = _dist(fromPos, c.mesh.position);
      if (d < bestD) { bestD = d; best = { clone: c, idx: i }; }
    }
    return best;
  }

  function _getNearestFriendlyTarget(fromPos) {
    /* combined: player + friendly clones */
    var best = null;
    var bestD = Infinity;
    if (!_playerDead && _playerPos) {
      var dp = _dist(fromPos, _playerPos);
      if (dp < bestD) { bestD = dp; best = { pos: _playerPos, isPlayer: true }; }
    }
    var i;
    for (i = 0; i < _friendlyClones.length; i++) {
      var c = _friendlyClones[i];
      if (c.dead) continue;
      var dc = _dist(fromPos, c.mesh.position);
      if (dc < bestD) { bestD = dc; best = { pos: c.mesh.position, isPlayer: false, clone: c }; }
    }
    return best;
  }

  function _moveToward(mesh, targetPos, speed, dt) {
    var dir = new THREE.Vector3();
    dir.subVectors(targetPos, mesh.position);
    dir.y = 0;
    var len = dir.length();
    if (len < 0.3) return;
    dir.normalize();
    mesh.position.x += dir.x * speed * dt;
    mesh.position.z += dir.z * speed * dt;
    mesh.lookAt(new THREE.Vector3(targetPos.x, mesh.position.y, targetPos.z));
  }

  function _applyCommanderBuffs() {
    var i, j;
    /* reset all buffs */
    for (i = 0; i < _enemyClones.length; i++) {
      _enemyClones[i].buffed = false;
    }
    /* commanders buff nearby enemies */
    for (i = 0; i < _enemyClones.length; i++) {
      var cmd = _enemyClones[i];
      if (cmd.dead || !cmd.isCommander) continue;
      for (j = 0; j < _enemyClones.length; j++) {
        var e = _enemyClones[j];
        if (e.dead || e === cmd) continue;
        if (_dist(cmd.mesh.position, e.mesh.position) <= CMD_BUFF_RADIUS) {
          e.buffed = true;
        }
      }
    }
  }

  /* ── Shooting ────────────────────────────────────────────── */
  var _bullets = [];  /* {mesh, dir, life, speed, dmg, friendly} */

  function _shootAt(fromPos, targetPos, friendly, dmg, color) {
    var dir = new THREE.Vector3();
    dir.subVectors(targetPos, fromPos);
    dir.y = 0;
    dir.normalize();
    var b = _makeBullet(_scene, fromPos, dir, color);
    b.dmg = dmg;
    b.friendly = friendly;
    _bullets.push(b);
  }

  function _updateBullets(dt) {
    var i, j;
    for (i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.mesh.position.x += b.dir.x * b.speed * dt;
      b.mesh.position.z += b.dir.z * b.speed * dt;
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
        continue;
      }
      /* hit detection */
      if (b.friendly) {
        /* friendly bullet hits enemies */
        for (j = 0; j < _enemyClones.length; j++) {
          var e = _enemyClones[j];
          if (e.dead) continue;
          if (_dist(b.mesh.position, e.mesh.position) < 0.7) {
            _scene.remove(b.mesh);
            _bullets.splice(i, 1);
            _damageEnemy(e, b.dmg, true);
            break;
          }
        }
        /* friendly bullet hits enemy vats */
        for (j = 0; j < _enemyVats.length; j++) {
          var ev = _enemyVats[j];
          if (ev.dead) continue;
          if (_dist(b.mesh.position, ev.mesh.position) < 1.8) {
            _scene.remove(b.mesh);
            _bullets.splice(i, 1);
            ev.hp -= b.dmg;
            if (ev.hp <= 0) {
              ev.dead = true;
              _scene.remove(ev.mesh);
            }
            break;
          }
        }
      } else {
        /* enemy bullet hits player */
        if (!_playerDead && _playerPos && _dist(b.mesh.position, _playerPos) < 0.8) {
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
          _damagePlayer(b.dmg);
          continue;
        }
        /* enemy bullet hits friendly clones */
        for (j = 0; j < _friendlyClones.length; j++) {
          var fc = _friendlyClones[j];
          if (fc.dead) continue;
          if (_dist(b.mesh.position, fc.mesh.position) < 0.7) {
            _scene.remove(b.mesh);
            _bullets.splice(i, 1);
            _damageFriendlyClone(fc, b.dmg);
            break;
          }
        }
      }
    }
  }

  /* ── Damage ──────────────────────────────────────────────── */
  function _damageEnemy(e, dmg, fromPlayer) {
    if (e.isAlpha && !fromPlayer) return; /* alpha immune to clone attacks */
    e.hp -= dmg;
    if (e.hp <= 0) {
      e.hp = 0;
      e.dead = true;
      _scene.remove(e.mesh);
      if (e.isAlpha) {
        _gameWon = true;
        _showOverlay('ALPHA ELIMINATED!<br><span style="font-size:22px;color:#44ff88">VICTORY — THE CLONE ARMY TRIUMPHS</span>', '#ffcc00');
      }
    }
  }

  function _damageFriendlyClone(fc, dmg) {
    fc.hp -= dmg;
    if (fc.hp < 0) fc.hp = 0;
    if (fc.hp <= 0 && !fc.dead) {
      fc.dead = true;
      _scene.remove(fc.mesh);
      _scene.remove(fc.hpBar);
      /* queue respawn at assigned vat */
      var vatIdx = fc.vatIndex;
      if (!_friendlyVats[vatIdx]) vatIdx = 0;
      _friendlyVats[vatIdx].respawnQueue.push({ clone: fc, timer: VAT_RESPAWN_TIME });
      /* glow the vat */
      if (_friendlyVats[vatIdx] && _friendlyVats[vatIdx].mesh) {
        _friendlyVats[vatIdx].mesh.material.emissive.setHex(0x00ff44);
      }
    }
  }

  function _damagePlayer(dmg) {
    if (_playerDead) return;
    _playerHP -= dmg;
    if (_playerHP <= 0) {
      _playerHP = 0;
      _playerDead = true;
      _tryPromoteClone();
    }
  }

  function _tryPromoteClone() {
    if (_promoted) {
      /* no second promotion */
      _gameOver = true;
      _showOverlay('DEFEATED<br><span style="font-size:22px;color:#ff4444">ALL CLONES LOST — MISSION FAILED</span>', '#ff2222');
      return;
    }
    var nearest = _getNearestFriendlyClone(_playerPos || _v3(0, 0, 0));
    if (!nearest) {
      _gameOver = true;
      _showOverlay('DEFEATED<br><span style="font-size:22px;color:#ff4444">NO CLONE TO PROMOTE — MISSION FAILED</span>', '#ff2222');
      return;
    }
    /* promote */
    _promoted = true;
    var c = nearest.clone;
    _playerHP = c.hp;
    c.dead = true;
    _scene.remove(c.mesh);
    _scene.remove(c.hpBar);
    _playerDead = false;
    /* move player camera to promoted clone position */
    if (_camera) {
      _camera.position.copy(c.mesh.position);
      _camera.position.y = 1.7;
    }
    if (_playerPos) {
      _playerPos.copy(c.mesh.position);
    }
    _showOverlay('CLONE PROMOTED TO PLAYER!', '#44ffcc');
    /* hide after 3s */
    window.setTimeout(function () {
      if (_overlayEl) _overlayEl.style.display = 'none';
    }, 3000);
  }

  /* ── Clone vat respawn ───────────────────────────────────── */
  function _updateVatRespawns(dt) {
    var i, j;
    for (i = 0; i < _friendlyVats.length; i++) {
      var vat = _friendlyVats[i];
      var q = vat.respawnQueue;
      for (j = q.length - 1; j >= 0; j--) {
        q[j].timer -= dt;
        if (q[j].timer <= 0) {
          /* respawn the clone */
          var fc = q[j].clone;
          var pos = vat.mesh.position.clone();
          pos.x += _rand(-1, 1);
          pos.z += _rand(-1, 1);
          pos.y = 0.9;
          fc.mesh = _makeFriendlyClone(_scene, pos);
          fc.hpBar = _makeHPBar(_scene);
          fc.hp = CLONE_HP;
          fc.dead = false;
          fc.shootCd = 0.5;
          fc.syncing = false;
          q.splice(j, 1);
        }
      }
      /* dim vat glow when queue empty */
      if (q.length === 0 && vat.mesh) {
        vat.mesh.material.emissive.setHex(0x112211);
      }
    }
  }

  /* ── Sync (Z key) ────────────────────────────────────────── */
  function _activateSync() {
    if (_syncCD > 0) return;
    var nearest = _getNearestFriendlyClone(_playerPos || _v3(0, 0, 0));
    if (!nearest) return;
    _syncCloneIdx = nearest.idx;
    _friendlyClones[_syncCloneIdx].syncing = true;
    _friendlyClones[_syncCloneIdx].pathBuf = [];
    _syncTimer = SYNC_DURATION;
    _syncCD    = SYNC_COOLDOWN;
  }

  function _updateSync(dt) {
    if (_syncTimer > 0) {
      _syncTimer -= dt;
      if (_syncTimer <= 0) {
        _syncTimer = 0;
        if (_syncCloneIdx >= 0 && _syncCloneIdx < _friendlyClones.length) {
          _friendlyClones[_syncCloneIdx].syncing = false;
        }
        _syncCloneIdx = -1;
      }
    }
    if (_syncCD > 0) {
      _syncCD -= dt;
      if (_syncCD < 0) _syncCD = 0;
    }
  }

  /* ── Command (X key) ─────────────────────────────────────── */
  function _activateCommand() {
    var target = _getNearestEnemy(_playerPos || _v3(0, 0, 0));
    if (!target) return;
    _commandTarget = target.mesh.position;
  }

  /* ── Player path buffer (for sync mirroring) ─────────────── */
  function _recordPlayerPath(now) {
    if (!_playerPos) return;
    _playerPathBuf.push({ x: _playerPos.x, y: _playerPos.y, z: _playerPos.z, t: now });
    /* prune old entries (keep last 2 seconds) */
    while (_playerPathBuf.length > 0 && _playerPathBuf[0].t < now - 2.0) {
      _playerPathBuf.shift();
    }
  }

  function _getPlayerPosAtLag(now) {
    var targetT = now - _PATH_LAG;
    var i;
    for (i = _playerPathBuf.length - 1; i >= 0; i--) {
      if (_playerPathBuf[i].t <= targetT) {
        return _playerPathBuf[i];
      }
    }
    return _playerPathBuf.length > 0 ? _playerPathBuf[0] : null;
  }

  /* ── Friendly clone AI ───────────────────────────────────── */
  function _updateFriendlyClones(dt, now) {
    var i;
    for (i = 0; i < _friendlyClones.length; i++) {
      var fc = _friendlyClones[i];
      if (fc.dead) continue;

      var speed = fc.boosted ? CLONE_SPEED * 1.5 : CLONE_SPEED;
      var dmg   = fc.boosted ? CLONE_DMG  * 1.5 : CLONE_DMG;

      if (fc.syncing) {
        /* mirror player path with lag */
        var lagPos = _getPlayerPosAtLag(now);
        if (lagPos) {
          var lv = _v3(lagPos.x, lagPos.y, lagPos.z);
          _moveToward(fc.mesh, lv, speed, dt);
        }
      } else if (_commandTarget) {
        /* commanded: rush command target area */
        _moveToward(fc.mesh, _commandTarget, speed, dt);
        /* shoot nearest enemy */
        var target = _getNearestEnemy(fc.mesh.position);
        if (target && _dist(fc.mesh.position, target.mesh.position) < CLONE_RANGE) {
          fc.shootCd -= dt;
          if (fc.shootCd <= 0) {
            fc.shootCd = CLONE_COOLDOWN;
            _shootAt(fc.mesh.position, target.mesh.position, true, dmg, 0x44ff88);
          }
        }
      } else {
        /* default: attack nearest enemy */
        var nearest = _getNearestEnemy(fc.mesh.position);
        if (nearest) {
          var d = _dist(fc.mesh.position, nearest.mesh.position);
          if (d > 6) {
            _moveToward(fc.mesh, nearest.mesh.position, speed, dt);
          }
          if (d < CLONE_RANGE) {
            fc.shootCd -= dt;
            if (fc.shootCd <= 0) {
              fc.shootCd = CLONE_COOLDOWN;
              _shootAt(fc.mesh.position, nearest.mesh.position, true, dmg, 0x44ff88);
            }
          }
        }
      }

      /* update HP bar */
      if (fc.hpBar) {
        fc.hpBar.position.copy(fc.mesh.position);
        fc.hpBar.position.y += 1.3;
        var pct = fc.hp / fc.maxHp;
        fc.hpBar.scale.x = Math.max(0.01, pct);
        fc.hpBar.material.color.setHex(pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff2200);
      }
    }
  }

  /* ── Enemy AI ────────────────────────────────────────────── */
  function _updateEnemyClones(dt) {
    _applyCommanderBuffs();
    var i;
    for (i = 0; i < _enemyClones.length; i++) {
      var e = _enemyClones[i];
      if (e.dead) continue;

      var baseDmg   = e.isAlpha ? ALPHA_DMG : ENEMY_DMG;
      var baseSpeed = e.isAlpha ? ALPHA_SPEED : ENEMY_SPEED;
      var actDmg    = e.buffed ? baseDmg * (1 + CMD_DMG_BOOST) : baseDmg;
      var actSpeed  = e.chargingPlayer ? baseSpeed * 3 : baseSpeed;

      var target = _getNearestFriendlyTarget(e.mesh.position);
      if (!target) continue;

      var td = _dist(e.mesh.position, target.pos);
      if (td > 5) {
        _moveToward(e.mesh, target.pos, actSpeed, dt);
      }

      /* shoot */
      e.shootCd -= dt;
      if (e.shootCd <= 0 && td < FIRE_RANGE) {
        e.shootCd = 1.2;
        _shootAt(e.mesh.position, target.pos, false, actDmg, 0xff2222);
      }
    }
  }

  /* ── Mutation events ─────────────────────────────────────── */
  function _updateMutations(dt) {
    _mutationTimer -= dt;
    if (_mutationTimer <= 0) {
      _mutationTimer = MUTATION_INTERVAL;
      var roll = Math.random();
      if (roll < 0.33) {
        _triggerCloneBoost();
      } else if (roll < 0.66) {
        _triggerEnemySurge();
      } else {
        _triggerAlphaRampage();
      }
    }

    if (_boostActive) {
      _boostTimer -= dt;
      if (_boostTimer <= 0) {
        _boostActive = false;
        var i;
        for (i = 0; i < _friendlyClones.length; i++) {
          _friendlyClones[i].boosted = false;
        }
      }
    }

    if (_rampageActive) {
      _rampageTimer -= dt;
      if (_rampageTimer <= 0) {
        _rampageActive = false;
        if (_alpha && !_alpha.dead) {
          _alpha.chargingPlayer = false;
        }
      }
    }
  }

  function _triggerCloneBoost() {
    _boostActive = true;
    _boostTimer  = BOOST_DURATION;
    var i;
    for (i = 0; i < _friendlyClones.length; i++) {
      if (!_friendlyClones[i].dead) _friendlyClones[i].boosted = true;
    }
    _showOverlay('CLONE BOOST ACTIVE!<br><span style="font-size:18px">+50% SPEED &amp; DAMAGE FOR 30s</span>', '#44ff88');
    window.setTimeout(function () {
      if (_overlayEl) _overlayEl.style.display = 'none';
    }, 2500);
  }

  function _triggerEnemySurge() {
    _spawnSurgeClones(_scene);
    _showOverlay('ENEMY SURGE!<br><span style="font-size:18px;color:#ff4444">REINFORCEMENTS INBOUND</span>', '#ff6600');
    window.setTimeout(function () {
      if (_overlayEl) _overlayEl.style.display = 'none';
    }, 2500);
  }

  function _triggerAlphaRampage() {
    if (!_alpha || _alpha.dead) return;
    _rampageActive = true;
    _rampageTimer  = RAMPAGE_DURATION;
    _alpha.chargingPlayer = true;
    _showOverlay('ALPHA RAMPAGE!<br><span style="font-size:18px;color:#ff0000">3× SPEED FOR 10s</span>', '#ff0000');
    window.setTimeout(function () {
      if (_overlayEl) _overlayEl.style.display = 'none';
    }, 2500);
  }

  /* ── Depot interaction ───────────────────────────────────── */
  function _checkDepot() {
    if (_depotUsed || !_depot || !_playerPos) return;
    if (_dist(_playerPos, _depot.position) < 3.5) {
      _playerHP = Math.min(PLAYER_HP, _playerHP + 50);
      _depotUsed = true;
      _depot.material.color.setHex(0x222222);
    }
  }

  /* ── Input ───────────────────────────────────────────────── */
  function _onKeyDown(e) {
    if (!_active) {
      var k = e.key.toLowerCase();
      var now = performance.now() / 1000;
      if (k === 'c') { _keyC = true; _keyCTime = now; }
      if (k === 'w') { _keyW = true; _keyWTime = now; }
      if (_keyC && _keyW && Math.abs(_keyCTime - _keyWTime) < KEY_WINDOW) {
        _activate();
        _keyC = false; _keyW = false;
      }
      return;
    }
    if (_gameOver || _gameWon) return;
    var key = e.key.toLowerCase();
    if (key === 'z') _activateSync();
    if (key === 'x') _activateCommand();
    if (key === 'e') _checkDepot();
  }

  function _onKeyUp(e) {
    var k = e.key.toLowerCase();
    if (k === 'c') _keyC = false;
    if (k === 'w') _keyW = false;
  }

  /* ── Activation ──────────────────────────────────────────── */
  function _activate() {
    if (_active) return;
    _active = true;

    /* Try to grab scene and camera from host environment */
    if (typeof window.GameScene !== 'undefined') {
      _scene = window.GameScene;
    } else if (typeof window.scene !== 'undefined') {
      _scene = window.scene;
    } else {
      /* Create standalone scene */
      _scene = new THREE.Scene();
      _scene.background = new THREE.Color(0x222233);
      _scene.fog = new THREE.Fog(0x222233, 30, 80);
    }

    if (typeof window.camera !== 'undefined') {
      _camera = window.camera;
    } else if (typeof window.GameCamera !== 'undefined') {
      _camera = window.GameCamera;
    }

    /* Player position — try to hook into host, else create standalone */
    if (typeof window.Player !== 'undefined' && window.Player.getPosition) {
      _playerPos = window.Player.getPosition();
    } else if (typeof window.playerPosition !== 'undefined') {
      _playerPos = window.playerPosition;
    } else {
      _playerPos = _v3(0, 0.9, 0);
    }

    _playerHP   = PLAYER_HP;
    _playerDead = false;
    _promoted   = false;
    _gameOver   = false;
    _gameWon    = false;
    _boostActive    = false;
    _rampageActive  = false;
    _mutationTimer  = MUTATION_INTERVAL;
    _commandTarget  = null;
    _syncTimer      = 0;
    _syncCD         = 0;
    _syncCloneIdx   = -1;
    _playerPathBuf  = [];
    _bullets        = [];
    _friendlyClones = [];
    _enemyClones    = [];
    _friendlyVats   = [];
    _enemyVats      = [];
    _barriers       = [];
    _depot          = null;
    _alpha          = null;

    _buildBattlefield(_scene);
    _spawnFriendlyClones(_scene);
    _spawnEnemyClones(_scene);

    _ensureHUD();
    _ensureOverlay();
    if (_hudEl) _hudEl.style.display = 'block';

    _showOverlay('CLONE WARS<br><span style="font-size:18px">Z=SYNC | X=COMMAND | E=DEPOT</span><br><span style="font-size:14px;color:#aaffaa">Destroy the Alpha to win!</span>', '#44ff88');
    window.setTimeout(function () {
      if (_overlayEl) _overlayEl.style.display = 'none';
    }, 3000);
  }

  /* ── Main update loop ────────────────────────────────────── */
  function update(dt) {
    if (!_active || _gameOver || _gameWon) return;
    var now = performance.now() / 1000;

    _recordPlayerPath(now);
    _updateSync(dt);
    _updateFriendlyClones(dt, now);
    _updateEnemyClones(dt);
    _updateBullets(dt);
    _updateVatRespawns(dt);
    _updateMutations(dt);
    _updateHUD();

    /* clear command target if the enemy it points to is dead */
    if (_commandTarget) {
      var stillAlive = false;
      var i;
      for (i = 0; i < _enemyClones.length; i++) {
        if (!_enemyClones[i].dead &&
            _dist(_commandTarget, _enemyClones[i].mesh.position) < 1.5) {
          stillAlive = true;
          break;
        }
      }
      if (!stillAlive) _commandTarget = null;
    }

    /* check lose condition: player dead and no clones */
    if (_playerDead) {
      var anyAlive = false;
      for (var j = 0; j < _friendlyClones.length; j++) {
        if (!_friendlyClones[j].dead) { anyAlive = true; break; }
      }
      if (!anyAlive && !_promoted) {
        _gameOver = true;
        _showOverlay('DEFEATED<br><span style="font-size:22px;color:#ff4444">ALL CLONES LOST — MISSION FAILED</span>', '#ff2222');
      }
    }
  }

  /* ── Reset ───────────────────────────────────────────────── */
  function reset() {
    var i;
    /* remove all bullets */
    for (i = 0; i < _bullets.length; i++) {
      if (_scene) _scene.remove(_bullets[i].mesh);
    }
    _bullets = [];

    /* remove friendly clones */
    for (i = 0; i < _friendlyClones.length; i++) {
      if (_scene) {
        _scene.remove(_friendlyClones[i].mesh);
        _scene.remove(_friendlyClones[i].hpBar);
      }
    }
    _friendlyClones = [];

    /* remove enemy clones */
    for (i = 0; i < _enemyClones.length; i++) {
      if (_scene) _scene.remove(_enemyClones[i].mesh);
    }
    _enemyClones = [];

    /* remove vats */
    for (i = 0; i < _friendlyVats.length; i++) {
      if (_scene) _scene.remove(_friendlyVats[i].mesh);
    }
    _friendlyVats = [];
    for (i = 0; i < _enemyVats.length; i++) {
      if (_scene) _scene.remove(_enemyVats[i].mesh);
    }
    _enemyVats = [];

    /* remove barriers + depot */
    for (i = 0; i < _barriers.length; i++) {
      if (_scene) _scene.remove(_barriers[i]);
    }
    _barriers = [];
    if (_depot && _scene) _scene.remove(_depot);
    _depot = null;

    _active         = false;
    _gameOver       = false;
    _gameWon        = false;
    _playerDead     = false;
    _promoted       = false;
    _alpha          = null;
    _commandTarget  = null;
    _syncTimer      = 0;
    _syncCD         = 0;
    _syncCloneIdx   = -1;
    _playerPathBuf  = [];
    _boostActive    = false;
    _rampageActive  = false;
    _mutationTimer  = MUTATION_INTERVAL;

    if (_hudEl) _hudEl.style.display = 'none';
    if (_overlayEl) _overlayEl.style.display = 'none';
  }

  /* ── Init (register listeners) ───────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  /* ── Public API ──────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
