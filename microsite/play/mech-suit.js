/* ============================================================
 *  MECH-SUIT.JS — Exosuit battle module
 *  Activation: X+S simultaneous (400ms window)
 *  Features: exosuit mesh, boost jump, armor HP, power fist,
 *  gatling arm, missile shoulder, enemy types, momentum, fuel,
 *  system damage, arena, HUD
 * ============================================================ */
window.MechSuit = (function () {
  'use strict';

  /* ── Config ─────────────────────────────────── */
  var CFG = {
    ARMOR_MAX: 300,
    ARMOR_ABSORB: 0.9,
    ARMOR_REGEN_RATE: 5,
    ARMOR_REGEN_DELAY: 3,
    BOOST_HEIGHT: 8,
    BOOST_DURATION: 0.3,
    BOOST_LIGHT_COLOR: 0xFF6600,
    DOUBLE_JUMP_HEIGHT: 4,
    SHOCKWAVE_MAX_R: 5,
    SHOCKWAVE_SPEED: 8,
    SHOCKWAVE_KILL_R: 5,
    FIST_DURATION: 0.2,
    FIST_RANGE: 4,
    FIST_FLY_Y: 5,
    GATLING_RPS: 20,
    GATLING_BULLET_SPEED: 60,
    GATLING_OVERHEAT_TIME: 4,
    GATLING_BULLET_R: 0.1,
    MISSILE_SPEED: 18,
    MISSILE_TURN_RATE: 3,
    MISSILE_COUNT: 3,
    FUEL_MAX: 100,
    FUEL_JETPACK_DRAIN: 40,
    FUEL_GATLING_DRAIN: 15,
    FUEL_CELL_RESTORE: 35,
    MOMENTUM_LERP: 4,
    MAX_SPEED: 7,
    SUBSYSTEM_DAMAGE_THRESHOLD: 150,
    SUBSYSTEM_FAIL_DURATION: 20,
    ACTIVATION_WINDOW: 0.4,
    SCALE_ACTIVE: 1.4,
    SCALE_IDLE: 1.0,
    ARENA_SIZE: 40,
    INFANTRY_COUNT: 8,
    RPG_COUNT: 2,
    RPG_INTERVAL: 8,
    ENEMY_MECH_HITS: 20
  };

  /* ── State ──────────────────────────────────── */
  var _scene = null;
  var _player = null;
  var _camera = null;
  var _keys = {};
  var _activated = false;
  var _xPressTime = -9999;
  var _sPressTime = -9999;

  var _suit = {
    armorHP: CFG.ARMOR_MAX,
    fuelPct: 100,
    missiles: CFG.MISSILE_COUNT,
    systemStatus: 'NOMINAL',
    sysFailTimer: 0,
    sysFailType: 0,
    armorLastHitTimer: 0,
    totalDamageTaken: 0,
    subsystemBroken: false
  };

  var _boost = {
    active: false,
    timer: 0,
    jumpsUsed: 0,
    onGround: true,
    light: null,
    shockwaveActive: false,
    shockwaveMesh: null,
    shockwaveR: 1
  };

  var _fist = {
    active: false,
    timer: 0,
    mesh: null,
    baseZ: 0
  };

  var _gatling = {
    active: false,
    heatTimer: 0,
    overheated: false,
    overheatLight: null,
    spinAngle: 0,
    fireTimer: 0,
    barrelMesh: null,
    bullets: []
  };

  var _missiles = {
    list: [],
    podMesh: null
  };

  var _enemies = [];
  var _obstacles = [];
  var _fuelCells = [];

  var _velocity = { x: 0, z: 0 };
  var _meshes = {
    torso: null,
    armL: null,
    armR: null,
    shoulderL: null,
    shoulderR: null
  };

  var _hudEl = null;
  var _arenaBuilt = false;

  /* ── Utility ─────────────────────────────────── */
  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function _removeMesh(mesh) {
    if (mesh && _scene) {
      _scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    }
  }

  /* ── HUD ─────────────────────────────────────── */
  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'mech-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,30,0.82)',
      'color:#00FFCC',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #00FFCC',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var enemyCount = 0;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) enemyCount++;
    }
    var armor = Math.max(0, Math.round(_suit.armorHP));
    var fuel = Math.max(0, Math.round(_suit.fuelPct));
    var missiles = _suit.missiles;
    var status = _suit.systemStatus;
    _hudEl.textContent = [
      'MECH',
      '[ARMOR: ' + armor + '/' + CFG.ARMOR_MAX + ']',
      '[FUEL: ' + fuel + '%]',
      '[MISSILES: ' + missiles + ']',
      '[SYSTEM: ' + status + ']',
      '| ENEMIES: ' + enemyCount
    ].join(' ');
    _hudEl.style.display = _activated ? 'block' : 'none';
  }

  /* ── Exosuit Mesh ────────────────────────────── */
  function _buildSuitMesh() {
    if (!_player || !_scene) return;

    // Torso overlay
    var tGeo = new THREE.BoxGeometry(1.5, 2.5, 0.8);
    var tMat = new THREE.MeshLambertMaterial({ color: 0x445566, transparent: true, opacity: 0.88 });
    _meshes.torso = new THREE.Mesh(tGeo, tMat);
    _meshes.torso.position.set(0, 0, 0);
    _player.add(_meshes.torso);

    // Left arm
    var aGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 8);
    var aMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    _meshes.armL = new THREE.Mesh(aGeo, aMat);
    _meshes.armL.rotation.z = Math.PI / 2;
    _meshes.armL.position.set(-1.1, 0.2, 0);
    _player.add(_meshes.armL);

    // Right arm (gatling side)
    var aGeoR = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 8);
    var aMatR = new THREE.MeshLambertMaterial({ color: 0x334455 });
    _meshes.armR = new THREE.Mesh(aGeoR, aMatR);
    _meshes.armR.rotation.z = Math.PI / 2;
    _meshes.armR.position.set(1.1, 0.2, 0);
    _player.add(_meshes.armR);

    // Left shoulder pad
    var sGeoL = new THREE.BoxGeometry(0.6, 0.4, 0.6);
    var sMatL = new THREE.MeshLambertMaterial({ color: 0x223344 });
    _meshes.shoulderL = new THREE.Mesh(sGeoL, sMatL);
    _meshes.shoulderL.position.set(-0.95, 0.8, 0);
    _player.add(_meshes.shoulderL);

    // Right shoulder pad (missile pod)
    var sGeoR = new THREE.BoxGeometry(0.7, 0.5, 0.7);
    var sMatR = new THREE.MeshLambertMaterial({ color: 0x223344 });
    _meshes.shoulderR = new THREE.Mesh(sGeoR, sMatR);
    _meshes.shoulderR.position.set(0.95, 0.8, 0);
    _player.add(_meshes.shoulderR);
    _missiles.podMesh = _meshes.shoulderR;

    // Gatling barrel on right arm
    var bGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 6);
    var bMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
    _gatling.barrelMesh = new THREE.Mesh(bGeo, bMat);
    _gatling.barrelMesh.rotation.z = Math.PI / 2;
    _gatling.barrelMesh.position.set(1.9, 0.2, 0);
    _player.add(_gatling.barrelMesh);

    // Fist mesh (hidden until attack)
    var fGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var fMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    _fist.mesh = new THREE.Mesh(fGeo, fMat);
    _fist.mesh.position.set(-1.4, 0.2, -0.5);
    _fist.mesh.visible = false;
    _player.add(_fist.mesh);

    // Boost exhaust light
    _boost.light = new THREE.PointLight(CFG.BOOST_LIGHT_COLOR, 0, 8);
    _boost.light.position.set(0, -1.5, 0);
    _player.add(_boost.light);

    // Gatling overheat light
    _gatling.overheatLight = new THREE.PointLight(0xFF0000, 0, 5);
    _gatling.overheatLight.position.set(1.9, 0.2, 0);
    _player.add(_gatling.overheatLight);

    _player.scale.setScalar(CFG.SCALE_ACTIVE);
  }

  function _teardownSuitMesh() {
    if (!_player) return;
    var keys = ['torso', 'armL', 'armR', 'shoulderL', 'shoulderR'];
    for (var i = 0; i < keys.length; i++) {
      if (_meshes[keys[i]]) {
        _player.remove(_meshes[keys[i]]);
        if (_meshes[keys[i]].geometry) _meshes[keys[i]].geometry.dispose();
        if (_meshes[keys[i]].material) _meshes[keys[i]].material.dispose();
        _meshes[keys[i]] = null;
      }
    }
    if (_fist.mesh) {
      _player.remove(_fist.mesh);
      if (_fist.mesh.geometry) _fist.mesh.geometry.dispose();
      if (_fist.mesh.material) _fist.mesh.material.dispose();
      _fist.mesh = null;
    }
    if (_gatling.barrelMesh) {
      _player.remove(_gatling.barrelMesh);
      if (_gatling.barrelMesh.geometry) _gatling.barrelMesh.geometry.dispose();
      if (_gatling.barrelMesh.material) _gatling.barrelMesh.material.dispose();
      _gatling.barrelMesh = null;
    }
    if (_boost.light) { _player.remove(_boost.light); _boost.light = null; }
    if (_gatling.overheatLight) { _player.remove(_gatling.overheatLight); _gatling.overheatLight = null; }
    _missiles.podMesh = null;
    _player.scale.setScalar(CFG.SCALE_IDLE);
  }

  /* ── Arena ────────────────────────────────────── */
  function _buildArena() {
    if (_arenaBuilt || !_scene) return;
    _arenaBuilt = true;
    var coverPositions = [
      [-12, 3, -8], [12, 3, -8], [-6, 3, 6], [6, 3, 6],
      [-15, 3, 2], [15, 3, 2], [0, 3, -14], [0, 3, 14]
    ];
    for (var i = 0; i < coverPositions.length; i++) {
      var cp = coverPositions[i];
      var wGeo = new THREE.BoxGeometry(4, 2, 1);
      var wMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
      var wall = new THREE.Mesh(wGeo, wMat);
      wall.position.set(cp[0], cp[1] * 0.5, cp[2]);
      _scene.add(wall);
      _obstacles.push({ mesh: wall, alive: true, pos: { x: cp[0], y: wall.position.y, z: cp[2] } });
    }

    // Scattered debris (BoxGeometry)
    for (var d = 0; d < 40; d++) {
      var angle = (d / 40) * Math.PI * 2;
      var radius = 5 + Math.random() * 14;
      var dx = Math.cos(angle) * radius + (Math.random() - 0.5) * 4;
      var dz = Math.sin(angle) * radius + (Math.random() - 0.5) * 4;
      var size = 0.4 + Math.random() * 0.8;
      var dbGeo = new THREE.BoxGeometry(size, size, size);
      var dbMat = new THREE.MeshLambertMaterial({ color: 0x445555 });
      var db = new THREE.Mesh(dbGeo, dbMat);
      db.position.set(dx, size * 0.5, dz);
      _scene.add(db);
      _obstacles.push({ mesh: db, alive: true, pos: { x: dx, y: db.position.y, z: dz } });
    }

    // Fuel cells (BoxGeometry 0x00FFAA)
    var fuelPos = [[-8, 0.5, -8], [10, 0.5, 5], [-3, 0.5, 12]];
    for (var f = 0; f < fuelPos.length; f++) {
      var fp = fuelPos[f];
      var fcGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
      var fcMat = new THREE.MeshLambertMaterial({ color: 0x00FFAA, emissive: 0x00AA66 });
      var fcMesh = new THREE.Mesh(fcGeo, fcMat);
      fcMesh.position.set(fp[0], fp[1], fp[2]);
      _scene.add(fcMesh);
      _fuelCells.push({ mesh: fcMesh, pos: { x: fp[0], y: fp[1], z: fp[2] }, collected: false });
    }
  }

  /* ── Enemies ──────────────────────────────────── */
  function _buildEnemies() {
    if (!_scene) return;
    _enemies = [];

    // 8 infantry
    for (var i = 0; i < CFG.INFANTRY_COUNT; i++) {
      var ang = (i / CFG.INFANTRY_COUNT) * Math.PI * 2;
      var r = 12 + Math.random() * 6;
      var ex = Math.cos(ang) * r;
      var ez = Math.sin(ang) * r;
      var eGeo = new THREE.BoxGeometry(0.6, 1.6, 0.4);
      var eMat = new THREE.MeshLambertMaterial({ color: 0x7A5522 });
      var eMesh = new THREE.Mesh(eGeo, eMat);
      eMesh.position.set(ex, 0.8, ez);
      _scene.add(eMesh);
      _enemies.push({
        mesh: eMesh,
        pos: { x: ex, y: 0.8, z: ez },
        type: 'infantry',
        hp: 30,
        alive: true,
        shootTimer: 2 + Math.random() * 3,
        velocity: { x: 0, y: 0, z: 0 },
        flying: false,
        flyTimer: 0
      });
    }

    // 2 RPG teams
    for (var j = 0; j < CFG.RPG_COUNT; j++) {
      var rang = (j / CFG.RPG_COUNT) * Math.PI * 2 + Math.PI * 0.5;
      var rr = 16 + Math.random() * 4;
      var rx = Math.cos(rang) * rr;
      var rz = Math.sin(rang) * rr;
      var rGeo = new THREE.BoxGeometry(0.7, 1.7, 0.5);
      var rMat = new THREE.MeshLambertMaterial({ color: 0x556633 });
      var rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.position.set(rx, 0.85, rz);
      _scene.add(rMesh);
      _enemies.push({
        mesh: rMesh,
        pos: { x: rx, y: 0.85, z: rz },
        type: 'rpg',
        hp: 50,
        alive: true,
        shootTimer: CFG.RPG_INTERVAL,
        velocity: { x: 0, y: 0, z: 0 },
        flying: false,
        flyTimer: 0
      });
    }

    // 1 enemy mech boss
    var mGeo = new THREE.BoxGeometry(2, 3, 1);
    var mMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var mMesh = new THREE.Mesh(mGeo, mMat);
    mMesh.position.set(0, 1.5, -18);
    _scene.add(mMesh);
    _enemies.push({
      mesh: mMesh,
      pos: { x: 0, y: 1.5, z: -18 },
      type: 'mech_boss',
      hp: CFG.ENEMY_MECH_HITS * 10,
      hitsLeft: CFG.ENEMY_MECH_HITS,
      alive: true,
      shootTimer: 3,
      velocity: { x: 0, y: 0, z: 0 },
      flying: false,
      flyTimer: 0
    });
  }

  /* ── Boost Jump ───────────────────────────────── */
  function _tryBoostJump() {
    if (!_activated || !_player) return;
    if (_suit.fuelPct < 5) return;
    var jumpBroken = (_suit.sysFailType === 1 && _suit.subsystemBroken);
    var jumpH = jumpBroken ? CFG.DOUBLE_JUMP_HEIGHT : CFG.BOOST_HEIGHT;
    if (_boost.onGround) {
      _boost.jumpsUsed = 1;
      _boost.active = true;
      _boost.timer = CFG.BOOST_DURATION;
      _boost.targetY = _player.position.y + jumpH;
      _suit.fuelPct -= CFG.FUEL_JETPACK_DRAIN;
      if (_suit.fuelPct < 0) _suit.fuelPct = 0;
      if (_boost.light) _boost.light.intensity = 3;
      _boost.onGround = false;
    } else if (_boost.jumpsUsed < 2) {
      // double jump
      _boost.jumpsUsed = 2;
      _boost.active = true;
      _boost.timer = CFG.BOOST_DURATION;
      _boost.targetY = _player.position.y + CFG.DOUBLE_JUMP_HEIGHT;
      _suit.fuelPct -= CFG.FUEL_JETPACK_DRAIN * 0.5;
      if (_suit.fuelPct < 0) _suit.fuelPct = 0;
      if (_boost.light) _boost.light.intensity = 2;
    }
  }

  function _updateBoost(dt) {
    if (!_boost.active || !_player) return;
    _boost.timer -= dt;
    var t = 1.0 - Math.max(0, _boost.timer / CFG.BOOST_DURATION);
    _player.position.y = _lerp(_player.position.y, _boost.targetY, Math.min(1, t * 3));
    if (_boost.timer <= 0) {
      _boost.active = false;
      if (_boost.light) _boost.light.intensity = 0;
    }
  }

  function _updateFall(dt) {
    if (!_player) return;
    var groundY = 1.0 * CFG.SCALE_ACTIVE;
    if (!_boost.active && _player.position.y > groundY) {
      _player.position.y -= 9.8 * dt;
      if (_player.position.y <= groundY) {
        _player.position.y = groundY;
        if (!_boost.onGround) {
          _onLand();
        }
        _boost.onGround = true;
        _boost.jumpsUsed = 0;
      }
    } else if (_player.position.y <= groundY && !_boost.active) {
      _boost.onGround = true;
    }
  }

  function _onLand() {
    if (!_scene || !_player) return;
    // Shockwave
    var sgGeo = new THREE.SphereGeometry(1, 8, 8);
    var sgMat = new THREE.MeshLambertMaterial({ color: 0xFF4400, transparent: true, opacity: 0.7 });
    _boost.shockwaveMesh = new THREE.Mesh(sgGeo, sgMat);
    _boost.shockwaveMesh.position.copy(_player.position);
    _boost.shockwaveMesh.position.y = 0.5;
    _scene.add(_boost.shockwaveMesh);
    _boost.shockwaveActive = true;
    _boost.shockwaveR = 1;

    // Kill nearby enemies
    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive) continue;
      var d = _dist3(_player.position, en.pos);
      if (d < CFG.SHOCKWAVE_KILL_R) {
        _killEnemy(en, true);
      }
    }
    // Crush nearby obstacles
    for (var j = 0; j < _obstacles.length; j++) {
      var obs = _obstacles[j];
      if (!obs.alive) continue;
      var od = _dist3(_player.position, obs.pos);
      if (od < 3) {
        obs.alive = false;
        if (obs.mesh) _scene.remove(obs.mesh);
      }
    }
  }

  function _updateShockwave(dt) {
    if (!_boost.shockwaveActive || !_boost.shockwaveMesh) return;
    _boost.shockwaveR += CFG.SHOCKWAVE_SPEED * dt;
    _boost.shockwaveMesh.scale.setScalar(_boost.shockwaveR);
    if (_boost.shockwaveMesh.material) {
      _boost.shockwaveMesh.material.opacity = Math.max(0, 0.7 - _boost.shockwaveR / CFG.SHOCKWAVE_MAX_R * 0.7);
    }
    if (_boost.shockwaveR >= CFG.SHOCKWAVE_MAX_R) {
      _scene.remove(_boost.shockwaveMesh);
      if (_boost.shockwaveMesh.geometry) _boost.shockwaveMesh.geometry.dispose();
      if (_boost.shockwaveMesh.material) _boost.shockwaveMesh.material.dispose();
      _boost.shockwaveMesh = null;
      _boost.shockwaveActive = false;
    }
  }

  /* ── Power Fist ───────────────────────────────── */
  function _tryPowerFist() {
    if (!_activated || _fist.active) return;
    if (_suit.sysFailType === 0 && _suit.subsystemBroken) return; // left arm offline
    _fist.active = true;
    _fist.timer = CFG.FIST_DURATION;
    if (_fist.mesh) {
      _fist.mesh.visible = true;
      _fist.baseZ = _fist.mesh.position.z;
    }
    // Kill enemies in range
    if (_player) {
      for (var i = 0; i < _enemies.length; i++) {
        var en = _enemies[i];
        if (!en.alive) continue;
        var d = _dist3(_player.position, en.pos);
        if (d < CFG.FIST_RANGE) {
          en.flying = true;
          en.flyTimer = 0.8;
          en.velocity.y = CFG.FIST_FLY_Y;
          en.hp -= 999;
          if (en.hp <= 0) _killEnemy(en, false);
        }
      }
    }
  }

  function _updateFist(dt) {
    if (!_fist.active || !_fist.mesh) return;
    _fist.timer -= dt;
    var progress = 1.0 - _fist.timer / CFG.FIST_DURATION;
    if (_fist.timer > 0) {
      _fist.mesh.position.z = _fist.baseZ - 3 * Math.sin(progress * Math.PI);
    } else {
      _fist.active = false;
      _fist.mesh.visible = false;
      _fist.mesh.position.z = _fist.baseZ;
    }
  }

  /* ── Gatling Arm ──────────────────────────────── */
  function _updateGatling(dt, gKeyDown) {
    if (!_activated) return;
    if (_suit.sysFailType === 2 && _suit.subsystemBroken) {
      gKeyDown = false; // jammed
    }

    if (gKeyDown && !_gatling.overheated && _suit.fuelPct > 0) {
      _gatling.active = true;
      _gatling.heatTimer += dt;
      _suit.fuelPct -= CFG.FUEL_GATLING_DRAIN * dt;
      if (_suit.fuelPct < 0) _suit.fuelPct = 0;

      if (_gatling.heatTimer >= CFG.GATLING_OVERHEAT_TIME) {
        _gatling.overheated = true;
        _gatling.heatTimer = CFG.GATLING_OVERHEAT_TIME;
      }

      // Spin barrel
      _gatling.spinAngle += 15 * dt;
      if (_gatling.barrelMesh) _gatling.barrelMesh.rotation.x = _gatling.spinAngle;

      // Overheat light pulse
      if (_gatling.overheatLight) {
        var pulse = (Math.sin(Date.now() * 0.01) + 1) * 0.5;
        _gatling.overheatLight.intensity = _gatling.overheated ? (1 + pulse) : (_gatling.heatTimer / CFG.GATLING_OVERHEAT_TIME) * 0.5;
      }

      // Fire bullets
      _gatling.fireTimer += dt;
      var interval = 1.0 / CFG.GATLING_RPS;
      while (_gatling.fireTimer >= interval) {
        _gatling.fireTimer -= interval;
        _spawnBullet();
      }
    } else {
      _gatling.active = false;
      if (!_gatling.overheated) {
        _gatling.heatTimer = Math.max(0, _gatling.heatTimer - dt * 0.5);
      } else {
        // cool down after overheat
        _gatling.heatTimer -= dt * 0.3;
        if (_gatling.heatTimer <= 0) {
          _gatling.overheated = false;
          _gatling.heatTimer = 0;
        }
      }
      if (_gatling.overheatLight) _gatling.overheatLight.intensity = 0;
    }

    // Update bullets
    for (var i = _gatling.bullets.length - 1; i >= 0; i--) {
      var b = _gatling.bullets[i];
      b.pos.x += b.dir.x * CFG.GATLING_BULLET_SPEED * dt;
      b.pos.y += b.dir.y * CFG.GATLING_BULLET_SPEED * dt;
      b.pos.z += b.dir.z * CFG.GATLING_BULLET_SPEED * dt;
      if (b.mesh) b.mesh.position.set(b.pos.x, b.pos.y, b.pos.z);
      b.life -= dt;

      var hit = false;
      // Check enemy hits
      for (var j = 0; j < _enemies.length; j++) {
        var en = _enemies[j];
        if (!en.alive) continue;
        if (_dist3(b.pos, en.pos) < 1.2) {
          en.hp -= 8;
          if (en.hp <= 0) _killEnemy(en, false);
          hit = true;
          break;
        }
      }

      if (hit || b.life <= 0) {
        if (b.mesh) _removeMesh(b.mesh);
        _gatling.bullets.splice(i, 1);
      }
    }
  }

  function _spawnBullet() {
    if (!_scene || !_player) return;
    var bGeo = new THREE.SphereGeometry(CFG.GATLING_BULLET_R, 4, 4);
    var bMat = new THREE.MeshLambertMaterial({ color: 0xFFDD00 });
    var bMesh = new THREE.Mesh(bGeo, bMat);

    var px = _player.position.x + 1.9;
    var py = _player.position.y + 0.2;
    var pz = _player.position.z;

    bMesh.position.set(px, py, pz);
    _scene.add(bMesh);

    // Direction: forward from player
    var dir = { x: 0, y: 0, z: -1 };
    if (_camera) {
      var camDir = new THREE.Vector3();
      _camera.getWorldDirection(camDir);
      dir.x = camDir.x;
      dir.y = camDir.y;
      dir.z = camDir.z;
    }
    // Add small spread
    dir.x += (Math.random() - 0.5) * 0.05;
    dir.y += (Math.random() - 0.5) * 0.05;
    var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
    dir.x /= len; dir.y /= len; dir.z /= len;

    _gatling.bullets.push({
      mesh: bMesh,
      pos: { x: px, y: py, z: pz },
      dir: dir,
      life: 1.5
    });
  }

  /* ── Missiles ─────────────────────────────────── */
  function _tryFireMissile() {
    if (!_activated || _suit.missiles <= 0 || !_player || !_scene) return;
    _suit.missiles--;

    // Find nearest alive enemy
    var nearest = null;
    var nearDist = Infinity;
    for (var i = 0; i < _enemies.length; i++) {
      if (!_enemies[i].alive) continue;
      var d = _dist3(_player.position, _enemies[i].pos);
      if (d < nearDist) { nearDist = d; nearest = _enemies[i]; }
    }

    // Fire 3 missiles in a spread
    for (var m = 0; m < 3; m++) {
      var mGeo = new THREE.SphereGeometry(0.22, 6, 6);
      var mMat = new THREE.MeshLambertMaterial({ color: 0xFF8800, emissive: 0xCC4400 });
      var mMesh = new THREE.Mesh(mGeo, mMat);
      var offset = (m - 1) * 0.5;
      var spawnX = _player.position.x + 0.95 + offset;
      var spawnY = _player.position.y + 0.8;
      var spawnZ = _player.position.z;
      mMesh.position.set(spawnX, spawnY, spawnZ);
      _scene.add(mMesh);

      var initDir = { x: offset * 0.3, y: 0.2, z: -1 };
      var il = Math.sqrt(initDir.x * initDir.x + initDir.y * initDir.y + initDir.z * initDir.z);
      initDir.x /= il; initDir.y /= il; initDir.z /= il;

      _missiles.list.push({
        mesh: mMesh,
        pos: { x: spawnX, y: spawnY, z: spawnZ },
        dir: initDir,
        target: nearest,
        life: 4.0
      });
    }
  }

  function _updateMissiles(dt) {
    for (var i = _missiles.list.length - 1; i >= 0; i--) {
      var ms = _missiles.list[i];
      ms.life -= dt;

      // Homing
      if (ms.target && ms.target.alive) {
        var tx = ms.target.pos.x - ms.pos.x;
        var ty = ms.target.pos.y - ms.pos.y;
        var tz = ms.target.pos.z - ms.pos.z;
        var tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
        if (tl > 0.01) {
          tx /= tl; ty /= tl; tz /= tl;
          ms.dir.x = _lerp(ms.dir.x, tx, CFG.MISSILE_TURN_RATE * dt);
          ms.dir.y = _lerp(ms.dir.y, ty, CFG.MISSILE_TURN_RATE * dt);
          ms.dir.z = _lerp(ms.dir.z, tz, CFG.MISSILE_TURN_RATE * dt);
          var ml = Math.sqrt(ms.dir.x * ms.dir.x + ms.dir.y * ms.dir.y + ms.dir.z * ms.dir.z);
          ms.dir.x /= ml; ms.dir.y /= ml; ms.dir.z /= ml;
        }
      }

      ms.pos.x += ms.dir.x * CFG.MISSILE_SPEED * dt;
      ms.pos.y += ms.dir.y * CFG.MISSILE_SPEED * dt;
      ms.pos.z += ms.dir.z * CFG.MISSILE_SPEED * dt;
      if (ms.mesh) ms.mesh.position.set(ms.pos.x, ms.pos.y, ms.pos.z);

      var explode = false;
      // Hit detection
      for (var j = 0; j < _enemies.length; j++) {
        var en = _enemies[j];
        if (!en.alive) continue;
        if (_dist3(ms.pos, en.pos) < 2.0) {
          en.hp -= 60;
          if (en.hp <= 0) _killEnemy(en, false);
          explode = true;
          break;
        }
      }

      if (explode || ms.life <= 0) {
        if (ms.mesh) _removeMesh(ms.mesh);
        _missiles.list.splice(i, 1);
      }
    }
  }

  /* ── Enemy logic ──────────────────────────────── */
  function _killEnemy(en, withFly) {
    en.alive = false;
    en.hp = 0;
    if (withFly) {
      en.flying = true;
      en.flyTimer = 1.0;
      en.velocity.y = 5;
    }
    if (en.mesh && _scene) {
      _scene.remove(en.mesh);
    }
  }

  function _updateEnemies(dt) {
    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive) continue;

      // Flying arc after fist hit
      if (en.flying) {
        en.flyTimer -= dt;
        en.velocity.y -= 9.8 * dt;
        en.pos.y += en.velocity.y * dt;
        if (en.pos.y <= 0 || en.flyTimer <= 0) {
          en.pos.y = 0;
          en.flying = false;
          en.velocity.y = 0;
          _killEnemy(en, false);
          continue;
        }
        if (en.mesh) en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
        continue;
      }

      // AI: move toward player, shoot
      if (_player) {
        var pdx = _player.position.x - en.pos.x;
        var pdz = _player.position.z - en.pos.z;
        var pDist = Math.sqrt(pdx * pdx + pdz * pdz);

        if (pDist > 6) {
          var speed = en.type === 'mech_boss' ? 2.5 : 3.5;
          en.pos.x += (pdx / pDist) * speed * dt;
          en.pos.z += (pdz / pDist) * speed * dt;
          if (en.mesh) en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
        }

        en.shootTimer -= dt;
        if (en.shootTimer <= 0) {
          var shootInterval = en.type === 'rpg' ? CFG.RPG_INTERVAL : (2 + Math.random() * 2);
          en.shootTimer = shootInterval;
          if (pDist < 20) {
            _enemyShoot(en, pDist);
          }
        }
      }
    }
  }

  function _enemyShoot(en, dist) {
    if (!_activated) return;
    var dmg = en.type === 'rpg' ? 40 : (en.type === 'mech_boss' ? 25 : 10);
    if (dist < 20) {
      _takeDamage(dmg);
    }
  }

  /* ── Damage / Armor ───────────────────────────── */
  function _takeDamage(rawDmg) {
    if (!_activated) return;
    _suit.armorLastHitTimer = 0;
    var armorDmg = rawDmg * CFG.ARMOR_ABSORB;
    var throughDmg = rawDmg - armorDmg;
    _suit.armorHP = Math.max(0, _suit.armorHP - armorDmg);
    _suit.totalDamageTaken += armorDmg;

    // Check subsystem failure
    if (_suit.totalDamageTaken >= CFG.SUBSYSTEM_DAMAGE_THRESHOLD && !_suit.subsystemBroken) {
      _suit.subsystemBroken = true;
      _suit.sysFailTimer = CFG.SUBSYSTEM_FAIL_DURATION;
      _suit.sysFailType = Math.floor(Math.random() * 3);
      var failNames = ['LEFT ARM OFFLINE', 'JUMP DEGRADED', 'GATLING JAMMED'];
      _suit.systemStatus = failNames[_suit.sysFailType];
    }

    // Remaining damage goes to player
    if (throughDmg > 0.5 && typeof Game !== 'undefined' && Game.takeDamage) {
      Game.takeDamage(Math.round(throughDmg));
    }
  }

  function _updateArmorRegen(dt) {
    _suit.armorLastHitTimer += dt;
    if (_suit.armorLastHitTimer >= CFG.ARMOR_REGEN_DELAY && _suit.armorHP < CFG.ARMOR_MAX) {
      _suit.armorHP = Math.min(CFG.ARMOR_MAX, _suit.armorHP + CFG.ARMOR_REGEN_RATE * dt);
    }
  }

  function _updateSubsystem(dt) {
    if (!_suit.subsystemBroken) return;
    _suit.sysFailTimer -= dt;
    if (_suit.sysFailTimer <= 0) {
      _suit.subsystemBroken = false;
      _suit.sysFailType = -1;
      _suit.systemStatus = 'NOMINAL';
      _suit.totalDamageTaken = 0;
    }
  }

  /* ── Momentum Movement ───────────────────────── */
  function _updateMovement(dt) {
    if (!_activated || !_player) return;
    var targetVX = 0, targetVZ = 0;
    var speed = CFG.MAX_SPEED;

    if (_keys['KeyW'] || _keys['ArrowUp'])    targetVZ = -speed;
    if (_keys['KeyS'] || _keys['ArrowDown'])  targetVZ =  speed;
    if (_keys['KeyA'] || _keys['ArrowLeft'])  targetVX = -speed;
    if (_keys['KeyD'] || _keys['ArrowRight']) targetVX =  speed;

    var lerpFactor = Math.min(1, CFG.MOMENTUM_LERP * dt);
    _velocity.x = _lerp(_velocity.x, targetVX, lerpFactor);
    _velocity.z = _lerp(_velocity.z, targetVZ, lerpFactor);

    _player.position.x += _velocity.x * dt;
    _player.position.z += _velocity.z * dt;

    // Clamp to arena
    var half = CFG.ARENA_SIZE * 0.5;
    _player.position.x = _clamp(_player.position.x, -half, half);
    _player.position.z = _clamp(_player.position.z, -half, half);

    // Crush obstacles when walking through
    for (var i = 0; i < _obstacles.length; i++) {
      var obs = _obstacles[i];
      if (!obs.alive) continue;
      var od = _dist3(_player.position, obs.pos);
      if (od < 1.8) {
        obs.alive = false;
        if (obs.mesh && _scene) _scene.remove(obs.mesh);
      }
    }
  }

  /* ── Fuel Cells ───────────────────────────────── */
  function _updateFuelCells(dt) {
    if (!_player) return;
    for (var i = 0; i < _fuelCells.length; i++) {
      var fc = _fuelCells[i];
      if (fc.collected) continue;
      if (_dist3(_player.position, fc.pos) < 1.5) {
        fc.collected = true;
        if (fc.mesh && _scene) _scene.remove(fc.mesh);
        _suit.fuelPct = Math.min(CFG.FUEL_MAX, _suit.fuelPct + CFG.FUEL_CELL_RESTORE);
      }
      // Gentle bob animation
      if (fc.mesh) {
        fc.mesh.rotation.y += dt * 1.5;
        fc.mesh.position.y = fc.pos.y + Math.sin(Date.now() * 0.002) * 0.15;
      }
    }
  }

  /* ── Activation / Deactivation ───────────────── */
  function _activate() {
    if (_activated) return;
    _activated = true;
    _suit.armorHP = CFG.ARMOR_MAX;
    _suit.fuelPct = 100;
    _suit.missiles = CFG.MISSILE_COUNT;
    _suit.systemStatus = 'NOMINAL';
    _suit.subsystemBroken = false;
    _suit.totalDamageTaken = 0;
    _buildSuitMesh();
    _buildArena();
    _buildEnemies();
    if (_hudEl) _hudEl.style.display = 'block';
  }

  function _deactivate() {
    if (!_activated) return;
    _activated = false;
    _teardownSuitMesh();
    if (_hudEl) _hudEl.style.display = 'none';
  }

  /* ── Key handlers ────────────────────────────── */
  function _onKeyDown(e) {
    _keys[e.code] = true;

    if (e.code === 'KeyX') _xPressTime = Date.now() * 0.001;
    if (e.code === 'KeyS') _sPressTime = Date.now() * 0.001;

    // Activation: X+S within 400ms
    if (!_activated) {
      var xGap = Math.abs((_xPressTime) - (_sPressTime));
      if ((e.code === 'KeyS' || e.code === 'KeyX') && xGap < CFG.ACTIVATION_WINDOW && xGap >= 0) {
        _activate();
        return;
      }
    }

    if (!_activated) return;

    if (e.code === 'Space') {
      e.preventDefault();
      _tryBoostJump();
    }
    if (e.code === 'KeyF') _tryPowerFist();
    if (e.code === 'KeyM') _tryFireMissile();
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  /* ── Init ─────────────────────────────────────── */
  function init(scene, player, camera) {
    _scene = scene || _scene;
    _player = player || _player;
    _camera = camera || _camera;
    _buildHUD();
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
  }

  /* ── Update (call every frame) ───────────────── */
  function update(dt) {
    if (!dt || dt > 0.2) dt = 0.016;

    // Check for activation combo (time-based)
    if (!_activated && _xPressTime > 0 && _sPressTime > 0) {
      var gap = Math.abs(_xPressTime - _sPressTime);
      if (gap < CFG.ACTIVATION_WINDOW) {
        _activate();
      }
    }

    if (!_activated) {
      _updateHUD();
      return;
    }

    _updateMovement(dt);
    _updateBoost(dt);
    _updateFall(dt);
    _updateShockwave(dt);
    _updateFist(dt);
    _updateGatling(dt, !!_keys['KeyG']);
    _updateMissiles(dt);
    _updateEnemies(dt);
    _updateArmorRegen(dt);
    _updateSubsystem(dt);
    _updateFuelCells(dt);
    _updateHUD();
  }

  /* ── Reset ────────────────────────────────────── */
  function reset() {
    _deactivate();
    _xPressTime = -9999;
    _sPressTime = -9999;
    _keys = {};
    _velocity = { x: 0, z: 0 };
    _boost = {
      active: false, timer: 0, jumpsUsed: 0, onGround: true,
      light: null, shockwaveActive: false, shockwaveMesh: null, shockwaveR: 1
    };
    _fist = { active: false, timer: 0, mesh: null, baseZ: 0 };
    _gatling = {
      active: false, heatTimer: 0, overheated: false, overheatLight: null,
      spinAngle: 0, fireTimer: 0, barrelMesh: null, bullets: []
    };
    _missiles = { list: [], podMesh: null };
    _suit = {
      armorHP: CFG.ARMOR_MAX, fuelPct: 100, missiles: CFG.MISSILE_COUNT,
      systemStatus: 'NOMINAL', sysFailTimer: 0, sysFailType: 0,
      armorLastHitTimer: 0, totalDamageTaken: 0, subsystemBroken: false
    };
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].mesh && _scene) _scene.remove(_enemies[i].mesh);
    }
    _enemies = [];
    for (var j = 0; j < _obstacles.length; j++) {
      if (_obstacles[j].mesh && _scene) _scene.remove(_obstacles[j].mesh);
    }
    _obstacles = [];
    for (var k = 0; k < _fuelCells.length; k++) {
      if (_fuelCells[k].mesh && _scene) _scene.remove(_fuelCells[k].mesh);
    }
    _fuelCells = [];
    _arenaBuilt = false;
    _updateHUD();
  }

  /* ── Public API ───────────────────────────────── */
  return {
    init: init,
    update: update,
    reset: reset,
    isActive: function () { return _activated; },
    takeDamage: _takeDamage,
    getArmorHP: function () { return _suit.armorHP; },
    getFuel: function () { return _suit.fuelPct; },
    getMissiles: function () { return _suit.missiles; }
  };
})();
