/* ───────────────────────────────────────────────────────────────────────────
   desert-ambush.js — Desert Ambush FPS Module
   API: window.DesertAmbush = { init, update, reset }
   Controls:
     D + A (simultaneously, within 400ms) → activate mission
     WASD                                  → move player
     Mouse                                 → look around
     Left-click / Space                    → shoot
     E (near wounded, hold 3s)             → apply tourniquet
     Sprint (Shift)                        → sprint (overheat after 20s)
   ─────────────────────────────────────────────────────────────────────────── */
window.DesertAmbush = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene    = null;
  var _camera   = null;
  var _canvas   = null;
  var _renderer = null;

  /* ── Activation (D+A within 400ms) ────────────────────────────────────── */
  var _dPressTime = 0;
  var _aPressTime = 0;
  var DA_WINDOW   = 0.4;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _active         = false;
  var _missionDone    = false;
  var _missionFailed  = false;
  var _failReason     = '';

  /* ── Timing ────────────────────────────────────────────────────────────── */
  var _lastTime       = 0;
  var _elapsed        = 0;   // total seconds since activation

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerPos      = null;   // THREE.Vector3
  var _playerHP       = 100;
  var _playerYaw      = 0;
  var _playerPitch    = 0;
  var _mouseDX        = 0;
  var _mouseDY        = 0;
  var _pointerLocked  = false;

  /* ── Sprint / Heat mechanic ────────────────────────────────────────────── */
  var _sprintTime     = 0;    // accumulated sprint seconds
  var SPRINT_MAX      = 20;   // overheat threshold (seconds)
  var _heatCooldown   = 0;    // countdown after overheat
  var HEAT_COOLDOWN   = 10;
  var _overheated     = false;
  var _canteens       = 3;    // found in wreckage (each resets sprint timer)
  var HEAT_LABEL      = ['COOL', 'HOT', 'CRITICAL'];

  /* ── Keys ──────────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── Waves ─────────────────────────────────────────────────────────────── */
  var _wave           = 0;   // 0 = not started, 1-3 = active, 4 = all clear
  var _waveStarted    = [false, false, false, false];
  var WAVE2_TIME      = 180; // 3 minutes
  var WAVE3_TIME      = 360; // 6 minutes

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  var _enemies        = [];  // { mesh, hp, maxHp, alive, pos, vel, type, fireTimer, inCover }
  var _technical      = null; // { mesh, gunMesh, hp, alive, pos }

  /* ── Mortar (wave 2) ───────────────────────────────────────────────────── */
  var _mortarGroup    = null;
  var _mortarAlive    = false;
  var _mortarSetupTime= 0;
  var MORTAR_DESTROY_WINDOW = 60;
  var _mortarStrikeTimer  = 15;
  var _mortarActive       = false;

  /* ── Sniper (wave 3) ───────────────────────────────────────────────────── */
  var _snipers        = [];  // { mesh, hp, alive, pos }

  /* ── Wounded teammates ─────────────────────────────────────────────────── */
  var _wounded        = [];  // { mesh, bleedTimer, stable, dead, pos, fireTimer }
  var BLEED_TIME      = 60;
  var _eKeyTimer      = 0;   // hold-E progress (3s)
  var _eTreating      = false;
  var _eTreatTarget   = -1;

  /* ── Extraction ────────────────────────────────────────────────────────── */
  var _extractionInbound  = false;
  var _extractionTimer    = 0;
  var EXTRACTION_TIME     = 60;
  var _extractionPos      = null;  // THREE.Vector3
  var _lzMesh             = null;

  /* ── Burned vehicle hulks ──────────────────────────────────────────────── */
  var _hulks          = [];  // { mesh, pos }

  /* ── Boulders / Dunes (cover) ──────────────────────────────────────────── */
  var _coverObjects   = [];  // { mesh, pos, type }  type: 'boulder'|'dune'|'tree'

  /* ── Canteen pickups ───────────────────────────────────────────────────── */
  var _canteenMeshes  = [];  // { mesh, pos, taken }

  /* ── Projectiles ───────────────────────────────────────────────────────── */
  var _bullets        = [];  // { mesh, vel, life, friendly }
  var _fireCooldown   = 0;
  var FIRE_RATE       = 0.12;

  /* ── Explosions ────────────────────────────────────────────────────────── */
  var _explosions     = [];  // { mesh, life, isLight }

  /* ── Mirage (5-min) ────────────────────────────────────────────────────── */
  var _mirageLight    = null;
  var _mirageActive   = false;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud            = null;
  var _overlayEl      = null;

  /* ── Saved scene state ─────────────────────────────────────────────────── */
  var _savedFog        = null;
  var _savedBackground = null;

  /* ── World containers ──────────────────────────────────────────────────── */
  var _worldRoot      = null;  // THREE.Group holding all desert objects

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function _makeMat(color, emissive, emInt) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive !== undefined) {
      mat.emissive = new THREE.Color(emissive);
      mat.emissiveIntensity = (emInt !== undefined) ? emInt : 0.35;
    }
    return mat;
  }

  function _box(w, h, d, color, x, y, z, emissive) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = _makeMat(color, emissive);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _cyl(rt, rb, h, segs, color, x, y, z) {
    var geo  = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat  = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _sph(r, segs, color, x, y, z) {
    var geo  = new THREE.SphereGeometry(r, segs, segs);
    var mat  = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _cone(r, h, segs, color, x, y, z) {
    var geo  = new THREE.ConeGeometry(r, h, segs);
    var mat  = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _vecToPlayer(from) {
    var dx = _playerPos.x - from.x;
    var dz = _playerPos.z - from.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    return { x: dx / len, z: dz / len };
  }

  function _spawnExplosion(x, y, z, size) {
    size = size || 1.5;
    var geo  = new THREE.BoxGeometry(size, size, size);
    var mat  = new THREE.MeshLambertMaterial({
      color: 0xFF4400,
      emissive: new THREE.Color(0xFF2200),
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 1
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + size * 0.5, z);
    _worldRoot.add(mesh);
    _explosions.push({ mesh: mesh, life: 0.7 });
    var light = new THREE.PointLight(0xFF4400, 4, size * 10);
    light.position.set(x, y + 1, z);
    _worldRoot.add(light);
    _explosions.push({ mesh: light, life: 0.5, isLight: true });
  }

  function _updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life -= dt;
      if (ex.isLight) {
        ex.mesh.intensity = Math.max(0, ex.life * 8);
      } else {
        ex.mesh.material.opacity = Math.max(0, ex.life / 0.7);
        var s = Math.max(0.01, ex.life / 0.7);
        ex.mesh.scale.setScalar(s + (1 - s) * 1.5);
      }
      if (ex.life <= 0) {
        _worldRoot.remove(ex.mesh);
        _explosions.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WORLD BUILDING
  ════════════════════════════════════════════════════════════════════════ */

  function _buildWorld() {
    _worldRoot = new THREE.Group();
    _scene.add(_worldRoot);

    /* Ambient + sun */
    var ambient = new THREE.AmbientLight(0xFFDDAA, 0.6);
    _worldRoot.add(ambient);
    var sun = new THREE.DirectionalLight(0xFFEE99, 1.2);
    sun.position.set(80, 120, -60);
    _worldRoot.add(sun);

    /* ── Sand plain ──────────────────────────────────────────────────────── */
    var plain = _box(600, 1, 600, 0x886633, 0, -0.5, 0);
    _worldRoot.add(plain);

    /* ── Rocky outcroppings (boulders as cover) ──────────────────────────── */
    var boulderData = [
      { x: -12, z: 8,  w: 4, h: 3, d: 3.5 },
      { x:  14, z: 5,  w: 5, h: 4, d: 3   },
      { x: -18, z: -6, w: 3, h: 2.5, d: 4 },
      { x:  20, z: -4, w: 4, h: 3.5, d: 3 },
      { x: -8,  z: 20, w: 3, h: 2, d: 3   },
      { x:  10, z: 22, w: 4, h: 3, d: 2.5 },
      { x: -15, z: 35, w: 5, h: 4, d: 4   },
      { x:  16, z: 32, w: 3, h: 3, d: 3   },
      { x: -5,  z: -15, w: 3.5, h: 2, d: 3},
      { x:  8,  z: -18, w: 4, h: 3, d: 3  }
    ];
    for (var bi = 0; bi < boulderData.length; bi++) {
      var bd = boulderData[bi];
      var bm = _box(bd.w, bd.h, bd.d, 0x775533, bd.x, bd.h * 0.5, bd.z);
      _worldRoot.add(bm);
      _coverObjects.push({ mesh: bm, pos: new THREE.Vector3(bd.x, 0, bd.z), type: 'boulder' });
    }

    /* ── Sand dunes (wedge shapes — tall boxes slightly rotated) ─────────── */
    var duneData = [
      { x: -30, z: 10,  w: 12, h: 5, d: 8, ry: 0.3  },
      { x:  32, z: 15,  w: 10, h: 4, d: 9, ry: -0.2 },
      { x: -25, z: 40,  w: 14, h: 6, d: 10, ry: 0.1 },
      { x:  28, z: 38,  w: 11, h: 5, d: 9, ry: -0.15},
      { x:   2, z: -20, w: 13, h: 5, d: 10, ry: 0.05}
    ];
    for (var di = 0; di < duneData.length; di++) {
      var dd = duneData[di];
      var dm = _box(dd.w, dd.h, dd.d, 0x997744, dd.x, dd.h * 0.5, dd.z);
      dm.rotation.y = dd.ry;
      _worldRoot.add(dm);
      _coverObjects.push({ mesh: dm, pos: new THREE.Vector3(dd.x, 0, dd.z), type: 'dune' });
    }

    /* ── Burned vehicle hulks (3) ────────────────────────────────────────── */
    var hulkPos = [
      { x: -4, z: 2  },
      { x:  2, z: -2 },
      { x:  6, z: 4  }
    ];
    for (var hi = 0; hi < hulkPos.length; hi++) {
      var hp = hulkPos[hi];
      var hbody = _box(5, 2, 2.5, 0x443322, hp.x, 1, hp.z);
      _worldRoot.add(hbody);
      /* Charred roof */
      var hroof = _box(4.5, 0.3, 2.2, 0x221111, hp.x, 2.15, hp.z);
      _worldRoot.add(hroof);
      /* Burning glow */
      var hfire = new THREE.PointLight(0xFF4400, 0.8, 5);
      hfire.position.set(hp.x, 1.5, hp.z);
      _worldRoot.add(hfire);
      _hulks.push({ mesh: hbody, pos: new THREE.Vector3(hp.x, 0, hp.z), fireLight: hfire });
    }

    /* ── Oasis (midpoint ~z=25) ──────────────────────────────────────────── */
    var oasisX = -2, oasisZ = 25;
    /* Water pool */
    var pool = _box(6, 0.2, 4, 0x224466, oasisX, 0.1, oasisZ);
    _worldRoot.add(pool);
    /* Palm trees */
    var palmPos = [
      { x: oasisX - 3, z: oasisZ + 2 },
      { x: oasisX + 3, z: oasisZ - 1 },
      { x: oasisX,     z: oasisZ + 3 }
    ];
    for (var pi = 0; pi < palmPos.length; pi++) {
      var pp = palmPos[pi];
      var trunk = _cyl(0.2, 0.3, 5, 6, 0x8B6914, pp.x, 2.5, pp.z);
      _worldRoot.add(trunk);
      var top = _sph(1.8, 6, 0x336622, pp.x, 5.5, pp.z);
      _worldRoot.add(top);
      _coverObjects.push({ mesh: top, pos: new THREE.Vector3(pp.x, 0, pp.z), type: 'tree' });
    }

    /* ── Extraction LZ (north, z=60) ────────────────────────────────────── */
    _extractionPos = new THREE.Vector3(0, 0, 60);
    _lzMesh = _box(20, 0.15, 20, 0x556644, 0, 0.05, 60);
    _worldRoot.add(_lzMesh);
    /* Landing markers (LineSegments) */
    var lzCorners = [
      -8, 0.2, 52,   -8, 0.2, 68,
      -8, 0.2, 68,    8, 0.2, 68,
       8, 0.2, 68,    8, 0.2, 52,
       8, 0.2, 52,   -8, 0.2, 52,
      /* X markers */
      -4, 0.2, 58,    4, 0.2, 62,
       4, 0.2, 58,   -4, 0.2, 62
    ];
    var lzGeo  = new THREE.BufferGeometry();
    var lzVerts = new Float32Array(lzCorners);
    lzGeo.setAttribute('position', new THREE.BufferAttribute(lzVerts, 3));
    var lzLines = new THREE.LineSegments(lzGeo, new THREE.LineBasicMaterial({ color: 0xFFFF00 }));
    _worldRoot.add(lzLines);

    /* ── Canteen pickups in wreckage ─────────────────────────────────────── */
    var canteenPos = [
      { x: -6, z: 0  },
      { x:  4, z: -3 },
      { x:  8, z: 5  }
    ];
    for (var ci = 0; ci < canteenPos.length; ci++) {
      var cp = canteenPos[ci];
      var cm = _box(0.4, 0.6, 0.25, 0x228844, cp.x, 0.5, cp.z);
      _worldRoot.add(cm);
      _canteenMeshes.push({ mesh: cm, pos: new THREE.Vector3(cp.x, 0, cp.z), taken: false });
    }

    /* ── Mirage light ────────────────────────────────────────────────────── */
    _mirageLight = new THREE.PointLight(0xFFEE88, 0, 40);
    _mirageLight.position.set(30, 1, 50);
    _worldRoot.add(_mirageLight);
  }

  /* ════════════════════════════════════════════════════════════════════════
     WOUNDED TEAMMATES
  ════════════════════════════════════════════════════════════════════════ */

  function _spawnWounded() {
    var wPos = [
      { x: -3, z: 3   },
      { x:  5, z: -1  },
      { x: -7, z: 0   },
      { x:  3, z: 5   }
    ];
    for (var wi = 0; wi < wPos.length; wi++) {
      var wp = wPos[wi];
      var wm = _box(0.7, 0.5, 1.6, 0x445544, wp.x, 0.25, wp.z);
      _worldRoot.add(wm);
      _wounded.push({
        mesh:       wm,
        bleedTimer: BLEED_TIME,
        stable:     false,
        dead:       false,
        pos:        new THREE.Vector3(wp.x, 0, wp.z),
        fireTimer:  3 + Math.random() * 2
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY SPAWNING
  ════════════════════════════════════════════════════════════════════════ */

  function _spawnEnemy(x, z, hp, type) {
    var color = (type === 'elite') ? 0x553311 : 0x663322;
    var em = _box(0.8, 1.8, 0.8, color, x, 0.9, z);
    /* head */
    var head = _box(0.6, 0.6, 0.6, color, 0, 1.2, 0);
    em.add(head);
    _worldRoot.add(em);
    _enemies.push({
      mesh:      em,
      hp:        hp,
      maxHp:     hp,
      alive:     true,
      pos:       new THREE.Vector3(x, 0, z),
      vel:       new THREE.Vector3(0, 0, 0),
      type:      type || 'normal',
      fireTimer: 1.5 + Math.random() * 2.5,
      inCover:   false
    });
  }

  function _spawnWave1() {
    /* 15 fighters from east + west */
    for (var ei = 0; ei < 8; ei++) {
      _spawnEnemy(-50 + (Math.random() - 0.5) * 10, -15 + ei * 5, 70, 'normal');
    }
    for (var ei2 = 0; ei2 < 7; ei2++) {
      _spawnEnemy(50 + (Math.random() - 0.5) * 10, -10 + ei2 * 5, 70, 'normal');
    }
    /* Technical vehicle */
    var truckBody = _box(5, 2, 2.5, 0x664422, -45, 1, 0);
    _worldRoot.add(truckBody);
    var gunMount = _cyl(0.3, 0.3, 1.5, 6, 0x333333, -45, 2.8, 0);
    _worldRoot.add(gunMount);
    var gunBarrel = _box(0.2, 0.2, 1.2, 0x222222, -45, 2.8, -1.2);
    _worldRoot.add(gunBarrel);
    _technical = {
      mesh:    truckBody,
      gunMesh: gunMount,
      hp:      200,
      alive:   true,
      pos:     new THREE.Vector3(-45, 0, 0),
      fireTimer: 2.5
    };
  }

  function _spawnWave2() {
    /* 20 fighters from north */
    for (var ei = 0; ei < 20; ei++) {
      _spawnEnemy(-30 + ei * 3, 100, 70, 'normal');
    }
    /* Mortar team */
    var mortarBase = _box(1.5, 0.5, 1.5, 0x555555, 15, 0.25, 70);
    _worldRoot.add(mortarBase);
    var mortarTube = _cyl(0.15, 0.2, 1.2, 6, 0x444444, 15, 1.1, 70);
    mortarTube.rotation.z = 0.5;
    _worldRoot.add(mortarTube);
    _mortarGroup = { base: mortarBase, tube: mortarTube };
    _mortarAlive = true;
    _mortarSetupTime = _elapsed;
    _mortarActive = false;
    /* Mortar crew */
    for (var mc = 0; mc < 3; mc++) {
      _spawnEnemy(13 + mc * 2, 70, 70, 'normal');
    }
  }

  function _spawnWave3() {
    /* 12 elite fighters */
    for (var ei = 0; ei < 12; ei++) {
      var angle = (ei / 12) * Math.PI * 2;
      _spawnEnemy(Math.cos(angle) * 55, Math.sin(angle) * 55 + 30, 100, 'elite');
    }
    /* Sniper team on dune */
    for (var si = 0; si < 2; si++) {
      var sx = -28 + si * 4, sz = 38;
      var sm = _box(0.7, 1.8, 0.7, 0x554422, sx, 5.9, sz);
      _worldRoot.add(sm);
      _snipers.push({ mesh: sm, hp: 80, alive: true, pos: new THREE.Vector3(sx, 5, sz), fireTimer: 3 + Math.random() * 2 });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING
  ════════════════════════════════════════════════════════════════════════ */

  function _shootPlayer() {
    if (_fireCooldown > 0) return;
    _fireCooldown = FIRE_RATE;

    /* Direction from camera yaw/pitch */
    var dx = -Math.sin(_playerYaw) * Math.cos(_playerPitch);
    var dy = Math.sin(_playerPitch);
    var dz = -Math.cos(_playerYaw) * Math.cos(_playerPitch);

    var geo  = new THREE.BoxGeometry(0.08, 0.08, 0.5);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFFFF88, emissive: new THREE.Color(0xFFAA00), emissiveIntensity: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(_playerPos.x + dx, _playerPos.y + 1.5 + dy, _playerPos.z + dz);
    _worldRoot.add(mesh);
    _bullets.push({ mesh: mesh, vel: new THREE.Vector3(dx * 80, dy * 80, dz * 80), life: 1.5, friendly: true });
  }

  function _shootEnemy(from, targetPos) {
    var dx = targetPos.x - from.x;
    var dy = 1.5;
    var dz = targetPos.z - from.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    dx /= len; dz /= len;

    var geo  = new THREE.BoxGeometry(0.06, 0.06, 0.4);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: new THREE.Color(0xFF2200), emissiveIntensity: 0.8 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(from.x + dx, from.y + 1.4, from.z + dz);
    _worldRoot.add(mesh);
    _bullets.push({ mesh: mesh, vel: new THREE.Vector3(dx * 50, 0, dz * 50), life: 2, friendly: false });
  }

  function _updateBullets(dt) {
    for (var i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;

      if (b.life <= 0) {
        _worldRoot.remove(b.mesh);
        _bullets.splice(i, 1);
        continue;
      }

      if (b.friendly) {
        /* Check enemy hits */
        for (var ei = 0; ei < _enemies.length; ei++) {
          var en = _enemies[ei];
          if (!en.alive) continue;
          if (_dist3(b.mesh.position, en.pos) < 1.2) {
            en.hp -= 25;
            _worldRoot.remove(b.mesh);
            _bullets.splice(i, 1);
            if (en.hp <= 0) {
              en.alive = false;
              _worldRoot.remove(en.mesh);
              _spawnExplosion(en.pos.x, 0.5, en.pos.z, 0.8);
            }
            break;
          }
        }
        /* Check technical */
        if (_technical && _technical.alive && i < _bullets.length) {
          if (_dist3(b.mesh.position, _technical.pos) < 4) {
            _technical.hp -= 20;
            _worldRoot.remove(b.mesh);
            _bullets.splice(i, 1);
            if (_technical.hp <= 0) {
              _technical.alive = false;
              _worldRoot.remove(_technical.mesh);
              _worldRoot.remove(_technical.gunMesh);
              _spawnExplosion(_technical.pos.x, 1, _technical.pos.z, 3);
            }
          }
        }
        /* Check mortar */
        if (_mortarAlive && _mortarGroup && i < _bullets.length) {
          var mortarPos = _mortarGroup.base.position;
          if (_dist3(b.mesh.position, mortarPos) < 2) {
            _worldRoot.remove(b.mesh);
            _bullets.splice(i, 1);
            _mortarAlive = false;
            _mortarActive = false;
            _worldRoot.remove(_mortarGroup.base);
            _worldRoot.remove(_mortarGroup.tube);
            _mortarGroup = null;
            _spawnExplosion(mortarPos.x, 0.5, mortarPos.z, 2);
          }
        }
        /* Check snipers */
        for (var si = 0; si < _snipers.length; si++) {
          var sn = _snipers[si];
          if (!sn.alive || i >= _bullets.length) continue;
          if (_dist3(b.mesh.position, sn.pos) < 1) {
            sn.hp -= 30;
            _worldRoot.remove(b.mesh);
            _bullets.splice(i, 1);
            if (sn.hp <= 0) {
              sn.alive = false;
              _worldRoot.remove(sn.mesh);
            }
            break;
          }
        }
      } else {
        /* Enemy bullet hitting player */
        if (_dist3(b.mesh.position, _playerPos) < 1.2) {
          var dmg = 8;
          /* Cover reduces damage */
          if (_isPlayerInCover()) dmg = 4;
          _playerHP -= dmg;
          _worldRoot.remove(b.mesh);
          _bullets.splice(i, 1);
          if (_playerHP <= 0) {
            _playerHP = 0;
            _doMissionFailed('KIA — player eliminated');
          }
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     COVER CHECK
  ════════════════════════════════════════════════════════════════════════ */

  function _isPlayerInCover() {
    for (var ci = 0; ci < _coverObjects.length; ci++) {
      if (_dist2(_playerPos.x, _playerPos.z, _coverObjects[ci].pos.x, _coverObjects[ci].pos.z) < 4) return true;
    }
    for (var hi = 0; hi < _hulks.length; hi++) {
      if (_dist2(_playerPos.x, _playerPos.z, _hulks[hi].pos.x, _hulks[hi].pos.z) < 4) return true;
    }
    return false;
  }

  function _isEnemyInCover(en) {
    for (var ci = 0; ci < _coverObjects.length; ci++) {
      if (_dist2(en.pos.x, en.pos.z, _coverObjects[ci].pos.x, _coverObjects[ci].pos.z) < 3) {
        en.inCover = true;
        return true;
      }
    }
    en.inCover = false;
    return false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY AI UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function _updateEnemies(dt) {
    var playerVec3 = _playerPos;
    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive) continue;

      var distToPlayer = _dist2(en.pos.x, en.pos.z, _playerPos.x, _playerPos.z);
      var inCov = _isEnemyInCover(en);

      /* Move toward player if far */
      if (distToPlayer > 8) {
        var dir = _vecToPlayer(en.pos);
        var speed = (en.type === 'elite') ? 4.5 : 3.5;
        en.pos.x += dir.x * speed * dt;
        en.pos.z += dir.z * speed * dt;
        en.mesh.position.set(en.pos.x, 0.9, en.pos.z);
        /* Face player */
        en.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      }

      /* Fire at player */
      en.fireTimer -= dt;
      if (en.fireTimer <= 0 && distToPlayer < 40) {
        en.fireTimer = 1.5 + Math.random() * 2;
        /* Accuracy penalty in cover */
        var accuracy = inCov ? 0.5 : 1.0;
        if (_isPlayerInCover()) accuracy *= 0.5;
        if (Math.random() < accuracy) {
          _shootEnemy(en.pos, playerVec3);
        }
      }

      /* Stable teammates provide suppressive fire on nearby enemies */
      for (var wi = 0; wi < _wounded.length; wi++) {
        var wd = _wounded[wi];
        if (!wd.stable || wd.dead) continue;
        wd.fireTimer -= dt;
        if (wd.fireTimer <= 0 && distToPlayer < 20) {
          wd.fireTimer = 2 + Math.random() * 3;
          /* Suppressive: chance to damage nearby enemies */
          if (_dist2(en.pos.x, en.pos.z, wd.pos.x, wd.pos.z) < 20 && Math.random() < 0.3) {
            en.hp -= 10;
            if (en.hp <= 0) {
              en.alive = false;
              _worldRoot.remove(en.mesh);
            }
          }
        }
      }
    }

    /* Technical AI */
    if (_technical && _technical.alive) {
      _technical.fireTimer -= dt;
      if (_technical.fireTimer <= 0) {
        _technical.fireTimer = 2;
        /* Move toward player slowly */
        var dir2 = _vecToPlayer(_technical.pos);
        _technical.pos.x += dir2.x * 3 * dt;
        _technical.pos.z += dir2.z * 3 * dt;
        _technical.mesh.position.set(_technical.pos.x, 1, _technical.pos.z);
        _technical.gunMesh.position.set(_technical.pos.x, 2.8, _technical.pos.z);
        /* Fire burst */
        _shootEnemy(_technical.pos, playerVec3);
        _shootEnemy(_technical.pos, playerVec3);
      }
    }

    /* Sniper AI */
    for (var si = 0; si < _snipers.length; si++) {
      var sn = _snipers[si];
      if (!sn.alive) continue;
      sn.fireTimer -= dt;
      if (sn.fireTimer <= 0) {
        sn.fireTimer = 3 + Math.random() * 3;
        /* High-damage sniper shot */
        var geo  = new THREE.BoxGeometry(0.05, 0.05, 0.6);
        var mat  = new THREE.MeshLambertMaterial({ color: 0xFF8800, emissive: new THREE.Color(0xFF6600), emissiveIntensity: 1 });
        var mesh = new THREE.Mesh(geo, mat);
        var dir3 = _vecToPlayer(sn.pos);
        mesh.position.set(sn.pos.x + dir3.x, sn.pos.y + 1.5, sn.pos.z + dir3.z);
        _worldRoot.add(mesh);
        _bullets.push({ mesh: mesh, vel: new THREE.Vector3(dir3.x * 100, 0, dir3.z * 100), life: 3, friendly: false, sniper: true });
      }
    }

    /* Hull fire damage to player */
    for (var hi = 0; hi < _hulks.length; hi++) {
      if (_dist2(_playerPos.x, _playerPos.z, _hulks[hi].pos.x, _hulks[hi].pos.z) < 2.5) {
        _playerHP -= 2 * dt;
        if (_playerHP <= 0) _doMissionFailed('Burned alive by hulk fire');
      }
      /* Flicker hull fire lights */
      _hulks[hi].fireLight.intensity = 0.5 + 0.5 * Math.sin(_elapsed * 7 + hi * 2.3);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MORTAR STRIKE
  ════════════════════════════════════════════════════════════════════════ */

  function _updateMortar(dt) {
    if (!_mortarAlive) return;
    /* After 60s of setup the mortar becomes active */
    if (!_mortarActive && (_elapsed - _mortarSetupTime) > MORTAR_DESTROY_WINDOW) {
      _mortarActive = true;
    }
    if (_mortarActive) {
      _mortarStrikeTimer -= dt;
      if (_mortarStrikeTimer <= 0) {
        _mortarStrikeTimer = 15;
        /* Area mortar strike — land near player */
        var tx = _playerPos.x + (Math.random() - 0.5) * 8;
        var tz = _playerPos.z + (Math.random() - 0.5) * 8;
        _spawnExplosion(tx, 0, tz, 2);
        /* 5 HP area damage if close */
        if (_dist2(_playerPos.x, _playerPos.z, tx, tz) < 5) {
          _playerHP -= 5;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WAVE MANAGEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function _countAliveEnemies() {
    var cnt = 0;
    for (var i = 0; i < _enemies.length; i++) {
      if (_enemies[i].alive) cnt++;
    }
    if (_technical && _technical.alive) cnt++;
    for (var si = 0; si < _snipers.length; si++) {
      if (_snipers[si].alive) cnt++;
    }
    if (_mortarAlive) cnt += 3;
    return cnt;
  }

  function _updateWaves() {
    /* Wave 1 — immediate on activation */
    if (_wave === 0) {
      _wave = 1;
      _waveStarted[1] = true;
      _spawnWave1();
    }

    /* Wave 2 — 3 minutes */
    if (_wave === 1 && !_waveStarted[2] && _elapsed >= WAVE2_TIME) {
      _waveStarted[2] = true;
      _spawnWave2();
      _wave = 2;
    }

    /* Wave 3 — 6 minutes */
    if (_wave === 2 && !_waveStarted[3] && _elapsed >= WAVE3_TIME) {
      _waveStarted[3] = true;
      _spawnWave3();
      _wave = 3;
    }

    /* Advance wave when enemies cleared */
    if (_wave === 1 && _countAliveEnemies() === 0 && _elapsed < WAVE2_TIME) {
      /* Early clear — bump time to wave 2 threshold */
    }
    if (_wave === 3 && _countAliveEnemies() === 0 && !_extractionInbound) {
      _extractionInbound = true;
      _extractionTimer = EXTRACTION_TIME;
      _updateHUD();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WOUNDED / TRIAGE
  ════════════════════════════════════════════════════════════════════════ */

  function _updateWounded(dt) {
    var allDead = true;
    for (var wi = 0; wi < _wounded.length; wi++) {
      var wd = _wounded[wi];
      if (wd.dead) continue;
      if (wd.stable) { allDead = false; continue; }
      allDead = false;
      wd.bleedTimer -= dt;
      if (wd.bleedTimer <= 0) {
        wd.dead = true;
        wd.bleedTimer = 0;
        wd.mesh.material.color.setHex(0x221111);
      }
    }

    /* Check all-dead condition */
    var deadCount = 0;
    for (var wi2 = 0; wi2 < _wounded.length; wi2++) {
      if (_wounded[wi2].dead) deadCount++;
    }
    if (deadCount >= 4) {
      _doMissionFailed('All teammates KIA — mission failed');
    }
  }

  function _countStableTeammates() {
    var cnt = 0;
    for (var wi = 0; wi < _wounded.length; wi++) {
      if (_wounded[wi].stable && !_wounded[wi].dead) cnt++;
    }
    return cnt;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INTERACTION (E key / tourniquet)
  ════════════════════════════════════════════════════════════════════════ */

  function _updateInteraction(dt) {
    if (!_keys['KeyE']) {
      _eTreating = false;
      _eTreatTarget = -1;
      _eKeyTimer = 0;
      return;
    }

    /* Find nearest wounded in range */
    if (!_eTreating) {
      var bestDist = 3.5, bestIdx = -1;
      for (var wi = 0; wi < _wounded.length; wi++) {
        if (_wounded[wi].stable || _wounded[wi].dead) continue;
        var d = _dist2(_playerPos.x, _playerPos.z, _wounded[wi].pos.x, _wounded[wi].pos.z);
        if (d < bestDist) { bestDist = d; bestIdx = wi; }
      }
      if (bestIdx >= 0) {
        _eTreating = true;
        _eTreatTarget = bestIdx;
        _eKeyTimer = 0;
      }
    }

    if (_eTreating && _eTreatTarget >= 0) {
      /* Verify still in range */
      var wd = _wounded[_eTreatTarget];
      var dd = _dist2(_playerPos.x, _playerPos.z, wd.pos.x, wd.pos.z);
      if (dd > 4) { _eTreating = false; _eKeyTimer = 0; return; }
      _eKeyTimer += dt;
      if (_eKeyTimer >= 3) {
        wd.stable = true;
        wd.bleedTimer = BLEED_TIME;
        wd.mesh.material.color.setHex(0x448866);
        _eTreating = false;
        _eTreatTarget = -1;
        _eKeyTimer = 0;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CANTEEN PICKUP
  ════════════════════════════════════════════════════════════════════════ */

  function _updateCanteens() {
    for (var ci = 0; ci < _canteenMeshes.length; ci++) {
      var c = _canteenMeshes[ci];
      if (c.taken) continue;
      if (_dist2(_playerPos.x, _playerPos.z, c.pos.x, c.pos.z) < 1.5) {
        c.taken = true;
        _worldRoot.remove(c.mesh);
        _sprintTime = 0;
        _overheated = false;
        _heatCooldown = 0;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HEAT / SPRINT MECHANIC
  ════════════════════════════════════════════════════════════════════════ */

  function _updateHeat(dt) {
    var sprinting = _keys['ShiftLeft'] || _keys['ShiftRight'];
    if (_overheated) {
      _heatCooldown -= dt;
      if (_heatCooldown <= 0) {
        _overheated = false;
        _sprintTime = 0;
        _heatCooldown = 0;
      }
      return;
    }
    if (sprinting) {
      _sprintTime += dt;
      if (_sprintTime >= SPRINT_MAX) {
        _overheated = true;
        _heatCooldown = HEAT_COOLDOWN;
      }
    } else {
      _sprintTime = Math.max(0, _sprintTime - dt * 0.5);
    }
  }

  function _heatLabel() {
    if (_overheated) return 'CRITICAL';
    if (_sprintTime > SPRINT_MAX * 0.6) return 'HOT';
    return 'COOL';
  }

  /* ════════════════════════════════════════════════════════════════════════
     MIRAGE EFFECT
  ════════════════════════════════════════════════════════════════════════ */

  function _updateMirage(dt) {
    if (_elapsed >= 300 && !_mirageActive) {
      _mirageActive = true;
    }
    if (_mirageActive && _mirageLight) {
      _mirageLight.intensity = 0.3 + 0.5 * Math.abs(Math.sin(_elapsed * 3.7)) + 0.3 * Math.abs(Math.sin(_elapsed * 7.1));
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function _updatePlayer(dt) {
    var sprinting = (_keys['ShiftLeft'] || _keys['ShiftRight']) && !_overheated;
    var speed = sprinting ? 10 : 5.5;

    /* Mouse look */
    _playerYaw   -= _mouseDX * 0.002;
    _playerPitch -= _mouseDY * 0.002;
    _playerPitch  = Math.max(-1.1, Math.min(1.1, _playerPitch));
    _mouseDX = 0; _mouseDY = 0;

    /* WASD movement in yaw direction */
    var fwd = 0, strafe = 0;
    if (_keys['KeyW']) fwd    =  1;
    if (_keys['KeyS']) fwd    = -1;
    if (_keys['KeyA']) strafe = -1;
    if (_keys['KeyD']) strafe =  1;

    var sinY = Math.sin(_playerYaw);
    var cosY = Math.cos(_playerYaw);
    _playerPos.x += (fwd * (-sinY) + strafe * cosY) * speed * dt;
    _playerPos.z += (fwd * (-cosY) + strafe * (-sinY)) * speed * dt;

    /* Clamp to desert bounds */
    _playerPos.x = Math.max(-180, Math.min(180, _playerPos.x));
    _playerPos.z = Math.max(-80, Math.min(75, _playerPos.z));

    /* Update camera */
    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y + 1.7, _playerPos.z);
      _camera.rotation.order = 'YXZ';
      _camera.rotation.y = _playerYaw;
      _camera.rotation.x = _playerPitch;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXTRACTION CHECK
  ════════════════════════════════════════════════════════════════════════ */

  function _updateExtraction(dt) {
    if (!_extractionInbound) return;
    _extractionTimer -= dt;
    if (_extractionTimer <= 0) {
      _doMissionFailed('Extraction window expired — helicopter left');
      return;
    }
    /* Check player reached LZ */
    if (_dist2(_playerPos.x, _playerPos.z, _extractionPos.x, _extractionPos.z) < 12) {
      var stableCount = _countStableTeammates();
      if (stableCount >= 2) {
        _doMissionSuccess();
      } else {
        _doMissionFailed('Insufficient teammates stabilized (need 2)');
      }
    }
    /* Flash LZ */
    if (_lzMesh) {
      _lzMesh.material.emissive = _lzMesh.material.emissive || new THREE.Color();
      _lzMesh.material.emissive.setHex(0x88FF44);
      _lzMesh.material.emissiveIntensity = 0.3 + 0.3 * Math.abs(Math.sin(_elapsed * 4));
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ════════════════════════════════════════════════════════════════════════ */

  function _doMissionSuccess() {
    _missionDone = true;
    _active = false;
    _showOverlay('MISSION COMPLETE\nConvoy survivors extracted.\nTeammates saved: ' + _countStableTeammates() + '/4', '#00FF88');
    _unlockPointer();
  }

  function _doMissionFailed(reason) {
    _missionFailed = true;
    _failReason = reason || 'Mission failed';
    _active = false;
    _showOverlay('MISSION FAILED\n' + _failReason, '#FF4444');
    _unlockPointer();
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'desert-ambush-hud';
    _hud.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.6)', 'color:#FFE066', 'font-family:monospace',
      'font-size:13px', 'padding:6px 14px', 'border:1px solid #664400',
      'border-radius:4px', 'pointer-events:none', 'z-index:9999',
      'white-space:nowrap', 'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hud);

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'desert-ambush-overlay';
    _overlayEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'display:none', 'align-items:center', 'justify-content:center',
      'background:rgba(0,0,0,0.7)', 'color:#FFF', 'font-family:monospace',
      'font-size:22px', 'text-align:center', 'white-space:pre-line',
      'pointer-events:none', 'z-index:10000'
    ].join(';');
    document.body.appendChild(_overlayEl);
  }

  function _updateHUD() {
    if (!_hud) return;
    var wave      = Math.min(_wave, 3);
    var stableN   = _countStableTeammates();
    var aliveN    = _countAliveEnemies();
    var heatStr   = _heatLabel();
    var extStr    = _extractionInbound ? Math.ceil(_extractionTimer) + 's' : 'STANDBY';
    _hud.textContent = 'DESERT AMBUSH  [WAVE: ' + wave + '/3]  [TEAMMATES: ' + stableN + '/4 STABLE]  [EXTRACTION: ' + extStr + ']  [ENEMIES: ' + aliveN + ']  [HEAT: ' + heatStr + ']  [HP: ' + Math.ceil(Math.max(0, _playerHP)) + ']';
  }

  function _showOverlay(msg, color) {
    if (!_overlayEl) return;
    _overlayEl.style.display = 'flex';
    _overlayEl.style.color = color || '#FFF';
    _overlayEl.textContent = msg;
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) _hud.parentNode.removeChild(_hud);
    _hud = null;
    if (_overlayEl && _overlayEl.parentNode) _overlayEl.parentNode.removeChild(_overlayEl);
    _overlayEl = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     POINTER LOCK
  ════════════════════════════════════════════════════════════════════════ */

  function _lockPointer() {
    if (_canvas && _canvas.requestPointerLock) {
      _canvas.requestPointerLock();
    }
  }

  function _unlockPointer() {
    if (document.exitPointerLock) document.exitPointerLock();
    _pointerLocked = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     EVENT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.code] = true;

    /* D+A simultaneous activation */
    if (e.code === 'KeyD') _dPressTime = performance.now() / 1000;
    if (e.code === 'KeyA') _aPressTime = performance.now() / 1000;
    if (!_active && !_missionDone && !_missionFailed) {
      if (e.code === 'KeyA' && Math.abs(_aPressTime - _dPressTime) <= DA_WINDOW) _tryActivate();
      if (e.code === 'KeyD' && Math.abs(_dPressTime - _aPressTime) <= DA_WINDOW) _tryActivate();
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _onMouseMove(e) {
    if (!_pointerLocked) return;
    _mouseDX += e.movementX || 0;
    _mouseDY += e.movementY || 0;
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) _shootPlayer();
    if (!_pointerLocked) _lockPointer();
  }

  function _onPointerLockChange() {
    _pointerLocked = (document.pointerLockElement === _canvas);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION
  ════════════════════════════════════════════════════════════════════════ */

  function _tryActivate() {
    if (_active || _missionDone || _missionFailed) return;
    _active = true;
    _elapsed = 0;
    _lastTime = performance.now() / 1000;

    /* Save and override scene */
    _savedFog        = _scene.fog;
    _savedBackground = _scene.background;
    _scene.fog        = new THREE.FogExp2(0xDDCC99, 0.004);
    _scene.background = new THREE.Color(0xDDCC99);

    /* Player start position — in the convoy area */
    _playerPos = new THREE.Vector3(0, 0, 0);
    _playerHP  = 100;
    _playerYaw = 0;

    /* Build world */
    _buildWorld();
    _spawnWounded();
    _buildHUD();
    _lockPointer();

    /* IED hit flash — immediate ambush event */
    _spawnExplosion(-4, 0, -1, 3);
    _spawnExplosion(5,  0,  3, 2.5);
    _spawnExplosion(2,  0, -3, 2);

    _updateWaves(); // starts wave 1
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, renderer) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;
    _canvas   = renderer ? renderer.domElement : document.querySelector('canvas');

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('pointerlockchange', _onPointerLockChange);
  }

  function update(time) {
    if (!_active) return;

    var now = time || (performance.now() / 1000);
    var dt  = Math.min(now - _lastTime, 0.05);
    _lastTime = now;
    _elapsed += dt;

    _updatePlayer(dt);
    _updateHeat(dt);
    _updateWaves();
    _updateEnemies(dt);
    _updateBullets(dt);
    _updateExplosions(dt);
    _updateWounded(dt);
    _updateInteraction(dt);
    _updateMortar(dt);
    _updateCanteens();
    _updateExtraction(dt);
    _updateMirage(dt);

    /* Space bar shoot */
    if (_keys['Space'] && _fireCooldown <= 0) _shootPlayer();
    _fireCooldown = Math.max(0, _fireCooldown - dt);

    _updateHUD();
  }

  function reset() {
    _active        = false;
    _missionDone   = false;
    _missionFailed = false;

    /* Restore scene */
    if (_scene) {
      if (_savedFog !== undefined) _scene.fog = _savedFog;
      if (_savedBackground !== undefined) _scene.background = _savedBackground;
    }

    /* Remove world */
    if (_worldRoot && _scene) {
      _scene.remove(_worldRoot);
      _worldRoot = null;
    }

    /* Clear state */
    _enemies        = [];
    _bullets        = [];
    _explosions     = [];
    _wounded        = [];
    _hulks          = [];
    _coverObjects   = [];
    _canteenMeshes  = [];
    _snipers        = [];
    _technical      = null;
    _mortarGroup    = null;
    _mortarAlive    = false;
    _mortarActive   = false;
    _extractionInbound = false;
    _extractionTimer   = 0;
    _wave              = 0;
    _waveStarted       = [false, false, false, false];
    _sprintTime        = 0;
    _overheated        = false;
    _heatCooldown      = 0;
    _elapsed           = 0;
    _keys              = {};
    _mouseDX           = 0;
    _mouseDY           = 0;
    _dPressTime        = 0;
    _aPressTime        = 0;
    _playerPos         = null;
    _playerHP          = 100;
    _mirageActive      = false;
    _eTreating         = false;
    _eTreatTarget      = -1;
    _eKeyTimer         = 0;
    _fireCooldown      = 0;

    _removeHUD();
    _unlockPointer();
  }

  return { init: init, update: update, reset: reset };

}());
