/* ───────────────────────────────────────────────────────────────────────────
   volcano-assault.js — Volcano Assault: infiltrate the enemy base carved into
   a volcano, destroy the reactor, and escape before the caldera collapses
   API: window.VolcanoAssault = { init, update, reset }
   Controls:
     V + A (simultaneous, within 400ms) → activate module
     E                                  → interact (pumps, zipline, extraction)
     C4 key (C)                         → plant C4 on reactor (after all pumps disabled)
   ─────────────────────────────────────────────────────────────────────────── */
window.VolcanoAssault = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;
  var _player = null;

  /* ── Module state ──────────────────────────────────────────────────────── */
  var _active          = false;
  var _disposed        = false;

  /* ── Key tracking ──────────────────────────────────────────────────────── */
  var _keysDown        = {};
  var _vPressTime      = -9999;
  var _aPressTime      = -9999;
  var ACTIVATION_WINDOW = 0.4; // 400ms

  /* ── Environment ───────────────────────────────────────────────────────── */
  var _volcanoMesh     = null;
  var _lavaLake        = null;
  var _fog             = null;
  var _ambientLight    = null;

  /* ── Enemy base ────────────────────────────────────────────────────────── */
  var _entrance        = null;
  var _weaponsLab      = null;
  var _commandCenter   = null;
  var _reactorRoom     = null;

  /* ── Lava hazards ──────────────────────────────────────────────────────── */
  var _eruptionTimer   = 0;
  var ERUPTION_INTERVAL = 45;
  var _lavaBombs       = [];         // { mesh, vx, vy, vz, exploded }
  var _lavaChannels    = [];         // { mesh, bounds }
  var _coolantPacks    = [];         // { mesh, active }
  var _coolantImmunity = 0;          // seconds remaining
  var _lavaChannelDmgTimer = 0;

  /* ── Eruption / collapse ─────────────────────────────────────────────────*/
  var _eruptionActive  = false;
  var _eruptionCountdown = 0;
  var ERUPTION_DURATION  = 90;
  var _lavaRiseRate    = 0.2;        // units/s during eruption
  var _lavaBaseY       = -16;        // starting Y of lava lake during eruption

  /* ── Soldiers ──────────────────────────────────────────────────────────── */
  var _soldiers        = [];         // { mesh, hp, flamethrower, ftCone, angle, speed, alive }
  var SOLDIER_COUNT    = 14;
  var _flamethrowerCooldown = [];

  /* ── Bridges ─────────────────────────────────────────────────────────────*/
  var _bridges         = [];         // { mesh, hp, collapsed, pos }

  /* ── Pumps ───────────────────────────────────────────────────────────────*/
  var _pumps           = [];         // { mesh, disabled, pos }
  var _pumpsDisabled   = 0;

  /* ── Reactor ─────────────────────────────────────────────────────────────*/
  var _reactor         = null;
  var _reactorActive   = true;
  var _c4Planted       = false;
  var _c4Timer         = 0;
  var C4_DETONATION_DELAY = 5;

  /* ── Zipline / extraction ────────────────────────────────────────────────*/
  var _ziplinePulley   = null;
  var _extractionZone  = null;
  var _ziplining       = false;
  var _ziplineProgress = 0;
  var ZIPLINE_SPEED    = 0.4; // progress per second

  /* ── HUD ─────────────────────────────────────────────────────────────────*/
  var _hudEl           = null;

  /* ── Explosion particles ─────────────────────────────────────────────────*/
  var _particles       = [];         // { mesh, vx, vy, vz, life, maxLife }

  /* ══════════════════════════════════════════════════════════════════════════
     UTILITY
     ══════════════════════════════════════════════════════════════════════════ */
  function _makeMesh (geo, mat) {
    return new THREE.Mesh(geo, mat);
  }

  function _dist2 (a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return dx * dx + dz * dz;
  }

  function _clamp (v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD
     ══════════════════════════════════════════════════════════════════════════ */
  function _ensureHUD () {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'volcano-assault-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(20,0,0,0.75)',
      'color:#FF8844',
      'font-family:"Courier New",monospace',
      'font-size:13px',
      'font-weight:bold',
      'padding:6px 14px',
      'border:1px solid #882200',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'letter-spacing:1px',
      'z-index:9999'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD () {
    if (!_hudEl) return;
    if (!_active) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';

    var eruptStr  = _eruptionActive
      ? 'ERUPTION: ' + Math.ceil(_eruptionCountdown) + 's'
      : 'STABLE';
    var immuneStr = _coolantImmunity > 0
      ? ' [COOLANT IMMUNITY: ' + Math.ceil(_coolantImmunity) + 's]'
      : '';
    var pumpsStr  = ' [PUMPS DISABLED: ' + _pumpsDisabled + '/3]';
    var reactStr  = ' [REACTOR: ' + (_reactorActive ? 'ACTIVE' : 'DESTROYED') + ']';
    var soldierCount = 0;
    for (var i = 0; i < _soldiers.length; i++) {
      if (_soldiers[i].alive) soldierCount++;
    }
    var soldStr   = ' [SOLDIERS: ' + soldierCount + ']';

    _hudEl.innerHTML = 'VOLCANO [' + eruptStr + ']' + immuneStr + pumpsStr + reactStr + soldStr;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENVIRONMENT BUILD
     ══════════════════════════════════════════════════════════════════════════ */
  function _buildEnvironment () {
    /* Fog */
    _fog = new THREE.FogExp2(0xFF2200, 0.02);
    _scene.fog = _fog;

    /* Ambient point light from below */
    _ambientLight = new THREE.PointLight(0xFF4400, 2.0, 80);
    _ambientLight.position.set(0, -15, 0);
    _scene.add(_ambientLight);

    /* Volcano caldera — open cylinder (cone shape approximated) */
    var calderaMat = new THREE.MeshLambertMaterial({ color: 0x662211, side: THREE.DoubleSide });
    var calderaGeo = new THREE.CylinderGeometry(30, 5, 40, 24, 1, true);
    _volcanoMesh = _makeMesh(calderaGeo, calderaMat);
    _volcanoMesh.position.set(0, 0, 0);
    _scene.add(_volcanoMesh);

    /* Lava lake at bottom */
    var lavaMat = new THREE.MeshLambertMaterial({
      color: 0xFF4400,
      emissive: new THREE.Color(0xFF4400),
      emissiveIntensity: 1.0
    });
    var lavaGeo = new THREE.PlaneGeometry(30, 30);
    _lavaLake = _makeMesh(lavaGeo, lavaMat);
    _lavaLake.rotation.x = -Math.PI / 2;
    _lavaLake.position.set(0, _lavaBaseY, 0);
    _scene.add(_lavaLake);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENEMY BASE BUILD
     ══════════════════════════════════════════════════════════════════════════ */
  function _buildEnemyBase () {
    /* Entrance */
    var entMat = new THREE.MeshLambertMaterial({ color: 0x443322 });
    var entGeo = new THREE.BoxGeometry(12, 8, 6);
    _entrance = _makeMesh(entGeo, entMat);
    _entrance.position.set(0, -2, -22);
    _scene.add(_entrance);

    /* Weapons lab */
    var labMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var labGeo = new THREE.BoxGeometry(20, 6, 15);
    _weaponsLab = _makeMesh(labGeo, labMat);
    _weaponsLab.position.set(0, -5, -15);
    _scene.add(_weaponsLab);

    /* Command center */
    var ccMat = new THREE.MeshLambertMaterial({ color: 0x223322 });
    var ccGeo = new THREE.BoxGeometry(15, 5, 12);
    _commandCenter = _makeMesh(ccGeo, ccMat);
    _commandCenter.position.set(8, -8, -8);
    _scene.add(_commandCenter);

    /* Reactor room — lowest level near lava */
    var rrMat = new THREE.MeshLambertMaterial({ color: 0x332211 });
    var rrGeo = new THREE.BoxGeometry(10, 8, 10);
    _reactorRoom = _makeMesh(rrGeo, rrMat);
    _reactorRoom.position.set(0, -12, 0);
    _scene.add(_reactorRoom);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     LAVA CHANNELS
     ══════════════════════════════════════════════════════════════════════════ */
  function _buildLavaChannels () {
    var positions = [
      { x: -8, y: -10, z: -4 },
      { x:  0, y: -10, z: -2 },
      { x:  8, y: -10, z: -4 }
    ];
    var chanMat = new THREE.MeshLambertMaterial({
      color: 0xFF3300,
      emissive: new THREE.Color(0xFF3300),
      emissiveIntensity: 0.8
    });
    for (var i = 0; i < positions.length; i++) {
      var geo = new THREE.BoxGeometry(2, 0.3, 8);
      var mesh = _makeMesh(geo, chanMat.clone());
      mesh.position.set(positions[i].x, positions[i].y, positions[i].z);
      _scene.add(mesh);
      _lavaChannels.push({
        mesh: mesh,
        pos: positions[i]
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ROPE BRIDGES
     ══════════════════════════════════════════════════════════════════════════ */
  function _buildBridges () {
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
    var bridgePositions = [
      { x: -8, y: -9.7, z: -4 },
      { x:  0, y: -9.7, z: -2 },
      { x:  8, y: -9.7, z: -4 }
    ];
    for (var i = 0; i < bridgePositions.length; i++) {
      var geo = new THREE.BoxGeometry(1, 0.4, 8);
      var mesh = _makeMesh(geo, bridgeMat.clone());
      mesh.position.set(bridgePositions[i].x, bridgePositions[i].y, bridgePositions[i].z);
      _scene.add(mesh);
      _bridges.push({
        mesh: mesh,
        hp: 100,
        collapsed: false,
        pos: { x: bridgePositions[i].x, y: bridgePositions[i].y, z: bridgePositions[i].z }
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     COOLANT PUMPS
     ══════════════════════════════════════════════════════════════════════════ */
  function _buildPumps () {
    var pumpMat = new THREE.MeshLambertMaterial({ color: 0x44AAFF });
    var pumpPositions = [
      { x: -5, y: -11, z: 2 },
      { x:  0, y: -11, z: 4 },
      { x:  5, y: -11, z: 2 }
    ];
    for (var i = 0; i < pumpPositions.length; i++) {
      var geo = new THREE.CylinderGeometry(0.6, 0.6, 3, 10);
      var mesh = _makeMesh(geo, pumpMat.clone());
      mesh.position.set(pumpPositions[i].x, pumpPositions[i].y, pumpPositions[i].z);
      _scene.add(mesh);
      _pumps.push({
        mesh: mesh,
        disabled: false,
        pos: { x: pumpPositions[i].x, y: pumpPositions[i].y, z: pumpPositions[i].z }
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     REACTOR
     ══════════════════════════════════════════════════════════════════════════ */
  function _buildReactor () {
    var reactMat = new THREE.MeshLambertMaterial({
      color: 0xFF4400,
      emissive: new THREE.Color(0xFF4400),
      emissiveIntensity: 0.5
    });
    var reactGeo = new THREE.CylinderGeometry(2, 2, 6, 16);
    _reactor = _makeMesh(reactGeo, reactMat);
    _reactor.position.set(0, -10, 0);
    _scene.add(_reactor);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     COOLANT PACK PICKUPS
     ══════════════════════════════════════════════════════════════════════════ */
  function _buildCoolantPacks () {
    var packMat = new THREE.MeshLambertMaterial({ color: 0x44AAFF });
    var packPositions = [
      { x: -12, y: -6, z: -10 },
      { x:  12, y: -6, z: -10 },
      { x:   0, y: -3, z: -18 }
    ];
    for (var i = 0; i < packPositions.length; i++) {
      var geo = new THREE.BoxGeometry(1, 1, 1);
      var mesh = _makeMesh(geo, packMat.clone());
      mesh.position.set(packPositions[i].x, packPositions[i].y, packPositions[i].z);
      _scene.add(mesh);
      _coolantPacks.push({
        mesh: mesh,
        active: true
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ZIPLINE & EXTRACTION
     ══════════════════════════════════════════════════════════════════════════ */
  function _buildZiplineAndExtraction () {
    /* Pulley at top rim */
    var pulleyMat = new THREE.MeshLambertMaterial({ color: 0x888844 });
    var pulleyGeo = new THREE.BoxGeometry(2, 1, 2);
    _ziplinePulley = _makeMesh(pulleyGeo, pulleyMat);
    _ziplinePulley.position.set(28, 19, 0);
    _scene.add(_ziplinePulley);

    /* Zipline cable — simple line */
    var points = [
      new THREE.Vector3(28, 19, 0),
      new THREE.Vector3(50, 5, 0)
    ];
    var lineMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    var cable = new THREE.Line(lineGeo, lineMat);
    _scene.add(cable);

    /* Extraction zone outside volcano */
    var extMat = new THREE.MeshLambertMaterial({ color: 0x00FF44 });
    var extGeo = new THREE.BoxGeometry(6, 1, 6);
    _extractionZone = _makeMesh(extGeo, extMat);
    _extractionZone.position.set(50, 4, 0);
    _scene.add(_extractionZone);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SOLDIERS
     ══════════════════════════════════════════════════════════════════════════ */
  function _buildSoldiers () {
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x884422 });
    var ftMat   = new THREE.MeshLambertMaterial({ color: 0x884422 });

    var spawnPositions = [
      { x: -6,  z: -20 }, { x:  6, z: -20 },
      { x: -10, z: -12 }, { x: 10, z: -12 },
      { x: -8,  z: -6  }, { x:  8, z: -6  },
      { x: -4,  z:  0  }, { x:  4, z:  0  },
      { x: -6,  z:  6  }, { x:  6, z:  6  },
      { x: -3,  z: -16 }, { x:  3, z: -16 },
      { x: -9,  z:  2  }, { x:  9, z:  2  }
    ];

    for (var i = 0; i < SOLDIER_COUNT; i++) {
      var group = new THREE.Group();

      /* Body */
      var bodyGeo = new THREE.BoxGeometry(1, 2, 1);
      var body = _makeMesh(bodyGeo, bodyMat.clone());
      group.add(body);

      /* Head */
      var headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      var head = _makeMesh(headGeo, bodyMat.clone());
      head.position.set(0, 1.3, 0);
      group.add(head);

      var hasFlamethrower = (i % 3 === 0); // every 3rd soldier gets a flamethrower
      var ftCone = null;
      if (hasFlamethrower) {
        var ftGeo = new THREE.CylinderGeometry(0.1, 0.8, 8, 8);
        ftCone = _makeMesh(ftGeo, ftMat.clone());
        ftCone.rotation.z = Math.PI / 2;
        ftCone.position.set(5, 0, 0);
        group.add(ftCone);
      }

      var sp = spawnPositions[i] || { x: 0, z: 0 };
      group.position.set(sp.x, -6, sp.z);

      _scene.add(group);
      _soldiers.push({
        mesh: group,
        hp: 100,
        flamethrower: hasFlamethrower,
        ftCone: ftCone,
        angle: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 0.5,
        alive: true,
        ftCooldown: 0
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ERUPTION — lava bombs
     ══════════════════════════════════════════════════════════════════════════ */
  function _triggerEruption () {
    var bombMat = new THREE.MeshLambertMaterial({
      color: 0xFF4400,
      emissive: new THREE.Color(0xFF4400),
      emissiveIntensity: 0.8
    });
    for (var i = 0; i < 6; i++) {
      var geo = new THREE.SphereGeometry(0.8, 8, 8);
      var mesh = _makeMesh(geo, bombMat.clone());
      var angle = Math.random() * Math.PI * 2;
      var radius = Math.random() * 20;
      mesh.position.set(
        Math.cos(angle) * radius,
        -10,
        Math.sin(angle) * radius
      );
      _scene.add(mesh);
      _lavaBombs.push({
        mesh: mesh,
        vx: (Math.random() - 0.5) * 8,
        vy: 15 + Math.random() * 5,
        vz: (Math.random() - 0.5) * 8,
        exploded: false
      });
    }
  }

  function _spawnExplosionParticles (pos) {
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    for (var i = 0; i < 8; i++) {
      var geo = new THREE.SphereGeometry(0.2, 4, 4);
      var mesh = _makeMesh(geo, mat.clone());
      mesh.position.copy(pos);
      _scene.add(mesh);
      _particles.push({
        mesh: mesh,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 1,
        vz: (Math.random() - 0.5) * 6,
        life: 1.5,
        maxLife: 1.5
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INTERACTION — E key
     ══════════════════════════════════════════════════════════════════════════ */
  function _handleInteract () {
    if (!_active || !_player) return;
    var pp = _player.position;

    /* Check coolant pumps */
    for (var i = 0; i < _pumps.length; i++) {
      var pump = _pumps[i];
      if (!pump.disabled) {
        var d2 = _dist2(pp, pump.pos);
        if (d2 < 16) {
          pump.disabled = true;
          _pumpsDisabled++;
          pump.mesh.material.color.setHex(0x223344);
          pump.mesh.material.emissiveIntensity = 0;
          break;
        }
      }
    }

    /* Check zipline */
    if (!_ziplining && _ziplinePulley) {
      var zd2 = _dist2(pp, _ziplinePulley.position);
      if (zd2 < 16) {
        _ziplining = true;
        _ziplineProgress = 0;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     C4 PLANT
     ══════════════════════════════════════════════════════════════════════════ */
  function _handleC4 () {
    if (!_active || !_player || !_reactorActive) return;
    if (_pumpsDisabled < 3) return; // all pumps must be disabled first
    if (_c4Planted) return;
    if (!_reactor) return;
    var d2 = _dist2(_player.position, _reactor.position);
    if (d2 < 25) {
      _c4Planted = true;
      _c4Timer = C4_DETONATION_DELAY;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PLAYER DAMAGE HELPERS
     ══════════════════════════════════════════════════════════════════════════ */
  function _playerHP () {
    if (_player && typeof _player.hp === 'number') return _player.hp;
    return 100;
  }

  function _damagePlayer (amt) {
    if (!_player) return;
    if (typeof _player.hp === 'number') {
      _player.hp = Math.max(0, _player.hp - amt);
    }
    if (typeof _player.onDamage === 'function') {
      _player.onDamage(amt);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     UPDATE HELPERS
     ══════════════════════════════════════════════════════════════════════════ */
  function _updateLavaBombs (dt) {
    var GRAV = -9.8;
    for (var i = _lavaBombs.length - 1; i >= 0; i--) {
      var bomb = _lavaBombs[i];
      if (bomb.exploded) continue;

      bomb.vy += GRAV * dt;
      bomb.mesh.position.x += bomb.vx * dt;
      bomb.mesh.position.y += bomb.vy * dt;
      bomb.mesh.position.z += bomb.vz * dt;

      /* Hit ground / lava level */
      if (bomb.mesh.position.y <= _lavaLake.position.y + 1) {
        bomb.exploded = true;
        _spawnExplosionParticles(bomb.mesh.position.clone());

        /* Damage player in splash zone */
        if (_player && _coolantImmunity <= 0) {
          var d2 = _dist2(_player.position, bomb.mesh.position);
          if (d2 < 16) { /* r=4, r^2=16 */
            _damagePlayer(100);
          }
        }
        _scene.remove(bomb.mesh);
        _lavaBombs.splice(i, 1);
      }
    }
  }

  function _updateParticles (dt) {
    var GRAV = -9.8;
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        _scene.remove(p.mesh);
        _particles.splice(i, 1);
        continue;
      }
      p.vy += GRAV * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      var scale = p.life / p.maxLife;
      p.mesh.scale.setScalar(scale);
    }
  }

  function _updateLavaChannelDamage (dt) {
    if (!_player || _coolantImmunity > 0) return;
    _lavaChannelDmgTimer += dt;
    if (_lavaChannelDmgTimer < 1) return;
    _lavaChannelDmgTimer -= 1;

    var pp = _player.position;
    for (var i = 0; i < _lavaChannels.length; i++) {
      var ch = _lavaChannels[i];
      var dx = Math.abs(pp.x - ch.pos.x);
      var dz = Math.abs(pp.z - ch.pos.z);
      var dy = Math.abs(pp.y - ch.pos.y);
      if (dx < 1.5 && dz < 4.5 && dy < 2) {
        _damagePlayer(20);
        break;
      }
    }
  }

  function _updateCoolantPacks (dt) {
    if (!_player) return;
    var pp = _player.position;
    for (var i = 0; i < _coolantPacks.length; i++) {
      var pack = _coolantPacks[i];
      if (!pack.active) continue;
      var d2 = _dist2(pp, pack.mesh.position);
      if (d2 < 4) {
        pack.active = false;
        _scene.remove(pack.mesh);
        _coolantImmunity += 30;
      }
    }
    if (_coolantImmunity > 0) {
      _coolantImmunity -= dt;
      if (_coolantImmunity < 0) _coolantImmunity = 0;
    }
  }

  function _updateSoldiers (dt) {
    var pp = _player ? _player.position : null;
    for (var i = 0; i < _soldiers.length; i++) {
      var sol = _soldiers[i];
      if (!sol.alive) continue;

      /* Simple patrol */
      sol.angle += sol.speed * dt * 0.3;
      var radius = 6 + (i % 3) * 3;
      var baseX  = _soldiers[i].mesh.position.x;
      sol.mesh.position.x = baseX + Math.sin(sol.angle) * 0.5;
      sol.mesh.rotation.y = sol.angle;

      /* Flamethrower damage */
      if (sol.flamethrower && pp) {
        sol.ftCooldown -= dt;
        if (sol.ftCooldown <= 0) {
          var fd2 = _dist2(pp, sol.mesh.position);
          if (fd2 < 64) { /* range 8, 8^2=64 */
            _damagePlayer(5);
            sol.ftCooldown = 0.5;
          }
        }
      }

      /* Bridge damage — soldiers shoot at bridges */
      for (var b = 0; b < _bridges.length; b++) {
        var bridge = _bridges[b];
        if (!bridge.collapsed) {
          var bd2 = _dist2(sol.mesh.position, bridge.pos);
          if (bd2 < 100) {
            bridge.hp -= 1 * dt;
            if (bridge.hp <= 0) {
              bridge.collapsed = true;
              bridge.mesh.position.y -= 5;
              _scene.remove(bridge.mesh);
            }
          }
        }
      }
    }
  }

  function _updateReactor (dt) {
    if (!_c4Planted || !_reactorActive) return;
    _c4Timer -= dt;
    if (_c4Timer <= 0) {
      _reactorActive = false;
      _spawnExplosionParticles(_reactor.position.clone());
      _scene.remove(_reactor);
      _reactor = null;

      /* Start total eruption */
      _eruptionActive = true;
      _eruptionCountdown = ERUPTION_DURATION;
    }
  }

  function _updateEruption (dt) {
    if (!_eruptionActive) {
      /* Periodic minor eruption every 45s */
      _eruptionTimer += dt;
      if (_eruptionTimer >= ERUPTION_INTERVAL) {
        _eruptionTimer -= ERUPTION_INTERVAL;
        _triggerEruption();
      }
      return;
    }

    /* Full eruption after reactor destruction */
    _eruptionCountdown -= dt;
    if (_eruptionCountdown <= 0) {
      _eruptionActive = false;
      _eruptionCountdown = 0;
    }

    /* Rising lava */
    _lavaLake.position.y += _lavaRiseRate * dt;
    _ambientLight.position.y = _lavaLake.position.y + 1;

    /* Check if player falls into lava */
    if (_player && _player.position.y <= _lavaLake.position.y + 0.5 && _coolantImmunity <= 0) {
      _damagePlayer(1000); /* instant death */
    }

    /* Bomb volleys during full eruption */
    _eruptionTimer += dt;
    if (_eruptionTimer >= 5) {
      _eruptionTimer -= 5;
      _triggerEruption();
    }
  }

  function _updateZipline (dt) {
    if (!_ziplining || !_player) return;
    _ziplineProgress += ZIPLINE_SPEED * dt;
    if (_ziplineProgress >= 1) {
      _ziplineProgress = 1;
      _ziplining = false;
    }
    /* Interpolate player position along zipline */
    var startPos = _ziplinePulley.position;
    var endPos   = _extractionZone.position;
    _player.position.x = startPos.x + (endPos.x - startPos.x) * _ziplineProgress;
    _player.position.y = startPos.y + (endPos.y - startPos.y) * _ziplineProgress;
    _player.position.z = startPos.z + (endPos.z - startPos.z) * _ziplineProgress;

    /* Reached extraction zone */
    if (_ziplineProgress >= 1) {
      if (typeof _player.onExtraction === 'function') {
        _player.onExtraction();
      }
    }
  }

  function _updateReactorGlow (dt) {
    if (!_reactor) return;
    var t = Date.now() * 0.002;
    _reactor.material.emissiveIntensity = 0.4 + 0.3 * Math.sin(t);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INPUT
     ══════════════════════════════════════════════════════════════════════════ */
  function _onKeyDown (e) {
    var now = Date.now() / 1000;
    var key = e.key ? e.key.toLowerCase() : '';

    _keysDown[key] = true;

    /* Activation: V + A within 400ms */
    if (key === 'v') { _vPressTime = now; }
    if (key === 'a') { _aPressTime = now; }

    if (!_active) {
      var vAge = now - _vPressTime;
      var aAge = now - _aPressTime;
      if (vAge <= ACTIVATION_WINDOW && aAge <= ACTIVATION_WINDOW &&
          _keysDown['v'] && _keysDown['a']) {
        _activate();
      }
      return;
    }

    if (key === 'e') { _handleInteract(); }
    if (key === 'c') { _handleC4(); }
  }

  function _onKeyUp (e) {
    var key = e.key ? e.key.toLowerCase() : '';
    _keysDown[key] = false;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ACTIVATE / DEACTIVATE
     ══════════════════════════════════════════════════════════════════════════ */
  function _activate () {
    if (_active) return;
    _active = true;
    _buildEnvironment();
    _buildEnemyBase();
    _buildLavaChannels();
    _buildBridges();
    _buildPumps();
    _buildReactor();
    _buildCoolantPacks();
    _buildZiplineAndExtraction();
    _buildSoldiers();
    _ensureHUD();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════════════════════════ */
  function init (scene, camera, canvas, player) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;
    _player = player || null;

    _disposed = false;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _ensureHUD();
  }

  function update (dt) {
    if (!_active || _disposed) return;
    if (typeof dt !== 'number' || dt <= 0) dt = 0.016;

    _updateEruption(dt);
    _updateLavaBombs(dt);
    _updateParticles(dt);
    _updateLavaChannelDamage(dt);
    _updateCoolantPacks(dt);
    _updateSoldiers(dt);
    _updateReactor(dt);
    _updateZipline(dt);
    _updateReactorGlow(dt);
    _updateHUD();
  }

  function reset () {
    /* Remove all scene objects */
    var toRemove = [
      _volcanoMesh, _lavaLake, _entrance, _weaponsLab,
      _commandCenter, _reactorRoom, _reactor,
      _ziplinePulley, _extractionZone
    ];
    for (var i = 0; i < toRemove.length; i++) {
      if (toRemove[i] && _scene) _scene.remove(toRemove[i]);
    }
    if (_ambientLight && _scene) _scene.remove(_ambientLight);

    for (var j = 0; j < _lavaBombs.length; j++)   { if (_scene) _scene.remove(_lavaBombs[j].mesh); }
    for (var k = 0; k < _particles.length; k++)    { if (_scene) _scene.remove(_particles[k].mesh); }
    for (var l = 0; l < _lavaChannels.length; l++) { if (_scene) _scene.remove(_lavaChannels[l].mesh); }
    for (var m = 0; m < _bridges.length; m++)      { if (_scene) _scene.remove(_bridges[m].mesh); }
    for (var n = 0; n < _pumps.length; n++)         { if (_scene) _scene.remove(_pumps[n].mesh); }
    for (var o = 0; o < _coolantPacks.length; o++) { if (_scene) _scene.remove(_coolantPacks[o].mesh); }
    for (var p = 0; p < _soldiers.length; p++)     { if (_scene) _scene.remove(_soldiers[p].mesh); }

    if (_scene && _fog) _scene.fog = null;

    /* Reset state */
    _active            = false;
    _eruptionTimer     = 0;
    _eruptionActive    = false;
    _eruptionCountdown = 0;
    _lavaBaseY         = -16;
    _lavaBombs         = [];
    _particles         = [];
    _lavaChannels      = [];
    _bridges           = [];
    _pumps             = [];
    _coolantPacks      = [];
    _soldiers          = [];
    _pumpsDisabled     = 0;
    _reactorActive     = true;
    _c4Planted         = false;
    _c4Timer           = 0;
    _ziplining         = false;
    _ziplineProgress   = 0;
    _coolantImmunity   = 0;
    _lavaChannelDmgTimer = 0;
    _keysDown          = {};
    _vPressTime        = -9999;
    _aPressTime        = -9999;

    _volcanoMesh       = null;
    _lavaLake          = null;
    _fog               = null;
    _ambientLight      = null;
    _entrance          = null;
    _weaponsLab        = null;
    _commandCenter     = null;
    _reactorRoom       = null;
    _reactor           = null;
    _ziplinePulley     = null;
    _extractionZone    = null;

    if (_hudEl) { _hudEl.style.display = 'none'; }
  }

  function dispose () {
    reset();
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
    if (_hudEl && _hudEl.parentNode) { _hudEl.parentNode.removeChild(_hudEl); _hudEl = null; }
    _disposed = true;
  }

  return {
    init:    init,
    update:  update,
    reset:   reset,
    dispose: dispose
  };

}());
